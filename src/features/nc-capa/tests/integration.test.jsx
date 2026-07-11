import { ncCapaNumberService } from '../services/NcCapaNumberService';
import { ncCapaDashboardService } from '../services/NcCapaDashboardService';
import { ncCapaTaskService } from '../services/NcCapaTaskService';

describe('NC/CAPA Integration and Services', () => {
  it('formats NC number correctly', () => {
    const year = new Date().getFullYear();
    const formatted = ncCapaNumberService.generateNextNumber(5);
    expect(formatted).toBe(`NC-${year}-0006`);
  });

  it('KPI counts are deterministic based on mock data', async () => {
    const kpis = await ncCapaDashboardService.getKpis();
    // Using the 3 mock records in ncCapaMockData.js
    // 2 are OPEN/IN_PROGRESS, 1 is CRITICAL, 1 is overdue (due 2023)
    expect(kpis.total).toBe(3);
    expect(kpis.open).toBe(3); // None are CLOSED
    expect(kpis.critical).toBe(1);
    expect(kpis.overdue).toBe(3); // All are due in 2023, which is in the past!
  });

  it('My tasks returns correct records for assigned user', async () => {
    const myTasks = await ncCapaTaskService.getMyTasks('U004');
    expect(myTasks.length).toBe(1);
    expect(myTasks[0].ncNumber).toBe('NC-2023-0001');
  });
});
