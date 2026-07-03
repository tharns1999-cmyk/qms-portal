import React from 'react';
import { PackageOpen } from 'lucide-react';

const EmptyState = ({ message = "ไม่พบรายการข้อมูลที่เกี่ยวข้อง", icon: Icon = PackageOpen }) => {
  return (
    <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
      <div className="bg-gray-50 rounded-full p-4 mb-4">
        <Icon className="w-12 h-12 text-gray-300" strokeWidth={1.5} />
      </div>
      <p className="text-gray-500  font-medium">{message}</p>
      <p className="text-gray-400  text-sm mt-1">
        ยังไม่มีข้อมูลที่ต้องแสดงผลในขณะนี้
      </p>
    </div>
  );
};

export default EmptyState;
