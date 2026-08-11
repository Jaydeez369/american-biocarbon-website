#!/usr/bin/env node
/**
 * Generate sales/roster-data.js from the prospecting roster CSVs.
 *
 * The roster is the output of the desk-research pass in handoff/: every company triaged,
 * assigned an ICP, geo-verified against the freight ring, and scored. It is still being
 * extended (the absorbent half is written by a separate session), so this is a GENERATOR,
 * never a file to hand-edit. Re-run it and commit the result whenever the CSVs change:
 *
 *     node scripts/build-roster.mjs
 *
 * Hand-editing sales/roster-data.js would be silently reverted by the next run, which is
 * exactly the failure mode hubspot-data.js has (its "178" and sync date are hardcoded and
 * drift from the array beneath them).
 *
 * Input : handoff/roster-organized-WORKING.csv     (biochar + absorbent, 18 columns)
 *         handoff/absorbent-roster-WORKING.csv     (absorbent, + 4 Apollo contact columns)
 * Output: website/sales/roster-data.js  ->  window.ROSTER
 */
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const HERE = dirname(fileURLToPath(import.meta.url));
const SITE = join(HERE, "..");
const REPO = join(SITE, "..");

const SOURCES = [
  join(REPO, "handoff", "roster-organized-WORKING.csv"),
  join(REPO, "handoff", "absorbent-roster-WORKING.csv"),
];

/* RFC4180-ish parser. Hand-rolled because the roster's free-text columns (WhatTheyDo,
   ScoreReason) contain commas, escaped double quotes and newlines inside quoted fields,
   and a naive split(",") silently shifts every column after the first offender. */
function parseCSV(text) {
  const rows = [];
  let row = [], field = "", inQ = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (inQ) {
      if (c === '"') {
        if (text[i + 1] === '"') { field += '"'; i++; }
        else inQ = false;
      } else field += c;
    } else if (c === '"') inQ = true;
    else if (c === ",") { row.push(field); field = ""; }
    else if (c === "\n") { row.push(field); rows.push(row); row = []; field = ""; }
    else if (c !== "\r") field += c;
  }
  if (field.length || row.length) { row.push(field); rows.push(row); }
  return rows.filter(r => r.some(x => x.trim()));
}

const clean = s => String(s == null ? "" : s).replace(/\s+/g, " ").trim();
const int = s => { const n = parseInt(String(s).replace(/[^\d-]/g, ""), 10); return Number.isFinite(n) ? n : null; };

/* ICP code -> readable label. Codes come from handoff/ROSTER-EXPANSION-PROGRESS.md and
   sales-department/campaigns/biochar/README.md; keep both in sync with this map. */
const ICP_LABEL = {
  "BC-COMP":  "Commercial Composters",
  "BC-BLEND": "Soil & Media Blenders",
  "BC-NURS":  "Landscape & Nursery Supply",
  "BC-RANCH": "Ranchers, Livestock & Poultry",
  "BC-DIST":  "Ag Input Distributors & Co-ops",
  "AB-SPILL": "Spill Response & Remediation",
  "AB-OG":    "Oil & Gas Services",
  "AB-HDD":   "HDD & Utility Boring",
  "AB-LF":    "Landfills & Public Works",
  "AB-RESELL":"Absorbent Resellers & Distribution",
  "AB-BED":   "Animal Bedding Distributors",
};

/* Retired codes folded into their replacement. AB-DIST was retired in favour of AB-RESELL
   (see handoff/ABSORBENT-ROSTER-PROGRESS.md, "ICP code reconciliation - DECIDED"): exactly
   one reseller code is alive. The organized CSV still carries two AB-DIST rows (Andikem and
   Ashburn Chemical) that the progress log says to re-code on merge, so the migration is
   applied here rather than waiting for someone to hand-edit the CSV. Doing it in the
   generator means it stays applied every time the roster is rebuilt. */
const ICP_MIGRATE = { "AB-DIST": "AB-RESELL" };

const companies = new Map();   // norm(name) -> record, so the two CSVs merge instead of doubling
const norm = s => clean(s).toLowerCase().replace(/[^\w\s]/g, " ").replace(/\s+/g, " ").trim();

let seen = 0, skipped = 0, migrated = 0;
const sourcesUsed = [];

for (const path of SOURCES) {
  if (!existsSync(path)) { console.log(`  - ${path.split("/").pop()} not present, skipping`); continue; }
  const rows = parseCSV(readFileSync(path, "utf8"));
  if (!rows.length) continue;
  const head = rows[0].map(clean);
  const idx = Object.fromEntries(head.map((h, i) => [h, i]));
  const get = (r, k) => clean(r[idx[k]]);
  sourcesUsed.push({ file: path.split("/").pop(), rows: rows.length - 1 });

  for (const r of rows.slice(1)) {
    const name = get(r, "Company");
    if (!name) { skipped++; continue; }
    seen++;
    const key = norm(name);
    const line = get(r, "Line");
    const rawIcp = get(r, "ICP");
    const icp = ICP_MIGRATE[rawIcp] || rawIcp;
    if (ICP_MIGRATE[rawIcp]) migrated++;
    /* "DEAD" in the Line column is the researcher's kill flag, and the reason lives in
       ScoreReason. Carried through as a real status rather than dropped, so a rep who
       looks a killed company up finds the reason instead of re-researching it. */
    const dead = /^dead$/i.test(line) || icp === "-";
    const rec = {
      name,
      line:   dead ? "DEAD" : line,
      icp:    dead ? "" : icp,
      icpLabel: dead ? "" : (ICP_LABEL[icp] || ""),
      segment: get(r, "Segment"),
      city:   get(r, "City"),
      state:  get(r, "State"),
      crowMi: int(get(r, "CrowMi")),
      driveMi: int(get(r, "EstDriveMi")),
      geo:    get(r, "GeoVerdict"),
      website: get(r, "Website"),
      what:   get(r, "WhatTheyDo"),
      why:    get(r, "WhyTheyFit"),
      titles: get(r, "LikelyTitles"),
      score:  int(get(r, "Score")),
      scoreWhy: get(r, "ScoreReason"),
      trigger: get(r, "Trigger"),
      sourceUrl: get(r, "SourceURL"),
      iter:   get(r, "AddedIter"),
      dead,
    };
    // absorbent CSV only: Apollo contact discovery columns
    if (idx.ApolloContactCount !== undefined) {
      const n = int(get(r, "ApolloContactCount"));
      if (n !== null) rec.apolloContacts = n;
      const t = get(r, "ContactTitles");       if (t) rec.contactTitles = t;
      const nm = get(r, "ContactNamesFreeTier"); if (nm) rec.contactNames = nm;
      const cn = get(r, "ContactNotes");        if (cn) rec.contactNotes = cn;
    }
    /* Later file wins on conflict, but only for fields it actually filled. The absorbent
       CSV re-states companies already in the organized roster and adds contact columns; a
       blind overwrite would blank the research text those rows leave empty. */
    if (companies.has(key)) {
      const prev = companies.get(key);
      for (const [k, v] of Object.entries(rec)) {
        if (v !== "" && v !== null && v !== undefined) prev[k] = v;
      }
    } else companies.set(key, rec);
  }
}

const list = [...companies.values()].sort((a, b) =>
  (b.score ?? -1) - (a.score ?? -1) || a.name.localeCompare(b.name));

/* Counts are DERIVED, never written by hand. hubspot-data.js hardcodes its total and it has
   already drifted from the array below it; this file must not repeat that. */
const byIcp = {};
const byLine = {};
for (const c of list) {
  if (c.icp) byIcp[c.icp] = (byIcp[c.icp] || 0) + 1;
  byLine[c.line || "?"] = (byLine[c.line || "?"] || 0) + 1;
}
const live = list.filter(c => !c.dead);

const out = `/* ===== VEJ Sales OS - PROSPECTING ROSTER (GENERATED, DO NOT EDIT) =====
   Generated by scripts/build-roster.mjs from the handoff CSVs.
   Re-run \`node scripts/build-roster.mjs\` and commit the result when the roster changes.
   Hand edits are silently lost on the next run.

   ${list.length} companies (${live.length} live, ${list.length - live.length} killed with a written reason).
   Sources: ${sourcesUsed.map(s => `${s.file} (${s.rows} rows)`).join(", ")}
   ===================================================================== */
window.ROSTER = {
  count: ${list.length},
  live: ${live.length},
  dead: ${list.length - live.length},
  byIcp: ${JSON.stringify(byIcp)},
  byLine: ${JSON.stringify(byLine)},
  icpLabels: ${JSON.stringify(ICP_LABEL, null, 2).replace(/\n/g, "\n  ")},
  companies: [
${list.map(c => "    " + JSON.stringify(c)).join(",\n")}
  ],
};
`;

const dest = join(SITE, "sales", "roster-data.js");
writeFileSync(dest, out);
console.log(`✓ Roster: ${list.length} companies (${live.length} live, ${list.length - live.length} dead) -> sales/roster-data.js`);
console.log(`  rows read ${seen}, blank skipped ${skipped}, deduped to ${list.length}, ICP codes migrated ${migrated}`);
console.log(`  by ICP: ${Object.entries(byIcp).sort((a, b) => b[1] - a[1]).map(([k, v]) => `${k} ${v}`).join(", ")}`);
