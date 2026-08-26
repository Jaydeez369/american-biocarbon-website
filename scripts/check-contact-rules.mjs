#!/usr/bin/env node
/**
 * The contact gate: proves a lead cannot reach the sales desk without an email and a
 * phone, and that the browser and the endpoint agree on exactly what counts as one.
 *
 *     node scripts/check-contact-rules.mjs
 *
 * Two copies of the rule exist and both have to: CONTACT_RULES in app.js is what the
 * visitor is judged by, _contact.js is what /api/lead enforces. They cannot be one shared
 * module because app.js is a classic script and the Pages Function is ESM.
 *
 * Drift between them is not a cosmetic bug. The form thanks the visitor as soon as the
 * client is satisfied and posts fire and forget, so a submission the client accepts and
 * the endpoint rejects is a lead that is never delivered and never seen to be missing.
 * This runs in the deploy build for that reason.
 *
 * No network and no keys: with RESEND_API_KEY unset the route refuses to send, so a
 * payload that gets as far as "mail transport not configured" is one that passed the gate.
 */
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(HERE, "..");

const { contactError } = await import("../functions/api/_contact.js");
const { onRequest: lead } = await import("../functions/api/lead.js");

let pass = 0, fail = 0;
const ok = (n, c, d = "") => c ? (pass++, console.log(`  ok    ${n}`)) : (fail++, console.error(`  FAIL  ${n}${d ? `\n          ${d}` : ""}`));

/* Lift CONTACT_RULES out of app.js and run it for real, rather than comparing the two
   sources as text. Text comparison passes whitespace changes and fails harmless ones;
   this fails only when the two disagree about an actual value. */
const src = readFileSync(resolve(ROOT, "app.js"), "utf8");
const start = src.indexOf("const CONTACT_RULES = {");
const end = src.indexOf("\n};", start);
if (start === -1 || end === -1) {
  console.error("  FAIL  CONTACT_RULES not found in app.js. The client no longer validates email and phone.");
  process.exit(1);
}
const CONTACT_RULES = new Function(`${src.slice(start, end + 3)}\nreturn CONTACT_RULES;`)();

/* Left column is what a visitor types; right is whether both sides must accept it. */
const CASES = [
  ["email", "victor@cs-ops.com", true],
  ["email", "first.last@sub.example.co.uk", true],
  ["email", "  spaced@example.com  ", true],
  ["email", "a@b", false],
  ["email", "no-at-sign.com", false],
  ["email", "two @spaces.com", false],
  ["email", "", false],
  ["phone", "(225) 398-9286", true],
  ["phone", "225 398 9286", true],
  ["phone", "+1 225 398 9286", true],
  ["phone", "12253989286", true],
  ["phone", "555", false],
  ["phone", "398-9286", false],
  ["phone", "225398928", false],
  ["phone", "n/a", false],
  ["phone", "1234567890123456", false],
  ["phone", "", false],
];

console.log("\nThe browser and the endpoint judge the same values the same way");
for (const [field, value, want] of CASES) {
  const client = value.trim() ? CONTACT_RULES[field].ok(value) : false;
  const server = contactError(field === "email"
    ? { email: value, phone: "(225) 398-9286" }
    : { email: "victor@cs-ops.com", phone: value }) === null;
  ok(`${field} ${JSON.stringify(value)} -> ${want ? "accepted" : "rejected"}`,
    client === want && server === want,
    `client ${client}, endpoint ${server}, expected ${want}`);
}

console.log("\nEvery message the client shows names the field and what to do");
for (const [field, rule] of Object.entries(CONTACT_RULES)) {
  ok(`${field} has a usable message`, typeof rule.msg === "string" && rule.msg.length > 20, rule.msg);
}

/* And the third place the rule lives: the field definitions themselves. A form that stops
   marking phone or email required would sail past both checks above, because everything
   they test is downstream of the visitor being asked for the field at all. */
console.log("\nEvery form on the site still asks for both, and requires both");
{
  const data = readFileSync(resolve(ROOT, "data.js"), "utf8");
  const grab = (name) => {
    const i = data.indexOf(`const ${name} = `);
    const j = data.indexOf("\n};", i);
    if (i === -1 || j === -1) throw new Error(`${name} not found in data.js`);
    return data.slice(i, j + 3);
  };
  const choices = data.match(/const SAMPLE_CHOICES = \[[^\]]*\];/)[0];
  const FORMS = new Function(`${choices}\n${grab("FORMS")}\nreturn FORMS;`)();
  for (const [key, f] of Object.entries(FORMS)) {
    for (const n of ["email", "phone"]) {
      const fl = (f.fields || []).find((x) => x.n === n);
      ok(`${key}: ${n} is required`, Boolean(fl && fl.req === true),
        fl ? `req is ${JSON.stringify(fl.req)}` : `the form has no ${n} field`);
    }
  }
}

const post = async (body, env = {}) => {
  const res = await lead({
    env,
    request: new Request("https://americanbiocarbon.com/api/lead", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    }),
  });
  const text = await res.text();
  return { status: res.status, body: text ? JSON.parse(text) : null };
};

const LEAD = { form: "sample", fields: { name: "Test", company: "Test Co", email: "victor@cs-ops.com", phone: "(225) 398-9286" } };
const without = (k) => { const f = { ...LEAD.fields }; delete f[k]; return { ...LEAD, fields: f }; };
const withField = (k, v) => ({ ...LEAD, fields: { ...LEAD.fields, [k]: v } });

console.log("\n/api/lead refuses a lead nobody could answer");
for (const [name, body] of [
  ["no email at all", without("email")],
  ["no phone at all", without("phone")],
  ["blank email", withField("email", "   ")],
  ["blank phone", withField("phone", "   ")],
  ["malformed email", withField("email", "a@b")],
  ["a phone that is not one", withField("phone", "call me")],
  ["email hidden under an alias, still invalid", { ...without("email"), fields: { ...without("email").fields, work_email: "nope" } }],
]) {
  const r = await post(body);
  ok(`${name} -> 400`, r.status === 400, `got ${r.status} ${JSON.stringify(r.body)}`);
}

console.log("\nA complete lead is not blocked by the gate");
{
  const r = await post(LEAD);
  ok("valid lead passes validation and stops only at the missing mail key",
    r.status === 500 && r.body?.error === "mail transport not configured",
    `got ${r.status} ${JSON.stringify(r.body)}`);
  const alias = await post({ ...without("phone"), fields: { ...without("phone").fields, mobile: "225-398-9286" } });
  ok("an aliased phone field counts", alias.status === 500, `got ${alias.status} ${JSON.stringify(alias.body)}`);
}

console.log("\nThe gate does not disturb the paths that came before it");
{
  const bot = await post({ ...LEAD, fields: { ...LEAD.fields, _gotcha: "1" } });
  ok("honeypot still answers 204 and sends nothing", bot.status === 204, `got ${bot.status}`);
  const dry = await post({ dry_run: true, ...without("email") });
  ok("dry run still reports routing without a valid lead", dry.status === 200 && dry.body?.dryRun === true, `got ${dry.status}`);
  const empty = await post({ form: "sample", fields: {} });
  ok("an empty body is still 'no fields submitted'", empty.status === 400 && empty.body?.error === "no fields submitted", JSON.stringify(empty.body));
  const get = await lead({ env: {}, request: new Request("https://americanbiocarbon.com/api/lead") });
  ok("GET is still 405", get.status === 405, `got ${get.status}`);
}

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
