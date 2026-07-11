class NcCapaAuditService {
  constructor() {
    this.auditEvents = []; // In-memory mock store
  }

  logEvent(ncId, action, actorId, details, comment = '') {
    const event = {
      id: `AUDIT-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      ncId,
      action,
      actorId,
      details,
      comment,
      timestamp: new Date().toISOString()
    };
    
    this.auditEvents.unshift(event);
    return event;
  }

  getEventsForNc(ncId) {
    return this.auditEvents.filter(e => e.ncId === ncId);
  }

  reset() {
    this.auditEvents = [];
  }
}

export const ncCapaAuditService = new NcCapaAuditService();
