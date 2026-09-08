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

/* WHAT WE CAN DO WITH THIS LEAD, which is a different question from whether the form was
   filled in perfectly.
 *
 * THE RULE CHANGED ON 2026-09-08 and this is why. It used to demand BOTH a valid email and a
 * valid phone and answer 400 otherwise, and the browser posts fire and forget and paints the
 * confirmation before the response arrives. So a submission carrying a real email and no usable
 * phone was thrown away, the visitor was thanked for it, and nobody could say how many there had
 * been, because the only trace was a console.warn in a log nobody reads.
 *
 * A lead with an address and no phone is a lead. You email it. Refusing it is refusing business
 * to keep a field tidy.
 *
 * So the gate is now the honest one: can we reach this person AT ALL. One good channel is
 * enough, and which channel is missing is recorded rather than punished. `missing` reaches the
 * Sales OS and shows on the lead, so a rep knows before they pick up the handset.
 *
 * Every form still ASKS for both and still marks both required, and the browser still enforces
 * that. Nothing here changes what a visitor is asked for; it changes what we do with a
 * submission that arrives without it anyway, which is a replayed POST, a browser told to skip
 * validation, or a field named something this file does not recognise.
 */
export function contactState(fields) {
  const email = firstValue(fields, EMAIL_KEYS);
  const phone = firstValue(fields, PHONE_KEYS);
  const goodEmail = Boolean(email) && isValidEmail(email);
  const goodPhone = Boolean(phone) && isValidPhone(phone);

  const missing = [];
  if (!goodEmail) missing.push("email");
  if (!goodPhone) missing.push("phone");

  /* Reachable on at least one channel. The reason names the field so a rejection in the logs
     still points at what the browser should have caught first. */
  const reachable = goodEmail || goodPhone;
  let reason = null;
  if (!reachable) {
    if (!email && !phone) reason = "no email and no phone were submitted";
    else if (email && !goodEmail && !phone) reason = "email is not a valid address";
    else if (phone && !goodPhone && !email) reason = `phone must contain ${PHONE_MIN_DIGITS} to ${PHONE_MAX_DIGITS} digits`;
    else reason = "neither the email nor the phone is usable";
  }

  return { reachable, missing, reason, goodEmail, goodPhone };
}

/* The reason nothing can be done with this lead, or null. Kept as the name the rest of the code
   and the build gate already use. It now means "not reachable on any channel" rather than "not
   perfectly filled in". See contactState above for why. */
export function contactError(fields) {
  return contactState(fields).reason;
}
