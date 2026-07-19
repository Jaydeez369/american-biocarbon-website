#!/usr/bin/env node
/**
 * SPA metadata prerender.
 *
 * index.html is a client-rendered shell: every route's <title>, description, canonical,
 * Open Graph and JSON-LD are written by app.js setMeta() at RUNTIME. Non-JS consumers -
 * Googlebot's HTML snapshot on first pass, and every social/link scraper (LinkedIn, Slack,
 * Facebook, iMessage) which never runs JS - therefore see the HOMEPAGE card and homepage
 * canonical on EVERY deep link.
 *
 * This step writes a static <route>/index.html snapshot per indexable route, each carrying
 * that route's real head metadata. Cloudflare Pages serves a matching static file BEFORE
 * consulting _redirects (see _headers), so the snapshot is what crawlers get; the SPA still
 * boots and hydrates normally because <base href="/"> keeps asset paths absolute and the
 * router reads location.pathname.
 *
 * Runs at build time AFTER stamp-assets, so the template it copies already carries
 * content-hashed ?v= asset tokens. The seo objects are read straight out of data.js (in a
 * sandbox), so titles/descriptions cannot drift from the running app.
 *
 * The snapshots ARE COMMITTED (Cloudflare Pages serves the repo as-is; the build command is
 * not wired to run this). Run `npm run build` before committing any change to index.html or
 * the seo objects in data.js. `--check` (in `npm run check`) fails if a committed snapshot
 * is out of date, so a stale snapshot cannot ship.
 */
import { readFileSync, writeFileSync, mkdirSync, existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import vm from "node:vm";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const ORIGIN = "https://americanbiocarbon.com";
const SITE_NAME = "American BioCarbon";
const OG_IMAGE = ORIGIN + "/assets/og-image.png";

// ---- Load data.js in a sandbox and capture the data consts ---------------------------
// data.js is plain `const X = {...}` declarations. Concatenate an epilogue in the SAME
// script scope (where those const bindings are visible) to hand them back out. Browser
// globals are stubbed so evaluation never touches a real DOM.
function loadData() {
  const src = readFileSync(join(ROOT, "data.js"), "utf8");
  let captured = {};
  const sandbox = {
    window: {}, document: { querySelector: () => null, createElement: () => ({}) },
    navigator: {}, location: { pathname: "/", search: "" }, console,
    __CAP: (o) => { captured = o; },
  };
  const epilogue = `\n;__CAP({HOME:typeof HOME!=="undefined"?HOME:null,PRODUCTS:typeof PRODUCTS!=="undefined"?PRODUCTS:null,INDUSTRIES:typeof INDUSTRIES!=="undefined"?INDUSTRIES:null,ENV_REMEDIATION:typeof ENV_REMEDIATION!=="undefined"?ENV_REMEDIATION:null,RESELLERS_INDUSTRIES:typeof RESELLERS_INDUSTRIES!=="undefined"?RESELLERS_INDUSTRIES:null,RESELLERS_AGRICULTURE:typeof RESELLERS_AGRICULTURE!=="undefined"?RESELLERS_AGRICULTURE:null});`;
  vm.runInNewContext(src + epilogue, sandbox, { filename: "data.js" });
  return captured;
}

const D = loadData();
if (!D.HOME || !D.PRODUCTS || !D.INDUSTRIES) {
  console.error("✗ Prerender: could not extract HOME/PRODUCTS/INDUSTRIES from data.js.");
  process.exit(1);
}

const escAttr = (s) => String(s ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
const escText = (s) => String(s ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

// ---- Route table (mirrors the indexable set in app.js + sitemap.xml) ------------------
const routes = [];
const add = (path, seo, ld) => routes.push({ path, seo: seo || {}, ld: ld || null });

const home = { name: "Home", path: "/" };
const breadcrumb = (items) => ({ "@context": "https://schema.org", "@type": "BreadcrumbList",
  itemListElement: items.map((it, i) => ({ "@type": "ListItem", position: i + 1, name: it.name, ...(it.path ? { item: ORIGIN + it.path } : {}) })) });
const CERTS = { "agricultural-biochar": ["OMRI Listed", "IBI Certified"], "carbon-removal": ["Puro.earth Certified"] };
const productLd = (id, p) => {
  const certs = CERTS[id] || [];
  return { "@context": "https://schema.org", "@type": "Product", name: p.name,
    description: (p.seo && p.seo.desc) || p.sub || p.claim || "", category: "Industrial Absorbent",
    brand: { "@type": "Brand", name: SITE_NAME }, image: OG_IMAGE,
    manufacturer: { "@type": "Organization", name: SITE_NAME },
    ...(certs.length ? { hasCertification: certs.map((c) => ({ "@type": "Certification", name: c })) } : {}) };
};

// Home
add("/", D.HOME.seo, null);
// Products + their shop variants
for (const [id, p] of Object.entries(D.PRODUCTS)) {
  add(`/product/${id}`, p.seo, [productLd(id, p), breadcrumb([home, { name: p.name, path: `/product/${id}` }])]);
}
for (const id of ["absorbent-pellets", "agricultural-biochar"]) {
  const p = D.PRODUCTS[id]; if (!p) continue;
  add(`/shop/${id}`, { title: `${p.name}, ${p.unit || "Buy"} | ${SITE_NAME}`, desc: p.desc || p.claim },
    [productLd(id, p), breadcrumb([home, { name: "Products", path: "/buy" }, { name: p.name, path: `/shop/${id}` }])]);
}
// Indexable industries (matches sitemap; environmental-remediation & distributors 301 to dedicated pages)
for (const id of ["oil-gas", "industrial-remediation", "spill-response", "landfill-leachate", "soil-blenders", "animal-bedding"]) {
  const n = D.INDUSTRIES[id]; if (!n) continue;
  add(`/industry/${id}`, n.seo, [breadcrumb([home, { name: "Industries" }, { name: n.name, path: `/industry/${id}` }])]);
}
// Dedicated solution / channel landing pages
if (D.ENV_REMEDIATION) add("/environmental-remediation-solutions", D.ENV_REMEDIATION.seo, [breadcrumb([home, { name: "Environmental Remediation", path: "/environmental-remediation-solutions" }])]);
if (D.RESELLERS_INDUSTRIES) add("/distributors-resellers-industries", D.RESELLERS_INDUSTRIES.seo, [breadcrumb([home, { name: "Distributors & Resellers", path: "/distributors-resellers-industries" }])]);
if (D.RESELLERS_AGRICULTURE) add("/distributors-resellers-agriculture", D.RESELLERS_AGRICULTURE.seo, [breadcrumb([home, { name: "Distributors & Resellers - Agriculture", path: "/distributors-resellers-agriculture" }])]);
// Static reference pages (titles mirror app.js render functions)
add("/buy", { title: "Products, Bagasse Absorbents, Biochar & Soil | American BioCarbon", desc: "Browse American BioCarbon's sugarcane-bagasse product line: industrial absorbent pellets and crumble, OMRI-listed 100% biochar, biochar-infused soil, and carbon removal. Request a free sample." }, [breadcrumb([home, { name: "Products", path: "/buy" }])]);
add("/compare", { title: "Bagasse vs Wood Pellet Absorbent, Comparison | American BioCarbon", desc: "Compare bagasse absorbent pellets vs wood pellets and clay: absorption, bag count, disposal weight, and renewability." }, [breadcrumb([home, { name: "Compare", path: "/compare" }])]);
add("/technical", { title: "Technical Data & Research | American BioCarbon", desc: "Certifications, spec sheets, SDS, independent lab analyses, and peer reviewed research for bagasse absorbents and biochar. Request the technical package." }, [breadcrumb([home, { name: "Technical Data & Research", path: "/technical" }])]);
add("/about", { title: "About American BioCarbon | White Castle, LA", desc: "American BioCarbon converts sugarcane bagasse into industrial absorbents, biochar, and durable carbon removal at the Cora Texas Sugar Mill in White Castle, Louisiana." }, [breadcrumb([home, { name: "About", path: "/about" }])]);

// ---- Snapshot generation --------------------------------------------------------------
const template = readFileSync(join(ROOT, "index.html"), "utf8");
if (!/<link rel="canonical"/.test(template)) {
  console.error("✗ Prerender: template index.html is missing expected head tags.");
  process.exit(1);
}

function render(route) {
  const title = route.seo.title || SITE_NAME;
  const desc = route.seo.desc || "";
  const canonical = ORIGIN + (route.path === "/" ? "/" : route.path);
  let h = template;
  h = h.replace(/<title>[\s\S]*?<\/title>/, `<title>${escText(title)}</title>`);
  h = h.replace(/(<meta name="description" content=")[\s\S]*?("\s*\/?>)/, `$1${escAttr(desc)}$2`);
  h = h.replace(/(<link rel="canonical" href=")[^"]*(")/, `$1${escAttr(canonical)}$2`);
  h = h.replace(/(<meta property="og:url" content=")[^"]*(")/, `$1${escAttr(canonical)}$2`);
  h = h.replace(/(<meta property="og:title" content=")[^"]*(")/, `$1${escAttr(title)}$2`);
  h = h.replace(/(<meta property="og:description" content=")[^"]*(")/, `$1${escAttr(desc)}$2`);
  h = h.replace(/(<meta name="twitter:title" content=")[^"]*(")/, `$1${escAttr(title)}$2`);
  h = h.replace(/(<meta name="twitter:description" content=")[^"]*(")/, `$1${escAttr(desc)}$2`);
  if (route.ld) {
    const graph = route.ld.length === 1 ? route.ld[0] : { "@context": "https://schema.org", "@graph": route.ld };
    const tag = `  <script type="application/ld+json" id="ld-route">\n  ${JSON.stringify(graph)}\n  </script>\n</head>`;
    h = h.replace("</head>", tag);
  }
  return h;
}

const CHECK = process.argv.includes("--check");
let written = 0, stale = 0;
for (const route of routes) {
  if (route.path === "/") continue; // the committed index.html already IS the home snapshot
  const outDir = join(ROOT, route.path.replace(/^\//, ""));
  const outFile = join(outDir, "index.html");
  const next = render(route);
  if (CHECK) {
    const cur = existsSync(outFile) ? readFileSync(outFile, "utf8") : null;
    if (cur !== next) { stale++; console.error(`✗ Prerender: ${route.path}/index.html is out of date.`); }
    continue;
  }
  mkdirSync(outDir, { recursive: true });
  writeFileSync(outFile, next);
  written++;
}
if (CHECK) {
  if (stale) { console.error(`\n✗ Prerender: ${stale} stale snapshot(s). Run "node scripts/build.mjs" to regenerate.`); process.exit(1); }
  console.log("✓ Prerender: all route snapshots up to date.");
} else {
  console.log(`✓ Prerender: ${written} route snapshot(s) written (+ committed index.html for home).`);
}
