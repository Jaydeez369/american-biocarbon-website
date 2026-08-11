/**
 * Password gate for the STANDALONE Sales OS Cloudflare Pages project (root dir = sales/).
 *
 * This is the only thing standing between the open internet and a document that carries
 * COGS, price floors, margins, the account roster and internal strategy. sales/_headers
 * sets X-Robots-Tag: noindex, but noindex is a crawl hint, NOT access control. This file
 * is the access control.
 *
 * A Pages Function runs on Cloudflare's edge BEFORE any static asset is served, so an
 * unauthenticated request never receives a byte of the app. That is the whole reason the
 * gate lives here and not in client-side JS: a JS prompt ships the entire Sales OS to the
 * browser and then asks politely, which protects nothing.
 *
 * A form + signed cookie, NOT HTTP Basic. Basic is fewer moving parts, but the browser's
 * native dialog always asks for a username, and there are no usernames here - one shared
 * team password. So the gate serves its own single-field login page and trades a correct
 * password for a session cookie.
 *
 * The cookie is `exp.HMAC-SHA256(exp)` keyed on the password itself. That is deliberate:
 * there is no second secret to configure and no session store to keep, yet the cookie is
 * still unforgeable without the password, and rotating the password invalidates every
 * outstanding session for free. HttpOnly keeps it away from any XSS in the app, Secure
 * keeps it off plaintext hops, and SameSite=Lax stops other sites from riding it.
 *
 * SETUP (Cloudflare Pages > the Sales OS project > Settings > Variables and secrets):
 *   SALES_OS_PASSWORD  secret, required. Set it to the shared team password.
 *
 * There is NO default password. An unset variable returns 503 for every request rather
 * than falling back to something guessable: a misconfigured deploy that is merely broken
 * is recoverable, a misconfigured deploy that is silently wide open is not. This is the
 * same fail-closed posture as recipientsFrom() in ../../functions/api/lead.js.
 */

const COOKIE = 'sales_os_session';
const SESSION_SECONDS = 60 * 60 * 12; // one working day, then log in again
const LOGIN_PATH = '/__login';

/* Constant-time compare. A plain === leaks the length of the matching prefix through
   response timing, which over enough requests is enough to recover a short password one
   character at a time. Length is compared first and both branches still run the full
   loop, so only the length itself is observable. */
function timingSafeEqual(a, b) {
  const enc = new TextEncoder();
  const bufA = enc.encode(a);
  const bufB = enc.encode(b);
  if (bufA.length !== bufB.length) return false;
  let diff = 0;
  for (let i = 0; i < bufA.length; i++) diff |= bufA[i] ^ bufB[i];
  return diff === 0;
}

async function sign(value, password) {
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey(
    'raw', enc.encode(password), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign'],
  );
  const mac = await crypto.subtle.sign('HMAC', key, enc.encode(value));
  return [...new Uint8Array(mac)].map((b) => b.toString(16).padStart(2, '0')).join('');
}

async function issue(password) {
  const exp = String(Math.floor(Date.now() / 1000) + SESSION_SECONDS);
  return `${exp}.${await sign(exp, password)}`;
}

/* Verify signature BEFORE trusting anything in the cookie, expiry included: the expiry is
   attacker-supplied until the HMAC says otherwise. */
async function valid(token, password) {
  if (typeof token !== 'string') return false;
  const dot = token.indexOf('.');
  if (dot === -1) return false;
  const exp = token.slice(0, dot);
  if (!/^\d+$/.test(exp)) return false;
  if (!timingSafeEqual(token.slice(dot + 1), await sign(exp, password))) return false;
  return Number(exp) > Math.floor(Date.now() / 1000);
}

function cookieFrom(header) {
  if (typeof header !== 'string') return null;
  for (const part of header.split(';')) {
    const [name, ...rest] = part.trim().split('=');
    if (name === COOKIE) return rest.join('=');
  }
  return null;
}

/* Self-contained by necessity: an unauthenticated request is served no CSS, no JS and no
   font from this origin, so the brand has to be inlined here rather than pulled from
   tokens.css. The values below are copied from sales/tokens.css (dark surfaces --d-bg /
   --d-900 / --d-line, --d-text, crimson-500 #d7153f, DM Serif Display for the wordmark).
   If the palette moves there, move it here too - this is the one place that cannot import
   it. */
function loginPage(error) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<meta name="robots" content="noindex, nofollow" />
<title>Sales OS</title>
<link rel="preconnect" href="https://fonts.googleapis.com" />
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
<link href="https://fonts.googleapis.com/css2?family=DM+Serif+Display&family=DM+Sans:wght@400;500;700&display=swap" rel="stylesheet" />
<style>
  :root {
    color-scheme: dark;
    --d-bg:#0a0d12; --d-900:#111621; --d-800:#1b222e;
    --d-line:#232c39; --d-text:#e6ecf5; --d-text-dim:#9aa7bd;
    --crimson-500:#d7153f; --crimson-600:#b91237; --crimson-300:#f08aa0;
    --navy-600:#24478a;
    --f-sans:"DM Sans",-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Helvetica,Arial,sans-serif;
    --f-serif:"DM Serif Display",Georgia,serif;
  }
  * { box-sizing: border-box; }
  body {
    margin: 0; min-height: 100vh; min-height: 100dvh;
    display: grid; place-items: center; padding: 24px;
    background: var(--d-bg); color: var(--d-text);
    font: 400 14px/1.5 var(--f-sans);
    /* A single wide navy wash behind the card so the page reads as a surface, not a void. */
    background-image: radial-gradient(120% 80% at 50% 0%, rgba(36,71,138,.22) 0%, transparent 60%);
  }
  .card {
    width: min(380px, 100%);
    background: var(--d-900);
    border: 1px solid var(--d-line);
    border-radius: 16px;
    padding: 40px 36px 36px;
    box-shadow: 0 8px 40px -8px rgba(0,0,0,.55);
    text-align: center;
  }
  .mark {
    font-family: var(--f-serif); font-size: 30px; line-height: 1.1;
    margin: 0 0 6px; letter-spacing: -0.01em;
  }
  .mark span { color: var(--crimson-500); }
  .sub {
    margin: 0 0 28px; color: var(--d-text-dim); font-size: 12.5px;
    text-transform: uppercase; letter-spacing: .08em;
  }
  /* One line: the password field and nothing else. No username, no remember-me. */
  input {
    width: 100%; padding: 13px 15px; font: 400 16px/1.2 var(--f-sans);
    text-align: center; letter-spacing: .04em;
    color: var(--d-text); background: var(--d-800);
    border: 1px solid var(--d-line); border-radius: 10px;
    transition: border-color .15s ease;
  }
  input::placeholder { color: var(--d-text-dim); letter-spacing: normal; }
  input:focus { outline: none; border-color: var(--crimson-500); }
  button {
    width: 100%; margin-top: 12px; padding: 13px 15px;
    font: 700 14px/1.2 var(--f-sans); letter-spacing: .02em;
    color: #fff; background: var(--crimson-500);
    border: 0; border-radius: 10px; cursor: pointer;
    transition: background .15s ease;
  }
  button:hover { background: var(--crimson-600); }
  .error { margin: 18px 0 0; color: var(--crimson-300); font-size: 13px; }
</style>
</head>
<body>
  <form class="card" method="POST" action="${LOGIN_PATH}">
    <h1 class="mark">Sales<span>OS</span></h1>
    <p class="sub">American BioCarbon</p>
    <input name="password" type="password" autocomplete="current-password"
           placeholder="Password" aria-label="Password" autofocus required />
    <button type="submit">Enter</button>
    ${error ? `<p class="error">${error}</p>` : ''}
  </form>
</body>
</html>`;
}

function loginResponse(error, status = 200) {
  return new Response(loginPage(error), {
    status,
    headers: { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-store' },
  });
}

export async function onRequest(context) {
  const { request, env, next } = context;
  const url = new URL(request.url);

  const expected = typeof env.SALES_OS_PASSWORD === 'string' ? env.SALES_OS_PASSWORD.trim() : '';
  if (!expected) {
    return new Response(
      'Sales OS is not configured: SALES_OS_PASSWORD is unset on this deployment.',
      { status: 503, headers: { 'Cache-Control': 'no-store', 'Content-Type': 'text/plain; charset=utf-8' } },
    );
  }

  if (url.pathname === LOGIN_PATH) {
    if (request.method !== 'POST') return Response.redirect(url.origin + '/', 303);
    const form = await request.formData();
    const supplied = form.get('password');
    if (typeof supplied !== 'string' || !timingSafeEqual(supplied, expected)) {
      return loginResponse('That password is not right.', 401);
    }
    /* 303 so the browser re-requests with GET; a plain 200 here would leave the POST in
       history and re-submit the password on refresh. */
    return new Response(null, {
      status: 303,
      headers: {
        Location: '/',
        'Cache-Control': 'no-store',
        'Set-Cookie': `${COOKIE}=${await issue(expected)}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=${SESSION_SECONDS}`,
      },
    });
  }

  if (!(await valid(cookieFrom(request.headers.get('Cookie')), expected))) {
    /* 401 on every gated route, including assets, so a stale tab fetching a .js file gets
       an honest refusal rather than an HTML page parsed as JavaScript. */
    return loginResponse(null, 401);
  }

  /* Authorized. Serve the asset, then force private caching on the way out. The static
     rules in _headers mark /*.js and /*.css immutable for a year, which is correct for
     content-hashed assets but must never license a shared cache to hold gated content and
     hand it to the next person. Vary: Cookie is the belt to that suspenders. */
  const response = await next();
  const headers = new Headers(response.headers);
  const cache = headers.get('Cache-Control');
  headers.set('Cache-Control', cache ? `private, ${cache.replace(/^public,\s*/i, '')}` : 'private, no-store');
  headers.set('Vary', 'Cookie');
  return new Response(response.body, { status: response.status, statusText: response.statusText, headers });
}
