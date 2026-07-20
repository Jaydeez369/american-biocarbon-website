/* ============ VEJ Sales OS — LIVE SALES PIPELINE (ported from SIBRA/Replit) ============
   A fully interconnected CRM built on ONE live data layer. pipeline-data.js (window.PIPE)
   is the imported SIBRA snapshot; the team's own adds/edits live in localStorage and MERGE
   with the snapshot at render. Every tab — Pipeline, Production Plan, Executive Dashboard,
   Offtake Pipeline, Deals, Contacts, Leads, Reports — reads from the same live accessors
   (liveDeals / liveAccounts / allContacts / allLeads / offRowsAll), so adding a deal
   cascades everywhere at once: KPIs, charts, reports, offtake-confirmed, account rollups.

   Any add/edit/delete saves to localStorage then calls rerender() (app.js), which rebuilds
   the whole section from live state — one source of truth, everything cohesive.
   Snapshot records are read-only (base:true); records the team adds are fully CRUD.
   Loads BEFORE app.js; exposes window.PIPELIVE.rCRM for LEAN_SECTIONS. */
(function(){
  const P = window.PIPE;
  const esc = s => String(s??"").replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;");
  const money = n => "$" + Math.round(n).toLocaleString();
  const kfmt = n => "$" + Math.round(n/1000) + "K";
  const num = n => Math.round(n).toLocaleString();
  const lsGet=(k,d)=>{ try{ const v=JSON.parse(localStorage.getItem(k)); return v==null?d:v; }catch(e){ return d; } };
  const lsSet=(k,v)=>{ try{ localStorage.setItem(k,JSON.stringify(v)); }catch(e){} };
  const rr=()=>{ if(typeof rerender==="function") rerender(); };

  /* ======================= LIVE DATA LAYER ======================= */
  const D_KEY="vej_pipe_deals_v1";       // custom deals
  const C_KEY="vej_pipe_contacts_v1";    // custom contacts
  const L_KEY="vej_pipe_leads_v1";       // custom leads
  const O_KEY="vej_pipe_offtake_v1";     // custom offtake rows
  const A_KEY="vej_pipe_accounts_v1";    // custom accounts
  const QX_KEY="vej_pipe_extra_quarters";

  const customDeals=()=>lsGet(D_KEY,[]).map((d,ci)=>({...d,qty:+d.qty,price:+d.price,ci,custom:true}));
  const liveDeals=()=>P.deals.map(d=>({...d,base:true})).concat(customDeals());
  const allContacts=()=>P.contacts.map(c=>({...c,base:true})).concat(lsGet(C_KEY,[]).map((c,ci)=>({...c,ci})));
  const allLeads=()=>P.leads.map(l=>({...l,base:true})).concat(lsGet(L_KEY,[]).map((l,ci)=>({...l,ci})));
  const offRowsAll=()=>P.offtake.rows.map(r=>({...r,base:true})).concat(lsGet(O_KEY,[]).map((r,ci)=>({confirmed:{},...r,ci})));
  /* accounts = snapshot ∪ custom ∪ anything referenced by a deal/contact/offtake row */
  const liveAccounts=()=>{
    const map=new Map();
    P.accounts.forEach(a=>map.set(a.name,{...a,base:true}));
    lsGet(A_KEY,[]).forEach(a=>{ if(!map.has(a.name)) map.set(a.name,{...a}); });
    liveDeals().forEach(d=>{ if(d.customer&&!map.has(d.customer)) map.set(d.customer,{name:d.customer,type:"customer",industry:"",derived:true}); });
    allContacts().forEach(c=>{ if(c.account&&!map.has(c.account)) map.set(c.account,{name:c.account,type:"prospect",industry:"",derived:true}); });
    offRowsAll().forEach(r=>{ if(r.customer&&!map.has(r.customer)) map.set(r.customer,{name:r.customer,type:"prospect",industry:"",derived:true}); });
    return [...map.values()];
  };
  const accountNames=()=>liveAccounts().map(a=>a.name).sort();
  const productNames=()=>[...new Set(P.production.products.map(r=>r.p).concat(liveDeals().map(d=>d.product)))].filter(Boolean).sort();
  const sectorNames=()=>[...new Set(liveDeals().map(d=>d.sector).filter(Boolean))].sort();

  /* ---- deal derivations ---- */
  const stageOf = k => P.stages.find(s=>s.k===k) || P.stages[0];
  const value = d => d.qty * d.price;
  const weighted = d => value(d) * stageOf(d.stage).prob / 100;
  const closeDate = d => new Date(d.close + "T00:00:00Z");
  const fmtDate = d => closeDate(d).toLocaleDateString("en-US",{month:"2-digit",day:"2-digit",year:"numeric"});
  const quarterOf = d => { const t=closeDate(d); return "Q"+(Math.floor(t.getMonth()/3)+1)+" "+t.getFullYear(); };
  const qSort=(a,b)=>{ const [qa,ya]=a.split(" "),[qb,yb]=b.split(" "); return ya-yb||qa[1]-qb[1]; };
  const norm = s => String(s||"").trim().toLowerCase().replace(/s$/,"");
  const qtyStr = ds => {
    const mt = ds.filter(d=>d.uom==="MT").reduce((a,d)=>a+d.qty,0);
    const un = ds.filter(d=>d.uom!=="MT").reduce((a,d)=>a+d.qty,0);
    return [mt?num(mt)+" MT":null, un?num(un)+" UNIT":null].filter(Boolean).join(" + ") || "0";
  };
  const sum = (arr,f) => arr.reduce((a,x)=>a+f(x),0);

  const stBadge = (d,pct=true) => { const s=stageOf(d.stage); return `<span class="pbadge ${s.cls}">${esc(s.label)}${pct?` (${s.prob}%)`:""}</span>`; };
  const cfBadge = d => { const c=P.confidence[d.conf]||P.confidence.low; return `<span class="pbadge ${c.cls}">${esc(c.label)}</span>`; };

  const CAT = ["#24478a","#5f8a5b","#caa85a","#9a7fc8","#c85a54","#5a86c8","#d7153f","#3a4655"];
  const colorFor = (list,name) => CAT[list.indexOf(name) % CAT.length];

  /* ---- CSV export (shared) ---- */
  function downloadCSV(filename, header, rows){
    const q=x=>`"${String(x??"").replace(/"/g,'""')}"`;
    const csv=[header].concat(rows).map(r=>r.map(q).join(",")).join("\n");
    const a=document.createElement("a");
    a.href=URL.createObjectURL(new Blob([csv],{type:"text/csv"}));
    a.download=filename; a.click(); URL.revokeObjectURL(a.href);
  }

  /* ---- tabs ---- */
  const TABS = [
    ["pipeline","Pipeline"],["production","Production Plan"],["exec","Executive Dashboard"],
    ["offtake","Offtake Pipeline"],["deals","Deals"],["contacts","Contacts"],
    ["leads","Leads"],["reports","Reports"],
  ];
  const TAB_KEY = "vej_pipe_tab";
  const activeTab = () => { const t=lsGet(TAB_KEY,null); return TABS.some(x=>x[0]===t)?t:"pipeline"; };
  window.pipeTab = id => {
    lsSet(TAB_KEY,id);
    document.querySelectorAll(".pipe-pane").forEach(p=>p.classList.toggle("active",p.dataset.tab===id));
    document.querySelectorAll(".pipe-tabs .pill").forEach(b=>b.classList.toggle("active",b.dataset.tab===id));
  };

  const kpi = (l,v,d,cls) => `<div class="pkpi"><div class="pk-l">${esc(l)}</div><div class="pk-v${cls?" "+cls:""}">${v}</div>${d?`<div class="pk-d">${esc(d)}</div>`:""}</div>`;
  const tblWrap = inner => `<div class="tbl-wrap"><table>${inner}</table></div>`;

  /* ---- shared modal shell ---- */
  window.pipeModalClose=()=>document.getElementById("pipeModal")?.remove();
  function openModal(title,body,saveLabel,onSaveExpr,wide){
    pipeModalClose();
    const wrap=document.createElement("div");
    wrap.className="pmodal-wrap"; wrap.id="pipeModal";
    wrap.innerHTML=`<div class="pmodal${wide?" wide":""}">
      <div class="pmodal-h"><h3>${esc(title)}</h3><span class="pmodal-x" onclick="pipeModalClose()">✕</span></div>
      ${body}
      <div class="pmodal-f"><button class="btn btn-ghost" onclick="pipeModalClose()">Cancel</button>
        <button class="btn btn-primary" onclick="${onSaveExpr}">${esc(saveLabel)}</button></div></div>`;
    document.body.appendChild(wrap);
    wrap.addEventListener("click",e=>{ if(e.target===wrap) pipeModalClose(); });
    return wrap;
  }
  const F=(id,label,val,req,ph,type)=>`<div class="pcf"><label>${label}${req?" *":""}</label><input class="pinput" id="${id}" type="${type||"text"}" value="${esc(val==null?"":val)}" placeholder="${ph||""}"></div>`;
  const SEL=(id,label,opts,val)=>`<div class="pcf"><label>${label}</label><select class="pinput" id="${id}">${opts.map(o=>{const[v,t]=Array.isArray(o)?o:[o,o];return `<option value="${esc(v)}"${String(val)===String(v)?" selected":""}>${esc(t)}</option>`;}).join("")}</select></div>`;
  const V=id=>document.getElementById(id)?.value.trim()||"";
  const todayISO=()=>{ const d=new Date(); return d.getFullYear()+"-"+String(d.getMonth()+1).padStart(2,"0")+"-"+String(d.getDate()).padStart(2,"0"); };

  /* ======================= DEAL CRUD (feeds every tab) ======================= */
  window.pipeDealModal=(ci,prefill)=>{
    const cur=(ci!=null&&ci>=0)?customDeals()[ci]:(prefill||{});
    const accts=accountNames();
    const body=`
      ${F("pdName","Deal Name",cur.deal,1,"e.g. Rose Acres: August Sale")}
      <div class="pcf"><label>Customer / Account *</label><select class="pinput" id="pdCustomer">
        <option value="">Select account…</option>${accts.map(a=>`<option${cur.customer===a?" selected":""}>${esc(a)}</option>`).join("")}
        <option value="__new"${cur.customer&&!accts.includes(cur.customer)?" selected":""}>+ New account…</option></select></div>
      <div class="pcf" id="pdNewAcctWrap" style="display:${cur.customer&&!accts.includes(cur.customer)?"block":"none"}"><label>New account name</label><input class="pinput" id="pdNewAcct" value="${esc(cur.customer&&!accts.includes(cur.customer)?cur.customer:"")}"></div>
      <div class="pcf-grid">
        ${SEL("pdProduct","Product",productNames(),cur.product||"Biochar")}
        <div class="pcf"><label>Sector</label><input class="pinput" id="pdSector" list="pdSectorList" value="${esc(cur.sector||"")}"><datalist id="pdSectorList">${sectorNames().map(s=>`<option value="${esc(s)}">`).join("")}</datalist></div>
      </div>
      <div class="pcf-grid pcf-g3">
        ${F("pdQty","Quantity",cur.qty,1,"","number")}
        ${SEL("pdUom","Unit",["MT","UNIT"],cur.uom||"MT")}
        ${F("pdPrice","Price / Unit ($)",cur.price,1,"","number")}
      </div>
      <div class="pcf-grid">
        ${SEL("pdOrder","Order Type",["Recurring","One-Time"],cur.order||"Recurring")}
        ${F("pdClose","Close Date",cur.close||todayISO(),0,"","date")}
      </div>
      <div class="pcf-grid pcf-g3">
        ${SEL("pdStage","Stage",P.stages.map(s=>[s.k,s.label]),cur.stage||"prospect")}
        ${SEL("pdConf","Confidence",[["secured","Secured (100%)"],["medium","Medium (65%)"],["low","Low (30%)"]],cur.conf||"low")}
        ${SEL("pdStatus","Status",["open","won","lost"],cur.status||"open")}
      </div>
      ${SEL("pdOwner","Assigned To",P.team.map(t=>t.name),cur.owner||P.team[0].name)}
      <div class="pcf"><label>Notes</label><textarea class="pinput" id="pdNotes" rows="2">${esc(cur.notes||"")}</textarea></div>
      <div class="pcf-hint" id="pdValueHint"></div>`;
    openModal((ci!=null&&ci>=0?"Edit":"Add")+" Deal",body,ci!=null&&ci>=0?"Save Changes":"Add Deal",`pipeDealSave(${ci!=null&&ci>=0?ci:-1},${prefill&&prefill.__leadCi!=null?prefill.__leadCi:-1})`,true);
    const sel=document.getElementById("pdCustomer");
    sel.addEventListener("change",e=>{ document.getElementById("pdNewAcctWrap").style.display=e.target.value==="__new"?"block":"none"; });
    const upd=()=>{ const v=(+V("pdQty")||0)*(+V("pdPrice")||0); const el=document.getElementById("pdValueHint"); if(el)el.innerHTML=`Deal value: <b>${money(v)}</b>`; };
    ["pdQty","pdPrice"].forEach(id=>document.getElementById(id).addEventListener("input",upd)); upd();
    document.getElementById("pdName").focus();
  };
  window.pipeDealSave=(ci,leadCi)=>{
    let customer=V("pdCustomer"); if(customer==="__new") customer=V("pdNewAcct");
    const deal=V("pdName")||`${customer}: Deal`, qty=+V("pdQty"), price=+V("pdPrice");
    if(!customer||!(qty>0)||!(price>0)){ alert("Account, a positive quantity, and a price are required."); return; }
    const rec={ deal, customer, product:V("pdProduct"), sector:V("pdSector"), qty, uom:V("pdUom"), price,
      order:V("pdOrder"), close:V("pdClose")||todayISO(), stage:V("pdStage"), conf:V("pdConf"),
      status:V("pdStatus"), owner:V("pdOwner"), notes:V("pdNotes") };
    const arr=lsGet(D_KEY,[]);
    if(ci>=0) arr[ci]=rec; else arr.push(rec);
    lsSet(D_KEY,arr);
    /* if this deal came from converting a custom lead, flip that lead to converted */
    if(leadCi!=null&&leadCi>=0){ const ls=lsGet(L_KEY,[]); if(ls[leadCi]){ ls[leadCi].status="converted"; ls[leadCi].converted=true; ls[leadCi].convertedTo=deal; ls[leadCi].convertedDate=todayISO(); lsSet(L_KEY,ls); } }
    pipeModalClose(); rr();
  };
  window.pipeDealDelete=ci=>{
    const arr=lsGet(D_KEY,[]); const d=arr[ci];
    if(!d) return; if(!confirm(`Delete deal "${d.deal}"?`)) return;
    arr.splice(ci,1); lsSet(D_KEY,arr); rr();
  };
  window.pipeDealExport=()=>downloadCSV("sales-pipeline.csv",
    ["Deal Name","Customer","Product","Sector","Qty","UOM","Price/Unit","Order Type","Close Date","Stage","Confidence","Status","Deal Value","Weighted Value","Quarter","Assigned To","Notes"],
    liveDeals().map(d=>[d.deal,d.customer,d.product,d.sector,d.qty,d.uom,d.price,d.order,fmtDate(d),stageOf(d.stage).label,(P.confidence[d.conf]||{}).label||d.conf,d.status,value(d),Math.round(weighted(d)),quarterOf(d),d.owner,d.notes]));

  /* ================= TAB 1 · PIPELINE (deal tracker) ================= */
  const VIEW_KEY="vej_pipe_view";
  const dealAttrs = d => `data-product="${esc(d.product)}" data-quarter="${quarterOf(d)}" data-stage="${d.stage}" data-sector="${esc(d.sector)}" data-conf="${d.conf}"`;
  const trackerRow = d => `<tr ${dealAttrs(d)}>
    <td><strong>${esc(d.customer)}</strong></td><td>${esc(d.product)}</td><td>${esc(d.sector)}</td>
    <td class="t-num">${num(d.qty)} <span class="uom">${esc(d.uom)}</span></td>
    <td class="t-num">${(+d.price).toFixed(2)}</td><td>${esc(d.order)}</td>
    <td class="t-num">${fmtDate(d)}</td><td>${stBadge(d)}</td><td>${cfBadge(d)}</td>
    <td class="t-num">${money(value(d))}</td><td class="t-num pwt">${money(weighted(d))}</td>
    <td class="t-num">${quarterOf(d)}</td><td class="pnote" title="${esc(d.notes||"")}">${esc(d.notes||"—")}</td>
    <td class="pact-cell">${d.custom?`<span class="pc-act" onclick="pipeDealModal(${d.ci})" title="Edit">✎</span><span class="pc-act pc-del" onclick="pipeDealDelete(${d.ci})" title="Delete">🗑</span>`:""}</td></tr>`;
  function tPipeline(){
    const ds = liveDeals();
    const total = sum(ds,value), wtd = sum(ds,weighted);
    const confirmed = sum(ds.filter(d=>d.stage==="won_fulfillment"),value);
    const products = [...new Set(ds.map(d=>d.product))]
      .sort((a,b)=>sum(ds.filter(d=>d.product===b),value)-sum(ds.filter(d=>d.product===a),value));
    const totalsRow = `<tr class="ptotal"><td colspan="3"><strong>TOTALS (${ds.length})</strong></td><td class="t-num" colspan="6">${qtyStr(ds)}</td>
      <td class="t-num"><strong>${money(total)}</strong></td><td class="t-num pwt"><strong>${money(wtd)}</strong></td><td colspan="3"></td></tr>`;
    const grouped = products.map(p=>{
      const g = ds.filter(d=>d.product===p);
      return `<tr class="pgroup" data-group="${esc(p)}"><td colspan="9"><strong>${esc(p)}</strong> <span class="pcount">${g.length}</span></td>
        <td class="t-num">${money(sum(g,value))}</td><td class="t-num pwt">${money(sum(g,weighted))}</td><td></td><td class="t-num">${qtyStr(g)}</td><td></td></tr>`+
        g.map(trackerRow).join("");
    }).join("")+totalsRow;
    const flat = [...ds].sort((a,b)=>closeDate(b)-closeDate(a)).map(trackerRow).join("")+totalsRow;
    const view = lsGet(VIEW_KEY,"grouped");
    const sel=(id,label,vals)=>`<select class="pinput" id="${id}" onchange="pipePipeFilter()"><option value="">${label}</option>${vals.map(v=>`<option>${esc(v)}</option>`).join("")}</select>`;
    const quarters=[...new Set(ds.map(quarterOf))].sort(qSort);
    const head=`<thead><tr><th>Customer</th><th>Product</th><th>Sector</th><th>Qty</th><th>Price/Unit</th><th>Order Type</th><th>Close Date</th><th>Stage</th><th>Confidence</th><th>Deal Value</th><th>Weighted Value</th><th>Quarter</th><th>Notes</th><th></th></tr></thead>`;
    return `
      <div class="grid g5">
        ${kpi("Total Pipeline",money(total))}
        ${kpi("Weighted Pipeline",money(wtd),null,"pk-blue")}
        ${kpi("Total Quantity",qtyStr(ds))}
        ${kpi("Active Deals",ds.length)}
        ${kpi("Confirmed Revenue",money(confirmed),null,"pk-green")}
      </div>
      <div class="pdeals-bar">
        <input class="pinput" id="pipePSearch" placeholder="Search…" oninput="pipePipeFilter()">
        ${sel("pipePProduct","All Products",products)}
        ${sel("pipePQuarter","All Quarters",quarters)}
        ${sel("pipePStage","All Stages",P.stages.map(s=>s.label))}
        ${sel("pipePSector","All Sectors",[...new Set(ds.map(d=>d.sector))])}
        ${sel("pipePConf","All Confidence",["Secured","Medium","Low"])}
        <span class="pview">
          <button class="pv-btn${view==="grouped"?" active":""}" data-v="grouped" onclick="pipeView('grouped')">Grouped by Product</button>
          <button class="pv-btn${view==="flat"?" active":""}" data-v="flat" onclick="pipeView('flat')">Flat List</button>
        </span>
        <span class="pcount-lbl" id="pipePCount">${ds.length} rows</span>
        <button class="btn btn-ghost" onclick="pipeDealExport()">⭳ Export CSV</button>
        <button class="btn btn-primary" onclick="pipeDealModal()">＋ Add Deal</button>
      </div>
      ${tblWrap(`${head}
        <tbody id="pipePGrouped" style="display:${view==="grouped"?"":"none"}">${grouped}</tbody>
        <tbody id="pipePFlat" style="display:${view==="flat"?"":"none"}">${flat}</tbody>`)}`;
  }
  window.pipeView=v=>{
    lsSet(VIEW_KEY,v);
    const g=document.getElementById("pipePGrouped"), f=document.getElementById("pipePFlat");
    if(g)g.style.display=v==="grouped"?"":"none";
    if(f)f.style.display=v==="flat"?"":"none";
    document.querySelectorAll(".pview .pv-btn").forEach(b=>b.classList.toggle("active",b.dataset.v===v));
    pipePipeFilter();
  };
  window.pipePipeFilter=()=>{
    const q=(V("pipePSearch")).toLowerCase();
    const fp=V("pipePProduct"), fq=V("pipePQuarter"), fst=V("pipePStage"), fse=V("pipePSector"), fc=V("pipePConf").toLowerCase();
    const stKey=fst?(P.stages.find(s=>s.label===fst)||{}).k:"";
    let visible=0;
    document.querySelectorAll("#pipePGrouped, #pipePFlat").forEach(tb=>{
      const shown=tb.style.display!=="none";
      [...tb.querySelectorAll("tr")].forEach(r=>{
        if(r.classList.contains("pgroup")||r.classList.contains("ptotal")) return;
        const ok=(!q||r.textContent.toLowerCase().includes(q))&&(!fp||r.dataset.product===fp)&&(!fq||r.dataset.quarter===fq)
          &&(!stKey||r.dataset.stage===stKey)&&(!fse||r.dataset.sector===fse)&&(!fc||r.dataset.conf===fc);
        r.style.display=ok?"":"none";
        if(ok&&shown)visible++;
      });
      [...tb.querySelectorAll("tr.pgroup")].forEach(gr=>{
        let any=false, n=gr.nextElementSibling;
        while(n&&!n.classList.contains("pgroup")&&!n.classList.contains("ptotal")){ if(n.style.display!=="none")any=true; n=n.nextElementSibling; }
        gr.style.display=any?"":"none";
      });
    });
    const c=document.getElementById("pipePCount"); if(c)c.textContent=visible+" rows";
  };

  /* ================= TAB 2 · PRODUCTION PLAN ================= */
  const prodQuarters=()=>[...new Set(P.production.quarters.concat(lsGet(QX_KEY,[])))].sort(qSort);
  function tProduction(){
    const quarters=prodQuarters(), products=P.production.products;
    const totals = quarters.map(q=>sum(products,r=>r.mt[q]||0));
    return `
      <div class="pdeals-bar"><h3 class="sub" style="margin:0">Production Plan — planned production capacity (MT) per product</h3>
        <button class="btn btn-ghost" onclick="pipeProductionExport()">⭳ Export CSV</button>
        <button class="btn btn-primary pc-add" onclick="pipeAddQuarter()">＋ Add Quarter</button></div>
      ${tblWrap(`<thead><tr><th>Product Type</th>${quarters.map(q=>`<th class="t-num">${q}</th>`).join("")}</tr></thead>
        <tbody>${products.map(r=>`<tr><td><strong>${esc(r.p)}</strong></td>${quarters.map(q=>{
          const v=r.mt[q]; return `<td class="t-num">${v==null?'<span class="pdim">—</span>':num(v)+' <span class="uom">MT</span>'}</td>`;
        }).join("")}</tr>`).join("")}
        <tr class="ptotal"><td><strong>TOTAL CAPACITY</strong></td>${totals.map(t=>`<td class="t-num"><strong>${num(t)} MT</strong></td>`).join("")}</tr></tbody>`)}
      <div class="note">This grid feeds the Executive Dashboard's Sales vs. Production chart and the Offtake coverage view. Update it as ops confirms quarterly capacity.</div>`;
  }
  window.pipeProductionExport=()=>{ const qs=prodQuarters(); downloadCSV("production-plan.csv",["Product Type",...qs],
    P.production.products.map(r=>[r.p,...qs.map(q=>r.mt[q]??"")])); };
  window.pipeAddQuarter=()=>openModal("Add Quarter",F("pqLabel","Quarter label",null,1,"e.g. Q3 2027"),"Add Quarter","pipeAddQuarterSave()");
  window.pipeAddQuarterSave=()=>{
    const q=V("pqLabel").toUpperCase().replace(/\s+/g," ");
    if(!/^Q[1-4] 20\d{2}$/.test(q)){ alert("Use the format Q3 2027."); return; }
    const arr=lsGet(QX_KEY,[]); if(!arr.includes(q)&&!P.production.quarters.includes(q)) arr.push(q);
    lsSet(QX_KEY,arr); pipeModalClose(); rr();
  };

  /* ================= TAB 3 · EXECUTIVE DASHBOARD ================= */
  const EXECF_KEY="vej_pipe_exec_product";
  function tExec(){
    const filter=lsGet(EXECF_KEY,"");
    const allDs=liveDeals();
    const ds=filter?allDs.filter(d=>d.product===filter):allDs;
    const total=sum(ds,value), wtd=sum(ds,weighted), qty=sum(ds,d=>d.qty);
    const confirmed=sum(ds.filter(d=>d.stage==="won_fulfillment"),value);
    const sc=P.sampleConversions;
    const qs=prodQuarters();
    const confMT=qs.map(q=>sum(ds.filter(d=>d.status==="won"&&quarterOf(d)===q),d=>d.qty));
    const wtdMT=qs.map(q=>sum(ds.filter(d=>quarterOf(d)===q),d=>d.qty*stageOf(d.stage).prob/100));
    const offRows=filter?offRowsAll().filter(r=>r.product===filter):offRowsAll();
    const prodRows=filter?P.production.products.filter(r=>r.p===filter):P.production.products;
    const offMT=qs.map(q=>sum(offRows,r=>+(r.vols[q]||0)));
    const capMT=qs.map(q=>sum(prodRows,r=>r.mt[q]||0));
    const maxMT=Math.max(...confMT,...wtdMT,...offMT,...capMT,1);
    const series=[["Confirmed MT","#5f8a5b",confMT],["Weighted Pipeline MT","#24478a",wtdMT],["Offtake Expected MT","#caa85a",offMT],["Production Capacity","#c4cfe6",capMT]];
    const svp=`<div class="pchart">${qs.map((q,i)=>`<div class="pcol">
        <div class="pbars">${series.map(([n,c,arr])=>`<span class="pbar" style="height:${Math.max(arr[i]/maxMT*100,arr[i]?1.5:0)}%;background:${c}" title="${esc(n)}: ${num(arr[i])} MT"></span>`).join("")}</div>
        <div class="plabel">${q}</div></div>`).join("")}</div>
      <div class="plegend">${series.map(([n,c])=>`<span><i style="background:${c}"></i>${esc(n)}</span>`).join("")}</div>`;
    const maxCnt=Math.max(...P.stages.map(s=>ds.filter(d=>d.stage===s.k).length),1);
    const flow=P.stages.map((s,i)=>{ const c=ds.filter(d=>d.stage===s.k).length;
      return `<div class="phrow"><span class="phl">${esc(s.label)}</span><div class="phtrack"><span class="phfill" style="width:${c/maxCnt*100}%;background:${CAT[i%CAT.length]}">${c||""}</span></div></div>`; }).join("");
    const dq=[...new Set(ds.map(quarterOf))].sort(qSort);
    const prods=[...new Set(ds.map(d=>d.product))];
    const maxQ=Math.max(...dq.map(q=>sum(ds.filter(d=>quarterOf(d)===q),value)),1);
    const rqp=`<div class="pstack-wrap">${dq.map(q=>{ const g=ds.filter(d=>quarterOf(d)===q); const t=sum(g,value);
        return `<div class="phrow"><span class="phl">${q}</span><div class="phtrack pstack" style="width:${t/maxQ*82}%">${prods.map(p=>{
          const v=sum(g.filter(d=>d.product===p),value); return v?`<span style="flex:${v};background:${colorFor(prods,p)}" title="${esc(p)}: ${money(v)}"></span>`:"";
        }).join("")}</div><span class="phv">${money(t)}</span></div>`; }).join("")}</div>
      <div class="plegend">${prods.map(p=>`<span><i style="background:${colorFor(prods,p)}"></i>${esc(p)}</span>`).join("")}</div>`;
    const sectors=[...new Set(ds.map(d=>d.sector))];
    const secVals=sectors.map(s=>sum(ds.filter(d=>d.sector===s),value));
    let acc=0; const slices=sectors.map((s,i)=>{ const p=secVals[i]/(total||1)*100; const seg=`${colorFor(sectors,s)} ${acc}% ${acc+p}%`; acc+=p; return seg; });
    const pie=`<div class="ppie-row"><div class="ppie" style="background:conic-gradient(${slices.join(",")||"var(--paper-2) 0 100%"})"></div>
      <div class="plegend pcol-legend">${sectors.map((s,i)=>`<span><i style="background:${colorFor(sectors,s)}"></i>${esc(s)} · ${Math.round(secVals[i]/(total||1)*100)}%</span>`).join("")}</div></div>`;
    const custs=[...new Set(ds.map(d=>d.customer))].map(c=>({c,v:sum(ds.filter(d=>d.customer===c),value),n:ds.filter(d=>d.customer===c).length})).sort((a,b)=>b.v-a.v);
    const maxC=custs[0]?.v||1;
    const top=custs.slice(0,10).map((x,i)=>`<div class="phrow"><span class="phl">${i+1}. ${esc(x.c)}</span>
      <div class="phtrack"><span class="phfill" style="width:${x.v/maxC*100}%;background:var(--navy-500)"></span></div><span class="phv">${kfmt(x.v)}</span></div>`).join("");
    const rec=ds.filter(d=>d.order==="Recurring"), one=ds.filter(d=>d.order!=="Recurring");
    const rv=sum(rec,value), ov=sum(one,value);
    const rvo=`<div class="psplit"><span style="flex:${rv||0.001};background:#24478a" title="Recurring ${money(rv)}"></span><span style="flex:${ov||0.001};background:#5f8a5b" title="One-Time ${money(ov)}"></span></div>
      <div class="plegend"><span><i style="background:#24478a"></i>Recurring · ${kfmt(rv)} (${rec.length} deals)</span><span><i style="background:#5f8a5b"></i>One-Time · ${kfmt(ov)} (${one.length} deals)</span></div>`;
    const products=[...new Set(allDs.map(d=>d.product))].sort();
    return `
      <div class="pdeals-bar">
        <select class="pinput" onchange="pipeExecFilter(this.value)">
          <option value="">All Products</option>
          ${products.map(p=>`<option${filter===p?" selected":""}>${esc(p)}</option>`).join("")}
        </select>
        <span class="pcount-lbl">${filter?"Scoped to "+esc(filter):"All products"} · ${ds.length} deals</span>
      </div>
      <div class="grid g4 pkpi-grid">
        ${kpi("Total Pipeline",kfmt(total))}
        ${kpi("Weighted Pipeline",kfmt(wtd),null,"pk-purple")}
        ${kpi("Total MT in Pipeline",num(qty))}
        ${kpi("Active Deals",ds.length)}
        ${kpi("Confirmed Revenue",kfmt(confirmed),null,"pk-green")}
        ${kpi("Projected Annual",kfmt(wtd),"Weighted, current year","pk-purple")}
        ${kpi("Sample Conversions",`${sc.converted}/${sc.sampled}`, Math.round(sc.converted/sc.sampled*100)+"% rate · $0")}
      </div>
      <div class="grid g2" style="margin-top:15px">
        <div class="card"><h4>Sales vs. Production by Quarter (MT)</h4>${svp}</div>
        <div class="card"><h4>Deal Flow by Stage</h4>${flow}</div>
        <div class="card"><h4>Revenue by Quarter &amp; Product</h4>${rqp}</div>
        <div class="card"><h4>Revenue by Sector</h4>${pie}</div>
        <div class="card"><h4>Top Customers by Value</h4>${top}</div>
        <div class="card"><h4>Recurring vs. One-Time Orders</h4>${rvo}
          <div class="hr" style="margin:14px 0"></div>
          <h4>Recent Sample Conversions</h4>
          <p style="font-size:12.5px" class="pdim">${sc.converted? "" : "No sample-to-sale conversions yet. Link samples to a won deal to track them here."}</p></div>
      </div>`;
  }
  window.pipeExecFilter=v=>{ lsSet(EXECF_KEY,v); const pane=document.querySelector('.pipe-pane[data-tab="exec"]'); if(pane) pane.innerHTML=tExec(); };

  /* ================= TAB 4 · OFFTAKE PIPELINE =================
     "Confirmed" = the snapshot baseline PLUS any won deal the team adds that matches this
     row's customer + product + quarter. Win a deal → the offtake confirmed figure moves. */
  const OGRP_KEY="vej_pipe_offtake_group";
  function confirmedFor(row,q){
    const base=+(row.confirmed?.[q]||0);
    const extra=sum(liveDeals().filter(d=>d.custom&&d.status==="won"&&d.uom==="MT"&&norm(d.customer)===norm(row.customer)&&norm(d.product)===norm(row.product)&&quarterOf(d)===q),d=>d.qty);
    return base+extra;
  }
  function tOfftake(){
    const quarters=P.offtake.quarters;
    const rows=offRowsAll();
    const annual = r => sum(quarters,q=>+(r.vols[q]||0))*r.price;
    const totQ = quarters.map(q=>sum(rows,r=>+(r.vols[q]||0)));
    const revQ = quarters.map(q=>sum(rows,r=>+(r.vols[q]||0)*r.price));
    const cfQ  = quarters.map(q=>sum(rows,r=>confirmedFor(r,q)));
    const confB = c => `<span class="pbadge ${c==="Low"?"cf-low":c==="High"?"cf-secured":"cf-medium"}">${esc(c)}</span>`;
    const grouped=lsGet(OGRP_KEY,false);
    const oRow=r=>`<tr><td><strong>${esc(r.customer)}</strong></td><td>${esc(r.product)}</td><td class="pnote" title="${esc(r.sector)}">${esc(r.sector)}</td><td>${confB(r.conf)}</td>
      ${quarters.map(q=>{ const v=r.vols[q]; const c=confirmedFor(r,q);
        return `<td class="t-num">${v==null?'<span class="pdim">—</span>':num(v)}${c?`<div class="pconf-sub">✓ ${num(c)} confirmed</div>`:""}</td>`; }).join("")}
      <td class="t-num">$${r.price}</td><td><span class="pbadge pfreq">${esc(r.freq)}</span></td>
      <td class="t-num pannual">${money(annual(r))}</td>
      <td class="pact-cell">${r.base?"":`<span class="pc-act" onclick="pipeOfftakeModal(${r.ci})" title="Edit">✎</span><span class="pc-act pc-del" onclick="pipeOfftakeDelete(${r.ci})" title="Delete">🗑</span>`}</td></tr>`;
    let body;
    if(grouped){
      const prods=[...new Set(rows.map(r=>r.product))];
      body=prods.map(p=>{
        const g=rows.filter(r=>r.product===p);
        return `<tr class="pgroup"><td colspan="4"><strong>${esc(p)}</strong> <span class="pcount">${g.length}</span></td>
          ${quarters.map(q=>`<td class="t-num">${num(sum(g,r=>+(r.vols[q]||0)))}</td>`).join("")}
          <td></td><td></td><td class="t-num pannual">${money(sum(g,annual))}</td><td></td></tr>`+g.map(oRow).join("");
      }).join("");
    } else body=rows.map(oRow).join("");
    return `
      <div class="pdeals-bar">
        <button class="pv-btn${grouped?" active":""}" onclick="pipeOfftakeGroup(${!grouped})">≣ By Product</button>
        <span class="pcount-lbl">${rows.length} rows · <span style="color:var(--green-deep)">green = confirmed (won deals)</span></span>
        <button class="btn btn-ghost" onclick="pipeOfftakeExport()">⭳ Export CSV</button>
        <button class="btn btn-primary pc-add" onclick="pipeOfftakeModal()">＋ Add Row</button>
      </div>
      ${tblWrap(`<thead><tr><th>Customer</th><th>Product</th><th>Sector</th><th>Conf.</th>${quarters.map(q=>`<th class="t-num">${q}</th>`).join("")}<th class="t-num">Price/MT</th><th>Freq.</th><th class="t-num">Annual Rev.</th><th></th></tr></thead>
      <tbody>${body}
      <tr class="ptotal"><td colspan="4"><strong>Total Expected (MT)</strong></td>${totQ.map(t=>`<td class="t-num"><strong>${num(t)}</strong></td>`).join("")}<td colspan="2"></td><td class="t-num pannual"><strong>${money(sum(rows,annual))}</strong></td><td></td></tr>
      <tr class="prev"><td colspan="4">Revenue (MT × Price/MT)</td>${revQ.map(t=>`<td class="t-num">${t?money(t):"—"}</td>`).join("")}<td colspan="4"></td></tr>
      <tr class="pconf-row"><td colspan="4">✓ Confirmed Sales (Won Deals)</td>${cfQ.map(t=>`<td class="t-num">${t?num(t)+" MT":"—"}</td>`).join("")}<td colspan="4"></td></tr>
      </tbody>`)}
      <div class="note">Row notes worth keeping in view: ${P.offtake.rows.filter(r=>r.notes).map(r=>`<b>${esc(r.customer)} (${esc(r.product)})</b> — ${esc(r.notes).replace(/\n/g,"<br>")}`).join(" · ")}</div>`;
  }
  window.pipeOfftakeGroup=on=>{ lsSet(OGRP_KEY,!!on); rr(); };
  window.pipeOfftakeExport=()=>{ const qs=P.offtake.quarters; downloadCSV("offtake-pipeline.csv",
    ["Customer","Product","Sector","Confidence","Price/MT","Frequency",...qs,...qs.map(q=>q+" confirmed"),"Annual Rev."],
    offRowsAll().map(r=>[r.customer,r.product,r.sector,r.conf,r.price,r.freq,...qs.map(q=>r.vols[q]??""),...qs.map(q=>confirmedFor(r,q)||""),sum(qs,q=>+(r.vols[q]||0))*r.price])); };
  window.pipeOfftakeModal=ci=>{
    const cur=(ci!=null&&ci>=0)?lsGet(O_KEY,[])[ci]:{vols:{}};
    if(!cur) return;
    const quarters=P.offtake.quarters;
    const body=`
      ${F("poCustomer","Customer",cur.customer,1)}
      ${SEL("poProduct","Product",productNames(),cur.product)}
      ${F("poSector","Sector",cur.sector)}
      <div class="pcf-grid">
        ${SEL("poConf","Confidence",["High","Medium","Low"],cur.conf||"Medium")}
        ${SEL("poFreq","Frequency",["Recurring","One-Time"],cur.freq||"Recurring")}
      </div>
      ${F("poPrice","Price per MT ($)",cur.price,1,"","number")}
      <div class="pcf"><label>Expected MT per quarter</label><div class="pcf-grid pcf-g3">${quarters.map((q,i)=>`<div class="pcf"><label>${q}</label><input class="pinput" id="poQ${i}" type="number" min="0" value="${cur.vols?.[q]??""}"></div>`).join("")}</div></div>
      ${F("poNotes","Notes",cur.notes)}`;
    openModal((ci!=null&&ci>=0?"Edit":"Add")+" Offtake Row",body,ci!=null&&ci>=0?"Save Changes":"Add Row",`pipeOfftakeSave(${ci!=null&&ci>=0?ci:-1})`);
  };
  window.pipeOfftakeSave=ci=>{
    const customer=V("poCustomer"), price=parseFloat(V("poPrice"));
    if(!customer||!(price>0)){ alert("Customer and a price per MT are required."); return; }
    const vols={};
    P.offtake.quarters.forEach((q,i)=>{ const v=V("poQ"+i); if(v!=="") vols[q]=+v; });
    const rec={customer, product:V("poProduct"), sector:V("poSector"), conf:V("poConf"), freq:V("poFreq"), price, vols, confirmed:{}, notes:V("poNotes")};
    const arr=lsGet(O_KEY,[]);
    if(ci>=0) arr[ci]=rec; else arr.push(rec);
    lsSet(O_KEY,arr); pipeModalClose(); rr();
  };
  window.pipeOfftakeDelete=ci=>{
    const arr=lsGet(O_KEY,[]); const r=arr[ci];
    if(!r) return; if(!confirm(`Delete offtake row for "${r.customer}" (${r.product})?`)) return;
    arr.splice(ci,1); lsSet(O_KEY,arr); rr();
  };

  /* ================= TAB 5 · DEALS (flat list, full CRUD) ================= */
  function tDeals(){
    const ds=[...liveDeals()].sort((a,b)=>closeDate(b)-closeDate(a));
    return `
      <div class="pdeals-bar"><input class="pinput" id="pipeDealSearch" placeholder="Search deals…" oninput="pipeDealFilter()">
        <select class="pinput" id="pipeDealStatus" onchange="pipeDealFilter()"><option value="">All Status</option><option>open</option><option>won</option><option>lost</option></select>
        <select class="pinput" id="pipeDealStage" onchange="pipeDealFilter()"><option value="">All Stages</option>${P.stages.map(s=>`<option value="${s.k}">${esc(s.label)}</option>`).join("")}</select>
        <span class="pcount-lbl" id="pipeDealCount">${ds.length} deals</span>
        <button class="btn btn-ghost" onclick="pipeDealExport()">⭳ Export CSV</button>
        <button class="btn btn-primary" onclick="pipeDealModal()">＋ Add Deal</button></div>
      ${tblWrap(`<thead><tr><th>Deal Name</th><th>Account</th><th>Product</th><th>Stage</th><th class="t-num">Value</th><th>Close Date</th><th>Status</th><th>Assigned To</th><th></th></tr></thead>
      <tbody id="pipeDealsTbl">${ds.map(d=>`<tr data-stage="${d.stage}" data-status="${d.status}" title="${esc(d.notes||"")}">
        <td><strong>${esc(d.deal)}</strong></td><td>${esc(d.customer)}</td><td>${esc(d.product)}</td><td>${stBadge(d,false)}</td>
        <td class="t-num">${money(value(d))}</td><td class="t-num">${fmtDate(d)}</td>
        <td><span class="pbadge ${d.status==="won"?"st-won":d.status==="lost"?"cf-low":"pfreq"}">${esc(d.status)}</span></td>
        <td>${esc(d.owner)}</td>
        <td class="pact-cell">${d.custom?`<span class="pc-act" onclick="pipeDealModal(${d.ci})" title="Edit">✎</span><span class="pc-act pc-del" onclick="pipeDealDelete(${d.ci})" title="Delete">🗑</span>`:`<span class="pdim" title="Imported from the SIBRA snapshot — read-only">—</span>`}</td></tr>`).join("")}</tbody>`)}`;
  }
  window.pipeDealFilter = () => {
    const q=(V("pipeDealSearch")).toLowerCase();
    const st=V("pipeDealStage"), su=V("pipeDealStatus");
    let n=0;
    document.querySelectorAll("#pipeDealsTbl tr").forEach(r=>{
      const ok=(!q||r.textContent.toLowerCase().includes(q))&&(!st||r.dataset.stage===st)&&(!su||r.dataset.status===su);
      r.style.display=ok?"":"none"; if(ok)n++;
    });
    const c=document.getElementById("pipeDealCount"); if(c)c.textContent=n+" deals";
  };

  /* ================= TAB 6 · CONTACTS ================= */
  const getCustom=()=>lsGet(C_KEY,[]);
  const saveCustom=a=>lsSet(C_KEY,a);
  const chip = t => t?`<span class="pchip">☎ ${esc(t)}</span>`:"";
  function tContacts(){
    const cs=allContacts();
    const accounts=[...new Set(liveAccounts().map(a=>a.name).concat(cs.map(c=>c.account)))].filter(Boolean).sort();
    return `
      <div class="pdeals-bar">
        <input class="pinput" id="pipeCSearch" placeholder="Search contacts…" oninput="pipeContactFilter()">
        <select class="pinput" id="pipeCAccount" onchange="pipeContactFilter()"><option value="">All Accounts</option>${accounts.map(a=>`<option>${esc(a)}</option>`).join("")}</select>
        <span class="pcount-lbl" id="pipeCCount">${cs.length} contacts</span>
        <button class="btn btn-ghost" onclick="pipeContactExport()">⭳ Export CSV</button>
        <button class="btn btn-primary pc-add" onclick="pipeContactModal()">Add Contact</button>
      </div>
      ${tblWrap(`<thead><tr><th>Name</th><th>Job Title</th><th>Account</th><th>Email / Phone</th><th>Drop-off Address</th><th>Actions</th></tr></thead>
      <tbody id="pipeCTbl">${cs.map(c=>`<tr data-account="${esc(c.account||"")}">
        <td title="${esc(c.notes||"")}"><strong>${esc(c.name)}</strong></td><td>${esc(c.title||"—")}</td><td>${esc(c.account||"—")}</td>
        <td>${c.email?`<a href="mailto:${esc(c.email)}">${esc(c.email)}</a><br>`:""}${chip(c.phone)}${c.mobile?` ${chip(c.mobile)} <span class="pdim" style="font-size:10.5px">(mobile)</span>`:""}</td>
        <td class="pnote">${esc(c.dropOff||"—")}</td>
        <td class="pact-cell">${c.base?`<span class="pdim" title="From the SIBRA snapshot — edit in pipeline-data.js">—</span>`
          :`<span class="pc-act" onclick="pipeContactModal(${c.ci})" title="Edit">✎</span>
            <span class="pc-act pc-del" onclick="pipeContactDelete(${c.ci})" title="Delete">🗑</span>`}</td></tr>`).join("")}</tbody>`)}`;
  }
  window.pipeContactExport=()=>downloadCSV("contacts.csv",["Name","Job Title","Account","Email","Phone","Mobile","Drop-off Address","Notes"],
    allContacts().map(c=>[c.name,c.title,c.account,c.email,c.phone,c.mobile,c.dropOff,c.notes]));
  window.pipeContactFilter=()=>{
    const q=(V("pipeCSearch")).toLowerCase();
    const a=V("pipeCAccount");
    let n=0;
    document.querySelectorAll("#pipeCTbl tr").forEach(r=>{
      const ok=(!q||r.textContent.toLowerCase().includes(q))&&(!a||r.dataset.account===a);
      r.style.display=ok?"":"none"; if(ok)n++;
    });
    const c=document.getElementById("pipeCCount"); if(c)c.textContent=n+" contacts";
  };
  window.pipeContactModal=idx=>{
    const cur=(idx!=null&&idx>=0)?getCustom()[idx]:{};
    if(!cur) return;
    const accounts=accountNames();
    const body=`
      <div class="pcf-grid">${F("pcFirst","First Name",cur.first,1)}${F("pcLast","Last Name",cur.last,1)}</div>
      <div class="pcf"><label>Account *</label><select class="pinput" id="pcAccount">
        <option value="">Select account…</option>${accounts.map(a=>`<option${cur.account===a?" selected":""}>${esc(a)}</option>`).join("")}
        <option value="__new"${cur.account&&!accounts.includes(cur.account)?" selected":""}>+ New account…</option></select></div>
      <div class="pcf" id="pcNewAccountWrap" style="display:${cur.account&&!accounts.includes(cur.account)?"block":"none"}"><label>New account name</label><input class="pinput" id="pcNewAccount" value="${esc(cur.account&&!accounts.includes(cur.account)?cur.account:"")}"></div>
      ${F("pcTitle","Job Title",cur.title)}
      <div class="pcf-grid">${F("pcEmail","Email",cur.email)}${F("pcPhone","Phone",cur.phone)}</div>
      ${F("pcMobile","Mobile Phone",cur.mobile)}
      <details class="pc-details"${cur.dropOff?" open":""}><summary>⚲ Add Address / Drop-off Info</summary>
        ${F("pcDrop","Drop-off Address",cur.dropOff,0,"Street, City, State, Zip")}</details>
      <div class="pcf"><label>Notes</label><textarea class="pinput" id="pcNotes" rows="3">${esc(cur.notes||"")}</textarea></div>`;
    openModal((idx!=null&&idx>=0?"Edit":"Add")+" Contact",body,idx!=null&&idx>=0?"Save Changes":"Add Contact",`pipeContactSave(${idx!=null&&idx>=0?idx:-1})`);
    document.getElementById("pcAccount").addEventListener("change",e=>{
      document.getElementById("pcNewAccountWrap").style.display=e.target.value==="__new"?"block":"none";
    });
    document.getElementById("pcFirst").focus();
  };
  window.pipeContactSave=idx=>{
    const first=V("pcFirst"), last=V("pcLast");
    let account=V("pcAccount"); if(account==="__new") account=V("pcNewAccount");
    if(!first||!last||!account){ alert("First name, last name, and account are required."); return; }
    const rec={ name:first+" "+last, first, last, account, title:V("pcTitle"), email:V("pcEmail"),
      phone:V("pcPhone"), mobile:V("pcMobile"), dropOff:V("pcDrop"), notes:V("pcNotes") };
    const arr=getCustom();
    if(idx>=0) arr[idx]=rec; else arr.push(rec);
    saveCustom(arr); pipeModalClose(); rr();
  };
  window.pipeContactDelete=idx=>{
    const arr=getCustom(); const c=arr[idx];
    if(!c) return; if(!confirm(`Delete contact "${c.name}"?`)) return;
    arr.splice(idx,1); saveCustom(arr); rr();
  };

  /* ================= TAB 7 · LEADS (CRUD + convert-to-deal) ================= */
  const LEAD_ST={converted:"st-won",qualified:"st-discovery",contacted:"cf-medium",new:"cf-secured",disqualified:"cf-low"};
  function tLeads(){
    const ls=allLeads();
    const statuses=[...new Set(ls.map(l=>l.status))];
    return `
      <div class="pdeals-bar">
        <input class="pinput" id="pipeLSearch" placeholder="Search leads…" oninput="pipeLeadFilter()">
        <select class="pinput" id="pipeLStatus" onchange="pipeLeadFilter()"><option value="">All Status</option>${statuses.map(s=>`<option>${esc(s)}</option>`).join("")}</select>
        <span class="pcount-lbl" id="pipeLCount">${ls.length} leads</span>
        <button class="btn btn-ghost" onclick="pipeLeadExport()">⭳ Export CSV</button>
        <button class="btn btn-primary pc-add" onclick="pipeLeadModal()">Add Lead</button>
      </div>
      ${tblWrap(`<thead><tr><th>Contact</th><th>Company</th><th>Email</th><th>Phone</th><th>Source</th><th>Status</th><th>Actions</th></tr></thead>
      <tbody id="pipeLTbl">${ls.map(l=>`<tr data-status="${esc(l.status)}">
        <td><strong>${esc(l.contact)}</strong></td><td>${esc(l.company)}</td>
        <td>${l.email?`<a href="mailto:${esc(l.email)}">${esc(l.email)}</a>`:"—"}</td><td>${chip(l.phone)||"—"}</td>
        <td><span class="pbadge pfreq">${esc(l.source)}</span></td>
        <td><span class="pbadge ${LEAD_ST[l.status]||"pfreq"}">${esc(l.status)}</span>${l.converted?`<div class="pconf-sub">✓ ${esc(l.convertedTo)}${l.convertedDate?" ("+l.convertedDate+")":""}</div>`:""}</td>
        <td class="pact-cell">${l.converted?"":`<span class="pc-act pc-conv" onclick="pipeLeadConvert(${l.base?-1:l.ci},'${esc(l.company).replace(/'/g,"\\'")}','${esc(l.contact).replace(/'/g,"\\'")}')" title="Convert to deal">➜</span>`}
          ${l.base?`<span class="pdim" title="From the SIBRA snapshot">—</span>`
          :`<span class="pc-act" onclick="pipeLeadModal(${l.ci})" title="Edit">✎</span><span class="pc-act pc-del" onclick="pipeLeadDelete(${l.ci})" title="Delete">🗑</span>`}</td></tr>`).join("")}</tbody>`)}`;
  }
  window.pipeLeadExport=()=>downloadCSV("leads.csv",["Contact","Company","Email","Phone","Source","Status","Converted To","Converted Date"],
    allLeads().map(l=>[l.contact,l.company,l.email,l.phone,l.source,l.status,l.convertedTo||"",l.convertedDate||""]));
  window.pipeLeadFilter=()=>{
    const q=(V("pipeLSearch")).toLowerCase();
    const s=V("pipeLStatus");
    let n=0;
    document.querySelectorAll("#pipeLTbl tr").forEach(r=>{
      const ok=(!q||r.textContent.toLowerCase().includes(q))&&(!s||r.dataset.status===s);
      r.style.display=ok?"":"none"; if(ok)n++;
    });
    const c=document.getElementById("pipeLCount"); if(c)c.textContent=n+" leads";
  };
  window.pipeLeadConvert=(ci,company,contact)=>{
    /* open the Deal modal prefilled from the lead; on save it creates the deal
       and (for custom leads) flips the lead to converted. */
    pipeDealModal(null,{ deal:company+": New Deal", customer:company, notes:"Converted from lead — "+contact, stage:"discovery_qualified", __leadCi:ci>=0?ci:null });
  };
  window.pipeLeadModal=ci=>{
    const cur=(ci!=null&&ci>=0)?lsGet(L_KEY,[])[ci]:{};
    if(!cur) return;
    const body=`
      <div class="pcf-grid">${F("plContact","Contact Name",cur.contact,1)}${F("plCompany","Company",cur.company,1)}</div>
      <div class="pcf-grid">${F("plEmail","Email",cur.email)}${F("plPhone","Phone",cur.phone)}</div>
      <div class="pcf-grid">
        ${SEL("plSource","Source",["website","referral","outbound","event","other"],cur.source||"outbound")}
        ${SEL("plStatus","Status",["new","contacted","qualified","converted","disqualified"],cur.status||"new")}
      </div>
      <div class="pcf"><label>Notes</label><textarea class="pinput" id="plNotes" rows="3">${esc(cur.notes||"")}</textarea></div>`;
    openModal((ci!=null&&ci>=0?"Edit":"Add")+" Lead",body,ci!=null&&ci>=0?"Save Changes":"Add Lead",`pipeLeadSave(${ci!=null&&ci>=0?ci:-1})`);
  };
  window.pipeLeadSave=ci=>{
    const contact=V("plContact"), company=V("plCompany");
    if(!contact||!company){ alert("Contact name and company are required."); return; }
    const st=V("plStatus");
    const rec={contact, company, email:V("plEmail"), phone:V("plPhone"), source:V("plSource"), status:st, notes:V("plNotes"), converted:st==="converted"};
    const arr=lsGet(L_KEY,[]);
    if(ci>=0){ rec.convertedTo=arr[ci]?.convertedTo; rec.convertedDate=arr[ci]?.convertedDate; arr[ci]=rec; } else arr.push(rec);
    lsSet(L_KEY,arr); pipeModalClose(); rr();
  };
  window.pipeLeadDelete=ci=>{
    const arr=lsGet(L_KEY,[]); const l=arr[ci];
    if(!l) return; if(!confirm(`Delete lead "${l.contact}" (${l.company})?`)) return;
    arr.splice(ci,1); lsSet(L_KEY,arr); rr();
  };

  /* ================= TAB 8 · REPORTS ================= */
  function tReports(){
    const ds=liveDeals();
    const won=ds.filter(d=>d.status==="won"), lost=ds.filter(d=>d.status==="lost");
    const closed=won.length+lost.length;
    const wonV=sum(won,value);
    const open=ds.filter(d=>d.status==="open");
    const maxSt=Math.max(...P.stages.map(s=>sum(open.filter(d=>d.stage===s.k),value)),1);
    const stageBars=P.stages.map((s,i)=>{ const v=sum(open.filter(d=>d.stage===s.k),value);
      return `<div class="phrow"><span class="phl">${esc(s.label)}</span><div class="phtrack"><span class="phfill" style="width:${v/maxSt*100}%;background:${CAT[i%CAT.length]}"></span></div><span class="phv">${v?money(v):"—"}</span></div>`; }).join("");
    const srcOf=d=>{ const l=allLeads().find(l=>l.converted&&l.convertedTo===d.deal); return l?l.source:"Direct"; };
    const sources=[...new Set(ds.map(srcOf))];
    const maxSrc=Math.max(...sources.map(s=>sum(ds.filter(d=>srcOf(d)===s&&d.status==="won"),value)),1);
    const srcBars=sources.map((s,i)=>{
      const g=ds.filter(d=>srcOf(d)===s), w=g.filter(d=>d.status==="won");
      return `<div class="phrow"><span class="phl">${esc(s)}</span><div class="phtrack"><span class="phfill" style="width:${sum(w,value)/maxSrc*100}%;background:${CAT[i%CAT.length]}"></span></div><span class="phv">${money(sum(w,value))}</span></div>
        <div class="pdim" style="font-size:11px;margin:-4px 0 6px 148px">${g.length} deals · ${w.length} won</div>`; }).join("");
    const ls=allLeads();
    const convLeads=ls.filter(l=>l.converted).length;
    return `
      <div class="grid g4">
        ${kpi("Win Rate",closed?Math.round(won.length/closed*100)+"%":"—",`${won.length} won / ${closed} closed`)}
        ${kpi("Revenue Won",money(wonV),`${won.length} deals`)}
        ${kpi("Avg Deal Size",won.length?money(wonV/won.length):"—","won deals")}
        ${kpi("Lead Conversion",ls.length?Math.round(convLeads/ls.length*100)+"%":"—",`${convLeads} / ${ls.length} leads`)}
      </div>
      <div class="grid g2" style="margin-top:15px">
        <div class="card"><h4>Open Pipeline by Stage ($)</h4>${stageBars}</div>
        <div class="card"><h4>Performance by Source</h4>${srcBars}</div>
        <div class="card"><h4>Activity Summary</h4><p class="pdim" style="font-size:12.5px">No activity data</p></div>
      </div>`;
  }

  /* ================= SECTION ================= */
  function rCRM(){
    const at=activeTab();
    const panes=[["pipeline",tPipeline],["production",tProduction],["exec",tExec],["offtake",tOfftake],["deals",tDeals],["contacts",tContacts],["leads",tLeads],["reports",tReports]];
    return `<section class="section" id="sec-crm">
      <h1 class="pipe-h">Sales Pipeline</h1>
      <div class="pipe-tabs">${TABS.map(([id,t])=>`<span class="pill${id===at?" active":""}" data-tab="${id}" onclick="pipeTab('${id}')">${t}</span>`).join("")}</div>
      ${panes.map(([id,fn])=>`<div class="pipe-pane${id===at?" active":""}" data-tab="${id}">${fn()}</div>`).join("")}
    </section>`;
  }

  window.PIPELIVE = { rCRM };
})();
