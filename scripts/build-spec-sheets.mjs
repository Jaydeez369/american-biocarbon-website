#!/usr/bin/env node
/**
 * Regenerate the customer-facing spec-sheet PDFs from the HTML templates.
 *
 *   node scripts/build-spec-sheets.mjs           write assets/spec-sheets/*.pdf
 *   node scripts/build-spec-sheets.mjs --check   verify the shipped PDFs are dash-clean
 *
 * The templates in spec-templates/ are the source of truth. They used to be printed
 * by hand out of the Chrome dialog, which is why the shipped PDFs drifted from the
 * templates; this does the same print headlessly so the two cannot disagree.
 *
 * --check pulls the text back out of the shipped PDFs and fails on any em/en dash or
 * on a hyphen used as a range separator ("30-40"), the two things the brand kit bans
 * that check-dashes.mjs cannot see because it only reads source, not PDFs.
 */
import { execFileSync, spawn } from "node:child_process";
import { existsSync, mkdtempSync, readFileSync, rmSync, copyFileSync, statSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const OUT_DIR = join(ROOT, "assets", "spec-sheets");

const SHEETS = [
  { template: "biochar-premium.html", pdf: "Biochar-Premium-Specification-Sheet.pdf", pages: 7 },
  { template: "absorbent-pellets.html", pdf: "Absorbent-Pellets-Specification-Sheet.pdf", pages: 3 },
];

const CHROME = [
  "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
  "/Applications/Chromium.app/Contents/MacOS/Chromium",
  "/usr/bin/google-chrome",
  "/usr/bin/chromium",
].find(existsSync);

// Dash-like characters plus a hyphen sitting between two numbers, which is how a range
// sneaks back in. "wood-based" and "44,000-lb" do not match (a letter follows the
// hyphen); phone numbers and ISO dates are stripped before the range check runs.
const DASHES = /[‒–—―−－﹘﹣⁃]/g;
const RANGE = /\d[\d.,]*\s?-\s?\d/g;
const PHONE = /\(?\d{3}\)?[\s.-]?\d{3}[\s.-]\d{4}/g;
const ISO_DATE = /\d{4}-\d{2}-\d{2}/g;

function which(bin) {
  try {
    return execFileSync("command", ["-v", bin], { shell: "/bin/sh", encoding: "utf8" }).trim();
  } catch {
    return null;
  }
}

function pdfText(file) {
  if (!which("pdftotext")) return null;
  return execFileSync("pdftotext", ["-layout", file, "-"], { encoding: "utf8", maxBuffer: 64 << 20 });
}

function pdfPages(file) {
  if (!which("pdfinfo")) return null;
  const m = /Pages:\s+(\d+)/.exec(execFileSync("pdfinfo", [file], { encoding: "utf8" }));
  return m ? Number(m[1]) : null;
}

function lint(name, text) {
  const problems = [];
  for (const line of text.split("\n")) {
    DASHES.lastIndex = 0;
    RANGE.lastIndex = 0;
    let m;
    while ((m = DASHES.exec(line)) !== null) {
      problems.push(`${name}: dash U+${m[0].codePointAt(0).toString(16).toUpperCase().padStart(4, "0")} in "${line.trim()}"`);
    }
    // Phone numbers and ISO dates are hyphenated by convention, not as ranges.
    const scannable = line.replace(PHONE, "").replace(ISO_DATE, "");
    while ((m = RANGE.exec(scannable)) !== null) {
      problems.push(`${name}: hyphen range "${m[0]}" in "${line.trim()}" -> write it as "X to Y"`);
    }
  }
  return problems;
}

function render(template, dest) {
  if (!CHROME) throw new Error("No Chrome/Chromium found; cannot render spec sheets.");
  const tmp = mkdtempSync(join(tmpdir(), "spec-pdf-"));
  try {
    const staged = join(tmp, "out.pdf");
    // Chrome writes the PDF and then declines to exit (headless keeps the browser
    // process alive), so waiting on the process would hang. Launch it detached, wait
    // for the file to stop growing, then kill it.
    const child = spawn(CHROME, [
      "--headless=new",
      "--disable-gpu",
      "--no-pdf-header-footer",
      "--no-first-run",
      `--user-data-dir=${join(tmp, "profile")}`,
      `--print-to-pdf=${staged}`,
      `file://${join(ROOT, "spec-templates", template)}`,
    ], { stdio: "ignore", detached: true });
    child.unref();
    try {
      let size = -1;
      let stable = 0;
      for (let waited = 0; waited < 90 && stable < 2; waited++) {
        execFileSync("sleep", ["1"]);
        const now = existsSync(staged) ? statSync(staged).size : -1;
        stable = now > 20000 && now === size ? stable + 1 : 0;
        size = now;
      }
    } finally {
      try { process.kill(-child.pid, "SIGKILL"); } catch { /* already gone */ }
    }
    if (!existsSync(staged) || statSync(staged).size < 20000) {
      throw new Error(`${template}: Chrome produced no usable PDF.`);
    }
    copyFileSync(staged, dest);
  } finally {
    rmSync(tmp, { recursive: true, force: true });
  }
}

const checkOnly = process.argv.includes("--check");
let failures = 0;

for (const sheet of SHEETS) {
  const dest = join(OUT_DIR, sheet.pdf);
  if (!checkOnly) {
    render(sheet.template, dest);
    console.log(`  rendered ${sheet.pdf} (${(statSync(dest).size / 1024).toFixed(0)} KB)`);
  } else if (!existsSync(dest)) {
    console.error(`✗ ${sheet.pdf} is missing.`);
    failures++;
    continue;
  }

  const pages = pdfPages(dest);
  if (pages !== null && pages !== sheet.pages) {
    // overflow:hidden in the print CSS clips silently, so a page-count change is the
    // only cheap signal that edited copy pushed content off the sheet.
    console.error(`✗ ${sheet.pdf}: ${pages} pages, expected ${sheet.pages}. Copy may be overflowing.`);
    failures++;
  }

  const text = pdfText(dest);
  if (text === null) {
    console.error("  (pdftotext not installed, skipping PDF text lint)");
    continue;
  }
  const problems = lint(sheet.pdf, text);
  problems.forEach((p) => console.error(`✗ ${p}`));
  failures += problems.length;
}

if (failures) {
  console.error(`\n✗ Spec sheets: ${failures} problem(s).`);
  process.exit(1);
}
console.log("✓ Spec sheets: dash-clean, page counts as expected.");
