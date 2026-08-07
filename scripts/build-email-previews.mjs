/**
 * Render every transactional email into one browsable page for review.
 *
 * Imports the SAME module the Pages Function sends from (functions/api/_email.js), so an
 * approved preview is byte-identical to the delivered mail. A preview built from a copy
 * would be theatre.
 *
 * Output goes to ../website-internal-docs/email-previews.html - OUTSIDE the publish root.
 * The repo root IS the Pages publish root (see _redirects), so anything written into
 * website/ would be served publicly. Internal review material must not be.
 *
 *   node scripts/build-email-previews.mjs
 *   node scripts/build-email-previews.mjs --open
 */
import { writeFileSync, mkdirSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { SEQUENCES, STYLES, buildAutoreply, buildInternalLead } from "../functions/api/_email.js";

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(HERE, "..");
const OUT = resolve(ROOT, "..", "website-internal-docs", "email-previews.html");

/* Pre-cutover the apex still serves Shopify, so spec-sheet links 404 there. Previews use
   pages.dev so every link in the preview is actually clickable today. The live function
   defaults to the apex, which is correct once the cutover happens. */
const env = { SITE_ORIGIN: "https://american-biocarbon-website.pages.dev" };

/* Realistic sample submissions per form. Real-looking data matters: it surfaces layout
   problems that "test / test / test" hides, like a long company name wrapping badly. */
const SAMPLES = {
  bedding: { name: "Dale Whitmore", company: "Whitmore Poultry LLC", email: "dwhitmore@whitmorepoultry.com", phone: "(225) 555-0134", operationType: "Commercial poultry", application: "Broiler house", current: "Pine shavings", scale: "40k-bird house", shipCity: "Opelousas", shipState: "LA", measure: "Bedding moisture and bags used per cycle" },
  sample: { name: "Rachel Ortiz", company: "Gulf Coast Well Services", email: "r.ortiz@gulfcoastwell.com", phone: "(337) 555-0198", sample: "Absorbent Pellets (1 lb)", buyerType: "Oilfield services", fluid: "Drilling mud / reserve pit", useCase: "Reserve-pit solidification ahead of closure" },
  quote: { name: "Tom Bergeron", company: "Delta Environmental Partners", email: "tbergeron@deltaenv.com", phone: "(504) 555-0177", product: "Absorbent Pellets", volume: "6 metric tons / month", shipCity: "Houma", shipState: "LA" },
  biochar: { name: "Priya Raman", company: "Cascade Compost Co-op", email: "praman@cascadecompost.org", phone: "(503) 555-0121", application: "Windrow composting", volume: "2 metric tons to start" },
  distributor: { name: "Marcus Feld", company: "Southline Farm & Ranch Supply", email: "mfeld@southlinesupply.com", phone: "(806) 555-0143", territory: "West Texas / Panhandle", channels: "Farm supply retail, 6 locations" },
  carbon: { name: "Ellen Nakamura", company: "Meridian Climate Fund", email: "e.nakamura@meridianclimate.com", phone: "(415) 555-0166", volume: "5,000 tCO2e", vintage: "2026" },
  docs: { name: "Ben Krause", company: "Ironwood Industrial Hygiene", email: "bkrause@ironwoodih.com", phone: "(713) 555-0155", need: "Lab data and safety documentation for a refinery trial" },
  contact: { name: "Sofia Delgado", company: "Delgado Ag Consulting", email: "sofia@delgadoag.com", phone: "(956) 555-0188", message: "Interested in a soil-amendment trial across two client farms this season." },
};

const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

const cards = [];
const nav = [];
const singles = [];

function card(id, title, meta, subject, doc, notes) {
  nav.push(`<a href="#${id}">${esc(title)}</a>`);
  /* Also emit each email as its own file. Two reasons: the index page stacks 12 iframes so
     a single one is easier to inspect, and a standalone file can be opened in a real mail
     client or forwarded to a test inbox - the only way to check how Outlook and Gmail
     actually render it, which no browser preview can tell you. */
  singles.push({ id, title, subject, doc });
  cards.push(
    `<section class="card" id="${id}">
      <header>
        <div>
          <h2>${esc(title)}</h2>
          <p class="meta">${meta}</p>
        </div>
        <button class="src" data-target="f-${id}">View HTML source</button>
      </header>
      <p class="subj"><span>Subject</span> ${esc(subject)}</p>
      ${notes ? `<p class="note">${notes}</p>` : ""}
      <!-- Deliberately NOT loading="lazy": jumping to an anchor lands on an iframe that has
           not rendered yet, so the section looks blank. 12 srcdoc frames is cheap. -->
      <div class="frame"><iframe id="f-${id}" srcdoc="${esc(doc)}"></iframe></div>
    </section>`
  );
}

/* 1. Every sequence, in its assigned house style. */
for (const [key, seq] of Object.entries(SEQUENCES)) {
  const fields = SAMPLES[key] || { name: "Sample Person", email: "person@example.com" };
  const built = buildAutoreply(key, fields, env);
  const style = seq.style || "classic";
  card(
    `seq-${key}`,
    `${seq.label}`,
    `Auto-reply to the visitor &middot; form <code>${esc(key)}</code> &middot; style <strong>${esc(STYLES[style].label)}</strong>`,
    built.subject,
    built.html,
    STYLES[style].note
  );
}

/* 2. The internal lead notification. Different job, so it gets its own entry. */
{
  const built = buildInternalLead("sample", SAMPLES.sample, "/request-sample", env);
  card(
    "internal-lead",
    "Internal lead notification",
    "Sent to <code>sales@americanbiocarbon.com</code> &middot; style <strong>Classic</strong>",
    built.subject,
    built.html,
    "Scannable on a phone: submitted fields lead, prose is minimal. Reply-To is set to the prospect, so hitting Reply goes to them."
  );
}

/* 3. One sequence in all three styles, side by side - this is the actual brand decision. */
for (const style of Object.keys(STYLES)) {
  const built = buildAutoreply("sample", SAMPLES.sample, env, style);
  card(
    `style-${style}`,
    `Style option: ${STYLES[style].label}`,
    `Same email (<code>sample</code>) rendered in each candidate style, for comparison`,
    built.subject,
    built.html,
    STYLES[style].note
  );
}

const html = `<!doctype html>
<html lang="en"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>American BioCarbon — transactional email previews</title>
<style>
  :root{--navy:#0d1f3d;--navy6:#24478a;--crim:#d7153f;--ink:#1a1a1a;--mute:#63676e;--line:#e2e6ee;--paper:#f7f8fa}
  *{box-sizing:border-box}
  body{margin:0;background:var(--paper);color:var(--ink);
       font:16px/1.6 -apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif}
  .top{background:var(--navy);color:#fff;padding:26px 32px}
  .top h1{margin:0 0 6px;font-size:22px}
  .top p{margin:0;color:#b3c4e0;font-size:14px}
  .wrap{display:grid;grid-template-columns:260px 1fr;gap:0;align-items:start}
  nav{position:sticky;top:0;max-height:100vh;overflow:auto;padding:22px 16px;border-right:1px solid var(--line);background:#fff}
  nav a{display:block;padding:7px 10px;border-radius:5px;color:var(--navy6);text-decoration:none;font-size:14px}
  nav a:hover{background:var(--paper)}
  main{padding:26px 32px 80px;min-width:0}
  .card{background:#fff;border:1px solid var(--line);border-radius:10px;margin:0 0 26px;overflow:hidden}
  .card header{display:flex;justify-content:space-between;align-items:flex-start;gap:16px;padding:18px 20px 12px}
  .card h2{margin:0 0 4px;font-size:17px}
  .meta{margin:0;font-size:13px;color:var(--mute)}
  .meta code,.subj code{background:var(--paper);padding:1px 5px;border-radius:3px;font-size:12px}
  .subj{margin:0;padding:0 20px 10px;font-size:14px}
  .subj span{display:inline-block;min-width:62px;color:var(--mute);font-size:12px;text-transform:uppercase;letter-spacing:.04em}
  .note{margin:0;padding:0 20px 14px;font-size:13px;color:var(--mute);max-width:76ch}
  .frame{border-top:1px solid var(--line);background:var(--paper)}
  iframe{width:100%;height:620px;border:0;display:block}
  .src{flex:none;background:#fff;border:1px solid var(--line);border-radius:5px;padding:6px 11px;
       font-size:12px;color:var(--navy6);cursor:pointer}
  .src:hover{border-color:var(--navy6)}
  pre{margin:0;padding:16px 20px;background:#0d1f3d;color:#d9e2f1;font-size:12px;line-height:1.5;
      overflow-x:auto;white-space:pre-wrap;word-break:break-all}
  @media(max-width:900px){.wrap{grid-template-columns:1fr}nav{position:static;max-height:none;border-right:0;border-bottom:1px solid var(--line)}}
</style></head>
<body>
<div class="top">
  <h1>American BioCarbon — transactional email previews</h1>
  <p>Generated from <code>functions/api/_email.js</code>, the same module the live send uses. Internal review copy — not published.</p>
</div>
<div class="wrap">
  <nav>${nav.join("")}</nav>
  <main>${cards.join("")}</main>
</div>
<script>
  document.addEventListener('click', e => {
    const b = e.target.closest('.src'); if(!b) return;
    const f = document.getElementById(b.dataset.target);
    const card = b.closest('.card');
    let pre = card.querySelector('pre');
    if (pre) { pre.remove(); b.textContent = 'View HTML source'; return; }
    pre = document.createElement('pre');
    pre.textContent = f.getAttribute('srcdoc');
    card.appendChild(pre);
    b.textContent = 'Hide HTML source';
  });
</script>
</body></html>`;

mkdirSync(dirname(OUT), { recursive: true });
writeFileSync(OUT, html);

const singleDir = join(dirname(OUT), "email-previews");
mkdirSync(singleDir, { recursive: true });
for (const s of singles) writeFileSync(join(singleDir, `${s.id}.html`), s.doc);

console.log(`✓ Email previews: ${cards.length} rendered`);
console.log(`  index    → ${OUT}`);
console.log(`  singles  → ${singleDir}/ (${singles.length} files)`);
