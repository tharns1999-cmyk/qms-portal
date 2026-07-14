import React, { useState, useMemo } from 'react';

import { Search, Filter, Download, ArrowRight, Activity, CalendarClock, CheckCircle, Clock } from 'lucide-react';
import useStore from '../../store/useStore';
import { getVisiblePeriodicReviews, canExportPeriodicReviews } from '../../services/PeriodicReviewAccessService';
import { getReviewStatusLabel, getReviewOutcomeLabel } from '../../services/PeriodicReviewService';

const PeriodicReviewControlBoard = () => {
  const { periodicReviewSchedules, documents, externalDocuments, currentUser } = useStore();
  
  const allDocs = useMemo(() => [...(documents || []), ...(externalDocuments || [])], [documents, externalDocuments]);
  const visibleRecords = useMemo(() => getVisiblePeriodicReviews(currentUser, periodicReviewSchedules, allDocs), [currentUser, periodicReviewSchedules, allDocs]);

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDept, setSelectedDept] = useState('ALL');
  
  // Calculate top-level stats from visible records
  const totalIncomplete = visibleRecords.filter(r => ['UPCOMING', 'DUE_SOON', 'DUE', 'IN_PROGRESS'].includes(r.status)).length;
  const dueThisMonth = visibleRecords.filter(r => ['DUE_SOON', 'DUE'].includes(r.status)).length;
  const overdueCount = visibleRecords.filter(r => r.status === 'OVERDUE').length;
  const completedCount = visibleRecords.filter(r => r.status === 'COMPLETED').length;
  const totalRecords = visibleRecords.length;
  const completionRate = totalRecords > 0 ? Math.round((completedCount / totalRecords) * 100) : 0;

  const departmentStats = useMemo(() => {
    const stats = {};
    visibleRecords.forEach(record => {
      const dept = record.ownerDepartmentId || 'Unknown';
      if (!stats[dept]) {
        stats[dept] = { dept, total: 0, dueSoon: 0, overdue: 0, inProgress: 0, completed: 0 };
      }
      stats[dept].total += 1;
      
      if (record.status === 'DUE_SOON' || record.status === 'DUE') stats[dept].dueSoon += 1;
      else if (record.status === 'OVERDUE') stats[dept].overdue += 1;
      else if (record.status === 'IN_PROGRESS') stats[dept].inProgress += 1;
      else if (record.status === 'COMPLETED') stats[dept].completed += 1;
    });
    return Object.values(stats);
  }, [visibleRecords]);

  const filteredStats = useMemo(() => {
    let result = departmentStats;
    if (selectedDept !== 'ALL') {
      result = result.filter(s => s.dept === selectedDept);
    }
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      result = result.filter(s => s.dept.toLowerCase().includes(term));
    }
    return result;
  }, [departmentStats, selectedDept, searchTerm]);

  const handleExport = () => {
    if (!canExportPeriodicReviews(currentUser)) return;
    
    const rows = [
      ['เลขที่เอกสาร', 'ชื่อเอกสาร', 'ฉบับที่ (Rev)', 'ประเภทเอกสาร', 'แผนกเจ้าของเอกสาร', 'เจ้าของเอกสาร', 'วันที่บังคับใช้', 'วันที่ทบทวนล่าสุด', 'วันที่ครบกำหนด', 'สถานะการทบทวน', 'ผลการทบทวน', 'ผู้ทบทวน', 'วันที่ดำเนินการ', 'เลขที่ DAR ที่เชื่อมโยง', 'จำนวนวันเกินกำหนด']
    ];
    
    // Filter records if a specific dept is selected
    const recordsToExport = selectedDept === 'ALL' ? visibleRecords : visibleRecords.filter(r => r.ownerDepartmentId === selectedDept);
    
    recordsToExport.forEach(r => {
      rows.push([
        r.documentNumber || '',
        r.documentName || '',
        r.rev || '',
        r.documentCategory || '',
        r.ownerDepartmentId || '',
        r.ownerUserId || '',
        r.originalReviewAnchorDate || '',
        '', // Last review date not deeply tracked in mock array simply
        r.nextReviewDate || '',
        getReviewStatusLabel(r.status).label || '',
        getReviewOutcomeLabel(r.outcome).label || '',
        '', // Completed by
        r.updatedAt || '',
        r.linkedActionId || '',
        r.overdueDays || 0
      ]);
    });

    const csvContent = "\uFEFF" + rows.map(e => e.map(cell => `"${(cell||'').toString().replace(/"/g, '""')}"`).join(",")).join("\n");
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `periodic_reviews_export_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-800">ภาพรวมการทบทวนเอกสารทุกแผนก</h2>
          <p className="text-sm text-slate-500">ติดตามสถานะการทบทวนเอกสารของทุกแผนกในระบบ</p>
        </div>
        <div className="flex flex-col items-end gap-1">
          {canExportPeriodicReviews(currentUser) && (
            <button
              onClick={handleExport}
              className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 text-slate-700 rounded-lg hover:bg-slate-50 text-sm font-medium transition-colors"
            >
              <Download size={16} /> ส่งออก CSV
            </button>
          )}
          <span className="text-xs text-slate-400">สามารถเปิดด้วย Microsoft Excel ได้</span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-sm">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-blue-50 text-blue-600 rounded-lg"><Activity size={20} /></div>
            <h3 className="text-sm font-medium text-slate-600">งานทบทวนที่ยังไม่เสร็จ</h3>
          </div>
          <p className="text-3xl font-bold text-slate-800">{totalIncomplete}</p>
        </div>
        <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-sm">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-yellow-50 text-yellow-600 rounded-lg"><CalendarClock size={20} /></div>
            <h3 className="text-sm font-medium text-slate-600">ครบกำหนดภายในเดือนนี้</h3>
          </div>
          <p className="text-3xl font-bold text-slate-800">{dueThisMonth}</p>
        </div>
        <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-sm">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-red-50 text-red-600 rounded-lg"><Clock size={20} /></div>
            <h3 className="text-sm font-medium text-slate-600">เกินกำหนด</h3>
          </div>
          <p className="text-3xl font-bold text-red-600">{overdueCount}</p>
        </div>
        <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-sm">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-emerald-50 text-emerald-600 rounded-lg"><CheckCircle size={20} /></div>
            <h3 className="text-sm font-medium text-slate-600">อัตราการทบทวนเสร็จ</h3>
          </div>
          <p className="text-3xl font-bold text-slate-800">{completionRate}%</p>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-200 bg-slate-50/50 flex flex-col sm:flex-row gap-4 items-center justify-between">
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            <input
              type="text"
              placeholder="ค้นหาแผนก..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <Filter size={16} className="text-slate-400" />
            <select
              value={selectedDept}
              onChange={(e) => setSelectedDept(e.target.value)}
              className="border border-slate-300 rounded-lg text-sm px-3 py-2 w-full sm:w-48 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="ALL">ทุกแผนก</option>
              {departmentStats.map(s => (
                <option key={s.dept} value={s.dept}>{s.dept}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="bg-slate-50 text-slate-600 border-b border-slate-200">
              <tr>
                <th className="px-6 py-4 font-semibold">แผนก</th>
                <th className="px-6 py-4 font-semibold text-center">ต้องทบทวนทั้งหมด</th>
                <th className="px-6 py-4 font-semibold text-center">ใกล้ครบกำหนด</th>
                <th className="px-6 py-4 font-semibold text-center">เกินกำหนด</th>
                <th className="px-6 py-4 font-semibold text-center">กำลังดำเนินการ</th>
                <th className="px-6 py-4 font-semibold text-center">เสร็จแล้ว</th>
                <th className="px-6 py-4 font-semibold text-center">อัตราสำเร็จ</th>
                <th className="px-6 py-4 font-semibold text-right">รายละเอียด</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {filteredStats.map((stat, idx) => (
                <tr key={idx} className="hover:bg-slate-50 transition-colors">
                  <td className="px-6 py-4 font-medium text-slate-900">{stat.dept}</td>
                  <td className="px-6 py-4 text-center">{stat.total}</td>
                  <td className="px-6 py-4 text-center text-yellow-600 font-medium">{stat.dueSoon}</td>
                  <td className="px-6 py-4 text-center text-red-600 font-medium">{stat.overdue}</td>
                  <td className="px-6 py-4 text-center text-blue-600 font-medium">{stat.inProgress}</td>
                  <td className="px-6 py-4 text-center text-green-600 font-medium">{stat.completed}</td>
                  <td className="px-6 py-4 text-center">
                    {Math.round((stat.completed / stat.total) * 100)}%
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button className="text-indigo-600 hover:text-indigo-700 font-medium text-xs bg-indigo-50 px-3 py-1.5 rounded-lg inline-flex items-center gap-1">
                      ดูข้อมูล <ArrowRight size={14} />
                    </button>
                  </td>
                </tr>
              ))}
              {filteredStats.length === 0 && (
                <tr>
                  <td colSpan="8" className="px-6 py-12 text-center text-slate-500">
                    ไม่พบข้อมูลแผนก
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

export default PeriodicReviewControlBoard;
