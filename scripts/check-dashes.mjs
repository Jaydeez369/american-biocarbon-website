#!/usr/bin/env node
/**
 * Brand kit enforcement: no em/en dashes (or look-alikes) in customer-facing copy.
 * See knowledge-base/11-brand-typography-copy.md
 * Exits non-zero if any disallowed character is found.
 */
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join, dirname, extname } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");

// Disallowed dash-like characters -> the ASCII hyphen-minus is the only allowed dash.
const BANNED = {
  "‒": "figure dash",
  "–": "en dash",
  "—": "em dash",
  "―": "horizontal bar",
  "−": "minus sign",
  "－": "fullwidth hyphen",
  "﹘": "small em dash",
  "﹣": "small hyphen-minus",
  "⁃": "hyphen bullet",
};
const RE = new RegExp(`[${Object.keys(BANNED).join("")}]`, "g");

const SCAN_EXT = new Set([".html", ".js", ".css", ".json", ".md"]);
// The gate gets one job: customer-facing copy. Everything skipped here is non-shipping.
// .claude holds worktrees with stale duplicates of the site; docs/ is internal-only and
// 404s in production (see _redirects). Linting either just produces false failures.
const SKIP_DIRS = new Set(["node_modules", ".git", ".claude", "docs", "scripts", "sales"]);
// styles.css.green-backup etc. are non-shipping; only lint tracked shipping files.
const SKIP_FILES = new Set(["styles.css.green-backup"]);

function walk(dir, out = []) {
  for (const name of readdirSync(dir)) {
    if (SKIP_DIRS.has(name) || SKIP_FILES.has(name)) continue;
    const p = join(dir, name);
    const st = statSync(p);
    if (st.isDirectory()) walk(p, out);
    else if (SCAN_EXT.has(extname(name))) out.push(p);
  }
  return out;
}

let violations = 0;
for (const file of walk(ROOT)) {
  const lines = readFileSync(file, "utf8").split("\n");
  lines.forEach((line, i) => {
    let m;
    RE.lastIndex = 0;
    while ((m = RE.exec(line)) !== null) {
      violations++;
      const rel = file.replace(ROOT + "/", "");
      console.error(`${rel}:${i + 1}  disallowed ${BANNED[m[0]]} (U+${m[0].codePointAt(0).toString(16).toUpperCase().padStart(4, "0")}) -> use "-"`);
    }
  });
}

if (violations) {
  console.error(`\n✗ Brand kit: ${violations} disallowed dash character(s). Replace with ASCII "-". See knowledge-base/11-brand-typography-copy.md`);
  process.exit(1);
}
console.log("✓ Brand kit: no em/en dashes found.");
