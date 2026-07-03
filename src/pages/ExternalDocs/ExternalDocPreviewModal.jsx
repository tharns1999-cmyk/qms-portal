import React from 'react';
import useStore from '../../store/useStore';
import { X, ShieldAlert } from 'lucide-react';

const ExternalDocPreviewModal = ({ isOpen, onClose, document }) => {
  const { currentUser } = useStore();

  if (!isOpen || !document) return null;

  const timestamp = new Date().toLocaleString('th-TH');
  const watermarkText = `EXTERNAL DOCUMENT - ${currentUser.name} - ${timestamp}`;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-gray-900/80 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl h-[85vh] flex flex-col overflow-hidden relative">
        
        {/* Header */}
        <div className="px-4 py-3 border-b border-gray-200 flex justify-between items-center bg-gray-50">
          <div className="flex items-center gap-3">
            <h2 className="text-lg font-bold text-gray-800 ">Preview: {document.title}</h2>
            {document.accessScope === 'Restricted' && (
              <span className="flex items-center gap-1 bg-red-100 text-red-700  px-2 py-0.5 rounded text-xs font-bold">
                <ShieldAlert className="w-3 h-3" />
                CONFIDENTIAL
              </span>
            )}
          </div>
          <button 
            onClick={onClose}
            className="text-gray-500  hover:text-gray-700  p-1 rounded-full hover:bg-gray-200 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* PDF Viewer Mockup with Watermark */}
        <div className="flex-1 bg-gray-200 relative overflow-hidden flex justify-center items-center p-8">
          
          {/* Watermark Overlay (Pointer Events None to allow scrolling/clicking below) */}
          <div className="absolute inset-0 pointer-events-none flex flex-col items-center justify-center overflow-hidden opacity-10 select-none z-10">
            {Array.from({ length: 15 }).map((_, i) => (
              <div 
                key={i} 
                className="whitespace-nowrap font-bold text-gray-800  transform -rotate-45 my-8 text-2xl tracking-widest"
              >
                {watermarkText.repeat(3)}
              </div>
            ))}
          </div>

          {/* Mock PDF Content */}
          <div className="bg-white w-full max-w-2xl h-full shadow-lg p-10 overflow-y-auto relative z-0 text-center flex flex-col items-center justify-center border border-gray-300">
            <div className="w-24 h-32 bg-gray-100 border border-gray-300 mb-6 flex items-center justify-center">
              <span className="text-gray-400  text-sm">PDF</span>
            </div>
            <h3 className="text-2xl font-bold text-gray-800  mb-4">{document.title}</h3>
            <p className="text-gray-600  mb-2">Source: {document.source}</p>
            <p className="text-gray-600  mb-8">Effective Date: {document.effectiveDate}</p>
            
            <div className="space-y-4 w-full text-left text-gray-400 ">
              <div className="h-4 bg-gray-100 rounded w-3/4 mx-auto"></div>
              <div className="h-4 bg-gray-100 rounded w-full mx-auto"></div>
              <div className="h-4 bg-gray-100 rounded w-5/6 mx-auto"></div>
              <div className="h-4 bg-gray-100 rounded w-full mx-auto"></div>
              <div className="h-4 bg-gray-100 rounded w-2/3 mx-auto"></div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

export default ExternalDocPreviewModal;
