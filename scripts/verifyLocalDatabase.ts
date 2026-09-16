import { localDatabase } from '../lib/db/localData';
import { dbClient } from '../lib/db/client';

async function verifyLocalDatabase() {
  console.log('====================================================');
  console.log('GRADit! ERP — Local Database Integrity Verification');
  console.log('====================================================\n');

  // 1. Student Count & Department Distribution
  const totalStudents = localDatabase.students.length;
  console.log(`✓ Total Students in Local Database: ${totalStudents} (Expected: 200)`);
  if (totalStudents !== 200) {
    throw new Error(`Student count mismatch: expected 200, found ${totalStudents}`);
  }

  const deptCounts: Record<string, number> = {};
  for (const s of localDatabase.students) {
    deptCounts[s.department_id] = (deptCounts[s.department_id] || 0) + 1;
  }
  console.log('  Department Distribution:');
  for (const [dept, count] of Object.entries(deptCounts)) {
    console.log(`    - ${dept}: ${count} students`);
  }

  // 2. Classes & Subjects
  console.log(`\n✓ Total Classes: ${localDatabase.classes.length}`);
  console.log(`✓ Total Subjects: ${localDatabase.subjects.length}`);

  // 3. Attendance Records
  const totalAttendance = localDatabase.attendance.length;
  console.log(`✓ Total Attendance Records: ${totalAttendance} (Expected: 10000)`);
  if (totalAttendance !== 10000) {
    throw new Error(`Attendance count mismatch: expected 10000, found ${totalAttendance}`);
  }

  // 4. Fee Records
  const totalFees = localDatabase.fees.length;
  console.log(`✓ Total Fee Records: ${totalFees}`);

  // 5. Query Speed & Performance Benchmarks
  console.log('\n--- Benchmarking DatabaseClient Methods ---');
  const t0 = Date.now();
  const rohanAtt = await dbClient.getStudentAttendance({ studentCode: '23CS101' });
  const t1 = Date.now();
  console.log(`✓ Attendance Query Latency: ${t1 - t0} ms (Rohan Sharma: ${rohanAtt[0]?.summary.percentage}%)`);

  const t2 = Date.now();
  const rohanFees = await dbClient.getStudentFees({ studentCode: '23CS101' });
  const t3 = Date.now();
  console.log(`✓ Fee Query Latency: ${t3 - t2} ms (Total: ₹${rohanFees[0]?.summary.totalAmount}, Status: ${rohanFees[0]?.summary.status})`);

  const t4 = Date.now();
  const pending = await dbClient.getPendingFees({});
  const t5 = Date.now();
  console.log(`✓ Pending Fees Query Latency: ${t5 - t4} ms (Total Defaulters: ${pending.length})`);

  const t6 = Date.now();
  const lowAtt = await dbClient.getLowAttendanceStudents({ threshold: 75 });
  const t7 = Date.now();
  console.log(`✓ Low Attendance Query Latency: ${t7 - t6} ms (Below 75%: ${lowAtt.length})`);

  console.log('\n====================================================');
  console.log('LOCAL DATABASE VERIFICATION PASSED SUCCESSFULLY (100%)');
  console.log('====================================================');
}

verifyLocalDatabase().catch((err) => {
  console.error('Verification failed:', err);
  process.exit(1);
});
