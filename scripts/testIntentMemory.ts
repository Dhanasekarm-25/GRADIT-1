import { runAgentWorkflow } from '../lib/agent/graph';

async function runTests() {
  console.log('==============================================');
  console.log('TESTING CHATBOT INTENT MEMORY & AMBIGUITY FLOW');
  console.log('==============================================\n');

  // Test 1: FEE DETAILS OF AKASH -> select MCA23027
  console.log('--- Test 1: FEE DETAILS OF AKASH ---');
  const res1 = await runAgentWorkflow('FEE DETAILS OF AKASH', { role: 'FACULTY', userId: 'usr-1' });
  console.log('Step 1 response type:', res1.type);
  console.log('Step 1 pending query intent:', res1.pendingQuery?.intent);
  console.log('Step 1 candidates count:', res1.pendingQuery?.candidates.length);

  const res1_resolve = await runAgentWorkflow('MCA23027', { role: 'FACULTY', userId: 'usr-1' }, undefined, res1.pendingQuery);
  console.log('Step 2 resolved content:\n', res1_resolve.content);
  console.log('Is Fee Report?:', /fee|paid|balance/i.test(res1_resolve.content) && !/attendance percentage/i.test(res1_resolve.content) ? 'YES (PASS)' : 'NO (FAIL)');
  console.log('\n');

  // Test 2: AKASH ATTENDANCE -> select MCA23027
  console.log('--- Test 2: AKASH ATTENDANCE ---');
  const res2 = await runAgentWorkflow('AKASH ATTENDANCE', { role: 'FACULTY', userId: 'usr-1' });
  console.log('Step 1 response type:', res2.type);
  console.log('Step 1 pending query intent:', res2.pendingQuery?.intent);

  const res2_resolve = await runAgentWorkflow('MCA23027', { role: 'FACULTY', userId: 'usr-1' }, undefined, res2.pendingQuery);
  console.log('Step 2 resolved content:\n', res2_resolve.content);
  console.log('Is Attendance?:', /attendance|attended/i.test(res2_resolve.content) ? 'YES (PASS)' : 'NO (FAIL)');
  console.log('\n');

  // Test 3: HARINI DETAILS -> select BCA student (BCA23015)
  console.log('--- Test 3: HARINI DETAILS ---');
  const res3 = await runAgentWorkflow('HARINI DETAILS', { role: 'FACULTY', userId: 'usr-1' });
  console.log('Step 1 response type:', res3.type);
  console.log('Step 1 pending query intent:', res3.pendingQuery?.intent);

  const res3_resolve = await runAgentWorkflow('BCA23015', { role: 'FACULTY', userId: 'usr-1' }, undefined, res3.pendingQuery);
  console.log('Step 2 resolved content:\n', res3_resolve.content);
  console.log('Is Student Profile?:', /student profile|student code/i.test(res3_resolve.content) ? 'YES (PASS)' : 'NO (FAIL)');
  console.log('\n');

  // Test 4: SHARMA FEES -> select BCA student (BCA23001)
  console.log('--- Test 4: SHARMA FEES ---');
  const res4 = await runAgentWorkflow('SHARMA FEES', { role: 'FACULTY', userId: 'usr-1' });
  console.log('Step 1 response type:', res4.type);
  console.log('Step 1 pending query intent:', res4.pendingQuery?.intent);

  const res4_resolve = await runAgentWorkflow('BCA23001', { role: 'FACULTY', userId: 'usr-1' }, undefined, res4.pendingQuery);
  console.log('Step 2 resolved content:\n', res4_resolve.content);
  console.log('Is Fee Report?:', /fee|paid|balance/i.test(res4_resolve.content) ? 'YES (PASS)' : 'NO (FAIL)');
  console.log('\n');

  // Test 5: SHARMA ATTENDANCE -> select MCA student (MCA23001)
  console.log('--- Test 5: SHARMA ATTENDANCE ---');
  const res5 = await runAgentWorkflow('SHARMA ATTENDANCE', { role: 'FACULTY', userId: 'usr-1' });
  console.log('Step 1 response type:', res5.type);
  console.log('Step 1 pending query intent:', res5.pendingQuery?.intent);

  const res5_resolve = await runAgentWorkflow('MCA23001', { role: 'FACULTY', userId: 'usr-1' }, undefined, res5.pendingQuery);
  console.log('Step 2 resolved content:\n', res5_resolve.content);
  console.log('Is Attendance?:', /attendance|attended/i.test(res5_resolve.content) ? 'YES (PASS)' : 'NO (FAIL)');
  console.log('\n');

  console.log('==============================================');
  console.log('ALL 5 AMBIGUITY INTENT TESTS EXECUTED');
  console.log('==============================================');
}

runTests().catch(console.error);
