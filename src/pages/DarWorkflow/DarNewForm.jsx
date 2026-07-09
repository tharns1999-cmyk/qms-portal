import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import useStore from '../../store/useStore';
import toast from 'react-hot-toast';
import { Upload, FileText, User, Calendar, Settings, X, ShieldAlert } from 'lucide-react';
import UserSelector from '../../components/UserSelector';
import DistributionSetup from '../../components/workflow/DistributionSetup';
import RelatedStandardsSelector from '../../components/workflow/RelatedStandardsSelector';
import ActionConfirmModal from '../../components/common/ActionConfirmModal';

const DarNewForm = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const draftId = searchParams.get('draftId');
  const { currentUser, addDar, deleteDar, dars, documents, masterUsers, simulatedDate } = useStore();
  
  const [formData, setFormData] = useState({
    docType: '',
    docIdInput: '',
    title: '',
    requestDetail: '',
    requestReason: '',
    ackRequirement: 'NOT_REQUIRED',
    ackUserId: '',
    distributions: [],
    effectiveDate: '',
    file: null,
    manualReviewerId: '',
    manualApproverId: '',
    relatedStandards: [],
    otherStandardDetail: ''
  });
  
  const [errors, setErrors] = useState({});
  const [showConfirm, setShowConfirm] = useState(false);

  useEffect(() => {
    if (draftId) {
      const draft = dars.find(d => d.id === draftId && d.status === 'DRAFT');
      if (draft) {
        setFormData({
          docType: draft.docType || '',
          docIdInput: draft.docIdInput || '',
          title: draft.title === 'Untitled Draft' ? '' : (draft.title || ''),
          requestDetail: draft.requestDetail || '',
          requestReason: draft.requestReason || '',
          ackRequirement: draft.ackRequirement || 'NOT_REQUIRED',
          ackUserId: draft.ackUserIds?.[0] || '',
          distributions: draft.distributions || [],
          effectiveDate: draft.effectiveDate || '',
          file: null,
          manualReviewerId: '',
          manualApproverId: '',
          relatedStandards: draft.relatedStandards || [],
          otherStandardDetail: draft.otherStandardDetail || ''
        });
      }
    }
  }, [draftId, dars, currentUser.department]);

  const getPreviewCode = () => {
    if (!formData.docType) return '[กรุณาเลือกชนิดเอกสารเพื่อสร้างรหัส]';
    const docPrefix = `${formData.docType}-${currentUser.department}-`;
    const existingDocs = documents.filter(d => d.title.startsWith(docPrefix));
    const existingDars = dars.filter(d => (d.type === 'NEW' || d.type === 'NEW_DOCUMENT') && d.docIdInput && d.docIdInput.startsWith(docPrefix));
    
    let maxSeq = 0;
    existingDocs.forEach(d => {
      const seqStr = d.title.replace(docPrefix, '');
      const seq = parseInt(seqStr, 10);
      if (!isNaN(seq) && seq > maxSeq) maxSeq = seq;
    });
    existingDars.forEach(d => {
      const seqStr = d.docIdInput.replace(docPrefix, '');
      const seq = parseInt(seqStr, 10);
      if (!isNaN(seq) && seq > maxSeq) maxSeq = seq;
    });
    
    return `${docPrefix}${String(maxSeq + 1).padStart(3, '0')}`;
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file && file.type !== 'application/pdf') {
      toast.error('รองรับเฉพาะไฟล์ PDF เท่านั้น');
      e.target.value = '';
      return;
    }
    setFormData({ ...formData, file });
  };

  const validate = () => {
    const newErrors = {};
    if (!formData.docType) newErrors.docType = 'กรุณาเลือกชนิดเอกสาร';
    if (!formData.title) newErrors.title = 'กรุณาระบุชื่อเอกสาร';
    if (!formData.requestDetail) newErrors.requestDetail = 'กรุณาระบุรายละเอียดคำร้องขอ';
    if (!formData.requestReason) newErrors.requestReason = 'กรุณาระบุเหตุผลที่ร้องขอ';
    
    if (formData.relatedStandards?.includes('อื่น ๆ (Others)') && !formData.otherStandardDetail?.trim()) {
      newErrors.otherStandardDetail = 'กรุณาระบุมาตรฐานอื่นๆ';
    }
    
    if (formData.ackRequirement === 'REQUIRED' && !formData.ackUserId) {
      newErrors.ackUserId = 'กรุณาเลือกผู้รับ Acknowledgement 1 คน';
    }
    
    if (!formData.effectiveDate) {
      newErrors.effectiveDate = 'กรุณาระบุวันที่มีผลบังคับใช้';
    } else {
      const today = new Date(simulatedDate);
      today.setHours(0,0,0,0);
      const selected = new Date(formData.effectiveDate);
      if (selected < today) newErrors.effectiveDate = 'ห้ามเลือกวันย้อนหลัง (นับจาก Simulated Date)';
    }
    
    if (!formData.file) newErrors.file = 'กรุณาแนบไฟล์ PDF';
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleDraft = () => {
    const newDar = {
      type: 'NEW',
      status: 'DRAFT',
      title: formData.title || 'Untitled Draft',
      requesterId: currentUser.id,
      department: currentUser.department,
      date: new Date().toISOString().split('T')[0],
      docType: formData.docType,
      docIdInput: getPreviewCode(),
      requestDetail: formData.requestDetail,
      requestReason: formData.requestReason,
      ackRequirement: formData.ackRequirement,
      ackUserIds: formData.ackRequirement === 'REQUIRED' ? [formData.ackUserId] : [],
      distributions: formData.distributions,
      effectiveDate: formData.effectiveDate,
      relatedStandards: formData.relatedStandards,
      otherStandardDetail: formData.otherStandardDetail
    };
    if (draftId) deleteDar(draftId);
    addDar({ ...newDar, isDraft: true });
    toast.success('บันทึกแบบร่างสำเร็จ');
    navigate('/dashboard');
  };

  const handleFormSubmit = (e) => {
    e.preventDefault();
    if (validate()) {
      setShowConfirm(true);
    } else {
      toast.error('กรุณากรอกข้อมูลให้ครบถ้วนและถูกต้อง');
    }
  };

  const executeSubmit = () => {
    const newDar = {
      type: 'NEW',
      title: formData.title,
      requesterId: currentUser.id,
      department: currentUser.department,
      date: new Date().toISOString().split('T')[0],
      docType: formData.docType,
      docIdInput: getPreviewCode(),
      requestDetail: formData.requestDetail,
      requestReason: formData.requestReason,
      ackRequirement: formData.ackRequirement,
      ackUserIds: formData.ackRequirement === 'REQUIRED' ? [formData.ackUserId] : [],
      distributions: formData.distributions,
      effectiveDate: formData.effectiveDate,
      isDraft: false,
      manualReviewerId: formData.manualReviewerId,
      manualApproverId: formData.manualApproverId
    };
    if (draftId) deleteDar(draftId);
    addDar(newDar);
    setShowConfirm(false);
    toast.success('สร้างคำร้องสำเร็จ และส่งต่อให้ Reviewer แล้ว');
    navigate('/dashboard');
  };

  // Get available candidates for Dev Test UI
  const availableReviewers = useStore.getState().reviewUsers.filter(u => (!u.depts || u.depts.length === 0 || u.depts.includes(currentUser.department)) && u.id !== currentUser.id);
  const availableApprovers = useStore.getState().approveUsers.filter(u => (!u.depts || u.depts.length === 0 || u.depts.includes(currentUser.department)) && u.id !== currentUser.id && u.id !== formData.manualReviewerId);

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <FileText className="text-blue-600" size={32} strokeWidth={1.25}/>
        <h2 className="text-2xl font-bold text-gray-800 ">ยื่นคำขอสร้างเอกสารใหม่ (New Document DAR)</h2>
      </div>
      
      <form onSubmit={handleFormSubmit} className="space-y-6">
        
        <div className="premium-card overflow-visible border-none">
          <div className="px-6 py-4 border-b border-slate-200/50  bg-slate-50/50  flex items-center gap-2">
            <User className="text-gray-500" size={24} strokeWidth={1.25}/>
            <h3 className="font-semibold text-gray-800 ">Section 1: Requester Information</h3>
          </div>
          <div className="p-6 grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700  mb-1">ชื่อผู้ร้องขอ (Requester)</label>
              <input type="text" value={currentUser.name} disabled className="input-ios w-full px-3 py-2 text-gray-500  disabled:opacity-50 disabled:bg-slate-50     " />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700  mb-1">แผนกต้นทาง (Department)</label>
              <input type="text" value={currentUser.department} disabled className="input-ios w-full px-3 py-2 text-gray-500  disabled:opacity-50 disabled:bg-slate-50     " />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700  mb-1">วันที่เปิดคำขอ (Request Date)</label>
              <input type="text" value={new Date().toLocaleDateString('th-TH')} disabled className="input-ios w-full px-3 py-2 text-gray-500  disabled:opacity-50 disabled:bg-slate-50     " />
            </div>
          </div>
        </div>

        <div className="premium-card overflow-visible border-none">
          <div className="px-6 py-4 border-b border-slate-200/50  bg-slate-50/50  flex items-center gap-2">
            <Settings className="text-gray-500" size={24} strokeWidth={1.25}/>
            <h3 className="font-semibold text-gray-800 ">Section 2: Document Definition</h3>
          </div>
          <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700  mb-1">ชนิดเอกสาร (Document Type) <span className="text-red-500 ">*</span></label>
              <select 
                value={formData.docType}
                onChange={(e) => {
                  const val = e.target.value;
                  setFormData({
                    ...formData, 
                    docType: val,
                    ...(val === 'FM' ? { ackRequirement: 'NOT_REQUIRED', ackUserId: '' } : {})
                  });
                }}
                className={`input-ios w-full px-3 py-2 ${errors.docType ? 'ring-2 ring-red-400 bg-red-50/50 ' : ''}`}
              >
                <option value="">-- เลือกชนิดเอกสาร --</option>
                {['MA', 'HA', 'HAP', 'FSP', 'QP', 'WI', 'SD', 'FM', 'PS', 'VA'].map(t => {
                  const typeNames = { MA: 'Manual', HA: 'Hazard Analysis', HAP: 'Haccp Plan', FSP: 'Food Safety Plan', QP: 'Quality Procedure', WI: 'Work Instructions', SD: 'Support Document', FM: 'Form', PS: 'Product Specification', VA: 'Validation' };
                  return <option key={t} value={t}>{typeNames[t]} ({t})</option>;
                })}
              </select>
              {errors.docType && <p className="text-red-500  text-xs mt-1">{errors.docType}</p>}
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700  mb-1">รหัสเอกสาร (Document Code)</label>
              <div className="clay-input bg-slate-100  text-slate-500  w-full px-3 py-2 cursor-not-allowed select-none min-h-[40px] flex items-center border border-transparent ">
                {getPreviewCode()}
              </div>
              <p className="text-gray-400  text-xs mt-1">ระบบจะสร้างรหัสเอกสารจริง (เช่น MA-QA-012) และรัน Revision 00 อัตโนมัติเมื่อกดบันทึกหรือส่งคำขอ</p>
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700  mb-1">ชื่อเอกสาร (Document Title) <span className="text-red-500 ">*</span></label>
              <input 
                type="text" 
                placeholder="ระบุชื่อเอกสาร"
                value={formData.title}
                onChange={(e) => setFormData({...formData, title: e.target.value})}
                className={`input-ios w-full px-3 py-2 ${errors.title ? 'ring-2 ring-red-400 bg-red-50/50 ' : ''}`}
              />
              {errors.title && <p className="text-red-500  text-xs mt-1">{errors.title}</p>}
            </div>
          </div>
        </div>

        <div className="premium-card overflow-visible border-none">
          <div className="px-6 py-4 border-b border-slate-200/50  bg-slate-50/50  flex items-center gap-2">
            <FileText className="text-gray-500" size={24} strokeWidth={1.25}/>
            <h3 className="font-semibold text-gray-800 ">Section 3: Request Details & Attachment</h3>
          </div>
          <div className="p-6 space-y-6">
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700  mb-1">รายละเอียดคำร้องขอ <span className="text-red-500 ">*</span></label>
                <textarea 
                  rows="3"
                  value={formData.requestDetail}
                  onChange={(e) => setFormData({...formData, requestDetail: e.target.value})}
                  className={`input-ios w-full px-3 py-2 resize-none ${errors.requestDetail ? 'ring-2 ring-red-400 bg-red-50/50 ' : ''}`}
                />
                {errors.requestDetail && <p className="text-red-500  text-xs mt-1">{errors.requestDetail}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700  mb-1">เหตุผลที่ร้องขอ <span className="text-red-500 ">*</span></label>
                <textarea 
                  rows="3"
                  value={formData.requestReason}
                  onChange={(e) => setFormData({...formData, requestReason: e.target.value})}
                  className={`input-ios w-full px-3 py-2 resize-none ${errors.requestReason ? 'ring-2 ring-red-400 bg-red-50/50 ' : ''}`}
                />
                {errors.requestReason && <p className="text-red-500  text-xs mt-1">{errors.requestReason}</p>}
              </div>
            </div>

            <div className="pt-2">
              <RelatedStandardsSelector
                value={{
                  relatedStandards: formData.relatedStandards,
                  otherStandardDetail: formData.otherStandardDetail
                }}
                onChange={(newVals) => setFormData({ ...formData, ...newVals })}
                error={errors.otherStandardDetail}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700  mb-2">อัปโหลดไฟล์เอกสาร (PDF เท่านั้น) <span className="text-red-500 ">*</span></label>
              <div className="border-2 border-dashed border-gray-300  rounded-xl p-8 flex flex-col items-center justify-center bg-gray-50 ">
                <Upload className="text-blue-500 mb-3" size={40} strokeWidth={1.25}/>
                <input 
                  type="file" 
                  accept="application/pdf"
                  onChange={handleFileChange}
                  className="text-sm text-gray-500  file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-100 file:text-blue-700    hover:file:bg-blue-200  cursor-pointer    "
                />
                {errors.file && <p className="text-red-500  text-sm mt-3">{errors.file}</p>}
              </div>
            </div>

            <div className="border-t border-gray-200  pt-6">
              <label className="block text-sm font-medium text-gray-700  mb-3">การรับทราบเอกสาร (Acknowledgement) <span className="text-red-500 ">*</span></label>
              {formData.docType === 'FM' ? (
                <div className="flex items-start gap-3 text-cyan-800 bg-cyan-50 p-4 rounded-xl border border-cyan-100 mb-4">
                  <ShieldAlert className="w-5 h-5 shrink-0 text-cyan-600 mt-0.5" />
                  <div className="text-sm">
                    <span className="font-semibold block mb-1">เอกสารประเภท Form ระบบจะตั้งค่าเป็นแบบไม่ต้องรับทราบโดยอัตโนมัติ</span>
                  </div>
                </div>
              ) : (
                <div className="flex gap-6 mb-4">
                  <label className="flex items-center gap-2 cursor-pointer text-gray-700 ">
                    <input type="radio" name="ack" value="NOT_REQUIRED" checked={formData.ackRequirement === 'NOT_REQUIRED'} onChange={(e) => setFormData({...formData, ackRequirement: e.target.value, ackUserId: ''})} />
                    <span>ไม่ต้องรับทราบ</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer text-gray-700 ">
                    <input type="radio" name="ack" value="REQUIRED" checked={formData.ackRequirement === 'REQUIRED'} onChange={(e) => setFormData({...formData, ackRequirement: e.target.value})} />
                    <span>ต้องรับทราบ</span>
                  </label>
                </div>
              )}

              {formData.ackRequirement === 'REQUIRED' && formData.docType !== 'FM' && (
                <div className={`p-4 rounded-xl border ${errors.ackUserId ? 'border-red-300 bg-red-50 ' : 'border-blue-100  bg-blue-50/30 '}`}>
                  <p className="text-sm font-medium text-gray-700  mb-3">เลือกผู้ที่ต้องรับทราบเอกสารนี้ (1 คน)</p>
                  <div className="w-full md:w-1/2">
                    <UserSelector 
                      value={formData.ackUserId} 
                      onChange={(id) => setFormData({...formData, ackUserId: id})} 
                      error={errors.ackUserId} 
                      users={masterUsers.filter(u => u.id !== currentUser.id && !u.isDcc && u.role !== 'DCC_ADMIN')} 
                    />
                  </div>
                  {errors.ackUserId && <p className="text-red-500  text-xs mt-2">{errors.ackUserId}</p>}
                </div>
              )}
            </div>
            
          </div>
        </div>

        {/* Section 4: Distribution Management */}
        <DistributionSetup 
          ownerDept={currentUser.department}
          distributions={formData.distributions}
          onChange={(distributions) => setFormData({ ...formData, distributions })}
          documentType={formData.docType}
        />

        {/* Section 5: Effective Control */}
        <div className="premium-card overflow-visible border-none">
          <div className="px-6 py-4 border-b border-slate-200/50  bg-slate-50/50  flex items-center gap-2">
            <Calendar className="text-gray-500" size={24} strokeWidth={1.25}/>
            <h3 className="font-semibold text-gray-800 ">Section 5: Effective Control</h3>
          </div>
          <div className="p-6">
            <label className="block text-sm font-medium text-gray-700  mb-1">วันที่ต้องการให้มีผลบังคับใช้ (Requested Effective Date) <span className="text-red-500 ">*</span></label>
            <input 
              type="date"
              value={formData.effectiveDate}
              min={new Date().toISOString().split('T')[0]} // HTML5 validation fallback
              onChange={(e) => setFormData({...formData, effectiveDate: e.target.value})}
              className={`input-ios w-full md:w-1/3 px-3 py-2 ${errors.effectiveDate ? 'ring-2 ring-red-400 bg-red-50/50 ' : ''}`}
            />
            <p className="text-xs text-gray-400  mt-2">หมายเหตุ: วันที่ระบบประกาศใช้จริง (Actual Effective Date) จะเกิดขึ้นก็ต่อเมื่อผ่านการอนุมัติครบถ้วนและถึงกำหนดเวลานี้</p>
            {errors.effectiveDate && <p className="text-red-500  text-xs mt-1">{errors.effectiveDate}</p>}
          </div>
        </div>

        {/* Developer Testing Section */}
        <div className="premium-card bg-[#fffbeb] overflow-hidden border-none">
          <div className="px-6 py-4 border-b border-yellow-200  bg-yellow-100/50  flex items-center gap-2">
            <Settings className="text-yellow-600" size={24} strokeWidth={1.25}/>
            <h3 className="font-semibold text-yellow-800 ">Developer Testing: SoD Validation</h3>
          </div>
          <div className="p-6">
             <p className="text-sm text-yellow-700   mb-4">
               (เฉพาะโหมดทดสอบ) ปกติระบบจะคำนวณ Reviewer และ Approver ให้คุณอัตโนมัติตาม Position Level แต่คุณสามารถใช้ช่องนี้เพื่อทดสอบหลักการ Segregation of Duties (SoD) ได้ว่ารายชื่อจะหายไปจากตัวเลือก
             </p>
             <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-yellow-800   mb-1">เลือก Reviewer ทดสอบ (ห้ามเป็น Requester)</label>
                  <select 
                    value={formData.manualReviewerId}
                    onChange={(e) => setFormData({...formData, manualReviewerId: e.target.value, manualApproverId: ''})}
                    className="input-ios w-full px-3 py-2 bg-white/50  text-slate-800  border-yellow-200 "
                  >
                    <option value="">-- ให้ระบบคำนวณอัตโนมัติ --</option>
                    {availableReviewers.map(u => (
                      <option key={u.id} value={u.id}>{u.name} (ID: {u.id})</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-yellow-800   mb-1">เลือก Approver ทดสอบ (ห้ามซ้ำ Reviewer/Requester)</label>
                  <select 
                    value={formData.manualApproverId}
                    onChange={(e) => setFormData({...formData, manualApproverId: e.target.value})}
                    className="input-ios w-full px-3 py-2 bg-white/50  text-slate-800  border-yellow-200  disabled:opacity-50"
                    disabled={!formData.manualReviewerId}
                  >
                    <option value="">-- ให้ระบบคำนวณอัตโนมัติ --</option>
                    {availableApprovers.map(u => (
                      <option key={u.id} value={u.id}>{u.name} (ID: {u.id})</option>
                    ))}
                  </select>
                </div>
             </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="premium-glass px-6 py-4 flex justify-end gap-3 rounded-2xl mx-auto mt-8">
          <button 
            type="button" 
            onClick={() => navigate('/dashboard')}
            className="btn-ios-secondary text-gray-500"
          >
            <X size={20} strokeWidth={1.25}/> ยกเลิก (Cancel)
          </button>
          <button 
            type="button" 
            onClick={handleDraft}
            className="px-6 py-2.5 bg-gray-800 text-white rounded-xl font-medium transition-all duration-300 ease-out active:scale-95 shadow-sm hover:shadow-md hover:bg-gray-700 hover:-translate-y-[1px]"
          >
            บันทึกแบบร่าง (Draft)
          </button>
          <button 
            type="submit" 
            className="px-8 py-2.5 btn-ios-primary text-lg"
          >
            ส่งคำขอ (Submit)
          </button>
        </div>
      </form>

      <ActionConfirmModal
        isOpen={showConfirm}
        onClose={() => setShowConfirm(false)}
        onConfirm={executeSubmit}
        title="Confirm DAR Submission"
        actionType="submit"
        summaryData={[
          { label: 'Action By', value: currentUser.name },
          { label: 'Department', value: currentUser.department },
          { label: 'Document Type', value: formData.docType },
          { label: 'Document Title', value: formData.title },
          { label: 'Request Reason', value: formData.requestReason },
          { label: 'Next Action / Routing', value: 'Routes to: Reviewer (Level 2)' }
        ]}
      />
    </div>
  );
};

export default DarNewForm;
