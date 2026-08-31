/* ============ VEJ Sales OS — app shell & renderers ============ */
const $ = (s,el=document)=>el.querySelector(s);
const esc = s => String(s??"").replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;");
const nl = s => esc(s).replace(/\n/g,"<br>");

/* ---- persistent checklists (localStorage-backed; stays checked across reloads) ---- */
const CHECK_KEY = "vej_checks_v1";
function getChecks(){ try { return JSON.parse(localStorage.getItem(CHECK_KEY)) || {}; } catch(e){ return {}; } }
function setCheck(k,on){ const c=getChecks(); c[k]= on?1:0; try{ localStorage.setItem(CHECK_KEY, JSON.stringify(c)); }catch(e){} }
/* chk(key, labelHTML, def) — labelHTML is trusted HTML; def = default-checked when never touched */
function chk(key, labelHTML, def){ const v=getChecks()[key]; const on = (v===undefined? !!def : !!v) ? " done" : ""; return `<label class="chk${on}" data-k="${esc(key)}" onclick="toggleChk(this)"><span class="box">✓</span><span class="lbl">${labelHTML}</span></label>`; }
function checkStats(keys, defs){ const c=getChecks(); let done=0; keys.forEach((k,i)=>{ const v=c[k]; if(v===undefined? (defs&&defs[i]):v) done++; }); return {done, total:keys.length}; }
/* Counters (per-block progress, the Daily Plan mission bar) are produced by the renderers
   from getChecks(), so they only change when the DOM is rebuilt. Toggling a class and
   writing storage is not enough - without a re-render the mission bar reads 0% forever.
   rerender() rebuilds from live state while preserving what the user was looking at. */
function rerender(){
  const y = window.scrollY;
  const id = (location.hash || "#" + NAV[0].items[0].id).slice(1);
  render();
  go(id, { keepScroll:true });   // restore the active section without jumping to top
  window.scrollTo(0, y);
}
window.toggleChk = el => { const on = !el.classList.contains("done"); el.classList.toggle("done", on); setCheck(el.dataset.k, on); rerender(); };
window.resetChecks = pfx => { const c=getChecks(); Object.keys(c).forEach(k=>{ if(!pfx||k.startsWith(pfx)) delete c[k]; }); localStorage.setItem(CHECK_KEY, JSON.stringify(c)); rerender(); };

/* ---- toast + copy ---- */
function toast(msg="Copied to clipboard"){const t=$("#toast");t.textContent=msg;t.classList.add("show");setTimeout(()=>t.classList.remove("show"),1400);}
function copyText(txt){navigator.clipboard?.writeText(txt).then(()=>toast()).catch(()=>toast("Copy failed"));}
/* Product facts come from OUTREACH.facts, the single canonical block, rather than being
   restated here. This constant used to be the fourth independent declaration of the
   tonnage. Guarded with a literal fallback so the Launchpad still renders if outreach-data.js
   is missing from a partial deployment. */
const F = (typeof OUTREACH !== "undefined" && OUTREACH.facts) || {};
const BIOCHAR_INVENTORY_TONS = F.inventoryMt ?? 80;
const BIOCHAR_INVENTORY_LINE = `${BIOCHAR_INVENTORY_TONS} metric tons of finished 100% biochar, ready to sell right now. Biochar is bulk-capable today: samples open the door, this tonnage moves now.`;
window.copyEl = id => { const e=document.getElementById(id); if(e) copyText(e.dataset.raw||e.textContent); };

/* ---- helpers ---- */
const tier = t => { const p=DATA.proofTiers.find(x=>x.t===t); return `<span class="proof proof-${t}" title="${esc(p?.name||'')}">T${t}</span>`; };
const badge = (txt,cls="badge-muted")=>`<span class="badge ${cls}">${esc(txt)}</span>`;
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
/* One view: the daily-driver sales tool. There used to be a second "BUILD" view holding
   parked strategy modules (TAM/SAM/SOM, barge economics, a CRM schema spec, a metrics
   dashboard) behind build-later.html. It was deleted, not parked: every section in it was
   anchored to a $700/ton biochar price that the live $450/MT site price superseded, so it
   was actively misleading rather than merely idle. The playbook owns the market model now.
   Recoverable from git history if it is ever wanted back, re-derived at live prices. */
/* Ordered by the live motion, not by planning hierarchy: launch the campaigns, send the
   outreach, work the replies in the pipeline. Everything below Execute is reference material
   you open when a specific question comes up, not something you read top to bottom. */
const LEAN_NAV=[
  /* IA v7, 2026-08-31. Rebuilt around what a rep does, not around what the company was
     building. Three changes and each one closes a complaint:

       WORK comes first and Pipeline is the landing screen. You log in to the book of business,
       not to a status page.

       Launchpad is GONE as a section. It was 14 tiles and 9 cards of counts and a launch
       checklist for work that shipped months ago, and none of it was actionable. The six
       numbers worth keeping are a strip across the top of Pipeline; the three that represent
       work carry an accent rail so the eye lands on those.

       Inbox and Today are new, and they are the reason the phone and Instantly work was worth
       doing. Every call, text, reply, policy flag and phone lead now arrives somewhere a person
       looks, instead of in three systems nobody opens.

     Crumble Blitz is deleted: 14,940 lines of crumble-data.js, most of the payload every user
     downloaded on every load, for a push against inventory that is over. The data file and
     module stay in git history.

     Campaigns & ICP moved to Execute, where the operator asked for it: it belongs beside the
     copy and the send, not in a "Launch" group that no longer exists. */
  {group:"Work",items:[
    {id:"crm",ic:"◉",t:"Pipeline"},
    {id:"inbox",ic:"✉",t:"Inbox"},
    {id:"today",ic:"✓",t:"Today"},
  ]},
  {group:"Execute",items:[
    {id:"strategy",ic:"◆",t:"Campaigns & ICP"},
    {id:"outreach",ic:"✦",t:"Outreach Engine"},
    {id:"instantly",ic:"⚙",t:"Instantly Logic"},
  ]},
  {group:"Grow",items:[
    {id:"funnels",ic:"⇢",t:"Future Funnels"},
  ]},
  {group:"Reference",items:[
    {id:"product",ic:"❝",t:"Product & Messaging"},
    {id:"playbook",ic:"▷",t:"Assets & Playbook"},
  ]},
];
const NAV = LEAN_NAV;

function buildNav(){
  $("#nav").innerHTML = NAV.map(g=>`<div class="nav-group">${g.group}</div>`+
    g.items.map(i=>`<a data-id="${i.id}" onclick="go('${i.id}')"><span class="ic">${i.ic}</span>${i.t}</a>`).join("")
  ).join("");
}
const titleOf = id => NAV.flatMap(g=>g.items).find(i=>i.id===id)?.t||"";

function go(id, opts={}){
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

/* ================= LAUNCHPAD =================
   The one page that answers "where are we right now".

   Two previous versions of this page rotted, and both rotted the same way: they stated a
   plan instead of a state. The first was a 30-day calendar of 184 dated checkboxes whose
   dates ran out. The second was a generic pre-send checklist that never knew whether any
   of it had happened.

   So this version states as little as possible in prose and reads as much as possible from
   the data that is actually loaded. Roster size comes from PIPELIVE.stats(), campaign count
   from the canonical ICP list, prices and sample sizes from the facts block. If the roster doubles
   tonight, this page says so tomorrow morning without anyone editing it.

   The rule for adding anything here: if it cannot be derived from live data OR checked off
   by the person doing it, it does not belong on this page. Put it in the playbook. */

/* Projection of OUTREACH.facts under the names the Launchpad renderers already use. The
   values live in exactly one place now; this is a rename, not a second source. */
const LIVE = {
  biocharMt: F.biocharMt,
  absorbentMt: F.absorbentMt,
  inventoryMt: BIOCHAR_INVENTORY_TONS,
  samples: F.samples,
  sampleEta: F.sampleEta,
  bulkEta: F.bulkEta,
  replyTo: F.replyTo,
  geo: F.geo,
};
/* The critical path from a raw list to a sent campaign. Ordered because each step genuinely
   blocks the next: you cannot verify a list you have not pulled, and you must not send to a
   list you have not verified. Each is a checkbox, not a date, because dates are what killed
   the last two versions of this page.

   done:true marks a step confirmed complete (operator confirmation 2026-08-17) and renders
   it default-checked. It is only the DEFAULT: unticking it in the UI still works and still
   persists, so a step that regresses can be reopened without an edit here. */
/* The generated Instantly snapshot, read once at parse time. instantly-data.js is loaded
   before this file, so it is already on window; null on a checkout that has never run
   refresh-snapshots.sh, and every use below falls back to written text. */
const LIVEQ = (typeof window !== "undefined" && window.INSTANTLY_LIVE) || null;

/* Thousands-separated integer. pipeline.js has its own num() but it lives inside that file's
   IIFE and is not global, so app.js needs its own rather than reaching for one that is not there. */
const fmtN = v => Number.isFinite(+v) ? Math.round(+v).toLocaleString() : "0";

/* The ICP codes actually present in the roster, read at render time. */
const icpCodes = () => {
  const R = window.ROSTER;
  if(!R || !R.byIcp) return "see Campaigns & ICP";
  return Object.keys(R.byIcp).sort().join(", ");
};

/* rSegments, segCard, rankbar and rPersonas lived here and are deleted.

   They ran on a parallel taxonomy: nine DATA.segments scored by a composite rank, and
   six DATA.personas keyed to segment names. Neither lined up with the ICP list the
   Aug 10 call settled on, so the tool described three different customer lists at once
   and a rep had to work out which one was current. The canonical ICPs now carry their own
   firmographics, triggers, disqualifiers and persona block in outreach-data.js, and
   Campaigns & ICP renders from that. One list, one set of tags. */

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
      <div class="card">${script(t.product+" — 30-second pitch",t.pitch30)}</div>
      <div class="card">${script(t.product+" — 90-second pitch",t.pitch90)}</div>
    </div>
    <div class="grid g2" style="margin-top:10px">
      <div><b style="font-size:11px;color:var(--green-bright)">Proof to use</b><ul>${t.proof.map(p=>`<li>${esc(p)}</li>`).join("")}</ul></div>
      <div><b style="font-size:11px;color:var(--red-soft)">NEVER say in this pitch</b><ul>${t.neverSay.map(p=>`<li>${esc(p)}</li>`).join("")}</ul></div>
    </div>
  </div>`;
  const tBiochar=m.tracks.find(t=>t.id==="biochar");
  const tAbsorbent=m.tracks.find(t=>t.id==="absorbent");
  return page("messaging",
    head("Value Proposition & Messaging","TWO separate avatars — every pitch is single-product. BIOCHAR IS PRIORITY #1 — 80 MT of finished inventory is ready to ship now, and it sells to ag/soil/grower buyers. Absorbent Pellets are the secondary track for industrial/EHS/spill buyers. Different person, different pain, different proof.")+
    `<div class="note ok"><b>🔥 Priority #1 — Biochar:</b> ${BIOCHAR_INVENTORY_LINE}</div>`+
    `<div class="note warn"><b>Split rule:</b> ${esc(m.splitRule)}</div>`+
    sec("5","Track A — 100% Biochar (PRIORITY — 80 MT available now)")+trackBlock(tBiochar)+
    sec("","Track B — Absorbent Pellets (secondary / industrial)")+trackBlock(tAbsorbent)+
    sec("","Comparison messaging (use only within the matching track)")+
    table(["Positioned against","Why we win"],m.comparisons.map(c=>[`<strong>${esc(c.vs)}</strong>`,esc(c.win)]))+
    sec("","Proof-point map (claim safety — both products)")+
    `<p class="lead">Match every claim to its tier. Use the safe wording. Avoid the risky wording — it creates legal & credibility exposure.</p>`+
    table(["Claim","Tier","Buyer relevance","Source","✅ Safe wording","⛔ Avoid"],m.proofMap.map(p=>[
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
      ${a.claim?`<div class="note warn" style="margin:4px 0 0">⚠ ${esc(a.claim)}</div>`:""}
    </div>
  </div>`;
  return page("biochar",
    head("Biochar — Specs, Data & Avatars","Biochar is the dynamic product: one material, MANY buyers. Full spec, benefit-by-mechanism, industry comparisons, and a differentiated avatar for each buyer type. Pull the ONE benefit + comparison that fits the buyer in front of you.")+
    `<div class="card pad-lg"><p style="color:var(--text);font-size:13.5px;line-height:1.6">${esc(b.intro)}</p></div>`+
    sec("","Technical spec sheet")+
    table(["Property","Value"],b.spec.map(r=>[`<strong>${esc(r[0])}</strong>`,esc(r[1])]))+
    sec("","Benefits by mechanism — match to the avatar")+
    table(["Mechanism","What it does","Best for","Tier"],b.benefits.map(x=>[
      `<strong>${esc(x.mech)}</strong>`,esc(x.b),`<span style="color:var(--gold-soft)">${esc(x.who)}</span>`,tier(x.tier)]))+
    sec("","Industry comparisons — how biochar stacks up")+
    b.comparisons.map(c=>`<h3 class="sub">${esc(c.h)}</h3>`+table(c.cols.map(h=>esc(h)),c.rows.map(r=>r.map(x=>esc(x))))).join("")+
    sec("","Biochar avatars — one material, differentiated per buyer")+
    `<p class="lead">Absorbent Pellets have one industrial avatar; biochar sells across all of these. Each gets a different lead benefit and a different claim boundary — never a generic biochar pitch.</p>`+
    b.avatars.map(avatarCard).join("")+
    sec("","Claim guardrails")+
    `<div class="note warn"><ul>${b.guardrails.map(g=>`<li>${esc(g)}</li>`).join("")}</ul></div>`
  );
}





/* The Outreach Engine renderer moved to outreach.js. It reads outreach-data.js, which is
   now the only place cold copy lives. DATA.outreach was deleted with it. */

/* --- Windrow trial protocol (composter closing asset) --- */
function rWindrow(){
  const w=DATA.windrowTrial;
  const sampleRows=[
    ["0","___","118","120","55","54","N","Build day — baseline"],
    ["3","___","135","148","54","54","Y","Treatment heating faster"],
    ["7","___","150","158","52","53","Y","Both thermophilic"],
    ["…","___","…","…","…","…","…","…"],
  ];
  return sec("","Windrow Trial Protocol — composter closing asset")+
    `<div class="note ok"><b>Purpose:</b> ${esc(w.goal)}</div>`+
    `<div class="grid g2">
      <div class="card"><h4>🧪 Trial design (A/B)</h4><p>${esc(w.design)}</p></div>
      <div class="card"><h4>⚖️ Biochar dose rates</h4>
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
  const txt=`WINDROW TRIAL PROTOCOL — Biochar vs Control
Goal: ${w.goal}

DESIGN: ${w.design}

DOSE (treatment): default 10% by volume (options: 5% / 10% / 15–20%)

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
    head("Collateral Library","Pitch deck outline, one-pagers, calculator specs, sample workflow, and the objection battlecard — all build-ready.")+
    sec("9","Master pitch deck (10–12 slides)")+
    table(["#","Slide","Purpose","Key bullets","CTA"],DATA.deck.map((s,i)=>[
      `<strong>${i+1}</strong>`,`<strong>${esc(s.s)}</strong>`,esc(s.p),
      `<ul style="margin:0">${s.b.map(b=>`<li>${esc(b)}</li>`).join("")}</ul>`,esc(s.cta)]))+
    sec("","One-pagers to produce")+
    `<div class="filters">${DATA.onePagers.map(o=>`<span class="pill" style="cursor:default">${esc(o)}</span>`).join("")}</div>`+
    sec("","ROI calculators (specs)")+
    `<div class="grid g2">${DATA.calculators.map(c=>`<div class="card"><h4>${esc(c.name)}</h4>
      <b style="font-size:11.5px;color:var(--gold-soft)">Inputs</b><ul>${c.inputs.map(x=>`<li>${esc(x)}</li>`).join("")}</ul>
      <div style="font-size:12px;margin-top:6px"><b style="color:var(--text)">Formula:</b> <span style="font-family:var(--mono);color:var(--text-dim)">${esc(c.formula)}</span></div>
      <div style="font-size:12px;margin-top:4px"><b style="color:var(--text)">Saves to CRM:</b> ${c.saves.map(s=>badge(s,"badge-muted")).join(" ")}</div>
    </div>`).join("")}</div>`+
    `<div class="note">Two of these ship as live calculators in the <b>Pricing &amp; Economics</b> module (parked under Build Later).</div>`+
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
      <div class="acc-h" onclick="accToggle(${i})"><span>⛌ ${esc(o.o)}</span><span class="chev">▸</span></div>
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
    sec("11","Operating principles")+
    `<div class="grid g2">${pb.principles.map(p=>`<div class="card"><p style="color:var(--text)">→ ${esc(p)}</p></div>`).join("")}</div>`+
    sec("","Qualification — "+esc(pb.qual.framework.split(":")[0]))+
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
    `<div class="note warn"><b>Capture MRV data at delivery</b> (application, site/GPS, weights) — no data, no carbon credit. This is the link between the product sale and the carbon revenue.</div>`
  );
}

function stripBody(fn){
  let h="";
  try{ h=fn()||""; }catch(e){ console.error("renderer failed:",e&&e.message,e); return ""; }
  return h.replace(/^\s*<section[^>]*>/,"").replace(/<\/section>\s*$/,"");
}
const G = k => (window.GTMB && GTMB[k]) ? GTMB[k] : (()=> "");
/* Live SIBRA pipeline module (pipeline.js, loads before app.js) */
const PL = k => (window.PIPELIVE && PIPELIVE[k]) ? PIPELIVE[k] : (()=> "");
/* Canonical outreach module (outreach-data.js + outreach.js, both load before app.js) */
const OUT = k => (window.OUTREACH_UI && OUTREACH_UI[k]) ? OUTREACH_UI[k] : (()=> "");
/* Engine module (engine-data.js + engine.js): campaign architecture and the funnel costing */
const ENG = k => (window.ENGINE_UI && ENGINE_UI[k]) ? ENGINE_UI[k] : (()=> "");
/* Operations module (ops-data.js + ops.js): sample to cash, team, system of record, runbook */
const mergeDiv = `<div class="hr" style="margin:26px 0 18px;opacity:.5"></div>`;
/* newId → ordered list of renderer thunks it composes */
function compose(id, thunks){
  return page(id, thunks.map(stripBody).join(mergeDiv));
}

/* LEAN = daily-driver. BUILD = parked heavy modules (build-later.html). */
const LEAN_SECTIONS=[
  /* Order here is render order, not nav order; nav decides what a person sees first. Pipeline
     leads because it is the landing section — see the note on LEAN_NAV for the whole rationale.

     rLaunchpad is gone with the Launchpad section. Its live counts moved into the Pipeline
     header strip, where they sit next to the thing they describe. */
  ["crm",      [PL("rCRM")]],
  ["inbox",    [PL("rInbox")]],
  ["today",    [PL("rToday")]],
  ["strategy", [OUT("rCampaigns")]],
  ["outreach", [OUT("rOutreach")]],
  ["instantly",[ENG("rInstantly")]],
  ["funnels",  [ENG("rFunnels")]],
  ["product",  [rBiochar, rMessaging]],
  ["playbook", [rCollateral, G("rSample"), rPlaybook, G("rLinkedIn"), G("rSocial"), G("rLongTerm")]],
];

function render(){
  $("#content").innerHTML = LEAN_SECTIONS.map(([id,thunks])=>compose(id,thunks)).join("");
}
buildNav();
render();
/* The Website/Sales OS toggle points at /  and /sales/, which only resolve when Sales OS
   is served as /sales/ on the main site. On the standalone Sales OS deployment (served at
   the root) those links break, and there is no stable public-site URL to point at yet, so
   hide the toggle there. Detection: the standalone root path never contains /sales/. */
if (!location.pathname.includes("/sales/")) {
  const sw = document.querySelector(".app-switch");
  if (sw) sw.style.display = "none";
}
$("#menuBtn").addEventListener("click",()=>$("#sidebar").classList.toggle("open"));
const defaultId = NAV[0].items[0].id;
const isNavId = id => NAV.flatMap(g=>g.items).some(i=>i.id===id);
const start=(location.hash||"").slice(1);
go(isNavId(start)?start:defaultId);
/* go() writes location.hash on every nav, so without this Back/Forward changes the URL and
   nothing else. Re-setting the hash to its current value does not re-fire hashchange, so
   calling go() from here cannot loop. */
window.addEventListener("hashchange", () => {
  const id = (location.hash||"").slice(1);
  if(isNavId(id)) go(id);
});

/* ---------------------------------------------------------------- live Allo activity
   The one live read in the Sales OS. Everything else on every page is a dated snapshot,
   because a static page cannot hold an API key; this works only because /api/allo is a
   Pages Function that holds the token server side, behind the same password gate.

   Deliberately additive and deliberately quiet. The dated phone snapshot renders first and
   stays put; this appends a row underneath it if, and only if, the call succeeds. On the
   local dev server there is no Pages Function at all, so the fetch 404s and nothing happens
   — which is the same path taken when the token is unset or the Worker is down.

   Never throws, never blocks a render, never retries in a loop. A dashboard that breaks
   because a dependency blinked is worse than one that is a few hours stale. */
let alloInFlight = false;
async function loadAlloLive() {
  const mount = document.getElementById("allo-live");
  if (!mount) return;
  /* go() writes the hash on first paint, so the boot call and the hashchange listener both
     fire on a cold load. Without this that is two D1 reads for one page view. */
  if (alloInFlight) return;
  alloInFlight = true;
  try { await fetchAlloLive(mount); } finally { alloInFlight = false; }
}

async function fetchAlloLive(mount) {

  let d;
  try {
    const res = await fetch("api/allo?limit=50", { headers: { Accept: "application/json" } });
    if (!res.ok) return;                       // 404 on a static host is the normal local case
    d = await res.json();
  } catch { return; }                          // offline, blocked, or not JSON: stay silent
  if (!d || d.ok !== true) return;             // not-configured / timeout / unreachable

  const when = d.fetchedAt ? new Date(d.fetchedAt) : new Date();
  const clock = when.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

  const t = (label, val, sub) =>
    `<div class="card kpi"><div class="l">${esc(label)}</div><div class="v">${esc(String(val))}</div><div class="d">${esc(sub || "")}</div></div>`;

  /* The snapshot above is Allo's own 30-day analytics. This is our webhook stream since the
     Worker was deployed. They are different measurements of different windows, so they get
     their own row and their own label rather than being averaged into one misleading number. */
  const recent = (d.recent || [])[0];
  mount.innerHTML =
    `<div class="note ok" style="margin-top:14px;border-left:4px solid var(--green-bright)">
       <b>Live, ${esc(clock)}.</b> Read from the allo-hooks event stream just now, not from the
       dated snapshot above. That snapshot is Allo's own 30 day analytics; this is every event
       the webhook has received since the Worker went up.
     </div>
     <div class="grid g4" style="margin-top:10px">
       ${t("Events received", d.total, `${d.inbound} inbound · ${d.outbound} outbound`)}
       ${t("Calls", d.calls, d.messages ? `${d.messages} message(s) alongside` : "no messages yet")}
       ${t("Missed or AI answered", d.missed, d.missed ? "somebody still has to call back" : "none outstanding")}
       ${t("Policy flags", d.policyFlags, d.policyFlags ? "a call mentioned price or a bad claim" : "no breach recorded")}
     </div>` +
    (recent
      ? `<div class="note" style="margin-top:8px"><b>Most recent:</b> ${esc(recent.kind || "event")}
           ${esc(recent.direction ? recent.direction.toLowerCase() : "")}
           ${recent.who ? "with " + esc(recent.who) : ""}
           ${recent.result ? "· " + esc(recent.result) : ""}
           ${recent.minutes != null ? "· " + esc(String(recent.minutes)) + " min" : ""}
           ${recent.at ? "· " + esc(new Date(recent.at).toLocaleString()) : ""}</div>`
      : `<div class="note" style="margin-top:8px">The stream is connected and has received nothing yet.</div>`);
}

/* ---------------------------------------------------------------- live Instantly
   Same pattern as the Allo route: a Pages Function holds the key server side. The response
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
    if (current === "launch" || current === "instantly") go(current);
  }
}

/* ---------------------------------------------------------------- live Apollo
   Deliberately thin. Apollo exposes no credit balance to this key, so the only thing that can
   honestly be read live is whether the key still works — see functions/api/apollo.js. The
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

  const host = document.getElementById("sec-launch");
  if (!host || document.getElementById("apollo-key-warn")) return;
  const warn = document.createElement("div");
  warn.id = "apollo-key-warn";
  warn.className = "note warn";
  warn.style.marginTop = "10px";
  warn.innerHTML = `<b>⛔ The Apollo key is not working.</b> ${esc(d.keyDetail || "Apollo rejected it.")}
    Credit figures on this page are from our own receipts and are still accurate, but no new
    reveal will run until the key is replaced.`;
  host.appendChild(warn);
}

/* Fires on first paint and on every return to the Launchpad, so the numbers are current each
   time somebody looks rather than only on a hard reload. */
loadAlloLive();
loadInstantlyLive();
loadApolloLive();
window.addEventListener("hashchange", () => {
  if (((location.hash || "").slice(1) || NAV[0].items[0].id) === "launch") loadAlloLive();
});
