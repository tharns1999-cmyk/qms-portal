import { mockNcRecords } from '../mock/ncCapaMockData';
import { NC_STATUS } from '../domain/models';

class NcCapaTaskService {
  /**
   * Get tasks assigned to the current user
   */
  async getMyTasks(userId) {
    if (!userId) return Promise.resolve([]);
    
    const records = mockNcRecords || [];
    const myTasks = records.filter(nc => 
      (nc.assignedOwnerUserId === userId || nc.reportedByUserId === userId) && 
      nc.status !== NC_STATUS.CLOSED
    );
    
    return Promise.resolve(myTasks);
  }
}

export const ncCapaTaskService = new NcCapaTaskService();
