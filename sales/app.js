/* ============ VEJ Sales OS · app shell & renderers ============ */
const $ = (s,el=document)=>el.querySelector(s);
const esc = s => String(s??"").replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;");
const nl = s => esc(s).replace(/\n/g,"<br>");

/* ---- persistent checklists (localStorage-backed; stays checked across reloads) ---- */
const CHECK_KEY = "vej_checks_v1";
function getChecks(){ try { return JSON.parse(localStorage.getItem(CHECK_KEY)) || {}; } catch(e){ return {}; } }
function setCheck(k,on){ const c=getChecks(); c[k]= on?1:0; try{ localStorage.setItem(CHECK_KEY, JSON.stringify(c)); }catch(e){} }
/* chk(key, labelHTML, def): labelHTML is trusted HTML; def = default-checked when never touched */
function chk(key, labelHTML, def){ const v=getChecks()[key]; const on = (v===undefined? !!def : !!v) ? " done" : ""; return `<label class="chk${on}" data-k="${esc(key)}" onclick="toggleChk(this)"><span class="box">✓</span><span class="lbl">${labelHTML}</span></label>`; }
function checkStats(keys, defs){ const c=getChecks(); let done=0; keys.forEach((k,i)=>{ const v=c[k]; if(v===undefined? (defs&&defs[i]):v) done++; }); return {done, total:keys.length}; }
window.toggleChk = el => { const on = !el.classList.contains("done"); el.classList.toggle("done", on); setCheck(el.dataset.k, on); };
window.resetChecks = pfx => { const c=getChecks(); Object.keys(c).forEach(k=>{ if(!pfx||k.startsWith(pfx)) delete c[k]; }); localStorage.setItem(CHECK_KEY, JSON.stringify(c)); go((location.hash||"#overview").slice(1)); };

/* ---- toast + copy ---- */
function toast(msg="Copied to clipboard"){const t=$("#toast");t.textContent=msg;t.classList.add("show");setTimeout(()=>t.classList.remove("show"),1400);}
function copyText(txt){navigator.clipboard?.writeText(txt).then(()=>toast()).catch(()=>toast("Copy failed"));}
window.copyEl = id => { const e=document.getElementById(id); if(e) copyText(e.dataset.raw||e.textContent); };

/* ---- helpers ---- */
const tier = t => { const p=DATA.proofTiers.find(x=>x.t===t); return `<span class="proof proof-${t}" title="${esc(p?.name||'')}">T${t}</span>`; };
/* ============================================================
   Badge system — single source of truth
   ------------------------------------------------------------
   Presentation is expressed as a small set of semantic TONES.
   Business/workflow state is mapped to a tone in STATE below, so
   pages never contain scattered `x==="Done"?"green":...` logic and
   raw enum values are never shown unformatted. Unknown values fail
   safe (neutral tone + a dev-visible warning) — they are never
   silently styled as success/active/approved.
   ============================================================ */
const TONES = ["neutral","info","positive","warning","critical","pending","active","inactive","category"];
/* Legacy colour class -> semantic tone (for un-migrated literal calls) */
const TONE_ALIAS = {"badge-muted":"neutral","badge-blue":"info","badge-green":"positive",
  "badge-gold":"warning","badge-red":"critical","pri-1":"critical","pri-2":"warning","pri-3":"neutral"};
function toneClass(tone){
  if(TONES.includes(tone)) return "badge--"+tone;
  if(TONE_ALIAS[tone]) return "badge--"+TONE_ALIAS[tone];
  return tone && /^(badge-|pri-)/.test(tone) ? tone : "badge--neutral";
}
/* badge(text, tone) — tone is a semantic name (preferred) or a legacy class. */
const badge = (txt,tone="neutral",opts={})=>{
  const sr = opts.sr ? `<span class="sr-only">${esc(opts.sr)} </span>` : "";
  return `<span class="badge ${toneClass(tone)}"${opts.title?` title="${esc(opts.title)}"`:""}>${sr}${esc(txt)}</span>`;
};

/* Exhaustive state maps: raw value -> {label, tone}. Presentation boundary
   only — raw values stay intact for sorting/filtering/persistence. */
const STATE = {
  dealStage: {
    Prospect:{label:"Prospect",tone:"neutral"}, Contacted:{label:"Contacted",tone:"info"},
    Discovery:{label:"Discovery",tone:"info"}, Sample:{label:"Sample sent",tone:"pending"},
    Trial:{label:"Trial",tone:"pending"}, Negotiation:{label:"Negotiation",tone:"warning"},
    Won:{label:"Won",tone:"positive"}, Lost:{label:"Lost",tone:"critical"},
    Blocked:{label:"Blocked",tone:"critical"}
  },
  taskStatus: {
    todo:{label:"To do",tone:"neutral"}, doing:{label:"In progress",tone:"active"},
    blocked:{label:"Blocked",tone:"critical"}, done:{label:"Done",tone:"positive"},
    "To do":{label:"To do",tone:"neutral"}, Doing:{label:"In progress",tone:"active"},
    Done:{label:"Done",tone:"positive"}, Todo:{label:"To do",tone:"neutral"}
  },
  priority: {
    P0:{label:"P0",tone:"critical"}, P1:{label:"P1",tone:"warning"},
    P2:{label:"P2",tone:"neutral"}, P3:{label:"P3",tone:"neutral"}
  },
  confidence: {
    High:{label:"High",tone:"positive"}, Med:{label:"Med",tone:"warning"}, Low:{label:"Low",tone:"critical"}
  },
  freightZone: {
    A:{label:"Zone A",tone:"positive"}, B:{label:"Zone B",tone:"warning"}, C:{label:"Zone C",tone:"critical"}
  },
  requirement: {
    Req:{label:"Required",tone:"positive"}, Required:{label:"Required",tone:"positive"},
    Recommended:{label:"Recommended",tone:"warning"}, Auto:{label:"Auto",tone:"info"},
    Optional:{label:"Optional",tone:"neutral"}
  }
};
/* Resolve a state and render its badge. Unknown -> neutral + dev warning. */
function stateInfo(domain, value){
  const map = STATE[domain]||{};
  const hit = map[value];
  if(hit) return hit;
  if(typeof console!=="undefined" && value!=null)
    console.warn(`[badge] unmapped ${domain} value: ${JSON.stringify(value)} — falling back to neutral`);
  return {label:(value==null||value==="")?"—":String(value), tone:"neutral"};
}
const stateBadge = (domain, value)=>{ const i=stateInfo(domain,value); return badge(i.label, i.tone, {sr:i.sr}); };
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
const NAV=[
  {group:"Focus",items:[
    {id:"tasks",ic:"◎",t:"Tasks"},
    {id:"today",ic:"☰",t:"Daily Action Plan"},
  ]},
  {group:"Strategy",items:[
    {id:"overview",ic:"◆",t:"Executive Overview"},
    {id:"assumptions",ic:"◇",t:"Assumptions & Inputs"},
    {id:"segments",ic:"◈",t:"ICP & Segments"},
    {id:"personas",ic:"◉",t:"Buyer Personas"},
    {id:"messaging",ic:"❝",t:"Messaging & Proof"},
    {id:"biochar",ic:"🌱",t:"Biochar Specs & Avatars"},
    {id:"market",ic:"▤",t:"TAM / SAM / SOM"},
    {id:"barge",ic:"⚓",t:"Barge Cost Analysis"},
  ]},
  {group:"Execution",items:[
    {id:"pipeline",ic:"▦",t:"Pipeline Builder"},
    {id:"accounts",ic:"▥",t:"Target Accounts"},
    {id:"outreach",ic:"✉",t:"Outreach Engine"},
    {id:"collateral",ic:"▣",t:"Collateral Library"},
    {id:"pricing",ic:"$",t:"Pricing & Economics"},
    {id:"playbook",ic:"▷",t:"Sales Playbook"},
  ]},
  {group:"Operate",items:[
    {id:"kpis",ic:"▲",t:"Metrics & KPIs"},
    {id:"roadmap",ic:"◐",t:"30/60/90 Roadmap"},
    {id:"checklist",ic:"✓",t:"Launch Checklist"},
  ]},
];

function buildNav(){
  $("#nav").innerHTML = NAV.map(g=>`<div class="nav-group">${g.group}</div>`+
    g.items.map(i=>`<a data-id="${i.id}" onclick="go('${i.id}')"><span class="ic">${i.ic}</span>${i.t}</a>`).join("")
  ).join("");
}
const titleOf = id => NAV.flatMap(g=>g.items).find(i=>i.id===id)?.t||"";

function go(id){
  document.querySelectorAll(".section").forEach(s=>s.classList.remove("active"));
  const sec=document.getElementById("sec-"+id); if(sec)sec.classList.add("active");
  document.querySelectorAll(".nav a").forEach(a=>a.classList.toggle("active",a.dataset.id===id));
  $("#topbarTitle").textContent=titleOf(id);
  $("#sidebar").classList.remove("open");
  window.scrollTo(0,0); location.hash=id;
}

/* ================= RENDERERS ================= */
function page(id,inner){return `<section class="section" id="sec-${id}">${inner}</section>`;}
function head(t,sub){return `<h1 class="page-h">${t}</h1><p class="page-sub">${sub}</p>`;}
function sec(num,t){return `<h2 class="sec"><span class="num">${num}</span>${t}</h2>`;}

/* ================= TASKS (daily home) ================= */
const taskPriBadge = p => stateBadge("priority", p);
const PRW = {P0:0,P1:1,P2:2};

/* small clickable badge injected into connected views ("N open tasks") */
function openTaskBadge(view){
  if(typeof TasksAPI==="undefined") return "";
  const n=TasksAPI.openForView(view); if(!n) return "";
  return `<button class="badge badge--warning task-badge" onclick="go('tasks')" title="Open tasks linked to this view"><span class="count count--alert">${n}</span> open task${n>1?"s":""}</button>`;
}

function taskRow(t){
  const done=t.done?" done":"";
  const stLabel = stateInfo("taskStatus", t.status).label;
  const st = t.done ? "" : `<button type="button" class="tstatus s-${t.status}" onclick="tCycle('${t.id}')" aria-label="Status: ${esc(stLabel)}. Change status">${esc(stLabel)}</button>`;
  const od = (t.overdue) ? `<span class="badge badge--critical tood">${-t.dueRel}d overdue</span>` : "";
  const link = t.link ? `<button class="tlink" onclick="tGo('${t.link.view}','${esc(t.link.anchor||"")}')">Open →</button>` : "";
  return `<div class="task${done}" data-owner="${esc(t.owner)}">
    <span class="tbox" role="checkbox" tabindex="0" aria-checked="${t.done?"true":"false"}" aria-label="Mark task done" onclick="tTog('${esc(t.checkKey)}')" onkeydown="if(event.key===' '||event.key==='Enter'){event.preventDefault();tTog('${esc(t.checkKey)}')}">✓</span>
    <div class="tmain">
      <div class="thead">${whoBadge(t.owner)}${taskPriBadge(t.priority)}${st?" "+st:""}${od?" "+od:""}<span class="ttitle">${esc(t.title)}</span></div>
      ${t.detail?`<div class="tdetail">${esc(t.detail)}</div>`:""}
    </div>
    <div class="tactions">${link}</div>
  </div>`;
}

function ownerGroup(title,cls,rows){
  if(!rows.length) return "";
  return `<div class="towner"><div class="towner-h ${cls}">${esc(title)} <span class="chk-progress">${rows.length}</span></div>${rows.map(taskRow).join("")}</div>`;
}

function punchBlock(pl,idx){
  const keys=pl.items.map((_,i)=>`punch:${pl.id}:${i}`);
  const st=checkStats(keys, pl.items.map(()=>false));
  const pct=st.total?Math.round(st.done/st.total*100):0;
  const rows=pl.items.map((it,i)=>chk(keys[i],esc(it),false)).join("");
  const rec=pl.recurring?badge("daily","info"):"";
  const link=pl.link?`<button class="tlink" onclick="tGo('${pl.link.view}','')">View →</button>`:"";
  const open=idx===0?" open":""; const openh=idx===0?" open-h":"";
  return `<div class="punch">
    <div class="punch-h${openh}" onclick="punchToggle(${idx})">
      <div class="punch-t">${esc(pl.title)} ${rec}</div>
      <div class="punch-meta"><div class="tprog"><span style="width:${pct}%"></span></div><span class="chk-progress">${st.done}/${st.total}</span><span class="chev">▸</span></div>
    </div>
    <div class="punch-b${open}" id="punch-${idx}">${rows}
      <div class="chk-head"><span>${link}</span><span class="chk-reset" onclick="resetChecks('punch:${pl.id}:')">Reset</span></div>
    </div>
  </div>`;
}
window.punchToggle=i=>{const b=document.getElementById("punch-"+i);const h=b.previousElementSibling;b.classList.toggle("open");h.classList.toggle("open-h");};

function rTasks(){
  if(typeof TasksAPI==="undefined") return page("tasks",head("Tasks","Task engine unavailable."));
  const all=TasksAPI.all();
  const total=all.length, done=all.filter(t=>t.done).length, pct=total?Math.round(done/total*100):0;

  // Today = due today or overdue, not done; sort P0>P1>P2 then most overdue first
  const bySort=(a,b)=>(PRW[a.priority]-PRW[b.priority])||(a.dueRel-b.dueRel);
  const todayItems=all.filter(t=>!t.done && t.dueRel<=0).sort(bySort);
  const byOwner=o=>todayItems.filter(t=>t.owner===o);
  const todayHTML = todayItems.length
    ? ownerGroup("Jesse · demand & the machine","j",byOwner("jesse"))
      +ownerGroup("Victor · product, proof & fulfillment","v",byOwner("victor"))
      +ownerGroup("Both","both",byOwner("both"))
    : `<div class="note ok">Nothing due or overdue today. Pull ahead from This Week, or add a task below.</div>`;

  // This Week = the calendar week containing today
  const cd=TasksAPI.todayCalDay();
  const cwk=((typeof GTM!=="undefined"&&GTM.calendar||[]).find(d=>d.d===cd)||{}).wk||1;
  const weekItems=all.filter(t=>t.wk===cwk).sort((a,b)=>(a.calDay-b.calDay)||bySort(a,b));
  const wdone=weekItems.filter(t=>t.done).length;
  const weekHTML = weekItems.length
    ? weekItems.map(taskRow).join("")
    : `<div class="note">No calendar tasks scheduled for this week.</div>`;

  const punches=(TasksAPI.punchlists||[]).map(punchBlock).join("");

  return page("tasks",
    head("Tasks","Your daily home. Today's action items, this week's calendar, and every punch list — all check-off-able and interlinked with accounts, pipeline, outreach and the roadmap. State persists locally; the morning cron agent keeps it fresh.")+
    `<div class="daily-mission card pad-lg">
       <div class="dm-row"><span class="dm-tag">ALL TASKS</span><div class="dm-bar"><span style="width:${pct}%"></span></div><span class="dm-pct">${done}/${total} · ${pct}%</span></div>
       <p class="dm-mission">${esc((typeof DATA!=="undefined"&&DATA.daily&&DATA.daily.mission)||"Get free performance samples of both live products into buyers' hands — the only Month-1 win.")}</p>
       <div class="note" style="margin-top:10px"><b>Deep day-by-day plan →</b> <a href="#today" onclick="go('today');return false" style="color:var(--gold-soft)">Daily Action Plan</a> · roll-up in the <a href="#roadmap" onclick="go('roadmap');return false" style="color:var(--gold-soft)">30/60/90 Roadmap</a>.</div>
     </div>`+
    sec("","Today · due or overdue")+todayHTML+
    `<div class="chk-head"><h3 class="sub" style="margin:0">This Week · Week ${cwk}</h3><span class="chk-progress">${wdone}/${weekItems.length} done</span></div>`+
    `<p class="lead" style="margin:2px 0 8px">The current calendar week rendered as live, checkable tasks. Checking one here also ticks it on the <a href="#gtm-30day" onclick="go('gtm-30day');return false" style="color:var(--gold-soft)">30-Day calendar</a>.</p>`+
    weekHTML+
    sec("","Punch lists")+
    `<p class="lead" style="margin:2px 0 10px">Collapsible, check-off-able, progress-tracked. State persists across reloads.</p>`+
    punches+
    sec("","Quick add")+
    `<div class="calc"><div class="qa-grid">
      <div class="field" style="grid-column:span 2"><label>Task title</label><input type="text" id="qa_title" placeholder="e.g. Follow up with Pelican Oilfield on sample"></div>
      <div class="field"><label>Owner</label><select id="qa_owner"><option value="jesse">Jesse</option><option value="victor">Victor</option><option value="both">Both</option></select></div>
      <div class="field"><label>Priority</label><select id="qa_pri"><option value="P1">P1</option><option value="P0">P0</option><option value="P2">P2</option></select></div>
      <div class="field"><label>Due</label><input type="date" id="qa_due" value="${TasksAPI.todayYMD()}"></div>
      <div class="field" style="justify-content:flex-end"><button class="btn btn-green" onclick="tAdd()">Add task</button></div>
    </div><div class="note" style="margin:12px 0 0">Quick-adds persist in your browser (overlay). Base tasks & punch lists live in <code>tasks-data.js</code> and are refreshed by the morning cron agent.</div></div>`
  );
}

/* re-render only the tasks section in place (keeps router + nav intact) */
window.renderTasks=function(){
  const cur=document.getElementById("sec-tasks"); if(!cur) return;
  const tmp=document.createElement("div"); tmp.innerHTML=rTasks();
  const fresh=tmp.firstElementChild;
  if(cur.classList.contains("active")) fresh.classList.add("active");
  cur.replaceWith(fresh);
};
window.tTog=key=>{ const on=!getChecks()[key]; setCheck(key,on); renderTasks(); };
window.tCycle=id=>{ const t=TasksAPI.all().find(x=>x.id===id); if(!t)return; const order=["todo","doing","blocked"]; TasksAPI.setStatus(id, order[(order.indexOf(t.status)+1)%order.length]); renderTasks(); };
window.tGo=(view,anchor)=>{ go(view); if(anchor){ const el=document.getElementById(anchor); if(el) setTimeout(()=>el.scrollIntoView({behavior:"smooth",block:"start"}),60); } };
window.tAdd=function(){
  const el=document.getElementById("qa_title"); const title=el?el.value.trim():"";
  if(!title){ toast("Enter a task title"); return; }
  TasksAPI.add({ title, owner:document.getElementById("qa_owner").value, priority:document.getElementById("qa_pri").value, due:document.getElementById("qa_due").value||TasksAPI.todayYMD() });
  toast("Task added"); renderTasks();
};

/* --- Daily Action Plan (top-of-app focus) --- */
function rDaily(){
  const D=DATA.daily;
  const secMap=Object.fromEntries(D.sectors.map(s=>[s.k,s]));
  // overall progress across every daily task
  const allKeys=[], allDefs=[];
  D.days.forEach(day=>day.lanes.forEach(l=>l.items.forEach((it,i)=>{allKeys.push(`daily:${day.d}:${l.k}:${i}`);allDefs.push(false);})));
  const st=checkStats(allKeys,allDefs);
  const pct=st.total?Math.round(st.done/st.total*100):0;
  const legend=`<div class="daily-legend">${D.sectors.map(s=>`<span class="dsec"><i style="background:${s.c}"></i><b>${esc(s.t)}</b><em>${esc(s.d)}</em></span>`).join("")}</div>`;
  const days=D.days.map(day=>{
    const keys=[],defs=[];
    day.lanes.forEach(l=>l.items.forEach((it,i)=>{keys.push(`daily:${day.d}:${l.k}:${i}`);defs.push(false);}));
    const ds=checkStats(keys,defs);
    const lanes=day.lanes.map(l=>{
      const s=secMap[l.k]||{c:"#8a93a0",t:l.k};
      const rows=l.items.map((it,i)=>{
        const pri=stateBadge("priority", it.pri);
        const label=`${whoBadge(it.o)}${pri} ${esc(it.t)}<span class="del">→ ${esc(it.del)}</span>`;
        return chk(`daily:${day.d}:${l.k}:${i}`,label,false);
      }).join("");
      return `<div class="dlane" style="--sc:${s.c}"><div class="dlane-h"><span class="ddot" style="background:${s.c}"></span>${esc(s.t)}</div>${rows}</div>`;
    }).join("");
    return `<div class="card daily-day">
      <div class="chk-head" style="align-items:flex-start">
        <div><span class="dbadge">Day ${day.d}</span> <b class="dtheme">${esc(day.theme)}</b><div class="dwk">${esc(day.wk)}</div></div>
        <span class="chk-progress">${ds.done}/${ds.total}</span>
      </div>
      <div class="note ok daily-focus"><b>Focus:</b> ${esc(day.focus)}</div>
      <div class="dlanes">${lanes}</div>
    </div>`;
  }).join("");
  return page("today",
    head("Daily Action Plan","Day-by-day, sector-by-sector, the exact plan to stay focused. Work top to bottom; every item is a checkbox that persists across reloads.")+
    `<div class="daily-mission card pad-lg">
       <div class="dm-row"><span class="dm-tag">THE MISSION</span><div class="dm-bar"><span style="width:${pct}%"></span></div><span class="dm-pct">${st.done}/${st.total} · ${pct}%</span></div>
       <p class="dm-mission">${esc(D.mission)}</p>
       <div class="note" style="margin-top:10px"><b>2-week target:</b> ${esc(D.target)}</div>
     </div>`+
    legend+
    sec("","The 2-week build-out · day by day")+
    days+
    `<div class="chk-head" style="margin-top:14px"><span class="note" style="margin:0;flex:1"><b>Days 11–90 →</b> continue in the <a href="#roadmap" onclick="go('roadmap');return false" style="color:var(--gold-soft)">30/60/90 Roadmap</a> and track hygiene in the <a href="#checklist" onclick="go('checklist');return false" style="color:var(--gold-soft)">Launch Checklist</a>.</span><span class="chk-reset" onclick="resetChecks('daily:')">Reset daily checkmarks</span></div>`
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
    sec("","Claim discipline · proof hierarchy")+
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
      stateBadge("confidence", a.conf),esc(a.verify)]))+
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
  // Month-1 beachhead score: weight speed-to-LOI heavily; carbon is parked (shown as a column, excluded from the score).
  const ranked=[...DATA.segments].map(s=>({s,score:s.rank.speed*3+s.rank.recurring+s.rank.margin+s.rank.strategic+s.rank.freight-s.rank.complexity})).sort((a,b)=>b.score-a.score);
  const top3=ranked.slice(0,3).map(r=>r.s.name);
  const filters=`<div class="filters"><span class="pill active" role="button" tabindex="0" aria-pressed="true" onclick="segFilter(this,'all')">All</span>${groups.map(g=>`<span class="pill" role="button" tabindex="0" aria-pressed="false" onclick="segFilter(this,'${esc(g)}')">${esc(g)}</span>`).join("")}</div>`;
  const cards=DATA.segments.map(s=>segCard(s)).join("");
  return page("segments",
    head("ICP Definition & Segmentation","Tight profiles for every buyer type, ranked by Month-1 speed-to-LOI (carbon is parked to days 61–90, shown as a column, excluded from the beachhead score).")+
    `<div class="note ok"><b>Recommended beachhead (top 3):</b> ${top3.map(t=>badge(t,"positive")).join(" ")}</div>`+
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
    <h4>${esc(s.name)} ${s.tag?badge(s.tag,s.tag.includes("#1")?"positive":s.tag.includes("Monetization")?"warning":"info"):""}</h4>
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
      <div><b style="color:var(--text)">Proof to lead with:</b> ${s.proof.map(p=>badge(p,"info")).join(" ")}</div>
      <div style="margin-top:4px">${s.tags.map(t=>`<span class="badge badge--neutral" style="font-size:10px">${esc(t)}</span>`).join(" ")}</div>
    </div>
  </div>`;
}
window.segFilter=(el,g)=>{
  document.querySelectorAll("#sec-segments .pill").forEach(p=>{p.classList.remove("active");if(p.hasAttribute("aria-pressed"))p.setAttribute("aria-pressed","false")});el.classList.add("active");if(el.hasAttribute("aria-pressed"))el.setAttribute("aria-pressed","true");
  document.querySelectorAll("#segCards .seg-card").forEach(c=>c.style.display=(g==="all"||c.dataset.group===g)?"":"none");
};

/* --- Personas --- */
function rPersonas(){
  return page("personas",
    head("Buyer Personas","What each buyer cares about, fears, and needs, with the discovery questions, opener, and CTA that land.")+
    `<div class="grid g2">${DATA.personas.map(p=>`
      <div class="card pad-lg">
        <h4>${esc(p.name)} ${badge(p.seg,"info")}</h4>
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
      <span class="badge badge--neutral">${esc(t.audience)}</span>
    </div>
    <div class="note" style="margin:10px 0"><b>Avatar:</b> ${esc(t.avatar)}</div>
    <p style="color:var(--text);font-size:13.5px;line-height:1.6"><b style="color:${accent(t.id)}">Positioning:</b> ${esc(t.positioning)}</p>
    <div class="card" style="margin:10px 0"><h4>One-liner</h4><p style="color:var(--text)">${esc(t.oneLiner)}</p></div>
    <div class="grid g2">
      <div class="card">${script(t.product+" · 30-second pitch",t.pitch30)}</div>
      <div class="card">${script(t.product+" · 90-second pitch",t.pitch90)}</div>
    </div>
    <div class="grid g2" style="margin-top:10px">
      <div><b style="font-size:11px;color:var(--green-bright)">Proof to use</b><ul>${t.proof.map(p=>`<li>${esc(p)}</li>`).join("")}</ul></div>
      <div><b style="font-size:11px;color:var(--red-soft)">NEVER say in this pitch</b><ul>${t.neverSay.map(p=>`<li>${esc(p)}</li>`).join("")}</ul></div>
    </div>
  </div>`;
  return page("messaging",
    head("Value Proposition & Messaging","TWO separate avatars. Every pitch is single-product. Absorbent Pellets sell to industrial/EHS/spill buyers; Biochar sells to ag/soil/grower buyers. Different person, different pain, different proof.")+
    `<div class="note warn"><b>Split rule:</b> ${esc(m.splitRule)}</div>`+
    sec("5","Track A · Absorbent Pellets (industrial)")+trackBlock(m.tracks[0])+
    sec("","Track B · 100% Biochar (agriculture)")+trackBlock(m.tracks[1])+
    sec("","Comparison messaging (use only within the matching track)")+
    table(["Positioned against","Why we win"],m.comparisons.map(c=>[`<strong>${esc(c.vs)}</strong>`,esc(c.win)]))+
    sec("","Proof-point map (claim safety, both products)")+
    `<p class="lead">Match every claim to its tier. Use the safe wording. Avoid the risky wording. It creates legal & credibility exposure.</p>`+
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
      <span class="badge badge--neutral">${esc(a.who)}</span>
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
    head("Biochar · Specs, Data & Avatars","Biochar is the dynamic product: one material, MANY buyers. Full spec, benefit-by-mechanism, industry comparisons, and a differentiated avatar for each buyer type. Pull the ONE benefit + comparison that fits the buyer in front of you.")+
    `<div class="card pad-lg"><p style="color:var(--text);font-size:13.5px;line-height:1.6">${esc(b.intro)}</p></div>`+
    sec("","Technical spec sheet")+
    table(["Property","Value"],b.spec.map(r=>[`<strong>${esc(r[0])}</strong>`,esc(r[1])]))+
    sec("","Benefits by mechanism · match to the avatar")+
    table(["Mechanism","What it does","Best for","Tier"],b.benefits.map(x=>[
      `<strong>${esc(x.mech)}</strong>`,esc(x.b),`<span style="color:var(--gold-soft)">${esc(x.who)}</span>`,tier(x.tier)]))+
    sec("","Industry comparisons · how biochar stacks up")+
    b.comparisons.map(c=>`<h3 class="sub">${esc(c.h)}</h3>`+table(c.cols.map(h=>esc(h)),c.rows.map(r=>r.map(x=>esc(x))))).join("")+
    sec("","Biochar avatars · one material, differentiated per buyer")+
    `<p class="lead">Absorbent Pellets have one industrial avatar; biochar sells across all of these. Each gets a different lead benefit and a different claim boundary, never a generic biochar pitch.</p>`+
    b.avatars.map(avatarCard).join("")+
    sec("","Claim guardrails")+
    `<div class="note warn"><ul>${b.guardrails.map(g=>`<li>${esc(g)}</li>`).join("")}</ul></div>`
  );
}

/* --- Market --- */
function rMarket(){
  const mk=DATA.market;
  return page("market",
    head("TAM / SAM / SOM & Beachhead Strategy","A transport-aware model built from cited public anchors (USGS, USDA-AMS, IFEEDER/NARA, Grand View, Puro/CDR.fyi). [A] = stated assumption. Freight, not demand, caps the addressable market, differently per product by $/ton.")+
    `<div class="note warn">${esc(mk.note)}</div>`+
    sec("6","Market model · TAM / SAM / SOM (low / base / high)")+
    table(["Market","TAM (tons / $)","SAM (freight-viable)","SOM year 1 (low / base / high)","Mode & note"],mk.som.map(x=>[
      `<strong>${esc(x.m)}</strong>`,esc(x.tam),esc(x.sam),`<span style="color:var(--green-bright)">${esc(x.som)}</span>`,esc(x.note)]))+
    (mk.modeVerdict?sec("","Transport mode verdict by product")+
      table(["Product","Best truck radius","Rail verdict","Primary reason"],mk.modeVerdict.map(m=>[
        `<strong>${esc(m.p)}</strong>`,`<span class="t-num">${esc(m.truck)}</span>`,badge(m.rail,/Strong|Material/.test(m.rail)?"positive":/Marginal|Amplifies/.test(m.rail)?"warning":"neutral"),esc(m.why)])):"")+
    (mk.transport?sec("","Transport & rail model")+
      `<div class="card"><ul>${mk.transport.map(t=>`<li>${esc(t)}</li>`).join("")}</ul></div>`:"")+
    (mk.priceRefs?sec("","Reference prices used")+
      table(["Product","Price","Basis"],mk.priceRefs.map(p=>[`<strong>${esc(p.p)}</strong>`,`<span class="t-num">${esc(p.price)}</span>`,esc(p.note)])):"")+
    sec("","Target account criteria")+
    table(["Filter","Rule"],mk.accountCriteria.map(c=>[`<strong>${esc(c.f)}</strong>`,esc(c.v)]))+
    (mk.assumptions?sec("","Key assumptions [A]")+
      `<div class="card"><ul>${mk.assumptions.map(a=>`<li>${esc(a)}</li>`).join("")}</ul></div>`:"")+
    (mk.gaps?sec("","Open gaps · treat as unverified")+
      `<div class="note warn"><ul>${mk.gaps.map(g=>`<li>${esc(g)}</li>`).join("")}</ul></div>`:"")+
    (mk.verifyFirst?sec("","Verify-first (before any investor/lender deck)")+
      `<div class="card"><ul>${mk.verifyFirst.map(v=>`<li>${esc(v)}</li>`).join("")}</ul></div>`:"")+
    sec("","Sourcing workflow · build the first 100")+
    `<div class="card"><ul>${mk.sourcing.map(s=>`<li>${esc(s)}</li>`).join("")}</ul></div>`+
    `<div class="note"><b>Enrichment:</b> Apollo.io is connected to this workspace. Use it to find contacts, verify emails, and push accounts into the app.</div>`
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
    sec("6B·2","Mode comparison · the cost structure")+
    table(["Mode","Linehaul","Fixed / handling","Payload","Note"],b.modeCompare.map(m=>[
      `<strong>${esc(m.mode)}</strong>`,`<span class="t-num">${esc(m.linehaul)}</span>`,esc(m.fixed),`<span class="t-num">${esc(m.cap)}</span>`,esc(m.note)]))+
    sec("6B·3","Delivered cost/ton by lane · barge vs truck vs rail")+
    table(["Destination","River-mi","Barge $/ton","Truck $/ton","Rail $/ton","Verdict","Why"],b.lanes.map(x=>[
      `<strong>${esc(x.dest)}</strong>`,`<span class="t-num">${esc(x.mi)}</span>`,`<span class="t-num" style="color:var(--green-bright)">${esc(x.barge)}</span>`,`<span class="t-num">${esc(x.truck)}</span>`,`<span class="t-num">${esc(x.rail)}</span>`,badge(x.verdict,x.cls),esc(x.note)]))+
    sec("6B·4","Break-even logic · when barge starts to pay")+
    `<div class="card"><ul>${b.breakeven.map(x=>`<li>${esc(x)}</li>`).join("")}</ul></div>`+
    sec("6B·5","Capacity reality check")+
    `<div class="note warn"><ul>${b.capacity.map(x=>`<li>${esc(x)}</li>`).join("")}</ul></div>`+
    sec("6B·6","Key assumptions [A]")+
    `<div class="card"><ul>${b.assumptions.map(x=>`<li>${esc(x)}</li>`).join("")}</ul></div>`+
    sec("6B·7","Verify-first · before quoting any barge lane")+
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
      <div class="crit"><b>Fields:</b> ${s.fields.map(f=>badge(f,"neutral")).join(" ")}</div>
      <div class="crit"><b>Next:</b> ${esc(s.next)}</div>
      <div class="crit" style="color:var(--red-soft)"><b>Don't advance:</b> ${esc(s.noAdv)}</div>
    </div></div>`).join("")}</div>`;
  return page("pipeline",
    head("Sales Pipeline Design · for your Replit app","Object model, deal types, and three connected pipelines with stage exit criteria and the exact CRM fields to add. This is the build spec for your app's sales section.")+openTaskBadge("pipeline")+
    sec("7A","Object model")+
    table(["Object","Key fields"],DATA.objectModel.map(o=>[`<strong>${esc(o.o)}</strong>`,esc(o.key)]))+
    sec("7B","Deal types")+`<div class="filters">${DATA.dealTypes.map(d=>`<span class="pill is-static active">${esc(d)}</span>`).join("")}</div>`+
    sec("7C","Pipeline 1 · Mid-market recurring")+kanban("",pl.midmarket)+
    sec("","Pipeline 2 · Bulk offtake / supply")+kanban("",pl.offtake)+
    sec("","Pipeline 3 · Carbon-credit buyer")+kanban("",pl.carbon)+
    `<div class="note warn"><b>Carbon guardrail:</b> never contract more credits than deployable tons. Carbon supply = deployed + committed product tons only.</div>`+
    sec("7D","Required CRM fields")+
    `<div class="grid g2">
      <div class="card"><h4>Core sales fields</h4><ul>${DATA.crmFields.sales.map(f=>`<li>${esc(f)}</li>`).join("")}</ul></div>
      <div class="card"><h4>Product + carbon economics fields</h4><ul>${DATA.crmFields.economics.map(f=>`<li>${esc(f)}</li>`).join("")}</ul></div>
    </div>`+
    sec("7E","Dashboard views to build")+
    `<div class="filters">${DATA.dashboards.map(d=>`<span class="pill is-static">${esc(d)}</span>`).join("")}</div>`+
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
    head("Target Accounts","A working account list view, filter by segment, sort by priority. This is a seeded demo; replace with your sourced Gulf South list (see TAM tab for the workflow).")+openTaskBadge("accounts")+
    `<div class="filters"><span class="pill active" role="button" tabindex="0" aria-pressed="true" onclick="accFilter(this,'all')">All segments</span>${segs.map(s=>`<span class="pill" role="button" tabindex="0" aria-pressed="false" onclick="accFilter(this,'${esc(s)}')">${esc(s)}</span>`).join("")}</div>`+
    `<div class="tbl-wrap"><table id="accTbl"><thead><tr>
      <th>Account</th><th>Segment</th><th>Location</th><th>Freight zone</th><th>Est. tons/yr</th><th>Priority</th><th>Status</th><th>Next action</th>
    </tr></thead><tbody>${rows}</tbody></table></div>`+
    `<div class="note">Priority score = fit × volume × freight, minus complexity. Zone C only clears the bar with high volume or strong carbon value. Wire this table to your app's <code>Account</code> object.</div>`
  );
}
function accRow(a,i){
  const [name,seg,loc,zone,tons,pri,status]=a;
  const priTone=pri>=5?"critical":pri>=4?"warning":"neutral";
  const next={Prospect:"First touch",Contacted:"Book discovery",Discovery:"Ship sample",Sample:"Trial check-in"}[status]||"Advance";
  return `<tr data-seg="${esc(seg)}"><td><strong>${esc(name)}</strong></td><td>${esc(seg)}</td><td>${esc(loc)}</td>
    <td>${stateBadge("freightZone",zone)}</td><td class="t-num">${tons?tons.toLocaleString():"-"}</td>
    <td>${badge("P"+pri,priTone,{sr:"priority score"})}</td><td>${stateBadge("dealStage",status)}</td><td>${esc(next)}</td></tr>`;
}
window.accFilter=(el,s)=>{
  document.querySelectorAll("#sec-accounts .pill").forEach(p=>{p.classList.remove("active");if(p.hasAttribute("aria-pressed"))p.setAttribute("aria-pressed","false")});el.classList.add("active");if(el.hasAttribute("aria-pressed"))el.setAttribute("aria-pressed","true");
  document.querySelectorAll("#accTbl tbody tr").forEach(r=>r.style.display=(s==="all"||r.dataset.seg===s)?"":"none");
};

/* --- Outreach --- */
function rOutreach(){
  const filters=`<div class="filters"><span class="pill active" role="button" tabindex="0" aria-pressed="true" onclick="outFilter(this,'all')">All segments</span>${DATA.outreach.map((o,i)=>`<span class="pill" role="button" tabindex="0" aria-pressed="false" onclick="outFilter(this,'${i}')">${esc(o.seg)}</span>`).join("")}</div>`;
  const blocks=DATA.outreach.map((o,i)=>`
    <div class="out-block" data-idx="${i}">
      <h3 class="sub">${esc(o.seg)} · ${esc(o.persona)}</h3>
      ${o.steps.map(s=>script(s.t,s.b)).join("")}
      <div class="note"><b>Nurture:</b> ${esc(o.nurture)}</div>
    </div>`).join("");
  return page("outreach",
    head("Outreach Engine","Human, direct, credible sequences per segment: email, call, voicemail, LinkedIn, breakup, and nurture. Every block has a copy button. Replace {First}/{Me}/phone before sending.")+openTaskBadge("outreach")+
    filters+blocks
  );
}
window.outFilter=(el,i)=>{
  document.querySelectorAll("#sec-outreach .pill").forEach(p=>{p.classList.remove("active");if(p.hasAttribute("aria-pressed"))p.setAttribute("aria-pressed","false")});el.classList.add("active");if(el.hasAttribute("aria-pressed"))el.setAttribute("aria-pressed","true");
  document.querySelectorAll(".out-block").forEach(b=>b.style.display=(i==="all"||b.dataset.idx===i)?"":"none");
};

/* --- Windrow trial protocol (composter closing asset) --- */
function rWindrow(){
  const w=DATA.windrowTrial;
  const sampleRows=[
    ["0","___","118","120","55","54","N","Build day · baseline"],
    ["3","___","135","148","54","54","Y","Treatment heating faster"],
    ["7","___","150","158","52","53","Y","Both thermophilic"],
    ["…","___","…","…","…","…","…","…"],
  ];
  return sec("","Windrow Trial Protocol · composter closing asset")+
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
  const txt=`WINDROW TRIAL PROTOCOL · Biochar vs Control
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
    head("Collateral Library","Pitch deck outline, one-pagers, calculator specs, sample workflow, and the objection battlecard, all build-ready.")+
    sec("9","Master pitch deck (10–12 slides)")+
    table(["#","Slide","Purpose","Key bullets","CTA"],DATA.deck.map((s,i)=>[
      `<strong>${i+1}</strong>`,`<strong>${esc(s.s)}</strong>`,esc(s.p),
      `<ul style="margin:0">${s.b.map(b=>`<li>${esc(b)}</li>`).join("")}</ul>`,esc(s.cta)]))+
    sec("","One-pagers to produce")+
    `<div class="filters">${DATA.onePagers.map(o=>`<span class="pill is-static">${esc(o)}</span>`).join("")}</div>`+
    sec("","ROI calculators (specs)")+
    `<div class="grid g2">${DATA.calculators.map(c=>`<div class="card"><h4>${esc(c.name)}</h4>
      <b style="font-size:11.5px;color:var(--gold-soft)">Inputs</b><ul>${c.inputs.map(x=>`<li>${esc(x)}</li>`).join("")}</ul>
      <div style="font-size:12px;margin-top:6px"><b style="color:var(--text)">Formula:</b> <span style="font-family:var(--mono);color:var(--text-dim)">${esc(c.formula)}</span></div>
      <div style="font-size:12px;margin-top:4px"><b style="color:var(--text)">Saves to CRM:</b> ${c.saves.map(s=>badge(s,"neutral")).join(" ")}</div>
    </div>`).join("")}</div>`+
    `<div class="note">Two of these run live in the <b>Pricing & Economics</b> tab.</div>`+
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
    `<div class="note"><b>Deal evaluation stack:</b> ${p.dealEval.map(d=>badge(d,"neutral")).join(" ")}</div>`+
    sec("","Live calculator · Freight-aware delivered margin")+calcFreight()+
    sec("","Live calculator · Product + Carbon blended value")+calcBlended()+
    sec("","Live calculator · Absorbent cost-per-gallon")+calcAbsorbent()
  );
}
function field(id,label,val,step="any"){return `<div class="field"><label>${label}</label><input type="number" id="${id}" value="${val}" step="${step}" oninput="recalc()"></div>`;}
function out(id,label,hero=false){return `<div class="o${hero?" hero":""}"><div class="ol">${label}</div><div class="ov" id="${id}">-</div></div>`;}
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
    <div class="note" style="margin:0 0 12px"><b>Carbon figures are ESTIMATES</b>, excluded from committed margin until verified.</div>
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
const money=n=>isFinite(n)?"$"+Math.round(n).toLocaleString():"-";
function recalc(){
  // freight
  const rev=+val("f_rev"),cogs=+val("f_cogs"),fr=+val("f_freight");
  const dm=rev-cogs-fr; set("f_margin",money(dm)); set("f_pct",rev?Math.round(dm/rev*100)+"%":"-");
  // blended
  const tons=+val("b_tons"),pm=+val("b_pmargin"),tco=+val("b_tco2e"),pr=+val("b_price");
  const prod=tons*pm, carbon=tons*tco*pr; set("b_prod",money(prod)); set("b_carbon",money(carbon)); set("b_blended",money(prod+carbon));
  // absorbent, water ~8.34 lb/gal
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
    sec("","Qualification · "+esc(pb.qual.framework.split(":")[0]))+
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
    `<div class="note warn"><b>Capture MRV data at delivery</b> (application, site/GPS, weights): no data, no carbon credit. This is the link between the product sale and the carbon revenue.</div>`
  );
}

/* --- KPIs --- */
function rKpis(){
  const k=DATA.kpis;
  const list=(t,arr,cls)=>`<div class="card"><h4>${t}</h4>${arr.map(x=>`<span class="badge ${cls}" style="margin:2px 3px 2px 0">${esc(x)}</span>`).join("")}</div>`;
  return page("kpis",
    head("Metrics & KPIs","Leading and lagging indicators, conversion funnel, pipeline coverage, and dashboard-card specs for your app.")+
    sec("12","Indicators")+
    `<div class="grid g2">${list("Leading indicators",k.leading,"positive")}${list("Lagging indicators",k.lagging,"warning")}</div>`+
    `<div class="grid g2" style="margin-top:14px">${list("Conversion metrics",k.conversion,"info")}${list("Pipeline coverage",k.coverage,"neutral")}</div>`+
    sec("","Dashboard card specs")+
    table(["Card","Definition","Formula","Filters","Source","Warn threshold","Owner"],k.cards.map(c=>[
      `<strong>${esc(c.c)}</strong>`,esc(c.def),`<span class="t-num">${esc(c.formula)}</span>`,esc(c.filter),esc(c.src),
      `<span style="color:var(--red-soft)">${esc(c.warn)}</span>`,esc(c.owner)]))
  );
}

/* --- Roadmap --- */
function whoBadge(o){ const c=/jesse/i.test(o)?"jesse":/victor/i.test(o)?"victor":/both/i.test(o)?"both":""; return `<span class="who ${c}">${esc(o)}</span>`; }
function rRoadmap(){
  return page("roadmap",
    head("30 / 60 / 90-Day Launch Roadmap","Every task is a checkbox, click to mark done; it stays done across reloads. Each shows who owns it (Jesse / Victor / Both) and the deliverable.")+openTaskBadge("roadmap")+
    DATA.roadmap.map((ph,pi)=>{
      const keys=ph.tasks.map((t,ti)=>`roadmap:${pi}:${ti}`);
      const defs=ph.tasks.map(t=>!!t.done);
      const st=checkStats(keys,defs);
      return `<div class="chk-head"><h3 class="sub" style="margin:0">${esc(ph.phase)}</h3>`+
        `<span class="chk-progress">${st.done}/${st.total} done</span></div>`+
        (ph.note?`<p class="lead" style="margin:2px 0 8px">${esc(ph.note)}</p>`:"")+
        ph.tasks.map((t,ti)=>{
          const pri=stateBadge("priority", t.pri);
          const label=`${whoBadge(t.o)}${pri} ${esc(t.t)}<span class="del">→ ${esc(t.del)}${t.out?` · <i>${esc(t.out)}</i>`:""}</span>`;
          return chk(keys[ti],label,t.done);
        }).join("");
    }).join("")+
    `<div class="chk-head"><span></span><span class="chk-reset" onclick="resetChecks('roadmap:')">Reset roadmap checkmarks</span></div>`
  );
}

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
    head("Final Implementation Checklist","The concrete launch moves: website & product, app build, collateral, lists, first outbound, and the claims to verify. Every item is a checkbox that persists across reloads.")+
    `<div class="grid g2">
      ${block("web","① Website & product launch",c.website)}
      ${block("build","② Build in the app",c.build)}
      ${block("coll","③ Collateral (single-product each)",c.collateral)}
      ${block("lists","④ Lists to build first",c.lists)}
      ${block("first","⑤ First outbound actions (sample-first)",c.firstActions)}
      ${block("dash","⑥ First dashboard fields",c.dashFields)}
      ${block("price","⑦ Pricing inputs (Q4 reference only)",c.priceInputs)}
      ${block("claims","⑧ Claims to verify (legal)",c.claims)}
      ${block("hires","⑨ Team",c.hires)}
    </div>`+
    `<div class="chk-head"><span class="note ok" style="margin:0;flex:1"><b>Sequence:</b> approve & publish site + sample SKUs → build app fields → source 150–200 accounts → produce two single-product kits → launch sample-first outbound → ship free samples → present LOIs on wins → sign & bank committed volume.</span><span class="chk-reset" onclick="resetChecks('launch:')">Reset</span></div>`
  );
}

/* ================= BOOT ================= */
function render(){
  const html=[rTasks(),rDaily(),rOverview(),rAssumptions(),rSegments(),rPersonas(),rMessaging(),rBiochar(),rMarket(),rBarge(),
    rPipeline(),rAccounts(),rOutreach(),rCollateral(),rPricing(),rPlaybook(),rKpis(),rRoadmap(),rChecklist()].join("");
  $("#content").innerHTML=html;
}
/* Keyboard activation for role="button" chips (filters) — Enter/Space fire
   the same click handler, so interactive chips are fully keyboard operable. */
document.addEventListener("keydown",e=>{
  if(e.key!=="Enter"&&e.key!==" ")return;
  const el=e.target.closest?.('[role="button"].pill');
  if(el){ e.preventDefault(); el.click(); }
});
buildNav();
render();
$("#menuBtn").addEventListener("click",()=>$("#sidebar").classList.toggle("open"));
const start=(location.hash||"#tasks").slice(1);
go(NAV.flatMap(g=>g.items).some(i=>i.id===start)?start:"tasks");
recalc();
