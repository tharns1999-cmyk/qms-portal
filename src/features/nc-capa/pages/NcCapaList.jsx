import React, { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import useStore from '../../../store/useStore';
import { ncCapaService } from '../services/NcCapaService';
import { ncCapaAccessService } from '../services/NcCapaAccessService';
import { ncCapaDccLinkageService } from '../services/NcCapaDccLinkageService';
import { NC_PERMISSIONS, NC_STATUS, NC_SEVERITY, EffectivenessResult, DocumentImpact, DccLinkageStatus } from '../domain/models';
import { useNcCapaTranslation } from '../locales/ncCapaTranslations';
import { Filter, ChevronDown, ChevronUp } from 'lucide-react';

const NcCapaList = () => {
  const navigate = useNavigate();
  const { currentUser, departments, masterUsers } = useStore();
  const { t } = useNcCapaTranslation();
  
  const [allRecords, setAllRecords] = useState([]);
  const [showFilters, setShowFilters] = useState(false);
  
  const [filters, setFilters] = useState({
    status: '',
    severity: '',
    department: '',
    owner: '',
    reporter: '',
    capaRequired: '',
    actionStatus: '',
    effectivenessResult: '',
    closureStatus: '',
    dccLinkageStatus: '',
    documentImpact: ''
  });

  useEffect(() => {
    ncCapaService.getList().then(data => {
      const visibleRecords = data.filter(nc => !ncCapaAccessService.isRestricted(nc, currentUser));
      setAllRecords(visibleRecords);
    });
  }, [currentUser]);

  const handleFilterChange = (field, value) => {
    setFilters(prev => ({ ...prev, [field]: value }));
  };

  const filteredRecords = useMemo(() => {
    return allRecords.filter(nc => {
      if (filters.status && nc.status !== filters.status) return false;
      if (filters.severity && nc.severity !== filters.severity) return false;
      if (filters.department && nc.departmentId !== filters.department && nc.assignedDepartmentId !== filters.department) return false;
      if (filters.owner && nc.assignedOwnerUserId !== filters.owner) return false;
      if (filters.reporter && nc.reportedByUserId !== filters.reporter) return false;
      
      if (filters.capaRequired !== '') {
        const isRequired = filters.capaRequired === 'true';
        if (nc.capaRequired !== isRequired) return false;
      }
      
      if (filters.actionStatus) {
        if (!nc.capaActionPlan || !nc.capaActionPlan.actions) return false;
        const hasActionWithStatus = nc.capaActionPlan.actions.some(a => a.status === filters.actionStatus);
        if (!hasActionWithStatus) return false;
      }

      if (filters.effectivenessResult) {
        if (nc.effectivenessCheck?.result !== filters.effectivenessResult) return false;
      }

      if (filters.closureStatus) {
        if (filters.closureStatus === 'CLOSED' && nc.status !== NC_STATUS.CLOSED) return false;
        if (filters.closureStatus === 'OPEN' && nc.status === NC_STATUS.CLOSED) return false;
      }

      if (filters.documentImpact) {
        if (nc.capaActionPlan?.documentImpactAssessment !== filters.documentImpact) return false;
      }

      if (filters.dccLinkageStatus) {
        const linkage = ncCapaDccLinkageService.getLinkageForNc(nc.id);
        if (!linkage && filters.dccLinkageStatus !== 'NONE') return false;
        if (linkage && linkage.targetStatus !== filters.dccLinkageStatus) return false;
      }

      return true;
    });
  }, [allRecords, filters]);

  if (!ncCapaAccessService.hasPermission(currentUser, NC_PERMISSIONS.VIEW)) {
    return (
      <div className="p-4 md:p-8 max-w-7xl mx-auto">
        <h1 className="text-2xl font-bold text-red-600 mb-4">{t('detail', 'accessDenied')}</h1>
        <p className="text-zinc-600">{t('detail', 'restricted')}</p>
      </div>
    );
  }

  const canCreate = ncCapaAccessService.hasPermission(currentUser, NC_PERMISSIONS.CREATE);

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
        <h1 className="text-2xl font-bold text-zinc-900">{t('list', 'title')}</h1>
        <div className="flex gap-3">
          <button 
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center gap-2 px-4 py-2 bg-white border border-zinc-300 text-zinc-700 rounded-lg hover:bg-zinc-50 transition-colors"
          >
            <Filter size={18} />
            <span>Filters</span>
            {showFilters ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </button>
          {canCreate && (
            <button 
              onClick={() => navigate('/nc-capa/new')}
              className="px-4 py-2 bg-zinc-900 text-white rounded-lg hover:bg-zinc-800 transition-colors"
            >
              {t('dashboard', 'createNc')}
            </button>
          )}
        </div>
      </div>

      {showFilters && (
        <div className="mb-6 bg-white p-6 rounded-xl border border-zinc-200 shadow-sm animate-in fade-in slide-in-from-top-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            <div>
              <label className="block text-xs font-medium text-zinc-500 mb-1 uppercase">Status</label>
              <select className="w-full p-2 border border-zinc-300 rounded text-sm" value={filters.status} onChange={e => handleFilterChange('status', e.target.value)}>
                <option value="">All</option>
                {Object.values(NC_STATUS).map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-zinc-500 mb-1 uppercase">Severity</label>
              <select className="w-full p-2 border border-zinc-300 rounded text-sm" value={filters.severity} onChange={e => handleFilterChange('severity', e.target.value)}>
                <option value="">All</option>
                {Object.values(NC_SEVERITY).map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-zinc-500 mb-1 uppercase">Closure Status</label>
              <select className="w-full p-2 border border-zinc-300 rounded text-sm" value={filters.closureStatus} onChange={e => handleFilterChange('closureStatus', e.target.value)}>
                <option value="">All</option>
                <option value="OPEN">Open</option>
                <option value="CLOSED">Closed</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-zinc-500 mb-1 uppercase">CAPA Required</label>
              <select className="w-full p-2 border border-zinc-300 rounded text-sm" value={filters.capaRequired} onChange={e => handleFilterChange('capaRequired', e.target.value)}>
                <option value="">All</option>
                <option value="true">Yes</option>
                <option value="false">No</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-zinc-500 mb-1 uppercase">Department</label>
              <select className="w-full p-2 border border-zinc-300 rounded text-sm" value={filters.department} onChange={e => handleFilterChange('department', e.target.value)}>
                <option value="">All</option>
                {departments?.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-zinc-500 mb-1 uppercase">Owner</label>
              <select className="w-full p-2 border border-zinc-300 rounded text-sm" value={filters.owner} onChange={e => handleFilterChange('owner', e.target.value)}>
                <option value="">All</option>
                {masterUsers?.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-zinc-500 mb-1 uppercase">Reporter</label>
              <select className="w-full p-2 border border-zinc-300 rounded text-sm" value={filters.reporter} onChange={e => handleFilterChange('reporter', e.target.value)}>
                <option value="">All</option>
                {masterUsers?.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-zinc-500 mb-1 uppercase">Action Status</label>
              <select className="w-full p-2 border border-zinc-300 rounded text-sm" value={filters.actionStatus} onChange={e => handleFilterChange('actionStatus', e.target.value)}>
                <option value="">All</option>
                <option value="PENDING">Pending</option>
                <option value="IN_PROGRESS">In Progress</option>
                <option value="EVIDENCE_SUBMITTED">Evidence Submitted</option>
                <option value="VERIFIED">Verified</option>
                <option value="REJECTED">Rejected</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-zinc-500 mb-1 uppercase">Effectiveness</label>
              <select className="w-full p-2 border border-zinc-300 rounded text-sm" value={filters.effectivenessResult} onChange={e => handleFilterChange('effectivenessResult', e.target.value)}>
                <option value="">All</option>
                {Object.values(EffectivenessResult).map(r => <option key={r} value={r}>{r}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-zinc-500 mb-1 uppercase">Document Impact</label>
              <select className="w-full p-2 border border-zinc-300 rounded text-sm" value={filters.documentImpact} onChange={e => handleFilterChange('documentImpact', e.target.value)}>
                <option value="">All</option>
                {Object.values(DocumentImpact).map(d => <option key={d} value={d}>{d}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-zinc-500 mb-1 uppercase">DCC Linkage</label>
              <select className="w-full p-2 border border-zinc-300 rounded text-sm" value={filters.dccLinkageStatus} onChange={e => handleFilterChange('dccLinkageStatus', e.target.value)}>
                <option value="">All</option>
                <option value="NONE">No Linkage</option>
                {Object.values(DccLinkageStatus).map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
          </div>
          <div className="mt-4 flex justify-end">
            <button 
              onClick={() => setFilters({
                status: '', severity: '', department: '', owner: '', reporter: '', 
                capaRequired: '', actionStatus: '', effectivenessResult: '', closureStatus: '', 
                dccLinkageStatus: '', documentImpact: ''
              })}
              className="px-4 py-2 text-sm text-zinc-600 hover:text-zinc-900 transition-colors"
            >
              Clear Filters
            </button>
          </div>
        </div>
      )}

      <div className="bg-white rounded-xl border border-zinc-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-zinc-600 min-w-[800px]">
            <thead className="bg-zinc-50 border-b border-zinc-200 text-zinc-900">
              <tr>
                <th className="px-6 py-4 font-semibold whitespace-nowrap">NC Number</th>
                <th className="px-6 py-4 font-semibold whitespace-nowrap">Title</th>
                <th className="px-6 py-4 font-semibold whitespace-nowrap">{t('list', 'status')}</th>
                <th className="px-6 py-4 font-semibold whitespace-nowrap">{t('list', 'severity')}</th>
                <th className="px-6 py-4 font-semibold whitespace-nowrap">Created At</th>
              </tr>
            </thead>
            <tbody>
              {filteredRecords.length === 0 ? (
                <tr>
                  <td colSpan="5" className="px-6 py-12 text-center text-zinc-500">
                    <div className="flex flex-col items-center justify-center">
                      <div className="text-4xl mb-3">📭</div>
                      <h3 className="text-lg font-medium text-zinc-900 mb-1">{t('list', 'noData')}</h3>
                      <p className="text-sm">Try adjusting your filters or create a new NC/CAPA.</p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredRecords.map(nc => (
                  <tr 
                    key={nc.id} 
                    onClick={() => navigate(`/nc-capa/${nc.id}`)}
                    className="border-b border-zinc-100 hover:bg-zinc-50 cursor-pointer transition-colors"
                  >
                    <td className="px-6 py-4 font-medium text-zinc-900 whitespace-nowrap">{nc.ncNumber}</td>
                    <td className="px-6 py-4 max-w-xs truncate">{nc.title}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="px-2.5 py-1 bg-blue-50 text-blue-700 rounded-full text-xs font-medium">
                        {nc.status.replace(/_/g, ' ')}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${nc.severity === NC_SEVERITY.CRITICAL ? 'bg-red-50 text-red-700' : 'bg-amber-50 text-amber-700'}`}>
                        {nc.severity.replace(/_/g, ' ')}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">{new Date(nc.createdAt).toLocaleDateString()}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        <div className="px-6 py-3 border-t border-zinc-100 text-xs text-zinc-500 bg-zinc-50/50">
          Showing {filteredRecords.length} record{filteredRecords.length !== 1 && 's'}
        </div>
      </div>
    </div>
  );
};

export default NcCapaList;
