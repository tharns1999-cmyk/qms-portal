import React from 'react';
import { Hammer } from 'lucide-react';

const ComingSoon = ({ title }) => {
  return (
    <div className="h-full w-full flex flex-col items-center justify-center text-center p-6 bg-gray-50 rounded-2xl border-2 border-dashed border-gray-200">
      <div className="w-20 h-20 bg-blue-100 text-blue-600  rounded-2xl flex items-center justify-center mb-6 shadow-sm">
        <Hammer size={40} strokeWidth={1.25}/>
      </div>
      <h2 className="text-3xl font-bold text-gray-800  mb-4">{title}</h2>
      <p className="text-gray-500  max-w-md text-lg">
        โมดูลนี้อยู่นอกเหนือขอบเขตของการพัฒนาใน Phase 1 
        และจะถูกเพิ่มเข้ามาในการอัปเดตระบบ QMS Portal ในอนาคต
      </p>
      <div className="mt-8 px-6 py-2 bg-blue-50 text-blue-700  rounded-full font-medium text-sm border border-blue-100">
        Coming Soon
      </div>
    </div>
  );
};

export default ComingSoon;
