/**
 * The one place the "a lead must carry a reachable email and phone" rule is written down.
 *
 * Imported by functions/api/lead.js, which rejects anything that fails it, and MIRRORED
 * character for character inside CONTACT_RULES in app.js, which is what the visitor
 * actually sees. The two have to agree exactly. The form shows its confirmation as soon
 * as the client is satisfied and delivery is fire and forget, so any submission the
 * client waves through and the endpoint then rejects is a lead that disappears in
 * silence, which is the precise failure /api/lead was built to stop.
 *
 * scripts/check-contact-rules.mjs fails the build if the two copies drift apart.
 * Underscore-prefixed, so Cloudflare never routes it as an endpoint.
 */

/* Deliberately loose: local@label.tld, no dots-in-domain gymnastics, no TLD allowlist.
   It is here to catch a typo and an empty box, not to adjudicate RFC 5322. */
export const EMAIL_RE = /^[^@\s]+@[^@\s.]+\.[^@\s]+$/;

/* 10 digits is a full NANP number; 15 is the E.164 ceiling, so an international number
   with a country code still passes. Punctuation, spaces and a leading + are stripped
   first, because "(225) 398-9286" and "+1 225 398 9286" are the same phone. */
export const PHONE_MIN_DIGITS = 10;
export const PHONE_MAX_DIGITS = 15;

const str = (v) => (typeof v === "string" ? v : v == null ? "" : String(v));

export const isValidEmail = (v) => EMAIL_RE.test(str(v).trim());
export const phoneDigits = (v) => str(v).replace(/\D+/g, "");
export const isValidPhone = (v) => {
  const d = phoneDigits(v);
  return d.length >= PHONE_MIN_DIGITS && d.length <= PHONE_MAX_DIGITS;
};

/* Forms name these fields "email" and "phone", but read the aliases too so a future form
   (or a hand-rolled POST) cannot slip past the gate by calling the field something else. */
export const EMAIL_KEYS = ["email", "Email", "work_email", "contact_email"];
export const PHONE_KEYS = ["phone", "Phone", "tel", "telephone", "mobile", "phone_number"];

const firstValue = (fields, keys) => {
  for (const k of keys) {
    const v = fields[k];
    if (typeof v === "string" && v.trim()) return v;
  }
  return "";
};

export const emailFrom = (fields) => {
  const v = firstValue(fields, EMAIL_KEYS).trim();
  return isValidEmail(v) ? v : null;
};

/* Returns a human readable reason the lead is not contactable, or null if it is.
   Names the field rather than saying "invalid input", so a rejection in the logs points
   straight at what the visitor's browser should have caught first. */
export function contactError(fields) {
  const email = firstValue(fields, EMAIL_KEYS);
  const phone = firstValue(fields, PHONE_KEYS);
  if (!email) return "email is required";
  if (!isValidEmail(email)) return "email is not a valid address";
  if (!phone) return "phone is required";
  if (!isValidPhone(phone)) return `phone must contain ${PHONE_MIN_DIGITS} to ${PHONE_MAX_DIGITS} digits`;
  return null;
}
