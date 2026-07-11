import { NC_STATUS, NCScreeningDecision, CAPARequirementDecision } from '../domain/models';
import { ncCapaAuditService } from './NcCapaAuditService';
import { ncCapaNotificationService } from './NcCapaNotificationService';
import { ncCapaService } from './NcCapaService';
import { ncCapaTaskService } from './NcCapaTaskService';

class NcCapaScreeningService {
  
  async acceptAsNc(nc, params, actorId) {
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
      
      ncCapaTaskService.createOwnerAssignmentTask(updatedNc);
      ncCapaNotificationService.notifyNCAssigned(updatedNc);
    } else if (capaRequired === CAPARequirementDecision.CORRECTION_ONLY) {
      updatedNc.status = NC_STATUS.QA_VERIFICATION;
      
      ncCapaTaskService.createQaVerificationTask(updatedNc);
      ncCapaNotificationService.notifyCorrectionOnly(updatedNc);
    }

    ncCapaAuditService.logEvent(nc.id, 'SCREENING_ACCEPTED', actorId, `Accepted as NC. Severity: ${severity}. CAPA: ${capaRequired}.`, comment);
    
    await ncCapaService.updateNc(updatedNc);
    return updatedNc;
  }

  async returnForInfo(nc, params, actorId) {
    const { returnReason, missingInfoSummary } = params;
    
    if (!returnReason) throw new Error('Return reason is required.');

    const updatedNc = {
      ...nc,
      status: NC_STATUS.RETURNED_FOR_INFO,
      screeningResult: NCScreeningDecision.RETURN_FOR_MORE_INFORMATION,
      screeningComment: returnReason,
      returnedAt: new Date().toISOString()
    };

    ncCapaTaskService.createReturnedInfoTask(updatedNc);
    ncCapaNotificationService.notifyNCReturned(updatedNc);
    ncCapaAuditService.logEvent(nc.id, 'SCREENING_RETURNED', actorId, `Returned for info. Summary: ${missingInfoSummary}`, returnReason);

    await ncCapaService.updateNc(updatedNc);
    return updatedNc;
  }

  async rejectAsNotNc(nc, params, actorId) {
    const { rejectionReason } = params;

    if (!rejectionReason) throw new Error('Rejection reason is required.');

    const updatedNc = {
      ...nc,
      status: NC_STATUS.REJECTED_NOT_NC,
      screeningResult: NCScreeningDecision.REJECT_AS_NOT_NC,
      screeningComment: rejectionReason,
      rejectedAt: new Date().toISOString()
    };

    ncCapaTaskService.closeAllTasks(nc.id);
    ncCapaNotificationService.notifyNCRejected(updatedNc);
    ncCapaAuditService.logEvent(nc.id, 'SCREENING_REJECTED', actorId, 'Rejected as Not NC.', rejectionReason);

    await ncCapaService.updateNc(updatedNc);
    return updatedNc;
  }
}

export const ncCapaScreeningService = new NcCapaScreeningService();
