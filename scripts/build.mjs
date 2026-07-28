#!/usr/bin/env node
/**
 * Deploy build. Static site, so this is verification + stamping, not bundling.
 * Point the Cloudflare Pages build command at this file: `node scripts/build.mjs`
 *
 *   1. check-dashes      - brand kit gate (fails the deploy on em/en dashes)
 *   2. build-spec-sheets - same gate, applied to the text inside the shipped PDFs
 *   3. stamp-assets      - rewrite ?v= tokens to content hashes
 *   4. prerender         - write per-route static metadata snapshots for crawlers
 *
 * Order matters: stamping hashes the files check-dashes may have rejected, so the
 * gate runs first and a failed gate stops the deploy before anything is rewritten;
 * prerender runs last so its snapshots copy the already-stamped index.html.
 *
 * build-spec-sheets runs in --check mode only. It needs poppler to read the PDFs and
 * Chrome to write them, neither of which the Cloudflare image has, so it degrades to a
 * no-op there; regenerating the PDFs is a local step (npm run spec-sheets).
 */
import { spawnSync } from "node:child_process";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const HERE = dirname(fileURLToPath(import.meta.url));

const STEPS = [
  ["check-dashes.mjs"],
  ["build-spec-sheets.mjs", "--check"],
  ["stamp-assets.mjs"],
  ["prerender.mjs"],
];

for (const [step, ...args] of STEPS) {
  const { status } = spawnSync(process.execPath, [join(HERE, step), ...args], { stdio: "inherit" });
  if (status !== 0) {
    console.error(`\n✗ Build failed at ${step}.`);
    process.exit(status ?? 1);
  }
}
console.log("\n✓ Build complete.");
