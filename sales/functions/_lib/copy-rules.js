/**
 * The copy gate for the two copy editors (Cold Email and Nurture Plan).
 *
 * ONE SOURCE, TWO RUNTIMES. The browser calls validateCopy() before Mark ready, Make canonical,
 * Approve and Copy for Instantly, and shows the failure list. The edge calls the same function
 * from _lib/approval.js, so a hand made POST cannot save copy the buttons would have refused.
 * `node scripts/build-brand.mjs` writes the browser copy (sales/copy-rules.js, window.COPY_RULES)
 * from this file; edit THIS file and rebuild, never the copy.
 *
 * Rules, all of them from the audits and the standing copy rules:
 *   1. no dash of any kind (hyphen, en dash, em dash, minus) in prose. Email addresses, URLs and
 *      domain names are identifiers and are exempt, exactly as check-copy-dashes treats them.
 *   2. merge tokens are camelCase only: {{firstName}}, never {{first_name}} or {first_name}.
 *      Braces must balance.
 *   3. {{firstName}} always carries a fallback. withFallback() rewrites a bare token to
 *      {{firstName | there}} in EVERY field (subject and body as well as the greeting); an empty
 *      fallback is a failure.
 *   4. banned claims: IBI certified, USDA Organic, Puro certified, carbon negative, 100 percent
 *      organic, organic fertilizer, outperforms clay, paint filter, 5X, "5 to 1" without "up to",
 *      and the retired $275 price.
 *   5. no price in a cold first touch (kind coldemail).
 *   6. none of the old brand strings from brand.config.
 *   7. a cold email signature is exactly three lines: name, company, phone.
 *
 * Nothing here sends anything.
 */

import { BRAND_CONFIG } from './brand.js';

const DASHES = /[-‐‑‒–—―−－﹘﹣⁃]/;
const DASH_NAMES = { '-': 'hyphen', '–': 'en dash', '—': 'em dash', '−': 'minus sign' };
/* Identifiers, not prose: email addresses, URLs, bare domains. Blanked before scanning. */
const EXEMPT = /\b[\w.+-]+@[\w.-]+\.\w+\b|\bhttps?:\/\/\S+|\b[\w-]+\.(?:com|org|net|earth|io)\b/g;

export const FIELD_LABELS = {
  subject: 'Subject', preheader: 'Preheader', heading: 'Heading', greeting: 'Greeting', body: 'Body',
  ask: 'Ask', signoff: 'Signature', paras: 'Paragraph', ctaLabel: 'Button label', ctaHref: 'Button link',
  footerNote: 'Footer note', imageAlt: 'Image description',
};
/* Machine fields: scanned for tokens and brand only, never for prose rules. */
const URL_FIELDS = new Set(['ctaHref', 'imageUrl']);

const CLAIMS = [
  [/\bIBI\s+certif/i, 'says IBI certified (IBI tested is the only true wording)'],
  [/certified\s+by\s+(the\s+)?IBI/i, 'says certified by IBI (IBI tested is the only true wording)'],
  [/\bUSDA\s+organic/i, 'claims USDA Organic'],
  [/\bPuro(\.earth)?\s+certified/i, 'says Puro certified (use "on the Puro.earth carbon removal pathway")'],
  [/carbon[\s-]+negative/i, 'says carbon negative (use durable carbon)'],
  [/100\s*(%|percent)\s+organic/i, 'says 100 percent organic'],
  [/organic\s+fertili[sz]er/i, 'says organic fertilizer'],
  [/outperforms?\s+clay/i, 'says outperforms clay'],
  [/paint[\s-]+filter/i, 'mentions the paint filter test'],
  [/\b5\s*x\b/i, 'says 5X (write "up to about 5 to 1 on non viscous liquids")'],
  [/\bfive\s+times\b/i, 'says five times (write "up to about 5 to 1 on non viscous liquids")'],
  [/\$\s?275\b/, 'quotes $275 (the absorbent price is "as low as $325 per US ton", quote only)'],
];

/* Rewrites every bare {{firstName}} to {{firstName | there}}, in any text. */
export function withFallback(s) {
  return String(s == null ? '' : s).replace(/\{\{\s*firstName\s*\}\}/g, '{{firstName | there}}');
}
/** withFallback applied to every string in a copy object (strings and arrays of strings). */
export function copyWithFallback(copy) {
  const out = {};
  for (const [k, v] of Object.entries(copy || {})) {
    out[k] = Array.isArray(v) ? v.map(withFallback) : typeof v === 'string' ? withFallback(v) : v;
  }
  return out;
}

function* strings(copy) {
  for (const [k, v] of Object.entries(copy || {})) {
    if (Array.isArray(v)) { let i = 0; for (const p of v) { if (typeof p === 'string' && p.trim()) yield [k, p, v.length > 1 ? ` ${i + 1}` : '']; i++; } }
    else if (typeof v === 'string' && v.trim()) yield [k, v, ''];
  }
}

/**
 * @param {object} copy  the copy fields of one record ({subject, greeting, body, ask, signoff} or the nurture fields)
 * @param {{kind?: 'coldemail'|'nurture', cfg?: object}} [opts]
 * @returns {{ok: boolean, failures: string[]}}
 */
export function validateCopy(copy, opts = {}) {
  const cfg = opts.cfg || BRAND_CONFIG;
  const kind = opts.kind || 'coldemail';
  const failures = [];
  const add = (label, msg) => { const f = `${label}: ${msg}`; if (!failures.includes(f)) failures.push(f); };
  const oldBrand = (cfg.oldBrandPatterns || []).map((p) => new RegExp(p, 'i'));

  for (const [key, raw, idx] of strings(copyWithFallback(copy))) {
    const label = (FIELD_LABELS[key] || key) + idx;
    const prose = raw.replace(EXEMPT, (m) => ' '.repeat(m.length));

    if (!URL_FIELDS.has(key)) {
      const m = DASHES.exec(prose);
      if (m) {
        const at = m.index;
        add(label, `contains a dash (${DASH_NAMES[m[0]] || 'dash'}) near "${raw.slice(Math.max(0, at - 18), at + 18).replace(/\s+/g, ' ').trim()}". Rewrite without it.`);
      }
    }

    /* Merge tokens. */
    const opens = (raw.match(/\{\{/g) || []).length, closes = (raw.match(/\}\}/g) || []).length;
    if (opens !== closes) add(label, 'has an unbalanced {{ }} merge token');
    for (const t of raw.matchAll(/\{\{\s*([^{}|]*?)\s*(?:\|\s*([^{}]*?)\s*)?\}\}/g)) {
      const name = t[1];
      if (!/^[a-z][a-zA-Z0-9]*$/.test(name)) add(label, `merge token {{${name}}} must be camelCase (for example {{firstName}}). snake_case ships a blank.`);
      if (name === 'firstName' && t[0].includes('|') && !String(t[2] || '').trim()) add(label, '{{firstName | }} has an empty fallback. Use {{firstName | there}}.');
    }
    if (/(?<!\{)\{\s*[a-z]+_[a-z_]+\s*\}(?!\})/i.test(raw) || /\[\s*[a-z]+_[a-z_]+\s*\]/i.test(raw)) {
      add(label, 'has a single brace or bracket merge token. Use {{camelCase}}.');
    }

    if (!URL_FIELDS.has(key)) {
      for (const [re, msg] of CLAIMS) if (re.test(raw)) add(label, msg);
      if (/\b5\s*(to|:)\s*1\b/i.test(raw) && !/up\s+to\s+(about\s+|roughly\s+|around\s+)?5\s*(to|:)\s*1/i.test(raw)) {
        add(label, 'says 5 to 1 without qualifying it ("up to about 5 to 1 on non viscous liquids")');
      }
      if (kind === 'coldemail' && /\$\s?\d/.test(raw)) add(label, 'has a price. No price in a cold first touch.');
    }
    for (const re of oldBrand) if (re.test(raw)) add(label, `contains an old brand string (${re.exec(raw)[0].trim()}). The company is ${cfg.brand}.`);
  }

  if (kind === 'coldemail' && typeof (copy || {}).signoff === 'string' && copy.signoff.trim()) {
    const lines = copy.signoff.split('\n').map((l) => l.trim()).filter(Boolean);
    if (lines.length !== 3) add('Signature', `must be exactly three lines (name, company, phone), found ${lines.length}`);
  }
  return { ok: failures.length === 0, failures };
}

/** The message to show a person, one failure per line. */
export function formatFailures(result) {
  return result.ok ? '' : result.failures.map((f) => `• ${f}`).join('\n');
}
