import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import useStore from '../../store/useStore';
import { ArrowLeft, ExternalLink, History, FileText, Download } from 'lucide-react';
import toast from 'react-hot-toast';
import { getDarReason, getDarDetail, getRequesterName, getReviewerName, getApproverName, getAckNames } from '../../utils/darHelper';
import ReplacementModal from './ReplacementModal';
import { PDFDocument, rgb, degrees } from 'pdf-lib';
import fontkit from '@pdf-lib/fontkit';

const LibraryDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { documents, currentUser, canDownloadDocument, dars, masterUsers, timeline, controlledCopyInstances, reportCcDamagedLost } = useStore();
  
  const [selectedDar, setSelectedDar] = React.useState(null);
  const [replacementInstance, setReplacementInstance] = React.useState(null);

  const doc = documents.find(d => d.id === id);

  const ccInstances = React.useMemo(() => {
    return doc ? controlledCopyInstances.filter(inst => inst.docId === doc.id) : [];
  }, [controlledCopyInstances, doc]);

  const userActiveInstances = React.useMemo(() => {
    const dept = currentUser.department || currentUser.dept;
    return ccInstances.filter(inst => inst.department === dept && inst.status === 'ACTIVE');
  }, [ccInstances, currentUser]);

  const hasAccess = React.useMemo(() => {
    if (!doc || !currentUser) return false;
    const dept = currentUser.department || currentUser.dept;
    if (doc.department === dept) return true;
    if (doc.distributions && doc.distributions.some(d => d.departmentId === dept)) return true;
    if (currentUser.level >= 5) return true;
    if (currentUser.isDcc) return true;
    return false;
  }, [doc, currentUser]);

  React.useEffect(() => {
    if (doc && !hasAccess) {
      toast.error('Access Denied: คุณไม่มีสิทธิ์เข้าถึงเอกสารนี้');
      navigate('/library');
    }
  }, [doc, hasAccess, navigate]);

  if (!doc) return <div className="p-6">ไม่พบข้อมูลเอกสาร</div>;
  if (!hasAccess) return null; // Wait for redirect

  const canDownload = canDownloadDocument(doc, currentUser);

  const handleDownloadMaster = async () => {
    try {
      const pdfDoc = await PDFDocument.create();
      pdfDoc.registerFontkit(fontkit);
      
      let customFont;
      try {
        const fontBytes = await fetch('/fonts/NotoSansThai-Regular.ttf').then(res => {
          if (!res.ok) throw new Error('Font load failed');
          return res.arrayBuffer();
        });
        customFont = await pdfDoc.embedFont(fontBytes);
      } catch(err) {
        console.warn('Failed to load Thai font', err);
      }

      const page = pdfDoc.addPage([595.28, 841.89]); // A4
      
      const { width, height } = page.getSize();
      page.drawText('ORIGINAL', {
        x: width / 2 - 150,
        y: height / 2,
        size: 70,
        color: rgb(1, 0, 0),
        rotate: degrees(-45),
        opacity: 0.3,
      });
      
      const textOptions = { x: 50, y: height - 50, size: 12, color: rgb(0,0,0) };
      if (customFont) textOptions.font = customFont;
      page.drawText(`Document: ${doc.title} - ${doc.name}`, textOptions);
      
      const revOptions = { x: 50, y: height - 70, size: 12, color: rgb(0,0,0) };
      if (customFont) revOptions.font = customFont;
      page.drawText(`Rev: ${doc.rev}`, revOptions);
      
      const pdfBytes = await pdfDoc.save();
      const blob = new Blob([pdfBytes], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${doc.title}_MASTER.pdf`;
      link.click();
      window.URL.revokeObjectURL(url);
      
      toast.success('ดาวน์โหลด Master Document สำเร็จ');
    } catch {
      toast.error('เกิดข้อผิดพลาดในการสร้าง PDF');
    }
  };

  const handleDownloadExternal = async () => {
    try {
      const pdfDoc = await PDFDocument.create();
      pdfDoc.registerFontkit(fontkit);
      
      let customFont;
      try {
        const fontBytes = await fetch('/fonts/NotoSansThai-Regular.ttf').then(res => {
          if (!res.ok) throw new Error('Font load failed');
          return res.arrayBuffer();
        });
        customFont = await pdfDoc.embedFont(fontBytes);
      } catch(err) {
        console.warn('Failed to load Thai font', err);
      }

      const page = pdfDoc.addPage([595.28, 841.89]); // A4
      const { height } = page.getSize();
      
      if (customFont) {
        page.drawText('CONFIDENTIAL', { x: 80, y: height / 2 + 40, size: 50, color: rgb(1,0,0), rotate: degrees(-30), opacity: 0.3, font: customFont });
        page.drawText('เอกสารภายในหน่วยงาน ห้าม Copy', { x: 80, y: height / 2, size: 30, color: rgb(1,0,0), rotate: degrees(-30), opacity: 0.3, font: customFont });
      } else {
         page.drawText('CONFIDENTIAL\\nเอกสารภายในหน่วยงาน ห้าม Copy', {
          x: 50, y: height / 2, size: 30, color: rgb(1, 0, 0), rotate: degrees(-30), opacity: 0.3, lineHeight: 40,
        });
      }
      
      const textOptions = { x: 50, y: height - 50, size: 12, color: rgb(0,0,0) };
      if (customFont) textOptions.font = customFont;
      page.drawText(`Document: ${doc.title} - ${doc.name}`, textOptions);
      
      const revOptions = { x: 50, y: height - 70, size: 12, color: rgb(0,0,0) };
      if (customFont) revOptions.font = customFont;
      page.drawText(`Rev: ${doc.rev}`, revOptions);
      
      const pdfBytes = await pdfDoc.save();
      const blob = new Blob([pdfBytes], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${doc.title}_EXTERNAL.pdf`;
      link.click();
      window.URL.revokeObjectURL(url);
      
      toast.success('ดาวน์โหลดเอกสารสำหรับหน่วยงานภายนอกสำเร็จ');
    } catch (error) {
      console.error(error);
      toast.error('เกิดข้อผิดพลาดในการสร้าง PDF');
    }
  };

  // Get all revisions of this document
  const allRevs = documents.filter(d => d.title === doc.title).sort((a, b) => parseInt(b.rev) - parseInt(a.rev));
  
  // Get latest DAR for the current document
  const latestDar = doc.darId 
    ? dars.find(dar => dar.id === doc.darId)
    : dars.slice().reverse().find(dar => {
        if (!['COMPLETED', 'APPROVED_WAITING_EFFECTIVE', 'WAITING_EFFECTIVE', 'EFFECTIVE'].includes(dar.status)) return false;
        if (doc.rev === '00' && (dar.type === 'NEW' || dar.type === 'NEW_DOCUMENT')) {
           return dar.docIdInput === doc.title;
        } else if (doc.rev !== '00' && dar.type === 'REVISION') {
           return dar.title === doc.name || (dar.docIdRef && documents.find(d => d.id === dar.docIdRef)?.title === doc.title);
        }
        return false;
      });

  // getRequesterName, getReviewerName, getApproverName, getAckNames are imported from darHelper.js

  return (
    <div className="max-w-5xl mx-auto space-y-6">

      <div className="flex items-center gap-4">
        <button onClick={() => navigate('/library')} className="p-2 hover:bg-gray-200  rounded-full transition-colors print:hidden">
          <ArrowLeft className="text-gray-600" size={24} strokeWidth={1.25}/>
        </button>
        <h2 className="text-2xl font-bold text-gray-800 ">{doc.title}: {doc.name}</h2>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-7 space-y-6">
          <div className="premium-card p-8 border-none">
            <h3 className="font-semibold text-gray-800  border-b border-gray-100  pb-2 mb-4">ข้อมูลเอกสาร</h3>
            <div className="grid grid-cols-2 gap-y-4 gap-x-8 text-sm">
              <div><span className="text-gray-500  w-32 inline-block">รหัสเอกสาร:</span> <span className="font-medium text-gray-900 ">{doc.title}</span></div>
              <div><span className="text-gray-500  w-32 inline-block">Revision:</span> <span className="font-medium text-gray-900 ">{doc.rev}</span></div>
              <div><span className="text-gray-500  w-32 inline-block">แผนก (Owner):</span> <span className="font-medium text-gray-900 ">{doc.department}</span></div>
              <div><span className="text-gray-500  w-32 inline-block">สถานะ:</span> <span className={`font-medium px-2 py-0.5 rounded ${doc.status === 'OBSOLETE' || doc.status === 'OBSOLETE_ARCHIVED' ? 'text-gray-600  bg-gray-100  ' : 'text-green-600  bg-green-50  '}`}>{doc.status === 'SUPERSEDED_ARCHIVED' ? 'SUPERSEDED' : doc.status}</span></div>
              
              <div className="col-span-2 border-t border-gray-100  pt-4 mt-2"></div>
              
              <div><span className="text-gray-500  w-32 inline-block">ประเภทการขอ:</span> <span className="font-medium text-gray-900 ">{latestDar?.type === 'NEW' || latestDar?.type === 'NEW_DOCUMENT' ? 'New Document' : latestDar?.type === 'REVISION' ? 'Revision' : latestDar?.type === 'OBSOLETE' ? 'Obsolete' : '-'}</span></div>
              <div><span className="text-gray-500  w-32 inline-block">วันที่บังคับใช้:</span> <span className="font-medium text-gray-900 ">{doc.effectiveDate || latestDar?.effectiveDate || '-'}</span></div>
              <div><span className="text-gray-500  w-32 inline-block">ผู้ร้องขอ:</span> <span className="font-medium text-gray-900 ">{getRequesterName(latestDar, masterUsers)}</span></div>
              <div><span className="text-gray-500  w-32 inline-block">ผู้ทวนสอบ:</span> <span className="font-medium text-gray-900 ">{getReviewerName(latestDar, timeline)}</span></div>
              <div><span className="text-gray-500  w-32 inline-block">ผู้อนุมัติ:</span> <span className="font-medium text-gray-900 ">{getApproverName(latestDar, timeline)}</span></div>
              <div className="col-span-2"><span className="text-gray-500  w-32 inline-block">แผนการแจกจ่าย:</span> <span className="font-medium text-gray-900 ">{doc.distributions && doc.distributions.length > 0 ? doc.distributions.map(d => d.departmentId).join(', ') : '-'}</span></div>
              
              {(latestDar?.ackRequirement === 'REQUIRED' || getAckNames(latestDar, timeline) !== '-') && (
                <div className="col-span-2"><span className="text-gray-500  w-32 inline-block">ผู้รับทราบ (Ack):</span> <span className="font-medium text-gray-900 ">{getAckNames(latestDar, timeline)}</span></div>
              )}
              
              <div className="col-span-2 mt-2 pt-4 border-t border-gray-100 ">
                <span className="text-gray-500  block mb-1">{getDarReason(latestDar).title}</span> 
                <p className="font-medium text-gray-900  bg-gray-50  p-3 rounded-lg border border-gray-100  whitespace-pre-wrap">{getDarReason(latestDar).value}</p>
              </div>

              <div className="col-span-2 mt-2">
                <span className="text-gray-500  block mb-1">{getDarDetail(latestDar).title}</span> 
                <p className="font-medium text-gray-900  bg-gray-50  p-3 rounded-lg border border-gray-100  whitespace-pre-wrap">{getDarDetail(latestDar).value}</p>
              </div>
            </div>
            
            {!canDownload && (
              <div className="mt-4 p-3 bg-yellow-50 text-yellow-800 text-sm border border-yellow-200 rounded-lg flex gap-2">
                <FileText className="shrink-0 mt-0.5" size={24} strokeWidth={1.25}/>
                <span>
                  <strong>Preview Only (Global View):</strong> คุณสามารถเปิดดูเอกสารนี้ได้ แต่ไม่ได้รับอนุญาตให้ดาวน์โหลดเพื่อป้องกันการเกิดสำเนาควบคุมภายนอกระบบ
                </span>
              </div>
            )}
            <button 
              onClick={() => navigate(`/viewer/${doc.id}/${doc.rev}`)}
              className="mt-4 w-full flex items-center justify-center gap-2 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium print:hidden"
            >
              <ExternalLink size={20} strokeWidth={1.25}/> เปิดดูเอกสาร PDF
            </button>
              {canDownload && (
                <div className="flex flex-col gap-2 mt-4">
                  <button 
                    onClick={handleDownloadMaster}
                    className="flex items-center justify-center gap-2 px-6 py-2.5 bg-indigo-600 text-white hover:bg-indigo-700 rounded-xl font-medium transition-all shadow-sm shadow-indigo-200"
                  >
                    <Download size={20} strokeWidth={1.25}/> {doc.title.startsWith('FM') ? 'Print / Download Form (No Watermark)' : 'Download Master File'}
                  </button>
                  <button 
                    onClick={handleDownloadExternal}
                    className="flex items-center justify-center gap-2 px-6 py-2.5 bg-amber-500 text-white hover:bg-amber-600 rounded-xl font-medium transition-all shadow-sm shadow-amber-200"
                  >
                    <Download size={20} strokeWidth={1.25}/> Download for External Use
                  </button>
                </div>
              )}
          </div>

          {/* Normal User: Show their active copy and allow requesting replacement */}
          {!currentUser.isDcc && userActiveInstances.length > 0 && (
            <div className="premium-card p-8 mt-4 border border-indigo-100 bg-indigo-50/30">
              <h3 className="font-semibold text-gray-800  mb-4">สำเนาควบคุมของแผนกท่าน (Your Department's Controlled Copy)</h3>
              <div className="space-y-4">
                {userActiveInstances.map(inst => (
                  <div key={inst.id} className="bg-white p-4 rounded-xl border border-gray-200 flex items-center justify-between">
                    <div>
                      <div className="font-mono font-medium text-gray-800 ">{inst.ccNumber}</div>
                      <div className="text-xs text-gray-500 ">Issue: {inst.issueNumber}</div>
                    </div>
                    <button 
                      onClick={() => setReplacementInstance(inst)}
                      className="text-xs px-3 py-1.5 bg-red-50 text-red-600  rounded-lg hover:bg-red-100 transition-colors font-medium border border-red-100"
                    >
                      แจ้งชำรุด/สูญหาย
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Controlled Copies Tracker (Only for DCC Admin) */}
          {currentUser.isDcc && (
            <div className="premium-card p-8 border-none mt-4">
              <div className="flex items-center justify-between border-b border-gray-100  pb-3 mb-4">
                <h3 className="font-semibold text-gray-800 ">สำเนาควบคุม (Controlled Copies Tracker)</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead className="bg-gray-50  text-gray-600  font-medium">
                    <tr>
                      <th className="px-4 py-2 rounded-l-lg">CC Number</th>
                      <th className="px-4 py-2">Department</th>
                      <th className="px-4 py-2">Issue No.</th>
                      <th className="px-4 py-2">Status</th>
                      <th className="px-4 py-2 text-right rounded-r-lg">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50 ">
                    {ccInstances.map((inst) => (
                      <tr key={inst.id} className="hover:bg-slate-50  transition-colors">
                        <td className="px-4 py-3 font-medium text-gray-900 ">{inst.ccNumber}</td>
                        <td className="px-4 py-3 text-gray-600 ">{inst.department}</td>
                        <td className="px-4 py-3 text-gray-600 ">{inst.issueNumber}</td>
                        <td className="px-4 py-3">
                          <span className="px-2 py-1 bg-green-50 text-green-700    rounded text-xs font-medium border border-green-100 ">
                            {inst.status}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <button 
                            onClick={() => setReplacementInstance(inst)}
                            className="text-xs px-3 py-1.5 bg-red-50 text-red-600    rounded-lg hover:bg-red-100  transition-colors font-medium border border-red-100 "
                          >
                            แจ้งชำรุด/สูญหาย
                          </button>
                        </td>
                      </tr>
                    ))}
                    {ccInstances.length === 0 && (
                      <tr>
                        <td colSpan="5" className="px-4 py-8 text-center text-gray-500 ">
                          ไม่มีการพิมพ์สำเนาควบคุมสำหรับเอกสารนี้
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        <div className="lg:col-span-5">
          <div className="premium-card overflow-hidden border-none">
            <div className="px-6 py-4 border-b border-gray-100  flex items-center gap-2 bg-gray-50 ">
              <History className="text-gray-500" size={24} strokeWidth={1.25}/>
              <h3 className="font-semibold text-gray-800 ">ประวัติ Revision (Revision History)</h3>
            </div>
            <div className="p-6">
              <div className="space-y-6 relative before:absolute before:inset-0 before:ml-5 before:-translate-x-px before:h-full before:w-0.5 before:bg-gray-200 ">
                {allRevs.map((revDoc, index) => {
                  const isCurrent = index === 0;
                  // Approximation for historical DARs based on mock data structure
                  const revDar = dars.slice().reverse().find(dar => 
                    ['COMPLETED', 'APPROVED_WAITING_EFFECTIVE', 'WAITING_EFFECTIVE', 'EFFECTIVE'].includes(dar.status) && 
                    ((dar.type === 'NEW' && dar.docIdInput === revDoc.title) || (dar.type === 'REVISION' && dar.docIdRef === revDoc.title))
                  );

                  return (
                    <div key={revDoc.id} className="relative flex items-start gap-4">
                      <div className={`flex items-center justify-center w-10 h-10 rounded-full border-4 border-white  ${isCurrent ? 'bg-blue-100 text-blue-600    shadow' : 'bg-gray-100 text-gray-500   '} shrink-0 z-10`}>
                        <FileText size={24} strokeWidth={1.25}/>
                      </div>
                      <div className={`w-full ${isCurrent ? 'bg-white  border-blue-200  shadow-sm' : 'bg-gray-50  border-gray-200 '} p-4 rounded-xl border`}>
                        <div className="flex justify-between items-center mb-1">
                          <span className={`font-bold ${isCurrent ? 'text-blue-600 ' : 'text-gray-600 '}`}>
                            Rev {revDoc.rev} {isCurrent ? '(Current)' : '(Archived)'}
                          </span>
                          <div className="flex flex-col items-end gap-0.5">
                            <span className="text-xs font-medium text-gray-500 ">Effective: {revDoc.effectiveDate || '-'}</span>
                            {!isCurrent && (
                              <span className="text-xs font-medium text-red-400">Archived: {revDar?.date || 'Unknown'}</span>
                            )}
                          </div>
                        </div>
                        <p className={`text-sm ${isCurrent ? 'text-gray-600 ' : 'text-gray-500 '}`}>
                          {isCurrent ? 'เอกสารฉบับปัจจุบัน' : 'เอกสารฉบับเก่า (ยกเลิกแล้ว)'}
                        </p>
                        
                        {!isCurrent && (
                          <div className="mt-3 flex items-center gap-4">
                            <button 
                              onClick={() => navigate(`/viewer/${revDoc.id}/${revDoc.rev}?archive=true`)}
                              className="text-xs text-blue-600  hover:underline flex items-center gap-1 font-medium px-2 py-1 bg-blue-50   rounded"
                            >
                              <ExternalLink size={20} strokeWidth={1.25}/> เปิดดูฉบับเก่า (PDF)
                            </button>
                            {revDar && (
                              <button 
                                onClick={() => setSelectedDar(revDar)}
                                className="text-xs text-purple-600  hover:underline flex items-center gap-1 font-medium px-2 py-1 bg-purple-50   rounded"
                              >
                                <History size={20} strokeWidth={1.25}/> ดูใบคำขอ (DAR)
                              </button>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* DAR Details Modal */}
      {selectedDar && (
        <div className="fixed inset-0 bg-gray-900/60 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-300 ease-out border-none">
            <div className="flex justify-between items-center p-4 border-b border-gray-100 bg-gray-50">
              <h3 className="font-bold text-gray-800  text-lg">รายละเอียดใบคำขอ (Historical DAR)</h3>
              <button 
                onClick={() => setSelectedDar(null)} 
                className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-200 text-gray-600  hover:bg-red-100 hover:text-red-600  transition-colors"
              >
                &times;
              </button>
            </div>
            <div className="p-6 overflow-y-auto space-y-4 text-sm">
              <div className="grid grid-cols-2 gap-y-4 gap-x-6">
                <div><span className="text-gray-500  block text-xs">DAR No:</span> <span className="font-medium text-gray-900 ">{selectedDar.id}</span></div>
                <div><span className="text-gray-500  block text-xs">ประเภทคำขอ:</span> <span className="font-medium text-gray-900 ">{selectedDar.type}</span></div>
                <div><span className="text-gray-500  block text-xs">วันที่ร้องขอ:</span> <span className="font-medium text-gray-900 ">{selectedDar.date}</span></div>
                <div><span className="text-gray-500  block text-xs">วันที่มีผล (Effective):</span> <span className="font-medium text-gray-900 ">{selectedDar.effectiveDate || '-'}</span></div>
                
                <div className="col-span-2 border-t border-gray-100 pt-3"></div>

                <div><span className="text-gray-500  block text-xs">ผู้ร้องขอ:</span> <span className="font-medium text-gray-900 ">{getRequesterName(selectedDar, masterUsers)}</span></div>
                <div><span className="text-gray-500  block text-xs">แผนก:</span> <span className="font-medium text-gray-900 ">{selectedDar.department}</span></div>
                <div><span className="text-gray-500  block text-xs">ผู้ทวนสอบ:</span> <span className="font-medium text-gray-900 ">{getReviewerName(selectedDar, timeline)}</span></div>
                <div><span className="text-gray-500  block text-xs">ผู้อนุมัติ:</span> <span className="font-medium text-gray-900 ">{getApproverName(selectedDar, timeline)}</span></div>
                
                <div className="col-span-2"><span className="text-gray-500  block text-xs">แผนการแจกจ่าย:</span> <span className="font-medium text-gray-900 ">{selectedDar.distributionMode === 'ALL' ? 'ทุกแผนก (All Departments)' : (selectedDar.distributedDepts?.join(', ') || '-')}</span></div>
                {(selectedDar.ackRequirement === 'REQUIRED' || getAckNames(selectedDar, timeline) !== '-') && (
                  <div className="col-span-2"><span className="text-gray-500  block text-xs">ผู้รับทราบ (Ack):</span> <span className="font-medium text-gray-900 ">{getAckNames(selectedDar, timeline)}</span></div>
                )}
                
                <div className="col-span-2"><span className="text-gray-500  block text-xs">สถานะ:</span> <span className={`font-medium ${selectedDar.status === 'CANCELLED' ? 'text-red-600 ' : 'text-gray-900 '}`}>{selectedDar.status}</span></div>
              </div>
              <div className="border-t border-gray-100 pt-4 mt-4">
                <span className="text-gray-500  block text-xs mb-1">{getDarReason(selectedDar).title}</span>
                <p className="font-medium text-gray-900  bg-gray-50 p-3 rounded-lg border border-gray-200 whitespace-pre-wrap">{getDarReason(selectedDar).value}</p>
              </div>
              <div className="pt-2">
                <span className="text-gray-500  block text-xs mb-1">{getDarDetail(selectedDar).title}</span>
                <p className="font-medium text-gray-900  bg-gray-50 p-3 rounded-lg border border-gray-200 whitespace-pre-wrap">{getDarDetail(selectedDar).value}</p>
              </div>
            </div>
            <div className="p-4 border-t border-gray-100 bg-gray-50 flex justify-end">
              <button 
                onClick={() => setSelectedDar(null)}
                className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 font-medium"
              >
                ปิดหน้าต่าง
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Replacement Modal */}
      <ReplacementModal 
        isOpen={!!replacementInstance} 
        onClose={(success, type, reason) => {
          if (success) {
            reportCcDamagedLost(replacementInstance.id, type, reason);
            toast.success(`ส่งคำขอเบิกเอกสารทดแทนสำเร็จ รอ DCC อนุมัติ`);
          }
          setReplacementInstance(null);
        }} 
        instance={replacementInstance} 
        documentId={doc.id}
      />
    </div>
  );
};

export default LibraryDetail;
