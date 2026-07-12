import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import useStore from '../../../store/useStore';
import { qualityEventNcrService } from '../services/QualityEventNcrService';
import { canCreateNcr, canCreateHold, canViewNcrHold } from '../../../utils/permissionHelper';
import { AlertCircle, Plus, Search, Filter } from 'lucide-react';

const NcrList = () => {
  const navigate = useNavigate();
  const { currentUser } = useStore();
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRecords = async () => {
      const data = await qualityEventNcrService.getAll();
      const filtered = data.filter(record => canViewNcrHold(currentUser, record));
      setRecords(filtered);
      setLoading(false);
    };
    if (currentUser) {
      fetchRecords();
    }
  }, [currentUser]);

  const hasCreatePerm = canCreateNcr(currentUser) || canCreateHold(currentUser);

  if (loading) return <div className="p-8">Loading...</div>;

  return (
    <div className="flex flex-col h-full bg-zinc-50">
      <div className="bg-white px-6 py-4 border-b shrink-0 flex justify-between items-center">
        <div>
          <h1 className="text-xl font-bold text-zinc-900">NCR / HOLD Management</h1>
          <p className="text-sm text-zinc-500">Quality Nonconformance and Product Hold</p>
        </div>
        {hasCreatePerm && (
          <button
            onClick={() => navigate('/quality-event/ncr/new')}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
          >
            <Plus size={18} /> New NCR / HOLD
          </button>
        )}
      </div>

      <div className="bg-white px-6 py-3 border-b shrink-0 flex gap-4 items-center">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" size={18} />
          <input
            type="text"
            placeholder="Search NCR or HOLD number..."
            className="w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <button className="flex items-center gap-2 px-4 py-2 border rounded-lg text-zinc-600 hover:bg-zinc-50 font-medium">
          <Filter size={18} /> Filters
        </button>
      </div>

      <div className="flex-1 overflow-auto p-6">
        <div className="bg-white border rounded-xl overflow-hidden">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="bg-zinc-50 border-b text-zinc-500">
              <tr>
                <th className="px-4 py-3 font-medium">Record No.</th>
                <th className="px-4 py-3 font-medium">Hold No.</th>
                <th className="px-4 py-3 font-medium">Type</th>
                <th className="px-4 py-3 font-medium">Product/Material</th>
                <th className="px-4 py-3 font-medium">Resp. Dept</th>
                <th className="px-4 py-3 font-medium">NCR Status</th>
                <th className="px-4 py-3 font-medium">Hold Status</th>
                <th className="px-4 py-3 font-medium">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {records.map(record => (
                <tr key={record.id} className="hover:bg-zinc-50">
                  <td className="px-4 py-3 font-medium text-blue-600">
                    {record.recordNo || '-'}
                  </td>
                  <td className="px-4 py-3 font-medium text-orange-600">
                    {record.holdNo || '-'}
                  </td>
                  <td className="px-4 py-3">
                    <span className="px-2 py-1 bg-zinc-100 text-zinc-700 rounded text-xs">{record.recordType}</span>
                  </td>
                  <td className="px-4 py-3">{record.productName || record.materialName || record.packagingName}</td>
                  <td className="px-4 py-3">{record.responsibleDepartmentId || '-'}</td>
                  <td className="px-4 py-3">
                    <span className="px-2 py-1 bg-blue-50 text-blue-700 rounded text-xs">{record.ncrStatus}</span>
                  </td>
                  <td className="px-4 py-3">
                     <span className={`px-2 py-1 rounded text-xs font-medium ${
                       record.holdStatus === 'HOLD_ACTIVE' ? 'bg-orange-100 text-orange-800' : 
                       record.holdStatus === 'NOT_REQUIRED' ? 'bg-zinc-100 text-zinc-500' :
                       'bg-green-100 text-green-800'
                     }`}>
                       {record.holdStatus}
                     </span>
                  </td>
                  <td className="px-4 py-3">
                    <button 
                      onClick={() => navigate(`/quality-event/ncr/${record.id}`)}
                      className="text-blue-600 hover:underline font-medium"
                    >
                      View
                    </button>
                  </td>
                </tr>
              ))}
              {records.length === 0 && (
                <tr>
                  <td colSpan="8" className="px-4 py-8 text-center text-zinc-500">
                    <AlertCircle className="mx-auto mb-2 text-zinc-400" size={24} />
                    No records found
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

export default NcrList;
