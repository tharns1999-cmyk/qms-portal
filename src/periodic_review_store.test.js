import { describe, it, expect, beforeEach } from 'vitest';
import useStore from './store/useStore';

describe('Periodic Review DAR Idempotency and Linkage', () => {
  beforeEach(() => {
    // Reset store state for testing
    useStore.setState({
      periodicReviewSchedules: [
        {
          id: 'PR-TEST-1',
          documentId: 'DOC-1',
          status: 'IN_PROGRESS',
          dueState: 'DUE_TODAY'
        }
      ],
      periodicReviewTasks: [],
      periodicReviewRecords: []
    });
  });

  it('submit creates one Revision draft linkage', () => {
    const store = useStore.getState();
    store.submitPeriodicReview('PR-TEST-1', 'REVISION_REQUIRED', 'Needs update', 'DAR-123', 'SUCCESS', 'PERIODIC_REVIEW_PR-TEST-1_REVISION');
    
    const updatedSchedule = useStore.getState().periodicReviewSchedules.find(s => s.id === 'PR-TEST-1');
    expect(updatedSchedule.status).toBe('IN_PROGRESS');
    expect(updatedSchedule.outcome).toBe('REVISION_REQUIRED');
    expect(updatedSchedule.linkedActionId).toBe('DAR-123');
    expect(updatedSchedule.linkageStatus).toBe('SUCCESS');
    expect(updatedSchedule.idempotencyKey).toBe('PERIODIC_REVIEW_PR-TEST-1_REVISION');
  });

  it('submit creates one Obsolete draft linkage', () => {
    const store = useStore.getState();
    store.submitPeriodicReview('PR-TEST-1', 'OBSOLETE_REQUIRED', 'Not needed', 'DAR-124', 'SUCCESS', 'PERIODIC_REVIEW_PR-TEST-1_OBSOLETE');
    
    const updatedSchedule = useStore.getState().periodicReviewSchedules.find(s => s.id === 'PR-TEST-1');
    expect(updatedSchedule.outcome).toBe('OBSOLETE_REQUIRED');
    expect(updatedSchedule.linkedActionId).toBe('DAR-124');
    expect(updatedSchedule.idempotencyKey).toBe('PERIODIC_REVIEW_PR-TEST-1_OBSOLETE');
  });

  it('retry after failure creates no duplicate', () => {
    const store = useStore.getState();
    store.submitPeriodicReview('PR-TEST-1', 'REVISION_REQUIRED', 'Needs update', null, 'FAILED', 'PERIODIC_REVIEW_PR-TEST-1_REVISION');
    
    let updatedSchedule = useStore.getState().periodicReviewSchedules.find(s => s.id === 'PR-TEST-1');
    expect(updatedSchedule.linkageStatus).toBe('FAILED');
    expect(updatedSchedule.linkedActionId).toBeUndefined();
    
    // Retry
    useStore.getState().retryPeriodicReviewLinkage('PR-TEST-1', 'DAR-RETRY');
    
    updatedSchedule = useStore.getState().periodicReviewSchedules.find(s => s.id === 'PR-TEST-1');
    expect(updatedSchedule.linkageStatus).toBe('SUCCESS');
    expect(updatedSchedule.linkedActionId).toBe('DAR-RETRY');
  });
});
