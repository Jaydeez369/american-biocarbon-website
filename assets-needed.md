# Assets - reused, and still needed

## Reused from the live Shopify site (referenced by CDN URL)
Store CDN base: `https://cdn.shopify.com/s/files/1/0773/9270/7876/files/`

| Asset | URL | Used on |
|-------|-----|---------|
| Logo (color, horizontal) | `.../abc-logo-horiz_color.png?v=1710167731` | Header (light surfaces) |
| Logo (reverse, horizontal) | `.../abc-logo-horiz_rev_...webp?v=1710182358` | Header/footer (dark surfaces) |
| Absorbent pellets mockup | `.../AbsorbentPelletsMock.jpg?v=1699280021` | Pellets product card/page |
| Pellets / facility photo | `.../AmericanBiocarbon2021-292.jpg?v=1699280021` | Pellets page, industrial heroes |
| 100% Biochar mockup | `.../100BiocharMock.jpg?v=1699279980` | Biochar product card/page |
| Biochar product photo | `.../AmericanBiocarbonBiochar1.jpg?v=1699279980` | Biochar page |
| Biochar large photo | `.../biochar-lg.jpg?v=1702141148` | Home ag section |
| "Hands" involvement photo | `.../hands.webp?v=1686923164` | About / carbon |
| Icon - Third-Party Certified | `.../values.svg?v=1710184994` | Proof band |
| Icon - Carbon-Negative (leaf) | `.../leaf.svg?v=1710185049` | Proof band |
| Icon - Patented Technology | `.../tech.svg?v=1710185049` | Proof band |

> These load directly over Shopify's CDN. If a URL 404s or hotlinking is blocked, download the file into `website/assets/` and update the `ASSETS` map in `data.js`.

## Still needed (not on the current site) - request from client
1. **Absorbent crumble** product photo (distinct from pellets).
2. **Field / industrial application photos** - spill cleanup, drilling site, leachate pond, remediation crew. (Current site has none; industrial credibility needs these.)
3. **SDS PDF** for absorbent pellets & crumble.
4. **Spec sheet PDFs** per product (absorbency, density, format, granulation).
5. **Certification artwork** - official OMRI / IBI / Puro.earth badges (verify usage rights + exact listing IDs).
6. **Lab analysis summary** (heavy metals table) as a downloadable PDF.
7. **Facility / process photography** - pyrolysis line, Cora Texas co-location, bulk bags on pallets.
8. **Team / founder photo** for About page trust.

Fallback in the build: clean typographic placeholders with a subtle graphite texture - never invented/fake product photos.
