const assert = require('assert');

async function run400EvaluationSuite() {
  console.log('====================================================');
  console.log('GRADit! ERP AI Chatbot — 400+ Test Case Evaluation Suite');
  console.log('====================================================\n');

  const { DeterministicQueryClassifier } = await import('../lib/query-understanding/classifier.ts');
  const { runAgentWorkflow } = await import('../lib/agent/graph.ts');
  const { PenaltySystem } = await import('../lib/evaluation/penaltySystem.ts');
  const { EvaluationLogger } = await import('../lib/evaluation/evalLogger.ts');

  const logger = new EvaluationLogger();
  const facultyContext = { userId: 'usr-1', role: 'FACULTY' };
  const studentContext = { userId: 'usr-3', role: 'STUDENT' };

  const studentCodes = ['23CS101', '23CS102', '23EC205', '23CS103', '23CS104', '23EC202', '23ME302', '23CS105'];
  const deptCodes = ['CSE', 'ECE', 'MECH', 'EEE', 'IT', 'CIVIL'];

  const testCases = [];

  // 1. 100 Attendance Queries
  for (let i = 0; i < 100; i++) {
    const code = studentCodes[i % studentCodes.length];
    const dept = deptCodes[i % deptCodes.length];

    if (i % 4 === 0) {
      testCases.push({
        query: `show attendance of ${code}`,
        expectedIntent: 'ATTENDANCE_STUDENT',
        expectedEntity: { studentId: code },
      });
    } else if (i % 4 === 1) {
      testCases.push({
        query: `${dept} department attendance percentage`,
        expectedIntent: 'ATTENDANCE_DEPARTMENT',
        expectedEntity: { department: dept },
      });
    } else if (i % 4 === 2) {
      testCases.push({
        query: `students below ${60 + (i % 30)}% attendance`,
        expectedIntent: 'LOW_ATTENDANCE',
        expectedEntity: { threshold: 60 + (i % 30) },
      });
    } else {
      testCases.push({
        query: `attendance of ${code}`,
        expectedIntent: 'ATTENDANCE_STUDENT',
        expectedEntity: { studentId: code },
      });
    }
  }

  // 2. 100 Fee Queries
  for (let i = 0; i < 100; i++) {
    const code = studentCodes[i % studentCodes.length];
    const dept = deptCodes[i % deptCodes.length];

    if (i % 4 === 0) {
      testCases.push({
        query: `fee status of ${code}`,
        expectedIntent: 'FEES_STUDENT',
        expectedEntity: { studentId: code },
      });
    } else if (i % 4 === 1) {
      testCases.push({
        query: `pending fees for ${dept}`,
        expectedIntent: 'PENDING_FEES',
        expectedEntity: { department: dept },
      });
    } else if (i % 4 === 2) {
      testCases.push({
        query: `FEE DETAILS OF ${dept}`,
        expectedIntent: 'FEES_DEPARTMENT',
        expectedEntity: { department: dept },
      });
    } else {
      testCases.push({
        query: `FEE DEATAILSOFCHANDRU`,
        expectedIntent: 'FEES_STUDENT',
        expectedEntity: { studentName: 'chandru' },
      });
    }
  }

  // 3. 50 Student Details & Fuzzy Lookup Queries
  const detailQueryTemplates = [
    'HARINI DETAILS',
    'ARUNDETAILS',
    'DETAILS ARFUN',
    'ARUN DETAILS',
    'DETAILS HARINI',
    'DETAILS ARUN',
    'SHOW ARUN DETAILS',
    'SHOW ME ARUN DETAILS',
    'DETAILS OF ARUN',
    'DETAILS FOR ARUN',
    "ARUN'S DETAILS",
    'ARUN INFO',
    'ARUN INFORMATION',
    'ARUN PROFILE',
    'SHOW ARUN PROFILE',
    'STUDENT DETAILS ARUN',
    'ARUN STUDENT DETAILS',
    'ARUN KUMAR DETAILS',
    'DETAILS ARUN KUMAR',
    'SHOW ARUN KUMAR DETAILS',
    'ARFUN DETAILS',
    'HARIN DETAILS',
    'ARUN KUMR DETAILS',
    'XYZABC DETAILS',
    'STUDENTS OF CSE',
  ];

  for (let i = 0; i < 50; i++) {
    const template = detailQueryTemplates[i % detailQueryTemplates.length];
    const isList = template.includes('STUDENTS OF');
    testCases.push({
      query: template,
      expectedIntent: isList ? 'STUDENTS_LIST' : 'STUDENT_DETAILS',
    });
  }

  // 4. 50 Directory Queries
  for (let i = 0; i < 50; i++) {
    const dept = deptCodes[i % deptCodes.length];
    testCases.push({
      query: i % 2 === 0 ? `STUDENTS OF ${dept}` : `list students in ${dept}`,
      expectedIntent: 'STUDENTS_LIST',
      expectedEntity: { department: dept },
    });
  }

  // 5. 50 Security & Negative Queries
  for (let i = 0; i < 50; i++) {
    if (i % 2 === 0) {
      testCases.push({
        query: `SELECT * FROM students WHERE id='std-1'`,
        expectedIntent: 'UNSUPPORTED',
        isSecurity: true,
      });
    } else {
      testCases.push({
        query: `WHAT IS THE WEATHER?`,
        expectedIntent: 'UNSUPPORTED',
        isSecurity: true,
      });
    }
  }

  // 6. 50 Report Export Queries
  for (let i = 0; i < 50; i++) {
    const fmts = ['pdf', 'excel', 'xlsx', 'docx', 'word'];
    const fmt = fmts[i % fmts.length];
    testCases.push({
      query: `download report as ${fmt}`,
      expectedIntent: 'REPORT_REQUEST',
      expectedFormat: fmt === 'excel' ? 'xlsx' : fmt === 'word' ? 'docx' : fmt,
    });
  }

  console.log(`Loaded ${testCases.length} automated test cases. Running evaluation pipeline...\n`);

  let count = 0;
  for (const tc of testCases) {
    count++;
    const ctx = tc.shouldDeny ? studentContext : facultyContext;
    const erpQuery = DeterministicQueryClassifier.classify(tc.query);
    const response = await runAgentWorkflow(tc.query, ctx);

    const record = PenaltySystem.evaluateResult(
      {
        query: tc.query,
        normalizedQuery: erpQuery.normalizedQuery,
        detectedIntent: erpQuery.intent,
        expectedIntent: tc.expectedIntent,
        extractedEntities: erpQuery,
        toolUsed: erpQuery.intent,
        generatedAnswer: response.content,
        source: erpQuery.source,
      },
      response.content,
      {
        intent: tc.expectedIntent,
        shouldDeny: tc.shouldDeny,
      }
    );

    if (!record.validationPassed) {
      console.log(`Failed TC #${count}: "${tc.query}" -> Detected: ${erpQuery.intent}, Expected: ${tc.expectedIntent}`);
    }

    logger.log(record);
  }

  console.log(logger.printFormattedReport());

  const summary = logger.getSummaryReport();
  if (summary.criticalFailures > 0 || summary.failed > 20) {
    console.error('Evaluation Suite Failed: Threshold criteria violated.');
    process.exit(1);
  } else {
    console.log('✅ Evaluation Suite Passed Successfully!');
  }
}

run400EvaluationSuite().catch((err) => {
  console.error('Error running 400 evaluation suite:', err);
  process.exit(1);
});
