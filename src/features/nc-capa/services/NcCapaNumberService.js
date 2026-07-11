class NcCapaNumberService {
  /**
   * Generate next NC number in NC-YYYY-XXXX format
   */
  generateNextNumber(currentMaxSeq = 0) {
    const year = new Date().getFullYear();
    const nextSeq = currentMaxSeq + 1;
    const paddedSeq = nextSeq.toString().padStart(4, '0');
    return `NC-${year}-${paddedSeq}`;
  }
}

export const ncCapaNumberService = new NcCapaNumberService();
