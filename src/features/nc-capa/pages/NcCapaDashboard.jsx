import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import useStore from '../../../store/useStore';
import { ncCapaDashboardService } from '../services/NcCapaDashboardService';
import { ncCapaAccessService } from '../services/NcCapaAccessService';
import { NC_PERMISSIONS } from '../domain/models';
import { useNcCapaTranslation } from '../locales/ncCapaTranslations';

const NcCapaDashboard = () => {
  const navigate = useNavigate();
  const { currentUser } = useStore();
  const { t } = useNcCapaTranslation();
  
  const [kpis, setKpis] = useState(null);
  
  useEffect(() => {
    if (!ncCapaAccessService.hasPermission(currentUser, NC_PERMISSIONS.VIEW)) return;
    ncCapaDashboardService.getKpis().then(setKpis);
  }, [currentUser]);

  if (!ncCapaAccessService.hasPermission(currentUser, NC_PERMISSIONS.VIEW)) {
    return (
      <div className="p-4 md:p-8 max-w-7xl mx-auto">
        <h1 className="text-2xl font-bold text-red-600 mb-4">{t('detail', 'accessDenied')}</h1>
        <p className="text-zinc-600">{t('detail', 'restricted')}</p>
      </div>
    );
  }

  const canCreate = ncCapaAccessService.hasPermission(currentUser, NC_PERMISSIONS.CREATE);

  const KpiCard = ({ title, value, colorClass = "text-zinc-900" }) => (
    <div className="bg-white p-5 rounded-xl border border-zinc-200 shadow-sm hover:shadow-md transition-shadow">
      <h3 className="text-zinc-500 font-medium mb-1 text-sm">{title}</h3>
      <p className={`text-3xl font-bold ${colorClass}`}>{value !== undefined ? value : '-'}</p>
    </div>
  );

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
        <h1 className="text-2xl font-bold text-zinc-900">{t('dashboard', 'title')}</h1>
        {canCreate && (
          <button 
            onClick={() => navigate('/nc-capa/new')}
            className="px-4 py-2 bg-zinc-900 text-white rounded-lg hover:bg-zinc-800 transition-colors"
          >
            {t('dashboard', 'createNc')}
          </button>
        )}
      </div>

      <div className="space-y-8 mb-8">
        
        {/* Intake / Screening Group */}
        <div>
          <h2 className="text-lg font-semibold text-zinc-800 mb-4 border-b pb-2">Intake & Screening</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <KpiCard title="New / Screening" value={kpis?.screening} colorClass="text-zinc-900" />
            <KpiCard title="Returned for Info" value={kpis?.returned} colorClass="text-orange-600" />
          </div>
        </div>

        {/* RCA / CAPA Planning Group */}
        <div>
          <h2 className="text-lg font-semibold text-zinc-800 mb-4 border-b pb-2">RCA & CAPA Planning</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <KpiCard title="Assigned" value={kpis?.assigned} colorClass="text-blue-600" />
            <KpiCard title="Pending RCA" value={kpis?.pendingRCA} colorClass="text-blue-600" />
            <KpiCard title="CAPA Plan Required" value={kpis?.capaRequired} colorClass="text-indigo-600" />
            <KpiCard title="CAPA Plan Review" value={kpis?.capaReview} colorClass="text-indigo-600" />
          </div>
        </div>

        {/* Execution / Verification Group */}
        <div>
          <h2 className="text-lg font-semibold text-zinc-800 mb-4 border-b pb-2">Execution & QA Verification</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <KpiCard title="Action In Progress" value={kpis?.execution} colorClass="text-cyan-600" />
            <KpiCard title="Pending QA Verify" value={kpis?.pendingVerification} colorClass="text-purple-600" />
          </div>
        </div>

        {/* Effectiveness / Closure Group */}
        <div>
          <h2 className="text-lg font-semibold text-zinc-800 mb-4 border-b pb-2">Effectiveness & Closure</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <KpiCard title="Pending Effect. Check" value={kpis?.effectiveness} colorClass="text-teal-600" />
            <KpiCard title="Closed" value={kpis?.closed} colorClass="text-green-600" />
            <KpiCard title="Reopened" value={kpis?.reopened} colorClass="text-rose-600" />
            <KpiCard title="Additional Action Req." value={kpis?.additionalAction} colorClass="text-amber-600" />
          </div>
        </div>
        
        {/* DCC Linkage Group */}
        <div>
          <h2 className="text-lg font-semibold text-zinc-800 mb-4 border-b pb-2">DCC Linkage</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <KpiCard title="DCC Link Pending" value={kpis?.dccPending} colorClass="text-indigo-500" />
            <KpiCard title="DCC Link Completed" value={kpis?.dccCompleted} colorClass="text-green-600" />
          </div>
        </div>

        {/* Risk / Priority Group */}
        <div>
          <h2 className="text-lg font-semibold text-zinc-800 mb-4 border-b pb-2">Risk & Priority</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <KpiCard title="Critical" value={kpis?.critical} colorClass="text-red-600" />
          </div>
        </div>

      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white rounded-xl border border-zinc-200 shadow-sm overflow-hidden">
          <div className="p-4 border-b border-zinc-200 bg-zinc-50/50 flex justify-between items-center">
            <h2 className="font-semibold text-zinc-900">{t('dashboard', 'quickActions')}</h2>
          </div>
          <div className="p-4 space-y-2">
            <button onClick={() => navigate('/nc-capa/list')} className="w-full text-left p-3 hover:bg-zinc-50 rounded-lg transition-colors border border-transparent hover:border-zinc-200">
              {t('dashboard', 'viewAll')}
            </button>
            <button onClick={() => navigate('/nc-capa/my-tasks')} className="w-full text-left p-3 hover:bg-zinc-50 rounded-lg transition-colors border border-transparent hover:border-zinc-200">
              {t('dashboard', 'myTasks')}
            </button>
          </div>
        </div>
        
        <div className="bg-white rounded-xl border border-zinc-200 shadow-sm overflow-hidden">
          <div className="p-4 border-b border-zinc-200 bg-zinc-50/50">
            <h2 className="font-semibold text-zinc-900">{t('dashboard', 'recentActivity')}</h2>
          </div>
          <div className="p-8 text-center text-zinc-500">
            No recent activity
          </div>
        </div>
      </div>
    </div>
  );
};

export default NcCapaDashboard;
