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
 *   4. Copy that fails the copy gate (copy-rules.js validateCopy) cannot be saved as ready,
 *      canonical or approved, by anyone. The same function backs the buttons in the browser,
 *      so a direct POST cannot do what the buttons refuse.
 *   5. Record ids are normalised the way the Worker normalises them (trimmed) BEFORE the lock
 *      lookup. Without this, {id:"A1 "} skipped the lock on "A1" and the Worker then wrote to
 *      row "A1". An id that disagrees with the ?id= in the URL is refused.
 */

import { validateCopy, formatFailures } from './copy-rules.js';

export const COPY_KINDS = ['coldemail', 'nurture'];
export const LOCKED = ['canonical', 'approved'];
const APPROVERS = ['admin', 'dev'];

const isLocked = (s) => LOCKED.includes(String(s || ''));
const GATED = ['ready', 'canonical', 'approved'];

/** The id exactly as the Worker will store it: a string, trimmed. */
export const normaliseId = (v) => String(v == null ? '' : v).trim();

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
 * @param {string} [fallbackId]  the ?id= from the URL, used when the body carries none
 * @param {'coldemail'|'nurture'} [kind]  which store; inferred from the copy shape when omitted
 * @returns {{error?:string, status?:number, body?:object}} either a refusal or the body to forward
 */
export function applyApprovalRules(role, parsed, stored, fallbackId, kind) {
  const approver = APPROVERS.includes(role);
  const list = incomingRecords(parsed);
  const fallback = normaliseId(fallbackId);
  const lookup = {};
  for (const [k, v] of Object.entries(stored || {})) lookup[normaliseId(k)] = v;
  for (const rec of list) {
    const bodyId = normaliseId(rec.id);
    if (/[\u0000-\u001f]/.test(String(rec.id == null ? '' : rec.id))) {
      return { error: 'that record id contains control characters', status: 400 };
    }
    if (bodyId && fallback && bodyId !== fallback && !Array.isArray(parsed && parsed.records)) {
      return { error: `the record id "${bodyId}" does not match the id in the URL ("${fallback}")`, status: 400 };
    }
    const id = bodyId || fallback;
    /* Forward the normalised id so the Worker writes the row that was checked. */
    if (id && rec.id !== undefined) rec.id = id;
    const prev = lookup[id] || {};
    if (!approver) {
      if (isLocked(rec.status)) {
        return { error: `${role} is not allowed to mark a record ${rec.status}. Only an admin can.`, status: 403 };
      }
      if (isLocked(prev.status)) {
        return { error: `${id} is ${prev.status} and locked. An admin must reopen it before it can be changed.`, status: 403 };
      }
    } else if (isLocked(prev.status) && isLocked(rec.status)) {
      const changed = JSON.stringify(rec.copy ?? null) !== JSON.stringify(prev.copy ?? null);
      if (changed) rec.status = 'draft';
    }
    /* The copy gate, for every role: wording that fails it cannot be marked ready or approved. */
    if (GATED.includes(String(rec.status || '')) && rec.copy && typeof rec.copy === 'object') {
      const k = kind || (Array.isArray(rec.copy.paras) ? 'nurture' : 'coldemail');
      const result = validateCopy(rec.copy, { kind: k });
      if (!result.ok) {
        return { error: `${id} cannot be marked ${rec.status}, the copy fails the copy gate:\n${formatFailures(result)}`, status: 422, failures: result.failures };
      }
    }
  }
  return { body: parsed };
}
