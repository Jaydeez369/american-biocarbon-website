/* ops-data.js  ->  window.OPS
 *
 * The four operating pillars that sit UNDER the campaign machine:
 *
 *   s2c      what happens after a reply, all the way to cash in the bank
 *   team     who does the work, how they ramp, what they are measured on, the meeting rhythm
 *   records  which file owns which truth, and where a rep is allowed to write
 *   runbook  every system, owner, cost and recurring job, so the department survives a handoff
 *
 * Rules for editing this file:
 *   1. No hyphens, no em dashes and no en dashes in any prose string. The house style gate
 *      (scripts/check-dashes.mjs) skips sales/, so this one is on the author. File names and
 *      code identifiers are exempt because they are literals, not prose.
 *   2. Anything nobody has actually confirmed carries status "open" and an owner. Never
 *      invent a cost, a renewal date or a vendor term to make a table look finished. An
 *      invented number is worse than a blank one because nobody goes back to check it.
 *   3. This file is content. ops.js is presentation. No numbers are typed in ops.js.
 */
window.OPS = {

/* ============================ 1. SAMPLE TO CASH ============================ */
s2c: {
  intro: "Every campaign in this app ends at the same place: a reply. This is the only page that says what happens next. It runs from that reply to money collected, with an owner and a clock on every step.",

  /* The spine. Stage names match the mid market pipeline in playbook 08 so the two never
     drift apart. "Logged in" answers the question that kills most handoffs: where does the
     evidence of this step live once it is done. */
  stages: [
    { n:"1", t:"Reply lands",
      owner:"Whoever is on reply duty that day",
      clock:"Answer inside 4 business hours. Same hour is the target.",
      does:"Read it, classify it as interested, question, referral, wrong person or not now. Send the matching reply from the Reply Playbook. Never improvise a price.",
      exit:"A reply is sent and the contact is classified.",
      log:"Sales Pipeline, contact record. Status moves off Prospect." },
    { n:"2", t:"Qualify",
      owner:"Rep who owns the account",
      clock:"Inside 2 business days of the reply.",
      does:"One call or one email thread. Run the MEDDIC A questions in the playbook. You are looking for a real use case, a named decision maker, a ship to address inside the freight ring and a rough volume.",
      exit:"Use case, buyer name, ship to city and volume band are written on the record.",
      log:"Sales Pipeline, stage Discovery. Notes field, not memory." },
    { n:"3", t:"Sample agreed",
      owner:"Rep",
      clock:"Same conversation as qualify wherever possible.",
      does:"Agree the written success metric BEFORE anything ships. What result would make them buy. Get it in writing in the email thread so it can be quoted back later.",
      exit:"Success metric is written and confirmed by the prospect in an email.",
      log:"Sales Pipeline, Sample stage. Paste the metric into the record." },
    { n:"4", t:"Sample ships",
      owner:"Fulfillment, OPEN, see the gaps below",
      clock:"Ship inside 2 business days. Delivery 4 to 7 business days.",
      does:"Pack the kit, attach the paperwork, ship, capture the tracking number, send the tracking number to the prospect the day it ships.",
      exit:"Tracking number is on the record and has been sent to the prospect.",
      log:"Sales Pipeline, sample shipped date plus tracking." },
    { n:"5", t:"Trial and follow up",
      owner:"Rep",
      clock:"Delivery day, day 3, day 10, day 21. Four touches, no more.",
      does:"Delivery day: confirm it arrived and restate the success metric. Day 3: ask if they have opened it and offer to walk through application. Day 10: ask for the result against the metric. Day 21: ask for the decision or close the loop honestly.",
      exit:"A result against the metric, or a written no.",
      log:"Sales Pipeline, every touch logged. A silent sample is a lost sample." },
    { n:"6", t:"Order or LOI",
      owner:"Rep, with pricing approval",
      clock:"Quote inside 1 business day of a positive result.",
      does:"Positive biochar trial can convert straight to a paid metric ton order against the inventory on hand. Larger accounts and distributors sign an LOI for Q4 truckload volume. Both are wins. Log the committed volume either way.",
      exit:"A signed order or a signed LOI.",
      log:"Sales Pipeline, plus the committed volume book." },
    { n:"7", t:"Fulfil the order",
      owner:"Ops and Finance",
      clock:"Bulk 7 to 10 business days.",
      does:"Confirm inventory, produce the pick list, book freight, issue the bill of lading, ship, send the shipping confirmation with the BOL number.",
      exit:"Product delivered and receipt confirmed by the customer.",
      log:"Order record, with the BOL number attached." },
    { n:"8", t:"Invoice and collect",
      owner:"Finance",
      clock:"Invoice the day of shipment. Follow at day 30, 45 and 60.",
      does:"Issue the invoice on the agreed terms. Chase it on a schedule, not on a feeling. Sales gets told the moment an account goes past 45 days, because sales should not be selling into a delinquent account.",
      exit:"Cash received.",
      log:"Accounting system. Sales sees a paid flag on the account." },
    { n:"9", t:"Reorder and reference",
      owner:"Rep",
      clock:"Contact at 30 days after delivery.",
      does:"Ask how it performed in production, ask for the reorder, ask for permission to write the result up as a reference. Every closed order is a case study candidate under the claim rules in playbook 03.",
      exit:"Reorder booked or a written reference approved.",
      log:"Sales Pipeline, reorder rate is a lagging KPI." },
  ],

  /* Grounded in the canonical facts block: biochar half pound, pellets 1 lb, crumble 1 lb,
     4 to 7 business days, and the claim rules from playbook 03. */
  kit: {
    intro:"One kit, one packing list, no variation. A rep should never assemble a sample by hand or decide what to include.",
    contents:[
      "Product, in the canonical sample size. Biochar half pound. Absorbent pellets 1 lb. Absorbent crumble 1 lb.",
      "Spec sheet for the product shipped. Printed, current version, no draft watermarks.",
      "Safety data sheet for the product shipped.",
      "OMRI listing document. Nothing that says IBI Certified or USDA Organic, because neither is true.",
      "A one page application card: how to apply it, at what rate, and what to look for.",
      "A card with the rep name, the sales line (225) 398-9286 and the reply address.",
    ],
    rules:[
      "Samples are free. Freight on samples is on us. That is the offer in every campaign and it does not get renegotiated in the thread.",
      "Never ship a sample without a written success metric. A sample with no metric cannot be followed up and becomes a silent no.",
      "Never ship outside the freight ring without a decision. Biochar ships within 500 miles of White Castle. Absorbent ships nationwide with the buyer paying freight on real orders.",
      "One sample per company, not per contact. Two people at the same account asking is one shipment and one thread.",
    ],
  },

  /* The fields that must exist before fulfillment can act. This is the intake contract
     between sales and whoever packs the box. */
  intake:[
    "Company legal name",
    "Contact name, title, email, direct phone",
    "Ship to street address, including dock or delivery notes",
    "Product requested, and which ICP code the account carries",
    "Written success metric, quoted from the prospect",
    "What they use today and what it costs them",
    "Rough volume band if it works",
    "Rep who owns the account",
  ],

  /* Honest gap list. These do not exist in the repo today. Naming them here is the point. */
  gaps:[
    { t:"No fulfillment owner", d:"No named person packs and ships samples, and no service level is agreed with them. Until this is assigned, step 4 has no owner and the whole motion stalls at the box.", who:"Victor" },
    { t:"No sample inventory count", d:"Nobody knows how many sample kits exist or what one costs to pack and ship. Cost per sample is a required input to any funnel economics.", who:"Ops" },
    { t:"No LOI template", d:"The LOI is the stated Month 1 win for large accounts and there is no document to send. Reps cannot close the thing the playbook tells them to close.", who:"Legal, then Victor" },
    { t:"No trial agreement", d:"No written terms covering liability, no warranty language and no confidentiality on a shipped sample.", who:"Legal" },
    { t:"No order paperwork set", d:"No quote template, no terms and conditions, no credit application, no W9 packet, no distributor or territory agreement.", who:"Finance and Legal" },
    { t:"Pricing approval is undefined", d:"No price book, no floor and no discount approval matrix. Held deliberately out of scope on this build. Until it lands, every quote goes through Victor.", who:"Finance" },
  ],
},

/* ============================ 2. TEAM AND RHYTHM ============================ */
team: {
  intro:"A rep should know on day one what they own, what good looks like this week, and which meeting they answer to. This page is that, and nothing else.",

  roles:[
    { r:"Sales lead", owns:"Forecast, pricing approval, escalations, the weekly pipeline review, hiring and ramp sign off.", now:"Victor" },
    { r:"Rep", owns:"Their accounts end to end from reply to reorder. Activity minimums. Data quality on their own records.", now:"OPEN" },
    { r:"Reply duty", owns:"The shared inbox that day. Classify and answer every reply inside 4 business hours. Rotates daily.", now:"OPEN, rotate once there is more than one rep" },
    { r:"Fulfillment", owns:"Sample kits and order shipments. Tracking numbers back into the pipeline the day of shipment.", now:"OPEN" },
    { r:"Data owner", owns:"Roster regeneration, dedupe, verification runs, suppression list. See the System of Record page.", now:"OPEN, currently unassigned after handoff" },
  ],

  /* Ramp is a gate sequence, not a calendar. A rep does not touch a live account until
     week 2 sign off, because a bad claim is not recoverable. */
  ramp:[
    { wk:"Week 1", t:"Learn the product and the claim rules",
      does:"Read playbook 01, 02 and 03. Handle the product. Walk the White Castle site if possible.",
      gate:"Passes a claim discipline quiz cold. Must state without prompting: OMRI Listed yes, IBI tested not certified, no USDA Organic, no feed or health claims, carbon figures are estimates. A miss here is a fail, not a note." },
    { wk:"Week 2", t:"Learn the buyer and the tool",
      does:"Read playbook 04, 05 and 07. Shadow 5 live reply threads. Work the Sales Pipeline section until account lookup, logging and stage changes are second nature.",
      gate:"Runs a mock discovery call end to end and logs it correctly in the pipeline without help." },
    { wk:"Week 3", t:"Live, supervised",
      does:"Take reply duty with the sales lead reviewing every outbound before it sends. Own 10 real accounts.",
      gate:"10 replies handled with no claim error and no unlogged touch." },
    { wk:"Week 4", t:"Live, own book",
      does:"Full account book. Activity minimums apply from the first day of this week.",
      gate:"First sample shipped with a written success metric on the record." },
  ],

  /* Activity minimums are per rep per day. They are floors, not targets, and they are the
     only numbers a rep is held to before pipeline exists. */
  minimums:[
    { m:"Replies answered inside 4 business hours", v:"100 percent" },
    { m:"New accounts worked per day", v:"15" },
    { m:"Calls placed per day", v:"20" },
    { m:"Conversations started per week", v:"10" },
    { m:"Discovery calls booked per week", v:"3" },
    { m:"Samples requested per week", v:"3" },
    { m:"Sample follow ups due and completed", v:"100 percent" },
    { m:"Records updated same day as the touch", v:"100 percent" },
  ],

  scorecard:{
    intro:"Leading metrics are what a rep controls today. Lagging metrics are what the business is graded on. Review leading weekly and lagging monthly. Targets below are floors to set against real output once there is a month of data, and the sales lead sets them.",
    leading:["Conversations started","Discovery calls booked","Samples requested","Samples shipped","Sample follow ups completed on time","Orders and LOIs presented"],
    lagging:["Orders shipped","LOIs signed","Committed Q4 volume","Revenue","Reorder rate","Reference wins"],
    ratios:["Account to conversation","Conversation to sample","Sample to order or LOI presented","Presented to signed","Segment to committed volume"],
  },

  rhythm:[
    { when:"Daily, 15 minutes, start of day", t:"Standup",
      agenda:"Yesterday actual against minimums. Today plan. Anything blocked. Any reply older than 4 hours. No deal review here, it is a clock check." },
    { when:"Weekly, 60 minutes", t:"Pipeline review",
      agenda:"1. Activity against minimums, per rep, on screen. 2. Every deal past Discovery, by exit criteria, not by feeling. A deal that cannot state its exit criteria moves back a stage. 3. Every sample shipped over 21 days ago with no result, closed or escalated. 4. New accounts added and data quality flags. 5. Blockers for the sales lead to own." },
    { when:"Weekly, 20 minutes", t:"Forecast",
      agenda:"Committed, best case and omitted. Committed means signed or verbally agreed with paperwork moving. Anything else is best case. The forecast number is the sales lead's number, not the sum of rep optimism." },
    { when:"Monthly, 90 minutes", t:"Business review",
      agenda:"Conversion ratios against last month. Which ICPs are converting and which are burning list. Campaign performance from the Instantly Logic page. Capacity check against ops. What we stop doing." },
  ],

  routing:[
    "Inbound web form leads route to the rep who owns that ICP. If no owner, they go to reply duty.",
    "Speed to lead on an inbound form is 1 business hour. Inbound is a warm hand raise and decays fast.",
    "An account belongs to one rep. The account, not the contact. Two contacts at one company is one owner.",
    "Ownership lapses after 30 days with no logged touch and the account returns to the pool.",
    "Any account over a volume threshold set by the sales lead is co owned with the sales lead from first contact.",
  ],

  qa:{
    intro:"Five checks on any outbound email or call. Reply duty output is spot checked weekly, ramp output is checked 100 percent.",
    items:[
      "Claim safe. Every claim matches its proof tier. No IBI Certified, no USDA Organic, no feed or health claim, carbon is an estimate.",
      "No price quoted without approval.",
      "One clear ask, and it is the sample.",
      "House style. No em dashes, no en dashes, no hyphens in prose.",
      "Logged. The touch is in the pipeline before the rep moves on.",
    ],
  },
},

/* ============================ 3. SYSTEM OF RECORD ============================ */
records: {
  decision:"The Sales Pipeline section of this app is the system of record. It is the CRM. A thing that is not in it did not happen. Everything else on this page exists to keep that statement true.",

  /* Precedence matters: this is the order build-roster.mjs actually applies, so it is the
     order a human should trust too. */
  layers:[
    { l:"Companies", f:"sales/roster-data.js", what:"The company roster the pipeline reads.", mode:"GENERATED. Never hand edit. Rebuilt by scripts/build-roster.mjs from the handoff CSVs. A hand edit is silently reverted on the next run." },
    { l:"CRM accounts", f:"sales/hubspot-data.js", what:"Real relationships imported from HubSpot, merged and deduped into the roster.", mode:"Imported snapshot. Its header counts are hardcoded and drift from the array beneath them, so trust the array, not the header." },
    { l:"Contacts", f:"handoff/enrichment/instantly/ALL-{absorbent,biochar}-prospects.csv", what:"Contact rows with addresses.", mode:"Working files, appended by enrichment runs." },
    { l:"Verification", f:"handoff/enrichment/instantly/verification-results.csv", what:"Which addresses were actually tested and what came back.", mode:"Output of a verification run. An address that is not here is unverified, not valid." },
    { l:"Sending", f:"Instantly workspace", what:"Live campaigns and who has been sent to.", mode:"External. Instantly is a sending tool, not a CRM. A contact that exists only in Instantly is invisible the moment they reply." },
    { l:"Desk research", f:"handoff/*.csv", what:"The triage, ICP assignment, geo verdict and score behind every company.", mode:"The upstream source. Change the roster by changing these and rebuilding." },
  ],

  writePath:[
    { t:"A rep writes here", d:"The Sales Pipeline section only. Stage, notes, next step, dates, tracking numbers, committed volume. This is the whole surface a rep touches." },
    { t:"A rep never writes here", d:"roster-data.js, hubspot-data.js and any CSV in handoff. These are generated or imported. Edits are lost." },
    { t:"New company found", d:"It goes into the desk research CSV with an ICP code, a geo verdict and a written reason, then the roster is rebuilt. Not typed into the app." },
    { t:"Company should be killed", d:"Mark it dead in the desk research CSV with a written reason. 120 companies already carry one. A silent delete loses the reason and the company gets researched again in six months." },
    { t:"Contact bounces", d:"Mark invalid in the verification file and add to the suppression list. Never re send to a bounced address." },
  ],

  required:{
    intro:"Fields that must be present before a record can advance. The pipeline review enforces these, so a missing field is a stage reversal, not a note.",
    rows:[
      { s:"Prospect to Contacted", need:"Named contact, verified email, ICP code" },
      { s:"Contacted to Discovery", need:"A two way reply exists and is logged" },
      { s:"Discovery to Sample", need:"Use case, buyer name, ship to city, volume band" },
      { s:"Sample to LOI or Order", need:"Written success metric, ship date, tracking number, result against the metric" },
      { s:"LOI to Signed", need:"Committed volume, product, timeframe, signer name" },
    ],
  },

  hygiene:[
    "Dedupe is on the account, folding punctuation, possessives and corporate suffixes, so J. Berry Nursery lands on the existing J Berry Nursery. Check the also known as row on anything that looks merged.",
    "Role inboxes such as info@ and sales@ are phone accounts. They are never campaigned. There are 98 of them on file.",
    "An address with no verification result is unverified, not valid. 183 addresses on file have never been submitted, which is the cheapest work available.",
    "Bounce rate over 2 percent means stop sending and re verify, not send slower.",
    "Weekly: run the audit. Accounts with no owner, accounts with no touch in 30 days, samples shipped over 21 days with no result, contacts with no ICP code.",
  ],

  regen:{
    intro:"The one procedure that leaves with the person who built it. Write it down or the roster freezes.",
    steps:[
      "Edit or add rows in the handoff desk research CSVs. Precedence is the order listed in the layers table above and later sources only fill fields earlier ones left empty.",
      "From the website repo root run: node scripts/build-roster.mjs",
      "It writes website/sales/roster-data.js as window.ROSTER. Commit the result.",
      "Every record carries origin, verify and needs, so an import never masquerades as research. Rows from the CRM or the flat sheet arrive unverified on purpose.",
      "Deploy the Sales OS as its own Pages project. It is not a subdirectory of the marketing site, because sales/functions/_middleware.js only runs as a Pages Function when sales/ is the project root. Served any other way the roster, the COGS and the price floors are public.",
    ],
  },

  counts:{
    intro:"Snapshot from 2026-08-16. Regenerate rather than trusting these a week out.",
    rows:[
      { k:"Companies in roster-data.js", v:"921" },
      { k:"Dead or rejected with a written reason", v:"120" },
      { k:"Live and carrying an ICP", v:"661" },
      { k:"Live with no ICP assigned", v:"140" },
      { k:"Companies with at least one contact address", v:"166" },
      { k:"Live ICP companies with nobody to write to", v:"495" },
      { k:"Contact rows on file", v:"1,184" },
      { k:"Carrying an email address", v:"644" },
      { k:"Verified valid", v:"405" },
      { k:"Has an address, never verified", v:"183" },
      { k:"Pushed into Instantly", v:"285, all biochar" },
    ],
    note:"The binding number is 166. That is how many companies can actually be written to. Absorbent has 300 live companies and zero leads in Instantly.",
  },
},

/* ============================ 4. CONTINUITY RUNBOOK ============================ */
runbook: {
  intro:"What the department needs in order to keep running when the person who built it is not here. Read the two open sections at the bottom first, because they are what actually breaks.",

  systems:[
    { s:"Instantly", use:"Cold email sending. 15 campaigns, 285 leads pushed.", owner:"OPEN", cost:"OPEN", risk:"Sending stops or reputation burns if bounce rate is not watched. Nobody currently owns the suppression list." },
    { s:"Apollo", use:"Contact discovery and enrichment. Roughly 2,600 credits, not 125. Free tier returns names and titles. Org search is fuzzy, so verify the match.", owner:"OPEN", cost:"OPEN", risk:"Credits burn on bad matches. Filters are in sales-department/APOLLO-PROSPECTING-FILTERS.md." },
    { s:"HubSpot", use:"Source of the imported CRM layer, 71 contacts merged.", owner:"OPEN", cost:"OPEN", risk:"Read only import today. If HubSpot becomes the live CRM the write path on the System of Record page has to change first." },
    { s:"Cloudflare Pages", use:"Hosts the marketing site at the apex and the Sales OS as project cs-ops-sales-os.", owner:"Csopsmarketing account", cost:"OPEN", risk:"The Sales OS middleware fails closed and returns 503 for every route while SALES_OS_PASSWORD is unset. Set the secret before the first deploy, not after." },
    { s:"Shopify", use:"Live checkout at the shop subdomain.", owner:"OPEN", cost:"OPEN", risk:"The store still has no policies. Shopify primary domain must move to shop before the apex repoints, or checkout silently loops." },
    { s:"ALLO phone", use:"Sales line (225) 398-9286, voice and SMS.", owner:"OPEN", cost:"OPEN", risk:"Portal work only, no API. CNAM, E911 and spam reputation are still open. The number is printed on the website, the spec sheets, the autoreply emails and the signature, so changing it means changing all four." },
    { s:"A2P 10DLC", use:"Carrier registration for business texting. Submitted 2026-08-14.", owner:"OPEN", cost:"OPEN", risk:"No texting until the campaign is approved. Consent language is live on the site forms and must not be edited without re review." },
    { s:"Google Workspace", use:"Sending inboxes and the reply address victor.jehle@cs-ops.com.", owner:"OPEN", cost:"OPEN", risk:"Inbox reputation. Also note the lead recipients use cs ops addresses while some PDFs and form config route elsewhere. Fix before volume." },
    { s:"Git repo", use:"This department. Private repo, branch main is production.", owner:"Jesse today", cost:"None", risk:"The build is gated by scripts/check-dashes.mjs. It skips sales/ and fails silently if a dash appears in a website file." },
  ],

  jobs:[
    { f:"Daily", j:"Answer every reply inside 4 business hours. Run standup. Check bounce rate." },
    { f:"Daily", j:"Push sample tracking numbers into the pipeline the day of shipment." },
    { f:"Weekly", j:"Pipeline review and forecast. Run the data hygiene audit on the System of Record page." },
    { f:"Weekly", j:"Verify the unverified. 183 addresses on file have never been submitted." },
    { f:"Monthly", j:"Business review. Rebuild the roster if the desk research CSVs have changed." },
    { f:"Quarterly", j:"Re derive the freight radii against real quotes. The current zones were modeled at prices the live list price has already superseded." },
  ],

  breaks:[
    "Replies pile up in an unowned inbox and the campaign spend is wasted. This is the fastest failure and it takes about a week.",
    "Sample follow ups lapse past day 21 and every shipped sample becomes a silent no.",
    "The roster freezes. Nobody rebuilds roster-data.js, so new desk research never reaches the app.",
    "Bounce rate drifts above 2 percent unnoticed and the sending domains lose reputation. Recovering a burned domain takes months.",
    "The A2P campaign is approved and nobody notices, so texting sits unused.",
    "Absorbent stays at zero in Instantly while 300 live companies sit in the roster.",
  ],

  /* Deliberately explicit. This is the ask list, not a wish list. */
  needs:[
    { t:"Name a fulfillment owner", d:"Sample to Cash step 4 has no owner. Without it the whole motion stops at the box.", who:"Victor" },
    { t:"Name a data owner", d:"Roster regeneration, verification runs, dedupe and the suppression list. Currently unassigned.", who:"Victor" },
    { t:"Credential inventory", d:"For every system above: who holds the login, what it costs, when it renews, and who is the backup. I can fill the table the moment somebody gives me the answers. I will not guess them." },
    { t:"Legal paper set", d:"LOI template, trial and sample agreement, terms and conditions, credit application, W9 packet, distributor and territory agreement. None exist in the repo.", who:"Legal" },
    { t:"Fix the inbound route", d:"Site forms route to a different domain than the one the team actually reads. Confirm the correct recipients and repoint the form config and the PDFs." },
    { t:"Set the scorecard targets", d:"The activity minimums are floors I set from the motion. The conversion targets need one month of real output before they mean anything.", who:"Victor" },
  ],
},

};
