import React, { useState, useEffect } from 'react';
import { useNcCapaTranslation } from '../locales/ncCapaTranslations';
import { RootCauseMethod, CauseCategory } from '../domain/models';

const NcCapaRootCauseTab = ({ record, onSaveDraft, onSubmit, isReadOnly }) => {
  const { t } = useNcCapaTranslation();
  
  const [form, setForm] = useState({
    method: RootCauseMethod.FIVE_WHY,
    problemStatement: '',
    why1: '', why2: '', why3: '', why4: '', why5: '',
    causeCategories: [],
    categoryExplanation: '',
    rootCauseSummary: ''
  });
  
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (record?.rootCauseAnalysis) {
      setForm({
        method: record.rootCauseAnalysis.method || RootCauseMethod.FIVE_WHY,
        problemStatement: record.rootCauseAnalysis.problemStatement || '',
        why1: record.rootCauseAnalysis.why1 || '',
        why2: record.rootCauseAnalysis.why2 || '',
        why3: record.rootCauseAnalysis.why3 || '',
        why4: record.rootCauseAnalysis.why4 || '',
        why5: record.rootCauseAnalysis.why5 || '',
        causeCategories: record.rootCauseAnalysis.causeCategories || [],
        categoryExplanation: record.rootCauseAnalysis.categoryExplanation || '',
        rootCauseSummary: record.rootCauseAnalysis.rootCauseSummary || ''
      });
    }
  }, [record]);

  const handleCategoryToggle = (cat) => {
    setForm(prev => {
      const cats = prev.causeCategories.includes(cat) 
        ? prev.causeCategories.filter(c => c !== cat) 
        : [...prev.causeCategories, cat];
      return { ...prev, causeCategories: cats };
    });
  };

  const validate = () => {
    if (!form.rootCauseSummary.trim()) return false;
    
    if (form.method === RootCauseMethod.FIVE_WHY || form.method === RootCauseMethod.FIVE_WHY_AND_CATEGORY) {
      if (!form.problemStatement.trim() || !form.why1.trim() || !form.why2.trim() || !form.why3.trim() || !form.why4.trim() || !form.why5.trim()) {
        return false;
      }
    }
    
    if (form.method === RootCauseMethod.CAUSE_CATEGORY || form.method === RootCauseMethod.FIVE_WHY_AND_CATEGORY) {
      if (form.causeCategories.length === 0 || !form.categoryExplanation.trim()) {
        return false;
      }
    }
    
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) {
      setError('Please fill in all required fields based on the selected method.');
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

  const isFiveWhy = form.method === RootCauseMethod.FIVE_WHY || form.method === RootCauseMethod.FIVE_WHY_AND_CATEGORY;
  const isCategory = form.method === RootCauseMethod.CAUSE_CATEGORY || form.method === RootCauseMethod.FIVE_WHY_AND_CATEGORY;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center mb-4">
        <h3 className="font-semibold text-lg border-b pb-2 flex-grow">{t('rca', 'title')}</h3>
      </div>

      {!isReadOnly && (
        <div className="bg-blue-50 p-4 rounded-lg border border-blue-100 mb-6">
          <label className="block text-sm font-medium mb-2 text-blue-900">{t('rca', 'method')}</label>
          <div className="flex gap-4">
            {Object.entries(RootCauseMethod).map(([key, val]) => (
              <label key={key} className="flex items-center text-sm cursor-pointer">
                <input 
                  type="radio" 
                  name="rcaMethod"
                  value={val}
                  checked={form.method === val}
                  onChange={(e) => setForm({...form, method: e.target.value})}
                  className="mr-2"
                />
                {t('rca', key === 'FIVE_WHY' ? 'method5Why' : key === 'CAUSE_CATEGORY' ? 'methodCategory' : 'methodCombined')}
              </label>
            ))}
          </div>
        </div>
      )}

      {isReadOnly && (
        <div className="mb-4">
          <span className="text-sm text-zinc-500 uppercase tracking-wider block mb-1">{t('rca', 'method')}</span>
          <span className="font-medium bg-zinc-100 px-3 py-1 rounded">
            {t('rca', form.method === 'FIVE_WHY' ? 'method5Why' : form.method === 'CAUSE_CATEGORY' ? 'methodCategory' : 'methodCombined')}
          </span>
        </div>
      )}

      {isFiveWhy && (
        <div className="space-y-4 bg-white border rounded-lg p-4">
          <h4 className="font-medium text-zinc-800 border-b pb-2 mb-3">5-Why Analysis</h4>
          <div>
            <label className="block text-sm font-medium mb-1">{t('rca', 'problemStatement')} <span className="text-red-500">*</span></label>
            <input 
              type="text" className="w-full p-2 border rounded"
              value={form.problemStatement}
              onChange={e => setForm({...form, problemStatement: e.target.value})}
              disabled={isReadOnly}
            />
          </div>
          {[1, 2, 3, 4, 5].map(num => (
            <div key={`why${num}`}>
              <label className="block text-sm font-medium mb-1 text-zinc-600">{t('rca', `why${num}`)} <span className="text-red-500">*</span></label>
              <input 
                type="text" className="w-full p-2 border rounded"
                value={form[`why${num}`]}
                onChange={e => setForm({...form, [`why${num}`]: e.target.value})}
                disabled={isReadOnly}
              />
            </div>
          ))}
        </div>
      )}

      {isCategory && (
        <div className="space-y-4 bg-white border rounded-lg p-4">
          <h4 className="font-medium text-zinc-800 border-b pb-2 mb-3">Cause Category</h4>
          <div>
            <label className="block text-sm font-medium mb-2">{t('rca', 'causeCategoryLabel')} <span className="text-red-500">*</span></label>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {Object.entries(CauseCategory).map(([key, val]) => {
                const labelMap = {
                  MAN: 'catMan', MACHINE: 'catMachine', MATERIAL: 'catMaterial',
                  METHOD: 'catMethod', MEASUREMENT: 'catMeasurement', 
                  ENVIRONMENT: 'catEnvironment', MANAGEMENT: 'catManagement'
                };
                const isSelected = form.causeCategories.includes(val);
                return (
                  <button
                    key={key}
                    type="button"
                    onClick={() => !isReadOnly && handleCategoryToggle(val)}
                    disabled={isReadOnly}
                    className={`p-2 border text-sm rounded transition-colors text-left ${isSelected ? 'bg-blue-50 border-blue-500 text-blue-700' : 'bg-white text-zinc-700 hover:bg-zinc-50'}`}
                  >
                    <div className="flex items-center">
                      <div className={`w-4 h-4 rounded-sm border mr-2 flex items-center justify-center ${isSelected ? 'bg-blue-500 border-blue-500' : 'border-zinc-300'}`}>
                        {isSelected && <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>}
                      </div>
                      {t('rca', labelMap[key])}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">{t('rca', 'categoryExplanation')} <span className="text-red-500">*</span></label>
            <textarea 
              className="w-full p-2 border rounded" rows="3"
              value={form.categoryExplanation}
              onChange={e => setForm({...form, categoryExplanation: e.target.value})}
              disabled={isReadOnly}
            ></textarea>
          </div>
        </div>
      )}

      <div className="bg-zinc-50 p-4 rounded-lg border">
        <label className="block text-sm font-medium mb-2 text-zinc-800">{t('rca', 'rootCauseSummary')} <span className="text-red-500">*</span></label>
        <textarea 
          className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500" rows="3"
          value={form.rootCauseSummary}
          onChange={e => setForm({...form, rootCauseSummary: e.target.value})}
          disabled={isReadOnly}
          placeholder="Summarize the actual root cause determined from the analysis above..."
        ></textarea>
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
            {t('rca', 'saveDraft')}
          </button>
          <button 
            type="button"
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="px-6 py-2 bg-blue-600 text-white rounded font-medium hover:bg-blue-700 disabled:opacity-50"
          >
            {isSubmitting ? 'Submitting...' : t('rca', 'submit')}
          </button>
        </div>
      )}
    </div>
  );
};

export default NcCapaRootCauseTab;
