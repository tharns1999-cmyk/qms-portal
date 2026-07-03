import React, { useState, useRef, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import useStore from '../../store/useStore';
import toast from 'react-hot-toast';
import { FileText, CheckCircle, XCircle, Ban, ChevronLeft, Download, MessageSquare } from 'lucide-react';
import { motion } from 'framer-motion';
import { getDarReason, getDarDetail, getDarDocInfo } from '../../utils/darHelper';

const TaskApprove = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { tasks, dars, documents, timeline, processWorkflow, currentUser, canDownloadDocument } = useStore();
  
  const [comment, setComment] = useState('');
  const [hasReadToBottom, setHasReadToBottom] = useState(false);
  const scrollRef = useRef(null);

  const task = tasks.find(t => t.id === id);
  const dar = task ? dars.find(d => d.id === task.darId) : null;
  const darTimeline = dar ? timeline.filter(t => t.darId === dar.id) : [];

  useEffect(() => {
    // If PDF container is small enough that it doesn't scroll, unlock immediately
    const checkScroll = () => {
      if (scrollRef.current) {
        const { scrollHeight, clientHeight } = scrollRef.current;
        if (scrollHeight <= clientHeight) {
          setHasReadToBottom(true);
        }
      }
    };
    checkScroll();
  }, []);

  const handleScroll = (e) => {
    const { scrollTop, scrollHeight, clientHeight } = e.target;
    if (scrollTop + clientHeight >= scrollHeight - 10) {
      setHasReadToBottom(true);
    }
  };

  if (!task || !dar) {
    return <div className="p-6">Task not found</div>;
  }

  if (task.assigneeId !== currentUser.id) {
    return (
      <div className="flex h-[80vh] items-center justify-center">
        <div className="bg-red-50 text-red-600  p-8 rounded-xl border border-red-200 text-center shadow-lg">
          <XCircle className="w-16 h-16 mx-auto mb-4 text-red-500 " />
          <h2 className="text-2xl font-bold mb-2">Unauthorized Access</h2>
          <p>คุณไม่มีสิทธิ์เข้าถึงงานนี้ หรือเป็นงานที่ถูกมอบหมายให้ผู้อื่น</p>
          <button onClick={() => navigate('/tasks')} className="mt-6 px-6 py-2 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700">กลับหน้า Inbox</button>
        </div>
      </div>
    );
  }

  // Use a pseudo-document for access rules since DAR is not in documents array yet
  const pseudoDoc = { department: dar.department, distributedTo: dar.distributedDepts || [] };
  const canDownload = canDownloadDocument(pseudoDoc, currentUser);

  const handleAction = (action) => {
    if (!hasReadToBottom) {
      toast.error('กรุณาเลื่อนอ่านเอกสารให้ครบทุกหน้าก่อนตัดสินใจ');
      return;
    }
    if ((action === 'RETURN' || action === 'REJECT') && !comment) {
      toast.error('กรุณาระบุเหตุผล (Comment) สำหรับการตีกลับหรือไม่อนุมัติ');
      return;
    }
    processWorkflow(task.id, action, comment);
    toast.success(`ดำเนินการ ${action} สำเร็จ`);
    navigate('/tasks');
  };

  return (
    <motion.div 
      initial={{ x: 100, opacity: 0 }} 
      animate={{ x: 0, opacity: 1 }} 
      transition={{ type: "spring", stiffness: 200, damping: 25 }} 
      className="h-[calc(100vh-100px)] flex gap-4 overflow-hidden -mx-4 -mb-8 px-4 pb-4"
    >
      {/* LEFT COLUMN: Details & Chat (40%) */}
      <div className="w-[40%] flex flex-col bg-white border border-gray-200 rounded-xl overflow-hidden">
        {/* Header */}
        <div className="p-4 border-b border-gray-100 bg-gray-50 flex items-center justify-between shadow-sm z-10">
           <button onClick={() => navigate('/tasks')} className="flex items-center text-gray-500  hover:text-blue-600  font-medium">
             <ChevronLeft className="w-5 h-5 mr-1" /> Back
           </button>
           <h2 className="font-bold text-gray-800  text-lg flex items-center gap-2">
             <FileText className="w-5 h-5 text-purple-600 " /> Task Approve
           </h2>
        </div>

        {/* Scrollable Details & Timeline */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-gray-50/50">
          
          {/* DAR Summary Card */}
          <div className="bg-white p-5 rounded-xl border border-purple-100 shadow-sm">
            <div className="flex justify-between items-start mb-4">
               <div>
                  <h3 className="text-sm text-gray-500  uppercase tracking-wider font-semibold">Document Request</h3>
                  <p className="text-xl font-bold text-gray-800  mt-1">{dar.id}</p>
               </div>
               <span className="px-3 py-1 bg-purple-100 text-purple-700  text-xs font-bold rounded-full">{dar.type}</span>
            </div>
            <div className="space-y-2 text-sm text-gray-700 ">
               <p><span className="text-gray-400  w-24 inline-block">Title:</span> <span className="font-medium text-gray-900 ">{dar.title}</span></p>
               <p><span className="text-gray-400  w-24 inline-block">Doc Code:</span> <span className="font-medium">{getDarDocInfo(dar, documents).docCode}</span></p>
               <p><span className="text-gray-400  w-24 inline-block">Type:</span> <span className="font-medium">{getDarDocInfo(dar, documents).docType}</span></p>
               <p><span className="text-gray-400  w-24 inline-block">Revision:</span> <span className="font-medium">{getDarDocInfo(dar, documents).docRev}</span></p>
               <p><span className="text-gray-400  w-24 inline-block">Dept:</span> <span className="font-medium">{dar.department}</span></p>
               <p><span className="text-gray-400  w-24 inline-block">Effective:</span> <span className="font-medium">{dar.effectiveDate || '-'}</span></p>
               <p><span className="text-gray-400  w-24 inline-block">Distribution:</span> <span className="font-medium">{dar.distributionMode === 'ALL' ? 'All Departments' : (dar.distributedDepts?.join(', ') || '-')}</span></p>
               {dar.ackRequirement && dar.ackRequirement !== 'NOT_REQUIRED' && (
                 <p><span className="text-gray-400  w-24 inline-block">Ack:</span> <span className="font-medium text-purple-600 ">Required</span></p>
               )}
               <div className="pt-2 mt-2 border-t border-gray-100">
                 <p className="flex items-start"><span className="text-gray-400  w-24 shrink-0 font-semibold">{getDarReason(dar).title}</span> <span className="whitespace-pre-wrap">{getDarReason(dar).value}</span></p>
                 <p className="flex items-start mt-1"><span className="text-gray-400  w-24 shrink-0 font-semibold">{getDarDetail(dar).title}</span> <span className="whitespace-pre-wrap">{getDarDetail(dar).value}</span></p>
               </div>
            </div>
          </div>

          {/* Timeline / Chat */}
          <div className="flex flex-col gap-4">
             <h4 className="text-sm font-bold text-gray-500  uppercase tracking-wider flex items-center gap-2">
               <MessageSquare className="w-4 h-4" /> Workflow History
             </h4>
             {darTimeline.map(tl => (
               <div key={tl.id} className={`flex flex-col ${tl.userId === currentUser.id ? 'items-end' : 'items-start'}`}>
                 <div className="flex items-baseline gap-2 mb-1 px-1">
                   <span className="text-xs font-bold text-gray-700 ">{tl.user}</span>
                   <span className="text-[10px] text-gray-400 ">{tl.date}</span>
                 </div>
                 <div className={`p-3 rounded-2xl max-w-[90%] text-sm shadow-sm ${tl.userId === currentUser.id ? 'bg-purple-600 text-white rounded-tr-sm' : 'bg-white border border-gray-200 text-gray-800  rounded-tl-sm'}`}>
                    {tl.isChat ? (
                      <p>{tl.comment}</p>
                    ) : (
                      <div>
                        <span className={`inline-block px-2 py-0.5 rounded text-xs font-bold mb-1 bg-opacity-20 ${tl.action === 'Created' || tl.action === 'Resubmitted' ? 'bg-purple-100 text-purple-100' : 'bg-gray-100 text-gray-800 '}`}>
                           {tl.action}
                        </span>
                        <p>{tl.comment}</p>
                      </div>
                    )}
                 </div>
               </div>
             ))}
          </div>
        </div>

        {/* Action Panel (Fixed Bottom) */}
        <div className="p-4 bg-white border-t border-gray-200 shadow-[0_-4px_10px_rgba(0,0,0,0.05)] z-10">
          <textarea
            rows="2"
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-purple-100 outline-none mb-3 bg-gray-50"
            placeholder="Type your comment/reason here..."
          />
          <div className="flex gap-2">
            <button
              disabled={!hasReadToBottom}
              onClick={() => handleAction('REJECT')}
              className="flex-1 bg-white border-2 border-red-500 text-red-600  hover:bg-red-50 py-2.5 rounded-lg font-bold flex justify-center items-center gap-1 transition-colors disabled:opacity-40 disabled:cursor-not-allowed text-sm"
              title="ไม่อนุมัติและยกเลิกคำขอนี้ทันที"
            >
              <Ban className="w-4 h-4" /> Reject
            </button>
            <button
              disabled={!hasReadToBottom}
              onClick={() => handleAction('RETURN')}
              className="flex-1 bg-white border-2 border-yellow-500 text-yellow-600  hover:bg-yellow-50 py-2.5 rounded-lg font-bold flex justify-center items-center gap-1 transition-colors disabled:opacity-40 disabled:cursor-not-allowed text-sm"
              title="ส่งกลับไปให้ Requester แก้ไข"
            >
              <XCircle className="w-4 h-4" /> Return
            </button>
            <button
              disabled={!hasReadToBottom}
              onClick={() => handleAction('APPROVE')}
              className="flex-[1.5] bg-purple-600 text-white hover:bg-purple-700 py-2.5 rounded-lg font-bold flex justify-center items-center gap-1 transition-all shadow-md disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:translate-y-0 text-sm"
              title="อนุมัติคำขอ"
            >
              <CheckCircle className="w-4 h-4" /> Approve
            </button>
          </div>
          {!hasReadToBottom && (
            <p className="text-[11px] text-red-500  text-center mt-2 font-medium">⚠️ กรุณาเลื่อนอ่านเอกสารทางขวาให้จบเพื่อปลดล็อคปุ่ม</p>
          )}
        </div>
      </div>

      {/* RIGHT COLUMN: PDF Viewer (60%) */}
      <div className="w-[60%] flex flex-col bg-gray-900 rounded-xl overflow-hidden shadow-xl border border-gray-800">
        
        {/* PDF Toolbar */}
        <div className="bg-gray-800 text-gray-200 px-4 py-3 flex items-center justify-between shadow-md z-10">
          <div className="font-medium truncate pr-4 text-sm">
            {dar.title}.pdf (Final Approval Mode)
          </div>
          <div className="flex items-center gap-2 border-l border-gray-700 pl-4">
            {canDownload ? (
              <button className="p-1.5 hover:bg-gray-700 rounded transition-colors text-purple-400 hover:text-purple-300" title="Download Document">
                <Download className="w-5 h-5" />
              </button>
            ) : (
              <button className="p-1.5 opacity-50 cursor-not-allowed text-gray-500 " title="Preview Only (Global View restricted)">
                <Download className="w-5 h-5" />
              </button>
            )}
          </div>
        </div>

        {/* Scrollable PDF Canvas */}
        <div 
          ref={scrollRef}
          onScroll={handleScroll}
          className="flex-1 overflow-y-auto p-8 bg-gray-600 custom-scrollbar"
        >
           {/* Mock PDF Pages */}
           <div className="max-w-3xl mx-auto space-y-8">
             <div className="bg-white w-full h-[800px] shadow-2xl p-12 relative">
               <h1 className="text-3xl font-bold text-center mb-8 border-b pb-4">{dar.title}</h1>
               <h2 className="text-xl font-semibold mb-4">1. Purpose</h2>
               <p className="text-gray-700  leading-relaxed mb-6">
                 This document outlines the standard operating procedures for {dar.department}. 
                 It serves as a primary reference for all operational tasks defined within the scope.
                 {dar.requestDetail}
               </p>
               <h2 className="text-xl font-semibold mb-4">2. Scope</h2>
               <p className="text-gray-700  leading-relaxed">
                 Applies to all personnel within the {dar.department} department.
               </p>
               <div className="absolute bottom-12 left-0 right-0 text-center text-gray-400  text-sm">Page 1 of 2</div>
             </div>

             <div className="bg-white w-full h-[800px] shadow-2xl p-12 relative flex flex-col">
               <h2 className="text-xl font-semibold mb-4">3. Procedures</h2>
               <ul className="list-disc pl-6 space-y-3 text-gray-700  flex-1">
                 <li>Ensure all materials are logged before processing.</li>
                 <li>Verify quality checks at station A and B.</li>
                 <li>Report any anomalies to the immediate supervisor.</li>
                 <li>Document changes using Form {dar.docIdInput || 'XXX'}.</li>
               </ul>
               <div className="mt-auto p-4 bg-gray-100 rounded-lg text-center font-bold text-gray-500  border border-gray-300">
                 [END OF DOCUMENT]
               </div>
               <div className="absolute bottom-12 left-0 right-0 text-center text-gray-400  text-sm">Page 2 of 2</div>
             </div>
           </div>
        </div>

      </div>
    </motion.div>
  );
};

export default TaskApprove;
