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
 * HTTP Basic auth, deliberately. It is stateless (no session store, no cookie signing key
 * to leak), the browser remembers it for the session, and it costs ~40 lines. The tradeoff
 * is a native browser dialog and no logout button; for a shared internal tool with one
 * team password that is the right trade. Closing the browser clears it.
 *
 * SETUP (Cloudflare Pages > the Sales OS project > Settings > Variables and secrets):
 *   SALES_OS_PASSWORD  secret, required. Set it to the shared team password.
 *                      Username is ignored, so anyone can type anything there.
 *
 * There is NO default password. An unset variable returns 503 for every request rather
 * than falling back to something guessable: a misconfigured deploy that is merely broken
 * is recoverable, a misconfigured deploy that is silently wide open is not. This is the
 * same fail-closed posture as recipientsFrom() in ../../functions/api/lead.js.
 */

const REALM = 'American BioCarbon Sales OS';

/* Reject with the WWW-Authenticate header that makes the browser show its login dialog.
   Cache-Control: no-store keeps an intermediary from ever holding onto a 401 or, worse,
   onto the authorized response that follows it. */
function challenge(message) {
  return new Response(message, {
    status: 401,
    headers: {
      'WWW-Authenticate': `Basic realm="${REALM}", charset="UTF-8"`,
      'Cache-Control': 'no-store',
      'Content-Type': 'text/plain; charset=utf-8',
    },
  });
}

/* Constant-time string compare. A plain === leaks the length of the matching prefix through
   response timing, which over enough requests is enough to recover a short password one
   character at a time. The length is compared first and both branches still run the full
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

/* Pull the password out of an "Authorization: Basic base64(user:pass)" header.
   The username half is discarded on purpose: one shared team password, no user accounts.
   Note the credential itself may contain colons, so only the FIRST colon is a separator. */
function passwordFrom(header) {
  if (typeof header !== 'string' || !header.startsWith('Basic ')) return null;
  let decoded;
  try {
    decoded = atob(header.slice(6).trim());
  } catch {
    return null; // malformed base64, treat as no credential rather than throwing a 500
  }
  const sep = decoded.indexOf(':');
  if (sep === -1) return null;
  return decoded.slice(sep + 1);
}

export async function onRequest(context) {
  const { request, env, next } = context;

  const expected = typeof env.SALES_OS_PASSWORD === 'string' ? env.SALES_OS_PASSWORD.trim() : '';
  if (!expected) {
    return new Response(
      'Sales OS is not configured: SALES_OS_PASSWORD is unset on this deployment.',
      { status: 503, headers: { 'Cache-Control': 'no-store', 'Content-Type': 'text/plain; charset=utf-8' } },
    );
  }

  const supplied = passwordFrom(request.headers.get('Authorization'));
  if (supplied === null) return challenge('Authentication required.');
  if (!timingSafeEqual(supplied, expected)) return challenge('Invalid credentials.');

  /* Authorized. Serve the asset, then force private caching on the way out. The static
     rules in _headers mark /*.js and /*.css immutable for a year, which is correct for
     content-hashed assets but must never license a shared cache to hold gated content and
     hand it to the next person. Vary: Authorization is the belt to that suspenders. */
  const response = await next();
  const headers = new Headers(response.headers);
  const cache = headers.get('Cache-Control');
  headers.set('Cache-Control', cache ? `private, ${cache.replace(/^public,\s*/i, '')}` : 'private, no-store');
  headers.set('Vary', 'Authorization');
  return new Response(response.body, { status: response.status, statusText: response.statusText, headers });
}
