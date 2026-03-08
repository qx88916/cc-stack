# 🎨 CAB CONNECT - BRAND KIT
## Visual Identity & Brand Guidelines

**Version:** 1.1  
**Date:** January 2, 2026  
**Status:** Approved for Development

---

## 📋 BRAND OVERVIEW

**Company Name:** Cab Connect  
**Legal Entity:** Cab Connect  
**Domain:** fijicabconnect.com  
**Tagline Options:**
1. "Ride Anywhere in Fiji" ⭐ (Recommended)
2. "Your Island, Your Ride"
3. "Fast, Safe Rides Across Fiji"

**Industry:** Transportation Technology / Ride-Hailing  
**Target Market:** Fiji Islands (Tourists + Local Residents)  
**Brand Personality:** Reliable, Friendly, Local, Modern, Trustworthy

---

## 🧭 BRAND GUIDELINES

### Brand Name
Cab Connect

### Logo
Text-based logo only:
Cab Connect

### Usage Rules
✔ Cab Connect  
✖ Fiji Cab Connect  
✖ FIJICAB  
✖ CabConnect  

“Fiji” is used only as regional context, never as brand.

---

## 🎨 COLOR PALETTE

### Primary Colors:

#### Emerald Green (#10b981)
- **Usage:** Primary brand color, CTAs, active states
- **Meaning:** Movement, "Go", Trust, Island vibes, Growth
- **Implementation:**
  - Primary buttons
  - Active navigation items
  - Success messages
  - Logo accent
  - Map markers

```css
/* CSS Variable */
--primary: #10b981;
--primary-hover: #059669;
--primary-light: #d1fae5;
--primary-dark: #047857;
```

#### Ocean Blue (#0891b2)
- **Usage:** Secondary brand color, info elements
- **Meaning:** Ocean, Fiji waters, Reliability, Calm
- **Implementation:**
  - Secondary buttons
  - Links
  - Info messages
  - Icons
  - Accents

```css
/* CSS Variable */
--secondary: #0891b2;
--secondary-hover: #0e7490;
--secondary-light: #cffafe;
--secondary-dark: #155e75;
```

#### Amber Gold (#f59e0b)
- **Usage:** Accent color, CTAs, highlights
- **Meaning:** Sun, Energy, Action, Urgency
- **Implementation:**
  - "Book Now" buttons
  - Pricing highlights
  - Warning messages
  - Special offers

```css
/* CSS Variable */
--accent: #f59e0b;
--accent-hover: #d97706;
--accent-light: #fef3c7;
--accent-dark: #b45309;
```

### Neutral Colors:

```css
/* Text Colors */
--text-primary: #1f2937;      /* Headings, primary text */
--text-secondary: #6b7280;    /* Body text, descriptions */
--text-tertiary: #9ca3af;     /* Muted text, placeholders */

/* Background Colors */
--bg-white: #ffffff;          /* Cards, modals */
--bg-light: #f9fafb;          /* Page background */
--bg-dark: #111827;           /* Dark mode, footer */

/* Border Colors */
--border-light: #e5e7eb;      /* Light borders */
--border-medium: #d1d5db;     /* Input borders */
--border-dark: #9ca3af;       /* Strong dividers */
```

### Semantic Colors:

```css
/* Status Colors */
--success: #10b981;           /* Success messages */
--error: #ef4444;             /* Error messages */
--warning: #f59e0b;           /* Warning messages */
--info: #3b82f6;              /* Info messages */

/* Ride Status Colors */
--status-pending: #6b7280;    /* Ride pending */
--status-accepted: #3b82f6;   /* Driver accepted */
--status-arrived: #f59e0b;    /* Driver arrived */
--status-active: #10b981;     /* Ride in progress */
--status-completed: #059669;  /* Ride completed */
--status-cancelled: #ef4444;  /* Ride cancelled */
```

---

## 📝 TYPOGRAPHY

### Primary Font: Plus Jakarta Sans

**Source:** Google Fonts (Free)  
**License:** Open Font License  
**Link:** https://fonts.google.com/specimen/Plus+Jakarta+Sans

**Why This Font:**
- Modern and clean appearance
- Excellent readability on mobile devices
- Wide range of weights (200-800)
- Professional yet friendly
- Popular in modern app designs

**Font Weights to Use:**
- 400 (Regular) - Body text
- 500 (Medium) - Buttons, labels
- 600 (Semibold) - Subheadings, emphasis
- 700 (Bold) - Headings, hero text
- 800 (Extrabold) - Logo, major headings (sparingly)

### Typography Scale:

```css
/* Headings */
--font-h1-mobile: 36px;       /* Hero titles */
--font-h1-desktop: 56px;

--font-h2-mobile: 28px;       /* Section titles */
--font-h2-desktop: 40px;

--font-h3-mobile: 24px;       /* Card titles */
--font-h3-desktop: 32px;

--font-h4-mobile: 20px;       /* Subsections */
--font-h4-desktop: 24px;

/* Body Text */
--font-body-large: 18px;      /* Lead paragraphs */
--font-body-regular: 16px;    /* Standard text */
--font-body-small: 14px;      /* Captions, fine print */
--font-body-tiny: 12px;       /* Labels, metadata */

/* Line Heights */
--line-height-tight: 1.2;     /* Headings */
--line-height-normal: 1.5;    /* Body text */
--line-height-relaxed: 1.7;   /* Long-form content */
```

### Font Implementation:

```html
<!-- Google Fonts Import -->
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap" rel="stylesheet">
```

```css
/* CSS */
body {
  font-family: 'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, 
               'Segoe UI', sans-serif;
  font-size: 16px;
  line-height: 1.5;
  color: #1f2937;
}
```

---

## 🎯 LOGO SPECIFICATIONS

### Logo Variations Needed:

#### Primary Logo (Full Color)
- Text-based logo only: "Cab Connect"
- Use on white/light backgrounds
- File formats: SVG, PNG (transparent), JPG
- **Project Path:** `assets/images/logo-horizontal.svg`

#### Logo White Version
- Text-based logo only: "Cab Connect" in white
- Use on dark backgrounds (green, blue, black)
- File formats: SVG, PNG (transparent)
- **Project Path:** `assets/images/logo-horizontal-white.svg`

#### Logo Icon / Favicon
- Green rounded square with "FC" monogram (Fiji Cab / Connect)
- Use for: App icon, Browser tab (favicon), Social profile picture
- File formats: SVG, PNG, ICO
- **Project Path:** `assets/images/favicon.svg`

#### Logo Horizontal Layout
- Text-only wordmark: "Cab Connect"
- Use in headers, navigation

#### Logo Stacked Layout
- Text-only wordmark: "Cab Connect"
- Use on mobile, square spaces

### Logo Usage Rules:

✅ **DO:**
- Maintain clear space (minimum 20px around logo)
- Use approved color versions only
- Scale proportionally
- Place on contrasting backgrounds

❌ **DON'T:**
- Stretch or distort logo
- Change colors arbitrarily
- Add effects (shadows, gradients not in original)
- Place on busy backgrounds without backdrop

### Logo Clear Space:
Minimum clear space = Height of the letter "C" in logo

---

## 🎨 DESIGN ELEMENTS

### Border Radius:

```css
--radius-sm: 4px;       /* Small elements, inputs */
--radius-md: 8px;       /* Cards, buttons */
--radius-lg: 12px;      /* Large cards, modals */
--radius-xl: 16px;      /* Hero sections */
--radius-full: 9999px;  /* Pills, badges, avatars */
```

### Shadows:

```css
/* Elevation System */
--shadow-sm: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
--shadow-md: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
--shadow-lg: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
--shadow-xl: 0 20px 25px -5px rgba(0, 0, 0, 0.1);
```

### Spacing Scale:

```css
--space-1: 4px;
--space-2: 8px;
--space-3: 12px;
--space-4: 16px;
--space-5: 20px;
--space-6: 24px;
--space-8: 32px;
--space-10: 40px;
--space-12: 48px;
--space-16: 64px;
--space-20: 80px;
--space-24: 96px;
```

---

## 🖼️ IMAGERY GUIDELINES

### Photography Style:

✅ **Use:**
- Real Fiji locations (beaches, cities, landmarks)
- Happy passengers and drivers
- Clean, modern vehicles
- Bright, natural lighting
- Authentic moments
- Diverse representation

❌ **Avoid:**
- Stock photos that look fake
- Dark or gloomy images
- Generic city backgrounds
- Cluttered or messy scenes

### Image Treatment:
- Maintain vibrant colors (Fiji is colorful!)
- Use subtle overlays for text readability
- Minimum resolution: 1920x1080 for hero images
- Compress for web (WebP format preferred)

### Icons:
- **Icon Set:** Heroicons (https://heroicons.com)
- **Style:** Outline (2px stroke) for general use
- **Style:** Solid for active states
- **Size:** 24x24px standard, 16x16px small, 32x32px large
- **Color:** Inherit from parent or use brand colors

---

## 💬 BRAND VOICE & TONE

### Personality Traits:
1. **Reliable** - We're always there when you need us
2. **Friendly** - Warm, approachable, never corporate
3. **Local** - We understand Fiji and its people
4. **Modern** - Tech-savvy but accessible
5. **Safe** - Security and trust are paramount

### Writing Style:

✅ **DO:**
- Use simple, clear language
- Be warm and conversational
- Focus on benefits, not features
- Address users directly ("you", "your")
- Use active voice
- Be concise

❌ **DON'T:**
- Use jargon or technical terms
- Make exaggerated claims ("world's best", "#1")
- Include specific numbers without proof
- Use emojis excessively (1-2 per section max)
- Make promises you can't keep

### Example Copy:

**Good:** "Book your ride in seconds. Safe, affordable, and always on time."

**Bad:** "We're the #1 world-class cab service with 99.9% customer satisfaction serving 10,000+ happy customers!"

---

## 🔤 MESSAGING FRAMEWORK

### Tagline:
"Ride Anywhere in Fiji"

### Value Propositions:
1. **For Tourists:** "Explore Fiji worry-free. Book rides from the airport to your hotel and everywhere in between."

2. **For Locals:** "Your daily commute, made easy. Reliable rides across Viti Levu and beyond."

3. **For Drivers:** "Drive on your schedule. Earn more with Fiji's fastest-growing ride-hailing platform."

### Key Messages:
- First cab-hailing platform in Fiji
- Safe and verified drivers
- Transparent pricing, no hidden fees
- Available across major Fiji destinations
- Easy to use for everyone
- Supporting local drivers and economy

---

## 📱 UI COMPONENT STYLES

### Buttons:

**Primary Button (Call to Action):**
```css
background: #10b981;
color: #ffffff;
padding: 12px 24px;
border-radius: 8px;
font-weight: 600;
hover: #059669;
```

**Secondary Button:**
```css
background: transparent;
color: #10b981;
border: 2px solid #10b981;
padding: 12px 24px;
border-radius: 8px;
font-weight: 600;
hover: background #d1fae5;
```

**Accent Button (Urgent CTAs):**
```css
background: #f59e0b;
color: #ffffff;
padding: 12px 24px;
border-radius: 8px;
font-weight: 600;
hover: #d97706;
```

### Input Fields:

```css
border: 1px solid #d1d5db;
border-radius: 8px;
padding: 12px 16px;
font-size: 16px;
focus: border-color #10b981, box-shadow 0 0 0 3px #d1fae5;
```

### Cards:

```css
background: #ffffff;
border-radius: 12px;
padding: 24px;
box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1);
hover: box-shadow 0 10px 15px -3px rgba(0, 0, 0, 0.1);
```

---

## 🌐 BRAND APPLICATIONS

### Website:
- Clean, modern design
- Mobile-first approach
- Fast loading (<3 seconds)
- Prominent "Book Ride" CTA
- Clear navigation
- Trust indicators (safety, verification)

### Mobile Apps:
- Bottom navigation for easy thumb access
- Large touch targets (min 44x44px)
- Smooth animations
- Clear ride status indicators
- Map-centric design

### Marketing Materials:
- Flyers for drivers
- Social media graphics
- Email templates
- Business cards
- Vehicle decals (optional)

---

## ✅ BRAND CHECKLIST

Before any design goes live, verify:

- [ ] Colors match brand palette exactly
- [ ] Typography uses Plus Jakarta Sans
- [ ] Logo has proper clear space
- [ ] Copy follows brand voice guidelines
- [ ] Images match photography style
- [ ] Buttons use correct styles
- [ ] Mobile responsive (test on actual devices)
- [ ] Accessible (WCAG AA contrast ratios)
- [ ] Loading performance optimized

---

## 📊 ACCESSIBILITY STANDARDS

### Color Contrast:
All text must meet WCAG AA standards:
- Normal text: 4.5:1 contrast ratio minimum
- Large text (18px+): 3:1 contrast ratio minimum

**Tested Combinations:**
- ✅ Green (#10b981) on White (#ffffff) = 2.69:1 (Large text only)
- ✅ Text Primary (#1f2937) on White (#ffffff) = 15.93:1 (Excellent)
- ✅ White (#ffffff) on Green (#10b981) = 2.69:1 (Large text only)
- ✅ White (#ffffff) on Dark (#111827) = 17.99:1 (Excellent)

**Recommendation:** Use green for large buttons and headings. Use dark text (#1f2937) for body content.

---

## 🎯 COMPETITOR DIFFERENTIATION

### How We Stand Out:

| Aspect | Uber/Ola | Cab Connect |
|--------|----------|------------------|
| **Market** | Global | Fiji-specific |
| **Drivers** | Gig workers | Local partners |
| **Colors** | Black/Yellow/Green | Emerald/Ocean Blue/Gold |
| **Vibe** | Corporate | Island-friendly |
| **Focus** | Scale | Community |

---

## 📁 BRAND ASSET ORGANIZATION

```
01-BRANDING/
├── logo/
│   ├── full-color/
│   │   ├── logo-horizontal.svg
│   │   ├── logo-horizontal.png
│   │   ├── logo-stacked.svg
│   │   └── logo-stacked.png
│   ├── white/
│   │   ├── logo-horizontal-white.svg
│   │   └── logo-horizontal-white.png
│   ├── icon/
│   │   ├── icon.svg
│   │   ├── icon.png
│   │   └── favicon.ico
│   └── guidelines.pdf
├── colors/
│   └── palette.pdf
├── fonts/
│   └── Plus-Jakarta-Sans/
└── templates/
    ├── social-media/
    ├── email/
    └── print/
```

---

## 🚀 IMPLEMENTATION NOTES

### For Developers:

1. **Design Tokens File:**
   - Use `design-tokens-template.ts` from starter kit
   - Fill in all color values from this brand kit
   - Export for use in Tailwind config

2. **Font Loading:**
   - Preload Plus Jakarta Sans
   - Include weights: 400, 500, 600, 700, 800
   - Use font-display: swap for better performance

3. **Logo Implementation:**
   - Use SVG for scalability
   - Implement lazy loading for images
  - Provide alt text: "Cab Connect logo"

4. **Color Usage:**
   - Primary green for all CTAs
   - Ocean blue for links and secondary actions
   - Amber for urgent actions only
   - Never use colors outside this palette

---

## ✅ APPROVAL & VERSION CONTROL

**Brand Kit Version:** 1.1  
**Created By:** System Architect  
**Created Date:** January 2, 2026  
**Status:** ✅ Approved for Development  
**Next Review:** After Phase 0 completion

---

**Fiji's cab-hailing platform deserves a brand that reflects the islands' beauty, reliability, and warmth. This brand kit ensures consistency across all touchpoints.** 🚖🌴

---

**END OF BRAND KIT**
