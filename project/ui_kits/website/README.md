# GutHub Website UI Kit

Recreation of `www.guthub.ai`, **redesigned** per the 2026 brief:
- Warm + premium palette (terracotta / forest / cream)
- High-contrast serif display type
- Conversion-focused (Founders Cohort signup is the single primary CTA)
- Modern but familiar
- Dynamic UI animations as the hero imagery
- Audience: 40–75, balanced accessibility (17px body floor, generous hit targets)

## Files

| File | Component |
|---|---|
| `index.html` | Entry — renders the full redesigned marketing site |
| `Header.jsx` | Sticky header with nav + Access App button |
| `Hero.jsx` | Hero section — text left, animated chat UI right |
| `ProblemSection.jsx` | "Because health questions don't wait" — 4 question cards |
| `HowItWorks.jsx` | 3-step process |
| `FeaturesSection.jsx` | Benefit cards with UI animations |
| `Pricing.jsx` | Founders Cohort pricing block |
| `Testimonials.jsx` | Real-person quotes |
| `FAQ.jsx` | Accordion |
| `FinalCTA.jsx` | Full-bleed forest CTA |
| `Footer.jsx` | Footer |
| `ChatAnimation.jsx` | Reusable animated chat bubble sequence |
| `Button.jsx`, `Badge.jsx` | Atoms |

## Pages covered
- Homepage (main `index.html`)
- Pricing / Founders (section on homepage + `#pricing`)
- FAQ (section on homepage)
- About, Products — stubbed as route anchors in header; not separately built this pass.
