/**
 * Scrub secrets out of anything on its way into a response body.
 *
 * WHY THIS EXISTS. Every read route here answers a failure with a truncated upstream
 * error string in `error` or `detail`, so a failure is diagnosable from the browser
 * without an operator having to tail logs. That is worth keeping. The problem is who
 * WRITES that string: not us. It comes from a fetch implementation, a runtime, a proxy
 * or a vendor SDK, and any of them may put the request URL or the Authorization header
 * inside it. `fetch failed: GET https://…?api_key=…` is an ordinary shape for one of
 * those messages, and it would land in a browser's network tab.
 *
 * Nobody has seen that happen on this deployment. It is fixed anyway, because the cost
 * of the guard is one string replace on a path that only runs when something is already
 * broken, and the cost of being wrong once is a live API key in a place we do not
 * control, belonging to a vendor who bills us and can send mail as us.
 *
 * REDACTS BY ENV KEY NAME, NOT BY A LIST AT THE CALL SITE. Passing the secret explicitly
 * — redact(error, key) — works right up until somebody adds a second secret to a route
 * and does not think about this file, which is exactly the moment the guard is needed
 * and exactly when it would be missed. Handing the whole `env` over means a route that
 * gains a key is covered the day it gains it. ALLO_HOOKS_URL and friends are left alone
 * on purpose: they are not secrets, and blanking a hostname would make the message
 * useless for the one job it has.
 */

/** Env keys whose VALUES must never appear in a response. Matched on the name. */
const SECRET_NAME = /(KEY|TOKEN|SECRET|PASSWORD|PASS|CREDENTIAL|USERS|COOKIE|SALT|HASH)/i;

/**
 * A short value is not scrubbed. Two reasons: a secret that short is not a secret, and
 * blanking a common two- or three-character string would corrupt every message it
 * happens to appear in — which turns a diagnostic aid into a puzzle.
 */
const MIN_LENGTH = 8;

export function secretValues(env) {
  const out = [];
  if (!env || typeof env !== 'object') return out;
  for (const [name, value] of Object.entries(env)) {
    if (typeof value !== 'string') continue;
    const trimmed = value.trim();
    if (trimmed.length < MIN_LENGTH) continue;
    if (SECRET_NAME.test(name)) out.push(trimmed);
  }
  /* Longest first. SALES_OS_USERS contains the individual account lines, so scrubbing a
     short one first could leave the longer string it sits inside partially matched and
     partially intact. */
  return out.sort((a, b) => b.length - a.length);
}

/**
 * Turn an error into a response-safe string.
 *
 * TRUNCATES AFTER REDACTING, never before. Slicing first would cut a key in half at the
 * limit, and half a key that no longer matches the search string survives the scrub —
 * a leak that only shows up on long error messages, which is to say the interesting
 * ones. Do not reorder these two lines.
 */
export function redact(value, env, limit = 200) {
  let text = value instanceof Error ? `${value.name}: ${value.message}` : String(value);
  for (const secret of secretValues(env)) {
    if (text.includes(secret)) text = text.split(secret).join('«redacted»');
  }
  return text.slice(0, limit);
}
