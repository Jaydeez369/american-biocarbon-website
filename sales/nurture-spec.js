/* The nurture sequences: structure, cadence and PLACEHOLDER copy.
 *
 * Everything here is a suggestion. The placeholder text shows greyed in the editor boxes on
 * Execute > Nurture Plan, and the moment Victor or Daniel type over it, what they typed is
 * what the email says. Saved copy lives in D1 (kind "nurture", one record per email id) and
 * wins over anything in this file. Nothing here is sent by anything yet.
 *
 * Facts in the placeholders come from sales-playbook/01-company-and-products.md and
 * website/data.js as of 2026-09-16: biochar $450 per metric ton, absorbents $275 per US ton in
 * 2,000 lb super sacks, free 1 lb samples in 4 to 7 business days, OMRI Listed, Puro.earth
 * CORC, patented, IBI tested (never certified). No dashes of any kind in customer copy.
 *
 * Shape:
 *   sequence { id, name, who, cadence, sender, footerNote, emails:[...] }
 *   email    { id, day, title, intent, variants?, copy:{...placeholder fields} }
 * Field names match what buildNurtureEmail (functions/api/_email.js) reads.
 */
(function(){
  const SITE = "https://americanbiocarbon.com";
  const SPEC_PELLETS = SITE + "/assets/spec-sheets/Absorbent-Pellets-Specification-Sheet.pdf";
  const SPEC_BIOCHAR = SITE + "/assets/spec-sheets/Biochar-Premium-Specification-Sheet.pdf";
  const BOOK = "{{calendarLink}}";
  const V = "Victor Jehle\nAmerican BioCarbon\n(225) 398 9286";
  const TEAM = "The team at American BioCarbon\n(225) 398 9286";

  const A = {
    id: "A", name: "Family", who: "Engaged and Customer stage accounts, plus past ABC customers",
    cadence: "One a week, then monthly", sender: "Victor Jehle <victor@send.americanbiocarbon.com>",
    footerNote: "You are receiving this because you are a customer of American BioCarbon or have worked with us on a sample.",
    emails: [
      { id:"A1", day:0, title:"What is new at the plant",
        intent:"Reintroduce Victor by name, one real update from White Castle, set the expectation of one short note a week.",
        copy:{
          subject:"What is new at White Castle",
          preheader:"One short note from Victor, once a week.",
          heading:"Quick update from the plant",
          greeting:"Hi {{firstName}},",
          paras:[
            "Victor here from American BioCarbon. You have bought from us or tested our material, so I want to keep you in the loop on what is happening at the plant.",
            "Right now we are running bagasse through the line for the Q4 ramp. Biochar is on hand today and absorbent pellets and crumble ship by the US ton in 2,000 lb super sacks.",
            "I will send one short note a week, nothing more. If it is not useful, the unsubscribe link at the bottom works and I will not take it personally.",
          ],
          ctaLabel:"Reply and tell me what you are working on this season", ctaHref:"mailto:victor.jehle@cs-ops.com",
          imageUrl:"", imageAlt:"", signoff:V, style:"classic",
        }},
      { id:"A2", day:7, title:"One customer, one result",
        intent:"A short proof point from an existing account: what they used, on what, what changed.",
        copy:{
          subject:"What one customer did with a truckload",
          preheader:"A real result from a real account.",
          heading:"One customer, one result",
          greeting:"Hi {{firstName}},",
          paras:[
            "[Customer type, region] switched [what they were using] for our [pellets / crumble / biochar] on [application].",
            "What changed: [fewer bags per spill / less disposal weight / better moisture control / faster compost cure]. Their words, not ours: \"[one sentence quote]\".",
            "If you want the numbers for your operation, reply with your monthly volume and I will run them.",
          ],
          ctaLabel:"Reply with your volume", ctaHref:"mailto:victor.jehle@cs-ops.com",
          imageUrl:"", imageAlt:"", signoff:V, style:"classic",
        }},
      { id:"A3", day:14, title:"How to use it right",
        intent:"One practical how to for their line. Biochar: 10 to 20% inclusion. Absorbent: 5:1 pickup, sizing a spill kit. Bedding: moisture and turnover.",
        copy:{
          subject:"Getting the most out of the material",
          preheader:"The one thing customers ask us most.",
          heading:"How to use it right",
          greeting:"Hi {{firstName}},",
          paras:[
            "Biochar: blend at 10 to 20% by volume into your compost or soil mix. Pre charge it with compost or a liquid feed for two weeks before it goes in the ground and it starts working on day one instead of week six.",
            "Absorbent: our pellets and crumble hold up to 5 times their weight. Size a spill kit at roughly one 2,000 lb sack per [X] gallons of the fluid you handle most, and store it dry.",
            "The spec sheets are linked below if you want the lab numbers behind that.",
          ],
          ctaLabel:"Open the spec sheets", ctaHref:SITE + "/technical",
          imageUrl:"", imageAlt:"", signoff:V, style:"classic",
        }},
      { id:"A4", day:21, title:"The economics",
        intent:"The per ton math against what they use today. Absorbents: fewer bags, less disposal weight. Biochar: input cost per acre or per yard.",
        copy:{
          subject:"The per ton math",
          preheader:"What it costs against what you use now.",
          heading:"The economics, in one paragraph",
          greeting:"Hi {{firstName}},",
          paras:[
            "Absorbent pellets and crumble are $275 per US ton in 2,000 lb super sacks. Because they hold up to 5 times their weight, a ton of ours picks up what [X] tons of clay does, and you pay disposal on a fraction of the weight.",
            "Biochar is $450 per metric ton. At a 10% blend that is about $[X] per cubic yard of finished compost, and it does not leave the soil.",
            "Reply with what you are paying today and I will put the comparison in writing for your numbers.",
          ],
          ctaLabel:"Reply and I will run it for your numbers", ctaHref:"mailto:victor.jehle@cs-ops.com",
          imageUrl:"", imageAlt:"", signoff:V, style:"classic",
        }},
      { id:"A5", day:28, title:"The ask",
        intent:"Direct and short. Q4 capacity is coming, volume pricing is tied to a commitment, here is what a reservation looks like.",
        copy:{
          subject:"Q4 supply, and how to lock a price",
          preheader:"Volume pricing needs a volume. Here is how it works.",
          heading:"Reserving Q4 supply",
          greeting:"Hi {{firstName}},",
          paras:[
            "Truckload volumes on every line come online with our Q4 capacity ramp. Volume pricing is tied to a committed volume and a month, not negotiated one load at a time, so the people who reserve first get the best number.",
            "A reservation is one email: the product, a monthly volume, and a start month. I confirm the price and freight to your dock in writing and hold it.",
            "Fifteen minutes on a call is usually enough to get there.",
          ],
          ctaLabel:"Book 15 minutes with Victor", ctaHref:BOOK,
          imageUrl:"", imageAlt:"", signoff:V, style:"classic",
        }},
    ],
  };

  const B = {
    id: "B", name: "New website lead", who: "Anyone who submits a form on americanbiocarbon.com",
    cadence: "E1 instant (the live auto reply), then two a week", sender: "American BioCarbon <leads@send.americanbiocarbon.com>, reply to Victor",
    footerNote: "You are receiving this because you submitted a request on our website.",
    variants: ["biochar", "absorbent", "bedding"],
    emails: [
      { id:"B1", day:0, title:"We got it, here is what happens next", live:true,
        intent:"The live auto reply, one per form. Rendered from the shipped template; edit it in website/functions/api/_email.js, not here." },
      { id:"B2", day:2, title:"What it is and what it is not",
        intent:"One paragraph on the material. What it replaces. What it will not do.",
        copy:{
          subject:"What you actually asked about",
          preheader:"What our material is, in plain words.",
          heading:"What it is, and what it is not",
          greeting:"Hi {{firstName}},",
          paras:[
            "American BioCarbon makes one thing from one input: sugarcane bagasse from Louisiana, turned into biochar and into absorbent pellets and crumble at our plant in White Castle.",
            "It is plant based, made in the USA, and consistent load to load because the feedstock is. It is not a chemical, not a clay, and not a blend.",
            "Reply and tell us what you are using today and we will tell you straight whether ours is a fit.",
          ],
          ctaLabel:"Reply with what you use today", ctaHref:"mailto:victor.jehle@cs-ops.com",
          imageUrl:"", imageAlt:"", signoff:TEAM, style:"classic",
        },
        variantCopy:{
          biochar:{ paras:[
            "Our premium biochar is made from sugarcane bagasse at our plant in White Castle, Louisiana. It is OMRI Listed, Puro.earth CORC certified, and made by a patented process.",
            "It replaces part of your compost, peat or soil blend and stays in the soil for good. It is not a fertilizer on its own and we will never tell you it is.",
            "Reply and tell us what you are blending today and we will tell you straight whether ours is a fit.",
          ]},
          absorbent:{ paras:[
            "Our absorbent pellets and crumble are 100% sugarcane bagasse, made at our plant in White Castle, Louisiana. They hold up to 5 times their weight in oil, fuel, drilling fluid and most non viscous chemicals.",
            "They replace clay and synthetic absorbents on spills, in solidification, and in landfill leachate control, with less weight to dispose of. They are not for viscous or reactive material and we will tell you if yours is one.",
            "Reply and tell us what you are using today and we will tell you straight whether ours is a fit.",
          ]},
          bedding:{ paras:[
            "Our bagasse bedding is 100% sugarcane bagasse from our plant in White Castle, Louisiana. Low dust, absorbent, and consistent bale to bale.",
            "It replaces shavings, straw or sand in stalls and freestalls. We make no feed or animal health claims, and a bedding specialist can talk through moisture and turnover for your barn.",
            "Reply and tell us what you are bedding on today and we will tell you straight whether ours is a fit.",
          ]},
        }},
      { id:"B3", day:5, title:"The sample",
        intent:"How the free 1 lb sample works and what to test it against. If a sample already shipped, this becomes how to run the comparison.",
        copy:{
          subject:"Your free sample, and how to test it",
          preheader:"Free, 1 lb, 4 to 7 business days.",
          heading:"How the sample works",
          greeting:"Hi {{firstName}},",
          paras:[
            "Samples are free, one per company, and ship in 4 to 7 business days. We just need a ship to address and what you plan to test it against.",
            "The test that tells you the most: same spill, same volume, ours beside what you use today. Weigh what you pick up. Weigh what you throw away.",
            "If a sample is already on its way to you, reply when it lands and we will send the comparison sheet.",
          ],
          ctaLabel:"Confirm your ship to address", ctaHref:"mailto:victor.jehle@cs-ops.com",
          imageUrl:"", imageAlt:"", signoff:TEAM, style:"classic",
        },
        variantCopy:{
          biochar:{ paras:[
            "Samples are free, one per company, and ship in 4 to 7 business days. We just need a ship to address and what you plan to blend it into.",
            "The test that tells you the most: two windrows or two beds, one with 10 to 20% biochar in the mix, one without. Compare moisture, cure time and what grows.",
            "If a sample is already on its way to you, reply when it lands and we will send the trial protocol.",
          ]},
        }},
      { id:"B4", day:9, title:"Proof",
        intent:"Certifications and evidence they can check, plus one customer result. Never IBI certified.",
        copy:{
          subject:"The paperwork behind it",
          preheader:"Certifications you can check yourself.",
          heading:"Proof, not promises",
          greeting:"Hi {{firstName}},",
          paras:[
            "Our biochar is OMRI Listed and Puro.earth CORC certified, the process is patented, and the material has been tested to IBI standards. Every one of those is checkable on the certifier's own site.",
            "Our absorbents have been in service on drilling sites, at spill response companies and under landfill liners across the Gulf Coast.",
            "[One customer result: who, what, what changed.]",
          ],
          ctaLabel:"See the certifications", ctaHref:SITE + "/technical",
          imageUrl:"", imageAlt:"", signoff:TEAM, style:"classic",
        }},
      { id:"B5", day:14, title:"Pricing and the next step",
        intent:"List price by the unit, in writing. Volume pricing needs a volume commitment.",
        copy:{
          subject:"Pricing, in writing",
          preheader:"List prices and how volume pricing works.",
          heading:"What it costs",
          greeting:"Hi {{firstName}},",
          paras:[
            "Premium biochar: $450 per metric ton. Absorbent pellets and crumble: $275 per US ton, sold in 2,000 lb super sacks. Samples are free.",
            "Volume pricing is tied to a committed monthly volume and a start month. Truckload supply on every line comes online with our Q4 capacity ramp, and reservations are taken now.",
            "The fastest next step is a short call with Victor.",
          ],
          ctaLabel:"Book a call", ctaHref:BOOK,
          imageUrl:"", imageAlt:"", signoff:TEAM, style:"classic",
        }},
    ],
  };

  const C = {
    id: "C", name: "Order status", who: "Anyone with an order in flight",
    cadence: "On each fulfillment event", sender: "American BioCarbon <orders@send.americanbiocarbon.com>, reply to Victor",
    footerNote: "You are receiving this because you placed an order with American BioCarbon.",
    emails: [
      { id:"C1", day:"Order confirmed", title:"Order confirmed",
        intent:"What was ordered, quantity and unit, ship to, expected window, who to call.",
        copy:{
          subject:"Order confirmed: {{orderSummary}}",
          preheader:"We have your order. Here is what happens next.",
          heading:"Your order is confirmed",
          greeting:"Hi {{firstName}},",
          paras:[
            "We have your order for {{orderSummary}}, shipping to {{shipTo}}.",
            "Material is staged at our plant in White Castle, Louisiana. We will confirm the carrier and pickup date within two business days.",
            "Questions about the order go to Victor at (225) 398 9286 or by reply to this email.",
          ],
          ctaLabel:"", ctaHref:"", imageUrl:"", imageAlt:"", signoff:TEAM, style:"minimal",
        }},
      { id:"C2", day:"Freight booked", title:"Freight booked",
        intent:"Carrier, pickup date, what to expect on delivery.",
        copy:{
          subject:"Freight booked for your order",
          preheader:"Carrier and pickup date inside.",
          heading:"Your freight is booked",
          greeting:"Hi {{firstName}},",
          paras:[
            "Your order ships with {{carrier}}, picking up on {{pickupDate}}.",
            "Super sacks are 2,000 lb each and come on pallets. You will need a forklift or a loader at the dock. Bulk deliveries are loaded on site at your direction.",
            "We will send the BOL and tracking as soon as the truck leaves.",
          ],
          ctaLabel:"", ctaHref:"", imageUrl:"", imageAlt:"", signoff:TEAM, style:"minimal",
        }},
      { id:"C3", day:"Shipped", title:"Shipped",
        intent:"BOL or tracking number, ETA.",
        copy:{
          subject:"Your order is on the truck",
          preheader:"BOL and ETA inside.",
          heading:"Shipped",
          greeting:"Hi {{firstName}},",
          paras:[
            "Your order left White Castle today. BOL {{bol}}, expected at {{shipTo}} on {{eta}}.",
            "If the delivery window does not work, reply now and we will reroute with the carrier.",
          ],
          ctaLabel:"", ctaHref:"", imageUrl:"", imageAlt:"", signoff:TEAM, style:"minimal",
        }},
      { id:"C4", day:"Delivered + 2 days", title:"How did it arrive",
        intent:"Did it arrive in good shape, how is it performing. The hinge into sequence A.",
        copy:{
          subject:"How did it arrive?",
          preheader:"Two questions from Victor.",
          heading:"How did it arrive?",
          greeting:"Hi {{firstName}},",
          paras:[
            "Two quick questions now that the material is with you: did it arrive in good shape, and how is it performing?",
            "Reply with a sentence either way. If anything is off I want to hear it first.",
          ],
          ctaLabel:"Reply to Victor", ctaHref:"mailto:victor.jehle@cs-ops.com",
          imageUrl:"", imageAlt:"", signoff:V, style:"classic",
        }},
    ],
  };

  window.NURTURE_SPEC = { sequences:[A, B, C],
    /* Tokens the preview fills so nobody reviews an email that says {{firstName}}. The real
       send fills them from the record. */
    previewTokens:{ firstName:"Sam", orderSummary:"20 MT premium biochar", shipTo:"Baton Rouge, LA", carrier:"Estes", pickupDate:"Oct 14", bol:"EST 4471 2290", eta:"Oct 16", calendarLink:"https://calendar.app.google/example" },
    statuses:["draft","ready","approved"],
  };
})();
