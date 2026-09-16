/* Nurture Plan section. Renders sales-department/campaigns/NURTURE-PLAN.md, copied in by
   scripts/build-nurture.mjs as window.NURTURE_MD. A small markdown renderer lives here on
   purpose: the plan is headings, tables, lists and paragraphs and nothing else, and pulling
   a library for that would be the biggest script on the page. Fail-soft like the other
   modules: no NURTURE_MD means an empty section, not a broken app. */
(function(){
  const esc = s => String(s).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;");
  /* Inline: bold, code, links. Order matters: code first so ** inside `...` survives. */
  function inline(s){
    return esc(s)
      .replace(/`([^`]+)`/g,'<code>$1</code>')
      .replace(/\*\*([^*]+)\*\*/g,'<b>$1</b>')
      .replace(/\[([^\]]+)\]\(([^)]+)\)/g,'<a href="$2" target="_blank" rel="noopener">$1</a>');
  }
  function table(rows){
    const cells = r => r.replace(/^\||\|$/g,"").split("|").map(c=>c.trim());
    const head = cells(rows[0]);
    const body = rows.slice(2).map(cells);
    return `<div class="tbl-wrap"><table><thead><tr>${head.map(h=>`<th>${inline(h)}</th>`).join("")}</tr></thead><tbody>${
      body.map(r=>`<tr>${r.map(c=>`<td>${inline(c)}</td>`).join("")}</tr>`).join("")}</tbody></table></div>`;
  }
  function md(src){
    const out=[]; const lines=src.split("\n"); let i=0;
    while(i<lines.length){
      const l=lines[i];
      if(!l.trim()){ i++; continue; }
      if(/^---\s*$/.test(l)){ out.push('<div class="hr"></div>'); i++; continue; }
      const h=l.match(/^(#{1,4})\s+(.*)/);
      if(h){ const n=h[1].length; const t=inline(h[2]);
        out.push(n===1?`<h1 class="page-h">${t}</h1>`:n===2?`<h2 class="pipe-h" style="margin-top:28px">${t}</h2>`:`<h3 style="margin:18px 0 8px">${t}</h3>`);
        i++; continue; }
      if(/^\|/.test(l)){ const rows=[]; while(i<lines.length&&/^\|/.test(lines[i])) rows.push(lines[i++]); out.push(table(rows)); continue; }
      if(/^\s*[-*]\s/.test(l)){ const items=[]; while(i<lines.length&&/^\s*[-*]\s/.test(lines[i])){ let it=lines[i++].replace(/^\s*[-*]\s/,""); while(i<lines.length&&/^\s{2,}\S/.test(lines[i])&&!/^\s*[-*]\s/.test(lines[i])) it+=" "+lines[i++].trim(); items.push(it);} out.push(`<ul class="nur-list">${items.map(x=>`<li>${inline(x)}</li>`).join("")}</ul>`); continue; }
      if(/^\s*\d+\.\s/.test(l)){ const items=[]; while(i<lines.length&&/^\s*\d+\.\s/.test(lines[i])) items.push(lines[i++].replace(/^\s*\d+\.\s/,"")); out.push(`<ol class="nur-list">${items.map(x=>`<li>${inline(x)}</li>`).join("")}</ol>`); continue; }
      if(/^>\s?/.test(l)){ const q=[]; while(i<lines.length&&/^>\s?/.test(lines[i])) q.push(lines[i++].replace(/^>\s?/,"")); out.push(`<div class="note">${inline(q.join(" "))}</div>`); continue; }
      const p=[]; while(i<lines.length&&lines[i].trim()&&!/^(#|\||>|---|\s*[-*]\s|\s*\d+\.\s)/.test(lines[i])) p.push(lines[i++].trim());
      out.push(`<p class="nur-p">${inline(p.join(" "))}</p>`);
    }
    return out.join("\n");
  }
  function rNurture(){
    const src=window.NURTURE_MD;
    if(!src) return `<section class="section" id="sec-nurture"><h1 class="page-h">Nurture Plan</h1><p class="page-sub">nurture-data.js did not load.</p></section>`;
    return `<section class="section" id="sec-nurture">
      <div class="note info" style="margin-bottom:18px"><b>Copy needed.</b> Every cell marked <b>COPY</b> is a slot for Victor and Daniel. Nothing in this plan sends until the slots for a sequence are filled and Victor has signed it off. Source: <code>sales-department/campaigns/NURTURE-PLAN.md</code>, copied in ${esc(window.NURTURE_STAMP||"")}.</div>
      <div class="nur-doc">${md(src)}</div>
    </section>`;
  }
  window.NURTURE_UI={ rNurture, _internals:{ md } };
})();
