/* ============ Progreaux Sales OS: app shell and renderers ============ */
const $ = (s,el=document)=>el.querySelector(s);
const esc = s => String(s??"").replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;").replace(/'/g,"&#39;");
const nl = s => esc(s).replace(/\n/g,"<br>");

/* rerender() rebuilds from live state while preserving the section and scroll the user was looking at. */
function rerender(){
  const y = window.scrollY;
  const id = (location.hash || "#" + NAV[0].items[0].id).slice(1);
  render();
  go(id, { keepScroll:true });   // restore the active section without jumping to top
  window.scrollTo(0, y);
}

/* ---- toast + copy ---- */
function toast(msg="Copied to clipboard"){const t=$("#toast");t.textContent=msg;t.classList.add("show");setTimeout(()=>t.classList.remove("show"),1400);}
function copyText(txt){navigator.clipboard?.writeText(txt).then(()=>toast()).catch(()=>toast("Copy failed"));}
/* Product facts come from OUTREACH.facts, the single canonical block. Literal fallback keeps the page rendering if outreach-data.js is missing. */
const F = (typeof OUTREACH !== "undefined" && OUTREACH.facts) || {};
const BIOCHAR_INVENTORY_TONS = F.inventoryMt ?? 80;
const BIOCHAR_INVENTORY_LINE = `${BIOCHAR_INVENTORY_TONS} metric tons of finished 100% biochar, ready to sell right now. Biochar is bulk-capable today: samples open the door, this tonnage moves now.`;
window.copyEl = id => { const e=document.getElementById(id); if(e) copyText(e.dataset.raw||e.textContent); };

/* ---- helpers ---- */
const tier = t => { const p=DATA.proofTiers.find(x=>x.t===t); return `<span class="proof proof-${t}" title="${esc(p?.name||'')}">T${t}</span>`; };
function table(headers,rows){
  return `<div class="tbl-wrap"><table><thead><tr>${headers.map(h=>`<th>${h}</th>`).join("")}</tr></thead>
  <tbody>${rows.map(r=>`<tr>${r.map(c=>`<td>${c}</td>`).join("")}</tr>`).join("")}</tbody></table></div>`;
}
let SID=0;
function script(label,body){
  const id="scr"+(SID++);
  return `<div class="script"><span class="lbl">${esc(label)}</span>
  <button class="copy" onclick="copyEl('${id}')">Copy</button>
  <span id="${id}" data-raw="${esc(body)}">${nl(body)}</span></div>`;
}

/* ================= NAV ================= */
/* Four groups. Work first: Leads is the landing screen. Measure answers whether it is working.
   Execute holds the two copy editors. Reference is static reading. History is in git. */
const LEAN_NAV=[
  {group:"Work",items:[
    {id:"leads",t:"Leads"},
    {id:"crm",t:"Pipeline"},
    {id:"inbox",t:"Inbox"},
    {id:"today",t:"Today"},
  ]},
  {group:"Measure",items:[
    {id:"summary",t:"Daily Report"},
    {id:"reports",t:"Reports"},
    {id:"systems",t:"Data Feeds"},
  ]},
  {group:"Execute",items:[
    {id:"coldemail",t:"Cold Email"},
    {id:"nurture",t:"Nurture Plan"},
  ]},
  {group:"Reference",items:[
    {id:"reference",t:"Reference"},
  ]},
];
const NAV = LEAN_NAV;

/* ================= THE ROSTER, LOADED LATE =================
   roster-data.js is 2.1 MB, so it is fetched on demand (go() into a section that reads it, search, or an idle warm) instead of blocking first paint. Modules that cache roster-derived values must register a bust hook in rosterReady(). */
let ROSTER_PROMISE=null;
const ROSTER_SECTIONS=new Set(["leads","crm","reports","reference"]);
function ensureRoster(){
  if(window.ROSTER) return Promise.resolve(true);
  if(ROSTER_PROMISE) return ROSTER_PROMISE;
  ROSTER_PROMISE=new Promise(resolve=>{
    const el=document.createElement("script");
    /* The stamp is written into a data attribute on the placeholder in index.html by
       scripts/stamp-assets.mjs, the same pass that stamps every other ?v=. Reading it from
       there rather than hardcoding it keeps the cache busting correct: assets are served
       immutable for a year, so a roster fetched without the current hash would be a stale
       file that looks live. */
    const stamp=document.getElementById("rosterSrc");
    el.src=(stamp&&stamp.getAttribute("data-src"))||"roster-data.js";
    el.async=true;
    el.onload=()=>{ rosterReady(); resolve(true); };
    el.onerror=()=>{
      console.warn("[roster] failed to load; roster derived counts will use their fallbacks");
      ROSTER_PROMISE=null;      // a dropped connection should not disable the roster forever
      resolve(false);
    };
    document.head.appendChild(el);
  });
  return ROSTER_PROMISE;
}
/* Every module that caches something derived from the roster clears it here. Guarded
   individually so one missing module cannot stop the others being busted. */
function rosterReady(){
  for(const bust of [window.pipeRosterBust]){
    try{ if(typeof bust==="function") bust(); }catch(e){ console.warn("[roster] bust failed",e); }
  }
  try{ rerender(); }catch(e){ console.warn("[roster] re render failed",e); }
  const cur=(location.hash||"").slice(1);
  if(cur) go(cur,{keepScroll:true});
}

function buildNav(){
  $("#nav").innerHTML = NAV.map(g=>`<div class="nav-group">${g.group}</div>`+
    g.items.map(i=>`<a data-id="${i.id}" onclick="go('${i.id}')">${i.t}</a>`).join("")
  ).join("");
}
const titleOf = id => NAV.flatMap(g=>g.items).find(i=>i.id===id)?.t||"";

function go(id, opts={}){
  /* Opening a section that reads the roster is the signal to fetch it. Deliberately not
     awaited: the section renders now from whatever it has, and re renders when the roster
     lands. Blocking the nav on a 2.1 MB parse would move the stall from load to every
     single click, which is worse, not better. */
  if(ROSTER_SECTIONS.has(id)) ensureRoster();
  document.querySelectorAll(".section").forEach(s=>s.classList.remove("active"));
  const sec=document.getElementById("sec-"+id); if(sec)sec.classList.add("active");
  document.querySelectorAll(".nav a").forEach(a=>a.classList.toggle("active",a.dataset.id===id));
  $("#topbarTitle").textContent=titleOf(id);
  $("#sidebar").classList.remove("open");
  // keepScroll is for re-renders in place (ticking a checkbox), where jumping to the top
  // would throw away the user's position mid-list.
  if(!opts.keepScroll) window.scrollTo(0,0);
  location.hash=id;
}

/* ================= RENDERERS ================= */
function page(id,inner){return `<section class="section" id="sec-${id}">${inner}</section>`;}
function head(t,sub){return `<h1 class="page-h">${t}</h1><p class="page-sub">${sub}</p>`;}
function sec(num,t){return `<h2 class="sec"><span class="num">${num}</span>${t}</h2>`;}

/* --- Messaging --- */
function rMessaging(){
  const m=DATA.messaging;
  const accent=id=>id==="absorbent"?"var(--blue)":"var(--green-bright)";
  const trackBlock=t=>`<div class="card pad-lg" style="border-top:3px solid ${accent(t.id)};margin-bottom:16px">
    <div style="display:flex;align-items:baseline;gap:10px;flex-wrap:wrap">
      <h3 style="margin:0;color:${accent(t.id)}">${esc(t.product)}</h3>
      <span class="badge badge-muted">${esc(t.audience)}</span>
    </div>
    <div class="note" style="margin:10px 0"><b>Avatar:</b> ${esc(t.avatar)}</div>
    <p style="color:var(--text);font-size:13.5px;line-height:1.6"><b style="color:${accent(t.id)}">Positioning:</b> ${esc(t.positioning)}</p>
    <div class="card" style="margin:10px 0"><h4>One-liner</h4><p style="color:var(--text)">${esc(t.oneLiner)}</p></div>
    <div class="grid g2">
      <div class="card">${script(t.product+", 30-second pitch",t.pitch30)}</div>
      <div class="card">${script(t.product+", 90-second pitch",t.pitch90)}</div>
    </div>
    <div class="grid g2" style="margin-top:10px">
      <div><b style="font-size:11px;color:var(--green-bright)">Proof to use</b><ul>${t.proof.map(p=>`<li>${esc(p)}</li>`).join("")}</ul></div>
      <div><b style="font-size:11px;color:var(--red-soft)">NEVER say in this pitch</b><ul>${t.neverSay.map(p=>`<li>${esc(p)}</li>`).join("")}</ul></div>
    </div>
  </div>`;
  const tBiochar=m.tracks.find(t=>t.id==="biochar");
  const tAbsorbent=m.tracks.find(t=>t.id==="absorbent");
  return page("messaging",
    head("Value Proposition & Messaging","TWO separate avatars, every pitch is single-product. BIOCHAR IS PRIORITY #1, 80 MT of finished inventory is ready to ship now, and it sells to ag/soil/grower buyers. Absorbent Pellets are the secondary track for industrial/EHS/spill buyers. Different person, different pain, different proof.")+
    `<div class="note ok"><b>Priority 1, Biochar:</b> ${BIOCHAR_INVENTORY_LINE}</div>`+
    `<div class="note warn"><b>Split rule:</b> ${esc(m.splitRule)}</div>`+
    sec("","Track A, 100% Biochar (PRIORITY, 80 MT available now)")+trackBlock(tBiochar)+
    sec("","Track B, Absorbent Pellets (secondary / industrial)")+trackBlock(tAbsorbent)+
    sec("","Comparison messaging (use only within the matching track)")+
    table(["Positioned against","Why we win"],m.comparisons.map(c=>[`<strong>${esc(c.vs)}</strong>`,esc(c.win)]))+
    sec("","Proof-point map (claim safety, both products)")+
    `<p class="lead">Match every claim to its tier. Use the safe wording. Avoid the risky wording, it creates legal & credibility exposure.</p>`+
    table(["Claim","Tier","Buyer relevance","Source","Safe wording","Avoid"],m.proofMap.map(p=>[
      `<strong>${esc(p.claim)}</strong>`,tier(p.tier),esc(p.rel),esc(p.src),
      `<span style="color:var(--green-bright)">${esc(p.safe)}</span>`,`<span style="color:var(--red-soft)">${esc(p.risk)}</span>`]))
  );
}

/* --- Biochar specs, data & avatars --- */
function rBiochar(){
  const b=DATA.biochar;
  const avatarCard=a=>`<div class="card pad-lg" style="border-top:3px solid var(--green-bright);margin-bottom:14px">
    <div style="display:flex;align-items:baseline;gap:10px;flex-wrap:wrap">
      <h4 style="margin:0;color:var(--green-bright)">${esc(a.name)}</h4>
      <span class="badge badge-muted">${esc(a.who)}</span>
    </div>
    <div style="font-size:12.8px;display:grid;gap:5px;margin-top:8px">
      <div><b style="color:var(--red-soft)">Pain:</b> ${esc(a.pain)}</div>
      <div><b style="color:var(--green-bright)">Angle (lead with this):</b> ${esc(a.angle)}</div>
      <div><b style="color:var(--gold-soft)">Proof to lead:</b> ${esc(a.lead)}</div>
      <div><b style="color:var(--text)">Sample use-case:</b> ${esc(a.sample)}</div>
      ${a.claim?`<div class="note warn" style="margin:4px 0 0">Claim limit: ${esc(a.claim)}</div>`:""}
    </div>
  </div>`;
  return page("biochar",
    head("Biochar, Specs, Data & Avatars","Biochar is the dynamic product: one material, MANY buyers. Full spec, benefit-by-mechanism, industry comparisons, and a differentiated avatar for each buyer type. Pull the ONE benefit + comparison that fits the buyer in front of you.")+
    `<div class="card pad-lg"><p style="color:var(--text);font-size:13.5px;line-height:1.6">${esc(b.intro)}</p></div>`+
    sec("","Technical spec sheet")+
    table(["Property","Value"],b.spec.map(r=>[`<strong>${esc(r[0])}</strong>`,esc(r[1])]))+
    sec("","Benefits by mechanism, match to the avatar")+
    table(["Mechanism","What it does","Best for","Tier"],b.benefits.map(x=>[
      `<strong>${esc(x.mech)}</strong>`,esc(x.b),`<span style="color:var(--gold-soft)">${esc(x.who)}</span>`,tier(x.tier)]))+
    sec("","Industry comparisons, how biochar stacks up")+
    b.comparisons.map(c=>`<h3 class="sub">${esc(c.h)}</h3>`+table(c.cols.map(h=>esc(h)),c.rows.map(r=>r.map(x=>esc(x))))).join("")+
    sec("","Biochar avatars, one material, differentiated per buyer")+
    `<p class="lead">Absorbent Pellets have one industrial avatar; biochar sells across all of these. Each gets a different lead benefit and a different claim boundary, never a generic biochar pitch.</p>`+
    b.avatars.map(avatarCard).join("")+
    sec("","Claim guardrails")+
    `<div class="note warn"><ul>${b.guardrails.map(g=>`<li>${esc(g)}</li>`).join("")}</ul></div>`
  );
}





/* --- Windrow trial protocol (composter closing asset) --- */
function rWindrow(){
  const w=DATA.windrowTrial;
  const sampleRows=[
    ["0","___","118","120","55","54","N","Build day, baseline"],
    ["3","___","135","148","54","54","Y","Treatment heating faster"],
    ["7","___","150","158","52","53","Y","Both thermophilic"],
    ["…","___","…","…","…","…","…","…"],
  ];
  return sec("","Windrow Trial Protocol, composter closing asset")+
    `<div class="note ok"><b>Purpose:</b> ${esc(w.goal)}</div>`+
    `<div class="grid g2">
      <div class="card"><h4>Trial design (A/B)</h4><p>${esc(w.design)}</p></div>
      <div class="card"><h4>Biochar dose rates</h4>
        ${table(["Rate","When to use","Note"],w.doses.map(d=>[`<strong>${esc(d.r)}</strong>`,esc(d.use),esc(d.note)]))}
      </div>
    </div>`+
    `<h3 class="sub">Run-of-show (steps)</h3>
     <div class="card"><ol style="padding-left:18px;color:var(--text-dim);font-size:12.8px">${w.steps.map(s=>`<li style="padding:3px 0">${esc(s)}</li>`).join("")}</ol></div>`+
    `<h3 class="sub">What to measure</h3>`+
    table(["Metric","Why it matters","How to measure"],w.measure.map(m=>[`<strong>${esc(m.m)}</strong>`,esc(m.why),esc(m.how)]))+
    `<h3 class="sub">Printable daily data-capture sheet</h3>
     <p class="lead">Leave this on-site. The filled sheet + one-line ROI is the closing artifact.</p>`+
    table(w.dataCols, sampleRows.map(r=>r.map((c,i)=>i===0?`<strong>${esc(c)}</strong>`:esc(c))))+
    `<div class="grid g2">
      <div class="note ok" style="margin:12px 0"><b>Success criteria:</b> ${esc(w.success)}</div>
      <div class="note" style="margin:12px 0"><b>Days-saved → revenue:</b> ${esc(w.roiBridge)}</div>
    </div>`+
    `<h3 class="sub">Guardrails (protect the result)</h3>
     <div class="card"><ul>${w.guardrails.map(g=>`<li>${esc(g)}</li>`).join("")}</ul></div>`+
    `<div class="note warn"><b>Deliverable:</b> ${esc(w.deliverable)}</div>`+
    windrowCopy(w);
}
function windrowCopy(w){
  const txt=`WINDROW TRIAL PROTOCOL, Biochar vs Control
Goal: ${w.goal}

DESIGN: ${w.design}

DOSE (treatment): default 10% by volume (options: 5% / 10% / 15-20%)

STEPS:
${w.steps.map((s,i)=>`${i+1}. ${s}`).join("\n")}

MEASURE:
${w.measure.map(m=>`- ${m.m}: ${m.how} (${m.why})`).join("\n")}

DAILY DATA SHEET COLUMNS:
${w.dataCols.join(" | ")}

SUCCESS: ${w.success}

ROI: ${w.roiBridge}

GUARDRAILS:
${w.guardrails.map(g=>`- ${g}`).join("\n")}`;
  const id="wintxt";
  return `<div class="script"><span class="lbl">Copy full protocol (paste into a doc / email)</span>
    <button class="copy" onclick="copyEl('${id}')">Copy</button>
    <span id="${id}" data-raw="${esc(txt)}">${nl(txt)}</span></div>`;
}

/* --- Collateral --- */
function rCollateral(){
  return page("collateral",
    head("Collateral and Objections","Sample request workflow, the windrow trial protocol, and the objection battlecard.")+
    sec("","Sample request workflow")+
    `<div class="grid g2">
      <div class="card"><h4>Sizes & gates</h4><b style="font-size:11.5px;color:var(--gold-soft)">Sizes</b><ul>${DATA.sample.sizes.map(s=>`<li>${esc(s)}</li>`).join("")}</ul>
        <b style="font-size:11.5px;color:var(--gold-soft)">Qualification gates</b><ul>${DATA.sample.gates.map(s=>`<li>${esc(s)}</li>`).join("")}</ul></div>
      <div class="card"><h4>Form fields & follow-up</h4><b style="font-size:11.5px;color:var(--gold-soft)">Fields</b><ul>${DATA.sample.fields.map(s=>`<li>${esc(s)}</li>`).join("")}</ul>
        <b style="font-size:11.5px;color:var(--gold-soft)">Follow-up cadence</b><ul>${DATA.sample.follow.map(s=>`<li>${esc(s)}</li>`).join("")}</ul></div>
    </div>`+
    `<div class="note ok"><b>Success =</b> ${esc(DATA.sample.success)}</div>`+
    rWindrow()+
    sec("","Objection-handling battlecard")+
    `<div class="accordion">${DATA.objections.map((o,i)=>`
      <div class="acc-h" onclick="accToggle(${i})"><span>${esc(o.o)}</span><span class="chev">▸</span></div>
      <div class="acc-b" id="acc-${i}">
        <div class="card" style="margin-top:6px">
          <div style="font-size:12.5px;display:grid;gap:5px">
            <div><b style="color:var(--gold-soft)">What they really mean:</b> ${esc(o.mean)}</div>
            <div><b style="color:var(--green-bright)">Best response:</b> ${esc(o.resp)}</div>
            <div><b style="color:var(--text)">Proof to send:</b> ${esc(o.proof)}</div>
            <div><b style="color:var(--text)">Next question:</b> ${esc(o.next)}</div>
            <div><b style="color:var(--red-soft)">Disqualify if:</b> ${esc(o.disq)}</div>
          </div>
        </div>
      </div>`).join("")}</div>`
  );
}
window.accToggle=i=>{const b=document.getElementById("acc-"+i);const h=b.previousElementSibling;b.classList.toggle("open");h.classList.toggle("open-h");};


/* --- Playbook --- */
function rPlaybook(){
  const pb=DATA.playbook;
  return page("playbook",
    head("Sales Playbook","Operating principles, qualification, discovery scripts, proof-demo motion, proposal & close, and the fulfillment handoff.")+
    sec("","Operating principles")+
    `<div class="grid g2">${pb.principles.map(p=>`<div class="card"><p style="color:var(--text)">→ ${esc(p)}</p></div>`).join("")}</div>`+
    sec("","Qualification, "+esc(pb.qual.framework.split(":")[0]))+
    `<div class="note">${esc(pb.qual.framework)}</div>`+
    `<div class="card"><ul>${pb.qual.criteria.map(c=>`<li>${esc(c)}</li>`).join("")}</ul></div>`+
    sec("","Discovery questions by area")+
    `<div class="grid g2">${pb.discovery.groups.map(g=>`<div class="card"><h4>${esc(g.g)}</h4><ul>${g.q.map(q=>`<li>${esc(q)}</li>`).join("")}</ul></div>`).join("")}</div>`+
    sec("","Proof-demo motion (no SaaS demo needed)")+
    `<div class="card"><ol style="padding-left:18px;color:var(--text-dim);font-size:12.8px">${pb.proofDemo.map(s=>`<li style="padding:3px 0">${esc(s)}</li>`).join("")}</ol></div>`+
    sec("","Proposal & close")+
    `<div class="grid g2">
      <div class="card"><h4>Before you propose</h4><ul>${pb.proposal.need.map(x=>`<li>${esc(x)}</li>`).join("")}</ul>
        <h4 style="margin-top:10px">Proposal structure</h4><ul>${pb.proposal.structure.map(x=>`<li>${esc(x)}</li>`).join("")}</ul></div>
      <div class="card"><h4>Closing process</h4><ul>${pb.close.map(x=>`<li>${esc(x)}</li>`).join("")}</ul>
        <h4 style="margin-top:10px">Expansion / renewal</h4><ul>${pb.expansion.map(x=>`<li>${esc(x)}</li>`).join("")}</ul></div>
    </div>`+
    sec("","Fulfillment & MRV handoff")+
    `<div class="card"><ul>${pb.handoff.map(x=>`<li>${esc(x)}</li>`).join("")}</ul></div>`+
    `<div class="note warn"><b>Capture MRV data at delivery</b> (application, site/GPS, weights), no data, no carbon credit. This is the link between the product sale and the carbon revenue.</div>`
  );
}

/* ================= REFERENCE =================
   One section, two tabs of static reading material. Tab state is not persisted: opening it shows the top of it. */
let REF_TAB = "product";
const REF_TABS = [
  ["product","Product & Messaging"],
  ["playbook","Collateral & Playbook"],
];
window.refTab = id => {
  REF_TAB = id;
  document.querySelectorAll("#sec-reference .ref-pane").forEach(p=>p.classList.toggle("active",p.dataset.tab===id));
  document.querySelectorAll("#sec-reference .pipe-tabs .pill").forEach(b=>b.classList.toggle("active",b.dataset.tab===id));
};
function rReference(){
  /* Every pane is rendered and CSS shows the active one, so a test that greps this reads both panes. Cut by data-tab. */
  const panes = {
    product:  [rBiochar, rMessaging],
    playbook: [rCollateral, rPlaybook],
  };
  const body = REF_TABS.map(([id,label])=>
    `<div class="ref-pane${id===REF_TAB?" active":""}" data-tab="${id}">${panes[id].map(stripBody).join(mergeDiv)}</div>`
  ).join("");
  return `<section class="section" id="sec-reference">
    <h1 class="page-h">Reference</h1>
    <p class="page-sub">What the product is, what to say about it, and how to handle objections. Static reading, no live records.</p>
    <div class="pipe-tabs">${REF_TABS.map(([id,label])=>
      `<span class="pill${id===REF_TAB?" active":""}" data-tab="${id}" onclick="refTab('${id}')">${label}</span>`).join("")}</div>
    ${body}
  </section>`;
}

function stripBody(fn){
  let h="";
  try{ h=fn()||""; }catch(e){ console.error("renderer failed:",e&&e.message,e); return ""; }
  return h.replace(/^\s*<section[^>]*>/,"").replace(/<\/section>\s*$/,"");
}
/* Pipeline module (pipeline.js loads before app.js). A missing file degrades one section to empty. */
const PL = k => (window.PIPELIVE && PIPELIVE[k]) ? PIPELIVE[k] : (()=> "");
/* Reports module (reports.js). Same fail-soft shape. */
const RPT = k => (window.REPORTS_UI && REPORTS_UI[k]) ? REPORTS_UI[k] : (()=> "");
/* Daily summary and systems map (summary.js). Same fail-soft shape as the others. */
const SUM = k => (window.SUMMARY_UI && SUMMARY_UI[k]) ? SUMMARY_UI[k] : (()=> "");
/* Copy editors (copy-editor.js, then coldemail.js and nurture.js). Same fail-soft shape. */
const COLD = k => (window.COLDEMAIL_UI && COLDEMAIL_UI[k]) ? COLDEMAIL_UI[k] : (()=> "");
const NUR = k => (window.NURTURE_UI && NURTURE_UI[k]) ? NURTURE_UI[k] : (()=> "");
const mergeDiv = `<div class="hr" style="margin:26px 0 18px;opacity:.5"></div>`;
/* newId → ordered list of renderer thunks it composes */
function compose(id, thunks){
  return page(id, thunks.map(stripBody).join(mergeDiv));
}

/* Render order, not nav order. */
const LEAN_SECTIONS=[
  ["leads",    [PL("rLeads")]],
  ["crm",      [PL("rCRM")]],
  ["inbox",    [PL("rInbox")]],
  ["today",    [PL("rToday")]],
  ["summary",  [SUM("rSummary")]],
  ["reports",  [RPT("rReports")]],
  ["systems",  [SUM("rSystems")]],
  ["coldemail",[COLD("rColdEmail")]],
  ["nurture",  [NUR("rNurture")]],
  ["reference",[rReference]],
];

function render(){
  $("#content").innerHTML = LEAN_SECTIONS.map(([id,thunks])=>compose(id,thunks)).join("");
}
buildNav();
render();
/* ================= GLOBAL SEARCH, the shell =================
   The matching lives in pipeline.js, beside the records and the norm() fold that decides two
   spellings are one company (see the block above PIPELIVE.data). This is only the overlay:
   open it, type, arrow through, enter. Reachable from every section, which is the entire
   point, since the four boxes it replaces each only searched the table they sat in. */
function openSearch(){
  if(document.getElementById("gsWrap")) return;
  const wrap=document.createElement("div");
  wrap.id="gsWrap"; wrap.className="gs-wrap";
  wrap.innerHTML=`<div class="gs-panel" role="dialog" aria-label="Search">
      <input id="gsInput" class="gs-input" type="search" autocomplete="off" spellcheck="false"
             placeholder="Search accounts, contacts, deals and leads" aria-label="Search" />
      <div class="gs-results" id="gsResults"></div>
      <div class="gs-foot">Enter opens the top result · Esc closes</div>
    </div>`;
  wrap.addEventListener("click", e => { if(e.target===wrap) closeSearch(); });
  document.body.appendChild(wrap);
  const input=document.getElementById("gsInput");
  const paint=()=>{
    const el=document.getElementById("gsResults");
    if(!el) return;
    el.innerHTML = (window.PIPELIVE && PIPELIVE.data)
      ? window.pipeSearchResults(input.value)
      : `<p class="gs-hint">The record store did not load, so there is nothing to search. Reload the page, then check Data Feeds.</p>`;
  };
  input.addEventListener("input", paint);
  input.addEventListener("keydown", e => {
    if(e.key==="Escape"){ closeSearch(); return; }
    if(e.key==="Enter"){
      const first=document.querySelector("#gsResults .gs-row");
      if(first) first.click();
    }
  });
  /* Opening the search is the one moment we KNOW the person is looking for a company by
     name, and the roster is where 1,145 of the ~1,200 names live. Kick the lazy load here
     rather than making them find nothing and retype. */
  ensureRoster().then(paint);
  paint();
  input.focus();
}
function closeSearch(){ const n=document.getElementById("gsWrap"); if(n) n.remove(); }
window.openSearch=openSearch; window.closeSearch=closeSearch;
/* "/" is the search key everywhere else a person works, so it is the search key here. Ignored
   while a field has focus, or typing a slash into a note would open the overlay instead. */
document.addEventListener("keydown", e => {
  const t=e.target||{};
  const typing = /^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName||"") || t.isContentEditable;
  if(e.key==="/" && !typing && !e.metaKey && !e.ctrlKey){ e.preventDefault(); openSearch(); }
  if(e.key==="k" && (e.metaKey||e.ctrlKey)){ e.preventDefault(); openSearch(); }
});

/* ================= THEME =================
   Three states, cycled in this order: system, light, dark.

   SYSTEM IS THE DEFAULT AND IS A REAL STATE, not the absence of one. A person whose laptop
   flips to dark at sunset should get a dark Sales OS at sunset without touching anything, and
   that only works if "I have not chosen" is distinguishable from "I chose light". So: no
   stored value and no data-theme attribute means system, and styles.css resolves it with
   prefers-color-scheme. Storing a resolved value at first load would freeze whatever the OS
   happened to be at that moment and quietly break the automatic switch forever.

   The attribute is applied by the inline script in index.html, not here. Read the comment
   there for why; the short version is that doing it in this file paints white first.

   No re-render on change. Every colour in the app comes from a role token, so switching the
   attribute restyles the whole document in one repaint and the DOM is untouched. That is the
   payoff for the surface roles: if a card colour were still a literal in a template string,
   a theme change would mean rebuilding the page and losing scroll, focus and any half typed
   filter. */
const THEMES = [
  ["system", "◐", "Theme: matching your system. Click for light."],
  ["light",  "☀", "Theme: light. Click for dark."],
  ["dark",   "☾", "Theme: dark. Click to match your system."],
];
const themeStored = () => {
  try { const v = localStorage.getItem("vej_theme"); return v === "dark" || v === "light" ? v : "system"; }
  catch (e) { return "system"; }
};
function applyTheme(mode){
  const root = document.documentElement;
  if (mode === "system") root.removeAttribute("data-theme");
  else root.setAttribute("data-theme", mode);
  try {
    if (mode === "system") localStorage.removeItem("vej_theme");
    else localStorage.setItem("vej_theme", mode);
  } catch (e) { /* site data blocked: the theme still applies for this page */ }
  const entry = THEMES.find(t => t[0] === mode) || THEMES[0];
  const ic = document.getElementById("themeIc");
  const btn = document.getElementById("themeBtn");
  if (ic) ic.textContent = entry[1];
  if (btn) btn.title = entry[2];
}
window.cycleTheme = () => {
  const i = THEMES.findIndex(t => t[0] === themeStored());
  applyTheme(THEMES[(i + 1) % THEMES.length][0]);
};
applyTheme(themeStored());

/* ================= WHO IS LOOKING, in the corner =================
   Reads the same sales_os_role cookie pipeline.js reads, with the same standing: a hint for
   the screen. It is shown because a person who cannot see a Delete button should be able to
   find out why without asking, and because "which account am I logged in as" is otherwise
   unanswerable from inside the app. */
(function(){
  const chip=document.getElementById("roleChip");
  if(!chip) return;
  const role=(window.PIPELIVE && PIPELIVE.data && PIPELIVE.data.role && PIPELIVE.data.role())||"";
  const name=(()=>{ for(const p of String(document.cookie||"").split(";")){
      const i=p.indexOf("="); if(i<0) continue;
      if(p.slice(0,i).trim()==="sales_os_name") return decodeURIComponent(p.slice(i+1).trim());
    } return ""; })();
  if(!role && !name) return;
  chip.hidden=false;
  chip.textContent = name ? `${name} · ${role||"unknown role"}` : role;
  chip.title = role==="admin"||role==="dev"
    ? "This account may read, write, delete and manage access."
    : role==="manager"
      ? "This account may read, write records and send outbound. Deleting and managing access are admin only, and controls for them are hidden."
      : "This account's role was not recognised, so anything beyond reading is hidden.";
  chip.className="role-chip r-"+(role||"unknown");
})();

/* Belt and braces: start the roster after first paint even if the landing section does not
   need it, so it is warm by the time anyone opens search or Leads. requestIdleCallback where
   it exists, because this is the definition of work that should yield to anything real. */
if(typeof window!=="undefined"){
  const warm=()=>ensureRoster();
  if(typeof requestIdleCallback==="function") requestIdleCallback(warm,{timeout:2500});
  else setTimeout(warm,300);
}
$("#menuBtn").addEventListener("click",()=>$("#sidebar").classList.toggle("open"));
const defaultId = NAV[0].items[0].id;
const isNavId = id => NAV.flatMap(g=>g.items).some(i=>i.id===id);
/* Old bookmarks: sections that were folded into another one. */
const RETIRED = { product:["reference","product"], playbook:["reference","playbook"], funnels:["reference","product"],
  launch:["crm"], daily:["today"], instantly:["coldemail"], outreach:["coldemail"], campaigns:["coldemail"],
  engine:["coldemail"], crumble:["leads"] };
function resolve(id){
  if(isNavId(id)) return id;
  const r=RETIRED[id];
  if(r){ REF_TAB = r[1]; return r[0]; }
  return null;
}
const start=resolve((location.hash||"").slice(1));
go(start||defaultId);
/* go() writes location.hash on every nav, so without this Back/Forward changes the URL and
   nothing else. Re-setting the hash to its current value does not re-fire hashchange, so
   calling go() from here cannot loop. */
window.addEventListener("hashchange", () => {
  const id = resolve((location.hash||"").slice(1));
  if(id){ if(id==="reference") refTab(REF_TAB); go(id); }
});

/* ---------------------------------------------------------------- live Instantly
   A Pages Function holds the key server side. The response
   is the SAME SHAPE as instantly-data.js because both go through shapeInstantly(), so this
   can be dropped straight onto window.INSTANTLY_LIVE and the page re-rendered with no
   branching anywhere in the renderers.

   The snapshot paints first and this replaces it a moment later. That is only safe because
   the shapes match; if they ever diverge the numbers would appear to change meaning after
   load, which is why the shaper is shared rather than copied. */
let instantlyLiveTried = false;
async function loadInstantlyLive() {
  if (instantlyLiveTried) return;
  instantlyLiveTried = true;

  let d;
  try {
    const res = await fetch("api/instantly", { headers: { Accept: "application/json" } });
    if (!res.ok) return;                 // 404 on a static host: the normal local case
    d = await res.json();
  } catch { return; }
  if (!d || d.ok !== true || typeof d.inWorkspace !== "number") return;

  const before = window.INSTANTLY_LIVE ? JSON.stringify(window.INSTANTLY_LIVE.totals) : null;
  window.INSTANTLY_LIVE = d;

  /* Only repaint if something actually moved. A gratuitous re-render loses scroll position
     and any open accordion for no gain, and most loads land on an unchanged workspace. */
  if (before !== JSON.stringify(d.totals) || !before) {
    const current = (location.hash || "").slice(1) || NAV[0].items[0].id;
    if (["crm", "systems", "reports", "summary"].includes(current)) rerender();
  }
}

/* ---------------------------------------------------------------- live Apollo
   Deliberately thin. Apollo exposes no credit balance to this key, so the only thing that can
   honestly be read live is whether the key still works (functions/api/apollo.js). The
   spend figures on screen stay receipt-based. This exists to catch a rotated or revoked key,
   which is otherwise invisible until the next reveal run fails. */
async function loadApolloLive() {
  let d;
  try {
    const res = await fetch("api/apollo", { headers: { Accept: "application/json" } });
    if (!res.ok) return;
    d = await res.json();
  } catch { return; }
  if (!d || d.ok !== true || d.keyValid !== false) return;   // silent unless the key is DEAD

  APOLLO_DEAD = d;
  mountApolloWarn();
}

/* The dead-key warning mounts on Pipeline and Data Feeds, and is re-mounted after a section re-renders. */
let APOLLO_DEAD = null;
function mountApolloWarn() {
  if (!APOLLO_DEAD) return;
  for (const hostId of ["sec-crm", "sec-systems"]) {
    const host = document.getElementById(hostId);
    if (!host || host.querySelector(".apollo-key-warn")) continue;
    const warn = document.createElement("div");
    warn.className = "note warn apollo-key-warn";
    warn.style.marginTop = "10px";
    warn.innerHTML = `<b>The Apollo key is not working.</b> ${esc(APOLLO_DEAD.keyDetail || "Apollo rejected it.")}
      Credit figures on this page are from our own receipts and are still accurate, but no new
      reveal will run until the key is replaced.`;
    host.insertBefore(warn, host.firstChild);
  }
}
window.addEventListener("hashchange", () => setTimeout(mountApolloWarn, 0));
document.addEventListener("click", () => setTimeout(mountApolloWarn, 0));

loadInstantlyLive();
loadApolloLive();
