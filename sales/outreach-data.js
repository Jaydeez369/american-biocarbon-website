/* ============================================================
   VEJ Sales OS - CANONICAL OUTREACH DATA
   ------------------------------------------------------------
   Source of truth for every word that goes out cold.

   Built from the VDJ call on August 10, 2026 (Jesse, Victor,
   Daniel). That call replaced the previous outreach copy, which
   was AI drafted and never pressure tested by anyone who has
   talked to these buyers. Every hook below traces to something
   said on that call or to a product fact behind it.

   TWO TRACKS, and they are not interchangeable:
     biochar   = 500 mile radius of White Castle, LA. Port
                 distance and carbon credit economics break past
                 that, so the list is geofenced.
     absorbent = nationwide, FOB. The buyer covers freight.

   HARD FORMATTING RULE: no hyphens, en dashes or em dashes in
   any string in this file. The whole engine reads as clean plain
   text so copy blocks paste into Instantly without smart quote
   or dash artifacts. scripts/check-outreach-dashes.mjs enforces
   it. Write "follow up", not the hyphenated form. Write "5 to 1",
   not a dash range.

   Claim discipline lives in meta.guardrails and is repeated per
   ICP where it actually bites. Read it before editing copy.
   ============================================================ */

const OUTREACH = {

meta:{
  built:"August 11, 2026",
  source:"VDJ call, August 10, 2026. Jesse, Victor and Daniel worked the hooks live, segment by segment. This replaces the prior outreach copy in full.",
  channel:"Instantly for email. Aloe for the power dialer and the voicemail agent once 10 DLC clears. Apollo is the list source.",
  reply:"victor.jehle@cs-ops.com",
  corkNote:"Cork is deliberately not a campaign. There is no inventory to sell, so it stays a website funnel that captures interest and builds the relationship for when supply exists. Do not build a cork sequence.",

  /* The testing method Jesse laid out on the call. These are the rules the
     whole engine is shaped around, which is why they sit above the copy. */
  rules:[
    "One variable at a time. Test the subject line first, then the body. Changing both at once tells you nothing.",
    "Every ICP ships with 5 subject lines and 3 body variants. Rotate the subjects across the bodies so each body gets a fair read.",
    "No links in the first cold email. Links tank deliverability and the first send has one job, which is to earn a reply.",
    "The only ask is a free sample. Never a bulk quote, never an LOI, never a meeting on the first touch.",
    "Put the reply address and a phone number in the body. Roughly half to three quarters of replies come back with a phone number, and those numbers feed the power dialer.",
    "Give a variant about 40 to 50 sends before you judge it. Kill the loser, clone the winner into a new variant, keep going.",
    "Score on reply rate and sample yes rate. Opens are noise now that Apple and Gmail prefetch images.",
    "Video and time lapse footage go out on the reply, never in the first send. That is the second touch payload and it is the strongest asset we have.",
    "When a reply lands, stop selling. Get the ship to address and the use case, then get off the thread.",
  ],

  /* Claim boundaries. These are the ones that have actually been wrong in
     published copy before, so they are stated as rules rather than notes. */
  guardrails:[
    "OMRI Listed is real and can be stated plainly.",
    "IBI: say independently lab tested against the IBI panel. We have never held IBI certification. Never write IBI Certified in any form.",
    "Never write USDA Organic. There is no certification and no filed application.",
    "Puro.earth certified carbon removal is real and can be stated plainly.",
    "Absorption: say up to 5 times its weight. It is a product spec, not a guaranteed field result.",
    "Compost time: say up to 20 percent faster. Sourced from research and customer practice, not a guarantee we underwrite.",
    "Sustainability and ESG language only where the buyer and the state actually care. Victor and Jesse agreed to leave it off field level oil and gas, where oversight is thin and it reads as filler.",
    "Poultry and livestock: absorbent and moisture management framing only. No feed, animal health or veterinary claims.",
    "Never promise a delivered price in a cold email. Freight zone decides it and the absorbent buyer pays freight.",
  ],

  /* Placeholders the sender swaps before a send. Listed so nobody invents new ones. */
  tokens:[
    ["{First}","Contact first name"],
    ["{Company}","Their company name"],
    ["{Me}","Sender name"],
    ["{phone}","Sender direct line"],
  ],
},

/* ============================================================
   CANONICAL PRODUCT FACTS

   One definition of the numbers that appear on screen in more than one place. Before this
   block the biochar price was written out in app.js, in gtm-data.js, in data.js and twice
   in the outreach copy, and the tonnage in six places, so a price change meant finding all
   of them. app.js reads this now instead of declaring its own.

   These MUST agree with website/data.js, which is the source of truth for what the live
   checkout actually charges. Verified against it: biochar 450, pellets 275, crumble 275,
   all in 1,650 lb super sacks.

   Note for anyone reading a HubSpot thread: the activity log contains older negotiated
   quotes (300 for powder, 225 for crumble, 230 for pellets). Those are records of what was
   said at the time, not list price. Quote from here.
   ============================================================ */
facts:{
  biocharMt: 450,
  absorbentMt: 275,
  inventoryMt: 80,
  superSackLb: 1650,
  samples: "Biochar half pound, pellets 1 lb, crumble 1 lb",
  sampleEta: "4 to 7 business days",
  bulkEta: "7 to 10 business days",
  replyTo: "victor.jehle@cs-ops.com",
  origin: "White Castle, Louisiana",
  biocharRadiusMi: 500,
  geo: "Biochar ships within 500 miles of White Castle. Absorbent ships nationwide, buyer pays freight.",
  certs: "OMRI Listed, independently lab tested against the IBI panel, Puro.earth certified carbon removal. Never IBI Certified, never USDA Organic.",
},

/* ============================================================
   THE PLAN
   What the Campaigns and ICP section renders above the
   campaign cards. This used to be GTM.summary, which described a
   nine campaign taxonomy on CMP tags that no longer matches
   anything. One ICP list, one set of tags, one source.

   Effort percentages live on each ICP as campaign.effort and are
   summed by the renderer rather than restated here, so the
   allocation table can never drift from the cards.
   ============================================================ */
plan:{
  thesis:"Biochar is priority one because roughly 80 metric tons of it are finished and sitting. All three lines sell by the metric ton today, so a winning free sample converts to a paid order rather than to a promise. Absorbent is the second track by effort, not by availability, and after the Aug 10 call it carries far more addressable market than biochar does: biochar is fenced to 500 miles by port distance and carbon credit economics, while absorbent ships anywhere the buyer will pay freight.",

  wedge:[
    "The cold ask is always a free sample. Never a bulk quote, never an LOI, never a meeting. Those come after a trial wins.",
    "A free sample is the lowest friction yes in the business. It needs no budget, no approval and no commitment to accept.",
    "Biochar leads because we can actually ship it today. Ag distributors are the highest leverage ICP in the set, since one relationship reaches more acres than any volume of direct grower email.",
    "Absorbent runs in parallel and doubles as phone number capture. Jesse: eight times out of ten a reply comes back with a phone number, and those numbers are what the power dialer runs on.",
    "Every ICP gets its own campaign with its own subject pool. The offer stays constant, the packaging is tuned per buyer, and the winner is decided by reply data rather than by opinion.",
    "Cork is not a campaign. There is no inventory, so it stays a website funnel that captures interest for when supply exists.",
  ],

  offer:"A free, performance grade sample of a live product shipped to their door, with a written test protocol and the spec, so they can run it against what they already use. Zero cost and zero commitment. If it does not beat what they have, they throw it away and we have lost nothing but postage.",

  ctaPaths:[
    "Free sample. The primary ask on every campaign, every channel.",
    "Reply for the video. Absorbent only, and it is the strongest second touch we have.",
    "Spec sheet first. A soft yes that routes back to the sample.",
    "Sourcing intro. Who owns this on your team, which routes to the sample.",
  ],

  goals:{
    d30:"Infrastructure live, 1,000 or more verified contacts across both tracks, every campaign running, and 15 to 25 free samples shipped. The scoreboard this month is samples in hands.",
    d60:"Sample volume scaling, one or two documented trial wins, distributor conversations open, campaigns tuned to actual reply data, and the first reorders coming off winning trials.",
    d90:"A repeatable pipeline that predictably produces trials, winning trials converting to reorders and standing supply, and the sales reporting model that the team committed to for September 1.",
  },

  kpis:[
    "Samples requested and shipped. The leading metric this month.",
    "Positive reply rate by ICP and by variant, which is how the A/B test is actually scored.",
    "Reply to sample request conversion.",
    "Phone numbers captured per 100 replies, which feeds the power dialer.",
    "Sample ship time against the 48 hour target after qualification.",
    "Trials completed and trial win rate.",
    "Deliverability health across every inbox. Bounce under 2 percent, spam under 0.1 percent.",
  ],
},

tracks:[

/* ============================================================
   TRACK 1 - BIOCHAR
   80 metric tons finished and sitting. Geofenced. Primary.
   ============================================================ */
{
  key:"biochar",
  name:"Biochar",
  sub:"Primary track. Finished tonnage on the ground today.",
  product:"100 percent sugarcane bagasse biochar, made at White Castle, Louisiana. 65 percent organic carbon. Holds roughly 3 times its weight in water. OMRI Listed, independently lab tested against the IBI panel, Puro.earth certified carbon removal.",
  geo:"Within 500 miles of White Castle, Louisiana. Past that, port distance and carbon credit economics stop working, so the list is geofenced on purpose.",
  price:"$450 per metric ton",
  inventory:"80 metric tons finished, ready to ship now",
  sample:"Half pound biochar sample, 4 to 7 business days",
  why:"Victor: we sell this to build long term offtake, so we want bigger operations that can take real production, not a hundred mom and pop accounts.",

  icps:[

  /* -------------------------------------------------- COMPOSTERS */
  {
    id:"comp", short:"Composters", tag:"BC.COMP",
    name:"Composters and Organics Recyclers",
    who:"Commercial compost yards, organics recyclers, municipal and private green waste operations running windrows or static piles.",
    titles:["Owner","General Manager","Operations Manager","Site Manager","Procurement"],
    pains:[
      "Turn rate. Every extra week a windrow sits is capacity they cannot sell.",
      "Piles compact, go anaerobic in the middle, and finish unevenly.",
      "Piles dry out and the biology dies with them.",
      "Nitrogen and ammonia walk off as odor, which is both a lost nutrient and a neighbor complaint.",
      "Compost tea and its nutrients run out the bottom of the pile.",
    ],
    mechanism:"Victor on the call: biochar works as a bulking agent. It creates air pockets so microbes get through the whole pile evenly instead of only working the outside. His analogy was a frozen meal in the microwave, cooked at the edges and still a cold block in the center. Once the microbes are working, the biochar holds the liquid they excrete, so the compost tea nutrients stay in the pile instead of leaching out. It holds nitrogen, traps ammonia and the smelly gases, and keeps the pile from drying out.",
    proof:[
      "Up to 20 percent faster composting time",
      "65 percent organic carbon going into the finished product",
      "OMRI Listed",
      "Holds roughly 3 times its weight in water",
    ],
    guardrail:"Say up to 20 percent, not a guaranteed 20 percent. This is the number Victor and Jesse settled on out loud and it is the one to hold the line at.",
    campaign:{
      priority:"P0",
      effort:12,
      companies:["Merchant and municipal compost operations","Organics recyclers and food waste processors","Green waste and yard waste facilities","Manure composting operations"],
      triggers:["Feedstock backing up faster than the pad can cure it","Pad space maxed with no room to expand","Odor complaints from neighbors or the regulator","A finished compost supply deal they are struggling to keep up with","Peak season throughput crunch"],
      disq:["No throughput or space constraint, so a faster turn buys them nothing","Will not run a side by side row","No way to measure days to maturity"],
      offer:"Free half pound sample plus a written windrow trial protocol. One treated row against one control row, measuring days to maturity and peak temperature.",
      cta:"Can I send you a free sample to run on one windrow?",
      cta2:"Want the windrow trial protocol first?",
      metric:"Windrow trials started",
      cycle:"3 to 8 weeks. One compost cycle proves it.",
      list:"Inside 500 miles of White Castle. Apollo filter on waste management and environmental services, 10 employees and up. Exclude haulers with no processing site of their own.",
      persona:{
        cares:"Days to maturity, pad space, and tons of finished product going out the gate.",
        fears:"Adding cost per yard for something that never shows up in the batch.",
        needs:"A result in their own windrow, not a study.",
        language:"Turn rate, windrow, curing, feedstock, thermophilic, screening.",
        avoid:"Soil health lectures. They are running a factory, not a garden.",
        discovery:["How many days does a batch take you right now, start to screened?","What is the real constraint, pad space or feedstock?","Are you fighting odor or nitrogen loss on the pile?","What would one extra turn per year be worth?"]
      }
    },
    subjects:[
      "Reduce your composting time by 20%",
      "Faster turn rate on your windrows",
      "Your piles are drying out in the middle",
      "A bulking agent that holds nitrogen instead of losing it",
      "Free biochar sample for your next windrow",
    ],
    variants:[
      { id:"A", angle:"Direct value",
        subject:"Reduce your composting time by 20%",
        body:"Hi {First},\n\nWe make a sugarcane bagasse biochar in White Castle, Louisiana that composters use as a bulking agent. It opens up air pockets through the pile so the microbes work the middle at the same rate as the edges, which is where the faster turn rate comes from. Operations using it see composting time drop by up to 20 percent.\n\nIt also holds nitrogen and traps the ammonia and odor instead of letting it walk off.\n\nHappy to send you a free sample to run on one windrow. Just reply with a good ship to address.\n\n{Me}\nAmerican BioCarbon\n{phone}" },
      { id:"B", angle:"Problem led",
        subject:"Your piles are drying out in the middle",
        body:"Hi {First},\n\nTwo things kill a windrow: it compacts and goes anaerobic, or it dries out and the biology dies. Both cost you turn time you cannot sell.\n\nWe make a bagasse biochar that fixes the physical side of that. It bulks the pile so air moves through it, and it holds roughly 3 times its weight in water so the pile stays wet enough for the microbes to finish evenly. The compost tea nutrients stay in the pile instead of running out the bottom.\n\nWant a free sample to test against a control row? Send me a ship to address and it goes out this week.\n\n{Me}\nAmerican BioCarbon\n{phone}" },
      { id:"C", angle:"Short and curious",
        subject:"Free biochar sample for your next windrow",
        body:"Hi {First},\n\nQuick one. We make biochar out of sugarcane bagasse in Louisiana. Composters use it to bulk the pile, hold nitrogen, and cut turn time by up to 20 percent.\n\nCan I send you a free sample to run against a control row? Nothing to buy.\n\n{Me}\nAmerican BioCarbon\n{phone}" },
    ],
    followups:[
      { t:"Follow up 1, day 3",
        b:"Hi {First},\n\nFloating this back up. The short version is a bulking agent that keeps air moving through the pile and holds the nitrogen and moisture in it, so the batch finishes faster and more evenly.\n\nIf you want to see it, reply with a ship to address and I will get a free sample out.\n\n{Me}\n{phone}" },
      { t:"Follow up 2, day 7",
        b:"Hi {First},\n\nOne question and I will leave it there. Are you the right person for compost inputs, or should I be talking to someone at the yard?\n\nEither way I am happy to just mail a free sample so it is on the shelf when you want it.\n\n{Me}\n{phone}" },
      { t:"Breakup, day 12",
        b:"Hi {First},\n\nI will stop reaching out. If turn rate or odor ever moves up the list, we are 100 percent bagasse biochar out of White Castle with product on the ground and a free sample standing by.\n\n{Me}\n{phone}" },
    ],
    phone:{
      opener:"Hi {First}, this is {Me} with American BioCarbon in White Castle. Quick reason for the call. We make a bagasse biochar that composters use as a bulking agent, and it cuts turn time by up to 20 percent because the air actually moves through the pile. Are you the one who decides on compost inputs?",
      voicemail:"Hi {First}, {Me} with American BioCarbon. We make a biochar bulking agent that speeds up compost turn time. I would like to mail you a free sample to test on one row. Reach me at {phone}. Thanks.",
    },
    objections:[
      { o:"We already use a bulking agent",
        b:"Makes sense, most yards do. I am not asking you to swap anything. Run our free sample on one row against your normal mix and see what the turn time does. If it does not beat it, toss it." },
      { o:"Send me information",
        b:"Happy to, but the information does not bulk a pile. Let me send the free sample with the spec so you can actually run it. What is the best ship to address?" },
    ],
  },

  /* -------------------------------------------------- NURSERIES */
  {
    id:"nur", short:"Nurseries", tag:"BC.NUR",
    name:"Nurseries and Greenhouse Growers",
    who:"Container nurseries, greenhouse operations and growers mixing their own media. Priority is the multi location operations, not single site mom and pops.",
    titles:["Owner","Head Grower","Production Manager","Purchasing Manager","Operations Manager"],
    pains:[
      "Potting mix is heavy, and weight is freight cost on every plant that ships.",
      "Water consumption during the southeast drought. Irrigation is the daily headache right now.",
      "Nutrient leaching. Fertilizer gets applied and then washes straight through the container.",
      "Heavy reliance on peat moss trucked in from Canada, plus perlite cost on top of it.",
      "Plant health and root development in a mix that packs down.",
    ],
    mechanism:"Victor: nurseries came to us asking for lower bulk density so their plants weigh less when they package and ship. On top of that you get water and nutrient retention, and more porosity for root growth. Jesse added the timing angle: there is a real drought across the southeast right now, so maximizing the water they already have is the live pain. That messaging has a shelf life. If the winter comes in wet, switch the lead to peat replacement and fertilizer cost.",
    proof:[
      "Lower bulk density than a peat and perlite heavy mix",
      "Holds roughly 3 times its weight in water",
      "OMRI Listed",
      "Made in Louisiana, so it is a local alternative to Canadian peat",
    ],
    guardrail:"Do not claim a specific yield or plant health outcome. Water retention, bulk density and nutrient holding are the defensible claims.",
    campaign:{
      priority:"P1",
      effort:9,
      companies:["Container and field nurseries","Greenhouse growers","Wholesale plant producers","Nursery groups with multiple locations"],
      triggers:["Drought or water restrictions in their county","Peat supply or price moving against them","A freight cost review on shipped plants","Building a new media recipe for the coming season"],
      disq:["Buys finished media only and never mixes their own","Single site and too small to matter","Outside the 500 mile radius"],
      offer:"Free half pound sample plus a blend guide. Run it in one mix and compare how it waters.",
      cta:"Can I send a free sample to trial in a mix?",
      cta2:"Want the blend guide and the spec first?",
      metric:"Media trials started",
      cycle:"4 to 10 weeks, roughly one growing block.",
      list:"Inside 500 miles. Weight toward operations with 25 acres or more, or multiple locations. Jesse on the call: we want two of the big ones, not a hundred mom and pops.",
      persona:{
        cares:"Plant quality, water cost, and what the container weighs when it ships.",
        fears:"Changing a media recipe that already works and losing a crop over it.",
        needs:"Another nursery's result and a spec they can hand their grower.",
        language:"Media, bulk density, container, peat, perlite, irrigation cycles.",
        avoid:"Carbon and sustainability framing. They care about the crop.",
        discovery:["What is your mix right now, and who builds it?","How often are you irrigating in this heat?","Are you watching fertilizer run straight through the pot?","What does peat cost you delivered today?"]
      }
    },
    subjects:[
      "Lighten your potting mix and make freight work for you",
      "Cut your nursery's fertilizer runoff",
      "Reduce your summer watering frequency",
      "A reliable local alternative to peat and perlite",
      "Still trucking in peat moss?",
    ],
    variants:[
      { id:"A", angle:"Direct value",
        subject:"Lighten your potting mix and make freight work for you",
        body:"Hi {First},\n\nWe make a sugarcane bagasse biochar in Louisiana that nurseries blend into their media. Two reasons they use it. It drops the bulk density, so the plant weighs less when it ships. And it holds roughly 3 times its weight in water, so the container holds moisture and nutrients between irrigations instead of flushing them.\n\nIt is OMRI Listed and it comes from a mill four hours away rather than a truck out of Canada.\n\nCan I send you a free sample to trial in a mix? Just need a ship to address.\n\n{Me}\nAmerican BioCarbon\n{phone}" },
      { id:"B", angle:"Problem led",
        subject:"Reduce your summer watering frequency",
        body:"Hi {First},\n\nWith how dry it has been across the southeast, most growers I talk to are trying to get more out of every irrigation pass and stop watching fertilizer run out the bottom of the pot.\n\nOur biochar is made from sugarcane bagasse and holds about 3 times its weight in water. Blended into your mix it keeps moisture and nutrients in the root zone longer, adds porosity for root growth, and lightens the container at the same time.\n\nWorth a free sample to test in one mix? Reply with a ship to address and it goes out.\n\n{Me}\nAmerican BioCarbon\n{phone}" },
      { id:"C", angle:"Short and curious",
        subject:"Still trucking in peat moss?",
        body:"Hi {First},\n\nIf peat and perlite are still the backbone of your mix, worth a look at this.\n\nWe make an OMRI Listed biochar from sugarcane bagasse in Louisiana. Lighter mix, better water and nutrient holding, and it does not come off a truck from Canada.\n\nSend me a ship to address and I will get a free sample out to you.\n\n{Me}\nAmerican BioCarbon\n{phone}" },
    ],
    followups:[
      { t:"Follow up 1, day 3",
        b:"Hi {First},\n\nBumping this once. The pitch in one line: lighter media, better water and nutrient retention, made locally instead of imported.\n\nWant the free sample? A ship to address is all I need.\n\n{Me}\n{phone}" },
      { t:"Follow up 2, day 7",
        b:"Hi {First},\n\nAm I aimed at the right person for media and inputs, or is that someone else over there? Happy to be redirected.\n\n{Me}\n{phone}" },
      { t:"Breakup, day 12",
        b:"Hi {First},\n\nClosing the loop on this one. If water cost, freight weight or peat supply ever gets annoying enough to test an alternative, we are here and the sample is still free.\n\n{Me}\n{phone}" },
    ],
    phone:{
      opener:"Hi {First}, {Me} with American BioCarbon in White Castle, Louisiana. We make a biochar that nurseries blend into their media to lighten it and hold water and nutrients in the pot. With how dry it has been I figured it was worth 20 seconds. Are you the one who decides on media inputs?",
      voicemail:"Hi {First}, {Me} with American BioCarbon. OMRI Listed biochar for potting media, lighter mix and better water holding. I would like to mail you a free sample. {phone}. Thanks.",
    },
    objections:[
      { o:"We have a mix that works",
        b:"Good, I am not asking you to change it. Blend the free sample into one batch and compare how it waters. If it does not hold better, nothing lost." },
      { o:"What does it cost",
        b:"It is $450 a metric ton at the mill, but do not decide on that yet. Run the free sample first and see if it earns a place in the mix. Then we talk freight and volume." },
    ],
  },

  /* -------------------------------------------------- SOIL BLENDERS */
  {
    id:"blend", short:"Soil Blenders", tag:"BC.BLEND",
    name:"Soil Blenders and Bagged Media",
    who:"Companies blending and bagging soil, compost and specialty mixes for retail and landscape channels. Highly consolidated, very few players, so every account is worth real effort.",
    titles:["Owner","Plant Manager","Production Manager","Purchasing","R and D or Product Manager"],
    pains:[
      "Bagged soil dries out on a pallet or a shelf and goes hydrophobic, so it will not take water when the customer opens it.",
      "Dust during turning and bagging.",
      "Anything blended in has to granulate uniformly or the mix looks inconsistent.",
      "Their customers are asking for a premium product and they need something real to put behind that word.",
    ],
    mechanism:"Victor: soil blenders like the granulation. It mixes in like black sand and comes out uniform. They also get the inherent NPK, and the organic carbon is the whole reason anyone wants biochar in the first place at 65 percent. Moisture filled biochar binds the ultrafine particles during turning, so it knocks down dust as a side effect. And Jesse named the pain out loud: the dried out bag of soil at the big box store that has gone hydrophobic and will not absorb anything.",
    proof:[
      "65 percent organic carbon",
      "Inherent NPK already in the material",
      "Uniform granulation, mixes like black sand",
      "Holds roughly 3 times its weight in water, so the bag stays alive",
      "OMRI Listed",
    ],
    guardrail:"Do not claim a dust reduction percentage. Say it helps bind ultrafine particles during turning.",
    campaign:{
      priority:"P0",
      effort:11,
      companies:["Soil and media blending plants","Bagged goods manufacturers","Private label soil producers","Compost and soil companies with a retail line"],
      triggers:["Launching or refreshing a premium bagged line","Customer complaints about bags that will not take water","Dust or air quality issues in the plant","Losing a differentiation argument to a competitor's line"],
      disq:["Contract blends only, to somebody else's locked formula","No premium line and no plan for one","Buys purely on lowest cost per yard"],
      offer:"Free half pound sample for a trial batch, with the spec and the granulation data.",
      cta:"Can I send a free sample to run in your premium blend?",
      cta2:"Want the spec and granulation data?",
      metric:"Trial batches run",
      cycle:"4 to 12 weeks. Formulation changes move slowly and then all at once.",
      list:"Inside 500 miles. Extremely consolidated, likely under 30 real targets in range, so treat every one as named account work rather than volume email. Scotts already took our crumble, which proves the category.",
      persona:{
        cares:"A consistent input that does not upset the line, and a story their sales team can use.",
        fears:"A new input that changes screening, dust or bag weight.",
        needs:"Granulation and moisture data, then one clean trial batch.",
        language:"Granulation, screen size, blend, bagged goods, uniformity, dust.",
        avoid:"Anything that sounds like a science project.",
        discovery:["What are you blending in for carbon today?","Do you get complaints about bags drying out on the shelf?","How much dust do you fight during turning and bagging?","Who signs off on a formulation change?"]
      }
    },
    subjects:[
      "Are your customers asking for a premium bagged mix?",
      "The dried out bag problem",
      "Dust control on the turn without new equipment",
      "65% organic carbon, granulated to blend clean",
      "Free sample to run in your premium blend",
    ],
    variants:[
      { id:"A", angle:"Direct value",
        subject:"65% organic carbon, granulated to blend clean",
        body:"Hi {First},\n\nWe produce a sugarcane bagasse biochar in White Castle, Louisiana and supply it as a blend input. Three things blenders care about: it granulates uniformly and mixes in like black sand, it carries 65 percent organic carbon plus inherent NPK, and it holds about 3 times its weight in water so a bagged mix stays alive on the pallet.\n\nOMRI Listed and independently lab tested.\n\nCan I send a free sample to run in your premium blend? Reply with a ship to address.\n\n{Me}\nAmerican BioCarbon\n{phone}" },
      { id:"B", angle:"Problem led",
        subject:"The dried out bag problem",
        body:"Hi {First},\n\nEverybody in this business knows the bag that has sat too long, dried out, gone hydrophobic and will not take water when the customer finally opens it. That bag is a complaint and a returned pallet.\n\nOur biochar holds roughly 3 times its weight in water, so it keeps moisture in the mix. It also granulates uniformly so it blends clean, and the moisture in it binds ultrafine particles during turning, which quiets the dust.\n\nFree sample to run in one batch? Send me a ship to address.\n\n{Me}\nAmerican BioCarbon\n{phone}" },
      { id:"C", angle:"Short and curious",
        subject:"Are your customers asking for a premium bagged mix?",
        body:"Hi {First},\n\nIf your customers are asking for a premium mix, biochar is the easiest way to put something real behind the word.\n\nOurs is OMRI Listed, 65 percent organic carbon, granulated to blend uniformly. Made in Louisiana with our own mill behind the supply.\n\nWant a free sample to run in a batch? Just need a ship to address.\n\n{Me}\nAmerican BioCarbon\n{phone}" },
    ],
    followups:[
      { t:"Follow up 1, day 3",
        b:"Hi {First},\n\nQuick nudge. Uniform granulation, 65 percent organic carbon, and a bagged mix that does not go hydrophobic on the shelf.\n\nSend a ship to address and I will get a free sample out this week.\n\n{Me}\n{phone}" },
      { t:"Follow up 2, day 7",
        b:"Hi {First},\n\nAre you the one who evaluates new blend inputs, or should I be talking to someone in production? Happy to go where it is useful.\n\n{Me}\n{phone}" },
      { t:"Breakup, day 12",
        b:"Hi {First},\n\nI will pause here. When a premium line or a moisture complaint puts biochar back on the table, we have real supply behind us and the sample is still free.\n\n{Me}\n{phone}" },
    ],
    phone:{
      opener:"Hi {First}, {Me} with American BioCarbon. We supply biochar as a blend input, and the reason blenders take it is granulation. It mixes in like black sand, brings 65 percent organic carbon, and keeps a bagged mix from drying out on the pallet. Are you the one who decides on inputs?",
      voicemail:"Hi {First}, {Me} with American BioCarbon. Biochar as a blend input, uniform granulation and 65 percent organic carbon. I want to mail you a free sample for a trial batch. {phone}. Thanks.",
    },
    objections:[
      { o:"We already have a carbon source",
        b:"Fine. Run ours in one batch next to it. What blenders usually notice first is the granulation and how the bag holds moisture after it sits. If it does not stand out, no harm." },
      { o:"Our formula is locked",
        b:"Understood, I am not asking you to reformulate. Take the free sample and keep it for the next time you spec a premium line. That is the whole ask." },
    ],
  },

  /* -------------------------------------------------- RANCHERS */
  {
    id:"ranch", short:"Ranchers", tag:"BC.RANCH",
    name:"Ranchers, Livestock and Poultry",
    who:"Cattle ranchers, livestock operations, poultry and chicken houses. They share one shape: manure they have to do something with and ground they have to keep productive.",
    titles:["Owner","Ranch Manager","Herd Manager","Farm Manager","Operations Manager"],
    pains:[
      "Manure piling up with nowhere good to put it.",
      "Compact clay ground, common across north Louisiana, that roots cannot move through.",
      "Fertilizer and nutrients washing off after a rain.",
      "Hay and alfalfa yield on the ground they already have.",
      "Water. Same as everyone else this season.",
    ],
    mechanism:"Victor: a lot of these operations already compost. They have manure they need to move, so they mix it with bulking agents and spread it on their hay and alfalfa fields to grow the feed that goes back to the cattle. It is cyclical. Biochar goes into that blend. On the ground itself it gives porosity, so in packed clay you actually get root growth, plus inherent NPK, moisture retention and less nutrient leaching. His picture for the leaching pain: you just sprayed fertilizer on your field and then it rained, and there goes 70 percent of your nutrients.",
    proof:[
      "Inherent NPK in the material",
      "Holds roughly 3 times its weight in water",
      "Adds porosity to compacted clay ground",
      "OMRI Listed",
    ],
    guardrail:"Absorbent and soil framing only. No feed claims, no animal health claims, no veterinary claims, including in poultry house bedding conversations.",
    campaign:{
      priority:"P1",
      effort:5,
      companies:["Cattle and cow calf operations","Poultry and broiler houses","Hay and forage producers","Dairy operations","Feedlots"],
      triggers:["Manure management pressure or a nutrient management plan","A dry stretch hurting pasture or hay yield","Compacted clay ground that will not produce","Already composting manure and looking for a bulking agent"],
      disq:["No land application and no composting","Too small to take a meaningful volume","Any conversation drifting toward animal health, which we do not make claims about"],
      offer:"Free half pound sample to work into a manure blend or onto a test section of pasture.",
      cta:"Can I send you a free sample for your next manure blend?",
      cta2:"Want to hear how other operations are blending it?",
      metric:"Field or blend trials started",
      cycle:"One season. Slow, but the reorder is annual once it lands.",
      list:"Inside 500 miles, weighted toward north Louisiana, Mississippi and east Texas clay ground. Larger operations only.",
      persona:{
        cares:"Yield off the ground they already own, and getting rid of manure usefully.",
        fears:"Spending money on something they cannot see working.",
        needs:"A neighbor already doing it, and a number they can hold onto.",
        language:"Pasture, hay ground, manure, spreading, compaction, alfalfa.",
        avoid:"Feed and animal health language. Hard boundary, do not go near it.",
        discovery:["What are you doing with your manure right now?","How is the hay ground holding up this year?","Is the ground packing up on you?","Do you compost it, or spread it raw?"]
      }
    },
    subjects:[
      "Turn your manure pile into a better field input",
      "You fertilized and then it rained",
      "Roots cannot get through packed clay",
      "More out of the same hay ground",
      "Free biochar sample for your next manure blend",
    ],
    variants:[
      { id:"A", angle:"Direct value",
        subject:"Turn your manure pile into a better field input",
        body:"Hi {First},\n\nIf you are already composting manure and putting it back on your hay ground, biochar belongs in that blend. We make it from sugarcane bagasse in White Castle, Louisiana.\n\nIt bulks the pile so it breaks down evenly, holds the nitrogen instead of letting it gas off, and once it goes on the field it holds about 3 times its weight in water and keeps nutrients from washing off after a rain.\n\nHappy to send a free sample. Reply with a ship to address.\n\n{Me}\nAmerican BioCarbon\n{phone}" },
      { id:"B", angle:"Problem led",
        subject:"You fertilized and then it rained",
        body:"Hi {First},\n\nYou spread fertilizer, it rains that night, and most of what you paid for is gone. Same story on packed clay ground where the roots never really get going.\n\nOur biochar helps on both. It holds nutrients and about 3 times its weight in water in the root zone, and it opens up porosity in compacted ground so roots can move. It also works as a bulking agent in your manure compost.\n\nWant a free sample to try on a section? Send me a ship to address.\n\n{Me}\nAmerican BioCarbon\n{phone}" },
      { id:"C", angle:"Short and curious",
        subject:"More out of the same hay ground",
        body:"Hi {First},\n\nQuick one. We make biochar out of sugarcane bagasse down in White Castle.\n\nRanchers mix it with manure and spread it, and it holds water and nutrients in the ground instead of letting them wash off. OMRI Listed.\n\nCan I mail you a free sample to try? Nothing to buy.\n\n{Me}\nAmerican BioCarbon\n{phone}" },
    ],
    followups:[
      { t:"Follow up 1, day 3",
        b:"Hi {First},\n\nBumping this. Short version: mix it with your manure, spread it, hold more water and more nutrients on the ground.\n\nFree sample if you want one, just need a ship to address.\n\n{Me}\n{phone}" },
      { t:"Follow up 2, day 7",
        b:"Hi {First},\n\nAre you the one who handles inputs and amendments out there, or is somebody else running that? Happy to be pointed the right way.\n\n{Me}\n{phone}" },
      { t:"Breakup, day 12",
        b:"Hi {First},\n\nI will leave it here. If nutrient runoff or hard ground ever becomes worth testing something on, the free sample offer stands.\n\n{Me}\n{phone}" },
    ],
    phone:{
      opener:"Hi {First}, {Me} with American BioCarbon out of White Castle. Calling because most operations your size have manure they are already composting and putting back on the hay ground. We make a biochar that goes in that blend and holds the water and nutrients on the field instead of letting them wash off. Are you the one who handles that?",
      voicemail:"Hi {First}, {Me} with American BioCarbon. Biochar for manure blending and pasture ground, holds water and nutrients. I would like to send you a free sample. {phone}. Thanks.",
    },
    objections:[
      { o:"We spread raw manure and it is fine",
        b:"That works, plenty of people do it. All I am suggesting is putting the free sample into one batch and seeing whether the ground holds moisture better through the dry stretch. Costs you nothing." },
      { o:"Money is tight right now",
        b:"Then this is the right call, because the sample is free and there is nothing to buy. Test it and keep us in mind for whenever it makes sense." },
    ],
  },

  /* -------------------------------------------------- ROW CROP FARMS */
  {
    id:"farm", short:"Farms", tag:"BC.FARM",
    name:"Row Crop and Specialty Farms",
    who:"Row crop operations, specialty and permanent crop growers, and larger farms inside the freight radius. Consolidation matters here: four or five operations in the region run 25 or 30 sites between them.",
    titles:["Owner","Farm Manager","Agronomist","Operations Manager","Purchasing"],
    pains:[
      "Drought. Every irrigation pass costs money and there is not enough water to waste.",
      "Fertilizer leaching straight past the root zone after a rain.",
      "Yield on ground that is already at its ceiling with current inputs.",
      "Input cost per acre that keeps climbing.",
    ],
    mechanism:"Jesse framed the timing on the call: there is a severe drought across the southeast right now and biochar is directly useful for stretching the water a grower already has. He also flagged the expiration date on that hook. If a wet winter shows up, lead with nutrient retention and input cost instead of water.",
    proof:[
      "Holds roughly 3 times its weight in water",
      "Inherent NPK plus 65 percent organic carbon",
      "Reduces nutrient leaching out of the root zone",
      "OMRI Listed",
    ],
    guardrail:"No yield percentage claims. Water holding, nutrient retention and organic carbon are the claims we can stand behind.",
    campaign:{
      priority:"P2",
      effort:4,
      companies:["Row crop farms","Specialty and permanent crop growers","Farming operations running multiple sections","Family operations at scale"],
      triggers:["Drought conditions in their county","A fertilizer price spike","A field that will not hold water or nutrients","Coming off a bad yield year"],
      disq:["Acreage too small for a meaningful order","Locked into a cooperative program with no room to test","Outside the radius"],
      offer:"Free half pound sample for a test strip, with an application note.",
      cta:"Can I send a free sample for a test strip?",
      cta2:"Want the application note first?",
      metric:"Test strips placed",
      cycle:"One season, and the decision only comes after harvest.",
      list:"Inside 500 miles. Lowest biochar weighting on purpose: the cycle is a full season and the per account volume is smaller. Run it, but do not let it eat the week.",
      persona:{
        cares:"Yield per acre and input cost per acre. Very little else.",
        fears:"Another input salesman with a story and no data.",
        needs:"A local test strip, ideally on ground like theirs.",
        language:"Acres, application rate, cost per acre, yield, irrigation pass.",
        avoid:"Long explanations. Get to the number.",
        discovery:["How dry has it been on your ground this year?","What are you spending per acre on fertilizer?","How much do you lose after a heavy rain?","Would you run a test strip if it cost you nothing?"]
      }
    },
    subjects:[
      "Dry crops this time of year?",
      "Keep the fertilizer you already paid for",
      "Get more out of every irrigation pass",
      "Free biochar sample, no cost and no obligation",
      "A soil amendment made four hours from your gate",
    ],
    variants:[
      { id:"A", angle:"Direct value",
        subject:"Get more out of every irrigation pass",
        body:"Hi {First},\n\nWe make a sugarcane bagasse biochar in White Castle, Louisiana. Growers work it in for one reason above the rest: it holds about 3 times its weight in water, so the root zone stays wet longer between passes.\n\nSame structure holds nutrients, so less of what you apply washes past the roots after a rain. It carries 65 percent organic carbon and inherent NPK on its own.\n\nCan I send a free sample to try on a test strip? Reply with a ship to address.\n\n{Me}\nAmerican BioCarbon\n{phone}" },
      { id:"B", angle:"Problem led",
        subject:"Keep the fertilizer you already paid for",
        body:"Hi {First},\n\nThe frustrating version of this season: you put fertilizer down, weather does what it does, and a big share of it is gone before the crop ever sees it. Then you are irrigating on top of that.\n\nOur biochar addresses both. It holds roughly 3 times its weight in water and keeps nutrients in the root zone instead of letting them leach past it. OMRI Listed, made in Louisiana.\n\nWant a free sample for a test strip? Send me a ship to address and it goes out this week.\n\n{Me}\nAmerican BioCarbon\n{phone}" },
      { id:"C", angle:"Short and curious",
        subject:"Dry crops this time of year?",
        body:"Hi {First},\n\nShort note. We make biochar from sugarcane bagasse a few hours from you in White Castle.\n\nIt holds about 3 times its weight in water and keeps nutrients in the root zone. Dry as it has been, that is worth a look.\n\nFree sample if you want one. Just reply with a ship to address.\n\n{Me}\nAmerican BioCarbon\n{phone}" },
    ],
    followups:[
      { t:"Follow up 1, day 3",
        b:"Hi {First},\n\nCircling back once. Holds water in the root zone, holds nutrients through a rain, 65 percent organic carbon. Made locally.\n\nFree sample is yours if you send a ship to address.\n\n{Me}\n{phone}" },
      { t:"Follow up 2, day 7",
        b:"Hi {First},\n\nAre you the one making the call on soil amendments, or does your agronomist own that? Happy to send this to whoever it is useful for.\n\n{Me}\n{phone}" },
      { t:"Breakup, day 12",
        b:"Hi {First},\n\nI will stop here. If water cost or nutrient loss ever gets bad enough to trial something, we are four hours away with product on the ground.\n\n{Me}\n{phone}" },
    ],
    phone:{
      opener:"Hi {First}, {Me} with American BioCarbon in White Castle. Quick reason for the call. We make a biochar that holds about 3 times its weight in water and keeps nutrients in the root zone, which matters a lot in a season this dry. Are you the one who decides on amendments?",
      voicemail:"Hi {First}, {Me} with American BioCarbon. Biochar that holds water and nutrients in the root zone. I would like to mail you a free sample for a test strip. {phone}. Thanks.",
    },
    objections:[
      { o:"I have never used biochar",
        b:"Most people I call have not. That is exactly why the sample is free. Put it on a test strip, watch how it waters against the rest of the field, and decide from there." },
      { o:"How much per acre",
        b:"Depends on the ground and what you are trying to fix, and I would rather not guess at it on a cold call. Run the free sample first, then we can size it honestly." },
    ],
  },

  /* -------------------------------------------------- AG DISTRIBUTORS */
  {
    id:"dist", short:"Distributors", tag:"BC.DIST",
    name:"Ag Distributors and Landscape Supply",
    who:"Ag input distributors, farm supply chains, landscape supply yards and garden center groups. Channel accounts, not end users. One of these is worth 50 direct growers.",
    titles:["Owner","Category Manager","Purchasing Manager","Branch Manager","Product Manager"],
    pains:[
      "They need a differentiated SKU their competitors do not carry.",
      "They will not stock something that does not pull through.",
      "Margin has to work at the branch level.",
      "Supply reliability. Nobody stocks a product that runs out.",
    ],
    mechanism:"Jesse on the call, reworking a weak AI line into a good one: the first half of the sentence is the whole thing. We produce a biochar soil line with real supply behind it, our own sugar mill, and distributor margin. Proof, who you are and what you do, in one sentence, and the ambiguity is gone. He also liked the scarcity frame: we are looking for three distributors to work with, rather than blasting everyone.",
    proof:[
      "We produce it ourselves at our own mill in White Castle, so supply is real",
      "OMRI Listed and independently lab tested",
      "80 metric tons finished and on the ground right now",
      "Puro.earth certified carbon removal behind the story",
    ],
    guardrail:"Do not quote a specific distributor margin number in a cold email. Offer the margin conversation, then run the real numbers with Victor.",
    campaign:{
      priority:"P0",
      effort:14,
      companies:["Ag input distributors","Farm supply chains and cooperatives","Landscape supply yards","Garden center groups","Regional wholesale distributors"],
      triggers:["Building out an organic or regenerative line","Growers asking for something they do not stock","Losing shelf differentiation to a competitor","Annual line review or buying season"],
      disq:["Pure price broker with no shelf and no reps","Already carries a competing biochar under contract","No branch coverage inside the freight radius"],
      offer:"Free sample plus a distributor conversation. A stocking pilot first, never a pallet on the first call.",
      cta:"Can I send a free sample and walk you through the terms?",
      cta2:"Want to see the margin structure first?",
      metric:"Distributor conversations opened, then stocking pilots agreed",
      cycle:"6 to 16 weeks. The longest cycle in the biochar set and the highest payoff.",
      list:"Inside 500 miles. Highest effort weighting of any ICP, because one distributor relationship reaches more acres than any volume of direct grower email.",
      persona:{
        cares:"Pull through, margin, and whether supply holds.",
        fears:"Dead inventory on the shelf and a supplier who runs out.",
        needs:"Proof that growers want it and that we can actually produce it.",
        language:"SKU, line review, margin, pull through, branches, stocking.",
        avoid:"Leading with product science. Lead with supply and margin.",
        discovery:["Who evaluates new products for your branches?","Are your growers asking about water efficiency or carbon yet?","What does your organic line look like today?","What would a stocking pilot look like on your end?"]
      }
    },
    subjects:[
      "We produce biochar with real supply behind it",
      "A differentiated soil line for your branches",
      "Distributor margin on an OMRI Listed biochar",
      "Looking for three distributors in the Gulf South",
      "Free sample plus the distributor terms",
    ],
    variants:[
      { id:"A", angle:"Direct value",
        subject:"We produce biochar with real supply behind it",
        body:"Hi {First},\n\nWe produce a biochar soil line at our own mill in White Castle, Louisiana, which means the supply is ours and not brokered. It is OMRI Listed, independently lab tested, and we have 80 metric tons finished on the ground today.\n\nDistributors carry it as a differentiated line with margin that works at the branch, and growers are already asking for the water and carbon story behind it.\n\nHappy to send a free sample and walk through distributor terms. What is the best ship to address?\n\n{Me}\nAmerican BioCarbon\n{phone}" },
      { id:"B", angle:"Problem led",
        subject:"A differentiated soil line for your branches",
        body:"Hi {First},\n\nThe hard part with a new SKU is not the margin, it is whether it pulls through and whether supply holds.\n\nOn pull through: growers in your region are asking about water efficiency and carbon, and this is an OMRI Listed biochar that answers both. On supply: we make it ourselves at our mill in White Castle and we have 80 metric tons finished right now.\n\nI would start you with a free sample and a stocking conversation, not a pallet. Reply with a ship to address and I will get it moving.\n\n{Me}\nAmerican BioCarbon\n{phone}" },
      { id:"C", angle:"Short and curious",
        subject:"Looking for three distributors in the Gulf South",
        body:"Hi {First},\n\nWe are picking three distributors to carry our biochar line this season and {Company} came up.\n\nOMRI Listed, produced at our own mill in Louisiana, 80 metric tons finished today.\n\nWorth a free sample and a look at the terms? Just send me a ship to address.\n\n{Me}\nAmerican BioCarbon\n{phone}" },
    ],
    followups:[
      { t:"Follow up 1, day 3",
        b:"Hi {First},\n\nFollowing up once. Our own mill, our own supply, OMRI Listed, and a line your competitors are not carrying.\n\nHappy to send a free sample and the terms. Ship to address is all I need.\n\n{Me}\n{phone}" },
      { t:"Follow up 2, day 7",
        b:"Hi {First},\n\nAre you the one who evaluates new products for the branches, or should I be talking to a category manager? Point me the right way and I will stop bothering you.\n\n{Me}\n{phone}" },
      { t:"Breakup, day 12",
        b:"Hi {First},\n\nI will park this. When a biochar or regenerative line moves up your priority list, the terms and the sample are ready to go.\n\n{Me}\n{phone}" },
    ],
    phone:{
      opener:"Hi {First}, {Me} with American BioCarbon. We produce a biochar soil line at our own mill in Louisiana and we are talking to distributors about carrying it. OMRI Listed, 80 metric tons finished on the ground. Are you the person who evaluates new products for your branches?",
      voicemail:"Hi {First}, {Me} with American BioCarbon. We produce an OMRI Listed biochar line at our own mill and we are picking distributors. I would like to send a free sample and the terms. {phone}. Thanks.",
    },
    objections:[
      { o:"We do not carry biochar",
        b:"That is part of why I called. Nobody in your channel does yet, and growers are starting to ask. Take a free sample and let me show you the terms before somebody else in your market carries it." },
      { o:"Who else carries you",
        b:"We are early and I am not going to pretend otherwise. That is the reason the terms are good right now and the reason we are only picking three. Want to see the numbers?" },
    ],
  },

  ],
},

/* ============================================================
   TRACK 2 - ABSORBENT
   Nationwide. Bigger addressable market than biochar by a wide
   margin, and every one of these buyers is already buying an
   absorbent from somebody.
   ============================================================ */
{
  key:"absorbent",
  name:"Absorbent",
  sub:"Nationwide track. Pellets and crumble, both sold by the metric ton.",
  product:"Absorbent pellets and crumble made from sugarcane bagasse. Absorbs up to 5 times its weight in liquid, against roughly 2.5 times for wood pellets. Lighter to handle and lighter to dispose of than clay.",
  geo:"Nationwide, FOB White Castle. The buyer covers freight, which is what opens the whole country up. Victor: if they need it and they are willing to pay the freight, that is fine with us.",
  price:"$275 per metric ton",
  inventory:"Pellets and crumble, both sellable by the metric ton today",
  sample:"1 lb pellets or 1 lb crumble, 4 to 7 business days",
  why:"Jesse on the call: this is a lead generation campaign as much as a product campaign. Eight times out of ten a reply comes back with a phone number, and those numbers are what the power dialer runs on.",

  icps:[

  /* -------------------------------------------------- OIL AND GAS */
  {
    id:"og", short:"Oil and Gas", tag:"AB.OG",
    name:"Oil and Gas Field Services",
    who:"Oilfield service companies, well site operators, tank and pad crews. Often small independents where the owner is the one buying.",
    titles:["Owner","General Manager","Procurement Manager","Site Manager","Project Coordinator","HSE Manager"],
    pains:[
      "Crews are still running 250 pound bags of clay litter out of the back of a pickup.",
      "Disposal is priced by weight, and saturated clay is heavy.",
      "Material volume per event. More bags means more handling and more haul off.",
      "Nobody wants to think about absorbent until there is a spill, and then it has to already be on the truck.",
    ],
    mechanism:"Victor confirmed the clay reality on the call: plenty of these crews keep 250 pound bags of clay litter ready in case something spills. It is primitive but it gets the job done. Our pitch is a straight swap that soaks more per pound, so fewer bags go out and less weight comes back. Jesse and Victor also agreed to keep sustainability and ESG language off this segment. These sites are hundreds of miles from anything and oversight is thin, so it reads as filler.",
    proof:[
      "Up to 5 times its weight in liquid",
      "Roughly 2 times what a wood pellet absorbent does",
      "Made from sugarcane bagasse, so it is lighter to handle than clay",
      "Ships nationwide FOB White Castle",
    ],
    guardrail:"Leave ESG and sustainability out of this one. Lead with material count and disposal weight. Also specify that absorption applies to non viscous liquids rather than claiming it absorbs anything.",
    campaign:{
      priority:"P0",
      effort:10,
      companies:["Oilfield service companies","Well site and production operators","Tank cleaning and vacuum truck operators","Completion and workover crews","Independent field service outfits"],
      triggers:["A spill or release that just cost them money","A disposal cost review","A new site or pad coming online","A safety audit or a client requirement on spill readiness"],
      disq:["Office only with no field crews","Already manufactures a proprietary absorbent blend","Pure broker with no operations"],
      offer:"Free 1 lb pellet sample to run head to head against their current material on a real job.",
      cta:"Can I send your crew a free sample to test against what they use now?",
      cta2:"Reply and I will send the time lapse of the absorption test.",
      metric:"Samples on trucks, and phone numbers captured",
      cycle:"2 to 6 weeks. They test it on the next event, whenever that lands.",
      list:"Nationwide. Texas, Louisiana, Oklahoma, New Mexico, and the Appalachian and Permian basins first. Titles matter more than company size: many are small independents where the owner does the buying.",
      persona:{
        cares:"Getting the site clean, getting back to work, and what disposal costs.",
        fears:"A product that fails when it matters, in front of a client.",
        needs:"To hold it and pour water on it. That is the whole evaluation.",
        language:"Pads, tanks, spill, disposal, roll off, bags, sorbent.",
        avoid:"ESG and sustainability language. Victor and Jesse both flagged it as filler for this buyer.",
        discovery:["What are your crews using on spills right now?","What are you paying to dispose of saturated material?","Who decides what goes on the truck?","How often are you dealing with a release?"]
      }
    },
    subjects:[
      "New absorbent that soaks up five times its weight",
      "Still using clay litter on your pads?",
      "Our absorbent runs 5 to 1. Does yours?",
      "Lighter disposal on every spill event",
      "Are you the one who picks the absorbent your crews run?",
    ],
    variants:[
      { id:"A", angle:"Direct value",
        subject:"New absorbent that soaks up five times its weight",
        body:"Hi {First},\n\nWe make an absorbent out of sugarcane bagasse that soaks up to 5 times its weight in liquid. Wood pellets run about half that and clay is heavier than both.\n\nFor spill, tank and pad work that means fewer bags out to the job and less weight going to disposal on every event.\n\nCan I send your crew a free sample to test against what they run now? Just reply with a ship to address.\n\n{Me}\nAmerican BioCarbon\n{phone}" },
      { id:"B", angle:"Problem led",
        subject:"Still using clay litter on your pads?",
        body:"Hi {First},\n\nA lot of crews still keep 250 pound bags of clay in the truck for spills. It works, but you pay for it twice: once to haul it out and again to dispose of it wet.\n\nOurs is made from sugarcane bagasse and soaks up to 5 times its weight, so you use less material and send less weight to disposal.\n\nWorth putting a free sample on the truck and trying it on the next one? Send me a ship to address.\n\n{Me}\nAmerican BioCarbon\n{phone}" },
      { id:"C", angle:"Short and curious",
        subject:"Our absorbent runs 5 to 1. Does yours?",
        body:"Hi {First},\n\nOne question, then I am done.\n\nOur absorbent soaks up to 5 times its weight. Most wood pellets do about half that. If you reply I will send a short time lapse of the test and a free sample for your crew.\n\n{Me}\nAmerican BioCarbon\n{phone}" },
    ],
    followups:[
      { t:"Follow up 1, day 3",
        b:"Hi {First},\n\nBumping this. Bagasse absorbent, up to 5 times its weight, fewer bags and lighter disposal.\n\nReply and I will send the time lapse video and put a free sample in the mail.\n\n{Me}\n{phone}" },
      { t:"Follow up 2, day 7",
        b:"Hi {First},\n\nAre you the one who picks the absorbent your crews run on spills and pads, or is that someone at the yard? Just want to get a free sample into the right hands.\n\n{Me}\n{phone}" },
      { t:"Breakup, day 12",
        b:"Hi {First},\n\nI will stop reaching out. If absorbent cost or disposal weight ever comes up, we ship nationwide and the sample is still free.\n\n{Me}\n{phone}" },
    ],
    phone:{
      opener:"Hi {First}, {Me} with American BioCarbon, I will be quick. We make an absorbent out of sugarcane that soaks up to 5 times its weight, so crews doing spill and tank work use less material and pay less on disposal weight than clay. Are you the right person for absorbent sourcing?",
      voicemail:"Hi {First}, {Me} with American BioCarbon. Sugarcane absorbent, soaks up to 5 times its weight. I want to mail you a free sample to test against what you use now. {phone}. Thanks.",
    },
    objections:[
      { o:"We already have an absorbent",
        b:"Good, I am not asking you to switch. Run our free sample head to head on one job. If it does not beat what you have, throw it out." },
      { o:"Email me some information",
        b:"I can, but information does not soak up a spill. Let me send the sample with the spec so your crew can actually test it. What is the best ship to address?" },
      { o:"No budget",
        b:"No budget needed, the sample is free and there is nothing to buy. It just puts us on your radar next time absorbent comes up." },
    ],
  },

  /* -------------------------------------------------- SPILL RESPONSE */
  {
    id:"env", short:"Spill Response", tag:"AB.ENV",
    name:"Spill Response and Environmental Remediation",
    who:"Emergency spill response contractors, environmental remediation firms, industrial cleaning companies. These were the strongest matches in the roster search.",
    titles:["Owner","Operations Manager","Field Supervisor","Procurement","HSE or Compliance Manager"],
    pains:[
      "Absorbent cost and disposal weight quietly eat job margin.",
      "Callouts are unpredictable, so material has to already be staged.",
      "Every pound of saturated material is a pound they pay to move and destroy.",
      "Clients increasingly ask what the material is and where it came from.",
    ],
    mechanism:"On a callout the crew is billing the job, not shopping. Whatever is on the truck is what gets used. So the whole play is to get a sample onto the shelf before the next callout, which is why the ask is framed as readiness rather than as a purchase.",
    proof:[
      "Up to 5 times its weight in liquid",
      "Roughly 2 times what a wood pellet absorbent does",
      "Made from sugarcane bagasse rather than mined clay",
      "Ships nationwide",
    ],
    guardrail:"Absorption applies to non viscous liquids. Do not imply chemical compatibility with everything, and do not make a disposal classification claim.",
    campaign:{
      priority:"P0",
      effort:7,
      companies:["Emergency spill response contractors","Environmental remediation firms","Industrial cleaning companies","Hazmat and tank services","Marine and shoreline response"],
      triggers:["A callout that ran long on material","A client contract specifying spill readiness","Restocking the response trailer","A cost review on a fixed price job"],
      disq:["Consulting only, with no field crews","Material supplied by the client on every job","No purchasing authority anywhere in reach"],
      offer:"Free 1 lb sample staged on the shelf so it is already there for the next callout.",
      cta:"Can I mail a free sample for the next callout?",
      cta2:"Reply and I will send the absorption video.",
      metric:"Samples staged and phone numbers captured",
      cycle:"Unpredictable. They test it when the phone rings, so the job is to be on the shelf first.",
      list:"Nationwide. Environmental services and remediation, 10 employees and up. This was the strongest matching category in the roster search, so the list quality is already proven.",
      persona:{
        cares:"Job margin and crew speed.",
        fears:"Running out of material in the middle of a job.",
        needs:"Something that works on the first callout, and availability.",
        language:"Callout, job, response, saturation, drums, manifest.",
        avoid:"Anything that adds a decision. Make it one yes.",
        discovery:["What do you stage on the response trailer today?","How much of a job cost is absorbent and disposal?","Who restocks the trailers?","Would you run ours side by side on one callout?"]
      }
    },
    subjects:[
      "Absorbent cost is eating your job margin",
      "5 to 1 absorbent for your next callout",
      "Fewer bags per spill, lighter haul out",
      "Want a sample on the shelf before the next callout?",
      "Reply and we will send the absorption video",
    ],
    variants:[
      { id:"A", angle:"Direct value",
        subject:"Fewer bags per spill, lighter haul out",
        body:"Hi {First},\n\nWe make an absorbent from sugarcane bagasse that soaks up to 5 times its weight in liquid, roughly double a wood pellet.\n\nOn a callout that shows up as two things: fewer bags to cover the same spill, and less saturated weight going to disposal. Both come straight off the job cost.\n\nCan I mail your crew a free sample to run head to head on the next one? Reply with a ship to address.\n\n{Me}\nAmerican BioCarbon\n{phone}" },
      { id:"B", angle:"Problem led",
        subject:"Want a sample on the shelf before the next callout?",
        body:"Hi {First},\n\nWhen the call comes in, nobody is evaluating absorbent. Whatever is on the truck is what gets used.\n\nSo the ask is simple. Let me put a free sample of our bagasse absorbent on your shelf now, so the next time you are out there you can run it against your normal material. It soaks up to 5 times its weight, about double what wood pellets do.\n\nSend me a ship to address and it goes out this week.\n\n{Me}\nAmerican BioCarbon\n{phone}" },
      { id:"C", angle:"Short and curious",
        subject:"Reply and we will send the absorption video",
        body:"Hi {First},\n\nWe make a sugarcane based absorbent that soaks up to 5 times its weight.\n\nReply to this and I will send you the time lapse of it on the scale, plus a free sample for your crew.\n\n{Me}\nAmerican BioCarbon\n{phone}" },
    ],
    followups:[
      { t:"Follow up 1, day 3",
        b:"Hi {First},\n\nQuick bump. Up to 5 times its weight, so fewer bags and lighter disposal on a callout.\n\nReply and the video and a free sample both go out.\n\n{Me}\n{phone}" },
      { t:"Follow up 2, day 7",
        b:"Hi {First},\n\nWho handles field supplies and absorbent purchasing for your crews? I just want to get a free sample to the right person.\n\n{Me}\n{phone}" },
      { t:"Breakup, day 12",
        b:"Hi {First},\n\nClosing this out. If absorbent ever comes up for review, we ship nationwide and the offer to test a free sample stands.\n\n{Me}\n{phone}" },
    ],
    phone:{
      opener:"Hi {First}, {Me} with American BioCarbon. On callouts, absorbent cost and disposal weight quietly take a bite out of job margin. Ours is made from sugarcane and soaks up to 5 times its weight. Can I send a free sample for your crew to test on the next job?",
      voicemail:"Hi {First}, {Me} with American BioCarbon. Sugarcane absorbent, up to 5 times its weight, lighter disposal than clay. I would like to mail a free sample for your crew. {phone}. Thanks.",
    },
    objections:[
      { o:"Our client specifies the material",
        b:"Understood. Then take the sample anyway and keep it, because the next time a client asks for something lighter or plant based you will already have run it." },
      { o:"We buy through a distributor",
        b:"That is fine, we can work through them. First step is the same though. Let me get a free sample in your hands so you know whether it is worth asking for." },
    ],
  },

  /* -------------------------------------------------- HDD */
  {
    id:"hdd", short:"HDD and Boring", tag:"AB.HDD",
    name:"Horizontal Directional Drilling and Utility Boring",
    who:"HDD contractors, utility boring crews, sewer and utility line installers, and the supply houses that serve them. Named on the call as a live high volume opportunity.",
    titles:["Owner","General Manager","Operations Manager","Yard Manager","Project Coordinator","Purchasing"],
    pains:[
      "Bore returns and drilling slurry have to be solidified before anything can haul them.",
      "Disposal is by weight and volume, so a wet load is an expensive load.",
      "Volume is enormous and steady. This is not a one time purchase.",
      "Jobs move, so material has to be easy to stage and easy to handle.",
    ],
    mechanism:"Victor brought this in from a live conversation on the call. The owner of an HDD supply operation projected 8 to 10 loads a month conservatively for a single customer, and said they had done 30 loads a month for that customer the prior year. These crews bore tunnels for sewage lines and utilities, and everything that comes back out is aqueous waste that needs absorbent to move. This is the highest volume shape in the absorbent track.",
    proof:[
      "Up to 5 times its weight in liquid",
      "Lighter per unit of liquid captured than clay",
      "Available by the metric ton, nationwide",
      "Made at our own mill, so volume supply is real",
    ],
    guardrail:"Do not make a disposal classification or regulatory claim. We solidify liquid, we do not certify what the resulting waste is.",
    campaign:{
      priority:"P0",
      effort:7,
      companies:["Horizontal directional drilling contractors","Utility boring and trenchless crews","Sewer and water line installers","Telecom and fiber installation contractors","HDD supply houses and distributors"],
      triggers:["A steady bore schedule with recurring disposal","A disposal facility rejecting loads for being too wet","Adding crews or rigs","A supply house looking for a better solidifier to resell"],
      disq:["No spoil handling because a subcontractor takes it","Occasional work with no recurring volume"],
      offer:"Free 1 lb sample to run on a real load of bore returns, then volume pricing by the metric ton if it works.",
      cta:"Can I send a free sample to test on a load?",
      cta2:"Tell me roughly how many loads a month and I will come back with real numbers.",
      metric:"Samples tested on live loads, then monthly volume quoted",
      cycle:"2 to 8 weeks, and it turns recurring fast once it lands.",
      list:"Nationwide. Named on the Aug 10 call as the highest volume shape in the absorbent track: one owner projected 8 to 10 loads a month conservatively and had run 30 loads a month for a single customer the year before. Target the supply houses too, since Victor noted suppliers are open to carrying whoever, unlike large firms with proprietary blends.",
      persona:{
        cares:"Keeping the crew boring and getting spoil off the site.",
        fears:"A load getting turned away at the disposal gate.",
        needs:"Something that firms a load up fast, with less product.",
        language:"Bore, returns, spoil, slurry, solidify, loads, roll off.",
        avoid:"Treating it like a spill product. This is a volume consumable.",
        discovery:["What are you mixing into your returns today?","How many loads a month are you moving?","Has a load ever been turned away for being too wet?","Who buys that material for you?"]
      }
    },
    subjects:[
      "Solidify bore returns with less material",
      "What are you using to dry up drilling slurry?",
      "8 to 10 loads a month? We can supply that",
      "Lighter haul off on every bore",
      "Free sample of a 5 to 1 absorbent for slurry",
    ],
    variants:[
      { id:"A", angle:"Direct value",
        subject:"Solidify bore returns with less material",
        body:"Hi {First},\n\nWe make an absorbent from sugarcane bagasse that takes up to 5 times its weight in liquid. Crews use it to solidify bore returns and drilling slurry so a load can actually move.\n\nBecause it soaks more per pound, it takes less material to firm up the same volume, and the load that leaves the site weighs less.\n\nWe supply by the metric ton and ship nationwide. Can I send a free sample to test? Just need a ship to address.\n\n{Me}\nAmerican BioCarbon\n{phone}" },
      { id:"B", angle:"Problem led",
        subject:"What are you using to dry up drilling slurry?",
        body:"Hi {First},\n\nEverything that comes back out of a bore has to be solidified before it goes anywhere, and disposal charges by weight. So whatever you mix in is either helping that number or hurting it.\n\nOurs is a bagasse absorbent that takes up to 5 times its weight, roughly double a wood pellet. Less material per load, less weight leaving the site.\n\nHappy to send a free sample so your crew can run it on a real load. What is a good ship to address?\n\n{Me}\nAmerican BioCarbon\n{phone}" },
      { id:"C", angle:"Short and curious",
        subject:"8 to 10 loads a month? We can supply that",
        body:"Hi {First},\n\nIf you are moving that kind of volume on bore returns, worth 20 seconds.\n\nWe make a sugarcane absorbent that takes up to 5 times its weight and we sell it by the metric ton nationwide.\n\nReply and I will send the absorption video and a free sample.\n\n{Me}\nAmerican BioCarbon\n{phone}" },
    ],
    followups:[
      { t:"Follow up 1, day 3",
        b:"Hi {First},\n\nBumping this once. Up to 5 times its weight, so less material to solidify a load and less weight going out.\n\nReply and I will send the video and a free sample.\n\n{Me}\n{phone}" },
      { t:"Follow up 2, day 7",
        b:"Hi {First},\n\nWho sources the absorbent and solidifier for your crews? Happy to take this to them directly.\n\n{Me}\n{phone}" },
      { t:"Breakup, day 12",
        b:"Hi {First},\n\nI will leave it here. If solidifier volume or disposal weight ever gets looked at, we sell by the metric ton and ship anywhere in the country.\n\n{Me}\n{phone}" },
    ],
    phone:{
      opener:"Hi {First}, {Me} with American BioCarbon. Calling about what you are using to solidify bore returns. Ours is a sugarcane absorbent that takes up to 5 times its weight, so it is less material per load and less weight going to disposal. Are you the one sourcing that?",
      voicemail:"Hi {First}, {Me} with American BioCarbon. Absorbent for bore returns and drilling slurry, up to 5 times its weight, sold by the metric ton. I would like to send a free sample. {phone}. Thanks.",
    },
    objections:[
      { o:"We use sawdust or wood pellets",
        b:"That is what most crews use. Ours takes about double the liquid per pound, so the comparison is straightforward. Run the free sample on one load and look at what leaves the site." },
      { o:"Can you handle our volume",
        b:"We sell by the metric ton and we produce it ourselves, so yes. Tell me roughly how many loads a month and I will come back with real numbers." },
    ],
  },

  /* -------------------------------------------------- HEAVY CIVIL */
  {
    id:"civil", short:"Heavy Civil", tag:"AB.CIVIL",
    name:"Heavy Civil, Dredging and Slurry Work",
    who:"Heavy civil contractors, dredging operations, slurry wall and foundation crews, and site work contractors handling wet spoil.",
    titles:["Owner","Project Manager","Superintendent","Purchasing Manager","Equipment or Yard Manager"],
    pains:[
      "Wet spoil and dredge material cannot be hauled until it is dried out.",
      "Dewatering is a line item on every job and it is priced by tonnage moved.",
      "Site space is limited, so material staging matters.",
      "Schedule pressure. A load that cannot move holds up the whole sequence.",
    ],
    mechanism:"Victor put it plainly on the call: everybody does construction, everybody dredges, everybody does slurry walls. This is the widest and least worked part of the absorbent market, and every one of these contractors is already buying something to dry material out.",
    proof:[
      "Up to 5 times its weight in liquid",
      "Less material to solidify the same volume",
      "Sold by the metric ton, shipped nationwide",
      "Made from sugarcane bagasse rather than mined clay",
    ],
    guardrail:"No claims about geotechnical performance or about meeting a disposal spec. We absorb liquid, that is the claim.",
    campaign:{
      priority:"P1",
      effort:4,
      companies:["Heavy civil and site work contractors","Dredging operations","Slurry wall and deep foundation contractors","Marine construction","Demolition and excavation handling wet spoil"],
      triggers:["A job with a dewatering line item","Disposal tonnage running over budget","A wet season slowing the schedule","A new project mobilizing nearby"],
      disq:["Dry work only","Dewatering handled entirely by a specialty subcontractor","No repeat volume"],
      offer:"Free 1 lb sample for the next dewatering job, with volume pricing by the metric ton.",
      cta:"Can I send a free sample for your next dewatering job?",
      cta2:"Want the spec and a price by the ton?",
      metric:"Samples tested on a job",
      cycle:"Project driven. Follow the job schedule, not the calendar.",
      list:"Nationwide. Victor on the call: everybody does construction, everybody dredges, everybody does slurry walls. This is the widest and least worked slice of the absorbent market, which also makes it the least qualified, so score hard on whether they actually handle wet spoil.",
      persona:{
        cares:"Schedule and tonnage hauled.",
        fears:"Anything that slows the job down.",
        needs:"A number on cost per load, not a product story.",
        language:"Spoil, dewatering, haul off, tonnage, cure, load out.",
        avoid:"Long emails. They are on a site, not at a desk.",
        discovery:["How are you drying material out to get it haulable?","What is disposal costing you per load?","Do you have a wet job coming up?","Who buys consumables for the site?"]
      }
    },
    subjects:[
      "Drying out slurry and dredge spoil",
      "Cut the tonnage you haul off the site",
      "A 5 to 1 absorbent, shipped anywhere in the country",
      "What does dewatering cost you per load?",
      "Free sample for your next dewatering job",
    ],
    variants:[
      { id:"A", angle:"Direct value",
        subject:"Cut the tonnage you haul off the site",
        body:"Hi {First},\n\nWe make an absorbent from sugarcane bagasse that takes up to 5 times its weight in liquid, about double what a wood pellet does.\n\nOn wet spoil, slurry and dredge material that means less product mixed in to get a load haulable, and less total tonnage leaving the site. Both show up on the disposal invoice.\n\nWe sell by the metric ton and ship nationwide. Want a free sample to test on the next one? Reply with a ship to address.\n\n{Me}\nAmerican BioCarbon\n{phone}" },
      { id:"B", angle:"Problem led",
        subject:"What does dewatering cost you per load?",
        body:"Hi {First},\n\nWet material does not move, and everything you mix in to fix that becomes tonnage you pay to haul. So the absorbent you pick quietly sets your disposal cost.\n\nOurs takes up to 5 times its weight, roughly double a wood pellet, so you add less and haul less. Made from sugarcane bagasse in Louisiana, sold by the metric ton, shipped anywhere.\n\nCan I send a free sample for your next dewatering job? Just need a ship to address.\n\n{Me}\nAmerican BioCarbon\n{phone}" },
      { id:"C", angle:"Short and curious",
        subject:"Drying out slurry and dredge spoil",
        body:"Hi {First},\n\nQuick one. Our absorbent takes up to 5 times its weight in liquid, which is about double a wood pellet.\n\nIf you are drying out spoil or slurry to get it haulable, reply and I will send the time lapse plus a free sample.\n\n{Me}\nAmerican BioCarbon\n{phone}" },
    ],
    followups:[
      { t:"Follow up 1, day 3",
        b:"Hi {First},\n\nFloating this back up. Less product to firm up a load, less tonnage off the site.\n\nReply with a ship to address and I will get a free sample out.\n\n{Me}\n{phone}" },
      { t:"Follow up 2, day 7",
        b:"Hi {First},\n\nAre you the right person for site supplies and dewatering material, or should I be talking to the yard? Happy to be redirected.\n\n{Me}\n{phone}" },
      { t:"Breakup, day 12",
        b:"Hi {First},\n\nI will stop here. If disposal tonnage ever becomes worth attacking, we ship nationwide and the sample offer stands.\n\n{Me}\n{phone}" },
    ],
    phone:{
      opener:"Hi {First}, {Me} with American BioCarbon. Calling about dewatering. We make a sugarcane absorbent that takes up to 5 times its weight, so it takes less material to make a load haulable and less tonnage leaves the site. Are you the one sourcing that?",
      voicemail:"Hi {First}, {Me} with American BioCarbon. Absorbent for slurry and dredge spoil, up to 5 times its weight, sold by the metric ton. I would like to send you a free sample. {phone}. Thanks.",
    },
    objections:[
      { o:"We use lime or cement kiln dust",
        b:"Different tool for a different job, and I am not saying replace it everywhere. Where you just need liquid gone rather than chemistry, ours does it with less material. Free sample and you can see for yourself." },
      { o:"Freight will kill it",
        b:"Fair. It ships FOB from Louisiana and you cover freight, so on a distant job the math has to work. That is exactly why I would rather you test a free sample than take my word for it." },
    ],
  },

  /* -------------------------------------------------- LANDFILL */
  {
    id:"landfill", short:"Landfill", tag:"AB.LF",
    name:"Landfill and Leachate Operations",
    who:"Landfill operators, transfer stations and waste companies handling leachate, liquid waste solidification and working face odor.",
    titles:["Landfill Manager","Site Manager","Environmental Manager","Operations Manager","Purchasing"],
    pains:[
      "Liquid waste has to be solidified before it can be placed or hauled.",
      "Everything is priced by weight, so a heavy solidifier is a permanent tax.",
      "Odor complaints at the working face.",
      "Leachate volume swings with the weather and they still have to handle it.",
    ],
    mechanism:"Same physics as the rest of the track, but the buying logic is different. A landfill buys solidifier on a standing basis rather than job by job, so this is a recurring volume account once it lands. Get the sample in, get the comparison run, then talk standing supply.",
    proof:[
      "Up to 5 times its weight in liquid",
      "Less added weight per unit of liquid solidified",
      "Sold by the metric ton on a standing basis",
      "Made from sugarcane bagasse",
    ],
    guardrail:"No paint filter test claim, no regulatory compliance claim, and no odor reduction percentage. Say it helps with moisture and handling.",
    campaign:{
      priority:"P1",
      effort:3,
      companies:["Municipal and private landfills","Transfer stations","Liquid waste treatment facilities","Waste companies operating multiple sites"],
      triggers:["Leachate volume up after a wet stretch","A new liquid waste stream coming in","A solidifier contract up for renewal","Odor complaints at the working face"],
      disq:["No liquid waste acceptance","Locked into a corporate supply agreement with no site level discretion"],
      offer:"Free 1 lb sample to run against their current solidifier, then standing supply by the metric ton if it wins.",
      cta:"Can I send a free sample to run against your current solidifier?",
      cta2:"Tell me your spec and I will tell you honestly whether we clear it.",
      metric:"Samples tested, then standing supply conversations",
      cycle:"6 to 16 weeks. Slow to land, then recurring volume.",
      list:"Nationwide, targeting site level contacts rather than corporate. Corporate accounts usually sit under a standing agreement, so the site manager is the only door that opens.",
      persona:{
        cares:"Tonnage, compliance, and keeping the working face manageable.",
        fears:"A material that fails a test in front of a regulator.",
        needs:"A spec, and a straight answer on what it does and does not do.",
        language:"Leachate, solidification, working face, tonnage, acceptance.",
        avoid:"Overclaiming. This buyer will check.",
        discovery:["What are you using to solidify liquids today?","How much of that is added weight you pay to move?","Is this a site decision or a corporate one?","What spec does it have to clear?"]
      }
    },
    subjects:[
      "Leachate solidification at five times the soak",
      "Cut the weight you are paying to move",
      "Moisture and odor at the working face",
      "A bagasse solidifier, sample is free",
      "Are you the right person for absorbent sourcing?",
    ],
    variants:[
      { id:"A", angle:"Direct value",
        subject:"Cut the weight you are paying to move",
        body:"Hi {First},\n\nWe make a sugarcane bagasse absorbent that takes up to 5 times its weight in liquid, roughly double what a wood pellet does.\n\nFor leachate and liquid waste solidification that means less material added per load and less total weight to place or haul. When everything is priced by the ton, that is the number that matters.\n\nWe supply by the metric ton on a standing basis. Can I send a free sample to run against your current solidifier?\n\n{Me}\nAmerican BioCarbon\n{phone}" },
      { id:"B", angle:"Problem led",
        subject:"Moisture and odor at the working face",
        body:"Hi {First},\n\nTwo things that never stop at a site like yours: liquid that has to be solidified before it moves, and moisture and odor at the working face.\n\nOurs is a bagasse absorbent that takes up to 5 times its weight, so you use less of it and add less weight. It handles clean and it is made from sugarcane rather than mined clay.\n\nHappy to send a free sample to test. What is a good ship to address?\n\n{Me}\nAmerican BioCarbon\n{phone}" },
      { id:"C", angle:"Short and curious",
        subject:"Are you the right person for absorbent sourcing?",
        body:"Hi {First},\n\nQuick question. Are you the one who sources solidifier and absorbent for the site?\n\nWe make one from sugarcane bagasse that takes up to 5 times its weight. I would like to send a free sample so you can run it against what you use now.\n\n{Me}\nAmerican BioCarbon\n{phone}" },
    ],
    followups:[
      { t:"Follow up 1, day 3",
        b:"Hi {First},\n\nBumping this. Up to 5 times its weight means less solidifier added and less weight to move.\n\nReply with a ship to address and a free sample goes out.\n\n{Me}\n{phone}" },
      { t:"Follow up 2, day 7",
        b:"Hi {First},\n\nIf sourcing is not yours, who should I be talking to? I just want a free sample in the right hands.\n\n{Me}\n{phone}" },
      { t:"Breakup, day 12",
        b:"Hi {First},\n\nI will close the loop here. If solidifier comes up for review, we supply by the metric ton on a standing basis and the sample is free.\n\n{Me}\n{phone}" },
    ],
    phone:{
      opener:"Hi {First}, {Me} with American BioCarbon. For leachate and liquid waste solidification we make a sugarcane absorbent that takes up to 5 times its weight, so you add less material and move less weight. Are you the right person to send a spec and a free sample to?",
      voicemail:"Hi {First}, {Me} with American BioCarbon. High absorption bagasse solidifier for leachate, up to 5 times its weight. I would like to send a spec and a free sample. {phone}. Thanks.",
    },
    objections:[
      { o:"We have a standing supplier",
        b:"Most sites do, and I am not asking you to break that. Run our free sample on one load and compare the added weight. If it does not beat theirs, keep them." },
      { o:"It has to pass our spec",
        b:"Understood. Tell me the spec you have to hit and I will tell you honestly whether we clear it before we waste anyone's time. Then the sample makes sense." },
    ],
  },

  /* -------------------------------------------------- MUNICIPAL */
  {
    id:"muni", short:"Municipal", tag:"AB.MUNI",
    name:"Municipal Public Works and Environmental Quality",
    who:"City and county public works departments, environmental quality departments, stormwater and utility divisions, and the contractors who bid their work.",
    titles:["Public Works Director","Environmental Services Manager","Stormwater Coordinator","Procurement or Purchasing Agent","Fleet or Yard Supervisor"],
    pains:[
      "Spill kits and stormwater material have to be stocked and ready across multiple yards.",
      "Sediment socks on construction sites have to keep debris and cement out of the sewer while letting water through.",
      "Procurement runs on bids and approved vendor lists, so the timeline is long.",
      "Budget cycles, not urgency, decide when anything gets bought.",
    ],
    mechanism:"This one came out of an open question on the call and it stays open. Jesse is researching whether municipalities source absorbent in house or hand it to contractors, and Victor is asking Miles how larger county procurement actually works. Daniel's read is that most municipal governments hold the budget and hire vendors through a bid, and that in house crews are the exception. So the first touch here is a qualifying question, not a pitch. Find out who actually buys before spending real effort. Separately, Victor is developing a biochar and crumble sock mix for heavy metal remediation, which is the product that eventually fits this buyer best.",
    proof:[
      "Up to 5 times its weight in liquid",
      "Made in the United States from sugarcane bagasse",
      "Sold by the metric ton, shipped nationwide",
    ],
    guardrail:"Do not claim a heavy metal remediation capability. The sock product is in development and is not something to sell yet. Do not claim any procurement certification or approved vendor status we do not hold.",
    campaign:{
      priority:"P2",
      effort:2,
      companies:["City and county public works departments","Environmental quality and stormwater divisions","Utility districts","Parks and fleet operations","Contractors who bid municipal work"],
      triggers:["The annual budget cycle","A bid or solicitation posted for absorbent or stormwater material","A spill that exposed a gap in the kits","New stormwater requirements on construction sites"],
      disq:["All material supplied by the winning contractor","No vendor registration path open","Requires certifications we do not hold"],
      offer:"Free sample for the yards to evaluate, plus vendor registration wherever there is a path.",
      cta:"Do you buy absorbent directly, or does it come through the contractor?",
      cta2:"Can I send a free sample for the crews to evaluate?",
      metric:"Procurement path identified. This is a research campaign before it is a sales campaign.",
      cycle:"Long. Budget cycles and bids, not weeks.",
      list:"Nationwide but deliberately low volume until the open question is answered. Jesse is researching whether municipalities source in house or through contractors, and Victor is asking Miles how larger county procurement works. Daniel's read is that most municipalities hold the budget and hire vendors through a bid. Do not scale this ICP until that comes back.",
      persona:{
        cares:"Following the process correctly.",
        fears:"A procurement irregularity.",
        needs:"To know we are a registered, legitimate domestic vendor.",
        language:"Bid, solicitation, vendor registration, purchase order, department.",
        avoid:"Urgency and sales pressure. It does not work and it burns the relationship.",
        discovery:["Does the department buy this directly, or through a contractor?","Is there a vendor registration process I should complete?","Who handles purchasing for the yards?","When does this come up in your budget cycle?"]
      }
    },
    subjects:[
      "Who sources absorbent for your public works crews?",
      "Sediment socks that let the water through",
      "A domestic absorbent made from sugarcane",
      "Free sample for your stormwater and spill kits",
      "Do you buy absorbent in house or through a contractor?",
    ],
    variants:[
      { id:"A", angle:"Qualifying question",
        subject:"Do you buy absorbent in house or through a contractor?",
        body:"Hi {First},\n\nGenuinely asking rather than pitching. We manufacture an absorbent in Louisiana and we are trying to understand how departments your size actually source this material, in house or through the contractors who win the work.\n\nIf it is in house, I would like to send you a free sample. If it is through contractors, I would rather learn that than keep emailing you.\n\nEither way I appreciate the steer.\n\n{Me}\nAmerican BioCarbon\n{phone}" },
      { id:"B", angle:"Direct value",
        subject:"A domestic absorbent made from sugarcane",
        body:"Hi {First},\n\nWe manufacture an absorbent in White Castle, Louisiana out of sugarcane bagasse. It takes up to 5 times its weight in liquid, which is roughly double a wood pellet, and it is made domestically.\n\nCrews use it for spill kits, stormwater work and general shop and yard cleanup.\n\nHappy to send a free sample for your yards to evaluate. Just reply with a ship to address.\n\n{Me}\nAmerican BioCarbon\n{phone}" },
      { id:"C", angle:"Short and curious",
        subject:"Free sample for your stormwater and spill kits",
        body:"Hi {First},\n\nShort note. We make an absorbent from sugarcane bagasse that takes up to 5 times its weight. Made in Louisiana.\n\nCan I send a free sample for your crews to evaluate? Nothing to buy and no bid required.\n\n{Me}\nAmerican BioCarbon\n{phone}" },
    ],
    followups:[
      { t:"Follow up 1, day 4",
        b:"Hi {First},\n\nStill trying to figure out the right door here. Does your department buy absorbent directly, or does it come through whoever wins the job?\n\nOne line back is plenty and I will take it from there.\n\n{Me}\n{phone}" },
      { t:"Follow up 2, day 9",
        b:"Hi {First},\n\nIf there is a purchasing agent or a vendor registration process I should go through instead, point me at it and I will do it properly.\n\n{Me}\n{phone}" },
      { t:"Breakup, day 14",
        b:"Hi {First},\n\nI will stop here so I am not clogging your inbox. If absorbent or stormwater material ever goes out for bid, we manufacture domestically and would like the chance to quote.\n\n{Me}\n{phone}" },
    ],
    phone:{
      opener:"Hi {First}, {Me} with American BioCarbon. We manufacture an absorbent in Louisiana and I am honestly just trying to learn how your department sources this, whether it is bought directly or handled by whoever wins the contract. Can you point me the right way?",
      voicemail:"Hi {First}, {Me} with American BioCarbon. We manufacture an absorbent in Louisiana and I am trying to find who handles that sourcing for your department. {phone}. Thanks for any steer.",
    },
    objections:[
      { o:"Everything goes out to bid",
        b:"That is useful to know, thank you. Can you tell me how to get on the vendor list so we are there when it does? And I am happy to send a free sample in the meantime." },
      { o:"Our contractors supply their own",
        b:"Understood, that answers my question. Would you be willing to tell me which contractors handle that work? I will take it to them directly instead of bothering you." },
    ],
  },


  /* -------------------------------------------------- ABSORBENT DISTRIBUTORS */
  {
    id:"abdist", short:"Distributors", tag:"AB.DIST",
    name:"Absorbent Distributors and Safety Supply",
    who:"Industrial safety distributors, environmental and restoration suppliers, and janitorial and sanitation houses that already stock a loose granular absorbent. The shelf slot exists, so the only question is whose product fills it.",
    titles:["Owner","Director of Procurement","Category Manager","Product Manager","Purchasing Manager","Branch Manager"],
    pains:[
      "They already carry a granular absorbent, so switching means displacing an incumbent rather than creating a need.",
      "House brand and private label lines need a supplier who actually manufactures rather than one who brokers.",
      "Freight eats the margin on anything heavy with low value per pound.",
      "Customers are starting to ask for something that is not mined clay.",
    ],
    mechanism:"Victor drew the line that makes this ICP work on the Aug 10 call. Large firms with their own proprietary blend are unlikely to give you the time of day, because the product is already named and trademarked and the supply chain is set. Suppliers are the opposite: they are open to carrying whoever, because they are just supplying it. So this campaign goes at distributors and supply houses, never at a manufacturer with a house formula. It is also the biggest list we have, and the single best positioned account in the entire absorbent file is a distributor with fifteen branches, one of them 23 driving miles from the plant.",
    proof:[
      "Up to 5 times its weight in liquid, roughly double a wood pellet",
      "We manufacture it at our own mill, so private label is a real conversation",
      "Sold by the metric ton in 1,650 lb super sacks",
      "Made in the United States from sugarcane bagasse",
    ],
    guardrail:"Do not promise private label or co branded packaging terms in a cold email. We can produce it, but the terms are a conversation with Victor, not a line in an opener.",
    subjects:[
      "Who supplies your loose granular absorbent?",
      "A 5 to 1 absorbent you could put your own name on",
      "Your absorbent line is missing a plant based option",
      "We manufacture it, we do not broker it",
      "Free sample plus distributor pricing by the ton",
    ],
    variants:[
      { id:"A", angle:"Direct value",
        subject:"Who supplies your loose granular absorbent?",
        body:"Hi {First},\n\nYou already stock a loose granular absorbent, so this is a supply question rather than a new category.\n\nWe manufacture one from sugarcane bagasse at our own mill in White Castle, Louisiana. It takes up to 5 times its weight in liquid, which is roughly double a wood pellet, and we sell it by the metric ton in 1,650 lb super sacks.\n\nCan I send a free sample and our distributor pricing? Just need a ship to address.\n\n{Me}\nAmerican BioCarbon\n{phone}" },
      { id:"B", angle:"Problem led",
        subject:"Your absorbent line is missing a plant based option",
        body:"Hi {First},\n\nMost absorbent lines are clay and wood, and more buyers are asking for something that is not mined.\n\nOurs is made from sugarcane bagasse and takes up to 5 times its weight, so it sits above clay on performance rather than beside it on price. We manufacture it ourselves, which means supply is ours and a house label is a real option.\n\nWorth a free sample and a look at distributor pricing? Reply with a ship to address.\n\n{Me}\nAmerican BioCarbon\n{phone}" },
      { id:"C", angle:"Short and curious",
        subject:"We manufacture it, we do not broker it",
        body:"Hi {First},\n\nQuick one. We make a sugarcane absorbent at our own mill in Louisiana. Up to 5 times its weight, sold by the metric ton.\n\nWorth a free sample and the distributor sheet? Send me a ship to address.\n\n{Me}\nAmerican BioCarbon\n{phone}" },
    ],
    followups:[
      { t:"Follow up 1, day 3",
        b:"Hi {First},\n\nBumping this once. We manufacture a sugarcane absorbent that takes up to 5 times its weight and we sell it by the metric ton to distributors.\n\nHappy to send a free sample and pricing. A ship to address is all I need.\n\n{Me}\n{phone}" },
      { t:"Follow up 2, day 7",
        b:"Hi {First},\n\nAre you the one who evaluates new products for the line, or should I be talking to a category manager? Point me the right way and I will stop filling your inbox.\n\n{Me}\n{phone}" },
      { t:"Breakup, day 12",
        b:"Hi {First},\n\nI will park this. If a plant based absorbent ever comes up for the line, or if you need a manufacturer behind a house label, we are here.\n\n{Me}\n{phone}" },
    ],
    phone:{
      opener:"Hi {First}, {Me} with American BioCarbon. You already carry a loose granular absorbent, so I will keep this to a supply question. We manufacture one from sugarcane at our own mill, up to 5 times its weight, sold by the metric ton. Are you the one who evaluates products for the line?",
      voicemail:"Hi {First}, {Me} with American BioCarbon. We manufacture a sugarcane absorbent and sell it by the metric ton to distributors. I would like to send a free sample and pricing. {phone}. Thanks.",
    },
    objections:[
      { o:"We have a supplier for that",
        b:"Understood, and I am not asking you to drop them. Take a free sample, run it against what you stock, and keep us as a second source. Nobody regrets having a second source on a heavy consumable." },
      { o:"Can you private label it",
        b:"We manufacture it ourselves, so that is a real conversation rather than a maybe. Let me get you a sample first so you know the product is worth putting your name on, then we talk terms." },
    ],
    campaign:{
      priority:"P0", effort:8,
      companies:["Industrial safety distributors","Environmental and restoration suppliers","Janitorial and sanitation supply houses","Oilfield and industrial supply distributors","Private label and house brand absorbent programs"],
      triggers:["A line review or an annual buying cycle","Their current absorbent supplier missing deliveries","Customers asking for a plant based option","Building out a house label"],
      disq:["Manufactures its own proprietary blend, which Victor flagged as unlikely to engage","No shelf and no reps, purely a price broker","Freight distance so long the product cannot carry it"],
      offer:"Free 1 lb sample plus distributor pricing by the metric ton, and a private label conversation if the product earns it.",
      cta:"Can I send a free sample and our distributor pricing?",
      cta2:"Want the spec and the super sack format first?",
      metric:"Distributor conversations opened, then stocking pilots",
      cycle:"4 to 16 weeks. Line reviews set the pace, not us.",
      list:"Nationwide, and the largest single list we hold at 62 companies. Freight distance is the main score driver here rather than fit, because the product is heavy relative to its value. Score hard on drive distance, then work the closest first.",
      persona:{
        cares:"Margin, whether it sells through, and whether supply holds.",
        fears:"Dead stock, and a manufacturer who cannot deliver on a reorder.",
        needs:"Pricing by the ton, the super sack format, and a sample they can hand a customer.",
        language:"Line, SKU, sell through, house label, super sack, landed cost.",
        avoid:"Product science. They are buying supply and margin, not chemistry.",
        discovery:["What loose granular absorbent do you carry today?","Who supplies it, and how is that relationship?","Do you run a house label on any consumables?","What does landed cost need to look like for this to work?"],
      },
    },
  },

  /* -------------------------------------------------- ANIMAL BEDDING */
  {
    id:"bed", short:"Bedding", tag:"AB.BED",
    name:"Animal Bedding and Equine Supply",
    who:"Equine and livestock bedding distributors, feed and farm stores, poultry house suppliers, and stall product brands. This ICP surfaced from the CRM rather than from research: the HubSpot import is full of feed stores, equine supply and poultry complexes that were never on any prospecting list.",
    titles:["Owner","Purchasing Manager","Category Manager","Store Manager","Product Manager","Barn or Facility Manager"],
    pains:[
      "Wood shavings are bulky, dusty and inconsistent in both supply and price.",
      "Ammonia and odor in a barn or a poultry house is a constant complaint.",
      "How much moisture the bedding holds decides how often a stall gets stripped, which is the real labor cost.",
      "Freight on a light bulky product is punishing, so absorbency per pound decides the economics.",
    ],
    mechanism:"Same absorbency story as the industrial line, sold into a completely different aisle. Bagasse takes up to 5 times its weight, so less material handles the same moisture and the interval between change outs stretches. The labor saved stripping stalls is usually a bigger number to the buyer than the price of the bedding itself.",
    proof:[
      "Up to 5 times its weight in liquid",
      "Low dust compared with shavings",
      "Made from sugarcane bagasse at our own mill in Louisiana",
      "Sold by the metric ton in 1,650 lb super sacks",
    ],
    guardrail:"The hardest line in the whole engine, and the easiest to cross by accident. Absorbency and moisture management only. No animal health claim, no feed claim, no respiratory or hoof or ammonia health benefit stated as fact, even if a customer says it first. Anything in that direction needs AFIA and AAFCO review before it goes in writing.",
    subjects:[
      "Bedding that holds five times its weight",
      "Still selling nothing but shavings?",
      "Less bedding per stall, fewer change outs",
      "A plant based stall product out of a Louisiana mill",
      "Free bedding sample for your buyers to handle",
    ],
    variants:[
      { id:"A", angle:"Direct value",
        subject:"Bedding that holds five times its weight",
        body:"Hi {First},\n\nWe make a sugarcane bagasse product at our own mill in Louisiana that takes up to 5 times its weight in liquid, with far less dust than shavings.\n\nIn a stall or a house that means less material to hold the same moisture, and a longer stretch between change outs. The labor is usually the bigger number.\n\nCan I send a free sample for your buyers to handle? Just reply with a ship to address.\n\n{Me}\nAmerican BioCarbon\n{phone}" },
      { id:"B", angle:"Problem led",
        subject:"Still selling nothing but shavings?",
        body:"Hi {First},\n\nShavings are bulky, dusty, and the price moves with the lumber market, which makes them a difficult thing to build a category on.\n\nOurs is made from sugarcane bagasse, takes up to 5 times its weight, and runs low dust. We sell it by the metric ton in 1,650 lb super sacks, direct from our own mill.\n\nWorth a free sample to put in front of your buyers? Send me a ship to address.\n\n{Me}\nAmerican BioCarbon\n{phone}" },
      { id:"C", angle:"Short and curious",
        subject:"Free bedding sample for your buyers to handle",
        body:"Hi {First},\n\nShort one. Sugarcane bagasse bedding, up to 5 times its weight, low dust, made in Louisiana.\n\nCan I mail you a free sample? Nothing to buy, I just want it in your hands.\n\n{Me}\nAmerican BioCarbon\n{phone}" },
    ],
    followups:[
      { t:"Follow up 1, day 3",
        b:"Hi {First},\n\nFloating this back up. Up to 5 times its weight, low dust, sold by the metric ton out of our own mill.\n\nReply with a ship to address and a free sample goes out.\n\n{Me}\n{phone}" },
      { t:"Follow up 2, day 7",
        b:"Hi {First},\n\nAre you the one who decides what bedding you carry, or is that someone else? Happy to take it to them instead.\n\n{Me}\n{phone}" },
      { t:"Breakup, day 12",
        b:"Hi {First},\n\nI will leave it here. If shavings supply or price ever gets annoying enough to look at an alternative, the sample offer stands.\n\n{Me}\n{phone}" },
    ],
    phone:{
      opener:"Hi {First}, {Me} with American BioCarbon in Louisiana. We make a sugarcane bagasse bedding product that takes up to 5 times its weight and runs low dust, so it stretches the time between change outs. Are you the one who decides what bedding you carry?",
      voicemail:"Hi {First}, {Me} with American BioCarbon. Sugarcane bedding, up to 5 times its weight, low dust, sold by the metric ton. I would like to mail you a free sample. {phone}. Thanks.",
    },
    objections:[
      { o:"Our customers want shavings",
        b:"Most do, because that is what has always been on the pallet. Take a free sample and put it in front of two or three of them. If nobody bites, you have lost nothing." },
      { o:"Is it good for the animals",
        b:"I am going to answer that carefully, because I will not make a health claim. What I can tell you is what it does: it takes up to 5 times its weight in liquid and it runs low dust. What that means in your barn is your call to make after you handle it." },
    ],
    campaign:{
      priority:"P1", effort:4,
      companies:["Equine and livestock bedding distributors","Feed and farm supply stores","Poultry house and broiler complex suppliers","Stall and pet product brands","Farm store chains"],
      triggers:["Shavings supply tightening or price moving","A dust or odor complaint at a facility","Building out a bedding category","Seasonal restock ahead of winter"],
      disq:["Sells feed only with no bedding category","Any account that wants an animal health claim to sell it, which we will not give","Too small to take a metric ton"],
      offer:"Free 1 lb sample for buyers to handle, then pricing by the metric ton in super sacks.",
      cta:"Can I send a free sample for your buyers to handle?",
      cta2:"Want the spec and the super sack format?",
      metric:"Samples in buyers' hands, then category conversations",
      cycle:"Seasonal. Bedding decisions cluster ahead of winter.",
      list:"Nationwide. 20 companies came from research, but the bigger vein is the CRM: the HubSpot import is full of feed stores, equine supply and poultry complexes that were never prospected. Work the CRM names first, they are warm.",
      persona:{
        cares:"What their customers will actually buy, and what it costs on the pallet.",
        fears:"A product that sits, and a claim that gets them in trouble.",
        needs:"To physically handle it, and a price per ton delivered.",
        language:"Stall, bedding, shavings, dust, bag, pallet, change out.",
        avoid:"Any health or feed claim. Say what it absorbs and stop talking.",
        discovery:["What are you selling for bedding today?","Do you hear complaints about dust?","Who decides what goes on the pallet?","What does shavings cost you delivered right now?"],
      },
    },
  },
  ],
},

],
};
