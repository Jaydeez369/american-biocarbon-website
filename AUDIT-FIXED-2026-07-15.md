# American BioCarbon - Production-Hardening Pass (Fixed)

**Date:** 2026-07-15
**Scope:** `website/` (canonical source). Verified against a local SPA-fallback server
(`.claude/spa_server.py`, mimics Cloudflare Pages `_redirects` precedence) rendered in a
real browser. Every A-C and E claim below was verified live (DOM / network / computed
styles / curl); D items were applied only with explicit human sign-off.

## Before → After grades

| Dimension | Before | After | Notes |
|---|---|---|---|
| SEO / Indexability | **D** | **A-** | History routing, robots, sitemap, canonical, OG, JSON-LD, noindex on non-index routes |
| Accessibility (WCAG 2.1 AA) | **C** | **A-** | Contrast, carousel inert + pause/play + reduced-motion, semantic breadcrumbs, hit areas, distinct link names |
| Performance | **C** | **A-** | Product images 800-985 KB → 52-71 KB WebP; defer; preconnect/preload |
| Copy / Claims | **C-** | **A-** | Carbon claim reconciled; case study relabeled illustrative; 5× already qualified |
| Code hygiene / Launch | **C** | **A** | Dead code/CSS removed, CSS bugs fixed, tokens clarified, dup routes canonicalized |
| **Overall launch readiness** | **C-** | **A-** | |

---

## A. SEO / Indexability

- **A1 - History API routing.** Converted the hash router to `pushState`/`popstate` path
  routing. `location.pathname` drives the router; all ~130 link literals emit clean
  crawlable `href="/product/…"`. Added a global click interceptor (skips `/sales/`,
  file links, modified clicks) and a `<base href="/">` so relative assets resolve on deep
  links. **Verified:** direct visit to `/product/absorbent-pellets` renders the product;
  SPA nav + back button work with **zero full reloads** (`navCount:1`).
- **A2 - Reverse-hash IIFE removed** from `index.html`. Clean URLs stay clean.
- **A3 - robots.txt + sitemap.xml** added as real files. **Verified via curl:**
  `robots.txt` → 200 `text/plain`, `sitemap.xml` → 200 `application/xml` (well-formed,
  `xmllint` clean). Sitemap lists canonical routes only; conversion/form routes disallowed.
- **A4 - Real 404 semantics.** `notFound()` now sets `<meta name="robots" content="noindex,follow">`
  and clears route JSON-LD. Forms/gated routes are noindex too. **Verified:** garbage path
  → "Page not found" + noindex.
- **A5 - `setMeta()` extended.** Per route: `<link rel="canonical">`, `og:title/description/url/image`,
  `og:site_name`, `og:locale`, `og:type`, `twitter:title/description/image`. A 1200×630
  branded OG image was generated (`assets/og-image.png`). **Verified** unique canonical + OG
  on home, product, industry, dedicated, form, and 404 routes.
- **A6 - JSON-LD.** Static **Organization** in `<head>` (crawler baseline); route-scoped
  **Product** (products/shop) and **BreadcrumbList** (matching visible crumbs). No invented
  data - only real certs (OMRI/IBI/Puro.earth). **Verified** valid JSON parse + required fields.

## B. Accessibility (WCAG 2.1 AA)

- **B1 - Contrast.** `--mute` #8a8e96 (3.29:1) → **#63676e** (5.0-5.7:1 on white/paper).
  Footer address crimson-on-navy (2.25:1) → **#cdd8ee** (8.1:1). Both **verified computed**.
- **B2 - Hero carousel.** Inactive slides get `inert` (CTAs no longer tabbable); added a
  labeled **pause/play** button (`aria-pressed`, dynamic label); autorotate now respects
  `prefers-reduced-motion` (starts paused). **Verified:** active slide focusable, inactive
  inert; toggle stops/starts the timer.
- **B3 - Distinct doc links.** The repeated "Request" links now carry
  `aria-label="Request <doc title>"`. **Verified.**
- **B4 - Hit areas.** Hero dots given `min-height:24px` (were collapsing to 2 px < 480 px).
  **Verified** 24 px.
- **B5 - Breadcrumbs.** All 12 crumbs converted to `<nav aria-label="Breadcrumb"><ol>` with
  `aria-current="page"` via a `crumbs()` helper. **Verified** semantic structure.

## C. Performance

- **C1 - Images.** 6 product PNGs (**781-962 KB**) → WebP (**52-71 KB**, ~93% smaller);
  all referenced industry JPGs → WebP ≤ ~120 KB. Served via a render-time `<picture>`
  transform (`webpify`) so the `<source>` is parsed before the `<img>` - **no double fetch**
  (verified: only `absorbent-pellets-bag.webp` 56 KB fetched, PNG never requested). Originals
  retained as graceful fallback.
- **C2 - `defer`** added to `data.js`/`app.js`.
- **C3 - preconnect `cdn.shopify.com` + preload** the first hero image (`hands.webp`).

## D. Copy / Claims (applied only with sign-off)

- **D1 - Carbon claim** (approved: absorbent → *carbon neutral*). Changed the 3 absorbent
  references (`data.js` drilling fit line, oil-gas proof chip, distributor benefit) from
  "carbon negative" to "carbon neutral". Biochar/soil remain "carbon negative" (correct).
- **D2 - Case study** (approved: relabel illustrative). "Real world impact" →
  **"Illustrative impact model"** with a disclaimer: *"Modeled scenario based on up-to-5:1
  absorption versus a typical wood or clay sorbent - not a specific customer result."*
- **D3 - 5× claim.** Already consistently "up to ~5×" across copy; the one soft spot was the
  D2 case study, now addressed.
- **D4 - Animal bedding.** Owner confirmed biochar-infused bedding genuinely helps
  ammonia/odor; the existing problem framing is defensible, so **left as-is** (no new
  solving-claims added).

## E. Code hygiene / Launch

- **E1** - `concept-a.html` / `concept-b.html` removed from publish root.
- **E2** - Placeholder social-proof block already guarded (`socialProof()` returns "" on
  `placeholder:true`) - confirmed never renders. *(was already safe)*
- **E3** - `var(--brand-crimson)` (undefined) → `var(--crimson)`.
- **E4** - Added a prominent `:root` comment explaining the historical token misnomers
  (`--green*` = navy, `--gold*` = crimson) plus semantic aliases (`--navy*`, `--crimson*`);
  replaced 9 hardcoded `#D7153F` + 4 inline hexes in the deep-industry renderers with tokens.
- **E5** - Fixed CSS bugs: removed duplicate `.offer`; removed the stray second `.uc::before`
  that broke the hover accent animation; added the missing `.proofrow` rule.
- **E6** - Removed dead `truckScene()` JS and dead `.microrow` / `.scene*` CSS.
  (`SHOP_DOMAIN` retained - it builds the Shopify cart URLs, not dead.)
- **E7** - Duplicate topic URLs canonicalized to the richer dedicated pages
  (`/environmental-remediation-solutions`, `/distributors-resellers-industries`): internal
  links repointed, in-app `rel=canonical` override, and `301` redirects added to `_redirects`.
- **E8** - `BRAND.phone` `(add phone)` / `BRAND.email` confirmed **never rendered** anywhere
  (no `tel:`/`mailto:`, no JSON-LD telephone). Left untouched per constraint. *(already safe)*

## Verification method

- Rendered every route (28) in-browser: **all render, zero JS errors**.
- SEO tags, JSON-LD, canonical/OG, noindex inspected in the live DOM per route.
- Contrast ratios computed from live computed styles.
- Image payloads confirmed via the Network panel (single WebP fetch, PNG not requested).
- robots/sitemap/deep-link/404 confirmed via curl against the SPA-fallback server.
- Screenshots captured live: home (desktop), product page, and mobile (375×812) - brand,
  hero, pause/play control, breadcrumbs, and proof band all intact.

## Notes / follow-ups for the owner
- `BRAND.phone` still a placeholder (intentionally). No contact phone/email renders anywhere
  today - you may want a real contact point + `ContactPoint` JSON-LD before/after launch.
- `.claude/spa_server.py` is a local dev helper; production relies on Cloudflare `_redirects`.
- Cache-bust query is at `?v=clean20`; bump on each deploy.
