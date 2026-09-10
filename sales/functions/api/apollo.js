/**
 * GET /api/apollo — the only thing about Apollo that can honestly be read live.
 *
 * Read this before extending it. The short version is that "live Apollo" is a much smaller
 * idea than "live Instantly", and pretending otherwise would put a made-up number on a
 * screen people make spending decisions from.
 *
 * WHAT THIS CANNOT DO, AND WHY
 *
 * Apollo exposes no credit-balance or usage endpoint to this key. Probed 2026-08-24:
 *
 *   GET /v1/auth/health                  200  {"healthy":true,"is_logged_in":true}
 *   GET /v1/usage_stats/api_usage_stats  404
 *   GET /v1/credit_usage                 404
 *   GET /v1/users/me                     422  "me is not a valid ID"     <- an ID lookup
 *   GET /v1/accounts/usage               422  "usage is not a valid ID"  <- an ID lookup
 *
 * The last two are data-retrieval routes being handed a bad id, not usage endpoints, and
 * they were not probed further. So the credit numbers on the Launchpad come from our own
 * reveal receipts, counted at snapshot time into apollo-data.js, and this route reports only
 * what is genuinely live: whether the key still works.
 *
 * That is worth having. A rotated, revoked or expired key is invisible until the next reveal
 * run fails, and this turns it into something the dashboard says out loud.
 *
 * KNOWN GAP, stated rather than papered over: receipt counting cannot see credits spent
 * outside our scripts — anyone using the Apollo web UI spends from the same balance and
 * leaves no receipt here. Apollo gives us no way to detect that. If the written ceiling and
 * the real balance ever diverge, that is the reason.
 *
 * SPENDS NOTHING. One GET to /v1/auth/health, which is free and returns no data. The billable
 * endpoints are /people/match and its bulk variants; neither appears in this file, and item
 * 03 on the Aug 20 list gates the next tranche behind Victor's review, so a dashboard refresh
 * must never be able to spend. Keep it that way.
 *
 * SETUP (Cloudflare Pages > cs-ops-sales-os > Settings > Variables and secrets):
 *   APOLLO_API_KEY   secret. The same key that is in .env.
 */

import { redact } from '../_lib/redact.js';

const HEALTH = 'https://api.apollo.io/api/v1/auth/health';
const TIMEOUT_MS = 6000;

const soft = (reason, detail) =>
  new Response(JSON.stringify({ ok: false, reason, detail: detail || null }), {
    status: 200,
    headers: { 'Content-Type': 'application/json', 'Cache-Control': 'private, no-store' },
  });

export async function onRequestGet(context) {
  const { env } = context;

  const key = typeof env.APOLLO_API_KEY === 'string' ? env.APOLLO_API_KEY.trim() : '';
  if (!key) return soft('not-configured', 'APOLLO_API_KEY is unset on this deployment');

  const abort = new AbortController();
  const timer = setTimeout(() => abort.abort(), TIMEOUT_MS);

  let res;
  try {
    /* GET, not POST. POST to this path 404s, which parses as nothing and reads like a dead
       key rather than a wrong verb — it cost a debugging round the first time. */
    res = await fetch(HEALTH, { headers: { 'x-api-key': key }, signal: abort.signal });
  } catch (error) {
    return soft(abort.signal.aborted ? 'timeout' : 'unreachable', redact(error, env));
  } finally {
    clearTimeout(timer);
  }

  if (res.status === 401 || res.status === 403) {
    return new Response(JSON.stringify({
      ok: true,
      source: 'live',
      checkedAt: new Date().toISOString(),
      keyValid: false,
      keyDetail: `Apollo rejected the key (${res.status}). It has been rotated, revoked or expired.`,
      spendsCredits: false,
    }), { headers: { 'Content-Type': 'application/json', 'Cache-Control': 'private, no-store' } });
  }
  if (!res.ok) return soft('upstream-error', `apollo returned ${res.status}`);

  let body;
  try { body = await res.json(); } catch { return soft('bad-payload', 'health did not return JSON'); }

  const valid = body && body.is_logged_in === true;
  return new Response(JSON.stringify({
    ok: true,
    source: 'live',
    checkedAt: new Date().toISOString(),
    keyValid: valid,
    keyDetail: valid ? 'key valid' : JSON.stringify(body).slice(0, 160),
    healthy: body && body.healthy === true,
    spendsCredits: false,
    /* Deliberately absent: any credit figure. Apollo will not tell us, and the snapshot in
       apollo-data.js is the honest source for spend. */
    creditsNote: 'Apollo exposes no credit balance to this key. Spend figures come from our own reveal receipts in apollo-data.js.',
  }), { headers: { 'Content-Type': 'application/json', 'Cache-Control': 'private, no-store' } });
}
