/**
 * Who may do what, once _middleware.js has established who they are.
 *
 * The gate next door answers "is this a person we know". This file answers the separate
 * question "is this person allowed to do THIS", and it is a separate file because the two
 * failure modes are different: a broken gate leaks the whole document to the internet, a
 * broken rule here lets a colleague delete a deal. Both matter. Only one is a breach.
 *
 * THE RULE THAT MAKES THIS REAL. Every check runs on the edge, inside the request, before
 * the upstream call. Nothing here is enforced by hiding a button. The Sales OS ships as
 * one static bundle to every role — hiding a control in pipeline.js is a courtesy to the
 * person using it, never a control, because the bundle is on their machine and the fetch
 * is theirs to retype. If a capability is not checked in a route handler, it is not
 * enforced at all.
 *
 * CAPABILITIES, not roles, at the call site. Routes ask for the thing they are about to
 * do; the mapping from role to capability lives here alone. That way "can a manager delete
 * a deal" is answered in one table that can be read in ten seconds, rather than by
 * grepping for `role === 'admin'` across a dozen files and hoping none were missed.
 */

/**
 * The capabilities, in the order they escalate. Each names a real consequence, because a
 * permission whose blast radius cannot be stated in one line cannot be reasoned about.
 *
 *   read           see the app at all, and every figure in it: COGS, price floors,
 *                  margin, the account roster. There is no partial read. Anyone given
 *                  any login is given the whole document.
 *   record.write   create or edit a deal, contact, lead or note in the shared store.
 *                  Recoverable: the store keeps the prior version.
 *   record.delete  soft-delete a record so it stops appearing. Recoverable by hand,
 *                  which is not the same as harmless.
 *   outbound.send  cause something to leave the building under the company's name — a
 *                  reply to a prospect, a person written into the Allo CRM. Not
 *                  recoverable. A sent email cannot be unsent.
 *   admin          change who can log in, and read diagnostics.
 */
export const CAPABILITIES = ['read', 'record.write', 'record.delete', 'outbound.send', 'admin'];

/**
 * Roles. Three, deliberately, because a role nobody occupies is a role nobody maintains.
 *
 *   admin    the owner of the business. Everything.
 *   manager  a rep who works the pipeline all day: reads everything, writes records,
 *            answers prospects. Cannot delete and cannot change who has access — the two
 *            actions whose damage outlives the day they happen.
 *   dev      the operator who deploys and debugs. Everything, plus it is the account the
 *            diagnostics routes answer to. Held by whoever is on the hook at 2am.
 *
 * `manager` is the interesting line. It is drawn at "recoverable by the person who did
 * it" — a wrong edit is fixed by editing again, a deletion needs somebody else, and a
 * sent email needs an apology. Sending is granted anyway because refusing it would mean a
 * rep cannot answer a prospect, which is the job.
 */
export const ROLES = {
  admin: ['read', 'record.write', 'record.delete', 'outbound.send', 'admin'],
  manager: ['read', 'record.write', 'outbound.send'],
  dev: ['read', 'record.write', 'record.delete', 'outbound.send', 'admin'],
};

export const DEFAULT_ROLE = 'manager';

export const isRole = (value) => Object.prototype.hasOwnProperty.call(ROLES, String(value));

/**
 * Does this account hold this capability?
 *
 * An unknown or missing role grants NOTHING rather than falling back to DEFAULT_ROLE.
 * The default exists for parsing an account line that omits the field on purpose; a role
 * string that survived parsing but is not in the table means the configuration and this
 * file disagree, and the safe reading of a disagreement about permissions is "no".
 */
export function can(account, capability) {
  if (!account || typeof account.role !== 'string') return false;
  const granted = ROLES[account.role];
  return Array.isArray(granted) && granted.includes(capability);
}

/**
 * The guard a route calls first.
 *
 * Returns null when the caller may proceed, or the Response to return when they may not.
 * Null-means-go is worth the small awkwardness at the call site: the alternative shapes
 * (throwing, or returning a boolean) both have a failure mode where forgetting to handle
 * the result lets the request through, and this one does not compile into anything that
 * silently continues.
 *
 * 403, never 404. Pretending the route does not exist would hide a permissions bug from
 * the person best placed to report it, and there is nothing to conceal here: every role
 * can already read the whole document, so the existence of a delete route is not a
 * secret. The body names the capability and the role so a support text says something
 * useful instead of "it didn't work".
 */
export function requireCapability(context, capability) {
  const account = context?.data?.user || null;
  if (!account) {
    /* Unreachable through the deployed app — _middleware.js runs first on every path and
       401s an unauthenticated request before any handler sees it. Kept because "the
       middleware definitely ran" is an assumption, and an assumption that is load-bearing
       for authorization should be checked rather than trusted. */
    return json({ ok: false, reason: 'unauthenticated', error: 'no authenticated session on this request' }, 401);
  }
  if (!can(account, capability)) {
    return json({
      ok: false,
      reason: 'forbidden',
      error: `${account.role} is not allowed to ${capability}`,
      required: capability,
      role: account.role,
    }, 403);
  }
  return null;
}

function json(body, status) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json', 'Cache-Control': 'private, no-store' },
  });
}

/**
 * The capability a CRM write needs, from its HTTP method.
 *
 * DELETE and a PATCH carrying `{deleted:true}` are the same act with different spelling,
 * so both resolve to record.delete. The soft-delete-by-PATCH path is the one a naive
 * method check misses, which is exactly why this mapping is a named function with a test
 * rather than a conditional inside the proxy.
 */
export function crmCapability(method, body) {
  const verb = String(method || '').toUpperCase();
  if (verb === 'GET' || verb === 'HEAD') return 'read';
  if (verb === 'DELETE') return 'record.delete';
  if (body && typeof body === 'object' && (body.deleted === true || body.deleted === 1)) {
    return 'record.delete';
  }
  return 'record.write';
}
