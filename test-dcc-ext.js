import useStore from './src/store/useStore.js';

// Mock localStorage for Zustand persist
global.localStorage = {
  getItem: () => null,
  setItem: () => {},
  removeItem: () => {},
};

async function runTests() {
  console.log("Loading store for DCC and External Docs...");
  const store = useStore.getState();
  const results = [];
  
  const logTest = (name, result, details = '') => {
    results.push({ name, result: result ? 'PASSED' : 'FAILED', details });
  };

  try {
    const dccAdmin = { id: 'U001', name: 'Admin', role: 'DCC_ADMIN', dept: 'DCC', department: 'DCC' };
    const userA = { id: 'U002', name: 'User A', role: 'USER', dept: 'PD', department: 'PD' };
    const userB = { id: 'U003', name: 'User B', role: 'USER', dept: 'QC', department: 'QC' };

    // Set mock user manually for some store operations that rely on state.currentUser
    useStore.setState({ currentUser: dccAdmin });

    // Ensure we have a document to test with
    const mockDoc = {
      id: 'mock-doc-1',
      title: 'Mock Procedure',
      name: 'Test Document',
      rev: '00',
      status: 'EFFECTIVE',
      department: 'QA',
      distributions: [{ dept: 'PD' }, { dept: 'QC' }]
    };
    useStore.setState({ documents: [...store.documents, mockDoc] });

    console.log("1. Testing Distribution...");
    store.issueControlledCopy(mockDoc.title, 'PD');
    store.issueControlledCopy(mockDoc.title, 'QC');
    let instances = useStore.getState().controlledCopyInstances.filter(c => c.docId === mockDoc.id);
    logTest("Controlled Copy Distribution", instances.length === 2, "Should create 2 controlled copies for PD and QC.");
    
    // Simulate PD confirming receipt
    const pdInst = instances.find(c => c.department === 'PD');
    if (pdInst) {
      useStore.setState({ currentUser: userA });
      store.confirmCcReceipt(pdInst.id);
      let updatedPdInst = useStore.getState().controlledCopyInstances.find(c => c.id === pdInst.id);
      logTest("Distribution Receipt Confirmation", updatedPdInst.status === 'ACTIVE', "PD confirmed receipt and status is ACTIVE.");
    }

    console.log("2. Testing Report Damaged / Lost...");
    if (pdInst) {
      store.reportCcDamagedLost(pdInst.id, 'DAMAGED', 'Coffee spilled on document');
      let damagedInst = useStore.getState().controlledCopyInstances.find(c => c.id === pdInst.id);
      logTest("Report Damaged", damagedInst.status === 'REPLACEMENT_REQUESTED' && damagedInst.reportType === 'DAMAGED', "Document status changed to REPLACEMENT_REQUESTED.");
      
      // Check task generated
      let tasks = useStore.getState().tasks.filter(t => t.type === 'CC_REPLACEMENT_APPROVAL');
      logTest("Replacement Task Generated", tasks.length > 0, "Task for replacement approval should be generated.");
      
      console.log("3. Testing Approve / Reject Replacement...");
      useStore.setState({ currentUser: dccAdmin }); // Assume DCC or manager handles it
      store.approveCcReplacement(tasks[0].id);
      
      let replacedInst = useStore.getState().controlledCopyInstances.find(c => c.ccNumber === pdInst.ccNumber && c.issueNumber === 'I02');
      logTest("Approve Replacement", replacedInst && replacedInst.status === 'PENDING_RECEIPT', "Issue number incremented and status reset for receipt.");
      
      let oldDamagedInst = useStore.getState().controlledCopyInstances.find(c => c.id === pdInst.id);
      logTest("Old Instance Status", oldDamagedInst && oldDamagedInst.status === 'DAMAGED', "Old instance marked as DAMAGED.");

      // Test Reject
      const qcInst = instances.find(c => c.department === 'QC');
      useStore.setState({ currentUser: userB });
      store.confirmCcReceipt(qcInst.id);
      store.reportCcDamagedLost(qcInst.id, 'LOST', 'Lost during audit');
      
      let newTasks = useStore.getState().tasks.filter(t => t.type === 'CC_REPLACEMENT_APPROVAL');
      const rejectTaskId = newTasks[newTasks.length - 1].id;
      
      useStore.setState({ currentUser: dccAdmin });
      store.rejectCcReplacement(rejectTaskId, 'Not approved by manager');
      
      let rejectedInst = useStore.getState().controlledCopyInstances.find(c => c.id === qcInst.id);
      logTest("Reject Replacement", rejectedInst.status === 'ACTIVE', "Document reverted to ACTIVE after rejection.");
    }

    console.log("4. Testing Recall Document...");
    if (pdInst) {
      store.recallControlledCopy(pdInst.id);
      let recalledInst = useStore.getState().controlledCopyInstances.find(c => c.id === pdInst.id);
      logTest("Recall Document", recalledInst.status === 'RECALLED', "Document marked as RECALLED.");
    }

    console.log("5. Testing External Document Confidentiality...");
    // Simulate ExternalDocsList logic
    const testConfidentiality = (doc, user) => {
      const isOwner = doc.ownerId === user.id;
      const isReviewer = doc.reviewerId === user.id;
      const isApprover = doc.approverId === user.id;
      const isAck = doc.acknowledgees?.includes(user.id);
      const isInvolved = isOwner || isReviewer || isApprover || isAck;
      const isAdmin = user.role === 'DCC_ADMIN' || user.isDcc;
      
      if (isAdmin) return true;
      if (doc.accessScope === 'General') return true;
      if (doc.accessScope === 'Department') {
        const uDept = user.department || user.dept;
        return isInvolved || (doc.accessDepartments && doc.accessDepartments.includes(uDept));
      }
      if (doc.accessScope === 'Restricted') {
        return isInvolved || (doc.accessUsers && doc.accessUsers.includes(user.id));
      }
      return false;
    };

    const publicDoc = { id: 'ext-pub', accessScope: 'General' };
    const deptDoc = { id: 'ext-dept', accessScope: 'Department', accessDepartments: ['PD'] };
    const restrictedDoc = { id: 'ext-rest', accessScope: 'Restricted', accessUsers: ['U003'] };

    logTest("Confidentiality: Admin Access All", testConfidentiality(restrictedDoc, dccAdmin), "Admin should access restricted docs.");
    logTest("Confidentiality: Public Access", testConfidentiality(publicDoc, userA) && testConfidentiality(publicDoc, userB), "All users access public doc.");
    logTest("Confidentiality: Department Access", testConfidentiality(deptDoc, userA) && !testConfidentiality(deptDoc, userB), "Only PD user accesses PD dept doc.");
    logTest("Confidentiality: Restricted Access", !testConfidentiality(restrictedDoc, userA) && testConfidentiality(restrictedDoc, userB), "Only specified user accesses restricted doc.");

  } catch (err) {
    console.error(err);
    logTest("Test Execution Error", false, err.message);
  }

  console.log("\n--- DCC & EXTERNAL DOCS TEST RESULTS ---");
  results.forEach(r => console.log(`[${r.result}] ${r.name} - ${r.details}`));
  console.log("--------------------\n");
}

runTests();
