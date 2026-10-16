/**
 * Approval rules for the two copy stores (kind coldemail and kind nurture), enforced on the
 * edge. The buttons in the browser are a courtesy; this is the control.
 *
 *   1. Only admin or dev may write status "canonical" or "approved".
 *   2. Approved copy is locked against everyone else: a manager or sdr may not edit it or
 *      demote it. An admin must reopen it first.
 *   3. When an admin saves changed copy over an approved record without reopening it, the
 *      approval is dropped back to "draft". Approved wording must never change under its
 *      approval.
 */

export const COPY_KINDS = ['coldemail', 'nurture'];
export const LOCKED = ['canonical', 'approved'];
const APPROVERS = ['admin', 'dev'];

const isLocked = (s) => LOCKED.includes(String(s || ''));

/** The records a write body carries, as an array of objects. */
export function incomingRecords(parsed) {
  if (!parsed || typeof parsed !== 'object') return [];
  if (Array.isArray(parsed.records)) return parsed.records.filter((r) => r && typeof r === 'object');
  return [parsed];
}

/**
 * @param {string} role  the caller's role
 * @param {object} parsed  parsed POST/PATCH body
 * @param {Record<string, object>} stored  stored records of this kind, by id
 * @returns {{error?:string, status?:number, body?:object}} either a refusal or the body to forward
 */
export function applyApprovalRules(role, parsed, stored, fallbackId) {
  const approver = APPROVERS.includes(role);
  const list = incomingRecords(parsed);
  for (const rec of list) {
    const id = String(rec.id || fallbackId || '');
    const prev = stored[id] || {};
    if (!approver) {
      if (isLocked(rec.status)) {
        return { error: `${role} is not allowed to mark a record ${rec.status}. Only an admin can.`, status: 403 };
      }
      if (isLocked(prev.status)) {
        return { error: `${id} is ${prev.status} and locked. An admin must reopen it before it can be changed.`, status: 403 };
      }
      continue;
    }
    if (isLocked(prev.status) && isLocked(rec.status)) {
      const changed = JSON.stringify(rec.copy ?? null) !== JSON.stringify(prev.copy ?? null);
      if (changed) rec.status = 'draft';
    }
  }
  return { body: parsed };
}
