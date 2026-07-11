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

  notifyCapaPlanRequired(nc) {
    if (nc.assignedOwnerUserId) {
      this.notifyUser(
        nc.assignedOwnerUserId,
        'CAPA Plan Required',
        `Root Cause Analysis for NC ${nc.ncNumber} submitted. Please create the CAPA Plan.`,
        `/nc-capa/${nc.id}`
      );
    }
  }

  notifyCapaPlanSubmitted(nc, qaUserId) {
    this.notifyUser(
      qaUserId,
      'CAPA Plan Submitted',
      `CAPA Plan for NC ${nc.ncNumber} has been submitted for QA/QC review.`,
      `/nc-capa/${nc.id}`
    );
  }

  notifyCapaPlanReturned(nc) {
    if (nc.assignedOwnerUserId) {
      this.notifyUser(
        nc.assignedOwnerUserId,
        'CAPA Plan Returned',
        `CAPA Plan for NC ${nc.ncNumber} was returned by QA/QC for correction.`,
        `/nc-capa/${nc.id}`
      );
    }
  }

  notifyCapaPlanApproved(nc) {
    if (nc.assignedOwnerUserId) {
      this.notifyUser(
        nc.assignedOwnerUserId,
        'CAPA Plan Approved',
        `CAPA Plan for NC ${nc.ncNumber} was approved. Please begin execution.`,
        `/nc-capa/${nc.id}`
      );
    }
  }

  notifyActionAssigned(nc, action) {
    if (action.responsibleUserId) {
      this.notifyUser(
        action.responsibleUserId,
        'Action Assigned',
        `You have been assigned an action for NC ${nc.ncNumber}.`,
        `/nc-capa/${nc.id}`
      );
    }
  }

  notifyActionStarted(nc, action) {
    // Notify NC owner or QA
    if (nc.assignedOwnerUserId) {
      this.notifyUser(
        nc.assignedOwnerUserId,
        'Action Started',
        `Execution started for action on NC ${nc.ncNumber}.`,
        `/nc-capa/${nc.id}`
      );
    }
  }

  notifyActionSubmitted(nc, action) {
    // Need to notify QA users with VERIFY permission, we'll mock to reportedByUserId for now, or just generic admin.
    this.notifyUser(
      nc.reportedByUserId,
      'Action Submitted for Verification',
      `Action on NC ${nc.ncNumber} submitted for verification.`,
      `/nc-capa/${nc.id}`
    );
  }

  notifyActionReturned(nc, action) {
    if (action.responsibleUserId) {
      this.notifyUser(
        action.responsibleUserId,
        'Action Returned for Correction',
        `Your action on NC ${nc.ncNumber} was returned for correction.`,
        `/nc-capa/${nc.id}`
      );
    }
  }

  notifyActionFailed(nc, action) {
    if (action.responsibleUserId) {
      this.notifyUser(
        action.responsibleUserId,
        'Action Failed Verification',
        `Your action on NC ${nc.ncNumber} failed QA verification.`,
        `/nc-capa/${nc.id}`
      );
    }
  }

  notifyActionVerified(nc, action) {
    if (action.responsibleUserId) {
      this.notifyUser(
        action.responsibleUserId,
        'Action Verified',
        `Your action on NC ${nc.ncNumber} passed QA verification.`,
        `/nc-capa/${nc.id}`
      );
    }
  }

  notifyAllActionsVerified(nc) {
    if (nc.assignedOwnerUserId) {
      this.notifyUser(
        nc.assignedOwnerUserId,
        'All Actions Verified',
        `All CAPA actions verified for NC ${nc.ncNumber}. Moved to Effectiveness Check.`,
        `/nc-capa/${nc.id}`
      );
    }
  }
}

export const ncCapaNotificationService = new NcCapaNotificationService();
