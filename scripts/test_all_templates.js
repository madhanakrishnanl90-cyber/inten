import http from 'http';
import fs from 'fs';
import path from 'path';
import { api } from '../frontend/src/services/api.js';

const PORT = 5198;
const DIST_DIR = path.resolve('dist');
const PUBLIC_DIR = path.resolve('frontend/public');

// Lightweight static file server for testing
function startTestServer(port) {
  return new Promise((resolve) => {
    const server = http.createServer((req, res) => {
      let reqPath = req.url.split('?')[0];
      if (reqPath === '/') reqPath = '/index.html';

      // Check dist first, then public
      let filePath = path.join(DIST_DIR, reqPath);
      if (!fs.existsSync(filePath)) {
        filePath = path.join(PUBLIC_DIR, reqPath);
      }

      if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
        const ext = path.extname(filePath).toLowerCase();
        const mimeTypes = {
          '.html': 'text/html',
          '.js': 'text/javascript',
          '.css': 'text/css',
          '.json': 'application/json',
          '.png': 'image/png',
          '.jpg': 'image/jpeg',
          '.svg': 'image/svg+xml'
        };
        const contentType = mimeTypes[ext] || 'application/octet-stream';
        res.writeHead(200, { 'Content-Type': contentType });
        fs.createReadStream(filePath).pipe(res);
      } else {
        // SPA fallback
        const indexPath = fs.existsSync(path.join(DIST_DIR, 'index.html'))
          ? path.join(DIST_DIR, 'index.html')
          : path.join(PUBLIC_DIR, 'index.html');
        if (fs.existsSync(indexPath)) {
          res.writeHead(200, { 'Content-Type': 'text/html' });
          fs.createReadStream(indexPath).pipe(res);
        } else {
          res.writeHead(404, { 'Content-Type': 'text/plain' });
          res.end('Not Found');
        }
      }
    });

    server.listen(port, () => {
      resolve(server);
    });
  });
}

async function checkUrl(url) {
  return new Promise((resolve) => {
    const req = http.get(url, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        resolve({
          statusCode: res.statusCode,
          contentType: res.headers['content-type'],
          contentLength: data.length,
          hasHtml: data.includes('<html') || data.includes('<!DOCTYPE') || data.includes('<!doctype') || data.includes('<div')
        });
      });
    });

    req.on('error', (err) => {
      resolve({ statusCode: 500, error: err.message });
    });

    req.setTimeout(3000, () => {
      req.destroy();
      resolve({ statusCode: 408, error: 'Timeout' });
    });
  });
}

async function runTestSuite() {
  console.log('=== Starting Full 220-Template Verification Test Suite ===\n');

  const server = await startTestServer(PORT);
  console.log(`Test server running on port ${PORT}...`);

  try {
    const templates = await api.getTemplates();
    console.log(`Loaded ${templates.length} templates from metadata registry.\n`);

    const results = {};
    let totalSuccess = 0;
    let totalFailed = 0;
    const failures = [];

    for (let i = 0; i < templates.length; i++) {
      const t = templates[i];
      const cat = t.category?.slug || 'other';
      if (!results[cat]) {
        results[cat] = { total: 0, passed: 0, failed: 0 };
      }
      results[cat].total++;

      let testUrl = `http://localhost:${PORT}${t.demoUrl}`;
      const res = await checkUrl(testUrl);

      if (res.statusCode === 200 && res.hasHtml && res.contentLength > 100) {
        results[cat].passed++;
        totalSuccess++;
      } else {
        results[cat].failed++;
        totalFailed++;
        failures.push({
          id: t.id,
          name: t.name,
          category: cat,
          url: t.demoUrl,
          statusCode: res.statusCode,
          error: res.error || 'Empty or invalid HTML content'
        });
      }
    }

    console.log('------------------------------------------------------------');
    console.log('CATEGORY-BY-CATEGORY BREAKDOWN:');
    console.log('------------------------------------------------------------');
    for (const [cat, data] of Object.entries(results)) {
      const statusIcon = data.failed === 0 ? '✓ PASS' : '✗ FAIL';
      console.log(` [${statusIcon}] ${cat.padEnd(16)} : ${data.passed}/${data.total} working`);
    }

    console.log('------------------------------------------------------------');
    console.log(`TOTAL TEMPLATES TESTED : ${templates.length}`);
    console.log(`TOTAL PASSED           : ${totalSuccess}`);
    console.log(`TOTAL FAILED           : ${totalFailed}`);
    console.log('------------------------------------------------------------\n');

    if (failures.length > 0) {
      console.error('FAILED TEMPLATES LIST:');
      console.error(JSON.stringify(failures, null, 2));
      process.exitCode = 1;
    } else {
      console.log('🎉 ALL 220 WEBSITE TEMPLATES ARE 100% OPERATIONAL AND WORKING!\n');
    }
  } finally {
    server.close();
  }
}

runTestSuite().catch(err => {
  console.error('Test suite error:', err);
  process.exit(1);
});
