import React, { useState } from 'react';
import { Building2, Check, FileText, ShieldAlert, ChevronDown, ChevronRight } from 'lucide-react';
import useStore from '../../store/useStore';

/**
 * @typedef {Object} DistributionSetupProps
 * @property {string} ownerDept
 * @property {{ departmentId: string }[]} distributions
 * @property {{ departmentId: string }[] | null} [oldDistributions]
 * @property {(distributions: { departmentId: string, copyNo?: string }[]) => void} onChange
 * @property {boolean} [showConfirmButton]
 * @property {() => void} [onConfirm]
 * @property {Object} [document] // Optional for demo
 */

const DistributionSetup = ({ 
  ownerDept = 'PD', 
  distributions = [], 
  oldDistributions = null, 
  onChange = () => {},
  showConfirmButton = false,
  onConfirm = () => {},
  document = { docNo: 'NEW-DOCUMENT', title: 'New Document' }
}) => {
  const masterDepartments = useStore(state => state.masterDepartments) || [];
  const normalizedOwnerDept = (ownerDept === 'QA' || ownerDept === 'QA Super') ? 'QA/QC' : ownerDept;
  
  const [expandedGroups, setExpandedGroups] = useState({});

  const toggleGroup = (groupId, e) => {
    e.stopPropagation();
    setExpandedGroups(prev => ({ ...prev, [groupId]: !prev[groupId] }));
  };

  const handleToggle = (deptId) => {
    const safeDistributions = distributions || [];
    const isSelected = safeDistributions.some(d => d.departmentId === deptId);
    let newDistributions;
    if (isSelected) {
      newDistributions = safeDistributions.filter(d => d.departmentId !== deptId);
    } else {
      newDistributions = [...safeDistributions, { departmentId: deptId }];
    }
    
    // Auto-assign copy numbers before sending up
    const mapped = newDistributions.map((d, index) => ({
      ...d,
      copyNo: String(index + 2).padStart(2, '0')
    }));
    
    onChange(mapped);
  };

  const renderDeptItem = (dept, isSub = false) => {
    const safeDistributions = distributions || [];
    // Skip owner in the normal list because it's rendered at the top
    if (dept.id === normalizedOwnerDept) return null;

    if (dept.isGroup) {
      const isExpanded = expandedGroups[dept.id];
      const hasSelectedSubs = dept.subs && dept.subs.some(sub => safeDistributions.some(d => d.departmentId === sub.id));
      
      return (
        <div key={dept.id} className="space-y-1 mb-2">
          <div 
            onClick={(e) => toggleGroup(dept.id, e)}
            className={`flex items-center justify-between p-3 rounded-xl border cursor-pointer transition-colors duration-200 bg-slate-50 border-slate-200 hover:bg-slate-100`}
          >
            <div className="flex items-center gap-3">
              {isExpanded ? <ChevronDown className="w-4 h-4 text-slate-500" /> : <ChevronRight className="w-4 h-4 text-slate-500" />}
              <span className="font-semibold text-slate-700">{dept.name}</span>
            </div>
            {hasSelectedSubs && !isExpanded && (
              <span className="w-2 h-2 rounded-full bg-blue-500"></span>
            )}
          </div>
          
          {isExpanded && (
            <div className="pl-4 space-y-1 mt-1 border-l-2 border-slate-100 ml-4">
              {dept.subs.map(sub => renderDeptItem(sub, true))}
            </div>
          )}
        </div>
      );
    }

    const isSelected = safeDistributions.some(d => d.departmentId === dept.id);
    const selectionIndex = safeDistributions.findIndex(d => d.departmentId === dept.id);
    const copyNo = isSelected ? String(selectionIndex + 2).padStart(2, '0') : null;

    return (
      <div 
        key={dept.id}
        onClick={() => handleToggle(dept.id)}
        className={`flex items-center justify-between p-3 rounded-xl border cursor-pointer transition-colors duration-200
          ${isSelected 
            ? 'border-blue-500 bg-blue-50/50' 
            : 'border-slate-200 bg-white hover:border-slate-300'
          } ${isSub ? 'shadow-sm' : ''}`}
      >
        <div className="flex items-center gap-3">
          <div className={`w-5 h-5 rounded flex items-center justify-center transition-colors duration-200 shrink-0
            ${isSelected ? 'bg-blue-600' : 'border border-slate-300'}
          `}>
            {isSelected && <Check className="w-3.5 h-3.5 text-white" />}
          </div>
          <span className={`font-medium text-sm ${isSelected ? 'text-blue-900' : 'text-slate-600'}`}>
            {dept.name || dept.id}
          </span>
        </div>
        {isSelected && (
          <span className="px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-800 text-xs font-bold tracking-wide shrink-0">
            Copy {copyNo}
          </span>
        )}
      </div>
    );
  };

  // Find owner department definition to see if it has subs
  const ownerDeptObj = masterDepartments.find(d => d.id === normalizedOwnerDept) || { id: normalizedOwnerDept, name: normalizedOwnerDept };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden w-full flex flex-col md:flex-row shadow-sm">
      
      {/* Left Column: Master Document Info */}
      <div className="w-full md:w-1/3 bg-[#FAFAFA] border-b md:border-b-0 md:border-r border-slate-200 p-6 flex flex-col">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 bg-blue-100 rounded-xl">
            <FileText className="w-5 h-5 text-blue-700" />
          </div>
          <h3 className="font-semibold text-slate-800 tracking-tight">Distribution Management</h3>
        </div>
        
        <div className="space-y-4">
          <div>
            <p className="text-xs font-medium text-slate-400 uppercase tracking-wider mb-1">Doc No.</p>
            <p className="font-medium text-slate-800">{document.docNo}</p>
          </div>
          <div>
            <p className="text-xs font-medium text-slate-400 uppercase tracking-wider mb-1">Owner Dept</p>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-blue-50 text-blue-700 text-sm font-medium">
              <Building2 className="w-3.5 h-3.5" />
              {normalizedOwnerDept}
            </div>
          </div>
          <div className="pt-4 border-t border-slate-200 mt-2">
             <div className="flex items-start gap-2 text-blue-700 bg-blue-50/50 p-3 rounded-xl border border-blue-100">
                <ShieldAlert className="w-4 h-4 mt-0.5 shrink-0" />
                <p className="text-xs leading-relaxed">
                  <strong>Centralized DCC Rules:</strong> ระบบจะแจกจ่ายให้เป็น Soft Copy อัตโนมัติ (อ่านได้อย่างเดียว)
                </p>
             </div>
          </div>
        </div>
      </div>

      {/* Right Column: Distribution List */}
      <div className="w-full md:w-2/3 p-6 flex flex-col">
        <h3 className="font-semibold text-slate-800 tracking-tight mb-4">Distribution List</h3>
        <p className="text-sm text-slate-500 mb-6">เลือกแผนกที่ต้องการกระจายเอกสาร (Copy No. จะถูกเรียงลำดับอัตโนมัติ)</p>
        
        <div className="flex-1 space-y-2 mb-4 overflow-y-auto pr-2 custom-scrollbar max-h-96">
          
          {/* Owner Dept - Locked as Copy 01, with optional subs inline */}
          <div className="mb-4">
            <div className="flex items-center justify-between p-4 rounded-xl border border-slate-200 bg-[#FAFAFA] opacity-80">
              <div className="flex items-center gap-3">
                <div className="w-5 h-5 rounded bg-slate-300 flex items-center justify-center shrink-0">
                  <Check className="w-3.5 h-3.5 text-white" />
                </div>
                <span className="font-medium text-slate-700">{ownerDeptObj.name}</span>
              </div>
              <span className="px-3 py-1 rounded-full bg-slate-200 text-slate-700 text-xs font-bold tracking-wide shrink-0">
                Copy 01 (Master)
              </span>
            </div>
            
            {/* Inline render sub-departments if owner is a group */}
            {ownerDeptObj.isGroup && ownerDeptObj.subs && (
              <div className="mt-2 pl-6 pr-2 space-y-1 border-l-2 border-slate-100 ml-4 relative">
                <div className="absolute top-0 -left-[1px] w-[2px] h-4 bg-slate-200"></div>
                {ownerDeptObj.subs.map(sub => renderDeptItem({ ...sub, isGroup: false }, true))}
              </div>
            )}
          </div>

          {/* Other Departments */}
          {masterDepartments.map(dept => renderDeptItem(dept))}
        </div>
        
        {(distributions || []).length === 0 && (
          <p className="text-xs text-amber-600 bg-amber-50 p-3 rounded-lg border border-amber-200 mt-2 text-center">
            ไม่ได้เลือกแผนกใดเลย (เอกสารจะถูกใช้งานเฉพาะแผนก {normalizedOwnerDept} เท่านั้น)
          </p>
        )}

        {showConfirmButton && (
          <div className="flex justify-end pt-4 border-t border-slate-100 mt-auto">
            <button 
              onClick={onConfirm}
              className="px-6 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-medium text-sm transition-colors duration-200"
            >
              Confirm & Distribute
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default DistributionSetup;
