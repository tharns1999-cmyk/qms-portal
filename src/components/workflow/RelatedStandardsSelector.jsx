import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const OPTIONS = [
  'GHPs / HACCP',
  'ISO 9001',
  'ISO 14001',
  'FSSC 22000',
  'BRCGS',
  'ปฏิบัติการทั่วไป (General Operations)',
  'อื่น ๆ (Others)'
];

const RelatedStandardsSelector = ({ value, onChange, error }) => {
  // value: { relatedStandards: string[], otherStandardDetail: string }

  const handleCheckboxChange = (option) => {
    let newStandards = [...(value?.relatedStandards || [])];
    
    if (newStandards.includes(option)) {
      newStandards = newStandards.filter(s => s !== option);
    } else {
      newStandards.push(option);
    }
    
    // If "Others" is unchecked, clear the detail text
    let newDetail = value?.otherStandardDetail || '';
    if (!newStandards.includes('อื่น ๆ (Others)')) {
      newDetail = '';
    }

    onChange({
      ...value,
      relatedStandards: newStandards,
      otherStandardDetail: newDetail
    });
  };

  const handleOtherDetailChange = (e) => {
    onChange({
      ...value,
      otherStandardDetail: e.target.value
    });
  };

  const isOthersSelected = (value?.relatedStandards || []).includes('อื่น ๆ (Others)');

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-5 w-full">
      <div className="mb-4">
        <h3 className="text-sm font-semibold text-slate-800">ระบบมาตรฐานที่เกี่ยวข้อง (Related Standards)</h3>
        <p className="text-xs text-slate-500 mt-0.5">เลือกได้มากกว่า 1 ข้อ</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-y-3 gap-x-6">
        {OPTIONS.map(option => (
          <label key={option} className="flex items-center gap-2.5 cursor-pointer group">
            <div className="relative flex items-center justify-center">
              <input
                type="checkbox"
                className="peer sr-only"
                checked={(value?.relatedStandards || []).includes(option)}
                onChange={() => handleCheckboxChange(option)}
              />
              <div className="w-4 h-4 border border-slate-300 rounded-[3px] peer-checked:bg-indigo-600 peer-checked:border-indigo-600 transition-colors flex items-center justify-center group-hover:border-indigo-400">
                <svg className="w-3 h-3 text-white opacity-0 peer-checked:opacity-100" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              </div>
            </div>
            <span className="text-[14px] text-slate-700 select-none group-hover:text-slate-900">{option}</span>
          </label>
        ))}
      </div>

      <AnimatePresence>
        {isOthersSelected && (
          <motion.div
            initial={{ opacity: 0, height: 0, marginTop: 0 }}
            animate={{ opacity: 1, height: 'auto', marginTop: 16 }}
            exit={{ opacity: 0, height: 0, marginTop: 0 }}
            className="overflow-hidden"
          >
            <input
              type="text"
              placeholder="โปรดระบุมาตรฐานหรือข้อกำหนดอื่นๆ..."
              value={value?.otherStandardDetail || ''}
              onChange={handleOtherDetailChange}
              className={`w-full px-3 py-2 text-[14px] border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-colors ${
                error ? 'border-red-500 bg-red-50' : 'border-slate-200'
              }`}
            />
            {error && (
              <p className="text-red-500 text-xs mt-1.5 font-medium">{error}</p>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default RelatedStandardsSelector;
