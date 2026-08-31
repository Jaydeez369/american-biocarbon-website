/**
 * /api/lead — leads the phone created, and the two edits a human is allowed to make.
 *
 * GET     every live lead, most recently heard from first
 * PATCH   claim one, rename it, or change its status
 * DELETE  ?id=<E.164>  soft delete
 *
 * There is NO POST, deliberately. Leads are written by the allo-hooks consumer from real call
 * and text events; a lead the dashboard invented would be a person in the callback queue that
 * no conversation produced. A rep who wants a record with no conversation behind it is adding
 * a CONTACT, and /api/contact is that route.
 *
 * WHY THIS EXISTS AT ALL. Until 2026-08-31 a call from a number nobody had on file produced an
 * activity row and nothing else. The row matched no contact, so it rendered on no account, and
 * the person who rang us existed nowhere a rep would think to look. We were capturing the
 * conversation and losing the caller.
 *
 * The id here is the PHONE NUMBER in E.164, not a minted id: a lead is a number we have not
 * qualified yet, so the number is its identity, and the fifth call from someone updates one
 * lead instead of creating a fifth.
 */

import { proxyCrm } from '../_lib/crm-proxy.js';

const handler = (context) => proxyCrm(context, 'leads');

export const onRequestGet = handler;
export const onRequestPatch = handler;
export const onRequestDelete = handler;
