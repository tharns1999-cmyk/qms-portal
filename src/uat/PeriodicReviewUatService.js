import useStore, { getInitialStoreState } from '../store/useStore';
import { UAT_DATASET } from './periodicReviewUatDataset';
import { UAT_PERSONAS } from './periodicReviewUatPersonas';

export const UAT_REFERENCE_DATE = '2026-07-20';

export class PeriodicReviewUatService {
  static getDatasetVersion() {
    return useStore.getState().uatDatasetVersion;
  }

  static getSeedMetrics() {
    const state = useStore.getState();
    return {
      documents: state.documents?.length || 0,
      externalDocuments: state.externalDocuments?.length || 0,
      schedules: state.periodicReviewSchedules?.length || 0,
      dars: state.dars?.length || 0,
      tasks: state.tasks?.length || 0,
      records: state.periodicReviewRecords?.length || 0,
    };
  }

  static seedBaseline() {
    // 1. Start from clean initial mock data
    const initialState = getInitialStoreState();
    
    // 2. Clear out normal mocks that could conflict
    initialState.documents = [];
    initialState.externalDocuments = [];
    initialState.dars = [];
    initialState.tasks = [];
    initialState.periodicReviewSchedules = [];
    initialState.periodicReviewTasks = [];
    initialState.periodicReviewRecords = [];

    // 3. Flat aggregate all TD-PR records
    Object.values(UAT_DATASET).forEach(td => {
      if (td === 'PERIODIC_REVIEW_UAT_V1') return; // version string
      if (td.documents) initialState.documents.push(...td.documents);
      if (td.externalDocuments) initialState.externalDocuments.push(...td.externalDocuments);
      if (td.dars) initialState.dars.push(...td.dars);
      if (td.tasks) initialState.tasks.push(...td.tasks); // includes both normal tasks and PR tasks in the mock
      if (td.periodicReviewSchedules) initialState.periodicReviewSchedules.push(...td.periodicReviewSchedules);
      if (td.periodicReviewRecords) initialState.periodicReviewRecords.push(...td.periodicReviewRecords);
    });
    
    // We only need tasks for the timeline, PR tasks are treated as generic tasks in the dashboard
    // so we can put PR tasks in tasks for simplicity, or keep them in periodicReviewTasks.
    // The dataset puts them in 'tasks' and 'periodicReviewTasks' depending on interpretation.
    // Let's duplicate PR tasks to periodicReviewTasks to be safe.
    initialState.periodicReviewTasks = [...initialState.tasks];

    // 4. Default Persona
    initialState.currentUser = { ...UAT_PERSONAS['P-001'] };
    
    // 5. Version marker
    initialState.uatDatasetVersion = UAT_DATASET.version;
    initialState.uatReferenceDate = UAT_REFERENCE_DATE;

    // 6. Direct Zustand state replacement (bypassing normal action methods)
    useStore.setState(initialState, true); // true = replace
  }

  static switchPersona(personaId) {
    if (!UAT_PERSONAS[personaId]) throw new Error(`Invalid persona ID: ${personaId}`);
    useStore.setState({ currentUser: { ...UAT_PERSONAS[personaId] } });
  }

  static clearStorage() {
    // Remove the explicit UAT key without touching dev key
    localStorage.removeItem('qms-periodic-review-uat-v1');
    window.location.reload();
  }
}
