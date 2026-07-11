import { describe, it, expect, beforeEach } from 'vitest';
import { ncCapaEffectivenessService } from '../services/NcCapaEffectivenessService';
import { NC_STATUS, CAPAActionStatus, EffectivenessResult, NC_PERMISSIONS } from '../domain/models';
import { mockNcRecords } from '../mock/ncCapaMockData';

// Setup mock users
const U005_QA = { id: 'U005', name: 'QA User', permissions: [NC_PERMISSIONS.EFFECTIVENESS_CHECK, NC_PERMISSIONS.CLOSE, NC_PERMISSIONS.REOPEN] };
const U002_NORMAL = { id: 'U002', name: 'Normal User', permissions: [] };

describe('Phase 11E Effectiveness Check Logic', () => {
  let record;

  beforeEach(() => {
    record = mockNcRecords.find(nc => nc.id === 'nc-9');
    // reset to initial state
    record.status = NC_STATUS.EFFECTIVENESS_CHECK;
    record.effectivenessCheck = undefined;
    record.closedAt = undefined;
    record.closedByUserId = undefined;
    record.capaActionPlan.actions.forEach(a => {
      a.status = CAPAActionStatus.VERIFIED;
      a.verifiedAt = '2023-10-28T10:00:00Z';
    });
  });

  const validCheckData = {
    actualCheckDate: '2023-11-01',
    checkMethod: 'Visual inspection',
    recurrenceObserved: false,
    result: EffectivenessResult.EFFECTIVE,
    closureComment: 'Looks good'
  };

  it('Effectiveness Check allowed only in EFFECTIVENESS_CHECK status', async () => {
    record.status = NC_STATUS.ACTION_IN_PROGRESS;
    await expect(
      ncCapaEffectivenessService.submitEffectivenessCheck(record.id, validCheckData, U005_QA)
    ).rejects.toThrow('allowed only in EFFECTIVENESS_CHECK status');
  });

  it('blocked when any action is not VERIFIED', async () => {
    record.status = NC_STATUS.EFFECTIVENESS_CHECK;
    record.capaActionPlan.actions[0].status = CAPAActionStatus.IN_PROGRESS;
    
    await expect(
      ncCapaEffectivenessService.submitEffectivenessCheck(record.id, validCheckData, U005_QA)
    ).rejects.toThrow('Blocked: All actions must be VERIFIED before effectiveness check');
  });

  it('blocked for unauthorized user', async () => {
    await expect(
      ncCapaEffectivenessService.submitEffectivenessCheck(record.id, validCheckData, U002_NORMAL)
    ).rejects.toThrow('Unauthorized user: Missing NC_CAPA_EFFECTIVENESS_CHECK or NC_CAPA_ADMIN permission');
  });

  it('actual check date required', async () => {
    const data = { ...validCheckData, actualCheckDate: '' };
    await expect(
      ncCapaEffectivenessService.submitEffectivenessCheck(record.id, data, U005_QA)
    ).rejects.toThrow('Actual check date is required');
  });

  it('check method required', async () => {
    const data = { ...validCheckData, checkMethod: '' };
    await expect(
      ncCapaEffectivenessService.submitEffectivenessCheck(record.id, data, U005_QA)
    ).rejects.toThrow('Check method is required');
  });

  it('recurrence observed decision required', async () => {
    const data = { ...validCheckData, recurrenceObserved: undefined };
    await expect(
      ncCapaEffectivenessService.submitEffectivenessCheck(record.id, data, U005_QA)
    ).rejects.toThrow('Recurrence observed decision is required');
  });

  it('result required', async () => {
    const data = { ...validCheckData, result: '' };
    await expect(
      ncCapaEffectivenessService.submitEffectivenessCheck(record.id, data, U005_QA)
    ).rejects.toThrow('Result is required');
  });

  it('actual date cannot be before all actions verified date', async () => {
    const data = { ...validCheckData, actualCheckDate: '2023-10-27' }; // Before latest verification (2023-10-28)
    await expect(
      ncCapaEffectivenessService.submitEffectivenessCheck(record.id, data, U005_QA)
    ).rejects.toThrow('Actual check date cannot be before all actions verified date');
  });

  it('EFFECTIVE result can close NC/CAPA', async () => {
    const res = await ncCapaEffectivenessService.submitEffectivenessCheck(record.id, validCheckData, U005_QA);
    expect(res.status).toBe(NC_STATUS.CLOSED);
    expect(res.closedAt).toBeDefined();
    expect(res.closedByUserId).toBe(U005_QA.id);
  });

  it('closure requires comment', async () => {
    const data = { ...validCheckData, closureComment: '' };
    await expect(
      ncCapaEffectivenessService.submitEffectivenessCheck(record.id, data, U005_QA)
    ).rejects.toThrow('Closure requires comment');
  });

  it('closure requires NC_CAPA_CLOSE or NC_CAPA_ADMIN', async () => {
    const userOnlyEff = { id: 'U999', permissions: [NC_PERMISSIONS.EFFECTIVENESS_CHECK] };
    await expect(
      ncCapaEffectivenessService.submitEffectivenessCheck(record.id, validCheckData, userOnlyEff)
    ).rejects.toThrow('Closure requires NC_CAPA_CLOSE or NC_CAPA_ADMIN permission');
  });

  it('PARTIALLY_EFFECTIVE can create additional action shell', async () => {
    const data = { 
      actualCheckDate: '2023-11-01',
      checkMethod: 'Visual inspection',
      recurrenceObserved: false,
      result: EffectivenessResult.PARTIALLY_EFFECTIVE,
      requiresAdditionalAction: true,
      reasonComment: 'Need more training'
    };
    const res = await ncCapaEffectivenessService.submitEffectivenessCheck(record.id, data, U005_QA);
    expect(res.status).toBe(NC_STATUS.ADDITIONAL_ACTION_REQUIRED);
  });

  it('NOT_EFFECTIVE can reopen CAPA', async () => {
    const data = { 
      actualCheckDate: '2023-11-01',
      checkMethod: 'Visual inspection',
      recurrenceObserved: true,
      result: EffectivenessResult.NOT_EFFECTIVE,
      reasonComment: 'Did not work at all'
    };
    const res = await ncCapaEffectivenessService.submitEffectivenessCheck(record.id, data, U005_QA);
    expect(res.status).toBe(NC_STATUS.REOPENED);
  });

  it('repeated close/reopen/additional-action is idempotent', async () => {
    const data = { ...validCheckData };
    const res1 = await ncCapaEffectivenessService.submitEffectivenessCheck(record.id, data, U005_QA);
    expect(res1.status).toBe(NC_STATUS.CLOSED);
    
    // Call close again, should be idempotent and not throw an error about status
    const res2 = await ncCapaEffectivenessService._closeNc(record, U005_QA, data);
    expect(res2.status).toBe(NC_STATUS.CLOSED);
  });
});
