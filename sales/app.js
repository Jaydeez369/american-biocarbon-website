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
  {group:"Launch",items:[
    {id:"launch",ic:"◎",t:"Launchpad"},
    {id:"strategy",ic:"◆",t:"Campaigns & ICP"},
  ]},
  /* Instantly Logic sits between the copy and the pipeline because that is where it sits
     in the work: you read the words in Outreach Engine, you understand why the campaign is
     shaped that way here, and replies land in Sales Pipeline. It answers "why three variants
     on nurseries and one on blenders" and "why is nothing sending yet", which are the two
     questions the Outreach Engine cannot answer because it only holds copy. */
  {group:"Execute",items:[
    {id:"outreach",ic:"✦",t:"Outreach Engine"},
    {id:"instantly",ic:"⚙",t:"Instantly Logic"},
    {id:"crm",ic:"◉",t:"Sales Pipeline"},
  ]},
  /* Everything that is not the cold email send. Priced, with a confidence badge on every
     number, so a channel cannot get approved on a figure nobody has actually invoiced. */
  {group:"Grow",items:[
    {id:"funnels",ic:"⇢",t:"Future Funnels"},
  ]},
  /* The four Operate sections (Sample to Cash, Team & Rhythm, System of Record,
     Continuity Runbook) were removed 2026-08-17 on the operator's instruction. Their
     content still lives in ops-data.js / ops.js and the group is recoverable from git
     history if a real need comes back. */
  /* Onboarding & Scale and Sales × Marketing used to sit here. Both are deleted.
     Onboarding described an accounting handoff for accounts we do not have yet, and
     the 60/90 scale plan was a build plan for a machine that is now built. Sales ×
     Marketing was a working agreement with a marketing team that does not exist as a
     counterparty today, anchored to a "Progreaux" rebrand name that the July 17 call
     retired. Both are recoverable from git history if a real need comes back. */
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
const LAUNCH_STEPS = [
  { k:"pull",    t:"Pull the Apollo list", done:true,
    d:"DONE. 1,183 Apollo credits spent to the operator's written ceiling; 1,145 companies researched. A further tranche needs a new written number." },
  { k:"dedupe",  t:"Dedupe against the roster already in the pipeline", done:true,
    d:"DONE, confirmed 2026-08-17. Account matching folds punctuation, possessives and corporate suffixes, so \"J. Berry Nursery\" lands on the existing \"J Berry Nursery\" rather than creating a twin. The Also-known-as row on a profile shows every fold." },
  { k:"verify",  t:"Verify the emails, strip catch-alls and role accounts", done:true,
    d:"DONE. 1,303 of 1,634 addresses verified; only verified (READY) leads import, catch-all and risky never do. The absorbent gate reads READY on 848 leads." },
  /* The code list is READ from the roster, never spelled out here. It was hardcoded as the
     old BC-NURS / AB-SPILL style and went stale the moment the taxonomy was unified to the
     BC.NUR / AB.ENV form, which is exactly the drift this whole app has been cleaned of. */
  { k:"tag",     t:"Tag every contact to an ICP code", done:true,
    d:"DONE. Every live company carries an ICP and every contact rides its company's code, so reply attribution works per variant.", icps:true },
  { k:"import",  t:"Import into the Sales Pipeline", done:true,
    d:"DONE, contact-join audit 2026-08-17: all 1,593 unique emails join a pipeline company (0 unjoined). Replies have somewhere to land." },
  { k:"load",    t:"Load the campaigns into Instantly",
    d:"IN PROGRESS in a separate Instantly session — campaign edits happen there, never from this screen. 9 campaigns are in the workspace (BC.FARM live, 8 absorbent drafts); BC.NUR and BC.FARM.ROLE load next." },
  { k:"send",    t:"Send",
    d:"STARTED: BC.FARM is launched. The rest fire in rollout order — remaining biochar first, then absorbents by READY count. Ramp per inbox rather than opening at full rate; reply rate is the metric, opens are noise since Apple MPP." },
];

/* Thousands-separated integer. pipeline.js has its own num() but it lives inside that file's
   IIFE and is not global, so app.js needs its own rather than reaching for one that is not there. */
const fmtN = v => Number.isFinite(+v) ? Math.round(+v).toLocaleString() : "0";

/* The ICP codes actually present in the roster, read at render time. */
const icpCodes = () => {
  const R = window.ROSTER;
  if(!R || !R.byIcp) return "see Campaigns & ICP";
  return Object.keys(R.byIcp).sort().join(", ");
};

function rLaunchpad(){
  const S = (window.PIPELIVE && PIPELIVE.stats) ? PIPELIVE.stats() : null;
  /* The four "where we are" tiles read the Sales Pipeline roster (window.ROSTER, the
     generated canonical layer) and the last live Instantly read (ENGINE.instantly.live).
     PIPELIVE.stats() still backs the hygiene notes below the tiles, but companies,
     contacts and ICPs on this page mean the prospecting pipeline, not the CRM overlay —
     the roster is where every ICP, email and verification verdict actually lives. */
  const R  = window.ROSTER || null;
  const IL = (typeof ENGINE !== "undefined" && ENGINE.instantly && ENGINE.instantly.live) || null;
  const icpKeys = (R && R.byIcp) ? Object.keys(R.byIcp) : [];
  const nBio = icpKeys.filter(k => k.startsWith("BC.")).length;
  const nAbs = icpKeys.filter(k => k.startsWith("AB.")).length;

  const keys = LAUNCH_STEPS.map(s => "lp:" + s.k);
  const defs = LAUNCH_STEPS.map(s => !!s.done);
  const st = checkStats(keys, defs);
  const pct = st.total ? Math.round(st.done/st.total*100) : 0;
  const nextStep = LAUNCH_STEPS.find(s => {
    const v = getChecks()["lp:"+s.k];
    return v === undefined ? !s.done : !v;
  });

  const tile = (label, val, sub) =>
    `<div class="card kpi"><div class="l">${esc(label)}</div><div class="v">${val}</div><div class="d">${esc(sub||"")}</div></div>`;

  return page("launch",
    head("Launchpad", nextStep
      ? `Next: ${esc(nextStep.t)}.`
      : "Every launch step is checked off. Working replies is the job now.")+

    /* Blocker first. Every price and freight radius in this app is downstream of it. */
    `<div class="note warn" style="border-left:4px solid var(--gold-soft);font-size:13.5px;margin-bottom:14px">
       <b>⛔ Freight and COGS are unverified.</b> No firm biochar price goes out beyond the published $${LIVE.biocharMt}/MT. Every freight radius and margin figure in this app is provisional until Finance confirms cost per ton and zone rates. Quote the published price or quote nothing.
     </div>`+

    sec("1","Where we are")+
    `<div class="grid g4">
      ${tile("Companies", R?fmtN(R.live):"not loaded", R?`${fmtN(R.count)} researched · ${fmtN(R.liveIcp)} live with an ICP`:"roster layer not loaded")}
      ${tile("Contacts", R?fmtN(R.contactsTotal):"not loaded", R?`${fmtN(R.contactsVerified)} verified · on ${fmtN(R.withContact)} companies`:"roster layer not loaded")}
      ${tile("ICPs", icpKeys.length?fmtN(icpKeys.length):"not loaded", icpKeys.length?`${nBio} biochar · ${nAbs} absorbent · every one a campaign`:"roster layer not loaded")}
      ${tile("Instantly campaigns", IL?`${IL.launched} live · ${IL.ready} ready`:"no live read", IL?`${IL.inWorkspace} in the workspace · ${fmtN(IL.readyLeads)} READY leads · read ${esc(IL.read)}`:"engine layer not loaded")}
    </div>`+
    (IL
      ? `<div class="note ok" style="margin-top:10px"><b>Rollout order.</b> ${esc(IL.order)}</div>`+
        `<div class="note warn" style="margin-top:8px"><b>${fmtN(IL.stranded)} verified leads are stranded on the Instantly plan lead cap.</b> ${esc(IL.capNote)} ${esc(IL.note)}</div>`
      : "")+
    (S && S.contacts && S.contactsNamed < S.contacts
      ? `<div class="note warn" style="margin-top:10px"><b>${fmtN(S.contacts-S.contactsNamed)} contacts have no name.</b> They render blank and one of them can become an account's primary contact. Fix on import rather than after.</div>`
      : "")+
    (S && S.merged && S.merged.length
      ? `<div class="note" style="margin-top:10px"><b>${fmtN(S.merged.length)} account name group(s) were folded together:</b> ${S.merged.map(g=>esc(g.join(" = "))).join(" · ")}. If any of those is a different company, its records are on the wrong profile.</div>`
      : "")+

    sec("2","The path to sent")+
    `<div class="daily-mission card pad-lg">
       <div class="dm-row"><span class="dm-tag">LAUNCH STEPS</span><div class="dm-bar"><span style="width:${pct}%"></span></div><span class="dm-pct">${st.done}/${st.total} · ${pct}%</span></div>
       <p class="dm-mission">Each step blocks the one under it. A campaign fired at an unverified list off a cold inbox does not just underperform, it burns the sending domain for every campaign after it.</p>
       <div class="chk-grid" style="margin-top:10px">
         ${LAUNCH_STEPS.map(s=>chk("lp:"+s.k, `<b>${esc(s.t)}</b><br><span style="color:var(--text-mute);font-size:12.5px">${esc(s.d)}${s.icps?" Live codes: "+esc(icpCodes()):""}</span>`, !!s.done)).join("")}
       </div>
     </div>`+

    sec("3","What we are selling, at what price")+
    table(["Line","Live price","Free sample"],[
      [`<strong>100% Biochar</strong> ${badge("PRIORITY","badge-green")}`, `$${LIVE.biocharMt} / MT`, "1/2 lb (8 oz)"],
      ["<strong>Absorbent Pellets</strong>", `$${LIVE.absorbentMt} / MT`, "1 lb"],
      ["<strong>Absorbent Crumble</strong>", `$${LIVE.absorbentMt} / MT`, "1 lb"],
    ])+
    `<div class="note ok" style="margin-top:10px">All three sell by the metric ton today with working checkout, so a winning trial converts to a <b>paid order</b>, not just an LOI. Truckload volume is the only thing still waiting on the Q4 ramp, and that is what the LOI reserves. Samples ship in ${esc(LIVE.sampleEta)}; FOB bulk bags in ${esc(LIVE.bulkEta)}.</div>`+
    `<div class="note" style="margin-top:8px"><b>Geography:</b> ${esc(LIVE.geo)} <b>Replies route to:</b> ${esc(LIVE.replyTo)}.</div>`+

    sec("4","Rules that do not bend")+
    `<div class="grid g2">
      <div class="card"><h4>Claim discipline</h4><p>OMRI <b>Listed</b>, never Certified. IBI <b>tested</b>, never Certified, we have never held it. Never USDA Organic in any form, including "compatible" or "pending". Puro.earth certified is real. Full table in Product &amp; Messaging.</p></div>
      <div class="card"><h4>The cold ask</h4><p>A free sample. Never a bulk quote, never an LOI, never a contract in a first touch. The order is the close after a trial wins; the LOI reserves Q4 truckload after that.</p></div>
      <div class="card"><h4>Poultry and livestock</h4><p>Bedding, moisture and manure or compost use only. No feed claims and no animal-health claims, in any channel, ever.</p></div>
      <div class="card"><h4>Brand</h4><p>Customer-facing name is <b>American BioCarbon</b> today. The rebrand name is not decided, so keep cold copy brand-light and lead with the product. ProGreaux LLC is the legal entity for contracts only.</p></div>
    </div>`+

    sec("5","Where to go next")+
    `<div class="grid g3">
      <div class="card"><h4><a href="#strategy" onclick="go('strategy')">Campaigns &amp; ICP →</a></h4><p>Who each campaign targets, the proof to use, and the disqualifiers.</p></div>
      <div class="card"><h4><a href="#outreach" onclick="go('outreach')">Outreach Engine →</a></h4><p>Both tracks side by side. Subject pools, message variants and call openers, ready to copy.</p></div>
      <div class="card"><h4><a href="#crm" onclick="go('crm')">Sales Pipeline →</a></h4><p>Accounts, contacts and deals. Where replies land and get worked.</p></div>
    </div>`
  );
}

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
const OPS_R = k => (window.OPS_UI && OPS_UI[k]) ? OPS_UI[k] : (()=> "");
const mergeDiv = `<div class="hr" style="margin:26px 0 18px;opacity:.5"></div>`;
/* newId → ordered list of renderer thunks it composes */
function compose(id, thunks){
  return page(id, thunks.map(stripBody).join(mergeDiv));
}

/* LEAN = daily-driver. BUILD = parked heavy modules (build-later.html). */
const LEAN_SECTIONS=[
  // IA v6, rebuilt around the campaign launch rather than around a 30-day plan.
  //   launch     = pre-send gates + offer + allocation, then the readiness checklists
  //   strategy   = the campaigns themselves, with the ICP and persona targeting behind them
  //   outreach   = every piece of copy that actually goes out
  //   crm        = where the Apollo import and the replies land
  // The 30-day calendar, the 31-90 horizon and the 30/60/90 roadmap that used to lead this
  // list are deleted. Their dates had run out and they described building the machine that
  // is now built.
  //
  // rChecklist / rPrelaunch / rLaunch used to sit under Launchpad as "launch gates". They are
  // gone too. They were not gates, they were a stale build-out plan: they listed the homepage,
  // the sample form, the spec sheets and analytics as P0 "Todo" when all of them have been
  // live since the apex cutover, and they still framed the hero around an oil-and-gas-first
  // thesis that biochar-priority replaced. A checklist that reports finished work as unstarted
  // trains people to ignore checklists. The seven launch steps on the Launchpad replace them.
  ["launch",   [rLaunchpad]],
  ["strategy", [OUT("rCampaigns")]],
  ["product",  [rBiochar, rMessaging]],
  // Target accounts deliberately do NOT render here any more. This section used to open with
  // rAccounts, a hardcoded list of invented companies with invented deal sizes sitting in a
  // tool reps actually work from. Real accounts live in the Sales Pipeline section, which
  // reads the roster and HubSpot import.
  // outreach is now ONE canonical module (outreach.js + outreach-data.js), not a stack of
  // seven renderers. The old stack was three overlapping banks of copy: DATA.outreach,
  // GTM.sequences and GTM.scriptLibrary all held a "soil blenders" pitch and they disagreed
  // with each other. The Aug 10 VDJ call rewrote the messaging from scratch with Victor and
  // Daniel in the room, so the engine is now a single source with two tracks. LinkedIn,
  // social and the long-term channel plan moved down to the playbook: they are reference
  // material, not the cold send.
  ["outreach", [OUT("rOutreach")]],
  // Instantly Logic and Future Funnels each render as a single self contained module, the
  // same way crm and strategy do. Both read engine-data.js and type no numbers of their own.
  ["instantly",[ENG("rInstantly")]],
  ["funnels",  [ENG("rFunnels")]],
  ["crm",      [PL("rCRM")]],
  // The four Operate sections were removed 2026-08-17 on the operator's instruction;
  // ops-data.js/ops.js stay on disk and the renderers are one line each to restore.
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
