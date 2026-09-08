/* ============================================================
   VEJ Sales OS — REPORTS
   Loads AFTER pipeline.js; exposes window.REPORTS_UI.rReports for LEAN_SECTIONS.

   WHAT THIS REPLACED. A tab on the Pipeline page holding four KPIs, two bar charts and a
   card that read "No activity data" in prose while the D1 activity table held 345 rows.
   Nothing on it filtered by anything but the close date period, no chart drilled through
   to the rows underneath it, and nothing exported. It was the seventh tab of a page whose
   first tab is also called Pipeline, which is where a screen goes when nobody decided it
   mattered. The client asked for reporting by name.

   THE ONE RULE THIS FILE IS BUILT ON. Every number states the question it answers. The same
   eighteen deals produce three different "this quarter" figures depending on whether you
   date them by close, by creation or by last activity, and a reader who cannot see which
   basis is in force cannot use the number at all. So the basis is in the filter bar, in the
   caption under every figure, and in the export header. The same goes for weighting, for
   dollars versus tonnes, and for imported history: each is a switch that changes the
   question, and each says on screen which way it is set.

   AND THE SECOND RULE. Where the data cannot answer the question, the report says so in the
   place the answer would have gone. Three of the six reports here are partly blind, and
   each is blind for a reason that is visible on its face:
     · Activity per rep is impossible. The activity rows carry allo_number, the company's
       one shared line, and no agent field at all. There is nothing to group by.
     · Activity per account reaches 5 of 71 rows. The phone feed carries a number and,
       almost never, a name; the join to an account is by ten digit phone key against the
       contact book, and the contact book does not hold most of the numbers that have rung.
     · Campaign to revenue attributes by PRODUCT LINE, not by lead. See the note above
       rCampaign for why, and what it would take to do better.
   Stating that on screen is the entire value of those three reports right now. A funnel
   chart drawn over a join that lands 7% of the time is worse than no chart.

   FORMATTING RULE, same as everywhere in this app: no hyphens, en dashes or em dashes in
   any string a person reads. Middots and commas do the separating.
   ============================================================ */
(function(){
  const D = () => (window.PIPELIVE && window.PIPELIVE.data) || null;
  if(!D()){ console.warn("[reports] PIPELIVE.data seam missing; pipeline.js did not load"); }

  const rr = () => { const el=document.getElementById("sec-reports"); if(el) el.innerHTML=inner(); };
  window.reportsRefresh = rr;

  /* ---------------------------------------------------------------- state
     One object, persisted, because a filter that resets on every re-render is a filter
     nobody trusts. Everything on screen is a function of this and the record store. */
  const KEY = "vej_reports_filter_v1";
  const DEFAULTS = {
    range:"ytd",            // preset id, or "custom"
    from:"", to:"",         // ISO dates, custom range only
    basis:"close",          // close | created | activity
    compare:"prior",        // none | prior | lastyear
    owner:"", line:"", icp:"", segment:"",
    stage:"", status:"", conf:"", source:"", order:"",
    unit:"value",           // value | volume
    weight:"gross",         // gross | weighted
    history:"include",      // include | exclude   (origin filter, from stage 1)
    cume:"period",          // period | cumulative
    report:"funnel",
    auditActor:"",      // the audit tab has its own filter; see rAudit for why
  };
  let F = load();
  function load(){
    try{ const raw=JSON.parse(localStorage.getItem(KEY)||"{}");
      return {...DEFAULTS, ...(raw&&typeof raw==="object"?raw:{})}; }
    catch(_){ return {...DEFAULTS}; }
  }
  const save = () => { try{ localStorage.setItem(KEY, JSON.stringify(F)); }catch(_){} };
  window.rptSet = (k,v) => {
    F[k]=v; save();
    /* The audit log is fetched, not derived, so changing its actor filter has to go back to
       the edge rather than re-filtering what is already here: the log is capped at 200 rows
       and filtering a cap client side silently answers a different question. */
    if(k==="auditActor" && D() && D().audit) D().audit.load(v).then(rr);
    rr();
  };
  window.rptSetKeep = (k,v) => { F[k]=v; save(); rr(); };
  window.rptReset = () => { F={...DEFAULTS}; save(); rr(); };
  window.rptReport = r => { F.report=r; save(); rr(); };
  window.rptCustom = () => {
    const g=id=>{ const n=document.getElementById(id); return n?n.value:""; };
    F.from=g("rptFrom"); F.to=g("rptTo"); F.range="custom"; save(); rr();
  };

  /* ---------------------------------------------------------------- dates
     Everything is computed in UTC. closeDate() already parses the deal's close as UTC
     midnight; mixing a local "today" into that comparison moves a deal across a quarter
     boundary for anyone west of Greenwich, which is a bug that only appears for some
     people and only near the end of a quarter. */
  const DAY = 86400000;
  const utc = (y,m,d) => Date.UTC(y,m,d);
  const today = () => { const n=new Date(); return utc(n.getUTCFullYear(),n.getUTCMonth(),n.getUTCDate()); };
  const iso = t => new Date(t).toISOString().slice(0,10);
  const parseISO = s => { const t=Date.parse(String(s||"")+"T00:00:00Z"); return isNaN(t)?null:t; };

  const PRESETS = [
    ["mtd","This month"], ["qtd","This quarter"], ["ytd","This year"],
    ["last30","Last 30 days"], ["last90","Last 90 days"],
    ["lastq","Last quarter"], ["lasty","Last year"], ["all","All time"],
  ];

  /* A window is [from,to] inclusive in UTC ms, or null for all time. Returning null rather
     than a very wide range matters: "all time" must also switch OFF the compare column,
     because there is no period before all time. */
  function windowOf(id){
    const n=new Date(), y=n.getUTCFullYear(), m=n.getUTCMonth(), t=today();
    if(id==="all") return null;
    if(id==="custom"){
      const a=parseISO(F.from), b=parseISO(F.to);
      if(a==null||b==null) return null;
      return a<=b ? {from:a,to:b} : {from:b,to:a};
    }
    if(id==="mtd")    return {from:utc(y,m,1), to:t};
    if(id==="qtd")    return {from:utc(y,Math.floor(m/3)*3,1), to:t};
    if(id==="ytd")    return {from:utc(y,0,1), to:t};
    if(id==="last30") return {from:t-29*DAY, to:t};
    if(id==="last90") return {from:t-89*DAY, to:t};
    if(id==="lastq"){ const qs=Math.floor(m/3)*3; return {from:utc(y,qs-3,1), to:utc(y,qs,1)-DAY}; }
    if(id==="lasty")  return {from:utc(y-1,0,1), to:utc(y-1,11,31)};
    return null;
  }
  /* The comparison window. Prior period is the same LENGTH immediately before; last year is
     the same dates shifted back one year. Both are stated in the delta caption, because
     "down 12%" against an unnamed baseline is not a fact. */
  function compareWindow(w){
    if(!w || F.compare==="none") return null;
    if(F.compare==="prior"){ const len=w.to-w.from+DAY; return {from:w.from-len, to:w.from-DAY}; }
    const shift = d => { const x=new Date(d); return utc(x.getUTCFullYear()-1,x.getUTCMonth(),x.getUTCDate()); };
    return {from:shift(w.from), to:shift(w.to)};
  }
  const fmtWin = w => w ? `${iso(w.from)} to ${iso(w.to)}` : "all time";

  /* ---------------------------------------------------------------- the basis
     THE POINT OF THIS WHOLE FILE. A deal has three dates and they disagree.

     close     the expected or actual close. What a forecast is made of.
     created   when the record was written. What a "deals opened this month" question means.
     activity  the last time anything happened on the account. What "is this alive" means.

     created is currently DEGENERATE and the UI says so where it is chosen: all 18 deals in
     D1 carry created_at 2026-07-20T00:00:00Z, the timestamp the stage 1 migration stamped
     on the seed import. Dating by creation therefore puts the entire book in one day in
     July. That is not a bug in this file, it is the true state of the record, and hiding
     the basis rather than showing the collapse would be the actual bug. */
  const BASES = [["close","Close date"],["created","Created date"],["activity","Last activity"]];

  function lastActivityAt(d, actIndex){
    const acts = actIndex.get(D().norm(d.customer||"")) || null;
    const a = acts && acts.length ? acts[0] : null;      // index is sorted newest first
    const u = Date.parse(d.updated_at || "");
    const b = a ? a.t : null;
    if(b!=null && !isNaN(u)) return Math.max(b,u);
    if(b!=null) return b;
    return isNaN(u) ? null : u;
  }
  function basisAt(d, actIndex){
    if(F.basis==="created"){ const t=Date.parse(d.created_at||""); return isNaN(t)?null:t; }
    if(F.basis==="activity") return lastActivityAt(d, actIndex);
    const t = D().closeDate(d).getTime();
    return isNaN(t)?null:t;
  }
  const basisLabel = () => (BASES.find(b=>b[0]===F.basis)||BASES[0])[1].toLowerCase();

  /* ---------------------------------------------------------------- the account activity index
     Built once per render from the phone feed, keyed by the norm() of the account name so
     it folds the same way the rest of the app folds spellings. The phone rows themselves
     carry no company, so the route from a row to an account is: ten digit phone key ->
     contact -> contact.account. Coverage is reported on screen rather than assumed. */
  function activityIndex(){
    const d=D();
    const byKey = new Map();
    for(const c of d.contacts()){
      const acct = c.account || c.name;
      for(const f of [c.phone,c.mobile,c.phoneE164]){
        const k=d.phoneKey(f);
        if(k && !byKey.has(k)) byKey.set(k, acct);
      }
    }
    const idx = new Map();
    const feed = d.phone();
    let matched=0;
    for(const r of feed.rows){
      const acct = r.key ? byKey.get(r.key) : null;
      if(!acct) continue;
      matched++;
      const n = d.norm(acct);
      if(!idx.has(n)) idx.set(n,[]);
      const t = Date.parse(r.at);
      idx.get(n).push({ t:isNaN(t)?0:t, kind:r.kind, direction:r.direction, account:acct, row:r });
    }
    for(const arr of idx.values()) arr.sort((a,b)=>b.t-a.t);
    return { idx, feed, matched, total:feed.rows.length };
  }

  /* ---------------------------------------------------------------- product line
     Deals carry `product`, a free text field with five distinct values in the live book.
     The business talks in three lines. This is the map, and the fifth bucket is "other"
     rather than a silent drop, because a deal that belongs to no line still has money in
     it and must still add up to the total. */
  const LINES = [["biochar","Biochar"],["absorbent","Absorbent pellets"],["crumble","Crumble"],["other","Other"]];
  function lineOf(d){
    const p = String(d.product||"").toLowerCase();
    if(p.includes("biochar")) return "biochar";
    if(p.includes("absorbent")||p.includes("pellet")) return "absorbent";
    if(p.includes("crumble")) return "crumble";
    return "other";
  }
  const lineLabel = k => (LINES.find(l=>l[0]===k)||["other","Other"])[1];

  /* ---------------------------------------------------------------- roster join
     ICP and segment live on the roster, not on the deal. Joined by account name through
     the same norm() key. Guarded: roster-data.js loads lazily now, so a report opened in
     the first second of a session may legitimately have no roster yet. */
  function rosterIndex(){
    const list = (window.ROSTER && window.ROSTER.companies) || [];
    const m = new Map();
    for(const c of list){ const n=D().norm(c.name); if(!m.has(n)) m.set(n,c); }
    return m;
  }

  /* ---------------------------------------------------------------- source
     Deals do NOT carry a source field, though the brief said they did. The only route from
     a deal to how it arrived is the lead that converted into it, which exists for a
     minority of deals. Everything else is "Direct", which here means "unknown", and the
     report says the word unknown rather than the word direct. */
  function sourceIndex(){
    const m=new Map();
    for(const l of D().leads()){
      if(l.converted && l.convertedTo) m.set(l.convertedTo, l.source||"Unknown");
    }
    return m;
  }
  const sourceOf = (d,srcIdx) => srcIdx.get(d.deal) || "Unknown";

  /* ---------------------------------------------------------------- the measure
     value or volume, gross or weighted. Volume is metric tons and DELIBERATELY excludes
     rows priced by the unit: CORCS sells by the UNIT, and adding 21 units to 40 tonnes
     produces a number with no dimension. Those rows are counted and reported as excluded
     rather than coerced. */
  function measure(d){
    if(F.unit==="volume"){
      if(String(d.uom||"").toUpperCase()!=="MT") return 0;
      const q = Number(d.qty)||0;
      return F.weight==="weighted" ? q * D().stageOf(d.stage).prob/100 : q;
    }
    return F.weight==="weighted" ? D().weighted(d) : D().value(d);
  }
  const fmtMeasure = v => F.unit==="volume"
    ? `${D().num(v)} MT`
    : D().money(v);
  const measureLabel = () =>
    `${F.weight==="weighted"?"weighted ":""}${F.unit==="volume"?"volume, MT":"value"}`;
  const nonMt = ds => ds.filter(d=>String(d.uom||"").toUpperCase()!=="MT");

  /* ---------------------------------------------------------------- the filter
     One function. Every report calls it, so a report cannot be added later that quietly
     ignores half the bar, which is the exact failure stage 2 fixed on the Pipeline page. */
  function selection(){
    const d=D();
    const A = activityIndex();
    const roster = rosterIndex();
    const srcIdx = sourceIndex();
    const w = windowOf(F.range);
    const cw = compareWindow(w);

    const attrs = deal => {
      const r = roster.get(d.norm(deal.customer||"")) || null;
      return {
        line: lineOf(deal),
        icp: r ? (r.icp||"") : "",
        segment: r ? (r.segment||"") : "",
        source: sourceOf(deal, srcIdx),
      };
    };

    /* Field filters, applied whatever the date window. Kept separate from the date so the
       compare window sees the same population, which is the only way a delta means
       anything: comparing biochar this quarter with everything last quarter is noise. */
    const passField = deal => {
      const a = attrs(deal);
      if(F.owner   && String(deal.owner||"")   !== F.owner)  return false;
      if(F.line    && a.line                   !== F.line)   return false;
      if(F.icp     && a.icp                    !== F.icp)    return false;
      if(F.segment && a.segment                !== F.segment)return false;
      if(F.stage   && String(deal.stage||"")   !== F.stage)  return false;
      if(F.status  && String(deal.status||"")  !== F.status) return false;
      if(F.conf    && String(deal.conf||"")    !== F.conf)   return false;
      if(F.order   && String(deal.order||"")   !== F.order)  return false;
      if(F.source  && a.source                 !== F.source) return false;
      if(F.history==="exclude" && String(deal.origin||"")==="seed") return false;
      return true;
    };
    const inWin = (deal,win) => {
      if(!win) return true;
      const t = basisAt(deal, A.idx);
      if(t==null) return false;
      return t>=win.from && t<=win.to+DAY-1;
    };

    const all = d.deals().filter(passField);
    return {
      A, roster, srcIdx, attrs, w, cw,
      all,                                     // field filtered, every date
      rows: all.filter(x=>inWin(x,w)),         // the selection
      prev: cw ? all.filter(x=>inWin(x,cw)) : null,
      inWin,
    };
  }

  /* ---------------------------------------------------------------- delta
     A figure and its baseline, or a figure and a stated reason there is no baseline. */
  function delta(now, before){
    if(before==null) return "";
    if(!before){ return `<span class="rpt-d flat">no baseline</span>`; }
    const pct = (now-before)/Math.abs(before)*100;
    const cls = pct>0.5?"up":pct<-0.5?"down":"flat";
    const arrow = pct>0.5?"▲":pct<-0.5?"▼":"■";
    return `<span class="rpt-d ${cls}">${arrow} ${Math.abs(pct)<0.05?"0":Math.abs(pct).toFixed(0)}%</span>`;
  }
  const compareCaption = S => {
    if(!S.cw) return F.range==="all"
      ? "No comparison: all time has no period before it."
      : "No comparison selected.";
    return `vs ${F.compare==="prior"?"prior period":"same period last year"}, ${fmtWin(S.cw)}`;
  };

  /* ---------------------------------------------------------------- drill through
     Every chart row carries the deal ids behind it. Clicking opens a modal listing them,
     each row a link into the account profile, and the modal exports. This is the whole
     reason the reports are worth anything: a number you cannot open is a number you cannot
     check, and every number on this page has been wrong at least once. */
  let DRILL = null;
  window.rptDrill = (title, ids) => {
    DRILL = { title, ids:String(ids||"").split("|").filter(Boolean) };
    paintDrill();
  };
  window.rptDrillClose = () => { DRILL=null; const n=document.getElementById("rptDrill"); if(n) n.remove(); };
  window.rptDrillExport = () => {
    if(!DRILL) return;
    const d=D(), set=new Set(DRILL.ids);
    const rows=d.deals().filter(x=>set.has(dealId(x)));
    d.downloadCSV(`report-drill-${slug(DRILL.title)}.csv`,
      ["Deal","Account","Product","Line","Owner","Stage","Status","Confidence","Order","Close","Qty","UoM","Price","Value","Weighted","Origin"],
      rows.map(x=>[x.deal,x.customer,x.product,lineLabel(lineOf(x)),x.owner,d.stageOf(x.stage).label,x.status,x.conf,x.order,x.close,x.qty,x.uom,x.price,d.value(x),Math.round(d.weighted(x)),x.origin||""]));
  };
  const dealId = x => x.id || `${x.deal}|${x.customer}|${x.close}`;
  const slug = s => String(s||"rows").toLowerCase().replace(/[^a-z0-9]+/g,"-").replace(/^-|-$/g,"").slice(0,40) || "rows";

  function paintDrill(){
    window.rptDrillClose();
    if(!DRILL) return;
    const d=D(), set=new Set(DRILL.ids);
    const rows=d.deals().filter(x=>set.has(dealId(x)));
    const body = rows.length
      ? `<div class="tbl-wrap"><table>
          <thead><tr><th>Deal</th><th>Account</th><th>Product</th><th>Stage</th><th>Status</th><th>Close</th><th class="ta-r">Value</th><th class="ta-r">Qty</th></tr></thead>
          <tbody>${rows.map(x=>`<tr>
            <td>${d.esc(x.deal)}</td>
            <td>${d.acctLink(x.customer)}</td>
            <td>${d.esc(x.product)}</td>
            <td>${d.esc(d.stageOf(x.stage).label)}</td>
            <td>${d.esc(x.status)}</td>
            <td>${d.esc(x.close)}</td>
            <td class="ta-r">${d.money(d.value(x))}</td>
            <td class="ta-r">${d.num(x.qty)} ${d.esc(x.uom)}</td>
          </tr>`).join("")}</tbody></table></div>`
      : `<p class="pdim">No deals behind this figure.</p>`;
    const wrap=document.createElement("div");
    wrap.className="pmodal-wrap"; wrap.id="rptDrill";
    wrap.innerHTML=`<div class="pmodal wide">
      <div class="pm-head"><h3>${d.esc(DRILL.title)}</h3>
        <button type="button" class="pm-x" onclick="rptDrillClose()">✕</button></div>
      <div class="pm-body">
        <p class="pdim rpt-drill-sub">${rows.length} ${rows.length===1?"deal":"deals"} · dated by ${d.esc(basisLabel())} · ${d.esc(measureLabel())}</p>
        ${body}
      </div>
      <div class="pm-foot">
        <button type="button" class="btn ghost" onclick="rptDrillClose()">Close</button>
        <button type="button" class="btn" onclick="rptDrillExport()">Export these rows</button>
      </div></div>`;
    wrap.addEventListener("click", e => { if(e.target===wrap) window.rptDrillClose(); });
    document.body.appendChild(wrap);
  }

  /* ---------------------------------------------------------------- chart primitive
     A labelled horizontal bar, clickable, with the ids of its rows on it. Deliberately not
     a chart library: the whole app is server rendered strings with no build step, and one
     bar chart does not justify becoming a different kind of application. */
  function bars(items, opts){
    const o = opts||{};
    const max = Math.max(...items.map(i=>Math.abs(i.v)), 1);
    if(!items.length) return `<p class="pdim">Nothing in this selection.</p>`;
    return items.map((i,ix)=>{
      const pct = Math.abs(i.v)/max*100;
      const click = i.ids && i.ids.length
        ? ` onclick="rptDrill('${D().esc(i.label).replace(/'/g,"&#39;")}','${i.ids.join("|")}')" title="Open the ${i.ids.length} rows behind this"`
        : "";
      return `<div class="rpt-cbar${click?" click":""}"${click}>
        <span class="rb-l">${D().esc(i.label)}</span>
        <div class="rb-track"><span class="rb-fill" style="width:${pct}%;background:${o.color||D().CAT[ix%D().CAT.length]}"></span></div>
        <span class="rb-v">${i.text!=null?i.text:fmtMeasure(i.v)}</span>
        ${i.sub?`<span class="rb-s">${D().esc(i.sub)}</span>`:""}
      </div>`;
    }).join("");
  }

  /* ================================================================
     THE SIX REPORTS
     ================================================================ */

  /* ---- 1. FUNNEL -------------------------------------------------
     Conversion between stages and the average time a deal has been sitting in the one it is
     in. THE HONEST LIMIT, stated on screen: there is no stage history in the store. Nothing
     records when a deal entered its current stage, so "average days in stage" is computed
     from the record's created_at, and with every seed row created on the migration date
     that is the age of the import, not the age of the stage. The conversion column is real;
     the days column is labelled for what it actually measures. */
  function rFunnel(S){
    const d=D();
    const stages=d.stages();
    const rows = stages.map(s=>{
      const at = S.rows.filter(x=>x.stage===s.k);
      return { s, at, v:at.reduce((a,x)=>a+measure(x),0), ids:at.map(dealId) };
    });
    /* Reached = at this stage or any later one. A deal in Negotiation reached Discovery, and
       a funnel that counts only current occupancy shows conversion above 100% the moment a
       late stage holds more value than an early one. */
    const reached = rows.map((r,i)=>{
      const set = rows.slice(i);
      const ds = set.flatMap(x=>x.at);
      return { s:r.s, n:ds.length, v:ds.reduce((a,x)=>a+measure(x),0), ids:ds.map(dealId) };
    });
    const body = reached.map((r,i)=>{
      const prev = i? reached[i-1] : null;
      const conv = prev ? (prev.n ? Math.round(r.n/prev.n*100) : 0) : null;
      const ages = r.s ? S.rows.filter(x=>x.stage===r.s.k).map(x=>{
        const t=Date.parse(x.created_at||""); return isNaN(t)?null:Math.round((today()-t)/DAY);
      }).filter(v=>v!=null) : [];
      const avg = ages.length ? Math.round(ages.reduce((a,b)=>a+b,0)/ages.length) : null;
      const pctOfTop = reached[0].n ? r.n/reached[0].n*100 : 0;
      return `<div class="rpt-fn${r.ids.length?" click":""}"${r.ids.length?` onclick="rptDrill('Reached ${d.esc(r.s.label)}','${r.ids.join("|")}')"`:""}>
        <span class="fn-l">${d.esc(r.s.label)}</span>
        <div class="fn-track"><span class="fn-fill" style="width:${pctOfTop}%;background:${d.CAT[i%d.CAT.length]}"></span></div>
        <span class="fn-n">${r.n}</span>
        <span class="fn-v">${fmtMeasure(r.v)}</span>
        <span class="fn-c">${conv==null?"—":conv+"%"}</span>
        <span class="fn-a">${avg==null?"—":avg+"d"}</span>
      </div>`;
    }).join("");
    const dead = reached.map((r,i)=>({r,i})).filter(({r,i})=>i && reached[i-1].n && r.n/reached[i-1].n<0.5);
    return card("Funnel", `Where deals die. Conversion is the share of the previous stage that reached this one, counting a deal as having reached every stage at or below its current one.`, `
      <div class="rpt-fnhead">
        <span class="fn-l">Stage</span><span class="fn-track"></span>
        <span class="fn-n">Deals</span><span class="fn-v">${d.esc(measureLabel())}</span>
        <span class="fn-c">Conv</span><span class="fn-a">Age</span>
      </div>
      ${body}
      <p class="rpt-caveat"><b>Age is record age, not stage age.</b> Nothing in the store records when a deal entered its current stage, so this column is days since the record was created. Every imported row was created on the migration date, so for those it is the age of the import. Fixing it means writing a stage_changed_at on every stage edit, which is a store change, not a reporting one.</p>
      ${dead.length?`<p class="rpt-flag">Biggest drop: ${dead.map(({r,i})=>`${d.esc(reached[i-1].s.label)} to ${d.esc(r.s.label)}`).join(", ")}.</p>`:""}
    `, ()=>exportFunnel(S,reached));
  }
  function exportFunnel(S,reached){
    const d=D();
    d.downloadCSV("report-funnel.csv",
      ["Stage","Deals reached","Measure","Conversion from previous %","Basis","Measure type","Window"],
      reached.map((r,i)=>[r.s.label,r.n,Math.round(r.v),
        i?(reached[i-1].n?Math.round(r.n/reached[i-1].n*100):0):"",
        basisLabel(), measureLabel(), fmtWin(S.w)]));
  }

  /* ---- 2. FORECAST -----------------------------------------------
     Weighted pipeline by close month against a target. THE TARGET IS NOT IN THE DATA. There
     is no target anywhere in the store or the snapshots, so it is entered here and kept in
     this browser, and the card says exactly that rather than letting a made up number sit
     next to real ones looking equally sourced.

     This report always dates by CLOSE regardless of the basis selector, and says so: a
     forecast dated by when the record was created is not a forecast. */
  const TKEY="vej_reports_target_v1";
  const target = () => { const v=Number(localStorage.getItem(TKEY)); return Number.isFinite(v)&&v>0?v:0; };
  window.rptTarget = () => {
    const n=document.getElementById("rptTargetIn");
    try{ localStorage.setItem(TKEY, String(Number(n&&n.value)||0)); }catch(_){}
    rr();
  };
  function rFcast(S){
    const d=D();
    const open = S.rows.filter(x=>x.status==="open");
    const byMonth = new Map();
    for(const x of open){
      const t=d.closeDate(x); if(isNaN(t)) continue;
      const k=`${t.getUTCFullYear()}-${String(t.getUTCMonth()+1).padStart(2,"0")}`;
      if(!byMonth.has(k)) byMonth.set(k,[]);
      byMonth.get(k).push(x);
    }
    const months=[...byMonth.keys()].sort();
    const tgt=target();
    const rows = months.map(k=>{
      const ds=byMonth.get(k);
      const v=ds.reduce((a,x)=>a+measure(x),0);
      return { label:k, v, ids:ds.map(dealId),
        sub: tgt ? `${fmtMeasure(v)} of ${fmtMeasure(tgt)} · ${v>=tgt?"over by ":"short by "}${fmtMeasure(Math.abs(v-tgt))}` : "" };
    });
    const totalV = rows.reduce((a,r)=>a+r.v,0);
    return card("Forecast", `Open pipeline by close month, ${d.esc(measureLabel())}. Always dated by close date, whatever the basis selector says, because a forecast dated by anything else is not a forecast.`, `
      <div class="rpt-tgt">
        <label for="rptTargetIn">Monthly target</label>
        <input id="rptTargetIn" type="number" min="0" step="1000" value="${tgt||""}" placeholder="none set" />
        <button type="button" class="btn sm" onclick="rptTarget()">Set</button>
        <span class="pdim">${tgt?`Delta below is against ${fmtMeasure(tgt)} per month.`:"No target set, so no delta is shown."}</span>
      </div>
      ${bars(rows)}
      <p class="rpt-caveat"><b>The target is not company data.</b> Nothing in the store, the SIBRA snapshot or the Instantly export carries a sales target. The figure above is typed here and saved in this browser only: it is not shared with Victor or Daniel and it is not a number anyone has agreed. Everything else on this card is read from the record.</p>
      <p class="pdim">${months.length} ${months.length===1?"month":"months"} with open deals · ${fmtMeasure(totalV)} total.</p>
    `, ()=>d.downloadCSV("report-forecast.csv",
        ["Close month","Open deals","Measure","Target","Delta","Measure type"],
        rows.map(r=>[r.label,r.ids.length,Math.round(r.v),tgt||"",tgt?Math.round(r.v-tgt):"",measureLabel()])));
  }

  /* ---- 3. ACTIVITY -----------------------------------------------
     Calls, texts and AI summaries per week, from /api/activity. Read the header of this
     file for what this cannot do and why. Per rep is not attempted at all rather than
     rendered as one bar labelled with the company's switchboard number. */
  function rActivity(S){
    const d=D();
    const feed=S.A.feed;
    if(feed.ok===false){
      return card("Activity", "Calls, texts and summaries from the phone system.", `
        <p class="rpt-flag">The activity feed is not answering: <b>${d.esc(feed.reason||"unknown")}</b>. Nothing below would be true, so nothing is drawn. This is the live D1 read through /api/activity, not a snapshot, so it recovers on its own when the Worker does.</p>`);
    }
    const rows=feed.rows;
    /* Week buckets, Monday start, UTC. */
    const wk = t => { const x=new Date(t); const dow=(x.getUTCDay()+6)%7;
      return utc(x.getUTCFullYear(),x.getUTCMonth(),x.getUTCDate()-dow); };
    const win=S.w;
    const inRange = r => { if(!win) return true; const t=Date.parse(r.at); return !isNaN(t)&&t>=win.from&&t<=win.to+DAY-1; };
    const sel=rows.filter(inRange);
    const byWeek=new Map();
    for(const r of sel){ const t=Date.parse(r.at); if(isNaN(t)) continue;
      const k=iso(wk(t)); if(!byWeek.has(k)) byWeek.set(k,[]); byWeek.get(k).push(r); }
    const weeks=[...byWeek.keys()].sort();
    const kinds=["call","sms","summary","tag"];
    const weekRows=weeks.map(k=>{
      const g=byWeek.get(k);
      const c=kinds.map(kk=>g.filter(x=>x.kind===kk).length);
      return { label:`Week of ${k}`, v:g.length, text:`${g.length}`,
        sub:`${c[0]} calls · ${c[1]} texts · ${c[2]} summaries`, ids:[] };
    });
    /* Per account, through the phone key join. Coverage is stated before the chart, not
       after it, because a reader who sees the bars first has already believed them. */
    const perAcct=[...S.A.idx.entries()].map(([n,arr])=>{
      const inr=arr.filter(a=>!win||(a.t>=win.from&&a.t<=win.to+DAY-1));
      return { label:arr[0].account, v:inr.length, text:String(inr.length), ids:[] };
    }).filter(x=>x.v).sort((a,b)=>b.v-a.v);
    const cov = S.A.total ? Math.round(S.A.matched/S.A.total*100) : 0;
    const dirn = k => sel.filter(r=>r.direction===k).length;
    return card("Activity", `Everything the phone system recorded, live from D1. ${sel.length} rows in ${fmtWin(win)}.`, `
      <div class="grid g4">
        ${d.kpi("Calls", d.num(sel.filter(r=>r.kind==="call").length), `${dirn("INBOUND")} in · ${dirn("OUTBOUND")} out, all kinds`)}
        ${d.kpi("Texts", d.num(sel.filter(r=>r.kind==="sms").length), "sent and received")}
        ${d.kpi("AI summaries", d.num(sel.filter(r=>r.kind==="summary").length), "generated by the phone agent")}
        ${d.kpi("Weeks covered", d.num(weeks.length), weeks.length?`${weeks[0]} to ${weeks[weeks.length-1]}`:"no rows")}
      </div>
      <h4 class="rpt-h">Per week</h4>
      ${bars(weekRows)}
      <h4 class="rpt-h">Per account</h4>
      <p class="rpt-caveat"><b>This chart sees ${cov}% of the traffic.</b> ${S.A.matched} of ${S.A.total} rows matched an account. The phone feed carries a number and, on ${feed.rows.filter(r=>r.who).length} of ${S.A.total} rows, a name; it carries a company on none of them. The only join available is the ten digit number against the contact book, and most numbers that have rung are not in it. Closing the gap means saving callers as contacts, not changing this report.</p>
      ${perAcct.length?bars(perAcct):`<p class="pdim">No activity row matched an account in this window.</p>`}
      <h4 class="rpt-h">Per rep</h4>
      <p class="rpt-caveat"><b>Not built, because it cannot be.</b> Activity rows carry allo_number, which is the company's one shared line, and no agent, user or rep field of any kind. There is nothing to group by. A chart here would be one bar labelled (225) 398 9286. This needs the phone system to send the answering agent on the webhook before any reporting change is worth making.</p>
    `, ()=>d.downloadCSV("report-activity.csv",
        ["At","Kind","Direction","Number","Matched account","Minutes","Result","Tags"],
        sel.map(r=>{
          const acct=[...S.A.idx.entries()].find(([,arr])=>arr.some(a=>a.row===r));
          return [r.at,r.kind,r.direction||"",r.number||"",acct?acct[1][0].account:"",r.minutes??"",r.result||"",(r.tags||[]).join("; ")];
        })));
  }

  /* ---- 4. CAMPAIGN TO REVENUE ------------------------------------
     The join nobody has, and the reason nobody has it.

     Instantly knows: campaign, ICP code, product line, leads, sends, replies. It does NOT
     know what happened after a reply, because a reply is answered by a human in a mailbox
     and the deal is typed into this app by hand with no reference to the campaign.
     The deal side knows: account, product, value. It carries no campaign field, no
     Instantly lead id, and no UTM.

     So there is no row level join. Three candidate keys, and why two are rejected:
       · lead id      does not exist on the deal. Nothing to match.
       · email domain would be real. Instantly holds the lead's address and the contact book
                      holds the account's. But the mail snapshot in instantly-data.js is
                      AGGREGATE: it carries per campaign counts, not per lead rows, so there
                      are no addresses on this side to match. It would need a new export.
       · product line CHOSEN. Both sides carry it: Instantly buckets every campaign under
                      absorbent or biochar, and a deal's product maps to a line. It is a
                      real shared dimension and it is honest about what it is.

     What that buys, precisely: "the biochar campaigns sent 424 mails and got 7 replies, and
     the biochar deals in this window are worth X". It does NOT say the mails caused the
     deals. Both facts are about the same product line in overlapping time, and that is the
     whole claim. The card says so in those words, and grades its own confidence LOW,
     because a reader who takes this for attribution will make a spend decision on it. */
  function rCampaign(S){
    const d=D();
    const I=window.INSTANTLY_LIVE||null;
    if(!I) return card("Campaign to revenue","Outbound effort against the book of business.",
      `<p class="rpt-flag">instantly-data.js is not loaded, so there is no campaign side to join. Re-stamp with sales-department/refresh-snapshots.sh.</p>`);
    const byLine=I.byLine||{};
    /* Instantly's two buckets against the deal book's lines. crumble has no campaigns at
       all, which is itself the finding, so it is rendered as a row with a zero rather than
       omitted. */
    const map={ biochar:"biochar", absorbent:"absorbent" };
    const lines=[...new Set([...Object.keys(byLine).map(k=>map[k]||k), ...LINES.map(l=>l[0])])]
      .filter(k=>k!=="other");
    const rows=lines.map(k=>{
      const src=byLine[k]||{};
      const ds=S.rows.filter(x=>lineOf(x)===k);
      const won=ds.filter(x=>x.status==="won");
      return { k, label:lineLabel(k),
        sent:src.sent||0, leads:src.leads||0, replies:src.replies||0, campaigns:src.campaigns||0,
        deals:ds.length, wonN:won.length,
        v:ds.reduce((a,x)=>a+measure(x),0),
        wonV:won.reduce((a,x)=>a+measure(x),0),
        ids:ds.map(dealId) };
    });
    const tot=k=>rows.reduce((a,r)=>a+r[k],0);
    return card("Campaign to revenue", "Outbound effort beside the book of business, joined on product line.", `
      <div class="rpt-conf low">
        <span class="rc-badge">Attribution confidence: LOW</span>
        <span>Joined on <b>product line</b>, the only dimension both sides carry. This is not attribution. It says the biochar campaigns sent N mails and the biochar deals are worth X, over overlapping time. It does not say the mails produced the deals, and nothing in either system can currently say that.</span>
      </div>
      <div class="tbl-wrap"><table class="rpt-tbl">
        <thead><tr><th>Line</th><th class="ta-r">Campaigns</th><th class="ta-r">Leads</th><th class="ta-r">Sends</th><th class="ta-r">Replies</th><th class="ta-r">Reply %</th><th class="ta-r">Deals</th><th class="ta-r">${d.esc(measureLabel())}</th><th class="ta-r">Won</th></tr></thead>
        <tbody>${rows.map(r=>`<tr class="${r.ids.length?"click":""}"${r.ids.length?` onclick="rptDrill('${d.esc(r.label)} deals','${r.ids.join("|")}')"`:""}>
          <td>${d.esc(r.label)}</td>
          <td class="ta-r">${d.num(r.campaigns)}</td>
          <td class="ta-r">${d.num(r.leads)}</td>
          <td class="ta-r">${d.num(r.sent)}</td>
          <td class="ta-r">${d.num(r.replies)}</td>
          <td class="ta-r">${r.sent?(r.replies/r.sent*100).toFixed(1)+"%":"—"}</td>
          <td class="ta-r">${d.num(r.deals)}</td>
          <td class="ta-r">${fmtMeasure(r.v)}</td>
          <td class="ta-r">${d.num(r.wonN)}</td>
        </tr>`).join("")}
        <tr class="rpt-tot"><td>Total</td><td class="ta-r">${d.num(tot("campaigns"))}</td><td class="ta-r">${d.num(tot("leads"))}</td><td class="ta-r">${d.num(tot("sent"))}</td><td class="ta-r">${d.num(tot("replies"))}</td><td class="ta-r">${tot("sent")?(tot("replies")/tot("sent")*100).toFixed(1)+"%":"—"}</td><td class="ta-r">${d.num(tot("deals"))}</td><td class="ta-r">${fmtMeasure(tot("v"))}</td><td class="ta-r">${d.num(tot("wonN"))}</td></tr>
        </tbody></table></div>
      <p class="rpt-caveat"><b>What would make this real.</b> A campaign field on the deal, set when a rep converts a reply, is the direct fix and costs one input. Failing that, a per lead Instantly export would allow an email domain join to the contact book, which is indirect but row level. Neither exists today. Campaign figures are a snapshot read ${d.esc(I.read||"unknown")}; deal figures are live.</p>
    `, ()=>d.downloadCSV("report-campaign-to-revenue.csv",
        ["Line","Campaigns","Leads","Sends","Replies","Deals","Measure","Won deals","Won measure","Join key","Confidence","Campaign snapshot"],
        rows.map(r=>[r.label,r.campaigns,r.leads,r.sent,r.replies,r.deals,Math.round(r.v),r.wonN,Math.round(r.wonV),"product line","low",I.read||""])));
  }

  /* ---- 5. AGING AND STALLED --------------------------------------
     Open deals by days since anything last happened. Today catches deals past their close
     date; nothing caught a deal that simply went quiet, which is the more common way one
     dies. "Last activity" here is the newest of: a matched phone row on the account, and
     the record's own updated_at. Both are named in the column so a reader knows which. */
  const BUCKETS=[[0,7,"Under a week"],[7,30,"1 to 4 weeks"],[30,60,"1 to 2 months"],[60,90,"2 to 3 months"],[90,1e9,"Over 3 months"]];
  function rAging(S){
    const d=D();
    const open=S.rows.filter(x=>x.status==="open");
    const aged=open.map(x=>{
      const t=lastActivityAt(x,S.A.idx);
      const days = t==null ? null : Math.max(0, Math.round((today()-t)/DAY));
      const hasPhone = S.A.idx.has(d.norm(x.customer||""));
      return { x, days, hasPhone };
    });
    const rows=BUCKETS.map(([lo,hi,label],i)=>{
      const g=aged.filter(a=>a.days!=null&&a.days>=lo&&a.days<hi);
      return { label, v:g.reduce((a,b)=>a+measure(b.x),0), ids:g.map(a=>dealId(a.x)),
        sub:`${g.length} ${g.length===1?"deal":"deals"}` };
    });
    const unknown=aged.filter(a=>a.days==null);
    const worst=[...aged].filter(a=>a.days!=null).sort((a,b)=>b.days-a.days).slice(0,10);
    const phoneCov=aged.filter(a=>a.hasPhone).length;
    return card("Aging and stalled", `Open deals by how long they have been quiet. ${open.length} open in this selection.`, `
      ${bars(rows)}
      ${unknown.length?`<p class="rpt-flag">${unknown.length} open ${unknown.length===1?"deal has":"deals have"} no usable date at all and are in no bucket above.</p>`:""}
      <h4 class="rpt-h">Quietest ten</h4>
      <div class="tbl-wrap"><table class="rpt-tbl">
        <thead><tr><th>Deal</th><th>Account</th><th>Owner</th><th>Stage</th><th class="ta-r">Quiet for</th><th>Last activity from</th><th class="ta-r">${d.esc(measureLabel())}</th></tr></thead>
        <tbody>${worst.map(a=>`<tr>
          <td>${d.esc(a.x.deal)}</td><td>${d.acctLink(a.x.customer)}</td>
          <td>${d.esc(a.x.owner||"unassigned")}</td>
          <td>${d.esc(d.stageOf(a.x.stage).label)}</td>
          <td class="ta-r">${a.days}d</td>
          <td>${a.hasPhone?"phone and record":"record only"}</td>
          <td class="ta-r">${fmtMeasure(measure(a.x))}</td>
        </tr>`).join("")||`<tr><td colspan="7" class="pdim">No open deals in this selection.</td></tr>`}</tbody></table></div>
      <p class="rpt-caveat"><b>Read the last column.</b> ${phoneCov} of ${aged.length} open deals have any matched phone activity; for the rest, "quiet for" is time since the record was last edited, which is a weaker signal and often just the migration date. A deal showing "record only" and a large number has not necessarily been ignored, it may only be unrecorded.</p>
    `, ()=>d.downloadCSV("report-aging.csv",
        ["Deal","Account","Owner","Stage","Days quiet","Signal","Measure","Basis","Window"],
        aged.sort((a,b)=>(b.days??-1)-(a.days??-1)).map(a=>[a.x.deal,a.x.customer,a.x.owner||"",d.stageOf(a.x.stage).label,a.days??"",a.hasPhone?"phone and record":"record only",Math.round(measure(a.x)),basisLabel(),fmtWin(S.w)])));
  }

  /* ---- 6. SAMPLE TO ORDER ----------------------------------------
     The company's actual motion: samples first, then an order. Measured off the stage
     ladder, which has Sample/Trial as its own rung, so a deal that has ever reached it is a
     sample sent and a deal past it has converted.

     THE LIMIT, again from the missing stage history: days between is measured from the
     record's created_at to its close date, not from sample sent to order placed, because
     the store holds no stage transition dates. Both numbers are labelled for what they are. */
  function rSample(S){
    const d=D();
    const order = d.stages().map(s=>s.k);
    const rank = k => { const i=order.indexOf(k); return i<0?0:i; };
    const SAMPLE=rank("sample_trial");
    const reached=S.rows.filter(x=>rank(x.stage)>=SAMPLE);
    const past   =S.rows.filter(x=>rank(x.stage)>SAMPLE);
    const won    =S.rows.filter(x=>x.status==="won");
    const gaps=past.map(x=>{
      const a=Date.parse(x.created_at||""), b=d.closeDate(x).getTime();
      return (isNaN(a)||isNaN(b))?null:Math.round((b-a)/DAY);
    }).filter(v=>v!=null);
    const med = gaps.length ? [...gaps].sort((a,b)=>a-b)[Math.floor(gaps.length/2)] : null;
    const byLine=LINES.map(([k,label])=>{
      const r=reached.filter(x=>lineOf(x)===k), p=past.filter(x=>lineOf(x)===k);
      return { label, v:r.length, text:`${p.length} of ${r.length}`,
        sub:r.length?`${Math.round(p.length/r.length*100)}% moved past sample`:"no sampled deals",
        ids:r.map(dealId) };
    }).filter(x=>x.v);
    return card("Sample to order", "The motion the company actually runs: a sample goes out, an order follows or it does not.", `
      <div class="grid g4">
        ${d.kpi("Reached sample", d.num(reached.length), "at Sample/Trial or beyond")}
        ${d.kpi("Moved past it", d.num(past.length), reached.length?`${Math.round(past.length/reached.length*100)}% of sampled`:"—")}
        ${d.kpi("Won after sampling", d.num(won.filter(x=>rank(x.stage)>=SAMPLE).length), "closed won")}
        ${d.kpi("Median days", med==null?"—":med+"d", "record created to close date")}
      </div>
      <h4 class="rpt-h">By product line</h4>
      ${byLine.length?bars(byLine):`<p class="pdim">No deals have reached Sample/Trial in this selection.</p>`}
      <p class="rpt-caveat"><b>"Days" is not sample to order.</b> The store records no stage transition dates, so the gap above is from the record's creation to its close date. For every imported row creation is the migration date, which makes that figure the distance from the import to the close, not the length of the sample cycle. The real measure needs a sample_sent_at on the deal.</p>
      <p class="rpt-caveat"><b>Sampling is inferred from the stage ladder,</b> not from a record that a sample shipped. A deal that got a sample and was then closed lost without its stage being advanced does not appear here.</p>
    `, ()=>d.downloadCSV("report-sample-to-order.csv",
        ["Deal","Account","Line","Stage","Reached sample","Moved past sample","Status","Created","Close","Days"],
        reached.map(x=>{
          const a=Date.parse(x.created_at||""), b=d.closeDate(x).getTime();
          return [x.deal,x.customer,lineLabel(lineOf(x)),d.stageOf(x.stage).label,"yes",rank(x.stage)>SAMPLE?"yes":"no",x.status,(x.created_at||"").slice(0,10),x.close,(isNaN(a)||isNaN(b))?"":Math.round((b-a)/DAY)];
        })));
  }

  /* ---- 7. AUDIT (admin only) --------------------------------------
     The whole change log across every record: who wrote what, and when.

     ADMIN ONLY, and the gate is the edge's, not this one. /api/audit answers 403 to an
     unscoped read from a manager, so a manager who reaches this tab by editing localStorage
     gets a refusal from the server rather than data. Hiding the tab is a courtesy; the tab
     being empty for them is the control. Read the header of _lib/authz.js on why that
     distinction is the only one that matters.

     Deliberately NOT filtered by the bar above it. Every other report on this page is about
     the book of business, and the filter bar is about deals: an owner, a product line and a
     close date window mean nothing applied to "daniel edited a contact". Wiring the bar to
     this would produce a screen whose emptiness had no explanation. It has its own actor
     filter and says so. */
  function rAudit(S){
    const d=D();
    const pack=d.audit.get();
    if(!pack){ d.audit.load(F.auditActor||"").then(()=>rr());
      return card("Audit trail","Every write the shared store accepted.",
        `<p class="pdim">Loading the change log…</p>`); }
    if(pack.ok===false){
      const why = pack.reason==="forbidden"
        ? `Your account may not read the full change log. It is admin only, because the whole log across every record is a record of what each colleague did all day rather than a fact about a customer. The per account history on each profile is not restricted.`
        : `The change log could not be read: <b>${d.esc(pack.reason||"unknown")}</b>.`;
      return card("Audit trail","Every write the shared store accepted.",`<p class="rpt-flag">${why}</p>`);
    }
    const rows=pack.rows||[];
    const actors=pack.actors||[];
    const byEntity={};
    for(const r of rows) byEntity[r.entity]=(byEntity[r.entity]||0)+1;
    return card("Audit trail", `${rows.length} most recent writes${F.auditActor?` by ${F.auditActor}`:""}. Appended by the store on every accepted write and never edited.`, `
      <div class="rpt-row">
        ${sel("auditActor","Actor",[["","Everyone"],...actors.filter(a=>a.actor).map(a=>[a.actor,`${a.actor} (${a.n})`])],F.auditActor||"")}
        <span class="pdim" style="align-self:center">Not filtered by the bar above: that bar filters deals, and these are edits.</span>
      </div>
      <div class="tbl-wrap"><table class="rpt-tbl">
        <thead><tr><th>When</th><th>Who</th><th>Did</th><th>To</th><th>Record</th><th>Fields</th></tr></thead>
        <tbody>${rows.map(r=>`<tr>
          <td>${d.esc(d.fmtTs(r.at))}</td>
          <td>${d.esc(r.actor||"unattributed")}</td>
          <td>${d.esc(d.audit.ACTIONS[r.action]||r.action)}</td>
          <td>${d.esc(r.entity)}${r.kind?` · ${d.esc(r.kind)}`:""}</td>
          <td class="aud-id">${d.esc(r.entity_id)}</td>
          <td>${d.esc(r.detail||"")}</td>
        </tr>`).join("")||`<tr><td colspan="6" class="pdim">No writes recorded.</td></tr>`}</tbody></table></div>
      <p class="rpt-caveat"><b>Field names, never values.</b> The store records that the price field changed and not what it changed from or to, so this answers "who touched this" and cannot answer "what did it used to say". Rolling back from this table is not possible and was never the intent.</p>
      <p class="rpt-caveat"><b>"unattributed" means the write arrived with no actor header,</b> not that someone was hiding, and it is not offered in the filter above because the column is NULL for those rows and no actor string matches NULL. Writes made before stage 1 added the identity forwarding, and any write that reaches the Worker without going through the Pages proxy, land that way. ${d.esc(String(actors.filter(a=>!a.actor).reduce((a,b)=>a+b.n,0)))} of the rows in the log are unattributed.</p>
      <p class="pdim">${Object.entries(byEntity).map(([k,v])=>`${d.esc(k)}: ${v}`).join(" · ")||""}</p>
    `, ()=>d.downloadCSV("audit-trail.csv",["At","Actor","Action","Entity","Kind","Record id","Fields"],
        rows.map(r=>[r.at,r.actor||"",r.action,r.entity,r.kind||"",r.entity_id,r.detail||""])));
  }

  /* ---------------------------------------------------------------- headline
     Four figures with their comparison, above whichever report is open, because the filter
     bar changes what they mean and they belong beside the controls that changed them. */
  function headline(S){
    const d=D();
    const fig = (label, f, fmt) => {
      const now=f(S.rows), before=S.prev?f(S.prev):null;
      return `<div class="pkpi"><div class="pk-l">${d.esc(label)}</div>
        <div class="pk-v">${fmt(now)} ${delta(now,before)}</div>
        <div class="pk-d">${S.prev?`was ${fmt(before)}`:compareCaption(S)}</div></div>`;
    };
    const m = ds => ds.reduce((a,x)=>a+measure(x),0);
    const wonRate = ds => { const w=ds.filter(x=>x.status==="won").length,
      l=ds.filter(x=>x.status==="lost").length; return (w+l)?Math.round(w/(w+l)*100):0; };
    return `<div class="grid g4">
      ${fig(`Pipeline, ${measureLabel()}`, m, fmtMeasure)}
      ${fig("Deals", ds=>ds.length, d.num)}
      ${fig(`Won, ${measureLabel()}`, ds=>m(ds.filter(x=>x.status==="won")), fmtMeasure)}
      ${fig("Win rate", wonRate, v=>v+"%")}
    </div>`;
  }

  /* ---------------------------------------------------------------- the filter bar */
  /* The audit tab appears only for an account that holds `admin`. The cookie this reads is a
     hint, not a control (see the ROLE block in pipeline.js): the actual refusal happens at
     the edge, so a manager who forces this tab sees the server's own explanation rather than
     data. Computed per render, not once, so it is right after a re-login. */
  const REPORTS_ALL=[
    ["funnel","Funnel",rFunnel,null],
    ["forecast","Forecast",rFcast,null],
    ["activity","Activity",rActivity,null],
    ["campaign","Campaign to revenue",rCampaign,null],
    ["aging","Aging and stalled",rAging,null],
    ["sample","Sample to order",rSample,null],
    ["audit","Audit trail",rAudit,"admin"],
  ];
  const REPORTS=()=>REPORTS_ALL.filter(r=>!r[3]||(D()&&D().can&&D().can(r[3])));

  function sel(id,label,opts,val,cls){
    const d=D();
    return `<label class="rpt-f${cls?" "+cls:""}"><span>${d.esc(label)}</span>
      <select onchange="rptSet('${id}',this.value)">
        ${opts.map(([v,l])=>`<option value="${d.esc(v)}"${String(v)===String(val)?" selected":""}>${d.esc(l)}</option>`).join("")}
      </select></label>`;
  }
  function toggle(id,label,opts,val){
    const d=D();
    return `<div class="rpt-tg"><span>${d.esc(label)}</span><div class="rpt-tgb">
      ${opts.map(([v,l])=>`<button type="button" class="${String(v)===String(val)?"on":""}" onclick="rptSet('${id}','${d.esc(v)}')">${d.esc(l)}</button>`).join("")}
    </div></div>`;
  }

  function filterBar(S){
    const d=D();
    const deals=d.deals();
    const uniq = (list,f) => [...new Set(list.map(f).filter(Boolean))].sort();
    const roster=S.roster;
    const attrsOf = x => S.attrs(x);
    const owners=uniq(deals,x=>x.owner);
    const icps=uniq(deals,x=>attrsOf(x).icp);
    const segs=uniq(deals,x=>attrsOf(x).segment);
    const srcs=uniq(deals,x=>attrsOf(x).source);
    const orders=uniq(deals,x=>x.order);
    const w=S.w;

    const custom = F.range==="custom"
      ? `<div class="rpt-custom">
          <label>From <input id="rptFrom" type="date" value="${d.esc(F.from)}" /></label>
          <label>To <input id="rptTo" type="date" value="${d.esc(F.to)}" /></label>
          <button type="button" class="btn sm" onclick="rptCustom()">Apply</button>
          ${(!F.from||!F.to)?`<span class="pdim">Set both ends. Until then this is all time.</span>`:""}
        </div>` : "";

    /* The line that makes the whole bar honest. It is not decoration and it is not
       collapsible: it names the window, the basis, the measure and the population, which
       are the four things you must know to read any figure on this page. */
    const created = F.basis==="created";
    const createdSpread = (()=>{
      const ts=deals.map(x=>Date.parse(x.created_at||"")).filter(t=>!isNaN(t));
      if(!ts.length) return null;
      const lo=iso(Math.min(...ts)), hi=iso(Math.max(...ts));
      return lo===hi ? lo : null;
    })();

    return `<div class="rpt-bar">
      <div class="rpt-row">
        ${sel("range","Date range",[...PRESETS,["custom","Custom range"]],F.range,"wide")}
        ${sel("basis","Dated by",BASES,F.basis,"wide")}
        ${sel("compare","Compare to",[["none","No comparison"],["prior","Prior period"],["lastyear","Same period last year"]],F.compare,"wide")}
        ${sel("owner","Owner",[["","Every owner"],...owners.map(o=>[o,o])],F.owner)}
        ${sel("line","Product line",[["","Every line"],...LINES.map(([k,l])=>[k,l])],F.line)}
      </div>
      ${custom}
      <div class="rpt-row">
        ${sel("icp","ICP",[["","Every ICP"],...icps.map(i=>[i,i])],F.icp)}
        ${sel("segment","Segment",[["","Every segment"],...segs.map(i=>[i,i])],F.segment)}
        ${sel("stage","Stage",[["","Every stage"],...d.stages().map(s=>[s.k,s.label])],F.stage)}
        ${sel("status","Status",[["","Every status"],["open","Open"],["won","Won"],["lost","Lost"]],F.status)}
        ${sel("conf","Confidence",[["","Every confidence"],...Object.entries(d.confidence()).map(([k,v])=>[k,v.label])],F.conf)}
        ${sel("source","Source",[["","Every source"],...srcs.map(s=>[s,s])],F.source)}
        ${sel("order","Order type",[["","Every order type"],...orders.map(o=>[o,o])],F.order)}
      </div>
      <div class="rpt-row toggles">
        ${toggle("unit","Measure",[["value","Dollars"],["volume","Tonnes"]],F.unit)}
        ${toggle("weight","Weighting",[["gross","Gross"],["weighted","Weighted"]],F.weight)}
        ${toggle("history","Imported history",[["include","Include"],["exclude","Exclude"]],F.history)}
        ${toggle("cume","Time series",[["period","Per period"],["cumulative","Cumulative"]],F.cume)}
        <button type="button" class="btn ghost sm rpt-reset" onclick="rptReset()">Reset all</button>
      </div>
      <div class="rpt-state">
        <b>${S.rows.length} of ${deals.length} deals</b> ·
        window <b>${d.esc(fmtWin(w))}</b> ·
        dated by <b>${d.esc(basisLabel())}</b> ·
        measured in <b>${d.esc(measureLabel())}</b> ·
        ${S.cw?`compared with <b>${d.esc(fmtWin(S.cw))}</b>`:d.esc(compareCaption(S))}
      </div>
      ${created&&createdSpread?`<div class="rpt-flag"><b>Every deal in the book carries the same created date, ${d.esc(createdSpread)}.</b> That is the timestamp the stage 1 migration stamped on the imported rows, not the day the deals were opened. Dating by creation therefore puts the whole book in one day and every window except one is empty. Use close date until deals are created through this app.</div>`:""}
      ${F.unit==="volume"&&nonMt(S.rows).length?`<div class="rpt-flag"><b>${nonMt(S.rows).length} of ${S.rows.length} deals in this selection are not priced by the tonne</b> and count as zero volume. They sell by the ${d.esc([...new Set(nonMt(S.rows).map(x=>x.uom))].join(", ")||"unit")}, and adding units to tonnes would produce a number with no dimension. Switch to Dollars to include them.</div>`:""}
      ${F.history==="exclude"?`<div class="pdim rpt-note">Imported history excluded: ${d.deals().filter(x=>String(x.origin||"")==="seed").length} rows with origin "seed" are out of every figure on this page.</div>`:""}
    </div>`;
  }

  /* ---------------------------------------------------------------- the card shell
     Every report gets a title, a subtitle, a body and an export. The export is not
     optional and is not passed as a maybe: a report with no export button is a report
     somebody screenshots into an email. */
  let EXPORTS={};
  window.rptExport = id => { const f=EXPORTS[id]; if(f) f(); };
  function card(title, sub, body, exporter){
    const d=D();
    const id=slug(title);
    if(exporter) EXPORTS[id]=exporter;
    return `<div class="card rpt-card">
      <div class="rpt-chead">
        <div><h3>${d.esc(title)}</h3><p class="pdim">${d.esc(sub)}</p></div>
        ${exporter?`<button type="button" class="btn sm" onclick="rptExport('${id}')">Export</button>`:""}
      </div>
      ${body}
    </div>`;
  }

  /* ---------------------------------------------------------------- the section */
  function inner(){
    const d=D();
    if(!d) return `<h1 class="pipe-h">Reports</h1><p class="rpt-flag">pipeline.js did not load, so there is no book of business to report on.</p>`;
    EXPORTS={};
    let S;
    try{ S=selection(); }
    catch(e){
      console.error("[reports] selection failed",e);
      return `<h1 class="pipe-h">Reports</h1><p class="rpt-flag">The filter could not be applied: ${d.esc(e&&e.message)}. Press Reset all. <button type="button" class="btn sm" onclick="rptReset()">Reset all</button></p>`;
    }
    const list=REPORTS();
    const cur=list.find(r=>r[0]===F.report)||list[0];
    const tabs=list.map(([k,l])=>`<span class="pill${k===cur[0]?" active":""}" onclick="rptReport('${k}')">${d.esc(l)}</span>`).join("");
    let bodyHtml;
    try{ bodyHtml=cur[2](S); }
    catch(e){
      console.error("[reports] report failed",e);
      bodyHtml=`<div class="card"><p class="rpt-flag">${d.esc(cur[1])} could not be drawn: ${d.esc(e&&e.message)}. The other reports are unaffected.</p></div>`;
    }
    const snap=d.snapshot();
    return `<h1 class="pipe-h">Reports</h1>
      <p class="page-sub">Every figure here states the question it answers: the window, the date it is measured on, and whether it is dollars or tonnes, gross or weighted. Change any of those and the number changes, which is the point.</p>
      ${filterBar(S)}
      ${headline(S)}
      <div class="pipe-tabs rpt-tabs">${tabs}</div>
      ${bodyHtml}
      <p class="pdim rpt-foot">Deals and contacts are live from D1 through the shared store. The phone feed is live from /api/activity. Campaign figures are a dated snapshot and say their date on the card. ${snap?`The imported book was pulled from SIBRA on ${d.esc(snap)}.`:""}</p>`;
  }

  function rReports(){ return `<section class="section" id="sec-reports">${inner()}</section>`; }

  window.REPORTS_UI = { rReports, _internals:{ windowOf, compareWindow, measure, lineOf, selection, get F(){return F;}, set F(v){F=v;}, DEFAULTS, delta, REPORTS, REPORTS_ALL } };
})();
