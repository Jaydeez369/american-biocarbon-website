#!/usr/bin/env node
/**
 * Outreach Engine copy gate: NO dashes of any kind in the copy that goes out.
 *
 * The site-wide gate (check-dashes.mjs) bans em and en dashes but allows the ASCII
 * hyphen, and it skips sales/ entirely. The Outreach Engine is stricter on purpose:
 * every string in it is either pasted into Instantly or read off a screen while
 * someone is on the phone, and the ask was zero dashes anywhere in it. Hyphenated
 * compounds also survive copy/paste badly across mail clients that re-wrap lines.
 *
 * So this checks two things:
 *   1. Every string value in outreach-data.js, walked recursively.
 *   2. Every visible text literal in outreach.js (its labels and headings). Code
 *      identifiers, CSS class names and HTML attributes legitimately contain
 *      hyphens, so those are excluded by only scanning the strings the renderer
 *      hands to esc() or prints as visible prose.
 *
 * Run: node scripts/check-outreach-dashes.mjs
 */
import { readFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import vm from "node:vm";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const DATA = join(ROOT, "sales", "outreach-data.js");
const VIEW = join(ROOT, "sales", "outreach.js");

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

/* ---- 1. every string in the data tree ---- */
const ctx = vm.createContext({});
vm.runInContext(readFileSync(DATA, "utf8"), ctx, { filename: "outreach-data.js" });
vm.runInContext("globalThis.__root = OUTREACH", ctx);

let strings = 0;
(function walk(node, path) {
  if (typeof node === "string") { strings++; flag(`outreach-data.js  ${path}`, node); return; }
  if (Array.isArray(node)) { node.forEach((v, i) => walk(v, `${path}[${i}]`)); return; }
  if (node && typeof node === "object") { for (const [k, v] of Object.entries(node)) walk(v, `${path}.${k}`); }
})(ctx.__root, "OUTREACH");

/* ---- 2. visible label literals in the renderer ----
   Only the strings the renderer prints as prose. Anything inside an HTML attribute,
   a class list or an identifier is code, not copy, and hyphens there are fine. */
const view = readFileSync(VIEW, "utf8")
  .replace(/\/\*[\s\S]*?\*\//g, "")   // block comments are notes to the next editor, not copy
  .replace(/^\s*\/\/.*$/gm, "");

// Any double quoted literal of two or more words that carries no markup or code
// punctuation is prose the renderer prints. Class lists, selectors, ids and attribute
// fragments all fail this test, which is what keeps their hyphens legal.
let labels = 0;
for (const m of view.matchAll(/"([^"\n]{4,})"/g)) {
  const s = m[1];
  if (!/\s/.test(s)) continue;                 // single token: an id, a key, a selector
  if (/[<>=${}|/\\#[\]]/.test(s)) continue;    // markup, template hole, selector or path
  // A class list is several kebab identifiers or bare design-system class names. Those
  // are code, and their hyphens are load bearing. Prose always has a capital or a comma.
  if (s.split(/\s+/).every(t => /^[a-z][a-z0-9]*(-[a-z0-9]+)+$/.test(t)
                             || /^(script|copy|lbl|active|open|card|note|badge|pill)$/.test(t))) continue;
  labels++;
  flag(`outreach.js  literal`, s);
}

if (violations) {
  console.error(`\n${violations} dash violation(s) in the Outreach Engine. Rewrite the copy without a dash.`);
  process.exit(1);
}
console.log(`Outreach Engine copy gate: clean. ${strings} data strings and ${labels} renderer labels, no dashes.`);
