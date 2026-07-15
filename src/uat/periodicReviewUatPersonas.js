export const UAT_PERSONAS = {
  'P-001': {
    id: 'u1', name: 'อรอนงค์ รักษาความดี', department: 'PD', depts: ['PD'],
    level: 1, position: 'เจ้าหน้าที่', role: 'USER', isDcc: false,
    departmentMemberships: [{ departmentId: 'PD', positionLevel: 1, isActive: true }]
  },
  'P-002': {
    id: 'u2', name: 'ธนาวุฒิ สมควรกิจดำรง', department: 'PD', depts: ['PD'],
    level: 3, position: 'หัวหน้าแผนก (Supervisor)', role: 'USER', isDcc: false,
    departmentMemberships: [{ departmentId: 'PD', positionLevel: 3, isActive: true }]
  },
  'P-003': {
    id: 'u3', name: 'วิชัย ใจตรง', department: 'PD', depts: ['PD'],
    level: 4, position: 'ผู้ช่วยผู้จัดการแผนก', role: 'USER', isDcc: false,
    departmentMemberships: [{ departmentId: 'PD', positionLevel: 4, isActive: true }]
  },
  'P-004': {
    id: 'u4', name: 'สมศรี ตั้งใจทำงาน', department: 'PD', depts: ['PD'],
    level: 1, position: 'พนักงานทั่วไป', role: 'USER', isDcc: false,
    departmentMemberships: [{ departmentId: 'PD', positionLevel: 1, isActive: true }]
  },
  'P-005': {
    id: 'u5', name: 'บุญช่วย คลังสินค้า', department: 'WH', depts: ['WH'],
    level: 1, position: 'เจ้าหน้าที่', role: 'USER', isDcc: false,
    departmentMemberships: [{ departmentId: 'WH', positionLevel: 1, isActive: true }]
  },
  'P-006': {
    id: 'u6', name: 'แจกจ่าย พนักงาน', department: 'WH', depts: ['WH'],
    level: 1, position: 'เจ้าหน้าที่กระจายเอกสาร', role: 'USER', isDcc: false,
    departmentMemberships: [{ departmentId: 'WH', positionLevel: 1, isActive: true }]
  },
  'P-007': {
    id: 'u7', name: 'วีระชัย หลายแผนก', department: 'QA', depts: ['PD', 'QA'],
    level: 3, position: 'หัวหน้าแผนก (QA)', role: 'USER', isDcc: false,
    departmentMemberships: [
      { departmentId: 'QA', positionLevel: 3, isActive: true },
      { departmentId: 'PD', positionLevel: 1, isActive: true }
    ]
  },
  'P-008': {
    id: 'u8', name: 'มอนิเตอร์ ตรวจสอบ', department: 'QA', depts: ['QA'],
    level: 2, position: 'พนักงานตรวจคุณภาพ', role: 'USER', isDcc: false,
    departmentMemberships: [{ departmentId: 'QA', positionLevel: 2, isActive: true }]
  },
  'P-009': {
    id: 'dcc', name: 'สมหญิง ดีซีซี', department: 'DCC', depts: ['DCC'],
    level: 5, position: 'ผู้ดูแลระบบ DCC', role: 'DCC_ADMIN', isDcc: true,
    departmentMemberships: [{ departmentId: 'DCC', positionLevel: 5, isActive: true }]
  },
  'P-010': {
    id: 'u9', name: 'ปกติ สมัครDAR', department: 'HR', depts: ['HR'],
    level: 1, position: 'เจ้าหน้าที่', role: 'USER', isDcc: false,
    departmentMemberships: [{ departmentId: 'HR', positionLevel: 1, isActive: true }]
  },
  'P-011': {
    id: 'u10', name: 'มองเห็นแต่แก้ไม่ได้', department: 'EN', depts: ['EN'],
    level: 1, position: 'พนักงานซ่อมบำรุง', role: 'USER', isDcc: false,
    departmentMemberships: [{ departmentId: 'EN', positionLevel: 1, isActive: true }]
  }
};
