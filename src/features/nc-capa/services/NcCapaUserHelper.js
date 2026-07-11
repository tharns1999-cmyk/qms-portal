import useStore from '../../../store/useStore';

class NcCapaUserHelper {
  /**
   * Retrieves all mock users that have a specific permission.
   * @param {string} permissionCode 
   * @returns {Array} Array of user objects
   */
  resolveUsersByPermission(permissionCode) {
    const store = useStore.getState();
    const masterUsers = store.masterUsers || [];
    return masterUsers.filter(user => user.permissions && user.permissions.includes(permissionCode));
  }

  /**
   * Resolves notification targets based on priority rules.
   * Target order: specific assigned/reporter user ID -> users with permission -> fallback user.
   * @param {Object} options
   * @param {string} [options.permission]
   * @param {string} [options.assignedUserId]
   * @param {string} [options.reporterUserId]
   * @param {string} [options.fallbackUserId]
   * @returns {string} The resolved user ID to notify
   */
  resolveNotificationTargets({ permission, assignedUserId, reporterUserId, fallbackUserId }) {
    if (assignedUserId) return assignedUserId;
    if (reporterUserId) return reporterUserId;
    
    if (permission) {
      const users = this.resolveUsersByPermission(permission);
      if (users && users.length > 0) {
        return users[0].id; // Just returning the first matching user ID for mock notifications
      }
    }
    
    // In a real system, we'd never fallback to the current user, 
    // but for mock/demo safety, we use fallbackUserId (usually currentUser.id).
    return fallbackUserId;
  }
}

export const ncCapaUserHelper = new NcCapaUserHelper();
