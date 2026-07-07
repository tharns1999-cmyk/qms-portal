import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import useStore from '../../store/useStore';
import { motion } from 'framer-motion';
import { FilePlus, CheckCircle, XCircle, ArrowLeft } from 'lucide-react';
import toast from 'react-hot-toast';

const TaskApproveCopyRequest = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { tasks, controlledCopyInstances, approveCcReplacement, rejectCcReplacement } = useStore();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showRejectBox, setShowRejectBox] = useState(false);
  const [rejectReason, setRejectReason] = useState('');

  const task = tasks.find(t => t.id === id);
  const instance = task ? controlledCopyInstances.find(i => i.id === task.instanceId) : null;

  if (!task || !instance) {
    return (
      <div className="flex flex-col items-center justify-center h-64">
        <p className="text-gray-500 mb-4">ไม่พบงาน หรือคำขอเบิกสำเนาอาจถูกดำเนินการไปแล้ว</p>
        <button onClick={() => navigate('/tasks')} className="btn-ios-secondary">กลับไปยังกล่องงาน</button>
      </div>
    );
  }

  const handleAction = async (action) => {
    if (action === 'REJECT' && !showRejectBox) {
      setShowRejectBox(true);
      return;
    }
    if (action === 'REJECT' && !rejectReason) {
      toast.error('กรุณาระบุเหตุผลในการปฏิเสธ');
      return;
    }

    setIsSubmitting(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 800));
      
      if (action === 'APPROVE') {
        approveCcReplacement(task.id);
      } else {
        rejectCcReplacement(task.id, rejectReason);
      }
      
      toast.success(action === 'APPROVE' ? 'อนุมัติคำขอสำเร็จ' : 'ปฏิเสธคำขอสำเร็จ');
      navigate('/tasks');
    } catch {
      toast.error('เกิดข้อผิดพลาดในการทำรายการ');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-2xl mx-auto space-y-6"
    >
      <div className="flex items-center gap-4 mb-6">
        <button 
          onClick={() => navigate('/tasks')}
          className="p-2 hover:bg-gray-100 rounded-full transition-colors"
        >
          <ArrowLeft className="text-gray-600" size={24} strokeWidth={1.25}/>
        </button>
        <div>
          <h1 className="text-2xl font-bold text-gray-800">อนุมัติคำขอทดแทนเอกสารควบคุม</h1>
          <p className="text-gray-500">พิจารณาคำขอเอกสารชำรุด/สูญหายจากแผนก</p>
        </div>
      </div>

      <div className="premium-card p-6 border-none bg-white">
        <div className="flex items-center gap-3 mb-6 pb-4 border-b border-gray-100">
          <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
            <FilePlus size={28} strokeWidth={1.25}/>
          </div>
          <div>
            <h2 className="text-lg font-bold text-gray-800">{instance.docTitle}</h2>
            <p className="text-gray-500 text-sm">เลขที่เอกสาร: {instance.ccNumber}</p>
          </div>
        </div>

        <div className="space-y-4 text-sm">
          <div className="grid grid-cols-3 gap-4">
            <div className="text-gray-500">ผู้ขอเบิก:</div>
            <div className="col-span-2 font-medium text-gray-800">{instance.reportRequesterName}</div>
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div className="text-gray-500">แผนก:</div>
            <div className="col-span-2 font-medium text-gray-800">{instance.department}</div>
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div className="text-gray-500">ประเภทการแจ้ง:</div>
            <div className="col-span-2 font-medium text-gray-800">
              {instance.reportType === 'DAMAGED' ? 'เอกสารชำรุด (Damaged)' : 'เอกสารสูญหาย (Lost)'}
            </div>
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div className="text-gray-500">เหตุผล / รายละเอียด:</div>
            <div className="col-span-2 font-medium text-gray-800 bg-gray-50 p-3 rounded-lg">{instance.reportReason}</div>
          </div>
        </div>

        {showRejectBox && (
          <div className="mt-6 p-4 bg-red-50 rounded-xl border border-red-100">
            <label className="block text-sm font-semibold text-red-800 mb-2">เหตุผลที่ปฏิเสธ (Reject Reason) *</label>
            <textarea
              className="w-full px-3 py-2 border border-red-200 rounded-lg focus:ring-2 focus:ring-red-500/20 focus:border-red-500 bg-white"
              rows="3"
              placeholder="ระบุเหตุผลที่ปฏิเสธคำขอ..."
              value={rejectReason}
              onChange={e => setRejectReason(e.target.value)}
            />
          </div>
        )}

        <div className="mt-8 pt-6 border-t border-gray-100 flex justify-end gap-3">
          <button 
            onClick={() => handleAction('REJECT')}
            disabled={isSubmitting}
            className="flex items-center gap-2 px-5 py-2.5 bg-red-50 hover:bg-red-100 text-red-600 rounded-xl font-medium transition-colors disabled:opacity-50"
          >
            <XCircle size={20} strokeWidth={1.25}/> ปฏิเสธ (Reject)
          </button>
          <button 
            onClick={() => handleAction('APPROVE')}
            disabled={isSubmitting}
            className="flex items-center gap-2 px-5 py-2.5 bg-green-600 hover:bg-green-700 text-white rounded-xl font-medium transition-transform duration-300 active:scale-95 disabled:opacity-50"
          >
            <CheckCircle size={20} strokeWidth={1.25}/> อนุมัติ (Approve)
          </button>
        </div>
      </div>
    </motion.div>
  );
};

export default TaskApproveCopyRequest;
