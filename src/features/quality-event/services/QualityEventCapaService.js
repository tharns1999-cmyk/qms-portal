import { mockCapaRecords } from '../mock/qualityEventCapaMockData';
import { qualityEventNumberService } from './QualityEventNumberService';
import { ncCapaTaskService } from '../../nc-capa/services/NcCapaTaskService';
import { ncCapaAuditService } from '../../nc-capa/services/NcCapaAuditService';
import { ncCapaNotificationService } from '../../nc-capa/services/NcCapaNotificationService';
import { ncCapaRcaService } from '../../nc-capa/services/NcCapaRcaService';
import { ncCapaPlanService } from '../../nc-capa/services/NcCapaPlanService';
import { ncCapaPlanReviewService } from '../../nc-capa/services/NcCapaPlanReviewService';
import { ncCapaActionExecutionService } from '../../nc-capa/services/NcCapaActionExecutionService';
import { ncCapaActionVerificationService } from '../../nc-capa/services/NcCapaActionVerificationService';

export const CAPA_STATUS = {
  DRAFT: 'DRAFT',
  ASSIGNED: 'ASSIGNED', // Directly assigned to target department
  RESPONSE_IN_PROGRESS: 'RESPONSE_IN_PROGRESS',
  PENDING_ORIGINATOR_REVIEW: 'PENDING_ORIGINATOR_REVIEW',
  RETURNED_TO_TARGET: 'RETURNED_TO_TARGET',
  FOLLOW_UP_1: 'FOLLOW_UP_1',
  FOLLOW_UP_2: 'FOLLOW_UP_2',
  PENDING_QAQC_CLOSURE: 'PENDING_QAQC_CLOSURE',
  CLOSED: 'CLOSED',
  REOPENED: 'REOPENED',
  REJECTED: 'REJECTED',
  CANCELLED: 'CANCELLED'
};

const EMPTY_CAPA_DRAFT = {
  formCode: 'FM-QC-30',
  formRevision: 'R04',
  recordType: 'QUALITY_COMPLAINT',
  capaType: null,
  sourceType: 'STANDALONE',
  title: '',
  problemDescription: '',
  dateFound: '',
  requesterDept: '',
  responsibleDept: '',
  severity: '',
  qualityRelated: false,
  foodSafetyRelated: false,
  status: CAPA_STATUS.DRAFT
};

class QualityEventCapaService {
  constructor() {
    this.records = [...mockCapaRecords];
    this.drafts = new Map();
  }

  async getList() {
    return Promise.resolve([...this.records]);
  }

  async getById(id) {
    const record = this.records.find(r => r.id === id);
    if (!record) return Promise.resolve(null);
    return Promise.resolve({ ...record });
  }

  createDraftShell() {
    return { ...EMPTY_CAPA_DRAFT, id: `DRAFT-${Date.now()}` };
  }

  saveDraft(draft) {
    this.drafts.set(draft.id, draft);
    return Promise.resolve(draft);
  }

  async submitNewCapa(draft, actorId) {
    const newRecord = { ...draft };
    
    // Generate real record number based on type
    const recordNo = qualityEventNumberService.generateNextNumber(newRecord.recordType);
    newRecord.id = recordNo;
    newRecord.recordNo = recordNo;
    newRecord.status = CAPA_STATUS.ASSIGNED;
    newRecord.createdAt = new Date().toISOString();
    newRecord.submittedAt = newRecord.createdAt;
    
    // SLA Rule: 14 days from submission
    const due = new Date();
    due.setDate(due.getDate() + 14);
    newRecord.responseDueDate = due.toISOString();
    newRecord.assignedAt = newRecord.submittedAt;
    
    this.records.unshift(newRecord);
    this.drafts.delete(draft.id);
    
    ncCapaAuditService.logEvent(newRecord.id, 'SUBMIT', actorId, `Record Submitted and Assigned to ${newRecord.responsibleDept}`);
    
    // Mock task for Target Department (using owner assignment task semantic)
    ncCapaTaskService.createOwnerAssignmentTask({ ...newRecord, ncNumber: recordNo });
    // Note: QAQC gets an awareness notification (mocked)
    
    return newRecord;
  }

  async targetDepartmentRespond(id, responseData, actorId) {
    const record = await this.getById(id);
    if (!record) throw new Error("Record not found");
    
    record.status = CAPA_STATUS.PENDING_ORIGINATOR_REVIEW;
    record.responseSubmittedAt = new Date().toISOString();
    // In a real implementation, cause/correction/prevention would be merged here
    Object.assign(record, responseData);
    
    ncCapaAuditService.logEvent(id, 'RESPONSE_SUBMITTED', actorId, `Target department responded`);
    return this.updateRecord(record);
  }

  async originatorReviewResponse(id, action, reviewData, actorId) {
    const record = await this.getById(id);
    if (!record) throw new Error("Record not found");
    
    if (action === 'ACCEPT') {
      record.status = CAPA_STATUS.PENDING_QAQC_CLOSURE;
      ncCapaAuditService.logEvent(id, 'ORIGINATOR_ACCEPT', actorId, `Originating department accepted the response`);
    } else if (action === 'RETURN') {
      record.status = CAPA_STATUS.RETURNED_TO_TARGET;
      ncCapaAuditService.logEvent(id, 'ORIGINATOR_RETURN', actorId, `Originating department returned the response: ${reviewData.reason}`);
    }
    
    return this.updateRecord(record);
  }

  async qaqcFinalClosure(id, action, reviewData, actorId) {
    const record = await this.getById(id);
    if (!record) throw new Error("Record not found");

    if (action === 'CLOSE') {
      record.status = CAPA_STATUS.CLOSED;
      ncCapaAuditService.logEvent(id, 'QAQC_CLOSE', actorId, `QAQC closed the record`);
    } else if (action === 'ACKNOWLEDGE') {
      ncCapaAuditService.logEvent(id, 'QAQC_ACKNOWLEDGE', actorId, `QAQC acknowledged the record`);
    }
    
    return this.updateRecord(record);
  }

  async updateRecord(updatedRecord) {
    const index = this.records.findIndex(r => r.id === updatedRecord.id);
    if (index !== -1) {
      this.records[index] = updatedRecord;
    }
    return Promise.resolve(updatedRecord);
  }

  // Wrapper for RCA
  async submitRca(id, rcaData, actorId) {
    const record = await this.getById(id);
    if (!record) throw new Error("Record not found");
    
    // Convert to ncCapa structure briefly for the service
    const tempNc = { ...record, status: 'ROOT_CAUSE_IN_PROGRESS', ncNumber: record.id };
    const updated = ncCapaRcaService.submit(tempNc, rcaData, actorId);
    
    // Map back
    record.rootCauseAnalysis = updated.rootCauseAnalysis;
    record.status = CAPA_STATUS.ACTION_PLAN_REQUIRED;
    
    return this.updateRecord(record);
  }

  // ... (Other wrappers can be added as needed, but for the UI we can also call NcCapaPlanService directly after adapting the object)
}

export const qualityEventCapaService = new QualityEventCapaService();
