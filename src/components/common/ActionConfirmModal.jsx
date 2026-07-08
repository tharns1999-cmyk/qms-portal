import React, { useState, useEffect } from 'react';
import { CheckCircle, AlertTriangle, XCircle, FileText, ArrowRight, X } from 'lucide-react';

/**
 * @typedef {Object} SummaryItem
 * @property {string} label
 * @property {React.ReactNode} value
 */

/**
 * ActionConfirmModal - A reusable modal to summarize and confirm actions
 *
 * @param {Object} props
 * @param {boolean} props.isOpen
 * @param {() => void} props.onClose
 * @param {() => void} props.onConfirm
 * @param {string} props.title
 * @param {'submit' | 'approve' | 'reject' | 'obsolete' | 'acknowledge' | 'distribute'} props.actionType
 * @param {SummaryItem[]} props.summaryData
 * @param {boolean} [props.requireTypeToConfirm=false]
 * @param {boolean} [props.isLoading=false]
 * @param {string} [props.confirmText]
 */
const ActionConfirmModal = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  actionType = 'submit',
  summaryData = [],
  requireTypeToConfirm = false,
  isLoading = false,
  confirmText
}) => {
  const [typedConfirmation, setTypedConfirmation] = useState('');

  // Reset typed confirmation when modal opens
  useEffect(() => {
    if (isOpen) setTypedConfirmation('');
  }, [isOpen]);

  if (!isOpen) return null;

  const getStyles = () => {
    switch (actionType) {
      case 'approve':
        return {
          icon: <CheckCircle className="w-6 h-6 text-emerald-600" />,
          bg: 'bg-emerald-50',
          border: 'border-emerald-200',
          btn: 'bg-emerald-600 hover:bg-emerald-700 text-white',
          defaultText: 'Confirm Approval'
        };
      case 'reject':
        return {
          icon: <XCircle className="w-6 h-6 text-red-600" />,
          bg: 'bg-red-50',
          border: 'border-red-200',
          btn: 'bg-red-600 hover:bg-red-700 text-white',
          defaultText: 'Confirm Rejection'
        };
      case 'obsolete':
        return {
          icon: <AlertTriangle className="w-6 h-6 text-red-600" />,
          bg: 'bg-red-50',
          border: 'border-red-200',
          btn: 'bg-red-600 hover:bg-red-700 text-white',
          defaultText: 'Confirm Obsolete'
        };
      case 'acknowledge':
        return {
          icon: <CheckCircle className="w-6 h-6 text-teal-600" />,
          bg: 'bg-teal-50',
          border: 'border-teal-200',
          btn: 'bg-teal-600 hover:bg-teal-700 text-white',
          defaultText: 'Acknowledge'
        };
      case 'distribute':
        return {
          icon: <ArrowRight className="w-6 h-6 text-indigo-600" />,
          bg: 'bg-indigo-50',
          border: 'border-indigo-200',
          btn: 'bg-indigo-600 hover:bg-indigo-700 text-white',
          defaultText: 'Distribute'
        };
      case 'submit':
      default:
        return {
          icon: <FileText className="w-6 h-6 text-blue-600" />,
          bg: 'bg-blue-50',
          border: 'border-blue-200',
          btn: 'bg-blue-600 hover:bg-blue-700 text-white',
          defaultText: 'Confirm Submission'
        };
    }
  };

  const styles = getStyles();
  const isTypeConfirmed = !requireTypeToConfirm || typedConfirmation === 'CONFIRM';
  const isConfirmDisabled = isLoading || !isTypeConfirmed;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
      <div 
        className="bg-white rounded-2xl w-full max-w-2xl shadow-xl flex flex-col max-h-[90vh] animate-in fade-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className={`px-6 py-4 border-b flex items-center justify-between ${styles.bg} rounded-t-2xl`}>
          <div className="flex items-center gap-3">
            <div className={`p-2 bg-white rounded-xl shadow-sm ${styles.border} border`}>
              {styles.icon}
            </div>
            <h2 className="text-xl font-bold text-slate-800">{title}</h2>
          </div>
          <button 
            onClick={onClose}
            className="p-2 hover:bg-white/50 rounded-lg transition-colors text-slate-500"
            disabled={isLoading}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto flex-1">
          <p className="text-slate-600 mb-6">Please review the summary details below before proceeding.</p>

          <div className="bg-slate-50 rounded-xl border border-slate-200 divide-y divide-slate-100">
            {summaryData.map((item, idx) => (
              <div key={idx} className="flex flex-col sm:flex-row sm:items-start p-4 gap-2 sm:gap-4 hover:bg-slate-50/80 transition-colors">
                <span className="text-sm font-medium text-slate-500 w-1/3 shrink-0">{item.label}</span>
                <span className="text-sm font-semibold text-slate-800 break-words">{item.value || '-'}</span>
              </div>
            ))}
          </div>

          {requireTypeToConfirm && (
            <div className="mt-6 bg-red-50 p-4 rounded-xl border border-red-100">
              <label className="block text-sm font-semibold text-red-900 mb-2">
                This is a destructive action. Type <strong className="select-all bg-white px-1 py-0.5 rounded border border-red-200">CONFIRM</strong> to proceed:
              </label>
              <input
                type="text"
                value={typedConfirmation}
                onChange={(e) => setTypedConfirmation(e.target.value)}
                placeholder="Type CONFIRM"
                className="w-full px-4 py-2 border border-red-200 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-all font-mono outline-none"
                disabled={isLoading}
              />
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-100 flex justify-end gap-3 bg-slate-50 rounded-b-2xl">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl font-medium text-slate-600 hover:bg-slate-200 transition-colors"
            disabled={isLoading}
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isConfirmDisabled}
            className={`px-5 py-2.5 rounded-xl font-medium transition-all shadow-sm ${
              isConfirmDisabled ? 'opacity-50 cursor-not-allowed grayscale' : styles.btn
            }`}
          >
            {isLoading ? 'Processing...' : (confirmText || styles.defaultText)}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ActionConfirmModal;
