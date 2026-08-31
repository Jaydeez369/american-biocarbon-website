/* ============ VEJ Sales OS — LIVE SALES PIPELINE (ported from SIBRA/Replit) ============
   A fully interconnected CRM built on ONE live data layer. pipeline-data.js (window.PIPE)
   is the imported SIBRA snapshot; the team's own adds/edits live in localStorage and MERGE
   with the snapshot at render. Every tab — Pipeline, Production Plan, Executive Dashboard,
   Offtake Pipeline, Deals, Contacts, Leads, Reports — reads from the same live accessors
   (liveDeals / liveAccounts / allContacts / allLeads / offRowsAll), so adding a deal
   cascades everywhere at once: KPIs, charts, reports, offtake-confirmed, account rollups.

   Any add/edit/delete saves to localStorage then calls rerender() (app.js), which rebuilds
   the whole section from live state — one source of truth, everything cohesive.
   Snapshot records are read-only (base:true); records the team adds are fully CRUD.
   Loads BEFORE app.js; exposes window.PIPELIVE.rCRM for LEAN_SECTIONS. */
(function(){
  const P = window.PIPE;
  const esc = s => String(s??"").replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;");
  const fin = n => Number.isFinite(+n)?+n:0;
  const money = n => "$" + Math.round(fin(n)).toLocaleString();
  const kfmt = n => "$" + Math.round(fin(n)/1000) + "K";
  const num = n => Math.round(fin(n)).toLocaleString();
  const lsGet=(k,d)=>{ try{ const v=JSON.parse(localStorage.getItem(k)); return v==null?d:v; }catch(e){ return d; } };
  /* Every write to one of the six shared stores schedules a push. Hooking the setter rather
     than editing a dozen call sites is deliberate: a new save handler added later is synced
     without anyone remembering to wire it, which is exactly how these six got left behind when
     deals and contacts moved to D1. */
  const lsSet=(k,v)=>{
    try{ localStorage.setItem(k,JSON.stringify(v)); }catch(e){}
    try{ if(typeof scheduleSync==="function") scheduleSync(k); }catch(e){}
  };
  const rr=()=>{ if(typeof rerender==="function") rerender(); };

  /* ======================= LIVE DATA LAYER ======================= */
  const D_KEY="vej_pipe_deals_v1";       // custom deals
  const C_KEY="vej_pipe_contacts_v1";    // custom contacts
  const L_KEY="vej_pipe_leads_v1";       // custom leads
  const O_KEY="vej_pipe_offtake_v1";     // custom offtake rows
  const A_KEY="vej_pipe_accounts_v1";    // custom accounts
  const N_KEY="vej_pipe_acct_notes_v1";  // per-account notes/activity (profile timeline)
  const QX_KEY="vej_pipe_extra_quarters";

  /* ================= SHARED STORE SYNC =================
     Until 2026-08-31 everything above this comment lived ONLY in localStorage. That is a cache,
     not a database: a deal typed on a laptop did not exist on a phone, Victor could not see
     Sarah's contacts, and "clear site data" was a silent unrecoverable delete of the book of
     business. /api/deal and /api/contact put those two stores in D1 behind the login.

     LOCALSTORAGE STAYS, deliberately, as a write-through cache and offline fallback:

       write  local first, then the network. A rep on a bad connection in a yard never loses a
              typed entry to a failed fetch, and never waits on one either — the UI re-renders
              from local state exactly as fast as it always did.
       read   render local immediately, hydrate from the server, re-render if anything changed.
              The page is never blank waiting on a fetch.
       fail   the local write already happened, so a failure is a SYNC failure, not data loss.
              It is queued and retried; nothing is thrown away.

     EVERY RECORD CARRIES A CLIENT-MINTED `id`. That is what makes the whole thing idempotent:
     replaying a queue after a reconnect writes the rows it holds rather than a second copy of
     each. Without stable ids the sync would duplicate the pipeline every time someone drove
     through a dead spot. Records created before this feature have no id, so migrate() mints
     them once and the flag below stops it running twice. */
  const SYNC_KEY="vej_pipe_sync_queue_v1";   // writes that have not reached the server yet
  const MIG_KEY="vej_pipe_migrated_v1";      // one-time localStorage -> D1 push, per browser
  const ROUTES={ deals:"/api/deal", contacts:"/api/contact" };
  const STORES={ deals:D_KEY, contacts:C_KEY };

  const uid = p => `${p}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2,8)}`;
  const nowISO = () => new Date().toISOString();

  /* Digits only, last ten — the NANP identity. The activity feed precomputes the same key on
     the edge; two normalisers for one join is how a call lands on nobody's timeline. */
  const phoneKey = raw => { const d=String(raw||"").replace(/[^\d]/g,""); return d.length<10?"":d.slice(-10); };
  const toE164 = raw => { const k=phoneKey(raw); return k?`+1${k}`:""; };

  let SYNC_STATE={ ok:null, reason:null, at:null };   // surfaced in the UI, not just the console

  /* Queued writes survive a reload, so closing the laptop mid-sync does not strand a deal in
     one browser. Drained on every successful call and on load. */
  const queueAdd = item => { const q=lsGet(SYNC_KEY,[]); q.push(item); lsSet(SYNC_KEY,q); };

  async function apiCall(kind, method, body, query){
    const url=ROUTES[kind]+(query||"");
    const res=await fetch(url,{ method, headers:{"Content-Type":"application/json"},
      credentials:"same-origin", body:body?JSON.stringify(body):undefined });
    let data={}; try{ data=await res.json(); }catch(e){}
    if(!res.ok || data.ok===false){
      const err=new Error(data.error||data.reason||`store returned ${res.status}`);
      err.reason=data.reason; throw err;
    }
    return data;
  }

  /* Push one record. Local is already written by the caller, so a failure here queues rather
     than alerting — the rep's entry is safe and the retry is invisible. The one thing this
     must NOT do is report success it did not get. */
  async function pushRecord(kind, rec){
    try{
      await apiCall(kind,"POST",rec);
      SYNC_STATE={ ok:true, reason:null, at:nowISO() };
      await drainQueue();
    }catch(err){
      SYNC_STATE={ ok:false, reason:err.reason||err.message, at:nowISO() };
      queueAdd({ kind, method:"POST", rec });
    }
    syncBadge();
  }

  async function removeRecord(kind, id){
    if(!id) return;
    try{
      await apiCall(kind,"DELETE",null,`?id=${encodeURIComponent(id)}`);
      SYNC_STATE={ ok:true, reason:null, at:nowISO() };
    }catch(err){
      SYNC_STATE={ ok:false, reason:err.reason||err.message, at:nowISO() };
      queueAdd({ kind, method:"DELETE", id });
    }
    syncBadge();
  }

  /* ---- the generic store: notes, custom leads, accounts, offtake, status, quarters ----
     These six were still localStorage-only after deals and contacts moved to D1. `note` is the
     one that mattered most: every call, email, note, task and meeting a rep logs lands there,
     and it was the least shared thing in the product. Same write-through contract as deals —
     local first so nothing typed is ever lost, then the network, then a queued retry. */
  /* Built LAZILY, not at definition time. ST_KEY is declared further down this file, so an
     eager object literal here dies with "Cannot access 'ST_KEY' before initialization" and
     takes the whole IIFE — and therefore window.PIPELIVE, and therefore every section — with
     it. Exactly the trap the ROSTER_BY index above already documents. */
  const RECORD_KEYS=()=>({ [N_KEY]:"note", [L_KEY]:"lead", [A_KEY]:"account",
                           [O_KEY]:"offtake", [ST_KEY]:"status", [QX_KEY]:"quarter",
                           [T_KEY]:"todo" });
  let _recordKind=null;
  const RECORD_KIND_OF=k=>{ if(!_recordKind) _recordKind=RECORD_KEYS(); return _recordKind[k]; };

  async function recordCall(kind, method, body, extra){
    const q=`?kind=${encodeURIComponent(kind)}${extra||""}`;
    const res=await fetch("/api/record"+q,{ method, headers:{"Content-Type":"application/json"},
      credentials:"same-origin", body:body?JSON.stringify(body):undefined });
    let data={}; try{ data=await res.json(); }catch(e){}
    if(!res.ok||data.ok===false){ const e=new Error(data.error||data.reason||`store returned ${res.status}`); e.reason=data.reason; throw e; }
    return data;
  }

  async function pushRecords(kind, list){
    try{
      await recordCall(kind,"POST",{records:list});
      SYNC_STATE={ ok:true, reason:null, at:nowISO() };
    }catch(err){
      SYNC_STATE={ ok:false, reason:err.reason||err.message, at:nowISO() };
      list.forEach(rec=>queueAdd({ generic:kind, method:"POST", rec }));
    }
    syncBadge();
  }

  /* GRANULARITY, and the tradeoff, stated plainly.

     `note` syncs ONE RECORD PER ACCOUNT (id = the account name): the timeline is the store two
     people are most likely to touch at once, and per-account records mean Victor logging a call
     on Flowerwood cannot clobber Sarah logging one on Murff. Within a single account it is
     still last-write-wins.

     The other five sync as ONE record holding the whole blob. They are small, rarely edited,
     and edited by one person at a time; splitting them would mean inventing stable ids for
     things that never had them (a status override is keyed by a normalised account name, a
     quarter is a bare string) for contention that does not happen in practice. If offtake
     editing ever becomes a two-person job this is the line to revisit. */
  function syncStore(key){
    const kind=RECORD_KIND_OF(key); if(!kind) return;
    const val=lsGet(key,null); if(val==null) return;
    const at=nowISO();
    if(kind==="note"){
      const list=Object.entries(val).map(([account,acts])=>({
        id:account, scope:account, acts, updated_at:at }));
      if(list.length) pushRecords(kind,list);
    } else {
      pushRecords(kind,[{ id:"all", data:val, updated_at:at }]);
    }
  }

  /* Debounced: a single rep action can call lsSet more than once (consolidating note buckets
     rewrites the store, then the caller writes again), and each one should not be its own
     round trip. */
  const SYNC_TIMERS={};
  function scheduleSync(key){
    if(!RECORD_KIND_OF(key)) return;
    clearTimeout(SYNC_TIMERS[key]);
    SYNC_TIMERS[key]=setTimeout(()=>syncStore(key),400);
  }

  async function removeGeneric(kind, id){
    if(!id) return;
    try{ await recordCall(kind,"DELETE",null,`&id=${encodeURIComponent(id)}`); }
    catch(err){ queueAdd({ generic:kind, method:"DELETE", id }); }
    syncBadge();
  }

  async function drainQueue(){
    const q=lsGet(SYNC_KEY,[]); if(!q.length) return;
    const left=[];
    for(const item of q){
      try{
        if(item.generic){
          if(item.method==="DELETE") await recordCall(item.generic,"DELETE",null,`&id=${encodeURIComponent(item.id)}`);
          else await recordCall(item.generic,"POST",item.rec);
        }
        else if(item.method==="DELETE") await apiCall(item.kind,"DELETE",null,`?id=${encodeURIComponent(item.id)}`);
        else await apiCall(item.kind,"POST",item.rec);
      }catch(e){ left.push(item); }
    }
    lsSet(SYNC_KEY,left);
  }

  /* Merge server rows into the local store, keyed by id, newest updated_at winning.
     Records the server does not know about are KEPT, not deleted — an unsynced local record
     is a pending write, and treating "absent upstream" as "deleted" would erase exactly the
     entries this whole design exists to protect. */
  function mergeDown(kind, remote){
    const key=STORES[kind];
    const local=lsGet(key,[]);
    const byId=new Map();
    local.forEach(r=>{ if(r&&r.id) byId.set(r.id,r); });
    let changed=false;
    for(const r of remote){
      if(!r||!r.id) continue;
      const mine=byId.get(r.id);
      if(!mine || String(r.updated_at||"")>=String(mine.updated_at||"")){ byId.set(r.id,r); changed=true; }
    }
    const unsynced=local.filter(r=>!r||!r.id);
    const merged=[...byId.values(),...unsynced];
    if(changed||merged.length!==local.length){ lsSet(key,merged); return true; }
    return false;
  }

  /* The one-time migration. Anything already sitting in this browser's localStorage is minted
     an id and pushed as a batch. Keyed by MIG_KEY so a reload cannot run it twice, and keyed by
     id upstream so even if it did, the result would be the same rows rather than duplicates —
     belt and braces, because a duplicated pipeline is very visible and very annoying to undo. */
  async function migrateUp(){
    if(lsGet(MIG_KEY,false)) return;
    let pushed=0;
    for(const kind of ["deals","contacts"]){
      const key=STORES[kind];
      const arr=lsGet(key,[]);
      if(!arr.length) continue;
      const stamped=arr.map(r=>({ ...r, id:r.id||uid(kind==="deals"?"deal":"contact"),
        created_at:r.created_at||nowISO(), updated_at:r.updated_at||nowISO() }));
      lsSet(key,stamped);                       // local first, so ids survive a failed push
      try{ await apiCall(kind,"POST",{records:stamped}); pushed+=stamped.length; }
      catch(e){ stamped.forEach(rec=>queueAdd({kind,method:"POST",rec})); }
    }
    lsSet(MIG_KEY,true);
    if(pushed) console.info(`[pipeline] migrated ${pushed} local records into the shared store`);
  }

  /* Called once on load. Renders from local immediately (the caller already did), then brings
     the shared store down and re-renders only if something actually changed — a pointless
     rerender mid-typing would blow away a half-filled modal. */
  async function hydrate(){
    await migrateUp();
    await drainQueue();
    let changed=false;
    for(const kind of ["deals","contacts"]){
      try{
        const data=await apiCall(kind,"GET");
        if(Array.isArray(data.records) && mergeDown(kind,data.records)) changed=true;
        SYNC_STATE={ ok:true, reason:null, at:nowISO() };
      }catch(err){
        SYNC_STATE={ ok:false, reason:err.reason||err.message, at:nowISO() };
      }
    }
    if(await hydrateGeneric()) changed=true;
    await loadPhoneActivity();
    await loadPhoneLeads();
    await loadMail();
    syncBadge();
    if(changed||PHONE.rows.length||PHONE_LEADS.length||MAIL.rows.length) rr();
  }

  /* ---- phone activity, from /api/activity (allo-hooks D1, live) ----
     Matched onto accounts in the browser rather than on the edge, using the SAME norm()/canon
     key the rest of the pipeline uses, so a call cannot invent a duplicate account. */
  const PHONE={ rows:[], byKey:new Map(), ok:null, reason:null };
  async function loadPhoneActivity(){
    try{
      const res=await fetch("/api/activity?limit=1000",{credentials:"same-origin"});
      const data=await res.json();
      PHONE.ok=!!data.ok; PHONE.reason=data.reason||null;
      PHONE.rows=Array.isArray(data.rows)?data.rows:[];
      PHONE.byKey=new Map();
      for(const r of PHONE.rows){
        if(!r.key) continue;
        if(!PHONE.byKey.has(r.key)) PHONE.byKey.set(r.key,[]);
        PHONE.byKey.get(r.key).push(r);
      }
    }catch(e){ PHONE.ok=false; PHONE.reason="unreachable"; }
  }

  /* ---- Instantly mail, from /api/email ----
     The twin of PHONE: same live-fetch, same fail-soft, same in-browser matching. Joined on
     EMAIL DOMAIN rather than address, because a campaign writes to one person at a company and
     the reply can come from another, or from a shared inbox — matching the exact address would
     split one conversation across two accounts. */
  const MAIL={ rows:[], ok:null, reason:null, replies:0 };
  async function loadMail(){
    try{
      const res=await fetch("/api/email",{credentials:"same-origin"});
      const data=await res.json();
      MAIL.ok=!!data.ok; MAIL.reason=data.reason||null;
      MAIL.rows=Array.isArray(data.rows)?data.rows:[];
      MAIL.replies=data.replies||0;
    }catch(e){ MAIL.ok=false; MAIL.reason="unreachable"; MAIL.rows=[]; }
  }

  /* Domains belonging to an account: from its contacts' addresses, plus the account's own
     website host, which is how mail matches an account that has no contact on file yet. */
  function domainsFor(name){
    const out=new Set();
    const dom=a=>{ const s=String(a||"").toLowerCase(); const i=s.lastIndexOf("@"); return i===-1?"":s.slice(i+1); };
    allContacts().filter(c=>norm(c.account||"")===norm(name)).forEach(c=>{ const d=dom(c.email); if(d) out.add(d); });
    const acct=liveAccounts().find(a=>norm(a.name)===norm(name));
    const host=String((acct&&(acct.website||acct.domain))||"").replace(/^https?:\/\//,"").replace(/^www\./,"").split("/")[0].toLowerCase();
    if(host) out.add(host);
    return out;
  }

  function mailFor(name){
    if(!MAIL.rows.length) return [];
    const doms=domainsFor(name);
    if(!doms.size) return [];
    return MAIL.rows.filter(r=>r.key&&doms.has(r.key));
  }

  /* Instantly mail as a timeline activity. No `_idx`, so no delete button: this is what the
     sending system recorded, not a note the team typed, and offering to delete it would imply
     the deletion reached Instantly. */
  function mailToActivity(r){
    const title=r.isReply
      ? `Reply received — ${r.subject}`
      : (r.manual?`Reply sent — ${r.subject}`:`Email sent — ${r.subject}`);
    return { ch:"email", who:r.who||"", title, body:r.body||"(no body captured)",
      status:r.isReply?"replied":"logged", ts:r.at, _mail:true };
  }

  /* Bring the six generic stores down. Merged by updated_at like deals and contacts: a local
     record the server has not seen is KEPT, because an unsynced local edit is a pending write
     and treating "absent upstream" as "deleted" would erase the very entries this exists to
     protect. */
  async function hydrateGeneric(){
    let changed=false;
    for(const [key,kind] of Object.entries(RECORD_KEYS())){
      let data;
      try{ data=await recordCall(kind,"GET"); }
      catch(err){ SYNC_STATE={ ok:false, reason:err.reason||err.message, at:nowISO() }; continue; }
      const recs=Array.isArray(data.records)?data.records:[];
      if(!recs.length) continue;

      if(kind==="note"){
        const local=lsGet(N_KEY,{});
        let touched=false;
        for(const r of recs){
          if(!r.id||!Array.isArray(r.acts)) continue;
          /* Per account, the newer side wins whole. Merging two timelines entry by entry would
             need per-activity ids these records have never had; account granularity is the
             honest limit and it is stated where syncStore explains the tradeoff. */
          const mine=local[r.id];
          if(!mine || (r.updated_at||"") >= (LOCAL_STAMP[r.id]||"")){
            local[r.id]=r.acts; touched=true;
          }
        }
        if(touched){ writeQuiet(N_KEY,local); changed=true; }
      } else {
        const rec=recs.find(x=>x.id==="all");
        if(rec && rec.data!=null){
          const key2=key;
          const cur=JSON.stringify(lsGet(key2,null));
          if(cur!==JSON.stringify(rec.data)){ writeQuiet(key2,rec.data); changed=true; }
        }
      }
    }
    return changed;
  }

  /* Timestamps for the note buckets this browser last wrote, so hydrate can tell its own work
     from somebody else's without re-pushing everything it just pulled. */
  const LOCAL_STAMP={};

  /* Write to localStorage WITHOUT scheduling a push. Hydration must not echo what it just
     received straight back to the server; without this, every load would rewrite every record
     and two browsers would ping-pong updated_at forever. */
  function writeQuiet(k,v){ try{ localStorage.setItem(k,JSON.stringify(v)); }catch(e){} }

  async function loadPhoneLeads(){
    try{
      const res=await fetch("/api/lead",{credentials:"same-origin"});
      const data=await res.json();
      PHONE_LEADS=Array.isArray(data.records)?data.records:[];
    }catch(e){ PHONE_LEADS=[]; }
  }

  /* Claim a lead. The phone stops writing to it, and its status changes so it stops reading as
     untouched new traffic; it stays in the list, because a rep needs to see what they claimed.
     This is the one write the dashboard is allowed to make to a lead, because it is a statement
     about what a HUMAN has done, not a correction of what the phone recorded. */
  window.pipeLeadClaim=phone=>{
    /* Claiming used to only flip a flag: the lead left the queue and the person was still in no
       book, which meant the phone captured a conversation and the journey stopped there. It now
       opens the contact form prefilled, so claiming a lead and having a contact are one action.
       The lead is marked claimed only AFTER the contact saves, so an abandoned form leaves the
       lead in the queue rather than losing it. */
    const l=PHONE_LEADS.find(x=>x.phoneE164===phone);
    if(!l){ alert("That lead is no longer in the queue."); return; }
    const parts=String(l.name||"").trim().split(/\s+/);
    pipeContactModal(null,{
      first:parts[0]||"", last:parts.slice(1).join(" ")||"",
      account:l.company||"", phone:l.phoneE164,
      notes:l.last_summary?`From the phone: ${l.last_summary}`:"",
      __leadPhone:l.phoneE164,
    });
  };

  /* Called by pipeContactSave once the contact is actually stored. */
  async function claimLeadAfterContact(phone,contact){
    try{
      await fetch("/api/lead",{ method:"PATCH", headers:{"Content-Type":"application/json"},
        credentials:"same-origin",
        body:JSON.stringify({ id:phone, claimed:1, status:"qualified", name:contact.name, company:contact.account }) });
      await loadPhoneLeads();
    }catch(e){ /* the contact exists either way; the lead simply stays in the queue */ }
  }

  /* Every phone row belonging to an account, found by matching the numbers on that account's
     contacts. Falls back to the company name the phone system itself recorded, which is how a
     call from a number nobody has on file still reaches the right timeline. */
  function phoneActivityFor(name){
    if(!PHONE.rows.length) return [];
    const keys=new Set();
    allContacts().filter(c=>norm(c.account||"")===norm(name)).forEach(c=>{
      [c.phone,c.mobile,c.phoneE164].forEach(v=>{ const k=phoneKey(v); if(k) keys.add(k); });
    });
    const out=[];
    const seen=new Set();
    for(const r of PHONE.rows){
      const hit=(r.key&&keys.has(r.key)) || (r.company&&norm(r.company)===norm(name));
      if(!hit) continue;
      const sig=`${r.at}|${r.kind}|${r.key}`;
      if(seen.has(sig)) continue;
      seen.add(sig);
      out.push(r);
    }
    return out;
  }

  /* Turn a phone row into the timeline's own activity shape. `_idx` is deliberately absent so
     no delete button renders: these are facts the phone system recorded, not notes the team
     typed, and letting somebody "delete" one from here would suggest it changed anything. */
  function phoneToActivity(r){
    const who=r.who||r.number||"";
    const dir=r.direction==="INBOUND"?"Inbound":r.direction==="OUTBOUND"?"Outbound":"";
    const mins=r.minutes!=null?` · ${r.minutes} min`:"";
    let title, body="";
    if(r.kind==="call"){ title=`${dir} Call${r.result?" — "+r.result:""}`.trim(); body=(r.summary||"")+(mins&&!r.summary?`Duration ${r.minutes} min`:""); }
    else if(r.kind==="sms"){ title=`${dir} Text`.trim(); body=r.summary||""; }
    else if(r.kind==="summary"){ title="AI Call Summary"; body=r.summary||""; }
    else { title="Tag"; body=(r.tags||[]).join(", "); }
    if(r.policyFlag) body=(body?body+"\n\n":"")+`Policy flag: ${r.policyFlag}`;
    if(r.tags&&r.tags.length&&r.kind!=="tag") body=(body?body+"\n\n":"")+`Tags: ${r.tags.join(", ")}`;
    return { ch:r.kind==="sms"?"sms":r.kind==="call"||r.kind==="summary"?"call":"note",
      who:who+(mins&&r.kind==="call"?mins:""), title, body:body||"(no summary recorded)",
      status:"logged", ts:r.at, _phone:true };
  }

  /* A small, honest indicator. The failure this guards against is a rep believing a deal is
     shared when it is sitting in a retry queue, so the badge says which it is. */
  function syncBadge(){
    const el=document.getElementById("pipeSyncState"); if(!el) return;
    const q=lsGet(SYNC_KEY,[]).length;
    if(SYNC_STATE.ok===null){ el.textContent=""; return; }
    if(SYNC_STATE.ok&&!q){ el.className="psync ok"; el.textContent="Shared"; el.title="Saved to the shared store, visible to the whole team."; }
    else { el.className="psync warn"; el.textContent=q?`Local only (${q} queued)`:"Local only";
      el.title=`Saved in this browser and queued for the shared store. Reason: ${SYNC_STATE.reason||"unknown"}`; }
  }

  const customDeals=()=>lsGet(D_KEY,[]).map((d,ci)=>({...d,qty:+d.qty||0,price:+d.price||0,ci,custom:true}));
  const liveDeals=()=>P.deals.map(d=>({...d,base:true})).concat(customDeals());
  const hsContacts=()=>((window.HUBSPOT&&window.HUBSPOT.contacts)||[]).map(c=>({...c,hubspot:true}));
  const allContacts=()=>P.contacts.map(c=>({...c,base:true})).concat(lsGet(C_KEY,[]).map((c,ci)=>({...c,ci}))).concat(hsContacts());
  /* Leads the PHONE created, from /api/lead. A call from a number nobody had on file used to
     produce an activity row and nothing else — it matched no contact, rendered on no account,
     and the caller existed nowhere a rep would look. These are read-only here: the row is a
     record of a real conversation, so a rep claims or removes one but does not rewrite it. */
  let PHONE_LEADS=[];
  const phoneLeads=()=>PHONE_LEADS.map(l=>({
    contact:l.name||"",
    company:l.company||"",
    phone:l.phoneE164,
    status:l.status||"new",
    source:l.source||"phone",
    notes:l.last_summary||"",
    lastSeen:l.last_seen,
    calls:l.call_count||0,
    texts:l.sms_count||0,
    result:l.last_result||"",
    phoneLead:true,
    id:l.phoneE164,
  }));
  const allLeads=()=>P.leads.map(l=>({...l,base:true}))
    .concat(lsGet(L_KEY,[]).map((l,ci)=>({...l,ci})))
    /* A number a rep has already turned into a contact is not still a lead. Without this the
       callback queue would keep showing people who are already in the book. */
    .concat(phoneLeads().filter(pl=>{
      const k=phoneKey(pl.phone);
      return !allContacts().some(c=>phoneKey(c.phone)===k||phoneKey(c.mobile)===k||phoneKey(c.phoneE164)===k);
    }));
  const offRowsAll=()=>P.offtake.rows.map(r=>({...r,base:true})).concat(lsGet(O_KEY,[]).map((r,ci)=>({confirmed:{},vols:{},...r,ci})));
  /* accounts = snapshot ∪ custom ∪ anything referenced by a deal/contact/offtake row */
  /* Every distinct spelling that norm() folded into one account, keyed by canonical name.
     Rebuilt on each liveAccounts() pass. norm() deliberately strips corporate suffixes, which
     is the right call for "New Pig" vs "New Pig Corporation" but is exactly the rule that
     could also fold two genuinely different companies together. Recording the aliases turns a
     silent merge into a reviewable one: renderProfile() shows them, and a wrong merge is
     visible on the account it damaged rather than being discovered months later via a deal
     attached to the wrong logo. */
  let ACCT_ALIASES = {};
  const aliasesOf = name => (ACCT_ALIASES[norm(name)]||[]).filter(a=>a!==name);

  /* ---------------- ROSTER LAYER ----------------
     window.ROSTER is generated by scripts/build-roster.mjs from the handoff CSVs: every
     prospected company with its ICP, freight verdict, score and the written research behind
     the score. It is read-only here, the same contract hubspot-data.js has. */
  const rosterList = () => (window.ROSTER && window.ROSTER.companies) || [];
  /* Built lazily on first lookup, NOT eagerly at definition time. norm() is declared further
     down this file, so an eager build here dies with "Cannot access 'norm' before
     initialization" and takes the whole IIFE (and window.PIPELIVE) with it. */
  let ROSTER_BY = null;
  const rosterIndex = () => {
    if(!ROSTER_BY){ ROSTER_BY=new Map(); for(const c of rosterList()) ROSTER_BY.set(norm(c.name), c); }
    return ROSTER_BY;
  };
  const rosterOf = name => rosterIndex().get(norm(name)) || null;

  /* ICP for a CRM record (contact or lead) that does not carry one of its own. Email
     domain is tried FIRST — key accounts are matched by DOMAIN, never company_name, per
     the enrichment canon — and the account/company name join is the fallback. Lazy for
     the same norm() reason as ROSTER_BY above. */
  let ROSTER_BY_DOM = null;
  const rosterDomIndex = () => {
    if(!ROSTER_BY_DOM){
      ROSTER_BY_DOM = new Map();
      for(const c of rosterList()){
        const d = String(c.website||"").toLowerCase().replace(/^https?:\/\//,"").replace(/^www\./,"").replace(/\/.*$/,"").trim();
        if(d && !ROSTER_BY_DOM.has(d)) ROSTER_BY_DOM.set(d, c);
      }
    }
    return ROSTER_BY_DOM;
  };
  const icpFor = rec => {
    const dom = String(rec.email||"").split("@")[1]?.toLowerCase().trim();
    const byDom = dom ? rosterDomIndex().get(dom) : null;
    if(byDom && byDom.icp) return byDom.icp;
    const byName = rosterOf(rec.account || rec.company || "");
    return (byName && byName.icp) || "";
  };
  const icpCell = icp => icp
    ? `<span class="co-icp">${esc(icp)}</span>`
    : `<span class="pdim" title="No roster match by email domain or account name — not in a campaign ICP">—</span>`;
  /* Order records grouped by ICP (blanks sink), name as the stable tie-break. */
  const byIcpThen = key => (a,b) => {
    const ia=a._icp||"", ib=b._icp||"";
    if(!ia !== !ib) return ia ? -1 : 1;
    return ia.localeCompare(ib) || String(a[key]||"").localeCompare(String(b[key]||""));
  };

  /* Canonical statuses. The roster arrives as pure prospecting output with no notion of
     where a company sits with us, and the pipeline had no status field at all: an account
     was "a customer" only in the sense that someone typed type:"customer" into a data file.
     One vocabulary now covers both, ordered coldest to warmest so sorting is meaningful. */
  const STATUS = {
    disqualified:{ label:"Disqualified", cls:"stt-dq",   rank:0, hint:"Killed during research, reason on the profile" },
    new_lead:    { label:"New Lead",     cls:"stt-new",  rank:1, hint:"On the roster, never contacted" },
    working:     { label:"Working",      cls:"stt-work", rank:2, hint:"In a sequence, no reply yet" },
    engaged:     { label:"Engaged",      cls:"stt-eng",  rank:3, hint:"Has replied or been spoken to" },
    customer:    { label:"Customer",     cls:"stt-cust", rank:4, hint:"Has a deal in flight or won" },
  };
  const ST_KEY="vej_pipe_status";           // manual overrides, keyed by norm(name)
  const statusOverrides = () => lsGet(ST_KEY,{});
  window.pipeSetStatus = (name, st) => {
    const o=statusOverrides(); const k=norm(name);
    if(!st || st===derivedStatus(name)) delete o[k]; else o[k]=st;
    lsSet(ST_KEY,o); remount();
  };

  /* Derive a status from evidence rather than storing one everywhere. A manual override in
     localStorage always wins; otherwise the strongest evidence does. Deriving means a
     company that gets a deal tomorrow is a Customer tomorrow without anyone re-tagging it. */
  /* Engaged means SOMEONE ACTUALLY TALKED TO THEM. That is the promotion rule into the
     pipeline, so the bar has to be a real conversation, not a database row.

     This first shipped as "present in HubSpot OR has a contact record" and produced 171
     engaged accounts, including Yale University, MS State and a produce trade association.
     Those are list imports: HubSpot holds 178 companies and a contact record only means
     somebody's email address is known. Neither is evidence of a conversation, and treating
     them as such would have dumped 171 companies into the pipeline on day one.

     The real signal is a logged communication timeline. hubspot-comms.js carries 55, of which
     9 say in their own text "no email/call activity, record created from import". Excluding
     those leaves 46 accounts with genuine two-way history, which is the honest number.

     Manual promotion still exists for everything this cannot see (a call logged nowhere, a
     conversation at a trade show): set the status on the profile and the override wins. */
  const NO_ACTIVITY_RE = /no email\/call activity|no activity/i;
  let ENGAGED_NAMES = null;
  const engagedNames = () => {
    if(!ENGAGED_NAMES){
      ENGAGED_NAMES = new Set();
      const C = window.HUBSPOT_COMMS || {};
      for(const k of Object.keys(C)) if(!NO_ACTIVITY_RE.test(C[k]||"")) ENGAGED_NAMES.add(norm(k));
    }
    return ENGAGED_NAMES;
  };

  function derivedStatus(name){
    const r = rosterOf(name);
    if(r && r.dead) return "disqualified";
    const ds = liveDeals().filter(d=>norm(d.customer)===norm(name));
    if(ds.length) return "customer";                    // open or won, both are a live account
    if(engagedNames().has(norm(name))) return "engaged"; // a real logged conversation
    if(acctActivities(name).length) return "engaged";    // or activity logged in this app
    return "new_lead";
  }
  const statusOf = name => statusOverrides()[norm(name)] || derivedStatus(name);
  const stBadgeFor = name => { const s=STATUS[statusOf(name)]||STATUS.new_lead;
    return `<span class="stt ${s.cls}" title="${esc(s.hint)}">${esc(s.label)}</span>`; };


  const liveAccounts=()=>{
    const map=new Map();
    const aliases={};
    const put=(k,v)=>{
      const n=norm(k);
      (aliases[n] = aliases[n] || []).includes(k) || aliases[n].push(k);
      if(!map.has(n)) map.set(n,v);
    };
    P.accounts.forEach(a=>put(a.name,{...a,base:true}));
    lsGet(A_KEY,[]).forEach(a=>put(a.name,{...a}));
    /* HubSpot company layer (read-only snapshot, hubspot-data.js). Merged AFTER the
       pipeline's own accounts so the 5 canonical matches win and don't double. */
    if(window.HUBSPOT&&window.HUBSPOT.accounts) window.HUBSPOT.accounts.forEach(a=>put(a.name,{...a,hubspot:true}));
    liveDeals().forEach(d=>{ if(d.customer) put(d.customer,{name:d.customer,type:"customer",industry:"",derived:true}); });
    allContacts().forEach(c=>{ if(c.account) put(c.account,{name:c.account,type:"prospect",industry:"",derived:true}); });
    offRowsAll().forEach(r=>{ if(r.customer) put(r.customer,{name:r.customer,type:"prospect",industry:"",derived:true}); });
    /* Roster last: it is the widest source (every prospected company) but the weakest claim
       on an account's identity, so anything already known from a deal, a contact or HubSpot
       keeps its own record. The roster research is then merged ONTO whichever record won,
       so an existing customer still shows its ICP, freight verdict and score. */
    for(const c of rosterList()){
      put(c.name,{name:c.name,type:c.dead?"disqualified":"prospect",industry:c.segment||"",roster:true});
      const rec=map.get(norm(c.name));
      if(rec && !rec.r) rec.r=c;
    }
    ACCT_ALIASES = aliases;
    return [...map.values()];
  };
  /* upsert a typed account name into the custom-account store (bug: __new orphaned it) */
  const upsertAccount=(name,type)=>{
    name=String(name||"").trim(); if(!name) return;
    if(P.accounts.some(a=>norm(a.name)===norm(name))) return;
    const arr=lsGet(A_KEY,[]);
    if(arr.some(a=>norm(a.name)===norm(name))) return;
    arr.push({name,type:type||"customer",industry:""}); lsSet(A_KEY,arr);
  };
  /* per-account typed activity store — keyed by account name; newest-first.
     Shape: {ch,who,title,body,status,ts}. Legacy note rows {body,ts} are migrated
     on read so old data keeps rendering. Stored alongside nothing else in N_KEY. */
  const migrateAct = r => (r && r.ch)
    ? r
    : { ch:"note", who:"", title:"Internal Note", body:(r&&r.body)||"", status:"logged", ts:(r&&r.ts)||new Date().toISOString() };
  /* resolve to the canonical liveAccounts name so notes under a norm-equal
     alias ("Designs" vs "Design") aren't orphaned from the profile */
  const canonAcct = name => (liveAccounts().find(a=>norm(a.name)===norm(name))||{}).name || name;
  const acctActivities = name => {
    const all=lsGet(N_KEY,{});
    const keys=Object.keys(all).filter(k=>norm(k)===norm(name));
    if(!keys.length) return [];
    const canon=canonAcct(name);
    /* consolidate every norm-matching bucket into the canonical key so the
       delete index (all[canon][i]) stays valid */
    if(keys.length>1 || keys[0]!==canon){
      const merged=[];
      keys.forEach(k=>merged.push(...(all[k]||[])));
      merged.sort((a,b)=>new Date((b&&b.ts)||0)-new Date((a&&a.ts)||0));
      keys.forEach(k=>{ if(k!==canon) delete all[k]; });
      all[canon]=merged; lsSet(N_KEY,all);
      return merged.map(migrateAct);
    }
    return (all[canon]||[]).map(migrateAct);
  };
  const addAcctActivity = (name,act) => {
    const all=lsGet(N_KEY,{});
    (all[name]=all[name]||[]).unshift({ ch:"note", status:"logged", ts:new Date().toISOString(), ...act });
    LOCAL_STAMP[name]=new Date().toISOString();
    lsSet(N_KEY,all);
  };
  /* back-compat: a plain note is just a note-channel activity */
  const addAcctNote = (name,body) => addAcctActivity(name,{ ch:"note", title:"Internal Note", body, status:"logged" });
  const delAcctActivity = (name,i) => { const all=lsGet(N_KEY,{}); if(all[name]){ all[name].splice(i,1); lsSet(N_KEY,all); } };
  /* legacy alias kept so any old caller still resolves */
  const acctNotes = name => acctActivities(name);

  const accountNames=()=>liveAccounts().map(a=>a.name).sort();
  const productNames=()=>[...new Set(P.production.products.map(r=>r.p).concat(liveDeals().map(d=>d.product)))].filter(Boolean).sort();
  const sectorNames=()=>[...new Set(liveDeals().map(d=>d.sector).filter(Boolean))].sort();

  /* ---- deal derivations ---- */
  const stageOf = k => P.stages.find(s=>s.k===k) || P.stages[0];
  const value = d => d.qty * d.price;
  const weighted = d => value(d) * stageOf(d.stage).prob / 100;
  const closeDate = d => new Date(d.close + "T00:00:00Z");
  const safeISO = d => { const t=closeDate(d); return isNaN(t)?new Date().toISOString():t.toISOString(); };
  const fmtDate = d => closeDate(d).toLocaleDateString("en-US",{month:"2-digit",day:"2-digit",year:"numeric"});
  const quarterOf = d => { const t=closeDate(d); return "Q"+(Math.floor(t.getUTCMonth()/3)+1)+" "+t.getUTCFullYear(); };
  const qSort=(a,b)=>{ const [qa,ya]=a.split(" "),[qb,yb]=b.split(" "); return ya-yb||qa[1]-qb[1]; };
  /* Account identity key. Deals, contacts, offtake rows and activity notes all reference an
     account by NAME (d.customer, c.account, r.customer), so this function decides which
     records belong to the same company. Getting it wrong is silent either way: too loose and
     two companies merge and inherit each other's pipeline, too strict and one company splits
     into two half-populated profiles.

     It used to be `.toLowerCase().replace(/s$/,"")`, which only stripped one trailing "s".
     Measured against the real data (322 roster companies about to be imported plus the 236
     already in pipeline-data.js and hubspot-data.js) that heuristic matched NOTHING the plain
     lowercase did not, while missing three genuine same-company pairs:

         "Organics By Gosh"  vs  'Organics "By Gosh"'     (punctuation)
         "J Berry Nursery"   vs  "J. Berry Nursery"       (punctuation)
         "New Pig"           vs  "New Pig Corporation"    (corporate suffix)

     Each of those would have imported as a SECOND account, splitting the existing one's
     deals, contacts and logged comms away from the new roster row. Organics By Gosh already
     carries HubSpot email history, so that split would have hidden real correspondence.

     So: strip diacritics, punctuation, corporate suffixes and "and"/"&" spelling, collapse
     whitespace, then tolerate a trailing plural. Verified to produce ZERO collisions between
     genuinely different companies across all 558 names. Suffix stripping is the aggressive
     part, which is why aliasesOf() below surfaces every merge for review rather than trusting
     it blindly. */
  const SUFFIX_RE = /\b(llc|l\s*l\s*c|inc|incorporated|corp|corporation|company|co|ltd|limited|lp|llp|plc|holdings|group|enterprises)\b/g;
  const norm = s => {
    let t = String(s||"").normalize("NFKD").replace(/[\u0300-\u036f]/g,"").toLowerCase();
    t = t.replace(/[\u2018\u2019\u02bc`]/g,"'");   // curly and modifier apostrophes to ASCII
    t = t.replace(/'s\b/g,"");                     // possessive: "harrell's" and "harrells" agree
    t = t.replace(/[^\w\s]/g," ");                 // punctuation to space: "j.berry" == "j berry"
    t = t.replace(/\band\b/g," ");                 // "&" is already a space by now, so DROP the
                                                   // word too and "Smith & Sons" == "Smith and Sons"
    t = t.replace(SUFFIX_RE," ");
    t = t.replace(/\s+/g," ").trim();
    t = t.replace(/s$/,"").trim();                 // trailing plural, then re-trim: a stranded
                                                   // token could otherwise leave "harrell "
    // Never return "": a name that is ALL suffix ("LLC") or all whitespace would otherwise
    // collide with every other such name and pull their records together.
    return t || String(s||"").toLowerCase() || "__unnamed_account__";
  };
  const qtyStr = ds => {
    const mt = ds.filter(d=>d.uom==="MT").reduce((a,d)=>a+d.qty,0);
    const un = ds.filter(d=>d.uom!=="MT").reduce((a,d)=>a+d.qty,0);
    return [mt?num(mt)+" MT":null, un?num(un)+" UNIT":null].filter(Boolean).join(" + ") || "0";
  };
  const sum = (arr,f) => arr.reduce((a,x)=>a+f(x),0);

  const stBadge = (d,pct=true) => { const s=stageOf(d.stage); return `<span class="pbadge ${s.cls}">${esc(s.label)}${pct?` (${s.prob}%)`:""}</span>`; };
  const cfBadge = d => { const c=P.confidence[d.conf]||P.confidence.low; return `<span class="pbadge ${c.cls}">${esc(c.label)}</span>`; };

  const CAT = ["#24478a","#5f8a5b","#caa85a","#9a7fc8","#c85a54","#5a86c8","#d7153f","#3a4655"];
  const colorFor = (list,name) => CAT[list.indexOf(name) % CAT.length];

  /* clickable customer/account name → opens the client-profile epicenter */
  const acctLink = name => name
    ? `<span class="acct-link" onclick="pipeOpenAccount('${esc(String(name)).replace(/'/g,"\\'")}')" title="Open ${esc(name)} profile">${esc(name)}</span>`
    : "—";
  const fmtTs = iso => { const d=new Date(iso); if(isNaN(d)) return ""; return d.toLocaleDateString("en-US",{month:"short",day:"numeric",year:"numeric"})+" · "+d.toLocaleTimeString("en-US",{hour:"numeric",minute:"2-digit"}); };
  const initials = n => String(n||"?").split(/\s+/).map(w=>w[0]).join("").slice(0,2).toUpperCase();

  /* ---- CSV export (shared) ---- */
  function downloadCSV(filename, header, rows){
    const q=x=>`"${String(x??"").replace(/"/g,'""')}"`;
    const csv=[header].concat(rows).map(r=>r.map(q).join(",")).join("\n");
    const a=document.createElement("a");
    a.href=URL.createObjectURL(new Blob([csv],{type:"text/csv"}));
    a.download=filename; a.click(); URL.revokeObjectURL(a.href);
  }

  /* ---- tabs ---- */
  /* Prospects leads, because it is the only tab that shows the whole business. Pipeline shows
     the companies someone has actually spoken to; Prospects shows every company researched,
     with the ICP and score that decide which get worked next. "Contacts" is now "People" so the two are
     not confused: a company is the unit of work, a person is how you reach it. */
  /* The "Prospects" tab (tCompanies, the flat account list) was removed 2026-08-31. It was a
     directory of 322 rows nobody browsed: every route a rep actually takes to an account goes
     THROUGH something else — a deal, a contact, a call in the Inbox — and each of those already
     opens the account profile directly. Account records themselves are untouched; the profile
     is where the timeline, the phone activity and the Instantly mail render, and it is reached
     from every one of those places. tCompanies stays in git history. */
  /* The Leads tab was removed 2026-08-31, after Prospects. Leads now arrive in the Inbox the
     moment the phone creates one, and claiming one there turns it into a contact in a single
     step. A separate tab listing the same rows a second time meant two places to work the same
     queue and no rule for which was authoritative. tLeads stays in git history. */
  const TABS = [
    ["pipeline","Pipeline"],["deals","Deals"],["people","People"],
    ["offtake","Offtake Pipeline"],["production","Production Plan"],
    ["exec","Executive Dashboard"],["reports","Reports"],
  ];
  const TAB_KEY = "vej_pipe_tab";
  /* Falls back to pipeline, and also catches the retired "prospects"/"contacts"/"companies"
     ids still sitting in the localStorage of anyone who used an earlier build — without this,
     everyone who last used the Prospects tab would open to a blank pane. */
  const activeTab = () => { const t=lsGet(TAB_KEY,null); return TABS.some(x=>x[0]===t)?t:"pipeline"; };
  window.pipeTab = id => {
    lsSet(TAB_KEY,id);
    document.querySelectorAll(".pipe-pane").forEach(p=>p.classList.toggle("active",p.dataset.tab===id));
    document.querySelectorAll(".pipe-tabs .pill").forEach(b=>b.classList.toggle("active",b.dataset.tab===id));
  };

  const kpi = (l,v,d,cls) => `<div class="pkpi"><div class="pk-l">${esc(l)}</div><div class="pk-v${cls?" "+cls:""}">${v}</div>${d?`<div class="pk-d">${esc(d)}</div>`:""}</div>`;
  const tblWrap = inner => `<div class="tbl-wrap"><table>${inner}</table></div>`;

  /* ---- shared modal shell ---- */
  window.pipeModalClose=()=>document.getElementById("pipeModal")?.remove();
  function openModal(title,body,saveLabel,onSaveExpr,wide){
    pipeModalClose();
    const wrap=document.createElement("div");
    wrap.className="pmodal-wrap"; wrap.id="pipeModal";
    wrap.innerHTML=`<div class="pmodal${wide?" wide":""}">
      <div class="pmodal-h"><h3>${esc(title)}</h3><span class="pmodal-x" onclick="pipeModalClose()">✕</span></div>
      ${body}
      <div class="pmodal-f"><button class="btn btn-ghost" onclick="pipeModalClose()">Cancel</button>
        <button class="btn btn-primary" onclick="${onSaveExpr}">${esc(saveLabel)}</button></div></div>`;
    document.body.appendChild(wrap);
    wrap.addEventListener("click",e=>{ if(e.target===wrap) pipeModalClose(); });
    return wrap;
  }
  const F=(id,label,val,req,ph,type)=>`<div class="pcf"><label>${label}${req?" *":""}</label><input class="pinput" id="${id}" type="${type||"text"}" value="${esc(val==null?"":val)}" placeholder="${ph||""}"></div>`;
  const SEL=(id,label,opts,val)=>`<div class="pcf"><label>${label}</label><select class="pinput" id="${id}">${opts.map(o=>{const[v,t]=Array.isArray(o)?o:[o,o];return `<option value="${esc(v)}"${String(val)===String(v)?" selected":""}>${esc(t)}</option>`;}).join("")}</select></div>`;
  const V=id=>document.getElementById(id)?.value.trim()||"";
  const todayISO=()=>{ const d=new Date(); return d.getFullYear()+"-"+String(d.getMonth()+1).padStart(2,"0")+"-"+String(d.getDate()).padStart(2,"0"); };

  /* ======================= DEAL CRUD (feeds every tab) ======================= */
  window.pipeDealModal=(ci,prefill)=>{
    const cur=(ci!=null&&ci>=0)?customDeals()[ci]:(prefill||{});
    const accts=accountNames();
    const body=`
      ${F("pdName","Deal Name",cur.deal,1,"e.g. Rose Acres: August Sale")}
      <div class="pcf"><label>Customer / Account *</label><select class="pinput" id="pdCustomer">
        <option value="">Select account…</option>${accts.map(a=>`<option${cur.customer===a?" selected":""}>${esc(a)}</option>`).join("")}
        <option value="__new"${cur.customer&&!accts.includes(cur.customer)?" selected":""}>+ New account…</option></select></div>
      <div class="pcf" id="pdNewAcctWrap" style="display:${cur.customer&&!accts.includes(cur.customer)?"block":"none"}"><label>New account name</label><input class="pinput" id="pdNewAcct" value="${esc(cur.customer&&!accts.includes(cur.customer)?cur.customer:"")}"></div>
      <div class="pcf-grid">
        ${SEL("pdProduct","Product",productNames(),cur.product||"Biochar")}
        <div class="pcf"><label>Sector</label><input class="pinput" id="pdSector" list="pdSectorList" value="${esc(cur.sector||"")}"><datalist id="pdSectorList">${sectorNames().map(s=>`<option value="${esc(s)}">`).join("")}</datalist></div>
      </div>
      <div class="pcf-grid pcf-g3">
        ${F("pdQty","Quantity",cur.qty,1,"","number")}
        ${SEL("pdUom","Unit",["MT","UNIT"],cur.uom||"MT")}
        ${F("pdPrice","Price / Unit ($)",cur.price,1,"","number")}
      </div>
      <div class="pcf-grid">
        ${SEL("pdOrder","Order Type",["Recurring","One-Time"],cur.order||"Recurring")}
        ${F("pdClose","Close Date",cur.close||todayISO(),0,"","date")}
      </div>
      <div class="pcf-grid pcf-g3">
        ${SEL("pdStage","Stage",P.stages.map(s=>[s.k,s.label]),cur.stage||"prospect")}
        ${SEL("pdConf","Confidence",[["secured","Secured (100%)"],["medium","Medium (65%)"],["low","Low (30%)"]],cur.conf||"low")}
        ${SEL("pdStatus","Status",["open","won","lost"],cur.status||"open")}
      </div>
      ${SEL("pdOwner","Assigned To",P.team.map(t=>t.name),cur.owner||P.team[0].name)}
      <div class="pcf"><label>Notes</label><textarea class="pinput" id="pdNotes" rows="2">${esc(cur.notes||"")}</textarea></div>
      <div class="pcf-hint" id="pdValueHint"></div>`;
    openModal((ci!=null&&ci>=0?"Edit":"Add")+" Deal",body,ci!=null&&ci>=0?"Save Changes":"Add Deal",`pipeDealSave(${ci!=null&&ci>=0?ci:-1},${prefill&&prefill.__leadCi!=null?prefill.__leadCi:-1})`,true);
    const sel=document.getElementById("pdCustomer");
    sel.addEventListener("change",e=>{ document.getElementById("pdNewAcctWrap").style.display=e.target.value==="__new"?"block":"none"; });
    const upd=()=>{ const v=(+V("pdQty")||0)*(+V("pdPrice")||0); const el=document.getElementById("pdValueHint"); if(el)el.innerHTML=`Deal value: <b>${money(v)}</b>`; };
    ["pdQty","pdPrice"].forEach(id=>document.getElementById(id).addEventListener("input",upd)); upd();
    document.getElementById("pdName").focus();
  };
  window.pipeDealSave=(ci,leadCi)=>{
    let customer=V("pdCustomer"); const isNewAcct=customer==="__new"; if(isNewAcct) customer=V("pdNewAcct");
    const deal=V("pdName")||`${customer}: Deal`, qty=+V("pdQty"), price=+V("pdPrice");
    if(!customer||!(qty>0)||!(price>0)){ alert("Account, a positive quantity, and a price are required."); return; }
    if(isNewAcct) upsertAccount(customer,"customer");
    const rec={ deal, customer, product:V("pdProduct"), sector:V("pdSector"), qty, uom:V("pdUom"), price,
      order:V("pdOrder"), close:V("pdClose")||todayISO(), stage:V("pdStage"), conf:V("pdConf"),
      status:V("pdStatus"), owner:V("pdOwner"), notes:V("pdNotes") };
    const arr=lsGet(D_KEY,[]);
    /* The id is preserved on edit and minted on create, so an edit updates the shared row
       rather than creating a second one. updated_at is what the server's last-write-wins
       guard compares, so it has to be stamped here, at the moment the human hit Save. */
    const prev=ci>=0?arr[ci]:null;
    rec.id=(prev&&prev.id)||uid("deal");
    rec.created_at=(prev&&prev.created_at)||nowISO();
    rec.updated_at=nowISO();
    if(ci>=0) arr[ci]=rec; else arr.push(rec);
    lsSet(D_KEY,arr);
    /* Local is committed. The push is fire-and-forget on purpose: the modal closes and the
       page re-renders at local speed, and a failed push queues rather than blocking a rep. */
    pushRecord("deals",rec);
    /* if this deal came from converting a custom lead, flip that lead to converted */
    if(leadCi!=null&&leadCi>=0){ const ls=lsGet(L_KEY,[]); if(ls[leadCi]){ ls[leadCi].status="converted"; ls[leadCi].converted=true; ls[leadCi].convertedTo=deal; ls[leadCi].convertedDate=todayISO(); lsSet(L_KEY,ls); } }
    pipeModalClose(); rr();
  };
  window.pipeDealDelete=ci=>{
    const arr=lsGet(D_KEY,[]); const d=arr[ci];
    if(!d) return; if(!confirm(`Delete deal "${d.deal}"?`)) return;
    arr.splice(ci,1); lsSet(D_KEY,arr); removeRecord("deals",d.id); rr();
  };
  window.pipeDealExport=()=>downloadCSV("sales-pipeline.csv",
    ["Deal Name","Customer","Product","Sector","Qty","UOM","Price/Unit","Order Type","Close Date","Stage","Confidence","Status","Deal Value","Weighted Value","Quarter","Assigned To","Notes"],
    liveDeals().map(d=>[d.deal,d.customer,d.product,d.sector,d.qty,d.uom,d.price,d.order,fmtDate(d),stageOf(d.stage).label,(P.confidence[d.conf]||{}).label||d.conf,d.status,value(d),Math.round(weighted(d)),quarterOf(d),d.owner,d.notes]));

  /* ================= TAB 1 · PIPELINE (deal tracker) ================= */
  const VIEW_KEY="vej_pipe_view";
  const dealAttrs = d => `data-product="${esc(d.product)}" data-quarter="${quarterOf(d)}" data-stage="${d.stage}" data-sector="${esc(d.sector)}" data-conf="${d.conf}"`;
  const trackerRow = d => `<tr ${dealAttrs(d)}>
    <td><strong>${acctLink(d.customer)}</strong></td><td>${esc(d.product)}</td><td>${esc(d.sector)}</td>
    <td class="t-num">${num(d.qty)} <span class="uom">${esc(d.uom)}</span></td>
    <td class="t-num">${(+d.price).toFixed(2)}</td><td>${esc(d.order)}</td>
    <td class="t-num">${fmtDate(d)}</td><td>${stBadge(d)}</td><td>${cfBadge(d)}</td>
    <td class="t-num">${money(value(d))}</td><td class="t-num pwt">${money(weighted(d))}</td>
    <td class="t-num">${quarterOf(d)}</td><td class="pnote" title="${esc(d.notes||"")}">${esc(d.notes||"—")}</td>
    <td class="pact-cell">${d.custom?`<span class="pc-act" onclick="pipeDealModal(${d.ci})" title="Edit">✎</span><span class="pc-act pc-del" onclick="pipeDealDelete(${d.ci})" title="Delete">🗑</span>`:""}</td></tr>`;
  /* Companies that have crossed from prospecting into the pipeline but have no deal yet.
     The rule: a prospect enters the pipeline the moment someone actually talks to them, which
     is exactly what Engaged means. Before that they are research and belong on Prospects.

     They are surfaced as a queue rather than as fake zero-value deals, because inventing a
     deal record to represent "we had a conversation" is how a pipeline total stops meaning
     anything. Each row is one click from becoming a real deal. */
  function promotedNoDeal(){
    const withDeals = new Set(liveDeals().map(d=>norm(d.customer)));
    return liveAccounts()
      .filter(a=>{ const s=statusOf(a.name); return (s==="engaged"||s==="working") && !withDeals.has(norm(a.name)); })
      .sort((a,b)=>((b.r&&b.r.score)??-1)-((a.r&&a.r.score)??-1));
  }

  function promotedBanner(){
    const list = promotedNoDeal();
    if(!list.length) return "";
    return `<div class="promo-box">
      <div class="promo-head">
        <b>${num(list.length)} engaged, no deal yet</b>
        <span>Someone has spoken to these, so they have left Prospects. Open one to log a deal.</span>
      </div>
      <div class="promo-list">${list.slice(0,12).map(a=>{
        const r=a.r||rosterOf(a.name);
        return `<button class="promo-chip" onclick="pipeOpenAccount('${esc(String(a.name).replace(/'/g,"\\'"))}')">
          ${esc(a.name)}${r&&r.score!=null?`<span class="sc ${scoreCls(r.score)}">${r.score}</span>`:""}
        </button>`;}).join("")}
        ${list.length>12?`<span class="pdim">+${num(list.length-12)} more</span>`:""}
      </div>
    </div>`;
  }

  function tPipeline(){
    const ds = liveDeals();
    const total = sum(ds,value), wtd = sum(ds,weighted);
    const confirmed = sum(ds.filter(d=>d.status==="won"),value);
    const mtTotal = sum(ds.filter(d=>d.uom==="MT"),d=>d.qty);
    const corcsTotal = sum(ds.filter(d=>d.product==="CORCS"),d=>d.qty);
    const products = [...new Set(ds.map(d=>d.product))]
      .sort((a,b)=>sum(ds.filter(d=>d.product===b),value)-sum(ds.filter(d=>d.product===a),value));
    const totalsRow = `<tr class="ptotal"><td colspan="3"><strong>TOTALS (${ds.length})</strong></td><td class="t-num" colspan="6">${qtyStr(ds)}</td>
      <td class="t-num"><strong>${money(total)}</strong></td><td class="t-num pwt"><strong>${money(wtd)}</strong></td><td colspan="3"></td></tr>`;
    const grouped = products.map(p=>{
      const g = ds.filter(d=>d.product===p);
      return `<tr class="pgroup" data-group="${esc(p)}"><td colspan="9"><strong>${esc(p)}</strong> <span class="pcount">${g.length}</span></td>
        <td class="t-num">${money(sum(g,value))}</td><td class="t-num pwt">${money(sum(g,weighted))}</td><td></td><td class="t-num">${qtyStr(g)}</td><td></td></tr>`+
        g.map(trackerRow).join("");
    }).join("")+totalsRow;
    const flat = [...ds].sort((a,b)=>closeDate(b)-closeDate(a)).map(trackerRow).join("")+totalsRow;
    const view = lsGet(VIEW_KEY,"grouped");
    const sel=(id,label,vals)=>`<select class="pinput" id="${id}" onchange="pipePipeFilter()"><option value="">${label}</option>${vals.map(v=>`<option>${esc(v)}</option>`).join("")}</select>`;
    const quarters=[...new Set(ds.map(quarterOf))].sort(qSort);
    const head=`<thead><tr><th>Customer</th><th>Product</th><th>Sector</th><th>Qty</th><th>Price/Unit</th><th>Order Type</th><th>Close Date</th><th>Stage</th><th>Confidence</th><th>Deal Value</th><th>Weighted Value</th><th>Quarter</th><th>Notes</th><th></th></tr></thead>`;
    return `
      ${promotedBanner()}
      <div class="grid g6">
        ${kpi("Total Pipeline",money(total))}
        ${kpi("Weighted Pipeline",money(wtd),null,"pk-blue")}
        ${kpi("Total MT (Pipeline)",num(mtTotal)+' <span class="pk-u">MT</span>')}
        ${kpi("Total CORCS (Pipeline)",num(corcsTotal)+' <span class="pk-u">UNIT</span>')}
        ${kpi("Active Deals",ds.length)}
        ${kpi("Confirmed Revenue",money(confirmed),null,"pk-green")}
      </div>
      <div class="pdeals-bar">
        <input class="pinput" id="pipePSearch" placeholder="Search…" oninput="pipePipeFilter()">
        ${sel("pipePProduct","All Products",products)}
        ${sel("pipePQuarter","All Quarters",quarters)}
        ${sel("pipePStage","All Stages",P.stages.map(s=>s.label))}
        ${sel("pipePSector","All Sectors",[...new Set(ds.map(d=>d.sector))])}
        ${sel("pipePConf","All Confidence",["Secured","Medium","Low"])}
        <span class="pview">
          <button class="pv-btn${view==="grouped"?" active":""}" data-v="grouped" onclick="pipeView('grouped')">Grouped by Product</button>
          <button class="pv-btn${view==="flat"?" active":""}" data-v="flat" onclick="pipeView('flat')">Flat List</button>
        </span>
        <span class="pcount-lbl" id="pipePCount">${ds.length} rows</span>
        <button class="btn btn-ghost" onclick="pipeDealExport()">⭳ Export CSV</button>
        <button class="btn btn-primary" onclick="pipeDealModal()">＋ Add Deal</button>
      </div>
      ${tblWrap(`${head}
        <tbody id="pipePGrouped" style="display:${view==="grouped"?"":"none"}">${grouped}</tbody>
        <tbody id="pipePFlat" style="display:${view==="flat"?"":"none"}">${flat}</tbody>`)}`;
  }
  window.pipeView=v=>{
    lsSet(VIEW_KEY,v);
    const g=document.getElementById("pipePGrouped"), f=document.getElementById("pipePFlat");
    if(g)g.style.display=v==="grouped"?"":"none";
    if(f)f.style.display=v==="flat"?"":"none";
    document.querySelectorAll(".pview .pv-btn").forEach(b=>b.classList.toggle("active",b.dataset.v===v));
    pipePipeFilter();
  };
  window.pipePipeFilter=()=>{
    const q=(V("pipePSearch")).toLowerCase();
    const fp=V("pipePProduct"), fq=V("pipePQuarter"), fst=V("pipePStage"), fse=V("pipePSector"), fc=V("pipePConf").toLowerCase();
    const stKey=fst?(P.stages.find(s=>s.label===fst)||{}).k:"";
    let visible=0;
    document.querySelectorAll("#pipePGrouped, #pipePFlat").forEach(tb=>{
      const shown=tb.style.display!=="none";
      [...tb.querySelectorAll("tr")].forEach(r=>{
        if(r.classList.contains("pgroup")||r.classList.contains("ptotal")) return;
        const ok=(!q||r.textContent.toLowerCase().includes(q))&&(!fp||r.dataset.product===fp)&&(!fq||r.dataset.quarter===fq)
          &&(!stKey||r.dataset.stage===stKey)&&(!fse||r.dataset.sector===fse)&&(!fc||r.dataset.conf===fc);
        r.style.display=ok?"":"none";
        if(ok&&shown)visible++;
      });
      [...tb.querySelectorAll("tr.pgroup")].forEach(gr=>{
        let any=false, n=gr.nextElementSibling;
        while(n&&!n.classList.contains("pgroup")&&!n.classList.contains("ptotal")){ if(n.style.display!=="none")any=true; n=n.nextElementSibling; }
        gr.style.display=any?"":"none";
      });
    });
    const c=document.getElementById("pipePCount"); if(c)c.textContent=visible+" rows";
  };

  /* ================= TAB 2 · PRODUCTION PLAN ================= */
  const prodQuarters=()=>[...new Set(P.production.quarters.concat(lsGet(QX_KEY,[])))].sort(qSort);
  const offtakeQuarters=()=>[...new Set(P.offtake.quarters.concat(lsGet(QX_KEY,[])))].sort(qSort);
  function tProduction(){
    const quarters=prodQuarters(), products=P.production.products;
    const totals = quarters.map(q=>sum(products,r=>r.mt[q]||0));
    return `
      <div class="pdeals-bar"><h3 class="sub" style="margin:0">Production Plan — planned production capacity (MT) per product</h3>
        <button class="btn btn-ghost" onclick="pipeProductionExport()">⭳ Export CSV</button>
        <button class="btn btn-primary pc-add" onclick="pipeAddQuarter()">＋ Add Quarter</button></div>
      ${tblWrap(`<thead><tr><th>Product Type</th>${quarters.map(q=>`<th class="t-num">${q}</th>`).join("")}</tr></thead>
        <tbody>${products.map(r=>`<tr><td><strong>${esc(r.p)}</strong></td>${quarters.map(q=>{
          const v=r.mt[q]; return `<td class="t-num">${v==null?'<span class="pdim">—</span>':num(v)+' <span class="uom">MT</span>'}</td>`;
        }).join("")}</tr>`).join("")}
        <tr class="ptotal"><td><strong>TOTAL CAPACITY</strong></td>${totals.map(t=>`<td class="t-num"><strong>${num(t)} MT</strong></td>`).join("")}</tr></tbody>`)}
      <div class="note">This grid feeds the Executive Dashboard's Sales vs. Production chart and the Offtake coverage view. Update it as ops confirms quarterly capacity.</div>`;
  }
  window.pipeProductionExport=()=>{ const qs=prodQuarters(); downloadCSV("production-plan.csv",["Product Type",...qs],
    P.production.products.map(r=>[r.p,...qs.map(q=>r.mt[q]??"")])); };
  window.pipeAddQuarter=()=>openModal("Add Quarter",F("pqLabel","Quarter label",null,1,"e.g. Q3 2027"),"Add Quarter","pipeAddQuarterSave()");
  window.pipeAddQuarterSave=()=>{
    const q=V("pqLabel").toUpperCase().replace(/\s+/g," ");
    if(!/^Q[1-4] 20\d{2}$/.test(q)){ alert("Use the format Q3 2027."); return; }
    const arr=lsGet(QX_KEY,[]); if(!arr.includes(q)&&!P.production.quarters.includes(q)) arr.push(q);
    lsSet(QX_KEY,arr); pipeModalClose(); rr();
  };

  /* ================= TAB 3 · EXECUTIVE DASHBOARD ================= */
  const EXECF_KEY="vej_pipe_exec_product";
  function tExec(){
    const filter=lsGet(EXECF_KEY,"");
    const allDs=liveDeals();
    const ds=filter?allDs.filter(d=>d.product===filter):allDs;
    const total=sum(ds,value), wtd=sum(ds,weighted), qty=sum(ds.filter(d=>d.uom==="MT"),d=>d.qty);
    const confirmed=sum(ds.filter(d=>d.status==="won"),value);
    const sc=P.sampleConversions;
    const qs=prodQuarters();
    const confMT=qs.map(q=>sum(ds.filter(d=>d.uom==="MT"&&d.status==="won"&&quarterOf(d)===q),d=>d.qty));
    const wtdMT=qs.map(q=>sum(ds.filter(d=>d.uom==="MT"&&quarterOf(d)===q),d=>d.qty*stageOf(d.stage).prob/100));
    const offRows=filter?offRowsAll().filter(r=>r.product===filter):offRowsAll();
    const prodRows=filter?P.production.products.filter(r=>r.p===filter):P.production.products;
    const offMT=qs.map(q=>sum(offRows,r=>+(r.vols[q]||0)));
    const capMT=qs.map(q=>sum(prodRows,r=>r.mt[q]||0));
    const maxMT=Math.max(...confMT,...wtdMT,...offMT,...capMT,1);
    const series=[["Confirmed MT","#5f8a5b",confMT],["Weighted Pipeline MT","#24478a",wtdMT],["Offtake Expected MT","#caa85a",offMT],["Production Capacity","#c4cfe6",capMT]];
    const svp=`<div class="pchart">${qs.map((q,i)=>`<div class="pcol">
        <div class="pbars">${series.map(([n,c,arr])=>`<span class="pbar" style="height:${Math.max(arr[i]/maxMT*100,arr[i]?1.5:0)}%;background:${c}" title="${esc(n)}: ${num(arr[i])} MT"></span>`).join("")}</div>
        <div class="plabel">${q}</div></div>`).join("")}</div>
      <div class="plegend">${series.map(([n,c])=>`<span><i style="background:${c}"></i>${esc(n)}</span>`).join("")}</div>`;
    const maxCnt=Math.max(...P.stages.map(s=>ds.filter(d=>d.stage===s.k).length),1);
    const flow=P.stages.map((s,i)=>{ const c=ds.filter(d=>d.stage===s.k).length;
      return `<div class="phrow"><span class="phl">${esc(s.label)}</span><div class="phtrack"><span class="phfill" style="width:${c/maxCnt*100}%;background:${CAT[i%CAT.length]}">${c||""}</span></div></div>`; }).join("");
    const dq=[...new Set(ds.map(quarterOf))].sort(qSort);
    const prods=[...new Set(ds.map(d=>d.product))];
    const maxQ=Math.max(...dq.map(q=>sum(ds.filter(d=>quarterOf(d)===q),value)),1);
    const rqp=`<div class="pstack-wrap">${dq.map(q=>{ const g=ds.filter(d=>quarterOf(d)===q); const t=sum(g,value);
        return `<div class="phrow"><span class="phl">${q}</span><div class="phtrack pstack" style="width:${t/maxQ*82}%">${prods.map(p=>{
          const v=sum(g.filter(d=>d.product===p),value); return v?`<span style="flex:${v};background:${colorFor(prods,p)}" title="${esc(p)}: ${money(v)}"></span>`:"";
        }).join("")}</div><span class="phv">${money(t)}</span></div>`; }).join("")}</div>
      <div class="plegend">${prods.map(p=>`<span><i style="background:${colorFor(prods,p)}"></i>${esc(p)}</span>`).join("")}</div>`;
    const sectors=[...new Set(ds.map(d=>d.sector))];
    const secVals=sectors.map(s=>sum(ds.filter(d=>d.sector===s),value));
    let acc=0; const slices=sectors.map((s,i)=>{ const p=secVals[i]/(total||1)*100; const seg=`${colorFor(sectors,s)} ${acc}% ${acc+p}%`; acc+=p; return seg; });
    const pie=`<div class="ppie-row"><div class="ppie" style="background:conic-gradient(${slices.join(",")||"var(--paper-2) 0 100%"})"></div>
      <div class="plegend pcol-legend">${sectors.map((s,i)=>`<span><i style="background:${colorFor(sectors,s)}"></i>${esc(s)} · ${Math.round(secVals[i]/(total||1)*100)}%</span>`).join("")}</div></div>`;
    const custs=[...new Set(ds.map(d=>d.customer))].map(c=>({c,v:sum(ds.filter(d=>d.customer===c),value),n:ds.filter(d=>d.customer===c).length})).sort((a,b)=>b.v-a.v);
    const maxC=custs[0]?.v||1;
    const top=custs.slice(0,10).map((x,i)=>`<div class="phrow"><span class="phl">${i+1}. ${esc(x.c)}</span>
      <div class="phtrack"><span class="phfill" style="width:${x.v/maxC*100}%;background:var(--navy-500)"></span></div><span class="phv">${kfmt(x.v)}</span></div>`).join("");
    const rec=ds.filter(d=>d.order==="Recurring"), one=ds.filter(d=>d.order!=="Recurring");
    const rv=sum(rec,value), ov=sum(one,value);
    const rvo=`<div class="psplit"><span style="flex:${rv||0.001};background:#24478a" title="Recurring ${money(rv)}"></span><span style="flex:${ov||0.001};background:#5f8a5b" title="One-Time ${money(ov)}"></span></div>
      <div class="plegend"><span><i style="background:#24478a"></i>Recurring · ${kfmt(rv)} (${rec.length} deals)</span><span><i style="background:#5f8a5b"></i>One-Time · ${kfmt(ov)} (${one.length} deals)</span></div>`;
    const products=[...new Set(allDs.map(d=>d.product))].sort();
    return `
      <div class="pdeals-bar">
        <select class="pinput" onchange="pipeExecFilter(this.value)">
          <option value="">All Products</option>
          ${products.map(p=>`<option${filter===p?" selected":""}>${esc(p)}</option>`).join("")}
        </select>
        <span class="pcount-lbl">${filter?"Scoped to "+esc(filter):"All products"} · ${ds.length} deals</span>
      </div>
      <div class="grid g4 pkpi-grid">
        ${kpi("Total Pipeline",kfmt(total))}
        ${kpi("Weighted Pipeline",kfmt(wtd),null,"pk-purple")}
        ${kpi("Total MT in Pipeline",num(qty))}
        ${kpi("Active Deals",ds.length)}
        ${kpi("Confirmed Revenue",kfmt(confirmed),null,"pk-green")}
        ${kpi("Projected Annual",kfmt(wtd),"Weighted, current year","pk-purple")}
        ${kpi("Sample Conversions",`${sc.converted}/${sc.sampled}`, Math.round(sc.converted/sc.sampled*100)+"% rate · $0")}
      </div>
      <div class="grid g2" style="margin-top:15px">
        <div class="card"><h4>Sales vs. Production by Quarter (MT)</h4>${svp}</div>
        <div class="card"><h4>Deal Flow by Stage</h4>${flow}</div>
        <div class="card"><h4>Revenue by Quarter &amp; Product</h4>${rqp}</div>
        <div class="card"><h4>Revenue by Sector</h4>${pie}</div>
        <div class="card"><h4>Top Customers by Value</h4>${top}</div>
        <div class="card"><h4>Recurring vs. One-Time Orders</h4>${rvo}
          <div class="hr" style="margin:14px 0"></div>
          <h4>Recent Sample Conversions</h4>
          <p style="font-size:12.5px" class="pdim">${sc.converted? "" : "No sample-to-sale conversions yet. Link samples to a won deal to track them here."}</p></div>
      </div>`;
  }
  window.pipeExecFilter=v=>{ lsSet(EXECF_KEY,v); const pane=document.querySelector('.pipe-pane[data-tab="exec"]'); if(pane) pane.innerHTML=tExec(); };

  /* ================= TAB 4 · OFFTAKE PIPELINE =================
     "Confirmed" = the snapshot baseline PLUS any won deal the team adds that matches this
     row's customer + product + quarter. Win a deal → the offtake confirmed figure moves. */
  const OGRP_KEY="vej_pipe_offtake_group";
  function confirmedFor(row,q){
    const base=+(row.confirmed?.[q]||0);
    const extra=sum(liveDeals().filter(d=>d.custom&&d.status==="won"&&d.uom==="MT"&&norm(d.customer)===norm(row.customer)&&norm(d.product)===norm(row.product)&&quarterOf(d)===q),d=>d.qty);
    return base+extra;
  }
  function tOfftake(){
    const quarters=offtakeQuarters();
    const rows=offRowsAll();
    const annual = r => sum(quarters,q=>+(r.vols[q]||0))*r.price;
    const totQ = quarters.map(q=>sum(rows,r=>+(r.vols[q]||0)));
    const revQ = quarters.map(q=>sum(rows,r=>+(r.vols[q]||0)*r.price));
    const cfQ  = quarters.map(q=>sum(rows,r=>confirmedFor(r,q)));
    const confB = c => `<span class="pbadge ${c==="Low"?"cf-low":c==="High"?"cf-secured":"cf-medium"}">${esc(c)}</span>`;
    const grouped=lsGet(OGRP_KEY,false);
    const oRow=r=>`<tr><td><strong>${acctLink(r.customer)}</strong></td><td>${esc(r.product)}</td><td class="pnote" title="${esc(r.sector)}">${esc(r.sector)}</td><td>${confB(r.conf)}</td>
      ${quarters.map(q=>{ const v=r.vols[q]; const c=confirmedFor(r,q);
        return `<td class="t-num">${v==null?'<span class="pdim">—</span>':num(v)}${c?`<div class="pconf-sub">✓ ${num(c)} confirmed</div>`:""}</td>`; }).join("")}
      <td class="t-num">$${r.price}</td><td><span class="pbadge pfreq">${esc(r.freq)}</span></td>
      <td class="t-num pannual">${money(annual(r))}</td>
      <td class="pact-cell">${r.base?"":`<span class="pc-act" onclick="pipeOfftakeModal(${r.ci})" title="Edit">✎</span><span class="pc-act pc-del" onclick="pipeOfftakeDelete(${r.ci})" title="Delete">🗑</span>`}</td></tr>`;
    let body;
    if(grouped){
      const prods=[...new Set(rows.map(r=>r.product))];
      body=prods.map(p=>{
        const g=rows.filter(r=>r.product===p);
        return `<tr class="pgroup"><td colspan="4"><strong>${esc(p)}</strong> <span class="pcount">${g.length}</span></td>
          ${quarters.map(q=>`<td class="t-num">${num(sum(g,r=>+(r.vols[q]||0)))}</td>`).join("")}
          <td></td><td></td><td class="t-num pannual">${money(sum(g,annual))}</td><td></td></tr>`+g.map(oRow).join("");
      }).join("");
    } else body=rows.map(oRow).join("");
    return `
      <div class="pdeals-bar">
        <button class="pv-btn${grouped?" active":""}" onclick="pipeOfftakeGroup(${!grouped})">≣ By Product</button>
        <span class="pcount-lbl">${rows.length} rows · <span style="color:var(--green-deep)">green = confirmed (won deals)</span></span>
        <button class="btn btn-ghost" onclick="pipeOfftakeExport()">⭳ Export CSV</button>
        <button class="btn btn-primary pc-add" onclick="pipeOfftakeModal()">＋ Add Row</button>
      </div>
      ${tblWrap(`<thead><tr><th>Customer</th><th>Product</th><th>Sector</th><th>Conf.</th>${quarters.map(q=>`<th class="t-num">${q}</th>`).join("")}<th class="t-num">Price/MT</th><th>Freq.</th><th class="t-num">Annual Rev.</th><th></th></tr></thead>
      <tbody>${body}
      <tr class="ptotal"><td colspan="4"><strong>Total Expected (MT)</strong></td>${totQ.map(t=>`<td class="t-num"><strong>${num(t)}</strong></td>`).join("")}<td colspan="2"></td><td class="t-num pannual"><strong>${money(sum(rows,annual))}</strong></td><td></td></tr>
      <tr class="prev"><td colspan="4">Revenue (MT × Price/MT)</td>${revQ.map(t=>`<td class="t-num">${t?money(t):"—"}</td>`).join("")}<td colspan="4"></td></tr>
      <tr class="pconf-row"><td colspan="4">✓ Confirmed Sales (Won Deals)</td>${cfQ.map(t=>`<td class="t-num">${t?num(t)+" MT":"—"}</td>`).join("")}<td colspan="4"></td></tr>
      </tbody>`)}
      <div class="note">Row notes worth keeping in view: ${offRowsAll().filter(r=>r.notes).map(r=>`<b>${esc(r.customer)} (${esc(r.product)})</b> — ${esc(r.notes).replace(/\n/g,"<br>")}`).join(" · ")}</div>`;
  }
  window.pipeOfftakeGroup=on=>{ lsSet(OGRP_KEY,!!on); rr(); };
  window.pipeOfftakeExport=()=>{ const qs=offtakeQuarters(); downloadCSV("offtake-pipeline.csv",
    ["Customer","Product","Sector","Confidence","Price/MT","Frequency",...qs,...qs.map(q=>q+" confirmed"),"Annual Rev."],
    offRowsAll().map(r=>[r.customer,r.product,r.sector,r.conf,r.price,r.freq,...qs.map(q=>r.vols[q]??""),...qs.map(q=>confirmedFor(r,q)||""),sum(qs,q=>+(r.vols[q]||0))*r.price])); };
  window.pipeOfftakeModal=ci=>{
    const cur=(ci!=null&&ci>=0)?lsGet(O_KEY,[])[ci]:{vols:{}};
    if(!cur) return;
    const quarters=offtakeQuarters();
    const body=`
      ${F("poCustomer","Customer",cur.customer,1)}
      ${SEL("poProduct","Product",productNames(),cur.product)}
      ${F("poSector","Sector",cur.sector)}
      <div class="pcf-grid">
        ${SEL("poConf","Confidence",["High","Medium","Low"],cur.conf||"Medium")}
        ${SEL("poFreq","Frequency",["Recurring","One-Time"],cur.freq||"Recurring")}
      </div>
      ${F("poPrice","Price per MT ($)",cur.price,1,"","number")}
      <div class="pcf"><label>Expected MT per quarter</label><div class="pcf-grid pcf-g3">${quarters.map((q,i)=>`<div class="pcf"><label>${q}</label><input class="pinput" id="poQ${i}" type="number" min="0" value="${cur.vols?.[q]??""}"></div>`).join("")}</div></div>
      ${F("poNotes","Notes",cur.notes)}`;
    openModal((ci!=null&&ci>=0?"Edit":"Add")+" Offtake Row",body,ci!=null&&ci>=0?"Save Changes":"Add Row",`pipeOfftakeSave(${ci!=null&&ci>=0?ci:-1})`);
  };
  window.pipeOfftakeSave=ci=>{
    const customer=V("poCustomer"), price=parseFloat(V("poPrice"));
    if(!customer||!(price>0)){ alert("Customer and a price per MT are required."); return; }
    const vols={};
    offtakeQuarters().forEach((q,i)=>{ const v=V("poQ"+i); if(v!=="") vols[q]=+v; });
    const rec={customer, product:V("poProduct"), sector:V("poSector"), conf:V("poConf"), freq:V("poFreq"), price, vols, confirmed:{}, notes:V("poNotes")};
    const arr=lsGet(O_KEY,[]);
    if(ci>=0) arr[ci]=rec; else arr.push(rec);
    lsSet(O_KEY,arr); pipeModalClose(); rr();
  };
  window.pipeOfftakeDelete=ci=>{
    const arr=lsGet(O_KEY,[]); const r=arr[ci];
    if(!r) return; if(!confirm(`Delete offtake row for "${r.customer}" (${r.product})?`)) return;
    arr.splice(ci,1); lsSet(O_KEY,arr); rr();
  };

  /* ================= TAB 5 · DEALS (flat list, full CRUD) ================= */
  function tDeals(){
    /* Honours the same period as the strip, so the tile and the table can never disagree —
       a header saying 6 open deals above a list of 40 is how people stop trusting both. */
    const ds=[...liveDeals()].filter(inPeriod).sort((a,b)=>closeDate(b)-closeDate(a));
    return `
      <div class="pdeals-bar"><input class="pinput" id="pipeDealSearch" placeholder="Search deals…" oninput="pipeDealFilter()">
        <select class="pinput" id="pipeDealStatus" onchange="pipeDealFilter()"><option value="">All Status</option><option>open</option><option>won</option><option>lost</option></select>
        <select class="pinput" id="pipeDealStage" onchange="pipeDealFilter()"><option value="">All Stages</option>${P.stages.map(s=>`<option value="${s.k}">${esc(s.label)}</option>`).join("")}</select>
        <span class="pcount-lbl" id="pipeDealCount">${ds.length} deals</span>
        <button class="btn btn-ghost" onclick="pipeDealExport()">⭳ Export CSV</button>
        <button class="btn btn-primary" onclick="pipeDealModal()">＋ Add Deal</button></div>
      ${tblWrap(`<thead><tr><th>Deal Name</th><th>Account</th><th>Product</th><th>Stage</th><th class="t-num">Value</th><th>Close Date</th><th>Status</th><th>Assigned To</th><th></th></tr></thead>
      <tbody id="pipeDealsTbl">${ds.map(d=>`<tr data-stage="${d.stage}" data-status="${d.status}" title="${esc(d.notes||"")}">
        <td><strong>${esc(d.deal)}</strong></td><td>${acctLink(d.customer)}</td><td>${esc(d.product)}</td><td>${stBadge(d,false)}</td>
        <td class="t-num">${money(value(d))}</td><td class="t-num">${fmtDate(d)}</td>
        <td><span class="pbadge ${d.status==="won"?"st-won":d.status==="lost"?"cf-low":"pfreq"}">${esc(d.status)}</span></td>
        <td>${esc(d.owner)}</td>
        <td class="pact-cell">${d.custom?`<span class="pc-act" onclick="pipeDealModal(${d.ci})" title="Edit">✎</span><span class="pc-act pc-del" onclick="pipeDealDelete(${d.ci})" title="Delete">🗑</span>`:`<span class="pdim" title="Imported from the SIBRA snapshot — read-only">—</span>`}</td></tr>`).join("")}</tbody>`)}`;
  }
  window.pipeDealFilter = () => {
    const q=(V("pipeDealSearch")).toLowerCase();
    const st=V("pipeDealStage"), su=V("pipeDealStatus");
    let n=0;
    document.querySelectorAll("#pipeDealsTbl tr").forEach(r=>{
      const ok=(!q||r.textContent.toLowerCase().includes(q))&&(!st||r.dataset.stage===st)&&(!su||r.dataset.status===su);
      r.style.display=ok?"":"none"; if(ok)n++;
    });
    const c=document.getElementById("pipeDealCount"); if(c)c.textContent=n+" deals";
  };

  /* ================= TAB 6 · CONTACTS ================= */
  const getCustom=()=>lsGet(C_KEY,[]);
  const saveCustom=a=>lsSet(C_KEY,a);
  const chip = t => t?`<span class="pchip">☎ ${esc(t)}</span>`:"";
  /* ================= PROSPECTS =================
     The prospecting roster as a working spreadsheet: every company we have researched, with
     the ICP, freight verdict, score and status that decide whether it gets worked today.

     This is the first tab because it is the widest true view of the business. The pipeline
     tab only shows companies that already have a deal, which is a few dozen; this is all of
     them. Filtering is done in JS over the data array and then re-rendered, NOT by walking
     the DOM and toggling display on every row, because at 336 rows (soon 500+) a per-row
     textContent read per keystroke is thousands of layout reads per character typed. */
  /* Default sort is the Line / ICP column: reps work one campaign at a time, so the table
     opens grouped by ICP with the highest-scored accounts leading each group. */
  const CO_F = { q:"", line:"", icp:"", status:"", geo:"", minScore:"", verify:"", proof:"", origin:"", sort:"line", dir:"asc" };
  const CO_PAGE = 100;
  let coShown = CO_PAGE;

  /* Pre-computed lowercase search blob per company, built once. Searching concatenated
     research text is the point: a rep looking for "windrow" or "leachate" should find the
     companies whose research mentions it, not just name matches. */
  const CO_BLOB = new Map();
  const coBlob = c => {
    let b = CO_BLOB.get(c.name);
    if(b===undefined){
      b = [c.name,c.icp,c.icpLabel,c.segment,c.city,c.state,c.geo,c.website,c.what,c.why,c.titles,c.scoreWhy,c.trigger,c.line]
        .filter(Boolean).join(" ").toLowerCase();
      CO_BLOB.set(c.name,b);
    }
    return b;
  };

  /* ================= ROSTER COLUMNS =================
     The company table used to be a fixed ten column <thead> with a matching hand written
     <tr>. Every column the roster gained afterwards (verification state, CRM owner, last
     contact) had nowhere to go, and a rep working the phone had to scroll past research
     prose to reach the number.

     Columns are a registry now. Each one knows how to render itself, how to export itself,
     and how to sort itself. Order and visibility are the user's, dragged on the header and
     persisted per browser. Adding a column is one entry here and it shows up in the table,
     the picker, the sort menu and the CSV at once.

     `key` is stable and stored, so renaming a label never breaks a saved layout. */
  const CO_COLS = [
    { key:"company", label:"Company", always:true,
      hint:"Company name, website link and what they do",
      sort:(a,b)=>a.name.localeCompare(b.name),
      csv:c=>c.name,
      cell:c=>`<td class="co-name">
        ${acctLink(c.name)}
        ${c.website?`<a class="co-web" href="https://${esc(c.website.replace(/^https?:\/\//,""))}" target="_blank" rel="noopener" title="${esc(c.website)}">↗</a>`:""}
        ${c.segment?`<div class="co-seg clamp2">${esc(c.segment)}</div>`:""}
      </td>` },

    /* Contact, Email and Phone sit directly after Company ON PURPOSE: the person and how
       to reach them are what a rep needs first, without scrolling past the research. */
    { key:"contacts", label:"Contact",
      hint:"The best person on file — name and title from the enrichment join, with how many more sit behind them. Falls back to the researched target titles when nobody is on file yet.",
      blank:c=>!reachOf(c).people && !c.titles,
      sort:(a,b)=>reachOf(b).people-reachOf(a).people,
      csv:c=>{ const p=primaryContact(c); return p?`${p.name}${p.title?" — "+p.title:""}`:(c.titles||""); },
      cell:c=>{ const reach=reachOf(c); const p=primaryContact(c);
        return `<td class="co-titles">${p
          ? `<b>${esc(p.name||"—")}</b>${reach.people>1?`<span class="co-more-n" title="${reach.people} named contacts on file">+${reach.people-1}</span>`:""}<div class="clamp2 pdim">${esc(p.title||"")}</div>`
          : `<div class="clamp2">${esc(c.titles&&c.titles!=="n/a - not a buying account"?c.titles:"—")}</div>`}</td>`; } },

    { key:"email", label:"Email",
      hint:"Best email on file — enriched and Instantly-verified addresses first, then desk research and CRM",
      blank:c=>!reachOf(c).emails.length,
      sort:(a,b)=>reachOf(b).emails.length-reachOf(a).emails.length,
      csv:c=>reachOf(c).emails.join(" / "),
      cell:c=>{ const reach=reachOf(c);
        return `<td class="co-mail">${reach.emails.length
        ? `<a href="mailto:${esc(reach.emails[0])}">${esc(reach.emails[0])}</a>${reach.emails.length>1?`<span class="co-more-n" title="${esc(reach.emails.slice(1).join(", "))}">+${reach.emails.length-1}</span>`:""}`
        : `<span class="co-gap" title="No email on file. Apollo enrichment fills this.">needed</span>`}</td>`; } },

    { key:"phone", label:"Phone",
      hint:"Best phone on file, from the roster or from a CRM contact",
      blank:c=>!reachOf(c).phones.length,
      sort:(a,b)=>reachOf(b).phones.length-reachOf(a).phones.length,
      csv:c=>reachOf(c).phones.join(" / "),
      cell:c=>{ const reach=reachOf(c);
        return `<td class="co-tel">${reach.phones.length
        ? `<a href="tel:${esc(reach.phones[0].replace(/[^\d+]/g,""))}">${esc(reach.phones[0])}</a>${reach.phones.length>1?`<span class="co-more-n" title="${esc(reach.phones.slice(1).join(", "))}">+${reach.phones.length-1}</span>`:""}`
        : `<span class="co-gap" title="No phone on file. Find one before this row can be worked.">needed</span>`}</td>`; } },

    { key:"status", label:"Status",
      hint:"Where this company sits with us",
      sort:(a,b)=>(STATUS[statusOf(b.name)]||STATUS.new_lead).rank-(STATUS[statusOf(a.name)]||STATUS.new_lead).rank,
      csv:c=>(STATUS[statusOf(c.name)]||{}).label||"",
      cell:c=>`<td>${stBadgeFor(c.name)}</td>` },

    /* Verification is its own column because the roster is now a mix of desk research and
       CRM import, and those are not the same thing. A rep must be able to see at a glance
       that a row has never been scored before they treat it as qualified. */
    { key:"verify", label:"Verified",
      hint:"Desk verification state. Verified means real website, ICP, freight verdict and score. It does not mean anyone has phoned them.",
      sort:(a,b)=>(VERIFY[b.verify]||VERIFY.unverified).rank-(VERIFY[a.verify]||VERIFY.unverified).rank,
      csv:c=>(VERIFY[c.verify]||{}).label||c.verify||"",
      cell:c=>{ const v=VERIFY[c.verify]||VERIFY.unverified;
        const need=(c.needs||[]).length?`Still needs: ${(c.needs||[]).join(", ")}`:"Nothing missing";
        return `<td><span class="vfy ${v.cls}" title="${esc(v.hint+" · "+need)}">${esc(v.label)}</span></td>`; } },

    /* Sits immediately after `verify` on purpose: the two answer different questions and
       seeing them side by side is what stops "verified" being read as "proven". */
    { key:"icpproof", label:"ICP proof",
      hint:"Did we fetch this company's OWN live site and does its copy match the ICP it is filed under? This is not the same as the Verified column, which only says our desk notes are complete.",
      sort:(a,b)=>(CVERIFY[b.companyVerify||"not-checked"]||CVERIFY["not-checked"]).rank-(CVERIFY[a.companyVerify||"not-checked"]||CVERIFY["not-checked"]).rank,
      csv:c=>(CVERIFY[c.companyVerify||"not-checked"]||{}).label||"",
      cell:c=>{ const v=CVERIFY[c.companyVerify||"not-checked"]||CVERIFY["not-checked"];
        const why=c.companyVerifyWhy?` · ${c.companyVerifyWhy}`:"";
        return `<td><span class="vfy ${v.cls}" title="${esc(v.hint+why)}">${esc(v.label)}</span></td>`; } },

    { key:"origin", label:"Source",
      hint:"Which system this company came from",
      sort:(a,b)=>String(a.origin||"").localeCompare(String(b.origin||"")),
      csv:c=>ORIGIN[c.origin]?ORIGIN[c.origin].label:(c.origin||""),
      cell:c=>{ const o=ORIGIN[c.origin]||ORIGIN.desk;
        return `<td><span class="orig ${o.cls}" title="${esc(o.hint)}">${esc(o.label)}</span>${c.hubspot&&c.origin!=="hubspot"?`<span class="orig or-hs" title="Also in HubSpot">+CRM</span>`:""}</td>`; } },

    { key:"line", label:"Line / ICP",
      hint:"Product line and the ICP campaign this company belongs to",
      blank:c=>!c.icp,
      /* Compound on purpose: grouping by ICP alone would order companies inside a group
         by the name tie-break, which buries the accounts worth working first. Within an
         ICP the score decides, highest first, in BOTH directions of the ICP sort. */
      sort:(a,b)=>String(a.icp||"").localeCompare(String(b.icp||"")) || ((b.score??-1)-(a.score??-1)),
      csv:c=>`${c.line||""}${c.icp?" / "+c.icp:""}`,
      cell:c=>`<td>${c.dead?`<span class="pdim">Disqualified</span>`
            :`<span class="co-line ${c.line==="Biochar"?"ln-bio":c.line==="Absorbent"?"ln-abs":"ln-none"}">${esc(c.line||"unset")}</span>
              ${c.icp?`<div class="co-icp" title="${esc(c.icpLabel||"")}">${esc(c.icp)}</div>`
                     :`<div class="co-icp co-icp-gap" title="No ICP assigned yet. It cannot join a campaign until it has one.">no ICP</div>`}`}</td>` },

    { key:"location", label:"Location",
      hint:"City and state",
      blank:c=>!c.city && !c.state,
      sort:(a,b)=>((a.state||"")+(a.city||"")).localeCompare((b.state||"")+(b.city||"")),
      csv:c=>[c.city,c.state].filter(Boolean).join(", "),
      cell:c=>`<td>${esc([c.city,c.state].filter(Boolean).join(", ")||"—")}</td>` },

    { key:"freight", label:"Freight", num:true,
      hint:"Driving distance from White Castle. Gates biochar only, absorbent ships nationwide.",
      blank:c=>c.driveMi==null && c.crowMi==null,
      sort:(a,b)=>(a.driveMi??a.crowMi??0)-(b.driveMi??b.crowMi??0),
      csv:c=>c.driveMi??"",
      cell:c=>{ const dist=c.driveMi!=null?`${num(c.driveMi)} mi`:(c.crowMi!=null?`~${num(c.crowMi)} mi`:"—");
        return `<td class="num"><span class="geo ${geoCls(c.geo,c.geoGates)}" title="${esc(geoTitle(c.geo,c.geoGates))}">${dist}</span></td>`; } },

    { key:"score", label:"Score", num:true,
      hint:"Desk score, 1 to 10",
      blank:c=>c.score==null,
      sort:(a,b)=>(b.score??0)-(a.score??0),
      csv:c=>c.score??"",
      cell:c=>`<td class="num">${c.score!=null?`<span class="sc ${scoreCls(c.score)}">${c.score}</span>`:`<span class="co-gap" title="Never scored. Score it before it goes in a campaign.">unscored</span>`}</td>` },

    { key:"why", label:"Why they fit",
      hint:"The written reason this company is on the list",
      blank:c=>!(c.why||c.scoreWhy),
      sort:(a,b)=>String(a.why||"").localeCompare(String(b.why||"")),
      csv:c=>c.dead?(c.scoreWhy||""):(c.why||""),
      cell:c=>`<td class="co-why"><div class="clamp3" title="${esc(c.why||c.scoreWhy||"")}">${esc(c.dead?(c.scoreWhy||"No reason recorded"):(c.why||"—"))}</div></td>` },

    /* Off by default. Real data, but only some rows have it, so it earns its space only for
       someone actually working the CRM overlap. */
    { key:"owner", label:"CRM owner", off:true,
      hint:"Who owns the relationship in HubSpot",
      blank:c=>!c.owner,
      sort:(a,b)=>String(a.owner||"").localeCompare(String(b.owner||"")),
      csv:c=>c.owner||"",
      cell:c=>`<td>${c.owner?esc(c.owner):`<span class="pdim">—</span>`}</td>` },

    { key:"lastContacted", label:"Last contacted", off:true,
      hint:"Most recent logged contact in HubSpot. Blank means never.",
      blank:c=>!c.lastContacted,
      sort:(a,b)=>String(b.lastContacted||"").localeCompare(String(a.lastContacted||"")),
      csv:c=>c.lastContacted||"",
      cell:c=>`<td>${c.lastContacted?`<span class="t-num">${esc(String(c.lastContacted).split("T")[0])}</span>`:`<span class="pdim">never</span>`}</td>` },

    { key:"needs", label:"Missing", off:true,
      hint:"Exactly what this row is missing before it can be worked",
      sort:(a,b)=>(b.needs||[]).length-(a.needs||[]).length,
      csv:c=>(c.needs||[]).join("; "),
      cell:c=>`<td class="co-needs">${(c.needs||[]).length
        ? (c.needs||[]).map(n=>`<span class="need">${esc(n)}</span>`).join("")
        : `<span class="need-ok">complete</span>`}</td>` },

    { key:"trigger", label:"Trigger", off:true,
      hint:"The opening angle recorded during research",
      blank:c=>!c.trigger,
      sort:(a,b)=>String(a.trigger||"").localeCompare(String(b.trigger||"")),
      csv:c=>c.trigger||"",
      cell:c=>`<td class="co-why"><div class="clamp2" title="${esc(c.trigger||"")}">${esc(c.trigger||"—")}</div></td>` },
  ];
  const COL_BY = Object.fromEntries(CO_COLS.map(c=>[c.key,c]));

  /* Verification vocabulary. Ranked so sorting runs worst to best and the rows that need
     work surface together. */
  const VERIFY = {
    verified:   { label:"Verified",   cls:"vfy-ok",   rank:5, hint:"Desk verified: real website, an ICP, a freight verdict and a score." },
    review:     { label:"Review",     cls:"vfy-rev",  rank:4, hint:"Real, but an institution or nonprofit that buys on grant and procurement cycles. Decide how to work it." },
    partial:    { label:"Partial",    cls:"vfy-part", rank:3, hint:"Some desk research done, one or two core fields still missing." },
    unverified: { label:"Unverified", cls:"vfy-no",   rank:2, hint:"Imported, never desk researched. Needs an ICP, freight verdict and score before it is called." },
    killed:     { label:"Killed",     cls:"vfy-dead", rank:1, hint:"Disqualified during research, with a written reason on the profile." },
    rejected:   { label:"Rejected",   cls:"vfy-dead", rank:0, hint:"Not a business that buys what we sell. Kept visible so it is not re-added on the next scrape." },
  };
  /* Company ICP PROOF. A different question from VERIFY above, and the roster has been
     burned by the two being conflated: `verify: verified` only means OUR notes are
     complete, which can be true for a company nobody ever looked at. This one means we
     fetched the company's own live site and its copy matches the ICP it is filed under.
     It is the layer that gates Apollo spend and the campaign gate, so it gets its own
     column rather than being folded into the one next to it. */
  const CVERIFY = {
    verified:     { label:"Proven",      cls:"vfy-ok",   rank:5, hint:"ICP PROVEN: we fetched their live site and their own copy uses this ICP's vocabulary. This is the only state that defends the row and the only one Apollo credits may be spent on." },
    partial:      { label:"Unproven",    cls:"vfy-part", rank:3, hint:"Site loaded but its copy did not clearly match this ICP. Usually a JS-rendered site; sometimes a company that genuinely does not fit. Held for a human read, not killed." },
    "mx-only":    { label:"Mail only",   cls:"vfy-part", rank:2, hint:"No usable site, but the domain accepts mail. Real enough to hold, not proven." },
    failed:       { label:"Failed",      cls:"vfy-dead", rank:1, hint:"Nothing resolves, parked, squatted, or read and judged not a prospect. Never spend on it." },
    public:       { label:"Public body", cls:"vfy-dead", rank:0, hint:"Screened as a public body. AB.MUNI, never worked." },
    "not-checked":{ label:"Not checked", cls:"vfy-no",   rank:4, hint:"Never put through the live-site test. Not bad, just unproven by this standard." },
  };
  const ORIGIN = {
    desk:     { label:"Research", cls:"or-desk", hint:"Desk research pass. Triaged, geo checked and scored by hand." },
    hubspot:  { label:"HubSpot",  cls:"or-hs",   hint:"Came from the CRM. A real relationship, but never desk scored." },
    sheet:    { label:"Sheet",    cls:"or-sh",   hint:"Carried over from the original target spreadsheet and never merged into the research roster." },
    geoaudit: { label:"Geo audit",cls:"or-sh",   hint:"Surfaced by the 500 mile geo audit and never merged into the research roster." },
    ldeq:     { label:"LDEQ",     cls:"or-ld",   hint:"Louisiana DEQ register of permitted solid waste facilities. An authoritative permit record, not a qualified lead: no website, no contact and no score until someone researches it." },
  };

  /* ---- column layout preferences (per browser) ---- */
  const COL_KEY = "vej_pipe_co_cols_v1";
  const defaultLayout = () => ({ order: CO_COLS.map(c=>c.key), hidden: CO_COLS.filter(c=>c.off).map(c=>c.key) });
  function colLayout(){
    const saved = lsGet(COL_KEY, null);
    const def = defaultLayout();
    if(!saved) return def;
    /* Reconcile against the registry every read. A saved layout from before a column existed
       must not hide the new column, and a saved key for a deleted column must not crash the
       header. Unknown keys are dropped, new keys are appended in registry order. */
    const known = new Set(CO_COLS.map(c=>c.key));
    const order = (saved.order||[]).filter(k=>known.has(k));
    for(const c of CO_COLS) if(!order.includes(c.key)) order.push(c.key);
    const hidden = (saved.hidden||[]).filter(k=>known.has(k) && !COL_BY[k].always);
    return { order, hidden };
  }
  const visibleCols = () => { const L=colLayout(); return L.order.map(k=>COL_BY[k]).filter(c=>c && !L.hidden.includes(c.key)); };
  const saveLayout = L => { lsSet(COL_KEY, L); remount(); };

  window.pipeColToggle = key => {
    const L = colLayout();
    if(COL_BY[key] && COL_BY[key].always) return;      // Company is the row's identity
    L.hidden = L.hidden.includes(key) ? L.hidden.filter(k=>k!==key) : [...L.hidden, key];
    saveLayout(L);
  };
  window.pipeColReset = () => { lsSet(COL_KEY, null); try{ localStorage.removeItem(COL_KEY); }catch(e){} remount(); };
  window.pipeColAll = show => { const L=colLayout(); L.hidden = show?[]:CO_COLS.filter(c=>!c.always).map(c=>c.key); saveLayout(L); };
  window.pipeColMove = (key, dir) => {
    const L = colLayout();
    const i = L.order.indexOf(key); const j = i + dir;
    if(i<0 || j<0 || j>=L.order.length) return;
    [L.order[i], L.order[j]] = [L.order[j], L.order[i]];
    saveLayout(L);
  };
  /* Drop `src` immediately before `dst` in the saved order. Used by both the header drag and
     the picker drag, so the two stay consistent. */
  window.pipeColDrop = (src, dst) => {
    if(!src || src===dst) return;
    const L = colLayout();
    const from = L.order.indexOf(src); if(from<0) return;
    L.order.splice(from,1);
    const to = dst ? L.order.indexOf(dst) : L.order.length;
    L.order.splice(to<0?L.order.length:to, 0, src);
    saveLayout(L);
  };
  window.pipeColPicker = () => {
    const el = document.getElementById("coColPop");
    if(el) el.classList.toggle("open");
  };
  /* Bound once on document, not per render: remount() replaces the whole section markup on
     every filter change, so a listener attached to the popover itself would be re-added
     each time and leak. The guard keeps that true even if this file is evaluated twice. */
  if(!window.__coColPopBound){
    window.__coColPopBound = true;
    document.addEventListener("click", ev => {
      const pop = document.getElementById("coColPop");
      if(!pop || !pop.classList.contains("open")) return;
      if(ev.target.closest(".colp-wrap")) return;   // inside the picker or its own button
      pop.classList.remove("open");
    });
    document.addEventListener("keydown", ev => {
      if(ev.key !== "Escape") return;
      const pop = document.getElementById("coColPop");
      if(pop) pop.classList.remove("open");
    });
  }

  /* Header drag. HTML5 DnD rather than pointer maths: it is a list reorder, the browser
     handles the drag image and the escape key, and it degrades to the arrow buttons in the
     picker for anyone who cannot drag. */
  window.pipeColDragStart = (ev, key) => {
    ev.dataTransfer.effectAllowed = "move";
    try{ ev.dataTransfer.setData("text/plain", key); }catch(e){}
    COL_DRAG = key;
    ev.currentTarget.classList.add("dragging");
  };
  window.pipeColDragOver = (ev, key) => {
    if(!COL_DRAG || COL_DRAG===key) return;
    ev.preventDefault();
    ev.dataTransfer.dropEffect = "move";
    ev.currentTarget.classList.add("drop-into");
  };
  window.pipeColDragLeave = ev => ev.currentTarget.classList.remove("drop-into");
  window.pipeColDragEnd = () => {
    COL_DRAG = null;
    document.querySelectorAll(".co-th.dragging,.co-th.drop-into,.colp-row.dragging,.colp-row.drop-into")
      .forEach(e=>e.classList.remove("dragging","drop-into"));
  };
  window.pipeColDragDrop = (ev, key) => {
    ev.preventDefault();
    const src = COL_DRAG || (()=>{ try{ return ev.dataTransfer.getData("text/plain"); }catch(e){ return ""; } })();
    window.pipeColDragEnd();
    window.pipeColDrop(src, key);
  };
  let COL_DRAG = null;

  /* Clicking a header sorts by that column, second click reverses. Kept in the same state
     object as the sort dropdown so the two never disagree. */
  window.pipeColSort = key => {
    if(!COL_BY[key] || !COL_BY[key].sort) return;
    CO_F.dir = (CO_F.sort===key && CO_F.dir!=="desc") ? "desc" : "asc";
    CO_F.sort = key; coShown=CO_PAGE; remount();
  };

  function coFiltered(){
    const f=CO_F;
    let out = rosterList().filter(c=>{
      if(f.line && c.line!==f.line) return false;
      if(f.icp && c.icp!==f.icp) return false;
      if(f.geo && c.geo!==f.geo) return false;
      if(f.minScore!=="" && (c.score??-1) < +f.minScore) return false;
      if(f.status && statusOf(c.name)!==f.status) return false;
      if(f.verify && c.verify!==f.verify) return false;
      /* Disqualified rows are excluded from an ICP-proof filter even when they carry a
         proof verdict, because the two states are independent and both can be true at
         once: Texas Oil & Gas Association's site really does match AB.OG vocabulary, and
         it is still killed as a trade body that buys nothing. Counting it as "proven"
         would put the header count (409, live and ICP'd) one out from the rows on screen.

         A row with no ICP is excluded for the same reason from the other direction: there
         is no ICP to have proven, so it belongs in the "no ICP" gap rather than swelling
         "not checked" by 140. Both constraints match how R.icpProven is derived. */
      if(f.proof && (c.dead || !c.icp || (c.companyVerify||"not-checked")!==f.proof)) return false;
      if(f.origin && (c.origin||"desk")!==f.origin) return false;
      if(f.q && !coBlob(c).includes(f.q)) return false;
      return true;
    });
    /* Sorting is the column's own comparator, so a column added to the registry is
       sortable without touching this function. Name is always the tie break, which keeps
       the order stable across re-renders instead of shuffling equal rows. */
    const col = COL_BY[f.sort] || COL_BY.score;
    const cmp = col.sort || COL_BY.score.sort;
    const blank = col.blank || (()=>false);
    const sign = f.dir === "desc" ? -1 : 1;
    /* Rows with nothing in the sorted column always sink, in BOTH directions. Now that the
       roster is 40 percent CRM import, ascending by location or score would otherwise open
       on a wall of blanks, which is the least useful thing the table can show. Reversing the
       sort should flip the rows that have data, not promote the ones that do not.
       The sentinel-character trick this replaced did not even work: localeCompare collates
       punctuation BEFORE letters, so "~" sorted to the top rather than the bottom. */
    out.sort((a,b)=>{
      const ba = blank(a), bb = blank(b);
      if(ba !== bb) return ba ? 1 : -1;
      return sign*cmp(a,b) || a.name.localeCompare(b.name);
    });
    return out;
  }

  window.pipeCoFilter = () => {
    CO_F.q=(V("coQ")||"").trim().toLowerCase();
    CO_F.line=V("coLine"); CO_F.icp=V("coIcp"); CO_F.status=V("coStatus");
    CO_F.geo=V("coGeo"); CO_F.minScore=V("coScore"); CO_F.sort=V("coSort")||"score";
    CO_F.verify=V("coVerify"); CO_F.proof=V("coProof"); CO_F.origin=V("coOrigin");
    coShown=CO_PAGE; remount();
  };
  window.pipeCoReset = () => { Object.assign(CO_F,{q:"",line:"",icp:"",status:"",geo:"",minScore:"",verify:"",proof:"",origin:"",sort:"line",dir:"asc"}); coShown=CO_PAGE; remount(); };
  window.pipeCoMore = () => { coShown+=CO_PAGE; remount(); };

  const scoreCls = s => s>=9?"sc-hot":s>=7?"sc-warm":s>=5?"sc-mid":"sc-cold";
  /* Freight styling is LINE-AWARE. Only biochar is bound by the ring out of White Castle;
     pellets and crumble ship nationwide, so an out-of-ring absorbent account is a normal
     account, not a problem. Painting it red would tell a rep not to call a company we
     actively want. Distance still shows, because freight cost is still real, but it is
     rendered neutral when it does not gate anything. */
  const geoCls = (g,gates=true) => !gates ? "geo-na"
    : /^IN$/i.test(g)?"geo-in" : /BORDER/i.test(g)?"geo-edge" : "geo-out";
  const geoTitle = (g,gates=true) => gates
    ? `Biochar freight ring: ${g||"unknown"}`
    : `Absorbent ships nationwide, so distance does not gate this account (recorded ${g||"unknown"} for freight cost only)`;

  /* Contact reachability, merged from two places: the roster's parsed phone/email, and any
     real person-contact already in the CRM for that account. A rep scanning for who to call
     next needs to see at a glance which rows are actually dialable. */
  function reachOf(c){
    const cs = allContacts().filter(x=>norm(x.account)===norm(c.name));
    const phones = [...new Set([...(c.phones||[]), ...cs.map(x=>x.phone).filter(Boolean), ...cs.map(x=>x.mobile).filter(Boolean)])];
    /* c.emails leads with the enriched, Instantly-verified addresses (build-roster orders
       it that way); CRM contact emails append after. */
    const emails = [...new Set([...(c.emails||[]), ...cs.map(x=>x.email).filter(Boolean)])];
    /* People = enrichment contacts joined by domain, else CRM matches, else the free-tier
       harvest names. The three never double-count: they are fallbacks, not a union. */
    const people = (c.contacts||[]).length || cs.length || (c.people||[]).length;
    return { phones, emails, people };
  }
  /* The one person a rep should ask for first: best verification band wins (build-roster
     pre-sorts c.contacts), falling back to CRM contacts, then free-harvest names. */
  function primaryContact(c){
    const jc=(c.contacts||[]).find(x=>x.s!=="invalid");
    if(jc) return { name:jc.n, title:jc.t, email:jc.e, status:jc.s };
    const cc=allContacts().find(x=>norm(x.account)===norm(c.name));
    if(cc) return { name:cc.name, title:cc.title||"", email:cc.email||"", status:"" };
    const p=(c.people||[])[0];
    if(p) return { name:p.name, title:p.title||"", email:"", status:"" };
    return null;
  }

  /* Column picker. Show/hide with a checkbox, reorder by dragging a row or nudging it with
     the arrows. The arrows are not decoration: drag and drop is unusable with a keyboard or
     a screen reader, and this is the control that decides what a rep can see. */
  function colPicker(){
    const L = colLayout();
    const shown = CO_COLS.length - L.hidden.length;
    return `<div class="colp-wrap">
      <button class="btn btn-ghost" onclick="pipeColPicker()" title="Choose which columns appear and what order they go in">Columns (${shown}/${CO_COLS.length})</button>
      <div class="colp" id="coColPop">
        <div class="colp-h">
          <b>Table columns</b>
          <span class="colp-acts">
            <a onclick="pipeColAll(true)">All</a>
            <a onclick="pipeColAll(false)">None</a>
            <a onclick="pipeColReset()">Reset</a>
          </span>
        </div>
        <p class="colp-hint">Drag a row to reorder, or drag the header on the table itself. Click a header to sort by it.</p>
        <div class="colp-list">
          ${L.order.map((k,i)=>{ const col=COL_BY[k]; if(!col) return "";
            const on = !L.hidden.includes(k);
            return `<div class="colp-row" draggable="true"
                ondragstart="pipeColDragStart(event,'${k}')"
                ondragover="pipeColDragOver(event,'${k}')"
                ondragleave="pipeColDragLeave(event)"
                ondrop="pipeColDragDrop(event,'${k}')"
                ondragend="pipeColDragEnd()">
              <span class="colp-grip" aria-hidden="true"></span>
              <label class="colp-lbl${col.always?" locked":""}" title="${esc(col.hint)}">
                <input type="checkbox" ${on?"checked":""} ${col.always?"disabled":""} onchange="pipeColToggle('${k}')">
                <span>${esc(col.label)}</span>
                ${col.always?`<span class="colp-lock" title="The company name identifies the row and cannot be hidden">locked</span>`:""}
              </label>
              <span class="colp-nudge">
                <button type="button" onclick="pipeColMove('${k}',-1)" ${i===0?"disabled":""} aria-label="Move ${esc(col.label)} left">↑</button>
                <button type="button" onclick="pipeColMove('${k}',1)" ${i===L.order.length-1?"disabled":""} aria-label="Move ${esc(col.label)} right">↓</button>
              </span>
            </div>`; }).join("")}
        </div>
      </div>
    </div>`;
  }

  /* ================= CREATE PROSPECT (writes to Allo CRM) =================
     Every other control on this tab reads. This one writes, to a real system, so it is built
     to a different standard than the local-storage CRUD elsewhere in this file.

     WHAT IT ACTUALLY DOES. POST /api/prospect, a Pages Function that holds ALLO_API_KEY on
     the edge, creates the company and the person, writes the dialer note, and then READS THE
     RECORD BACK. The read-back is not decoration: on this API a 200 is not evidence that a
     field was stored — `title` and `first_name` both return 200 and vanish, which is exactly
     why every Power Dialer card once read "Job & company unknown". So the panel below shows
     what Allo returned when asked, not what we hoped we sent.

     IT ALSO WRITES LOCALLY, but only after the remote create succeeds. A prospect that exists
     in this browser and not in Allo is the failure mode worth avoiding: the rep sees it on the
     roster, nobody can dial it.

     NO FUNCTIONS ON THE STATIC DEV SERVER. `python3 -m http.server` and `npx serve` do not run
     Pages Functions, so /api/prospect 404s locally. That is reported as "this build has no
     Function" rather than as a create failure, because the two need different fixes. */

  /* Mirrors functions/_lib/prospect.js normalizeNANP(). Deliberately duplicated: this file is
     a classic script, not a module, and cannot import across that boundary. The SERVER copy is
     the one that counts — this exists to fail a typo before a round trip, not to be the gate.
     Apollo handed us a +91 mobile for a real person on 2026-08-28 and it reached the dialer. */
  const nanp = raw => {
    const digits = String(raw||"").replace(/[^\d]/g,"");
    const ten = digits.length===11 && digits.startsWith("1") ? digits.slice(1) : digits;
    if(ten.length!==10) return { ok:false, reason:`needs 10 digits, got ${ten.length}` };
    if(!/^[2-9]\d{2}[2-9]\d{6}$/.test(ten)) return { ok:false, reason:"area code and exchange cannot start with 0 or 1" };
    return { ok:true, e164:`+1${ten}` };
  };

  window.pipeProspectModal = prefill => {
    const p = prefill || {};
    const icps = window.ROSTER ? Object.keys(window.ROSTER.byIcp).sort() : [];
    const body = `
      <div class="note" style="margin:0 0 12px;font-size:12.5px">
        Creates the company, the person and the dialer note <b>in Allo CRM</b>, then reads the
        record back and shows you what Allo actually stored. The number is checked before
        anything is created.
      </div>
      <div class="pcf-grid">
        ${F("prCompany","Company",p.company,1,"e.g. Knight Oil Tools")}
        ${F("prWebsite","Website",p.website,0,"knightoiltools.com")}
      </div>
      <div class="pcf-grid">
        ${F("prPerson","Person",p.person,1,"e.g. Bill Trahan")}
        ${F("prTitle","Job title",p.title,0,"General Manager")}
      </div>
      <div class="pcf-grid">
        ${F("prNumber","Direct number",p.number,1,"(337) 581-2756")}
        ${F("prEmail","Email",p.email,0,"name@company.com")}
      </div>
      <div class="pcf-grid">
        <div class="pcf"><label>ICP</label><input class="pinput" id="prIcp" list="prIcpList" value="${esc(p.icp||"")}" placeholder="AB.OG"><datalist id="prIcpList">${icps.map(k=>`<option value="${esc(k)}">`).join("")}</datalist></div>
        ${F("prOpener","Open with",p.opener,0,"the line that earns the next 20 seconds")}
      </div>
      <div class="pcf"><label>Anything else for the note</label><textarea class="pinput" id="prNote" rows="2" placeholder="What they run today, who referred them, why now">${esc(p.note||"")}</textarea></div>
      <div id="prResult"></div>`;
    openModal("Create Prospect", body, "Create in Allo", "pipeProspectCreate()", true);
    document.getElementById("prCompany").focus();
  };

  const prSetBusy = (on, label) => {
    const btn = document.querySelector("#pipeModal .btn-primary");
    if(!btn) return;
    btn.disabled = on;
    btn.textContent = on ? (label||"Creating…") : "Create in Allo";
  };
  const prSay = html => { const el=document.getElementById("prResult"); if(el) el.innerHTML=html; };

  window.pipeProspectCreate = async () => {
    const input = {
      company:V("prCompany"), website:V("prWebsite"), person:V("prPerson"), title:V("prTitle"),
      number:V("prNumber"), email:V("prEmail"), icp:V("prIcp"), opener:V("prOpener"), note:V("prNote"),
    };
    if(!input.company || !input.person){ prSay(`<div class="note warn" style="margin-top:10px"><b>Company and person are both required.</b></div>`); return; }
    const n = nanp(input.number);
    if(!n.ok){
      prSay(`<div class="note warn" style="margin-top:10px"><b>That number will not dial.</b> ${esc(n.reason)}.
        Nothing was created — a bad number in the dialer burns a slot mid-session, and a gap is at least visible.</div>`);
      return;
    }

    prSetBusy(true);
    prSay(`<div class="note" style="margin-top:10px">Creating company, person and note in Allo, then reading the record back…</div>`);

    let res, data;
    try {
      res = await fetch("/api/prospect", {
        method:"POST", headers:{"Content-Type":"application/json"}, body:JSON.stringify(input),
      });
    } catch(e) {
      prSetBusy(false);
      prSay(`<div class="note warn" style="margin-top:10px"><b>Could not reach /api/prospect.</b> ${esc(String(e))}<br>Nothing was created.</div>`);
      return;
    }
    const text = await res.text();
    try { data = JSON.parse(text); }
    catch {
      prSetBusy(false);
      /* A 404 with an HTML body is the static dev server, not a broken route. Say which. */
      prSay(`<div class="note warn" style="margin-top:10px"><b>This build has no /api/prospect Function.</b>
        Pages Functions only run on the deployed Sales OS (and under <code>npx wrangler pages dev</code>) —
        a plain static server returns the 404 page, which is what came back (HTTP ${res.status}).
        <b>Nothing was created.</b></div>`);
      return;
    }

    prSetBusy(false);

    if(!data.ok){
      const why = data.reason==="not-configured"
        ? `<b>ALLO_API_KEY is not set on this deployment.</b> Set it in Cloudflare Pages → cs-ops-sales-os → Settings → Variables and secrets. Nothing was created.`
        : `<b>Allo rejected it.</b> ${esc(data.error||data.reason||"no reason given")}`;
      prSay(`<div class="note warn" style="margin-top:10px">${why}
        ${(data.steps||[]).length?`<div style="margin-top:8px;font-size:12px">${data.steps.map(s=>`${esc(s.step)}: ${esc(s.action)}`).join(" · ")}</div>`:""}
      </div>`);
      return;
    }

    /* Remote first, local second — see the header. */
    upsertAccount(input.company, "prospect");
    const arr = getCustom();
    const parts = input.person.trim().split(/\s+/);
    arr.push({
      name:input.person, first:parts.slice(0,-1).join(" ")||parts[0], last:parts.length>1?parts[parts.length-1]:"",
      account:input.company, title:input.title, email:input.email, phone:data.e164, mobile:"",
      notes:`Created in Allo CRM ${data.personId}${input.note?" — "+input.note:""}`,
    });
    saveCustom(arr);
    addAcctActivity(input.company, {
      ch:"note", title:"Prospect created in Allo",
      body:`${input.person}${input.title?", "+input.title:""} — ${data.e164}. Allo person ${data.personId}, company ${data.companyId}.${data.reused?" Filled in an existing bare-number record rather than creating a twin.":""}`,
      status:"logged",
    });

    const st = data.stored || {};
    const row = (k,v,good) => `<tr><td style="padding:2px 10px 2px 0;color:var(--d-text-dim)">${esc(k)}</td><td style="padding:2px 0"><b>${v?esc(v):"<span style='color:var(--crimson-300)'>not stored</span>"}</b>${good===false?` <span style="color:var(--crimson-300)">✕</span>`:v?` ✓`:""}</td></tr>`;
    prSay(`
      <div class="note" style="margin-top:10px;border-color:var(--navy-600)">
        <b>Created in Allo.</b>${data.reused?` It filled in an existing record that held this number as a bare entry rather than creating a second person.`:""}
        ${data.noteOk?"":` <span style="color:var(--crimson-300)">The dialer note did not write.</span>`}
        <div style="margin:8px 0 4px;font-size:12px;color:var(--d-text-dim)">What Allo returned when asked for the record back:</div>
        <table style="font-size:12.5px;border-collapse:collapse">
          ${row("name", st.name)}
          ${row("job title", st.job_title)}
          ${row("company", st.company)}
          ${row("number", (st.numbers||[]).join(", "))}
          ${row("email", (st.emails||[]).join(", "))}
        </table>
        <div style="margin-top:8px;font-size:11.5px;color:var(--d-text-dim)">person ${esc(data.personId)} · company ${esc(data.companyId)}</div>
      </div>
      <div style="margin-top:10px;display:flex;gap:8px">
        <button class="btn btn-ghost" onclick="pipeProspectModal()">Add another</button>
        <button class="btn btn-primary" onclick="pipeModalClose();pipeCoRemount()">Done</button>
      </div>`);
  };
  window.pipeCoRemount = () => remount();

  function tCompanies(){
    const R = window.ROSTER;
    if(!R) return `<div class="note warn"><b>Roster not loaded.</b> roster-data.js is missing from this deployment. Run <code>node scripts/build-roster.mjs</code> and redeploy.</div>`;
    const rows = coFiltered();
    const page = rows.slice(0, coShown);
    const icps = Object.keys(R.byIcp).sort();
    const sel = (id,label,opts,val,onchange) =>
      `<select class="pinput co-sel" id="${id}" onchange="${onchange||"pipeCoFilter()"}" aria-label="${esc(label)}">${opts.map(o=>
        `<option value="${esc(o[0])}"${o[0]===val?" selected":""}>${esc(o[1])}</option>`).join("")}</select>`;

    /* Counts per status across the WHOLE roster, not the filtered set: these double as the
       headline "where does the roster stand" numbers, and they must not move when someone
       types in the search box. */
    const tally = {}, vTally = {}, oTally = {}, cvTally = {};
    for(const c of rosterList()){
      const s=statusOf(c.name); tally[s]=(tally[s]||0)+1;
      vTally[c.verify]=(vTally[c.verify]||0)+1;
      oTally[c.origin||"desk"]=(oTally[c.origin||"desk"]||0)+1;
      if(!c.dead && c.icp) cvTally[c.companyVerify||"not-checked"]=(cvTally[c.companyVerify||"not-checked"]||0)+1;
    }
    const cols = visibleCols();

    return `
      <div class="co-head">
        <div class="co-stats">
          ${Object.entries(STATUS).sort((a,b)=>b[1].rank-a[1].rank).map(([k,s])=>
            `<button class="co-stat ${s.cls}${CO_F.status===k?" on":""}" onclick="pipeCoQuick('status','${k}')" title="${esc(s.hint)}">
               <span class="n">${num(tally[k]||0)}</span><span class="l">${esc(s.label)}</span></button>`).join("")}
          <span class="co-total"><b>${num(R.count)}</b> companies · <b>${num(R.live)}</b> live · <b>${num(vTally.verified||0)}</b> desk verified${R.needsWork?` · <button class="co-total-link" onclick="pipeCoQuick('verify','unverified')" title="Live rows imported or carried over that have never been desk scored. Click to see them.">${num(R.needsWork)} still need work</button>`:""}</span>
          <span class="co-total"><button class="co-total-link" onclick="pipeCoQuick('proof','verified')" title="Companies whose OWN live site was fetched and matched their ICP's vocabulary. The only state Apollo credits may be spent on. Click to see them."><b>${num(R.icpProven||0)}</b> of ${num(R.liveIcp||0)} ICP PROVEN</button> · <button class="co-total-link" onclick="pipeCoQuick('proof','partial')" title="Site loaded but its copy did not clearly match the ICP. Held for a human read. Click to see them.">${num(cvTally.partial||0)} unproven</button> · <button class="co-total-link" onclick="pipeCoQuick('proof','not-checked')" title="Never put through the live-site test — almost all of these are AB.MUNI (prohibited) or have no website to fetch. Click to see them.">${num(cvTally["not-checked"]||0)} not checked</button></span>
        </div>
      </div>
      <div class="co-bar">
        <input class="pinput co-q" id="coQ" placeholder="Search name, ICP, city, or the research text…" value="${esc(CO_F.q)}" oninput="pipeCoDebounce()">
        ${sel("coLine","Product line",[["","All lines"],["Biochar","Biochar"],["Absorbent","Absorbent"],["DEAD","Disqualified"]],CO_F.line)}
        ${sel("coIcp","ICP",[["","All ICPs"],...icps.map(k=>[k,`${k} · ${(R.icpLabels[k]||k)} (${R.byIcp[k]})`])],CO_F.icp)}
        ${sel("coStatus","Status",[["","Any status"],...Object.entries(STATUS).map(([k,s])=>[k,s.label])],CO_F.status)}
        ${sel("coGeo","Freight",[["","Any freight"],["IN","In zone"],["BORDERLINE","Borderline"],["OUT","Out of zone"]],CO_F.geo)}
        ${sel("coScore","Min score",[["","Any score"],["9","9+ (best)"],["8","8+"],["7","7+"],["5","5+"]],CO_F.minScore)}
        ${sel("coVerify","Verification",[["","Any verification"],...Object.entries(VERIFY).sort((a,b)=>b[1].rank-a[1].rank).map(([k,v])=>[k,`${v.label} (${vTally[k]||0})`])],CO_F.verify)}
        ${sel("coProof","ICP proof",[["","Any ICP proof"],...Object.entries(CVERIFY).sort((a,b)=>b[1].rank-a[1].rank).map(([k,v])=>[k,`${v.label} (${cvTally[k]||0})`])],CO_F.proof)}
        ${sel("coOrigin","Source",[["","Any source"],...Object.entries(ORIGIN).map(([k,o])=>[k,`${o.label} (${oTally[k]||0})`]).filter(x=>oTally[x[0].replace(/ .*/,"")]!==undefined||true)],CO_F.origin)}
        ${sel("coSort","Sort",CO_COLS.filter(c=>c.sort).map(c=>[c.key,`Sort: ${c.label}`]),CO_F.sort)}
        <button class="btn btn-ghost" onclick="pipeCoReset()">Reset</button>
        ${colPicker()}
        <button class="btn btn-ghost" onclick="pipeCoExport()" title="Exports exactly the columns you can see, in the order you put them in">Export view</button>
        <button class="btn btn-ghost" onclick="pipeCoExportAll()" title="Every field we hold, regardless of which columns are shown">Export all fields</button>
        <button class="btn btn-primary" onclick="pipeProspectModal()" title="Create a company, a person and a dialer note in Allo CRM, then read the record back to prove it landed">+ Create prospect</button>
        <span class="pcount-lbl">${num(rows.length)} shown</span>
      </div>
      ${rows.length?"":`<div class="note" style="margin-top:12px">No company matches these filters. <a href="#" onclick="pipeCoReset();return false">Clear them</a>.</div>`}
      ${tblWrap(`<thead><tr>${cols.map(col=>{
          const active = CO_F.sort===col.key;
          const arrow = active ? (CO_F.dir==="desc"?"↓":"↑") : "";
          return `<th class="co-th${col.num?" num":""}${active?" sorted":""}"
            draggable="true"
            ondragstart="pipeColDragStart(event,'${col.key}')"
            ondragover="pipeColDragOver(event,'${col.key}')"
            ondragleave="pipeColDragLeave(event)"
            ondrop="pipeColDragDrop(event,'${col.key}')"
            ondragend="pipeColDragEnd()"
            title="${esc(col.hint)} · Drag to reorder, click to sort">
            <button type="button" class="co-th-b" onclick="pipeColSort('${col.key}')">
              <span class="co-th-grip" aria-hidden="true"></span>${esc(col.label)}<span class="co-th-ar">${arrow}</span>
            </button></th>`;
        }).join("")}</tr></thead>
        <tbody>${page.map(c=>`<tr class="${c.dead?"co-dead":""}">${cols.map(col=>col.cell(c)).join("")}</tr>`).join("")}</tbody>`)}
      ${rows.length>coShown?`<div class="co-more"><button class="btn btn-ghost" onclick="pipeCoMore()">Show ${num(Math.min(CO_PAGE,rows.length-coShown))} more (${num(rows.length-coShown)} remaining)</button></div>`:""}
    `;
  }

  /* coRow is gone. A row is now cols.map(col => col.cell(c)), so a column's markup lives
     with its label, its sort and its CSV mapping in CO_COLS rather than in a parallel
     function that had to be edited in lockstep. */

  /* Debounced so a fast typist does not trigger a full re-render per keystroke. */
  let coTimer=null;
  window.pipeCoDebounce = () => { clearTimeout(coTimer); coTimer=setTimeout(()=>window.pipeCoFilter(),180); };
  window.pipeCoQuick = (field,val) => { CO_F[field] = CO_F[field]===val?"":val; coShown=CO_PAGE; remount(); };
  /* Export mirrors what is on screen: the visible columns, in the order they were dragged
     into, filtered the same way. Someone who has arranged the table to answer a question
     should get that same arrangement in the file rather than a fixed 21 column dump. */
  window.pipeCoExport = () => {
    const cols = visibleCols();
    downloadCSV("company-roster.csv", cols.map(c=>c.label), coFiltered().map(c=>cols.map(col=>col.csv(c))));
  };
  /* The everything export stays available, because the on screen set is deliberately a
     subset and an Apollo or Instantly upload wants every field we hold. */
  window.pipeCoExportAll = () => downloadCSV("company-roster-full.csv",
    ["Company","Status","Verified","Missing","Origin","Line","ICP","ICP Name","Segment","City","State","DriveMi","Freight","FreightGates","Score","Phone","Email","NamedContacts","WhyTheyFit","ScoreReason","LikelyTitles","Trigger","Website","Source","CRMOwner","LastContacted","HubSpotDeals"],
    coFiltered().map(c=>{const r=reachOf(c);return [c.name,(STATUS[statusOf(c.name)]||{}).label,(VERIFY[c.verify]||{}).label||"",(c.needs||[]).join("; "),(ORIGIN[c.origin]||{}).label||"",c.line,c.icp,c.icpLabel,c.segment,c.city,c.state,c.driveMi,c.geo,c.geoGates?"yes":"no (nationwide)",c.score,r.phones.join(" / "),r.emails.join(" / "),r.people,c.why,c.scoreWhy,c.titles,c.trigger,c.website,c.sourceUrl,c.owner||"",c.lastContacted||"",c.hsDeals||0];}));

  function tContacts(){
    /* Grouped by ICP (email-domain join first, account name second), blanks last —
       contacts are worked campaign by campaign, same as the prospects table. */
    const cs=allContacts().map(c=>({...c,_icp:icpFor(c)})).sort(byIcpThen("name"));
    const accounts=[...new Set(liveAccounts().map(a=>a.name).concat(cs.map(c=>c.account)))].filter(Boolean).sort();
    const icps=[...new Set(cs.map(c=>c._icp))].filter(Boolean).sort();
    return `
      <div class="pdeals-bar">
        <input class="pinput" id="pipeCSearch" placeholder="Search contacts…" oninput="pipeContactFilter()">
        <select class="pinput" id="pipeCIcp" onchange="pipeContactFilter()"><option value="">All ICPs</option>${icps.map(i=>`<option>${esc(i)}</option>`).join("")}</select>
        <select class="pinput" id="pipeCAccount" onchange="pipeContactFilter()"><option value="">All Accounts</option>${accounts.map(a=>`<option>${esc(a)}</option>`).join("")}</select>
        <span class="pcount-lbl" id="pipeCCount">${cs.length} contacts</span>
        <button class="btn btn-ghost" onclick="pipeContactExport()">⭳ Export CSV</button>
        <button class="btn btn-primary pc-add" onclick="pipeContactModal()">Add Contact</button>
      </div>
      ${tblWrap(`<thead><tr><th>Name</th><th>Job Title</th><th>ICP</th><th>Account</th><th>Email / Phone</th><th>Drop-off Address</th><th>Actions</th></tr></thead>
      <tbody id="pipeCTbl">${cs.map(c=>`<tr data-account="${esc(c.account||"")}" data-icp="${esc(c._icp)}">
        <td title="${esc(c.notes||"")}"><strong>${esc(c.name)}</strong></td><td>${esc(c.title||"—")}</td><td>${icpCell(c._icp)}</td><td>${c.account?acctLink(c.account):"—"}</td>
        <td>${c.email?`<a href="mailto:${esc(c.email)}">${esc(c.email)}</a><br>`:""}${chip(c.phone)}${c.mobile?` ${chip(c.mobile)} <span class="pdim" style="font-size:10.5px">(mobile)</span>`:""}</td>
        <td class="pnote">${esc(c.dropOff||"—")}</td>
        <td class="pact-cell">${readOnlyContact(c)
          ? `<span class="pdim" title="${esc(readOnlyWhy(c))}">—</span>`
          : `<span class="pc-act" onclick="pipeContactModal(${c.ci})" title="Edit">✎</span>
             <span class="pc-act pc-del" onclick="pipeContactDelete(${c.ci})" title="Delete">🗑</span>`}</td></tr>`).join("")}</tbody>`)}`;
  }
  window.pipeContactExport=()=>downloadCSV("contacts.csv",["Name","Job Title","ICP","Account","Email","Phone","Mobile","Drop-off Address","Notes"],
    allContacts().map(c=>({...c,_icp:icpFor(c)})).sort(byIcpThen("name")).map(c=>[c.name,c.title,c._icp,c.account,c.email,c.phone,c.mobile,c.dropOff,c.notes]));
  window.pipeContactFilter=()=>{
    const q=(V("pipeCSearch")).toLowerCase();
    const a=V("pipeCAccount");
    const i=V("pipeCIcp");
    let n=0;
    document.querySelectorAll("#pipeCTbl tr").forEach(r=>{
      const ok=(!q||r.textContent.toLowerCase().includes(q))&&(!a||r.dataset.account===a)&&(!i||r.dataset.icp===i);
      r.style.display=ok?"":"none"; if(ok)n++;
    });
    const c=document.getElementById("pipeCCount"); if(c)c.textContent=n+" contacts";
  };
  /* `prefill` lets a phone lead become a contact without retyping what the call already told
     us. Same shape as the deal modal's prefill, and it carries __leadPhone so the save handler
     can mark the lead claimed once the contact actually exists. */
  window.pipeContactModal=(idx,prefill)=>{
    const cur=(idx!=null&&idx>=0)?getCustom()[idx]:(prefill||{});
    if(!cur) return;
    PENDING_LEAD=(prefill&&prefill.__leadPhone)||null;
    const accounts=accountNames();
    const body=`
      <div class="pcf-grid">${F("pcFirst","First Name",cur.first,1)}${F("pcLast","Last Name",cur.last,1)}</div>
      <div class="pcf"><label>Account *</label><select class="pinput" id="pcAccount">
        <option value="">Select account…</option>${accounts.map(a=>`<option${cur.account===a?" selected":""}>${esc(a)}</option>`).join("")}
        <option value="__new"${cur.account&&!accounts.includes(cur.account)?" selected":""}>+ New account…</option></select></div>
      <div class="pcf" id="pcNewAccountWrap" style="display:${cur.account&&!accounts.includes(cur.account)?"block":"none"}"><label>New account name</label><input class="pinput" id="pcNewAccount" value="${esc(cur.account&&!accounts.includes(cur.account)?cur.account:"")}"></div>
      ${F("pcTitle","Job Title",cur.title)}
      <div class="pcf-grid">${F("pcEmail","Email",cur.email)}${F("pcPhone","Phone",cur.phone)}</div>
      ${F("pcMobile","Mobile Phone",cur.mobile)}
      <details class="pc-details"${cur.dropOff?" open":""}><summary>⚲ Add Address / Drop-off Info</summary>
        ${F("pcDrop","Drop-off Address",cur.dropOff,0,"Street, City, State, Zip")}</details>
      <div class="pcf"><label>Notes</label><textarea class="pinput" id="pcNotes" rows="3">${esc(cur.notes||"")}</textarea></div>`;
    openModal((idx!=null&&idx>=0?"Edit":"Add")+" Contact",body,idx!=null&&idx>=0?"Save Changes":"Add Contact",`pipeContactSave(${idx!=null&&idx>=0?idx:-1})`);
    document.getElementById("pcAccount").addEventListener("change",e=>{
      document.getElementById("pcNewAccountWrap").style.display=e.target.value==="__new"?"block":"none";
    });
    document.getElementById("pcFirst").focus();
  };
  /* A contact is editable only if it lives in the localStorage store, which is the only place
     this app can write. Two sources are read-only and BOTH must be recognised:

       base     the pipeline-data.js snapshot
       hubspot  the read-only HubSpot import

     HubSpot contacts used to fall through to the editable branch because they carry neither
     `base` nor a `ci` index. That produced onclick="pipeContactModal(undefined)", the modal
     read undefined as "no index", and Save ran the ADD path: editing an imported contact
     silently created a duplicate instead of changing it. Harmless-looking at 71 rows, and a
     data-corruption engine at the ~1,000 the Apollo import brings.

     Guarding on `ci` rather than on a source flag is the durable form: any future read-only
     source is covered without touching this again. */
  /* The lead a currently-open contact form came from, if any. Cleared on save and on cancel so
     a later unrelated contact cannot accidentally claim it. */
  let PENDING_LEAD=null;
  const readOnlyContact = c => c.ci === undefined || c.ci === null;
  const readOnlyWhy = c => c.hubspot
    ? "Imported from HubSpot, read-only here. Edit it in HubSpot and re-run the import."
    : "From the pipeline-data.js snapshot, edit it there.";

  window.pipeContactSave=idx=>{
    const first=V("pcFirst"), last=V("pcLast");
    let account=V("pcAccount"); const isNewAcct=account==="__new"; if(isNewAcct) account=V("pcNewAccount");
    if(!first||!last||!account){ alert("First name, last name, and account are required."); return; }
    if(isNewAcct) upsertAccount(account,"prospect");
    const rec={ name:first+" "+last, first, last, account, title:V("pcTitle"), email:V("pcEmail"),
      phone:V("pcPhone"), mobile:V("pcMobile"), dropOff:V("pcDrop"), notes:V("pcNotes") };
    /* Stored, not computed per query. This is the key the phone activity feed joins a call
       against, and normalising it in two places is how a call ends up on nobody's timeline. */
    rec.phoneE164=toE164(rec.mobile)||toE164(rec.phone)||"";
    const arr=getCustom();
    /* Belt to the readOnlyContact() suspenders. An edit that arrives with an index this store
       does not contain is a BUG, not a request to create a record: silently pushing was how
       "edit an imported contact" turned into "duplicate it". Refuse instead of guessing. */
    if(idx!=null && idx>=0){
      if(!arr[idx]){ alert("That contact could not be edited here. It comes from an imported source and is read-only."); return; }
      rec.id=arr[idx].id||uid("contact");
      rec.created_at=arr[idx].created_at||nowISO();
      arr[idx]=rec;
    } else {
      rec.id=uid("contact"); rec.created_at=nowISO();
      arr.push(rec);
    }
    rec.updated_at=nowISO();
    saveCustom(arr); pushRecord("contacts",rec);
    /* Only now, with the contact committed, does the lead leave the queue. */
    if(PENDING_LEAD){ claimLeadAfterContact(PENDING_LEAD,rec); PENDING_LEAD=null; }
    pipeModalClose(); rr();
  };
  window.pipeContactDelete=idx=>{
    const arr=getCustom(); const c=arr[idx];
    if(!c) return; if(!confirm(`Delete contact "${c.name}"?`)) return;
    arr.splice(idx,1); saveCustom(arr); removeRecord("contacts",c.id); rr();
  };

  /* ================= TAB 7 · LEADS (CRUD + convert-to-deal) ================= */
  const LEAD_ST={converted:"st-won",qualified:"st-discovery",contacted:"cf-medium",new:"cf-secured",disqualified:"cf-low"};
  function tLeads(){
    /* Same ICP grouping as Contacts: domain join first, company name second, blanks last. */
    const ls=allLeads().map(l=>({...l,_icp:icpFor(l)})).sort(byIcpThen("contact"));
    const statuses=[...new Set(ls.map(l=>l.status))];
    const icps=[...new Set(ls.map(l=>l._icp))].filter(Boolean).sort();
    return `
      <div class="pdeals-bar">
        <input class="pinput" id="pipeLSearch" placeholder="Search leads…" oninput="pipeLeadFilter()">
        <select class="pinput" id="pipeLIcp" onchange="pipeLeadFilter()"><option value="">All ICPs</option>${icps.map(i=>`<option>${esc(i)}</option>`).join("")}</select>
        <select class="pinput" id="pipeLStatus" onchange="pipeLeadFilter()"><option value="">All Status</option>${statuses.map(s=>`<option>${esc(s)}</option>`).join("")}</select>
        <span class="pcount-lbl" id="pipeLCount">${ls.length} leads</span>
        <button class="btn btn-ghost" onclick="pipeLeadExport()">⭳ Export CSV</button>
        <button class="btn btn-primary pc-add" onclick="pipeLeadModal()">Add Lead</button>
      </div>
      ${tblWrap(`<thead><tr><th>Contact</th><th>Company</th><th>ICP</th><th>Email</th><th>Phone</th><th>Source</th><th>Status</th><th>Actions</th></tr></thead>
      <tbody id="pipeLTbl">${ls.map(l=>`<tr data-status="${esc(l.status)}" data-icp="${esc(l._icp)}">
        <td><strong>${esc(l.contact)}</strong></td><td>${esc(l.company)}</td><td>${icpCell(l._icp)}</td>
        <td>${l.email?`<a href="mailto:${esc(l.email)}">${esc(l.email)}</a>`:"—"}</td><td>${chip(l.phone)||"—"}</td>
        <td><span class="pbadge pfreq">${esc(l.source)}</span></td>
        <td><span class="pbadge ${LEAD_ST[l.status]||"pfreq"}">${esc(l.status)}</span>${l.converted?`<div class="pconf-sub">✓ ${esc(l.convertedTo)}${l.convertedDate?" ("+l.convertedDate+")":""}</div>`:""}</td>
        <td class="pact-cell">${l.converted?"":`<span class="pc-act pc-conv" onclick="pipeLeadConvert(${l.base?-1:l.ci},'${esc(l.company).replace(/'/g,"\\'")}','${esc(l.contact).replace(/'/g,"\\'")}')" title="Convert to deal">➜</span>`}
          ${l.base?`<span class="pdim" title="From the SIBRA snapshot">—</span>`
          :`<span class="pc-act" onclick="pipeLeadModal(${l.ci})" title="Edit">✎</span><span class="pc-act pc-del" onclick="pipeLeadDelete(${l.ci})" title="Delete">🗑</span>`}</td></tr>`).join("")}</tbody>`)}`;
  }
  window.pipeLeadExport=()=>downloadCSV("leads.csv",["Contact","Company","ICP","Email","Phone","Source","Status","Converted To","Converted Date"],
    allLeads().map(l=>({...l,_icp:icpFor(l)})).sort(byIcpThen("contact")).map(l=>[l.contact,l.company,l._icp,l.email,l.phone,l.source,l.status,l.convertedTo||"",l.convertedDate||""]));
  window.pipeLeadFilter=()=>{
    const q=(V("pipeLSearch")).toLowerCase();
    const s=V("pipeLStatus");
    const i=V("pipeLIcp");
    let n=0;
    document.querySelectorAll("#pipeLTbl tr").forEach(r=>{
      const ok=(!q||r.textContent.toLowerCase().includes(q))&&(!s||r.dataset.status===s)&&(!i||r.dataset.icp===i);
      r.style.display=ok?"":"none"; if(ok)n++;
    });
    const c=document.getElementById("pipeLCount"); if(c)c.textContent=n+" leads";
  };
  window.pipeLeadConvert=(ci,company,contact)=>{
    /* open the Deal modal prefilled from the lead; on save it creates the deal
       and (for custom leads) flips the lead to converted. */
    pipeDealModal(null,{ deal:company+": New Deal", customer:company, notes:"Converted from lead — "+contact, stage:"discovery_qualified", __leadCi:ci>=0?ci:null });
  };
  window.pipeLeadModal=ci=>{
    const cur=(ci!=null&&ci>=0)?lsGet(L_KEY,[])[ci]:{};
    if(!cur) return;
    const body=`
      <div class="pcf-grid">${F("plContact","Contact Name",cur.contact,1)}${F("plCompany","Company",cur.company,1)}</div>
      <div class="pcf-grid">${F("plEmail","Email",cur.email)}${F("plPhone","Phone",cur.phone)}</div>
      <div class="pcf-grid">
        ${SEL("plSource","Source",["website","referral","outbound","event","other"],cur.source||"outbound")}
        ${SEL("plStatus","Status",["new","contacted","qualified","converted","disqualified"],cur.status||"new")}
      </div>
      <div class="pcf"><label>Notes</label><textarea class="pinput" id="plNotes" rows="3">${esc(cur.notes||"")}</textarea></div>`;
    openModal((ci!=null&&ci>=0?"Edit":"Add")+" Lead",body,ci!=null&&ci>=0?"Save Changes":"Add Lead",`pipeLeadSave(${ci!=null&&ci>=0?ci:-1})`);
  };
  window.pipeLeadSave=ci=>{
    const contact=V("plContact"), company=V("plCompany");
    if(!contact||!company){ alert("Contact name and company are required."); return; }
    const st=V("plStatus");
    const rec={contact, company, email:V("plEmail"), phone:V("plPhone"), source:V("plSource"), status:st, notes:V("plNotes"), converted:st==="converted"};
    const arr=lsGet(L_KEY,[]);
    if(ci>=0){ rec.convertedTo=arr[ci]?.convertedTo; rec.convertedDate=arr[ci]?.convertedDate; arr[ci]=rec; } else arr.push(rec);
    lsSet(L_KEY,arr); pipeModalClose(); rr();
  };
  window.pipeLeadDelete=ci=>{
    const arr=lsGet(L_KEY,[]); const l=arr[ci];
    if(!l) return; if(!confirm(`Delete lead "${l.contact}" (${l.company})?`)) return;
    arr.splice(ci,1); lsSet(L_KEY,arr); rr();
  };

  /* ================= TAB 8 · REPORTS ================= */
  function tReports(){
    const ds=liveDeals();
    const won=ds.filter(d=>d.status==="won"), lost=ds.filter(d=>d.status==="lost");
    const closed=won.length+lost.length;
    const wonV=sum(won,value);
    const open=ds.filter(d=>d.status==="open");
    const maxSt=Math.max(...P.stages.map(s=>sum(open.filter(d=>d.stage===s.k),value)),1);
    const stageBars=P.stages.map((s,i)=>{ const v=sum(open.filter(d=>d.stage===s.k),value);
      return `<div class="phrow"><span class="phl">${esc(s.label)}</span><div class="phtrack"><span class="phfill" style="width:${v/maxSt*100}%;background:${CAT[i%CAT.length]}"></span></div><span class="phv">${v?money(v):"—"}</span></div>`; }).join("");
    const srcOf=d=>{ const l=allLeads().find(l=>l.converted&&l.convertedTo===d.deal); return l?l.source:"Direct"; };
    const sources=[...new Set(ds.map(srcOf))];
    const maxSrc=Math.max(...sources.map(s=>sum(ds.filter(d=>srcOf(d)===s&&d.status==="won"),value)),1);
    const srcBars=sources.map((s,i)=>{
      const g=ds.filter(d=>srcOf(d)===s), w=g.filter(d=>d.status==="won");
      return `<div class="phrow"><span class="phl">${esc(s)}</span><div class="phtrack"><span class="phfill" style="width:${sum(w,value)/maxSrc*100}%;background:${CAT[i%CAT.length]}"></span></div><span class="phv">${money(sum(w,value))}</span></div>
        <div class="pdim" style="font-size:11px;margin:-4px 0 6px 148px">${g.length} deals · ${w.length} won</div>`; }).join("");
    const ls=allLeads();
    const convLeads=ls.filter(l=>l.converted).length;
    return `
      <div class="grid g4">
        ${kpi("Win Rate",closed?Math.round(won.length/closed*100)+"%":"—",`${won.length} won / ${closed} closed`)}
        ${kpi("Revenue Won",money(wonV),`${won.length} deals`)}
        ${kpi("Avg Deal Size",won.length?money(wonV/won.length):"—","won deals")}
        ${kpi("Lead Conversion",ls.length?Math.round(convLeads/ls.length*100)+"%":"—",`${convLeads} / ${ls.length} leads`)}
      </div>
      <div class="grid g2" style="margin-top:15px">
        <div class="card"><h4>Open Pipeline by Stage ($)</h4>${stageBars}</div>
        <div class="card"><h4>Performance by Source</h4>${srcBars}</div>
        <div class="card"><h4>Activity Summary</h4><p class="pdim" style="font-size:12.5px">No activity data</p></div>
      </div>`;
  }

  /* ================= CLIENT PROFILE (the "epicenter") =================
     One unified account record — contacts + deals + offtake + activity in a
     single HubSpot-style screen. Opens on any customer-name click; reads the
     same live accessors so it's always in sync with every tab. */
  let PROFILE=null;              // account name currently open, or null (=tabs view)
  let PROFILE_TAB="activity";    // kept for state-machinery back-compat (unused by Bento)
  let PROFILE_FILTER="all";      // timeline channel filter: all | email | call | sms | note | task,meeting
  window.pipeOpenAccount = name => { PROFILE=canonAcct(name); PROFILE_TAB="activity"; PROFILE_FILTER="all"; remount(); };
  window.pipeCloseAccount = () => { PROFILE=null; remount(); };
  window.pipeProfileTab = t => { PROFILE_TAB=t; remount(); };
  window.pipeAcctFilter = f => { PROFILE_FILTER=f; remount(); };
  window.pipeAcctNoteSave = name => {
    const ta=document.getElementById("acctComposerInput"); if(!ta||!ta.value.trim()) return;
    addAcctNote(name, ta.value.trim()); remount();
  };
  window.pipeAcctActDelete = (name,i) => { delAcctActivity(name,i); remount(); };

  /* ---- the 6 comm modals — reuse the app's openModal() shell ---- */
  const CH_META = {
    email:  { label:"Email",   status:"sent" },
    call:   { label:"Call",    status:"logged" },
    sms:    { label:"SMS",     status:"sent" },
    note:   { label:"Note",    status:"logged" },
    task:   { label:"Task",    status:"scheduled" },
    meeting:{ label:"Meeting", status:"scheduled" },
  };
  /* The best number for an account: a mobile beats a desk line, and anything beats nothing. */
  function bestNumberFor(name){
    const cs=allContacts().filter(c=>norm(c.account||"")===norm(name));
    for(const c of cs){ const m=toE164(c.mobile); if(m) return { e164:m, who:c.name, kind:"mobile" }; }
    for(const c of cs){ const p=toE164(c.phone)||toE164(c.phoneE164); if(p) return { e164:p, who:c.name, kind:"phone" }; }
    return null;
  }

  /* ACTUALLY PLACE THE CALL, then log it.
   *
   * These buttons used to open a "Log Call" form and nothing else — a rep clicked Call, typed
   * what happened, and no call was ever placed. That is a logging tool wearing a dialer's
   * clothes, and it is worse than no button because it looks like it did something.
   *
   * It hands off with a tel: / sms: link rather than dialling through Allo, because Allo has no
   * API for it: /v2/api/calls, /messages and /sms all 404 and only /v2/api/crm/* exists. So the
   * honest thing is to hand the number to whatever the operator actually dials with — desk
   * phone, softphone, or the phone in their hand — and then log it. Probed 2026-08-31; if Allo
   * ever ships a dial endpoint this is the one function to change.
   *
   * The log form still opens, because a call nobody wrote up is a call the account forgets. */
  window.pipeAcctDial = (ch,name,explicit,who) => {
    /* A button on a contact card dials THAT person; the account action bar falls back to the
       best number on the account. Without the explicit argument every contact's Call button
       rang whoever happened to sort first, which is a worse bug than no button at all. */
    const best = explicit ? { e164:explicit, who:who||"", kind:"contact" } : bestNumberFor(name);
    if(!best){
      alert("No dialable number on this account. Add a phone or mobile to a contact first.");
      return;
    }
    /* Opened before the modal so the handoff is the click's direct result — a browser will
       block a tel: navigation that happens after an await or a re-render. */
    window.location.href = (ch==="sms"?"sms:":"tel:")+best.e164;
    pipeAcctComm(ch,name,best);
  };

  window.pipeAcctComm = (ch,name,dialed) => {
    const m=CH_META[ch]||CH_META.note;
    let body="";
    /* Prepended at openModal, not assigned here: every branch below reassigns `body`. */
    const dialHint = dialed
      ? `<div class="pcf-hint">Dialing <b>${esc(dialed.e164)}</b>${dialed.who?" &middot; "+esc(dialed.who):""}. Log what happened when you are done.</div>`
      : "";
    if(ch==="email")      body=F("acEmailSubj","Subject",null,1,"Subject line")+`<div class="pcf"><label>Body *</label><textarea class="pinput" id="acEmailBody" rows="4" placeholder="Write your message…"></textarea></div>`;
    else if(ch==="sms")   body=`<div class="pcf"><label>Message *</label><textarea class="pinput" id="acSmsBody" rows="3" placeholder="Type SMS message…"></textarea></div>`;
    else if(ch==="call")  body=F("acCallOut","Outcome",null,1,"e.g. Confirmed order, discussed timing")+F("acCallDur","Duration (min)",null,0,"e.g. 12","number");
    else if(ch==="note")  body=`<div class="pcf"><label>Note *</label><textarea class="pinput" id="acNoteBody" rows="3" placeholder="Write an internal note…"></textarea></div>`;
    else if(ch==="task")  body=F("acTaskTitle","Title",null,1,"Task title")+F("acTaskDue","Due Date",todayISO(),1,"","date");
    else if(ch==="meeting")body=F("acMeetTitle","Title",null,1,"Meeting title")+F("acMeetWhen","Date & Time",null,1,"","datetime-local");
    openModal("New "+m.label, dialHint+body, "Log "+m.label, `pipeAcctCommSave('${ch}')`, false);
  };
  window.pipeAcctCommSave = ch => {
    if(!PROFILE) return;
    const m=CH_META[ch]||CH_META.note;
    const who=(P.team[0]&&P.team[0].name)||"";
    let title="", body="";
    if(ch==="email"){ const s=V("acEmailSubj"), b=V("acEmailBody"); if(!s||!b){ alert("Subject and body are required."); return; } title=s; body=b; }
    else if(ch==="sms"){ const b=V("acSmsBody"); if(!b){ alert("A message is required."); return; } title="SMS"; body=b; }
    else if(ch==="call"){ const o=V("acCallOut"); if(!o){ alert("A call outcome is required."); return; } const d=V("acCallDur"); title="Outbound Call"+(d?` · ${d} min`:""); body="Outcome: "+o; }
    else if(ch==="note"){ const b=V("acNoteBody"); if(!b){ alert("A note is required."); return; } title="Internal Note"; body=b; }
    else if(ch==="task"){ const t=V("acTaskTitle"), d=V("acTaskDue"); if(!t||!d){ alert("Title and due date are required."); return; } title=t; body="Due: "+d; }
    else if(ch==="meeting"){ const t=V("acMeetTitle"), w=V("acMeetWhen"); if(!t||!w){ alert("Title and date/time are required."); return; } title=t; body="Scheduled: "+w.replace("T"," "); }
    addAcctActivity(PROFILE, { ch, who, title, body, status:m.status });
    pipeModalClose(); remount();
  };

  /* re-render just the section in place, preserving its .active state */
  function remount(){ const el=document.getElementById("sec-crm"); if(el){ el.innerHTML=sectionInner(); window.scrollTo(0,0); } }

  /* ---- inline icon sprite (single icon system, mirrors v3.html) ---- */
  const AV3_SPRITE = `<svg class="av3-defs" aria-hidden="true" focusable="false" style="position:absolute;width:0;height:0;overflow:hidden">
    <symbol id="i-email" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="5" width="18" height="14" rx="2"/><path d="m3 7 9 6 9-6"/></symbol>
    <symbol id="i-call" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><path d="M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L16 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2Z"/></symbol>
    <symbol id="i-sms" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><path d="M4 5h16a1 1 0 0 1 1 1v10a1 1 0 0 1-1 1H9l-4 4v-4H4a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1Z"/></symbol>
    <symbol id="i-note" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><path d="M14 3v5h5"/><path d="M14 3H6a1 1 0 0 0-1 1v16a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V8Z"/><path d="M8 13h8M8 17h5"/></symbol>
    <symbol id="i-task" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><path d="m4 12 5 5L20 6"/></symbol>
    <symbol id="i-meeting" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><rect x="4" y="5" width="16" height="16" rx="2"/><path d="M4 9h16M8 3v4M16 3v4"/></symbol>
    <symbol id="i-system" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"/><path d="M12 3v3M12 18v3M3 12h3M18 12h3M5.6 5.6l1.8 1.8M16.6 16.6l1.8 1.8M18.4 5.6l-1.8 1.8M7.4 16.6l-1.8 1.8"/></symbol>
  </svg>`;
  const ICON_ID = { email:"email", call:"call", sms:"sms", note:"note", task:"task", meeting:"meeting", system:"system" };
  const iconSvg = ch => `<svg aria-hidden="true"><use href="#i-${ICON_ID[ch]||"system"}"/></svg>`;
  const dayKey = iso => { const d=new Date(iso); return isNaN(d)?"":d.toLocaleDateString("en-US",{month:"short",day:"numeric",year:"numeric"}); };
  const timeStr = iso => { const d=new Date(iso); return isNaN(d)?"":d.toLocaleTimeString("en-US",{hour:"numeric",minute:"2-digit"}); };
  const STATUS_CLS = { sent:"sent", received:"received", logged:"logged", scheduled:"scheduled" };

  function renderProfile(name){
    const acct = liveAccounts().find(a=>norm(a.name)===norm(name)) || {name,type:"",industry:""};
    const deals = liveDeals().filter(d=>norm(d.customer)===norm(name));
    const contacts = allContacts().filter(c=>norm(c.account)===norm(name));
    const offs = offRowsAll().filter(r=>norm(r.customer)===norm(name));
    const safe = esc(name).replace(/'/g,"\\'");

    /* ---- derived metrics ---- */
    const openDeals = deals.filter(d=>d.status==="open");
    const wonDeals  = deals.filter(d=>d.status==="won");
    const lostDeals = deals.filter(d=>d.status==="lost");
    const closed    = wonDeals.length + lostDeals.length;
    const ltv       = sum(deals,value);
    const openPipe  = sum(openDeals,value);
    const weightedOpen = sum(openDeals,weighted);
    const wonRev    = sum(wonDeals,value);
    const winRate   = closed ? Math.round(wonDeals.length/closed*100)+"%" : "—";
    /* most-common deal owner */
    const ownerCount={}; deals.forEach(d=>{ if(d.owner) ownerCount[d.owner]=(ownerCount[d.owner]||0)+1; });
    const owner = Object.keys(ownerCount).sort((a,b)=>ownerCount[b]-ownerCount[a])[0] || "—";
    const products = [...new Set(deals.map(d=>d.product).filter(Boolean))];
    const primary = contacts[0];
    const drop = (contacts.find(c=>c.dropOff)||{}).dropOff || "";

    /* ---- tags: products + offtake ---- */
    const tags = products.map(p=>`<span class="tag">${esc(p)}</span>`)
      .concat(offs.length?[`<span class="tag crimson">Offtake pipeline</span>`]:[]).join("");

    /* =================== HEADER BENTO =================== */
    const header = `<div class="header-bento">
      <div class="tile identity-tile">
        <div class="avatar" aria-hidden="true">${esc(initials(name))}</div>
        <div class="identity-main">
          <h1>${esc(name)}</h1>
          <div class="identity-meta">
            <span>${esc((acct.type||"Account").replace(/^\w/,c=>c.toUpperCase()))}</span>
            ${acct.industry?`<span class="dot" aria-hidden="true"></span><span>${esc(acct.industry)}</span>`:""}
            <span class="dot" aria-hidden="true"></span><span>Owner: ${esc(owner)}</span>
          </div>
          ${tags?`<div class="tags">${tags}</div>`:""}
        </div>
      </div>
      <div class="tile metric-tile accent">
        <div class="lbl">Lifetime Value</div><div class="val">${money(ltv)}</div>
        <div class="sub">${deals.length} deal${deals.length===1?"":"s"} total</div>
      </div>
      <div class="tile metric-tile">
        <div class="lbl">Win Rate</div><div class="val">${winRate}</div>
        <div class="sub mute2">${wonDeals.length} of ${closed} closed won</div>
      </div>
      <div class="tile metric-tile">
        <div class="lbl">Active Deals</div><div class="val">${openDeals.length}</div>
        <div class="sub mute2">${money(openPipe)} open pipeline</div>
      </div>
    </div>`;

    /* =================== LEFT COLUMN =================== */
    const companyTile = `<div class="tile">
      <div class="tile-head"><h2>Company</h2></div>
      <div class="tile-body">
        ${(()=>{
          /* Status picker. Editable here because this is where someone forms the opinion that
             changes it: they have just read the activity feed and the research. The select
             shows the derived value when no override exists, so it is never blank and never
             lies about where the company stands. */
          const cur=statusOf(name), der=derivedStatus(name), over=statusOverrides()[norm(name)];
          return `<div class="kv-row"><span class="k">Status</span><span class="v">
            <select class="pinput stt-sel" onchange="pipeSetStatus('${esc(String(name).replace(/'/g,"\\'"))}',this.value)">
              ${Object.entries(STATUS).map(([k,s])=>`<option value="${k}"${k===cur?" selected":""}>${esc(s.label)}</option>`).join("")}
            </select>
            ${over?`<span class="pdim" style="margin-left:6px;font-size:11px" title="Derived from evidence: ${esc((STATUS[der]||{}).label||"")}">set manually</span>`:""}
          </span></div>`;
        })()}
        ${(()=>{
          /* The roster research. This is the whole reason the company is on the list, so it
             belongs on the profile rather than only in a CSV nobody opens. Rendered only for
             companies that came from the roster; deals-only accounts skip it cleanly. */
          const r = acct.r || rosterOf(name);
          if(!r) return "";
          const row=(k,v,cls)=>v?`<div class="kv-row"><span class="k">${esc(k)}</span><span class="v ${cls||""}">${v}</span></div>`:"";
          return row("Product line", r.dead?`<span class="stt stt-dq">Disqualified</span>`
                     :`<span class="co-line ${r.line==="Biochar"?"ln-bio":"ln-abs"}">${esc(r.line)}</span>`)
            + row("ICP", r.icp?`<b>${esc(r.icp)}</b>${r.icpLabel?` · ${esc(r.icpLabel)}`:""}`:"")
            + row("Location", esc([r.city,r.state].filter(Boolean).join(", ")))
            + row("Freight", r.driveMi!=null?`<span class="geo ${geoCls(r.geo)}">${num(r.driveMi)} mi drive</span>${r.crowMi!=null?` <span class="pdim">(${num(r.crowMi)} mi direct)</span>`:""}`:"")
            + row("Fit score", r.score!=null?`<span class="sc ${scoreCls(r.score)}">${r.score}</span> <span class="pdim">of 10</span>`:"")
            + row("Segment", esc(r.segment))
            + row("Likely titles", r.titles&&!/^n\/a/i.test(r.titles)?esc(r.titles):"")
            + row("Trigger", r.trigger&&r.trigger!=="-"?esc(r.trigger):"")
            + row("Source", r.sourceUrl?`<a href="${esc(r.sourceUrl)}" target="_blank" rel="noopener">${esc(r.sourceUrl.replace(/^https?:\/\//,"").slice(0,44))}</a>`:"")
            + row("Added in", esc(r.iter));
        })()}
        <div class="kv-row"><span class="k">Type</span><span class="v"><span class="status-pill prospect">${esc((acct.type||"—").replace(/^\w/,c=>c.toUpperCase()))}</span></span></div>
        <div class="kv-row"><span class="k">Industry</span><span class="v">${esc(acct.industry||"—")}</span></div>
        <div class="kv-row"><span class="k">Account Owner</span><span class="v">${esc(owner)}</span></div>
        ${acct.website?`<div class="kv-row"><span class="k">Website</span><span class="v">${esc(acct.website)}</span></div>`:""}
        ${acct.region?`<div class="kv-row"><span class="k">Region</span><span class="v">${esc(acct.region)}</span></div>`:""}
        ${drop?`<div class="kv-row"><span class="k">Drop-off</span><span class="v">${esc(drop)}</span></div>`:""}
        ${(()=>{ const al=aliasesOf(acct.name||name); return al.length
          ? `<div class="kv-row"><span class="k">Also known as</span><span class="v" title="These spellings were folded into this account. If any of them is a DIFFERENT company, its deals and contacts are on the wrong profile.">${al.map(a=>esc(a)).join(", ")}</span></div>`
          : ""; })()}
      </div>
    </div>`;

    const contactCard = c => `<div class="contact-card">
      <div class="c-avatar${c===primary?"":" sec"}" aria-hidden="true">${esc(initials(c.name))}</div>
      <div class="c-info">
        <div class="c-name">${esc(c.name)}</div>
        <div class="c-title">${esc(c.title||"Contact")}${c===primary?" · Primary":""}</div>
        ${c.email?`<span class="c-detail">${esc(c.email)}</span>`:""}
        ${c.phone?`<span class="c-detail mono">${esc(c.phone)}</span>`:""}
      </div>
      <div class="c-actions">
        <button type="button" class="icon-btn" aria-label="Email ${esc(c.name)}" onclick="pipeAcctComm('email','${safe}')">${iconSvg("email")}</button>
        <button type="button" class="icon-btn" aria-label="Call ${esc(c.name)}" onclick="pipeAcctDial('call','${safe}','${esc(toE164(c.mobile)||toE164(c.phone)||toE164(c.phoneE164))}','${esc(c.name||"")}')">${iconSvg("call")}</button>
        <button type="button" class="icon-btn" aria-label="SMS ${esc(c.name)}" onclick="pipeAcctDial('sms','${safe}','${esc(toE164(c.mobile)||toE164(c.phone)||toE164(c.phoneE164))}','${esc(c.name||"")}')">${iconSvg("sms")}</button>
      </div>
    </div>`;
    /* Roster-sourced reachability: the phone, email and named people the research pass found,
       which are NOT CRM contact records and would otherwise be invisible on the profile. Shown
       as a distinct block because their provenance differs: these are desk-researched and
       unverified, and a rep should know that before dialling. Free-tier Apollo output carries
       names and titles only, never a revealed email or phone, so the two never mix. */
    const rosterReach = (()=>{
      const r = acct.r || rosterOf(name);
      if(!r) return "";
      const phones=r.phones||[], emails=r.emails||[], people=r.people||[];
      if(!phones.length && !emails.length && !people.length) return "";
      return `<div class="rr-box">
        <div class="rr-head">From research <span title="Desk-researched from public sources, not verified by a call or an enrichment tool.">unverified</span></div>
        ${phones.length?`<div class="rr-row"><span class="rr-k">Phone</span><span class="rr-v">${phones.map(p=>`<a href="tel:${esc(p.replace(/[^\d+]/g,""))}">${esc(p)}</a>`).join(", ")}</span></div>`:""}
        ${emails.length?`<div class="rr-row"><span class="rr-k">Email</span><span class="rr-v">${emails.map(e=>`<a href="mailto:${esc(e)}">${esc(e)}</a>`).join(", ")}</span></div>`:""}
        ${people.length?`<div class="rr-row"><span class="rr-k">People</span><span class="rr-v">${people.map(pp=>`${esc(pp.name)}${pp.title?` <span class="pdim">${esc(pp.title)}</span>`:""}`).join("<br>")}</span></div>`:""}
        ${r.titles&&!/^n\/a/i.test(r.titles)&&!people.length?`<div class="rr-row"><span class="rr-k">Target titles</span><span class="rr-v">${esc(r.titles)}</span></div>`:""}
      </div>`;
    })();

    /* The enrichment join: every Apollo-revealed address for this company with its
       Instantly verdict. This is the block a rep works from, so it leads the tile. */
    const enrichedBox = (()=>{
      const r = acct.r || rosterOf(name);
      const list = (r && r.contacts) || [];
      if(!list.length) return "";
      const chipFor = s => s==="verified" ? `<span class="vfy vfy-ok" title="Instantly-verified deliverable">verified</span>`
        : s==="invalid" ? `<span class="vfy vfy-dead" title="Bounced verification — do not send; kept so nobody re-buys it">invalid</span>`
        : s==="pending" ? `<span class="vfy vfy-part" title="Verification still pending">pending</span>`
        : `<span class="vfy vfy-no" title="Never put through verification">unchecked</span>`;
      return `<div class="rr-box">
        <div class="rr-head">Enriched contacts <span title="Apollo-revealed addresses joined by domain, with their Instantly verification verdicts.">${list.length}</span></div>
        ${list.map(x=>`<div class="rr-row"><span class="rr-k">${esc(x.n||"—")}</span><span class="rr-v">${x.t?`<span class="pdim">${esc(x.t)}</span><br>`:""}<a href="mailto:${esc(x.e)}">${esc(x.e)}</a> ${chipFor(x.s)}</span></div>`).join("")}
      </div>`;
    })();
    const contactsTile = `<div class="tile">
      <div class="tile-head"><h2>Contacts</h2> <span class="count">${((acct.r||rosterOf(name)||{}).contacts||[]).length + contacts.length}</span></div>
      <div class="tile-body">${enrichedBox}${rosterReach}${contacts.length?contacts.map(contactCard).join(""):enrichedBox?"":`<div class="av3-empty">No contacts on file. <a class="acct-link" onclick="pipeContactModal()">Add one →</a></div>`}</div>
    </div>`;

    /* The written research, as prose rather than table cells. Someone about to dial this
       company needs "what do they do" and "why do we think they buy" in readable form; the
       score is worthless without the sentence that justifies it. For a disqualified company
       the kill reason is the ONLY thing that matters, so it leads and is styled as a warning:
       the whole point of keeping dead rows is that nobody re-researches them. */
    const researchTile = (()=>{
      const r = acct.r || rosterOf(name);
      if(!r) return "";
      const blk=(h,b,cls)=>b?`<div class="rs-blk ${cls||""}"><h4>${esc(h)}</h4><p>${esc(b)}</p></div>`:"";
      return `<div class="tile">
        <div class="tile-head"><h2>Research</h2>${r.score!=null?`<span class="count">score ${r.score}</span>`:""}</div>
        <div class="tile-body rs-body">
          ${r.dead?`<div class="note warn" style="margin:0 0 10px"><b>Disqualified during research.</b> Do not re-prospect without a reason to reopen.</div>`:""}
          ${blk(r.dead?"Why it was killed":"Why they fit", r.dead?(r.scoreWhy||r.why):r.why, r.dead?"rs-dead":"rs-why")}
          ${blk("What they do", r.what)}
          ${r.dead?"":blk("How the score was reached", r.scoreWhy,"rs-score")}
          ${!r.what&&!r.why&&!r.scoreWhy?`<span class="av3-empty">No research recorded.</span>`:""}
        </div>
      </div>`;
    })();

    const attrTile = `<div class="tile">
      <div class="tile-head"><h2>Attributes</h2></div>
      <div class="tile-body">
        <div class="attr-list">
          ${products.map(p=>`<span class="tag">${esc(p)}</span>`).join("")}
          ${offs.length?`<span class="tag">Offtake: ${esc([...new Set(offs.map(r=>r.product))].join(", "))}</span>`:""}
          ${products.length||offs.length?"":`<span class="av3-empty">No attributes yet.</span>`}
        </div>
      </div>
    </div>`;

    /* read-only HubSpot communications timeline (hubspot-comms.js), matched by norm name */
    const hubComms = (()=>{ const H=window.HUBSPOT_COMMS; if(!H) return ""; if(H[name]) return H[name];
      const k=Object.keys(H).find(k=>norm(k)===norm(name)); return k?H[k]:""; })();
    const hubTile = hubComms ? `<div class="tile">
      <div class="tile-head"><h2>HubSpot Communications</h2> <span class="count">synced 07/22</span></div>
      <div class="tile-body"><div style="max-height:340px;overflow:auto;font-size:12px;line-height:1.55;white-space:normal">${esc(hubComms).replace(/===ACT===/g,'<hr style="border:none;border-top:1px solid var(--line,#334);margin:8px 0">').replace(/\n/g,"<br>")}</div></div>
    </div>` : "";

    /* Contacts lead the profile: who to reach and how is the first thing a rep needs. */
    const left = `<section class="stack" aria-label="Company &amp; Contacts">${contactsTile}${companyTile}${researchTile}${hubTile}${attrTile}</section>`;

    /* =================== MIDDLE COLUMN =================== */
    const actionBar = `<div class="actionbar">
      ${["email","call","sms","note","task","meeting"].map(ch=>`<button type="button" class="action-tile" data-ch="${ch}" onclick="${ch==="call"||ch==="sms"?"pipeAcctDial":"pipeAcctComm"}('${ch}','${safe}')">
        <div class="aico">${iconSvg(ch)}</div><div class="alabel">${esc(CH_META[ch].label)}</div></button>`).join("")}
    </div>`;

    /* timeline: stored activities (deletable) + derived events */
    const stored = acctActivities(name).map((a,i)=>({...a,_idx:i}));
    const derived = [];
    wonDeals.forEach(d=>derived.push({ ch:"system", who:"System", title:"Deal Won",
      body:`${d.deal} (${money(value(d))}) marked ${stageOf(d.stage).label}`, status:"logged", ts:safeISO(d) }));
    deals.filter(d=>d.notes).forEach(d=>derived.push({ ch:"note", who:d.owner||"", title:"Deal Note — "+d.deal,
      body:d.notes, status:"logged", ts:safeISO(d) }));
    /* Calls, texts and AI summaries from the phone system, matched to this account by the
       numbers on its contacts. These had been landing in D1 since 2026-08-19 with no way to
       reach a screen — an account could have been called twice and its timeline showed only
       what somebody typed by hand. */
    phoneActivityFor(name).forEach(r=>derived.push(phoneToActivity(r)));
    /* Instantly mail, including the replies that until now lived only in Instantly's own inbox
       — the one system meant to be the book of business was the one place the correspondence
       was not. */
    mailFor(name).forEach(r=>derived.push(mailToActivity(r)));
    const all = stored.concat(derived).sort((a,b)=>new Date(b.ts)-new Date(a.ts));
    const filterSet = PROFILE_FILTER==="all" ? null : PROFILE_FILTER.split(",");
    const shown = filterSet ? all.filter(a=>filterSet.includes(a.ch)) : all;

    let tl="", lastDay=null;
    if(!shown.length){ tl = `<div class="timeline-empty">No activity in this channel.</div>`; }
    else shown.forEach(a=>{
      const dk=dayKey(a.ts);
      if(dk!==lastDay){ tl+=`<div class="date-sep"><span>${esc(dk)}</span></div>`; lastDay=dk; }
      const st=a.status?`&middot; <span class="badge ${STATUS_CLS[a.status]||""}">${esc(a.status)}</span>`:"";
      const del=a._idx!=null?`<button type="button" class="av3-del" title="Delete" aria-label="Delete activity" onclick="pipeAcctActDelete('${safe}',${a._idx})">🗑</button>`:"";
      tl+=`<div class="item" data-ch="${esc(a.ch)}">
        <div class="ico">${iconSvg(a.ch)}</div>
        <div class="bubble">
          <div class="b-head"><span class="b-title">${esc(a.title||"")}</span><span class="b-time">${esc(timeStr(a.ts))}${del}</span></div>
          <div class="b-meta">${esc(a.who||"")} ${st}</div>
          <div class="b-body">${esc(a.body||"").replace(/\n/g,"<br>")}</div>
        </div>
      </div>`;
    });

    const chips = [["all","All"],["email","Emails"],["call","Calls"],["sms","SMS"],["note","Notes"],["task,meeting","Tasks/Meetings"]]
      .map(([f,l])=>`<button type="button" class="chip" data-filter="${f}" aria-pressed="${PROFILE_FILTER===f}" onclick="pipeAcctFilter('${f}')">${esc(l)}</button>`).join("");

    const threadTop = `<div class="thread-top">
      <div class="who">
        <div class="c-avatar" aria-hidden="true">${esc(primary?initials(primary.name):initials(name))}</div>
        <div><h2>${esc(primary?primary.name:name)}</h2><small>${esc(primary?(primary.title||"Primary contact"):"Account")} · ${esc(name)}</small></div>
      </div>
      <span class="tag">${all.length} activit${all.length===1?"y":"ies"}</span>
    </div>`;
    const composer = `<div class="composer"><div class="composer-bar">
      <input type="text" id="acctComposerInput" placeholder="Log a quick note or update…" onkeydown="if(event.key==='Enter')pipeAcctNoteSave('${safe}')">
      <button type="button" class="btn primary" onclick="pipeAcctNoteSave('${safe}')">Log</button>
    </div></div>`;

    const middle = `<section class="main-grid-middle" aria-label="Activity">
      ${actionBar}
      <div class="thread-tile">
        ${threadTop}
        ${composer}
        <div class="filters" role="group" aria-label="Filter activity">${chips}</div>
        <div class="timeline" aria-live="polite">${tl}</div>
      </div>
    </section>`;

    /* =================== RIGHT COLUMN — analytics =================== */
    const kpis = `
      <div class="tile kpi-tile"><div class="lbl">Open Pipeline</div><div class="val">${money(openPipe)}</div></div>
      <div class="tile kpi-tile"><div class="lbl">Weighted</div><div class="val crimson">${money(weightedOpen)}</div></div>
      <div class="tile kpi-tile"><div class="lbl">Won Revenue</div><div class="val success">${money(wonRev)}</div></div>
      <div class="tile kpi-tile"><div class="lbl">Win Rate</div><div class="val success">${winRate}</div></div>`;

    /* stage funnel */
    const stageAgg = P.stages.map(s=>{ const g=deals.filter(d=>d.stage===s.k); return {label:s.label, cls:s.k==="won_fulfillment"?"won":"", val:sum(g,value), count:g.length}; });
    const funMax = Math.max(...stageAgg.map(s=>s.val),1);
    const funnel = `<div class="tile chart-tile span2"><h3>Stage Funnel</h3>
      <div class="funnel"><div class="funnel-scale" aria-hidden="true"></div>
      ${stageAgg.map(s=>{ const empty=s.val===0; const w=empty?6:Math.max(Math.round(s.val/funMax*100),3);
        return `<div class="funnel-row"><div class="funnel-label">${esc(s.label)}</div>
          <div class="funnel-bar ${empty?"empty":s.cls}" style="width:${w}%">${empty?"—":money(s.val)}</div>
          <div class="funnel-count">${s.count||""}</div></div>`; }).join("")}
      </div></div>`;

    /* revenue by month */
    const monthMap=new Map();
    deals.forEach(d=>{ const t=closeDate(d); const k=t.getUTCFullYear()+"-"+String(t.getUTCMonth()+1).padStart(2,"0");
      const m=monthMap.get(k)||{k, label:t.toLocaleDateString("en-US",{month:"short",timeZone:"UTC"}), val:0, won:0};
      m.val+=value(d); if(d.status==="won") m.won+=value(d); monthMap.set(k,m); });
    const months=[...monthMap.values()].sort((a,b)=>a.k<b.k?-1:1);
    const barMax=Math.max(...months.map(m=>m.val),1);
    const bars = `<div class="tile chart-tile span2"><h3>Revenue by Month</h3>
      <div class="barchart">${months.length?months.map(m=>{ const h=Math.max(Math.round(m.val/barMax*100),4);
        return `<div class="bar-col"><div class="bar-val">${kfmt(m.val)}</div><div class="bar-fill ${m.won>=m.val/2&&m.won>0?"won":""}" style="height:${h}%"></div><div class="bar-lbl">${esc(m.label)}</div></div>`;
      }).join(""):`<div class="av3-empty">No dated deals.</div>`}</div></div>`;

    /* product split donut */
    const prodVals=products.map(p=>({p, v:sum(deals.filter(d=>d.product===p),value), n:deals.filter(d=>d.product===p).length})).filter(x=>x.v>0).sort((a,b)=>b.v-a.v);
    const prodTot=sum(prodVals,x=>x.v)||1;
    let accP=0; const segs=prodVals.map(x=>{ const p=x.v/prodTot*100; const seg=`${colorFor(products,x.p)} ${accP}% ${accP+p}%`; accP+=p; return seg; });
    const topShare=prodVals[0]?Math.round(prodVals[0].v/prodTot*100):0;
    const donut = `<div class="tile chart-tile span2"><h3>Product Split</h3>
      ${prodVals.length?`<div class="donut-wrap">
        <div class="donut" style="background:conic-gradient(${segs.join(",")})"><div class="donut-center"><span class="n">${topShare}%</span><span class="t">${esc(prodVals[0].p)}</span></div></div>
        <div class="legend">${prodVals.map(x=>`<div class="legend-item"><span class="legend-dot" style="background:${colorFor(products,x.p)}" aria-hidden="true"></span><span class="lname">${esc(x.p)} · ${x.n} deal${x.n===1?"":"s"}</span><span class="lval">${money(x.v)}</span></div>`).join("")}</div>
      </div>`:`<div class="av3-empty">No product revenue.</div>`}</div>`;

    /* deal list */
    const dealList = `<div class="tile chart-tile span2"><h3>Deal List</h3>
      <div class="deal-list">${deals.length?[...deals].sort((a,b)=>closeDate(b)-closeDate(a)).map(d=>`<div class="deal-row">
        <div class="deal-main"><div class="deal-name">${esc(d.deal)}</div><div class="deal-sub">${esc(d.product)} · ${num(d.qty)} ${esc(d.uom)} · ${esc(d.owner||"")}</div>${stBadge(d,false)}</div>
        <div class="deal-right"><div class="deal-val">${money(value(d))}</div></div></div>`).join(""):`<div class="av3-empty">No deals yet. <a class="acct-link" onclick="pipeDealModal(null,{customer:'${safe}'})">Add the first deal →</a></div>`}</div></div>`;

    const right = `<section class="analytics-grid" aria-label="Analytics">${kpis}${funnel}${bars}${donut}${dealList}</section>`;

    /* =================== ASSEMBLE =================== */
    return `<div class="av3">${AV3_SPRITE}
      <div class="topbar">
        <nav class="crumbs" aria-label="Breadcrumb"><span class="acct-link" onclick="pipeCloseAccount()">Sales Pipeline</span> / <b>${esc(name)}</b></nav>
        <div class="topbar-actions">
          <button type="button" class="btn" onclick="pipeContactModal()">+ Contact</button>
          <button type="button" class="btn primary" onclick="pipeDealModal(null,{customer:'${safe}'})">+ New Deal</button>
        </div>
      </div>
      ${header}
      <div class="main-grid">${left}${middle}${right}</div>
    </div>`;
  }

  /* ================= SECTION ================= */
  function sectionInner(){
    if(PROFILE) return renderProfile(PROFILE);
    const at=activeTab();
    const panes=[["pipeline",tPipeline],["deals",tDeals],["people",tContacts],["offtake",tOfftake],["production",tProduction],["exec",tExec],["reports",tReports]];
    /* The deal book's provenance, stated where the KPIs are read. Companies, contacts and
       ICPs on this page come off the live roster join, but every DEAL number (pipeline,
       weighted, confirmed revenue, win rate) is computed from the SIBRA snapshot plus
       local adds — without the date a four-week-old book reads as today's. */
    const snapNote = P.snapshot
      ? `<div class="note" style="margin:6px 0 12px;font-size:12.5px"><b>Deal data as of ${esc(P.snapshot)}</b> — the SIBRA snapshot plus anything added here. Accounts, contacts and ICP columns read the live roster. Refreshing the deal book needs an operator login to SIBRA (/api/crm/*).</div>`
      : "";
    return `<h1 class="pipe-h">Sales Pipeline</h1>
      ${snapNote}
      <div class="pipe-tabs">${TABS.map(([id,t])=>`<span class="pill${id===at?" active":""}" data-tab="${id}" onclick="pipeTab('${id}')">${t}</span>`).join("")}</div>
      ${panes.map(([id,fn])=>`<div class="pipe-pane${id===at?" active":""}" data-tab="${id}">${fn()}</div>`).join("")}`;
  }
  /* The strip that replaced the Launchpad. Six numbers, and only the three that represent WORK
     carry the accent rail: replies waiting, missed calls, leads to ring. The other three are
     context. The old Launchpad put fourteen tiles on screen with no way to tell which of them
     you were supposed to do something about, which is the reason it read as fluff. */
  /* ---- period filter ----
     Applies to the DEAL numbers only, by close date. It deliberately does not touch the three
     inbound counts: a missed call from last quarter is not less unanswered because the quarter
     ended, and filtering the work queue by period would hide exactly the oldest thing that
     most needs picking up. */
  const PERIOD_KEY="vej_pipe_period";
  const PERIODS=[["all","All time"],["month","This month"],["quarter","This quarter"],["year","This year"]];
  const period=()=>{ const p=lsGet(PERIOD_KEY,"all"); return PERIODS.some(x=>x[0]===p)?p:"all"; };
  window.pipePeriod=p=>{ lsSet(PERIOD_KEY,p); rr(); };

  function inPeriod(d){
    const p=period(); if(p==="all") return true;
    const t=closeDate(d); if(!t||isNaN(t)) return false;
    const now=new Date();
    if(p==="year")    return t.getUTCFullYear()===now.getUTCFullYear();
    if(p==="month")   return t.getUTCFullYear()===now.getUTCFullYear() && t.getUTCMonth()===now.getUTCMonth();
    if(p==="quarter") return t.getUTCFullYear()===now.getUTCFullYear()
                          && Math.floor(t.getUTCMonth()/3)===Math.floor(now.getUTCMonth()/3);
    return true;
  }

  /* Every tile goes somewhere. A number you cannot act on is decoration, and the old Launchpad
     was fourteen of them. The three inbound tiles open the Inbox already filtered to the thing
     they counted, so the click lands on the work rather than near it. */
  window.pipeGoInbox=f=>{
    INBOX_FILTER=f;
    if(typeof go==="function") go("inbox");
    remountInbox();
  };
  window.pipeGoTab=t=>{
    lsSet(TAB_KEY,t);
    if(typeof go==="function") go("crm");
    rr();
  };

  function rStrip(){
    const d=liveDeals().filter(x=>x.status==="open"&&inPeriod(x));
    const read=readSet();
    const items=inboxItems();
    const cell=(l,v,onclick,hot)=>`<button type="button" class="pstrip-cell${hot?" hot":""}" onclick="${onclick}">
      <div class="ps-l">${esc(l)}</div><div class="ps-v">${v}</div></button>`;
    const pills=PERIODS.map(([k,label])=>
      `<button type="button" class="pv-btn${period()===k?" active":""}" onclick="pipePeriod('${k}')">${esc(label)}</button>`).join("");

    return `<div class="pstrip-bar">
        <div class="pview">${pills}</div>
        <span class="pstrip-note">Deal figures only. The three inbound counts ignore the period, because an old missed call is not less unanswered.</span>
      </div>
      <div class="pstrip">
      ${cell("Open pipeline",money(sum(d,value)),"pipeGoTab('pipeline')")}
      ${cell("Open deals",num(d.length),"pipeGoTab('deals')")}
      ${cell("Contacts",num(allContacts().length),"pipeGoTab('people')")}
      ${cell("Replies waiting",num(items.filter(i=>i.type==="reply"&&!read.has(i.sig)).length),"pipeGoInbox('reply')",true)}
      ${cell("Missed calls",num(items.filter(i=>i.type==="missed"&&!read.has(i.sig)).length),"pipeGoInbox('missed')",true)}
      ${cell("Leads to ring",num(items.filter(i=>i.type==="lead").length),"pipeGoInbox('lead')",true)}
    </div>`;
  }

  function rCRM(){ return `<section class="section" id="sec-crm">${rStrip()}${sectionInner()}</section>`; }

  /* Live counts for the Launchpad. Exposed as a function, not a snapshot, so the numbers are
     computed at render time from whatever is actually loaded. This is the whole reason the
     Launchpad can state a roster size at all: the previous version of that page hardcoded
     "150-200 accounts" and was wrong the moment the roster changed. Nothing here is a target
     or a plan, only what is currently in the system. */
  function stats(){
    const accts = liveAccounts();
    const cons  = allContacts();
    const deals = liveDeals();
    const open  = deals.filter(d=>d.status==="open");
    const withEmail = cons.filter(c=>c.email && /@/.test(c.email));
    return {
      accounts:      accts.length,
      accountsHs:    accts.filter(a=>a.hubspot).length,
      accountsDerived: accts.filter(a=>a.derived).length,
      contacts:      cons.length,
      contactsEmail: withEmail.length,
      contactsNamed: cons.filter(c=>String(c.name||"").trim()).length,
      deals:         deals.length,
      dealsOpen:     open.length,
      openValue:     sum(open,value),
      hsSynced:      (window.HUBSPOT && window.HUBSPOT.synced) || "",
      /* Aliases folded by norm(). Surfaced here so a bad merge is visible from the Launchpad
         and not only from the profile of the account it damaged. */
      merged: Object.entries(ACCT_ALIASES).filter(([,v])=>v.length>1).map(([,v])=>v),
    };
  }

  /* `sync` is exposed so the Launchpad and the e2e test can drive a refresh without reloading,
     and so a rep who watched a save fail can retry it deliberately rather than by guessing. */

  /* ================= INBOX =================
     One feed for everything that came IN: missed calls, texts, Instantly replies, policy flags
     and leads the phone created. Until now each of those lived in a different place and three
     of them lived nowhere a rep would look.

     It invents no data. /api/activity, /api/email and /api/lead already return all of it; this
     merges them on one timeline and gives each row the single action it deserves. */
  const READ_KEY="vej_inbox_read_v1";
  const readSet=()=>new Set(lsGet(READ_KEY,[]));
  window.pipeInboxRead=sig=>{ const r=readSet(); r.add(sig); lsSet(READ_KEY,[...r]); remountInbox(); };
  window.pipeInboxReadAll=()=>{ lsSet(READ_KEY,inboxItems().map(i=>i.sig)); remountInbox(); };
  let INBOX_FILTER="all";
  window.pipeInboxFilter=f=>{ INBOX_FILTER=f; remountInbox(); };
  function remountInbox(){ const el=document.getElementById("sec-inbox"); if(el) el.innerHTML=rInbox(); }

  /* The account a number or a domain belongs to, or null. Reuses the same matching the account
     timeline uses, so a row in the Inbox and the same event on the account agree. */
  function acctForNumber(k){
    if(!k) return null;
    const c=allContacts().find(c=>phoneKey(c.phone)===k||phoneKey(c.mobile)===k||phoneKey(c.phoneE164)===k);
    return c?canonAcct(c.account):null;
  }
  function acctForDomain(d){
    if(!d) return null;
    const hit=liveAccounts().find(a=>{
      const h=String(a.website||a.domain||"").replace(/^https?:\/\//,"").replace(/^www\./,"").split("/")[0].toLowerCase();
      return h&&h===d;
    });
    if(hit) return hit.name;
    const c=allContacts().find(c=>String(c.email||"").toLowerCase().endsWith("@"+d));
    return c?canonAcct(c.account):null;
  }

  function inboxItems(){
    const out=[];
    const MISSED=/VOICEMAIL|NO_ANSWER|MISSED|FAILED|TRANSFERRED_AI/i;

    PHONE.rows.forEach(r=>{
      const acct=acctForNumber(r.key);
      const sig=`p|${r.at}|${r.kind}|${r.key}`;
      if(r.policyFlag){
        out.push({ sig, type:"flag", at:r.at, title:"Policy flag \u2014 "+r.policyFlag,
          who:r.who||r.number, acct, body:r.summary||"Review the recording before the prospect acts on it.",
          action:"Review call", href:acct });
        return;
      }
      if(r.kind==="call"&&r.result&&MISSED.test(r.result)){
        out.push({ sig, type:"missed", at:r.at, title:"Missed call \u2014 "+r.result.toLowerCase().replace(/_/g," "),
          who:r.who||r.number, acct, body:r.summary||"No summary recorded.", action:"Call back", tel:r.number, href:acct });
        return;
      }
      if(r.kind==="sms"&&r.direction==="INBOUND"){
        out.push({ sig, type:"text", at:r.at, title:"Text received", who:r.who||r.number, acct,
          body:r.summary||"", action:"Reply", tel:r.number, href:acct });
      }
    });

    MAIL.rows.filter(r=>r.isReply).forEach(r=>{
      const acct=acctForDomain(r.key);
      out.push({ sig:`m|${r.at}|${r.threadId||r.subject}`, type:"reply", at:r.at,
        title:"Reply \u2014 "+r.subject, who:r.from, acct, body:r.body||"",
        /* Replying is the point of a reply landing here. The two handles the Instantly reply
           endpoint needs ride along so the composer needs no second lookup. */
        action:"Reply", replyTo:r.id, eaccount:r.eaccount, subject:r.subject, href:acct });
    });

    /* Only leads nobody has claimed. A claimed lead is somebody's work in progress, not an
       unread item, and leaving it here would mean the Inbox never empties. */
    PHONE_LEADS.filter(l=>!l.claimed).forEach(l=>{
      if(acctForNumber(phoneKey(l.phoneE164))) return;   // already a known contact
      out.push({ sig:`l|${l.phoneE164}`, type:"lead", at:l.last_seen, title:"New lead from the phone",
        who:l.name||l.phoneE164, acct:null,
        body:l.last_summary||`${l.call_count} call${l.call_count===1?"":"s"}, ${l.sms_count} text${l.sms_count===1?"":"s"}.`,
        action:"Claim lead", lead:l.phoneE164, tel:l.phoneE164 });
    });

    return out.filter(i=>i.at).sort((a,b)=>new Date(b.at)-new Date(a.at));
  }

  const INBOX_META={
    missed:{ label:"Missed calls", rail:"var(--accent)", bg:"#fdeaef", fg:"#b91237", ic:"call" },
    text:  { label:"Texts",        rail:"var(--line-2)", bg:"var(--paper-2)", fg:"var(--text-dim)", ic:"sms" },
    reply: { label:"Replies",      rail:"var(--accent)", bg:"#eef2f9", fg:"#24478a", ic:"email" },
    flag:  { label:"Policy flags", rail:"var(--gold)",   bg:"#fbf4e6", fg:"#8a6412", ic:"system" },
    lead:  { label:"New leads",    rail:"var(--accent)", bg:"#f0f7ee", fg:"#3f5f3c", ic:"task" },
  };

  function rInbox(){
    const items=inboxItems();
    const read=readSet();
    const unread=items.filter(i=>!read.has(i.sig));
    const shown=INBOX_FILTER==="all"?items:items.filter(i=>i.type===INBOX_FILTER);

    if(PHONE.ok===false&&MAIL.ok===false){
      return `<div class="ibx-empty">The phone system and Instantly are both unreachable right now. Nothing is lost; this fills in when they answer.</div>`;
    }

    const chip=(f,label,n,hot)=>`<button type="button" class="ibx-chip${INBOX_FILTER===f?" on":""}" onclick="pipeInboxFilter('${f}')">${esc(label)} <b class="${hot&&n?"hot":""}">${n}</b></button>`;
    const chips=[chip("all","All",items.length,false)]
      .concat(Object.entries(INBOX_META).map(([k,m])=>
        chip(k,m.label,items.filter(i=>i.type===k).length,k!=="text")));

    let body="", lastDay=null;
    if(!shown.length) body=`<div class="ibx-empty">Nothing here.</div>`;
    else shown.forEach(i=>{
      const dk=dayKey(i.at);
      if(dk!==lastDay){ body+=`<div class="ibx-day">${esc(dk)}</div>`; lastDay=dk; }
      const m=INBOX_META[i.type]||INBOX_META.text;
      const isNew=!read.has(i.sig);
      const act = i.replyTo ? `<button type="button" class="btn btn-accent ibx-act" onclick="pipeReplyModal('${esc(i.sig)}')">Reply</button>`
        : i.lead ? `<button type="button" class="btn btn-primary ibx-act" onclick="pipeLeadClaim('${esc(i.lead)}')">${esc(i.action)}</button>`
        : i.tel ? `<a class="btn btn-accent ibx-act" href="${i.type==="text"?"sms":"tel"}:${esc(i.tel)}">${esc(i.action)}</a>`
        : i.href ? `<button type="button" class="btn btn-primary ibx-act" onclick="pipeOpenAccount('${esc(i.href).replace(/'/g,"\\'")}')">${esc(i.action)}</button>`
        : "";
      /* The whole row opens the account, not just the link in it. A feed where only one small
         word is clickable makes people hunt for the target; the action button stops the click
         from bubbling so Reply and Call back still do their own thing. */
      const open=i.acct?` onclick="pipeOpenAccount('${esc(i.acct).replace(/'/g,"\\'")}')" style="--rail:${m.rail};cursor:pointer"`:` style="--rail:${m.rail}"`;
      body+=`<div class="ibx-row${isNew?" new":""}"${open}>
        <div class="ibx-ico" style="background:${m.bg};color:${m.fg}">${iconSvg(m.ic)}</div>
        <div class="ibx-main">
          <div class="ibx-head">
            <span class="ibx-title">${esc(i.title)}</span>
            ${i.acct?`<a class="acct-link" onclick="pipeOpenAccount('${esc(i.acct).replace(/'/g,"\\'")}')">${esc(i.acct)}</a>`
                    :`<span class="ibx-who">${esc(i.who||"")}</span>`}
          </div>
          <p class="ibx-body">${esc(String(i.body||"").slice(0,260))}</p>
        </div>
        <div class="ibx-side" onclick="event.stopPropagation()">
          <span class="ibx-time">${esc(timeStr(i.at))}</span>
          ${act}
          ${isNew?`<button type="button" class="ibx-dismiss" onclick="pipeInboxRead('${esc(i.sig)}')" title="Mark read">Mark read</button>`:""}
        </div>
      </div>`;
    });

    /* The icon sprite has to be in the DOM for <use href="#i-call"> to resolve. It used to be
       emitted only by the account profile, so every icon in the Inbox rendered as an empty
       circle — the markup was right and the symbols simply were not on the page. Each section
       that draws icons now carries its own copy; duplicate symbol ids are harmless and a lot
       safer than one section depending on another having rendered first. */
    return `${AV3_SPRITE}<div class="sec-head">
        <div><h2>Inbox</h2><p class="sec-sub">Everything that came in. Calls, texts, replies, flags.</p></div>
        <button type="button" class="btn btn-ghost" onclick="pipeInboxReadAll()">Mark all read</button>
      </div>
      <div class="ibx-chips">${chips.join("")}</div>
      <div class="ibx-feed">${body}</div>
      <p class="ibx-foot">${unread.length} unread &middot; live from the phone system and Instantly.</p>`;
  }

  /* ---- reply, in thread, through Instantly ----
     The plan this account is on does not allow replying from Instantly's own inbox; the API
     allows it, so the reply happens here instead. In thread deliberately: a reply sent from
     anywhere else starts a second conversation the campaign cannot see and spends domain
     warming Instantly is managing. */
  window.pipeReplyModal=sig=>{
    const i=inboxItems().find(x=>x.sig===sig);
    if(!i||!i.replyTo){ alert("That message cannot be replied to. It has no Instantly handle."); return; }
    const body=`<div class="pcf-hint">Replying to <b>${esc(i.who||"")}</b> from <b>${esc(i.eaccount||"")}</b>, in the same thread.</div>
      <div class="pcf"><label>Subject</label><input class="pinput" id="rpSubj" value="${esc(/^re:/i.test(i.subject||"")?i.subject:"Re: "+(i.subject||""))}"></div>
      <div class="pcf"><label>Message *</label><textarea class="pinput" id="rpBody" rows="8" placeholder="Write your reply…"></textarea></div>
      <div class="pcf-hint" id="rpState"></div>`;
    openModal("Reply",body,"Send reply",`pipeReplySend('${esc(sig)}')`,false);
    const el=document.getElementById("rpBody"); if(el) el.focus();
  };

  window.pipeReplySend=async sig=>{
    const i=inboxItems().find(x=>x.sig===sig); if(!i) return;
    const text=V("rpBody"), subject=V("rpSubj");
    if(!text){ alert("A message is required."); return; }
    const state=document.getElementById("rpState");
    if(state) state.textContent="Sending…";
    try{
      const res=await fetch("/api/reply",{ method:"POST", headers:{"Content-Type":"application/json"},
        credentials:"same-origin",
        body:JSON.stringify({ replyToUuid:i.replyTo, eaccount:i.eaccount, subject, text }) });
      const data=await res.json();
      if(!data.ok) throw new Error(data.error||data.reason||"the reply was refused");
      /* Logged on the account as well as sent, so the timeline shows the whole conversation
         rather than only the half Instantly happens to return on the next read. */
      if(i.acct) addAcctActivity(i.acct,{ ch:"email", who:i.eaccount||"", title:"Reply sent \u2014 "+subject,
        body:text, status:"sent" });
      pipeInboxRead(sig);
      pipeModalClose();
      await loadMail(); remountInbox();
    }catch(err){
      /* Fails loud: telling somebody their reply was sent when it was not means they stop
         following up on a prospect who never heard from them. */
      if(state) state.innerHTML=`<b style="color:var(--red)">Not sent.</b> ${esc(err.message)}`;
      else alert("The reply was not sent: "+err.message);
    }
  };

  /* ---- manual to-dos ----
     Everything else on Today is DERIVED — a to-do the system can work out is one nobody should
     have to write down. But not every commitment has an event behind it ("call Daniel about the
     invoice", "chase the COA"), and those had nowhere to live. These are real records in the
     shared store, so a task Victor writes is a task Sarah sees. */
  const T_KEY="vej_pipe_todos_v1";
  const todos=()=>lsGet(T_KEY,[]);
  window.pipeTodoAdd=()=>{
    const el=document.getElementById("tdyNew"); const what=el?el.value.trim():"";
    if(!what) return;
    const arr=todos();
    arr.push({ id:uid("todo"), what, done:false, who:(P.team[0]&&P.team[0].name)||"",
      created_at:nowISO(), updated_at:nowISO() });
    lsSet(T_KEY,arr); if(el) el.value=""; remountToday();
  };
  window.pipeTodoToggle=id=>{
    const arr=todos(); const t=arr.find(x=>x.id===id); if(!t) return;
    t.done=!t.done; t.updated_at=nowISO(); lsSet(T_KEY,arr); remountToday();
  };
  window.pipeTodoDelete=id=>{
    const arr=todos(); const i=arr.findIndex(x=>x.id===id); if(i<0) return;
    const [gone]=arr.splice(i,1); lsSet(T_KEY,arr);
    removeGeneric("todo",gone.id); remountToday();
  };
  function remountToday(){ const el=document.getElementById("sec-today"); if(el) el.innerHTML=rToday(); }

  /* ================= TODAY =================
     What a rep should do next, in one list, ordered by how long it has been waiting. Built from
     the same three feeds as the Inbox plus deals whose close date has passed. Nothing here is a
     new store: a to-do the system can derive is one nobody has to remember to write down. */
  function rToday(){
    const read=readSet();
    const rows=[];

    inboxItems().filter(i=>!read.has(i.sig)&&i.type!=="text").forEach(i=>{
      rows.push({ at:i.at, what:i.title, who:i.acct||i.who, why:INBOX_META[i.type].label,
        action:i.action, lead:i.lead, tel:i.tel, href:i.href });
    });

    const today=todayISO();
    liveDeals().filter(d=>d.status==="open"&&d.close&&d.close<today).forEach(d=>{
      rows.push({ at:d.close, what:`Deal past its close date \u2014 ${d.deal}`, who:d.customer,
        why:"Deals", action:"Open account", href:canonAcct(d.customer) });
    });

    rows.sort((a,b)=>new Date(a.at)-new Date(b.at));   // oldest first: longest waiting, first

    const body=rows.length?rows.map(r=>{
      const act = r.lead ? `<button type="button" class="btn btn-primary ibx-act" onclick="pipeLeadClaim('${esc(r.lead)}')">${esc(r.action)}</button>`
        : r.tel ? `<a class="btn btn-accent ibx-act" href="tel:${esc(r.tel)}">${esc(r.action)}</a>`
        : r.href ? `<button type="button" class="btn btn-primary ibx-act" onclick="pipeOpenAccount('${esc(r.href).replace(/'/g,"\\'")}')">${esc(r.action)}</button>`
        : "";
      return `<div class="tdy-row">
        <div class="tdy-main"><span class="tdy-what">${esc(r.what)}</span>
          <span class="tdy-who">${esc(r.who||"")}</span></div>
        <span class="tdy-why">${esc(r.why)}</span>
        <span class="tdy-age">${esc(dayKey(r.at))}</span>
        ${act}</div>`;
    }).join(""):`<div class="ibx-empty">Nothing waiting. Everything inbound has been picked up.</div>`;

    const ts=todos();
    const open=ts.filter(t=>!t.done), done=ts.filter(t=>t.done);
    const todoRow=t=>`<div class="tdy-todo${t.done?" done":""}">
      <button type="button" class="tdy-check" onclick="pipeTodoToggle('${esc(t.id)}')" aria-label="${t.done?"Mark not done":"Mark done"}">${t.done?"&#10003;":""}</button>
      <span class="tdy-text">${esc(t.what)}</span>
      <button type="button" class="tdy-x" onclick="pipeTodoDelete('${esc(t.id)}')" title="Delete">&times;</button>
    </div>`;

    return `${AV3_SPRITE}<div class="sec-head">
        <div><h2>Today</h2><p class="sec-sub">What is waiting, oldest first.</p></div>
      </div>
      <div class="tdy-todos">
        <div class="tdy-add">
          <input class="pinput" id="tdyNew" placeholder="Add a to-do&hellip;" onkeydown="if(event.key==='Enter')pipeTodoAdd()">
          <button type="button" class="btn btn-primary" onclick="pipeTodoAdd()">Add</button>
        </div>
        ${open.map(todoRow).join("")}
        ${done.length?`<div class="tdy-donehead">${done.length} done</div>${done.map(todoRow).join("")}`:""}
      </div>
      <div class="tdy-head">Waiting on you</div>
      <div class="tdy-list">${body}</div>`;
  }

  window.PIPELIVE = { rCRM, rInbox, rToday, inboxCount:()=>{ const r=readSet(); return inboxItems().filter(i=>!r.has(i.sig)).length; }, stats, sync:{ hydrate, drainQueue, state:()=>({...SYNC_STATE}),
    queued:()=>lsGet(SYNC_KEY,[]).length, phone:()=>({ok:PHONE.ok,reason:PHONE.reason,rows:PHONE.rows.length}),
    mail:()=>({ok:MAIL.ok,reason:MAIL.reason,rows:MAIL.rows.length,replies:MAIL.replies}) } };

  /* Hydrate AFTER first paint, never before it. The page renders from localStorage instantly
     the way it always has; the shared store arrives a moment later and re-renders only if it
     actually carries something new. Blocking the first render on a network call would trade a
     real defect for a worse one — a dashboard that hangs when a dependency is slow. */
  if(typeof window!=="undefined"){
    const start=()=>{ hydrate().catch(e=>console.warn("[pipeline] hydrate failed",e)); };
    if(document.readyState==="complete"||document.readyState==="interactive") setTimeout(start,0);
    else window.addEventListener("DOMContentLoaded",start);
    /* Coming back from a dead spot should not need a reload to push what is queued. */
    window.addEventListener("online",()=>{ drainQueue().then(syncBadge); });
  }
})();
