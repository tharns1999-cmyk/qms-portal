import { mockNcRecords } from '../mock/ncCapaMockData';
import { EMPTY_NC_DRAFT, NC_STATUS } from '../domain/models';
import { ncCapaNumberService } from './NcCapaNumberService';
import { ncCapaNotificationService } from './NcCapaNotificationService';
import { ncCapaAuditService } from './NcCapaAuditService';
import { ncCapaTaskService } from './NcCapaTaskService';

class NcCapaService {
  constructor() {
    this.records = [...mockNcRecords];
    this.drafts = new Map(); // Keep drafts in memory
  }

  async getList() {
    return Promise.resolve([...this.records]);
  }

  async getById(id) {
    const record = this.records.find(nc => nc.id === id);
    if (!record) return Promise.resolve(null);
    return Promise.resolve({ ...record });
  }

  createDraftShell() {
    return { ...EMPTY_NC_DRAFT, id: `DRAFT-${Date.now()}` };
  }

  saveDraft(draft) {
    this.drafts.set(draft.id, draft);
    return Promise.resolve(draft);
  }

  getDraft(id) {
    return Promise.resolve(this.drafts.get(id) || null);
  }

  deleteDraft(id) {
    this.drafts.delete(id);
    return Promise.resolve();
  }

  async submitNewNc(draft, actorId) {
    const newRecord = { ...draft };
    
    // Generate real NC number and update states
    newRecord.ncNumber = ncCapaNumberService.generateNextNumber();
    newRecord.status = NC_STATUS.SCREENING;
    newRecord.createdAt = new Date().toISOString();
    newRecord.submittedAt = newRecord.createdAt;
    
    // Add to records
    this.records.unshift(newRecord);
    this.drafts.delete(draft.id); // Remove draft
    
    // Trigger side effects
    ncCapaAuditService.logEvent(newRecord.id, 'SUBMIT', actorId, `NC Submitted: ${newRecord.title}`);
    ncCapaTaskService.createScreeningTask(newRecord);
    
    // QA/QC role hardcode just for mock notification target
    ncCapaNotificationService.notifyNCScreening(newRecord, 'U005'); 

    return newRecord;
  }

  async resubmitReturnedNc(nc, updates, actorId) {
    const index = this.records.findIndex(r => r.id === nc.id);
    if (index === -1) throw new Error("NC not found");

    const updated = { 
      ...this.records[index], 
      ...updates,
      status: NC_STATUS.SCREENING, 
      submittedAt: new Date().toISOString() 
    };
    
    this.records[index] = updated;

    ncCapaAuditService.logEvent(updated.id, 'RESUBMIT', actorId, `NC Resubmitted after return`);
    ncCapaTaskService.createScreeningTask(updated);
    ncCapaNotificationService.notifyNCScreening(updated, 'U005');

    return updated;
  }

  // Mock State Reset for testing
  reset() {
    this.records = [...mockNcRecords];
    this.drafts.clear();
    ncCapaNumberService.reset();
    ncCapaAuditService.reset();
  }
}

export const ncCapaService = new NcCapaService();
