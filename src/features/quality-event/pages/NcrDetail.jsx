import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import useStore from '../../../store/useStore';
import { qualityEventNcrService, NCR_STATUS } from '../services/QualityEventNcrService';
import { 
  canViewNcrHold, 
  canRespondToNcr, 
  canUpdateHoldExecution, 
  canPerformFollowUp
} from '../../../utils/permissionHelper';
import toast from 'react-hot-toast';
import { AlertCircle, CheckCircle } from 'lucide-react';

const NcrDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { currentUser } = useStore();
  const [record, setRecord] = useState(null);
  const [accessDenied, setAccessDenied] = useState(false);
  const [activeTab, setActiveTab] = useState('pt1');
  const [loading, setLoading] = useState(true);

  // Form states for responses
  const [responseForm, setResponseForm] = useState({
    causeOfProblem: '', correction: '', longTermPrevention: '', expectedCompletionDate: ''
  });

  const [handlingComment, setHandlingComment] = useState('');

  const loadRecord = useCallback(async () => {
    try {
      const data = await qualityEventNcrService.getById(id);
      if (!data) {
        navigate('/quality-event/ncr');
        return;
      }
      
      if (!canViewNcrHold(currentUser, data)) {
        setAccessDenied(true);
        setLoading(false);
        return;
      }
      
      setRecord(data);
      if (data.causeOfProblem) {
         setResponseForm({
            causeOfProblem: data.causeOfProblem,
            correction: data.correction,
            longTermPrevention: data.longTermPrevention,
            expectedCompletionDate: data.expectedCompletionDate
         });
      }
    } catch (err) {
       console.error(err);
    } finally {
       setLoading(false);
    }
  }, [id, currentUser, navigate]);

  useEffect(() => {
    loadRecord();
  }, [loadRecord]);

  const handleResponseSubmit = async () => {
    try {
      await qualityEventNcrService.submitDepartmentResponse(id, responseForm, currentUser);
      toast.success('Response submitted successfully');
      loadRecord();
    } catch (err) {
      toast.error(err.message || 'Failed to submit response');
    }
  };

  const handleFollowUp = async (step) => {
    try {
      await qualityEventNcrService.performFollowUp(id, step, { completed: true, comment: 'Completed OK' }, currentUser);
      toast.success(`Follow-up ${step} recorded`);
      loadRecord();
    } catch (err) {
      toast.error(err.message);
    }
  };

  const handleDisposition = async (disposition) => {
    try {
      await qualityEventNcrService.proposeDisposition(id, { disposition }, currentUser);
      toast.success('Disposition proposed');
      loadRecord();
    } catch (err) {
      toast.error(err.message);
    }
  };

  const handleApproval = async (action) => {
    try {
      await qualityEventNcrService.submitDispositionApproval(id, { action, comment: 'Approved digitally' }, currentUser);
      toast.success(`Disposition ${action}`);
      loadRecord();
    } catch (err) {
      toast.error(err.message);
    }
  };

  const handleTaskAck = async (taskId) => {
    try {
      await qualityEventNcrService.acknowledgeHandlingTask(id, taskId, handlingComment, currentUser);
      toast.success('Task acknowledged');
      setHandlingComment('');
      loadRecord();
    } catch (err) {
      toast.error(err.message);
    }
  };

  if (loading) return <div className="p-8 flex justify-center items-center h-full"><div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div></div>;
  if (accessDenied) return (
    <div className="flex flex-col h-full bg-zinc-50 items-center justify-center p-8">
      <div className="bg-white p-8 rounded-xl border max-w-md w-full text-center shadow-sm">
        <AlertCircle size={48} className="text-red-500 mx-auto mb-4" />
        <h1 className="text-2xl font-bold text-zinc-900 mb-2">Access Denied</h1>
        <p className="text-zinc-500 mb-6">You do not have permission to view this Quality Event record. If you believe this is an error, please contact QAQC or your system administrator.</p>
        <button onClick={() => navigate('/quality-event/ncr')} className="px-6 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700">Return to List</button>
      </div>
    </div>
  );
  if (!record) return null;

  const canRespond = canRespondToNcr(currentUser, record);
  const canFollowUp = canPerformFollowUp(currentUser);
  const canUpdateHandling = canUpdateHoldExecution(currentUser, record);
  const isPendingApproval = record.ncrStatus === NCR_STATUS.PENDING_APPROVAL;

  return (
    <div className="flex flex-col h-full bg-zinc-50 relative">
      <div className="bg-white px-6 py-4 border-b shrink-0 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-xl font-bold text-zinc-900">
            {record.recordNo ? record.recordNo : record.holdNo}
          </h1>
          <p className="text-sm text-zinc-500 flex gap-2 items-center mt-1">
            Ref: FM-QC-130 R01
            {record.holdNo && record.recordNo && (
              <span className="px-2 py-0.5 bg-orange-100 text-orange-800 rounded font-medium text-xs">
                Hold Control: {record.holdNo}
              </span>
            )}
          </p>
        </div>
        <div className="flex gap-2">
           <div className="px-4 py-2 bg-blue-50 border border-blue-100 rounded-lg">
             <span className="block text-xs text-blue-500 font-semibold uppercase">NCR Status</span>
             <span className="font-medium text-blue-900">{record.ncrStatus}</span>
           </div>
           <div className="px-4 py-2 bg-orange-50 border border-orange-100 rounded-lg">
             <span className="block text-xs text-orange-500 font-semibold uppercase">Hold Status</span>
             <span className="font-medium text-orange-900">{record.holdStatus}</span>
           </div>
        </div>
      </div>

      <div className="bg-white px-6 border-b shrink-0">
        <nav className="flex space-x-6">
          <button onClick={() => setActiveTab('pt1')} className={`py-3 text-sm font-medium border-b-2 ${activeTab==='pt1'?'border-blue-500 text-blue-600':'border-transparent text-zinc-500'}`}>Pt 1: Problem & Response</button>
          {canFollowUp && <button onClick={() => setActiveTab('pt2')} className={`py-3 text-sm font-medium border-b-2 ${activeTab==='pt2'?'border-blue-500 text-blue-600':'border-transparent text-zinc-500'}`}>Pt 2: Follow-up</button>}
          {canFollowUp || isPendingApproval ? <button onClick={() => setActiveTab('pt3')} className={`py-3 text-sm font-medium border-b-2 ${activeTab==='pt3'?'border-blue-500 text-blue-600':'border-transparent text-zinc-500'}`}>Pt 3: Release / Approval</button> : null}
          {(canUpdateHandling || canFollowUp) && <button onClick={() => setActiveTab('pt4')} className={`py-3 text-sm font-medium border-b-2 ${activeTab==='pt4'?'border-blue-500 text-blue-600':'border-transparent text-zinc-500'}`}>Pt 4: Handling Execution</button>}
        </nav>
      </div>

      <div className="flex-1 overflow-auto p-6 max-w-5xl mx-auto w-full space-y-6">
        
        {activeTab === 'pt1' && (
          <div className="space-y-6">
             <div className="bg-white p-6 rounded-xl border">
               <h2 className="font-semibold text-lg border-b pb-2 mb-4">Item & Problem Description</h2>
               <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
                 <div><span className="block text-sm text-zinc-500">Item Category</span><span className="font-medium">{record.itemCategory}</span></div>
                 <div><span className="block text-sm text-zinc-500">Item Name</span><span className="font-medium">{record.productName || record.materialName || record.packagingName}</span></div>
                 <div><span className="block text-sm text-zinc-500">Lot No.</span><span className="font-medium">{record.lotNo}</span></div>
                 <div className="col-span-3"><span className="block text-sm text-zinc-500">Problem Found</span><p className="mt-1">{record.problemDescription}</p></div>
                 <div><span className="block text-sm text-zinc-500">Responsible Dept</span><span className="font-medium text-red-600">{record.responsibleDepartmentId || 'Unassigned'}</span></div>
               </div>
             </div>

             {canRespond && (record.ncrStatus === NCR_STATUS.ASSIGNED_TO_DEPARTMENT || record.ncrStatus === NCR_STATUS.DEPARTMENT_RESPONDING) && (
               <div className="bg-blue-50/50 p-6 rounded-xl border border-blue-100">
                 <h2 className="font-semibold text-lg text-blue-900 mb-4">Department Response</h2>
                 <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-zinc-700">Cause of Problem *</label>
                      <textarea className="w-full p-2 border rounded" value={responseForm.causeOfProblem} onChange={e=>setResponseForm(f=>({...f, causeOfProblem: e.target.value}))}></textarea>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-zinc-700">Correction *</label>
                      <textarea className="w-full p-2 border rounded" value={responseForm.correction} onChange={e=>setResponseForm(f=>({...f, correction: e.target.value}))}></textarea>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-zinc-700">Long-term Prevention *</label>
                      <textarea className="w-full p-2 border rounded" value={responseForm.longTermPrevention} onChange={e=>setResponseForm(f=>({...f, longTermPrevention: e.target.value}))}></textarea>
                    </div>
                    <button onClick={handleResponseSubmit} className="px-4 py-2 bg-blue-600 text-white rounded font-medium">Submit Response</button>
                 </div>
               </div>
             )}

             {record.ncrStatus !== NCR_STATUS.ASSIGNED_TO_DEPARTMENT && record.causeOfProblem && (
               <div className="bg-white p-6 rounded-xl border">
                 <h2 className="font-semibold text-lg border-b pb-2 mb-4">Submitted Response</h2>
                 <p className="text-sm text-zinc-500 font-medium">Cause:</p>
                 <p className="mb-4">{record.causeOfProblem}</p>
                 <p className="text-sm text-zinc-500 font-medium">Correction:</p>
                 <p className="mb-4">{record.correction}</p>
                 <p className="text-sm text-zinc-500 font-medium">Prevention:</p>
                 <p>{record.longTermPrevention}</p>
               </div>
             )}
          </div>
        )}

        {activeTab === 'pt2' && canFollowUp && (
          <div className="bg-white p-6 rounded-xl border space-y-6">
             <h2 className="font-semibold text-lg border-b pb-2">QAQC Follow-up</h2>
             <div className="flex gap-4">
                <button onClick={() => handleFollowUp(1)} disabled={record.ncrStatus !== NCR_STATUS.PENDING_QAQC_FOLLOW_UP && record.ncrStatus !== NCR_STATUS.RESPONSE_SUBMITTED} className="px-4 py-2 border rounded hover:bg-zinc-50 disabled:opacity-50">Record Follow-up 1</button>
                <button onClick={() => handleFollowUp(2)} disabled={record.ncrStatus !== NCR_STATUS.FOLLOW_UP_1} className="px-4 py-2 border rounded hover:bg-zinc-50 disabled:opacity-50">Record Follow-up 2</button>
                <button onClick={() => handleFollowUp(3)} disabled={record.ncrStatus !== NCR_STATUS.FOLLOW_UP_2} className="px-4 py-2 border rounded hover:bg-zinc-50 disabled:opacity-50">Record Follow-up 3</button>
             </div>
             
             <div className="mt-8 pt-6 border-t">
                <h3 className="font-semibold mb-4">Propose Final Disposition</h3>
                <div className="flex gap-4">
                   <button onClick={() => handleDisposition('RELEASED')} className="px-4 py-2 bg-green-50 text-green-700 border border-green-200 rounded font-medium">Propose Release</button>
                   <button onClick={() => handleDisposition('REJECTED')} className="px-4 py-2 bg-red-50 text-red-700 border border-red-200 rounded font-medium">Propose Reject/Destroy</button>
                </div>
             </div>
          </div>
        )}

        {activeTab === 'pt3' && (
          <div className="bg-white p-6 rounded-xl border space-y-6">
             <h2 className="font-semibold text-lg border-b pb-2">Approval & Release</h2>
             {record.finalDisposition && (
               <div className="p-4 bg-zinc-50 rounded border">
                 <p className="text-sm text-zinc-500">Proposed Disposition:</p>
                 <p className="text-lg font-bold">{record.finalDisposition}</p>
                 
                 {isPendingApproval && (
                   <div className="mt-4 flex gap-4">
                     <button onClick={() => handleApproval('APPROVED')} className="px-4 py-2 bg-blue-600 text-white rounded font-medium flex items-center"><CheckCircle size={18} className="mr-2"/> Approve</button>
                     <button onClick={() => handleApproval('REJECTED')} className="px-4 py-2 bg-red-600 text-white rounded font-medium flex items-center"><AlertCircle size={18} className="mr-2"/> Deny (Return)</button>
                   </div>
                 )}
               </div>
             )}
             {!record.finalDisposition && <p className="text-zinc-500 italic">No disposition proposed yet.</p>}
          </div>
        )}

        {activeTab === 'pt4' && (
          <div className="bg-white p-6 rounded-xl border space-y-4">
             <h2 className="font-semibold text-lg border-b pb-2">RM / WIP / FG Handling Execution</h2>
             <p className="text-sm text-zinc-500 mb-4">Handling instructions depend on the material/product status.</p>
             
             {(!record.handling || !record.handling.tasks) ? (
               <p className="text-sm italic text-zinc-500 p-4 border border-dashed rounded bg-zinc-50">No handling tasks generated yet. Tasks are generated when final disposition is approved.</p>
             ) : (
               <div className="space-y-4">
                 {record.handling.tasks.map(task => {
                   const canAck = task.requiredDept === currentUser.department || hasPermission(currentUser, PERMISSIONS.HOLD_ADMIN);
                   return (
                     <div key={task.id} className="p-4 border rounded bg-zinc-50 flex flex-col gap-2">
                       <div className="flex justify-between items-center">
                         <h3 className="font-medium text-zinc-700">{task.label}</h3>
                         <span className={`px-2 py-1 rounded text-xs font-medium ${task.completed ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                           {task.completed ? 'Acknowledged' : 'Pending'}
                         </span>
                       </div>
                       <p className="text-sm text-zinc-500">Required Department: <span className="font-medium text-zinc-700">{task.requiredDept}</span></p>
                       
                       {task.completed ? (
                         <div className="mt-2 text-sm text-zinc-600 bg-white p-3 border rounded">
                           <p><span className="font-medium">By:</span> {task.acknowledgedBy} at {new Date(task.acknowledgedAt).toLocaleString()}</p>
                           {task.comment && <p className="mt-1"><span className="font-medium">Comment:</span> {task.comment}</p>}
                         </div>
                       ) : canAck ? (
                         <div className="mt-2 flex gap-4 items-center">
                           <input type="text" placeholder="Add comment..." className="p-2 border rounded flex-1" value={handlingComment} onChange={e => setHandlingComment(e.target.value)} />
                           <button onClick={() => handleTaskAck(task.id)} className="px-4 py-2 bg-blue-600 text-white rounded font-medium">Acknowledge</button>
                         </div>
                       ) : (
                         <p className="text-sm italic text-red-500 mt-2">You cannot acknowledge this task.</p>
                       )}
                     </div>
                   );
                 })}
               </div>
             )}
          </div>
        )}

      </div>
    </div>
  );
};

export default NcrDetail;
