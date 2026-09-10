/**
 * POST /api/reply — reply to an Instantly thread from the Sales OS.
 *
 * WHY THIS EXISTS. The Instantly plan this account is on does not allow replying from
 * Instantly's own inbox. The API allows it anyway: POST /api/v2/emails/reply is present and
 * validates (probed 2026-08-31 — it answers 400 with a field list, not 404). So the reply that
 * cannot be sent from Instantly's UI can be sent from ours, through the same mailbox, in the
 * same thread.
 *
 * REPLYING IN THREAD, not sending a new mail, is the whole point. `reply_to_uuid` is the
 * message being answered, so Instantly keeps the thread, the tracking and the sending mailbox
 * together. A reply sent from anywhere else — a personal client, Resend, anything with a
 * different envelope — starts a second thread the campaign cannot see, and burns the domain
 * warming that Instantly is managing. There is deliberately NO route here for composing a new
 * cold email: that belongs in a campaign, and a dashboard that can send arbitrary mail from the
 * sending domains is a deliverability incident waiting for a bored afternoon.
 *
 * FAILS LOUD, like /api/prospect and unlike the read routes. Telling somebody their reply was
 * sent when it was not is worse than an error on screen: they will assume the prospect has
 * heard from them and will not follow up.
 *
 * SETUP: INSTANTLY_API_KEY, already set on this project. Needs the emails scope.
 *
 * The shape below was discovered against the live API by walking its validation errors, and is
 * asserted in salesos-tests/test-reply-e2e.mjs so a change to it fails a test rather than a send.
 */

const API = 'https://api.instantly.ai/api/v2';
const TIMEOUT_MS = 12000;

/* THE REPLY SIGNATURE, and why it differs from the cold one.
 *
 * outreach-data.js carries the canonical COLD signature: three lines, named human, company,
 * phone, and deliberately NO website URL. That rule is not stylistic — a link in a cold email
 * is a deliverability cost, and a signature URL is still a link. Nothing here changes it, and
 * nothing here should be copied back into a campaign step.
 *
 * A reply is a different context and the operator called it correctly on 2026-08-31: the
 * recipient has already written to us, so the message is expected, the domain reputation
 * question is largely settled for that thread, and making them search for the website to check
 * we are real costs more than the link does.
 *
 * Owned HERE, on the edge, rather than in the browser, for two reasons: it cannot be edited or
 * dropped by whoever is typing, and there is exactly one copy of it. The composer fetches this
 * same block for its preview (GET below), so what a rep sees and what goes out cannot drift.
 *
 * Phone written with spaces, never hyphens, matching every other piece of outreach copy here. */
const SIGNATURE = {
  name: 'Victor Jehle',
  company: 'American BioCarbon',
  phone: '(225) 398 9286',
  site: 'americanbiocarbon.com',
};

const signatureText = () =>
  `${SIGNATURE.name}\n${SIGNATURE.company}\n${SIGNATURE.phone}\n${SIGNATURE.site}`;

const signatureHtml = () =>
  `<p>${SIGNATURE.name}<br>${SIGNATURE.company}<br>${SIGNATURE.phone}<br>` +
  `<a href="https://${SIGNATURE.site}">${SIGNATURE.site}</a></p>`;

import { requireCapability } from '../_lib/authz.js';
import { redact } from '../_lib/redact.js';

const json = (body, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json', 'Cache-Control': 'private, no-store' },
  });

/* Plain text to the minimal HTML Instantly expects, escaped. Building the HTML here rather
   than accepting it from the browser means a reply cannot carry markup, tracking pixels or a
   script from whatever the rep pasted in. */
const escapeHtml = (s) => String(s)
  .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;').replace(/'/g, '&#39;');

export async function onRequestPost(context) {
  const { env, request } = context;

  /* The least reversible thing this application can do. */
  const denied = requireCapability(context, 'outbound.send');
  if (denied) return denied;

  const key = typeof env.INSTANTLY_API_KEY === 'string' ? env.INSTANTLY_API_KEY.trim() : '';
  if (!key) return json({ ok: false, reason: 'not-configured', error: 'INSTANTLY_API_KEY is unset on this deployment' }, 503);

  let input;
  try {
    input = await request.json();
  } catch {
    return json({ ok: false, reason: 'bad-request', error: 'body was not JSON' }, 400);
  }

  const replyTo = String(input.replyToUuid || '').trim();
  const eaccount = String(input.eaccount || '').trim();
  const subject = String(input.subject || '').trim();
  const text = String(input.text || '').trim();

  const errors = [];
  if (!replyTo) errors.push('the message being replied to is required');
  if (!eaccount) errors.push('the sending mailbox is required');
  if (!subject) errors.push('a subject is required');
  if (!text) errors.push('a message is required');
  /* A cold-outreach reply that runs long is a reply nobody reads, and an accidental paste of a
     whole thread into the box is the realistic way this gets abused. */
  if (text.length > 5000) errors.push('the message is too long');
  if (errors.length) return json({ ok: false, reason: 'invalid', error: errors.join('; ') }, 400);

  const abort = new AbortController();
  const timer = setTimeout(() => abort.abort(), TIMEOUT_MS);

  let res, data = {};
  try {
    res = await fetch(`${API}/emails/reply`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        reply_to_uuid: replyTo,
        eaccount,
        subject: /^re:/i.test(subject) ? subject : `Re: ${subject}`,
        body: {
          /* The signature is appended here, after validation, so a rep cannot send without one
             and cannot accidentally send two by pasting their own. */
          text: `${text}\n\n${signatureText()}`,
          html: text.split(/\n{2,}/)
            .map((p) => `<p>${escapeHtml(p).replace(/\n/g, '<br>')}</p>`)
            .join('') + signatureHtml(),
        },
      }),
      signal: abort.signal,
    });
    try { data = await res.json(); } catch { /* some errors are not JSON */ }
  } catch (error) {
    return json({
      ok: false,
      reason: abort.signal.aborted ? 'timeout' : 'unreachable',
      error: redact(error, env),
    }, 502);
  } finally {
    clearTimeout(timer);
  }

  if (!res.ok) {
    return json({
      ok: false,
      reason: res.status === 401 || res.status === 403 ? 'unauthorized' : 'instantly-rejected',
      status: res.status,
      error: data?.message || data?.error || `instantly returned ${res.status}`,
    }, res.status === 401 || res.status === 403 ? 502 : 400);
  }

  return json({ ok: true, id: data?.id || null, sentAt: new Date().toISOString() });
}

/* The composer reads this to render its live preview. Serving the block rather than
   duplicating it in pipeline.js is what stops the preview and the sent mail drifting apart —
   the failure there is quiet and embarrassing: a rep proofreads one thing and sends another. */
export function onRequestGet() {
  return json({
    ok: true,
    note: 'POST a reply to this route. It answers an existing Instantly thread; it cannot compose new mail.',
    signature: { text: signatureText(), html: signatureHtml() },
  });
}
