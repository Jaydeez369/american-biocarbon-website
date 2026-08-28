/* ============ VEJ Sales OS — CRUMBLE BLITZ ============
   The push to move six truckloads of Absorbent Crumble, and the state of the two gates in
   front of it: the Apollo reveal that has not been paid for, and the Allo load that cannot
   be undone.

   Reads window.CRUMBLE (crumble-data.js, generated). Types no numbers of its own — every
   figure on the page comes off the snapshot, so the page cannot disagree with the module
   that produced it. Loads BEFORE app.js; exposes window.CRUMBLE_UI.rCrumble for LEAN_SECTIONS.

   IT CANNOT SPEND. There is no key and no endpoint in this file or its data layer. That is
   deliberate: this section exists to describe an unauthorised credit spend, so opening the
   dashboard must never be able to start one. */
(function(){
  const C = window.CRUMBLE;
  if (!C) { window.CRUMBLE_UI = { rCrumble: () => "" }; return; }

  const esc = s => String(s??"").replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;");
  const num = n => Number(n||0).toLocaleString();

  /* The roster stores websites both with and without a scheme. A bare domain in an href is a
     RELATIVE path, so the link would point inside the Sales OS instead of at the company.
     The generator normalises, and this is the belt to that braces. */
  const href = u => {
    const raw = String(u||"").trim();
    if (!raw) return "";
    return /^https?:\/\//i.test(raw) ? raw : "https://" + raw.replace(/^\/+/,"");
  };
  const site = (name, url) => {
    const h = href(url);
    return h
      ? `<a class="cb-site" href="${esc(h)}" target="_blank" rel="noopener noreferrer">${esc(name)}<span class="cb-ext" aria-hidden="true">↗</span></a>`
      : esc(name);
  };

  const kpi = (l,v,d) => `<div class="card kpi"><div class="l">${esc(l)}</div><div class="v">${v}</div>${d?`<div class="cb-kd">${esc(d)}</div>`:""}</div>`;

  const GATE_CLASS = {
    "NOT SPENT":"badge-gold", "NOT LOADED":"badge-red", "DEFERRED":"badge-muted",
    "BLOCKED":"badge-red", "READY":"badge-green", "WAITING ON NUMBERS":"badge-gold",
  };

  /* Victor's 2026-08-27 read added two angles. They change what the caller SAYS, so they are
     rendered as their own band rather than folded into the account note. */
  const ANGLE_LABEL = { LCM:"Lost circulation angle", HAULER:"Hauler angle" };
  const angleBand = a => a.angleOpener
    ? `<p class="cb-angle cb-angle-${esc(a.angle)}"><b>${esc(ANGLE_LABEL[a.angle]||a.angle)}</b>${esc(a.angleOpener)}</p>`
    : "";

  function rGates(){
    return `
      <h2 class="sec"><span class="num">02</span>What is holding, and why</h2>
      <p class="lead">Three things are deliberately not done. Each is a decision somebody has to
      make rather than a step somebody forgot, so they are stated here instead of sitting in a
      commit message.</p>
      <div class="grid g3">
        ${C.gates.map(g=>`<div class="card">
          <div class="cb-gate-h">
            <span class="badge ${GATE_CLASS[g.state]||"badge-muted"}">${esc(g.state)}</span>
          </div>
          <h4 class="cb-gate-t">${esc(g.what)}</h4>
          <p class="cb-gate-d">${esc(g.detail)}</p>
        </div>`).join("")}
      </div>`;
  }

  function rTargets(){
    const s = C.stats;
    const withTargets = C.accounts.filter(a=>a.targets>0);
    return `
      <h2 class="sec"><span class="num">03</span>The ${num(s.phoneTargets)} phone targets</h2>
      <p class="lead">Cut from the call list to the names where a direct line changes the odds,
      two per company from different desks. <b>Every one is a confirmed Apollo yes</b> — each
      person was checked individually, so no credit buys a blank. ${num(s.verifiedYesCallFirst)}
      confirmed yeses were available to choose ${num(s.phoneTargets)} from.
      ${s.byAngle && (s.byAngle.LCM||s.byAngle.HAULER) ? `Angle mix after Victor's read:
      <b>${num(s.byAngle.LCM||0)} lost-circulation</b>, <b>${num(s.byAngle.HAULER||0)} hauler</b>,
      ${num(s.byAngle.DIRECT||0)} direct.` : ""}</p>
      <div class="note"><b>${num(s.numbersInHand)} of ${num(s.phoneTargets)} numbers are in hand.</b>
      Apollo delivers a phone reveal asynchronously and refuses <code>reveal_phone_number</code> without a
      <code>webhook_url</code>, so the numbers land on a webhook rather than in the response. See the gate above.</div>
      <div class="tbl-wrap"><table class="cb-tbl">
        <thead><tr><th>#</th><th>Name</th><th>Title</th><th>Desk</th><th>Company</th><th>ICP</th><th>Where</th></tr></thead>
        <tbody>
        ${withTargets.flatMap(a=>a.people.filter(p=>p.phoneTarget).map(p=>`<tr>
          <td class="cb-n">${p.targetNo}</td>
          <td class="cb-nm">${esc(p.name)}</td>
          <td>${esc(p.title)}</td>
          <td><span class="pill">${esc(p.bucket)}</span></td>
          <td>${site(a.company, a.website)}</td>
          <td><span class="pill cb-icp">${esc(a.icp)}</span></td>
          <td class="cb-loc">${esc(a.city)}${a.state?", "+esc(a.state):""}${a.roadMi?` · ${esc(a.roadMi)} mi`:""}</td>
        </tr>`)).join("")}
        </tbody>
      </table></div>`;
  }

  /* Sits directly beside the Allo Power Dialer during a session. The dialer shows a bare
     number because the queue is loaded numbers-only (which is what keeps it reversible), so
     this is where the caller reads who is actually ringing. Position matches the queue. */
  function rDialOrder(){
    const d = C.dialOrder || [];
    if (!d.length) return "";
    return `
      <h2 class="sec"><span class="num">04</span>Dial order — ${num(d.length)} loaded in Allo</h2>
      <p class="lead">Queue <b>${esc(C.queueName)}</b>, do-not-disturb enabled, nothing dialled.
      The Power Dialer shows only the number, because loading it numbers-only is what keeps the
      load reversible — attaching company names would make Allo create CRM records it has no
      DELETE for. <b>Position here matches position there.</b></p>
      ${(C.notDialable||[]).length ? `<div class="note"><b>${C.notDialable.length} held back as not US-dialable.</b>
        ${C.notDialable.map(n=>esc(n.name)+" ("+esc(n.company)+") "+esc(n.number)).join("; ")} — a real number for a real
        person, and not one to dial from a Louisiana line.</div>` : ""}
      <div class="tbl-wrap"><table class="cb-tbl">
        <thead><tr><th>#</th><th>Number</th><th>Name</th><th>Title</th><th>Desk</th><th>Company</th><th>Open with</th></tr></thead>
        <tbody>${d.map(r=>`<tr>
          <td class="cb-n">${r.position}</td>
          <td class="cb-tel-cell">${esc(r.number)}${r.numberType!=="mobile"?`<span class="cb-flag">${esc(r.numberType)}</span>`:""}</td>
          <td class="cb-nm">${esc(r.name)}</td>
          <td>${esc(r.title)}</td>
          <td><span class="pill">${esc(r.desk)}</span></td>
          <td>${site(r.company, r.website)}</td>
          <td>${r.angle && r.angle!=="DIRECT" ? `<span class="cb-angle-tag cb-angle-${esc(r.angle)}">${esc(r.angle)}</span>` : `<span class="cb-dash">standard</span>`}</td>
        </tr>`).join("")}</tbody>
      </table></div>`;
  }

  function rAccounts(){
    const call = C.accounts.filter(a=>a.group==="CALL FIRST");
    return `
      <h2 class="sec"><span class="num">05</span>Call first — ${num(call.length)} accounts</h2>
      <p class="lead">Inside 500 road miles of White Castle. Ranked on ICP fit for crumble,
      freight, roster score, how many different desks we can reach, and whether a name on the
      account can say yes without asking anyone. Company names link out to their site.</p>
      ${call.map(a=>`<div class="card cb-acct">
        <div class="cb-acct-h">
          <span class="cb-rank">#${a.rank}</span>
          <div class="cb-acct-id">
            <h4>${site(a.company, a.website)}</h4>
            <div class="cb-loc">
              <span class="pill cb-icp">${esc(a.icp)}</span>
              <span>${esc(a.city)}${a.state?", "+esc(a.state):""}</span>
              <span>${a.roadMi?esc(a.roadMi)+" road mi":"distance unknown"}</span>
              <span>fit ${esc(a.fit)}</span>
              ${a.angle && a.angle!=="DIRECT"?`<span class="cb-angle-tag cb-angle-${esc(a.angle)}">${esc(a.angle)}</span>`:""}
              ${a.targets?`<span class="cb-tgt">${a.targets} phone target${a.targets>1?"s":""}</span>`:""}
            </div>
          </div>
          <div class="cb-tel">${a.phone?`<a href="tel:${esc(String(a.phone).replace(/[^0-9+]/g,""))}">${esc(a.phone)}</a>`:`<span class="cb-none">no number</span>`}
            ${a.note?`<em>${esc(a.note)}</em>`:""}</div>
        </div>
        <p class="cb-why">${esc(a.why)}</p>
        ${angleBand(a)}
        ${a.trigger?`<p class="cb-trig"><b>Open with</b> ${esc(a.trigger)}</p>`:""}
        <div class="tbl-wrap"><table class="cb-tbl">
          <thead><tr><th>Seat</th><th>Name</th><th>Title</th><th>Desk</th><th>Email</th><th>Emailed</th><th>Phone target</th></tr></thead>
          <tbody>${a.people.map(p=>`<tr>
            <td class="cb-n">${p.seat}</td>
            <td class="cb-nm">${esc(p.name)}</td>
            <td>${esc(p.title)}</td>
            <td><span class="pill">${esc(p.bucket)}</span></td>
            <td class="cb-em">${esc(p.email)}${p.emailNote?`<span class="cb-flag">${esc(p.emailNote)}</span>`:""}</td>
            <td class="${p.emailed==="no"?"cb-cold":"cb-warm"}">${p.emailed==="no"?"never":esc(p.emailed)}</td>
            <td>${p.phoneTarget?`<span class="badge badge-green">#${p.targetNo}</span>`:`<span class="cb-dash">—</span>`}</td>
          </tr>`).join("")}</tbody>
        </table></div>
      </div>`).join("")}`;
  }

  function sectionInner(){
    const s = C.stats;
    return `
      <h1 class="page-h">Crumble Blitz</h1>
      <p class="page-sub">Six truckloads of Absorbent Crumble to move. Every absorbent contact
      already paid for, re-ranked for crumble specifically, with every door we own at each
      account. Snapshot ${esc(C.built)} — regenerate with
      <code>sales-department/crumble-blitz/build-salesos-section.mjs</code>.</p>

      <h2 class="sec"><span class="num">01</span>Where this stands</h2>
      <div class="grid g4">
        ${kpi("Call first", num(s.callFirst), "accounts inside 500 mi")}
        ${kpi("Contacts", num(s.contacts), num(s.numbersResolved)+" main lines resolved")}
        ${kpi("Never emailed", num(s.neverEmailed), "of "+num(s.contacts)+" seated")}
        ${kpi("Phone targets", num(s.phoneTargets), "all verified, ~"+num(s.creditsIfBought)+" credits")}
      </div>
      <div class="note"><b>Nothing here cost a credit.</b> All of it was revealed under the
      Apollo ceiling that is already spent. ${num(s.neverEmailed)} of the ${num(s.contacts)}
      seated contacts have never been emailed once — the pool was bought and then only partly
      worked. Crumble is the coarse form for oil and for large-area, high-volume spills, so this
      ranking leads with oil field service work and with the two channels that take a truckload
      on a single purchase order.</div>
      ${rGates()}
      ${rTargets()}
      ${rDialOrder()}
      ${rAccounts()}`;
  }

  function rCrumble(){ return `<section class="section" id="sec-crumble">${sectionInner()}</section>`; }

  /* Live counts for the Launchpad, computed rather than stated so a stale number cannot
     survive a regenerate. */
  function stats(){
    return {
      accounts: C.accounts.length,
      callFirst: C.stats.callFirst,
      contacts: C.stats.contacts,
      phoneTargets: C.stats.phoneTargets,
      creditsIfBought: C.stats.creditsIfBought,
      built: C.built,
    };
  }

  window.CRUMBLE_UI = { rCrumble, stats };
})();
