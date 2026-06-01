# PSL Cookies Sandbox

An interactive, educational Cloudflare Worker that teaches how the **Public Suffix List (PSL)** protects cookie security in browsers.

## What is this?

This is a fully self-contained educational website hosted on a single Cloudflare Worker. It serves the same HTML page across three domains:

- `platter-app.dev` (the base domain — itself a PSL private entry)
- `foo.platter-app.dev` (a subdomain)
- `bar.platter-app.dev` (another subdomain)

Users can interactively:
- **Set cookies** with various domain/path/attribute combinations
- **Watch the browser reject supercookies** that violate PSL rules
- **Inspect what the server receives** via the Cookie header
- **Follow guided experiments** that prove PSL isolation works

## Key Features

### Domain Context Panel
Real-time display of:
- Current hostname and protocol
- Whether this host is a PSL entry
- Public suffix (eTLD) and registrable domain (eTLD+1)
- Widest allowed cookie domain for this page

### Cookie Inspector
- Live table of all `document.cookie` entries (name, value, delete button)
- Auto-refresh every 2 seconds
- Raw cookie string display
- Clear all button

### Set Cookie Form
- Cookie name, value, domain, path, max-age, SameSite, Secure attributes
- Domain dropdown highlights PSL entries with ⛔ warnings
- Live preview of the cookie string being written
- Success/rejection banner showing whether the browser accepted it

### Server-Side View
- One-click fetch to see the `Cookie` request header received by the worker
- Reveals HttpOnly cookies that JavaScript cannot access
- Shows how the browser enforces the PSL on the server side

### 5 Guided Experiments

1. **Cookie isolation between subdomains** — Prove `foo.*` cookies don't leak to `bar.*`
2. **Supercookie attempt** — Try to set a domain=PSL-entry cookie (silently rejected)
3. **Cookie on PSL domain itself** — Confirm root-level cookies have no parent to share with
4. **Cross-domain attempt** — Try to set a cookie for a different subdomain (rejected)
5. **HttpOnly gap** — See cookies that are hidden from JS but visible to the server

### PSL Reference Section
Collapsible accordion explaining:
- What the PSL is (both ICANN and private sections)
- How it protects against supercookie attacks
- Terminology (eTLD, eTLD+1, etc.)
- Real-world examples (`github.io`, `s3.amazonaws.com`, etc.)
- Comparison table: registrable vs non-registrable domains

## Quick Start

### Prerequisites
- Node.js 18+
- A Cloudflare account with a zone for `platter-app.dev`

### Install
```bash
npm install
```

### Develop Locally
```bash
npm run dev
```

Opens `http://localhost:8787` where you can test against the local worker. To use the full subdomain experience, add entries to your `/etc/hosts` (or Windows equivalent):

```
127.0.0.1  platter-app.dev
127.0.0.1  foo.platter-app.dev
127.0.0.1  bar.platter-app.dev
```

Then open `http://platter-app.dev:8787`, `http://foo.platter-app.dev:8787`, etc.

### Deploy to Cloudflare
```bash
npm run deploy
```

Requires:
- `wrangler` authenticated: `wrangler login`
- `platter-app.dev` zone already in your Cloudflare account
- DNS records (CNAME or A) pointing these domains to the worker

## Architecture

**Single file, zero external dependencies:**

- `src/index.js` — 500-line worker exports a Cloudflare Worker handler
  - `fetch()` endpoint handles two types of requests:
    - `?action=echo-cookies` → returns the server-side `Cookie` header as JSON
    - everything else → returns the full HTML page
  - Embedded HTML/CSS/JS uses Bootstrap 5 from CDN (no build step)
  - JavaScript includes:
    - PSL knowledge (hardcoded `platter-app.dev` + subdomain logic)
    - Cookie parsing and manipulation
    - Server-side echo fetch
    - Live domain context calculation

**No build step, no runtime dependencies** — just plain JavaScript that runs directly in the Worker.

## Browser Compatibility

Works on:
- Chrome/Edge 90+
- Firefox 88+
- Safari 14+

Cookie behavior is consistent across all modern browsers; PSL enforcement is universal.

## Configuration

The base domain is hardcoded as:
```javascript
const BASE_DOMAIN = 'platter-app.dev';
```

To use a different PSL-listed domain, edit [src/index.js:1](src/index.js#L1) and update `wrangler.toml` routes accordingly.

## Understanding the PSL

### Why it matters

Without the PSL, a malicious site could set a cookie for an entire top-level domain:
- `evil.co.uk` sets `document.cookie = "x=1; domain=.co.uk"`
- Now every `.co.uk` site receives that cookie — banking sites, shopping sites, etc.
- One attacker tracks millions of unrelated users

**The PSL prevents this** by telling browsers which domain suffixes are public. Browsers refuse to set cookies at PSL-listed domains.

### Two sections

1. **ICANN section** — standard TLDs (`.com`, `.co.uk`, `.edu`, etc.)
2. **Private section** — multi-tenant platforms that want subdomain isolation:
   - `github.io` — so `alice.github.io` can't track `bob.github.io`
   - `s3.amazonaws.com` — so one AWS customer can't spy on another's buckets
   - `platter-app.dev` — a real domain used for this sandbox

### eTLD+1 (registrable domain)

The key concept: a **registrable domain** is the smallest domain that a user or organization can register. For PSL-entry domains, this is the domain immediately below the public suffix.

- Domain: `www.alice.github.io`
- Public suffix: `github.io`
- eTLD+1: `alice.github.io`

The browser allows cookies set on or inherited from `alice.github.io`, but **never** from `github.io` itself (the PSL entry).

## Files

```
.
├── README.md                  ← this file
├── package.json              ← npm scripts (dev, deploy)
├── wrangler.toml             ← Cloudflare Worker config + routes
├── .gitignore                ← git ignore patterns
└── src/
    └── index.js              ← single worker file (500 lines)
```

## Security Notes

This is **purely educational** and runs entirely in a browser context with no persistent storage. It does not:
- Store cookies on disk
- Log user activity
- Send data off-server
- Require authentication

The "echo" endpoint (`?action=echo-cookies`) is intentionally accessible to show you what the server sees, but it's safe because:
- It only echoes your own cookies
- It only works if you're in the same browser
- It doesn't modify state

## License

Public domain / unlicensed — use freely for education.

## References

- **Public Suffix List:** https://publicsuffix.org/
- **PSL on GitHub:** https://github.com/publicsuffix/list
- **MDN Cookie SameSite:** https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Set-Cookie/SameSite
- **RFC 6265 (HTTP State Management):** https://tools.ietf.org/html/rfc6265
