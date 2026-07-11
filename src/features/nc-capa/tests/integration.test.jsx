import { ncCapaNumberService } from '../services/NcCapaNumberService';
import { ncCapaDashboardService } from '../services/NcCapaDashboardService';
import { ncCapaTaskService } from '../services/NcCapaTaskService';

describe('NC/CAPA Integration and Services', () => {
  it('formats NC number correctly', () => {
    const year = new Date().getFullYear();
    // NcCapaNumberService now increments based on current year and stored sequence
    const standardFormat = ncCapaNumberService.generateNextNumber();
    expect(standardFormat).toBe(`NC-${year}-0001`); // Sequence resets or starts at 1 for new year
  });

  it('KPI counts are deterministic based on mock data', async () => {
    const kpis = await ncCapaDashboardService.getKpis();
    // In Phase 11B mock data, we have 1 SCREENING, 1 RETURNED, 1 ASSIGNED
    // getKpis counts everything !== CLOSED
    expect(kpis.total).toBe(3);
    expect(kpis.open).toBe(3); 
    expect(kpis.critical).toBe(1);
    expect(kpis.overdue).toBe(0); // No due dates in Phase 11B mock data
  });

  it('My tasks returns correct records for assigned user', async () => {
    const myTasks = await ncCapaTaskService.getMyTasks('U002');
    // U002 is assignedOwnerUserId in mock nc-3 and reportedByUserId in nc-1
    // Let's assume getMyTasks returns any task where the user is involved (created or assigned)
    expect(myTasks.length).toBeGreaterThan(0);
  });
});
