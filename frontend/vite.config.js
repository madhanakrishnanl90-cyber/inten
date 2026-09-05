import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import fs from 'fs'
import path from 'path'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    {
      name: 'serve-templates-static-html',
      configureServer(server) {
        const mimeTypes = {
          '.html': 'text/html; charset=utf-8',
          '.js': 'application/javascript; charset=utf-8',
          '.mjs': 'application/javascript; charset=utf-8',
          '.css': 'text/css; charset=utf-8',
          '.json': 'application/json; charset=utf-8',
          '.png': 'image/png',
          '.jpg': 'image/jpeg',
          '.jpeg': 'image/jpeg',
          '.gif': 'image/gif',
          '.svg': 'image/svg+xml',
          '.webp': 'image/webp',
          '.ico': 'image/x-icon',
          '.woff': 'font/woff',
          '.woff2': 'font/woff2',
          '.ttf': 'font/ttf',
          '.mp4': 'video/mp4',
          '.webm': 'video/webm'
        };

        server.middlewares.use((req, res, next) => {
          if (req.url && req.url.startsWith('/templates/')) {
            const parsedUrl = new URL(req.url, 'http://localhost:5173');
            let pathname = decodeURIComponent(parsedUrl.pathname);

            // If it is an in-app React template preview route, delegate to SPA router
            const isReactRoute = (
              pathname.startsWith('/templates/photography/') ||
              pathname.startsWith('/templates/portfolio/')
            ) && !pathname.endsWith('.html') && !path.extname(pathname);

            if (isReactRoute) {
              return next();
            }
            
            // Normalize path for Windows / POSIX
            const rawFilePath = path.join(process.cwd(), 'public', pathname);
            if (fs.existsSync(rawFilePath) && fs.statSync(rawFilePath).isDirectory()) {
              if (!pathname.endsWith('/')) {
                res.writeHead(301, {
                  Location: pathname + '/' + (parsedUrl.search || '') + (parsedUrl.hash || '')
                });
                return res.end();
              }
              pathname += 'index.html';
            } else if (pathname.endsWith('/')) {
              pathname += 'index.html';
            }

            const filePath = path.join(process.cwd(), 'public', pathname);
            if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
              const ext = path.extname(filePath).toLowerCase();
              res.setHeader('Content-Type', mimeTypes[ext] || 'application/octet-stream');
              res.setHeader('Cache-Control', 'public, max-age=3600');
              const stream = fs.createReadStream(filePath);
              stream.on('error', () => next());
              return stream.pipe(res);
            }
          }
          next();
        });
      }
    }
  ],
  server: {
    port: 5173,
    host: '0.0.0.0',
    watch: {
      ignored: ['**/public/**', '**/dist/**']
    }
  },
  build: {
    target: 'esnext',
    chunkSizeWarningLimit: 1200,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules')) {
            if (id.includes('three') || id.includes('@react-three')) {
              return 'vendor-three';
            }
            if (id.includes('framer-motion')) {
              return 'vendor-motion';
            }
            if (id.includes('lucide-react')) {
              return 'vendor-icons';
            }
            if (id.includes('react-router-dom') || id.includes('react-dom') || id.includes('react/')) {
              return 'vendor-react';
            }
            return 'vendor-other';
          }
        }
      }
    }
  },
  optimizeDeps: {
    entries: ['index.html', 'src/main.jsx']
  }
})
