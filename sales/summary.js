/* ============================================================
   VEJ Sales OS — DAILY SUMMARY and the SYSTEMS MAP
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
      return `<h1 class="pipe-h">Daily summary</h1><p class="pdim">Loading the day…</p>`; }
    if(SUM.ok===false){
      const why = SUM.reason==="forbidden"
        ? "Your account may not read this."
        : `The summary could not be read: <b>${esc(SUM.reason||"unknown")}</b>. It is a live read through the Worker, so it recovers on its own.`;
      return `<h1 class="pipe-h">Daily summary</h1><p class="rpt-flag">${why}</p>`;
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
    return `<h1 class="pipe-h">Daily summary</h1>
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
       "Broken" would hide that the work is done and waiting on one action. The americanbiocarbon
       Pages project builds from a git push, so a fix in the tree changes nothing a visitor
       touches until somebody pushes. */
    pending:{ label:"Built, not deployed", cls:"h-pending" },
    broken: { label:"Broken",   cls:"h-broken" },
    missing:{ label:"No link",  cls:"h-missing" },
    unknown:{ label:"Unknown",  cls:"h-unknown" },
  };

  function flows(){
    const A=SYS||{};
    const n=k=>A[k]&&A[k].n!=null?num(A[k].n):"—";
    const act=A.activity||{};
    return [
      { from:"American BioCarbon website", via:"8 forms · /api/lead · POST to allo-hooks, then Resend",
        to:"D1 records, kind weblead", surface:"Leads screen, account timeline",
        health:"pending", count:`${n("weblead")} stored${(A.weblead&&A.weblead.refused)?` · ${A.weblead.refused} refused`:""}`,
        why:`The Worker end is live: /intake/web-lead accepts a submission, writes it as kind "weblead" with the company as its scope, and is idempotent on the submission id. The Sales OS end is live: the Leads screen lists them and they land on the account timeline with the answers the visitor typed. The MARKETING end is written and not deployed. website/functions/api/lead.js now stores the lead before it mails the desk, so a mail that fails no longer loses it, but that Pages project builds from a git push and the tree is ahead of its remote, so americanbiocarbon.com is still running the version that mails two inboxes and keeps nothing. Any count above came from a test post, not from a visitor.`,
        fix:"Push the website repo. The ALLO_EXPORT_TOKEN secret is already set on the Pages project and takes effect on that deploy." },
      { from:"Website form validation", via:"contactState() gate · one channel is enough",
        to:"Stored and flagged, or refused and counted", surface:"Leads screen, with what is missing",
        health:"pending", count:(A.weblead&&A.weblead.n!=null)?`${A.weblead.incomplete||0} incomplete · ${A.weblead.refused||0} refused`:"—",
        why:`The gate used to demand BOTH a valid email and a phone and answer 400 otherwise, while the browser painted the tick before the response arrived, so a lead with a real address and no number vanished with nobody on either side knowing. It now refuses only a submission nobody could answer, records which channel is missing, and writes the refusals down so the number exists. The browser waits for the answer and keeps the form on screen when it fails. All of that is written and NOT DEPLOYED, for the same git push reason as the card above: today the live site still discards them.`,
        fix:"Push the website repo. Until then the number of leads being turned away is still unknown." },
      { from:"Allo phone", via:"POST /hooks/allo · HMAC verified · 11 topics",
        to:"D1 events, activity, leads", surface:"Inbox, account timeline, Reports",
        health:"live", count:`${n("activity")} timeline rows · ${n("leads")} phone leads`,
        why:`Verified and deduped on webhook id, then fanned out to five consumers. This is the one intake path that is fully wired end to end: a call lands in D1 within seconds and appears on the account timeline and in the Activity report.`,
        fix:"" },
      { from:"Allo conversation", via:"salesos consumer · contact upsert · timeline backfill",
        to:"contacts, and activity.contact_name / .company", surface:"Account timeline, contact book",
        health:"live", count:`${act.named!=null?act.named:"—"} of ${n("activity")} named · ${act.companied!=null?act.companied:"—"} with a company`,
        why:`A conversation now files a contact, which is what lets it reach an account: the timeline matches a call to an account through the contact book, and the phone had never written to it. The rule is evidence of a person on the other end, so a text either way, an AI summary, an outbound call, an answered inbound call or a voicemail with a summary all qualify, and a single unanswered ring does not. A conversation carrying no name and no company also stays a lead: a contact holding only a number attaches to no account, so it would improve nothing and duplicate the callback queue. THE LIMIT IS THE DATA, not the wiring. Of 17 numbers in the log, 15 carry no name and no company and none of them match a phone in the roster, HubSpot, Apollo or the outreach lists, so who called cannot be worked out from anything we hold. The historical backfill moved rows reaching an account from 5 of 71 to 8.`,
        fix:"Nothing here. Getting past 8 needs identity at the point of the call, which means a caller saying who they are, or Allo carrying a CRM record for them." },
      { from:"Instantly", via:"build-instantly-snapshot.mjs, run by hand",
        to:"instantly-data.js in the bundle", surface:"Campaigns, Instantly Logic, Reports",
        health:"dated", count:(window.INSTANTLY_LIVE&&window.INSTANTLY_LIVE.read)?`read ${esc(window.INSTANTLY_LIVE.read)}`:"no snapshot",
        why:`A file, not a feed. Campaign sends and replies are as current as the last time somebody ran the generator, and the screens that use it print that date. A reply that arrives this afternoon is not here until the snapshot is rebuilt.`,
        fix:"Fine as a snapshot for campaign totals. It is not fine as the basis for attribution, which is why the campaign report grades itself LOW." },
      { from:"Instantly reply", via:"nothing",
        to:"a deal", surface:"No link at all",
        health:"missing", count:"no join key",
        why:`The deal record carries no campaign, no Instantly lead id and no UTM, and the snapshot is aggregate rather than per lead, so there is no row level key on either side. The campaign to revenue report joins on product line and says so, because that is the only dimension both systems share.`,
        fix:"A campaign field on the deal, set when a rep converts a reply. One input, and the join becomes real." },
      { from:"Sales OS", via:"/api/* · signed session · x-actor",
        to:"D1 deals, contacts, records, audit", surface:"Every screen, plus the audit trail",
        health:"live", count:`${n("deals")} deals · ${n("contacts")} contacts`,
        why:`Every write goes through the edge, carries the identity from the signed cookie, is authorised in _lib/authz.js and leaves an audit row. This is the path the daily summary counts.`,
        fix:"" },
      { from:"Sales OS SMS composer", via:"nothing",
        to:"nowhere", surface:"Looks sent",
        health:"broken", count:"0 sent, ever",
        why:`The composer writes a timeline entry and stops. Allo exposes no messaging API, so there is no transport behind the button. It has been demonstrated as working.`,
        fix:"Remove the button or label it as logging only, until there is a transport." },
      { from:"HubSpot", via:"one time scrape",
        to:"hubspot-data.js", surface:"Company layer, contact history",
        health:"dated", count:"185 companies, frozen",
        why:`Read only and not refreshed. Useful as history; it is not a live CRM link and nothing written here goes back.`,
        fix:"" },
      { from:"Missed call alerts", via:"outbox · DRY_RUN_ALERTS is true",
        to:"nobody", surface:"Row written, mail not sent",
        health:"broken", count:"dry run",
        why:`wrangler.toml sets DRY_RUN_ALERTS to "true", so the missed call consumer writes an outbox row with status DRY_RUN and sends nothing. The alerting looks wired and is switched off.`,
        fix:"Set DRY_RUN_ALERTS to false once the recipient address is confirmed. See the note on which addresses are real." },
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

    return `<h1 class="pipe-h">Systems map</h1>
      <p class="page-sub">Every way a lead, a call or a message can reach the business, what carries it,
      where it lands, and whether this app can see it. Sorted worst first, because the working ones do not need you.</p>

      <div class="sys-tally">
        ${order.filter(k=>tally[k]).map(k=>`<span class="sys-t ${HEALTH[k].cls}"><b>${tally[k]}</b> ${HEALTH[k].label.toLowerCase()}</span>`).join("")}
        <button type="button" class="btn sm sys-r" onclick="sysRefresh()">Re check</button>
        ${SYS_LOADING?`<span class="pdim">checking…</span>`:""}
      </div>

      <div class="sys-list">${sorted.map(card).join("")}</div>

      <p class="rpt-caveat"><b>The counts are live; the verdicts are read from the code.</b> Row counts come from /api/activity, /api/lead, /api/deal and /api/contact on every load, so they are as current as the store. The health of each edge was established by reading the source on 2026-09-08 and each one names the file that proves it. A verdict here going stale is possible and is the thing to distrust first: if you fix one of these, fix this card in summary.js in the same commit.</p>
      <p class="rpt-caveat"><b>What this cannot see.</b> Anything with no route to count it. A lead sitting unread in an inbox, a conversation nobody logged, a reply answered from a phone. Those are exactly the paths marked "No link", and the reason they are worth the red is that nothing else in this app will ever tell you about them.</p>`;
  }

  function rSystems(){ return `<section class="section" id="sec-systems">${sysInner()}</section>`; }

  window.SUMMARY_UI = { rSummary, rSystems, _internals:{ flows, get SUM(){return SUM;}, set SUM(v){SUM=v;} } };
})();
