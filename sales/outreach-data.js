/* ICP taxonomy and product facts for the Sales OS.
 *
 * READ BY: scripts/build-roster.mjs (ICP tag to name and track, for the roster),
 * scripts/check-sales-canon.mjs (facts must match website/data.js, every roster ICP must exist
 * here), sales/app.js (OUTREACH.facts for the pipeline header strip).
 *
 * NOT HERE ANY MORE: cold email copy. Until 2026-09-16 this file carried 17 campaigns of
 * subjects, variants, follow ups, phone openers and objection handling, rendered by the
 * Outreach Engine and Instantly Logic sections. All of that was retired. The canonical cold
 * copy is now the Cold Email section (sales/coldemail.js + coldemail-spec.js), saved to D1.
 * The old bank is in git history if a line is ever wanted back.
 *
 * Facts here are checked against the live site on every build. Change website/data.js first.
 * No em or en dashes anywhere in this file: the gate reads every string. */
const OUTREACH = {
  "meta": {
    "built": "September 16, 2026",
    "source": "ICP taxonomy and product facts only. The cold copy bank that used to live here (17 campaigns, subjects, variants, follow ups, phone scripts) was retired on September 16, 2026 in favour of the Cold Email section of the Sales OS: eight one to two sentence variants, edited and saved there, canonical once Victor marks them. The old Instantly build documents in the campaigns folder are history, not canon.",
    "phone": "(225) 398 9286",
    "signature": "Victor Jehle\nAmerican BioCarbon\n(225) 398 9286"
  },
  "facts": {
    "biocharMt": 450,
    "absorbentUsTon": 275,
    "inventoryMt": 80,
    "superSackLb": 2000,
    "samples": "Biochar half pound, pellets 1 lb, crumble 1 lb",
    "sampleEta": "4 to 7 business days",
    "bulkEta": "7 to 10 business days",
    "replyTo": "victor.jehle@cs-ops.com",
    "origin": "White Castle, Louisiana",
    "biocharRadiusMi": 500,
    "geo": "Biochar ships within 500 miles of White Castle. Absorbent ships nationwide, buyer pays freight; accounts past 500 road miles sit in a deferred contact tier per the operator ruling of August 17, 2026.",
    "certs": "OMRI Listed, independently lab tested against the IBI panel, Puro.earth certified carbon removal. Never IBI Certified, never USDA Organic."
  },
  "tracks": [
    {
      "key": "biochar",
      "name": "Biochar",
      "sub": "Primary track. Finished tonnage on the ground today.",
      "product": "100 percent sugarcane bagasse biochar, made at White Castle, Louisiana. 65 percent organic carbon. Holds roughly 3 to 3.5 times its weight in water. OMRI Listed, independently lab tested against the IBI panel, Puro.earth certified carbon removal.",
      "geo": "Within 500 miles of White Castle, Louisiana. Past that, port distance and carbon credit economics stop working, so the list is geofenced on purpose.",
      "price": "$450 per metric ton",
      "sample": "Half pound biochar sample, 4 to 7 business days",
      "icps": [
        {
          "id": "comp",
          "tag": "BC.COMP",
          "short": "Composters",
          "name": "Composters and Organics Recyclers",
          "who": "Commercial compost yards, organics recyclers, municipal and private green waste operations running windrows or static piles.",
          "titles": [
            "Owner",
            "General Manager",
            "Operations Manager",
            "Site Manager",
            "Procurement"
          ],
          "pains": [
            "Turn rate. Every extra week a windrow sits is capacity they cannot sell.",
            "Piles compact, go anaerobic in the middle, and finish unevenly.",
            "Piles dry out and the biology dies with them.",
            "Nitrogen and ammonia walk off as odor, which is both a lost nutrient and a neighbor complaint.",
            "Compost tea and its nutrients run out the bottom of the pile."
          ]
        },
        {
          "id": "nur",
          "tag": "BC.NUR",
          "short": "Nurseries",
          "name": "Nurseries and Greenhouse Growers",
          "who": "Container nurseries, greenhouse operations and growers mixing their own media. Priority is the multi location operations, not single site mom and pops.",
          "titles": [
            "Owner",
            "Head Grower",
            "Production Manager",
            "Purchasing Manager",
            "Operations Manager"
          ],
          "pains": [
            "Potting mix is heavy, and weight is freight cost on every plant that ships.",
            "Water consumption during the southeast drought. Irrigation is the daily headache right now.",
            "Nutrient leaching. Fertilizer gets applied and then washes straight through the container.",
            "Heavy reliance on peat moss trucked in from Canada, plus perlite cost on top of it.",
            "Plant health and root development in a mix that packs down."
          ]
        },
        {
          "id": "blend",
          "tag": "BC.BLEND",
          "short": "Soil Blenders",
          "name": "Soil Blenders and Bagged Media",
          "who": "Companies blending and bagging soil, compost and specialty mixes for retail and landscape channels. Highly consolidated, very few players, so every account is worth real effort.",
          "titles": [
            "Owner",
            "Plant Manager",
            "Production Manager",
            "Purchasing",
            "R and D or Product Manager"
          ],
          "pains": [
            "Bagged soil dries out on a pallet or a shelf and goes hydrophobic, so it will not take water when the customer opens it.",
            "Dust during turning and bagging.",
            "Anything blended in has to granulate uniformly or the mix looks inconsistent.",
            "Their customers are asking for a premium product and they need something real to put behind that word."
          ]
        },
        {
          "id": "ranch",
          "tag": "BC.RANCH",
          "short": "Ranchers",
          "name": "Ranchers, Livestock and Poultry",
          "who": "Cattle ranchers, livestock operations, poultry and chicken houses. They share one shape: manure they have to do something with and ground they have to keep productive.",
          "titles": [
            "Owner",
            "Ranch Manager",
            "Herd Manager",
            "Farm Manager",
            "Operations Manager"
          ],
          "pains": [
            "Manure piling up with nowhere good to put it.",
            "Compact clay ground, common across north Louisiana, that roots cannot move through.",
            "Fertilizer and nutrients washing off after a rain.",
            "Hay and alfalfa yield on the ground they already have.",
            "Water. Same as everyone else this season."
          ]
        },
        {
          "id": "farm",
          "tag": "BC.FARM",
          "short": "Farms",
          "name": "Row Crop and Specialty Farms",
          "who": "Row crop operations, specialty and permanent crop growers, and larger farms inside the freight radius. Consolidation matters here: four or five operations in the region run 25 or 30 sites between them.",
          "titles": [
            "Owner",
            "Farm Manager",
            "Agronomist",
            "Operations Manager",
            "Purchasing"
          ],
          "pains": [
            "Drought. Every irrigation pass costs money and there is not enough water to waste.",
            "Fertilizer leaching straight past the root zone after a rain.",
            "Yield on ground that is already at its ceiling with current inputs.",
            "Input cost per acre that keeps climbing."
          ]
        },
        {
          "id": "farmRole",
          "tag": "BC.FARM.ROLE",
          "short": "Farm Inboxes",
          "name": "Farm Published Inboxes",
          "who": "General and published inboxes at row crop, sod, pecan, rice and vineyard operations. Read off the farm's own website: info@, office@, sales@ or the owner's catch all.",
          "titles": [
            "Unknown. There is no named contact on these rows by definition."
          ],
          "pains": [
            "Same underlying pains as BC.FARM. Water cost, nutrient loss after a rain, ground that will not hold either.",
            "The inbox specific pain is different: whoever reads it is usually not the buyer, so a pitch aimed at a buyer dies there."
          ]
        },
        {
          "id": "dist",
          "tag": "BC.DIST",
          "short": "Distributors",
          "name": "Ag Distributors and Landscape Supply",
          "who": "Ag input distributors, farm supply chains, landscape supply yards and garden center groups. Channel accounts, not end users. One of these is worth 50 direct growers.",
          "titles": [
            "Owner",
            "Category Manager",
            "Purchasing Manager",
            "Branch Manager",
            "Product Manager"
          ],
          "pains": [
            "They need a differentiated SKU their competitors do not carry.",
            "They will not stock something that does not pull through.",
            "Margin has to work at the branch level.",
            "Supply reliability. Nobody stocks a product that runs out."
          ]
        }
      ]
    },
    {
      "key": "absorbent",
      "name": "Absorbent",
      "sub": "Nationwide track. Pellets and crumble, both sold by the US ton.",
      "product": "Absorbent pellets and crumble made from sugarcane bagasse. Takes up to about 5 to 1 on non viscous liquids, against roughly 2.5 times for wood pellets. Lighter to handle and lighter to dispose of than clay.",
      "geo": "Nationwide, FOB White Castle. The buyer covers freight, which is what opens the whole country up. Victor: if they need it and they are willing to pay the freight, that is fine with us. Operator ruling August 17, 2026: accounts past 500 road miles score lower and sit in a deferred contact tier. Near accounts get worked first; far accounts are later, never dead.",
      "price": "$275 per US ton",
      "sample": "1 lb pellets or 1 lb crumble, 4 to 7 business days",
      "icps": [
        {
          "id": "og",
          "tag": "AB.OG",
          "short": "Oil and Gas",
          "name": "Oil and Gas Field Services",
          "who": "Oilfield service companies, well site operators, tank and pad crews. Often small independents where the owner is the one buying.",
          "titles": [
            "Owner",
            "General Manager",
            "Procurement Manager",
            "Site Manager",
            "Project Coordinator",
            "HSE Manager"
          ],
          "pains": [
            "Crews are still running 250 pound bags of clay litter out of the back of a pickup.",
            "Disposal is priced by weight, and saturated clay is heavy.",
            "Material volume per event. More bags means more handling and more haul off.",
            "Nobody wants to think about absorbent until there is a spill, and then it has to already be on the truck."
          ]
        },
        {
          "id": "env",
          "tag": "AB.ENV",
          "short": "Spill Response",
          "name": "Spill Response and Environmental Remediation",
          "who": "Emergency spill response contractors, environmental remediation firms, industrial cleaning companies. These were the strongest matches in the roster search.",
          "titles": [
            "Owner",
            "Operations Manager",
            "Field Supervisor",
            "Procurement",
            "HSE or Compliance Manager"
          ],
          "pains": [
            "Absorbent cost and disposal weight quietly eat job margin.",
            "Callouts are unpredictable, so material has to already be staged.",
            "Every pound of saturated material is a pound they pay to move and destroy.",
            "Clients increasingly ask what the material is and where it came from."
          ]
        },
        {
          "id": "hddCon",
          "tag": "AB.HDD.CON",
          "short": "HDD Contractors",
          "name": "Directional Drilling and Boring Contractors",
          "who": "Companies that actually run the bore: HDD contractors, utility boring crews, sewer, water, power and telecom line installers. Classified by NAICS 2371xx. Split out of the old mixed AB.HDD ICP on August 18, 2026 because a contractor and the dealer who supplies him are two different buyers.",
          "titles": [
            "Owner",
            "Operations Manager",
            "Superintendent",
            "Project Manager",
            "Field Manager"
          ],
          "pains": [
            "Returns and slurry pile up at the entry pit and nobody budgeted for cleaning them up.",
            "Whatever the crew uses rides out on the trailer to every job and rides back heavier.",
            "Disposal is charged by weight, so a wet load is an expensive load.",
            "Jobs move, so the material has to be easy to stage and easy to handle."
          ]
        },
        {
          "id": "hddSup",
          "tag": "AB.HDD.SUP",
          "short": "HDD Supply",
          "name": "Drilling Fluid, Tooling and Boring Supply",
          "who": "Dealers and supply houses selling bentonite, polymers, tooling, rods and boring consumables to the crews: Vermeer and Ditch Witch dealers, independent HDD supply houses, drilling fluid blenders and the manufacturers behind them. Split out of the old mixed AB.HDD ICP on August 18, 2026.",
          "titles": [
            "Owner",
            "Branch Manager",
            "Product Manager",
            "Purchasing",
            "Category Manager",
            "Sales Engineer"
          ],
          "pains": [
            "The absorbent on the shelf is a commodity nobody has a reason to prefer.",
            "Every crew buying fluid is buying a cleanup consumable somewhere else.",
            "An imported or single source line is a supply risk on a low margin item.",
            "A line card add has to be evaluated on paper before anyone opens a bag."
          ]
        },
        {
          "id": "civil",
          "tag": "AB.CIVIL",
          "short": "Heavy Civil",
          "name": "Heavy Civil, Dredging and Slurry Work",
          "who": "Heavy civil contractors, dredging operations, slurry wall and foundation crews, and site work contractors handling wet spoil.",
          "titles": [
            "Owner",
            "Project Manager",
            "Superintendent",
            "Purchasing Manager",
            "Equipment or Yard Manager"
          ],
          "pains": [
            "Wet spoil and dredge material cannot be hauled until it is dried out.",
            "Dewatering is a line item on every job and it is priced by tonnage moved.",
            "Site space is limited, so material staging matters.",
            "Schedule pressure. A load that cannot move holds up the whole sequence."
          ]
        },
        {
          "id": "landfill",
          "tag": "AB.LF",
          "short": "Landfill",
          "name": "Landfill and Leachate Operations",
          "who": "Landfill operators, transfer stations and waste companies handling leachate, liquid waste solidification and working face odor.",
          "titles": [
            "Landfill Manager",
            "Site Manager",
            "Environmental Manager",
            "Operations Manager",
            "Purchasing"
          ],
          "pains": [
            "Liquid waste has to be solidified before it can be placed or hauled.",
            "Everything is priced by weight, so a heavy solidifier is a permanent tax.",
            "Odor complaints at the working face.",
            "Leachate volume swings with the weather and they still have to handle it."
          ]
        },
        {
          "id": "muni",
          "tag": "AB.MUNI",
          "short": "Municipal",
          "name": "Municipal Public Works and Environmental Quality",
          "who": "City and county public works departments, environmental quality departments, stormwater and utility divisions, and the contractors who bid their work.",
          "titles": [
            "Public Works Director",
            "Environmental Services Manager",
            "Stormwater Coordinator",
            "Procurement or Purchasing Agent",
            "Fleet or Yard Supervisor"
          ],
          "pains": [
            "Spill kits and stormwater material have to be stocked and ready across multiple yards.",
            "Sediment socks on construction sites have to keep debris and cement out of the sewer while letting water through.",
            "Procurement runs on bids and approved vendor lists, so the timeline is long.",
            "Budget cycles, not urgency, decide when anything gets bought."
          ]
        },
        {
          "id": "abdist",
          "tag": "AB.DIST",
          "short": "Distributors",
          "name": "Absorbent Distributors and Safety Supply",
          "who": "Industrial safety distributors, environmental and restoration suppliers, and janitorial and sanitation houses that already stock a loose absorbent. The shelf slot exists, so the only question is whose product fills it.",
          "titles": [
            "Owner",
            "Director of Procurement",
            "Category Manager",
            "Product Manager",
            "Purchasing Manager",
            "Branch Manager"
          ],
          "pains": [
            "They already carry a loose absorbent, so switching means displacing an incumbent rather than creating a need.",
            "House brand and private label lines need a supplier who actually manufactures rather than one who brokers.",
            "Freight eats the margin on anything heavy with low value per pound.",
            "Customers are starting to ask for something that is not mined clay."
          ]
        },
        {
          "id": "bedSup",
          "tag": "AB.BED.SUP",
          "short": "Bedding Channel",
          "name": "Bedding Channel, Poultry and Farm Supply",
          "who": "Poultry house suppliers, farm and feed stores, bedding distributors and private label manufacturers. Every one of the 11 accounts on this list is a channel account. Not one is a grower or a barn, which is why this is a distribution motion and why the old poultry versus equine framing was wrong about its own list.",
          "titles": [
            "Owner",
            "Purchasing",
            "Product Manager",
            "Category Manager",
            "Store Manager",
            "Branch Manager"
          ],
          "pains": [
            "Wood shavings are bulky, dusty and inconsistent in both supply and price.",
            "Freight on a light bulky product is punishing, so absorbency per pound decides the economics.",
            "A bedding line is a commodity aisle with nothing to differentiate on.",
            "Private label buyers need a spec and a supply picture before a shelf conversation."
          ]
        },
        {
          "id": "bedEnd",
          "tag": "AB.BED.END",
          "short": "Bedding End User",
          "name": "End User Poultry and Equine",
          "who": "Poultry growers and complexes, equine barns, boarding and training operations. ZERO ACCOUNTS ON THE ROSTER. This definition exists so that the language is correct before anybody sources a list, and so nobody sends channel copy to a barn or poultry language to an equine account. There is no campaign.",
          "titles": [
            "Owner",
            "Live Production Manager",
            "Complex Manager",
            "Barn Manager",
            "Trainer",
            "Purchasing"
          ],
          "pains": [
            "Litter or bedding moisture drives how often a house or a stall gets stripped, which is the labor cost.",
            "Shavings supply and price move with the lumber market.",
            "Handling and storing a bulky bedding product at the site."
          ]
        }
      ]
    }
  ]
};
if (typeof window !== "undefined") window.OUTREACH = OUTREACH;
