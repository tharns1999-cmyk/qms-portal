import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import useStore from '../../../store/useStore';
import { qualityEventComplaintService, COMPLAINT_STATUS } from '../services/QualityEventComplaintService';
import { 
  canViewComplaint, 
  getSafeComplaintView, 
  canAssignComplaintDepartment,
  canInvestigateComplaint,
  canReviewComplaintInvestigation,
  canRecordCustomerResponse,
  canApproveComplaint,
  canCloseComplaint,
  hasPermission,
  PERMISSIONS
} from '../../../utils/permissionHelper';

const ComplaintDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { currentUser, masterDepartments } = useStore();
  const [record, setRecord] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('Overview');

  // Form states for panels
  const [assignForm, setAssignForm] = useState({ responsibleDepartmentId: '', responsibleUserId: '', investigationDueDate: '', investigationInstruction: '' });
  const [investigationForm, setInvestigationForm] = useState({ investigationResult: '', rootCause: '', correction: '', prevention: '' });
  const [reviewForm, setReviewForm] = useState({ action: 'ACCEPT', reviewResult: '', reviewComment: '', capaRequired: false, ncrHoldRequired: false, linkedCapaId: '', linkedNcrHoldId: '' });
  const [responseForm, setResponseForm] = useState({ responseDate: '', responseDetail: '', replacement: false, recallWithdrawal: false, compensation: false, otherAction: '', submitForApproval: false });
  const [approvalForm, setApprovalForm] = useState({ action: 'APPROVED', approvalComment: '' });
  const [closureForm, setClosureForm] = useState({ closureResult: 'CLOSED_OK', closureComment: '', overrideJustification: '' });

  const fetchRecord = async () => {
    try {
      const rawRecord = await qualityEventComplaintService.getRecordById(id);
      
      if (!canViewComplaint(currentUser, rawRecord)) {
        setError('Access Denied: You do not have permission to view this Customer Complaint.');
        setLoading(false);
        return;
      }
      
      const safeRecord = getSafeComplaintView(currentUser, rawRecord);
      setRecord(safeRecord);
      setLoading(false);
    } catch {
      setError('Record not found or access denied.');
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRecord();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, currentUser]);

  const handleAction = async (actionFn, payload) => {
    try {
      await actionFn(record.id, payload, currentUser);
      await fetchRecord(); // refresh
    } catch (err) {
      alert(err.message);
    }
  };

  if (loading) return <div className="p-6 max-w-7xl mx-auto">Loading...</div>;

  if (error) {
    return (
      <div className="p-6 max-w-7xl mx-auto">
        <div className="bg-red-50 text-red-800 p-6 rounded-lg border border-red-200">
          <h2 className="text-xl font-bold mb-2">Access Denied</h2>
          <p>{error}</p>
          <button onClick={() => navigate('/quality-event/complaint')} className="mt-4 bg-red-600 text-white px-4 py-2 rounded shadow hover:bg-red-700 font-medium">
            Return to Complaint List
          </button>
        </div>
      </div>
    );
  }

  const tabs = [
    'Overview',
    'Customer Info',
    'Product / Lot',
    'Classification',
    'Health / Medical',
    'Investigation Assignment',
    'Investigation Details',
    'QAQC Review',
    'Customer Response',
    'PM Approval',
    'QAQC Closure',
    'Linked Records',
    'Audit Trail'
  ];

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex justify-between items-start mb-6">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-gray-900">{record.recordNo || record.id}</h1>
            <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-bold shadow-sm">
              {record.complaintStatus}
            </span>
          </div>
          <p className="text-gray-500 mt-1">FM-QC-68 Customer Complaint</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => navigate('/quality-event/complaint')} className="px-4 py-2 border border-gray-300 rounded text-gray-700 hover:bg-gray-50 font-medium bg-white shadow-sm">
            Back to List
          </button>
        </div>
      </div>

      <div className="grid grid-cols-12 gap-6">
        {/* Left Sidebar Tabs */}
        <div className="col-span-3">
          <div className="bg-white rounded-lg shadow border border-gray-200 overflow-hidden">
            <nav className="flex flex-col">
              {tabs.map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`text-left px-4 py-3 text-sm font-medium border-l-4 ${
                    activeTab === tab
                      ? 'border-blue-600 bg-blue-50 text-blue-700'
                      : 'border-transparent text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                  }`}
                >
                  {tab}
                </button>
              ))}
            </nav>
          </div>
        </div>

        {/* Right Content Area */}
        <div className="col-span-9 space-y-6">
          <div className="bg-white rounded-lg shadow p-6 border border-gray-200 min-h-[500px]">
            
            {activeTab === 'Overview' && (
              <div className="space-y-6">
                <h2 className="text-lg font-bold border-b pb-2">Overview</h2>
                <div className="grid grid-cols-2 gap-y-4 gap-x-8 text-sm">
                  <div><span className="text-gray-500 block">Received Date/Time</span><span className="font-medium text-gray-900">{record.receivedDate} {record.receivedTime}</span></div>
                  <div><span className="text-gray-500 block">Received Channel</span><span className="font-medium text-gray-900">{record.receivedChannel || '-'}</span></div>
                  <div><span className="text-gray-500 block">Product</span><span className="font-medium text-gray-900">{record.productName || '-'}</span></div>
                  <div><span className="text-gray-500 block">Severity</span>
                    {record.severity === 'HIGH' ? (
                      <span className="text-red-600 font-bold">HIGH</span>
                    ) : (
                      <span className="font-medium">{record.severity}</span>
                    )}
                  </div>
                </div>
                <div>
                  <span className="text-gray-500 block text-sm mb-1">Complaint Description</span>
                  <p className="text-gray-900 whitespace-pre-wrap bg-gray-50 p-3 rounded border border-gray-100">{record.complaintDescription}</p>
                </div>
              </div>
            )}

            {activeTab === 'Customer Info' && (
              <div className="space-y-6">
                <div className="flex justify-between items-center border-b pb-2">
                  <h2 className="text-lg font-bold">Customer Information</h2>
                  {!hasPermission(currentUser, PERMISSIONS.COMPLAINT_VIEW_ALL) && !hasPermission(currentUser, PERMISSIONS.COMPLAINT_CUSTOMER_RESPONSE) && (
                    <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded font-bold">RESTRICTED VIEW</span>
                  )}
                </div>
                <div className="grid grid-cols-2 gap-y-4 gap-x-8 text-sm">
                  <div><span className="text-gray-500 block">Customer Name</span><span className="font-medium">{record.customerName}</span></div>
                  <div><span className="text-gray-500 block">Contact Person</span><span className="font-medium">{record.contactPerson}</span></div>
                  <div className="col-span-2"><span className="text-gray-500 block">Address</span><span className="font-medium">{record.customerAddress}</span></div>
                  <div><span className="text-gray-500 block">Email</span><span className="font-medium">{record.email}</span></div>
                  <div><span className="text-gray-500 block">Phone</span><span className="font-medium">{record.telephone}</span></div>
                </div>
              </div>
            )}

            {activeTab === 'Product / Lot' && (
              <div className="space-y-6">
                <h2 className="text-lg font-bold border-b pb-2">Product & Lot Details</h2>
                <div className="grid grid-cols-2 gap-y-4 gap-x-8 text-sm">
                  <div><span className="text-gray-500 block">Product Name</span><span className="font-medium">{record.productName}</span></div>
                  <div><span className="text-gray-500 block">Lot No.</span><span className="font-medium">{record.lotNo}</span></div>
                  <div><span className="text-gray-500 block">Production Date</span><span className="font-medium">{record.productionDate}</span></div>
                  <div><span className="text-gray-500 block">Delivery Date</span><span className="font-medium">{record.deliveryDate}</span></div>
                  <div><span className="text-gray-500 block">Total Quantity</span><span className="font-medium">{record.totalQuantity}</span></div>
                  <div><span className="text-gray-500 block">Affected Quantity</span><span className="font-medium">{record.quantityAffected}</span></div>
                </div>
              </div>
            )}

            {activeTab === 'Classification' && (
              <div className="space-y-6">
                <h2 className="text-lg font-bold border-b pb-2">Classification</h2>
                <div className="flex gap-4">
                  <div className={`p-3 rounded border ${record.qualityRelated ? 'bg-blue-50 border-blue-200 text-blue-800' : 'bg-gray-50 border-gray-200 text-gray-500'}`}>
                    <span className="font-bold">Quality Related</span>: {record.qualityRelated ? 'Yes' : 'No'}
                  </div>
                  <div className={`p-3 rounded border ${record.foodSafetyRelated ? 'bg-red-50 border-red-200 text-red-800' : 'bg-gray-50 border-gray-200 text-gray-500'}`}>
                    <span className="font-bold">Food Safety Related</span>: {record.foodSafetyRelated ? 'Yes' : 'No'}
                  </div>
                </div>
                <div className="space-y-2 mt-4">
                  <div className="flex gap-2">
                    <span className="text-gray-500 text-sm">Product Hold Required:</span>
                    <span className="text-sm font-medium">{record.productHoldRequired ? 'Yes' : 'No'}</span>
                  </div>
                  <div className="flex gap-2">
                    <span className="text-gray-500 text-sm">Recall/Withdrawal Required:</span>
                    <span className="text-sm font-medium text-red-600">{record.recallWithdrawalFlag ? 'Yes' : 'No'}</span>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'Health / Medical' && (
              <div className="space-y-6">
                <div className="flex justify-between items-center border-b pb-2">
                  <h2 className="text-lg font-bold">Health / Medical</h2>
                  {!hasPermission(currentUser, PERMISSIONS.COMPLAINT_VIEW_ALL) && !hasPermission(currentUser, PERMISSIONS.COMPLAINT_CUSTOMER_RESPONSE) && (
                    <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded font-bold">RESTRICTED VIEW</span>
                  )}
                </div>
                <div className={`p-4 rounded border ${record.illnessOrInjury ? 'bg-purple-50 border-purple-200' : 'bg-gray-50 border-gray-200'}`}>
                  <h3 className={`font-bold mb-2 ${record.illnessOrInjury ? 'text-purple-800' : 'text-gray-600'}`}>
                    Illness or Injury Reported: {record.illnessOrInjury ? 'YES' : 'NO'}
                  </h3>
                  {record.illnessOrInjury && (
                    <div className="grid grid-cols-2 gap-4 text-sm mt-4">
                      <div><span className="text-gray-500 block">Symptoms</span><span className="font-medium text-purple-900">{record.symptoms}</span></div>
                      <div>
                        <span className="text-gray-500 block">Actions Taken</span>
                        <ul className="list-disc pl-4 text-purple-900 font-medium">
                          {record.seenDoctor && <li>Seen Doctor</li>}
                          {record.goneToHospital && <li>Hospitalized</li>}
                          {record.spokenToPublicHealth && <li>Public Health Informed</li>}
                        </ul>
                      </div>
                      <div className="col-span-2">
                        <span className="text-gray-500 block">Medical Details</span>
                        <p className="font-medium text-purple-900">{record.medicalDetails}</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {activeTab === 'Investigation Assignment' && (
              <div className="space-y-6">
                <h2 className="text-lg font-bold border-b pb-2">Investigation Assignment</h2>
                
                <div className="bg-gray-50 p-4 rounded border text-sm grid grid-cols-2 gap-4">
                  <div><span className="text-gray-500 block">Assigned Dept</span><span className="font-bold">{record.responsibleDepartmentId || 'Not Assigned'}</span></div>
                  <div><span className="text-gray-500 block">Due Date</span><span className="font-bold">{record.investigationDueDate || '-'}</span></div>
                  <div className="col-span-2"><span className="text-gray-500 block">Instructions</span><span className="whitespace-pre-wrap">{record.investigationInstruction || '-'}</span></div>
                </div>

                {canAssignComplaintDepartment(currentUser, record) && (
                  <div className="mt-8 border-t pt-6">
                    <h3 className="font-bold text-gray-900 mb-4">Update Assignment (QAQC Only)</h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Department</label>
                        <select 
                          className="w-full border-gray-300 rounded"
                          value={assignForm.responsibleDepartmentId}
                          onChange={e => setAssignForm({...assignForm, responsibleDepartmentId: e.target.value})}
                        >
                          <option value="">-- Select --</option>
                          {masterDepartments.map(d => (
                            d.isGroup ? d.subs.map(s => (
                              <option key={s.id} value={s.id}>{s.name}</option>
                            )) : <option key={d.id} value={d.id}>{d.name}</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Due Date</label>
                        <input 
                          type="date" 
                          className="w-full border-gray-300 rounded" 
                          value={assignForm.investigationDueDate}
                          onChange={e => setAssignForm({...assignForm, investigationDueDate: e.target.value})}
                        />
                      </div>
                      <div className="col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-1">Instructions</label>
                        <textarea 
                          rows="3" 
                          className="w-full border-gray-300 rounded"
                          value={assignForm.investigationInstruction}
                          onChange={e => setAssignForm({...assignForm, investigationInstruction: e.target.value})}
                        ></textarea>
                      </div>
                    </div>
                    <button 
                      onClick={() => handleAction(qualityEventComplaintService.assignDepartment.bind(qualityEventComplaintService), assignForm)}
                      className="mt-4 bg-blue-600 text-white px-4 py-2 rounded font-bold"
                    >
                      Update Assignment
                    </button>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'Investigation Details' && (
              <div className="space-y-6">
                <h2 className="text-lg font-bold border-b pb-2">Investigation Details</h2>
                
                {record.investigationSubmittedBy ? (
                  <div className="space-y-4">
                    <div className="bg-gray-50 p-4 rounded border text-sm">
                      <p><span className="text-gray-500 font-medium">Submitted By: </span> {record.investigationSubmittedBy} at {record.investigationSubmittedAt}</p>
                    </div>
                    <div><span className="font-bold text-gray-900 block mb-1">Investigation Result</span><p className="bg-white border p-3 rounded">{record.investigationResult}</p></div>
                    <div><span className="font-bold text-gray-900 block mb-1">Root Cause</span><p className="bg-white border p-3 rounded">{record.rootCause}</p></div>
                    <div><span className="font-bold text-gray-900 block mb-1">Correction</span><p className="bg-white border p-3 rounded">{record.correction}</p></div>
                    <div><span className="font-bold text-gray-900 block mb-1">Prevention</span><p className="bg-white border p-3 rounded">{record.prevention}</p></div>
                  </div>
                ) : (
                  <p className="text-gray-500 italic">No investigation details submitted yet.</p>
                )}

                {canInvestigateComplaint(currentUser, record) && [COMPLAINT_STATUS.ASSIGNED_TO_DEPARTMENT, COMPLAINT_STATUS.RETURNED_FOR_INVESTIGATION].includes(record.complaintStatus) && (
                  <div className="mt-8 border-t pt-6 bg-blue-50 p-4 rounded-lg border-blue-200 border">
                    <h3 className="font-bold text-blue-900 mb-4">Submit Investigation (Responsible Dept)</h3>
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Investigation Result</label>
                        <textarea className="w-full border-gray-300 rounded" rows="3" value={investigationForm.investigationResult} onChange={e => setInvestigationForm({...investigationForm, investigationResult: e.target.value})}></textarea>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Root Cause</label>
                        <textarea className="w-full border-gray-300 rounded" rows="2" value={investigationForm.rootCause} onChange={e => setInvestigationForm({...investigationForm, rootCause: e.target.value})}></textarea>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Correction (Immediate Action)</label>
                        <textarea className="w-full border-gray-300 rounded" rows="2" value={investigationForm.correction} onChange={e => setInvestigationForm({...investigationForm, correction: e.target.value})}></textarea>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Prevention (Corrective Action)</label>
                        <textarea className="w-full border-gray-300 rounded" rows="2" value={investigationForm.prevention} onChange={e => setInvestigationForm({...investigationForm, prevention: e.target.value})}></textarea>
                      </div>
                      <button 
                        onClick={() => handleAction(qualityEventComplaintService.submitInvestigation.bind(qualityEventComplaintService), investigationForm)}
                        className="bg-blue-600 text-white px-4 py-2 rounded font-bold shadow"
                      >
                        Submit Investigation
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'QAQC Review' && (
              <div className="space-y-6">
                <h2 className="text-lg font-bold border-b pb-2">QAQC Review</h2>
                
                {record.reviewResult ? (
                  <div className="bg-gray-50 p-4 rounded border text-sm space-y-3">
                    <p><strong className="text-gray-900">Review Status:</strong> <span className="text-blue-700 font-bold">{record.reviewResult}</span></p>
                    <p><strong className="text-gray-900">Comment:</strong> {record.reviewComment}</p>
                    <div className="flex gap-4 pt-2 border-t">
                      <span className={`px-2 py-1 rounded text-xs font-bold ${record.capaRequired ? 'bg-red-100 text-red-800' : 'bg-gray-200'}`}>CAPA Required: {record.capaRequired ? 'Yes' : 'No'}</span>
                      <span className={`px-2 py-1 rounded text-xs font-bold ${record.ncrHoldRequired ? 'bg-orange-100 text-orange-800' : 'bg-gray-200'}`}>NCR/HOLD Required: {record.ncrHoldRequired ? 'Yes' : 'No'}</span>
                    </div>
                  </div>
                ) : (
                  <p className="text-gray-500 italic">No QAQC review submitted yet.</p>
                )}

                {canReviewComplaintInvestigation(currentUser, record) && record.complaintStatus === COMPLAINT_STATUS.INVESTIGATION_SUBMITTED && (
                  <div className="mt-8 border-t pt-6">
                    <h3 className="font-bold text-gray-900 mb-4">Perform Review (QAQC)</h3>
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Action</label>
                        <select 
                          className="border-gray-300 rounded w-64"
                          value={reviewForm.action}
                          onChange={e => setReviewForm({...reviewForm, action: e.target.value})}
                        >
                          <option value="ACCEPT">Accept Investigation</option>
                          <option value="RETURN">Return for More Investigation</option>
                        </select>
                      </div>
                      
                      {reviewForm.action === 'ACCEPT' && (
                        <div className="flex gap-6 p-4 bg-gray-50 rounded border">
                          <label className="flex items-center gap-2 font-medium">
                            <input type="checkbox" checked={reviewForm.capaRequired} onChange={e => setReviewForm({...reviewForm, capaRequired: e.target.checked})} />
                            CAPA Required
                          </label>
                          <label className="flex items-center gap-2 font-medium">
                            <input type="checkbox" checked={reviewForm.ncrHoldRequired} onChange={e => setReviewForm({...reviewForm, ncrHoldRequired: e.target.checked})} />
                            NCR/HOLD Required
                          </label>
                        </div>
                      )}

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Review Comment</label>
                        <textarea className="w-full border-gray-300 rounded" rows="3" value={reviewForm.reviewComment} onChange={e => setReviewForm({...reviewForm, reviewComment: e.target.value})}></textarea>
                      </div>
                      
                      <button 
                        onClick={() => handleAction(qualityEventComplaintService.reviewInvestigation.bind(qualityEventComplaintService), {
                          ...reviewForm,
                          reviewResult: reviewForm.action === 'ACCEPT' ? 'ACCEPTED' : 'RETURNED'
                        })}
                        className="bg-blue-600 text-white px-4 py-2 rounded font-bold shadow"
                      >
                        Submit Review
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'Customer Response' && (
              <div className="space-y-6">
                <h2 className="text-lg font-bold border-b pb-2">Customer Response (Sales / Marketing)</h2>
                
                {record.responseDetail ? (
                  <div className="bg-gray-50 p-4 rounded border text-sm space-y-3">
                    <p><strong className="text-gray-900">Response Date:</strong> {record.responseDate}</p>
                    <p><strong className="text-gray-900">Responded By:</strong> {record.responseByUserId} ({record.responseDepartmentId})</p>
                    <p><strong className="text-gray-900 block mb-1">Detail:</strong> <span className="whitespace-pre-wrap">{record.responseDetail}</span></p>
                    
                    <div className="mt-4 pt-4 border-t border-gray-200">
                      <strong className="text-gray-900 block mb-2">Actions Agreed with Customer:</strong>
                      <div className="flex gap-4">
                        <span className={`px-2 py-1 rounded text-xs font-bold ${record.replacement ? 'bg-green-100 text-green-800' : 'bg-gray-200 text-gray-500'}`}>Replacement</span>
                        <span className={`px-2 py-1 rounded text-xs font-bold ${record.recallWithdrawal ? 'bg-red-100 text-red-800' : 'bg-gray-200 text-gray-500'}`}>Recall / Withdrawal</span>
                        <span className={`px-2 py-1 rounded text-xs font-bold ${record.compensation ? 'bg-yellow-100 text-yellow-800' : 'bg-gray-200 text-gray-500'}`}>Compensation</span>
                      </div>
                    </div>
                  </div>
                ) : (
                  <p className="text-gray-500 italic">No customer response recorded yet.</p>
                )}

                {canRecordCustomerResponse(currentUser, record) && [COMPLAINT_STATUS.PENDING_CUSTOMER_RESPONSE, COMPLAINT_STATUS.CUSTOMER_RESPONSE_RECORDED].includes(record.complaintStatus) && (
                  <div className="mt-8 border-t pt-6 bg-blue-50 p-4 rounded-lg border-blue-200 border">
                    <h3 className="font-bold text-blue-900 mb-4">Record Customer Response</h3>
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Response Date</label>
                        <input type="date" className="border-gray-300 rounded w-48" value={responseForm.responseDate} onChange={e => setResponseForm({...responseForm, responseDate: e.target.value})} />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Response Detail sent to Customer</label>
                        <textarea className="w-full border-gray-300 rounded" rows="4" value={responseForm.responseDetail} onChange={e => setResponseForm({...responseForm, responseDetail: e.target.value})}></textarea>
                      </div>
                      
                      <div>
                        <label className="block text-sm font-bold text-gray-700 mb-2">Customer Actions Required</label>
                        <div className="flex gap-6 p-4 bg-white rounded border border-gray-200">
                          <label className="flex items-center gap-2 font-medium">
                            <input type="checkbox" checked={responseForm.replacement} onChange={e => setResponseForm({...responseForm, replacement: e.target.checked})} />
                            Replacement
                          </label>
                          <label className="flex items-center gap-2 font-medium text-red-700">
                            <input type="checkbox" checked={responseForm.recallWithdrawal} onChange={e => setResponseForm({...responseForm, recallWithdrawal: e.target.checked})} />
                            Recall / Withdrawal
                          </label>
                          <label className="flex items-center gap-2 font-medium text-yellow-700">
                            <input type="checkbox" checked={responseForm.compensation} onChange={e => setResponseForm({...responseForm, compensation: e.target.checked})} />
                            Compensation
                          </label>
                        </div>
                      </div>

                      <div className="flex gap-4 mt-6">
                        <button 
                          onClick={() => handleAction(qualityEventComplaintService.recordCustomerResponse.bind(qualityEventComplaintService), { ...responseForm, submitForApproval: false })}
                          className="bg-white border border-blue-600 text-blue-600 px-4 py-2 rounded font-bold shadow-sm"
                        >
                          Save Draft
                        </button>
                        <button 
                          onClick={() => handleAction(qualityEventComplaintService.recordCustomerResponse.bind(qualityEventComplaintService), { ...responseForm, submitForApproval: true })}
                          className="bg-blue-600 text-white px-4 py-2 rounded font-bold shadow"
                        >
                          Submit for Plant Manager Approval
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'PM Approval' && (
              <div className="space-y-6">
                <h2 className="text-lg font-bold border-b pb-2">Plant Manager Approval</h2>
                
                {record.approvedBy ? (
                  <div className="bg-gray-50 p-4 rounded border text-sm space-y-2">
                    <p><strong className="text-gray-900">Status:</strong> <span className="font-bold text-green-700">{record.plantManagerApprovalStatus}</span></p>
                    <p><strong className="text-gray-900">Approved By:</strong> {record.approvedBy} at {record.approvedAt}</p>
                    <p><strong className="text-gray-900">Comment:</strong> {record.approvalComment}</p>
                  </div>
                ) : (
                  <p className="text-gray-500 italic">No PM approval recorded.</p>
                )}

                {canApproveComplaint(currentUser, record) && record.complaintStatus === COMPLAINT_STATUS.PENDING_PLANT_MANAGER_APPROVAL && (
                  <div className="mt-8 border-t pt-6 bg-yellow-50 p-4 rounded-lg border-yellow-200 border">
                    <h3 className="font-bold text-yellow-900 mb-4">Management Approval</h3>
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Decision</label>
                        <select 
                          className="border-gray-300 rounded w-64"
                          value={approvalForm.action}
                          onChange={e => setApprovalForm({...approvalForm, action: e.target.value})}
                        >
                          <option value="APPROVED">Approve (Proceed to Close)</option>
                          <option value="RETURNED">Return to Sales/Marketing</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Approval Comment</label>
                        <textarea className="w-full border-gray-300 rounded" rows="3" value={approvalForm.approvalComment} onChange={e => setApprovalForm({...approvalForm, approvalComment: e.target.value})}></textarea>
                      </div>
                      <button 
                        onClick={() => handleAction(qualityEventComplaintService.submitComplaintApproval.bind(qualityEventComplaintService), approvalForm)}
                        className="bg-yellow-600 text-white px-6 py-2 rounded font-bold shadow"
                      >
                        Submit Decision
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'QAQC Closure' && (
              <div className="space-y-6">
                <h2 className="text-lg font-bold border-b pb-2">QAQC Closure</h2>
                
                {record.closedBy ? (
                  <div className="bg-gray-50 p-4 rounded border text-sm space-y-2">
                    <p><strong className="text-gray-900">Closed By:</strong> {record.closedBy} at {record.closedAt}</p>
                    <p><strong className="text-gray-900">Result:</strong> {record.closureResult}</p>
                    <p><strong className="text-gray-900">Comment:</strong> {record.closureComment}</p>
                  </div>
                ) : (
                  <p className="text-gray-500 italic">Not closed yet.</p>
                )}

                {canCloseComplaint(currentUser, record) && [COMPLAINT_STATUS.APPROVED, COMPLAINT_STATUS.PENDING_QAQC_CLOSURE].includes(record.complaintStatus) && (
                  <div className="mt-8 border-t pt-6">
                    <h3 className="font-bold text-gray-900 mb-4">Close Customer Complaint</h3>
                    
                    {record.capaRequired && !record.linkedCapaId && (
                      <div className="bg-red-50 text-red-800 p-4 rounded border border-red-200 mb-4">
                        <strong className="block mb-2">WARNING: Linked CAPA is missing.</strong>
                        <p className="text-sm mb-4">This complaint requires a CAPA, but no CAPA is linked. You must provide an override justification to force close.</p>
                        <input 
                          type="text" 
                          placeholder="Override Justification..." 
                          className="w-full border-red-300 rounded text-sm"
                          value={closureForm.overrideJustification}
                          onChange={e => setClosureForm({...closureForm, overrideJustification: e.target.value})}
                        />
                      </div>
                    )}

                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Closure Result</label>
                        <select 
                          className="border-gray-300 rounded w-64"
                          value={closureForm.closureResult}
                          onChange={e => setClosureForm({...closureForm, closureResult: e.target.value})}
                        >
                          <option value="CLOSED_OK">Closed - Satisfactory</option>
                          <option value="CLOSED_WITH_RESERVATION">Closed - With Reservation</option>
                          <option value="CANCELLED">Cancelled</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Closure Comment</label>
                        <textarea className="w-full border-gray-300 rounded" rows="3" value={closureForm.closureComment} onChange={e => setClosureForm({...closureForm, closureComment: e.target.value})}></textarea>
                      </div>
                      <button 
                        onClick={() => handleAction(qualityEventComplaintService.closeComplaint.bind(qualityEventComplaintService), closureForm)}
                        className="bg-blue-600 text-white px-6 py-2 rounded font-bold shadow hover:bg-blue-700"
                        disabled={record.capaRequired && !record.linkedCapaId && !closureForm.overrideJustification}
                      >
                        Sign & Close Complaint
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'Linked Records' && (
              <div className="space-y-6">
                <h2 className="text-lg font-bold border-b pb-2">Linked Records</h2>
                <div className="bg-gray-50 rounded-lg p-6 border border-gray-200">
                  <div className="grid grid-cols-2 gap-6">
                    <div className="bg-white p-4 border rounded shadow-sm">
                      <h3 className="font-bold text-gray-800 mb-2">Linked CAPA</h3>
                      {record.linkedCapaId ? (
                        <div className="flex items-center gap-2">
                          <span className="text-blue-600 font-bold hover:underline cursor-pointer" onClick={() => navigate(`/quality-event/capa/${record.linkedCapaId}`)}>{record.linkedCapaId}</span>
                        </div>
                      ) : (
                        <p className="text-sm text-gray-500">{record.capaRequired ? 'Required, but not yet linked' : 'None linked'}</p>
                      )}
                    </div>
                    <div className="bg-white p-4 border rounded shadow-sm">
                      <h3 className="font-bold text-gray-800 mb-2">Linked NCR / HOLD</h3>
                      {record.linkedNcrHoldId ? (
                        <div className="flex items-center gap-2">
                          <span className="text-blue-600 font-bold hover:underline cursor-pointer" onClick={() => navigate(`/quality-event/ncr/${record.linkedNcrHoldId}`)}>{record.linkedNcrHoldId}</span>
                        </div>
                      ) : (
                        <p className="text-sm text-gray-500">{record.ncrHoldRequired ? 'Required, but not yet linked' : 'None linked'}</p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'Audit Trail' && (
              <div className="space-y-6">
                <h2 className="text-lg font-bold border-b pb-2">Audit Trail</h2>
                <div className="relative border-l-2 border-gray-200 ml-4 space-y-6 pb-4 mt-6">
                  {record.auditTrail && record.auditTrail.map((event, idx) => (
                    <div key={idx} className="relative pl-6">
                      <span className="absolute -left-[9px] top-1 h-4 w-4 rounded-full bg-blue-500 border-2 border-white"></span>
                      <div className="bg-gray-50 border border-gray-100 p-3 rounded shadow-sm inline-block min-w-[300px]">
                        <p className="font-bold text-sm text-gray-900">{event.action}</p>
                        <p className="text-xs text-gray-500 my-1">{new Date(event.timestamp).toLocaleString()} by {event.actorName || event.actorId}</p>
                        <p className="text-sm text-gray-700 mt-2 whitespace-pre-wrap">{event.details}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

          </div>
        </div>
      </div>
    </div>
  );
};

export default ComplaintDetail;
