import { qualityEventNumberService } from './QualityEventNumberService';
import { canCreateComplaint, canInvestigateComplaint, canReviewComplaintInvestigation, canRecordCustomerResponse, canApproveComplaint, canCloseComplaint, canAssignComplaintDepartment } from '../../../utils/permissionHelper';
import { mockComplaints } from '../mock/qualityEventComplaintMockData';
import useStore from '../../../store/useStore';
import { qualityEventCapaService } from './QualityEventCapaService';
import { qualityEventNcrService } from './QualityEventNcrService';

export const COMPLAINT_STATUS = {
  DRAFT: 'DRAFT',
  QAQC_REGISTERED: 'QAQC_REGISTERED',
  RISK_SCREENING: 'RISK_SCREENING',
  ASSIGNED_TO_DEPARTMENT: 'ASSIGNED_TO_DEPARTMENT',
  INVESTIGATION_IN_PROGRESS: 'INVESTIGATION_IN_PROGRESS',
  INVESTIGATION_SUBMITTED: 'INVESTIGATION_SUBMITTED',
  PENDING_QAQC_REVIEW: 'PENDING_QAQC_REVIEW',
  RETURNED_FOR_INVESTIGATION: 'RETURNED_FOR_INVESTIGATION',
  CAPA_REQUIRED: 'CAPA_REQUIRED',
  NCR_HOLD_REQUIRED: 'NCR_HOLD_REQUIRED',
  PENDING_CUSTOMER_RESPONSE: 'PENDING_CUSTOMER_RESPONSE',
  CUSTOMER_RESPONSE_RECORDED: 'CUSTOMER_RESPONSE_RECORDED',
  PENDING_PLANT_MANAGER_APPROVAL: 'PENDING_PLANT_MANAGER_APPROVAL',
  APPROVED: 'APPROVED',
  PENDING_QAQC_CLOSURE: 'PENDING_QAQC_CLOSURE',
  CLOSED: 'CLOSED',
  REOPENED: 'REOPENED',
  CANCELLED: 'CANCELLED'
};

class QualityEventComplaintService {
  constructor() {
    this.records = [...mockComplaints];
    this.drafts = new Map();
  }

  async getAllRecords() {
    return this.records;
  }

  async getRecordById(id) {
    const record = this.records.find(r => r.id === id);
    if (!record) throw new Error('Complaint record not found');
    return { ...record };
  }

  createDraftShell(user) {
    if (!canCreateComplaint(user)) {
      throw new Error('Access Denied: Only QAQC can create Customer Complaints');
    }
    const draftId = `DRAFT-CC-${Date.now()}`;
    const draft = {
      id: draftId,
      recordNo: null,
      formCode: 'FM-QC-68',
      formRevision: 'R01',
      complaintStatus: COMPLAINT_STATUS.DRAFT,
      
      // Part 1: Intake
      receivedDate: new Date().toISOString().split('T')[0],
      receivedTime: new Date().toISOString().split('T')[1].substring(0, 5),
      receivedChannel: '',
      receivedByUserId: user.id,
      receivedDepartmentId: user.department,
      sentToQaqcDate: '',
      sentToQaqcTime: '',

      // Part 2: Customer
      customerName: '',
      customerCompany: '',
      customerAddress: '',
      city: '',
      province: '',
      postalCode: '',
      telephone: '',
      fax: '',
      email: '',
      contactPerson: '',
      customerReference: '',

      // Part 3: Product
      productName: '',
      productCode: '',
      size: '',
      codeOnPackage: '',
      lotNo: '',
      productionDate: '',
      deliveryDate: '',
      purchaseOrder: '',
      totalQuantity: '',
      quantityAffected: '',

      // Part 4: Details
      complaintDescription: '',
      details: '',
      qualityRelated: false,
      foodSafetyRelated: false,
      complaintCategories: [],
      severity: 'LOW',
      recallWithdrawalFlag: false,
      immediateContainmentRequired: false,
      productHoldRequired: false,

      // Part 5: Medical
      illnessOrInjury: false,
      symptoms: '',
      seenDoctor: false,
      spokenToPublicHealth: false,
      goneToHospital: false,
      medicalDetails: '',

      // Part 6: Assignment / Investigation
      responsibleDepartmentId: null,
      responsibleUserId: null,
      investigationDueDate: '',
      investigationInstruction: '',
      investigationResult: '',
      rootCause: '',
      correction: '',
      prevention: '',
      evidenceMetadata: [],
      investigationSubmittedBy: null,
      investigationSubmittedAt: null,

      // Part 7: QAQC Review
      reviewResult: '',
      reviewComment: '',
      capaRequired: false,
      ncrHoldRequired: false,
      recallWithdrawalShellRequired: false,
      linkedCapaId: null,
      linkedNcrHoldId: null,

      // Part 8: Customer Response
      responseDate: '',
      responseByUserId: null,
      responseDepartmentId: null, // Often MKT or Sales
      responseDetail: '',
      replacement: false,
      recallWithdrawal: false,
      compensation: false,
      otherAction: '',
      customerResponseStatus: 'PENDING',

      // Part 9: Approval & Closure
      plantManagerApprovalStatus: 'PENDING',
      approvalComment: '',
      approvedBy: null,
      approvedAt: null,
      closureResult: '',
      closureComment: '',
      closedBy: null,
      closedAt: null,

      linkedRecords: [],
      auditTrail: [{
        id: Date.now().toString(),
        action: 'DRAFT_CREATED',
        actorId: user.id,
        actorName: user.name,
        timestamp: new Date().toISOString(),
        details: 'Draft CC created'
      }],
      comments: [],
      visibilityLevel: 'RESTRICTED',
      createdBy: user.id,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      submittedAt: null
    };

    this.drafts.set(draftId, draft);
    return { ...draft };
  }

  async saveDraft(draftData) {
    if (this.drafts.has(draftData.id)) {
      this.drafts.set(draftData.id, { ...draftData, updatedAt: new Date().toISOString() });
    }
  }

  async getDraft(id) {
    if (!this.drafts.has(id)) throw new Error('Draft not found');
    return { ...this.drafts.get(id) };
  }

  async submitComplaint(draftId, user) {
    if (!canCreateComplaint(user)) throw new Error('Access Denied');
    const draft = await this.getDraft(draftId);

    const recordNo = qualityEventNumberService.generateNextNumber('CC');
    const record = {
      ...draft,
      id: recordNo,
      recordNo: recordNo,
      complaintStatus: COMPLAINT_STATUS.RISK_SCREENING, // Based on rule: after registration -> RISK_SCREENING
      submittedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    record.auditTrail.push({
      id: Date.now().toString(),
      action: 'COMPLAINT_SUBMITTED',
      actorId: user.id,
      actorName: user.name,
      timestamp: new Date().toISOString(),
      details: `Complaint ${recordNo} registered by QAQC`
    });

    if (record.responsibleDepartmentId) {
      record.complaintStatus = COMPLAINT_STATUS.ASSIGNED_TO_DEPARTMENT;
      // Mock notification
      console.log(`[TaskService] Created COMPLAINT_INVESTIGATION_TASK for ${recordNo}`);
    }

    this.records.unshift(record);
    this.drafts.delete(draftId);

    useStore.getState().logAction('COMPLAINT_SUBMITTED', `Complaint ${recordNo} registered`);
    
    return { ...record };
  }

  async assignDepartment(id, assignmentData, user) {
    const record = await this.getRecordById(id);
    if (!canAssignComplaintDepartment(user, record)) throw new Error('Access Denied');

    record.responsibleDepartmentId = assignmentData.responsibleDepartmentId;
    record.responsibleUserId = assignmentData.responsibleUserId;
    record.investigationDueDate = assignmentData.investigationDueDate;
    record.investigationInstruction = assignmentData.investigationInstruction;
    record.complaintStatus = COMPLAINT_STATUS.ASSIGNED_TO_DEPARTMENT;
    record.updatedAt = new Date().toISOString();

    record.auditTrail.push({
      id: Date.now().toString(),
      action: 'DEPARTMENT_ASSIGNED',
      actorId: user.id,
      actorName: user.name,
      timestamp: new Date().toISOString(),
      details: `Assigned to ${record.responsibleDepartmentId}`
    });

    const index = this.records.findIndex(r => r.id === id);
    this.records[index] = record;
    return { ...record };
  }

  async submitInvestigation(id, payload, user) {
    const record = await this.getRecordById(id);
    if (!canInvestigateComplaint(user, record)) throw new Error('Access Denied: You cannot investigate this complaint');

    record.investigationResult = payload.investigationResult;
    record.rootCause = payload.rootCause;
    record.correction = payload.correction;
    record.prevention = payload.prevention;
    record.investigationSubmittedBy = user.id;
    record.investigationSubmittedAt = new Date().toISOString();
    record.complaintStatus = COMPLAINT_STATUS.INVESTIGATION_SUBMITTED;
    record.updatedAt = new Date().toISOString();

    record.auditTrail.push({
      id: Date.now().toString(),
      action: 'INVESTIGATION_SUBMITTED',
      actorId: user.id,
      actorName: user.name,
      timestamp: new Date().toISOString(),
      details: `Investigation submitted by ${user.department}`
    });

    const index = this.records.findIndex(r => r.id === id);
    this.records[index] = record;
    return { ...record };
  }

  async reviewInvestigation(id, payload, user) {
    const record = await this.getRecordById(id);
    if (!canReviewComplaintInvestigation(user, record)) throw new Error('Access Denied');

    record.reviewResult = payload.reviewResult;
    record.reviewComment = payload.reviewComment;
    record.capaRequired = payload.capaRequired;
    record.ncrHoldRequired = payload.ncrHoldRequired;
    record.linkedCapaId = payload.linkedCapaId;
    record.linkedNcrHoldId = payload.linkedNcrHoldId;
    record.updatedAt = new Date().toISOString();

    let actionDetail = 'Investigation reviewed';

    if (payload.action === 'RETURN') {
      record.complaintStatus = COMPLAINT_STATUS.RETURNED_FOR_INVESTIGATION;
      actionDetail = 'Investigation returned: ' + payload.reviewComment;
    } else {
      if (payload.capaRequired) record.complaintStatus = COMPLAINT_STATUS.CAPA_REQUIRED;
      else if (payload.ncrHoldRequired) record.complaintStatus = COMPLAINT_STATUS.NCR_HOLD_REQUIRED;
      else record.complaintStatus = COMPLAINT_STATUS.PENDING_CUSTOMER_RESPONSE;
    }

    record.auditTrail.push({
      id: Date.now().toString(),
      action: 'INVESTIGATION_REVIEWED',
      actorId: user.id,
      actorName: user.name,
      timestamp: new Date().toISOString(),
      details: actionDetail
    });

    const index = this.records.findIndex(r => r.id === id);
    this.records[index] = record;
    return { ...record };
  }

  async recordCustomerResponse(id, payload, user) {
    const record = await this.getRecordById(id);
    if (!canRecordCustomerResponse(user, record)) throw new Error('Access Denied');

    record.responseDate = payload.responseDate || new Date().toISOString();
    record.responseByUserId = user.id;
    record.responseDepartmentId = user.department;
    record.responseDetail = payload.responseDetail;
    record.replacement = payload.replacement;
    record.recallWithdrawal = payload.recallWithdrawal;
    record.compensation = payload.compensation;
    record.otherAction = payload.otherAction;
    record.complaintStatus = COMPLAINT_STATUS.CUSTOMER_RESPONSE_RECORDED;
    
    if (payload.submitForApproval) {
      record.complaintStatus = COMPLAINT_STATUS.PENDING_PLANT_MANAGER_APPROVAL;
    }

    record.updatedAt = new Date().toISOString();

    record.auditTrail.push({
      id: Date.now().toString(),
      action: 'CUSTOMER_RESPONSE_RECORDED',
      actorId: user.id,
      actorName: user.name,
      timestamp: new Date().toISOString(),
      details: payload.submitForApproval ? 'Customer response submitted for approval' : 'Customer response updated'
    });

    const index = this.records.findIndex(r => r.id === id);
    this.records[index] = record;
    return { ...record };
  }

  async submitComplaintApproval(id, payload, user) {
    const record = await this.getRecordById(id);
    if (!canApproveComplaint(user, record)) throw new Error('Access Denied');

    record.plantManagerApprovalStatus = payload.action;
    record.approvalComment = payload.approvalComment;
    record.approvedBy = user.id;
    record.approvedAt = new Date().toISOString();
    
    if (payload.action === 'APPROVED') {
      record.complaintStatus = COMPLAINT_STATUS.APPROVED;
      // move to QAQC closure
      setTimeout(() => {
        // Just state update, in real life we would trigger an event
      }, 0);
    } else {
      record.complaintStatus = COMPLAINT_STATUS.PENDING_CUSTOMER_RESPONSE; // returned
    }

    record.updatedAt = new Date().toISOString();

    record.auditTrail.push({
      id: Date.now().toString(),
      action: 'MANAGEMENT_APPROVAL',
      actorId: user.id,
      actorName: user.name,
      timestamp: new Date().toISOString(),
      details: `Approval: ${payload.action} - ${payload.approvalComment}`
    });

    const index = this.records.findIndex(r => r.id === id);
    this.records[index] = record;
    return { ...record };
  }

  async closeComplaint(id, payload, user) {
    const record = await this.getRecordById(id);
    if (!canCloseComplaint(user, record)) throw new Error('Access Denied');

    // Rule: Cannot close if linked CAPA is open unless override
    if (record.capaRequired && !payload.overrideJustification) {
      if (!record.linkedCapaId) {
        throw new Error('Cannot close complaint while required CAPA is unlinked, unless override justification is provided.');
      }
      try {
        const linkedCapa = await qualityEventCapaService.getRecordById(record.linkedCapaId);
        if (linkedCapa.status !== 'CLOSED') {
          throw new Error('Cannot close complaint while linked CAPA is still open, unless override justification is provided.');
        }
      } catch (err) {
        if (err.message.includes('Cannot close')) throw err;
        throw new Error('Cannot close complaint while linked CAPA is still open, unless override justification is provided.');
      }
    }

    // Rule: Cannot close if linked NCR/HOLD is open unless override
    if (record.ncrHoldRequired && !payload.overrideJustification) {
      if (!record.linkedNcrHoldId) {
        throw new Error('Cannot close complaint while required NCR/HOLD is unlinked, unless override justification is provided.');
      }
      try {
        const linkedNcr = await qualityEventNcrService.getRecordById(record.linkedNcrHoldId);
        if (linkedNcr.ncrStatus !== 'CLOSED' && linkedNcr.holdStatus !== 'CLOSED') {
           throw new Error('Cannot close complaint while linked NCR/HOLD is still open, unless override justification is provided.');
        }
      } catch (err) {
        if (err.message.includes('Cannot close')) throw err;
        throw new Error('Cannot close complaint while linked NCR/HOLD is still open, unless override justification is provided.');
      }
    }

    record.closureResult = payload.closureResult;
    record.closureComment = payload.closureComment;
    record.closedBy = user.id;
    record.closedAt = new Date().toISOString();
    record.complaintStatus = COMPLAINT_STATUS.CLOSED;
    record.updatedAt = new Date().toISOString();

    record.auditTrail.push({
      id: Date.now().toString(),
      action: 'COMPLAINT_CLOSED',
      actorId: user.id,
      actorName: user.name,
      timestamp: new Date().toISOString(),
      details: `Complaint Closed. ${payload.overrideJustification ? 'Override: ' + payload.overrideJustification : ''}`
    });

    const index = this.records.findIndex(r => r.id === id);
    this.records[index] = record;
    return { ...record };
  }
}

export const qualityEventComplaintService = new QualityEventComplaintService();
