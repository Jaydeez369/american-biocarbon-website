/**
 * GET /api/audit — who changed what.
 *
 * THE GAP THIS CLOSES. Stage 1 made every CRM write leave a row in the D1 `audit` table:
 * the actor, the action, the entity, the field names. 190 rows by the time this shipped, and
 * not one line of code anywhere read them back. A trail nobody can read is a trail that does
 * not exist, and the first time anyone would have discovered that is the day they needed it.
 *
 * TWO AUDIENCES, TWO PERMISSIONS, and the split is the whole design of this file.
 *
 *   Scoped, ?entity=&entityId=      needs `read`. This is the last few writes on ONE record,
 *                                   rendered on the account profile. Anyone who may see the
 *                                   record may see who last touched it: the alternative is a
 *                                   rep looking at a field that changed under them with no
 *                                   way to find out who changed it, which is the ordinary
 *                                   working question this table was filled to answer.
 *
 *   Unscoped, everything else       needs `admin`. The whole log across every record is a
 *                                   different object: it is a record of what each colleague
 *                                   did all day. That is a management view, and handing it to
 *                                   every login by default would be a surveillance capability
 *                                   nobody asked for.
 *
 * The line is drawn at scope rather than at content because the ROWS ARE THE SAME rows. What
 * differs is whether you are asking about a customer or about a person.
 *
 * NEVER PROXIES A WRITE. GET only, and the Worker refuses anything else on its side as well.
 * Two independent refusals for a table whose entire value is that it cannot be edited.
 *
 * FAILS SOFT, like /api/activity and /api/allo: an unreachable Worker answers ok:false with a
 * reason and a 200, and the account profile renders the record it always had, minus the
 * history strip. A 403 is NOT soft and comes back as a 403, because "you may not see this"
 * and "this is temporarily unavailable" must never render as the same thing.
 *
 * SETUP: ALLO_EXPORT_TOKEN, same value as EXPORT_TOKEN on the allo-hooks Worker.
 */
import { requireCapability } from '../_lib/authz.js';

const DEFAULT_WORKER = 'https://allo-hooks.csopsmarketing.workers.dev';
const TIMEOUT_MS = 6000;

const soft = (reason, detail) =>
  new Response(JSON.stringify({ ok: false, reason, detail: detail || null, rows: [], actors: [] }), {
    status: 200,
    headers: { 'Content-Type': 'application/json', 'Cache-Control': 'private, no-store' },
  });

export async function onRequestGet(context) {
  const { env, request } = context;
  const url = new URL(request.url);

  const entity = (url.searchParams.get('entity') || '').trim();
  const entityId = (url.searchParams.get('entityId') || '').trim();
  /* BOTH are required for a scoped read, not either. `entity=deals` alone is every write to
     every deal, which is the management view wearing a scope's clothes. */
  const scoped = Boolean(entity && entityId);

  const denied = requireCapability(context, scoped ? 'read' : 'admin');
  if (denied) return denied;

  const token = typeof env.ALLO_EXPORT_TOKEN === 'string' ? env.ALLO_EXPORT_TOKEN.trim() : '';
  if (!token) return soft('not-configured', 'ALLO_EXPORT_TOKEN is unset on this deployment');

  const base = (typeof env.ALLO_HOOKS_URL === 'string' && env.ALLO_HOOKS_URL.trim()) || DEFAULT_WORKER;

  const asked = Number(url.searchParams.get('limit') || (scoped ? 12 : 100));
  const limit = Math.min(Math.max(Number.isFinite(asked) ? asked : 100, 1), 500);

  /* Rebuilt from validated parts rather than forwarded. The caller's query string is not
     passed through to the Worker: an unrecognised parameter should be dropped here, not
     interpreted there, and this way the set of things the edge can ask for is the set of
     things written on this line. */
  const qs = new URLSearchParams({ limit: String(limit) });
  if (scoped) { qs.set('entity', entity); qs.set('entityId', entityId); }
  const actor = (url.searchParams.get('actor') || '').trim();
  if (!scoped && actor) qs.set('actor', actor);

  const abort = new AbortController();
  const timer = setTimeout(() => abort.abort(), TIMEOUT_MS);

  let upstream;
  try {
    upstream = await fetch(`${base}/crm/audit?${qs}`, {
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

  return new Response(JSON.stringify({
    ok: true,
    scoped,
    /* Echoed so the browser can label the view with the permission it was served under
       rather than guessing from what came back. An admin reading one record's history gets
       scoped:true here, which is correct: that is the request that was made. */
    rows: Array.isArray(data.rows) ? data.rows : [],
    actors: scoped ? [] : (Array.isArray(data.actors) ? data.actors : []),
    filter: data.filter || null,
    fetchedAt: new Date().toISOString(),
  }), {
    headers: { 'Content-Type': 'application/json', 'Cache-Control': 'private, no-store' },
  });
}
