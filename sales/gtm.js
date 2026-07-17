/* ============================================================
   VEJ Sales OS — GTM Command Center (plugin)
   Loaded AFTER app.js. Reuses global helpers:
     page, head, sec, table, badge, script, esc, nl, tier, $,
     NAV, buildNav, go, copyEl
   Extends NAV, appends its pages to #content, re-runs routing.
   No edits to app.js / data.js required.
   ============================================================ */
(function(){
  if (typeof GTM === "undefined") { console.warn("GTM data missing"); return; }

  /* --- Calendar dating: the 30-day plan starts Fri Jul 17, 2026 (Day 1) and runs
     consecutive calendar days. Shared by the calendar grid and the day panel. --- */
  const CAL_START = new Date(2026, 6, 17); // month is 0-indexed: 6 = July
  const CAL_MON = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
  const CAL_DOW = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];
  const calDate = n => new Date(CAL_START.getFullYear(), CAL_START.getMonth(), CAL_START.getDate() + (n - 1));
  const calFull = d => `${CAL_DOW[d.getDay()]}, ${CAL_MON[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()}`;
  const calLeadBlanks = () => (CAL_START.getDay() + 6) % 7; // Mon=0 … Sun=6

  /* small local helpers layered on the shared design system */
  const gbadgePri = p => badge(p, p==="P0"?"pri-1":p==="P1"?"pri-2":"pri-3");
  const gstatus = s => badge(s, s==="Done"?"badge-green":s==="Doing"?"badge-gold":"badge-muted");
  const pill = t => `<span class="badge badge-muted" style="font-size:10.5px">${esc(t)}</span>`;
  const chips = arr => arr.map(pill).join(" ");
  const ul = arr => `<ul>${arr.map(x=>`<li>${esc(x)}</li>`).join("")}</ul>`;

  /* ---- 1. Executive Summary ---- */
  function rSummary(){
    const s=GTM.summary;
    return page("gtm-summary",
      head("GTM Executive Summary","The Month-1 thesis: SAMPLES-FIRST. The one goal is free samples of the two live products (Pellets, Biochar) in buyers' hands — that's the first win. No LOI talk in outreach, no bulk selling yet. LOIs are a quiet later step off winning trials.")+
      `<div class="note ok" style="font-size:13.5px"><b>Position:</b> ${esc(s.position)}</div>`+
      sec("G1","Why oil & gas / remediation first")+
      `<div class="grid g2">${s.wedgeWhy.map(w=>`<div class="card"><p style="color:var(--text-dim)">→ ${esc(w)}</p></div>`).join("")}</div>`+
      `<div class="note" style="margin-top:12px">${esc(s.wedgeNote)}</div>`+
      sec("G2","Campaign allocation by ICP")+
      table(["ICP","Effort","Why"],s.allocation.map(a=>[`<strong>${esc(a.icp)}</strong>`,badge(a.pct,a.cls),esc(a.why)]))+
      `<div class="note"><b>Allocation logic:</b> ${esc(s.allocationNote)}</div>`+
      sec("G3","Primary offer & CTA paths")+
      `<div class="card pad-lg"><p style="color:var(--text)">${esc(s.offer)}</p></div>`+
      `<div class="grid g2" style="margin-top:12px">${s.ctaPaths.map(c=>`<div class="card"><p style="color:var(--text-dim)">✅ ${esc(c)}</p></div>`).join("")}</div>`+
      sec("G4","30 / 60 / 90-day goals")+
      `<div class="grid g3">
        <div class="card"><h4>🎯 30-day</h4><p>${esc(s.goals.d30)}</p></div>
        <div class="card"><h4>📈 60-day</h4><p>${esc(s.goals.d60)}</p></div>
        <div class="card"><h4>🚀 90-day</h4><p>${esc(s.goals.d90)}</p></div>
      </div>`+
      sec("G5","KPIs that matter")+`<div class="card">${ul(s.kpis)}</div>`
    );
  }

  /* ---- 2. Pre-Launch Checklist ---- */
  function rPrelaunch(){
    const cats=GTM.prelaunch;
    const filters=`<div class="filters"><span class="pill active" onclick="gtmPreFilter(this,'all')">All</span>${cats.map((c,i)=>`<span class="pill" onclick="gtmPreFilter(this,'${i}')">${esc(c.cat)}</span>`).join("")}</div>`;
    const blocks=cats.map((c,i)=>`<div class="gtm-pre-block" data-idx="${i}">`+
      sec("",esc(c.cat))+
      table(["Item","Pri","Owner","Status","Why it matters","Acceptance criteria"],c.items.map(it=>[
        `<strong>${esc(it.i)}</strong>`,gbadgePri(it.p),esc(it.o),gstatus(it.s),esc(it.why),`<span style="color:var(--green-bright)">${esc(it.ac)}</span>`]))+
      `</div>`).join("");
    return page("gtm-prelaunch",
      head("③ Launch gate — pre-launch checklist","Everything that must be true before outbound begins. Nothing ships until the P0 rows are green.")+
      filters+blocks
    );
  }
  window.gtmPreFilter=(el,i)=>{el.closest(".filters").querySelectorAll(".pill").forEach(p=>p.classList.remove("active"));el.classList.add("active");
    document.querySelectorAll(".gtm-pre-block").forEach(b=>b.style.display=(i==="all"||b.dataset.idx===i)?"":"none");};

  /* ---- 3. ICP Campaigns ---- */
  function rCampaigns(){
    // BIOCHAR IS PRIORITY #1 — sort biochar campaigns (primary/bioPriority) to the top, absorbent secondary after.
    const rank=c=>c.primary?0:c.bioPriority?1:c.secondaryTrack?2:c.tag==="CMP-CDR"?4:3;
    const cs=[...GTM.campaigns].sort((a,b)=>rank(a)-rank(b));
    const card=c=>`<div class="card pad-lg gtm-cmp">
      <h4>${esc(c.name)} ${c.primary?badge("PRIMARY · BIOCHAR","badge-green"):c.bioPriority?badge("BIOCHAR","badge-green"):c.secondaryTrack?badge("SECONDARY","badge-muted"):""} ${badge(c.alloc,"badge-gold")} ${badge(c.tag,"badge-blue")}</h4>
      ${c.guardrail?`<div class="note warn" style="margin:8px 0"><b>⚠ Guardrail:</b> ${esc(c.guardrail)}</div>`:""}
      <div class="note warn" style="margin:8px 0"><b>Pain:</b> ${esc(c.pain)}</div>
      <div class="note ok" style="margin:8px 0"><b>Offer:</b> ${esc(c.offer)}</div>
      <div style="font-size:12.5px;display:grid;gap:5px">
        <div><b style="color:var(--gold-soft)">Angle:</b> ${esc(c.angle)}</div>
        <div><b style="color:var(--green-bright)">Primary CTA:</b> ${esc(c.cta)}</div>
        <div><b style="color:var(--text)">Secondary CTA:</b> ${esc(c.cta2)}</div>
        <div><b style="color:var(--text)">Lead magnet:</b> ${esc(c.magnet)}</div>
        <div><b style="color:var(--text)">Landing:</b> <span class="t-num">${esc(c.landing)}</span></div>
      </div>
      <div class="hr" style="margin:10px 0"></div>
      <div class="grid g2" style="gap:8px">
        <div><b style="font-size:11px;color:var(--gold-soft)">Target titles</b>${ul(c.titles)}</div>
        <div><b style="font-size:11px;color:var(--gold-soft)">Company types</b>${ul(c.companies)}</div>
        <div><b style="font-size:11px;color:var(--gold-soft)">Proof to use</b>${ul(c.proof)}</div>
        <div><b style="font-size:11px;color:var(--red-soft)">Disqualifiers</b>${ul(c.disq)}</div>
      </div>
      <div class="hr" style="margin:10px 0"></div>
      <div style="font-size:12px"><b style="color:var(--text)">Success metric:</b> ${esc(c.metric)}</div>
    </div>`;
    return page("gtm-campaigns",
      head("ICP Campaign Strategy","Nine coordinated campaigns — BIOCHAR-LED (we have 80 MT to move now). Biochar campaigns carry ~65% of effort and run first; absorbent is the secondary track. Each has one specific CTA, its own proof, and a dedicated landing destination.")+
      `<div class="note ok"><b>Effort weighting:</b> ${GTM.summary.allocation.map(a=>badge(a.icp.split(" ")[0]+" "+a.pct, a.cls)).join(" ")}</div>`+
      `<div class="grid" style="grid-template-columns:1fr;gap:14px">${cs.map(card).join("")}</div>`
    );
  }

  /* ---- 4. 30-Day Daily Plan (clickable calendar) ---- */
  function r30Day(){
    const weeks=GTM.day30Weeks;
    const cal=GTM.calendar||[];
    const wk=w=>`<div class="card"><h4>${esc(w.wk)} — ${esc(w.theme)}</h4>
      <div style="font-size:12.3px;display:grid;gap:4px">
        <div><b style="color:var(--green-bright)">Goal:</b> ${esc(w.goal)}</div>
        <div><b style="color:var(--gold-soft)">Focus:</b> ${esc(w.focus)}</div>
        <div><b style="color:var(--text)">Outputs:</b> ${esc(w.outputs)}</div>
      </div></div>`;
    const dow=["Mon","Tue","Wed","Thu","Fri","Sat","Sun"];
    const blanks=Array(calLeadBlanks()).fill('<div class="cal-blank"></div>').join("");
    const cells=cal.map(c=>{
      const d=calDate(c.d);
      const wd=d.getDay();
      const weekend=(wd===0||wd===6)?" weekend":"";
      return `<div class="cal-day${c.light?" rest":""}${weekend}" data-d="${c.d}" onclick="gtmCalPick(${c.d})">
      <div class="cal-date">${CAL_MON[d.getMonth()]} ${d.getDate()}</div>
      <div class="cal-dow2">${CAL_DOW[wd]} · Day ${c.d}</div>
      <div class="dt">${esc(c.theme)}</div><div class="dwk">Week ${c.wk}</div></div>`;
    }).join("");
    const start=calDate(1), end=calDate(cal.length);
    return page("gtm-30day",
      head("① The 30-Day Calendar — click a day",`The canonical day-by-day plan, ${calFull(start)} → ${calFull(end)}. Click any day to open the exact tasks for Jesse, Victor &amp; Daniel — check them off as you go, they persist. Jesse = demand &amp; the machine · Victor + Daniel = product, proof, website &amp; fulfillment. Everything is aimed at moving the 80 MT of biochar.`)+
      sec("","Weekly themes")+`<div class="grid g2">${weeks.map(wk).join("")}</div>`+
      `<div class="note warn"><b>Quality controls:</b> max ~20→40 sends/inbox/day ramped; bounce <2% or slow down; monitor replies daily; A/B subject lines; BIOCHAR campaigns first; the cold ask is always a free sample (no bulk/LOI pitch cold) — convert the order from the 80 MT after a trial wins; never spam.</div>`+
      sec("",`Calendar — click a day · starts ${CAL_MON[start.getMonth()]} ${start.getDate()}`)+
      `<div class="cal">${dow.map(d=>`<div class="cal-dow">${d}</div>`).join("")}${blanks}${cells}</div>`+
      `<div id="gtmCalPanel"></div>`
    );
  }
  /* Ticking a task re-renders #content (so the mission bar updates), which wipes the open
     day panel. rerender() reads this to put it back; opts.restore skips the scroll so
     restoring is invisible. */
  window.gtmOpenCalDay = null;
  window.gtmCalPick=function(d, opts={}){
    const c=(GTM.calendar||[]).find(x=>x.d===d); if(!c) return;
    window.gtmOpenCalDay = d;
    // the #sec-gtm-30day half was dead (compose() owns section ids now); .cal-day is the live selector
    document.querySelectorAll(".cal-day").forEach(el=>el.classList.toggle("sel", +el.dataset.d===d));
    const lane=(who,arr,cls)=>`<div class="cal-lane ${cls}"><h4>${who}</h4>${arr.map((t,i)=>chk(`cal:${d}:${cls}:${i}`,esc(t))).join("")}</div>`;
    const html=`<div class="cal-panel">
      <div class="cal-panel-h"><h3>${calFull(calDate(c.d))} — ${esc(c.theme)}</h3><div class="sub">Day ${c.d} · Week ${c.wk}${c.light?" · lighter / review day":""}</div></div>
      <div class="cal-lanes">${lane("Jesse — demand & the machine",c.jesse,"j")}${lane("Victor + Daniel — product, proof, website & fulfillment",c.victor,"v")}</div>
      <div class="cal-meta">Tick each task as done — it stays checked across reloads. Victor + Daniel split this track: certs/spec sheets, company discovery, product photos, testing, website approval, then Shopify install & go-live, and sample fulfillment.</div>
    </div>`;
    const panel=document.getElementById("gtmCalPanel");
    if(panel){ panel.innerHTML=html; if(!opts.restore) panel.scrollIntoView({behavior:"smooth",block:"nearest"}); }
  };

  /* ---- 5. 60/90 Scale ---- */
  function rScale(){
    const s=GTM.scale;
    const phase=p=>sec("",esc(p.title))+
      `<div class="note ok"><b>Goal:</b> ${esc(p.goal)}</div>`+
      table(["Week","Goal","Activity targets","Campaign adjustment","Hiring/support","Automation","Pipeline milestone"],
        p.weeks.map(w=>[`<strong>${esc(w.wk)}</strong>`,`<strong>${esc(w.g)}</strong>`,esc(w.act),esc(w.adj),esc(w.need),esc(w.auto),`<span style="color:var(--green-bright)">${esc(w.mile)}</span>`]));
    return page("gtm-scale",
      head("60 / 90-Day Scale Plan","Days 31–60 double down and convert; days 61–90 systematize, formalize channels, integrate carbon, and prep the first hire.")+
      phase(s.d60)+phase(s.d90)
    );
  }

  /* ---- 6. Outbound Sequences ---- */
  // BIOCHAR IS PRIORITY #1 — sort biochar segments (AGD/SOIL/NUR) first, CDR last.
  const bioSeqRank=t=>/AGD|SOIL|NUR/.test(t)?0:t==="CMP-CDR"?3:2;
  function rSequences(){
    const seqs=[...GTM.sequences].sort((a,b)=>bioSeqRank(a.tag)-bioSeqRank(b.tag));
    const filters=`<div class="filters"><span class="pill active" onclick="gtmSeqFilter(this,'all')">All</span>${seqs.map((o,i)=>`<span class="pill" onclick="gtmSeqFilter(this,'${i}')">${esc(o.tag)}</span>`).join("")}</div>`;
    const blocks=seqs.map((o,i)=>`<div class="gtm-seq" data-idx="${i}">
      <h3 class="sub">${esc(o.seg)} — ${esc(o.persona)} ${badge(o.tag,"badge-blue")}${/AGD|SOIL|NUR/.test(o.tag)?" "+badge("BIOCHAR","badge-green"):""}</h3>
      ${o.steps.map(st=>script(st.t,st.b)).join("")}
    </div>`).join("");
    return page("gtm-sequences",
      head("Outbound Sequences","Human, short, specific, credible — email 1–4, breakup, call opener, voicemail, and three LinkedIn steps per segment. BIOCHAR segments lead; absorbent runs second. Copy any block. Replace {First}/{Me}/{phone} before sending.")+
      `<div class="note ok"><b>Primary biochar angle:</b> OMRI-listed sugarcane-bagasse biochar with an ordered honeycomb pore structure — holds ~3–3.5× its weight in water and can shorten compost cycles ~10–30% (per research). We have 80 MT ready to ship, so a winning free-sample trial converts straight to an order. The cold ask is always the free sample — never a bulk/LOI pitch. <b>Secondary absorbent angle:</b> plant-based bagasse absorbent, ~5× its weight (est.) → fewer bags + lighter disposal vs wood/clay. Always tag ratio claims as estimates.</div>`+
      filters+blocks
    );
  }
  window.gtmSeqFilter=(el,i)=>{el.closest(".filters").querySelectorAll(".pill").forEach(p=>p.classList.remove("active"));el.classList.add("active");
    document.querySelectorAll(".gtm-seq").forEach(b=>b.style.display=(i==="all"||b.dataset.idx===i)?"":"none");};

  /* ---- 7. Calling Plan ---- */
  function rCalling(){
    const c=GTM.calling;
    return page("gtm-calling",
      head("Calling Plan","Who to call first, when, at what volume, with natural scripts per buyer type and every follow-up scenario.")+
      `<div class="grid g2">
        <div class="card"><h4>📞 Who to call first</h4>${ul(c.order)}</div>
        <div class="card"><h4>⏰ When to call</h4>${ul(c.when)}</div>
        <div class="card"><h4>📊 Daily volume ramp</h4>${ul(c.volume)}</div>
        <div class="card"><h4>📮 Voicemail strategy</h4><p style="color:var(--text-dim)">${esc(c.vmStrategy)}</p></div>
      </div>`+
      sec("","Call scripts")+
      `<div class="grid g2">${c.scripts.map(s=>`<div class="card">${script(s.t,s.b)}</div>`).join("")}</div>`+
      sec("","Follow-up scripts")+
      `<div class="grid g2">${c.followups.map(s=>`<div class="card">${script(s.t,s.b)}</div>`).join("")}</div>`
    );
  }

  /* ---- 7b. Phone Script Library (A/B) ---- */
  function rScriptLibrary(){
    const L=GTM.scriptLibrary;
    const segs=[...L.segments].sort((a,b)=>bioSeqRank(a.tag)-bioSeqRank(b.tag));
    const filters=`<div class="filters"><span class="pill active" onclick="gtmScrFilter(this,'all')">All</span>${segs.map((s,i)=>`<span class="pill" onclick="gtmScrFilter(this,'${i}')">${esc(s.tag)}</span>`).join("")}</div>`;
    const block=(s,i)=>`<div class="gtm-scr" data-idx="${i}">
      <h3 class="sub">${esc(s.seg)} ${badge(s.tag,"badge-blue")}${/AGD|SOIL|NUR/.test(s.tag)?" "+badge("BIOCHAR","badge-green"):""} ${s.claimCaution?badge("CLAIM-CONTROLLED","badge-gold"):""}</h3>
      ${s.claimCaution?`<div class="note warn" style="margin:8px 0"><b>⚠ Claim control:</b> absorbent / moisture-management framing only — no animal-health, feed, or veterinary claims.</div>`:""}
      <h4 style="margin-top:10px;color:var(--gold-soft)">Openers — A/B these (${s.openers.length} variants)</h4>
      <div class="grid g2">${s.openers.map(o=>`<div class="card">${script(o.style,o.b)}</div>`).join("")}</div>
      <h4 style="margin-top:12px;color:var(--gold-soft)">Gatekeeper</h4>
      <div class="grid g2">${s.gatekeeper.map(o=>`<div class="card">${script(o.style,o.b)}</div>`).join("")}</div>
      <h4 style="margin-top:12px;color:var(--gold-soft)">Objection turns → back to the free sample</h4>
      <div class="grid g2">${s.objections.map(o=>`<div class="card">${script("“"+o.o+"”",o.b)}</div>`).join("")}</div>
      <h4 style="margin-top:12px;color:var(--gold-soft)">Voicemails</h4>
      <div class="grid g2">${s.voicemails.map(o=>`<div class="card">${script(o.style,o.b)}</div>`).join("")}</div>
    </div>`;
    return page("gtm-scripts",
      head("Phone Script Library (A/B)","A deep bank of call openers, gatekeeper lines, objection turns, and voicemails per segment — every one built to earn a yes to a FREE SAMPLE. No LOIs, no bulk on a cold call. Copy any block; swap {First}/{Me}/{Company}/{phone}.")+
      `<div class="note ok"><b>The whole point:</b> ${esc(L.intro)}</div>`+
      sec("","A/B testing rules")+`<div class="card">${ul(L.abRules)}</div>`+
      filters+segs.map(block).join("")
    );
  }
  window.gtmScrFilter=(el,i)=>{el.closest(".filters").querySelectorAll(".pill").forEach(p=>p.classList.remove("active"));el.classList.add("active");
    document.querySelectorAll(".gtm-scr").forEach(b=>b.style.display=(i==="all"||b.dataset.idx===i)?"":"none");};

  /* ---- 9b. Long-Term / Compounding Channels ---- */
  function rLongTerm(){
    const L=GTM.longTerm;
    const card=c=>`<div class="card pad-lg">
      <h4>${esc(c.name)} ${badge(c.horizon,"badge-blue")} ${badge(c.cost,"badge-muted")}</h4>
      <div class="note ok" style="margin:8px 0"><b>Why:</b> ${esc(c.why)}</div>
      <div class="grid g2" style="gap:8px">
        <div><b style="font-size:11px;color:var(--gold-soft)">Plays</b>${ul(c.plays)}</div>
        <div><b style="font-size:11px;color:var(--gold-soft)">Targets</b>${ul(c.targets)}</div>
      </div>
      <div class="hr" style="margin:10px 0"></div>
      <div style="font-size:12px"><b>Success metric:</b> <span style="color:var(--green-bright)">${esc(c.metric)}</span></div>
    </div>`;
    return page("gtm-longterm",
      head("Long-Term / Compounding Channels","Beyond the Month-1 outbound sprint: the channels that build durable pipeline over 90 days to a year — Facebook groups, trade shows, referrals, content/SEO, distributors, and partnerships. Every one still funnels to the same first win: a free sample in hand.")+
      `<div class="note"><b>Principle:</b> ${esc(L.intro)}</div>`+
      `<div class="grid" style="grid-template-columns:1fr;gap:14px">${L.channels.map(card).join("")}</div>`
    );
  }

  /* ---- 8. LinkedIn Plan ---- */
  function rLinkedIn(){
    const l=GTM.linkedin;
    return page("gtm-linkedin",
      head("LinkedIn Plan","Profile + company-page setup, daily targets, content themes, a DM sequence, comment strategy, and search queries for the primary buyers.")+
      `<div class="grid g2">
        <div class="card"><h4>👤 Profile optimization</h4>${ul(l.profile)}</div>
        <div class="card"><h4>🏢 Company page setup</h4>${ul(l.companyPage)}</div>
      </div>`+
      `<div class="note"><b>Daily connections:</b> ${esc(l.dailyConnect)}</div>`+
      sec("","Weekly content themes")+
      table(["Week","Theme"],l.contentThemes.map(t=>[`<strong>${esc(t.wk)}</strong>`,esc(t.theme)]))+
      sec("","DM sequence")+
      `<div class="grid g2">${l.dm.map(d=>`<div class="card">${script(d.t,d.b)}</div>`).join("")}</div>`+
      sec("","Comment strategy")+`<div class="note ok">${esc(l.comment)}</div>`+
      sec("","Target titles & search queries")+
      `<div class="grid g2">
        <div class="card"><h4>Target titles</h4>${chips(l.targets)}</div>
        <div class="card"><h4>Post types</h4>${ul(l.postTypes)}</div>
      </div>`+
      `<div class="card" style="margin-top:12px"><h4>Search queries</h4>${ul(l.searches)}</div>`+
      sec("","Social pages to create")+
      table(["Page","Priority","Why"],l.socialPages.map(p=>[`<strong>${esc(p.p)}</strong>`,
        badge(p.need,p.need==="Required"?"badge-green":p.need==="Recommended"?"badge-gold":"badge-muted"),esc(p.why)]))+
      `<div class="note">These are recommendations — no external accounts are auto-created. Build the LinkedIn company page first; it's the only required one for a founder-led B2B motion.</div>`
    );
  }

  /* ---- 9. Social Calendar ---- */
  function rSocial(){
    const s=GTM.social;
    const rows=s.posts.map(p=>[`<strong class="t-num">D${p.d}</strong>`,badge(p.pl,"badge-blue"),`<strong>${esc(p.topic)}</strong>`,
      `<em>${esc(p.hook)}</em>`,esc(p.body),esc(p.vis),`<span style="color:var(--green-bright)">${esc(p.cta)}</span>`,pill(p.icp)]);
    return page("gtm-social",
      head("30-Day Social & Content Calendar","Credibility over viral fluff. Every post has a hook, body, visual, CTA, and the ICP it serves — plus five product-demo video scripts.")+
      table(["Day","Platform","Topic","Hook","Body","Visual","CTA","ICP"],rows)+
      sec("","Product demo videos to script")+
      `<div class="grid g2">${s.videos.map(v=>`<div class="card"><h4>🎬 ${esc(v.t)}</h4><p style="color:var(--text-dim)">${esc(v.script)}</p></div>`).join("")}</div>`
    );
  }

  /* ---- 10. Campaign ↔ Landing Map ---- */
  function rLanding(){
    const m=GTM.landingMap;
    return page("gtm-landing",
      head("Campaign ↔ Landing Page Coordination","Every campaign points to the right page with the right CTA, form, sequence, tag, and sales next step. No message-market mismatches.")+
      table(["ICP","Campaign","Outbound CTA","Landing page","Required section","Form","Sequence","Tag","Sales next step"],
        m.map(r=>[`<strong>${esc(r.icp)}</strong>`,esc(r.cmp),`<span style="color:var(--green-bright)">${esc(r.cta)}</span>`,
          `<span class="t-num">${esc(r.lp)}</span>`,esc(r.section),esc(r.form),badge(r.seq,"badge-blue"),badge(r.tag,"badge-muted"),esc(r.next)]))+
      sec("","Coordination rules (guardrails)")+
      `<div class="card">${GTM.landingRules.map(r=>`<div class="note warn" style="margin:6px 0">${esc(r)}</div>`).join("")}</div>`
    );
  }

  /* ---- 11. CRM / App Tracking ---- */
  function rCRM(){
    const objs=GTM.crmObjects;
    const objBlock=o=>sec("",o.obj+" object")+
      table(["Field","Type","Req","Options","Description","Dashboard use"],o.fields.map(f=>[
        `<strong>${esc(f.n)}</strong>`,`<span class="t-num">${esc(f.t)}</span>`,
        badge(f.r,f.r==="Req"?"badge-green":f.r==="Auto"?"badge-blue":"badge-muted"),esc(f.o),esc(f.d),esc(f.dash)]));
    return page("gtm-crm",
      head("CRM & App Tracking Spec","Objects, fields, lead scoring, and the status workflow to build into the app. Aligns with the Pipeline schema in the main Sales OS.")+
      objs.map(objBlock).join("")+
      sec("","Lead scoring model")+
      table(["Factor","Weight","How it's scored","Note"],GTM.scoring.map(s=>[`<strong>${esc(s.f)}</strong>`,
        `<span class="t-num">${esc(s.w)}</span>`,esc(s.how),`<em>${esc(s.note)}</em>`]))+
      sec("","Status workflow")+
      `<div class="filters">${GTM.statuses.map((st,i)=>`<span class="pill" style="cursor:default">${i+1}. ${esc(st)}</span>`).join("")}</div>`+
      `<div class="note ok"><b>Flow:</b> New Target → Researched → Contact Found → Sequenced → Replied → Call Booked → Sample Requested → Sample Sent → Trial Active → Result: Positive → LOI Presented → LOI Signed → Offtake (Q4). Off-ramps: Nurture / Disqualified.</div>`
    );
  }

  /* ---- 12. Dashboard ---- */
  function rDashboard(){
    return page("gtm-dashboard",
      head("GTM Dashboard Spec","Every card with its formula, data source, target, warning threshold, and owner — daily activity through closed revenue and carbon optionality.")+
      table(["Card","Formula","Data source","Target","Warning threshold","Owner"],
        GTM.dashboard.map(c=>[`<strong>${esc(c.m)}</strong>`,`<span class="t-num">${esc(c.f)}</span>`,esc(c.src),
          `<span style="color:var(--green-bright)">${esc(c.tgt)}</span>`,`<span style="color:var(--red-soft)">${esc(c.warn)}</span>`,esc(c.o)]))+
      `<div class="note warn"><b>Carbon guardrail on the dashboard:</b> estimated carbon-credit value is always flagged (EST) and can never exceed deployable tons. It is optionality, never committed revenue.</div>`
    );
  }

  /* ---- 13. Sample / Quote Workflow ---- */
  function rSample(){
    const f=GTM.sampleFlow;
    return page("gtm-sample",
      head("Sample → LOI Workflow","From outreach to free sample to signed LOI — with qualification, approval, shipping SLA, follow-up timing, and the O&G procurement-grade standard. No bulk selling in Month 1.")+
      `<div class="grid g2">
        <div class="card"><h4>🧪 When to offer a SAMPLE</h4><p>${esc(f.whenSample)}</p></div>
        <div class="card"><h4>📝 When to present an LOI</h4><p>${esc(f.whenLOI)}</p></div>
      </div>`+
      `<div class="note warn" style="margin-top:12px"><b>Oil & gas standard:</b> ${esc(f.ogNote)}</div>`+
      sec("","Sample qualification questions")+`<div class="card">${ul(f.qualQuestions)}</div>`+
      sec("","Sample request form fields")+`<div class="card">${ul(f.formFields)}</div>`+
      `<div class="grid g2" style="margin-top:12px">
        <div class="card"><h4>✅ Approval process</h4>${ul(f.approval)}</div>
        <div class="card"><h4>📦 Shipping / tracking</h4>${ul(f.shipping)}</div>
        <div class="card"><h4>⏱ Follow-up timing</h4>${ul(f.followTiming)}</div>
        <div class="card"><h4>📝 Trial documentation</h4>${ul(f.trialDoc)}</div>
        <div class="card"><h4>➡️ LOI conversion</h4>${ul(f.loiConversion)}</div>
        <div class="card"><h4>🔁 Reorder process (Q4+)</h4>${ul(f.reorder)}</div>
      </div>`
    );
  }

  /* ---- 14. Final Execution Checklist ---- */
  function rLaunch(){
    const l=GTM.launch;
    return page("gtm-launch",
      head("③ Launch gate — first-48h execution","The gate before outbound, the exact first-48-hours moves, and week-one outputs with iteration rules.")+
      sec("","Before outreach (gate)")+`<div class="card">${ul(l.before)}</div>`+
      sec("","First 48 hours — exact tasks")+
      table(["Task","What to do"],l.first48.map(t=>[`<strong>${esc(t.t)}</strong>`,esc(t.d)]))+
      sec("","First week")+
      `<div class="grid g3">
        <div class="card"><h4>Expected outputs</h4>${ul(l.firstWeek.outputs)}</div>
        <div class="card"><h4>Review checkpoints</h4>${ul(l.firstWeek.checkpoints)}</div>
        <div class="card"><h4>Iteration rules</h4>${ul(l.firstWeek.iteration)}</div>
      </div>`+
      `<div class="note ok"><b>Launch sequence:</b> pass the pre-launch gate → verify infra & pages (48h) → launch CMP-AGD (biochar) Email 1 to top 30 ag distributors/blenders → dial for new-product decision-makers → ship first biochar sample kits → convert a winning trial to a paid order against the 80 MT → document a claim-safe win → expand into compost/nursery biochar, then layer the absorbent secondary track (O&G/ENV/landfill), then carbon (days 61–90).</div>`
    );
  }

  /* ================= EXPORT BUILDERS =================
     Consolidated Sales OS (v2): GTM no longer owns its own nav or
     self-renders. It exposes its section builders on window.GTMB so
     app.js can compose them into the unified 12-section layout.
     Each builder still returns a full page("gtm-…", …) block; app.js
     strips the wrapper (stripBody) and stacks the inner content under
     the matching consolidated section.
     ================================================================ */
  window.GTMB = {rSummary,rPrelaunch,rCampaigns,r30Day,rScale,rSequences,rCalling,rScriptLibrary,rLinkedIn,rSocial,rLongTerm,rLanding,rCRM,rDashboard,rSample,rLaunch};
})();
