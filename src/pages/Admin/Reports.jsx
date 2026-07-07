import React from 'react';
import useStore from '../../store/useStore';
import toast from 'react-hot-toast';
import { Download, FileText, AlertTriangle } from 'lucide-react';

const Reports = () => {
  const { dars, tasks } = useStore();
  
  const handleExport = (reportName) => {
    toast.success(`Exporting ${reportName} to CSV...`);
  };

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-bold text-gray-800 ">Reports & Analytics</h2>
        <p className="text-gray-500  mt-1">Dashboard รายงานสำหรับผู้ดูแลระบบและฝ่ายคุณภาพ</p>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-2">
            <FileText className="text-blue-600" size={24} strokeWidth={1.25}/>
            <h3 className="text-lg font-bold text-gray-800 ">DAR Register Report</h3>
          </div>
          <button 
            onClick={() => handleExport('DAR Register')}
            className="flex items-center gap-2 px-3 py-1.5 border border-gray-300 rounded-md text-gray-700  hover:bg-gray-50 text-sm font-medium"
          >
            <Download size={20} strokeWidth={1.25}/> Export CSV
          </button>
        </div>
        
        <div className="overflow-hidden border border-gray-100 rounded-lg">
          <table className="w-full text-left text-sm text-gray-600 ">
            <thead className="bg-gray-50 text-gray-500  uppercase">
              <tr>
                <th className="px-6 py-3 font-medium">DAR ID</th>
                <th className="px-6 py-3 font-medium">Title</th>
                <th className="px-6 py-3 font-medium">Type</th>
                <th className="px-6 py-3 font-medium">Status</th>
                <th className="px-6 py-3 font-medium">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {dars.map((dar) => (
                <tr key={dar.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 font-medium text-gray-900 ">{dar.id}</td>
                  <td className="px-6 py-4">{dar.title}</td>
                  <td className="px-6 py-4">{dar.type}</td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${dar.status === 'CANCELLED' ? 'bg-red-100 text-red-700 ' : 'bg-gray-100 text-gray-700 '}`}>
                      {dar.status}
                    </span>
                  </td>
                  <td className="px-6 py-4">{dar.date}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-2">
            <AlertTriangle className="text-orange-500" size={24} strokeWidth={1.25}/>
            <h3 className="text-lg font-bold text-gray-800 ">Task Overdue Report</h3>
          </div>
          <button 
            onClick={() => handleExport('Task Overdue')}
            className="flex items-center gap-2 px-3 py-1.5 border border-gray-300 rounded-md text-gray-700  hover:bg-gray-50 text-sm font-medium"
          >
            <Download size={20} strokeWidth={1.25}/> Export CSV
          </button>
        </div>
        
        <div className="overflow-hidden border border-gray-100 rounded-lg">
          <table className="w-full text-left text-sm text-gray-600 ">
            <thead className="bg-gray-50 text-gray-500  uppercase">
              <tr>
                <th className="px-6 py-3 font-medium">Task ID</th>
                <th className="px-6 py-3 font-medium">DAR ID</th>
                <th className="px-6 py-3 font-medium">Assignee</th>
                <th className="px-6 py-3 font-medium">Due Date</th>
                <th className="px-6 py-3 font-medium">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {tasks.filter(t => t.status === 'OVERDUE').map((task) => (
                <tr key={task.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 font-medium text-gray-900 ">{task.id}</td>
                  <td className="px-6 py-4">{task.darId}</td>
                  <td className="px-6 py-4">{task.assigneeId}</td>
                  <td className="px-6 py-4 text-red-600  font-medium">{task.dueDate}</td>
                  <td className="px-6 py-4">
                    <span className="px-2 py-1 bg-red-100 text-red-700  rounded-full text-xs font-medium">
                      OVERDUE
                    </span>
                  </td>
                </tr>
              ))}
              {tasks.filter(t => t.status === 'OVERDUE').length === 0 && (
                <tr><td colSpan="5" className="px-6 py-8 text-center text-gray-500 ">No overdue tasks found</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Reports;
