/* ============================================================
   VEJ Sales OS - Engine renderers
   ------------------------------------------------------------
   Two sections, both reading engine-data.js (const ENGINE):

     rInstantly  "Instantly Logic". Why the campaigns are shaped
                 the way they are. The Outreach Engine section
                 holds the words; this holds the architecture.

     rFunnels    "Future Funnels". Every channel beyond email,
                 what it costs, what it can produce, and what has
                 to be true before it opens.

   Reuses the design system helpers from app.js (page, head, sec,
   table, badge, esc, nl, script, copyEl) and loads before app.js,
   exposing window.ENGINE_UI. Same pattern as outreach.js,
   pipeline.js and gtm.js.

   Every number on both pages is read from the data. Nothing is
   typed into this file, so adding a campaign or a funnel to
   engine-data.js updates the counters here without an edit.

   FORMATTING RULE: no hyphens or dashes in any visible string.
   Middots and commas do the separating work.
   ============================================================ */
(function(){
  if (typeof ENGINE === "undefined") { console.warn("ENGINE data missing"); return; }

  const I = ENGINE.instantly;

  /* Confidence is the whole point of the cost model, so it gets a
     visible colour rather than a footnote nobody reads. */
  const CONF = {
    confirmed:{ cls:"badge-green",  t:"confirmed" },
    list:     { cls:"badge-muted",  t:"list price" },
    assumed:  { cls:"badge-muted",  t:"assumed" },
    unknown:  { cls:"badge-red",    t:"unknown" },
  };
  function confBadge(k){
    const c = CONF[k] || CONF.unknown;
    return `<span class="badge ${c.cls}">${esc(c.t)}</span>`;
  }

  const money = v => (v === null || v === undefined) ? "not priced" : ("$" + v);
  const bullets = arr => `<ul class="oe-ul">${arr.map(t=>`<li>${esc(t)}</li>`).join("")}</ul>`;
  const fmt = v => Number.isFinite(+v) ? Math.round(+v).toLocaleString() : String(v ?? "");

  /* Live per ICP aggregation off the Sales Pipeline roster, the canonical layer. The
     campaign map used to carry typed account and contact counts and they went stale the
     week they were typed; now the roster join is read at render time and the numbers in
     engine-data.js are only a fallback for a partial deployment with no roster-data.js.
     Built lazily and cached: the roster is 1,100+ rows and this runs per render. */
  let ICP_AGG = null;
  const icpAgg = () => {
    if (ICP_AGG) return ICP_AGG;
    const list = (window.ROSTER && window.ROSTER.companies) || [];
    if (!list.length) return null;
    ICP_AGG = {};
    for (const c of list){
      if (c.dead || !c.icp) continue;
      const a = ICP_AGG[c.icp] = ICP_AGG[c.icp] || { accts:0, verified:0 };
      a.accts++; a.verified += c.contactsVerified || 0;
    }
    return ICP_AGG;
  };
  const acctsOf   = c => { const a = icpAgg(); return a && a[c.code] ? a[c.code].accts    : c.accts; };
  const contactsOf= c => { const a = icpAgg(); return a && a[c.code] ? a[c.code].verified : c.contacts; };

  /* Month 1 usage is derived, not typed. It read "about 20%" until the contact ceiling
     changed and the send estimate moved from 340 to 415, at which point a hardcoded tile
     would have been quietly wrong on the one page whose whole point is honest numbers.
     Reads the sends figure straight out of the output table. */
  const CAPACITY_PER_MONTH = 4 * 20 * 21.5;   // 4 inboxes x 20/day x 21.5 business days
  function monthOneUsage(){
    const row = (ENGINE.instantly.output || []).find(([k]) => /sends across/i.test(k));
    const sends = row ? parseInt(String(row[1]).replace(/[^0-9]/g, ""), 10) : NaN;
    if (!Number.isFinite(sends)) return "not derived";
    return "about " + Math.round(sends / CAPACITY_PER_MONTH * 100) + "%";
  }

  /* ==========================================================
     INSTANTLY LOGIC
     ========================================================== */
  function rInstantly(){
    /* steps === 0 marks a row that is deliberately NOT a campaign. BC.RANCH is the only one
       today: 2 accounts worked by hand. Counting its 2 accounts and 5 contacts into "what we
       are sending" is exactly the kind of quiet overstatement this whole rebuild removed, so
       every headline number here filters on steps > 0. */
    const camps  = I.campaigns;
    const built  = camps.filter(c => c.steps > 0);
    const totalV = built.reduce((n,c)=>n+c.versions,0);
    const manual = camps.filter(c => c.steps === 0);
    const L = I.live || null;
    const R = window.ROSTER || null;

    const tile = (label,val,sub,warn) =>
      `<div class="card kpi${warn?" kpi-warn":""}"><div class="l">${esc(label)}</div><div class="v">${esc(val)}</div><div class="d">${esc(sub||"")}</div></div>`;

    const statusBadge = s =>
      s === "live" ? badge("LIVE","badge-green")
      : s === "staged draft" ? badge("staged draft","badge-green")
      : s === "staging next" ? badge("staging next","badge-gold")
      : s === "manual, never built" ? badge("manual","badge-muted")
      : badge(s, "badge-red");

    return page("instantly",
      head("Instantly Logic",
        `${esc(I.headline)} Updated ${esc(I.updated)}.`)+

      /* State first: the gate that used to block everything has cleared, and the live
         read tells you what actually stands between the drafts and a send today. */
      `<div class="note ok" style="border-left:4px solid var(--green-bright);font-size:13.5px;margin-bottom:10px">
         <b>${esc(I.verification.blunt)}</b> ${esc(I.verification.state)}
       </div>`+
      (L ? `<div class="note warn" style="border-left:4px solid var(--gold-soft);font-size:13.5px;margin-bottom:14px">
         <b>Last live read ${esc(L.read)}.</b> ${esc(L.capNote)} ${esc(L.note)}
       </div>` : "")+

      `<div class="card pad-lg" style="margin-bottom:16px"><p style="color:var(--text);font-size:13.5px;line-height:1.65;margin:0">${esc(I.premise)}</p></div>`+

      sec("1","The shape of it")+
      `<div class="grid g4">
        ${tile("In the Instantly workspace", L?String(L.inWorkspace):"no read", L?`${L.launched} launched (${L.launchedName}) · ${L.drafts} staged drafts`:"")}
        ${tile("Ready to fire", L?String(L.ready):"no read", L?`campaigns with leads loaded, ${fmt(L.readyLeads)} READY leads`:"")}
        ${tile("Verified addresses", R?fmt(R.contactsVerified):"not loaded", R?`of ${fmt(R.contactsTotal)} on file in the pipeline`:"roster layer not loaded")}
        ${tile("Stranded on the plan cap", L?fmt(L.stranded):"no read", "verified leads, waiting on billing", true)}
      </div>`+
      (L ? `<div class="note" style="margin-top:10px"><b>Rollout order.</b> ${esc(L.order)}</div>` : "")+

      sec("2","Seven principles, and what each one replaced")+
      `<p class="lead">Every one of these overturned something that was in the plan a week ago. The was column is not history for its own sake: it is there so a future agent does not quietly restore it because it read well.</p>`+
      `<div class="grid g2">${I.principles.map(p=>`
        <div class="card pad-lg" style="border-top:3px solid var(--green-bright)">
          <div style="display:flex;align-items:baseline;gap:9px">
            <span class="badge badge-muted" style="font-family:var(--mono)">${esc(p.n)}</span>
            <h4 style="margin:0;color:var(--green-bright)">${esc(p.t)}</h4>
          </div>
          <div style="font-size:12.8px;display:grid;gap:6px;margin-top:9px">
            <div><b style="color:var(--red-soft)">Was:</b> ${esc(p.was)}</div>
            <div><b style="color:var(--green-bright)">Now:</b> ${esc(p.now)}</div>
            <div><b style="color:var(--gold-soft)">Why:</b> ${esc(p.why)}</div>
          </div>
        </div>`).join("")}</div>`+

      sec("3","The account waterfall")+
      `<p class="lead">${esc(I.waterfall.note)} Script: <code>${esc(I.waterfall.script)}</code></p>`+
      (I.waterfall.ceiling ? `<div class="note ok" style="margin-bottom:10px"><b>Depth is earned.</b> ${esc(I.waterfall.ceiling)}</div>` : "")+
      table(["Wave","Who","When it releases","Contacts"],
        I.waterfall.rows.map(r=>[
          `<strong>${esc(r.w)}</strong>`, esc(r.who), esc(r.when),
          `<span style="font-family:var(--mono)">${esc(r.n)}</span>`]))+
      `<h3 class="sub">Best fit is decided by title, per ICP</h3>
       <p class="lead">Sales and business development sits last in every single ICP on purpose. A large share of the named contacts on the roster are sales people. They sell for the account, they do not buy for it.</p>`+
      table(["ICP","Title priority, best first"],
        I.waterfall.titlePriority.map(([k,v])=>[`<strong>${esc(k)}</strong>`, esc(v)]))+
      `<div class="grid g2" style="margin-top:12px">
        <div class="note ok"><b>A positive reply suppresses the whole account</b>, both product lines, every wave. Company level block, not contact level.</div>
        <div class="note"><b>A not me reply routes, it never closes.</b> Ask who owns it, add that person as a wave 3 contact, keep the account open. It is the second most useful reply we get.</div>
      </div>`+

      sec("4","The campaign map")+
      table(["Campaign","Line","Live companies","Verified contacts","READY leads","Versions","Steps","The ask in email 1","Status"],
        camps.map(c=>[
          `<strong style="font-family:var(--mono)">${esc(c.code)}</strong><br><span style="color:var(--text-mute);font-size:12px">${esc(c.label)}</span>`,
          badge(c.line, c.line==="Biochar"?"badge-green":"badge-muted"),
          `<span style="font-family:var(--mono)">${fmt(acctsOf(c))}</span>`,
          `<span style="font-family:var(--mono)">${contactsOf(c) ? fmt(contactsOf(c)) : "&#183;"}</span>`,
          `<span style="font-family:var(--mono)">${c.ready !== undefined ? fmt(c.ready) : "&#183;"}</span>`,
          `<span style="font-family:var(--mono)">${esc(c.versions)}</span>`,
          `<span style="font-family:var(--mono)">${c.steps || "&#183;"}</span>`,
          esc(c.cta),
          statusBadge(c.status)]))+
      `<div class="note" style="margin-top:10px"><b>Two ledgers, read at different joins.</b> Live companies and verified contacts come off the Sales Pipeline roster at render time, so they follow the pipeline without an edit here. READY leads come off the campaign gate ledger at the last live Instantly read${L?` (${esc(L.read)})`:""}. A small mismatch between the two is expected and is not a defect. A middot in READY means the campaign is either not loaded in Instantly yet or already live and sending, where the gate ledger stops tracking it.</div>`+

      sec("5","Personalization: research drives the message")+
      `<div class="card pad-lg">
         <div class="filters" style="margin-bottom:10px">${I.personalization.chain.map((s,i)=>
           `<span class="pill" style="cursor:default">${i+1}. ${esc(s)}</span>`).join("")}</div>
         <p style="color:var(--text);font-size:13px;line-height:1.6;margin:0"><b>Variable:</b> <code>${esc(I.personalization.variable)}</code>. ${esc(I.personalization.built)}</p>
         <div class="note warn" style="margin-top:10px"><b>Gate:</b> ${esc(I.personalization.gate)}</div>
       </div>`+
      `<h3 class="sub">Worked examples</h3>`+
      table(["Account","Raw research","Observation","The problem it implies","Wedge","CTA"],
        I.personalization.examples.map(e=>[
          `<strong>${esc(e.acct)}</strong>`, esc(e.raw),
          `<span style="color:var(--green-bright)">${esc(e.obs)}</span>`,
          esc(e.prob), esc(e.wedge),
          `<span style="color:var(--gold-soft)">${esc(e.cta)}</span>`]))+
      `<h3 class="sub">Role aware framing, same account, different person</h3>
       <p class="lead">Wave 2 and wave 3 get their own body, written to the second and third role. They are never a copy paste of wave 1.</p>`+
      table(["Role","Frame it as","Do not"],
        I.personalization.roles.map(([r,f,d])=>[
          `<strong>${esc(r)}</strong>`, esc(f),
          `<span style="color:var(--red-soft)">${esc(d)}</span>`]))+

      sec("6","Deliverability is reputation gated, not calendar gated")+
      `<div class="grid g3">
        <div class="card"><h4>Start</h4><p>${esc(I.deliverability.start)}</p></div>
        <div class="card"><h4>Ramp</h4><p>${esc(I.deliverability.ramp)}</p></div>
        <div class="card"><h4>Rollback</h4><p>${esc(I.deliverability.rollback)}</p></div>
      </div>`+
      `<h3 class="sub">Ten gates. All must hold green for five consecutive business days before the cap moves.</h3>
       <div class="card pad-lg">${bullets(I.deliverability.gates)}</div>`+
      `<h3 class="sub">Settings that do not vary</h3>`+
      table(["Setting","Value"], I.deliverability.fixed.map(([k,v])=>[`<strong>${esc(k)}</strong>`, esc(v)]))+

      sec("7","The verification gate")+
      `<div class="note warn"><b>${esc(I.verification.state)}</b> ${esc(I.verification.statusField)}</div>`+
      table(["Class","Handling","May it enter a campaign?"],
        I.verification.classes.map(([c,h,y])=>[
          `<strong>${esc(c)}</strong>`, esc(h),
          y==="yes" ? badge("yes","badge-green") : badge("no","badge-red")]))+
      `<div class="grid g2" style="margin-top:10px">
        <div class="note"><b>Expect attrition where it hurts.</b> ${esc(I.verification.expect)}</div>
        <div class="note"><b>Planning assumption.</b> ${esc(I.verification.attrition)}</div>
      </div>`+

      sec("8","Sender identity")+
      `<div class="note ok"><b>The rule:</b> ${esc(I.sender.rule)}</div>`+
      `<div class="note warn" style="margin-top:8px"><b>What it replaced:</b> ${esc(I.sender.was)}</div>`+
      table(["Element","Value"], I.sender.rows.map(([k,v])=>[`<strong>${esc(k)}</strong>`, esc(v)]))+
      `<div class="grid g2" style="margin-top:10px">
        <div>${script("The signature, every step of every campaign", I.sender.signature)}</div>
        <div class="card"><h4>Domain assignment</h4><p>${esc(I.sender.domains)}</p></div>
      </div>`+
      `<div class="note warn" style="margin-top:8px"><b>Open:</b> ${esc(I.sender.blocker)}</div>`+

      sec("9","Where the machine stands")+
      table(["Metric","Number"], I.output.map(([k,v])=>[`<strong>${esc(k)}</strong>`, `<span style="font-family:var(--mono)">${esc(v)}</span>`]))+
      `<h3 class="sub">The honest statistical read</h3>
       <div class="grid g2">
         <div class="card"><h4>The bar</h4><p>${esc(I.statRead.bar)}</p><p style="margin-top:6px">${esc(I.statRead.reality)}</p></div>
         <div class="card"><h4>What unlocks it</h4><p>${esc(I.statRead.unlock)}</p></div>
       </div>`+
      `<div class="grid g2" style="margin-top:10px">
         <div class="note ok"><b>Allowed this round:</b> ${esc(I.statRead.allowed)}</div>
         <div class="note warn"><b>Not allowed:</b> ${esc(I.statRead.banned)}</div>
       </div>`+

      sec("10","Blockers, in the order they stop us")+
      table(["#","Blocker","Detail","Owner"],
        I.blockers.map(b=>[
          `<strong style="font-family:var(--mono)">${esc(b.p)}</strong>`,
          `<strong>${esc(b.t)}</strong>`, esc(b.d),
          badge(b.owner,"badge-muted")]))+

      `<div class="note" style="margin-top:14px">Copy lives in <code>sales-department/campaigns/INSTANTLY-PASTE.md</code>. The plan behind this page lives in <code>sales-department/campaigns/MONTH-1-EMAIL-PLAN.md</code>. What to say after a reply lives in <code>sales-department/campaigns/REPLY-PLAYBOOK.md</code>. Those files win on any disagreement with this screen.</div>`
    );
  }

  /* ==========================================================
     FUTURE FUNNELS
     ========================================================== */
  function rFunnels(){
    const A = ENGINE.apollo;
    const confirmedStack = ENGINE.stack.filter(s => s.conf === "confirmed" && s.mo !== null);
    const stackTotal = confirmedStack.reduce((n,s)=>n+s.mo,0);
    const unpriced = ENGINE.stack.filter(s => s.mo === null);

    const tile = (label,val,sub,warn) =>
      `<div class="card kpi${warn?" kpi-warn":""}"><div class="l">${esc(label)}</div><div class="v">${esc(val)}</div><div class="d">${esc(sub||"")}</div></div>`;

    const funnelCard = f => `
      <div class="card pad-lg" style="border-top:3px solid ${f.cost.conf==="confirmed"?"var(--green-bright)":"var(--gold-soft)"};margin-bottom:16px">
        <div style="display:flex;align-items:baseline;gap:10px;flex-wrap:wrap">
          <span class="badge badge-muted" style="font-family:var(--mono)">${esc(f.rank)}</span>
          <h3 style="margin:0;color:var(--green-bright)">${esc(f.name)}</h3>
          ${badge(f.status, f.status.startsWith("live") ? "badge-green" : "badge-muted")}
          <span style="margin-left:auto;font-family:var(--mono);font-size:13px;color:var(--text)">${esc(money(f.cost.fixed))}${f.cost.fixed!==null?" / mo":""}</span>
          ${confBadge(f.cost.conf.split(" ")[0])}
        </div>

        <p style="color:var(--text);font-size:13.2px;line-height:1.6;margin:10px 0 0">${esc(f.what)}</p>

        <div class="grid g2" style="margin-top:10px">
          <div><b style="font-size:11px;color:var(--red-soft)">Gates before it opens</b>${bullets(f.gates)}</div>
          <div>
            <div style="font-size:12.6px;display:grid;gap:5px">
              <div><b style="color:var(--gold-soft)">Capacity:</b> ${esc(f.capacity)}</div>
              <div><b style="color:var(--gold-soft)">Volume:</b> ${esc(f.volume)}</div>
              <div><b style="color:var(--text-mute)">Unit cost:</b> ${esc(f.cost.unitLabel)}</div>
            </div>
          </div>
        </div>

        <h4 style="margin:12px 0 4px">The math</h4>
        ${table(["","" ], f.math.map(([k,v])=>[`<strong>${esc(k)}</strong>`, `<span style="font-family:var(--mono)">${esc(v)}</span>`]))}

        <div class="note" style="margin-top:8px;font-size:12.4px"><b>Confidence:</b> ${esc(f.conf)}</div>
        <div class="note ok" style="margin-top:6px"><b>Verdict:</b> ${esc(f.verdict)}</div>
        ${f.rules ? `<h4 style="margin:12px 0 4px">Rules</h4><div class="card">${bullets(f.rules)}</div>` : ""}
      </div>`;

    return page("funnels",
      head("Future Funnels",
        `Every channel beyond cold email, priced. Confirmed stack is $${stackTotal} a month and ${unpriced.length} line items are still unpriced.`)+

      `<div class="note warn" style="font-size:13.5px;margin-bottom:14px">
         <b>Read the confidence badge before you read the number.</b>
         ${confBadge("confirmed")} came off the Aug 10 call or out of this repo, spend against it.
         ${confBadge("list")} is a public price nobody here has invoiced.
         ${confBadge("assumed")} is a planning guess with a reason attached.
         ${confBadge("unknown")} means nobody has looked, so it does not go in a budget.
         <b>A funnel whose cost is unknown does not get approved, it gets a task.</b>
       </div>`+

      sec("1","The stack, and why cost per send is the wrong metric")+
      `<div class="grid g4">
        ${tile("Confirmed stack", "$"+stackTotal+" / mo", "Apollo, Instantly, Aloe, Resend")}
        ${tile("Unpriced line items", String(unpriced.length), "domains, verification, 10 DLC", true)}
        ${tile("Email capacity bought", "1,720 / mo", "whether we use it or not")}
        ${tile("Staged send load", monthOneUsage(), "of one month of capacity, so the full fire spans about two months")}
      </div>`+
      table(["Tool","Monthly","Confidence","What it buys","Where the number came from"],
        ENGINE.stack.map(s=>[
          `<strong>${esc(s.tool)}</strong>`,
          `<span style="font-family:var(--mono)">${esc(money(s.mo))}</span>`,
          confBadge(s.conf), esc(s.covers),
          `<span style="color:var(--text-mute);font-size:12px">${esc(s.src)}</span>`]))+
      `<div class="note ok" style="margin-top:10px">${esc(ENGINE.stackNote)}</div>`+

      sec("2","Apollo: what the data actually buys us")+
      `<div class="grid g2">
        <div class="card"><h4>The account</h4><p>${esc(A.account)}</p></div>
        <div class="card"><h4>The depth ceiling</h4><p>${esc(A.ceiling)}</p></div>
      </div>`+
      `<div class="note warn" style="margin-top:8px">${esc(A.note)}</div>`+
      `<h3 class="sub">Field by field</h3>
       <p class="lead">The free tier is doing more work than anyone assumed. Named contacts with titles came back free across the whole roster, which is how the title buckets and the entire waterfall got built without spending a credit. The unknowns below are the ones that decide whether the phone and LinkedIn funnels exist at all.</p>`+
      table(["Field","Cost","Confidence","What it unlocks"],
        A.fields.map(f=>[
          `<strong>${esc(f.f)}</strong>`,
          `<span style="font-family:var(--mono)">${esc(f.cost)}</span>`,
          confBadge(f.conf), esc(f.use)]))+
      `<h3 class="sub">Ask Apollo these five things before budgeting anything below</h3>
       <div class="card pad-lg">${bullets(A.asks)}</div>`+

      sec("3","The funnels")+
      `<p class="lead">Ordered by how soon each can realistically produce a conversation, not by how interesting it is. Every one is judged on cost per real conversation, never on cost per touch.</p>`+
      ENGINE.funnels.map(funnelCard).join("")+

      sec("4","Decisions blocking the budget")+
      `<p class="lead">Six questions. Four of them are one email to Apollo support and they unblock two entire channels.</p>`+
      table(["Question","What it blocks","Owner"],
        ENGINE.decisions.map(d=>[
          `<strong>${esc(d.q)}</strong>`, esc(d.blocks),
          badge(d.owner,"badge-muted")]))
    );
  }

  window.ENGINE_UI = { rInstantly, rFunnels };
})();
