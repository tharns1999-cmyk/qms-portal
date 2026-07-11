import { mockNcRecords } from '../mock/ncCapaMockData';
import { EMPTY_NC_DRAFT } from '../domain/models';

class NcCapaService {
  /**
   * List all NC records
   */
  async getList() {
    return Promise.resolve([...mockNcRecords]);
  }

  /**
   * Get NC record by ID
   * @param {string} id 
   */
  async getById(id) {
    const record = mockNcRecords.find(nc => nc.id === id);
    if (!record) return Promise.resolve(null);
    return Promise.resolve({ ...record });
  }

  /**
   * Create an initial draft shell
   */
  createDraftShell() {
    return { ...EMPTY_NC_DRAFT };
  }
}

export const ncCapaService = new NcCapaService();
