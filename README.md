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

```bash
npm install
```

## Deploy

### Railway (recommended for quick public hosting)

1. Push this repo to GitHub
2. Go to [railway.app](https://railway.app) → New Project → Deploy from GitHub repo
3. Select this repo — Railway auto-detects Node.js and runs `node server.js`
4. Set a custom domain in Railway's settings if desired

Environment variables (all optional):
| Variable | Default | Description |
|----------|---------|-------------|
| `PORT` | `3000` | Port the server listens on (Railway sets this automatically) |
| `HOST` | `0.0.0.0` | Bind address |

To get the subdomain cookie isolation experiments working on Railway, you need three separate services (or a reverse-proxy) pointing `platter-app.dev`, `foo.platter-app.dev`, and `bar.platter-app.dev` all to the same Railway deployment.

### Render

Same as Railway — connect the repo, Render detects `npm start` automatically. Set `PORT` if needed (Render injects it).

### Fly.io

```bash
fly launch          # generates fly.toml, detects Node.js
fly deploy
```

### Heroku / Heroku-compatible (e.g. Dokku, Northflank)

The `Procfile` declares `web: node server.js`. Just push to the platform:

```bash
git push heroku main
```

### VPS / Docker (any platform)

```bash
node server.js
# or with a custom port:
PORT=8080 node server.js
```

No build step required — zero runtime dependencies.

### Cloudflare Workers

```bash
npm run dev       # local preview at http://localhost:8787
npm run deploy    # deploy to Cloudflare
```

Requires:
- `wrangler login`
- `platter-app.dev` zone in your Cloudflare account
- DNS records pointing the three domains to the worker

## Local Development

```bash
# Node.js server (fastest feedback loop)
npm start                    # http://localhost:3000

# Cloudflare Worker emulation
npm run dev                  # http://localhost:8787
```

For the full subdomain experiment experience locally, add to your hosts file:

```
127.0.0.1  platter-app.dev
127.0.0.1  foo.platter-app.dev
127.0.0.1  bar.platter-app.dev
```

Then open `http://platter-app.dev:3000`, `http://foo.platter-app.dev:3000`, etc.

## Architecture

**Zero runtime dependencies, no build step.**

```
src/app.js      ← shared logic: buildHTML() + parseCookieHeader()
src/index.js    ← Cloudflare Worker adapter (import from app.js)
server.js       ← Node.js HTTP server adapter (import from app.js)
```

Both adapters handle two request types:
- `?action=echo-cookies` → returns the server-side `Cookie` header as JSON
- everything else → returns the full HTML page

The HTML is a self-contained page with Bootstrap 5 from CDN. All PSL logic and cookie manipulation runs in the browser via vanilla JavaScript (no template literals — ES5 style to avoid conflicts with the server-side template literal that builds the page).

`"type": "module"` in `package.json` means all `.js` files are ESM, which works for both Node 18+ and Cloudflare Workers.

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
├── README.md          ← this file
├── package.json       ← npm scripts, "type": "module", engines
├── wrangler.toml      ← Cloudflare Worker config + routes
├── railway.toml       ← Railway deploy config
├── Procfile           ← Heroku-compatible platforms
├── .gitignore
├── server.js          ← Node.js HTTP server (Railway, Render, Fly, VPS)
└── src/
    ├── app.js         ← shared: buildHTML() + parseCookieHeader()
    └── index.js       ← Cloudflare Worker adapter
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
