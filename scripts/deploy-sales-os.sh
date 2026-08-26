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
#   ./scripts/deploy-sales-os.sh
#
# Nothing secret is stored in this file: it is committed. Every credential is read from the
# shell first and then from the gitignored .env at the repo root:
#
#   CLOUDFLARE_API_TOKEN   required. Dashboard > My Profile > API Tokens, template
#                          "Edit Cloudflare Workers", scoped to the Csopsmarketing account.
#   SALES_OS_PASSWORD      required. The shared team password for the gate.
#   INSTANTLY_API_KEY      optional. /api/instantly goes live when set.
#   APOLLO_API_KEY         optional. /api/apollo goes live when set.
#   ALLO_EXPORT_TOKEN      optional. The Launchpad live call row appears when set.
#
# The three optional ones are skipped with a warning if absent; those routes fail soft on
# their own and the page keeps rendering its dated snapshot.
set -euo pipefail

PROJECT="cs-ops-sales-os"
ACCOUNT_ID="bbc8d43ba1f883d032178837037285e1"   # Csopsmarketing@gmail.com's Account
WRANGLER="npx -y wrangler@3.114.1"

cd "$(dirname "$0")/.."

# Every credential this script needs can come from the shell OR from the gitignored .env at
# the repo root, shell winning. Putting them in .env is the norm here — the live-data keys
# already live there — and it means a deploy is one command with no exports to remember.
ENV_FILE="$(cd .. && pwd)/.env"
read_env() { [ -f "$ENV_FILE" ] && sed -n "s/^$1=//p" "$ENV_FILE" | head -1 | tr -d '\r'; }

CLOUDFLARE_API_TOKEN="${CLOUDFLARE_API_TOKEN:-$(read_env CLOUDFLARE_API_TOKEN)}"
SALES_OS_PASSWORD="${SALES_OS_PASSWORD:-$(read_env SALES_OS_PASSWORD)}"
export CLOUDFLARE_API_TOKEN

: "${CLOUDFLARE_API_TOKEN:?set CLOUDFLARE_API_TOKEN in the shell or in .env. Cloudflare dashboard > My Profile > API Tokens, template \"Edit Cloudflare Workers\", scoped to the Csopsmarketing account.}"

export CLOUDFLARE_ACCOUNT_ID="$ACCOUNT_ID"

# The gates and the ?v= stamping run against the whole repo, so build from the repo root
# even though only sales/ is uploaded. A stale stamp is a cache-poisoning bug, not a
# cosmetic one: index.html would point at a hash that no longer matches the file.
node scripts/build.mjs

# Idempotent: a second run just reports the project already exists.
$WRANGLER pages project create "$PROJECT" --production-branch main || true

# Fail closed. The middleware returns 503 for every route while this is unset, so set it
# BEFORE the first deploy rather than after.
printf '%s' "${SALES_OS_PASSWORD:?set SALES_OS_PASSWORD in the shell or in .env}" \
  | $WRANGLER pages secret put SALES_OS_PASSWORD --project-name "$PROJECT"

# ---------------------------------------------------------------- live-data secrets
# sales/functions/api/*.js hold these server side so the browser never sees a key. Each route
# fails soft when its secret is missing: it answers ok:false and the page keeps rendering the
# dated snapshot. So a missing key here degrades one row, it does not break the deploy — which
# is why these are skipped with a warning rather than treated like SALES_OS_PASSWORD.
#
put_secret() {
  local name="$1" value="$2" why="$3"
  if [ -z "$value" ]; then
    echo "  SKIP $name — not set. $why" >&2
    return
  fi
  printf '%s' "$value" | $WRANGLER pages secret put "$name" --project-name "$PROJECT" >/dev/null
  echo "  set  $name"
}

echo "==> live-data secrets"
put_secret INSTANTLY_API_KEY "${INSTANTLY_API_KEY:-$(read_env INSTANTLY_API_KEY)}" \
  "/api/instantly will answer not-configured and the Instantly panel stays on its snapshot."
put_secret APOLLO_API_KEY "${APOLLO_API_KEY:-$(read_env APOLLO_API_KEY)}" \
  "/api/apollo will answer not-configured; credit figures are receipt-based anyway."
# The allo-hooks Worker generated this at deploy time and it is only visible where it was
# generated. If it was lost, re-run sales-department/allo-hooks/scripts/deploy.sh to mint a
# new one and put the SAME value in .env as ALLO_EXPORT_TOKEN.
put_secret ALLO_EXPORT_TOKEN "${ALLO_EXPORT_TOKEN:-$(read_env ALLO_EXPORT_TOKEN)}" \
  "/api/allo will answer not-configured and the Launchpad live row stays hidden."

echo "==> deploy"
$WRANGLER pages deploy sales --project-name "$PROJECT" --branch main

cat <<NOTE

Deployed. Verify, in this order:
  1. open the project URL, log in with SALES_OS_PASSWORD
  2. the Launchpad Instantly tile should say the campaign count, not "no live read"
  3. a live row appears under the phone tiles only if ALLO_EXPORT_TOKEN was set
Any route whose secret was skipped above answers ok:false by design; the page still renders
its dated snapshot. Re-run this script after adding the value to .env to fill it in.
NOTE
