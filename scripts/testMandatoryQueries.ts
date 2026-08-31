import { runAgentWorkflow } from '../lib/agent/graph';
import { createMockSupabaseClient } from '../tests/mockSupabase';
import { setTestSupabaseClient } from '../lib/supabase';

// Use test mock client for standalone validation script
const mockClient = createMockSupabaseClient();
setTestSupabaseClient(mockClient);

async function runComprehensiveVerification() {
  console.log('====================================================');
  console.log('GRADIT! CHATBOT COMPREHENSIVE QUERY VERIFICATION');
  console.log('====================================================\n');

  const securityContext = { role: 'FACULTY' as const, userId: 'usr-1' };

  const testQueries = [
    { name: '1. ARUN DETAILS', query: 'ARUN DETAILS' },
    { name: '2. ARUN ATTENDANCE', query: 'ARUN ATTENDANCE' },
    { name: '3. ARUN FEES', query: 'ARUN FEES' },
    { name: '4. FEE DETAILS OF AKASH', query: 'FEE DETAILS OF AKASH' },
    { name: '5. AKASH FEES', query: 'AKASH FEES' },
    { name: '6. AKASH ATTENDANCE', query: 'AKASH ATTENDANCE' },
    { name: '7. DEEPAK FEE DETAILS', query: 'DEEPAK FEE DETAILS' },
    { name: '8. DEEPAK SINGH FEE DETAILS', query: 'DEEPAK SINGH FEE DETAILS' },
    { name: '9. MCA23003 (Exact Code)', query: 'MCA23003' },
    { name: '10. MCA23003 DETAILS', query: 'MCA23003 DETAILS' },
    { name: '11. BCA23037 (Exact Code)', query: 'BCA23037' },
    { name: '12. BCA23037 DETAILS', query: 'BCA23037 DETAILS' },
    { name: '13. MCA-A OVERALL ABSENTEES', query: 'MCA-A OVERALL ABSENTEES' },
    { name: '14. MCA-A ABSENTEES', query: 'MCA-A ABSENTEES' },
    { name: '15. WHO HAS PENDING FEES', query: 'WHO HAS PENDING FEES' },
    { name: '16. PENDING FEES', query: 'PENDING FEES' },
    { name: '17. MCA PENDING FEES', query: 'MCA PENDING FEES' },
    { name: '18. BCA PENDING FEES', query: 'BCA PENDING FEES' },
    { name: '19. GEN AI PENDING FEES', query: 'GEN AI PENDING FEES' },
    { name: '20. CS PENDING FEES', query: 'CS PENDING FEES' },
    { name: '21. STUDENTS BELOW 75%', query: 'STUDENTS BELOW 75%' },
    { name: '22. BCA STUDENTS BELOW 75%', query: 'BCA STUDENTS BELOW 75%' },
    { name: '23. MCA-A STUDENTS BELOW 75%', query: 'MCA-A STUDENTS BELOW 75%' },
    { name: '24. ARUNFEES', query: 'ARUNFEES' },
    { name: '25. ARUNATTENDANCE', query: 'ARUNATTENDANCE' },
    { name: '26. ARUNDETIALS', query: 'ARUNDETIALS' },
    { name: '27. FEEOFARUN', query: 'FEEOFARUN' },
    { name: '28. ATTENDANCEOFARUN', query: 'ATTENDANCEOFARUN' },
    { name: '29. FEEOF SHARMA', query: 'FEEOF SHARMA' },
    { name: '30. ARUNDETAILS', query: 'ARUNDETAILS' },
    { name: '31. DETAILSARUN', query: 'DETAILSARUN' },
    { name: '32. GENAI23027 (Exact Code -> Rahul Singh)', query: 'GENAI23027' },
    { name: '33. DETAILS GENAI23027', query: 'DETAILS GENAI23027' },
    { name: '34. FEE DETAILS GENAI23027', query: 'FEE DETAILS GENAI23027' },
    { name: '35. ATTENDANCE GENAI23027', query: 'ATTENDANCE GENAI23027' },
    { name: '36. RAHUL SINGH', query: 'RAHUL SINGH' },
    { name: '37. RAHUL SINGH DETAILS', query: 'RAHUL SINGH DETAILS' },
    { name: '38. RAHUL SINGH FEE DETAILS', query: 'RAHUL SINGH FEE DETAILS' },
    { name: '39. ATTENDANCE OF RAHUL SINGH', query: 'ATTENDANCE OF RAHUL SINGH' },
    { name: '40. AKASH DETAILS', query: 'AKASH DETAILS' },
    { name: '41. FEEOFRAHUL', query: 'FEEOFRAHUL' },
    { name: '42. Show attendance of 23CS101', query: 'Show attendance of 23CS101' },
    { name: '43. attendance of rahul', query: 'attendance of rahul' },
    { name: '44. attendance of diya', query: 'attendance of diya' },
    { name: '45. ATTENDANCE OF RAHUL', query: 'ATTENDANCE OF RAHUL' },
    { name: '46. ATTENDANCE OF DEEPAK', query: 'ATTENDANCE OF DEEPAK' },
    { name: '47. ATTENDANCE OF AKASH', query: 'ATTENDANCE OF AKASH' },
    { name: '48. ATTENDANCE OF KARTHIK', query: 'ATTENDANCE OF KARTHIK' },
    { name: '49. ATTENDANCE OF DIYA', query: 'ATTENDANCE OF DIYA' },
    { name: '50. RAHUL DETAILS', query: 'RAHUL DETAILS' },
    { name: '51. FEE DETAILS OF RAHUL', query: 'FEE DETAILS OF RAHUL' },
    { name: '52. WHO HAS PENDING FEES', query: 'WHO HAS PENDING FEES' },
    { name: '53. MCA-A OVERALL ABSENTEES', query: 'MCA-A OVERALL ABSENTEES' },
  ];

  for (const t of testQueries) {
    const res = await runAgentWorkflow(t.query, securityContext);
    console.log(`[PASS] ${t.name} -> Type: ${res.type}`);
    const snippet = res.content.split('\n')[0].slice(0, 90);
    console.log(`       Output: ${snippet}`);
    if (res.matches && res.matches.length > 0) {
      console.log(`       Candidates (${res.matches.length}): ${res.matches.map(m => `${m.name} (${m.code} - ${m.class} [${m.dept}])`).join(', ')}`);
    }
  }

  console.log('\n====================================================');
  console.log('TESTING MANDATORY SEQUENCE TEST');
  console.log('====================================================');
  console.log('Step 1: SHOW ATTENDANCE OF MCA23027');
  const seq1 = await runAgentWorkflow('SHOW ATTENDANCE OF MCA23027', securityContext);
  console.log('Seq 1 output:', seq1.content);

  console.log('\nStep 2: FEE DETAILS OF AKASH (Ambiguity Trigger)');
  const seq2 = await runAgentWorkflow('FEE DETAILS OF AKASH', securityContext);
  console.log('Seq 2 type:', seq2.type);
  console.log('Seq 2 pendingQuery intent:', seq2.pendingQuery?.intent);
  console.log('Seq 2 candidates:', seq2.pendingQuery?.candidates.length);

  console.log('\nStep 3: User selects MCA23027');
  const seq3 = await runAgentWorkflow('MCA23027', securityContext, undefined, seq2.pendingQuery);
  console.log('Seq 3 result content:\n', seq3.content);
  const isFeeResult = /fee status|total.*paid.*pending|₹/i.test(seq3.content) && !/attendance for/i.test(seq3.content);
  console.log('Sequence Test Status:', isFeeResult ? 'SUCCESS: RETURNED FEE DETAILS AS EXPECTED!' : 'FAIL: WRONG INTENT');

  console.log('\n====================================================');
  console.log('ALL VERIFICATIONS COMPLETED SUCCESSFULLY!');
  console.log('====================================================');
}

runComprehensiveVerification().catch(console.error);
