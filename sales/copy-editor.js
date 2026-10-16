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

  /* The display name cookie the login gate sets is sales_os_user (functions/_middleware.js NAME_COOKIE). */
  const who = () => { for(const p of String(document.cookie||"").split(";")){ const i=p.indexOf("="); if(i>0&&p.slice(0,i).trim()==="sales_os_user") return decodeURIComponent(p.slice(i+1).trim()); } return ""; };
  const role = () => (window.PIPELIVE && PIPELIVE.data && PIPELIVE.data.role && PIPELIVE.data.role())||"";
  const canApprove = () => ["admin","dev"].includes(role());
  const isLocked = st => st==="approved"||st==="canonical";
  /* A locked record is read only for everyone but an admin: the edge refuses their writes, so the
     buttons that would try are not drawn. */
  const lockedForMe = st => isLocked(st) && !canApprove();

  /* The copy gate (sales/copy-rules.js, the same function the edge runs). */
  const RULES = () => window.COPY_RULES;
  function validate(kind, copy){
    const r = RULES();
    if(!r) return { ok:false, failures:["The copy gate (copy-rules.js) did not load, so nothing can be approved. Reload the page."] };
    return r.validateCopy(copy, { kind });
  }
  const withFallback = s => RULES() ? RULES().withFallback(s) : String(s==null?"":s).replace(/\{\{\s*firstName\s*\}\}/g,"{{firstName | there}}");

  /* A store is one kind in /api/record. Records are cached in this browser too, so a save
     that cannot reach the server is kept and shown as such, never lost. */
  function makeStore(kind, onChange){
    const LS_KEY = `vej_copy_${kind}_v1`;
    const lsGet=()=>{ try{ return JSON.parse(localStorage.getItem(LS_KEY)||"{}"); }catch(e){ return {}; } };
    const lsSet=v=>{ try{ localStorage.setItem(LS_KEY, JSON.stringify(v)); }catch(e){} };
    const S = { kind, records:{}, loaded:false, loadErr:"", dirty:{}, msg:{}, baseCopy:{}, fails:{} };

    /* Unsaved typing survives any re-render: before the cards are rebuilt from records, each
       dirty form is copied into its record in memory (not sent anywhere). The copy as last
       saved is remembered so save() can still tell whether the wording changed. */
    S.snapshot = function(){
      for(const id of Object.keys(S.dirty)){
        if(!S.dirty[id]) continue;
        if(!document.querySelector(`[data-nur="${CSS.escape(id)}"]`)) continue;
        const prev = S.records[id]||{};
        if(!(id in S.baseCopy)) S.baseCopy[id] = prev.copy||null;
        S.records[id] = { ...prev, copy: readForm(id) };
      }
    };

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

    /* Run the copy gate for one record and remember the failure list for the card. Returns true
       when the copy may proceed. `copy` is the copy as it is in force (placeholders included). */
    S.gate = function(id, copy, what){
      const r = validate(kind, copy);
      if(r.ok){ delete S.fails[id]; return true; }
      S.fails[id] = r.failures; S.msg[id] = `Blocked: ${what} needs these fixed first.`;
      onChange();
      return false;
    };

    S.save = async function(id, patch){
      const prev = S.records[id]||{};
      const hadPrev = id in S.records;
      /* Changed copy invalidates an approval: unless this very call sets a status, an approved
         or canonical record falls back to draft when its copy differs from what was saved. */
      const lockedPrev = prev.status==="approved"||prev.status==="canonical";
      const baseCopy = id in S.baseCopy ? S.baseCopy[id] : (prev.copy||null);
      delete S.baseCopy[id];
      const copyChanged = patch && "copy" in patch && JSON.stringify(patch.copy||null)!==JSON.stringify(baseCopy);
      const demote = lockedPrev && copyChanged && !("status" in patch) ? { status:"draft" } : {};
      const rec = { ...prev, ...patch, ...demote, id, updated_by: who()||prev.updated_by||"", updated_at:new Date().toISOString() };
      S.records[id]=rec; lsSet(S.records); S.dirty[id]=false;
      try{
        const res = await fetch(`/api/record?kind=${encodeURIComponent(kind)}`,{ method:"POST", credentials:"same-origin",
          headers:{"Content-Type":"application/json"}, body:JSON.stringify({ records:[rec] }) });
        const data = await res.json().catch(()=>({}));
        if(!res.ok||data.ok===false){
          const e = new Error(data.error||data.reason||`store returned ${res.status}`);
          e.status = res.status; e.failures = data.failures; throw e;
        }
        delete S.fails[id];
        S.msg[id]=`Saved to the shared store ${new Date().toLocaleTimeString([], {hour:"numeric",minute:"2-digit"})}`;
      }catch(err){
        if(err.status===403){
          /* The server refused this write. Keeping it locally would show a status (or wording) the
             shared store does not hold, so the browser's record goes back to what it was. */
          if(hadPrev) S.records[id]=prev; else delete S.records[id];
          lsSet(S.records);
          S.msg[id]=`Refused, nothing was saved: ${err.message}`;
        } else if(err.status===422){
          /* The copy gate said no. The wording is kept so it can be fixed, the status is not. */
          S.records[id]={ ...rec, status: prev.status||"draft" }; lsSet(S.records);
          S.fails[id]=err.failures||[err.message];
          S.msg[id]="Refused by the shared store: the copy fails the copy gate.";
        } else {
          S.msg[id]=`Saved in this browser only. The shared store said: ${err.message}. Save again to retry.`;
        }
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
      const base = S.msg[id] ? esc(S.msg[id]) : (rec.updated_at ? `Last saved ${esc(rec.updated_at.slice(0,16).replace("T"," "))} by ${esc(rec.updated_by||"unknown")}` : "Not saved yet. Everything you see is the starter draft.");
      const fails = S.fails[id];
      return base + (fails&&fails.length ? `<ul class="nur-fails" style="margin:6px 0 0 18px;padding:0;color:var(--red,#b3261e)">${fails.map(f=>`<li>${esc(f)}</li>`).join("")}</ul>` : "");
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
  const usingTag = own => own ? `<span class="nur-using own">your copy</span>` : `<span class="nur-using">using starter draft</span>`;

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
    if(tag){ const own = Boolean(el.value.trim()); tag.textContent = own ? "your copy" : "using starter draft"; tag.className = "nur-using" + (own ? " own" : ""); }
  }

  window.COPY_EDITOR = { esc, who, role, canApprove, isLocked, lockedForMe, validate, withFallback, makeStore, effective, fillTokens, statusPill, fieldRow, readForm, flipTag };
})();
