import React, { useState, useEffect } from 'react';
import useStore from '../../store/useStore';
import { X, Upload, Save, AlertCircle, ShieldAlert } from 'lucide-react';
import toast from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';
import UserSelector from '../../components/UserSelector';
import RelatedStandardsSelector from '../../components/workflow/RelatedStandardsSelector';

const ExternalDocFormModal = ({ isOpen, onClose, documentToEdit = null }) => {
  const { masterUsers, registerExternalDoc, updateExternalDoc } = useStore();
  
  const [formData, setFormData] = useState({
    title: '',
    sourceVersion: '',
    source: '',
    effectiveDate: '',
    reviewerId: '',
    approverId: '',
    acknowledgees: [],
    accessScope: 'General',
    accessDepartments: [],
    accessUsers: [],
    relatedStandards: [],
    otherStandardDetail: ''
  });

  const [fileName, setFileName] = useState('');
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [payloadToSubmit, setPayloadToSubmit] = useState(null);

  useEffect(() => {
    if (documentToEdit) {
      setFormData({
        title: documentToEdit.title || '',
        sourceVersion: documentToEdit.sourceVersion || '',
        source: documentToEdit.source || '',
        effectiveDate: documentToEdit.effectiveDate || '',
        reviewerId: documentToEdit.reviewerId || '',
        approverId: documentToEdit.approverId || '',
        acknowledgees: documentToEdit.acknowledgees || [],
        accessScope: documentToEdit.accessScope || 'General',
        accessDepartments: documentToEdit.accessDepartments || [],
        accessUsers: documentToEdit.accessUsers || [],
        relatedStandards: documentToEdit.relatedStandards || [],
        otherStandardDetail: documentToEdit.otherStandardDetail || ''
      });
      setFileName(documentToEdit.fileName || '');
    } else {
      setFormData({
        title: '',
        sourceVersion: '',
        source: '',
        effectiveDate: '',
        reviewerId: '',
        approverId: '',
        acknowledgees: [],
        accessScope: 'General',
        accessDepartments: [],
        accessUsers: [],
        relatedStandards: [],
        otherStandardDetail: ''
      });
      setFileName('');
    }
  }, [documentToEdit, isOpen]);
  // Removed early return for AnimatePresence

  // Rule: DCC Admin cannot be a Content Reviewer
  const eligibleReviewers = masterUsers.filter(u => !u.isDcc && u.role !== 'DCC_ADMIN' && u.id !== 'U001');

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setFileName(e.target.files[0].name);
    }
  };

  const handleDeptToggle = (dept) => {
    setFormData(prev => {
      const depts = prev.accessDepartments;
      if (depts.includes(dept)) return { ...prev, accessDepartments: depts.filter(d => d !== dept) };
      return { ...prev, accessDepartments: [...depts, dept] };
    });
  };

  const handleAddUser = (userId) => {
    if (!userId) return;
    setFormData(prev => {
      if (prev.accessUsers.includes(userId)) return prev;
      return { ...prev, accessUsers: [...prev.accessUsers, userId] };
    });
  };

  const handleRemoveUser = (userId) => {
    setFormData(prev => ({
      ...prev,
      accessUsers: prev.accessUsers.filter(id => id !== userId)
    }));
  };

  const DEPARTMENTS = ['QA', 'PD', 'PC', 'ST', 'HSE', 'WH', 'MKT', 'EN', 'HR'];

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.title || !formData.source || !formData.effectiveDate || !formData.reviewerId || !formData.approverId) {
      toast.error('กรุณากรอกข้อมูลที่จำเป็นให้ครบถ้วน (รวมถึง Reviewer และ Approver)');
      return;
    }
    
    if (formData.relatedStandards?.includes('อื่น ๆ (Others)') && !formData.otherStandardDetail?.trim()) {
      toast.error('กรุณาระบุมาตรฐานอื่นๆ');
      return;
    }
    
    if (documentToEdit && !formData.reason) {
      toast.error('กรุณาระบุเหตุผลในการอัปเดตเอกสาร');
      return;
    }

    const payload = {
      ...formData,
      fileName,
      updatedAt: new Date().toISOString()
    };

    setPayloadToSubmit(payload);
    setShowConfirmModal(true);
  };

  const handleConfirmSubmit = () => {
    if (documentToEdit) {
      updateExternalDoc(documentToEdit.id, payloadToSubmit);
      toast.success('อัปเดตเอกสารภายนอกเรียบร้อยแล้ว');
    } else {
      registerExternalDoc(payloadToSubmit);
      toast.success('ลงทะเบียนเอกสารภายนอกเรียบร้อยแล้ว');
    }
    setShowConfirmModal(false);
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6">
          {/* Backdrop */}
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-slate-900/40"
            onClick={onClose}
          />
          
          <motion.div 
            initial={{ scale: 0.95, opacity: 0, y: 10 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: 10 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className="relative bg-white border border-gray-200 w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh] p-0 rounded-3xl"
          >
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200/50 flex justify-between items-center bg-slate-50/50">
          <h2 className="text-xl font-bold text-gray-800 ">
            {documentToEdit ? 'อัปเดตเอกสารภายนอก (Update External Document)' : 'ลงทะเบียนเอกสารภายนอก (Register External Document)'}
          </h2>
          <button 
            onClick={onClose}
            className="text-gray-400  hover:text-gray-600  p-2 rounded-full hover:bg-slate-200/50 transition-all duration-300 ease-out active:scale-95"
          >
            <X size={24} strokeWidth={1.25}/>
          </button>
        </div>

        {/* Form Body */}
        <div className="p-6 overflow-y-auto flex-1">
          <div className="bg-blue-50 text-blue-700  p-4 rounded-xl flex gap-3 mb-6 items-start">
            <AlertCircle className="shrink-0 mt-0.5" size={24} strokeWidth={1.25}/>
            <div className="text-sm">
              <p className="font-semibold mb-1">กฎการลงทะเบียน (External Rules)</p>
              <ul className="list-disc pl-4 space-y-1">
                <li>โมดูลนี้แยกจากระบบ Internal DAR โดยสิ้นเชิง (No Internal DAR Number)</li>
                <li>DCC Admin ไม่สามารถถูกระบุเป็น Reviewer ได้</li>
              </ul>
            </div>
          </div>

          <form id="external-doc-form" onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700  mb-1">ชื่อเอกสาร (Document Title) <span className="text-red-500 ">*</span></label>
                <input 
                  type="text" 
                  value={formData.title}
                  onChange={e => handleChange('title', e.target.value)}
                  className="input-ios w-full px-4 py-2"
                  placeholder="เช่น ISO 9001:2015 Standard"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700  mb-1">เวอร์ชันอ้างอิง (Source Version / Edition) <span className="text-red-500 ">*</span></label>
                <input 
                  type="text" 
                  value={formData.sourceVersion}
                  onChange={e => handleChange('sourceVersion', e.target.value)}
                  className="input-ios w-full px-4 py-2"
                  placeholder="เช่น Edition 5, Ver 2.1"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700  mb-1">แหล่งที่มา (Official Source / Issuer) <span className="text-red-500 ">*</span></label>
                <input 
                  type="text" 
                  value={formData.source}
                  onChange={e => handleChange('source', e.target.value)}
                  className="input-ios w-full px-4 py-2"
                  placeholder="เช่น ISO, ประกาศกระทรวง, กรมโรงงาน"
                />
              </div>

              <div className="pt-2">
                <RelatedStandardsSelector
                  value={{
                    relatedStandards: formData.relatedStandards,
                    otherStandardDetail: formData.otherStandardDetail
                  }}
                  onChange={(newVals) => setFormData({ ...formData, ...newVals })}
                  error={formData.relatedStandards?.includes('อื่น ๆ (Others)') && !formData.otherStandardDetail?.trim() ? 'กรุณาระบุมาตรฐานอื่นๆ' : ''}
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700  mb-1">วันที่บังคับใช้ (Planned Effective Date) <span className="text-red-500 ">*</span></label>
                <input 
                  type="date" 
                  value={formData.effectiveDate}
                  onChange={e => handleChange('effectiveDate', e.target.value)}
                  className="input-ios w-full px-4 py-2"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700  mb-1">ไฟล์เอกสารทางการ (Official PDF)</label>
                <div className="border-2 border-dashed border-gray-300 rounded-xl p-6 flex flex-col items-center justify-center hover:bg-gray-50 transition-colors cursor-pointer relative">
                  <input 
                    type="file" 
                    accept=".pdf"
                    onChange={handleFileChange}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer    " 
                  />
                  <Upload className="text-gray-400 mb-2" size={32} strokeWidth={1.25}/>
                  <span className="text-sm text-gray-600  font-medium">คลิกหรือลากไฟล์ PDF มาวางที่นี่</span>
                  {fileName && <span className="text-sm text-blue-600  mt-2 font-medium">ไฟล์ที่เลือก: {fileName}</span>}
                </div>
              </div>

              <hr className="border-gray-100 my-2" />
              <h3 className="font-bold text-gray-800 ">การควบคุมความลับ (Confidentiality)</h3>

              <div>
                <label className="block text-sm font-semibold text-gray-700  mb-1">ระดับการเข้าถึง (Access Scope) <span className="text-red-500 ">*</span></label>
                <select 
                  value={formData.accessScope}
                  onChange={e => handleChange('accessScope', e.target.value)}
                  className="input-ios w-full px-4 py-2 bg-white"
                >
                  <option value="General">General (ทั่วไป - ทุกคนสามารถเข้าถึงได้)</option>
                  <option value="Department">Department (เฉพาะแผนกที่ระบุ)</option>
                  <option value="Restricted">Restricted / Confidential (เอกสารลับ - เฉพาะบุคคล)</option>
                </select>
              </div>

              {formData.accessScope === 'Department' && (
                <div className="bg-gray-50 p-4 rounded-2xl border border-gray-200">
                  <label className="block text-sm font-semibold text-gray-700  mb-3">เลือกแผนกที่อนุญาตให้เข้าถึง</label>
                  <div className="flex flex-wrap gap-3">
                    {DEPARTMENTS.map(dept => (
                      <label key={dept} className="flex items-center gap-2 cursor-pointer">
                        <input 
                          type="checkbox"
                          checked={formData.accessDepartments.includes(dept)}
                          onChange={() => handleDeptToggle(dept)}
                          className="w-4 h-4 text-blue-600  rounded border-gray-300 focus:ring-blue-500"
                        />
                        <span className="text-sm font-medium text-gray-700 ">{dept}</span>
                      </label>
                    ))}
                  </div>
                </div>
              )}

              {formData.accessScope === 'Restricted' && (
                <div className="bg-red-50 p-4 rounded-2xl border border-red-100">
                  <label className="block text-sm font-semibold text-red-700  mb-3">เลือกบุคคลที่อนุญาตให้เข้าถึง (Specific Users)</label>
                  <div className="flex gap-2 items-center mb-3">
                    <div className="flex-1">
                      <UserSelector 
                        value=""
                        onChange={handleAddUser}
                        users={masterUsers.filter(u => !formData.accessUsers.includes(u.id))}
                      />
                    </div>
                  </div>
                  {formData.accessUsers.length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                      {formData.accessUsers.map(uid => {
                        const u = masterUsers.find(mu => mu.id === uid);
                        return (
                          <div key={uid} className="bg-white border border-red-200 text-red-700  px-3 py-1 rounded-full text-sm flex items-center gap-2 shadow-sm">
                            <span className="font-medium">{u?.name || uid}</span>
                            <button type="button" onClick={() => handleRemoveUser(uid)} className="hover:text-red-900"><X size={24} strokeWidth={1.25}/></button>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <p className="text-sm text-red-500  italic">ยังไม่ได้ระบุบุคคล (หากไม่ระบุ จะมีเพียงคุณและผู้อนุมัติเท่านั้นที่เห็นได้)</p>
                  )}
                </div>
              )}

              <hr className="border-gray-100 my-2" />
              <h3 className="font-bold text-gray-800 ">ผู้รับผิดชอบตามข้อกำหนดภายนอก (External Rules)</h3>
              
              {documentToEdit && (
                <div>
                  <label className="block text-sm font-semibold text-gray-700  mb-1">เหตุผลในการอัปเดต (Reason for Update) <span className="text-red-500">*</span></label>
                  <textarea
                    value={formData.reason || ''}
                    onChange={(e) => handleChange('reason', e.target.value)}
                    className="input-ios w-full h-24 resize-none"
                    placeholder="ระบุเหตุผลที่ต้องอัปเดตเอกสารฉบับนี้..."
                  />
                </div>
              )}

              <div>
                <label className="block text-sm font-semibold text-gray-700  mb-1">External Reviewer (ห้ามเป็น DCC Admin) <span className="text-red-500">*</span></label>
                <UserSelector 
                  value={formData.reviewerId}
                  onChange={val => handleChange('reviewerId', val)}
                  users={eligibleReviewers}
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700  mb-1">External Approver <span className="text-red-500">*</span></label>
                <UserSelector 
                  value={formData.approverId}
                  onChange={val => handleChange('approverId', val)}
                  users={masterUsers}
                />
              </div>
            </div>
          </form>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-200/50 bg-slate-50/50 flex justify-end gap-3">
          <button 
            type="button"
            onClick={onClose}
            className="px-5 py-2 btn-ios-secondary text-gray-500"
          >
            <X size={20} strokeWidth={1.25}/> ยกเลิก
          </button>
          <button 
            type="submit"
            form="external-doc-form"
            className="btn-ios-primary"
          >
            <Save size={24} strokeWidth={1.25}/>
            {documentToEdit ? 'บันทึกการแก้ไข' : 'ลงทะเบียน'}
          </button>
        </div>
      </motion.div>
      
      {/* Smart Confirmation Dialog */}
      <AnimatePresence>
        {showConfirmModal && payloadToSubmit && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="absolute inset-0 bg-slate-900/40"
              onClick={() => setShowConfirmModal(false)}
            />
            <motion.div 
              initial={{ scale: 0.95, opacity: 0, y: 10 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.95, opacity: 0, y: 10 }}
              className="relative premium-card w-full max-w-lg p-6 bg-white"
            >
              <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
                <ShieldAlert className="text-indigo-500" size={28} strokeWidth={1.25}/> ยืนยันข้อมูลและสิทธิ์การเข้าถึง
              </h2>
              
              <div className="space-y-4 mb-6">
                <div className="bg-gray-50 p-4 rounded-xl border border-gray-200">
                  <p className="text-sm text-gray-500 mb-1">ชื่อเอกสาร</p>
                  <p className="font-semibold text-gray-800">{payloadToSubmit.title}</p>
                </div>
                
                <div className={`p-4 rounded-xl border ${payloadToSubmit.accessScope === 'Restricted' ? 'bg-red-50 border-red-200' : 'bg-blue-50 border-blue-200'}`}>
                  <p className="text-sm font-semibold mb-2 flex items-center gap-2">
                    ระดับความลับ: 
                    <span className={`px-2 py-0.5 rounded-full text-xs ${payloadToSubmit.accessScope === 'Restricted' ? 'bg-red-500 text-white' : 'bg-blue-500 text-white'}`}>
                      {payloadToSubmit.accessScope}
                    </span>
                  </p>
                  {payloadToSubmit.accessScope === 'Restricted' && (
                    <div className="mt-2">
                      <p className="text-sm text-red-700 font-medium mb-1">เอกสารลับเฉพาะบุคคล! อนุญาตแค่:</p>
                      <div className="flex flex-wrap gap-1">
                        {payloadToSubmit.accessUsers.map(uid => {
                          const u = masterUsers.find(mu => mu.id === uid);
                          return <span key={uid} className="text-xs bg-red-100 text-red-800 px-2 py-1 rounded-full">{u?.name || uid}</span>;
                        })}
                      </div>
                    </div>
                  )}
                  {payloadToSubmit.accessScope === 'Department' && (
                    <div className="mt-2 text-sm text-blue-800">
                      ให้สิทธิ์เฉพาะแผนก: {payloadToSubmit.accessDepartments.join(', ')}
                    </div>
                  )}
                  {payloadToSubmit.accessScope === 'General' && (
                    <div className="mt-2 text-sm text-gray-600">
                      ทุกคนในระบบสามารถเห็นเอกสารฉบับนี้ได้
                    </div>
                  )}
                </div>
              </div>

              <div className="flex justify-end gap-3">
                <button 
                  onClick={() => setShowConfirmModal(false)}
                  className="btn-ios-secondary"
                >
                  กลับไปแก้ไข
                </button>
                <button 
                  onClick={handleConfirmSubmit}
                  className="btn-ios-primary"
                >
                  ยืนยันการลงทะเบียน
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  )}
</AnimatePresence>
);
};

export default ExternalDocFormModal;
