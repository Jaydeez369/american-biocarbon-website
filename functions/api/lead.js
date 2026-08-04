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
 */

const RECIPIENTS = [
  "sarah.boone@americanbiocarbon.com",
  "victor.jehle@americanbiocarbon.com",
];

const DEFAULT_FROM = "American BioCarbon <leads@send.americanbiocarbon.com>";
const MAX_BODY_BYTES = 32 * 1024;
const MAX_FIELD_LEN = 5000;

const esc = (s) =>
  String(s).replace(/[&<>"']/g, (c) =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c])
  );

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

  const rows = Object.entries(fields)
    .filter(([k]) => k !== "_gotcha" && k !== "website_url")
    .map(
      ([k, v]) =>
        `<tr><td style="padding:4px 12px 4px 0;vertical-align:top;color:#555">${esc(k)}</td>` +
        `<td style="padding:4px 0">${esc(String(v).slice(0, MAX_FIELD_LEN))}</td></tr>`
    )
    .join("");

  const text = Object.entries(fields)
    .filter(([k]) => k !== "_gotcha" && k !== "website_url")
    .map(([k, v]) => `${k}: ${String(v).slice(0, MAX_FIELD_LEN)}`)
    .join("\n");

  const replyTo = replyToFrom(fields);
  const body = {
    from: env.LEAD_FROM || DEFAULT_FROM,
    to: RECIPIENTS,
    subject: `Website form: ${form}`,
    text: `${text}\n\nPage: ${page}\nReceived: ${new Date().toISOString()}`,
    html:
      `<p style="font:14px system-ui">New <strong>${esc(form)}</strong> submission from the website.</p>` +
      `<table style="font:14px system-ui;border-collapse:collapse">${rows}</table>` +
      `<p style="font:12px system-ui;color:#777">Page: ${esc(page)}<br>Received: ${new Date().toISOString()}</p>`,
  };
  if (replyTo) body.reply_to = replyTo;

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    console.error("[lead] delivery failed", res.status, await res.text().catch(() => ""));
    return json(502, { error: "delivery failed" });
  }
  return new Response(null, { status: 204 });
}

function json(status, obj) {
  return new Response(JSON.stringify(obj), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}
