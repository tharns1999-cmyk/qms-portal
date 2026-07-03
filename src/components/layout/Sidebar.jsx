import React, { useState } from 'react';
import { NavLink } from 'react-router-dom';
import useStore from '../../store/useStore';
import { motion } from 'framer-motion';
import { Home, FilePlus, List, CheckSquare, Settings, Library, FileText, Copy, Globe, RefreshCcw, Database, History } from 'lucide-react';

const Sidebar = () => {
  const { currentUser, requestUsers, reviewUsers, approveUsers } = useStore();
  const [isHovered, setIsHovered] = useState(false);
  
  const isRequester = requestUsers.some(u => u.id === currentUser.id);
  const isReviewerOrApprover = reviewUsers.some(u => u.id === currentUser.id) || approveUsers.some(u => u.id === currentUser.id);
  const isAdmin = currentUser.id === 'u5' || currentUser.isDcc || currentUser.role === 'DCC_ADMIN';
  const isMasterListAccess = currentUser.level >= 5 && !isAdmin;

  const NavItem = ({ to, icon: IconComponent, label }) => (
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
            animate={{ opacity: isHovered ? 1 : 0 }}
            transition={{ duration: 0.3 }}
            className={`relative z-10 whitespace-nowrap text-[14.5px] tracking-tight ${isActive ? 'text-slate-900 font-semibold' : 'text-slate-600 font-medium group-hover:text-slate-900'}`}
          >
            {label}
          </motion.span>
        </>
      )}
    </NavLink>
  );

  return (
    <div 
      className={`bg-[#FAFAFA] border-r border-slate-200 flex flex-col h-full transition-all duration-400 ease-[cubic-bezier(0.34,1.56,0.64,1)] relative z-40 ${isHovered ? 'w-64' : 'w-20'}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <nav className="flex-1 py-6 space-y-1 overflow-x-hidden overflow-y-auto">
        <NavItem to="/dashboard" icon={Home} label="Dashboard" />

        {/* Requester Menus */}
        {isRequester && (
          <>
            <NavItem to="/dar/new" icon={FilePlus} label="สร้าง DAR" />
            <NavItem to="/dar/list" icon={List} label="รายการ DAR" />
          </>
        )}

        {/* Reviewer / Approver Menus */}
        {isReviewerOrApprover && (
          <NavItem to="/tasks" icon={CheckSquare} label="กล่องงาน (Task Inbox)" />
        )}

        {/* DCC Admin Menus */}
        {isAdmin && (
          <>
            <NavItem to="/admin/action-log" icon={History} label="Action Log" />
          </>
        )}

        {/* Common Menus */}
        {isMasterListAccess && (
          <NavItem to="/master-list" icon={Database} label="ทะเบียนเอกสารควบคุม" />
        )}
        <NavItem to="/library" icon={Library} label="คลังเอกสาร" />
        
        {/* Controlled Copy Menu - Restricted to DCC */}
        {currentUser.isDcc && (
          <NavItem to="/controlled-copy" icon={Copy} label="Controlled Copy" />
        )}
        
        <NavItem to="/periodic-review" icon={RefreshCcw} label="Periodic Review" />
        <NavItem to="/external-docs" icon={Globe} label="External Documents" />
      </nav>

      {/* Dev Reset Button */}
      <div className="p-3 border-t border-slate-200/60 mt-auto">
        <button
          onClick={() => {
            if(window.confirm('Are you sure you want to reset all mock data? This will clear localStorage and reload the page.')) {
              localStorage.clear();
              window.location.reload();
            }
          }}
          className="w-full flex items-center p-3 text-rose-400 hover:bg-rose-50/50 hover:text-rose-600 rounded-xl transition-colors group relative"
          title="Reset System Data (Dev)"
        >
          <div className="w-8 flex items-center justify-center shrink-0">
            <Database className="w-5 h-5" />
          </div>
          <motion.span 
            initial={{ opacity: 0 }}
            animate={{ opacity: isHovered ? 1 : 0 }}
            transition={{ duration: 0.3 }}
            className="whitespace-nowrap text-sm font-medium ml-3"
          >
            Reset Data (Dev)
          </motion.span>
        </button>
      </div>
    </div>
  );
};

export default Sidebar;
