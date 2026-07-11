import { NC_STATUS } from '../domain/models';
import { ncCapaAuditService } from './NcCapaAuditService';
import { ncCapaTaskService } from './NcCapaTaskService';
import { ncCapaNotificationService } from './NcCapaNotificationService';

class NcCapaRcaService {
  
  saveDraft(nc, rcaData) {
    return {
      ...nc,
      status: NC_STATUS.ROOT_CAUSE_IN_PROGRESS,
      rootCauseAnalysis: {
        ...nc.rootCauseAnalysis,
        ...rcaData
      }
    };
  }

  submit(nc, rcaData, actorId) {
    const updated = {
      ...nc,
      status: NC_STATUS.CAPA_PLAN_REQUIRED,
      rootCauseAnalysis: {
        ...nc.rootCauseAnalysis,
        ...rcaData,
        createdByUserId: actorId,
        submittedAt: new Date().toISOString()
      },
      updatedAt: new Date().toISOString()
    };

    ncCapaAuditService.logEvent(updated.id, 'RCA_SUBMITTED', actorId, `Root Cause Analysis submitted`);
    ncCapaTaskService.createCapaPlanTask(updated);
    ncCapaNotificationService.notifyCapaPlanRequired(updated);

    return updated;
  }
}

export const ncCapaRcaService = new NcCapaRcaService();
