import { mockNcRecords } from '../mock/ncCapaMockData';
import { NC_STATUS, NC_SEVERITY, DccLinkageStatus } from '../domain/models';
import { ncCapaDccLinkageService } from './NcCapaDccLinkageService';

class NcCapaDashboardService {
  /**
   * Get KPI summary counts
   */
  async getKpis() {
    const records = mockNcRecords || [];
    
    // Intake / Screening
    const screeningCount = records.filter(nc => nc.status === NC_STATUS.SCREENING).length;
    const returnedCount = records.filter(nc => nc.status === NC_STATUS.RETURNED_FOR_INFO).length;
    
    // RCA / CAPA Planning
    const assignedCount = records.filter(nc => nc.status === NC_STATUS.ASSIGNED).length;
    const pendingRCACount = records.filter(nc => nc.status === NC_STATUS.ROOT_CAUSE_IN_PROGRESS).length;
    const capaRequiredCount = records.filter(nc => nc.status === NC_STATUS.CAPA_PLAN_REQUIRED).length;
    const capaReviewCount = records.filter(nc => nc.status === NC_STATUS.CAPA_PLAN_REVIEW || nc.status === NC_STATUS.CAPA_PLAN_RETURNED).length;
    
    // Execution / Verification
    const executionCount = records.filter(nc => nc.status === NC_STATUS.ACTION_IN_PROGRESS).length;
    
    // Effectiveness / Closure
    const effectivenessCount = records.filter(nc => nc.status === NC_STATUS.EFFECTIVENESS_CHECK).length;
    const closedCount = records.filter(nc => nc.status === NC_STATUS.CLOSED).length;
    const reopenedCount = records.filter(nc => nc.status === NC_STATUS.REOPENED).length;
    const additionalActionCount = records.filter(nc => nc.status === NC_STATUS.ADDITIONAL_ACTION_REQUIRED).length;
    
    // Risk / Priority
    const criticalCount = records.filter(nc => nc.severity === NC_SEVERITY.CRITICAL).length;
    const foodSafetyCriticalCount = records.filter(nc => nc.severity === NC_SEVERITY.FOOD_SAFETY_CRITICAL).length;

    // Actions & Verification
    let pendingVerificationCount = 0;
    records.forEach(nc => {
      if (nc.capaActionPlan && nc.capaActionPlan.actions) {
        pendingVerificationCount += nc.capaActionPlan.actions.filter(a => a.status === 'EVIDENCE_SUBMITTED').length;
      }
    });

    // DCC Linkage
    let dccPendingCount = 0;
    let dccCompletedCount = 0;
    
    records.forEach(nc => {
      const linkage = ncCapaDccLinkageService.getLinkageForNc(nc.id);
      if (linkage) {
        if (linkage.targetStatus === DccLinkageStatus.COMPLETED) {
          dccCompletedCount++;
        } else if (linkage.targetStatus === DccLinkageStatus.IN_PROGRESS || linkage.targetStatus === DccLinkageStatus.DRAFT) {
          dccPendingCount++;
        }
      }
    });

    return Promise.resolve({
      screening: screeningCount,
      returned: returnedCount,
      assigned: assignedCount,
      pendingRCA: pendingRCACount,
      capaRequired: capaRequiredCount,
      capaReview: capaReviewCount,
      execution: executionCount,
      pendingVerification: pendingVerificationCount,
      effectiveness: effectivenessCount,
      closed: closedCount,
      reopened: reopenedCount,
      additionalAction: additionalActionCount,
      critical: criticalCount + foodSafetyCriticalCount, // Combined for simplicity or split if needed
      dccPending: dccPendingCount,
      dccCompleted: dccCompletedCount,
      total: records.length
    });
  }
}

export const ncCapaDashboardService = new NcCapaDashboardService();
