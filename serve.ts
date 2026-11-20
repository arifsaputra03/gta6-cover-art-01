// Vice Cover — tiny static server for the app, used to take screenshots.
// Serves app/ over HTTP on localhost. No dependencies, Node standard library only.
//
//   node serve.ts [--port 8080] [--host 127.0.0.1] [--log]
//
// HEAD answers 200 with headers and no body; any method other than
// GET or HEAD answers 405.

import { createServer } from 'node:http';
import { readFileSync, existsSync, statSync } from 'node:fs';
import { join, extname, normalize } from 'node:path';
import { fileURLToPath } from 'node:url';

const args = process.argv.slice(2);

function flagValue(name, fallback) {
  const i = args.indexOf(name);
  if (i >= 0 && args[i + 1] !== undefined) return args[i + 1];
  const eq = args.find((a) => a.startsWith(`${name}=`));
  return eq ? eq.slice(name.length + 1) : fallback;
}

const PORT = Number(flagValue('--port', '8080'));
const HOST = flagValue('--host', '127.0.0.1');
const LOG = args.includes('--log');

const APP_DIR = join(fileURLToPath(new URL('.', import.meta.url)), 'app');

const TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
  '.webp': 'image/webp',
  '.svg': 'image/svg+xml',
};

const server = createServer((req, res) => {
  if (LOG) console.log(`${req.method} ${req.url}`);
  if (req.method !== 'GET' && req.method !== 'HEAD') {
    res.writeHead(405, { 'content-type': 'text/plain; charset=utf-8', allow: 'GET, HEAD' });
    res.end('Method not allowed\n');
    return;
  }
  const raw = decodeURIComponent((req.url || '/').split('?')[0]);
  const rel = raw === '/' ? 'index.html' : raw.replace(/^\/+/, '');
  const file = join(APP_DIR, normalize(rel));
  if (!file.startsWith(APP_DIR) || !existsSync(file) || !statSync(file).isFile()) {
    res.writeHead(404, { 'content-type': 'text/plain; charset=utf-8' });
    res.end(`Not found: ${raw}\n`);
    return;
  }
  const body = readFileSync(file);
  const type = TYPES[extname(file).toLowerCase()] || 'application/octet-stream';
  res.writeHead(200, { 'content-type': type, 'content-length': body.length });
  res.end(req.method === 'HEAD' ? undefined : body);
});

server.listen(PORT, HOST, () => {
  console.log(`Vice Cover serving app/ at http://${HOST}:${PORT}/`);
});
