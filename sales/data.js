/* ============================================================
   SALES OS operating layer. NOT the source of truth.

   This file used to declare itself the single source of truth, which is exactly how it
   drifted: it accumulated its own copies of prices, sample sizes and claim rules, and each
   copy aged independently until the app was telling reps not to sell bulk while the site
   took metric-ton orders with working checkout.

   Precedence, highest first:
     1. website/data.js                          wins on SKUs, availability and list price
     2. sales-playbook/03-proof-and-claim-discipline.md   wins on claim wording
     3. 00-index.md                              wins on branding and the live blocker
   This file layers the daily operating motion on top of those. When it disagrees with any
   of them, it is wrong.
   ============================================================ */
const DATA = {

  /* -------- Proof hierarchy (claim discipline) -------- */
  proofTiers: [
    { t:1, k:"proof-1", name:"Certified / Listed", ex:"OMRI Listed · Puro.earth certified" },
    { t:2, k:"proof-2", name:"Lab-tested", ex:"Control Labs, IBI test panel: H/C, surface area, heavy metals, NPK" },
    { t:3, k:"proof-3", name:"Field-research supported", ex:"Published USDA-ARS research on LA sugarcane bagasse biochar (third-party, not our product)" },
    { t:4, k:"proof-4", name:"Customer-reported (anecdotal)", ex:"Charley's Chicks litter/mortality observations" },
    { t:5, k:"proof-5", name:"Hypothesis / needs validation", ex:"$/ton CDR revenue, yield lift %, feed claims" },
  ],

  /* ============ 3. ICP SEGMENTS ============ */
  /* segments and personas are deleted. They were a nine segment / six persona taxonomy
     that predated the Aug 10 call and never matched the ICP list the team settled on.
     Firmographics, triggers, disqualifiers and the persona block now live per ICP in
     outreach-data.js, which both Campaigns & ICP and the Outreach Engine read. */

  messaging: {
    splitRule:"TWO SEPARATE AVATARS — NEVER mix products in one pitch. Absorbent Pellets/Crumble and Biochar go to two completely different people with different pain, language, proof, and channel. An absorbent pitch never says 'biochar / soil / compost / OMRI / carbon.' A biochar pitch never says 'spill / absorbent / SDS-for-disposal / oilfield / leachate.' Every email, call, landing page, one-pager, and deck is SINGLE-PRODUCT. If a contact somehow fits both, run two separate threads.",
    tracks:[
      {
        id:"absorbent", product:"Absorbent Pellets & Crumble",
        audience:"Oil & Gas · Spill Response · Environmental Remediation · Landfill · Industrial EHS",
        avatar:"An HSE/EHS manager, field/ops supervisor, or procurement lead at an industrial or oilfield operation. They already buy clay or wood absorbents on a recurring, budgeted line. They think in bags-per-spill, disposal weight and cost, SDS, approvals, and job cost — NOT agronomy, soil, or carbon. They want proof it performs on a real cleanup and that it won't fail a compliance review.",
        positioning:"For industrial, oilfield, spill-response, and landfill teams, American BioCarbon Absorbent Pellets are a plant-based sugarcane-bagasse sorbent that holds up to ~5× its weight (vs ~2.5× for wood) — so crews open about half the bags and send lighter saturated waste to disposal, at a fraction of the cost-per-gallon of clay or cellulose.",
        oneLiner:"A plant-based industrial absorbent that holds up to ~5× its weight — half the bags, lighter disposal, ~$0.15/gal absorbed.",
        pitch30:"You're buying clay or wood absorbents that barely hold their own weight. Ours is a sugarcane-bagasse pellet that soaks up to ~5× its weight — about half the bags per spill and less saturated weight to disposal, which is billed by the pound. 100% organic, low-dust, fully spec'd. Want a free sample to run against what you use now on your next cleanup?",
        pitch90:"American BioCarbon makes an industrial absorbent from sugarcane bagasse at the Cora Texas mill in White Castle, LA. Bagasse has a naturally ordered, honeycomb pore structure, so carbonized and pelletized it draws in and holds up to ~5× its weight in non-viscous liquid — versus about 2.5× for wood pellets. On a real spill that means roughly half the bags to handle and less saturated weight going to disposal, and since disposal is billed by the pound, that's fewer pounds and fewer truckloads hauled. It's 100% organic biomass with no chemical additives, low dust, and renewable. A full spec sheet is on file for your procurement and EHS review. Easiest way to see it: a free sample to run head-to-head against your current absorbent on the next cleanup.",
        proof:["Up to ~5:1 absorption vs ~2.5:1 wood (product spec / lab)","Spec sheet on request","Cost-per-gal absorbed ~$0.15 vs ~$2.88 cellulose / ~$7.31 clay","100% organic bagasse, low dust, no additives","Fewer bags + lighter saturated disposal weight per spill"],
        neverSay:["biochar","soil / compost / windrow","OMRI / IBI / organic","carbon / CDR credits","water-holding / agronomy"]
      },
      {
        id:"biochar", product:"100% Biochar",
        audience:"MULTIPLE avatars — Distributors/Co-ops · Row-Crop & Specialty Farmers · Ranchers/Livestock · Poultry/Chicken farms · Compost/Soil Blenders · Nurseries/Greenhouses",
        avatar:"Biochar is the DYNAMIC product — one material, many different buyers, each with a different pain and a different lead benefit. Do NOT use a generic biochar pitch: pull the ONE benefit that matters to the buyer in front of you (water-holding for farmers, ammonia/odor for poultry & ranchers, cycle-time for composters, margin/differentiation for distributors, media performance for nurseries). Full per-avatar messaging, specs, benefit-by-mechanism, and industry comparisons live in the → Biochar Specs & Avatars tab. Common ground: they think in yards/blends/water-holding/OMRI/sell-through — NOT spills, SDS, or oilfield.",
        positioning:"For ag distributors, soil/compost blenders, and growers, American BioCarbon 100% Biochar is an OMRI Listed, independently lab-tested sugarcane-bagasse biochar whose ordered honeycomb pore structure holds ~3–3.5× its weight in water and carries inherent nutrients (~0.6-0.2-0.7 NPK + Ca/Mg) — a differentiated, carbon-negative SKU that improves water/nutrient retention and, per research, can shorten compost cycles ~10–30%.",
        oneLiner:"OMRI Listed sugarcane biochar that holds ~3–3.5× its weight in water and can shorten compost cycles ~10–30% — a differentiated, margin-accretive line.",
        pitch30:"Commodity amendments compete on price alone. Ours is an OMRI Listed, independently lab-tested bagasse biochar with an ordered honeycomb pore structure that holds ~3–3.5× its weight in water and carries inherent nutrients — so it firms up water-holding in sandy and premium blends and, per peer-reviewed research, can shorten compost cycles ~10–30%. Differentiated line, real supply story. Want a free sample to trial in one blend or windrow?",
        pitch90:"American BioCarbon makes a 100% sugarcane-bagasse biochar at the Cora Texas mill in White Castle, LA. Unlike most wood biochar, bagasse has a naturally ordered honeycomb pore structure that holds roughly 3–3.5× its weight in water, retains nutrients, and gives soil microbes protected habitat — and it carries inherent nutrients (~0.6-0.2-0.7 NPK plus Ca/Mg). It's OMRI Listed and independently lab-tested against the IBI test panel, measuring below IBI and EPA Class A heavy-metal thresholds. Published USDA-ARS research on sugarcane bagasse biochar supports the category (independent work, not a study of our product). For blenders it firms up moisture performance in sandy and premium mixes; for composters, peer-reviewed research shows biochar can shorten the cycle ~10–30% — more batches per year on the same pad. Best way to prove it is in your own operation: a free sample to run in one blend or a side-by-side windrow.",
        proof:["OMRI Listed · IBI tested","Holds ~3–3.5× its weight in water (technical report)","Inherent NPK ~0.6-0.2-0.7 + Ca/Mg","Published USDA-ARS bagasse field research (third-party)","Compost cycle ~10–30% shorter (peer-reviewed — validate in own windrow)","Heavy metals well below IBI / EPA Class A"],
        neverSay:["spill / cleanup","absorbent / sorbent / 5:1","SDS for disposal","oilfield / leachate / remediation","bags per spill"]
      }
    ],
    productPos:[
      { p:"Agricultural biochar", m:"Honeycomb bagasse structure → ~3–3.5x water-holding, inherent NPK + Ca/Mg, OMRI listed and IBI tested. A conditioner AND a nutrient-bearing matrix, not just black carbon." },
      { p:"Biochar-infused soil", m:"Ready-to-use blend — water retention, nutrient-holding, aeration with zero mixing. Drops into beds, pots, installs from the first watering." },
      { p:"Absorbent pellets", m:"5:1 absorption vs ~2.5:1 for wood — fewer bags per spill, lower disposal volume, plant-based and renewable. Spill, leachate, oilfield fluid, disaster." },
      { p:"Absorbent crumble", m:"Coarser form for fast, broad coverage on large-area / high-volume spills. Same 100% bagasse, spreads faster. Sellable now; oil-side and large-area fit; ~150-200mi freight ring." },
      { p:"Carbon removal credits", m:"Durable removal (H/C < 0.7), Puro-certified, generated by deploying the product. Sold as a layer on top of product movement — supply is our tons deployed." },
    ],
    comparisons:[
      { vs:"vs Wood biochar", win:"Ordered honeycomb pores → higher water-holding & nutrient retention; inherent nutrients; no trees cut" },
      { vs:"vs Synthetic fertilizer alone", win:"Reduces leaching, improves nutrient-use efficiency & water retention; complements — not replaces — fertility program" },
      { vs:"vs Compost alone", win:"Stable recalcitrant carbon (decades+), consistent lab-verified spec, adds durable structure compost can't" },
      { vs:"vs Wood/clay absorbents", win:"5:1 vs 2.5:1 absorbency; plant-based and renewable bagasse feedstock; lower disposal volume per gallon captured" },
      { vs:"vs Doing nothing", win:"Water/fertilizer efficiency, compliance & ESG story, differentiated resale SKU" },
      { vs:"vs Buying carbon credits w/o product", win:"Real deployed tons + MRV trail = defensible, durable removal — not paper offsets" },
    ],
    dualStory:"Simple version for buyers: You buy and use the product for its performance — water-holding, absorbency, soil health. Because our biochar locks carbon into a stable form for the long haul, the act of using it removes CO₂. That removal is independently certified (Puro.earth) and can be sold as a carbon credit. We handle the carbon side; you get a better product, often at better economics because the carbon layer subsidizes the price.",
    proofMap:[
      { claim:"Accelerates composting / shorter turnover time", rel:"Composters, soil blenders", src:"Peer-reviewed (general biochar)", tier:3, safe:"Research shows biochar can shorten the compost cycle ~10–30% and speed maturity — validate in your own windrow trial", risk:"'Our biochar cuts 14 days off your compost' (no VEJ-specific trial yet)" },
      { claim:"~3–3.5x water-holding capacity", rel:"Blenders, growers, landscape", src:"Lab-tested / American BioCarbon report", tier:2, safe:"Holds roughly 3–3.5x its weight in water (bagasse biochar, per technical report)", risk:"'Holds 5x water' as a blanket claim" },
      { claim:"5:1 absorption ratio", rel:"Remediation, oilfield, bedding", src:"Product spec / lab", tier:2, safe:"Up to ~5:1 absorption vs ~2.5:1 for wood pellets", risk:"'Absorbs any chemical' — specify non-viscous" },
      { claim:"OMRI Listed / IBI tested", rel:"Organic ag, distributors", src:"OMRI listing + Control Labs", tier:1, safe:"OMRI Listed, and independently lab-tested against the IBI test panel", risk:"'IBI Certified' in any form — we have NEVER held it. Also never 'USDA Organic' — no certification and no filed application." },
      { claim:"Puro.earth certified carbon", rel:"CDR/ESG buyers", src:"Certified", tier:1, safe:"Puro.earth certified carbon removal", risk:"Stating a fixed $/ton or tCO2e without confirmation" },
      { claim:"Low heavy metals", rel:"Organic, food-chain, compliance", src:"Lab (Control Labs IBI)", tier:2, safe:"Heavy metals 1–2 orders of magnitude below IBI/EPA Class A thresholds", risk:"'Zero contaminants'" },
      { claim:"Permanence / carbon-negative", rel:"CDR buyers", src:"Lab (H/C) + standard", tier:2, safe:"H/C molar ratio < 0.7 supports durable, long-term carbon retention", risk:"'Permanent forever' without standard reference" },
      { claim:"Yield / poultry health benefits", rel:"Growers, bedding", src:"Customer-reported / needs validation", tier:4, safe:"Customer-reported observations; not a formal performance or feed claim", risk:"Any feed/health claim as fact (AFIA/AAFCO/GRAS review required)" },
    ],
  },

  /* Section 8 (OUTREACH) is gone from this file. All cold copy now lives in
     outreach-data.js, rewritten from the Aug 10 VDJ call. Keeping a second bank of
     sequences here was how three different "soil blenders" pitches ended up in the
     tool at once. One source only. */

  /* ============ 9. COLLATERAL ============ */
  deck:[
    { s:"Title", p:"Frame identity fast", b:["American BioCarbon, biochar and absorbents from Louisiana sugarcane bagasse","Co-located at Cora Texas Sugar Mill, White Castle, LA"], cta:"—" },
    { s:"The waste-to-value story", p:"Origin + credibility", b:["Sugarcane bagasse: renewable ag byproduct, no trees cut","Oxygen-limited pyrolysis >500°C → stable biochar"], cta:"—" },
    { s:"Why bagasse beats wood", p:"Core differentiation", b:["Ordered honeycomb pore structure","~3–3.5x water-holding vs ~2x wood","Inherent NPK + Ca/Mg; 5:1 absorbency vs 2.5:1"], cta:"—" },
    { s:"Product family", p:"Show the range", b:["Bulk/bagged biochar","Biochar-infused soil","Absorbent pellets & crumble","Carbon removal credits"], cta:"—" },
    { s:"Proof & certifications", p:"De-risk", b:["OMRI Listed · IBI tested · Puro.earth certified","Published USDA-ARS field research (third-party)","Heavy metals well below IBI/EPA thresholds"], cta:"—" },
    { s:"The dual-value model", p:"The hook", b:["Every ton = product revenue + carbon-removal credit","We handle carbon; you get better product economics"], cta:"—" },
    { s:"Segment fit (tailor)", p:"Make it about them", b:["Blenders: moisture + organic SKU","Distributors: differentiated line + margin","Industrial: 5:1 absorbency + disposal savings"], cta:"—" },
    { s:"Economics / ROI", p:"Show the money", b:["Distributor margin model","Grower water/fertilizer efficiency","Cost-per-gallon captured (absorbent)"], cta:"Insert calculator output" },
    { s:"Proof it works", p:"Evidence", b:["Field study conclusions","Lab spec panels","Customer proof point (flagged if anecdotal)"], cta:"—" },
    { s:"How we start", p:"Lower the barrier", b:["Free sample (Pellets 1 lb / Biochar 8 oz)","Trial with agreed success criteria","If it wins → LOI locks Q4 supply, pricing & territory"], cta:"Book a free sample" },
    { s:"Logistics & terms", p:"Practicality", b:["Free samples now, 4–7 biz days from White Castle","Volume supply (bulk/bagged) from Q4","Q4 price band locked by LOI (placeholder until COGS set)"], cta:"—" },
    { s:"Next step", p:"Single clear CTA", b:["Approve a free sample / demo","Name the trial use case + success criteria","Sign an LOI on a win to reserve Q4 supply"], cta:"Ship sample this week" },
  ],
  onePagers:["Windrow trial protocol + data sheet (composter close)","Agricultural biochar","Biochar-infused soil","Absorbent pellets","Absorbent crumble","Distributor / reseller program","Industrial remediation","Carbon removal / CDR","Technical spec sheet","Organic / regulatory proof sheet","Comparison: vs wood biochar / wood pellets"],
  calculators:[
    { id:"distMargin", name:"Distributor Margin", inputs:["Your cost / unit","Resale price / unit","Units / month"], formula:"margin/unit = resale − cost; monthly profit = margin × units; margin % = margin/resale", saves:["est. product revenue","delivered margin"] },
    { id:"absorbent", name:"Absorbent Cost-per-Gallon", inputs:["Spill volume (gal)","Absorbent price / lb","Absorption ratio (lb liquid : lb sorbent)"], formula:"sorbent lb = spill_lb / ratio; cost = lb × price/lb; compare 5:1 vs 2.5:1", saves:["est. product revenue","competitor / status quo"] },
    { id:"blended", name:"Product + Carbon Blended Value", inputs:["Tons","Product margin / ton","tCO2e per ton (EST)","CDR $ / tCO2e (EST)"], formula:"product margin + (tons × tCO2e/ton × $/tCO2e) = blended value; carbon marked ESTIMATE", saves:["blended margin (incl. carbon)","est. CDR revenue"] },
    { id:"freight", name:"Freight-Aware Delivered Margin", inputs:["Product revenue","COGS","Freight cost"], formula:"delivered margin = revenue − COGS − freight; margin % = /revenue", saves:["delivered margin","est. freight"] },
  ],
  sample:{
    sizes:["Absorbent Pellets — 1 lb sample (free, S&H incl.)","Absorbent Crumble — 1 lb sample (free, S&H incl.)","100% Biochar — 8 oz sample (free, S&H incl.)","LIVE bulk: Biochar $450/MT · Pellets & Crumble $275/MT (1,650 lb super sacks)","(Q4+) truckload supply once capacity is online"],
    gates:["Confirmed ICP + use case","Named decision-maker (who can sign an LOI)","Agreed success criteria","Ship-to address"],
    fields:["account","contact","product","sample size","use case","success criteria","ship-to","ship date","carrier/tracking","follow-up date","outcome"],
    follow:["Day 0 ship confirmation","Day 3 'arrived?'","Day 7 trial check-in","Day 10 results + present LOI"],
    success:"Buyer confirms the sample met the pre-agreed metric (moisture, absorbency, blend behavior) → present the LOI to lock Q4 supply.",
  },
  windrowTrial:{
    goal:"Prove — in the composter's own operation — that biochar-amended windrows reach maturity faster and run hotter than their control, converting a Tier-3 general research claim into THEIR OWN measured data. This trial IS the close: shorter cycle = more batches/year on the same pad.",
    design:"Split one uniform feedstock batch into two matched windrows built the same day from the same pile: CONTROL (their normal recipe) and TREATMENT (same recipe + biochar). Keep everything else identical — size, turning schedule, location, moisture target. One variable: the biochar.",
    doses:[
      { r:"5% by volume", use:"Conservative / cost-sensitive start", note:"Often enough to see faster heat-up" },
      { r:"10% by volume", use:"Research 'sweet spot' — most cited acceleration", note:"Recommended default treatment rate" },
      { r:"15–20% by volume", use:"Aggressive / high-N or wet feedstock", note:"Also boosts finished-product biochar value" },
    ],
    steps:[
      "Pick one homogeneous feedstock batch; record recipe, C:N if known, start moisture.",
      "Build 2 matched windrows same day, same dimensions, from the same pile.",
      "Add biochar to TREATMENT at chosen dose (default 10% v/v); blend evenly. Control gets none.",
      "Log Day 0 baseline: temp, moisture, weight/volume, ambient temp.",
      "Turn both on the SAME schedule; never turn one without the other.",
      "Record temperature daily (3-probe avg per windrow), moisture 2–3x/week.",
      "Track days in thermophilic range (>55°C / 131°F) and peak temp for each.",
      "Call maturity when temp stabilizes near ambient after turning + passes their normal maturity check.",
      "Log DAYS-TO-MATURITY for both. The gap is the headline number.",
      "Optional: odor observations, N-loss proxy, finished screening/quality notes.",
    ],
    measure:[
      { m:"Days to maturity", why:"THE headline — drives batches/year & revenue", how:"Days from build to passing their maturity check" },
      { m:"Days to thermophilic (>55°C)", why:"Faster heat-up = faster process", how:"Days until sustained >55°C / 131°F" },
      { m:"Peak temperature", why:"Hotter = more microbial activity & pathogen kill", how:"Highest 3-probe avg" },
      { m:"Time held >55°C", why:"Pathogen/weed-seed kill compliance", how:"Count of days in range" },
      { m:"Moisture stability", why:"Confirms it's process speed, not drying", how:"% moisture 2–3x/week" },
      { m:"Odor (optional)", why:"Site/compliance value-add", how:"1–5 subjective scale at turns" },
    ],
    dataCols:["Day","Date","Control temp (°F)","Treatment temp (°F)","Control moisture %","Treatment moisture %","Turned? (Y/N)","Notes"],
    success:"Treatment reaches maturity meaningfully sooner than control (target ≥10% fewer days) at equal or better maturity/quality. Even 3–5 days per cycle compounds into multiple extra batches per year.",
    roiBridge:"Convert days saved → batches/year → revenue: (current cycle days ÷ new cycle days − 1) = % more throughput on the same pad. Feed the numbers into the Distributor/Throughput calculator and present alongside the LOI — the ROI is what justifies committing Q4 volume.",
    guardrails:[
      "One variable only — if they change turning, moisture, or recipe, the trial is invalid.",
      "Don't promise a specific day-count up front. The trial produces THEIR number (Tier-3 → their own data).",
      "Match windrow size & schedule exactly or the comparison is noise.",
      "Get maturity defined THEIR way before Day 0 so results are undisputable.",
    ],
    deliverable:"1-page trial protocol + printable daily data-capture sheet, co-branded, left on-site at the discovery visit. Closing artifact = filled sheet + a one-line ROI (days saved × batches/year).",
  },

  objections:[
    { o:"Biochar is too expensive", mean:"Doesn't see ROI yet", resp:"Reframe on outcome: water/fertilizer efficiency or fewer absorbent bags + disposal savings. Carbon layer can subsidize price.", proof:"ROI calc + field study", next:"What's your current cost per [unit/job]?", disq:"No budget & no use case" },
    { o:"I already use compost", mean:"Sees overlap", resp:"Complement, not replacement — biochar adds stable carbon + water-holding compost can't; use together.", proof:"Comparison sheet", next:"Where does your compost fall short on moisture/structure?", disq:"—" },
    { o:"Wood biochar is cheaper", mean:"Price-anchored", resp:"Performance-per-dollar: ordered honeycomb pores → higher water-holding + inherent nutrients; ask them to trial side-by-side.", proof:"American BioCarbon comparison / SEM", next:"Want a head-to-head sample?", disq:"—" },
    { o:"I don't understand carbon credits", mean:"Confused / skeptical", resp:"Keep it simple: buy the product for performance; we handle carbon; it may improve your price. No action needed from them.", proof:"Dual-value one-pager", next:"Want the plain-English version?", disq:"—" },
    { o:"Freight kills the economics", mean:"Delivered cost fear", resp:"Freight-zone pricing; concentrate volume; carbon value + product margin defend delivered cost inside zone.", proof:"Freight-aware calc", next:"What volume/frequency could you commit?", disq:"Zone C + tiny volume" },
    { o:"We need proof it works", mean:"Risk-averse", resp:"That's exactly what the trial is for — define success up front, ship a sample, measure.", proof:"Field study + sample", next:"What would prove it to you?", disq:"Won't define success" },
    { o:"We need organic certification", mean:"Compliance gate", resp:"OMRI Listed today. We are NOT USDA Organic certified and have no filed application — never imply otherwise. Provide the OMRI listing + IBI test-panel lab reports.", proof:"Cert docs", next:"Is OMRI sufficient for your program?", disq:"—" },
    { o:"We need specs / SDS", mean:"Procurement gate", resp:"Send the spec sheet immediately; it's a buying signal. If they specifically require an SDS, escalate - we do not have one yet.", proof:"Spec sheet", next:"Who else needs to see these?", disq:"—" },
    { o:"We need a trial first", mean:"Ready-ish", resp:"Great — qualify, set success criteria, ship. Trial is the path forward.", proof:"Sample workflow", next:"What use case + success metric?", disq:"—" },
    { o:"We need net terms", mean:"Cash-flow", resp:"Net-15 pilot → Net-30 established (placeholder policy). Tie to volume/reorder.", proof:"Terms sheet", next:"What terms does procurement require?", disq:"—" },
    { o:"We already have absorbents", mean:"Incumbent", resp:"Not rip-and-replace — trial pallet on one job, measure bag count + disposal vs incumbent.", proof:"Cost-per-gallon calc", next:"Trial on the next spill?", disq:"—" },
    { o:"Need regulatory approval (feed/animal)", mean:"Compliance risk", resp:"Agree — we sell bedding/absorbency only; feed/health claims require AFIA/AAFCO/GRAS review. Stay in-bounds.", proof:"Bedding spec (no feed claims)", next:"Bedding-only trial works?", disq:"Insists on unapproved claims" },
    { o:"New supplier is risky", mean:"Reliability fear", resp:"Start small (sample→pallet), show consistency via lab batch data, scale on proof.", proof:"Batch lab consistency", next:"Start with a low-risk pallet?", disq:"—" },
  ],

  /* ============ 11. PLAYBOOK ============ */
  playbook:{
    principles:["Sample first, then convert a winning trial to a PAID metric-ton order at the published site price","A PO against the roughly 80 MT on hand is the Month-1 win. The LOI sits on top of it to reserve Q4 TRUCKLOAD volume","Never advance a stage without its exit criteria","Every trial has a written success metric before it ships","Claim discipline: match every claim to its proof tier","Multi-thread any account worth a meaningful recurring order","Carbon is a days-61–90 layer, not the Month-1 pitch","Log it in the app or it didn't happen"],
    qual:{ framework:"MEDDIC-A (adapted): Metrics, Economic buyer, Decision criteria, Decision process, Identify pain, Champion + Application/Carbon fit",
      criteria:["Real, specific use case","Order potential ≥ pallet w/ recurring path","Freight fit (zone A/B or volume justifies C)","Named decision-maker engaged","Urgency / trigger present","Proof requirements known","Sample success criteria agreed","Carbon-credit eligibility assessed","Operational complexity acceptable"] },
    discovery:{
      groups:[
        { g:"Business problem", q:["What outcome are you trying to fix (moisture, absorbency, differentiation, compliance)?","What does that problem cost you today?"] },
        { g:"Current solution", q:["What are you using now and who supplies it?","What's the gripe with it?"] },
        { g:"Economics", q:["What's your current cost per unit / job / house?","What would a win be worth?"] },
        { g:"Operations", q:["How do you handle/store/apply it?","Bulk or bagged — what fits your ops?"] },
        { g:"Technical", q:["What specs/SDS/certs does your process require?","Any particle size / moisture constraints?"] },
        { g:"Compliance / certs", q:["Do you need OMRI/organic or specific SDS?","Any regulatory gates (feed, disposal)?"] },
        { g:"Procurement", q:["Who signs off and what's the process?","Terms / MOQ requirements?"] },
        { g:"Logistics / freight", q:["Where's ship-to and what volume/frequency?","In-house TL or need delivered?"] },
        { g:"Trial / sample", q:["What would prove it to you?","What metric = success?"] },
        { g:"Carbon / ESG", q:["Any sustainability/ESG reporting pressure?","Interested in the carbon story or product-only?"] },
      ],
    },
    proofDemo:["Product education (bagasse → product story)","Spec sheet review","Use-case match to their problem","Ship free sample","Run trial vs agreed success metric","Document before/after (claim-safe)","Present the LOI to lock Q4 supply"],
    proposal:{ need:["qualified use case","estimated Q4 volume","decision maker who can sign","sample success criteria met","Q4 price band set"], structure:["Recap of their problem","Recommended product","Sample result / proof","LOI terms: committed volume + locked Q4 price + territory","Signature step (non-binding until Q4)"], },
    close:["Written LOI-close plan w/ dates","Confirm the signer + what their bar is","Present the LOI; adjust volume/territory as needed","On signature: log committed volume to the funding book; nurture toward Q4 offtake"],
    handoff:["Order details + delivery schedule","Application / usage guidance","MRV data capture (application, GPS/site, weights)","Success check-in scheduled","Reorder date set"],
    expansion:["Reorder reminders on cycle","Usage check-ins","Volume expansion / new-SKU cross-sell","Case study request","Referral ask"],
  },

  /* Section 11b (CUSTOMER ONBOARDING) is deleted along with its section in the app.
     It specified an accounting handoff for won accounts, which is real work but is
     accounting's process, not a sales tool surface. Recoverable from git history. */

  biochar:{
    intro:"100% sugarcane-bagasse biochar from the Cora Texas mill (White Castle, LA). Oxygen-limited pyrolysis >500°C turns a renewable ag byproduct — no trees cut — into a stable, nutrient-bearing carbon. Its defining edge vs most biochar is the bagasse feedstock's naturally ordered honeycomb pore structure, which drives higher water-holding, nutrient retention, and microbial habitat than random-pore wood char.",
    spec:[
      ["Feedstock","100% sugarcane bagasse (renewable byproduct; no trees)"],
      ["Production","Oxygen-limited pyrolysis >500°C"],
      ["Pore structure","Ordered honeycomb (vs random/fractured wood char)"],
      ["Organic carbon","~58–65% (dry basis)"],
      ["Water-holding","~3–3.5× its weight (per technical report)"],
      ["Inherent nutrients","NPK ~0.6-0.2-0.7 + Ca & Mg (most wood char has ~none)"],
      ["H/C molar ratio","<0.7 → durable, long-term carbon"],
      ["Heavy metals","1–2 orders of magnitude BELOW IBI & EPA Class A thresholds"],
      ["Bulk density","~80–320 kg/m³ (low density → full-truckload discipline, 1-MT bags)"],
      ["Certifications","OMRI Listed · Puro.earth carbon pathway. Independently lab-tested against IBI test-panel thresholds (NOT IBI certified). No USDA Organic."],
      ["Carbon permanence","Stores carbon 200+ yrs (Puro methodology)"],
      ["CDR yield","~1.5–2.5 tCO2e per ton biochar (1.9 base case) — days-61–90 layer"],
    ],
    benefits:[
      { mech:"Water-holding", b:"Honeycomb pores hold ~3–3.5× their weight in water — drought resilience, fewer irrigation passes, real lift in sandy/degraded soils.", who:"Farmers · ranchers · blenders · nurseries", tier:2 },
      { mech:"Nutrient retention (CEC)", b:"Holds nutrients in the root zone → less leaching, better nutrient-use efficiency; complements (doesn't replace) the fertility program.", who:"Farmers · distributors", tier:2 },
      { mech:"Inherent nutrients", b:"Carries its own NPK (~0.6-0.2-0.7) + Ca/Mg — unlike most wood biochar, which is inert carbon only.", who:"Farmers · growers", tier:2 },
      { mech:"Microbial habitat", b:"Protected pore space houses soil microbes → healthier biology and rhizosphere.", who:"Farmers · ranchers · growers", tier:3 },
      { mech:"pH / liming", b:"Raises pH in acidic soils, improving nutrient availability.", who:"Farmers · ranchers", tier:3 },
      { mech:"Compost acceleration", b:"Peer-reviewed research: biochar can shorten the compost cycle ~10–30%, raise pile temperature, and cut nitrogen loss — more batches per year on the same pad.", who:"Compost yards · blenders", tier:3 },
      { mech:"Ammonia / odor binding", b:"UGA + composting studies show biochars lower ammonia and retain nitrogen in litter/manure — drier litter, less odor, better air quality.", who:"Poultry · ranchers · dairy", tier:3 },
      { mech:"Carbon permanence", b:"Durable carbon (H/C <0.7), Puro-certified pathway → a genuine carbon-negative story and a future CDR revenue layer (days 61–90).", who:"Distributors · ESG-minded buyers", tier:2 },
      { mech:"Poultry in-feed (GATED)", b:"Research shows FCR and body-weight gains at 0.5–1% inclusion and manure ammonia reduction — BUT feed claims are AAFCO/FDA-CVM gated. Frame as bedding/environmental until cleared.", who:"Poultry integrators · feed mills", tier:4 },
    ],
    comparisons:[
      { h:"Bagasse biochar vs Wood biochar", cols:["","Bagasse (ours)","Wood biochar"], rows:[
        ["Pore structure","Ordered honeycomb","Random / fractured"],
        ["Water-holding","~3–3.5×","~2×"],
        ["Inherent nutrients","Yes (NPK + Ca/Mg)","Minimal"],
        ["Best for","Sandy/degraded soils, compost, blends","Structural amendment only"],
      ]},
      { h:"Biochar vs Compost (use together)", cols:["","Biochar","Compost"], rows:[
        ["Carbon stability","Decades–centuries (recalcitrant)","Weeks–months (labile)"],
        ["Spec consistency","Lab-verified, consistent","Variable batch to batch"],
        ["Adds","Durable structure + water/nutrient holding","Biology + immediate organic matter"],
        ["Verdict","Complements compost — not a substitute","Pair for best result"],
      ]},
      { h:"Biochar vs Synthetic fertilizer alone", cols:["","With biochar","Fertilizer alone"], rows:[
        ["Leaching","Reduced (nutrients held in root zone)","Higher losses"],
        ["Nutrient-use efficiency","Improved","Baseline"],
        ["Water retention","Improved","None"],
        ["Role","Complements the fertility program","—"],
      ]},
      { h:"Poultry in-feed — research signals (GATED, do not claim)", cols:["Study","Rate","Reported effect"], rows:[
        ["Broiler 2021","3%","Worse starter, better grower-finisher FCR + full-cycle gain"],
        ["Broiler 2020","2–4%","Up to ~17% manure ammonia reduction; worse perf at higher dose"],
        ["Broiler 2025","1%","+ up to 4.7% body-weight gain; − up to 6.7% FCR"],
        ["Aflatoxin challenge","0.5%","Restored body weight vs aflatoxin-only control"],
        ["Commercial base case","0.5–1.0%","Cleanest market-sizing band (mixed results higher)"],
      ]},
      { h:"Market / cost positioning ($/ton)", cols:["","American BioCarbon bulk","Market"], rows:[
        ["List price","$450 / metric ton (live on the site, working checkout)","Wholesale $600 to $2,778; modal ~$1,600"],
        ["Quoting status","BLOCKED: freight and COGS unverified, so no firm biochar price goes out beyond the published $450/MT. The older $700/ton figure was an internal modeling placeholder and is superseded.",""],
        ["CA study","—","$600–$1,300 avg (20–40% bulk discounts)"],
        ["Angle","Enter low, undercut premium retail","Carbon layer can further subsidize price"],
      ]},
    ],
    avatars:[
      { name:"Ag Input Distributors & Co-ops", who:"Category / purchasing manager reselling inputs to growers", pain:"Need a differentiated, margin-accretive organic SKU their growers actually pull through", angle:"A carbon-negative, OMRI listed and lab-tested biochar with a real supply story + distributor margin — one line that differentiates the shelf", lead:"OMRI listing + IBI-panel lab reports + published USDA-ARS research + distributor margin model", sample:"Sample + program preview to evaluate with their team", claim:"" },
      { name:"Row-Crop & Specialty Growers (Farmers)", who:"Farmer / agronomy lead on sandy, drought-prone, or degraded ground", pain:"Water and fertilizer cost; yield variability on poor soils", angle:"Holds ~3–3.5× its weight in water and keeps nutrients in the root zone — more efficient water + fertilizer, better resilience", lead:"Water-holding report + NUE + published USDA-ARS field research (third-party)", sample:"Sample for a controlled strip/plot trial", claim:"Frame yield as trial-measured; no blanket yield guarantees" },
      { name:"Ranchers / Livestock & Pasture", who:"Rancher / land manager running pasture + livestock", pain:"Pasture productivity, soil water-holding, and manure/odor management", angle:"Improves pasture soil water + nutrient retention, and binds ammonia/odor in manure and high-traffic areas", lead:"Water-holding + ammonia/odor studies + soil health", sample:"Sample for a pasture soil or manure/bedding area trial", claim:"Environmental/soil framing; no animal-health claims" },
      { name:"Poultry / Chicken Farms", who:"Broiler/layer grower, barn manager, or integrator", pain:"Wet litter, ammonia, air quality, bird comfort — and feed efficiency (integrators)", angle:"TWO uses: (1) BEDDING/LITTER now — drier litter, lower ammonia, better air (claim-safe); (2) IN-FEED later — research shows FCR/gain + ammonia benefits at 0.5–1% (regulatory-gated)", lead:"Ammonia-reduction studies (bedding) · in-feed research pack (gated)", sample:"House trial on litter moisture/ammonia (bedding-only claims)", claim:"BEDDING/ABSORBENCY ONLY until AAFCO/FDA-CVM feed pathway clears. NO feed/health claims." },
      { name:"Compost Yards & Soil Blenders", who:"Owner/operator whose throughput is capped by cure time, or a blender needing differentiation", pain:"Turnover time caps batches/year; commodity blends compete on price", angle:"Shortens the compost cycle ~10–30% (more batches, same pad) and upgrades blends' water-holding + organic/carbon story", lead:"Compost cycle-time research + water-holding + windrow trial protocol", sample:"Bulk sample for a side-by-side windrow or blend trial", claim:"Cycle-time is Tier-3 general research — validate in THEIR windrow" },
      { name:"Nurseries / Greenhouses / Landscape", who:"Head grower, yard buyer, or landscape supplier", pain:"Media water-retention, premium differentiation, contractor/retail demand for organic", angle:"Biochar-based media component improves water retention and root-zone performance; premium, OMRI-listed, carbon-negative positioning", lead:"OMRI + water-holding + retail-bag option", sample:"Sample for a controlled media/grow trial", claim:"Media-property framing" },
    ],
    guardrails:[
      "One material, MANY avatars — lead with the ONE benefit that matters to the buyer in front of you, not the whole list.",
      "Never say IBI Certified (we have never held it) or USDA Organic (no certification, no filed application). Say OMRI Listed, and IBI tested for the lab work.",
      "Poultry IN-FEED and any feed/health claim is AAFCO/FDA-CVM gated — until cleared, sell poultry as BEDDING/environmental only.",
      "Compost cycle-time and yield lifts are Tier-3 general-biochar research → present as 'validate in your own trial,' never as a product-specific guarantee.",
      "Carbon/CDR is a days-61–90 layer — mention as upside, don't lead ag pitches with it.",
    ],
  },
};
