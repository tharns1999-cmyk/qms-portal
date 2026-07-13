import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import useStore from '../../../store/useStore';
import { qualityEventComplaintService } from '../services/QualityEventComplaintService';
import { canCreateComplaint } from '../../../utils/permissionHelper';

const ComplaintNew = () => {
  const navigate = useNavigate();
  const { currentUser, masterDepartments, requestUsers } = useStore();
  const [draft, setDraft] = useState(null);
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!canCreateComplaint(currentUser)) {
      setError('Access Denied: You do not have permission to create a Customer Complaint.');
      setLoading(false);
      return;
    }
    const initDraft = async () => {
      try {
        const shell = qualityEventComplaintService.createDraftShell(currentUser);
        setDraft(shell);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    initDraft();
  }, [currentUser]);

  const handleChange = (field, value) => {
    setDraft(prev => ({ ...prev, [field]: value }));
  };

  const handleNext = async () => {
    await qualityEventComplaintService.saveDraft(draft);
    setCurrentStep(s => s + 1);
  };

  const handlePrev = async () => {
    await qualityEventComplaintService.saveDraft(draft);
    setCurrentStep(s => s - 1);
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      await qualityEventComplaintService.saveDraft(draft);
      const submitted = await qualityEventComplaintService.submitComplaint(draft.id, currentUser);
      navigate(`/quality-event/complaint/${submitted.id}`);
    } catch (err) {
      setError(err.message);
      setSubmitting(false);
    }
  };

  if (loading) return <div className="p-6">Loading...</div>;

  if (error) {
    return (
      <div className="p-6 max-w-7xl mx-auto">
        <div className="bg-red-50 text-red-800 p-6 rounded-lg border border-red-200">
          <h2 className="text-xl font-bold mb-2">Access Denied</h2>
          <p>{error}</p>
          <button onClick={() => navigate('/quality-event/complaint')} className="mt-4 bg-red-600 text-white px-4 py-2 rounded">
            Return to List
          </button>
        </div>
      </div>
    );
  }

  const steps = [
    'Intake',
    'Customer Info',
    'Product / Lot',
    'Classification',
    'Health / Medical',
    'Investigation Assignment',
    'Review & Submit'
  ];

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">New Customer Complaint</h1>
        <p className="text-gray-500">FM-QC-68 R01</p>
      </div>

      <div className="flex items-center justify-between mb-8">
        {steps.map((label, i) => (
          <div key={label} className={`flex-1 text-center text-sm font-medium ${currentStep === i + 1 ? 'text-blue-600 font-bold' : 'text-gray-400'}`}>
            <div className={`w-8 h-8 mx-auto rounded-full flex items-center justify-center mb-1 ${currentStep === i + 1 ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-600'}`}>
              {i + 1}
            </div>
            {label}
          </div>
        ))}
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
        {currentStep === 1 && (
          <div className="space-y-4">
            <h2 className="text-lg font-bold">1. Complaint Intake</h2>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Received Date</label>
                <input type="date" value={draft.receivedDate} onChange={(e) => handleChange('receivedDate', e.target.value)} className="w-full border-gray-300 rounded-md" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Received Time</label>
                <input type="time" value={draft.receivedTime} onChange={(e) => handleChange('receivedTime', e.target.value)} className="w-full border-gray-300 rounded-md" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Received Channel</label>
                <select value={draft.receivedChannel} onChange={(e) => handleChange('receivedChannel', e.target.value)} className="w-full border-gray-300 rounded-md">
                  <option value="">Select Channel</option>
                  <option value="Telephone">Telephone</option>
                  <option value="Email">Email</option>
                  <option value="LINE Application">LINE Application</option>
                  <option value="Other">Other</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Received Department (Sales/MKT/QA)</label>
                <input type="text" value={draft.receivedDepartmentId} onChange={(e) => handleChange('receivedDepartmentId', e.target.value)} className="w-full border-gray-300 rounded-md" />
              </div>
            </div>
          </div>
        )}

        {currentStep === 2 && (
          <div className="space-y-4">
            <h2 className="text-lg font-bold">2. Customer Information</h2>
            <div className="bg-blue-50 text-blue-800 p-3 rounded text-sm mb-4">
              This information is highly sensitive and will be masked for unauthorized users.
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Customer Name / Company</label>
                <input type="text" value={draft.customerName} onChange={(e) => handleChange('customerName', e.target.value)} className="w-full border-gray-300 rounded-md" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Contact Person</label>
                <input type="text" value={draft.contactPerson} onChange={(e) => handleChange('contactPerson', e.target.value)} className="w-full border-gray-300 rounded-md" />
              </div>
              <div className="col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
                <input type="text" value={draft.customerAddress} onChange={(e) => handleChange('customerAddress', e.target.value)} className="w-full border-gray-300 rounded-md" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <input type="email" value={draft.email} onChange={(e) => handleChange('email', e.target.value)} className="w-full border-gray-300 rounded-md" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Phone / Fax</label>
                <input type="text" value={draft.telephone} onChange={(e) => handleChange('telephone', e.target.value)} className="w-full border-gray-300 rounded-md" />
              </div>
            </div>
          </div>
        )}

        {currentStep === 3 && (
          <div className="space-y-4">
            <h2 className="text-lg font-bold">3. Product / Lot Information</h2>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Product Name</label>
                <input type="text" value={draft.productName} onChange={(e) => handleChange('productName', e.target.value)} className="w-full border-gray-300 rounded-md" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Lot No.</label>
                <input type="text" value={draft.lotNo} onChange={(e) => handleChange('lotNo', e.target.value)} className="w-full border-gray-300 rounded-md" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Production Date</label>
                <input type="date" value={draft.productionDate} onChange={(e) => handleChange('productionDate', e.target.value)} className="w-full border-gray-300 rounded-md" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Delivery Date</label>
                <input type="date" value={draft.deliveryDate} onChange={(e) => handleChange('deliveryDate', e.target.value)} className="w-full border-gray-300 rounded-md" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Total Quantity</label>
                <input type="text" value={draft.totalQuantity} onChange={(e) => handleChange('totalQuantity', e.target.value)} className="w-full border-gray-300 rounded-md" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Affected Quantity</label>
                <input type="text" value={draft.quantityAffected} onChange={(e) => handleChange('quantityAffected', e.target.value)} className="w-full border-gray-300 rounded-md" />
              </div>
            </div>
          </div>
        )}

        {currentStep === 4 && (
          <div className="space-y-4">
            <h2 className="text-lg font-bold">4. Complaint Details / Classification</h2>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Complaint Description</label>
              <textarea value={draft.complaintDescription} onChange={(e) => handleChange('complaintDescription', e.target.value)} rows={3} className="w-full border-gray-300 rounded-md" />
            </div>
            
            <div className="grid grid-cols-2 gap-4 mt-4">
              <label className="flex items-center gap-2">
                <input type="checkbox" checked={draft.qualityRelated} onChange={(e) => handleChange('qualityRelated', e.target.checked)} />
                <span className="text-sm font-medium">Quality Related</span>
              </label>
              <label className="flex items-center gap-2 text-red-600 font-bold">
                <input type="checkbox" checked={draft.foodSafetyRelated} onChange={(e) => handleChange('foodSafetyRelated', e.target.checked)} />
                <span>Food Safety Related</span>
              </label>
            </div>

            <div className="mt-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">Severity</label>
              <select value={draft.severity} onChange={(e) => handleChange('severity', e.target.value)} className="w-full border-gray-300 rounded-md">
                <option value="LOW">LOW</option>
                <option value="MEDIUM">MEDIUM</option>
                <option value="HIGH">HIGH</option>
              </select>
            </div>

            <div className="mt-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">Action Flags</label>
              <div className="space-y-2">
                <label className="flex items-center gap-2">
                  <input type="checkbox" checked={draft.productHoldRequired} onChange={(e) => handleChange('productHoldRequired', e.target.checked)} />
                  <span className="text-sm">Product Hold Required (May trigger NCR/HOLD)</span>
                </label>
                <label className="flex items-center gap-2 text-red-600 font-medium">
                  <input type="checkbox" checked={draft.recallWithdrawalFlag} onChange={(e) => handleChange('recallWithdrawalFlag', e.target.checked)} />
                  <span className="text-sm">Recall / Withdrawal Required</span>
                </label>
              </div>
            </div>
          </div>
        )}

        {currentStep === 5 && (
          <div className="space-y-4">
            <h2 className="text-lg font-bold">5. Health / Medical</h2>
            <label className="flex items-center gap-2 text-purple-700 font-bold mb-4">
              <input type="checkbox" checked={draft.illnessOrInjury} onChange={(e) => handleChange('illnessOrInjury', e.target.checked)} />
              <span>Customer reported Illness or Injury</span>
            </label>
            
            {draft.illnessOrInjury && (
              <div className="border border-purple-200 bg-purple-50 p-4 rounded-md space-y-4">
                <div>
                  <label className="block text-sm font-medium text-purple-900 mb-1">Symptoms</label>
                  <input type="text" value={draft.symptoms} onChange={(e) => handleChange('symptoms', e.target.value)} className="w-full border-gray-300 rounded-md" />
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <label className="flex items-center gap-2 text-sm text-purple-900">
                    <input type="checkbox" checked={draft.seenDoctor} onChange={(e) => handleChange('seenDoctor', e.target.checked)} /> Seen Doctor
                  </label>
                  <label className="flex items-center gap-2 text-sm text-purple-900">
                    <input type="checkbox" checked={draft.goneToHospital} onChange={(e) => handleChange('goneToHospital', e.target.checked)} /> Hospitalized
                  </label>
                  <label className="flex items-center gap-2 text-sm text-purple-900">
                    <input type="checkbox" checked={draft.spokenToPublicHealth} onChange={(e) => handleChange('spokenToPublicHealth', e.target.checked)} /> Public Health Informed
                  </label>
                </div>
                <div>
                  <label className="block text-sm font-medium text-purple-900 mb-1">Medical Details</label>
                  <textarea value={draft.medicalDetails} onChange={(e) => handleChange('medicalDetails', e.target.value)} rows={2} className="w-full border-gray-300 rounded-md" />
                </div>
              </div>
            )}
          </div>
        )}

        {currentStep === 6 && (
          <div className="space-y-4">
            <h2 className="text-lg font-bold">6. Assign Investigation</h2>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Responsible Department</label>
                <select value={draft.responsibleDepartmentId || ''} onChange={(e) => handleChange('responsibleDepartmentId', e.target.value)} className="w-full border-gray-300 rounded-md">
                  <option value="">-- None (No investigation required) --</option>
                  {masterDepartments.map(d => (
                    d.isGroup ? d.subs.map(s => (
                      <option key={s.id} value={s.id}>{s.name}</option>
                    )) : <option key={d.id} value={d.id}>{d.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Responsible User (Optional)</label>
                <select value={draft.responsibleUserId || ''} onChange={(e) => handleChange('responsibleUserId', e.target.value)} className="w-full border-gray-300 rounded-md">
                  <option value="">-- Any --</option>
                  {requestUsers.filter(u => u.depts.includes(draft.responsibleDepartmentId)).map(u => (
                    <option key={u.id} value={u.id}>{u.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Due Date</label>
                <input type="date" value={draft.investigationDueDate} onChange={(e) => handleChange('investigationDueDate', e.target.value)} className="w-full border-gray-300 rounded-md" />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Investigation Instruction (Optional)</label>
              <textarea value={draft.investigationInstruction} onChange={(e) => handleChange('investigationInstruction', e.target.value)} rows={3} className="w-full border-gray-300 rounded-md" />
            </div>
          </div>
        )}

        {currentStep === 7 && (
          <div className="space-y-4">
            <h2 className="text-lg font-bold">7. Review & Submit</h2>
            <div className="bg-gray-50 p-4 rounded-md text-sm text-gray-800 space-y-2 border border-gray-200">
              <p><strong>Customer:</strong> {draft.customerName || 'N/A'}</p>
              <p><strong>Product:</strong> {draft.productName || 'N/A'}</p>
              <p><strong>Description:</strong> {draft.complaintDescription}</p>
              <p>
                <strong>Risks:</strong> 
                {draft.foodSafetyRelated && <span className="text-red-600 font-bold ml-2">Food Safety</span>}
                {draft.illnessOrInjury && <span className="text-purple-600 font-bold ml-2">Illness/Injury</span>}
                {!draft.foodSafetyRelated && !draft.illnessOrInjury && <span className="text-gray-500 ml-2">None selected</span>}
              </p>
              <p><strong>Assigned Dept:</strong> {draft.responsibleDepartmentId || 'None'}</p>
            </div>
          </div>
        )}

      </div>

      <div className="flex justify-between">
        <button 
          onClick={handlePrev}
          disabled={currentStep === 1 || submitting}
          className="bg-gray-100 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-200 disabled:opacity-50"
        >
          Back
        </button>
        <div className="flex gap-2">
          {currentStep < 7 ? (
            <button 
              onClick={handleNext}
              className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
            >
              Next
            </button>
          ) : (
            <button 
              onClick={handleSubmit}
              disabled={submitting}
              className="bg-green-600 text-white px-6 py-2 rounded-md hover:bg-green-700 shadow font-bold"
            >
              {submitting ? 'Submitting...' : 'Register Complaint'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default ComplaintNew;
