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
  "read": "2026-08-27 05:42 UTC",
  "readDate": "2026-08-27",
  "generator": "sales-department/apollo-analytics/build-apollo-snapshot.mjs",
  "spendsCredits": false,
  "source": "local reveal receipts (handoff/enrichment/api-revealed-*.csv) plus a free key health check",
  "balanceSource": "app.apollo.io/#/settings/credits/current, read in the browser, 2026-08-26",
  "keyValid": true,
  "keyDetail": "key valid",
  "accountCredits": 2620,
  "operatorCeiling": 1183,
  "ceilingSet": "2026-08-17",
  "spent": 1259,
  "contactsObtained": 949,
  "remainingUnderCeiling": 0,
  "remainingOnAccount": 1049,
  "ceilingSpent": true,
  "observed": {
    "on": "2026-08-26",
    "source": "app.apollo.io/#/settings/credits/current, read in the browser",
    "available": 1049,
    "used": 1571,
    "of": 2620,
    "renews": "2026-09-10",
    "byFeature": {
      "exports": 1368,
      "waterfallEnrichment": 108,
      "email": 95
    }
  },
  "unreceiptedSpend": 312,
  "byLine": {
    "absorbent": 1201,
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
    "biochar-run5": 58
  },
  "receiptFiles": [
    "api-revealed-absorbent-run4.csv",
    "api-revealed-absorbent-run5.csv",
    "api-revealed-biochar-run5.csv"
  ],
  "gate": "Aug 20 list item 03: Victor reviews the target list BEFORE any further Apollo credits are spent.",
  "note": "The written ceiling of 1183 is fully spent. A new tranche needs a new written number from the operator before another reveal.",
  "balanceNote": "Apollo itself shows 1049 of 2620 left on 2026-08-26, renewing 2026-09-10. That is 312 credits further along than these receipts record, because 1368 of the spend went through Exports, which this ledger never watched. Money left is not the same as permission to spend it: the operator's authorisation is 0."
};
