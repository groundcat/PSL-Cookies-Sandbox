// Node.js HTTP server — runs on Railway, Render, Fly.io, or any VPS.
// Same HTML and echo-cookie logic as the Cloudflare Worker (src/index.js),
// served via Node's built-in http module with no extra dependencies.
import http from 'http';
import { buildHTML, parseCookieHeader } from './src/app.js';

const PORT = process.env.PORT || 3000;
const HOST = process.env.HOST || '0.0.0.0';

const HTML = buildHTML(); // build once at startup

const server = http.createServer((req, res) => {
  const url = new URL(req.url, `http://${req.headers.host || 'localhost'}`);

  if (url.searchParams.get('action') === 'echo-cookies') {
    const cookieHeader = req.headers['cookie'] || '';
    const parsed = parseCookieHeader(cookieHeader);
    const body = JSON.stringify({ cookieHeader, parsed, hostname: url.hostname });
    res.writeHead(200, {
      'Content-Type': 'application/json',
      'Cache-Control': 'no-store',
      'Content-Length': Buffer.byteLength(body),
    });
    res.end(body);
    return;
  }

  res.writeHead(200, {
    'Content-Type': 'text/html; charset=utf-8',
    'Cache-Control': 'no-cache, no-store',
    'Content-Length': Buffer.byteLength(HTML),
  });
  res.end(HTML);
});

server.listen(PORT, HOST, () => {
  console.log(`PSL Cookies Sandbox listening on http://${HOST}:${PORT}`);
});
