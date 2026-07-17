# American BioCarbon - Visual / UI-UX Enterprise Audit

**Date:** 2026-07-15
**Scope:** `website/` (canonical). Focus: visual design, iconography, badges, cards,
desktop + mobile polish. Complements the prior production-hardening pass
(`AUDIT-FIXED-2026-07-15.md`, which covered SEO / a11y / perf / copy / hygiene).
**Method:** live render at 1280px (desktop) and 375px (mobile) on the local server,
computed-style + DOM inspection, full read of `styles.css` and `app.js` render layer.

## Scorecard

| # | Section / Dimension | Grade | One-line verdict |
|---|---|:---:|---|
| 1 | Hero carousel | **A** | Cinematic, editorial, well-animated - the site's strongest asset |
| 2 | Brand / header nav | **B+** | Fixed the invisible-logo bug; nav is clean and sticky |
| 3 | Color & typography | **A-** | Distinctive DM Serif / DM Sans / IBM Plex Mono trio, consistent navy+crimson |
| 4 | Iconography system | **C-** | The weak point - only 3 SVGs sitewide; benefit/use-case cards have none |
| 5 | Cards (use-case / app / offer) | **B-** | Good structure + hover accents, but text-only and visually flat |
| 6 | Badges / chips | **B** | Consistent mono-pill system; availability badges are a highlight, rest is one-note |
| 7 | Product / PDP + kraft-bag render | **A-** | The CSS-drawn kraft sample bag is genuinely impressive |
| 8 | Proof band / trust signals | **C+** | Honest (placeholder block guarded off), but thin without testimonials |
| 9 | Forms | **B+** | Labeled, required markers, clear focus states |
| 10 | Mobile responsive | **A-** | Clean single-column stacking, sticky CTA bar with safe-area insets |
| 11 | Motion / interaction | **A-** | Button lifts, accent bars, reveal-on-scroll, reduced-motion respected |
| 12 | Footer | **B+** | Solid, legible on navy (contrast already fixed) |
| - | **Overall visual/UX** | **B+** | Mature and professional; one systemic gap (icons) holds it back from A- |

## Headline findings

### FIXED this pass
- **Invisible header logo (was a real defect).** The brand `<a>` was a flex child that
  shrank to 0px, so the loaded 224×151 logo rendered at 0 width on *every* page
  (`img{max-width:100%}` → 100% of a 0-width parent). Added `flex:0 0 auto` to the brand
  anchor + logo. **Verified live:** logo now renders 45×30 on desktop and mobile.

### Biggest lever - iconography (Section 4, C-)
- The entire site ships **3 SVGs total** (one arrow on use-case cards, two elsewhere).
  Every "benefit," "use case," "how it helps," and proof-point is pure text + a mono label.
  This is exactly the "simple, uninspired" feel - the layout is good, but nothing *shows*.
- The proof band renders trust icons as `filter:brightness(0) invert(1)` cert logos - a hack
  that flattens them to white blobs.
- **Recommendation:** introduce one consistent inline-SVG icon set (single stroke width,
  24px grid, `currentColor`) and thread it through: use-case cards, app cards, the proof
  band, the "why bagasse" checklists, and PDP spec rows. This single move lifts sections
  4/5/6/8 together and is the highest-visual-ROI change available.

### Cards & badges (Sections 5-6, B-/B)
- Use-case (`.uc`) and app (`.appcard`) cards: numbered + titled + benefit, with a nice
  hover accent bar and corner arrow - but no icon and no color/imagery differentiation
  between cards. Add a category icon + a subtle top-tint per card family.
- Badge system is consistent but monotone (mono pill, one shape). The `.avail-live` /
  `.avail-q4` availability badges are the exception and look great - extend that richer
  treatment (dot indicator, tonal fill) to the generic `.chips` / `.proofrow` pills.

## Constraints acknowledged (graded fairly)
- **No testimonials / no customer logos:** Section 8 is graded on *honesty + polish of what
  exists*, not on missing social proof. The guarded placeholder block correctly renders
  nothing. To lift 8 without inventing proof: replace the empty logo strip with a
  certifications/standards row (OMRI, IBI, Puro.earth) styled as real icon-cards.
- **Only two live products:** the product grid is graded on card quality, not catalog depth.

## Changes applied this pass (verified live via DOM / computed styles)
- **Header logo fix** - brand anchor `flex:0 0 auto`; logo renders 45×30 on desktop + mobile.
- **Line-stroke icon system** - 14-icon inline-SVG library (`ICONS` + `ico()`), with keyword
  inference (`iconFor()`) so all ~15 field-application card blocks get a semantic icon with
  zero data.js edits. Verified: Soil→seedling, Compost→recycle, Carbon→leaf, Drilling→droplet.
- **App / use-case cards** - icon tile added (crimson-on-paper, fills crimson on hover).
- **Proof band** - now renders inline SVG icons (badge / leaf / cog) instead of the old
  `brightness(0) invert(1)` logo blobs.
- **Chips / proof pills** - leading accent dot to match the availability-badge language.
- Cache-bust bumped `clean22 → clean23`.

### Revised grades after this pass
| Iconography **C- → B+** · Cards **B- → B+** · Badges **B → B+** · Header **B → B+** ·
Proof band **C+ → B** · **Overall B+ → A-** |

## Prioritized upgrade plan (remaining, optional)
1. **Icon system** (biggest lift) - inline SVG set → use-case, app, proof, checklists, PDP.
2. **Proof band** - real cert icon-cards instead of inverted-logo blobs.
3. **Card enrichment** - per-family icon + subtle tint on `.uc` / `.appcard`.
4. **Badge variety** - dot + tonal fill on chips/proofrow, matching the availability badges.
5. **Trust row** - swap the empty logo strip for a certifications strip (no invented proof).
