import { NC_STATUS, CAPAActionStatus, NC_PERMISSIONS, EffectivenessResult } from '../domain/models';
import { ncCapaTaskService } from './NcCapaTaskService';
import { ncCapaNotificationService } from './NcCapaNotificationService';
import { ncCapaAuditService } from './NcCapaAuditService';
import { ncCapaAccessService } from './NcCapaAccessService';
import { mockNcRecords } from '../mock/ncCapaMockData';

class NcCapaEffectivenessService {
  /**
   * Submit Effectiveness Check and determine next step based on result
   */
  async submitEffectivenessCheck(ncId, checkData, user) {
    const record = mockNcRecords.find(nc => nc.id === ncId);
    if (!record) throw new Error('NC not found');

    if (record.status !== NC_STATUS.EFFECTIVENESS_CHECK) {
      throw new Error('Effectiveness Check allowed only in EFFECTIVENESS_CHECK status');
    }

    if (ncCapaAccessService.isRestricted(record, user)) {
      throw new Error('Record is restricted for the current user');
    }

    const hasPermission = ncCapaAccessService.hasPermission(user, NC_PERMISSIONS.EFFECTIVENESS_CHECK) || 
                          ncCapaAccessService.hasPermission(user, NC_PERMISSIONS.ADMIN);
    if (!hasPermission) {
      throw new Error('Unauthorized user: Missing NC_CAPA_EFFECTIVENESS_CHECK or NC_CAPA_ADMIN permission');
    }

    // Check all required actions are VERIFIED
    const allVerified = record.capaActionPlan?.actions?.every(a => a.status === CAPAActionStatus.VERIFIED);
    if (!allVerified) {
      throw new Error('Blocked: All actions must be VERIFIED before effectiveness check');
    }

    // Validate required fields
    if (!checkData.actualCheckDate) throw new Error('Actual check date is required');
    if (!checkData.checkMethod) throw new Error('Check method is required');
    if (checkData.recurrenceObserved === undefined || checkData.recurrenceObserved === null) {
      throw new Error('Recurrence observed decision is required');
    }
    if (!checkData.result) throw new Error('Result is required');

    // actual date cannot be before all actions verified date
    const latestVerifiedAction = [...record.capaActionPlan.actions].sort((a, b) => 
      new Date(b.verifiedAt).getTime() - new Date(a.verifiedAt).getTime()
    )[0];
    
    if (latestVerifiedAction && new Date(checkData.actualCheckDate).getTime() < new Date(latestVerifiedAction.verifiedAt).getTime()) {
      throw new Error('Actual check date cannot be before all actions verified date');
    }

    // Store effectiveness data
    record.effectivenessCheck = {
      actualCheckDate: checkData.actualCheckDate,
      checkMethod: checkData.checkMethod,
      recurrenceObserved: checkData.recurrenceObserved,
      result: checkData.result,
      evidenceComment: checkData.evidenceComment || '',
      closureComment: checkData.closureComment || '',
      reasonComment: checkData.reasonComment || '',
      checkedAt: new Date().toISOString(),
      checkedByUserId: user.id
    };

    record.updatedAt = new Date().toISOString();

    // Close the effectiveness task
    ncCapaTaskService._closeTasksForNc(ncId);

    // Process based on result
    if (checkData.result === EffectivenessResult.EFFECTIVE) {
      if (checkData.recurrenceObserved && !checkData.reasonComment && !checkData.evidenceComment) { // usually justification in one of the comments
         // The requirement says: recurrence observed = yes must not allow direct effective closure unless justification is provided
         if (!checkData.closureComment && !checkData.reasonComment) {
            throw new Error('Recurrence observed = yes requires justification for effective closure');
         }
      }
      return this._closeNc(record, user, checkData);
    } 
    else if (checkData.result === EffectivenessResult.NEED_ADDITIONAL_ACTION || 
            (checkData.result === EffectivenessResult.PARTIALLY_EFFECTIVE && checkData.requiresAdditionalAction)) {
      return this._requireAdditionalAction(record, user, checkData);
    } 
    else if (checkData.result === EffectivenessResult.NOT_EFFECTIVE || 
             checkData.result === EffectivenessResult.REOPEN_CAPA) {
      return this._reopenCapa(record, user, checkData);
    }
    
    // Default PARTIALLY_EFFECTIVE to additional action
    if (checkData.result === EffectivenessResult.PARTIALLY_EFFECTIVE) {
      return this._requireAdditionalAction(record, user, checkData);
    }

    return Promise.resolve(record);
  }

  _closeNc(record, user, checkData) {
    if (!checkData.closureComment) {
      throw new Error('Closure requires comment');
    }

    const hasClosePerm = ncCapaAccessService.hasPermission(user, NC_PERMISSIONS.CLOSE) || 
                         ncCapaAccessService.hasPermission(user, NC_PERMISSIONS.ADMIN);
    if (!hasClosePerm) {
      throw new Error('Closure requires NC_CAPA_CLOSE or NC_CAPA_ADMIN permission');
    }

    // Idempotency check
    if (record.status === NC_STATUS.CLOSED) {
      return Promise.resolve(record);
    }

    record.status = NC_STATUS.CLOSED;
    record.closedAt = new Date().toISOString();
    record.closedByUserId = user.id;

    ncCapaAuditService.logEvent(record.id, user.id, 'NC_CLOSED', `NC/CAPA closed effectively: ${checkData.closureComment}`);
    
    ncCapaNotificationService.createNotification(
      record.reportedByUserId,
      `NC/CAPA ${record.ncNumber} has been effectively closed.`,
      record.id
    );

    return Promise.resolve(record);
  }

  _requireAdditionalAction(record, user, checkData) {
    if (!checkData.reasonComment) {
      throw new Error('Reason/comment required when adding action');
    }

    // Idempotency check
    if (record.status === NC_STATUS.ADDITIONAL_ACTION_REQUIRED) {
      return Promise.resolve(record);
    }

    record.status = NC_STATUS.ADDITIONAL_ACTION_REQUIRED;
    
    ncCapaAuditService.logEvent(record.id, user.id, 'ADDITIONAL_ACTION_REQUIRED', `Additional action required: ${checkData.reasonComment}`);
    
    ncCapaTaskService.createEffectivenessAdditionalActionTask(record);
    
    ncCapaNotificationService.createNotification(
      record.assignedOwnerUserId,
      `Additional action required for NC/CAPA ${record.ncNumber} after effectiveness check.`,
      record.id
    );

    return Promise.resolve(record);
  }

  _reopenCapa(record, user, checkData) {
    if (!checkData.reasonComment) {
      throw new Error('Reason/comment required when reopening');
    }
    
    const hasReopenPerm = ncCapaAccessService.hasPermission(user, NC_PERMISSIONS.REOPEN) || 
                          ncCapaAccessService.hasPermission(user, NC_PERMISSIONS.ADMIN);
    if (!hasReopenPerm) {
      throw new Error('Reopen requires NC_CAPA_REOPEN or NC_CAPA_ADMIN permission');
    }

    // Idempotency check
    if (record.status === NC_STATUS.REOPENED) {
      return Promise.resolve(record);
    }

    record.status = NC_STATUS.REOPENED;
    
    ncCapaAuditService.logEvent(record.id, user.id, 'NC_REOPENED', `NC/CAPA reopened: ${checkData.reasonComment}`);
    
    ncCapaTaskService.createCapaReopenedTask(record);
    
    ncCapaNotificationService.createNotification(
      record.assignedOwnerUserId,
      `NC/CAPA ${record.ncNumber} has been reopened after effectiveness check.`,
      record.id
    );

    return Promise.resolve(record);
  }
}

export const ncCapaEffectivenessService = new NcCapaEffectivenessService();
