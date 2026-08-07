/**
 * Build one self-contained page per candidate email style, for a side-by-side decision.
 *
 * Four pages, each showing ALL EIGHT sequences rendered the same way:
 *   1-classic.html   every email in Classic
 *   2-minimal.html   every email in Minimal
 *   3-bold.html      every email in Bold
 *   4-mixed.html     the per-form mix (Bold for sample/quote, Classic for bedding/biochar,
 *                    Minimal for the rest)
 *
 * Written to ~/Downloads so they can be opened, scrolled and compared outside the repo.
 * Each file is self-contained (emails are inlined as iframe srcdoc), so they can be moved,
 * emailed or opened offline without anything breaking.
 *
 *   node scripts/build-style-options.mjs
 */
import { writeFileSync, mkdirSync } from "node:fs";
import { join } from "node:path";
import { homedir } from "node:os";
import { SEQUENCES, STYLES, buildAutoreply } from "../functions/api/_email.js";

const OUT_DIR = join(homedir(), "Downloads", "abc-email-styles");

/* Pre-cutover the apex still serves Shopify, so spec-sheet links 404 there. Point previews
   at pages.dev so every link is actually clickable while reviewing. */
const env = { SITE_ORIGIN: "https://american-biocarbon-website.pages.dev" };

const SAMPLES = {
  bedding: { name: "Dale Whitmore", company: "Whitmore Poultry LLC", email: "dwhitmore@whitmorepoultry.com" },
  sample: { name: "Rachel Ortiz", company: "Gulf Coast Well Services", email: "r.ortiz@gulfcoastwell.com" },
  quote: { name: "Tom Bergeron", company: "Delta Environmental Partners", email: "tbergeron@deltaenv.com" },
  biochar: { name: "Priya Raman", company: "Cascade Compost Co-op", email: "praman@cascadecompost.org" },
  distributor: { name: "Marcus Feld", company: "Southline Farm & Ranch Supply", email: "mfeld@southlinesupply.com" },
  carbon: { name: "Ellen Nakamura", company: "Meridian Climate Fund", email: "e.nakamura@meridianclimate.com" },
  docs: { name: "Ben Krause", company: "Ironwood Industrial Hygiene", email: "bkrause@ironwoodih.com" },
  contact: { name: "Sofia Delgado", company: "Delgado Ag Consulting", email: "sofia@delgadoag.com" },
};

const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

function page({ title, kicker, blurb, resolveStyle }) {
  const items = Object.entries(SEQUENCES).map(([key, seq]) => {
    const style = resolveStyle(key, seq);
    const built = buildAutoreply(key, SAMPLES[key] || {}, env, style);
    return `<section class="card">
      <header>
        <h2>${esc(seq.label)}</h2>
        <p class="meta">form <code>${esc(key)}</code> &middot; style <strong>${esc(STYLES[style].label)}</strong></p>
        <p class="subj"><span>Subject</span> ${esc(built.subject)}</p>
      </header>
      <div class="frame"><iframe srcdoc="${esc(built.html)}"></iframe></div>
    </section>`;
  });

  return `<!doctype html><html lang="en"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>${esc(title)} — American BioCarbon email styles</title>
<style>
  :root{--navy:#0d1f3d;--navy6:#24478a;--crim:#d7153f;--ink:#1a1a1a;--mute:#63676e;--line:#e2e6ee;--paper:#f7f8fa}
  *{box-sizing:border-box}
  body{margin:0;background:var(--paper);color:var(--ink);
       font:16px/1.6 -apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif}
  .top{background:var(--navy);color:#fff;padding:30px 34px}
  .kicker{margin:0 0 6px;font-size:12px;letter-spacing:.12em;text-transform:uppercase;color:#6f93c9}
  .top h1{margin:0 0 10px;font-size:28px}
  .top p{margin:0;color:#b3c4e0;font-size:15px;max-width:80ch}
  main{padding:26px 34px 90px;max-width:1100px;margin:0 auto}
  .card{background:#fff;border:1px solid var(--line);border-radius:10px;margin:0 0 26px;overflow:hidden}
  .card header{padding:18px 20px 14px}
  .card h2{margin:0 0 4px;font-size:18px}
  .meta{margin:0 0 8px;font-size:13px;color:var(--mute)}
  .meta code{background:var(--paper);padding:1px 5px;border-radius:3px;font-size:12px}
  .subj{margin:0;font-size:14px}
  .subj span{display:inline-block;min-width:62px;color:var(--mute);font-size:12px;text-transform:uppercase;letter-spacing:.04em}
  .frame{border-top:1px solid var(--line);background:var(--paper)}
  iframe{width:100%;height:660px;border:0;display:block}
  .nav{padding:16px 34px;background:#fff;border-bottom:1px solid var(--line);font-size:14px}
  .nav a{color:var(--navy6);text-decoration:none;margin-right:18px}
  .nav strong{color:var(--ink)}
</style></head><body>
<div class="top">
  <p class="kicker">${esc(kicker)}</p>
  <h1>${esc(title)}</h1>
  <p>${esc(blurb)}</p>
</div>
<div class="nav">
  Compare: <a href="1-classic.html">1 · Classic</a><a href="2-minimal.html">2 · Minimal</a><a href="3-bold.html">3 · Bold</a><a href="4-mixed.html">4 · Per-form mix</a><a href="5-logos.html">5 · Logos</a>
</div>
<main>${items.join("")}</main>
</body></html>`;
}

mkdirSync(OUT_DIR, { recursive: true });

const pages = [
  {
    file: "1-classic.html",
    title: "Classic",
    kicker: "Style option 1 of 4",
    blurb: STYLES.classic.note + " All eight emails below use this style.",
    resolveStyle: () => "classic",
  },
  {
    file: "2-minimal.html",
    title: "Minimal",
    kicker: "Style option 2 of 4",
    blurb: STYLES.minimal.note + " All eight emails below use this style.",
    resolveStyle: () => "minimal",
  },
  {
    file: "3-bold.html",
    title: "Bold",
    kicker: "Style option 3 of 4",
    blurb: STYLES.bold.note + " All eight emails below use this style.",
    resolveStyle: () => "bold",
  },
  {
    file: "4-mixed.html",
    title: "Per-form mix",
    kicker: "Style option 4 of 4",
    blurb:
      "Style chosen per form: Bold for the two revenue moments (sample kit, bulk quote), " +
      "Classic for bedding and biochar, Minimal for the quieter enquiries. More variety, " +
      "less consistency as a system.",
    resolveStyle: (key, seq) => seq.style || "classic",
  },
];

for (const p of pages) writeFileSync(join(OUT_DIR, p.file), page(p));

console.log(`✓ Style options written to ${OUT_DIR}`);
for (const p of pages) console.log(`  ${p.file}  (${p.title})`);
