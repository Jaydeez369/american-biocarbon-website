/* ============ American BioCarbon, router & renderers ============ */
const $ = s => document.querySelector(s);
const esc = s => String(s??"").replace(/&(?!amp;|lt;|gt;|#)/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;");
// allow pre-escaped entities in copy (we author with &amp; etc.)
const raw = s => String(s??"");

/* ---- analytics (privacy-preserving, backend-agnostic) ----
   Pushes to window.dataLayer (GA4/GTM-ready) and window.abcEvents.
   Never sends PII (no field values), only event names + non-identifying context. */
window.dataLayer = window.dataLayer || [];
window.abcEvents = window.abcEvents || [];
function track(event, props={}){
  const payload = { event, ...props, ts: Date.now() };
  window.dataLayer.push(payload);
  window.abcEvents.push(payload);
  if(window.ABC_DEBUG) console.debug("[abc:track]", payload);
  // If a real analytics client is wired later (gtag/plausible/internal), forward here:
  if(typeof window.gtag==="function") window.gtag("event", event, props);
}
// Global click delegation for CTAs and audience lanes, one listener, no per-element wiring.
document.addEventListener("click", e=>{
  const lane = e.target.closest(".lane");
  if(lane){ track("lane_select", { dest: lane.getAttribute("href"), label: lane.querySelector("b")?.textContent?.trim() }); return; }
  const b = e.target.closest("a.btn, a.cta-mini");
  if(b){ track("cta_click", { dest: b.getAttribute("href"), label: b.textContent.trim().slice(0,40) }); }
});

/* ---- hero product carousel ---- */
let _heroTimer = null;
function initHeroCarousel(){
  if(_heroTimer){ clearInterval(_heroTimer); _heroTimer = null; }
  const car = document.getElementById("heroCarousel"); if(!car) return;
  const slides = [...car.querySelectorAll(".hslide")];
  const dots = [...car.querySelectorAll(".hdot")];
  if(slides.length < 2) return;
  let i = 0;
  const go = n => { i = (n + slides.length) % slides.length;
    slides.forEach((s,k)=>{ const on = k===i; s.classList.toggle("active", on); s.setAttribute("aria-hidden", on?"false":"true"); });
    dots.forEach((d,k)=>{ d.classList.toggle("active", k===i); d.setAttribute("aria-selected", k===i?"true":"false"); }); };
  const stop = () => { if(_heroTimer){ clearInterval(_heroTimer); _heroTimer = null; } car.classList.add("paused"); };
  const restart = () => { if(_heroTimer) clearInterval(_heroTimer); _heroTimer = setInterval(()=>go(i+1), 7000); };
  // Clicking a dot selects that slide and pauses the carousel on it indefinitely.
  dots.forEach(d => d.addEventListener("click", ()=>{ go(+d.dataset.i); stop(); }));
  restart();
}

/* ---- shared components ---- */
function btn(cta, cls="btn-primary"){ return `<a class="btn ${cls}" href="${cta.href}">${raw(cta.label)}</a>`; }
function proofBand(){
  return `<div class="proofband"><div class="wrap"><div class="row">
    ${PROOF.items.map(p=>`<div class="p"><div class="ic"><img src="${p.icon}" alt=""></div>
      <div><b>${raw(p.title)}</b><span>${raw(p.sub)}</span></div></div>`).join("")}
  </div></div></div>`;
}
function carbonPillar(c){
  return `<section class="block carbon-pillar"><div class="wrap">
    <div class="cp-grid">
      <div class="cp-lead">
        <div class="kicker" style="color:#e0a97f">${raw(c.kicker)}</div>
        <h2>${raw(c.h)}</h2>
        <p class="cp-body">${raw(c.body)}</p>
        <p class="cp-thesis">${raw(c.lead)}</p>
        <div class="cp-metrics">
          ${c.metrics.map(m=>`<div class="cp-m"><b>${raw(m.n)}</b><span>${raw(m.l)}</span></div>`).join("")}
        </div>
      </div>
      <div class="cp-side">
        ${c.audiences.map(a=>`<div class="cp-aud"><b>${raw(a.who)}</b><p>${raw(a.val)}</p></div>`).join("")}
        <div class="btn-row" style="margin-top:4px">${btn(c.primary)}${btn(c.secondary,"btn-ghost-light")}</div>
      </div>
    </div>
  </div></section>`;
}
function socialProof(s){
  if(!s) return "";
  const ph = s.placeholder ? `<div class="dev-note" style="margin-top:22px">↳ Placeholder scaffold, replace logos, stats, and the quote with real, attributable proof before publishing.</div>` : "";
  return `<section class="block social-proof"><div class="wrap">
    <div class="eyebrow-line"></div>
    <div class="kicker">${raw(s.kicker)}</div>
    <h2>${raw(s.h)}</h2>
    <p class="lead" style="margin-bottom:26px">${raw(s.sub)}</p>
    <div class="logo-strip">${s.logos.map(l=>`<div class="logo-tile" role="img" aria-label="${raw(l)} (placeholder)">${raw(l)}</div>`).join("")}</div>
    <div class="proof-stats">
      ${s.stats.map(st=>`<div class="ps"><b>${raw(st.n)}</b><span>${raw(st.l)}</span><em>${raw(st.note)}</em></div>`).join("")}
    </div>
    <figure class="proof-quote">
      <blockquote>${raw(s.quote.text)}</blockquote>
      <figcaption>${raw(s.quote.who)} · <span>${raw(s.quote.org)}</span></figcaption>
    </figure>
    ${ph}
  </div></section>`;
}
function audienceRouter(a){
  if(!a) return "";
  return `<section class="block audience"><div class="wrap">
    <div class="eyebrow-line"></div>
    <div class="kicker">${raw(a.kicker)}</div>
    <h2>${raw(a.h)}</h2>
    <p class="lead" style="margin-bottom:26px">${raw(a.sub)}</p>
    <div class="lanes">
      ${a.lanes.map(l=>`<a class="lane" href="${l.href}">
        <b>${raw(l.tag)}</b><span>${raw(l.desc)}</span>
        <em>${raw(l.cta)} →</em></a>`).join("")}
    </div>
  </div></section>`;
}
function ctaBand(c){
  return `<section class="block"><div class="wrap"><div class="ctaband">
    <h2>${raw(c.h)}</h2><p>${raw(c.sub)}</p>
    <div class="btn-row">${btn(c.primary)}${btn(c.secondary,"btn-ghost-light")}${c.tertiary?btn(c.tertiary,"btn-ghost-light"):""}</div>
  </div></div></section>`;
}
function faqBlock(items){
  return `<section class="block"><div class="wrap"><div class="eyebrow-line"></div><h2>Frequently asked</h2>
    <div class="faq" style="margin-top:24px;max-width:820px">
    ${items.map(f=>`<details><summary>${raw(f.q)}</summary><div class="a">${raw(f.a)}</div></details>`).join("")}
    </div></div></section>`;
}
function ucGrid(list){
  return `<div class="ucgrid">${list.map((u,i)=>`<div class="uc"><span class="uc-i">${String(i+1).padStart(2,"0")}</span><span class="uc-t">${raw(u)}</span><svg class="uc-mark" viewBox="0 0 24 24" aria-hidden="true"><path d="M7 17 17 7M17 7H9M17 7v8" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg></div>`).join("")}</div>`;
}
function specTable(rows){
  return `<div class="tbl"><table><tbody>${rows.map(r=>`<tr><td>${raw(r[0])}</td><td>${raw(r[1])}</td></tr>`).join("")}</tbody></table></div>`;
}
function cmpTable(c){
  return `<div class="tbl"><table><thead><tr>${c.cols.map(h=>`<th>${raw(h)}</th>`).join("")}</tr></thead>
    <tbody>${c.rows.map(r=>`<tr>${r.map(x=>`<td>${raw(x)}</td>`).join("")}</tr>`).join("")}</tbody></table></div>`;
}

/* ---- header / footer ---- */
function renderChrome(){
  $("#navLogo").src = ASSETS.logoRev;
  $("#menu").innerHTML = NAV.map(n=>{
    if(n.children){ return `<div class="item"><span>${raw(n.label)} ▾</span>
      <div class="dropdown">${n.children.map(c=>`<a href="${c.href}">${raw(c.label)}</a>`).join("")}</div></div>`; }
    return `<div class="item"><a href="${n.href}">${raw(n.label)}</a></div>`;
  }).join("");
  $("#footer").innerHTML = `<div class="cols">
    <div>
      <img class="logo" src="${ASSETS.logoRev}" alt="American BioCarbon">
      <p class="addr">${raw(BRAND.legal)}<br>${raw(BRAND.address)}<br>${raw(BRAND.location)}</p>
      <div class="foot-cta"><a class="btn btn-primary btn-sm" href="#/request-sample">Get a free sample</a><a class="cta-link-light" href="#/request-quote">Talk to us about volume</a></div>
    </div>
    <div><h4>Products</h4>
      <a href="#/product/absorbent-pellets">Absorbent Pellets</a><a href="#/product/absorbent-crumble">Absorbent Crumble</a>
      <a href="#/product/agricultural-biochar">100% Biochar</a><a href="#/product/biochar-infused-soil">Biochar-Infused Soil</a>
      <a href="#/product/carbon-removal">Carbon Removal</a></div>
    <div><h4>Industries</h4>
      <a href="#/industry/oil-gas">Oil &amp; Gas</a><a href="#/industry/industrial-remediation">Industrial Remediation</a>
      <a href="#/industry/spill-response">Spill Response</a><a href="#/industry/landfill-leachate">Landfill Leachate</a>
      <a href="#/industry/distributors">Distributors</a><a href="#/industry/soil-blenders">Soil Blenders &amp; Compost</a></div>
    <div><h4>Resources</h4>
      <a href="#/technical">Certifications &amp; Technical Data</a><a href="#/compare">Compare vs Wood Pellets</a>
      <a href="#/about">About</a><a href="#/contact">Contact</a>
      <a href="#/request-sample">Request Sample</a><a href="#/request-quote">Request Quote</a></div>
  </div>
  <div class="legal"><span>© ${new Date().getFullYear()} ${raw(BRAND.name)}. All rights reserved.</span>
    <span class="mono">Preview build · copy pending final claim verification</span></div>`;
  const burger = $("#burger");
  burger.onclick = () => {
    const open = $("#menu").classList.toggle("open");
    burger.setAttribute("aria-expanded", String(open));
    burger.setAttribute("aria-label", open ? "Close menu" : "Open menu");
  };
  // make dropdown parent labels keyboard-focusable
  document.querySelectorAll('.menu>.item>span').forEach(s=>{ s.setAttribute("tabindex","0"); s.setAttribute("role","button"); s.setAttribute("aria-haspopup","true"); });
  // skip-link → focus main without polluting the hash router
  const skip = document.querySelector(".skip-link");
  if(skip) skip.addEventListener("click", e=>{ e.preventDefault(); const m=$("#app"); m.focus(); m.scrollIntoView(); });
}

/* ================= HOME ================= */
function renderHome(){
  const H = HOME;
  // Homepage product showcase: one alternating section per product, each with its own
  // custom kraft sample bag (6 bags total, tailored per product).
  const zig = (HOME.buy.products||[]).map((p,i)=>{
    const isLive = p.avail==="live";
    const primary = isLive ? {label:"Shop",href:"#/shop/"+p.id} : {label:"Get a free sample",href:"#/request-sample?preorder=1&product="+p.id};
    const secondary = isLive ? {label:"Get a free sample",href:"#/request-sample?product="+p.id} : null;
    return `
  <section class="block" style="background:${i%2?'var(--paper-2)':'var(--white)'}"><div class="wrap"><div class="split${i%2?' rev':''} bleed">
    <div class="media"><img src="${p.img}" alt="${raw(p.name)}"></div>
    <div>
      <div class="kicker">${raw(p.category)}${isLive?"":" · Coming Q4"}</div>
      <h2 style="font-size:30px;margin:8px 0 12px">${raw(p.name)}</h2>
      <p class="lead">${raw(p.claim)}</p>
      <ul class="checks">${(p.uses||[]).map(u=>`<li>${raw(u)}</li>`).join("")}</ul>
      <div class="btn-row">${btn(primary)}${secondary?btn(secondary,"btn-ghost"):""}</div>
      ${isLive?`<p class="freenote">Free sample. Shipping and handling included.</p>`:""}
    </div>
  </div></div></section>`;
  }).join("");
  const HS = H.hero.slides;
  return `
  <section class="hero" id="heroCarousel" aria-roledescription="carousel" aria-label="Product highlights">
    ${HS.map((s,i)=>{ const Ht = i===0?"h1":"h2"; return `
      <div class="hslide${i===0?" active":""}" role="group" aria-roledescription="slide" aria-label="${i+1} of ${HS.length}: ${raw(s.label)}" aria-hidden="${i===0?"false":"true"}">
        <img class="hslide-img" src="${s.img}" alt="${raw(s.label)}" style="object-position:${s.pos||'50% 55%'};--z:${s.zoom||1.05};--o:${s.origin||'50% 55%'}" ${i?'loading="lazy"':'fetchpriority="high"'}>
        <div class="hslide-scrim"></div>
        <div class="hslide-content">
          <div class="wrap">
            <div class="hslide-kicker">${raw(s.label)}</div>
            <${Ht} class="hslide-h">${raw(s.h)}</${Ht}>
            <p class="hslide-sub">${raw(s.sub)}</p>
            <div class="btn-row hslide-btns">${btn(s.primary)}${btn(s.secondary,"btn-ghost-light")}</div>
          </div>
        </div>
      </div>`; }).join("")}
    <div class="hnav" role="tablist" aria-label="Choose product slide"><div class="hnav-inner wrap">${HS.map((s,i)=>`<button class="hdot${i===0?" active":""}" role="tab" aria-selected="${i===0?"true":"false"}" data-i="${i}"><span class="hdot-track"><span class="hdot-fill"></span></span><span class="hdot-row"><span class="hdot-num">${String(i+1).padStart(2,"0")}</span><span class="hdot-label">${raw(s.label)}</span></span></button>`).join("")}</div></div>
  </section>
  ${proofBand()}


  <section class="block" id="specs"><div class="wrap">
    <div class="eyebrow-line"></div>
    <div class="kicker">Specifications · vs. the status quo</div>
    <h2 style="margin-top:6px">${raw(H.comparison.h)}</h2>
    <p class="lead" style="margin-bottom:6px">Our sugarcane-bagasse holds up to 5× its weight in liquid, roughly double what wood or clay manages. It holds its weight where the status quo can't: the same spill takes about half the bags and sends less weight to disposal.</p>
    <p class="lead" style="margin-bottom:22px">${raw(H.comparison.sub)}</p>
    <div class="tbl tbl-hi"><table><thead><tr>${H.comparison.cols.map(c=>`<th>${raw(c)}</th>`).join("")}</tr></thead>
      <tbody>${H.comparison.rows.map(r=>`<tr>${r.map(x=>`<td>${raw(x)}</td>`).join("")}</tr>`).join("")}</tbody></table></div>
    <div class="btn-row" style="margin-top:22px">${btn(H.comparison.cta,"btn-dark")}</div>
  </div></section>

  <section class="block" style="padding-bottom:0"><div class="wrap">
    <div class="eyebrow-line"></div><h2>Our products</h2>
    <p class="lead" style="max-width:62ch">One bagasse platform, engineered for your buyers, from industrial absorbents to soil.</p>
  </div></section>
  ${zig}

  ${carbonPillar(H.carbon)}

  <section class="block"><div class="wrap">
    <div class="kicker">Applications</div><h2 style="margin-top:6px">Where it's used</h2>
    <div style="margin-top:26px">${ucGrid(H.useCases)}</div>
  </div></section>

  ${ctaBand(H.finalCta)}`;
}

/* ================= PRODUCT ================= */
function renderProduct(id){
  const p = PRODUCTS[id]; if(!p) return notFound();
  setMeta(p.seo);
  return `
  <section class="phead"><div class="wrap"><div class="grid">
    <div>
      <div class="crumb"><a href="#/">Home</a> / ${raw(p.name)}</div>
      <h1>${raw(p.h1)}</h1>
      <p class="sub">${raw(p.sub)}</p>
      <div class="btn-row">${btn(p.primary)}${btn(p.secondary,"btn-ghost-light")}${p.tertiary?btn(p.tertiary,"btn-ghost-light"):""}</div>
      <div class="proofrow">${p.proofRow.map(x=>`<span>${raw(x)}</span>`).join("")}</div>
    </div>
    <div class="media"><img src="${p.image}" alt="${raw(p.name)}"></div>
  </div></div></section>

  <section class="block"><div class="wrap two-col-copy">
    <div><div class="kicker">The problem</div><h2 style="font-size:26px;margin:8px 0 12px">${raw(p.problem.h)}</h2><p class="lead">${raw(p.problem.body)}</p></div>
    <div><div class="kicker">Why it's different</div><h2 style="font-size:26px;margin:8px 0 12px">${raw(p.explanation.h)}</h2><p class="lead">${raw(p.explanation.body)}</p></div>
  </div></section>

  <section class="block" style="background:var(--paper-2)"><div class="wrap">
    <div class="kicker">Applications</div><h2 style="margin-top:6px">Use cases</h2>
    <div style="margin-top:26px">${ucGrid(p.useCases)}</div>
  </div></section>

  <section class="block"><div class="wrap"><div class="split">
    <div><div class="eyebrow-line"></div><h2 style="font-size:28px">Specifications</h2>
      <p class="lead" style="margin:10px 0 18px">Request the full spec sheet and SDS for test conditions and handling.</p>
      ${specTable(p.specs)}</div>
    <div><div class="eyebrow-line"></div><h2 style="font-size:28px">${raw(p.comparison.h)}</h2>
      <div style="margin-top:18px">${cmpTable(p.comparison)}</div></div>
  </div></div></section>

  <section class="block" style="background:var(--paper-2)"><div class="wrap">
    <div class="split">
      <div><div class="kicker">Proof</div><h2 style="font-size:26px;margin:8px 0 12px">Certified and lab-verified</h2>
        <ul class="checks">${PROOF.certs.filter(c=>c.status!=="pending").slice(0,4).map(c=>`<li><b>${raw(c.name)}</b>, ${raw(c.note)}</li>`).join("")}</ul>
        <p class="form-note">USDA Organic certification pending. Verify current certification language before publishing.</p>
      </div>
      <div class="formcard" id="pform"></div>
    </div>
  </div></section>

  ${faqBlock(p.faq)}

  <section class="block"><div class="wrap">
    <h3 style="font-size:16px;text-transform:uppercase;letter-spacing:1px;color:var(--mute);margin-bottom:14px" class="mono">Related</h3>
    <div class="btn-row">${p.internal.map(h=>`<a class="btn btn-ghost btn-sm" href="${h}">${linkLabel(h)} →</a>`).join("")}</div>
  </div></section>`;
}

/* ================= INDUSTRY ================= */
function renderIndustry(id){
  const n = INDUSTRIES[id]; if(!n) return notFound();
  setMeta(n.seo);
  const prods = (n.products||[]).map(pid=>PRODUCTS[pid]).filter(Boolean);
  return `
  <section class="phead"><div class="wrap"><div class="grid">
    <div>
      <div class="crumb"><a href="#/">Home</a> / Industries / ${raw(n.name)}</div>
      <h1>${raw(n.h1)}</h1>
      <p class="sub">${raw(n.sub)}</p>
      <div class="btn-row">${btn(n.primary)}${btn(n.secondary,"btn-ghost-light")}</div>
      <div class="proofrow">${n.proof.map(x=>`<span>${raw(x)}</span>`).join("")}</div>
    </div>
    <div class="media"><img src="${n.image}" alt="${raw(n.name)}"></div>
  </div></div></section>

  <section class="block"><div class="wrap two-col-copy">
    <div><div class="kicker">The problem</div><h2 style="font-size:26px;margin:8px 0 12px">What you're up against</h2><p class="lead">${raw(n.problem)}</p></div>
    <div><div class="kicker">The fit</div><h2 style="font-size:26px;margin:8px 0 12px">How we solve it</h2><p class="lead">${raw(n.fit)}</p></div>
  </div></section>

  <section class="block" style="background:var(--paper-2)"><div class="wrap">
    <div class="kicker">Applications</div><h2 style="margin-top:6px">Use cases</h2>
    <div style="margin-top:26px">${ucGrid(n.useCases)}</div>
  </div></section>

  <section class="block"><div class="wrap"><div class="split">
    <div>
      <div class="kicker">Procurement</div><h2 style="font-size:26px;margin:8px 0 14px">Built for how you buy</h2>
      <ul class="checks">${n.procurement.map(x=>`<li>${raw(x)}</li>`).join("")}</ul>
      ${prods.length?`<div class="btn-row" style="margin-top:18px">${prods.map(p=>`<a class="btn btn-ghost btn-sm" href="#/product/${prodId(p)}">${raw(p.name)} →</a>`).join("")}</div>`:""}
    </div>
    <div class="formcard" id="pform"></div>
  </div></div></section>

  ${industryTech(id)}
  ${faqBlock(n.faq)}
  ${ctaBand({h:"Ready to test it on your next job?",sub:"Get a free sample. If it performs, we'll talk volume and pricing. A specialist follows up within one business day.",primary:CTA.sample,secondary:CTA.quote})}`;
}
function industryTech(id){
  const ids = TECH.byIndustry[id]; if(!ids||!ids.length) return "";
  const docs = ids.map(d=>TECH.docs.find(x=>x.id===d)).filter(Boolean);
  const studies = id==="soil-blenders" ? TECH.studies.filter(s=>s.type!=="lab").slice(0,3) : [];
  return `<section class="block" style="background:var(--graphite);color:#eef5f1"><div class="wrap">
    <div class="kicker" style="color:#a6ceb8">Technical Data · gated</div>
    <h2 style="color:#fff;font-size:26px;margin:8px 0 10px">Documentation for your application</h2>
    <p style="color:#cce0d4;max-width:640px">${raw(TECH.gateNote)}</p>
    <div class="doclist" style="margin-top:22px">
      ${docs.map(d=>`<div class="docrow dark"><div><b>${raw(d.name)}</b><span>${raw(d.desc)}</span></div>
        <a class="btn btn-primary btn-sm" href="#/request-docs?ind=${id}">Request</a></div>`).join("")}
      ${studies.map(s=>`<div class="docrow dark"><div><b>${raw(s.title)}</b><span>${raw(s.venue)}, ${raw(s.finding)}</span></div>
        <a class="btn btn-ghost-light btn-sm" href="#/request-docs?ind=${id}">Request</a></div>`).join("")}
    </div>
    <div class="btn-row" style="margin-top:22px">${btn(CTA.docs,"btn-primary")}</div>
  </div></section>`;
}

/* ================= FORM PAGE ================= */
function renderForm(kind, qs){
  const f = FORMS[kind]; if(!f) return notFound();
  setMeta({title:f.name+" | American BioCarbon", desc:f.sub, slug:"/"+kind});
  return `
  <section class="phead"><div class="wrap"><div style="max-width:760px">
    <div class="crumb"><a href="#/">Home</a> / ${raw(f.name)}</div>
    <h1>${raw(f.h)}</h1><p class="sub">${raw(f.sub)}</p>
  </div></div></section>
  <section class="block"><div class="wrap"><div class="formwrap">
    <div class="formcard" id="mainform"></div>
  </div></div></section>`;
}
function buildForm(kind, mountSel){
  const f = FORMS[kind]; const mount = $(mountSel); if(!f||!mount) return;
  mount.innerHTML = `<form id="lf">
    <div class="formgrid">
      ${f.fields.map(fieldHTML).join("")}
    </div>
    <button type="submit" class="btn btn-primary" style="margin-top:20px;width:100%">${raw(f.h.replace(/^Request an |^Get a |^Get |^Request |^Talk to a /,'').startsWith('Industrial')?'Send Request':'Submit')}</button>
    <p class="form-note">By submitting, you agree to be contacted about your request. We reply within one business day.</p>
    <div class="dev-note">↳ Preview: submits are captured locally (no backend). Wire to internal app, routing: ${raw(f.routing)}</div>
  </form>`;
  // reveal an "other" text box when a select's Other/Something-else option is chosen
  $("#lf").querySelectorAll("select").forEach(sel=>{
    const other = sel.parentElement.querySelector(".other-input");
    if(!other) return;
    const sync=()=>{ const on=/^other$/i.test(sel.value)||/something else/i.test(sel.value);
      other.hidden=!on; other.required=on&&sel.required; if(!on) other.value=""; if(on) other.focus(); };
    sel.addEventListener("change", sync); sync();
  });
  $("#lf").addEventListener("submit", e=>{
    e.preventDefault();
    track("lead_submit", { form: kind, routing: (f.routing||"").split(".")[0] }); // event only, no field values
    mount.innerHTML = `<div class="form-success">✓ ${raw(f.confirm)}</div>
      <div class="dev-note" style="margin-top:16px"><b>Auto-reply preview:</b><br>${raw(f.autoreply).replace(/\n/g,"<br>")}</div>`;
    window.scrollTo({top:mount.getBoundingClientRect().top+window.scrollY-120,behavior:"smooth"});
  });
}
function fieldHTML(fl){
  const req = fl.req?` <span class="req">*</span>`:"";
  const full = (fl.type==="textarea"||fl.n==="useCase"||fl.n==="volume")?" full":"";
  const id = `f_${fl.n}`;
  let input;
  if(fl.type==="select"){
    const hasOther = fl.options.some(o=>/^other$/i.test(o)||/something else/i.test(o));
    input=`<select id="${id}" name="${fl.n}" ${fl.req?"required":""}><option value="">Select…</option>${fl.options.map(o=>`<option>${raw(o)}</option>`).join("")}</select>`;
    if(hasOther){ input+=`<input type="text" class="other-input" name="${fl.n}_other" hidden aria-label="${raw(fl.label)}, please specify" placeholder="${raw(fl.otherPh||"Please specify")}">`; }
  }
  else if(fl.type==="textarea"){ input=`<textarea id="${id}" name="${fl.n}" ${fl.req?"required":""} placeholder="${raw(fl.ph||"")}"></textarea>`; }
  else { input=`<input id="${id}" type="${fl.type}" name="${fl.n}" ${fl.req?"required":""} placeholder="${raw(fl.ph||"")}">`; }
  return `<div class="field${full}"><label for="${id}">${raw(fl.label)}${req}</label>${input}</div>`;
}

/* ================= COMPARE ================= */
function buyCard(p){
  const isLive = p.avail==="live";
  const docLink = id => `<a href="#/request-docs?doc=${id}&product=${p.id}">${id==="sds"?"SDS":"Spec sheet"}</a>`;
  const docs = isLive
    ? `<div class="buy-docs">${(p.docIds||[]).map(docLink).join("<span>·</span>")}</div>`
    : `<div class="buy-docs muted">Spec sheet coming</div>`;
  const primary = isLive
    ? `<a class="btn btn-primary btn-sm" href="#/shop/${p.id}">Shop</a>`
    : `<a class="btn btn-primary btn-sm" href="#/request-sample?preorder=1&product=${p.id}">Get a free sample</a>`;
  const cta = isLive
    ? `<div class="btn-row">${primary}</div>
       <a class="notify" href="#/request-quote?product=${p.id}">Talk to us about volume →</a>`
    : `<div class="btn-row">${primary}</div>`;
  return `<div class="card pcard buycard${isLive?"":" is-q4"}" data-cat="${raw(p.cat||"")}">
    <div class="thumb"><img src="${p.img}" alt="${raw(p.name)}" loading="lazy">
      <span class="avail ${isLive?"avail-live":"avail-q4"}">${isLive?"Live · ships 4 to 7 biz days":"Coming Q4"}</span></div>
    <div class="body">
      <span class="icp">${raw(p.category)}</span>
      <h3>${raw(p.name)}</h3>
      ${isLive?`<div class="cardprice free">Free sample</div>`:""}
      <p class="claim">${raw(p.claim)}</p>
      ${p.uses?`<ul class="uses">${p.uses.map(u=>`<li>${raw(u)}</li>`).join("")}</ul>`:""}
      <div class="chips">${(p.chips||[]).filter(c=>/sample bag/i.test(c)).map(c=>`<span>${raw(c)}</span>`).join("")}</div>
      <div class="availline">${isLive?"Free sample ships in 4 to 7 business days. Bulk and truckload by quote.":"Coming Q4. Request a sample on a 30-day lead time."}</div>
      ${docs}
      ${cta}
    </div>
  </div>`;
}
// Shared product accent palette.
const ACCENTS = { aqua:{a:"#19c2b0",b:"#0d8478",ink:"#06403a"}, amber:{a:"#f4ad3e",b:"#d1791b",ink:"#7a3f06"}, soil:{a:"#93a267",b:"#61713a",ink:"#333d1e"} };
// Custom mylar sample-bag mockup, tinted to the product accent, with the real product
// photo showing through a center window so the bag reads as full. uid keeps SVG ids unique.
function sampleBag(accent, name, weight, photoUrl, uid){
  const c = ACCENTS[accent] || ACCENTS.aqua;
  const win = photoUrl ? `<image href="${photoUrl}" x="70" y="198" width="220" height="176" clip-path="url(#win-${uid})" preserveAspectRatio="xMidYMid slice"/>` : "";
  return `<svg viewBox="0 0 360 490" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="${raw(name)} sample bag">
    <defs>
      <linearGradient id="bg-${uid}" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${c.a}"/><stop offset="1" stop-color="${c.b}"/></linearGradient>
      <clipPath id="win-${uid}"><rect x="70" y="198" width="220" height="176" rx="12"/></clipPath>
    </defs>
    <ellipse cx="180" cy="470" rx="118" ry="12" fill="#000" opacity=".10"/>
    <rect x="150" y="24" width="60" height="20" rx="10" fill="${c.b}"/><circle cx="180" cy="34" r="5" fill="#fff" opacity=".7"/>
    <rect x="40" y="44" width="280" height="410" rx="16" fill="url(#bg-${uid})"/>
    <rect x="40" y="44" width="280" height="24" rx="12" fill="#fff" opacity=".18"/>
    <rect x="40" y="432" width="280" height="22" rx="10" fill="#000" opacity=".10"/>
    <polygon points="74,44 120,44 66,454 46,454" fill="#fff" opacity=".08"/>
    <text x="180" y="98" text-anchor="middle" font-family="'IBM Plex Mono',monospace" font-size="12.5" letter-spacing="2.5" fill="#fff" opacity=".92">AMERICAN BIOCARBON</text>
    <text x="180" y="142" text-anchor="middle" font-family="'DM Serif Display',Georgia,serif" font-size="29" fill="#fff">${raw(name)}</text>
    <text x="180" y="170" text-anchor="middle" font-family="'IBM Plex Mono',monospace" font-size="10.5" letter-spacing="1.5" fill="#fff" opacity=".82">SAMPLE · 100% BAGASSE</text>
    <rect x="64" y="192" width="232" height="188" rx="15" fill="#fff"/>
    ${win}
    <rect x="118" y="398" width="124" height="30" rx="15" fill="#fff"/>
    <text x="180" y="418" text-anchor="middle" font-family="'IBM Plex Mono',monospace" font-size="13" font-weight="600" fill="${c.ink}">NET WT ${raw(weight)}</text>
  </svg>`;
}
// Small line icons used on the kraft sample bag.
function bagIcon(i){
  const p = [
    `<path d="M9 3h6M10 3v5l-5 11a2 2 0 0 0 2 3h10a2 2 0 0 0 2-3L14 8V3"/>`,               // flask (biomass)
    `<path d="M5 9a7 7 0 0 1 11-3M19 15a7 7 0 0 1-11 3"/><path d="M16 4v3h-3M8 20v-3h3"/>`, // recycle (waste)
    `<path d="M12 3c4 5 5 8 5 10a5 5 0 0 1-10 0c0-2 1-5 5-10Z"/>`,                          // water drop (retention)
    `<path d="M12 21v-9"/><path d="M12 14c-4 0-6-3-6-6 4 0 6 3 6 6Z"/><path d="M12 12c4 0 6-3 6-6-4 0-6 3-6 6Z"/>`, // sprout (root)
  ][i] || "";
  return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round">${p}</svg>`;
}
// Faithful kraft sample-bag mockup matching the print mechanicals: tan stand-up pouch,
// logo, accent banner, four feature icons, use-cases, oval product window, OMRI badge,
// description, ingredients, and footer. Uses container queries so text scales with size.
function kraftBag(p){
  const b = p.bag;
  if(!b) return sampleBag(p.accent, p.name, p.sampleWeight||"", p.photo, "fb-"+p.id);
  const acc = ACCENTS[p.accent] || ACCENTS.aqua;
  const cert = b.omri
    ? `<div class="kb-omri"><span>CERTIFIED</span><b>OMRI</b><i>LISTED</i></div>`
    : `<div class="kb-omri kb-omri-gen"><span>CERTIFIED</span></div>`;
  return `<div class="kbag" style="--acc:${acc.b}">
    <div class="kb-body">
      <img class="kb-logo" src="${ASSETS.logoColor}" alt="American BioCarbon" />
      <div class="kb-banner">${raw(b.banner)}</div>
      <div class="kb-icons">${b.icons.map((l,i)=>`<div class="kb-ic"><span class="kb-ig">${bagIcon(i)}</span><span class="kb-il">${raw(l)}</span></div>`).join("")}</div>
      <div class="kb-uses">${raw(b.uses)}</div>
      <div class="kb-mid">
        <div class="kb-cover">COVERS<br>SAMPLE<br><b>NET WT ${raw(p.sampleWeight||"")}<br>SAMPLE</b></div>
        <div class="kb-window">${p.photo?`<img src="${p.photo}" alt="" />`:""}</div>
        <div class="kb-cert">${cert}<div class="kb-learn">LEARN MORE</div></div>
      </div>
      <p class="kb-desc">${raw(b.desc)}</p>
      <div class="kb-ing">INGREDIENTS: ${raw(b.ingredients)}</div>
      <div class="kb-foot">americanbiocarbon.com&nbsp; | &nbsp;32525 Highway 1 South, White Castle, LA 70788</div>
    </div>
  </div>`;
}
// Flat truckload-leaving-facility scene, tinted to a product accent (aqua / amber / soil).
function truckScene(accent, label){
  const c = { aqua:{a:"#17b3a3",b:"#0c7d72",ink:"#06403a"}, amber:{a:"#f0a63a",b:"#d0781a",ink:"#7a3f06"}, soil:{a:"#8a9a5b",b:"#5f6f39",ink:"#333d1e"} }[accent] || {a:"#5ea07b",b:"#2d6a4f",ink:"#123522"};
  return `<div class="scene"><svg viewBox="0 0 600 440" preserveAspectRatio="xMidYMid slice" role="img" aria-label="${raw(label||"Truckloads from our facility")}">
    <defs><linearGradient id="g-${accent}" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="${c.a}"/><stop offset="1" stop-color="${c.b}"/></linearGradient></defs>
    <rect width="600" height="440" fill="url(#g-${accent})"/>
    <g opacity=".10" fill="#fff"><circle cx="80" cy="70" r="46"/><circle cx="520" cy="60" r="30"/></g>
    <!-- facility -->
    <g fill="#fff" opacity=".92">
      <rect x="60" y="150" width="150" height="150" rx="4"/>
      <rect x="92" y="110" width="26" height="45"/><rect x="150" y="96" width="26" height="60"/>
      <polygon points="60,150 135,120 210,150"/>
    </g>
    <g fill="${c.ink}" opacity=".28"><rect x="80" y="185" width="30" height="30"/><rect x="125" y="185" width="30" height="30"/><rect x="170" y="185" width="26" height="30"/></g>
    <!-- road -->
    <rect x="0" y="330" width="600" height="70" fill="${c.ink}" opacity=".25"/>
    <g stroke="#fff" stroke-width="5" stroke-dasharray="34 26" opacity=".6"><line x1="0" y1="365" x2="600" y2="365"/></g>
    <!-- truck -->
    <g>
      <rect x="250" y="238" width="210" height="92" rx="6" fill="#fff"/>
      <rect x="460" y="262" width="70" height="68" rx="6" fill="#fff"/>
      <rect x="476" y="276" width="40" height="30" rx="3" fill="${c.ink}" opacity=".3"/>
      <circle cx="300" cy="336" r="22" fill="${c.ink}"/><circle cx="300" cy="336" r="9" fill="#fff"/>
      <circle cx="495" cy="336" r="22" fill="${c.ink}"/><circle cx="495" cy="336" r="9" fill="#fff"/>
    </g>
  </svg>${label?`<span class="scene-tag">${raw(label)}</span>`:""}</div>`;
}
const SHOP_DOMAIN = "https://americanbiocarbon.com";
function renderShopProduct(id){
  const p = (HOME.buy.products||[]).find(x=>x.id===id);
  if(!p) return notFound();
  setMeta({title:`${p.name}, ${p.unit||"Buy"} | American BioCarbon`, desc:p.desc||p.claim, slug:"/shop/"+id});
  // gallery slides: the custom sample bag first, then the real product photos
  const photos = (p.gallery && p.gallery.length) ? p.gallery : (p.img ? [p.img] : []);
  const slides = photos.map(src=>({src}));
  const slideHTML = (s,i,ctx)=> `<div class="pdp-slide${i===0?" active":""}" data-slide="${i}"><img src="${s.src}" alt="${raw(p.name)}"></div>`;
  return `
  <section class="block" style="padding-top:34px"><div class="wrap">
    <div class="crumb" style="margin-bottom:22px"><a href="#/buy">Shop</a> / ${raw(p.name)}</div>
    <div class="pdp">
      <div class="pdp-media">
        <div class="pdp-main">${slides.map((s,i)=>slideHTML(s,i,"m")).join("")}</div>
        <div class="pdp-thumbs">${slides.map((s,i)=>`<button class="pdp-thumb${i===0?" active":""}" data-slide="${i}" aria-label="View ${i+1}"><img src="${s.src}" alt=""></button>`).join("")}</div>
      </div>
      <div class="pdp-info">
        <span class="avail avail-live" style="position:static;display:inline-block;margin-bottom:14px">Live · ships 4 to 7 biz days</span>
        <h1>${raw(p.name)}${p.unit?", "+raw(p.unit):""}</h1>
        <div class="pdp-price free">Free sample <span>· shipping &amp; handling included</span></div>
        <p class="pdp-lead">${raw(p.claim)}</p>
        ${p.uses?`<ul class="uses" style="margin:12px 0 14px">${p.uses.map(u=>`<li>${raw(u)}</li>`).join("")}</ul>`:""}
        <div class="chips" style="margin:0 0 18px">${(p.chips||[]).map(c=>`<span>${raw(c)}</span>`).join("")}</div>
        <a class="btn btn-primary" href="#/request-sample?product=${p.id}" style="width:100%;justify-content:center">Get a free sample</a>
        <div class="pdp-links" style="margin-top:12px">
          <a href="#/request-quote?product=${p.id}">Talk to us about volume</a>
          <span>·</span>
          <a href="#/request-docs?doc=spec&product=${p.id}">Download spec sheet</a>
        </div>
        <p class="pdp-secure">Free ${raw(p.sampleWeight||"")} sample. Ships in 4 to 7 business days from White Castle, LA.</p>
        ${p.truckloadQ4?`<p class="pdp-secure" style="color:var(--dim)">Bulk bag and truckload supply available Q4.</p>`:""}
      </div>
    </div>
  </div></section>

  <section class="block" style="background:var(--paper-2);padding-top:44px"><div class="wrap">
    <div class="pdp-details">
      <div class="eyebrow-line"></div><h2>Product details</h2>
      <p class="lead" style="max-width:70ch">${raw(p.desc||p.claim)}</p>
      ${(p.sections||[]).map(s=>`<div class="pdp-sec"><h3>${raw(s.h)}</h3><p>${raw(s.body)}</p></div>`).join("")}
      <div class="btn-row" style="margin-top:26px">
        <a class="btn btn-dark" href="#/request-docs?doc=spec&product=${p.id}">Download Spec Sheet</a>
        <a class="btn btn-ghost" href="#/request-docs?doc=sds&product=${p.id}">Download SDS</a>
        <a class="btn btn-ghost" href="#/request-sample?product=${p.id}">Get a free sample</a>
      </div>
      <p class="pdp-meta" style="margin-top:16px">Ships from White Castle, Louisiana. ${p.truckloadQ4?"Truckload supply available Q4.":""}</p>
    </div>
  </div></section>`;
}
// PDP gallery: click a thumbnail to show that slide (bag mockup or product photo)
document.addEventListener("click", e=>{
  const t = e.target.closest(".pdp-thumb"); if(!t) return;
  const media = t.closest(".pdp-media"); if(!media) return;
  const i = t.dataset.slide;
  media.querySelectorAll(".pdp-slide").forEach(s=>s.classList.toggle("active", s.dataset.slide===i));
  media.querySelectorAll(".pdp-thumb").forEach(x=>x.classList.toggle("active", x===t));
});
function renderBuy(){
  const B = HOME.buy;
  const live = B.products.filter(p=>p.avail==="live");
  const q4 = B.products.filter(p=>p.avail==="q4");
  const filters = B.filters.map((f,i)=>`<button class="filter-btn${i===0?" active":""}" data-filter="${raw(f)}">${raw(f)}</button>`).join("");
  const group = (label, list) => list.length ? `
    <div class="shop-group">
      <div class="shop-group-h">${raw(label)} <span class="count">(${list.length})</span></div>
      <div class="cards c3 shop-grid">${list.map(buyCard).join("")}</div>
    </div>` : "";
  return `
  <section class="shop-head"><div class="wrap">
    <div class="crumb"><a href="#/">Home</a> / Buy Online</div>
    <h1>Shop</h1>
    <p class="shop-sub">Free samples ship in 4 to 7 business days · bulk bag and truckload by freight-aware quote.</p>
  </div></section>

  <section class="block" style="padding-top:28px"><div class="wrap">
    <div class="shop-layout">
      <aside class="shop-filters" aria-label="Filter products">
        <div class="filt-h">Filter</div>
        ${filters}
      </aside>
      <div class="shop-main">
        ${group("Available now", live)}
        ${group("Coming Q4 2026", q4)}
        <p class="shop-doc">Spec sheets, SDS &amp; OMRI listing (biochar) available on request, <a href="#/technical">Technical Data →</a></p>
      </div>
    </div>
  </div></section>`;
}
// filter behavior: clicking a category shows only matching products; the rest disappear.
// availability groups (Available now / Coming Q4) keep their badges so matches stay differentiated.
document.addEventListener("click", e=>{
  const btn = e.target.closest(".filter-btn"); if(!btn) return;
  const f = btn.dataset.filter;
  document.querySelectorAll(".filter-btn").forEach(b=>b.classList.toggle("active", b===btn));
  document.querySelectorAll(".buycard").forEach(c=>{
    const match = f==="All" || c.dataset.cat===f;
    c.classList.toggle("card-hidden", !match);
  });
  document.querySelectorAll(".shop-group").forEach(g=>{
    const shown = [...g.querySelectorAll(".buycard")].filter(c=>!c.classList.contains("card-hidden")).length;
    g.classList.toggle("group-hidden", shown===0);
    const cnt = g.querySelector(".count"); if(cnt) cnt.textContent = `(${shown})`;
  });
  const main = document.querySelector(".shop-main");
  if(main) window.scrollTo({ top: main.getBoundingClientRect().top + window.scrollY - 90, behavior:"smooth" });
  track("shop_filter", { filter: f });
});
function renderCompare(){
  setMeta({title:"Bagasse vs Wood Pellet Absorbent, Comparison | American BioCarbon",desc:"Compare bagasse absorbent pellets vs wood pellets and clay: absorption, bag count, disposal weight, and renewability.",slug:"/compare",keyword:"wood pellet alternative absorbent"});
  return `
  <section class="phead"><div class="wrap"><div style="max-width:820px">
    <div class="crumb"><a href="#/">Home</a> / Compare</div>
    <h1>Bagasse vs Wood Pellets vs Clay</h1>
    <p class="sub">The same spill, roughly half the bags. Figures reflect available product data for non-viscous liquids, request the spec sheet for test conditions.</p>
    <div class="btn-row">${btn(CTA.sample)}${btn(CTA.spec,"btn-ghost-light")}</div>
  </div></div></section>
  <section class="block"><div class="wrap">
    <div class="tbl tbl-hi"><table><thead><tr>${HOME.comparison.cols.map(c=>`<th>${raw(c)}</th>`).join("")}</tr></thead>
      <tbody>${HOME.comparison.rows.map(r=>`<tr>${r.map(x=>`<td>${raw(x)}</td>`).join("")}</tr>`).join("")}</tbody></table></div>
    <div class="callout" style="margin-top:22px"><b>Why it matters for procurement:</b> higher absorption per bag lowers bag count, crew handling, and disposal weight, the three costs that add up on every job. A trial pallet lets you measure it head-to-head against what you use today.</div>
  </div></section>
  ${ctaBand({h:"See it hold twice the load",sub:"Request a sample kit and run bagasse against your current sorbent on the next spill.",primary:CTA.sample,secondary:CTA.quote})}`;
}

/* ================= TECHNICAL DATA / RESOURCES (gated) ================= */
function renderTechnical(){
  setMeta({title:"Technical Data & Research | American BioCarbon",desc:"Certifications, spec sheets, SDS, independent lab analyses, and peer-reviewed research for bagasse absorbents and biochar. Request the technical package.",slug:"/technical",keyword:"bagasse biochar technical data"});
  const sBadge = s => ({verified:'<span class="badge b-ok">Verified</span>',lab:'<span class="badge b-lab">Lab-tested</span>',field:'<span class="badge b-lab">Field study</span>',pending:'<span class="badge b-pend">Pending</span>'}[s]||"");
  const tBadge = t => ({peer:'<span class="badge b-ok">Peer-reviewed</span>',field:'<span class="badge b-lab">Field study</span>',lab:'<span class="badge b-lab">Lab report</span>'}[t]||"");
  // Document library, condensed card grid. Each doc: clickable title, Download, View.
  // Files are gated until Victor supplies PDFs; hrefs route to the request flow and
  // swap to real file paths (d.file) the moment those exist, one field per doc.
  const docHref = d => d.file ? d.file : `#/request-docs?doc=${d.id}`;
  const docCards = TECH.docs.map(d=>{
    const href = docHref(d); const dl = d.file ? `download` : "";
    return `<div class="doccard">
      <div class="dc-top"><span class="fmt">▼ ${raw(d.fmt||"PDF")}</span><span class="cat">${raw(d.cat)}</span></div>
      <a class="dc-title" href="${href}" ${dl}>${raw(d.name)}</a>
      <p class="dc-desc">${raw(d.desc)}</p>
      <div class="dc-actions">
        <a class="dc-dl" href="${href}" ${dl}>${d.file?"Download":"Request"} ${raw(d.fmt||"PDF")}</a>
        <a class="dc-view" href="${href}" ${d.file?'target="_blank" rel="noopener"':""}>${d.file?"View":"Preview on request"} →</a>
      </div></div>`;
  }).join("");
  const indRows = Object.keys(TECH.byIndustry).map(id=>{
    const n = INDUSTRIES[id]; const docs = TECH.byIndustry[id].map(x=>TECH.docs.find(d=>d.id===x)?.name.split(", ")[0]).filter(Boolean);
    return `<tr><td><strong>${raw(n?n.name:id)}</strong></td><td>${docs.map(d=>raw(d)).join(" · ")}</td>
      <td><a class="btn btn-ghost btn-sm" href="#/request-docs?ind=${id}">Request</a></td></tr>`;
  }).join("");
  return `
  <section class="phead"><div class="wrap"><div style="max-width:840px">
    <div class="crumb"><a href="#/">Home</a> / Technical Data &amp; Research</div>
    <h1>Technical Data &amp; Research</h1>
    <p class="sub">Certifications, specifications, safety data, independent lab analyses, and peer-reviewed research, provided to qualified buyers on request.</p>
    <div class="btn-row">${btn(CTA.docs)}${btn(CTA.specialist,"btn-ghost-light")}</div>
  </div></div></section>

  <section class="block"><div class="wrap">
    <div class="eyebrow-line"></div><h2>Certifications &amp; compliance</h2>
    <p class="lead" style="margin-bottom:20px">Independently certified and lab-verified. Certificates and full analyses are included in the technical package on request.</p>
    <div class="certgrid">${TECH.compliance.map(c=>`<div class="certcard">
      <div class="ct-top"><b>${raw(c.item)}</b>${sBadge(c.status)}</div>
      <span>${raw(c.scope)}</span></div>`).join("")}</div>
    <p class="form-note" style="margin-top:14px">USDA Organic certification is in progress and is not presented as certified.</p>
  </div></section>

  <section class="block" style="background:var(--paper-2)"><div class="wrap">
    <div class="eyebrow-line"></div><h2>Document library</h2>
    <p class="lead" style="margin-bottom:20px">${raw(TECH.gateNote)}</p>
    <div class="docgrid">${docCards}</div>
  </div></section>

  <section class="block"><div class="wrap">
    <div class="eyebrow-line"></div><h2>Technical data by industry</h2>
    <p class="lead" style="margin-bottom:18px">The documentation each buyer typically needs. Request the set relevant to your work.</p>
    <div class="tbl"><table><thead><tr><th>Industry</th><th>Relevant documents</th><th></th></tr></thead>
      <tbody>${indRows}</tbody></table></div>
  </div></section>

  <section class="block" style="background:var(--paper-2)"><div class="wrap">
    <div class="eyebrow-line"></div><h2>Peer-reviewed &amp; field research</h2>
    <p class="lead" style="margin-bottom:20px">The evidence base behind our soil and composting claims. Full-text package available on request.</p>
    <div class="doclist">
      ${TECH.studies.map(s=>`<div class="docrow study">
        <div><div class="study-top">${tBadge(s.type)} <span class="study-note">${raw(s.note)}</span></div>
          <b>${raw(s.title)}</b><span>${raw(s.authors)} · ${raw(s.venue)}</span><em>${raw(s.finding)}</em></div>
      </div>`).join("")}
    </div>
    <div class="callout" style="margin-top:22px"><b>Claim discipline:</b> studies marked <em>general biochar research</em> support the mechanism, not a product-specific guarantee. Composting acceleration should be validated in a buyer's own trial. Yield, feed, and ROI outcomes are not claimed.</div>
  </div></section>

  <section class="block"><div class="wrap"><div class="split">
    <div>
      <div class="kicker">Request access</div>
      <h2 style="font-size:28px;margin:8px 0 12px">Get the documents for your application</h2>
      <p class="lead">One request routes the spec sheets, SDS, lab analyses, certificates, and research relevant to your industry to your inbox, and connects you with a specialist if a spec needs tailoring.</p>
      <ul class="checks">${["Spec sheets & SDS","Independent lab analyses","OMRI / IBI / Puro certificates","Peer-reviewed research package"].map(x=>`<li>${raw(x)}</li>`).join("")}</ul>
    </div>
    <div class="formcard" id="pform"></div>
  </div></div></section>`;
}

/* ================= ABOUT ================= */
function renderAbout(){
  setMeta({title:"About American BioCarbon | White Castle, LA",desc:"American BioCarbon converts sugarcane bagasse into industrial absorbents, biochar, and durable carbon removal at the Cora Texas Sugar Mill in White Castle, Louisiana.",slug:"/about"});
  return `
  <section class="phead"><div class="wrap"><div class="grid">
    <div><div class="crumb"><a href="#/">Home</a> / About</div>
      <h1>Renewable products, engineered for industrial performance</h1>
      <p class="sub">We convert sugarcane bagasse, an agricultural byproduct, into high-capacity absorbents, biochar, and durable carbon removal, co-located with the Cora Texas Sugar Mill in White Castle, Louisiana.</p>
      <div class="btn-row">${btn(CTA.specialist)}${btn(CTA.sample,"btn-ghost-light")}</div>
    </div>
    <div class="media"><img src="${ASSETS.hands}" alt="American BioCarbon"></div>
  </div></div></section>
  ${proofBand()}
  <section class="block"><div class="wrap two-col-copy">
    <div><div class="kicker">What we do</div><h2 style="font-size:26px;margin:8px 0 12px">From ag byproduct to industrial-grade material</h2>
      <p class="lead">Using a patented separation process and controlled pyrolysis, we turn bagasse that would otherwise be burned or landfilled into absorbents that outperform wood pellets, biochar that improves soil, and verified carbon removal.</p></div>
    <div><div class="kicker">Why it matters</div><h2 style="font-size:26px;margin:8px 0 12px">Performance and carbon, together</h2>
      <p class="lead">Because our biochar locks carbon into a durable form, deploying the physical product also generates certified carbon removal. Product performance and carbon value move on the same molecule.</p></div>
  </div></section>
  ${ctaBand({h:"Work with us",sub:"Get a free sample, or talk to a specialist about volume.",primary:CTA.sample,secondary:CTA.quote,tertiary:CTA.specialist})}`;
}

/* ---- helpers ---- */
function prodId(p){ return Object.keys(PRODUCTS).find(k=>PRODUCTS[k]===p); }
function linkLabel(href){
  if(href.startsWith("#/product/")){ const p=PRODUCTS[href.split("/").pop()]; return p?p.name:"Product"; }
  if(href.startsWith("#/industry/")){ const n=INDUSTRIES[href.split("/").pop()]; return n?n.name:"Industry"; }
  if(href.includes("technical")) return "Technical Data";
  return "Learn";
}
function setMeta(seo){
  if(!seo) return;
  document.title = seo.title || document.title;
  let m=document.querySelector('meta[name="description"]'); if(m&&seo.desc) m.setAttribute("content",seo.desc);
}
function notFound(){ return `<section class="block"><div class="wrap"><h1>Page not found</h1><p class="lead">Try the <a href="#/">homepage</a>.</p></div></section>`; }

/* ================= ROUTER ================= */
function router(){
  const hash = location.hash.replace(/^#/,"") || "/";
  const [path, query] = hash.split("?");
  const parts = path.split("/").filter(Boolean); // e.g. ['product','absorbent-pellets']
  let html, formToBuild=null, formMount="#pform";
  if(parts.length===0){ html=renderHome(); setMeta(HOME.seo); }
  else if(parts[0]==="product"){ html=renderProduct(parts[1]); const p=PRODUCTS[parts[1]]; if(p) formToBuild=p.form; }
  else if(parts[0]==="industry"){ html=renderIndustry(parts[1]); const n=INDUSTRIES[parts[1]]; if(n) formToBuild=n.form; }
  else if(parts[0]==="request-sample"){ html=renderForm(parseType(query)==="biochar"?"biochar":"sample"); formToBuild=parseType(query)==="biochar"?"biochar":"sample"; formMount="#mainform"; }
  else if(parts[0]==="request-quote"){ html=renderForm(parseType(query)==="distributor"?"distributor":"quote"); formToBuild=parseType(query)==="distributor"?"distributor":"quote"; formMount="#mainform"; }
  else if(parts[0]==="contact"){ html=renderForm(parseType(query)==="carbon"?"carbon":"contact"); formToBuild=parseType(query)==="carbon"?"carbon":"contact"; formMount="#mainform"; }
  else if(parts[0]==="request-docs"){ html=renderForm("docs"); formToBuild="docs"; formMount="#mainform"; }
  else if(parts[0]==="buy"){ html=renderBuy(); }
  else if(parts[0]==="shop"){ html=renderShopProduct(parts[1]); }
  else if(parts[0]==="compare"){ html=renderCompare(); }
  else if(parts[0]==="technical"){ html=renderTechnical(); formToBuild="docs"; formMount="#pform"; }
  else if(parts[0]==="about"){ html=renderAbout(); }
  else { html=notFound(); }
  $("#app").innerHTML = html;
  if(formToBuild) buildForm(formToBuild, formMount);
  if(parts.length===0) initHeroCarousel();
  $("#menu").classList.remove("open");
  window.scrollTo(0,0);
  track("page_view", { path: "/"+parts.join("/"), title: document.title });
}
function parseType(q){ if(!q) return null; const p=new URLSearchParams(q); return p.get("type"); }

renderChrome();
window.addEventListener("hashchange", router);
router();
