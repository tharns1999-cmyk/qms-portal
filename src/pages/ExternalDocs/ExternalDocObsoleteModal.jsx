import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Save, AlertTriangle } from 'lucide-react';
import useStore from '../../store/useStore';
import toast from 'react-hot-toast';
import UserSelector from '../../components/UserSelector';

const ExternalDocObsoleteModal = ({ isOpen, onClose, documentToObsolete }) => {
  const { masterUsers, obsoleteExternalDoc } = useStore();
  const [formData, setFormData] = useState({
    reason: '',
    reviewerId: '',
    approverId: ''
  });

  if (!isOpen || !documentToObsolete) return null;

  const eligibleReviewers = masterUsers.filter(u => u.role !== 'DCC_ADMIN' && !u.isDcc && u.id !== 'U001');

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.reason || !formData.reviewerId || !formData.approverId) {
      toast.error('กรุณาระบุข้อมูลให้ครบถ้วน');
      return;
    }

    obsoleteExternalDoc(documentToObsolete.id, {
      reason: formData.reason,
      reviewerId: formData.reviewerId,
      approverId: formData.approverId
    });
    
    toast.success('ส่งคำขอยกเลิกเอกสารเรียบร้อยแล้ว');
    onClose();
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
        <motion.div 
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
          onClick={onClose}
        />
        <motion.div 
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="relative w-full max-w-lg bg-white  rounded-2xl shadow-xl overflow-hidden"
        >
          {/* Header */}
          <div className="px-6 py-4 border-b border-slate-100  bg-slate-50/50  flex items-center justify-between">
            <div className="flex items-center gap-2 text-amber-600 ">
              <AlertTriangle className="w-5 h-5" />
              <h2 className="text-lg font-bold">ขอยกเลิกเอกสารภายนอก (Obsolete)</h2>
            </div>
            <button onClick={onClose} className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100  rounded-full transition-colors">
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Body */}
          <div className="p-6 overflow-y-auto max-h-[60vh]">
            <form id="obsolete-doc-form" onSubmit={handleSubmit} className="space-y-5">
              
              <div className="bg-amber-50  border border-amber-200  rounded-xl p-4 mb-4">
                <p className="text-sm text-amber-800 ">
                  คุณกำลังทำเรื่องขอยกเลิกเอกสาร <strong>{documentToObsolete.title}</strong> การดำเนินการนี้ต้องผ่านการ Review และ Approve
                </p>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700  mb-1">เหตุผลในการยกเลิก (Reason) <span className="text-red-500">*</span></label>
                <textarea
                  value={formData.reason}
                  onChange={(e) => handleChange('reason', e.target.value)}
                  className="input-ios w-full h-24 resize-none"
                  placeholder="ระบุเหตุผลที่ขอยกเลิกเอกสารฉบับนี้..."
                />
              </div>

              <hr className="border-gray-100 my-2" />
              <h3 className="font-bold text-gray-800 ">ผู้รับผิดชอบตามข้อกำหนดภายนอก (External Rules)</h3>

              <div>
                <label className="block text-sm font-semibold text-gray-700  mb-1">External Reviewer (ห้ามเป็น DCC Admin) <span className="text-red-500">*</span></label>
                <UserSelector 
                  value={formData.reviewerId}
                  onChange={val => handleChange('reviewerId', val)}
                  users={eligibleReviewers}
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700  mb-1">External Approver <span className="text-red-500">*</span></label>
                <UserSelector 
                  value={formData.approverId}
                  onChange={val => handleChange('approverId', val)}
                  users={masterUsers}
                />
              </div>

            </form>
          </div>

          {/* Footer */}
          <div className="px-6 py-4 border-t border-slate-200/50 bg-slate-50/50 flex justify-end gap-3">
            <button 
              type="button"
              onClick={onClose}
              className="px-5 py-2 btn-ios-secondary text-gray-500"
            >
              ยกเลิก
            </button>
            <button 
              type="submit"
              form="obsolete-doc-form"
              className="px-5 py-2 rounded-xl text-white font-medium bg-amber-500 hover:bg-amber-600 transition-all duration-300 ease-fluid active:scale-95 flex items-center gap-2"
            >
              <Save className="w-4 h-4" />
              ขอยกเลิกเอกสาร
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default ExternalDocObsoleteModal;
