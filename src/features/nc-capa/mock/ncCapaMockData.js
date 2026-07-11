import { NC_STATUS, NC_SEVERITY, NCScreeningDecision } from '../domain/models';

export const mockNcRecords = [
  {
    id: 'nc-1',
    ncNumber: 'NC-2023-0001',
    title: 'Product defect found in Batch A',
    description: 'A significant defect was observed during final inspection of Batch A.',
    sourceType: 'INSPECTION',
    detectedDate: '2023-10-01',
    departmentId: 'D02', // PD
    reportedByUserId: 'U002',
    status: NC_STATUS.SCREENING,
    severity: NC_SEVERITY.HIGH,
    foodSafetyImpact: false,
    customerImpact: true,
    regulatoryImpact: false,
    immediateCorrection: 'Segregated the batch',
    containmentAction: 'Quarantined all related products',
    createdAt: '2023-10-01T10:00:00Z',
    submittedAt: '2023-10-01T10:05:00Z',
  },
  {
    id: 'nc-2',
    ncNumber: 'NC-2023-0002',
    title: 'Missing documentation for QA process',
    description: 'The required QA checklist is missing from the recent audit package.',
    sourceType: 'INTERNAL_AUDIT',
    detectedDate: '2023-10-05',
    departmentId: 'D01', // QA
    reportedByUserId: 'U003',
    status: NC_STATUS.RETURNED_FOR_INFO,
    severity: NC_SEVERITY.MEDIUM,
    screeningResult: NCScreeningDecision.RETURN_FOR_MORE_INFORMATION,
    screeningComment: 'Please attach the missing checklist scan.',
    createdAt: '2023-10-05T09:30:00Z',
    submittedAt: '2023-10-05T09:35:00Z',
    returnedAt: '2023-10-05T14:00:00Z',
  },
  {
    id: 'nc-3',
    ncNumber: 'NC-2023-0003',
    title: 'Critical safety violation in Zone C',
    description: 'Operator observed bypassing safety guards on Machine 4.',
    sourceType: 'INSPECTION',
    detectedDate: '2023-10-08',
    departmentId: 'D02', // PD
    reportedByUserId: 'U004',
    status: NC_STATUS.ASSIGNED,
    severity: NC_SEVERITY.CRITICAL,
    capaRequired: 'CAPA_REQUIRED',
    assignedOwnerUserId: 'U002',
    assignedDepartmentId: 'D02',
    screeningResult: NCScreeningDecision.ACCEPT_AS_NC,
    createdAt: '2023-10-08T14:15:00Z',
    submittedAt: '2023-10-08T14:20:00Z'
  }
];
