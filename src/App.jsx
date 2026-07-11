import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import useStore from './store/useStore';
import Layout from './components/layout/Layout';
import Dashboard from './pages/Dashboard/Dashboard';
import DarSelection from './pages/DarWorkflow/DarSelection';
import DarNewForm from './pages/DarWorkflow/DarNewForm';
import DarRevisionForm from './pages/DarWorkflow/DarRevisionForm';
import DarObsoleteForm from './pages/DarWorkflow/DarObsoleteForm';
import DarList from './pages/DarWorkflow/DarList';

import Library from './pages/Library/Library';
import LibraryDetail from './pages/Library/LibraryDetail';
import Viewer from './pages/Library/Viewer';

import Reports from './pages/Admin/Reports';
import ActionLog from './pages/Admin/ActionLog';
import ControlledCopyRegister from './pages/ControlledCopy/ControlledCopyRegister';
import ExternalDocsList from './pages/ExternalDocs/ExternalDocsList';

import DarDetail from './pages/DarWorkflow/DarDetail';
import TaskInbox from './pages/Tasks/TaskInbox';
import TaskReview from './pages/Tasks/TaskReview';
import TaskApprove from './pages/Tasks/TaskApprove';
import TaskAck from './pages/Tasks/TaskAck';
import TaskRevise from './pages/Tasks/TaskRevise';
import TaskApproveReplacement from './pages/Tasks/TaskApproveReplacement';
import SLAEngine from './components/SLAEngine';

import PeriodicReviewDashboard from './pages/PeriodicReviews/PeriodicReviewDashboard';
import MasterReviewSchedule from './pages/PeriodicReviews/MasterReviewSchedule';
import MyReviewTasks from './pages/PeriodicReviews/MyReviewTasks';
import PeriodicReviewDetail from './pages/PeriodicReviews/PeriodicReviewDetail';

import { AdminHealth, NotFound } from './pages/Placeholders';
import MasterList from './pages/MasterList/MasterList';
import DistributionDemo from './pages/Placeholders/DistributionDemo';

// NC/CAPA Module
import {
  NcCapaDashboard,
  NcCapaList,
  NcCapaNew,
  NcCapaMyTasks,
  NcCapaDetail
} from './features/nc-capa';

function App() {
  const initializePeriodicReviews = useStore(state => state.initializePeriodicReviews);

  useEffect(() => {
    initializePeriodicReviews();
  }, [initializePeriodicReviews]);

  return (
    <BrowserRouter>
      <Toaster position="top-right" />
      <SLAEngine />
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route path="dashboard" element={<Dashboard />} />

          <Route path="dar/new" element={<DarSelection />} />
          <Route path="dar/new/document" element={<DarNewForm />} />
          <Route path="dar/new/revision" element={<DarRevisionForm />} />
          <Route path="dar/new/obsolete" element={<DarObsoleteForm />} />
          <Route path="dar/list" element={<DarList />} />
          <Route path="dar/:id" element={<DarDetail />} />

          <Route path="tasks" element={<TaskInbox />} />
          <Route path="tasks/review/:id" element={<TaskReview />} />
          <Route path="tasks/approve/:id" element={<TaskApprove />} />
          <Route path="tasks/ack/:id" element={<TaskAck />} />
          <Route path="tasks/revise/:id" element={<TaskRevise />} />
          <Route path="tasks/approve-replacement/:id" element={<TaskApproveReplacement />} />

          <Route path="library" element={<Library />} />
          <Route path="library/:id" element={<LibraryDetail />} />
          <Route path="viewer/:docId/:rev" element={<Viewer />} />

          <Route path="admin/health" element={<AdminHealth />} />
          <Route path="admin/action-log" element={<ActionLog />} />
          <Route path="reports" element={<Reports />} />

          <Route path="controlled-copy" element={<ControlledCopyRegister />} />
          <Route path="external-docs" element={<ExternalDocsList />} />
          <Route path="master-list" element={<MasterList />} />
          
          <Route path="periodic-reviews" element={<PeriodicReviewDashboard />} />
          <Route path="periodic-reviews/schedule" element={<MasterReviewSchedule />} />
          <Route path="periodic-reviews/my-tasks" element={<MyReviewTasks />} />
          <Route path="periodic-reviews/:reviewId" element={<PeriodicReviewDetail />} />

          {/* NC/CAPA Routes */}
          <Route path="nc-capa" element={<NcCapaDashboard />} />
          <Route path="nc-capa/list" element={<NcCapaList />} />
          <Route path="nc-capa/new" element={<NcCapaNew />} />
          <Route path="nc-capa/my-tasks" element={<NcCapaMyTasks />} />
          <Route path="nc-capa/:ncId" element={<NcCapaDetail />} />

          {/* Prototypes */}
          <Route path="demo-distribution" element={<DistributionDemo />} />

          <Route path="*" element={<NotFound />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
