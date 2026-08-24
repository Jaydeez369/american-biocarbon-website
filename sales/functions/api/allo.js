/**
 * GET /api/allo — live call activity for the Sales OS Launchpad.
 *
 * This is the one place the Sales OS stops being a static site.
 *
 * Everything else on the page is a dated snapshot written ahead of time, because a page
 * served to a browser cannot hold an API key. That constraint is real, but it does not apply
 * here: this is a Pages Function, so it runs on Cloudflare's edge, server side, and the token
 * never leaves it. The browser calls its own origin and gets JSON back.
 *
 * Two consequences worth stating, because they are why this route can exist at all:
 *
 *   NO CORS. Same origin. The Worker needs no Access-Control headers and no allow-list, so
 *   nothing about it becomes reachable from any other site by adding this.
 *
 *   NO SECOND LOGIN. functions/_middleware.js gates every path on this project and only calls
 *   next() once the session cookie verifies, and next() is what routes here. An
 *   unauthenticated request never reaches this file, so the export token is protected by the
 *   same password that protects the roster and the price floors.
 *
 * FAILS SOFT, ALWAYS. If the token is unset, the Worker is down, or the fetch times out, this
 * returns a body with `ok:false` and a reason — never a 500 and never a hang. The Launchpad
 * keeps rendering the phone snapshot it already has and simply does not show the live row.
 * A dashboard that breaks because a dependency blinked is worse than one that is briefly a
 * few hours stale, and the snapshot is right there.
 *
 * SETUP (Cloudflare Pages > cs-ops-sales-os > Settings > Variables and secrets):
 *   ALLO_EXPORT_TOKEN   secret. The EXPORT_TOKEN value that scripts/deploy.sh generated and
 *                       set on the allo-hooks Worker. Read it with:
 *                         npx wrangler secret list --name allo-hooks
 *                       (the value itself is only visible where it was generated; if it was
 *                       lost, re-run allo-hooks/scripts/deploy.sh to mint a new one and set
 *                       the same value in both places)
 *   ALLO_HOOKS_URL      optional. Defaults to the deployed Worker below.
 *
 * Until ALLO_EXPORT_TOKEN is set this route answers `ok:false, reason:"not-configured"` and
 * the page is exactly as it was. Setting it is the whole go-live step.
 */

const DEFAULT_WORKER = 'https://allo-hooks.csopsmarketing.workers.dev';

/* Long enough for a cold Worker and a D1 read, short enough that a wedged dependency cannot
   hold a Launchpad render open. The client gives up before this anyway. */
const TIMEOUT_MS = 6000;

const soft = (reason, detail) =>
  new Response(JSON.stringify({ ok: false, reason, detail: detail || null }), {
    status: 200, // deliberately not an error status: this is a normal, expected state
    headers: { 'Content-Type': 'application/json', 'Cache-Control': 'private, no-store' },
  });

export async function onRequestGet(context) {
  const { env, request } = context;

  const token = typeof env.ALLO_EXPORT_TOKEN === 'string' ? env.ALLO_EXPORT_TOKEN.trim() : '';
  if (!token) return soft('not-configured', 'ALLO_EXPORT_TOKEN is unset on this deployment');

  const base = (typeof env.ALLO_HOOKS_URL === 'string' && env.ALLO_HOOKS_URL.trim()) || DEFAULT_WORKER;

  /* Clamped, not trusted. The caller is authenticated, but a stray ?limit=100000 in a bookmark
     should not turn a dashboard tile into a full table scan of D1. */
  const asked = Number(new URL(request.url).searchParams.get('limit') || 50);
  const limit = Math.min(Math.max(Number.isFinite(asked) ? asked : 50, 1), 200);

  const abort = new AbortController();
  const timer = setTimeout(() => abort.abort(), TIMEOUT_MS);

  let upstream;
  try {
    upstream = await fetch(`${base}/export?limit=${limit}`, {
      headers: { 'x-export-token': token },
      signal: abort.signal,
    });
  } catch (error) {
    return soft(abort.signal.aborted ? 'timeout' : 'unreachable', String(error).slice(0, 200));
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

  /* Reshape here rather than in the page. The Launchpad wants counts it can put in tiles; the
     raw activity rows carry contact numbers and call summaries, and there is no reason to ship
     those into a browser to render four numbers. Only the last few are passed through, for the
     "most recent call" line, and the number is already visible to anyone with this login. */
  const activity = Array.isArray(data.activity) ? data.activity : [];
  const counts = Array.isArray(data.counts) ? data.counts : [];

  const tally = (predicate) => counts.filter(predicate).reduce((n, c) => n + (Number(c.n) || 0), 0);

  return new Response(JSON.stringify({
    ok: true,
    source: 'allo-hooks D1, live',
    fetchedAt: new Date().toISOString(),
    snapshotAt: data.snapshot || null,
    total: tally(() => true),
    inbound: tally((c) => c.direction === 'INBOUND'),
    outbound: tally((c) => c.direction === 'OUTBOUND'),
    calls: tally((c) => c.kind === 'call'),
    messages: tally((c) => c.kind === 'sms' || c.kind === 'message'),
    missed: activity.filter((a) => a.result && /MISSED|VOICEMAIL|NO_ANSWER|FAILED|TRANSFERRED_AI/i.test(a.result)).length,
    policyFlags: activity.filter((a) => a.policy_flag).length,
    counts,
    recent: activity.slice(0, 5).map((a) => ({
      at: a.occurred_at,
      kind: a.kind,
      direction: a.direction,
      who: a.contact_name || a.company || a.contact_number || null,
      result: a.result || null,
      minutes: a.duration_min ?? null,
    })),
  }), {
    headers: { 'Content-Type': 'application/json', 'Cache-Control': 'private, no-store' },
  });
}
