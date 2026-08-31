/**
 * /api/deal — the team's own deals, in the shared store.
 *
 * GET     every live deal          POST   upsert one (or {records:[...]} as a batch)
 * PATCH   partial update by id     DELETE ?id=...  soft delete
 *
 * Until 2026-08-31 these records lived in localStorage under `vej_pipe_deals_v1`, which meant
 * a deal typed on a laptop did not exist on a phone, Victor could not see Sarah's pipeline,
 * and clearing site data silently destroyed the book of business with no copy anywhere. The
 * store behind this route is the fix. See functions/_lib/crm-proxy.js for the whole contract.
 */

import { proxyCrm } from '../_lib/crm-proxy.js';

const handler = (context) => proxyCrm(context, 'deals');

export const onRequestGet = handler;
export const onRequestPost = handler;
export const onRequestPatch = handler;
export const onRequestDelete = handler;
