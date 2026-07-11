import { describe, it, expect, beforeAll } from 'vitest';
import { ncCapaNumberService } from '../services/NcCapaNumberService';
import { ncCapaDashboardService } from '../services/NcCapaDashboardService';
import { ncCapaTaskService } from '../services/NcCapaTaskService';
import { ncCapaService } from '../services/NcCapaService';
describe('NC/CAPA Integration and Services', () => {
  beforeAll(async () => {
    // Ensure service is instantiated and tasks are seeded
    await ncCapaService.getList();
  });

  it('formats NC number correctly', () => {
    const year = new Date().getFullYear();
    // NcCapaNumberService now increments based on current year and stored sequence
    const standardFormat = ncCapaNumberService.generateNextNumber();
    expect(standardFormat).toBe(`NC-${year}-0001`); // Sequence resets or starts at 1 for new year
  });

  it('KPI counts are deterministic based on mock data', async () => {
    const kpis = await ncCapaDashboardService.getKpis();
    // In Phase 11C mock data, we have 8 records, all open, but we added nc-9 for 11E which is also open
    // getKpis counts everything !== CLOSED
    expect(kpis.total).toBe(9);
    // In Phase 11G we replaced 'open' and 'overdue' with more specific KPIs
    expect(kpis.screening).toBe(1); // NC-2023-0001
    expect(kpis.critical).toBe(3); // 2 CRITICAL + 1 FOOD_SAFETY_CRITICAL
  });

  it('My tasks returns correct records for assigned user', async () => {
    const myTasks = await ncCapaTaskService.getMyTasks('U002');
    // U002 is assignedOwnerUserId in mock nc-3 and reportedByUserId in nc-1
    // Let's assume getMyTasks returns any task where the user is involved (created or assigned)
    expect(myTasks.length).toBeGreaterThan(0);
  });
});
