export const BASE_DOMAIN = 'platter-app.dev';

export function parseCookieHeader(header) {
  if (!header) return [];
  return header.split(';').map(c => {
    const i = c.indexOf('=');
    return i === -1
      ? { name: c.trim(), value: '' }
      : { name: c.slice(0, i).trim(), value: c.slice(i + 1).trim() };
  });
}

export function buildHTML() {
  // NOTE: the embedded <script> block uses no template literals (backticks) on purpose
  // so that this outer template literal remains unambiguous.
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>PSL Cookies Sandbox</title>
  <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.2/dist/css/bootstrap.min.css">
</head>
<body class="bg-light">

<!-- ── Navbar ─────────────────────────────────────────────────── -->
<nav class="navbar navbar-expand-lg navbar-dark bg-dark">
  <div class="container-fluid">
    <span class="navbar-brand fw-bold">PSL Cookies Sandbox</span>
    <div class="d-flex gap-2 align-items-center flex-wrap">
      <span class="text-secondary small">Jump to:</span>
      <a href="https://${BASE_DOMAIN}"         class="btn btn-sm btn-outline-danger">${BASE_DOMAIN}</a>
      <a href="https://foo.${BASE_DOMAIN}" class="btn btn-sm btn-outline-primary">foo.${BASE_DOMAIN}</a>
      <a href="https://bar.${BASE_DOMAIN}" class="btn btn-sm btn-outline-success">bar.${BASE_DOMAIN}</a>
    </div>
  </div>
</nav>

<!-- ── Main layout ────────────────────────────────────────────── -->
<div class="container-fluid py-3">
<div class="row g-3">

  <!-- ── 1. Domain Context ──────────────────────────────────── -->
  <div class="col-12">
    <div class="card border-0 shadow-sm">
      <div class="card-header d-flex justify-content-between align-items-center">
        <strong>Domain Context</strong>
        <span id="domain-badge" class="badge fs-6 px-3 py-2">loading…</span>
      </div>
      <div class="card-body p-0">
        <table class="table table-sm table-bordered mb-0">
          <tbody>
            <tr>
              <th class="ps-3 bg-light" width="32%">Current Hostname</th>
              <td id="info-hostname"><code>…</code></td>
            </tr>
            <tr>
              <th class="ps-3 bg-light">Protocol</th>
              <td id="info-protocol"><code>…</code></td>
            </tr>
            <tr>
              <th class="ps-3 bg-light">Is this host a PSL entry?</th>
              <td id="info-is-psl">…</td>
            </tr>
            <tr>
              <th class="ps-3 bg-light">Public Suffix / eTLD</th>
              <td id="info-etld">…</td>
            </tr>
            <tr>
              <th class="ps-3 bg-light">Registrable Domain (eTLD+1)</th>
              <td id="info-etld1">…</td>
            </tr>
            <tr>
              <th class="ps-3 bg-light">Widest Allowed Cookie Domain</th>
              <td id="info-cookie-scope">…</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>

  <!-- ── 2a. Cookie Inspector ───────────────────────────────── -->
  <div class="col-lg-5">
    <div class="card border-0 shadow-sm h-100">
      <div class="card-header d-flex justify-content-between align-items-center">
        <strong>Cookie Inspector</strong>
        <div class="d-flex gap-1 align-items-center">
          <span class="badge bg-secondary" id="cookie-count">0 cookies</span>
          <button class="btn btn-sm btn-outline-secondary" onclick="refreshCookies()">&#8635; Refresh</button>
          <button class="btn btn-sm btn-outline-danger"    onclick="clearAllCookies()">Clear All</button>
        </div>
      </div>
      <div class="card-body p-0 d-flex flex-column">
        <div class="table-responsive flex-grow-1">
          <table class="table table-sm table-striped mb-0">
            <thead class="table-dark">
              <tr><th>Name</th><th>Value</th><th style="width:40px"></th></tr>
            </thead>
            <tbody id="cookies-tbody">
              <tr><td colspan="3" class="text-center text-muted p-3"><em>No cookies</em></td></tr>
            </tbody>
          </table>
        </div>
        <div class="border-top p-2 bg-white">
          <div class="small text-muted mb-1">Raw <code>document.cookie</code>:</div>
          <code id="raw-cookie-string" class="small text-break text-dark">(empty)</code>
        </div>
      </div>
    </div>
  </div>

  <!-- ── 2b. Set Cookie ─────────────────────────────────────── -->
  <div class="col-lg-7">
    <div class="card border-0 shadow-sm h-100">
      <div class="card-header"><strong>Set Cookie</strong></div>
      <div class="card-body">
        <form id="set-cookie-form" onsubmit="handleSetCookie(event)" autocomplete="off">
          <div class="row g-2 mb-2">
            <div class="col-6">
              <label class="form-label form-label-sm mb-1">Name <span class="text-danger">*</span></label>
              <input type="text" class="form-control form-control-sm" id="f-name" required placeholder="session_id">
            </div>
            <div class="col-6">
              <label class="form-label form-label-sm mb-1">Value</label>
              <input type="text" class="form-control form-control-sm" id="f-value" placeholder="abc123">
            </div>
          </div>

          <div class="mb-2">
            <label class="form-label form-label-sm mb-1">
              Domain
              <small class="text-muted fw-normal">(controls scope — leave blank for host-only)</small>
            </label>
            <select class="form-select form-select-sm" id="f-domain">
              <option value="">(unset — host-only, exact current hostname)</option>
              <option value="${BASE_DOMAIN}">${BASE_DOMAIN} &mdash; &#9940; PSL entry, browsers REJECT this</option>
              <option value=".${BASE_DOMAIN}">.${BASE_DOMAIN} &mdash; &#9940; leading-dot PSL entry, also REJECTED</option>
              <option value="foo.${BASE_DOMAIN}">foo.${BASE_DOMAIN}</option>
              <option value="bar.${BASE_DOMAIN}">bar.${BASE_DOMAIN}</option>
            </select>
          </div>

          <div class="row g-2 mb-2">
            <div class="col-4">
              <label class="form-label form-label-sm mb-1">Path</label>
              <input type="text" class="form-control form-control-sm" id="f-path" value="/">
            </div>
            <div class="col-4">
              <label class="form-label form-label-sm mb-1">Max-Age <small class="text-muted">(sec, blank=session)</small></label>
              <input type="number" class="form-control form-control-sm" id="f-maxage" placeholder="e.g. 3600">
            </div>
            <div class="col-4">
              <label class="form-label form-label-sm mb-1">SameSite</label>
              <select class="form-select form-select-sm" id="f-samesite">
                <option value="">(unset)</option>
                <option value="Strict">Strict</option>
                <option value="Lax" selected>Lax</option>
                <option value="None">None (requires Secure)</option>
              </select>
            </div>
          </div>

          <div class="d-flex gap-3 mb-2">
            <div class="form-check">
              <input class="form-check-input" type="checkbox" id="f-secure">
              <label class="form-check-label form-label-sm" for="f-secure">Secure</label>
            </div>
            <div class="form-check text-muted">
              <input class="form-check-input" type="checkbox" disabled>
              <label class="form-check-label form-label-sm">HttpOnly <small>(JS cannot set this)</small></label>
            </div>
          </div>

          <div class="border rounded p-2 bg-light mb-2">
            <small class="text-muted">Preview string written to <code>document.cookie</code>:</small><br>
            <code id="cookie-preview" class="small text-break">…</code>
          </div>

          <button type="submit" class="btn btn-primary btn-sm w-100">Set Cookie</button>
        </form>
        <div id="set-result" class="mt-2"></div>
      </div>
    </div>
  </div>

  <!-- ── 3. Server-Side View ────────────────────────────────── -->
  <div class="col-12">
    <div class="card border-0 shadow-sm">
      <div class="card-header d-flex justify-content-between align-items-center">
        <strong>Server-Side Cookie View</strong>
        <small class="text-muted">(what the server receives in the <code>Cookie</code> request header)</small>
        <button class="btn btn-sm btn-outline-primary" onclick="fetchServerCookies()">&#8635; Fetch</button>
      </div>
      <div class="card-body">
        <p class="text-muted small mb-2">
          <code>document.cookie</code> in JavaScript hides <strong>HttpOnly</strong> cookies for security.
          This panel makes a live fetch to the server and shows exactly what it receives —
          including HttpOnly cookies that are invisible above.
        </p>
        <div id="server-cookies-display">
          <button class="btn btn-sm btn-outline-primary" onclick="fetchServerCookies()">Fetch Server-Side View</button>
        </div>
      </div>
    </div>
  </div>

  <!-- ── 4. Guided Experiments ─────────────────────────────── -->
  <div class="col-12">
    <div class="card border-0 shadow-sm">
      <div class="card-header"><strong>Guided Experiments</strong></div>
      <div class="card-body pb-1">
        <div class="accordion" id="expAccordion">

          <div class="accordion-item">
            <h2 class="accordion-header">
              <button class="accordion-button collapsed" type="button"
                      data-bs-toggle="collapse" data-bs-target="#exp1">
                Exp 1 &mdash; Cookie isolation between subdomains (PSL in action)
              </button>
            </h2>
            <div id="exp1" class="accordion-collapse collapse" data-bs-parent="#expAccordion">
              <div class="accordion-body">
                <p class="mb-2"><strong>Goal:</strong> Prove <code>foo.${BASE_DOMAIN}</code> cookies are invisible on <code>bar.${BASE_DOMAIN}</code>.</p>
                <ol>
                  <li>Navigate to <a href="https://foo.${BASE_DOMAIN}">foo.${BASE_DOMAIN}</a></li>
                  <li>Set a cookie &mdash; Name: <code>from_foo</code>, Value: <code>hello_from_foo</code>, Domain: <em>(unset)</em></li>
                  <li>Navigate to <a href="https://bar.${BASE_DOMAIN}">bar.${BASE_DOMAIN}</a></li>
                  <li>Check Cookie Inspector &mdash; <strong>from_foo is NOT there</strong></li>
                </ol>
                <div class="alert alert-info py-2 mb-0 mt-2">
                  <strong>Why?</strong> <code>${BASE_DOMAIN}</code> is in the PSL private section, so browsers treat
                  <code>foo.${BASE_DOMAIN}</code> and <code>bar.${BASE_DOMAIN}</code> as fully separate
                  security origins &mdash; just like <code>alice.github.io</code> and <code>bob.github.io</code>.
                  No cookies leak across the boundary.
                </div>
              </div>
            </div>
          </div>

          <div class="accordion-item">
            <h2 class="accordion-header">
              <button class="accordion-button collapsed" type="button"
                      data-bs-toggle="collapse" data-bs-target="#exp2">
                Exp 2 &mdash; Supercookie attempt (silently blocked by browser)
              </button>
            </h2>
            <div id="exp2" class="accordion-collapse collapse" data-bs-parent="#expAccordion">
              <div class="accordion-body">
                <p class="mb-2"><strong>Goal:</strong> Try to set a tracking cookie spanning all subdomains.</p>
                <ol>
                  <li>Go to <a href="https://foo.${BASE_DOMAIN}">foo.${BASE_DOMAIN}</a></li>
                  <li>Set a cookie &mdash; Name: <code>supercookie</code>, Value: <code>tracking_you</code></li>
                  <li>Domain: <strong><code>${BASE_DOMAIN}</code></strong> (the &ldquo;PSL entry, REJECT&rdquo; option)</li>
                  <li>Click <em>Set Cookie</em></li>
                  <li>Result: Cookie Inspector shows <strong>0 new cookies</strong> &mdash; browser silently rejected it</li>
                </ol>
                <div class="alert alert-warning py-2 mb-0 mt-2">
                  <strong>Why?</strong> The browser checks the PSL and refuses to set any cookie whose
                  <code>domain</code> attribute matches a public suffix. Without this protection,
                  <code>foo.${BASE_DOMAIN}</code> could set a <code>.${BASE_DOMAIN}</code> cookie that
                  every other subdomain would send to the server &mdash; a classic cross-site tracking attack.
                </div>
              </div>
            </div>
          </div>

          <div class="accordion-item">
            <h2 class="accordion-header">
              <button class="accordion-button collapsed" type="button"
                      data-bs-toggle="collapse" data-bs-target="#exp3">
                Exp 3 &mdash; Cookie on the PSL domain itself
              </button>
            </h2>
            <div id="exp3" class="accordion-collapse collapse" data-bs-parent="#expAccordion">
              <div class="accordion-body">
                <p class="mb-2"><strong>Goal:</strong> Set a cookie on <code>${BASE_DOMAIN}</code> and check subdomain visibility.</p>
                <ol>
                  <li>Navigate to <a href="https://${BASE_DOMAIN}">${BASE_DOMAIN}</a></li>
                  <li>Set a cookie &mdash; Name: <code>root_cookie</code>, Value: <code>im_root</code>, Domain: <em>(unset)</em></li>
                  <li>Navigate to <a href="https://foo.${BASE_DOMAIN}">foo.${BASE_DOMAIN}</a></li>
                  <li>Result: <strong>root_cookie is NOT visible</strong></li>
                </ol>
                <div class="alert alert-info py-2 mb-0 mt-2">
                  <strong>Compare with non-PSL:</strong> On a normal domain like <code>example.com</code>, a cookie with
                  <code>domain=example.com</code> <em>would</em> be visible on <code>sub.example.com</code>.
                  But because <code>${BASE_DOMAIN}</code> is itself a PSL entry, it has no &ldquo;parent&rdquo; to
                  share cookies with, and subdomains cannot inherit from it.
                </div>
              </div>
            </div>
          </div>

          <div class="accordion-item">
            <h2 class="accordion-header">
              <button class="accordion-button collapsed" type="button"
                      data-bs-toggle="collapse" data-bs-target="#exp4">
                Exp 4 &mdash; Cross-domain cookie attempt from wrong host
              </button>
            </h2>
            <div id="exp4" class="accordion-collapse collapse" data-bs-parent="#expAccordion">
              <div class="accordion-body">
                <p class="mb-2"><strong>Goal:</strong> Try to set a cookie for <code>bar.${BASE_DOMAIN}</code> while on <code>foo.${BASE_DOMAIN}</code>.</p>
                <ol>
                  <li>Navigate to <a href="https://foo.${BASE_DOMAIN}">foo.${BASE_DOMAIN}</a></li>
                  <li>Set a cookie &mdash; Name: <code>cross_attempt</code>, Domain: <strong><code>bar.${BASE_DOMAIN}</code></strong></li>
                  <li>Result: Cookie Inspector shows <strong>0 new cookies</strong></li>
                  <li>Navigate to <a href="https://bar.${BASE_DOMAIN}">bar.${BASE_DOMAIN}</a> &mdash; also empty</li>
                </ol>
                <div class="alert alert-warning py-2 mb-0 mt-2">
                  <strong>Why?</strong> A page can only set cookies for its own host or an ancestor domain
                  (up to but not including a PSL entry). <code>foo.${BASE_DOMAIN}</code> cannot set cookies
                  for <code>bar.${BASE_DOMAIN}</code> &mdash; they share no common ancestor below the PSL boundary.
                </div>
              </div>
            </div>
          </div>

          <div class="accordion-item">
            <h2 class="accordion-header">
              <button class="accordion-button collapsed" type="button"
                      data-bs-toggle="collapse" data-bs-target="#exp5">
                Exp 5 &mdash; HttpOnly cookies: server-visible, JS-invisible
              </button>
            </h2>
            <div id="exp5" class="accordion-collapse collapse" data-bs-parent="#expAccordion">
              <div class="accordion-body">
                <p class="mb-2"><strong>Goal:</strong> Observe the gap between <code>document.cookie</code> and the server&rsquo;s <code>Cookie</code> header.</p>
                <ol>
                  <li>Open browser DevTools &rarr; Application &rarr; Cookies</li>
                  <li>Manually add a cookie with the <strong>HttpOnly</strong> flag checked</li>
                  <li>Check the <em>Cookie Inspector</em> above &mdash; the cookie is <strong>absent</strong></li>
                  <li>Click <em>Fetch</em> in <em>Server-Side Cookie View</em> &mdash; the cookie <strong>appears</strong></li>
                </ol>
                <div class="alert alert-secondary py-2 mb-0 mt-2">
                  <strong>Why?</strong> <code>HttpOnly</code> is a server-set flag that instructs the browser
                  to include the cookie in HTTP requests but never expose it to JavaScript.
                  This prevents XSS attacks from stealing session tokens.
                </div>
              </div>
            </div>
          </div>

        </div><!-- /accordion -->
      </div>
    </div>
  </div>

  <!-- ── 5. PSL Reference ───────────────────────────────────── -->
  <div class="col-12">
    <div class="card border-0 shadow-sm">
      <div class="card-header">
        <button class="btn btn-link text-decoration-none p-0 fw-bold text-dark"
                data-bs-toggle="collapse" data-bs-target="#pslRef">
          About the Public Suffix List (PSL) &#9660;
        </button>
      </div>
      <div id="pslRef" class="collapse">
        <div class="card-body">
          <div class="row g-4">
            <div class="col-md-6">
              <h6>What is the PSL?</h6>
              <p>
                The <strong>Public Suffix List</strong> is a community-maintained catalog of all domain suffixes
                under which Internet users can directly register names. Originally created by Mozilla,
                it is now used by all major browsers, and many other tools (curl, Go's
                <code>net/http</code>, Python's <code>tldextract</code>, etc.).
              </p>
              <h6>Two sections</h6>
              <ul>
                <li><strong>ICANN Section</strong> &mdash; standard TLDs: <code>.com</code>, <code>.co.uk</code>, <code>.pvt.k12.ma.us</code></li>
                <li>
                  <strong>Private Section</strong> &mdash; company-specific entries:
                  <code>github.io</code>, <code>s3.amazonaws.com</code>,
                  <code>${BASE_DOMAIN}</code>
                </li>
              </ul>
              <p>
                <code>${BASE_DOMAIN}</code> &mdash; the base domain of this sandbox &mdash;
                is listed in the <strong>private section</strong>.
              </p>

              <h6>Key terms</h6>
              <table class="table table-sm table-bordered">
                <thead class="table-light"><tr><th>Term</th><th>Meaning</th><th>Example</th></tr></thead>
                <tbody>
                  <tr><td>eTLD</td><td>Effective top-level domain (the PSL entry)</td><td><code>${BASE_DOMAIN}</code></td></tr>
                  <tr><td>eTLD+1</td><td>One label to the left of the eTLD (registrable domain)</td><td><code>foo.${BASE_DOMAIN}</code></td></tr>
                  <tr><td>Host-only cookie</td><td>No domain attribute; bound to exact hostname</td><td>set on <code>foo.${BASE_DOMAIN}</code>, stays there</td></tr>
                </tbody>
              </table>
            </div>
            <div class="col-md-6">
              <h6>How PSL protects cookies</h6>
              <p>
                Browsers enforce two PSL-based cookie rules:
              </p>
              <ol>
                <li>
                  <strong>No PSL-entry cookies.</strong>
                  <code>document.cookie = "x=1; domain=platter-app.dev"</code> is silently dropped
                  if <code>platter-app.dev</code> is in the PSL.
                </li>
                <li>
                  <strong>eTLD+1 isolation.</strong>
                  <code>foo.${BASE_DOMAIN}</code> and <code>bar.${BASE_DOMAIN}</code>
                  have different eTLD+1 values, so they cannot share cookies &mdash;
                  even though they are served by the same server.
                </li>
              </ol>

              <h6>Real-world examples</h6>
              <table class="table table-sm table-bordered">
                <thead class="table-light">
                  <tr><th>Domain</th><th>PSL entry</th><th>Effect</th></tr>
                </thead>
                <tbody>
                  <tr>
                    <td><code>alice.github.io</code></td>
                    <td><code>github.io</code></td>
                    <td>Cannot share cookies with <code>bob.github.io</code></td>
                  </tr>
                  <tr>
                    <td><code>foo.${BASE_DOMAIN}</code></td>
                    <td><code>${BASE_DOMAIN}</code></td>
                    <td>Cannot share cookies with <code>bar.${BASE_DOMAIN}</code></td>
                  </tr>
                  <tr>
                    <td><code>shop.example.com</code></td>
                    <td><code>com</code></td>
                    <td>CAN share cookies with <code>example.com</code> (set <code>domain=example.com</code>)</td>
                  </tr>
                  <tr>
                    <td><code>evil.co.uk</code></td>
                    <td><code>co.uk</code></td>
                    <td>Cannot set <code>domain=co.uk</code> supercookie</td>
                  </tr>
                </tbody>
              </table>

              <h6>Without the PSL (hypothetical attack)</h6>
              <p class="mb-0 text-muted small">
                If <code>${BASE_DOMAIN}</code> were not in the PSL, <code>foo.${BASE_DOMAIN}</code>
                could write <code>document.cookie = "tracker=1; domain=.${BASE_DOMAIN}"</code>.
                The browser would include that cookie on every request to
                <em>every</em> subdomain &mdash; allowing one tenant to track all others.
                The PSL makes this impossible.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>

</div><!-- /row -->
</div><!-- /container -->

<script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.2/dist/js/bootstrap.bundle.min.js"></script>
<script>
// ─── PSL knowledge (hard-coded for this demo) ───────────────────────────────
var PSL_PRIVATE = ['${BASE_DOMAIN}'];

function getPSLInfo(hostname) {
  var i, entry, prefix, parts, lastLabel;
  for (i = 0; i < PSL_PRIVATE.length; i++) {
    entry = PSL_PRIVATE[i];
    if (hostname === entry) {
      return {
        isPSL: true,
        pslEntry: entry,
        etld: entry,
        etld1: null,
        cookieScope: hostname
      };
    }
    if (hostname.slice(-(entry.length + 1)) === ('.' + entry)) {
      prefix = hostname.slice(0, hostname.length - entry.length - 1);
      parts  = prefix.split('.');
      lastLabel = parts[parts.length - 1];
      return {
        isPSL: false,
        pslEntry: entry,
        etld: entry,
        etld1: lastLabel + '.' + entry,
        cookieScope: lastLabel + '.' + entry
      };
    }
  }
  // Generic fallback for non-PSL hostnames
  parts = hostname.split('.');
  var etld  = parts[parts.length - 1];
  var etld1 = parts.length >= 2 ? parts.slice(-2).join('.') : hostname;
  return {
    isPSL: false,
    pslEntry: null,
    etld: etld,
    etld1: etld1,
    cookieScope: etld1
  };
}

// ─── Utility ────────────────────────────────────────────────────────────────
function esc(str) {
  var d = document.createElement('div');
  d.textContent = String(str);
  return d.innerHTML;
}

// ─── Cookie helpers ─────────────────────────────────────────────────────────
function parseCookies() {
  var raw = document.cookie;
  if (!raw.trim()) return [];
  return raw.split(';').map(function(c) {
    var idx = c.indexOf('=');
    if (idx === -1) return { name: c.trim(), value: '' };
    return { name: c.slice(0, idx).trim(), value: c.slice(idx + 1).trim() };
  }).filter(function(c) { return c.name; });
}

function refreshCookies() {
  var cookies = parseCookies();
  var raw     = document.cookie;

  document.getElementById('raw-cookie-string').textContent = raw || '(empty)';
  document.getElementById('cookie-count').textContent =
    cookies.length + ' cookie' + (cookies.length !== 1 ? 's' : '');

  var tbody = document.getElementById('cookies-tbody');
  if (cookies.length === 0) {
    tbody.innerHTML = '<tr><td colspan="3" class="text-center text-muted p-3"><em>No cookies</em></td></tr>';
    return;
  }
  tbody.innerHTML = cookies.map(function(c) {
    return '<tr>' +
      '<td><code>' + esc(c.name)  + '</code></td>' +
      '<td><code>' + esc(c.value) + '</code></td>' +
      '<td><button class="btn btn-outline-danger btn-sm py-0 px-1" ' +
        'style="font-size:11px" ' +
        'onclick="deleteCookie(' + JSON.stringify(c.name) + ')">&#10005;</button></td>' +
      '</tr>';
  }).join('');
}

function deleteCookie(name) {
  var hostname = location.hostname;
  var base = '${BASE_DOMAIN}';
  var exp  = 'expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/';
  document.cookie = name + '=; ' + exp;
  document.cookie = name + '=; ' + exp + '; domain=' + hostname;
  document.cookie = name + '=; ' + exp + '; domain=.' + hostname;
  // Also try PSL-entry variants in case the cookie had a wider domain
  if (hostname !== base) {
    document.cookie = name + '=; ' + exp + '; domain=' + base;
    document.cookie = name + '=; ' + exp + '; domain=.' + base;
  }
  refreshCookies();
}

function clearAllCookies() {
  var cookies = parseCookies();
  cookies.forEach(function(c) { deleteCookie(c.name); });
  refreshCookies();
}

// ─── Cookie setter ──────────────────────────────────────────────────────────
function buildCookieString(name, value, domain, path, maxage, samesite, secure) {
  var str = encodeURIComponent(name) + '=' + encodeURIComponent(value);
  if (domain)  str += '; domain='   + domain;
  if (path)    str += '; path='     + path;
  if (maxage)  str += '; max-age='  + maxage;
  if (samesite)str += '; samesite=' + samesite;
  if (secure)  str += '; secure';
  return str;
}

function updatePreview() {
  var name     = document.getElementById('f-name').value     || 'name';
  var value    = document.getElementById('f-value').value    || '';
  var domain   = document.getElementById('f-domain').value;
  var path     = document.getElementById('f-path').value;
  var maxage   = document.getElementById('f-maxage').value;
  var samesite = document.getElementById('f-samesite').value;
  var secure   = document.getElementById('f-secure').checked;
  document.getElementById('cookie-preview').textContent =
    buildCookieString(name, value, domain, path, maxage, samesite, secure);
}

['f-name','f-value','f-domain','f-path','f-maxage','f-samesite','f-secure'].forEach(function(id) {
  var el = document.getElementById(id);
  if (!el) return;
  el.addEventListener('input',  updatePreview);
  el.addEventListener('change', updatePreview);
});

function handleSetCookie(e) {
  e.preventDefault();

  var name     = document.getElementById('f-name').value.trim();
  var value    = document.getElementById('f-value').value.trim();
  var domain   = document.getElementById('f-domain').value;
  var path     = document.getElementById('f-path').value || '/';
  var maxage   = document.getElementById('f-maxage').value;
  var samesite = document.getElementById('f-samesite').value;
  var secure   = document.getElementById('f-secure').checked;

  var cookieStr = buildCookieString(name, value, domain, path, maxage, samesite, secure);
  var before    = parseCookies().map(function(c) { return c.name; });

  document.cookie = cookieStr;

  var after      = parseCookies();
  var afterNames = after.map(function(c) { return c.name; });
  var decodedName = decodeURIComponent(name);
  var resultEl   = document.getElementById('set-result');

  if (afterNames.indexOf(decodedName) !== -1 || afterNames.indexOf(name) !== -1) {
    resultEl.innerHTML =
      '<div class="alert alert-success py-1 mb-0 small">' +
        '&#10003; Cookie <code>' + esc(name) + '</code> set successfully.' +
      '</div>';
  } else if (before.indexOf(name) !== -1) {
    resultEl.innerHTML =
      '<div class="alert alert-info py-1 mb-0 small">' +
        'Cookie already existed &mdash; value may have been updated (or silently rejected if value is same).' +
      '</div>';
  } else {
    resultEl.innerHTML =
      '<div class="alert alert-danger py-1 mb-0 small">' +
        '&#9940; Browser <strong>rejected</strong> this cookie. ' +
        'The domain is likely a PSL entry, or does not match/contain the current host.' +
        '<br><small>Attempted: <code>' + esc(cookieStr) + '</code></small>' +
      '</div>';
  }

  refreshCookies();
}

// ─── Server-side cookie echo ─────────────────────────────────────────────────
function fetchServerCookies() {
  var el = document.getElementById('server-cookies-display');
  el.innerHTML = '<span class="text-muted small">Fetching&hellip;</span>';

  fetch('?action=echo-cookies')
    .then(function(res) { return res.json(); })
    .then(function(data) {
      if (!data.parsed || data.parsed.length === 0) {
        el.innerHTML =
          '<div class="alert alert-secondary py-2 mb-0 small">' +
            'Server received <strong>no cookies</strong> from this hostname (<code>' +
            esc(data.hostname) + '</code>).' +
          '</div>';
        return;
      }

      var rows = data.parsed.map(function(c) {
        return '<tr><td><code>' + esc(c.name) + '</code></td>' +
               '<td><code>'    + esc(c.value) + '</code></td></tr>';
      }).join('');

      el.innerHTML =
        '<p class="small text-muted mb-1">' +
          'Received on hostname: <strong>' + esc(data.hostname) + '</strong> &mdash; ' +
          'raw header: <code>' + esc(data.cookieHeader) + '</code>' +
        '</p>' +
        '<div class="table-responsive">' +
          '<table class="table table-sm table-bordered mb-0">' +
            '<thead class="table-dark"><tr><th>Name</th><th>Value</th></tr></thead>' +
            '<tbody>' + rows + '</tbody>' +
          '</table>' +
        '</div>';
    })
    .catch(function(err) {
      el.innerHTML =
        '<div class="alert alert-danger py-2 mb-0 small">Error: ' + esc(err.message) + '</div>';
    });
}

// ─── Domain context ──────────────────────────────────────────────────────────
var DOMAIN_BADGE_COLORS = {
  '${BASE_DOMAIN}':         'danger',
  'foo.${BASE_DOMAIN}':     'primary',
  'bar.${BASE_DOMAIN}':     'success'
};

function updateDomainInfo() {
  var hostname = location.hostname;
  var protocol = location.protocol;
  var info     = getPSLInfo(hostname);
  var color    = DOMAIN_BADGE_COLORS[hostname] || 'secondary';

  document.title = 'PSL Sandbox — ' + hostname;

  document.getElementById('info-hostname').innerHTML = '<code>' + esc(hostname) + '</code>';
  document.getElementById('info-protocol').innerHTML = '<code>' + esc(protocol + '//') + '</code>';

  var badge = document.getElementById('domain-badge');
  badge.textContent = hostname;
  badge.className   = 'badge fs-6 px-3 py-2 bg-' + color;

  var isPSLEl = document.getElementById('info-is-psl');
  if (info.isPSL) {
    isPSLEl.innerHTML =
      '<span class="badge bg-warning text-dark">YES &mdash; this hostname IS a PSL entry</span> ' +
      '<small class="text-muted">Cookies cannot be set with a domain attribute that spans subdomains.</small>';
  } else if (info.pslEntry) {
    isPSLEl.innerHTML =
      '<span class="badge bg-info text-dark">No</span> ' +
      '<small class="text-muted">But it is a direct subdomain of PSL entry <code>' +
      esc(info.pslEntry) + '</code> (private section).</small>';
  } else {
    isPSLEl.innerHTML = '<span class="badge bg-secondary">Not under a known PSL private entry</span>';
  }

  var etldEl = document.getElementById('info-etld');
  etldEl.innerHTML = '<code>' + esc(info.etld) + '</code>';
  if (info.pslEntry) {
    etldEl.innerHTML +=
      ' <span class="badge bg-' + (info.isPSL ? 'warning text-dark' : 'info text-dark') +
      '">PSL private section</span>';
  }

  var etld1El = document.getElementById('info-etld1');
  if (info.etld1) {
    etld1El.innerHTML = '<code>' + esc(info.etld1) + '</code>';
  } else if (info.isPSL) {
    etld1El.innerHTML = '<em class="text-muted">N/A &mdash; this domain is itself the eTLD</em>';
  } else {
    etld1El.innerHTML = '<em class="text-muted">N/A</em>';
  }

  var scopeEl = document.getElementById('info-cookie-scope');
  if (info.isPSL) {
    scopeEl.innerHTML =
      '<code>' + esc(hostname) + '</code> ' +
      '<small class="text-muted">' +
        '(host-only; cannot use <code>domain=</code> to widen scope beyond this host)' +
      '</small>';
  } else if (info.cookieScope) {
    scopeEl.innerHTML =
      '<code>' + esc(info.cookieScope) + '</code> ' +
      '<small class="text-muted">(= eTLD+1; widest domain that accepts a cookie from this page)</small>';
  } else {
    scopeEl.innerHTML = '<em class="text-muted">Unknown</em>';
  }
}

// ─── Init ────────────────────────────────────────────────────────────────────
updateDomainInfo();
refreshCookies();
updatePreview();

// Live-refresh cookie table every 2 s so navigating in another tab is visible
setInterval(refreshCookies, 2000);
</script>
</body>
</html>`;
}
