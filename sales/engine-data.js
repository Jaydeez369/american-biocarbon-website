/* ============================================================
   VEJ Sales OS - ENGINE DATA
   ------------------------------------------------------------
   Two things live here and nothing else:

     ENGINE.instantly  the campaign architecture and the logic
                       behind it, after the Aug 12 refinement.
                       This is the "why is it built this way"
                       layer that sits behind outreach-data.js,
                       which holds the words themselves.

     ENGINE.funnels    every channel we can run beyond email,
                       what each one costs, what it can produce,
                       and what has to be true before it opens.

   Repo counterparts, which win on any disagreement:
     sales-department/campaigns/MONTH-1-EMAIL-PLAN.md
     sales-department/campaigns/INSTANTLY-PASTE.md
     sales-department/campaigns/REPLY-PLAYBOOK.md
     handoff/enrichment/assign-waves.mjs

   COST DISCIPLINE. Every number in the funnel model carries a
   `conf` field and it is not decoration:
     "confirmed"  stated on the Aug 10 VDJ call or sitting in
                  this repo. Spend against it.
     "list"       a public list price nobody here has invoiced
                  yet. Sanity check before you budget it.
     "assumed"    a planning assumption. It is a guess with a
                  reason attached, not a measurement.
     "unknown"    nobody has looked. Do not put it in a budget.
   A funnel whose cost is "unknown" does not get approved. It
   gets a task to go find out.

   FORMATTING RULE: no hyphens, en dashes or em dashes in any
   visible string. Same rule as outreach-data.js.
   ============================================================ */

const ENGINE = {

/* ============================================================
   1. INSTANTLY ARCHITECTURE
   ============================================================ */
instantly:{
  updated:"August 12, 2026",
  headline:"The unit of work is the account, not the contact.",
  premise:"339 biochar contacts sit on 80 companies. Eleven of them are at one nursery. Treating each contact as an independent cold lead is how you email five people at the same company in one week with near identical copy, annoy the buyer, and teach a spam filter that the domain sends bulk. So the engine sends to one best fit buyer per account, waits, and only then opens a second door. Depth is earned: a score 10 account gets up to seven doors, a score 7 gets three, and sales and business development titles are held at every depth.",

  /* The seven ideas the whole build rests on. Each one replaced
     something that was in the plan a week ago and was wrong. */
  principles:[
    { n:"01", t:"One account, one door at a time",
      was:"Every contact was its own lead. 339 sends, all at once.",
      now:"78 accounts get one wave 1 contact. Each further door opens 3 to 5 business days behind the last, and only if the one before it stayed silent. Depth is capped by account score: 7 doors at score 10, 5 at 8 and 9, 3 at 7 and below. 206 contacts enter, 133 are held.",
      why:"Half the held list was never a second buyer, it was the same buyer's colleague. The rest are sales people who sell for the account and do not buy for it, and they are held at every depth." },

    { n:"02", t:"Variants match the list, not the writer",
      was:"Five email 1 variants per campaign because five had been written.",
      now:"Three on nurseries, two on farms and distributors, one on blenders and composters. Absorbent runs two on the five large lists and one on the three small ones.",
      why:"At 11 to 108 contacts per campaign, five variants is 2 to 22 sends each. That is not a test, it is five ways of not knowing." },

    { n:"03", t:"Research drives the message, it does not decorate it",
      was:"Real desk research sat in a personalization column and got prepended to a generic body.",
      now:"The research becomes {{observation}}, the literal first sentence, and the rest of the email is the wedge that answers it. Sandy loam gets a water email. A bagging line gets a production spec email.",
      why:"A merged fact in front of a generic pitch reads worse than no personalization, because it proves somebody looked and then did not care." },

    { n:"04", t:"The CTA matches the buyer",
      was:"Every buyer was asked for a shipping address.",
      now:"Nursery gets a bench trial. Farm gets a strip trial. Distributor gets spec plus a freight number and a routing question. Blender gets the spec first. Composter gets the windrow protocol. Public sector gets the technical packet. Operational absorbent buyers get the video or a spill test.",
      why:"A category manager cannot approve a sample before they know whether it pencils delivered. Asking for their dock first is asking for the last step first." },

    { n:"05", t:"Cadence follows the buyer's clock",
      was:"One cadence cloned onto every campaign.",
      now:"Growers run day 0, plus 5, plus 7 to 9. Trade and production run 0, 4 to 5, 9 to 12. Industrial and procurement run 0, 4, 9, 14.",
      why:"A farm owner is on a season. A procurement buyer is on a cycle. The same three emails at the same three intervals serve neither." },

    { n:"06", t:"Volume is gated by reputation, not by the calendar",
      was:"Raise to 28 sends per inbox in week 3, because week 3 arrived.",
      now:"20 per inbox per day. It moves one step only after ten health gates hold green for five consecutive business days, and it moves 20 to 25 to 30, never straight to 40.",
      why:"A date is not evidence. There is no such thing as zero deliverability risk, and the previous plan said there was." },

    { n:"07", t:"A positive reply suppresses the whole account",
      was:"Stop on reply, at the contact level.",
      now:"Company level block across both product lines and every wave. A not me reply routes to the named person instead of closing the account. An opt out suppresses the domain everywhere.",
      why:"Nothing looks worse than a second cold email to a company that already said yes to the first one." },
  ],

  /* The waterfall, stated as the rule the script implements. */
  waterfall:{
    script:"handoff/enrichment/assign-waves.mjs",
    note:"The script is the executable version of this table. If the rule changes in the plan, change the script, then re run it. Never hand edit the wave column.",
    ceiling:"Contacts per account by score: 7 at score 10, 5 at scores 8 and 9, 3 at score 7 and below. This replaced a flat 3 on Aug 12. The reason is that verified addresses, not breadth, turned out to be the constraint: once a domain's email pattern is known every named contact at that account is reachable for zero extra credits, so a high scoring account deserves to be worked deeper than a low scoring one.",
    rows:[
      { w:"Wave 1", who:"the single best fit buyer at the account", when:"day 0", n:78 },
      { w:"Wave 2", who:"the second relevant contact", when:"3 to 5 business days later, only if wave 1 has not replied", n:63 },
      { w:"Wave 3", who:"the third contact", when:"3 to 5 business days behind wave 2, same silence rule", n:39 },
      { w:"Waves 4 to 7", who:"further contacts at high scoring accounts only", when:"same rolling interval, capped by the score ceiling above", n:26 },
      { w:"Hold", who:"everyone past the ceiling, plus every sales and business development title, plus all of BC.RANCH", when:"never enters an automated campaign", n:133 },
    ],
    sending:206,
    titlePriority:[
      ["BC.NUR","grower or production, buyer, owner, ops, sales"],
      ["BC.DIST","buyer or category, owner, agronomy, ops, sales"],
      ["BC.FARM","owner, grower or agronomy, ops, buyer, sales"],
      ["BC.BLEND","production, owner, buyer, ops, sales"],
      ["BC.COMP","site or pad ops, owner, production, buyer, sales"],
      ["BC.RANCH","manual only. Two accounts is two phone calls, not a campaign"],
    ],
  },

  /* Campaign map, biochar contacts are real, absorbent is account level only. */
  campaigns:[
    { code:"BC.NUR",  label:"Nurseries and greenhouse growers",   line:"Biochar",   accts:37, contacts:108, versions:3, steps:3, cta:"bench or media trial",            status:"build" },
    { code:"BC.FARM", label:"Row crop and specialty farms",       line:"Biochar",   accts:16, contacts:33, versions:2, steps:3, cta:"controlled strip or block trial", status:"build" },
    { code:"BC.DIST", label:"Ag distributors and landscape supply",line:"Biochar",  accts:13, contacts:37, versions:2, steps:3, cta:"spec plus freight, route to agronomy", status:"build" },
    { code:"BC.BLEND",label:"Soil blenders and bagged media",     line:"Biochar",   accts:7,  contacts:17, versions:1, steps:3, cta:"technical spec, then production evaluation", status:"build" },
    { code:"BC.COMP", label:"Composters and organics recyclers",  line:"Biochar",   accts:5,  contacts:11, versions:1, steps:3, cta:"windrow protocol, then trial material", status:"blocked, protocol one pager missing" },
    { code:"BC.RANCH",label:"Ranchers, livestock and poultry",    line:"Biochar",   accts:2,  contacts:5,  versions:1, steps:0, cta:"find the use case first",         status:"manual, never built" },
    { code:"AB.MUNI", label:"Municipal public works",             line:"Absorbent", accts:50, contacts:0,  versions:2, steps:4, cta:"video, or technical packet",      status:"needs enrichment" },
    { code:"AB.CIVIL",label:"Heavy civil, dredging and slurry",   line:"Absorbent", accts:50, contacts:0,  versions:2, steps:4, cta:"video, or a dewatering job test", status:"needs enrichment" },
    { code:"AB.DIST", label:"Absorbent distributors and safety supply", line:"Absorbent", accts:25, contacts:0, versions:2, steps:4, cta:"video, or spec then evaluation", status:"needs enrichment" },
    { code:"AB.OG",   label:"Oil and gas field services",         line:"Absorbent", accts:23, contacts:0,  versions:2, steps:4, cta:"video, or a spill test",          status:"needs enrichment" },
    { code:"AB.HDD",  label:"Directional drilling and utility boring", line:"Absorbent", accts:16, contacts:0, versions:2, steps:4, cta:"video, or a crew test on one bore", status:"needs enrichment" },
    { code:"AB.LF",   label:"Landfill and leachate operations",   line:"Absorbent", accts:8,  contacts:0,  versions:1, steps:4, cta:"technical packet first",          status:"needs enrichment" },
    { code:"AB.ENV",  label:"Spill response and remediation",     line:"Absorbent", accts:6,  contacts:0,  versions:1, steps:4, cta:"sample staged for the next callout", status:"needs enrichment" },
    { code:"AB.BED",  label:"Animal bedding and equine supply",   line:"Absorbent", accts:4,  contacts:0,  versions:1, steps:4, cta:"house trial, bedding claims only", status:"needs enrichment" },
  ],

  /* The personalization pipeline, with a worked example so nobody
     has to guess what "transform the research" means. */
  personalization:{
    chain:["raw desk research","natural observation","the business problem it implies","the matching product wedge","the matching CTA"],
    variable:"{{observation}}",
    built:"handoff/enrichment/assign-waves.mjs strips rep directed language and any sample quantity out of the research column, then writes a send ready first sentence.",
    gate:"All 78 wave 1 observations get read by a human before launch. 6 are flagged for review automatically. A row with an empty observation does not send.",
    examples:[
      { acct:"Garber Farms, BC.FARM",
        raw:"site sells the sandy loam soil as the reason their sweet potatoes look better",
        obs:"you lead with the sandy loam",
        prob:"sandy loam drains fast, so water and applied nutrients leave the root zone early",
        wedge:"holds roughly 3 to 3.5x its weight in water and holds nutrients in the zone",
        cta:"one controlled strip against your normal program, same irrigation" },
      { acct:"The Organic Recycler, BC.BLEND",
        raw:"bags its own product, sells into 100 plus independent retailers",
        obs:"you bag your own and you own the shelf it sits on",
        prob:"a bagged mix has to still perform after it sits, and the premium tier needs a spec",
        wedge:"granulated, screens clean, 65 percent organic carbon, holds water in the bag",
        cta:"production evaluation, one batch to spec" },
      { acct:"Flowerwood Nursery, BC.NUR",
        raw:"Loxley is the propagation and distribution hub for all Flowerwood sites",
        obs:"one media spec at Loxley reaches three states",
        prob:"a media change at the hub is high leverage and therefore high scrutiny",
        wedge:"water holding in the mix between irrigations",
        cta:"one bench against your standard mix" },
    ],
    roles:[
      ["Owner or GM","the economics, in one line","do not walk them through a spec sheet"],
      ["Purchasing","supplier terms, lead time, freight, what is on file","do not lead with agronomy"],
      ["Production","how it behaves in the batch, in the mixer, on the line","do not lead with sustainability"],
      ["Agronomy or grower","the mechanism and the trial design","do not lead with margin"],
      ["Operations or site","what changes on the pad, in the house, on the job","do not lead with strategy"],
      ["Product or category","the shelf, the spec, the differentiation","do not lead with an address ask"],
    ],
  },

  /* Deliverability. Ten gates, all must hold. */
  deliverability:{
    start:"20 campaign sends per inbox per day. 4 warmed inboxes, so 80 per day and roughly 1,720 per month.",
    ramp:"20 to 25 to 30. One step at a time, five clean business days between steps. 40 per inbox is a tooling ceiling, not a number this infrastructure has earned.",
    rollback:"If any gate goes red, drop one step immediately and hold until it is green for five days.",
    gates:[
      "SPF passing on every sending domain",
      "DKIM passing on every sending domain",
      "DMARC published and passing",
      "Inbox warmup complete, two weeks or more, still running alongside campaign sends",
      "Instantly sending health score in the healthy band on every inbox",
      "Bounce rate under 2 percent campaign wide and under 3 percent on any single inbox",
      "Only verified addresses in the campaign",
      "No abnormal provider deferrals in the sending log",
      "Inbox placement spot check still landing primary",
      "Spam complaint and unsubscribe rates flat, with no cluster on one campaign or inbox",
    ],
    fixed:[
      ["Open tracking","OFF permanently. Pixels cost placement and Apple MPP makes opens noise"],
      ["Link tracking","OFF for round 1. Only with a custom tracking domain, and only after the ramp gates hold"],
      ["Links in any step","None, including the video. The clip goes out in the one to one reply"],
      ["Stop on reply","ON"],
      ["Stop on auto reply","OFF, an out of office should re enter rather than kill"],
      ["Company domain limit","1 new contact per company domain per day, workspace wide"],
      ["Suppression","One global list across both lines: customers, all 185 HubSpot contacts, prior opt outs, every replied account"],
      ["Unsubscribe and address","Instantly campaign footer, every step, every campaign"],
      ["Per inbox limit","Set on the mailbox, not the campaign, so a weak inbox can be throttled alone"],
    ],
  },

  /* The verification gate. This is the thing actually blocking launch. */
  verification:{
    state:"339 biochar contacts. 9 addresses revealed. 0 have been through verification. Absorbent has 182 accounts and zero contacts.",
    blunt:"Nothing can send today. This is bigger than every copy question in the repo.",
    classes:[
      ["valid","import and send normally","yes"],
      ["invalid","drop, and do not re pull the same address","no"],
      ["catch all","the domain accepts everything, so a bounce never comes back and the address may not exist. Route to phone or a one to one send once the account is warm","no"],
      ["risky","treat as catch all","no"],
      ["unknown or pending","re run verification, and if it stays unknown treat as catch all","no"],
    ],
    expect:"Catch all domains are common at small farms and municipalities, which is most of BC.FARM and all of AB.MUNI. Plan the phone route there rather than forcing sends.",
    attrition:"Planning assumption is that 70 to 80 percent of revealed addresses survive verification. That is an assumption, not a measurement. Replace it with the real number after the first run.",
    statusField:"Every row carries send_status. READY, BLOCKED NO EMAIL, BLOCKED UNVERIFIED or HOLD. Only READY imports.",
  },

  sender:{
    rule:"A named human at one domain, and the signature does not introduce a second one.",
    was:"sales@americanbiocarbon.com in the header, a lookalike domain actually sending, and victor.jehle@cs-ops.com in the signature. Three identities, one email.",
    rows:[
      ["From name","Victor Jehle. A person, never Sales and never a team name"],
      ["From address","the warmed mailbox that is actually sending. Never a From address on a domain that is not doing the sending"],
      ["Reply to","unset. Replies land in the Instantly inbox on their own"],
      ["Signature","three lines, plain text, no HTML, no logo, no URL"],
    ],
    signature:"Victor Jehle\nAmerican BioCarbon\n(225) 398 9286",
    domains:"Domain A leads biochar, domain B leads absorbent, rotation on within each. That is a diagnostics decision so a placement problem shows up as a domain level signal instead of smearing across both lines. It is not a capacity decision and it is not a reason to buy anything.",
    blocker:"Name the two sending domains and the four mailboxes and confirm the From name on each is a real person. If any mailbox sends as sales@ or a generic alias, fix it before launch.",
  },

  /* What round 1 produces, and the honest read of it. */
  output:[
    ["Accounts in the automated program","78"],
    ["Contacts after the waterfall","206"],
    ["Contacts surviving verification at 75 percent","about 155"],
    ["Sends across a 3 step sequence","about 415"],
    ["Business days to enter wave 1","about 2"],
    ["Share of one month at 80 per day","about 24 percent"],
  ],
  statRead:{
    bar:"100 sends on a version before it can be cut.",
    reality:"BC.NUR at 3 versions and 108 contacts lands near 36 sends per version. That is the best in the book and it is under a third of the bar. No campaign resolves in month 1.",
    allowed:"Read replies for language. Fix anything obviously broken. Note the direction.",
    banned:"Do not cut a version. Do not write the word winner in a report. Auto optimize stays off everywhere, because it would pick a winner off four sends.",
    unlock:"At roughly 300 verified in zone accounts, BC.NUR clears 100 sends per version and the comparison starts answering questions. Getting there is worth more than any copy edit.",
  },

  blockers:[
    { p:1, t:"No verified email addresses", d:"339 contacts, 9 revealed, 0 READY. Absorbent has no contacts at all.", owner:"enrichment run, in progress" },
    { p:2, t:"Free sample quantity for production, windrow and field trials", d:"Approved sizes cover a bench evaluation and a spill test only. No email may name a windrow, a pallet blend, a field strip or a house as what the free sample covers until operations sets a number.", owner:"Victor and operations" },
    { p:3, t:"Crumble video", d:"Every absorbent version A and every absorbent step 2 references it. If it is missing at launch, drop version A and run those campaigns at one version.", owner:"Victor" },
    { p:4, t:"Crumble technical packet", d:"Blocks AB.MUNI, AB.LF and AB.DIST from converting a reply. A video persuades a person, a document gets a product onto an approved vendor list.", owner:"Jesse, from verified facts only" },
    { p:5, t:"Windrow trial protocol one pager", d:"Blocks BC.COMP email 1 and step 2. The protocol design already exists in playbook 08.", owner:"Jesse" },
    { p:6, t:"Sender identity confirmation", d:"Two domains, four mailboxes, From name a real person on each.", owner:"Jesse" },
    { p:7, t:"Municipal packaging below a super sack", d:"If we cannot pack under 1,650 lb, AB.MUNI spill kit and in vehicle use cases close and only yard, street and stormwater demand remains.", owner:"operations" },
    { p:8, t:"NRCS 336 cost share for BC.FARM", d:"Probably the strongest farm hook available and still unverified. Verify, then add as a third BC.FARM version. Never improvise it on a reply.", owner:"Jesse" },
  ],
},

/* ============================================================
   2. APOLLO, WHAT THE DATA ACTUALLY BUYS US
   ============================================================ */
apollo:{
  account:"2,600 credits on the account. The enrichment plan spends 1,000 of them by choice and holds the rest for misses and re pulls.",
  ceiling:"Hard ceiling of 4 contacts per company. The live count pass killed the old 8 deep tier: one nursery had 39 people in Apollo and exactly one decision maker. Depth past 4 buys the fourth best title at the same company, not a fourth door.",
  note:"Apollo org search is fuzzy. A company name match is not proof of the right entity, which is why the roster carries a match verdict and a bad match freezes an account at zero credits.",

  /* What we already know we get, versus what nobody has checked. */
  fields:[
    { f:"Company match and domain",      cost:"free",     conf:"confirmed", use:"the roster join. Already used across 679 accounts." },
    { f:"Employee count and headcount",  cost:"free",     conf:"confirmed", use:"account scoring and the depth table." },
    { f:"Named contacts with titles",    cost:"free",     conf:"confirmed", use:"ApolloNamedContacts is populated free tier across the roster. This is how the title buckets and the waterfall got built without spending a credit." },
    { f:"Total contact count per company",cost:"free",    conf:"confirmed", use:"tells you whether depth is even available before you allocate credits." },
    { f:"Work email reveal",             cost:"1 credit", conf:"confirmed", use:"the only thing the 1,000 credit plan is currently allocated against." },
    { f:"Direct dial or mobile phone",   cost:"unknown",  conf:"unknown",   use:"THE highest value unknown in the stack. The power dialer funnel is worth nothing without numbers. Check the credit cost per phone reveal before budgeting the dialer." },
    { f:"LinkedIn profile URL",          cost:"unknown",  conf:"unknown",   use:"gates the whole LinkedIn funnel. Check whether it comes with the free named contact or only on a reveal." },
    { f:"Buying intent signals",         cost:"unknown",  conf:"unknown",   use:"usually a higher tier feature. Would let us prioritize the wave 1 order instead of ranking on title alone." },
    { f:"Job change alerts",             cost:"unknown",  conf:"unknown",   use:"a contact who just moved is the warmest cold email there is. Worth checking what tier it needs." },
    { f:"Email verification status",     cost:"unknown",  conf:"unknown",   use:"if Apollo returns a deliverability grade with the reveal, that may remove a separate verification vendor from the stack entirely. Check this FIRST, it changes the cost model." },
  ],
  asks:[
    "What does a phone reveal cost in credits, and does a mobile cost more than a direct dial?",
    "Does the free named contact carry a LinkedIn URL, or does that need a reveal?",
    "Does a reveal return a verification or deliverability grade, and is it good enough to skip a separate verifier?",
    "What is the monthly export cap on the current plan?",
    "What does the next tier up actually add, and at what price?",
  ],
},

/* ============================================================
   3. THE FUNNELS
   ------------------------------------------------------------
   Ordered by how soon each can realistically produce a
   conversation, not by how exciting it is.
   ============================================================ */

/* Stack costs. Everything here is fixed monthly: it does not
   care whether you send 340 emails or 1,720, which is the single
   most important fact in the whole cost model. */
stack:[
  { tool:"Apollo",   mo:65,   conf:"confirmed", src:"Aug 10 VDJ call. Jesse: that is just a 65 or whatever that is.", covers:"list source, company data, named contacts, 2,600 email reveal credits" },
  { tool:"Instantly",mo:47,   conf:"confirmed", src:"Aug 10 VDJ call. Jesse: I think 47 a month.", covers:"campaign sending, inbox rotation, warmup, the unibox replies land in" },
  { tool:"Aloe",     mo:45,   conf:"confirmed", src:"Aug 10 VDJ call. Victor: I think this was the one that was like 45 a month. Jesse: that is the business plan, so we get all the APIs and webhooks.", covers:"power dialer, receptionist and voicemail agent, SMS once 10 DLC clears, calendar booking" },
  { tool:"Resend",   mo:0,    conf:"confirmed", src:"Aug 10 VDJ call. Jesse: Resend is free.", covers:"transactional email off the website forms" },
  { tool:"Sending domains and inboxes", mo:null, conf:"unknown", src:"Not stated anywhere in the repo or on the call.", covers:"2 lookalike domains x 2 inboxes. Registrar plus mailbox seats. Find the invoice." },
  { tool:"Email verification", mo:null, conf:"unknown", src:"No vendor named. May be unnecessary if Apollo returns a grade, see the Apollo asks.", covers:"the gate that currently blocks every send" },
  { tool:"10 DLC registration", mo:null, conf:"unknown", src:"Jesse is running it. Roughly a week to clear. Cost not stated.", covers:"federal compliance for outbound SMS" },
],

/* The insight the whole cost model turns on. */
stackNote:"Confirmed fixed stack is $157 a month. It buys 1,720 email sends of capacity whether we use them or not. At month 1 volume of about 415 sends that is $0.38 a send. At full capacity it is $0.09. The stack is not the constraint and cost per send is not the number to optimize. The list is the constraint. Every funnel below is judged on cost per real conversation, not cost per touch.",

funnels:[
  /* ---------------------------------------------------- EMAIL */
  {
    id:"email", rank:1, name:"Cold email, Instantly", status:"live, blocked on verification",
    what:"12 campaigns across two product lines, one best fit buyer per account, waves opening behind them.",
    gates:["Every address verified and classified","All 78 wave 1 observations read by a human","Ten deliverability gates green","Sender identity confirmed"],
    capacity:"4 inboxes x 20 sends a day = 80 a day, about 1,720 a month. Ramps to 2,150 at 25 per inbox and 2,580 at 30, only on clean health.",
    volume:"Month 1 biochar: about 155 verified contacts and about 415 sends. That is roughly 24 percent of capacity.",
    cost:{ fixed:47, unit:null, unitLabel:"credits and verification are counted under Apollo, not here", conf:"confirmed" },
    math:[
      ["Sends in month 1","about 415"],
      ["Reply rate, tight targeted list","3 to 8 percent"],
      ["Replies","12 to 33"],
      ["Positive replies","6 to 18"],
      ["Cost per send at month 1 volume","$0.11 on Instantly alone, $0.38 on the confirmed stack"],
      ["Cost per reply at the midpoint","about $7 on the confirmed stack"],
    ],
    conf:"Reply rate is an assumed range for a well targeted B2B list. Everything else is derived from the roster and the send caps.",
    verdict:"Open now, the moment verification clears. Nothing else in this list beats it on cost per conversation.",
  },

  /* ---------------------------------------------------- PHONE */
  {
    id:"phone", rank:2, name:"Power dialer, Aloe", status:"tool ready, gated on phone numbers",
    what:"Bulk outbound dialing against the same roster, plus a receptionist and voicemail agent that books a 10 minute callback straight onto a calendar.",
    gates:["Phone numbers on the roster. Apollo phone reveal cost is unknown and this funnel does not open without it","A named contact, not a switchboard","Email recognition first on top accounts, so the call is not cold"],
    capacity:"Up to 200 dials an hour on the dialer. Jesse put the practical figure at about 100 an hour on the Aug 10 call, and that is the number to plan with until we have measured our own. One hour a day, five days a week, is 500 dials a week at the practical rate.",
    volume:"The whole 80 account biochar roster is one hour of dialing. The 182 account absorbent roster is two.",
    cost:{ fixed:45, unit:null, unitLabel:"per minute telephony not confirmed, and Apollo phone reveal credits are unknown", conf:"confirmed on the seat, unknown on usage" },
    math:[
      ["Dials per hour, planning rate","100"],
      ["Connect rate, cold B2B, ASSUMED","5 to 10 percent"],
      ["Connects per dialing hour","5 to 10"],
      ["Conversations per week at 1 hour a day","25 to 50"],
      ["Aloe seat cost per dialing hour at 20 hours a month","$2.25"],
      ["Cost per connect, seat only, at the midpoint","about $0.30"],
    ],
    conf:"Connect rate is an industry assumption and nobody here has measured it. Telephony per minute and Apollo phone credits are both unknown. The seat cost is confirmed.",
    verdict:"Highest leverage second channel, and it is cheap per conversation because the seat is already paid for. Two things open it: find out what a phone reveal costs, and measure our own connect rate in the first week rather than trusting the 5 to 10 percent.",
    rules:[
      "Any positive email reply gets a call the same business day, inside 4 hours where possible.",
      "Accounts scoring 9 or 10 get a call after wave 1 has been delivered 3 or more business days with no reply, then an email recap the same day.",
      "Accounts with only a published role address such as info@ or sales@ go to phone and never to a campaign. That is 36 of the 50 AB.CIVIL accounts.",
      "A not me reply that names somebody gets the named person called, then emailed.",
      "Do not call BC.RANCH, AB.LF or AB.MUNI before an email has landed. Those buyers file before they talk.",
    ],
  },

  /* ---------------------------------------------------- SMS */
  {
    id:"sms", rank:3, name:"SMS, Aloe", status:"blocked on 10 DLC",
    what:"Short follow up texts to numbers captured off email replies and calls. Not a cold channel.",
    gates:["10 DLC verification, roughly a week, Jesse running it","Website terms of service published and reviewed by management","Explicit consent captured before any message"],
    capacity:"Not a volume channel. This is a follow up tool on people who already engaged.",
    volume:"Roughly half to three quarters of email replies come back with a phone number, per the Aug 10 call. That is the addressable pool and it is small on purpose.",
    cost:{ fixed:0, unit:null, unitLabel:"included in the Aloe seat, per message rates and the 10 DLC registration fee are both unknown", conf:"unknown" },
    math:[
      ["Registration lead time","about 1 week"],
      ["Addressable pool in month 1","5 to 15 numbers off positive replies"],
      ["Marginal cost","essentially zero on top of the Aloe seat, subject to per message rates"],
    ],
    conf:"Lead time is confirmed from the call. Every cost is unknown.",
    verdict:"Cheap and useful, but it is a nudge on a warm thread, not a funnel. Do not cold text. Federal compliance is the whole reason for the 10 DLC and it is not optional.",
  },

  /* ---------------------------------------------------- LINKEDIN */
  {
    id:"linkedin", rank:4, name:"LinkedIn",  status:"gated on data and on a decision",
    what:"Connection requests and short notes to the same named contacts, running alongside email rather than instead of it. Multichannel lifts reply rate on the accounts that ignore one channel.",
    gates:["LinkedIn URLs on the roster. Unknown whether the free Apollo named contact carries one","A seat, and probably Sales Navigator","Somebody willing to send them, because this is manual work and there is no automation that is both safe and allowed"],
    capacity:"Platform limits run roughly 100 to 200 connection requests a week per account, and they tighten on new or low activity profiles. That is a platform rule, not our choice.",
    volume:"At 100 a week the entire 80 account biochar roster is one week of sending. The 182 account absorbent roster is two.",
    cost:{ fixed:99, unit:null, unitLabel:"Sales Navigator list price per seat per month", conf:"list" },
    math:[
      ["Connection requests per week, one seat","100 to 200"],
      ["Acceptance rate, cold B2B, ASSUMED","20 to 30 percent"],
      ["Accepted connections per week at 100 sent","20 to 30"],
      ["Reply rate on an accepted connection, ASSUMED","10 to 20 percent"],
      ["Conversations per week","2 to 6"],
      ["Cost per conversation at $99 a month and 4 a week","about $6"],
    ],
    conf:"Sales Navigator pricing is public list price and nobody here has invoiced it. Acceptance and reply rates are assumptions. Whether we have the URLs at all is unknown.",
    verdict:"Worth opening only after the email and phone funnels are actually running, and only if Apollo already carries the URLs. If the URLs need a paid reveal, price that first, because it may cost more than the seat. It is the most manual channel on this list and it does not scale without a person.",
  },

  /* ---------------------------------------------------- WEBSITE */
  {
    id:"web", rank:5, name:"Website funnel", status:"live",
    what:"Sample and quote request forms routing to the team, plus the cork interest funnel the Aug 10 call decided on in place of a cork campaign.",
    gates:["Forms routing to the right addresses. Note the known issue: some collateral routes to @americanbiocarbon.com when the team actually uses @cs-ops.com","Sales OS deployment confirmed at the apex"],
    capacity:"Unbounded and passive. It captures demand rather than creating it.",
    volume:"Unmeasured. Nobody has instrumented it.",
    cost:{ fixed:0, unit:null, unitLabel:"already built and deployed, Resend is free", conf:"confirmed" },
    math:[
      ["Marginal cost per lead","$0"],
      ["Cork strategy","funnel only, no campaign. There is no cork inventory to sell, so it builds the relationship for when supply exists"],
    ],
    conf:"Confirmed. The decision to keep cork as a funnel and not a campaign is from the Aug 10 call.",
    verdict:"Free and already running. The only work is making sure the routing addresses are right and that somebody is watching the inbox.",
  },

  /* ---------------------------------------------------- REFERRAL */
  {
    id:"referral", rank:6, name:"Referral and account expansion", status:"available now",
    what:"The not me reply, the internal routing, the second branch at a multi site account, and the ask after a trial goes well.",
    gates:["A trial that produced a result the buyer will repeat out loud","Permission before any name gets used"],
    capacity:"Small and high quality. It scales with wins, not with effort.",
    volume:"Several accounts on the roster are multi site by design. One nursery is the propagation hub for three states. One distributor has 29 locations and three blend plants inside the ring. A win at the hub is not one account.",
    cost:{ fixed:0, unit:null, unitLabel:"no tool required", conf:"confirmed" },
    math:[
      ["Marginal cost","$0"],
      ["Conversion versus cold","materially higher, and nobody needs a study to believe it"],
      ["Month 1 realistic volume","1 to 3, because it needs a completed trial first"],
    ],
    conf:"Cost is confirmed at zero. Volume is bounded by how many trials complete, which is the metric that actually matters this month.",
    verdict:"The cheapest funnel we have and the one most likely to be neglected because it does not feel like a channel. The not me reply is the single most underused asset in the whole system.",
  },

  /* ---------------------------------------------------- SIDE BETS */
  {
    id:"tradeshow", rank:7, name:"Trade shows", status:"parked, side bet",
    what:"Booth with a live absorbency demo, spec cards, and a ship to capture for every qualified visitor.",
    gates:["A crumble video and a technical packet, both of which are already blockers on the email funnel","Budget approval"],
    capacity:"Two or three shows a year at most.",
    volume:"Unknown. No show list has been built.",
    cost:{ fixed:null, unit:null, unitLabel:"booth, travel and materials. Not priced anywhere in this repo", conf:"unknown" },
    math:[["Recommended first step","walk the floor as an attendee before paying for a booth, which costs a flight and validates the room"]],
    conf:"Nothing here is priced.",
    verdict:"Real channel, wrong month. The absorbency demo is genuinely the strongest thing we own in person. Revisit once the email and phone funnels have produced their first wins.",
  },
  {
    id:"social", rank:8, name:"Organic social and video", status:"parked, side bet",
    what:"The crumble absorption footage, cut short, posted where oil and gas and environmental crews actually are.",
    gates:["The crumble video existing, which is already a launch blocker elsewhere"],
    capacity:"Unbounded reach, unpredictable yield.",
    volume:"Unmeasured.",
    cost:{ fixed:0, unit:null, unitLabel:"time only, unless paid distribution is added", conf:"assumed" },
    math:[["Note","the same asset that unblocks the absorbent email funnel is the asset this funnel runs on. Build it once, use it four ways"]],
    conf:"Cost is time. Yield is unknown.",
    verdict:"Zero marginal cost once the video exists, so it is worth doing badly rather than not at all. Do not let it compete for attention with the send.",
  },
  {
    id:"partner", rank:9, name:"Channel and private label", status:"opportunistic",
    what:"A distributor or supply house that carries the line, so one agreement reaches their whole downstream channel.",
    gates:["A technical packet a product manager can evaluate","Clarity on what we will and will not do on private label"],
    capacity:"Very few accounts, very high value.",
    volume:"25 AB.DIST accounts and 13 BC.DIST accounts on the roster today.",
    cost:{ fixed:0, unit:null, unitLabel:"no tool cost, high time cost per account", conf:"confirmed" },
    math:[["Note","per the Aug 10 call the big houses with proprietary trademarked blends will not take a line in. Stocking distributors and suppliers will. Target accordingly"]],
    conf:"The targeting insight is confirmed from the call. Volume is confirmed from the roster.",
    verdict:"Not a separate funnel so much as the highest value outcome of the email and phone funnels. Slow the conversation down when one lands and route it to Victor.",
  },
],

/* What has to be answered before any funnel past email gets a budget. */
decisions:[
  { q:"What does an Apollo phone reveal cost in credits?", blocks:"the entire power dialer funnel", owner:"Jesse" },
  { q:"Does an Apollo reveal return a deliverability grade good enough to skip a separate verifier?", blocks:"the email verification line item, and possibly removes it", owner:"Jesse" },
  { q:"Does the free Apollo named contact carry a LinkedIn URL?", blocks:"the LinkedIn funnel", owner:"Jesse" },
  { q:"What do the sending domains and the four inboxes actually cost per month?", blocks:"an honest total for the stack", owner:"Jesse" },
  { q:"What does 10 DLC registration cost, and what are the per message rates?", blocks:"the SMS funnel budget", owner:"Jesse" },
  { q:"What is our real cold connect rate on the dialer?", blocks:"every phone funnel projection. Measure it in week 1 rather than trusting 5 to 10 percent", owner:"Victor" },
],

};
