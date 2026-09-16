/* Cold Email section: the eight variants, edited, previewed as a plain inbox message, and
 * saved to the shared store under kind "coldemail". Built on copy-editor.js.
 *
 * A cold email is plain text. There is no template, no logo, no button: Instantly sends
 * exactly the words, so the preview is a mock of the message as it lands in Gmail. What is
 * shown is subject, greeting, one or two sentences, the ask, and the three line signature.
 *
 * Canonical is the word that matters here. A variant Victor marks canonical is the one that
 * gets pasted into Instantly; "Copy for Instantly" puts the subject and body on the
 * clipboard with the merge tags Instantly expects ({{firstName}}, camelCase, with a fallback
 * so a blank first name never ships "Hi ,"). NOTHING HERE SENDS. */
(function(){
  const CE = () => window.COPY_EDITOR;
  const SPEC = () => window.COLDEMAIL_SPEC || { lines:[], previewTokens:{}, statuses:[] };
  const esc = s => CE().esc(s);

  let TAB = "all";
  const store = CE().makeStore("coldemail", rerender);

  const FIELDS = [
    ["subject","Subject line","input"],
    ["greeting","Greeting","input"],
    ["body","The one or two sentences","textarea"],
    ["ask","The ask","input"],
    ["signoff","Signature (three lines, nothing else)","textarea"],
  ];

  function allVariants(){ return SPEC().lines.flatMap(l=>l.variants.map(v=>({ ...v, lineName:l.name }))); }
  function findVariant(id){ return allVariants().find(v=>v.id===id); }
  function effective(v){ return CE().effective(v.copy, (store.records[v.id]||{}).copy||{}); }

  /* The message as sent: greeting, body, ask, signature, with tokens filled for the preview
     or left as merge tags for the clipboard. */
  function compose(v, fill){
    const c = effective(v);
    const f = fill ? (s)=>CE().fillTokens(s, SPEC().previewTokens) : (s)=>s;
    const greeting = fill ? f(c.greeting) : String(c.greeting||"").replace(/\{\{\s*firstName\s*\}\}/g, "{{firstName | there}}");
    const parts = [greeting, f(c.body), f(c.ask), f(c.signoff)].map(s=>String(s||"").trim()).filter(Boolean);
    return { subject: f(c.subject), text: parts.join("\n\n") };
  }

  function inboxMock(v){
    const m = compose(v, true); const s = SPEC();
    const words = m.text.replace(/\n+/g," ").split(/\s+/).filter(Boolean).length;
    return `<div class="ce-inbox">
      <div class="ce-subj">${esc(m.subject)||"<i>no subject</i>"}</div>
      <div class="ce-meta"><span class="ce-avatar">${esc((s.fromName||"V")[0])}</span>
        <div><b>${esc(s.fromName)}</b> <span class="ce-addr">&lt;${esc(s.fromAddress)}&gt;</span><br><span class="ce-addr">to ${esc(s.previewTo)}</span></div></div>
      <pre class="ce-body">${esc(m.text)}</pre>
      <div class="ce-count">${words} words${words>90?" · long for a first touch, aim under 90":""}</div>
    </div>`;
  }

  function card(v){
    const rec = store.records[v.id]||{}; const saved = rec.copy||{};
    const st = rec.status||"draft";
    const can = CE().canApprove();
    return `<div class="card nur-card" id="ce-${esc(v.id)}">
      <div class="nur-head">
        <div><span class="nur-id">${esc(v.id)}</span> <b>${esc(v.title)}</b> <span class="nur-day">${esc(v.lineName)} · ${esc(v.icp)}</span> ${CE().statusPill(st)}${store.dirty[v.id]?' <span class="nur-status warn">unsaved</span>':""}</div>
        <div class="nur-actions">
          <button class="btn btn-primary" type="button" onclick="COLDEMAIL_UI.save('${esc(v.id)}')">Save</button>
          ${st==="draft"?`<button class="btn btn-ghost" type="button" onclick="COLDEMAIL_UI.setStatus('${esc(v.id)}','ready')">Mark ready for Victor</button>`:""}
          ${can&&st!=="canonical"?`<button class="btn btn-accent" type="button" onclick="COLDEMAIL_UI.setStatus('${esc(v.id)}','canonical')">Make canonical</button>`:""}
          ${st==="canonical"?`<button class="btn btn-ghost" type="button" onclick="COLDEMAIL_UI.setStatus('${esc(v.id)}','draft')">Reopen</button>`:""}
          <button class="btn btn-ghost" type="button" onclick="COLDEMAIL_UI.copyOut('${esc(v.id)}')">Copy for Instantly</button>
          <button class="btn btn-ghost" type="button" onclick="COLDEMAIL_UI.reset('${esc(v.id)}')">Clear my copy</button>
        </div>
      </div>
      <p class="nur-intent">${esc(v.intent)}</p>
      <div class="nur-grid">
        <div class="nur-form">
          ${FIELDS.map(([k,l,kind])=>CE().fieldRow("COLDEMAIL_UI", v.id, k, l, kind, v.copy[k], saved[k])).join("")}
          <div class="nur-msg">${store.lastMsg(v.id)}</div>
        </div>
        <div class="nur-preview">${inboxMock(v)}</div>
      </div>
    </div>`;
  }

  function inner(){
    const spec = SPEC();
    const tabs = [["all","All variants"], ...spec.lines.map(l=>[l.id, l.name])];
    const list = TAB==="all" ? allVariants() : allVariants().filter(v=>v.line===TAB);
    const canon = allVariants().filter(v=>(store.records[v.id]||{}).status==="canonical").length;
    return `<h1 class="page-h">Cold Email</h1>
      <p class="page-sub">Eight variants, four absorbent and four biochar. One or two sentences and one ask, nothing deeper. Every box has a draft in it, greyed; type over it or leave it. The right side is the message as it lands in an inbox. Save shares it. Victor marks a variant canonical, and canonical is what goes into Instantly. Nothing on this page sends. ${store.badge()} <span class="nur-status">${canon} of ${allVariants().length} canonical</span></p>
      <div class="pipe-tabs" style="margin-bottom:18px">${tabs.map(([id,l])=>`<span class="pill${id===TAB?" active":""}" onclick="COLDEMAIL_UI.tab('${esc(id)}')">${esc(l)}</span>`).join("")}</div>
      ${list.map(card).join("")}`;
  }
  function rColdEmail(){ if(!store.loaded && !store.loading){ store.loading=true; setTimeout(store.load,0); } return `<section class="section" id="sec-coldemail">${inner()}</section>`; }
  function rerender(){ const el=document.getElementById("sec-coldemail"); if(el) el.innerHTML=inner(); }

  let typeTimer=null;
  function onType(el){
    const id=el.dataset.nur; store.dirty[id]=true; CE().flipTag(el);
    clearTimeout(typeTimer);
    typeTimer=setTimeout(()=>{
      const v=findVariant(id); if(!v) return;
      const prev=store.records[id]; store.records[id]={ ...(prev||{}), copy:CE().readForm(id) };
      const html=inboxMock(v);
      store.records[id]=prev||store.records[id];
      const card=document.getElementById("ce-"+id); const pv=card&&card.querySelector(".nur-preview"); if(pv) pv.innerHTML=html;
    },200);
  }

  window.COLDEMAIL_UI = {
    rColdEmail,
    tab(id){ TAB=id; rerender(); },
    onType,
    save(id){ store.save(id, { copy:CE().readForm(id) }); },
    setStatus(id, status){
      if(status==="canonical" && !CE().canApprove()){ alert("Only Victor (admin) can mark a variant canonical."); return; }
      store.save(id, { copy:CE().readForm(id), status });
    },
    reset(id){ if(!confirm("Clear your copy for this variant and go back to the placeholder draft?")) return; store.save(id, { copy:{}, status:"draft" }); },
    async copyOut(id){
      const v=findVariant(id); if(!v) return;
      const m=compose(v,false);
      const text=`Subject: ${m.subject}\n\n${m.text}`;
      try{ await navigator.clipboard.writeText(text); store.msg[id]="Copied for Instantly: subject and body with {{firstName | there}}."; }
      catch(e){ store.msg[id]="Clipboard blocked by the browser. Select the preview and copy it by hand."; }
      rerender();
    },
    _internals:{ compose, effective, allVariants, findVariant, store },
  };
})();
