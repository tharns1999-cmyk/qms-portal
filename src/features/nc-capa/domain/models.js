export const NC_STATUS = {
  DRAFT: 'DRAFT',
  SUBMITTED: 'SUBMITTED',
  SCREENING: 'SCREENING',
  RETURNED_FOR_INFO: 'RETURNED_FOR_INFO',
  REJECTED_NOT_NC: 'REJECTED_NOT_NC',
  ASSIGNED: 'ASSIGNED',
  ROOT_CAUSE_IN_PROGRESS: 'ROOT_CAUSE_IN_PROGRESS',
  QA_VERIFICATION: 'QA_VERIFICATION',
  OPEN: 'OPEN',
  IN_PROGRESS: 'IN_PROGRESS',
  CLOSED: 'CLOSED',
  CANCELLED: 'CANCELLED'
};

export const NCScreeningDecision = {
  ACCEPT_AS_NC: 'ACCEPT_AS_NC',
  RETURN_FOR_MORE_INFORMATION: 'RETURN_FOR_MORE_INFORMATION',
  REJECT_AS_NOT_NC: 'REJECT_AS_NOT_NC'
};

export const CAPARequirementDecision = {
  CAPA_REQUIRED: 'CAPA_REQUIRED',
  CORRECTION_ONLY: 'CORRECTION_ONLY'
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
  SCREEN: 'NC_CAPA_SCREEN',
  ASSIGN_OWNER: 'NC_CAPA_ASSIGN_OWNER',
  ADMIN: 'NC_CAPA_ADMIN',
  AUDIT_VIEW: 'NC_CAPA_AUDIT_VIEW'
};

export const EMPTY_NC_DRAFT = {
  id: '',
  ncNumber: '',
  title: '',
  description: '',
  sourceType: '',
  detectedDate: '',
  reportedByUserId: '',
  detectedByUserId: '',
  departmentId: '',
  area: '',
  product: '',
  lotNo: '',
  process: '',
  relatedDocumentIds: [],
  relatedExternalDocumentIds: [],
  relatedPeriodicReviewId: '',
  relatedStandardMappings: [],
  severity: NC_SEVERITY.LOW,
  foodSafetyImpact: false,
  customerImpact: false,
  regulatoryImpact: false,
  immediateCorrection: '',
  containmentAction: '',
  containmentNotRequired: false,
  containmentNotRequiredReason: '',
  attachmentMetadata: [],
  capaRequired: null,
  status: NC_STATUS.DRAFT,
  assignedOwnerUserId: '',
  assignedDepartmentId: '',
  screeningResult: '',
  screeningComment: '',
  createdAt: null,
  updatedAt: null,
  submittedAt: null,
  returnedAt: null,
  rejectedAt: null
};
