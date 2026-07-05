import React, { useState, useRef, useEffect } from 'react';
import { Search, X } from 'lucide-react';

const UserSelector = ({ value, onChange, error, users = [] }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef(null);

  // Find the selected user
  const selectedUser = users?.find(u => u?.id === value);

  // Filter users based on search
  const filteredUsers = users.filter(u => {
    const sQuery = searchQuery?.toLowerCase() ?? "";
    const nameMatch = u?.name?.toLowerCase()?.includes(sQuery);
    const deptMatch = u?.department?.toLowerCase()?.includes(sQuery);
    return nameMatch || deptMatch;
  });

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelect = (user) => {
    onChange(user.id);
    setSearchQuery('');
    setIsOpen(false);
  };

  const handleClear = () => {
    onChange('');
  };

  return (
    <div className="relative w-full" ref={containerRef}>
      {value && selectedUser ? (
        <div className={`flex items-center justify-between border-none rounded-2xl px-3 py-2 bg-slate-100 ${error ? 'ring-2 ring-red-400 bg-red-50/50 ' : ''}`}>
          <div className="flex-1 truncate">
            <span className="font-medium text-gray-800 ">{selectedUser.name}</span>
            <span className="text-gray-500  text-sm ml-2">({selectedUser.department})</span>
          </div>
          <button 
            type="button" 
            onClick={handleClear}
            className="text-gray-400  hover:text-red-500  ml-2 transition-all duration-300 ease-out active:scale-95 p-1 rounded-lg"
          >
            <X size={24} strokeWidth={1.25}/>
          </button>
        </div>
      ) : (
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} strokeWidth={1.25}/>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setIsOpen(true);
            }}
            onFocus={() => setIsOpen(true)}
            placeholder="ค้นหาชื่อ หรือแผนก..."
            className={`input-ios w-full pl-10 pr-4 py-2 text-sm h-[42px] ${error ? 'ring-2 ring-red-400 bg-red-50/50 ' : ''}`}
          />
        </div>
      )}

      {isOpen && !value && (
        <div className="absolute z-[9999] w-full mt-1 bg-white  border border-gray-200  rounded-lg shadow-lg max-h-60 overflow-y-auto">
          {filteredUsers.length > 0 ? (
            <ul className="py-1">
              {filteredUsers.map(u => (
                <li 
                  key={u?.id || Math.random()}
                  onClick={() => handleSelect(u)}
                  className="px-4 py-2 hover:bg-orange-50  cursor-pointer flex justify-between items-center border-b border-gray-50  last:border-0"
                >
                  <span className="font-medium text-gray-800 ">{u?.name || 'Unknown'}</span>
                  <span className="text-xs text-gray-500  bg-gray-100  px-2 py-0.5 rounded-full">{u?.department || '-'}</span>
                </li>
              ))}
            </ul>
          ) : (
            <div className="px-4 py-3 text-sm text-gray-500  text-center">
              ไม่พบผู้ใช้งานที่ตรงกับคำค้นหา
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default UserSelector;
