/* Cold email variants: the whole bank, and the PLACEHOLDER draft for each.
 *
 * Eight variants, four absorbent and four biochar. One to two sentences and one ask. This
 * replaces the 17 campaign copy bank that lived in outreach-data.js until 2026-09-16. What a
 * person types over in Execute > Cold Email wins; the placeholder here is the fallback. A
 * variant is canonical once Victor marks it so, and canonical copy is what gets pasted into
 * Instantly. Nothing here is sent by anything.
 *
 * Rules the placeholders follow and the gate checks: no dash of any kind, no unapproved
 * claim, no price in a first touch, first name token with a fallback, signature is three
 * lines and nothing else. Facts as of 2026-09-16: 5:1 pickup on absorbents, 2,000 lb super
 * sacks by the US ton, free samples in 4 to 7 business days, biochar OMRI Listed and Puro
 * certified, IBI tested (never certified). */
(function(){
  const SIG = "Victor Jehle\nAmerican BioCarbon\n(225) 398 9286";
  const V = (id, line, icp, title, intent, subject, body, ask) => ({ id, line, icp, title, intent,
    copy:{ subject, greeting:"Hi {{firstName}},", body, ask, signoff:SIG } });

  const ABSORBENT = [
    V("AB1","absorbent","Oil and gas, spill response","Spill response",
      "Operators and spill response contractors buying clay by the pallet.",
      "Fewer bags on the next spill",
      "We make a plant based absorbent in Louisiana that holds up to 5 times its weight, so a spill takes fewer bags and you pay disposal on a fraction of the weight.",
      "Want a free 1 lb sample to run beside what you use now?"),
    V("AB2","absorbent","Drilling, HDD, solidification","Drilling fluid solidification",
      "HDD contractors and drilling waste handlers solidifying mud for haul off.",
      "Solidifying mud with less weight to haul",
      "Our bagasse absorbent solidifies drilling fluid at 5 to 1 by weight, which means lighter loads to the landfill and fewer of them.",
      "Can I send you a free sample and a one page spec to test on your next job?"),
    V("AB3","absorbent","Landfill and environmental","Landfill leachate",
      "Landfill operators and environmental service companies handling leachate and free liquids.",
      "Free liquids without the clay weight",
      "We supply a bagasse absorbent that takes free liquids to paint filter at 5 to 1 by weight, shipped by the US ton in 2,000 lb super sacks from Louisiana.",
      "Worth a free sample to compare against your current sorbent?"),
    V("AB4","absorbent","Distributors and resellers","Absorbent distributor",
      "Industrial supply distributors carrying clay and synthetic absorbents.",
      "A plant based absorbent for your line card",
      "We make a 100 percent bagasse absorbent that outperforms clay on pickup and weight, and we are opening distribution in {{state}}.",
      "Open to a short call about margin and a stocking sample?"),
  ];

  const BIOCHAR = [
    V("BC1","biochar","Compost and organics","Composter",
      "Commercial composters and organics recyclers within 500 miles of White Castle.",
      "Faster cure on the pad",
      "We make OMRI Listed biochar from sugarcane bagasse in Louisiana, and composters blending it at 10 to 20 percent see better moisture control and a faster cure.",
      "Want a free sample and a side by side windrow protocol?"),
    V("BC2","biochar","Nurseries and soil blenders","Soil blender",
      "Potting mix and soil blend manufacturers, growing media suppliers.",
      "A carbon input that stays in the blend",
      "Our bagasse biochar is OMRI Listed and Puro certified, holds 3 times its weight in water, and is on hand today by the metric ton.",
      "Can I ship you a free sample to trial in a blend?"),
    V("BC3","biochar","Farms and ranches","Row crop and ranch",
      "Farms and ranches building soil carbon, especially in LA, MS and TX.",
      "Soil carbon you can see in the field",
      "We make OMRI Listed biochar in White Castle, Louisiana, and growers within a few hours of us are trialing it on {{crop}} this season.",
      "Would a free sample and the application rate sheet be useful?"),
    V("BC4","biochar","Distributors and ag retail","Biochar distributor",
      "Ag retailers and soil amendment distributors within 500 miles.",
      "Biochar made 500 miles from you",
      "We produce OMRI Listed, Puro certified biochar in Louisiana with 80 metric tons finished and ready, and we are looking for a distribution partner in {{state}}.",
      "Open to a short call about pricing by the truckload?"),
  ];

  window.COLDEMAIL_SPEC = {
    lines:[ { id:"absorbent", name:"Absorbent", variants:ABSORBENT }, { id:"biochar", name:"Biochar", variants:BIOCHAR } ],
    /* Filled in the preview only. Instantly fills the real ones from the lead. */
    previewTokens:{ firstName:"Sam", companyName:"Gulf South Environmental", state:"Texas", crop:"sugarcane" },
    fromName:"Victor Jehle", fromAddress:"victor@progreaux.com", previewTo:"sam@gulfsouthenv.com",
    statuses:["draft","ready","canonical"],
  };
})();
