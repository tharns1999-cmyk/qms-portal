import React, { useState, useRef, useEffect } from 'react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import useStore from '../../store/useStore';
import { motion, AnimatePresence } from 'framer-motion';
import { Home, FilePlus, List, CheckSquare, Library, Copy, Globe, Database, History, Bell, Calendar, UserCircle } from 'lucide-react';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';

dayjs.extend(relativeTime);

const Sidebar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { 
    currentUser, requestUsers, reviewUsers, approveUsers, tasks, controlledCopyInstances, documents, 
    masterUsers, setCurrentUser, notifications, markNotificationAsRead, markAllNotificationsAsRead 
  } = useStore();
  
  const [isHovered, setIsHovered] = useState(false);
  const [showNoti, setShowNoti] = useState(false);
  const notiRef = useRef(null);
  
  const isExpanded = isHovered || showNoti;
  
  const path = location.pathname;
  const isPortal = path === '/portal' || path === '/';
  const isDcc = !isPortal;

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
    <NavLink to={to} className="relative flex items-center mx-3 my-1 py-2.5 rounded-lg group">
      {({ isActive }) => {
        // If navigating to old route via alias, let's just use exact or base matches,
        // NavLink naturally matches 'to' prop against URL.
        return (
          <>
            {isActive && (
              <motion.div
                layoutId="sidebar-active-indicator"
                className="absolute inset-0 bg-zinc-100/80 rounded-lg z-0"
                initial={false}
                transition={{ type: "spring", stiffness: 380, damping: 30 }}
              />
            )}
            <div className={`relative z-10 w-12 flex items-center justify-center shrink-0 transition-colors duration-200 ${isActive ? 'text-zinc-900' : 'text-zinc-500 group-hover:text-zinc-900'}`}>
              <IconComponent className="w-[18px] h-[18px]" strokeWidth={isActive ? 2.5 : 2} />
            </div>
            <AnimatePresence>
              {isExpanded && (
                <motion.span 
                  initial={{ opacity: 0, x: -5 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -5 }}
                  transition={{ duration: 0.15 }}
                  className={`relative z-10 whitespace-nowrap text-[14px] flex-1 flex items-center justify-between pr-3 ${isActive ? 'text-zinc-900 font-semibold' : 'text-zinc-600 font-medium group-hover:text-zinc-900'}`}
                >
                  {label}
                  {badgeCount > 0 && (
                    <span className="bg-zinc-900 text-white text-[10px] font-bold px-2 py-0.5 rounded-full ml-2">
                      {badgeCount}
                    </span>
                  )}
                </motion.span>
              )}
            </AnimatePresence>
            {badgeCount > 0 && !isExpanded && (
               <div className="absolute right-3 top-1/2 -translate-y-1/2 w-1.5 h-1.5 bg-zinc-900 rounded-full" />
            )}
          </>
        );
      }}
    </NavLink>
  );

  return (
    <div 
      className={`bg-white border-r border-zinc-200 flex flex-col h-full transition-all duration-300 relative z-40 ${isExpanded ? 'w-[260px]' : 'w-[72px]'}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* TOP SECTION: Logo & System Name */}
      <div className="flex flex-col items-center pt-5 pb-3 mx-3">
        <div className="flex items-center w-full h-12 mb-2 overflow-hidden cursor-pointer" onClick={() => navigate('/portal')}>
          <div className="w-14 flex items-center justify-center shrink-0">
            <img src="/logo.png" alt="Logo" className="w-10 h-10 object-contain translate-x-[2px]" />
          </div>
          <AnimatePresence>
            {isExpanded && (
              <motion.h1 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.15 }}
                className="text-[15px] font-bold text-zinc-900 whitespace-nowrap tracking-tight ml-1"
              >
                QMS Portal
              </motion.h1>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* NOTIFICATION SECTION */}
      <div className="w-full mt-2 mx-3 pb-2" ref={notiRef}>
        <div className="relative w-full pr-6">
          <button 
            type="button"
            onClick={() => setShowNoti(!showNoti)}
            className="py-2.5 text-zinc-500 hover:text-zinc-900 hover:bg-zinc-100/50 rounded-lg transition-colors duration-200 relative flex items-center w-full overflow-hidden"
          >
            <div className="relative z-10 w-12 flex items-center justify-center shrink-0">
              <Bell className="w-[18px] h-[18px]" strokeWidth={2}/>
              {unreadCount > 0 && (
                <span className="absolute top-0 right-2 w-1.5 h-1.5 bg-rose-500 rounded-full" />
              )}
            </div>
            <AnimatePresence>
              {isExpanded && (
                <motion.span 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.15 }}
                  className="whitespace-nowrap font-medium text-[14px] flex-1 text-left flex justify-between items-center pr-3"
                >
                  Notifications
                  {unreadCount > 0 && (
                    <span className="bg-rose-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full ml-2">
                      {unreadCount > 99 ? '99+' : unreadCount}
                    </span>
                  )}
                </motion.span>
              )}
            </AnimatePresence>
          </button>

          {/* Notification Dropdown */}
          <AnimatePresence>
            {showNoti && (
              <motion.div 
                initial={{ opacity: 0, y: -10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -10, scale: 0.95 }}
                transition={{ type: "spring", stiffness: 400, damping: 30 }}
                className="absolute left-full top-0 mt-0 w-80 bg-white border border-zinc-200 rounded-xl shadow-lg overflow-hidden z-50 origin-top-left"
              >
                <div className="px-4 py-3 border-b border-zinc-100 flex justify-between items-center bg-zinc-50/50">
                  <h3 className="font-semibold text-zinc-900 text-sm">Notifications</h3>
                  {unreadCount > 0 && (
                    <span onClick={() => markAllNotificationsAsRead(currentUser.id)} className="text-[11px] text-zinc-500 cursor-pointer hover:text-zinc-900 font-medium transition-colors">Mark all as read</span>
                  )}
                </div>
                <div className="max-h-80 overflow-y-auto">
                  {userNotis.length > 0 ? (
                    userNotis.map(noti => (
                      <div 
                        key={noti.id} 
                        onClick={() => handleNotificationClick(noti)}
                        className={`p-4 border-b border-zinc-50 hover:bg-zinc-50 cursor-pointer transition-colors duration-200 ${!noti.isRead ? 'bg-zinc-50/50' : ''}`}
                      >
                        <div className="flex justify-between items-start mb-1">
                          <h4 className={`text-sm ${!noti.isRead ? 'font-semibold text-zinc-900' : 'font-medium text-zinc-600'}`}>{noti.title}</h4>
                          <span className="text-[10px] text-zinc-400 whitespace-nowrap ml-2">{dayjs(noti.timestamp).fromNow()}</span>
                        </div>
                        <p className="text-xs text-zinc-500 line-clamp-2 leading-relaxed">{noti.message}</p>
                      </div>
                    ))
                  ) : (
                    <div className="p-8 text-center text-zinc-400 text-sm">No new notifications</div>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      <div className="mx-4 mb-2 border-b border-zinc-100"></div>

      {/* CENTER SECTION: Navigation */}
      <nav className="flex-1 py-2 space-y-0.5 overflow-x-hidden overflow-y-auto hide-scrollbar">
        <NavItem to="/portal" icon={Home} label="Portal Home" />
        
        {isDcc && (
          <>
            <div className={`px-5 pt-3 pb-1 text-[10px] font-bold text-zinc-400 uppercase tracking-wider ${!isExpanded && 'hidden'}`}>
              DCC Module
            </div>
            
            <NavItem to="/dcc/dashboard" icon={Library} label="Dashboard" />
            
            {isRequester && (
              <>
                <NavItem to="/dcc/dar/new" icon={FilePlus} label="Create DAR" />
                <NavItem to="/dcc/dar/list" icon={List} label="My DARs" />
              </>
            )}
            
            {isReviewerOrApprover && (
              <NavItem to="/dcc/tasks" icon={CheckSquare} label="Task Inbox" badgeCount={myTaskCount} />
            )}
            
            {isAdmin && (
              <NavItem to="/dcc/admin/action-log" icon={History} label="Action Log" />
            )}
            
            {isMasterListAccess && (
              <NavItem to="/dcc/master-list" icon={Database} label="Master List" />
            )}
            <NavItem to="/dcc/library" icon={Library} label="Document Library" />
            
            {currentUser.isDcc && (
              <NavItem to="/dcc/controlled-copy" icon={Copy} label="Controlled Copy" badgeCount={ccTaskCount} />
            )}
            <NavItem to="/dcc/external-docs" icon={Globe} label="External Docs" />
            <NavItem to="/dcc/periodic-reviews" icon={Calendar} label="Periodic Reviews" />
          </>
        )}


      </nav>

      {/* BOTTOM SECTION: User Profile */}
      <div className="mt-auto flex flex-col mx-3 pb-5">
        <div className="border-t border-zinc-100 pt-3 px-2">
          <div className="flex flex-col gap-2 overflow-hidden">
            <div className="flex items-center gap-2 h-10 w-full cursor-pointer hover:opacity-80 transition-opacity">
              <div className="w-10 h-10 flex items-center justify-center shrink-0">
                <UserCircle className="text-zinc-400" size={28} strokeWidth={1.5}/>
              </div>
              <AnimatePresence>
                {isExpanded && (
                  <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.15 }}
                    className="flex flex-col justify-center overflow-hidden flex-1"
                  >
                    <p className="text-[13px] font-semibold text-zinc-900 leading-tight truncate">{currentUser.name}</p>
                    <p className="text-[11px] text-zinc-500 leading-tight truncate mt-0.5">
                      {currentUser.position}
                    </p>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
            
            <AnimatePresence>
              {isExpanded && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="w-full overflow-hidden"
                >
                  <select 
                    className="w-full h-8 px-2 text-[11px] text-zinc-600 bg-zinc-50 border border-zinc-200 rounded-md focus:outline-none focus:ring-1 focus:ring-zinc-900"
                    value={currentUser?.id || ''}
                    onChange={(e) => setCurrentUser(e.target.value)}
                  >
                    {(masterUsers || []).map(user => (
                      <option key={user.id} value={user.id}>
                        Switch: {user.name}
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
