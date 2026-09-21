// Serves a build the way GitHub Pages does, to try the demo locally before it is deployed:
//
//   npm run build:pages && npm run preview:pages      # http://localhost:4190/HRWebApp-UI/
//
// - files are served under the repository sub-path only;
// - `/HRWebApp-UI` redirects to `/HRWebApp-UI/`, and a directory serves its index.html;
// - any other path answers `404.html` with status 404, as Pages does (the SPA boots from it).
//
// Usage: node scripts/serve-pages.mjs [dir=dist-pages] [base=/HRWebApp-UI/] [port=4190]
import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { extname, join, normalize, resolve, sep } from 'node:path';

const [dirArg = 'dist-pages', baseArg = '/HRWebApp-UI/', portArg = '4190'] = process.argv.slice(2);
const root = resolve(dirArg);
const base = `/${baseArg.replace(/^\/+|\/+$/g, '')}/`.replace('//', '/');
const port = Number(portArg);

const TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.woff2': 'font/woff2',
  '.txt': 'text/plain; charset=utf-8',
};

async function fileAt(path) {
  try {
    const info = await stat(path);
    if (info.isDirectory()) return fileAt(join(path, 'index.html'));
    return info.isFile() ? path : null;
  } catch {
    return null;
  }
}

async function send(res, status, path) {
  const body = await readFile(path);
  res.writeHead(status, { 'Content-Type': TYPES[extname(path)] ?? 'application/octet-stream', 'Cache-Control': 'no-cache' });
  res.end(body);
}

const server = createServer(async (req, res) => {
  const { pathname } = new URL(req.url ?? '/', 'http://localhost');
  if (`${pathname}/` === base) {
    res.writeHead(301, { Location: base });
    return res.end();
  }
  if (pathname.startsWith(base)) {
    const relative = normalize(decodeURIComponent(pathname.slice(base.length)));
    const candidate = join(root, relative);
    if (candidate === root || candidate.startsWith(root + sep)) {
      const file = await fileAt(candidate);
      if (file) return send(res, 200, file);
    }
    const notFound = await fileAt(join(root, '404.html'));
    if (notFound) return send(res, 404, notFound);
  }
  res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
  res.end('Not found\n');
});

server.listen(port, () => {
  console.log(`Serving ${root} at http://localhost:${port}${base}`);
});
