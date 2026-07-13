import React, { useEffect, Suspense, lazy } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useParams } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import useStore from './store/useStore';
import Layout from './components/layout/Layout';
import SLAEngine from './components/SLAEngine';

// --- Lazy Load Pages ---

// Portal
const PortalLandingPage = lazy(() => import('./features/portal/pages/PortalLandingPage'));

// DCC Dashboard
const Dashboard = lazy(() => import('./pages/Dashboard/Dashboard'));

// DCC DAR Workflow
const DarSelection = lazy(() => import('./pages/DarWorkflow/DarSelection'));
const DarNewForm = lazy(() => import('./pages/DarWorkflow/DarNewForm'));
const DarRevisionForm = lazy(() => import('./pages/DarWorkflow/DarRevisionForm'));
const DarObsoleteForm = lazy(() => import('./pages/DarWorkflow/DarObsoleteForm'));
const DarList = lazy(() => import('./pages/DarWorkflow/DarList'));
const DarDetail = lazy(() => import('./pages/DarWorkflow/DarDetail'));

// DCC Library
const Library = lazy(() => import('./pages/Library/Library'));
const LibraryDetail = lazy(() => import('./pages/Library/LibraryDetail'));
const Viewer = lazy(() => import('./pages/Library/Viewer'));

// DCC Admin & Master List
const Reports = lazy(() => import('./pages/Admin/Reports'));
const ActionLog = lazy(() => import('./pages/Admin/ActionLog'));
const ControlledCopyRegister = lazy(() => import('./pages/ControlledCopy/ControlledCopyRegister'));
const ExternalDocsList = lazy(() => import('./pages/ExternalDocs/ExternalDocsList'));
const MasterList = lazy(() => import('./pages/MasterList/MasterList'));

// DCC Tasks
const TaskInbox = lazy(() => import('./pages/Tasks/TaskInbox'));
const TaskReview = lazy(() => import('./pages/Tasks/TaskReview'));
const TaskApprove = lazy(() => import('./pages/Tasks/TaskApprove'));
const TaskAck = lazy(() => import('./pages/Tasks/TaskAck'));
const TaskRevise = lazy(() => import('./pages/Tasks/TaskRevise'));
const TaskApproveReplacement = lazy(() => import('./pages/Tasks/TaskApproveReplacement'));

// DCC Periodic Reviews
const PeriodicReviewDashboard = lazy(() => import('./pages/PeriodicReviews/PeriodicReviewDashboard'));
const MasterReviewSchedule = lazy(() => import('./pages/PeriodicReviews/MasterReviewSchedule'));
const MyReviewTasks = lazy(() => import('./pages/PeriodicReviews/MyReviewTasks'));
const PeriodicReviewDetail = lazy(() => import('./pages/PeriodicReviews/PeriodicReviewDetail'));

// Placeholders
const AdminHealth = lazy(() => import('./pages/Placeholders').then(m => ({ default: m.AdminHealth })));
const NotFound = lazy(() => import('./pages/Placeholders').then(m => ({ default: m.NotFound })));
const DistributionDemo = lazy(() => import('./pages/Placeholders/DistributionDemo'));
const ComingSoonModule = lazy(() => import('./pages/Placeholders/ComingSoonModule'));

// NC/CAPA Module
const NcCapaDashboard = lazy(() => import('./features/nc-capa').then(m => ({ default: m.NcCapaDashboard })));
const NcCapaList = lazy(() => import('./features/nc-capa').then(m => ({ default: m.NcCapaList })));
const NcCapaNew = lazy(() => import('./features/nc-capa').then(m => ({ default: m.NcCapaNew })));
const NcCapaMyTasks = lazy(() => import('./features/nc-capa').then(m => ({ default: m.NcCapaMyTasks })));
const NcCapaDetail = lazy(() => import('./features/nc-capa').then(m => ({ default: m.NcCapaDetail })));

// Quality Event Placeholders
const CapaList = lazy(() => import('./features/quality-event/pages/CapaList'));
const CapaNew = lazy(() => import('./features/quality-event/pages/CapaNew'));
const CapaDetail = lazy(() => import('./features/quality-event/pages/CapaDetail'));
const QualityEventDashboard = lazy(() => import('./features/quality-event/pages/QualityEventDashboard'));
const NcrList = lazy(() => import('./features/quality-event/pages/NcrList'));
const NcrNew = lazy(() => import('./features/quality-event/pages/NcrNew'));
const NcrDetail = lazy(() => import('./features/quality-event/pages/NcrDetail'));
const ComplaintList = lazy(() => import('./features/quality-event/pages/ComplaintList'));
const ComplaintNew = lazy(() => import('./features/quality-event/pages/ComplaintNew'));
const ComplaintDetail = lazy(() => import('./features/quality-event/pages/ComplaintDetail'));
const ReportsPlaceholder = lazy(() => import('./features/quality-event/pages/Placeholders').then(m => ({ default: m.ReportsPlaceholder })));
const MasterDataPlaceholder = lazy(() => import('./features/quality-event/pages/Placeholders').then(m => ({ default: m.MasterDataPlaceholder })));


// --- Helper Components ---

const SuspenseLoader = () => (
  <div className="flex-1 flex flex-col items-center justify-center h-full min-h-[400px]">
    <div className="w-8 h-8 border-4 border-zinc-200 border-t-zinc-900 rounded-full animate-spin"></div>
    <p className="mt-4 text-sm text-zinc-500 font-medium">Loading module...</p>
  </div>
);

const withSuspense = (Component) => (
  <Suspense fallback={<SuspenseLoader />}>
    <Component />
  </Suspense>
);

const AliasRedirect = ({ to }) => {
  const params = useParams();
  let resolvedPath = to;
  Object.keys(params).forEach(key => {
    resolvedPath = resolvedPath.replace(`:${key}`, params[key]);
  });
  return <Navigate to={resolvedPath} replace />;
};

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
          <Route path="portal" element={withSuspense(PortalLandingPage)} />
          
          <Route path="dcc">
            <Route index element={<Navigate to="dashboard" replace />} />
            <Route path="dashboard" element={withSuspense(Dashboard)} />

            <Route path="dar/new" element={withSuspense(DarSelection)} />
            <Route path="dar/new/document" element={withSuspense(DarNewForm)} />
            <Route path="dar/new/revision" element={withSuspense(DarRevisionForm)} />
            <Route path="dar/new/obsolete" element={withSuspense(DarObsoleteForm)} />
            <Route path="dar/list" element={withSuspense(DarList)} />
            <Route path="dar/:id" element={withSuspense(DarDetail)} />

            <Route path="tasks" element={withSuspense(TaskInbox)} />
            <Route path="tasks/review/:id" element={withSuspense(TaskReview)} />
            <Route path="tasks/approve/:id" element={withSuspense(TaskApprove)} />
            <Route path="tasks/ack/:id" element={withSuspense(TaskAck)} />
            <Route path="tasks/revise/:id" element={withSuspense(TaskRevise)} />
            <Route path="tasks/approve-replacement/:id" element={withSuspense(TaskApproveReplacement)} />

            <Route path="library" element={withSuspense(Library)} />
            <Route path="library/:id" element={withSuspense(LibraryDetail)} />
            <Route path="viewer/:docId/:rev" element={withSuspense(Viewer)} />

            <Route path="admin/health" element={withSuspense(AdminHealth)} />
            <Route path="admin/action-log" element={withSuspense(ActionLog)} />
            <Route path="reports" element={withSuspense(Reports)} />

            <Route path="controlled-copy" element={withSuspense(ControlledCopyRegister)} />
            <Route path="external-docs" element={withSuspense(ExternalDocsList)} />
            <Route path="master-list" element={withSuspense(MasterList)} />
            
            <Route path="periodic-reviews" element={withSuspense(PeriodicReviewDashboard)} />
            <Route path="periodic-reviews/schedule" element={withSuspense(MasterReviewSchedule)} />
            <Route path="periodic-reviews/my-tasks" element={withSuspense(MyReviewTasks)} />
            <Route path="periodic-reviews/:reviewId" element={withSuspense(PeriodicReviewDetail)} />
          </Route>

          {/* Aliases for backwards compatibility */}
          <Route path="dashboard" element={<Navigate to="/dcc/dashboard" replace />} />
          <Route path="dar/new" element={<Navigate to="/dcc/dar/new" replace />} />
          <Route path="dar/new/document" element={<Navigate to="/dcc/dar/new/document" replace />} />
          <Route path="dar/new/revision" element={<Navigate to="/dcc/dar/new/revision" replace />} />
          <Route path="dar/new/obsolete" element={<Navigate to="/dcc/dar/new/obsolete" replace />} />
          <Route path="dar/list" element={<Navigate to="/dcc/dar/list" replace />} />
          <Route path="dar/:id" element={<AliasRedirect to="/dcc/dar/:id" />} />

          <Route path="tasks" element={<Navigate to="/dcc/tasks" replace />} />
          <Route path="tasks/review/:id" element={<AliasRedirect to="/dcc/tasks/review/:id" />} />
          <Route path="tasks/approve/:id" element={<AliasRedirect to="/dcc/tasks/approve/:id" />} />
          <Route path="tasks/ack/:id" element={<AliasRedirect to="/dcc/tasks/ack/:id" />} />
          <Route path="tasks/revise/:id" element={<AliasRedirect to="/dcc/tasks/revise/:id" />} />
          <Route path="tasks/approve-replacement/:id" element={<AliasRedirect to="/dcc/tasks/approve-replacement/:id" />} />

          <Route path="library" element={<Navigate to="/dcc/library" replace />} />
          <Route path="library/:id" element={<AliasRedirect to="/dcc/library/:id" />} />
          <Route path="viewer/:docId/:rev" element={<AliasRedirect to="/dcc/viewer/:docId/:rev" />} />

          <Route path="admin/health" element={<Navigate to="/dcc/admin/health" replace />} />
          <Route path="admin/action-log" element={<Navigate to="/dcc/admin/action-log" replace />} />
          <Route path="reports" element={<Navigate to="/dcc/reports" replace />} />

          <Route path="controlled-copy" element={<Navigate to="/dcc/controlled-copy" replace />} />
          <Route path="external-docs" element={<Navigate to="/dcc/external-docs" replace />} />
          <Route path="master-list" element={<Navigate to="/dcc/master-list" replace />} />
          
          <Route path="periodic-reviews" element={<Navigate to="/dcc/periodic-reviews" replace />} />
          <Route path="periodic-reviews/schedule" element={<Navigate to="/dcc/periodic-reviews/schedule" replace />} />
          <Route path="periodic-reviews/my-tasks" element={<Navigate to="/dcc/periodic-reviews/my-tasks" replace />} />
          <Route path="periodic-reviews/:reviewId" element={<AliasRedirect to="/dcc/periodic-reviews/:reviewId" />} />

          {/* NC/CAPA Routes (Kept for backwards compatibility) */}
          <Route path="nc-capa" element={withSuspense(NcCapaDashboard)} />
          <Route path="nc-capa/list" element={withSuspense(NcCapaList)} />
          <Route path="nc-capa/new" element={withSuspense(NcCapaNew)} />
          <Route path="nc-capa/my-tasks" element={withSuspense(NcCapaMyTasks)} />
          <Route path="nc-capa/:ncId" element={withSuspense(NcCapaDetail)} />

          {/* Quality Event Routes (Phase 12 Aliases & Placeholders) */}
          <Route path="quality-event">
            <Route index element={<Navigate to="dashboard" replace />} />
            <Route path="dashboard" element={withSuspense(QualityEventDashboard)} />
            <Route path="my-tasks" element={withSuspense(NcCapaMyTasks)} />
            <Route path="capa" element={withSuspense(CapaList)} />
            <Route path="capa/new" element={withSuspense(CapaNew)} />
            <Route path="capa/:id" element={withSuspense(CapaDetail)} />
            <Route path="ncr" element={withSuspense(NcrList)} />
            <Route path="ncr/new" element={withSuspense(NcrNew)} />
            <Route path="ncr/:id" element={withSuspense(NcrDetail)} />
            <Route path="complaint" element={withSuspense(ComplaintList)} />
            <Route path="complaint/new" element={withSuspense(ComplaintNew)} />
            <Route path="complaint/:id" element={withSuspense(ComplaintDetail)} />
            <Route path="reports" element={withSuspense(ReportsPlaceholder)} />
            <Route path="master-data" element={withSuspense(MasterDataPlaceholder)} />
            <Route path="list" element={withSuspense(NcCapaList)} />
            <Route path="new" element={withSuspense(NcCapaNew)} />
            <Route path=":ncId" element={withSuspense(NcCapaDetail)} />
          </Route>

          {/* Future Modules */}
          <Route path="audit" element={withSuspense(() => <ComingSoonModule moduleName="Internal Audit" />)} />
          <Route path="training" element={withSuspense(() => <ComingSoonModule moduleName="Training Management" />)} />
          <Route path="change-control" element={withSuspense(() => <ComingSoonModule moduleName="Change Control" />)} />
          <Route path="supplier" element={withSuspense(() => <ComingSoonModule moduleName="Supplier Management" />)} />
          <Route path="complaints" element={withSuspense(() => <ComingSoonModule moduleName="Customer Complaint" />)} />
          <Route path="calibration" element={withSuspense(() => <ComingSoonModule moduleName="Calibration / Equipment" />)} />
          
          {/* Prototypes */}
          <Route path="demo-distribution" element={withSuspense(DistributionDemo)} />

          <Route path="*" element={withSuspense(NotFound)} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
