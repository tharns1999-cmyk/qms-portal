import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useSearchParams, useLocation } from 'react-router-dom';
import useStore from '../../store/useStore';
import toast from 'react-hot-toast';
import { Upload, FileText, Calendar, Settings, FileEdit, Search, X, FilterX, ShieldAlert } from 'lucide-react';
import UserSelector from '../../components/UserSelector';
import DistributionSetup from '../../components/workflow/DistributionSetup';
import RelatedStandardsSelector from '../../components/workflow/RelatedStandardsSelector';
import ActionConfirmModal from '../../components/common/ActionConfirmModal';
import Button from '../../components/ui/Button';

const DarRevisionForm = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const location = useLocation();
  const draftId = searchParams.get('draftId');
  const prefillDocId = location.state?.prefillDocId;
  const { currentUser, addDar, deleteDar, masterUsers, documents, dars, simulatedDate } = useStore();
  
  const [formData, setFormData] = useState({
    docId: '',
    title: '', // new title, default to old
    changeSummary: '',
    changeReason: '',
    otherReason: '',
    ackRequirement: 'NOT_REQUIRED',
    ackUserId: '',
    distributions: [],
    effectiveDate: '',
    file: null,
    relatedStandards: [],
    otherStandardDetail: ''
  });
  
  const [errors, setErrors] = useState({});
  const [showConfirm, setShowConfirm] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [docTypeFilter, setDocTypeFilter] = useState('');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const searchContainerRef = useRef(null);

  useEffect(() => {
    if (draftId) {
      const draft = dars.find(d => d.id === draftId && d.status === 'DRAFT');
      if (draft) {
        setFormData({
          docId: draft.docIdRef || '',
          title: draft.title === 'Untitled Draft' ? '' : (draft.title || ''),
          changeSummary: draft.changeSummary || '',
          changeReason: draft.changeReason || '',
          otherReason: draft.otherReason || '',
          ackRequirement: draft.ackRequirement || 'NOT_REQUIRED',
          ackUserId: draft.ackUserIds?.[0] || '',
          distributions: draft.distributions || [],
          effectiveDate: draft.effectiveDate || '',
          file: null,
          relatedStandards: draft.relatedStandards || [],
          otherStandardDetail: draft.otherStandardDetail || ''
        });
      }
    }
  }, [draftId, dars, currentUser.department]);

  // Handle Prefill from Periodic Review
  useEffect(() => {
    if (prefillDocId) {
      setFormData(prev => ({ ...prev, docId: prefillDocId }));
    }
  }, [prefillDocId]);

  // Handle click outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Filter only EFFECTIVE documents for the current user's department
  const userDept = currentUser.department || currentUser.dept;
  const effectiveDocs = documents.filter(d => d.status === 'EFFECTIVE' && d.department === userDept);

  // Security Handling: Clear selected doc if user switches and the doc is no longer in the filtered list
  useEffect(() => {
    if (formData.docId) {
      const isStillValid = effectiveDocs.some(d => d.id === formData.docId);
      if (!isStillValid) {
        setFormData(prev => ({ ...prev, docId: '', title: '' }));
      }
    }
  }, [currentUser, formData.docId, effectiveDocs]);

  const filteredDocs = effectiveDocs.filter(d => {
    const matchesType = docTypeFilter ? d.title.startsWith(docTypeFilter) : true;
    const matchesSearch = d.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          d.name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesType && matchesSearch;
  });

  const selectedDoc = effectiveDocs.find(d => d.id === formData.docId);

  const calculateNextRev = (currentRev) => {
    const revNum = parseInt(currentRev, 10);
    if (isNaN(revNum)) return '01';
    return String(revNum + 1).padStart(2, '0');
  };

  const handleDocSelect = (doc) => {
    setFormData({
      ...formData,
      docId: doc.id,
      title: doc.name, // Default title to old name
      distributions: doc.distributions ? JSON.parse(JSON.stringify(doc.distributions)) : [], // copy old distributions as starting point
      relatedStandards: doc.relatedStandards ? [...doc.relatedStandards] : [],
      otherStandardDetail: doc.otherStandardDetail || '',
      ...(doc.title && doc.title.startsWith('FM') ? { ackRequirement: 'NOT_REQUIRED', ackUserId: '' } : {})
    });
    setSearchQuery('');
    setIsDropdownOpen(false);
  };
  
  const handleClearDoc = () => {
    setFormData({
      ...formData,
      docId: '',
      title: '',
      relatedStandards: [],
      otherStandardDetail: ''
    });
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

  // Remove old toggleDept from here

  const validate = () => {
    const newErrors = {};
    if (!formData.docId) newErrors.docId = 'กรุณาเลือกเอกสารที่ต้องการแก้ไข';
    if (!formData.title) newErrors.title = 'กรุณาระบุชื่อเอกสารใหม่ (หรือใช้ชื่อเดิม)';
    if (!formData.changeSummary) newErrors.changeSummary = 'กรุณาสรุปการเปลี่ยนแปลง';
    if (!formData.changeReason) newErrors.changeReason = 'กรุณาเลือกเหตุผลที่แก้ไข';
    if (formData.changeReason === 'OTHER' && !formData.otherReason) newErrors.otherReason = 'กรุณาระบุเหตุผลอื่นๆ';

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
    
    if (!formData.file) newErrors.file = 'กรุณาแนบไฟล์ PDF ฉบับแก้ไข';
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleDraft = () => {
    const newDar = {
      type: 'REVISION',
      status: 'DRAFT',
      title: formData.title || (selectedDoc ? selectedDoc.name : 'Untitled Draft'),
      requesterId: currentUser.id,
      department: currentUser.department,
      date: new Date().toISOString().split('T')[0],
      docIdRef: formData.docId, // Reference to original doc
      changeSummary: formData.changeSummary,
      changeReason: formData.changeReason,
      otherReason: formData.changeReason === 'OTHER' ? formData.otherReason : undefined,
      ackRequirement: formData.ackRequirement,
      ackUserIds: formData.ackRequirement === 'REQUIRED' ? [formData.ackUserId] : [],
      distributions: formData.distributions,
      effectiveDate: formData.effectiveDate,
      relatedStandards: formData.relatedStandards,
      otherStandardDetail: formData.otherStandardDetail,
      isDraft: true
    };
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
    const newDar = {
      type: 'REVISION',
      title: formData.title,
      requesterId: currentUser.id,
      department: currentUser.department,
      date: new Date().toISOString().split('T')[0],
      docIdRef: formData.docId,
      changeSummary: formData.changeSummary,
      changeReason: formData.changeReason,
      otherReason: formData.changeReason === 'OTHER' ? formData.otherReason : undefined,
      ackRequirement: formData.ackRequirement,
      ackUserIds: formData.ackRequirement === 'REQUIRED' ? [formData.ackUserId] : [],
      distributions: formData.distributions,
      effectiveDate: formData.effectiveDate,
      relatedStandards: formData.relatedStandards,
      otherStandardDetail: formData.otherStandardDetail,
      isDraft: false
    };
    if (draftId) deleteDar(draftId);
    addDar(newDar);
    setShowConfirm(false);
    toast.success('สร้างคำร้อง Revision สำเร็จ และส่งต่อให้ Reviewer แล้ว');
    navigate('/dashboard');
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <FileEdit className="text-orange-600" size={32} strokeWidth={1.25}/>
        <h2 className="text-2xl font-bold text-gray-800 ">ยื่นคำขอแก้ไขเอกสาร (Revision DAR)</h2>
      </div>
      
      <form onSubmit={handleFormSubmit} className="space-y-6">
        
        {/* Section 1: Select Effective Document */}
        <div className="premium-card overflow-visible border-none">
          <div className="px-6 py-4 border-b border-slate-200/50  bg-slate-50/50  flex items-center gap-2 rounded-t-2xl">
            <Settings className="text-gray-500" size={24} strokeWidth={1.25}/>
            <h3 className="font-semibold text-gray-800 ">Section 1: Select Effective Document</h3>
          </div>
          <div className="p-6">
            <label className="block text-sm font-medium text-gray-700  mb-2">เลือกเอกสารที่ต้องการแก้ไข (จากคลัง Effective) <span className="text-red-500 ">*</span></label>
            
            {formData.docId && selectedDoc ? (
              <div className="flex items-center gap-2 w-full">
                <div className="flex-1 border border-gray-300  rounded-lg px-3 py-2 bg-gray-50  flex items-center justify-between">
                  <span className="text-gray-700  font-medium truncate">[{selectedDoc.title}] {selectedDoc.name} (Rev: {selectedDoc.rev})</span>
                  <button 
                    type="button" 
                    onClick={handleClearDoc}
                    className="text-gray-400  hover:text-red-500  transition-colors"
                    title="ล้างค่าเพื่อเลือกเอกสารใหม่"
                  >
                    <X size={24} strokeWidth={1.25}/>
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex flex-col md:flex-row items-center gap-4 w-full">
                <div className="w-full md:w-1/3">
                  <select
                    value={docTypeFilter}
                    onChange={(e) => setDocTypeFilter(e.target.value)}
                    className="input-ios w-full px-3 py-2 text-sm h-[42px]"
                  >
                    <option value="">ทั้งหมด (All Types)</option>
                    <option value="MA">Manual (MA)</option>
                    <option value="HA">Hazard Analysis (HA)</option>
                    <option value="HAP">Haccp Plan (HAP)</option>
                    <option value="FSP">Food Safety Plan (FSP)</option>
                    <option value="QP">Quality Procedure (QP)</option>
                    <option value="WI">Work Instructions (WI)</option>
                    <option value="SD">Support Document (SD)</option>
                    <option value="FM">Form (FM)</option>
                    <option value="PS">Product Specification (PS)</option>
                    <option value="VA">Validation (VA)</option>
                  </select>
                </div>
                
                <div className="w-full md:w-2/3 flex items-center gap-2 relative" ref={searchContainerRef}>
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} strokeWidth={1.25}/>
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => {
                        setSearchQuery(e.target.value);
                        setIsDropdownOpen(true);
                      }}
                      onFocus={() => setIsDropdownOpen(true)}
                      placeholder="ค้นหารหัส หรือชื่อเอกสาร..."
                      className={`input-ios w-full pl-10 pr-10 py-2 text-sm h-[42px] ${errors.docId ? 'ring-2 ring-red-400 bg-red-50/50 ' : ''}`}
                    />
                    {searchQuery && (
                      <button
                        type="button"
                        onClick={() => {
                          setSearchQuery('');
                          setIsDropdownOpen(false);
                        }}
                        className="absolute right-3 top-2.5 text-gray-400  hover:text-red-500 "
                        title="ล้างคำค้นหา"
                      >
                        <X size={24} strokeWidth={1.25}/>
                      </button>
                    )}
                    
                    {isDropdownOpen && (
                      <div className="absolute z-50 w-full mt-1 bg-white  border border-gray-200  rounded-lg shadow-xl max-h-60 overflow-y-auto">
                        {filteredDocs.length > 0 ? (
                          filteredDocs.map(d => (
                            <div 
                              key={d.id}
                              onClick={() => handleDocSelect(d)}
                              className="px-4 py-2 hover:bg-orange-50  cursor-pointer border-b border-gray-50  last:border-0"
                            >
                              <p className="font-semibold text-gray-800 ">[{d.title}] {d.name}</p>
                              <p className="text-xs text-gray-500 ">Rev: {d.rev} • {d.department}</p>
                            </div>
                          ))
                        ) : (
                          <div className="px-4 py-3 text-sm text-gray-500  text-center">ไม่พบเอกสารที่ตรงกับการค้นหา</div>
                        )}
                      </div>
                    )}
                  </div>

                  <button 
                    type="button"
                    onClick={() => {
                      setSearchQuery('');
                      setDocTypeFilter('');
                      setIsDropdownOpen(false);
                    }}
                    title="ล้างตัวกรองทั้งหมด"
                    className="p-2 text-gray-400  hover:text-red-500  hover:bg-red-50/50 rounded-lg transition-all duration-300 ease-fluid active:scale-95 h-[42px]"
                  >
                    <FilterX size={24} strokeWidth={1.25}/>
                  </button>
                </div>
              </div>
            )}
            
            {errors.docId && <p className="text-red-500  text-xs mt-1">{errors.docId}</p>}
            {!formData.docId && <p className="text-xs text-gray-500  mt-2">คำแนะนำ: ค้นหาเอกสารและคลิกเพื่อเลือก จากนั้นระบบจะล็อคข้อมูล หากต้องการเปลี่ยนให้กดปุ่ม X</p>}
          </div>
        </div>

        {/* Section 2: Revision Details (Snapshot Area) */}
        {selectedDoc && (
          <div className="premium-card overflow-visible border-none">
            <div className="px-6 py-4 border-b border-slate-200/50  bg-slate-50/50  flex items-center gap-2">
              <FileText className="text-gray-500" size={24} strokeWidth={1.25}/>
              <h3 className="font-semibold text-gray-800 ">Section 2: Revision Details (Snapshot Area)</h3>
            </div>
            <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-blue-50/50  p-4 rounded-lg border border-blue-100  md:col-span-2 grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <p className="text-xs text-gray-500  mb-1">รหัสเอกสารเดิม</p>
                  <p className="font-semibold text-gray-800 ">{selectedDoc.title}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500  mb-1">ชื่อเอกสารเดิม</p>
                  <p className="font-semibold text-gray-800  truncate" title={selectedDoc.name}>{selectedDoc.name}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500  mb-1">Revision เดิม</p>
                  <p className="font-semibold text-gray-800 ">Rev. {selectedDoc.rev}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500  mb-1">Revision ใหม่ที่จะถูกสร้าง</p>
                  <p className="font-bold text-orange-600 ">Rev. {calculateNextRev(selectedDoc.rev)}</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Section 3: Change Details & Rationale */}
        <div className="premium-card overflow-visible border-none">
          <div className="px-6 py-4 border-b border-slate-200/50  bg-slate-50/50  flex items-center gap-2">
            <FileEdit className="text-gray-500" size={24} strokeWidth={1.25}/>
            <h3 className="font-semibold text-gray-800 ">Section 3: Change Details & Rationale</h3>
          </div>
          <div className="p-6 space-y-6">
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700  mb-1">สรุปการเปลี่ยนแปลง (Change Summary) <span className="text-red-500 ">*</span></label>
                <textarea 
                  rows="2"
                  value={formData.changeSummary}
                  onChange={(e) => setFormData({...formData, changeSummary: e.target.value})}
                  className={`input-ios w-full px-3 py-2 resize-none ${errors.changeSummary ? 'ring-2 ring-red-400 bg-red-50/50 ' : ''}`}
                  placeholder="สรุปย่อๆ ว่าแก้เรื่องอะไร..."
                />
                {errors.changeSummary && <p className="text-red-500  text-xs mt-1">{errors.changeSummary}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700  mb-1">เหตุผลที่แก้ไข (Change Reason) <span className="text-red-500 ">*</span></label>
                <select 
                  value={formData.changeReason}
                  onChange={(e) => setFormData({...formData, changeReason: e.target.value})}
                  className={`input-ios w-full px-3 py-2 ${errors.changeReason ? 'ring-2 ring-red-400 bg-red-50/50 ' : ''}`}
                >
                  <option value="">-- เลือกเหตุผล --</option>
                  <option value="PROCESS_IMPROVEMENT">ปรับปรุงกระบวนการทำงานให้ดีขึ้น</option>
                  <option value="AUDIT_FINDING">แก้ไขตามข้อเสนอแนะจากการตรวจติดตาม (Audit Finding)</option>
                  <option value="MANAGEMENT_REVIEW">ทบทวนโดยฝ่ายบริหาร (Management Review)</option>
                  <option value="OTHER">อื่นๆ</option>
                </select>
                {errors.changeReason && <p className="text-red-500  text-xs mt-1">{errors.changeReason}</p>}
                
                {formData.changeReason === 'OTHER' && (
                  <div className="mt-3">
                    <label className="block text-sm font-medium text-gray-700  mb-1">โปรดระบุเหตุผลอื่นๆ <span className="text-red-500 ">*</span></label>
                    <input 
                      type="text"
                      value={formData.otherReason}
                      onChange={(e) => setFormData({...formData, otherReason: e.target.value})}
                      className={`input-ios w-full px-3 py-2 ${errors.otherReason ? 'ring-2 ring-red-400 bg-red-50/50 ' : ''}`}
                      placeholder="ระบุเหตุผล..."
                    />
                    {errors.otherReason && <p className="text-red-500  text-xs mt-1">{errors.otherReason}</p>}
                  </div>
                )}
              </div>
            </div>

            <div className="pt-2 border-t border-gray-100 mt-6">
              <RelatedStandardsSelector
                value={{
                  relatedStandards: formData.relatedStandards,
                  otherStandardDetail: formData.otherStandardDetail
                }}
                onChange={(newVals) => setFormData({ ...formData, ...newVals })}
                error={errors.otherStandardDetail}
              />
            </div>

          </div>
        </div>

        {/* Section 4: Distribution Management & Attachment */}
        <div className="premium-card overflow-visible border-none">
          <div className="px-6 py-4 border-b border-slate-200/50  bg-slate-50/50  flex items-center gap-2">
            <Upload className="text-gray-500" size={24} strokeWidth={1.25}/>
            <h3 className="font-semibold text-gray-800 ">Section 4: Distribution & Attachment</h3>
          </div>
          <div className="p-6 space-y-8">
            
            {/* Attachment */}
            <div>
              <label className="block text-sm font-medium text-gray-700  mb-2">อัปโหลดไฟล์เอกสารฉบับแก้ไข (PDF เท่านั้น) <span className="text-red-500 ">*</span></label>
              <div className="border-2 border-dashed border-gray-300  rounded-xl p-8 flex flex-col items-center justify-center bg-gray-50  hover:bg-gray-100  transition-colors">
                <Upload className="text-orange-500 mb-3" size={40} strokeWidth={1.25}/>
                <p className="text-sm text-gray-600  mb-3 text-center">อัปโหลด PDF ฉบับที่มีการเปลี่ยนแปลงแล้วมาที่นี่<br/><span className="text-xs text-gray-400 ">ระบบจะจัดเก็บแยก Version จากฉบับ Effective เดิมโดยอัตโนมัติ</span></p>
                <input 
                  type="file" 
                  accept="application/pdf"
                  onChange={handleFileChange}
                  className="text-sm text-gray-500  file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-orange-100 file:text-orange-700    hover:file:bg-orange-200  cursor-pointer    "
                />
                {errors.file && <p className="text-red-500  text-sm mt-3 font-medium bg-red-50  px-3 py-1 rounded-full">{errors.file}</p>}
              </div>
            </div>

            {/* Ack */}
            <div className="border-t border-gray-200  pt-6">
              <label className="block text-sm font-medium text-gray-700  mb-3">การรับทราบเอกสารฉบับแก้ไข (Acknowledgement) <span className="text-red-500 ">*</span></label>
              {selectedDoc && selectedDoc.title && selectedDoc.title.startsWith('FM') ? (
                <div className="flex items-start gap-3 text-cyan-800 bg-cyan-50 p-4 rounded-xl border border-cyan-100 mb-4">
                  <ShieldAlert className="w-5 h-5 shrink-0 text-cyan-600 mt-0.5" />
                  <div className="text-sm">
                    <span className="font-semibold block mb-1">เอกสารประเภท Form ระบบจะตั้งค่าเป็นแบบไม่ต้องรับทราบโดยอัตโนมัติ</span>
                  </div>
                </div>
              ) : (
                <div className="flex gap-6 mb-4">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input 
                      type="radio" 
                      name="ack"
                      value="NOT_REQUIRED"
                      checked={formData.ackRequirement === 'NOT_REQUIRED'}
                      onChange={(e) => setFormData({...formData, ackRequirement: e.target.value, ackUserId: ''})}
                      className="w-4 h-4 text-orange-600  border-gray-300  focus:ring-orange-500 bg-white "
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
                      className="w-4 h-4 text-orange-600  border-gray-300  focus:ring-orange-500 bg-white "
                    />
                    <span className="text-gray-700 ">ต้องรับทราบ (Required)</span>
                  </label>
                </div>
              )}

              {formData.ackRequirement === 'REQUIRED' && !(selectedDoc && selectedDoc.title && selectedDoc.title.startsWith('FM')) && (
                <div className={`p-4 rounded-xl border ${errors.ackUserId ? 'border-red-300 bg-red-50 ' : 'border-orange-100  bg-orange-50/30 '}`}>
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

            {/* Distribution */}
            <div className="mt-6">
              <DistributionSetup 
                ownerDept={currentUser.department}
                distributions={formData.distributions}
                oldDistributions={selectedDoc?.distributions || []}
                onChange={(distributions) => setFormData({ ...formData, distributions })}
                documentType={selectedDoc?.title ? selectedDoc.title.split('-')[0] : 'WI'}
              />
            </div>

          </div>
        </div>

        {/* Section 5: Effective Control */}
        <div className="premium-card overflow-visible border-none">
          <div className="px-6 py-4 border-b border-slate-200/50  bg-slate-50/50  flex items-center gap-2">
            <Calendar className="text-gray-500" size={24} strokeWidth={1.25}/>
            <h3 className="font-semibold text-gray-800 ">Section 5: Effective Control</h3>
          </div>
          <div className="p-6">
            <label className="block text-sm font-medium text-gray-700  mb-1">วันที่ต้องการให้มีผลบังคับใช้ฉบับใหม่ (Requested Effective Date) <span className="text-red-500 ">*</span></label>
            <input 
              type="date"
              value={formData.effectiveDate}
              min={new Date().toISOString().split('T')[0]} 
              onChange={(e) => setFormData({...formData, effectiveDate: e.target.value})}
              className={`input-ios w-full md:w-1/3 px-3 py-2 ${errors.effectiveDate ? 'ring-2 ring-red-400 bg-red-50/50 ' : ''}`}
            />
            {errors.effectiveDate && <p className="text-red-500  text-xs mt-1">{errors.effectiveDate}</p>}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="bg-white border-t border-zinc-100 px-6 py-4 flex justify-end gap-3 mt-8">
          <Button 
            variant="ghost"
            type="button" 
            onClick={() => navigate('/dashboard')}
          >
            <X size={20} strokeWidth={1.25} className="mr-1"/> ยกเลิก (Cancel)
          </Button>
          <Button 
            variant="secondary"
            type="button" 
            onClick={handleDraft}
          >
            บันทึกแบบร่าง (Draft)
          </Button>
          <Button 
            variant="primary"
            type="submit" 
          >
            ส่งคำขอ Revision (Submit)
          </Button>
        </div>
      </form>

      <ActionConfirmModal
        isOpen={showConfirm}
        onClose={() => setShowConfirm(false)}
        onConfirm={executeSubmit}
        title="Confirm DAR Revision Submission"
        actionType="submit"
        summaryData={[
          { label: 'Action By', value: currentUser.name },
          { label: 'Department', value: currentUser.department },
          { label: 'Document', value: selectedDoc ? `[${selectedDoc.title}] ${selectedDoc.name}` : '' },
          { label: 'Revision To', value: `Rev. ${calculateNextRev(selectedDoc?.rev)}` },
          { label: 'Change Summary', value: formData.changeSummary },
          { label: 'Next Action / Routing', value: 'Routes to: Reviewer (Level 2)' }
        ]}
      />
    </div>
  );
};

export default DarRevisionForm;
