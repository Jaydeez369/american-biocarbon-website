/**
 * POST /api/lead - deliver a website form submission to the sales desk.
 *
 * Runs as a Cloudflare Pages Function, so it executes before static assets and before
 * the SPA fallback in _redirects. No separate hosting and no third party sees the lead.
 *
 * SECURITY: the browser posts a "recipients" array, and this handler deliberately
 * IGNORES it. Trusting a client supplied address list would turn this endpoint into an
 * open relay that anyone could use to send mail from our sending domain. The real
 * recipients are fixed below and are the only addresses this function will ever mail.
 * data.js keeps its own copy purely so the client can log intent when delivery is off.
 *
 * Required environment variables (Cloudflare Pages > Settings > Variables and secrets):
 *   RESEND_API_KEY  secret. API key from the Resend account.
 *   LEAD_FROM       optional. Verified sender, defaults to the send. subdomain so the
 *                   root SPF record for Microsoft 365 and Proofpoint is never touched.
 *   LEAD_TO         optional. Comma separated override for the internal recipient list,
 *                   for proving delivery against a test inbox. Unset in production.
 *   SITE_ORIGIN     optional. Base URL for links inside emails. Defaults to the apex.
 *                   Point it at the pages.dev URL before cutover: the spec-sheet PDFs
 *                   404 on the apex until the apex actually serves this site.
 *
 * Two emails go out per submission: the lead to the sales desk, then an auto-reply to the
 * visitor. Templates live in _email.js, shared with scripts/build-email-previews.mjs so the
 * approved preview and the delivered mail cannot drift apart.
 */
import { buildAutoreply, buildInternalLead } from "./_email.js";
import { contactState, emailFrom } from "./_contact.js";

/* Website enquiries go to the two people who actually work the leads, by name.
   These addresses are taken from the live Shopify staff accounts (Settings > Users,
   verified 2026-08-06), NOT from the handoff docs, which specified
   sarah.boone@ / victor.jehle@americanbiocarbon.com - spellings that appear nowhere in any
   live system and may reach no inbox at all.

   sales@americanbiocarbon.com is deliberately NOT here. A test send did deliver to it, so
   something accepts mail at that address, but nobody has confirmed it is a monitored
   mailbox rather than a catch-all. A lead sitting unread in a catch-all is indistinguishable
   from a lead that was never sent, which is the exact failure this whole endpoint exists to
   prevent. Add it back once someone confirms who reads it.

   LEAD_TO overrides this list. It exists so end-to-end delivery can be proved against a
   test inbox without mailing the sales desk, which is the only reason to ever set it.
   Leave it unset in production: unset means the two addresses below, which is the whole
   point of hardcoding them. Note this is an env var read by the server, NOT the client
   supplied "recipients" array, which is still ignored for the open-relay reason above. */
const DEFAULT_RECIPIENTS = ["sboone@cs-ops.com", "victor.jehle@cs-ops.com"];

/* Where a prospect's reply goes when they hit Reply on the auto-reply. Deliberately ONE
   address, not the DEFAULT_RECIPIENTS pair: a reply-to with two addresses makes every
   prospect reply fork into two threads that neither person can see the other half of.
   Victor for now; revisit if the volume outgrows one inbox. */
const REPLY_TO = "victor.jehle@cs-ops.com";

/* Resolve who gets the internal lead. Returns {list} or {error}; never falls back to the
   sales desk when an override was clearly intended but unusable.

   FAIL CLOSED. A set-but-empty LEAD_TO is a misconfigured test, not a request to mail the
   real desk, so it refuses to send instead of quietly reverting. The earlier version
   returned DEFAULT_RECIPIENTS here, which is the shape of bug that mails the people a test
   was written to protect. */
function recipientsFrom(env) {
  const raw = typeof env.LEAD_TO === "string" ? env.LEAD_TO.trim() : "";
  if (!raw) return { list: DEFAULT_RECIPIENTS, overridden: false };
  const list = raw.split(",").map((s) => s.trim()).filter(Boolean);
  if (!list.length) return { error: "LEAD_TO is set but contains no address" };
  return { list, overridden: true };
}

const DEFAULT_FROM = "American BioCarbon <leads@send.americanbiocarbon.com>";
const MAX_BODY_BYTES = 32 * 1024;

/* Pull the visitor address out of whatever the form called it, so a reply goes to the
   prospect rather than to us. Returns null if nothing looks like an address. Same rule as
   the gate below, from _contact.js, so a lead can never be accepted and then found to have
   no usable reply address. */
const replyToFrom = (fields) => emailFrom(fields);

/* THE CANONICAL STORE. Every lead is written here before anybody is mailed.
 *
 * WHY THIS EXISTS. Until 2026-09-08 this endpoint posted to Resend and returned 204. It had no
 * D1 binding, wrote no record and issued no id, so a website lead became two emails and nothing
 * else. A prospect who filled in the sample form and never phoned appeared on no screen in the
 * Sales OS, and if both recipients missed the mail there was no second copy anywhere. The two
 * inboxes WERE the database.
 *
 * WHY IT POSTS TO THE WORKER instead of binding D1 to this Pages project. Every other write to
 * allo_hooks goes through allo-hooks, which owns the schema, the audit trail and the record
 * shapes. A second writer means two places that decide what a record is, and they drift the day
 * one of them adds a field. The cost is one extra hop on a request that already makes two to
 * Resend, and one shared secret.
 *
 * SETUP (Cloudflare Pages > americanbiocarbon > Settings > Variables and secrets):
 *   ALLO_EXPORT_TOKEN  secret. The SAME value as EXPORT_TOKEN on the allo-hooks Worker.
 *   ALLO_HOOKS_URL     optional override of the Worker URL.
 *
 * UNSET IS NOT FATAL. If the token is missing this returns a reason and the caller mails anyway:
 * losing the lead entirely because the store is misconfigured would be strictly worse than the
 * behaviour this replaces. The response says `stored:false` so the failure is visible rather
 * than assumed, and it is logged loudly.
 */
const WORKER = "https://allo-hooks.csopsmarketing.workers.dev";

async function storeLead(env, record) {
  const token = typeof env.ALLO_EXPORT_TOKEN === "string" ? env.ALLO_EXPORT_TOKEN.trim() : "";
  if (!token) {
    console.error("[lead] ALLO_EXPORT_TOKEN is unset. The lead was NOT stored.", { form: record.form });
    return { ok: false, reason: "not-configured" };
  }
  const base = (typeof env.ALLO_HOOKS_URL === "string" && env.ALLO_HOOKS_URL.trim()) || WORKER;

  /* Bounded, because the visitor is waiting on this now. A store that is slow must not turn into
     a form that appears to hang; the lead still gets mailed and the failure is reported. */
  const abort = new AbortController();
  const timer = setTimeout(() => abort.abort(), 5000);
  try {
    const res = await fetch(`${base}/intake/web-lead`, {
      method: "POST",
      headers: { "x-export-token": token, "Content-Type": "application/json" },
      body: JSON.stringify(record),
      signal: abort.signal,
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok || data.ok !== true) {
      console.error("[lead] store refused the lead", res.status, JSON.stringify(data).slice(0, 200));
      return { ok: false, reason: `store-${res.status}` };
    }
    return { ok: true, id: data.id };
  } catch (error) {
    const reason = abort.signal.aborted ? "timeout" : "unreachable";
    console.error("[lead] store unreachable", reason, String(error).slice(0, 200));
    return { ok: false, reason };
  } finally {
    clearTimeout(timer);
  }
}

export async function onRequest({ request, env }) {
  /* Single entry point. Exporting onRequest alongside onRequestPost is ambiguous: next()
     forwards down the asset chain rather than to the method handler, so the method check
     lives here instead. */
  if (request.method !== "POST") {
    return new Response("Method Not Allowed", { status: 405, headers: { Allow: "POST" } });
  }

  let payload;
  try {
    const raw = await request.text();
    if (raw.length > MAX_BODY_BYTES) return json(413, { error: "payload too large" });
    payload = JSON.parse(raw);
  } catch {
    return json(400, { error: "invalid JSON" });
  }

  const form = typeof payload.form === "string" ? payload.form.slice(0, 64) : "unknown";
  const fields = payload.fields && typeof payload.fields === "object" ? payload.fields : {};
  const page = typeof payload.page === "string" ? payload.page.slice(0, 300) : "";

  /* Honeypot: a real visitor never fills a hidden field. Return success so a bot cannot
     tell it was rejected, but send nothing. */
  if (fields._gotcha || fields.website_url) return new Response(null, { status: 204 });

  /* Dry run: report how THIS deployment would route a lead, and send nothing.

     Cloudflare binds env vars per deployment and the production alias keeps serving the
     previous build for a while after a new one goes live, so a LEAD_TO added in the
     dashboard may simply not exist on the build actually answering the request. There was
     no way to detect that except by sending, which is exactly the thing that must not be
     got wrong: on 2026-08-07 a test POST hit the older build and mailed the live desk.
     Check `overridden` here before sending anything real.

     Deliberately reports no addresses, only whether an override is in effect. This endpoint
     is public, and echoing the recipient list back would hand every scraper the sales desk. */
  if (payload.dry_run === true) {
    const resolved = recipientsFrom(env);
    return json(200, {
      dryRun: true,
      overridden: resolved.overridden ?? false,
      recipientCount: resolved.list ? resolved.list.length : 0,
      configError: resolved.error ?? null,
      mailConfigured: Boolean(env.RESEND_API_KEY),
      commit: env.CF_PAGES_COMMIT_SHA ?? null,
    });
  }

  if (!Object.keys(fields).length) return json(400, { error: "no fields submitted" });

  /* Every form on the site marks email and phone required and blocks its own submit until
     both are valid, so nothing that fails here came from the form working normally: it is a
     bot, a replayed POST, or a browser told to skip validation. Refuse it rather than mail
     the desk a lead nobody can call or reply to.

     The rules live in _contact.js and app.js enforces the identical ones in the browser, so
     a real visitor always sees the error on the field rather than getting a confirmation for
     a submission this endpoint quietly dropped. Rejections are logged: a run of them means
     the two copies have drifted, not that visitors suddenly forgot their own phone numbers. */
  /* An id the store keys on, so a retry of the same submission is one lead rather than two.
     Minted here because this is the only place that knows a submission is one submission: the
     browser posts with keepalive and may repeat it, and the visitor may hit submit again. */
  const submissionId = typeof payload.submissionId === "string" && payload.submissionId.trim()
    ? payload.submissionId.trim().slice(0, 80)
    : `${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 10)}`;

  const contact = contactState(fields);

  /* THE LEAD IS RECORDED EVEN WHEN IT IS REFUSED. "How many leads have we turned away" was
     genuinely unanswerable before this: the old gate logged a warning and returned 400 to a
     browser that had already thanked the visitor. Now the refusal is a row, so the number
     exists and somebody can look at what was in them. */
  if (!contact.reachable) {
    console.warn("[lead] not reachable on any channel:", contact.reason, { form, page });
    await storeLead(env, {
      submissionId, form, page, ts: payload.ts, fields,
      rejected: true, rejectReason: contact.reason, mailed: false,
    });
    return json(400, { error: contact.reason, stored: true });
  }

  /* STORE FIRST, MAIL SECOND, and this order is the whole point. A lead that reaches the record
     and fails to reach an inbox is recoverable: it is on the Leads screen and somebody works it.
     A lead that reaches an inbox and not the record is invisible the moment the mail is missed,
     which is the failure this endpoint was built to stop and then had for a year anyway. */
  const stored = await storeLead(env, {
    submissionId, form, page, ts: payload.ts, fields,
    rejected: false, mailed: false,
  });

  const key = env.RESEND_API_KEY;
  if (!key) {
    /* Loud, not silent. A missing key is a configuration fault and must show up in logs
       and as a non 2xx, otherwise we are back to losing leads quietly.

       Now reported alongside whether the lead was STORED, because those are different
       failures with different consequences: a stored lead with no mail is a lead somebody
       still works today, and the visitor should not be told to try again. */
    console.error("[lead] RESEND_API_KEY is not set. Submission was NOT delivered.", { form, page });
    return json(500, { error: "mail transport not configured", stored: stored.ok, id: stored.id ?? null });
  }

  const replyTo = replyToFrom(fields);
  const from = env.LEAD_FROM || DEFAULT_FROM;

  const send = (payload) =>
    fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

  /* 1. The lead itself. This is the one that must not fail: a lost lead is lost revenue,
        whereas a missing auto-reply is a poor experience we can recover from. */
  const resolved = recipientsFrom(env);
  if (resolved.error) {
    console.error("[lead] refusing to send:", resolved.error, { form, page });
    return json(500, { error: "recipient configuration invalid" });
  }

  const internal = buildInternalLead(form, fields, page, env);
  const notify = {
    from,
    to: resolved.list,
    subject: internal.subject,
    text: internal.text,
    html: internal.html,
  };
  if (replyTo) notify.reply_to = replyTo;

  const res = await send(notify);
  if (!res.ok) {
    const detail = await res.text().catch(() => "");
    console.error("[lead] delivery failed", res.status, detail);
    /* The lead is already in the store, so this is no longer a lost lead: it is a lead the desk
       has not been told about. Reported as such, and the visitor is NOT asked to try again when
       we hold the record, because a second submission would be a duplicate of something we
       already have. */
    if (stored.ok) {
      await storeLead(env, {
        submissionId, form, page, ts: payload.ts, fields,
        rejected: false, mailed: false, mailError: `resend ${res.status}`,
      });
      return json(200, { ok: true, stored: true, id: stored.id, mailed: false });
    }
    return json(502, { error: "delivery failed", stored: false });
  }

  /* 2. The auto-reply to the visitor. Deliberately AFTER the lead and deliberately
        non-fatal: if this throws or the address bounces, we still captured the lead and
        already returned it to the desk. Failures are logged loudly so they show up in
        `wrangler pages deployment tail` rather than vanishing.

        Skipped entirely when the form carries no usable address (e.g. a form with only a
        phone field) - better to send nothing than to guess a recipient. */
  if (replyTo) {
    try {
      const reply = buildAutoreply(form, fields, env);
      if (reply) {
        const r = await send({
          from,
          to: [replyTo],
          /* Where a PROSPECT's reply lands. This is the warmest signal the funnel produces,
             so it must reach a mailbox somebody demonstrably reads. It used to be
             sales@americanbiocarbon.com, which contradicted this file's own DEFAULT_RECIPIENTS
             comment: that address was excluded from internal leads precisely because nobody
             confirmed it is monitored rather than a catch-all. Routing replies there while
             refusing to route leads there was the worst of both. Jesse's call, 2026-08-11. */
          reply_to: REPLY_TO,
          subject: reply.subject,
          text: reply.text,
          html: reply.html,
        });
        if (!r.ok) {
          console.error("[lead] autoreply failed", r.status, await r.text().catch(() => ""), { form });
        }
      } else {
        console.warn("[lead] no autoreply sequence for form", form);
      }
    } catch (err) {
      console.error("[lead] autoreply threw", String(err), { form });
    }
  }

  /* Was 204 with no body. It now says what actually happened, because the browser waits for
     this answer and shows the visitor a different thing depending on it: a lead we hold is a
     success even if something downstream failed, and a lead we hold neither in the store nor in
     an inbox is the one case worth telling somebody about. */
  if (stored.ok) {
    /* Re-stamp with mailed:true. Same submissionId, so this updates the row rather than adding
       one, and the Sales OS can show that the desk was told. */
    await storeLead(env, {
      submissionId, form, page, ts: payload.ts, fields,
      rejected: false, mailed: true,
    });
  }
  return json(200, {
    ok: true,
    stored: stored.ok,
    id: stored.id ?? null,
    mailed: true,
    incomplete: contact.missing.length > 0,
    missing: contact.missing,
  });
}

function json(status, obj) {
  return new Response(JSON.stringify(obj), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}
