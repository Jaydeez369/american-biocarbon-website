/* ============ VEJ Sales OS — LIVE PIPELINE DATA ============
   Snapshot of the SIBRA (Replit) Sales Pipeline module, pulled from the
   app's API on 2026-07-20 (asset-track--vejprocurement.replit.app /crm).
   This is the REAL book of business: 18 deals, 10 accounts, the offtake
   grid, and the production plan. To refresh, re-export from SIBRA
   (/api/crm/*) and update this file — everything on the Pipeline page
   is computed from these records at render time. */
window.PIPE = {

  /* Stage ladder — probability drives the weighted pipeline (value × prob). */
  stages: [
    { k:"prospect",            label:"Prospect",            prob:5,   cls:"st-prospect" },
    { k:"discovery_qualified", label:"Discovery/Qualified", prob:30,  cls:"st-discovery" },
    { k:"sample_trial",        label:"Sample/Trial",        prob:45,  cls:"st-sample" },
    { k:"quote_proposal",      label:"Quote/Proposal",      prob:60,  cls:"st-quote" },
    { k:"negotiation_close",   label:"Negotiation/Close",   prob:80,  cls:"st-nego" },
    { k:"won_fulfillment",     label:"Won/Fulfillment",     prob:100, cls:"st-won" },
  ],
  confidence: {
    secured:{ label:"Secured (100%)", cls:"cf-secured" },
    medium: { label:"Medium (65%)",   cls:"cf-medium" },
    low:    { label:"Low (30%)",      cls:"cf-low" },
  },

  /* qty×price = deal value. close = expected close (ISO, UTC midnight —
     rendered in local time, same as SIBRA). status: open | won | lost. */
  deals: [
    { deal:"Rose Acres: July Sale",                  customer:"Rose Acres",            product:"CORCS",             sector:"Agriculture",  qty:21, uom:"UNIT", price:130, order:"Recurring", close:"2026-07-20", stage:"negotiation_close",   conf:"secured", status:"open", owner:"Karina Vasquez", notes:"" },
    { deal:"EMS: July Sale",                         customer:"EMS",                   product:"Absorbent pellets", sector:"Oil and Gas",  qty:40, uom:"MT",   price:210, order:"Recurring", close:"2026-07-17", stage:"won_fulfillment",     conf:"secured", status:"open", owner:"Karina Vasquez", notes:"" },
    { deal:"Rosy Soil: November Sale",               customer:"Rosy Soil",             product:"Biochar",           sector:"Soil Blender", qty:20, uom:"MT",   price:450, order:"Recurring", close:"2026-11-30", stage:"sample_trial",        conf:"low",     status:"open", owner:"Karina Vasquez", notes:"HE received our sample and is impressed. Wants to formulate with it and get back to us." },
    { deal:"EMS: June Sale",                         customer:"EMS",                   product:"Absorbent pellets", sector:"Oil and Gas",  qty:80, uom:"MT",   price:210, order:"One-Time",  close:"2026-07-17", stage:"won_fulfillment",     conf:"secured", status:"won",  owner:"Karina Vasquez", notes:"" },
    { deal:"Earth Science Growing: September Sale",  customer:"Earth Science Growing", product:"Biochar",           sector:"Soil Blender", qty:20, uom:"MT",   price:450, order:"Recurring", close:"2026-10-15", stage:"sample_trial",        conf:"low",     status:"open", owner:"Karina Vasquez", notes:"finalizing branding" },
    { deal:"ICT Holdings LLC: July Sale",            customer:"ICT Holdings LLC",      product:"Bagasse Powder",    sector:"Oil and Gas",  qty:12, uom:"MT",   price:300, order:"Recurring", close:"2026-07-31", stage:"quote_proposal",      conf:"low",     status:"open", owner:"Karina Vasquez", notes:"Weight needed" },
    { deal:"ICT Holdings LLC: July Sale",            customer:"ICT Holdings LLC",      product:"Biochar",           sector:"Oil and Gas",  qty:20, uom:"MT",   price:450, order:"One-Time",  close:"2026-07-31", stage:"quote_proposal",      conf:"low",     status:"open", owner:"Karina Vasquez", notes:"" },
    { deal:"ICT Holdings LLC: July Sale",            customer:"ICT Holdings LLC",      product:"Crumble",           sector:"Oil and Gas",  qty:20, uom:"MT",   price:225, order:"Recurring", close:"2026-07-31", stage:"quote_proposal",      conf:"low",     status:"open", owner:"Karina Vasquez", notes:"" },
    { deal:"McTron Technologies: July Sale",         customer:"McTron Technologies",   product:"Crumble",           sector:"Retail",       qty:40, uom:"MT",   price:215, order:"Recurring", close:"2026-07-28", stage:"quote_proposal",      conf:"medium",  status:"open", owner:"Karina Vasquez", notes:"Awaiting Machiery necessary" },
    { deal:"Ronald Herbert - CORCS – CORCS",         customer:"Ronald Herbert Farms",  product:"CORCS",             sector:"Agriculture",  qty:39, uom:"UNIT", price:130, order:"One-Time",  close:"2026-07-02", stage:"prospect",            conf:"low",     status:"open", owner:"Victor Jehle",   notes:"Pending Puro.Earth" },
    { deal:"Rose Acres - June – CORCS",              customer:"Rose Acres",            product:"CORCS",             sector:"Agriculture",  qty:21, uom:"UNIT", price:130, order:"Recurring", close:"2026-06-30", stage:"prospect",            conf:"low",     status:"open", owner:"Victor Jehle",   notes:"Pending Puro.Earth" },
    { deal:"Rose Acres- May – CORCS",                customer:"Rose Acres",            product:"CORCS",             sector:"Agriculture",  qty:22, uom:"UNIT", price:130, order:"Recurring", close:"2026-07-01", stage:"prospect",            conf:"low",     status:"open", owner:"Karina Vasquez", notes:"Pending Puro.Earth" },
    { deal:"Jim Dupont – Biochar",                   customer:"Dupont Cattle Ranch",   product:"Biochar",           sector:"Agriculture",  qty:50, uom:"MT",   price:400, order:"One-Time",  close:"2026-08-28", stage:"discovery_qualified", conf:"medium",  status:"open", owner:"Karina Vasquez", notes:"Discussed pricing will get feedback" },
    { deal:"Rose Acres- July – Biochar",             customer:"Rose Acres",            product:"Biochar",           sector:"Agriculture",  qty:17, uom:"MT",   price:450, order:"Recurring", close:"2026-07-28", stage:"negotiation_close",   conf:"secured", status:"open", owner:"Karina Vasquez", notes:"July order yet to be processed" },
    { deal:"Ronald Herbert – Biochar",               customer:"Ronald Herbert Farms",  product:"Biochar",           sector:"Agriculture",  qty:30, uom:"MT",   price:450, order:"One-Time",  close:"2026-06-29", stage:"won_fulfillment",     conf:"secured", status:"won",  owner:"Karina Vasquez", notes:"already delivered waiting for NRCS" },
    { deal:"Rose Acres - June – Biochar",            customer:"Rose Acres",            product:"Biochar",           sector:"Agriculture",  qty:16, uom:"MT",   price:450, order:"Recurring", close:"2026-06-25", stage:"won_fulfillment",     conf:"secured", status:"won",  owner:"Karina Vasquez", notes:"June Order" },
    { deal:"Rose Acres - May – Biochar",             customer:"Rose Acres",            product:"Biochar",           sector:"Agriculture",  qty:17, uom:"MT",   price:450, order:"Recurring", close:"2026-05-27", stage:"won_fulfillment",     conf:"secured", status:"won",  owner:"Karina Vasquez", notes:"May Order" },
    { deal:"Eco Vision Designs – Biochar",           customer:"Eco Vision Designs",    product:"Biochar",           sector:"Agriculture",  qty:6,  uom:"MT",   price:400, order:"One-Time",  close:"2026-07-01", stage:"won_fulfillment",     conf:"secured", status:"won",  owner:"Karina Vasquez", notes:"small but scaling" },
  ],

  accounts: [
    { name:"Natures Mastermind",    type:"customer", industry:"" },
    { name:"Rosy Soil",             type:"customer", industry:"" },
    { name:"Earth Science Growing", type:"customer", industry:"" },
    { name:"EMS",                   type:"customer", industry:"" },
    { name:"ICT Holdings LLC",      type:"customer", industry:"" },
    { name:"McTron Technologies",   type:"customer", industry:"" },
    { name:"Dupont Cattle Ranch",   type:"customer", industry:"" },
    { name:"Ronald Herbert Farms",  type:"customer", industry:"" },
    { name:"Rose Acres",            type:"prospect", industry:"Poultry" },
    { name:"Eco Vision Design",     type:"prospect", industry:"" },
  ],

  contacts: [
    { name:"Nick Robison", account:"Rose Acres",        title:"", email:"nrobison@roseacre.com",       phone:"812-497-2557",
      dropOff:"4580 Airline-Goldmine Road, Canon, GA 30520, United States" },
    { name:"Tim Watkins",  account:"Eco Vision Design", title:"", email:"timothy@ecovisiondesign.com", phone:"+1 (239) 789-5919", dropOff:"" },
  ],

  leads: [
    { company:"Eco Vision Design", contact:"Tim Watkins", email:"timothy@ecovisiondesign.com", phone:"+1 (239) 789-5919",
      source:"website", status:"qualified", converted:true, convertedTo:"Eco Vision Designs – Biochar", convertedDate:"2026-06-30" },
  ],

  team: [
    { name:"Victor Jehle",     username:"vjehle",     role:"admin" },
    { name:"Karina Vasquez",   username:"Kvasquez",   role:"user" },
    { name:"Daniel Fonseca",   username:"DFonseca",   role:"user" },
    { name:"Laura Mow-Noda",   username:"LMow-noda",  role:"user" },
    { name:"Lucia Mercado",    username:"LMercado",   role:"user" },
    { name:"Cristina Kelly",   username:"CKelly",     role:"user" },
    { name:"Isabel Lima",      username:"DrLima",     role:"user" },
    { name:"Daniel Villamizar",username:"Dvillamizar",role:"user" },
    { name:"Jonathan Davila",  username:"jdavila",    role:"user" },
  ],

  /* ---- Offtake pipeline: expected MT per customer × product per quarter.
     vols keys index into quarters[]; confirmed = won-deal MT inside that
     quarter (shown green in SIBRA). ---- */
  offtake: {
    quarters: ["Q2 2026","Q3 2026","Q4 2026","Q1 2027","Q2 2027"],
    rows: [
      { customer:"McTron Technologies",  product:"Crumble",           sector:"Turf and Course Maintenance",  conf:"Medium", price:215, freq:"Recurring",
        vols:{ "Q3 2026":120, "Q4 2026":120, "Q1 2027":120, "Q2 2027":120 }, confirmed:{},
        notes:"Expecting to order 40 MT every week but will start with 40MT per month" },
      { customer:"McTron Technologies",  product:"Biochar",           sector:"Turf and Course maintenance",  conf:"Medium", price:400, freq:"Recurring",
        vols:{ "Q3 2026":60 }, confirmed:{}, notes:"starting with 20 per month" },
      { customer:"Dupont Cattle Ranch",  product:"Biochar",           sector:"Agriculture/ cattle grazing soil", conf:"Medium", price:400, freq:"One-Time",
        vols:{ "Q4 2026":50 }, confirmed:{},
        notes:"has 800-1000 acres to do and projecting we start with 50 acres as a test for first year." },
      { customer:"Ronald Herbert Farms", product:"Biochar",           sector:"Agriculture",                  conf:"Medium", price:450, freq:"One-Time",
        vols:{ "Q2 2026":0, "Q3 2026":30 }, confirmed:{ "Q3 2026":30 }, notes:"" },
      { customer:"Eco Vision Design",    product:"Biochar",           sector:"Nurseries/Farms",              conf:"Medium", price:400, freq:"Recurring",
        vols:{ "Q3 2026":6 }, confirmed:{ "Q3 2026":6 }, notes:"" },
      { customer:"Rose Acres",           product:"Biochar",           sector:"Manure Granulation",           conf:"Medium", price:450, freq:"Recurring",
        vols:{ "Q2 2026":40, "Q3 2026":80, "Q4 2026":120, "Q1 2027":120, "Q2 2027":120 }, confirmed:{ "Q3 2026":33 }, notes:"" },
      { customer:"ICT Holdings LLC",     product:"Biochar",           sector:"Oil and Gas",                  conf:"Medium", price:450, freq:"Recurring",
        vols:{ "Q3 2026":40, "Q4 2026":60, "Q1 2027":60, "Q2 2027":60 }, confirmed:{}, notes:"LCM solutions" },
      { customer:"ICT Holdings LLC",     product:"Bagasse Powder",    sector:"Oil and Gas",                  conf:"Medium", price:300, freq:"Recurring",
        vols:{ "Q3 2026":20, "Q4 2026":30, "Q1 2027":30, "Q2 2027":30 }, confirmed:{}, notes:"" },
      { customer:"ICT Holdings LLC",     product:"Crumble",           sector:"Oil and Gas",                  conf:"Medium", price:225, freq:"Recurring",
        vols:{ "Q3 2026":40, "Q4 2026":60, "Q1 2027":60, "Q2 2027":60 }, confirmed:{}, notes:"" },
      { customer:"EMS",                  product:"Absorbent pellets", sector:"Oil and Gas",                  conf:"Medium", price:210, freq:"Recurring",
        vols:{ "Q3 2026":1000, "Q4 2026":1200, "Q1 2027":1500, "Q2 2027":1500 }, confirmed:{ "Q3 2026":80 }, notes:"" },
      { customer:"Natures Mastermind",   product:"Biochar",           sector:"Agriculture/ Horticulturist",  conf:"Low",    price:450, freq:"Recurring",
        vols:{ "Q3 2026":20, "Q4 2026":60, "Q1 2027":60, "Q2 2027":60 }, confirmed:{},
        notes:"Expectations from discussions:\nWorking Year 1 raw material volume outlook (subject to change):\nMonth 1: ~40–45 tons\nMonth 2: ~55–60 tons\nMonth 3: ~75–80 tons\nMonths 4–6: ~105–160 tons/month\nMonths 7–9: ~190–255 tons/month\nMonths 10–12: ~285–365 tons/month" },
    ],
  },

  /* ---- Production plan: planned MT per product per quarter (null = not set).
     Feeds the Executive Dashboard's Sales vs Production chart. ---- */
  production: {
    quarters: ["Q2 2026","Q3 2026","Q4 2026","Q1 2027","Q2 2027"],
    products: [
      { p:"Absorbent Pellets (10% infused)", mt:{} },
      { p:"Absorbent Pellets (40% infused)", mt:{} },
      { p:"Absorbent pellets",               mt:{ "Q2 2026":600, "Q3 2026":1266, "Q4 2026":3395, "Q1 2027":4000, "Q2 2027":5900 } },
      { p:"Bagasse Fines <2mm",              mt:{} },
      { p:"Bagasse Powder",                  mt:{} },
      { p:"Biochar",                         mt:{ "Q2 2026":100, "Q3 2026":100, "Q4 2026":267, "Q1 2027":261, "Q2 2027":680 } },
      { p:"CORCS",                           mt:{ "Q3 2026":113, "Q4 2026":347, "Q1 2027":340, "Q2 2027":890 } },
      { p:"Crumble",                         mt:{} },
      { p:"Crumble (10% infused)",           mt:{} },
      { p:"Crumble (40% infused)",           mt:{ "Q3 2026":0 } },
      { p:"Grow Ready Biosoil",              mt:{ "Q4 2026":3325, "Q1 2027":3325 } },
      { p:"Grow Ready Fiber",                mt:{} },
      { p:"Micronized Biochar",              mt:{} },
    ],
  },

  /* Sample Tracker → sale conversion status (from SIBRA Sample Tracker). */
  sampleConversions: {
    sampled:3, converted:0,
    accounts: [
      { name:"McTron Technologies",   firstSample:"2026-07-07", converted:false },
      { name:"Earth Science Growing", firstSample:"2026-07-09", converted:false },
      { name:"ICT Holdings LLC",      firstSample:"2026-07-09", converted:false },
    ],
  },
};
