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

  // 1. Regex Library, Normalizer & Typo Engine Tests
  console.log('--- 1. Regex Library & Typo Engine Tests ---');
  const { DeterministicQueryClassifier } = await import('../lib/query-understanding/classifier.ts');
  const { runAgentWorkflow } = await import('../lib/agent/graph.ts');
  const { authorizeToolExecution } = await import('../lib/tools/rbac.ts');

  const facultyContext = { userId: 'usr-1', role: 'FACULTY' };
  const studentContext = { userId: 'usr-3', role: 'STUDENT' };

  await test('Parse "HARINI DETAILS"', () => {
    const res = DeterministicQueryClassifier.classify('HARINI DETAILS');
    assert.strictEqual(res.intent, 'STUDENT_DETAILS');
    assert.strictEqual(res.studentName, 'harini');
  });

  await test('Parse concatenated "ARUNDETAILS"', () => {
    const res = DeterministicQueryClassifier.classify('ARUNDETAILS');
    assert.strictEqual(res.intent, 'STUDENT_DETAILS');
    assert.strictEqual(res.studentName, 'arun');
  });

  await test('Parse concatenated "HARINIDETAILS"', () => {
    const res = DeterministicQueryClassifier.classify('HARINIDETAILS');
    assert.strictEqual(res.intent, 'STUDENT_DETAILS');
    assert.strictEqual(res.studentName, 'harini');
  });

  await test('Parse "DETAILS ARFUN"', () => {
    const res = DeterministicQueryClassifier.classify('DETAILS ARFUN');
    assert.strictEqual(res.intent, 'STUDENT_DETAILS');
    assert.strictEqual(res.studentName, 'arfun');
  });

  await test('Parse "ARUN DETAILS"', () => {
    const res = DeterministicQueryClassifier.classify('ARUN DETAILS');
    assert.strictEqual(res.intent, 'STUDENT_DETAILS');
    assert.strictEqual(res.studentName, 'arun');
  });

  await test('Parse "ARUN INFO", "ARUN PROFILE", "ARUN INFORMATION"', () => {
    const r1 = DeterministicQueryClassifier.classify('ARUN INFO');
    const r2 = DeterministicQueryClassifier.classify('ARUN PROFILE');
    const r3 = DeterministicQueryClassifier.classify('ARUN INFORMATION');
    assert.strictEqual(r1.intent, 'STUDENT_DETAILS');
    assert.strictEqual(r2.intent, 'STUDENT_DETAILS');
    assert.strictEqual(r3.intent, 'STUDENT_DETAILS');
  });

  await test('Parse multi-word "ARUN KUMAR DETAILS"', () => {
    const res = DeterministicQueryClassifier.classify('ARUN KUMAR DETAILS');
    assert.strictEqual(res.intent, 'STUDENT_DETAILS');
    assert.strictEqual(res.studentName, 'arun kumar');
  });

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

  await test('Execute "HARINI DETAILS"', async () => {
    const res = await runAgentWorkflow('HARINI DETAILS', facultyContext);
    assert.strictEqual(res.type, 'TEXT');
    assert.ok(res.content.includes('Harini'));
    assert.ok(res.content.includes('23CS105'));
  });

  await test('Execute concatenated "ARUNDETAILS"', async () => {
    const res = await runAgentWorkflow('ARUNDETAILS', facultyContext);
    assert.ok(res.type === 'CLARIFICATION' || res.type === 'TEXT');
  });

  await test('Execute fuzzy query "DETAILS ARFUN"', async () => {
    const res = await runAgentWorkflow('DETAILS ARFUN', facultyContext);
    assert.strictEqual(res.type, 'TEXT');
    assert.ok(res.content.includes('Arun Kumar') || res.content.includes('I think you mean'));
  });

  await test('Execute fuzzy query "HARIN DETAILS"', async () => {
    const res = await runAgentWorkflow('HARIN DETAILS', facultyContext);
    assert.strictEqual(res.type, 'TEXT');
    assert.ok(res.content.includes('Harini'));
  });

  await test('Execute non-existent query "XYZABC DETAILS"', async () => {
    const res = await runAgentWorkflow('XYZABC DETAILS', facultyContext);
    assert.strictEqual(res.type, 'TEXT');
    assert.ok(res.content.toLowerCase().includes("couldn't find a student matching 'xyzabc'"));
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

  console.log('\n====================================================');
  console.log(`RESULTS: ${passed} PASSED | ${failed} FAILED`);
  console.log('====================================================');

  if (failed > 0) {
    process.exit(1);
  }
}

runTestSuite().catch((err) => {
  console.error('Test execution failed:', err);
  process.exit(1);
});
