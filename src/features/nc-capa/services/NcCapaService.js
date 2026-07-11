import { mockNcRecords } from '../mock/ncCapaMockData';
import { EMPTY_NC_DRAFT, NC_STATUS } from '../domain/models';
import { ncCapaNumberService } from './NcCapaNumberService';
import { ncCapaNotificationService } from './NcCapaNotificationService';
import { ncCapaAuditService } from './NcCapaAuditService';
import { ncCapaTaskService } from './NcCapaTaskService';
import { ncCapaRcaService } from './NcCapaRcaService';
import { ncCapaPlanService } from './NcCapaPlanService';
import { ncCapaPlanReviewService } from './NcCapaPlanReviewService';
import { ncCapaActionExecutionService } from './NcCapaActionExecutionService';
import { ncCapaActionVerificationService } from './NcCapaActionVerificationService';

class NcCapaService {
  constructor() {
    this.records = [...mockNcRecords];
    this.drafts = new Map(); // Keep drafts in memory
    
    // Seed initial tasks based on mock records
    this.records.forEach(nc => {
      if (nc.status === NC_STATUS.SCREENING) {
        ncCapaTaskService.createScreeningTask(nc);
      } else if (nc.status === NC_STATUS.RETURNED_FOR_INFO) {
        ncCapaTaskService.createReturnedInfoTask(nc);
      } else if (nc.status === NC_STATUS.ASSIGNED || nc.status === NC_STATUS.ROOT_CAUSE_IN_PROGRESS) {
        ncCapaTaskService.createOwnerAssignmentTask(nc);
      } else if (nc.status === NC_STATUS.CAPA_PLAN_REQUIRED || nc.status === NC_STATUS.CAPA_PLAN_RETURNED) {
        ncCapaTaskService.createCapaPlanTask(nc);
      } else if (nc.status === NC_STATUS.CAPA_PLAN_REVIEW) {
        ncCapaTaskService.createPlanReviewTask(nc);
      } else if (nc.status === NC_STATUS.ACTION_IN_PROGRESS) {
        ncCapaTaskService.createActionExecutionShellTasks(nc);
      } else if (nc.status === NC_STATUS.QA_VERIFICATION) {
        ncCapaTaskService.createQaVerificationTask(nc);
      }
    });
  }

  async getList() {
    return Promise.resolve([...this.records]);
  }

  async updateNc(updatedNc) {
    const index = this.records.findIndex(r => r.id === updatedNc.id);
    if (index !== -1) {
      this.records[index] = updatedNc;
    }
    return Promise.resolve(updatedNc);
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

  // Orchestrate RCA
  async saveRootCauseAnalysisDraft(ncId, rcaData) {
    const nc = await this.getById(ncId);
    if (!nc) throw new Error("NC not found");
    const updated = ncCapaRcaService.saveDraft(nc, rcaData);
    return this.updateNc(updated);
  }

  async submitRootCauseAnalysis(ncId, rcaData, actorId) {
    const nc = await this.getById(ncId);
    if (!nc) throw new Error("NC not found");
    const updated = ncCapaRcaService.submit(nc, rcaData, actorId);
    return this.updateNc(updated);
  }

  // Orchestrate CAPA Plan
  async saveCapaPlanDraft(ncId, planData) {
    const nc = await this.getById(ncId);
    if (!nc) throw new Error("NC not found");
    const updated = ncCapaPlanService.saveDraft(nc, planData);
    return this.updateNc(updated);
  }

  async submitCapaPlan(ncId, planData, actorId) {
    const nc = await this.getById(ncId);
    if (!nc) throw new Error("NC not found");
    const updated = ncCapaPlanService.submit(nc, planData, actorId);
    return this.updateNc(updated);
  }

  // Orchestrate CAPA Plan Review
  async approveCapaPlan(ncId, reviewData, actorId) {
    const nc = await this.getById(ncId);
    if (!nc) throw new Error("NC not found");
    const updated = ncCapaPlanReviewService.approve(nc, reviewData, actorId);
    return this.updateNc(updated);
  }

  async returnCapaPlan(ncId, reviewData, actorId) {
    const nc = await this.getById(ncId);
    if (!nc) throw new Error("NC not found");
    const updated = ncCapaPlanReviewService.returnForCorrection(nc, reviewData, actorId);
    return this.updateNc(updated);
  }

  // Orchestrate Action Execution
  async updateActionProgress(ncId, actionId, updateData, actorId) {
    const updated = await ncCapaActionExecutionService.updateActionProgress(ncId, actionId, updateData, actorId);
    return this.updateNc(updated);
  }

  async submitActionForVerification(ncId, actionId, actorId) {
    const updated = await ncCapaActionExecutionService.submitActionForVerification(ncId, actionId, actorId);
    return this.updateNc(updated);
  }

  // Orchestrate QA Verification
  async verifyAction(ncId, actionId, verificationData, actorId) {
    const updated = await ncCapaActionVerificationService.verifyAction(ncId, actionId, verificationData, actorId);
    return this.updateNc(updated);
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
