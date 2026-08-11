/* ============================================================
   VEJ Sales OS — GTM Command Center DATA
   Loaded after data.js. Consumed by gtm.js.
   All figures marked (EST) are estimates, not verified claims.
   ============================================================ */
const GTM = {

/* Sections 1 (executive summary) and 3 (ICP campaigns) are deleted. Both described a
   nine campaign taxonomy on CMP tags, with an effort allocation that no longer matched
   anything being sent. OUTREACH.plan and the per ICP campaign blocks in outreach-data.js
   replace them, so the allocation is defined once, on the ICPs themselves. */

/* Sections 4 (scale), 6 (sequences), 7 (calling) and 7b (phone script library) are
   deleted. The 60/90 scale plan was a build plan for a machine that is now built, and
   the three copy banks were superseded wholesale by outreach-data.js, which was written
   with Victor and Daniel on the Aug 10 VDJ call. Cold copy has exactly one home now. */

/* ---------------------------------------------------------- 8. LINKEDIN PLAN */
linkedin:{
  profile:["Headline states value, not title: 'Plant-based industrial absorbents & biochar | Helping remediation & ag teams cut cost and carbon'","Banner: product + facility photo","About: prior sales credibility + bagasse story + who you help + CTA","Featured: spec sheet, comparison sheet, sample-request link","Experience: American BioCarbon with 2-line what-we-do","Turn on Creator mode; add 'absorbents, remediation, biochar, CDR' topics"],
  companyPage:["Create LinkedIn Company Page (American BioCarbon → rename to the new brand at the ~Aug 17 rebrand; reserve the new-brand handle now)","Logo + banner + 1-line tagline","About: products, wedge, facility/feedstock story","Add products + website + location","Post 2–3x/week; employees reshare","Add 'Products' section linking to the free-sample + reserve-supply (LOI) pages"],
  targets:["HSE Manager","Procurement / Sourcing Manager","Operations Manager","Environmental / Remediation Ops","Landfill Manager","Sustainability / ESG lead (CDR)"],
  dailyConnect:"15–25 targeted connects/day (stay under ~100/week to avoid limits). Personalize every note. Prioritize accounts already in a sequence.",
  contentThemes:[
    {wk:"Wk 1",theme:"Credibility + proof (product, prior sales, facility)"},
    {wk:"Wk 2",theme:"Absorption demos + comparison vs wood/clay"},
    {wk:"Wk 3",theme:"Use-cases (spill, tank, leachate) + customer-safe wins"},
    {wk:"Wk 4",theme:"Bagasse story + carbon-removal education (light)"}
  ],
  dm:[
    {t:"Connection note",b:"{First} — we make a bagasse-based industrial absorbent used in spill/remediation work. Connecting in case absorbent sourcing is ever on your plate."},
    {t:"Follow-up 1 (2 days after accept)",b:"Thanks for connecting, {First}. Quick version: plant-based absorbent, soaks ~5x its weight, lighter disposal than clay/wood. Open to comparing it against what your team uses now? I can send a sample kit."},
    {t:"Follow-up 2 (4 days later)",b:"{First} — no pressure. If it's useful I'll send the spec sheet + a wood/clay comparison so it's on file for the next spill job. Want me to?"},
    {t:"Follow-up 3 (soft, 1 week later)",b:"{First} — sharing a short absorption demo we posted, in case it's useful for your crews. Happy to talk whenever sourcing comes up."}
  ],
  comment:"Comment thoughtfully on 5 target-buyer or industry posts/day (HSE, remediation, waste, sustainability). Add insight, never pitch. Goal: familiarity before the DM.",
  searches:["'HSE manager' AND (oilfield OR remediation) — Gulf South","'procurement' AND (environmental services OR spill)","'landfill manager' OR 'environmental manager' (waste)","'operations manager' AND (oilfield services OR remediation)","'head of sustainability' AND (net zero OR carbon removal)","'purchasing' AND (ag distributor OR farm supply)"],
  postTypes:["Credibility: prior-sales/experience (claim-safe)","Product demo: absorption test video","Facility/process: bagasse → product at the mill","Comparison: our pellet vs wood/clay (EST-tagged)","Case study: customer-safe result","Carbon/remediation: MRV-honest education"],
  socialPages:[
    {p:"LinkedIn Company Page",need:"Required",why:"Primary B2B credibility + content channel."},
    {p:"Facebook Page",need:"Recommended",why:"Local/Gulf South industrial + ag buyers verify here."},
    {p:"X/Twitter",need:"Optional",why:"CDR/climate audience; low priority."},
    {p:"YouTube",need:"Recommended",why:"Host the 5 demo videos; embed on landing pages."},
    {p:"Google Business Profile",need:"Optional",why:"Only if facility/pickup is customer-facing."}
  ]
},

/* ---------------------------------------------------------- 9. SOCIAL CALENDAR */
social:{
  posts:[
    {d:1,pl:"LinkedIn",topic:"Company intro / who we help",hook:"Most spill absorbents are clay or wood. There's a plant-based option.",body:"Intro American BioCarbon: bagasse-based absorbents + biochar for remediation, ag, and carbon. Who we help and why now.",vis:"Product hero + logo",cta:"Follow for absorption demos",icp:"All"},
    {d:2,pl:"LinkedIn",topic:"Product proof",hook:"This is what 5x absorption looks like.",body:"Close-up of the pellet + packaging. What it is, what it's made of, where it's used.",vis:"Product macro photo",cta:"Want the spec sheet? DM me",icp:"O&G/ENV"},
    {d:3,pl:"LinkedIn",topic:"Absorption demo",hook:"Watch it soak up ~5x its weight (est.).",body:"Short demo: pour liquid, show absorption. No hype, just the test.",vis:"Demo video (absorbency test)",cta:"Worth testing on your next spill?",icp:"O&G/ENV"},
    {d:5,pl:"LinkedIn",topic:"Comparison vs wood pellet",hook:"Price-per-bag is the wrong number. Cost-per-gallon-absorbed is the right one.",body:"Side-by-side vs wood/clay on absorption-per-pound and disposal weight.",vis:"Comparison graphic (EST-tagged)",cta:"Want the comparison sheet?",icp:"O&G/ENV"},
    {d:7,pl:"LinkedIn",topic:"Bagasse story",hook:"Our absorbent starts as sugarcane waste.",body:"Co-location at a sugar mill (Cora Texas) → bagasse → product at source. Supply + sustainability story.",vis:"Facility/feedstock photo",cta:"Curious how it's made? Ask me",icp:"All"},
    {d:9,pl:"LinkedIn",topic:"Industrial use-case",hook:"Around tanks and on pads, absorbent adds up fast.",body:"How oilfield/industrial crews use it; less material, lighter disposal.",vis:"Use-case photo/graphic",cta:"Who handles absorbent sourcing on your team?",icp:"O&G"},
    {d:11,pl:"LinkedIn",topic:"Spill cleanup demo",hook:"Simulated spill, real cleanup.",body:"Demo video of a spill cleanup with the pellet.",vis:"Demo video (spill cleanup)",cta:"Want a sample kit for your next job?",icp:"ENV"},
    {d:13,pl:"Facebook",topic:"Local facility/process",hook:"Made in the Gulf South.",body:"Facility + process shots; local supply story for regional buyers.",vis:"Facility photos",cta:"Reach out for a sample",icp:"All"},
    {d:15,pl:"LinkedIn",topic:"Customer-safe win",hook:"A crew tested it against their current absorbent. Here's what happened.",body:"Claim-safe result (no unverifiable numbers).",vis:"Quote card / result graphic",cta:"Want to run the same test?",icp:"O&G/ENV"},
    {d:17,pl:"LinkedIn",topic:"Leachate/waste use-case",hook:"Leachate is heavy, literally.",body:"High-absorption media for landfill leachate/odor; lighter handling.",vis:"Use-case graphic",cta:"Want a free sample to test?",icp:"Landfill"},
    {d:19,pl:"LinkedIn",topic:"Biochar education (light)",hook:"Same molecule, two jobs: absorb now, store carbon later.",body:"Short explainer of biochar's dual role — product + durable carbon.",vis:"Simple diagram",cta:"Want the carbon overview?",icp:"CDR/Ag"},
    {d:21,pl:"LinkedIn",topic:"Comparison #2 / cost math",hook:"Run your own math.",body:"Cost-per-gallon-absorbed calculator walkthrough.",vis:"Calculator screen-grab",cta:"Want me to run it for your volumes?",icp:"O&G/ENV"},
    {d:23,pl:"LinkedIn",topic:"Soil/ag benefit",hook:"Biochar upgrades soil and compost blends.",body:"How blenders/growers use it; trial-backed.",vis:"Soil/blend photo",cta:"Want the blend trial protocol?",icp:"Ag/Soil"},
    {d:25,pl:"LinkedIn",topic:"Sample kit walkthrough",hook:"Inside the sample kit.",body:"Demo video of what's in the procurement-ready kit + how to test.",vis:"Demo video (kit walkthrough)",cta:"Want one sent to your yard?",icp:"O&G/ENV"},
    {d:27,pl:"LinkedIn",topic:"Bagasse-to-product explainer",hook:"From cane to cleanup.",body:"Demo video: bagasse → pellet → use.",vis:"Demo video (bagasse-to-product)",cta:"Curious? DM me",icp:"All"},
    {d:29,pl:"LinkedIn",topic:"Carbon removal / MRV honesty",hook:"We only sell carbon we can actually deliver.",body:"Our MRV-forward approach; supply tied to real tons.",vis:"Diagram: tons → credits",cta:"ESG teams — want an intro?",icp:"CDR"},
    {d:30,pl:"LinkedIn",topic:"Month recap / momentum (safe)",hook:"30 days in.",body:"What we've shipped and learned (no sensitive numbers). Invite conversations.",vis:"Simple recap card",cta:"Want to test it? DM me",icp:"All"}
  ],
  videos:[
    {t:"Absorbency test",script:"Weigh dry pellet → pour measured liquid → show it soak → weigh saturated → state ratio (est.). 30–45s, no music, real."},
    {t:"Pellet vs wood pellet comparison",script:"Two trays, equal weight, same liquid volume → show which absorbs more / stays drier → cost-per-gallon note. 45s."},
    {t:"Spill cleanup demo",script:"Simulated small spill on concrete → apply pellet → sweep/scoop → show clean surface + lighter waste. 45–60s."},
    {t:"Bagasse-to-product explainer",script:"Cane/bagasse at mill → processing → finished pellet in hand. Supply + sustainability story. 60s."},
    {t:"Industrial sample kit walkthrough",script:"Open the kit → show contents, spec card, test protocol, success criteria → 'here's how to evaluate it.' 45s."}
  ]
},

/* ---------------------------------------------------------- 9b. LONG-TERM / COMPOUNDING CHANNELS */
longTerm:{
  intro:"Month 1 is the outbound sprint (email + calls + DMs = free samples). These are the compounding channels that make the pipeline durable over 90 days → 12 months. Every one still funnels to the SAME first win: a free sample in a buyer's hands. Sequenced from cheapest/nearest-term to biggest-build.",
  channels:[
    {name:"Facebook Groups & Social Communities",horizon:"Now → ongoing",cost:"$",
     why:"Gulf South oilfield, environmental-services, farming, compost, and poultry buyers live in active Facebook Groups and forums. Warm, high-trust, and free — the modern version of the trade-counter conversation.",
     plays:["Join 15–25 relevant groups (oilfield services, spill/HAZWOPER, LA/TX farming, compost/soil, backyard poultry & integrators)","Add value first — answer absorbent/soil questions, never hard-pitch","Post occasional demo clips (absorbency test) where group rules allow","DM active members who mention spills, wet litter, or soil problems → offer a free sample","Run a 'free sample for group members' drop where allowed"],
     targets:["Oilfield & HSE groups","Environmental / spill-response groups","Regional farming & co-op groups","Compost & soil-blending groups","Poultry & livestock groups (bedding angle)"],
     metric:"Group DMs → free-sample requests"},
    {name:"Trade Shows & Industry Events",horizon:"Days 60+ → recurring",cost:"$$$",
     why:"Face-to-face is where industrial and ag buyers commit. A booth with a live absorbency demo + free samples on the table converts faster than 100 cold emails, and one show seeds a quarter of pipeline.",
     plays:["Build a target show list by ICP (see targets) and pick 2–3 per year to start","Booth = live absorbency demo + free sample giveaway + spec cards + QR to /request-sample","Pre-show: email/DM registered attendees offering to meet + hand them a sample","At-show: capture ship-to for a full free sample kit to every qualified visitor","Post-show: 5-touch follow-up sequence to every scan within 48h","Start as an attendee/walk-the-floor before paying for a booth to validate the room"],
     targets:["Industrial: API / oilfield expos, HAZMAT & spill-response conferences, WasteExpo, environmental-services shows","Ag: regional farm shows, sugar & cane events, biochar/USBI events, nursery & landscape trade shows","Poultry: IPPE (Intl. Production & Processing Expo), regional poultry federations","Carbon: CDR / carbon-removal summits (days 90+)"],
     metric:"Booth conversations → sample kits shipped"},
    {name:"Referral & Word-of-Mouth Engine",horizon:"After first wins",cost:"$",
     why:"A crew that loves the sample knows five others with the same spill/soil problem. Referrals are the cheapest, highest-trust samples we can place.",
     plays:["Ask every happy trial user: 'who else runs into this?' → offer to send THEM a free sample","Simple referral incentive (priority Q4 pricing, co-branded content, or product credit)","Turn winning trials into short claim-safe testimonials to open the next referral","Map each account's network (sister sites, contractors they sub to, co-op peers)"],
     targets:["Trial winners","Distributor/co-op networks","Contractor & sub relationships"],
     metric:"Referrals → sample requests"},
    {name:"Content, SEO & Video Library",horizon:"Days 30+ → compounds",cost:"$$",
     why:"Inbound that keeps working after you stop sending. 'Cost per gallon absorbed', 'biochar for compost', 'poultry litter moisture' are searched by exactly our buyers — own those answers and samples come inbound.",
     plays:["Ship the 5 demo videos (absorbency, comparison, spill cleanup, bagasse story, kit walkthrough) → embed on landing pages + YouTube","Publish ICP SEO pages (see main /oil-gas, /industrial-remediation, /agriculture, /carbon-removal)","Write 1–2 practical articles/month per wedge (cost-per-gallon math, blend rates, litter moisture)","Founder LinkedIn cadence 3x/wk; repurpose to Facebook + YouTube Shorts","Every asset ends in ONE CTA: request a free sample"],
     targets:["Search traffic by ICP keyword","LinkedIn + Facebook + YouTube audiences"],
     metric:"Organic sessions → sample-form conversions"},
    {name:"Distributor / Reseller Network",horizon:"Days 60–180",cost:"$$",
     why:"One distributor puts our product in front of hundreds of growers/buyers without our own field team — the biggest force-multiplier we have. Seed it now with free samples, formalize the program later.",
     plays:["Free biochar sample + program preview to every ag distributor/co-op (CMP-AGD)","Once a distributor is warm: margin model, territory, MOQ, co-branded grower trials","Give each distributor a stack of free samples to place with THEIR customers","Formalize distributor agreements as capacity firms in Q4"],
     targets:["Ag input distributors & co-ops","Landscape/soil supply chains","Industrial safety-supply resellers (absorbents)"],
     metric:"Distributor sample placements → programs signed"},
    {name:"Strategic Partnerships & Earned Media",horizon:"Days 90+",cost:"$$",
     why:"Credibility and reach we can't buy — mill/feedstock partners, environmental firms, carbon marketplaces, and press that positions American BioCarbon as the Louisiana bagasse leader.",
     plays:["Co-marketing with Cora Texas / mill + any enviro-services partners","List on CDR marketplaces & broker networks (days 90+, MRV-honest)","Pitch regional business/ag/climate press on the waste-to-value story","Apply for relevant sustainability / ag-innovation awards","Explore paid retargeting only AFTER an ICP is proven by outbound"],
     targets:["Feedstock & mill partners","Environmental-services firms","CDR marketplaces & brokers","Regional & trade press"],
     metric:"Partnerships live · earned placements · marketplace listings"}
  ]
},

/* ---------------------------------------------------------- 10. CAMPAIGN ↔ LANDING MAP */
sampleFlow:{
  whenSample:"ALWAYS lead with a free sample. It is the door-opener and the only thing we ask for in cold outreach. Send it the moment a buyer shows any interest. Free samples: Biochar 1/2 lb (8 oz), Absorbent Pellets 1 lb, Absorbent Crumble 1 lb. S&H included, 4 to 7 business days from White Castle, LA. What changed: a winning trial now converts to a PAID metric-ton order, not just an LOI. All three lines sell by the metric ton today with working checkout (Biochar $450/MT, Pellets and Crumble $275/MT in 1,650 lb super sacks). Still never open a cold touch with a bulk or LOI pitch: sample first, order after the trial wins.",
  whenLOI:"INTERNAL, LATER, 1:1 ONLY, never in outreach. The LOI is now the SECOND ask, not the first. After a trial wins, the primary close is a paid metric-ton order at the published price, shipped from inventory. The LOI sits on top of that to reserve TRUCKLOAD volume against the Q4 capacity ramp, which is the only thing still gated. It is non-binding and locks supply, pricing and territory for Q4. If a buyer has not tested a sample yet, there is no LOI conversation and no bulk conversation.",
  qualQuestions:["What liquid/spill type (pellets) or crop/blend (biochar) would you test it on?","Roughly what volume would you need monthly/annually once we're at full capacity?","What are you using now, and what does it cost delivered?","What would make you switch — absorption/water-holding, disposal weight, price, sustainability?","Who signs an LOI on your side, and what's their bar?"],
  formFields:["Account + contact","Product + sample size (Pellets 1 lb / Biochar 8 oz)","Use-case / liquid or crop type","Estimated future volume (Q4+)","Current product + cost","Success criteria (how they'll judge it)","Ship-to address + zip","Decision-maker + timeline for an LOI"],
  approval:["Auto-approve sample if ICP-fit + qualification complete","Victor/Ops reviews any non-standard request","Reject/redirect if no real use-case or pure freebie-seeker"],
  shipping:["Ship within 48h of qualification (4–7 biz days to arrive from White Castle, LA)","Capture tracking + ship date in CRM","Box includes: product sample, spec sheet, written test protocol, success-criteria sheet, and the LOI one-pager"],
  followTiming:["Day of delivery: 'it landed — here's the 2-minute test protocol'","Day 3: 'did you get a chance to run it?'","Day 7: results check-in + capture outcome","Day 10: present the LOI if positive; capture objection if not"],
  trialDoc:["Ask for a photo/short note of the result (claim-safe)","Log performance vs current (absorption / water-holding), handling impression, ease of use","This becomes case-study-safe proof + the justification for the LOI"],
  loiConversion:["Trigger the LOI when sample outcome = Positive","Present a short LOI: committed future volume × locked Q4 price band + reserved territory/priority — non-binding until Q4 delivery","Send within 48h of a positive trial","Follow up in 2 days: 'does this lock the terms you want for the fall? happy to adjust volume/territory'","On signature: log committed volume → the funding metric"],
  reorder:["(Q4+, post-capacity) Set future-order cadence at expected burn-rate interval","Move LOI holders to a standing supply agreement once capacity is online","Log confirmed orders → recurring-revenue metric"],
  ogNote:"For O&G, the sample + LOI must feel PROCUREMENT-READY: labeled, spec-carded, with a written test protocol, success criteria, and a clean one-page LOI — not a consumer freebie. It should look like something a buyer can put in front of HSE and procurement without embarrassment."
},

};
