import React, { useState } from 'react';
import useStore from '../../store/useStore';
import { FileText, Search, Plus, Filter, Download, Eye, X, FilterX, Archive, ShieldAlert, Globe, Edit, Trash2, Clock, CheckCircle } from 'lucide-react';
import { motion } from 'framer-motion';
import ExternalDocFormModal from './ExternalDocFormModal';
import ExternalDocPreviewModal from './ExternalDocPreviewModal';
import ExternalDocCcTrackerModal from './ExternalDocCcTrackerModal';
import ExternalDocHistoryModal from './ExternalDocHistoryModal';
import toast from 'react-hot-toast';

const ExternalDocsList = () => {
  const { externalDocuments, withdrawExternalDoc, currentUser, logExternalDownload } = useStore();
  const [searchTerm, setSearchTerm] = useState('');
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [docToEdit, setDocToEdit] = useState(null);

  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [docToPreview, setDocToPreview] = useState(null);

  const [isCcModalOpen, setIsCcModalOpen] = useState(false);
  const [docToTrack, setDocToTrack] = useState(null);

  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [docToHistory, setDocToHistory] = useState(null);

  const handleRegisterNew = () => {
    setDocToEdit(null);
    setIsModalOpen(true);
  };

  const handleEdit = (doc) => {
    setDocToEdit(doc);
    setIsModalOpen(true);
  };

  const handlePreview = (doc) => {
    setDocToPreview(doc);
    setIsPreviewOpen(true);
  };

  const handleManageCc = (doc) => {
    setDocToTrack(doc);
    setIsCcModalOpen(true);
  };

  const handleDownload = (doc, isViewOnly) => {
    if (isViewOnly) {
      toast.error('คุณไม่มีสิทธิ์ดาวน์โหลดเอกสารนี้ (View-only)');
      return;
    }
    logExternalDownload(doc.id);
    toast.success('บันทึก Audit Log การดาวน์โหลดแล้ว');
  };

  const handleWithdraw = (doc) => {
    const reason = window.prompt(`คุณต้องการลบ/ถอนเอกสารภายนอก: ${doc.title} ใช่หรือไม่? โปรดระบุเหตุผล:`);
    if (reason !== null && reason.trim() !== '') {
      withdrawExternalDoc(doc.id, reason);
      toast.success('ถอนเอกสารภายนอกเรียบร้อยแล้ว');
    } else if (reason !== null) {
      toast.error('กรุณาระบุเหตุผลในการถอน');
    }
  };

  const { reviseExternalDoc, obsoleteExternalDoc } = useStore();

  const handleRevise = (doc) => {
    const reason = window.prompt(`คุณต้องการอัปเดต Revision เอกสารภายนอก: ${doc.title} ใช่หรือไม่? โปรดระบุเหตุผลในการอัปเดต:`);
    if (reason !== null && reason.trim() !== '') {
      reviseExternalDoc(doc.id, { reason });
      toast.success('อัปเดตเอกสารภายนอกเรียบร้อยแล้ว');
    } else if (reason !== null) {
      toast.error('กรุณาระบุเหตุผลในการอัปเดต');
    }
  };

  const handleObsolete = (doc) => {
    const reason = window.prompt(`คุณต้องการยกเลิกการใช้งาน (Obsolete) เอกสารภายนอก: ${doc.title} ใช่หรือไม่? โปรดระบุเหตุผล:`);
    if (reason !== null && reason.trim() !== '') {
      obsoleteExternalDoc(doc.id, reason);
      toast.success('ยกเลิกเอกสารภายนอกเรียบร้อยแล้ว');
    } else if (reason !== null) {
      toast.error('กรุณาระบุเหตุผลในการยกเลิก');
    }
  };

  const filteredDocs = externalDocuments.filter(doc => {
    // 1. Confidentiality Filter (Data Privacy)
    const isOwner = doc.ownerId === currentUser.id;
    const isReviewer = doc.reviewerId === currentUser.id;
    const isApprover = doc.approverId === currentUser.id;
    const isAck = doc.acknowledgees?.includes(currentUser.id);
    const isInvolved = isOwner || isReviewer || isApprover || isAck;
    
    let hasAccess = false;
    const isAdmin = currentUser.role === 'DCC_ADMIN' || currentUser.isDcc || currentUser.id === 'U001';
    
    if (isAdmin) {
      hasAccess = true;
    } else if (doc.accessScope === 'General') {
      hasAccess = true;
    } else if (doc.accessScope === 'Department') {
      const uDept = currentUser.department || currentUser.dept;
      hasAccess = isInvolved || (doc.accessDepartments && doc.accessDepartments.includes(uDept));
    } else if (doc.accessScope === 'Restricted') {
      hasAccess = isInvolved || (doc.accessUsers && doc.accessUsers.includes(currentUser.id));
    }

    if (!hasAccess) return false;

    // 2. Search Filter
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    return (
      doc.id?.toLowerCase().includes(term) ||
      doc.title?.toLowerCase().includes(term) ||
      doc.source?.toLowerCase().includes(term)
    );
  });

  const getStatusDisplay = (status) => {
    switch(status) {
      case 'PENDING_EXT_REVIEW': return { color: 'text-orange-700  bg-orange-100', label: 'รอ Review', icon: <Clock className="w-3 h-3"/> };
      case 'PENDING_EXT_APPROVAL': return { color: 'text-blue-700  bg-blue-100', label: 'รอ Approve', icon: <Clock className="w-3 h-3"/> };
      case 'ACTIVE': return { color: 'text-green-700  bg-green-100', label: 'Active', icon: <CheckCircle className="w-3 h-3"/> };
      case 'WITHDRAWN': return { color: 'text-red-700  bg-red-100', label: 'Withdrawn', icon: <X className="w-3 h-3"/> };
      case 'OBSOLETE_ARCHIVED': return { color: 'text-red-700  bg-red-100', label: 'Obsolete', icon: <Archive className="w-3 h-3"/> };
      default: return { color: 'text-gray-700  bg-gray-100', label: status, icon: null };
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.32, 0.72, 0, 1] }}
      className="space-y-6"
    >
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-800  flex items-center gap-2">
            <Globe className="w-6 h-6 text-blue-600 " />
            เอกสารภายนอก (External Documents)
          </h2>
          <p className="text-gray-500  mt-1">ระบบลงทะเบียนและอัปเดตเอกสารจากหน่วยงานภายนอก (ตามมาตรฐาน BRS V1.1)</p>
        </div>
        <button 
          onClick={handleRegisterNew}
          className="flex items-center gap-2 px-4 py-2 btn-ios-primary transition-all duration-300 ease-fluid active:scale-95 shadow-[inset_-4px_-4px_8px_rgba(0,0,0,0.15),inset_4px_4px_8px_rgba(255,255,255,0.5),4px_4px_8px_rgba(0,0,0,0.1)]"
        >
          <Plus className="w-5 h-5" />
          ลงทะเบียนเอกสารใหม่
        </button>
      </div>

      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 premium-card p-8 border-none">
        <div className="relative w-full sm:w-96">
          <input
            type="text"
            placeholder="ค้นหา ID, ชื่อเอกสาร, แหล่งที่มา..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="input-ios w-full pl-10 pr-10 py-2"
          />
          <Search className="w-5 h-5 text-gray-400  absolute left-3 top-2.5" />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              className="absolute right-3 top-2.5 text-gray-400  hover:text-gray-600  "
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>
      </div>

      <div className="premium-card overflow-hidden border-none">
        <div className="overflow-x-auto min-h-[200px]">
          <table className="w-full text-left text-sm text-gray-600  border-collapse">
            <thead className="bg-slate-50/80  text-gray-500  uppercase border-b border-slate-200/50 ">
              <tr>
                <th className="px-4 py-3 font-medium text-center w-16">Action</th>
                <th className="px-4 py-3 font-medium whitespace-nowrap">Ext Doc ID</th>
                <th className="px-4 py-3 font-medium w-1/3">Title</th>
                <th className="px-4 py-3 font-medium">Source / Issuer</th>
                <th className="px-4 py-3 font-medium whitespace-nowrap">Effective Date</th>
                <th className="px-4 py-3 font-medium whitespace-nowrap">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100/50 ">
              {filteredDocs.map((doc) => {
                const st = getStatusDisplay(doc.status);
                const isRestricted = doc.accessScope === 'Restricted';
                const isOwner = doc.ownerId === currentUser.id;
                const isReviewer = doc.reviewerId === currentUser.id;
                const isApprover = doc.approverId === currentUser.id;
                const isAdmin = currentUser.role === 'DCC_ADMIN' || currentUser.isDcc || currentUser.id === 'U001';
                
                // Determine if user is View Only (Cannot download)
                // Owner, Reviewer, Approver, and Admin can download.
                const canEditAndDownload = isOwner || isReviewer || isApprover || isAdmin;
                const isViewOnly = !canEditAndDownload;

                return (
                <tr 
                  key={doc.id} 
                  className="hover:bg-slate-100/30  transition-colors cursor-pointer"
                  onClick={() => {
                    setDocToHistory(doc);
                    setIsHistoryOpen(true);
                  }}
                >
                  <td className="px-4 py-3 text-center" onClick={(e) => e.stopPropagation()}>
                    <div className="flex items-center justify-center gap-1">
                      <button 
                        onClick={() => handlePreview(doc)}
                        className="p-1.5 text-indigo-600  hover:bg-indigo-50/50  rounded-lg transition-all duration-300 ease-fluid active:scale-95"
                        title="Preview"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      
                      {doc.status === 'ACTIVE' && canEditAndDownload && (
                        <button 
                          onClick={() => handleManageCc(doc)}
                          className="p-1.5 text-purple-600  hover:bg-purple-50/50  rounded-lg transition-all duration-300 ease-fluid active:scale-95"
                          title="จัดการสำเนาควบคุม (Manage CC)"
                        >
                          <FileText className="w-4 h-4" />
                        </button>
                      )}

                      <button 
                        onClick={() => handleDownload(doc, isViewOnly)}
                        className={`p-1.5 rounded-lg transition-all duration-300 ease-fluid active:scale-95 ${isViewOnly ? 'text-gray-300  cursor-not-allowed' : 'text-blue-600  hover:bg-blue-50/50 '}`}
                        title={isViewOnly ? "ดาวน์โหลด (View-only ไม่มีสิทธิ์)" : "ดาวน์โหลด (Download)"}
                      >
                        <Download className="w-4 h-4" />
                      </button>

                      {doc.status !== 'WITHDRAWN' && doc.status !== 'OBSOLETE_ARCHIVED' && isOwner && (
                        <>
                          <button 
                            onClick={() => handleEdit(doc)}
                            className="p-1.5 text-gray-500  hover:text-blue-600   hover:bg-blue-50/50  rounded-lg transition-all duration-300 ease-fluid active:scale-95"
                            title="แก้ไขข้อมูล (Edit Info)"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button 
                            onClick={() => handleRevise(doc)}
                            className="p-1.5 text-gray-500  hover:text-indigo-600   hover:bg-indigo-50/50  rounded-lg transition-all duration-300 ease-fluid active:scale-95"
                            title="อัปเดต Revision (Revise)"
                          >
                            <FileText className="w-4 h-4" />
                          </button>
                          <button 
                            onClick={() => handleObsolete(doc)}
                            className="p-1.5 text-gray-500  hover:text-amber-600   hover:bg-amber-50/50  rounded-lg transition-all duration-300 ease-fluid active:scale-95"
                            title="ยกเลิกใช้งาน (Obsolete)"
                          >
                            <Archive className="w-4 h-4" />
                          </button>
                          <button 
                            onClick={() => handleWithdraw(doc)}
                            className="p-1.5 text-gray-500  hover:text-red-600   hover:bg-red-50/50  rounded-lg transition-all duration-300 ease-fluid active:scale-95"
                            title="ลบ/ถอน (Withdraw)"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap font-medium text-blue-600 ">{doc.id}</td>
                  <td className="px-4 py-3 font-medium text-gray-800 ">
                    <div className="flex flex-col">
                      <div className="flex items-center gap-2">
                        {isRestricted && <ShieldAlert className="w-4 h-4 text-red-500  shrink-0" title="Confidential Document" />}
                        <span>{doc.title}</span>
                      </div>
                      {doc.sourceVersion && (
                        <span className="text-xs text-gray-500  font-normal mt-0.5 ml-6">
                          {doc.sourceVersion}
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3">{doc.source}</td>
                  <td className="px-4 py-3 whitespace-nowrap">{doc.effectiveDate}</td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <span className={`flex items-center gap-1.5 px-2.5 py-1 w-fit rounded-full text-xs font-semibold ${st.color}`}>
                      {st.icon}
                      {st.label}
                    </span>
                  </td>
                </tr>
              )})}
              {filteredDocs.length === 0 && (
                <tr>
                  <td colSpan="6" className="px-6 py-12 text-center text-gray-500 ">
                    <div className="flex flex-col items-center justify-center">
                      <FileText className="w-10 h-10 text-gray-300  mb-2" />
                      <p>ไม่มีข้อมูลเอกสารภายนอก</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <ExternalDocFormModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        documentToEdit={docToEdit}
      />

      <ExternalDocPreviewModal
        isOpen={isPreviewOpen}
        onClose={() => setIsPreviewOpen(false)}
        document={docToPreview}
      />

      <ExternalDocCcTrackerModal
        isOpen={isCcModalOpen}
        onClose={() => setIsCcModalOpen(false)}
        document={docToTrack}
      />

      <ExternalDocHistoryModal
        isOpen={isHistoryOpen}
        onClose={() => setIsHistoryOpen(false)}
        document={docToHistory}
      />
    </motion.div>
  );
};

export default ExternalDocsList;
