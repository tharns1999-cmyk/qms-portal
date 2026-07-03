import React, { useState } from 'react';
import useStore from '../../store/useStore';
import { Download, Search, ShieldAlert, History } from 'lucide-react';
import dayjs from 'dayjs';

const ActionLog = () => {
  const { actionLog, currentUser } = useStore();
  const [searchTerm, setSearchTerm] = useState('');

  // Protect route
  const isDccAdmin = currentUser.isDcc || currentUser.role === 'DCC_ADMIN' || currentUser.id === 'u5';

  if (!isDccAdmin) {
    return (
      <div className="flex flex-col items-center justify-center h-full pt-20">
        <ShieldAlert className="w-16 h-16 text-red-500 mb-4" />
        <h2 className="text-2xl font-bold text-gray-800">Access Denied</h2>
        <p className="text-gray-500 mt-2">Only DCC Admin can view the Action Log.</p>
      </div>
    );
  }

  const filteredLogs = actionLog.filter(log => 
    log.actionType.toLowerCase().includes(searchTerm.toLowerCase()) ||
    log.actor.toLowerCase().includes(searchTerm.toLowerCase()) ||
    log.details.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleExportCSV = () => {
    let csv = 'Log ID,Date/Time,Action,User,Role,Details\n';
    filteredLogs.forEach(log => {
      csv += `${log.id},${dayjs(log.date).format('DD/MM/YYYY HH:mm:ss')},${log.actionType},${log.actor},${log.actorRole},"${log.details.replace(/"/g, '""')}"\n`;
    });

    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `QMS_Action_Log_${dayjs().format('YYYYMMDD_HHmmss')}.csv`;
    document.body.appendChild(a);
    a.click();
    a.remove();
  };

  return (
    <div className="p-8 max-w-7xl mx-auto animate-in fade-in zoom-in-95 duration-300">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-800 flex items-center gap-3">
            <History className="w-8 h-8 text-indigo-600" />
            System Action Log
          </h1>
          <p className="text-gray-500 mt-1">Audit trail for all system activities</p>
        </div>
        <button
          onClick={handleExportCSV}
          className="bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-xl flex items-center gap-2 transition-all font-medium shadow-sm hover:shadow active:scale-95"
        >
          <Download className="w-5 h-5" />
          Export to CSV
        </button>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden flex flex-col h-[70vh]">
        <div className="p-4 border-b border-gray-100 bg-gray-50/50">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input 
              type="text" 
              placeholder="Search logs by action, user, or details..." 
              className="pl-10 pr-4 py-2 w-full rounded-xl border border-gray-200 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all outline-none"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        <div className="flex-1 overflow-auto">
          <table className="w-full text-left border-collapse">
            <thead className="bg-gray-50/80 sticky top-0 z-10 backdrop-blur-sm">
              <tr>
                <th className="py-4 px-6 text-xs font-semibold text-gray-500 uppercase tracking-wider border-b border-gray-200">Date / Time</th>
                <th className="py-4 px-6 text-xs font-semibold text-gray-500 uppercase tracking-wider border-b border-gray-200">Action Type</th>
                <th className="py-4 px-6 text-xs font-semibold text-gray-500 uppercase tracking-wider border-b border-gray-200">User</th>
                <th className="py-4 px-6 text-xs font-semibold text-gray-500 uppercase tracking-wider border-b border-gray-200 w-2/5">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredLogs.length > 0 ? (
                filteredLogs.map(log => (
                  <tr key={log.id} className="hover:bg-indigo-50/30 transition-colors">
                    <td className="py-3 px-6 whitespace-nowrap text-sm text-gray-600">
                      {dayjs(log.date).format('DD/MM/YYYY HH:mm:ss')}
                    </td>
                    <td className="py-3 px-6 whitespace-nowrap">
                      <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-indigo-50 text-indigo-700 border border-indigo-100">
                        {log.actionType}
                      </span>
                    </td>
                    <td className="py-3 px-6 whitespace-nowrap text-sm text-gray-800 font-medium">
                      {log.actor}
                      <span className="block text-xs text-gray-400 font-normal">{log.actorRole}</span>
                    </td>
                    <td className="py-3 px-6 text-sm text-gray-600">
                      {log.details}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="4" className="py-12 text-center text-gray-500">
                    No logs found matching your criteria.
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

export default ActionLog;
