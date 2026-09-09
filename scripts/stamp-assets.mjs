#!/usr/bin/env node
/**
 * Cache-bust stamping: rewrite ?v= query strings to a hash of the file's own content.
 *
 * Assets ship as immutable/max-age=31536000 (see _headers), so the query string is the
 * only cache key that changes. A hand-maintained token means a forgotten bump serves a
 * year-stale asset; hashing the content makes the bump impossible to forget and makes
 * an unchanged file keep its existing key.
 *
 * Runs at build time against the publish checkout, so it rewrites the deployed HTML
 * without dirtying the repo. Pass --check to verify without writing (exits non-zero
 * if any stamp is out of date).
 */
import { readFileSync, writeFileSync, existsSync, readdirSync, statSync } from "node:fs";
import { createHash } from "node:crypto";
import { join, dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const CHECK = process.argv.includes("--check");

// HTML entry points whose asset references get stamped. Every shipping page belongs here:
// a page left off this list gets no stamping AND no missing-asset check, which is exactly
// how sales/build-later.html shipped without tokens.css.
const PAGES = ["index.html", "sales/index.html", "sales/brandkit.html"];

// href/src/data-src="<local path>?v=<token>" -> capture path and token.
//
// data-src is here for ONE ref and it is load bearing: sales/index.html no longer loads
// roster-data.js with a script tag, it carries the stamped URL on a placeholder and app.js
// injects the script on demand. Without data-src in this pattern that URL would keep
// whatever token was typed, and _headers serves /*.js immutable for a year, so every
// browser that ever loaded the roster would be pinned to that build of it forever. The
// alternation cannot mis-fire on the "src" inside "data-src": the \s requires whitespace
// immediately before, and there is a hyphen there.
const REF = /(\s(?:href|src|data-src)=")([^"?#:]+\.(?:css|js))\?v=([^"#]*)"/g;

/* An unstamped local asset is worse than a stale stamp, and silently so. _headers ships
   /*.js and /*.css as immutable for a year, and this stamper only rewrites refs that
   ALREADY carry a ?v=, so a tag written without one is cached in every browser for a year
   and never picks up a change. That is how phone-data.js, instantly-data.js and
   apollo-data.js — the three generated snapshots the Sales OS renders — would have gone
   permanently stale on the first load, defeating the entire point of regenerating them.
   Seed a new ref with ?v=0 and this stamper will hash it from then on. */
const UNSTAMPED = /\s(?:href|src|data-src)="([^"?#:]+\.(?:css|js))"/g;

const hashes = new Map();
function hashOf(file) {
  if (!hashes.has(file)) {
    hashes.set(file, createHash("sha256").update(readFileSync(file)).digest("hex").slice(0, 8));
  }
  return hashes.get(file);
}

let stale = 0;
let missing = 0;
let unstamped = 0;

/* Sales OS deploys two ways: as /sales/ on the main site, AND as its own standalone
   Cloudflare Pages project (root dir = sales/). A standalone deploy cannot reach
   ../tokens.css, so Sales OS links a LOCAL sales/tokens.css that is a build-managed
   mirror of the canonical tokens.css. Edit tokens.css; the build syncs the mirror.
   --check fails on drift so a stale mirror can't ship. */
{
  const canon = readFileSync(join(ROOT, "tokens.css"));
  const mirrorPath = join(ROOT, "sales", "tokens.css");
  const mirror = existsSync(mirrorPath) ? readFileSync(mirrorPath) : null;
  if (!mirror || !canon.equals(mirror)) {
    if (CHECK) {
      console.error("✗ Token mirror: sales/tokens.css is out of date with tokens.css. Run the build to sync.");
      stale++;
    } else {
      writeFileSync(mirrorPath, canon);
      console.log("• Synced sales/tokens.css from canonical tokens.css");
    }
  }
}

for (const page of PAGES) {
  const pagePath = join(ROOT, page);
  if (!existsSync(pagePath)) {
    console.error(`✗ Cache stamp: entry point not found: ${page}`);
    missing++;
    continue;
  }

  const html = readFileSync(pagePath, "utf8");

  /* Catch refs that carry no ?v= at all, before stamping the ones that do. These are
     invisible to REF and would ship immutable-for-a-year with no way to bust them. */
  UNSTAMPED.lastIndex = 0;
  for (let m; (m = UNSTAMPED.exec(html)) !== null;) {
    console.error(`✗ Cache stamp: ${page} references ${m[1]} with no ?v=. `
      + `_headers ships it immutable for a year, so it can never be updated. Add ?v=0 and rebuild.`);
    unstamped++;
  }

  const next = html.replace(REF, (whole, attr, ref, token) => {
    // Resolve the reference the way the browser does: relative to the page's own
    // directory. index.html declares <base href="/">, so it resolves from the root.
    const base = page === "index.html" ? ROOT : dirname(pagePath);
    const target = resolve(base, ref);

    if (!existsSync(target)) {
      console.error(`✗ Cache stamp: ${page} references a missing file: ${ref}`);
      missing++;
      return whole;
    }

    const want = hashOf(target);
    if (token !== want) {
      stale++;
      console.error(`${CHECK ? "✗" : "•"} ${page}: ${ref} ?v=${token} -> ?v=${want}`);
    }
    return `${attr}${ref}?v=${want}"`;
  });

  if (!CHECK && next !== html) writeFileSync(pagePath, next);
}

/* Every local raster is rewritten into a <picture> with a .webp <source> at render time
   (see webpify in app.js). Once a browser matches that <source>, a missing .webp is a
   BROKEN IMAGE, not a fallback to the original - so the sibling is a hard requirement.
   Checked by walking assets/ rather than by scanning references, because some paths are
   built dynamically (assets/industry/${id}.jpg) and cannot be resolved statically. */
function walkAssets(dir, out = []) {
  if (!existsSync(dir)) return out;
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    statSync(p).isDirectory() ? walkAssets(p, out) : out.push(p);
  }
  return out;
}
// Rasters that never pass through webpify, so a .webp sibling would be dead weight.
// og-image.png is fetched by social/crawler bots via an absolute URL in <meta>, and those
// bots want a PNG - it is never rendered as an <img>.
const NO_WEBP_NEEDED = new Set(["assets/og-image.png"]);
for (const file of walkAssets(join(ROOT, "assets"))) {
  const rel = file.replace(ROOT + "/", "");
  const m = file.match(/^(.*)\.(png|jpe?g)$/i);
  if (!m || NO_WEBP_NEEDED.has(rel) || existsSync(`${m[1]}.webp`)) continue;
  console.error(`✗ Missing WebP: ${rel} has no .webp sibling (webpify would render a broken image).`);
  missing++;
}

/* The spec-sheet PDFs are the ONLY customer-facing download, and _headers ships /assets/*
   immutable for a year. That is safe for .js/.css because the stamper above changes their
   URL whenever the bytes change - the PDFs had no such stamp, so their URL was stable and
   a corrected sheet could never reach anyone who had already downloaded the old one, or
   any edge that had cached it. Found live on 2026-09-09: the absorbent sheet on the CDN
   still quoted "$250 to $350/MT" and "1-ton super sacks" hours after the corrected PDF
   was deployed, because the URL had not changed and nothing was going to revalidate it
   for a year. The href carries the hash now; the saved filename comes from `name`, so the
   query string never reaches the user's disk. */
const PDFREF = /(file:\s*")(assets\/spec-sheets\/[^"?]+\.pdf)(?:\?v=([a-f0-9]+))?(")/g;
{
  const appPath = join(ROOT, "app.js");
  const text = readFileSync(appPath, "utf8");
  const next = text.replace(PDFREF, (whole, pre, ref, token, post) => {
    const target = join(ROOT, ref);
    if (!existsSync(target)) {
      console.error(`✗ Cache stamp: app.js references a missing spec sheet: ${ref}`);
      missing++;
      return whole;
    }
    const want = hashOf(target);
    if (token !== want) {
      stale++;
      console.error(`${CHECK ? "✗" : "•"} app.js: ${ref} ?v=${token ?? "(none)"} -> ?v=${want}`);
    }
    return `${pre}${ref}?v=${want}${post}`;
  });
  if (!CHECK && next !== text) writeFileSync(appPath, next);
}

/* Referenced files must exist. data.js paths are plain strings, so a typo (a space instead
   of a hyphen) is invisible until a customer clicks it - and the SPA fallback masks the
   404 as a 200 serving index.html, which the `download` attribute then saves as a .pdf.
   Interpolated paths are skipped: they cannot be resolved without executing the renderer. */
/* The optional ?v= is not decoration: the spec-sheet PDFs are stamped just above, and a
   pattern that demanded a quote straight after the extension stopped matching them the
   moment they were - silently narrowing this check instead of failing loudly. */
const DOCREF = /["'](assets\/[^"'?]+\.(?:pdf|svg|webp|png|jpe?g))(?:\?v=[a-f0-9]*)?["']/gi;
for (const src of ["data.js", "app.js"]) {
  const p = join(ROOT, src);
  if (!existsSync(p)) continue;
  const text = readFileSync(p, "utf8");
  for (const m of text.matchAll(DOCREF)) {
    if (m[1].includes("${")) continue;
    if (!existsSync(join(ROOT, m[1]))) {
      console.error(`✗ Broken asset path: ${src} references "${m[1]}" which does not exist on disk.`);
      missing++;
    }
  }
}

/* The publish root IS the repo root, so every committed file is public. A _redirects rule
   cannot hide it (Pages serves static assets first - an internal audit doc was live in
   production on 2026-07-17 behind a rule that looked like it worked). Internal markdown
   belongs outside the repo; README.md is the only one intended to be public. */
const ALLOWED_MD = new Set(["README.md"]);
function walkMd(dir, out = []) {
  for (const name of readdirSync(dir)) {
    if (["node_modules", ".git", ".claude"].includes(name)) continue;
    const p = join(dir, name);
    if (statSync(p).isDirectory()) walkMd(p, out);
    else if (name.toLowerCase().endsWith(".md")) out.push(p.replace(ROOT + "/", ""));
  }
  return out;
}
for (const md of walkMd(ROOT)) {
  if (ALLOWED_MD.has(md)) continue;
  console.error(`✗ Internal doc in publish root: ${md} would be publicly fetchable. Move it out of the repo.`);
  missing++;
}

if (missing) {
  console.error(`\n✗ Cache stamp: ${missing} broken asset reference(s). Fix before deploying.`);
  process.exit(1);
}
if (unstamped) {
  console.error(`\n✗ Cache stamp: ${unstamped} asset(s) referenced with no ?v=. They would be `
    + `cached immutable for a year with no way to bust them. Add ?v=0 to each and rebuild.`);
  process.exit(1);
}
if (CHECK && stale) {
  console.error(`\n✗ Cache stamp: ${stale} stale token(s). Run "node scripts/stamp-assets.mjs" to fix.`);
  process.exit(1);
}
console.log(
  CHECK
    ? "✓ Cache stamp: all asset tokens match their content."
    : `✓ Cache stamp: ${stale} token(s) updated, ${hashes.size} asset(s) hashed.`
);
