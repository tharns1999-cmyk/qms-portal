import React from 'react';
import useStore from '../../../store/useStore';
import { hasPermission, PERMISSIONS } from '../../../utils/permissionHelper';
import { ClipboardList, AlertTriangle, Clock, Users, CheckCircle } from 'lucide-react';

const DepartmentDashboard = () => {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[
          { title: 'My Pending Tasks', value: 3, icon: ClipboardList, color: 'blue' },
          { title: 'Due within 3 Days', value: 1, icon: Clock, color: 'yellow' },
          { title: 'Overdue', value: 0, icon: AlertTriangle, color: 'red' },
          { title: 'Waiting for Other Dept', value: 2, icon: Users, color: 'zinc' }
        ].map(card => (
          <div key={card.title} className="bg-white p-6 rounded-xl border border-zinc-200">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm font-medium text-zinc-500 mb-1">{card.title}</p>
                <h3 className="text-3xl font-bold text-zinc-900">{card.value}</h3>
              </div>
              <div className={`p-3 rounded-lg bg-${card.color}-50 text-${card.color}-600`}>
                <card.icon size={20} />
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="bg-white border rounded-xl overflow-hidden">
        <div className="px-6 py-4 border-b flex gap-4">
          <button className="text-sm font-medium text-blue-600 border-b-2 border-blue-600 pb-2 -mb-4">My Assigned Tasks</button>
        </div>
        <div className="p-6 text-sm text-zinc-500 italic text-center">
          Assigned tasks will appear here.
        </div>
      </div>
    </div>
  );
};

const QaqcDashboard = () => {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {[
          { title: 'Active HOLD', value: 4, icon: AlertTriangle, color: 'orange' },
          { title: 'New Customer Complaint', value: 1, icon: Users, color: 'red' },
          { title: 'NCR Awaiting Dept Response', value: 3, icon: Clock, color: 'yellow' },
          { title: 'CAPA Overdue > 14 Days', value: 2, icon: AlertTriangle, color: 'red' },
          { title: 'Food Safety / High Risk', value: 1, icon: ShieldAlert, color: 'purple' },
          { title: 'Pending Release Decision', value: 2, icon: CheckCircle, color: 'blue' }
        ].map(card => (
          <div key={card.title} className="bg-white p-6 rounded-xl border border-zinc-200">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm font-medium text-zinc-500 mb-1">{card.title}</p>
                <h3 className="text-3xl font-bold text-zinc-900">{card.value}</h3>
              </div>
            </div>
          </div>
        ))}
      </div>
      
      <div className="bg-white border rounded-xl overflow-hidden p-6">
        <h2 className="text-lg font-semibold text-zinc-900 mb-4">QAQC Control Board</h2>
        <div className="grid grid-cols-2 gap-6">
          <div className="border rounded-lg p-4">
            <h3 className="font-medium mb-3">Active HOLD / Release Control</h3>
            <div className="text-sm text-zinc-500 italic">No items pending immediate release.</div>
          </div>
          <div className="border rounded-lg p-4">
            <h3 className="font-medium mb-3">Customer Complaint</h3>
            <div className="text-sm text-zinc-500 italic">No new complaints.</div>
          </div>
          <div className="border rounded-lg p-4">
            <h3 className="font-medium mb-3">NCR Awaiting Response</h3>
            <div className="text-sm text-zinc-500 italic">All NCRs are within SLA.</div>
          </div>
          <div className="border rounded-lg p-4">
            <h3 className="font-medium mb-3">CAPA Overdue / Due Soon</h3>
            <div className="text-sm text-zinc-500 italic">CAR-2026-0001 due in 3 days.</div>
          </div>
        </div>
      </div>
    </div>
  );
};

const ManagementDashboard = () => {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {[
          { title: 'Open High Risk', value: 1 },
          { title: 'Active HOLD', value: 4 },
          { title: 'Overdue CAPA', value: 2 },
          { title: 'Open Customer Complaint', value: 1 },
          { title: 'Repeat Issue / Recurrence', value: 0 }
        ].map(card => (
          <div key={card.title} className="bg-white p-6 rounded-xl border border-zinc-200">
            <p className="text-sm font-medium text-zinc-500 mb-1">{card.title}</p>
            <h3 className="text-2xl font-bold text-zinc-900">{card.value}</h3>
          </div>
        ))}
      </div>
      <div className="bg-white border rounded-xl overflow-hidden p-6">
        <h2 className="text-lg font-semibold text-zinc-900 mb-4">Management Trends</h2>
        <div className="text-sm text-zinc-500 italic">Charts: Trend by Department, Trend by Type, Trend by Severity, Trend by Month (To be implemented with real data)</div>
      </div>
    </div>
  );
};

const QualityEventDashboard = () => {
  const { currentUser } = useStore();
  
  const isManagement = hasPermission(currentUser, PERMISSIONS.QUALITY_EVENT_MANAGEMENT_VIEW);
  const isQaqc = hasPermission(currentUser, PERMISSIONS.NCR_VIEW_ALL) || hasPermission(currentUser, PERMISSIONS.HOLD_VIEW_ALL);

  return (
    <div className="flex flex-col h-full bg-zinc-50">
      <div className="bg-white px-6 py-4 border-b shrink-0">
        <h1 className="text-xl font-bold text-zinc-900">Quality Event Dashboard</h1>
        <p className="text-sm text-zinc-500">Welcome back, {currentUser.name}</p>
      </div>
      
      <div className="p-6 flex-1 overflow-auto">
        {isManagement ? <ManagementDashboard /> : isQaqc ? <QaqcDashboard /> : <DepartmentDashboard />}
      </div>
    </div>
  );
};

export default QualityEventDashboard;

function ShieldAlert(props) {
  return <AlertTriangle {...props} />;
}
