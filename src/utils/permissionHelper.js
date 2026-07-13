export const PERMISSIONS = {
  NCR_CREATE_QAQC_ONLY: 'NCR_CREATE_QAQC_ONLY',
  HOLD_CREATE_QAQC_ONLY: 'HOLD_CREATE_QAQC_ONLY',
  NCR_VIEW: 'NCR_VIEW',
  NCR_VIEW_ALL: 'NCR_VIEW_ALL',
  NCR_ASSIGN_RESPONSIBLE_DEPT: 'NCR_ASSIGN_RESPONSIBLE_DEPT',
  NCR_RESPOND: 'NCR_RESPOND',
  NCR_FOLLOW_UP: 'NCR_FOLLOW_UP',
  NCR_CLOSE: 'NCR_CLOSE',
  NCR_ADMIN: 'NCR_ADMIN',
  NCR_AUDIT_VIEW: 'NCR_AUDIT_VIEW',

  HOLD_VIEW: 'HOLD_VIEW',
  HOLD_VIEW_ALL: 'HOLD_VIEW_ALL',
  HOLD_VIEW_RESTRICTED: 'HOLD_VIEW_RESTRICTED',
  HOLD_DISPOSITION_PROPOSE: 'HOLD_DISPOSITION_PROPOSE',
  HOLD_DISPOSITION_APPROVE: 'HOLD_DISPOSITION_APPROVE',
  HOLD_RELEASE_APPROVE: 'HOLD_RELEASE_APPROVE',
  HOLD_EXECUTION_UPDATE: 'HOLD_EXECUTION_UPDATE',
  HOLD_CLOSE: 'HOLD_CLOSE',
  HOLD_ADMIN: 'HOLD_ADMIN',

  CAPA_VIEW: 'CAPA_VIEW',
  CAPA_VIEW_ALL: 'CAPA_VIEW_ALL',
  CAPA_CREATE: 'CAPA_CREATE',
  CAPA_REVIEW: 'CAPA_REVIEW',
  CAPA_ASSIGN_OWNER: 'CAPA_ASSIGN_OWNER',
  CAPA_RCA: 'CAPA_RCA',
  CAPA_PLAN_CREATE: 'CAPA_PLAN_CREATE',
  CAPA_PLAN_REVIEW: 'CAPA_PLAN_REVIEW',
  CAPA_ACTION_EXECUTE: 'CAPA_ACTION_EXECUTE',
  CAPA_EVIDENCE_SUBMIT: 'CAPA_EVIDENCE_SUBMIT',
  CAPA_VERIFY: 'CAPA_VERIFY',
  CAPA_EFFECTIVENESS_CHECK: 'CAPA_EFFECTIVENESS_CHECK',
  CAPA_CLOSE: 'CAPA_CLOSE',
  CAPA_REOPEN: 'CAPA_REOPEN',
  CAPA_ADMIN: 'CAPA_ADMIN',
  CAPA_AUDIT_VIEW: 'CAPA_AUDIT_VIEW',

  QUALITY_EVENT_VIEW_RESTRICTED: 'QUALITY_EVENT_VIEW_RESTRICTED',
  COMPLAINT_VIEW: 'COMPLAINT_VIEW',
  COMPLAINT_VIEW_ALL: 'COMPLAINT_VIEW_ALL',
  COMPLAINT_VIEW_RESTRICTED: 'COMPLAINT_VIEW_RESTRICTED',
  COMPLAINT_CREATE_QAQC_ONLY: 'COMPLAINT_CREATE_QAQC_ONLY',
  COMPLAINT_ASSIGN_DEPARTMENT: 'COMPLAINT_ASSIGN_DEPARTMENT',
  COMPLAINT_INVESTIGATE: 'COMPLAINT_INVESTIGATE',
  COMPLAINT_REVIEW_INVESTIGATION: 'COMPLAINT_REVIEW_INVESTIGATION',
  COMPLAINT_CUSTOMER_RESPONSE: 'COMPLAINT_CUSTOMER_RESPONSE',
  COMPLAINT_APPROVE: 'COMPLAINT_APPROVE',
  COMPLAINT_CLOSE: 'COMPLAINT_CLOSE',
  COMPLAINT_REOPEN: 'COMPLAINT_REOPEN',
  COMPLAINT_AUDIT_VIEW: 'COMPLAINT_AUDIT_VIEW',
  COMPLAINT_ADMIN: 'COMPLAINT_ADMIN',
  
  QUALITY_EVENT_MANAGEMENT_VIEW: 'QUALITY_EVENT_MANAGEMENT_VIEW',
  QUALITY_EVENT_MANAGEMENT_APPROVE: 'QUALITY_EVENT_MANAGEMENT_APPROVE'
};

// Resolves user permissions strictly based on mock data array
export const getUserPermissions = (user) => {
  if (!user || !Array.isArray(user.permissions)) return [];
  return user.permissions;
};

export const hasPermission = (user, permissionCode) => {
  const perms = getUserPermissions(user);
  return perms.includes(permissionCode);
};

export const hasAnyPermission = (user, permissionCodes) => {
  const perms = getUserPermissions(user);
  return permissionCodes.some(code => perms.includes(code));
};

export const canCreateCapa = (user) => hasPermission(user, PERMISSIONS.CAPA_CREATE);
export const canCreateNcr = (user) => hasPermission(user, PERMISSIONS.NCR_CREATE_QAQC_ONLY);
export const canCreateHold = (user) => hasPermission(user, PERMISSIONS.HOLD_CREATE_QAQC_ONLY);
export const canCreateComplaint = (user) => hasPermission(user, PERMISSIONS.COMPLAINT_CREATE_QAQC_ONLY);

export const canViewNcrHold = (user, record) => {
  if (!user) return false;
  if (hasPermission(user, PERMISSIONS.NCR_VIEW_ALL) || hasPermission(user, PERMISSIONS.HOLD_VIEW_ALL)) return true;
  return record?.responsibleDepartmentId === user?.department || record?.actionDepartmentId === user?.department;
};

export const canRespondToNcr = (user, record) => {
  if (!user || !record) return false;
  if (hasPermission(user, PERMISSIONS.NCR_ADMIN)) return true;
  
  const hasPerm = hasPermission(user, PERMISSIONS.NCR_RESPOND);
  const isAssignedDept = record.responsibleDepartmentId === user.department;
  const isAssignedUser = record.responsibleUserId === user.id;
  
  return hasPerm && (isAssignedDept || isAssignedUser);
};

export const canUpdateHoldExecution = (user, record) => {
  if (!user || !record) return false;
  if (hasPermission(user, PERMISSIONS.HOLD_ADMIN)) return true;
  
  const hasPerm = hasPermission(user, PERMISSIONS.HOLD_EXECUTION_UPDATE);
  // Optional logic: if handlingSection defines a target dept, match against it.
  // For now, if they are the responsible department for the NCR/HOLD, they can update execution.
  const isAssignedDept = record.responsibleDepartmentId === user.department;
  
  return hasPerm && isAssignedDept;
};

export const canPerformFollowUp = (user) => {
  return hasPermission(user, PERMISSIONS.NCR_FOLLOW_UP);
};

export const canCloseNcrHold = (user) => {
  return hasPermission(user, PERMISSIONS.NCR_CLOSE) || hasPermission(user, PERMISSIONS.HOLD_CLOSE);
};

export const canViewCustomerSensitiveField = (user, complaint) => {
  if (!user || !complaint) return false;
  if (hasAnyPermission(user, [PERMISSIONS.COMPLAINT_VIEW_ALL, PERMISSIONS.COMPLAINT_ADMIN])) return true;
  
  const isAssignedToComplaint = user.depts?.includes(complaint.responsibleDepartmentId) || complaint.responsibleUserId === user.id;
  if (hasPermission(user, PERMISSIONS.COMPLAINT_VIEW_RESTRICTED) && isAssignedToComplaint) return true;
  
  const isAssignedToResponse = user.depts?.includes(complaint.responseDepartmentId) || complaint.responseByUserId === user.id;
  if (hasPermission(user, PERMISSIONS.COMPLAINT_CUSTOMER_RESPONSE) && isAssignedToResponse) return true;
  
  return false;
};

export const canViewHealthMedicalField = (user, _complaint) => {
  if (!user) return false;
  return hasAnyPermission(user, [PERMISSIONS.COMPLAINT_VIEW_ALL, PERMISSIONS.COMPLAINT_ADMIN]);
};

export const canViewComplaint = (user, complaint) => {
  if (!user || !complaint) return false;
  if (hasAnyPermission(user, [PERMISSIONS.COMPLAINT_VIEW_ALL, PERMISSIONS.COMPLAINT_ADMIN])) return true;
  
  const isAssignedDept = user.depts?.includes(complaint.responsibleDepartmentId);
  const isResponseDept = user.depts?.includes(complaint.responseDepartmentId);
  
  if (hasPermission(user, PERMISSIONS.COMPLAINT_INVESTIGATE) && isAssignedDept) return true;
  if (hasPermission(user, PERMISSIONS.COMPLAINT_CUSTOMER_RESPONSE) && isResponseDept) return true;
  if (hasAnyPermission(user, [PERMISSIONS.COMPLAINT_APPROVE, PERMISSIONS.QUALITY_EVENT_MANAGEMENT_APPROVE])) return true;
  
  return false;
};

export const canAssignComplaintDepartment = (user, _complaint) => {
  return hasAnyPermission(user, [PERMISSIONS.COMPLAINT_ASSIGN_DEPARTMENT, PERMISSIONS.COMPLAINT_ADMIN]);
};

export const canInvestigateComplaint = (user, complaint) => {
  if (!user || !complaint) return false;
  if (hasPermission(user, PERMISSIONS.COMPLAINT_ADMIN)) return true;
  
  const hasPerm = hasPermission(user, PERMISSIONS.COMPLAINT_INVESTIGATE);
  const isAssignedDept = user.depts?.includes(complaint.responsibleDepartmentId);
  const isAssignedUser = complaint.responsibleUserId === user.id;
  
  return hasPerm && (isAssignedDept || isAssignedUser);
};

export const canReviewComplaintInvestigation = (user, _complaint) => {
  return hasAnyPermission(user, [PERMISSIONS.COMPLAINT_REVIEW_INVESTIGATION, PERMISSIONS.COMPLAINT_ADMIN]);
};

export const canRecordCustomerResponse = (user, complaint) => {
  if (!user || !complaint) return false;
  if (hasPermission(user, PERMISSIONS.COMPLAINT_ADMIN)) return true;
  
  const hasPerm = hasPermission(user, PERMISSIONS.COMPLAINT_CUSTOMER_RESPONSE);
  const isAssignedUser = complaint.responseByUserId === user.id;
  const isAssignedDept = user.depts?.includes(complaint.responseDepartmentId);
  
  return hasPerm && (isAssignedUser || isAssignedDept);
};

export const canApproveComplaint = (user, _complaint) => {
  return hasAnyPermission(user, [
    PERMISSIONS.COMPLAINT_APPROVE, 
    PERMISSIONS.QUALITY_EVENT_MANAGEMENT_APPROVE,
    PERMISSIONS.COMPLAINT_ADMIN
  ]);
};

export const canCloseComplaint = (user, _complaint) => {
  return hasAnyPermission(user, [PERMISSIONS.COMPLAINT_CLOSE, PERMISSIONS.COMPLAINT_ADMIN]);
};

export const canLinkComplaintRecord = (user, _complaint) => {
  return hasAnyPermission(user, [PERMISSIONS.COMPLAINT_REVIEW_INVESTIGATION, PERMISSIONS.COMPLAINT_ADMIN]);
};

export const getSafeComplaintView = (user, complaint) => {
  if (!complaint) return null;
  const safeComplaint = { ...complaint };
  
  if (!canViewCustomerSensitiveField(user, complaint)) {
    safeComplaint.customerName = '*** MASKED ***';
    safeComplaint.customerCompany = '*** MASKED ***';
    safeComplaint.customerAddress = '*** MASKED ***';
    safeComplaint.city = '*** MASKED ***';
    safeComplaint.province = '*** MASKED ***';
    safeComplaint.postalCode = '*** MASKED ***';
    safeComplaint.telephone = '*** MASKED ***';
    safeComplaint.fax = '*** MASKED ***';
    safeComplaint.email = '*** MASKED ***';
    safeComplaint.contactPerson = '*** MASKED ***';
    safeComplaint.customerReference = '*** MASKED ***';
  }

  if (!canViewHealthMedicalField(user, complaint)) {
    safeComplaint.illnessOrInjury = '*** MASKED ***';
    safeComplaint.symptoms = '*** MASKED ***';
    safeComplaint.seenDoctor = '*** MASKED ***';
    safeComplaint.spokenToPublicHealth = '*** MASKED ***';
    safeComplaint.goneToHospital = '*** MASKED ***';
    safeComplaint.medicalDetails = '*** MASKED ***';
  }
  
  return safeComplaint;
};
