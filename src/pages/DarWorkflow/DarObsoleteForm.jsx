import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import useStore from '../../store/useStore';
import toast from 'react-hot-toast';
import { Calendar, X, Settings, Trash2, ShieldAlert, FileText } from 'lucide-react';
import UserSelector from '../../components/UserSelector';
import ActionConfirmModal from '../../components/common/ActionConfirmModal';

const DarObsoleteForm = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const draftId = searchParams.get('draftId');
  const { currentUser, addDar, deleteDar, masterUsers, documents, dars, simulatedDate } = useStore();
  
  const [formData, setFormData] = useState({
    docId: '',
    obsoleteReason: '',
    otherReason: '',
    obsoleteDetail: '',
    recallPlan: '',
    ackRequirement: 'NOT_REQUIRED',
    ackUserId: '',
    effectiveDate: '', // Requested Obsolete Date
  });
  
  const [errors, setErrors] = useState({});
  const [showConfirm, setShowConfirm] = useState(false);

  // Filter only EFFECTIVE documents for the current user's department
  const userDept = currentUser.department || currentUser.dept;
  const effectiveDocs = documents.filter(d => d.status === 'EFFECTIVE' && d.department === userDept);

  // Security Handling: Clear selected doc if user switches and the doc is no longer in the filtered list
  useEffect(() => {
    if (formData.docId) {
      const isStillValid = effectiveDocs.some(d => d.id === formData.docId);
      if (!isStillValid) {
        setFormData(prev => ({ ...prev, docId: '' }));
      }
    }
  }, [currentUser, formData.docId, effectiveDocs]);

  useEffect(() => {
    if (draftId) {
      const draft = dars.find(d => d.id === draftId && d.status === 'DRAFT');
      if (draft) {
        setFormData({
          docId: draft.docIdRef || '',
          obsoleteReason: draft.obsoleteReason || '',
          otherReason: draft.otherReason || '',
          obsoleteDetail: draft.obsoleteDetail || '',
          recallPlan: draft.recallPlan || '',
          ackRequirement: draft.ackRequirement || 'NOT_REQUIRED',
          ackUserId: draft.ackUserIds?.[0] || '',
          effectiveDate: draft.effectiveDate || '',
        });
      }
    }
  }, [draftId, dars]);

  const selectedDoc = effectiveDocs.find(d => d.id === formData.docId);

  const handleDocChange = (e) => {
    const docId = e.target.value;
    setFormData({
      ...formData,
      docId,
      replacementDocId: '', // Reset if doc changes
    });
  };

  const validate = () => {
    const newErrors = {};
    if (!formData.docId) newErrors.docId = 'กรุณาเลือกเอกสารที่ต้องการยกเลิก';
    if (!formData.obsoleteReason) newErrors.obsoleteReason = 'กรุณาเลือกเหตุผลการยกเลิก';
    if (formData.obsoleteReason === 'OTHER' && !formData.otherReason) newErrors.otherReason = 'กรุณาระบุเหตุผลอื่นๆ';
    if (!formData.obsoleteDetail) newErrors.obsoleteDetail = 'กรุณาระบุรายละเอียดการยกเลิก';

    if (selectedDoc && selectedDoc.controlledCopy > 0 && !formData.recallPlan) {
      newErrors.recallPlan = 'จำเป็นต้องระบุแผนการเรียกคืน เนื่องจากมีสำเนาควบคุมในระบบ';
    }

    if (formData.ackRequirement === 'REQUIRED' && !formData.ackUserId) {
      newErrors.ackUserId = 'กรุณาเลือกผู้รับ Acknowledgement 1 คน';
    }
    
    if (!formData.effectiveDate) {
      newErrors.effectiveDate = 'กรุณาระบุวันที่ต้องการให้เอกสารมีผลยกเลิก';
    } else {
      const today = new Date(simulatedDate);
      today.setHours(0,0,0,0);
      const selected = new Date(formData.effectiveDate);
      if (selected < today) newErrors.effectiveDate = 'ห้ามเลือกวันย้อนหลัง (นับจาก Simulated Date)';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const buildPayload = (isDraft) => {
    return {
      type: 'OBSOLETE',
      status: isDraft ? 'DRAFT' : 'UNDER_REVIEW', // handled by addDar anyway, but let's pass
      title: selectedDoc ? `[OBSOLETE] ${selectedDoc.title}` : 'Untitled Draft',
      requesterId: currentUser.id,
      department: currentUser.department,
      date: new Date().toISOString().split('T')[0],
      docIdRef: formData.docId,
      obsoleteReason: formData.obsoleteReason,
      otherReason: formData.obsoleteReason === 'OTHER' ? formData.otherReason : undefined,
      obsoleteDetail: formData.obsoleteDetail,
      recallPlan: formData.recallPlan,
      ackRequirement: formData.ackRequirement,
      ackUserIds: formData.ackRequirement === 'REQUIRED' ? [formData.ackUserId] : [],
      distributions: [], // Obsolete docs don't distribute new copies
      effectiveDate: formData.effectiveDate,
      isDraft: isDraft
    };
  };

  const handleDraft = () => {
    const newDar = buildPayload(true);
    if (draftId) deleteDar(draftId);
    addDar(newDar);
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
    const newDar = buildPayload(false);
    if (draftId) deleteDar(draftId);
    addDar(newDar);
    setShowConfirm(false);
    toast.success('สร้างคำร้องขอยกเลิกเอกสารสำเร็จ และส่งต่อให้ Reviewer แล้ว');
    navigate('/dashboard');
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <Trash2 className="text-red-600" size={32} strokeWidth={1.25}/>
        <h2 className="text-2xl font-bold text-gray-800 ">ยื่นคำขอยกเลิกเอกสาร (Obsolete DAR)</h2>
      </div>
      
      <form onSubmit={handleFormSubmit} className="space-y-6">
        
        {/* Section 1: Select Effective Document */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-visible">
          <div className="px-6 py-4 border-b border-gray-100 bg-gray-50 flex items-center gap-2">
            <Settings className="text-gray-500" size={24} strokeWidth={1.25}/>
            <h3 className="font-semibold text-gray-800 ">Section 1: Select Effective Document</h3>
          </div>
          <div className="p-6">
            <label className="block text-sm font-medium text-gray-700  mb-1">เลือกเอกสารที่ต้องการยกเลิก (จากคลัง Effective) <span className="text-red-500 ">*</span></label>
            <select 
              value={formData.docId}
              onChange={handleDocChange}
              className={`w-full md:w-2/3 border rounded-lg px-3 py-2 ${errors.docId ? 'border-red-500 bg-red-50' : 'border-gray-300 focus:ring-red-100'}`}
            >
              <option value="">-- เลือกเอกสาร --</option>
              {effectiveDocs.map(d => (
                <option key={d.id} value={d.id}>[{d.title}] {d.name} (Rev: {d.rev})</option>
              ))}
            </select>
            {errors.docId && <p className="text-red-500  text-xs mt-1">{errors.docId}</p>}

            {/* Read-only Snapshot */}
            {selectedDoc && (
              <div className="mt-6 bg-red-50/50 p-5 rounded-lg border border-red-100 grid grid-cols-2 md:grid-cols-5 gap-4 relative overflow-hidden">
                <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none">
                  <Trash2 className="text-red-900" size={24} strokeWidth={1.25}/>
                </div>
                <div className="relative z-10">
                  <p className="text-xs text-gray-500  mb-1">รหัสเอกสาร</p>
                  <p className="font-semibold text-gray-800 ">{selectedDoc.title}</p>
                </div>
                <div className="relative z-10 md:col-span-2">
                  <p className="text-xs text-gray-500  mb-1">ชื่อเอกสาร</p>
                  <p className="font-semibold text-gray-800  truncate" title={selectedDoc.name}>{selectedDoc.name}</p>
                </div>
                <div className="relative z-10">
                  <p className="text-xs text-gray-500  mb-1">Revision ปัจจุบัน</p>
                  <p className="font-semibold text-gray-800 ">Rev. {selectedDoc.rev}</p>
                </div>
                <div className="relative z-10">
                  <p className="text-xs text-gray-500  mb-1">วันที่เริ่มมีผล</p>
                  <p className="font-semibold text-gray-800 ">{selectedDoc.effectiveDate || 'N/A'}</p>
                </div>
                <div className="relative z-10 col-span-2 md:col-span-5 border-t border-red-100 pt-3 mt-1 flex items-center gap-2">
                  <ShieldAlert className={`${selectedDoc.controlledCopy > 0 ? 'text-red-600 ' : 'text-green-600 '}`} size={24} strokeWidth={1.25} />
                  <span className="text-sm font-medium text-gray-700 ">จำนวนสำเนาควบคุมในระบบ (Controlled Copy): </span>
                  <span className={`text-base font-bold ${selectedDoc.controlledCopy > 0 ? 'text-red-600 ' : 'text-green-600 '}`}>{selectedDoc.controlledCopy} ฉบับ</span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Section 2: Obsolete Rationale */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100 bg-gray-50 flex items-center gap-2">
            <FileText className="text-gray-500" size={24} strokeWidth={1.25}/>
            <h3 className="font-semibold text-gray-800 ">Section 2: Obsolete Rationale</h3>
          </div>
          <div className="p-6 space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700  mb-1">เหตุผลการยกเลิก (Obsolete Reason) <span className="text-red-500 ">*</span></label>
              <select 
                value={formData.obsoleteReason}
                onChange={(e) => setFormData({...formData, obsoleteReason: e.target.value})}
                className={`w-full md:w-1/2 border rounded-lg px-3 py-2 ${errors.obsoleteReason ? 'border-red-500 bg-red-50' : 'border-gray-300 focus:ring-red-100'}`}
              >
                <option value="">-- เลือกเหตุผล --</option>
                <option value="PROCESS_CHANGE">ปรับปรุงกระบวนการและควบรวมกับเอกสารอื่น</option>
                <option value="PROCESS_REMOVED">ยกเลิกกระบวนการทำงานดังกล่าวแล้ว</option>
                <option value="AUDIT_FINDING">ยกเลิกตามข้อเสนอแนะจากการตรวจติดตาม</option>
                <option value="DUPLICATED">เอกสารซ้ำซ้อน</option>
                <option value="OTHER">อื่นๆ</option>
              </select>
              {errors.obsoleteReason && <p className="text-red-500  text-xs mt-1">{errors.obsoleteReason}</p>}
              
              {formData.obsoleteReason === 'OTHER' && (
                <div className="mt-3 md:w-1/2">
                  <label className="block text-sm font-medium text-gray-700  mb-1">โปรดระบุเหตุผลอื่นๆ <span className="text-red-500 ">*</span></label>
                  <input 
                    type="text"
                    value={formData.otherReason}
                    onChange={(e) => setFormData({...formData, otherReason: e.target.value})}
                    className={`w-full border rounded-lg px-3 py-2 ${errors.otherReason ? 'border-red-500 bg-red-50' : 'border-gray-300 focus:ring-red-100'}`}
                    placeholder="ระบุเหตุผล..."
                  />
                  {errors.otherReason && <p className="text-red-500  text-xs mt-1">{errors.otherReason}</p>}
                </div>
              )}
            </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700  mb-1">รายละเอียดเพิ่มเติม (Details) <span className="text-red-500 ">*</span></label>
                <textarea 
                  rows="3"
                  value={formData.obsoleteDetail}
                  onChange={(e) => setFormData({...formData, obsoleteDetail: e.target.value})}
                  className={`w-full border rounded-lg px-3 py-2 ${errors.obsoleteDetail ? 'border-red-500 bg-red-50' : 'border-gray-300 focus:ring-red-100'}`}
                  placeholder="อธิบายเหตุผลให้ละเอียด..."
                />
                {errors.obsoleteDetail && <p className="text-red-500  text-xs mt-1">{errors.obsoleteDetail}</p>}
              </div>
          </div>
        </div>

        {/* Section 3: Recall Plan (Conditional) */}
        {selectedDoc && (
          <div className={`bg-white rounded-xl shadow-sm border ${selectedDoc.controlledCopy > 0 ? 'border-red-300 ring-1 ring-red-100' : 'border-gray-100'} overflow-hidden transition-all duration-300`}>
            <div className={`px-6 py-4 border-b flex items-center gap-2 ${selectedDoc.controlledCopy > 0 ? 'bg-red-50 border-red-100' : 'bg-gray-50 border-gray-100'}`}>
              <ShieldAlert className={`${selectedDoc.controlledCopy > 0 ? 'text-red-600 ' : 'text-gray-500 '}`} size={24} strokeWidth={1.25} />
              <h3 className={`font-semibold ${selectedDoc.controlledCopy > 0 ? 'text-red-800' : 'text-gray-800 '}`}>Section 3: Recall Plan (แผนเรียกคืนสำเนา)</h3>
            </div>
            <div className="p-6">
              {selectedDoc.controlledCopy > 0 ? (
                <div className="space-y-4">
                  <div className="bg-red-50 p-3 rounded text-sm text-red-800 border border-red-100 flex gap-2">
                    <ShieldAlert className="shrink-0" size={24} strokeWidth={1.25}/>
                    <p>เอกสารฉบับนี้มี <b>สำเนาควบคุม (Controlled Copy) แจกจ่ายอยู่ {selectedDoc.controlledCopy} ฉบับ</b> คุณจำเป็นต้องระบุแผนการเรียกคืนหรือสื่อสารให้ผู้ถือครองสำเนาทราบ เพื่อป้องกันการนำเอกสารที่ถูกยกเลิกไปใช้งานผิดพลาด</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700  mb-1">แผนการเรียกคืน (Recall/Communication Plan) <span className="text-red-500 ">*</span></label>
                    <textarea 
                      rows="3"
                      value={formData.recallPlan}
                      onChange={(e) => setFormData({...formData, recallPlan: e.target.value})}
                      className={`w-full border rounded-lg px-3 py-2 ${errors.recallPlan ? 'border-red-500 bg-red-50' : 'border-gray-300 focus:ring-red-100'}`}
                      placeholder="ระบุวิธีการสื่อสารและระยะเวลาที่จะเรียกคืนเอกสารกลับมาทำลาย..."
                    />
                    {errors.recallPlan && <p className="text-red-500  text-xs mt-1">{errors.recallPlan}</p>}
                  </div>
                </div>
              ) : (
                <div className="text-center py-4 bg-gray-50 rounded-lg border border-dashed border-gray-200">
                  <p className="text-green-600  font-medium">✅ ไม่พบสำเนาควบคุมในระบบ</p>
                  <p className="text-sm text-gray-500  mt-1">เอกสารนี้ไม่มีการกระจาย Hard Copy แบบควบคุมไว้ จึงไม่จำเป็นต้องระบุแผนการเรียกคืน</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Section 4: Effective Control & Ack */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-visible">
          <div className="px-6 py-4 border-b border-gray-100 bg-gray-50 flex items-center gap-2">
            <Calendar className="text-gray-500" size={24} strokeWidth={1.25}/>
            <h3 className="font-semibold text-gray-800 ">Section 4: Effective Control & Acknowledgement</h3>
          </div>
          <div className="p-6 space-y-6">
            
            {/* Ack */}
            <div>
              <label className="block text-sm font-medium text-gray-700  mb-3">การรับทราบเอกสารฉบับยกเลิก (Acknowledgement) <span className="text-red-500 ">*</span></label>
              <div className="flex gap-6 mb-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input 
                    type="radio" 
                    name="ack"
                    value="NOT_REQUIRED"
                    checked={formData.ackRequirement === 'NOT_REQUIRED'}
                    onChange={(e) => setFormData({...formData, ackRequirement: e.target.value, ackUserId: ''})}
                    className="w-4 h-4 text-red-600  border-gray-300 focus:ring-red-500"
                  />
                  <span className="text-gray-700 ">ไม่ต้องรับทราบ (Not Required)</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input 
                    type="radio" 
                    name="ack"
                    value="REQUIRED"
                    checked={formData.ackRequirement === 'REQUIRED'}
                    onChange={(e) => setFormData({...formData, ackRequirement: e.target.value})}
                    className="w-4 h-4 text-red-600  border-gray-300 focus:ring-red-500"
                  />
                  <span className="text-gray-700 ">ต้องรับทราบ (Required)</span>
                </label>
              </div>

              {formData.ackRequirement === 'REQUIRED' && (
                <div className={`p-4 rounded-xl border ${errors.ackUserId ? 'border-red-300 bg-red-50' : 'border-red-100 bg-red-50/30'}`}>
                  <label className="block text-sm font-medium text-gray-700  mb-2">เลือกผู้ที่ต้องรับทราบ (1 คน)</label>
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

            {/* Date */}
            <div className="border-t pt-6">
              <label className="block text-sm font-medium text-gray-700  mb-1">วันที่ต้องการให้เอกสารมีผลยกเลิก (Requested Obsolete Date) <span className="text-red-500 ">*</span></label>
              <input 
                type="date"
                value={formData.effectiveDate}
                min={new Date().toISOString().split('T')[0]} 
                onChange={(e) => setFormData({...formData, effectiveDate: e.target.value})}
                className={`w-full md:w-1/3 border rounded-lg px-3 py-2 ${errors.effectiveDate ? 'border-red-500 bg-red-50' : 'border-gray-300 focus:ring-red-100'}`}
              />
              <p className="text-xs text-gray-400  mt-2">หมายเหตุ: เอกสารจะยังคงสถานะ EFFECTIVE ไว้จนกว่าจะถึงกำหนดการนี้ และผ่านการอนุมัติครบถ้วน</p>
              {errors.effectiveDate && <p className="text-red-500  text-xs mt-1">{errors.effectiveDate}</p>}
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
            className="px-8 py-2.5 btn-ios-primary text-lg !bg-red-600 hover:!bg-red-700"
          >
            <Trash2 size={20} strokeWidth={1.25}/> ส่งคำขอยกเลิก (Submit)
          </button>
        </div>
      </form>

      <ActionConfirmModal
        isOpen={showConfirm}
        onClose={() => setShowConfirm(false)}
        onConfirm={executeSubmit}
        title="Confirm Obsolete DAR Submission"
        actionType="obsolete"
        requireTypeToConfirm={true}
        summaryData={[
          { label: 'Action By', value: currentUser.name },
          { label: 'Department', value: currentUser.department },
          { label: 'Document', value: selectedDoc ? `[${selectedDoc.title}] ${selectedDoc.name}` : '' },
          { label: 'Obsolete Reason', value: formData.obsoleteReason === 'OTHER' ? formData.otherReason : formData.obsoleteReason },
          { label: 'Next Action / Routing', value: 'Routes to: Reviewer (Level 2)' }
        ]}
      />
    </div>
  );
};

export default DarObsoleteForm;
