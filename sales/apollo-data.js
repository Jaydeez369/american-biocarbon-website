/* ===== VEJ Sales OS - APOLLO SNAPSHOT (GENERATED, DO NOT EDIT) =====
   Written by sales-department/apollo-analytics/build-apollo-snapshot.mjs from the
   local reveal receipts plus one free key health check.

   THIS SPENDS NO CREDITS AND CALLS NO BILLABLE ENDPOINT. Apollo bills per /people/match
   reveal, and item 03 on the Aug 20 list gates the next tranche behind Victor's review, so
   a dashboard refresh must never be able to spend. Numbers come from our own receipts.

   Re-stamp after any Apollo reveal run:
     node sales-department/apollo-analytics/build-apollo-snapshot.mjs

   Or refresh every snapshot at once:
     sales-department/refresh-snapshots.sh
   ================================================================== */
window.APOLLO_LIVE = {
  "read": "2026-08-28 18:42 UTC",
  "readDate": "2026-08-28",
  "generator": "sales-department/apollo-analytics/build-apollo-snapshot.mjs",
  "spendsCredits": false,
  "source": "local reveal receipts (handoff/enrichment/api-revealed-*.csv) plus a free key health check",
  "balanceSource": "app.apollo.io credit page via the bulk enrich run; account total still the 2026-08-26 read, 2026-08-28",
  "keyValid": true,
  "keyDetail": "key valid",
  "accountCredits": 2620,
  "operatorCeiling": 1183,
  "ceilingSet": "2026-08-17",
  "spent": 1339,
  "contactsObtained": 949,
  "remainingUnderCeiling": 0,
  "remainingOnAccount": 897,
  "ceilingSpent": true,
  "observed": {
    "on": "2026-08-28",
    "source": "app.apollo.io credit page via the bulk enrich run; account total still the 2026-08-26 read",
    "available": 897,
    "used": 1723,
    "of": 2620,
    "renews": "2026-09-10",
    "unreconciled": "the Aug 28 run reported this balance as 897 of 2,670, not of 2,620",
    "byFeature": {
      "exports": 1368,
      "waterfallEnrichment": 108,
      "email": 95
    }
  },
  "unreceiptedSpend": 384,
  "byLine": {
    "absorbent": 1281,
    "biochar": 58
  },
  "byIcp": {
    "AB.OG": 492,
    "AB.CIVIL": 202,
    "AB.ENV": 183,
    "AB.DIST": 165,
    "AB.HDD": 103,
    "AB.LF": 47,
    "BC.NUR": 42,
    "AB.BED": 9,
    "BC.COMP": 6,
    "BC.FARM": 6,
    "BC.DIST": 2,
    "BC.BLEND": 2
  },
  "byRun": {
    "absorbent-run4": 464,
    "absorbent-run5": 737,
    "biochar-run5": 58,
    "phones-crumble": 80
  },
  "receiptFiles": [
    "api-revealed-absorbent-run4.csv",
    "api-revealed-absorbent-run5.csv",
    "api-revealed-biochar-run5.csv",
    "api-revealed-phones-crumble.csv"
  ],
  "gate": "Aug 20 list item 03: Victor reviews the target list BEFORE any further Apollo credits are spent.",
  "note": "The written ceiling of 1183 is fully spent. A new tranche needs a new written number from the operator before another reveal.",
  "balanceNote": "Apollo itself shows 897 of 2620 left on 2026-08-28, renewing 2026-09-10. That is 384 credits further along than these receipts record, because 1368 of the spend went through Exports, which this ledger never watched. Money left is not the same as permission to spend it: the operator's authorisation is 0."
};
