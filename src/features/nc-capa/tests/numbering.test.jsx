import { describe, it, expect, beforeEach } from 'vitest';
import { ncCapaNumberService } from '../services/NcCapaNumberService';

describe('NC/CAPA Numbering Service', () => {
  beforeEach(() => {
    ncCapaNumberService.reset();
  });

  it('generates next sequential number for current year', () => {
    // Current year should be 2023 because reset sets it to 2023 with seq 3
    const nextNum = ncCapaNumberService.generateNextNumber(2023);
    expect(nextNum).toBe('NC-2023-0004');
    
    const nextNum2 = ncCapaNumberService.generateNextNumber(2023);
    expect(nextNum2).toBe('NC-2023-0005');
  });

  it('starts at 1 for a new year', () => {
    const nextNum = ncCapaNumberService.generateNextNumber(2024);
    expect(nextNum).toBe('NC-2024-0001');
  });

  it('pads sequence to 4 digits', () => {
    const nextNum = ncCapaNumberService.generateNextNumber(2025);
    expect(nextNum.length).toBe('NC-2025-0001'.length);
    expect(nextNum).toMatch(/NC-\d{4}-\d{4}/);
  });
});
