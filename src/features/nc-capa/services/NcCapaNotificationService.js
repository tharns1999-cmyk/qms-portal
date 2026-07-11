import useStore from '../../../store/useStore';

class NcCapaNotificationService {
  /**
   * Send a notification to a specific user
   */
  notifyUser(userId, title, message, link = '/nc-capa', relatedTaskId = null) {
    // In Phase 11B, we just facade the global store's mock notification system
    useStore.getState().addNotification(userId, title, message, link, relatedTaskId);
  }

  notifyNCScreening(nc, qaUserId) {
    this.notifyUser(
      qaUserId,
      'New NC Requires Screening',
      `NC ${nc.ncNumber || 'Draft'} has been submitted and requires QA/QC screening.`,
      `/nc-capa/${nc.id}`
    );
  }

  notifyNCReturned(nc) {
    this.notifyUser(
      nc.reportedByUserId,
      'NC Returned for Information',
      `NC ${nc.ncNumber} has been returned for more information by QA/QC.`,
      `/nc-capa/${nc.id}`
    );
  }

  notifyNCRejected(nc) {
    this.notifyUser(
      nc.reportedByUserId,
      'NC Rejected',
      `NC ${nc.ncNumber} was rejected by QA/QC as Not NC.`,
      `/nc-capa/${nc.id}`
    );
  }

  notifyNCAssigned(nc) {
    if (nc.assignedOwnerUserId) {
      this.notifyUser(
        nc.assignedOwnerUserId,
        'NC Assigned (CAPA Required)',
        `NC ${nc.ncNumber} has been assigned to you. Root Cause Analysis is required.`,
        `/nc-capa/${nc.id}`
      );
    }
  }

  notifyCorrectionOnly(nc) {
    // Notify creator or QA that it's just correction only and needs verification
    this.notifyUser(
      nc.reportedByUserId,
      'NC Accepted (Correction Only)',
      `NC ${nc.ncNumber} requires only correction. QA Verification is pending.`,
      `/nc-capa/${nc.id}`
    );
  }
}

export const ncCapaNotificationService = new NcCapaNotificationService();
