export const PERMISSIONS = {
  NCR_CREATE_QAQC_ONLY: 'NCR_CREATE_QAQC_ONLY',
  HOLD_CREATE_QAQC_ONLY: 'HOLD_CREATE_QAQC_ONLY',
  COMPLAINT_CREATE_QAQC_ONLY: 'COMPLAINT_CREATE_QAQC_ONLY',
  
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
  COMPLAINT_VIEW_RESTRICTED: 'COMPLAINT_VIEW_RESTRICTED',
  COMPLAINT_VIEW_ALL: 'COMPLAINT_VIEW_ALL',
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

export const canViewCustomerSensitiveField = (user) => {
  return hasPermission(user, PERMISSIONS.COMPLAINT_VIEW_ALL);
};
