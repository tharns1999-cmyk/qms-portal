import { NC_STATUS, CAPAPlanReviewStatus } from '../domain/models';
import { ncCapaAuditService } from './NcCapaAuditService';
import { ncCapaTaskService } from './NcCapaTaskService';
import { ncCapaNotificationService } from './NcCapaNotificationService';

class NcCapaPlanService {

  saveDraft(nc, planData) {
    return {
      ...nc,
      capaActionPlan: {
        ...nc.capaActionPlan,
        ...planData,
        reviewStatus: CAPAPlanReviewStatus.DRAFT
      }
    };
  }

  submit(nc, planData, actorId) {
    const updated = {
      ...nc,
      status: NC_STATUS.CAPA_PLAN_REVIEW,
      capaActionPlan: {
        ...nc.capaActionPlan,
        ...planData,
        reviewStatus: CAPAPlanReviewStatus.SUBMITTED,
        submittedAt: new Date().toISOString()
      },
      updatedAt: new Date().toISOString()
    };

    ncCapaAuditService.logEvent(updated.id, 'CAPA_PLAN_SUBMITTED', actorId, `CAPA Action Plan submitted for review`);
    ncCapaTaskService.createPlanReviewTask(updated);
    // Hardcode U005 QA/QC for testing, but in a real app this would resolve by role
    ncCapaNotificationService.notifyCapaPlanSubmitted(updated, 'U005');

    return updated;
  }
}

export const ncCapaPlanService = new NcCapaPlanService();
