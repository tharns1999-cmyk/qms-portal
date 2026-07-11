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
    
    return Promise.resolve({
      open: openCount,
      overdue: overdueCount,
      critical: criticalCount,
      total: records.length
    });
  }
}

export const ncCapaDashboardService = new NcCapaDashboardService();
