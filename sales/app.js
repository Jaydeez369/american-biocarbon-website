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
  recalc();                       // #content was rebuilt, so the calculators need repopulating
  // an open calendar day lives inside #content, so put it back or ticking a task inside it
  // would close the panel out from under the user
  if(window.gtmOpenCalDay != null && typeof window.gtmCalPick === "function"){
    window.gtmCalPick(window.gtmOpenCalDay, { restore:true });
  }
  window.scrollTo(0, y);
}
window.toggleChk = el => { const on = !el.classList.contains("done"); el.classList.toggle("done", on); setCheck(el.dataset.k, on); rerender(); };
window.resetChecks = pfx => { const c=getChecks(); Object.keys(c).forEach(k=>{ if(!pfx||k.startsWith(pfx)) delete c[k]; }); localStorage.setItem(CHECK_KEY, JSON.stringify(c)); rerender(); };

/* ---- toast + copy ---- */
function toast(msg="Copied to clipboard"){const t=$("#toast");t.textContent=msg;t.classList.add("show");setTimeout(()=>t.classList.remove("show"),1400);}
function copyText(txt){navigator.clipboard?.writeText(txt).then(()=>toast()).catch(()=>toast("Copy failed"));}
/* Live sellable inventory — biochar is Priority #1 (finished tonnage ready to ship now). */
const BIOCHAR_INVENTORY_TONS = 80;
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
/* ===== Consolidated IA (v3) — enterprise-audited split =====
   LEAN = the daily-driver sales tool (index.html).
   BUILD = parked heavy build/strategy modules (build-later.html),
           selected via window.OS_VIEW==='build'. Same code, two entry pages. */
const LEAN_NAV=[
  {group:"Focus",items:[
    {id:"daily",ic:"◎",t:"Daily Plan"},
  ]},
  {group:"Plan",items:[
    {id:"strategy",ic:"◆",t:"Strategy & ICP"},
    {id:"product",ic:"❝",t:"Product & Messaging"},
  ]},
  {group:"Execute",items:[
    {id:"outreach",ic:"✦",t:"Accounts & Outreach"},
    {id:"playbook",ic:"▷",t:"Assets & Playbook"},
  ]},
  {group:"Grow",items:[
    {id:"onboarding",ic:"✍",t:"Onboarding & Scale"},
  ]},
  {group:"Collaborate",items:[
    {id:"marketing",ic:"⇄",t:"Sales × Marketing"},
  ]},
];
const BUILD_NAV=[
  {group:"Build Later · parked",items:[
    {id:"b-overview",ic:"◆",t:"Architecture & Assumptions"},
    {id:"b-market",ic:"▤",t:"Market & Economics"},
    {id:"b-crm",ic:"▦",t:"CRM & Pipeline Spec"},
    {id:"b-dashboard",ic:"▲",t:"Metrics & Dashboard"},
  ]},
];
const NAV = (window.OS_VIEW==="build") ? BUILD_NAV : LEAN_NAV;

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

/* --- Daily Action Plan (top-of-app focus) --- */
/* Daily Plan is now the ONE canonical hub: this header + the clickable 30-day
   calendar + foundation checklist + launch gates + 31–90 horizon are all composed
   into a single "daily" section (see LEAN_SECTIONS). Progress is measured across
   the calendar's per-day tasks (cal:* keys), so the mission bar reflects real work. */
function rDaily(){
  const D=DATA.daily;
  const cal=(typeof GTM!=="undefined"&&GTM.calendar)||[];
  const calKeys=[];
  cal.forEach(c=>{ (c.jesse||[]).forEach((_,i)=>calKeys.push(`cal:${c.d}:j:${i}`)); (c.victor||[]).forEach((_,i)=>calKeys.push(`cal:${c.d}:v:${i}`)); });
  const st=checkStats(calKeys, calKeys.map(()=>false));
  const pct=st.total?Math.round(st.done/st.total*100):0;
  return page("today",
    head("Daily Plan","One page to run the day. Every checkbox persists across reloads.")+
    `<div class="note ok" style="border-left:4px solid var(--green-bright);font-size:14px;margin-bottom:14px">
       <b style="color:var(--green-bright)">🔥 TOP PRIORITY: SELL THE BIOCHAR.</b> ${BIOCHAR_INVENTORY_LINE} Every task below moves this inventory. Absorbent pellets run second.
     </div>`+
    `<div class="daily-mission card pad-lg">
       <div class="dm-row"><span class="dm-tag">THE MISSION</span><div class="dm-bar"><span style="width:${pct}%"></span></div><span class="dm-pct">${st.done}/${st.total} · ${pct}% of calendar tasks</span></div>
       <p class="dm-mission">${esc(D.mission)}</p>
       <div class="note" style="margin-top:10px"><b>2-week target:</b> ${esc(D.target)}</div>
       <div class="note ok" style="margin-top:8px"><b>Work top to bottom:</b> <b>① Calendar</b> (click a day for its tasks) → <b>② Foundation checklist</b> (what must be true to sell) → <b>③ Launch gates</b> (before outbound) → <b>④ Days 31-90 horizon</b>.</div>
     </div>`
  );
}

/* Days 31–90 horizon — the later arc of DATA.roadmap (phases after the first 30
   days, which the calendar now covers). Reuses the roadmap:* keys so any checks
   already made carry over. */
function rHorizon(){
  const later=DATA.roadmap.slice(2);
  return page("horizon",
    head("④ Days 31-90 · Horizon","Once the 80 MT biochar motion is running, this is the longer arc: scale what converts, formalize the distributor channel, advance Q4 offtake, and open carbon. Every task persists.")+
    later.map((ph,idx)=>{
      const pi=idx+2; // original DATA.roadmap index → stable check keys
      const keys=ph.tasks.map((t,ti)=>`roadmap:${pi}:${ti}`);
      const defs=ph.tasks.map(t=>!!t.done);
      const st=checkStats(keys,defs);
      return `<div class="chk-head"><h3 class="sub" style="margin:0">${esc(ph.phase)}</h3>`+
        `<span class="chk-progress">${st.done}/${st.total} done</span></div>`+
        (ph.note?`<p class="lead" style="margin:2px 0 8px">${esc(ph.note)}</p>`:"")+
        ph.tasks.map((t,ti)=>{
          const pri=badge(t.pri,t.pri==="P0"?"pri-1":t.pri==="P1"?"pri-2":"pri-3");
          const label=`${whoBadge(t.o)}${pri} ${esc(t.t)}<span class="del">→ ${esc(t.del)}${t.out?` · <i>${esc(t.out)}</i>`:""}</span>`;
          return chk(keys[ti],label,t.done);
        }).join("");
    }).join("")+
    `<div class="chk-head"><span></span><span class="chk-reset" onclick="resetChecks('roadmap:')">Reset horizon checkmarks</span></div>`
  );
}

/* --- Overview --- */
function rOverview(){
  const e=DATA.exec;
  return page("overview",
    head("Executive Sales Architecture","The highest-leverage path from zero to first revenue, recurring accounts, and carbon-monetized offtake.")+
    `<div class="grid g4">${DATA.overviewKpis.map(k=>`<div class="card kpi"><div class="l">${k.l}</div><div class="v">${k.v}</div><div class="d">${esc(k.d)}</div></div>`).join("")}</div>`+
    sec("1","Strategic Thesis")+
    `<div class="card pad-lg"><p style="color:var(--text);font-size:14.5px;line-height:1.65">${esc(e.thesis)}</p></div>`+
    `<div class="grid g3" style="margin-top:14px">
      <div class="card"><h4>🥇 First wedge</h4><p>${esc(e.wedge)}</p></div>
      <div class="card"><h4>⚡ Fastest first revenue</h4><p>${esc(e.fastRevenue)}</p></div>
      <div class="card"><h4>🔁 Fastest recurring</h4><p>${esc(e.fastRecurring)}</p></div>
    </div>`+
    sec("","How product & carbon revenue reinforce each other")+
    `<div class="note ok"><b>The molecule does double duty.</b> ${esc(DATA.messaging.dualStory)}</div>`+
    `<div class="grid g3">${e.reinforce.map(r=>`<div class="card"><p>${esc(r)}</p></div>`).join("")}</div>`+
    `<div class="note" style="margin-top:14px"><b>Fastest path to large offtake:</b> ${esc(e.fastOfftake)}</div>`+
    sec("","Claim discipline — proof hierarchy")+
    `<p class="lead">Every claim in this system is tagged to a tier. Never present a lower-tier claim as a higher one.</p>`+
    table(["Tier","Classification","Examples"],DATA.proofTiers.map(p=>[tier(p.t),`<strong>${esc(p.name)}</strong>`,esc(p.ex)]))
  );
}

/* --- Assumptions --- */
function rAssumptions(){
  return page("assumptions",
    head("Strategic Assumptions & Missing Inputs","What we're assuming to move fast, and the critical unknowns to close. Nothing here is treated as fact until verified.")+
    sec("2A","Assumptions")+
    table(["Assumption","Why it matters","Confidence","Verify"],DATA.assumptions.map(a=>[
      `<strong>${esc(a.a)}</strong>`,esc(a.why),
      badge(a.conf, a.conf==="High"?"badge-green":a.conf==="Med"?"badge-gold":"badge-red"),esc(a.verify)]))+
    sec("2B","Missing Inputs")+
    table(["Input needed","Owner","Impact if unknown","Temporary assumption"],DATA.missingInputs.map(m=>[
      `<strong>${esc(m.i)}</strong>`,esc(m.who),esc(m.impact),`<em style="color:var(--gold-soft)">${esc(m.tmp)}</em>`]))+
    `<div class="note warn">These inputs gate real quoting and any committed carbon revenue. The plan runs on placeholders until Finance/Ops/Carbon confirm them.</div>`
  );
}

/* --- Segments --- */
const RANKKEYS=[["speed","Speed to LOI"],["recurring","Recurring"],["margin","Margin"],["carbon","Carbon gen"],["strategic","Strategic"],["freight","Freight fit"],["complexity","Complexity"]];
function rSegments(){
  const groups=[...new Set(DATA.segments.map(s=>s.group))];
  // Month-1 beachhead score: BIOCHAR IS PRIORITY #1 (we have 80 MT to sell now), so Ag/Hort (biochar) buyers
  // get a +6 priority bonus — they're now the fastest path to actual revenue, not just to LOIs. Carbon is parked
  // (shown as a column, excluded from the score). Absorbent/Industrial segments run as the secondary track.
  const bioBonus=s=>s.group==="Ag / Hort"?6:0;
  const ranked=[...DATA.segments].map(s=>({s,score:s.rank.speed*3+s.rank.recurring+s.rank.margin+s.rank.strategic+s.rank.freight-s.rank.complexity+bioBonus(s)})).sort((a,b)=>b.score-a.score);
  const top3=ranked.slice(0,3).map(r=>r.s.name);
  const filters=`<div class="filters"><span class="pill active" onclick="segFilter(this,'all')">All</span>${groups.map(g=>`<span class="pill" onclick="segFilter(this,'${esc(g)}')">${esc(g)}</span>`).join("")}</div>`;
  const cards=DATA.segments.map(s=>segCard(s)).join("");
  return page("segments",
    head("ICP Definition & Segmentation","Tight profiles for every buyer type. BIOCHAR (Ag / Hort) buyers are Priority #1 — we have 80 MT to move now, so they carry a priority weighting in the beachhead score. Industrial/absorbent buyers run as the secondary track; carbon is parked to days 61–90 (shown as a column, excluded from the score).")+
    `<div class="note ok"><b>🔥 Recommended beachhead (top 3 — biochar-led):</b> ${top3.map(t=>badge(t,"badge-green")).join(" ")}</div>`+
    sec("3","Segment ranking")+
    table(["Segment","Group","Speed","Recurring","Margin","Carbon","Strategic","Freight","Composite"],
      ranked.map(r=>[`<strong>${esc(r.s.name)}</strong>`,esc(r.s.group),
      ...RANKKEYS.slice(0,6).map(k=>rankbar(r.s.rank[k[0]])),`<strong class="t-num">${r.score}</strong>`]))+
    sec("","Segment cards")+filters+
    `<div class="grid g2" id="segCards">${cards}</div>`
  );
}
function rankbar(n){return `<div class="rank-bar"><span style="width:${n*20}%"></span></div>`;}
function segCard(s){
  return `<div class="card seg-card" data-group="${esc(s.group)}">
    <h4>${esc(s.name)} ${s.tag?badge(s.tag,s.tag.includes("#1")?"badge-green":s.tag.includes("Monetization")?"badge-gold":"badge-blue"):""}</h4>
    <p style="margin-bottom:8px">${esc(s.summary)}</p>
    ${s.coreProblem?`<div class="note warn" style="margin:8px 0"><b>Core problem we solve:</b> ${esc(s.coreProblem)}</div>`:""}
    ${s.valueProp?`<div class="note ok" style="margin:8px 0"><b>Our value:</b> ${esc(s.valueProp)}</div>`:""}
    <div style="font-size:12px;color:var(--text-mute);margin-bottom:8px"><strong style="color:var(--text-dim)">Firmographics:</strong> ${esc(s.firmo)}</div>
    <div class="grid g2" style="gap:8px">
      <div><b style="font-size:11.5px;color:var(--gold-soft)">Titles</b><ul>${s.titles.map(t=>`<li>${esc(t)}</li>`).join("")}</ul></div>
      <div><b style="font-size:11.5px;color:var(--gold-soft)">Pains</b><ul>${s.pains.slice(0,4).map(t=>`<li>${esc(t)}</li>`).join("")}</ul></div>
      <div><b style="font-size:11.5px;color:var(--gold-soft)">Buying triggers</b><ul>${s.triggers.map(t=>`<li>${esc(t)}</li>`).join("")}</ul></div>
      <div><b style="font-size:11.5px;color:var(--gold-soft)">Disqualifiers</b><ul>${s.disq.map(t=>`<li>${esc(t)}</li>`).join("")}</ul></div>
    </div>
    <div class="hr" style="margin:12px 0"></div>
    <div style="font-size:12px;display:grid;gap:4px">
      <div><b style="color:var(--text)">Econ buyer:</b> ${esc(s.econ)} · <b style="color:var(--text)">Tech:</b> ${esc(s.tech)} · <b style="color:var(--text)">User:</b> ${esc(s.user)}</div>
      <div><b style="color:var(--text)">Order:</b> ${esc(s.order)} · <b style="color:var(--text)">Cycle:</b> ${esc(s.cycle)}</div>
      <div><b style="color:var(--text)">First offer:</b> ${esc(s.offer)}</div>
      <div><b style="color:var(--text)">Channel:</b> ${esc(s.channel)}</div>
      <div><b style="color:var(--text)">Proof to lead with:</b> ${s.proof.map(p=>badge(p,"badge-blue")).join(" ")}</div>
      <div style="margin-top:4px">${s.tags.map(t=>`<span class="badge badge-muted" style="font-size:10px">${esc(t)}</span>`).join(" ")}</div>
    </div>
  </div>`;
}
window.segFilter=(el,g)=>{
  el.closest(".filters").querySelectorAll(".pill").forEach(p=>p.classList.remove("active"));el.classList.add("active");
  document.querySelectorAll("#segCards .seg-card").forEach(c=>c.style.display=(g==="all"||c.dataset.group===g)?"":"none");
};

/* --- Personas --- */
function rPersonas(){
  return page("personas",
    head("Buyer Personas","What each buyer cares about, fears, and needs — with the discovery questions, opener, and CTA that land.")+
    `<div class="grid g2">${DATA.personas.map(p=>`
      <div class="card pad-lg">
        <h4>${esc(p.name)} ${badge(p.seg,"badge-blue")}</h4>
        <div style="display:grid;gap:6px;font-size:12.5px;margin-top:6px">
          <div><b style="color:var(--green-bright)">Cares about:</b> ${esc(p.cares)}</div>
          <div><b style="color:var(--red-soft)">Fears:</b> ${esc(p.fears)}</div>
          <div><b style="color:var(--gold-soft)">Needs (proof):</b> ${esc(p.needs)}</div>
          <div><b style="color:var(--text)">Their language:</b> ${esc(p.lang)}</div>
          <div><b style="color:var(--text)">Hates hearing:</b> ${esc(p.hates)}</div>
        </div>
        <div class="hr" style="margin:10px 0"></div>
        <b style="font-size:11.5px;color:var(--gold-soft)">Discovery questions</b>
        <ul>${p.disc.map(d=>`<li>${esc(d)}</li>`).join("")}</ul>
        ${script("Opening pitch",p.open)}
        <div style="margin-top:6px;font-size:12.5px"><b style="color:var(--green-bright)">CTA:</b> ${esc(p.cta)}</div>
      </div>`).join("")}</div>`
  );
}

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

/* --- Market --- */
function rMarket(){
  const mk=DATA.market;
  return page("market",
    head("TAM / SAM / SOM & Beachhead Strategy","A transport-aware model built from cited public anchors (USGS, USDA-AMS, IFEEDER/NARA, Grand View, Puro/CDR.fyi). [A] = stated assumption. Freight — not demand — caps the addressable market, differently per product by $/ton.")+
    `<div class="note warn">${esc(mk.note)}</div>`+
    sec("6","Market model — TAM / SAM / SOM (low / base / high)")+
    table(["Market","TAM (tons / $)","SAM (freight-viable)","SOM year 1 (low / base / high)","Mode & note"],mk.som.map(x=>[
      `<strong>${esc(x.m)}</strong>`,esc(x.tam),esc(x.sam),`<span style="color:var(--green-bright)">${esc(x.som)}</span>`,esc(x.note)]))+
    (mk.modeVerdict?sec("","Transport mode verdict by product")+
      table(["Product","Best truck radius","Rail verdict","Primary reason"],mk.modeVerdict.map(m=>[
        `<strong>${esc(m.p)}</strong>`,`<span class="t-num">${esc(m.truck)}</span>`,badge(m.rail,/Strong|Material/.test(m.rail)?"badge-green":/Marginal|Amplifies/.test(m.rail)?"badge-gold":"badge-muted"),esc(m.why)])):"")+
    (mk.transport?sec("","Transport & rail model")+
      `<div class="card"><ul>${mk.transport.map(t=>`<li>${esc(t)}</li>`).join("")}</ul></div>`:"")+
    (mk.priceRefs?sec("","Reference prices used")+
      table(["Product","Price","Basis"],mk.priceRefs.map(p=>[`<strong>${esc(p.p)}</strong>`,`<span class="t-num">${esc(p.price)}</span>`,esc(p.note)])):"")+
    sec("","Target account criteria")+
    table(["Filter","Rule"],mk.accountCriteria.map(c=>[`<strong>${esc(c.f)}</strong>`,esc(c.v)]))+
    (mk.assumptions?sec("","Key assumptions [A]")+
      `<div class="card"><ul>${mk.assumptions.map(a=>`<li>${esc(a)}</li>`).join("")}</ul></div>`:"")+
    (mk.gaps?sec("","Open gaps — treat as unverified")+
      `<div class="note warn"><ul>${mk.gaps.map(g=>`<li>${esc(g)}</li>`).join("")}</ul></div>`:"")+
    (mk.verifyFirst?sec("","Verify-first (before any investor/lender deck)")+
      `<div class="card"><ul>${mk.verifyFirst.map(v=>`<li>${esc(v)}</li>`).join("")}</ul></div>`:"")+
    sec("","Sourcing workflow — build the first 100")+
    `<div class="card"><ul>${mk.sourcing.map(s=>`<li>${esc(s)}</li>`).join("")}</ul></div>`+
    `<div class="note"><b>Enrichment:</b> Apollo.io is connected to this workspace — use it to find contacts, verify emails, and push accounts into the app.</div>`
  );
}

/* --- Barge / Waterborne Cost Analysis (separate deep-dive, below TAM/SAM/SOM) --- */
function rBarge(){
  const b=DATA.barge;
  return page("barge",
    head("Barge & Waterborne Cost Analysis","A standalone freight deep-dive: can the Mississippi at White Castle move product cheaper than truck or rail? Full cost-per-ton model by lane, with break-even math and a capacity reality check. [A] = stated assumption; figures are a defensible model, not fact.")+
    `<div class="note warn">${esc(b.headline)}</div>`+
    sec("6B·1","White Castle waterway geography")+
    `<div class="card"><ul>${b.geography.map(g=>`<li>${esc(g)}</li>`).join("")}</ul></div>`+
    sec("6B·2","Mode comparison — the cost structure")+
    table(["Mode","Linehaul","Fixed / handling","Payload","Note"],b.modeCompare.map(m=>[
      `<strong>${esc(m.mode)}</strong>`,`<span class="t-num">${esc(m.linehaul)}</span>`,esc(m.fixed),`<span class="t-num">${esc(m.cap)}</span>`,esc(m.note)]))+
    sec("6B·3","Delivered cost/ton by lane — barge vs truck vs rail")+
    table(["Destination","River-mi","Barge $/ton","Truck $/ton","Rail $/ton","Verdict","Why"],b.lanes.map(x=>[
      `<strong>${esc(x.dest)}</strong>`,`<span class="t-num">${esc(x.mi)}</span>`,`<span class="t-num" style="color:var(--green-bright)">${esc(x.barge)}</span>`,`<span class="t-num">${esc(x.truck)}</span>`,`<span class="t-num">${esc(x.rail)}</span>`,badge(x.verdict,x.cls),esc(x.note)]))+
    sec("6B·4","Break-even logic — when barge starts to pay")+
    `<div class="card"><ul>${b.breakeven.map(x=>`<li>${esc(x)}</li>`).join("")}</ul></div>`+
    sec("6B·5","Capacity reality check")+
    `<div class="note warn"><ul>${b.capacity.map(x=>`<li>${esc(x)}</li>`).join("")}</ul></div>`+
    sec("6B·6","Key assumptions [A]")+
    `<div class="card"><ul>${b.assumptions.map(x=>`<li>${esc(x)}</li>`).join("")}</ul></div>`+
    sec("6B·7","Verify-first — before quoting any barge lane")+
    `<div class="card"><ul>${b.verifyFirst.map(x=>`<li>${esc(x)}</li>`).join("")}</ul></div>`
  );
}

/* --- Pipeline --- */
function rPipeline(){
  const pl=DATA.pipelines;
  const kanban=(name,stages)=>`<h3 class="sub">${name}</h3><div class="kanban">${stages.map(s=>`
    <div class="kcol"><div class="kcol-h"><strong>${esc(s.s)}</strong><span class="prob">${s.prob}%</span></div>
    <div class="kcol-b">${esc(s.def)}
      <div class="crit"><b>Exit:</b> ${esc(s.exit)}</div>
      <div class="crit"><b>Fields:</b> ${s.fields.map(f=>badge(f,"badge-muted")).join(" ")}</div>
      <div class="crit"><b>Next:</b> ${esc(s.next)}</div>
      <div class="crit" style="color:var(--red-soft)"><b>Don't advance:</b> ${esc(s.noAdv)}</div>
    </div></div>`).join("")}</div>`;
  return page("pipeline",
    head("Sales Pipeline Design — for your Replit app","Object model, deal types, and three connected pipelines with stage exit criteria and the exact CRM fields to add. This is the build spec for your app's sales section.")+
    sec("7A","Object model")+
    table(["Object","Key fields"],DATA.objectModel.map(o=>[`<strong>${esc(o.o)}</strong>`,esc(o.key)]))+
    sec("7B","Deal types")+`<div class="filters">${DATA.dealTypes.map(d=>`<span class="pill active" style="cursor:default">${esc(d)}</span>`).join("")}</div>`+
    sec("7C","Pipeline 1 — Mid-market recurring")+kanban("",pl.midmarket)+
    sec("","Pipeline 2 — Bulk offtake / supply")+kanban("",pl.offtake)+
    sec("","Pipeline 3 — Carbon-credit buyer")+kanban("",pl.carbon)+
    `<div class="note warn"><b>Carbon guardrail:</b> never contract more credits than deployable tons. Carbon supply = deployed + committed product tons only.</div>`+
    sec("7D","Required CRM fields")+
    `<div class="grid g2">
      <div class="card"><h4>Core sales fields</h4><ul>${DATA.crmFields.sales.map(f=>`<li>${esc(f)}</li>`).join("")}</ul></div>
      <div class="card"><h4>Product + carbon economics fields</h4><ul>${DATA.crmFields.economics.map(f=>`<li>${esc(f)}</li>`).join("")}</ul></div>
    </div>`+
    sec("7E","Dashboard views to build")+
    `<div class="filters">${DATA.dashboards.map(d=>`<span class="pill" style="cursor:default">${esc(d)}</span>`).join("")}</div>`+
    sec("7F","Schema (TypeScript-style)")+schemaBlock()
  );
}
function schemaBlock(){
  const code=`interface Account {
  id: string; name: string; segment: Segment; freightZone: "A"|"B"|"C";
  location: string; website?: string; status: DealStage; priorityScore: number;
}
interface Deal {
  id: string; accountId: string; dealType: DealType; stage: DealStage;
  productType: string; wetTons: number; dryTonsEq: number; packaging: string;
  productRevenue: number; cogs: number; freight: number; deliveredMargin: number;
  carbonEligible: boolean; estTCO2e: number; cdrRevenueEst: number; cdrConfidence: "low"|"med"|"high";
  mrvStatus: "none"|"pending"|"complete"; blendedMargin: number; carbonBuyer?: string;
  closeDate: string; nextStep: string;
}
interface SampleRequest {
  id: string; accountId: string; sku: string; size: string; useCase: string;
  successCriteria: string; shipDate?: string; followUpDate?: string; outcome?: string;
}
interface CarbonRecord {
  id: string; dealId: string; deployedTons: number; estTCO2e: number;
  mrvDocs: string[]; issuanceStatus: "none"|"pending"|"issued"; buyer?: string;
}`;
  const id="schema1";
  return `<div class="script"><button class="copy" onclick="copyEl('${id}')">Copy</button><span id="${id}" data-raw="${esc(code)}" style="font-family:var(--mono);font-size:12px">${nl(code)}</span></div>`;
}

/* --- Accounts (interactive demo table) --- */
const SAMPLE_ACCOUNTS=[
  ["Bayou Soil & Mulch","Soil blenders","Gornzalez, LA","A",320,4,"Prospect"],
  ["Gulf Coast Ag Supply","Ag distribution","Baton Rouge, LA","A",900,5,"Contacted"],
  ["Delta Landscape Supply","Landscape","Lafayette, LA","A",260,3,"Discovery"],
  ["Cajun Environmental Svcs","Remediation","Houma, LA","A",540,4,"Sample"],
  ["Pelican Oilfield Services","Oil & gas","Broussard, LA","A",1200,5,"Contacted"],
  ["Magnolia Compost Co","Soil blenders","Hammond, LA","A",300,4,"Prospect"],
  ["Southern Waste Partners","Landfill","Slidell, LA","A",700,3,"Prospect"],
  ["Piney Woods Bedding","Animal bedding","Alexandria, LA","B",380,3,"Prospect"],
  ["Coastal Remediation LLC","Remediation","Lake Charles, LA","B",460,4,"Prospect"],
  ["Sunbelt Organics Dist.","Ag distribution","Jackson, MS","B",820,4,"Contacted"],
  ["Gulf Nursery Supply","Landscape","Mobile, AL","B",340,3,"Prospect"],
  ["EcoCarbon Buyers Co.","Carbon/ESG","Remote","C",0,4,"Prospect"],
];
function rAccounts(){
  const segs=[...new Set(SAMPLE_ACCOUNTS.map(a=>a[1]))];
  const rows=SAMPLE_ACCOUNTS.map((a,i)=>accRow(a,i)).join("");
  return page("accounts",
    head("Target Accounts","A working account list — filter by segment, sort by priority. Seeded sample data; replace with your sourced Gulf South list.")+
    `<div class="filters"><span class="pill active" onclick="accFilter(this,'all')">All segments</span>${segs.map(s=>`<span class="pill" onclick="accFilter(this,'${esc(s)}')">${esc(s)}</span>`).join("")}</div>`+
    `<div class="tbl-wrap"><table id="accTbl"><thead><tr>
      <th>Account</th><th>Segment</th><th>Location</th><th>Freight zone</th><th>Est. tons/yr</th><th>Priority</th><th>Status</th><th>Next action</th>
    </tr></thead><tbody>${rows}</tbody></table></div>`+
    `<div class="note">Priority score = fit × volume × freight, minus complexity. Zone C only clears the bar with high volume or strong carbon value. Wire this table to your app's <code>Account</code> object.</div>`
  );
}
function accRow(a,i){
  const [name,seg,loc,zone,tons,pri,status]=a;
  const priCls=pri>=5?"pri-1":pri>=4?"pri-2":"pri-3";
  const zc=zone==="A"?"badge-green":zone==="B"?"badge-gold":"badge-red";
  const next={Prospect:"First touch",Contacted:"Book discovery",Discovery:"Ship sample",Sample:"Trial check-in"}[status]||"Advance";
  return `<tr data-seg="${esc(seg)}"><td><strong>${esc(name)}</strong></td><td>${esc(seg)}</td><td>${esc(loc)}</td>
    <td>${badge("Zone "+zone,zc)}</td><td class="t-num">${tons?tons.toLocaleString():"—"}</td>
    <td>${badge("P"+pri,priCls)}</td><td>${badge(status,"badge-blue")}</td><td>${esc(next)}</td></tr>`;
}
window.accFilter=(el,s)=>{
  el.closest(".filters").querySelectorAll(".pill").forEach(p=>p.classList.remove("active"));el.classList.add("active");
  document.querySelectorAll("#accTbl tbody tr").forEach(r=>r.style.display=(s==="all"||r.dataset.seg===s)?"":"none");
};

/* --- Outreach --- */
function rOutreach(){
  const filters=`<div class="filters"><span class="pill active" onclick="outFilter(this,'all')">All segments</span>${DATA.outreach.map((o,i)=>`<span class="pill" onclick="outFilter(this,'${i}')">${esc(o.seg)}</span>`).join("")}</div>`;
  const blocks=DATA.outreach.map((o,i)=>`
    <div class="out-block" data-idx="${i}">
      <h3 class="sub">${esc(o.seg)} — ${esc(o.persona)}</h3>
      ${o.steps.map(s=>script(s.t,s.b)).join("")}
      <div class="note"><b>Nurture:</b> ${esc(o.nurture)}</div>
    </div>`).join("");
  return page("outreach",
    head("Outreach Engine","Human, direct, credible sequences per segment — email, call, voicemail, LinkedIn, breakup, and nurture. BIOCHAR segments (Soil Blenders, Ag Distributors) lead; absorbent runs as the secondary track. The cold ask is always a free sample — a winning biochar trial converts to an order against the 80 MT. Every block has a copy button. Replace {First}/{Me}/phone before sending.")+
    filters+blocks
  );
}
window.outFilter=(el,i)=>{
  el.closest(".filters").querySelectorAll(".pill").forEach(p=>p.classList.remove("active"));el.classList.add("active");
  document.querySelectorAll(".out-block").forEach(b=>b.style.display=(i==="all"||b.dataset.idx===i)?"":"none");
};

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

/* --- Pricing + live calculators --- */
function rPricing(){
  const p=DATA.pricing;
  return page("pricing",
    head("Pricing & Deal Economics","A placeholder pricing architecture (not real prices) plus two live calculators. Fill floors/COGS/freight before quoting anyone.")+
    `<div class="note warn">${esc(p.note)}</div>`+
    sec("10","Pricing logic")+
    table(["Lever","Rule"],p.logic.map(x=>[`<strong>${esc(x.f)}</strong>`,esc(x.v)]))+
    sec("","Price tiers by product")+
    table(["Product","Unit","Note"],p.tiers.map(x=>[`<strong>${esc(x.p)}</strong>`,`<span class="t-num">${esc(x.unit)}</span>`,esc(x.note)]))+
    sec("","Sample deal economics (placeholder)")+
    table(["Line","Value"],p.sampleDeal.map(x=>[`<strong>${esc(x.line)}</strong>`,`<span class="t-num">${esc(x.v)}</span>`]))+
    `<div class="note"><b>Deal evaluation stack:</b> ${p.dealEval.map(d=>badge(d,"badge-muted")).join(" ")}</div>`+
    sec("","Live calculator — Freight-aware delivered margin")+calcFreight()+
    sec("","Live calculator — Product + Carbon blended value")+calcBlended()+
    sec("","Live calculator — Absorbent cost-per-gallon")+calcAbsorbent()
  );
}
function field(id,label,val,step="any"){return `<div class="field"><label>${label}</label><input type="number" id="${id}" value="${val}" step="${step}" oninput="recalc()"></div>`;}
function out(id,label,hero=false){return `<div class="o${hero?" hero":""}"><div class="ol">${label}</div><div class="ov" id="${id}">—</div></div>`;}
function calcFreight(){
  return `<div class="calc"><div class="calc-grid">
    ${field("f_rev","Product revenue ($)",12000)}
    ${field("f_cogs","COGS ($)",5000)}
    ${field("f_freight","Freight cost ($)",2500)}
  </div><div class="calc-out">
    ${out("f_margin","Delivered margin",true)}${out("f_pct","Margin %")}
  </div></div>`;
}
function calcBlended(){
  return `<div class="calc">
    <div class="note" style="margin:0 0 12px"><b>Carbon figures are ESTIMATES</b> — excluded from committed margin until verified.</div>
    <div class="calc-grid">
    ${field("b_tons","Tons",100)}
    ${field("b_pmargin","Product margin / ton ($)",70)}
    ${field("b_tco2e","tCO₂e per ton (EST)",2.5)}
    ${field("b_price","CDR $ / tCO₂e (EST)",120)}
  </div><div class="calc-out">
    ${out("b_prod","Product margin")}${out("b_carbon","Carbon upside (EST)")}${out("b_blended","Blended value",true)}
  </div></div>`;
}
function calcAbsorbent(){
  return `<div class="calc"><div class="calc-grid">
    ${field("a_gal","Spill volume (gal)",500)}
    ${field("a_price","Absorbent price ($/lb)",0.9)}
    ${field("a_ratio","Our absorption ratio (X:1)",5)}
  </div><div class="calc-out">
    ${out("a_ours","Cost @ our ratio",true)}${out("a_wood","Cost @ wood 2.5:1")}${out("a_save","You save")}
  </div></div>`;
}
const money=n=>isFinite(n)?"$"+Math.round(n).toLocaleString():"—";
function recalc(){
  // freight
  const rev=+val("f_rev"),cogs=+val("f_cogs"),fr=+val("f_freight");
  const dm=rev-cogs-fr; set("f_margin",money(dm)); set("f_pct",rev?Math.round(dm/rev*100)+"%":"—");
  // blended
  const tons=+val("b_tons"),pm=+val("b_pmargin"),tco=+val("b_tco2e"),pr=+val("b_price");
  const prod=tons*pm, carbon=tons*tco*pr; set("b_prod",money(prod)); set("b_carbon",money(carbon)); set("b_blended",money(prod+carbon));
  // absorbent — water ~8.34 lb/gal
  const gal=+val("a_gal"),price=+val("a_price"),ratio=+val("a_ratio");
  const lb=gal*8.34; const ours=(lb/ratio)*price, wood=(lb/2.5)*price;
  set("a_ours",money(ours)); set("a_wood",money(wood)); set("a_save",money(wood-ours));
}
const val=id=>{const e=document.getElementById(id);return e?e.value:0;};
const set=(id,v)=>{const e=document.getElementById(id);if(e)e.textContent=v;};

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

/* --- Customer Onboarding (accounts) --- */
function rOnboarding(){
  const o=DATA.onboarding;
  const ownIc=who=>whoBadge(who);
  const chkBlock=(gid,arr)=>{
    const keys=arr.map((x,i)=>`onb:${gid}:${i}`);
    const defs=arr.map(x=>/\|done$/.test(x));
    const st=checkStats(keys,defs);
    return {st,html:arr.map((x,i)=>{ const done=/\|done$/.test(x); const txt=x.replace(/\|done$/,""); return chk(keys[i],esc(txt),done); }).join("")};
  };
  const setup=chkBlock("setup",o.setup);
  const per=chkBlock("per",o.perAccount);
  const docRow=d=>[`<strong>${esc(d.doc)}</strong>${d.req?` <span class="badge ${/Required/i.test(d.req)?"badge-green":"badge-muted"}" style="margin-left:4px">${esc(d.req)}</span>`:""}`,esc(d.what),esc(d.when),ownIc(d.owner)];
  return page("onboarding",
    head("Customer Onboarding — accounts","Turn a won trial into a paying account on the books. The sales motion rides on an admin/accounting spine: the moment a trial wins, stand the customer up BEFORE the first invoice ships.")+
    `<div class="note ok" style="font-size:13.5px"><b>Owner split:</b> ${esc(o.ownerNote)}</div>`+
    `<div class="card pad-lg" style="margin-top:12px"><p style="color:var(--text);font-size:14px;line-height:1.6">${esc(o.intro)}</p></div>`+
    sec("A","The account journey — sample to recurring")+
    `<p class="lead">Each stage has an owner and the administrative action behind it. Step 5 is the accounting gate — nothing invoices until it clears.</p>`+
    table(["Stage","Trigger","Owner","Administrative action","Exit criteria"],o.journey.map(j=>[
      `<strong>${esc(j.stage)}</strong>`,esc(j.trigger),ownIc(j.owner),esc(j.admin),`<span style="color:var(--green-bright)">${esc(j.exit)}</span>`]))+
    sec("B","Document flows — two directions, don't confuse them")+
    `<div class="grid g2">
      <div class="card"><h4>→ What WE send the customer <span class="badge badge-blue">we're the vendor</span></h4>
        ${table(["Doc","What / why","When","Owner"],o.docsOut.map(docRow))}</div>
      <div class="card"><h4>← What WE collect before invoicing <span class="badge badge-gold">gate</span></h4>
        ${table(["Doc","What / why","When","Owner"],o.docsIn.map(docRow))}</div>
    </div>`+
    sec("C","Accounting & administrative rules")+
    `<div class="grid g2">${o.accounting.map(a=>`<div class="card"><p style="color:var(--text)">→ ${esc(a)}</p></div>`).join("")}</div>`+
    sec("D","Set up the onboarding packet once")+
    `<div class="chk-head" style="margin:0 0 6px"><h4 style="margin:0">Build the reusable packet</h4><span class="chk-progress">${setup.st.done}/${setup.st.total}</span></div>`+
    `<div class="card">${setup.html}</div>`+
    `<div class="chk-head"><span></span><span class="chk-reset" onclick="resetChecks('onb:setup:')">Reset</span></div>`+
    sec("E","Per-account onboarding checklist (run each new account)")+
    `<div class="chk-head" style="margin:0 0 6px"><h4 style="margin:0">Accounting runs this every time a trial wins</h4><span class="chk-progress">${per.st.done}/${per.st.total}</span></div>`+
    `<div class="card">${per.html}</div>`+
    `<div class="chk-head"><span class="note warn" style="margin:0;flex:1"><b>Tip:</b> reset this block when you start a new account.</span><span class="chk-reset" onclick="resetChecks('onb:per:')">Reset for new account</span></div>`+
    sec("F","FAQ — the questions that trip people up")+
    `<div class="grid g2">${o.faq.map(f=>`<div class="card"><h4>${esc(f.q)}</h4><p>${esc(f.a)}</p></div>`).join("")}</div>`
  );
}

/* --- KPIs --- */
function rKpis(){
  const k=DATA.kpis;
  const list=(t,arr,cls)=>`<div class="card"><h4>${t}</h4>${arr.map(x=>`<span class="badge ${cls}" style="margin:2px 3px 2px 0">${esc(x)}</span>`).join("")}</div>`;
  return page("kpis",
    head("Metrics & KPIs","Leading and lagging indicators, conversion funnel, pipeline coverage, and dashboard-card specs for your app.")+
    sec("12","Indicators")+
    `<div class="grid g2">${list("Leading indicators",k.leading,"badge-green")}${list("Lagging indicators",k.lagging,"badge-gold")}</div>`+
    `<div class="grid g2" style="margin-top:14px">${list("Conversion metrics",k.conversion,"badge-blue")}${list("Pipeline coverage",k.coverage,"badge-muted")}</div>`+
    sec("","Dashboard card specs")+
    table(["Card","Definition","Formula","Filters","Source","Warn threshold","Owner"],k.cards.map(c=>[
      `<strong>${esc(c.c)}</strong>`,esc(c.def),`<span class="t-num">${esc(c.formula)}</span>`,esc(c.filter),esc(c.src),
      `<span style="color:var(--red-soft)">${esc(c.warn)}</span>`,esc(c.owner)]))
  );
}

/* --- Roadmap owner badge (still used by rHorizon; the 30-day arc now lives in the calendar) --- */
function whoBadge(o){ const c=/jesse/i.test(o)?"jesse":/victor/i.test(o)?"victor":/daniel/i.test(o)?"daniel":/both|all/i.test(o)?"both":""; return `<span class="who ${c}">${esc(o)}</span>`; }

/* --- Checklist --- */
function rChecklist(){
  const c=DATA.checklist;
  const block=(gid,title,arr)=>{
    const keys=arr.map((x,i)=>`launch:${gid}:${i}`);
    const defs=arr.map(x=>/\|done$/.test(x));
    const st=checkStats(keys,defs);
    return `<div class="card"><div class="chk-head" style="margin:0 0 6px"><h4 style="margin:0">${title}</h4><span class="chk-progress">${st.done}/${st.total}</span></div>`+
      arr.map((x,i)=>{ const done=/\|done$/.test(x); const txt=x.replace(/\|done$/,""); return chk(keys[i],esc(txt),done); }).join("")+`</div>`;
  };
  return page("checklist",
    head("② Foundation checklist — what must be true to sell","The concrete setup behind the calendar: get the 80 MT sellable, then website & product, app build, collateral, lists, and first outbound. Every item persists across reloads.")+
    `<div class="grid g2">
      ${block("bio","⓪ Biochar inventory → revenue (80 MT)",c.biochar)}
      ${block("web","① Website & product launch",c.website)}
      ${block("build","② Build in the app",c.build)}
      ${block("coll","③ Collateral (single-product each)",c.collateral)}
      ${block("lists","④ Lists to build first",c.lists)}
      ${block("first","⑤ First outbound actions (sample-first)",c.firstActions)}
    </div>`+
    `<div class="chk-head"><span class="note ok" style="margin:0;flex:1"><b>Sequence:</b> get 80 MT ship-ready + priced → publish site + sample SKUs → build app fields → source biochar-weighted accounts → produce single-product kits → launch biochar-first outbound → ship free samples → convert wins to POs against the 80 MT → present Q4 LOIs on top.</span><span class="chk-reset" onclick="resetChecks('launch:')">Reset</span></div>`
  );
}

/* ================= BOOT ================= */
/* Strip the outer <section…>…</section> wrapper that page() adds, so
   several renderers can be stacked inside ONE consolidated section. */
function stripBody(fn){
  let h="";
  try{ h=fn()||""; }catch(e){ console.error("renderer failed:",e&&e.message,e); return ""; }
  return h.replace(/^\s*<section[^>]*>/,"").replace(/<\/section>\s*$/,"");
}
const G = k => (window.GTMB && GTMB[k]) ? GTMB[k] : (()=> "");
const mergeDiv = `<div class="hr" style="margin:26px 0 18px;opacity:.5"></div>`;
/* newId → ordered list of renderer thunks it composes */
function compose(id, thunks){
  return page(id, thunks.map(stripBody).join(mergeDiv));
}

/* --- Sales × Marketing collaboration (working agreement) ---
   Built for the standing marketing sync: two owned lanes, one shared middle,
   and the handoffs written down so ownership is explicit rather than assumed. */
const COLLAB = {
  /* The two-brand split is the frame for everything below: sales sells what
     American BioCarbon has today; marketing builds ProGreaux for what's next. */
  brands:[
    ["sales","American BioCarbon","What sales sells today","Live now",[
      "The brand sales is actively selling under — right now, and through the transition.",
      "Sales works <b>what's left of American BioCarbon</b>: existing inventory, existing product facts, existing proof.",
      "The ABC site and collateral are the <b>foundation and backdrop for outreach</b> — enough to make outbound credible, not a brand program.",
      "Maintenance-level effort. Nobody is investing in growing this brand; it carries the revenue while ProGreaux gets built.",
    ]],
    ["mktg","ProGreaux","What marketing is building","Marketing owns 100%",[
      "The rebrand is <b>entirely marketing's</b> — narrative, identity, site, launch, timing, sequencing.",
      "Sales has no build role here and no approval gate. Marketing decides what it is and when it lands.",
      "Sales' only ask: <b>tell us the date and the story before a customer does</b>, so live conversations don't contradict the launch.",
      "Target window: on or around <b>Aug 17</b>. If that moves, sales needs to hear it — that's the whole dependency.",
    ]],
  ],
  sales:{ who:"Jesse · Victor · Daniel", own:[
    ["Owns outright",[
      "<b>Outbound & pipeline</b> — target account list, sequences, calls, LinkedIn touches.",
      "<b>Discovery & qualification</b> — fit, volume, timeline, decision path.",
      "<b>Sample-to-LOI motion</b> — sample requests through signed LOI.",
      "<b>Pricing & terms conversations</b> — quotes, freight, negotiation.",
      "<b>Account relationships</b> — the named buyer, from first touch to reorder.",
      "<b>Selling American BioCarbon</b> — the current brand, current inventory, as-is.",
      "<b>Sales data & CRM hygiene</b> — pipeline records, outcomes, and reasons live with sales.",
    ]],
    ["Decides",[
      "Which accounts and segments we chase this month.",
      "Whether a lead is worked, nurtured, or disqualified.",
      "What gets said on a live call.",
      "What the ABC backdrop needs to be credible for outreach.",
    ]],
  ]},
  mktg:{ who:"Marketing team", own:[
    ["Owns outright",[
      "<b>ProGreaux — the entire rebrand</b>. Narrative, identity, launch, timing. Marketing's call, end to end.",
      "<b>Brand & voice</b> — how we look and sound everywhere, both brands.",
      "<b>Website & digital presence</b> — site, SEO, landing pages, analytics.",
      "<b>Demand generation</b> — paid, organic, social, email nurture.",
      "<b>Content production</b> — one-pagers, deck design, case studies, photo/video.",
      "<b>Inbound lead generation</b> — creating the demand that becomes sales' inbound.",
    ]],
    ["Decides",[
      "Everything ProGreaux: what it is, what it says, when it launches.",
      "Brand system: palette, typography, logo usage, template standards.",
      "Channel mix and campaign calendar.",
      "Final creative execution on anything public-facing.",
    ]],
  ]},
  seams:[
    ["to-sales","→","<b>Inbound leads</b> — handed off to sales with source, campaign, and context attached."],
    ["to-mktg","←","<b>Outbound leads</b> — what sales is generating and hearing in-market, fed back so campaigns aim better."],
    ["to-sales","→","<b>Collateral</b> — decks, one-pagers, sample sheets, on brand."],
    ["to-mktg","←","<b>Asset requests</b> — one queue, with the deal reason attached."],
    ["to-sales","→","<b>Site & landing pages</b> that outbound can point to."],
    ["to-mktg","←","<b>Outcome data</b> — what closed, what stalled, and why. Sales owns the data and reports it out."],
  ],
  shared:[
    ["Jointly owned — neither side moves alone",[
      "<b>ICP & positioning</b> — same definition of who we sell to and why we win.",
      "<b>Sales messaging & claims</b> — what sales says on calls and in sequences. Marketing shapes the voice, sales pressure-tests it live. Built together, not handed down.",
      "<b>Product facts</b> — one source of truth for specs, certs, capacity, and lead times.",
      "<b>Events & PR</b> — trade shows, press, industry presence. Marketing runs the presence, sales works the room; both plan it.",
      "<b>Pipeline reporting</b> — see below. One number, one definition, both teams quote it identically.",
    ]],
  ],
  /* Pipeline reporting gets its own block — it's the number both teams get
     measured on, so the split between who owns the data and who reads it
     needs to be unambiguous. */
  reporting:[
    ["Sales owns the data","sales","Every record, outcome, and reason code. If it's in the pipeline, sales put it there and sales stands behind it."],
    ["Marketing owns the source","mktg","Which campaign, channel, or event produced the lead — tagged before it ever reaches a seller."],
    ["One number, both mouths","both","Sourced pipeline, conversion by source, and closed volume. Same figure, same definition, whether it's quoted in a sales review or a marketing readout."],
    ["Reported monthly, together","both","Sales brings outcomes; marketing brings sources. The two get reconciled in the room — not in two separate decks that disagree."],
    ["What it's actually for","both","Marketing can only sharpen what it can see. Outcome data going back is what turns spend into better leads next month."],
  ],
  flow:[
    ["01","Lead arrives","Form, event, campaign, or referral — captured with source and campaign attached.","mktg","Marketing"],
    ["02","Handoff to sales","Routed to a named seller with full context. Acknowledged same business day.","mktg","Marketing → Sales"],
    ["03","Qualify","Sales scores it against the shared ICP: work it, nurture it, or disqualify it.","sales","Sales"],
    ["04","Work the account","Discovery, sample, quote, LOI. Sales owns every touch from here.","sales","Sales"],
    ["05","Report back","Outcome + reason logged, so campaigns get sharper instead of guessing.","sales","Sales → Marketing"],
  ],
  /* [workflow, owner, consulted, how it runs, worked example] */
  cadence:[
    ["Weekly sync","30 min","Both","Lead flow, asset queue, what's blocked this week."],
    ["Outbound readout","Bi-weekly","Sales → Marketing","What sales is generating, objections heard, language that landed, competitor mentions."],
    ["Campaign preview","Before launch","Marketing → Sales","Sales sees the message before a prospect does."],
    ["Rebrand checkpoint","Until launch","Marketing → Sales","Marketing's build, marketing's timeline — sales just needs the date and the story kept current."],
    ["Monthly review","60 min","Both","Sourced pipeline, conversion by source, next month's priorities."],
  ],
  agreements:[
    ["Sales sells American BioCarbon as-is; the ABC backdrop is maintained, not grown.",true],
    ["ProGreaux is marketing's build, end to end — no sales approval gate.",false],
    ["Sales gets the rebrand date and story before any customer does.",false],
    ["One intake queue for asset requests — with the deal reason attached.",false],
    ["One canonical product-facts sheet; both teams cite it, neither improvises.",false],
    ["Every inbound handoff acknowledged same business day, by a named person.",false],
    ["Every worked lead gets an outcome + reason back to marketing.",false],
    ["No public claim ships without a sales accuracy check.",false],
    ["No campaign launches without sales seeing the message first.",false],
    ["Sales messaging gets built together — field data in, brand voice out.",false],
    ["One pipeline number, one dashboard, both teams quote it identically.",false],
  ],
};
function rCollab(){
  const C=COLLAB;
  const laneList=(blocks)=>blocks.map(([h,items])=>
    `<div class="lane-sub">${esc(h)}</div><ul>${items.map(i=>`<li>${i}</li>`).join("")}</ul>`).join("");
  const keys=C.agreements.map((_,i)=>`collab:agree:${i}`);
  const st=checkStats(keys,C.agreements.map(a=>a[1]));
  return page("marketing",
    head("Sales × Marketing","How the two teams mesh: what each side owns, what we own together, and how work crosses the line between us. A working agreement to review together, not a scorecard.")+
    `<div class="note info"><b>Frame for the meeting:</b> both teams pull toward the same number. Make the seams explicit (domains, handoffs, turnaround) so nothing falls between us and nothing gets done twice.</div>`+
    sec("1","The rollout: two brands, two jobs")+
    `<p class="lead">Everything below only makes sense against this split. Sales is running one brand to keep revenue moving; marketing is building the next one. Neither team is doing the other's job.</p>`+
    `<div class="brands">${C.brands.map(([side,name,role,tag,pts])=>
      `<div class="brand-card brand-${side}">
         <div class="brand-top"><div><div class="brand-role">${esc(role)}</div><h3>${esc(name)}</h3></div>
         <span class="brand-tag tag-${side}">${esc(tag)}</span></div>
         <ul>${pts.map(p=>`<li>${p}</li>`).join("")}</ul>
       </div>`).join("")}</div>`+
    `<div class="note"><b>Said plainly:</b> sales works <b>what's left of American BioCarbon</b> — the inventory that exists and the proof that exists. The ABC site and collateral are a <b>foundation and backdrop for outreach</b>, nothing more; they need to be accurate and credible, not impressive. <b>ProGreaux is 100% marketing's</b>, start to finish. The only wire between the two is timing: sales needs the launch date and the story before a customer brings it up on a call.</div>`+
    sec("2","Who owns what")+
    `<div class="lanes">
       <div class="lane lane-sales">
         <div class="lane-hd"><div class="lane-mark">S</div><h3>Sales</h3></div>
         <div class="lane-who">${esc(C.sales.who)}</div>
         ${laneList(C.sales.own)}
       </div>
       <div class="lane lane-shared">
         <div class="lane-hd"><div class="lane-mark">∩</div><h3>Together</h3></div>
         <div class="lane-who">The intersection</div>
         ${laneList(C.shared)}
         <div class="lane-sub">What crosses the line</div>
         ${C.seams.map(([cls,dir,txt])=>`<div class="seam ${cls}"><span class="dir">${dir}</span><span>${txt}</span></div>`).join("")}
       </div>
       <div class="lane lane-mktg">
         <div class="lane-hd"><div class="lane-mark">M</div><h3>Marketing</h3></div>
         <div class="lane-who">${esc(C.mktg.who)}</div>
         ${laneList(C.mktg.own)}
       </div>
     </div>`+
    `<div class="note">Read the middle column first. The outer lanes are where each team moves without asking; the middle is where we move together, and where most misfires between two good teams start.</div>`+
    sec("3","The inbound handoff, end to end")+
    `<div class="flow">${C.flow.map(([n,t,d,o,lbl])=>
      `<div class="flow-step"><div class="n">${n}</div><div class="t">${esc(t)}</div><div class="d">${esc(d)}</div>
       <span class="owner owner-${o}">${esc(lbl)}</span></div>`).join("")}</div>`+
    `<div class="note ok"><b>Step 05 is not optional.</b> Marketing can only sharpen what it sees. If outcomes never come back, sales inherits weaker leads next quarter.</div>`+
    sec("4","Pipeline reporting")+
    `<div class="grid g2">${C.reporting.map(([t,side,d])=>
      `<div class="card rep-card rep-${side}"><h4>${esc(t)} <span class="owner owner-${side}">${side==="sales"?"Sales":side==="mktg"?"Marketing":"Both"}</span></h4>
       <p>${esc(d)}</p></div>`).join("")}</div>`+
    `<div class="note ok"><b>One number, one definition.</b> Two different pipeline figures and every agreement on this page gets re-litigated monthly.</div>`+
    sec("5","Cadence")+
    table(["Ritual","Length","Direction","Purpose"],C.cadence.map(r=>[
      `<strong>${esc(r[0])}</strong>`,esc(r[1]),esc(r[2]),esc(r[3])]))+
    sec("6","Working agreements")+
    `<p class="lead">Things both teams should be able to say out loud without hesitating. Check them off as we land them. <b style="color:var(--navy-800)">${st.done}/${st.total} agreed</b></p>`+
    C.agreements.map((a,i)=>chk(`collab:agree:${i}`,a[0],a[1])).join("")
  );
}

/* LEAN = daily-driver. BUILD = parked heavy modules (build-later.html). */
const LEAN_SECTIONS=[
  // Consolidated IA (v5): 10 → 6 sections.
  //   daily      = the canonical hub (header → calendar → foundation → launch gates → horizon)
  //   strategy   = thesis + ICP/segments/personas + campaigns
  //   product    = product facts + messaging
  //   outreach   = target accounts + full outreach engine (id kept for gtm CSS hooks)
  //   playbook   = collateral/samples + discovery playbook
  //   onboarding = customer onboarding + 60/90 scale
  ["daily",    [rDaily, G("r30Day"), rChecklist, G("rPrelaunch"), G("rLaunch"), rHorizon]],
  ["strategy", [G("rSummary"), rSegments, rPersonas, G("rCampaigns")]],
  ["product",  [rBiochar, rMessaging]],
  ["outreach", [rAccounts, rOutreach, G("rSequences"), G("rCalling"), G("rScriptLibrary"), G("rLinkedIn"), G("rSocial"), G("rLongTerm")]],
  ["playbook", [rCollateral, G("rSample"), rPlaybook]],
  ["onboarding",[rOnboarding, G("rScale")]],
  ["marketing", [rCollab]],
];
const BUILD_SECTIONS=[
  ["b-overview",  [rOverview, rAssumptions]],
  ["b-market",    [rMarket, rBarge, rPricing]],
  ["b-crm",       [rPipeline, G("rCRM"), G("rLanding")]],
  ["b-dashboard", [rKpis, G("rDashboard")]],
];
function render(){
  const SECTIONS = (window.OS_VIEW==="build") ? BUILD_SECTIONS : LEAN_SECTIONS;
  $("#content").innerHTML = SECTIONS.map(([id,thunks])=>compose(id,thunks)).join("");
}
buildNav();
render();
$("#menuBtn").addEventListener("click",()=>$("#sidebar").classList.toggle("open"));
const defaultId = NAV[0].items[0].id;
const isNavId = id => NAV.flatMap(g=>g.items).some(i=>i.id===id);
const start=(location.hash||"").slice(1);
go(isNavId(start)?start:defaultId);
recalc();
/* go() writes location.hash on every nav, so without this Back/Forward changes the URL and
   nothing else. Re-setting the hash to its current value does not re-fire hashchange, so
   calling go() from here cannot loop. */
window.addEventListener("hashchange", () => {
  const id = (location.hash||"").slice(1);
  if(isNavId(id)) go(id);
});
