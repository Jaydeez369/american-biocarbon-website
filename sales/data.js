/* ============================================================
   VEJ SALES OS — single source of truth
   All strategy, copy, fields, pricing, KPIs live here.
   ============================================================ */
const DATA = {

  meta: {
    company: "VEJ · ProGreaux LLC · American BioCarbon",
    location: "White Castle, LA (co-located w/ Cora Texas Sugar Mill)",
    beachhead: "Louisiana → Gulf South → SE / Sunbelt; national only for large offtakes",
  },

  /* -------- Proof hierarchy (claim discipline) -------- */
  proofTiers: [
    { t:1, k:"proof-1", name:"Certified / Verified", ex:"OMRI Listed · IBI Certified · Puro.earth certified" },
    { t:2, k:"proof-2", name:"Lab-tested", ex:"Control Labs IBI panels: H/C, surface area, heavy metals, NPK" },
    { t:3, k:"proof-3", name:"Field-trial supported", ex:"USDA-ARS multi-year LA sugarcane bagasse biochar study" },
    { t:4, k:"proof-4", name:"Customer-reported (anecdotal)", ex:"Charley's Chicks litter/mortality observations" },
    { t:5, k:"proof-5", name:"Hypothesis / needs validation", ex:"$/ton CDR revenue, yield lift %, feed claims" },
  ],

  /* -------- KPI strip on overview -------- */
  overviewKpis: [
    { l:"Live products (sample-ready)", v:"2", d:"Absorbent Pellets (1 lb) · 100% Biochar (8 oz)" },
    { l:"Month-1 first win", v:"Free samples", d:"Samples in buyers' hands — the ONLY ask in outreach" },
    { l:"Bulk selling / LOI talk now?", v:"No", d:"No bulk yet; LOIs are a quiet 1:1 step after a trial wins" },
    { l:"Month-1 target", v:"15–25 samples", d:"Free samples shipped + trials started across both products" },
  ],

  /* ============ 1. EXECUTIVE SUMMARY ============ */
  exec: {
    thesis: "Month 1 is SAMPLES-FIRST — NOT bulk selling and NOT LOI-selling. Production capacity (~400 MT/mo) isn't ready to commit tonnage, so we do not quote or sell bulk yet. The single goal is to get free performance samples of our two live products (Absorbent Pellets, 100% Biochar) into buyers' hands — that is the first win we optimize the entire machine for. Outreach never mentions LOIs, contracts, or commitments; the only ask is 'test a free sample against what you use now.' The engine follows the ReRoofGen / Instantly playbook: 1,000+ verified contacts, warmed multi-inbox domains, many short hyper-targeted-to-ICP campaigns, and heavy A/B testing. LOIs, reorders, bulk orders, and the CDR/carbon layer are all quiet later steps that only happen 1:1 after a sample wins a trial and Q4 capacity firms up.",
    wedge: "Absorbent Pellets into oil & gas, spill-response, landfill, and industrial EHS buyers are the fastest free-sample yes: active, budgeted, recurring absorbent demand and short eval cycles — they'll test on the next job. Biochar into ag distributors, compost/soil blenders, nurseries, and growers is the highest-leverage channel to seed with samples — one distributor represents many acres of future volume. Everything beyond these two products shows as 'Coming Q4.' A free sample is the low-friction yes; the trial win is what everything downstream (reorders, LOIs, offtake) is built on.",
    reinforce: [
      "Free sample in hand IS the Month-1 conversion event. Nothing is asked for beyond a test — no PO, no LOI, no commitment.",
      "Run it like ReRoofGen: many parallel hyper-ICP-targeted email campaigns + calls + DMs, A/B tested on subject line, opener, and angle. Same free-sample offer, packaging tuned per segment.",
      "LOIs are internal and later — they only surface 1:1 after a trial wins, and never in a cold touch. Winning trials aggregate into committed volume that de-risks the raise.",
      "No bulk delivery is promised before Q4. Get the product in hands now; the commercial back-half follows the win.",
      "Rebrand note: American BioCarbon → ProGreaux (~Aug 17). Keep cold outreach brand-light; fold the rebrand into site + collateral in days 31–60 without blocking today's launch.",
    ],
    fastRevenue: "Free sample (Pellets 1 lb / Biochar 8 oz, 4–7 biz days from LA) → test against current material → capture the trial result. Absorbent buyers test fastest; seed biochar distributors in parallel. Founder/consultant-led, high-volume outbound, no ads. Reorders/LOIs handled 1:1 off winning trials.",
    fastRecurring: "Convert winning sample trials into reorders and, 1:1 and later, LOIs that reserve Q4 supply, locked pricing, and territory; the distributor channel carries the most future volume.",
    fastOfftake: "Aggregate winning trials + signed LOIs into a committed-volume book for the raise; advance the largest toward binding Q4 offtake as capacity firms up. CDR/carbon conversations open in days 61–90.",
  },

  /* ============ 2. ASSUMPTIONS + MISSING INPUTS ============ */
  assumptions: [
    { a:"Capacity is constrained (~400 MT/mo) — NOT enough to commit bulk now; Month 1 sells free samples + LOIs only, bulk supply comes online Q4", why:"Governs what we can promise: no bulk POs, LOIs lock future Q4 supply", conf:"High", verify:"Confirm Q4 capacity ramp timing & tons/month by product with ops" },
    { a:"Delivered product margin survives freight inside ~300 mi", why:"Bulk low-density product; freight can erase margin", conf:"Med", verify:"Real LTL/TL rates by zone from 2–3 carriers" },
    { a:"CDR credits are monetizable per deployed ton via Puro.earth pathway", why:"Second revenue layer underpins pricing", conf:"Med", verify:"MRV cost, $/tCO2e, buyer/broker, issuance lag" },
    { a:"20/40lb + 1MT bags + bulk are all currently packable", why:"Determines which segments we can serve now", conf:"Med", verify:"Confirm live packaging formats & lead times" },
    { a:"Founder-led sales for first 90 days", why:"No team yet; sets capacity of the plan", conf:"High", verify:"n/a" },
  ],
  missingInputs: [
    { i:"Production capacity / month by product", who:"Ops / plant", impact:"Caps promiseable volume & offtake scope", tmp:"Assume pallet–TL served; offtake staged" },
    { i:"Inventory on hand by SKU", who:"Ops", impact:"Sample & first-order fulfillment speed", tmp:"Assume sample + pallet available" },
    { i:"Price floors & COGS by product", who:"Finance/founder", impact:"Every quote & margin gate", tmp:"Placeholder model in Pricing tab" },
    { i:"Freight rates by zone", who:"Logistics", impact:"Delivered margin, national viability", tmp:"Zone A/B/C placeholders" },
    { i:"CDR $/tCO2e + tCO2e per ton biochar", who:"Carbon partner", impact:"Blended margin, pricing aggressiveness", tmp:"Marked ESTIMATE, excluded from committed margin" },
    { i:"MRV requirements & cost", who:"Carbon partner", impact:"Which deals are credit-eligible", tmp:"Require application/GPS + weight docs" },
    { i:"Official claim language / cert status", who:"Founder/legal", impact:"Legal exposure on collateral", tmp:"Proof hierarchy enforced" },
    { i:"Payment terms & MOQ", who:"Founder", impact:"Distributor & procurement fit", tmp:"Net-15 pilot / Net-30 established" },
    { i:"Distributor margin target & exclusivity rules", who:"Founder", impact:"Reseller economics & conflicts", tmp:"25–35% margin, no exclusivity yr 1" },
  ],

  /* ============ 3. ICP SEGMENTS ============ */
  segments: [
    {
      id:"compost", group:"Ag / Hort", name:"Commercial Composters & Compost Yards", tag:"Biochar · high-value LOI",
      summary:"Compost producers whose economics are gated by TURNOVER TIME. Peer-reviewed research shows biochar accelerates the compost cycle — faster maturity means more batches/year on the same pad, higher throughput, and more revenue. This is our sharpest, highest-urgency wedge: we don't sell an amendment, we sell throughput.",
      coreProblem:"Long compost turnover time caps how many batches they can finish per year. Every day shaved off the cycle frees pad space and adds sellable volume — so cycle-time reduction converts directly into revenue.",
      valueProp:"Biochar-amended windrows reach the thermophilic phase faster, run hotter, and break down organic matter quicker — research reports ~10–30% shorter cycles (e.g. 10% biochar cut ~14 days; maturity 40→30 / 25→19 / 18→10 days across studies). Same pad, more turns, more tons sold, plus a premium biochar-enriched finished product.",
      firmo:"Municipal & merchant composters, organics recyclers, compost yards · pad/windrow-space constrained · sells finished compost by yd³/ton",
      titles:["Owner / GM","Compost Operations Manager","Site / Pad Manager","Purchasing"],
      econ:"Owner / GM", tech:"Compost operations manager", user:"Windrow / pad crew",
      pains:["Long turnover time caps annual throughput & revenue","Pad/space is the bottleneck — batches sit too long curing","Feedstock backs up faster than it cures","Odor, nitrogen loss, and inconsistent maturity","Wants to grow volume without buying more land"],
      triggers:["Capacity maxed / feedstock backlog","Expanding output without new pad space","Odor or compliance complaints","New offtake contract for finished compost","Peak-season throughput crunch"],
      urgency:["Backlogged feedstock right now","Season throughput crunch","Signed a finished-compost supply deal they can't keep up with"],
      disq:["No throughput/space constraint","Won't run a windrow trial","No way to measure days-to-maturity"],
      order:"Free sample + windrow trial → signed LOI (locks Q4 supply/pricing)", cycle:"3–8 weeks (one compost cycle proves it, then the LOI)",
      proof:["Peer-reviewed cycle-time reduction (T3, general biochar)","Own side-by-side windrow A/B trial","Maturity + temperature + odor/N-loss data","Honeycomb pore structure = microbial habitat","Spec + OMRI"],
      objections:["Adds cost per yard","Need to see it in MY windrow","Dosing / how much per ton","Wood biochar cheaper"],
      offer:"Side-by-side windrow trial — biochar-amended vs control, measure days-to-maturity and peak temp", channel:"Direct call + site visit + windrow trial",
      tags:["seg:compost","persona:ops","zoneA","zoneB"],
      rank:{ speed:3, recurring:5, margin:4, carbon:5, strategic:5, freight:5, complexity:2 }
    },
    {
      id:"soilblend", group:"Ag / Hort", name:"Soil & Media Blenders", tag:"Biochar · supporting",
      summary:"Regional soil/media blenders that buy amendments in volume and resell engineered/premium blends. Best freight fit + fast reorder loop. Lead with moisture performance and a differentiated organic/carbon SKU (and cross-sell throughput to any who also compost).",
      coreProblem:"Blend quality and differentiation — sandy/premium mixes fail on water-holding, and they need an organic/carbon story to win engineered-soil bids without eroding margin.",
      valueProp:"Bagasse biochar screens clean into blends and holds ~3–3.5x its weight in water, firming up moisture performance in sandy and premium mixes, with inherent nutrients and an OMRI/carbon-negative story that lifts the blend's positioning.",
      firmo:"$2M–$50M rev · regional · buys by pallet/TL · owns blending + bagging",
      titles:["Owner / GM","Operations Manager","Purchasing / Buyer","Head Blender"],
      econ:"Owner / GM", tech:"Operations / Blend manager", user:"Yard crew",
      pains:["Inconsistent amendment quality","Water-holding complaints in sandy mixes","Margin pressure on premium blends","Customers asking for organic / carbon story","(If they compost feedstock) slow cure time caps supply"],
      triggers:["Launching a premium or organic line","Drought / water complaints","Losing bids on 'engineered' soils","Supplier quality miss"],
      urgency:["Spring build season","New retail contract","Competitor launched biochar blend"],
      disq:["No storage for bulk","Outside freight-viable zone w/ small volume","Won't trial"],
      order:"Free sample + pallet blend trial → signed LOI (Q4 supply)", cycle:"2–6 weeks",
      proof:["IBI/OMRI docs","Water-holding (3–3.5x) tech report","Spec sheet + SDS","Sample bag","Compost cycle-time data (if they cure feedstock)"],
      objections:["Wood biochar cheaper","Freight","Need proof it blends"],
      offer:"Free qualified sample + pallet trial w/ blend guidance", channel:"Direct call + field visit + email",
      tags:["seg:soilblend","persona:ops","zoneA"],
      rank:{ speed:3, recurring:5, margin:4, carbon:4, strategic:4, freight:5, complexity:2 }
    },
    {
      id:"agdist", group:"Ag / Hort", name:"Ag Input Distributors & Co-ops", tag:"Beachhead #2 · highest-leverage LOI",
      summary:"Distributors and farm co-ops that resell inputs to growers. THE highest-leverage LOI in the book — one distributor commitment represents many acres of Q4 volume, and unlocks B2B2C reach without our own field team. Seed with a free biochar sample now, reserve territory + pricing with an LOI.",
      firmo:"Regional/multi-branch · sells to growers · TL logistics in-house",
      titles:["Category / Product Manager","Purchasing Director","Branch Manager","Agronomy Lead"],
      econ:"Purchasing Director / Owner", tech:"Agronomy lead", user:"Grower customers",
      pains:["Need differentiated organic SKU","Grower demand for water/fertilizer efficiency","Thin margins on commodity inputs"],
      triggers:["Building organic/regenerative line","Grower requests","Carbon program participation"],
      urgency:["Pre-season stocking","Grant / cost-share programs","Competitor exclusivity threat"],
      disq:["Wants national exclusivity yr 1","No organic demand in region"],
      order:"Free sample + program preview → distributor LOI (reserves territory + Q4 volume)", cycle:"1–4 months",
      proof:["USDA-ARS field study","Certs","Distributor margin calc","Grower ROI calc"],
      objections:["Unproven demand","Margin","Support/marketing help"],
      offer:"Stocking pilot + co-branded grower trial program", channel:"Direct + trade assoc + referral",
      tags:["seg:agdist","persona:catman","zoneA","zoneB"],
      rank:{ speed:4, recurring:5, margin:4, carbon:5, strategic:5, freight:4, complexity:3 }
    },
    {
      id:"remediation", group:"Industrial", name:"Spill-Response & Environmental Remediation", tag:"Beachhead #1 · fastest sample→LOI",
      summary:"Contractors and enviro firms buying absorbents for spills, leachate, and industrial cleanup. The PRIMARY Month-1 wedge — active, budgeted, recurring absorbent demand and short eval cycles convert a free sample to an LOI fastest. Absorbent pellets (up to ~5:1) beat wood (~2.5:1) on performance-per-dollar.",
      firmo:"Field service contractors · buys absorbents recurring · compliance-driven",
      titles:["Procurement Manager","Project Manager","Safety / EHS Manager","Warehouse Buyer"],
      econ:"Procurement / Ops Director", tech:"EHS / Project manager", user:"Field crews",
      pains:["Absorbent volume & disposal cost","Performance in the field","Sustainability reporting pressure"],
      triggers:["New contract / site","Poor absorbent performance","ESG mandate","Disaster season"],
      urgency:["Active spill / event","Bid response","Annual supply RFP"],
      disq:["Only wants viscous-spill sorbent","No recurring volume"],
      order:"Free sample + head-to-head demo → signed LOI (standing Q4 supply)", cycle:"3 weeks–3 months",
      proof:["5:1 vs 2.5:1 spec","SDS","Absorbency demo","Cost-per-gallon calc"],
      objections:["Already have absorbents","Need SDS/approvals","Disposal path"],
      offer:"Head-to-head absorbency demo + trial drum/pallet", channel:"Cold call + LinkedIn + demo",
      tags:["seg:remediation","persona:procurement","zoneA","zoneB","natl"],
      rank:{ speed:5, recurring:4, margin:4, carbon:2, strategic:4, freight:4, complexity:3 }
    },
    {
      id:"landscape", group:"Ag / Hort", name:"Landscape & Nursery Supply Yards", tag:"",
      summary:"Landscape supply and nursery/greenhouse distributors serving contractors and growers. Good pallet volume, premium positioning.",
      firmo:"Regional yards · contractor + retail traffic · seasonal",
      titles:["Buyer","Yard Manager","Owner"],
      econ:"Owner / Buyer", tech:"Yard manager", user:"Landscapers/growers",
      pains:["Differentiation vs big box","Water retention in installs","Organic demand"],
      triggers:["Premium line launch","Drought","Contractor requests"],
      urgency:["Spring season","New account"],
      disq:["No volume","Freight-negative"],
      order:"Free sample → signed LOI (Q4 supply)", cycle:"2–6 weeks",
      proof:["OMRI","Water-holding report","Retail bags","Sample"],
      objections:["Price","Turns/velocity","Merch support"],
      offer:"Retail-bag placement + sample", channel:"Field visit + call",
      tags:["seg:landscape","persona:landbuyer","zoneA","zoneB"],
      rank:{ speed:3, recurring:4, margin:4, carbon:3, strategic:3, freight:4, complexity:2 }
    },
    {
      id:"landfill", group:"Industrial", name:"Landfills & Municipal Public Works", tag:"",
      summary:"Waste operators and municipal public works for leachate control, spill kits, and storm cleanup. Larger, slower, contract-driven.",
      firmo:"Waste majors + municipalities · procurement/bid cycles",
      titles:["Operations Director","Procurement / Purchasing","Public Works Director","EHS"],
      econ:"Ops Director / Procurement", tech:"EHS", user:"Site crews",
      pains:["Leachate handling cost","Compliance","Sustainability optics"],
      triggers:["Leachate issue","RFP","Storm season","Sustainability mandate"],
      urgency:["Active compliance need","Budget cycle"],
      disq:["Bid locked to incumbent","No budget cycle window"],
      order:"Free sample + pilot → signed LOI (Q4 supply contract)", cycle:"2–6 months",
      proof:["SDS","Leachate absorbency","Certs","Case reference"],
      objections:["Procurement process","Incumbent","Disposal"],
      offer:"Pilot + bid/RFP response kit", channel:"RFP + direct + referral",
      tags:["seg:landfill","persona:opsdir","zoneA","zoneB","natl"],
      rank:{ speed:2, recurring:4, margin:3, carbon:2, strategic:4, freight:3, complexity:4 }
    },
    {
      id:"oilfield", group:"Industrial", name:"Oil & Gas Services", tag:"",
      summary:"Oilfield service companies for drilling/fracking fluid solidification and spill remediation. High volume, Gulf-dense, price + performance driven.",
      firmo:"OFS contractors · Gulf Coast dense · recurring consumables",
      titles:["Procurement Manager","Field Supervisor","HSE Manager"],
      econ:"Procurement / Ops", tech:"HSE / Field supervisor", user:"Rig/field crews",
      pains:["Fluid solidification cost","Disposal","HSE + ESG scrutiny"],
      triggers:["New job/site","Absorbent underperformance","ESG reporting"],
      urgency:["Active job","Supply RFP"],
      disq:["Viscous-only need","No recurring volume"],
      order:"Free sample + field demo → signed LOI (Q4 supply agreement)", cycle:"1–3 months",
      proof:["5:1 absorbency","SDS","Field demo","Cost calc"],
      offer:"Field trial + solidification demo", objections:["Incumbent","Approvals","Price"], channel:"Cold call + referral + demo",
      tags:["seg:oilfield","persona:procurement","zoneA","natl"],
      rank:{ speed:4, recurring:4, margin:4, carbon:2, strategic:4, freight:3, complexity:4 }
    },
    {
      id:"bedding", group:"Industrial", name:"Animal Bedding Distributors", tag:"",
      summary:"Bedding distributors for poultry/livestock. Absorbency + litter quality story. Feed/health claims gated behind regulatory review.",
      firmo:"Ag bedding distributors · recurring bulk · price-sensitive",
      titles:["Buyer","Owner","Barn / Operations Manager"],
      econ:"Owner / Buyer", tech:"Barn manager", user:"Growers/farmers",
      pains:["Litter moisture / ammonia","Bird comfort","Cost per house"],
      triggers:["Wet litter issues","New integrator spec","Cost pressure"],
      urgency:["Flock cycle","Seasonal moisture"],
      disq:["Wants unapproved feed claims from us","No volume"],
      order:"Free sample + house trial → signed LOI (Q4 supply)", cycle:"3–8 weeks",
      proof:["Absorbency spec","Charley's Chicks (anecdotal, flagged)","SDS"],
      objections:["Price vs shavings","Proof","Claims/regulatory"],
      offer:"House trial (bedding-only claims)", channel:"Direct + referral",
      tags:["seg:bedding","persona:opsdir","zoneA","zoneB"],
      rank:{ speed:3, recurring:4, margin:3, carbon:3, strategic:3, freight:4, complexity:3 }
    },
    {
      id:"cdr", group:"Carbon / ESG", name:"CDR / ESG Buyers & Brokers", tag:"PARKED · days 61–90",
      summary:"Corporate carbon-removal buyers, brokers, and marketplaces. PARKED for Month 1 — it needs verifiable deployed volume we don't yet have. Deployment (post-Q4 capacity) creates the credit supply they buy; open these conversations in days 61–90.",
      firmo:"Corporates w/ net-zero goals · brokers · CDR marketplaces",
      titles:["Head of Sustainability","Carbon/Climate Procurement","ESG Manager","Broker / Originator"],
      econ:"Sustainability / Procurement lead", tech:"MRV / carbon analyst", user:"ESG reporting team",
      pains:["Need durable, verifiable removal","Additionality & MRV rigor","Supply reliability"],
      triggers:["Annual carbon budget","Net-zero deadline","Puro/registry demand"],
      urgency:["Year-end procurement","Reporting cycle"],
      disq:["Wants credits with no deployment data","Sub-scale one-off"],
      order:"Forward purchase / offtake", cycle:"2–6 months",
      proof:["Puro.earth certified","H/C < 0.7 permanence","Deployment + MRV records"],
      objections:["Permanence/additionality","Volume reliability","Price"], offer:"Forward purchase tied to deployment pipeline", channel:"Warm intro + marketplace + broker",
      tags:["seg:cdr","persona:sustain","natl"],
      rank:{ speed:1, recurring:3, margin:5, carbon:5, strategic:5, freight:5, complexity:4 }
    },
  ],

  /* ============ 4. PERSONAS ============ */
  personas: [
    { id:"ops", name:"Compost / Blend Operations Manager", seg:"Composters & soil blenders",
      cares:"Throughput & turnover time, pad space, moisture performance, consistency, on-time freight",
      fears:"A new input that slows a batch, contaminates a windrow, or is inconsistent/late",
      needs:"A side-by-side windrow trial he can measure (days-to-maturity, peak temp), spec sheet, SDS",
      lang:"'turnover', 'windrow', 'cure time', 'yards', 'batch', 'maturity', 'pad space'",
      hates:"Carbon-credit jargon, vague eco pitches, no specs, claims he can't measure himself",
      disc:["What's your current compost turnover time, and what's the bottleneck — space or cure time?","How many batches/turns could you sell if the cycle were 2–4 weeks shorter?","Would you run a biochar-amended windrow next to a control so you can measure days-to-maturity yourself?"],
      open:"Research shows biochar can cut compost cycle time 10–30% — more batches per year on the same pad. Want to run one windrow with it against a control and measure the difference yourself?",
      cta:"Set up a side-by-side windrow trial + send spec/SDS" },
    { id:"catman", name:"Distributor Category Manager", seg:"Ag distribution",
      cares:"Sell-through, margin, differentiation, low support burden",
      fears:"Dead inventory, a SKU growers won't pull through",
      needs:"Proof of demand, margin math, grower-facing ROI, marketing support",
      lang:"'turns', 'sell-through', 'program', 'margin', 'grower'",
      hates:"Unproven products with no pull-through plan",
      disc:["What's driving your organic/regenerative SKU decisions?","Which growers are asking about water or carbon?","What margin and support do you need to stock a new line?"],
      open:"We're a Louisiana carbon-negative soil amendment with certs and a USDA-ARS field study — want to see the distributor margin + grower ROI model?",
      cta:"Propose a stocking pilot + co-branded grower trial" },
    { id:"landbuyer", name:"Landscape Supply Buyer", seg:"Landscape/nursery",
      cares:"Velocity, premium margin, contractor demand, seasonal fit",
      fears:"Slow-moving pallets, price objections from contractors",
      needs:"Retail bags, water-retention proof, sample, merch",
      lang:"'installs', 'contractors', 'retail bag', 'season'",
      hates:"Bulk-only when he needs bagged, no merch support",
      disc:["What premium amendments move for you now?","Where do installs fail on water?","Bag or bulk for your traffic?"],
      open:"OMRI-listed biochar in retail bags that cuts watering on installs — want samples for the yard?",
      cta:"Place retail bags + sample" },
    { id:"procurement", name:"Industrial Procurement Manager", seg:"Remediation/oilfield",
      cares:"Cost-per-job, performance, SDS/approvals, reliable supply",
      fears:"An absorbent that underperforms mid-cleanup or fails compliance",
      needs:"SDS, absorbency proof (5:1), trial, disposal path",
      lang:"'sorbent', 'per drum', 'SDS', 'disposal', 'job'",
      hates:"Green pitches with no spec or SDS",
      disc:["What absorbent are you running and cost per job?","Where does it underperform?","What's needed to test a free sample on the next job — and to lock Q4 supply with an LOI if it wins?"],
      open:"Bagasse absorbent soaks up to ~5:1 vs ~2.5:1 for wood — fewer bags per spill. Want a free sample + a head-to-head demo?",
      cta:"Book absorbency demo + ship free sample; present LOI on a win" },
    { id:"opsdir", name:"Operations / EHS Director", seg:"Landfill/PW/bedding",
      cares:"Compliance, total cost, reliability, reporting optics",
      fears:"Compliance miss, procurement risk, disposal liability",
      needs:"Certs, SDS, pilot data, references",
      lang:"'compliance', 'leachate', 'RFP', 'budget cycle'",
      hates:"Vendors who don't understand procurement/bid process",
      disc:["Where's leachate/moisture costing you now?","What's your procurement/bid timeline?","What would a successful pilot need to show?"],
      open:"Plant-based absorbent for leachate/spill control with SDS and certs — want to scope a pilot for the next budget cycle?",
      cta:"Scope pilot + RFP response kit" },
    { id:"sustain", name:"Corporate Sustainability / CDR Buyer", seg:"Carbon/ESG",
      cares:"Durable, verifiable removal; MRV rigor; supply reliability",
      fears:"Buying credits that don't survive scrutiny; greenwash risk",
      needs:"Puro certification, permanence data, deployment + MRV records",
      lang:"'durability', 'MRV', 'additionality', 'tCO2e', 'registry'",
      hates:"Vague 'sustainable' claims, credits with no deployment evidence",
      disc:["What's your removal target and durability threshold?","Which registries/standards do you require?","Forward purchase or spot, and what volume?"],
      open:"Puro-certified biochar removal from Louisiana ag waste, with deployment-level MRV records — want to discuss a forward purchase tied to our deployment pipeline?",
      cta:"Share deployment pipeline + forward-purchase term sheet" },
  ],

  /* ============ 5. MESSAGING ============ */
  messaging: {
    splitRule:"TWO SEPARATE AVATARS — NEVER mix products in one pitch. Absorbent Pellets and Biochar go to two completely different people with different pain, language, proof, and channel. An absorbent pitch never says 'biochar / soil / compost / OMRI / carbon.' A biochar pitch never says 'spill / absorbent / SDS-for-disposal / oilfield / leachate.' Every email, call, landing page, one-pager, and deck is SINGLE-PRODUCT. If a contact somehow fits both, run two separate threads.",
    tracks:[
      {
        id:"absorbent", product:"Absorbent Pellets",
        audience:"Oil & Gas · Spill Response · Environmental Remediation · Landfill · Industrial EHS",
        avatar:"An HSE/EHS manager, field/ops supervisor, or procurement lead at an industrial or oilfield operation. They already buy clay or wood absorbents on a recurring, budgeted line. They think in bags-per-spill, disposal weight and cost, SDS, approvals, and job cost — NOT agronomy, soil, or carbon. They want proof it performs on a real cleanup and that it won't fail a compliance review.",
        positioning:"For industrial, oilfield, spill-response, and landfill teams, ProGreaux Absorbent Pellets are a plant-based sugarcane-bagasse sorbent that holds up to ~5× its weight (vs ~2.5× for wood) — so crews open about half the bags and send lighter saturated waste to disposal, at a fraction of the cost-per-gallon of clay or cellulose.",
        oneLiner:"A plant-based industrial absorbent that holds up to ~5× its weight — half the bags, lighter disposal, ~$0.15/gal absorbed.",
        pitch30:"You're buying clay or wood absorbents that barely hold their own weight. Ours is a sugarcane-bagasse pellet that soaks up to ~5× its weight — about half the bags per spill and less saturated weight to disposal, which is billed by the pound. 100% organic, low-dust, SDS on file. Want a free sample to run against what you use now on your next cleanup?",
        pitch90:"ProGreaux makes an industrial absorbent from sugarcane bagasse at the Cora Texas mill in White Castle, LA. Bagasse has a naturally ordered, honeycomb pore structure, so carbonized and pelletized it draws in and holds up to ~5× its weight in non-viscous liquid — versus about 2.5× for wood pellets. On a real spill that means roughly half the bags to handle and less saturated weight going to disposal, and since disposal is billed by the pound, that's fewer pounds and fewer truckloads hauled. It's 100% organic biomass with no chemical additives, low dust, and renewable. SDS and spec sheet are on file for your procurement and EHS review. Easiest way to see it: a free sample to run head-to-head against your current absorbent on the next cleanup.",
        proof:["Up to ~5:1 absorption vs ~2.5:1 wood (product spec / lab)","SDS + spec sheet on request","Cost-per-gal absorbed ~$0.15 vs ~$2.88 cellulose / ~$7.31 clay","100% organic bagasse, low dust, no additives","Fewer bags + lighter saturated disposal weight per spill"],
        neverSay:["biochar","soil / compost / windrow","OMRI / IBI / organic","carbon / CDR credits","water-holding / agronomy"]
      },
      {
        id:"biochar", product:"100% Biochar",
        audience:"MULTIPLE avatars — Distributors/Co-ops · Row-Crop & Specialty Farmers · Ranchers/Livestock · Poultry/Chicken farms · Compost/Soil Blenders · Nurseries/Greenhouses",
        avatar:"Biochar is the DYNAMIC product — one material, many different buyers, each with a different pain and a different lead benefit. Do NOT use a generic biochar pitch: pull the ONE benefit that matters to the buyer in front of you (water-holding for farmers, ammonia/odor for poultry & ranchers, cycle-time for composters, margin/differentiation for distributors, media performance for nurseries). Full per-avatar messaging, specs, benefit-by-mechanism, and industry comparisons live in the → Biochar Specs & Avatars tab. Common ground: they think in yards/blends/water-holding/OMRI/sell-through — NOT spills, SDS, or oilfield.",
        positioning:"For ag distributors, soil/compost blenders, and growers, ProGreaux 100% Biochar is an OMRI-listed, IBI-certified sugarcane-bagasse biochar whose ordered honeycomb pore structure holds ~3–3.5× its weight in water and carries inherent nutrients (~0.6-0.2-0.7 NPK + Ca/Mg) — a differentiated, carbon-negative SKU that improves water/nutrient retention and, per research, can shorten compost cycles ~10–30%.",
        oneLiner:"OMRI-listed sugarcane biochar that holds ~3–3.5× its weight in water and can shorten compost cycles ~10–30% — a differentiated, margin-accretive line.",
        pitch30:"Commodity amendments compete on price alone. Ours is an OMRI-listed, IBI-certified bagasse biochar with an ordered honeycomb pore structure that holds ~3–3.5× its weight in water and carries inherent nutrients — so it firms up water-holding in sandy and premium blends and, per peer-reviewed research, can shorten compost cycles ~10–30%. Differentiated line, real supply story. Want a free sample to trial in one blend or windrow?",
        pitch90:"ProGreaux makes a 100% sugarcane-bagasse biochar at the Cora Texas mill in White Castle, LA. Unlike most wood biochar, bagasse has a naturally ordered honeycomb pore structure that holds roughly 3–3.5× its weight in water, retains nutrients, and gives soil microbes protected habitat — and it carries inherent nutrients (~0.6-0.2-0.7 NPK plus Ca/Mg). It's OMRI Listed and IBI Certified, lab-verified below IBI and EPA Class A heavy-metal thresholds, and backed by a multi-year USDA-ARS field study. For blenders it firms up moisture performance in sandy and premium mixes; for composters, peer-reviewed research shows biochar can shorten the cycle ~10–30% — more batches per year on the same pad. Best way to prove it is in your own operation: a free sample to run in one blend or a side-by-side windrow.",
        proof:["OMRI Listed · IBI Certified","Holds ~3–3.5× its weight in water (technical report)","Inherent NPK ~0.6-0.2-0.7 + Ca/Mg","USDA-ARS multi-year bagasse field study","Compost cycle ~10–30% shorter (peer-reviewed — validate in own windrow)","Heavy metals well below IBI / EPA Class A"],
        neverSay:["spill / cleanup","absorbent / sorbent / 5:1","SDS for disposal","oilfield / leachate / remediation","bags per spill"]
      }
    ],
    productPos:[
      { p:"Agricultural biochar", m:"Honeycomb bagasse structure → ~3–3.5x water-holding, inherent NPK + Ca/Mg, OMRI/IBI certified. A conditioner AND a nutrient-bearing matrix, not just black carbon." },
      { p:"Biochar-infused soil", m:"Ready-to-use blend — water retention, nutrient-holding, aeration with zero mixing. Drops into beds, pots, installs from the first watering." },
      { p:"Absorbent pellets", m:"5:1 absorption vs ~2.5:1 for wood — fewer bags per spill, lower disposal volume, plant-based & carbon-neutral. Spill, leachate, oilfield fluid, disaster." },
      { p:"Absorbent crumble", m:"Coarser form for fast, broad coverage on large-area / high-volume spills. Same 100% bagasse, spreads faster." },
      { p:"Carbon removal credits", m:"Durable removal (H/C < 0.7), Puro-certified, generated by deploying the product. Sold as a layer on top of product movement — supply is our tons deployed." },
    ],
    comparisons:[
      { vs:"vs Wood biochar", win:"Ordered honeycomb pores → higher water-holding & nutrient retention; inherent nutrients; no trees cut" },
      { vs:"vs Synthetic fertilizer alone", win:"Reduces leaching, improves nutrient-use efficiency & water retention; complements — not replaces — fertility program" },
      { vs:"vs Compost alone", win:"Stable recalcitrant carbon (decades+), consistent lab-verified spec, adds durable structure compost can't" },
      { vs:"vs Wood/clay absorbents", win:"5:1 vs 2.5:1 absorbency; plant-based, carbon-neutral; lower disposal volume per gallon captured" },
      { vs:"vs Doing nothing", win:"Water/fertilizer efficiency, compliance & ESG story, differentiated resale SKU" },
      { vs:"vs Buying carbon credits w/o product", win:"Real deployed tons + MRV trail = defensible, durable removal — not paper offsets" },
    ],
    dualStory:"Simple version for buyers: You buy and use the product for its performance — water-holding, absorbency, soil health. Because our biochar locks carbon into a stable form for the long haul, the act of using it removes CO₂. That removal is independently certified (Puro.earth) and can be sold as a carbon credit. We handle the carbon side; you get a better product, often at better economics because the carbon layer subsidizes the price.",
    proofMap:[
      { claim:"Accelerates composting / shorter turnover time", rel:"Composters, soil blenders", src:"Peer-reviewed (general biochar)", tier:3, safe:"Research shows biochar can shorten the compost cycle ~10–30% and speed maturity — validate in your own windrow trial", risk:"'Our biochar cuts 14 days off your compost' (no VEJ-specific trial yet)" },
      { claim:"~3–3.5x water-holding capacity", rel:"Blenders, growers, landscape", src:"Lab-tested / ProGreaux report", tier:2, safe:"Holds roughly 3–3.5x its weight in water (bagasse biochar, per technical report)", risk:"'Holds 5x water' as a blanket claim" },
      { claim:"5:1 absorption ratio", rel:"Remediation, oilfield, bedding", src:"Product spec / lab", tier:2, safe:"Up to ~5:1 absorption vs ~2.5:1 for wood pellets", risk:"'Absorbs any chemical' — specify non-viscous" },
      { claim:"OMRI Listed / IBI Certified", rel:"Organic ag, distributors", src:"Certified", tier:1, safe:"OMRI Listed and IBI Certified", risk:"'USDA Organic certified' — it's PENDING" },
      { claim:"Puro.earth certified carbon", rel:"CDR/ESG buyers", src:"Certified", tier:1, safe:"Puro.earth certified carbon removal", risk:"Stating a fixed $/ton or tCO2e without confirmation" },
      { claim:"Low heavy metals", rel:"Organic, food-chain, compliance", src:"Lab (Control Labs IBI)", tier:2, safe:"Heavy metals 1–2 orders of magnitude below IBI/EPA Class A thresholds", risk:"'Zero contaminants'" },
      { claim:"Permanence / carbon-negative", rel:"CDR buyers", src:"Lab (H/C) + standard", tier:2, safe:"H/C molar ratio < 0.7 supports durable, long-term carbon retention", risk:"'Permanent forever' without standard reference" },
      { claim:"Yield / poultry health benefits", rel:"Growers, bedding", src:"Customer-reported / needs validation", tier:4, safe:"Customer-reported observations; not a formal performance or feed claim", risk:"Any feed/health claim as fact (AFIA/AAFCO/GRAS review required)" },
    ],
  },

  /* ============ 6. TAM/SAM/SOM ============ */
  // Sourced from the transport-aware deep-research model (2026-07-13). Parent-market inputs are
  // cited public anchors (USGS, USDA-AMS, IFEEDER/NARA, Grand View, Puro/CDR.fyi); [A] = stated assumption.
  market: {
    note:"HEADLINE: freight — not demand — caps our addressable market, and it caps each product differently by $/ton. Trucking from S. Louisiana runs ~$3.49/loaded-mi at 200mi and ~$4.23 at 100mi (USDA 25-MT benchmark) ≈ $0.14–$0.17/ton-mi. That radius works far for a $700–$800/ton biochar but not for a $200/ton absorbent. Rail linehaul is ~$0.03–0.05/ton-mi but transload+dray add ~$25–40/ton fixed overhead, so rail only pays when the product has enough value/ton, committed volume, or a carbon layer. NET: rail is a real SAM unlock for AG BIOCHAR and especially POULTRY IN-FEED biochar, and only marginal for absorbent pellets. Pellet+crumble TAMs OVERLAP (don't sum). CDR is a revenue LAYER, not an additive physical market. Numbers are a defensible model, not fact.",
    som:[
      { m:"Absorbent pellets ($200/ton ref)", tam:"1.86M t / $373M (US fuller's-earth absorbent proxy: 2.3M t × 81%; broader US industrial-absorbent mkt $1.07B '25)", sam:"186k t / $37M [A] ~10% of TAM, Gulf-South truck catchment", som:"600 / 1,200 / 2,400 t → $120k / $240k / $480k", note:"Local truck / TL, ~300mi. Cost-per-gal absorbed ~$0.15 vs $2.88 cellulose / $7.31 clay — chemically great, but low ticket/ton keeps it regional. Rail = marginal." },
      { m:"Absorbent crumble", tam:"1.86M t / $373M — OVERLAPS pellets, do NOT sum (two forms, one demand pool)", sam:"112k t / $22M [A] ~6% of TAM", som:"300 / 750 / 1,500 t → $60k / $150k / $300k", note:"Local truck / TL, ~150–200mi. Cubes out before weight; used on large-area/low-value cleanup → more freight-sensitive. Rail not material." },
      { m:"Agricultural biochar ($700/ton [A])", tam:"25k–51k t / $18M–$36M (current US ag-biochar mkt: US biochar ~$99M '26 × 72.7% ag; USBI 35k–70k t production)", sam:"~15k t / ~$10.5M [A] TL to Gulf/TX/SE + selective rail (Dallas/Memphis/Atlanta/FL)", som:"500 / 1,500 / 3,000 t → $350k / $1.05M / $2.1M", note:"TL to ~500mi; rail = MATERIAL unlock. Low density (80–320 kg/m³) → TL discipline, 1-MT bags. + CDR layer if eligible." },
      { m:"Biochar-infused soil / blends ($350/ton [A])", tam:"tons NQ / $1.5B parent (US lawn-&-garden growing media, Freedonia '26)", sam:"NQ / ~$75M [A] 5% of parent, Zone A + inner B", som:"250 / 750 / 1,500 t → $88k / $263k / $525k", note:"Local truck, ~150–200mi. Shipping finished soil far = paying freight on moisture/filler. Smarter: ship concentrate, blend locally." },
      { m:"Poultry IN-FEED biochar ($800/ton [A]) — biggest economic prize", tam:"383k–765k t / $306M–$612M (US broiler 57M t + layer 15M t feed × 0.5–1.0% inclusion [A])", sam:"210k–420k t / $168M–$336M post-approval [A] ~55% reachable via TL + rail", som:"1,000 / 2,500 / 5,000 t → $0.8M / $2.0M / $4.0M", note:"⚠ REGULATORY-GATED: new feed ingredients gated by AAFCO/FDA-CVM/GRAS; state GRAS acceptance patchy. Economically huge, commercially gated. Concentrated buyers (integrators, feed mills, premix). Rail = STRONG unlock." },
      { m:"Cattle + swine in-feed (secondary)", tam:"344k–688k t / $275M–$550M (beef 76.7M t + hog 60.9M t feed × 0.25–0.5% [A])", sam:"Not separately sized — same regulatory gate as poultry", som:"Follows poultry pathway", note:"Real secondary in-feed TAM; same AAFCO/FDA-CVM gate. Size after poultry pathway clears." },
      { m:"CDR revenue LAYER (not additive physical)", tam:"US biochar CDR mkt $181.5M '24 (up from $33.9M '23, CDR.fyi)", sam:"Coextensive with eligible biochar tons sold", som:"Adds $238–$312 / eligible biochar ton (1.9 tCO2e/t [A] × $125–$164/tCO2e)", note:"AMPLIFIES rail economics most: $238/t carbon ≈ offsets ~1,200 truck-mi @ $0.20/ton-mi. Verify absorbent end-use CDR eligibility vs Puro methodology." },
    ],
    modeVerdict:[
      { p:"Absorbent pellets", truck:"~300 mi", rail:"Marginal unlock", why:"TL manageable to ~300mi, but rail transload overhead is too big a share of a $200/ton product unless volumes are very large." },
      { p:"Absorbent crumble", truck:"~150–200 mi", rail:"Not material", why:"Cubes out before weight; lower-value bulk cleanup motions want nearby stock." },
      { p:"Agricultural biochar", truck:"~500 mi (TL)", rail:"Material unlock", why:"Higher $/ton supports TL farther; rail opens Dallas/Memphis/Atlanta/FL + national distributor lanes." },
      { p:"Biochar-infused soil / blends", truck:"~150–200 mi", rail:"Usually no", why:"Finished blends too local & bulky; ship concentrate and blend locally." },
      { p:"Poultry in-feed biochar", truck:"~500 mi (TL)", rail:"Strong unlock", why:"Concentrated buyers, higher value/ton, bulk/silo compatibility, carbon-revenue support — rail compelling post-approval." },
      { p:"CDR layer", truck:"n/a", rail:"Amplifies rail economics", why:"Adds ~$238–$312 per eligible biochar ton at base-case issuance/pricing." },
    ],
    transport:[
      "Truck (USDA S. Central, 25-MT benchmark): $5.68/mi @25mi · $4.23 @100mi · $3.49 @200mi → ≈$0.17/ton-mi @100mi, $0.14 @200mi (higher if low-density product cubes out first).",
      "Rail linehaul ~$0.03–0.05/ton-mi (≈half of truck), BUT transload + dray add ~$25–40/ton [A] fixed overhead → rail only beats truck ~250–400mi, and only when the receiver is rail-served.",
      "White Castle sits on the UNION PACIFIC network. Nearest public transload = USA Rail Baton Rouge / Port Allen (UP-served, dry+liquid bulk, unit-train + manifest). ~25–35 road-mi origin dray [A] ≈ $5.68/ton at 25mi — dray is not the killer; the fixed transload touches are.",
      "Direct on-site rail spur at the Cora Texas Sugar Mill is UNVERIFIED in public sources — must confirm before assuming direct rail loading.",
      "Capacity reality: ~400 MT/mo ≈ only 4.5–5 railcars/mo (85–90 MT/car). A unit train (50–100 cars) = 4,250–9,000 MT — unrealistic now. The real rail play is repeat CARLOAD lanes into a few distributor/integrator nodes, not unit trains.",
      "Destination transload exists (Commtrex/TRANSFLO): Dallas, Memphis, Atlanta, Jacksonville. Physical network is not the bottleneck — product value & order size are.",
      "Handling: 1-MT FIBC super sacks ~$5.70–$26.95 each (~$6–27/ton) — fine for biochar/feed, painful vs a $200/ton absorbent. Pneumatic dry-bulk (no bag cost) suits in-feed/silo-fed systems, not spill-response pellets.",
    ],
    priceRefs:[
      { p:"Absorbent pellets / crumble", price:"$200/ton (company ref)", note:"Ex-plant bulk benchmark; USGS fuller's-earth ex-works ~$95/t; retail clay/cellulose far higher per gal." },
      { p:"Agricultural biochar", price:"$700/ton [A]", note:"Conservative — wholesale $600–$2,778/t, modal ~$1,600; CA avg $600–$1,300 (20–40% bulk discounts)." },
      { p:"Biochar-infused soil / blends", price:"$350/ton [A]", note:"Blended-product working price." },
      { p:"Poultry in-feed biochar", price:"$800/ton [A]", note:"Feed-grade working price; concentrated integrator/mill/premix buyers." },
      { p:"CDR credit", price:"$125–$164/tCO2e", note:"Nasdaq/Puro ~$125–145; independent avg ~$164 (2025). Yield 1.5–2.5 tCO2e/t biochar, 1.9 base [A]." },
    ],
    accountCriteria:[
      { f:"Geography", v:"LA / Gulf South / SE first; pellets ~≤300 mi, ag biochar ~500 mi via TL, in-feed potentially national via TL + selective rail" },
      { f:"Freight logic", v:"Zone A ≤150mi (LTL ok), B 150–300mi (TL), C 300–500mi (TL + higher-value biochar/feed only), D 500mi+ (rail / bulk / carbon-subsidized only)" },
      { f:"Rail logic", v:"White Castle on UP; transload via Port Allen (~25–35mi dray). Play = repeat CARLOAD lanes (85–90 MT/car), NOT unit trains, into ag-biochar & in-feed nodes. On-site spur unverified." },
      { f:"Min account size", v:"Free sample first; then a path to TL-scale recurring volume (or rail carload for far zones) — LTL only inside Zone A" },
      { f:"Product fit", v:"Handles bulk/bagged/silo; real absorbency / water-holding / feed / organic use case" },
      { f:"Strategic value", v:"Reseller reach, reference logo, in-feed integrator channel, or offtake potential (higher-value/ton products earn wider freight radius)" },
    ],
    assumptions:[
      "Prices [A]: pellets/crumble $200/t (ref), ag biochar $700/t, blends $350/t, feed-grade $800/t — intentionally conservative vs current specialty listings.",
      "Truck payloads [A]: pellets ~22t, crumble ~15t, ag biochar ~16t, heavy blends ~22t, in-feed ~18t (informed by USDA 25-MT truck + 80–320 kg/m³ biochar density; field-verify).",
      "Rail overhead $25–40/ton [A] (origin dray + transload + destination handling) is the SINGLE LARGEST logistics variable — replace with live lane quotes.",
      "Poultry in-feed 0.5–1.0% inclusion is the commercial base case (literature positive in that band; mixed/worse at higher doses); 3% is an experimental ceiling, not the plan.",
    ],
    gaps:[
      "No public proof of an active rail spur AT the Cora Texas mill — treat direct rail loading as unverified.",
      "No free public source cleanly isolates the US plant-based loose-granular absorbent subsegment (vs clay/synthetic pads/booms).",
      "No public free tonnage source for biochar-infused soil blends as a distinct US category (dollar parent only).",
      "AAFCO Official Publication not fully open in free text → whether a claim-ready generic biochar FEED ingredient definition exists is a MUST-VERIFY compliance item.",
    ],
    verifyFirst:[
      "Live TL freight quotes by lane & equipment type",
      "Origin/destination transload + dray quotes (the biggest variable)",
      "Actual product bulk density + truck-payload tests (bag/trailer/moisture/stackability)",
      "Regulatory counsel on the poultry-feed ingredient pathway (AAFCO/FDA-CVM/GRAS)",
      "Commercial validation: 2–3 SE feed mills / premix houses + 2 Gulf industrial-absorbent distributors",
    ],
    sourcing:[
      "Google Maps: 'soil supplier', 'landscape supply', 'compost', 'topsoil' + LA/Gulf cities",
      "NAICS: 424910 (Farm Supplies Merchant Wholesalers), 424690, 325314, 562219, 213112 (oilfield), 562212 (landfill), 311119 (feed mfg)",
      "Poultry in-feed: USPOULTRY top broiler/egg producer lists, WATT/Egg Industry company listings, AFIA (~5,650 US feed facilities), premix majors (Cargill, DSM-Firmenich, ADM, Purina Animal Nutrition, BASF)",
      "LinkedIn Sales Nav: title=Purchasing/Category/Ops/Nutritionist + industry=Farming/Environmental Services/Animal Feed + geo=Gulf South & SE",
      "Trade assocs: American Sugar Cane League, LA Nursery & Landscape Assoc, US Biochar Initiative, regional ag co-op directories",
      "Oilfield/enviro: ISN/Avetta supplier lists, spill-response contractor directories, state DEQ contractor lists",
      "Rail/transload: Commtrex (Dallas/Memphis/Atlanta/Jacksonville), TRANSFLO, USA Rail Port Allen; Enrichment: Apollo.io (connected) + Clay waterfall",
    ],
  },

  /* ============ 7. PIPELINE ============ */
  objectModel:[
    { o:"Account", key:"Company, segment, freight zone, status" },
    { o:"Contact", key:"Persona, title, role (econ/tech/user)" },
    { o:"Deal / Opportunity", key:"Deal type, stage, value, margin, carbon fields" },
    { o:"Sample Request", key:"Product, size, qual gate, ship date, follow-up" },
    { o:"LOI (Letter of Intent)", key:"Committed Q4 volume, locked price band, territory, status" },
    { o:"Order (Q4+)", key:"SKU, tons, packaging, delivery, invoice — post-capacity" },
    { o:"Fulfillment Handoff", key:"Logistics, application guidance, MRV docs" },
    { o:"Carbon / MRV Record", key:"tCO2e est, MRV status, issuance, buyer" },
    { o:"Activity / Task", key:"Type, owner, due, outcome" },
    { o:"Collateral Sent", key:"Asset, date, engagement" },
    { o:"Objection", key:"Type, response used, resolved?" },
    { o:"Distributor Agreement", key:"Margin, terms, exclusivity, volume commit" },
    { o:"Offtake Agreement", key:"Annual volume, price, term, MRV" },
  ],
  dealTypes:["Free sample / trial","LOI — reserve Q4 supply","Distributor LOI (territory + volume)","Q4 offtake / supply agreement (post-capacity)","Carbon credit / CDR transaction (days 61–90)"],
  pipelines:{
    midmarket:[
      { s:"Prospect", def:"Fits ICP + freight zone, not yet contacted", prob:5, fields:["segment","freight zone","est. volume"], exit:"Verified fit + contact found", next:"First touch", risk:"Outside zone w/ low volume", auto:"Assign owner + sequence", noAdv:"Don't advance without a real named contact" },
      { s:"Contacted / Engaged", def:"Two-way conversation started", prob:15, fields:["persona","pain","current alt"], exit:"Discovery booked or interest confirmed", next:"Book discovery", risk:"Single-threaded", auto:"Log activity", noAdv:"No advance without a reply/conversation" },
      { s:"Discovery / Qualified", def:"Use case, volume, freight, decision path confirmed", prob:30, fields:["decision maker","timeline","est. tons","competitor"], exit:"Meets qual bar + sample agreed", next:"Ship sample", risk:"No urgency/trigger", auto:"Create sample request", noAdv:"No advance without qualified use case + buyer" },
      { s:"Sample / Trial", def:"Sample shipped, trial running", prob:45, fields:["SKU","sample success criteria","trial start"], exit:"Trial success confirmed by buyer", next:"Trial check-in", risk:"No defined success metric", auto:"Schedule follow-up", noAdv:"No advance without agreed success criteria" },
      { s:"LOI Presented", def:"Short LOI delivered — committed Q4 volume, locked price band, territory", prob:60, fields:["committed volume","locked price band","territory","terms"], exit:"Buyer reviewing / verbal intent", next:"LOI review call", risk:"No close plan", auto:"Set follow-up reminder", noAdv:"No LOI without a positive sample result" },
      { s:"LOI Negotiation", def:"Volume, price band, territory being finalized", prob:80, fields:["volume","price band","sign date"], exit:"LOI signed", next:"Confirm signature", risk:"Decision-maker stall", auto:"Close plan tasks", noAdv:"No commit without decision maker aligned" },
      { s:"LOI Signed → Q4 Supply", def:"LOI executed; committed volume booked for the Q4 ramp", prob:100, fields:["committed volume","price band","Q4 delivery window"], exit:"Committed volume logged for the raise", next:"Nurture to Q4 offtake", risk:"Capacity mismatch", auto:"Add to committed-volume book", noAdv:"Log committed volume as the funding metric" },
    ],
    offtake:[
      { s:"Target Identified", def:"Strategic large account mapped", prob:5, fields:["annual volume potential","strategic value"], exit:"Exec contact identified", next:"Warm intro path", risk:"Wrong entry point", auto:"Account plan", noAdv:"—" },
      { s:"Exec Engaged", def:"Senior stakeholder in dialogue", prob:15, fields:["stakeholders","initiative driver"], exit:"Discovery workshop set", next:"Discovery workshop", risk:"Single-threaded", auto:"Multi-thread tasks", noAdv:"Map ≥2 stakeholders" },
      { s:"Scoping / Pilot", def:"Pilot volume + success terms defined", prob:35, fields:["pilot volume","success terms","MRV scope"], exit:"Pilot agreed", next:"Run pilot", risk:"No success definition", auto:"Pilot tracker", noAdv:"No pilot without written success criteria" },
      { s:"Pilot Running", def:"Trial volume deployed & measured", prob:50, fields:["pilot results","carbon eligibility"], exit:"Pilot success", next:"Results review", risk:"Data gaps", auto:"MRV capture", noAdv:"—" },
      { s:"Contract / Term Sheet", def:"Annual supply / offtake terms drafted", prob:70, fields:["annual volume","price","term","CDR terms"], exit:"Term sheet agreed", next:"Legal review", risk:"Capacity mismatch", auto:"Legal + capacity check", noAdv:"Confirm production capacity" },
      { s:"Signed Offtake", def:"Executed annual supply / offtake", prob:100, fields:["contract","MRV plan","delivery schedule"], exit:"Deliveries scheduled", next:"Delivery + MRV ops", risk:"—", auto:"Recurring fulfillment + MRV", noAdv:"—" },
    ],
    carbon:[
      { s:"Deployment Supply Mapped", def:"Deployed/committed tons = credit supply quantified", prob:10, fields:["deployed tons","est tCO2e","MRV status"], exit:"Supply forecast built", next:"Package supply", risk:"MRV incomplete", auto:"Link to won deals", noAdv:"Only count deployed/committed tons" },
      { s:"Buyer / Broker Engaged", def:"CDR buyer or broker in dialogue", prob:25, fields:["buyer","required standard","volume"], exit:"Requirements confirmed", next:"Share MRV package", risk:"Standard mismatch", auto:"Match to registry", noAdv:"Confirm buyer's durability/standard" },
      { s:"Diligence / MRV Review", def:"Buyer validating permanence & MRV", prob:50, fields:["MRV docs","permanence data"], exit:"Diligence passed", next:"Term sheet", risk:"Data gaps", auto:"MRV checklist", noAdv:"No advance with open MRV items" },
      { s:"Forward Purchase / Term Sheet", def:"Price & volume tied to deployment pipeline", prob:70, fields:["price/tCO2e","volume","delivery schedule"], exit:"Terms agreed", next:"Contract", risk:"Over-commit vs supply", auto:"Supply reconciliation", noAdv:"Never sell more credits than deployable tons" },
      { s:"Credits Contracted", def:"Executed CDR purchase / offtake", prob:100, fields:["contract","issuance schedule"], exit:"Issuance tracked", next:"Issue + deliver", risk:"—", auto:"Issuance tracking", noAdv:"—" },
    ],
  },
  crmFields:{
    sales:["account name","segment","buyer persona","location","distance/freight zone","contact info","product interest","expected order format","estimated volume","timeline","decision maker","buying process","pain point","current alternative","competitor / status quo","next step","close date","deal value","gross margin estimate"],
    economics:["product type","wet tons","dry tons equivalent","bulk density","packaging type","est. product revenue","est. COGS","est. freight","delivered margin","carbon-credit eligibility","est. tCO2e generated","est. CDR revenue","CDR revenue confidence","MRV docs required","MRV status","credit issuance status","total deal value (product + carbon)","product margin only","blended margin (incl. carbon)","carbon credit buyer / channel","carbon revenue recognition timing"],
  },
  dashboards:["Founder dashboard","Sales manager dashboard","Account list","Pipeline kanban","Sample tracker","Quotes / proposals","Target account map/list","Carbon-credit generation","Fulfillment handoff queue","Distributor pipeline","Offtake pipeline","Activity leaderboard","30/60/90 roadmap tracker"],

  /* ============ 8. OUTREACH ============ */
  outreach:[
    { seg:"Soil Blenders", persona:"Ops Manager",
      steps:[
        { t:"Email 1 — Day 0", b:"Subject: bagasse biochar for your blends\n\nHi {First} — we make a 100% sugarcane bagasse biochar out of White Castle. It screens clean into soil blends and holds ~3x its weight in water, so it firms up moisture performance in sandy mixes. OMRI Listed, IBI Certified.\n\nWorth a free sample bag to run in your premium blend? I'll include the spec + a quick blend guide.\n\n— {Me}, VEJ" },
        { t:"Call opener", b:"Hey {First}, {Me} with VEJ down in White Castle — we turn sugarcane bagasse into biochar for soil blenders. Quick reason I called: folks running sandy or premium mixes use it to hold moisture and carry nutrients. What are you blending right now?" },
        { t:"Voicemail", b:"{First}, it's {Me} with VEJ, 555-xxx. We make bagasse biochar for soil blends — holds about 3x its weight in water, screens clean. I'll send a spec by email; if it fits I'll drop you a free sample. Talk soon." },
        { t:"LinkedIn note", b:"Hi {First} — we make Louisiana bagasse biochar for soil blenders (OMRI/IBI). Would love to send you a sample to trial in a blend. Open to it?" },
        { t:"Email 2 — Day 4 (value)", b:"Subject: the water-holding number\n\n{First} — quick proof: our bagasse biochar's honeycomb pore structure holds ~3–3.5x its weight in water (technical report attached), vs ~2x for typical wood biochar. That's the difference blenders feel in sandy mixes.\n\nWant a sample to test? Just need your best ship-to." },
        { t:"Email 3 — Day 9 (sample CTA)", b:"Subject: sample bag\n\n{First} — happy to ship a free qualified sample so you can run it in your own blend. If it performs, we scale to pallet then standing LTL. What blend would you test it in first?" },
        { t:"Breakup — Day 16", b:"Subject: close the loop\n\n{First} — I'll stop reaching out for now. If moisture performance or an organic/carbon-negative blend ever moves up your list, we're here and 300 miles away. I'll leave the spec attached." },
      ],
      nurture:"Monthly: seasonal blend tips, a customer proof point, or a new cert/data drop. No hard sell." },
    { seg:"Ag Distributors", persona:"Category Manager",
      steps:[
        { t:"Email 1 — Day 0", b:"Subject: carbon-negative organic SKU for your line\n\nHi {First} — VEJ makes a Louisiana bagasse biochar (OMRI Listed, IBI Certified, USDA-ARS field study behind it). Distributors use it as a differentiated organic/regenerative SKU with a water + carbon story growers are asking for.\n\nCan I send the distributor margin model + grower ROI calc?" },
        { t:"Call opener", b:"Hi {First}, {Me} with VEJ. We supply a carbon-negative bagasse biochar and I'm talking to distributors building out organic/regenerative lines. Are your growers asking about water efficiency or carbon yet?" },
        { t:"Voicemail", b:"{First}, {Me} with VEJ, 555-xxx. Louisiana biochar, OMRI/IBI certified, with a distributor program and grower ROI model. Sending details by email — would value 15 minutes." },
        { t:"LinkedIn note", b:"Hi {First} — building a distributor program for our Louisiana bagasse biochar (OMRI/IBI, carbon-negative). Think it could differentiate your organic line. Open to a quick look at the margin model?" },
        { t:"Email 2 — Day 4", b:"Subject: the demand + margin question\n\n{First} — two things distributors ask: will it pull through, and what's the margin. On pull-through: it's OMRI-listed with a USDA-ARS field study and a grower water/fertilizer-efficiency story. On margin: attached model shows a stocking pilot at [placeholder] with volume rebates. Worth a call?" },
        { t:"Email 3 — Day 9", b:"Subject: co-branded grower trial\n\n{First} — best way to de-risk: a stocking pilot plus a co-branded grower trial so your reps have a local proof point. I'll supply samples + trial docs. Which branches would you start with?" },
        { t:"Breakup — Day 16", b:"Subject: parking this\n\n{First} — I'll pause here. When an organic/carbon SKU moves up the priority list, the margin model and trial program are ready to go." },
      ],
      nurture:"Monthly: grower proof points, program economics, regional trial results, cost-share/grant angles." },
    { seg:"Remediation / Oilfield", persona:"Procurement Manager",
      steps:[
        { t:"Email 1 — Day 0", b:"Subject: 5:1 absorbent, fewer bags per job\n\nHi {First} — VEJ makes a plant-based bagasse absorbent that soaks up ~5:1 vs ~2.5:1 for wood pellets. Fewer bags per spill, lower disposal volume, carbon-neutral. SDS available.\n\nWant a head-to-head absorbency demo or a trial pallet on your next job?" },
        { t:"Call opener", b:"Hi {First}, {Me} with VEJ. We make a bagasse absorbent that outperforms wood 2-to-1 on soak-up. Reason I called — crews use fewer bags per spill and pay less on disposal. What absorbent are you running now?" },
        { t:"Voicemail", b:"{First}, {Me} with VEJ, 555-xxx. Plant-based absorbent, 5:1 soak vs 2.5:1 for wood, SDS ready. I'll email the spec — happy to do a demo or trial pallet on your next job." },
        { t:"LinkedIn note", b:"Hi {First} — we make a 5:1 bagasse absorbent (vs 2.5:1 wood) for spill/fluid remediation. Can I send the SDS + set up a quick demo?" },
        { t:"Email 2 — Day 3", b:"Subject: cost per gallon captured\n\n{First} — the number that matters: at ~5:1, you capture the same spill with far fewer bags than wood or clay, so cost-per-gallon and disposal volume both drop. Attached: SDS + a cost-per-gallon comparison. Want a trial pallet staged for the next job?" },
        { t:"Email 3 — Day 8", b:"Subject: trial pallet\n\n{First} — easiest path: we stage a trial pallet, your crew runs it head-to-head on the next spill, and you see the bag count difference live. What site should we ship to?" },
        { t:"Breakup — Day 15", b:"Subject: last note\n\n{First} — I'll stop here. When absorbent cost, disposal volume, or ESG reporting comes up, we're ready with SDS, specs, and a trial pallet." },
      ],
      nurture:"Monthly: disposal-cost angles, ESG/HSE reporting value, disaster-season readiness." },
    { seg:"Landfill / Public Works", persona:"Ops / EHS Director",
      steps:[
        { t:"Email 1 — Day 0", b:"Subject: leachate & spill absorbent — pilot for next cycle\n\nHi {First} — VEJ makes a plant-based bagasse absorbent (5:1) for leachate control and spill response, with SDS and certifications. Several ops teams pilot it to cut moisture-handling cost and strengthen sustainability reporting.\n\nCan I scope a pilot aligned to your budget cycle?" },
        { t:"Call opener", b:"Hi {First}, {Me} with VEJ. We supply a plant-based absorbent for leachate and spill control with full SDS. I'm reaching out to scope pilots for the next budget cycle — where does moisture or leachate cost you most right now?" },
        { t:"Voicemail", b:"{First}, {Me} with VEJ, 555-xxx. Plant-based absorbent for leachate/spill, SDS ready, pilot-friendly. Emailing details — would like to understand your procurement timeline." },
        { t:"LinkedIn note", b:"Hi {First} — plant-based absorbent for leachate/spill control (SDS, certs). Would like to scope a pilot for your next budget cycle. Open to a short call?" },
        { t:"Email 2 — Day 5", b:"Subject: what a pilot would show\n\n{First} — a clean pilot would measure absorbent volume used, moisture handled, and disposal impact vs your current material. I'll bring SDS, certs, and a simple success scorecard. What's your RFP/budget timeline?" },
        { t:"Email 3 — Day 11", b:"Subject: RFP-ready kit\n\n{First} — if it's easier to route through procurement, I can send an RFP-ready kit (specs, SDS, certs, references). Who should receive it?" },
        { t:"Breakup — Day 18", b:"Subject: parking this\n\n{First} — I'll pause. When the budget window opens or leachate cost climbs, the pilot kit is ready." },
      ],
      nurture:"Quarterly: compliance updates, sustainability-reporting value, references." },
    { seg:"Animal Bedding", persona:"Buyer / Barn Manager",
      steps:[
        { t:"Email 1 — Day 0", b:"Subject: drier litter, fewer bags\n\nHi {First} — VEJ makes a bagasse-based absorbent used for animal bedding. It soaks up several times its weight in moisture, which helps keep litter drier. Plant-based and renewable.\n\n(Bedding performance only — we don't make feed or health claims.) Want a house trial?" },
        { t:"Call opener", b:"Hi {First}, {Me} with VEJ. We make a bagasse absorbent used as bedding — helps hold litter moisture. Where are you seeing wet-litter issues right now?" },
        { t:"Voicemail", b:"{First}, {Me} with VEJ, 555-xxx. Bagasse-based bedding absorbent, holds moisture well, plant-based. I'll email details — open to a house trial." },
        { t:"LinkedIn note", b:"Hi {First} — bagasse-based bedding absorbent that holds litter moisture well. Can I send specs and set up a house trial?" },
        { t:"Email 2 — Day 5", b:"Subject: house trial\n\n{First} — simplest proof is a trial in one house: compare litter moisture and bag usage vs your current bedding. I'll ship a trial quantity. Which operation would you test first?" },
        { t:"Breakup — Day 12", b:"Subject: last note\n\n{First} — I'll stop here. If wet litter or bedding cost comes up, we're ready with specs and a trial." },
      ],
      nurture:"Seasonal: moisture-season readiness, bedding-cost angles. NEVER unapproved feed/health claims." },
    { seg:"CDR / ESG Buyers", persona:"Sustainability / Carbon Buyer",
      steps:[
        { t:"Email 1 — Day 0", b:"Subject: Puro-certified biochar removal, deployment-backed\n\nHi {First} — VEJ produces durable carbon removal via bagasse biochar (H/C < 0.7), Puro.earth certified, generated by real deployed tons in Louisiana ag/industrial use — with deployment-level MRV records.\n\nWould you be open to discussing a forward purchase tied to our deployment pipeline?" },
        { t:"Call opener", b:"Hi {First}, {Me} with VEJ. We generate Puro-certified biochar carbon removal from deployed sugarcane bagasse biochar. What's your durability threshold and standard for removals this year?" },
        { t:"Voicemail", b:"{First}, {Me} with VEJ, 555-xxx. Durable, Puro-certified biochar removal backed by real deployment and MRV. Sending details — would value a conversation on a forward purchase." },
        { t:"LinkedIn note", b:"Hi {First} — durable Puro-certified biochar removal, deployment + MRV backed. Open to discussing a forward purchase tied to our pipeline?" },
        { t:"Email 2 — Day 5", b:"Subject: why deployment-backed matters\n\n{First} — the differentiator: our credits come from physical tons actually deployed and documented, not paper offsets. That gives you defensible additionality + durability. I can share our MRV approach and deployment forecast. Useful?" },
        { t:"Email 3 — Day 12", b:"Subject: term sheet outline\n\n{First} — if there's fit, I'll send a forward-purchase outline sized to our conservative deployment pipeline (we never sell more credits than deployable tons). What volume and delivery window fits your program?" },
        { t:"Breakup — Day 20", b:"Subject: parking this\n\n{First} — I'll pause. When your removal budget cycle opens, our deployment-backed supply and MRV package are ready." },
      ],
      nurture:"Quarterly: deployment volume updates, MRV/registry progress, durability data." },
  ],

  /* ============ 9. COLLATERAL ============ */
  deck:[
    { s:"Title", p:"Frame identity fast", b:["VEJ — carbon-negative biochar & absorbents from Louisiana sugarcane bagasse","Co-located at Cora Texas Sugar Mill, White Castle, LA"], cta:"—" },
    { s:"The waste-to-value story", p:"Origin + credibility", b:["Sugarcane bagasse: renewable ag byproduct, no trees cut","Oxygen-limited pyrolysis >500°C → stable biochar"], cta:"—" },
    { s:"Why bagasse beats wood", p:"Core differentiation", b:["Ordered honeycomb pore structure","~3–3.5x water-holding vs ~2x wood","Inherent NPK + Ca/Mg; 5:1 absorbency vs 2.5:1"], cta:"—" },
    { s:"Product family", p:"Show the range", b:["Bulk/bagged biochar","Biochar-infused soil","Absorbent pellets & crumble","Carbon removal credits"], cta:"—" },
    { s:"Proof & certifications", p:"De-risk", b:["OMRI Listed · IBI Certified · Puro.earth certified","USDA-ARS multi-year field study","Heavy metals << IBI/EPA thresholds"], cta:"—" },
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
    sizes:["Absorbent Pellets — 1 lb sample (free, S&H incl.)","100% Biochar — 8 oz sample (free, S&H incl.)","(Q4+) pallet/bulk once capacity is online"],
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
    { o:"Wood biochar is cheaper", mean:"Price-anchored", resp:"Performance-per-dollar: ordered honeycomb pores → higher water-holding + inherent nutrients; ask them to trial side-by-side.", proof:"ProGreaux comparison / SEM", next:"Want a head-to-head sample?", disq:"—" },
    { o:"I don't understand carbon credits", mean:"Confused / skeptical", resp:"Keep it simple: buy the product for performance; we handle carbon; it may improve your price. No action needed from them.", proof:"Dual-value one-pager", next:"Want the plain-English version?", disq:"—" },
    { o:"Freight kills the economics", mean:"Delivered cost fear", resp:"Freight-zone pricing; concentrate volume; carbon value + product margin defend delivered cost inside zone.", proof:"Freight-aware calc", next:"What volume/frequency could you commit?", disq:"Zone C + tiny volume" },
    { o:"We need proof it works", mean:"Risk-averse", resp:"That's exactly what the trial is for — define success up front, ship a sample, measure.", proof:"Field study + sample", next:"What would prove it to you?", disq:"Won't define success" },
    { o:"We need organic certification", mean:"Compliance gate", resp:"OMRI Listed today; USDA Organic pending (don't overclaim). Provide OMRI + IBI docs.", proof:"Cert docs", next:"Is OMRI sufficient for your program?", disq:"—" },
    { o:"We need specs / SDS", mean:"Procurement gate", resp:"Send spec sheet + SDS immediately; it's a buying signal.", proof:"Spec sheet + SDS", next:"Who else needs to see these?", disq:"—" },
    { o:"We need a trial first", mean:"Ready-ish", resp:"Great — qualify, set success criteria, ship. Trial is the path forward.", proof:"Sample workflow", next:"What use case + success metric?", disq:"—" },
    { o:"We need net terms", mean:"Cash-flow", resp:"Net-15 pilot → Net-30 established (placeholder policy). Tie to volume/reorder.", proof:"Terms sheet", next:"What terms does procurement require?", disq:"—" },
    { o:"We already have absorbents", mean:"Incumbent", resp:"Not rip-and-replace — trial pallet on one job, measure bag count + disposal vs incumbent.", proof:"Cost-per-gallon calc", next:"Trial on the next spill?", disq:"—" },
    { o:"Need regulatory approval (feed/animal)", mean:"Compliance risk", resp:"Agree — we sell bedding/absorbency only; feed/health claims require AFIA/AAFCO/GRAS review. Stay in-bounds.", proof:"Bedding spec (no feed claims)", next:"Bedding-only trial works?", disq:"Insists on unapproved claims" },
    { o:"New supplier is risky", mean:"Reliability fear", resp:"Start small (sample→pallet), show consistency via lab batch data, scale on proof.", proof:"Batch lab consistency", next:"Start with a low-risk pallet?", disq:"—" },
  ],

  /* ============ 10. PRICING ============ */
  pricing:{
    note:"MONTH 1 = NO BULK SELLING. We do not quote or sell bulk yet (capacity scales in Q4). This pricing architecture is internal Q4 REFERENCE — its purpose is to set the locked price band an LOI reserves for the fall. Costs are placeholders: fill floors/COGS/freight before any Q4 quote. Never present these as live prices now.",
    logic:[
      { f:"Floor price", v:"COGS + freight + min margin % (never below); set per SKU" },
      { f:"Target margin", v:"Product gross margin target [e.g. 35–50%]; blended (incl. carbon) higher" },
      { f:"Freight", v:"Zone A/B/C; FOB White Castle vs delivered; TL amortizes best" },
      { f:"MOQ", v:"Sample → pallet → LTL → TL; distributor MOQ higher w/ rebate" },
      { f:"Distributor margin", v:"25–35% target; volume rebate tiers; no yr-1 exclusivity" },
      { f:"Terms", v:"Net-15 pilot → Net-30 established; deposit on offtake" },
      { f:"Carbon upside", v:"CDR revenue can subsidize product price to win share — model separately, don't commit unverified $" },
    ],
    tiers:[
      { p:"Bulk biochar", unit:"/ ton (FOB)", note:"Best for TL + offtake; lowest handling" },
      { p:"1MT bulk bag", unit:"/ bag", note:"Distributor / large grower" },
      { p:"20/40 lb retail", unit:"/ bag", note:"Landscape/nursery/retail; highest $/lb" },
      { p:"Biochar-infused soil", unit:"/ yd³ or / bag", note:"Value-added blend margin" },
      { p:"Absorbent pellets", unit:"/ lb or / pallet", note:"Industrial recurring" },
      { p:"Absorbent crumble", unit:"/ lb or / pallet", note:"Large-area coverage" },
    ],
    dealEval:["product revenue","product gross margin","freight","expected CDR revenue (EST)","MRV cost","blended gross margin","strategic value","expansion value"],
    sampleDeal:[
      { line:"Product revenue", v:"$X  (tons × price/ton)" },
      { line:"− COGS", v:"$X  (placeholder)" },
      { line:"− Freight (zone)", v:"$X  (placeholder)" },
      { line:"= Product gross margin", v:"$X  →  committed number" },
      { line:"+ Est. CDR revenue", v:"$X  (tons × tCO2e/ton × $/tCO2e) — ESTIMATE" },
      { line:"− MRV cost", v:"$X  (placeholder)" },
      { line:"= Blended gross margin", v:"$X  →  upside view, not committed" },
    ],
  },

  /* ============ 11. PLAYBOOK ============ */
  playbook:{
    principles:["Sample first, sign LOIs — no bulk selling until Q4 capacity is online","The LOI (committed Q4 volume) is the Month-1 win, not a PO — it's what funds the buildout","Never advance a stage without its exit criteria","Every trial has a written success metric before it ships","Claim discipline: match every claim to its proof tier","Multi-thread any account worth a meaningful LOI","Carbon is a days-61–90 layer, not the Month-1 pitch","Log it in the app or it didn't happen"],
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
    proofDemo:["Product education (bagasse → product story)","Spec + SDS review","Use-case match to their problem","Ship free sample","Run trial vs agreed success metric","Document before/after (claim-safe)","Present the LOI to lock Q4 supply"],
    proposal:{ need:["qualified use case","estimated Q4 volume","decision maker who can sign","sample success criteria met","Q4 price band set"], structure:["Recap of their problem","Recommended product","Sample result / proof","LOI terms: committed volume + locked Q4 price + territory","Signature step (non-binding until Q4)"], },
    close:["Written LOI-close plan w/ dates","Confirm the signer + what their bar is","Present the LOI; adjust volume/territory as needed","On signature: log committed volume to the funding book; nurture toward Q4 offtake"],
    handoff:["Order details + delivery schedule","Application / usage guidance","MRV data capture (application, GPS/site, weights)","Success check-in scheduled","Reorder date set"],
    expansion:["Reorder reminders on cycle","Usage check-ins","Volume expansion / new-SKU cross-sell","Case study request","Referral ask"],
  },

  /* ============ 12. KPIS ============ */
  kpis:{
    leading:["New accounts added","Contacts found","Emails sent","Calls made","LinkedIn touches","Conversations started","Discovery/technical calls booked","Samples requested","Samples shipped","Sample follow-ups done","LOIs presented","Site visits scheduled"],
    lagging:["LOIs signed","Committed future volume (Q4)","Distributor LOIs","Case-study-safe wins","(Q4+) Closed orders","(Q4+) Revenue","(Q4+) Reorder rate","(days 61–90) Carbon-eligible tons","(days 61–90) Est. CDR revenue"],
    conversion:["Account → meeting","Meeting → sample","Sample → LOI presented","LOI presented → signed","Segment → committed volume","Distributor LOI → territory reserved"],
    coverage:["Coverage by deal type (3–4x pipeline/target)","Monthly target model","Activity target model","Volume (tons) target model","Pipeline value w/ and w/o CDR"],
    cards:[
      { c:"Samples shipped (MTD)", def:"Free samples in buyers' hands this month", formula:"Σ samples where shipped", filter:"Segment, product", src:"Sample", warn:"< monthly target pace", owner:"Consultant" },
      { c:"LOIs signed + committed volume", def:"Signed LOIs and the Q4 volume they commit — the funding metric", formula:"Σ LOIs signed; Σ committed volume", filter:"Segment, product", src:"LOI", warn:"0 by day 25", owner:"Victor" },
      { c:"Sample → LOI rate", def:"Samples that convert to a signed LOI", formula:"LOIs signed / samples shipped", filter:"Segment", src:"Sample, LOI", warn:"< 10%", owner:"Consultant" },
      { c:"LOI presented → signed", def:"Presented LOIs that get signed", formula:"signed / presented", filter:"Segment", src:"LOI", warn:"< 40%", owner:"Victor" },
      { c:"Carbon-eligible tons", def:"Deployed tons w/ MRV path", formula:"Σ tons where eligible & MRV≠blocked", filter:"—", src:"Carbon record", warn:"MRV backlog", owner:"Carbon lead" },
      { c:"Activity index", def:"Weekly outbound volume", formula:"emails+calls+LI+visits", filter:"Owner, week", src:"Activity", warn:"< weekly target", owner:"Sales mgr" },
    ],
  },

  /* ============ 12b. DAILY ACTION PLAN (top-of-app focus) ============ */
  daily:{
    mission:"Get free performance samples of our two live products (Absorbent Pellets, 100% Biochar) into buyers' hands. That is the ONLY Month-1 win. No bulk, no LOI talk in cold outreach — samples first, LOIs follow a win.",
    target:"By end of Week 2: 15–25 free samples shipped, both tracks live, first LOIs presented on positive results.",
    sectors:[
      {k:"bizdev",   t:"Business Development", c:"#5b9bd5", d:"Lists, accounts, calls, LOI conversations"},
      {k:"outreach", t:"Outreach Engine",      c:"#d9a441", d:"Domains, sequences, cold email + call"},
      {k:"media",    t:"Media & PR Outreach",  c:"#57b894", d:"Social, PR, distributor & trade networks"},
      {k:"product",  t:"Product & Proof",      c:"#b07cd6", d:"Certs, testing, photos, SKUs, collateral"},
      {k:"ops",      t:"Ops & Systems",        c:"#8a93a0", d:"CRM, sample SOP, dashboards, fulfillment"},
    ],
    days:[
      { d:1, wk:"Week 1 · Build the machine", theme:"Approve & lock the foundation",
        focus:"Victor approves the site and hands over the proof pack — that unblocks everything downstream.",
        lanes:[
          {k:"product", items:[
            {t:"Review & approve website copy + both product tracks", o:"Victor", pri:"P0", del:"Written sign-off / redlines to Jesse"},
            {t:"Gather certs & spec sheets: SDS, OMRI, IBI, Puro (review carbon language)", o:"Victor", pri:"P0", del:"Cert/spec pack"}]},
          {k:"ops", items:[
            {t:"Stand up CRM objects / fields / stages in the app", o:"Jesse", pri:"P0", del:"Live pipeline of record"}]},
          {k:"bizdev", items:[
            {t:"Lock the beachhead: top-3 Gulf South segments to hit first", o:"Jesse", pri:"P0", del:"Written ICP focus"}]},
          {k:"outreach", items:[
            {t:"Confirm sending domains + inboxes; set SPF/DKIM/DMARC; start warm-up", o:"Jesse", pri:"P0", del:"Inboxes warming"}]},
          {k:"media", items:[
            {t:"Claim social handles; set up company LinkedIn/X; draft brand-voice one-liner", o:"Jesse", pri:"P1", del:"Profiles claimed"}]},
        ]},
      { d:2, wk:"Week 1 · Build the machine", theme:"Proof library + list foundation",
        focus:"Pull every piece of product proof and build the first 100 named accounts.",
        lanes:[
          {k:"product", items:[
            {t:"Company/product discovery — lab analyses, tech reports, prior-sales proof, feedstock story", o:"Victor", pri:"P0", del:"Proof library"},
            {t:"Product photography — close-ups, bagged samples, facility/process shots", o:"Victor", pri:"P1", del:"Photo set"}]},
          {k:"bizdev", items:[
            {t:"Build first 100-account target list across BOTH ICPs (Gulf South, freight-viable)", o:"Jesse", pri:"P0", del:"Named accounts"}]},
          {k:"ops", items:[
            {t:"Draft sample policy + success-criteria template + routing (Jesse+Victor+Daniel)", o:"Both", pri:"P0", del:"Sample SOP"}]},
          {k:"outreach", items:[
            {t:"Write track-A (absorbent) + track-B (biochar) cold email v1 — sample-only ask", o:"Jesse", pri:"P0", del:"2 sequences drafted"}]},
          {k:"media", items:[
            {t:"Draft 3 proof-led launch posts (no hype); connect with 10 industry contacts", o:"Jesse", pri:"P2", del:"Content queue"}]},
        ]},
      { d:3, wk:"Week 1 · Build the machine", theme:"SKUs, collateral & contacts",
        focus:"Make samples orderable and give outreach a sendable proof kit.",
        lanes:[
          {k:"product", items:[
            {t:"Create 2 sample SKUs in Shopify (Pellets 1 lb, Biochar 8 oz)", o:"Victor", pri:"P0", del:"Variant IDs to Jesse"},
            {t:"Sample/product testing — absorbency + water-holding, claim-safe", o:"Victor", pri:"P1", del:"Test result sheet"}]},
          {k:"bizdev", items:[
            {t:"Enrich list with verified contacts/emails (Apollo); ICP-tag + freight-zone", o:"Jesse", pri:"P0", del:"Contacts ready"}]},
          {k:"outreach", items:[
            {t:"Build sequence steps (email + call + LinkedIn touch); draft A/B subject lines", o:"Jesse", pri:"P1", del:"Cadence built"}]},
          {k:"ops", items:[
            {t:"Sample→LOI funnel statuses + sample tracker + dashboard fields", o:"Jesse", pri:"P0", del:"Tracker live"}]},
          {k:"media", items:[
            {t:"Publish 'open for samples' post; start engaging target accounts", o:"Jesse", pri:"P2", del:"Presence live"}]},
        ]},
      { d:4, wk:"Week 1 · Build the machine", theme:"Kits & wiring",
        focus:"Wire the sample form end-to-end and finish the single-product kits.",
        lanes:[
          {k:"product", items:[
            {t:"Wire Shopify variant IDs into site sample forms; test request e2e", o:"Victor", pri:"P0", del:"Forms route to Jesse+Victor+Daniel"}]},
          {k:"bizdev", items:[
            {t:"Build MVP collateral — absorbent 1-pager + biochar 1-pager + sample-kit insert", o:"Jesse", pri:"P0", del:"2 PDF kits"}]},
          {k:"outreach", items:[
            {t:"Load first 25 accounts into sequences; seed-inbox dry run", o:"Jesse", pri:"P1", del:"Deliverability check"}]},
          {k:"media", items:[
            {t:"Build media/PR list — trade outlets, associations, distributor networks", o:"Jesse", pri:"P1", del:"Media list v1"}]},
          {k:"ops", items:[
            {t:"Confirm fulfillment path + 48h ship SLA with Ops/Daniel", o:"Both", pri:"P0", del:"Fulfillment SOP"}]},
        ]},
      { d:5, wk:"Week 1 · Build the machine", theme:"Soft launch + week-1 gate",
        focus:"Fire the first 25 sequences and green-light Week 2.",
        lanes:[
          {k:"outreach", items:[
            {t:"Launch first soft outbound batch (25 accounts, both tracks)", o:"Jesse", pri:"P0", del:"25 sequences live"}]},
          {k:"product", items:[
            {t:"Stage approved site in Shopify (publish post-approval)", o:"Victor", pri:"P1", del:"Production site staged"}]},
          {k:"bizdev", items:[
            {t:"QA target list; prep next 75 accounts (100 total ready)", o:"Jesse", pri:"P1", del:"100 accounts ready"}]},
          {k:"media", items:[
            {t:"Send first 5 media/PR/distributor intro touches (samples angle)", o:"Jesse", pri:"P1", del:"Media outreach started"}]},
          {k:"ops", items:[
            {t:"Week-1 gate: bounce <2%, pipeline live, sample SOP tested", o:"Both", pri:"P0", del:"Green-light Week 2"}]},
        ]},
      { d:6, wk:"Week 2 · Launch at volume", theme:"Scale outbound (absorbent wedge)",
        focus:"Ramp the absorbent EHS/spill/oilfield track and ship the first samples.",
        lanes:[
          {k:"outreach", items:[
            {t:"Ramp to full daily send volume — absorbent track primary", o:"Jesse", pri:"P0", del:"Conversations opening"}]},
          {k:"bizdev", items:[
            {t:"Add 50 accounts; book first discovery/technical calls (Victor on technical)", o:"Jesse", pri:"P0", del:"Calls booked"}]},
          {k:"product", items:[
            {t:"Ship first free samples within 48h of qualification", o:"Victor+Ops", pri:"P0", del:"Product in buyers' hands"}]},
          {k:"media", items:[
            {t:"Follow-up media touches; pitch 1 trade outlet the samples story", o:"Jesse", pri:"P2", del:"1 pitch out"}]},
          {k:"ops", items:[
            {t:"Daily sales rhythm — log activity targets", o:"Jesse", pri:"P1", del:"Cadence running"}]},
        ]},
      { d:7, wk:"Week 2 · Launch at volume", theme:"Open the biochar distributor track",
        focus:"Launch distributor/blender outreach and open the first LOI conversations.",
        lanes:[
          {k:"outreach", items:[
            {t:"Launch biochar distributor/blender sequences", o:"Jesse", pri:"P0", del:"Distributor conversations"}]},
          {k:"bizdev", items:[
            {t:"Open 2–3 distributor LOI conversations (program preview — not cold)", o:"Jesse+Victor", pri:"P1", del:"Distributor pipeline"}]},
          {k:"product", items:[
            {t:"Ship next samples; log results into the tracker", o:"Victor", pri:"P0", del:"Sample data building"}]},
          {k:"media", items:[
            {t:"Engage distributor networks on LinkedIn; share a proof post", o:"Jesse", pri:"P2", del:"Distributor reach"}]},
          {k:"ops", items:[
            {t:"Dashboard: samples shipped, sample→LOI, reply rate by ICP", o:"Jesse", pri:"P1", del:"Metrics live"}]},
        ]},
      { d:8, wk:"Week 2 · Launch at volume", theme:"First calls & trials",
        focus:"Run discovery/technical calls and lock each trial's success criteria.",
        lanes:[
          {k:"bizdev", items:[
            {t:"Run discovery/technical calls; capture trial success criteria per account", o:"Jesse+Victor", pri:"P0", del:"Trials defined"}]},
          {k:"outreach", items:[
            {t:"Iterate copy from reply data; A/B round 2", o:"Jesse", pri:"P1", del:"Higher reply rate"}]},
          {k:"product", items:[
            {t:"Support trials; document sample success criteria (repeatable)", o:"Victor", pri:"P0", del:"Repeatable trials"}]},
          {k:"media", items:[
            {t:"Draft first case-study skeleton from earliest engaged account", o:"Jesse", pri:"P2", del:"Case study started"}]},
          {k:"ops", items:[
            {t:"Mid-week metrics check; cut dead segments", o:"Jesse", pri:"P1", del:"Tighter focus"}]},
        ]},
      { d:9, wk:"Week 2 · Launch at volume", theme:"Convert samples → LOI",
        focus:"Present the first LOIs on positive sample results — this is the funding proof.",
        lanes:[
          {k:"bizdev", items:[
            {t:"Present first LOIs on wins (Q4 supply, reserve pricing)", o:"Victor", pri:"P0", del:"LOIs presented"}]},
          {k:"ops", items:[
            {t:"Tally committed volume from signed LOIs", o:"Both", pri:"P0", del:"Committed-volume book"}]},
          {k:"outreach", items:[
            {t:"Keep top-of-funnel full — 50 more accounts sequenced", o:"Jesse", pri:"P0", del:"Sustained volume"}]},
          {k:"product", items:[
            {t:"Turn a win into a case-study draft (with permission)", o:"Victor", pri:"P1", del:"Case study v1"}]},
          {k:"media", items:[
            {t:"Publish first win/proof post (with permission)", o:"Jesse", pri:"P2", del:"Social proof"}]},
        ]},
      { d:10, wk:"Week 2 · Launch at volume", theme:"Two-week review & lock cadence",
        focus:"Score against the 15–25 sample target, keep what converts, lock the winning cadence.",
        lanes:[
          {k:"ops", items:[
            {t:"2-week scorecard: samples shipped, sample→LOI rate, LOIs signed, committed volume", o:"Both", pri:"P0", del:"Scorecard vs target"}]},
          {k:"bizdev", items:[
            {t:"Double down on the converting segment; prune the rest", o:"Jesse", pri:"P1", del:"Segment focus"}]},
          {k:"outreach", items:[
            {t:"Lock the winning sequence as the standard cadence", o:"Jesse", pri:"P1", del:"Playbook v1"}]},
          {k:"media", items:[
            {t:"Plan Week-3 media calendar; line up ProGreaux rebrand teaser (~Aug 17)", o:"Jesse", pri:"P2", del:"Media calendar"}]},
          {k:"product", items:[
            {t:"Advance largest LOIs toward binding Q4 offtake", o:"Victor", pri:"P1", del:"Offtake pipeline"}]},
        ]},
    ],
  },

  /* ============ 13. ROADMAP ============ */
  roadmap:[
    { phase:"First 7 days", note:"Two lanes running in parallel: Jesse builds the outbound machine; Victor gets the product, proof, and website launch-ready. Check items off as they land — they persist.", tasks:[
      { t:"✅ Temporary website build-out COMPLETE (localhost + combined-site)", o:"Jesse", pri:"P0", eff:"M", out:"Full site live for review", dep:"—", app:"website/", del:"Localhost site ready to hand to Victor", done:true },
      { t:"Review & approve website — copy, product pages, both tracks", o:"Victor", pri:"P0", eff:"M", out:"Sign-off to publish", dep:"Temp site", app:"website/", del:"Written approval / redlines back to Jesse" },
      { t:"Gather spec sheets + certifications: SDS, OMRI, IBI, Puro (+ review carbon language)", o:"Victor", pri:"P0", eff:"L", out:"Cert/spec pack for site + collateral", dep:"Company + labs", app:"Collateral", del:"SDS + OMRI + IBI + Puro docs" },
      { t:"Company & product discovery — pull every doc: lab analyses, tech reports, prior-sales proof, facility/feedstock story", o:"Victor", pri:"P0", eff:"L", out:"Complete proof library", dep:"Company", app:"Collateral", del:"Docs handed to Jesse for one-pagers" },
      { t:"Product photography — real product close-ups, bagged samples, facility/process shots", o:"Victor", pri:"P1", eff:"M", out:"Usable photo set for site + social", dep:"Facility access", app:"website/ assets", del:"Photo library" },
      { t:"Sample / product testing — absorbency + water-holding, document results (claim-safe)", o:"Victor", pri:"P1", eff:"M", out:"Own performance data", dep:"Product + lab", app:"Collateral", del:"Test result sheet" },
      { t:"Create 2 sample SKUs in Shopify (Pellets 1 lb, Biochar 8 oz)", o:"Victor", pri:"P0", eff:"S", out:"Sample orders fulfillable", dep:"Shopify admin", app:"Shopify", del:"SKUs live; variant IDs to Jesse" },
      { t:"Install approved website into Shopify (stage → publish over current site)", o:"Victor", pri:"P1", eff:"L", out:"New site live on Shopify", dep:"Approval + certs", app:"Shopify", del:"Production site (post-approval)" },
      { t:"Stand up CRM fields / stages / campaigns in the app", o:"Jesse", pri:"P0", eff:"M", out:"Working pipeline of record", dep:"App access", app:"All objects/fields", del:"Live pipeline" },
      { t:"Build first ~100-account target list across BOTH product ICPs (Gulf South)", o:"Jesse", pri:"P0", eff:"M", out:"Named accounts + verified contacts", dep:"Apollo", app:"Account/Contact", del:"Target list (shared w/ Victor)" },
      { t:"Build MVP collateral — SEPARATE per track: absorbent 1-pager, biochar 1-pager, sample-kit insert", o:"Jesse", pri:"P0", eff:"M", out:"Sendable single-product proof kits", dep:"Victor's docs + claim review", app:"Collateral", del:"Two PDF kits" },
      { t:"Sample policy + success-criteria template + routing (Jesse+Victor+Daniel)", o:"Both", pri:"P0", eff:"S", out:"Repeatable trials", dep:"Sample SKUs", app:"Sample Request", del:"Sample SOP" },
      { t:"Sending infra: domains, inboxes, SPF/DKIM/DMARC, warm-up start", o:"Jesse", pri:"P0", eff:"M", out:"Deliverable cold email", dep:"Domains", app:"—", del:"Warming inboxes" },
      { t:"Launch first soft outbound batch (25 accounts, both tracks)", o:"Jesse", pri:"P1", eff:"S", out:"First conversations", dep:"List + copy + warm-up", app:"Activity", del:"25 sequences live" },
    ]},
    { phase:"Days 8–30", tasks:[
      { t:"Run outbound: absorbent wedge (primary) + biochar distributors", o:"Jesse (consultant)", pri:"P0", eff:"L", out:"Discovery/technical calls booked", dep:"List", app:"Deal/Activity", del:"Pipeline built" },
      { t:"Ship 15–25 free samples (Pellets 1 lb / Biochar 8 oz)", o:"Victor + Ops", pri:"P0", eff:"M", out:"Product in buyers' hands", dep:"Sample SKUs live", app:"Sample Request", del:"Samples out" },
      { t:"Open 2–3 distributor LOI conversations", o:"Jesse + Victor", pri:"P1", eff:"M", out:"High-leverage LOIs opening", dep:"Program preview", app:"Distributor pipeline", del:"Distributor LOI pipeline" },
      { t:"Present first LOIs; sign first 5–10", o:"Victor", pri:"P0", eff:"M", out:"Committed Q4 volume (funding proof)", dep:"Positive sample results", app:"LOI", del:"≥5 signed LOIs" },
      { t:"Daily sales rhythm (activity targets)", o:"Jesse", pri:"P1", eff:"S", out:"Consistent volume", dep:"—", app:"Activity dash", del:"Cadence" },
    ]},
    { phase:"Days 31–60", tasks:[
      { t:"Scale sample→LOI; aggregate committed volume for the raise", o:"Jesse + Victor", pri:"P0", eff:"M", out:"Committed-volume book", dep:"Sample results", app:"LOI/Deal", del:"Signed LOIs tallied" },
      { t:"Ship the ProGreaux rebrand (~Aug 17) — site + collateral + signatures", o:"Victor + Jesse", pri:"P0", eff:"M", out:"Unified brand", dep:"Rebrand asset pack", app:"Collateral", del:"Rebrand live" },
      { t:"Build first case study from a win", o:"Jesse", pri:"P1", eff:"S", out:"Social proof", dep:"Customer OK", app:"Collateral", del:"Case study" },
      { t:"Refine calculators + dashboards from real LOIs", o:"Dev", pri:"P2", eff:"M", out:"Sharper economics", dep:"LOI data", app:"Calc/Dash", del:"v1 calcs" },
      { t:"Advance largest LOIs toward binding Q4 offtake", o:"Victor", pri:"P1", eff:"L", out:"Offtake pipeline", dep:"Q4 capacity data", app:"Offtake pipeline", del:"Offtake talks" },
    ]},
    { phase:"Days 61–90", tasks:[
      { t:"Scale what converts; cut what doesn't", o:"Founder", pri:"P0", eff:"M", out:"Focused motion", dep:"Data", app:"Dash", del:"Segment focus" },
      { t:"Hire/assign first sales support (SDR/ops)", o:"Founder", pri:"P1", eff:"M", out:"Leverage", dep:"Pipeline proof", app:"Activity leaderboard", del:"First hire" },
      { t:"Expand distributor footprint", o:"Founder", pri:"P1", eff:"M", out:"Reach", dep:"First distributor win", app:"Distributor pipeline", del:"+distributors" },
      { t:"Integrate carbon buyer conversations w/ deployment data", o:"Founder/Carbon", pri:"P1", eff:"L", out:"CDR revenue path", dep:"MRV + tons", app:"Carbon pipeline", del:"CDR term sheet" },
      { t:"Pursue larger contracts / annual supply", o:"Founder", pri:"P1", eff:"L", out:"Base-load volume", dep:"Capacity", app:"Offtake pipeline", del:"Contract" },
      { t:"Sales ops cleanup + forecast v1", o:"Founder/Dev", pri:"P2", eff:"S", out:"Predictability", dep:"Deal history", app:"Dash", del:"Forecast" },
    ]},
  ],

  /* ============ 15. FINAL CHECKLIST ============ */
  checklist:{
    website:["✅ Temporary website build-out complete (localhost + combined-site)|done","Victor reviews & approves site copy + both product tracks","Create 2 sample SKUs in Shopify (Pellets 1 lb, Biochar 8 oz)","Wire Shopify variant IDs into the site sample forms","Publish certs/spec sheets to the site (SDS/OMRI/IBI/Puro)","Install/stage approved site in Shopify → publish over current site","Sample + reserve-supply forms route to Jesse + Victor + Daniel (tested end-to-end)"],
    build:["CRM objects + fields (Account/Contact/Deal/Sample/LOI/Activity)","Sample→LOI funnel: statuses + sample tracker","Dashboards (samples shipped, sample→LOI, committed volume)","Target account list view (both tracks, freight-zoned)"],
    collateral:["Absorbent 1-pager (industrial — single-product)","Biochar 1-pager (ag — single-product)","Sample-kit insert + test protocol","Spec sheets + SDS (from Victor)","Comparison: pellets vs wood/clay · biochar vs wood biochar","Product photos (real close-ups + facility)"],
    lists:["150–200 accounts across BOTH product ICPs (Gulf South + freight-viable)","Contacts + verified emails (Apollo)","ICP-tagged + freight-zoned; shared with Victor"],
    firstActions:["Free-sample outreach ONLY (no LOI/bulk talk in cold touch)","Absorbent track: EHS/spill/oilfield emails + calls","Biochar track: distributor/blender emails + calls","Ship free samples within 48h of qualification","Book discovery/technical calls (Victor takes technical)"],
    dashFields:["samples requested / shipped","sample → LOI rate","LOIs signed + committed volume","positive reply rate by ICP","deliverability (bounce <2%)"],
    priceInputs:["(Q4 reference only — NOT quoted now) COGS/SKU","freight zones A–D","Q4 price band per product","distributor territory/volume terms","CDR $/tCO2e (days 61–90)"],
    claims:["Keep the two product pitches SEPARATE — never mix in one asset","Confirm OMRI/IBI/Puro language (Victor)","USDA Organic = pending only, never 'certified'","Feed/health claims = gated (AAFCO/FDA-CVM) — bedding/absorbency framing only","Lock proof hierarchy (T1–T5) on all assets"],
    hires:["Jesse (consultant) — demand & the machine","Victor (company) — product, proof, certs, website, fulfillment, signs LOIs","VA for list-building / enrichment as volume grows"],
  },

  /* ============ 14. BIOCHAR — SPECS, DATA & AVATARS ============
     Biochar is the DYNAMIC product: one material, many buyers. Absorbent pellets = one industrial avatar;
     biochar sells across ag distribution, row-crop farmers, ranchers/livestock, poultry (bedding + in-feed),
     compost/blenders, and nursery/greenhouse — each with a different benefit that matters to THEM.
     Pull the spec + the ONE comparison + the ONE benefit that fits the avatar in front of you. */
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
      ["Certifications","OMRI Listed · IBI Certified · Puro.earth carbon pathway · USDA Organic PENDING"],
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
      { h:"Market / cost positioning ($/ton)", cols:["","ProGreaux bulk","Market"], rows:[
        ["Working price","$700/ton [assumption]","Wholesale $600–$2,778; modal ~$1,600"],
        ["CA study","—","$600–$1,300 avg (20–40% bulk discounts)"],
        ["Angle","Enter low, undercut premium retail","Carbon layer can further subsidize price"],
      ]},
    ],
    avatars:[
      { name:"Ag Input Distributors & Co-ops", who:"Category / purchasing manager reselling inputs to growers", pain:"Need a differentiated, margin-accretive organic SKU their growers actually pull through", angle:"A carbon-negative, OMRI/IBI biochar with a real supply story + distributor margin — one line that differentiates the shelf", lead:"OMRI/IBI + USDA-ARS study + distributor margin model", sample:"Sample + program preview to evaluate with their team", claim:"" },
      { name:"Row-Crop & Specialty Growers (Farmers)", who:"Farmer / agronomy lead on sandy, drought-prone, or degraded ground", pain:"Water and fertilizer cost; yield variability on poor soils", angle:"Holds ~3–3.5× its weight in water and keeps nutrients in the root zone — more efficient water + fertilizer, better resilience", lead:"Water-holding report + NUE + USDA-ARS field study", sample:"Sample for a controlled strip/plot trial", claim:"Frame yield as trial-measured; no blanket yield guarantees" },
      { name:"Ranchers / Livestock & Pasture", who:"Rancher / land manager running pasture + livestock", pain:"Pasture productivity, soil water-holding, and manure/odor management", angle:"Improves pasture soil water + nutrient retention, and binds ammonia/odor in manure and high-traffic areas", lead:"Water-holding + ammonia/odor studies + soil health", sample:"Sample for a pasture soil or manure/bedding area trial", claim:"Environmental/soil framing; no animal-health claims" },
      { name:"Poultry / Chicken Farms", who:"Broiler/layer grower, barn manager, or integrator", pain:"Wet litter, ammonia, air quality, bird comfort — and feed efficiency (integrators)", angle:"TWO uses: (1) BEDDING/LITTER now — drier litter, lower ammonia, better air (claim-safe); (2) IN-FEED later — research shows FCR/gain + ammonia benefits at 0.5–1% (regulatory-gated)", lead:"Ammonia-reduction studies (bedding) · in-feed research pack (gated)", sample:"House trial on litter moisture/ammonia (bedding-only claims)", claim:"BEDDING/ABSORBENCY ONLY until AAFCO/FDA-CVM feed pathway clears. NO feed/health claims." },
      { name:"Compost Yards & Soil Blenders", who:"Owner/operator whose throughput is capped by cure time, or a blender needing differentiation", pain:"Turnover time caps batches/year; commodity blends compete on price", angle:"Shortens the compost cycle ~10–30% (more batches, same pad) and upgrades blends' water-holding + organic/carbon story", lead:"Compost cycle-time research + water-holding + windrow trial protocol", sample:"Bulk sample for a side-by-side windrow or blend trial", claim:"Cycle-time is Tier-3 general research — validate in THEIR windrow" },
      { name:"Nurseries / Greenhouses / Landscape", who:"Head grower, yard buyer, or landscape supplier", pain:"Media water-retention, premium differentiation, contractor/retail demand for organic", angle:"Biochar-based media component improves water retention and root-zone performance; premium, OMRI-listed, carbon-negative positioning", lead:"OMRI + water-holding + retail-bag option", sample:"Sample for a controlled media/grow trial", claim:"Media-property framing" },
    ],
    guardrails:[
      "One material, MANY avatars — lead with the ONE benefit that matters to the buyer in front of you, not the whole list.",
      "USDA Organic is PENDING — say OMRI Listed / IBI Certified only.",
      "Poultry IN-FEED and any feed/health claim is AAFCO/FDA-CVM gated — until cleared, sell poultry as BEDDING/environmental only.",
      "Compost cycle-time and yield lifts are Tier-3 general-biochar research → present as 'validate in your own trial,' never as a ProGreaux-specific guarantee.",
      "Carbon/CDR is a days-61–90 layer — mention as upside, don't lead ag pitches with it.",
    ],
  },
};
