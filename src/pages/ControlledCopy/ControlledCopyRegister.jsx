import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, FileText, FileDown, AlertTriangle, ShieldCheck, RefreshCw, Layers, Download, ChevronLeft, ChevronRight, X } from 'lucide-react';
import useStore from '../../store/useStore';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';

const ControlledCopyRegister = () => {
  const { 
    currentUser, 
    controlledCopyInstances, 
    issueControlledCopy, 
    confirmCcReceipt, 
    reportCcDamagedLost, 
    recallControlledCopy,
    approveCcReplacement,
    rejectCcReplacement,
    documents,
    controlledCopyAuditTrail
  } = useStore();

  const [activeTab, setActiveTab] = useState('ACTION_REQUIRED');
  const [searchTerm, setSearchTerm] = useState('');
  
  // Audit Trail states
  const [auditSearchTerm, setAuditSearchTerm] = useState('');
  const [auditPage, setAuditPage] = useState(1);
  const auditItemsPerPage = 20;
  
  // Modals state
  const [issueModalOpen, setIssueModalOpen] = useState(false);
  const [issueDoc, setIssueDoc] = useState('');
  const [issueDept, setIssueDept] = useState('');

  const [reportModalOpen, setReportModalOpen] = useState(false);
  const [selectedInstance, setSelectedInstance] = useState(null);
  const [reportType, setReportType] = useState('DAMAGED');
  const [reportReason, setReportReason] = useState('');

  const [recallModalOpen, setRecallModalOpen] = useState(false);

  const navigate = useNavigate();
  const isAdmin = currentUser?.isDcc || currentUser?.role === 'DCC_ADMIN' || currentUser?.level >= 5;

  React.useEffect(() => {
    if (!isAdmin) {
      toast.error('เฉพาะ DCC Admin เท่านั้นที่สามารถเข้าถึงเมนูนี้ได้');
      navigate('/dashboard');
    }
  }, [isAdmin, navigate]);

  const [printData, setPrintData] = useState(null);

  const handlePrintAndDistribute = (inst) => {
    useStore.getState().distributeDocument(inst.docId, inst.department);
    confirmCcReceipt(inst.id);
    toast.success(`แจกจ่ายเอกสารให้ ${inst.department} เรียบร้อยแล้ว`);
    
    setPrintData(inst);
    setTimeout(() => {
      window.print();
      setPrintData(null);
    }, 500);
  };

  // Tabs
  const tabs = [
    { id: 'ACTION_REQUIRED', label: 'Action Required' },
    { id: 'ACTIVE', label: 'Active Copies' },
    { id: 'HISTORY', label: 'History & Register' },
    { id: 'AUDIT_TRAIL', label: 'Audit Trail' }
  ];

  // Filtering
  const filteredInstances = useMemo(() => {
    return controlledCopyInstances.filter(inst => {
      // Tab filter
      if (activeTab === 'ACTION_REQUIRED') {
        const doc = documents.find(d => d.id === inst.docId);
        const isRecall = doc && doc.status === 'SUPERSEDED_ARCHIVED' && inst.status === 'ACTIVE';
        if (inst.status !== 'PENDING_RECEIPT' && inst.status !== 'REPLACEMENT_REQUESTED' && !isRecall) {
          return false;
        }
      } else if (activeTab === 'ACTIVE') {
        if (inst.status !== 'ACTIVE') return false;
      }
      // If HISTORY, show all instances

      // Search filter
      if (searchTerm) {
        const lowerSearch = searchTerm.toLowerCase();
        return (
          inst.docTitle.toLowerCase().includes(lowerSearch) ||
          inst.ccNumber.toLowerCase().includes(lowerSearch) ||
          inst.department.toLowerCase().includes(lowerSearch)
        );
      }
      return true;
    }).sort((a, b) => new Date(b.dateIssued || 0) - new Date(a.dateIssued || 0));
  }, [controlledCopyInstances, activeTab, searchTerm, documents]);

  // Main Register Pagination
  const [registerPage, setRegisterPage] = useState(1);
  const registerItemsPerPage = 20;
  const totalRegisterPages = Math.ceil(filteredInstances.length / registerItemsPerPage);
  const currentRegisterInstances = useMemo(() => {
    const start = (registerPage - 1) * registerItemsPerPage;
    return filteredInstances.slice(start, start + registerItemsPerPage);
  }, [filteredInstances, registerPage]);

  // Audit Trail Filtering & Pagination
  const filteredAuditLogs = useMemo(() => {
    return controlledCopyAuditTrail
      .filter(log => {
        if (!auditSearchTerm) return true;
        const lowerSearch = auditSearchTerm.toLowerCase();
        return (
          log.docTitle.toLowerCase().includes(lowerSearch) ||
          log.ccNumber.toLowerCase().includes(lowerSearch) ||
          log.user.toLowerCase().includes(lowerSearch) ||
          log.action.toLowerCase().includes(lowerSearch) ||
          (log.remarks || '').toLowerCase().includes(lowerSearch)
        );
      })
      .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
  }, [controlledCopyAuditTrail, auditSearchTerm]);

  const totalAuditPages = Math.ceil(filteredAuditLogs.length / auditItemsPerPage);
  const currentAuditLogs = useMemo(() => {
    const start = (auditPage - 1) * auditItemsPerPage;
    return filteredAuditLogs.slice(start, start + auditItemsPerPage);
  }, [filteredAuditLogs, auditPage]);

  // Export to CSV
  const handleExportCSV = () => {
    if (filteredAuditLogs.length === 0) {
      toast.error('ไม่มีข้อมูลสำหรับ Export');
      return;
    }
    const headers = ['Timestamp,User,Action,Document,CC Number,Old Status,New Status,Remarks'];
    const rows = filteredAuditLogs.map(log => {
      return `"${new Date(log.timestamp).toLocaleString()}","${log.user}","${log.action}","${log.docTitle} (R${log.docRev})","${log.ccNumber}","${log.oldStatus}","${log.newStatus}","${log.remarks || '-'}"`;
    });
    const csvContent = "data:text/csv;charset=utf-8,\uFEFF" + headers.concat(rows).join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Controlled_Copy_Audit_Trail_${new Date().getTime()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('Export Audit Trail สำเร็จ');
  };

  // Action Handlers
  const handleIssue = (e) => {
    e.preventDefault();
    if (!currentUser.isDcc) {
      toast.error('ไม่มีสิทธิ์ดำเนินการ (Requires DCC Admin)');
      return;
    }
    const doc = documents.find(d => d.title === issueDoc && d.status === 'EFFECTIVE');
    if (!doc) {
      toast.error('ไม่พบเอกสารนี้ หรือเอกสารไม่ได้อยู่ในสถานะ EFFECTIVE');
      return;
    }
    
    // Simulate API delay for PDF generation
    const toastId = toast.loading('กำลังสร้าง PDF ควบคุมสำเนา และประทับตรา...');
    setTimeout(() => {
      issueControlledCopy(issueDoc, issueDept);
      setIssueModalOpen(false);
      setIssueDoc('');
      setIssueDept('');
      toast.success('ออกสำเนาสำเร็จ', { id: toastId });
    }, 1500);
  };

  const handleConfirm = (inst) => {
    confirmCcReceipt(inst.id);
    toast.success(`ยืนยันการรับเอกสาร ${inst.ccNumber} สำเร็จ`);
  };

  const handleReport = (e) => {
    e.preventDefault();
    if (!reportReason) {
      toast.error('กรุณาระบุเหตุผล');
      return;
    }
    reportCcDamagedLost(selectedInstance.id, reportType, reportReason);
    setReportModalOpen(false);
    setSelectedInstance(null);
    setReportReason('');
    toast.success(`แจ้งเอกสาร ${reportType === 'LOST' ? 'สูญหาย' : 'ชำรุด'} เรียบร้อยแล้ว (รอการอนุมัติ)`);
  };

  const handleApproveReplacement = (inst) => {
    approveCcReplacement(inst.id);
    toast.success(`อนุมัติคำขอทดแทนสำเร็จ ระบบได้ออกเอกสารควบคุมหมายเลขใหม่และจัดเข้าคิว Pending Receipt แล้ว`);
  };

  const handleRejectReplacement = (inst) => {
    rejectCcReplacement(inst.id);
    toast.error(`ปฏิเสธคำขอทดแทนเอกสาร ${inst.ccNumber} แล้ว`);
  };

  const handleRecall = () => {
    recallControlledCopy(selectedInstance.id);
    setRecallModalOpen(false);
    setSelectedInstance(null);
    toast.success(`บันทึกการรับคืนเอกสาร ${selectedInstance.ccNumber} เรียบร้อยแล้ว`);
  };

  const getStatusBadge = (status) => {
    const badges = {
      ACTIVE: 'bg-emerald-100 text-emerald-700',
      PENDING_RECEIPT: 'bg-amber-100 text-amber-700',
      DAMAGED: 'bg-rose-100 text-rose-700',
      LOST: 'bg-red-100 text-red-700',
      RECALLED: 'bg-slate-100 text-slate-700',
      REPLACEMENT_REQUESTED: 'bg-blue-100 text-blue-700'
    };
    const label = {
      ACTIVE: 'Active',
      PENDING_RECEIPT: 'Pending Receipt',
      DAMAGED: 'Damaged',
      LOST: 'Lost',
      RECALLED: 'Recalled',
      REPLACEMENT_REQUESTED: 'Req Replacement'
    };
    return (
      <span className={`px-4 py-1.5 text-xs font-semibold rounded-full ${badges[status] || 'bg-gray-100 text-gray-700'}`}>
        {label[status] || status}
      </span>
    );
  };

  if (!isAdmin) return null;

  return (
    <div className="space-y-6">
      <style>{`
        @media print {
          body * {
            visibility: hidden;
          }
          #print-area, #print-area * {
            visibility: visible;
          }
          #print-area {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            height: 100%;
            display: flex;
            align-items: center;
            justify-content: center;
          }
          @page {
            size: A4;
            margin: 0;
          }
        }
      `}</style>
      
      {/* Watermark Print Area */}
      {printData && (
        <div id="print-area" className="hidden print:flex flex-col items-center justify-center p-20 min-h-screen relative">
          <div className="absolute inset-0 flex items-center justify-center opacity-30 pointer-events-none select-none z-50 overflow-hidden">
            <div className="transform -rotate-45 text-red-600 font-bold border-[8px] border-red-600 rounded-2xl p-6 px-12 text-center whitespace-nowrap shadow-sm shadow-red-200/50">
              <h1 className="text-6xl tracking-widest uppercase mb-4">CONTROLLED COPY</h1>
              <p className="text-4xl">{printData.department} - {printData.ccNumber}</p>
              <p className="text-2xl mt-2 text-red-400">Issue No: {printData.issueNumber}</p>
              <p className="text-2xl mt-4 font-mono">{new Date().toISOString().split('T')[0]}</p>
            </div>
          </div>
          
          {/* Mock Document Content Behind Watermark */}
          <div className="w-full max-w-4xl bg-white border border-gray-200 p-12 shadow-sm rounded">
             <div className="border-b-2 border-gray-800 pb-4 mb-8 text-center">
                <h1 className="text-2xl font-bold">{printData.docTitle}</h1>
                <h2 className="text-xl text-gray-600 mt-2">{printData.docName}</h2>
             </div>
             <p className="text-gray-500 italic text-center">-- Document Content Placeholder --</p>
          </div>
        </div>
      )}

      {/* HEADER */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold text-gray-900 tracking-tight">ทะเบียนควบคุมสำเนาแจกจ่าย</h2>
          <p className="text-gray-500 mt-1 text-sm font-medium">Controlled Copy Register & Distribution Management</p>
        </div>
      </div>
      
      {/* Quick Stats Summary */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="premium-card bg-white p-5 border-none shadow-sm flex flex-col">
           <div className="flex justify-between items-start mb-2">
              <span className="text-gray-500 text-sm font-semibold">Active Copies</span>
              <FileText className="w-5 h-5 text-emerald-500" />
           </div>
           <span className="text-3xl font-bold text-gray-800">{controlledCopyInstances.filter(i => i.status === 'ACTIVE').length}</span>
        </div>
        <div className="premium-card bg-white p-5 border-none shadow-sm flex flex-col">
           <div className="flex justify-between items-start mb-2">
              <span className="text-gray-500 text-sm font-semibold">Pending Distribution</span>
              <Download className="w-5 h-5 text-indigo-500" />
           </div>
           <span className="text-3xl font-bold text-indigo-700">{controlledCopyInstances.filter(i => i.status === 'PENDING_RECEIPT').length}</span>
        </div>
        <div className="premium-card bg-white p-5 border-none shadow-sm flex flex-col">
           <div className="flex justify-between items-start mb-2">
              <span className="text-gray-500 text-sm font-semibold">Pending Recall</span>
              <RefreshCw className="w-5 h-5 text-orange-500" />
           </div>
           <span className="text-3xl font-bold text-orange-700">{
             controlledCopyInstances.filter(i => {
               if (i.status !== 'ACTIVE') return false;
               const doc = documents.find(d => d.id === i.docId);
               return doc && doc.status === 'SUPERSEDED_ARCHIVED';
             }).length
           }</span>
        </div>
        <div className="premium-card bg-white p-5 border-none shadow-sm flex flex-col">
           <div className="flex justify-between items-start mb-2">
              <span className="text-gray-500 text-sm font-semibold">Replacement Requests</span>
              <AlertTriangle className="w-5 h-5 text-rose-500" />
           </div>
           <span className="text-3xl font-bold text-rose-700">{controlledCopyInstances.filter(i => i.status === 'REPLACEMENT_REQUESTED').length}</span>
        </div>
      </div>

      <div className="bg-white border border-gray-100 rounded-2xl overflow-hidden shadow-xl shadow-gray-200/40">
        
        {/* Tabs */}
        <div className="flex border-b border-gray-100 bg-slate-50/50 px-2 pt-2 gap-2 overflow-x-auto hide-scrollbar">
          {tabs.map(tab => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`relative px-5 py-3 text-sm font-medium transition-all rounded-t-xl group whitespace-nowrap ${
                  isActive ? 'text-indigo-700' : 'text-gray-500 hover:text-gray-800 hover:bg-white/50'
                }`}
              >
                {isActive && (
                  <motion.div
                    layoutId="cc-tab"
                    className="absolute inset-0 bg-white border-t border-x border-gray-100 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.02)] rounded-t-xl z-0"
                    transition={{ type: "spring", stiffness: 300, damping: 30 }}
                  />
                )}
                <span className="relative z-10">{tab.label}</span>
                {isActive && <div className="absolute bottom-[-1px] left-0 right-0 h-[2px] bg-white z-20"></div>}
              </button>
            );
          })}
        </div>

        {activeTab === 'AUDIT_TRAIL' && (
          <div className="border-b border-gray-100 bg-gray-50/50 pb-4">
            <h3 className="text-lg font-bold px-6 pt-6 pb-2 text-gray-800 flex items-center gap-2">
              <Layers className="w-5 h-5 text-indigo-500" /> Audit Trail (ประวัติการดำเนินการ)
            </h3>
            <div className="px-6 py-2 flex flex-col md:flex-row gap-3 items-center justify-between">
              <div className="relative w-full md:w-96">
                <Search className="w-4 h-4 absolute left-3 top-2.5 text-gray-400" />
                <input 
                  type="text"
                  placeholder="Search by Doc No, CC No, User, Action..."
                  value={auditSearchTerm}
                  onChange={(e) => { setAuditSearchTerm(e.target.value); setAuditPage(1); }}
                  className="w-full pl-9 pr-10 py-2 bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-sm shadow-sm"
                />
                {auditSearchTerm && (
                  <button onClick={() => { setAuditSearchTerm(''); setAuditPage(1); }} className="absolute right-3 top-2.5 text-gray-400 hover:text-gray-600 transition-colors">
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
              <button 
                onClick={handleExportCSV}
                className="px-4 py-2 border border-slate-200 text-slate-700 bg-white rounded-lg hover:bg-slate-50 active:scale-[0.97] transition-all flex items-center gap-2 text-sm font-medium shadow-sm"
              >
                <Download className="w-4 h-4" /> Export CSV
              </button>
            </div>
            
            <div className="overflow-x-auto bg-white border-y border-gray-100 mt-2">
              <table className="w-full text-left text-sm text-gray-600">
                <thead className="bg-gray-50 text-gray-500 uppercase border-b border-gray-100">
                  <tr>
                    <th className="px-6 py-3 font-medium">Date & Time</th>
                    <th className="px-6 py-3 font-medium">User</th>
                    <th className="px-6 py-3 font-medium">Action</th>
                    <th className="px-6 py-3 font-medium">Document</th>
                    <th className="px-6 py-3 font-medium">CC No.</th>
                    <th className="px-6 py-3 font-medium">Status Change</th>
                    <th className="px-6 py-3 font-medium">Remarks</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  <AnimatePresence mode="wait">
                    {currentAuditLogs.map((log, idx) => (
                      <motion.tr 
                        key={log.id}
                        initial={{ opacity: 0, y: 5 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0 }}
                        transition={{ delay: idx * 0.03, duration: 0.2 }}
                        className="hover:bg-slate-50/80 transition-colors"
                      >
                        <td className="px-6 py-4 whitespace-nowrap text-xs text-gray-500">{new Date(log.timestamp).toLocaleString()}</td>
                        <td className="px-6 py-4 font-medium text-gray-800">{log.user}</td>
                        <td className="px-6 py-4 text-indigo-600 font-mono text-xs font-bold">{log.action}</td>
                        <td className="px-6 py-4 text-gray-800">{log.docTitle} <span className="text-gray-400">R{log.docRev}</span></td>
                        <td className="px-6 py-4 font-mono font-medium text-gray-800">{log.ccNumber}</td>
                        <td className="px-6 py-4 text-xs">
                          <span className="text-gray-400">{log.oldStatus}</span> &rarr; <span className="font-medium text-gray-700">{log.newStatus}</span>
                        </td>
                        <td className="px-6 py-4 text-xs text-gray-500 max-w-[200px] truncate" title={log.remarks}>{log.remarks || '-'}</td>
                      </motion.tr>
                    ))}
                  </AnimatePresence>
                  {currentAuditLogs.length === 0 && (
                    <tr>
                      <td colSpan="7" className="px-6 py-12 text-center">
                        <div className="text-gray-300 mb-2 flex justify-center"><Layers className="w-10 h-10" /></div>
                        <p className="text-gray-400 font-medium">ไม่มีประวัติการดำเนินการ</p>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
              {totalAuditPages > 1 && (
                <div className="px-6 py-4 border-t border-gray-100 flex items-center justify-between">
                  <span className="text-sm text-gray-500">
                    Showing {(auditPage - 1) * auditItemsPerPage + 1} to {Math.min(auditPage * auditItemsPerPage, filteredAuditLogs.length)} of {filteredAuditLogs.length} entries
                  </span>
                  <div className="flex gap-2">
                    <button 
                      onClick={() => setAuditPage(p => Math.max(1, p - 1))}
                      disabled={auditPage === 1}
                      className="p-1.5 rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                    >
                      <ChevronLeft className="w-5 h-5" />
                    </button>
                    <button 
                      onClick={() => setAuditPage(p => Math.min(totalAuditPages, p + 1))}
                      disabled={auditPage === totalAuditPages}
                      className="p-1.5 rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                    >
                      <ChevronRight className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Register Area */}
        {activeTab !== 'AUDIT_TRAIL' && (
          <>
            {/* Register Filter Bar */}
            <div className="p-5 flex flex-col md:flex-row items-center justify-between bg-white border-b border-gray-100 gap-4">
              {activeTab === 'HISTORY' ? (
                <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2"><Layers className="w-5 h-5 text-indigo-500"/> Controlled Copy Registry</h3>
              ) : (
                <div />
              )}
          <div className="relative w-full md:w-96">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-gray-400" />
            <input 
              type="text"
              placeholder="Search by Document No, CC Number, Dept..."
              value={searchTerm}
              onChange={(e) => { setSearchTerm(e.target.value); setRegisterPage(1); }}
              className="w-full pl-9 pr-10 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-sm"
            />
            {searchTerm && (
              <button onClick={() => { setSearchTerm(''); setRegisterPage(1); }} className="absolute right-3 top-2.5 text-gray-400 hover:text-gray-600 transition-colors">
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* Register Table */}
        <div className="overflow-x-auto bg-white">
          <table className="w-full text-left text-sm text-gray-600">
            <thead className="bg-gray-50/80 text-gray-500 uppercase border-b border-gray-100">
              <tr>
                <th className="px-6 py-3 font-medium">Document / Rev</th>
                <th className="px-6 py-3 font-medium">CC Number</th>
                <th className="px-6 py-3 font-medium">Department</th>
                <th className="px-6 py-3 font-medium text-center">Issue No.</th>
                <th className="px-6 py-3 font-medium">Status</th>
                <th className="px-6 py-3 font-medium text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              <AnimatePresence>
                {currentRegisterInstances.map((inst, idx) => {
                  const doc = documents.find(d => d.id === inst.docId);
                  const isSuperseded = doc && doc.status === 'SUPERSEDED_ARCHIVED';
                  const needsRecall = isSuperseded && inst.status === 'ACTIVE';

                  return (
                    <motion.tr 
                      key={inst.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      transition={{ delay: idx * 0.05 }}
                      className="hover:bg-slate-50/80 transition-colors group"
                    >
                      <td className="px-6 py-4">
                        <div className="font-medium text-indigo-700">{inst.docTitle} <span className="text-gray-400 font-normal">R{inst.rev}</span></div>
                        <div className="text-xs text-gray-500 truncate max-w-[200px]" title={inst.docName}>{inst.docName}</div>
                        {activeTab === 'ACTION_REQUIRED' && inst.status === 'REPLACEMENT_REQUESTED' && (
                          <div className="mt-2 text-xs text-amber-700 bg-amber-50 p-1.5 rounded border border-amber-100">
                            <strong>Requested by:</strong> {inst.reportRequesterName || 'Unknown'} <br/>
                            <strong>Reason:</strong> {inst.reportReason || '-'}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 font-mono font-medium text-gray-800">{inst.ccNumber}</td>
                      <td className="px-6 py-4">
                        <div className="font-medium text-gray-800">{inst.department}</div>
                      </td>
                      <td className="px-6 py-4 text-center font-medium text-gray-600">{inst.issueNumber}</td>
                      <td className="px-6 py-4">
                        <div className="flex flex-col items-start gap-1">
                          {getStatusBadge(inst.status)}
                          {needsRecall && <span className="text-[10px] font-medium text-red-500 bg-red-50 px-1.5 py-0.5 rounded border border-red-100 flex items-center gap-1"><AlertTriangle className="w-3 h-3"/> RECALL REQUIRED</span>}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <div className="flex justify-center gap-2 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
                          
                          {inst.status === 'PENDING_RECEIPT' && currentUser.isDcc && (
                            <button 
                              onClick={() => handlePrintAndDistribute(inst)}
                              className="px-2 py-1 text-xs font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md flex items-center gap-1 transition-colors shadow-sm shadow-blue-200"
                              title="Print & Distribute"
                            >
                              <Download className="w-3 h-3" /> Distribute
                            </button>
                          )}
                          
                          {inst.status === 'ACTIVE' && currentUser.isDcc && !needsRecall && (
                            <button 
                              onClick={() => { setSelectedInstance(inst); setReportModalOpen(true); }}
                              className="p-1.5 text-rose-600 bg-rose-50 hover:bg-rose-100 rounded-md transition-colors"
                              title="Report Damaged / Lost"
                            >
                              <AlertTriangle className="w-4 h-4" />
                            </button>
                          )}

                          {needsRecall && currentUser.isDcc && (
                            <button 
                              onClick={() => { setSelectedInstance(inst); setRecallModalOpen(true); }}
                              className="px-2 py-1 text-xs font-medium text-white bg-red-500 hover:bg-red-600 rounded flex items-center gap-1 transition-colors shadow-sm shadow-red-200"
                            >
                              <RefreshCw className="w-3 h-3" /> Return
                            </button>
                          )}

                          {inst.status === 'REPLACEMENT_REQUESTED' && currentUser.isDcc && (
                            <div className="flex gap-2">
                              <span className="text-xs font-medium text-amber-600 bg-amber-50 px-2 py-1 rounded">
                                Waiting for Manager Approval
                              </span>
                            </div>
                          )}

                          {inst.status === 'RECALLED' && (
                            <span className="text-xs text-gray-400 italic">Archived</span>
                          )}
                        </div>
                      </td>
                    </motion.tr>
                  );
                })}
              </AnimatePresence>
              {currentRegisterInstances.length === 0 && (
                <tr>
                  <td colSpan="6" className="px-6 py-12 text-center">
                    <div className="text-gray-300 mb-2 flex justify-center"><Layers className="w-10 h-10" /></div>
                    <p className="text-gray-400 font-medium">ไม่มีข้อมูลสำเนาในหมวดหมู่นี้</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
          
          {/* Main Register Pagination */}
          {totalRegisterPages > 1 && (
            <div className="px-6 py-4 border-t border-gray-100 flex items-center justify-between">
              <span className="text-sm text-gray-500">
                Showing {(registerPage - 1) * registerItemsPerPage + 1} to {Math.min(registerPage * registerItemsPerPage, filteredInstances.length)} of {filteredInstances.length} entries
              </span>
              <div className="flex gap-2">
                <button 
                  onClick={() => setRegisterPage(p => Math.max(1, p - 1))}
                  disabled={registerPage === 1}
                  className="p-1.5 rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <button 
                  onClick={() => setRegisterPage(p => Math.min(totalRegisterPages, p + 1))}
                  disabled={registerPage === totalRegisterPages}
                  className="p-1.5 rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
              </div>
            </div>
          )}
        </div>
          </>
        )}
      </div>

      {/* ISSUE MODAL */}
      <AnimatePresence>
        {issueModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden border border-gray-200"
            >
              <div className="px-6 py-4 border-b border-gray-100 bg-gray-50/50 flex justify-between items-center">
                <h3 className="font-semibold text-gray-800  flex items-center gap-2"><FileDown className="w-5 h-5 text-indigo-600 "/> Issue Controlled Copy</h3>
                <button onClick={() => setIssueModalOpen(false)} className="text-gray-400  hover:text-gray-600 ">&times;</button>
              </div>
              <form onSubmit={handleIssue} className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700  mb-1">รหัสเอกสาร (Doc No) <span className="text-red-500 ">*</span></label>
                  <input type="text" required placeholder="e.g. WI-PD-001" value={issueDoc} onChange={e => setIssueDoc(e.target.value)} className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500" />
                  <p className="text-xs text-gray-400  mt-1">ต้องเป็นเอกสารที่ประกาศใช้ (EFFECTIVE) แล้วเท่านั้น</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700  mb-1">แผนกที่แจกจ่าย (Department) <span className="text-red-500 ">*</span></label>
                  <input type="text" required placeholder="e.g. QA" value={issueDept} onChange={e => setIssueDept(e.target.value)} className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500" />
                </div>
                <div className="pt-4 flex justify-end gap-3">
                  <button type="button" onClick={() => setIssueModalOpen(false)} className="px-4 py-2 btn-ios-secondary text-gray-500"><X className="w-4 h-4" /> Cancel</button>
                  <button type="submit" className="px-4 py-2 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 active:scale-[0.97] transition-all shadow-sm shadow-indigo-200">Issue & Print PDF</button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* REPORT DAMAGED/LOST MODAL */}
      <AnimatePresence>
        {reportModalOpen && selectedInstance && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden border border-gray-200"
            >
              <div className="px-6 py-4 border-b border-gray-100 bg-rose-50/50 flex justify-between items-center">
                <h3 className="font-semibold text-rose-800 flex items-center gap-2"><AlertTriangle className="w-5 h-5"/> Report Document</h3>
                <button onClick={() => { setReportModalOpen(false); setSelectedInstance(null); }} className="text-gray-400  hover:text-gray-600 ">&times;</button>
              </div>
              <form onSubmit={handleReport} className="p-6 space-y-4">
                <div className="p-3 bg-gray-50 rounded-lg text-sm text-gray-600  mb-4 border border-gray-100">
                  แจ้งชำรุด/สูญหาย สำหรับเอกสาร <strong>{selectedInstance.ccNumber}</strong> ({selectedInstance.docTitle}) ของแผนก <strong>{selectedInstance.department}</strong>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700  mb-1">ประเภทการแจ้ง <span className="text-red-500 ">*</span></label>
                  <select value={reportType} onChange={e => setReportType(e.target.value)} className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500">
                    <option value="DAMAGED">เอกสารชำรุด (Damaged)</option>
                    <option value="LOST">เอกสารสูญหาย (Lost)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700  mb-1">เหตุผล / รายละเอียด <span className="text-red-500 ">*</span></label>
                  <textarea required rows={3} placeholder="ระบุสาเหตุ..." value={reportReason} onChange={e => setReportReason(e.target.value)} className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500" />
                </div>
                <p className="text-xs text-rose-500">ระบบจะยกเลิกฉบับเดิม และเตรียมออก Issue ถัดไปอัตโนมัติภายใต้ CC Number เดิม</p>
                <div className="pt-2 flex justify-end gap-3">
                  <button type="button" onClick={() => { setReportModalOpen(false); setSelectedInstance(null); }} className="px-4 py-2 btn-ios-secondary text-gray-500"><X className="w-4 h-4" /> Cancel</button>
                  <button type="submit" className="px-4 py-2 bg-rose-600 text-white rounded-xl hover:bg-rose-700 active:scale-[0.97] transition-all shadow-sm shadow-rose-200">Confirm Report</button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* RECALL MODAL */}
      <AnimatePresence>
        {recallModalOpen && selectedInstance && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="bg-white rounded-2xl shadow-xl w-full max-w-sm overflow-hidden border border-gray-200"
            >
              <div className="px-6 py-4 border-b border-gray-100 bg-red-50/50 flex justify-between items-center">
                <h3 className="font-semibold text-red-800 flex items-center gap-2"><RefreshCw className="w-5 h-5"/> Confirm Return</h3>
                <button onClick={() => { setRecallModalOpen(false); setSelectedInstance(null); }} className="text-gray-400  hover:text-gray-600 ">&times;</button>
              </div>
              <div className="p-6 space-y-4 text-center">
                <p className="text-gray-700 ">คุณได้รับเอกสาร <strong>{selectedInstance.ccNumber}</strong> คืนจากแผนก <strong>{selectedInstance.department}</strong> แล้วใช่หรือไม่?</p>
                <div className="pt-4 flex justify-center gap-3">
                  <button type="button" onClick={() => { setRecallModalOpen(false); setSelectedInstance(null); }} className="px-4 py-2 btn-ios-secondary text-gray-500"><X className="w-4 h-4" /> Cancel</button>
                  <button onClick={handleRecall} className="px-4 py-2 bg-red-600 text-white rounded-xl hover:bg-red-700 active:scale-[0.97] transition-all shadow-sm shadow-red-200">Confirm Return</button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
};

export default ControlledCopyRegister;
