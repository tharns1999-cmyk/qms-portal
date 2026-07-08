import React, { useState } from 'react';
import useStore from '../../store/useStore';
import { FileText, Search, Plus, Download, Eye, X, Archive, ShieldAlert, Globe, Clock, CheckCircle } from 'lucide-react';
import { motion } from 'framer-motion';
import ExternalDocFormModal from './ExternalDocFormModal';
import ExternalDocPreviewModal from './ExternalDocPreviewModal';
import ExternalDocHistoryModal from './ExternalDocHistoryModal';
import ExternalDocObsoleteModal from './ExternalDocObsoleteModal';
import toast from 'react-hot-toast';

import { PDFDocument, rgb, degrees } from 'pdf-lib';
import fontkit from '@pdf-lib/fontkit';

const ExternalDocsList = () => {
  const { externalDocuments, currentUser, logExternalDownload } = useStore();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterBy, setFilterBy] = useState('EFFECTIVE'); // EFFECTIVE, OBSOLETE, ALL

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [docToEdit, setDocToEdit] = useState(null);

  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [docToPreview, setDocToPreview] = useState(null);

  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [docToHistory, setDocToHistory] = useState(null);
  const [isObsoleteModalOpen, setIsObsoleteModalOpen] = useState(false);
  const [docToObsolete, setDocToObsolete] = useState(null);

  const handleRegisterNew = () => {
    setDocToEdit(null);
    setIsModalOpen(true);
  };

  const handleRevise = (doc) => {
    setDocToEdit(doc);
    setIsModalOpen(true);
  };

  const handlePreview = (doc) => {
    setDocToPreview(doc);
    setIsPreviewOpen(true);
  };

  const handleDownload = async (doc, isViewOnly) => {
    if (isViewOnly) {
      toast.error('คุณไม่มีสิทธิ์ดาวน์โหลดเอกสารนี้ (View-only)');
      return;
    }

    try {
      const pdfDoc = await PDFDocument.create();
      pdfDoc.registerFontkit(fontkit);

      let customFont;
      try {
        const fontBytes = await fetch('https://fonts.gstatic.com/s/sarabun/v13/DtVjJx26TKEr37c9aAFvmuB_8es.ttf').then(res => res.arrayBuffer());
        customFont = await pdfDoc.embedFont(fontBytes);
      } catch (err) {
        console.warn('Failed to load Thai font', err);
      }

      const page = pdfDoc.addPage([595.28, 841.89]); // A4
      if (customFont) {
        page.drawText('Uncontrolled copy เอกสารหน่วยงานภายนอก', { x: 50, y: height / 2, size: 30, color: rgb(1, 0, 0), rotate: degrees(-30), opacity: 0.3, font: customFont });
      } else {
        page.drawText('Uncontrolled copy', {
          x: 50, y: height / 2, size: 40, color: rgb(1, 0, 0), rotate: degrees(-30), opacity: 0.3, lineHeight: 40,
        });
      }

      page.drawText(`Document: ${doc.title}`, { x: 50, y: height - 50, size: 12, color: rgb(0, 0, 0), ...(customFont && { font: customFont }) });
      page.drawText(`Rev: ${doc.rev || '00'}`, { x: 50, y: height - 70, size: 12, color: rgb(0, 0, 0), ...(customFont && { font: customFont }) });
      page.drawText(`Source: ${doc.source || '-'}`, { x: 50, y: height - 90, size: 12, color: rgb(0, 0, 0), ...(customFont && { font: customFont }) });

      const pdfBytes = await pdfDoc.save();
      const blob = new Blob([pdfBytes], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${doc.title}_EXTERNAL.pdf`;
      link.click();
      window.URL.revokeObjectURL(url);

      logExternalDownload(doc.id);
      toast.success('ดาวน์โหลดเอกสารสำหรับหน่วยงานภายนอกสำเร็จ พร้อมลายน้ำ');
    } catch (error) {
      console.error(error);
      toast.error('เกิดข้อผิดพลาดในการสร้าง PDF');
    }
  };

  // handleRevise is now defined above to open ExternalDocFormModal

  const handleObsolete = (doc) => {
    setDocToObsolete(doc);
    setIsObsoleteModalOpen(true);
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

    // 2. Status Filter
    if (filterBy === 'EFFECTIVE') {
      if (doc.status === 'OBSOLETE_ARCHIVED' || doc.status === 'WITHDRAWN') return false;
    } else if (filterBy === 'OBSOLETE') {
      if (doc.status !== 'OBSOLETE_ARCHIVED' && doc.status !== 'WITHDRAWN') return false;
    }

    // 3. Search Filter
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    return (
      doc.id?.toLowerCase().includes(term) ||
      doc.title?.toLowerCase().includes(term) ||
      doc.source?.toLowerCase().includes(term)
    );
  });

  const getStatusDisplay = (status) => {
    switch (status) {
      case 'PENDING_EXT_REVIEW': return { color: 'text-orange-700  bg-orange-100', label: 'รอ Review', icon: <Clock size={24} strokeWidth={1.25}/> };
      case 'PENDING_EXT_APPROVAL': return { color: 'text-blue-700  bg-blue-100', label: 'รอ Approve', icon: <Clock size={24} strokeWidth={1.25}/> };
      case 'ACTIVE': return { color: 'text-green-700  bg-green-100', label: 'Active', icon: <CheckCircle size={24} strokeWidth={1.25}/> };
      case 'WITHDRAWN': return { color: 'text-red-700  bg-red-100', label: 'Withdrawn', icon: <X size={24} strokeWidth={1.25}/> };
      case 'OBSOLETE_ARCHIVED': return { color: 'text-red-700  bg-red-100', label: 'Obsolete', icon: <Archive size={24} strokeWidth={1.25}/> };
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
            <Globe className="text-blue-600" size={28} strokeWidth={1.25}/>
            เอกสารภายนอก (External Documents)
          </h2>
          <p className="text-gray-500  mt-1">ระบบลงทะเบียนและอัปเดตเอกสารจากหน่วยงานภายนอก (ตามมาตรฐาน BRS V1.1)</p>
        </div>
        <button
          onClick={handleRegisterNew}
          className="flex items-center gap-2 px-4 py-2 btn-ios-primary transition-all duration-300 ease-fluid active:scale-95 shadow-[inset_-4px_-4px_8px_rgba(0,0,0,0.15),inset_4px_4px_8px_rgba(255,255,255,0.5),4px_4px_8px_rgba(0,0,0,0.1)]"
        >
          <Plus size={20} strokeWidth={1.25}/> ลงทะเบียนเอกสารใหม่
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
          <Search className="text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" size={18} strokeWidth={1.25}/>
          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              className="absolute right-3 top-2.5 text-gray-400  hover:text-gray-600  "
            >
              <X size={24} strokeWidth={1.25}/>
            </button>
          )}
        </div>

        <div className="flex bg-slate-100 p-1 rounded-xl w-full sm:w-auto">
          <button
            onClick={() => setFilterBy('EFFECTIVE')}
            className={`flex-1 sm:flex-none px-4 py-2 rounded-lg text-sm font-semibold transition-all ${filterBy === 'EFFECTIVE' ? 'bg-white text-indigo-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
          >
            มีผลบังคับใช้
          </button>
          <button
            onClick={() => setFilterBy('OBSOLETE')}
            className={`flex-1 sm:flex-none px-4 py-2 rounded-lg text-sm font-semibold transition-all ${filterBy === 'OBSOLETE' ? 'bg-white text-indigo-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
          >
            ยกเลิก/ถอน
          </button>
          <button
            onClick={() => setFilterBy('ALL')}
            className={`flex-1 sm:flex-none px-4 py-2 rounded-lg text-sm font-semibold transition-all ${filterBy === 'ALL' ? 'bg-white text-indigo-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
          >
            ทั้งหมด
          </button>
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
                // Exception: If Obsolete, only Admin DCC can download.
                let canEditAndDownload = isOwner || isReviewer || isApprover || isAdmin;
                if ((doc.status === 'OBSOLETE_ARCHIVED' || doc.status === 'WITHDRAWN') && !isAdmin) {
                  canEditAndDownload = false;
                }
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
                          <Eye size={24} strokeWidth={1.25}/>
                        </button>

                        {/* Manage CC button removed as requested */}

                        <button
                          onClick={() => handleDownload(doc, isViewOnly)}
                          className={`p-1.5 rounded-lg transition-all duration-300 ease-fluid active:scale-95 ${isViewOnly ? 'text-gray-300  cursor-not-allowed' : 'text-blue-600  hover:bg-blue-50/50 '}`}
                          title={isViewOnly ? "ดาวน์โหลด (View-only ไม่มีสิทธิ์)" : "ดาวน์โหลด (Download)"}
                        >
                          <Download size={24} strokeWidth={1.25}/>
                        </button>

                        {doc.status !== 'WITHDRAWN' && doc.status !== 'OBSOLETE_ARCHIVED' && isOwner && (
                          <>
                            {!doc.status.startsWith('PENDING') && (
                              <>
                                {/* Edit info button removed, combined with Revise */}
                                <button
                                  onClick={() => handleRevise(doc)}
                                  className="p-1.5 text-gray-500  hover:text-indigo-600   hover:bg-indigo-50/50  rounded-lg transition-all duration-300 ease-fluid active:scale-95"
                                  title="อัปเดต Revision (Revise)"
                                >
                                  <FileText size={24} strokeWidth={1.25}/>
                                </button>
                                <button
                                  onClick={() => handleObsolete(doc)}
                                  className="p-1.5 text-gray-500  hover:text-amber-600   hover:bg-amber-50/50  rounded-lg transition-all duration-300 ease-fluid active:scale-95"
                                  title="ยกเลิกใช้งาน (Obsolete)"
                                >
                                  <Archive size={24} strokeWidth={1.25}/>
                                </button>
                              </>
                            )}
                            {/* Withdraw button removed as requested */}
                          </>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap font-medium text-blue-600 ">{doc.id}</td>
                    <td className="px-4 py-3 font-medium text-gray-800 ">
                      <div className="flex flex-col">
                        <div className="flex items-center gap-2">
                          {isRestricted && <ShieldAlert className="text-red-500 shrink-0" title="Confidential Document" size={24} strokeWidth={1.25}/>}
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
                )
              })}
              {filteredDocs.length === 0 && (
                <tr>
                  <td colSpan="6" className="px-6 py-12 text-center text-gray-500 ">
                    <div className="flex flex-col items-center justify-center">
                      <FileText className="text-gray-300 mb-2" size={40} strokeWidth={1.25}/>
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

      <ExternalDocHistoryModal
        isOpen={isHistoryOpen}
        onClose={() => setIsHistoryOpen(false)}
        document={docToHistory}
      />

      <ExternalDocObsoleteModal
        isOpen={isObsoleteModalOpen}
        onClose={() => setIsObsoleteModalOpen(false)}
        documentToObsolete={docToObsolete}
      />
    </motion.div>
  );
};

export default ExternalDocsList;
