import React, { useState } from 'react';
import useStore from '../../store/useStore';
import { Database, Download, Search, Eye, FileText, X, FilterX } from 'lucide-react';
import { motion } from 'framer-motion';
import EmptyState from '../../components/EmptyState';
import { getRequesterName, getReviewerName, getApproverName, getAckNames } from '../../utils/darHelper';

const MasterList = () => {
  const { documents, currentUser, dars, timeline, masterUsers } = useStore();
  
  // Access Control
  const isAdmin = currentUser.level >= 5 || currentUser.isDcc || currentUser.role === 'DCC_ADMIN' || currentUser.id === 'u5';
  
  const [masterListDept, setMasterListDept] = useState('');
  const [masterListType, setMasterListType] = useState('');
  const [masterListStatus, setMasterListStatus] = useState('EFFECTIVE');
  const [searchTerm, setSearchTerm] = useState('');
  const [previewDoc, setPreviewDoc] = useState(null);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);

  // Filter Logic
  let filteredDocs = documents;
  
  if (!isAdmin) {
    filteredDocs = filteredDocs.filter(d => d.department === currentUser.department);
  }

  if (masterListDept) {
    filteredDocs = filteredDocs.filter(d => d.department === masterListDept);
  }
  
  if (masterListStatus === 'EFFECTIVE') {
    filteredDocs = filteredDocs.filter(d => d.status === 'EFFECTIVE');
  } else if (masterListStatus === 'OBSOLETE') {
    filteredDocs = filteredDocs.filter(d => d.status === 'SUPERSEDED_ARCHIVED' || d.status === 'OBSOLETE_ARCHIVED');
  }
  
  if (masterListType) {
    filteredDocs = filteredDocs.filter(d => d.title.startsWith(masterListType));
  }
  
  if (searchTerm) {
    const term = searchTerm.toLowerCase();
    filteredDocs = filteredDocs.filter(d => 
      d.title.toLowerCase().includes(term) || d.name.toLowerCase().includes(term)
    );
  }

  const availableDepts = [...new Set(documents.map(d => d.department))].filter(Boolean).sort();
  const availableTypes = [...new Set(documents.map(d => d.title.split('-')[0]))].filter(Boolean).sort();

  const handleExportExcel = () => {
    if (filteredDocs.length === 0) {
      alert('ไม่มีข้อมูลสำหรับส่งออก');
      return;
    }

    const headers = ['No.', 'Document No.', 'Document Title', 'Document Type', 'Revision No.', 'Effective Date', 'Requester', 'Reviewer', 'Approver', 'Ack', 'Distribution List', 'Status'];
    
    const rows = filteredDocs.map((doc, index) => {
      const docType = doc.title.split('-')[0] || 'Unknown';
      const distribution = (doc.distributedTo || []).join(' | ');
      
      const dar = dars.find(d => d.id === doc.darId);
      const reqName = dar ? getRequesterName(dar, masterUsers) : '-';
      const revName = dar ? getReviewerName(dar, timeline) : '-';
      const appName = dar ? getApproverName(dar, timeline) : '-';
      const ackName = dar ? getAckNames(dar, timeline) : '-';

      return [
        index + 1,
        doc.title,
        `"${doc.name}"`,
        docType,
        doc.rev,
        doc.effectiveDate,
        `"${reqName}"`, 
        `"${revName}"`, 
        `"${appName}"`,
        `"${ackName}"`,
        `"${distribution}"`,
        doc.status
      ].join(',');
    });

    const csvContent = "data:text/csv;charset=utf-8,\uFEFF" + headers.join(',') + "\n" + rows.join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    const dateStr = new Date().toISOString().split('T')[0];
    link.setAttribute("download", `QMS_MasterList_${masterListDept}_${dateStr}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const getStatusBadge = (status) => {
    if (status === 'EFFECTIVE') return <span className="px-2 py-1 bg-green-100 text-green-700  rounded-full text-xs font-medium">Effective</span>;
    if (status === 'OBSOLETE_ARCHIVED') return <span className="px-2 py-1 bg-gray-100 text-gray-700  rounded-full text-xs font-medium">Obsolete (ยกเลิก)</span>;
    if (status === 'SUPERSEDED_ARCHIVED') return <span className="px-2 py-1 bg-yellow-100 text-yellow-700  rounded-full text-xs font-medium">Superseded (มีฉบับใหม่แทนที่)</span>;
    return <span className="px-2 py-1 bg-gray-100 text-gray-700  rounded-full text-xs font-medium">{status}</span>;
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.32, 0.72, 0, 1] }}
      className="space-y-6"
    >
      {/* Header */}
      <div className="bg-white border border-gray-200 rounded-2xl p-8 flex flex-col md:flex-row justify-between items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-800  flex items-center gap-2">
            <Database className="w-6 h-6 text-indigo-600 " /> ทะเบียนเอกสารควบคุมหลัก (Master List Registry)
          </h2>
          <p className="text-gray-500  mt-1">ระบบคลังข้อมูลส่วนกลางสำหรับตรวจสอบและส่งออกทะเบียนเอกสาร</p>
        </div>
        <div className="bg-indigo-50 px-4 py-2 rounded-lg border border-indigo-100 flex items-center gap-3">
          <span className="text-indigo-700  font-medium text-sm">เอกสารทั้งหมด (ตามเงื่อนไข):</span>
          <span className="text-2xl font-bold text-indigo-900">{filteredDocs.length}</span>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-white border border-gray-200 rounded-2xl p-8">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-2">
            <label className="text-sm font-medium text-gray-600 ">แผนก:</label>
            <select 
              value={masterListDept}
              onChange={(e) => setMasterListDept(e.target.value)}
              disabled={availableDepts.length === 0}
              className="input-ios px-3 py-1.5 text-sm w-40 disabled:opacity-50"
            >
              <option value="">ทั้งหมด (All)</option>
              {availableDepts.map(d => (
                <option key={d} value={d}>{d}</option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-2">
            <label className="text-sm font-medium text-gray-600 ">ประเภท:</label>
            <select 
              value={masterListType}
              onChange={(e) => setMasterListType(e.target.value)}
              disabled={availableTypes.length === 0}
              className="input-ios px-3 py-1.5 text-sm w-40 disabled:opacity-50"
            >
              <option value="">ทั้งหมด (All)</option>
              {availableTypes.map(t => {
                const typeNames = { QP: 'Procedure (QP)', WI: 'Work Instruction (WI)', FM: 'Form (FM)', SD: 'Standard (SD)', MN: 'Manual (MN)' };
                return <option key={t} value={t}>{typeNames[t] || t}</option>;
              })}
            </select>
          </div>

          <div className="flex items-center gap-2">
            <label className="text-sm font-medium text-gray-600 ">สถานะ:</label>
            <div className="flex bg-slate-200/50 rounded-xl p-1 shadow-inner">
              <button 
                onClick={() => setMasterListStatus('EFFECTIVE')}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-300 ease-out active:scale-95 ${masterListStatus === 'EFFECTIVE' ? 'bg-white shadow-[0_2px_8px_rgba(0,0,0,0.1)] text-green-700 ' : 'text-gray-500  hover:text-gray-700 '}`}
              >
                EFFECTIVE
              </button>
              <button 
                onClick={() => setMasterListStatus('OBSOLETE')}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-300 ease-out active:scale-95 ${masterListStatus === 'OBSOLETE' ? 'bg-white shadow-[0_2px_8px_rgba(0,0,0,0.1)] text-gray-700 ' : 'text-gray-500  hover:text-gray-700 '}`}
              >
                OBSOLETE
              </button>
            </div>
          </div>

          <div className="flex items-center gap-2 relative flex-1 min-w-[200px]">
            <div className="relative flex-1">
              <Search className="w-4 h-4 absolute left-3 top-2.5 text-gray-400 " />
              <input 
                type="text"
                placeholder="ค้นหารหัส หรือชื่อเอกสาร..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="input-ios w-full pl-9 pr-3 py-1.5 text-sm"
              />
            </div>
            <button 
              onClick={() => {
                setMasterListDept('');
                setMasterListType('');
                setMasterListStatus('EFFECTIVE');
                setSearchTerm('');
              }}
              title="ล้างตัวกรอง"
              className="p-1.5 text-gray-400  hover:text-red-500  hover:bg-red-50/50 rounded-lg transition-all duration-300 ease-out active:scale-95"
            >
              <FilterX className="w-4 h-4" />
            </button>
          </div>

          <button 
            onClick={handleExportExcel}
            className="flex items-center gap-2 px-4 py-2 btn-ios-primary text-sm ml-auto !bg-green-600 hover:!bg-green-700"
          >
            <Download className="w-4 h-4" /> Export to Excel
          </button>
        </div>
      </div>

      {/* Data Table */}
      <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden">
        <div className="overflow-x-auto min-h-[400px]">
          {filteredDocs.length > 0 ? (
            <table className="w-full text-left text-sm text-gray-600  border-collapse">
              <thead className="bg-slate-50/80 text-gray-500  uppercase border-b border-slate-200/50 sticky top-0 z-10">
                <tr>
                  <th className="px-4 py-3 font-medium">No.</th>
                  <th className="px-4 py-3 font-medium">Doc No.</th>
                  <th className="px-4 py-3 font-medium">Title</th>
                  <th className="px-4 py-3 font-medium">Type</th>
                  <th className="px-4 py-3 font-medium text-center">Rev.</th>
                  <th className="px-4 py-3 font-medium">Effective Date</th>
                  <th className="px-4 py-3 font-medium">Requester</th>
                  <th className="px-4 py-3 font-medium">Reviewer</th>
                  <th className="px-4 py-3 font-medium">Approver</th>
                  <th className="px-4 py-3 font-medium">Ack</th>
                  <th className="px-4 py-3 font-medium">Distribution</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 font-medium text-center">Preview</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100/50">
                {filteredDocs.map((doc, idx) => {
                  const dar = dars.find(d => d.id === doc.darId);
                  
                  return (
                  <tr key={doc.id} className="hover:bg-slate-50/80 transition-colors duration-200">
                    <td className="px-4 py-3">{idx + 1}</td>
                    <td className="px-4 py-3 font-medium text-indigo-600 ">{doc.title}</td>
                    <td className="px-4 py-3 font-medium text-gray-800  max-w-xs truncate" title={doc.name}>{doc.name}</td>
                    <td className="px-4 py-3"><span className="px-2 py-0.5 bg-gray-100 rounded text-xs">{doc.title.split('-')[0]}</span></td>
                    <td className="px-4 py-3 text-center">{doc.rev}</td>
                    <td className="px-4 py-3">{doc.effectiveDate}</td>
                    <td className="px-4 py-3 text-gray-500  max-w-[120px] truncate" title={dar ? getRequesterName(dar, masterUsers) : '-'}>{dar ? getRequesterName(dar, masterUsers) : '-'}</td>
                    <td className="px-4 py-3 text-gray-500  max-w-[120px] truncate" title={dar ? getReviewerName(dar, timeline) : '-'}>{dar ? getReviewerName(dar, timeline) : '-'}</td>
                    <td className="px-4 py-3 text-gray-500  max-w-[120px] truncate" title={dar ? getApproverName(dar, timeline) : '-'}>{dar ? getApproverName(dar, timeline) : '-'}</td>
                    <td className="px-4 py-3 text-gray-500  max-w-[120px] truncate" title={dar ? getAckNames(dar, timeline) : '-'}>{dar ? getAckNames(dar, timeline) : '-'}</td>
                    <td className="px-4 py-3 text-xs max-w-[120px] truncate" title={(doc.distributedTo || []).join(', ')}>
                      {(doc.distributedTo || []).join(', ') || '-'}
                    </td>
                    <td className="px-4 py-3">{getStatusBadge(doc.status)}</td>
                    <td className="px-4 py-3 text-center">
                      <button 
                        onClick={() => {
                          setPreviewDoc(doc);
                          setIsPreviewOpen(true);
                        }}
                        className="text-blue-500  hover:text-blue-700  p-1.5 bg-blue-50/50 hover:bg-blue-100 rounded-lg transition-all duration-300 ease-out active:scale-95"
                        title="Preview Document"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                )})}
              </tbody>
            </table>
          ) : (
            <div className="flex items-center justify-center h-64">
              <EmptyState message={`ไม่พบทะเบียนเอกสารในแผนก ${masterListDept}`} />
            </div>
          )}
        </div>
      </div>

      {/* Inline PDF Preview Modal */}
      {previewDoc && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/40">
          <motion.div 
            initial={{ scale: 0.95, opacity: 0, y: 10 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            className="bg-white border border-gray-200 w-full max-w-4xl h-[85vh] flex flex-col overflow-hidden rounded-3xl"
          >
            <div className="flex items-center justify-between p-4 border-b border-gray-100 bg-gray-50/50">
              <div>
                <h3 className="font-bold text-gray-800 ">{previewDoc.title}: {previewDoc.name}</h3>
                <p className="text-sm text-gray-500 ">Revision {previewDoc.rev} • {previewDoc.status}</p>
              </div>
              <button 
                onClick={() => {
                  setPreviewDoc(null);
                  setIsPreviewOpen(false);
                }}
                className="p-2 text-gray-400  hover:text-gray-600  hover:bg-gray-200/50 rounded-full transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="flex-1 bg-gray-200/50 flex flex-col items-center justify-center p-8">
              <FileText className="w-16 h-16 text-gray-400  mb-4 opacity-50" />
              <p className="text-gray-500  font-medium">PDF Preview Simulator</p>
              <p className="text-gray-400  text-sm mt-2">Displaying document: {previewDoc.id}</p>
            </div>
          </motion.div>
        </div>
      )}
    </motion.div>
  );
};

export default MasterList;
