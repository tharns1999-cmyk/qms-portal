class QualityEventNumberService {
  constructor() {
    this.counters = {
      CAPA: 0,
      CAR: 0,
      PAR: 0
    };
  }

  generateNextNumber(recordType) {
    const year = new Date().getFullYear();
    let prefix = 'CAPA';
    
    if (recordType === 'CAR') prefix = 'CAR';
    else if (recordType === 'PAR') prefix = 'PAR';
    else prefix = 'CAPA'; // Covers QUALITY_COMPLAINT and CAPA

    this.counters[prefix]++;
    const sequence = this.counters[prefix].toString().padStart(4, '0');
    return `${prefix}-${year}-${sequence}`;
  }

  reset() {
    this.counters = {
      CAPA: 0,
      CAR: 0,
      PAR: 0
    };
  }
}

export const qualityEventNumberService = new QualityEventNumberService();
