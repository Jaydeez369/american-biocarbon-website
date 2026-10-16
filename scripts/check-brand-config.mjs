#!/usr/bin/env node
/**
 * Brand config gate. Prints a loud WARNING list of every field in brand.config.mjs that is
 * still unconfirmed (the legal entity, the verified sending domain, the real mailboxes), and
 * exits 0 for that: those are decisions for a person, not build failures.
 *
 * It exits 1 only for structural breakage: a required field missing or empty, an unconfirmed
 * entry that names a field that does not exist, or a generated Sales OS copy that no longer
 * matches its source (run node scripts/build-brand.mjs).
 */
import { spawnSync } from "node:child_process";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { BRAND_CONFIG as C } from "../brand.config.mjs";

const HERE = dirname(fileURLToPath(import.meta.url));
const REQUIRED = ["brand", "domain", "siteOrigin", "phone", "phoneHref", "legalEntity", "postalAddress", "unsubscribeLine",
  "complianceMailbox", "replyTo", "salesInbox", "leadRecipients", "sendDomain", "leadFrom", "ordersFrom", "nurtureFrom",
  "coldFromName", "coldFromAddress", "signatureName", "logoUrl", "logoRevUrl", "oldBrandPatterns", "unconfirmed"];

let bad = 0;
for (const f of REQUIRED) {
  const v = C[f];
  if (v == null || v === "" || (Array.isArray(v) && f !== "coldMailboxes" && !v.length)) { console.error(`✗ brand.config: required field ${f} is empty`); bad++; }
}
if (/-/.test(C.phone)) { console.error("✗ brand.config: phone must be written with spaces, no hyphen"); bad++; }
if (!("coldMailboxes" in C)) { console.error("✗ brand.config: coldMailboxes is missing"); bad++; }
for (const u of C.unconfirmed || []) if (!(u.field in C)) { console.error(`✗ brand.config: unconfirmed lists ${u.field}, which is not a field`); bad++; }

const gen = spawnSync(process.execPath, [join(HERE, "build-brand.mjs"), "--check"], { stdio: "inherit" });
if (gen.status !== 0) bad++;

const line = "!".repeat(72);
if ((C.unconfirmed || []).length) {
  console.warn(`\n${line}\nWARNING: ${C.unconfirmed.length} brand.config field(s) are NOT confirmed. Do not send real mail until a person confirms them.\n${line}`);
  for (const u of C.unconfirmed) {
    const v = C[u.field];
    console.warn(`  CONFIRM ${u.field} = ${typeof v === "string" ? JSON.stringify(v) : JSON.stringify(v)}\n          ${u.why}`);
  }
  console.warn(`${line}\n`);
}
if (bad) { console.error(`check-brand-config: ${bad} structural problem(s)`); process.exit(1); }
console.log(`check-brand-config: structure ok, ${(C.unconfirmed || []).length} unconfirmed field(s) listed above`);
