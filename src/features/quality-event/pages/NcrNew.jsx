import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import useStore from '../../../store/useStore';
import { qualityEventNcrService } from '../services/QualityEventNcrService';
import { canCreateNcr, canCreateHold } from '../../../utils/permissionHelper';
import toast from 'react-hot-toast';

const NcrNew = () => {
  const navigate = useNavigate();
  const { currentUser } = useStore();
  const [draft, setDraft] = useState(null);
  const [step, setStep] = useState(1);

  // Security guard
  useEffect(() => {
    if (!canCreateNcr(currentUser) && !canCreateHold(currentUser)) {
      toast.error('Access Denied: QAQC Only');
      navigate('/quality-event/ncr');
      return;
    }
    
    // Create draft
    const newDraft = qualityEventNcrService.createDraftShell(currentUser);
    setDraft(newDraft);
  }, [currentUser, navigate]);

  if (!draft) return <div className="p-8">Loading...</div>;

  const handleNext = () => setStep(s => s + 1);
  const handlePrev = () => setStep(s => s - 1);

  const handleSubmit = async () => {
    try {
      const record = await qualityEventNcrService.submitNcr(draft.id, currentUser);
      toast.success('Record submitted successfully');
      navigate(`/quality-event/ncr/${record.id}`);
    } catch (err) {
      toast.error(err.message || 'Failed to submit');
    }
  };

  const updateField = (field, value) => {
    setDraft(prev => ({ ...prev, [field]: value }));
  };

  return (
    <div className="flex flex-col h-full bg-zinc-50 relative">
      <div className="bg-white px-6 py-4 border-b shrink-0 flex justify-between items-center">
        <div>
          <h1 className="text-xl font-bold text-zinc-900">Create NCR / HOLD</h1>
          <p className="text-sm text-zinc-500">FM-QC-130 R01</p>
        </div>
      </div>

      <div className="flex-1 overflow-auto p-6 max-w-4xl mx-auto w-full">
        {step === 1 && (
          <div className="bg-white p-6 rounded-xl border space-y-4">
            <h2 className="text-lg font-semibold border-b pb-2">Step 1: Scope</h2>
            
            <div>
              <label className="block text-sm font-medium text-zinc-700 mb-1">Record Type *</label>
              <select 
                className="w-full p-2 border rounded"
                value={draft.recordType}
                onChange={e => updateField('recordType', e.target.value)}
              >
                <option value="NCR">NCR Only</option>
                <option value="HOLD_RELEASE">HOLD Only</option>
                <option value="NCR_WITH_HOLD">NCR with HOLD</option>
              </select>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-zinc-700 mb-1">Item Category *</label>
                <select className="w-full p-2 border rounded" value={draft.itemCategory} onChange={e=>updateField('itemCategory', e.target.value)}>
                  <option value="RAW_MATERIAL">Raw Material / Ingredient</option>
                  <option value="PACKAGING">Packaging</option>
                  <option value="PRODUCT">Product</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-zinc-700 mb-1">Status Found *</label>
                <select className="w-full p-2 border rounded" value={draft.materialOrProductStatus} onChange={e=>updateField('materialOrProductStatus', e.target.value)}>
                  <option value="RM_NOT_PROCESSED">RM / Not Processed</option>
                  <option value="WIP_IN_PROCESS">WIP / In-Process</option>
                  <option value="FG_PROCESS_COMPLETED">FG / Process Completed</option>
                </select>
              </div>
            </div>

            <div className="flex gap-4 mt-4">
              <label className="flex items-center gap-2">
                <input type="checkbox" checked={draft.foodSafetyRelated || false} onChange={e=>updateField('foodSafetyRelated', e.target.checked)} />
                <span className="text-sm font-medium text-red-600">Food Safety Related</span>
              </label>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="bg-white p-6 rounded-xl border space-y-4">
            <h2 className="text-lg font-semibold border-b pb-2">Step 2: Product / Material Details</h2>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <label className="block text-sm font-medium text-zinc-700 mb-1">Item Name *</label>
                <input type="text" className="w-full p-2 border rounded" value={draft.materialName || draft.productName || draft.packagingName || ''} onChange={e=>{
                  if (draft.itemCategory === 'PRODUCT') updateField('productName', e.target.value);
                  else if (draft.itemCategory === 'PACKAGING') updateField('packagingName', e.target.value);
                  else updateField('materialName', e.target.value);
                }} />
              </div>
              <div>
                <label className="block text-sm font-medium text-zinc-700 mb-1">Lot No. *</label>
                <input type="text" className="w-full p-2 border rounded" value={draft.lotNo || ''} onChange={e=>updateField('lotNo', e.target.value)} />
              </div>
              <div className="flex gap-2">
                <div className="flex-1">
                  <label className="block text-sm font-medium text-zinc-700 mb-1">Quantity *</label>
                  <input type="number" className="w-full p-2 border rounded" value={draft.quantity || ''} onChange={e=>updateField('quantity', e.target.value)} />
                </div>
                <div className="w-24">
                  <label className="block text-sm font-medium text-zinc-700 mb-1">Unit</label>
                  <input type="text" className="w-full p-2 border rounded" value={draft.unit || ''} onChange={e=>updateField('unit', e.target.value)} />
                </div>
              </div>
              
              {draft.itemCategory !== 'PRODUCT' && (
                <div>
                  <label className="block text-sm font-medium text-zinc-700 mb-1">Supplier</label>
                  <input type="text" className="w-full p-2 border rounded" value={draft.supplier || ''} onChange={e=>updateField('supplier', e.target.value)} />
                </div>
              )}
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="bg-white p-6 rounded-xl border space-y-4">
            <h2 className="text-lg font-semibold border-b pb-2">Step 3: Problem & Assignment</h2>
            
            <div>
              <label className="block text-sm font-medium text-zinc-700 mb-1">Problem Description *</label>
              <textarea className="w-full p-2 border rounded h-24" value={draft.problemDescription || ''} onChange={e=>updateField('problemDescription', e.target.value)}></textarea>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-zinc-700 mb-1">Date Found *</label>
                <input type="date" className="w-full p-2 border rounded" value={draft.dateFound || ''} onChange={e=>updateField('dateFound', e.target.value)} />
              </div>
              <div>
                <label className="block text-sm font-medium text-zinc-700 mb-1">Assign Responsible Department *</label>
                <select className="w-full p-2 border rounded" value={draft.responsibleDepartmentId || ''} onChange={e=>updateField('responsibleDepartmentId', e.target.value)}>
                  <option value="">-- Select Dept --</option>
                  <option value="PD">Production</option>
                  <option value="WH">Warehouse</option>
                  <option value="PC">Purchasing</option>
                  <option value="QA">QA/QC</option>
                </select>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="bg-white px-6 py-4 border-t shrink-0 flex justify-between">
        <button onClick={() => navigate('/quality-event/ncr')} className="px-4 py-2 border rounded font-medium">Cancel</button>
        <div className="flex gap-4">
          {step > 1 && <button onClick={handlePrev} className="px-4 py-2 border rounded font-medium">Back</button>}
          {step < 3 && <button onClick={handleNext} className="px-4 py-2 bg-blue-600 text-white rounded font-medium">Next</button>}
          {step === 3 && <button onClick={handleSubmit} className="px-4 py-2 bg-green-600 text-white rounded font-medium">Submit Record</button>}
        </div>
      </div>
    </div>
  );
};

export default NcrNew;
