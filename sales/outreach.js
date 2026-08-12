/* ============================================================
   VEJ Sales OS - Outreach Engine renderer
   ------------------------------------------------------------
   Reads outreach-data.js (const OUTREACH) and renders the two
   track view: biochar on the left, absorbent on the right, each
   with its OWN filter row and its own ICP stack. The two tracks
   never share a filter, because they are two different sends to
   two different lists with two different geographies.

   Reuses the shared design system helpers defined in app.js
   (page, head, esc, nl, script, badge, copyEl). Loaded before
   app.js and exposed on window.OUTREACH_UI, the same pattern
   gtm.js and pipeline.js use.

   Every counter on this page is derived from the data. Add an
   ICP or a subject line to outreach-data.js and the header
   counts, the pill row and the per ICP badges all follow. There
   is no number typed into this file.

   FORMATTING RULE: no hyphens or dashes in any visible string
   here either. Middots and commas do the separating work.
   ============================================================ */
(function(){
  if (typeof OUTREACH === "undefined") { console.warn("OUTREACH data missing"); return; }

  /* Live roster counts, read straight from window.ROSTER. This is the join that the ICP
     reconciliation was for: a campaign card now states how many real companies are actually
     filed under it, so "we have a campaign for that" and "we have a list for that" can never
     drift apart again. Guarded because roster-data.js is a separate script that a partial
     deployment could omit. */
  const rosterCounts = () => (window.ROSTER && window.ROSTER.byIcp) || {};
  const rosterTotals = () => {
    const R = window.ROSTER || {};
    return { count: R.count || 0, live: R.live || 0, needsWork: R.needsWork || 0, empty: R.emptyIcps || [] };
  };

  let OSID = 0;
  /* Inline copyable chip. copyEl (app.js) reads data-raw off the span.
     label defaults to the payload, which is what a single subject line wants. Pass a
     separate label when the payload is a whole block and printing it would be absurd. */
  function copyChip(payload, cls, label){
    const id = "oes" + (OSID++);
    return `<button type="button" class="${cls}" title="Click to copy" onclick="copyEl('${id}')">` +
      `<span id="${id}" data-raw="${esc(payload)}">${esc(label === undefined ? payload : label)}</span></button>`;
  }

  /* Local copy block rather than the shared script() helper, for two reasons.
     One: what you SEE and what you COPY differ here. The subject already sits in the
     block label, so printing it again above the greeting is noise, but it has to be in
     the clipboard payload or the paste into Instantly is missing its subject.
     Two: script() has a newline and two spaces between its label and its body span,
     which whitespace renders as a leading indent on the first line of every message. */
  function copyBlock(label, visible, payload){
    const id = "oeb" + (OSID++);
    return `<div class="script oe-block"><span class="lbl">${esc(label)}</span>` +
      `<button class="copy" onclick="copyEl('${id}')">Copy</button>` +
      `<span id="${id}" data-raw="${esc(payload === undefined ? visible : payload)}">${nl(visible)}</span></div>`;
  }
  const chips = arr => `<div class="oe-chips">${arr.map(t=>`<span class="oe-chip">${esc(t)}</span>`).join("")}</div>`;
  const bullets = arr => `<ul class="oe-ul">${arr.map(t=>`<li>${esc(t)}</li>`).join("")}</ul>`;

  /* A collapsible group inside an ICP card. Messages open by default because that is
     what a rep is here for; everything else is one click away rather than in the way. */
  function grp(title, count, inner, open){
    return `<details class="oe-grp"${open?" open":""}>
      <summary><span class="oe-grp-t">${esc(title)}</span>${count?`<span class="oe-grp-n">${count}</span>`:""}<span class="oe-caret"></span></summary>
      <div class="oe-grp-b">${inner}</div></details>`;
  }

  function icpCard(icp, track){
    const subjects = `<div class="oe-subjects">
        ${icp.subjects.map((s,i)=>`<div class="oe-subj-row"><span class="oe-subj-n">${i+1}</span>${copyChip(s,"oe-subj")}</div>`).join("")}
      </div>
      <div class="oe-subj-all">${copyChip(icp.subjects.join("\n"),"oe-btn","Copy all " + icp.subjects.length)}<span class="oe-hint">Click any line to copy it on its own.</span></div>`;

    const variants = icp.variants.map(v=>
      `<div class="oe-var">
         <div class="oe-var-h"><span class="oe-var-id">${esc(v.id)}</span><span class="oe-var-angle">${esc(v.angle)}</span></div>
         ${copyBlock(v.subject, v.body, "Subject: " + v.subject + "\n\n" + v.body)}
       </div>`).join("");

    const why = `<div class="oe-why"><p>${esc(icp.mechanism)}</p></div>
      <div class="oe-split">
        <div><h5 class="oe-h5">Pain points</h5>${bullets(icp.pains)}</div>
        <div><h5 class="oe-h5">Proof to use</h5>${bullets(icp.proof)}</div>
      </div>`;

    const follow = icp.followups.map(f=>copyBlock(f.t, f.b)).join("");
    const phone  = copyBlock("Call opener", icp.phone.opener) + copyBlock("Voicemail", icp.phone.voicemail);
    const objs   = icp.objections.map(o=>copyBlock("They say: " + o.o, o.b)).join("");

    return `<details class="oe-icp" data-icp="${esc(icp.id)}" data-track="${esc(track.key)}">
      <summary class="oe-sum">
        <span class="oe-tag">${esc(icp.tag)}</span>
        <span class="oe-name">${esc(icp.name)}</span>
        <span class="oe-sum-n">${icp.subjects.length} subjects &middot; ${icp.variants.length} messages</span>
        <span class="oe-caret"></span>
      </summary>
      <div class="oe-body">
        <p class="oe-who">${esc(icp.who)}</p>
        ${chips(icp.titles)}
        ${grp("Message variants", icp.variants.length, variants, true)}
        ${grp("Subject lines for A/B", icp.subjects.length, subjects)}
        ${grp("Why it works", "", why)}
        ${grp("Follow up sequence", icp.followups.length, follow)}
        ${grp("Phone and voicemail", "", phone)}
        ${grp("Objection turns", icp.objections.length, objs)}
        <div class="oe-guard"><b>Claim guardrail.</b> ${esc(icp.guardrail)}</div>
      </div>
    </details>`;
  }

  function trackCol(track){
    const nSub = track.icps.reduce((a,i)=>a+i.subjects.length,0);
    const nVar = track.icps.reduce((a,i)=>a+i.variants.length,0);
    const pills = `<div class="oe-filters" id="oe-f-${track.key}">
        <span class="oe-pill active" onclick="oeFilter(this,'${track.key}','all')">All ICPs</span>
        ${track.icps.map(i=>`<span class="oe-pill" onclick="oeFilter(this,'${track.key}','${esc(i.id)}')">${esc(i.short)}</span>`).join("")}
      </div>`;
    return `<section class="oe-track oe-${track.key}">
      <header class="oe-th">
        <div class="oe-th-top">
          <span class="oe-th-mark"></span>
          <h2>${esc(track.name)}</h2>
          <span class="oe-th-count">${track.icps.length} ICPs &middot; ${nSub} subjects &middot; ${nVar} messages</span>
        </div>
        <p class="oe-th-sub">${esc(track.sub)}</p>
        <p class="oe-th-prod">${esc(track.product)}</p>
        <dl class="oe-facts">
          <div><dt>Geography</dt><dd>${esc(track.geo)}</dd></div>
          <div><dt>Price</dt><dd>${esc(track.price)}</dd></div>
          <div><dt>Inventory</dt><dd>${esc(track.inventory)}</dd></div>
          <div><dt>Sample</dt><dd>${esc(track.sample)}</dd></div>
        </dl>
        <p class="oe-th-why">${esc(track.why)}</p>
      </header>
      ${pills}
      <div class="oe-tools">
        <button type="button" class="oe-btn oe-btn-sm" onclick="oeToggleAll('${track.key}',true)">Expand all</button>
        <button type="button" class="oe-btn oe-btn-sm" onclick="oeToggleAll('${track.key}',false)">Collapse all</button>
      </div>
      <div class="oe-list" id="oe-l-${track.key}">${track.icps.map(i=>icpCard(i,track)).join("")}</div>
    </section>`;
  }

  function rOutreach(){
    const M = OUTREACH.meta;
    const T = OUTREACH.tracks;
    const nIcp = T.reduce((a,t)=>a+t.icps.length,0);
    const nSub = T.reduce((a,t)=>a+t.icps.reduce((b,i)=>b+i.subjects.length,0),0);
    const nVar = T.reduce((a,t)=>a+t.icps.reduce((b,i)=>b+i.variants.length,0),0);
    const nFol = T.reduce((a,t)=>a+t.icps.reduce((b,i)=>b+i.followups.length,0),0);

    const stat = (v,l)=>`<div class="oe-stat"><span class="oe-stat-v">${v}</span><span class="oe-stat-l">${esc(l)}</span></div>`;

    return page("outreach",
      head("Outreach Engine",
        "Two tracks, side by side, because they are two different sends. Biochar runs inside the 500 mile freight radius. Absorbent runs nationwide. Every ICP carries its own subject line pool for A/B, three full message variants, a follow up sequence, a phone opener and the objection turns that get you back to the free sample. This copy is canonical and it replaced everything that came before it.")+

      `<div class="oe-stats">
        ${stat(T.length,"Tracks")}
        ${stat(nIcp,"ICPs")}
        ${stat(nSub,"Subject lines")}
        ${stat(nVar,"Message variants")}
        ${stat(nFol,"Follow up blocks")}
      </div>`+

      `<div class="oe-meta">
        <div class="oe-meta-card">
          <h4>How to run the test</h4>
          ${bullets(M.rules)}
        </div>
        <div class="oe-meta-card oe-meta-warn">
          <h4>Claim guardrails</h4>
          ${bullets(M.guardrails)}
        </div>
        <div class="oe-meta-card oe-sig">
          <h4>Signature</h4>
          ${copyBlock("Paste into every step", M.signature)}
          ${bullets([M.signatureNote])}
        </div>
      </div>`+

      `<div class="oe-provenance">
        <span><b>Source.</b> ${esc(M.source)}</span>
        <span><b>Stack.</b> ${esc(M.channel)}</span>
        <span><b>Replies land at.</b> ${esc(M.reply)}</span>
        <span><b>Calls land at.</b> ${esc(M.phone)}</span>
        <span><b>Cork.</b> ${esc(M.corkNote)}</span>
      </div>`+

      `<div class="oe-tokens">${M.tokens.map(t=>`<span class="oe-token"><code>${esc(t[0])}</code>${esc(t[1])}</span>`).join("")}</div>`+

      `<div class="oe-tracks">${T.map(trackCol).join("")}</div>`
    );
  }

  /* ==========================================================
     CAMPAIGNS AND ICP
     The same ICPs, one level up: who to put on the list, what
     triggers a buy, what disqualifies them, and how much of the
     week each one is worth. Mirrors the Outreach Engine layout
     on purpose. Same order, same tags, same two columns, so
     moving between the two sections needs no re-orientation.
     ========================================================== */

  const PRI = { P0:"pri-1", P1:"pri-2", P2:"pri-3" };

  function campaignCard(icp, track, maxEffort){
    const c = icp.campaign;
    const p = c.persona;
    // The bar is scaled against the largest campaign in the set, not against 100, so the
    // small ICPs still render as a readable sliver. The number beside it is the real share.
    const share = Math.round(c.effort / maxEffort * 100);
    const listed = rosterCounts()[icp.tag] || 0;
    return `<details class="oe-icp oe-cmp" data-icp="${esc(icp.id)}" data-track="${esc(track.key)}">
      <summary class="oe-sum">
        <span class="oe-tag">${esc(icp.tag)}</span>
        <span class="oe-name">${esc(icp.name)}</span>
        <span class="oe-sum-n">${badge(c.priority, PRI[c.priority] || "badge-muted")}
          <span class="oe-eff"><span class="oe-eff-bar"><i style="width:${share}%"></i></span>${c.effort}% of send</span>
          ${listed
            ? `<span class="oe-listn" title="Companies filed under ${esc(icp.tag)} in the roster right now">${listed} on the list</span>`
            : `<span class="oe-listn oe-listn-0" title="This campaign has copy and a plan but nobody is filed under it in the roster. It cannot send until the list is built.">no list yet</span>`}</span>
        <span class="oe-caret"></span>
      </summary>
      <div class="oe-body">
        <p class="oe-who">${esc(icp.who)}</p>
        <div class="oe-offer"><b>Offer.</b> ${esc(c.offer)}</div>
        <div class="oe-ctas">
          <div><span class="oe-h5">Primary ask</span><p>${esc(c.cta)}</p></div>
          <div><span class="oe-h5">Secondary ask</span><p>${esc(c.cta2)}</p></div>
        </div>
        ${grp("Who goes on the list", "", `
          <h5 class="oe-h5">Company types</h5>${bullets(c.companies)}
          <h5 class="oe-h5" style="margin-top:10px">Target titles</h5>${chips(icp.titles)}
          <div class="oe-why" style="margin-top:10px"><p><b>List build.</b> ${esc(c.list)}</p></div>`, true)}
        ${grp("Buying triggers", c.triggers.length, bullets(c.triggers))}
        ${grp("Disqualifiers", c.disq.length, `<div class="oe-disq">${bullets(c.disq)}</div>`)}
        ${grp("The buyer", "", `
          <div class="oe-split">
            <div><h5 class="oe-h5">Cares about</h5><p class="oe-p">${esc(p.cares)}</p>
                 <h5 class="oe-h5" style="margin-top:9px">Afraid of</h5><p class="oe-p">${esc(p.fears)}</p></div>
            <div><h5 class="oe-h5">Needs to see</h5><p class="oe-p">${esc(p.needs)}</p>
                 <h5 class="oe-h5" style="margin-top:9px">Their words</h5><p class="oe-p">${esc(p.language)}</p></div>
          </div>
          <div class="oe-guard" style="margin-top:10px"><b>Do not.</b> ${esc(p.avoid)}</div>
          <h5 class="oe-h5" style="margin-top:11px">Discovery questions</h5>${bullets(p.discovery)}`)}
        <div class="oe-cmp-foot">
          <div><span class="oe-h5">Success metric</span><p>${esc(c.metric)}</p></div>
          <div><span class="oe-h5">Expected cycle</span><p>${esc(c.cycle)}</p></div>
          <div><span class="oe-h5">List size right now</span><p>${listed
            ? `<b>${listed}</b> companies filed under ${esc(icp.tag)} in the roster.`
            : `<b class="oe-bad">Nobody is filed under ${esc(icp.tag)} yet.</b> The campaign is written and ready, but it has no list, so it cannot send. Build the list before this one counts toward the allocation.`}</p></div>
        </div>
        <a class="oe-jump" href="#outreach" onclick="oeJump('${esc(track.key)}','${esc(icp.id)}')">Open the copy for this ICP in the Outreach Engine</a>
      </div>
    </details>`;
  }

  function campaignCol(track, maxEffort){
    const trackEffort = track.icps.reduce((a,i)=>a+i.campaign.effort,0);
    const trackListed = track.icps.reduce((a,i)=>a+(rosterCounts()[i.tag]||0),0);
    const rows = [...track.icps].sort((a,b)=>b.campaign.effort-a.campaign.effort);
    return `<section class="oe-track oe-${track.key}">
      <header class="oe-th">
        <div class="oe-th-top">
          <span class="oe-th-mark"></span>
          <h2>${esc(track.name)}</h2>
          <span class="oe-th-count">${track.icps.length} campaigns &middot; ${trackEffort}% of send &middot; ${trackListed} companies</span>
        </div>
        <p class="oe-th-sub">${esc(track.sub)}</p>
        <div class="oe-alloc">${rows.map(i=>`
          <div class="oe-alloc-row">
            <span class="oe-alloc-n">${esc(i.short)}</span>
            <span class="oe-alloc-bar"><i style="width:${Math.round(i.campaign.effort/maxEffort*100)}%"></i></span>
            <span class="oe-alloc-v">${i.campaign.effort}%</span>
          </div>`).join("")}</div>
      </header>
      ${`<div class="oe-filters" id="oc-f-${track.key}">
        <span class="oe-pill active" onclick="ocFilter(this,'${track.key}','all')">All ICPs</span>
        ${track.icps.map(i=>`<span class="oe-pill" onclick="ocFilter(this,'${track.key}','${esc(i.id)}')">${esc(i.short)}</span>`).join("")}
      </div>`}
      <div class="oe-tools">
        <button type="button" class="oe-btn oe-btn-sm" onclick="ocToggleAll('${track.key}',true)">Expand all</button>
        <button type="button" class="oe-btn oe-btn-sm" onclick="ocToggleAll('${track.key}',false)">Collapse all</button>
      </div>
      <div class="oe-list" id="oc-l-${track.key}">${track.icps.map(i=>campaignCard(i,track,maxEffort)).join("")}</div>
    </section>`;
  }

  function rCampaigns(){
    const P = OUTREACH.plan;
    const T = OUTREACH.tracks;
    const total = T.reduce((a,t)=>a+t.icps.reduce((b,i)=>b+i.campaign.effort,0),0);
    const maxEffort = Math.max(...T.flatMap(t=>t.icps.map(i=>i.campaign.effort)));
    const byPri = pri => T.reduce((a,t)=>a+t.icps.filter(i=>i.campaign.priority===pri).length,0);
    const stat = (v,l)=>`<div class="oe-stat"><span class="oe-stat-v">${v}</span><span class="oe-stat-l">${esc(l)}</span></div>`;
    const nIcp = T.reduce((a,t)=>a+t.icps.length,0);
    const RT = rosterTotals();
    const counts = rosterCounts();
    const listed = T.flatMap(t=>t.icps).reduce((a,i)=>a+(counts[i.tag]||0),0);
    const emptyTags = T.flatMap(t=>t.icps).filter(i=>!(counts[i.tag]||0)).map(i=>i.tag);

    // The allocation is only meaningful if it adds up. Say so out loud rather than
    // letting a silently wrong split drive how the week gets spent.
    const sumNote = total === 100
      ? `<span class="oe-ok">Allocation sums to 100 percent.</span>`
      : `<span class="oe-bad">Allocation sums to ${total} percent. Fix the effort values on the ICPs.</span>`;

    return page("strategy",
      head("Campaigns and ICP",
        `${nIcp} campaigns, one per ICP, split across the same two tracks as the Outreach Engine. This page answers who goes on the list, what makes them buy, what disqualifies them and how much of the week each one is worth. The copy that gets sent lives in the Outreach Engine, the companies live in the Sales Pipeline, and all three read the same ICP list.`)+

      `<div class="oe-stats">
        ${stat(nIcp,"Campaigns")}
        ${stat(byPri("P0"),"P0 this month")}
        ${stat(listed,"Companies on lists")}
        ${stat(RT.needsWork,"Rows needing work")}
        ${stat(T[0].icps.reduce((a,i)=>a+i.campaign.effort,0)+"%","Biochar share")}
      </div>`+

      (emptyTags.length ? `<div class="oe-empty-warn">
        <b>${emptyTags.length} campaign${emptyTags.length>1?"s have":" has"} no list.</b>
        ${emptyTags.map(t=>`<code>${esc(t)}</code>`).join(" ")} ${emptyTags.length>1?"are":"is"} written, scored and allocated effort, but no company in the roster is filed under ${emptyTags.length>1?"them":"it"} yet.
        Until the list exists ${emptyTags.length>1?"they":"it"} cannot send, and the effort allocated to ${emptyTags.length>1?"them":"it"} is really going somewhere else.
        Either build the list or move the allocation.
      </div>` : "")+

      `<div class="oe-meta">
        <div class="oe-meta-card">
          <h4>Why this order</h4>
          ${bullets(P.wedge)}
        </div>
        <div class="oe-meta-card oe-meta-ok">
          <h4>The offer, and the paths to it</h4>
          <p class="oe-p" style="margin-bottom:8px">${esc(P.offer)}</p>
          ${bullets(P.ctaPaths)}
        </div>
      </div>`+

      `<div class="oe-provenance">
        <span><b>Thesis.</b> ${esc(P.thesis)}</span>
        <span><b>Allocation.</b> ${sumNote} Percentages are share of total send volume, not share of a track. Each one is set on the ICP itself, so this page and the cards below can never disagree.</span>
      </div>`+

      `<div class="oe-tracks" style="margin-top:22px">${T.map(t=>campaignCol(t,maxEffort)).join("")}</div>`+

      sec("","Where this has to get to")+
      `<div class="grid g3">
        <div class="card"><h4>Day 30</h4><p>${esc(P.goals.d30)}</p></div>
        <div class="card"><h4>Day 60</h4><p>${esc(P.goals.d60)}</p></div>
        <div class="card"><h4>Day 90</h4><p>${esc(P.goals.d90)}</p></div>
      </div>`+
      sec("","The numbers we actually watch")+
      `<div class="card">${bullets(P.kpis)}</div>`
    );
  }

  /* Campaign column filters. Separate ids from the Outreach Engine ones because both
     sections are in the DOM at once, hidden by the section router rather than unmounted. */
  window.ocFilter = (el, trackKey, icpId) => {
    const bar = document.getElementById("oc-f-" + trackKey);
    if (bar) bar.querySelectorAll(".oe-pill").forEach(p=>p.classList.remove("active"));
    el.classList.add("active");
    const list = document.getElementById("oc-l-" + trackKey);
    if (!list) return;
    list.querySelectorAll(".oe-icp").forEach(c=>{
      const show = icpId === "all" || c.dataset.icp === icpId;
      c.style.display = show ? "" : "none";
      if (show && icpId !== "all") c.open = true;
    });
  };
  window.ocToggleAll = (trackKey, open) => {
    const list = document.getElementById("oc-l-" + trackKey);
    if (!list) return;
    list.querySelectorAll(".oe-icp").forEach(c=>{ if(c.style.display!=="none") c.open = open; });
  };

  /* Hand off from a campaign card to the copy for the same ICP. go() is defined in
     app.js, which loads after this file, so it is looked up at click time. */
  window.oeJump = (trackKey, icpId) => {
    if (typeof go === "function") go("outreach");
    const bar = document.getElementById("oe-f-" + trackKey);
    const pill = bar && [...bar.querySelectorAll(".oe-pill")]
      .find(p => (p.getAttribute("onclick")||"").includes("'" + icpId + "'"));
    if (pill) pill.click();
    const card = document.querySelector(`#oe-l-${trackKey} .oe-icp[data-icp="${icpId}"]`);
    if (card) { card.open = true; card.scrollIntoView({block:"start"}); }
  };

  /* Per track filtering. Scoped by data-track so the biochar pills never touch the
     absorbent column, which is the whole point of the two view layout. */
  window.oeFilter = (el, trackKey, icpId) => {
    const bar = document.getElementById("oe-f-" + trackKey);
    if (bar) bar.querySelectorAll(".oe-pill").forEach(p=>p.classList.remove("active"));
    el.classList.add("active");
    const list = document.getElementById("oe-l-" + trackKey);
    if (!list) return;
    list.querySelectorAll(".oe-icp").forEach(c=>{
      const show = icpId === "all" || c.dataset.icp === icpId;
      c.style.display = show ? "" : "none";
      // Filtering to one ICP means you want to read it, not click it open again.
      if (show && icpId !== "all") c.open = true;
    });
  };

  window.oeToggleAll = (trackKey, open) => {
    const list = document.getElementById("oe-l-" + trackKey);
    if (!list) return;
    list.querySelectorAll(".oe-icp").forEach(c=>{ if(c.style.display!=="none") c.open = open; });
  };

  window.OUTREACH_UI = { rOutreach, rCampaigns };
})();
