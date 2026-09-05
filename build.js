import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

try {
  console.log('=== Building Website Template Marketplace ===');

  const frontendDir = path.resolve('frontend');
  const srcDist = path.resolve('frontend/dist');
  const destDist = path.resolve('dist');

  // 1. Ensure frontend dependencies exist
  const frontendNodeModules = path.resolve(frontendDir, 'node_modules');
  if (!fs.existsSync(frontendNodeModules)) {
    console.log('Installing frontend dependencies...');
    execSync('npm install', { cwd: frontendDir, stdio: 'inherit' });
  }

  // 2. Build frontend SPA
  console.log('Building frontend production bundle...');
  execSync('npm run build', { cwd: frontendDir, stdio: 'inherit' });

  // 3. Mirror frontend/dist to root dist
  console.log('Syncing distribution artifacts to root dist...');
  if (fs.existsSync(destDist)) {
    fs.rmSync(destDist, { recursive: true, force: true });
  }
  fs.cpSync(srcDist, destDist, { recursive: true });

  console.log('=== Build completed successfully! ===');
} catch (error) {
  console.error('Build failed with error:', error);
  process.exit(1);
}
