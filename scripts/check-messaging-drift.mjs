#!/usr/bin/env node
/**
 * Messaging drift gate: the Sales OS against what the campaigns actually send.
 *
 * There are two copies of the absorbent messaging and nothing tied them together:
 *
 *   sales/outreach-data.js                 what a rep reads on screen while on the phone
 *   sales-department/campaigns/            what the prospect actually received
 *     INSTANTLY-PASTE.md                   (canon, diffed against live Instantly by
 *                                           handoff/enrichment/preflight-absorbent.mjs)
 *
 * On 2026-08-24 the approved 5:1 edit shipped to all nine live absorbent campaigns and the
 * Sales OS was not touched, so for part of a day the screen a rep reads said "granular" and
 * quoted a ratio phrasing that no longer existed in any sent email. Nobody would have caught
 * that except by opening the page and reading it, which is how it was in fact caught.
 *
 * This gate is deliberately narrow. It does not try to make the two copies identical: the
 * Sales OS carries call openers, voicemails and objection handling that have no email
 * equivalent, and it uses {First}/{Me}/{phone} where Instantly uses {{firstName}}. It checks
 * the things that must never disagree.
 *
 * Run: node scripts/check-messaging-drift.mjs
 */
import { readFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import vm from "node:vm";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const REPO = join(ROOT, "..");

const ctx = vm.createContext({});
vm.runInContext(readFileSync(join(ROOT, "sales/outreach-data.js"), "utf8"), ctx, { filename: "outreach-data.js" });
const OUTREACH = vm.runInContext("OUTREACH", ctx);
const blob = JSON.stringify(OUTREACH);

const paste = readFileSync(join(REPO, "sales-department/campaigns/INSTANTLY-PASTE.md"), "utf8");

let fail = 0, warn = 0;
const bad = m => { console.error(`✗ ${m}`); fail++; };
const soft = m => { console.warn(`! ${m}`); warn++; };
const ok = m => console.log(`✓ ${m}`);

/* ---- 1. words retired from the messaging must not survive on screen ----
   "granular" is the clay category word. Victor objected to it twice on the 2026-08-20 call
   as contradictory, since it fights the pellet-and-crumble distinction step 2 draws. It was
   removed from every campaign and every paste-sheet section on 2026-08-24. */
const RETIRED = [
  ["granular", 'Victor objected to it twice on the 2026-08-20 call; removed from every campaign'],
];
for (const [word, why] of RETIRED) {
  const re = new RegExp(`\\b${word}\\b`, "i");
  const inOutreach = re.test(blob);
  const inPaste = re.test(paste);
  if (inOutreach) bad(`outreach-data.js still says "${word}" — ${why}.`);
  if (inPaste) bad(`INSTANTLY-PASTE.md still says "${word}" — ${why}.`);
  if (!inOutreach && !inPaste) ok(`"${word}" is gone from both the Sales OS and the paste sheet.`);
}

/* ---- 2. the ratio claim keeps its qualifiers everywhere it appears ----
   Same rule preflight-absorbent.mjs enforces on live bodies. A bare ratio on the screen a
   rep reads out loud is the same exposure as a bare ratio in an email. */
const RATIO = /(?<![\d.])5\s*(?::|to)\s*(?:1|one)\b/i;
const ratioProse = [], ratioSubjects = [];
(function walk (node, key) {
  if (typeof node === "string") {
    if (RATIO.test(node)) (key === "subject" || key === "subjects" ? ratioSubjects : ratioProse).push(node);
    return;
  }
  if (Array.isArray(node)) return node.forEach(v => walk(v, key));
  if (node && typeof node === "object") Object.entries(node).forEach(([k, v]) => walk(v, k));
})(OUTREACH, null);

/* Subject lines are exempt, and deliberately so: a subject is a teaser and the body it opens
   carries the qualifiers a line later. preflight-absorbent.mjs makes the same distinction —
   it demands "up to about" and "non viscous" in bodies and not in subjects, which is why
   "Do you stock 5 to 1 absorbents?" is live and allowed. Prose gets no such licence. */
const unqualified = ratioProse.filter(s => !/up to about 5 to 1/i.test(s) || !/non viscous/i.test(s));
if (unqualified.length) {
  bad(`${unqualified.length} prose string(s) state the ratio without "up to about" and "non viscous":`);
  unqualified.slice(0, 5).forEach(s => console.error(`    ${s.replace(/\s+/g, " ").slice(0, 130)}`));
} else {
  ok(`All ${ratioProse.length} prose ratio mentions carry "up to about" and "non viscous". ${ratioSubjects.length} subject teaser(s) exempt.`);
}

/* A flat 5x with no ceiling word is banned in campaign copy (/\b5\s*x\b/). Spelling the
   number out is the same claim wearing a hat, and "five times its weight" is a stronger claim
   than the ratio we can support: the ratio is volume absorbed, not weight held.
   Scoped to the absorbency claim only. Biochar's "roughly 3 to 3.5 times its weight in water"
   is a different, ranged, already-qualified claim and is not this rule's business.
   Negation-aware, like allo-agent/audit.mjs: the copy rules have to be able to say
   "never a flat 5x" without tripping the check that enforces them. */
const CEILING = /\b(up to|about|roughly|around|as much as)\b/i;
const NEGATED = /\b(never|not|no|avoid)\b/i;
const flat = [];
(function walk (node) {
  if (typeof node === "string") {
    if (/(?<![\d.])\b(five|5)\s*(x\b|times\b)/i.test(node) && !CEILING.test(node) && !NEGATED.test(node)) flat.push(node);
    return;
  }
  if (Array.isArray(node)) return node.forEach(walk);
  if (node && typeof node === "object") Object.values(node).forEach(walk);
})(OUTREACH);
if (flat.length) {
  bad(`${flat.length} string(s) make a flat 5x claim with no ceiling word:`);
  flat.slice(0, 5).forEach(s => console.error(`    ${s.replace(/\s+/g, " ").slice(0, 130)}`));
} else ok("No unqualified 5x claims.");

/* ---- 3. absorbents are sold by the US ton, biochar by the metric ton ----
   SETTLED 2026-09-09 by the operator: an absorbent US ton is 2,000 lb and that is the sack
   we ship; biochar stays on the metric ton at $450. This replaces the open "UNIT OF SALE
   DISAGREES" warning that stood here from 2026-08-24, when the campaigns had moved to the
   US ton and the site, the Sales OS and the checkout had not.

   The warning could not become an assertion in its old shape, because it tested the whole
   Sales OS blob for the words "metric ton" and biochar says those words legitimately. So
   the check is per string instead: any string that names an absorbent must not carry the
   metric ton or the old 1,650 lb sack, and any string that prices absorbents must say the
   US ton. Biochar is checked the other way round, so the two lines cannot swap units. */
/* $275 is an absorbent signal in its own right, and it is the one that matters most:
   "$275 per metric ton" names no product, so a product-word-only test walks straight past
   the single most damaging string in the file. $450 plays the same role for biochar. */
const ABSORBENT = /absorb|pellet|crumble|\$275/i;
const strings = [];
(function walk(v){
  if (typeof v === "string") strings.push(v);
  else if (Array.isArray(v)) v.forEach(walk);
  else if (v && typeof v === "object") Object.values(v).forEach(walk);
})(OUTREACH);

const sacks = strings.filter(t => /1,?650\s*lb/i.test(t));
if (sacks.length) bad(`outreach-data.js still ships the retired 1,650 lb sack in ${sacks.length} string(s). An absorbent super sack is 2,000 lb (1 US ton).`);
else ok(`The retired 1,650 lb sack is gone from the Sales OS.`);

const mixed = strings.filter(t => ABSORBENT.test(t) && /metric ton/i.test(t) && !/biochar|\$450/i.test(t));
if (mixed.length) bad(`${mixed.length} absorbent string(s) in outreach-data.js still say "metric ton": ${mixed.map(t => JSON.stringify(t.slice(0, 70))).join("; ")}`);
else ok(`No absorbent string in the Sales OS is priced or packaged in metric tons.`);

const pasteSacks = /1,?650\s*lb/i.test(paste);
/* Scoped to the surrounding paragraph, not the line: an email body wraps at ~75 chars, so
   "priced at $450 a metric ton" can land a full line away from the word "biochar" that
   makes it correct. $450 is itself a biochar signal - absorbents are $275. */
const pasteMetric = [...paste.matchAll(/metric ton/gi)]
  .map(m => paste.slice(Math.max(0, m.index - 300), m.index + 100))
  .filter(ctx => !/biochar/i.test(ctx) || /\$275/.test(ctx))
  .filter(ctx => !/\$450/.test(ctx) || /\$275/.test(ctx));
if (pasteSacks) bad(`INSTANTLY-PASTE.md still says 1,650 lb. The absorbent sack is 2,000 lb (1 US ton).`);
else if (pasteMetric.length) bad(`INSTANTLY-PASTE.md has ${pasteMetric.length} non-biochar "metric ton" line(s): ${pasteMetric.map(t => JSON.stringify(t.trim().slice(-70))).join("; ")}`);
else ok(`The campaigns sell absorbents by the US ton and reserve the metric ton for biochar.`);

/* Biochar must keep its own unit: a well-meaning find-and-replace in the other direction
   is exactly as wrong, and would silently reprice 80 MT of finished inventory. */
if (!/\$450 per metric ton/i.test(blob)) bad(`outreach-data.js no longer prices biochar per METRIC ton. Biochar is $450 / metric ton; only absorbents moved to the US ton.`);
else ok(`Biochar still prices per metric ton ($450), unchanged by the absorbent move.`);

console.log(fail ? `\n${fail} drift check(s) failed.` : `\nNo blocking messaging drift.${warn ? ` ${warn} open decision(s) flagged above.` : ""}`);
process.exit(fail ? 1 : 0);
