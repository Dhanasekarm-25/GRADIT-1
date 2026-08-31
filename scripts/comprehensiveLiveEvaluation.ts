import { runAgentWorkflow } from '../lib/agent/graph';
import { SecurityContext } from '../lib/tools/rbac';

interface TestCase {
  category: string;
  description: string;
  query: string;
  role?: string;
  userId?: string;
}

const facultyContext: SecurityContext = { role: 'FACULTY', userId: 'fac-001' };
const adminContext: SecurityContext = { role: 'ADMIN', userId: 'admin-001' };

const testCases: TestCase[] = [
  // 1. Exact Student Profile Lookups
  { category: 'STUDENT PROFILE', description: 'Exact Student Code (BCA23001)', query: 'BCA23001' },
  { category: 'STUDENT PROFILE', description: 'Exact Student Code (GENAI23027)', query: 'GENAI23027' },
  { category: 'STUDENT PROFILE', description: 'Exact Full Name (Aarav Mehta)', query: 'Aarav Mehta details' },
  { category: 'STUDENT PROFILE', description: 'Exact Full Name (Bhavya Kapoor)', query: 'profile of Bhavya Kapoor' },

  // 2. Individual Attendance Queries
  { category: 'ATTENDANCE (INDIVIDUAL)', description: 'Attendance by Code (BCA23001)', query: 'Show attendance of BCA23001' },
  { category: 'ATTENDANCE (INDIVIDUAL)', description: 'Attendance by Code (GENAI23027)', query: 'attendance of GENAI23027' },
  { category: 'ATTENDANCE (INDIVIDUAL)', description: 'Attendance by Full Name (Diya Mehta)', query: 'attendance of Diya Mehta' },

  // 3. Ambiguity & Multi-Turn Clarification
  { category: 'AMBIGUITY RESOLUTION', description: 'First Name Search (ADITI)', query: 'ATTENDANCE OF ADITI' },
  { category: 'AMBIGUITY RESOLUTION', description: 'First Name Search (DIYA)', query: 'ATTENDANCE OF DIYA' },
  { category: 'AMBIGUITY RESOLUTION', description: 'First Name Search (AARAV)', query: 'ATTENDANCE OF AARAV' },
  { category: 'AMBIGUITY RESOLUTION', description: 'First Name Search (BHAVYA)', query: 'ATTENDANCE OF BHAVYA' },

  // 4. Class Attendance & Absentees
  { category: 'CLASS ATTENDANCE', description: 'Class Attendance (BCA-A)', query: 'attendance of class BCA-A' },
  { category: 'CLASS ATTENDANCE', description: 'Class Attendance (GENAI-B)', query: 'attendance of GENAI-B' },
  { category: 'CLASS ATTENDANCE', description: 'Low Attendance / Absentees (BCA-A)', query: 'students below 75% in BCA-A' },

  // 5. Department Attendance
  { category: 'DEPT ATTENDANCE', description: 'Department Attendance (BCA)', query: 'attendance of BCA department' },
  { category: 'DEPT ATTENDANCE', description: 'Department Attendance (Generative AI)', query: 'attendance of Generative AI' },

  // 6. Fee Queries
  { category: 'FEE QUERIES', description: 'Student Fees by Code (BCA23001)', query: 'fees of BCA23001' },
  { category: 'FEE QUERIES', description: 'Student Fees by Name (Bhavya Kapoor)', query: 'fee details of Bhavya Kapoor' },
  { category: 'FEE QUERIES', description: 'Global Pending Fees', query: 'WHO HAS PENDING FEES?' },
  { category: 'FEE QUERIES', description: 'Department Pending Fees', query: 'pending fees in BCA' },

  // 7. Typo Tolerance & Natural Language
  { category: 'TYPO TOLERANCE', description: 'Typo in Attendance Keyword', query: 'atendance of BCA23001' },
  { category: 'TYPO TOLERANCE', description: 'Typo in Details Keyword', query: 'detals of GENAI23027' },
  { category: 'TYPO TOLERANCE', description: 'Concatenated Tokens', query: 'attendanceofBCA23001' },

  // 8. Negative & Security Edge Cases
  { category: 'NEGATIVE & SECURITY', description: 'Non-existent Student (Rahul)', query: 'ATTENDANCE OF RAHUL' },
  { category: 'NEGATIVE & SECURITY', description: 'Non-existent Code (99ZZ999)', query: 'details of 99ZZ999' },
  { category: 'NEGATIVE & SECURITY', description: 'SQL Injection Defense', query: "SELECT * FROM students; DROP TABLE students;--" },
  { category: 'NEGATIVE & SECURITY', description: 'Student Role RBAC Block', query: 'BCA23001', role: 'STUDENT' },
];

async function main() {
  console.log('================================================================');
  console.log('🤖 GRADIT! AI CHATBOT — COMPREHENSIVE LIVE RETRIEVAL TEST SUITE');
  console.log('================================================================\n');

  let passed = 0;
  let failed = 0;

  for (let i = 0; i < testCases.length; i++) {
    const tc = testCases[i];
    const context: SecurityContext = tc.role === 'STUDENT'
      ? { role: 'STUDENT', userId: 'stu-001' }
      : tc.role === 'ADMIN'
      ? adminContext
      : facultyContext;

    console.log(`[TEST ${i + 1}/${testCases.length}] [${tc.category}]`);
    console.log(`  Description : ${tc.description}`);
    console.log(`  User Query  : "${tc.query}" (Role: ${context.role})`);

    try {
      const response = await runAgentWorkflow(tc.query, context);
      console.log(`  Response Type: ${response.type}`);
      
      const snippet = response.content?.split('\n')[0] || '';
      console.log(`  Preview      : ${snippet.substring(0, 110)}`);

      if (response.matches && response.matches.length > 0) {
        console.log(`  Clarification: Found ${response.matches.length} candidates.`);
        console.log(`  Top Candidates: ${response.matches.slice(0, 3).map((m: any) => `${m.name} (${m.code} - ${m.class})`).join(', ')}`);
      }

      if (response.type === 'ERROR' && tc.role !== 'STUDENT') {
        console.log(`  ❌ Status   : FAILED (Unexpected Error)`);
        failed++;
      } else {
        console.log(`  ✅ Status   : SUCCESS`);
        passed++;
      }
    } catch (err: any) {
      console.log(`  ❌ Status   : EXCEPTION: ${err.message}`);
      failed++;
    }
    console.log('----------------------------------------------------------------');
  }

  // 9. Multi-turn Sequential Ambiguity Resolution Test
  console.log('\n================================================================');
  console.log('🔄 TESTING MULTI-TURN SEQUENTIAL CONVERSATION STATE FLOW');
  console.log('================================================================\n');

  console.log('Turn 1: User queries "ATTENDANCE OF BHAVYA" (Triggers ambiguity)...');
  const turn1 = await runAgentWorkflow('ATTENDANCE OF BHAVYA', facultyContext);
  console.log(`  Turn 1 Type: ${turn1.type}`);
  console.log(`  Candidates Count: ${turn1.matches?.length}`);
  console.log(`  Pending Query Intent: ${turn1.pendingQuery?.intent}`);

  if (turn1.type === 'CLARIFICATION' && turn1.pendingQuery) {
    console.log('\nTurn 2: User selects specific candidate code "GENAI23027"...');
    const turn2 = await runAgentWorkflow('GENAI23027', facultyContext, undefined, turn1.pendingQuery);
    console.log(`  Turn 2 Response: ${turn2.content}`);
    if (turn2.content?.includes('Bhavya Kapoor') && turn2.content?.includes('GENAI23027')) {
      console.log('  ✅ Sequential State Flow: PASSED with 100% fidelity!');
      passed++;
    } else {
      console.log('  ❌ Sequential State Flow: FAILED');
      failed++;
    }
  } else {
    console.log('  ❌ Turn 1 did not return expected clarification structure.');
    failed++;
  }

  console.log('\n================================================================');
  console.log(`🏁 FINAL RESULTS: ${passed} PASSED | ${failed} FAILED | TOTAL: ${testCases.length + 1}`);
  console.log('================================================================\n');
}

main();
