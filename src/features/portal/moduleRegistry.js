import { Library, AlertTriangle, CheckSquare, GraduationCap, ArrowLeftRight, Truck, MessageSquare, Wrench } from 'lucide-react';

export const MODULE_STATUS = {
  ACTIVE: 'ACTIVE',
  COMING_SOON: 'COMING_SOON'
};

export const moduleRegistry = [
  {
    moduleId: 'dcc',
    name: 'DCC / Document Control',
    description: 'Document control, DAR, document library, external documents, periodic review, controlled copy.',
    status: MODULE_STATUS.ACTIVE,
    route: '/dcc',
    icon: Library,
    permission: 'DCC_ACCESS', // Not strictly checked here, handled at route level or by checking if user has any access
    order: 1
  },
  {
    moduleId: 'nc-capa',
    name: 'NC / CAPA',
    description: 'Nonconformity, correction, root cause, CAPA, verification, effectiveness.',
    status: MODULE_STATUS.ACTIVE,
    route: '/nc-capa',
    icon: AlertTriangle,
    permission: 'NC_CAPA_VIEW', // Requires NC_CAPA_VIEW or NC_CAPA_VIEW_ALL
    order: 2
  },
  {
    moduleId: 'audit',
    name: 'Internal Audit',
    description: 'Audit planning, execution, and reporting.',
    status: MODULE_STATUS.COMING_SOON,
    route: '/audit',
    icon: CheckSquare,
    order: 3
  },
  {
    moduleId: 'training',
    name: 'Training Management',
    description: 'Training records, matrices, and evaluations.',
    status: MODULE_STATUS.COMING_SOON,
    route: '/training',
    icon: GraduationCap,
    order: 4
  },
  {
    moduleId: 'change-control',
    name: 'Change Control',
    description: 'Manage changes to processes, equipment, and systems.',
    status: MODULE_STATUS.COMING_SOON,
    route: '/change-control',
    icon: ArrowLeftRight,
    order: 5
  },
  {
    moduleId: 'supplier',
    name: 'Supplier Management',
    description: 'Supplier evaluation and performance monitoring.',
    status: MODULE_STATUS.COMING_SOON,
    route: '/supplier',
    icon: Truck,
    order: 6
  },
  {
    moduleId: 'complaints',
    name: 'Customer Complaint',
    description: 'Manage and investigate customer complaints.',
    status: MODULE_STATUS.COMING_SOON,
    route: '/complaints',
    icon: MessageSquare,
    order: 7
  },
  {
    moduleId: 'calibration',
    name: 'Calibration / Equipment',
    description: 'Equipment calibration schedules and records.',
    status: MODULE_STATUS.COMING_SOON,
    route: '/calibration',
    icon: Wrench,
    order: 8
  }
];
