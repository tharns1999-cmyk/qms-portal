export const PERMISSIONS = {
  NCR_CREATE_QAQC_ONLY: 'NCR_CREATE_QAQC_ONLY',
  HOLD_CREATE_QAQC_ONLY: 'HOLD_CREATE_QAQC_ONLY',
  COMPLAINT_CREATE_QAQC_ONLY: 'COMPLAINT_CREATE_QAQC_ONLY',
  CAPA_CREATE: 'CAPA_CREATE',
  QUALITY_EVENT_VIEW_RESTRICTED: 'QUALITY_EVENT_VIEW_RESTRICTED',
  COMPLAINT_VIEW_RESTRICTED: 'COMPLAINT_VIEW_RESTRICTED',
  NCR_VIEW_ALL: 'NCR_VIEW_ALL',
  COMPLAINT_VIEW_ALL: 'COMPLAINT_VIEW_ALL',
  QUALITY_EVENT_MANAGEMENT_VIEW: 'QUALITY_EVENT_MANAGEMENT_VIEW'
};

// Mock function to resolve user permissions
// In a real app, this would check an array of permission strings attached to the user object
export const getUserPermissions = (user) => {
  if (!user) return [];
  const permissions = [PERMISSIONS.QUALITY_EVENT_MANAGEMENT_VIEW];
  
  if (user.department === 'QA' || user.department === 'QC' || user.isQaqc) {
    permissions.push(
      PERMISSIONS.NCR_CREATE_QAQC_ONLY,
      PERMISSIONS.HOLD_CREATE_QAQC_ONLY,
      PERMISSIONS.COMPLAINT_CREATE_QAQC_ONLY,
      PERMISSIONS.CAPA_CREATE,
      PERMISSIONS.NCR_VIEW_ALL,
      PERMISSIONS.COMPLAINT_VIEW_ALL
    );
  } else {
    // Non-QAQC might have CAPA_CREATE depending on business logic, assuming true for now
    permissions.push(PERMISSIONS.CAPA_CREATE);
    permissions.push(PERMISSIONS.QUALITY_EVENT_VIEW_RESTRICTED);
    permissions.push(PERMISSIONS.COMPLAINT_VIEW_RESTRICTED);
  }
  return permissions;
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

export const canViewRestrictedQualityEvent = (user, record) => {
  if (hasPermission(user, PERMISSIONS.NCR_VIEW_ALL)) return true;
  // If user is assigned to the record, they can view it
  if (record?.assignedDept === user?.department) return true;
  return false;
};

export const canViewCustomerSensitiveField = (user, record) => {
  if (hasPermission(user, PERMISSIONS.COMPLAINT_VIEW_ALL)) return true;
  return false;
};

export const canViewAssignedDepartmentRecord = (user, record) => {
  if (hasPermission(user, PERMISSIONS.NCR_VIEW_ALL) || hasPermission(user, PERMISSIONS.COMPLAINT_VIEW_ALL)) return true;
  return record?.assignedDept === user?.department;
};
