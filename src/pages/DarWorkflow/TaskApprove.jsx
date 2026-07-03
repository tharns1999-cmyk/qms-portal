import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import useStore from '../../store/useStore';
import toast from 'react-hot-toast';
import { Check, CornerUpLeft, X, ArrowLeft } from 'lucide-react';

const TaskApprove = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { tasks, dars, processWorkflow } = useStore();
  
  const [comment, setComment] = useState('');
  const task = tasks.find(t => t.id === id);
  const dar = task ? dars.find(d => d.id === task.darId) : null;

  if (!task || !dar) return <div className="p-6">ไม่พบงานนี้ในระบบ</div>;

  const handleAction = (action) => {
    processWorkflow(task.id, action, comment);
    toast.success(`ดำเนินการ ${action} สำเร็จ`);
    navigate('/dashboard');
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <button onClick={() => navigate('/dashboard')} className="p-2 hover:bg-gray-200 rounded-full transition-colors">
          <ArrowLeft className="w-5 h-5 text-gray-600 " />
        </button>
        <h2 className="text-2xl font-bold text-gray-800 ">Approve Task: {dar.id}</h2>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <h3 className="font-semibold text-gray-800  border-b pb-2 mb-4">ข้อมูลคำขอ</h3>
        <div className="grid grid-cols-2 gap-y-4 gap-x-8 text-sm">
          <div><span className="text-gray-500 ">หัวข้อ:</span> <span className="font-medium text-gray-900  ml-2">{dar.title}</span></div>
          <div><span className="text-gray-500 ">ประเภท:</span> <span className="font-medium text-gray-900  ml-2">{dar.type}</span></div>
          <div><span className="text-gray-500 ">Ack Requirement:</span> <span className="font-medium text-gray-900  ml-2">{dar.ackRequirement || '-'}</span></div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <h3 className="font-semibold text-gray-800  border-b pb-2 mb-4">ดำเนินการ (Approver)</h3>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700  mb-1">ความเห็น (Comment)</label>
            <textarea 
              rows={4}
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring focus:ring-blue-100"
              placeholder="ระบุความเห็นของคุณที่นี่..."
            />
          </div>
          
          <div className="flex gap-4 pt-2">
            <button 
              onClick={() => handleAction('APPROVE')}
              className="flex-1 flex justify-center items-center gap-2 py-3 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition-colors"
            >
              <Check className="w-5 h-5" /> Approve
            </button>
            <button 
              onClick={() => handleAction('RETURN')}
              className="flex-1 flex justify-center items-center gap-2 py-3 bg-orange-500 text-white rounded-lg font-medium hover:bg-orange-600 transition-colors"
            >
              <CornerUpLeft className="w-5 h-5" /> Return
            </button>
            <button 
              onClick={() => handleAction('REJECT')}
              className="flex-1 flex justify-center items-center gap-2 py-3 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 transition-colors"
            >
              <X className="w-5 h-5" /> Reject
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TaskApprove;
