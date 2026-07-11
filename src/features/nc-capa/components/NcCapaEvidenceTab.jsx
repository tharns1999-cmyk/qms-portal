import React, { useState } from 'react';
import { EvidenceValidationStatus } from '../domain/models';
import useStore from '../../../store/useStore';
import { CheckCircle, AlertCircle, FileText, Upload, X, Play, RefreshCw, MessageSquare } from 'lucide-react';

const NcCapaEvidenceTab = ({ record, onUpdateProgress, onSubmitForVerification, isReadOnly }) => {
  const { masterUsers, currentUser } = useStore();
  
  const [editingActionId, setEditingActionId] = useState(null);
  const [form, setForm] = useState({
    progressPercent: 0,
    progressComment: '',
    evidenceFile: null, // mock file object: { name, type, size }
    evidenceComment: ''
  });
  
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const actions = record?.capaActionPlan?.actions || [];
  
  // View states
  const myActions = actions.filter(a => a.responsibleUserId === currentUser?.id);
  const otherActions = actions.filter(a => a.responsibleUserId !== currentUser?.id);

  const handleStartEdit = (action) => {
    setEditingActionId(action.id);
    setForm({
      progressPercent: action.progressPercent || 0,
      progressComment: action.progressComment || '',
      evidenceFile: null,
      evidenceComment: action.evidenceMetadata?.comment || ''
    });
    setError('');
  };

  const handleCancelEdit = () => {
    setEditingActionId(null);
    setError('');
  };

  const handleMockFileSelect = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Validate size (mock 10MB)
    if (file.size > 10 * 1024 * 1024) {
      setError('File is too large. Maximum size is 10MB.');
      return;
    }

    // Validate type
    const validTypes = ['application/pdf', 'image/jpeg', 'image/png', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
    if (!validTypes.includes(file.type)) {
      setError('Invalid file type. Allowed: PDF, JPG, PNG, XLSX, DOCX.');
      return;
    }

    setForm({
      ...form,
      evidenceFile: {
        name: file.name,
        type: file.type,
        size: file.size
      }
    });
    setError('');
  };

  const handleRemoveMockFile = () => {
    setForm({ ...form, evidenceFile: null });
  };

  const handleSaveProgress = async (action) => {
    try {
      setIsSubmitting(true);
      setError('');
      
      const updateData = {
        progressPercent: parseInt(form.progressPercent, 10),
        progressComment: form.progressComment
      };

      if (form.evidenceFile) {
        updateData.evidenceMetadata = {
          id: `EVID-${Date.now()}`,
          filename: form.evidenceFile.name,
          mimeType: form.evidenceFile.type,
          sizeBytes: form.evidenceFile.size,
          uploadedAt: new Date().toISOString(),
          comment: form.evidenceComment,
          validationStatus: EvidenceValidationStatus.VALID_METADATA
        };
      }

      await onUpdateProgress(action.id, updateData);
      setEditingActionId(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubmitVerification = async (action) => {
    if (action.evidenceRequired && (!action.evidenceMetadata || action.evidenceMetadata.validationStatus !== EvidenceValidationStatus.VALID_METADATA)) {
      setError('Valid evidence is required before submitting for verification.');
      return;
    }

    try {
      setIsSubmitting(true);
      setError('');
      await onSubmitForVerification(action.id);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderActionCard = (action, isMine) => {
    const isEditing = editingActionId === action.id;
    const canEdit = isMine && !isReadOnly && ['PENDING_EXECUTION', 'PLANNED', 'IN_PROGRESS', 'RETURNED_FOR_CORRECTION'].includes(action.status);
    const canSubmit = isMine && !isReadOnly && action.status === 'IN_PROGRESS';
    const responsibleName = masterUsers.find(u => u.id === action.responsibleUserId)?.name || action.responsibleUserId;

    return (
      <div key={action.id} className={`border rounded-lg p-5 mb-4 shadow-sm ${isMine ? 'bg-white border-blue-200' : 'bg-zinc-50 border-zinc-200'}`}>
        <div className="flex justify-between items-start mb-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                action.status === 'VERIFIED' ? 'bg-green-100 text-green-800' :
                action.status === 'FAILED_VERIFICATION' ? 'bg-red-100 text-red-800' :
                action.status === 'EVIDENCE_SUBMITTED' ? 'bg-purple-100 text-purple-800' :
                action.status === 'RETURNED_FOR_CORRECTION' ? 'bg-orange-100 text-orange-800' :
                'bg-blue-100 text-blue-800'
              }`}>
                {action.status.replace(/_/g, ' ')}
              </span>
              {action.evidenceRequired && (
                <span className="px-2 py-0.5 rounded text-xs font-medium bg-zinc-100 text-zinc-700 border flex items-center">
                  <FileText size={12} className="mr-1" /> Evidence Required
                </span>
              )}
            </div>
            <h4 className="font-medium text-lg text-zinc-900">{action.description}</h4>
            <div className="text-sm text-zinc-500 mt-1 flex gap-4">
              <span>Owner: <span className="font-medium text-zinc-700">{responsibleName}</span></span>
              <span>Due: <span className="font-medium text-zinc-700">{new Date(action.dueDate).toLocaleDateString()}</span></span>
            </div>
          </div>
          <div className="text-right">
            <div className="text-sm text-zinc-500 mb-1">Progress</div>
            <div className="text-2xl font-bold text-blue-600">{action.progressPercent || 0}%</div>
          </div>
        </div>

        {/* Existing Evidence Display */}
        {action.evidenceMetadata && !isEditing && (
          <div className="bg-zinc-50 p-3 rounded border mb-4">
            <h5 className="text-sm font-medium text-zinc-800 mb-2 flex items-center">
              <CheckCircle size={16} className="text-green-500 mr-1" /> Attached Evidence
            </h5>
            <div className="flex items-center justify-between bg-white p-2 border rounded text-sm">
              <div className="flex items-center">
                <FileText size={16} className="text-blue-500 mr-2" />
                <span className="font-medium truncate max-w-xs">{action.evidenceMetadata.filename}</span>
                <span className="text-zinc-400 ml-2">({Math.round(action.evidenceMetadata.sizeBytes / 1024)} KB)</span>
              </div>
              <span className="text-xs text-zinc-500">{new Date(action.evidenceMetadata.uploadedAt).toLocaleString()}</span>
            </div>
            {action.evidenceMetadata.comment && (
              <div className="mt-2 text-sm text-zinc-600 italic">"{action.evidenceMetadata.comment}"</div>
            )}
          </div>
        )}

        {/* Edit Form */}
        {isEditing ? (
          <div className="border-t pt-4 mt-4">
            <h5 className="font-medium mb-3">Update Progress & Evidence</h5>
            
            <div className="mb-4">
              <label className="block text-sm font-medium mb-1">Progress (%)</label>
              <div className="flex items-center gap-3">
                <input 
                  type="range" min="0" max="100" step="5"
                  className="flex-grow"
                  value={form.progressPercent}
                  onChange={e => setForm({...form, progressPercent: e.target.value})}
                />
                <span className="font-mono bg-zinc-100 px-2 py-1 rounded w-16 text-center">{form.progressPercent}%</span>
              </div>
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium mb-1">Progress Comment</label>
              <textarea 
                className="w-full p-2 border rounded text-sm" rows="2"
                value={form.progressComment}
                onChange={e => setForm({...form, progressComment: e.target.value})}
                placeholder="What have you done so far?"
              ></textarea>
            </div>

            <div className="mb-4 bg-zinc-50 p-4 rounded border">
              <label className="block text-sm font-medium mb-2">Evidence Submission (Metadata Only)</label>
              {form.evidenceFile ? (
                <div className="flex items-center justify-between bg-white p-3 border rounded mb-3">
                  <div className="flex items-center">
                    <FileText size={16} className="text-blue-500 mr-2" />
                    <div>
                      <div className="text-sm font-medium">{form.evidenceFile.name}</div>
                      <div className="text-xs text-zinc-500">{Math.round(form.evidenceFile.size / 1024)} KB</div>
                    </div>
                  </div>
                  <button onClick={handleRemoveMockFile} className="text-red-500 hover:text-red-700 p-1">
                    <X size={16} />
                  </button>
                </div>
              ) : (
                <div className="mb-3">
                  <input 
                    type="file" 
                    id="mock-file-upload" 
                    className="hidden" 
                    onChange={handleMockFileSelect}
                    accept=".pdf,.jpg,.jpeg,.png,.xlsx,.docx"
                  />
                  <label 
                    htmlFor="mock-file-upload" 
                    className="cursor-pointer flex flex-col items-center justify-center p-6 border-2 border-dashed border-blue-300 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-700 transition-colors"
                  >
                    <Upload size={24} className="mb-2" />
                    <span className="text-sm font-medium">Click to select mock file</span>
                    <span className="text-xs mt-1 text-blue-600/70">PDF, JPG, PNG, XLSX, DOCX (Max 10MB)</span>
                  </label>
                </div>
              )}
              
              <input 
                type="text" 
                className="w-full p-2 border rounded text-sm mt-2"
                value={form.evidenceComment}
                onChange={e => setForm({...form, evidenceComment: e.target.value})}
                placeholder="Optional evidence description..."
              />
            </div>

            {error && (
              <div className="mb-4 bg-red-50 border border-red-200 text-red-700 p-3 rounded text-sm flex items-start gap-2">
                <AlertCircle size={16} className="mt-0.5 flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <div className="flex justify-end gap-2">
              <button 
                onClick={handleCancelEdit}
                className="px-4 py-2 border rounded text-sm font-medium hover:bg-zinc-50"
                disabled={isSubmitting}
              >
                Cancel
              </button>
              <button 
                onClick={() => handleSaveProgress(action)}
                className="px-4 py-2 bg-blue-600 text-white rounded text-sm font-medium hover:bg-blue-700 flex items-center"
                disabled={isSubmitting}
              >
                {isSubmitting ? <RefreshCw size={16} className="animate-spin mr-2" /> : null}
                Save Progress
              </button>
            </div>
          </div>
        ) : (
          <div className="flex gap-2 mt-4 pt-4 border-t">
            {canEdit && (
              <button 
                onClick={() => handleStartEdit(action)}
                className="px-4 py-2 border border-blue-600 text-blue-600 rounded text-sm font-medium hover:bg-blue-50 flex items-center"
              >
                <Play size={16} className="mr-2" /> Update Progress
              </button>
            )}
            
            {canSubmit && (
              <button 
                onClick={() => handleSubmitVerification(action)}
                className="px-4 py-2 bg-purple-600 text-white rounded text-sm font-medium hover:bg-purple-700 flex items-center"
                disabled={isSubmitting || (action.evidenceRequired && !action.evidenceMetadata)}
                title={action.evidenceRequired && !action.evidenceMetadata ? "Valid evidence required to submit" : ""}
              >
                {isSubmitting ? <RefreshCw size={16} className="animate-spin mr-2" /> : <CheckCircle size={16} className="mr-2" />}
                Submit for QA Verification
              </button>
            )}
          </div>
        )}

        {/* Verification Feedback */}
        {action.verificationComment && (action.status === 'RETURNED_FOR_CORRECTION' || action.status === 'FAILED_VERIFICATION') && (
          <div className="mt-4 bg-orange-50 p-3 rounded border border-orange-200">
            <h5 className="text-sm font-medium text-orange-800 flex items-center mb-1">
              <MessageSquare size={14} className="mr-1" /> QA Feedback
            </h5>
            <p className="text-sm text-orange-900">{action.verificationComment}</p>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center mb-4">
        <h3 className="font-semibold text-lg border-b pb-2 flex-grow">Action Execution & Evidence Submission</h3>
      </div>

      {myActions.length > 0 && (
        <div className="mb-8">
          <h4 className="text-md font-medium text-zinc-800 mb-4 flex items-center">
            Your Assigned Actions
            <span className="ml-2 bg-blue-100 text-blue-800 text-xs py-0.5 px-2 rounded-full">{myActions.length}</span>
          </h4>
          <div className="space-y-2">
            {myActions.map(action => renderActionCard(action, true))}
          </div>
        </div>
      )}

      {otherActions.length > 0 && (
        <div>
          <h4 className="text-md font-medium text-zinc-800 mb-4 flex items-center">
            Other Department Actions
            <span className="ml-2 bg-zinc-100 text-zinc-600 text-xs py-0.5 px-2 rounded-full">{otherActions.length}</span>
          </h4>
          <div className="space-y-2 opacity-75">
            {otherActions.map(action => renderActionCard(action, false))}
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

export default NcCapaEvidenceTab;
