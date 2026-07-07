import React from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import useStore from '../../store/useStore';
import { ArrowLeft, ChevronLeft, ChevronRight, ZoomIn, ZoomOut, Download } from 'lucide-react';

const Viewer = () => {
  const { docId, rev } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const isArchive = searchParams.get('archive') === 'true';
  const { documents, currentUser, canDownloadDocument } = useStore();
  
  const doc = documents.find(d => d.id === docId);
  const title = doc ? doc.title : docId;
  const canDownload = doc && !isArchive ? canDownloadDocument(doc, currentUser) : false;

  return (
    <div className="h-full flex flex-col bg-gray-900 rounded-xl overflow-hidden shadow-xl border border-gray-800">
      {/* Viewer Toolbar */}
      <div className="bg-gray-800 text-gray-200 px-4 py-3 flex items-center justify-between shadow-md z-10">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate(-1)} className="p-1.5 hover:bg-gray-700 rounded transition-colors">
            <ArrowLeft size={24} strokeWidth={1.25}/>
          </button>
          <div className="font-medium text-sm md:text-base truncate max-w-[200px] md:max-w-md">
            {title} (Rev: {rev}) {isArchive && <span className="ml-2 px-2 py-0.5 bg-red-500/20 text-red-400 rounded text-xs border border-red-500/30">ARCHIVED</span>}
          </div>
        </div>
        
        <div className="flex items-center gap-1 md:gap-4">
          <div className="hidden md:flex items-center gap-2 bg-gray-700 rounded px-2 py-1">
            <button className="p-1 hover:bg-gray-600 rounded"><ZoomOut size={24} strokeWidth={1.25}/></button>
            <span className="text-xs w-10 text-center">100%</span>
            <button className="p-1 hover:bg-gray-600 rounded"><ZoomIn size={24} strokeWidth={1.25}/></button>
          </div>
          
          <div className="flex items-center gap-2 border-l border-gray-700 pl-4">
            {canDownload ? (
              <button className="p-1.5 hover:bg-gray-700 rounded transition-colors" title="Download Document (DCC Only)">
                <Download size={24} strokeWidth={1.25}/>
              </button>
            ) : (
              <button className="p-1.5 opacity-50 cursor-not-allowed" title={isArchive ? "Archive Document (Download Disabled)" : "View Only Mode: ไม่อนุญาตให้ดาวน์โหลดเพื่อป้องกันสำเนาซ้ำซ้อน"}>
                <Download size={24} strokeWidth={1.25}/>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Viewer Canvas (Mock) */}
      <div className="flex-1 bg-gray-600 overflow-auto flex items-center justify-center p-4 md:p-8 relative">
        
        {/* Watermark Overlay for Archived Documents */}
        {isArchive && (
          <div className="absolute inset-0 pointer-events-none flex flex-col items-center justify-center z-50 overflow-hidden opacity-20">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="text-red-500  font-bold text-6xl md:text-8xl whitespace-nowrap -rotate-45 mb-32 select-none tracking-wider drop-shadow-md">
                ARCHIVE DOCUMENT
              </div>
            ))}
          </div>
        )}

        <div className="bg-white w-full max-w-4xl min-h-[800px] shadow-2xl flex flex-col items-center justify-center text-center p-12 relative z-0">
          <div className="border-4 border-dashed border-gray-300 rounded-xl p-12 w-full h-full flex flex-col items-center justify-center bg-gray-50">
            <h1 className="text-3xl font-bold text-gray-400  mb-4">Mock PDF Viewer</h1>
            <p className="text-xl text-gray-600  font-medium">Document: {title}</p>
            <p className="text-lg text-gray-500 ">Revision: {rev}</p>
            {isArchive && (
              <div className="mt-8 px-4 py-2 bg-red-100 text-red-800 rounded-full font-medium text-sm border border-red-200">
                🚨 ARCHIVE DOCUMENT (เอกสารยกเลิกแล้ว ห้ามนำไปใช้อ้างอิง)
              </div>
            )}
          </div>
        </div>
      </div>
      
      {/* Floating Pagination */}
      <div className="absolute bottom-10 left-1/2 -translate-x-1/2 bg-gray-800 text-white px-4 py-2 rounded-full flex items-center gap-4 shadow-lg border border-gray-700">
        <button className="p-1 hover:bg-gray-700 rounded-full"><ChevronLeft size={24} strokeWidth={1.25}/></button>
        <span className="text-sm font-medium">Page 1 of 5</span>
        <button className="p-1 hover:bg-gray-700 rounded-full"><ChevronRight size={24} strokeWidth={1.25}/></button>
      </div>
    </div>
  );
};

export default Viewer;
