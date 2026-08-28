/**
 * Creating one prospect in Allo CRM — the whole contract, in one place.
 *
 * TWO CALLERS, deliberately, for the same reason _lib/instantly-shape.js has two:
 *
 *   sales/functions/api/prospect.js                     serves it from the edge (the button)
 *   sales-department/crumble-blitz/test-prospect-e2e.mjs  proves it against the real API
 *
 * If the create sequence lived only in the Pages Function it could only ever be tested by
 * deploying, and a write path that is awkward to test is a write path nobody tests.
 *
 * NO NETWORK OF ITS OWN. Every function here takes a `call(method, path, body)` and returns
 * data. The edge passes a fetch-backed call, the test script passes a curl-backed one, and
 * the logic they exercise is byte-identical.
 *
 * WHY A WRITE ROUTE AT ALL, given /api/allo, /api/instantly and /api/apollo are all read-only
 * on purpose: those three read systems that are authoritative elsewhere, where a dashboard
 * write would be a second source of truth. Allo CRM is different — nothing else owns it, and
 * the alternative to writing here is a rep retyping a name into two systems. The blast radius
 * is still held down hard: one person per call, no bulk, no delete, no campaign or queue
 * mutation, and the number is validated before anything is created.
 */

/* Apollo handed us a +91 Indian mobile for a real person at Black Diamond on 2026-08-28 and it
   reached the Power Dialer. A bad number is worse than a gap: the gap is visible, the bad
   number burns a slot mid-session. So NANP is asserted here rather than hoped for.
   Area code and exchange may not begin 0 or 1 — that is the NANP rule, not a guess. */
export function normalizeNANP(raw) {
  const digits = String(raw || '').replace(/[^\d]/g, '');
  const ten = digits.length === 11 && digits.startsWith('1') ? digits.slice(1) : digits;
  if (ten.length !== 10) return { ok: false, reason: `needs 10 digits, got ${ten.length}` };
  if (!/^[2-9]\d{2}[2-9]\d{6}$/.test(ten)) {
    return { ok: false, reason: 'area code and exchange cannot start with 0 or 1' };
  }
  return { ok: true, e164: `+1${ten}` };
}

/* PROBED, not assumed, 2026-08-28. Allo's person fields are `name` and `last_name`, and it
   renders a card as `name` followed by `last_name`.

   `first_name` DOES NOT EXIST. POST it and Allo returns 200 with the field absent from the
   response body and absent from the record — the same silent-drop behaviour that made every
   Power Dialer card read "Job & company unknown" when `title` was sent instead of `job_title`.
   Sending first_name + last_name therefore stores the SURNAME ONLY.

   So the full name goes in `name` and `last_name` stays empty. Sending the full name in
   `name` AND the surname in `last_name` is the other failure — that is what produced
   "Bill Trahan Trahan" on every row of the first crumble load. */
export function nameFields(full) {
  return { name: String(full || '').trim(), last_name: '' };
}

export function validate(input) {
  const errors = [];
  const person = String(input.person || '').trim();
  const company = String(input.company || '').trim();
  if (!person) errors.push('person name is required');
  if (!company) errors.push('company is required');

  let e164 = null;
  if (String(input.number || '').trim()) {
    const n = normalizeNANP(input.number);
    if (!n.ok) errors.push(`number: ${n.reason}`);
    else e164 = n.e164;
  } else {
    errors.push('a dialable number is required');
  }

  const email = String(input.email || '').trim();
  if (email && !/^[^@\s]+@[^@\s.]+\.[^@\s]+$/.test(email)) errors.push('email is not a valid address');

  /* A bare domain in an href is a RELATIVE path — the same trap that would have pointed half
     the crumble links back inside our own page. Normalised here so the CRM never stores one. */
  let website = String(input.website || '').trim();
  if (website && !/^https?:\/\//i.test(website)) website = `https://${website}`;

  return { errors, person, company, e164, email, website, title: String(input.title || '').trim() };
}

/* Fixed order, so a rep reading it mid-call always finds the same fact in the same place.
   Same shape as the note populate-allo.mjs writes, because a prospect added by hand and one
   loaded from the crumble list should not read differently on the dialer. */
export function noteFor(v, extra) {
  const L = [];
  L.push(`WHO — ${v.person}${v.title ? ', ' + v.title : ''} at ${v.company}`);
  L.push(`NUMBER — ${v.e164}`);
  if (v.email) L.push(`EMAIL — ${v.email}`);
  L.push('');
  if (extra.product) L.push(`PRODUCT — ${extra.product}`);
  if (extra.ask) L.push(`ASK — ${extra.ask}`);
  if (extra.opener) L.push(`OPEN WITH — ${extra.opener}`);
  if (extra.product || extra.ask || extra.opener) L.push('');
  L.push(`ACCOUNT — ${v.company}${v.website ? ' · ' + v.website : ''}`);
  if (extra.icp) L.push(`ICP — ${extra.icp}`);
  if (extra.note) L.push(`NOTES — ${extra.note}`);
  L.push('');
  L.push(`CLAIMS — do not quote sealing performance or an LCM grade. No sieve analysis in LCM grades, no fracture-sealing data. Ask what they run today.`);
  L.push(`SOURCE — added by hand from the Sales OS, ${extra.today}`);
  return L.join('\n');
}

const ok = (s) => s === 200 || s === 201;

/**
 * Create company (reused if `companyId` is supplied), person, and note.
 *
 * @param {(m:string,p:string,b?:object)=>Promise<{status:number,json:any}>} call
 * @returns {Promise<{ok:boolean, steps:object[], companyId?:string, personId?:string, reused?:boolean, error?:string}>}
 */
export async function createProspect(call, input, extra = {}) {
  const v = validate(input);
  const steps = [];
  if (v.errors.length) return { ok: false, steps, error: v.errors.join('; ') };

  const today = extra.today || new Date().toISOString().slice(0, 10);

  // ---- company
  let companyId = String(input.companyId || '').trim() || null;
  if (companyId) {
    steps.push({ step: 'company', action: 'reused', id: companyId });
  } else {
    const r = await call('POST', '/v2/api/crm/companies', {
      name: v.company,
      website: v.website || undefined,
    });
    if (!ok(r.status)) {
      steps.push({ step: 'company', action: 'failed', status: r.status, detail: msg(r) });
      return { ok: false, steps, error: `could not create the company (${r.status}): ${msg(r)}` };
    }
    companyId = r.json?.data?.id;
    steps.push({ step: 'company', action: 'created', id: companyId });
  }

  // ---- person
  const fields = {
    ...nameFields(v.person),
    job_title: v.title || undefined,   // `title` returns 200 and stores nothing. It is job_title.
    company_id: companyId || undefined,
    emails: v.email ? [v.email] : undefined,
  };

  let personId = null;
  let reused = false;
  const p = await call('POST', '/v2/api/crm/people', { ...fields, numbers: [v.e164] });

  if (ok(p.status)) {
    personId = p.json?.data?.id;
    steps.push({ step: 'person', action: 'created', id: personId });
  } else if (p.json?.error?.code === 'NUMBER_ALREADY_ASSIGNED') {
    /* Loading a Power Dialer queue creates people as bare numbers with no name — that IS the
       "Job & company unknown" card. Filling the existing record in is right; creating a second
       person holding the same phone is not. Allo names the id it collided with, so take it
       from the error rather than searching for it. */
    const existing = String(p.json.error.message || '').match(/per-[A-F0-9]+/i)?.[0];
    if (!existing) {
      steps.push({ step: 'person', action: 'failed', status: p.status, detail: msg(p) });
      return { ok: false, steps, error: `that number is already on a person Allo would not name: ${msg(p)}` };
    }
    const u = await call('PUT', `/v2/api/crm/people/${existing}`, fields);
    if (!ok(u.status)) {
      steps.push({ step: 'person', action: 'failed', status: u.status, detail: msg(u) });
      return { ok: false, steps, error: `that number already belongs to ${existing} and it could not be updated (${u.status})` };
    }
    personId = existing;
    reused = true;
    steps.push({ step: 'person', action: 'filled-in', id: personId, wasBareNumber: true });
  } else {
    steps.push({ step: 'person', action: 'failed', status: p.status, detail: msg(p) });
    return { ok: false, steps, error: `could not create the person (${p.status}): ${msg(p)}` };
  }

  // ---- note
  const n = await call('POST', `/v2/api/crm/people/${personId}/notes`, {
    content: noteFor(v, { ...extra, today }),
  });
  steps.push(ok(n.status)
    ? { step: 'note', action: 'created', id: n.json?.data?.id || true }
    : { step: 'note', action: 'failed', status: n.status, detail: msg(n) });

  return { ok: true, steps, companyId, personId, reused, e164: v.e164, noteOk: ok(n.status) };
}

/* Read the person back rather than trusting the create response. The whole reason this route
   exists is that the crumble load returned 200 for fields Allo silently dropped — a 201 is
   not evidence that anything was stored. */
export async function readBack(call, personId) {
  const r = await call('GET', `/v2/api/crm/people/${personId}`);
  if (!ok(r.status)) return { ok: false, status: r.status, detail: msg(r) };
  const d = r.json?.data || r.json || {};
  return {
    ok: true,
    /* `name` and `last_name`, in that order — the same two fields the card renders and the
       only two that exist. Reading first_name here is how this mapper reported a correct
       record as nameless. */
    name: [d.name, d.last_name].filter(Boolean).join(' ').trim() || null,
    job_title: d.job_title || null,
    company: d.company?.name || d.company_name || d.company_id || null,
    numbers: (d.numbers || []).map((x) => (typeof x === 'string' ? x : x?.number)).filter(Boolean),
    emails: (d.emails || []).map((x) => (typeof x === 'string' ? x : x?.email)).filter(Boolean),
  };
}

function msg(r) {
  return String(r?.json?.error?.message || r?.json?.message || r?.json?.error || '').slice(0, 300) || 'no detail';
}
