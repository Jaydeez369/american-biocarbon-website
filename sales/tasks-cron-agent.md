# Sales OS · Morning Tasks Cron Agent

Self-contained, **idempotent** prompt for a scheduled Claude Code agent. Runs each
weekday morning to keep the Tasks system (`website/sales/tasks-data.js`) fresh.
Running it twice in one day must produce the same result as running it once.

## Context
- Static, no-build SPA at `website/sales/`. Tasks live in `website/sales/tasks-data.js`.
- `TASKS_CFG.anchorDate` maps calendar **Day 1** → a real date. Rolling this date is
  how the calendar "advances." Day N's due date = `anchorDate + (N-1)` days.
- User done/status state lives in each browser's `localStorage` (overlay) — the agent
  never sees or edits it. The agent only edits the git-tracked base file.

## Steps (do all, in order)
1. **Read** `website/sales/tasks-data.js`. Note current `anchorDate` and today's date.
2. **Roll the calendar to today.** Compute the calendar day-number for today
   (`diff(today, anchorDate)+1`, clamped 1–28). If today is a weekend, target the next
   weekday. Do **not** change `anchorDate` unless the launch itself moved — rolling is a
   read/compute step; the due-date math already tracks real dates. Only edit `anchorDate`
   if the user explicitly restarts/reschedules the 28-day plan.
3. **Promote today's calendar items** into the "Today" surface: confirm the calendar tasks
   for today's day-number exist and are well-formed (owner, priority, `checkKey`). No
   duplication — they are generated from `GTM.calendar`; do not hand-copy them.
4. **Age & carry forward.** For any `MANUAL_TASKS` whose `due` is now in the past and that
   represent still-open work, bump `due` forward to today (carry-forward). Do not touch
   calendar-generated tasks (their dates are anchored). Never delete completed work from
   the base — completion is tracked per-browser in the overlay.
5. **Regenerate the day's action items** if the plan changed (new milestone, shifted date).
   Keep edits minimal and localized.
6. **Integrations (DORMANT — do not enable).** `syncApolloReplies()` / `syncInstantlyLeads()`
   return `[]` until Apollo/Instantly MCP is authorized. **Do not fabricate** Apollo/Instantly
   data. If — and only if — those MCP connectors are authorized in this environment, you may
   set the matching `INTEGRATIONS.*.enabled` flag and map real replies/leads into tasks.
   Otherwise leave them off.
7. **Commit (only if this is a git repo).** Run `git rev-parse --is-inside-work-tree`.
   - If git: create/switch to branch `tasks/auto-YYYY-MM-DD`, commit `tasks-data.js` with a
     clear message. **Do not push and do not touch the default branch** without the user asking.
   - If **not** a git repo (current state of this project): just save the file edits.
8. **Write a short human summary** (3–6 lines): what day the plan rolled to, which manual
   tasks were carried forward, anything you changed, and confirm integrations stayed dormant.

## Guardrails
- Edit only `website/sales/tasks-data.js`. Do not touch other `website/` files.
- Preserve the data shape and all existing tasks/punch lists.
- Keep it idempotent: re-running the same day changes nothing.
