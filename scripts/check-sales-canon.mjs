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
 *   3. Product facts and UNITS in OUTREACH.facts match website/data.js, the live checkout.
 *   4. Effort allocation across all campaigns sums to 100.
 *   5. Derived counts on window.ROSTER match the array beneath them.
 *   6. Every generated snapshot is fresh enough to be worth showing.
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
/* Units are NOT interchangeable and the site is the authority on both: biochar is priced
   per METRIC ton, absorbents per US ton in 2,000 lb super sacks. A gate that reads only
   "/ metric ton" is how the absorbent line silently carried the wrong unit, so both the
   number and its unit are asserted here. */
const siteJs = readFileSync(join(ROOT, "data.js"), "utf8");
const priced = [...siteJs.matchAll(/id:"([\w-]+)"[\s\S]{0,900}?priceLabel:\s*"\$(\d+) \/ (metric ton|US ton)"/g)]
  .map(m => ({ id: m[1], price: +m[2], unit: m[3] }));
const expectUnit = id => (/biochar/.test(id) ? "metric ton" : "US ton");
if (!priced.length) bad(`Could not read any priced SKU out of website/data.js. The gate cannot verify facts.`);
else {
  const wrongUnit = priced.filter(p => p.unit !== expectUnit(p.id));
  if (wrongUnit.length)
    bad(`Wrong unit on ${wrongUnit.map(p => `${p.id} ($${p.price} / ${p.unit}, expected ${expectUnit(p.id)})`).join("; ")}. Biochar is metric tons; absorbents are US tons.`);
  else ok(`Every priced SKU carries its correct unit (${priced.map(p => `${p.id} $${p.price}/${p.unit}`).join(", ")}).`);

  const siteBiochar = [...new Set(priced.filter(p => expectUnit(p.id) === "metric ton").map(p => p.price))];
  const siteAbsorb  = [...new Set(priced.filter(p => expectUnit(p.id) === "US ton").map(p => p.price))];
  if (siteBiochar.length !== 1 || siteAbsorb.length !== 1)
    bad(`website/data.js prices are not internally consistent: biochar ${siteBiochar.join("/")}, absorbents ${siteAbsorb.join("/")}.`);
  else if (F.biocharMt !== siteBiochar[0] || F.absorbentUsTon !== siteAbsorb[0])
    bad(`OUTREACH.facts (biochar ${F.biocharMt}/MT, absorbent ${F.absorbentUsTon}/US ton) do not match the live site (biochar ${siteBiochar[0]}, absorbent ${siteAbsorb[0]}). website/data.js is the source of truth for what checkout charges.`);
  else ok(`Product prices match the live checkout (biochar $${siteBiochar[0]}/metric ton, absorbents $${siteAbsorb[0]}/US ton).`);

  /* The super sack is the package, not the priced unit, but a wrong sack weight is the same
     error wearing a different hat, so it is asserted too. */
  const sacks = [...new Set([...siteJs.matchAll(/([\d,]+) lb super sacks/g)].map(m => m[1]))];
  if (sacks.length !== 1 || +sacks[0].replace(/,/g, "") !== F.superSackLb)
    bad(`Super sack weight on the site (${sacks.join("/") || "none"} lb) does not match OUTREACH.facts.superSackLb (${F.superSackLb}).`);
  else ok(`Absorbent packaging is consistent (${sacks[0]} lb super sacks = 1 US ton).`);
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

/* ---- 6. generated snapshots are fresh ----
   Sales OS is static: no fetch() anywhere in it, so every number on every screen is a dated
   read written to a file ahead of time. The failure mode is silent and it bit on 2026-08-24,
   when the Instantly panel still said one campaign was launched a week after nine went live.
   A stale snapshot looks exactly like a fresh one on screen, so the staleness has to be
   asserted here instead. Budgets differ because the underlying systems move at different
   speeds: campaigns and calls change daily, Apollo spend only changes on a reveal run. */
const SNAPSHOTS = [
  { file: "sales/instantly-data.js", global: "INSTANTLY_LIVE", days: 2, what: "campaigns, sends and mailboxes" },
  { file: "sales/phone-data.js", global: "PHONE", days: 3, what: "dials, queue and transfer rules" },
  { file: "sales/apollo-data.js", global: "APOLLO_LIVE", days: 14, what: "credit spend against the written ceiling" },
  /* crumble-data.js was removed with the Crumble Blitz section on 2026-08-31 (IA v7). The
     push it tracked is over, and the file was 14,940 lines shipped to every user on every
     load. Its check is deleted rather than relaxed: a snapshot gate for a file that should
     not exist would fail forever and train people to ignore the gate. Both the data and the
     module are in git history if the push comes back. */
];
const todayMs = Date.now();
for (const snap of SNAPSHOTS) {
  let data;
  try { data = load(snap.file, `window.${snap.global}`); } catch { data = null; }
  if (!data) {
    bad(`${snap.file} is missing or does not define window.${snap.global}. Run sales-department/refresh-snapshots.sh.`);
    continue;
  }
  const stamp = data.readDate || (data.read || "").slice(0, 10);
  const age = Math.floor((todayMs - Date.parse(stamp)) / 86400000);
  if (!stamp || Number.isNaN(age)) {
    bad(`${snap.file} carries no readable date. Run sales-department/refresh-snapshots.sh.`);
  } else if (age > snap.days) {
    bad(`${snap.file} is ${age} days old (budget ${snap.days}); it shows ${snap.what}. Run sales-department/refresh-snapshots.sh.`);
  } else {
    ok(`${snap.file} is ${age === 0 ? "current" : `${age} day(s) old`}, inside its ${snap.days}-day budget.`);
  }
}

/* ---- report only ---- */
const empty = [...tags].filter(t => !ROSTER.byIcp[t]);
if (empty.length) console.log(`• ${empty.length} campaign(s) written with no companies on the list: ${empty.join(", ")}. Not a failure, but they cannot send.`);
const unverified = ROSTER.companies.filter(c => !c.dead && c.verify !== "verified").length;
console.log(`• ${unverified} live rows are not desk verified. They are labelled as such in the roster table.`);

if (fail) { console.error(`\n${fail} canon check(s) failed.`); process.exit(1); }
console.log("\n✓ Sales OS canon: consistent.");
