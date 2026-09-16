#!/usr/bin/env node
/**
 * Copy gate: NO dashes of any kind in the words that go to a prospect.
 *
 * The site-wide gate (check-dashes.mjs) bans em and en dashes but allows the ASCII hyphen,
 * and it skips sales/ entirely. Outbound copy is stricter on purpose: every string here is
 * pasted into Instantly or sent through Resend, and the ask was zero dashes anywhere in it.
 * Hyphenated compounds also survive copy and paste badly across mail clients.
 *
 * What is scanned, every string walked recursively:
 *   1. sales/coldemail-spec.js   the eight cold email placeholder drafts
 *   2. sales/nurture-spec.js     the nurture sequence placeholder drafts (copy fields only)
 *   3. sales/outreach-data.js    ICP taxonomy and product facts, still read on screen
 *
 * What a person types over a placeholder in the Sales OS is not gated here; it lives in
 * D1. The editors show the rule and Victor's approval is the gate for that.
 *
 * Run: node scripts/check-copy-dashes.mjs
 */
import { readFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import vm from "node:vm";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const SALES = join(ROOT, "sales");

const BANNED = {
  "-": "ASCII hyphen",
  "‐": "hyphen",
  "‑": "non breaking hyphen",
  "‒": "figure dash",
  "–": "en dash",
  "—": "em dash",
  "―": "horizontal bar",
  "−": "minus sign",
  "－": "fullwidth hyphen",
  "﹘": "small em dash",
  "﹣": "small hyphen minus",
  "⁃": "hyphen bullet",
};
const RE = new RegExp(`[${Object.keys(BANNED).map(c => "\\u" + c.codePointAt(0).toString(16).padStart(4, "0")).join("")}]`);

/* Email addresses and URLs are identifiers, not prose. cs-ops.com is a real domain and
   nobody gets to rewrite it. Blank them out before scanning so a hyphen inside one does
   not fail the gate, while a hyphen in the sentence around it still does. */
const EXEMPT = /\b[\w.+-]+@[\w.-]+\.\w+\b|\bhttps?:\/\/\S+|\b[\w-]+\.(?:com|org|net|earth|io)\b/g;

let violations = 0;
function flag(where, raw) {
  const value = raw.replace(EXEMPT, m => " ".repeat(m.length));
  const m = RE.exec(value);
  if (!m) return;
  violations++;
  const i = m.index;
  console.error(`${where}\n  ${BANNED[m[0]]} in: ...${raw.slice(Math.max(0, i - 45), i + 45).replace(/\n/g, " ")}...`);
}

let strings = 0;
function walk(node, path, file) {
  if (typeof node === "string") { strings++; flag(`${file}  ${path}`, node); return; }
  if (Array.isArray(node)) { node.forEach((v, i) => walk(v, `${path}[${i}]`, file)); return; }
  if (node && typeof node === "object") { for (const [k, v] of Object.entries(node)) walk(v, `${path}.${k}`, file); }
}
function loadGlobal(file, name) {
  const ctx = vm.createContext({ window: {} });
  vm.runInContext(readFileSync(join(SALES, file), "utf8"), ctx, { filename: file });
  return vm.runInContext(`(typeof ${name} !== "undefined" ? ${name} : window.${name})`, ctx);
}

/* 1. cold email: every string, the whole spec */
walk(loadGlobal("coldemail-spec.js", "COLDEMAIL_SPEC").lines, "lines", "coldemail-spec.js");

/* 2. nurture: only the copy that becomes an email. Titles and intents are notes to the
   person writing, not to the prospect. Links are exempt in flag() already. */
const N = loadGlobal("nurture-spec.js", "NURTURE_SPEC");
for (const seq of N.sequences) for (const e of seq.emails) {
  if (e.copy) walk(e.copy, `${e.id}.copy`, "nurture-spec.js");
  if (e.variantCopy) walk(e.variantCopy, `${e.id}.variantCopy`, "nurture-spec.js");
  if (seq.footerNote) flag(`nurture-spec.js  ${seq.id}.footerNote`, seq.footerNote);
}

/* 3. the ICP taxonomy and facts that a rep reads on screen */
walk(loadGlobal("outreach-data.js", "OUTREACH"), "OUTREACH", "outreach-data.js");

if (violations) {
  console.error(`\n${violations} dash violation(s) in outbound copy. Rewrite without a dash.`);
  process.exit(1);
}
console.log(`Copy gate: clean. ${strings} strings across the cold email, nurture and ICP data, no dashes.`);
