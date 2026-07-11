

class NcCapaTaskService {
  constructor() {
    this.tasks = [];
  }

  async getMyTasks(userId, permissions = []) {
    if (!userId) return [];
    
    const myTasks = this.tasks.filter(t => {
      if (t.status !== 'PENDING') return false;
      if (t.assignedUserId === userId) return true;
      if (t.role && permissions.includes(t.role)) return true;
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
      id: `TASK-RCA-${Date.now()}`,
      ncId: nc.id,
      ncNumber: nc.ncNumber,
      title: `Root Cause Analysis Needed: ${nc.title}`,
      severity: nc.severity,
      departmentId: nc.assignedDepartmentId,
      dueDate: nc.updatedAt,
      status: 'PENDING',
      assignedUserId: nc.assignedOwnerUserId,
      role: 'NC_CAPA_OWNER_ACTION',
      actionLink: `/nc-capa/${nc.id}`
    });
    console.log(`[TaskService] Created NC_OWNER_RCA_TASK for ${nc.ncNumber}`);
  }

  createCapaPlanTask(nc) {
    this._closeTasksForNc(nc.id);
    this.tasks.push({
      id: `TASK-CPA-${Date.now()}`,
      ncId: nc.id,
      ncNumber: nc.ncNumber,
      title: `CAPA Action Plan Needed: ${nc.title}`,
      severity: nc.severity,
      departmentId: nc.assignedDepartmentId,
      dueDate: nc.updatedAt, // Should be +N days in real app
      status: 'PENDING',
      assignedUserId: nc.assignedOwnerUserId,
      role: 'NC_CAPA_PLAN_CREATE',
      actionLink: `/nc-capa/${nc.id}`
    });
    console.log(`[TaskService] Created NC_CAPA_PLAN_TASK for ${nc.ncNumber}`);
  }

  createPlanReviewTask(nc) {
    this._closeTasksForNc(nc.id);
    this.tasks.push({
      id: `TASK-CPR-${Date.now()}`,
      ncId: nc.id,
      ncNumber: nc.ncNumber,
      title: `CAPA Plan Review: ${nc.title}`,
      severity: nc.severity,
      departmentId: nc.assignedDepartmentId,
      dueDate: nc.updatedAt,
      status: 'PENDING',
      assignedUserId: null,
      role: 'NC_CAPA_PLAN_REVIEW',
      actionLink: `/nc-capa/${nc.id}`
    });
    console.log(`[TaskService] Created NC_CAPA_PLAN_REVIEW_TASK for ${nc.ncNumber}`);
  }

  createActionExecutionShellTasks(nc) {
    this._closeTasksForNc(nc.id);
    
    if (nc.capaActionPlan && nc.capaActionPlan.actions) {
      nc.capaActionPlan.actions.forEach((action, idx) => {
        this.tasks.push({
          id: `TASK-EXE-${Date.now()}-${idx}`,
          ncId: nc.id,
          ncNumber: nc.ncNumber,
          title: `Action Execution: ${action.description.substring(0, 30)}...`,
          severity: nc.severity,
          departmentId: action.departmentId,
          dueDate: action.dueDate,
          status: 'PENDING',
          assignedUserId: action.responsibleUserId,
          role: null,
          actionLink: `/nc-capa/${nc.id}`
        });
      });
      console.log(`[TaskService] Created ${nc.capaActionPlan.actions.length} NC_ACTION_EXECUTION_SHELL_TASK for ${nc.ncNumber}`);
    }
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

