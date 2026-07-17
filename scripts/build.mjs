#!/usr/bin/env node
/**
 * Deploy build. Static site, so this is verification + stamping, not bundling.
 * Point the Cloudflare Pages build command at this file: `node scripts/build.mjs`
 *
 *   1. check-dashes  - brand kit gate (fails the deploy on em/en dashes)
 *   2. stamp-assets  - rewrite ?v= tokens to content hashes
 *
 * Order matters: stamping hashes the files check-dashes may have rejected, so the
 * gate runs first and a failed gate stops the deploy before anything is rewritten.
 */
import { spawnSync } from "node:child_process";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const HERE = dirname(fileURLToPath(import.meta.url));

for (const step of ["check-dashes.mjs", "stamp-assets.mjs"]) {
  const { status } = spawnSync(process.execPath, [join(HERE, step)], { stdio: "inherit" });
  if (status !== 0) {
    console.error(`\n✗ Build failed at ${step}.`);
    process.exit(status ?? 1);
  }
}
console.log("\n✓ Build complete.");
