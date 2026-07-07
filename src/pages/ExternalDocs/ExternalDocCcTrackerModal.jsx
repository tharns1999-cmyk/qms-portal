import React, { useState, useEffect } from 'react';
import { X, FileText } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import ReplacementModal from '../Library/ReplacementModal';
import toast from 'react-hot-toast';

const ExternalDocCcTrackerModal = ({ isOpen, onClose, document }) => {
  const [ccInstances, setCcInstances] = useState([]);
  const [replacementInstance, setReplacementInstance] = useState(null);

  useEffect(() => {
    if (document && isOpen) {
      // Generate CC Instances based on distributions
      const instances = [];
      if (document.distributions && document.distributions.length > 0) {
        let ccCounter = 1;
        document.distributions.forEach(dist => {
          const qty = dist.quantity || 1;
          for (let i = 0; i < qty; i++) {
            instances.push({
              id: `ext-inst-${document.id}-${ccCounter}`,
              ccNumber: `CC-${String(ccCounter).padStart(3, '0')}`,
              department: dist.departmentId,
              issueNumber: '01',
              status: 'GENERATED'
            });
            ccCounter++;
          }
        });
      }
      setCcInstances(instances);
    }
  }, [document, isOpen]);

  if (!isOpen || !document) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[80] flex items-center justify-center p-4 sm:p-6">
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 bg-slate-900/40"
          onClick={onClose}
        />
        
        <motion.div 
          initial={{ scale: 0.95, opacity: 0, y: 10 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.95, opacity: 0, y: 10 }}
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
          className="relative bg-white border border-gray-200 w-full max-w-4xl overflow-hidden flex flex-col max-h-[90vh] p-0 rounded-3xl"
        >
          {/* Header */}
          <div className="px-6 py-4 border-b border-slate-200/50 flex justify-between items-center bg-slate-50/50">
            <h2 className="text-xl font-bold text-gray-800  flex items-center gap-2">
              <FileText className="text-purple-600" size={20} strokeWidth={1.25}/> จัดการสำเนาควบคุม: {document.title} {document.sourceVersion ? `(${document.sourceVersion})` : ''}
            </h2>
            <button 
              onClick={onClose}
              className="text-gray-400  hover:text-gray-600  p-2 rounded-full hover:bg-slate-200/50 transition-all duration-300 ease-out active:scale-95"
            >
              <X size={24} strokeWidth={1.25}/>
            </button>
          </div>

          {/* Body */}
          <div className="p-6 overflow-y-auto flex-1">
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="bg-gray-50 text-gray-600  font-medium">
                  <tr>
                    <th className="px-4 py-2 rounded-l-lg">CC Number</th>
                    <th className="px-4 py-2">Department</th>
                    <th className="px-4 py-2">Issue No.</th>
                    <th className="px-4 py-2">Status</th>
                    <th className="px-4 py-2 text-right rounded-r-lg">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {ccInstances.map((inst) => (
                    <tr key={inst.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-4 py-3 font-medium text-gray-900 ">{inst.ccNumber}</td>
                      <td className="px-4 py-3 text-gray-600 ">{inst.department}</td>
                      <td className="px-4 py-3 text-gray-600 ">{inst.issueNumber}</td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-1 rounded text-xs font-medium border ${
                          inst.status === 'GENERATED' ? 'bg-green-50 text-green-700  border-green-100' :
                          inst.status === 'DAMAGED' ? 'bg-orange-50 text-orange-700  border-orange-100' :
                          inst.status === 'LOST' ? 'bg-red-50 text-red-700  border-red-100' :
                          'bg-gray-50 text-gray-700  border-gray-100'
                        }`}>
                          {inst.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        {inst.status === 'GENERATED' && (
                          <button 
                            onClick={() => setReplacementInstance(inst)}
                            className="text-xs px-3 py-1.5 bg-red-50 text-red-600  rounded-lg hover:bg-red-100 transition-colors font-medium border border-red-100"
                          >
                            แจ้งชำรุด/สูญหาย
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                  {ccInstances.length === 0 && (
                    <tr>
                      <td colSpan="5" className="px-4 py-8 text-center text-gray-500 ">
                        ไม่มีการแจกจ่ายสำเนาควบคุมสำหรับเอกสารนี้ (No distributions)
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </motion.div>
      </div>

      <ReplacementModal
        isOpen={!!replacementInstance}
        onClose={() => setReplacementInstance(null)}
        instance={replacementInstance}
        documentId={document.id}
        onSubmit={(reason, notes) => {
          // Simulate Replacement Workflow
          const newIssue = String(parseInt(replacementInstance.issueNumber) + 1).padStart(2, '0');
          setCcInstances(prev => {
            const copy = [...prev];
            const idx = copy.findIndex(i => i.id === replacementInstance.id);
            if (idx > -1) {
              copy[idx].status = reason === 'DAMAGED' ? 'DAMAGED' : 'LOST';
              copy.splice(idx + 1, 0, {
                ...replacementInstance,
                id: `${replacementInstance.id}-R${newIssue}`,
                issueNumber: newIssue,
                status: 'GENERATED'
              });
            }
            return copy;
          });
          toast.success(`บันทึกการ${reason === 'DAMAGED' ? 'ชำรุด' : 'สูญหาย'} และออก Issue ${newIssue} ทดแทนแล้ว`);
          setReplacementInstance(null);
        }}
      />
    </AnimatePresence>
  );
};

export default ExternalDocCcTrackerModal;
