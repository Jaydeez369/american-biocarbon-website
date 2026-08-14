/**
 * Branded email templates for American BioCarbon.
 *
 * Shared deliberately: functions/api/lead.js sends from here, and
 * scripts/build-email-previews.mjs renders the previews from here. One source, so a
 * preview you approve is byte-identical to what a prospect receives. If these ever fork,
 * the preview stops being evidence.
 *
 * Filename starts with "_" so Cloudflare Pages treats it as a module, not a route.
 *
 * EMAIL HTML IS NOT WEB HTML. Constraints that drive every odd choice below:
 *   - Tables for layout. Outlook (Word rendering engine) ignores float/flex/grid.
 *   - Inline styles only. Gmail strips <style> blocks in some clients, notably the
 *     Gmail app reading a non-Gmail account.
 *   - No external CSS, no webfonts. System font stack instead of DM Serif/DM Sans.
 *   - Images are blocked by default in most clients, so the logo carries alt text and
 *     never conveys information on its own. A blocked-image render must still be complete.
 *   - Max width 600px: the safe width for Outlook's reading pane.
 *   - Every colour is a literal hex. CSS variables do not exist in email.
 */

/* Mirrors tokens.css primitives. Duplicated as literals because email cannot use var(). */
const C = {
  navy900: "#0d1f3d",
  navy800: "#122a52",
  navy700: "#1a376c",
  navy600: "#24478a",
  crimson: "#d7153f",
  crimson600: "#b91237",
  ink: "#1a1a1a",
  slate: "#3e4a5f",
  mute: "#63676e",
  white: "#ffffff",
  paper: "#f7f8fa",
  line: "#e2e6ee",
};

/* Logos are served from the Shopify CDN (the only place they exist). Both URLs carry an
   explicit &format=png: the reversed asset is stored as .webp, and although Shopify
   currently content-negotiates it down to PNG, WebP is not renderable in Outlook desktop.
   Pinning the format means a header logo cannot silently disappear for Outlook readers if
   that negotiation ever changes. width=440 is 2x the 220px display width, for retina. */
const BRAND = {
  name: "American BioCarbon",
  address: "32525 Highway 1 South, White Castle, LA 70788",
  /* Kept in sync with BRAND in website/data.js by hand: a Pages Function cannot import the
     site's browser-global data.js, so this is a deliberate second copy, not a stray one. */
  phone: "(225) 398-9286",
  phoneHref: "tel:+12253989286",
  logo: "https://cdn.shopify.com/s/files/1/0773/9270/7876/files/abc-logo-horiz_color.png?v=1710167731&width=440&format=png",
  logoRev:
    "https://cdn.shopify.com/s/files/1/0773/9270/7876/files/abc-logo-horiz_rev_38e8f78a-b79f-4c53-8b36-d10683e943cf.webp?v=1710182358&width=440&format=png",
};

const FONT =
  "-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif";

export const esc = (s) =>
  String(s == null ? "" : s).replace(
    /[&<>"']/g,
    (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c])
  );

/* The site origin used for links inside emails. Overridable so pre-cutover sends can point
   at pages.dev: the spec-sheet PDFs 404 on the apex until the apex serves this site. */
export function origin(env = {}) {
  return env.SITE_ORIGIN || "https://americanbiocarbon.com";
}

export const SPEC = {
  pellets: "/assets/spec-sheets/Absorbent-Pellets-Specification-Sheet.pdf",
  biochar: "/assets/spec-sheets/Biochar-Premium-Specification-Sheet.pdf",
};

/* ------------------------------------------------------------------ *
 * Layout styles
 *
 * Three takes on the same content, so the brand call can be made by looking rather than
 * by describing. Content is identical across all three - only the chrome changes.
 * ------------------------------------------------------------------ */
export const STYLES = {
  classic: {
    label: "Classic",
    note: "Navy header bar with the reversed logo, white body, crimson button. Closest to the website. Safest across clients.",
  },
  minimal: {
    label: "Minimal",
    note: "Colour logo on white, a thin crimson rule, text-forward. Reads like a note from a person, not a campaign. Best deliverability - least image-dependent.",
  },
  bold: {
    label: "Bold",
    note: "Full-bleed navy panel carrying the headline, body on paper. Highest impact, most 'marketing'. Use for sample/quote confirmations, not for docs.",
  },
};

/* A preheader is the grey text a client shows next to the subject. Unset, clients scrape
   the first body text, which is usually the logo alt or "View in browser". */
function preheaderBlock(text) {
  return (
    `<div style="display:none;font-size:1px;color:${C.paper};line-height:1px;` +
    `max-height:0;max-width:0;opacity:0;overflow:hidden">${esc(text)}` +
    "&#8203;&nbsp;&#8203;&nbsp;&#8203;&nbsp;&#8203;&nbsp;&#8203;&nbsp;&#8203;&nbsp;&#8203;&nbsp;&#8203;&nbsp;</div>"
  );
}

function button(label, href) {
  /* Anchor styled as a button rather than a real <button>: buttons do not render in
     Outlook. Padding on the <a> keeps the tap target ~44px for mobile. */
  return (
    `<table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:26px 0">` +
    `<tr><td style="background:${C.crimson};border-radius:4px">` +
    `<a href="${esc(href)}" style="display:inline-block;padding:13px 26px;font:600 15px/1 ${FONT};` +
    `color:${C.white};text-decoration:none;border-radius:4px">${esc(label)}</a>` +
    `</td></tr></table>`
  );
}

function paras(list) {
  return list
    .map(
      (p) =>
        `<p style="margin:0 0 16px;font:400 16px/1.6 ${FONT};color:${C.slate}">${p}</p>`
    )
    .join("");
}

function linkList(links) {
  if (!links || !links.length) return "";
  return (
    /* White fill + border rather than a paper fill: the "bold" style puts the body on
       paper, where a paper panel is invisible. A bordered white card reads on both. */
    `<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" ` +
    `style="margin:0 0 20px;background:${C.white};border:1px solid ${C.line};border-radius:6px">` +
    `<tr><td style="padding:16px 18px">` +
    links
      .map(
        (l) =>
          `<div style="margin:0 0 8px;font:400 15px/1.5 ${FONT}">` +
          `<a href="${esc(l.href)}" style="color:${C.navy600};text-decoration:underline">${esc(l.label)}</a>` +
          `</div>`
      )
      .join("") +
    `</td></tr></table>`
  );
}

/* Summary of what the visitor submitted. Reassures them we captured it correctly, and
   saves the "what did I ask for again?" reply. Values are escaped; keys are humanised. */
/* "buyerType" -> "Buyer type", "shipCity" -> "Ship city". The desk reads these on a phone
   between calls; raw camelCase field names make it look like a debug dump. */
const humanise = (k) =>
  String(k)
    .replace(/([a-z0-9])([A-Z])/g, "$1 $2")
    .replace(/[_-]+/g, " ")
    .replace(/^./, (c) => c.toUpperCase());

function submissionTable(fields, labels = {}) {
  const rows = Object.entries(fields || {})
    .filter(([k, v]) => v != null && String(v).trim() !== "" && k !== "_gotcha" && k !== "website_url")
    .map(
      ([k, v]) =>
        `<tr>` +
        `<td style="padding:7px 14px 7px 0;font:600 13px/1.5 ${FONT};color:${C.mute};` +
        `vertical-align:top;white-space:nowrap">${esc(labels[k] || humanise(k))}</td>` +
        `<td style="padding:7px 0;font:400 14px/1.5 ${FONT};color:${C.ink}">${esc(String(v).slice(0, 500))}</td>` +
        `</tr>`
    )
    .join("");
  if (!rows) return "";
  return (
    `<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" ` +
    `style="margin:6px 0 22px;border-top:1px solid ${C.line};border-bottom:1px solid ${C.line}">` +
    `<tr><td style="padding:6px 0"><table role="presentation" cellpadding="0" cellspacing="0" border="0">${rows}</table></td></tr>` +
    `</table>`
  );
}

/* Returns a <tr>, NOT a <table>. It is inserted directly into the 600px shell table, and a
   <table> is not a valid child of <table> - browsers hoist it out of the layout entirely,
   which renders the footer full-width outside the card. */
function footer(env) {
  const o = origin(env);
  return (
    `<tr><td class="pad" style="padding:24px 32px 30px;border-top:1px solid ${C.line}">` +
    `<p style="margin:0 0 5px;font:600 13px/1.5 ${FONT};color:${C.slate}">${BRAND.name}</p>` +
    `<p style="margin:0 0 5px;font:400 13px/1.6 ${FONT};color:${C.mute}">${esc(BRAND.address)}</p>` +
    `<p style="margin:0;font:400 13px/1.6 ${FONT};color:${C.mute}">` +
    `<a href="${o}" style="color:${C.navy600};text-decoration:none">americanbiocarbon.com</a>` +
    ` &nbsp;·&nbsp; <a href="mailto:sales@americanbiocarbon.com" style="color:${C.navy600};text-decoration:none">sales@americanbiocarbon.com</a>` +
    ` &nbsp;·&nbsp; <a href="${BRAND.phoneHref}" style="color:${C.navy600};text-decoration:none">${esc(BRAND.phone)}</a>` +
    `</p>` +
    `<p style="margin:12px 0 0;font:400 12px/1.5 ${FONT};color:#8b9099">` +
    `You are receiving this because you submitted a request on our website.</p>` +
    `</td></tr>`
  );
}

/**
 * Render a full email document.
 * @param {{style?:string, preheader:string, heading:string, body:string, env?:object}} o
 */
export function renderEmail({ style = "classic", preheader = "", heading = "", body = "", env = {} }) {
  const s = STYLES[style] ? style : "classic";

  let header = "";
  let headingBlock = "";

  if (s === "classic") {
    header =
      `<tr><td class="pad" style="background:${C.navy900};padding:22px 32px">` +
      `<img src="${BRAND.logoRev}" alt="${BRAND.name}" width="200" ` +
      `style="display:block;border:0;width:200px;max-width:200px;height:auto"></td></tr>`;
    headingBlock =
      `<h1 style="margin:0 0 18px;font:700 24px/1.3 ${FONT};color:${C.navy900}">${esc(heading)}</h1>`;
  } else if (s === "minimal") {
    header =
      `<tr><td class="pad" style="padding:30px 32px 0">` +
      `<img src="${BRAND.logo}" alt="${BRAND.name}" width="176" ` +
      `style="display:block;border:0;width:176px;max-width:176px;height:auto">` +
      `<div style="height:3px;width:44px;background:${C.crimson};margin:20px 0 0"></div></td></tr>`;
    headingBlock =
      `<h1 style="margin:0 0 18px;font:600 21px/1.35 ${FONT};color:${C.ink}">${esc(heading)}</h1>`;
  } else {
    /* bold: headline lives inside the navy panel, so the body starts at the content */
    header =
      `<tr><td class="pad" style="background:${C.navy900};padding:30px 32px 34px">` +
      `<img src="${BRAND.logoRev}" alt="${BRAND.name}" width="180" ` +
      `style="display:block;border:0;width:180px;max-width:180px;height:auto;margin:0 0 22px">` +
      `<h1 style="margin:0;font:700 27px/1.25 ${FONT};color:${C.white}">${esc(heading)}</h1>` +
      `<div style="height:4px;width:56px;background:${C.crimson};margin:18px 0 0"></div></td></tr>`;
    headingBlock = "";
  }

  const bodyBg = s === "bold" ? C.paper : C.white;

  return (
    `<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">` +
    `<html xmlns="http://www.w3.org/1999/xhtml"><head>` +
    `<meta http-equiv="Content-Type" content="text/html; charset=UTF-8"/>` +
    `<meta name="viewport" content="width=device-width,initial-scale=1"/>` +
    /* Tells supporting clients the design handles both schemes, so they don't auto-invert
       and wreck the navy-on-white contrast. */
    `<meta name="color-scheme" content="light"/><meta name="supported-color-schemes" content="light"/>` +
    /* The ONLY <style> block in this file, and it is purely progressive enhancement: it
       trims the 32px side padding on narrow screens so a phone gets more usable line
       length. Every client that strips <style> (Gmail's clipped view, some webmail) simply
       keeps the inline 32px, which is still perfectly readable at 375px - nothing depends
       on this rule surviving. The layout fix that actually matters is the shell table's
       width:100%;max-width:600px, which is inline. */
    `<style>@media only screen and (max-width:600px){` +
    `.pad{padding-left:20px!important;padding-right:20px!important}` +
    `}</style>` +
    `<title>${esc(heading)}</title></head>` +
    `<body style="margin:0;padding:0;background:${C.paper};-webkit-font-smoothing:antialiased">` +
    preheaderBlock(preheader) +
    `<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="background:${C.paper}">` +
    `<tr><td align="center" style="padding:24px 12px">` +
    /* width:100% with max-width:600px, NOT a hard width:600px. Outlook desktop honours the
       width="600" attribute and renders at the intended size, while every phone client
       reflows to the viewport instead of forcing a 600px canvas into a 375px screen -
       which produces sideways-scrolling, clipped text (verified in the device toggle of
       scripts/build-email-viewer.mjs). The horizontal padding drops on narrow screens via
       the media query in HEAD_STYLES. */
    `<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="600" ` +
    `class="shell" style="width:100%;max-width:600px;background:${C.white};border-radius:8px;overflow:hidden;border:1px solid ${C.line}">` +
    header +
    `<tr><td class="pad" style="padding:30px 32px 6px;background:${bodyBg}">${headingBlock}${body}</td></tr>` +
    footer(env) +
    `</table></td></tr></table></body></html>`
  );
}

/* ------------------------------------------------------------------ *
 * Sequences - one per website form.
 *
 * Copy is derived from data.js `autoreply`, restructured into headline/paragraphs/links so
 * it renders as a designed email rather than a pasted text blob. Claims are deliberately
 * conservative: no email offers safety documentation at all, because there is no
 * approved SDS on file. Do not add one back until a real document exists - a buyer who
 * asks for a document we cannot produce is worse than never having offered it.
 * ------------------------------------------------------------------ */
const ONE_DAY = "within one business day";

export const SEQUENCES = {
  bedding: {
    label: "Animal bedding sample",
    subject: "Your American BioCarbon bedding sample",
    preheader: `A bedding specialist will follow up ${ONE_DAY}.`,
    heading: "Your bedding sample request is in",
    style: "classic",
    build: (o) => ({
      paras: [
        "Thanks for requesting a bagasse animal bedding sample.",
        `A bedding supply specialist will follow up ${ONE_DAY} with the product specifications, to confirm your ship-to address, and to agree the comparison you want to run against your current bedding.`,
      ],
      links: [],
      cta: null,
    }),
  },

  sample: {
    label: "Industrial sample kit",
    subject: "Your American BioCarbon sample kit",
    preheader: "Spec sheet inside. A specialist will confirm your ship-to.",
    heading: "Your sample kit request is in",
    style: "classic",
    build: (o) => ({
      paras: [
        "Thanks for requesting a sample kit. One complimentary sample bag per company, shipping included.",
        `A specialist will follow up ${ONE_DAY} to confirm your use case and ship-to address, and answer any handling questions for your application.`,
      ],
      links: [{ label: "Absorbent Pellets - specification sheet (PDF)", href: o + SPEC.pellets }],
      cta: null,
    }),
  },

  quote: {
    label: "Bulk quote request",
    subject: "Your American BioCarbon bulk quote",
    preheader: "We're preparing freight-aware pricing for your volume.",
    heading: "We're preparing your quote",
    style: "classic",
    build: (o) => ({
      paras: [
        "Thanks for your quote request. We're preparing freight-aware pricing for your volume and ship-to location.",
        "In the meantime, the specification sheets are below.",
      ],
      links: [
        { label: "Absorbent Pellets - specification sheet (PDF)", href: o + SPEC.pellets },
        { label: "Premium Biochar - specification sheet (PDF)", href: o + SPEC.biochar },
      ],
      cta: null,
    }),
  },

  biochar: {
    label: "Biochar sample",
    subject: "Your American BioCarbon biochar sample",
    preheader: "Premium biochar spec sheet inside.",
    heading: "Your biochar sample request is in",
    style: "classic",
    build: (o) => ({
      paras: [
        "Thanks for your interest in our premium bagasse biochar.",
        "We'll confirm your sample and ship-to address shortly. Composters: ask about our side-by-side windrow trial protocol.",
      ],
      links: [{ label: "Premium Biochar - specification sheet (PDF)", href: o + SPEC.biochar }],
      cta: null,
    }),
  },

  distributor: {
    label: "Distributor / reseller enquiry",
    subject: "American BioCarbon distributor program",
    preheader: "We're preparing the margin model for your geography.",
    heading: "Thanks for your interest in carrying our line",
    style: "classic",
    build: (o) => ({
      paras: [
        "Thanks for your interest in carrying the American BioCarbon line.",
        "We're preparing the margin model and stocking pilot details for your geography, and will be in touch shortly.",
      ],
      links: [],
      cta: null,
    }),
  },

  carbon: {
    label: "Carbon removal enquiry",
    subject: "Your American BioCarbon carbon removal enquiry",
    preheader: "Puro.earth CORC-certified durable carbon removal.",
    heading: "Thanks for your carbon removal enquiry",
    style: "classic",
    build: (o) => ({
      paras: [
        "Thanks for your interest in durable carbon removal from American BioCarbon.",
        `Our removals are certified under the Puro.earth CORC methodology. A member of the team will follow up ${ONE_DAY} to discuss volumes, vintages and delivery.`,
      ],
      links: [],
      cta: null,
    }),
  },

  docs: {
    label: "Documentation request",
    subject: "Your American BioCarbon documentation",
    preheader: "Specification sheets inside; a specialist will follow up.",
    heading: "Your documentation request",
    style: "classic",
    build: (o) => ({
      paras: [
        "Thanks for your request. The current specification sheets are below.",
        "A specialist will follow up with the laboratory data you need for your application.",
      ],
      links: [
        { label: "Absorbent Pellets - specification sheet (PDF)", href: o + SPEC.pellets },
        { label: "Premium Biochar - specification sheet (PDF)", href: o + SPEC.biochar },
      ],
      cta: null,
    }),
  },

  contact: {
    label: "General contact",
    subject: "We received your message - American BioCarbon",
    preheader: `We'll get back to you ${ONE_DAY}.`,
    heading: "Thanks for getting in touch",
    style: "classic",
    build: (o) => ({
      paras: [
        "Thanks for contacting American BioCarbon. We've received your message.",
        `Someone from the team will get back to you ${ONE_DAY}.`,
      ],
      links: [],
      cta: null,
    }),
  },
};

/**
 * Build the auto-reply to the person who submitted the form.
 * Returns null for an unknown form, so an unrecognised key sends nothing rather than
 * sending a generic email that misrepresents what they asked for.
 */
export function buildAutoreply(formKey, fields = {}, env = {}, styleOverride) {
  const seq = SEQUENCES[formKey];
  if (!seq) return null;
  const o = origin(env);
  const c = seq.build(o);
  const style = styleOverride || seq.style || "classic";

  const name = String(fields.name || "").trim().split(/\s+/)[0];
  const greeting = name
    ? `<p style="margin:0 0 16px;font:400 16px/1.6 ${FONT};color:${C.slate}">Hi ${esc(name)},</p>`
    : "";

  const body =
    greeting +
    paras(c.paras) +
    linkList(c.links) +
    (c.cta ? button(c.cta.label, c.cta.href) : "") +
    `<p style="margin:22px 0 0;font:400 16px/1.6 ${FONT};color:${C.slate}">` +
    `- The team at ${BRAND.name}</p><div style="height:6px"></div>`;

  const text = [
    name ? `Hi ${name},` : "",
    "",
    ...c.paras.map((p) => p.replace(/<[^>]+>/g, "")),
    "",
    ...(c.links || []).map((l) => `${l.label}: ${l.href}`),
    "",
    `- The team at ${BRAND.name}`,
    BRAND.address,
    BRAND.phone,
    o,
  ]
    .filter((l, i, a) => !(l === "" && a[i - 1] === ""))
    .join("\n");

  return {
    subject: seq.subject,
    html: renderEmail({ style, preheader: seq.preheader, heading: seq.heading, body, env }),
    text,
  };
}

/**
 * Build the internal notification to the sales desk. Same brand, different job: this one
 * is scannable at a glance on a phone, so the submitted fields lead rather than prose.
 */
export function buildInternalLead(formKey, fields = {}, page = "", env = {}) {
  const seq = SEQUENCES[formKey];
  const label = (seq && seq.label) || formKey || "unknown";
  const o = origin(env);

  const body =
    `<p style="margin:0 0 4px;font:400 15px/1.6 ${FONT};color:${C.slate}">` +
    `New <strong style="color:${C.ink}">${esc(label)}</strong> submission from the website.</p>` +
    submissionTable(fields) +
    `<p style="margin:0;font:400 13px/1.6 ${FONT};color:${C.mute}">` +
    `Page: ${esc(page || "-")}<br>Received: ${new Date().toISOString()}</p>` +
    `<div style="height:6px"></div>`;

  const text =
    `New ${label} submission from the website.\n\n` +
    Object.entries(fields || {})
      .filter(([k]) => k !== "_gotcha" && k !== "website_url")
      .map(([k, v]) => `${k}: ${String(v).slice(0, 500)}`)
      .join("\n") +
    `\n\nPage: ${page}\nReceived: ${new Date().toISOString()}`;

  return {
    subject: `Website form: ${label}`,
    html: renderEmail({
      style: "classic",
      preheader: `New ${label} submission`,
      heading: `New ${label} submission`,
      body,
      env,
    }),
    text,
  };
}

export const _internals = { C, BRAND, FONT, paras, linkList, button, submissionTable };
