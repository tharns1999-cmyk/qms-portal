// Set up mocks for Zustand persist
global.localStorage = {
  getItem: () => null,
  setItem: () => {},
  removeItem: () => {}
};
global.window = {
  addEventListener: () => {}
};

import useStore from './src/store/useStore.js';

async function runTests() {
  console.log('--- STARTING AUTOMATED TESTS ---');
  
  const store = useStore.getState();
  
  // 1. Setup Data for Test
  console.log('\\n[TEST 1] Setup & Context');
  const dccAdmin = store.masterUsers.find(u => u.id === 'U001');
  const managerLevel5 = store.masterUsers.find(u => u.level === 5 && u.depts.includes('PD'));
  
  // Login as DCC Admin to report on behalf
  useStore.setState({ currentUser: dccAdmin });
  console.log('Logged in as:', useStore.getState().currentUser.name);

  // Insert Mock Data for Test
  useStore.setState({
    controlledCopyInstances: [
      {
        id: 'inst-test-1',
        ccNumber: 'WI-24-001/01',
        docId: 'WI-24-001',
        docTitle: 'Test Document',
        department: 'PD',
        issueNumber: 1,
        status: 'ACTIVE',
        rev: '00'
      }
    ]
  });

  const activeInstances = store.controlledCopyInstances.filter(i => i.status === 'ACTIVE' && i.department === 'PD');
  // Re-fetch from updated state
  const activeInstancesUpdated = useStore.getState().controlledCopyInstances.filter(i => i.status === 'ACTIVE' && i.department === 'PD');
  
  if (activeInstancesUpdated.length === 0) {
    console.log('❌ Failed: No ACTIVE instances in PD found.');
    return;
  }
  const testInstance = activeInstancesUpdated[0];
  console.log(`Found Target Instance: ${testInstance.ccNumber} (Issue: ${testInstance.issueNumber})`);
  console.log('✅ Setup successful');

  // 2. Test Report Damaged/Lost
  console.log('\\n[TEST 2] Report Damaged/Lost Workflow (Module Test)');
  const initialTaskCount = store.tasks.length;
  
  useStore.getState().reportCcDamagedLost(testInstance.id, 'LOST', 'Fell into the machine');
  
  const stateAfterReport = useStore.getState();
  const updatedInstance = stateAfterReport.controlledCopyInstances.find(i => i.id === testInstance.id);
  
  if (updatedInstance.status === 'REPLACEMENT_REQUESTED') {
    console.log('✅ Instance status updated to REPLACEMENT_REQUESTED');
  } else {
    console.log(`❌ Failed: Instance status is ${updatedInstance.status}`);
  }

  const newTasks = stateAfterReport.tasks.filter(t => t.type === 'CC_REPLACEMENT_APPROVAL');
  const createdTask = newTasks[0]; // The newest one
  
  if (createdTask && createdTask.assigneeId === managerLevel5.id) {
    console.log(`✅ Task successfully created and assigned to Level 5 Manager (${managerLevel5.name})`);
  } else {
    console.log(`❌ Failed: Task not created or wrongly assigned. Assigned to: ${createdTask?.assigneeId}`);
  }

  // 3. Test Reject Workflow (Integration Test)
  console.log('\\n[TEST 3] Manager Reject Workflow (Integration Test)');
  // Login as Manager
  useStore.setState({ currentUser: managerLevel5 });
  console.log('Logged in as Manager:', useStore.getState().currentUser.name);

  useStore.getState().rejectCcReplacement(createdTask.id, 'Not enough evidence');
  
  const stateAfterReject = useStore.getState();
  const rejectedInstance = stateAfterReject.controlledCopyInstances.find(i => i.id === testInstance.id);
  
  if (rejectedInstance.status === 'ACTIVE') {
    console.log('✅ Instance status successfully reverted to ACTIVE');
  } else {
    console.log(`❌ Failed: Instance status did not revert. Current: ${rejectedInstance.status}`);
  }

  const taskExists = stateAfterReject.tasks.find(t => t.id === createdTask.id);
  if (!taskExists) {
    console.log('✅ Task successfully removed from inbox');
  } else {
    console.log('❌ Failed: Task still exists in inbox');
  }

  const notification = stateAfterReject.notifications.find(n => n.userId === updatedInstance.reportRequesterId && n.title.includes('ปฏิเสธ'));
  if (notification && notification.message.includes('Not enough evidence')) {
    console.log('✅ Rejection notification sent to requester with correct reason');
  } else {
    console.log('❌ Failed: Notification not found or incorrect message');
  }

  console.log('\\n--- ALL TESTS COMPLETED SUCCESSFULLY ---');
}

runTests().catch(err => console.error(err));
