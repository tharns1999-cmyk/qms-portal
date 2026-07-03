import React from 'react';
import { useParams } from 'react-router-dom';

export const Dashboard = () => <div className="p-6 bg-white rounded shadow"><h2>Dashboard</h2></div>;
export const DarNew = () => <div className="p-6 bg-white rounded shadow"><h2>Create New DAR</h2></div>;
export const DarNewDocument = () => <div className="p-6 bg-white rounded shadow"><h2>Create DAR - New Document</h2></div>;
export const DarNewRevision = () => <div className="p-6 bg-white rounded shadow"><h2>Create DAR - Revision</h2></div>;
export const DarNewObsolete = () => <div className="p-6 bg-white rounded shadow"><h2>Create DAR - Obsolete</h2></div>;
export const DarList = () => <div className="p-6 bg-white rounded shadow"><h2>DAR List</h2></div>;
export const DarDetail = () => {
  const { id } = useParams();
  return <div className="p-6 bg-white rounded shadow"><h2>DAR Detail: {id}</h2></div>;
};

export const Tasks = () => <div className="p-6 bg-white rounded shadow"><h2>Task Inbox</h2></div>;
export const TaskReview = () => {
  const { id } = useParams();
  return <div className="p-6 bg-white rounded shadow"><h2>Review Task: {id}</h2></div>;
};
export const TaskApprove = () => {
  const { id } = useParams();
  return <div className="p-6 bg-white rounded shadow"><h2>Approve Task: {id}</h2></div>;
};

export const Library = () => <div className="p-6 bg-white rounded shadow"><h2>Document Library</h2></div>;
export const LibraryDetail = () => {
  const { id } = useParams();
  return <div className="p-6 bg-white rounded shadow"><h2>Library Document: {id}</h2></div>;
};
export const Viewer = () => {
  const { docId, rev } = useParams();
  return <div className="p-6 bg-white rounded shadow"><h2>PDF Viewer: {docId} Rev {rev}</h2></div>;
};

export const AdminHealth = () => <div className="p-6 bg-white rounded shadow"><h2>System Health (Admin)</h2></div>;
export const Reports = () => <div className="p-6 bg-white rounded shadow"><h2>Reports</h2></div>;

export const NotFound = () => (
  <div className="flex flex-col items-center justify-center h-full">
    <h1 className="text-4xl font-bold text-gray-800  mb-4">404</h1>
    <p className="text-gray-600 ">Page Not Found</p>
  </div>
);
