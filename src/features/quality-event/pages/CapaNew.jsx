import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import useStore from '../../../store/useStore';
import { qualityEventCapaService } from '../services/QualityEventCapaService';
import NcCapaStepper from '../../nc-capa/components/NcCapaStepper';
import { Send } from 'lucide-react';
import toast from 'react-hot-toast';

const CapaNew = () => {
  const navigate = useNavigate();
  const { currentUser, masterDepartments } = useStore();
  
  const [currentStep, setCurrentStep] = useState(0);
  const [formData, setFormData] = useState(qualityEventCapaService.createDraftShell());
  const [isSubmitting, setIsSubmitting] = useState(false);

  const steps = [
    { title: 'Type', description: 'Record classification' },
    { title: 'Problem', description: 'Detail the issue' },
    { title: 'Correction', description: 'Immediate actions' },
    { title: 'Assignment', description: 'Responsible dept' },
    { title: 'Review', description: 'Verify & submit' }
  ];

  const updateForm = (key, value) => {
    setFormData(prev => ({ ...prev, [key]: value }));
  };

  const handleNext = () => setCurrentStep(prev => Math.min(steps.length - 1, prev + 1));
  const handleBack = () => setCurrentStep(prev => Math.max(0, prev - 1));

  const handleSubmit = async () => {
    try {
      setIsSubmitting(true);
      const newRecord = await qualityEventCapaService.submitNewCapa(formData, currentUser.id);
      toast.success('Record submitted successfully');
      navigate(`/quality-event/capa/${newRecord.id}`);
    } catch {
      toast.error('Failed to submit record');
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-white relative">
      <div className="px-6 py-4 border-b">
        <h1 className="text-2xl font-bold text-zinc-900">Create Quality Complaint / CAR-PAR</h1>
        <p className="text-zinc-500">Ref: FM-QC-30 R04</p>
      </div>

      <div className="px-6 py-6 border-b bg-zinc-50/50">
        <NcCapaStepper steps={steps} currentStep={currentStep} />
      </div>

      <div className="flex-1 overflow-y-auto p-6">
        {currentStep === 0 && (
          <div className="space-y-6 animate-in fade-in max-w-2xl">
            <h2 className="text-lg font-semibold border-b pb-2">Step 1: CAPA / CAR-PAR Type</h2>
            <div>
              <label className="block text-sm font-medium mb-1">Record Type <span className="text-red-500">*</span></label>
              <select 
                className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 outline-none"
                value={formData.recordType || ''}
                onChange={(e) => updateForm('recordType', e.target.value)}
              >
                <option value="QUALITY_COMPLAINT">Quality Complaint</option>
                <option value="CAR">CAR</option>
                <option value="PAR">PAR</option>
                <option value="CAPA">CAPA</option>
              </select>
            </div>
            {(formData.recordType === 'CAR' || formData.recordType === 'CAPA') && (
              <div>
                <label className="block text-sm font-medium mb-1">CAPA Type</label>
                <select 
                  className="w-full p-2 border rounded"
                  value={formData.capaType || ''}
                  onChange={(e) => updateForm('capaType', e.target.value)}
                >
                  <option value="">Select Type...</option>
                  <option value="CORRECTIVE_ACTION">Corrective Action</option>
                  <option value="PREVENTIVE_ACTION">Preventive Action</option>
                  <option value="CORRECTIVE_AND_PREVENTIVE">Corrective + Preventive</option>
                </select>
              </div>
            )}
            <div>
              <label className="block text-sm font-medium mb-1">Severity <span className="text-red-500">*</span></label>
              <select 
                className="w-full p-2 border rounded"
                value={formData.severity || ''}
                onChange={(e) => updateForm('severity', e.target.value)}
              >
                <option value="">Select Severity...</option>
                <option value="LOW">Low</option>
                <option value="MEDIUM">Medium</option>
                <option value="HIGH">High</option>
                <option value="CRITICAL">Critical</option>
              </select>
            </div>
          </div>
        )}

        {currentStep === 1 && (
          <div className="space-y-6 animate-in fade-in max-w-2xl">
            <h2 className="text-lg font-semibold border-b pb-2">Step 2: Problem Information</h2>
            <div>
              <label className="block text-sm font-medium mb-1">Title <span className="text-red-500">*</span></label>
              <input 
                type="text"
                className="w-full p-2 border rounded"
                value={formData.title || ''}
                onChange={(e) => updateForm('title', e.target.value)}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Problem Description <span className="text-red-500">*</span></label>
              <textarea 
                className="w-full p-2 border rounded h-32"
                value={formData.problemDescription || ''}
                onChange={(e) => updateForm('problemDescription', e.target.value)}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Date Found <span className="text-red-500">*</span></label>
              <input 
                type="date"
                className="w-full p-2 border rounded"
                value={formData.dateFound || ''}
                onChange={(e) => updateForm('dateFound', e.target.value)}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Requester Department <span className="text-red-500">*</span></label>
              <select 
                className="w-full p-2 border rounded"
                value={formData.requesterDept || ''}
                onChange={(e) => updateForm('requesterDept', e.target.value)}
              >
                <option value="">Select Department...</option>
                {masterDepartments?.map(d => (
                  <option key={d.id} value={d.id}>{d.name}</option>
                ))}
              </select>
            </div>
          </div>
        )}

        {currentStep === 2 && (
          <div className="space-y-6 animate-in fade-in max-w-2xl">
            <h2 className="text-lg font-semibold border-b pb-2">Step 3: Immediate Correction</h2>
            <div>
              <label className="flex items-center p-3 border rounded-lg cursor-pointer hover:bg-zinc-50">
                <input 
                  type="checkbox" 
                  checked={formData.immediateCorrectionReq || false}
                  onChange={(e) => updateForm('immediateCorrectionReq', e.target.checked)}
                  className="rounded focus:ring-blue-500 h-4 w-4 text-blue-600"
                />
                <span className="ml-3 font-medium">Immediate Correction Required</span>
              </label>
            </div>
            {formData.immediateCorrectionReq && (
              <div>
                <label className="block text-sm font-medium mb-1">Correction Description <span className="text-red-500">*</span></label>
                <textarea 
                  className="w-full p-2 border rounded h-24"
                  value={formData.correction || ''}
                  onChange={(e) => updateForm('correction', e.target.value)}
                />
              </div>
            )}
          </div>
        )}

        {currentStep === 3 && (
          <div className="space-y-6 animate-in fade-in max-w-2xl">
            <h2 className="text-lg font-semibold border-b pb-2">Step 4: Responsible Department</h2>
            <div>
              <label className="block text-sm font-medium mb-1">Responsible Department <span className="text-red-500">*</span></label>
              <select 
                className="w-full p-2 border rounded"
                value={formData.responsibleDept || ''}
                onChange={(e) => updateForm('responsibleDept', e.target.value)}
              >
                <option value="">Select Department...</option>
                {masterDepartments?.map(d => (
                  <option key={d.id} value={d.id}>{d.name}</option>
                ))}
              </select>
            </div>
          </div>
        )}

        {currentStep === 4 && (
          <div className="space-y-6 animate-in fade-in max-w-2xl">
            <h2 className="text-lg font-semibold border-b pb-2">Step 5: Review & Submit</h2>
            <div className="bg-zinc-50 p-6 rounded-lg border">
              <h3 className="font-bold text-lg mb-4">Summary</h3>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-zinc-500 block">Record Type</span>
                  <span className="font-medium">{formData.recordType || '-'}</span>
                </div>
                <div>
                  <span className="text-zinc-500 block">Title</span>
                  <span className="font-medium">{formData.title || '-'}</span>
                </div>
                <div>
                  <span className="text-zinc-500 block">Responsible Dept</span>
                  <span className="font-medium">{formData.responsibleDept || '-'}</span>
                </div>
                <div>
                  <span className="text-zinc-500 block">Severity</span>
                  <span className="font-medium">{formData.severity || '-'}</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="p-4 border-t flex justify-between bg-zinc-50">
        <button
          onClick={handleBack}
          disabled={currentStep === 0 || isSubmitting}
          className="px-6 py-2 border bg-white rounded-lg disabled:opacity-50"
        >
          Back
        </button>
        {currentStep < steps.length - 1 ? (
          <button
            onClick={handleNext}
            className="px-6 py-2 bg-zinc-900 text-white rounded-lg"
          >
            Next
          </button>
        ) : (
          <button
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg flex items-center disabled:opacity-50"
          >
            <Send size={18} className="mr-2" />
            Submit
          </button>
        )}
      </div>
    </div>
  );
};

export default CapaNew;
