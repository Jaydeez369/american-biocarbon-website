#!/usr/bin/env bash
#
# Create and deploy the STANDALONE Sales OS Pages project (cs-ops-sales-os).
#
# The Sales OS ships as its own Pages project rooted at sales/, separate from the
# marketing site, because sales/functions/_middleware.js only runs as a Pages Function
# when sales/ IS the project root. Served as a subdirectory of the main site that file
# is an inert static asset and the roster, COGS and price floors are public.
#
# Auth: wrangler cannot do its OAuth flow from a non-interactive shell, so export a
# scoped API token first (Cloudflare dashboard > My Profile > API Tokens, template
# "Edit Cloudflare Workers", scoped to the Csopsmarketing account):
#
#   export CLOUDFLARE_API_TOKEN=...
#   ./scripts/deploy-sales-os.sh
#
# The password is read from stdin, never stored here: this file is committed.
set -euo pipefail

PROJECT="cs-ops-sales-os"
ACCOUNT_ID="bbc8d43ba1f883d032178837037285e1"   # Csopsmarketing@gmail.com's Account
WRANGLER="npx -y wrangler@3.114.1"

export CLOUDFLARE_ACCOUNT_ID="$ACCOUNT_ID"
cd "$(dirname "$0")/.."

# The gates and the ?v= stamping run against the whole repo, so build from the repo root
# even though only sales/ is uploaded. A stale stamp is a cache-poisoning bug, not a
# cosmetic one: index.html would point at a hash that no longer matches the file.
node scripts/build.mjs

# Idempotent: a second run just reports the project already exists.
$WRANGLER pages project create "$PROJECT" --production-branch main || true

# Fail closed. The middleware returns 503 for every route while this is unset, so set it
# BEFORE the first deploy rather than after.
printf '%s' "${SALES_OS_PASSWORD:?set SALES_OS_PASSWORD in the environment for this run}" \
  | $WRANGLER pages secret put SALES_OS_PASSWORD --project-name "$PROJECT"

$WRANGLER pages deploy sales --project-name "$PROJECT" --branch main
