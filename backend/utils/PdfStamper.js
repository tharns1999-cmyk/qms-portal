const { PDFDocument, rgb, degrees, StandardFonts } = require('pdf-lib');

class PdfStamper {
  
  /**
   * Stamps the given PDF buffer as "UNCONTROLLED WHEN PRINTED"
   * @param {Buffer} pdfBuffer - Original PDF Buffer
   * @returns {Promise<Buffer>} - Modified PDF Buffer
   */
  static async stampUncontrolled(pdfBuffer) {
    const pdfDoc = await PDFDocument.load(pdfBuffer);
    const font = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
    const pages = pdfDoc.getPages();

    for (const page of pages) {
      const { width, height } = page.getSize();
      const text = 'UNCONTROLLED WHEN PRINTED';
      const textSize = 40;
      
      // Calculate position for a diagonal watermark across the center
      const textWidth = font.widthOfTextAtSize(text, textSize);
      const textHeight = font.heightAtSize(textSize);
      
      page.drawText(text, {
        x: width / 2 - textWidth / 2 + 50,
        y: height / 2 - textHeight / 2 - 50,
        size: textSize,
        font: font,
        color: rgb(0.8, 0.8, 0.8), // Light gray
        opacity: 0.4,
        rotate: degrees(45),
      });
    }

    return await pdfDoc.save();
  }

  /**
   * Stamps the given PDF buffer with Controlled Copy information
   * @param {Buffer} pdfBuffer - Original PDF Buffer
   * @param {Object} options - { ccNumber, department, issueNumber }
   * @returns {Promise<Buffer>} - Modified PDF Buffer
   */
  static async stampControlled(pdfBuffer, options) {
    const { ccNumber, department, issueNumber } = options;
    const pdfDoc = await PDFDocument.load(pdfBuffer);
    const font = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
    const pages = pdfDoc.getPages();

    const text = `CONTROLLED COPY | ${ccNumber} | ${department} | ISSUE ${issueNumber || '01'}`;
    const textSize = 12;

    for (const page of pages) {
      const { width, height } = page.getSize();
      
      // Place at bottom left or right to avoid overlapping content
      // We'll place it at bottom-left corner with some padding
      const padding = 30;
      
      page.drawText(text, {
        x: padding,
        y: padding,
        size: textSize,
        font: font,
        color: rgb(0.9, 0.1, 0.1), // Bright red
        opacity: 0.8,
      });
    }

    return await pdfDoc.save();
  }
}

module.exports = PdfStamper;
