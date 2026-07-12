import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import useStore from '../../../store/useStore';
import { qualityEventCapaService, CAPA_STATUS } from '../services/QualityEventCapaService';
import { hasPermission, PERMISSIONS } from '../../../utils/permissionHelper';
import NcCapaRootCauseTab from '../../nc-capa/components/NcCapaRootCauseTab';
import NcCapaActionPlanTab from '../../nc-capa/components/NcCapaActionPlanTab';
import NcCapaEvidenceTab from '../../nc-capa/components/NcCapaEvidenceTab';
import NcCapaQaVerificationTab from '../../nc-capa/components/NcCapaQaVerificationTab';
import NcCapaEffectivenessTab from '../../nc-capa/components/NcCapaEffectivenessTab';
import { ShieldAlert, CheckCircle, ArrowRightCircle } from 'lucide-react';
import toast from 'react-hot-toast';

const CapaDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { currentUser } = useStore();
  const [record, setRecord] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');
  
  // Originator Review States
  const [reviewAction, setReviewAction] = useState(null);
  const [reviewReason, setReviewReason] = useState('');

  const loadRecord = useCallback(async () => {
    const data = await qualityEventCapaService.getById(id);
    if (!data) {
      navigate('/quality-event/capa');
      return;
    }
    setRecord(data);
  }, [id, navigate]);

  useEffect(() => {
    loadRecord();
  }, [loadRecord]);

  const handleOriginatorReview = async (action) => {
    try {
      await qualityEventCapaService.originatorReviewResponse(id, action, {
        reason: reviewReason
      }, currentUser.id);
      toast.success(`Response ${action.toLowerCase()}ed successfully`);
      setReviewAction(null);
      setReviewReason('');
      loadRecord();
    } catch {
      toast.error('Failed to perform review action');
    }
  };

  const handleTargetResponse = async () => {
    try {
      await qualityEventCapaService.targetDepartmentRespond(id, {}, currentUser.id);
      toast.success('Response submitted to originating department');
      loadRecord();
    } catch {
      toast.error('Failed to submit response');
    }
  };

  const handleQaqcClose = async () => {
    try {
      await qualityEventCapaService.qaqcFinalClosure(id, 'CLOSE', {}, currentUser.id);
      toast.success('Record closed');
      loadRecord();
    } catch {
      toast.error('Failed to close record');
    }
  };

  if (!record) return <div className="p-8">Loading...</div>;

  // Convert for compatibility with NcCapa tabs
  const ncCompatibilityRecord = {
    ...record,
    id: record.id,
    ncNumber: record.id,
    status: record.status
  };

  const tabs = [
    { id: 'overview', label: 'Overview' },
    ...(record.status !== CAPA_STATUS.DRAFT ? [{ id: 'rca', label: 'Root Cause Analysis' }] : []),
    ...(record.status !== CAPA_STATUS.DRAFT ? [{ id: 'actionPlan', label: 'Action Plan' }] : []),
    ...(record.status !== CAPA_STATUS.DRAFT ? [{ id: 'execution', label: 'Execution & Evidence' }] : []),
    ...(record.status !== CAPA_STATUS.DRAFT ? [{ id: 'verification', label: 'QA Verification' }] : []),
    ...(record.status !== CAPA_STATUS.DRAFT ? [{ id: 'effectiveness', label: 'Effectiveness & Closure' }] : []),
    { id: 'linked', label: 'Linked Records' },
  ];

  const isTargetDept = record.responsibleDept === currentUser.department;
  const isOriginatorDept = record.requesterDept === currentUser.department;

  return (
    <div className="flex flex-col h-full bg-zinc-50 relative">
      <div className="bg-white px-6 py-4 border-b shrink-0 flex justify-between items-center">
        <div>
          <h1 className="text-xl font-bold text-zinc-900">{record.recordNo} - {record.recordType}</h1>
          <p className="text-sm text-zinc-500">Ref: FM-QC-30 R04 | Status: <span className="font-semibold text-blue-600">{record.status}</span></p>
        </div>
        <div className="flex gap-2 items-center">
          {record.responseDueDate && (
            <span className="text-sm text-zinc-500 mr-4">Due: {new Date(record.responseDueDate).toLocaleDateString()}</span>
          )}
          <span className={`px-3 py-1 rounded-full text-sm font-medium ${
            record.severity === 'CRITICAL' ? 'bg-red-50 text-red-700' :
            record.severity === 'HIGH' ? 'bg-orange-50 text-orange-700' :
            'bg-zinc-100 text-zinc-700'
          }`}>{record.severity}</span>
        </div>
      </div>

      <div className="bg-white px-6 border-b shrink-0">
        <nav className="flex space-x-6 overflow-x-auto hide-scrollbar">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`py-3 text-sm font-medium border-b-2 whitespace-nowrap transition-colors ${
                activeTab === tab.id
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-zinc-500 hover:text-zinc-700 hover:border-zinc-300'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      <div className="flex-1 overflow-auto p-6">
        {activeTab === 'overview' && (
          <div className="space-y-6 max-w-4xl mx-auto">
            <div className="bg-white p-6 rounded-xl border">
              <h2 className="font-semibold text-lg mb-4">Problem Information</h2>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <span className="text-zinc-500 text-sm block">Title</span>
                  <span className="font-medium">{record.title}</span>
                </div>
                <div>
                  <span className="text-zinc-500 text-sm block">Date Found</span>
                  <span className="font-medium">{record.dateFound}</span>
                </div>
                <div>
                  <span className="text-zinc-500 text-sm block">Originating Department</span>
                  <span className="font-medium">{record.requesterDept}</span>
                </div>
                <div>
                  <span className="text-zinc-500 text-sm block">Target/Responsible Department</span>
                  <span className="font-medium">{record.responsibleDept}</span>
                </div>
                <div className="col-span-2">
                  <span className="text-zinc-500 text-sm block">Problem Description</span>
                  <p className="font-medium whitespace-pre-wrap mt-1">{record.problemDescription}</p>
                </div>
              </div>
            </div>

            {/* Target Department Action */}
            {record.status === CAPA_STATUS.ASSIGNED && isTargetDept && (
               <div className="bg-yellow-50/50 p-6 rounded-xl border border-yellow-200">
                  <h2 className="font-semibold text-lg mb-2 text-yellow-900 flex items-center">
                    <ArrowRightCircle className="w-5 h-5 mr-2" /> Target Department Action Required
                  </h2>
                  <p className="text-sm text-yellow-800 mb-4">Please complete the RCA and Action Plan tabs, then submit your response to the originating department.</p>
                  <button onClick={handleTargetResponse} className="px-4 py-2 bg-yellow-600 text-white rounded font-medium">Submit Response</button>
               </div>
            )}

            {/* Originator Review Panel */}
            {record.status === CAPA_STATUS.PENDING_ORIGINATOR_REVIEW && isOriginatorDept && (
              <div className="bg-blue-50/50 p-6 rounded-xl border border-blue-100">
                <h2 className="font-semibold text-lg mb-4 text-blue-900 flex items-center">
                  <CheckCircle className="w-5 h-5 mr-2" /> Originator Review Actions
                </h2>
                <p className="text-sm text-blue-800 mb-4">Review the response from the target department. Accept if satisfactory, or return for corrections.</p>
                
                <div className="space-y-4">
                  <div className="flex gap-4">
                    <button onClick={() => setReviewAction('ACCEPT')} className={`px-4 py-2 rounded border font-medium ${reviewAction==='ACCEPT'?'bg-green-100 border-green-500':'bg-white hover:bg-zinc-50'}`}>Accept Response</button>
                    <button onClick={() => setReviewAction('RETURN')} className={`px-4 py-2 rounded border font-medium ${reviewAction==='RETURN'?'bg-red-100 border-red-500':'bg-white hover:bg-zinc-50'}`}>Return / Not Accept</button>
                  </div>

                  {reviewAction === 'ACCEPT' && (
                    <div className="mt-4">
                      <button onClick={() => handleOriginatorReview('ACCEPT')} className="px-4 py-2 bg-green-600 text-white rounded font-medium">Confirm Accept</button>
                    </div>
                  )}

                  {reviewAction === 'RETURN' && (
                    <div className="space-y-3 p-4 bg-white rounded border mt-4">
                      <label className="block text-sm font-medium">Reason for Return *</label>
                      <textarea className="w-full p-2 border rounded" value={reviewReason} onChange={e=>setReviewReason(e.target.value)}></textarea>
                      <button 
                        onClick={() => handleOriginatorReview('RETURN')} 
                        disabled={!reviewReason}
                        className="mt-2 px-4 py-2 bg-red-600 text-white rounded font-medium disabled:opacity-50"
                      >Confirm Return</button>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* QAQC Final Closure */}
            {record.status === CAPA_STATUS.PENDING_QAQC_CLOSURE && hasPermission(currentUser, PERMISSIONS.CAPA_CLOSE) && (
              <div className="bg-purple-50/50 p-6 rounded-xl border border-purple-100">
                <h2 className="font-semibold text-lg mb-4 text-purple-900 flex items-center">
                  <ShieldAlert className="w-5 h-5 mr-2" /> QAQC Final Closure
                </h2>
                <p className="text-sm text-purple-800 mb-4">The originating department has accepted the response. QAQC may now acknowledge and close the record.</p>
                <button onClick={handleQaqcClose} className="px-4 py-2 bg-purple-600 text-white rounded font-medium">Acknowledge & Close Record</button>
              </div>
            )}
          </div>
        )}

        {/* Phase 11 Component Adapters */}
        {activeTab === 'rca' && <NcCapaRootCauseTab nc={ncCompatibilityRecord} onNcUpdate={loadRecord} />}
        {activeTab === 'actionPlan' && <NcCapaActionPlanTab nc={ncCompatibilityRecord} onNcUpdate={loadRecord} />}
        {activeTab === 'execution' && <NcCapaEvidenceTab nc={ncCompatibilityRecord} onNcUpdate={loadRecord} />}
        {activeTab === 'verification' && <NcCapaQaVerificationTab nc={ncCompatibilityRecord} onNcUpdate={loadRecord} />}
        {activeTab === 'effectiveness' && <NcCapaEffectivenessTab nc={ncCompatibilityRecord} onNcUpdate={loadRecord} />}
        
        {activeTab === 'linked' && (
          <div className="max-w-4xl mx-auto space-y-4">
            <h2 className="text-lg font-semibold">Linked Records</h2>
            <div className="p-4 border rounded-xl bg-white flex items-center justify-between opacity-70">
              <div className="flex flex-col">
                <span className="font-medium">NCR-2026-0099 (Masked)</span>
                <span className="text-sm text-zinc-500">Restricted Record</span>
              </div>
              <span className="text-xs font-semibold bg-zinc-100 px-2 py-1 rounded text-zinc-600">Access Denied</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CapaDetail;
