import { NC_PERMISSIONS } from '../domain/models';

class NcCapaAccessService {
  /**
   * Check if user has a specific permission
   */
  hasPermission(user, permissionName) {
    if (!user) return false;
    
    // In actual implementation, check user.permissions or roles.
    // For Phase 11A, we will map some basic roles to permissions based on useStore mock.
    const role = user.role || '';
    const isAdmin = user.id === 'u5' || role === 'DCC_ADMIN' || role === 'ADMIN';

    if (isAdmin) return true;
    if (role === 'GUEST') return false;

    // Temporary mock logic based on common user levels/departments
    switch (permissionName) {
      case NC_PERMISSIONS.VIEW:
        return true; // All authenticated users can view their own/assigned
      case NC_PERMISSIONS.VIEW_ALL:
        return user.level >= 4; // Managers and above can view all
      case NC_PERMISSIONS.CREATE:
        return true; // Anyone can create an NC Draft
      case NC_PERMISSIONS.ADMIN:
        return false;
      case NC_PERMISSIONS.AUDIT_VIEW:
        return role === 'QA' || role === 'AUDITOR';
      default:
        return false;
    }
  }

  /**
   * Determine if an NC is in a restricted state for the given user
   */
  isRestricted(nc, user) {
    if (!nc || !user) return true;
    if (this.hasPermission(user, NC_PERMISSIONS.ADMIN) || this.hasPermission(user, NC_PERMISSIONS.VIEW_ALL)) {
      return false;
    }
    // Only assigned user, creator, or department members can view if not VIEW_ALL
    return !(nc.createdBy === user.id || nc.assignedTo === user.id);
  }
}

export const ncCapaAccessService = new NcCapaAccessService();
