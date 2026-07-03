import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import useStore from '../../store/useStore';
import { FilePlus, Edit, Trash2, ClipboardCheck, Eye, ChevronRight, ChevronLeft, Search, X } from 'lucide-react';

const DarList = () => {
  const navigate = useNavigate();
  const { dars, currentUser, tasks, masterUsers, deleteDar } = useStore();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 30;

  const isAdmin = currentUser.isDcc || currentUser.role === 'DCC_ADMIN' || currentUser.id === 'u5' || currentUser.id === 'U001';
  
  // Department-Wide Visibility
  const myDars = dars.filter(dar => 
    isAdmin || 
    dar.department === currentUser.department || 
    dar.requesterId === currentUser.id
  ).sort((a, b) => new Date(b.date) - new Date(a.date));

  const filteredDars = myDars.filter(dar => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    return (
      dar.id?.toLowerCase().includes(term) ||
      dar.title?.toLowerCase().includes(term) ||
      dar.type?.toLowerCase().includes(term) ||
      dar.status?.toLowerCase().includes(term) ||
      (dar.department && dar.department.toLowerCase().includes(term))
    );
  });

  const totalPages = Math.ceil(filteredDars.length / itemsPerPage) || 1;
  const currentDars = filteredDars.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const isMyTask = (t) => t.assigneeId === currentUser.id || (t.currentHandlerDepartment === currentUser.department && Number(t.currentHandlerLevel) === Number(currentUser.level));

  const getCurrentHandler = (dar) => {
    if (dar.status === 'DRAFT') {
      const user = masterUsers.find(u => u.id === dar.requesterId);
      const name = user ? user.name : (dar.requester || dar.requesterId);
      return <span className="text-gray-600  font-medium">{name} (Requester)</span>;
    } else if (dar.status === 'APPROVED_WAITING_EFFECTIVE' || dar.status === 'WAITING_EFFECTIVE') {
      return <span className="text-gray-400 font-medium">-</span>;
    } else if (dar.status === 'UNDER_REVIEW' || dar.status === 'PENDING_APPROVAL' || dar.status === 'WAITING_ACKNOWLEDGEMENT') {
      const activeTasks = tasks.filter(t => t.darId === dar.id);
      if (activeTasks.length > 0) {
        const handlerNames = activeTasks.map(t => {
           const user = masterUsers.find(u => u.id === t.assigneeId);
           const role = t.type === 'Review' ? 'Reviewer' : t.type === 'Approve' ? 'Approver' : 'Ack';
           if (user) {
             return `${user.name} (${role})`;
           } else {
             // Fallback if assigneeId is a raw string name or AUTO
             let fallbackName = t.assigneeId;
             if (t.assigneeId === 'AUTO' || !t.assigneeId) {
                fallbackName = t.type === 'Review' ? dar.reviewer : t.type === 'Approve' ? dar.approver : 'System';
             }
             return `${fallbackName} (${role})`;
           }
        });
        return <span className="text-blue-700  font-medium">{handlerNames.join(', ')}</span>;
      }
      return '-';
    } else if (dar.status === 'RETURNED_FOR_REVISION') {
      const user = masterUsers.find(u => u.id === dar.requesterId);
      const name = user ? user.name : (dar.requester || dar.requesterId);
      return <span className="text-red-600  font-medium flex items-center gap-1">{name} (Requester - แก้ไข)</span>;
    }
    return '-';
  };

  const renderActionButtons = (dar) => {
    const isRequesterOfDar = dar.requesterId === currentUser.id;
    const activeTask = tasks.find(t => t.darId === dar.id && isMyTask(t));
    
    if (dar.status === 'DRAFT' && isRequesterOfDar) {
      return (
        <div className="flex items-center gap-1">
          <button 
            onClick={(e) => {
              e.stopPropagation();
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
            onClick={(e) => {
              e.stopPropagation();
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
    
    if (activeTask) {
      const taskRoute = activeTask.type === 'Review' ? `/tasks/review/${activeTask.id}` : 
                        activeTask.type === 'Approve' ? `/tasks/approve/${activeTask.id}` : `/tasks/ack/${activeTask.id}`;
      return (
        <button 
          onClick={(e) => { e.stopPropagation(); navigate(taskRoute); }}
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
          onClick={(e) => { e.stopPropagation(); navigate(`/tasks`); }}
          className="p-1.5 text-purple-600  bg-purple-50 hover:bg-purple-100 rounded-lg transition-colors flex items-center justify-center border border-purple-200"
          title="ดำเนินการ (Evaluate DCC)"
        >
          <ClipboardCheck className="w-4 h-4" />
        </button>
      );
    }

    if (dar.status === 'RETURNED_FOR_REVISION' && isRequesterOfDar) {
      return (
        <button 
          onClick={(e) => { e.stopPropagation(); navigate(`/tasks/revise/${dar.id}`); }}
          className="p-1.5 text-orange-600  hover:text-orange-700  bg-orange-50 hover:bg-orange-100 rounded-lg transition-colors flex items-center justify-center border border-orange-200"
          title="แก้ไขคำขอ (Edit)"
        >
          <Edit className="w-4 h-4" />
        </button>
      );
    }

    return (
      <button 
        onClick={(e) => { e.stopPropagation(); navigate(`/dar/${dar.id}`); }}
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
      case 'EFFECTIVE': return <span className="px-2 py-1 bg-green-100 text-green-700  rounded-full text-xs font-medium">Effective</span>;
      case 'OBSOLETE': return <span className="px-2 py-1 bg-gray-100 text-gray-700  rounded-full text-xs font-medium">Obsolete</span>;
      case 'RETURNED_FOR_REVISION': return <span className="px-2 py-1 bg-orange-100 text-orange-700  rounded-full text-xs font-medium">Returned</span>;
      default: return <span className="px-2 py-1 bg-green-100 text-green-700  rounded-full text-xs font-medium">{status.replace(/_/g, ' ')}</span>;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-800 ">รายการคำร้อง DAR</h2>
          <p className="text-gray-500  mt-1">รายการคำร้องขอขึ้นทะเบียน แก้ไข หรือยกเลิกเอกสารของคุณ</p>
        </div>
        <button 
          onClick={() => navigate('/dar/new')}
          className="flex items-center gap-2 px-4 py-2 btn-ios-primary transition-all duration-300 ease-out active:scale-95 border border-transparent"
        >
          <FilePlus className="w-5 h-5" />
          สร้าง DAR ใหม่
        </button>
      </div>

      {/* Filter and Search */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white border border-gray-200 rounded-2xl p-8">
        <div className="relative w-full sm:w-96">
          <input
            type="text"
            placeholder="ค้นหา DAR No, Title, Type, Status..."
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setCurrentPage(1);
            }}
            className="input-ios w-full pl-10 pr-10 py-2"
          />
          <Search className="w-5 h-5 text-gray-400  absolute left-3 top-2.5" />
          {searchTerm && (
            <button
              onClick={() => { setSearchTerm(''); setCurrentPage(1); }}
              className="absolute right-3 top-2.5 text-gray-400  hover:text-gray-600 "
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>
      </div>

      <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden">
        <table className="w-full text-left text-sm text-gray-600  border-collapse">
          <thead className="bg-slate-50/80 text-gray-500  uppercase border-b border-slate-200/50">
            <tr>
              <th className="px-3 py-3 font-medium w-16 text-center">Action</th>
              <th className="px-3 py-3 font-medium whitespace-nowrap">DAR No.</th>
              <th className="px-3 py-3 font-medium">Title</th>
              <th className="px-3 py-3 font-medium whitespace-nowrap">Type</th>
              {isAdmin && <th className="px-3 py-3 font-medium">Dept.</th>}
              <th className="px-3 py-3 font-medium whitespace-nowrap">Status</th>
              <th className="px-3 py-3 font-medium whitespace-nowrap">Current Handler</th>
              <th className="px-3 py-3 font-medium whitespace-nowrap">Date</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100/50">
            {currentDars.map((dar) => (
              <tr key={dar.id} className="hover:bg-slate-100/30 transition-colors cursor-pointer" onClick={() => navigate(`/dar/${dar.id}`)}>
                <td className="px-3 py-3 text-center">
                  {renderActionButtons(dar)}
                </td>
                <td className="px-3 py-3 whitespace-nowrap">
                  <span className="font-medium text-blue-600  hover:underline">{dar.id}</span>
                </td>
                <td className="px-3 py-3 font-medium text-gray-800  w-full max-w-[200px] md:max-w-xs truncate" title={dar.title}>{dar.title}</td>
                <td className="px-3 py-3 whitespace-nowrap"><span className="px-2 py-1 bg-gray-100 text-gray-700  rounded text-xs font-semibold">{dar.type}</span></td>
                {isAdmin && <td className="px-3 py-3 text-gray-700  font-medium">{dar.department}</td>}
                <td className="px-3 py-3 whitespace-nowrap">{getStatusBadge(dar.status)}</td>
                <td className="px-3 py-3 text-gray-700  whitespace-nowrap">{getCurrentHandler(dar)}</td>
                <td className="px-3 py-3 text-gray-500  whitespace-nowrap">{dar.date}</td>
              </tr>
            ))}
            {currentDars.length === 0 && (
              <tr>
                <td colSpan={isAdmin ? 8 : 7} className="px-6 py-8 text-center text-gray-500 ">
                  ไม่มีข้อมูลคำขอ
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-between items-center px-6 py-4 bg-white border border-gray-100 rounded-xl shadow-sm">
          <span className="text-sm text-gray-700 ">
            แสดง {(currentPage - 1) * itemsPerPage + 1} ถึง {Math.min(currentPage * itemsPerPage, filteredDars.length)} จากทั้งหมด {filteredDars.length} รายการ
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="p-2 border border-gray-200 rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-gray-600 "
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <span className="text-sm font-medium px-4 text-gray-700 ">
              หน้า {currentPage} / {totalPages}
            </span>
            <button
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="p-2 border border-gray-200 rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-gray-600 "
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default DarList;
