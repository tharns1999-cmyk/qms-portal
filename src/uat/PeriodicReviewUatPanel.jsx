import React from 'react';
import { useNavigate } from 'react-router-dom';
import useStore from '../store/useStore';
import { UAT_PERSONAS } from './periodicReviewUatPersonas';
import { PeriodicReviewUatService, UAT_REFERENCE_DATE } from './PeriodicReviewUatService';
import { UatModeGuard } from './UatModeGuard';
import { ArrowLeft, UserCircle, Database, AlertTriangle, CheckCircle, Info } from 'lucide-react';

export default function PeriodicReviewUatPanel() {
  const navigate = useNavigate();
  const currentUser = useStore(state => state.currentUser);
  const version = PeriodicReviewUatService.getDatasetVersion();
  const metrics = PeriodicReviewUatService.getSeedMetrics();

  const isLoaded = !!version;

  const handlePersonaSelect = (pId) => {
    if (!isLoaded) return;
    PeriodicReviewUatService.switchPersona(pId);
  };

  const handleLoadBaseline = () => {
    if (window.confirm('This will wipe all current UAT progress and restore the baseline. Proceed?')) {
      PeriodicReviewUatService.seedBaseline();
    }
  };

  const handleResetCycle = () => {
    if (window.confirm('This will reset the current cycle, restoring baseline and P-001. Proceed?')) {
      PeriodicReviewUatService.seedBaseline();
    }
  };

  const handleClear = () => {
    if (window.confirm('This will completely CLEAR UAT storage. Proceed?')) {
      PeriodicReviewUatService.clearStorage();
    }
  };

  const testCases = Array.from({ length: 18 }, (_, i) => `TD-PR-${String(i + 1).padStart(3, '0')}`);

  return (
    <UatModeGuard>
      <div className="max-w-6xl mx-auto py-8 px-4">
        <button 
          onClick={() => navigate('/dcc/periodic-reviews')}
          disabled={!isLoaded}
          className={`flex items-center mb-6 gap-2 ${!isLoaded ? 'text-slate-400 cursor-not-allowed' : 'text-amber-600 hover:text-amber-800'}`}
        >
          <ArrowLeft size={20} />
          Back to Periodic Review Dashboard
        </button>

        <div className="bg-white rounded-lg shadow-sm border border-amber-200 overflow-hidden mb-8">
          <div className="bg-amber-50 px-6 py-4 border-b border-amber-200 flex justify-between items-center">
            <div>
              <h1 className="text-xl font-bold text-amber-900 flex items-center gap-2">
                <AlertTriangle className="text-amber-500" />
                Periodic Review UAT Control Panel
              </h1>
              <p className="text-amber-700 text-sm mt-1">
                This panel is exclusively for User Acceptance Testing. Changes are isolated to the UAT storage key.
              </p>
            </div>
            <div className="flex gap-2">
              {!isLoaded && (
                <button onClick={handleLoadBaseline} className="bg-amber-600 text-white px-4 py-2 rounded font-medium hover:bg-amber-700">
                  Load Baseline
                </button>
              )}
              {isLoaded && (
                <button onClick={handleResetCycle} className="bg-slate-200 text-slate-800 px-4 py-2 rounded font-medium hover:bg-slate-300">
                  Reset Cycle
                </button>
              )}
              <button onClick={handleClear} className="bg-red-100 text-red-700 px-4 py-2 rounded font-medium hover:bg-red-200">
                Clear UAT Storage
              </button>
            </div>
          </div>
          
          <div className="p-6 grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Status Section */}
            <div className="lg:col-span-1 space-y-6">
              <div>
                <h2 className="text-lg font-semibold text-slate-800 mb-4 flex items-center gap-2">
                  <Database size={20} className="text-slate-500" />
                  UAT Environment Status
                </h2>
                <div className="bg-slate-50 rounded-lg border border-slate-200 p-4 space-y-3 text-sm">
                  <div className="flex justify-between items-center">
                    <span className="text-slate-600">Status:</span>
                    {isLoaded ? (
                      <span className="text-emerald-700 font-bold bg-emerald-100 px-2 py-0.5 rounded">Loaded</span>
                    ) : (
                      <span className="text-amber-700 font-bold bg-amber-100 px-2 py-0.5 rounded">ยังไม่ได้โหลดข้อมูล UAT</span>
                    )}
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-600">Reference Date:</span>
                    <span className="font-mono font-medium text-slate-800">{UAT_REFERENCE_DATE}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-600">Dataset Version:</span>
                    <span className="font-mono font-medium text-slate-800">{version || 'Not Seeded'}</span>
                  </div>
                  <hr className="border-slate-200 my-2" />
                  <div className="grid grid-cols-2 gap-2">
                    <div className="bg-white p-2 rounded border border-slate-200 text-center">
                      <div className="text-xs text-slate-500">Schedules</div>
                      <div className="font-bold text-lg text-slate-800">{metrics.schedules}</div>
                    </div>
                    <div className="bg-white p-2 rounded border border-slate-200 text-center">
                      <div className="text-xs text-slate-500">Documents</div>
                      <div className="font-bold text-lg text-slate-800">{metrics.documents + metrics.externalDocuments}</div>
                    </div>
                    <div className="bg-white p-2 rounded border border-slate-200 text-center">
                      <div className="text-xs text-slate-500">DARs</div>
                      <div className="font-bold text-lg text-slate-800">{metrics.dars}</div>
                    </div>
                    <div className="bg-white p-2 rounded border border-slate-200 text-center">
                      <div className="text-xs text-slate-500">Tasks</div>
                      <div className="font-bold text-lg text-slate-800">{metrics.tasks}</div>
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <h2 className="text-lg font-semibold text-slate-800 mb-4 flex items-center gap-2">
                  <Info size={20} className="text-slate-500" />
                  Evidence Guidelines
                </h2>
                <div className="bg-blue-50 text-blue-900 p-4 rounded-lg border border-blue-200 text-sm space-y-2">
                  <p><strong>Screenshot Naming:</strong></p>
                  <code className="block bg-white p-1 rounded">PR-UAT-&lt;CASE-ID&gt;_&lt;PERSONA-ID&gt;_&lt;YYYYMMDD&gt;_&lt;STEP&gt;.png</code>
                  <p className="mt-2"><strong>Defect Naming:</strong></p>
                  <code className="block bg-white p-1 rounded">PR-DEF-001, PR-DEF-002...</code>
                </div>
              </div>
            </div>

            {/* Persona Switcher */}
            <div className="lg:col-span-1">
              <h2 className="text-lg font-semibold text-slate-800 mb-4 flex items-center gap-2">
                <UserCircle size={20} className="text-slate-500" />
                Active Persona
              </h2>
              <div className={`space-y-2 max-h-[600px] overflow-y-auto pr-2 ${!isLoaded ? 'opacity-50 pointer-events-none' : ''}`}>
                {Object.entries(UAT_PERSONAS).map(([pId, persona]) => {
                  const isActive = currentUser?.id === persona.id;
                  return (
                    <button
                      key={pId}
                      onClick={() => handlePersonaSelect(pId)}
                      disabled={!isLoaded}
                      className={`w-full text-left p-3 rounded border transition-all ${
                        isActive 
                          ? 'bg-amber-50 border-amber-500 ring-1 ring-amber-500' 
                          : 'bg-white border-slate-200 hover:border-amber-300 hover:bg-slate-50'
                      }`}
                    >
                      <div className="flex justify-between items-start mb-1">
                        <span className="font-bold text-slate-800">{pId}: {persona.name}</span>
                        <span className="text-xs font-mono bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded">
                          {persona.department}
                        </span>
                      </div>
                      <div className="text-xs text-slate-500 font-mono mb-1">ID: {persona.id}</div>
                      <div className="text-sm text-slate-600">
                        {persona.position} ({persona.role})
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Data Checklist */}
            <div className="lg:col-span-1">
              <h2 className="text-lg font-semibold text-slate-800 mb-4 flex items-center gap-2">
                <CheckCircle size={20} className="text-slate-500" />
                Test Data Availability
              </h2>
              <div className="bg-white rounded-lg border border-slate-200 p-4">
                <div className="grid grid-cols-2 gap-2 text-sm font-mono">
                  {testCases.map(tc => (
                    <div key={tc} className="flex items-center gap-2">
                      {isLoaded ? (
                        <CheckCircle size={14} className="text-emerald-500" />
                      ) : (
                        <div className="w-3.5 h-3.5 rounded-full border-2 border-slate-300" />
                      )}
                      <span className={isLoaded ? 'text-slate-800' : 'text-slate-400'}>{tc}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            
          </div>
        </div>
      </div>
    </UatModeGuard>
  );
}
