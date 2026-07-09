import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import useStore from '../../store/useStore';
import { Search, BookOpen, Layers, Share2, Globe, FilterX, Download, FileText, Eye, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { getRequesterName, getReviewerName, getApproverName, getAckNames } from '../../utils/darHelper';
import ReplacementModal from './ReplacementModal';
import toast from 'react-hot-toast';
import fontkit from '@pdf-lib/fontkit';
import { PDFDocument, rgb, degrees } from 'pdf-lib';

const Library = () => {
  const navigate = useNavigate();
  const { documents, currentUser, canAccessDocument, canDownloadDocument, dars, timeline, masterUsers, controlledCopyInstances, reportCcDamagedLost, logAction } = useStore();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [filterDept, setFilterDept] = useState('');
  const [filterType, setFilterType] = useState('');
  const [filterStandard, setFilterStandard] = useState('');
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
    const matchesStandard = filterStandard ? (doc.relatedStandards || []).includes(filterStandard) : true;
    const matchesStatus = filterStatus ? doc.status === filterStatus || (filterStatus === 'OBSOLETE' && doc.status === 'SUPERSEDED_ARCHIVED') : true;
    const matchesDate = filterDate ? doc.effectiveDate === filterDate : true;
    return matchesSearch && matchesDept && matchesType && matchesStandard && matchesStatus && matchesDate;
  });

  const availableTypes = [...new Set(accessibleDocs.map(doc => doc.title.split('-')[0]))].filter(Boolean).sort();
  const availableStandards = [...new Set(accessibleDocs.flatMap(doc => doc.relatedStandards || []))].filter(Boolean).sort();
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

  const handleDownloadMaster = async (doc, e) => {
    e.stopPropagation();
    try {
      const pdfDoc = await PDFDocument.create();
      pdfDoc.registerFontkit(fontkit);
      
      let customFont;
      try {
        const fontBytes = await fetch('/fonts/NotoSansThai-Regular.ttf').then(res => {
          if (!res.ok) throw new Error('Font load failed');
          return res.arrayBuffer();
        });
        customFont = await pdfDoc.embedFont(fontBytes);
      } catch(err) {
        console.warn('Failed to load Thai font', err);
      }

      const page = pdfDoc.addPage([595.28, 841.89]); // A4
      
      const { width, height } = page.getSize();
      page.drawText('ORIGINAL', {
        x: width / 2 - 150,
        y: height / 2,
        size: 70,
        color: rgb(1, 0, 0),
        rotate: degrees(-45),
        opacity: 0.3,
      });
      
      const textOptions = { x: 50, y: height - 50, size: 12, color: rgb(0,0,0) };
      if (customFont) textOptions.font = customFont;
      page.drawText(`Document: ${doc.title} - ${doc.name}`, textOptions);
      
      const revOptions = { x: 50, y: height - 70, size: 12, color: rgb(0,0,0) };
      if (customFont) revOptions.font = customFont;
      page.drawText(`Rev: ${doc.rev}`, revOptions);
      
      const pdfBytes = await pdfDoc.save();
      const blob = new Blob([pdfBytes], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${doc.title}_MASTER.pdf`;
      link.click();
      window.URL.revokeObjectURL(url);
      
      toast.success('ดาวน์โหลด Master Document สำเร็จ');
      logAction('DOWNLOAD_MASTER', `Downloaded Master for ${doc.title}`);
    } catch (error) {
      console.error('PDF Generation Error:', error);
      toast.error('เกิดข้อผิดพลาดในการสร้าง PDF');
    }
  };

  const handleDownloadExternal = async (doc, e) => {
    e.stopPropagation();
    try {
      const pdfDoc = await PDFDocument.create();
      pdfDoc.registerFontkit(fontkit);
      
      let customFont;
      try {
        const fontBytes = await fetch('/fonts/NotoSansThai-Regular.ttf').then(res => {
          if (!res.ok) throw new Error('Font load failed');
          return res.arrayBuffer();
        });
        customFont = await pdfDoc.embedFont(fontBytes);
      } catch(err) {
        console.warn('Failed to load Thai font', err);
      }

      pdfDoc.addPage([595.28, 841.89]); // A4
      
      if (customFont) {
        page.drawText('CONFIDENTIAL', { x: 80, y: height / 2 + 50, size: 50, color: rgb(1,0,0), rotate: degrees(-30), opacity: 0.3, font: customFont });
        page.drawText('เอกสารควบคุมภายใน ห้าม COPY', { x: 80, y: height / 2, size: 30, color: rgb(1,0,0), rotate: degrees(-30), opacity: 0.3, font: customFont });
      } else {
         page.drawText('CONFIDENTIAL\nINTERNAL CONTROLLED COPY - DO NOT COPY', {
          x: 50, y: height / 2, size: 30, color: rgb(1, 0, 0), rotate: degrees(-30), opacity: 0.3, lineHeight: 40,
        });
      }
      
      const textOptions = { x: 50, y: height - 50, size: 12, color: rgb(0,0,0) };
      if (customFont) textOptions.font = customFont;
      page.drawText(`Document: ${doc.title} - ${doc.name}`, textOptions);
      
      const revOptions = { x: 50, y: height - 70, size: 12, color: rgb(0,0,0) };
      if (customFont) revOptions.font = customFont;
      page.drawText(`Rev: ${doc.rev}`, revOptions);
      
      const pdfBytes = await pdfDoc.save();
      const blob = new Blob([pdfBytes], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${doc.title}_EXTERNAL.pdf`;
      link.click();
      window.URL.revokeObjectURL(url);
      
      toast.success('ดาวน์โหลดเอกสารสำหรับหน่วยงานภายนอกสำเร็จ');
      logAction('DOWNLOAD_EXTERNAL', `Downloaded External Copy for ${doc.title}`);
    } catch (error) {
      console.error(error);
      toast.error('เกิดข้อผิดพลาดในการสร้าง PDF');
    }
  };

  const renderFlatTable = (docs) => (
    <div className="bg-white  rounded-xl shadow-md border border-gray-100  overflow-hidden">
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
          <motion.tbody 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1, transition: { staggerChildren: 0.03 } }}
            className="divide-y divide-gray-50 "
          >
            {docs.map((doc, idx) => {
              const dar = dars.find(d => d.id === doc.darId);
              return (
              <motion.tr 
                variants={{ hidden: { opacity: 0, y: 10 }, show: { opacity: 1, y: 0 } }}
                layoutId={`library-item-${doc.id}`}
                key={doc.id} 
                className="hover:bg-slate-50 transition-colors cursor-pointer" 
                onClick={(e) => {
                  // Only navigate if it's not a click on buttons
                  if (e.target.closest('button')) return;
                  navigate(`/library/${doc.id}`);
                }}
              >
                <td className="px-4 py-3 text-center flex justify-center gap-2">
                  <button 
                    onClick={(e) => { e.stopPropagation(); setPreviewDoc(doc); }}
                    className="text-blue-500  hover:text-blue-700  p-1.5 bg-blue-50 hover:bg-blue-100 rounded-md transition-colors"
                    title="Preview Document"
                  >
                    <Eye size={24} strokeWidth={1.25}/>
                  </button>
                  {canDownloadDocument(doc, currentUser) && (
                    <>
                      <button 
                        onClick={(e) => handleDownloadMaster(doc, e)}
                        className="text-green-600  hover:text-green-700  p-1.5 bg-green-50 hover:bg-green-100 rounded-md transition-colors"
                        title={doc.title.startsWith('FM') ? "Print / Download Form (No Watermark)" : "Download Master (DCC Only)"}
                      >
                        <Download size={24} strokeWidth={1.25}/>
                      </button>
                      <button 
                        onClick={(e) => handleDownloadExternal(doc, e)}
                        className="text-indigo-600  hover:text-indigo-700  p-1.5 bg-indigo-50 hover:bg-indigo-100 rounded-md transition-colors"
                        title="Download for External Use"
                      >
                        <Share2 size={24} strokeWidth={1.25}/>
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
                      <FileText size={24} strokeWidth={1.25}/>
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
              </motion.tr>
            )})}
            {docs.length === 0 && (
              <tr>
                <td colSpan="13" className="px-6 py-12 text-center text-gray-500 ">
                  <div className="text-gray-400  mb-2 flex justify-center"><BookOpen size={40} strokeWidth={1.25}/></div>
                  <p className="font-medium">ไม่พบเอกสารในหมวดหมู่นี้</p>
                </td>
              </tr>
            )}
          </motion.tbody>
        </table>
      </div>
    </div>
  );



  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-800  flex items-center gap-2">
            <BookOpen className="text-blue-600" size={28} strokeWidth={1.25}/> คลังเอกสาร (Document Library)
          </h2>
          <p className="text-gray-500  mt-1">ศูนย์รวมเอกสารที่ประกาศใช้แล้ว (Effective Documents)</p>
        </div>
      </div>

      <div className="flex border-b border-gray-300 overflow-x-auto">
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

      <div className="p-6 bg-white  rounded-xl shadow-md border border-gray-100  flex flex-col md:flex-row gap-4 items-center">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} strokeWidth={1.25}/>
          <input 
            type="text"
            placeholder="ค้นหาตามรหัสเอกสาร หรือ ชื่อเอกสาร..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 text-sm bg-slate-50  border border-slate-300  rounded-lg text-gray-800  focus:ring-2 focus:ring-blue-500/20 outline-none transition-all"
          />
        </div>
        
        <div className="flex items-center gap-2 w-full md:w-auto overflow-x-auto">
          <div className="relative flex items-center min-w-[140px]">
             <select 
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              disabled={availableTypes.length === 0}
              className="w-full px-3 py-2 text-sm bg-slate-50  border border-slate-300  rounded-lg text-gray-800  outline-none disabled:opacity-50"
            >
              <option value="">ทุกประเภท</option>
              {availableTypes.map(t => {
                const typeNames = { MA: 'Manual (MA)', HA: 'Hazard Analysis (HA)', HAP: 'Haccp Plan (HAP)', FSP: 'Food Safety Plan (FSP)', QP: 'Quality Procedure (QP)', WI: 'Work Instructions (WI)', SD: 'Support Document (SD)', FM: 'Form (FM)', PS: 'Product Specification (PS)', VA: 'Validation (VA)' };
                return <option key={t} value={t}>{typeNames[t] || t}</option>;
              })}
            </select>
          </div>
          
          <div className="relative flex items-center min-w-[140px]">
             <select 
              value={filterStandard}
              onChange={(e) => setFilterStandard(e.target.value)}
              disabled={availableStandards.length === 0}
              className="w-full px-3 py-2 text-sm bg-slate-50  border border-slate-300  rounded-lg text-gray-800  outline-none disabled:opacity-50"
            >
              <option value="">ทุกมาตรฐาน</option>
              {availableStandards.map(s => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>

          {(activeTab === 'global' || activeTab === 'dist') && (
            <div className="relative flex items-center min-w-[150px]">
              <select 
                value={filterDept}
                onChange={(e) => setFilterDept(e.target.value)}
                disabled={availableDepts.length === 0}
                className="w-full px-3 py-2 text-sm bg-slate-50  border border-slate-300  rounded-lg text-gray-800  outline-none disabled:opacity-50"
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
                  className="w-full px-3 py-2 text-sm bg-slate-50  border border-slate-300  rounded-lg text-gray-800  outline-none"
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
                  className="w-full px-3 py-2 text-sm bg-slate-50  border border-slate-300  rounded-lg text-gray-800  outline-none"
                  title="Effective Date"
                />
              </div>
            </>
          )}

          {(searchTerm || filterType || filterStandard || filterStatus !== 'EFFECTIVE' || filterDate || filterDept) && (
            <button 
              onClick={() => {
                setSearchTerm('');
                setFilterType('');
                setFilterStandard('');
                setFilterStatus('EFFECTIVE');
                setFilterDate('');
                setFilterDept('');
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-red-600 bg-red-50 hover:bg-red-100 rounded-lg transition-colors"
            >
              <FilterX size={14} /> ล้างตัวกรอง
            </button>
          )}
          
          {(activeTab === 'dept' || currentUser.isDcc) && (
            <button 
              onClick={handleExport}
              className="flex items-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700    rounded-lg text-sm font-medium transition-colors border border-slate-300  flex-shrink-0 ml-auto"
            >
              <Download size={24} strokeWidth={1.25}/> {currentUser.isDcc ? 'Export Master List' : 'Export Dept List'}
            </button>
          )}
        </div>
      </div>

      {renderFlatTable(filteredDocs)}
      
      {/* Inline PDF Preview Modal */}
      <AnimatePresence>
        {previewDoc && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} 
              className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" 
              onClick={() => setPreviewDoc(null)} 
            />
            <motion.div 
              layoutId={`library-item-${previewDoc.id}`}
              className="relative bg-white rounded-2xl shadow-xl w-full max-w-4xl h-[85vh] flex flex-col overflow-hidden border border-slate-300"
            >
              <div className="flex items-center justify-between p-4 border-b border-gray-100 bg-gray-50">
                <div>
                  <h3 className="font-bold text-gray-800 ">{previewDoc.title}: {previewDoc.name}</h3>
                  <p className="text-sm text-gray-500 ">Revision {previewDoc.rev} • {previewDoc.status}</p>
                </div>
                <button 
                  onClick={() => setPreviewDoc(null)}
                  className="p-2 text-gray-400  hover:text-gray-600  hover:bg-gray-200 rounded-full transition-colors"
                >
                  <X size={24} strokeWidth={1.25}/>
                </button>
              </div>
              <div className="flex-1 bg-slate-100 flex flex-col items-center justify-center p-8">
                <FileText className="text-gray-400 mb-4 opacity-50" size={64} strokeWidth={1.25}/>
                <p className="text-gray-500  font-medium">PDF Preview Simulator</p>
                <p className="text-gray-400  text-sm mt-2">Displaying document: {previewDoc.id}</p>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

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
