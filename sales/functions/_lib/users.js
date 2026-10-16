/* The SALES_OS_USERS parser, shared by the login gate and the daily summary so the two can never
   read the same secret differently. */

import { DEFAULT_ROLE, isRole } from './authz.js';

/**
 * Parse SALES_OS_USERS into accounts, newest wins on a duplicate username.
 *
 *   username:password:role:Display Name
 *
 * Split on the FIRST colon for the username and the LAST two fields for role and display
 * name, so a password may contain colons; a role and a display name may not, which is a
 * fair trade because one is a keyword and the other is a person's name. The role field is
 * optional: a line whose third field is not a known role is read as the old
 * username:password:Display Name shape, so accounts written before roles existed keep
 * working and land on DEFAULT_ROLE. Blank lines and #-comments are allowed so the
 * variable can be annotated in the Cloudflare UI.
 *
 * A line missing a username or a password is skipped rather than becoming an account with
 * an empty password, which would be an open door.
 */
export function parseUsers(env) {
  const out = new Map();
  /* Optional. When set, session cookies are signed with this instead of the user's password, so
     a stolen cookie cannot be used to brute force the password offline, and rotating the secret
     signs everyone out. Unset keeps the old behaviour. */
  const sessionSecret = typeof env.SALES_OS_SESSION_SECRET === 'string' ? env.SALES_OS_SESSION_SECRET.trim() : '';
  const raw = typeof env.SALES_OS_USERS === 'string' ? env.SALES_OS_USERS : '';
  for (const line of raw.split(/[\r\n,]+/)) {
    const entry = line.trim();
    if (!entry || entry.startsWith('#')) continue;
    const first = entry.indexOf(':');
    if (first < 1) continue;
    const username = entry.slice(0, first).trim().toLowerCase();

    /* Fields after the username, from the RIGHT, because the password is the only field
       allowed to contain a colon and so must absorb whatever is left over. */
    const rest = entry.slice(first + 1);
    const parts = rest.split(':');
    let role = DEFAULT_ROLE;
    let display = '';
    if (parts.length >= 3 && isRole(parts[parts.length - 2])) {
      display = parts.pop().trim();
      role = parts.pop().trim().toLowerCase();
    } else if (parts.length >= 2 && isRole(parts[parts.length - 1])) {
      role = parts.pop().trim().toLowerCase();
    } else if (parts.length >= 2) {
      display = parts.pop().trim();
    }
    const password = parts.join(':').trim();

    if (!username || !password) continue;
    out.set(username, { username, password, role, display: display || username, ...(sessionSecret ? { sessionKey: sessionSecret } : {}) });
  }

  /* The legacy shared password, as the account "team". Only if nobody has claimed that
     username, so a real person named team in SALES_OS_USERS is never shadowed.

     It gets DEFAULT_ROLE, not admin. Everyone who has ever been handed the shared word is
     holding it, and a password with unknown reach must not carry the two capabilities
     whose damage outlives the day — that is the whole argument for named accounts,
     applied to the credential that made the argument necessary. */
  const shared = typeof env.SALES_OS_PASSWORD === 'string' ? env.SALES_OS_PASSWORD.trim() : '';
  if (shared && !out.has('team')) {
    out.set('team', { username: 'team', password: shared, role: DEFAULT_ROLE, display: 'Team', shared: true, ...(sessionSecret ? { sessionKey: sessionSecret } : {}) });
  }
  return out;
}
