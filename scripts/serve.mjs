// Local development server. No npm dependencies or build step required.
import {createServer} from 'node:http';
import {createReadStream} from 'node:fs';
import {stat} from 'node:fs/promises';
import {extname, isAbsolute, relative, resolve} from 'node:path';
import {fileURLToPath} from 'node:url';

const root = fileURLToPath(new URL('../dist/', import.meta.url));
const host = process.env.NHA_MINH_HOST || '127.0.0.1';
const port = Number(process.env.NHA_MINH_PORT || 5173);
if (!Number.isInteger(port) || port < 1 || port > 65535) {
  throw new Error('NHA_MINH_PORT must be an integer between 1 and 65535.');
}
const mimeTypes = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.png': 'image/png',
  '.webp': 'image/webp', '.avif': 'image/avif', '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon', '.woff2': 'font/woff2'
};
function reply(response, status, text) {
  response.writeHead(status, {'Content-Type': 'text/plain; charset=utf-8'});
  response.end(text);
}
const server = createServer(async (request, response) => {
  if (!['GET', 'HEAD'].includes(request.method)) {
    response.setHeader('Allow', 'GET, HEAD');
    return reply(response, 405, 'Method not allowed.');
  }
  let pathname;
  try { pathname = decodeURIComponent(new URL(request.url, 'http://localhost').pathname); }
  catch { return reply(response, 400, 'Invalid path.'); }
  if (pathname.includes('\0')) return reply(response, 400, 'Invalid path.');
  const file = resolve(root, '.' + (pathname === '/' ? '/index.html' : pathname));
  const relativePath = relative(root, file);
  if (relativePath.startsWith('..') || isAbsolute(relativePath)) {
    return reply(response, 403, 'Access denied.');
  }
  try {
    const metadata = await stat(file);
    if (!metadata.isFile()) return reply(response, 404, 'File not found.');
    response.writeHead(200, {
      'Content-Type': mimeTypes[extname(file).toLowerCase()] || 'application/octet-stream',
      'Content-Length': metadata.size,
      'Cache-Control': 'no-store',
      'X-Content-Type-Options': 'nosniff',
      'Referrer-Policy': 'strict-origin-when-cross-origin'
    });
    if (request.method === 'HEAD') return response.end();
    const stream = createReadStream(file);
    stream.on('error', () => response.destroy());
    stream.pipe(response);
  } catch { reply(response, 404, 'File not found.'); }
});
server.on('error', error => {
  if (error.code === 'EADDRINUSE') {
    console.error(`Port ${port} is in use. Choose another port using NHA_MINH_PORT.`);
  } else console.error(error.message);
  process.exitCode = 1;
});
server.listen(port, host, () => {
  console.log(`Nhà mình TV: http://${host}:${port}`);
  console.log('Serving dist/ directly. Edit files and reload the browser. Ctrl+C to stop.');
});
