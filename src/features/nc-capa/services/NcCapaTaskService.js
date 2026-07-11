

class NcCapaTaskService {
  constructor() {
    this.tasks = [];
  }

  async getMyTasks(userId, permissions = []) {
    if (!userId) return [];
    
    const hasScreeningPerm = permissions.includes('NC_CAPA_SCREEN');
    
    const myTasks = this.tasks.filter(t => {
      if (t.status !== 'PENDING') return false;
      if (t.assignedUserId === userId) return true;
      if (t.role === 'NC_CAPA_SCREEN' && hasScreeningPerm) return true;
      return false;
    });
    
    return Promise.resolve(myTasks);
  }

  createScreeningTask(nc) {
    this._closeTasksForNc(nc.id);
    this.tasks.push({
      id: `TASK-SCR-${Date.now()}`,
      ncId: nc.id,
      ncNumber: nc.ncNumber,
      title: `Screening Required: ${nc.title}`,
      severity: nc.severity,
      departmentId: nc.departmentId,
      dueDate: nc.submittedAt,
      status: 'PENDING',
      assignedUserId: null,
      role: 'NC_CAPA_SCREEN',
      actionLink: `/nc-capa/${nc.id}`
    });
    console.log(`[TaskService] Created NC_SCREENING_TASK for ${nc.ncNumber}`);
  }

  createReturnedInfoTask(nc) {
    this._closeTasksForNc(nc.id);
    this.tasks.push({
      id: `TASK-RET-${Date.now()}`,
      ncId: nc.id,
      ncNumber: nc.ncNumber,
      title: `Information Requested: ${nc.title}`,
      severity: nc.severity,
      departmentId: nc.departmentId,
      dueDate: nc.returnedAt,
      status: 'PENDING',
      assignedUserId: nc.reportedByUserId,
      role: null,
      actionLink: `/nc-capa/${nc.id}`
    });
    console.log(`[TaskService] Created NC_RETURNED_INFO_TASK for ${nc.ncNumber}`);
  }

  createOwnerAssignmentTask(nc) {
    this._closeTasksForNc(nc.id);
    this.tasks.push({
      id: `TASK-OWN-${Date.now()}`,
      ncId: nc.id,
      ncNumber: nc.ncNumber,
      title: `Owner Assigned (RCA Needed): ${nc.title}`,
      severity: nc.severity,
      departmentId: nc.assignedDepartmentId,
      dueDate: nc.updatedAt,
      status: 'PENDING',
      assignedUserId: nc.assignedOwnerUserId,
      role: null,
      actionLink: `/nc-capa/${nc.id}`
    });
    console.log(`[TaskService] Created NC_OWNER_ASSIGNMENT_TASK for ${nc.ncNumber}`);
  }

  createQaVerificationTask(nc) {
    this._closeTasksForNc(nc.id);
    this.tasks.push({
      id: `TASK-QA-${Date.now()}`,
      ncId: nc.id,
      ncNumber: nc.ncNumber,
      title: `Correction Verification Needed: ${nc.title}`,
      severity: nc.severity,
      departmentId: nc.departmentId,
      dueDate: nc.updatedAt,
      status: 'PENDING',
      assignedUserId: null,
      role: 'NC_CAPA_SCREEN',
      actionLink: `/nc-capa/${nc.id}`
    });
    console.log(`[TaskService] Created QA_VERIFICATION task for ${nc.ncNumber}`);
  }

  closeAllTasks(ncId) {
    this._closeTasksForNc(ncId);
  }

  _closeTasksForNc(ncId) {
    this.tasks.forEach(t => {
      if (t.ncId === ncId && t.status === 'PENDING') {
        t.status = 'COMPLETED';
      }
    });
  }

  // Load mock tasks
  seedMockTasks(mockTasks) {
    this.tasks = [...mockTasks];
  }

  reset() {
    this.tasks = [];
  }
}

export const ncCapaTaskService = new NcCapaTaskService();

