import { describe, it, expect } from 'vitest';
import { DeterministicQueryClassifier } from '../../lib/query-understanding/classifier';
import { EntityExtractor } from '../../lib/query-understanding/extractors';
import { runAgentWorkflow } from '../../lib/agent/graph';

describe('Chatbot Accuracy & Query Understanding Tests', () => {
  const facultyContext = { role: 'FACULTY' as const, userId: 'usr-1' };

  it('should not treat stop words (who, has, overall, absentees) as student names', () => {
    const query = 'WHO HAS PENDING FEES?';
    const entities = EntityExtractor.extractAll(query.toLowerCase());
    expect(entities.studentName).toBeUndefined();

    const classified = DeterministicQueryClassifier.classify(query);
    expect(classified.intent).toBe('PENDING_FEES');
    expect(classified.studentName).toBeUndefined();
  });

  it('should recognize MCA-A OVERALL ABSENTEES as class attendance/absentee intent without a student name', () => {
    const query = 'MCA-A OVERALL ABSENTEES';
    const entities = EntityExtractor.extractAll(query.toLowerCase());
    expect(entities.classId).toBe('MCA-A');
    expect(entities.studentName).toBeUndefined();

    const classified = DeterministicQueryClassifier.classify(query);
    expect(['ATTENDANCE_CLASS', 'LOW_ATTENDANCE']).toContain(classified.intent);
    expect(classified.classId).toBe('MCA-A');
    expect(classified.studentName).toBeUndefined();
  });

  it('should prioritize exact student code lookup (MCA23003, BCA23037, GENAI23027)', async () => {
    const res1 = await runAgentWorkflow('MCA23003', facultyContext);
    expect(res1.type).toBe('TEXT');
    expect(res1.content).toContain('Rashmi Bhatia');
    expect(res1.content).toContain('MCA23003');

    const res2 = await runAgentWorkflow('BCA23037', facultyContext);
    expect(res2.type).toBe('TEXT');
    expect(res2.content).toContain('Monika Mukherjee');
    expect(res2.content).toContain('BCA23037');

    const res3 = await runAgentWorkflow('GENAI23027', facultyContext);
    expect(res3.type).toBe('TEXT');
    expect(res3.content).toContain('Rahul Singh');
    expect(res3.content).toContain('GENAI23027');
    expect(res3.content).not.toContain('Akash Kapoor');
  });

  it('should retrieve accurate student details, fees, and attendance for GENAI23027 (Rahul Singh)', async () => {
    const detailsRes = await runAgentWorkflow('DETAILS GENAI23027', facultyContext);
    expect(detailsRes.content).toContain('Rahul Singh');
    expect(detailsRes.content).toContain('GENAI23027');
    expect(detailsRes.content).not.toContain('Akash Kapoor');

    const feeRes = await runAgentWorkflow('FEE DETAILS GENAI23027', facultyContext);
    expect(feeRes.content).toContain('Rahul Singh');
    expect(feeRes.content).toContain('GENAI23027');
    expect(feeRes.content).toContain('Fee status');

    const attRes = await runAgentWorkflow('ATTENDANCE GENAI23027', facultyContext);
    expect(attRes.content).toContain('Rahul Singh');
    expect(attRes.content).toContain('GENAI23027');
    expect(attRes.content).toContain('Attendance');
  });

  it('should perform fresh lookup for subsequent queries without stale state (MCA23003 then GENAI23027)', async () => {
    const query1 = await runAgentWorkflow('MCA23003', facultyContext);
    expect(query1.content).toContain('Rashmi Bhatia');

    const query2 = await runAgentWorkflow('GENAI23027', facultyContext);
    expect(query2.content).toContain('Rahul Singh');
    expect(query2.content).not.toContain('Rashmi Bhatia');
  });

  it('should return complete student details with all available database fields', async () => {
    const res = await runAgentWorkflow('MCA23003 DETAILS', facultyContext);
    expect(res.type).toBe('TEXT');
    expect(res.content).toContain('Rashmi Bhatia');
    expect(res.content).toContain('Department');
    expect(res.content).toContain('Class');
    expect(res.content).toContain('Email');
    expect(res.content).toContain('Status');
    expect(res.tableData).toBeDefined();
    expect(res.tableData?.rows.length).toBeGreaterThan(4);
  });

  it('should preserve intent across ambiguity resolution and not leak previous queries', async () => {
    // 1. Initial query: Attendance
    const attRes = await runAgentWorkflow('SHOW ATTENDANCE OF MCA23027', facultyContext);
    expect(attRes.content).toContain('Attendance for');

    // 2. New query: Fees of ambiguous student
    const feeRes = await runAgentWorkflow('FEE DETAILS OF AKASH', facultyContext);
    expect(feeRes.type).toBe('CLARIFICATION');
    expect(feeRes.pendingQuery?.intent).toBe('FEES');
    expect(feeRes.pendingQuery?.candidates.length).toBeGreaterThanOrEqual(3);

    // 3. User selects candidate MCA23027 -> MUST execute FEES, not attendance
    const resolvedRes = await runAgentWorkflow('MCA23027', facultyContext, undefined, feeRes.pendingQuery);
    expect(resolvedRes.content).toContain('Fee status for');
    expect(resolvedRes.content).not.toContain('Attendance for');
  });

  it('should handle department aggregate fee and attendance queries', async () => {
    const res1 = await runAgentWorkflow('MCA PENDING FEES', facultyContext);
    expect(res1.type).toBe('TEXT');
    expect(res1.content).toContain('Pending & Partial Fee Records');

    const res2 = await runAgentWorkflow('BCA ATTENDANCE', facultyContext);
    expect(res2.type).toBe('TEXT');
    expect(res2.content).toContain('Attendance');
  });

  it('should conservatively reject multi-word mismatch (DEEPAK SINGH should not match Deepak Bansal)', async () => {
    const res = await runAgentWorkflow('DEEPAK SINGH FEE DETAILS', facultyContext);
    expect(res.content).toContain("I couldn't find a student matching 'deepak singh'");
    expect(res.content).not.toContain('Deepak Bansal');
  });

  it('should normalize and handle concatenated queries (ARUNDETAILS, DETAILSARUN, ATTENDANCEOFARUN, FEEOF SHARMA)', async () => {
    const res1 = await runAgentWorkflow('ARUNDETAILS', facultyContext);
    expect(res1.type).toBe('CLARIFICATION');
    expect(res1.pendingQuery?.intent).toBe('STUDENT_DETAILS');

    const res2 = await runAgentWorkflow('DETAILSARUN', facultyContext);
    expect(res2.type).toBe('CLARIFICATION');
    expect(res2.pendingQuery?.intent).toBe('STUDENT_DETAILS');

    const res3 = await runAgentWorkflow('ATTENDANCEOFARUN', facultyContext);
    expect(res3.type).toBe('CLARIFICATION');
    expect(res3.pendingQuery?.intent).toBe('ATTENDANCE');

    const res4 = await runAgentWorkflow('FEEOF SHARMA', facultyContext);
    expect(res4.type).toBe('CLARIFICATION');
    expect(res4.pendingQuery?.intent).toBe('FEES');

    const res5 = await runAgentWorkflow('FEEOFRAHUL', facultyContext);
    expect(res5.type).toBe('CLARIFICATION');
    expect(res5.pendingQuery?.intent).toBe('FEES');
  });

  it('should retrieve student details, fees, and attendance by full name (RAHUL SINGH)', async () => {
    const res1 = await runAgentWorkflow('RAHUL SINGH', facultyContext);
    expect(res1.type).toBe('TEXT');
    expect(res1.content).toContain('Rahul Singh');
    expect(res1.content).toContain('GENAI23027');

    const res2 = await runAgentWorkflow('RAHUL SINGH DETAILS', facultyContext);
    expect(res2.type).toBe('TEXT');
    expect(res2.content).toContain('Student Details for **Rahul Singh** (GENAI23027)');

    const res3 = await runAgentWorkflow('RAHUL SINGH FEE DETAILS', facultyContext);
    expect(res3.type).toBe('TEXT');
    expect(res3.content).toContain('Fee status for **Rahul Singh** (GENAI23027)');

    const res4 = await runAgentWorkflow('ATTENDANCE OF RAHUL SINGH', facultyContext);
    expect(res4.type).toBe('TEXT');
    expect(res4.content).toContain('Attendance for **Rahul Singh** (GENAI23027)');
  });

  it('should handle ambiguity and show candidates for AKASH queries', async () => {
    const res1 = await runAgentWorkflow('AKASH DETAILS', facultyContext);
    expect(res1.type).toBe('CLARIFICATION');
    expect(res1.pendingQuery?.intent).toBe('STUDENT_DETAILS');

    const res2 = await runAgentWorkflow('AKASH FEES', facultyContext);
    expect(res2.type).toBe('CLARIFICATION');
    expect(res2.pendingQuery?.intent).toBe('FEES');

    const res3 = await runAgentWorkflow('AKASH ATTENDANCE', facultyContext);
    expect(res3.type).toBe('CLARIFICATION');
    expect(res3.pendingQuery?.intent).toBe('ATTENDANCE');
  });

  it('should handle partial first-name searches (ATTENDANCE OF RAHUL, DEEPAK, KARTHIK)', async () => {
    const res1 = await runAgentWorkflow('ATTENDANCE OF RAHUL', facultyContext);
    expect(res1.type).toBe('CLARIFICATION');
    expect(res1.pendingQuery?.intent).toBe('ATTENDANCE');
    expect(res1.pendingQuery?.candidates.length).toBeGreaterThan(1);

    const res2 = await runAgentWorkflow('ATTENDANCE OF DEEPAK', facultyContext);
    expect(res2.type).toBe('CLARIFICATION');
    expect(res2.pendingQuery?.intent).toBe('ATTENDANCE');
    expect(res2.pendingQuery?.candidates.length).toBeGreaterThan(1);

    const res3 = await runAgentWorkflow('ATTENDANCE OF KARTHIK', facultyContext);
    expect(res3.type).toBe('CLARIFICATION');
    expect(res3.pendingQuery?.intent).toBe('ATTENDANCE');
    expect(res3.pendingQuery?.candidates.length).toBeGreaterThan(0);

    const res4 = await runAgentWorkflow('RAHUL DETAILS', facultyContext);
    expect(res4.type).toBe('CLARIFICATION');
    expect(res4.pendingQuery?.intent).toBe('STUDENT_DETAILS');

    const res5 = await runAgentWorkflow('FEE DETAILS OF RAHUL', facultyContext);
    expect(res5.type).toBe('CLARIFICATION');
    expect(res5.pendingQuery?.intent).toBe('FEES');
  });

  it('should handle sequential resolution without state contamination (RAHUL -> GENAI23027 -> ADITI)', async () => {
    // Step 1: ATTENDANCE OF RAHUL
    const res1 = await runAgentWorkflow('ATTENDANCE OF RAHUL', facultyContext);
    expect(res1.type).toBe('CLARIFICATION');
    expect(res1.pendingQuery?.intent).toBe('ATTENDANCE');

    // Step 2: User selects GENAI23027
    const res2 = await runAgentWorkflow('GENAI23027', facultyContext, undefined, res1.pendingQuery);
    expect(res2.type).toBe('TEXT');
    expect(res2.content).toContain('Attendance for **Rahul Singh** (GENAI23027)');

    // Step 3: Fresh query for ADITI
    const res3 = await runAgentWorkflow('ATTENDANCE OF ADITI', facultyContext);
    expect(res3.content).not.toContain('Rahul');
  });

  it('should correctly handle Show attendance of 23CS101, attendance of rahul, and attendance of diya', async () => {
    // 1. Show attendance of 23CS101 -> routes to class/student attendance
    const res1 = await runAgentWorkflow('Show attendance of 23CS101', facultyContext);
    expect(res1.type).toBe('TEXT');
    expect(res1.content).toContain('Attendance');

    // 2. attendance of rahul -> extracts rahul, queries first_name, returns candidates
    const res2 = await runAgentWorkflow('attendance of rahul', facultyContext);
    expect(res2.type).toBe('CLARIFICATION');
    expect(res2.pendingQuery?.intent).toBe('ATTENDANCE');
    expect(res2.pendingQuery?.candidates.length).toBeGreaterThan(1);

    // 3. attendance of diya -> queries Supabase, returns genuine not found when 0 records exist
    const res3 = await runAgentWorkflow('attendance of diya', facultyContext);
    expect(res3.type).toBe('TEXT');
    expect(res3.content).toContain("I couldn't find a student or subject matching 'diya'");
  });
});
