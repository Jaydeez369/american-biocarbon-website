/**
 * GET /api/email — the Instantly inbox, on the account it belongs to.
 *
 * THE GAP THIS CLOSES. /api/instantly reads campaigns, analytics and mailboxes: how many were
 * sent, how many opened, how the domains are warming. All of that is aggregate. None of it
 * tells a rep opening Flowerwood that we emailed them four times and they replied on Tuesday.
 * The reply existed only in Instantly's own inbox, which means the one system that is supposed
 * to be the book of business was the one place the correspondence was not.
 *
 * The phone had exactly this shape of gap and this route is deliberately its twin: /api/activity
 * for calls and texts, /api/email for mail, both fetched live, both matched onto accounts in the
 * browser by the pipeline's own norm() key.
 *
 * WHAT `ue_type` MEANS, probed against the live API 2026-08-31 because it is undocumented:
 *   1  a campaign step we sent
 *   2  A REPLY FROM THE PROSPECT  <- the only one that represents a human choosing to answer
 *   3  a manual reply we sent from the Instantly inbox
 * Sent volume is already on the Launchpad tiles. Type 2 is what changes someone's day, so it is
 * flagged separately rather than being left to look like one more row in a list of ninety-eight.
 *
 * MATCHED ON EMAIL DOMAIN, not on the address. A campaign writes to evogel@flowerwood.com and
 * the reply can come from a different person at the same company, or from a shared inbox; a
 * timeline that only matched the exact address would split one conversation across two
 * accounts. Free-mail domains are excluded from the join for the obvious reason: everyone at
 * gmail.com is not one account.
 *
 * FAILS SOFT, like every other read route here. If Instantly is down or the key is unset this
 * answers ok:false with a reason and a 200, and the account renders exactly as it did before.
 *
 * SETUP: INSTANTLY_API_KEY, already set on this project. Needs `emails:read`; it does NOT need
 * the `block_list_entries` scope the suppression consumer wants, and this route never writes.
 */

const API = 'https://api.instantly.ai/api/v2';
const TIMEOUT_MS = 8000;

/* Two pages of 100. Enough to cover the current programme with room to spare, bounded so a
   dashboard render can never walk an unbounded history. */
const PAGE = 100;
const MAX_PAGES = 2;

const soft = (reason, detail) =>
  new Response(JSON.stringify({ ok: false, reason, detail: detail || null, rows: [] }), {
    status: 200,
    headers: { 'Content-Type': 'application/json', 'Cache-Control': 'private, no-store' },
  });

/* Everyone at gmail.com is not one company. Joining on these would merge unrelated accounts
   into one timeline, which is the same failure norm() guards against on company names. */
const FREE_MAIL = new Set([
  'gmail.com', 'yahoo.com', 'hotmail.com', 'outlook.com', 'aol.com', 'icloud.com',
  'me.com', 'msn.com', 'live.com', 'comcast.net', 'att.net', 'verizon.net', 'protonmail.com',
]);

const domainOf = (addr) => {
  const at = String(addr || '').toLowerCase().trim();
  const i = at.lastIndexOf('@');
  return i === -1 ? '' : at.slice(i + 1);
};

const firstAddress = (value) => {
  if (Array.isArray(value)) return String(value[0] || '');
  return String(value || '').split(',')[0].trim();
};

/* Strip the quoted history off a reply. Instantly returns the full body, and a timeline that
   renders it shows our own outbound copy back to us under the prospect's name. */
function trimQuoted(html) {
  let text = String(html || '')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/p>/gi, '\n')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'");

  const cuts = [
    /\nOn .{0,80}wrote:/i,
    /\nFrom:\s/i,
    /\n-{2,}\s*Original Message/i,
    /\n_{5,}/,
  ];
  for (const re of cuts) {
    const m = re.exec(text);
    if (m && m.index > 20) text = text.slice(0, m.index);
  }
  return text.replace(/\n{3,}/g, '\n\n').trim().slice(0, 1200);
}

export async function onRequestGet(context) {
  const { env, request } = context;

  const key = typeof env.INSTANTLY_API_KEY === 'string' ? env.INSTANTLY_API_KEY.trim() : '';
  if (!key) return soft('not-configured', 'INSTANTLY_API_KEY is unset on this deployment');

  const abort = new AbortController();
  const timer = setTimeout(() => abort.abort(), TIMEOUT_MS);

  const items = [];
  try {
    let cursor = null;
    for (let page = 0; page < MAX_PAGES; page++) {
      const url = `${API}/emails?limit=${PAGE}${cursor ? `&starting_after=${encodeURIComponent(cursor)}` : ''}`;
      const res = await fetch(url, {
        headers: { Authorization: `Bearer ${key}` },
        signal: abort.signal,
      });
      if (res.status === 401 || res.status === 403) return soft('unauthorized', `instantly ${res.status}`);
      if (!res.ok) return soft('upstream-error', `instantly returned ${res.status}`);

      const data = await res.json();
      const batch = Array.isArray(data.items) ? data.items : [];
      items.push(...batch);
      cursor = data.next_starting_after;
      if (!cursor || batch.length < PAGE) break;
    }
  } catch (error) {
    return soft(abort.signal.aborted ? 'timeout' : 'unreachable', String(error).slice(0, 200));
  } finally {
    clearTimeout(timer);
  }

  /* Our own sending mailboxes, taken from the data rather than hard-coded — the programme runs
     across getamericanbiocarbon.com and pureamericanbiocarbon.com today and will not stay that
     way. Whichever end of the message is not ours is the prospect. */
  const ourDomains = new Set(
    items.map((e) => domainOf(e.eaccount)).filter(Boolean),
  );

  const rows = items.map((e) => {
    const from = String(e.from_address_email || '');
    const to = firstAddress(e.to_address_email_list);
    const inbound = e.ue_type === 2;
    const counterparty = ourDomains.has(domainOf(from)) ? to : from;
    const domain = domainOf(counterparty);

    return {
      at: e.timestamp_created || e.timestamp_email || null,
      kind: 'email',
      direction: inbound ? 'INBOUND' : 'OUTBOUND',
      /* A prospect choosing to answer is the event worth surfacing; a campaign step is not. */
      isReply: inbound,
      manual: e.ue_type === 3,
      subject: e.subject || '(no subject)',
      from,
      to,
      who: counterparty,
      /* The join key, precomputed here so the browser matches on exactly what this filtered on. */
      key: FREE_MAIL.has(domain) ? '' : domain,
      domain,
      campaignId: e.campaign_id || null,
      threadId: e.thread_id || null,
      body: trimQuoted(e.body?.text || e.body?.html || e.body || ''),
    };
  }).filter((r) => r.at);

  const replies = rows.filter((r) => r.isReply);

  return new Response(JSON.stringify({
    ok: true,
    source: 'Instantly /emails, live',
    fetchedAt: new Date().toISOString(),
    total: rows.length,
    replies: replies.length,
    /* Domains present in the feed, so an empty timeline is diagnosable: domains here but no
       match is a joining bug, no domains is genuinely no mail. */
    domains: [...new Set(rows.map((r) => r.key).filter(Boolean))],
    rows,
  }), {
    headers: { 'Content-Type': 'application/json', 'Cache-Control': 'private, no-store' },
  });
}
