import { NC_STATUS, NCScreeningDecision, CAPARequirementDecision } from '../domain/models';
import { ncCapaAuditService } from './NcCapaAuditService';
import { ncCapaNotificationService } from './NcCapaNotificationService';

class NcCapaScreeningService {
  
  acceptAsNc(nc, params, actorId) {
    const { severity, capaRequired, comment, assignedDepartmentId, assignedOwnerUserId } = params;
    
    // Explicit CAPA Required Decision validation
    if (!capaRequired) throw new Error('CAPA requirement decision is missing.');
    if (!severity) throw new Error('Severity confirmation is missing.');

    const updatedNc = { ...nc, severity, capaRequired, screeningComment: comment, screeningResult: NCScreeningDecision.ACCEPT_AS_NC };

    if (capaRequired === CAPARequirementDecision.CAPA_REQUIRED) {
      if (!assignedDepartmentId || !assignedOwnerUserId) {
        throw new Error('Department and Owner must be assigned when CAPA is required.');
      }
      updatedNc.assignedDepartmentId = assignedDepartmentId;
      updatedNc.assignedOwnerUserId = assignedOwnerUserId;
      // Phase 11B: Move to ASSIGNED shell state instead of closing
      updatedNc.status = NC_STATUS.ASSIGNED;
      
      ncCapaNotificationService.notifyNCAssigned(updatedNc);
    } else if (capaRequired === CAPARequirementDecision.CORRECTION_ONLY) {
      updatedNc.status = NC_STATUS.QA_VERIFICATION;
      
      ncCapaNotificationService.notifyCorrectionOnly(updatedNc);
    }

    ncCapaAuditService.logEvent(nc.id, 'SCREENING_ACCEPTED', actorId, `Accepted as NC. Severity: ${severity}. CAPA: ${capaRequired}.`, comment);
    
    return updatedNc;
  }

  returnForInfo(nc, params, actorId) {
    const { returnReason, missingInfoSummary } = params;
    
    if (!returnReason) throw new Error('Return reason is required.');

    const updatedNc = {
      ...nc,
      status: NC_STATUS.RETURNED_FOR_INFO,
      screeningResult: NCScreeningDecision.RETURN_FOR_MORE_INFORMATION,
      screeningComment: returnReason,
      returnedAt: new Date().toISOString()
    };

    ncCapaNotificationService.notifyNCReturned(updatedNc);
    ncCapaAuditService.logEvent(nc.id, 'SCREENING_RETURNED', actorId, `Returned for info. Summary: ${missingInfoSummary}`, returnReason);

    return updatedNc;
  }

  rejectAsNotNc(nc, params, actorId) {
    const { rejectionReason } = params;

    if (!rejectionReason) throw new Error('Rejection reason is required.');

    const updatedNc = {
      ...nc,
      status: NC_STATUS.REJECTED_NOT_NC,
      screeningResult: NCScreeningDecision.REJECT_AS_NOT_NC,
      screeningComment: rejectionReason,
      rejectedAt: new Date().toISOString()
    };

    ncCapaNotificationService.notifyNCRejected(updatedNc);
    ncCapaAuditService.logEvent(nc.id, 'SCREENING_REJECTED', actorId, 'Rejected as Not NC.', rejectionReason);

    return updatedNc;
  }
}

export const ncCapaScreeningService = new NcCapaScreeningService();
