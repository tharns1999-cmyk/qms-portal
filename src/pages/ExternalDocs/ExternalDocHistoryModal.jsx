import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, FileText, Clock, User, Info, CheckCircle, ShieldAlert, FileMinus } from 'lucide-react';
import useStore from '../../store/useStore';
import dayjs from 'dayjs';

const ExternalDocHistoryModal = ({ isOpen, onClose, document }) => {
  const { externalAuditTrail } = useStore();

  if (!isOpen || !document) return null;

  const docHistory = externalAuditTrail
    .filter(log => log.docId === document.id || log.docTitle === document.title)
    .sort((a, b) => new Date(b.date) - new Date(a.date));

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
          onClick={onClose}
        />
        
        <motion.div 
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          className="relative w-full max-w-4xl bg-white rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/50">
            <div>
              <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                <FileText className="w-5 h-5 text-indigo-500" />
                ประวัติเอกสารภายนอก (External Document History)
              </h3>
              <p className="text-sm text-slate-500 mt-0.5">
                {document.id} - {document.title}
              </p>
            </div>
            <button 
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-200/50 rounded-xl transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-6 space-y-8">
            {/* Document Info Summary */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
                <div className="flex items-center gap-2 text-sm font-medium text-slate-500 mb-1">
                  <Info className="w-4 h-4" /> ชื่อเอกสาร / Title
                </div>
                <div className="text-slate-800 font-medium">{document.title}</div>
              </div>
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
                <div className="flex items-center gap-2 text-sm font-medium text-slate-500 mb-1">
                  <CheckCircle className="w-4 h-4" /> สถานะ / Status
                </div>
                <div className="text-slate-800 font-medium">{document.status}</div>
              </div>
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
                <div className="flex items-center gap-2 text-sm font-medium text-slate-500 mb-1">
                  <Clock className="w-4 h-4" /> Revision
                </div>
                <div className="text-slate-800 font-medium">{document.rev || '00'}</div>
              </div>
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
                <div className="flex items-center gap-2 text-sm font-medium text-slate-500 mb-1">
                  <ShieldAlert className="w-4 h-4" /> ระดับความลับ / Access Scope
                </div>
                <div className="text-slate-800 font-medium">{document.accessScope}</div>
              </div>
            </div>

            {/* History Timeline */}
            <div>
              <h4 className="text-base font-bold text-slate-800 flex items-center gap-2 mb-4">
                <Clock className="w-5 h-5 text-blue-500" />
                ประวัติการดำเนินการ (Audit Trail)
              </h4>
              
              <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm text-slate-600">
                    <thead className="bg-slate-50 text-slate-500 uppercase border-b border-slate-200">
                      <tr>
                        <th className="px-4 py-3 font-medium">วันที่ / Date</th>
                        <th className="px-4 py-3 font-medium">การกระทำ / Action</th>
                        <th className="px-4 py-3 font-medium">ผู้ดำเนินการ / Actor</th>
                        <th className="px-4 py-3 font-medium">รายละเอียด / Details</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {docHistory.map((log) => (
                        <tr key={log.id} className="hover:bg-slate-50/50 transition-colors">
                          <td className="px-4 py-3 whitespace-nowrap">
                            {dayjs(log.date).format('DD/MM/YYYY HH:mm')}
                          </td>
                          <td className="px-4 py-3 font-medium">
                            <span className="px-2.5 py-1 bg-slate-100 text-slate-700 rounded-full text-xs">
                              {log.action}
                            </span>
                          </td>
                          <td className="px-4 py-3 flex items-center gap-2">
                            <User className="w-3.5 h-3.5 text-slate-400" />
                            {log.actor}
                          </td>
                          <td className="px-4 py-3 text-slate-500 text-xs">
                            {log.details}
                          </td>
                        </tr>
                      ))}
                      {docHistory.length === 0 && (
                        <tr>
                          <td colSpan="4" className="px-4 py-8 text-center text-slate-500">
                            <FileMinus className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                            <p>ยังไม่มีประวัติการดำเนินการ</p>
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default ExternalDocHistoryModal;
