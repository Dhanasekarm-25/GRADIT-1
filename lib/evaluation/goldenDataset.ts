/**
 * GRADit! ERP AI Chatbot — Master Golden Dataset (600+ Test Cases)
 * Fully compliant with Section 40 & 41 requirements:
 * - 100+ Fee Queries
 * - 100+ Attendance Queries
 * - 100+ Student Details Queries
 * - 50+ Report Queries
 * - 50+ Class Queries
 * - 50+ Department Queries
 * - 50+ Typo Queries
 * - 50+ Concatenated Queries
 * - 50+ Ambiguous Queries
 * - 50+ No-Match Queries
 */

export interface GoldenTestCase {
  id: string;
  category: string;
  input: string;
  expectedIntent: string;
  expectedEntityType?: 'STUDENT' | 'STUDENT_ID' | 'CLASS' | 'DEPARTMENT' | 'REPORT_FORMAT' | 'NONE';
  expectedEntity?: string;
  expectedTool?: string;
  expectedOutcome: 'SUCCESS' | 'CLARIFICATION' | 'ENTITY_NOT_FOUND' | 'UNSUPPORTED_INTENT' | 'NO_RECORDS';
  shouldCallLLM: boolean;
}

export function generateGoldenDataset(): GoldenTestCase[] {
  const tests: GoldenTestCase[] = [];
  let idCounter = 1;

  function add(
    category: string,
    input: string,
    expectedIntent: string,
    expectedEntityType: 'STUDENT' | 'STUDENT_ID' | 'CLASS' | 'DEPARTMENT' | 'REPORT_FORMAT' | 'NONE' = 'STUDENT',
    expectedEntity?: string,
    expectedOutcome: 'SUCCESS' | 'CLARIFICATION' | 'ENTITY_NOT_FOUND' | 'UNSUPPORTED_INTENT' | 'NO_RECORDS' = 'SUCCESS',
    expectedTool?: string
  ) {
    tests.push({
      id: `TC-${String(idCounter++).padStart(4, '0')}`,
      category,
      input,
      expectedIntent,
      expectedEntityType,
      expectedEntity,
      expectedTool,
      expectedOutcome,
      shouldCallLLM: false,
    });
  }

  // ==========================================
  // 1. Fee Queries (100+ Test Cases)
  // ==========================================
  const feeStudents = ['sharma', 'rohan', 'harini', 'priya', 'vikram', 'ananya', 'rahul'];
  const feePhrasings = [
    (s: string) => `fee of ${s}`,
    (s: string) => `fees of ${s}`,
    (s: string) => `fee ${s}`,
    (s: string) => `fees ${s}`,
    (s: string) => `${s} fee`,
    (s: string) => `${s} fees`,
    (s: string) => `show ${s} fees`,
    (s: string) => `show fee of ${s}`,
    (s: string) => `give me fee of ${s}`,
    (s: string) => `tell me about ${s} fees`,
    (s: string) => `how much fee did ${s} pay`,
    (s: string) => `${s} payment`,
    (s: string) => `payment ${s}`,
    (s: string) => `${s} payment details`,
    (s: string) => `fee details of ${s}`,
    (s: string) => `fee details ${s}`,
    (s: string) => `${s} fee details`,
    (s: string) => `pending fee ${s}`,
    (s: string) => `pending fee of ${s}`,
    (s: string) => `${s} pending fee`,
    (s: string) => `${s} due`,
    (s: string) => `due ${s}`,
    (s: string) => `outstanding ${s}`,
    (s: string) => `how much does ${s} owe`,
  ];

  for (const s of feeStudents) {
    for (const phrase of feePhrasings) {
      const q = phrase(s);
      const isPending = /pending|due|owe|outstanding/i.test(q);
      add(
        'FEE_QUERIES',
        q,
        isPending ? 'PENDING_FEES' : 'FEES_STUDENT',
        'STUDENT',
        s,
        'SUCCESS',
        isPending ? 'getPendingFeesTool' : 'getStudentFeesTool'
      );
    }
  }

  // ==========================================
  // 2. Attendance Queries (100+ Test Cases)
  // ==========================================
  const attPhrasings = [
    (s: string) => `attendance ${s}`,
    (s: string) => `${s} attendance`,
    (s: string) => `attendance of ${s}`,
    (s: string) => `attendance for ${s}`,
    (s: string) => `show ${s} attendance`,
    (s: string) => `show attendance of ${s}`,
    (s: string) => `give me ${s} attendance`,
    (s: string) => `what is ${s} attendance`,
    (s: string) => `how much attendance does ${s} have`,
    (s: string) => `${s} present`,
    (s: string) => `${s} absent`,
    (s: string) => `is ${s} present`,
    (s: string) => `check ${s} attendance`,
    (s: string) => `${s} attendance percentage`,
    (s: string) => `attendance status of ${s}`,
    (s: string) => `tell me attendance of ${s}`,
  ];

  for (const s of feeStudents) {
    for (const phrase of attPhrasings) {
      add(
        'ATTENDANCE_QUERIES',
        phrase(s),
        'ATTENDANCE_STUDENT',
        'STUDENT',
        s,
        'SUCCESS',
        'getStudentAttendanceTool'
      );
    }
  }

  // Low attendance / threshold attendance queries
  const thresholds = [75, 80, 85, 90, 65, 70];
  const depts = ['CSE', 'ECE', 'MECH'];
  for (const t of thresholds) {
    for (const d of depts) {
      add('ATTENDANCE_QUERIES', `show ${d} students below ${t}%`, 'LOW_ATTENDANCE', 'DEPARTMENT', d, 'SUCCESS', 'getLowAttendanceStudentsTool');
      add('ATTENDANCE_QUERIES', `who is under ${t} in ${d}`, 'LOW_ATTENDANCE', 'DEPARTMENT', d, 'SUCCESS', 'getLowAttendanceStudentsTool');
    }
  }

  // ==========================================
  // 3. Student Details Queries (100+ Test Cases)
  // ==========================================
  const detailsPhrasings = [
    (s: string) => `details ${s}`,
    (s: string) => `${s} details`,
    (s: string) => `details of ${s}`,
    (s: string) => `details for ${s}`,
    (s: string) => `student details ${s}`,
    (s: string) => `student ${s}`,
    (s: string) => `${s} info`,
    (s: string) => `${s} information`,
    (s: string) => `${s} profile`,
    (s: string) => `show ${s}`,
    (s: string) => `show me ${s}`,
    (s: string) => `tell me about ${s}`,
    (s: string) => `information about ${s}`,
    (s: string) => `lookup ${s}`,
    (s: string) => `find ${s}`,
    (s: string) => `search student ${s}`,
  ];

  for (const s of feeStudents) {
    for (const phrase of detailsPhrasings) {
      add('STUDENT_DETAILS_QUERIES', phrase(s), 'STUDENT_DETAILS', 'STUDENT', s, 'SUCCESS', 'getStudentDetailsTool');
    }
  }

  // ==========================================
  // 4. Report Queries (50+ Test Cases)
  // ==========================================
  const formats = ['pdf', 'excel', 'xlsx', 'word', 'docx'];
  for (const f of formats) {
    for (const s of ['sharma', 'harini', 'rohan', 'priya']) {
      add('REPORT_QUERIES', `download ${s} attendance as ${f}`, 'REPORT_REQUEST', 'STUDENT', s, 'SUCCESS', 'generateReport');
      add('REPORT_QUERIES', `export ${s} fee report as ${f}`, 'REPORT_REQUEST', 'STUDENT', s, 'SUCCESS', 'generateReport');
      add('REPORT_QUERIES', `create ${f} report for ${s}`, 'REPORT_REQUEST', 'STUDENT', s, 'SUCCESS', 'generateReport');
    }
    add('REPORT_QUERIES', `download CSE attendance report as ${f}`, 'REPORT_REQUEST', 'DEPARTMENT', 'CSE', 'SUCCESS', 'generateReport');
    add('REPORT_QUERIES', `export CSE fee report as ${f}`, 'REPORT_REQUEST', 'DEPARTMENT', 'CSE', 'SUCCESS', 'generateReport');
  }

  // ==========================================
  // 5. Class Queries (50+ Test Cases)
  // ==========================================
  const classCodes = ['CSE-A', 'ECE-B', 'MECH-A', 'CSE-B', 'ECE-A', 'MECH-B'];
  for (const c of classCodes) {
    add('CLASS_QUERIES', `${c} attendance`, 'ATTENDANCE_CLASS', 'CLASS', c, 'SUCCESS', 'getClassAttendanceTool');
    add('CLASS_QUERIES', `attendance of ${c}`, 'ATTENDANCE_CLASS', 'CLASS', c, 'SUCCESS', 'getClassAttendanceTool');
    add('CLASS_QUERIES', `show attendance for ${c}`, 'ATTENDANCE_CLASS', 'CLASS', c, 'SUCCESS', 'getClassAttendanceTool');
    add('CLASS_QUERIES', `fees for ${c}`, 'FEES_CLASS', 'CLASS', c, 'SUCCESS', 'getClassFeesTool');
    add('CLASS_QUERIES', `${c} fees`, 'FEES_CLASS', 'CLASS', c, 'SUCCESS', 'getClassFeesTool');
    add('CLASS_QUERIES', `students in class ${c}`, 'STUDENTS_LIST', 'CLASS', c, 'SUCCESS', 'getStudentsByClassTool');
    add('CLASS_QUERIES', `list students of ${c}`, 'STUDENTS_LIST', 'CLASS', c, 'SUCCESS', 'getStudentsByClassTool');
  }
  add('CLASS_QUERIES', 'class attendance', 'ATTENDANCE_CLASS', 'CLASS', undefined, 'SUCCESS', 'getClassAttendanceTool');
  add('CLASS_QUERIES', 'attendance by class', 'ATTENDANCE_CLASS', 'CLASS', undefined, 'SUCCESS', 'getClassAttendanceTool');
  add('CLASS_QUERIES', 'class wise attendance', 'ATTENDANCE_CLASS', 'CLASS', undefined, 'SUCCESS', 'getClassAttendanceTool');
  add('CLASS_QUERIES', 'class fee', 'FEES_CLASS', 'CLASS', undefined, 'SUCCESS', 'getClassFeesTool');
  add('CLASS_QUERIES', 'fee of class', 'FEES_CLASS', 'CLASS', undefined, 'SUCCESS', 'getClassFeesTool');
  add('CLASS_QUERIES', 'class fee report', 'REPORT_REQUEST', 'CLASS', undefined, 'SUCCESS', 'getClassFeesTool');
  add('CLASS_QUERIES', 'section a attendance', 'ATTENDANCE_CLASS', 'CLASS', undefined, 'SUCCESS', 'getClassAttendanceTool');
  add('CLASS_QUERIES', 'section b attendance', 'ATTENDANCE_CLASS', 'CLASS', undefined, 'SUCCESS', 'getClassAttendanceTool');

  // ==========================================
  // 6. Department Queries (50+ Test Cases)
  // ==========================================
  for (const d of ['CSE', 'ECE', 'MECH', 'EEE', 'IT', 'CIVIL']) {
    add('DEPARTMENT_QUERIES', `${d} attendance`, 'ATTENDANCE_DEPARTMENT', 'DEPARTMENT', d, 'SUCCESS', 'getDepartmentAttendanceTool');
    add('DEPARTMENT_QUERIES', `attendance of ${d}`, 'ATTENDANCE_DEPARTMENT', 'DEPARTMENT', d, 'SUCCESS', 'getDepartmentAttendanceTool');
    add('DEPARTMENT_QUERIES', `${d} fees`, 'FEES_DEPARTMENT', 'DEPARTMENT', d, 'SUCCESS', 'getDepartmentFeesTool');
    add('DEPARTMENT_QUERIES', `fee details of ${d}`, 'FEES_DEPARTMENT', 'DEPARTMENT', d, 'SUCCESS', 'getDepartmentFeesTool');
    add('DEPARTMENT_QUERIES', `pending fees ${d}`, 'PENDING_FEES', 'DEPARTMENT', d, 'SUCCESS', 'getPendingFeesTool');
    add('DEPARTMENT_QUERIES', `${d} students`, 'STUDENTS_LIST', 'DEPARTMENT', d, 'SUCCESS', 'findStudents');
    add('DEPARTMENT_QUERIES', `students of ${d}`, 'STUDENTS_LIST', 'DEPARTMENT', d, 'SUCCESS', 'findStudents');
    add('DEPARTMENT_QUERIES', `show ${d} student directory`, 'STUDENTS_LIST', 'DEPARTMENT', d, 'SUCCESS', 'findStudents');
    add('DEPARTMENT_QUERIES', `${d} department fee report`, 'REPORT_REQUEST', 'DEPARTMENT', d, 'SUCCESS', 'getDepartmentFeesTool');
  }

  // ==========================================
  // 7. Typo Queries (50+ Test Cases)
  // ==========================================
  const typoCases = [
    { q: 'feeof shrma', intent: 'FEES_STUDENT', entity: 'shrma', outcome: 'SUCCESS' as const },
    { q: 'fees sharama', intent: 'FEES_STUDENT', entity: 'sharama', outcome: 'SUCCESS' as const },
    { q: 'attendance arfun', intent: 'ATTENDANCE_STUDENT', entity: 'arfun', outcome: 'CLARIFICATION' as const },
    { q: 'details harin', intent: 'STUDENT_DETAILS', entity: 'harin', outcome: 'SUCCESS' as const },
    { q: 'atendance sharma', intent: 'ATTENDANCE_STUDENT', entity: 'sharma', outcome: 'SUCCESS' as const },
    { q: 'attendence sharma', intent: 'ATTENDANCE_STUDENT', entity: 'sharma', outcome: 'SUCCESS' as const },
    { q: 'attandance sharma', intent: 'ATTENDANCE_STUDENT', entity: 'sharma', outcome: 'SUCCESS' as const },
    { q: 'feee sharma', intent: 'FEES_STUDENT', entity: 'sharma', outcome: 'SUCCESS' as const },
    { q: 'feess sharma', intent: 'FEES_STUDENT', entity: 'sharma', outcome: 'SUCCESS' as const },
    { q: 'ffe rohan', intent: 'FEES_STUDENT', entity: 'rohan', outcome: 'SUCCESS' as const },
    { q: 'rohan ffe', intent: 'FEES_STUDENT', entity: 'rohan', outcome: 'SUCCESS' as const },
    { q: 'rohan fess', intent: 'FEES_STUDENT', entity: 'rohan', outcome: 'SUCCESS' as const },
    { q: 'detals sharma', intent: 'STUDENT_DETAILS', entity: 'sharma', outcome: 'SUCCESS' as const },
    { q: 'detalis sharma', intent: 'STUDENT_DETAILS', entity: 'sharma', outcome: 'SUCCESS' as const },
    { q: 'deatails sharma', intent: 'STUDENT_DETAILS', entity: 'sharma', outcome: 'SUCCESS' as const },
    { q: 'studnt sharma', intent: 'STUDENT_DETAILS', entity: 'sharma', outcome: 'SUCCESS' as const },
    { q: 'panding fee sharma', intent: 'PENDING_FEES', entity: 'sharma', outcome: 'SUCCESS' as const },
    { q: 'peding fee sharma', intent: 'PENDING_FEES', entity: 'sharma', outcome: 'SUCCESS' as const },
    { q: 'attendance od rohan', intent: 'ATTENDANCE_STUDENT', entity: 'rohan', outcome: 'SUCCESS' as const },
    { q: 'fee od rohan', intent: 'FEES_STUDENT', entity: 'rohan', outcome: 'SUCCESS' as const },
    { q: 'details od rohan', intent: 'STUDENT_DETAILS', entity: 'rohan', outcome: 'SUCCESS' as const },
    { q: 'attendance fro rohan', intent: 'ATTENDANCE_STUDENT', entity: 'rohan', outcome: 'SUCCESS' as const },
    { q: 'attendanceod rohan', intent: 'ATTENDANCE_STUDENT', entity: 'rohan', outcome: 'SUCCESS' as const },
    { q: 'feeod rohan', intent: 'FEES_STUDENT', entity: 'rohan', outcome: 'SUCCESS' as const },
    { q: 'detailod rohan', intent: 'STUDENT_DETAILS', entity: 'rohan', outcome: 'SUCCESS' as const },
    { q: 'pendingfeeod rohan', intent: 'PENDING_FEES', entity: 'rohan', outcome: 'SUCCESS' as const },
    { q: 'computr attendance', intent: 'ATTENDANCE_DEPARTMENT', entity: 'CSE', outcome: 'SUCCESS' as const },
    { q: 'elec fees', intent: 'FEES_DEPARTMENT', entity: 'ECE', outcome: 'SUCCESS' as const },
    { q: 'mechanical students', intent: 'STUDENTS_LIST', entity: 'MECH', outcome: 'SUCCESS' as const },
    { q: 'repot sharma', intent: 'STUDENT_DETAILS', entity: 'sharma', outcome: 'SUCCESS' as const },
  ];

  for (const t of typoCases) {
    add('TYPO_QUERIES', t.q, t.intent, 'STUDENT', t.entity, t.outcome);
  }

  for (const s of ['rohan', 'sharma', 'harini', 'priya']) {
    add('TYPO_QUERIES', `atndance ${s}`, 'ATTENDANCE_STUDENT', 'STUDENT', s, 'SUCCESS');
    add('TYPO_QUERIES', `paymnt ${s}`, 'FEES_STUDENT', 'STUDENT', s, 'SUCCESS');
    add('TYPO_QUERIES', `payemnt ${s}`, 'FEES_STUDENT', 'STUDENT', s, 'SUCCESS');
    add('TYPO_QUERIES', `dtls ${s}`, 'STUDENT_DETAILS', 'STUDENT', s, 'SUCCESS');
    add('TYPO_QUERIES', `profle ${s}`, 'STUDENT_DETAILS', 'STUDENT', s, 'SUCCESS');
    add('TYPO_QUERIES', `infromation ${s}`, 'STUDENT_DETAILS', 'STUDENT', s, 'SUCCESS');
  }

  // ==========================================
  // 8. Concatenated Queries (50+ Test Cases)
  // ==========================================
  const concatStudents = ['sharma', 'harini', 'priya', 'vikram', 'ananya', 'rahul'];
  for (const s of concatStudents) {
    add('CONCATENATED_QUERIES', `feeof${s}`, 'FEES_STUDENT', 'STUDENT', s, 'SUCCESS');
    add('CONCATENATED_QUERIES', `feesof${s}`, 'FEES_STUDENT', 'STUDENT', s, 'SUCCESS');
    add('CONCATENATED_QUERIES', `${s}fee`, 'FEES_STUDENT', 'STUDENT', s, 'SUCCESS');
    add('CONCATENATED_QUERIES', `${s}fees`, 'FEES_STUDENT', 'STUDENT', s, 'SUCCESS');
    add('CONCATENATED_QUERIES', `fee${s}`, 'FEES_STUDENT', 'STUDENT', s, 'SUCCESS');
    add('CONCATENATED_QUERIES', `attendanceof${s}`, 'ATTENDANCE_STUDENT', 'STUDENT', s, 'SUCCESS');
    add('CONCATENATED_QUERIES', `${s}attendance`, 'ATTENDANCE_STUDENT', 'STUDENT', s, 'SUCCESS');
    add('CONCATENATED_QUERIES', `detailsof${s}`, 'STUDENT_DETAILS', 'STUDENT', s, 'SUCCESS');
    add('CONCATENATED_QUERIES', `${s}details`, 'STUDENT_DETAILS', 'STUDENT', s, 'SUCCESS');
    add('CONCATENATED_QUERIES', `${s}info`, 'STUDENT_DETAILS', 'STUDENT', s, 'SUCCESS');
    add('CONCATENATED_QUERIES', `${s}profile`, 'STUDENT_DETAILS', 'STUDENT', s, 'SUCCESS');
    add('CONCATENATED_QUERIES', `pendingfeeof${s}`, 'PENDING_FEES', 'STUDENT', s, 'SUCCESS');
  }
  add('CONCATENATED_QUERIES', 'cseattendance', 'ATTENDANCE_DEPARTMENT', 'DEPARTMENT', 'CSE', 'SUCCESS');
  add('CONCATENATED_QUERIES', 'csefees', 'FEES_DEPARTMENT', 'DEPARTMENT', 'CSE', 'SUCCESS');
  add('CONCATENATED_QUERIES', 'csestudents', 'STUDENTS_LIST', 'DEPARTMENT', 'CSE', 'SUCCESS');
  add('CONCATENATED_QUERIES', 'eceattendance', 'ATTENDANCE_DEPARTMENT', 'DEPARTMENT', 'ECE', 'SUCCESS');
  add('CONCATENATED_QUERIES', 'ecefees', 'FEES_DEPARTMENT', 'DEPARTMENT', 'ECE', 'SUCCESS');

  // ==========================================
  // 9. Ambiguous & Bare Queries (50+ Test Cases)
  // ==========================================
  const arunPhrases = [
    'arun',
    'ARUN',
    'Arun',
    'arun fees',
    'fee of arun',
    'fees arun',
    'arun attendance',
    'attendance arun',
    'arun details',
    'details arun',
    'arundetails',
    'arunattendance',
    'arunfees',
    'feeofarun',
    'pendingfee arun',
    'arun due',
    'arun report',
    'download arun attendance as pdf',
    'details of arun',
    'arun info',
    'show arun',
    'find arun',
    'lookup arun',
    'arun profile',
    'student arun',
    'arun student',
    'get arun details',
    'check arun info',
    'who is arun',
    'tell me about arun',
    'show me arun',
    'search arun',
    'give me arun',
    'information about arun',
    'arun information',
    'arun summary',
    'arun record',
    'lookup student arun',
  ];
  for (const q of arunPhrases) {
    const isReport = /pdf|report/i.test(q);
    const isPending = /pending|due|owe/i.test(q);
    const isFee = /fee|payment/i.test(q);
    const isAtt = /attendance/i.test(q);
    const isDetails = /details|info|profile|information|summary|record/i.test(q);
    add(
      'AMBIGUOUS_QUERIES',
      q,
      isReport
        ? 'REPORT_REQUEST'
        : isPending
        ? 'PENDING_FEES'
        : isFee
        ? 'FEES_STUDENT'
        : isAtt
        ? 'ATTENDANCE_STUDENT'
        : isDetails
        ? 'STUDENT_DETAILS'
        : 'CLARIFICATION',
      'STUDENT',
      'arun',
      'CLARIFICATION'
    );
  }

  const bareQueries = ['sharma', 'rohan', 'harini', 'priya', 'vikram', 'ananya', 'rahul'];
  for (const b of bareQueries) {
    add('AMBIGUOUS_QUERIES', b, 'BARE_ENTITY', 'STUDENT', b, 'CLARIFICATION');
  }

  const multiQueries = [
    'show rohan attendance and fees',
    'rohan details and attendance',
    'give me sharma fees and attendance',
    'download harini attendance and fees report',
    'priya attendance and fees',
    'attendance and fees of vikram',
  ];
  for (const m of multiQueries) {
    add('AMBIGUOUS_QUERIES', m, 'MULTI_INTENT', 'STUDENT', undefined, 'CLARIFICATION');
  }

  // ==========================================
  // 10. No-Match & Unsupported Queries (50+ Test Cases)
  // ==========================================
  const nonExistentStudents = ['xyzabc', 'qwerty', 'foobar', 'unknownstudent', 'john doe', 'nobody', 'notastudent'];
  for (const n of nonExistentStudents) {
    add('NO_MATCH_QUERIES', `${n} fees`, 'FEES_STUDENT', 'STUDENT', n, 'ENTITY_NOT_FOUND');
    add('NO_MATCH_QUERIES', `fee of ${n}`, 'FEES_STUDENT', 'STUDENT', n, 'ENTITY_NOT_FOUND');
    add('NO_MATCH_QUERIES', `${n} attendance`, 'ATTENDANCE_STUDENT', 'STUDENT', n, 'ENTITY_NOT_FOUND');
    add('NO_MATCH_QUERIES', `attendance of ${n}`, 'ATTENDANCE_STUDENT', 'STUDENT', n, 'ENTITY_NOT_FOUND');
    add('NO_MATCH_QUERIES', `${n} details`, 'STUDENT_DETAILS', 'STUDENT', n, 'ENTITY_NOT_FOUND');
    add('NO_MATCH_QUERIES', `details of ${n}`, 'STUDENT_DETAILS', 'STUDENT', n, 'ENTITY_NOT_FOUND');
    add('NO_MATCH_QUERIES', `pending fee ${n}`, 'PENDING_FEES', 'STUDENT', n, 'ENTITY_NOT_FOUND');
  }

  const unsupportedQueries = [
    'what is the weather today',
    'tell me a joke',
    'who is the president',
    'how to bake a cake',
    'write a python script',
    'SELECT * FROM students',
    'DROP TABLE fees',
    'INSERT INTO attendance',
    '1 UNION SELECT 1,2,3',
  ];
  for (const u of unsupportedQueries) {
    add('NO_MATCH_QUERIES', u, 'UNSUPPORTED', 'NONE', undefined, 'UNSUPPORTED_INTENT');
  }

  return tests;
}
