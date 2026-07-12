import { describe, it, expect, beforeEach } from 'vitest';
import { qualityEventCapaService, CAPA_STATUS } from '../services/QualityEventCapaService';
import { qualityEventNumberService } from '../services/QualityEventNumberService';
import { canCreateCapa, getUserPermissions, PERMISSIONS } from '../../../utils/permissionHelper';

describe('Phase 12C Quality Event Tests (Corrected Workflow)', () => {
  beforeEach(() => {
    qualityEventNumberService.reset();
  });

  describe('Record Numbering', () => {
    it('generates correct prefix for CAR', () => {
      const num = qualityEventNumberService.generateNextNumber('CAR');
      expect(num).toMatch(/^CAR-\d{4}-\d{4}$/);
    });

    it('generates correct prefix for PAR', () => {
      const num = qualityEventNumberService.generateNextNumber('PAR');
      expect(num).toMatch(/^PAR-\d{4}-\d{4}$/);
    });

    it('generates correct prefix for CAPA', () => {
      const num = qualityEventNumberService.generateNextNumber('CAPA');
      expect(num).toMatch(/^CAPA-\d{4}-\d{4}$/);
    });

    it('drafts do not consume final number', async () => {
      const draft = qualityEventCapaService.createDraftShell();
      await qualityEventCapaService.saveDraft(draft);
      expect(draft.id).toMatch(/^DRAFT-/);
      
      const num = qualityEventNumberService.generateNextNumber('CAR');
      expect(num.endsWith('0001')).toBe(true);
    });
  });

  describe('Permissions', () => {
    it('grants CAPA_CREATE to non-QAQC departments', () => {
      const mockUser = { id: 'u1', department: 'Production' };
      const perms = getUserPermissions(mockUser);
      expect(perms).toContain(PERMISSIONS.CAPA_CREATE);
      expect(canCreateCapa(mockUser)).toBe(true);
    });

    it('QAQC closure requires CAPA_CLOSE or CAPA_ADMIN', () => {
      const mockQaqc = { id: 'u2', department: 'QAQC', isQaqc: true };
      const perms = getUserPermissions(mockQaqc);
      expect(perms).toContain(PERMISSIONS.CAPA_CLOSE);
    });
  });

  describe('Workflow and Originator Review', () => {
    it('submits draft directly to ASSIGNED target department', async () => {
      const draft = qualityEventCapaService.createDraftShell();
      draft.recordType = 'CAR';
      draft.title = 'Test Title';
      draft.responsibleDept = 'Maintenance';
      
      const record = await qualityEventCapaService.submitNewCapa(draft, 'u1');
      expect(record.status).toBe(CAPA_STATUS.ASSIGNED);
      expect(record.id).toMatch(/^CAR-/);
      expect(record.responseDueDate).toBeDefined(); // SLA starts immediately
    });

    it('Target department responds and Originator can accept', async () => {
      const draft = qualityEventCapaService.createDraftShell();
      draft.recordType = 'CAR';
      const record = await qualityEventCapaService.submitNewCapa(draft, 'u1');
      
      const responded = await qualityEventCapaService.targetDepartmentRespond(record.id, {
        correction: 'Fixed issue'
      }, 'u2');
      
      expect(responded.status).toBe(CAPA_STATUS.PENDING_ORIGINATOR_REVIEW);
      
      const accepted = await qualityEventCapaService.originatorReviewResponse(record.id, 'ACCEPT', {}, 'u1');
      expect(accepted.status).toBe(CAPA_STATUS.PENDING_QAQC_CLOSURE);
    });

    it('QAQC can final close', async () => {
      const draft = qualityEventCapaService.createDraftShell();
      draft.recordType = 'CAR';
      const record = await qualityEventCapaService.submitNewCapa(draft, 'u1');
      
      await qualityEventCapaService.targetDepartmentRespond(record.id, {}, 'u2');
      await qualityEventCapaService.originatorReviewResponse(record.id, 'ACCEPT', {}, 'u1');
      
      const closed = await qualityEventCapaService.qaqcFinalClosure(record.id, 'CLOSE', {}, 'admin');
      expect(closed.status).toBe(CAPA_STATUS.CLOSED);
    });
  });
});
