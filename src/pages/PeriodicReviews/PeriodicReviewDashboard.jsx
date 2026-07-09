import React from 'react';
import { motion } from 'framer-motion';
import { Calendar, Clock, AlertTriangle, CheckCircle, FileText, Globe } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import useStore from '../../store/useStore';

const DashboardCard = ({ title, value, icon: Icon, colorClass, delay, onClick }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.5, delay }}
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
  </motion.div>
);

const PeriodicReviewDashboard = () => {
  const navigate = useNavigate();
  const { periodicReviewSchedules, periodicReviewTasks, currentUser } = useStore();
  
  const schedules = periodicReviewSchedules || [];
  const tasks = periodicReviewTasks || [];

  const internalSchedules = schedules.filter(s => s.documentCategory === 'INTERNAL' && s.isActive);
  const externalSchedules = schedules.filter(s => s.documentCategory === 'EXTERNAL' && s.isActive);
  
  const actionRequiredTasks = tasks.filter(t => t.status === 'ACTION_REQUIRED');
  const overdueTasks = tasks.filter(t => t.status === 'ACTION_REQUIRED' && (t.dueState === 'OVERDUE' || t.dueState === 'ESCALATED'));
  const myTasks = tasks.filter(t => t.status === 'ACTION_REQUIRED' && t.assignedToUserId === currentUser.id);

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Periodic Review Dashboard</h1>
          <p className="text-slate-500 mt-1">ภาพรวมการทบทวนเอกสารตามรอบ (Internal 1 ปี, External 2 ปี)</p>
        </div>
        <div className="flex gap-3">
          <button 
            onClick={() => navigate('/periodic-reviews/my-tasks')}
            className="px-4 py-2 bg-white border border-slate-300 rounded-xl text-slate-700 font-medium hover:bg-slate-50 transition-colors shadow-sm"
          >
            งานของฉัน ({myTasks.length})
          </button>
          <button 
            onClick={() => navigate('/periodic-reviews/schedule')}
            className="px-4 py-2 bg-indigo-600 text-white rounded-xl font-medium hover:bg-indigo-700 transition-colors shadow-sm"
          >
            ดูตารางทั้งหมด
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <DashboardCard 
          title="งานทบทวนที่ต้องจัดการ" 
          value={actionRequiredTasks.length} 
          icon={Clock} 
          colorClass="from-blue-500 to-indigo-600" 
          delay={0.1}
          onClick={() => navigate('/periodic-reviews/schedule')}
        />
        <DashboardCard 
          title="เกินกำหนด (Overdue)" 
          value={overdueTasks.length} 
          icon={AlertTriangle} 
          colorClass="from-red-500 to-rose-600" 
          delay={0.2}
          onClick={() => navigate('/periodic-reviews/schedule')}
        />
        <DashboardCard 
          title="เอกสารภายในทั้งหมด" 
          value={internalSchedules.length} 
          icon={FileText} 
          colorClass="from-emerald-500 to-teal-600" 
          delay={0.3}
          onClick={() => navigate('/periodic-reviews/schedule')}
        />
        <DashboardCard 
          title="เอกสารภายนอกทั้งหมด" 
          value={externalSchedules.length} 
          icon={Globe} 
          colorClass="from-orange-400 to-amber-600" 
          delay={0.4}
          onClick={() => navigate('/periodic-reviews/schedule')}
        />
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
        <h2 className="text-lg font-semibold text-slate-800 mb-4 flex items-center gap-2">
          <Calendar className="text-indigo-600" size={20} />
          ตารางทบทวนที่ใกล้ถึงกำหนด (Due Soon)
        </h2>
        
        {actionRequiredTasks.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200">
                  <th className="py-3 px-4 text-sm font-semibold text-slate-600 bg-slate-50 rounded-tl-xl">Document No.</th>
                  <th className="py-3 px-4 text-sm font-semibold text-slate-600 bg-slate-50">Document Name</th>
                  <th className="py-3 px-4 text-sm font-semibold text-slate-600 bg-slate-50">Due Date</th>
                  <th className="py-3 px-4 text-sm font-semibold text-slate-600 bg-slate-50">Status</th>
                  <th className="py-3 px-4 text-sm font-semibold text-slate-600 bg-slate-50 rounded-tr-xl text-right">Action</th>
                </tr>
              </thead>
              <tbody>
                {actionRequiredTasks.slice(0, 5).map(task => (
                  <tr key={task.id} className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
                    <td className="py-3 px-4 text-sm font-medium text-slate-800">{task.documentNumber}</td>
                    <td className="py-3 px-4 text-sm text-slate-600">{task.documentName}</td>
                    <td className="py-3 px-4 text-sm text-slate-600">{task.dueDate}</td>
                    <td className="py-3 px-4 text-sm">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${
                        task.dueState === 'OVERDUE' || task.dueState === 'ESCALATED' ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-700'
                      }`}>
                        {task.dueState.replace(/_/g, ' ')}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-sm text-right">
                      <button 
                        onClick={() => navigate(`/periodic-reviews/${task.scheduleId}`)}
                        className="text-indigo-600 font-medium hover:text-indigo-800"
                      >
                        View Details
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-12 text-slate-500">
            <CheckCircle className="w-12 h-12 mx-auto text-slate-300 mb-3" />
            <p>ไม่มีเอกสารที่ใกล้ถึงกำหนดทบทวนในขณะนี้</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default PeriodicReviewDashboard;
