import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import useStore from '../../store/useStore';
import toast from 'react-hot-toast';
import { FileText, CheckCircle, ChevronLeft, AlertCircle } from 'lucide-react';

const TaskRevise = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { tasks, dars, resubmitDar, currentUser } = useStore();
  
  const task = tasks.find(t => t.id === id);
  const dar = task ? dars.find(d => d.id === task.darId) : null;

  const [formData, setFormData] = useState({
    title: dar?.title || '',
    requestDetail: dar?.requestDetail || '',
    changeSummary: dar?.changeSummary || '',
  });

  if (!task || !dar) {
    return <div className="p-6">Task not found</div>;
  }

  if (task.assigneeId !== currentUser.id) {
    return <div className="p-6 text-red-600 ">Unauthorized</div>;
  }

  const handleAction = () => {
    if (!formData.title) {
      toast.error('กรุณาระบุชื่อเอกสาร');
      return;
    }
    
    // Minimal mock resubmit data update
    resubmitDar(dar.id, formData, task.id);
    toast.success('ส่งกลับไปให้ Reviewer ตรวจสอบใหม่สำเร็จ');
    navigate('/tasks');
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <button onClick={() => navigate('/tasks')} className="flex items-center text-gray-500  hover:text-blue-600  transition-colors">
        <ChevronLeft className="w-5 h-5" /> กลับหน้า Inbox
      </button>

      <div className="flex items-center gap-3">
        <FileText className="w-8 h-8 text-yellow-600 " />
        <h2 className="text-2xl font-bold text-gray-800 ">Revise Task: {dar.id}</h2>
      </div>

      <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-6">
        <div className="flex items-start gap-4">
          <div className="bg-yellow-100 p-3 rounded-full text-yellow-700 ">
            <AlertCircle className="w-6 h-6" />
          </div>
          <div>
            <h3 className="font-semibold text-lg text-yellow-900 mb-1">เอกสารส่งกลับแก้ไข (Returned for Revision)</h3>
            <p className="text-yellow-800 text-sm">
              คำขอนี้ถูกส่งกลับมาให้คุณทำการแก้ไข กรุณาตรวจสอบความคิดเห็น (Comment) จาก Timeline แล้วแก้ไขข้อมูลให้ถูกต้องก่อนส่งกลับไปตรวจใหม่
            </p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 space-y-6">
        <h3 className="font-semibold text-lg mb-4 border-b pb-2">Edit DAR Information</h3>
        
        <div>
          <label className="block text-sm font-medium text-gray-700  mb-1">ชื่อเอกสาร (Title) <span className="text-red-500 ">*</span></label>
          <input 
            type="text" 
            value={formData.title}
            onChange={(e) => setFormData({...formData, title: e.target.value})}
            className="w-full border rounded-lg px-3 py-2 border-gray-300 focus:ring-yellow-100"
          />
        </div>

        {dar.type === 'NEW' && (
          <div>
            <label className="block text-sm font-medium text-gray-700  mb-1">รายละเอียดคำร้องขอ (Request Detail)</label>
            <textarea 
              rows="3"
              value={formData.requestDetail}
              onChange={(e) => setFormData({...formData, requestDetail: e.target.value})}
              className="w-full border rounded-lg px-3 py-2 border-gray-300 focus:ring-yellow-100"
            />
          </div>
        )}

        {dar.type === 'REVISION' && (
          <div>
            <label className="block text-sm font-medium text-gray-700  mb-1">สรุปการเปลี่ยนแปลง (Change Summary)</label>
            <textarea 
              rows="3"
              value={formData.changeSummary}
              onChange={(e) => setFormData({...formData, changeSummary: e.target.value})}
              className="w-full border rounded-lg px-3 py-2 border-gray-300 focus:ring-yellow-100"
            />
          </div>
        )}

        <div className="pt-6 border-t mt-6">
          <button
            onClick={handleAction}
            className="w-full bg-blue-600 text-white hover:bg-blue-700 py-3 rounded-lg font-semibold flex justify-center items-center gap-2 transition-colors shadow-md"
          >
            <CheckCircle className="w-5 h-5" />
            Resubmit for Review (ส่งตรวจสอบใหม่)
          </button>
        </div>
      </div>
    </div>
  );
};

export default TaskRevise;
