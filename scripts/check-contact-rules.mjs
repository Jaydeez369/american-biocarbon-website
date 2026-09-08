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

const { contactError, contactState, isValidEmail, isValidPhone } = await import("../functions/api/_contact.js");
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

/* Compared against the per-field validators, NOT against whether /api/lead accepts the
   submission. Those were the same question until 2026-09-08 and are not any more: the endpoint
   now accepts a lead reachable on either channel, so asking it about a bad email while passing
   a good phone would answer "accepted" and prove nothing about the email rule. This still fails
   the moment the browser and the server disagree about what a valid value looks like, which is
   the drift the gate exists to catch. */
console.log("\nThe browser and the endpoint judge the same values the same way");
for (const [field, value, want] of CASES) {
  const client = value.trim() ? CONTACT_RULES[field].ok(value) : false;
  const server = field === "email" ? isValidEmail(value) : isValidPhone(value);
  ok(`${field} ${JSON.stringify(value)} -> ${want ? "accepted" : "rejected"}`,
    client === want && server === want,
    `client ${client}, endpoint ${server}, expected ${want}`);
}

/* WHAT COUNTS AS A LEAD WORTH KEEPING. One reachable channel is enough. The row that matters
   most here is "a real address and no phone": that submission was refused with a 400 for a
   year, after the visitor had already been shown a tick, and nothing counted them. */
console.log("\nA lead is kept if we can reach the person at all");
for (const [name, fields, reachable, missing] of [
  ["email and phone", { email: "victor@cs-ops.com", phone: "(225) 398-9286" }, true, []],
  ["a real address and no phone", { email: "victor@cs-ops.com" }, true, ["phone"]],
  ["a real phone and no address", { phone: "(225) 398-9286" }, true, ["email"]],
  ["an unusable phone but a real address", { email: "victor@cs-ops.com", phone: "call me" }, true, ["phone"]],
  ["neither", { name: "Test" }, false, ["email", "phone"]],
  ["both present and both unusable", { email: "a@b", phone: "555" }, false, ["email", "phone"]],
]) {
  const st = contactState(fields);
  ok(`${name} -> ${reachable ? "kept" : "refused"}`, st.reachable === reachable,
    `reachable ${st.reachable}, reason ${st.reason}`);
  ok(`${name} reports what is missing`, JSON.stringify(st.missing) === JSON.stringify(missing),
    `got ${JSON.stringify(st.missing)}, expected ${JSON.stringify(missing)}`);
}

console.log("\nEvery message the client shows names the field and what to do");
for (const [field, rule] of Object.entries(CONTACT_RULES)) {
  ok(`${field} has a usable message`, typeof rule.msg === "string" && rule.msg.length > 20, rule.msg);
}

/* And the third place the rule lives: the field definitions themselves. A form that stops
   marking phone or email required would sail past both checks above, because everything
   they test is downstream of the visitor being asked for the field at all. */
/* Unchanged by the 2026-09-08 rule change, deliberately. The SERVER now keeps a lead that
   arrives with only one channel; the FORM still asks for both and still marks both required,
   because asking is free and a phone number is worth having. What changed is what happens to a
   submission that arrives without one anyway. */
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

/* Only a submission nobody could answer is refused. Everything else reaches the store, and with
   RESEND_API_KEY unset it then stops at the mail step, which is how these assertions tell
   "passed the gate" from "was thrown away". */
console.log("\n/api/lead refuses only a lead nobody could answer");
for (const [name, body] of [
  ["no email and no phone", { ...LEAD, fields: { name: "Test", company: "Test Co" } }],
  ["both fields blank", { ...LEAD, fields: { ...LEAD.fields, email: "   ", phone: "   " } }],
  ["both fields malformed", { ...LEAD, fields: { ...LEAD.fields, email: "a@b", phone: "call me" } }],
]) {
  const r = await post(body);
  ok(`${name} -> 400`, r.status === 400, `got ${r.status} ${JSON.stringify(r.body)}`);
}

console.log("\nA lead we can answer is kept, even when it is incomplete");
for (const [name, body] of [
  ["a full lead", LEAD],
  ["no phone at all", without("phone")],
  ["no email at all", without("email")],
  ["a malformed email but a real phone", withField("email", "a@b")],
  ["a phone that is not one, but a real address", withField("phone", "call me")],
  ["an aliased phone field counts", { ...without("phone"), fields: { ...without("phone").fields, mobile: "225-398-9286" } }],
]) {
  const r = await post(body);
  ok(`${name} reaches the mail step rather than being refused`,
    r.status === 500 && r.body?.error === "mail transport not configured",
    `got ${r.status} ${JSON.stringify(r.body)}`);
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

/* ------------------------------------------------------------------ the store
   The whole point of the 2026-09-08 change: the lead reaches D1, and it reaches it BEFORE
   anybody is mailed. Asserted by recording the order of the outbound calls, because "it wrote
   the record" and "it wrote the record first" are different claims and only the second one
   survives a mail failure. */
console.log("\nThe lead reaches the store, and reaches it before the mail");
{
  const realFetch = globalThis.fetch;
  const calls = [];
  globalThis.fetch = async (url, init) => {
    const u = String(url);
    calls.push({ url: u, body: init?.body ? JSON.parse(init.body) : null });
    if (u.includes("/intake/web-lead")) {
      return new Response(JSON.stringify({ ok: true, id: "wl_test" }), { status: 200, headers: { "content-type": "application/json" } });
    }
    return new Response(JSON.stringify({ id: "re_test" }), { status: 200, headers: { "content-type": "application/json" } });
  };
  const ENV = { ALLO_EXPORT_TOKEN: "t", RESEND_API_KEY: "k", LEAD_TO: "test@cs-ops.com" };

  try {
    calls.length = 0;
    const r = await post(LEAD, ENV);
    const first = calls[0]?.url || "";
    ok("the store is called before Resend", first.includes("/intake/web-lead"),
      `first call was ${first}`);
    ok("the lead is reported as stored, with an id", r.body?.stored === true && r.body?.id === "wl_test",
      JSON.stringify(r.body));
    ok("the store is told the mail went out", calls.some(c => c.url.includes("/intake/web-lead") && c.body?.mailed === true),
      "no re-stamp carrying mailed:true");

    /* An incomplete lead is stored and flagged, not refused. */
    calls.length = 0;
    const inc = await post(without("phone"), ENV);
    ok("an incomplete lead is stored and reports what is missing",
      inc.status === 200 && inc.body?.stored === true && inc.body?.incomplete === true
        && JSON.stringify(inc.body?.missing) === JSON.stringify(["phone"]),
      JSON.stringify(inc.body));

    /* A refusal is a row too. This is the number that was unknowable before. */
    calls.length = 0;
    const rej = await post({ ...LEAD, fields: { name: "Test", company: "Test Co" } }, ENV);
    const stored = calls.find(c => c.url.includes("/intake/web-lead"));
    ok("a refused submission is still written to the store", Boolean(stored), "nothing was stored");
    ok("and it is written flagged as refused, with a reason",
      stored?.body?.rejected === true && typeof stored?.body?.rejectReason === "string" && stored.body.rejectReason.length > 5,
      JSON.stringify(stored?.body));
    ok("a refused submission never reaches Resend", !calls.some(c => c.url.includes("resend")),
      "the mailer was called for a lead nobody could answer");
    ok("the refusal is still a 400 to the browser", rej.status === 400, `got ${rej.status}`);

    /* A mail failure must not look like a lost lead any more. */
    globalThis.fetch = async (url, init) => {
      const u = String(url);
      if (u.includes("/intake/web-lead")) {
        return new Response(JSON.stringify({ ok: true, id: "wl_test" }), { status: 200, headers: { "content-type": "application/json" } });
      }
      return new Response("upstream is down", { status: 502 });
    };
    const mailDead = await post(LEAD, ENV);
    ok("a lead we hold but could not mail is a success, not a 502",
      mailDead.status === 200 && mailDead.body?.stored === true && mailDead.body?.mailed === false,
      `got ${mailDead.status} ${JSON.stringify(mailDead.body)}`);

    /* And the reverse: if the store is down we still mail, because a lead in an inbox beats
       no lead at all. */
    globalThis.fetch = async (url) => String(url).includes("/intake/web-lead")
      ? new Response("nope", { status: 500 })
      : new Response(JSON.stringify({ id: "re_test" }), { status: 200, headers: { "content-type": "application/json" } });
    const storeDead = await post(LEAD, ENV);
    ok("a store outage still mails the desk, and says the lead was not stored",
      storeDead.status === 200 && storeDead.body?.stored === false && storeDead.body?.mailed === true,
      `got ${storeDead.status} ${JSON.stringify(storeDead.body)}`);
  } finally {
    globalThis.fetch = realFetch;
  }
}

/* ------------------------------------------------------- the browser half
   deliverLead used to return nothing while the caller painted the tick on the next line. It now
   resolves a result the caller branches on, and it must never reject: a thrown error would leave
   the form stuck on "Sending..." forever with no way back.

   Lifted out of app.js and run for real against a stubbed fetch, the same way CONTACT_RULES is
   lifted above. A structural check that the string "form-success" moved inside a .then() would
   pass against a callback that ignores its argument. */
console.log("\nThe browser waits for the answer instead of assuming one");
{
  const i = src.indexOf("function deliverLead(");
  const j = src.indexOf("\n}", i);
  ok("deliverLead is still in app.js", i !== -1 && j !== -1);

  const makeForm = () => ({ dataset: {} });
  const run = (fetchImpl) => new Function("LEAD_ENDPOINT", "LEAD_RECIPIENTS", "FormData", "fetch", "location", "console",
    `${src.slice(i, j + 2)}\nreturn deliverLead;`)(
      "/api/lead",
      { DEFAULT: ["x@cs-ops.com"] },
      class { constructor() {} forEach() {} },
      fetchImpl,
      { pathname: "/", hash: "" },
      { warn() {}, error() {} },
    );

  const okRes = async () => new Response(null, { status: 204 });
  const res204 = await run(okRes)("sample", makeForm());
  ok("a delivered lead resolves ok", res204.ok === true, JSON.stringify(res204));

  const res400 = await run(async () => new Response("no", { status: 400 }))("sample", makeForm());
  ok("a refused lead resolves not-ok and says it was refused",
    res400.ok === false && res400.reason === "refused", JSON.stringify(res400));

  const res500 = await run(async () => new Response("no", { status: 500 }))("sample", makeForm());
  ok("a server error is reported as an error, not a refusal",
    res500.ok === false && res500.reason === "error", JSON.stringify(res500));

  const resNet = await run(async () => { throw new Error("offline"); })("sample", makeForm());
  ok("a network failure resolves rather than rejecting, so the form is never stuck",
    resNet.ok === false && resNet.reason === "network", JSON.stringify(resNet));

  /* The same submission keeps one id across a retry, so the store sees one lead. */
  const form = makeForm();
  const seen = [];
  const capture = async (u, init) => { seen.push(JSON.parse(init.body).submissionId); return new Response(null, { status: 204 }); };
  await run(capture)("sample", form);
  await run(capture)("sample", form);
  ok("a retry of the same form carries the same submissionId",
    seen.length === 2 && seen[0] === seen[1], seen.join(" vs "));
}

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
