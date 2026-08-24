/**
 * GET /api/instantly — the live Instantly workspace, in the same shape as instantly-data.js.
 *
 * Same trick as /api/allo: a Pages Function runs server side on Cloudflare's edge, so the
 * API key lives here and never reaches a browser. Same origin, so no CORS. Behind
 * functions/_middleware.js, so an unauthenticated request never gets this far.
 *
 * The response is byte-for-byte the same SHAPE as the generated snapshot, because both call
 * shapeInstantly() in ../_lib/instantly-shape.js. That matters: the page renders the snapshot
 * on first paint and swaps this in when it lands, and if the two shapes disagreed the numbers
 * would visibly change meaning a second after load.
 *
 * ALL READS. Three GETs, no writes. Nothing here can create, launch, pause or edit anything,
 * which is deliberate: a dashboard route is the last place a campaign should be mutable from.
 *
 * FAILS SOFT. Missing key, upstream error, timeout — all return `ok:false` with a reason and
 * a 200, never a 500. The page keeps the dated snapshot it already has.
 *
 * SETUP (Cloudflare Pages > cs-ops-sales-os > Settings > Variables and secrets):
 *   INSTANTLY_API_KEY   secret. The same workspace key that is in .env. Read-only scopes are
 *                       enough: campaigns:all, accounts:all. It does NOT need
 *                       block_list_entries or webhooks, which the current key lacks anyway.
 */

import { shapeInstantly } from '../_lib/instantly-shape.js';

const API = 'https://api.instantly.ai/api/v2';
const TIMEOUT_MS = 8000;

const soft = (reason, detail) =>
  new Response(JSON.stringify({ ok: false, reason, detail: detail || null }), {
    status: 200, // an expected state, not an error
    headers: { 'Content-Type': 'application/json', 'Cache-Control': 'private, no-store' },
  });

export async function onRequestGet(context) {
  const { env } = context;

  const key = typeof env.INSTANTLY_API_KEY === 'string' ? env.INSTANTLY_API_KEY.trim() : '';
  if (!key) return soft('not-configured', 'INSTANTLY_API_KEY is unset on this deployment');

  const abort = new AbortController();
  const timer = setTimeout(() => abort.abort(), TIMEOUT_MS);

  const get = async (path) => {
    const res = await fetch(API + path, {
      headers: { Authorization: `Bearer ${key}` },
      signal: abort.signal,
    });
    if (!res.ok) {
      const body = await res.text().catch(() => '');
      /* Instantly names the missing scope in its 401 body. Pass that through rather than a
         bare "unauthorized": the difference between a wrong key and a key missing one scope
         is the difference between a five second fix and an afternoon. */
      throw Object.assign(new Error(`GET ${path} -> ${res.status}`), {
        status: res.status,
        detail: body.slice(0, 240),
      });
    }
    return res.json();
  };

  try {
    /* Three calls in parallel: they are independent and the timeout is shared, so serialising
       them would triple the worst case for no benefit. */
    const [campaigns, analytics, accounts] = await Promise.all([
      get('/campaigns?limit=100'),
      get('/campaigns/analytics'),
      get('/accounts?limit=100'),
    ]);

    const shaped = shapeInstantly(
      campaigns.items || [],
      Array.isArray(analytics) ? analytics : [],
      accounts.items || [],
      { source: 'live', at: new Date() },
    );

    return new Response(JSON.stringify({ ok: true, ...shaped }), {
      headers: { 'Content-Type': 'application/json', 'Cache-Control': 'private, no-store' },
    });
  } catch (error) {
    if (abort.signal.aborted) return soft('timeout', `Instantly did not answer in ${TIMEOUT_MS}ms`);
    if (error && error.status === 401) return soft('unauthorized', error.detail || 'key rejected');
    return soft('upstream-error', String(error && error.message ? error.message : error).slice(0, 240));
  } finally {
    clearTimeout(timer);
  }
}
