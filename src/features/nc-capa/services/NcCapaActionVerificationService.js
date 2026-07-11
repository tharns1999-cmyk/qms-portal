import { NC_STATUS, CAPAActionStatus, VerificationResult } from '../domain/models';
import { ncCapaTaskService } from './NcCapaTaskService';
import { ncCapaNotificationService } from './NcCapaNotificationService';
import { ncCapaAuditService } from './NcCapaAuditService';
import { mockNcRecords } from '../mock/ncCapaMockData';

class NcCapaActionVerificationService {
  
  /**
   * QA/QC Verifies a submitted action
   */
  async verifyAction(ncId, actionId, verificationData, userId) {
    const record = mockNcRecords.find(nc => nc.id === ncId);
    if (!record) throw new Error('NC not found');

    const action = record.capaActionPlan?.actions?.find(a => a.id === actionId);
    if (!action) throw new Error('Action not found');

    if (action.status !== CAPAActionStatus.EVIDENCE_SUBMITTED) {
      throw new Error('Action is not pending verification');
    }

    action.verificationResult = verificationData.result;
    action.verificationComment = verificationData.comment;
    action.verifiedAt = new Date().toISOString();
    action.verifiedByUserId = userId;

    if (verificationData.result === VerificationResult.PASS) {
      action.status = CAPAActionStatus.VERIFIED;
      
      ncCapaAuditService.logEvent(ncId, userId, 'ACTION_VERIFIED', `Action ${action.id} passed verification`);
      ncCapaNotificationService.createNotification(
        action.responsibleUserId,
        `Your action passed verification: ${action.description.substring(0, 30)}`,
        ncId
      );

      // Check if ALL actions are now verified
      const allActions = record.capaActionPlan.actions;
      const allVerified = allActions.every(a => a.status === CAPAActionStatus.VERIFIED);
      
      if (allVerified) {
        record.status = NC_STATUS.EFFECTIVENESS_CHECK;
        ncCapaAuditService.logEvent(ncId, userId, 'ALL_ACTIONS_VERIFIED', `All actions verified, moving to Effectiveness Check`);
        
        ncCapaTaskService.createEffectivenessCheckShellTask(record);
        
        ncCapaNotificationService.createNotification(
          record.assignedOwnerUserId,
          `All CAPA actions verified for NC ${record.ncNumber}. Pending Effectiveness Check.`,
          ncId
        );
      }

    } else if (verificationData.result === VerificationResult.RETURN_FOR_CORRECTION) {
      action.status = CAPAActionStatus.RETURNED_FOR_CORRECTION;
      
      ncCapaAuditService.logEvent(ncId, userId, 'ACTION_RETURNED', `Action ${action.id} returned for correction: ${verificationData.comment}`);
      ncCapaNotificationService.createNotification(
        action.responsibleUserId,
        `Your action was returned for correction: ${action.description.substring(0, 30)}`,
        ncId
      );
      
      ncCapaTaskService.createActionReturnedTask(record, action);
      
    } else if (verificationData.result === VerificationResult.FAIL) {
      action.status = CAPAActionStatus.FAILED_VERIFICATION;
      
      ncCapaAuditService.logEvent(ncId, userId, 'ACTION_FAILED', `Action ${action.id} failed verification: ${verificationData.comment}`);
      ncCapaNotificationService.createNotification(
        action.responsibleUserId,
        `Your action failed verification: ${action.description.substring(0, 30)}`,
        ncId
      );
      
      ncCapaTaskService.createActionReturnedTask(record, action);
    }

    record.updatedAt = new Date().toISOString();
    ncCapaTaskService._closeTasksForAction(ncId, actionId); // Close the QA verify task

    return Promise.resolve(record);
  }
}

export const ncCapaActionVerificationService = new NcCapaActionVerificationService();
