/* ============================================================
   VEJ Sales OS · TASKS data model & engine
   Load order: data.js → gtm-data.js → THIS → app.js → gtm.js
   Depends on globals: GTM (gtm-data.js), DATA (data.js).
   Degrades safely if either is missing.

   PERSISTENCE
   -----------
   Base tasks + punch lists live here (git-tracked, edited by the
   morning cron agent). User interactions persist in localStorage as
   an OVERLAY that is merged over the base at render time:
     - done state          → shared CHECK_KEY engine (app.js getChecks),
                              via each task's `checkKey`. Calendar-sourced
                              tasks reuse the gtm calendar keys
                              (cal:<day>:<lane>:<i>) so checking a task in
                              the Tasks view and in the 30-Day calendar are
                              the SAME checkbox (true bidirectional link).
     - status / quick-adds → TASKS_OVERLAY key below.
   Base data is never mutated by the UI, so a refresh never loses it and
   no server is required.

   APOLLO / INSTANTLY are NOT authorized yet. The sync functions below are
   dormant stubs (return []) gated by INTEGRATIONS flags. They never
   fabricate data; they light up once the MCP connectors are wired.
   ============================================================ */
(function(){
  "use strict";

  const TASKS_CFG = {
    anchorDate: "2026-07-14",          // calendar Day 1 maps to this date; cron agent rolls it
    overlayKey: "vej_tasks_overlay_v1",
    horizonDays: 28                    // GTM.calendar length
  };

  /* ---- date helpers (UTC-safe, no timezone drift) ---- */
  const ymd   = dt => dt.toISOString().slice(0,10);
  const parse = s => { const [y,m,d]=String(s).split("-").map(Number); return new Date(Date.UTC(y,m-1,d)); };
  const addDays = (s,n) => { const dt=parse(s); dt.setUTCDate(dt.getUTCDate()+n); return ymd(dt); };
  const diffDays = (a,b) => Math.round((parse(a)-parse(b))/86400000);
  function todayYMD(){ const n=new Date(); return ymd(new Date(Date.UTC(n.getFullYear(),n.getMonth(),n.getDate()))); }
  const dueForCalDay = d => addDays(TASKS_CFG.anchorDate, d-1);
  // current calendar day for real "today", clamped to the plan window
  function todayCalDay(){ return Math.min(TASKS_CFG.horizonDays, Math.max(1, diffDays(todayYMD(), TASKS_CFG.anchorDate)+1)); }

  const CAL = (typeof GTM!=="undefined" && GTM.calendar) ? GTM.calendar : [];
  const LAUNCH = (typeof GTM!=="undefined" && GTM.launch) ? GTM.launch : {before:[],first48:[],firstWeek:{checkpoints:[]}};

  /* ============================================================
     BASE TASKS
     ============================================================ */

  // 1) Calendar-sourced tasks: every jesse/victor calendar item becomes a task.
  //    checkKey mirrors the gtm 30-Day calendar checkbox keys → bidirectional.
  function calTasks(){
    const out=[];
    CAL.forEach(day=>{
      const mk=(who,arr,lane)=>arr.forEach((t,i)=>{
        out.push({
          id:`cal-${day.d}-${lane}-${i}`,
          title:t,
          detail:`Day ${day.d} · ${day.theme}`,
          owner:who,
          due:dueForCalDay(day.d),
          calDay:day.d, wk:day.wk,
          priority: (day.light ? "P2" : (day.d<=2 && i===0 ? "P0" : "P1")),
          status:"todo",
          source:"calendar",
          checkKey:`cal:${day.d}:${lane}:${i}`,      // SHARED with gtm.js gtmCalPick()
          link:{view:"gtm-30day", anchor:`gtmCalPanel`},
          tags:[day.theme]
        });
      });
      mk("jesse", day.jesse||[], "j");
      mk("victor", day.victor||[], "v");
    });
    return out;
  }

  // 2) Manual milestone tasks — deep-linked into the connected views so the
  //    Tasks tab is the hub. Dated at the launch anchor so they surface on day 1.
  const MANUAL_TASKS = [
    {id:"m-source-100", title:"Source & tag the first 100 Gulf South accounts", detail:"Both tracks, freight-zoned, verified emails. Feeds every campaign.",
     owner:"jesse", due:TASKS_CFG.anchorDate, priority:"P0", status:"todo", source:"manual",
     checkKey:"task:m-source-100", link:{view:"accounts",anchor:"accTbl"}, tags:["list"]},
    {id:"m-crm-fields", title:"Stand up CRM objects / fields / stages in the app", detail:"Account · Contact · Deal · Sample · LOI + ICP/campaign tags.",
     owner:"jesse", due:TASKS_CFG.anchorDate, priority:"P0", status:"todo", source:"manual",
     checkKey:"task:m-crm-fields", link:{view:"pipeline",anchor:"sec-pipeline"}, tags:["build"]},
    {id:"m-approve-site", title:"Approve the website to publish + hand over the proof pack", detail:"Unblocks all downstream outreach & fulfillment.",
     owner:"victor", due:TASKS_CFG.anchorDate, priority:"P0", status:"todo", source:"manual",
     checkKey:"task:m-approve-site", link:{view:"gtm-launch",anchor:"sec-gtm-launch"}, tags:["product","website"]},
    {id:"m-launch-og-e1", title:"Launch CMP-OG Email 1 (Operation Wellpad) to top 30", detail:"Sample-first. No LOI/bulk talk in cold outreach.",
     owner:"jesse", due:addDays(TASKS_CFG.anchorDate,7), priority:"P1", status:"todo", source:"manual",
     checkKey:"task:m-launch-og-e1", link:{view:"outreach",anchor:"sec-outreach"}, tags:["outreach"]},
    {id:"m-roadmap-30", title:"Confirm the 30-day roadmap owners & deliverables", detail:"Every P0 has a name and a due date.",
     owner:"both", due:TASKS_CFG.anchorDate, priority:"P1", status:"todo", source:"manual",
     checkKey:"task:m-roadmap-30", link:{view:"roadmap",anchor:"sec-roadmap"}, tags:["planning"]},
    {id:"m-first-sample", title:"Ship the first requested free sample same-day + capture tracking", detail:"First real win of Month 1.",
     owner:"victor", due:addDays(TASKS_CFG.anchorDate,10), priority:"P1", status:"todo", source:"manual",
     checkKey:"task:m-first-sample", link:{view:"gtm-sample",anchor:"sec-gtm-sample"}, tags:["fulfillment"]}
  ];

  const BASE_TASKS = MANUAL_TASKS.concat(calTasks());

  /* ============================================================
     PUNCH LISTS — named, ordered, check-off-able (chk engine keys punch:<id>:<i>)
     ============================================================ */
  const websiteLaunch = [
    "Approve final copy on hero + O&G + industrial-remediation pages",
    "Publish /request-sample + /request-quote pages; forms route to Jesse + Victor + Daniel",
    "Create the two sample SKUs in Shopify (Pellets 1 lb, Biochar 8 oz); wire variant IDs into the site",
    "Publish certs / spec sheets (SDS, OMRI, IBI, Puro) to the site",
    "Install analytics: form / CTA / reply / bounce tracking",
    "Publish the new site LIVE on Shopify (over current)",
    "Confirm /oil-gas, /industrial-remediation render + convert on mobile and desktop"
  ];
  const dailyCadence = [
    "Review overnight replies; convert positive replies → follow-up tasks",
    "Send the day's ramped email batch (bounce < 2% or slow down)",
    "Make the day's dials; log every call to CRM",
    "Ship any requested samples same-day + capture tracking",
    "5pm check: bounce %, positive replies, samples in motion"
  ];

  const PUNCHLISTS = [
    {id:"website-launch", title:"Website Launch", link:{view:"gtm-launch"}, items:websiteLaunch},
    {id:"daily-cadence",  title:"Daily Cadence",  recurring:"daily", link:{view:"today"}, items:dailyCadence},
    {id:"deliverability", title:"Deliverability", link:{view:"gtm-crm"},
      items:[
        "SPF / DKIM / DMARC passing on every sending domain",
        "Inboxes warmed; ramp sends ~20→40/inbox/day",
        "Opt-out link + physical address in every template",
        "Suppress bounces & opt-outs daily; keep bounce < 2%",
        "Rotate inboxes; add a 2nd clean domain only if metrics hold"
      ]},
    {id:"first-48", title:"First 48 Hours", link:{view:"gtm-launch"},
      items:(LAUNCH.first48||[]).map(t=>`${t.t} — ${t.d}`)},
    {id:"launch-gate", title:"Pre-Outbound Gate", link:{view:"gtm-launch"},
      items:(LAUNCH.before||[]).slice()}
  ];

  /* ============================================================
     INTEGRATION STUBS — DORMANT until Apollo / Instantly MCP is authorized.
     Never fabricate data; return [] while disabled.
     ============================================================ */
  const INTEGRATIONS = { apollo:{enabled:false}, instantly:{enabled:false} };
  // Apollo: new replies → follow-up tasks. Wire the MCP call here when enabled.
  function syncApolloReplies(){ if(!INTEGRATIONS.apollo.enabled) return []; /* TODO(auth): map Apollo replies → tasks */ return []; }
  // Instantly: new leads → outreach tasks.
  function syncInstantlyLeads(){ if(!INTEGRATIONS.instantly.enabled) return []; /* TODO(auth): map Instantly leads → tasks */ return []; }

  /* ============================================================
     OVERLAY + PUBLIC API
     ============================================================ */
  function loadOverlay(){
    try{ const o=JSON.parse(localStorage.getItem(TASKS_CFG.overlayKey)); return o&&typeof o==="object" ? {status:o.status||{},added:o.added||[],removed:o.removed||[]} : {status:{},added:[],removed:[]}; }
    catch(e){ return {status:{},added:[],removed:[]}; }
  }
  function saveOverlay(o){ try{ localStorage.setItem(TASKS_CFG.overlayKey, JSON.stringify(o)); }catch(e){} }

  // done state comes from the shared checklist engine (app.js). Guard for load order.
  function isDone(t){ try{ return !!(getChecks()[t.checkKey]); }catch(e){ return false; } }

  // merge base + overlay + (dormant) integrations → decorated task list
  function allTasks(){
    const ov=loadOverlay();
    const removed=new Set(ov.removed);
    const merged = BASE_TASKS.concat(ov.added, syncApolloReplies(), syncInstantlyLeads())
      .filter(t=>!removed.has(t.id))
      .map(t=>{
        const done=isDone(t);
        const status = done ? "done" : (ov.status[t.id] || t.status || "todo");
        const overdue = !done && diffDays(todayYMD(), t.due) > 0;
        return Object.assign({}, t, {status, done, overdue, dueRel:diffDays(t.due, todayYMD())});
      });
    return merged;
  }

  const TasksAPI = {
    cfg:TASKS_CFG, punchlists:PUNCHLISTS,
    todayYMD, todayCalDay, diffDays, addDays, dueForCalDay,
    all: allTasks,
    integrations: INTEGRATIONS,
    // quick-add manual task → overlay
    add(t){
      const ov=loadOverlay(); const id="usr-"+Date.now().toString(36);
      ov.added.push({
        id, title:t.title||"Untitled task", detail:t.detail||"", owner:t.owner||"both",
        due:t.due||todayYMD(), priority:t.priority||"P1", status:"todo", source:"manual",
        checkKey:"task:"+id, link:t.link||null, tags:t.tags||["manual"]
      });
      saveOverlay(ov); return id;
    },
    setStatus(id,status){ const ov=loadOverlay(); ov.status[id]=status; saveOverlay(ov); },
    remove(id){ const ov=loadOverlay(); if(!ov.removed.includes(id)) ov.removed.push(id); delete ov.status[id]; ov.added=ov.added.filter(a=>a.id!==id); saveOverlay(ov); },
    // count of open (not-done) tasks whose deep-link points at a given view
    openForView(view){ return allTasks().filter(t=>!t.done && t.link && t.link.view===view).length; }
  };

  window.TASKS = BASE_TASKS;
  window.PUNCHLISTS = PUNCHLISTS;
  window.TasksAPI = TasksAPI;
})();
