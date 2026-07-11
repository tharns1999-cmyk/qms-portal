import { NC_STATUS, CAPAPlanReviewStatus } from '../domain/models';
import { ncCapaAuditService } from './NcCapaAuditService';
import { ncCapaTaskService } from './NcCapaTaskService';
import { ncCapaNotificationService } from './NcCapaNotificationService';
import { ncCapaUserHelper } from './NcCapaUserHelper';
import { NC_PERMISSIONS } from '../domain/models';

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
    const targetUser = ncCapaUserHelper.resolveNotificationTargets({
      permission: NC_PERMISSIONS.PLAN_REVIEW,
      fallbackUserId: actorId
    });
    ncCapaNotificationService.notifyCapaPlanSubmitted(updated, targetUser);

    return updated;
  }
}

export const ncCapaPlanService = new NcCapaPlanService();
