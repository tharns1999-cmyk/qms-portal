import React, { useState } from 'react';
import { X, Check, XCircle, FileText } from 'lucide-react';
import useStore from '../../store/useStore';
import { motion } from 'framer-motion';
import ExternalDocPreviewModal from '../ExternalDocs/ExternalDocPreviewModal';
import ActionConfirmModal from '../../components/common/ActionConfirmModal';

const ExternalDocActionModal = ({ task, onClose }) => {
  const { externalDocuments, processExternalTask } = useStore();
  const [comment, setComment] = useState('');
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [pendingAction, setPendingAction] = useState(null);
  
  // Find the external document for this task
  const doc = externalDocuments.find(d => d.id === task.referenceId);
  
  if (!doc) {
    return null; // or render some error state
  }

  const handleAction = (action) => {
    setPendingAction(action);
    setShowConfirm(true);
  };

  const executeAction = () => {
    processExternalTask(task.id, pendingAction, comment);
    setShowConfirm(false);
    onClose();
  };

  const getActionTitle = () => {
    if (task.type === 'EXT_REVIEW') return 'ตรวจสอบเอกสารภายนอก';
    if (task.type === 'EXT_APPROVAL') return 'อนุมัติเอกสารภายนอก';
    if (task.type === 'Ack') return 'รับทราบเอกสารภายนอก';
    return 'จัดการเอกสารภายนอก';
  };

  const extActionMapping = {
    'UPDATE': 'อัปเดตเอกสาร',
    'OBSOLETE': 'ยกเลิกเอกสาร',
    'REGISTER': 'ขึ้นทะเบียนใหม่'
  };
  const actionLabel = task.extAction ? extActionMapping[task.extAction] || task.extAction : 'ขึ้นทะเบียนใหม่';

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6">
      {/* Backdrop */}
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="absolute inset-0 bg-slate-900/40"
        onClick={onClose}
      />

      {/* Modal Content - Premium iOS style */}
      <motion.div 
        initial={{ scale: 0.95, opacity: 0, y: 10 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.95, opacity: 0, y: 10 }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
        className="relative w-full max-w-2xl bg-white border border-gray-200 rounded-3xl p-6 sm:p-8"
      >
        
        {/* Header */}
        <div className="flex justify-between items-start mb-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-indigo-100 text-indigo-600  flex items-center justify-center shadow-inner">
              <FileText size={28} strokeWidth={1.25}/>
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-800 ">{getActionTitle()}</h2>
              <p className="text-sm text-gray-500  font-medium">Ref No: {doc.id} <span className="text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full ml-2">{actionLabel}</span></p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-2 text-gray-400  hover:text-gray-600  hover:bg-gray-100 rounded-xl transition-colors"
          >
            <X size={24} strokeWidth={1.25}/>
          </button>
        </div>

        {/* Document Info */}
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 mb-6 space-y-4">
          <div>
            <span className="text-xs font-bold text-gray-400  uppercase tracking-wider">ชื่อเอกสาร / Document Name</span>
            <p className="text-gray-800  font-medium mt-1">{doc.title}</p>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <span className="text-xs font-bold text-gray-400  uppercase tracking-wider">หมวดหมู่ / Category</span>
              <p className="text-gray-800  font-medium mt-1">{doc.category}</p>
            </div>
            <div>
              <span className="text-xs font-bold text-gray-400  uppercase tracking-wider">ระดับความลับ / Confidentiality</span>
              <p className={`text-sm font-medium mt-1 ${doc.confidentiality === 'CONFIDENTIAL' ? 'text-red-600 ' : 'text-blue-600 '}`}>
                {doc.confidentiality}
              </p>
            </div>
          </div>
          
          {doc.link && (
            <div>
              <span className="text-xs font-bold text-gray-400  uppercase tracking-wider">ลิงก์แนบ / Attachment Link</span>
              <a href={doc.link} target="_blank" rel="noreferrer" className="block mt-1 text-blue-600  hover:underline truncate">
                {doc.link}
              </a>
            </div>
          )}

          {doc.obsoleteReason && task.extAction === 'OBSOLETE' && (
            <div className="bg-amber-50 p-3 rounded-xl border border-amber-100">
              <span className="text-xs font-bold text-amber-700 uppercase tracking-wider">เหตุผลที่ขอยกเลิก (Obsolete Reason)</span>
              <p className="text-amber-900 mt-1 text-sm">{doc.obsoleteReason}</p>
            </div>
          )}
          
          <div className="pt-2">
            <button
              onClick={() => setIsPreviewOpen(true)}
              className="flex items-center gap-2 px-4 py-2 bg-indigo-50 text-indigo-600 hover:bg-indigo-100 rounded-lg font-medium transition-colors w-full justify-center"
            >
              <FileText size={20} strokeWidth={1.25}/> ดูพรีวิวเอกสาร (Preview PDF)
            </button>
          </div>
        </div>

        {/* Comment Field (not required for Ack) */}
        {task.type !== 'Ack' && (
          <div className="mb-8">
            <label className="block text-sm font-bold text-gray-700  mb-2 ml-1">ความคิดเห็น / Comment (Optional)</label>
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="ระบุความคิดเห็นของคุณที่นี่..."
              className="w-full px-4 py-3 bg-white border-2 border-gray-100 rounded-2xl focus:border-indigo-300 focus:ring-4 focus:ring-indigo-100 transition-all outline-none resize-none text-gray-700 "
              rows={3}
            />
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-200/60">
          <button
            onClick={onClose}
            className="flex items-center gap-2 px-6 py-2.5 rounded-xl font-bold text-gray-500 hover:bg-gray-100 transition-colors"
          >
            <X size={20} strokeWidth={1.25}/> ยกเลิก (Cancel)
          </button>
          
          {task.type === 'Ack' ? (
            <button
              onClick={() => handleAction('APPROVE')} // internally maps to ACKNOWLEDGE if handled properly, or we pass ACKNOWLEDGE directly. Wait, in processExternalTask we use action === 'APPROVE' for Ack but let's pass 'APPROVE' and processExternalTask handles Ack under APPROVE.
              className="flex items-center gap-2 px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold transition-transform duration-300 ease-out active:scale-95 border border-transparent"
            >
              <Check size={20} strokeWidth={1.25}/> รับทราบ (Acknowledge)
            </button>
          ) : (
            <>
              <button
                onClick={() => handleAction('REJECT')}
                className="flex items-center gap-2 px-6 py-2.5 bg-rose-50 text-rose-600 hover:bg-rose-100 rounded-xl font-bold transition-transform duration-300 ease-out active:scale-95 border border-transparent"
              >
                <XCircle size={20} strokeWidth={1.25}/> ส่งกลับ (Reject)
              </button>
              <button
                onClick={() => handleAction('APPROVE')}
                className="flex items-center gap-2 px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold transition-transform duration-300 ease-out active:scale-95 border border-transparent"
              >
                <Check size={20} strokeWidth={1.25}/> อนุมัติ (Approve)
              </button>
            </>
          )}
        </div>
      </motion.div>

      <ExternalDocPreviewModal
        isOpen={isPreviewOpen}
        onClose={() => setIsPreviewOpen(false)}
        document={doc}
      />

      <ActionConfirmModal
        isOpen={showConfirm}
        onClose={() => setShowConfirm(false)}
        onConfirm={executeAction}
        title={pendingAction === 'APPROVE' ? (task.type === 'Ack' ? 'Confirm Acknowledge' : 'Confirm Approval') : 'Confirm Rejection'}
        actionType={pendingAction === 'APPROVE' ? 'approve' : 'reject'}
        summaryData={[
          { label: 'Document Title', value: doc.title },
          { label: 'Category', value: doc.category },
          { label: 'Remarks', value: comment || '-' },
          { label: 'Action', value: pendingAction === 'APPROVE' ? (task.type === 'Ack' ? 'Acknowledge' : 'Approve') : 'Reject' }
        ]}
      />
    </div>
  );
};

export default ExternalDocActionModal;
