import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Search, Calendar } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import useStore from '../../store/useStore';
import { getDueStateLabel, getReviewStatusLabel } from '../../services/PeriodicReviewService';

const MasterReviewSchedule = () => {
  const navigate = useNavigate();
  const { periodicReviewSchedules } = useStore();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('ALL');

  const schedules = periodicReviewSchedules || [];

  const filteredSchedules = schedules.filter(s => {
    const matchesSearch = s.documentNumber.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          s.documentName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = filterCategory === 'ALL' || s.documentCategory === filterCategory;
    return matchesSearch && matchesCategory;
  }).sort((a, b) => new Date(a.currentScheduledReviewDate) - new Date(b.currentScheduledReviewDate));

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Master Review Schedule</h1>
        <p className="text-slate-500 mt-1">ตารางทบทวนเอกสารทั้งหมด (DCC Master Schedule)</p>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden flex flex-col">
        <div className="p-4 border-b border-slate-200 bg-slate-50 flex flex-col sm:flex-row gap-4 justify-between items-center">
          <div className="relative w-full sm:w-96">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input 
              type="text" 
              placeholder="ค้นหา Document No. หรือชื่อเอกสาร..." 
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all shadow-sm"
            />
          </div>
          <div className="flex gap-2 w-full sm:w-auto">
            <select 
              value={filterCategory}
              onChange={e => setFilterCategory(e.target.value)}
              className="w-full sm:w-auto px-4 py-2 border border-slate-300 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 shadow-sm"
            >
              <option value="ALL">ทุกประเภท (All)</option>
              <option value="INTERNAL">เอกสารภายใน (Internal)</option>
              <option value="EXTERNAL">เอกสารภายนอก (External)</option>
            </select>
          </div>
        </div>

        <div className="overflow-x-auto flex-1">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200">
                <th className="py-3 px-4 text-sm font-semibold text-slate-600 bg-white sticky top-0">Document No.</th>
                <th className="py-3 px-4 text-sm font-semibold text-slate-600 bg-white sticky top-0">Name</th>
                <th className="py-3 px-4 text-sm font-semibold text-slate-600 bg-white sticky top-0">Type</th>
                <th className="py-3 px-4 text-sm font-semibold text-slate-600 bg-white sticky top-0">Anchor Date</th>
                <th className="py-3 px-4 text-sm font-semibold text-slate-600 bg-white sticky top-0">Next Review</th>
                <th className="py-3 px-4 text-sm font-semibold text-slate-600 bg-white sticky top-0">Due State</th>
                <th className="py-3 px-4 text-sm font-semibold text-slate-600 bg-white sticky top-0">Status</th>
                <th className="py-3 px-4 text-sm font-semibold text-slate-600 bg-white sticky top-0 text-right">Action</th>
              </tr>
            </thead>
            <tbody>
              {filteredSchedules.length > 0 ? (
                filteredSchedules.map((schedule, i) => {
                  const dueLabel = getDueStateLabel(schedule.dueState);
                  const statusLabel = getReviewStatusLabel(schedule.status);
                  return (
                    <motion.tr 
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.02 }}
                      key={schedule.id} 
                      className="border-b border-slate-100 hover:bg-slate-50 transition-colors"
                    >
                      <td className="py-3 px-4 text-sm font-medium text-slate-800">{schedule.documentNumber}</td>
                      <td className="py-3 px-4 text-sm text-slate-600 max-w-xs truncate" title={schedule.documentName}>{schedule.documentName}</td>
                      <td className="py-3 px-4 text-sm text-slate-600">
                        <span className={`px-2 py-0.5 rounded text-xs font-semibold ${schedule.documentCategory === 'INTERNAL' ? 'bg-indigo-100 text-indigo-700' : 'bg-emerald-100 text-emerald-700'}`}>
                          {schedule.documentCategory}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-sm text-slate-500">{schedule.originalReviewAnchorDate}</td>
                      <td className="py-3 px-4 text-sm font-medium text-slate-700">{schedule.currentScheduledReviewDate}</td>
                      <td className="py-3 px-4 text-sm">
                        <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${dueLabel.color}`}>
                          {dueLabel.label}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-sm">
                        <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${statusLabel.color}`}>
                          {statusLabel.label}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-sm text-right">
                        <button 
                          onClick={() => navigate(`/periodic-reviews/${schedule.id}`)}
                          className="px-3 py-1 bg-white border border-slate-300 rounded-lg text-indigo-600 font-medium hover:bg-indigo-50 transition-colors shadow-sm text-xs"
                        >
                          View Details
                        </button>
                      </td>
                    </motion.tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan="8" className="py-12 text-center text-slate-500">
                    <Calendar className="mx-auto h-12 w-12 text-slate-300 mb-3" />
                    <p>ไม่พบข้อมูลตารางการทบทวน</p>
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

export default MasterReviewSchedule;
