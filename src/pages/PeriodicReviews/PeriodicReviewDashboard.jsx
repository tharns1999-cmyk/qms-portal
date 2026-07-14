import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Calendar, Clock, AlertTriangle, CheckCircle, FileText, Search, Filter, ArrowRight } from 'lucide-react';
import useStore from '../../store/useStore';
import { canViewAllPeriodicReviews, getVisiblePeriodicReviews } from '../../services/PeriodicReviewAccessService';
import PeriodicReviewControlBoard from './PeriodicReviewControlBoard';
import { getReviewStatusLabel } from '../../services/PeriodicReviewService';

const DashboardCard = ({ title, value, icon: Icon, colorClass, onClick }) => (
  <div
    onClick={onClick}
    className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200 cursor-pointer hover:shadow-md transition-shadow group relative overflow-hidden"
  >
    <div className={`absolute top-0 right-0 w-24 h-24 bg-gradient-to-br ${colorClass} opacity-10 rounded-bl-full`} />
    <div className="flex items-start justify-between">
      <div>
        <p className="text-sm font-medium text-slate-500 mb-1">{title}</p>
        <h3 className="text-3xl font-bold text-slate-800">{value}</h3>
      </div>
      <div className={`p-3 rounded-xl bg-gradient-to-br ${colorClass} text-white shadow-sm group-hover:scale-110 transition-transform`}>
        <Icon size={24} />
      </div>
    </div>
  </div>
);

const OwnerDepartmentView = ({ visibleRecords }) => {
  const navigate = useNavigate();
  const { currentUser } = useStore();
  const [activeTab, setActiveTab] = useState('ACTION_REQUIRED'); // ACTION_REQUIRED, DUE_SOON, OVERDUE, COMPLETED, ALL
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDept, setSelectedDept] = useState('ALL');
  
  // Available departments for the user
  const availableDepts = currentUser?.depts || [];

  const stats = useMemo(() => {
    return {
      actionRequired: visibleRecords.filter(r => ['UPCOMING', 'DUE_SOON', 'DUE', 'IN_PROGRESS'].includes(r.status)).length,
      dueSoon30: visibleRecords.filter(r => ['DUE_SOON', 'DUE'].includes(r.status)).length,
      overdue: visibleRecords.filter(r => r.status === 'OVERDUE').length,
      completedThisYear: visibleRecords.filter(r => r.status === 'COMPLETED' && new Date(r.updatedAt).getFullYear() === new Date().getFullYear()).length,
    };
  }, [visibleRecords]);

  const filteredRecords = useMemo(() => {
    let result = visibleRecords;
    
    // Tab filter
    if (activeTab === 'ACTION_REQUIRED') {
      result = result.filter(r => ['UPCOMING', 'DUE_SOON', 'DUE', 'IN_PROGRESS'].includes(r.status));
    } else if (activeTab === 'DUE_SOON') {
      result = result.filter(r => ['DUE_SOON', 'DUE'].includes(r.status));
    } else if (activeTab === 'OVERDUE') {
      result = result.filter(r => r.status === 'OVERDUE');
    } else if (activeTab === 'COMPLETED') {
      result = result.filter(r => r.status === 'COMPLETED');
    }
    
    if (selectedDept !== 'ALL') {
      result = result.filter(r => r.ownerDepartmentId === selectedDept);
    }
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      result = result.filter(r => (r.documentNumber || '').toLowerCase().includes(term) || (r.documentName || '').toLowerCase().includes(term));
    }
    
    return result;
  }, [visibleRecords, activeTab, selectedDept, searchTerm]);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <DashboardCard title="งานที่ต้องดำเนินการ" value={stats.actionRequired} icon={Clock} colorClass="from-blue-500 to-indigo-600" onClick={() => setActiveTab('ACTION_REQUIRED')} />
        <DashboardCard title="ใกล้ครบกำหนดภายใน 30 วัน" value={stats.dueSoon30} icon={Calendar} colorClass="from-yellow-400 to-orange-500" onClick={() => setActiveTab('DUE_SOON')} />
        <DashboardCard title="เกินกำหนด" value={stats.overdue} icon={AlertTriangle} colorClass="from-red-500 to-rose-600" onClick={() => setActiveTab('OVERDUE')} />
        <DashboardCard title="ดำเนินการเสร็จแล้วในปีนี้" value={stats.completedThisYear} icon={CheckCircle} colorClass="from-emerald-500 to-teal-600" onClick={() => setActiveTab('COMPLETED')} />
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="border-b border-slate-200 flex flex-wrap gap-2 p-2 bg-slate-50">
          {[
            { id: 'ACTION_REQUIRED', label: 'ต้องดำเนินการ' },
            { id: 'DUE_SOON', label: 'ใกล้ครบกำหนด' },
            { id: 'OVERDUE', label: 'เกินกำหนด' },
            { id: 'COMPLETED', label: 'เสร็จแล้ว' },
            { id: 'ALL', label: 'ทั้งหมดของแผนก' }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${activeTab === tab.id ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-200'}`}
            >
              {tab.label}
            </button>
          ))}
        </div>
        
        <div className="p-4 border-b border-slate-200 flex flex-col sm:flex-row gap-4 justify-between items-center bg-white">
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            <input
              type="text"
              placeholder="ค้นหาเลขที่/ชื่อเอกสาร..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>
          <div className="flex gap-2 w-full sm:w-auto">
            <Filter size={16} className="text-slate-400 mt-2.5 hidden sm:block" />
            <select
              value={selectedDept}
              onChange={(e) => setSelectedDept(e.target.value)}
              className="border border-slate-300 rounded-lg text-sm px-3 py-2 w-full sm:w-48 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="ALL">ทุกแผนกที่ฉันอยู่</option>
              {availableDepts.map(dept => (
                <option key={dept} value={dept}>{dept}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="bg-slate-50 text-slate-600 border-b border-slate-200">
              <tr>
                <th className="px-6 py-4 font-semibold">เลขที่เอกสาร</th>
                <th className="px-6 py-4 font-semibold">ชื่อเอกสาร</th>
                <th className="px-6 py-4 font-semibold">แผนกเจ้าของเอกสาร</th>
                <th className="px-6 py-4 font-semibold">เจ้าของเอกสาร</th>
                <th className="px-6 py-4 font-semibold">วันที่ครบกำหนดทบทวน</th>
                <th className="px-6 py-4 font-semibold">สถานะการทบทวน</th>
                <th className="px-6 py-4 font-semibold text-right">การดำเนินการ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 bg-white">
              {filteredRecords.map(record => {
                const statusLabel = getReviewStatusLabel(record.status);
                return (
                  <tr key={record.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4 font-medium text-slate-900">{record.documentNumber}</td>
                    <td className="px-6 py-4 text-slate-600">{record.documentName}</td>
                    <td className="px-6 py-4 text-slate-600">{record.ownerDepartmentId}</td>
                    <td className="px-6 py-4 text-slate-600">{record.ownerUserId}</td>
                    <td className="px-6 py-4 text-slate-600">{record.nextReviewDate}</td>
                    <td className="px-6 py-4">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${statusLabel.color}`}>
                        {statusLabel.label}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button 
                        onClick={() => navigate(`/dcc/periodic-reviews/${record.id}`)}
                        className="text-indigo-600 hover:text-indigo-800 font-medium text-xs bg-indigo-50 px-3 py-1.5 rounded-lg inline-flex items-center gap-1"
                      >
                        เปิดดู <ArrowRight size={14} />
                      </button>
                    </td>
                  </tr>
                );
              })}
              {filteredRecords.length === 0 && (
                <tr>
                  <td colSpan="7" className="px-6 py-12 text-center text-slate-500">
                    <FileText className="w-12 h-12 mx-auto text-slate-300 mb-3" />
                    <p>ไม่พบรายการทบทวนที่ตรงกับเงื่อนไข</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};


const PeriodicReviewDashboard = () => {
  const { currentUser, periodicReviewSchedules, documents, externalDocuments } = useStore();
  const canSeeAll = canViewAllPeriodicReviews(currentUser);
  const [view, setView] = useState(canSeeAll ? 'CONTROL_BOARD' : 'OWNER_DEPT');

  const allDocs = useMemo(() => [...(documents || []), ...(externalDocuments || [])], [documents, externalDocuments]);
  const visibleRecords = useMemo(() => getVisiblePeriodicReviews(currentUser, periodicReviewSchedules, allDocs), [currentUser, periodicReviewSchedules, allDocs]);

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 tracking-tight">การทบทวนเอกสารตามรอบ</h1>
          <p className="text-slate-500 mt-1">
            {view === 'OWNER_DEPT' ? 'งานทบทวนเอกสารของแผนกฉัน' : 'ภาพรวมการทบทวนเอกสารทุกแผนก'}
          </p>
        </div>
        
        {canSeeAll && (
          <div className="bg-slate-100 p-1 rounded-xl flex items-center shadow-inner">
            <button
              onClick={() => setView('OWNER_DEPT')}
              className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${view === 'OWNER_DEPT' ? 'bg-white text-indigo-700 shadow-sm' : 'text-slate-600 hover:text-slate-900'}`}
            >
              งานของแผนกฉัน
            </button>
            <button
              onClick={() => setView('CONTROL_BOARD')}
              className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${view === 'CONTROL_BOARD' ? 'bg-white text-indigo-700 shadow-sm' : 'text-slate-600 hover:text-slate-900'}`}
            >
              ภาพรวมทุกแผนก
            </button>
          </div>
        )}
      </div>

      {view === 'OWNER_DEPT' ? (
        <OwnerDepartmentView visibleRecords={visibleRecords} />
      ) : (
        <PeriodicReviewControlBoard />
      )}
      
    </div>
  );
};

export default PeriodicReviewDashboard;
