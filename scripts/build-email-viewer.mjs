/**
 * Build a single self-contained comparison page for choosing the auto-reply style.
 *
 * One file, two toggles:
 *   - Style:  Classic / Minimal / Bold / Per-form mix
 *   - Device: Desktop (600px, the email standard) / Mobile (375px, iPhone width)
 * ...and a rail listing all eight sequences. Every combination is pre-rendered and
 * inlined, so switching is instant and the file works offline or emailed to someone.
 *
 *   node scripts/build-email-viewer.mjs
 */
import { writeFileSync, mkdirSync } from "node:fs";
import { join } from "node:path";
import { homedir } from "node:os";
import { SEQUENCES, STYLES, buildAutoreply } from "../functions/api/_email.js";

const OUT_DIRS = [
  join(homedir(), "Downloads", "abc-email-styles"),
  join(process.cwd(), "..", "website-internal-docs"),
];

/* Pre-cutover the apex still serves Shopify, so spec-sheet links 404 there. Point the
   preview at pages.dev so every link in the emails is genuinely clickable while reviewing. */
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

const STYLE_ORDER = ["classic", "minimal", "bold", "mixed"];
const STYLE_LABEL = { classic: "Classic", minimal: "Minimal", bold: "Bold", mixed: "Per-form mix" };
const SEQ_KEYS = Object.keys(SEQUENCES);

/* Pre-render every style x sequence pair once. "mixed" resolves per sequence. */
const DATA = {};
for (const style of STYLE_ORDER) {
  DATA[style] = {};
  for (const key of SEQ_KEYS) {
    const resolved = style === "mixed" ? SEQUENCES[key].style || "classic" : style;
    const built = buildAutoreply(key, SAMPLES[key] || {}, env, resolved);
    DATA[style][key] = { subject: built.subject, html: built.html, style: resolved };
  }
}

const html = `<!doctype html><html lang="en"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>Auto-reply styles — American BioCarbon</title>
<style>
 :root{--navy:#0d1f3d;--navy6:#24478a;--crim:#d7153f;--ink:#1a1a1a;--mute:#63676e;
       --line:#e2e6ee;--paper:#f7f8fa}
 *{box-sizing:border-box}
 html,body{height:100%}
 body{margin:0;background:var(--paper);color:var(--ink);
      font:15px/1.55 -apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif}

 /* ---- top bar ---- */
 .bar{position:sticky;top:0;z-index:20;background:var(--navy);color:#fff;
      padding:14px 22px;display:flex;gap:26px;align-items:center;flex-wrap:wrap}
 .bar h1{margin:0;font-size:16px;font-weight:600;letter-spacing:.01em}
 .bar h1 span{color:#6f93c9;font-weight:400}
 .grp{display:flex;align-items:center;gap:8px;margin-left:auto}
 .grp:first-of-type{margin-left:0}
 .glabel{font-size:11px;letter-spacing:.1em;text-transform:uppercase;color:#6f93c9}
 .seg{display:flex;background:#152a4e;border-radius:7px;padding:3px;gap:2px}
 .seg button{appearance:none;border:0;background:transparent;color:#b3c4e0;cursor:pointer;
             font:inherit;font-size:13px;padding:6px 13px;border-radius:5px;white-space:nowrap}
 .seg button:hover{color:#fff}
 .seg button[aria-pressed="true"]{background:#fff;color:var(--navy);font-weight:600}

 /* ---- layout ---- */
 .wrap{display:flex;align-items:flex-start}
 .rail{position:sticky;top:60px;width:216px;flex:0 0 216px;padding:18px 12px 60px;
       max-height:calc(100vh - 60px);overflow:auto}
 .rail p{margin:0 0 8px;padding:0 10px;font-size:11px;letter-spacing:.1em;
         text-transform:uppercase;color:var(--mute)}
 .rail a{display:block;padding:8px 10px;border-radius:6px;color:var(--ink);
         text-decoration:none;font-size:14px;line-height:1.3}
 .rail a:hover{background:#eef1f6}
 .rail a small{display:block;color:var(--mute);font-size:11px;margin-top:1px}
 main{flex:1;min-width:0;padding:18px 26px 120px}

 /* ---- email cards ---- */
 .card{background:#fff;border:1px solid var(--line);border-radius:10px;
       margin:0 auto 26px;overflow:hidden;max-width:760px}
 .card header{padding:14px 18px 12px;border-bottom:1px solid var(--line)}
 .card h2{margin:0 0 3px;font-size:16px}
 .card .meta{margin:0;font-size:12px;color:var(--mute)}
 .card .meta code{background:var(--paper);padding:1px 5px;border-radius:3px}
 .card .subj{margin:6px 0 0;font-size:13.5px}
 .card .subj b{color:var(--mute);font-weight:500;font-size:11px;letter-spacing:.05em;
               text-transform:uppercase;margin-right:8px}
 .stage{background:#eceff4;padding:20px;display:flex;justify-content:center}
 .device{background:#fff;box-shadow:0 1px 4px rgba(13,31,61,.14);transition:width .18s ease}
 iframe{width:100%;border:0;display:block}
 .hint{max-width:760px;margin:0 auto 20px;font-size:13px;color:var(--mute);
       background:#fff;border:1px solid var(--line);border-radius:8px;padding:11px 15px}
 @media(max-width:900px){.rail{display:none}main{padding:18px 12px 90px}}
</style></head><body>

<div class="bar">
  <h1>Auto-reply styles <span>— American BioCarbon</span></h1>
  <div class="grp">
    <span class="glabel">Style</span>
    <div class="seg" id="styleSeg">
      ${STYLE_ORDER.map(
        (s, i) =>
          `<button data-style="${s}" aria-pressed="${i === 0}">${STYLE_LABEL[s]}</button>`
      ).join("")}
    </div>
  </div>
  <div class="grp">
    <span class="glabel">Device</span>
    <div class="seg" id="devSeg">
      <button data-w="600" aria-pressed="true">Desktop</button>
      <button data-w="375" aria-pressed="false">Mobile</button>
    </div>
  </div>
</div>

<div class="wrap">
  <nav class="rail">
    <p>Sequences</p>
    ${SEQ_KEYS.map(
      (k) =>
        `<a href="#s-${k}">${SEQUENCES[k].label}<small>${k}</small></a>`
    ).join("")}
  </nav>
  <main>
    <div class="hint" id="hint"></div>
    <div id="cards"></div>
  </main>
</div>

<script>
const DATA = ${JSON.stringify(DATA)};
const SEQ  = ${JSON.stringify(
  Object.fromEntries(SEQ_KEYS.map((k) => [k, SEQUENCES[k].label]))
)};
const STYLE_LABEL = ${JSON.stringify(STYLE_LABEL)};
const HINTS = {
  classic:'Navy header bar with the reversed logo on every email. Closest match to the website and the safest across email clients.',
  minimal:'Colour logo on white with a thin crimson rule. Least image-dependent, so it still reads as complete when a client blocks images.',
  bold:'Full-bleed navy panel carrying the headline. Highest impact, but reads more like a campaign than a transactional reply.',
  mixed:'Bold for the two revenue moments (sample kit, bulk quote), Classic for bedding and biochar, Minimal for the quieter enquiries.'
};

let style = 'classic', width = 600;

function render(){
  document.getElementById('hint').textContent = HINTS[style];
  document.getElementById('cards').innerHTML = Object.keys(SEQ).map(k=>{
    const d = DATA[style][k];
    const per = style==='mixed' ? ' · rendered as <strong>'+STYLE_LABEL[d.style]+'</strong>' : '';
    return '<section class="card" id="s-'+k+'">'
      + '<header><h2>'+SEQ[k]+'</h2>'
      + '<p class="meta">form <code>'+k+'</code>'+per+'</p>'
      + '<p class="subj"><b>Subject</b>'+d.subject.replace(/&/g,'&amp;').replace(/</g,'&lt;')+'</p></header>'
      + '<div class="stage"><div class="device" style="width:'+width+'px">'
      + '<iframe loading="lazy" srcdoc="'+d.html.replace(/&/g,'&amp;').replace(/"/g,'&quot;').replace(/</g,'&lt;').replace(/>/g,'&gt;')+'"></iframe>'
      + '</div></div></section>';
  }).join('');
  // size each frame to its content once loaded
  document.querySelectorAll('iframe').forEach(f=>{
    const fit=()=>{try{f.style.height=(f.contentDocument.body.scrollHeight+24)+'px'}catch(e){f.style.height='700px'}};
    f.addEventListener('load',fit); setTimeout(fit,60);
  });
}

function wire(id, fn){
  document.getElementById(id).addEventListener('click',e=>{
    const b=e.target.closest('button'); if(!b) return;
    [...e.currentTarget.querySelectorAll('button')].forEach(x=>x.setAttribute('aria-pressed', String(x===b)));
    fn(b); render();
  });
}
wire('styleSeg', b => style = b.dataset.style);
wire('devSeg',   b => width = +b.dataset.w);
render();
</script>
</body></html>`;

for (const dir of OUT_DIRS) {
  mkdirSync(dir, { recursive: true });
  writeFileSync(join(dir, "email-viewer.html"), html);
  console.log("✓ " + join(dir, "email-viewer.html"));
}
