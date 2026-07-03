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
    <NavLink to={to} className="relative flex items-center mx-2 py-3 rounded-xl overflow-hidden transition-all duration-300 ease-fluid active:scale-95 group">
      {({ isActive }) => (
        <>
          {isActive && (
            <motion.div
              layoutId="sidebar-active"
              className="absolute inset-0 bg-indigo-50 rounded-xl z-0"
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
            />
          )}
          {!isActive && (
            <div className="absolute inset-0 bg-slate-100  opacity-0 group-hover:opacity-100 transition-opacity z-0 rounded-xl" />
          )}
          <div className={`relative z-10 w-12 flex items-center justify-center shrink-0 ${isActive ? 'text-indigo-600 ' : 'text-slate-500  group-hover:text-slate-900 '}`}>
            <IconComponent className="w-6 h-6" />
          </div>
          <span className={`relative z-10 whitespace-nowrap transition-opacity duration-300 ${isHovered ? 'opacity-100' : 'opacity-0'} ${isActive ? 'text-indigo-600  font-medium' : 'text-slate-500  group-hover:text-slate-900 '}`}>
            {label}
          </span>
        </>
      )}
    </NavLink>
  );

  return (
    <div 
      className={`bg-white border-r border-slate-200/80 flex flex-col h-full transition-all duration-300 ease-out relative z-40 ${isHovered ? 'w-64' : 'w-16'}`}
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
      <div className="p-2 border-t border-slate-100">
        <button
          onClick={() => {
            if(window.confirm('Are you sure you want to reset all mock data? This will clear localStorage and reload the page.')) {
              localStorage.clear();
              window.location.reload();
            }
          }}
          className="w-full flex items-center justify-center p-2 text-rose-500 hover:bg-rose-50 hover:text-rose-600 rounded-xl transition-colors group relative"
          title="Reset System Data (Dev)"
        >
          <Database className="w-5 h-5 shrink-0" />
          <span className={`absolute left-14 whitespace-nowrap text-sm font-medium transition-all duration-300 ${isHovered ? 'opacity-100 visible' : 'opacity-0 invisible'}`}>
            Reset Data (Dev)
          </span>
        </button>
      </div>
    </div>
  );
};

export default Sidebar;
