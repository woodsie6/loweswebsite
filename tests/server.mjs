import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { extname, resolve, sep } from 'node:path';

const root = resolve(new URL('..', import.meta.url).pathname);
const htaccess = await readFile(resolve(root, '.htaccess'), 'utf8');
const csp = htaccess.match(/Header set Content-Security-Policy "([^"]+)"/)?.[1];

if (!csp) throw new Error('Unable to read Content-Security-Policy from .htaccess');

const mimeTypes = {
  '.css': 'text/css; charset=utf-8',
  '.html': 'text/html; charset=utf-8',
  '.ico': 'image/x-icon',
  '.jpg': 'image/jpeg',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.svg': 'image/svg+xml',
  '.webp': 'image/webp',
};

const server = createServer(async (request, response) => {
  try {
    const url = new URL(request.url ?? '/', 'http://127.0.0.1');
    const requestedPath = decodeURIComponent(url.pathname === '/' ? '/index.html' : url.pathname);
    const filePath = resolve(root, `.${requestedPath}`);

    if (!filePath.startsWith(`${root}${sep}`)) {
      response.writeHead(403).end('Forbidden');
      return;
    }

    const fileStat = await stat(filePath);
    const resolvedPath = fileStat.isDirectory() ? resolve(filePath, 'index.html') : filePath;
    const contents = await readFile(resolvedPath);

    response.writeHead(200, {
      'Cache-Control': 'no-store',
      'Content-Security-Policy': csp,
      'Content-Type': mimeTypes[extname(resolvedPath)] ?? 'application/octet-stream',
      'Referrer-Policy': 'strict-origin-when-cross-origin',
      'X-Content-Type-Options': 'nosniff',
    });
    response.end(contents);
  } catch {
    response.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' }).end('Not found');
  }
});

server.listen(4173, '127.0.0.1', () => {
  console.log('Test server listening on http://127.0.0.1:4173');
});

const close = () => server.close(() => process.exit(0));
process.on('SIGINT', close);
process.on('SIGTERM', close);
