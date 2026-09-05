import fs from 'fs';
import path from 'path';

function updateImports(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const e of entries) {
    const full = path.join(dir, e.name);
    if (e.isDirectory()) {
      updateImports(full);
    } else if (full.endsWith('.jsx') || full.endsWith('.js') || full.endsWith('.css')) {
      let content = fs.readFileSync(full, 'utf8');
      let original = content;

      // Replace imports that went up one level to go up two levels
      content = content.replace(/(from\s+['\"])(\.\.\/(components|data|services|assets)\/)/g, '$1../../$3/');
      content = content.replace(/(import\s+['\"])(\.\.\/(components|data|services|assets)\/)/g, '$1../../$3/');

      if (content !== original) {
        fs.writeFileSync(full, content, 'utf8');
        console.log('Updated imports in:', full);
      }
    }
  }
}

updateImports('frontend/src/templates-preview');
console.log('All templates-preview relative imports updated.');
