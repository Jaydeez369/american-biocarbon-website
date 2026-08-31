/**
 * The shared-store proxy, in one place, because /api/deal and /api/contact are the same route
 * pointed at two tables and duplicating them would guarantee they drift.
 *
 * WHY A PROXY AT ALL. The store lives on the allo-hooks Worker, which holds the D1 binding and
 * the export token. The browser cannot hold that token — it is a static page served to
 * whoever logs in — so the Sales OS calls its OWN origin and this function adds the credential
 * on the edge. Same shape as /api/allo, and the same two consequences:
 *
 *   NO CORS. Same origin, so the Worker needs no allow-list and adding this makes nothing on
 *   it reachable from any other site.
 *
 *   NO SECOND LOGIN. functions/_middleware.js verifies the session cookie before next() routes
 *   here, so an unauthenticated request never reaches this file.
 *
 * FAIL-SOFT ON READ, FAIL-LOUD ON WRITE. This is the one place the two halves differ, and the
 * split is deliberate:
 *
 *   A GET that cannot reach the Worker returns ok:false with a reason and a 200. The browser
 *   still holds its localStorage copy, so the pipeline renders exactly as it did before this
 *   feature existed. A dashboard that goes blank because a dependency blinked is worse than a
 *   dashboard that is briefly a few minutes stale.
 *
 *   A POST/PATCH/DELETE that fails returns the real failure. The browser has already written
 *   to localStorage by the time it calls this, so nothing the rep typed is lost either way —
 *   but telling the client "saved" when the shared store rejected it is how one browser ends
 *   up quietly holding the only copy of a deal again, which is the entire defect this feature
 *   exists to close.
 *
 * SETUP (Cloudflare Pages > cs-ops-sales-os > Settings > Variables and secrets):
 *   ALLO_EXPORT_TOKEN   secret. Must be the SAME value as EXPORT_TOKEN on the allo-hooks
 *                       Worker. These two drifted apart once and the only symptom was a
 *                       permanently empty live activity row, so if a route here 401s that is
 *                       the first thing to check.
 *   ALLO_HOOKS_URL      optional override of the Worker URL.
 */

const DEFAULT_WORKER = 'https://allo-hooks.csopsmarketing.workers.dev';

/* A write is three sequential steps on a cold edge; a read is one D1 query. Both are bounded
   well under the point where a rep assumes the button did nothing and clicks it again. */
const TIMEOUT_MS = 8000;

const json = (body, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json', 'Cache-Control': 'private, no-store' },
  });

/**
 * @param {object} context  the Pages Function context
 * @param {'deals'|'contacts'} kind  which table this route fronts
 */
export async function proxyCrm(context, kind) {
  const { env, request } = context;
  const method = request.method.toUpperCase();
  const isRead = method === 'GET';

  const token = typeof env.ALLO_EXPORT_TOKEN === 'string' ? env.ALLO_EXPORT_TOKEN.trim() : '';
  if (!token) {
    /* Unset is a normal pre-go-live state for a read and a hard stop for a write. Saying
       "not-configured" either way lets the client show the same honest message. */
    return json({ ok: false, reason: 'not-configured', error: 'ALLO_EXPORT_TOKEN is unset on this deployment' }, isRead ? 200 : 503);
  }

  const base = (typeof env.ALLO_HOOKS_URL === 'string' && env.ALLO_HOOKS_URL.trim()) || DEFAULT_WORKER;
  const incoming = new URL(request.url);
  const target = new URL(`${base}/crm/${kind}`);

  /* Only `id` is forwarded, and only for DELETE. Passing the caller's whole query string
     through would let a bookmark reach any parameter the Worker ever adds. */
  const id = incoming.searchParams.get('id');
  if (id) target.searchParams.set('id', id);

  let body;
  if (method === 'POST' || method === 'PATCH') {
    try {
      body = JSON.stringify(await request.json());
    } catch {
      return json({ ok: false, reason: 'bad-request', error: 'body was not JSON' }, 400);
    }
  }

  const abort = new AbortController();
  const timer = setTimeout(() => abort.abort(), TIMEOUT_MS);

  let upstream;
  try {
    upstream = await fetch(target.toString(), {
      method,
      headers: { 'x-export-token': token, 'Content-Type': 'application/json' },
      body,
      signal: abort.signal,
    });
  } catch (error) {
    const reason = abort.signal.aborted ? 'timeout' : 'unreachable';
    return json({ ok: false, reason, error: String(error).slice(0, 200) }, isRead ? 200 : 502);
  } finally {
    clearTimeout(timer);
  }

  let data;
  try {
    data = await upstream.json();
  } catch {
    return json({ ok: false, reason: 'bad-payload', error: 'the store did not return JSON' }, isRead ? 200 : 502);
  }

  if (!upstream.ok) {
    const reason = upstream.status === 401 ? 'unauthorized' : 'upstream-error';
    /* A read never surfaces an error status — the page keeps its local copy. A write passes
       the real status through so the client can tell a rejected record from a dead dependency. */
    return json({ ok: false, reason, status: upstream.status, error: data?.error || `store returned ${upstream.status}` },
      isRead ? 200 : upstream.status);
  }

  return json({ ...data, ok: true, fetchedAt: new Date().toISOString() });
}
