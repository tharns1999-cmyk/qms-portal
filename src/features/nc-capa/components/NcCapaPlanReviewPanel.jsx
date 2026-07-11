import React, { useState } from 'react';
import { useNcCapaTranslation } from '../locales/ncCapaTranslations';
import { CheckCircle, XCircle } from 'lucide-react';

const NcCapaPlanReviewPanel = ({ onApprove, onReturn }) => {
  const { t } = useNcCapaTranslation();
  
  const [action, setAction] = useState('');
  const [form, setForm] = useState({
    comment: '',
    returnReason: ''
  });
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    setError('');
    
    if (action === 'APPROVE') {
      setIsSubmitting(true);
      try {
        await onApprove({ comment: form.comment });
        setAction('');
      } catch (err) {
        setError(err.message);
      } finally {
        setIsSubmitting(false);
      }
    } else if (action === 'RETURN') {
      if (!form.returnReason.trim()) {
        setError('Please provide a reason for return.');
        return;
      }
      setIsSubmitting(true);
      try {
        await onReturn({ returnReason: form.returnReason });
        setAction('');
      } catch (err) {
        setError(err.message);
      } finally {
        setIsSubmitting(false);
      }
    }
  };

  return (
    <div className="bg-white rounded-xl border-2 border-indigo-200 shadow-sm overflow-hidden mb-6">
      <div className="bg-indigo-50 px-6 py-4 border-b border-indigo-100 flex items-center justify-between">
        <div className="flex items-center">
          <CheckCircle size={20} className="text-indigo-600 mr-2" />
          <h3 className="font-bold text-indigo-900">{t('review', 'actionRequired')}</h3>
        </div>
        <span className="text-xs font-medium text-indigo-600 bg-indigo-100 px-2 py-1 rounded">QA/QC</span>
      </div>
      
      <div className="p-6">
        <div className="flex gap-4 mb-6">
          <button 
            onClick={() => { setAction('APPROVE'); setError(''); }}
            className={`flex-1 flex flex-col items-center justify-center p-4 rounded-xl border-2 transition-all ${
              action === 'APPROVE' 
                ? 'border-green-500 bg-green-50 text-green-700 shadow-sm' 
                : 'border-zinc-200 hover:border-green-300 hover:bg-green-50/50 text-zinc-600'
            }`}
          >
            <CheckCircle size={32} className={`mb-2 ${action === 'APPROVE' ? 'text-green-500' : 'text-zinc-400'}`} />
            <span className="font-semibold">{t('review', 'approve')}</span>
          </button>

          <button 
            onClick={() => { setAction('RETURN'); setError(''); }}
            className={`flex-1 flex flex-col items-center justify-center p-4 rounded-xl border-2 transition-all ${
              action === 'RETURN' 
                ? 'border-orange-500 bg-orange-50 text-orange-700 shadow-sm' 
                : 'border-zinc-200 hover:border-orange-300 hover:bg-orange-50/50 text-zinc-600'
            }`}
          >
            <XCircle size={32} className={`mb-2 ${action === 'RETURN' ? 'text-orange-500' : 'text-zinc-400'}`} />
            <span className="font-semibold">{t('review', 'return')}</span>
          </button>
        </div>

        {action && (
          <div className="bg-zinc-50 rounded-lg p-5 border border-zinc-200 animate-in fade-in duration-200">
            {error && <div className="mb-4 text-red-600 text-sm p-3 bg-red-50 border border-red-200 rounded">{error}</div>}
            
            {action === 'APPROVE' && (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1">{t('review', 'approveComment')}</label>
                  <textarea 
                    className="w-full p-2 border rounded focus:ring-2 focus:ring-green-500 focus:border-green-500" rows="3"
                    value={form.comment}
                    onChange={e => setForm({...form, comment: e.target.value})}
                  ></textarea>
                </div>
              </div>
            )}

            {action === 'RETURN' && (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1">{t('review', 'returnReason')} <span className="text-red-500">*</span></label>
                  <textarea 
                    className="w-full p-2 border rounded focus:ring-2 focus:ring-orange-500 focus:border-orange-500" rows="3"
                    value={form.returnReason}
                    onChange={e => setForm({...form, returnReason: e.target.value})}
                  ></textarea>
                </div>
              </div>
            )}

            <div className="flex justify-end pt-4">
              <button 
                onClick={handleSubmit}
                disabled={isSubmitting}
                className={`px-6 py-2 text-white rounded font-medium disabled:opacity-50 ${
                  action === 'APPROVE' ? 'bg-green-600 hover:bg-green-700' : 'bg-orange-600 hover:bg-orange-700'
                }`}
              >
                {isSubmitting ? 'Processing...' : 'Confirm Decision'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default NcCapaPlanReviewPanel;
