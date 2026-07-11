import { NC_PERMISSIONS } from '../domain/models';

class NcCapaAccessService {
  /**
   * Check if user has a specific permission
   */
  hasPermission(user, permissionName) {
    if (!user) return false;
    
    // Explicit permission checking based on user.permissions array
    const perms = user.permissions || [];
    return perms.includes(permissionName);
  }

  /**
   * Determine if an NC is in a restricted state for the given user
   */
  isRestricted(nc, user) {
    if (!nc || !user) return true;
    if (this.hasPermission(user, NC_PERMISSIONS.ADMIN) || this.hasPermission(user, NC_PERMISSIONS.VIEW_ALL)) {
      return false;
    }
    
    // Restricted cases: Customer complaint, regulatory issue, or high severity
    const isProtected = nc.customerImpact || nc.regulatoryImpact || nc.severity === 'CRITICAL';
    
    if (isProtected) {
       return nc.reportedByUserId !== user.id && nc.assignedOwnerUserId !== user.id;
    }
    return false;
  }
}

export const ncCapaAccessService = new NcCapaAccessService();
