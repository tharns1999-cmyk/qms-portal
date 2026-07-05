import React from 'react';
import { Settings, Check, X, ShieldAlert } from 'lucide-react';
import { motion } from 'framer-motion';

const ALL_DEPTS = ['ST', 'HSE', 'WH', 'MKT', 'PC', 'QA/QC', 'PD', 'EN', 'HR&GA'];

const DistributionManager = ({ ownerDept, distributions = [], oldDistributions = null, onChange }) => {
  const normalizedOwnerDept = (ownerDept === 'QA' || ownerDept === 'QA Super') ? 'QA/QC' : ownerDept;
  const availableDepts = ALL_DEPTS.filter(dept => dept !== normalizedOwnerDept);

  const toggleDept = (deptId) => {
    const isSelected = distributions.some(d => d.departmentId === deptId);
    if (isSelected) {
      onChange(distributions.filter(d => d.departmentId !== deptId));
    } else {
      onChange([...distributions, { departmentId: deptId }]);
    }
  };

  const getImpact = (deptId) => {
    if (!oldDistributions) return null;
    const inOld = oldDistributions.some(d => d.departmentId === deptId);
    const inNew = distributions.some(d => d.departmentId === deptId);
    if (inOld && inNew) return { status: 'คงเดิม', color: 'bg-blue-100 text-blue-700  ' };
    if (!inOld && inNew) return { status: 'เพิ่มใหม่', color: 'bg-green-100 text-green-700  ' };
    if (inOld && !inNew) return { status: 'ยกเลิก', color: 'bg-red-100 text-red-700  ' };
    return null;
  };

  return (
    <div className="premium-card overflow-hidden border-none">
      <div className="px-6 py-4 border-b border-slate-200/50  bg-slate-50/50  flex flex-col md:flex-row md:items-center justify-between gap-4 rounded-t-2xl">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-100  rounded-lg">
            <Settings className="text-blue-600" size={24} strokeWidth={1.25}/>
          </div>
          <div>
            <h3 className="font-semibold text-gray-800 ">Distribution Management</h3>
            <p className="text-sm text-gray-500 ">เลือกแผนกที่ต้องการกระจายเอกสาร (ไม่ต้องระบุจำนวน DCC จะจัดการให้)</p>
          </div>
        </div>
      </div>
      
      <div className="p-6">
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-3">
          {availableDepts.map(deptId => {
            const isSelected = distributions.some(d => d.departmentId === deptId);
            const impact = getImpact(deptId);
            const isRemoved = impact?.status === 'ยกเลิก';
            
            return (
              <motion.div
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                key={deptId}
                onClick={() => toggleDept(deptId)}
                className={`relative cursor-pointer rounded-xl p-4 border-2 transition-all duration-300 ease-fluid flex items-center justify-between
                  ${isSelected && !isRemoved 
                    ? 'border-blue-500 bg-blue-50/50  shadow-sm' 
                    : isRemoved
                    ? 'border-red-300 bg-red-50   opacity-60'
                    : 'border-slate-200  hover:border-blue-300  bg-white '
                  }
                `}
              >
                <div className="flex flex-col">
                  <span className={`font-bold text-lg ${isSelected && !isRemoved ? 'text-blue-700 ' : isRemoved ? 'text-red-700 ' : 'text-gray-700 '}`}>
                    {deptId}
                  </span>
                  {impact && (
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full w-fit mt-1 ${impact.color}`}>
                      {impact.status}
                    </span>
                  )}
                </div>
                
                <div className={`w-6 h-6 rounded-full flex items-center justify-center transition-colors
                  ${isSelected && !isRemoved ? 'bg-blue-500 text-white' : isRemoved ? 'bg-red-500 text-white' : 'bg-slate-100  text-slate-400 '}
                `}>
                  {isRemoved ? <X className="w-3.5 h-3.5" size={24} strokeWidth={1.25}/> : <Check className={`w-3.5 h-3.5 ${isSelected ? 'opacity-100' : 'opacity-0'}`} size={24} strokeWidth={1.25}/>}
                </div>
              </motion.div>
            );
          })}
        </div>
        
        {distributions.length === 0 && !oldDistributions && (
          <div className="mt-4 p-4 text-center text-gray-500  bg-gray-50  rounded-xl border border-dashed border-gray-300  flex flex-col items-center justify-center gap-2">
            <ShieldAlert className="text-yellow-500" size={28} strokeWidth={1.25}/>
            <p>ไม่ได้เลือกแผนกใดเลย (เอกสารจะถูกใช้งานเฉพาะแผนก {ownerDept} เท่านั้น)</p>
          </div>
        )}

        <div className="mt-6 p-4 bg-blue-50/50  rounded-xl border border-blue-100 ">
          <h4 className="text-sm font-semibold text-blue-800  mb-2 flex items-center gap-2">
            <ShieldAlert size={20} strokeWidth={1.25}/> Centralized DCC Rules
          </h4>
          <ul className="text-sm text-blue-700/80  space-y-1 ml-6 list-disc">
            <li><strong>Soft Copy:</strong> ผู้ใช้งานแผนกที่เลือกจะสามารถดูเอกสารในรูปแบบ View-only (ลายน้ำสีน้ำเงิน) ผ่านระบบได้ทันทีเมื่อเอกสารประกาศใช้</li>
            <li><strong>Hard Copy:</strong> ระบบไม่จำเป็นต้องระบุจำนวนหรือผู้ครอบครองอีกต่อไป DCC จะพิจารณาพิมพ์สำเนาควบคุมและประทับตราสีแดงให้ตามความจำเป็นของแต่ละจุดใช้งาน</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default DistributionManager;
