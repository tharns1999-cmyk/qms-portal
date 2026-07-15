import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { resolveReviewer, resolveApprover } from '../utils/workflowResolver';
import { generateSchedules, generateTasksForSchedules, calculateNextReviewDate } from '../services/PeriodicReviewService';
import { 
  createOrGetLinkedDarDraft, 
  validateLinkedDarSource, 
  resolveLockedSourceDocument, 
  getLinkedActionStatus, 
  syncRevisionEffective, 
  syncObsoleteCompleted 
} from '../services/PeriodicReviewDarLinkService';
// 4 Master Data Tables (Separated as requested)
export const MASTER_DATA_USER = [
  { id: 'U001', name: 'Admin QA (DCC)', position: 'Officer', level: 1, isDcc: true, depts: ['QA'], permissions: [] },
  { id: 'U002', name: 'ธนาวุฒิ สมควรกิจดำรง', position: 'Production Supervisor', level: 4, depts: ['PD'], permissions: [] },
  { id: 'U003', name: 'กัลยาณี พลไกร', position: 'Production Assistant Manager', level: 5, depts: ['PD', 'QA'], permissions: [] },
  { id: 'U004', name: 'คุณเรย์', position: 'General Manager', level: 6, depts: [], permissions: [] },
  { id: 'U005', name: 'บีม', position: 'QAQC Supervisor', level: 4, depts: ['QA'], permissions: [] },
  { id: 'U006', name: 'รัตนพล', position: 'Engineering Supervisor', level: 4, depts: ['EN'], permissions: [] },
  { id: 'U007', name: 'ชัยวัฒน์', position: 'Engineering Assistant Manager', level: 5, depts: ['EN'], permissions: [] },
  { id: 'U008', name: 'คุณกิต', position: 'Finance Director', level: 7, depts: [], permissions: [] },
  { id: 'U009', name: 'คุณนัท', position: 'Managing Director', level: 8, depts: [], permissions: [] },
  { id: 'U010', name: 'สมชาย การตลาด', position: 'Sales Executive', level: 3, depts: ['MKT'], permissions: [] }
];

export const MASTER_DEPARTMENTS = [
  { id: 'ST', name: 'ST' },
  { id: 'HSE', name: 'HSE' },
  { id: 'WH', name: 'WH' },
  { id: 'MKT', name: 'MKT' },
  { id: 'PC', name: 'PC' },
  { id: 'QA/QC', name: 'QA/QC' },
  { 
    id: 'PD', 
    name: 'PD (Production)', 
    isGroup: true,
    subs: [
      { id: 'PD (K1)', name: 'ไลน์ผลิต 1 (K1)' },
      { id: 'PD (K2)', name: 'ไลน์ผลิต 2 (K2)' },
      { id: 'PD (Fruit)', name: 'ไลน์ผลิต 3 (Fruit)' },
      { id: 'PD (Packing)', name: 'ไลน์ผลิต 4 (Packing)' },
      { id: 'PD (RM)', name: 'รับวัตถุดิบ (RM)' },
    ]
  },
  { id: 'EN', name: 'EN' },
  { id: 'HR&GA', name: 'HR&GA' }
];

export const REQUEST_MASTER_DATA_USER = MASTER_DATA_USER.map(u => ({ id: u.id, name: u.name, depts: u.depts }));
export const REVIEW_MASTER_DATA_USER = MASTER_DATA_USER.map(u => ({ id: u.id, name: u.name, depts: u.depts }));
export const APPROVE_MASTER_DATA_USER = MASTER_DATA_USER.map(u => ({ id: u.id, name: u.name, depts: u.depts }));

// Combine mock lists
const MOCK_DOC_FORMATS = [
  { id: 1, format: 'WI-[YY]-[RUN_NO]' },
  { id: 2, format: 'MN-[YY]-[RUN_NO]' },
];

const MOCK_DARS = [
  {
    id: 'DAR-MOCK-1',
    darNo: 'DAR-2607-001',
    type: 'NEW',
    title: 'MN-QA-001',
    name: 'คู่มือคุณภาพ (Quality Manual)',
    status: 'PENDING_REVIEW',
    department: 'QA',
    requesterId: 'U005',
    requestDate: '2026-07-01T08:00:00Z',
    reason: 'จัดทำคู่มือคุณภาพฉบับใหม่ให้สอดคล้องกับนโยบาย',
    reviewerId: 'U003',
    approverId: 'U009'
  },
  {
    id: 'DAR-MOCK-2',
    darNo: 'DAR-2607-002',
    type: 'REVISION',
    title: 'SOP-WH-002',
    name: 'ขั้นตอนการรับสินค้าเข้าคลัง',
    status: 'PENDING_APPROVAL',
    department: 'WH',
    requesterId: 'U002',
    requestDate: '2026-06-25T08:00:00Z',
    reason: 'ปรับปรุงขั้นตอนการตรวจสอบพาเลท',
    reviewerId: 'U005',
    approverId: 'U004',
    docId: 'DOC-MOCK-WH-002',
    revisesRev: '02'
  },
  {
    id: 'DAR-MOCK-3',
    darNo: 'DAR-2607-003',
    type: 'OBSOLETE',
    title: 'WI-PD-010',
    name: 'การใช้งานเครื่องซีลถุง',
    status: 'PENDING_DCC',
    department: 'PD',
    requesterId: 'U002',
    requestDate: '2026-07-08T08:00:00Z',
    reason: 'ยกเลิกเครื่องจักร เลิกผลิต',
    reviewerId: 'U003',
    approverId: 'U004',
    docId: 'DOC-MOCK-PD-010'
  }
];

const MOCK_TASKS = [
  {
    id: 'TASK-MOCK-1',
    type: 'REVIEW',
    darId: 'DAR-MOCK-1',
    title: 'ทบทวนคำร้อง (Review DAR) - MN-QA-001',
    assigneeId: 'U003',
    status: 'PENDING',
    createdAt: '2026-07-01T08:00:00Z',
    dueDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(), // Due Soon (in 2 days)
  },
  {
    id: 'TASK-MOCK-2',
    type: 'APPROVE',
    darId: 'DAR-MOCK-2',
    title: 'อนุมัติคำร้อง (Approve DAR) - SOP-WH-002',
    assigneeId: 'U004',
    status: 'PENDING',
    createdAt: '2026-06-25T08:00:00Z',
    dueDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(), // Overdue (5 days ago)
  },
  {
    id: 'TASK-MOCK-3',
    type: 'DCC_ACTION',
    darId: 'DAR-MOCK-3',
    title: 'ดำเนินการอัปเดตระบบ (DCC Action) - WI-PD-010',
    assigneeId: 'U001',
    status: 'PENDING',
    createdAt: '2026-07-08T08:00:00Z',
    dueDate: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000).toISOString(), // Normal
  },
  {
    id: 'TASK-MOCK-4',
    type: 'ACKNOWLEDGE',
    docId: 'DOC-MOCK-1', // SOP-PD-001
    title: 'รับทราบการประกาศใช้เอกสารใหม่ - SOP-PD-001',
    assigneeId: 'U002',
    status: 'PENDING',
    createdAt: '2026-07-05T08:00:00Z',
    dueDate: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(), // Overdue by 1 day
  }
];

const MOCK_TIMELINE = [
  {
    id: 'TL-1',
    darId: 'DAR-MOCK-2',
    action: 'SUBMIT',
    actor: 'U002',
    timestamp: '2026-06-25T08:00:00Z',
    comment: 'ปรับปรุงขั้นตอนการตรวจสอบพาเลท'
  },
  {
    id: 'TL-2',
    darId: 'DAR-MOCK-2',
    action: 'REVIEW',
    actor: 'U005',
    timestamp: '2026-06-26T10:00:00Z',
    comment: 'ตรวจสอบความถูกต้องเรียบร้อย'
  }
];

const MOCK_DOCUMENTS = [
  {
    id: 'DOC-MOCK-1',
    title: 'SOP-PD-001',
    name: 'มาตรฐานการควบคุมเครื่องตรวจจับโลหะ (Metal Detector)',
    status: 'EFFECTIVE',
    department: 'PD',
    ownerId: 'U002', // Document Owner (Production Supervisor)
    effectiveDate: '2025-07-16', // Due Soon (7 days left for 12 months)
    rev: '01'
  },
  {
    id: 'DOC-MOCK-2',
    title: 'WI-PD-015',
    name: 'ขั้นตอนการล้างทำความสะอาดข้าวเหนียว',
    status: 'EFFECTIVE',
    department: 'PD',
    ownerId: 'U002',
    effectiveDate: '2025-05-25', // Overdue (Escalated)
    rev: '01'
  },
  {
    id: 'DOC-MOCK-WH-002',
    title: 'SOP-WH-002',
    name: 'ขั้นตอนการรับสินค้าเข้าคลัง',
    status: 'EFFECTIVE',
    department: 'WH',
    ownerId: 'U005',
    effectiveDate: '2024-11-20',
    rev: '02'
  },
  {
    id: 'DOC-MOCK-PD-010',
    title: 'WI-PD-010',
    name: 'การใช้งานเครื่องซีลถุง',
    status: 'EFFECTIVE',
    department: 'PD',
    ownerId: 'U002',
    effectiveDate: '2024-03-10',
    rev: '05'
  }
];

const MOCK_CONTROLLED_COPY_INSTANCES = [
  {
    id: 'CC-MOCK-1',
    docId: 'DOC-MOCK-1',
    departmentId: 'PD (K1)',
    holderId: 'U002',
    copyNo: 1,
    status: 'ACTIVE',
    issuedDate: '2025-07-17T08:00:00Z'
  },
  {
    id: 'CC-MOCK-2',
    docId: 'DOC-MOCK-WH-002',
    departmentId: 'WH',
    holderId: 'U005',
    copyNo: 1,
    status: 'PENDING_RECEIPT',
    issuedDate: '2026-07-08T10:00:00Z'
  }
];

export const calculateSLAStatus = (effectiveDate, currentDate) => {
  if (!effectiveDate) return 'NORMAL';

  const eff = new Date(effectiveDate);
  eff.setHours(0, 0, 0, 0);
  const cur = new Date(currentDate);
  cur.setHours(0, 0, 0, 0);

  const diffTime = eff.getTime() - cur.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays < 0) return 'OVERDUE';
  if (diffDays <= 3) return 'DUE_SOON';
  return 'NORMAL';
};

const cleanupDccTasks = (tasks, instances, documents) => {
  const hasPendingDist = instances.some(i => i.status === 'PENDING_RECEIPT');
  const hasPendingRecall = instances.some(i => {
    if (i.status !== 'ACTIVE') return false;
    const doc = documents.find(d => d.id === i.docId);
    return doc && doc.status === 'SUPERSEDED_ARCHIVED';
  });
  const hasPendingReplacements = instances.some(i => i.status === 'REPLACEMENT_REQUESTED');

  return tasks.filter(t => {
     if (t.type === 'DCC_DISTRIBUTE') {
        const doc = documents.find(d => d.darId === t.darId);
        if (doc) {
           return instances.some(i => i.docId === doc.id && i.status === 'PENDING_RECEIPT');
        }
        return hasPendingDist;
     }
     if (t.type === 'DCC_RECALL') {
        if (!hasPendingRecall) return false;
        const newDoc = documents.find(d => d.darId === t.darId);
        if (newDoc) {
           const oldDoc = documents.find(d => d.title === newDoc.title && d.status === 'SUPERSEDED_ARCHIVED');
           if (oldDoc) {
              return instances.some(i => i.docId === oldDoc.id && i.status === 'ACTIVE');
           }
        }
        return true; 
     }
     if (t.type === 'DCC_REPLACEMENT') {
        if (t.requestId) {
           const inst = instances.find(i => i.id === t.requestId);
           if (inst) return inst.status === 'REPLACEMENT_REQUESTED';
        }
        return hasPendingReplacements;
     }
     return true;
  });
};

// ================= STORE ================= //
export const getInitialStoreState = () => ({
  masterUsers: MASTER_DATA_USER,
  requestUsers: REQUEST_MASTER_DATA_USER,
  reviewUsers: REVIEW_MASTER_DATA_USER,
  approveUsers: APPROVE_MASTER_DATA_USER,
  masterDepartments: MASTER_DEPARTMENTS,
  docFormats: MOCK_DOC_FORMATS,
  dars: JSON.parse(JSON.stringify(MOCK_DARS)),
  tasks: JSON.parse(JSON.stringify(MOCK_TASKS)),
  timeline: JSON.parse(JSON.stringify(MOCK_TIMELINE)),
  documents: JSON.parse(JSON.stringify(MOCK_DOCUMENTS)),
  externalDocuments: [
    {
      id: 'EXT-MOCK-1',
      title: 'FSSC 22000 Version 6.0 Guidelines',
      status: 'ACTIVE',
      department: 'QA',
      ownerId: 'U001', // DCC Admin
      receivedDate: '2024-07-16', // Due Soon (7 days left for 2-year frequency)
      rev: '01'
    },
    {
      id: 'EXT-MOCK-2',
      title: 'ISO 14001:2015 Environmental Management',
      status: 'ACTIVE',
      department: 'HSE',
      ownerId: 'U001',
      receivedDate: '2025-01-15',
      rev: '02'
    }
  ],
  externalAuditTrail: [],
  notifications: [],
  actionLog: [],
  copyRequests: [],
  controlledCopyInstances: JSON.parse(JSON.stringify(MOCK_CONTROLLED_COPY_INSTANCES)),
  controlledCopyAuditTrail: [],
  periodicReviewSchedules: [],
  periodicReviewTasks: [],
  periodicReviewRecords: [],
  mockDateOffset: 0,
});

const useStore = create(persist((set, get) => ({
  ...getInitialStoreState(),

  // EXCLUSIVELY FOR TESTING - Resets store to deterministic initial state
  resetStore: () => set(getInitialStoreState()),

  setMockDateOffset: (days) => set({ mockDateOffset: days }),

  initializePeriodicReviews: () => set(state => {
    if (state.periodicReviewSchedules && state.periodicReviewSchedules.length > 0) return state;
    const schedules = generateSchedules(state.documents || [], state.externalDocuments || [], []);
    const tasks = generateTasksForSchedules(schedules, []);
    return { periodicReviewSchedules: schedules, periodicReviewTasks: tasks };
  }),

  submitPeriodicReview: (scheduleId, outcome, comment, linkedActionId = null, linkageStatus = null, idempotencyKey = null) => set(state => {
    const schedules = [...state.periodicReviewSchedules];
    const tasks = [...state.periodicReviewTasks];
    const records = [...(state.periodicReviewRecords || [])];
    
    const scheduleIndex = schedules.findIndex(s => s.id === scheduleId);
    if (scheduleIndex === -1) return state;
    
    const schedule = { ...schedules[scheduleIndex] };
    
    // Find active task
    const taskIndex = tasks.findIndex(t => t.scheduleId === scheduleId && t.status === 'ACTION_REQUIRED');
    if (taskIndex !== -1) {
      tasks[taskIndex] = { ...tasks[taskIndex], status: 'COMPLETED', updatedAt: new Date().toISOString() };
    }

    let newStatus = 'COMPLETED';
    let requiresLinkedAction = false;

    if (outcome === 'REVISION_REQUIRED' || outcome === 'OBSOLETE_REQUIRED') {
      newStatus = 'IN_PROGRESS';
      requiresLinkedAction = true;
    } else if (outcome === 'NO_CHANGE') {
      newStatus = 'COMPLETED';
    }

    schedule.status = newStatus;
    schedule.outcome = outcome; // Save outcome
    if (linkedActionId) schedule.linkedActionId = linkedActionId;
    if (linkageStatus) schedule.linkageStatus = linkageStatus;
    if (idempotencyKey) schedule.idempotencyKey = idempotencyKey;
    
    // Clear due state as action is taken
    schedule.dueState = 'NOT_YET_DUE';
    schedule.updatedAt = new Date().toISOString();
    
    if (!requiresLinkedAction) {
      schedule.currentScheduledReviewDate = calculateNextReviewDate(schedule.originalReviewAnchorDate, schedule.frequencyMonths, new Date());
      schedule.nextReviewDate = schedule.currentScheduledReviewDate;
      // Also reset status back to upcoming for next cycle if it's completed entirely
      schedule.status = 'UPCOMING';
    }

    schedules[scheduleIndex] = schedule;

    records.push({
      id: `PRR-${Date.now()}`,
      scheduleId,
      outcome,
      comment,
      linkedActionId,
      reviewedByUserId: state.currentUser.id,
      reviewedAt: new Date().toISOString()
    });

    return {
      periodicReviewSchedules: schedules,
      periodicReviewTasks: tasks,
      periodicReviewRecords: records,
      actionLog: [{
        id: `LOG-${Date.now()}`,
        actionType: 'PERIODIC_REVIEW_SUBMITTED',
        details: `Periodic review submitted for ${schedule.documentNumber} with outcome ${outcome}`,
        actor: state.currentUser.name,
        actorId: state.currentUser.id,
        date: new Date().toISOString()
      }, ...(state.actionLog || [])]
    };
  }),

  retryPeriodicReviewLinkage: (scheduleId, newLinkedActionId) => set(state => {
    const schedules = [...state.periodicReviewSchedules];
    const scheduleIndex = schedules.findIndex(s => s.id === scheduleId);
    if (scheduleIndex === -1) return state;
    
    schedules[scheduleIndex] = { 
      ...schedules[scheduleIndex], 
      linkedActionId: newLinkedActionId, 
      linkageStatus: 'SUCCESS',
      updatedAt: new Date().toISOString()
    };
    return { periodicReviewSchedules: schedules };
  }),
  // --- Narrow Dependency-Injection Seam for Testing Real Workflow ---
  // Safe because these methods only orchestrate existing actions and are explicitly designed to take adapter dependencies
  submitPeriodicReviewWithDarAction: (scheduleId, outcome, comment, darPayload, darAdapter) => {
    const store = get();
    const idempotencyKey = `PERIODIC_REVIEW_${scheduleId}_${outcome}`;
    try {
      const newLinkedId = darAdapter(darPayload);
      store.submitPeriodicReview(scheduleId, outcome, comment, newLinkedId, 'SUCCESS', idempotencyKey);
    } catch {
      store.submitPeriodicReview(scheduleId, outcome, comment, null, 'FAILED', idempotencyKey);
    }
  },

  retryPeriodicReviewLinkageWithDarAction: (scheduleId, darPayload, darAdapter) => {
    const store = get();
    const schedule = store.periodicReviewSchedules.find(s => s.id === scheduleId);
    if (!schedule) return;
    
    // Check idempotency visually
    if (schedule.linkedActionId && schedule.linkageStatus === 'SUCCESS') return;

    try {
      const newLinkedId = darAdapter(darPayload);
      store.retryPeriodicReviewLinkage(scheduleId, newLinkedId);
    } catch {
      // Intentionally swallow to maintain FAILED state
    }
  },
  // --- Periodic Review DAR Linkage Service Wrappers ---
  createOrGetLinkedDarDraft: (reviewId, outcome, darPayload) => {
    const schedule = get().periodicReviewSchedules.find(s => s.id === reviewId);
    if (!schedule) throw new Error('Schedule not found');
    return createOrGetLinkedDarDraft(schedule, outcome, darPayload, get);
  },

  validateLinkedDarSource: (draft) => {
    return validateLinkedDarSource(draft, get);
  },

  resolveLockedSourceDocument: (draft) => {
    return resolveLockedSourceDocument(draft, get);
  },

  getLinkedActionStatus: (darStatus) => {
    return getLinkedActionStatus(darStatus);
  },

  syncRevisionEffective: (dar) => {
    syncRevisionEffective(dar, get, set);
  },

  syncObsoleteCompleted: (dar) => {
    syncObsoleteCompleted(dar, get, set);
  },
  // ------------------------------------------------------------------

  // Default user is PD Supervisor (U002)
  currentUser: { ...MASTER_DATA_USER[1], department: 'PD', depts: ['PD'] },

  setCurrentUser: (userId) => set((state) => {
    const baseUser = state.masterUsers.find(u => u.id === userId);
    if (!baseUser) return state;

    // Find departments from any of the lists
    const req = state.requestUsers.find(u => u.id === userId);
    const rev = state.reviewUsers.find(u => u.id === userId);
    const app = state.approveUsers.find(u => u.id === userId);
    const depts = req?.depts || rev?.depts || app?.depts || baseUser.depts || [];

    // The primary active department is the first one, or 'QA' as fallback if empty
    return { 
      currentUser: { ...baseUser, department: depts[0] || 'QA', depts }
    };
  }),

  logAction: (actionType, details) => set(state => ({
    actionLog: [{
      id: `LOG-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      actionType,
      details,
      actor: state.currentUser.name,
      actorId: state.currentUser.id,
      actorRole: state.currentUser.role || state.currentUser.position,
      date: new Date().toISOString()
      }, ...(state.actionLog || [])]
  })),

  addNotification: (userId, title, message, link, relatedTaskId = null) => set(state => ({
    notifications: [{ id: Date.now() + Math.random(), userId, title, message, isRead: false, link, timestamp: new Date().toISOString(), relatedTaskId }, ...state.notifications]
  })),
  markNotificationAsReadByTaskId: (taskId) => set(state => ({
    notifications: state.notifications.map(n => n.relatedTaskId === taskId ? { ...n, isRead: true } : n)
  })),
  markNotificationAsRead: (id) => set(state => ({
    notifications: state.notifications.map(n => n.id === id ? { ...n, isRead: true } : n)
  })),
  markAllNotificationsAsRead: (userId) => set(state => ({
    notifications: state.notifications.map(n => n.userId === userId ? { ...n, isRead: true } : n)
  })),

  registerExternalDoc: (doc) => set((state) => {
    const newId = `EXT-${Date.now()}`;
    let initialStatus = 'ACTIVE';
    let newTasks = [...state.tasks];
    let newNotifications = [...state.notifications];

    if (doc.reviewerId) {
      initialStatus = 'PENDING_EXT_REVIEW';
      newTasks.push({
        id: `extt-${Date.now()}-rev`,
        referenceType: 'EXTERNAL_DOC',
        referenceId: newId,
        title: doc.title,
        type: 'EXT_REVIEW',
        assigneeId: doc.reviewerId,
        status: 'PENDING',
        extAction: 'REGISTER'
      });
      newNotifications.push({ id: Date.now() + Math.random(), userId: doc.reviewerId, title: 'งานใหม่รอการตรวจสอบ', message: `เอกสารภายนอก "${doc.title}" รอการตรวจสอบจากคุณ`, isRead: false, link: '/tasks', timestamp: new Date().toISOString() });
    } else if (doc.approverId) {
      initialStatus = 'PENDING_EXT_APPROVAL';
      newTasks.push({
        id: `extt-${Date.now()}-app`,
        referenceType: 'EXTERNAL_DOC',
        referenceId: newId,
        title: doc.title,
        type: 'EXT_APPROVAL',
        assigneeId: doc.approverId,
        status: 'PENDING',
        extAction: 'REGISTER'
      });
      newNotifications.push({ id: Date.now() + Math.random(), userId: doc.approverId, title: 'งานใหม่รอการอนุมัติ', message: `เอกสารภายนอก "${doc.title}" รอการอนุมัติจากคุณ`, isRead: false, link: '/tasks', timestamp: new Date().toISOString() });
    }

    // Ack tasks can be generated now or after approval. BRS usually requires Ack after Active, 
    // but for simplicity here we generate them immediately if the status goes ACTIVE, 
    // or we'll handle Ack in the final approval step.
    if (initialStatus === 'ACTIVE' && doc.acknowledgees && doc.acknowledgees.length > 0) {
      doc.acknowledgees.forEach(uid => {
        newTasks.push({
          id: `extt-${Date.now()}-ack-${uid}`,
          referenceType: 'EXTERNAL_DOC',
          referenceId: newId,
          title: doc.title,
          type: 'Ack',
          assigneeId: uid,
          status: 'PENDING'
        });
        newNotifications.push({ id: Date.now() + Math.random(), userId: uid, title: 'โปรดรับทราบเอกสาร', message: `เอกสารภายนอก "${doc.title}" บังคับใช้แล้ว โปรดรับทราบ`, isRead: false, link: '/tasks', timestamp: new Date().toISOString() });
      });
    }

    return {
      externalDocuments: [{ ...doc, id: newId, status: initialStatus, ownerId: state.currentUser.id, rev: '01' }, ...state.externalDocuments],
      tasks: newTasks,
      notifications: newNotifications,
      actionLog: [{
        id: `LOG-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        actionType: 'EXT_DOC_REGISTER',
        details: `Registered new external document: ${doc.title}`,
        actor: state.currentUser.name,
        actorId: state.currentUser.id,
        actorRole: state.currentUser.role || state.currentUser.position,
        date: new Date().toISOString()
      }, ...(state.actionLog || [])],
      externalAuditTrail: [{
        id: `EXTA-${Date.now()}`,
        docId: newId,
        action: 'REGISTER',
        actor: state.currentUser.name,
        actorId: state.currentUser.id,
        date: new Date().toISOString(),
        details: `Registered external document (Status: ${initialStatus})`
      }, ...state.externalAuditTrail]
    };
  }),

  // Triggered when requesting to Update an existing document (create new revision)
  updateExternalDoc: (id, updates) => set((state) => {
    const oldDoc = state.externalDocuments.find(d => d.id === id);
    if (!oldDoc) return state;

    const currentRevNum = parseInt(oldDoc.rev, 10) || 0;
    const newRevNum = currentRevNum + 1;
    const newRevStr = newRevNum < 10 ? `0${newRevNum}` : `${newRevNum}`;

    const newId = `EXT-${Date.now()}`;
    const newDoc = {
      ...oldDoc,
      ...updates,
      id: newId,
      rev: newRevStr,
      status: 'PENDING_EXT_REVIEW',
      previousDocId: id
    };

    const newTasks = [...state.tasks];
    const newNotifications = [...state.notifications];

    if (newDoc.reviewerId) {
      newTasks.push({
        id: `extt-${Date.now()}-rev`,
        referenceType: 'EXTERNAL_DOC',
        referenceId: newId,
        title: newDoc.title,
        type: 'EXT_REVIEW',
        assigneeId: newDoc.reviewerId,
        status: 'PENDING',
        extAction: 'UPDATE'
      });
      newNotifications.push({ id: Date.now() + Math.random(), userId: newDoc.reviewerId, title: 'งานใหม่รอการตรวจสอบ', message: `คำขออัปเดตเอกสารภายนอก "${newDoc.title}" รอการตรวจสอบจากคุณ`, isRead: false, link: '/tasks', timestamp: new Date().toISOString() });
    } else {
      newDoc.status = 'PENDING_EXT_APPROVAL';
      newTasks.push({
        id: `extt-${Date.now()}-app`,
        referenceType: 'EXTERNAL_DOC',
        referenceId: newId,
        title: newDoc.title,
        type: 'EXT_APPROVAL',
        assigneeId: newDoc.approverId,
        status: 'PENDING',
        extAction: 'UPDATE'
      });
      newNotifications.push({ id: Date.now() + Math.random(), userId: newDoc.approverId, title: 'งานใหม่รอการอนุมัติ', message: `คำขออัปเดตเอกสารภายนอก "${newDoc.title}" รอการอนุมัติจากคุณ`, isRead: false, link: '/tasks', timestamp: new Date().toISOString() });
    }

    return {
      externalDocuments: [newDoc, ...state.externalDocuments],
      tasks: newTasks,
      notifications: newNotifications,
      actionLog: [{
        id: `LOG-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        actionType: 'EXT_DOC_REVISE_REQUEST',
        details: `Requested update for external document: ${newDoc.title} to Rev ${newRevStr}`,
        actor: state.currentUser.name,
        actorId: state.currentUser.id,
        actorRole: state.currentUser.role || state.currentUser.position,
        date: new Date().toISOString()
      }, ...(state.actionLog || [])],
      externalAuditTrail: [{
        id: `EXTA-${Date.now()}`,
        docId: newId,
        action: 'UPDATE_REQUEST',
        actor: state.currentUser.name,
        actorId: state.currentUser.id,
        date: new Date().toISOString(),
        details: `Requested update to Rev ${newRevStr}`
      }, ...state.externalAuditTrail]
    };
  }),

  // Handle immediate withdraw/delete (deprecated, keeping empty to avoid crash if called)
  withdrawExternalDoc: (_id, _reason) => set(state => state),

  // Handle immediate revise (replaced by updateExternalDoc above)
  reviseExternalDoc: (_id, _updates) => set(state => state),

  // Triggered when requesting to Obsolete a document
  obsoleteExternalDoc: (id, payload) => set((state) => {
    const oldDoc = state.externalDocuments.find(d => d.id === id);
    if (!oldDoc) return state;

    let newTasks = [...state.tasks];
    let newNotifications = [...state.notifications];
    let newStatus = 'PENDING_EXT_REVIEW';

    // Store obsolete request details inside the document temporarily
    const updatedDoc = {
      ...oldDoc,
      status: newStatus,
      obsoleteReason: payload.reason,
      obsoleteReviewerId: payload.reviewerId,
      obsoleteApproverId: payload.approverId
    };

    if (payload.reviewerId) {
      newTasks.push({
        id: `extt-${Date.now()}-rev`,
        referenceType: 'EXTERNAL_DOC',
        referenceId: id,
        title: oldDoc.title,
        type: 'EXT_REVIEW',
        assigneeId: payload.reviewerId,
        status: 'PENDING',
        extAction: 'OBSOLETE'
      });
      newNotifications.push({ id: Date.now() + Math.random(), userId: payload.reviewerId, title: 'ขอยกเลิกเอกสารภายนอก', message: `รอตรวจสอบการยกเลิก "${oldDoc.title}"`, isRead: false, link: '/tasks', timestamp: new Date().toISOString() });
    } else {
      updatedDoc.status = 'PENDING_EXT_APPROVAL';
      newTasks.push({
        id: `extt-${Date.now()}-app`,
        referenceType: 'EXTERNAL_DOC',
        referenceId: id,
        title: oldDoc.title,
        type: 'EXT_APPROVAL',
        assigneeId: payload.approverId,
        status: 'PENDING',
        extAction: 'OBSOLETE'
      });
      newNotifications.push({ id: Date.now() + Math.random(), userId: payload.approverId, title: 'ขอยกเลิกเอกสารภายนอก', message: `รออนุมัติการยกเลิก "${oldDoc.title}"`, isRead: false, link: '/tasks', timestamp: new Date().toISOString() });
    }

    return {
      externalDocuments: state.externalDocuments.map(d => d.id === id ? updatedDoc : d),
      tasks: newTasks,
      notifications: newNotifications,
      actionLog: [{
        id: `LOG-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        actionType: 'EXT_DOC_OBSOLETE_REQUEST',
        details: `Requested obsolete for external document: ${oldDoc.title}`,
        actor: state.currentUser.name,
        actorId: state.currentUser.id,
        actorRole: state.currentUser.role || state.currentUser.position,
        date: new Date().toISOString()
      }, ...(state.actionLog || [])],
      externalAuditTrail: [{
        id: `EXTA-${Date.now()}`,
        docId: id,
        action: 'OBSOLETE_REQUEST',
        actor: state.currentUser.name,
        actorId: state.currentUser.id,
        date: new Date().toISOString(),
        details: `Requested obsolete: ${payload.reason}`
      }, ...state.externalAuditTrail]
    };
  }),

  logExternalDownload: (id) => set((state) => {
    const doc = state.externalDocuments.find(d => d.id === id);
    const docTitle = doc ? doc.title : id;
    return {
      actionLog: [{
        id: `LOG-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        actionType: 'EXT_DOC_DOWNLOAD',
        details: `Downloaded external document "${docTitle}"`,
        actor: state.currentUser.name,
        actorId: state.currentUser.id,
        actorRole: state.currentUser.role || state.currentUser.position,
        date: new Date().toISOString()
      }, ...(state.actionLog || [])],
      externalAuditTrail: [{
        id: `EXTA-${Date.now()}`,
        docId: id,
        action: 'DOWNLOAD',
        actor: state.currentUser.name,
        actorId: state.currentUser.id,
        date: new Date().toISOString(),
        details: 'Downloaded confidential document'
      }, ...state.externalAuditTrail]
    };
  }),

  processExternalTask: (taskId, action, comment) => set((state) => {
    const taskIndex = state.tasks.findIndex(t => t.id === taskId);
    if (taskIndex === -1) return state;

    const task = state.tasks[taskIndex];
    const docIndex = state.externalDocuments.findIndex(d => d.id === task.referenceId);
    if (docIndex === -1) return state;

    const doc = state.externalDocuments[docIndex];
    const isUpdate = task.extAction === 'UPDATE';
    const isObsolete = task.extAction === 'OBSOLETE';

    let newDocStatus = doc.status;
    let newTasks = state.tasks.filter(t => t.id !== taskId);
    let newNotifications = [...state.notifications];
    let updatedDocs = [...state.externalDocuments];

    // APPROVE Action
    if (action === 'APPROVE') {
      if (task.type === 'EXT_REVIEW') {
        const approverId = isObsolete ? doc.obsoleteApproverId : doc.approverId;
        if (approverId) {
          newDocStatus = 'PENDING_EXT_APPROVAL';
          const newTaskId = `extt-${Date.now()}-app`;
          newTasks.push({
            id: newTaskId,
            referenceType: 'EXTERNAL_DOC',
            referenceId: doc.id,
            title: doc.title,
            type: 'EXT_APPROVAL',
            assigneeId: approverId,
            status: 'PENDING',
            extAction: task.extAction
          });
          newNotifications.push({ id: Date.now() + Math.random(), userId: approverId, title: 'งานใหม่รอการอนุมัติ', message: `เอกสารภายนอก "${doc.title}" รอการอนุมัติจากคุณ`, isRead: false, link: '/tasks', timestamp: new Date().toISOString(), relatedTaskId: newTaskId });
        } else {
          // If no approver, it's fully approved
          newDocStatus = isObsolete ? 'OBSOLETE_ARCHIVED' : 'ACTIVE';
        }
      } else if (task.type === 'EXT_APPROVAL') {
        newDocStatus = isObsolete ? 'OBSOLETE_ARCHIVED' : 'ACTIVE';
      }

      // If fully approved and it's an UPDATE, obsolete the previous document
      if (newDocStatus === 'ACTIVE' && isUpdate && doc.previousDocId) {
        updatedDocs = updatedDocs.map(d => d.id === doc.previousDocId ? { ...d, status: 'OBSOLETE_ARCHIVED' } : d);
      }

      // REJECT Action
    } else if (action === 'REJECT') {
      if (isObsolete) {
        // Obsolete rejected -> Return to ACTIVE
        newDocStatus = 'ACTIVE';
      } else {
        // Register/Update rejected -> DRAFT/REJECTED
        newDocStatus = 'REJECTED';
      }
      newTasks = newTasks.filter(t => t.referenceId !== doc.id);
      newNotifications.push({ id: Date.now() + Math.random(), userId: doc.ownerId, title: 'คำขอถูกปฏิเสธ', message: `คำขอสำหรับ "${doc.title}" ถูกปฏิเสธ: ${comment}`, isRead: false, link: '/external-docs', timestamp: new Date().toISOString() });
    }

    updatedDocs = updatedDocs.map(d => d.id === doc.id ? { ...d, status: newDocStatus } : d);

    return {
      tasks: newTasks,
      notifications: newNotifications,
      externalDocuments: updatedDocs,
      actionLog: [{
        id: `LOG-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        actionType: `EXT_WORKFLOW_${action}`,
        details: `Processed task ${taskId} (${action}) for external document "${doc.title}"`,
        actor: state.currentUser.name,
        actorId: state.currentUser.id,
        actorRole: state.currentUser.role || state.currentUser.position,
        date: new Date().toISOString()
      }, ...(state.actionLog || [])],
      externalAuditTrail: [{
        id: `EXTA-${Date.now()}`,
        docId: doc.id,
        action: `TASK_${action}_${task.type.toUpperCase()}`,
        actor: state.currentUser.name,
        actorId: state.currentUser.id,
        date: new Date().toISOString(),
        details: comment || `Processed external task (${task.type})`
      }, ...state.externalAuditTrail]
    };
  }),

  addDarAndReturnId: (dar) => {
    let newDarId = '';
    set((state) => {
      const date = new Date();
      const mm = String(date.getMonth() + 1).padStart(2, '0');
      const yy = String(date.getFullYear()).slice(-2);
      const prefix = `DAR`;
      const suffix = `-${mm}-${yy}`;
      
      const existingDarsThisMonth = state.dars.filter(d => d.id.endsWith(suffix));
      let nextRun = 1;
      if (existingDarsThisMonth.length > 0) {
         const runNums = existingDarsThisMonth.map(d => parseInt(d.id.replace(prefix, '').split('-')[0]));
         nextRun = Math.max(...runNums) + 1;
      }
      newDarId = `${prefix}${String(nextRun).padStart(2, '0')}${suffix}`;
      
      const distributions = dar.distributions || [];
      const newDar = { ...dar, id: newDarId, distributions };

      const today = new Date();
      today.setDate(today.getDate() + state.mockDateOffset);
      const dueDateStr = new Date(today.getTime() + 3*24*60*60*1000).toISOString().split('T')[0];
      const cancelDateStr = new Date(today.getTime() + 4*24*60*60*1000).toISOString().split('T')[0];

      let newTasks = [...state.tasks];
      let newNotifications = [...state.notifications];
      let realStatus = dar.isDraft ? 'DRAFT' : 'UNDER_REVIEW';
      
      // Generate Reviewer Task
      if (!dar.isDraft) {
        const resolveReviewer = (reqId, dept, masters, reviewers) => {
          const reqUser = masters.find(u => u.id === reqId);
          if (!reqUser) return null;
          const candidates = reviewers.filter(u => u.department === dept && u.level > reqUser.level);
          if (candidates.length === 0) return null;
          candidates.sort((a,b) => a.level - b.level);
          return { id: candidates[0].id, level: candidates[0].level, dept: candidates[0].department };
        };
        
        let reviewerObj = resolveReviewer(newDar.requesterId, newDar.department, state.masterUsers, state.reviewUsers);
        
        if (reviewerObj) {
          const newTaskId = `t-${Date.now()}`;
          newTasks.push({
            id: newTaskId,
            referenceType: 'INTERNAL_DAR', referenceId: newDar.id,
            darId: newDar.id, title: newDar.title, type: 'Review',
            assigneeId: reviewerObj.id,
            currentHandlerDepartment: reviewerObj.dept,
            currentHandlerLevel: reviewerObj.level,
            dueDate: dueDateStr, cancelDate: cancelDateStr, status: 'NORMAL'
          });
          newNotifications.push({ id: Date.now() + Math.random(), userId: reviewerObj.id, title: 'งานใหม่รอการตรวจสอบ', message: `DAR "${newDar.title}" รอการตรวจสอบจากคุณ`, isRead: false, link: '/tasks', timestamp: new Date().toISOString(), relatedTaskId: newTaskId });
        } else {
           realStatus = 'PENDING_APPROVAL';
           // Not fully replicating the approver fallback here, assuming standard DARs will find a reviewer in demo
        }
      }

      return { 
        dars: [...state.dars, { ...newDar, status: realStatus }],
        tasks: newTasks,
        notifications: newNotifications,
        timeline: [...state.timeline, { 
          id: Date.now(), darId: newDar.id, action: 'Created', user: state.currentUser.name, date: new Date().toLocaleString(), comment: 'Submitted request' 
        }],
        actionLog: [{
          id: `LOG-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          actionType: 'DAR_SUBMIT',
          actor: state.currentUser.name,
          details: `Submitted DAR ${newDar.id}`,
          timestamp: new Date().toISOString()
        }, ...(state.actionLog || [])]
      };
    });
    return newDarId;
  },

  updateTask: (taskId, updates) => set((state) => {
    const newTasks = state.tasks.map(t => {
      // Note: task processing starts here
      // Check both id and taskId
      if (t.id === taskId || t.taskId === taskId) {
        return { ...t, ...updates };
      }
      return t;
    });
    return { tasks: newTasks };
  }),

  addDar: (dar) => set((state) => {
    // Generate new ID DARXX-MM-YY
    const date = new Date();
    const mm = String(date.getMonth() + 1).padStart(2, '0');
    const yy = String(date.getFullYear()).slice(-2);
    // Find highest running number for this month
    const prefix = `DAR`;
    const suffix = `-${mm}-${yy}`;

    const existingDarsThisMonth = state.dars.filter(d => d.id.endsWith(suffix));
    let nextRun = 1;
    if (existingDarsThisMonth.length > 0) {
      const runNums = existingDarsThisMonth.map(d => parseInt(d.id.replace(prefix, '').split('-')[0]));
      nextRun = Math.max(...runNums) + 1;
    }
    const newDarId = `${prefix}${String(nextRun).padStart(2, '0')}${suffix}`;

    // Ensure distributions array is present
    const distributions = dar.distributions || [];

    const newDar = { ...dar, id: newDarId, distributions };

    if (newDar.type === 'NEW' || newDar.type === 'NEW_DOCUMENT') {
      const docPrefix = `${newDar.docType}-${newDar.department}-`;
      const existingDocs = state.documents.filter(d => d.title.startsWith(docPrefix));
      const existingDars = state.dars.filter(d => (d.type === 'NEW' || d.type === 'NEW_DOCUMENT') && d.docIdInput && d.docIdInput.startsWith(docPrefix));

      let maxSeq = 0;
      existingDocs.forEach(d => {
        const seqStr = d.title.replace(docPrefix, '');
        const seq = parseInt(seqStr, 10);
        if (!isNaN(seq) && seq > maxSeq) maxSeq = seq;
      });
      existingDars.forEach(d => {
        const seqStr = d.docIdInput.replace(docPrefix, '');
        const seq = parseInt(seqStr, 10);
        if (!isNaN(seq) && seq > maxSeq) maxSeq = seq;
      });

      newDar.docIdInput = `${docPrefix}${String(maxSeq + 1).padStart(3, '0')}`;
    }

    // When a DAR is added, it needs a Reviewer assigned from the same department
    // Criteria: candidate.level > requester.level (Nearest Higher)
    let reviewerObj = null;
    if (!newDar.manualReviewerId) {
      reviewerObj = resolveReviewer(newDar.requesterId, newDar.department, state.masterUsers, state.reviewUsers);
    } else {
      const u = state.masterUsers.find(m => m.id === newDar.manualReviewerId);
      if (u) reviewerObj = { id: u.id, level: u.level, dept: newDar.department };
    }

    const today = new Date();
    today.setDate(today.getDate() + state.mockDateOffset);
    const dueDateStr = new Date(today.getTime() + 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    const cancelDateStr = new Date(today.getTime() + 4 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

    let newTasks = [...state.tasks];
    let newNotifications = [...state.notifications];
    let realStatus = dar.isDraft ? 'DRAFT' : 'UNDER_REVIEW';

    if (!dar.isDraft) {
      if (reviewerObj) {
        const newTaskId = `t-${Date.now()}`;
        newTasks.push({
          id: newTaskId,
          referenceType: 'INTERNAL_DAR', referenceId: newDar.id,
          darId: newDar.id,
          title: newDar.title,
          type: 'Review',
          assigneeId: reviewerObj.id,
          currentHandlerDepartment: reviewerObj.dept,
          currentHandlerLevel: reviewerObj.level,
          dueDate: dueDateStr,
          cancelDate: cancelDateStr,
          status: 'NORMAL'
        });
        newNotifications.push({ id: Date.now() + Math.random(), userId: reviewerObj.id, title: 'งานใหม่รอการตรวจสอบ', message: `DAR "${newDar.title}" รอการตรวจสอบจากคุณ`, isRead: false, link: '/tasks', timestamp: new Date().toISOString(), relatedTaskId: newTaskId });
      } else {
        // Skip Review -> PENDING_APPROVAL
        realStatus = 'PENDING_APPROVAL';
        let approverObj = null;
        if (!newDar.manualApproverId) {
          approverObj = resolveApprover(newDar.requesterId, newDar.requesterId, newDar.department, state.masterUsers, state.approveUsers);
        } else {
          const u = state.masterUsers.find(m => m.id === newDar.manualApproverId);
          if (u) approverObj = { id: u.id, level: u.level, dept: newDar.department };
        }

        if (approverObj) {
          newTasks.push({
            id: `t-${Date.now()}`, referenceType: 'INTERNAL_DAR', referenceId: newDar.id, darId: newDar.id, title: newDar.title, type: 'Approve', assigneeId: approverObj.id,
            currentHandlerDepartment: approverObj.dept, currentHandlerLevel: approverObj.level,
            dueDate: dueDateStr, cancelDate: cancelDateStr, status: 'NORMAL'
          });
          newNotifications.push({ id: Date.now() + Math.random(), userId: approverObj.id, title: 'งานใหม่รอการอนุมัติ', message: `DAR "${newDar.title}" รอการอนุมัติจากคุณ`, isRead: false, link: '/tasks', timestamp: new Date().toISOString() });
        } else {
          realStatus = dar.ackRequirement === 'REQUIRED' ? 'WAITING_ACKNOWLEDGEMENT' : 'APPROVED_WAITING_EFFECTIVE';
          if (realStatus === 'WAITING_ACKNOWLEDGEMENT' && dar.ackUserIds?.length > 0) {
            dar.ackUserIds.forEach(uid => {
              newTasks.push({
                id: `t-${Date.now()}-${uid}`, referenceType: 'INTERNAL_DAR', referenceId: newDar.id, darId: newDar.id, title: newDar.title, type: 'Ack', assigneeId: uid,
                dueDate: dueDateStr, cancelDate: cancelDateStr, status: 'NORMAL'
              });
              newNotifications.push({ id: Date.now() + Math.random(), userId: uid, title: 'โปรดรับทราบเอกสาร', message: `DAR "${newDar.title}" บังคับใช้แล้ว โปรดรับทราบ`, isRead: false, link: '/tasks', timestamp: new Date().toISOString() });
            });
          }
        }
      }
    }

    return {
      dars: [...state.dars, { ...newDar, status: realStatus }],
      tasks: newTasks,
      notifications: newNotifications,
      timeline: [...state.timeline, { 
        id: Date.now(), darId: newDar.id, action: 'Created', user: state.currentUser.name, date: new Date().toLocaleString(), comment: 'Submitted request' 
      }],
      actionLog: [{
        id: `LOG-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        actionType: 'DAR_SUBMIT',
        actor: state.currentUser.name,
        details: `Submitted DAR ${newDar.id}`,
        timestamp: new Date().toISOString()
      }, ...(state.actionLog || [])]
    };
  }),

  removeTask: (taskId) => set((state) => ({
    tasks: state.tasks.filter(t => t.id !== taskId)
  })),

  processWorkflow: (taskId, action, comment) => {
    let newlyCompletedDar = null;
    set((state) => {
    const task = state.tasks.find(t => t.id === taskId);
    if (!task) return state;

    const dar = state.dars.find(d => d.id === task.darId);
    if (!dar) return state;

    const newTasks = state.tasks.filter(t => t.id !== taskId);
    let newStatus = dar.status;

    const today = new Date();
    today.setDate(today.getDate() + state.mockDateOffset);
    const dueDateStr = new Date(today.getTime() + 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    const cancelDateStr = new Date(today.getTime() + 4 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

    let newNotifications = state.notifications.map(n => n.relatedTaskId === taskId ? { ...n, isRead: true } : n);

    if (task.type === 'Review') {
      if (action === 'APPROVE') {
        newStatus = 'PENDING_APPROVAL';

        // Find Approver (Rule: candidate.level > reviewer.level, Nearest Higher)
        let approverObj = null;
        if (!dar.manualApproverId) {
          approverObj = resolveApprover(dar.requesterId, task.assigneeId, dar.department, state.masterUsers, state.approveUsers);
        } else {
          const u = state.masterUsers.find(m => m.id === dar.manualApproverId);
          if (u) approverObj = { id: u.id, level: u.level, dept: dar.department };
        }

        if (approverObj) {
          const newTaskId = `t-${Date.now()}`;
          newTasks.push({
            id: newTaskId, referenceType: 'INTERNAL_DAR', referenceId: dar.id, darId: dar.id, title: dar.title, type: 'Approve', assigneeId: approverObj.id,
            currentHandlerDepartment: approverObj.dept, currentHandlerLevel: approverObj.level,
            dueDate: dueDateStr, cancelDate: cancelDateStr, status: 'NORMAL'
          });
          newNotifications.push({ id: Date.now() + Math.random(), userId: approverObj.id, title: 'งานใหม่รอการอนุมัติ', message: `DAR "${dar.title}" รอการอนุมัติจากคุณ`, isRead: false, link: '/tasks', timestamp: new Date().toISOString(), relatedTaskId: newTaskId });
        } else {
          newStatus = dar.ackRequirement === 'REQUIRED' ? 'WAITING_ACKNOWLEDGEMENT' : 'APPROVED_WAITING_EFFECTIVE';
          if (newStatus === 'WAITING_ACKNOWLEDGEMENT' && dar.ackUserIds?.length > 0) {
            dar.ackUserIds.forEach(uid => {
              const newTaskId = `t-${Date.now()}-${uid}`;
              newTasks.push({
                id: newTaskId, referenceType: 'INTERNAL_DAR', referenceId: dar.id, darId: dar.id, title: dar.title, type: 'Ack', assigneeId: uid,
                dueDate: dueDateStr, cancelDate: cancelDateStr, status: 'NORMAL'
              });
              newNotifications.push({ id: Date.now() + Math.random(), userId: uid, title: 'โปรดรับทราบเอกสาร', message: `DAR "${dar.title}" บังคับใช้แล้ว โปรดรับทราบ`, isRead: false, link: '/tasks', timestamp: new Date().toISOString(), relatedTaskId: newTaskId });
            });
          }
        }
      } else if (action === 'RETURN') {
        newStatus = 'RETURNED_FOR_REVISION';
        const newTaskId = `t-${Date.now()}`;
        newTasks.push({
          id: newTaskId, referenceType: 'INTERNAL_DAR', referenceId: dar.id, darId: dar.id, title: dar.title, type: 'Revise', assigneeId: dar.requesterId,
          dueDate: dueDateStr, cancelDate: cancelDateStr, status: 'NORMAL'
        });
        newNotifications.push({ id: Date.now() + Math.random(), userId: dar.requesterId, title: 'DAR ถูกส่งกลับแก้ไข', message: `DAR "${dar.title}" ถูกส่งกลับให้คุณแก้ไข`, isRead: false, link: '/tasks', timestamp: new Date().toISOString(), relatedTaskId: newTaskId });
      }
    } else if (task.type === 'Approve') {
      if (action === 'APPROVE') {
        newStatus = dar.ackRequirement === 'REQUIRED' ? 'WAITING_ACKNOWLEDGEMENT' : 'APPROVED_WAITING_EFFECTIVE';
        if (newStatus === 'WAITING_ACKNOWLEDGEMENT' && dar.ackUserIds?.length > 0) {
          dar.ackUserIds.forEach(uid => {
            const newTaskId = `t-${Date.now()}-${uid}`;
            newTasks.push({
              id: newTaskId, referenceType: 'INTERNAL_DAR', referenceId: dar.id, darId: dar.id, title: dar.title, type: 'Ack', assigneeId: uid,
              dueDate: dueDateStr, cancelDate: cancelDateStr, status: 'NORMAL'
            });
            newNotifications.push({ id: Date.now() + Math.random(), userId: uid, title: 'โปรดรับทราบเอกสาร', message: `DAR "${dar.title}" บังคับใช้แล้ว โปรดรับทราบ`, isRead: false, link: '/tasks', timestamp: new Date().toISOString(), relatedTaskId: newTaskId });
          });
        }
      } else if (action === 'RETURN') {
        newStatus = 'RETURNED_FOR_REVISION';
        const newTaskId = `t-${Date.now()}`;
        newTasks.push({
          id: newTaskId, referenceType: 'INTERNAL_DAR', referenceId: dar.id, darId: dar.id, title: dar.title, type: 'Revise', assigneeId: dar.requesterId,
          dueDate: dueDateStr, cancelDate: cancelDateStr, status: 'NORMAL'
        });
        newNotifications.push({ id: Date.now() + Math.random(), userId: dar.requesterId, title: 'DAR ถูกส่งกลับแก้ไข', message: `DAR "${dar.title}" ถูกส่งกลับให้คุณแก้ไข`, isRead: false, link: '/tasks', timestamp: new Date().toISOString(), relatedTaskId: newTaskId });
      } else if (action === 'REJECT') {
        newStatus = 'REJECTED';
      }
    } else if (task.type === 'Ack') {
      if (action === 'ACKNOWLEDGE') {
        // Check if there are other pending Ack tasks for this DAR
        const remainingAcks = newTasks.filter(t => t.darId === dar.id && t.type === 'Ack');
        if (remainingAcks.length === 0) {
          const today = new Date();
          today.setDate(today.getDate() + state.mockDateOffset);
          const todayStr = today.toISOString().split('T')[0];
          
          if (dar.effectiveDate && dar.effectiveDate <= todayStr) {
            newStatus = 'COMPLETED';
          } else {
            newStatus = 'APPROVED_WAITING_EFFECTIVE';
          }
        }
      }
    }

    const updatedDars = state.dars.map(d => d.id === dar.id ? { ...d, status: newStatus } : d);
    if (newStatus === 'COMPLETED' && dar.status !== 'COMPLETED') {
      newlyCompletedDar = { ...dar, status: 'COMPLETED' };
    }

    let timelineActionLabel = action;
    if (action === 'APPROVE') {
      timelineActionLabel = task.type === 'Review' ? 'Reviewed' : 'Approved';
    } else if (action === 'RETURN') {
      timelineActionLabel = 'Returned for Revision';
    } else if (action === 'REJECT') {
      timelineActionLabel = 'Rejected';
    } else if (action === 'ACKNOWLEDGE') {
      timelineActionLabel = 'Acknowledged';
    }

    const newTimeline = [...state.timeline, {
      id: Date.now(), darId: dar.id, action: timelineActionLabel, user: state.currentUser.name, date: new Date().toLocaleString(), comment: comment || '-', isChat: false, userId: state.currentUser.id
    }];

    const newState = {
      tasks: newTasks,
      notifications: newNotifications,
      dars: updatedDars,
      timeline: newTimeline,
      actionLog: [{
        id: `LOG-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        actionType: `WORKFLOW_${action}`,
        details: `Processed task ${taskId} (${action}) for DAR ${dar.title}`,
        actor: state.currentUser.name,
        actorId: state.currentUser.id,
        actorRole: state.currentUser.role || state.currentUser.position,
        date: new Date().toISOString()
      }, ...(state.actionLog || [])]
    };

    return newState;
    });

    if (newlyCompletedDar) {
      const store = get();
      store.syncRevisionEffective(newlyCompletedDar);
      store.syncObsoleteCompleted(newlyCompletedDar);
    }
  },

  resubmitDar: (darId, updatedData, taskId) => set((state) => {
    const dar = state.dars.find(d => d.id === darId);
    if (!dar) return state;

    const newTasks = state.tasks.filter(t => t.id !== taskId);
    const updatedDars = state.dars.map(d => d.id === darId ? { ...d, ...updatedData, status: 'UNDER_REVIEW' } : d);
    let newNotifications = [...state.notifications];

    const assignedReviewerId = resolveReviewer(dar.requesterId, dar.department, state.masterUsers, state.reviewUsers);

    if (assignedReviewerId) {
      const today = new Date();
      today.setDate(today.getDate() + state.mockDateOffset);
      newTasks.push({
        id: `t-${Date.now()}`,
        referenceType: 'INTERNAL_DAR', referenceId: dar.id,
        darId: dar.id,
        title: updatedData.title || dar.title,
        type: 'Review',
        assigneeId: assignedReviewerId,
        dueDate: new Date(today.getTime() + 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        cancelDate: new Date(today.getTime() + 4 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        status: 'NORMAL'
      });
      newNotifications.push({ id: Date.now() + Math.random(), userId: assignedReviewerId, title: 'งานใหม่รอการตรวจสอบ', message: `DAR "${updatedData.title || dar.title}" ถูกส่งมาใหม่ รอการตรวจสอบจากคุณ`, isRead: false, link: '/tasks', timestamp: new Date().toISOString() });
    }

    return {
      dars: updatedDars,
      tasks: newTasks,
      notifications: newNotifications,
      timeline: [...state.timeline, {
        id: Date.now(), darId: dar.id, action: 'Resubmitted', user: state.currentUser.name, date: new Date().toLocaleString(), comment: 'Resubmitted after revision'
      }],
      actionLog: [{
        id: `LOG-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        actionType: `DAR_RESUBMIT`,
        details: `Resubmitted DAR ${dar.title}`,
        actor: state.currentUser.name,
        actorId: state.currentUser.id,
        actorRole: state.currentUser.role || state.currentUser.position,
        date: new Date().toISOString()
      }, ...(state.actionLog || [])]
    };
  }),

  submitCopyRequest: (docId, reason, qty, dept) => set((state) => {
    const doc = state.documents.find(d => d.id === docId);
    if (!doc) return state;

    const request = {
      id: `CR-${Date.now()}`,
      docId,
      docTitle: doc.title,
      requesterId: state.currentUser.id,
      department: dept,
      reason,
      qty,
      status: 'PENDING_MANAGER_APPROVAL',
      dateRequested: new Date().toISOString().split('T')[0]
    };

    const managerObj = state.masterUsers.find(u => u.department === state.currentUser.department && u.level > state.currentUser.level) ||
      state.masterUsers.find(u => u.level > state.currentUser.level);

    let newTasks = [...state.tasks];
    let newNotifications = [...state.notifications];

    if (managerObj) {
      const newTaskId = `t-${Date.now()}-cra`;
      newTasks.push({
        id: newTaskId,
        title: `อนุมัติเบิกสำเนาเพิ่มเติม (${doc.title})`,
        type: 'CC_REPLACEMENT_APPROVAL',
        assigneeId: managerObj.id,
        status: 'PENDING',
        requestId: request.id
      });
      newNotifications.push({ id: Date.now() + Math.random(), userId: managerObj.id, title: 'อนุมัติเบิกสำเนา', message: `คำขอเบิกสำเนา ${doc.title} รอการอนุมัติ`, isRead: false, link: '/tasks', timestamp: new Date().toISOString(), relatedTaskId: newTaskId });
    } else {
      request.status = 'PENDING_DCC_DISTRIBUTION';
      const newTaskId = `t-${Date.now()}-ccd`;
      newTasks.push({
        id: newTaskId,
        title: `แจกจ่ายสำเนาเพิ่มเติม (${doc.title})`,
        type: 'DCC_REPLACEMENT',
        assigneeId: 'U001',
        status: 'PENDING',
        requestId: request.id
      });
      newNotifications.push({ id: Date.now() + Math.random(), userId: 'U001', title: 'คำขอเบิกสำเนา', message: `มีคำขอเบิกสำเนา ${doc.title} ที่ผ่านการอนุมัติแล้ว`, isRead: false, link: '/tasks', timestamp: new Date().toISOString(), relatedTaskId: newTaskId });
    }

    return {
      copyRequests: [request, ...state.copyRequests],
      tasks: newTasks,
      notifications: newNotifications,
      actionLog: [{
        id: `LOG-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        actionType: `COPY_REQUEST_SUBMIT`,
        details: `Requested ${qty} copies of ${doc.title}`,
        actor: state.currentUser.name,
        actorId: state.currentUser.id,
        actorRole: state.currentUser.role || state.currentUser.position,
        date: new Date().toISOString()
      }, ...(state.actionLog || [])]
    };
  }),

  approveCopyRequest: (taskId, action) => set((state) => {
    const task = state.tasks.find(t => t.id === taskId);
    if (!task) return state;

    const request = state.copyRequests.find(r => r.id === task.requestId);
    if (!request) return state;

    const newTasks = state.tasks.filter(t => t.id !== taskId);
    let newNotifications = state.notifications.map(n => n.relatedTaskId === taskId ? { ...n, isRead: true } : n);
    let newCopyRequests = [...state.copyRequests];

    if (action === 'APPROVE') {
      const updatedReq = { ...request, status: 'PENDING_DCC_DISTRIBUTION' };
      newCopyRequests = newCopyRequests.map(r => r.id === request.id ? updatedReq : r);

      const newTaskId = `t-${Date.now()}-ccd`;
      newTasks.push({
        id: newTaskId,
        title: `แจกจ่ายสำเนาเพิ่มเติม (${request.docTitle})`,
        type: 'DCC_REPLACEMENT',
        assigneeId: 'U001',
        status: 'PENDING',
        requestId: request.id
      });
      newNotifications.push({ id: Date.now() + Math.random(), userId: 'U001', title: 'คำขอเบิกสำเนา', message: `มีคำขอเบิกสำเนา ${request.docTitle} ที่ผ่านการอนุมัติแล้ว`, isRead: false, link: '/tasks', timestamp: new Date().toISOString(), relatedTaskId: newTaskId });
      newNotifications.push({ id: Date.now() + Math.random(), userId: request.requesterId, title: 'คำขอเบิกสำเนาได้รับการอนุมัติ', message: `คำขอเบิกสำเนา ${request.docTitle} ได้รับการอนุมัติแล้ว รอ DCC แจกจ่าย`, isRead: false, link: '/tasks', timestamp: new Date().toISOString() });
    } else {
      const updatedReq = { ...request, status: 'REJECTED' };
      newCopyRequests = newCopyRequests.map(r => r.id === request.id ? updatedReq : r);
      newNotifications.push({ id: Date.now() + Math.random(), userId: request.requesterId, title: 'คำขอเบิกสำเนาถูกปฏิเสธ', message: `คำขอเบิกสำเนา ${request.docTitle} ไม่ได้รับการอนุมัติ`, isRead: false, link: '/tasks', timestamp: new Date().toISOString() });
    }

    return {
      tasks: newTasks,
      notifications: newNotifications,
      copyRequests: newCopyRequests,
      actionLog: [{
        id: `LOG-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        actionType: `COPY_REQUEST_${action}`,
        details: `Processed Copy Request ${request.id} for ${request.docTitle}`,
        actor: state.currentUser.name,
        actorId: state.currentUser.id,
        actorRole: state.currentUser.role || state.currentUser.position,
        date: new Date().toISOString()
      }, ...(state.actionLog || [])]
    };
  }),

  simulatedDate: new Date().toISOString().split('T')[0],

  simulateNextDay: () => {
    set((state) => {
      const current = new Date(state.simulatedDate);
      current.setDate(current.getDate() + 1);
      return { simulatedDate: current.toISOString().split('T')[0] };
    });
    useStore.getState().checkSLA();
  },

  checkSLA: () => {
    let newlyCompletedDars = [];
    set((state) => {
    const todayStr = state.simulatedDate;
    const activeStatuses = ['DRAFT', 'UNDER_REVIEW', 'PENDING_APPROVAL', 'RETURNED_FOR_REVISION', 'WAITING_ACKNOWLEDGEMENT'];
    const activeExtStatuses = ['PENDING_EXT_REVIEW', 'PENDING_EXT_APPROVAL', 'RETURNED_FOR_REVISION'];
    
    const darIdsToCancel = state.dars
      .filter(d => activeStatuses.includes(d.status))
      .filter(d => calculateSLAStatus(d.effectiveDate, todayStr) === 'OVERDUE')
      .map(d => d.id);

    const extDocIdsToCancel = state.externalDocuments
      .filter(d => activeExtStatuses.includes(d.status))
      .filter(d => calculateSLAStatus(d.effectiveDate, todayStr) === 'OVERDUE')
      .map(d => d.id);
    
    const newTasks = state.tasks
      .filter(t => !darIdsToCancel.includes(t.darId) && !extDocIdsToCancel.includes(t.referenceId))
      .map(t => {
        let sla = 'NORMAL';
        if (t.darId) {
          const dar = state.dars.find(d => d.id === t.darId);
          if (dar && activeStatuses.includes(dar.status)) {
            sla = calculateSLAStatus(dar.effectiveDate, todayStr);
          }
        } else if (t.referenceType === 'EXTERNAL_DOC' && t.referenceId) {
          const extDoc = state.externalDocuments.find(d => d.id === t.referenceId);
          if (extDoc && activeExtStatuses.includes(extDoc.status)) {
            sla = calculateSLAStatus(extDoc.effectiveDate, todayStr);
          }
        }
        return { ...t, status: sla };
      });

    let newDars = state.dars.map(d => darIdsToCancel.includes(d.id) ? { ...d, status: 'CANCELLED_OVERDUE' } : d);
    let newExtDocs = state.externalDocuments.map(d => extDocIdsToCancel.includes(d.id) ? { ...d, status: 'CANCELLED_OVERDUE' } : d);
    let newDocuments = [...state.documents];
    const newTimeline = [...state.timeline];
    let newActionLog = state.actionLog ? [...state.actionLog] : [];
    let newExtAuditTrail = state.externalAuditTrail ? [...state.externalAuditTrail] : [];

    darIdsToCancel.forEach(darId => {
      newTimeline.push({
        id: Date.now() + Math.random(), darId, action: 'System Cancel', user: 'System (SLA Engine)', date: new Date().toLocaleString(), comment: 'Auto-cancelled due to Overdue Effective Date'
      });
    });

    extDocIdsToCancel.forEach(extId => {
      newActionLog.unshift({
        id: `LOG-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        actionType: 'SYSTEM_CANCEL',
        details: `External document cancelled due to Overdue SLA`,
        actor: 'System (SLA Engine)',
        actorId: 'SYS',
        date: new Date().toISOString()
      });
      newExtAuditTrail.unshift({
        id: `EXTA-${Date.now()}-${Math.random()}`,
        docId: extId,
        action: 'SYSTEM_CANCEL',
        actor: 'System (SLA Engine)',
        actorId: 'SYS',
        date: new Date().toISOString(),
        details: 'Auto-cancelled due to Overdue Effective Date'
      });
    });

    const waitingEffectiveDars = newDars.filter(d => d.status === 'APPROVED_WAITING_EFFECTIVE' && d.effectiveDate <= todayStr);

    let newControlledCopyInstances = [...state.controlledCopyInstances];
    let newAuditTrail = [...state.controlledCopyAuditTrail];
    let newNotifications = [...state.notifications];

    if (waitingEffectiveDars.length > 0) {
      waitingEffectiveDars.forEach(dar => {
        const completedDar = { ...dar, status: 'COMPLETED' };
        newlyCompletedDars.push(completedDar);
        newDars = newDars.map(d => d.id === dar.id ? completedDar : d);
        
        if (dar.type === 'NEW' || dar.type === 'NEW_DOCUMENT') {
          const newDoc = {
            id: `doc-${Date.now()}-${Math.random()}`,
            darId: dar.id,
            title: dar.docIdInput || 'TBD',
            name: dar.title,
            status: 'EFFECTIVE',
            rev: '00',
            department: dar.department,
            controlledCopy: 0,
            effectiveDate: dar.effectiveDate || todayStr,
            distributions: dar.distributions || []
          };
          newDocuments.push(newDoc);
          newNotifications.push({ id: Date.now() + Math.random(), userId: dar.requesterId, title: 'เอกสารบังคับใช้แล้ว', message: `เอกสารใหม่ "${dar.title}" มีผลบังคับใช้แล้ว`, isRead: false, link: '/library', timestamp: new Date().toISOString() });

          if (newDoc.distributions && newDoc.distributions.length > 0 && !newDoc.title.startsWith('FM')) {
              
              newTasks.push({
                id: `task-dist-${Date.now()}-${Math.random()}`,
                title: `แจกจ่ายเอกสาร Controlled Copy (NEW)`,
                description: `กรุณาพิมพ์และแจกจ่ายสำเนาควบคุมสำหรับเอกสาร ${newDoc.title} จำนวน ${newDoc.distributions.length} แผนก`,
                type: 'DCC_DISTRIBUTE',
                status: 'PENDING',
                assigneeId: 'U001',
                dueDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
                priority: 'HIGH',
                darId: dar.id
              });

            newDoc.distributions.forEach((dist, idx) => {
              const deptName = dist.departmentId || dist.dept;
              const nextCcNum = `CC-${String(idx + 1).padStart(3, '0')}`;
              const newInst = {
                id: `inst-${Date.now()}-${idx}`,
                docId: newDoc.id,
                docTitle: newDoc.title,
                docName: newDoc.name,
                rev: newDoc.rev,
                ccNumber: nextCcNum,
                department: deptName,
                issueNumber: 'I01',
                status: 'PENDING_RECEIPT',
                dateIssued: todayStr
              };
              newControlledCopyInstances.push(newInst);

              newAuditTrail.push({
                id: `audit-${Date.now()}-${idx}`,
                timestamp: new Date().toISOString(),
                user: 'System (SLA Engine)',
                action: 'AUTO_GENERATE',
                docTitle: newInst.docTitle,
                docRev: newInst.rev,
                ccNumber: newInst.ccNumber,
                oldStatus: '-',
                newStatus: newInst.status,
                remarks: `Auto-generated CC for ${dist.dept} department upon document effective`
              });
            });
          }
        } else if (dar.type === 'REVISION') {
          const oldDoc = newDocuments.find(doc => doc.id === dar.docIdRef && doc.status === 'EFFECTIVE');
          if (oldDoc) {
             newDocuments = newDocuments.map(doc => doc.id === oldDoc.id ? { ...doc, status: 'SUPERSEDED_ARCHIVED' } : doc);
             
             const currentRevNum = parseInt(oldDoc.rev, 10) || 0;
             const newRevNum = currentRevNum + 1;
             const newRevStr = newRevNum < 10 ? `0${newRevNum}` : `${newRevNum}`;
             
             const newDoc = {
               id: `doc-${Date.now()}-${Math.random()}`,
               darId: dar.id,
               title: oldDoc.title,
               name: dar.title || oldDoc.name,
               status: 'EFFECTIVE',
               rev: newRevStr,
               department: dar.department,
               controlledCopy: oldDoc.controlledCopy || 0,
               effectiveDate: dar.effectiveDate || todayStr,
               distributions: dar.distributions && dar.distributions.length > 0 ? dar.distributions : (oldDoc.distributions || [])
             };
             newDocuments.push(newDoc);
             newNotifications.push({ id: Date.now() + Math.random(), userId: dar.requesterId, title: 'ฉบับปรับปรุงบังคับใช้แล้ว', message: `เอกสารปรับปรุง "${dar.title}" มีผลบังคับใช้เป็น Rev.${newDoc.rev} แล้ว`, isRead: false, link: '/library', timestamp: new Date().toISOString() });

             if (newDoc.distributions && newDoc.distributions.length > 0 && !newDoc.title.startsWith('FM')) {
               
               newTasks.push({
                 id: `task-dist-${Date.now()}-${Math.random()}`,
                 title: `แจกจ่ายเอกสาร Controlled Copy (Rev.${newDoc.rev})`,
                 description: `กรุณาพิมพ์และแจกจ่ายสำเนาควบคุมสำหรับเอกสาร ${newDoc.title} จำนวน ${newDoc.distributions.length} แผนก`,
                 type: 'DCC_DISTRIBUTE',
                 status: 'PENDING',
                 assigneeId: 'U001',
                 dueDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
                 priority: 'HIGH',
                 darId: dar.id
               });

               newTasks.push({
                 id: `task-recall-${Date.now()}-${Math.random()}`,
                 title: `เรียกคืนเอกสาร Controlled Copy (Rev.${oldDoc.rev})`,
                 description: `เอกสาร ${oldDoc.title} มีการอัปเดตเป็น Rev.${newDoc.rev} แล้ว กรุณาเรียกคืนเอกสารฉบับเก่า (Rev.${oldDoc.rev}) จากแผนกที่เกี่ยวข้อง`,
                 type: 'DCC_RECALL',
                 status: 'PENDING',
                 assigneeId: 'U001',
                 dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
                 priority: 'HIGH',
                 darId: dar.id
               });

               let maxCcNum = 0;
               
               newDoc.distributions.forEach((dist, idx) => {
                 const deptName = dist.departmentId || dist.dept;
                 maxCcNum += 1;
                 const nextCcNum = `CC-${String(maxCcNum).padStart(3, '0')}`;
                 const newInst = {
                   id: `inst-${Date.now()}-${idx}`,
                   docId: newDoc.id,
                   docTitle: newDoc.title,
                   docName: newDoc.name,
                   rev: newDoc.rev,
                   ccNumber: nextCcNum,
                   department: deptName,
                   issueNumber: 'I01',
                   status: 'PENDING_RECEIPT',
                   dateIssued: todayStr
                 };
                 newControlledCopyInstances.push(newInst);
                 
                 newAuditTrail.push({
                   id: `audit-${Date.now()}-${idx}`,
                   timestamp: new Date().toISOString(),
                   user: 'System (SLA Engine)',
                   action: 'AUTO_GENERATE',
                   docTitle: newInst.docTitle,
                   docRev: newInst.rev,
                   ccNumber: newInst.ccNumber,
                   oldStatus: '-',
                   newStatus: newInst.status,
                   remarks: `Auto-generated CC for ${dist.dept} department upon new revision effective`
                 });
               });
             }
          }
        } else if (dar.type === 'OBSOLETE') {
          newDocuments = newDocuments.map(doc => (doc.id === dar.docIdRef && doc.status === 'EFFECTIVE') ? { ...doc, status: 'OBSOLETE_ARCHIVED' } : doc);
          newNotifications.push({ id: Date.now() + Math.random(), userId: dar.requesterId, title: 'ยกเลิกเอกสารสำเร็จ', message: `เอกสาร "${dar.title}" ถูกยกเลิกและย้ายไปเก็บที่ Archive แล้ว`, isRead: false, link: '/library', timestamp: new Date().toISOString() });
        }

        newTimeline.push({
          id: Date.now() + Math.random(), darId: dar.id, action: 'Auto Publish', user: 'System (Lifecycle Engine)', date: new Date().toLocaleString(), comment: 'Document changed to EFFECTIVE status automatically'
        });
      });
    }

    if (darIdsToCancel.length === 0 && waitingEffectiveDars.length === 0 && JSON.stringify(newTasks) === JSON.stringify(state.tasks)) {
      return state;
    }

    return {
      tasks: newTasks,
      dars: newDars,
      externalDocuments: newExtDocs,
      documents: newDocuments,
      timeline: newTimeline,
      controlledCopyInstances: newControlledCopyInstances,
      controlledCopyAuditTrail: newAuditTrail,
      notifications: newNotifications,
      actionLog: newActionLog,
      externalAuditTrail: newExtAuditTrail
    };
    });

    if (newlyCompletedDars.length > 0) {
      const store = get();
      newlyCompletedDars.forEach(dar => {
        store.syncRevisionEffective(dar);
        store.syncObsoleteCompleted(dar);
      });
    }
  },

  addComment: (darId, commentStr, user) => set((state) => {
    const newTimeline = [...state.timeline, {
      id: Date.now(), darId: darId, action: 'Comment', user: user.name, date: new Date().toLocaleString(), comment: commentStr, isChat: true, userId: user.id
    }];
    return { timeline: newTimeline };
  }),

  cancelDar: (darId) => {
    set((state) => {
      const updatedDars = state.dars.map(d => d.id === darId ? { ...d, status: 'CANCELLED' } : d);
      return { dars: updatedDars };
    });
    
    set((state) => {
      return {
        dars: state.dars.filter(d => d.id !== darId),
        tasks: state.tasks.filter(t => t.darId !== darId),
        timeline: state.timeline.filter(t => t.darId !== darId),
        actionLog: [{
          id: `LOG-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          actionType: 'DAR_CANCEL',
          actor: state.currentUser.name,
          details: `Cancelled DAR ${darId}`,
          timestamp: new Date().toISOString()
        }, ...(state.actionLog || [])]
      };
    });
  },

  deleteDar: (darId) => set((state) => {
    return {
      dars: state.dars.filter(d => d.id !== darId),
      tasks: state.tasks.filter(t => t.darId !== darId),
      timeline: state.timeline.filter(t => t.darId !== darId),
      actionLog: [{
        id: `LOG-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        actionType: 'DAR_DELETE',
        actor: state.currentUser.name,
        details: `Deleted DAR ${darId}`,
        timestamp: new Date().toISOString()
      }, ...(state.actionLog || [])]
    };
  }),

  // Phase 1.5 Departmental Access Control
  canAccessDocument: (userId, documentDept, distributions = []) => {
    // We need to look up the user dynamically to get their updated properties
    const user = MASTER_DATA_USER.find(u => u.id === userId);
    if (!user) return false;

    if (documentDept === user.dept) return true;
    if (distributions && distributions.some(d => d.dept === user.dept || d.departmentId === user.dept)) return true;
    if (user.level >= 5) return true; // Global view for Asst. Manager and above
    if (user.isDcc) return true; // DCC Admin view metadata
    return false;
  },

  canDownloadDocument: (doc, user) => {
    // 100% View-Only for normal users. Only DCC can download.
    // Exception: Form (FM) documents have unlimited internal downloads.
    if (user.isDcc) return true;
    if (doc && doc.title && doc.title.startsWith('FM')) return true;
    return false;
  },

  // --- CONTROLLED COPY METHODS ---
  issueControlledCopy: (docTitle, dept) => set((state) => {
    const doc = state.documents.find(d => d.title === docTitle && d.status === 'EFFECTIVE');
    if (!doc) return state;

    // Find next CC number for this doc
    const existingCopies = state.controlledCopyInstances.filter(c => c.docTitle === docTitle);
    const nextCcNum = `CC-${String(existingCopies.length + 1).padStart(3, '0')}`;

    const newInst = {
      id: `inst-${Date.now()}`,
      docId: doc.id,
      docTitle: doc.title,
      docName: doc.name,
      rev: doc.rev,
      ccNumber: nextCcNum,
      department: dept,
      issueNumber: 'I01',
      status: 'PENDING_RECEIPT',
      dateIssued: new Date().toISOString().split('T')[0]
    };

    const auditLog = {
      id: `audit-${Date.now()}`,
      timestamp: new Date().toISOString(),
      user: state.currentUser.name,
      action: 'ISSUE_COPY',
      docTitle: newInst.docTitle,
      docRev: newInst.rev,
      ccNumber: newInst.ccNumber,
      oldStatus: '-',
      newStatus: newInst.status,
      remarks: `Issued new controlled copy to ${dept}`
    };

    return {
      controlledCopyInstances: [...state.controlledCopyInstances, newInst],
      controlledCopyAuditTrail: [auditLog, ...state.controlledCopyAuditTrail],
      actionLog: [{
        id: `LOG-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        actionType: 'CC_ISSUE',
        actor: state.currentUser.name,
        details: `Issued controlled copy for ${docTitle}`,
        timestamp: new Date().toISOString()
      }, ...(state.actionLog || [])]
    };
  }),

  confirmCcReceipt: (instId) => set((state) => {
    const inst = state.controlledCopyInstances.find(i => i.id === instId);
    if (!inst) return state;

    const auditLog = {
      id: `audit-${Date.now()}`,
      timestamp: new Date().toISOString(),
      user: state.currentUser.name,
      action: 'CONFIRM_RECEIPT',
      docTitle: inst.docTitle,
      docRev: inst.rev,
      ccNumber: inst.ccNumber,
      oldStatus: inst.status,
      newStatus: 'ACTIVE',
      remarks: 'User confirmed receipt of document'
    };

    const newNotification = { id: Date.now() + Math.random(), userId: state.currentUser.id, title: 'รับเอกสารควบคุมสำเร็จ', message: `คุณได้ยืนยันการรับเอกสาร ${inst.ccNumber} (${inst.docTitle}) เรียบร้อยแล้ว`, isRead: false, link: '/controlled-copy', timestamp: new Date().toISOString() };

    const newInstances = state.controlledCopyInstances.map(i => 
      i.id === instId ? { ...i, status: 'ACTIVE' } : i
    );
    return {
      controlledCopyInstances: newInstances,
      controlledCopyAuditTrail: [auditLog, ...state.controlledCopyAuditTrail],
      notifications: [newNotification, ...state.notifications],
      tasks: cleanupDccTasks(state.tasks, newInstances, state.documents),
      actionLog: [{
        id: `LOG-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        actionType: 'CC_RECEIPT',
        actor: state.currentUser.name,
        details: `Confirmed receipt for copy ${instId}`,
        timestamp: new Date().toISOString()
      }, ...(state.actionLog || [])]
    };
  }),

  reportCcDamagedLost: (instId, type, reason) => set((state) => {
    const inst = state.controlledCopyInstances.find(i => i.id === instId);
    if (!inst) return state;

    const auditLog = {
      id: `audit-${Date.now()}`,
      timestamp: new Date().toISOString(),
      user: state.currentUser.name,
      action: type === 'LOST' ? 'REPORT_LOST' : 'REPORT_DAMAGED',
      docTitle: inst.docTitle,
      docRev: inst.rev,
      ccNumber: inst.ccNumber,
      oldStatus: inst.status,
      newStatus: 'REPLACEMENT_REQUESTED',
      remarks: `User reported: ${reason}`
    };

    const requesterLevel = state.currentUser.level;
    let managerObj;

    if (requesterLevel >= 5) {
      managerObj = state.masterUsers.find(u => u.level >= 6 || u.position.includes('General Manager') || u.position.includes('Director'));
    } else {
      managerObj = state.masterUsers.find(u => u.depts && u.depts.includes(inst.department) && u.level === 5);
      if (!managerObj) {
        managerObj = state.masterUsers.find(u => u.level >= 6 || u.position.includes('General Manager') || u.position.includes('Director'));
      }
    }

    // Assign to manager if found, else fallback to DCC
    const assigneeId = managerObj ? managerObj.id : 'U001';

    const newTask = {
      id: `task-rep-${Date.now()}-${Math.random()}`,
      title: `คำขอทดแทนเอกสารควบคุม: ${inst.ccNumber}`,
      description: `แผนก ${inst.department} ขอทดแทนฉบับใหม่สำหรับเอกสาร ${inst.docTitle} เนื่องจาก ${type} (${reason})`,
      taskType: 'CC_REPLACEMENT_APPROVAL',
      type: 'CC_REPLACEMENT_APPROVAL',
      status: 'PENDING',
      assigneeId: assigneeId,
      assignedToRole: managerObj ? undefined : 'DCC_ADMIN',
      instanceId: inst.id,
      darId: inst.docId,
      dueDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      priority: 'HIGH'
    };

    const notif = {
      id: `notif-${Date.now()}`,
      userId: assigneeId,
      title: 'อนุมัติการขอทดแทนเอกสาร',
      message: `มีคำขอทดแทนเอกสาร ${inst.ccNumber} รอการอนุมัติ`,
      isRead: false,
      link: `/tasks/approve-replacement/${newTask.id}`,
      timestamp: new Date().toISOString(),
      relatedTaskId: newTask.id
    };

    const newInstances = state.controlledCopyInstances.map(i => 
      i.id === instId ? { ...i, status: 'REPLACEMENT_REQUESTED', reportType: type, reportReason: reason, reportRequesterName: state.currentUser.name, reportRequesterId: state.currentUser.id } : i
    );
    return {
      controlledCopyInstances: newInstances,
      controlledCopyAuditTrail: [auditLog, ...state.controlledCopyAuditTrail],
      tasks: cleanupDccTasks([newTask, ...state.tasks], newInstances, state.documents),
      notifications: [notif, ...state.notifications],
      actionLog: [{
        id: `LOG-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        actionType: 'CC_REPORT',
        actor: state.currentUser.name,
        details: `Reported copy ${instId} as ${type}`,
        timestamp: new Date().toISOString()
      }, ...(state.actionLog || [])]
    };
  }),

  approveCcReplacement: (taskId) => set((state) => {
    const task = state.tasks.find(t => t.id === taskId);
    if (!task) return state;

    const instId = task.instanceId;
    const oldInst = state.controlledCopyInstances.find(i => i.id === instId);
    if (!oldInst) return state;

    const updatedInstances = state.controlledCopyInstances.map(inst =>
      inst.id === instId ? { ...inst, status: oldInst.reportType } : inst
    );

    const currentIssue = parseInt(oldInst.issueNumber.replace('I', '')) || 1;
    const nextIssue = `I${String(currentIssue + 1).padStart(2, '0')}`;

    const newInst = {
      ...oldInst,
      id: `inst-${Date.now()}`,
      ccNumber: oldInst.ccNumber,
      issueNumber: nextIssue,
      status: 'PENDING_RECEIPT',
      dateIssued: new Date().toISOString().split('T')[0],
      reportType: undefined,
      reportReason: undefined,
      reportRequesterName: undefined,
      reportRequesterId: undefined
    };

    const auditLog = {
      id: `audit-${Date.now()}`,
      timestamp: new Date().toISOString(),
      user: state.currentUser.name,
      action: 'APPROVE_REPLACEMENT',
      docTitle: oldInst.docTitle,
      docRev: oldInst.rev,
      ccNumber: oldInst.ccNumber,
      oldStatus: oldInst.status,
      newStatus: oldInst.reportType,
      remarks: `Manager approved replacement for ${oldInst.reportType}. New Issue: ${nextIssue}`
    };

    const newTasks = state.tasks.filter(t => t.id !== taskId);
    let newNotifs = state.notifications.map(n => n.relatedTaskId === taskId ? { ...n, isRead: true } : n);

    newNotifs.push({
      id: `notif-dcc-${Date.now()}`,
      userId: 'U001',
      title: 'จัดพิมพ์เอกสารทดแทน',
      message: `ผู้จัดการได้อนุมัติเอกสารทดแทนสำหรับ ${oldInst.ccNumber} กรุณาจัดพิมพ์และแจกจ่าย`,
      isRead: false,
      link: '/controlled-copy',
      timestamp: new Date().toISOString()
    });

    const finalInstances = [...updatedInstances, newInst];
    return { 
      controlledCopyInstances: finalInstances,
      controlledCopyAuditTrail: [auditLog, ...state.controlledCopyAuditTrail],
      tasks: cleanupDccTasks(newTasks, finalInstances, state.documents),
      notifications: newNotifs,
      actionLog: [{
        id: `LOG-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        actionType: 'CC_REPLACE_APPROVE',
        actor: state.currentUser.name,
        details: `Approved replacement for task ${taskId}`,
        timestamp: new Date().toISOString()
      }, ...(state.actionLog || [])]
    };
  }),

  rejectCcReplacement: (taskId, reason) => set((state) => {
    const task = state.tasks.find(t => t.id === taskId);
    if (!task) return state;

    const instId = task.instanceId;
    const inst = state.controlledCopyInstances.find(i => i.id === instId);
    if (!inst) return state;

    const auditLog = {
      id: `audit-${Date.now()}`,
      timestamp: new Date().toISOString(),
      user: state.currentUser.name,
      action: 'REJECT_REPLACEMENT',
      docTitle: inst.docTitle,
      docRev: inst.rev,
      ccNumber: inst.ccNumber,
      oldStatus: inst.status,
      newStatus: 'ACTIVE',
      remarks: `Manager rejected replacement request. Reason: ${reason}`
    };

    const newTasks = state.tasks.filter(t => t.id !== taskId);
    let newNotifs = state.notifications.map(n => n.relatedTaskId === taskId ? { ...n, isRead: true } : n);

    newNotifs.push({
      id: `notif-rej-${Date.now()}`,
      userId: inst.reportRequesterId,
      title: 'ปฏิเสธคำขอทดแทนเอกสาร',
      message: `คำขอทดแทนเอกสาร ${inst.ccNumber} ถูกปฏิเสธ: ${reason}`,
      isRead: false,
      link: '/dashboard',
      timestamp: new Date().toISOString()
    });

    return {
      controlledCopyInstances: state.controlledCopyInstances.map(i =>
        i.id === instId ? { ...i, status: 'ACTIVE', reportType: undefined, reportReason: undefined, reportRequesterName: undefined, reportRequesterId: undefined } : i
      ),
      controlledCopyAuditTrail: [auditLog, ...state.controlledCopyAuditTrail],
      tasks: newTasks,
      notifications: newNotifs,
      actionLog: [{
        id: `LOG-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        actionType: 'CC_REPLACE_REJECT',
        actor: state.currentUser.name,
        details: `Rejected replacement for task ${taskId}`,
        timestamp: new Date().toISOString()
      }, ...(state.actionLog || [])]
    };
  }),

  recallControlledCopy: (instId) => set((state) => {
    const inst = state.controlledCopyInstances.find(i => i.id === instId);
    if (!inst) return state;

    const auditLog = {
      id: `audit-${Date.now()}`,
      timestamp: new Date().toISOString(),
      user: state.currentUser.name,
      action: 'RECALL_COPY',
      docTitle: inst.docTitle,
      docRev: inst.rev,
      ccNumber: inst.ccNumber,
      oldStatus: inst.status,
      newStatus: 'RECALLED',
      remarks: `Recalled copy due to obsolescence or new revision`
    };

    const newInstances = state.controlledCopyInstances.map(i => 
      i.id === instId ? { ...i, status: 'RECALLED', dateRecalled: new Date().toISOString().split('T')[0] } : i
    );
    return {
      controlledCopyInstances: newInstances,
      controlledCopyAuditTrail: [auditLog, ...state.controlledCopyAuditTrail],
      tasks: cleanupDccTasks(state.tasks, newInstances, state.documents),
      actionLog: [{
        id: `LOG-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        actionType: 'CC_RECALL',
        actor: state.currentUser.name,
        details: `Recalled copy ${instId}`,
        timestamp: new Date().toISOString()
      }, ...(state.actionLog || [])]
    };
  }),

  distributeDocument: (docId, deptId) => set((state) => {
    let updatedDocs = [...state.documents];
    const docIndex = updatedDocs.findIndex(d => d.id === docId);

    if (docIndex > -1) {
      const doc = updatedDocs[docIndex];
      const updatedDistributions = (doc.distributions || []).map(dist => {
        const dId = dist.departmentId || dist.dept;
        if (dId === deptId) {
          return { ...dist, isDistributed: true, distributedAt: new Date().toISOString() };
        }
        return dist;
      });
      updatedDocs[docIndex] = { ...doc, distributions: updatedDistributions };
    }
    
    return { 
      documents: updatedDocs,
      actionLog: [{
        id: `LOG-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        actionType: 'DOC_DISTRIBUTE',
        actor: state.currentUser.name,
        details: `Distributed document ${docId} to ${deptId}`,
        timestamp: new Date().toISOString()
      }, ...(state.actionLog || [])]
    };
  }),

  distributeAllDocument: (docId) => set((state) => {
    let updatedDocs = [...state.documents];
    const docIndex = updatedDocs.findIndex(d => d.id === docId);

    if (docIndex > -1) {
      const doc = updatedDocs[docIndex];
      const updatedDistributions = (doc.distributions || []).map(dist => {
        return { ...dist, isDistributed: true, distributedAt: new Date().toISOString() };
      });
      updatedDocs[docIndex] = { ...doc, distributions: updatedDistributions };
    }
    
    return { 
      documents: updatedDocs,
      actionLog: [{
        id: `LOG-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        actionType: 'DOC_DISTRIBUTE_ALL',
        actor: state.currentUser.name,
        details: `Distributed document ${docId} to all departments`,
        timestamp: new Date().toISOString()
      }, ...(state.actionLog || [])]
    };
  }),

  // Expose Setters for Demo Data Loader
  setTasks: (tasks) => set({ tasks }),
  setDars: (dars) => set({ dars }),
  setTimeline: (timeline) => set({ timeline })
}), {
  name: 'qms-storage-uat-v6',
  version: 1,
  migrate: (persistedState, version) => {
    if (version === 0 || !version) {
      // User requested to clear all mock tasks stuck in users' inboxes
      persistedState.tasks = [];
      persistedState.dars = [];
      persistedState.timeline = [];
      persistedState.actionLog = [];
      persistedState.notifications = [];
    }
    return persistedState;
  },
  partialize: (state) => ({
    currentUser: state.currentUser,
    tasks: state.tasks,
    notifications: state.notifications,
    dars: state.dars,
    timeline: state.timeline,
    documents: state.documents,
    externalDocuments: state.externalDocuments,
    controlledCopyInstances: state.controlledCopyInstances,
    controlledCopyAuditTrail: state.controlledCopyAuditTrail,
    actionLog: state.actionLog,
    periodicReviewSchedules: state.periodicReviewSchedules,
    periodicReviewTasks: state.periodicReviewTasks,
    periodicReviewRecords: state.periodicReviewRecords
  })
}));

export default useStore;
