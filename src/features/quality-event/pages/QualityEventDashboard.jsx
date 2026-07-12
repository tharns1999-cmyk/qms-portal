import React, { useState } from 'react';
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
          <button className="text-sm font-medium text-blue-600 border-b-2 border-blue-600 pb-2 -mb-4">My Tasks</button>
          <button className="text-sm font-medium text-zinc-500 hover:text-zinc-700 pb-2">My Department</button>
          <button className="text-sm font-medium text-zinc-500 hover:text-zinc-700 pb-2">CAPA I Issued</button>
          <button className="text-sm font-medium text-zinc-500 hover:text-zinc-700 pb-2">Assigned by QAQC</button>
        </div>
        <div className="p-6">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="bg-zinc-50 border-b text-zinc-500">
              <tr>
                <th className="px-4 py-3 font-medium">Priority</th>
                <th className="px-4 py-3 font-medium">Document</th>
                <th className="px-4 py-3 font-medium">Task</th>
                <th className="px-4 py-3 font-medium">Source/Target Dept</th>
                <th className="px-4 py-3 font-medium">Due Date</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              <tr>
                <td className="px-4 py-3"><span className="px-2 py-1 bg-red-50 text-red-700 rounded text-xs font-medium">HIGH</span></td>
                <td className="px-4 py-3 font-medium text-blue-600">CAR-2026-0001</td>
                <td className="px-4 py-3">Submit RCA & Action Plan</td>
                <td className="px-4 py-3">From: QAQC</td>
                <td className="px-4 py-3 text-red-600 font-medium">2026-07-15</td>
                <td className="px-4 py-3"><span className="px-2 py-1 bg-yellow-50 text-yellow-700 rounded text-xs">Response In Progress</span></td>
                <td className="px-4 py-3"><button className="text-blue-600 font-medium hover:underline">Open Task</button></td>
              </tr>
            </tbody>
          </table>
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
  
  const isQaqc = hasPermission(currentUser, PERMISSIONS.QUALITY_EVENT_MANAGEMENT_VIEW) && currentUser.department === 'QAQC';
  const isManagement = hasPermission(currentUser, PERMISSIONS.MANAGEMENT_DASHBOARD_VIEW) || currentUser.role === 'Plant Manager';

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
