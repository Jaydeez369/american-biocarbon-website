/* Nurture Plan section: the editor Victor and Daniel write the sequences in.
 *
 * Three inputs, loaded before this file:
 *   nurture-spec.js      the sequences, cadence and PLACEHOLDER copy (window.NURTURE_SPEC)
 *   email-template.js    the real email renderer, bundled from functions/api/_email.js
 *                        (window.EMAIL_TPL), so the preview IS the email
 *   nurture-data.js      the plan document as markdown (window.NURTURE_MD), for the Plan tab
 *
 * One store: /api/record?kind=nurture, one record per email id ("A1", "B2:biochar"). The
 * record is { copy:{...fields}, status, updated_by, updated_at }. What a person types wins;
 * an empty box falls back to the placeholder, and the preview shows whichever is in force so
 * nobody approves an email they have not seen.
 *
 * NOTHING HERE SENDS. There is no send path in this file and no send path on the server for
 * these records. Approving an email marks the record approved and that is all it does. */
(function(){
  const esc = s => String(s==null?"":s).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;");
  const SPEC = () => window.NURTURE_SPEC || { sequences:[], previewTokens:{}, statuses:["draft","ready","approved"] };
  const TPL  = () => window.EMAIL_TPL;
  const LS_KEY = "vej_nurture_local_v1";     // browser copy, so a failed save loses nothing

  /* ---------- state ---------- */
  let TAB = "plan";                 // plan | A | B | C
  let VARIANT = {};                 // emailId -> variant name for B
  let RECORDS = {};                 // id -> record
  let LOADED = false, LOAD_ERR = "";
  let DIRTY = {};                   // id -> true while typed and unsaved
  let SAVE_MSG = {};                // id -> last save message

  const who = () => { for(const p of String(document.cookie||"").split(";")){ const i=p.indexOf("="); if(i>0&&p.slice(0,i).trim()==="sales_os_name") return decodeURIComponent(p.slice(i+1).trim()); } return ""; };
  const role = () => (window.PIPELIVE && PIPELIVE.data && PIPELIVE.data.role && PIPELIVE.data.role())||"";
  const canApprove = () => ["admin","dev"].includes(role());

  const lsGet=()=>{ try{ return JSON.parse(localStorage.getItem(LS_KEY)||"{}"); }catch(e){ return {}; } };
  const lsSet=v=>{ try{ localStorage.setItem(LS_KEY, JSON.stringify(v)); }catch(e){} };

  /* ---------- records ---------- */
  async function load(){
    RECORDS = lsGet();
    try{
      const res = await fetch("/api/record?kind=nurture",{ credentials:"same-origin" });
      const data = await res.json();
      if(data.ok===false) throw new Error(data.error||data.reason||"store unavailable");
      for(const r of (data.records||[])){
        const local = RECORDS[r.id];
        /* The newer of the two wins. A local copy that never reached the server is newer. */
        if(!local || String(r.updated_at||"") >= String(local.updated_at||"")) RECORDS[r.id]=r;
      }
      LOAD_ERR="";
    }catch(err){ LOAD_ERR=err.message||String(err); }
    LOADED=true; lsSet(RECORDS); rerender();
  }

  async function save(id, patch){
    const prev = RECORDS[id]||{};
    const rec = { ...prev, ...patch, id, updated_by: who()||prev.updated_by||"", updated_at:new Date().toISOString() };
    RECORDS[id]=rec; lsSet(RECORDS); DIRTY[id]=false;
    try{
      const res = await fetch("/api/record?kind=nurture",{ method:"POST", credentials:"same-origin",
        headers:{"Content-Type":"application/json"}, body:JSON.stringify({ records:[rec] }) });
      const data = await res.json().catch(()=>({}));
      if(!res.ok||data.ok===false) throw new Error(data.error||data.reason||`store returned ${res.status}`);
      SAVE_MSG[id]=`Saved to the shared store ${new Date().toLocaleTimeString([], {hour:"numeric",minute:"2-digit"})}`;
    }catch(err){
      SAVE_MSG[id]=`Saved in this browser only. The shared store said: ${err.message}. Save again to retry.`;
    }
    rerender();
  }

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
  /* The copy in force: typed value if present, else the placeholder. Paragraphs resolve one
     by one, so a person can rewrite paragraph 2 and keep 1 and 3 from the draft. */
  function effective(email, variant){
    const ph = placeholder(email, variant);
    const saved = (RECORDS[recId(email,variant)]||{}).copy||{};
    const out = { ...ph };
    for(const k of Object.keys(ph)){
      if(k==="paras"){
        const sp = Array.isArray(saved.paras)?saved.paras:[];
        const n = Math.max(ph.paras.length, sp.length);
        out.paras = []; for(let i=0;i<n;i++){ const v=(sp[i]||"").trim(); out.paras.push(v||ph.paras[i]||""); }
        out.paras = out.paras.filter(Boolean);
      } else if(typeof saved[k]==="string" && saved[k].trim()) out[k]=saved[k];
    }
    out.footerNote = out.footerNote || "";
    return out;
  }
  function fillTokens(s){
    const t = SPEC().previewTokens||{};
    return String(s==null?"":s).replace(/\{\{\s*(\w+)\s*\}\}/g,(m,k)=> k in t ? t[k] : m);
  }
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

  function statusPill(st){
    const cls = st==="approved"?"ok":st==="ready"?"warn":"";
    return `<span class="nur-status ${cls}">${esc(st||"draft")}</span>`;
  }

  function fieldRow(id, key, label, kind, ph, val){
    const attrs = `data-nur="${esc(id)}" data-key="${esc(key)}" oninput="NURTURE_UI.onType(this)"`;
    const using = !(val&&String(val).trim()) ? `<span class="nur-using">using placeholder</span>` : `<span class="nur-using own">your copy</span>`;
    if(kind==="paras"){
      const phs = ph||[]; const vals = Array.isArray(val)?val:[];
      const n = Math.max(phs.length, vals.length, 1);
      let rows="";
      for(let i=0;i<n;i++){
        const v = vals[i]||""; const p = phs[i]||"";
        rows += `<div class="field"><label>Paragraph ${i+1} ${v.trim()?`<span class="nur-using own">your copy</span>`:`<span class="nur-using">using placeholder</span>`}</label>
          <textarea rows="3" ${attrs} data-idx="${i}" placeholder="${esc(p)}">${esc(v)}</textarea></div>`;
      }
      return rows + `<button class="btn btn-ghost nur-mini" type="button" onclick="NURTURE_UI.addPara('${esc(id)}')">+ paragraph</button>`;
    }
    if(kind==="textarea") return `<div class="field"><label>${esc(label)} ${using}</label><textarea rows="3" ${attrs} placeholder="${esc(ph||"")}">${esc(val||"")}</textarea></div>`;
    return `<div class="field"><label>${esc(label)} ${using}</label><input type="text" ${attrs} placeholder="${esc(ph||"")}" value="${esc(val||"")}"></div>`;
  }

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
    const rec = RECORDS[id]||{}; const saved = rec.copy||{};
    const ph = placeholder(email, variant);
    const out = renderPreview(seq, email, variant);
    const st = rec.status||"draft";
    const msg = SAVE_MSG[id] || (rec.updated_at ? `Last saved ${rec.updated_at.slice(0,16).replace("T"," ")} by ${esc(rec.updated_by||"unknown")}` : "Not saved yet. Everything you see is the placeholder draft.");
    return `<div class="card nur-card" id="nur-${esc(email.id)}">
      <div class="nur-head">
        <div><span class="nur-id">${esc(email.id)}</span> <b>${esc(email.title)}</b> <span class="nur-day">${typeof email.day==="number"?"day "+email.day:esc(email.day)}</span> ${statusPill(st)}${DIRTY[id]?' <span class="nur-status warn">unsaved</span>':""}</div>
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
    const done = seq.emails.filter(e=>!e.live && (RECORDS[recId(e, seq.variants&&e.variantCopy?seq.variants[0]:null)]||{}).status==="approved").length;
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
    const store = !LOADED ? `<span class="nur-status">loading saved copy</span>` : LOAD_ERR ? `<span class="nur-status warn" title="${esc(LOAD_ERR)}">shared store unreachable, showing this browser's copy</span>` : `<span class="nur-status ok">shared store connected</span>`;
    let body;
    if(TAB==="plan") body = `<div class="nur-doc">${md(window.NURTURE_MD||"_nurture-data.js did not load_")}</div>`;
    else { const seq = spec.sequences.find(s=>s.id===TAB); body = seq ? seqView(seq) : ""; }
    return `<h1 class="page-h">Nurture Plan</h1>
      <p class="page-sub">Three Resend sequences. Every box below has a draft in it already, greyed out. Type over it and yours is what the email says; leave it and the draft stands. The preview on the right is the real template, rendered from whatever is in force. Save writes to the shared store so Victor and Daniel see the same copy. Nothing on this page sends an email. ${store}</p>
      <div class="pipe-tabs" style="margin-bottom:18px">${tabs.map(([id,l])=>`<span class="pill${id===TAB?" active":""}" onclick="NURTURE_UI.tab('${esc(id)}')">${esc(l)}</span>`).join("")}</div>
      ${body}`;
  }
  function rNurture(){ if(!LOADED && !window.__nurLoading){ window.__nurLoading=true; setTimeout(load,0); } return `<section class="section" id="sec-nurture">${inner()}</section>`; }
  function rerender(){ const el=document.getElementById("sec-nurture"); if(el) el.innerHTML=inner(); }

  /* ---------- handlers ---------- */
  function readForm(id){
    const copy = {}; const paras=[];
    document.querySelectorAll(`[data-nur="${CSS.escape(id)}"]`).forEach(el=>{
      const k=el.dataset.key;
      if(k==="paras") paras[Number(el.dataset.idx)]=el.value; else copy[k]=el.value;
    });
    copy.paras = paras.map(p=>p||"");
    return copy;
  }
  let typeTimer=null;
  function onType(el){
    const id=el.dataset.nur; DIRTY[id]=true;
    /* Flip this box's own tag as they type, so "using placeholder" turns into "your copy"
       the moment the box has something in it, and back when they clear it. */
    const tag = el.parentElement && el.parentElement.querySelector(".nur-using");
    if(tag){ const own = Boolean(el.value.trim()); tag.textContent = own ? "your copy" : "using placeholder"; tag.className = "nur-using" + (own ? " own" : ""); }
    const r=findEmail(id.split(":")[0]); if(!r) return;
    /* Live preview: the iframe re-renders from the form, but only the iframe, so typing does
       not lose focus to a full card rebuild. */
    clearTimeout(typeTimer);
    typeTimer=setTimeout(()=>{
      const copy=readForm(id);
      const variant = id.includes(":") ? id.split(":")[1] : null;
      const prev = RECORDS[id]; RECORDS[id] = { ...(prev||{}), copy };
      const out = renderPreview(r.seq, r.email, variant);
      RECORDS[id] = prev || RECORDS[id];
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
    save(id){ save(id, { copy: readForm(id) }); },
    setStatus(id, status){
      if(status==="approved" && !canApprove()){ alert("Only Victor (admin) can approve."); return; }
      save(id, { copy: readForm(id), status });
    },
    reset(id){ if(!confirm("Clear your copy for this email and go back to the placeholder draft?")) return; save(id, { copy:{}, status:"draft" }); },
    addPara(id){ const rec=RECORDS[id]||{}; const copy=readForm(id); copy.paras.push(""); RECORDS[id]={...rec, copy}; DIRTY[id]=true; rerender(); },
    _internals:{ effective, placeholder, renderPreview, md, findEmail, get RECORDS(){return RECORDS;}, set RECORDS(v){RECORDS=v;}, readForm },
  };
  window.NURTURE_UI = api;
})();
