import { describe, it, expect } from 'vitest';
import { runAgentWorkflow } from '../../lib/agent/graph';
import { classifyIntentAndExtract } from '../../lib/agent/intents';
import { SecurityContext } from '../../lib/tools/rbac';

const facultyContext: SecurityContext = { userId: 'usr-1', role: 'FACULTY' };

describe('Intent Classification & NL Phrasings', () => {
  it('should resolve multiple attendance phrasings to ATTENDANCE_STUDENT', () => {
    const p1 = classifyIntentAndExtract('Show attendance of 23CS101.');
    const p2 = classifyIntentAndExtract("What's 23CS101 attendance?");
    const p3 = classifyIntentAndExtract('Give attendance for student 23CS101.');
    const p4 = classifyIntentAndExtract('How much attendance does 23CS101 have?');

    expect(p1.intent).toBe('ATTENDANCE_STUDENT');
    expect(p2.intent).toBe('ATTENDANCE_STUDENT');
    expect(p3.intent).toBe('ATTENDANCE_STUDENT');
    expect(p4.intent).toBe('ATTENDANCE_STUDENT');
  });

  it('should resolve low attendance variations to LOW_ATTENDANCE', () => {
    const p1 = classifyIntentAndExtract('Show CSE students below 75%.');
    const p2 = classifyIntentAndExtract('Which CSE students have low attendance?');
    const p3 = classifyIntentAndExtract('Who is below 75% in CSE?');

    expect(p1.intent).toBe('LOW_ATTENDANCE');
    expect(p2.intent).toBe('LOW_ATTENDANCE');
    expect(p3.intent).toBe('LOW_ATTENDANCE');
  });

  it('should resolve report download requests', () => {
    const p1 = classifyIntentAndExtract('Give this as PDF.');
    const p2 = classifyIntentAndExtract('Download as Excel.');
    const p3 = classifyIntentAndExtract('Create a Word report.');

    expect(p1.intent).toBe('REPORT_REQUEST');
    expect(p1.params.reportFormat).toBe('pdf');
    expect(p2.params.reportFormat).toBe('xlsx');
    expect(p3.params.reportFormat).toBe('docx');
  });
});

describe('LangGraph Agent Workflow', () => {
  it('should execute full attendance workflow for 23CS101', async () => {
    const response = await runAgentWorkflow('Show attendance of 23CS101', facultyContext);
    expect(response.type).toBe('TEXT');
    expect(response.content).toContain('82%');
    expect(response.tableData).toBeDefined();
    expect(response.reportMetadata).toBeDefined();
  });

  it('should handle ambiguity for duplicate student names', async () => {
    const response = await runAgentWorkflow('Show attendance of Arun', facultyContext);
    expect(response.type).toBe('CLARIFICATION');
    expect(response.matches).toBeDefined();
    expect(response.matches?.length).toBeGreaterThan(1);
  });
});
