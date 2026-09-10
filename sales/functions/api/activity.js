/**
 * GET /api/activity — the phone's return path into the Sales OS.
 *
 * THE GAP THIS CLOSES. Every call, text, tag and AI summary the phone system produced has been
 * landing in the allo-hooks D1 `activity` table since 2026-08-19 — 329 rows by the time this
 * was written. None of it was reachable from the Sales OS. The consumer that writes those rows
 * carries a comment pointing at `scripts/export-activity.mjs`, a snapshot generator that was
 * never written, so the account timelines showed the notes people typed and nothing the phone
 * knew. A rep opening an account could not see that it had called them twice.
 *
 * WHY LIVE RATHER THAN A SNAPSHOT FILE. A generated pipeline-data.js would need a rebuild and
 * a deploy to show a call that happened ten minutes ago, and would be stale in exactly the
 * situation where it matters — someone opening an account because the phone just rang. This
 * route reads D1 through the Worker on every request, so the feed is as current as the
 * webhook. It costs one D1 query behind an authenticated edge call.
 *
 * FAILS SOFT, like /api/allo and for the same reason. If the Worker is down or the token is
 * unset this answers ok:false with a reason and a 200, and the account timeline renders the
 * notes it always had. The phone history simply does not appear. Losing the live row is a
 * smaller harm than an account page that will not open.
 *
 * WHAT IT DELIBERATELY DOES NOT DO: match rows to accounts. That happens in pipeline.js, in
 * the browser, using the same norm()/canon key the rest of the pipeline uses to decide two
 * spellings are one account. Doing it here would mean a second, subtly different notion of
 * account identity living on the edge — and a call landing on a duplicate account is exactly
 * the bug that produces two half-true timelines for one customer.
 *
 * SETUP: ALLO_EXPORT_TOKEN, same value as EXPORT_TOKEN on the allo-hooks Worker.
 */

import { redact } from '../_lib/redact.js';

const DEFAULT_WORKER = 'https://allo-hooks.csopsmarketing.workers.dev';
const TIMEOUT_MS = 6000;

const soft = (reason, detail) =>
  new Response(JSON.stringify({ ok: false, reason, detail: detail || null, rows: [] }), {
    status: 200, // a normal, expected state — not an error
    headers: { 'Content-Type': 'application/json', 'Cache-Control': 'private, no-store' },
  });

/* The `contact` kind is 273 of the 329 rows and carries no phone number and no timeline value:
   it records that a CRM record was created, which the Sales OS already knows because it is the
   thing that created it. Shipping those into the browser would be 80% of the payload to render
   nothing. Calls, texts and summaries are what an account timeline is for. */
const TIMELINE_KINDS = new Set(['call', 'sms', 'summary', 'tag']);

/* Digits only, last ten. Allo has handed us +1XXXXXXXXXX, 1XXXXXXXXXX and (225) 398-9286 for
   the same line across topics, and a timeline that missed a call because of a formatting
   difference would look exactly like a timeline with no calls. Ten digits is the NANP identity
   and the only part worth matching on. */
function phoneKey(raw) {
  const digits = String(raw || '').replace(/[^\d]/g, '');
  if (digits.length < 10) return '';
  return digits.slice(-10);
}

export async function onRequestGet(context) {
  const { env, request } = context;

  const token = typeof env.ALLO_EXPORT_TOKEN === 'string' ? env.ALLO_EXPORT_TOKEN.trim() : '';
  if (!token) return soft('not-configured', 'ALLO_EXPORT_TOKEN is unset on this deployment');

  const base = (typeof env.ALLO_HOOKS_URL === 'string' && env.ALLO_HOOKS_URL.trim()) || DEFAULT_WORKER;

  /* Clamped, not trusted: an authenticated caller is still a caller, and a stray ?limit in a
     bookmark should not turn an account page into a full scan of the event log. */
  const asked = Number(new URL(request.url).searchParams.get('limit') || 500);
  const limit = Math.min(Math.max(Number.isFinite(asked) ? asked : 500, 1), 1000);

  const abort = new AbortController();
  const timer = setTimeout(() => abort.abort(), TIMEOUT_MS);

  let upstream;
  try {
    upstream = await fetch(`${base}/export?limit=${limit}`, {
      headers: { 'x-export-token': token },
      signal: abort.signal,
    });
  } catch (error) {
    return soft(abort.signal.aborted ? 'timeout' : 'unreachable', redact(error, env));
  } finally {
    clearTimeout(timer);
  }

  if (upstream.status === 401) return soft('unauthorized', 'the Worker rejected ALLO_EXPORT_TOKEN');
  if (!upstream.ok) return soft('upstream-error', `worker returned ${upstream.status}`);

  let data;
  try {
    data = await upstream.json();
  } catch {
    return soft('bad-payload', 'the Worker did not return JSON');
  }

  const activity = Array.isArray(data.activity) ? data.activity : [];

  const rows = activity
    .filter((a) => TIMELINE_KINDS.has(a.kind))
    .map((a) => ({
      at: a.occurred_at,
      kind: a.kind,
      direction: a.direction || null,
      number: a.contact_number || null,
      /* Precomputed so the browser matches on the same key this route filtered on. Two
         normalisers for one join is how a call ends up on nobody's timeline. */
      key: phoneKey(a.contact_number),
      who: a.contact_name || null,
      company: a.company || null,
      line: a.allo_number || null,
      minutes: a.duration_min ?? null,
      result: a.result || null,
      tags: Array.isArray(a.tags) ? a.tags : [],
      summary: a.summary || null,
      policyFlag: a.policy_flag || null,
    }));

  return new Response(JSON.stringify({
    ok: true,
    source: 'allo-hooks D1, live',
    fetchedAt: new Date().toISOString(),
    snapshotAt: data.snapshot || null,
    total: rows.length,
    /* Every distinct number in the feed, so the client can decide what it can match before it
       walks the rows. Cheap here, and it makes an empty timeline diagnosable: numbers present
       but nothing matched is a matching bug, numbers absent is genuinely no traffic. */
    numbers: [...new Set(rows.map((r) => r.key).filter(Boolean))],
    rows,
  }), {
    headers: { 'Content-Type': 'application/json', 'Cache-Control': 'private, no-store' },
  });
}
