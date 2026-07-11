import React, { useState } from 'react';
import { VerificationResult, CAPAActionStatus } from '../domain/models';
import useStore from '../../../store/useStore';
import { CheckCircle, XCircle, RefreshCcw, FileText, CheckSquare, MessageSquare, AlertTriangle } from 'lucide-react';

const NcCapaQaVerificationTab = ({ record, onVerifyAction, isReadOnly }) => {
  const { masterUsers, checkPermission } = useStore();
  
  const [activeActionId, setActiveActionId] = useState(null);
  const [form, setForm] = useState({
    comment: '',
    checkEvidence: false,
    checkCriteria: false,
    checkRootCause: false
  });
  
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const actions = record?.capaActionPlan?.actions || [];
  const pendingActions = actions.filter(a => a.status === CAPAActionStatus.EVIDENCE_SUBMITTED);
  const completedActions = actions.filter(a => [CAPAActionStatus.VERIFIED, CAPAActionStatus.FAILED_VERIFICATION, CAPAActionStatus.RETURNED_FOR_CORRECTION].includes(a.status));
  const upcomingActions = actions.filter(a => [CAPAActionStatus.PENDING_EXECUTION, CAPAActionStatus.IN_PROGRESS, CAPAActionStatus.PLANNED].includes(a.status));

  const canVerify = checkPermission('NC_CAPA_VERIFY');

  const handleStartVerification = (actionId) => {
    setActiveActionId(actionId);
    setForm({
      comment: '',
      checkEvidence: false,
      checkCriteria: false,
      checkRootCause: false
    });
    setError('');
  };

  const handleCancelVerification = () => {
    setActiveActionId(null);
    setError('');
  };

  const handleVerify = async (action, result) => {
    if (result === VerificationResult.PASS) {
      if (action.evidenceRequired && !form.checkEvidence) {
        setError('You must confirm the evidence is complete.');
        return;
      }
      if (!form.checkCriteria || !form.checkRootCause) {
        setError('You must confirm all checklist items to Pass verification.');
        return;
      }
    }

    if (!form.comment.trim()) {
      setError(`A comment is required to ${result === VerificationResult.PASS ? 'Pass' : 'Return or Fail'} the action.`);
      return;
    }

    try {
      setIsSubmitting(true);
      setError('');
      await onVerifyAction(action.id, {
        result,
        comment: form.comment
      });
      setActiveActionId(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderActionVerification = (action) => {
    const isVerifying = activeActionId === action.id;
    const responsibleName = masterUsers.find(u => u.id === action.responsibleUserId)?.name || action.responsibleUserId;
    
    return (
      <div key={action.id} className="border border-purple-200 bg-white rounded-lg p-5 mb-4 shadow-sm">
        <div className="flex justify-between items-start mb-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2 py-0.5 rounded text-xs font-medium bg-purple-100 text-purple-800">
                Pending Verification
              </span>
              {action.evidenceRequired && (
                <span className="px-2 py-0.5 rounded text-xs font-medium bg-zinc-100 text-zinc-700 border flex items-center">
                  <FileText size={12} className="mr-1" /> Evidence Required
                </span>
              )}
            </div>
            <h4 className="font-medium text-lg text-zinc-900">{action.description}</h4>
            <div className="text-sm text-zinc-500 mt-1">
              Owner: <span className="font-medium text-zinc-700">{responsibleName}</span>
            </div>
          </div>
          <div className="text-right">
            <span className="text-sm bg-blue-50 text-blue-700 px-3 py-1 rounded-full border border-blue-200">
              Progress: 100%
            </span>
          </div>
        </div>

        {/* Evidence Display */}
        {action.evidenceMetadata ? (
          <div className="bg-zinc-50 p-3 rounded border mb-4">
            <h5 className="text-sm font-medium text-zinc-800 mb-2">Submitted Evidence Metadata</h5>
            <div className="flex items-center justify-between bg-white p-2 border rounded text-sm mb-2">
              <div className="flex items-center">
                <FileText size={16} className="text-blue-500 mr-2" />
                <span className="font-medium">{action.evidenceMetadata.filename}</span>
                <span className="text-zinc-400 ml-2">({Math.round(action.evidenceMetadata.sizeBytes / 1024)} KB)</span>
              </div>
              <span className="text-xs text-zinc-500 bg-zinc-100 px-2 py-0.5 rounded border">
                {action.evidenceMetadata.validationStatus}
              </span>
            </div>
            {action.evidenceMetadata.comment && (
              <div className="text-sm text-zinc-600 italic">Owner Comment: "{action.evidenceMetadata.comment}"</div>
            )}
          </div>
        ) : (
          <div className="bg-orange-50 p-3 rounded border border-orange-200 text-orange-800 text-sm mb-4 flex items-center">
            <AlertTriangle size={16} className="mr-2" /> No evidence metadata was attached to this action.
          </div>
        )}

        {isVerifying ? (
          <div className="border-t pt-4 mt-2">
            <h5 className="font-medium mb-3 flex items-center text-zinc-800">
              <CheckSquare size={16} className="mr-2 text-blue-600" /> Verification Checklist
            </h5>
            
            <div className="space-y-3 mb-5 bg-zinc-50 p-4 rounded border">
              {action.evidenceRequired && (
                <label className="flex items-start gap-3 cursor-pointer">
                  <input 
                    type="checkbox" 
                    className="mt-1"
                    checked={form.checkEvidence}
                    onChange={e => setForm({...form, checkEvidence: e.target.checked})}
                  />
                  <div className="text-sm">
                    <span className="font-medium block text-zinc-800">Evidence Complete</span>
                    <span className="text-zinc-500">The submitted evidence metadata adequately demonstrates completion.</span>
                  </div>
                </label>
              )}
              <label className="flex items-start gap-3 cursor-pointer">
                <input 
                  type="checkbox" 
                  className="mt-1"
                  checked={form.checkCriteria}
                  onChange={e => setForm({...form, checkCriteria: e.target.checked})}
                />
                <div className="text-sm">
                  <span className="font-medium block text-zinc-800">Criteria Met</span>
                  <span className="text-zinc-500">The action meets the acceptance criteria: <strong className="font-normal text-zinc-700 italic">"{action.acceptanceCriteria}"</strong></span>
                </div>
              </label>
              <label className="flex items-start gap-3 cursor-pointer">
                <input 
                  type="checkbox" 
                  className="mt-1"
                  checked={form.checkRootCause}
                  onChange={e => setForm({...form, checkRootCause: e.target.checked})}
                />
                <div className="text-sm">
                  <span className="font-medium block text-zinc-800">Effectively Addressed</span>
                  <span className="text-zinc-500">The action effectively addresses the identified root cause or problem.</span>
                </div>
              </label>
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium mb-1 flex items-center text-zinc-800">
                <MessageSquare size={14} className="mr-1" /> Verification Comment <span className="text-red-500 ml-1">*</span>
              </label>
              <textarea 
                className="w-full p-2 border rounded text-sm" rows="3"
                value={form.comment}
                onChange={e => setForm({...form, comment: e.target.value})}
                placeholder="Provide reasons for Pass/Return/Fail..."
              ></textarea>
            </div>

            {error && <div className="text-red-600 text-sm p-3 bg-red-50 border border-red-200 rounded mb-4">{error}</div>}

            <div className="flex justify-between items-center">
              <button 
                onClick={handleCancelVerification}
                className="px-4 py-2 text-sm text-zinc-600 hover:bg-zinc-100 rounded"
                disabled={isSubmitting}
              >
                Cancel
              </button>
              <div className="flex gap-2">
                <button 
                  onClick={() => handleVerify(action, VerificationResult.FAIL)}
                  className="px-4 py-2 bg-white border border-red-200 text-red-600 hover:bg-red-50 rounded text-sm font-medium flex items-center"
                  disabled={isSubmitting}
                >
                  <XCircle size={16} className="mr-1" /> Fail
                </button>
                <button 
                  onClick={() => handleVerify(action, VerificationResult.RETURN_FOR_CORRECTION)}
                  className="px-4 py-2 bg-white border border-orange-200 text-orange-600 hover:bg-orange-50 rounded text-sm font-medium flex items-center"
                  disabled={isSubmitting}
                >
                  <RefreshCcw size={16} className="mr-1" /> Return
                </button>
                <button 
                  onClick={() => handleVerify(action, VerificationResult.PASS)}
                  className="px-6 py-2 bg-green-600 text-white hover:bg-green-700 rounded text-sm font-medium flex items-center"
                  disabled={isSubmitting}
                >
                  <CheckCircle size={16} className="mr-1" /> Pass
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex justify-end mt-4 pt-4 border-t">
            {canVerify && !isReadOnly && (
              <button 
                onClick={() => handleStartVerification(action.id)}
                className="px-6 py-2 bg-purple-600 text-white rounded text-sm font-medium hover:bg-purple-700 flex items-center"
              >
                Verify Action
              </button>
            )}
          </div>
        )}
      </div>
    );
  };

  const renderCompletedAction = (action) => (
    <div key={action.id} className="border border-zinc-200 bg-zinc-50 rounded-lg p-4 mb-3 flex items-start justify-between">
      <div>
        <h5 className="font-medium text-sm text-zinc-800 mb-1">{action.description}</h5>
        <div className="text-xs text-zinc-500 mb-2">
          By {masterUsers.find(u => u.id === action.responsibleUserId)?.name || action.responsibleUserId}
        </div>
        {action.verificationComment && (
          <div className="text-xs text-zinc-600 italic border-l-2 pl-2 border-zinc-300">
            QA: {action.verificationComment}
          </div>
        )}
      </div>
      <div className="text-right ml-4">
        <span className={`px-2 py-0.5 rounded text-xs font-medium whitespace-nowrap ${
          action.status === 'VERIFIED' ? 'bg-green-100 text-green-800 border border-green-200' :
          action.status === 'FAILED_VERIFICATION' ? 'bg-red-100 text-red-800 border border-red-200' :
          'bg-orange-100 text-orange-800 border border-orange-200'
        }`}>
          {action.status.replace(/_/g, ' ')}
        </span>
      </div>
    </div>
  );

  const renderUpcomingAction = (action) => (
    <div key={action.id} className="border border-zinc-100 bg-white rounded-lg p-4 mb-2 flex items-center justify-between opacity-60">
      <div>
        <h5 className="font-medium text-sm text-zinc-700">{action.description}</h5>
      </div>
      <div>
        <span className="text-xs text-zinc-500">{action.status.replace(/_/g, ' ')}</span>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center mb-4">
        <h3 className="font-semibold text-lg border-b pb-2 flex-grow">QA Verification</h3>
      </div>

      {!canVerify && !isReadOnly && (
        <div className="bg-yellow-50 text-yellow-800 p-3 rounded border border-yellow-200 text-sm mb-4">
          You do not have the required permissions to verify actions.
        </div>
      )}

      {pendingActions.length > 0 && (
        <div className="mb-8">
          <h4 className="text-md font-medium text-purple-900 mb-4 flex items-center">
            Pending QA Verification
            <span className="ml-2 bg-purple-100 text-purple-800 text-xs py-0.5 px-2 rounded-full">{pendingActions.length}</span>
          </h4>
          <div className="space-y-2">
            {pendingActions.map(action => renderActionVerification(action))}
          </div>
        </div>
      )}

      {completedActions.length > 0 && (
        <div className="mb-6">
          <h4 className="text-sm font-medium text-zinc-700 mb-3">Recently Verified</h4>
          <div>
            {completedActions.map(action => renderCompletedAction(action))}
          </div>
        </div>
      )}

      {upcomingActions.length > 0 && (
        <div>
          <h4 className="text-sm font-medium text-zinc-500 mb-3">Upcoming (Not Yet Submitted)</h4>
          <div>
            {upcomingActions.map(action => renderUpcomingAction(action))}
          </div>
        </div>
      )}

      {actions.length === 0 && (
        <div className="text-center py-10 bg-zinc-50 rounded border border-dashed text-zinc-500">
          No actions have been planned yet.
        </div>
      )}
    </div>
  );
};

export default NcCapaQaVerificationTab;
