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
      SUBMITTED: 'ส่งแล้ว',
      SCREENING: 'รอตรวจสอบ QA',
      RETURNED_FOR_INFO: 'ตีกลับขอข้อมูลเพิ่ม',
      REJECTED_NOT_NC: 'ปฏิเสธ (ไม่ใช่ NC)',
      ASSIGNED: 'มอบหมายแล้ว (รอวิเคราะห์)',
      ROOT_CAUSE_IN_PROGRESS: 'กำลังวิเคราะห์รากปัญหา',
      QA_VERIFICATION: 'รอ QA ทวนสอบ',
      OPEN: 'เปิด',
      IN_PROGRESS: 'กำลังดำเนินการ',
      CLOSED: 'ปิดแล้ว',
      CANCELLED: 'ยกเลิก'
    },
    severity: {
      LOW: 'ต่ำ',
      MEDIUM: 'ปานกลาง',
      HIGH: 'สูง',
      CRITICAL: 'วิกฤต'
    },
    wizard: {
      step1: 'แหล่งที่มาและการตรวจพบ',
      step2: 'รายละเอียดปัญหา',
      step3: 'การแก้ไขเบื้องต้น',
      step4: 'ผลกระทบและความรุนแรง',
      step5: 'เอกสาร/มาตรฐานที่เกี่ยวข้อง',
      step6: 'ทบทวนและส่ง',
      next: 'ถัดไป',
      back: 'ย้อนกลับ',
      saveDraft: 'บันทึกแบบร่าง',
      submit: 'ส่ง NC',
      cancel: 'ยกเลิก',
      sourceType: 'แหล่งที่มา NC',
      detectedDate: 'วันที่ตรวจพบ',
      department: 'แผนกที่พบปัญหา',
      title: 'หัวข้อปัญหา',
      description: 'รายละเอียดปัญหา',
      immediateCorrection: 'การแก้ไขเบื้องต้น',
      containmentAction: 'การกักกัน',
      containmentNotRequired: 'ไม่จำเป็นต้องมีการกักกัน',
      containmentReason: 'เหตุผลที่ไม่กักกัน',
      foodSafetyImpact: 'กระทบความปลอดภัยอาหาร',
      customerImpact: 'กระทบลูกค้า',
      regulatoryImpact: 'กระทบกฎหมาย',
      validationError: 'โปรดกรอกข้อมูลให้ครบถ้วนก่อนดำเนินการต่อ'
    },
    screening: {
      title: 'การคัดกรองโดย QA/QC',
      accept: 'ยอมรับ (เป็น NC)',
      return: 'ตีกลับขอข้อมูลเพิ่ม',
      reject: 'ปฏิเสธ (ไม่ใช่ NC)',
      capaDecision: 'การตัดสินใจ CAPA',
      capaRequired: 'ต้องการ CAPA (วิเคราะห์รากปัญหา)',
      correctionOnly: 'การแก้ไขเบื้องต้นเพียงพอแล้ว',
      comment: 'ความคิดเห็น',
      returnReason: 'เหตุผลที่ตีกลับ',
      missingInfo: 'ข้อมูลที่ต้องการเพิ่ม',
      rejectReason: 'เหตุผลที่ปฏิเสธ',
      assignDept: 'มอบหมายแผนกรับผิดชอบ',
      assignOwner: 'มอบหมายผู้รับผิดชอบหลัก'
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
      SUBMITTED: 'Submitted',
      SCREENING: 'Screening',
      RETURNED_FOR_INFO: 'Returned for Info',
      REJECTED_NOT_NC: 'Rejected (Not NC)',
      ASSIGNED: 'Assigned',
      ROOT_CAUSE_IN_PROGRESS: 'Root Cause In Progress',
      QA_VERIFICATION: 'QA Verification Pending',
      OPEN: 'Open',
      IN_PROGRESS: 'In Progress',
      CLOSED: 'Closed',
      CANCELLED: 'Cancelled'
    },
    severity: {
      LOW: 'Low',
      MEDIUM: 'Medium',
      HIGH: 'High',
      CRITICAL: 'Critical'
    },
    wizard: {
      step1: 'Source and Detection',
      step2: 'Problem Description',
      step3: 'Immediate Correction',
      step4: 'Impact and Severity',
      step5: 'Related Docs/Standards',
      step6: 'Review & Submit',
      next: 'Next',
      back: 'Back',
      saveDraft: 'Save Draft',
      submit: 'Submit NC',
      cancel: 'Cancel',
      sourceType: 'NC Source',
      detectedDate: 'Detected Date',
      department: 'Department',
      title: 'Problem Title',
      description: 'Description',
      immediateCorrection: 'Immediate Correction',
      containmentAction: 'Containment Action',
      containmentNotRequired: 'Containment Not Required',
      containmentReason: 'Reason (if not required)',
      foodSafetyImpact: 'Food Safety Impact',
      customerImpact: 'Customer Impact',
      regulatoryImpact: 'Regulatory Impact',
      validationError: 'Please complete required fields before continuing.'
    },
    screening: {
      title: 'QA/QC Screening',
      accept: 'Accept (Is NC)',
      return: 'Return for Info',
      reject: 'Reject (Not NC)',
      capaDecision: 'CAPA Decision',
      capaRequired: 'CAPA Required (RCA)',
      correctionOnly: 'Correction Only is sufficient',
      comment: 'Comment',
      returnReason: 'Return Reason',
      missingInfo: 'Missing Information',
      rejectReason: 'Rejection Reason',
      assignDept: 'Assign Department',
      assignOwner: 'Assign Owner'
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
