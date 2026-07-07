const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = process.env.PORT || 5173;
const DIST_DIR = path.join(__dirname, 'dist');

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml; charset=utf-8',
  '.ico': 'image/x-icon',
};

const server = http.createServer((req, res) => {
  const url = new URL(req.url, `http://${req.headers.host}`);
  const pathname = url.pathname;

  console.log(`${req.method} ${pathname}`);

  // Handle Mock API endpoints
  if (pathname === '/api/reports/controlled-copies') {
    const csv = 'Document ID,Department,Custodian,CC Number,Issue Number,Status,Created At\n' +
      'DOC-2026-001,PD,Thanawut,WI-26-001,1,ACTIVE,2026-07-01\n' +
      'DOC-2026-002,QA,Beam,WI-26-002,1,ACTIVE,2026-07-02\n';
    res.writeHead(200, {
      'Content-Type': 'text/csv',
      'Content-Disposition': 'attachment; filename="controlled_copies.csv"',
    });
    res.end(csv);
    return;
  }

  if (pathname === '/api/reports/recalls') {
    const csv = 'Superseded Doc ID,New Doc ID,CC Number,Department,Custodian,Status,Recalled At\n' +
      'DOC-2026-001,DOC-2026-001-REV1,WI-26-001,PD,Thanawut,PENDING_RETURN,2026-07-03\n';
    res.writeHead(200, {
      'Content-Type': 'text/csv',
      'Content-Disposition': 'attachment; filename="recalls.csv"',
    });
    res.end(csv);
    return;
  }

  // Sanitize path to prevent directory traversal
  const safeSuffix = path.normalize(pathname).replace(/^(\.\.[\\/])+/, '');
  let filePath = path.join(DIST_DIR, safeSuffix);

  // If path is a directory (like root '/'), serve index.html
  let isDir = false;
  try {
    const stat = fs.statSync(filePath);
    isDir = stat.isDirectory();
  } catch {
    // File doesn't exist
  }

  if (isDir) {
    filePath = path.join(filePath, 'index.html');
  }

  // Check if file exists, if not, use SPA fallback (serve index.html)
  if (!fs.existsSync(filePath)) {
    filePath = path.join(DIST_DIR, 'index.html');
  }

  const ext = path.extname(filePath).toLowerCase();
  const contentType = MIME_TYPES[ext] || 'application/octet-stream';

  fs.readFile(filePath, (err, content) => {
    if (err) {
      res.writeHead(500, { 'Content-Type': 'text/plain' });
      res.end(`Server Error: ${err.code}`);
    } else {
      res.writeHead(200, { 'Content-Type': contentType });
      res.end(content, 'utf-8');
    }
  });
});

server.listen(PORT, () => {
  console.log(`Server is running at http://localhost:${PORT}/`);
  console.log(`Press Ctrl+C to stop the server.`);
});
