import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import useStore from '../../../store/useStore';
import { ncCapaAccessService } from '../services/NcCapaAccessService';
import { ncCapaService } from '../services/NcCapaService';
import { NC_PERMISSIONS } from '../domain/models';
import { useNcCapaTranslation } from '../locales/ncCapaTranslations';
import NcCapaStepper from '../components/NcCapaStepper';
import { AlertCircle, Save, Send, X } from 'lucide-react';

const NcCapaNew = () => {
  const navigate = useNavigate();
  const { currentUser, masterDepartments } = useStore();
  const { t } = useNcCapaTranslation();

  const [currentStep, setCurrentStep] = useState(0);
  const [formData, setFormData] = useState(ncCapaService.createDraftShell());
  const [validationError, setValidationError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    // If we wanted to load an existing draft, we'd do it here.
    // For now, always fresh.
  }, []);

  if (!ncCapaAccessService.hasPermission(currentUser, NC_PERMISSIONS.CREATE)) {
    return (
      <div className="p-8 max-w-7xl mx-auto">
        <h1 className="text-2xl font-bold text-red-600 mb-4">{t('detail', 'accessDenied')}</h1>
        <p className="text-zinc-600">{t('detail', 'restricted')}</p>
      </div>
    );
  }

  const steps = [
    { label: t('wizard', 'step1') },
    { label: t('wizard', 'step2') },
    { label: t('wizard', 'step3') },
    { label: t('wizard', 'step4') },
    { label: t('wizard', 'step5') },
    { label: t('wizard', 'step6') }
  ];

  const updateForm = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (validationError) setValidationError('');
  };

  const validateStep = (stepIndex) => {
    switch(stepIndex) {
      case 0:
        if (!formData.sourceType || !formData.detectedDate || !formData.departmentId) return false;
        return true;
      case 1:
        if (!formData.title || !formData.description) return false;
        return true;
      case 2:
        if (!formData.immediateCorrection) return false;
        if (!formData.containmentNotRequired && !formData.containmentAction) return false;
        if (formData.containmentNotRequired && !formData.containmentNotRequiredReason) return false;
        return true;
      case 3:
        if (!formData.severity) return false;
        return true;
      case 4:
        return true; // Optional for now
      default:
        return true;
    }
  };

  const handleNext = () => {
    if (validateStep(currentStep)) {
      setCurrentStep(prev => prev + 1);
    } else {
      setValidationError(t('wizard', 'validationError'));
    }
  };

  const handleBack = () => {
    setCurrentStep(prev => prev - 1);
    setValidationError('');
  };

  const handleSaveDraft = async () => {
    setIsSubmitting(true);
    try {
      await ncCapaService.saveDraft(formData);
      useStore.getState().addNotification(currentUser.id, 'Draft Saved', 'Your NC draft has been saved successfully.', '/nc-capa');
      navigate('/nc-capa');
    } catch (error) {
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubmit = async () => {
    if (!validateStep(0) || !validateStep(1) || !validateStep(2) || !validateStep(3)) {
      setValidationError(t('wizard', 'validationError'));
      return;
    }

    setIsSubmitting(true);
    try {
      const newNc = await ncCapaService.submitNewNc(formData, currentUser.id);
      useStore.getState().addNotification(currentUser.id, 'NC Submitted', `NC ${newNc.ncNumber} submitted successfully.`, `/nc-capa/${newNc.id}`);
      navigate(`/nc-capa/${newNc.id}`);
    } catch (error) {
      console.error(error);
      setValidationError(error.message);
      setIsSubmitting(false);
    }
  };

  return (
    <div className="p-4 md:p-8 max-w-5xl mx-auto pb-24">
      <div className="mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <h1 className="text-2xl font-bold text-zinc-900">{t('dashboard', 'createNc')}</h1>
        <div className="flex items-center gap-2">
          <button 
            onClick={() => navigate('/nc-capa')}
            className="px-4 py-2 text-zinc-600 hover:bg-zinc-100 rounded-lg flex items-center"
          >
            <X size={16} className="mr-2" />
            {t('wizard', 'cancel')}
          </button>
          <button 
            onClick={handleSaveDraft}
            disabled={isSubmitting}
            className="px-4 py-2 text-blue-600 border border-blue-600 hover:bg-blue-50 rounded-lg flex items-center"
          >
            <Save size={16} className="mr-2" />
            {t('wizard', 'saveDraft')}
          </button>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-zinc-200 shadow-sm p-6 mb-6">
        <NcCapaStepper 
          steps={steps} 
          currentStep={currentStep} 
          onStepClick={(index) => {
            // Only allow clicking backward or to next if current is valid
            if (index < currentStep || (index === currentStep + 1 && validateStep(currentStep))) {
              setCurrentStep(index);
              setValidationError('');
            }
          }} 
        />
      </div>

      <div className="bg-white rounded-xl border border-zinc-200 shadow-sm p-6 mb-6 min-h-[400px]">
        {validationError && (
          <div className="mb-6 p-4 bg-red-50 text-red-700 rounded-lg flex items-start border border-red-200">
            <AlertCircle size={20} className="mr-2 flex-shrink-0 mt-0.5" />
            <span>{validationError}</span>
          </div>
        )}

        {/* STEP 1 */}
        {currentStep === 0 && (
          <div className="space-y-6 animate-in fade-in">
            <h2 className="text-lg font-semibold border-b pb-2">{t('wizard', 'step1')}</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="sourceType" className="block text-sm font-medium text-zinc-700 mb-1">{t('wizard', 'sourceType')} <span className="text-red-500">*</span></label>
                <select 
                  id="sourceType"
                  className="w-full px-3 py-2 border border-zinc-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                  value={formData.sourceType || ''}
                  onChange={(e) => updateForm('sourceType', e.target.value)}
                >
                  <option value="">-- Select Source --</option>
                  <option value="INTERNAL_AUDIT">Internal Audit</option>
                  <option value="EXTERNAL_AUDIT">External Audit</option>
                  <option value="CUSTOMER_COMPLAINT">Customer Complaint</option>
                  <option value="INSPECTION">Routine Inspection</option>
                  <option value="OTHER">Other</option>
                </select>
              </div>
              
              <div>
                <label htmlFor="detectedDate" className="block text-sm font-medium text-zinc-700 mb-1">{t('wizard', 'detectedDate')} <span className="text-red-500">*</span></label>
                <input 
                  id="detectedDate"
                  type="date"
                  className="w-full px-3 py-2 border border-zinc-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                  value={formData.detectedDate || ''}
                  onChange={(e) => updateForm('detectedDate', e.target.value)}
                />
              </div>

              <div className="md:col-span-2">
                <label htmlFor="departmentId" className="block text-sm font-medium text-zinc-700 mb-1">{t('wizard', 'department')} <span className="text-red-500">*</span></label>
                <select 
                  id="departmentId"
                  className="w-full px-3 py-2 border border-zinc-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                  value={formData.departmentId || ''}
                  onChange={(e) => updateForm('departmentId', e.target.value)}
                >
                  <option value="">-- Select Department --</option>
                  {masterDepartments?.map(d => (
                    <option key={d.id} value={d.id}>{d.name}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        )}

        {/* STEP 2 */}
        {currentStep === 1 && (
          <div className="space-y-6 animate-in fade-in">
            <h2 className="text-lg font-semibold border-b pb-2">{t('wizard', 'step2')}</h2>
            
            <div>
              <label htmlFor="title" className="block text-sm font-medium text-zinc-700 mb-1">{t('wizard', 'title')} <span className="text-red-500">*</span></label>
              <input 
                id="title"
                type="text"
                className="w-full px-3 py-2 border border-zinc-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                placeholder="Brief title of the issue..."
                value={formData.title || ''}
                onChange={(e) => updateForm('title', e.target.value)}
              />
            </div>
            
            <div>
              <label htmlFor="description" className="block text-sm font-medium text-zinc-700 mb-1">{t('wizard', 'description')} <span className="text-red-500">*</span></label>
              <textarea 
                id="description"
                className="w-full px-3 py-2 border border-zinc-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                rows="6"
                placeholder="Detailed description of the non-conformance..."
                value={formData.description || ''}
                onChange={(e) => updateForm('description', e.target.value)}
              ></textarea>
            </div>
          </div>
        )}

        {/* STEP 3 */}
        {currentStep === 2 && (
          <div className="space-y-6 animate-in fade-in">
            <h2 className="text-lg font-semibold border-b pb-2">{t('wizard', 'step3')}</h2>
            
            <div>
              <label htmlFor="immediateCorrection" className="block text-sm font-medium text-zinc-700 mb-1">{t('wizard', 'immediateCorrection')} <span className="text-red-500">*</span></label>
              <textarea 
                id="immediateCorrection"
                className="w-full px-3 py-2 border border-zinc-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                rows="3"
                placeholder="What immediate actions were taken to fix the issue?"
                value={formData.immediateCorrection || ''}
                onChange={(e) => updateForm('immediateCorrection', e.target.value)}
              ></textarea>
            </div>

            <div className="p-4 bg-zinc-50 rounded-lg border border-zinc-200">
              <div className="flex items-center mb-4">
                <input 
                  type="checkbox"
                  id="containment"
                  className="w-4 h-4 text-blue-600 rounded border-zinc-300 focus:ring-blue-500"
                  checked={!!formData.containmentNotRequired}
                  onChange={(e) => {
                    updateForm('containmentNotRequired', e.target.checked);
                    if (e.target.checked) updateForm('containmentAction', '');
                    else updateForm('containmentNotRequiredReason', '');
                  }}
                />
                <label htmlFor="containment" className="ml-2 font-medium text-zinc-700">
                  {t('wizard', 'containmentNotRequired')}
                </label>
              </div>

              {!formData.containmentNotRequired ? (
                <div>
                  <label htmlFor="containmentAction" className="block text-sm font-medium text-zinc-700 mb-1">{t('wizard', 'containmentAction')} <span className="text-red-500">*</span></label>
                  <textarea 
                    id="containmentAction"
                    className="w-full px-3 py-2 border border-zinc-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white"
                    rows="3"
                    placeholder="How was the non-conforming product/process contained?"
                    value={formData.containmentAction || ''}
                    onChange={(e) => updateForm('containmentAction', e.target.value)}
                  ></textarea>
                </div>
              ) : (
                <div>
                  <label htmlFor="containmentNotRequiredReason" className="block text-sm font-medium text-zinc-700 mb-1">{t('wizard', 'containmentReason')} <span className="text-red-500">*</span></label>
                  <input 
                    id="containmentNotRequiredReason"
                    type="text"
                    className="w-full px-3 py-2 border border-zinc-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white"
                    placeholder="Why is containment not required?"
                    value={formData.containmentNotRequiredReason || ''}
                    onChange={(e) => updateForm('containmentNotRequiredReason', e.target.value)}
                  />
                </div>
              )}
            </div>
          </div>
        )}

        {/* STEP 4 */}
        {currentStep === 3 && (
          <div className="space-y-6 animate-in fade-in">
            <h2 className="text-lg font-semibold border-b pb-2">{t('wizard', 'step4')}</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-zinc-700 mb-2">Severity <span className="text-red-500">*</span></label>
                <div className="space-y-2">
                  {['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'].map(sev => (
                    <label key={sev} className="flex items-center p-3 border rounded-lg cursor-pointer hover:bg-zinc-50 has-[:checked]:border-blue-500 has-[:checked]:bg-blue-50">
                      <input 
                        type="radio" 
                        name="severity" 
                        value={sev}
                        checked={formData.severity === sev}
                        onChange={(e) => updateForm('severity', e.target.value)}
                        className="text-blue-600 focus:ring-blue-500 h-4 w-4"
                      />
                      <span className="ml-3 font-medium text-zinc-700">{t('severity', sev)}</span>
                    </label>
                  ))}
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-zinc-700 mb-2">Impact Flags</label>
                <div className="space-y-3">
                  <label className="flex items-center p-3 border rounded-lg cursor-pointer hover:bg-zinc-50">
                    <input 
                      type="checkbox" 
                      checked={formData.foodSafetyImpact}
                      onChange={(e) => updateForm('foodSafetyImpact', e.target.checked)}
                      className="text-red-600 rounded focus:ring-red-500 h-4 w-4"
                    />
                    <span className="ml-3 text-zinc-700">{t('wizard', 'foodSafetyImpact')}</span>
                  </label>
                  <label className="flex items-center p-3 border rounded-lg cursor-pointer hover:bg-zinc-50">
                    <input 
                      type="checkbox" 
                      checked={formData.customerImpact}
                      onChange={(e) => updateForm('customerImpact', e.target.checked)}
                      className="text-orange-600 rounded focus:ring-orange-500 h-4 w-4"
                    />
                    <span className="ml-3 text-zinc-700">{t('wizard', 'customerImpact')}</span>
                  </label>
                  <label className="flex items-center p-3 border rounded-lg cursor-pointer hover:bg-zinc-50">
                    <input 
                      type="checkbox" 
                      checked={formData.regulatoryImpact}
                      onChange={(e) => updateForm('regulatoryImpact', e.target.checked)}
                      className="text-purple-600 rounded focus:ring-purple-500 h-4 w-4"
                    />
                    <span className="ml-3 text-zinc-700">{t('wizard', 'regulatoryImpact')}</span>
                  </label>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* STEP 5 */}
        {currentStep === 4 && (
          <div className="space-y-6 animate-in fade-in">
            <h2 className="text-lg font-semibold border-b pb-2">{t('wizard', 'step5')}</h2>
            
            <p className="text-zinc-500 italic mb-4">
              [Phase 11B Placeholder: Document selection will be integrated in future phases.]
            </p>
            
            <div>
              <label className="block text-sm font-medium text-zinc-700 mb-1">Standard / Clause References</label>
              <input 
                type="text"
                className="w-full px-3 py-2 border border-zinc-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                placeholder="e.g. ISO 9001:2015 Clause 8.2"
                onChange={(e) => updateForm('relatedStandardMappings', [e.target.value])}
              />
            </div>
          </div>
        )}

        {/* STEP 6 */}
        {currentStep === 5 && (
          <div className="space-y-6 animate-in fade-in">
            <h2 className="text-lg font-semibold border-b pb-2">{t('wizard', 'step6')}</h2>
            
            <div className="bg-zinc-50 p-6 rounded-lg border border-zinc-200 space-y-4">
              <h3 className="font-bold text-lg">{formData.title || 'Untitled NC'}</h3>
              
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-zinc-500 block text-xs uppercase tracking-wider">{t('wizard', 'sourceType')}</span>
                  <span className="font-medium">{formData.sourceType || '-'}</span>
                </div>
                <div>
                  <span className="text-zinc-500 block text-xs uppercase tracking-wider">Severity</span>
                  <span className="font-medium">{t('severity', formData.severity) || '-'}</span>
                </div>
              </div>

              <div>
                <span className="text-zinc-500 block text-xs uppercase tracking-wider">{t('wizard', 'description')}</span>
                <p className="text-zinc-800 whitespace-pre-wrap mt-1">{formData.description || '-'}</p>
              </div>

              <div className="pt-4 border-t">
                <p className="text-sm text-zinc-600">
                  By submitting this Non-Conformance, it will be assigned to QA/QC for initial screening. 
                  You will not be able to edit the details directly after submission unless returned.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Sticky Bottom Actions */}
      <div className="fixed bottom-0 left-0 right-0 md:static bg-white md:bg-transparent border-t md:border-t-0 p-4 md:p-0 flex justify-between items-center shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)] md:shadow-none z-50">
        <button
          onClick={handleBack}
          disabled={currentStep === 0 || isSubmitting}
          className="px-6 py-2 border border-zinc-300 rounded-lg font-medium text-zinc-700 hover:bg-zinc-50 disabled:opacity-50 disabled:cursor-not-allowed bg-white"
        >
          {t('wizard', 'back')}
        </button>

        {currentStep < steps.length - 1 ? (
          <button
            onClick={handleNext}
            className="px-6 py-2 bg-zinc-900 text-white rounded-lg font-medium hover:bg-zinc-800"
          >
            {t('wizard', 'next')}
          </button>
        ) : (
          <button
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="px-8 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 flex items-center disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
          >
            {isSubmitting ? 'Submitting...' : (
              <>
                <Send size={18} className="mr-2" />
                {t('wizard', 'submit')}
              </>
            )}
          </button>
        )}
      </div>
    </div>
  );
};

export default NcCapaNew;
