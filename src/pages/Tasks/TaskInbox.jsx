import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import useStore from '../../store/useStore';
import { Clock, AlertTriangle, CheckCircle, Search, Filter, Play, CheckSquare, ChevronRight, FileEdit, Eye, FilterX, ExternalLink, AlertCircle, Calendar } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import ExternalDocActionModal from './ExternalDocActionModal';
const TaskInbox = () => {
  const navigate = useNavigate();
  const { currentUser, tasks, dars, externalDocuments, mockDateOffset, setMockDateOffset, checkSLA, removeTask } = useStore();
  const [activeTab, setActiveTab] = useState('ALL');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedExtTask, setSelectedExtTask] = useState(null);

  // Run SLA Check on load (simulated)
  useEffect(() => {
    checkSLA();
  }, [mockDateOffset, checkSLA]);

  const isDccAdmin = currentUser.isDcc || currentUser.role === 'DCC_ADMIN' || currentUser.id === 'u5';

  const userTasks = tasks.filter(t => {
    const isMyTask = t.assigneeId === currentUser.id || 
    (t.currentHandlerDepartment === currentUser.department && Number(t.currentHandlerLevel) === Number(currentUser.level));
    
    if (isDccAdmin) {
      return t.type.startsWith('DCC_') || t.assignedToRole === 'DCC_ADMIN' || isMyTask;
    }
    return isMyTask;
  });

  const getFilteredTasks = () => {
    let filtered = userTasks;
    if (activeTab !== 'ALL') {
      filtered = filtered.filter(t => t.type.toUpperCase() === activeTab || (activeTab === 'REVIEW' && t.type === 'EXT_REVIEW') || (activeTab === 'APPROVE' && (t.type === 'EXT_APPROVAL' || t.type === 'CC_REPLACEMENT_APPROVAL')));
    }
    if (searchTerm) {
      filtered = filtered.filter(t => {
        const refId = t.referenceId || t.darId || '';
        return refId.toLowerCase().includes(searchTerm.toLowerCase()) || 
               t.title.toLowerCase().includes(searchTerm.toLowerCase());
      });
    }
    return filtered;
  };

  const getRiskStatus = (task) => {
    if (!task.dueDate) return { label: 'Normal', color: 'bg-green-100 text-green-700 ', icon: <CheckCircle size={24} strokeWidth={1.25}/> };
    
    const today = new Date();
    today.setDate(today.getDate() + mockDateOffset);
    const todayStr = today.toISOString().split('T')[0];
    
    if (todayStr > task.dueDate) {
      return { label: 'Overdue', color: 'bg-red-100 text-red-700 ', icon: <AlertCircle size={24} strokeWidth={1.25}/> };
    } else if (todayStr === task.dueDate) {
      return { label: 'Due Soon', color: 'bg-yellow-100 text-yellow-700 ', icon: <Clock size={24} strokeWidth={1.25}/> };
    } else {
      return { label: 'Normal', color: 'bg-green-100 text-green-700 ', icon: <CheckCircle size={24} strokeWidth={1.25}/> };
    }
  };

  const getTaskCount = (tabId) => {
    let filtered = userTasks;
    if (tabId !== 'ALL') {
      filtered = filtered.filter(t => t.type.toUpperCase() === tabId || (tabId === 'REVIEW' && (t.type === 'EXT_REVIEW')) || (tabId === 'APPROVE' && (t.type === 'EXT_APPROVAL' || t.type === 'CC_REPLACEMENT_APPROVAL')));
    }
    return filtered.length;
  };

  const tabs = isDccAdmin ? [
    { id: 'ALL', label: 'All DCC Tasks', count: getTaskCount('ALL') },
    { id: 'DCC_DISTRIBUTE', label: 'Distribution', count: getTaskCount('DCC_DISTRIBUTE') },
    { id: 'DCC_RECALL', label: 'Obsolete Recall', count: getTaskCount('DCC_RECALL') },
    { id: 'DCC_REPLACEMENT', label: 'Copy Replacement', count: getTaskCount('DCC_REPLACEMENT') },
  ] : [
    { id: 'ALL', label: 'All Tasks', count: getTaskCount('ALL') },
    { id: 'REVIEW', label: 'Review', count: getTaskCount('REVIEW') },
    { id: 'APPROVE', label: 'Approve', count: getTaskCount('APPROVE') },
    { id: 'ACK', label: 'Acknowledge', count: getTaskCount('ACK') },
    { id: 'REVISE', label: 'Revise (Returned)', count: getTaskCount('REVISE') },
  ];

  const handleTaskClick = (task) => {
    if (task.referenceType === 'EXTERNAL_DOC') {
      setSelectedExtTask(task);
      return;
    }
    
    switch(task.type) {
      case 'Review': navigate(`/tasks/review/${task.id}`); break;
      case 'Approve': navigate(`/tasks/approve/${task.id}`); break;
      case 'Ack': navigate(`/tasks/ack/${task.id}`); break;
      case 'Revise': navigate(`/tasks/revise/${task.id}`); break;
      case 'DCC_DISTRIBUTE': navigate(`/controlled-copy?tab=ACTION_REQUIRED`); break;
      case 'DCC_RECALL': navigate(`/controlled-copy?tab=ACTION_REQUIRED`); break;
      case 'DCC_REPLACEMENT': navigate(`/controlled-copy?tab=ACTION_REQUIRED`); break;
      case 'CC_REPLACEMENT_APPROVAL': navigate(`/tasks/approve-replacement/${task.id}`); break;
      default: break;
    }
  };

  const handleSimulateDay = () => {
    setMockDateOffset(mockDateOffset + 1);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 ">{isDccAdmin ? 'DCC Task Center' : 'Task Inbox'}</h1>
          <p className="text-gray-500 ">{isDccAdmin ? 'จัดการงานแจกจ่าย และเรียกเก็บเอกสารควบคุม' : 'จัดการงานที่รอการตรวจสอบและอนุมัติ'}</p>
        </div>
        
        {/* Development Mock Tools */}
        <div className="bg-purple-50  border border-purple-200  px-4 py-2 rounded-lg flex items-center gap-4">
          <div>
            <p className="text-xs text-purple-600  font-bold uppercase tracking-wider">Dev Tools (Time Travel)</p>
            <p className="text-sm font-medium text-purple-900 ">Day Offset: +{mockDateOffset} Days</p>
          </div>
          <button 
            onClick={handleSimulateDay}
            className="flex items-center gap-1 bg-purple-600 hover:bg-purple-700 text-white px-3 py-1.5 rounded-md text-sm font-medium transition-colors"
          >
            <Play size={24} strokeWidth={1.25}/>
            +1 Day
          </button>
        </div>
      </div>

      <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden">
        <div className="px-4 pt-3 border-b border-gray-200 bg-white flex flex-col md:flex-row gap-4 justify-between items-end">
          <div className="flex gap-6 overflow-x-auto w-full md:w-auto hide-scrollbar">
            {tabs.map(tab => {
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`relative py-3 text-sm font-medium whitespace-nowrap transition-colors outline-none group flex items-center gap-2 ${
                    isActive ? 'text-indigo-600' : 'text-gray-500 hover:text-gray-900'
                  }`}
                >
                  <span className="relative z-10">{tab.label}</span>
                  {tab.count > 0 && (
                    <span className={`relative z-10 text-[10px] font-bold px-2 py-0.5 rounded-full transition-colors ${
                      isActive ? 'bg-indigo-100 text-indigo-700' : 'bg-gray-100 text-gray-600 group-hover:bg-gray-200'
                    }`}>
                      {tab.count}
                    </span>
                  )}
                  {isActive && (
                    <motion.div
                      layoutId="task-tab-indicator"
                      className="absolute bottom-0 left-0 right-0 h-[2px] bg-indigo-600 rounded-t-md z-0"
                      transition={{ type: "spring", stiffness: 300, damping: 30 }}
                    />
                  )}
                </button>
              );
            })}
          </div>

          <div className="flex items-center gap-2 w-full md:w-auto">
            <div className="relative flex-1 md:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} strokeWidth={1.25}/>
              <input 
                type="text" 
                placeholder="ค้นหา DAR No. หรือ ชื่อเอกสาร..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-white  border border-gray-200  rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 "
              />
            </div>
            <button 
              onClick={() => {
                setSearchTerm('');
                setActiveTab('ALL');
              }}
              title="ล้างตัวกรอง"
              className="p-2 text-gray-400  hover:text-red-500  hover:bg-red-50  rounded-lg transition-colors flex items-center justify-center border border-transparent hover:border-red-200 "
            >
              <FilterX size={24} strokeWidth={1.25}/>
            </button>
          </div>
        </div>

        <div className="divide-y divide-gray-100 ">
          {getFilteredTasks().length > 0 ? (
            getFilteredTasks().map(task => {
              const isExternal = task.referenceType === 'EXTERNAL_DOC';
              const dar = (!isExternal) ? dars.find(d => d.id === task.darId) : null;
              const extDoc = isExternal ? externalDocuments.find(d => d.id === task.referenceId) : null;
              const risk = getRiskStatus(task);
              const displayId = task.referenceId || task.darId || task.id;
              const displayType = isExternal ? 'External Document' : dar?.type;
              
              return (
                <div 
                  key={task.id} 
                  onClick={() => handleTaskClick(task)}
                  className="p-5 hover:bg-blue-50  cursor-pointer transition-colors group flex items-center justify-between"
                >
                  <div className="flex items-start gap-4 flex-1">
                    <div className="hidden md:flex items-center justify-center w-12 h-12 rounded-xl bg-gray-100  text-gray-500  group-hover:bg-blue-100 group-hover:text-blue-600    transition-colors">
                      {(task.type === 'Review' || task.type === 'EXT_REVIEW') && <Eye size={28} strokeWidth={1.25}/>}
                      {(task.type === 'Approve' || task.type === 'EXT_APPROVAL') && <CheckCircle size={28} strokeWidth={1.25}/>}
                      {task.type === 'Ack' && <CheckCircle size={28} strokeWidth={1.25}/>}
                      {task.type === 'Revise' && <FileEdit size={28} strokeWidth={1.25}/>}
                      {task.type.startsWith('DCC_') && <AlertCircle className="text-indigo-500" size={28} strokeWidth={1.25}/>}
                    </div>
                    <div>
                      <div className="flex items-center gap-3 mb-1">
                        <span className="font-semibold text-gray-900  group-hover:text-blue-700   transition-colors">
                          {displayId}
                        </span>
                        {isExternal && (
                          <span className="px-2 py-0.5 bg-indigo-100  text-indigo-700  text-xs font-semibold rounded-full flex items-center gap-1">
                            <ExternalLink size={20} strokeWidth={1.25}/> External
                          </span>
                        )}
                        <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100  text-gray-700 ">
                          {task.type.replace('EXT_', '').replace('DCC_', '')} Task
                        </span>
                        <span className={`flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium ${risk.color}`}>
                          {risk.icon}
                          {risk.label}
                        </span>
                      </div>
                      <h3 className="text-gray-800  font-medium mb-1">[{displayType}] {task.title}</h3>
                      <div className="flex items-center gap-4 text-sm text-gray-500 ">
                        {isExternal ? (
                           <span>สถานะปัจจุบัน: <span className="font-medium text-indigo-600 ">{extDoc?.status}</span></span>
                        ) : isDccAdmin ? (
                           <span className="text-gray-600">{task.description || `DCC Action Required for ${displayId}`}</span>
                        ) : (
                          <>
                            <span>Due: <span className="font-medium text-gray-700 ">{task.dueDate}</span></span>
                            <span>Cancel Date: <span className="font-medium text-gray-700 ">{task.cancelDate}</span></span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                  <ChevronRight className="text-gray-400 group-hover:text-blue-500 transition-colors" size={24} strokeWidth={1.25}/>
                </div>
              );
            })
          ) : (
            <div className="p-12 text-center text-gray-500 ">
              <CheckCircle className="mx-auto text-green-300 mb-3" size={48} strokeWidth={1.25}/>
              <p className="text-lg font-medium text-gray-600 ">ไม่มีงานค้าง</p>
              <p className="text-sm">ยอดเยี่ยมมาก คุณจัดการงานเสร็จหมดแล้ว</p>
            </div>
          )}
        </div>
      </div>

      <AnimatePresence>
        {selectedExtTask && (
          <ExternalDocActionModal 
            task={selectedExtTask} 
            onClose={() => setSelectedExtTask(null)} 
          />
        )}
      </AnimatePresence>
    </div>
  );
};

export default TaskInbox;
