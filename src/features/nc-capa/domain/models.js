export const NC_STATUS = {
  DRAFT: 'DRAFT',
  SUBMITTED: 'SUBMITTED',
  SCREENING: 'SCREENING',
  RETURNED_FOR_INFO: 'RETURNED_FOR_INFO',
  REJECTED_NOT_NC: 'REJECTED_NOT_NC',
  ASSIGNED: 'ASSIGNED',
  ROOT_CAUSE_IN_PROGRESS: 'ROOT_CAUSE_IN_PROGRESS',
  CAPA_PLAN_REQUIRED: 'CAPA_PLAN_REQUIRED',
  CAPA_PLAN_REVIEW: 'CAPA_PLAN_REVIEW',
  CAPA_PLAN_RETURNED: 'CAPA_PLAN_RETURNED',
  ACTION_IN_PROGRESS: 'ACTION_IN_PROGRESS',
  QA_VERIFICATION: 'QA_VERIFICATION',
  EFFECTIVENESS_CHECK: 'EFFECTIVENESS_CHECK',
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
  OWNER_ACTION: 'NC_CAPA_OWNER_ACTION',
  RCA_COMPLETE: 'NC_CAPA_RCA_COMPLETE',
  PLAN_CREATE: 'NC_CAPA_PLAN_CREATE',
  PLAN_REVIEW: 'NC_CAPA_PLAN_REVIEW',
  ACTION_EXECUTE: 'NC_CAPA_ACTION_EXECUTE',
  EVIDENCE_SUBMIT: 'NC_CAPA_EVIDENCE_SUBMIT',
  VERIFY: 'NC_CAPA_VERIFY',
  ADMIN: 'NC_CAPA_ADMIN',
  AUDIT_VIEW: 'NC_CAPA_AUDIT_VIEW'
};

export const RootCauseMethod = {
  FIVE_WHY: 'FIVE_WHY',
  CAUSE_CATEGORY: 'CAUSE_CATEGORY',
  FIVE_WHY_AND_CATEGORY: 'FIVE_WHY_AND_CATEGORY'
};

export const CauseCategory = {
  MAN: 'MAN',
  MACHINE: 'MACHINE',
  MATERIAL: 'MATERIAL',
  METHOD: 'METHOD',
  MEASUREMENT: 'MEASUREMENT',
  ENVIRONMENT: 'ENVIRONMENT',
  MANAGEMENT: 'MANAGEMENT'
};

export const CAPAActionType = {
  CORRECTION: 'CORRECTION',
  CORRECTIVE_ACTION: 'CORRECTIVE_ACTION',
  PREVENTIVE_ACTION: 'PREVENTIVE_ACTION'
};

export const CAPAPlanReviewStatus = {
  DRAFT: 'DRAFT',
  SUBMITTED: 'SUBMITTED',
  RETURNED_FOR_CORRECTION: 'RETURNED_FOR_CORRECTION',
  APPROVED: 'APPROVED'
};

export const CAPAActionStatus = {
  PLANNED: 'PLANNED',
  PENDING_EXECUTION: 'PENDING_EXECUTION',
  IN_PROGRESS: 'IN_PROGRESS',
  EVIDENCE_REQUIRED: 'EVIDENCE_REQUIRED',
  EVIDENCE_SUBMITTED: 'EVIDENCE_SUBMITTED',
  RETURNED_FOR_CORRECTION: 'RETURNED_FOR_CORRECTION',
  COMPLETED: 'COMPLETED',
  VERIFIED: 'VERIFIED',
  FAILED_VERIFICATION: 'FAILED_VERIFICATION',
  OVERDUE: 'OVERDUE'
};

export const EvidenceValidationStatus = {
  NO_EVIDENCE: 'NO_EVIDENCE',
  VALID_METADATA: 'VALID_METADATA',
  INVALID_TYPE: 'INVALID_TYPE',
  TOO_LARGE: 'TOO_LARGE',
  CORRUPTED_OR_UNREADABLE: 'CORRUPTED_OR_UNREADABLE',
  REMOVED: 'REMOVED',
  REPLACED: 'REPLACED'
};

export const VerificationResult = {
  PASS: 'PASS',
  RETURN_FOR_CORRECTION: 'RETURN_FOR_CORRECTION',
  FAIL: 'FAIL'
};

export const DocumentImpact = {
  NO_DOCUMENT_IMPACT: 'NO_DOCUMENT_IMPACT',
  NEW_DOCUMENT_REQUIRED: 'NEW_DOCUMENT_REQUIRED',
  DOCUMENT_REVISION_REQUIRED: 'DOCUMENT_REVISION_REQUIRED',
  DOCUMENT_OBSOLETE_REQUIRED: 'DOCUMENT_OBSOLETE_REQUIRED',
  PERIODIC_REVIEW_REQUIRED: 'PERIODIC_REVIEW_REQUIRED'
};

export const TrainingImpact = {
  NO_TRAINING_IMPACT: 'NO_TRAINING_IMPACT',
  TRAINING_REQUIRED: 'TRAINING_REQUIRED',
  AWARENESS_REQUIRED: 'AWARENESS_REQUIRED'
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
  rejectedAt: null,
  rootCauseAnalysis: {
    method: '',
    problemStatement: '',
    why1: '',
    why2: '',
    why3: '',
    why4: '',
    why5: '',
    causeCategories: [],
    categoryExplanation: '',
    rootCauseSummary: '',
    createdByUserId: '',
    submittedAt: null
  },
  capaActionPlan: {
    actions: [],
    planSummary: '',
    documentImpactAssessment: '',
    trainingImpactAssessment: '',
    reviewStatus: CAPAPlanReviewStatus.DRAFT,
    reviewComment: '',
    submittedAt: null
  }
};
