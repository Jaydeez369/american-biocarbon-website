/**
 * Remove SDS *promises* from the Sales OS outbound copy.
 *
 * The line drawn here matters, so it is stated explicitly:
 *
 *   STRIPPED - anything a rep would SAY OR SEND to a prospect that offers, attaches or
 *   claims an SDS. "Attached: SDS", "SDS on file", "SDS available", "I'll include the
 *   SDS". There is no approved SDS, so every one of these sets up a request we cannot
 *   fulfil, in front of exactly the compliance-minded buyer who will notice.
 *
 *   KEPT - two categories that are true and useful:
 *     1. Buyer psychology ("EHS managers think in SDS and approvals", "hates green
 *        pitches with no spec or SDS"). That is accurate market intel, not our claim,
 *        and deleting it would hide WHY the missing SDS costs us deals.
 *     2. Internal to-dos ("Gather certs: SDS, OMRI...", "Confirm COA + SDS current").
 *        These record outstanding work. Deleting them would erase the fact that an SDS
 *        is still needed - the opposite of the intent.
 *
 *   node scripts/strip-sds-sales.mjs
 */
import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const ROOT = process.cwd();

const EDITS = [
  ["sales/gtm-data.js", [
    [`+ a written test protocol + spec sheet/SDS, shipped to their door`,
     `+ a written test protocol + spec sheet, shipped to their door`],
    [`"Spec sheet → 'Want the spec sheet + SDS to review first?' (soft yes → sample)"`,
     `"Spec sheet → 'Want the spec sheet to review first?' (soft yes → sample)"`],
    [`magnet:"Spec sheet + SDS + wood/clay comparison sheet"`,
     `magnet:"Spec sheet + wood/clay comparison sheet"`],
    [`b:"Fair — the free sample is exactly how you'd start that review. I'll include the SDS and spec so your compliance folks can look. Ship-to?"`,
     `b:"Fair — the free sample is exactly how you'd start that review. I'll include the spec sheet so your compliance folks can look. Ship-to?"`],
    [`"Box includes: product sample, spec sheet + SDS, written test protocol,`,
     `"Box includes: product sample, spec sheet, written test protocol,`],
    [`"Collateral: spec sheet + SDS + comparison sheet + sample-kit insert + LOI one-pager ready"`,
     `"Collateral: spec sheet + comparison sheet + sample-kit insert + LOI one-pager ready"`],
  ]],

  ["sales/data.js", [
    // --- proof lists shown to prospects ------------------------------------------------
    [`"Water-holding (3–3.5x) tech report","Spec sheet + SDS","Sample bag"`,
     `"Water-holding (3–3.5x) tech report","Spec sheet","Sample bag"`],
    [`proof:["5:1 vs 2.5:1 spec","SDS","Absorbency demo","Cost-per-gallon calc"]`,
     `proof:["5:1 vs 2.5:1 spec","Absorbency demo","Cost-per-gallon calc"]`],
    [`proof:["SDS","Leachate absorbency","Certs","Case reference"]`,
     `proof:["Leachate absorbency","Certs","Case reference"]`],
    [`proof:["5:1 absorbency","SDS","Field demo","Cost calc"]`,
     `proof:["5:1 absorbency","Field demo","Cost calc"]`],
    [`proof:["Absorbency spec","Charley's Chicks (anecdotal, flagged)","SDS"]`,
     `proof:["Absorbency spec","Charley's Chicks (anecdotal, flagged)"]`],
    [`"SDS + spec sheet on request","Cost-per-gal absorbed`,
     `"Spec sheet on request","Cost-per-gal absorbed`],
    [`proofDemo:["Product education (bagasse → product story)","Spec + SDS review"`,
     `proofDemo:["Product education (bagasse → product story)","Spec sheet review"`],
    // --- pitches -----------------------------------------------------------------------
    [`100% organic, low-dust, SDS on file. Want a free sample`,
     `100% organic, low-dust, fully spec'd. Want a free sample`],
    [`SDS and spec sheet are on file for your procurement and EHS review.`,
     `A full spec sheet is on file for your procurement and EHS review.`],
    // --- outbound sequences -------------------------------------------------------------
    [`Fewer bags per spill, lower disposal volume, carbon-neutral. SDS available.`,
     `Fewer bags per spill, lower disposal volume, carbon-neutral. Full spec sheet available.`],
    [`Plant-based absorbent, 5:1 soak vs 2.5:1 for wood, SDS ready. I'll email the spec`,
     `Plant-based absorbent, 5:1 soak vs 2.5:1 for wood. I'll email the spec`],
    [`Can I send the SDS + set up a quick demo?`, `Can I send the spec sheet + set up a quick demo?`],
    [`Attached: SDS + a cost-per-gallon comparison.`,
     `Attached: the spec sheet + a cost-per-gallon comparison.`],
    [`we're ready with SDS, specs, and a trial pallet.`,
     `we're ready with specs and a trial pallet.`],
    [`for leachate control and spill response, with SDS and certifications.`,
     `for leachate control and spill response, with full specs and certifications.`],
    [`for leachate and spill control with full SDS.`, `for leachate and spill control with full specs.`],
    [`Plant-based absorbent for leachate/spill, SDS ready, pilot-friendly.`,
     `Plant-based absorbent for leachate/spill, pilot-friendly.`],
    [`plant-based absorbent for leachate/spill control (SDS, certs).`,
     `plant-based absorbent for leachate/spill control (specs, certs).`],
    [`I'll bring SDS, certs, and a simple success scorecard.`,
     `I'll bring specs, certs, and a simple success scorecard.`],
    [`I can send an RFP-ready kit (specs, SDS, certs, references).`,
     `I can send an RFP-ready kit (specs, certs, references).`],
    [`open:"Plant-based absorbent for leachate/spill control with SDS and certs —`,
     `open:"Plant-based absorbent for leachate/spill control with full specs and certs —`],
    [`cta:"Set up a side-by-side windrow trial + send spec/SDS" }`,
     `cta:"Set up a side-by-side windrow trial + send the spec sheet" }`],
    // --- objection handling --------------------------------------------------------------
    [`resp:"Send spec sheet + SDS immediately; it's a buying signal.", proof:"Spec sheet + SDS"`,
     `resp:"Send the spec sheet immediately; it's a buying signal. If they specifically require an SDS, escalate - we do not have one yet.", proof:"Spec sheet"`],
    // --- fulfilment instructions (cannot be followed without a document) -------------------
    [`admin:"Ship COA + SDS with the sample.`, `admin:"Ship the COA with the sample.`],
    [`admin:"Ship against PO. COA/SDS travel with the load.`,
     `admin:"Ship against PO. The COA travels with the load.`],
  ]],
];

let total = 0;
const misses = [];
for (const [file, pairs] of EDITS) {
  const path = join(ROOT, file);
  let src = readFileSync(path, "utf8");
  const before = src;
  for (const [find, replace] of pairs) {
    if (!src.includes(find)) { misses.push(`${file}: ${find.slice(0, 60)}`); continue; }
    while (src.includes(find)) { src = src.replace(find, replace); total++; }
  }
  if (src !== before) writeFileSync(path, src);
}
console.log(`✓ ${total} outbound SDS claims removed from the Sales OS`);
if (misses.length) {
  console.log(`✗ ${misses.length} did not match:`);
  for (const m of misses) console.log("   " + m);
  process.exitCode = 1;
}
