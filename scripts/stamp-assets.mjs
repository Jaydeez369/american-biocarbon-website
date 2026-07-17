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
const PAGES = ["index.html", "sales/index.html", "sales/build-later.html", "sales/brandkit.html"];

// href/src="<local path>?v=<token>" -> capture path and token.
const REF = /(\s(?:href|src)=")([^"?#:]+\.(?:css|js))\?v=([^"#]*)"/g;

const hashes = new Map();
function hashOf(file) {
  if (!hashes.has(file)) {
    hashes.set(file, createHash("sha256").update(readFileSync(file)).digest("hex").slice(0, 8));
  }
  return hashes.get(file);
}

let stale = 0;
let missing = 0;

for (const page of PAGES) {
  const pagePath = join(ROOT, page);
  if (!existsSync(pagePath)) {
    console.error(`✗ Cache stamp: entry point not found: ${page}`);
    missing++;
    continue;
  }

  const html = readFileSync(pagePath, "utf8");
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

/* Referenced files must exist. data.js paths are plain strings, so a typo (a space instead
   of a hyphen) is invisible until a customer clicks it - and the SPA fallback masks the
   404 as a 200 serving index.html, which the `download` attribute then saves as a .pdf.
   Interpolated paths are skipped: they cannot be resolved without executing the renderer. */
const DOCREF = /["'](assets\/[^"'?]+\.(?:pdf|svg|webp|png|jpe?g))["']/gi;
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

if (missing) {
  console.error(`\n✗ Cache stamp: ${missing} broken asset reference(s). Fix before deploying.`);
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
