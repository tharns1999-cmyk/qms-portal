import React from 'react';
import { useNavigate } from 'react-router-dom';
import useStore from '../../../store/useStore';
import { ncCapaAccessService } from '../services/NcCapaAccessService';
import { NC_PERMISSIONS } from '../domain/models';
import { useNcCapaTranslation } from '../locales/ncCapaTranslations';

const NcCapaNew = () => {
  const navigate = useNavigate();
  const { currentUser } = useStore();
  const { t } = useNcCapaTranslation();

  if (!ncCapaAccessService.hasPermission(currentUser, NC_PERMISSIONS.CREATE)) {
    return (
      <div className="p-8 max-w-7xl mx-auto">
        <h1 className="text-2xl font-bold text-red-600 mb-4">{t('detail', 'accessDenied')}</h1>
        <p className="text-zinc-600">{t('detail', 'restricted')}</p>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-3xl mx-auto">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-zinc-900">{t('dashboard', 'createNc')}</h1>
        <button 
          onClick={() => navigate('/nc-capa')}
          className="text-zinc-500 hover:text-zinc-900"
        >
          Cancel
        </button>
      </div>

      <div className="bg-white rounded-xl border border-zinc-200 shadow-sm p-6">
        <p className="text-zinc-500 mb-6">This is a shell page for creating a new NC record (Phase 11A).</p>
        
        <div className="space-y-4 opacity-50 pointer-events-none">
          <div>
            <label className="block text-sm font-medium text-zinc-700 mb-1">Title</label>
            <input type="text" className="w-full px-3 py-2 border border-zinc-300 rounded-lg" placeholder="Enter NC title..." />
          </div>
          <div>
            <label className="block text-sm font-medium text-zinc-700 mb-1">Description</label>
            <textarea className="w-full px-3 py-2 border border-zinc-300 rounded-lg" rows="4" placeholder="Enter details..."></textarea>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NcCapaNew;
