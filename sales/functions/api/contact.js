/**
 * /api/contact — the team's own contacts, in the shared store.
 *
 * GET     every live contact       POST   upsert one (or {records:[...]} as a batch)
 * PATCH   partial update by id     DELETE ?id=...  soft delete
 *
 * Same story as /api/deal: these lived in localStorage under `vej_pipe_contacts_v1` and were
 * therefore trapped in whichever browser typed them. A contact is also what the phone activity
 * feed joins against by number, so a contact only one laptop can see is a call that lands on
 * no account. See functions/_lib/crm-proxy.js for the contract.
 */

import { proxyCrm } from '../_lib/crm-proxy.js';

const handler = (context) => proxyCrm(context, 'contacts');

export const onRequestGet = handler;
export const onRequestPost = handler;
export const onRequestPatch = handler;
export const onRequestDelete = handler;
