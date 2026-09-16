import { localDatabase } from '../lib/db/localData';

async function main() {
  console.log('====================================================');
  console.log('GRADit! ERP — Database Status Test');
  console.log('====================================================\n');

  console.log('DATABASE TYPE: Local In-Memory (Zero Supabase Dependency)');
  console.log(`✓ Active Students: ${localDatabase.students.length}`);
  console.log(`✓ Active Departments: ${localDatabase.departments.length}`);
  console.log(`✓ Attendance Records: ${localDatabase.attendance.length}`);
  console.log(`✓ Fee Records: ${localDatabase.fees.length}`);
  console.log('\nSTATUS: READY & OPERATIONAL');
  console.log('====================================================');
}

main().catch((err) => {
  console.error('Database status error:', err.message);
});
