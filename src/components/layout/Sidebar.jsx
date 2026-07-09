import React, { useState, useRef, useEffect } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import useStore from '../../store/useStore';
import { motion, AnimatePresence } from 'framer-motion';
import { Home, FilePlus, List, CheckSquare, Library, Copy, Globe, Database, History, UserCircle, Bell, Calendar } from 'lucide-react';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';

dayjs.extend(relativeTime);

const Sidebar = () => {
  const navigate = useNavigate();
  const { 
    currentUser, requestUsers, reviewUsers, approveUsers, tasks, controlledCopyInstances, documents, 
    masterUsers, setCurrentUser, notifications, markNotificationAsRead, markAllNotificationsAsRead 
  } = useStore();
  
  const [isHovered, setIsHovered] = useState(false);
  const [showNoti, setShowNoti] = useState(false);
  const notiRef = useRef(null);
  
  const isExpanded = isHovered || showNoti;

  const isRequester = (requestUsers || []).some(u => u.id === currentUser.id);
  const isReviewerOrApprover = (reviewUsers || []).some(u => u.id === currentUser.id) || (approveUsers || []).some(u => u.id === currentUser.id);
  const isAdmin = currentUser.id === 'u5' || currentUser.isDcc || currentUser.role === 'DCC_ADMIN';
  const isMasterListAccess = currentUser.level >= 5 && !isAdmin;

  // Task Counts Calculations
  const userTasks = (tasks || []).filter(t => {
    const isMyTask = t.assigneeId === currentUser.id || 
    (t.currentHandlerDepartment === currentUser.department && Number(t.currentHandlerLevel) === Number(currentUser.level));
    
    if (isAdmin) {
      return (t.type || '').startsWith('DCC_') || t.assignedToRole === 'DCC_ADMIN' || isMyTask;
    }
    return isMyTask;
  });
  const myTaskCount = userTasks.length;

  const ccTaskCount = (controlledCopyInstances || []).filter(inst => {
    const doc = (documents || []).find(d => d.id === inst.docId);
    const isRecall = doc && doc.status === 'SUPERSEDED_ARCHIVED' && inst.status === 'ACTIVE';
    return (inst.status === 'PENDING_RECEIPT' || inst.status === 'REPLACEMENT_REQUESTED' || isRecall);
  }).length;

  // Notification Logic
  const userNotis = (notifications || []).filter(n => n.userId === currentUser.id).sort((a,b) => new Date(b.timestamp) - new Date(a.timestamp));
  const unreadCount = userNotis.filter(n => !n.isRead).length;

  const handleNotificationClick = (noti) => {
    markNotificationAsRead(noti.id);
    setShowNoti(false);
    if (noti.link) {
      navigate(noti.link);
    }
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (notiRef.current && !notiRef.current.contains(event.target)) {
        setShowNoti(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const NavItem = ({ to, icon: IconComponent, label, badgeCount }) => (
    <NavLink to={to} className="relative flex items-center mx-3 my-1 py-3 rounded-xl overflow-hidden transition-colors duration-300 group hover:bg-slate-100/60">
      {({ isActive }) => (
        <>
          {isActive && (
            <motion.div
              layoutId="sidebar-active"
              className="absolute inset-0 bg-white shadow-sm border border-slate-200/50 rounded-xl z-0"
              transition={{ type: "spring", stiffness: 400, damping: 30 }}
            />
          )}
          <div className={`relative z-10 w-14 flex items-center justify-center shrink-0 transition-colors duration-300 ${isActive ? 'text-slate-900' : 'text-slate-500 group-hover:text-slate-900'}`}>
            <IconComponent className="w-[22px] h-[22px]" />
          </div>
          <motion.span 
            initial={{ opacity: 0 }}
            animate={{ opacity: isExpanded ? 1 : 0 }}
            transition={{ duration: 0.3 }}
            className={`relative z-10 whitespace-nowrap text-[14.5px] tracking-tight flex-1 flex items-center justify-between ${isActive ? 'text-slate-900 font-semibold' : 'text-slate-600 font-medium group-hover:text-slate-900'}`}
          >
            {label}
            {badgeCount > 0 && isExpanded && (
              <span className="bg-red-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow-sm ml-2">
                {badgeCount}
              </span>
            )}
          </motion.span>
          {badgeCount > 0 && !isExpanded && (
             <div className="absolute right-2 top-2 w-2 h-2 bg-red-500 rounded-full border border-white" />
          )}
        </>
      )}
    </NavLink>
  );

  return (
    <div 
      className={`bg-[#FAFAFA] border-r border-slate-200 flex flex-col h-full transition-all duration-400 ease-[cubic-bezier(0.34,1.56,0.64,1)] relative z-40 ${isExpanded ? 'w-[280px]' : 'w-20'}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => {
        setIsHovered(false);
      }}
    >
      {/* TOP SECTION: Logo, System Name, Notification */}
      <div className="flex flex-col items-center pt-6 pb-2 border-b border-slate-200/60 mx-3">
        {/* Logo & Title */}
        <div className="flex items-center w-full h-12 mb-2 overflow-hidden">
          <div className="w-14 flex items-center justify-center shrink-0">
            <img src="/logo.png" alt="Logo" className="w-10 h-10 object-contain translate-x-[2px]" />
          </div>
          <AnimatePresence>
            {isExpanded && (
              <motion.h1 
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                transition={{ duration: 0.2 }}
                className="text-xl font-bold text-gray-800 whitespace-nowrap"
              >
                QMS Portal
              </motion.h1>
            )}
          </AnimatePresence>
        </div>

        {/* Notification Bell */}
        <div className="w-full mb-2" ref={notiRef}>
          <div className="relative w-full">
            <button 
              onClick={() => setShowNoti(!showNoti)}
              className="py-3 text-slate-500 hover:text-indigo-600 hover:bg-slate-100 rounded-xl transition-all duration-300 ease-out active:scale-95 relative flex items-center w-full overflow-hidden"
            >
              <div className="relative z-10 w-14 flex items-center justify-center shrink-0">
                <Bell className="w-[22px] h-[22px]" strokeWidth={1.25}/>
                {unreadCount > 0 && (
                  <span className="absolute top-0 right-2 w-4 h-4 bg-red-500 text-white text-[10px] font-bold flex items-center justify-center rounded-full border border-white">
                    {unreadCount > 99 ? '99+' : unreadCount}
                  </span>
                )}
              </div>
              <AnimatePresence>
                {isExpanded && (
                  <motion.span 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="whitespace-nowrap font-medium text-[14.5px] tracking-tight flex-1 text-left"
                  >
                    Notifications
                  </motion.span>
                )}
              </AnimatePresence>
            </button>

            {/* Notification Dropdown */}
            {showNoti && (
              <div className="absolute left-[110%] top-0 mt-0 w-80 bg-white border border-slate-200/80 shadow-xl rounded-2xl overflow-hidden z-[100] origin-top-left animate-in fade-in slide-in-from-left-2 duration-300 ease-out">
                <div className="px-4 py-3 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                  <h3 className="font-semibold text-slate-700">Notifications</h3>
                  {unreadCount > 0 && (
                    <span onClick={() => markAllNotificationsAsRead(currentUser.id)} className="text-xs text-blue-600  cursor-pointer hover:underline font-medium transition-colors">Mark all as read</span>
                  )}
                </div>
                <div className="max-h-80 overflow-y-auto custom-scrollbar">
                  {userNotis.length > 0 ? (
                    userNotis.map(noti => (
                      <div 
                        key={noti.id} 
                        onClick={() => handleNotificationClick(noti)}
                        className={`p-4 border-b border-slate-50  hover:bg-slate-50/80  cursor-pointer transition-colors duration-200 ${!noti.isRead ? 'bg-blue-50/40 ' : ''}`}
                      >
                        <div className="flex justify-between items-start mb-1">
                          <h4 className={`text-sm ${!noti.isRead ? 'font-bold text-gray-900 ' : 'font-medium text-gray-600 '}`}>{noti.title}</h4>
                          <span className="text-xs text-gray-400  whitespace-nowrap ml-2">{dayjs(noti.timestamp).fromNow()}</span>
                        </div>
                        <p className="text-xs text-gray-500  line-clamp-2">{noti.message}</p>
                      </div>
                    ))
                  ) : (
                    <div className="p-8 text-center text-gray-500  text-sm">ไม่มีการแจ้งเตือน</div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* CENTER SECTION: Navigation */}
      <nav className="flex-1 py-4 space-y-1 overflow-x-hidden overflow-y-auto custom-scrollbar">
        <NavItem to="/dashboard" icon={Home} label="Dashboard" />
        
        {isRequester && (
          <>
            <NavItem to="/dar/new" icon={FilePlus} label="สร้าง DAR" />
            <NavItem to="/dar/list" icon={List} label="รายการ DAR" />
          </>
        )}
        
        {isReviewerOrApprover && (
          <NavItem to="/tasks" icon={CheckSquare} label="กล่องงาน (Task Inbox)" badgeCount={myTaskCount} />
        )}
        
        {isAdmin && (
          <>
            <NavItem to="/admin/action-log" icon={History} label="Action Log" />
          </>
        )}
        
        {isMasterListAccess && (
          <NavItem to="/master-list" icon={Database} label="ทะเบียนเอกสารควบคุม" />
        )}
        <NavItem to="/library" icon={Library} label="คลังเอกสาร" />
        
        {currentUser.isDcc && (
          <NavItem to="/controlled-copy" icon={Copy} label="Controlled Copy" badgeCount={ccTaskCount} />
        )}
        <NavItem to="/external-docs" icon={Globe} label="External Documents" />
        <NavItem to="/periodic-reviews" icon={Calendar} label="การทบทวนเอกสารตามรอบ" />
      </nav>

      {/* BOTTOM SECTION: User Profile & Actions */}
      <div className="mt-auto flex flex-col mx-3 pb-6">
        <div className="border-t border-slate-200/60 pt-4 px-2">
          {/* User Switcher / Info */}
          <div className="flex flex-col gap-3 overflow-hidden">
            <div className="flex items-center gap-3 h-10 w-full cursor-pointer hover:opacity-80 transition-opacity">
              <div className="w-10 h-10 flex items-center justify-center shrink-0">
                <UserCircle className="text-indigo-600" size={32} strokeWidth={1.25}/>
              </div>
              <AnimatePresence>
                {isExpanded && (
                  <motion.div 
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -10 }}
                    transition={{ duration: 0.2 }}
                    className="flex flex-col justify-center overflow-hidden flex-1"
                  >
                    <p className="text-sm font-bold text-gray-800 leading-tight truncate" title={currentUser.name}>{currentUser.name}</p>
                    <p className="text-[11px] text-gray-500 leading-tight truncate mt-0.5" title={`${currentUser.position} - ${currentUser.department}`}>
                      {currentUser.position} • {currentUser.department}
                    </p>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
            
            {/* User Switcher Select */}
            <AnimatePresence>
              {isExpanded && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="w-full mt-1 overflow-hidden"
                >
                  <select 
                    className="input-ios text-[12px] text-gray-600 w-full bg-slate-50 border-slate-200"
                    value={currentUser?.id || ''}
                    onChange={(e) => setCurrentUser(e.target.value)}
                  >
                    {(masterUsers || []).map(user => (
                      <option key={user.id} value={user.id}>
                        Switch: {user.name} ({user.department})
                      </option>
                    ))}
                  </select>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;
