import { describe, it, expect, beforeEach } from 'vitest';
import { qualityEventComplaintService, COMPLAINT_STATUS } from '../features/quality-event/services/QualityEventComplaintService';
import { MASTER_DATA_USER } from '../store/useStore';
import { 
  canCreateComplaint, 
  canInvestigateComplaint, 
  canRecordCustomerResponse, 
  canApproveComplaint, 
  getSafeComplaintView 
} from '../utils/permissionHelper';

describe('Phase 12E: Customer Complaint', () => {
  let qaqcUser, pdUser, mktUser, pmUser, enUser;

  beforeEach(() => {
    qaqcUser = MASTER_DATA_USER.find(u => u.id === 'U005'); // QAQC
    pdUser = MASTER_DATA_USER.find(u => u.id === 'U002'); // Production
    enUser = MASTER_DATA_USER.find(u => u.id === 'U006'); // Engineering
    mktUser = MASTER_DATA_USER.find(u => u.id === 'U010'); // Marketing
    pmUser = MASTER_DATA_USER.find(u => u.id === 'U009'); // Plant Manager

    // Reset records
    qualityEventComplaintService.records = [];
  });

  describe('Permissions', () => {
    it('only QAQC can create complaints', () => {
      expect(canCreateComplaint(qaqcUser)).toBe(true);
      expect(canCreateComplaint(pdUser)).toBe(false);
      expect(canCreateComplaint(mktUser)).toBe(false);
      expect(canCreateComplaint(pmUser)).toBe(false);
    });

    it('unassigned department cannot investigate', () => {
      const complaint = { responsibleDepartmentId: 'PD', responsibleUserId: null };
      expect(canInvestigateComplaint(pdUser, complaint)).toBe(true);
      expect(canInvestigateComplaint(enUser, complaint)).toBe(false);
    });

    it('marketing/sales can record response only when assigned or permitted', () => {
      const complaint = { responseDepartmentId: 'MKT', responseByUserId: null };
      expect(canRecordCustomerResponse(mktUser, complaint)).toBe(true);
      expect(canRecordCustomerResponse(pdUser, complaint)).toBe(false);
    });

    it('plant manager approval requires appropriate permission', () => {
      const complaint = {};
      expect(canApproveComplaint(pmUser, complaint)).toBe(true);
      expect(canApproveComplaint(pdUser, complaint)).toBe(false);
      expect(canApproveComplaint(mktUser, complaint)).toBe(false);
    });
  });

  describe('Sensitive Data Masking', () => {
    it('masks customer details for unauthorized users', () => {
      const complaint = {
        customerName: 'Secret Client Corp',
        customerAddress: '123 Classified St',
        telephone: '555-0000',
        email: 'ceo@secret.com'
      };

      // QAQC should see
      const qaqcView = getSafeComplaintView(qaqcUser, complaint);
      expect(qaqcView.customerName).toBe('Secret Client Corp');

      // PM should see
      const pmView = getSafeComplaintView(pmUser, complaint);
      expect(pmView.customerName).toBe('Secret Client Corp');

      // PD (Restricted) should NOT see
      const pdView = getSafeComplaintView(pdUser, complaint);
      expect(pdView.customerName).toBe('*** MASKED ***');
      expect(pdView.email).toBe('*** MASKED ***');
    });
  });

  describe('Workflow Lifecycle', () => {
    it('creates draft, submits, assigns, investigates, reviews, records response, approves, and closes', async () => {
      // 1. Create & Submit Draft (QAQC)
      const draft = qualityEventComplaintService.createDraftShell(qaqcUser);
      draft.customerName = 'Test Customer';
      draft.productName = 'Test Product';
      
      const submitted = await qualityEventComplaintService.submitComplaint(draft.id, qaqcUser);
      expect(submitted.complaintStatus).toBe(COMPLAINT_STATUS.RISK_SCREENING);

      // 2. Assign Department (QAQC)
      const assigned = await qualityEventComplaintService.assignDepartment(submitted.id, {
        responsibleDepartmentId: 'PD',
        investigationDueDate: '2026-12-31'
      }, qaqcUser);
      expect(assigned.complaintStatus).toBe(COMPLAINT_STATUS.ASSIGNED_TO_DEPARTMENT);

      // 3. Investigate (PD)
      const investigated = await qualityEventComplaintService.submitInvestigation(assigned.id, {
        investigationResult: 'Found issue',
        rootCause: 'Machine broke',
        correction: 'Fixed',
        prevention: 'PM updated'
      }, pdUser);
      expect(investigated.complaintStatus).toBe(COMPLAINT_STATUS.INVESTIGATION_SUBMITTED);

      // 4. Review (QAQC)
      const reviewed = await qualityEventComplaintService.reviewInvestigation(investigated.id, {
        action: 'ACCEPT',
        reviewComment: 'Looks good',
        capaRequired: false,
        ncrHoldRequired: false
      }, qaqcUser);
      expect(reviewed.complaintStatus).toBe(COMPLAINT_STATUS.PENDING_CUSTOMER_RESPONSE);

      // 5. Customer Response (MKT)
      // MKT needs to be assigned first logically, update it in the mock DB directly for test purposes
      const recordInDb = qualityEventComplaintService.records.find(r => r.id === reviewed.id);
      recordInDb.responseDepartmentId = 'MKT';
      
      const responded = await qualityEventComplaintService.recordCustomerResponse(reviewed.id, {
        responseDetail: 'Emailed customer',
        replacement: true,
        submitForApproval: true
      }, mktUser);
      expect(responded.complaintStatus).toBe(COMPLAINT_STATUS.PENDING_PLANT_MANAGER_APPROVAL);

      // 6. Approval (PM)
      const approved = await qualityEventComplaintService.submitComplaintApproval(responded.id, {
        action: 'APPROVED',
        approvalComment: 'Approved replacement'
      }, pmUser);
      expect(approved.complaintStatus).toBe(COMPLAINT_STATUS.APPROVED);

      // 7. Close (QAQC)
      const closed = await qualityEventComplaintService.closeComplaint(approved.id, {
        closureResult: 'CLOSED_OK',
        closureComment: 'Done'
      }, qaqcUser);
      expect(closed.complaintStatus).toBe(COMPLAINT_STATUS.CLOSED);
    });

    it('blocks closure if required CAPA is not linked', async () => {
      const draft = qualityEventComplaintService.createDraftShell(qaqcUser);
      const submitted = await qualityEventComplaintService.submitComplaint(draft.id, qaqcUser);
      
      const assigned = await qualityEventComplaintService.assignDepartment(submitted.id, {
        responsibleDepartmentId: 'PD',
        investigationDueDate: '2026-12-31'
      }, qaqcUser);

      const investigated = await qualityEventComplaintService.submitInvestigation(assigned.id, {
        investigationResult: 'Issue',
        rootCause: 'Root',
        correction: 'Fixed',
        prevention: 'PM'
      }, pdUser);

      const reviewed = await qualityEventComplaintService.reviewInvestigation(investigated.id, {
        action: 'ACCEPT',
        reviewComment: 'CAPA needed',
        capaRequired: true,
        ncrHoldRequired: false
      }, qaqcUser);
      
      expect(reviewed.capaRequired).toBe(true);
      expect(reviewed.linkedCapaId || null).toBe(null);

      // Try close without override
      await expect(qualityEventComplaintService.closeComplaint(reviewed.id, {
        closureResult: 'CLOSED_OK',
        closureComment: 'Close it'
      }, qaqcUser)).rejects.toThrow(/Cannot close complaint while required CAPA is unlinked/);

      // Try close with override
      const overridden = await qualityEventComplaintService.closeComplaint(reviewed.id, {
        closureResult: 'CLOSED_OK',
        closureComment: 'Close it',
        overrideJustification: 'CAPA managed externally'
      }, qaqcUser);
      expect(overridden.complaintStatus).toBe(COMPLAINT_STATUS.CLOSED);
    });

    it('blocks closure if linked CAPA is open', async () => {
      const draft = qualityEventComplaintService.createDraftShell(qaqcUser);
      const submitted = await qualityEventComplaintService.submitComplaint(draft.id, qaqcUser);
      
      const recordInDb = qualityEventComplaintService.records.find(r => r.id === submitted.id);
      recordInDb.capaRequired = true;
      recordInDb.linkedCapaId = 'CAR-2026-0001'; // Mock CAPA which is open

      await expect(qualityEventComplaintService.closeComplaint(submitted.id, {
        closureResult: 'CLOSED_OK',
        closureComment: 'Close it'
      }, qaqcUser)).rejects.toThrow(/Cannot close complaint while linked CAPA is still open/);
    });
  });
});
