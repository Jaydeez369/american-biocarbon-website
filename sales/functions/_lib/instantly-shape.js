/**
 * The one place the Instantly workspace is turned into the object the Sales OS renders.
 *
 * Two callers, deliberately:
 *
 *   sales-department/instantly-analytics/build-instantly-snapshot.mjs   writes instantly-data.js
 *   sales/functions/api/instantly.js                                    serves it live
 *
 * They must produce the identical shape or the page renders one way on a cold load and
 * another way a second later when the live read lands. Duplicating this in both would
 * guarantee that drift eventually, so the generator imports this file across the repo
 * boundary rather than keeping its own copy. If that import ever breaks, fix the import —
 * do not paste the logic back.
 *
 * Pure. No network, no filesystem, no globals. Give it the three API payloads and it returns
 * the object; that is what makes it testable from Node and runnable on the edge unchanged.
 */

const STATUS = { 0: 'draft', 1: 'live', 2: 'paused', 3: 'completed', '-1': 'unmanageable' };
const AI_SDR = /^\[AI SDR\]/;

/**
 * @param {object[]} campaigns  GET /campaigns?limit=100  -> .items
 * @param {object[]} analytics  GET /campaigns/analytics
 * @param {object[]} accounts   GET /accounts?limit=100   -> .items
 * @param {object}   meta       { source: 'snapshot' | 'live', at: Date }
 */
export function shapeInstantly(campaigns, analytics, accounts, meta = {}) {
  const byId = Object.fromEntries((analytics || []).map((a) => [a.campaign_id, a]));

  /* The AI SDR shell is unmanageable (status -1) and cannot send. Counted separately so
     "in the workspace" never quietly includes a campaign nobody can use. */
  const real = (campaigns || []).filter((c) => !AI_SDR.test(c.name));
  const live = real.filter((c) => c.status === 1);
  const paused = real.filter((c) => c.status === 2);
  const drafts = real.filter((c) => c.status === 0);

  const lineOf = (c) =>
    (c.name.replace(/^DO NOT LAUNCH · /, '').startsWith('AB.') ? 'absorbent' : 'biochar');
  const sum = (list, key) => list.reduce((n, c) => n + (byId[c.id]?.[key] || 0), 0);

  const totals = (list) => ({
    campaigns: list.length,
    leads: sum(list, 'leads_count'),
    contacted: sum(list, 'contacted_count'),
    sent: sum(list, 'emails_sent_count'),
    replies: sum(list, 'reply_count_unique'),
    bounced: sum(list, 'bounced_count'),
    unsubscribed: sum(list, 'unsubscribed_count'),
  });

  /* A draft with leads loaded is one operator click from sending. A draft with none cannot
     fire whatever anybody clicks, which is the distinction the Launchpad tile draws. */
  const readyDrafts = drafts.filter((c) => (byId[c.id]?.leads_count || 0) > 0);

  const mailboxDomains = {};
  for (const a of accounts || []) {
    const d = String(a.email || '').split('@')[1];
    if (d) mailboxDomains[d] = (mailboxDomains[d] || 0) + 1;
  }

  const at = meta.at instanceof Date ? meta.at : new Date();
  const shaped = {
    read: at.toISOString().slice(0, 16).replace('T', ' ') + ' UTC',
    readDate: at.toISOString().slice(0, 10),
    source: meta.source || 'snapshot',

    inWorkspace: real.length,
    launched: live.length,
    launchedNames: live.map((c) => c.name.split(' · ')[0]).sort(),
    paused: paused.length,
    pausedNames: paused.map((c) => c.name.split(' · ')[0]).sort(),
    drafts: drafts.length,
    unmanageable: (campaigns || []).length - real.length,

    ready: readyDrafts.length,
    readyLeads: sum(readyDrafts, 'leads_count'),

    totals: totals(real),
    byLine: {
      absorbent: totals(real.filter((c) => lineOf(c) === 'absorbent')),
      biochar: totals(real.filter((c) => lineOf(c) === 'biochar')),
    },

    mailboxes: (accounts || []).length,
    mailboxDomains,
    dailyCeiling: (accounts || []).reduce((n, a) => n + (a.daily_limit || 0), 0),
    requestedDaily: live.reduce((n, c) => n + (c.daily_limit || 0), 0),

    campaigns: real
      .map((c) => ({
        name: c.name.replace(/^DO NOT LAUNCH · /, ''),
        icp: c.name.replace(/^DO NOT LAUNCH · /, '').split(' · ')[0],
        line: lineOf(c),
        status: STATUS[c.status] ?? String(c.status),
        parked: /^DO NOT LAUNCH/.test(c.name),
        leads: byId[c.id]?.leads_count || 0,
        sent: byId[c.id]?.emails_sent_count || 0,
        replies: byId[c.id]?.reply_count_unique || 0,
        bounced: byId[c.id]?.bounced_count || 0,
      }))
      .sort((a, b) => a.line.localeCompare(b.line) || a.icp.localeCompare(b.icp)),
  };

  /* The number that decides whether more sending capacity is even possible. Computed here
     rather than on the page so the arithmetic lives in one place. */
  shaped.oversubscribed = shaped.requestedDaily > shaped.dailyCeiling;
  return shaped;
}
