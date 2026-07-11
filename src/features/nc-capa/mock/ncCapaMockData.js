import { NC_STATUS, NC_SEVERITY } from '../domain/models';

export const mockNcRecords = [
  {
    id: 'nc-1',
    ncNumber: 'NC-2023-0001',
    title: 'Product defect found in Batch A',
    description: 'A significant defect was observed during final inspection of Batch A.',
    status: NC_STATUS.OPEN,
    severity: NC_SEVERITY.HIGH,
    createdAt: '2023-10-01T10:00:00Z',
    dueDate: '2023-10-15T10:00:00Z',
    createdBy: 'U002',
    assignedTo: 'U004'
  },
  {
    id: 'nc-2',
    ncNumber: 'NC-2023-0002',
    title: 'Missing documentation for QA process',
    description: 'The required QA checklist is missing from the recent audit package.',
    status: NC_STATUS.IN_PROGRESS,
    severity: NC_SEVERITY.MEDIUM,
    createdAt: '2023-10-05T09:30:00Z',
    dueDate: '2023-10-10T10:00:00Z',
    createdBy: 'U003',
    assignedTo: 'U001'
  },
  {
    id: 'nc-3',
    ncNumber: 'NC-2023-0003',
    title: 'Critical safety violation in Zone C',
    description: 'Operator observed bypassing safety guards on Machine 4.',
    status: NC_STATUS.OPEN,
    severity: NC_SEVERITY.CRITICAL,
    createdAt: '2023-10-08T14:15:00Z',
    dueDate: '2023-10-09T10:00:00Z', // Overdue mock
    createdBy: 'U004',
    assignedTo: 'U002'
  }
];
