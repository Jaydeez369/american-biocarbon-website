/**
 * POST /api/prospect — create ONE prospect in Allo CRM from the Sales OS.
 *
 * THE ONLY WRITE ROUTE ON THIS PROJECT, and it should stay that way. /api/allo,
 * /api/instantly and /api/apollo are read-only because each reads a system that is
 * authoritative somewhere else, and a dashboard that can mutate those is a second source of
 * truth waiting to disagree with the first. Allo CRM is the exception: nothing else owns it,
 * and without this a rep types the same name into two systems and one of them rots.
 *
 * WHAT KEEPS THE BLAST RADIUS SMALL
 *   One person per request. No bulk, no import, no CSV.
 *   Creates only. No DELETE is reachable from here even though the key holds CRM_DELETE, and
 *     no route here can touch a campaign, a dialer queue or a call flow.
 *   The number is validated as NANP before anything is created, so the +91 mobile that
 *     reached the Power Dialer on 2026-08-28 cannot be added by hand either.
 *   Reads the record back and returns what Allo actually stored, because on this API a 200
 *     is not evidence that a field was kept — that is the exact failure that made every
 *     dialer card say "Job & company unknown".
 *
 * GATED. functions/_middleware.js verifies the session cookie before next() routes here, so
 * an unauthenticated request never reaches this file and the API key never leaves the edge.
 *
 * FAILS LOUD, unlike the read routes. A read that fails soft leaves a dated snapshot on
 * screen and that is strictly better than an error. A create that fails soft would tell
 * somebody their prospect is in Allo when it is not, so every failure here returns ok:false
 * with the step it died on.
 *
 * SETUP (Cloudflare Pages > cs-ops-sales-os > Settings > Variables and secrets):
 *   ALLO_API_KEY   secret. The same key that is in .env. Needs CRM_WRITE and NOTES_WRITE;
 *                  CRM_READ is what makes the read-back possible. It does NOT need
 *                  CRM_DELETE for this route.
 *
 * Until ALLO_API_KEY is set this answers ok:false, reason:"not-configured" and the button
 * says so on screen rather than appearing to work.
 */

import { createProspect, readBack, validate } from '../_lib/prospect.js';

const API = 'https://api.withallo.com';
const TIMEOUT_MS = 12000; // three sequential writes on a cold edge, still bounded

const json = (body, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json', 'Cache-Control': 'private, no-store' },
  });

export async function onRequestPost(context) {
  const { env, request } = context;

  const key = typeof env.ALLO_API_KEY === 'string' ? env.ALLO_API_KEY.trim() : '';
  if (!key) return json({ ok: false, reason: 'not-configured', error: 'ALLO_API_KEY is unset on this deployment' });

  let input;
  try {
    input = await request.json();
  } catch {
    return json({ ok: false, reason: 'bad-request', error: 'body was not JSON' }, 400);
  }

  /* Validated before a single call goes out, so a bad number costs nothing and creates no
     orphan company. The client validates too; this is the copy that counts. */
  const v = validate(input);
  if (v.errors.length) return json({ ok: false, reason: 'invalid', error: v.errors.join('; ') }, 400);

  const abort = new AbortController();
  const timer = setTimeout(() => abort.abort(), TIMEOUT_MS);

  const call = async (method, path, body) => {
    const res = await fetch(`${API}${path}`, {
      method,
      headers: { Authorization: key, 'Content-Type': 'application/json' },
      body: body ? JSON.stringify(body) : undefined,
      signal: abort.signal,
    });
    let parsed = {};
    try { parsed = await res.json(); } catch { /* some 204s and error pages are not JSON */ }
    return { status: res.status, json: parsed };
  };

  try {
    const result = await createProspect(call, input, {
      product: input.product || 'Absorbent Crumble. Coarse granular cellulosic, for oil and large-area, high-volume spills.',
      ask: input.ask || 'a free sample, then a truckload.',
      opener: input.opener || '',
      icp: input.icp || '',
      note: input.note || '',
      today: new Date().toISOString().slice(0, 10),
    });

    if (!result.ok) return json({ ok: false, reason: 'allo-rejected', ...result });

    /* The read-back is the point of the route, not a nicety. Report it even when it fails:
       "created but could not be re-read" is a different state from "created". */
    const stored = await readBack(call, result.personId);

    return json({
      ok: true,
      personId: result.personId,
      companyId: result.companyId,
      reused: result.reused,
      e164: result.e164,
      noteOk: result.noteOk,
      steps: result.steps,
      stored,
      createdAt: new Date().toISOString(),
    });
  } catch (error) {
    return json({
      ok: false,
      reason: abort.signal.aborted ? 'timeout' : 'unreachable',
      error: String(error).slice(0, 300),
    }, 502);
  } finally {
    clearTimeout(timer);
  }
}

/* A GET here is almost always somebody opening the URL in a tab to see if it works. Say what
   it is rather than returning the project's 404 page, which reads as "the route is missing". */
export function onRequestGet() {
  return json({
    ok: false,
    reason: 'method',
    error: 'POST a prospect to this route. It creates one person in Allo CRM and reads it back.',
  }, 405);
}
