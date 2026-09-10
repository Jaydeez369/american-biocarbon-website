/**
 * GET /api/summary — the daily summary, scoped to who is asking.
 *
 * WHAT IT ANSWERS: what happened today, per person, and how that compares with yesterday.
 *
 * THE SCOPE IS THE POINT, and it is enforced here rather than by hiding a tab.
 *
 *   admin, dev   every account.
 *   manager      the SDRs, plus themselves.
 *   sdr          only themselves.
 *
 * Read the REPORT_SCOPE note in _lib/authz.js for why this is a separate table from
 * CAPABILITIES. The short version: a manager and an SDR may do exactly the same things to the
 * data and must see very different reports, so "what may I do" and "whose day may I read" are
 * two questions and conflating them gives every rep a management view of their colleagues.
 *
 * The filtering happens BEFORE the rows leave the edge. A client-side filter over a full
 * payload would mean the whole team's day is sitting in every rep's browser, one devtools tab
 * away, which is not a summary page it is a leak with a nice layout.
 *
 * WHERE THE NUMBERS COME FROM, and the honest limits of each:
 *
 *   audit      per person and reliable. Every accepted CRM write carries its actor, so
 *              "Daniel edited 12 records today" is a fact, not an estimate.
 *   activity   the phone, and NOT attributable to a person. Allo sends the company line and
 *              no agent field, so calls and texts are reported as a TEAM total and labelled
 *              as such. Splitting them per rep would require inventing an attribution.
 *   leads      new phone leads in the window, team-wide, same reason.
 *
 * Anything this cannot attribute is reported as a team number with the reason attached,
 * rather than divided up or quietly dropped.
 *
 * FAILS SOFT like the other Worker-backed routes: an unreachable Worker answers ok:false with
 * a reason and a 200 so the page renders its shell and says what is missing. A 403 is NOT
 * soft, because "you may not see this" must never look like "this is briefly unavailable".
 *
 * SETUP: ALLO_EXPORT_TOKEN, plus SALES_OS_USERS to map an actor name to a role.
 */
import { requireCapability } from '../_lib/authz.js';
import { REPORTED_ON, scopeOf } from '../_lib/authz.js';
import { redact } from '../_lib/redact.js';

const DEFAULT_WORKER = 'https://allo-hooks.csopsmarketing.workers.dev';
const TIMEOUT_MS = 8000;

const soft = (reason, detail) =>
  new Response(JSON.stringify({ ok: false, reason, detail: detail || null, people: [], team: null }), {
    status: 200,
    headers: { 'Content-Type': 'application/json', 'Cache-Control': 'private, no-store' },
  });

/* The accounts, for the actor -> role map only. Deliberately a local re-parse rather than an
   import from _middleware.js: that file's parser is entangled with the login flow and the
   signed cookie, and this route needs one field off each line. Passwords are read and
   discarded, never returned; the response carries usernames, roles and display names only. */
function rolesFrom(env) {
  const raw = typeof env.SALES_OS_USERS === 'string' ? env.SALES_OS_USERS.trim() : '';
  const out = new Map();
  if (!raw) return out;
  for (const entry of raw.split(',')) {
    const line = entry.trim();
    if (!line) continue;
    const first = line.indexOf(':');
    if (first < 0) continue;
    const username = line.slice(0, first).trim().toLowerCase();
    const parts = line.slice(first + 1).split(':');
    let role = 'manager';
    let display = '';
    if (parts.length >= 3) { display = parts.pop().trim(); role = parts.pop().trim().toLowerCase(); }
    else if (parts.length === 2) { display = parts.pop().trim(); }
    if (username) out.set(username, { username, role, display: display || username });
  }
  return out;
}

const dayOf = (iso) => String(iso || '').slice(0, 10);

export async function onRequestGet(context) {
  const { env, request } = context;

  /* Everyone with a login may read a summary. WHOSE summary is decided below, and that is the
     control: `read` here would be wrong only if there were people who may use the app and may
     not see their own day, and there are not. */
  const denied = requireCapability(context, 'read');
  if (denied) return denied;

  const me = context.data.user;
  const scope = scopeOf(me);
  const accounts = rolesFrom(env);

  /* Who this caller may see. Computed from the role table, never from a query parameter: a
     `?actor=` a rep could edit would make the whole scope decorative. */
  let visible;
  if (scope === 'all') visible = null;                                  // null means no filter
  else if (scope === 'team') {
    visible = new Set([me.username.toLowerCase()]);
    for (const a of accounts.values()) if (REPORTED_ON.includes(a.role)) visible.add(a.username);
  } else visible = new Set([me.username.toLowerCase()]);

  const token = typeof env.ALLO_EXPORT_TOKEN === 'string' ? env.ALLO_EXPORT_TOKEN.trim() : '';
  if (!token) return soft('not-configured', 'ALLO_EXPORT_TOKEN is unset on this deployment');
  const base = (typeof env.ALLO_HOOKS_URL === 'string' && env.ALLO_HOOKS_URL.trim()) || DEFAULT_WORKER;

  const url = new URL(request.url);
  /* The day being reported on, as an ISO date. Defaults to today in UTC, which is stated in
     the response so a reader in Louisiana knows a late evening call may land on tomorrow's
     summary. Guessing the viewer's timezone here and getting it wrong would silently move
     work between days, which is worse than one labelled convention. */
  const day = /^\d{4}-\d{2}-\d{2}$/.test(url.searchParams.get('day') || '')
    ? url.searchParams.get('day')
    : new Date().toISOString().slice(0, 10);
  const prior = new Date(Date.parse(`${day}T00:00:00Z`) - 86400000).toISOString().slice(0, 10);

  const abort = new AbortController();
  const timer = setTimeout(() => abort.abort(), TIMEOUT_MS);
  const get = async (path) => {
    const r = await fetch(`${base}${path}`, { headers: { 'x-export-token': token }, signal: abort.signal });
    if (!r.ok) throw new Error(`worker returned ${r.status} for ${path}`);
    return r.json();
  };

  let audit, feed;
  try {
    /* 500 audit rows is the route's cap and covers well over a fortnight at the current write
       rate. If it ever truncates, `truncated` below says so rather than the summary quietly
       reporting a short day. */
    [audit, feed] = await Promise.all([get('/crm/audit?limit=500'), get('/export?limit=1000')]);
  } catch (error) {
    return soft(abort.signal.aborted ? 'timeout' : 'unreachable', redact(error, env));
  } finally {
    clearTimeout(timer);
  }

  const auditRows = Array.isArray(audit.rows) ? audit.rows : [];
  const activity = Array.isArray(feed.activity) ? feed.activity : [];

  /* ---- per person, from the audit trail ---- */
  const blank = () => ({ writes: 0, creates: 0, edits: 0, deletes: 0, entities: {} });
  const people = new Map();
  const bucket = (actor, when) => {
    const key = (actor || '').toLowerCase();
    if (visible && !visible.has(key)) return null;
    if (!people.has(key)) {
      const acct = accounts.get(key);
      people.set(key, {
        actor: actor || null,
        display: acct ? acct.display : (actor || 'unattributed'),
        role: acct ? acct.role : null,
        today: blank(), yesterday: blank(),
      });
    }
    const p = people.get(key);
    return when === day ? p.today : when === prior ? p.yesterday : null;
  };
  for (const r of auditRows) {
    const b = bucket(r.actor, dayOf(r.at));
    if (!b) continue;
    b.writes++;
    if (r.action === 'delete') b.deletes++;
    else if (r.action === 'patch') b.edits++;
    else b.creates++;
    const ent = r.kind ? `${r.entity}:${r.kind}` : r.entity;
    b.entities[ent] = (b.entities[ent] || 0) + 1;
  }

  /* Everyone who MAY be seen appears, including people who did nothing. A summary that omits
     a quiet rep reads as "no data" rather than "no work", and those are different findings. */
  for (const a of accounts.values()) {
    const key = a.username;
    if (visible && !visible.has(key)) continue;
    if (scope === 'team' && !REPORTED_ON.includes(a.role) && key !== me.username.toLowerCase()) continue;
    if (!people.has(key)) {
      people.set(key, { actor: a.username, display: a.display, role: a.role, today: blank(), yesterday: blank() });
    } else {
      people.get(key).role = a.role;
      people.get(key).display = a.display;
    }
  }

  /* ---- the team's phone day, which cannot be attributed to a person ---- */
  const inDay = (iso, d) => dayOf(iso) === d;
  const countKinds = (d) => {
    const rows = activity.filter((a) => inDay(a.occurred_at, d));
    const of = (k, dir) => rows.filter((a) => a.kind === k && (!dir || a.direction === dir)).length;
    return {
      calls: of('call'), callsIn: of('call', 'INBOUND'), callsOut: of('call', 'OUTBOUND'),
      texts: of('sms'), textsIn: of('sms', 'INBOUND'), textsOut: of('sms', 'OUTBOUND'),
      summaries: of('summary'),
      minutes: Math.round(rows.filter((a) => a.kind === 'call')
        .reduce((t, a) => t + (Number(a.duration_min) || 0), 0)),
    };
  };

  return new Response(JSON.stringify({
    ok: true,
    day, prior,
    /* Stated so the page can label itself rather than implying a precision it lacks. */
    timezone: 'UTC',
    me: { username: me.username, display: me.display, role: me.role },
    scope,
    scopeNote: scope === 'all' ? 'Every account.'
      : scope === 'team' ? 'You and the SDRs.'
      : 'Your own day only.',
    people: [...people.values()].sort((a, b) => b.today.writes - a.today.writes
      || String(a.display).localeCompare(String(b.display))),
    team: {
      today: countKinds(day), yesterday: countKinds(prior),
      /* The limitation, carried in the payload rather than written into the template, so any
         other consumer of this route inherits it instead of rediscovering it. */
      attributable: false,
      note: 'Calls and texts are a team total. Allo sends the company line and no agent field, so there is nothing to attribute them to.',
    },
    truncated: auditRows.length >= 500,
  }), { headers: { 'Content-Type': 'application/json', 'Cache-Control': 'private, no-store' } });
}
