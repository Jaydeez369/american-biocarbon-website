/* ============================================================
   VEJ Sales OS - Operations renderers
   ------------------------------------------------------------
   Four sections, all reading ops-data.js (window.OPS):

     rSampleToCash  "Sample to Cash". What happens after a reply,
                    through to collected cash. Owner and clock on
                    every step.
     rTeam          "Team & Rhythm". Roles, ramp gates, activity
                    minimums, scorecard, meeting cadence, routing.
     rRecords       "System of Record". Which file owns which
                    truth, where a rep is allowed to write, and
                    how the roster gets rebuilt.
     rRunbook       "Continuity Runbook". Systems, recurring jobs,
                    what breaks if untouched, and the open asks.

   Reuses the design system helpers from app.js (page, head, sec,
   table, esc) and loads before app.js, exposing window.OPS_UI.
   Same pattern as engine.js, outreach.js and pipeline.js.

   Every string is read from ops-data.js. Nothing is typed here.

   FORMATTING RULE: no hyphens, em dashes or en dashes in any
   visible string. Middots and commas do the separating work.
   ============================================================ */
(function(){
  if (typeof OPS === "undefined") { console.warn("OPS data missing"); return; }

  const E = s => esc(s);
  const ul = a => `<ul>${a.map(x=>`<li>${E(x)}</li>`).join("")}</ul>`;
  /* One shared marker for anything nobody has confirmed yet. It reads the literal string
     so a value only shows as open when the data says open, never by inference. */
  const isOpen = v => /^OPEN/.test(String(v||""));
  const val = v => isOpen(v) ? `<span class="badge badge-red">${E(v)}</span>` : E(v);

  /* ---------------------------- SAMPLE TO CASH ---------------------------- */
  function rSampleToCash(){
    const D = OPS.s2c;
    return page("s2c",
      head("Sample to Cash","The motion that starts where the campaign ends")+
      `<div class="note info">${E(D.intro)}</div>`+

      sec("1","The nine steps")+
      D.stages.map(s=>`
        <div class="card">
          <h4><span class="num">${E(s.n)}</span> ${E(s.t)}</h4>
          <div class="grid g2" style="margin-top:8px">
            <div>
              <p style="font-size:12.8px;color:var(--text-dim);margin:0 0 8px">${E(s.does)}</p>
              <p style="font-size:12.4px;margin:0"><b>Exit criteria</b><br>${E(s.exit)}</p>
            </div>
            <div>
              <p style="font-size:12.4px;margin:0 0 6px"><b>Owner</b><br>${val(s.owner)}</p>
              <p style="font-size:12.4px;margin:0 0 6px"><b>Clock</b><br>${E(s.clock)}</p>
              <p style="font-size:12.4px;margin:0"><b>Logged in</b><br>${E(s.log)}</p>
            </div>
          </div>
        </div>`).join("")+

      sec("2","The sample kit")+
      `<div class="note">${E(D.kit.intro)}</div>`+
      `<div class="grid g2">
        <div class="card"><h4>Every kit contains</h4>${ul(D.kit.contents)}</div>
        <div class="card"><h4>Rules that do not bend</h4>${ul(D.kit.rules)}</div>
      </div>`+

      sec("3","Intake, what fulfillment needs before it can pack")+
      `<div class="card">${ul(D.intake)}</div>`+

      sec("4","What is missing")+
      `<div class="note warn"><b>These do not exist yet.</b> Each one blocks a step above. Naming them is the point of this section.</div>`+
      table(["Gap","Why it blocks","Owner"],
        D.gaps.map(g=>[`<b>${E(g.t)}</b>`, E(g.d), val(g.who||"OPEN")]))
    );
  }

  /* ------------------------------ TEAM & RHYTHM ------------------------------ */
  function rTeam(){
    const D = OPS.team;
    return page("team",
      head("Team & Rhythm","Who owns what, how they ramp, what they are measured on")+
      `<div class="note info">${E(D.intro)}</div>`+

      sec("1","Roles")+
      table(["Role","Owns","Who today"],
        D.roles.map(r=>[`<b>${E(r.r)}</b>`, E(r.owns), val(r.now)]))+

      sec("2","Ramp, four gates")+
      `<div class="note">A rep does not touch a live account until the week 2 gate is signed off. A bad claim is not recoverable.</div>`+
      D.ramp.map(r=>`
        <div class="card">
          <h4>${E(r.wk)} &middot; ${E(r.t)}</h4>
          <p style="font-size:12.8px;color:var(--text-dim);margin:6px 0">${E(r.does)}</p>
          <p style="font-size:12.4px;margin:0"><b>Gate to pass</b><br>${E(r.gate)}</p>
        </div>`).join("")+

      sec("3","Daily minimums, per rep")+
      `<div class="note">Floors, not targets. These apply from the first day of week 4.</div>`+
      table(["Metric","Floor"], D.minimums.map(m=>[E(m.m), `<span class="t-num">${E(m.v)}</span>`]))+

      sec("4","Scorecard")+
      `<div class="note">${E(D.scorecard.intro)}</div>`+
      `<div class="grid g2">
        <div class="card"><h4>Leading, review weekly</h4>${ul(D.scorecard.leading)}</div>
        <div class="card"><h4>Lagging, review monthly</h4>${ul(D.scorecard.lagging)}</div>
      </div>`+
      `<div class="card"><h4>Conversion ratios</h4>${ul(D.scorecard.ratios)}</div>`+

      sec("5","Meeting rhythm")+
      D.rhythm.map(r=>`
        <div class="card">
          <h4>${E(r.t)} <span class="badge badge-muted">${E(r.when)}</span></h4>
          <p style="font-size:12.8px;color:var(--text-dim);margin:6px 0 0">${E(r.agenda)}</p>
        </div>`).join("")+

      sec("6","Lead routing and ownership")+
      `<div class="card">${ul(D.routing)}</div>`+

      sec("7","Quality check on every outbound")+
      `<div class="note">${E(D.qa.intro)}</div>`+
      `<div class="card">${ul(D.qa.items)}</div>`
    );
  }

  /* ---------------------------- SYSTEM OF RECORD ---------------------------- */
  function rRecords(){
    const D = OPS.records;
    return page("records",
      head("System of Record","One place is true. Everything else feeds it")+
      `<div class="note ok"><b>The decision.</b> ${E(D.decision)}</div>`+

      sec("1","Which file owns which truth")+
      table(["Layer","File","What it is","How it behaves"],
        D.layers.map(l=>[`<b>${E(l.l)}</b>`, `<code>${E(l.f)}</code>`, E(l.what), E(l.mode)]))+

      sec("2","The write path")+
      D.writePath.map(w=>`
        <div class="card">
          <h4>${E(w.t)}</h4>
          <p style="font-size:12.8px;color:var(--text-dim);margin:6px 0 0">${E(w.d)}</p>
        </div>`).join("")+

      sec("3","Required fields per stage")+
      `<div class="note">${E(D.required.intro)}</div>`+
      table(["Stage move","Must be on the record before it advances"],
        D.required.rows.map(r=>[`<b>${E(r.s)}</b>`, E(r.need)]))+

      sec("4","Hygiene rules")+
      `<div class="card">${ul(D.hygiene)}</div>`+

      sec("5","How the roster gets rebuilt")+
      `<div class="note warn"><b>${E(D.regen.intro)}</b></div>`+
      `<div class="card"><ol style="padding-left:18px;color:var(--text-dim);font-size:12.8px">${
        D.regen.steps.map(s=>`<li style="padding:3px 0">${E(s)}</li>`).join("")
      }</ol></div>`+

      sec("6","What is actually in there")+
      `<div class="note">${E(D.counts.intro)}</div>`+
      table(["","Count"], D.counts.rows.map(r=>[E(r.k), `<span class="t-num">${E(r.v)}</span>`]))+
      `<div class="note warn"><b>${E(D.counts.note)}</b></div>`
    );
  }

  /* ---------------------------- CONTINUITY RUNBOOK ---------------------------- */
  function rRunbook(){
    const D = OPS.runbook;
    return page("runbook",
      head("Continuity Runbook","What keeps running when the builder is gone")+
      `<div class="note info">${E(D.intro)}</div>`+

      sec("1","Systems")+
      `<div class="note warn"><b>Red cells are unanswered.</b> Owner, cost and renewal were not guessed. Somebody has to fill them in, and the list of who is at the bottom of this page.</div>`+
      table(["System","What it does","Owner","Cost","What breaks"],
        D.systems.map(s=>[`<b>${E(s.s)}</b>`, E(s.use), val(s.owner), val(s.cost), E(s.risk)]))+

      sec("2","Recurring jobs")+
      table(["Cadence","Job"], D.jobs.map(j=>[`<span class="badge badge-muted">${E(j.f)}</span>`, E(j.j)]))+

      sec("3","What breaks if nobody touches this for 30 days")+
      `<div class="card">${ul(D.breaks)}</div>`+

      sec("4","What I need from you")+
      D.needs.map(n=>`
        <div class="card">
          <h4>${E(n.t)} ${n.who?`<span class="badge badge-gold">${E(n.who)}</span>`:""}</h4>
          <p style="font-size:12.8px;color:var(--text-dim);margin:6px 0 0">${E(n.d)}</p>
        </div>`).join("")
    );
  }

  window.OPS_UI = { rSampleToCash, rTeam, rRecords, rRunbook };
})();
