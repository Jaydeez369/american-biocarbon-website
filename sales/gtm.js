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


  /* small local helpers layered on the shared design system */
  const gbadgePri = p => badge(p, p==="P0"?"pri-1":p==="P1"?"pri-2":"pri-3");
  const gstatus = s => badge(s, s==="Done"?"badge-green":s==="Doing"?"badge-gold":"badge-muted");
  const pill = t => `<span class="badge badge-muted" style="font-size:10.5px">${esc(t)}</span>`;
  const chips = arr => arr.map(pill).join(" ");
  const ul = arr => `<ul>${arr.map(x=>`<li>${esc(x)}</li>`).join("")}</ul>`;

  /* rSummary and rCampaigns lived here and are deleted with their data. Campaigns and
     ICP is now rendered by outreach.js from the canonical ICP list. */

  /* rScale, rSequences, rCalling and rScriptLibrary lived here and are deleted along
     with their data. The scale plan described building a machine that now exists; the
     three copy banks were replaced by outreach-data.js. bioSeqRank went with them. */

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

  function rSample(){
    const f=GTM.sampleFlow;
    return page("gtm-sample",
      head("Sample to Order Workflow","From outreach to free sample to a paid metric-ton order, with qualification, approval, shipping SLA, follow-up timing, and the O&G procurement-grade standard. The LOI is the second ask and reserves Q4 truckload volume.")+
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


  /* ================= EXPORT BUILDERS =================
     Consolidated Sales OS (v2): GTM no longer owns its own nav or
     self-renders. It exposes its section builders on window.GTMB so
     app.js can compose them into the unified 12-section layout.
     Each builder still returns a full page("gtm-…", …) block; app.js
     strips the wrapper (stripBody) and stacks the inner content under
     the matching consolidated section.
     ================================================================ */
  window.GTMB = {rLinkedIn,rSocial,rLongTerm,rSample};
})();
