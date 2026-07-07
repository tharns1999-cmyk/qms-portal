import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import useStore from '../../store/useStore';
import { FileText, ArrowLeft, CheckCircle, AlertCircle, Activity } from 'lucide-react';
import DARComments from '../../components/workflow/DARComments';
import { resolveReviewer, resolveApprover } from '../../utils/workflowResolver';
import { getDarReason, getDarDetail, getDarDocInfo } from '../../utils/darHelper';

const DarDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { dars, documents, timeline, currentUser, masterUsers, reviewUsers, approveUsers } = useStore();
  
  const dar = dars.find(d => d.id === id);
  const myTimeline = timeline.filter(t => t.darId === id).sort((a, b) => b.id - a.id);
  
  const darHistory = timeline.filter(t => t.darId === id);
  const getActor = (action) => darHistory.find(t => t.action === action)?.user || '-';
  
  const docInfo = getDarDocInfo(dar, documents);

  if (!dar) return <div className="p-6">ไม่พบข้อมูล DAR</div>;

  const isAdmin = currentUser.isDcc || currentUser.role === 'DCC_ADMIN' || currentUser.id === 'u5' || currentUser.id === 'U001';

  let workflow = null;
  if (isAdmin && dar) {
    const requester = masterUsers.find(u => u.id === dar.requesterId);
    const revId = resolveReviewer(dar.requesterId, dar.department, masterUsers, reviewUsers);
    const reviewer = masterUsers.find(u => u.id === revId);
    
    const appId = revId ? resolveApprover(dar.requesterId, revId, dar.department, masterUsers, approveUsers) : null;
    const approver = masterUsers.find(u => u.id === appId);

    workflow = { requester, reviewer, approver };
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <button onClick={() => navigate(-1)} className="p-2 hover:bg-gray-200 rounded-full transition-colors">
          <ArrowLeft className="text-gray-600" size={24} strokeWidth={1.25}/>
        </button>
        <h2 className="text-2xl font-bold text-gray-800 ">{dar.id}: {dar.title}</h2>
      </div>

      {isAdmin && workflow && (
        <div className="bg-white rounded-xl shadow-sm border border-indigo-100 p-6">
          <h3 className="font-semibold text-indigo-900 border-b border-indigo-50 pb-2 mb-6 flex items-center gap-2">
            <Activity className="text-indigo-600" size={20} strokeWidth={1.25}/> Workflow Integrity Tracker (DCC Admin)
          </h3>
          <div className="flex flex-col md:flex-row items-center justify-between gap-4 relative">
             {/* Background connecting line for desktop */}
             <div className="hidden md:block absolute top-1/2 left-8 right-8 h-0.5 bg-gray-200 -z-10 -translate-y-1/2"></div>
             
             {/* Requester Node */}
             <div className="flex flex-col items-center bg-white px-6 py-4 rounded-xl border border-gray-200 shadow-sm z-10 w-full md:w-1/3 max-w-[250px]">
               <div className="flex items-center gap-2 mb-2">
                  <div className="w-3 h-3 rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.5)]"></div>
                  <span className="text-xs font-bold text-gray-500  uppercase tracking-wider">Requester</span>
               </div>
               <p className="font-medium text-gray-800  text-center">{workflow.requester?.name || dar.requesterId}</p>
               <p className="text-xs text-gray-500  mt-1">Level: {workflow.requester?.level || '?'}</p>
             </div>

             {/* Arrow for mobile */}
             <div className="md:hidden text-gray-300">⬇️</div>

             {/* Reviewer Node */}
             <div className="flex flex-col items-center bg-white px-6 py-4 rounded-xl border border-gray-200 shadow-sm z-10 w-full md:w-1/3 max-w-[250px]">
               <div className="flex items-center gap-2 mb-2">
                  <div className={`w-3 h-3 rounded-full ${dar.status === 'DRAFT' || dar.status === 'RETURNED_FOR_REVISION' || dar.status === 'CANCELLED' ? 'bg-gray-300' : dar.status === 'UNDER_REVIEW' ? 'bg-yellow-400 animate-pulse shadow-[0_0_8px_rgba(250,204,21,0.5)]' : 'bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.5)]'}`}></div>
                  <span className="text-xs font-bold text-gray-500  uppercase tracking-wider">Reviewer</span>
               </div>
               <p className="font-medium text-gray-800  text-center">{workflow.reviewer?.name || 'Unknown'}</p>
               <p className="text-xs text-gray-500  mt-1">Level: {workflow.reviewer?.level || '?'}</p>
             </div>

             {/* Arrow for mobile */}
             <div className="md:hidden text-gray-300">⬇️</div>

             {/* Approver Node */}
             <div className="flex flex-col items-center bg-white px-6 py-4 rounded-xl border border-gray-200 shadow-sm z-10 w-full md:w-1/3 max-w-[250px]">
               <div className="flex items-center gap-2 mb-2">
                  <div className={`w-3 h-3 rounded-full ${dar.status === 'PENDING_APPROVAL' ? 'bg-yellow-400 animate-pulse shadow-[0_0_8px_rgba(250,204,21,0.5)]' : dar.status === 'WAITING_EFFECTIVE' || dar.status === 'APPROVED_WAITING_EFFECTIVE' || dar.status === 'WAITING_ACKNOWLEDGEMENT' || dar.status === 'EFFECTIVE' ? 'bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.5)]' : 'bg-gray-300'}`}></div>
                  <span className="text-xs font-bold text-gray-500  uppercase tracking-wider">Approver</span>
               </div>
               <p className="font-medium text-gray-800  text-center">{workflow.approver?.name || 'Unknown'}</p>
               <p className="text-xs text-gray-500  mt-1">Level: {workflow.approver?.level || '?'}</p>
             </div>
          </div>
        </div>
      )}

      {dar.status === 'CANCELLED' && (
        <div className="bg-red-50 border border-red-200 text-red-800 rounded-lg p-4 flex items-center gap-3">
          <AlertCircle className="text-red-500" size={28} strokeWidth={1.25}/>
          <div>
            <p className="font-bold">คำร้องถูกยกเลิก (CANCELLED)</p>
            <p className="text-sm text-red-700 ">ระบบได้ยกเลิกคำร้องนี้โดยอัตโนมัติเนื่องจากเกินกำหนดเวลา SLA (Overdue Day 4) ข้อมูลทั้งหมดอยู่ในสถานะ Read-only</p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Data & PDF */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h3 className="font-semibold text-gray-800  border-b pb-2 mb-4">ข้อมูลคำขอ</h3>
            <div className="grid grid-cols-2 gap-y-4 gap-x-8 text-sm">
              <div className="col-span-2"><span className="text-gray-500  w-32 inline-block">ชื่อเอกสาร:</span> <span className="font-medium text-gray-900 ">{dar.title}</span></div>
              <div><span className="text-gray-500  w-32 inline-block">รหัสเอกสาร:</span> <span className="font-medium text-gray-900 ">{docInfo.docCode}</span></div>
              <div><span className="text-gray-500  w-32 inline-block">Revision:</span> <span className="font-medium text-gray-900 ">
                {dar.type === 'REVISION' ? `${docInfo.docRev} ➡️ ${String(parseInt(docInfo.docRev || 0, 10) + 1).padStart(2, '0')}` : docInfo.docRev}
              </span></div>
              <div><span className="text-gray-500  w-32 inline-block">หมวดหมู่เอกสาร:</span> <span className="font-medium text-gray-900 ">{docInfo.docType}</span></div>
              <div><span className="text-gray-500  w-32 inline-block">ประเภทคำร้อง:</span> <span className="font-medium text-gray-900 ">{dar.type}</span></div>
              <div><span className="text-gray-500  w-32 inline-block">แผนก (Dept):</span> <span className="font-medium text-gray-900 ">{dar.department}</span></div>
              <div><span className="text-gray-500  w-32 inline-block">สถานะ:</span> <span className={`font-bold ${dar.status === 'CANCELLED' ? 'text-red-600 ' : 'text-blue-600 '}`}>{dar.status}</span></div>
              <div><span className="text-gray-500  w-32 inline-block">วันที่ขอ:</span> <span className="font-medium text-gray-900 ">{dar.date}</span></div>
              <div><span className="text-gray-500  w-32 inline-block">วันที่มีผล (Effective):</span> <span className="font-medium text-gray-900 ">{dar.effectiveDate || '-'}</span></div>
              <div className="col-span-2"><span className="text-gray-500  w-32 inline-block">แจกจ่ายไปยัง (Dist.):</span> <span className="font-medium text-gray-900 ">
                {dar.distributions?.length > 0 
                  ? dar.distributions.map(d => d.departmentId || d.dept).join(', ') 
                  : (dar.distributionMode === 'ALL' ? 'ทุกแผนก (All Departments)' : (dar.distributedDepts?.join(', ') || '-'))}
              </span></div>
              <div className="col-span-2"><span className="text-gray-500  w-32 inline-block">รับทราบ (Ack):</span> <span className="font-medium text-gray-900 ">{dar.ackRequirement === 'REQUIRED' ? 'ต้องกดรับทราบ' : 'ไม่ต้องรับทราบ'}</span></div>
              
              <div className="col-span-2 mt-4 pt-4 border-t border-gray-100">
                <h4 className="text-sm font-semibold text-gray-800 mb-3">ผู้ที่เกี่ยวข้อง (Workflow)</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-y-3 gap-x-8 text-sm">
                  <div><span className="text-gray-500 w-28 inline-block">ผู้ร้องขอ (Request):</span> <span className="font-medium text-gray-900">{dar.requesterName || getActor('Created') || '-'}</span></div>
                  <div><span className="text-gray-500 w-28 inline-block">ผู้ทบทวน (Review):</span> <span className="font-medium text-gray-900">{getActor('Reviewed')}</span></div>
                  <div><span className="text-gray-500 w-28 inline-block">ผู้อนุมัติ (Approve):</span> <span className="font-medium text-gray-900">{getActor('Approved')}</span></div>
                  {dar.ackRequirement === 'REQUIRED' && (
                    <div><span className="text-gray-500 w-28 inline-block">รับทราบ (Ack):</span> <span className="font-medium text-gray-900">{getActor('Acknowledged')}</span></div>
                  )}
                </div>
              </div>
              
              <div className="col-span-2 mt-4 pt-4 border-t border-gray-100">
                <span className="text-gray-500  block mb-1">{getDarReason(dar).title}</span> 
                <p className="font-medium text-gray-900  bg-gray-50 p-3 rounded-lg border border-gray-100 whitespace-pre-wrap">{getDarReason(dar).value}</p>
              </div>
              <div className="col-span-2">
                <span className="text-gray-500  block mb-1">{getDarDetail(dar).title}</span> 
                <p className="font-medium text-gray-900  bg-gray-50 p-3 rounded-lg border border-gray-100 whitespace-pre-wrap">{getDarDetail(dar).value}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 h-96 flex flex-col">
            <h3 className="font-semibold text-gray-800  border-b pb-2 mb-4">เอกสารแนบ (PDF)</h3>
            <div className="flex-1 bg-gray-100 flex items-center justify-center rounded-lg border border-gray-200">
              <div className="text-center text-gray-400 ">
                <FileText className="mx-auto mb-2 opacity-50" size={48} strokeWidth={1.25}/>
                <p>PDF Viewer Simulator</p>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Timeline & Comments */}
        <div className="space-y-6">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 max-h-[400px] overflow-y-auto">
            <h3 className="font-semibold text-gray-800  border-b pb-2 mb-6">Workflow Timeline</h3>
            <div className="space-y-6">
              {myTimeline.map((item, idx) => (
                <div key={item.id} className="relative pl-6 border-l-2 border-gray-200 last:border-0 pb-2">
                  <div className="absolute -left-[9px] top-0 bg-white p-1">
                    <CheckCircle className="text-blue-500" size={24} strokeWidth={1.25}/>
                  </div>
                  <div>
                    <div className="flex justify-between items-start mb-1">
                      <p className="font-medium text-gray-900  text-sm">{item.action}</p>
                      <p className="text-xs text-gray-400 ">{item.date}</p>
                    </div>
                    <p className="text-xs text-gray-600 ">โดย: {item.user}</p>
                    {item.comment && !item.isChat && <p className="text-sm text-gray-700  mt-2 bg-gray-50 p-2 rounded border border-gray-100">{item.comment}</p>}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Chat Comments */}
          <DARComments darId={dar.id} requesterId={dar.requesterId} />
        </div>
      </div>
    </div>
  );
};

export default DarDetail;
