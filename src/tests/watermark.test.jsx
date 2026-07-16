// @vitest-environment node
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import PdfStamper from '../../backend/utils/PdfStamper';
import { PDFDocument, PDFPage } from '../../backend/node_modules/pdf-lib';

describe('PDF Watermark Logic Tests', () => {
  let drawTextSpy;

  beforeEach(() => {
    drawTextSpy = vi.spyOn(PDFPage.prototype, 'drawText');
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should place watermark at Top-Left if docType starts with FM', async () => {
    const pdfDoc = await PDFDocument.create();
    pdfDoc.addPage([1000, 1000]);
    const mockBuffer = await pdfDoc.save();

    await PdfStamper.stampUncontrolled(mockBuffer, { docType: 'FM-001' });

    expect(drawTextSpy).toHaveBeenCalledWith(
      'UNCONTROLLED WHEN PRINTED',
      expect.objectContaining({
        x: 50,
        y: 950,
        rotate: undefined
      })
    );
  });

  it('should place watermark at Diagonal Center if docType does not start with FM', async () => {
    const pdfDoc = await PDFDocument.create();
    pdfDoc.addPage([1000, 1000]);
    const mockBuffer = await pdfDoc.save();

    await PdfStamper.stampUncontrolled(mockBuffer, { docType: 'WI-002' });

    expect(drawTextSpy).toHaveBeenCalledWith(
      'UNCONTROLLED WHEN PRINTED',
      expect.objectContaining({
        // 1000 / 2 - 402 / 2 + 50 = 500 - 201 + 50 = 349 (width is ~402 depending on font)
        // We will just match the rotation to ensure the branch was hit correctly
        rotate: expect.objectContaining({ angle: 45 })
      })
    );
  });
});
