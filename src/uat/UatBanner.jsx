import React from 'react';
import { Link } from 'react-router-dom';
import useStore from '../store/useStore';
import { UAT_REFERENCE_DATE } from './PeriodicReviewUatService';
import { Settings, CheckCircle2 } from 'lucide-react';

export function UatBanner() {
  const currentUser = useStore(state => state.currentUser);
  const uatDatasetVersion = useStore(state => state.uatDatasetVersion);
  
  if (import.meta.env.MODE !== 'uat') return null;
  
  const isSeeded = !!uatDatasetVersion;

  return (
    <div className="bg-amber-100 border-b-2 border-amber-500 text-amber-900 px-4 py-2 flex items-center justify-between shadow-sm z-50 relative">
      <div className="flex items-center gap-4">
        <span className="font-bold flex items-center gap-2">
          <Settings size={18} />
          UAT MODE ACTIVE
        </span>
        <span className="text-sm">
          <strong>Ref Date:</strong> {UAT_REFERENCE_DATE}
        </span>
        <span className="text-sm">
          <strong>Dataset Version:</strong> {uatDatasetVersion || 'None'}
        </span>
        <span className="text-sm">
          <strong>Persona:</strong> {currentUser?.id} / {currentUser?.name} ({currentUser?.role})
        </span>
        <span className="text-sm">
          <strong>Depts:</strong> {currentUser?.departmentMemberships?.map(m => m.departmentId).join(', ')}
        </span>
        {isSeeded && (
          <span className="text-xs bg-amber-500 text-white px-2 py-0.5 rounded-full flex items-center gap-1">
            <CheckCircle2 size={12} />
            Data Seeded
          </span>
        )}
      </div>
      <div className="flex items-center gap-3">
        <Link 
          to="/dcc/uat-tools"
          className="text-xs bg-amber-600 hover:bg-amber-700 text-white px-4 py-1 rounded shadow-sm transition-colors font-medium ml-2"
        >
          ไปยังเครื่องมือ UAT
        </Link>
      </div>
    </div>
  );
}
