/* ============================================================
   Progreaux Sales OS: DAILY REPORT and DATA FEEDS
   Loads after pipeline.js; exposes window.SUMMARY_UI.

   TWO SCREENS, one module, because they answer two halves of the same question. The daily
   summary says what the PEOPLE did today. The systems map says whether the MACHINERY that was
   supposed to record it actually did. A number on the first is only worth reading if the
   second is green, and until now neither existed.

   FORMATTING RULE, as everywhere: no hyphens, en dashes or em dashes in any string a person
   reads. Middots and commas do the separating.
   ============================================================ */
(function(){
  const D = () => (window.PIPELIVE && window.PIPELIVE.data) || null;
  const esc = s => String(s??"").replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;");
  const num = n => Number.isFinite(+n) ? Math.round(+n).toLocaleString() : "0";

  const rrSum = () => { const el=document.getElementById("sec-summary"); if(el) el.innerHTML=sumInner(); };
  const rrSys = () => { const el=document.getElementById("sec-systems"); if(el) el.innerHTML=sysInner(); };

  /* ================================================================
     DAILY SUMMARY
     ================================================================ */
  let SUM=null, SUM_DAY=null, SUM_LOADING=false;
  async function loadSummary(day){
    if(SUM_LOADING) return;
    SUM_LOADING=true;
    try{
      const r=await fetch(`/api/summary${day?`?day=${encodeURIComponent(day)}`:""}`,{credentials:"same-origin"});
      SUM = r.status===403 ? {ok:false,reason:"forbidden"} : await r.json();
    }catch(e){ SUM={ok:false,reason:"unreachable"}; }
    SUM_LOADING=false; rrSum();
  }
  window.sumDay = d => { SUM_DAY=d; SUM=null; rrSum(); loadSummary(d); };
  window.sumShift = n => {
    const base = SUM_DAY || (SUM && SUM.day) || new Date().toISOString().slice(0,10);
    const t = Date.parse(base+"T00:00:00Z") + n*86400000;
    if(t > Date.now()+86400000) return;                 // no summaries from the future
    window.sumDay(new Date(t).toISOString().slice(0,10));
  };
  window.sumExport = () => {
    if(!SUM||!SUM.ok||!D()) return;
    D().downloadCSV(`daily-summary-${SUM.day}.csv`,
      ["Person","Role","Writes today","Created","Edited","Deleted","Writes yesterday","Day","Scope"],
      SUM.people.map(p=>[p.display,p.role||"",p.today.writes,p.today.creates,p.today.edits,
        p.today.deletes,p.yesterday.writes,SUM.day,SUM.scope]));
  };

  const dl = (now,before) => {
    if(before===0) return now>0 ? `<span class="sm-d up">new</span>` : "";
    const pct=Math.round((now-before)/Math.abs(before)*100);
    if(!pct) return `<span class="sm-d flat">level</span>`;
    return `<span class="sm-d ${pct>0?"up":"down"}">${pct>0?"▲":"▼"} ${Math.abs(pct)}%</span>`;
  };

  function sumInner(){
    if(!SUM){ if(!SUM_LOADING) loadSummary(SUM_DAY);
      return `<h1 class="pipe-h">Daily report</h1><p class="pdim">Loading the day…</p>`; }
    if(SUM.ok===false){
      const why = SUM.reason==="forbidden"
        ? "Your account may not read this."
        : `The summary could not be read: <b>${esc(SUM.reason||"unknown")}</b>. It is a live read through the Worker, so it recovers on its own.`;
      return `<h1 class="pipe-h">Daily report</h1><p class="rpt-flag">${why}</p>`;
    }
    const t=SUM.team.today, y=SUM.team.yesterday;
    const tile=(l,v,d,sub)=>`<div class="pkpi"><div class="pk-l">${esc(l)}</div>
      <div class="pk-v">${v} ${d||""}</div><div class="pk-d">${esc(sub||"")}</div></div>`;

    const rows = SUM.people.map(p=>{
      const q=p.today, ys=p.yesterday;
      const ents=Object.entries(q.entities).sort((a,b)=>b[1]-a[1])
        .map(([k,n])=>`${esc(k)} ${n}`).join(" · ");
      return `<tr class="${q.writes?"":"sm-quiet"}">
        <td><b>${esc(p.display)}</b>${p.actor&&p.actor!==p.display?`<span class="pdim"> ${esc(p.actor)}</span>`:""}</td>
        <td>${p.role?`<span class="sm-role r-${esc(p.role)}">${esc(p.role)}</span>`:`<span class="pdim">not a login</span>`}</td>
        <td class="ta-r">${num(q.writes)} ${dl(q.writes,ys.writes)}</td>
        <td class="ta-r">${num(q.creates)}</td>
        <td class="ta-r">${num(q.edits)}</td>
        <td class="ta-r">${num(q.deletes)}</td>
        <td class="ta-r pdim">${num(ys.writes)}</td>
        <td class="pdim sm-ents">${ents||"nothing"}</td>
      </tr>`;
    }).join("");

    const isToday = SUM.day === new Date().toISOString().slice(0,10);
    return `<h1 class="pipe-h">Daily report</h1>
      <p class="page-sub">What each person changed in the record today, and what the phone did.
      ${esc(SUM.scopeNote)} The scope is applied on the server, so this is the whole of what your account may see.</p>

      <div class="sm-bar">
        <button type="button" class="btn sm" onclick="sumShift(-1)">‹ Previous day</button>
        <b class="sm-day">${esc(SUM.day)}${isToday?" · today":""}</b>
        <button type="button" class="btn sm" onclick="sumShift(1)" ${isToday?"disabled":""}>Next day ›</button>
        <span class="pdim">Days are UTC, so a late evening call can land on the next day.</span>
        <button type="button" class="btn sm sm-x" onclick="sumExport()">Export</button>
      </div>

      <h4 class="rpt-h">The team's phone day</h4>
      <div class="grid g4">
        ${tile("Calls",num(t.calls),dl(t.calls,y.calls),`${t.callsIn} in · ${t.callsOut} out`)}
        ${tile("Talk time",num(t.minutes)+" min",dl(t.minutes,y.minutes),"across every call")}
        ${tile("Texts",num(t.texts),dl(t.texts,y.texts),`${t.textsIn} in · ${t.textsOut} out`)}
        ${tile("AI summaries",num(t.summaries),dl(t.summaries,y.summaries),"written by the phone agent")}
      </div>
      <p class="rpt-caveat"><b>These four are a TEAM total and cannot be split by person.</b> ${esc(SUM.team.note)} Every figure in the table below is per person and is exact, because a CRM write carries who made it and a phone call does not.</p>

      <h4 class="rpt-h">Per person</h4>
      <div class="tbl-wrap"><table class="rpt-tbl">
        <thead><tr><th>Person</th><th>Role</th><th class="ta-r">Writes</th><th class="ta-r">Created</th><th class="ta-r">Edited</th><th class="ta-r">Deleted</th><th class="ta-r">Yesterday</th><th>What they touched</th></tr></thead>
        <tbody>${rows||`<tr><td colspan="8" class="pdim">Nobody in your scope wrote anything on this day.</td></tr>`}</tbody>
      </table></div>
      ${SUM.truncated?`<p class="rpt-flag">The audit read hit its 500 row cap, so an older day on this page may be short. Narrow the day rather than trusting a total near the cap.</p>`:""}
      <p class="rpt-caveat"><b>A quiet row is not an idle person.</b> This counts writes to the shared record, which is the only per person signal that exists. Time on the phone, a reply typed in a mailbox and a conversation at a yard are all real work and none of them appear here. Read it as "what reached the CRM", not as a productivity score.</p>`;
  }

  function rSummary(){ return `<section class="section" id="sec-summary">${sumInner()}</section>`; }

  /* ================================================================
     THE SYSTEMS MAP
     Every place a lead, a call or a message can enter the business, what carries it, where it
     lands, and whether the Sales OS can see it.

     WHY THIS IS A GRAPH AND NOT A TABLE. The question it answers is "does it all connect",
     and connectivity is the one thing a table cannot show: a list of six integrations each
     marked "working" is exactly what you would have seen the morning a website lead stopped
     reaching anybody, because every individual piece WAS working. The failure is always in an
     edge, not a node, so the edges are the drawing.

     THE COUNTS ARE LIVE where a route exists to count them, and dated where the source is a
     snapshot. A map that says "connected" without a number is a diagram of intent.

     THE RED EDGES ARE THE VALUABLE PART, and each one carries the evidence for its claim
     rather than a status word. They were established by reading the code on 2026-09-08 and
     each names the file that proves it, so a reader can check rather than believe.
     ================================================================ */
  let SYS=null, SYS_LOADING=false;
  async function loadSystems(){
    if(SYS_LOADING) return;
    SYS_LOADING=true;
    const out={};
    const one=async(k,url,pick)=>{ try{ const r=await fetch(url,{credentials:"same-origin"});
      out[k]={status:r.status, ...pick(await r.json())}; }catch(e){ out[k]={error:String(e).slice(0,80)}; } };
    await Promise.all([
      one("activity","/api/activity?limit=1000",d=>({ok:d.ok,n:(d.rows||[]).length,reason:d.reason,
        named:(d.rows||[]).filter(r=>r.who).length, companied:(d.rows||[]).filter(r=>r.company).length})),
      one("leads","/api/lead",d=>({ok:d.ok!==false,n:(d.records||[]).length,reason:d.reason})),
      one("weblead","/api/record?kind=weblead",d=>({ok:d.ok!==false,n:(d.records||[]).length,reason:d.reason,
        refused:(d.records||[]).filter(r=>r.rejected).length,
        incomplete:(d.records||[]).filter(r=>r.incomplete&&!r.rejected).length})),
      one("deals","/api/deal",d=>({ok:d.ok!==false,n:(d.records||[]).length,reason:d.reason})),
      one("contacts","/api/contact",d=>({ok:d.ok!==false,n:(d.records||[]).length,reason:d.reason})),
      one("audit","/api/audit?limit=1",d=>({ok:d.ok!==false,reason:d.reason})),
      one("mail","/api/email",d=>({ok:d.ok,n:(d.rows||[]).length,replies:d.replies,reason:d.reason})),
      one("apollo","/api/apollo",d=>({ok:d.ok,keyValid:d.keyValid,reason:d.reason})),
    ]);
    SYS=out; SYS_LOADING=false; rrSys();
  }
  window.sysRefresh=()=>{ SYS=null; rrSys(); loadSystems(); };

  /* One row of the map. `health` is the claim; `why` is the evidence for it. A node or an edge
     that cannot show its evidence gets "unknown", never "ok". */
  const HEALTH={
    live:   { label:"Live",     cls:"h-live" },
    dated:  { label:"Snapshot", cls:"h-dated" },
    /* WRITTEN AND NOT LIVE is its own state, and it earns a colour of its own because it is the
       one most likely to be misread. Calling it "Live" because the code is merged would make
       this map lie in exactly the way the caveat at the bottom warns about, and calling it
       "Broken" would hide that the work is done and waiting on one action. The website
       Pages project builds from a git push, so a fix in the tree changes nothing a visitor
       touches until somebody pushes. */
    pending:{ label:"Built, not deployed", cls:"h-pending" },
    broken: { label:"Broken",   cls:"h-broken" },
    missing:{ label:"No link",  cls:"h-missing" },
    unknown:{ label:"Unknown",  cls:"h-unknown" },
  };

  /* Health is computed from the probes loadSystems() already runs, not asserted. A row that
     depends on a route which errored, answered ok:false or answered 4xx/5xx cannot say Live.
     While the probes are still loading the written verdict stands. */
  function probed(keys, written){
    if(!SYS) return written;
    let worst=null;
    for(const k of keys){
      const p=SYS[k];
      if(!p || p.error){ worst = worst || "unknown"; continue; }
      if(p.ok===false || p.status>=400) return "broken";
    }
    return worst==="unknown" && written==="live" ? "unknown" : written;
  }

  /* The Instantly row is derived from where the numbers on screen came from, not asserted: the
     bundled file says source "snapshot", the live route says "live" and replaces it on load. */
  function instantlyRow(){
    const L=window.INSTANTLY_LIVE||null;
    const live=!!(L&&L.source==="live");
    const when=L&&(L.read||L.readDate||L.at);
    return { from:"Instantly campaigns", via:live?"/api/instantly live read":"instantly-data.js snapshot (live read not answering)",
      to:live?"the Reports screens, refreshed on load":"instantly-data.js in the bundle", surface:"Reports",
      health:live?"live":"dated",
      count:L?((live?"live read":"snapshot")+(when?` · read ${esc(when)}`:"")):"no data",
      why:live
        ? `The Reports screens are showing a live read of the Instantly workspace, fetched when this page loaded.`
        : `The Reports screens are showing the bundled snapshot. Campaign sends and replies are as current as the last time somebody ran the generator, and the screens that use it print that date. The live read needs INSTANTLY_API_KEY on the Pages project.`,
      fix:live?"":"Run sales-department/refresh-snapshots.sh, or set INSTANTLY_API_KEY on the Pages project so the numbers are live. The campaign to revenue report grades itself LOW either way, because there is no join from a reply to a deal." };
  }

  /* Apollo: only the key can be checked from here. It exposes no credit balance. */
  function apolloRow(){
    const p=(SYS||{}).apollo;
    let health="unknown", count="not checked";
    if(p&&!p.error){
      if(p.ok&&p.keyValid===false){ health="broken"; count="key rejected"; }
      else if(p.ok&&p.keyValid){ health="live"; count="key valid"; }
      else { health="unknown"; count=p.reason==="not-configured"?"no key on this deployment":"not answering"; }
    }
    return { from:"Apollo", via:"/api/apollo · free auth health check",
      to:"nothing stored", surface:"A warning on Pipeline if the key dies",
      health, count,
      why:`Only the key is checked, and the check spends no credits. Apollo exposes no credit balance to this key, so how many credits are left is not visible here and has to be read in the Apollo settings page.`,
      fix:health==="broken"?"Replace the Apollo key in the Pages variables.":"" };
  }

  function flows(){
    const A=SYS||{};
    const n=k=>A[k]&&A[k].n!=null?num(A[k].n):"-";
    const act=A.activity||{};
    return [
      { from:"Progreaux website", via:"8 forms · /api/lead · stored in D1 through the Worker, then a Resend mail",
        to:"D1 records, kind weblead", surface:"Leads screen, account timeline",
        health:probed(["weblead"],"live"), count:`${n("weblead")} stored${(A.weblead&&A.weblead.refused)?` · ${A.weblead.refused} refused`:""}`,
        why:`The STORE leg is what this row grades. A form on the website posts to /api/lead, which writes the lead to D1 through the Worker before it tries to mail the desk. The record lands as kind "weblead" with the company as its scope, idempotent on the submission id. The Leads screen lists them and they reach the account timeline. The probe here only checks that the weblead store answers. It cannot see the mail leg, which is graded in the next row.`,
        fix:"" },
      { from:"Website lead mail", via:"/api/lead · Resend · sender set by LEAD_FROM",
        to:"the sales desk inbox", surface:"Nowhere in this app, the mail leaves the site",
        health:"unknown", count:"mail leg not proved",
        why:`Not proved, and not provable from here. The sender defaults to a send.americanbiocarbon.com address and that host has no DNS, so Resend cannot send as it unless LEAD_FROM is set on the Pages project to a verified sender. A send.progreaux.com sender does not exist yet. Until it does, a lead is safe in D1 and on the Leads screen, and the mail to the desk may not arrive.`,
        fix:"Verify a sender domain in Resend (send.progreaux.com or another), set LEAD_FROM on the website Pages project, then submit a test form and confirm the mail arrives." },
      { from:"Website form validation", via:"contactState() gate · one channel is enough",
        to:"Stored and flagged, or refused and counted", surface:"Leads screen, with what is missing",
        health:probed(["weblead"],"live"), count:(A.weblead&&A.weblead.n!=null)?`${A.weblead.incomplete||0} incomplete · ${A.weblead.refused||0} refused`:"-",
        why:`The gate refuses only a submission nobody could answer, records which channel is missing, and writes the refusals down so the count exists. The browser waits for the answer and keeps the form on screen when it fails. This was proved live on 2026-09-08, before the rebrand. It has not been proved again since, and the mail side cannot be re-proved until the sender domain exists.`,
        fix:"Re-prove with a test submission once the sender domain is verified." },
      { from:"Allo phone", via:"POST /hooks/allo · HMAC verified · 11 topics",
        to:"D1 events, activity, leads", surface:"Inbox, account timeline, Reports",
        health:probed(["activity","leads"],"live"), count:`${n("activity")} timeline rows · ${n("leads")} phone leads`,
        why:`Verified and deduped on webhook id, then fanned out to five consumers. This is the one intake path that is fully wired end to end: a call lands in D1 within seconds and appears on the account timeline and in the Activity report.`,
        fix:"" },
      { from:"Allo conversation", via:"salesos consumer · contact upsert · timeline backfill",
        to:"contacts, and activity.contact_name / .company", surface:"Account timeline, contact book",
        health:probed(["activity"],"live"), count:`${act.named!=null?act.named:"-"} of ${n("activity")} named · ${act.companied!=null?act.companied:"-"} with a company`,
        why:`A conversation now files a contact, which is what lets it reach an account: the timeline matches a call to an account through the contact book, and the phone had never written to it. The rule is evidence of a person on the other end, so a text either way, an AI summary, an outbound call, an answered inbound call or a voicemail with a summary all qualify, and a single unanswered ring does not. A conversation carrying no name and no company also stays a lead: a contact holding only a number attaches to no account, so it would improve nothing and duplicate the callback queue. THE LIMIT IS THE DATA, not the wiring. Most numbers in the log carry no name and no company, and few match a phone in the roster, HubSpot, Apollo or the outreach lists, so who called often cannot be worked out from anything we hold. The count beside this row is read live.`,
        fix:"Nothing here. Matching more calls to accounts needs identity at the point of the call, which means a caller saying who they are, or Allo carrying a CRM record for them." },
      instantlyRow(),
      { from:"Instantly mail into the Inbox", via:"/api/email · live read, two passes",
        to:"Inbox, account timeline", surface:"Inbox, Pipeline account profile",
        health:probed(["mail"],"live"), count:`${n("mail")} messages · ${A.mail&&A.mail.replies!=null?num(A.mail.replies):"-"} replies`,
        why:`The Inbox reads Instantly live on every load, so a reply that arrives this afternoon shows here. Replies can only be sent from a mailbox that still exists and is connected, so a reply to a thread that started on a retired domain may fail.`,
        fix:"" },
      apolloRow(),
      { from:"Instantly reply", via:"nothing",
        to:"a deal", surface:"No link at all",
        health:"missing", count:"no join key",
        why:`The deal record carries no campaign, no Instantly lead id and no UTM, and the snapshot is aggregate rather than per lead, so there is no row level key on either side. The campaign to revenue report joins on product line and says so, because that is the only dimension both systems share.`,
        fix:"A campaign field on the deal, set when a rep converts a reply. One input, and the join becomes real." },
      { from:"Sales OS", via:"/api/* · signed session · x-actor",
        to:"D1 deals, contacts, records, audit", surface:"Every screen, plus the audit trail",
        health:probed(["deals","contacts","audit"],"live"), count:`${n("deals")} deals · ${n("contacts")} contacts`,
        why:`Every write goes through the edge, carries the identity from the signed cookie, is authorised in _lib/authz.js and leaves an audit row. This is the path the daily summary counts.`,
        fix:"" },
      { from:"Sales OS SMS and email composers", via:"nothing",
        to:"a timeline entry only", surface:"Labeled as a log of a text or email sent elsewhere",
        health:"missing", count:"log only, sends nothing",
        why:`The composers write a timeline entry with status logged and stop. They are labeled "Log a text you sent" and "Log an email you sent", and the SMS button hands the number to the Messages app. Allo exposes no messaging API, so there is no transport behind them.`,
        fix:"A real transport, which does not exist yet. Until then the labels must keep saying this only logs." },
      { from:"HubSpot", via:"one time scrape",
        to:"hubspot-data.js", surface:"Company layer, contact history",
        health:"dated", count:"178 companies · 71 contacts · 55 timelines, frozen",
        why:`Read only and not refreshed since 2026-07-22. 178 companies (185 exported, less 1 internal and 6 duplicates), 71 contacts and 55 account timelines. Useful as history; it is not a live CRM link and nothing written here goes back.`,
        fix:"" },
      { from:"Missed call alerts", via:"outbox · DRY_RUN_ALERTS is true",
        to:"nobody", surface:"Row written, mail not sent",
        health:"broken", count:"dry run",
        why:`wrangler.toml sets DRY_RUN_ALERTS to "true", so the missed call consumer writes an outbox row with status DRY_RUN and sends nothing. The alerting looks wired and is switched off. The sender, ALERT_FROM, is also an address on send.americanbiocarbon.com, which has no DNS, so flipping the flag alone would still send nothing.`,
        fix:"Verify a sender domain (send.progreaux.com or another), change ALERT_FROM to it, confirm the recipient address, then set DRY_RUN_ALERTS to false." },
      { from:"Shopify checkout and orders", via:"nothing",
        to:"nowhere in this app", surface:"Not visible here",
        health:"missing", count:"no read",
        why:`Sample and order checkout runs on the Shopify store. This app has no route that reads Shopify, so orders and samples requested through checkout never appear on a screen here.`,
        fix:"A read only Shopify route, or a webhook into the Worker. Until then check the Shopify admin." },
    ];
  }

  function sysInner(){
    if(!SYS && !SYS_LOADING) loadSystems();
    const rows=flows();
    const tally={};
    for(const f of rows) tally[f.health]=(tally[f.health]||0)+1;
    const chip=k=>`<span class="sys-h ${HEALTH[k].cls}">${HEALTH[k].label}</span>`;

    const card=f=>`<article class="sys-flow ${HEALTH[f.health].cls}">
      <div class="sys-chain">
        <span class="sys-node from">${esc(f.from)}</span>
        <span class="sys-arrow" aria-hidden="true">→</span>
        <span class="sys-via">${esc(f.via)}</span>
        <span class="sys-arrow" aria-hidden="true">→</span>
        <span class="sys-node to">${esc(f.to)}</span>
      </div>
      <div class="sys-meta">
        ${chip(f.health)}
        <span class="sys-count">${f.count}</span>
        <span class="sys-surface">Visible in: ${esc(f.surface)}</span>
      </div>
      <p class="sys-why">${esc(f.why)}</p>
      ${f.fix?`<p class="sys-fix"><b>What would fix it:</b> ${esc(f.fix)}</p>`:""}
    </article>`;

    const order=["missing","broken","pending","dated","live"];
    const sorted=[...rows].sort((a,b)=>order.indexOf(a.health)-order.indexOf(b.health));

    return `<h1 class="pipe-h">Data feeds</h1>
      <p class="page-sub">Every way a lead, a call or a message can reach the business, what carries it,
      where it lands, and whether this app can see it. Sorted worst first, because the working ones do not need you.</p>

      <div class="sys-tally">
        ${order.filter(k=>tally[k]).map(k=>`<span class="sys-t ${HEALTH[k].cls}"><b>${tally[k]}</b> ${HEALTH[k].label.toLowerCase()}</span>`).join("")}
        <button type="button" class="btn sm sys-r" onclick="sysRefresh()">Re check</button>
        ${SYS_LOADING?`<span class="pdim">checking…</span>`:""}
      </div>

      <div class="sys-list">${sorted.map(card).join("")}</div>

      <p class="rpt-caveat"><b>The counts are live; the verdicts are read from the code.</b> Row counts come from /api/activity, /api/lead, /api/deal and /api/contact on every load, so they are as current as the store. The health of each edge was established by reading the source and re-checked on 2026-10-15, after the rebrand. A verdict here going stale is possible and is the thing to distrust first: if you fix one of these, fix this card in summary.js in the same commit.</p>
      <p class="rpt-caveat"><b>What this cannot see.</b> Anything with no route to count it. A lead sitting unread in an inbox, a conversation nobody logged, a reply answered from a phone. Those are exactly the paths marked "No link", and the reason they are worth the red is that nothing else in this app will ever tell you about them.</p>`;
  }

  function rSystems(){ return `<section class="section" id="sec-systems">${sysInner()}</section>`; }

  window.SUMMARY_UI = { rSummary, rSystems, _internals:{ flows, get SUM(){return SUM;}, set SUM(v){SUM=v;} } };
})();
