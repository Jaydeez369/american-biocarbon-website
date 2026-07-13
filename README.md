# American BioCarbon Website

Enterprise-grade website for American BioCarbon - industrial absorbents, biochar, and carbon removal credits.

## 🚀 Quick Start

### Local Development
```bash
cd website
# Serve locally - requires a static server
python3 -m http.server 5180
# Or use any static server pointing to this directory
```

Visit `http://localhost:5180/#/` in your browser.

## 📋 Project Structure

- **index.html** - Main HTML entry point
- **app.js** - Router and page renderers
- **data.js** - All product, industry, and content data
- **styles.css** - Enterprise design system
- **assets/** - Spec sheets and resources
- **netlify.toml** - Netlify deployment configuration

## 🎯 Pages

- **Home** - Hero carousel with product showcase
- **Products** - Absorbent Pellets, Biochar, BioSoil, Carbon Removal
- **Industries** - Oil & Gas, Environmental Remediation, Agriculture, etc.
- **Technical Data** - Certifications, compliance docs, research
- **About** - Company mission and story
- **Request Forms** - Sample requests, quotes, technical packages

## ✨ Recent Updates

### Technical Data Page Redesign
- Enterprise-grade layout with reduced visual clutter
- "Notify me" buttons routing to request-quote flow
- Professional copy for B2B decision-makers
- Streamlined documentation packages by industry

### Carbon Removal Page Simplification
- Reduced proof items from 4 to 3
- Cleaner comparison vs generic offsets
- Focused FAQ section
- Removed secondary visual elements

## 🌐 Deployment

### Netlify
1. Connect this repository to Netlify
2. Netlify automatically detects `netlify.toml`
3. Build command: None (static site)
4. Publish directory: `.` (website root)

**Features:**
- Hash-based routing redirects
- Optimized caching (1-year for versioned assets, 1-hour for HTML)
- Production-ready configuration

### Environment
- No build step required
- Static site generation via JavaScript
- Works with any hosting (Netlify, Vercel, GitHub Pages, etc.)

## 🔄 Git Workflow

```bash
# Make changes
git add .
git commit -m "Description of changes"
git push origin main

# Netlify auto-deploys on push to main
```

## 📱 Responsive Design

- Mobile-first approach
- Optimized for all device sizes
- Touch-friendly navigation
- Fast loading on slow connections

## 🔐 Security & Performance

- No external dependencies (vanilla JS)
- CSP-compatible (no inline scripts)
- Minified assets ready
- Form submissions captured locally (ready for backend integration)

## 📝 Content Management

Edit content in `data.js`:
- Products: Add/modify `PRODUCTS` object
- Industries: Add/modify `INDUSTRIES` object
- Forms: Add/modify `FORMS` object
- Technical: Manage `TECH` object

Changes live-reload in development.

## 🎨 Design System

Colors (navy/crimson palette):
- Primary brand: Navy (`#2c3e50`)
- Accent: Crimson (`#c91e42`)
- Paper backgrounds: Light gray
- Graphite: Dark backgrounds

Typography:
- Serif headlines: DM Serif Display
- Body: DM Sans (400, 500, 700)
- Monospace code: IBM Plex Mono

## 📚 Forms

Integrated request flows:
- Sample requests (absorbent pellets, biochar)
- Quote requests (volume & pricing)
- Carbon removal info
- Technical documentation packages
- Contact/specialist consultation

## 🚀 Next Steps

1. ✅ Repository created and pushed
2. ⏳ Connect to Netlify (see deployment section)
3. 📦 Upload product images/assets to CDN
4. 🔗 Wire form submissions to backend
5. 📊 Set up analytics (GA4/GTM)
6. 🎯 SEO optimization & meta tags

## 📧 Questions?

For technical issues or feature requests, create an issue or contact the development team.

---

**Last Updated:** July 2026  
**Status:** Production Ready  
**Maintenance:** Ongoing
