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

function recipientsFrom(env) {
  const override = typeof env.LEAD_TO === "string" ? env.LEAD_TO.trim() : "";
  if (!override) return DEFAULT_RECIPIENTS;
  const list = override.split(",").map((s) => s.trim()).filter(Boolean);
  return list.length ? list : DEFAULT_RECIPIENTS;
}

const DEFAULT_FROM = "American BioCarbon <leads@send.americanbiocarbon.com>";
const MAX_BODY_BYTES = 32 * 1024;

/* Pull the visitor address out of whatever the form called it, so a reply goes to the
   prospect rather than to us. Returns null if nothing looks like an address. */
function replyToFrom(fields) {
  for (const key of ["email", "Email", "work_email", "contact_email"]) {
    const v = fields[key];
    if (typeof v === "string" && /^[^@\s]+@[^@\s.]+\.[^@\s]+$/.test(v.trim())) {
      return v.trim();
    }
  }
  return null;
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

  if (!Object.keys(fields).length) return json(400, { error: "no fields submitted" });

  const key = env.RESEND_API_KEY;
  if (!key) {
    /* Loud, not silent. A missing key is a configuration fault and must show up in logs
       and as a non 2xx, otherwise we are back to losing leads quietly. */
    console.error("[lead] RESEND_API_KEY is not set. Submission was NOT delivered.", { form, page });
    return json(500, { error: "mail transport not configured" });
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
  const internal = buildInternalLead(form, fields, page, env);
  const notify = {
    from,
    to: recipientsFrom(env),
    subject: internal.subject,
    text: internal.text,
    html: internal.html,
  };
  if (replyTo) notify.reply_to = replyTo;

  const res = await send(notify);
  if (!res.ok) {
    console.error("[lead] delivery failed", res.status, await res.text().catch(() => ""));
    return json(502, { error: "delivery failed" });
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
          reply_to: "sales@americanbiocarbon.com",
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

  return new Response(null, { status: 204 });
}

function json(status, obj) {
  return new Response(JSON.stringify(obj), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}
