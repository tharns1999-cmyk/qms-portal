import { mockNcRecords } from '../mock/ncCapaMockData';
import { NC_STATUS, NC_SEVERITY } from '../domain/models';

class NcCapaDashboardService {
  /**
   * Get KPI summary counts
   */
  async getKpis() {
    const records = mockNcRecords || [];
    
    const openCount = records.filter(nc => nc.status !== NC_STATUS.CLOSED).length;
    const criticalCount = records.filter(nc => nc.severity === NC_SEVERITY.CRITICAL && nc.status !== NC_STATUS.CLOSED).length;
    // Mock logic for overdue
    const overdueCount = records.filter(nc => nc.status !== NC_STATUS.CLOSED && new Date(nc.dueDate) < new Date()).length;
    const pendingRCACount = records.filter(nc => nc.status === NC_STATUS.ROOT_CAUSE_IN_PROGRESS || nc.status === NC_STATUS.ASSIGNED).length;
    const pendingPlanCount = records.filter(nc => nc.status === NC_STATUS.CAPA_PLAN_REQUIRED || nc.status === NC_STATUS.CAPA_PLAN_RETURNED).length;
    
    return Promise.resolve({
      open: openCount,
      overdue: overdueCount,
      critical: criticalCount,
      pendingRCA: pendingRCACount,
      pendingPlan: pendingPlanCount,
      total: records.length
    });
  }
}

export const ncCapaDashboardService = new NcCapaDashboardService();
