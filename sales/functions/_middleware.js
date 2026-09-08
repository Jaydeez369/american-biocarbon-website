/**
 * Named-account login gate for the STANDALONE Sales OS Cloudflare Pages project
 * (root dir = sales/).
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
 * WHAT CHANGED, AND WHY (2026-09-07)
 * Until now this was one shared password with no usernames. That was written down as a
 * known debt in client-handoff/test-script.md ("anyone with the link and the password is
 * fully in ... please do not forward it") and Victor asked on the 2026-08-31 call for
 * named accounts before access widened past the three of us. It is now named accounts:
 * each person has their own username and their own password, so a departure or a leaked
 * password revokes one person rather than resetting everybody, and the app can say who is
 * looking at it instead of guessing at a name.
 *
 * A form + signed cookie, NOT HTTP Basic: the browser's native dialog cannot be styled,
 * cannot be logged out of without closing the browser, and re-prompts on every 401.
 *
 * The cookie is `user.exp.HMAC-SHA256("user.exp")` keyed on THAT USER'S OWN password.
 * That is deliberate: there is no second secret to configure and no session store to
 * keep, yet the cookie is unforgeable without the password, and changing one person's
 * password invalidates that person's outstanding sessions and nobody else's. HttpOnly
 * keeps it away from any XSS in the app, Secure keeps it off plaintext hops, and
 * SameSite=Lax stops other sites from riding it.
 *
 * SETUP (Cloudflare Pages > the Sales OS project > Settings > Variables and secrets):
 *
 *   SALES_OS_USERS   secret, preferred. One account per line (or comma separated):
 *
 *       victor:S0meLongPassphrase:admin:Victor Jehle
 *       daniel:An0therLongOne:manager:Daniel Villamizar
 *       jesse:AThirdOne:dev:Jesse DeLuca
 *
 *     Fields are username:password:role:display name. Role and display name are both
 *     optional and a missing role means `manager`, the least-privileged role. The display
 *     name is the only part of this that ever reaches the browser (see the sales_os_user
 *     cookie below), so it must never contain the password. Usernames are matched
 *     case-insensitively and are not secret. What each role may do is _lib/authz.js.
 *
 *   SALES_OS_PASSWORD  secret, legacy. The old single shared password. Still accepted so
 *     that a deploy of this file cannot lock the team out mid-week, and so the two can be
 *     rotated independently. It logs in as the account "team". DELETE THIS VARIABLE once
 *     everyone has their own line in SALES_OS_USERS: while it is set, one forwarded
 *     password is still full access, which is the exact thing named accounts fix.
 *
 * There is NO default password. With BOTH variables unset every request returns 503
 * rather than falling back to something guessable: a misconfigured deploy that is merely
 * broken is recoverable, a misconfigured deploy that is silently wide open is not. This
 * is the same fail-closed posture as recipientsFrom() in ../../functions/api/lead.js.
 *
 * WHAT ROLES DO AND DO NOT DO. Roles gate ACTIONS, not READING. Every account still sees
 * everything on the screen — COGS, price floors, margin, the whole roster — because the
 * Sales OS ships as one static bundle and a bundle on someone's laptop cannot keep a
 * secret from them. Anyone given any login is being given the whole document. What a role
 * decides is what the server will DO on their behalf: write a record, delete one, send
 * something out under the company's name. Those checks run on the edge in _lib/authz.js,
 * where they cannot be bypassed by retyping a fetch. A read-only tier would require the
 * figures to stop being in the bundle at all, which is a real piece of work and is not
 * this one.
 */

import { DEFAULT_ROLE, isRole } from './_lib/authz.js';

const COOKIE = 'sales_os_session';
/* Readable by JS on purpose: the app renders "Victor" in the header instead of a
   hard-coded name. It carries no authority whatsoever. Forging it changes the label on
   the screen and nothing else, because every gated request is authorised from the signed
   HttpOnly cookie above and never from this one. */
const NAME_COOKIE = 'sales_os_user';
/* The role, readable by JS for the same reason and with the same standing: it lets the app
   grey out a control the server would refuse anyway. It is a hint for the screen, never a
   permission. Every actual decision is made from the signed cookie by _lib/authz.js. */
const ROLE_COOKIE = 'sales_os_role';
const SESSION_SECONDS = 60 * 60 * 12; // one working day, then log in again
const LOGIN_PATH = '/__login';

/* THE LOGIN PAGE'S IMAGERY, AND WHY IT IS NOT LOCAL.
 *
 * This middleware runs in front of every path on this project, so the login page is served
 * BEFORE any asset from this origin is reachable. A local /assets/... reference would 302 back
 * to the login page and render as a broken image to somebody who is not signed in yet, which is
 * the first thing they would ever see of this system.
 *
 * So both come from the Shopify CDN that already serves the marketing site's imagery: the same
 * files, the same cache, nothing new to host and nothing added to this project's bundle. They
 * are public assets on a public storefront, so serving them here reveals nothing that
 * americanbiocarbon.com does not already show anyone.
 *
 * Inlining them as data URIs was the alternative and is worse: the photograph is ~850KB, and it
 * would be re-sent inside the HTML on every unauthenticated request, including every bot that
 * knocks on this door.
 *
 * The page is built to survive both of these 404ing. The body keeps a solid warm ground under
 * the photograph, and the logo has real alt text, so a failed load degrades to a plain dark card
 * with the company name in words rather than to a broken layout. */
const CDN = 'https://cdn.shopify.com/s/files/1/0773/9270/7876/files/';

/* Pellets coming off the conveyor at the mill.
 *
 * SIZED PROPERLY, because this is a page people wait on before they can do anything and the
 * original is 1365x2048 at ~850KB. Shopify's CDN resizes on the `width` parameter, and measured:
 * 900 -> 375KB, 1100 -> 608KB, 1365 -> 871KB. Asking for more than 1365 does nothing, which is
 * why the first version at width=1600 saved nothing at all.
 *
 * So the page ships a srcset and lets the browser choose. A phone takes the 375KB frame, a wide
 * monitor takes the full one, and nobody downloads a 2K-wide file to look at it through a
 * vignette on a laptop. `sizes="100vw"` because the image is full bleed by definition. */
const SHOT_BASE = CDN + 'AmericanBiocarbon2021-292.jpg?v=1699280021';
const SHOT_SRC = SHOT_BASE + '&width=1365';
const SHOT_SRCSET = [900, 1100, 1365].map((w) => `${SHOT_BASE}&width=${w} ${w}w`).join(', ');

/* The reversed (white) horizontal wordmark, which is the one that works on a dark ground. */
const LOGO_SRC = CDN + 'abc-logo-horiz_rev_38e8f78a-b79f-4c53-8b36-d10683e943cf.webp?v=1710182358';
const LOGOUT_PATH = '/__logout';

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

/**
 * Parse SALES_OS_USERS into accounts, newest wins on a duplicate username.
 *
 *   username:password:role:Display Name
 *
 * Split on the FIRST colon for the username and the LAST two fields for role and display
 * name, so a password may contain colons; a role and a display name may not, which is a
 * fair trade because one is a keyword and the other is a person's name. The role field is
 * optional: a line whose third field is not a known role is read as the old
 * username:password:Display Name shape, so accounts written before roles existed keep
 * working and land on DEFAULT_ROLE. Blank lines and #-comments are allowed so the
 * variable can be annotated in the Cloudflare UI.
 *
 * A line missing a username or a password is skipped rather than becoming an account with
 * an empty password, which would be an open door.
 */
export function parseUsers(env) {
  const out = new Map();
  const raw = typeof env.SALES_OS_USERS === 'string' ? env.SALES_OS_USERS : '';
  for (const line of raw.split(/[\r\n,]+/)) {
    const entry = line.trim();
    if (!entry || entry.startsWith('#')) continue;
    const first = entry.indexOf(':');
    if (first < 1) continue;
    const username = entry.slice(0, first).trim().toLowerCase();

    /* Fields after the username, from the RIGHT, because the password is the only field
       allowed to contain a colon and so must absorb whatever is left over. */
    const rest = entry.slice(first + 1);
    const parts = rest.split(':');
    let role = DEFAULT_ROLE;
    let display = '';
    if (parts.length >= 3 && isRole(parts[parts.length - 2])) {
      display = parts.pop().trim();
      role = parts.pop().trim().toLowerCase();
    } else if (parts.length >= 2 && isRole(parts[parts.length - 1])) {
      role = parts.pop().trim().toLowerCase();
    } else if (parts.length >= 2) {
      display = parts.pop().trim();
    }
    const password = parts.join(':').trim();

    if (!username || !password) continue;
    out.set(username, { username, password, role, display: display || username });
  }

  /* The legacy shared password, as the account "team". Only if nobody has claimed that
     username, so a real person named team in SALES_OS_USERS is never shadowed.

     It gets DEFAULT_ROLE, not admin. Everyone who has ever been handed the shared word is
     holding it, and a password with unknown reach must not carry the two capabilities
     whose damage outlives the day — that is the whole argument for named accounts,
     applied to the credential that made the argument necessary. */
  const shared = typeof env.SALES_OS_PASSWORD === 'string' ? env.SALES_OS_PASSWORD.trim() : '';
  if (shared && !out.has('team')) {
    out.set('team', { username: 'team', password: shared, role: DEFAULT_ROLE, display: 'Team', shared: true });
  }
  return out;
}

async function sign(value, password) {
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey(
    'raw', enc.encode(password), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign'],
  );
  const mac = await crypto.subtle.sign('HMAC', key, enc.encode(value));
  return [...new Uint8Array(mac)].map((b) => b.toString(16).padStart(2, '0')).join('');
}

async function issue(account) {
  const exp = String(Math.floor(Date.now() / 1000) + SESSION_SECONDS);
  const body = `${account.username}.${exp}`;
  return `${body}.${await sign(body, account.password)}`;
}

/* Verify the signature BEFORE trusting anything in the cookie, the username and the
   expiry included: both are attacker-supplied until the HMAC says otherwise. Returns the
   account on success so the caller learns who this is from the same pass that proves it. */
export async function verify(token, users) {
  if (typeof token !== 'string') return null;
  const parts = token.split('.');
  if (parts.length !== 3) return null;
  const [username, exp, mac] = parts;
  if (!/^\d+$/.test(exp)) return null;
  const account = users.get(username.toLowerCase());
  if (!account) return null;
  if (!timingSafeEqual(mac, await sign(`${account.username}.${exp}`, account.password))) return null;
  if (Number(exp) <= Math.floor(Date.now() / 1000)) return null;
  return account;
}

/**
 * Authenticate a submitted username and password.
 *
 * An unknown username still runs one HMAC's worth of work against a decoy before failing,
 * so "no such user" and "wrong password" take comparable time and the response cannot be
 * used to enumerate who works here.
 */
export async function authenticate(username, password, users) {
  const key = typeof username === 'string' ? username.trim().toLowerCase() : '';
  const supplied = typeof password === 'string' ? password : '';
  const account = users.get(key);
  if (!account) {
    await sign('decoy', supplied || 'decoy');
    return null;
  }
  return timingSafeEqual(supplied, account.password) ? account : null;
}

function cookieFrom(header, name) {
  if (typeof header !== 'string') return null;
  for (const part of header.split(';')) {
    const [key, ...rest] = part.trim().split('=');
    if (key === name) return rest.join('=');
  }
  return null;
}

/* The display name lands in a Set-Cookie header and, once the app reads it, in the DOM.
   Strip everything that could break out of either. */
function safeName(value) {
  return String(value).replace(/[^A-Za-z0-9 .'-]/g, '').slice(0, 40);
}

/* Self-contained by necessity: an unauthenticated request is served no CSS, no JS and no
   font from this origin, so the brand has to be inlined here rather than pulled from
   tokens.css. The values below are copied from sales/tokens.css (dark surfaces --d-bg /
   --d-900 / --d-line, --d-text, crimson-500 #d7153f, DM Serif Display for the wordmark).
   If the palette moves there, move it here too - this is the one place that cannot import
   it. */
function loginPage(error, username) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<meta name="robots" content="noindex, nofollow" />
<title>Sales OS</title>
<link rel="preconnect" href="https://fonts.googleapis.com" />
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
<link rel="preconnect" href="${CDN}" crossorigin />
<link rel="preload" as="image" href="${SHOT_SRC}" imagesrcset="${SHOT_SRCSET}" imagesizes="100vw" fetchpriority="high" />
<link href="https://fonts.googleapis.com/css2?family=DM+Serif+Display&family=DM+Sans:wght@400;500;700&display=swap" rel="stylesheet" />
<style>
  /* ---------------------------------------------------------------------------
     THE PALETTE IS TAKEN FROM THE PHOTOGRAPH, not from the app's dark theme.
     The shot is pellets coming off the conveyor at the mill: warm khaki through
     bronze, sampled at #9a8f77 overall, #7e6e52 through the pellets and #bbb5a4 up
     at the machinery. The old card was cold navy (#111621) on a flat void, which
     read as a different product sitting on top of the picture. Everything below is
     warmed to sit IN the photograph instead: bark browns for the surfaces, a khaki
     dim text lifted straight out of the image, and crimson kept as the one brand
     colour, which is close to complementary against that khaki and so stays the
     only thing on screen asking to be clicked.
     --------------------------------------------------------------------------- */
  :root {
    color-scheme: dark;
    --bark-900:#0d0a06; --bark-800:#171208; --bark-700:#241c11;
    --bronze-line:rgba(219,199,158,.26); --bronze-line-2:rgba(226,208,170,.55);
    --text:#f4efe4; --text-dim:#bcae94;
    --crimson-500:#d7153f; --crimson-600:#b91237; --crimson-300:#f4a0b2;
    --f-sans:"DM Sans",-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Helvetica,Arial,sans-serif;
    --f-serif:"DM Serif Display",Georgia,serif;
  }
  * { box-sizing: border-box; }
  html, body { height: 100%; }
  body {
    margin: 0; color: var(--text); font: 400 14px/1.5 var(--f-sans);
    /* The solid ground is the fallback: if the photograph never arrives, the page
       is still a warm dark surface rather than a white flash or a broken frame. */
    background: var(--bark-900);
    -webkit-font-smoothing: antialiased;
  }

  /* ---- the photograph ---- */
  .stage { position: fixed; inset: 0; z-index: 0; overflow: hidden; }
  .shot {
    width: 100%; height: 100%; object-fit: cover;
    /* The frame is portrait and the conveyor runs to a vanishing point just above
       centre. Holding the crop at 42% keeps that line in shot on a wide monitor
       instead of filling the screen with the near pellets. */
    object-position: 50% 38%;
    transform: scale(1.04);
    animation: settle 1.2s cubic-bezier(.2,.7,.3,1) both;
  }
  .scrim {
    position: absolute; inset: 0;
    /* TUNED AGAINST THE PICTURE, not picked from a scale. The first attempt sat at
       .70/.90 and flattened the mill to grey, which is the exact thing this redesign
       was meant to stop: a photograph you cannot see is just a dark background with a
       download attached. These values keep the khaki and the steel legible and lean on
       the card's own blur and fill for text contrast instead of on darkening the whole
       frame. The vignette still closes the corners so the card has something to sit in. */
    background:
      radial-gradient(82% 62% at 50% 44%, rgba(16,11,5,.04) 0%, rgba(14,10,5,.34) 56%, rgba(9,7,3,.72) 100%),
      linear-gradient(180deg, rgba(10,8,4,.42) 0%, rgba(10,8,4,.02) 36%, rgba(9,7,3,.56) 100%);
  }
  @keyframes settle { from { transform: scale(1.10); opacity: 0 } to { transform: scale(1.04); opacity: 1 } }

  /* ---- the card ---- */
  .wrap {
    position: relative; z-index: 1;
    min-height: 100vh; min-height: 100dvh;
    display: grid; place-items: center; padding: 28px;
    grid-template-rows: 1fr auto;
  }
  .card {
    grid-row: 1; align-self: center;
    width: min(392px, 100%);
    background: linear-gradient(180deg, rgba(44,35,24,.74) 0%, rgba(20,15,10,.86) 100%);
    -webkit-backdrop-filter: blur(20px) saturate(1.15);
    backdrop-filter: blur(20px) saturate(1.15);
    border: 1px solid var(--bronze-line);
    border-radius: 18px;
    padding: 34px 34px 30px;
    text-align: center;
    box-shadow:
      0 34px 90px -22px rgba(0,0,0,.80),
      inset 0 1px 0 rgba(255,255,255,.07);
    animation: rise .7s cubic-bezier(.2,.7,.3,1) both .12s;
  }
  @keyframes rise { from { opacity: 0; transform: translateY(14px) } to { opacity: 1; transform: none } }

  /* The company mark first, the product second: this is American BioCarbon's
     system, and Sales OS is the thing inside it. */
  .logo { display: block; width: 178px; max-width: 72%; height: auto; margin: 2px auto 0; }
  .rule {
    width: 46px; height: 1px; margin: 20px auto 16px; border: 0;
    background: linear-gradient(90deg, transparent, var(--bronze-line-2), transparent);
  }
  .mark {
    font-family: var(--f-serif); font-size: 31px; line-height: 1.05;
    margin: 0 0 26px; letter-spacing: -.01em; color: var(--text);
  }
  .mark span { color: var(--crimson-500); }

  .fields { display: grid; gap: 10px; }
  input {
    width: 100%; padding: 13px 15px; font: 400 16px/1.2 var(--f-sans);
    text-align: center; letter-spacing: .04em;
    color: var(--text); background: rgba(11,8,5,.55);
    border: 1px solid var(--bronze-line); border-radius: 11px;
    transition: border-color .16s ease, box-shadow .16s ease, background .16s ease;
  }
  input::placeholder { color: var(--text-dim); letter-spacing: normal; }
  input:hover { border-color: var(--bronze-line-2); }
  input:focus {
    outline: none; background: rgba(11,8,5,.72);
    border-color: var(--crimson-500);
    box-shadow: 0 0 0 3px rgba(215,21,63,.22);
  }
  button {
    width: 100%; margin-top: 14px; padding: 14px 15px;
    font: 700 14px/1.2 var(--f-sans); letter-spacing: .03em;
    color: #fff; border: 0; border-radius: 11px; cursor: pointer;
    background: linear-gradient(180deg, var(--crimson-500), var(--crimson-600));
    box-shadow: 0 8px 22px -8px rgba(215,21,63,.65);
    transition: filter .16s ease, transform .16s ease, box-shadow .16s ease;
  }
  button:hover { filter: brightness(1.08); box-shadow: 0 12px 28px -8px rgba(215,21,63,.75); }
  button:active { transform: translateY(1px); }
  button:focus-visible, input:focus-visible { outline: 2px solid var(--crimson-300); outline-offset: 2px; }

  .error {
    margin: 16px 0 0; color: var(--crimson-300); font-size: 13px; line-height: 1.45;
    background: rgba(215,21,63,.10); border: 1px solid rgba(215,21,63,.30);
    border-radius: 9px; padding: 9px 12px;
  }
  .foot {
    grid-row: 2; margin: 22px 0 0; font-size: 11.5px; letter-spacing: .07em;
    text-transform: uppercase; color: var(--text-dim); opacity: .75;
  }

  @media (max-width: 420px) {
    .card { padding: 28px 22px 26px; border-radius: 15px; }
    .mark { font-size: 27px; }
  }
  @media (prefers-reduced-motion: reduce) {
    .shot, .card { animation: none; }
    .shot { transform: none; }
  }
</style>
</head>
<body>
  <div class="stage">
    <img class="shot" src="${SHOT_SRC}" srcset="${SHOT_SRCSET}" sizes="100vw"
         alt="" aria-hidden="true" decoding="async" fetchpriority="high" />
    <div class="scrim"></div>
  </div>
  <main class="wrap">
    <form class="card" method="POST" action="${LOGIN_PATH}">
      <img class="logo" src="${LOGO_SRC}" alt="American BioCarbon" />
      <hr class="rule" />
      <h1 class="mark">Sales<span>OS</span></h1>
      <div class="fields">
        <input name="username" type="text" autocomplete="username" autocapitalize="none"
               spellcheck="false" placeholder="Username" aria-label="Username"
               value="${safeName(username || '')}" autofocus required />
        <input name="password" type="password" autocomplete="current-password"
               placeholder="Password" aria-label="Password" required />
      </div>
      <button type="submit">Enter</button>
      ${error ? `<p class="error" role="alert">${error}</p>` : ''}
    </form>
    <p class="foot">Internal system &middot; authorised users only</p>
  </main>
</body>
</html>`;
}

function loginResponse(error, status = 200, username = '') {
  return new Response(loginPage(error, username), {
    status,
    headers: { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-store' },
  });
}

export async function onRequest(context) {
  const { request, env, next } = context;
  const url = new URL(request.url);

  const users = parseUsers(env);
  if (users.size === 0) {
    return new Response(
      'Sales OS is not configured: neither SALES_OS_USERS nor SALES_OS_PASSWORD is set on this deployment.',
      { status: 503, headers: { 'Cache-Control': 'no-store', 'Content-Type': 'text/plain; charset=utf-8' } },
    );
  }

  if (url.pathname === LOGOUT_PATH) {
    /* Clear both cookies, then land back on the login page. Max-Age=0 rather than a past
       Expires so a browser with a skewed clock still drops them. */
    return new Response(null, {
      status: 303,
      headers: [
        ['Location', '/'],
        ['Cache-Control', 'no-store'],
        ['Set-Cookie', `${COOKIE}=; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=0`],
        ['Set-Cookie', `${NAME_COOKIE}=; Path=/; Secure; SameSite=Lax; Max-Age=0`],
        ['Set-Cookie', `${ROLE_COOKIE}=; Path=/; Secure; SameSite=Lax; Max-Age=0`],
      ],
    });
  }

  if (url.pathname === LOGIN_PATH) {
    if (request.method !== 'POST') return Response.redirect(url.origin + '/', 303);
    const form = await request.formData();
    const account = await authenticate(form.get('username'), form.get('password'), users);
    if (!account) {
      /* One message for both failures. Naming which half was wrong tells an attacker
         which usernames exist. */
      return loginResponse('That username and password combination is not right.', 401,
        typeof form.get('username') === 'string' ? form.get('username') : '');
    }
    /* 303 so the browser re-requests with GET; a plain 200 here would leave the POST in
       history and re-submit the password on refresh. */
    return new Response(null, {
      status: 303,
      headers: [
        ['Location', '/'],
        ['Cache-Control', 'no-store'],
        ['Set-Cookie', `${COOKIE}=${await issue(account)}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=${SESSION_SECONDS}`],
        ['Set-Cookie', `${NAME_COOKIE}=${encodeURIComponent(safeName(account.display))}; Path=/; Secure; SameSite=Lax; Max-Age=${SESSION_SECONDS}`],
        ['Set-Cookie', `${ROLE_COOKIE}=${encodeURIComponent(account.role)}; Path=/; Secure; SameSite=Lax; Max-Age=${SESSION_SECONDS}`],
      ],
    });
  }

  const account = await verify(cookieFrom(request.headers.get('Cookie'), COOKIE), users);
  if (!account) {
    /* 401 on every gated route, including assets, so a stale tab fetching a .js file gets
       an honest refusal rather than an HTML page parsed as JavaScript. */
    return loginResponse(null, 401);
  }

  /* Hand the identity to the route handlers. context.data is the only channel Pages gives
     middleware for this, and it is per-request, so a handler reading context.data.user is
     reading the account this very request proved — never a cached one, and never one a
     header or a cookie asserted without a signature. Every authorization decision in
     _lib/authz.js starts here. */
  context.data = context.data || {};
  context.data.user = { username: account.username, role: account.role, display: account.display };

  /* Authorized. Serve the asset, then force private caching on the way out. The static
     rules in _headers mark /*.js and /*.css immutable for a year, which is correct for
     content-hashed assets but must never license a shared cache to hold gated content and
     hand it to the next person. Vary: Cookie is the belt to that suspenders. */
  const response = await next();
  const headers = new Headers(response.headers);
  const cache = headers.get('Cache-Control');
  headers.set('Cache-Control', cache ? `private, ${cache.replace(/^public,\s*/i, '')}` : 'private, no-store');
  headers.set('Vary', 'Cookie');
  /* Who is logged in, for the app and for anything reading a response in a support
     thread. Not a credential; see NAME_COOKIE above. */
  headers.set('X-Sales-Os-User', account.username);
  headers.set('X-Sales-Os-Role', account.role);
  return new Response(response.body, { status: response.status, statusText: response.statusText, headers });
}
