import React, { useState, useEffect } from 'react';
import { DocumentImpact, DccLinkageType, DccLinkageStatus, NC_PERMISSIONS } from '../domain/models';
import { ncCapaDccLinkageService } from '../services/NcCapaDccLinkageService';
import { ncCapaAuditService } from '../services/NcCapaAuditService';
import { ncCapaAccessService } from '../services/NcCapaAccessService';
import useStore from '../../../store/useStore';
import { Link, FileText, CheckCircle, Clock, XCircle, AlertCircle, Plus, Search, Trash2 } from 'lucide-react';

const NcCapaDccLinkageTab = ({ record, currentUser }) => {
  const [linkage, setLinkage] = useState(null);
  const [auditEvents, setAuditEvents] = useState([]);
  const [error, setError] = useState('');
  
  // Picker state
  const [pickerType, setPickerType] = useState('DAR'); // DAR or PERIODIC_REVIEW
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedExistingId, setSelectedExistingId] = useState('');

  const store = useStore();
  const dars = store.dars || [];

  const loadData = () => {
    const l = ncCapaDccLinkageService.getLinkageForNc(record.id);
    setLinkage(l);
    
    // Get DCC related audit events
    const allEvents = ncCapaAuditService.getEventsForNc(record.id);
    setAuditEvents(allEvents.filter(e => e.action.startsWith('DCC_')));
  };

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [record.id]);

  const docImpact = record?.capaActionPlan?.documentImpactAssessment || DocumentImpact.NO_DOCUMENT_IMPACT;
  
  const canCreate = ncCapaAccessService.hasPermission(currentUser, NC_PERMISSIONS.DCC_LINK_CREATE) || 
                    ncCapaAccessService.hasPermission(currentUser, NC_PERMISSIONS.ADMIN);
  const canRemove = ncCapaAccessService.hasPermission(currentUser, NC_PERMISSIONS.DCC_LINK_REMOVE) || 
                    ncCapaAccessService.hasPermission(currentUser, NC_PERMISSIONS.ADMIN);

  const handleCreateWorkflow = () => {
    try {
      setError('');
      ncCapaDccLinkageService.createDccWorkflow(record.id, docImpact, currentUser);
      loadData();
      store.addNotification('DCC workflow draft created and linked', 'success');
    } catch (err) {
      setError(err.message);
    }
  };

  const handleLinkExisting = () => {
    try {
      setError('');
      if (!selectedExistingId) throw new Error('Please select a workflow to link');
      
      const linkType = pickerType === 'DAR' ? DccLinkageType.EXISTING_DAR_LINKED : DccLinkageType.EXISTING_PERIODIC_REVIEW_LINKED;
      ncCapaDccLinkageService.linkExistingWorkflow(record.id, selectedExistingId, linkType, currentUser);
      loadData();
      store.addNotification('Workflow linked successfully', 'success');
      setSelectedExistingId('');
    } catch (err) {
      setError(err.message);
    }
  };

  const handleRemoveLink = (linkId) => {
    try {
      setError('');
      ncCapaDccLinkageService.removeLinkage(record.id, linkId, currentUser);
      loadData();
      store.addNotification('Link removed', 'success');
    } catch (err) {
      setError(err.message);
    }
  };

  const getImpactTitle = (impact) => {
    switch (impact) {
      case DocumentImpact.NEW_DOCUMENT_REQUIRED: return 'New Document Required';
      case DocumentImpact.DOCUMENT_REVISION_REQUIRED: return 'Document Revision Required';
      case DocumentImpact.DOCUMENT_OBSOLETE_REQUIRED: return 'Document Obsolete Required';
      case DocumentImpact.PERIODIC_REVIEW_REQUIRED: return 'Periodic Review Required';
      default: return 'No Document Impact';
    }
  };

  const getStatusIcon = (status) => {
    switch(status) {
      case DccLinkageStatus.COMPLETED: return <CheckCircle className="text-green-500" size={20} />;
      case DccLinkageStatus.IN_PROGRESS: return <Clock className="text-blue-500" size={20} />;
      case DccLinkageStatus.FAILED:
      case DccLinkageStatus.CANCELLED: return <XCircle className="text-red-500" size={20} />;
      default: return <AlertCircle className="text-zinc-400" size={20} />;
    }
  };

  // Filter DARs safely
  const filteredDars = dars.filter(d => {
    if (d.confidential && !store.currentUser.permissions.includes('DCC_ADMIN')) return false; // Basic safety
    const match = d.id.toLowerCase().includes(searchQuery.toLowerCase()) || 
                  (d.title && d.title.toLowerCase().includes(searchQuery.toLowerCase()));
    return match;
  });

  return (
    <div className="bg-white border rounded-lg p-6 mb-6 shadow-sm">
      <div className="flex items-center gap-2 mb-6 border-b pb-2">
        <Link className="text-blue-600" size={24} />
        <h3 className="text-xl font-semibold">Linked Documents / DAR</h3>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-50 text-red-700 border border-red-200 rounded flex items-start gap-2">
          <AlertCircle size={18} className="mt-0.5 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="space-y-6">
          <div className="bg-zinc-50 p-4 rounded-lg border">
            <h4 className="font-semibold text-sm uppercase text-zinc-500 mb-2">Document Impact Summary</h4>
            <div className="flex items-center gap-2">
              <FileText className="text-blue-600" size={20} />
              <span className="font-medium text-lg">{getImpactTitle(docImpact)}</span>
            </div>
          </div>

          <div className="bg-zinc-50 p-4 rounded-lg border">
            <h4 className="font-semibold text-sm uppercase text-zinc-500 mb-4">Available Link Actions</h4>
            
            {docImpact === DocumentImpact.NO_DOCUMENT_IMPACT ? (
              <p className="text-sm text-zinc-600">No DCC action required for this NC/CAPA.</p>
            ) : (
              <div className="space-y-6">
                {!linkage && (
                  <div>
                    <button
                      onClick={handleCreateWorkflow}
                      disabled={!canCreate}
                      className="w-full flex items-center justify-center gap-2 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                      data-testid="create-dcc-workflow-btn"
                    >
                      <Plus size={18} />
                      Create {getImpactTitle(docImpact)} Draft
                    </button>
                    {!canCreate && <p className="text-xs text-red-500 mt-1 text-center">Missing DCC_LINK_CREATE permission</p>}
                  </div>
                )}
                
                {!linkage && (
                  <div className="border-t pt-4">
                    <h5 className="font-medium mb-3 text-sm">Or link an existing workflow:</h5>
                    <div className="flex gap-2 mb-3">
                      <select 
                        className="p-2 border rounded-md text-sm"
                        value={pickerType}
                        onChange={(e) => setPickerType(e.target.value)}
                      >
                        <option value="DAR">DAR</option>
                        <option value="PERIODIC_REVIEW">Periodic Review</option>
                      </select>
                      <div className="relative flex-1">
                        <Search size={16} className="absolute left-2 top-2.5 text-zinc-400" />
                        <input 
                          type="text" 
                          placeholder="Search..."
                          className="w-full pl-8 p-2 border rounded-md text-sm"
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                        />
                      </div>
                    </div>
                    
                    <div className="flex gap-2">
                      <select
                        className="flex-1 p-2 border rounded-md text-sm"
                        value={selectedExistingId}
                        onChange={(e) => setSelectedExistingId(e.target.value)}
                        data-testid="existing-workflow-select"
                      >
                        <option value="">-- Select {pickerType === 'DAR' ? 'DAR' : 'Periodic Review'} --</option>
                        {pickerType === 'DAR' && filteredDars.map(d => (
                          <option key={d.id} value={d.id}>{d.id} - {d.title}</option>
                        ))}
                      </select>
                      <button
                        onClick={handleLinkExisting}
                        disabled={!canCreate || !selectedExistingId}
                        className="bg-zinc-800 text-white px-4 py-2 rounded-md hover:bg-zinc-900 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium"
                        data-testid="link-existing-btn"
                      >
                        Link
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="bg-zinc-50 p-4 rounded-lg border">
            <h4 className="font-semibold text-sm uppercase text-zinc-500 mb-2">Traceability Notes</h4>
            <p className="text-sm text-zinc-600">
              NC/CAPA workflows do not directly mutate Document status. Any document updates must be processed through the DCC DAR or Periodic Review workflows. Once the linked workflow reaches "Completed" or "Effective" status, the NC/CAPA closure gate will open.
            </p>
          </div>
        </div>

        <div className="space-y-6">
          <div className="border rounded-lg overflow-hidden">
            <div className="bg-zinc-50 p-3 border-b">
              <h4 className="font-semibold text-sm uppercase text-zinc-500">Linked DCC Workflow</h4>
            </div>
            <div className="p-4">
              {linkage ? (
                <div className="space-y-4 animate-in fade-in">
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="text-xs font-semibold text-blue-600 bg-blue-100 px-2 py-1 rounded-full uppercase">
                        {linkage.linkageType.replace(/_/g, ' ')}
                      </span>
                      <h5 className="font-bold text-lg mt-2">{linkage.targetCode}</h5>
                      <p className="text-sm text-zinc-600">{linkage.targetTitle}</p>
                    </div>
                    {canRemove && (
                      <button 
                        onClick={() => handleRemoveLink(linkage.id)}
                        className="text-red-500 hover:bg-red-50 p-2 rounded transition-colors"
                        title="Remove Link"
                      >
                        <Trash2 size={18} />
                      </button>
                    )}
                  </div>
                  
                  <div className="flex items-center gap-2 p-3 bg-zinc-50 rounded border">
                    {getStatusIcon(linkage.targetStatus)}
                    <span className="font-medium text-sm">Status: {linkage.targetStatus.replace(/_/g, ' ')}</span>
                  </div>
                </div>
              ) : (
                <div className="text-center py-6 text-zinc-500">
                  <Link size={32} className="mx-auto text-zinc-300 mb-2" />
                  <p className="text-sm">No DCC workflow is currently linked.</p>
                </div>
              )}
            </div>
          </div>

          <div className="border rounded-lg overflow-hidden">
            <div className="bg-zinc-50 p-3 border-b">
              <h4 className="font-semibold text-sm uppercase text-zinc-500">Linkage Audit History</h4>
            </div>
            <div className="p-4 max-h-64 overflow-y-auto">
              {auditEvents.length > 0 ? (
                <div className="space-y-4">
                  {auditEvents.map(event => (
                    <div key={event.id} className="text-sm border-l-2 border-blue-200 pl-3">
                      <div className="font-medium">{event.action.replace(/_/g, ' ')}</div>
                      <div className="text-zinc-600">{event.details}</div>
                      <div className="text-xs text-zinc-400 mt-1">
                        {new Date(event.timestamp).toLocaleString()} by {event.actorId}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-zinc-500 text-center py-4">No linkage events found.</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NcCapaDccLinkageTab;
