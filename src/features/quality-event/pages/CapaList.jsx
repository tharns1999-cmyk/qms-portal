import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { qualityEventCapaService } from '../services/QualityEventCapaService';
import { Plus, Search, Filter } from 'lucide-react';
import dayjs from 'dayjs';

const CapaList = () => {
  const navigate = useNavigate();
  
  const [records, setRecords] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    qualityEventCapaService.getList().then(data => setRecords(data));
  }, []);

  const filteredRecords = records.filter(r => 
    r.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    r.recordNo?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="flex flex-col h-full bg-zinc-50">
      <div className="bg-white px-6 py-4 border-b flex justify-between items-center shrink-0">
        <div>
          <h1 className="text-xl font-bold text-zinc-900">CAPA / CAR-PAR Master List</h1>
          <p className="text-sm text-zinc-500">Quality Event Management</p>
        </div>
        <button
          onClick={() => navigate('/quality-event/capa/new')}
          className="flex items-center px-4 py-2 bg-zinc-900 text-white rounded-lg hover:bg-zinc-800 text-sm font-medium transition-colors"
        >
          <Plus size={16} className="mr-2" />
          Create New
        </button>
      </div>

      <div className="p-6 flex-1 overflow-auto">
        <div className="mb-6 flex gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" size={18} />
            <input
              type="text"
              placeholder="Search by Record No. or Title..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-zinc-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <button className="flex items-center px-4 py-2 border border-zinc-200 bg-white rounded-lg text-zinc-600 hover:bg-zinc-50">
            <Filter size={16} className="mr-2" />
            Filter
          </button>
        </div>

        <div className="bg-white rounded-xl border border-zinc-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm whitespace-nowrap">
              <thead className="bg-zinc-50 border-b border-zinc-200 text-zinc-500">
                <tr>
                  <th className="px-6 py-3 font-medium">Record No.</th>
                  <th className="px-6 py-3 font-medium">Type</th>
                  <th className="px-6 py-3 font-medium">Title</th>
                  <th className="px-6 py-3 font-medium">Status</th>
                  <th className="px-6 py-3 font-medium">Severity</th>
                  <th className="px-6 py-3 font-medium">Issue Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100">
                {filteredRecords.map(record => (
                  <tr 
                    key={record.id} 
                    onClick={() => navigate(`/quality-event/capa/${record.id}`)}
                    className="hover:bg-zinc-50 cursor-pointer transition-colors"
                  >
                    <td className="px-6 py-4 font-medium text-blue-600">{record.recordNo}</td>
                    <td className="px-6 py-4">
                      <span className="px-2.5 py-1 bg-zinc-100 rounded text-xs font-medium text-zinc-700">
                        {record.recordType}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="max-w-xs truncate text-zinc-900">{record.title}</div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="px-2.5 py-1 bg-blue-50 text-blue-700 rounded-full text-xs font-medium">
                        {record.status}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2.5 py-1 rounded text-xs font-medium ${
                        record.severity === 'CRITICAL' ? 'bg-red-50 text-red-700' :
                        record.severity === 'HIGH' ? 'bg-orange-50 text-orange-700' :
                        'bg-zinc-100 text-zinc-700'
                      }`}>
                        {record.severity}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-zinc-500">
                      {record.issueDate ? dayjs(record.issueDate).format('DD MMM YYYY') : '-'}
                    </td>
                  </tr>
                ))}
                {filteredRecords.length === 0 && (
                  <tr>
                    <td colSpan="6" className="px-6 py-12 text-center text-zinc-500">
                      No records found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CapaList;
