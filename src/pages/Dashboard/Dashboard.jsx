import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import useStore from '../../store/useStore';
import { 
  AlertCircle, Clock, CheckCircle, FileText, Activity, 
  Search, Plus, FileEdit, Library, BarChart3, TrendingUp, Briefcase,
  FilterX, Trash2, Edit, ClipboardCheck, Eye, Download, ShieldAlert, AlertTriangle, ChevronRight
} from 'lucide-react';
import toast from 'react-hot-toast';
import EmptyState from '../../components/EmptyState';

const Dashboard = () => {
  const navigate = useNavigate();
  const { 
    currentUser, 
    tasks, 
    dars, 
    documents,
    controlledCopyInstances,
    masterUsers, 
    requestUsers, 
    reviewUsers, 
    approveUsers,
    simulatedDate,
    simulateNextDay,
    deleteDar
  } = useStore();
  
  // States for Search & Filter
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('');
  const [activeCardFilter, setActiveCardFilter] = useState('');
  const [activeOverviewTab, setActiveOverviewTab] = useState('ALL_REQUESTS'); // Tabs for System Overview

  // Animation Variants
  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.05, delayChildren: 0.1 }
    }
  };
  const itemVariants = {
    hidden: { opacity: 0, y: 15 },
    show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 300, damping: 24 } }
  };

  // Identify roles for current user
  const isRequester = requestUsers.some(u => u.id === currentUser.id);
  const isReviewer = reviewUsers.some(u => u.id === currentUser.id);
  const isApprover = approveUsers.some(u => u.id === currentUser.id);
  const isAdmin = currentUser.isDcc || currentUser.role === 'DCC_ADMIN' || currentUser.id === 'u5' || currentUser.id === 'U001';

  const handleExportControlledCopies = async () => {
    try {
      const response = await fetch('/api/reports/controlled-copies');
      if (!response.ok) throw new Error('Network response was not ok');
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Controlled_Copies_Report_${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      toast.success('ดาวน์โหลดรายงาน Controlled Copies สำเร็จ');
    } catch (error) {
      console.error('Export error:', error);
      toast.error('ไม่สามารถดาวน์โหลดรายงานได้ (Mock Backend Only)');
    }
  };

  const handleExportRecalls = async () => {
    try {
      const response = await fetch('/api/reports/recalls');
      if (!response.ok) throw new Error('Network response was not ok');
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Outstanding_Recalls_Report_${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      toast.success('ดาวน์โหลดรายงาน Recalls สำเร็จ');
    } catch (error) {
      console.error('Export error:', error);
      toast.error('ไม่สามารถดาวน์โหลดรายงานได้ (Mock Backend Only)');
    }
  };

  // 1. Calculate Stats (Split into Group 1 and Group 2)
  const isMyTask = (t) => t.assigneeId === currentUser.id || 
    (t.currentHandlerDepartment === currentUser.department && Number(t.currentHandlerLevel) === Number(currentUser.level)) ||
    (t.assignedToRole === 'DCC_ADMIN' && isAdmin);
  const myTasks = tasks.filter(t => isMyTask(t));

  // --- Group 1: My Requests Tracking (Requester View) ---
  const myDraftCount = isAdmin 
    ? dars.filter(d => d.status === 'DRAFT').length
    : dars.filter(d => d.status === 'DRAFT' && d.requesterId === currentUser.id).length;
    
  const myInProgressCount = isAdmin
    ? dars.filter(d => ['UNDER_REVIEW', 'PENDING_APPROVAL'].includes(d.status)).length
    : dars.filter(d => ['UNDER_REVIEW', 'PENDING_APPROVAL'].includes(d.status) && d.requesterId === currentUser.id).length;

  const myReturnedCount = isAdmin
    ? dars.filter(d => d.status === 'RETURNED_FOR_REVISION').length
    : dars.filter(d => d.status === 'RETURNED_FOR_REVISION' && d.requesterId === currentUser.id).length;

  const myWaitingCount = isAdmin
    ? dars.filter(d => ['WAITING_EFFECTIVE', 'APPROVED_WAITING_EFFECTIVE', 'WAITING_ACKNOWLEDGEMENT'].includes(d.status)).length
    : dars.filter(d => ['WAITING_EFFECTIVE', 'APPROVED_WAITING_EFFECTIVE', 'WAITING_ACKNOWLEDGEMENT'].includes(d.status) && d.requesterId === currentUser.id).length;

  const myCancelledCount = isAdmin
    ? dars.filter(d => d.status === 'CANCELLED_OVERDUE').length
    : dars.filter(d => d.status === 'CANCELLED_OVERDUE' && d.requesterId === currentUser.id).length;

  // DCC Admin Metrics
  const pendingPrintCount = (controlledCopyInstances || []).filter(i => i.status === 'PENDING_RECEIPT').length;
  const pendingRecallCount = (controlledCopyInstances || []).filter(i => {
    if (i.status !== 'ACTIVE') return false;
    const doc = documents.find(d => d.id === i.docId);
    return doc && doc.status === 'SUPERSEDED_ARCHIVED';
  }).length;
  const replacementRequestCount = (controlledCopyInstances || []).filter(i => i.status === 'REPLACEMENT_REQUESTED').length;

  // --- Group 2: Action Required (Handler View) ---
  const actionReviewTasks = tasks.filter(t => t.type === 'Review' && isMyTask(t));
  const actionReviewCount = isAdmin ? dars.filter(d => d.status === 'UNDER_REVIEW').length : actionReviewTasks.length;

  const actionApproveTasks = tasks.filter(t => (t.type === 'Approve' || t.type === 'CC_REPLACEMENT_APPROVAL') && isMyTask(t));
  const actionApproveCount = isAdmin ? dars.filter(d => d.status === 'PENDING_APPROVAL').length + tasks.filter(t => t.type === 'CC_REPLACEMENT_APPROVAL').length : actionApproveTasks.length;

  const actionAckTasks = tasks.filter(t => t.type === 'Acknowledge' && isMyTask(t));
  const actionReplacementTasks = tasks.filter(t => t.type === 'DCC_REPLACEMENT' && isMyTask(t));
  const actionDueSoonCount = isAdmin ? tasks.filter(t => t.status === 'DUE_SOON').length : myTasks.filter(t => t.status === 'DUE_SOON').length;
  const actionOverdueCount = isAdmin ? tasks.filter(t => t.status === 'OVERDUE').length : myTasks.filter(t => t.status === 'OVERDUE').length;
  
  const dccPendingCount = isAdmin ? dars.filter(d => d.status === 'APPROVED_WAITING_EFFECTIVE').length : 0;

  // 2. Build Recent DARs Table Data
  let recentDars = dars.filter(d => 
    d.requesterId === currentUser.id || 
    myTasks.some(t => t.darId === d.id) || 
    (isAdmin) 
  );

  // Apply Filters
  if (searchTerm) {
    const term = searchTerm.toLowerCase();
    recentDars = recentDars.filter(d => d.id.toLowerCase().includes(term) || d.title.toLowerCase().includes(term));
  }
  
  if (activeCardFilter) {
    if (activeCardFilter === 'MY_DRAFT') {
      recentDars = recentDars.filter(d => d.status === 'DRAFT' && (isAdmin || d.requesterId === currentUser.id));
    } else if (activeCardFilter === 'MY_IN_PROGRESS') {
      recentDars = recentDars.filter(d => ['UNDER_REVIEW', 'PENDING_APPROVAL'].includes(d.status) && (isAdmin || d.requesterId === currentUser.id));
    } else if (activeCardFilter === 'MY_RETURNED') {
      recentDars = recentDars.filter(d => d.status === 'RETURNED_FOR_REVISION' && (isAdmin || d.requesterId === currentUser.id));
    } else if (activeCardFilter === 'MY_WAITING') {
      recentDars = recentDars.filter(d => ['WAITING_EFFECTIVE', 'APPROVED_WAITING_EFFECTIVE', 'WAITING_ACKNOWLEDGEMENT'].includes(d.status) && (isAdmin || d.requesterId === currentUser.id));
    } else if (activeCardFilter === 'MY_CANCELLED') {
      recentDars = recentDars.filter(d => d.status === 'CANCELLED_OVERDUE' && (isAdmin || d.requesterId === currentUser.id));
    } else if (activeCardFilter === 'ACTION_REVIEW') {
      const matchingDarIds = isAdmin ? dars.filter(d => d.status === 'UNDER_REVIEW').map(d => d.id) : actionReviewTasks.map(t => t.darId);
      recentDars = recentDars.filter(d => matchingDarIds.includes(d.id));
    } else if (activeCardFilter === 'ACTION_APPROVE') {
      const matchingDarIds = isAdmin ? dars.filter(d => d.status === 'PENDING_APPROVAL').map(d => d.id) : actionApproveTasks.map(t => t.darId);
      recentDars = recentDars.filter(d => matchingDarIds.includes(d.id));
    } else if (activeCardFilter === 'ACTION_DUE_SOON') {
      const matchingDarIds = isAdmin ? tasks.filter(t => t.status === 'DUE_SOON').map(t => t.darId) : myTasks.filter(t => t.status === 'DUE_SOON').map(t => t.darId);
      recentDars = recentDars.filter(d => matchingDarIds.includes(d.id));
    } else if (activeCardFilter === 'ACTION_OVERDUE') {
      const matchingDarIds = isAdmin ? tasks.filter(t => t.status === 'OVERDUE').map(t => t.darId) : myTasks.filter(t => t.status === 'OVERDUE').map(t => t.darId);
      recentDars = recentDars.filter(d => matchingDarIds.includes(d.id));
    } else if (activeCardFilter === 'DCC_PENDING') {
      recentDars = recentDars.filter(d => d.status === 'APPROVED_WAITING_EFFECTIVE');
    }
  }

  // Inject CC_REPLACEMENT_APPROVAL tasks into the table if viewing ALL or ACTION_APPROVE
  if (!activeCardFilter || activeCardFilter === 'ACTION_APPROVE') {
    const replacementTasks = tasks.filter(t => t.type === 'CC_REPLACEMENT_APPROVAL' && isMyTask(t));
    const formattedReplacements = replacementTasks.map(t => {
      const inst = controlledCopyInstances.find(i => i.id === t.instanceId);
      return {
        isTask: true,
        id: inst ? inst.ccNumber : t.id,
        taskId: t.id,
        title: t.title,
        type: 'REPLACEMENT',
        department: inst ? inst.department : '',
        status: t.status,
        date: t.dueDate,
        requesterId: inst ? inst.reportRequesterId : ''
      };
    });
    
    let validMocks = formattedReplacements;
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      validMocks = validMocks.filter(d => d.id.toLowerCase().includes(term) || d.title.toLowerCase().includes(term));
    }
    recentDars = [...recentDars, ...validMocks];
  }

  // Calculate dynamic options based on current filtered state BEFORE applying `filterType`
  const availableDarTypes = [...new Set(recentDars.map(d => d.type))].filter(Boolean).sort();

  if (filterType) {
    recentDars = recentDars.filter(d => d.type === filterType);
  }
  // Calculate Bottlenecks for Admin DCC
  let bottleneckData = [];
  if (isAdmin) {
    const backlogDars = dars.filter(d => ['UNDER_REVIEW', 'PENDING_APPROVAL', 'WAITING_EFFECTIVE', 'WAITING_ACKNOWLEDGEMENT'].includes(d.status));
    const deptCounts = {};
    backlogDars.forEach(d => {
      deptCounts[d.department] = (deptCounts[d.department] || 0) + 1;
    });
    bottleneckData = Object.keys(deptCounts)
      .map(dept => ({ dept, count: deptCounts[dept] }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 3); // top 3
  }

  // Sort by date 
  recentDars.sort((a, b) => new Date(b.date) - new Date(a.date));
  recentDars = recentDars.slice(0, 10); // Take top 10

  const getCurrentHandler = (dar) => {
    if (dar.status === 'DRAFT') {
      const user = masterUsers.find(u => u.id === dar.requesterId);
      return <span className="text-gray-600  font-medium">{user ? user.name : dar.requesterId} (Requester)</span>;
    } else if (dar.status === 'APPROVED_WAITING_EFFECTIVE' || dar.status === 'WAITING_EFFECTIVE') {
      return <span className="text-gray-400 font-medium">-</span>;
    } else if (dar.status === 'UNDER_REVIEW' || dar.status === 'PENDING_APPROVAL' || dar.status === 'WAITING_ACKNOWLEDGEMENT') {
      const activeTasks = tasks.filter(t => t.darId === dar.id);
      if (activeTasks.length > 0) {
        const handlerNames = activeTasks.map(t => {
           const user = masterUsers.find(u => u.id === t.assigneeId);
           const role = t.type === 'Review' ? 'Reviewer' : t.type === 'Approve' ? 'Approver' : 'Ack';
           return user ? `${user.name} (${role})` : t.assigneeId;
        });
        return <span className="text-blue-700  font-medium">{handlerNames.join(', ')}</span>;
      }
      return '-';
    } else if (dar.status === 'RETURNED_FOR_REVISION') {
      const user = masterUsers.find(u => u.id === dar.requesterId);
      return <span className="text-red-600  font-medium flex items-center gap-1">{user ? user.name : dar.requesterId} (Requester - แก้ไข)</span>;
    }
    return '-';
  };

  const renderActionButtons = (dar) => {
    if (dar.isTask) {
      return (
        <button 
          onClick={() => navigate(`/tasks/approve-replacement/${dar.taskId}`)}
          className="p-1.5 text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors flex items-center justify-center border border-blue-200"
          title="ดำเนินการ (Evaluate)"
        >
          <ClipboardCheck className="w-4 h-4" />
        </button>
      );
    }
    
    const isRequesterOfDar = dar.requesterId === currentUser.id;
    // Check if user has an active task for this DAR
    const activeTask = tasks.find(t => t.darId === dar.id && isMyTask(t));
    
    // Condition D: Draft
    if (dar.status === 'DRAFT' && isRequesterOfDar) {
      return (
        <div className="flex items-center gap-1">
          <button 
            onClick={() => {
              const basePath = dar.type === 'NEW' ? '/dar/new/document' : 
                              dar.type === 'REVISION' ? '/dar/new/revision' : '/dar/new/obsolete';
              navigate(`${basePath}?draftId=${dar.id}`);
            }}
            className="p-1.5 text-blue-600  hover:text-blue-700  hover:bg-blue-50 rounded-lg transition-colors flex items-center justify-center border border-transparent hover:border-blue-200"
            title="ดำเนินการต่อ (Resume)"
          >
            <Edit className="w-4 h-4" />
          </button>
          <button 
            onClick={() => {
              if (window.confirm('คุณต้องการลบแบบร่างนี้ทิ้งใช่หรือไม่?')) {
                deleteDar(dar.id);
              }
            }}
            className="p-1.5 text-gray-400  hover:text-red-600  hover:bg-red-50 rounded-lg transition-colors flex items-center justify-center border border-transparent hover:border-red-200"
            title="ลบทิ้ง (Discard)"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      );
    }
    
    // Condition A: Action Required
    if (activeTask) {
      const taskRoute = activeTask.type === 'Review' ? `/tasks/review/${activeTask.id}` : 
                        activeTask.type === 'Approve' ? `/tasks/approve/${activeTask.id}` : `/tasks/ack/${activeTask.id}`;
      return (
        <button 
          onClick={() => navigate(taskRoute)}
          className="p-1.5 text-blue-600  bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors flex items-center justify-center border border-blue-200"
          title="ดำเนินการ (Evaluate)"
        >
          <ClipboardCheck className="w-4 h-4" />
        </button>
      );
    }

    if (isAdmin && (dar.status === 'APPROVED_WAITING_EFFECTIVE' || dar.status === 'WAITING_EFFECTIVE')) {
      return (
        <button 
          onClick={() => navigate(`/tasks`)}
          className="p-1.5 text-purple-600  bg-purple-50 hover:bg-purple-100 rounded-lg transition-colors flex items-center justify-center border border-purple-200"
          title="ดำเนินการ (Evaluate DCC)"
        >
          <ClipboardCheck className="w-4 h-4" />
        </button>
      );
    }

    // Condition B: Returned for Revision
    if (dar.status === 'RETURNED_FOR_REVISION' && isRequesterOfDar) {
      return (
        <button 
          onClick={() => navigate(`/tasks/revise/${dar.id}`)}
          className="p-1.5 text-orange-600  hover:text-orange-700  bg-orange-50 hover:bg-orange-100 rounded-lg transition-colors flex items-center justify-center border border-orange-200"
          title="แก้ไขคำขอ (Edit)"
        >
          <Edit className="w-4 h-4" />
        </button>
      );
    }

    // Condition C: Read-only Tracking (Default for all other states)
    return (
      <button 
        onClick={() => navigate(`/dar/${dar.id}`)}
        className="p-1.5 text-gray-500  hover:text-gray-700  hover:bg-gray-100 rounded-lg transition-colors flex items-center justify-center border border-transparent hover:border-gray-300"
        title="ดูรายละเอียด (View Details)"
      >
        <Eye className="w-4 h-4" />
      </button>
    );
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'DRAFT': return <span className="px-2 py-1 bg-gray-100 text-gray-700  rounded-full text-xs font-medium">Draft</span>;
      case 'UNDER_REVIEW': return <span className="px-2 py-1 bg-blue-100 text-blue-700  rounded-full text-xs font-medium">Under Review</span>;
      case 'PENDING_APPROVAL': return <span className="px-2 py-1 bg-yellow-100 text-yellow-700  rounded-full text-xs font-medium">Pending Approval</span>;
      case 'CANCELLED': return <span className="px-2 py-1 bg-red-100 text-red-700  rounded-full text-xs font-medium">Cancelled</span>;
      case 'CANCELLED_OVERDUE': return <span className="px-2 py-1 bg-red-100 text-red-700  rounded-full text-xs font-medium">Cancelled (Overdue)</span>;
      case 'RETURNED_FOR_REVISION': return <span className="px-2 py-1 bg-orange-100 text-orange-700  rounded-full text-xs font-medium">Returned</span>;
      case 'EFFECTIVE': return <span className="px-2 py-1 bg-green-100 text-green-700  rounded-full text-xs font-medium">Effective</span>;
      case 'OBSOLETE': return <span className="px-2 py-1 bg-gray-100 text-gray-700  rounded-full text-xs font-medium">Obsolete</span>;
      default: return <span className="px-2 py-1 bg-green-100 text-green-700  rounded-full text-xs font-medium">{status.replace(/_/g, ' ')}</span>;
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.32, 0.72, 0, 1] }}
      className="space-y-6"
    >

      {/* Section 1: Context Indicator & Header */}
      <div className="premium-card p-8 border-none">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold text-gray-800 ">ยินดีต้อนรับ, {currentUser.name.split(' ')[0]}</h2>
            <div className="mt-2 inline-flex items-center gap-2 px-3 py-1.5 bg-blue-50 text-blue-700  rounded-lg text-sm font-medium border border-blue-100  ">
              <Briefcase className="w-4 h-4" />
              <span>คุณกำลังดูข้อมูลในบทบาท: {currentUser.position} | แผนก: {currentUser.department}</span>
            </div>
            {isAdmin && (
              <div className="mt-2 ml-3 inline-flex items-center gap-2 px-3 py-1.5 bg-orange-50 text-orange-700  rounded-lg text-sm font-medium border border-orange-100  ">
                <Clock className="w-4 h-4" />
                <span>Simulated Date: {simulatedDate}</span>
              </div>
            )}
          </div>
          
          {/* Section 3: Dynamic Quick Actions Area */}
          <div className="flex flex-wrap gap-3">
            {isAdmin ? (
              <>
                <button onClick={() => navigate('/master-list')} className="flex items-center gap-2 px-4 py-2 btn-ios-primary transition-all duration-300 ease-fluid active:scale-[0.97] text-sm">
                  <Library className="w-4 h-4" /> DCC Master Registry
                </button>
                <button onClick={simulateNextDay} className="flex items-center gap-2 px-4 py-2 bg-orange-500 hover:bg-orange-600 rounded-xl text-white font-medium transition-transform duration-300 active:scale-95 text-sm">
                  <Clock className="w-4 h-4" /> Simulate Next Day
                </button>
                <button onClick={() => navigate('/controlled-copy?tab=ACTION_REQUIRED')} className="flex items-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-gray-700 rounded-xl font-medium text-sm transition-transform duration-300 active:scale-95 border border-slate-200">
                  จัดการทั้งหมด <ChevronRight className="w-4 h-4" /> Document Distribution Log
                </button>
              </>
            ) : currentUser.level <= 3 ? (
              <>
                <button onClick={() => navigate('/dar/new')} className="flex items-center gap-2 px-4 py-2 btn-ios-primary transition-all duration-300 ease-fluid active:scale-[0.97] text-sm">
                  <Plus className="w-4 h-4" /> สร้างเอกสารใหม่ (Draft)
                </button>
                <button onClick={() => navigate('/dar/new/revision')} className="flex items-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-blue-700 rounded-xl font-medium text-sm transition-transform duration-300 active:scale-95 border border-slate-200">
                  <FileEdit className="w-4 h-4" /> ขอแก้ไขเอกสาร (Revision)
                </button>
              </>
            ) : (
              <>
                <button onClick={() => navigate('/tasks')} className="flex items-center gap-2 px-4 py-2 btn-ios-primary transition-all duration-300 ease-fluid active:scale-[0.97] text-sm">
                  <Activity className="w-4 h-4" /> ตรวจสอบคิวงาน (Task Inbox)
                </button>
                <button onClick={() => navigate('/library')} className="flex items-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-gray-700 rounded-xl font-medium text-sm transition-transform duration-300 active:scale-95 border border-slate-200">
                  <Library className="w-4 h-4" /> ดูคลังเอกสารแผนก
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Section 2: System Overview (Tabs & Compact Grid) */}
      <motion.div variants={containerVariants} initial="hidden" animate="show" className="space-y-4">
        
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200/50 pb-2">
          <div className="flex space-x-4">
            <button
              onClick={() => { setActiveOverviewTab('ALL_REQUESTS'); setActiveCardFilter(''); }}
              className={`pb-2 px-1 text-sm font-bold transition-all relative ${activeOverviewTab === 'ALL_REQUESTS' ? 'text-blue-600' : 'text-slate-500 hover:text-slate-700'}`}
            >
              <span className="flex items-center gap-2"><Briefcase className="w-4 h-4" /> {isAdmin ? "สถานะการขออนุมัติทั้งหมด (All Requests)" : "คำขอของฉัน (My Requests)"}</span>
              {activeOverviewTab === 'ALL_REQUESTS' && <motion.div layoutId="activeTab" className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600 rounded-t-md" />}
            </button>
            <button
              onClick={() => { setActiveOverviewTab('ACTION_REQUIRED'); setActiveCardFilter(''); }}
              className={`pb-2 px-1 text-sm font-bold transition-all relative ${currentUser.level <= 3 && !isAdmin ? 'opacity-50 cursor-not-allowed' : ''} ${activeOverviewTab === 'ACTION_REQUIRED' ? 'text-indigo-600' : 'text-slate-500 hover:text-slate-700'}`}
              disabled={currentUser.level <= 3 && !isAdmin}
            >
              <span className="flex items-center gap-2">
                <Activity className="w-4 h-4" /> งานที่ต้องจัดการ (Action Required)
                {myTasks.length > 0 && (
                  <span className="bg-red-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow-sm ml-1 animate-pulse">
                    {myTasks.length}
                  </span>
                )}
              </span>
              {activeOverviewTab === 'ACTION_REQUIRED' && <motion.div layoutId="activeTab" className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-600 rounded-t-md" />}
            </button>
          </div>
        </div>

        {activeOverviewTab === 'ALL_REQUESTS' && (
          <motion.div variants={containerVariants} initial="hidden" animate="show" className="grid grid-cols-2 md:grid-cols-5 gap-3">
            {/* Draft */}
            <motion.div variants={itemVariants} onClick={() => setActiveCardFilter(activeCardFilter === 'MY_DRAFT' ? '' : 'MY_DRAFT')} className={`p-6 flex flex-col justify-between h-full border-none jelly-interactive ${activeCardFilter === 'MY_DRAFT' ? 'premium-card ring-2 ring-gray-300 bg-gray-50' : 'premium-card bg-white'}`}>
              <div className="flex items-center justify-between mb-1">
                <h3 className="text-sm font-semibold text-gray-500">Draft (ร่าง)</h3>
              </div>
              <span className="text-3xl font-bold text-gray-800">{myDraftCount}</span>
            </motion.div>
            
            {/* In Progress */}
            <motion.div variants={itemVariants} onClick={() => setActiveCardFilter(activeCardFilter === 'MY_IN_PROGRESS' ? '' : 'MY_IN_PROGRESS')} className={`p-6 flex flex-col justify-between h-full border-none jelly-interactive ${activeCardFilter === 'MY_IN_PROGRESS' ? 'premium-card ring-2 ring-blue-300 bg-blue-50' : 'premium-card bg-white'}`}>
              <div className="flex justify-between items-start mb-1">
                <p className="text-sm text-blue-600 font-semibold">{isAdmin ? 'In Progress (รวม)' : 'In Progress (กำลังดำเนินการ)'}</p>
                <Clock className="w-5 h-5 text-blue-400" />
              </div>
              <p className="text-3xl font-bold text-blue-700">{myInProgressCount}</p>
            </motion.div>
            
            {/* Returned */}
            <motion.div variants={itemVariants} onClick={() => setActiveCardFilter(activeCardFilter === 'MY_RETURNED' ? '' : 'MY_RETURNED')} className={`p-6 flex flex-col justify-between h-full border-none jelly-interactive ${activeCardFilter === 'MY_RETURNED' ? 'premium-card ring-2 ring-red-300 bg-red-50' : 'premium-card bg-white'}`}>
              <div className="flex justify-between items-start mb-1">
                <p className="text-sm text-red-600 font-semibold">{isAdmin ? 'Returned (รวม)' : 'Returned (ให้แก้ไข)'}</p>
                <AlertCircle className="w-5 h-5 text-red-400" />
              </div>
              <p className="text-3xl font-bold text-red-700">{myReturnedCount}</p>
            </motion.div>

            {/* Waiting Effective */}
            <motion.div variants={itemVariants} onClick={() => setActiveCardFilter(activeCardFilter === 'MY_WAITING' ? '' : 'MY_WAITING')} className={`p-6 flex flex-col justify-between h-full border-none jelly-interactive ${activeCardFilter === 'MY_WAITING' ? 'premium-card ring-2 ring-green-300 bg-green-50' : 'premium-card bg-white'}`}>
              <div className="flex justify-between items-start mb-1">
                <p className="text-sm text-green-600 font-semibold">{isAdmin ? 'Waiting (รวม)' : 'Waiting (รอประกาศ)'}</p>
                <CheckCircle className="w-5 h-5 text-green-400" />
              </div>
              <p className="text-3xl font-bold text-green-700">{myWaitingCount}</p>
            </motion.div>

            {/* Cancelled (Overdue) */}
            <motion.div variants={itemVariants} onClick={() => setActiveCardFilter(activeCardFilter === 'MY_CANCELLED' ? '' : 'MY_CANCELLED')} className={`p-6 flex flex-col justify-between h-full border-none jelly-interactive ${activeCardFilter === 'MY_CANCELLED' ? 'premium-card ring-2 ring-red-300 bg-red-50' : 'premium-card bg-white'}`}>
              <div className="flex justify-between items-start mb-1">
                <p className="text-sm text-red-600 font-semibold">{isAdmin ? 'Cancelled (รวม)' : 'Cancelled (ถูกยกเลิก)'}</p>
                <Trash2 className="w-5 h-5 text-red-400" />
              </div>
              <p className="text-3xl font-bold text-red-700">{myCancelledCount}</p>
            </motion.div>
          </motion.div>
        )}

        {activeOverviewTab === 'ACTION_REQUIRED' && (
          <motion.div variants={containerVariants} initial="hidden" animate="show" className={`grid grid-cols-2 ${isAdmin ? 'md:grid-cols-3' : 'md:grid-cols-4'} gap-3`}>
            
                {/* Pending Review */}
                <motion.div variants={itemVariants} onClick={() => setActiveCardFilter(activeCardFilter === 'ACTION_REVIEW' ? '' : 'ACTION_REVIEW')} className={`p-6 flex flex-col justify-between h-full border-none jelly-interactive ${activeCardFilter === 'ACTION_REVIEW' ? 'premium-card ring-2 ring-indigo-300 bg-indigo-50' : 'premium-card bg-white'}`}>
                  <div className="flex justify-between items-start mb-1">
                    <p className="text-sm text-indigo-600 font-semibold">Pending Review</p>
                    <Clock className="w-5 h-5 text-indigo-400" />
                  </div>
                  <p className="text-3xl font-bold text-gray-800">{actionReviewCount}</p>
                </motion.div>
                
                {/* Pending Approval */}
                <motion.div variants={itemVariants} onClick={() => setActiveCardFilter(activeCardFilter === 'ACTION_APPROVE' ? '' : 'ACTION_APPROVE')} className={`p-6 flex flex-col justify-between h-full border-none jelly-interactive ${activeCardFilter === 'ACTION_APPROVE' ? 'premium-card ring-2 ring-yellow-400 bg-yellow-50' : 'premium-card bg-white'}`}>
                  <div className="flex justify-between items-start mb-1">
                    <p className="text-sm text-yellow-600 font-semibold">Pending Approval</p>
                    <AlertCircle className="w-5 h-5 text-yellow-500" />
                  </div>
                  <p className="text-3xl font-bold text-gray-800">{actionApproveCount}</p>
                </motion.div>
                
                {/* Due Soon */}
                <motion.div variants={itemVariants} onClick={() => setActiveCardFilter(activeCardFilter === 'ACTION_DUE_SOON' ? '' : 'ACTION_DUE_SOON')} className={`p-6 flex flex-col justify-between h-full border-none jelly-interactive ${activeCardFilter === 'ACTION_DUE_SOON' ? 'premium-card ring-2 ring-orange-300 bg-orange-50' : 'premium-card bg-white'}`}>
                  <div className="flex justify-between items-start mb-1">
                    <p className="text-sm text-orange-600 font-semibold">Due Soon</p>
                    {activeCardFilter === 'ACTION_DUE_SOON' ? <span className="flex h-2 w-2 rounded-full bg-orange-500"></span> : <Clock className="w-5 h-5 text-orange-500" />}
                  </div>
                  <p className="text-3xl font-bold text-gray-800">{actionDueSoonCount}</p>
                </motion.div>
    
                {/* Overdue */}
                <motion.div variants={itemVariants} onClick={() => setActiveCardFilter(activeCardFilter === 'ACTION_OVERDUE' ? '' : 'ACTION_OVERDUE')} className={`p-6 flex flex-col justify-between h-full border-none jelly-interactive ${activeCardFilter === 'ACTION_OVERDUE' ? 'premium-card ring-2 ring-red-300 bg-red-50' : 'premium-card bg-white'}`}>
                  <div className="flex justify-between items-start mb-1">
                    <p className="text-sm text-red-600 font-semibold">Overdue</p>
                    {activeCardFilter === 'ACTION_OVERDUE' ? <span className="flex h-2 w-2 rounded-full bg-red-500 animate-ping"></span> : <AlertTriangle className="w-5 h-5 text-red-500" />}
                  </div>
                  <p className="text-3xl font-bold text-gray-800">{actionOverdueCount}</p>
                </motion.div>
          </motion.div>
        )}
      </motion.div>

      {/* Group 3: Controlled Copy Tasks (Admin Only) */}
      {isAdmin && (
        <motion.div variants={containerVariants} initial="hidden" animate="show" className="mt-6">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
              <ShieldAlert className="w-5 h-5 text-indigo-600" /> งานควบคุมสำเนาแจกจ่าย (Controlled Copy Tasks)
            </h3>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Pending Print & Issue */}
            <motion.div variants={itemVariants}
              onClick={() => navigate('/controlled-copy?tab=ACTION_REQUIRED')}
              className="premium-card p-8 flex flex-col justify-between group bg-teal-50 border border-teal-100 jelly-interactive"
            >
              <div className="flex justify-between items-start mb-3">
                <p className="text-teal-800 font-semibold text-sm">รอพิมพ์แจกจ่าย (Pending Print)</p>
                <div className="p-1.5 bg-teal-500/20 rounded-xl">
                  <FileText className="w-5 h-5 text-teal-700" />
                </div>
              </div>
              <p className="text-3xl font-bold mb-1 text-teal-900">{pendingPrintCount}</p>
              <p className="text-xs text-teal-700/80">เอกสารใหม่ที่รอการแจกจ่าย Hard Copy</p>
            </motion.div>

            {/* Pending Recall */}
            <motion.div variants={itemVariants}
              onClick={() => navigate('/controlled-copy?tab=ACTION_REQUIRED')}
              className="p-4 border border-rose-100 bg-rose-50 rounded-2xl jelly-interactive"
            >
              <div className="flex justify-between items-start mb-3">
                <p className="text-rose-800 font-semibold text-sm">รอเรียกคืน (Pending Recall)</p>
                <div className="p-1.5 bg-rose-500/20 rounded-xl">
                  <Clock className="w-5 h-5 text-rose-700" />
                </div>
              </div>
              <p className="text-3xl font-bold mb-1 text-rose-900">{pendingRecallCount}</p>
              <p className="text-xs text-rose-700/80">เอกสารล้าสมัยที่รอแผนกต่างๆ นำมาคืน</p>
            </motion.div>

            {/* Replacement Requests */}
            <motion.div variants={itemVariants}
              onClick={() => navigate('/controlled-copy?tab=ACTION_REQUIRED')}
              className="p-4 border border-amber-100 bg-amber-50 rounded-2xl jelly-interactive"
            >
              <div className="flex justify-between items-start mb-3">
                <p className="text-amber-800 font-semibold text-sm">คำขอทดแทน (Replacement)</p>
                <div className="p-1.5 bg-amber-500/20 rounded-xl">
                  <AlertTriangle className="w-5 h-5 text-amber-700" />
                </div>
              </div>
              <p className="text-3xl font-bold mb-1 text-amber-900">{replacementRequestCount}</p>
              <p className="text-xs text-amber-700/80">คำขอเอกสารชำรุด/สูญหายรออนุมัติ</p>
            </motion.div>
          </div>
        </motion.div>
      )}

      {/* Section 5: Recent DARs Table */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 mt-8">
        
        {/* Section 5: Recent DARs Table */}
        <div className="lg:col-span-4">
          <div className="premium-card overflow-hidden h-full flex flex-col border-none">
            <div className="p-3 border-b border-slate-200/50 bg-white flex flex-col md:flex-row justify-between items-center gap-3">
              <h3 className="text-base font-bold text-gray-800 flex items-center gap-2">
                <FileText className="w-5 h-5 text-blue-600" /> Recent Action Items
              </h3>
              
              <div className="flex items-center gap-2 w-full md:w-auto">
                <div className="relative flex-1 md:w-48">
                  <Search className="w-4 h-4 absolute left-3 top-2.5 text-gray-400 " />
                  <input 
                    type="text"
                    placeholder="ค้นหา DAR No..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="input-ios w-full pl-9 pr-3 py-1.5 text-sm"
                  />
                </div>
                <select 
                  value={filterType}
                  onChange={(e) => setFilterType(e.target.value)}
                  disabled={availableDarTypes.length === 0}
                  className="input-ios px-3 py-1.5 text-sm text-gray-600  disabled:opacity-50"
                >
                  <option value="">ทุกประเภท</option>
                  {availableDarTypes.map(t => (
                    <option key={t} value={t}>
                      {t === 'NEW' ? 'New' : t === 'REVISION' ? 'Revision' : t === 'OBSOLETE' ? 'Obsolete' : t}
                    </option>
                  ))}
                </select>
                <button 
                  onClick={() => {
                    setSearchTerm('');
                    setFilterType('');
                    setActiveCardFilter('');
                  }}
                  title="ล้างตัวกรอง"
                  className="p-1.5 text-gray-400  hover:text-red-500  hover:bg-red-50/50 rounded-lg transition-all duration-300 ease-fluid active:scale-[0.97]"
                >
                  <FilterX className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="overflow-x-auto flex-1 max-h-[400px]">
              {recentDars.length > 0 ? (
                <table className="w-full text-left text-sm text-gray-600 border-collapse">
                  <thead className="sticky top-0 bg-slate-50 text-gray-500 uppercase border-b border-slate-200/50 z-10 shadow-sm">
                    <tr>
                      <th className="px-3 py-2 font-medium w-16 text-center text-xs">Action</th>
                      <th className="px-3 py-2 font-medium whitespace-nowrap text-xs">DAR No.</th>
                      <th className="px-3 py-2 font-medium text-xs">Title</th>
                      <th className="px-3 py-2 font-medium whitespace-nowrap text-xs">Type</th>
                      {isAdmin && <th className="px-3 py-2 font-medium text-xs">Dept.</th>}
                      <th className="px-3 py-2 font-medium whitespace-nowrap text-xs">Status</th>
                      <th className="px-3 py-2 font-medium whitespace-nowrap text-xs">Current Handler</th>
                      <th className="px-3 py-2 font-medium whitespace-nowrap text-xs">Date</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100/50">
                    {recentDars.map((dar) => (
                      <motion.tr variants={itemVariants} initial="hidden" animate="show" key={dar.id} className="hover:bg-blue-50/30 transition-colors group">
                        <td className="px-3 py-2 text-center">
                          {renderActionButtons(dar)}
                        </td>
                        <td className="px-3 py-2 whitespace-nowrap">
                          <span className="font-semibold text-blue-600 text-sm cursor-pointer hover:underline group-hover:text-blue-700" onClick={() => dar.isTask ? navigate(`/tasks/approve-replacement/${dar.taskId}`) : navigate(`/dar/${dar.id}`)}>{dar.id}</span>
                        </td>
                        <td className="px-3 py-2 font-medium text-gray-800 w-full max-w-[200px] md:max-w-xs truncate" title={dar.title}>{dar.title}</td>
                        <td className="px-3 py-2 whitespace-nowrap"><span className="px-2 py-0.5 bg-gray-100 text-gray-700 rounded-full text-[11px] font-semibold">{dar.type}</span></td>
                        {isAdmin && <td className="px-3 py-2 text-gray-700 font-medium">{dar.department}</td>}
                        <td className="px-3 py-2 whitespace-nowrap">{getStatusBadge(dar.status)}</td>
                        <td className="px-3 py-2 text-gray-700 whitespace-nowrap">{dar.isTask ? 'Manager' : getCurrentHandler(dar)}</td>
                        <td className="px-3 py-2 text-gray-400 text-xs whitespace-nowrap">{dar.date}</td>
                      </motion.tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <div className="h-full flex items-center justify-center p-8">
                  <EmptyState />
                </div>
              )}
            </div>
          </div>
        </div>



      </div>
    </motion.div>
  );
};

export default Dashboard;
