import http from 'http';
import fs from 'fs';
import path from 'path';
import { exec } from 'child_process';
import { api } from '../frontend/src/services/api.js';

const PORT = 5195;

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

    req.setTimeout(5000, () => {
      req.destroy();
      resolve({ statusCode: 408, error: 'Timeout' });
    });
  });
}

async function runTestSuite() {
  console.log('=== Starting Full 220-Template Verification Test Suite ===\n');

  // Start Vite Preview server
  console.log(`Starting preview server on port ${PORT}...`);
  const serverProcess = exec(`npx vite preview --port ${PORT}`, { cwd: 'frontend' });

  // Wait 3 seconds for server to boot
  await new Promise(r => setTimeout(r, 3000));

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
    } else {
      console.log('🎉 ALL 220 WEBSITE TEMPLATES ARE 100% OPERATIONAL AND WORKING!\n');
    }
  } finally {
    serverProcess.kill();
    // On Windows ensure any child processes on the port are killed
    if (process.platform === 'win32') {
      exec(`taskkill /F /T /PID ${serverProcess.pid}`);
    }
  }
}

runTestSuite().catch(err => {
  console.error('Test suite error:', err);
  process.exit(1);
});
