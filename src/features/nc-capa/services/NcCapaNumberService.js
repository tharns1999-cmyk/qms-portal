class NcCapaNumberService {
  constructor() {
    this.currentSequenceByYear = { '2023': 3 }; // Matches the 3 mock records in 2023
  }

  generateNextNumber(yearOverride = null) {
    const year = yearOverride || new Date().getFullYear();
    if (!this.currentSequenceByYear[year]) {
      this.currentSequenceByYear[year] = 0;
    }
    
    this.currentSequenceByYear[year] += 1;
    const seq = this.currentSequenceByYear[year];
    const seqStr = String(seq).padStart(4, '0');
    return `NC-${year}-${seqStr}`;
  }

  reset() {
    this.currentSequenceByYear = { '2023': 3 };
  }
}

export const ncCapaNumberService = new NcCapaNumberService();
