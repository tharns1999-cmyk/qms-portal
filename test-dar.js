
import useStore from './src/store/useStore.js';

// Mock localStorage for Zustand persist
global.localStorage = {
  getItem: () => null,
  setItem: () => {},
  removeItem: () => {},
};

async function runTests() {
  console.log("Loading store...");
  const store = useStore.getState();
  const results = [];
  
  const logTest = (name, result, details = '') => {
    results.push({ name, result: result ? 'PASSED' : 'FAILED', details });
  };

  try {
    const requester = { id: 'U002', name: 'Test User', depts: ['PD'] };
    
    // 1. Create New Document DAR
    console.log("Testing New Document DAR...");
    const newDarData = {
      type: 'NEW_DOCUMENT',
      title: 'Test New Document',
      docIdInput: 'DOC-NEW-001',
      docType: 'Procedure',
      department: 'PD',
      reason: 'New process',
      effectiveDate: new Date(Date.now() - 86400000).toISOString().split('T')[0], // yesterday
      files: []
    };
    store.addDar(newDarData, requester);
    
    let latestDar = useStore.getState().dars[useStore.getState().dars.length - 1];
    logTest("New Document DAR Creation", latestDar.title === 'Test New Document' && latestDar.status === 'PENDING_APPROVAL', "DAR should be created and pending approval.");
    
    // Check Tasks generated
    let tasks = useStore.getState().tasks.filter(t => t.darId === latestDar.id);
    logTest("New Document Tasks Generation", tasks.length > 0 && tasks[0].type === 'Approve', "Should generate Approval task.");
    
    // Approve it
    store.processWorkflow(tasks[0].id, 'APPROVE', 'Looks good');
    latestDar = useStore.getState().dars.find(d => d.id === latestDar.id);
    logTest("New Document DAR Approval", latestDar.status === 'APPROVED_WAITING_EFFECTIVE' || latestDar.status === 'WAITING_EFFECTIVE', "Status should move to waiting effective.");

    // Make it effective
    const dccTask = useStore.getState().tasks.find(t => t.darId === latestDar.id && t.type.startsWith('DCC_'));
    if (dccTask) {
        store.processWorkflow(dccTask.id, 'COMPLETE', 'Published');
    }
    // Simulate auto-effective (store.checkSLA)
    store.checkSLA();
    latestDar = useStore.getState().dars.find(d => d.id === latestDar.id);
    logTest("New Document DAR Effective", latestDar.status === 'COMPLETED' || latestDar.status === 'APPROVED_WAITING_EFFECTIVE', "DAR should be COMPLETED or WAITING EFFECTIVE.");
    
    let docs = useStore.getState().documents.filter(d => d.darId === latestDar.id);
    logTest("New Document Added to Master", docs.length === 1 && docs[0].name === 'Test New Document', "Document should be in library.");

    // 2. Test Revision DAR
    console.log("Testing Revision DAR...");
    const docToRevise = docs.length > 0 ? docs[0] : { id: 'MOCK-DOC-ID', docId: 'DOC-NEW-001' };
    const revDarData = {
      type: 'REVISION',
      docIdRef: docToRevise.id,
      title: 'Test New Document v2',
      docIdInput: docToRevise.docId,
      docType: 'Procedure',
      department: 'PD',
      reason: 'Update process',
      effectiveDate: new Date(Date.now() - 86400000).toISOString().split('T')[0],
      files: []
    };
    store.addDar(revDarData, requester);
    latestDar = useStore.getState().dars[useStore.getState().dars.length - 1];
    logTest("Revision DAR Creation", latestDar.type === 'REVISION' && latestDar.status === 'PENDING_APPROVAL', "Revision DAR created.");

    tasks = useStore.getState().tasks.filter(t => t.darId === latestDar.id);
    if(tasks.length > 0) store.processWorkflow(tasks[0].id, 'APPROVE', 'Approved revision');
    store.checkSLA();
    latestDar = useStore.getState().dars.find(d => d.id === latestDar.id);
    logTest("Revision DAR Effective", latestDar.status === 'COMPLETED' || latestDar.status === 'APPROVED_WAITING_EFFECTIVE', "Revision DAR completed or waiting effective.");

    // 3. Test Obsolete DAR
    console.log("Testing Obsolete DAR...");
    const effectiveDocs = useStore.getState().documents.filter(d => d.status === 'EFFECTIVE');
    const docToObsolete = effectiveDocs.length > 0 ? effectiveDocs[0] : { id: 'MOCK-DOC-ID', docId: 'DOC-NEW-001' };
    const obsDarData = {
      type: 'OBSOLETE',
      docIdRef: docToObsolete.id,
      title: 'Test New Document v2',
      reason: 'No longer needed',
      effectiveDate: new Date(Date.now() - 86400000).toISOString().split('T')[0],
    };
    store.addDar(obsDarData, requester);
    latestDar = useStore.getState().dars[useStore.getState().dars.length - 1];
    logTest("Obsolete DAR Creation", latestDar.type === 'OBSOLETE' && latestDar.status === 'PENDING_APPROVAL', "Obsolete DAR created.");

    tasks = useStore.getState().tasks.filter(t => t.darId === latestDar.id);
    if(tasks.length > 0) store.processWorkflow(tasks[0].id, 'APPROVE', 'Approved obsolete');
    store.checkSLA();
    
    // Check if document is inactive
    docs = useStore.getState().documents.filter(d => d.id === obsDarData.docIdRef);
    logTest("Obsolete Document Status", docs.length === 1 && docs[0].status === 'OBSOLETE_ARCHIVED', "Document should be marked as OBSOLETE_ARCHIVED.");

    // 4. External Document
    console.log("Testing External Document...");
    const extDocData = {
      title: 'External Standard',
      docId: 'EXT-001',
      source: 'ISO',
      receivedDate: new Date().toISOString()
    };
    // Need to check what function adds external docs
    if (store.registerExternalDoc) {
      store.registerExternalDoc(extDocData, requester);
      const extDocs = useStore.getState().externalDocuments;
      const addedExt = extDocs.find(d => d.docId === 'EXT-001');
      logTest("External Document Creation", !!addedExt, "External doc added.");
    } else {
      logTest("External Document Creation", false, "registerExternalDoc function not found.");
    }

  } catch (err) {
    console.error(err);
    logTest("Test Execution Error", false, err.message);
  }

  console.log("\n--- TEST RESULTS ---");
  results.forEach(r => console.log(`[${r.result}] ${r.name} - ${r.details}`));
  console.log("--------------------\n");
}

runTests();
