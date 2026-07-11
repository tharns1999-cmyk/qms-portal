import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import useStore from '../../../store/useStore';
import { ncCapaService } from '../services/NcCapaService';
import { ncCapaAccessService } from '../services/NcCapaAccessService';
import { useNcCapaTranslation } from '../locales/ncCapaTranslations';

const NcCapaDetail = () => {
  const { ncId } = useParams();
  const navigate = useNavigate();
  const { currentUser } = useStore();
  const { t } = useNcCapaTranslation();
  
  const [record, setRecord] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    ncCapaService.getById(ncId).then(data => {
      setRecord(data);
      setLoading(false);
    });
  }, [ncId]);

  if (loading) {
    return <div className="p-8">Loading...</div>;
  }

  if (!record) {
    return (
      <div className="p-8 max-w-7xl mx-auto text-center">
        <h1 className="text-2xl font-bold text-zinc-900 mb-2">{t('detail', 'notFound')}</h1>
        <button onClick={() => navigate('/nc-capa/list')} className="text-blue-600 hover:underline">Back to List</button>
      </div>
    );
  }

  if (ncCapaAccessService.isRestricted(record, currentUser)) {
    return (
      <div className="p-8 max-w-7xl mx-auto">
        <h1 className="text-2xl font-bold text-red-600 mb-4">{t('detail', 'accessDenied')}</h1>
        <p className="text-zinc-600">{t('detail', 'restricted')}</p>
        <button onClick={() => navigate('/nc-capa')} className="mt-4 text-blue-600 hover:underline">Back to Dashboard</button>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900">{record.ncNumber}: {record.title}</h1>
          <p className="text-sm text-zinc-500 mt-1">Status: {t('status', record.status)} | Severity: {t('severity', record.severity)}</p>
        </div>
        <button 
          onClick={() => navigate('/nc-capa/list')}
          className="text-zinc-500 hover:text-zinc-900"
        >
          Back to List
        </button>
      </div>

      <div className="bg-white rounded-xl border border-zinc-200 shadow-sm p-6 mb-6">
        <h2 className="text-lg font-semibold text-zinc-900 mb-4">{t('detail', 'title')}</h2>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-sm text-zinc-500">Created At</p>
            <p className="font-medium text-zinc-900">{new Date(record.createdAt).toLocaleString()}</p>
          </div>
          <div>
            <p className="text-sm text-zinc-500">Assigned To</p>
            <p className="font-medium text-zinc-900">{record.assignedTo}</p>
          </div>
          <div className="col-span-2 mt-4">
            <p className="text-sm text-zinc-500">Description</p>
            <p className="mt-1 text-zinc-900 p-4 bg-zinc-50 rounded-lg whitespace-pre-wrap">{record.description}</p>
          </div>
        </div>
      </div>
      
      {/* Shell tabs for future workflows */}
      <div className="flex border-b border-zinc-200 mb-6">
        <button className="px-4 py-2 border-b-2 border-zinc-900 font-medium text-zinc-900">Details</button>
        <button className="px-4 py-2 text-zinc-500 hover:text-zinc-900 pointer-events-none opacity-50">Root Cause</button>
        <button className="px-4 py-2 text-zinc-500 hover:text-zinc-900 pointer-events-none opacity-50">CAPA Action</button>
        <button className="px-4 py-2 text-zinc-500 hover:text-zinc-900 pointer-events-none opacity-50">Evidence</button>
      </div>
    </div>
  );
};

export default NcCapaDetail;
