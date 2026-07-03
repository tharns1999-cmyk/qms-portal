import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import useStore from '../../store/useStore';
import { Search, Filter, BookOpen, Layers, Share2, Globe, FilterX, Download, FileText, Eye, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { getRequesterName, getReviewerName, getApproverName, getAckNames } from '../../utils/darHelper';
import ReplacementModal from './ReplacementModal';
import toast from 'react-hot-toast';

const Library = () => {
  const navigate = useNavigate();
  const { documents, currentUser, canAccessDocument, dars, timeline, masterUsers, controlledCopyInstances, reportCcDamagedLost, addNotification } = useStore();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [filterDept, setFilterDept] = useState('');
  const [filterType, setFilterType] = useState('');
  const [filterStatus, setFilterStatus] = useState('EFFECTIVE');
  const [filterDate, setFilterDate] = useState('');
  const [activeTab, setActiveTab] = useState(currentUser.isDcc ? 'global' : 'dept'); // 'dept', 'dist', 'global'
  const [previewDoc, setPreviewDoc] = useState(null);
  
  // For Replacement
  const [replacementInstance, setReplacementInstance] = useState(null);

  const userDepts = currentUser.depts || [currentUser.department || currentUser.dept];
  const isGlobalView = currentUser.level >= 5 || currentUser.isDcc;

  // Helper for QA vs QA/QC match, supporting array of user departments
  const isSameDept = (userDeptsArr, d) => {
    return userDeptsArr.some(u => u === d || (u === 'QA' && d === 'QA/QC') || (u === 'QA/QC' && d === 'QA'));
  };

  // Enforce Security Logic at Query Level
  const accessibleDocs = documents.filter(d => {
    // If DCC Admin, allow viewing EFFECTIVE and OBSOLETE (filtered later by filterStatus)
    if (currentUser.isDcc) {
      if (d.status !== 'EFFECTIVE' && d.status !== 'OBSOLETE' && d.status !== 'SUPERSEDED_ARCHIVED') return false;
    } else {
      // Normal users only see EFFECTIVE
      if (d.status !== 'EFFECTIVE') return false;
    }
    
    // Level < 5: Strictly enforce tab-based rules at query level
    if (!isGlobalView) {
      if (activeTab === 'dept') {
        return isSameDept(userDepts, d.department);
      } else if (activeTab === 'dist') {
        return d.distributions && d.distributions.some(dist => isSameDept(userDepts, dist.departmentId || dist.dept) && dist.isDistributed === true);
      }
      return false;
    }
    
    // Level >= 5 (Global Access)
    if (activeTab === 'dept') return isSameDept(userDepts, d.department);
    if (activeTab === 'dist') return d.distributions && d.distributions.some(dist => isSameDept(userDepts, dist.departmentId || dist.dept) && dist.isDistributed === true) && !isSameDept(userDepts, d.department);
    
    // 'global' tab for Level 5+ (Uses canAccessDocument which allows all for L5)
    return canAccessDocument(currentUser.id, d.department, d.distributions);
  });

  const filteredDocs = accessibleDocs.filter(doc => {
    const matchesSearch = doc.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          doc.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesDept = filterDept ? doc.department === filterDept : true;
    const matchesType = filterType ? doc.title.startsWith(filterType) : true;
    const matchesStatus = filterStatus ? doc.status === filterStatus || (filterStatus === 'OBSOLETE' && doc.status === 'SUPERSEDED_ARCHIVED') : true;
    const matchesDate = filterDate ? doc.effectiveDate === filterDate : true;
    return matchesSearch && matchesDept && matchesType && matchesStatus && matchesDate;
  });

  const availableTypes = [...new Set(accessibleDocs.map(doc => doc.title.split('-')[0]))].filter(Boolean).sort();
  const availableDepts = [...new Set(accessibleDocs.map(doc => doc.department))].filter(Boolean).sort();

  const handleExport = () => {
    // If DCC Admin, export all filtered docs, else export only dept docs (first primary dept for export name, but query by array)
    const docsToExport = currentUser.isDcc ? filteredDocs : documents.filter(d => isSameDept(userDepts, d.department) && d.status === 'EFFECTIVE');
    if (docsToExport.length === 0) return alert('ไม่มีข้อมูลสำหรับส่งออก');
    
    const headers = ['No.', 'Doc No.', 'Title', 'Type', 'Owner Dept', 'Rev.', 'Effective Date', 'Requester', 'Reviewer', 'Approver', 'Ack', 'Distribution', 'Status'];
    const rows = docsToExport.map((doc, index) => {
      const docType = doc.title.split('-')[0] || 'Unknown';
      const distribution = (doc.distributions || []).map(d => d.departmentId).join(' | ');
      
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
        doc.department,
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
    const filename = currentUser.isDcc ? `MasterList_Global_${new Date().toISOString().split('T')[0]}.csv` : `Department_MasterList_${currentUser.department}_${new Date().toISOString().split('T')[0]}.csv`;
    link.setAttribute("download", filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };
  const renderFlatTable = (docs) => (
    <div className="bg-white  rounded-xl shadow-sm border border-gray-100  overflow-hidden">
      <div className="overflow-x-auto min-h-[200px]">
        <table className="w-full text-left text-sm text-gray-600 ">
          <thead className="bg-white  text-gray-500  uppercase border-b border-gray-100 ">
            <tr>
              <th className="px-4 py-3 font-medium text-center w-12">Action</th>
              <th className="px-4 py-3 font-medium w-12">No.</th>
              <th className="px-4 py-3 font-medium">Doc No.</th>
              <th className="px-4 py-3 font-medium">Title</th>
              <th className="px-4 py-3 font-medium">Type</th>
              <th className="px-4 py-3 font-medium">Owner Dept</th>
              <th className="px-4 py-3 font-medium text-center">Rev.</th>
              <th className="px-4 py-3 font-medium">Effective Date</th>
              <th className="px-4 py-3 font-medium">Requester</th>
              <th className="px-4 py-3 font-medium">Reviewer</th>
              <th className="px-4 py-3 font-medium">Approver</th>
              <th className="px-4 py-3 font-medium">Ack</th>
              <th className="px-4 py-3 font-medium">Distribution</th>
              <th className="px-4 py-3 font-medium">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50 ">
            {docs.map((doc, idx) => {
              const dar = dars.find(d => d.id === doc.darId);
              return (
              <tr key={doc.id} className="hover:bg-slate-50/80  transition-colors cursor-pointer" onClick={() => navigate(`/library/${doc.id}`)}>
                <td className="px-4 py-3 text-center flex justify-center gap-2">
                  <button 
                    onClick={(e) => { e.stopPropagation(); setPreviewDoc(doc); }}
                    className="text-blue-500  hover:text-blue-700  p-1.5 bg-blue-50 hover:bg-blue-100 rounded-md transition-colors"
                    title="Preview Document"
                  >
                    <Eye className="w-4 h-4" />
                  </button>
                  {currentUser.isDcc && (
                    <>
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          toast.success('ดาวน์โหลด Master Document สำเร็จ');
                        }}
                        className="text-green-600  hover:text-green-700  p-1.5 bg-green-50 hover:bg-green-100 rounded-md transition-colors"
                        title="Download Master (DCC Only)"
                      >
                        <Download className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          toast.success('ดาวน์โหลดเอกสารสำหรับหน่วยงานภายนอกสำเร็จ');
                        }}
                        className="text-indigo-600  hover:text-indigo-700  p-1.5 bg-indigo-50 hover:bg-indigo-100 rounded-md transition-colors"
                        title="Download for External Use"
                      >
                        <Share2 className="w-4 h-4" />
                      </button>
                    </>
                  )}
                  {activeTab === 'dist' && (
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        const instance = controlledCopyInstances.find(i => i.docId === doc.id && isSameDept(userDepts, i.department) && i.status === 'ACTIVE');
                        if (instance) {
                          setReplacementInstance(instance);
                        } else {
                          toast.error('ไม่พบสำเนาควบคุมของแผนกคุณที่เป็นสถานะ ACTIVE (อาจอยู่ระหว่างดำเนินการหรือเกิดข้อผิดพลาด)');
                        }
                      }}
                      className="text-amber-500  hover:text-amber-700 p-1.5 bg-amber-50 hover:bg-amber-100 rounded-md transition-colors"
                      title="ขอสำเนาควบคุมใหม่ (Request Replacement)"
                    >
                      <FileText className="w-4 h-4" />
                    </button>
                  )}
                </td>
                <td className="px-4 py-3 text-gray-500 ">{idx + 1}</td>
                <td className="px-4 py-3 font-medium text-indigo-600 ">{doc.title}</td>
                <td className="px-4 py-3 font-medium text-gray-800  max-w-xs truncate" title={doc.name}>{doc.name}</td>
                <td className="px-4 py-3"><span className="px-2 py-0.5 bg-gray-100 rounded text-xs">{doc.title.split('-')[0]}</span></td>
                <td className="px-4 py-3 font-medium text-gray-700 ">{doc.department}</td>
                <td className="px-4 py-3 text-center">{doc.rev}</td>
                <td className="px-4 py-3">{doc.effectiveDate}</td>
                <td className="px-4 py-3 text-gray-500  max-w-[120px] truncate" title={dar ? getRequesterName(dar, masterUsers) : '-'}>{dar ? getRequesterName(dar, masterUsers) : '-'}</td>
                <td className="px-4 py-3 text-gray-500  max-w-[120px] truncate" title={dar ? getReviewerName(dar, timeline) : '-'}>{dar ? getReviewerName(dar, timeline) : '-'}</td>
                <td className="px-4 py-3 text-gray-500  max-w-[120px] truncate" title={dar ? getApproverName(dar, timeline) : '-'}>{dar ? getApproverName(dar, timeline) : '-'}</td>
                <td className="px-4 py-3 text-gray-500  max-w-[120px] truncate" title={dar ? getAckNames(dar, timeline) : '-'}>{dar ? getAckNames(dar, timeline) : '-'}</td>
                <td className="px-4 py-3 text-xs max-w-[120px] truncate" title={(doc.distributions || []).map(d => d.departmentId).join(', ')}>
                  {(doc.distributions || []).map(d => d.departmentId).join(', ') || '-'}
                </td>
                <td className="px-4 py-3"><span className="px-2 py-1 bg-green-100 text-green-700  rounded-full text-xs font-medium">Effective</span></td>
              </tr>
            )})}
            {docs.length === 0 && (
              <tr>
                <td colSpan="13" className="px-6 py-12 text-center text-gray-500 ">
                  <div className="text-gray-400  mb-2 flex justify-center"><BookOpen className="w-10 h-10" /></div>
                  <p className="font-medium">ไม่พบเอกสารในหมวดหมู่นี้</p>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );

  const renderCategorizedTables = (docs) => {
    const groups = docs.reduce((acc, doc) => {
      const prefix = doc.title.split('-')[0] || 'OTHER';
      if (!acc[prefix]) acc[prefix] = [];
      acc[prefix].push(doc);
      return acc;
    }, {});
    
    if (docs.length === 0) {
      return renderFlatTable([]);
    }

    const typeNames = {
      QP: 'Procedure (QP)',
      WI: 'Work Instruction (WI)',
      FM: 'Form (FM)',
      SD: 'Standard (SD)',
      MN: 'Manual (MN)'
    };

    return (
      <div className="space-y-6">
        {Object.keys(groups).sort().map(prefix => (
          <div key={prefix} className="bg-white  rounded-xl shadow-sm border border-gray-100  overflow-hidden">
            <div className="bg-gray-50  px-6 py-3 border-b border-gray-100  font-semibold text-gray-700  flex items-center gap-2">
              <Layers className="w-4 h-4 text-indigo-500 " /> {typeNames[prefix] || prefix}
              <span className="ml-auto bg-gray-200  text-gray-600  px-2 py-0.5 rounded-full text-xs">{groups[prefix].length}</span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-gray-600 ">
                <thead className="bg-white  text-gray-500  uppercase border-b border-gray-100 ">
                  <tr>
                    <th className="px-4 py-3 font-medium text-center w-12">Action</th>
                    <th className="px-4 py-3 font-medium w-12">No.</th>
                    <th className="px-4 py-3 font-medium">Doc No.</th>
                    <th className="px-4 py-3 font-medium">Title</th>
                    <th className="px-4 py-3 font-medium">Type</th>
                    <th className="px-4 py-3 font-medium">Owner Dept</th>
                    <th className="px-4 py-3 font-medium text-center">Rev.</th>
                    <th className="px-4 py-3 font-medium">Effective Date</th>
                    <th className="px-4 py-3 font-medium">Requester</th>
                    <th className="px-4 py-3 font-medium">Reviewer</th>
                    <th className="px-4 py-3 font-medium">Approver</th>
                    <th className="px-4 py-3 font-medium">Ack</th>
                    <th className="px-4 py-3 font-medium">Distribution</th>
                    <th className="px-4 py-3 font-medium">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 ">
                  {groups[prefix].map((doc, idx) => {
                    const dar = dars.find(d => d.id === doc.darId);
                    return (
                    <tr key={doc.id} className="hover:bg-slate-50/80  transition-colors duration-200 cursor-pointer" onClick={() => navigate(`/library/${doc.id}`)}>
                      <td className="px-4 py-3 text-center flex justify-center gap-2">
                        <button 
                          onClick={(e) => { e.stopPropagation(); setPreviewDoc(doc); }}
                          className="text-blue-500  hover:text-blue-700  p-1.5 bg-blue-50 hover:bg-blue-100 rounded-md transition-colors"
                          title="Preview Document"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        {currentUser.isDcc && (
                          <>
                            <button 
                              onClick={(e) => {
                                e.stopPropagation();
                                toast.success('ดาวน์โหลด Master Document สำเร็จ');
                              }}
                              className="text-green-600  hover:text-green-700  p-1.5 bg-green-50 hover:bg-green-100 rounded-md transition-colors"
                              title="Download Master (DCC Only)"
                            >
                              <Download className="w-4 h-4" />
                            </button>
                            <button 
                              onClick={(e) => {
                                e.stopPropagation();
                                toast.success('ดาวน์โหลดเอกสารสำหรับหน่วยงานภายนอกสำเร็จ');
                              }}
                              className="text-indigo-600  hover:text-indigo-700  p-1.5 bg-indigo-50 hover:bg-indigo-100 rounded-md transition-colors"
                              title="Download for External Use"
                            >
                              <Share2 className="w-4 h-4" />
                            </button>
                          </>
                        )}
                        {activeTab === 'dist' && (
                          <button 
                            onClick={(e) => {
                              e.stopPropagation();
                              const instance = controlledCopyInstances.find(i => i.docId === doc.id && isSameDept(userDepts, i.department) && i.status === 'ACTIVE');
                              if (instance) {
                                setReplacementInstance(instance);
                              } else {
                                toast.error('ไม่พบสำเนาควบคุมของแผนกคุณที่เป็นสถานะ ACTIVE (อาจอยู่ระหว่างดำเนินการหรือเกิดข้อผิดพลาด)');
                              }
                            }}
                            className="text-amber-500  hover:text-amber-700 p-1.5 bg-amber-50 hover:bg-amber-100 rounded-md transition-colors"
                            title="ขอสำเนาควบคุมใหม่ (Request Replacement)"
                          >
                            <FileText className="w-4 h-4" />
                          </button>
                        )}
                      </td>
                      <td className="px-4 py-3 text-gray-500 ">{idx + 1}</td>
                      <td className="px-4 py-3 font-medium text-indigo-600 ">{doc.title}</td>
                      <td className="px-4 py-3 font-medium text-gray-800  max-w-xs truncate" title={doc.name}>{doc.name}</td>
                      <td className="px-4 py-3"><span className="px-2 py-0.5 bg-gray-100  rounded text-xs">{doc.title.split('-')[0]}</span></td>
                      <td className="px-4 py-3 font-medium text-gray-700 ">{doc.department}</td>
                      <td className="px-4 py-3 text-center">{doc.rev}</td>
                      <td className="px-4 py-3">{doc.effectiveDate}</td>
                      <td className="px-4 py-3 text-gray-500  max-w-[120px] truncate" title={dar ? getRequesterName(dar, masterUsers) : '-'}>{dar ? getRequesterName(dar, masterUsers) : '-'}</td>
                      <td className="px-4 py-3 text-gray-500  max-w-[120px] truncate" title={dar ? getReviewerName(dar, timeline) : '-'}>{dar ? getReviewerName(dar, timeline) : '-'}</td>
                      <td className="px-4 py-3 text-gray-500  max-w-[120px] truncate" title={dar ? getApproverName(dar, timeline) : '-'}>{dar ? getApproverName(dar, timeline) : '-'}</td>
                      <td className="px-4 py-3 text-gray-500  max-w-[120px] truncate" title={dar ? getAckNames(dar, timeline) : '-'}>{dar ? getAckNames(dar, timeline) : '-'}</td>
                      <td className="px-4 py-3 text-xs max-w-[120px] truncate" title={(doc.distributions || []).map(d => d.departmentId).join(', ')}>
                        {(doc.distributions || []).map(d => d.departmentId).join(', ') || '-'}
                      </td>
                      <td className="px-4 py-3"><span className="px-2 py-1 bg-green-100 text-green-700  rounded-full text-xs font-medium">Effective</span></td>
                    </tr>
                  )})}
                </tbody>
              </table>
            </div>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-800  flex items-center gap-2">
            <BookOpen className="w-7 h-7 text-blue-600 " /> คลังเอกสาร (Document Library)
          </h2>
          <p className="text-gray-500  mt-1">ศูนย์รวมเอกสารที่ประกาศใช้แล้ว (Effective Documents)</p>
        </div>
      </div>

      <div className="flex border-b border-gray-200 overflow-x-auto">
        {[
          ...(!currentUser.isDcc ? [{ id: 'dept', icon: Layers, label: 'เอกสารในแผนก (My Department)', color: 'blue' }] : []),
          ...(!currentUser.isDcc ? [{ id: 'dist', icon: Share2, label: 'เอกสารที่ถูกแจกจ่าย (Distributed to Me)', color: 'blue' }] : []),
          ...(isGlobalView ? [{ id: 'global', icon: Globe, label: currentUser.isDcc ? 'Master Documents (Global View)' : 'เอกสารทั้งหมด (Global Access)', color: 'purple' }] : [])
        ].map(tab => {
          const isActive = activeTab === tab.id;
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className="relative flex items-center gap-2 py-3 px-6 font-medium text-sm transition-colors rounded-t-xl group outline-none"
            >
              {isActive && (
                <motion.div
                  layoutId="library-tab"
                  className={`absolute inset-0 ${tab.color === 'purple' ? 'bg-purple-50/80  border-b-2 border-purple-600' : 'bg-blue-50/80  border-b-2 border-blue-600'} rounded-t-xl`}
                  transition={{ type: "spring", stiffness: 300, damping: 30 }}
                />
              )}
              {!isActive && (
                <div className="absolute inset-0 bg-gray-50  opacity-0 group-hover:opacity-100 transition-opacity rounded-t-xl" />
              )}
              <div className={`relative z-10 flex items-center gap-2 ${isActive ? (tab.color === 'purple' ? 'text-purple-700 ' : 'text-blue-700 ') : 'text-gray-500  group-hover:text-gray-700  '}`}>
                <Icon className="w-4 h-4" /> {tab.label}
              </div>
            </button>
          );
        })}
      </div>

      <div className="p-6 bg-white  rounded-xl shadow-sm border border-gray-100  flex flex-col md:flex-row gap-4 items-center">
        <div className="relative flex-1 w-full">
          <Search className="w-5 h-5 absolute left-3 top-2.5 text-gray-400 " />
          <input 
            type="text"
            placeholder="ค้นหาตามรหัสเอกสาร หรือ ชื่อเอกสาร..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 text-sm bg-slate-50  border border-slate-200  rounded-lg text-gray-800  focus:ring-2 focus:ring-blue-500/20 outline-none transition-all"
          />
        </div>
        
        <div className="flex items-center gap-2 w-full md:w-auto overflow-x-auto">
          <div className="relative flex items-center min-w-[140px]">
             <select 
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              disabled={availableTypes.length === 0}
              className="w-full px-3 py-2 text-sm bg-slate-50  border border-slate-200  rounded-lg text-gray-800  outline-none disabled:opacity-50"
            >
              <option value="">ทุกประเภท</option>
              {availableTypes.map(t => {
                const typeNames = { QP: 'Procedure (QP)', WI: 'Work Instruction (WI)', FM: 'Form (FM)', SD: 'Standard (SD)', MN: 'Manual (MN)' };
                return <option key={t} value={t}>{typeNames[t] || t}</option>;
              })}
            </select>
          </div>

          {(activeTab === 'global' || activeTab === 'dist') && (
            <div className="relative flex items-center min-w-[150px]">
              <select 
                value={filterDept}
                onChange={(e) => setFilterDept(e.target.value)}
                disabled={availableDepts.length === 0}
                className="w-full px-3 py-2 text-sm bg-slate-50  border border-slate-200  rounded-lg text-gray-800  outline-none disabled:opacity-50"
              >
                <option value="">ทุกแผนก (All)</option>
                {availableDepts.map(d => (
                  <option key={d} value={d}>{d}</option>
                ))}
              </select>
            </div>
          )}

          {currentUser.isDcc && (
            <>
              <div className="relative flex items-center min-w-[140px]">
                <select 
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="w-full px-3 py-2 text-sm bg-slate-50  border border-slate-200  rounded-lg text-gray-800  outline-none"
                >
                  <option value="">ทุกสถานะ</option>
                  <option value="EFFECTIVE">Effective (บังคับใช้)</option>
                  <option value="OBSOLETE">Obsolete (ล้าสมัย/ยกเลิก)</option>
                </select>
              </div>
              <div className="relative flex items-center min-w-[150px]">
                <input 
                  type="date"
                  value={filterDate}
                  onChange={(e) => setFilterDate(e.target.value)}
                  className="w-full px-3 py-2 text-sm bg-slate-50  border border-slate-200  rounded-lg text-gray-800  outline-none"
                  title="Effective Date"
                />
              </div>
            </>
          )}

          <button 
            onClick={() => {
              setSearchTerm('');
              setFilterDept('');
              setFilterType('');
              setFilterStatus(currentUser.isDcc ? 'EFFECTIVE' : '');
              setFilterDate('');
            }}
            className="p-2 text-gray-400  hover:text-gray-600  hover:bg-gray-100  rounded-lg transition-colors flex-shrink-0"
            title="ล้างตัวกรอง (Clear Filters)"
          >
            <FilterX className="w-5 h-5" />
          </button>
          
          {(activeTab === 'dept' || currentUser.isDcc) && (
            <button 
              onClick={handleExport}
              className="flex items-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700    rounded-lg text-sm font-medium transition-colors border border-slate-200  flex-shrink-0 ml-auto"
            >
              <Download className="w-4 h-4" /> {currentUser.isDcc ? 'Export Master List' : 'Export Dept List'}
            </button>
          )}
        </div>
      </div>

      {activeTab === 'dept' ? renderCategorizedTables(filteredDocs) : renderFlatTable(filteredDocs)}
      
      {/* Inline PDF Preview Modal */}
      {previewDoc && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl h-[85vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between p-4 border-b border-gray-100 bg-gray-50">
              <div>
                <h3 className="font-bold text-gray-800 ">{previewDoc.title}: {previewDoc.name}</h3>
                <p className="text-sm text-gray-500 ">Revision {previewDoc.rev} • {previewDoc.status}</p>
              </div>
              <button 
                onClick={() => setPreviewDoc(null)}
                className="p-2 text-gray-400  hover:text-gray-600  hover:bg-gray-200 rounded-full transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="flex-1 bg-gray-200 flex flex-col items-center justify-center p-8">
              <FileText className="w-16 h-16 text-gray-400  mb-4 opacity-50" />
              <p className="text-gray-500  font-medium">PDF Preview Simulator</p>
              <p className="text-gray-400  text-sm mt-2">Displaying document: {previewDoc.id}</p>
            </div>
          </div>
        </div>
      )}

      {/* Replacement Modal */}
      <ReplacementModal 
        isOpen={!!replacementInstance} 
        onClose={(success, type, reason) => {
          if (success) {
            reportCcDamagedLost(replacementInstance.id, type, reason);
            toast.success(`ส่งคำขอเบิกเอกสารทดแทนสำเร็จ รอ DCC อนุมัติ`);
          }
          setReplacementInstance(null);
        }} 
        instance={replacementInstance} 
        documentId={replacementInstance?.docId}
      />
    </div>
  );
};

export default Library;
