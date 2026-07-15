export const UAT_DATASET = {
  version: 'PERIODIC_REVIEW_UAT_V1',
  'TD-PR-001': {
    documents: [{ id: 'DOC-001', title: 'WI-001', name: 'UPCOMING DOC', department: 'PD', ownerId: 'u1', status: 'EFFECTIVE', rev: '01', effectiveDate: '2025-09-01' }],
    periodicReviewSchedules: [{ id: 'PR-001', documentCategory: 'INTERNAL', documentId: 'DOC-001', documentNumber: 'WI-001', documentName: 'UPCOMING DOC', ownerDepartmentId: 'PD', ownerUserId: 'u1', responsibleUserId: 'u1', frequencyMonths: 12, originalReviewAnchorDate: '2025-09-01', currentScheduledReviewDate: '2026-09-01', nextReviewDate: '2026-09-01', status: 'UPCOMING', dueState: 'NOT_YET_DUE', escalationLevel: 0, isActive: true }],
    dars: [], tasks: [], periodicReviewRecords: []
  },
  'TD-PR-002': {
    documents: [{ id: 'DOC-002', title: 'WI-002', name: 'DUE_SOON DOC', department: 'PD', ownerId: 'u1', status: 'EFFECTIVE', rev: '01', effectiveDate: '2025-08-01' }],
    periodicReviewSchedules: [{ id: 'PR-002', documentCategory: 'INTERNAL', documentId: 'DOC-002', documentNumber: 'WI-002', documentName: 'DUE_SOON DOC', ownerDepartmentId: 'PD', ownerUserId: 'u1', responsibleUserId: 'u1', frequencyMonths: 12, originalReviewAnchorDate: '2025-08-01', currentScheduledReviewDate: '2026-08-01', nextReviewDate: '2026-08-01', status: 'ACTION_REQUIRED', dueState: 'DUE_SOON_30', escalationLevel: 0, isActive: true }],
    dars: [], tasks: [{ id: 'PRT-002', scheduleId: 'PR-002', assignedToUserId: 'u1', assignedToDepartmentId: 'PD', dueDate: '2026-08-01', status: 'ACTION_REQUIRED', dueState: 'DUE_SOON_30', overdueDays: 0, documentNumber: 'WI-002', documentName: 'DUE_SOON DOC', documentCategory: 'INTERNAL' }], periodicReviewRecords: []
  },
  'TD-PR-003': {
    documents: [{ id: 'DOC-003', title: 'WI-003', name: 'DUE DOC', department: 'WH', ownerId: 'u5', status: 'EFFECTIVE', rev: '02', effectiveDate: '2025-07-15' }],
    periodicReviewSchedules: [{ id: 'PR-003', documentCategory: 'INTERNAL', documentId: 'DOC-003', documentNumber: 'WI-003', documentName: 'DUE DOC', ownerDepartmentId: 'WH', ownerUserId: 'u5', responsibleUserId: 'u5', frequencyMonths: 12, originalReviewAnchorDate: '2025-07-15', currentScheduledReviewDate: '2026-07-15', nextReviewDate: '2026-07-15', status: 'ACTION_REQUIRED', dueState: 'DUE_SOON_7', escalationLevel: 0, isActive: true }],
    dars: [], tasks: [{ id: 'PRT-003', scheduleId: 'PR-003', assignedToUserId: 'u5', assignedToDepartmentId: 'WH', dueDate: '2026-07-15', status: 'ACTION_REQUIRED', dueState: 'DUE_SOON_7', overdueDays: 0, documentNumber: 'WI-003', documentName: 'DUE DOC', documentCategory: 'INTERNAL' }], periodicReviewRecords: []
  },
  'TD-PR-004': {
    documents: [{ id: 'DOC-004', title: 'WI-004', name: 'IN_PROGRESS DOC', department: 'QA', ownerId: 'u7', status: 'EFFECTIVE', rev: '01', effectiveDate: '2025-07-01' }],
    periodicReviewSchedules: [{ id: 'PR-004', documentCategory: 'INTERNAL', documentId: 'DOC-004', documentNumber: 'WI-004', documentName: 'IN_PROGRESS DOC', ownerDepartmentId: 'QA', ownerUserId: 'u7', responsibleUserId: 'u7', frequencyMonths: 12, originalReviewAnchorDate: '2025-07-01', currentScheduledReviewDate: '2026-07-01', nextReviewDate: '2026-07-01', status: 'IN_PROGRESS', outcome: 'REVISION_REQUIRED', dueState: 'NOT_YET_DUE', escalationLevel: 0, isActive: true }],
    dars: [], tasks: [{ id: 'PRT-004', scheduleId: 'PR-004', assignedToUserId: 'u7', assignedToDepartmentId: 'QA', dueDate: '2026-07-01', status: 'COMPLETED', dueState: 'NOT_YET_DUE', overdueDays: 0, documentNumber: 'WI-004', documentName: 'IN_PROGRESS DOC', documentCategory: 'INTERNAL' }],
    periodicReviewRecords: [{ id: 'REC-004', scheduleId: 'PR-004', outcome: 'REVISION_REQUIRED', reviewedByUserId: 'u7' }]
  },
  'TD-PR-005': {
    documents: [{ id: 'DOC-005', title: 'WI-005', name: 'OVERDUE DOC', department: 'EN', ownerId: 'u10', status: 'EFFECTIVE', rev: '01', effectiveDate: '2024-05-01' }],
    periodicReviewSchedules: [{ id: 'PR-005', documentCategory: 'INTERNAL', documentId: 'DOC-005', documentNumber: 'WI-005', documentName: 'OVERDUE DOC', ownerDepartmentId: 'EN', ownerUserId: 'u10', responsibleUserId: 'u10', frequencyMonths: 12, originalReviewAnchorDate: '2024-05-01', currentScheduledReviewDate: '2025-05-01', nextReviewDate: '2025-05-01', status: 'ACTION_REQUIRED', dueState: 'OVERDUE', escalationLevel: 1, isActive: true }],
    dars: [], tasks: [{ id: 'PRT-005', scheduleId: 'PR-005', assignedToUserId: 'u10', assignedToDepartmentId: 'EN', dueDate: '2025-05-01', status: 'ACTION_REQUIRED', dueState: 'OVERDUE', overdueDays: 400, documentNumber: 'WI-005', documentName: 'OVERDUE DOC', documentCategory: 'INTERNAL' }], periodicReviewRecords: []
  },
  'TD-PR-006': {
    documents: [{ id: 'DOC-006', title: 'WI-006', name: 'COMPLETED NO_CHANGE', department: 'PD', ownerId: 'u1', status: 'EFFECTIVE', rev: '01', effectiveDate: '2025-06-01' }],
    periodicReviewSchedules: [{ id: 'PR-006', documentCategory: 'INTERNAL', documentId: 'DOC-006', documentNumber: 'WI-006', documentName: 'COMPLETED NO_CHANGE', ownerDepartmentId: 'PD', ownerUserId: 'u1', responsibleUserId: 'u1', frequencyMonths: 12, originalReviewAnchorDate: '2025-06-01', currentScheduledReviewDate: '2027-06-01', nextReviewDate: '2027-06-01', status: 'UPCOMING', outcome: 'NO_CHANGE', dueState: 'NOT_YET_DUE', escalationLevel: 0, isActive: true }],
    dars: [], tasks: [], periodicReviewRecords: [{ id: 'REC-006', scheduleId: 'PR-006', outcome: 'NO_CHANGE', reviewedByUserId: 'u1' }]
  },
  'TD-PR-007': {
    documents: [{ id: 'DOC-007', title: 'WI-007', name: 'REVISION_REQUIRED PRE-DAR', department: 'PD', ownerId: 'u1', status: 'EFFECTIVE', rev: '01', effectiveDate: '2025-06-01' }],
    periodicReviewSchedules: [{ id: 'PR-007', documentCategory: 'INTERNAL', documentId: 'DOC-007', documentNumber: 'WI-007', documentName: 'REVISION_REQUIRED PRE-DAR', ownerDepartmentId: 'PD', ownerUserId: 'u1', responsibleUserId: 'u1', frequencyMonths: 12, originalReviewAnchorDate: '2025-06-01', currentScheduledReviewDate: '2026-06-01', nextReviewDate: '2026-06-01', status: 'IN_PROGRESS', outcome: 'REVISION_REQUIRED', linkageStatus: 'PENDING', dueState: 'NOT_YET_DUE', escalationLevel: 0, isActive: true }],
    dars: [], tasks: [], periodicReviewRecords: [{ id: 'REC-007', scheduleId: 'PR-007', outcome: 'REVISION_REQUIRED', reviewedByUserId: 'u1' }]
  },
  'TD-PR-008': {
    documents: [{ id: 'DOC-008', title: 'WI-008', name: 'REVISION DRAFT', department: 'PD', ownerId: 'u1', status: 'EFFECTIVE', rev: '01', effectiveDate: '2025-06-01' }],
    periodicReviewSchedules: [{ id: 'PR-008', documentCategory: 'INTERNAL', documentId: 'DOC-008', documentNumber: 'WI-008', documentName: 'REVISION DRAFT', ownerDepartmentId: 'PD', ownerUserId: 'u1', responsibleUserId: 'u1', frequencyMonths: 12, originalReviewAnchorDate: '2025-06-01', currentScheduledReviewDate: '2026-06-01', nextReviewDate: '2026-06-01', status: 'IN_PROGRESS', outcome: 'REVISION_REQUIRED', linkedActionId: 'DAR-REV-008', linkageStatus: 'SUCCESS', dueState: 'NOT_YET_DUE', escalationLevel: 0, isActive: true }],
    dars: [{ id: 'DAR-REV-008', darNo: 'DAR-2607-008', type: 'REVISION', title: 'WI-008', name: 'REVISION DRAFT', status: 'DRAFT', department: 'PD', requesterId: 'u1', docId: 'DOC-008', revisesRev: '01' }], tasks: [], periodicReviewRecords: [{ id: 'REC-008', scheduleId: 'PR-008', outcome: 'REVISION_REQUIRED', reviewedByUserId: 'u1' }]
  },
  'TD-PR-009': {
    documents: [{ id: 'DOC-009', title: 'WI-009', name: 'REVISION WAITING', department: 'PD', ownerId: 'u1', status: 'EFFECTIVE', rev: '01', effectiveDate: '2025-06-01' }],
    periodicReviewSchedules: [{ id: 'PR-009', documentCategory: 'INTERNAL', documentId: 'DOC-009', documentNumber: 'WI-009', documentName: 'REVISION WAITING', ownerDepartmentId: 'PD', ownerUserId: 'u1', responsibleUserId: 'u1', frequencyMonths: 12, originalReviewAnchorDate: '2025-06-01', currentScheduledReviewDate: '2026-06-01', nextReviewDate: '2026-06-01', status: 'IN_PROGRESS', outcome: 'REVISION_REQUIRED', linkedActionId: 'DAR-REV-009', linkageStatus: 'SUCCESS', dueState: 'NOT_YET_DUE', escalationLevel: 0, isActive: true }],
    dars: [{ id: 'DAR-REV-009', darNo: 'DAR-2607-009', type: 'REVISION', title: 'WI-009', name: 'REVISION WAITING', status: 'APPROVED_WAITING_EFFECTIVE', department: 'PD', requesterId: 'u1', docId: 'DOC-009', revisesRev: '01' }], tasks: [], periodicReviewRecords: [{ id: 'REC-009', scheduleId: 'PR-009', outcome: 'REVISION_REQUIRED', reviewedByUserId: 'u1' }]
  },
  'TD-PR-010': {
    documents: [{ id: 'DOC-010', title: 'WI-010', name: 'REVISION COMPLETED', department: 'PD', ownerId: 'u1', status: 'EFFECTIVE', rev: '02', effectiveDate: '2026-06-01' }],
    periodicReviewSchedules: [{ id: 'PR-010', documentCategory: 'INTERNAL', documentId: 'DOC-010', documentNumber: 'WI-010', documentName: 'REVISION COMPLETED', ownerDepartmentId: 'PD', ownerUserId: 'u1', responsibleUserId: 'u1', frequencyMonths: 12, originalReviewAnchorDate: '2026-06-01', currentScheduledReviewDate: '2027-06-01', nextReviewDate: '2027-06-01', status: 'UPCOMING', dueState: 'NOT_YET_DUE', escalationLevel: 0, isActive: true }],
    dars: [{ id: 'DAR-REV-010', darNo: 'DAR-2607-010', type: 'REVISION', title: 'WI-010', name: 'REVISION COMPLETED', status: 'COMPLETED', department: 'PD', requesterId: 'u1', docId: 'DOC-010', revisesRev: '01' }], tasks: [], periodicReviewRecords: []
  },
  'TD-PR-011': {
    documents: [{ id: 'DOC-011', title: 'WI-011', name: 'OBSOLETE PRE-DAR', department: 'WH', ownerId: 'u5', status: 'EFFECTIVE', rev: '01', effectiveDate: '2025-06-01' }],
    periodicReviewSchedules: [{ id: 'PR-011', documentCategory: 'INTERNAL', documentId: 'DOC-011', documentNumber: 'WI-011', documentName: 'OBSOLETE PRE-DAR', ownerDepartmentId: 'WH', ownerUserId: 'u5', responsibleUserId: 'u5', frequencyMonths: 12, originalReviewAnchorDate: '2025-06-01', currentScheduledReviewDate: '2026-06-01', nextReviewDate: '2026-06-01', status: 'IN_PROGRESS', outcome: 'OBSOLETE_REQUIRED', linkageStatus: 'PENDING', dueState: 'NOT_YET_DUE', escalationLevel: 0, isActive: true }],
    dars: [], tasks: [], periodicReviewRecords: [{ id: 'REC-011', scheduleId: 'PR-011', outcome: 'OBSOLETE_REQUIRED', reviewedByUserId: 'u5' }]
  },
  'TD-PR-012': {
    documents: [{ id: 'DOC-012', title: 'WI-012', name: 'OBSOLETE DRAFT', department: 'WH', ownerId: 'u5', status: 'EFFECTIVE', rev: '01', effectiveDate: '2025-06-01' }],
    periodicReviewSchedules: [{ id: 'PR-012', documentCategory: 'INTERNAL', documentId: 'DOC-012', documentNumber: 'WI-012', documentName: 'OBSOLETE DRAFT', ownerDepartmentId: 'WH', ownerUserId: 'u5', responsibleUserId: 'u5', frequencyMonths: 12, originalReviewAnchorDate: '2025-06-01', currentScheduledReviewDate: '2026-06-01', nextReviewDate: '2026-06-01', status: 'IN_PROGRESS', outcome: 'OBSOLETE_REQUIRED', linkedActionId: 'DAR-OBS-012', linkageStatus: 'SUCCESS', dueState: 'NOT_YET_DUE', escalationLevel: 0, isActive: true }],
    dars: [{ id: 'DAR-OBS-012', darNo: 'DAR-2607-012', type: 'OBSOLETE', title: 'WI-012', name: 'OBSOLETE DRAFT', status: 'DRAFT', department: 'WH', requesterId: 'u5', docId: 'DOC-012' }], tasks: [], periodicReviewRecords: [{ id: 'REC-012', scheduleId: 'PR-012', outcome: 'OBSOLETE_REQUIRED', reviewedByUserId: 'u5' }]
  },
  'TD-PR-013': {
    documents: [{ id: 'DOC-013', title: 'WI-013', name: 'OBSOLETE COMPLETED', department: 'WH', ownerId: 'u5', status: 'OBSOLETE', rev: '01', effectiveDate: '2025-06-01' }],
    periodicReviewSchedules: [{ id: 'PR-013', documentCategory: 'INTERNAL', documentId: 'DOC-013', documentNumber: 'WI-013', documentName: 'OBSOLETE COMPLETED', ownerDepartmentId: 'WH', ownerUserId: 'u5', responsibleUserId: 'u5', frequencyMonths: 12, originalReviewAnchorDate: '2025-06-01', currentScheduledReviewDate: '2026-06-01', nextReviewDate: '2026-06-01', status: 'COMPLETED', outcome: 'OBSOLETE_REQUIRED', linkedActionId: 'DAR-OBS-013', linkageStatus: 'SUCCESS', dueState: 'NOT_YET_DUE', escalationLevel: 0, isActive: false }],
    dars: [{ id: 'DAR-OBS-013', darNo: 'DAR-2607-013', type: 'OBSOLETE', title: 'WI-013', name: 'OBSOLETE COMPLETED', status: 'COMPLETED', department: 'WH', requesterId: 'u5', docId: 'DOC-013' }], tasks: [], periodicReviewRecords: [{ id: 'REC-013', scheduleId: 'PR-013', outcome: 'OBSOLETE_REQUIRED', reviewedByUserId: 'u5' }]
  },
  'TD-PR-014': {
    documents: [{ id: 'DOC-014', title: 'WI-014', name: 'FAILED RETRY', department: 'PD', ownerId: 'u1', status: 'EFFECTIVE', rev: '01', effectiveDate: '2025-06-01' }],
    periodicReviewSchedules: [{ id: 'PR-014', documentCategory: 'INTERNAL', documentId: 'DOC-014', documentNumber: 'WI-014', documentName: 'FAILED RETRY', ownerDepartmentId: 'PD', ownerUserId: 'u1', responsibleUserId: 'u1', frequencyMonths: 12, originalReviewAnchorDate: '2025-06-01', currentScheduledReviewDate: '2026-06-01', nextReviewDate: '2026-06-01', status: 'IN_PROGRESS', outcome: 'REVISION_REQUIRED', linkageStatus: 'FAILED', dueState: 'NOT_YET_DUE', escalationLevel: 0, isActive: true }],
    dars: [], tasks: [], periodicReviewRecords: [{ id: 'REC-014', scheduleId: 'PR-014', outcome: 'REVISION_REQUIRED', reviewedByUserId: 'u1' }]
  },
  'TD-PR-015': {
    documents: [{ id: 'DOC-015', title: 'WI-015', name: 'DIFF DEPT', department: 'PD', ownerId: 'u1', status: 'EFFECTIVE', rev: '01', effectiveDate: '2025-09-01' }],
    periodicReviewSchedules: [{ id: 'PR-015', documentCategory: 'INTERNAL', documentId: 'DOC-015', documentNumber: 'WI-015', documentName: 'DIFF DEPT', ownerDepartmentId: 'WH', ownerUserId: 'u1', responsibleUserId: 'u1', frequencyMonths: 12, originalReviewAnchorDate: '2025-09-01', currentScheduledReviewDate: '2026-09-01', nextReviewDate: '2026-09-01', status: 'UPCOMING', dueState: 'NOT_YET_DUE', escalationLevel: 0, isActive: true }],
    dars: [], tasks: [], periodicReviewRecords: []
  },
  'TD-PR-016': {
    documents: [{ id: 'DOC-016', title: 'WI-016', name: 'MANUAL REV', department: 'PD', ownerId: 'u1', status: 'EFFECTIVE', rev: '01', effectiveDate: '2025-09-01' }],
    periodicReviewSchedules: [{ id: 'PR-016', documentCategory: 'INTERNAL', documentId: 'DOC-016', documentNumber: 'WI-016', documentName: 'MANUAL REV', ownerDepartmentId: 'PD', ownerUserId: 'u1', responsibleUserId: 'u1', frequencyMonths: 12, originalReviewAnchorDate: '2025-09-01', currentScheduledReviewDate: '2026-09-01', nextReviewDate: '2026-09-01', status: 'UPCOMING', dueState: 'NOT_YET_DUE', escalationLevel: 0, isActive: true }],
    dars: [{ id: 'DAR-MAN-016', darNo: 'DAR-2607-016', type: 'REVISION', title: 'WI-016', name: 'MANUAL REV', status: 'APPROVED_WAITING_EFFECTIVE', department: 'PD', requesterId: 'u1', docId: 'DOC-016', revisesRev: '01' }], tasks: [], periodicReviewRecords: []
  },
  'TD-PR-017': {
    documents: [{ id: 'DOC-017', title: 'WI-017', name: 'MANUAL OBS', department: 'WH', ownerId: 'u5', status: 'EFFECTIVE', rev: '01', effectiveDate: '2025-09-01' }],
    periodicReviewSchedules: [{ id: 'PR-017', documentCategory: 'INTERNAL', documentId: 'DOC-017', documentNumber: 'WI-017', documentName: 'MANUAL OBS', ownerDepartmentId: 'WH', ownerUserId: 'u5', responsibleUserId: 'u5', frequencyMonths: 12, originalReviewAnchorDate: '2025-09-01', currentScheduledReviewDate: '2026-09-01', nextReviewDate: '2026-09-01', status: 'UPCOMING', dueState: 'NOT_YET_DUE', escalationLevel: 0, isActive: true }],
    dars: [{ id: 'DAR-MAN-017', darNo: 'DAR-2607-017', type: 'OBSOLETE', title: 'WI-017', name: 'MANUAL OBS', status: 'APPROVED_WAITING_EFFECTIVE', department: 'WH', requesterId: 'u5', docId: 'DOC-017' }], tasks: [], periodicReviewRecords: []
  },
  'TD-PR-018': {
    externalDocuments: [{ id: 'EXT-018', title: 'EXTERNAL DOC', status: 'ACTIVE', department: 'DCC', ownerId: 'dcc', receivedDate: '2024-07-01', rev: '01' }],
    periodicReviewSchedules: [{ id: 'PR-018', documentCategory: 'EXTERNAL', externalDocumentId: 'EXT-018', documentNumber: 'EXT-018', documentName: 'EXTERNAL DOC', ownerDepartmentId: 'DCC', ownerUserId: 'dcc', responsibleUserId: 'dcc', frequencyMonths: 24, originalReviewAnchorDate: '2024-07-01', currentScheduledReviewDate: '2026-07-01', nextReviewDate: '2026-07-01', status: 'ACTION_REQUIRED', dueState: 'DUE_SOON_30', escalationLevel: 0, isActive: true }],
    dars: [], tasks: [{ id: 'PRT-018', scheduleId: 'PR-018', assignedToUserId: 'dcc', assignedToDepartmentId: 'DCC', dueDate: '2026-07-01', status: 'ACTION_REQUIRED', dueState: 'DUE_SOON_30', overdueDays: 0, documentNumber: 'EXT-018', documentName: 'EXTERNAL DOC', documentCategory: 'EXTERNAL' }], periodicReviewRecords: []
  }
};
