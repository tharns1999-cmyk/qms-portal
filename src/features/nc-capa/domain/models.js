export const NC_STATUS = {
  DRAFT: 'DRAFT',
  OPEN: 'OPEN',
  IN_PROGRESS: 'IN_PROGRESS',
  CLOSED: 'CLOSED'
};

export const NC_SEVERITY = {
  LOW: 'LOW',
  MEDIUM: 'MEDIUM',
  HIGH: 'HIGH',
  CRITICAL: 'CRITICAL'
};

export const NC_PERMISSIONS = {
  VIEW: 'NC_CAPA_VIEW',
  VIEW_ALL: 'NC_CAPA_VIEW_ALL',
  CREATE: 'NC_CAPA_CREATE',
  ADMIN: 'NC_CAPA_ADMIN',
  AUDIT_VIEW: 'NC_CAPA_AUDIT_VIEW'
};

export const EMPTY_NC_DRAFT = {
  id: '',
  ncNumber: '',
  title: '',
  description: '',
  status: NC_STATUS.DRAFT,
  severity: NC_SEVERITY.LOW,
  createdAt: null,
  createdBy: '',
  assignedTo: ''
};
