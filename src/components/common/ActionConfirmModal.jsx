import React, { useState, useEffect } from 'react';
import { CheckCircle, AlertTriangle, XCircle, FileText, ArrowRight, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import Button from '../ui/Button';

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
  const [isSuccess, setIsSuccess] = useState(false);

  // Reset typed confirmation when modal opens
  useEffect(() => {
    if (isOpen) {
      setTypedConfirmation('');
      setIsSuccess(false);
    }
  }, [isOpen]);

  const handleConfirmClick = () => {
    setIsSuccess(true);
    setTimeout(() => {
      onConfirm();
    }, 800);
  };

  const getStyles = () => {
    switch (actionType) {
      case 'approve':
        return {
          icon: <CheckCircle className="w-5 h-5 text-emerald-600" />,
          bg: 'bg-emerald-50',
          border: 'border-emerald-200',
          btn: 'bg-emerald-600 hover:bg-emerald-700 text-white border-emerald-600',
          defaultText: 'Confirm Approval'
        };
      case 'reject':
        return {
          icon: <XCircle className="w-5 h-5 text-rose-600" />,
          bg: 'bg-rose-50',
          border: 'border-rose-200',
          btn: 'bg-rose-600 hover:bg-rose-700 text-white border-rose-600',
          defaultText: 'Confirm Rejection'
        };
      case 'obsolete':
        return {
          icon: <AlertTriangle className="w-5 h-5 text-amber-600" />,
          bg: 'bg-amber-50',
          border: 'border-amber-200',
          btn: 'bg-amber-600 hover:bg-amber-700 text-white border-amber-600',
          defaultText: 'Confirm Obsolete'
        };
      case 'acknowledge':
        return {
          icon: <CheckCircle className="w-5 h-5 text-teal-600" />,
          bg: 'bg-teal-50',
          border: 'border-teal-200',
          btn: 'bg-teal-600 hover:bg-teal-700 text-white border-teal-600',
          defaultText: 'Acknowledge'
        };
      case 'distribute':
        return {
          icon: <ArrowRight className="w-5 h-5 text-zinc-900" />,
          bg: 'bg-zinc-100',
          border: 'border-zinc-300',
          btn: 'bg-zinc-900 hover:bg-zinc-800 text-white border-zinc-900',
          defaultText: 'Distribute'
        };
      case 'submit':
      default:
        return {
          icon: <FileText className="w-5 h-5 text-zinc-900" />,
          bg: 'bg-zinc-100',
          border: 'border-zinc-200',
          btn: 'bg-zinc-900 hover:bg-zinc-800 text-white border-zinc-900',
          defaultText: 'Confirm Submission'
        };
    }
  };

  const styles = getStyles();
  const isTypeConfirmed = !requireTypeToConfirm || typedConfirmation === 'CONFIRM';
  const isConfirmDisabled = isLoading || !isTypeConfirmed || isSuccess;

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-900/40 p-4">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ type: "spring", stiffness: 450, damping: 30 }}
            className="bg-white rounded-xl w-full max-w-xl shadow-xl border border-zinc-200 flex flex-col max-h-[90vh] overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
        {/* Header */}
        <div className={`px-6 py-4 border-b flex items-center justify-between ${styles.bg}`}>
          <div className="flex items-center gap-3">
            <div className={`flex items-center justify-center w-8 h-8 bg-white rounded-lg shadow-sm border ${styles.border}`}>
              {styles.icon}
            </div>
            <h2 className="text-lg font-semibold text-zinc-900 tracking-tight">{title}</h2>
          </div>
          <Button 
            onClick={onClose}
            className="p-1.5 hover:bg-white/50 rounded-md transition-colors text-zinc-500 hover:text-zinc-900"
            disabled={isLoading}
          >
            <X className="w-4 h-4" />
          </Button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto flex-1 bg-zinc-50/50">
          <p className="text-sm text-zinc-600 mb-5">Please review the summary details below before proceeding.</p>

          <div className="bg-white rounded-lg border border-zinc-200 divide-y divide-zinc-100">
            {summaryData.map((item, idx) => (
              <div key={idx} className="flex flex-col sm:flex-row sm:items-start p-3 gap-1 sm:gap-4 hover:bg-zinc-50 transition-colors">
                <span className="text-[13px] font-medium text-zinc-500 w-1/3 shrink-0">{item.label}</span>
                <span className="text-[13px] font-medium text-zinc-900 break-words">{item.value || '-'}</span>
              </div>
            ))}
          </div>

          {requireTypeToConfirm && (
            <div className="mt-5 bg-rose-50 p-4 rounded-lg border border-rose-200">
              <label className="block text-sm font-medium text-rose-900 mb-2">
                This is a destructive action. Type <strong className="select-all bg-white px-1 py-0.5 rounded border border-rose-300 font-mono text-xs">CONFIRM</strong> to proceed:
              </label>
              <input
                type="text"
                value={typedConfirmation}
                onChange={(e) => setTypedConfirmation(e.target.value)}
                placeholder="Type CONFIRM"
                className="w-full px-3 py-2 text-sm border border-rose-300 rounded-md focus:outline-none focus:ring-1 focus:ring-rose-500 focus:border-rose-500 transition-colors font-mono"
                disabled={isLoading}
              />
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-zinc-200 flex justify-end gap-3 bg-white">
          <motion.button
            whileTap={{ scale: 0.96, transition: { type: "spring", stiffness: 500, damping: 30 } }}
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-lg text-sm font-medium text-zinc-700 bg-white border border-zinc-200 hover:bg-zinc-50 transition-colors"
            disabled={isLoading || isSuccess}
          >
            Cancel
          </motion.button>
          <motion.button
            whileTap={!isConfirmDisabled ? { scale: 0.96, transition: { type: "spring", stiffness: 500, damping: 30 } } : {}}
            type="button"
            onClick={handleConfirmClick}
            disabled={isConfirmDisabled}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center justify-center gap-2 min-w-[120px] border ${
              isConfirmDisabled ? 'opacity-50 cursor-not-allowed bg-zinc-100 text-zinc-500 border-zinc-200' : styles.btn
            }`}
          >
            <AnimatePresence mode="wait" initial={false}>
              {isSuccess ? (
                <motion.div
                  key="success"
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  transition={{ duration: 0.2 }}
                >
                  <CheckCircle className="w-4 h-4 text-white" />
                </motion.div>
              ) : isLoading ? (
                <motion.div
                  key="loading"
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -5 }}
                  className="flex items-center gap-2"
                >
                  <svg className="animate-spin h-3.5 w-3.5 text-current" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Processing...
                </motion.div>
              ) : (
                <motion.span
                  key="text"
                  initial={{ opacity: 0, y: -5 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 5 }}
                >
                  {confirmText || styles.defaultText}
                </motion.span>
              )}
            </AnimatePresence>
          </motion.button>
        </div>
      </motion.div>
    </div>
      )}
    </AnimatePresence>
  );
};

export default ActionConfirmModal;
