#!/usr/bin/env node
// Fails if the retired brand name appears anywhere outside the reviewed allowlist.
// Allowlist entries are file paths (relative to website/) that legitimately keep a
// legacy reference (legal entity, certification holder, redirect map). Keep it short.
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(fileURLToPath(import.meta.url), '..', '..');
const SKIP_DIRS = new Set(['node_modules', '.git', 'dist', '.wrangler']);
const SKIP_EXT = /\.(png|jpe?g|webp|gif|ico|pdf|woff2?|ttf|mp4|zip)$/i;
const ALLOW = new Set([
  // Frozen scraped HubSpot/roster records (real email subjects, file names, account names); not rewritten.
  'sales/hubspot-comms.js', 'sales/hubspot-data.js', 'sales/roster-data.js',
  // Print templates carry the legal entity footer; keep until the new legal entity exists.
  'spec-templates/absorbent-pellets.html', 'spec-templates/biochar-premium.html',
]);
// Prose name only. Hostnames (americanbiocarbon.com) and CDN file names stay until the
// domain cutover; list them with --hosts. Legal entity lines are tracked in REBRAND-REVIEW.md.
const HOSTS = process.argv.includes('--hosts');
const BAD = HOSTS ? /americanbiocarbon/i : /american\s+bio\s*carbon/i;
const LEGAL = /CT, LLC|^\s*legal:\s*"American BioCarbon"/; // legal entity lines, tracked in REBRAND-REVIEW.md

const hits = [];
// Scope: the Sales OS and the system messaging only. The public site keeps its brand until cutover.
const SCOPE = ['sales', 'functions'];
function walk(dir) {
  for (const name of readdirSync(dir)) {
    if (SKIP_DIRS.has(name)) continue;
    const p = join(dir, name);
    const st = statSync(p);
    if (st.isDirectory()) { walk(p); continue; }
    if (SKIP_EXT.test(name)) continue;
    const rel = relative(root, p);
    if (ALLOW.has(rel)) continue;
    readFileSync(p, 'utf8').split('\n').forEach((line, i) => {
      if (BAD.test(line) && !(LEGAL.test(line) && !HOSTS)) hits.push(`${rel}:${i + 1}: ${line.trim().slice(0, 100)}`);
    });
  }
}
SCOPE.forEach((d) => walk(join(root, d)));

if (hits.length) {
  console.error(`check-brand: ${hits.length} legacy brand reference(s)\n` + hits.join('\n'));
  process.exit(1);
}
console.log('check-brand: clean');
