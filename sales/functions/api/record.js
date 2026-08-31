/**
 * /api/record?kind=<note|lead|account|offtake|status|quarter> — the generic shared store.
 *
 * GET / POST (one or {records:[...]}) / PATCH / DELETE?id=..., all requiring `kind`.
 *
 * WHY IT EXISTS. When deals and contacts moved to D1 on 2026-08-31 the other six stores were
 * left in localStorage, which meant they were still trapped in one browser. The worst of them
 * by far is `note`: the per-account activity timeline, where every call a rep logs, every
 * email, note, task and meeting lands. Victor logged a call and Sarah never saw it. That is
 * the thing reps type most, and it was the least shared thing in the product.
 *
 * WHY ONE ROUTE AND NOT SIX. Nothing on the server reads inside these records — the browser is
 * the only thing that knows what an offtake row's shape is. `deals` and `contacts` are typed
 * because the server sums and joins their columns; these six would be six migrations to
 * maintain for zero queries. `kind` is validated against a fixed list upstream, so a caller
 * cannot invent a new one and grow the table a shape nothing renders.
 */

import { proxyCrm } from '../_lib/crm-proxy.js';

const handler = (context) => proxyCrm(context, 'records');

export const onRequestGet = handler;
export const onRequestPost = handler;
export const onRequestPatch = handler;
export const onRequestDelete = handler;
