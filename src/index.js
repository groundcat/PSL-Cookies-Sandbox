// Cloudflare Worker entry point — imports shared app logic
import { buildHTML, parseCookieHeader } from './app.js';

export default {
  async fetch(request) {
    const url = new URL(request.url);

    if (url.searchParams.get('action') === 'echo-cookies') {
      const cookieHeader = request.headers.get('Cookie') || '';
      const parsed = parseCookieHeader(cookieHeader);
      return new Response(
        JSON.stringify({ cookieHeader, parsed, hostname: url.hostname }),
        { headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' } }
      );
    }

    return new Response(buildHTML(), {
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
        'Cache-Control': 'no-cache, no-store',
      },
    });
  },
};
