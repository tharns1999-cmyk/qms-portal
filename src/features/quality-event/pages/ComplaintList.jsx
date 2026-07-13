import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import useStore from '../../../store/useStore';
import { qualityEventComplaintService, COMPLAINT_STATUS } from '../services/QualityEventComplaintService';
import { canCreateComplaint, canViewComplaint, getSafeComplaintView } from '../../../utils/permissionHelper';

const ComplaintList = () => {
  const navigate = useNavigate();
  const { currentUser } = useStore();
  const [activeTab, setActiveTab] = useState('All Complaints');
  const [records, setRecords] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const fetchRecords = async () => {
      const allRecords = await qualityEventComplaintService.getAllRecords();
      
      // Filter records that current user can view
      const viewableRecords = allRecords.filter(r => canViewComplaint(currentUser, r));
      
      // Mask sensitive fields
      const safeRecords = viewableRecords.map(r => getSafeComplaintView(currentUser, r));
      
      setRecords(safeRecords);
    };
    fetchRecords();
  }, [currentUser]);

  const tabs = [
    'All Complaints',
    'My Department',
    'Assigned Investigation',
    'Pending QAQC Review',
    'Pending Customer Response',
    'Pending Plant Manager Approval',
    'Food Safety',
    'High Risk',
    'Closed',
    'Overdue'
  ];

  const filteredRecords = useMemo(() => {
    return records.filter(r => {
      // Search term
      if (searchTerm) {
        const searchLower = searchTerm.toLowerCase();
        const matchesSearch = (r.recordNo?.toLowerCase().includes(searchLower)) ||
                              (r.customerName?.toLowerCase().includes(searchLower)) ||
                              (r.productName?.toLowerCase().includes(searchLower));
        if (!matchesSearch) return false;
      }

      // Tab filtering
      switch (activeTab) {
        case 'My Department':
          return r.responsibleDepartmentId === currentUser.department || r.responseDepartmentId === currentUser.department;
        case 'Assigned Investigation':
          return r.complaintStatus === COMPLAINT_STATUS.ASSIGNED_TO_DEPARTMENT || r.complaintStatus === COMPLAINT_STATUS.RETURNED_FOR_INVESTIGATION;
        case 'Pending QAQC Review':
          return r.complaintStatus === COMPLAINT_STATUS.INVESTIGATION_SUBMITTED;
        case 'Pending Customer Response':
          return r.complaintStatus === COMPLAINT_STATUS.PENDING_CUSTOMER_RESPONSE;
        case 'Pending Plant Manager Approval':
          return r.complaintStatus === COMPLAINT_STATUS.PENDING_PLANT_MANAGER_APPROVAL;
        case 'Food Safety':
          return r.foodSafetyRelated === true;
        case 'High Risk':
          return r.severity === 'HIGH';
        case 'Closed':
          return r.complaintStatus === COMPLAINT_STATUS.CLOSED;
        case 'Overdue':
          if (!r.investigationDueDate) return false;
          return new Date(r.investigationDueDate) < new Date() && r.complaintStatus !== COMPLAINT_STATUS.CLOSED;
        case 'All Complaints':
        default:
          return true;
      }
    });
  }, [records, activeTab, searchTerm, currentUser]);

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Customer Complaints</h1>
          <p className="text-gray-500 text-sm mt-1">Manage FM-QC-68 workflows</p>
        </div>
        {canCreateComplaint(currentUser) && (
          <button
            onClick={() => navigate('/quality-event/complaint/new')}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 shadow flex items-center gap-2"
          >
            <span>+</span>
            <span>New Complaint</span>
          </button>
        )}
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        {/* Tabs */}
        <div className="border-b border-gray-200 overflow-x-auto">
          <nav className="flex px-4" aria-label="Tabs">
            {tabs.map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`shrink-0 px-4 py-3 text-sm font-medium border-b-2 whitespace-nowrap ${
                  activeTab === tab
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                {tab}
              </button>
            ))}
          </nav>
        </div>

        {/* Filters bar */}
        <div className="p-4 border-b border-gray-200 flex gap-4">
          <input
            type="text"
            placeholder="Search Record No, Customer, Product..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="border border-gray-300 rounded-md px-3 py-2 w-80 text-sm focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Record No.</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Severity / Risk</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Customer</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Product</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Assigned Dept</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Due Date</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Action</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredRecords.length > 0 ? (
                filteredRecords.map((record) => (
                  <tr key={record.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-blue-600">
                      <button onClick={() => navigate(`/quality-event/complaint/${record.id}`)} className="hover:underline">
                        {record.recordNo || record.id}
                      </button>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">
                        {record.complaintStatus}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {record.severity === 'HIGH' ? (
                        <span className="text-red-600 font-bold">HIGH</span>
                      ) : (
                        record.severity
                      )}
                      {record.foodSafetyRelated && (
                        <span className="ml-2 text-red-600 text-xs font-bold border border-red-200 bg-red-50 px-1 rounded">FS</span>
                      )}
                      {record.illnessOrInjury && (
                        <span className="ml-2 text-purple-600 text-xs font-bold border border-purple-200 bg-purple-50 px-1 rounded">MED</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{record.customerName}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{record.productName}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{record.responsibleDepartmentId || '-'}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{record.investigationDueDate || '-'}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button 
                        onClick={() => navigate(`/quality-event/complaint/${record.id}`)}
                        className="text-blue-600 hover:text-blue-900"
                      >
                        View
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="8" className="px-6 py-12 text-center text-gray-500 text-sm">
                    No records found matching criteria.
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

export default ComplaintList;
