import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import useStore from '../../store/useStore';
import toast from 'react-hot-toast';
import { FileText, CheckCircle, ChevronLeft, Eye, Download } from 'lucide-react';
import { motion } from 'framer-motion';
import { getDarReason, getDarDetail, getDarDocInfo } from '../../utils/darHelper';

const TaskAck = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { tasks, dars, documents, currentUser, processWorkflow } = useStore();
  const [hasOpenedPdf, setHasOpenedPdf] = useState(false);

  const task = tasks.find(t => t.id === id);
  const dar = task ? dars.find(d => d.id === task.darId) : null;

  if (!task || !dar) {
    return <div className="p-6">Task not found</div>;
  }

  if (task.assigneeId !== currentUser.id) {
    return <div className="p-6 text-red-600 ">Unauthorized</div>;
  }

  const handleOpenPdf = () => {
    // In a real app, this would open the PDF in a new tab or modal
    toast.success('กำลังเปิดไฟล์ PDF...');
    setHasOpenedPdf(true);
  };

  const handleAction = () => {
    if (!hasOpenedPdf) {
      toast.error('กรุณาเปิดอ่านไฟล์ PDF ก่อนกดยืนยันรับทราบ');
      return;
    }
    processWorkflow(task.id, 'ACKNOWLEDGE', 'Acknowledged');
    toast.success('ยืนยันการรับทราบเอกสารสำเร็จ');
    navigate('/tasks');
  };

  return (
    <motion.div 
      initial={{ x: 100, opacity: 0 }} 
      animate={{ x: 0, opacity: 1 }} 
      transition={{ type: "spring", stiffness: 200, damping: 25 }} 
      className="max-w-4xl mx-auto space-y-6"
    >
      <button onClick={() => navigate('/tasks')} className="flex items-center text-gray-500  hover:text-blue-600  transition-colors">
        <ChevronLeft size={20} strokeWidth={1.25}/> กลับหน้า Inbox
      </button>

      <div className="flex items-center gap-3">
        <FileText className="text-indigo-600" size={32} strokeWidth={1.25}/>
        <h2 className="text-2xl font-bold text-gray-800 ">Acknowledge Task: {dar.id}</h2>
      </div>

      <div className="bg-indigo-50 border border-indigo-100 rounded-xl p-6">
        <div className="flex items-start gap-4">
          <div className="bg-indigo-100 p-3 rounded-full text-indigo-600 ">
            <Eye size={28} strokeWidth={1.25}/>
          </div>
          <div>
            <h3 className="font-semibold text-lg text-indigo-900 mb-1">การรับทราบเอกสาร (Acknowledgement)</h3>
            <p className="text-indigo-700  text-sm">
              คุณได้รับมอบหมายให้รับทราบเนื้อหาของเอกสารฉบับนี้ กรุณากดเปิดอ่านไฟล์ PDF เพื่อศึกษาเนื้อหาก่อนกดยืนยัน
            </p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <h3 className="font-semibold text-lg mb-4 border-b pb-2">DAR Information</h3>
        
        <div className="grid grid-cols-2 gap-4 text-sm mt-4 p-4 bg-gray-50 rounded-lg">
          <div><span className="text-gray-500  block">Document No:</span> <span className="font-medium text-gray-900 ">{getDarDocInfo(dar, documents).docCode}</span></div>
          <div><span className="text-gray-500  block">Revision:</span> <span className="font-medium text-gray-900 ">{getDarDocInfo(dar, documents).docRev}</span></div>
          <div><span className="text-gray-500  block">Type:</span> <span className="font-medium text-gray-900 ">{getDarDocInfo(dar, documents).docType}</span></div>
          <div><span className="text-gray-500  block">Effective Date:</span> <span className="font-medium text-gray-900 ">{dar.effectiveDate || '-'}</span></div>
          <div><span className="text-gray-500  block">Department:</span> <span className="font-medium">{dar.department}</span></div>
          <div><span className="text-gray-500  block">Status:</span> <span className="font-medium text-indigo-600 ">{dar.status}</span></div>
        </div>
        <div className="pt-2 mt-2 border-t border-gray-100">
          <p className="flex items-start"><span className="text-gray-400  w-24 shrink-0 font-semibold">{getDarReason(dar).title}</span> <span className="whitespace-pre-wrap">{getDarReason(dar).value}</span></p>
          <p className="flex items-start mt-1"><span className="text-gray-400  w-24 shrink-0 font-semibold">{getDarDetail(dar).title}</span> <span className="whitespace-pre-wrap">{getDarDetail(dar).value}</span></p>
        </div>

        <div className="bg-gray-50 p-6 rounded-lg border border-gray-200 text-center space-y-4">
          <FileText className="text-gray-400 mx-auto" size={48} strokeWidth={1.25}/>
          <div>
            <p className="font-medium text-gray-800 ">{dar.file || 'เอกสารแนบ.pdf'}</p>
            <p className="text-sm text-gray-500 ">PDF Document</p>
          </div>
          <button 
            onClick={handleOpenPdf}
            className="inline-flex items-center gap-2 px-6 py-2.5 bg-white border-2 border-indigo-600 text-indigo-600  rounded-lg hover:bg-indigo-50 font-medium transition-colors"
          >
            <Download size={20} strokeWidth={1.25}/> เปิดอ่านไฟล์ (Read Document)
          </button>
        </div>

        <div className="pt-6 border-t mt-6">
          <button
            onClick={handleAction}
            disabled={!hasOpenedPdf}
            className={`w-full py-3 rounded-lg font-semibold flex justify-center items-center gap-2 transition-colors shadow-md ${
              hasOpenedPdf 
                ? 'bg-indigo-600 text-white hover:bg-indigo-700' 
                : 'bg-gray-200 text-gray-400  cursor-not-allowed'
            }`}
          >
            <CheckCircle size={20} strokeWidth={1.25}/> ยืนยันการรับทราบ (Acknowledge)
          </button>
          {!hasOpenedPdf && (
            <p className="text-center text-sm text-red-500  mt-2">
              * กรุณาเปิดอ่านไฟล์ก่อนกดยืนยัน
            </p>
          )}
        </div>
      </div>
    </motion.div>
  );
};

export default TaskAck;
