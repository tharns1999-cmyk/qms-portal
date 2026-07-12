import { describe, it, expect, beforeEach } from 'vitest';
import { qualityEventNcrService, NCR_STATUS, HOLD_STATUS } from '../services/QualityEventNcrService';
import { qualityEventNumberService } from '../services/QualityEventNumberService';
import { canCreateNcr, canCreateHold, canRespondToNcr, PERMISSIONS } from '../../../utils/permissionHelper';

// Mock users mapping permissions strictly
const mockQaqcUser = { id: 'U-QA', name: 'QA User', department: 'QA', permissions: [PERMISSIONS.NCR_CREATE_QAQC_ONLY, PERMISSIONS.HOLD_CREATE_QAQC_ONLY, PERMISSIONS.NCR_VIEW_ALL, PERMISSIONS.HOLD_VIEW_ALL, PERMISSIONS.NCR_FOLLOW_UP, PERMISSIONS.NCR_CLOSE, PERMISSIONS.HOLD_CLOSE] };
const mockPdUser = { id: 'U-PD', name: 'PD User', department: 'PD', permissions: [PERMISSIONS.NCR_RESPOND, PERMISSIONS.HOLD_EXECUTION_UPDATE] };
const mockWhUser = { id: 'U-WH', name: 'WH User', department: 'WH', permissions: [PERMISSIONS.NCR_RESPOND, PERMISSIONS.HOLD_EXECUTION_UPDATE] };
const mockMgrUser = { id: 'U-MGR', name: 'Manager', department: 'MGT', permissions: [PERMISSIONS.HOLD_RELEASE_APPROVE, PERMISSIONS.HOLD_DISPOSITION_APPROVE, PERMISSIONS.QUALITY_EVENT_MANAGEMENT_APPROVE] };
const mockNormalUser = { id: 'U-NORMAL', name: 'Normal', department: 'PD', permissions: [] };

describe('Phase 12D: NCR / HOLD / RELEASE Workflows', () => {
  beforeEach(() => {
    qualityEventNumberService.reset();
    qualityEventNcrService.drafts.clear();
    // We do not clear records here entirely because the service starts with mocks, but we can test new ones added at the front
  });

  describe('Permissions Guardrails', () => {
    it('only allows QAQC users with specific permission to create NCR or HOLD', () => {
      expect(canCreateNcr(mockQaqcUser)).toBe(true);
      expect(canCreateHold(mockQaqcUser)).toBe(true);
      expect(canCreateNcr(mockPdUser)).toBe(false);
      expect(canCreateHold(mockPdUser)).toBe(false);
    });

    it('requires both permission and assignment to respond', () => {
      // Mock record assigned to PD
      const record = { responsibleDepartmentId: 'PD', responsibleUserId: null };
      expect(canRespondToNcr(mockPdUser, record)).toBe(true); // Has permission and is PD
      expect(canRespondToNcr(mockWhUser, record)).toBe(false); // Has permission but is WH
      expect(canRespondToNcr(mockNormalUser, record)).toBe(false); // Is PD but no permission
    });

    it('uses approval matrix to verify disposition approval access', () => {
       // mockMgrUser has HOLD_RELEASE_APPROVE, HOLD_DISPOSITION_APPROVE, QUALITY_EVENT_MANAGEMENT_APPROVE
       // RELEASE_LOW requires HOLD_RELEASE_APPROVE -> should pass
       expect(qualityEventNcrService.canApproveDisposition(mockMgrUser, { foodSafetyRelated: false }, 'RELEASE_LOW')).toBe(true);
       
       // PD user should fail everything
       expect(qualityEventNcrService.canApproveDisposition(mockPdUser, { foodSafetyRelated: false }, 'RELEASE_LOW')).toBe(false);
    });
  });

  describe('Numbering Generation Rules', () => {
    it('generates only NCR number for NCR type', async () => {
      const draft = qualityEventNcrService.createDraftShell(mockQaqcUser);
      draft.recordType = 'NCR';
      draft.responsibleDepartmentId = 'PD';
      await qualityEventNcrService.saveDraft(draft);

      const record = await qualityEventNcrService.submitNcr(draft.id, mockQaqcUser);
      expect(record.recordNo).toMatch(/^NCR-\d{4}-\d{4}$/);
      expect(record.holdNo).toBeNull();
      expect(record.holdStatus).toBe(HOLD_STATUS.NOT_REQUIRED);
    });

    it('generates only HOLD number for HOLD_RELEASE type', async () => {
      const draft = qualityEventNcrService.createDraftShell(mockQaqcUser);
      draft.recordType = 'HOLD_RELEASE';
      draft.responsibleDepartmentId = 'QA';
      await qualityEventNcrService.saveDraft(draft);

      const record = await qualityEventNcrService.submitNcr(draft.id, mockQaqcUser);
      expect(record.holdNo).toMatch(/^HOLD-\d{4}-\d{4}$/);
      expect(record.recordNo).toBeNull();
      expect(record.holdStatus).toBe(HOLD_STATUS.HOLD_ACTIVE);
    });

    it('generates both NCR and HOLD numbers for NCR_WITH_HOLD type', async () => {
      const draft = qualityEventNcrService.createDraftShell(mockQaqcUser);
      draft.recordType = 'NCR_WITH_HOLD';
      draft.responsibleDepartmentId = 'PD';
      await qualityEventNcrService.saveDraft(draft);

      const record = await qualityEventNcrService.submitNcr(draft.id, mockQaqcUser);
      expect(record.recordNo).toMatch(/^NCR-\d{4}-\d{4}$/);
      expect(record.holdNo).toMatch(/^HOLD-\d{4}-\d{4}$/);
      expect(record.id).toBe(record.recordNo);
      expect(record.holdStatus).toBe(HOLD_STATUS.HOLD_ACTIVE);
      expect(record.ncrStatus).toBe(NCR_STATUS.ASSIGNED_TO_DEPARTMENT);
    });
  });

  describe('Full NCR Response and Release Workflow', () => {
    it('completes a full NCR with HOLD flow correctly', async () => {
      // 1. QA creates draft
      const draft = qualityEventNcrService.createDraftShell(mockQaqcUser);
      draft.recordType = 'NCR_WITH_HOLD';
      draft.responsibleDepartmentId = 'PD';
      draft.materialOrProductStatus = 'WIP_IN_PROCESS';
      await qualityEventNcrService.saveDraft(draft);

      // 2. QA submits
      let record = await qualityEventNcrService.submitNcr(draft.id, mockQaqcUser);
      const recordId = record.id;
      expect(record.ncrStatus).toBe(NCR_STATUS.ASSIGNED_TO_DEPARTMENT);

      // 3. PD User Responds
      record = await qualityEventNcrService.submitDepartmentResponse(recordId, {
         causeOfProblem: 'Machine error',
         correction: 'Fixed machine',
         longTermPrevention: 'Maintenance schedule',
         expectedCompletionDate: '2026-07-20'
      }, mockPdUser);
      expect(record.ncrStatus).toBe(NCR_STATUS.RESPONSE_SUBMITTED);
      expect(record.causeOfProblem).toBe('Machine error');

      // 4. QA Follow-up
      record = await qualityEventNcrService.performFollowUp(recordId, 1, { completed: true }, mockQaqcUser);
      expect(record.ncrStatus).toBe(NCR_STATUS.FOLLOW_UP_1);

      // 5. QA Proposes Release Disposition
      record = await qualityEventNcrService.proposeDisposition(recordId, { disposition: 'RELEASED' }, mockQaqcUser);
      expect(record.ncrStatus).toBe(NCR_STATUS.PENDING_APPROVAL);
      expect(record.holdStatus).toBe(NCR_STATUS.PENDING_RELEASE_APPROVAL);

      // 6. Manager Approves
      record = await qualityEventNcrService.submitDispositionApproval(recordId, { action: 'APPROVED' }, mockMgrUser);
      expect(record.holdStatus).toBe(HOLD_STATUS.RELEASED);

      // 7. PD Acknowledges Handling
      record = await qualityEventNcrService.acknowledgeHandlingTask(recordId, 'task_pd', 'Done', mockPdUser);
      expect(record.handling.tasks.find(t => t.id === 'task_pd').completed).toBe(true);

      // 8. QA Closes NCR
      record = await qualityEventNcrService.closeRecord(recordId, mockQaqcUser);
      expect(record.ncrStatus).toBe(NCR_STATUS.CLOSED);
      expect(record.holdStatus).toBe(HOLD_STATUS.CLOSED);
    });
  });
});
