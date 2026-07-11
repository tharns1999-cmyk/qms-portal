import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, CheckSquare, FileText, Activity, History, ShieldAlert, CheckCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import useStore from '../../store/useStore';
import { getDueStateLabel, getReviewStatusLabel } from '../../services/PeriodicReviewService';

const PeriodicReviewDetail = () => {
  const { reviewId } = useParams();
  const navigate = useNavigate();
  const { periodicReviewSchedules, periodicReviewRecords, currentUser, submitPeriodicReview } = useStore();
  
  const [activeTab, setActiveTab] = useState('checklist');
  const [outcome, setOutcome] = useState('');
  const [comment, setComment] = useState('');
  const [checklistAnswers, setChecklistAnswers] = useState({});
  const [checklistRemarks, setChecklistRemarks] = useState({});

  const schedule = periodicReviewSchedules?.find(s => s.id === reviewId);
  const records = periodicReviewRecords?.filter(r => r.scheduleId === reviewId) || [];
  
  if (!schedule) {
    return (
      <div className="p-8 text-center text-slate-500">
        <h2 className="text-xl font-bold">Schedule Not Found</h2>
        <button onClick={() => navigate('/periodic-reviews')} className="text-indigo-600 hover:underline mt-4">กลับไปหน้า Dashboard</button>
      </div>
    );
  }

  // Restricted State Check (Mocking confidential docs check for now)
  // For now we assume if it's external or internal, owner department can access it, or DCC Admin
  const isAdmin = currentUser.id === 'u5' || currentUser.isDcc || currentUser.role === 'DCC_ADMIN';
  const canAccess = isAdmin || currentUser.department === schedule.ownerDepartmentId || currentUser.id === schedule.ownerUserId;
  
  if (!canAccess) {
    return (
      <div className="p-12 max-w-3xl mx-auto text-center mt-12 bg-white rounded-2xl border border-red-200 shadow-sm">
        <ShieldAlert className="mx-auto w-16 h-16 text-red-500 mb-4" />
        <h2 className="text-2xl font-bold text-slate-800 mb-2">Restricted Access</h2>
        <p className="text-slate-500 mb-6">คุณไม่มีสิทธิ์เข้าถึงการทบทวนเอกสารฉบับนี้ เนื่องจากเป็นเอกสารความลับเฉพาะแผนก</p>
        <button onClick={() => navigate(-1)} className="px-6 py-2 bg-slate-800 text-white rounded-xl hover:bg-slate-700 transition-colors">
          กลับหน้าที่แล้ว
        </button>
      </div>
    );
  }

  const isInternal = schedule.documentCategory === 'INTERNAL';
  const isCompleted = schedule.status.startsWith('COMPLETED') || schedule.status === 'ACTION_IN_PROGRESS';
  const dueLabel = getDueStateLabel(schedule.dueState);
  const statusLabel = getReviewStatusLabel(schedule.status);

  // Link to DAR Flow
  const handleLinkedAction = (actionType) => {
    // E.g., redirect to /dar/new/revision with state prefilled
    toast.success(`Redirecting to create DAR: ${actionType}`);
    navigate(actionType === 'REVISION' ? '/dar/new/revision' : '/dar/new/obsolete', { state: { prefillDocId: schedule.documentId, prefillReviewId: schedule.id } });
  };

  const handleSubmit = () => {
    if (!outcome) {
      toast.error('กรุณาเลือกผลการทบทวน');
      return;
    }
    if (comment.length < 10) {
      toast.error('กรุณาระบุความคิดเห็นอย่างน้อย 10 ตัวอักษร');
      return;
    }
    
    // Validation for Checklist
    const allAnswered = checklistItems.every(item => checklistAnswers[item.id]);
    const hasNoWithoutRemark = checklistItems.some(item => checklistAnswers[item.id] === 'no' && (!checklistRemarks[item.id] || checklistRemarks[item.id].trim() === ''));

    if (!allAnswered) {
      toast.error('กรุณาตอบคำถามให้ครบทุกข้อ (Please answer all checklist items)');
      return;
    }

    if (hasNoWithoutRemark) {
      toast.error('กรุณาระบุเหตุผลสำหรับข้อที่ตอบ "ไม่ใช่" (Please provide remarks for "No" answers)');
      return;
    }

    submitPeriodicReview(schedule.id, outcome, comment);
    toast.success('บันทึกผลการทบทวนเรียบร้อยแล้ว');
    
    if (outcome.includes('REVISION_REQUIRED')) {
      handleLinkedAction('REVISION');
    } else if (outcome.includes('OBSOLETE_REQUIRED')) {
      handleLinkedAction('OBSOLETE');
    } else if (outcome.includes('NEW_VERSION')) {
      // Custom redirect for external action
      navigate('/external-docs', { state: { action: 'UPDATE_VERSION', docId: schedule.externalDocumentId }});
    } else {
      navigate('/periodic-reviews/my-tasks');
    }
  };

  const checklistItems = [
    { id: 'c1', text: 'เอกสารนี้ยังมีความจำเป็นและมีการใช้งานในแผนก/บริษัทอยู่' },
    { id: 'c2', text: 'ขั้นตอนการปฏิบัติงาน ค่าพารามิเตอร์ และเครื่องจักรที่ระบุ ตรงกับการทำงานจริงในไลน์ผลิตปัจจุบัน' },
    { id: 'c3', text: 'เนื้อหาอัปเดตและสอดคล้องกับข้อกำหนดมาตรฐานระบบคุณภาพ หรือกฎหมายที่เกี่ยวข้องล่าสุด' },
    { id: 'c4', text: 'แบบฟอร์มบันทึกการปฏิบัติงาน (เช่น แบบฟอร์ม FM) ที่อ้างอิงในเอกสาร เป็นเวอร์ชันล่าสุดที่ประกาศใช้ทั้งหมด' },
    { id: 'c5', text: 'ชื่อตำแหน่งหรือแผนกผู้รับผิดชอบที่ระบุ ตรงกับโครงสร้างองค์กรในปัจจุบัน' }
  ];

  const TabButton = ({ id, icon: Icon, label }) => (
    <button
      onClick={() => setActiveTab(id)}
      className={`px-4 py-3 flex items-center gap-2 text-sm font-medium transition-all relative ${
        activeTab === id ? 'text-indigo-600' : 'text-slate-500 hover:text-slate-800'
      }`}
    >
      <Icon size={18} />
      {label}
      {activeTab === id && (
        <motion.div layoutId="detail-tab-indicator" className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-600" />
      )}
    </button>
  );

  return (
    <div className="p-8 max-w-5xl mx-auto">
      <button 
        onClick={() => navigate(-1)}
        className="flex items-center gap-2 text-slate-500 hover:text-slate-800 transition-colors mb-6 font-medium text-sm"
      >
        <ArrowLeft size={16} /> กลับ
      </button>

      {/* Header Info */}
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200 mb-6 relative overflow-hidden">
        <div className="absolute top-0 right-0 p-6 flex flex-col items-end gap-2">
           <span className={`px-3 py-1 rounded-full text-xs font-semibold ${dueLabel.color}`}>
             {dueLabel.label}
           </span>
           <span className={`px-3 py-1 rounded-full text-xs font-semibold ${statusLabel.color}`}>
             {statusLabel.label}
           </span>
        </div>

        <div className="flex items-center gap-4 mb-4">
          <div className={`p-4 rounded-xl ${isInternal ? 'bg-indigo-100 text-indigo-600' : 'bg-emerald-100 text-emerald-600'}`}>
            <FileText size={32} />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-800 tracking-tight">{schedule.documentNumber}</h1>
            <p className="text-slate-500 mt-1">{schedule.documentName}</p>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6 pt-6 border-t border-slate-100">
          <div>
            <p className="text-xs text-slate-400 font-medium uppercase tracking-wider mb-1">ประเภทเอกสาร</p>
            <p className="text-sm font-semibold text-slate-700">{isInternal ? 'เอกสารภายใน' : 'เอกสารภายนอก'}</p>
          </div>
          <div>
            <p className="text-xs text-slate-400 font-medium uppercase tracking-wider mb-1">ความถี่ในการทบทวน</p>
            <p className="text-sm font-semibold text-slate-700">ทุก {schedule.frequencyMonths / 12} ปี</p>
          </div>
          <div>
            <p className="text-xs text-slate-400 font-medium uppercase tracking-wider mb-1">รอบทบทวนปัจจุบัน</p>
            <p className="text-sm font-semibold text-slate-700">{schedule.currentScheduledReviewDate}</p>
          </div>
          <div>
            <p className="text-xs text-slate-400 font-medium uppercase tracking-wider mb-1">ผู้รับผิดชอบ</p>
            <p className="text-sm font-semibold text-slate-700">แผนก {schedule.ownerDepartmentId}</p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden flex flex-col min-h-[500px]">
        <div className="flex border-b border-slate-200 bg-slate-50/50 px-2 overflow-x-auto custom-scrollbar">
          <TabButton id="checklist" icon={CheckSquare} label="การทบทวน (Review)" />
          <TabButton id="history" icon={History} label="ประวัติการทบทวน (History)" />
        </div>

        <div className="p-6 flex-1 bg-white overflow-y-auto">
          <AnimatePresence mode="wait">
            {activeTab === 'checklist' && (
              <motion.div
                key="checklist"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="max-w-3xl"
              >
                {!isCompleted ? (
                  <>
                    <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
                      <CheckCircle className="text-indigo-500" size={20} />
                      รายการตรวจสอบ (Checklist)
                    </h3>
                    
                    <div className="space-y-4 mb-8">
                      {checklistItems.map((item) => (
                        <div key={item.id} className="p-5 rounded-lg border border-zinc-200 bg-white transition-shadow hover:shadow-sm">
                          <p className="text-zinc-800 font-medium mb-4">{item.text}</p>
                          <div className="flex items-center gap-6">
                            <label className="flex items-center gap-2 cursor-pointer group">
                              <input 
                                type="radio" 
                                name={`check-${item.id}`}
                                value="yes"
                                checked={checklistAnswers[item.id] === 'yes'}
                                onChange={() => setChecklistAnswers(prev => ({ ...prev, [item.id]: 'yes' }))}
                                className="w-4 h-4 accent-zinc-900 cursor-pointer"
                              />
                              <span className="text-sm text-zinc-600 font-medium group-hover:text-zinc-900 transition-colors">ใช่ / Yes</span>
                            </label>
                            <label className="flex items-center gap-2 cursor-pointer group">
                              <input 
                                type="radio" 
                                name={`check-${item.id}`}
                                value="no"
                                checked={checklistAnswers[item.id] === 'no'}
                                onChange={() => setChecklistAnswers(prev => ({ ...prev, [item.id]: 'no' }))}
                                className="w-4 h-4 accent-zinc-900 cursor-pointer"
                              />
                              <span className="text-sm text-zinc-600 font-medium group-hover:text-zinc-900 transition-colors">ไม่ใช่ / No</span>
                            </label>
                          </div>
                          
                          <AnimatePresence>
                            {checklistAnswers[item.id] === 'no' && (
                              <motion.div
                                initial={{ height: 0, opacity: 0, marginTop: 0 }}
                                animate={{ height: 'auto', opacity: 1, marginTop: 16 }}
                                exit={{ height: 0, opacity: 0, marginTop: 0 }}
                                transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                                className="overflow-hidden"
                              >
                                <textarea
                                  placeholder="ระบุเหตุผล/ข้อเสนอแนะ (Remark)..."
                                  value={checklistRemarks[item.id] || ''}
                                  onChange={(e) => setChecklistRemarks(prev => ({ ...prev, [item.id]: e.target.value }))}
                                  className="w-full p-3 border border-zinc-200 rounded-md focus:ring-1 focus:ring-zinc-900 focus:border-zinc-900 outline-none transition-all resize-none text-sm bg-zinc-50/50"
                                  rows={2}
                                />
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>
                      ))}
                    </div>

                    <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
                      <Activity className="text-indigo-500" size={20} />
                      ผลการทบทวน (Outcome)
                    </h3>

                    <div className="space-y-4 mb-6">
                      <select 
                        value={outcome}
                        onChange={e => setOutcome(e.target.value)}
                        className="w-full p-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all shadow-sm bg-white"
                      >
                        <option value="">-- เลือกผลการทบทวน --</option>
                        {isInternal ? (
                          <>
                            <option value="INTERNAL_NO_CHANGE">ไม่มีการเปลี่ยนแปลง (ใช้งานต่อได้เลย)</option>
                            <option value="INTERNAL_REVISION_REQUIRED">ต้องการแก้ไขเอกสาร (Revision Required)</option>
                            <option value="INTERNAL_OBSOLETE_REQUIRED">ขอยกเลิกเอกสาร (Obsolete Required)</option>
                          </>
                        ) : (
                          <>
                            <option value="EXTERNAL_CONFIRM_CURRENT">เอกสารยังเป็นเวอร์ชันปัจจุบัน (Confirm Current)</option>
                            <option value="EXTERNAL_NEW_VERSION">มีเวอร์ชันใหม่/อัปเดต (New Version Detected)</option>
                            <option value="EXTERNAL_NO_LONGER_APPLICABLE">ไม่ต้องการใช้งานแล้ว (No Longer Applicable)</option>
                          </>
                        )}
                      </select>

                      <textarea 
                        value={comment}
                        onChange={e => setComment(e.target.value)}
                        placeholder="ระบุความคิดเห็น/เหตุผล (บังคับอย่างน้อย 10 ตัวอักษร)..."
                        className="w-full p-4 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all shadow-sm resize-none h-32"
                      />
                    </div>

                    <div className="flex justify-end gap-3 pt-6 border-t border-slate-100">
                      <button 
                        onClick={() => navigate(-1)}
                        className="px-6 py-2.5 bg-white border border-slate-300 rounded-xl text-slate-700 font-medium hover:bg-slate-50 transition-colors shadow-sm"
                      >
                        ยกเลิก
                      </button>
                      <button 
                        onClick={handleSubmit}
                        className="px-6 py-2.5 bg-indigo-600 text-white rounded-xl font-medium hover:bg-indigo-700 transition-colors shadow-sm flex items-center gap-2"
                      >
                        <CheckCircle size={18} />
                        บันทึกผลการทบทวน
                      </button>
                    </div>
                  </>
                ) : (
                  <div className="py-8 text-center flex flex-col items-center">
                    <CheckCircle className="w-16 h-16 text-emerald-500 mb-4" />
                    <h2 className="text-xl font-bold text-slate-800 mb-2">การทบทวนรอบนี้เสร็จสิ้นแล้ว</h2>
                    <p className="text-slate-500 mb-6">ผลการทบทวน: <span className="font-semibold text-slate-700">{statusLabel.label}</span></p>
                    
                    {schedule.status === 'ACTION_IN_PROGRESS' && (
                      <div className="p-4 bg-blue-50 border border-blue-200 rounded-xl text-blue-800 max-w-lg mb-6 flex items-start gap-3 text-left">
                        <Activity className="shrink-0 mt-0.5" size={20} />
                        <div>
                          <p className="font-bold mb-1">อยู่ระหว่างดำเนินการต่อเนื่อง</p>
                          <p className="text-sm">มีการร้องขอให้แก้ไขหรือยกเลิกเอกสารจากผลการทบทวนนี้ โปรดตรวจสอบในระบบ DAR หรือระบบแจ้งเอกสารภายนอก</p>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </motion.div>
            )}

            {activeTab === 'history' && (
              <motion.div
                key="history"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
              >
                 {records.length > 0 ? (
                   <div className="space-y-4">
                     {records.map(record => (
                       <div key={record.id} className="p-4 rounded-xl border border-slate-200 bg-slate-50">
                         <div className="flex justify-between items-start mb-2">
                           <div>
                             <span className="font-bold text-slate-800">{record.outcome}</span>
                             <p className="text-sm text-slate-500 mt-1">Reviewed by: User ID {record.reviewedByUserId}</p>
                           </div>
                           <span className="text-xs text-slate-400 font-medium">{new Date(record.reviewedAt).toLocaleString()}</span>
                         </div>
                         <div className="p-3 bg-white rounded-lg border border-slate-100 text-sm text-slate-600 italic">
                           "{record.comment}"
                         </div>
                       </div>
                     ))}
                   </div>
                 ) : (
                   <div className="py-12 text-center text-slate-500">
                     <History className="mx-auto h-12 w-12 text-slate-300 mb-3" />
                     <p>ยังไม่มีประวัติการทบทวนสำหรับรอบนี้</p>
                   </div>
                 )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};

export default PeriodicReviewDetail;
