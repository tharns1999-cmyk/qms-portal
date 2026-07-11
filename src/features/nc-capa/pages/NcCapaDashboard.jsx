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
    // Check permission - if totally denied, we could redirect or show denied state
    // But dashboard is usually viewable by those with VIEW permission
    if (!ncCapaAccessService.hasPermission(currentUser, NC_PERMISSIONS.VIEW)) {
      // For this phase, if they have no view permission, show access denied
      return; 
    }

    ncCapaDashboardService.getKpis().then(setKpis);
  }, [currentUser]);

  if (!ncCapaAccessService.hasPermission(currentUser, NC_PERMISSIONS.VIEW)) {
    return (
      <div className="p-8 max-w-7xl mx-auto">
        <h1 className="text-2xl font-bold text-red-600 mb-4">{t('detail', 'accessDenied')}</h1>
        <p className="text-zinc-600">{t('detail', 'restricted')}</p>
      </div>
    );
  }

  const canCreate = ncCapaAccessService.hasPermission(currentUser, NC_PERMISSIONS.CREATE);

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <div className="flex justify-between items-center mb-8">
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

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white p-6 rounded-xl border border-zinc-200 shadow-sm cursor-pointer hover:shadow-md transition-shadow" onClick={() => navigate('/nc-capa/list')}>
          <h3 className="text-zinc-500 font-medium mb-2">{t('dashboard', 'openNc')}</h3>
          <p className="text-3xl font-bold text-zinc-900">{kpis ? kpis.open : '-'}</p>
        </div>
        <div className="bg-white p-6 rounded-xl border border-zinc-200 shadow-sm">
          <h3 className="text-zinc-500 font-medium mb-2">{t('dashboard', 'overdue')}</h3>
          <p className="text-3xl font-bold text-rose-600">{kpis ? kpis.overdue : '-'}</p>
        </div>
        <div className="bg-white p-6 rounded-xl border border-zinc-200 shadow-sm">
          <h3 className="text-zinc-500 font-medium mb-2">{t('dashboard', 'critical')}</h3>
          <p className="text-3xl font-bold text-amber-600">{kpis ? kpis.critical : '-'}</p>
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
            {/* Mock recent activity placeholder */}
            No recent activity
          </div>
        </div>
      </div>
    </div>
  );
};

export default NcCapaDashboard;
