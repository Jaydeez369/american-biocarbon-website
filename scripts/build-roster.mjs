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
 * Inputs, in precedence order. Later sources only fill fields earlier ones left empty, so
 * desk research always beats an import:
 *   1. handoff/roster-organized-WORKING.csv   desk research, biochar + absorbent
 *   2. handoff/absorbent-roster-WORKING.csv   desk research, + Apollo contact columns
 *   3. handoff/absorbent-roster-DR15.csv      desk research, latest absorbent pass
 *   4. sales/hubspot-data.js                  the live CRM. Real relationships, and the
 *                                             single biggest source of companies that were
 *                                             missing from the roster: 172 of its 178
 *                                             accounts appeared nowhere in the CSVs, so the
 *                                             roster table was hiding every company Victor
 *                                             had actually already talked to.
 *   5. handoff/roster-source-flat.csv         the original flat sheet, for stragglers only
 *   6. handoff/biochar-500mi-geo-audit.csv    geo audit, for stragglers only
 *
 * Every record carries `origin` (where it came from) and `verify` (how much is actually
 * known about it) plus `needs`, the explicit list of what is missing. "Verified" here means
 * desk verified: a real website, a geo verdict, a score and written reasoning. It does NOT
 * mean anyone phoned them. Rows imported from the CRM or the flat sheet arrive as
 * `unverified` on purpose, so nobody mistakes an import for research.
 *
 * Output: website/sales/roster-data.js  ->  window.ROSTER
 */
import { readFileSync, writeFileSync, existsSync, readdirSync } from "node:fs";
import { join, dirname } from "node:path";
import vm from "node:vm";
import { fileURLToPath } from "node:url";

const HERE = dirname(fileURLToPath(import.meta.url));
const SITE = join(HERE, "..");
const REPO = join(SITE, "..");

/* Sources are DISCOVERED, not listed. The handoff directory is written by other sessions
   while this one runs: absorbent-roster-WORKING.csv grew twice during this build and
   R6-LDEQ-solid-waste-candidates.csv appeared partway through. A hardcoded list of three
   paths means every new research file is invisible until someone remembers to add it, which
   is how 13 companies sat in a CSV and never reached the tool.

   Each CSV is classified by its header instead:
     research  - Company + Line + ICP, the full desk schema
     flat      - Company + Seg, the original target sheet
     geoaudit  - Company + Verdict, the 500 mile audit
     ldeq      - FacilityName + Parish, the Louisiana DEQ regulatory extract
   An unrecognised shape is reported and skipped rather than guessed at. */
function classify(head) {
  const h = new Set(head);
  if (h.has("Company") && h.has("ICP") && h.has("Why") && h.size === 3) return "assign";
  if (h.has("Company") && h.has("RoadMi") && h.has("Tier")) return "disttier";
  if (h.has("Company") && h.has("Reason") && h.size === 2) return "kill";
  if (h.has("Company") && h.has("Website") && h.has("Source") && h.size === 3) return "domain";
  if (h.has("Company") && h.has("Line") && h.has("ICP")) return "research";
  if (h.has("FacilityName") && h.has("Parish")) return "ldeq";
  if (h.has("Company") && h.has("Verdict")) return "geoaudit";
  if (h.has("Company") && h.has("Seg")) return "flat";
  return null;
}

const HUBSPOT_FILE = join(SITE, "sales", "hubspot-data.js");
/* Scanned for companies the desk research never captured. These sheets also contain prose
   rows, section headers and notes in the Company column, so everything here is filtered
   through looksLikeCompany() before it is allowed to become a lead. */

/* Contact details arrive as free text in ContactNotes, e.g.
     "Odessa branch: 2500 W Murphy St; Tel: 1-866-450-9077; Email: ar@hullsenvironmental.com"
   Parsed into real fields so the table can show phone and email columns and a rep can dial
   from the row. The raw string is kept as well: it carries branch addresses and context that
   no schema anticipated, and throwing it away to keep only what parsed would lose research. */
function parseContactNotes(s) {
  const out = { phones: [], emails: [], raw: s || "" };
  if (!s) return out;
  for (const m of s.matchAll(/[\w.+-]+@[\w-]+\.[\w.]+/g)) out.emails.push(m[0].replace(/[.;,]$/, ""));
  /* Phones: tolerate 1-800-, (724) 941-9645, 618-397-1234 and 609.397.0807. Anchored on a
     10-digit shape so street numbers and zips in the same string are not read as numbers. */
  for (const m of s.matchAll(/(?:\+?1[\s.-]?)?(?:\(\d{3}\)|\d{3})[\s.-]?\d{3}[\s.-]?\d{4}\b/g)) {
    const p = m[0].trim().replace(/\s+/g, " ");
    if (!out.phones.includes(p)) out.phones.push(p);
  }
  return out;
}

/* "Raymond P. Crawford Jr. - President - Pittsburgh PA; Ray P. Crawford Sr. - Founder - ..."
   Free-tier Apollo output: names and titles only, never a revealed email or phone. */
function parsePeople(s) {
  if (!s) return [];
  return s.split(";").map(x => x.trim()).filter(Boolean).map(chunk => {
    const parts = chunk.split(/\s+-\s+/).map(x => x.trim());
    return { name: parts[0] || "", title: parts[1] || "", loc: parts[2] || "" };
  }).filter(p => p.name);
}

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
/* Domains are the join key between this file and the enrichment rosters. Strip scheme,
   www and any path, and reject anything that is not a bare hostname -- one roster row
   carries "livingearth.net (verify, see note)" in its website field, which must not
   silently become a domain. */
const normDomain = w => {
  const d = String(w == null ? "" : w).replace(/^https?:\/\//, "").replace(/^www\./, "")
    .split("/")[0].toLowerCase().trim();
  return /^[a-z0-9.-]+\.[a-z]{2,}$/.test(d) ? d : "";
};
const int = s => { const n = parseInt(String(s).replace(/[^\d-]/g, ""), 10); return Number.isFinite(n) ? n : null; };

const HANDOFF = join(REPO, "handoff");
const discovered = { research: [], flat: [], geoaudit: [], ldeq: [], assign: [], kill: [], domain: [], disttier: [], unknown: [] };
for (const f of readdirSync(HANDOFF).filter(f => f.toLowerCase().endsWith(".csv")).sort()) {
  const path = join(HANDOFF, f);
  let head = [];
  try { head = (parseCSV(readFileSync(path, "utf8"))[0] || []).map(clean); } catch (e) { continue; }
  const kind = classify(head);
  if (kind) discovered[kind].push(path); else discovered.unknown.push(f);
}
const SOURCES = discovered.research;

/* ---------------------------------------------------------------------------
   ICP TAXONOMY - read from outreach-data.js, never redeclared here.

   There used to be three ICP vocabularies in this repo: this file's ICP_LABEL map, the
   nine CMP campaign codes in gtm-data.js, and the twelve the Aug 10 call settled on. A
   company could be BC-NURS in the roster, CMP-NUR in the campaign list, and BC.NUR in the
   outreach copy, and nothing tied them together, so 82 companies sat in ICPs that had no
   campaign and 3 campaigns had no companies.

   outreach-data.js is the single source now. It defines the ICPs, their names and their
   effort weighting; this generator reads it and maps the legacy CSV codes onto it. An
   unmapped code is a hard failure rather than a silent orphan.
   --------------------------------------------------------------------------- */
const OUTREACH_FILE = join(SITE, "sales", "outreach-data.js");
const icpSandbox = { };
vm.createContext(icpSandbox);
vm.runInContext(readFileSync(OUTREACH_FILE, "utf8"), icpSandbox, { filename: "outreach-data.js" });
const OUTREACH = vm.runInContext("OUTREACH", icpSandbox);
const ICP_LABEL = {};
const ICP_TRACK = {};
for (const t of OUTREACH.tracks) for (const i of t.icps) { ICP_LABEL[i.tag] = i.name; ICP_TRACK[i.tag] = t.name; }

/* Legacy CSV code -> canonical ICP tag. The research CSVs were written before the taxonomy
   settled and are not being rewritten by hand: the mapping lives here so re-running the
   generator keeps applying it. AB-DIST was already folded into AB-RESELL by an earlier
   reconciliation; both now land on AB.DIST, the absorbent distributor campaign. */
const ICP_MIGRATE = {
  "BC-COMP": "BC.COMP",
  "BC-BLEND": "BC.BLEND",
  "BC-NURS": "BC.NUR",
  "BC-RANCH": "BC.RANCH",
  "BC-DIST": "BC.DIST",
  "BC-FARM": "BC.FARM",
  "AB-SPILL": "AB.ENV",
  "AB-OG": "AB.OG",
  "AB-HDD": "AB.HDD",
  "AB-LF": "AB.LF",
  "AB-CIVIL": "AB.CIVIL",
  "AB-MUNI": "AB.MUNI",
  "AB-RESELL": "AB.DIST",
  "AB-DIST": "AB.DIST",
  "AB-BED": "AB.BED",
};
const unmappedIcps = new Set();

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
    if (ICP_MIGRATE[rawIcp] && ICP_MIGRATE[rawIcp] !== rawIcp) migrated++;
    if (icp && icp !== "-" && !ICP_LABEL[icp]) unmappedIcps.add(rawIcp);
    /* "DEAD" in the Line column is the researcher's kill flag, and the reason lives in
       ScoreReason. Carried through as a real status rather than dropped, so a rep who
       looks a killed company up finds the reason instead of re-researching it. */
    const dead = /^dead$/i.test(line) || icp === "-";
    const rec = {
      name,
      line:   dead ? "DEAD" : line,
      icp:    dead ? "" : icp,
      icpLabel: dead ? "" : (ICP_LABEL[icp] || ""),
      track: dead ? "" : (ICP_TRACK[icp] || ""),
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
      origin: "desk",
    };
    /* Absorbent has NO geographic gate. Canon: pellets and crumble ship nationwide, and only
       biochar is bound by the freight ring out of White Castle. Distance is recorded for
       sorting and freight math, never as a reason to drop an absorbent account. Flagged here
       so the UI can render an out-of-ring absorbent as neutral rather than as a red warning
       that reads "do not call this company". */
    rec.geoGates = rec.line === "Biochar";

    // absorbent CSVs only: Apollo contact-discovery columns (free tier, no revealed contacts)
    if (idx.ApolloContactCount !== undefined) {
      const n = int(get(r, "ApolloContactCount"));
      if (n !== null) rec.apolloContacts = n;
      const t = get(r, "ContactTitles");       if (t) rec.contactTitles = t;
      const nm = get(r, "ContactNamesFreeTier"); if (nm) rec.contactNames = nm;
      const cn = get(r, "ContactNotes");        if (cn) rec.contactNotes = cn;
      const people = parsePeople(get(r, "ContactNamesFreeTier"));
      if (people.length) rec.people = people;
      const pc = parseContactNotes(get(r, "ContactNotes"));
      if (pc.phones.length) rec.phones = pc.phones;
      if (pc.emails.length) rec.emails = pc.emails;
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

/* ---------------------------------------------------------------------------
   4. HUBSPOT. The CRM is a lead source, not just an overlay.

   These accounts were already rendered on the pipeline's account layer, but the company
   roster table read window.ROSTER only, so 172 companies Victor has genuinely worked never
   appeared in the one table a rep scans. They come in as real rows now, marked so nobody
   confuses a CRM import with desk research.
   --------------------------------------------------------------------------- */
let hsAdded = 0, hsMerged = 0;
if (existsSync(HUBSPOT_FILE)) {
  const sandbox = { window: {} };
  vm.createContext(sandbox);
  vm.runInContext(readFileSync(HUBSPOT_FILE, "utf8"), sandbox, { filename: "hubspot-data.js" });
  const accounts = (sandbox.window.HUBSPOT && sandbox.window.HUBSPOT.accounts) || [];
  sourcesUsed.push({ file: "hubspot-data.js", rows: accounts.length });

  for (const a of accounts) {
    const name = clean(a.name);
    if (!name) { skipped++; continue; }
    seen++;
    const key = norm(name);
    /* products -> line. An account carrying both is Biochar, matching the priority the
       Aug 10 call set: biochar first, absorbent in parallel. */
    const prods = a.products || [];
    const line = prods.some(p => /biochar|crumble/i.test(p)) ? "Biochar"
               : prods.some(p => /pellet|absorb/i.test(p)) ? "Absorbent" : "";

    if (companies.has(key)) {
      /* Already desk researched. Keep the research, graft on what only the CRM knows. */
      const prev = companies.get(key);
      prev.hubspot = true;
      if (a.hsId) prev.hsId = a.hsId;
      if (a.owner) prev.owner = a.owner;
      if (a.lastContacted) prev.lastContacted = a.lastContacted;
      if (a.hsDeals) prev.hsDeals = a.hsDeals;
      if (a.tier) prev.hsTier = a.tier;
      if (a.website && !prev.website) prev.website = a.website;
      hsMerged++;
      continue;
    }
    companies.set(key, {
      name,
      line,
      icp: "", icpLabel: "",
      segment: clean(a.industry) || "",
      city: "", state: "",
      crowMi: null, driveMi: null, geo: "",
      website: clean(a.website),
      what: "",
      /* Not invented research. This states the one thing that is actually true and is the
         reason the row matters: somebody already engaged them. */
      why: a.lastContacted
        ? `Already in the CRM. ${a.owner || "Someone"} last contacted them ${String(a.lastContacted).split("T")[0]}${prods.length ? ` about ${prods.join(" and ")}` : ""}. Warmer than anything on the cold list, and it has never been desk scored.`
        : `Already in the CRM as a ${a.type || "prospect"}${prods.length ? ` for ${prods.join(" and ")}` : ""}. No recorded contact yet and no desk research, so ICP, freight and score still need to be set.`,
      titles: "",
      score: null, scoreWhy: "", trigger: "", sourceUrl: "", iter: "",
      dead: false,
      geoGates: line === "Biochar",
      origin: "hubspot",
      hubspot: true,
      hsId: a.hsId || "",
      hsTier: a.tier || "",
      owner: a.owner || "",
      lastContacted: a.lastContacted || "",
      hsDeals: a.hsDeals || 0,
      products: prods,
    });
    hsAdded++;
  }
}

/* ---------------------------------------------------------------------------
   5 and 6. STRAGGLERS from the flat sheet and the geo audit.

   Both sheets put section headers, totals and whole paragraphs of notes in the Company
   column, so a naive read invents leads like "ON CONTACT DATA - READ THIS". Everything is
   gated on looksLikeCompany() and anything rejected is reported rather than silently
   dropped, because a real company wrongly filtered out is a lost lead.
   --------------------------------------------------------------------------- */
const PROSE = /\b(read this|uses|scored|revealed|verified|do not call|verify first|work now|apollo splits|nothing has been spent|credit|balance|tier|the actual email)\b/i;
function looksLikeCompany(n) {
  if (!n || n.length < 3 || n.length > 70) return false;
  if (/[.:]$/.test(n)) return false;               // sentence, not a name
  if (n.split(/\s+/).length > 8) return false;     // prose
  if (PROSE.test(n)) return false;
  if (!/[A-Za-z]/.test(n)) return false;
  if (/^(EFFECTIVE|USES|ON )/.test(n)) return false;
  return true;
}
const strayRejected = [];
let strayAdded = 0;
/* Sheets carry prose, section headers and notes in the Company column, so everything below
   is gated on looksLikeCompany() and every rejection is reported rather than dropped. */
const STRAGGLER_SOURCES = [
  ...discovered.flat.map(file => ({ file, origin: "sheet" })),
  ...discovered.geoaudit.map(file => ({ file, origin: "geoaudit" })),
];
for (const { file, origin } of STRAGGLER_SOURCES) {
  if (!existsSync(file)) continue;
  const rows = parseCSV(readFileSync(file, "utf8"));
  if (!rows.length) continue;
  const head = rows[0].map(clean);
  const idx = Object.fromEntries(head.map((h, i) => [h, i]));
  if (idx.Company === undefined) continue;
  const g = (r, k) => (idx[k] === undefined ? "" : clean(r[idx[k]]));
  let added = 0;
  for (const r of rows.slice(1)) {
    const name = g(r, "Company");
    if (!name) continue;
    const key = norm(name);
    if (companies.has(key)) continue;
    if (!looksLikeCompany(name)) { strayRejected.push(name); continue; }
    const seg = g(r, "Seg") || g(r, "SheetZone");
    const fit = g(r, "Product fit");
    const line = /biochar/i.test(fit) ? "Biochar" : /absorb|pellet|crumble/i.test(fit) ? "Absorbent" : "";
    companies.set(key, {
      name,
      line,
      icp: "", icpLabel: "",
      segment: seg ? `Sheet segment ${seg}` : "",
      city: g(r, "City"), state: g(r, "State"),
      crowMi: int(g(r, "CrowMi")), driveMi: int(g(r, "EstDriveMi")),
      geo: g(r, "Verdict") || "",
      website: g(r, "Website"),
      what: g(r, "What they actually do (verified)"),
      why: g(r, "Desk assessment (pre-verification)")
        || `Carried over from ${origin === "geoaudit" ? "the 500 mile geo audit" : "the original target sheet"} and never merged into the research roster. Needs an ICP, a freight verdict and a score before it can be worked.`,
      titles: g(r, "Most likely contact (title)"),
      score: int(g(r, "Desk score") || g(r, "EffScore")),
      scoreWhy: "", trigger: g(r, "Opening trigger / angle"), sourceUrl: "", iter: "",
      dead: false,
      geoGates: line === "Biochar",
      origin,
    });
    added++; strayAdded++;
  }
  sourcesUsed.push({ file: file.split("/").pop(), rows: added, strays: true });
}

/* ---------------------------------------------------------------------------
   LDEQ. The Louisiana Department of Environmental Quality solid waste facility list.

   A regulatory extract, not a prospecting list: parish, facility type, facility name and a
   permit ID, nothing else. It is worth ingesting anyway because it is an authoritative
   register of every permitted waste facility in the state, all of it inside the biochar
   freight ring, and it maps directly onto the two absorbent campaigns that had no companies
   on them at all.

   These arrive unverified with an ICP hint and nothing else. Nobody should mistake a permit
   record for a qualified lead, which is why no score is invented for them.
   --------------------------------------------------------------------------- */
const LDEQ_ICP = {
  Disposer: "AB.LF",
  Landfill: "AB.LF",
  Processor: "AB.LF",
  Transfer: "AB.LF",
};
let ldeqAdded = 0;
for (const file of discovered.ldeq) {
  const rows = parseCSV(readFileSync(file, "utf8"));
  if (!rows.length) continue;
  const head = rows[0].map(clean);
  const idx = Object.fromEntries(head.map((h, i) => [h, i]));
  const g = (r, k) => (idx[k] === undefined ? "" : clean(r[idx[k]]));
  for (const r of rows.slice(1)) {
    const name = g(r, "FacilityName");
    if (!name || !looksLikeCompany(name)) continue;
    const key = norm(name);
    if (companies.has(key)) {
      /* Already known. The permit ID is still worth grafting on: it is the identifier the
         state uses and it makes a procurement conversation much easier to open. */
      const prev = companies.get(key);
      if (!prev.permitId && g(r, "FacilityID")) prev.permitId = g(r, "FacilityID");
      continue;
    }
    const type = g(r, "FacilityType");
    const parish = g(r, "Parish");
    const icp = LDEQ_ICP[type] || "AB.LF";
    companies.set(key, {
      name,
      line: "Absorbent",
      icp, icpLabel: ICP_LABEL[icp] || "", track: ICP_TRACK[icp] || "",
      segment: `LDEQ permitted ${type || "solid waste"} facility`,
      city: "", state: "LA",
      crowMi: null, driveMi: null, geo: "",
      website: "",
      what: `Permitted solid waste ${(type || "facility").toLowerCase()} in ${parish} Parish, Louisiana. Listed on the LDEQ solid waste facility register.`,
      why: `On the state register of permitted waste facilities, in ${parish} Parish and well inside the freight ring. Solid waste sites handle liquids they have to solidify before they can place or haul them, which is the absorbent use case. This is a permit record and nothing more: no website, no contact and no score yet.`,
      titles: "Site Manager; Environmental Manager; Operations Manager; Purchasing",
      score: null, scoreWhy: "", trigger: "", sourceUrl: "", iter: "",
      dead: false,
      geoGates: false,
      origin: "ldeq",
      permitId: g(r, "FacilityID"),
      parish,
    });
    ldeqAdded++;
  }
  sourcesUsed.push({ file: file.split("/").pop(), rows: ldeqAdded, strays: true });
}

/* ---------------------------------------------------------------------------
   ICP ASSIGNMENT OVERLAY - handoff/icp-assignments.csv

   Some companies arrive with no ICP: every HubSpot import does, and so does the LDEQ
   register. Others arrive filed under an ICP that is technically right and practically
   wrong, which is the case for the nine parish owned landfills. They are landfills, so the
   CSV says AB.LF, but the buyer is a parish government purchasing on a bid, and AB.MUNI is
   the campaign written for that path.

   Those decisions are review, not research, so they do not belong in the research CSVs and
   they cannot be hand edited into roster-data.js, which is regenerated. They live in their
   own reviewable file with a written reason per row, and they are applied here so they
   survive every rebuild.

   An assignment can only ADD or CORRECT an ICP. It never revives a killed company and it
   never invents research: an assigned row keeps whatever verification state it earns.
   --------------------------------------------------------------------------- */
let assigned = 0, assignMissing = [];
for (const file of discovered.assign) {
  const rows = parseCSV(readFileSync(file, "utf8"));
  if (!rows.length) continue;
  const head = rows[0].map(clean);
  const idx = Object.fromEntries(head.map((h, i) => [h, i]));
  for (const r of rows.slice(1)) {
    const name = clean(r[idx.Company]);
    const icp = clean(r[idx.ICP]);
    const why = clean(r[idx.Why]);
    if (!name || !icp) continue;
    if (!ICP_LABEL[icp]) { unmappedIcps.add(icp); continue; }
    const rec = companies.get(norm(name));
    if (!rec) { assignMissing.push(name); continue; }
    if (rec.dead) continue;
    rec.icp = icp;
    rec.icpLabel = ICP_LABEL[icp];
    rec.track = ICP_TRACK[icp] || "";
    if (!rec.line) rec.line = /^BC\./.test(icp) ? "Biochar" : "Absorbent";
    rec.geoGates = rec.line === "Biochar";
    rec.icpAssigned = true;
    rec.icpWhy = why;
    assigned++;
  }
  sourcesUsed.push({ file: file.split("/").pop(), rows: assigned, strays: true });
}

/* ---------------------------------------------------------------------------
   DOMAIN RECOVERY OVERLAY - handoff/domain-recovery.csv

   A company with no website cannot be ICP-proven, cannot be enriched and cannot be
   written to, so it sits in the roster inflating every total while being unworkable.
   Recovering the domain is pure desk research and costs nothing, but it must not be typed
   into the research CSVs by hand -- those are the generator's input, and run 5 retired
   build-absorbent-roster.mjs precisely for destroying hand-appended rows.

   Same contract as the other overlays: one row per company, the recovered domain, and the
   evidence that found it. It only writes where there is nothing usable to lose -- a blank
   website, or one normDomain already rejects as not-a-hostname (the roster carries
   "livingearth.net (verify, see note)", which is a note to a human, not a domain). It
   never overwrites a valid website, so a recovered guess cannot displace researched data.
   --------------------------------------------------------------------------- */
let domainsRecovered = 0; const domainMissing = [];
for (const file of discovered.domain) {
  const rows = parseCSV(readFileSync(file, "utf8"));
  if (!rows.length) continue;
  const head = rows[0].map(clean);
  const idx = Object.fromEntries(head.map((h, i) => [h, i]));
  for (const r of rows.slice(1)) {
    const name = clean(r[idx.Company]);
    const site = normDomain(clean(r[idx.Website]));
    const src = clean(r[idx.Source]);
    if (!name || !site) continue;
    const rec = companies.get(norm(name));
    if (!rec) { domainMissing.push(name); continue; }
    if (rec.dead) continue;
    if (rec.website && normDomain(rec.website)) continue;   // a usable website is never overwritten
    rec.website = site;
    rec.websiteWhy = src;
    domainsRecovered++;
  }
  sourcesUsed.push({ file: file.split("/").pop(), rows: domainsRecovered, strays: true });
}
if (domainMissing.length) console.log(`  domain recovery: ${domainMissing.length} name(s) not found: ${domainMissing.slice(0, 5).join("; ")}`);
if (domainsRecovered) console.log(`  domain recovery: ${domainsRecovered} websites filled in by desk research`);

/* ---------------------------------------------------------------------------
   DISTANCE-TIER OVERLAY - handoff/absorbent-distance-tiers-<date>.csv

   Operator ruling 2026-08-17, superseding the old "no distance disqualifier" canon for
   SCORING: absorbent accounts farther than 500 road miles from White Castle are scored
   down by 2 (floor 1) and set aside for a later contact tier. Not killed, not removed.
   Distance is still not a disqualifier -- FAR is a deferral, and the freight-math note
   on each record stays true.

   The CSV is generated by handoff/build-distance-tiers.mjs (geocoded city/state,
   haversine crow miles x 1.2 road factor; per-row Method says which numbers came from
   where). Same contract as the other overlays: reviewable file, written reason per row,
   applied on every rebuild so the ruling survives regeneration. Later-dated files win
   on the same company, matching the append-only adjudication pattern.
   --------------------------------------------------------------------------- */
let tiered = 0, rescored = 0; const tierMissing = [];
for (const file of discovered.disttier.sort()) {
  const rows = parseCSV(readFileSync(file, "utf8"));
  if (!rows.length) continue;
  const head = rows[0].map(clean);
  const idx = Object.fromEntries(head.map((h, i) => [h, i]));
  for (const r of rows.slice(1)) {
    const name = clean(r[idx.Company]);
    const tier = clean(r[idx.Tier]);
    if (!name || !tier) continue;
    const rec = companies.get(norm(name));
    if (!rec) { tierMissing.push(name); continue; }
    if (rec.dead) continue;
    rec.distTier = tier;
    rec.roadMi = clean(r[idx.RoadMi]);
    rec.distMethod = clean(r[idx.Method]);
    if (tier === "FAR") {
      const oldS = int(clean(r[idx.OldScore]));
      const newS = int(clean(r[idx.NewScore]));
      if (oldS !== null && newS !== null && rec.score === oldS && newS !== oldS) {
        rec.score = newS;
        const why = clean(r[idx.Reason]);
        rec.scoreWhy = (rec.scoreWhy ? rec.scoreWhy + " " : "") + why;
        rescored++;
      }
    }
    tiered++;
  }
  sourcesUsed.push({ file: file.split("/").pop(), rows: tiered, strays: true });
}
if (tierMissing.length) console.log(`  distance tiers: ${tierMissing.length} name(s) not found: ${tierMissing.slice(0, 5).join("; ")}`);
if (tiered) console.log(`  distance tiers: ${tiered} absorbent accounts tiered, ${rescored} FAR scores lowered per the 2026-08-17 operator ruling`);

/* ---------------------------------------------------------------------------
   KILL OVERLAY - handoff/company-kills.csv

   Until run 6 the only way to kill a company was NOT_A_BUYER, a hardcoded regex over the
   NAME. That catches "casino" and "steakhouse"; it cannot express "this is a trade
   association", "this is a franchise head office" or "this sells software to oilfield
   operators but owns no equipment" -- all of which are things you only learn by reading
   the site, and all of which Apollo's keyword tagging swept into the roster.

   Same contract as the ICP overlay: a reviewable file, one written reason per row,
   applied on every rebuild so the decision survives regeneration. The row is NOT deleted.
   A row that quietly vanishes gets re-scraped and re-added on the next sourcing pass; a
   row marked dead with a reason stays dead and stays visible.
   --------------------------------------------------------------------------- */
let killed = 0; const killMissing = [];
for (const file of discovered.kill) {
  const rows = parseCSV(readFileSync(file, "utf8"));
  if (!rows.length) continue;
  const head = rows[0].map(clean);
  const idx = Object.fromEntries(head.map((h, i) => [h, i]));
  for (const r of rows.slice(1)) {
    const name = clean(r[idx.Company]);
    const reason = clean(r[idx.Reason]);
    if (!name || !reason) continue;
    const rec = companies.get(norm(name));
    if (!rec) { killMissing.push(name); continue; }
    if (rec.dead) continue;
    rec.dead = true;
    rec.line = "DEAD";
    rec.verify = "killed";
    rec.killWhy = reason;
    rec.scoreWhy = reason;
    killed++;
  }
  sourcesUsed.push({ file: file.split("/").pop(), rows: killed, strays: true });
}
if (killMissing.length) console.log(`  kill overlay: ${killMissing.length} name(s) not found: ${killMissing.slice(0, 5).join("; ")}`);
if (killed) console.log(`  kill overlay: ${killed} companies killed with a written reason`);

/* ---------- contacts actually on file, joined from the enrichment rosters ----------
   Until 2026-08-16 the only contact signal in this file was ContactNamesFreeTier, a
   frozen column of Apollo free-tier names copied off a research sheet. It says nothing
   about whether we hold a real address, so the Sales OS could show "contacts" for a
   company we cannot write to and show nothing for one we had just revealed and verified.

   ALL-{absorbent,biochar}-prospects.csv are the source of truth for contacts, and
   verification-results.csv for whether an address survived. Join them on the EMAIL
   DOMAIN, never company_name -- the same rule the gate and the enrichment scripts use,
   because names drift ("LEI, Inc. (a Triumvirate Environmental Company)") and domains
   do not.

   Built ABOVE the verification loop since 2026-08-17 (run 7): the loop's "phone or
   email" need must see joined addresses, and the city/state carried on the enrichment
   rows backfills records that have none. Before that fix a company whose join held
   verified addresses was still flagged as missing "phone or email". */
const contactsByDomain = new Map();
{
  const verdicts = new Map();
  const vPath = join(HANDOFF, "enrichment", "instantly", "verification-results.csv");
  if (existsSync(vPath)) {
    const all = parseCSV(readFileSync(vPath, "utf8"));
    const header = all[0].map(h => h.trim()), rows = all.slice(1);
    const iE = header.indexOf("email"), iS = header.indexOf("status");
    for (const r of rows) {
      const e = (r[iE] || "").toLowerCase().trim();
      /* First real verdict wins, matching ingest-verification.mjs. */
      if (e && !verdicts.has(e)) verdicts.set(e, (r[iS] || "").toLowerCase().trim());
    }
  }
  for (const line of ["absorbent", "biochar"]) {
    const p = join(HANDOFF, "enrichment", "instantly", `ALL-${line}-prospects.csv`);
    if (!existsSync(p)) continue;
    const all = parseCSV(readFileSync(p, "utf8"));
    const header = all[0].map(h => h.trim()), rows = all.slice(1);
    const iE = header.indexOf("email"), iW = header.indexOf("website");
    const iCity = header.indexOf("city"), iState = header.indexOf("state");
    const iF = header.indexOf("first_name"), iL = header.indexOf("last_name"), iT = header.indexOf("title");
    const iCo = header.indexOf("company_name");
    /* Which domains actually belong to a roster company. Needed by the name fallback
       below: without it a sister domain (outkastig.com vs outkastindustrial.com) or a
       free-mail address (the webless Forest Hill nurseries are all gmail/yahoo) joins
       nothing and the OS shows "needed" for an address we are holding. */
    const rosterDomains = new Set([...companies.values()].map(c => normDomain(c.website)).filter(Boolean));
    /* Resolves a CSV company name to the companies-map key. Both the key (first-seen name
       variant) and the CURRENT display name resolve, because they drift apart as later
       sources refine the name ("Bracy's Nursery" became "Bracy's Nursery, LLC"). */
    const nameResolve = new Map();
    for (const [k, c] of companies.entries()) {
      nameResolve.set(k, k);
      const nk = norm(c.name);
      if (!nameResolve.has(nk)) nameResolve.set(nk, k);
    }
    for (const r of rows) {
      const email = (r[iE] || "").trim();
      if (!email) continue;                       // address-less stub rows are not contacts
      /* The website column is the join key, but 48 rows arrived with it blank while the
         address itself names the company: fall back to the email's own domain so those
         contacts reach their roster row instead of joining nothing. */
      let d = normDomain(r[iW]) || normDomain(email.split("@")[1] || "");
      /* Domain join is canon (names drift, domains do not) — but when the domain matches
         NO roster company and the row's company name matches one exactly, a name key is
         the only join there is. Display-side only; enrichment spend still keys on domain. */
      const coName = iCo >= 0 ? (r[iCo] || "").trim() : "";
      const nameKey = coName ? nameResolve.get(norm(coName)) : null;
      if ((!d || !rosterDomains.has(d)) && nameKey) d = "name:" + nameKey;
      if (!d) continue;
      if (!contactsByDomain.has(d)) contactsByDomain.set(d, { total: 0, verified: 0, city: "", state: "", list: [] });
      const rec = contactsByDomain.get(d);
      rec.total++;
      const status = verdicts.get(email.toLowerCase()) || "";
      if (status === "verified") rec.verified++;
      /* The record itself, so the OS can SHOW the person rather than a count. Short keys
         on purpose: this array is serialised per company into roster-data.js. */
      const nm = [iF >= 0 ? r[iF] : "", iL >= 0 ? r[iL] : ""].map(s => (s || "").trim()).filter(Boolean).join(" ");
      rec.list.push({ n: nm, t: iT >= 0 ? (r[iT] || "").trim() : "", e: email, s: status });
      /* First non-empty location per domain wins; enrichment rows carry the account's
         city/state from Apollo research and are the only location source for most
         contact-first accounts. */
      if (!rec.city && iCity >= 0 && (r[iCity] || "").trim()) rec.city = r[iCity].trim();
      if (!rec.state && iState >= 0 && (r[iState] || "").trim()) rec.state = r[iState].trim();
    }
  }
}

/* ---------------------------------------------------------------------------
   VERIFICATION.

   Derived, never asserted. Each record gets `needs`, the list of what is genuinely absent,
   and `verify` follows from it. This is desk verification: the company is real, placed and
   scored. Nobody has phoned them. Keeping the two ideas apart is the whole point, because
   the Aug 10 call turned up leads in the file that were a casino and a defunct entity.
   --------------------------------------------------------------------------- */
/* Names that cannot be a buying account for what we sell. Deliberately narrow: only the
   hospitality and leisure class, which is the scrape error Victor described on the Aug 10
   call (a lead that turned out to be a gambling site). An earlier version of this rule also
   caught "university" and "college" and it was wrong. LSU AgCenter is in the CRM with
   contact logged in June, and university ag programs run exactly the field trials that sell
   biochar. Institutions get flagged for review below instead of being killed. */
const NOT_A_BUYER = /\b(bicycle club|casino|restaurant|bar and grill|country club|steakhouse|hotel|motel)\b/i;
/* Real, but not a normal commercial sale: research bodies, nonprofits and public agencies
   buy on grants and procurement cycles. Worth keeping and worth a human deciding on, so they
   are surfaced rather than either killed or dropped into the ordinary call queue. */
const NEEDS_REVIEW = /\b(university|college|agcenter|extension|institute|research|nonprofit|goodwill|foundation)\b/i;

for (const [coKey, c] of companies.entries()) {
  const dJoined = contactsByDomain.get(normDomain(c.website));
  const nJoined = contactsByDomain.get("name:" + coKey);
  const joined = dJoined && nJoined
    ? { total: dJoined.total + nJoined.total, verified: dJoined.verified + nJoined.verified,
        city: dJoined.city || nJoined.city, state: dJoined.state || nJoined.state }
    : (dJoined || nJoined);
  /* Backfill city/state from the enrichment rosters (run 7, 2026-08-17). The Apollo
     research rows carry the account's location; a record that has none gets it from
     there rather than being flagged as location-less forever. Fills only, never
     overwrites desk research. */
  if (!c.city && !c.state && joined && (joined.city || joined.state)) {
    c.city = joined.city;
    c.state = joined.state;
    c.locationSource = "enrichment-csv";
  }
  /* Freight verdict, derived once a location exists (run 7, 2026-08-17). Two honest
     cases only: absorbent has NO distance gate by canon (nationwide FOB White Castle),
     and a biochar account in LA or MS is inside the 500-mile ring by state extent --
     the same reasoning the geo audit's "inside the state extent" rows already use.
     Anything else keeps an empty verdict rather than a guessed one. */
  if (!c.geo && (c.city || c.state)) {
    if (c.line === "Absorbent") {
      c.geo = "NO GATE";
      c.geoWhy = "Absorbent ships nationwide FOB White Castle; distance is freight math, never a disqualifier. Location recorded for quoting.";
    } else if (c.line === "Biochar" && /^(LA|MS)$/i.test(clean(c.state))) {
      c.geo = "IN";
      c.geoWhy = `In ring. ${clean(c.state).toUpperCase() === "LA" ? "Louisiana" : "Mississippi"}: inside the state extent, within 500 driving miles of White Castle.`;
    }
  }
  const needs = [];
  if (!c.website) needs.push("website");
  if (!c.icp) needs.push("ICP");
  if (!c.city && !c.state) needs.push("location");
  if (!c.geo) needs.push("freight verdict");
  if (c.score == null) needs.push("score");
  if (!c.why) needs.push("reason to work it");
  /* A joined enrichment address IS an email; the roster no longer flags "phone or
     email" for a company the enrichment CSVs can already write to (run 7 fix). */
  if (!(c.phones || []).length && !(c.emails || []).length && !(joined && joined.total > 0)) needs.push("phone or email");
  c.needs = needs;

  if (c.dead) { c.verify = "killed"; continue; }
  if (NOT_A_BUYER.test(c.name)) {
    /* Not deleted. A row that quietly vanishes gets re-scraped and re-added next pass; a row
       marked rejected with a reason stays rejected. */
    c.dead = true;
    c.line = "DEAD";
    c.verify = "rejected";
    c.scoreWhy = c.scoreWhy || "Rejected on review: the name does not describe a business that buys biochar or absorbent. This is the bad scrape class Victor flagged on the Aug 10 call, kept visible so it is not re-added on the next pass.";
    continue;
  }
  if (NEEDS_REVIEW.test(c.name)) {
    c.verify = "review";
    c.reviewWhy = "Research body, public agency or nonprofit. Real, and some are already active relationships, but they buy on grant and procurement cycles rather than off a cold sample offer. Decide how to work it before it goes in a send.";
    continue;
  }
  const core = ["website", "ICP", "freight verdict", "score"].filter(n => needs.includes(n));
  c.verify = core.length === 0 ? "verified" : core.length <= 2 ? "partial" : "unverified";
}

/* Company verification (handoff/enrichment/company-verification.csv) is a DIFFERENT test
   from the `verify` field above. `verify` means "does the desk research record have a
   website, ICP, freight verdict and score" -- a completeness check on our own notes.
   `companyVerify` means "we fetched the company's live site and its own copy matches this
   ICP's vocabulary". Only the second one defends the claim that an account is a real,
   trading, on-ICP prospect, and only it gates Apollo spend and the campaign gate. Surfaced
   separately here so the OS can never present one as the other. */
const companyVerdict = new Map();
{
  const p = join(HANDOFF, "enrichment", "company-verification.csv");
  if (existsSync(p)) {
    const all = parseCSV(readFileSync(p, "utf8"));
    const h = all[0].map(x => x.trim());
    const iD = h.indexOf("domain"), iV = h.indexOf("verify"), iW = h.indexOf("verify_why");
    /* Last row per domain wins: the file is append-only, so a human adjudication of a
       machine `partial` arrives as a new row appended below it, and must supersede. */
    for (const r of all.slice(1)) {
      const d = normDomain(r[iD]);
      if (d) companyVerdict.set(d, { v: (r[iV] || "").trim(), why: (r[iW] || "").trim() });
    }
  }
}

/* A company can hold BOTH kinds of rec: Bracy's has 4 addresses on bracys.com (domain
   join) and 2 on gmail (name join). Merge, never prefer — preferring one silently drops
   the other's addresses, which is how "we have their email" turns into "needed". */
const recFor = (coKey, c) => {
  const dRec = contactsByDomain.get(normDomain(c.website));
  const nRec = contactsByDomain.get("name:" + coKey);
  if (!dRec || !nRec) return dRec || nRec;
  return { total: dRec.total + nRec.total, verified: dRec.verified + nRec.verified,
           city: dRec.city || nRec.city, state: dRec.state || nRec.state,
           list: [...dRec.list, ...nRec.list] };
};
for (const [coKey, c] of companies.entries()) {
  const cvv = companyVerdict.get(normDomain(c.website));
  if (cvv) { c.companyVerify = cvv.v; c.companyVerifyWhy = cvv.why; }
  const rec = recFor(coKey, c);
  /* Written even when zero so the OS can distinguish "nobody to write to" from "not
     looked at yet" -- that distinction is the whole point of the gap number. */
  c.contactsOnFile = rec ? rec.total : 0;
  c.contactsVerified = rec ? rec.verified : 0;
  if (rec && rec.list.length) {
    /* Verified addresses lead, invalid sink; within a band the CSV order (screen rank)
       holds. Invalid rows stay listed — a rep must see "we had it and it bounced"
       rather than a gap that invites re-buying the same address. */
    const bandOf = s => (s === "verified" ? 0 : s === "pending" ? 1 : s === "" ? 2 : s === "invalid" ? 4 : 3);
    c.contacts = [...rec.list].sort((a, b) => bandOf(a.s) - bandOf(b.s));
    /* c.emails is what the table's Email column dials from: usable addresses only,
       enriched-and-verified ahead of the desk-researched info@ style rows. */
    const usable = c.contacts.filter(x => x.s !== "invalid").map(x => x.e);
    c.emails = [...new Set([...usable, ...(c.emails || [])])];
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
/* An unmapped ICP code means a company is filed under a campaign that does not exist, which
   is exactly the drift this reconciliation removed. Fail rather than ship it. */
if (unmappedIcps.size) {
  console.error(`\n✗ Unmapped ICP codes in the CSVs: ${[...unmappedIcps].join(", ")}`);
  console.error(`  Add them to ICP_MIGRATE in this file, or add the ICP to outreach-data.js.`);
  process.exit(1);
}
/* The reverse check: a campaign nobody is assigned to. Not fatal, because a campaign can
   legitimately be built before its list is, but it must be visible. */
const emptyIcps = Object.keys(ICP_LABEL).filter(tag => !byIcp[tag]);

const live = list.filter(c => !c.dead);
const byVerify = {};
const byOrigin = {};
for (const c of list) {
  byVerify[c.verify] = (byVerify[c.verify] || 0) + 1;
  byOrigin[c.origin || "desk"] = (byOrigin[c.origin || "desk"] || 0) + 1;
}
/* The work queue: live rows that are not desk verified yet, worst first. Surfaced as a
   number so "the roster has 550 companies" can never be mistaken for "550 are ready to
   call". */
const needsWork = live.filter(c => c.verify !== "verified").length;

/* The gap: live, ICP'd companies with nobody to write to. This is the number the whole
   enrichment effort moves, so it is derived here rather than recounted by hand in an
   inventory note that goes stale the moment the next batch lands. */
const liveIcp = live.filter(c => c.icp);
const withContact = liveIcp.filter(c => c.contactsOnFile > 0).length;
const withVerified = liveIcp.filter(c => c.contactsVerified > 0).length;
const contactGap = liveIcp.length - withContact;
const contactsTotal = list.reduce((n, c) => n + (c.contactsOnFile || 0), 0);
const byCompanyVerify = {};
for (const c of liveIcp) byCompanyVerify[c.companyVerify || "not-checked"] = (byCompanyVerify[c.companyVerify || "not-checked"] || 0) + 1;
const icpProven = liveIcp.filter(c => c.companyVerify === "verified").length;
const contactsVerifiedTotal = list.reduce((n, c) => n + (c.contactsVerified || 0), 0);
/* Distance tiers, absorbent only (operator ruling 2026-08-17). UNTIERED counts the live
   absorbent rows no tier file covers yet, so a stale overlay is visible, not silent. */
const byDistTier = {};
for (const c of live.filter(c => c.line === "Absorbent")) {
  byDistTier[c.distTier || "UNTIERED"] = (byDistTier[c.distTier || "UNTIERED"] || 0) + 1;
}

const out = `/* ===== VEJ Sales OS - PROSPECTING ROSTER (GENERATED, DO NOT EDIT) =====
   Generated by scripts/build-roster.mjs from the handoff CSVs.
   Re-run \`node scripts/build-roster.mjs\` and commit the result when the roster changes.
   Hand edits are silently lost on the next run.

   ${list.length} companies (${live.length} live, ${list.length - live.length} killed or rejected with a written reason).
   ${needsWork} live rows are not desk verified yet: see the verify and needs fields on each record.
   ${liveIcp.length} live rows carry an ICP; ${withContact} of them have a contact on file and ${contactGap} have nobody to write to.
   ${contactsTotal} contact addresses joined from the enrichment rosters, ${contactsVerifiedTotal} of them verified.
   ${icpProven} live ICP'd companies have a PROVEN ICP (live site checked against ICP vocabulary); the rest are ${JSON.stringify(byCompanyVerify)}.
   Sources: ${sourcesUsed.map(s => `${s.file} (${s.rows}${s.strays ? " new" : ""})`).join(", ")}
   ===================================================================== */
window.ROSTER = {
  count: ${list.length},
  live: ${live.length},
  dead: ${list.length - live.length},
  needsWork: ${needsWork},
  liveIcp: ${liveIcp.length},
  withContact: ${withContact},
  withVerifiedContact: ${withVerified},
  contactGap: ${contactGap},
  contactsTotal: ${contactsTotal},
  contactsVerified: ${contactsVerifiedTotal},
  byCompanyVerify: ${JSON.stringify(byCompanyVerify)},
  icpProven: ${icpProven},
  byDistTier: ${JSON.stringify(byDistTier)},
  byIcp: ${JSON.stringify(byIcp)},
  byLine: ${JSON.stringify(byLine)},
  byVerify: ${JSON.stringify(byVerify)},
  emptyIcps: ${JSON.stringify(emptyIcps)},
  byOrigin: ${JSON.stringify(byOrigin)},
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
console.log(`  by origin: ${Object.entries(byOrigin).sort((a, b) => b[1] - a[1]).map(([k, v]) => `${k} ${v}`).join(", ")}`);
console.log(`  by verification: ${Object.entries(byVerify).sort((a, b) => b[1] - a[1]).map(([k, v]) => `${k} ${v}`).join(", ")}`);
console.log(`  hubspot: ${hsAdded} new companies, ${hsMerged} merged onto existing research`);
console.log(`  stragglers: ${strayAdded} added from the sheets, ${ldeqAdded} from the LDEQ register`);
console.log(`  icp assignments applied: ${assigned}${assignMissing.length ? `, ${assignMissing.length} named a company not in the roster: ${assignMissing.join(", ")}` : ""}`);
console.log(`  sources discovered: ${Object.entries(discovered).filter(([k,v])=>k!=="unknown"&&v.length).map(([k,v])=>`${k} ${v.length}`).join(", ")}`);
if (discovered.unknown.length) console.log(`  CSVs in handoff/ with an unrecognised shape (skipped): ${discovered.unknown.join(", ")}`);
if (strayRejected.length) {
  console.log(`  ${strayRejected.length} sheet rows rejected as prose, not companies:`);
  for (const n of strayRejected) console.log(`      "${n.slice(0, 72)}${n.length > 72 ? "..." : ""}"`);
}
console.log(`  ${needsWork} live rows still need desk work before they can be called`);
console.log(`  contacts: ${withContact}/${liveIcp.length} live ICP'd companies have someone to write to (gap ${contactGap})`);
console.log(`  ${contactsTotal} addresses joined, ${contactsVerifiedTotal} verified`);
console.log(`  company ICP proof: ${JSON.stringify(byCompanyVerify)}`);
if (emptyIcps.length) console.log(`  campaigns with no companies on the list: ${emptyIcps.join(", ")}`);
