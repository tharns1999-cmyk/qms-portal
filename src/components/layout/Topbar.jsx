import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import useStore from '../../store/useStore';
import { UserCircle, Bell } from 'lucide-react';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';

dayjs.extend(relativeTime);

const Topbar = () => {
  const navigate = useNavigate();
  const { currentUser, masterUsers, setCurrentUser, notifications, markNotificationAsRead, markAllNotificationsAsRead } = useStore();
  const [showNoti, setShowNoti] = useState(false);
  const notiRef = useRef(null);

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
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  return (
    <header className="sticky top-0 bg-white/95 backdrop-blur-md border-b border-slate-200/80 px-6 py-4 flex justify-between items-center z-40">
      <div className="flex items-center gap-3">
        <img src="/logo.png" alt="Logo" className="h-10 object-contain" />
        <h1 className="text-xl font-bold text-gray-800  hidden sm:block">QMS Portal</h1>
      </div>
      <div className="flex items-center gap-6">
        
        {/* Notification Bell */}
        <div className="relative" ref={notiRef}>
          <button 
            onClick={() => setShowNoti(!showNoti)}
            className="p-2 text-slate-500 hover:text-indigo-600 hover:bg-slate-100 rounded-xl transition-all duration-300 ease-out active:scale-95 relative"
          >
            <Bell className="w-6 h-6" />
            {unreadCount > 0 && (
              <span className="absolute top-0 right-0 w-4 h-4 bg-red-500 text-white text-[10px] font-bold flex items-center justify-center rounded-full border border-white">
                {unreadCount > 99 ? '99+' : unreadCount}
              </span>
            )}
          </button>

          {/* Notification Dropdown */}
          {showNoti && (
            <div className="absolute right-0 mt-2 w-80 bg-white border border-slate-200/80 shadow-lg rounded-2xl overflow-hidden z-[100] origin-top-right animate-in fade-in zoom-in-95 duration-300 ease-out">
              <div className="px-4 py-3 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                <h3 className="font-semibold text-slate-700">Notifications</h3>
                {unreadCount > 0 && (
                  <span onClick={() => markAllNotificationsAsRead(currentUser.id)} className="text-xs text-blue-600  cursor-pointer hover:underline font-medium transition-colors">Mark all as read</span>
                )}
              </div>
              <div className="max-h-80 overflow-y-auto">
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

        {/* User Switcher */}
        <div className="flex items-center gap-3 border-l border-slate-200  pl-6">
          <div className="flex items-center gap-2">
            <UserCircle className="w-8 h-8 text-blue-600 " />
            <div className="hidden md:block">
              <p className="text-sm font-bold text-gray-700  leading-none mb-1">{currentUser.name}</p>
              <p className="text-xs text-gray-500  leading-none">{currentUser.position} (Lv.{currentUser.level}) - {currentUser.department}</p>
            </div>
          </div>
          <select 
            className="input-ios text-sm text-gray-600  w-48"
            value={currentUser.id}
            onChange={(e) => setCurrentUser(e.target.value)}
          >
            {masterUsers.map(user => (
              <option key={user.id} value={user.id}>
                Switch: {user.name}
              </option>
            ))}
          </select>
        </div>
      </div>
    </header>
  );
};

export default Topbar;
