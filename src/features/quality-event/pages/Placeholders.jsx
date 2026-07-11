import React from 'react';
import useStore from '../../../store/useStore';
import { canCreateCapa, canCreateNcr, canCreateHold, canCreateComplaint } from '../../../utils/permissionHelper';

export const CapaPlaceholder = () => {
  const currentUser = useStore(state => state.currentUser);
  const showCreateBtn = canCreateCapa(currentUser);

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">CAPA / CAR-PAR</h1>
      <p className="mb-4">This is a placeholder for the future CAPA implementation (Phase 12C).</p>
      {showCreateBtn && (
        <button className="px-4 py-2 bg-blue-600 text-white rounded">
          Create CAPA / CAR-PAR
        </button>
      )}
    </div>
  );
};

export const NcrPlaceholder = () => {
  const currentUser = useStore(state => state.currentUser);
  const showNcrBtn = canCreateNcr(currentUser);
  const showHoldBtn = canCreateHold(currentUser);

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">NCR / HOLD / RELEASE</h1>
      <p className="mb-4">This is a placeholder for the future NCR / HOLD implementation (Phase 12D).</p>
      <div className="flex gap-4">
        {showNcrBtn && (
          <button className="px-4 py-2 bg-red-600 text-white rounded">
            Create NCR
          </button>
        )}
        {showHoldBtn && (
          <button className="px-4 py-2 bg-orange-600 text-white rounded">
            Create HOLD
          </button>
        )}
      </div>
    </div>
  );
};

export const ComplaintPlaceholder = () => {
  const currentUser = useStore(state => state.currentUser);
  const showCreateBtn = canCreateComplaint(currentUser);

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Customer Complaint</h1>
      <p className="mb-4">This is a placeholder for the future Customer Complaint implementation (Phase 12E).</p>
      {showCreateBtn && (
        <button className="px-4 py-2 bg-purple-600 text-white rounded">
          Create Customer Complaint
        </button>
      )}
    </div>
  );
};

export const ReportsPlaceholder = () => (
  <div className="p-6">
    <h1 className="text-2xl font-bold mb-4">Quality Event Reports</h1>
    <p>Reporting module placeholder.</p>
  </div>
);

export const MasterDataPlaceholder = () => (
  <div className="p-6">
    <h1 className="text-2xl font-bold mb-4">Quality Event Master Data</h1>
    <p>Master Data configuration placeholder.</p>
  </div>
);
