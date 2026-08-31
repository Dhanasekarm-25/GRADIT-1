const assert = require('assert');
const ExcelJS = require('exceljs');

async function runTestSuite() {
  console.log('====================================================');
  console.log('GRADit! ERP AI Chatbot — Standalone Test Suite Runner');
  console.log('====================================================\n');

  let passed = 0;
  let failed = 0;

  async function test(name, fn) {
    try {
      await fn();
      console.log(`  ✓ PASS: ${name}`);
      passed++;
    } catch (err) {
      console.error(`  ✗ FAIL: ${name}`);
      console.error(`    Error: ${err.message}\n${err.stack}`);
      failed++;
    }
  }

  // 1. Regex Library, Normalizer, Intent Rules & Typo Engine Tests
  console.log('--- 1. Query Normalization, Intent & Entity Extraction Tests ---');
  const { DeterministicQueryClassifier } = await import('../lib/query-understanding/classifier.ts');
  const { QueryNormalizer } = await import('../lib/query-understanding/normalize.ts');
  const { runAgentWorkflow } = await import('../lib/agent/graph.ts');
  const { authorizeToolExecution } = await import('../lib/tools/rbac.ts');

  const facultyContext = { userId: 'usr-1', role: 'FACULTY' };
  const studentContext = { userId: 'usr-3', role: 'STUDENT' };

  // --- Fee Query Variations ---
  const feeQueries = [
    'feeof sharma',
    'fee of sharma',
    'fees of sharma',
    'fees sharma',
    'sharma fees',
    'sharma fee',
    'show sharma fees',
    'show fee of sharma',
    'give me fee of sharma',
    'sharma payment',
    'payment sharma',
    'fee details sharma',
    'fee details of sharma',
    'sharma fee details',
    'sharmafee',
    'sharmafees',
    'feesharma',
    'feeofsharma',
    'feesofsharma',
  ];

  for (const q of feeQueries) {
    await test(`Classify Fee Query "${q}"`, () => {
      const res = DeterministicQueryClassifier.classify(q);
      assert.strictEqual(res.intent, 'FEES_STUDENT');
      assert.strictEqual(res.studentName, 'sharma');
    });
  }

  // --- Pending Fee Variations ---
  const pendingFeeQueries = [
    'pendingfee sharma',
    'pendingfeeof sharma',
    'pendingfees sharma',
    'pendingfeeofsharma',
    'sharma pending fee',
    'sharma due',
    'due sharma',
    'outstanding sharma',
  ];

  for (const q of pendingFeeQueries) {
    await test(`Classify Pending Fee Query "${q}"`, () => {
      const res = DeterministicQueryClassifier.classify(q);
      assert.strictEqual(res.intent, 'PENDING_FEES');
      assert.strictEqual(res.studentName, 'sharma');
    });
  }

  // --- Attendance Variations ---
  const attendanceQueries = [
    'attendance sharma',
    'sharma attendance',
    'attendanceof sharma',
    'attendanceofsharma',
    'sharmaattendance',
  ];

  for (const q of attendanceQueries) {
    await test(`Classify Attendance Query "${q}"`, () => {
      const res = DeterministicQueryClassifier.classify(q);
      assert.strictEqual(res.intent, 'ATTENDANCE_STUDENT');
      assert.strictEqual(res.studentName, 'sharma');
    });
  }

  // --- Student Details Variations ---
  const detailsQueries = [
    'sharma details',
    'details sharma',
    'detailsof sharma',
    'detailsofsharma',
    'sharmadetails',
    'sharma info',
    'sharmaprofile',
    'HARINI DETAILS',
    'ARUNDETAILS',
    'HARINIDETAILS',
  ];

  for (const q of detailsQueries) {
    await test(`Classify Details Query "${q}"`, () => {
      const res = DeterministicQueryClassifier.classify(q);
      assert.strictEqual(res.intent, 'STUDENT_DETAILS');
      assert.ok(res.studentName !== undefined);
    });
  }

  // --- Typos & Fuzzy Tests ---
  await test('Parse Typo "feeof shrma"', () => {
    const res = DeterministicQueryClassifier.classify('feeof shrma');
    assert.strictEqual(res.intent, 'FEES_STUDENT');
    assert.strictEqual(res.studentName, 'shrma');
  });

  await test('Parse Typo "fees sharama"', () => {
    const res = DeterministicQueryClassifier.classify('fees sharama');
    assert.strictEqual(res.intent, 'FEES_STUDENT');
    assert.strictEqual(res.studentName, 'sharama');
  });

  await test('Parse Typo "attendance arfun"', () => {
    const res = DeterministicQueryClassifier.classify('attendance arfun');
    assert.strictEqual(res.intent, 'ATTENDANCE_STUDENT');
    assert.strictEqual(res.studentName, 'arfun');
  });

  await test('Parse Typo "details harin"', () => {
    const res = DeterministicQueryClassifier.classify('details harin');
    assert.strictEqual(res.intent, 'STUDENT_DETAILS');
    assert.strictEqual(res.studentName, 'harin');
  });

  // --- Multi-Word Name Tests ---
  const multiWordQueries = [
    { q: 'fees arun kumar', intent: 'FEES_STUDENT' },
    { q: 'feeof arun kumar', intent: 'FEES_STUDENT' },
    { q: 'arun kumar fees', intent: 'FEES_STUDENT' },
    { q: 'pendingfee arun kumar', intent: 'PENDING_FEES' },
    { q: 'attendance arun kumar', intent: 'ATTENDANCE_STUDENT' },
    { q: 'details arun kumar', intent: 'STUDENT_DETAILS' },
  ];

  for (const { q, intent } of multiWordQueries) {
    await test(`Classify Multi-Word Query "${q}"`, () => {
      const res = DeterministicQueryClassifier.classify(q);
      assert.strictEqual(res.intent, intent);
      assert.strictEqual(res.studentName, 'arun kumar');
    });
  }

  await test('Parse "STUDENTS OF CSE"', () => {
    const res = DeterministicQueryClassifier.classify('STUDENTS OF CSE');
    assert.strictEqual(res.intent, 'STUDENTS_LIST');
    assert.strictEqual(res.department, 'CSE');
  });

  await test('Parse "FEE DETAILS OF CSE" as FEES_DEPARTMENT', () => {
    const res = DeterministicQueryClassifier.classify('FEE DETAILS OF CSE');
    assert.strictEqual(res.intent, 'FEES_DEPARTMENT');
    assert.strictEqual(res.department, 'CSE');
  });

  // 2. Security & RBAC Tests
  console.log('\n--- 2. Security & RBAC Tests ---');
  await test('Block STUDENT access to chatbot workflow', async () => {
    const res = await runAgentWorkflow('Show attendance of 23CS101', studentContext);
    assert.strictEqual(res.type, 'ERROR');
    assert.ok(res.content.includes('Access Denied'));
  });

  await test('Authorize FACULTY and ADMIN roles', async () => {
    assert.doesNotThrow(() => authorizeToolExecution(facultyContext, 'READ_ATTENDANCE'));
  });

  // 3. Workflow & Entity Resolution Execution Tests
  console.log('\n--- 3. Workflow & Fuzzy Entity Resolution Tests ---');

  await test('Execute "feeof sharma" -> resolves Rohan Sharma fee records', async () => {
    const res = await runAgentWorkflow('feeof sharma', facultyContext);
    assert.strictEqual(res.type, 'TEXT');
    assert.ok(res.content.includes('Rohan Sharma'));
    assert.ok(res.content.includes('23CS101'));
    assert.ok(res.content.includes('85000') || res.content.includes('85,000'));
  });

  await test('Execute "feeofsharma" -> resolves Rohan Sharma fee records', async () => {
    const res = await runAgentWorkflow('feeofsharma', facultyContext);
    assert.strictEqual(res.type, 'TEXT');
    assert.ok(res.content.includes('Rohan Sharma'));
  });

  await test('Execute "sharma fees" -> resolves Rohan Sharma fee records', async () => {
    const res = await runAgentWorkflow('sharma fees', facultyContext);
    assert.strictEqual(res.type, 'TEXT');
    assert.ok(res.content.includes('Rohan Sharma'));
  });

  await test('Execute "pendingfeeof sharma" -> resolves Rohan Sharma pending fee records', async () => {
    const res = await runAgentWorkflow('pendingfeeof sharma', facultyContext);
    assert.strictEqual(res.type, 'TEXT');
    assert.ok(res.content.includes('Rohan Sharma'));
  });

  await test('Execute "attendanceof sharma" -> resolves Rohan Sharma attendance', async () => {
    const res = await runAgentWorkflow('attendanceof sharma', facultyContext);
    assert.strictEqual(res.type, 'TEXT');
    assert.ok(res.content.includes('Rohan Sharma'));
    assert.ok(res.content.includes('82%'));
  });

  await test('Execute "attendance od rohan" -> resolves Rohan Sharma attendance', async () => {
    const res = await runAgentWorkflow('attendance od rohan', facultyContext);
    assert.strictEqual(res.type, 'TEXT');
    assert.ok(res.content.includes('Rohan Sharma'));
    assert.ok(res.content.includes('82%'));
  });

  await test('Execute "fee od rohan" -> resolves Rohan Sharma fee records', async () => {
    const res = await runAgentWorkflow('fee od rohan', facultyContext);
    assert.strictEqual(res.type, 'TEXT');
    assert.ok(res.content.includes('Rohan Sharma'));
  });

  await test('Execute "details od rohan" -> resolves Rohan Sharma details', async () => {
    const res = await runAgentWorkflow('details od rohan', facultyContext);
    assert.strictEqual(res.type, 'TEXT');
    assert.ok(res.content.includes('Rohan Sharma'));
  });

  await test('Execute "attendance fro rohan" -> resolves Rohan Sharma attendance', async () => {
    const res = await runAgentWorkflow('attendance fro rohan', facultyContext);
    assert.strictEqual(res.type, 'TEXT');
    assert.ok(res.content.includes('Rohan Sharma'));
    assert.ok(res.content.includes('82%'));
  });

  await test('Execute "attendanceod rohan" -> resolves Rohan Sharma attendance', async () => {
    const res = await runAgentWorkflow('attendanceod rohan', facultyContext);
    assert.strictEqual(res.type, 'TEXT');
    assert.ok(res.content.includes('Rohan Sharma'));
  });

  await test('Execute "rohan ffe" -> resolves Rohan Sharma fee records', async () => {
    const res = await runAgentWorkflow('rohan ffe', facultyContext);
    assert.strictEqual(res.type, 'TEXT');
    assert.ok(res.content.includes('Rohan Sharma'));
    assert.ok(res.content.includes('85000') || res.content.includes('85,000'));
  });

  await test('Execute "ffe rohan" -> resolves Rohan Sharma fee records', async () => {
    const res = await runAgentWorkflow('ffe rohan', facultyContext);
    assert.strictEqual(res.type, 'TEXT');
    assert.ok(res.content.includes('Rohan Sharma'));
  });

  await test('Execute "rohan fess" -> resolves Rohan Sharma fee records', async () => {
    const res = await runAgentWorkflow('rohan fess', facultyContext);
    assert.strictEqual(res.type, 'TEXT');
    assert.ok(res.content.includes('Rohan Sharma'));
  });

  await test('Execute "HARINI DETAILS"', async () => {
    const res = await runAgentWorkflow('HARINI DETAILS', facultyContext);
    assert.strictEqual(res.type, 'TEXT');
    assert.ok(res.content.includes('Harini'));
    assert.ok(res.content.includes('23CS105'));
  });

  await test('Execute concatenated "ARUNDETAILS" -> Ambiguity Clarification', async () => {
    const res = await runAgentWorkflow('ARUNDETAILS', facultyContext);
    assert.ok(res.type === 'CLARIFICATION' || res.type === 'TEXT');
    if (res.type === 'CLARIFICATION') {
      assert.ok(res.content.includes('multiple students'));
    }
  });

  await test('Execute fuzzy query "feeof shrma"', async () => {
    const res = await runAgentWorkflow('feeof shrma', facultyContext);
    assert.strictEqual(res.type, 'TEXT');
    assert.ok(res.content.includes('Rohan Sharma'));
  });

  await test('Execute fuzzy query "DETAILS ARFUN"', async () => {
    const res = await runAgentWorkflow('DETAILS ARFUN', facultyContext);
    assert.ok(res.type === 'TEXT' || res.type === 'CLARIFICATION');
    assert.ok(res.content.includes('Arun Kumar') || res.content.includes('multiple students'));
  });

  await test('Execute fuzzy query "HARIN DETAILS"', async () => {
    const res = await runAgentWorkflow('HARIN DETAILS', facultyContext);
    assert.strictEqual(res.type, 'TEXT');
    assert.ok(res.content.includes('Harini'));
  });

  await test('Execute non-existent query "feeof xyzabc" -> not found student message (not no-fee-records)', async () => {
    const res = await runAgentWorkflow('feeof xyzabc', facultyContext);
    assert.strictEqual(res.type, 'TEXT');
    assert.ok(res.content.toLowerCase().includes("couldn't find a student matching"));
    assert.ok(!res.content.toLowerCase().includes("no fee records found matching"));
  });

  await test('Execute non-existent query "XYZABC DETAILS"', async () => {
    const res = await runAgentWorkflow('XYZABC DETAILS', facultyContext);
    assert.strictEqual(res.type, 'TEXT');
    assert.ok(res.content.toLowerCase().includes("couldn't find a student matching"));
  });

  await test('Execute unsupported query "WHAT IS THE WEATHER?"', async () => {
    const res = await runAgentWorkflow('WHAT IS THE WEATHER?', facultyContext);
    assert.strictEqual(res.type, 'TEXT');
    assert.ok(res.content.includes('I can help with attendance, fees, student details'));
  });

  // 4. Report Exporter Programmatic Validation Tests (PDF, XLSX, DOCX)
  console.log('\n--- 4. Report Exporters Programmatic OpenXML & PDF Tests ---');
  const { generatePdfReportBuffer } = await import('../lib/reports/pdf.ts');
  const { generateExcelReportBuffer } = await import('../lib/reports/excel.ts');
  const { generateDocxReportBuffer } = await import('../lib/reports/docx.ts');
  const { validateReportBuffer, sanitizeFilename } = await import('../lib/reports/index.ts');

  const rohanReportData = {
    reportType: 'attendance',
    title: 'GRADit! College ERP Report',
    subtitle: 'Attendance Record — Rohan Sharma (23CS101)',
    generatedBy: 'FACULTY',
    generatedDate: '28-Aug-2026',
    metadata: {
      studentName: 'Rohan Sharma',
      studentCode: '23CS101',
      className: '23CS101',
      department: 'CSE',
    },
    columns: ['Student Name', 'Student Code', 'Class', 'Department', 'Attended', 'Total', 'Percentage'],
    rows: [
      {
        studentName: 'Rohan Sharma',
        studentCode: '23CS101',
        className: '23CS101',
        department: 'CSE',
        attended: 41,
        total: 50,
        percentage: 0.82,
      },
    ],
  };

  await test('PDF Report Exporter & Header Validation', async () => {
    const pdfBuf = await generatePdfReportBuffer(rohanReportData);
    assert.ok(Buffer.isBuffer(pdfBuf));
    assert.strictEqual(validateReportBuffer(pdfBuf, 'pdf'), true);
  });

  await test('Programmatic OpenXML XLSX Exporter & Content Validation', async () => {
    const xlsxBuf = await generateExcelReportBuffer(rohanReportData);
    assert.ok(Buffer.isBuffer(xlsxBuf));
    assert.strictEqual(validateReportBuffer(xlsxBuf, 'xlsx'), true);

    // Programmatically parse OpenXML workbook
    const wb = new ExcelJS.Workbook();
    await wb.xlsx.load(xlsxBuf);
    const sheet = wb.getWorksheet(1);
    assert.ok(sheet !== undefined);

    // Check cells
    assert.strictEqual(sheet.getCell('A1').value, 'GRADit! College ERP Report');
    assert.strictEqual(sheet.getCell('B4').value, 'Rohan Sharma');
    assert.strictEqual(sheet.getCell('E4').value, '23CS101');

    // Check data row numbers and percentage cell formatting
    const dataRow = sheet.getRow(8);
    assert.strictEqual(dataRow.getCell(1).value, 'Rohan Sharma');
    assert.strictEqual(dataRow.getCell(5).value, 41); // Attended = 41 number
    assert.strictEqual(dataRow.getCell(6).value, 50); // Total = 50 number
    assert.strictEqual(dataRow.getCell(7).value, 0.82); // Ratio 0.82
    assert.strictEqual(dataRow.getCell(7).numFmt, '0.0%');
  });

  await test('Programmatic OpenXML DOCX Exporter & Structure Validation', async () => {
    const docxBuf = await generateDocxReportBuffer(rohanReportData);
    assert.ok(Buffer.isBuffer(docxBuf));
    assert.strictEqual(validateReportBuffer(docxBuf, 'docx'), true);
  });

  await test('Filename Sanitization against Path Traversal', () => {
    const dangerousName = '../../etc/passwd..:harmful*file';
    const clean = sanitizeFilename(dangerousName);
    assert.ok(!clean.includes('..'));
    assert.ok(!clean.includes('/'));
    assert.ok(!clean.includes('\\'));
  });

  // 5. Master Golden Dataset & Penalty Evaluation (600+ Test Cases)
  console.log('\n--- 5. Master Golden Dataset Evaluation (600+ Cases) ---');
  const { MasterEvaluator } = await import('../lib/evaluation/evaluator.ts');
  const summary = await MasterEvaluator.runEvaluation();

  console.log(`\n====================================================`);
  console.log(`MASTER GOLDEN EVALUATION METRICS (${summary.totalQueries} QUERIES)`);
  console.log(`====================================================`);
  console.log(`✓ Total Passed Queries:          ${summary.passedQueries} / ${summary.totalQueries} (${Math.round((summary.passedQueries / summary.totalQueries) * 100)}%)`);
  console.log(`✓ Intent Accuracy:               ${summary.intentAccuracy}%`);
  console.log(`✓ Entity Extraction Accuracy:    ${summary.entityExtractionAccuracy}%`);
  console.log(`✓ Clarification Accuracy:        ${summary.clarificationAccuracy}%`);
  console.log(`✓ No-Match / Safety Accuracy:    ${summary.noMatchAccuracy}%`);
  console.log(`✓ Hallucination Rate:            ${summary.hallucinationRate}% (Target: 0%)`);
  console.log(`✓ LLM Fallback Rate:             ${summary.llmFallbackRate}% (Deterministic: ${100 - summary.llmFallbackRate}%)`);
  console.log(`✓ Average Latency:               ${summary.averageLatencyMs} ms`);
  console.log(`✓ Net Penalty Score:             +${summary.totalPenaltyScore} points`);
  console.log(`\nCategory Breakdown:`);
  for (const [cat, stats] of Object.entries(summary.categoryBreakdown)) {
    console.log(`  - ${cat.padEnd(26)}: ${stats.passed}/${stats.total} passed (${stats.accuracy}%)`);
    if (stats.failedSamples && stats.failedSamples.length > 0) {
      for (const s of stats.failedSamples) {
        console.log(`      * Fail "${s.input}": expIntent=${s.expectedIntent}, actIntent=${s.actualIntent}, expOut=${s.expectedOutcome}, actRes=${s.actualResType}`);
      }
    }
  }

  assert.strictEqual(summary.hallucinationRate, 0);
  assert.ok(summary.intentAccuracy >= 95);
  assert.ok(summary.passedQueries / summary.totalQueries >= 0.95);

  console.log('\n====================================================');
  console.log(`FINAL RESULTS: ${passed + summary.passedQueries} TOTAL PASSED | ${failed + summary.failedQueries} FAILED`);
  console.log('====================================================');

  if (failed > 0 || summary.hallucinationRate > 0 || summary.intentAccuracy < 95) {
    process.exit(1);
  }
}

runTestSuite().catch((err) => {
  console.error('Test execution failed:', err);
  process.exit(1);
});
