export const translations = {
  th: {
    dashboard: {
      title: 'แดชบอร์ด NC/CAPA',
      openNc: 'NC ที่เปิดอยู่',
      overdue: 'เลยกำหนด',
      critical: 'วิกฤต',
      recentActivity: 'กิจกรรมล่าสุด',
      quickActions: 'การดำเนินการด่วน',
      createNc: 'สร้าง NC',
      viewAll: 'ดูทั้งหมด',
      myTasks: 'งานของฉัน'
    },
    list: {
      title: 'รายการ NC/CAPA',
      search: 'ค้นหา...',
      status: 'สถานะ',
      severity: 'ความรุนแรง',
      noData: 'ไม่พบข้อมูล'
    },
    detail: {
      title: 'รายละเอียด NC',
      notFound: 'ไม่พบข้อมูล NC',
      accessDenied: 'ไม่มีสิทธิ์เข้าถึง',
      restricted: 'ข้อมูลนี้ถูกจำกัดสิทธิ์'
    },
    status: {
      DRAFT: 'ร่าง',
      OPEN: 'เปิด',
      IN_PROGRESS: 'กำลังดำเนินการ',
      CLOSED: 'ปิดแล้ว'
    },
    severity: {
      LOW: 'ต่ำ',
      MEDIUM: 'ปานกลาง',
      HIGH: 'สูง',
      CRITICAL: 'วิกฤต'
    }
  },
  en: {
    dashboard: {
      title: 'NC/CAPA Dashboard',
      openNc: 'Open NC',
      overdue: 'Overdue',
      critical: 'Critical',
      recentActivity: 'Recent Activity',
      quickActions: 'Quick Actions',
      createNc: 'Create NC',
      viewAll: 'View All',
      myTasks: 'My Tasks'
    },
    list: {
      title: 'NC/CAPA List',
      search: 'Search...',
      status: 'Status',
      severity: 'Severity',
      noData: 'No data found'
    },
    detail: {
      title: 'NC Details',
      notFound: 'NC Not Found',
      accessDenied: 'Access Denied',
      restricted: 'This information is restricted'
    },
    status: {
      DRAFT: 'Draft',
      OPEN: 'Open',
      IN_PROGRESS: 'In Progress',
      CLOSED: 'Closed'
    },
    severity: {
      LOW: 'Low',
      MEDIUM: 'Medium',
      HIGH: 'High',
      CRITICAL: 'Critical'
    }
  }
};

export const useNcCapaTranslation = () => {
  // Simplistic local storage check, defaulting to Thai to match the rest of the application
  const lang = (typeof window !== 'undefined' && localStorage.getItem('language')) || 'th';
  const dict = translations[lang] || translations.th;

  return {
    t: (group, key) => {
      return dict?.[group]?.[key] || key;
    },
    lang
  };
};
