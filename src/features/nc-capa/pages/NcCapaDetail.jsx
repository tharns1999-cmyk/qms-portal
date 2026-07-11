import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import useStore from '../../../store/useStore';
import { ncCapaService } from '../services/NcCapaService';
import { ncCapaAccessService } from '../services/NcCapaAccessService';
import { ncCapaScreeningService } from '../services/NcCapaScreeningService';
import { ncCapaAuditService } from '../services/NcCapaAuditService';
import { NC_PERMISSIONS, NC_STATUS, CAPARequirementDecision } from '../domain/models';
import { useNcCapaTranslation } from '../locales/ncCapaTranslations';
import { CheckCircle, History, ShieldAlert, User, Search, RefreshCw, XCircle } from 'lucide-react';
import NcCapaRootCauseTab from '../components/NcCapaRootCauseTab';
import NcCapaActionPlanTab from '../components/NcCapaActionPlanTab';
import NcCapaPlanReviewPanel from '../components/NcCapaPlanReviewPanel';

const NcCapaDetail = () => {
  const { ncId } = useParams();
  const navigate = useNavigate();
  const { currentUser, masterDepartments, masterUsers } = useStore();
  const { t } = useNcCapaTranslation();
  
  const [record, setRecord] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [accessDenied, setAccessDenied] = useState(false);
  const [activeTab, setActiveTab] = useState('Overview');
  const [auditEvents, setAuditEvents] = useState([]);

  // Screening state
  const [screeningAction, setScreeningAction] = useState('');
  const [screeningForm, setScreeningForm] = useState({
    severity: '',
    capaRequired: '',
    assignedDepartmentId: '',
    assignedOwnerUserId: '',
    comment: '',
    returnReason: '',
    missingInfoSummary: '',
    rejectionReason: ''
  });
  const [screeningError, setScreeningError] = useState('');

  // Resubmit state
  const [resubmitForm, setResubmitForm] = useState({
    description: '',
    immediateCorrection: '',
    containmentAction: ''
  });
  const [isResubmitting, setIsResubmitting] = useState(false);

  useEffect(() => {
    if (record) {
      setResubmitForm({
        description: record.description || '',
        immediateCorrection: record.immediateCorrection || '',
        containmentAction: record.containmentAction || ''
      });
    }
  }, [record]);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const data = await ncCapaService.getById(ncId);
      if (!data) throw new Error('Not found');
      
      // Access control check
      if (ncCapaAccessService.isRestricted(data) && !currentUser.permissions.includes('NC_CAPA_VIEW_ALL')) {
        setAccessDenied(true);
        return;
      }
      
      setRecord(data);
      setAuditEvents(ncCapaAuditService.getEventsForNc(ncId));
      if (data.severity) {
        setScreeningForm(prev => ({ ...prev, severity: data.severity }));
      }
    } catch (err) {
      console.error(err);
      setError('Could not load NC record');
    } finally {
      setLoading(false);
    }
  }, [ncId, currentUser.permissions]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  if (loading) return <div className="p-8">Loading...</div>;

  if (accessDenied || error) {
    return (
      <div className="p-8 max-w-7xl mx-auto text-center">
        <h1 className="text-2xl font-bold text-red-600 mb-2">{error || t('detail', 'accessDenied')}</h1>
        <button onClick={() => navigate('/nc-capa/list')} className="text-blue-600 hover:underline">Back to List</button>
      </div>
    );
  }

  if (!record) {
    return (
      <div className="p-8 max-w-7xl mx-auto text-center">
        <h1 className="text-2xl font-bold text-zinc-900 mb-2">{t('detail', 'notFound')}</h1>
        <button onClick={() => navigate('/nc-capa/list')} className="text-blue-600 hover:underline">Back to List</button>
      </div>
    );
  }

  if (ncCapaAccessService.isRestricted(record, currentUser)) {
    return (
      <div className="p-8 max-w-7xl mx-auto">
        <h1 className="text-2xl font-bold text-red-600 mb-4">{t('detail', 'accessDenied')}</h1>
        <p className="text-zinc-600">{t('detail', 'restricted')}</p>
        <button onClick={() => navigate('/nc-capa')} className="mt-4 text-blue-600 hover:underline">Back to Dashboard</button>
      </div>
    );
  }

  const handleScreeningSubmit = async () => {
    try {
      setScreeningError('');
      if (screeningAction === 'ACCEPT') {
        if (!screeningForm.severity || !screeningForm.capaRequired) {
          useStore.getState().addNotification('Please select severity and CAPA decision.', 'error');
          return;
        }
        await ncCapaScreeningService.acceptAsNc(record, screeningForm, currentUser.id);
      } else if (screeningAction === 'RETURN') {
        await ncCapaScreeningService.returnForInfo(record, screeningForm, currentUser.id);
      } else if (screeningAction === 'REJECT') {
        await ncCapaScreeningService.rejectAsNotNc(record, screeningForm, currentUser.id);
      }
      
      // Reload record to reflect status change
      await loadData();
      setScreeningAction('');
    } catch (err) {
      setScreeningError(err.message);
    }
  };

  const handleResubmit = async () => {
    try {
      setIsResubmitting(true);
      await ncCapaService.resubmitReturnedNc(record, resubmitForm, currentUser.id);
      await loadData();
    } catch (err) {
      console.error(err);
      useStore.getState().addNotification('Error resubmitting NC', 'error');
    } finally {
      setIsResubmitting(false);
    }
  };

  const handleRcaSaveDraft = async (rcaData) => {
    await ncCapaService.saveRootCauseAnalysisDraft(record.id, rcaData);
    useStore.getState().addNotification('RCA draft saved', 'success');
    await loadData();
  };

  const handleRcaSubmit = async (rcaData) => {
    await ncCapaService.submitRootCauseAnalysis(record.id, rcaData, currentUser.id);
    useStore.getState().addNotification('Root Cause Analysis submitted', 'success');
    await loadData();
    setActiveTab('CAPA Action');
  };

  const handleCapaSaveDraft = async (planData) => {
    await ncCapaService.saveCapaPlanDraft(record.id, planData);
    useStore.getState().addNotification('CAPA Plan draft saved', 'success');
    await loadData();
  };

  const handleCapaSubmit = async (planData) => {
    await ncCapaService.submitCapaPlan(record.id, planData, currentUser.id);
    useStore.getState().addNotification('CAPA Plan submitted for review', 'success');
    await loadData();
    setActiveTab('Overview');
  };

  const handlePlanApprove = async (reviewData) => {
    await ncCapaService.approveCapaPlan(record.id, reviewData, currentUser.id);
    useStore.getState().addNotification('CAPA Plan Approved', 'success');
    await loadData();
  };

  const handlePlanReturn = async (reviewData) => {
    await ncCapaService.returnCapaPlan(record.id, reviewData, currentUser.id);
    useStore.getState().addNotification('CAPA Plan Returned for correction', 'warning');
    await loadData();
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'DRAFT': return 'bg-zinc-100 text-zinc-800';
      case 'SUBMITTED':
      case 'SCREENING': return 'bg-blue-100 text-blue-800';
      case 'RETURNED_FOR_INFO': return 'bg-orange-100 text-orange-800';
      case 'REJECTED_NOT_NC': return 'bg-red-100 text-red-800';
      case 'ASSIGNED': return 'bg-purple-100 text-purple-800';
      case 'QA_VERIFICATION': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-zinc-100 text-zinc-800';
    }
  };

  const renderScreeningActionPanel = () => {
    if (record.status !== NC_STATUS.SCREENING) return null;
    if (!ncCapaAccessService.hasPermission(currentUser, NC_PERMISSIONS.SCREEN)) {
      return <div className="p-4 bg-zinc-50 rounded-lg text-sm text-zinc-500">QA/QC Screening in progress...</div>;
    }

    return (
      <div className="bg-white rounded-xl border-2 border-blue-100 shadow-sm overflow-hidden mb-6">
        <div className="bg-blue-50 px-6 py-4 border-b border-blue-100 flex items-center justify-between">
          <div className="flex items-center">
            <ShieldAlert size={20} className="text-blue-600 mr-2" />
            <h3 className="font-bold text-blue-900">{t('screening', 'title')}</h3>
          </div>
          <span className="text-xs font-medium text-blue-600 bg-blue-100 px-2 py-1 rounded">Required</span>
        </div>
        
        <div className="p-6">
          {!screeningAction ? (
            <div className="flex flex-col md:flex-row gap-4">
              <button 
                onClick={() => setScreeningAction('ACCEPT')}
                className="flex-1 py-3 px-4 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 flex justify-center items-center"
              >
                <CheckCircle size={18} className="mr-2" />
                {t('screening', 'accept')}
              </button>
              <button 
                onClick={() => setScreeningAction('RETURN')}
                className="flex-1 py-3 px-4 bg-orange-100 text-orange-800 border border-orange-200 rounded-lg font-medium hover:bg-orange-200 flex justify-center items-center"
              >
                <RefreshCw size={18} className="mr-2" />
                {t('screening', 'return')}
              </button>
              <button 
                onClick={() => setScreeningAction('REJECT')}
                className="flex-1 py-3 px-4 bg-red-50 text-red-700 border border-red-200 rounded-lg font-medium hover:bg-red-100 flex justify-center items-center"
              >
                <XCircle size={18} className="mr-2" />
                {t('screening', 'reject')}
              </button>
            </div>
          ) : (
            <div className="space-y-4 animate-in fade-in">
              <div className="flex items-center justify-between mb-4 border-b pb-2">
                <h4 className="font-semibold text-lg capitalize">{screeningAction.toLowerCase()} Decision</h4>
                <button onClick={() => setScreeningAction('')} className="text-zinc-400 hover:text-zinc-700">Cancel</button>
              </div>

              {screeningError && (
                <div className="p-3 bg-red-50 text-red-700 rounded border border-red-200 text-sm">
                  {screeningError}
                </div>
              )}

              {screeningAction === 'ACCEPT' && (
                <div className="space-y-4">
                  <div>
                    <label htmlFor="screeningSeverity" className="block text-sm font-medium mb-1">Confirm Severity</label>
                    <select 
                      id="screeningSeverity"
                      className="w-full p-2 border rounded"
                      value={screeningForm.severity}
                      onChange={e => setScreeningForm({...screeningForm, severity: e.target.value})}
                    >
                      <option value="">Select Severity...</option>
                      {['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'].map(s => <option key={s} value={s}>{t('severity', s)}</option>)}
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium mb-1">{t('screening', 'capaDecision')}</label>
                    <div className="flex gap-4">
                      <label htmlFor="capaReqTrue" className="flex items-center">
                        <input id="capaReqTrue" type="radio" name="capaReq" className="mr-2"
                          checked={screeningForm.capaRequired === CAPARequirementDecision.CAPA_REQUIRED}
                          onChange={() => setScreeningForm({...screeningForm, capaRequired: CAPARequirementDecision.CAPA_REQUIRED})}
                        />
                        {t('screening', 'capaRequired')}
                      </label>
                      <label htmlFor="capaReqFalse" className="flex items-center">
                        <input id="capaReqFalse" type="radio" name="capaReq" className="mr-2"
                          checked={screeningForm.capaRequired === CAPARequirementDecision.CORRECTION_ONLY}
                          onChange={() => setScreeningForm({...screeningForm, capaRequired: CAPARequirementDecision.CORRECTION_ONLY})}
                        />
                        {t('screening', 'correctionOnly')}
                      </label>
                    </div>
                  </div>

                  {screeningForm.capaRequired === CAPARequirementDecision.CAPA_REQUIRED && (
                    <div className="grid grid-cols-2 gap-4 bg-zinc-50 p-4 rounded border">
                      <div>
                        <label className="block text-sm font-medium mb-1">{t('screening', 'assignDept')}</label>
                        <select 
                          className="w-full p-2 border rounded"
                          value={screeningForm.assignedDepartmentId}
                          onChange={e => setScreeningForm({...screeningForm, assignedDepartmentId: e.target.value})}
                        >
                          <option value="">Select Department...</option>
                          {masterDepartments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-1">{t('screening', 'assignOwner')}</label>
                        <select 
                          className="w-full p-2 border rounded"
                          value={screeningForm.assignedOwnerUserId}
                          onChange={e => setScreeningForm({...screeningForm, assignedOwnerUserId: e.target.value})}
                        >
                          <option value="">Select Owner...</option>
                          {masterUsers.filter(u => !screeningForm.assignedDepartmentId || u.depts.includes(screeningForm.assignedDepartmentId)).map(u => (
                            <option key={u.id} value={u.id}>{u.name}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                  )}
                  
                  <div>
                    <label className="block text-sm font-medium mb-1">{t('screening', 'comment')}</label>
                    <textarea 
                      className="w-full p-2 border rounded" rows="2"
                      value={screeningForm.comment}
                      onChange={e => setScreeningForm({...screeningForm, comment: e.target.value})}
                    ></textarea>
                  </div>
                </div>
              )}

              {screeningAction === 'RETURN' && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">{t('screening', 'returnReason')}</label>
                    <textarea 
                      className="w-full p-2 border rounded" rows="3"
                      value={screeningForm.returnReason}
                      onChange={e => setScreeningForm({...screeningForm, returnReason: e.target.value})}
                    ></textarea>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">{t('screening', 'missingInfo')}</label>
                    <input 
                      type="text" className="w-full p-2 border rounded"
                      value={screeningForm.missingInfoSummary}
                      onChange={e => setScreeningForm({...screeningForm, missingInfoSummary: e.target.value})}
                    />
                  </div>
                </div>
              )}

              {screeningAction === 'REJECT' && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">{t('screening', 'rejectReason')}</label>
                    <textarea 
                      className="w-full p-2 border rounded" rows="3"
                      value={screeningForm.rejectionReason}
                      onChange={e => setScreeningForm({...screeningForm, rejectionReason: e.target.value})}
                    ></textarea>
                  </div>
                </div>
              )}

              <div className="flex justify-end pt-4">
                <button 
                  onClick={handleScreeningSubmit}
                  className="px-6 py-2 bg-blue-600 text-white rounded font-medium hover:bg-blue-700"
                >
                  Confirm Decision
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  };

  const renderResubmitPanel = () => {
    if (record.status !== NC_STATUS.RETURNED_FOR_INFO) return null;
    if (record.reportedByUserId !== currentUser.id) {
      return <div className="p-4 bg-orange-50 rounded-lg text-sm text-orange-800 border border-orange-200 mb-6">This NC was returned for more information. Waiting for the reporter to resubmit.</div>;
    }

    return (
      <div className="bg-white rounded-xl border-2 border-orange-200 shadow-sm overflow-hidden mb-6">
        <div className="bg-orange-50 px-6 py-4 border-b border-orange-100 flex items-center justify-between">
          <div className="flex items-center">
            <RefreshCw size={20} className="text-orange-600 mr-2" />
            <h3 className="font-bold text-orange-900">Action Required: Resubmit NC</h3>
          </div>
          <span className="text-xs font-medium text-orange-600 bg-orange-100 px-2 py-1 rounded">Required</span>
        </div>
        
        <div className="p-6 space-y-4">
          <div className="bg-orange-50 p-4 rounded text-sm text-orange-900 border border-orange-100">
            <strong>Return Reason:</strong> {record.screeningComment}
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Update Problem Description</label>
            <textarea 
              className="w-full p-2 border rounded" rows="3"
              value={resubmitForm.description}
              onChange={e => setResubmitForm({...resubmitForm, description: e.target.value})}
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-1">Update Immediate Correction</label>
            <textarea 
              className="w-full p-2 border rounded" rows="2"
              value={resubmitForm.immediateCorrection}
              onChange={e => setResubmitForm({...resubmitForm, immediateCorrection: e.target.value})}
            />
          </div>

          {!record.containmentNotRequired && (
            <div>
              <label className="block text-sm font-medium mb-1">Update Containment Action</label>
              <textarea 
                className="w-full p-2 border rounded" rows="2"
                value={resubmitForm.containmentAction}
                onChange={e => setResubmitForm({...resubmitForm, containmentAction: e.target.value})}
              />
            </div>
          )}

          <div className="flex justify-end pt-4">
            <button 
              onClick={handleResubmit}
              disabled={isResubmitting}
              className="px-6 py-2 bg-orange-600 text-white rounded font-medium hover:bg-orange-700 disabled:opacity-50"
            >
              {isResubmitting ? 'Resubmitting...' : 'Resubmit NC'}
            </button>
          </div>
        </div>
      </div>
    );
  };

  const renderPlanReviewPanel = () => {
    if (record.status !== NC_STATUS.CAPA_PLAN_REVIEW) return null;
    
    // Check permission to review plan
    if (!currentUser.permissions.includes('NC_CAPA_PLAN_REVIEW')) {
      return (
        <div className="p-4 bg-indigo-50 rounded-lg text-sm text-indigo-800 border border-indigo-200 mb-6">
          This CAPA Plan is currently pending QA/QC review.
        </div>
      );
    }

    return (
      <NcCapaPlanReviewPanel 
        record={record} 
        currentUser={currentUser} 
        onApprove={handlePlanApprove} 
        onReturn={handlePlanReturn} 
      />
    );
  };

  const tabs = ['Overview', 'Detail', 'Screening', 'Root Cause', 'CAPA Action', 'History', 'Audit'];
  const futureTabs = ['Evidence', 'QA Verification'];

  return (
    <div className="p-4 md:p-8 max-w-6xl mx-auto pb-24">
      <div className="mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <h1 className="text-2xl font-bold text-zinc-900">{record.ncNumber || 'Draft'}</h1>
            <span className={`px-2.5 py-1 text-xs font-semibold rounded-full ${getStatusColor(record.status)}`}>
              {t('status', record.status)}
            </span>
            <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-zinc-100 text-zinc-600">
              {t('severity', record.severity)}
            </span>
          </div>
          <h2 className="text-lg text-zinc-600">{record.title}</h2>
        </div>
        <button 
          onClick={() => navigate('/nc-capa/list')}
          className="text-zinc-500 hover:text-zinc-900 px-4 py-2 border rounded-lg bg-white"
        >
          Back to List
        </button>
      </div>

      {renderScreeningActionPanel()}
      {renderResubmitPanel()}
      {renderPlanReviewPanel()}

      <div className="flex overflow-x-auto border-b border-zinc-200 mb-6 pb-[1px] scrollbar-hide">
        {tabs.map(tab => (
          <button 
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-3 font-medium whitespace-nowrap transition-colors border-b-2 -mb-[1px] ${
              activeTab === tab 
                ? 'border-blue-600 text-blue-600' 
                : 'border-transparent text-zinc-500 hover:text-zinc-800'
            }`}
          >
            {tab}
          </button>
        ))}
        {futureTabs.map(tab => (
          <div 
            key={tab}
            className="px-4 py-3 font-medium whitespace-nowrap text-zinc-300 cursor-not-allowed flex items-center"
            title="Available in future phases"
          >
            {tab}
          </div>
        ))}
      </div>

      <div className="bg-white rounded-xl border border-zinc-200 shadow-sm p-6">
        {activeTab === 'Overview' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <h3 className="font-semibold text-lg border-b pb-2">Information</h3>
              <div className="grid grid-cols-2 gap-y-4 text-sm">
                <div>
                  <span className="text-zinc-500 block text-xs uppercase tracking-wider">Source Type</span>
                  <span className="font-medium">{record.sourceType || '-'}</span>
                </div>
                <div>
                  <span className="text-zinc-500 block text-xs uppercase tracking-wider">Detected Date</span>
                  <span className="font-medium">{record.detectedDate || '-'}</span>
                </div>
                <div>
                  <span className="text-zinc-500 block text-xs uppercase tracking-wider">Department</span>
                  <span className="font-medium">{masterDepartments.find(d => d.id === record.departmentId)?.name || record.departmentId || '-'}</span>
                </div>
                <div>
                  <span className="text-zinc-500 block text-xs uppercase tracking-wider">Reported By</span>
                  <span className="font-medium">{record.reportedByUserId || '-'}</span>
                </div>
              </div>
            </div>
            
            <div className="space-y-4">
              <h3 className="font-semibold text-lg border-b pb-2">Impact Flags</h3>
              <div className="space-y-2">
                <div className="flex items-center justify-between p-2 bg-zinc-50 rounded">
                  <span className="text-sm">Food Safety Impact</span>
                  {record.foodSafetyImpact ? <CheckCircle size={16} className="text-red-500" /> : <span className="text-zinc-300">-</span>}
                </div>
                <div className="flex items-center justify-between p-2 bg-zinc-50 rounded">
                  <span className="text-sm">Customer Impact</span>
                  {record.customerImpact ? <CheckCircle size={16} className="text-orange-500" /> : <span className="text-zinc-300">-</span>}
                </div>
                <div className="flex items-center justify-between p-2 bg-zinc-50 rounded">
                  <span className="text-sm">Regulatory Impact</span>
                  {record.regulatoryImpact ? <CheckCircle size={16} className="text-purple-500" /> : <span className="text-zinc-300">-</span>}
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'Detail' && (
          <div className="space-y-6">
            <div>
              <h3 className="font-semibold text-lg border-b pb-2 mb-4">Problem Description</h3>
              <p className="text-zinc-800 whitespace-pre-wrap bg-zinc-50 p-4 rounded-lg">{record.description || 'No description provided.'}</p>
            </div>
            <div>
              <h3 className="font-semibold text-lg border-b pb-2 mb-4">Immediate Correction</h3>
              <p className="text-zinc-800 whitespace-pre-wrap bg-zinc-50 p-4 rounded-lg">{record.immediateCorrection || 'Not provided.'}</p>
            </div>
            <div>
              <h3 className="font-semibold text-lg border-b pb-2 mb-4">Containment Action</h3>
              {record.containmentNotRequired ? (
                <div className="bg-zinc-50 p-4 rounded-lg border-l-4 border-blue-500">
                  <span className="font-medium">Not Required: </span>
                  {record.containmentNotRequiredReason}
                </div>
              ) : (
                <p className="text-zinc-800 whitespace-pre-wrap bg-zinc-50 p-4 rounded-lg">{record.containmentAction || 'Not provided.'}</p>
              )}
            </div>
          </div>
        )}

        {activeTab === 'Screening' && (
          <div className="space-y-6">
            <h3 className="font-semibold text-lg border-b pb-2 mb-4">QA/QC Screening Result</h3>
            {record.screeningResult ? (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-zinc-50 p-3 rounded">
                    <span className="text-zinc-500 block text-xs uppercase">Decision</span>
                    <span className="font-semibold text-blue-700">{record.screeningResult.replace(/_/g, ' ')}</span>
                  </div>
                  {record.capaRequired && (
                    <div className="bg-zinc-50 p-3 rounded">
                      <span className="text-zinc-500 block text-xs uppercase">CAPA Required</span>
                      <span className="font-medium">{record.capaRequired.replace(/_/g, ' ')}</span>
                    </div>
                  )}
                </div>
                {record.assignedOwnerUserId && (
                  <div className="bg-blue-50 p-3 rounded border border-blue-100 flex items-center">
                    <User size={16} className="text-blue-500 mr-2" />
                    <span className="text-sm">
                      Assigned to <strong>{masterUsers.find(u => u.id === record.assignedOwnerUserId)?.name || record.assignedOwnerUserId}</strong> 
                      in {masterDepartments.find(d => d.id === record.assignedDepartmentId)?.name || record.assignedDepartmentId}
                    </span>
                  </div>
                )}
                <div>
                  <span className="text-zinc-500 block text-xs uppercase mb-1">QA Comment</span>
                  <div className="bg-white border p-3 rounded">{record.screeningComment || '-'}</div>
                </div>
              </div>
            ) : (
              <div className="text-center py-8 text-zinc-500">
                <Search size={48} className="mx-auto text-zinc-300 mb-3" />
                <p>Screening has not been completed yet.</p>
              </div>
            )}
          </div>
        )}

        {activeTab === 'Root Cause' && (
          <NcCapaRootCauseTab 
            record={record} 
            currentUser={currentUser}
            onSaveDraft={handleRcaSaveDraft}
            onSubmit={handleRcaSubmit}
            isReadOnly={record.status !== NC_STATUS.ASSIGNED && record.status !== NC_STATUS.ROOT_CAUSE_IN_PROGRESS}
          />
        )}

        {activeTab === 'CAPA Action' && (
          <NcCapaActionPlanTab 
            record={record} 
            currentUser={currentUser}
            onSaveDraft={handleCapaSaveDraft}
            onSubmit={handleCapaSubmit}
            isReadOnly={record.status !== NC_STATUS.CAPA_PLAN_REQUIRED && record.status !== NC_STATUS.CAPA_PLAN_RETURNED}
          />
        )}

        {activeTab === 'History' && (
          <div className="text-center py-12 text-zinc-500">
            <History size={48} className="mx-auto text-zinc-300 mb-3" />
            <p>Comment history will be implemented in future phases.</p>
          </div>
        )}

        {activeTab === 'Audit' && (
          <div className="space-y-4">
            <h3 className="font-semibold text-lg border-b pb-2 mb-4">System Audit Trail</h3>
            {auditEvents.length > 0 ? (
              <div className="relative border-l-2 border-zinc-200 ml-4 space-y-6 pb-4">
                {auditEvents.map(event => (
                  <div key={event.id} className="relative pl-6">
                    <div className="absolute -left-[9px] top-1 w-4 h-4 rounded-full bg-blue-500 border-4 border-white"></div>
                    <div className="flex flex-col md:flex-row md:justify-between md:items-start mb-1">
                      <h4 className="font-medium text-zinc-900">{event.action.replace(/_/g, ' ')}</h4>
                      <span className="text-xs text-zinc-500">{new Date(event.timestamp).toLocaleString()}</span>
                    </div>
                    <p className="text-sm text-zinc-600">{event.details}</p>
                    {event.comment && (
                      <div className="mt-2 text-sm bg-zinc-50 p-2 rounded italic text-zinc-600 border-l-2 border-zinc-300">
                        "{event.comment}"
                      </div>
                    )}
                    <div className="mt-1 text-xs text-zinc-400">By: {masterUsers.find(u => u.id === event.actorId)?.name || event.actorId}</div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-zinc-500">No audit events found.</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default NcCapaDetail;
