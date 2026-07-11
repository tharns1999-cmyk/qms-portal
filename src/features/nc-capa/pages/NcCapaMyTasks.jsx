import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import useStore from '../../../store/useStore';
import { ncCapaTaskService } from '../services/NcCapaTaskService';
import { ncCapaAccessService } from '../services/NcCapaAccessService';
import { NC_PERMISSIONS } from '../domain/models';
import { useNcCapaTranslation } from '../locales/ncCapaTranslations';

const NcCapaMyTasks = () => {
  const navigate = useNavigate();
  const { currentUser } = useStore();
  const { t } = useNcCapaTranslation();
  
  const [tasks, setTasks] = useState([]);

  useEffect(() => {
    ncCapaTaskService.getMyTasks(currentUser?.id).then(setTasks);
  }, [currentUser]);

  if (!ncCapaAccessService.hasPermission(currentUser, NC_PERMISSIONS.VIEW)) {
    return (
      <div className="p-8 max-w-7xl mx-auto">
        <h1 className="text-2xl font-bold text-red-600 mb-4">{t('detail', 'accessDenied')}</h1>
        <p className="text-zinc-600">{t('detail', 'restricted')}</p>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-zinc-900">{t('dashboard', 'myTasks')}</h1>
      </div>

      <div className="bg-white rounded-xl border border-zinc-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-zinc-600">
            <thead className="bg-zinc-50 border-b border-zinc-200 text-zinc-900">
              <tr>
                <th className="px-6 py-4 font-semibold">NC Number</th>
                <th className="px-6 py-4 font-semibold">Title</th>
                <th className="px-6 py-4 font-semibold">{t('list', 'status')}</th>
                <th className="px-6 py-4 font-semibold">Due Date</th>
              </tr>
            </thead>
            <tbody>
              {tasks.length === 0 ? (
                <tr>
                  <td colSpan="4" className="px-6 py-8 text-center text-zinc-500">
                    {t('list', 'noData')}
                  </td>
                </tr>
              ) : (
                tasks.map(nc => (
                  <tr 
                    key={nc.id} 
                    onClick={() => navigate(`/nc-capa/${nc.id}`)}
                    className="border-b border-zinc-100 hover:bg-zinc-50 cursor-pointer transition-colors"
                  >
                    <td className="px-6 py-4 font-medium text-zinc-900">{nc.ncNumber}</td>
                    <td className="px-6 py-4">{nc.title}</td>
                    <td className="px-6 py-4">
                      <span className="px-2.5 py-1 bg-blue-50 text-blue-700 rounded-full text-xs font-medium">
                        {t('status', nc.status)}
                      </span>
                    </td>
                    <td className="px-6 py-4">{nc.dueDate ? new Date(nc.dueDate).toLocaleDateString() : '-'}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default NcCapaMyTasks;
