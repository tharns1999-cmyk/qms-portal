import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, AlertTriangle, FileText, CheckCircle2 } from 'lucide-react';
import toast from 'react-hot-toast';

const ReplacementModal = ({ isOpen, onClose, instance, documentId }) => {
  const [reasonType, setReasonType] = useState('DAMAGED');
  const [reasonText, setReasonText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen || !instance) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (reasonType === 'LOST' && !reasonText) {
      toast.error('กรุณาระบุรายละเอียดการสูญหาย');
      return;
    }

    setIsSubmitting(true);
    try {
      // Simulate network delay
      await new Promise(resolve => setTimeout(resolve, 800));
      
      onClose(true, reasonType, reasonText); // pass to parent to call store
    } catch (error) {
      toast.error('เกิดข้อผิดพลาดในการทำรายการ');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-slate-900/40"
            onClick={() => !isSubmitting && onClose()}
          />
          
          <motion.div 
            initial={{ scale: 0.95, opacity: 0, y: 10 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: 10 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className="relative bg-white w-full max-w-lg overflow-hidden flex flex-col p-0 border-none rounded-3xl"
          >
            <div className="px-6 py-4 border-b border-red-100 bg-red-50/50 flex justify-between items-center">
              <div className="flex items-center gap-2 text-red-700 ">
                <AlertTriangle className="w-5 h-5" />
                <h2 className="text-xl font-bold">แจ้งเอกสารชำรุด/สูญหาย</h2>
              </div>
              <button 
                onClick={() => !isSubmitting && onClose()}
                className="text-gray-400  hover:text-gray-600  p-2 rounded-full hover:bg-slate-200/50 transition-all duration-300 ease-out active:scale-95"
                disabled={isSubmitting}
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6">
              <div className="bg-white border border-gray-200 rounded-xl p-4 mb-6 text-sm">
                <p className="text-gray-500  mb-1">เอกสารควบคุม (Controlled Copy)</p>
                <p className="font-bold text-gray-800  text-base">{instance.ccNumber}</p>
                <div className="flex gap-4 mt-2">
                  <div>
                    <span className="text-gray-400  text-xs">แผนก:</span> <span className="font-medium text-gray-700 ">{instance.department}</span>
                  </div>
                  <div>
                    <span className="text-gray-400  text-xs">Issue No:</span> <span className="font-medium text-gray-700 ">{instance.issueNumber}</span>
                  </div>
                </div>
              </div>

              <form id="replacement-form" onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700  mb-2">ประเภทการแจ้ง <span className="text-red-500 ">*</span></label>
                  <div className="grid grid-cols-2 gap-3">
                    <label className={`border rounded-xl p-3 flex flex-col items-center justify-center gap-2 cursor-pointer transition-all ${reasonType === 'DAMAGED' ? 'border-orange-500 bg-orange-50 text-orange-700  ring-1 ring-orange-500' : 'border-gray-200 hover:bg-gray-50 text-gray-600 '}`}>
                      <input type="radio" name="reasonType" value="DAMAGED" className="sr-only    " checked={reasonType === 'DAMAGED'} onChange={() => setReasonType('DAMAGED')} />
                      <FileText className="w-6 h-6" />
                      <span className="font-medium text-sm">เอกสารชำรุด (Damaged)</span>
                    </label>
                    <label className={`border rounded-xl p-3 flex flex-col items-center justify-center gap-2 cursor-pointer transition-all ${reasonType === 'LOST' ? 'border-red-500 bg-red-50 text-red-700  ring-1 ring-red-500' : 'border-gray-200 hover:bg-gray-50 text-gray-600 '}`}>
                      <input type="radio" name="reasonType" value="LOST" className="sr-only    " checked={reasonType === 'LOST'} onChange={() => setReasonType('LOST')} />
                      <AlertTriangle className="w-6 h-6" />
                      <span className="font-medium text-sm">เอกสารสูญหาย (Lost)</span>
                    </label>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700  mb-1">
                    สาเหตุ / รายละเอียดเพิ่มเติม {reasonType === 'LOST' && <span className="text-red-500 ">*</span>}
                  </label>
                  <textarea 
                    rows="3"
                    value={reasonText}
                    onChange={(e) => setReasonText(e.target.value)}
                    className="input-ios w-full px-3 py-2 text-sm"
                    placeholder={reasonType === 'LOST' ? 'ระบุสาเหตุการสูญหาย...' : 'ระบุส่วนที่ชำรุด (ถ้ามี)...'}
                    required={reasonType === 'LOST'}
                  ></textarea>
                </div>
                
                <div className="bg-blue-50 text-blue-800 p-3 rounded-lg text-xs flex gap-2 border border-blue-100">
                  <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
                  <p>เมื่อยืนยัน ระบบจะส่งคำขอไปยังผู้จัดการเพื่ออนุมัติ หลังจากนั้น DCC จะทำการเตรียมเอกสารควบคุมใหม่ภายใต้รหัสเดิม (โดยปรับเพิ่ม Issue No.) ให้ท่านต่อไป</p>
                </div>
              </form>
            </div>

            <div className="px-6 py-4 border-t border-slate-200/50 bg-slate-50/50 flex justify-end gap-3">
              <button 
                type="button"
                onClick={() => onClose()}
                disabled={isSubmitting}
                className="px-5 py-2 btn-ios-secondary text-gray-500"
              >
                <X className="w-4 h-4" /> ยกเลิก
              </button>
              <button 
                type="submit"
                form="replacement-form"
                disabled={isSubmitting}
                className="px-5 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl font-medium transition-transform duration-300 active:scale-95 flex items-center gap-2 disabled:opacity-50 border border-transparent"
              >
                {isSubmitting ? 'กำลังดำเนินการ...' : 'ยืนยันการแจ้ง & ขอฉบับทดแทน'}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default ReplacementModal;
