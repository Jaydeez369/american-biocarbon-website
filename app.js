/* ============ American BioCarbon, router & renderers ============ */
const $ = s => document.querySelector(s);
// Escapes quotes too: esc() output lands inside double-quoted attributes, where &<> alone
// would not stop an attribute break-out.
const esc = s => String(s??"").replace(/&(?!amp;|lt;|gt;|quot;|#39;|#)/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;").replace(/'/g,"&#39;");
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

/* ---- spec sheet downloads ---- */
const SPEC_SHEETS = {
  "absorbent-pellets": {
    file: "assets/spec-sheets/Absorbent-Pellets-Specification-Sheet.pdf",
    name: "Absorbent-Pellets-Spec-Sheet.pdf"
  },
  "biochar": {
    file: "assets/spec-sheets/Biochar-Premium-Specification-Sheet.pdf",
    name: "ProGreaux-Bagasse-Biochar-Technical-Report.pdf"
  }
};

function downloadSpecSheet(specId){
  const spec = SPEC_SHEETS[specId];
  if(!spec){ console.warn(`[abc] no spec sheet for "${specId}" - the button did nothing. Add it to SPEC_SHEETS or drop the CTA.`); return; }
  track("spec_sheet_download", { spec: specId });
  const link = document.createElement("a");
  link.href = spec.file;
  link.download = spec.name;
  link.click();
}

/* ---- hero product carousel ---- */
let _heroTimer = null;
/* The router replaces #app wholesale, so the carousel's DOM is detached on any nav away
   from home. The timer must be stopped explicitly or it ticks forever against dead nodes. */
function stopHeroCarousel(){ if(_heroTimer){ clearInterval(_heroTimer); _heroTimer = null; } }
function initHeroCarousel(){
  stopHeroCarousel();
  const car = document.getElementById("heroCarousel"); if(!car) return;
  const slides = [...car.querySelectorAll(".hslide")];
  const dots = [...car.querySelectorAll(".hdot")];
  if(slides.length < 2) return;
  const toggle = document.getElementById("heroToggle");
  const reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  let i = 0;
  const go = n => { i = (n + slides.length) % slides.length;
    slides.forEach((s,k)=>{ const on = k===i; s.classList.toggle("active", on); s.setAttribute("aria-hidden", on?"false":"true");
      // inert keeps keyboard focus/AT out of offscreen slides (their CTAs are not tabbable)
      if(on) s.removeAttribute("inert"); else s.setAttribute("inert",""); });
    // .active drives the progress fill in CSS; no aria-selected, these are not tabs
    dots.forEach((d,k)=>{ d.classList.toggle("active", k===i); }); };
  const setToggle = paused => { if(!toggle) return; toggle.setAttribute("aria-pressed", paused?"true":"false");
    toggle.setAttribute("aria-label", paused?"Play slideshow":"Pause slideshow");
    toggle.querySelector(".hero-toggle-ic").textContent = paused ? "►" : "❚❚"; };
  const stop = () => { if(_heroTimer){ clearInterval(_heroTimer); _heroTimer = null; } car.classList.add("paused"); setToggle(true); };
  const play = () => { if(_heroTimer) clearInterval(_heroTimer); car.classList.remove("paused"); _heroTimer = setInterval(()=>go(i+1), 7000); setToggle(false); };
  // Clicking a dot selects that slide and pauses the carousel on it indefinitely.
  dots.forEach(d => d.addEventListener("click", ()=>{ go(+d.dataset.i); stop(); }));
  if(toggle) toggle.addEventListener("click", ()=>{ _heroTimer ? stop() : play(); });
  // Respect reduced-motion: do not auto-advance; leave user in control via dots/toggle.
  if(reduce){ car.classList.add("paused"); setToggle(true); } else { play(); }
}

/* ---- shared components ---- */
function btn(cta, cls="btn-primary", specProduct=null){
  // For spec sheet downloads, use onclick instead of href
  if(cta.label === "Download Spec Sheet" && specProduct){
    return `<a class="btn ${cls}" href="javascript:void(0)" onclick="downloadSpecSheet('${specProduct}')">${raw(cta.label)}</a>`;
  }
  return `<a class="btn ${cls}" href="${cta.href}">${raw(cta.label)}</a>`;
}
function proofBand(){
  return `<div class="proofband"><div class="wrap"><div class="row">
    ${PROOF.items.map(p=>`<div class="p"><div class="ic">${ico(p.svg||iconFor({title:p.title}))}</div>
      <div><b>${raw(p.title)}</b><span>${raw(p.sub)}</span></div></div>`).join("")}
  </div></div></div>`;
}
function carbonPillar(c){
  return `<section class="block carbon-pillar"><div class="wrap">
    <div class="cp-grid">
      <div class="cp-lead">
        <div class="kicker" style="color:#e79aad">${raw(c.kicker)}</div>
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
  // Only render once real, attributable proof is in place. While the data is
  // still placeholder scaffold, render nothing rather than fake logos/stats/quotes.
  if(!s || s.placeholder) return "";
  return `<section class="block social-proof"><div class="wrap">
    <div class="eyebrow-line"></div>
    <div class="kicker">${raw(s.kicker)}</div>
    <h2>${raw(s.h)}</h2>
    <p class="lead" style="margin-bottom:26px">${raw(s.sub)}</p>
    <div class="logo-strip">${s.logos.map(l=>`<div class="logo-tile" role="img" aria-label="${raw(l)}">${raw(l)}</div>`).join("")}</div>
    <div class="proof-stats">
      ${s.stats.map(st=>`<div class="ps"><b>${raw(st.n)}</b><span>${raw(st.l)}</span><em>${raw(st.note)}</em></div>`).join("")}
    </div>
    <figure class="proof-quote">
      <blockquote>${raw(s.quote.text)}</blockquote>
      <figcaption>${raw(s.quote.who)} · <span>${raw(s.quote.org)}</span></figcaption>
    </figure>
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
/* ---- Line-stroke icon system (24px grid, currentColor, 1.75 stroke) ---- */
const ICONS = {
  seedling:'<path d="M12 20v-7M12 13c-.2-3-2.6-5-6-5 .2 3 2.6 5 6 5Zm0 0c.2-3.3 2.6-6 6-6-.2 3.3-2.6 6-6 6Z"/>',
  recycle:'<path d="M4.5 12a7.5 7.5 0 0 1 12.5-5.6M19.5 12a7.5 7.5 0 0 1-12.5 5.6M17 3.5v3h-3M7 20.5v-3h3"/>',
  leaf:'<path d="M11 20A7 7 0 0 1 4 13c0-4.5 3.5-8.5 9-9 0 6-1.5 10.5-8 12M4.5 20.5C6 16.5 8.5 14 12 12.5"/>',
  droplet:'<path d="M12 3.5s6 5.8 6 9.8a6 6 0 0 1-12 0c0-4 6-9.8 6-9.8Z"/>',
  waves:'<path d="M2 8c2-2 4-2 6 0s4 2 6 0 4-2 6 0M2 13c2-2 4-2 6 0s4 2 6 0 4-2 6 0M2 18c2-2 4-2 6 0s4 2 6 0 4-2 6 0"/>',
  trash:'<path d="M4 7h16M9.5 7V5h5v2M6.5 7l1 13h9l1-13"/>',
  layers:'<path d="M12 3 3 8l9 5 9-5-9-5ZM3 13l9 5 9-5"/>',
  shield:'<path d="M12 3.5l7.5 2.8v5.7c0 4.7-3.7 7.5-7.5 8.5-3.8-1-7.5-3.8-7.5-8.5V6.3L12 3.5ZM9 12l2 2 4-4"/>',
  truck:'<path d="M3 6.5h10.5v9H3zM13.5 9.5H17l3.5 3v3h-7M7 18.5a2 2 0 1 0 0-4 2 2 0 0 0 0 4Zm9.5 0a2 2 0 1 0 0-4 2 2 0 0 0 0 4Z"/>',
  chart:'<path d="M4 20V4M4 20h16M8 16l3-4 3 2 4-6"/>',
  badge:'<path d="M12 2.5l2.2 1.6 2.7-.2.9 2.6 2.2 1.6-.9 2.6.9 2.6-2.2 1.6-.9 2.6-2.7-.2L12 21.5l-2.2-1.6-2.7.2-.9-2.6L4 15.5l.9-2.6L4 10.3l2.2-1.6.9-2.6 2.7.2L12 2.5ZM9 12l2 2 4-4"/>',
  cog:'<path d="M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z"/><path d="M19 12c0-.5 0-.9-.1-1.3l1.9-1.4-1.9-3.3-2.2 1a7 7 0 0 0-2.2-1.3L14 3h-4l-.4 2.4a7 7 0 0 0-2.2 1.3l-2.2-1L3.3 9l1.9 1.4a7 7 0 0 0 0 2.6L3.3 14.4l1.9 3.3 2.2-1a7 7 0 0 0 2.2 1.3L10 20.4h4l.4-2.4a7 7 0 0 0 2.2-1.3l2.2 1 1.9-3.3-1.9-1.4c.1-.4.1-.8.1-1.3Z"/>',
  spark:'<path d="M12 3l1.7 5.1L19 10l-5.3 1.9L12 17l-1.7-5.1L5 10l5.3-1.9L12 3Z"/>',
  hex:'<path d="M12 2.5l8.2 4.75v9.5L12 21.5l-8.2-4.75v-9.5L12 2.5ZM9 12l2 2 4-4"/>',
  rig:'<path d="M7 5h10v14H7zM7 5c0 1.3 2.2 2 5 2s5-.7 5-2M7 10.5c0 1.3 2.2 2 5 2s5-.7 5-2M7 15c0 1.3 2.2 2 5 2s5-.7 5-2"/>',
  cow:'<path d="M6 4.5c-1.6.4-2.3 2-1.6 3.6M18 4.5c1.6.4 2.3 2 1.6 3.6M5 8.5a7 7 0 0 0 14 0M8 7.5C8 5 9.8 3.5 12 3.5S16 5 16 7.5M9.7 12h.01M14.3 12h.01M9 15a3 3 0 0 0 6 0H9ZM11 16.7h.01M13 16.7h.01"/>'
};
function ico(name,cls){
  const p = ICONS[name] || ICONS.hex;
  return `<svg class="ic-svg${cls?' '+cls:''}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${p}</svg>`;
}
// Infer a semantic icon from card copy (title + detail). Explicit item.icon wins.
const ICON_RULES = [
  [/soil|amend|root|nutrient|seed|grow/,'seedling'],
  [/compost|blend|windrow|mix/,'recycle'],
  [/carbon|removal|corc|sequest|offset|remov/,'leaf'],
  [/bedding|animal|stall|barn|poultry|livestock/,'layers'],
  [/flood|disaster|standing water|storm|wet debris/,'waves'],
  [/landfill|leachate|waste|aqueous|sludge|dispos/,'trash'],
  [/remediat|contaminat|cleanup|clean-up|reclamat|restor/,'shield'],
  [/drill|frac|oilfield|pit|well|petro/,'droplet'],
  [/spill|fuel|chemical|oil|hydrocarbon|sorb|absorb|leak/,'droplet'],
  [/haul|transport|logistic|truck|freight|ship|deliver/,'truck'],
  [/throughput|capacity|yield|volume|scale|output|cycle/,'chart'],
  [/cert|complian|standard|verif|test|lab|spec/,'badge'],
  [/process|patent|technolog|pyrolys|engineer|equipment/,'cog'],
  [/moist|retention|hold|water|hydrat/,'droplet']
];
function iconFor(item){
  if(item && item.icon) return item.icon;
  const t = ((item && (item.title||'')) + ' ' + (item && (item.detail||'')) + ' ' + (typeof item==='string'?item:'')).toLowerCase();
  for(const [re,name] of ICON_RULES){ if(re.test(t)) return name; }
  return 'spark';
}
function ucGrid(list){
  return `<div class="ucgrid">${list.map((u,i)=>`<div class="uc"><div class="uc-top"><span class="uc-ic-tile">${ico(iconFor(u))}</span><span class="uc-i">${String(i+1).padStart(2,"0")}</span></div><span class="uc-t">${raw(u)}</span><svg class="uc-mark" viewBox="0 0 24 24" aria-hidden="true"><path d="M7 17 17 7M17 7H9M17 7v8" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg></div>`).join("")}</div>`;
}
// Field-application cards: title, operational detail, explanation, benefit, and
// the associated product line. Used for Oil & Gas and Environmental Remediation.
function appCards(list){
  return `<div class="appgrid">${list.map((a)=>{
    const inner = `
    <span class="ac-glow" aria-hidden="true"></span>
    <span class="ac-ic">${ico(iconFor(a))}</span>
    <h3 class="ac-t">${raw(a.title)}</h3>
    <p class="ac-b">${raw(a.body)}</p>
    ${a.benefit?`<p class="ac-benefit"><span>Benefit</span>${raw(a.benefit)}</p>`:""}
    ${a.cta?`<span class="ac-cta">${raw(a.cta)}<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg></span>`:""}`;
    return a.href
      ? `<a class="appcard is-link" href="${a.href}" aria-label="${raw(a.title)}: ${raw(a.cta||"Learn more")}">${inner}</a>`
      : `<div class="appcard">${inner}</div>`;
  }).join("")}</div>`;
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
      <div class="foot-cta"><a class="btn btn-primary btn-sm" href="/request-quote">Request quote</a><a class="cta-link-light" href="/request-quote">Talk to us about volume</a></div>
    </div>
    <div><h4>Products</h4>
      <a href="/product/absorbent-pellets">Absorbent Pellets</a><a href="/product/absorbent-crumble">Absorbent Crumble</a>
      <a href="/product/absorbent-fiber">Multipurpose Fiber</a><a href="/product/agricultural-biochar">100% Biochar</a>
      <a href="/product/biochar-infused-soil">Biochar-Infused Soil</a>
      <a href="/product/carbon-removal">Carbon Removal</a></div>
    <div><h4>Industries</h4>
      <a href="/industry/oil-gas">Oil &amp; Gas</a><a href="/industry/industrial-remediation">Industrial Remediation</a>
      <a href="/environmental-remediation-solutions">Environmental Remediation</a><a href="/industry/spill-response">Spill Response</a><a href="/industry/landfill-leachate">Landfill Leachate</a>
      <a href="/industry/animal-bedding">Animal Bedding</a><a href="/distributors-resellers-industries">Distributors</a><a href="/industry/soil-blenders">Soil Blenders &amp; Compost</a></div>
    <div><h4>Resources</h4>
      <a href="/technical">Certifications &amp; Technical Data</a><a href="/compare">Compare vs Wood Pellets</a>
      <a href="/about">About</a><a href="/contact">Contact</a>
      <a href="/request-sample">Get a free sample</a><a href="/request-quote">Request Quote</a></div>
  </div>
  <div class="legal"><span>© ${new Date().getFullYear()} ${raw(BRAND.name)}. All rights reserved.</span></div>`;
  const burger = $("#burger");
  const setBurger = open => {
    burger.setAttribute("aria-expanded", String(open));
    burger.setAttribute("aria-label", open ? "Close menu" : "Open menu");
  };
  burger.onclick = () => {
    const menu = $("#menu");
    const open = menu.classList.toggle("open");
    setBurger(open);
    /* The panel sits BEFORE the burger in the DOM but paints below it, so forward-Tab
       would skip straight past it. Move focus in so tab order follows what's on screen. */
    if(open){ const first = menu.querySelector('a,[tabindex="0"]'); if(first) first.focus(); }
  };
  document.addEventListener("keydown", e => {
    if(e.key !== "Escape") return;
    const menu = $("#menu");
    if(!menu.classList.contains("open")) return;
    menu.classList.remove("open");
    setBurger(false);
    burger.focus();
  });
  // Dropdown parents: keyboard-focusable, and honest about their own state. The reveal
  // itself stays CSS-driven (.menu>.item:focus-within .dropdown).
  document.querySelectorAll('.menu>.item>span').forEach(s=>{
    s.setAttribute("tabindex","0");
    s.setAttribute("role","button");
    s.setAttribute("aria-haspopup","true");
    s.setAttribute("aria-expanded","false");
    const item = s.parentElement;
    const sync = on => s.setAttribute("aria-expanded", String(on));
    item.addEventListener("focusin", ()=>sync(true));
    item.addEventListener("focusout", ()=>{ if(!item.contains(document.activeElement)) sync(false); });
    item.addEventListener("mouseenter", ()=>sync(true));
    item.addEventListener("mouseleave", ()=>sync(false));
    s.addEventListener("keydown", e=>{
      if(e.key!=="Enter" && e.key!==" ") return;
      e.preventDefault();
      const first = item.querySelector(".dropdown a");
      if(first) first.focus();
    });
  });
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
    // Homepage showcase sections 3, 4 & 5 (index 2, 3 & 4) use "Stay informed" instead of a free-sample CTA.
    const notifyPrimary = i===2 || i===3 || i===4;
    const primary = isLive ? {label:"Get a free sample",href:p.id==="agricultural-biochar"?"/product/agricultural-biochar":p.id==="absorbent-pellets"?"/shop/"+p.id:"/request-sample?product="+p.id}
      : notifyPrimary ? {label:"Stay informed",href:"/request-sample?preorder=1&product="+p.id}
      : {label:"Get a free sample",href:"/request-sample?preorder=1&product="+p.id};
    const secondary = null;
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
      <div class="hslide${i===0?" active":""}" role="group" aria-roledescription="slide" aria-label="${i+1} of ${HS.length}: ${raw(s.label)}" aria-hidden="${i===0?"false":"true"}" ${i===0?"":"inert"}>
        <img class="hslide-img" src="${s.img}" alt="${raw(s.label)}" style="object-position:${s.pos||'50% 55%'};--z:${s.zoom||1.05};--o:${s.origin||'50% 55%'}" ${i?'loading="lazy"':'fetchpriority="high"'}>
        <div class="hslide-scrim"></div>
        <div class="hslide-content">
          <div class="wrap">
            <div class="hslide-kicker">${raw(s.label)}</div>
            <${Ht} class="hslide-h">${raw(s.h)}</${Ht}>
            <p class="hslide-sub">${raw(s.sub)}</p>
            <div class="btn-row hslide-btns">${btn(s.primary)}${btn(s.secondary,"btn-ghost-light",s.specProduct)}</div>
          </div>
        </div>
      </div>`; }).join("")}
    <div class="hnav"><div class="hnav-inner wrap"><div class="hnav-tabs" role="group" aria-label="Choose product slide">${HS.map((s,i)=>`<button class="hdot${i===0?" active":""}" type="button" aria-label="Show slide ${i+1}: ${raw(s.label)}" data-i="${i}"><span class="hdot-track"><span class="hdot-fill"></span></span><span class="hdot-row"><span class="hdot-num">${String(i+1).padStart(2,"0")}</span><span class="hdot-label">${raw(s.label)}</span></span></button>`).join("")}</div><button class="hero-toggle" id="heroToggle" type="button" aria-label="Pause slideshow" aria-pressed="false"><span class="hero-toggle-ic" aria-hidden="true">❚❚</span></button></div></div>
  </section>
  ${proofBand()}

  <section class="block" id="used-most"><div class="wrap">
    <h2 style="margin-top:6px">How These Products&rsquo; Applications Help Industries &amp; Agriculture</h2>
    <div style="margin-top:26px">${H.fieldApps?appCards(H.fieldApps):ucGrid(H.useCases)}</div>
  </div></section>

  <section class="block" style="padding-bottom:0"><div class="wrap">
    <div class="eyebrow-line"></div><h2>Our products</h2>
    <p class="lead" style="max-width:62ch">One bagasse platform, engineered for your buyers, from industrial absorbents to soil.</p>
  </div></section>
  ${zig}

  ${carbonPillar(H.carbon)}

  ${ctaBand(H.finalCta)}`;
}

/* ================= PRODUCT ================= */
function renderProduct(id){
  const p = PRODUCTS[id]; if(!p) return notFound();
  setMeta(p.seo);
  const appsSection = grey => `
  <section class="block"${grey?` style="background:var(--paper-2)"`:""}><div class="wrap">
    ${p.appsKicker===""?"":`<div class="kicker">${raw(p.appsKicker||"Applications")}</div>`}<h2 style="margin-top:6px">${raw(p.appsHeading||"Field applications")}</h2>
    <div style="margin-top:26px">${p.fieldApps?appCards(p.fieldApps):ucGrid(p.useCases)}</div>
  </div></section>`;

  const specsSection = grey => `
  <section class="block"${grey?` style="background:var(--paper-2)"`:""}><div class="wrap"><div class="split">
    <div><div class="eyebrow-line"></div><h2 style="font-size:28px">Specifications</h2>
      <p class="lead" style="margin:10px 0 18px">Request the full spec sheet and SDS for test conditions and handling.</p>
      ${specTable(p.specs)}
      ${(id==="absorbent-pellets" || id==="agricultural-biochar") ? `<div style="margin-top:18px"><a class="btn btn-sm btn-ghost" href="javascript:void(0)" onclick="downloadSpecSheet('${id==="absorbent-pellets"?"absorbent-pellets":"biochar"}')">Download Full Spec Sheet</a></div>` : ""}</div>
    <div><div class="eyebrow-line"></div><h2 style="font-size:28px">${raw(p.comparison.h)}</h2>
      <div style="margin-top:18px">${cmpTable(p.comparison)}</div>
      ${p.comparison.image?`<figure class="cmp-fig"><img src="${p.comparison.image}" alt="${raw(p.comparison.imageAlt||"")}" loading="lazy"><figcaption>${raw(p.comparison.imageAlt||"")}</figcaption></figure>`:""}</div>
  </div></div></section>`;

  // Every product page leads with the "How ... Applications Help ..." section right below the hero,
  // then Specifications. The old problem / why-it's-different block has been removed sitewide.
  const flow = appsSection(false) + specsSection(true);

  return `
  <section class="phead"><div class="wrap"><div class="grid">
    <div>
      ${crumbs([{label:"Home",href:"/"},{label:p.name}])}
      <h1>${raw(p.h1)}</h1>
      <p class="sub">${raw(p.sub)}</p>
      <div class="btn-row">${btn(p.primary)}${btn(p.secondary,"btn-ghost-light")}${p.tertiary?btn(p.tertiary,"btn-ghost-light"):""}</div>
      ${(()=>{const isOffer=s=>/free|sample|q4|volume supply/i.test(s);const offer=(p.proofRow||[]).find(isOffer);const specs=(p.proofRow||[]).filter(x=>!isOffer(x));return `${offer?`<p class="cta-note">${raw(offer)}</p>`:""}${specs.length?`<p class="proofline">${specs.map(raw).join(" · ")}</p>`:""}`;})()}
    </div>
    <div class="media"><img src="${p.image}" alt="${raw(p.name)}"></div>
  </div></div></section>

  ${flow}

  <section class="block" style="background:var(--paper-2)"><div class="wrap">
    <div class="split proc-split">
      <div class="proc-left">
        <div class="proc-copy">
          <div class="kicker">Proof</div><h2 style="font-size:26px;margin:8px 0 12px">Certified and lab verified</h2>
          <ul class="checks">${PROOF.certs.filter(c=>c.status!=="pending").slice(0,4).map(c=>`<li><b>${raw(c.name)}</b>, ${raw(c.note)}</li>`).join("")}</ul>
          <p class="form-note">USDA Organic certification in progress.</p>
        </div>
        <img class="procimg" src="assets/industry/${id}.jpg?v=v2" alt="${raw(p.name)}" loading="lazy">
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
      ${crumbs([{label:"Home",href:"/"},{label:"Industries"},{label:n.name}])}
      <h1>${raw(n.h1)}</h1>
      <p class="sub">${raw(n.sub)}</p>
      <div class="btn-row">${btn(n.primary)}${btn(n.secondary,"btn-ghost-light")}</div>
      <div class="proofrow">${n.proof.map(x=>`<span>${raw(x)}</span>`).join("")}</div>
    </div>
    <div class="media"><img src="${n.image}" alt="${raw(n.name)}"></div>
  </div></div></section>

  <section class="block"><div class="wrap">
    <div class="kicker">Applications</div><h2 style="margin-top:6px">${raw(n.appsHeading||"How Our Applications Help Your Operation")}</h2>
    <div style="margin-top:26px">${n.fieldApps?appCards(n.fieldApps):ucGrid(n.useCases)}</div>
  </div></section>

  <section class="block"><div class="wrap"><div class="split proc-split">
    <div class="proc-left">
      <div class="proc-copy">
        <div class="kicker">Procurement</div><h2 style="font-size:26px;margin:8px 0 14px">Built for how you buy</h2>
        <ul class="checks">${n.procurement.map(x=>`<li>${raw(x)}</li>`).join("")}</ul>
        ${prods.length?`<div class="btn-row" style="margin-top:18px">${prods.map(p=>`<a class="btn btn-ghost btn-sm" href="/product/${prodId(p)}">${raw(p.name)} →</a>`).join("")}</div>`:""}
      </div>
      <img class="procimg" src="assets/industry/${id}.jpg?v=v2" alt="${raw(n.name)} application" loading="lazy">
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
  return `<section class="block" style="background:var(--graphite);color:#eaeef6"><div class="wrap">
    <div class="kicker" style="color:#9db3d6">Technical Data · gated</div>
    <h2 style="color:#fff;font-size:26px;margin:8px 0 10px">Documentation for your application</h2>
    <p style="color:#c3cbdc;max-width:640px">${raw(TECH.gateNote)}</p>
    <div class="doclist" style="margin-top:22px">
      ${docs.map(d=>`<div class="docrow dark"><div><b>${raw(d.name)}</b><span>${raw(d.desc)}</span></div>
        <a class="btn btn-primary btn-sm" href="/request-docs?ind=${id}" aria-label="Request ${esc(d.name)}">Request</a></div>`).join("")}
      ${studies.map(s=>`<div class="docrow dark"><div><b>${raw(s.title)}</b><span>${raw(s.venue)}, ${raw(s.finding)}</span></div>
        <a class="btn btn-ghost-light btn-sm" href="/request-docs?ind=${id}" aria-label="Request ${esc(s.title)}">Request</a></div>`).join("")}
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
    ${crumbs([{label:"Home",href:"/"},{label:f.name}])}
    <h1>${raw(f.h)}</h1><p class="sub">${raw(f.sub)}</p>
  </div></div></section>
  <section class="block"><div class="wrap"><div class="formwrap">
    <div class="formcard" id="mainform"></div>
  </div></div></section>`;
}
/* Resolve ?product=/?preorder= into a form context.
   SECURITY: nothing from the query string is ever interpolated into HTML. The product id
   is used only as a lookup key against PRODUCTS (own properties only, so /?product=constructor
   cannot match), and what gets rendered is the canonical name from data.js. If the param does
   not resolve to a real product it is dropped. */
function formContext(qs){
  const p = new URLSearchParams(qs || "");
  const id = p.get("product");
  const known = id && Object.prototype.hasOwnProperty.call(PRODUCTS, id);
  return {
    productId: known ? id : null,
    productName: known ? PRODUCTS[id].name : null,
    preorder: p.get("preorder") === "1",
  };
}
function buildForm(kind, mountSel, qs){
  const f = FORMS[kind]; const mount = $(mountSel); if(!f||!mount) return;
  const ctx = formContext(qs);
  mount.innerHTML = `<form id="lf">
    <div class="formgrid">
      ${f.fields.map(fl=>fieldHTML(fl, ctx)).join("")}
    </div>
    ${ctx.productId?`<input type="hidden" name="product_id" value="${esc(ctx.productId)}">`:""}
    ${ctx.preorder?`<input type="hidden" name="preorder" value="1">`:""}
    <button type="submit" class="btn btn-primary" style="margin-top:20px;width:100%">${raw(f.h.replace(/^Request an |^Get a |^Get |^Request |^Talk to a /,'').startsWith('Industrial')?'Send Request':'Submit')}</button>
    <p class="form-note">By submitting, you agree to be contacted about your request. We reply within one business day.</p>
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
    const form = e.currentTarget;
    if(form.dataset.submitted==="1") return;      // guard against accidental double-submit
    if(!form.checkValidity()){ form.reportValidity(); return; }
    form.dataset.submitted="1";
    const btn = form.querySelector('button[type="submit"]');
    if(btn){ btn.disabled=true; btn.textContent="Sending…"; }
    // event only, no field values; product id is catalog context, not PII
    track("lead_submit", { form: kind, routing: (f.routing||"").split(".")[0], ...(ctx.productId?{product:ctx.productId}:{}) });
    mount.innerHTML = `<div class="form-success" role="status" tabindex="-1">✓ ${raw(f.confirm)}</div>
      <div class="dev-note" style="margin-top:16px"><b>Auto-reply preview:</b><br>${raw(f.autoreply).replace(/\n/g,"<br>")}</div>`;
    const ok = mount.querySelector(".form-success"); if(ok) ok.focus();
    window.scrollTo({top:mount.getBoundingClientRect().top+window.scrollY-120,behavior:"smooth"});
  });
}
function fieldHTML(fl, ctx){
  const req = fl.req?` <span class="req">*</span>`:"";
  const full = (fl.type==="textarea"||fl.n==="useCase"||fl.n==="volume")?" full":"";
  const id = `f_${fl.n}`;
  let input;
  if(fl.type==="select"){
    const hasOther = fl.options.some(o=>/^other$/i.test(o)||/something else/i.test(o));
    // Preselect the product the visitor clicked through from. Compared against the canonical
    // name resolved in formContext(), never against the raw query value.
    const pre = (fl.n==="product" && ctx && ctx.productName) ? ctx.productName : null;
    const sel = o => (pre && o===pre) ? " selected" : "";
    input=`<select id="${id}" name="${fl.n}" ${fl.req?"required":""}><option value=""${pre?"":" selected"}>Select…</option>${fl.options.map(o=>`<option${sel(o)}>${raw(o)}</option>`).join("")}</select>`;
    if(hasOther){ input+=`<input type="text" class="other-input" name="${fl.n}_other" hidden aria-label="${raw(fl.label)}, please specify" placeholder="${raw(fl.otherPh||"Please specify")}">`; }
  }
  else if(fl.type==="textarea"){ input=`<textarea id="${id}" name="${fl.n}" ${fl.req?"required":""} placeholder="${raw(fl.ph||"")}"></textarea>`; }
  else { input=`<input id="${id}" type="${fl.type}" name="${fl.n}" ${fl.req?"required":""} placeholder="${raw(fl.ph||"")}">`; }
  return `<div class="field${full}"><label for="${id}">${raw(fl.label)}${req}</label>${input}</div>`;
}

/* ================= COMPARE ================= */
function buyCard(p){
  const isLive = p.avail==="live";
  const docLink = id => `<a href="/request-docs?doc=${id}&product=${p.id}">${id==="sds"?"SDS":"Spec sheet"}</a>`;
  const docs = isLive
    ? `<div class="buy-docs">${(p.docIds||[]).map(docLink).join("<span>·</span>")}</div>`
    : `<div class="buy-docs muted">Spec sheet coming</div>`;
  const primary = isLive
    ? `<a class="btn btn-primary btn-sm" href="${(p.id==="absorbent-pellets"||p.id==="agricultural-biochar")?"/shop/"+p.id:"/request-sample?product="+p.id}">Get a free sample</a>`
    : `<a class="btn btn-primary btn-sm" href="/request-sample?preorder=1&product=${p.id}">Get a free sample</a>`;
  const cta = isLive
    ? `<div class="btn-row">${primary}</div>
       <a class="notify" href="/request-quote?product=${p.id}">Talk to us about volume →</a>`
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
      <div class="availline">${isLive?"Free sample ships in 4 to 7 business days. Bulk and truckload by quote.":"Coming Q4. Request a sample on a 30 day lead time."}</div>
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
const SHOP_DOMAIN = "https://americanbiocarbon.com";
// Shopify cart permalinks - site product id to checkout URL (variant:qty).
// Store: American BioCarbon (de7e4a). Both are $0 free-sample variants of the
// "Product Samples" product (10493867753764). Clicking sends the shopper to
// Shopify's hosted cart/checkout on SHOP_DOMAIN.
const SHOPIFY_CHECKOUT = {
  "absorbent-pellets":   SHOP_DOMAIN + "/cart/54185346302244:1",
  "agricultural-biochar": SHOP_DOMAIN + "/cart/54185346335012:1",
};
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
    ${crumbs([{label:"Products",href:"/buy"},{label:p.name}], "margin-bottom:22px")}
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
        ${SHOPIFY_CHECKOUT[p.id]
          ? `<a class="btn btn-primary" href="${SHOPIFY_CHECKOUT[p.id]}" style="width:100%;justify-content:center">Order free sample</a>`
          : `<a class="btn btn-primary" href="/request-sample?product=${p.id}" style="width:100%;justify-content:center">Get a free sample</a>`}
        <div class="pdp-links" style="margin-top:12px">
          <a href="/request-quote?product=${p.id}">Talk to us about volume</a>
          <span>·</span>
          <a href="/request-docs?doc=spec&product=${p.id}">Download spec sheet</a>
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
        <a class="btn btn-dark" href="/request-docs?doc=spec&product=${p.id}">Download Spec Sheet</a>
        <a class="btn btn-ghost" href="/request-docs?doc=sds&product=${p.id}">Download SDS</a>
        ${SHOPIFY_CHECKOUT[p.id]
          ? `<a class="btn btn-ghost" href="${SHOPIFY_CHECKOUT[p.id]}">Order free sample</a>`
          : `<a class="btn btn-ghost" href="/request-sample?product=${p.id}">Get a free sample</a>`}
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
    ${crumbs([{label:"Home",href:"/"},{label:"Products"}])}
    <h1>Products</h1>
    <p class="shop-sub">Free samples ship in 4 to 7 business days · bulk bag and truckload by freight aware quote.</p>
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
        <p class="shop-doc">Spec sheets, SDS &amp; OMRI listing (biochar) available on request, <a href="/technical">Technical Data →</a></p>
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
    ${crumbs([{label:"Home",href:"/"},{label:"Compare"}])}
    <h1>Bagasse vs Wood Pellets vs Clay</h1>
    <p class="sub">The same spill, roughly half the bags. Figures reflect available product data for non-viscous liquids, request the spec sheet for test conditions.</p>
    <div class="btn-row">${btn(CTA.sample)}${btn(CTA.spec,"btn-ghost-light")}</div>
  </div></div></section>
  <section class="block"><div class="wrap">
    <div class="tbl tbl-hi"><table><thead><tr>${HOME.comparison.cols.map(c=>`<th>${raw(c)}</th>`).join("")}</tr></thead>
      <tbody>${HOME.comparison.rows.map(r=>`<tr>${r.map(x=>`<td>${raw(x)}</td>`).join("")}</tr>`).join("")}</tbody></table></div>
    <div class="callout" style="margin-top:22px"><b>Why it matters for procurement:</b> higher absorption per bag lowers bag count, crew handling, and disposal weight, the three costs that add up on every job. A trial pallet lets you measure it head to head against what you use today.</div>
  </div></section>
  ${ctaBand({h:"See it hold twice the load",sub:"Request a sample kit and run bagasse against your current sorbent on the next spill.",primary:CTA.sample,secondary:CTA.quote})}`;
}

/* ================= TECHNICAL DATA / RESOURCES (gated) ================= */
// Accessible filter bar for the resource library. Groups: Product, Use Case,
// Industry. Rendered as radio-style toggle buttons so one option per group is
// active; each group has an "All" reset.
function resourceFilterBar(){
  const rf = TECH.resourceFilters;
  const group = (name, label, opts) => `<div class="rf-group" role="group" aria-label="Filter by ${raw(label)}">
    <span class="rf-label">${raw(label)}</span>
    <div class="rf-btns">
      <button type="button" class="rf-btn is-active" data-rf-group="${name}" data-rf-key="" aria-pressed="true">All</button>
      ${opts.map(o=>`<button type="button" class="rf-btn" data-rf-group="${name}" data-rf-key="${raw(o.key)}" aria-pressed="false">${raw(o.label)}</button>`).join("")}
    </div></div>`;
  return `<div class="rfbar" id="rfbar">
    ${group("product","Product",rf.product)}
    ${group("useCase","Use Case",rf.useCase)}
    ${group("industry","Industry",rf.industry)}
    <button type="button" class="btn btn-ghost btn-sm rf-clear" data-rf-reset>Clear all</button>
  </div>`;
}
function bindResourceFilters(){
  const bar = $("#rfbar"), grid = $("#docgrid"), empty = $("#docEmpty");
  if(!bar || !grid) return;
  const rf = TECH.resourceFilters;
  const active = { product:"", useCase:"", industry:"" };
  const idsFor = (groupName, key) => {
    if(!key) return null; // "All" → no constraint
    const opt = (rf[groupName]||[]).find(o=>o.key===key);
    return opt ? opt.ids : [];
  };
  const apply = () => {
    let shown = 0;
    grid.querySelectorAll(".doccard").forEach(card=>{
      const id = card.getAttribute("data-id");
      const ok = Object.keys(active).every(g=>{
        const ids = idsFor(g, active[g]);
        return ids === null || ids.includes(id);
      });
      card.hidden = !ok;
      if(ok) shown++;
    });
    if(empty) empty.hidden = shown !== 0;
    grid.hidden = shown === 0;
  };
  bar.querySelectorAll("[data-rf-group]").forEach(btn=>{
    btn.addEventListener("click", ()=>{
      const g = btn.getAttribute("data-rf-group");
      active[g] = btn.getAttribute("data-rf-key");
      bar.querySelectorAll(`[data-rf-group="${g}"]`).forEach(b=>{
        const on = b===btn; b.classList.toggle("is-active", on); b.setAttribute("aria-pressed", on?"true":"false");
      });
      apply();
    });
  });
  const reset = () => {
    active.product=active.useCase=active.industry="";
    bar.querySelectorAll(".rf-btn").forEach(b=>{
      const on = b.getAttribute("data-rf-key")===""; b.classList.toggle("is-active", on); b.setAttribute("aria-pressed", on?"true":"false");
    });
    apply();
  };
  bar.querySelector("[data-rf-reset]") && bar.querySelector("[data-rf-reset]").addEventListener("click", reset);
  empty && empty.querySelector("[data-rf-reset]") && empty.querySelector("[data-rf-reset]").addEventListener("click", reset);
}
function renderTechnical(){
  setMeta({title:"Technical Data & Research | American BioCarbon",desc:"Certifications, spec sheets, SDS, independent lab analyses, and peer reviewed research for bagasse absorbents and biochar. Request the technical package.",slug:"/technical",keyword:"bagasse biochar technical data"});
  const sBadge = s => ({verified:'<span class="badge b-ok">Verified</span>',lab:'<span class="badge b-lab">Lab tested</span>',field:'<span class="badge b-lab">Field study</span>',pending:'<span class="badge b-pend">Pending</span>'}[s]||"");
  const tBadge = t => ({peer:'<span class="badge b-ok">Peer reviewed</span>',field:'<span class="badge b-lab">Field study</span>',lab:'<span class="badge b-lab">Lab report</span>'}[t]||"");
  const docHref = d => d.file ? d.file : CTA.quote.href;
  const docCards = TECH.docs.map(d=>{
    const href = docHref(d); const dl = d.file ? `download` : "";
    return `<div class="doccard" data-id="${raw(d.id)}">
      <div class="dc-top"><span class="fmt">▼ ${raw(d.fmt||"PDF")}</span><span class="cat">${raw(d.cat)}</span></div>
      <a class="dc-title" href="${href}" ${dl}>${raw(d.name)}</a>
      <p class="dc-desc">${raw(d.desc)}</p>
      <div class="dc-actions">
        <a class="dc-dl btn btn-sm ${d.file?'btn-ghost':'btn-primary'}" href="${href}" ${dl}>${d.file?"Download":"Stay informed"} ${raw(d.fmt||"PDF")}</a>
      </div></div>`;
  }).join("");
  const indRows = Object.keys(TECH.byIndustry).map(id=>{
    const n = INDUSTRIES[id];
    const docObjs = TECH.byIndustry[id].map(x=>TECH.docs.find(d=>d.id===x)).filter(Boolean);
    const docs = docObjs.map(d=>d.name.split(", ")[0]);
    // If this industry's applicable spec sheet is one we have on file, offer a direct download.
    const spec = docObjs.find(d=>d.file);
    const action = spec
      ? `<a class="btn btn-primary btn-sm" href="${spec.file}" download>Download spec ${raw(spec.fmt||"PDF")}</a>`
      : `<a class="btn btn-primary btn-sm" href="${CTA.quote.href}">Stay informed</a>`;
    return `<tr><td><strong>${raw(n?n.name:id)}</strong></td><td>${docs.map(d=>raw(d)).join(" · ")}</td>
      <td>${action}</td></tr>`;
  }).join("");
  return `
  <section class="phead"><div class="wrap"><div style="max-width:900px">
    ${crumbs([{label:"Home",href:"/"},{label:"Technical Data &amp; Research"}])}
    <h1>Technical Data &amp; Research</h1>
    <p class="sub">Complete technical documentation, independent lab analyses, certifications, and peer reviewed research for industrial grade decision making.</p>
    <div class="btn-row">${btn(CTA.quote)}${btn(CTA.specialist,"btn-ghost-light")}</div>
  </div></div></section>

  <section class="block"><div class="wrap">
    <div class="eyebrow-line" style="margin-bottom:8px"></div><h2 style="margin-top:0">Certifications &amp; Third Party Verification</h2>
    <p class="lead" style="margin-bottom:20px">Our products are independently certified and lab verified to meet industry standards and regulations.</p>
    <div class="icert-grid">${(TECH.primaryCerts||[]).map(c=>{
      const badge = c.logo
        ? `<img class="icert-logo" src="${c.logo}" alt="${raw(c.item)} certification logo">`
        : `<span class="icert-mono" aria-hidden="true">${raw(c.short||c.item)}</span>`;
      const inner = `${badge}<b class="icert-name">${raw(c.item)}</b><span class="icert-label">${raw(c.label)}</span>${sBadge(c.status)}`;
      return c.url
        ? `<a class="icert-card is-link" href="${c.url}" target="_blank" rel="noopener noreferrer" aria-label="${raw(c.item)}: ${raw(c.label)} (opens official program page)">${inner}<span class="icert-ext" aria-hidden="true">↗</span></a>`
        : `<div class="icert-card">${inner}</div>`;
    }).join("")}</div>
    <h3 style="font-size:17px;margin:26px 0 12px">Additional verification</h3>
    <div class="certgrid">${TECH.compliance.filter(c=>c.status!=="verified"||!(TECH.primaryCerts||[]).some(p=>c.item.startsWith(p.short))).map(c=>`<div class="certcard">
      <div class="ct-top"><b>${raw(c.item)}</b>${sBadge(c.status)}</div>
      <span>${raw(c.scope)}</span></div>`).join("")}</div>
  </div></section>

  <section class="block" style="background:var(--paper-2)"><div class="wrap">
    <div class="eyebrow-line"></div><h2>Complete Technical Documentation</h2>
    <p class="lead" style="margin-bottom:20px">Spec sheets, SDS, lab analyses, certificates, and complete research documentation.</p>
    ${resourceFilterBar()}
    <div class="docgrid" id="docgrid">${docCards}</div>
    <div class="doc-empty" id="docEmpty" hidden>
      <p>No resources match the selected filters.</p>
      <button type="button" class="btn btn-ghost btn-sm" data-rf-reset>Reset filters</button>
    </div>
    <div style="margin-top:28px;padding:20px;background:white;border-radius:4px;border-left:4px solid var(--crimson)">
      <p style="margin:0;font-size:14px;color:#555"><strong>How it works:</strong> Select the documents you need and we'll send a customized package to your inbox within one business day. Our specialists are available to discuss specifications and answer technical questions.</p>
    </div>
  </div></section>

  <section class="block"><div class="wrap">
    <div class="eyebrow-line"></div><h2>Documentation by Industry</h2>
    <p class="lead" style="margin-bottom:18px">Pre-curated document sets matched to your application. One request gets you everything you need.</p>
    <div class="tbl"><table><thead><tr><th>Industry / Application</th><th>Relevant Documents</th><th></th></tr></thead>
      <tbody>${indRows}</tbody></table></div>
  </div></section>

  <section class="block" style="background:var(--paper-2)"><div class="wrap">
    <div class="eyebrow-line"></div><h2>Peer Reviewed &amp; Field Research</h2>
    <p class="lead" style="margin-bottom:20px">The scientific evidence base supporting performance claims. Full text access included with technical documentation request.</p>
    <div class="doclist">
      ${TECH.studies.map(s=>`<div class="docrow study">
        <div><div class="study-top">${tBadge(s.type)} <span class="study-note">${raw(s.note)}</span></div>
          <b>${s.url ? `<a href="${s.url}" target="_blank">${raw(s.title)}</a>` : raw(s.title)}</b><span>${raw(s.authors)} · ${raw(s.venue)}</span><em>${raw(s.finding)}</em></div>
      </div>`).join("")}
    </div>
    <div class="callout" style="margin-top:22px"><b>Research standards:</b> Studies marked <em>general biochar research</em> demonstrate the mechanism; product performance should be validated through buyer trials. Yield, ROI, and other business outcomes are not claimed without field data specific to your application.</div>
  </div></section>

  <section class="block"><div class="wrap"><div class="split">
    <div>
      <div class="kicker">Get your documentation package</div>
      <h2 style="font-size:28px;margin:8px 0 12px">Request technical data for your application</h2>
      <p class="lead">Select your industry and we'll send a curated package of specs, SDS, analyses, certifications, and research. A specialist will follow up to answer questions and discuss any custom specifications needed for your work.</p>
      <ul class="checks">${["Spec sheets tailored to your product line","Complete Safety Data Sheets (SDS)","Independent lab analyses &amp; certificates","Peer reviewed research package","Direct specialist access for technical questions"].map(x=>`<li>${raw(x)}</li>`).join("")}</ul>
    </div>
    <div class="formcard" id="pform"></div>
  </div></div></section>`;
}

/* ================= ABOUT ================= */
function renderAbout(){
  setMeta({title:"About American BioCarbon | White Castle, LA",desc:"American BioCarbon converts sugarcane bagasse into industrial absorbents, biochar, and durable carbon removal at the Cora Texas Sugar Mill in White Castle, Louisiana.",slug:"/about"});
  return `
  <section class="phead"><div class="wrap"><div class="grid">
    <div>${crumbs([{label:"Home",href:"/"},{label:"About"}])}
      <h1>Renewable products, engineered for industrial performance</h1>
      <p class="sub">We convert sugarcane bagasse, an agricultural byproduct, into high capacity absorbents, biochar, and durable carbon removal, co-located with the Cora Texas Sugar Mill in White Castle, Louisiana.</p>
      <div class="btn-row">${btn(CTA.specialist)}${btn(CTA.sample,"btn-ghost-light")}</div>
    </div>
    <div class="media"><img src="${ASSETS.hands}" alt="American BioCarbon"></div>
  </div></div></section>
  ${proofBand()}
  <section class="block"><div class="wrap two-col-copy">
    <div><div class="kicker">What we do</div><h2 style="font-size:26px;margin:8px 0 12px">From ag byproduct to industrial grade material</h2>
      <p class="lead">Using a patented separation process and controlled pyrolysis, we turn bagasse that would otherwise be burned or landfilled into absorbents that outperform wood pellets, biochar that improves soil, and verified carbon removal.</p></div>
    <div><div class="kicker">Why it matters</div><h2 style="font-size:26px;margin:8px 0 12px">Performance and carbon, together</h2>
      <p class="lead">Because our biochar locks carbon into a durable form, deploying the physical product also generates certified carbon removal. Product performance and carbon value move on the same molecule.</p></div>
  </div></section>
  <section class="block" style="background:var(--paper-2)"><div class="wrap two-col-copy">
    <div><div class="kicker">Locally Sourced</div><h2 style="font-size:26px;margin:8px 0 12px">Louisiana grown, responsibly sourced</h2>
      <p class="lead">Every component comes from or is processed right here in Louisiana. Our multipurpose fiber, biochar, and coffee chaff are locally sourced and processed into renewable, locally grown alternatives to mined peat and wood based products.</p></div>
    <div><div class="kicker">Supply with integrity</div><h2 style="font-size:26px;margin:8px 0 12px">Traceability from field to product</h2>
      <p class="lead">We work directly with the Cora Texas Sugar Mill to capture bagasse, coffee processors for waste fiber, and local blenders to ensure every batch meets our performance standards. Local sourcing means faster turnaround, fresher materials, and complete supply chain visibility.</p></div>
  </div></section>
  ${ctaBand({h:"Work with us",sub:"Get a free sample, or talk to a specialist about volume.",primary:CTA.sample,secondary:CTA.quote})}`;
}

/* ---- helpers ---- */
function prodId(p){ return Object.keys(PRODUCTS).find(k=>PRODUCTS[k]===p); }
function linkLabel(href){
  if(href.startsWith("/product/")){ const p=PRODUCTS[href.split("/").pop()]; return p?p.name:"Product"; }
  if(href.startsWith("/industry/")){ const n=INDUSTRIES[href.split("/").pop()]; return n?n.name:"Industry"; }
  if(href.includes("technical")) return "Technical Data";
  return "Learn";
}
const SITE = { origin:"https://americanbiocarbon.com", name:"American BioCarbon", locale:"en_US", ogImage:"/assets/og-image.png" };
function _meta(sel, attr, key, val){
  let m=document.head.querySelector(sel);
  if(!m){ m=document.createElement("meta"); m.setAttribute(attr,key); document.head.appendChild(m); }
  m.setAttribute("content", val);
}
function _link(rel, href){
  let l=document.head.querySelector(`link[rel="${rel}"]`);
  if(!l){ l=document.createElement("link"); l.setAttribute("rel",rel); document.head.appendChild(l); }
  l.setAttribute("href", href);
}
/* Per-route SEO: title, description, canonical, Open Graph, Twitter, robots.
   opts: { canonical:"/clean-path" override (E7 dedup), image:"/path", type:"website|article|product", noindex:true } */
function setMeta(seo, opts={}){
  seo = seo || {};
  const title = seo.title || document.title;
  const desc  = seo.desc || (document.querySelector('meta[name="description"]')||{}).content || "";
  document.title = title;
  let dm=document.querySelector('meta[name="description"]'); if(dm) dm.setAttribute("content", desc);
  const path = (location.pathname||"/").replace(/\/+$/,"") || "/";
  const canonical = SITE.origin + (opts.canonical || (path==="/" ? "/" : path));
  const image = SITE.origin + (opts.image || SITE.ogImage);
  _link("canonical", canonical);
  _meta('meta[property="og:site_name"]','property','og:site_name', SITE.name);
  _meta('meta[property="og:locale"]','property','og:locale', SITE.locale);
  _meta('meta[property="og:type"]','property','og:type', opts.type||"website");
  _meta('meta[property="og:title"]','property','og:title', title);
  _meta('meta[property="og:description"]','property','og:description', desc);
  _meta('meta[property="og:url"]','property','og:url', canonical);
  _meta('meta[property="og:image"]','property','og:image', image);
  _meta('meta[name="twitter:card"]','name','twitter:card','summary_large_image');
  _meta('meta[name="twitter:title"]','name','twitter:title', title);
  _meta('meta[name="twitter:description"]','name','twitter:description', desc);
  _meta('meta[name="twitter:image"]','name','twitter:image', image);
  let rb=document.head.querySelector('meta[name="robots"]');
  if(opts.noindex){ if(!rb){ rb=document.createElement("meta"); rb.setAttribute("name","robots"); document.head.appendChild(rb); } rb.setAttribute("content","noindex,follow"); }
  else if(rb){ rb.remove(); }
}
/* Route-scoped JSON-LD (Product / BreadcrumbList). Replaces any prior route graph. */
function setJsonLd(nodes){
  let s=document.getElementById("ld-route");
  if(!s){ s=document.createElement("script"); s.type="application/ld+json"; s.id="ld-route"; document.head.appendChild(s); }
  s.textContent = JSON.stringify(nodes.length===1 ? nodes[0] : { "@context":"https://schema.org", "@graph":nodes });
}
function clearJsonLd(){ const s=document.getElementById("ld-route"); if(s) s.remove(); }
/* C1: serve local raster images as WebP via <picture>, original path as the fallback for
   browsers without WebP support. Transforms the HTML string BEFORE insertion so the
   <source> is parsed before the <img> loads (no double fetch).
   NOTE: this is NOT a fallback for a *missing* .webp - once a browser matches the
   <source>, a 404 there renders a broken image rather than falling through to the <img>.
   Every assets/ raster must have a .webp sibling; scripts/build.mjs enforces that.
   NOTE: the wrapper makes the <img> a child of <picture>, not of whatever laid it out.
   Any flex/grid sizing must target the <picture> (see .proc-left picture in styles.css). */
function webpify(html){
  return html.replace(
    /<img\b([^>]*?)\ssrc="(assets\/[^"?]+)\.(png|jpe?g)(\?[^"]*)?"([^>]*?)>/gi,
    (m,pre,path,ext,q,post)=>`<picture><source type="image/webp" srcset="${path}.webp${q||""}"><img${pre} src="${path}.${ext}${q||""}"${post}></picture>`
  );
}
function setNoindex(on){ let rb=document.head.querySelector('meta[name="robots"]'); if(on){ if(!rb){ rb=document.createElement("meta"); rb.setAttribute("name","robots"); document.head.appendChild(rb); } rb.setAttribute("content","noindex,follow"); } else if(rb){ rb.remove(); } }
function setCanonical(p){ const u=SITE.origin+p; _link("canonical", u); _meta('meta[property="og:url"]','property','og:url', u); }
function breadcrumbLd(items){ // items: [{name, path}]
  return { "@context":"https://schema.org", "@type":"BreadcrumbList",
    itemListElement: items.map((it,i)=>({ "@type":"ListItem", position:i+1, name:it.name,
      ...(it.path ? { item: SITE.origin+it.path } : {}) })) };
}
function productLd(p){
  const certs = ["OMRI Listed","IBI Certified","Puro.earth Certified"];
  return { "@context":"https://schema.org", "@type":"Product",
    name: p.name, description: (p.seo&&p.seo.desc)||p.sub||p.claim||"",
    category: "Industrial Absorbent", brand: { "@type":"Brand", name: SITE.name },
    image: SITE.origin+SITE.ogImage,
    manufacturer: { "@type":"Organization", name: SITE.name },
    hasCertification: certs.map(c=>({ "@type":"Certification", name:c })) };
}
function notFound(){ setMeta({title:"Page not found | American BioCarbon", desc:"The page you requested could not be found."}, {noindex:true}); clearJsonLd(); return `<section class="block"><div class="wrap"><h1>Page not found</h1><p class="lead">Try the <a href="/">homepage</a>.</p></div></section>`; }
/* Semantic breadcrumb: crumbs([{label,href}], ...) - last item is the current page (aria-current). */
function crumbs(items, style=""){
  const lis = items.map((it,idx)=>{
    const last = idx===items.length-1;
    const inner = (it.href && !last) ? `<a href="${it.href}">${raw(it.label)}</a>` : `<span${last?' aria-current="page"':''}>${raw(it.label)}</span>`;
    return `<li>${inner}</li>`;
  }).join("");
  return `<nav class="crumb" aria-label="Breadcrumb"${style?` style="${style}"`:""}><ol>${lis}</ol></nav>`;
}

/* ================= ANIMAL BEDDING (dedicated) ================= */
function renderAnimalBedding(){
  const P = ANIMAL_BEDDING;
  const AB = INDUSTRIES["animal-bedding"] || {};
  setMeta(P.seo);
  const specRow = r => {
    const isDoc = /^request document$/i.test(r[1]);
    const val = isDoc ? `<a href="${CTA.beddingSpecs.href}">Request document</a>` : raw(r[1]);
    return `<tr><th scope="row">${raw(r[0])}</th><td>${val}</td></tr>`;
  };
  return `
  <section class="ab-hero"><div class="wrap"><div class="ab-hero-grid">
    <div class="ab-hero-copy">
      ${crumbs([{label:"Home",href:"/"},{label:"Industries"},{label:"Animal Bedding"}])}
      <div class="ab-eyebrow">${raw(P.eyebrow)}</div>
      <h1 class="ab-h1">${raw(P.h1)}</h1>
      <p class="ab-lead">${raw(P.heroCopy)}</p>
      <div class="ab-btn-row">${btn(CTA.beddingSample)}${btn(CTA.beddingSpecs,"btn-ghost")}</div>
      <p class="ab-qualify">${raw(P.heroQualify)}</p>
    </div>
    <figure class="ab-hero-fig">
      <img src="${P.heroImage}" alt="Sugarcane bagasse absorbent pellets for animal bedding">
      <figcaption>${raw(P.heroCaption)}</figcaption>
    </figure>
  </div></div></section>

  <section class="ab-strip"><div class="wrap">
    <div class="ab-strip-row">
      ${P.specStrip.map(s=>`<div class="ab-stat"><div class="ab-stat-v">${raw(s.v)}</div><div class="ab-stat-l">${raw(s.l)}</div></div>`).join("")}
    </div>
    <p class="ab-strip-note">${raw(P.specStripNote)}</p>
  </div></section>

  ${AB.fieldApps?`<section class="ab-block"><div class="wrap">
    <h2 class="ab-h2">${raw(AB.appsHeading||"How Bagasse Bedding Applications Help Your Operation")}</h2>
    <div style="margin-top:26px">${appCards(AB.fieldApps)}</div>
  </div></section>`:""}

  <section class="ab-block"><div class="wrap"><div class="ab-trial-grid">
    <div class="ab-trial-copy">
      <h2 class="ab-h2">${raw(P.process.h)}</h2>
      <ol class="ab-steps">
        ${P.process.steps.map((s,i)=>`<li><span class="ab-step-n">${String(i+1).padStart(2,"0")}</span><div class="ab-step-body"><b>${raw(s.t)}</b><p>${raw(s.d)}</p></div></li>`).join("")}
      </ol>
      <div class="ab-btn-row">${btn({label:"Request a Qualified Sample",href:CTA.beddingSample.href})}${btn(CTA.beddingSpecialist,"btn-ghost")}</div>
    </div>
    <div class="ab-formcard"><h3 class="ab-form-h">Request Animal Bedding Sample</h3><div class="formcard" id="mainform"></div></div>
  </div></div></section>

  <section class="ab-block ab-block-alt"><div class="wrap">
    <h2 class="ab-h2">${raw(P.specs.h)}</h2>
    <div class="ab-tbl-scroll"><table class="ab-tbl ab-spec-tbl">
      <tbody>${P.specs.rows.map(specRow).join("")}</tbody>
    </table></div>
    <p class="ab-note">Values are based on available product documentation. Confirm current specifications before procurement.</p>
  </div></section>

  <section class="ab-final"><div class="wrap">
    <h2 class="ab-final-h">${raw(P.finalCta.h)}</h2>
    <p class="ab-final-sub">${raw(P.finalCta.sub)}</p>
    <div class="ab-btn-row">${btn(CTA.beddingSample)}${btn(CTA.beddingSpecs,"btn-ghost-light")}</div>
  </div></section>`;
}

/* ================= DEEP INDUSTRY PAGES ================= */
function renderEnvironmentalRemediation(){
  const p = ENV_REMEDIATION;
  setMeta(p.seo);
  return `
  <section class="phead"><div class="wrap"><div class="grid">
    <div>${crumbs([{label:"Home",href:"/"},{label:"Environmental Remediation"}])}
      <h1>${raw(p.h1)}</h1>
      <p class="sub">${raw(p.sub)}</p>
      <div class="btn-row">${btn(p.primary)}${btn(p.secondary,"btn-ghost-light")}</div>
    </div>
    <div class="media"><img src="${p.image || ASSETS.pelletsPhoto}" alt="${raw(p.h1)}"></div>
  </div></div></section>

  ${p.fieldApps?`<section class="block" style="background:var(--paper-2)"><div class="wrap">
    <div class="kicker">Applications</div><h2 style="margin-top:6px">${raw(p.appsHeading||"How Our Applications Help Your Industry")}</h2>
    <div style="margin-top:26px">${appCards(p.fieldApps)}</div>
  </div></section>`:""}

  <section class="block"><div class="wrap">
    <div class="split">
      <div>
        <div class="eyebrow-line"></div><h2 style="margin-top:6px">Illustrative impact model</h2>
        <p class="lead" style="margin:10px 0 18px">${raw(p.caseStudy.scenario)}</p>
        <div style="background:white;padding:16px;border-left:4px solid var(--crimson);margin:16px 0">
          <div style="font-size:13px;color:var(--mute);margin-bottom:6px">Standard absorbent:</div>
          <b>${raw(p.caseStudy.previous)}</b>
        </div>
        <div style="background:white;padding:16px;border-left:4px solid var(--crimson)">
          <div style="font-size:13px;color:var(--mute);margin-bottom:6px">American BioCarbon:</div>
          <b>${raw(p.caseStudy.result)}</b>
        </div>
        <p style="font-size:12px;color:var(--mute);margin-top:10px">Modeled scenario based on up-to-5:1 absorption versus a typical wood or clay sorbent - not a specific customer result.</p>
      </div>
      <div>
        <div class="eyebrow-line"></div><h2 style="margin-top:6px">How we work with you</h2>
        <div style="margin-top:18px">
          ${p.procurement.map(prc=>`<div style="margin-bottom:20px">
            <div style="display:flex;align-items:baseline;margin-bottom:6px">
              <span style="font-weight:700;color:var(--crimson);margin-right:12px;font-size:18px">${raw(prc.step)}</span>
              <span style="font-weight:600;font-size:15px">${raw(prc.label)}</span>
            </div>
            <p style="margin:0;font-size:14px;line-height:1.5;color:#666">${raw(prc.desc)}</p>
          </div>`).join("")}
        </div>
      </div>
    </div>
  </div></section>

  <section class="block" style="background:var(--paper-2)"><div class="wrap"><div class="split proc-split">
    <div class="proc-left">
      <div class="proc-copy">
        <div class="eyebrow-line"></div><h2 style="font-size:28px;margin-bottom:10px">Ready to cut costs and stay on timeline?</h2>
        <p class="lead">Talk to a remediation specialist. We'll scope your project and get a pilot test scheduled within 48 hours.</p>
      </div>
      <img class="procimg" src="assets/industry/environmental-remediation.jpg?v=v2" alt="Environmental remediation site" loading="lazy">
    </div>
    <div class="formcard" id="mainform"></div>
  </div></div></section>`;
}

function renderResellersIndustries(){
  const p = RESELLERS_INDUSTRIES;
  setMeta(p.seo);
  return `
  <section class="phead"><div class="wrap"><div class="grid">
    <div>${crumbs([{label:"Home",href:"/"},{label:"Distributors & Resellers"}])}
      <h1>${raw(p.h1)}</h1>
      <p class="sub">${raw(p.sub)}</p>
      <div class="btn-row">${btn(p.primary)}${btn(p.secondary,"btn-ghost-light")}</div>
    </div>
    <div class="media"><img src="assets/industry/distributors.jpg" alt="Distributor warehouse and supply"></div>
  </div></div></section>

  ${p.fieldApps?`<section class="block" style="background:var(--paper-2)"><div class="wrap">
    <div class="kicker">Applications</div><h2 style="margin-top:6px">${raw(p.appsHeading||"How Our Applications Help Your Industry")}</h2>
    <div style="margin-top:26px">${appCards(p.fieldApps)}</div>
  </div></section>`:""}

  <section class="block"><div class="wrap">
    <div class="eyebrow-line"></div><h2 style="margin-top:6px">Our distributor program</h2>
    <p class="lead" style="margin-bottom:22px">Built around YOUR success, not ours.</p>
    <div class="grid" style="grid-template-columns:repeat(auto-fit,minmax(260px,1fr));gap:22px">
      ${p.program.map(prog=>`<div>
        <h3 style="font-size:16px;margin-bottom:12px;color:var(--crimson)">${raw(prog.title)}</h3>
        <ul style="list-style:none;padding:0">
          ${prog.bullets.map(b=>`<li style="font-size:14px;margin-bottom:8px;line-height:1.4">✓ ${raw(b)}</li>`).join("")}
        </ul>
      </div>`).join("")}
    </div>
  </div></section>

  <section class="block" style="padding-top:96px;padding-bottom:96px"><div class="wrap" style="min-height:280px;display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;gap:28px">
    <p style="margin:0;font-size:40px;line-height:1.15;font-weight:700;max-width:16ch">Enterprise grade supply, one simple step away.</p>
    <a class="btn btn-primary" href="/request-quote">Request Quote</a>
  </div></section>

  <section class="block" style="background:var(--paper-2)"><div class="wrap"><div class="split proc-split">
    <div class="proc-left">
      <div class="proc-copy">
        <div class="eyebrow-line"></div><h2 style="font-size:28px;margin-bottom:10px">Ready to differentiate your catalog?</h2>
        <p class="lead">Let's talk margin, volume, and how we can support your growth. Start with a free sample and a preview of the margin model.</p>
      </div>
      <img class="procimg" src="assets/industry/reseller-industries.jpg" alt="Distribution and logistics" loading="lazy">
    </div>
    <div class="formcard" id="mainform"></div>
  </div></div></section>`;
}

function renderResellersAgriculture(){
  const p = RESELLERS_AGRICULTURE;
  setMeta(p.seo);
  return `
  <section class="phead"><div class="wrap"><div class="grid">
    <div>${crumbs([{label:"Home",href:"/"},{label:"Distributors & Resellers"}])}
      <h1>${raw(p.h1)}</h1>
      <p class="sub">${raw(p.sub)}</p>
      <div class="btn-row">${btn(p.primary)}${btn(p.secondary,"btn-ghost-light")}</div>
    </div>
    <div class="media"><img src="assets/industry/agricultural-biochar.jpg" alt="Agricultural reseller and grower supply"></div>
  </div></div></section>

  ${p.fieldApps?`<section class="block" style="background:var(--paper-2)"><div class="wrap">
    <div class="kicker">Applications</div><h2 style="margin-top:6px">${raw(p.appsHeading||"How Our Applications Help Your Industry")}</h2>
    <div style="margin-top:26px">${appCards(p.fieldApps)}</div>
  </div></section>`:""}

  <section class="block"><div class="wrap">
    <div class="eyebrow-line"></div><h2 style="margin-top:6px">Our agricultural reseller program</h2>
    <p class="lead" style="margin-bottom:22px">Grower trials, dedicated support, premium margins.</p>
    <div class="grid" style="grid-template-columns:repeat(auto-fit,minmax(260px,1fr));gap:22px">
      ${p.program.map(prog=>`<div>
        <h3 style="font-size:16px;margin-bottom:12px;color:var(--crimson)">${raw(prog.title)}</h3>
        <ul style="list-style:none;padding:0">
          ${prog.bullets.map(b=>`<li style="font-size:14px;margin-bottom:8px;line-height:1.4">✓ ${raw(b)}</li>`).join("")}
        </ul>
      </div>`).join("")}
    </div>
  </div></section>

  <section class="block"><div class="wrap">
    <div class="eyebrow-line"></div><h2 style="margin-top:6px">Your order to delivery timeline</h2>
    <p class="lead" style="margin-bottom:22px">Predictable, committed, transparent.</p>
    <div class="grid" style="grid-template-columns:repeat(auto-fit,minmax(240px,1fr));gap:16px;margin-top:20px">
      ${p.timeline.map(t=>`<div style="padding:14px;background:var(--paper-2);border-left:4px solid var(--crimson);border-radius:2px">
        <div style="font-weight:700;color:var(--crimson);margin-bottom:4px">${raw(t.day)}</div>
        <b style="display:block;font-size:14px;margin-bottom:4px">${raw(t.label)}</b>
        <p style="font-size:12px;line-height:1.4;color:#666;margin:0">${raw(t.desc)}</p>
      </div>`).join("")}
    </div>
  </div></section>

  <section class="block"><div class="wrap">
    <div class="eyebrow-line"></div><h2 style="margin-top:6px">How we keep you in the loop</h2>
    <p class="lead" style="margin-bottom:22px">Communication, transparency, and partnership.</p>
    <div class="grid" style="grid-template-columns:repeat(auto-fit,minmax(260px,1fr));gap:18px;margin-top:20px">
      ${p.communication.map(c=>`<div style="padding:14px;background:var(--paper-2);border-radius:4px">
        <b style="display:block;margin-bottom:6px;font-size:14px;color:var(--crimson)">${raw(c.title)}</b>
        <p style="font-size:13px;line-height:1.5;color:#666;margin:0">${raw(c.desc)}</p>
      </div>`).join("")}
    </div>
  </div></section>

  <section class="block"><div class="wrap">
    <div class="eyebrow-line"></div><h2 style="margin-top:6px">Order and Track in Seconds</h2>
    <p class="lead" style="margin-bottom:22px">Our platform makes it effortless. Place orders, track shipments, manage inventory all in one place.</p>
    <div class="btn-row" style="justify-content:center;gap:12px;margin-top:20px">
      ${btn(p.primary)}
      <a class="btn btn-ghost-light" href="/request-quote">Get a Custom Quote</a>
      <a class="btn btn-ghost-light" href="/request-quote">Check Order Status</a>
    </div>
  </div></section>

  <section class="block" style="background:var(--paper-2)"><div class="wrap"><div class="split proc-split">
    <div class="proc-left">
      <div class="proc-copy">
        <div class="eyebrow-line"></div><h2 style="font-size:28px;margin-bottom:10px">Ready to add premium biochar to your line?</h2>
        <p class="lead">Let's talk grower needs and how we build this together. Start with a free sample.</p>
      </div>
      <img class="procimg" src="assets/industry/reseller-agriculture.jpg" alt="Agricultural fields" loading="lazy">
    </div>
    <div class="formcard" id="mainform"></div>
  </div></div></section>`;
}

/* ================= ROUTER ================= */
let _navigated = false; // false during the first render; true for every nav after it
function router(){
  const path = (location.pathname || "/").replace(/^\/+/,"").replace(/\/+$/,"");
  const query = location.search.replace(/^\?/,"");
  const parts = path.split("/").filter(Boolean); // e.g. ['product','absorbent-pellets']
  let html, formToBuild=null, formMount="#pform";
  if(parts.length===0){ html=renderHome(); setMeta(HOME.seo); }
  else if(parts[0]==="product"){ html=renderProduct(parts[1]); const p=PRODUCTS[parts[1]]; if(p) formToBuild=p.form; }
  else if(parts[0]==="industry" && parts[1]==="animal-bedding"){ html=renderAnimalBedding(); formToBuild="bedding"; formMount="#mainform"; }
  else if(parts[0]==="industry"){ html=renderIndustry(parts[1]); const n=INDUSTRIES[parts[1]]; if(n) formToBuild=n.form; }
  else if(parts[0]==="request-sample"){ const t=parseType(query); const k=t==="biochar"?"biochar":t==="bedding"?"bedding":"sample"; html=renderForm(k); formToBuild=k; formMount="#mainform"; }
  else if(parts[0]==="request-quote"){ html=renderForm(parseType(query)==="distributor"?"distributor":"quote"); formToBuild=parseType(query)==="distributor"?"distributor":"quote"; formMount="#mainform"; }
  else if(parts[0]==="contact"){ html=renderForm(parseType(query)==="carbon"?"carbon":"contact"); formToBuild=parseType(query)==="carbon"?"carbon":"contact"; formMount="#mainform"; }
  else if(parts[0]==="request-docs"){ html=renderForm("docs"); formToBuild="docs"; formMount="#mainform"; }
  else if(parts[0]==="download-spec"){
    const p = new URLSearchParams(query);
    const specId = p.get("product") || "absorbent-pellets";
    downloadSpecSheet(specId);
    html = renderHome();
    setMeta(HOME.seo);
  }
  else if(parts[0]==="buy"){ html=renderBuy(); }
  else if(parts[0]==="shop"){ html=renderShopProduct(parts[1]); }
  else if(parts[0]==="compare"){ html=renderCompare(); }
  else if(parts[0]==="technical"){ html=renderTechnical(); formToBuild="docs"; formMount="#pform"; }
  else if(parts[0]==="about"){ html=renderAbout(); }
  else if(parts[0]==="environmental-remediation-solutions"){ html=renderEnvironmentalRemediation(); formToBuild="quote"; formMount="#mainform"; }
  else if(parts[0]==="distributors-resellers-industries"){ html=renderResellersIndustries(); formToBuild="distributor"; formMount="#mainform"; }
  else if(parts[0]==="distributors-resellers-agriculture"){ html=renderResellersAgriculture(); formToBuild="distributor"; formMount="#mainform"; }
  else { html=notFound(); }

  // ---- centralized per-route SEO: JSON-LD, robots noindex, E7 canonical ----
  const NOINDEX = new Set(["request-sample","request-quote","contact","request-docs","download-spec","buy"]);
  const home = { name:"Home", path:"/" };
  if(parts.length===0){ setNoindex(false); clearJsonLd(); }
  else if(NOINDEX.has(parts[0])){ setNoindex(true); clearJsonLd(); }
  else if(parts[0]==="product"){ setNoindex(false); const p=PRODUCTS[parts[1]]; p ? setJsonLd([productLd(p), breadcrumbLd([home,{name:p.name,path:"/product/"+parts[1]}])]) : clearJsonLd(); }
  else if(parts[0]==="shop"){ setNoindex(false); const p=PRODUCTS[parts[1]]; p ? setJsonLd([productLd(p), breadcrumbLd([home,{name:"Products",path:"/buy"},{name:p.name,path:"/shop/"+parts[1]}])]) : clearJsonLd(); }
  else if(parts[0]==="industry"){ setNoindex(false); const n=INDUSTRIES[parts[1]];
    if(parts[1]==="environmental-remediation") setCanonical("/environmental-remediation-solutions");
    else if(parts[1]==="distributors") setCanonical("/distributors-resellers-industries");
    n ? setJsonLd([breadcrumbLd([home,{name:"Industries"},{name:n.name,path:"/industry/"+parts[1]}])]) : clearJsonLd(); }
  else if(parts[0]==="compare"){ setNoindex(false); setJsonLd([breadcrumbLd([home,{name:"Compare",path:"/compare"}])]); }
  else if(parts[0]==="technical"){ setNoindex(false); setJsonLd([breadcrumbLd([home,{name:"Technical Data & Research",path:"/technical"}])]); }
  else if(parts[0]==="about"){ setNoindex(false); setJsonLd([breadcrumbLd([home,{name:"About",path:"/about"}])]); }
  else if(parts[0]==="environmental-remediation-solutions"){ setNoindex(false); setJsonLd([breadcrumbLd([home,{name:"Environmental Remediation",path:"/environmental-remediation-solutions"}])]); }
  else if(parts[0]==="distributors-resellers-industries"){ setNoindex(false); setJsonLd([breadcrumbLd([home,{name:"Distributors & Resellers",path:"/distributors-resellers-industries"}])]); }
  else if(parts[0]==="distributors-resellers-agriculture"){ setNoindex(false); setJsonLd([breadcrumbLd([home,{name:"Distributors & Resellers - Agriculture",path:"/distributors-resellers-agriculture"}])]); }
  else { /* notFound() already set noindex + cleared JSON-LD */ }

  stopHeroCarousel();
  $("#app").innerHTML = webpify(html);
  if(formToBuild) buildForm(formToBuild, formMount, query);
  if(parts[0]==="technical") bindResourceFilters();
  if(parts.length===0) initHeroCarousel();
  $("#menu").classList.remove("open");
  window.scrollTo(0,0);
  /* Replacing #app destroys the element the user just activated, dropping focus to <body>
     and announcing nothing. Move focus to main and announce the new title - but only on a
     real navigation, since stealing focus on first load would skip past the header. */
  if(_navigated){
    const app = $("#app");
    app.focus({ preventScroll:true });
    const live = document.getElementById("routeAnnounce");
    if(live) live.textContent = document.title;
  }
  track("page_view", { path: "/"+parts.join("/"), title: document.title });
}
function parseType(q){ if(!q) return null; const p=new URLSearchParams(q); return p.get("type"); }

renderChrome();
// History API navigation: intercept internal clean-path links, pushState, and route.
document.addEventListener("click", e=>{
  if(e.defaultPrevented || e.button!==0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
  const a = e.target.closest && e.target.closest('a[href^="/"]');
  if(!a) return;
  if(a.target === "_blank" || a.hasAttribute("download")) return;
  const href = a.getAttribute("href");
  if(!href || href.startsWith("//")) return;              // protocol-relative / external
  if(href === "/sales/" || href.startsWith("/sales/")) return; // separate app, real nav
  if(/\.[a-z0-9]+($|\?)/i.test(href)) return;             // asset/file links (e.g. .pdf)
  e.preventDefault();
  if((location.pathname + location.search) !== href) history.pushState(null, "", href);
  _navigated = true;
  router();
});
window.addEventListener("popstate", ()=>{ _navigated = true; router(); });
router();
