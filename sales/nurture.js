/* Nurture Plan section: the editor Victor and Daniel write the sequences in.
 *
 * Three inputs, loaded before this file:
 *   nurture-spec.js      the sequences, cadence and PLACEHOLDER copy (window.NURTURE_SPEC)
 *   email-template.js    the real email renderer, bundled from functions/api/_email.js
 *                        (window.EMAIL_TPL), so the preview IS the email
 *   nurture-data.js      the plan document as markdown (window.NURTURE_MD), for the Plan tab
 *
 * One store: /api/record?kind=nurture, one record per email id ("A1", "B2:biochar"), through
 * the shared core in copy-editor.js (which Cold Email uses too). What a person types wins;
 * an empty box falls back to the placeholder, and the preview shows whichever is in force so
 * nobody approves an email they have not seen.
 *
 * NOTHING HERE SENDS. There is no send path in this file and no send path on the server for
 * these records. Approving an email marks the record approved and that is all it does. */
(function(){
  const CE = () => window.COPY_EDITOR;
  const esc = s => CE().esc(s);
  const SPEC = () => window.NURTURE_SPEC || { sequences:[], previewTokens:{}, statuses:["draft","ready","approved"] };
  const TPL  = () => window.EMAIL_TPL;

  let TAB = "plan";                 // plan | A | B | C
  let VARIANT = {};                 // emailId -> variant name for B
  const store = CE().makeStore("nurture", rerender);
  const canApprove = () => CE().canApprove();

  /* ---------- copy resolution ---------- */
  function findEmail(id){
    for(const s of SPEC().sequences) for(const e of s.emails) if(e.id===id) return { seq:s, email:e };
    return null;
  }
  const recId = (email, variant) => variant ? `${email.id}:${variant}` : email.id;

  /* Placeholder copy for an email, with the variant's overrides laid over the base. */
  function placeholder(email, variant){
    const base = email.copy||{};
    const over = (variant && email.variantCopy && email.variantCopy[variant])||{};
    return { ...base, ...over };
  }
  function effective(email, variant){
    const out = CE().effective(placeholder(email, variant), (store.records[recId(email,variant)]||{}).copy||{});
    out.footerNote = out.footerNote || "";
    return out;
  }
  const fillTokens = s => CE().fillTokens(s, SPEC().previewTokens||{});
  function renderPreview(seq, email, variant){
    const tpl = TPL(); if(!tpl) return "<p>email-template.js did not load</p>";
    const c = effective(email, variant);
    const copy = { ...c, footerNote: c.footerNote || seq.footerNote || "" };
    for(const k of ["subject","preheader","heading","greeting","ctaLabel","ctaHref","signoff"]) copy[k]=fillTokens(copy[k]);
    copy.paras = (copy.paras||[]).map(fillTokens);
    const out = tpl.buildNurtureEmail(copy, { firstName:(SPEC().previewTokens||{}).firstName||"", unsubscribeHref:"https://americanbiocarbon.com/unsubscribe?u=preview" }, {});
    return out;
  }

  /* ---------- UI ---------- */
  const FIELDS = [
    ["subject","Subject line","input"],
    ["preheader","Preheader (the grey text next to the subject)","input"],
    ["heading","Heading","input"],
    ["greeting","Greeting","input"],
    ["paras","Paragraphs","paras"],
    ["ctaLabel","Button label (blank for no button)","input"],
    ["ctaHref","Button link","input"],
    ["imageUrl","Image URL (optional, one image, real photo)","input"],
    ["signoff","Sign off","textarea"],
  ];

  const statusPill = st => CE().statusPill(st);
  const fieldRow = (id,key,label,kind,ph,val) => CE().fieldRow("NURTURE_UI", id, key, kind==="paras"?"Paragraph":label, kind, ph, val);

  function liveCard(seq, email){
    const tpl = TPL(); const forms = tpl ? Object.keys(tpl.SEQUENCES) : [];
    const form = VARIANT[email.id] || forms[0] || "";
    const out = tpl && form ? tpl.buildAutoreply(form, { name:(SPEC().previewTokens||{}).firstName||"" }, {}) : null;
    return `<div class="card nur-card" id="nur-${esc(email.id)}">
      <div class="nur-head">
        <div><span class="nur-id">${esc(email.id)}</span> <b>${esc(email.title)}</b> <span class="nur-day">day ${esc(email.day)}</span> <span class="nur-status ok">live</span></div>
      </div>
      <p class="nur-intent">${esc(email.intent)}</p>
      <div class="pipe-tabs" style="margin:6px 0 10px">${forms.map(f=>`<span class="pill${f===form?" active":""}" onclick="NURTURE_UI.variant('${esc(email.id)}','${esc(f)}')">${esc(tpl.SEQUENCES[f].label)}</span>`).join("")}</div>
      ${out?`<div class="nur-subject"><b>Subject:</b> ${esc(out.subject)}</div><iframe class="nur-frame" title="${esc(email.id)} preview" sandbox="" srcdoc="${esc(out.html)}"></iframe>`:""}
    </div>`;
  }

  function emailCard(seq, email){
    if(email.live) return liveCard(seq, email);
    const variants = seq.variants && email.variantCopy ? seq.variants : null;
    const variant = variants ? (VARIANT[email.id]||variants[0]) : null;
    const id = recId(email, variant);
    const rec = store.records[id]||{}; const saved = rec.copy||{};
    const ph = placeholder(email, variant);
    const out = renderPreview(seq, email, variant);
    const st = rec.status||"draft";
    const msg = store.lastMsg(id);
    return `<div class="card nur-card" id="nur-${esc(email.id)}">
      <div class="nur-head">
        <div><span class="nur-id">${esc(email.id)}</span> <b>${esc(email.title)}</b> <span class="nur-day">${typeof email.day==="number"?"day "+email.day:esc(email.day)}</span> ${statusPill(st)}${store.dirty[id]?' <span class="nur-status warn">unsaved</span>':""}</div>
        <div class="nur-actions">
          <button class="btn btn-primary" type="button" onclick="NURTURE_UI.save('${esc(id)}')">Save</button>
          ${st!=="ready"&&st!=="approved"?`<button class="btn btn-ghost" type="button" onclick="NURTURE_UI.setStatus('${esc(id)}','ready')">Mark ready for Victor</button>`:""}
          ${canApprove()&&st!=="approved"?`<button class="btn btn-accent" type="button" onclick="NURTURE_UI.setStatus('${esc(id)}','approved')">Approve</button>`:""}
          ${st==="approved"?`<button class="btn btn-ghost" type="button" onclick="NURTURE_UI.setStatus('${esc(id)}','draft')">Reopen</button>`:""}
          <button class="btn btn-ghost" type="button" onclick="NURTURE_UI.reset('${esc(id)}')">Clear my copy</button>
        </div>
      </div>
      <p class="nur-intent">${esc(email.intent)}</p>
      ${variants?`<div class="pipe-tabs" style="margin:6px 0 10px">${variants.map(v=>`<span class="pill${v===variant?" active":""}" onclick="NURTURE_UI.variant('${esc(email.id)}','${esc(v)}')">${esc(v)}</span>`).join("")}</div>`:""}
      <div class="nur-grid">
        <div class="nur-form">
          ${FIELDS.map(([k,l,kind])=>fieldRow(id,k,l,kind,ph[k],saved[k])).join("")}
          <div class="nur-msg">${msg}</div>
        </div>
        <div class="nur-preview">
          <div class="nur-subject"><b>Subject:</b> ${esc(fillTokens(effective(email,variant).subject))}</div>
          <iframe class="nur-frame" title="${esc(id)} preview" sandbox="" srcdoc="${esc(out.html)}"></iframe>
        </div>
      </div>
    </div>`;
  }

  function seqView(seq){
    const total = seq.emails.filter(e=>!e.live).length;
    const done = seq.emails.filter(e=>!e.live && (store.records[recId(e, seq.variants&&e.variantCopy?seq.variants[0]:null)]||{}).status==="approved").length;
    return `<div class="note info" style="margin-bottom:16px"><b>${esc(seq.name)}.</b> ${esc(seq.who)}. ${esc(seq.cadence)}. From ${esc(seq.sender)}. ${done} of ${total} approved.</div>
      ${seq.emails.map(e=>emailCard(seq,e)).join("")}`;
  }

  /* Tiny markdown renderer for the Plan tab. Headings, tables, lists, paragraphs. */
  function inline(s){ return esc(s).replace(/`([^`]+)`/g,'<code>$1</code>').replace(/\*\*([^*]+)\*\*/g,'<b>$1</b>').replace(/\[([^\]]+)\]\(([^)]+)\)/g,'<a href="$2" target="_blank" rel="noopener">$1</a>'); }
  function md(src){
    const out=[]; const lines=src.split("\n"); let i=0;
    const cells = r => r.replace(/^\||\|$/g,"").split("|").map(c=>c.trim());
    while(i<lines.length){
      const l=lines[i];
      if(!l.trim()){ i++; continue; }
      if(/^---\s*$/.test(l)){ out.push('<div class="hr"></div>'); i++; continue; }
      const h=l.match(/^(#{1,4})\s+(.*)/);
      if(h){ const n=h[1].length; out.push(n===1?`<h1 class="page-h">${inline(h[2])}</h1>`:n===2?`<h2 class="pipe-h" style="margin-top:28px">${inline(h[2])}</h2>`:`<h3 style="margin:18px 0 8px">${inline(h[2])}</h3>`); i++; continue; }
      if(/^\|/.test(l)){ const rows=[]; while(i<lines.length&&/^\|/.test(lines[i])) rows.push(lines[i++]);
        const head=cells(rows[0]); const body=rows.slice(2).map(cells);
        out.push(`<div class="tbl-wrap"><table><thead><tr>${head.map(x=>`<th>${inline(x)}</th>`).join("")}</tr></thead><tbody>${body.map(r=>`<tr>${r.map(c=>`<td>${inline(c)}</td>`).join("")}</tr>`).join("")}</tbody></table></div>`); continue; }
      if(/^\s*[-*]\s/.test(l)){ const items=[]; while(i<lines.length&&/^\s*[-*]\s/.test(lines[i])){ let it=lines[i++].replace(/^\s*[-*]\s/,""); while(i<lines.length&&/^\s{2,}\S/.test(lines[i])&&!/^\s*[-*]\s/.test(lines[i])) it+=" "+lines[i++].trim(); items.push(it);} out.push(`<ul class="nur-list">${items.map(x=>`<li>${inline(x)}</li>`).join("")}</ul>`); continue; }
      if(/^\s*\d+\.\s/.test(l)){ const items=[]; while(i<lines.length&&/^\s*\d+\.\s/.test(lines[i])) items.push(lines[i++].replace(/^\s*\d+\.\s/,"")); out.push(`<ol class="nur-list">${items.map(x=>`<li>${inline(x)}</li>`).join("")}</ol>`); continue; }
      const p=[]; while(i<lines.length&&lines[i].trim()&&!/^(#|\||---|\s*[-*]\s|\s*\d+\.\s)/.test(lines[i])) p.push(lines[i++].trim());
      out.push(`<p class="nur-p">${inline(p.join(" "))}</p>`);
    }
    return out.join("\n");
  }

  function inner(){
    const spec = SPEC();
    const tabs = [["plan","The plan"], ...spec.sequences.map(s=>[s.id, `${s.id} · ${s.name}`])];
    let body;
    if(TAB==="plan") body = `<div class="nur-doc">${md(window.NURTURE_MD||"_nurture-data.js did not load_")}</div>`;
    else { const seq = spec.sequences.find(s=>s.id===TAB); body = seq ? seqView(seq) : ""; }
    return `<h1 class="page-h">Nurture Plan</h1>
      <p class="page-sub">Three Resend sequences. Every box below has a draft in it already, greyed out. Type over it and yours is what the email says; leave it and the draft stands. The preview on the right is the real template, rendered from whatever is in force. Save writes to the shared store so Victor and Daniel see the same copy. Nothing on this page sends an email. ${store.badge()}</p>
      <div class="pipe-tabs" style="margin-bottom:18px">${tabs.map(([id,l])=>`<span class="pill${id===TAB?" active":""}" onclick="NURTURE_UI.tab('${esc(id)}')">${esc(l)}</span>`).join("")}</div>
      ${body}`;
  }
  function rNurture(){ if(!store.loaded && !store.loading){ store.loading=true; setTimeout(store.load,0); } return `<section class="section" id="sec-nurture">${inner()}</section>`; }
  function rerender(){ const el=document.getElementById("sec-nurture"); if(el) el.innerHTML=inner(); }

  /* ---------- handlers ---------- */
  const readForm = id => CE().readForm(id);
  let typeTimer=null;
  function onType(el){
    const id=el.dataset.nur; store.dirty[id]=true; CE().flipTag(el);
    const r=findEmail(id.split(":")[0]); if(!r) return;
    /* Live preview: only the iframe re-renders, so typing does not lose focus to a full
       card rebuild. */
    clearTimeout(typeTimer);
    typeTimer=setTimeout(()=>{
      const variant = id.includes(":") ? id.split(":")[1] : null;
      const prev = store.records[id]; store.records[id] = { ...(prev||{}), copy:readForm(id) };
      const out = renderPreview(r.seq, r.email, variant);
      store.records[id] = prev || store.records[id];
      const card=document.getElementById("nur-"+r.email.id);
      const fr=card&&card.querySelector(".nur-frame"); if(fr) fr.srcdoc=out.html;
      const sj=card&&card.querySelector(".nur-subject"); if(sj) sj.innerHTML=`<b>Subject:</b> ${esc(out.subject)}`;
    },250);
  }
  const api = {
    rNurture,
    tab(id){ TAB=id; rerender(); },
    variant(emailId, v){ VARIANT[emailId]=v; rerender(); },
    onType,
    save(id){ store.save(id, { copy: readForm(id) }); },
    setStatus(id, status){
      if(status==="approved" && !canApprove()){ alert("Only Victor (admin) can approve."); return; }
      store.save(id, { copy: readForm(id), status });
    },
    reset(id){ if(!confirm("Clear your copy for this email and go back to the placeholder draft?")) return; store.save(id, { copy:{}, status:"draft" }); },
    addPara(id){ const rec=store.records[id]||{}; const copy=readForm(id); (copy.paras=copy.paras||[]).push(""); store.records[id]={...rec, copy}; store.dirty[id]=true; rerender(); },
    _internals:{ effective, placeholder, renderPreview, md, findEmail, get RECORDS(){return store.records;}, set RECORDS(v){store.records=v;}, readForm, store },
  };
  window.NURTURE_UI = api;
})();
