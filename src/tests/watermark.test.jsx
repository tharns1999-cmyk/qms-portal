import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import PdfStamper from '../../backend/utils/PdfStamper';
import * as pdfLib from 'pdf-lib';

describe('PDF Watermark Logic Tests', () => {
  let mockDrawText;

  beforeEach(() => {
    mockDrawText = vi.fn();
    
    const mockPage = {
      getSize: () => ({ width: 1000, height: 1000 }),
      drawText: mockDrawText,
    };
    
    const mockPdfDoc = {
      embedFont: vi.fn().mockResolvedValue({
        widthOfTextAtSize: vi.fn().mockReturnValue(200),
        heightAtSize: vi.fn().mockReturnValue(50),
      }),
      getPages: vi.fn().mockReturnValue([mockPage]),
      save: vi.fn().mockResolvedValue(Buffer.from('mock-pdf')),
    };

    vi.spyOn(pdfLib.PDFDocument, 'load').mockResolvedValue(mockPdfDoc);
    vi.spyOn(pdfLib, 'rgb').mockReturnValue('mock-rgb');
    vi.spyOn(pdfLib, 'degrees').mockReturnValue('mock-degrees-45');
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should place watermark at Top-Left if docType starts with FM', async () => {
    const mockBuffer = Buffer.from('dummy');
    await PdfStamper.stampUncontrolled(mockBuffer, { docType: 'FM-001' });

    expect(mockDrawText).toHaveBeenCalledWith(
      'UNCONTROLLED WHEN PRINTED',
      expect.objectContaining({
        x: 50,
        y: 950,
        rotate: undefined
      })
    );
  });

  it('should place watermark at Diagonal Center if docType does not start with FM', async () => {
    const mockBuffer = Buffer.from('dummy');
    await PdfStamper.stampUncontrolled(mockBuffer, { docType: 'WI-002' });

    expect(mockDrawText).toHaveBeenCalledWith(
      'UNCONTROLLED WHEN PRINTED',
      expect.objectContaining({
        x: 450,
        y: 425,
        rotate: expect.objectContaining({ angle: 45 })
      })
    );
  });
});
