/**
 * One-shot: remove every customer-facing SDS claim from the public site.
 *
 * There is no approved Safety Data Sheet on file. Until there is, the site must not
 * offer one, list one as a deliverable, or imply one ships with a sample - a buyer who
 * requests an SDS we cannot produce is a worse outcome than never having offered it.
 *
 * Deliberately explicit pairs rather than a regex sweep: "SDS" appears in prose, in link
 * labels, in document-id arrays and in SEO descriptions, and each needs different
 * replacement wording. Every pair is asserted to apply, so a silent miss fails the run
 * instead of leaving a stray claim in production.
 *
 *   node scripts/strip-sds.mjs
 */
import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const ROOT = process.cwd();

/* [file, [[find, replace], ...]] - `find` must occur at least once or the run aborts. */
const EDITS = [
  ["data.js", [
    // --- document catalog + id lists -------------------------------------------------
    [`  sds:     { label:"Request SDS",                  href:"/request-docs?doc=sds" },\n`, ``],
    [`    { id:"abs-sds", name:"Absorbent Pellets & Crumble, SDS", cat:"Absorbents", desc:"Safety data sheet for handling, storage, and disposal." },\n`, ``],
    [`"abs-spec","abs-sds","abs-disposal"`, `"abs-spec","abs-disposal"`],
    [`"abs-spec","abs-sds"`, `"abs-spec"`],
    // --- certification table ---------------------------------------------------------
    [`      { item:"Safety Data Sheet (SDS)", scope:"Handling, storage & disposal", status:"verified" },\n`, ``],
    // --- short proof / trust strings --------------------------------------------------
    [`"SDS & spec on request"`, `"Spec sheet on request"`],
    [`"SDS & spec sheet available"`, `"Spec sheet available"`],
    [`"SDS & spec sheets on every SKU"`, `"Spec sheets on every SKU"`],
    [`"SDS + spec sheet on request"`, `"Spec sheet on request"`],
    [`"SDS + spec on request"`, `"Spec sheet on request"`],
    [`"SDS on request"`, `"Spec sheet on request"`],
    [`"SDS + spec sheet provided"`, `"Spec sheet provided"`],
    [`"SDS + spec"`, `"Spec sheet"`],
    [`["Documentation","SDS + spec sheet on request"]`, `["Documentation","Spec sheet on request"]`],
    [`["SDS status","Request document"]`, `["Spec sheet","Request document"]`],
    [`"Documentation package (SDS, spec)"`, `"Documentation package (spec sheet)"`],
    // --- prose ------------------------------------------------------------------------
    [`gateNote:"Spec sheets, SDS, lab analyses, and the research package are provided on request.`,
     `gateNote:"Spec sheets, lab analyses, and the research package are provided on request.`],
    [`we'll ship an industrial sample kit with the SDS and spec sheet.`,
     `we'll ship an industrial sample kit with the spec sheet.`],
    [`Samples ship in 4 to 7 business days with SDS + spec."`,
     `Samples ship in 4 to 7 business days with the spec sheet."`],
    [`Review the spec sheet + SDS and run your own head to head test."`,
     `Review the spec sheet and run your own head to head test."`],
    [`and in truckload volumes, with SDS and spec sheets on request.`,
     `and in truckload volumes, with spec sheets on request.`],
    [`A specialist replies within one business day, with the SDS and spec sheet attached."`,
     `A specialist replies within one business day, with the spec sheet attached."`],
    [`request the spec sheet and SDS so we can confirm suitability."`,
     `request the spec sheet so we can confirm suitability."`],
    [`{ q:"Do you provide an SDS and spec sheet?", a:"Yes, both are available on request and sent automatically when you submit a sample or quote request." }`,
     `{ q:"Do you provide a spec sheet?", a:"Yes, it is available on request and sent automatically when you submit a sample or quote request." }`],
    [`{ q:"Do you provide an SDS and spec sheet?", a:"Yes, both are available on request and sent automatically when you submit a sample or quote request. The absorbents spec sheet covers both the pellet and crumble grades." }`,
     `{ q:"Do you provide a spec sheet?", a:"Yes, it is available on request and sent automatically when you submit a sample or quote request. The absorbents spec sheet covers both the pellet and crumble grades." }`],
    [`up to 5:1 absorption vs ~2.5:1 for wood, with SDS and bulk supply."`,
     `up to 5:1 absorption vs ~2.5:1 for wood, with bulk supply."`],
    [`benefit:"Fewer bags per job and lighter loads, with SDS on request." }`,
     `benefit:"Fewer bags per job and lighter loads, with the spec sheet on request." }`],
    [`we'll confirm fit and send the SDS." }`, `we'll confirm fit and send the spec sheet." }`],
    [`detail:"SDS, spec &amp; solid profiling"`, `detail:"Spec sheet &amp; solid profiling"`],
    [`body:"Firms chase SDS and spec paperwork across suppliers, so one bagasse absorbent covers the job with documentation provided."`,
     `body:"Firms chase spec paperwork across suppliers, so one bagasse absorbent covers the job with documentation provided."`],
    [`a:"Yes, SDS and spec sheets are available on request and included when you submit a sample or quote request." }`,
     `a:"Yes, spec sheets are available on request and included when you submit a sample or quote request." }`],
    [`we'll confirm fit and send the SDS with application guidance." }`,
     `we'll confirm fit and send the spec sheet with application guidance." }`],
    [`with the full documentation package (SDS, spec, certifications)`,
     `with the full documentation package (spec sheet, certifications)`],
    [`provide an RFP ready documentation kit (spec, SDS, certifications)." }`,
     `provide an RFP ready documentation kit (spec sheet, certifications)." }`],
    [`We'll send the SDS and spec sheet with it and reply within one business day."`,
     `We'll send the spec sheet with it and reply within one business day."`],
    [`A specialist will reply within one business day with the SDS and spec sheet attached."`,
     `A specialist will reply within one business day with the spec sheet attached."`],
    [`auto-attach SDS/spec;`, `auto-attach spec sheet;`],
    [`SDS and spec included with your quote."`, `Spec sheet included with your quote."`],
    [`options:["Bulk quote","Spec sheet / SDS","Sample first","Talk to a specialist"]`,
     `options:["Bulk quote","Spec sheet","Sample first","Talk to a specialist"]`],
    [`We'll reply within one business day with freight aware pricing plus the SDS and spec sheet."`,
     `We'll reply within one business day with freight aware pricing plus the spec sheet."`],
    [`h:"Request Spec Sheets, SDS &amp; Technical Data"`, `h:"Request Spec Sheets &amp; Technical Data"`],
    [`we'll email the documents relevant to your application, spec sheets, SDS, lab analyses, certificates, and our research package."`,
     `we'll email the documents relevant to your application, spec sheets, lab analyses, certificates, and our research package."`],
    [`options:["Absorbent spec sheet","Absorbent SDS","Absorbent spec + SDS","Biochar spec + lab analysis"`,
     `options:["Absorbent spec sheet","Biochar spec + lab analysis"`],
    [`a specialist will follow up if a spec or SDS needs tailoring to your application."`,
     `a specialist will follow up if a spec sheet needs tailoring to your application."`],
    [`get a plant-based sorbent with SDS and spec sheet."`,
     `get a plant-based sorbent with a full spec sheet."`],
    // --- SEO descriptions (these feed the prerendered <meta> tags) ---------------------
    [`Bulk, bulk-bag & truckload supply. SDS and spec sheet available.`,
     `Bulk, bulk-bag & truckload supply. Spec sheet available.`],
    [`Bulk supply, SDS and spec available.`, `Bulk supply, spec sheet available.`],
    [`Bulk supply, SDS &amp; spec on request.`, `Bulk supply, spec sheet on request.`],
    [`Bulk supply, SDS & spec on request.`, `Bulk supply, spec sheet on request.`],
    [`Bulk supply, SDS on request.`, `Bulk supply, spec sheet on request.`],
    [`Renewable, low dust, bulk supply. SDS &amp; spec on request.`,
     `Renewable, low dust, bulk supply. Spec sheet on request.`],
    [`Renewable, low dust, bulk supply. SDS & spec on request.`,
     `Renewable, low dust, bulk supply. Spec sheet on request.`],
    [`Certifications, spec sheets, SDS, independent lab analyses,`,
     `Certifications, spec sheets, independent lab analyses,`],
  ]],

  ["app.js", [
    [`Request the full spec sheet and SDS for test conditions and handling.`,
     `Request the full spec sheet for test conditions and handling.`],
    [`        <a class="btn btn-ghost" href="/request-docs?doc=sds&product=\${p.id}">Request SDS</a>\n`, ``],
    [`<p class="shop-doc">Spec sheets, SDS &amp; OMRI listing (biochar) available on request,`,
     `<p class="shop-doc">Spec sheets &amp; OMRI listing (biochar) available on request,`],
    [`desc:"Certifications, spec sheets, SDS, independent lab analyses, and peer reviewed research for bagasse absorbents and biochar.`,
     `desc:"Certifications, spec sheets, independent lab analyses, and peer reviewed research for bagasse absorbents and biochar.`],
    [`<p class="lead" style="margin-bottom:20px">Spec sheets, SDS, lab analyses, certificates, and complete research documentation.</p>`,
     `<p class="lead" style="margin-bottom:20px">Spec sheets, lab analyses, certificates, and complete research documentation.</p>`],
    [`we'll send a curated package of specs, SDS, analyses, certifications, and research.`,
     `we'll send a curated package of specs, analyses, certifications, and research.`],
    [`"Complete Safety Data Sheets (SDS)",`, ``],
  ]],

  ["index.html", [
    [`Bulk, bulk-bag &amp; truckload supply. SDS and spec sheet available.`,
     `Bulk, bulk-bag &amp; truckload supply. Spec sheet available.`],
    [`Bulk, bulk-bag & truckload supply. SDS and spec sheet available.`,
     `Bulk, bulk-bag & truckload supply. Spec sheet available.`],
    [`Bulk supply, SDS and spec available.`, `Bulk supply, spec sheet available.`],
  ]],

  ["functions/api/_email.js", [
    [` * conservative: a specialist "can supply" safety documentation, because there is no
 * approved SDS on file yet. Do not upgrade that to "attached" or "enclosed" without one.`,
     ` * conservative: no email offers safety documentation at all, because there is no
 * approved SDS on file. Do not add one back until a real document exists - a buyer who
 * asks for a document we cannot produce is worse than never having offered it.`],
    [`and can supply safety documentation for your application.`,
     `and answer any handling questions for your application.`],
    [`"A specialist will follow up with laboratory data and any safety documentation you need for your application.",`,
     `"A specialist will follow up with the laboratory data you need for your application.",`],
  ]],
];

let total = 0;
const misses = [];

for (const [file, pairs] of EDITS) {
  const path = join(ROOT, file);
  let src = readFileSync(path, "utf8");
  const before = src;
  for (const [find, replace] of pairs) {
    if (!src.includes(find)) { misses.push(`${file}: ${find.slice(0, 70).replace(/\n/g, "\\n")}`); continue; }
    let n = 0;
    while (src.includes(find)) { src = src.replace(find, replace); n++; }
    total += n;
  }
  if (src !== before) writeFileSync(path, src);
  console.log(`  ${file}`);
}

console.log(`\n✓ ${total} replacements applied`);
if (misses.length) {
  console.log(`\n✗ ${misses.length} patterns did NOT match (nothing written for these):`);
  for (const m of misses) console.log("   " + m);
  process.exitCode = 1;
}
