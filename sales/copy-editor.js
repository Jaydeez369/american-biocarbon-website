/* The shared core of the two copy editors, Cold Email and Nurture Plan.
 *
 * One idea, used twice: a spec file holds the structure and a PLACEHOLDER draft for every
 * field; the person types over the draft or leaves it; what is in force is rendered the way
 * the recipient sees it; Save writes one record per item to the shared store under a kind
 * the Worker lists. This file is the part that is the same for both: the store, the field
 * resolution, the field rows, the status pills. The two editors own their spec, their
 * preview and their page.
 *
 * NOTHING HERE SENDS. There is no send path in this file. */
(function(){
  const esc = s => String(s==null?"":s).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;");

  const who = () => { for(const p of String(document.cookie||"").split(";")){ const i=p.indexOf("="); if(i>0&&p.slice(0,i).trim()==="sales_os_name") return decodeURIComponent(p.slice(i+1).trim()); } return ""; };
  const role = () => (window.PIPELIVE && PIPELIVE.data && PIPELIVE.data.role && PIPELIVE.data.role())||"";
  const canApprove = () => ["admin","dev"].includes(role());

  /* A store is one kind in /api/record. Records are cached in this browser too, so a save
     that cannot reach the server is kept and shown as such, never lost. */
  function makeStore(kind, onChange){
    const LS_KEY = `vej_copy_${kind}_v1`;
    const lsGet=()=>{ try{ return JSON.parse(localStorage.getItem(LS_KEY)||"{}"); }catch(e){ return {}; } };
    const lsSet=v=>{ try{ localStorage.setItem(LS_KEY, JSON.stringify(v)); }catch(e){} };
    const S = { kind, records:{}, loaded:false, loadErr:"", dirty:{}, msg:{} };

    S.load = async function(){
      S.records = lsGet();
      try{
        const res = await fetch(`/api/record?kind=${encodeURIComponent(kind)}`,{ credentials:"same-origin" });
        const data = await res.json();
        if(data.ok===false) throw new Error(data.error||data.reason||"store unavailable");
        for(const r of (data.records||[])){
          const local = S.records[r.id];
          /* The newer of the two wins. A local copy that never reached the server is newer. */
          if(!local || String(r.updated_at||"") >= String(local.updated_at||"")) S.records[r.id]=r;
        }
        S.loadErr="";
      }catch(err){ S.loadErr=err.message||String(err); }
      S.loaded=true; lsSet(S.records); onChange();
    };

    S.save = async function(id, patch){
      const prev = S.records[id]||{};
      const rec = { ...prev, ...patch, id, updated_by: who()||prev.updated_by||"", updated_at:new Date().toISOString() };
      S.records[id]=rec; lsSet(S.records); S.dirty[id]=false;
      try{
        const res = await fetch(`/api/record?kind=${encodeURIComponent(kind)}`,{ method:"POST", credentials:"same-origin",
          headers:{"Content-Type":"application/json"}, body:JSON.stringify({ records:[rec] }) });
        const data = await res.json().catch(()=>({}));
        if(!res.ok||data.ok===false) throw new Error(data.error||data.reason||`store returned ${res.status}`);
        S.msg[id]=`Saved to the shared store ${new Date().toLocaleTimeString([], {hour:"numeric",minute:"2-digit"})}`;
      }catch(err){
        S.msg[id]=`Saved in this browser only. The shared store said: ${err.message}. Save again to retry.`;
      }
      onChange();
    };

    S.badge = function(){
      return !S.loaded ? `<span class="nur-status">loading saved copy</span>`
        : S.loadErr ? `<span class="nur-status warn" title="${esc(S.loadErr)}">shared store unreachable, showing this browser's copy</span>`
        : `<span class="nur-status ok">shared store connected</span>`;
    };
    S.lastMsg = function(id){
      const rec=S.records[id]||{};
      return S.msg[id] || (rec.updated_at ? `Last saved ${rec.updated_at.slice(0,16).replace("T"," ")} by ${esc(rec.updated_by||"unknown")}` : "Not saved yet. Everything you see is the placeholder draft.");
    };
    return S;
  }

  /* The copy in force: typed value if present, else the placeholder. Array fields (paras)
     resolve one entry at a time, so a person can rewrite paragraph 2 and keep 1 and 3. */
  function effective(ph, saved){
    const out = { ...ph };
    for(const k of Object.keys(ph)){
      if(Array.isArray(ph[k])){
        const sp = Array.isArray(saved[k])?saved[k]:[];
        const n = Math.max(ph[k].length, sp.length);
        out[k] = []; for(let i=0;i<n;i++){ const v=(sp[i]||"").trim(); out[k].push(v||ph[k][i]||""); }
        out[k] = out[k].filter(Boolean);
      } else if(typeof saved[k]==="string" && saved[k].trim()) out[k]=saved[k];
    }
    return out;
  }

  const fillTokens = (s, tokens) => String(s==null?"":s).replace(/\{\{\s*(\w+)\s*\}\}/g,(m,k)=> k in tokens ? tokens[k] : m);

  function statusPill(st){
    const cls = st==="approved"||st==="canonical"?"ok":st==="ready"?"warn":"";
    return `<span class="nur-status ${cls}">${esc(st||"draft")}</span>`;
  }
  const usingTag = own => own ? `<span class="nur-using own">your copy</span>` : `<span class="nur-using">using placeholder</span>`;

  /* One form row. `ui` is the editor's global name so the oninput handler can find it. */
  function fieldRow(ui, id, key, label, kind, ph, val){
    const attrs = `data-nur="${esc(id)}" data-key="${esc(key)}" oninput="${ui}.onType(this)"`;
    if(kind==="paras"){
      const phs = ph||[]; const vals = Array.isArray(val)?val:[];
      const n = Math.max(phs.length, vals.length, 1);
      let rows="";
      for(let i=0;i<n;i++){
        const v = vals[i]||""; const p = phs[i]||"";
        rows += `<div class="field"><label>${esc(label)} ${i+1} ${usingTag(Boolean(v.trim()))}</label>
          <textarea rows="3" ${attrs} data-idx="${i}" placeholder="${esc(p)}">${esc(v)}</textarea></div>`;
      }
      return rows + `<button class="btn btn-ghost nur-mini" type="button" onclick="${ui}.addPara('${esc(id)}')">+ ${esc(label.toLowerCase())}</button>`;
    }
    const own = Boolean(val&&String(val).trim());
    if(kind==="textarea") return `<div class="field"><label>${esc(label)} ${usingTag(own)}</label><textarea rows="3" ${attrs} placeholder="${esc(ph||"")}">${esc(val||"")}</textarea></div>`;
    return `<div class="field"><label>${esc(label)} ${usingTag(own)}</label><input type="text" ${attrs} placeholder="${esc(ph||"")}" value="${esc(val||"")}"></div>`;
  }

  /* Read the form for one record id back into a copy object. Array fields come back as
     arrays; everything else as strings. */
  function readForm(id){
    const copy = {}; const arrays = {};
    document.querySelectorAll(`[data-nur="${CSS.escape(id)}"]`).forEach(el=>{
      const k=el.dataset.key;
      if(el.dataset.idx!=null){ (arrays[k]=arrays[k]||[])[Number(el.dataset.idx)]=el.value; }
      else copy[k]=el.value;
    });
    for(const k of Object.keys(arrays)) copy[k]=arrays[k].map(p=>p||"");
    return copy;
  }

  /* Flip the typed box's own tag as they type. */
  function flipTag(el){
    const tag = el.parentElement && el.parentElement.querySelector(".nur-using");
    if(tag){ const own = Boolean(el.value.trim()); tag.textContent = own ? "your copy" : "using placeholder"; tag.className = "nur-using" + (own ? " own" : ""); }
  }

  window.COPY_EDITOR = { esc, who, role, canApprove, makeStore, effective, fillTokens, statusPill, fieldRow, readForm, flipTag };
})();
