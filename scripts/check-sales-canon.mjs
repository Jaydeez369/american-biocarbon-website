#!/usr/bin/env node
/**
 * Sales OS canon gate.
 *
 * The Sales OS drifted three separate times in ways nobody noticed until someone went
 * looking: a roster ICP vocabulary that no campaign used, a campaign list with no companies
 * behind it, a biochar price restated in four files, and a generated roster that had not
 * been rebuilt since its source CSVs changed. Each of those is cheap to detect and
 * expensive to find by hand, so they are assertions now.
 *
 * Checks:
 *   1. Every ICP a roster company is filed under exists as a campaign.
 *   2. roster-data.js is current with its generator (no stale committed build).
 *   3. Product facts in OUTREACH.facts match website/data.js, the live checkout.
 *   4. Effort allocation across all campaigns sums to 100.
 *   5. Derived counts on window.ROSTER match the array beneath them.
 *
 * Reports but does not fail on: campaigns with no companies. A campaign can legitimately be
 * written before its list is built, and the UI already says so loudly on the page.
 *
 * Run: node scripts/check-sales-canon.mjs
 */
import { readFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { execFileSync } from "node:child_process";
import vm from "node:vm";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const load = (file, expr, sandbox = { window: {} }) => {
  vm.createContext(sandbox);
  vm.runInContext(readFileSync(join(ROOT, file), "utf8"), sandbox, { filename: file });
  return vm.runInContext(expr, sandbox);
};

let fail = 0;
const bad = m => { console.error(`✗ ${m}`); fail++; };
const ok = m => console.log(`✓ ${m}`);

const OUTREACH = load("sales/outreach-data.js", "OUTREACH", {});
const ROSTER = load("sales/roster-data.js", "window.ROSTER");
const SITE = load("data.js", "typeof DATA !== 'undefined' ? DATA : null", { window: {} });

const icps = OUTREACH.tracks.flatMap(t => t.icps);
const tags = new Set(icps.map(i => i.tag));

/* ---- 1. no company filed under an ICP that has no campaign ---- */
const orphans = [...new Set(ROSTER.companies.map(c => c.icp).filter(Boolean))].filter(t => !tags.has(t));
if (orphans.length) bad(`Roster ICPs with no campaign: ${orphans.join(", ")}. Map them in scripts/build-roster.mjs or add the ICP.`);
else ok(`Every roster ICP maps to a campaign (${tags.size} campaigns, ${ROSTER.count} companies).`);

/* ---- 2. the committed roster is what the generator produces right now ---- */
const before = readFileSync(join(ROOT, "sales/roster-data.js"), "utf8");
execFileSync(process.execPath, [join(ROOT, "scripts/build-roster.mjs")], { stdio: "pipe" });
const after = readFileSync(join(ROOT, "sales/roster-data.js"), "utf8");
if (before !== after) bad(`roster-data.js was stale and has been regenerated. Commit the new file. (This is exactly how 13 researched companies stayed invisible.)`);
else ok(`roster-data.js is current with its sources.`);

/* ---- 3. facts agree with the live checkout ---- */
const F = OUTREACH.facts;
const priceOf = re => {
  const m = readFileSync(join(ROOT, "data.js"), "utf8").match(re);
  return m ? +m[1] : null;
};
const sitePrices = [...readFileSync(join(ROOT, "data.js"), "utf8").matchAll(/price:\s*(\d+),\s*priceLabel:\s*"\$(\d+) \/ metric ton"/g)]
  .map(m => +m[1]);
if (!sitePrices.length) bad(`Could not read any metric ton price out of website/data.js. The gate cannot verify facts.`);
else {
  const uniq = [...new Set(sitePrices)].sort((a, b) => a - b);
  const expected = [F.absorbentMt, F.biocharMt].sort((a, b) => a - b);
  if (JSON.stringify(uniq) !== JSON.stringify(expected))
    bad(`OUTREACH.facts prices ${expected.join("/")} do not match the live site prices ${uniq.join("/")}. website/data.js is the source of truth for what checkout charges.`);
  else ok(`Product prices match the live checkout (${uniq.map(p => "$" + p).join(", ")} per metric ton).`);
}

/* ---- 4. effort sums to 100 ---- */
const effort = icps.reduce((a, i) => a + (i.campaign?.effort ?? 0), 0);
if (effort !== 100) bad(`Campaign effort sums to ${effort}, not 100. Rebalance campaign.effort across the ICPs.`);
else ok(`Campaign effort allocation sums to 100 across ${icps.length} campaigns.`);

/* ---- 5. derived counts match the data ---- */
const live = ROSTER.companies.filter(c => !c.dead).length;
if (ROSTER.count !== ROSTER.companies.length) bad(`ROSTER.count says ${ROSTER.count}, array holds ${ROSTER.companies.length}.`);
else if (ROSTER.live !== live) bad(`ROSTER.live says ${ROSTER.live}, ${live} companies are actually live.`);
else ok(`Roster counts are derived and correct (${ROSTER.count} total, ${ROSTER.live} live).`);

/* ---- report only ---- */
const empty = [...tags].filter(t => !ROSTER.byIcp[t]);
if (empty.length) console.log(`• ${empty.length} campaign(s) written with no companies on the list: ${empty.join(", ")}. Not a failure, but they cannot send.`);
const unverified = ROSTER.companies.filter(c => !c.dead && c.verify !== "verified").length;
console.log(`• ${unverified} live rows are not desk verified. They are labelled as such in the roster table.`);

if (fail) { console.error(`\n${fail} canon check(s) failed.`); process.exit(1); }
console.log("\n✓ Sales OS canon: consistent.");
