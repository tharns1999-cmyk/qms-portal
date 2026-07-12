import { qualityEventNumberService } from './QualityEventNumberService';
import { canCreateNcr, canCreateHold, canRespondToNcr, canPerformFollowUp, canCloseNcrHold, PERMISSIONS, hasPermission } from '../../../utils/permissionHelper';
import { mockNcrRecords, mockApprovalMatrix } from '../mock/qualityEventNcrMockData';

export const NCR_STATUS = {
  DRAFT: 'DRAFT',
  QAQC_OPENED: 'QAQC_OPENED',
  ASSIGNED_TO_DEPARTMENT: 'ASSIGNED_TO_DEPARTMENT',
  DEPARTMENT_RESPONDING: 'DEPARTMENT_RESPONDING',
  RESPONSE_SUBMITTED: 'RESPONSE_SUBMITTED',
  PENDING_QAQC_FOLLOW_UP: 'PENDING_QAQC_FOLLOW_UP',
  FOLLOW_UP_1: 'FOLLOW_UP_1',
  FOLLOW_UP_2: 'FOLLOW_UP_2',
  FOLLOW_UP_3: 'FOLLOW_UP_3',
  PENDING_RELEASE_DECISION: 'PENDING_RELEASE_DECISION',
  PENDING_APPROVAL: 'PENDING_APPROVAL',
  CLOSED: 'CLOSED',
  CANCELLED: 'CANCELLED',
  NEW_NCR_REQUIRED: 'NEW_NCR_REQUIRED'
};

export const HOLD_STATUS = {
  NOT_REQUIRED: 'NOT_REQUIRED',
  HOLD_ACTIVE: 'HOLD_ACTIVE',
  PENDING_DISPOSITION: 'PENDING_DISPOSITION',
  PENDING_RELEASE_APPROVAL: 'PENDING_RELEASE_APPROVAL',
  RELEASED: 'RELEASED',
  REJECTED: 'REJECTED',
  OTHER_DISPOSITION: 'OTHER_DISPOSITION',
  CLOSED: 'CLOSED'
};

class QualityEventNcrService {
  constructor() {
    this.records = [...mockNcrRecords];
    this.drafts = new Map();
  }

  async getAll() {
    return this.records;
  }

  async getById(id) {
    return this.records.find(r => r.id === id || r.holdNo === id || r.recordNo === id) || this.drafts.get(id);
  }

  createDraftShell(user) {
    const draftId = `DRAFT-${Date.now()}`;
    const draft = {
      id: draftId,
      recordNo: null,
      holdNo: null,
      ncrStatus: NCR_STATUS.DRAFT,
      holdStatus: HOLD_STATUS.NOT_REQUIRED,
      formCode: 'FM-QC-130 R01',
      recordType: 'NCR', // NCR, HOLD_RELEASE, NCR_WITH_HOLD
      itemCategory: 'RAW_MATERIAL',
      materialOrProductStatus: 'RM_NOT_PROCESSED',
      holdRequired: false,
      createdBy: user.id,
      createdAt: new Date().toISOString()
    };
    this.drafts.set(draftId, draft);
    return draft;
  }

  async saveDraft(draftData) {
    if (!draftData.id.startsWith('DRAFT-')) throw new Error("Not a draft");
    this.drafts.set(draftData.id, { ...draftData });
    return this.drafts.get(draftData.id);
  }

  async submitNcr(draftId, actorUser) {
    const draft = this.drafts.get(draftId);
    if (!draft) throw new Error("Draft not found");

    if (draft.recordType === 'NCR' || draft.recordType === 'NCR_WITH_HOLD') {
      if (!canCreateNcr(actorUser)) throw new Error("Access Denied: Missing NCR_CREATE_QAQC_ONLY permission");
    }
    if (draft.recordType === 'HOLD_RELEASE' || draft.recordType === 'NCR_WITH_HOLD') {
      if (!canCreateHold(actorUser)) throw new Error("Access Denied: Missing HOLD_CREATE_QAQC_ONLY permission");
    }

    const newRecord = { ...draft };
    
    // Numbering logic
    if (draft.recordType === 'NCR') {
      newRecord.recordNo = qualityEventNumberService.generateNextNumber('NCR');
      newRecord.id = newRecord.recordNo;
      newRecord.holdStatus = HOLD_STATUS.NOT_REQUIRED;
    } else if (draft.recordType === 'HOLD_RELEASE') {
      newRecord.holdNo = qualityEventNumberService.generateNextNumber('HOLD');
      newRecord.id = newRecord.holdNo;
      newRecord.recordNo = null; // No NCR
      newRecord.holdStatus = HOLD_STATUS.HOLD_ACTIVE;
    } else if (draft.recordType === 'NCR_WITH_HOLD') {
      newRecord.recordNo = qualityEventNumberService.generateNextNumber('NCR');
      newRecord.holdNo = qualityEventNumberService.generateNextNumber('HOLD');
      newRecord.id = newRecord.recordNo;
      newRecord.holdStatus = HOLD_STATUS.HOLD_ACTIVE;
    }

    newRecord.ncrStatus = draft.responsibleDepartmentId ? NCR_STATUS.ASSIGNED_TO_DEPARTMENT : NCR_STATUS.QAQC_OPENED;
    newRecord.submittedAt = new Date().toISOString();
    
    // SLA Rule: Typically NCR response is due within a set time.
    if (draft.responsibleDepartmentId && !newRecord.responseDueDate) {
       const due = new Date();
       due.setDate(due.getDate() + 3);
       newRecord.responseDueDate = due.toISOString();
    }

    newRecord.auditTrail = [
      { id: `AUDIT-${Date.now()}`, action: 'SUBMITTED', actor: actorUser.name, actorId: actorUser.id, date: new Date().toISOString() }
    ];

    this.records.unshift(newRecord);
    this.drafts.delete(draftId);

    return newRecord;
  }

  async submitDepartmentResponse(id, responseData, actorUser) {
    const record = await this.getById(id);
    if (!record) throw new Error("Record not found");

    if (!canRespondToNcr(actorUser, record)) {
      throw new Error("Access Denied: You do not have permission or are not assigned to this record");
    }

    record.ncrStatus = NCR_STATUS.RESPONSE_SUBMITTED;
    record.responseSubmittedAt = new Date().toISOString();
    
    record.causeOfProblem = responseData.causeOfProblem;
    record.correction = responseData.correction;
    record.longTermPrevention = responseData.longTermPrevention;
    record.actionOwnerUserId = responseData.actionOwnerUserId;
    record.expectedCompletionDate = responseData.expectedCompletionDate;

    record.auditTrail.push({
      id: `AUDIT-${Date.now()}`, action: 'DEPARTMENT_RESPONSE', actor: actorUser.name, actorId: actorUser.id, date: new Date().toISOString()
    });

    return record;
  }

  async performFollowUp(id, stepNumber, followUpData, actorUser) {
    const record = await this.getById(id);
    if (!record) throw new Error("Record not found");

    if (!canPerformFollowUp(actorUser, record)) {
      throw new Error("Access Denied: Missing NCR_FOLLOW_UP permission");
    }

    if (!record.followUps) record.followUps = [];

    const fup = {
      step: stepNumber,
      completed: followUpData.completed,
      comment: followUpData.comment,
      followUpPerson: actorUser.name,
      followUpDate: new Date().toISOString(),
      newNcrRequired: followUpData.newNcrRequired,
      newNcrNo: followUpData.newNcrNo
    };

    record.followUps.push(fup);

    if (stepNumber === 1) record.ncrStatus = NCR_STATUS.FOLLOW_UP_1;
    if (stepNumber === 2) record.ncrStatus = NCR_STATUS.FOLLOW_UP_2;
    if (stepNumber === 3) record.ncrStatus = NCR_STATUS.FOLLOW_UP_3;

    if (followUpData.newNcrRequired) {
      record.ncrStatus = NCR_STATUS.NEW_NCR_REQUIRED;
    }

    record.auditTrail.push({
      id: `AUDIT-${Date.now()}`, action: `FOLLOW_UP_${stepNumber}`, actor: actorUser.name, actorId: actorUser.id, date: new Date().toISOString()
    });

    return record;
  }

  async proposeDisposition(id, dispositionData, actorUser) {
    const record = await this.getById(id);
    if (!record) throw new Error("Record not found");

    record.finalDisposition = dispositionData.disposition;
    record.ncrStatus = NCR_STATUS.PENDING_APPROVAL;
    record.holdStatus = NCR_STATUS.PENDING_RELEASE_APPROVAL; // Wait, PENDING_RELEASE_APPROVAL is holdStatus
    
    record.auditTrail.push({
      id: `AUDIT-${Date.now()}`, action: `DISPOSITION_PROPOSED: ${dispositionData.disposition}`, actor: actorUser.name, actorId: actorUser.id, date: new Date().toISOString()
    });

    return record;
  }

  // Returns true if user has the correct approval permission based on the matrix and record
  canApproveDisposition(actorUser, record, disposition) {
    // Basic fallback if matrix check is complex
    let requiredPerms = mockApprovalMatrix[disposition] || mockApprovalMatrix['OTHER'];
    if (record.foodSafetyRelated) {
        requiredPerms = mockApprovalMatrix['FOOD_SAFETY_CRITICAL'];
    }
    
    // Check if user has ANY of the required perms from the matrix
    return requiredPerms.some(perm => hasPermission(actorUser, perm));
  }

  async submitDispositionApproval(id, approvalPayload, actorUser) {
    const record = await this.getById(id);
    if (!record) throw new Error("Record not found");

    if (!this.canApproveDisposition(actorUser, record, record.finalDisposition)) {
       throw new Error("Access Denied: You do not have the required approval matrix permission for this disposition");
    }

    if (!record.approvals) record.approvals = [];
    record.approvals.push({
      actor: actorUser.name,
      actorId: actorUser.id,
      date: new Date().toISOString(),
      action: approvalPayload.action, // APPROVED / REJECTED
      comment: approvalPayload.comment
    });

    if (approvalPayload.action === 'APPROVED') {
       if (record.finalDisposition === 'RELEASED') record.holdStatus = HOLD_STATUS.RELEASED;
       else if (record.finalDisposition === 'REJECTED') record.holdStatus = HOLD_STATUS.REJECTED;
       else record.holdStatus = HOLD_STATUS.OTHER_DISPOSITION;
       
       // Generate Handling Tasks based on category and disposition
       if (!record.handling) {
         record.handling = { tasks: [] };
         const category = record.materialOrProductStatus;
         if (category === 'RM_NOT_PROCESSED') {
             record.handling.tasks.push({ id: 'task_pc', type: 'PURCHASING_ACK', requiredDept: 'PC', label: 'Purchasing Acknowledgement', completed: false });
             if (record.finalDisposition === 'REJECTED') record.handling.tasks.push({ id: 'task_dest', type: 'DESTRUCTION_RECEIVER_ACK', requiredDept: 'WH', label: 'Destruction Receiver', completed: false });
         } else if (category === 'WIP_IN_PROCESS') {
             record.handling.tasks.push({ id: 'task_pd', type: 'PRODUCTION_ACK', requiredDept: 'PD', label: 'Production Acknowledgement', completed: false });
             if (record.finalDisposition === 'REJECTED') record.handling.tasks.push({ id: 'task_dest', type: 'DESTRUCTION_RECEIVER_ACK', requiredDept: 'WH', label: 'Destruction Receiver', completed: false });
         } else if (category === 'FG_PROCESS_COMPLETED') {
             record.handling.tasks.push({ id: 'task_sales', type: 'SALES_ACK', requiredDept: 'SALES', label: 'Sales Supervisor Acknowledgement', completed: false });
             record.handling.tasks.push({ id: 'task_pp', type: 'PLANNING_ACK', requiredDept: 'PLANNING', label: 'Production Planning Acknowledgement', completed: false });
             record.handling.tasks.push({ id: 'task_cold', type: 'COLD_STORAGE_ACK', requiredDept: 'WH', label: 'Cold Storage Acknowledgement', completed: false });
             if (record.finalDisposition === 'REJECTED') record.handling.tasks.push({ id: 'task_dest', type: 'DESTRUCTION_RECEIVER_ACK', requiredDept: 'WH', label: 'Destruction Receiver', completed: false });
         }
       }
    } else {
       record.holdStatus = HOLD_STATUS.HOLD_ACTIVE; // Reverts back
       record.ncrStatus = NCR_STATUS.PENDING_RELEASE_DECISION;
    }

    record.auditTrail.push({
      id: `AUDIT-${Date.now()}`, action: `DISPOSITION_APPROVAL_${approvalPayload.action}`, actor: actorUser.name, actorId: actorUser.id, date: new Date().toISOString()
    });

    return record;
  }

  async acknowledgeHandlingTask(id, taskId, comment, actorUser) {
    const record = await this.getById(id);
    if (!record || !record.handling || !record.handling.tasks) throw new Error("Record or handling tasks not found");

    const task = record.handling.tasks.find(t => t.id === taskId);
    if (!task) throw new Error("Handling task not found");

    if (task.requiredDept !== actorUser.department && !hasPermission(actorUser, PERMISSIONS.HOLD_ADMIN)) {
       throw new Error(`Access Denied: Only ${task.requiredDept} can acknowledge this task.`);
    }

    task.completed = true;
    task.comment = comment;
    task.acknowledgedBy = actorUser.name;
    task.acknowledgedAt = new Date().toISOString();

    record.auditTrail.push({
      id: `AUDIT-${Date.now()}`, action: `HANDLING_ACK_${task.type}`, actor: actorUser.name, actorId: actorUser.id, date: new Date().toISOString()
    });

    return record;
  }
  
  async closeRecord(id, actorUser) {
    const record = await this.getById(id);
    if (!record) throw new Error("Record not found");
    
    if (!canCloseNcrHold(actorUser, record)) {
        throw new Error("Access Denied: Missing close permission");
    }
    
    record.ncrStatus = NCR_STATUS.CLOSED;
    record.holdStatus = HOLD_STATUS.CLOSED;
    record.closedAt = new Date().toISOString();
    
    record.auditTrail.push({
      id: `AUDIT-${Date.now()}`, action: `CLOSED`, actor: actorUser.name, actorId: actorUser.id, date: new Date().toISOString()
    });
    
    return record;
  }
}

export const qualityEventNcrService = new QualityEventNcrService();
