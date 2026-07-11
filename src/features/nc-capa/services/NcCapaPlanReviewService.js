import { NC_STATUS, CAPAPlanReviewStatus, CAPAActionStatus } from '../domain/models';
import { ncCapaAuditService } from './NcCapaAuditService';
import { ncCapaTaskService } from './NcCapaTaskService';
import { ncCapaNotificationService } from './NcCapaNotificationService';

class NcCapaPlanReviewService {

  approve(nc, reviewData, actorId) {
    if (nc.status !== NC_STATUS.CAPA_PLAN_REVIEW) {
      throw new Error('NC must be in CAPA_PLAN_REVIEW status to approve');
    }

    const updated = {
      ...nc,
      status: NC_STATUS.ACTION_IN_PROGRESS,
      capaActionPlan: {
        ...nc.capaActionPlan,
        reviewStatus: CAPAPlanReviewStatus.APPROVED,
        reviewComment: reviewData.comment || '',
        actions: nc.capaActionPlan.actions.map(a => ({
          ...a,
          status: CAPAActionStatus.PENDING_EXECUTION
        }))
      },
      updatedAt: new Date().toISOString()
    };

    ncCapaAuditService.logEvent(updated.id, 'CAPA_PLAN_APPROVED', actorId, `CAPA Action Plan approved`, reviewData.comment);
    
    // Create execution shell tasks
    ncCapaTaskService.createActionExecutionShellTasks(updated);
    
    // Notify the owner
    ncCapaNotificationService.notifyCapaPlanApproved(updated);

    return updated;
  }

  returnForCorrection(nc, reviewData, actorId) {
    if (nc.status !== NC_STATUS.CAPA_PLAN_REVIEW) {
      throw new Error('NC must be in CAPA_PLAN_REVIEW status to return');
    }

    const updated = {
      ...nc,
      status: NC_STATUS.CAPA_PLAN_RETURNED,
      capaActionPlan: {
        ...nc.capaActionPlan,
        reviewStatus: CAPAPlanReviewStatus.RETURNED_FOR_CORRECTION,
        reviewComment: reviewData.returnReason || ''
      },
      updatedAt: new Date().toISOString()
    };

    ncCapaAuditService.logEvent(updated.id, 'CAPA_PLAN_RETURNED', actorId, `CAPA Action Plan returned for correction`, reviewData.returnReason);
    
    // Recreate the plan creation task for the owner
    ncCapaTaskService.createCapaPlanTask(updated);
    
    // Notify the owner
    ncCapaNotificationService.notifyCapaPlanReturned(updated);

    return updated;
  }
}

export const ncCapaPlanReviewService = new NcCapaPlanReviewService();
