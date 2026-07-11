import React, { useState } from 'react';
import { EffectivenessResult, NC_STATUS, DocumentImpact, TrainingImpact } from '../domain/models';
import { AlertCircle } from 'lucide-react';

const NcCapaEffectivenessTab = ({ record, onSubmit, isReadOnly }) => {
  const [actualCheckDate, setActualCheckDate] = useState(record?.effectivenessCheck?.actualCheckDate?.substring(0, 10) || '');
  const [checkMethod, setCheckMethod] = useState(record?.effectivenessCheck?.checkMethod || '');
  const [recurrenceObserved, setRecurrenceObserved] = useState(
    record?.effectivenessCheck?.recurrenceObserved !== undefined ? String(record?.effectivenessCheck?.recurrenceObserved) : ''
  );
  const [result, setResult] = useState(record?.effectivenessCheck?.result || '');
  const [evidenceComment, setEvidenceComment] = useState(record?.effectivenessCheck?.evidenceComment || '');
  const [closureComment, setClosureComment] = useState(record?.effectivenessCheck?.closureComment || '');
  const [reasonComment, setReasonComment] = useState(record?.effectivenessCheck?.reasonComment || '');
  const [requiresAdditionalAction, setRequiresAdditionalAction] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    
    onSubmit({
      actualCheckDate,
      checkMethod,
      recurrenceObserved: recurrenceObserved === 'true',
      result,
      evidenceComment,
      closureComment,
      reasonComment,
      requiresAdditionalAction
    });
  };

  const isSubmitted = record?.status === NC_STATUS.CLOSED || 
                      record?.status === NC_STATUS.REOPENED || 
                      record?.status === NC_STATUS.ADDITIONAL_ACTION_REQUIRED;
                      
  const readOnly = isReadOnly || isSubmitted;

  const hasDocumentImpact = record?.capaActionPlan?.documentImpactAssessment && record?.capaActionPlan?.documentImpactAssessment !== DocumentImpact.NO_DOCUMENT_IMPACT;
  const hasTrainingImpact = record?.capaActionPlan?.trainingImpactAssessment && record?.capaActionPlan?.trainingImpactAssessment !== TrainingImpact.NO_TRAINING_IMPACT;

  return (
    <div className="bg-white border rounded-lg p-6 mb-6 shadow-sm">
      <h3 className="text-xl font-semibold mb-4 border-b pb-2">Effectiveness Check</h3>

      {!readOnly && hasDocumentImpact && (
        <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <AlertCircle className="h-5 w-5 text-yellow-400" />
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-yellow-800">Document Impact Detected</h3>
              <div className="mt-2 text-sm text-yellow-700">
                <p>This NC/CAPA has a related document impact ({record?.capaActionPlan?.documentImpactAssessment}). (Note: DAR creation is a shell for Phase 11E). Do not create DAR. Do not create Periodic Review. Do not mutate document status.</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {!readOnly && hasTrainingImpact && (
        <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <AlertCircle className="h-5 w-5 text-yellow-400" />
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-yellow-800">Training Impact Detected</h3>
              <div className="mt-2 text-sm text-yellow-700">
                <p>This NC/CAPA has a related training impact ({record?.capaActionPlan?.trainingImpactAssessment}). (Note: Training Workflow creation is a shell for Phase 11E). Do not create Training workflow. Do not create Training record.</p>
              </div>
            </div>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Actual Check Date <span className="text-red-500">*</span>
            </label>
            <input
              type="date"
              className="w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm p-2 border"
              value={actualCheckDate}
              onChange={(e) => setActualCheckDate(e.target.value)}
              required
              disabled={readOnly}
              data-testid="eff-actual-date"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Check Method / Verification Details <span className="text-red-500">*</span>
          </label>
          <textarea
            className="w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm p-2 border"
            rows="3"
            value={checkMethod}
            onChange={(e) => setCheckMethod(e.target.value)}
            required
            disabled={readOnly}
            data-testid="eff-check-method"
          ></textarea>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Recurrence Observed? <span className="text-red-500">*</span>
          </label>
          <div className="flex space-x-4" data-testid="eff-recurrence-observed">
            <label className="inline-flex items-center">
              <input
                type="radio"
                className="form-radio text-blue-600 border-gray-300"
                name="recurrenceObserved"
                value="true"
                checked={recurrenceObserved === 'true'}
                onChange={(e) => setRecurrenceObserved(e.target.value)}
                disabled={readOnly}
                required
                data-testid="eff-recurrence-yes"
              />
              <span className="ml-2 text-sm text-gray-700">Yes</span>
            </label>
            <label className="inline-flex items-center">
              <input
                type="radio"
                className="form-radio text-blue-600 border-gray-300"
                name="recurrenceObserved"
                value="false"
                checked={recurrenceObserved === 'false'}
                onChange={(e) => setRecurrenceObserved(e.target.value)}
                disabled={readOnly}
                required
                data-testid="eff-recurrence-no"
              />
              <span className="ml-2 text-sm text-gray-700">No</span>
            </label>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Evidence / Additional Comments
          </label>
          <textarea
            className="w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm p-2 border"
            rows="3"
            value={evidenceComment}
            onChange={(e) => setEvidenceComment(e.target.value)}
            disabled={readOnly}
            data-testid="eff-evidence-comment"
          ></textarea>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Effectiveness Result <span className="text-red-500">*</span>
            </label>
            <select
              className="w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm p-2 border bg-white"
              value={result}
              onChange={(e) => setResult(e.target.value)}
              required
              disabled={readOnly}
              data-testid="eff-result-select"
            >
              <option value="" disabled>Select a result...</option>
              <option value={EffectivenessResult.EFFECTIVE}>Effective (Close CAPA)</option>
              <option value={EffectivenessResult.PARTIALLY_EFFECTIVE}>Partially Effective</option>
              <option value={EffectivenessResult.NOT_EFFECTIVE}>Not Effective</option>
              <option value={EffectivenessResult.NEED_ADDITIONAL_ACTION}>Need Additional Action</option>
              <option value={EffectivenessResult.REOPEN_CAPA}>Reopen CAPA</option>
            </select>
          </div>
        </div>

        {result === EffectivenessResult.PARTIALLY_EFFECTIVE && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Requires Additional Action?
            </label>
            <div className="flex space-x-4">
              <label className="inline-flex items-center">
                <input
                  type="radio"
                  className="form-radio text-blue-600 border-gray-300"
                  name="requiresAdditionalAction"
                  value="true"
                  checked={requiresAdditionalAction === true}
                  onChange={(e) => setRequiresAdditionalAction(e.target.value === 'true')}
                  disabled={readOnly}
                />
                <span className="ml-2 text-sm text-gray-700">Yes</span>
              </label>
              <label className="inline-flex items-center">
                <input
                  type="radio"
                  className="form-radio text-blue-600 border-gray-300"
                  name="requiresAdditionalAction"
                  value="false"
                  checked={requiresAdditionalAction === false}
                  onChange={(e) => setRequiresAdditionalAction(e.target.value === 'true')}
                  disabled={readOnly}
                />
                <span className="ml-2 text-sm text-gray-700">No</span>
              </label>
            </div>
          </div>
        )}

        {result === EffectivenessResult.EFFECTIVE && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Closure Comment <span className="text-red-500">*</span>
            </label>
            <textarea
              className="w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm p-2 border"
              rows="3"
              value={closureComment}
              onChange={(e) => setClosureComment(e.target.value)}
              required
              disabled={readOnly}
              data-testid="eff-closure-comment"
            ></textarea>
            {recurrenceObserved === 'true' && (
              <p className="mt-1 text-sm text-gray-500">Justification required because recurrence was observed</p>
            )}
          </div>
        )}

        {(result === EffectivenessResult.NOT_EFFECTIVE || 
          result === EffectivenessResult.REOPEN_CAPA || 
          result === EffectivenessResult.NEED_ADDITIONAL_ACTION ||
          (result === EffectivenessResult.PARTIALLY_EFFECTIVE && requiresAdditionalAction) ||
          (result === EffectivenessResult.EFFECTIVE && recurrenceObserved === 'true')) && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Reason / Justification <span className="text-red-500">*</span>
            </label>
            <textarea
              className="w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm p-2 border"
              rows="3"
              value={reasonComment}
              onChange={(e) => setReasonComment(e.target.value)}
              required={result !== EffectivenessResult.EFFECTIVE}
              disabled={readOnly}
              data-testid="eff-reason-comment"
            ></textarea>
          </div>
        )}

        {!readOnly && (
          <div className="mt-6 flex justify-end">
            <button
              type="submit"
              className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              data-testid="eff-submit-button"
            >
              Submit Effectiveness Check
            </button>
          </div>
        )}
      </form>
    </div>
  );
};

export default NcCapaEffectivenessTab;
