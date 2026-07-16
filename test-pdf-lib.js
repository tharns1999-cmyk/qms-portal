const { PDFDocument } = require('./backend/node_modules/pdf-lib');
(async () => {
  try {
    await PDFDocument.load(Buffer.from('dummy'));
  } catch (e) {
    console.log(e);
  }
  try {
    await PDFDocument.load(new Uint8Array([1, 2, 3]));
  } catch (e) {
    console.log(e);
  }
})();
