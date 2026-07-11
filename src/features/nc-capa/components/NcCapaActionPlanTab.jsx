import React, { useState, useEffect } from 'react';
import { useNcCapaTranslation } from '../locales/ncCapaTranslations';
import { CAPAActionType, DocumentImpact, TrainingImpact, NC_SEVERITY } from '../domain/models';
import useStore from '../../../store/useStore';
import { Plus, Trash2, AlertTriangle } from 'lucide-react';

const NcCapaActionPlanTab = ({ record, onSaveDraft, onSubmit, isReadOnly }) => {
  const { t } = useNcCapaTranslation();
  const { masterUsers, masterDepartments } = useStore();
  
  const [form, setForm] = useState({
    actions: [],
    planSummary: '',
    documentImpactAssessment: DocumentImpact.NO_DOCUMENT_IMPACT,
    trainingImpactAssessment: TrainingImpact.NO_TRAINING_IMPACT
  });
  
  const [error, setError] = useState('');
  const [warning, setWarning] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (record?.capaActionPlan) {
      setForm({
        actions: record.capaActionPlan.actions || [],
        planSummary: record.capaActionPlan.planSummary || '',
        documentImpactAssessment: record.capaActionPlan.documentImpactAssessment || DocumentImpact.NO_DOCUMENT_IMPACT,
        trainingImpactAssessment: record.capaActionPlan.trainingImpactAssessment || TrainingImpact.NO_TRAINING_IMPACT
      });
    }
  }, [record]);

  // Check for critical warnings
  useEffect(() => {
    if (record?.severity === NC_SEVERITY.CRITICAL || record?.foodSafetyImpact) {
      const hasPreventive = form.actions.some(a => a.type === CAPAActionType.PREVENTIVE_ACTION);
      if (!hasPreventive) {
        setWarning('Critical or Food Safety NC should have at least one Preventive Action to prevent recurrence.');
      } else {
        setWarning('');
      }
    } else {
      setWarning('');
    }
  }, [form.actions, record]);

  const handleAddAction = () => {
    setForm(prev => ({
      ...prev,
      actions: [...prev.actions, {
        id: `ACT-${Date.now()}`,
        type: CAPAActionType.CORRECTIVE_ACTION,
        description: '',
        responsibleUserId: '',
        departmentId: '',
        dueDate: '',
        evidenceRequired: true,
        priority: 'MEDIUM',
        acceptanceCriteria: ''
      }]
    }));
  };

  const handleUpdateAction = (id, field, value) => {
    setForm(prev => ({
      ...prev,
      actions: prev.actions.map(a => a.id === id ? { ...a, [field]: value } : a)
    }));
  };

  const handleRemoveAction = (id) => {
    setForm(prev => ({
      ...prev,
      actions: prev.actions.filter(a => a.id !== id)
    }));
  };

  const validate = () => {
    if (!form.planSummary.trim()) return 'Plan summary is required.';
    
    if (form.actions.length === 0) return 'At least one action is required.';
    
    const hasCorrective = form.actions.some(a => a.type === CAPAActionType.CORRECTIVE_ACTION);
    if (!hasCorrective) return 'At least one Corrective Action is required.';
    
    for (const a of form.actions) {
      if (!a.description.trim() || !a.responsibleUserId || !a.departmentId || !a.dueDate || !a.acceptanceCriteria.trim()) {
        return 'All action fields (description, owner, department, due date, acceptance criteria) are required.';
      }
    }
    
    return null;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const valError = validate();
    if (valError) {
      setError(valError);
      return;
    }
    setError('');
    setIsSubmitting(true);
    try {
      await onSubmit(form);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSaveDraft = async () => {
    setError('');
    try {
      await onSaveDraft(form);
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center mb-4">
        <h3 className="font-semibold text-lg border-b pb-2 flex-grow">{t('capa', 'title')}</h3>
      </div>

      <div className="bg-zinc-50 p-4 rounded-lg border">
        <label className="block text-sm font-medium mb-2 text-zinc-800">{t('capa', 'planSummary')} <span className="text-red-500">*</span></label>
        <textarea 
          className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500" rows="2"
          value={form.planSummary}
          onChange={e => setForm({...form, planSummary: e.target.value})}
          disabled={isReadOnly}
          placeholder="Summarize the overall action plan..."
        ></textarea>
      </div>

      {warning && (
        <div className="bg-orange-50 text-orange-800 p-3 rounded border border-orange-200 flex items-start">
          <AlertTriangle size={18} className="mr-2 mt-0.5 flex-shrink-0" />
          <span className="text-sm font-medium">{warning}</span>
        </div>
      )}

      <div>
        <div className="flex justify-between items-center mb-3">
          <label className="block text-sm font-medium text-zinc-800">Actions <span className="text-red-500">*</span></label>
          {!isReadOnly && (
            <button 
              type="button"
              onClick={handleAddAction}
              className="flex items-center text-sm text-blue-600 hover:text-blue-800 font-medium"
            >
              <Plus size={16} className="mr-1" /> {t('capa', 'addAction')}
            </button>
          )}
        </div>
        
        {form.actions.length === 0 ? (
          <div className="text-center py-6 bg-zinc-50 border border-dashed rounded-lg text-zinc-500 text-sm">
            No actions added yet.
          </div>
        ) : (
          <div className="space-y-4">
            {form.actions.map((act, index) => (
              <div key={act.id} className="border rounded-lg bg-white p-4 relative shadow-sm">
                {!isReadOnly && (
                  <button 
                    onClick={() => handleRemoveAction(act.id)}
                    className="absolute top-4 right-4 text-zinc-400 hover:text-red-500"
                    title="Remove Action"
                  >
                    <Trash2 size={16} />
                  </button>
                )}
                
                <h4 className="font-medium text-sm text-zinc-500 mb-3 uppercase tracking-wider">Action #{index + 1}</h4>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="block text-xs font-medium mb-1 text-zinc-600">{t('capa', 'actionType')}</label>
                    <select 
                      className="w-full p-2 text-sm border rounded bg-zinc-50"
                      value={act.type}
                      onChange={e => handleUpdateAction(act.id, 'type', e.target.value)}
                      disabled={isReadOnly}
                    >
                      <option value={CAPAActionType.CORRECTION}>{t('capa', 'correction')}</option>
                      <option value={CAPAActionType.CORRECTIVE_ACTION}>{t('capa', 'correctiveAction')}</option>
                      <option value={CAPAActionType.PREVENTIVE_ACTION}>{t('capa', 'preventiveAction')}</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium mb-1 text-zinc-600">{t('capa', 'priority')}</label>
                    <select 
                      className="w-full p-2 text-sm border rounded bg-zinc-50"
                      value={act.priority}
                      onChange={e => handleUpdateAction(act.id, 'priority', e.target.value)}
                      disabled={isReadOnly}
                    >
                      <option value="LOW">Low</option>
                      <option value="MEDIUM">Medium</option>
                      <option value="HIGH">High</option>
                    </select>
                  </div>
                </div>

                <div className="mb-4">
                  <label className="block text-xs font-medium mb-1 text-zinc-600">{t('capa', 'actionDesc')}</label>
                  <textarea 
                    className="w-full p-2 text-sm border rounded" rows="2"
                    value={act.description}
                    onChange={e => handleUpdateAction(act.id, 'description', e.target.value)}
                    disabled={isReadOnly}
                  ></textarea>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                  <div>
                    <label className="block text-xs font-medium mb-1 text-zinc-600">{t('capa', 'responsible')}</label>
                    <select 
                      className="w-full p-2 text-sm border rounded"
                      value={act.responsibleUserId}
                      onChange={e => handleUpdateAction(act.id, 'responsibleUserId', e.target.value)}
                      disabled={isReadOnly}
                    >
                      <option value="">-- Select --</option>
                      {masterUsers.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium mb-1 text-zinc-600">{t('capa', 'department')}</label>
                    <select 
                      className="w-full p-2 text-sm border rounded"
                      value={act.departmentId}
                      onChange={e => handleUpdateAction(act.id, 'departmentId', e.target.value)}
                      disabled={isReadOnly}
                    >
                      <option value="">-- Select --</option>
                      {masterDepartments.map(d => (
                        <optgroup key={d.id} label={d.name}>
                          <option value={d.id}>{d.name}</option>
                          {d.subs && d.subs.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                        </optgroup>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium mb-1 text-zinc-600">{t('capa', 'dueDate')}</label>
                    <input 
                      type="date"
                      className="w-full p-2 text-sm border rounded"
                      value={act.dueDate}
                      min={new Date().toISOString().split('T')[0]} // Cannot be past
                      onChange={e => handleUpdateAction(act.id, 'dueDate', e.target.value)}
                      disabled={isReadOnly}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium mb-1 text-zinc-600">{t('capa', 'acceptanceCriteria')}</label>
                  <input 
                    type="text"
                    className="w-full p-2 text-sm border rounded"
                    value={act.acceptanceCriteria}
                    onChange={e => handleUpdateAction(act.id, 'acceptanceCriteria', e.target.value)}
                    disabled={isReadOnly}
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-zinc-50 p-4 rounded-lg border">
        <div>
          <label className="block text-sm font-medium mb-2 text-zinc-800">{t('capa', 'documentImpact')}</label>
          <select 
            className="w-full p-2 border rounded bg-white"
            value={form.documentImpactAssessment}
            onChange={e => setForm({...form, documentImpactAssessment: e.target.value})}
            disabled={isReadOnly}
          >
            <option value={DocumentImpact.NO_DOCUMENT_IMPACT}>{t('capa', 'docNone')}</option>
            <option value={DocumentImpact.NEW_DOCUMENT_REQUIRED}>{t('capa', 'docNew')}</option>
            <option value={DocumentImpact.DOCUMENT_REVISION_REQUIRED}>{t('capa', 'docRevise')}</option>
            <option value={DocumentImpact.DOCUMENT_OBSOLETE_REQUIRED}>{t('capa', 'docObsolete')}</option>
            <option value={DocumentImpact.PERIODIC_REVIEW_REQUIRED}>{t('capa', 'docPeriodic')}</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium mb-2 text-zinc-800">{t('capa', 'trainingImpact')}</label>
          <select 
            className="w-full p-2 border rounded bg-white"
            value={form.trainingImpactAssessment}
            onChange={e => setForm({...form, trainingImpactAssessment: e.target.value})}
            disabled={isReadOnly}
          >
            <option value={TrainingImpact.NO_TRAINING_IMPACT}>{t('capa', 'trainNone')}</option>
            <option value={TrainingImpact.TRAINING_REQUIRED}>{t('capa', 'trainRequired')}</option>
            <option value={TrainingImpact.AWARENESS_REQUIRED}>{t('capa', 'trainAwareness')}</option>
          </select>
        </div>
      </div>

      {error && <div className="text-red-600 text-sm p-3 bg-red-50 border border-red-200 rounded">{error}</div>}

      {!isReadOnly && (
        <div className="flex justify-end gap-3 pt-4 border-t">
          <button 
            type="button"
            onClick={handleSaveDraft}
            disabled={isSubmitting}
            className="px-4 py-2 border rounded font-medium text-zinc-600 hover:bg-zinc-50 disabled:opacity-50"
          >
            {t('capa', 'saveDraft')}
          </button>
          <button 
            type="button"
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="px-6 py-2 bg-blue-600 text-white rounded font-medium hover:bg-blue-700 disabled:opacity-50"
          >
            {isSubmitting ? 'Submitting...' : t('capa', 'submit')}
          </button>
        </div>
      )}
    </div>
  );
};

export default NcCapaActionPlanTab;
