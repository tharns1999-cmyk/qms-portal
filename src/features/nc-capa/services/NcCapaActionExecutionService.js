import { NC_STATUS, CAPAActionStatus, EvidenceValidationStatus } from '../domain/models';
import { ncCapaTaskService } from './NcCapaTaskService';
import { ncCapaNotificationService } from './NcCapaNotificationService';
import { ncCapaAuditService } from './NcCapaAuditService';
import { mockNcRecords } from '../mock/ncCapaMockData';

class NcCapaActionExecutionService {
  /**
   * Updates an action's execution progress and evidence metadata.
   */
  async updateActionProgress(ncId, actionId, updateData, userId) {
    const record = mockNcRecords.find(nc => nc.id === ncId);
    if (!record) throw new Error('NC not found');

    if (record.status !== NC_STATUS.ACTION_IN_PROGRESS) {
      throw new Error('NC is not in execution phase');
    }

    const action = record.capaActionPlan?.actions?.find(a => a.id === actionId);
    if (!action) throw new Error('Action not found');

    if (action.responsibleUserId !== userId) {
      // Typically, check if they have admin or execution override permissions, but for mock we enforce responsible.
      throw new Error('Only the responsible user can update this action');
    }

    // Merge data
    const isFirstUpdate = action.status === CAPAActionStatus.PENDING_EXECUTION || action.status === CAPAActionStatus.PLANNED;
    
    if (isFirstUpdate) {
      action.status = CAPAActionStatus.IN_PROGRESS;
      ncCapaNotificationService.createNotification(
        userId,
        `Started executing action: ${action.description.substring(0, 30)}`,
        ncId
      );
    }

    if (updateData.progressPercent !== undefined) {
      if (updateData.progressPercent < 0 || updateData.progressPercent > 100) {
        throw new Error('Progress must be between 0 and 100');
      }
      action.progressPercent = updateData.progressPercent;
    }

    if (updateData.progressComment !== undefined) {
      action.progressComment = updateData.progressComment;
    }

    if (updateData.evidenceMetadata !== undefined) {
      const oldEvidenceId = action.evidenceMetadata?.id;
      action.evidenceMetadata = updateData.evidenceMetadata;
      
      if (oldEvidenceId && updateData.evidenceMetadata) {
        ncCapaAuditService.logEvent(ncId, userId, 'EVIDENCE_REPLACED', `Replaced evidence metadata for action ${action.id}`);
      } else if (updateData.evidenceMetadata === null) {
        ncCapaAuditService.logEvent(ncId, userId, 'EVIDENCE_REMOVED', `Removed evidence metadata for action ${action.id}`);
      } else if (updateData.evidenceMetadata) {
        ncCapaAuditService.logEvent(ncId, userId, 'EVIDENCE_ADDED', `Added evidence metadata for action ${action.id}`);
      }
    }

    record.updatedAt = new Date().toISOString();

    return Promise.resolve(record);
  }

  /**
   * Submit an action for QA Verification
   */
  async submitActionForVerification(ncId, actionId, userId) {
    const record = mockNcRecords.find(nc => nc.id === ncId);
    if (!record) throw new Error('NC not found');

    const action = record.capaActionPlan?.actions?.find(a => a.id === actionId);
    if (!action) throw new Error('Action not found');

    if (action.evidenceRequired && (!action.evidenceMetadata || action.evidenceMetadata.validationStatus !== EvidenceValidationStatus.VALID_METADATA)) {
      throw new Error('Valid evidence metadata is required to submit this action');
    }

    if (action.progressPercent !== 100) {
      // Force 100% on submit
      action.progressPercent = 100;
    }

    action.status = CAPAActionStatus.EVIDENCE_SUBMITTED;
    action.submittedAt = new Date().toISOString();
    record.updatedAt = new Date().toISOString();

    ncCapaAuditService.logEvent(ncId, userId, 'ACTION_SUBMITTED', `Action ${action.id} submitted for QA verification`);
    
    // Create task for QA to verify
    ncCapaTaskService.createQaVerificationTaskForAction(record, action);
    
    // Notify reporters and QA
    ncCapaNotificationService.createNotification(
      record.reportedByUserId, // Just an example recipient
      `Action submitted for verification: ${action.description.substring(0, 30)}`,
      ncId
    );

    return Promise.resolve(record);
  }
}

export const ncCapaActionExecutionService = new NcCapaActionExecutionService();
