import React from 'react';
import { useNavigate } from 'react-router-dom';
import { FilePlus, Edit, Trash2 } from 'lucide-react';

const DarSelection = () => {
  const navigate = useNavigate();

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-800 ">สร้าง DAR (Document Action Request)</h2>
        <p className="text-gray-500  mt-1">กรุณาเลือกประเภทของคำร้องที่คุณต้องการดำเนินการ</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
        {/* New Document */}
        <div 
          onClick={() => navigate('/dar/new/document')}
          className="bg-white border border-gray-200 rounded-xl p-6 cursor-pointer hover:shadow-lg hover:border-blue-300 transition-all group"
        >
          <div className="w-12 h-12 bg-blue-50 text-blue-600  rounded-lg flex items-center justify-center mb-4 group-hover:bg-blue-600 group-hover:text-white transition-colors">
            <FilePlus className="w-6 h-6" />
          </div>
          <h3 className="text-lg font-bold text-gray-800  mb-2">ขึ้นทะเบียนเอกสารใหม่ (New)</h3>
          <p className="text-sm text-gray-500 ">สร้างเอกสารฉบับใหม่ที่ไม่เคยมีในระบบมาก่อน</p>
        </div>

        {/* Revision */}
        <div 
          onClick={() => navigate('/dar/new/revision')}
          className="bg-white border border-gray-200 rounded-xl p-6 cursor-pointer hover:shadow-lg hover:green-border-300 transition-all group"
        >
          <div className="w-12 h-12 bg-green-50 text-green-600  rounded-lg flex items-center justify-center mb-4 group-hover:bg-green-600 group-hover:text-white transition-colors">
            <Edit className="w-6 h-6" />
          </div>
          <h3 className="text-lg font-bold text-gray-800  mb-2">แก้ไขเอกสาร (Revision)</h3>
          <p className="text-sm text-gray-500 ">อัปเดตหรือแก้ไขเอกสารที่มีสถานะ EFFECTIVE อยู่ในปัจจุบัน</p>
        </div>

        {/* Obsolete */}
        <div 
          onClick={() => navigate('/dar/new/obsolete')}
          className="bg-white border border-gray-200 rounded-xl p-6 cursor-pointer hover:shadow-lg hover:border-red-300 transition-all group"
        >
          <div className="w-12 h-12 bg-red-50 text-red-600  rounded-lg flex items-center justify-center mb-4 group-hover:bg-red-600 group-hover:text-white transition-colors">
            <Trash2 className="w-6 h-6" />
          </div>
          <h3 className="text-lg font-bold text-gray-800  mb-2">ยกเลิกเอกสาร (Obsolete)</h3>
          <p className="text-sm text-gray-500 ">ขอยกเลิกการใช้งานเอกสารที่มีสถานะ EFFECTIVE อย่างถาวร</p>
        </div>
      </div>
    </div>
  );
};

export default DarSelection;
