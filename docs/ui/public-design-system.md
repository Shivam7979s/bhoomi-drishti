# BHOOMI-DRISHTI Public Design System Foundation

## 1. Overview
The BHOOMI-DRISHTI Public Design System defines the visual language, design tokens, typography, and foundational layout components for the digital land-governance platform. It transitions the application from an internal utility shell into a trustworthy, evidence-grounded, institutional public interface.

---

## 2. Brand Identity & Color Palette

### 2.1 Color Tokens
The color palette reflects natural Indian land and geographic governance: deep forests, vibrant vegetation, rich terracotta soils, sunrise clarity, and administrative slate.

| Semantic Token | Hex | Tailwind Token | Role & Usage |
| :--- | :--- | :--- | :--- |
| **Forest Emerald** | `#1C4532` | `forest-900` / `brand-primary` | Dominant brand identity, header accents, active badges, primary dark surfaces |
| **Forest Deep** | `#143324` | `forest-950` | High-contrast text, brand borders, focused hover states |
| **Forest Mid** | `#276749` | `forest-700` | Secondary brand interactive elements, active borders |
| **Living Leaf Green** | `#38A169` | `leaf-600` / `brand-secondary` | Environmental indicators, verified evidence badges, success confirmations |
| **Terracotta Earth** | `#8C4A2F` | `earth-700` | Land parcel accents, deed boundaries, historical status markers |
| **Dawn Amber Gold** | `#D69E2E` | `dawn-600` | Statutory alerts, cautionary warnings, audit highlights |
| **River Azure** | `#3182CE` | `river-600` | Spatial hydrology layers, informational notices, deep links |
| **Mountain Mist** | `#285E61` | `mountain-700` | Secondary metadata, topographical badges, structural dividers |
| **Institutional Slate** | `#0F172A` | `slate-900` | Primary headings, institutional footer background, high-authority text |
| **Pristine White** | `#FFFFFF` | `white` | Cards, elevated surfaces, navigation backdrops |

### 2.2 Semantic Surface Tokens
* **Page Background:** `bg-slate-50` (`#F8FAFC`)
* **Surface Default:** `bg-white` (`#FFFFFF`) with `border-slate-200`
* **Surface Elevated:** `bg-white shadow-sm hover:shadow-md`
* **Surface Inverted:** `bg-slate-900` (`#0F172A`) for institutional footer
* **Focus Ring:** `ring-2 ring-forest-700 ring-offset-2` (`#276749`)

---

## 3. Typography Hierarchy

The system uses a clean system sans-serif font stack (`system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif`) for performance, crisp rendering on all platforms, and zero external font dependencies.

| Element | Class / Specs | Tracking / Weight | Usage |
| :--- | :--- | :--- | :--- |
| **Brand Wordmark** | `text-base font-bold` | `tracking-tight` | Header brand logo title |
| **Brand Subtitle** | `text-xs font-medium` | `tracking-normal text-slate-500` | Platform institutional label |
| **Navigation Item** | `text-sm font-medium` | `transition-colors` | Header and drawer links |
| **Page Title (H1)** | `text-3xl font-extrabold sm:text-4xl` | `tracking-tight text-slate-900` | Primary page headings |
| **Section Title (H2)**| `text-xl font-bold sm:text-2xl` | `text-slate-900` | Card groups, major panels |
| **Subsection (H3)** | `text-lg font-semibold` | `text-slate-800` | Drawer headers, dialog titles |
| **Body Default** | `text-base font-normal` | `text-slate-700 leading-relaxed` | Paragraphs, documentation |
| **Body Small** | `text-sm font-normal` | `text-slate-600` | Secondary descriptions, cards |
| **Metadata / Micro** | `text-xs font-medium` | `text-slate-500` | Timestamps, citations, badges |
| **Buttons / CTA** | `text-sm font-semibold` | `tracking-wide` | Action triggers, auth buttons |

---

## 4. Logo Asset & Display Rules

### 4.1 Authoritative Artwork
* **Canonical Path:** `frontend/public/assets/brand/bhoomi-drishti-logo.png`
* **Dimensions:** 1254 x 1254 RGBA PNG with alpha-transparent outer corners.

### 4.2 Web-Optimized Derivatives
Pre-rendered with Lanczos high-quality resampling to guarantee optimal web performance and crisp rendering across devices:
* **Navbar Icon:** `bhoomi-drishti-logo-navbar.webp` (128x128, ~12.7 KB) & `.png` (28.8 KB)
* **Footer Icon:** `bhoomi-drishti-logo-footer.webp` (160x160, ~17.1 KB) & `.png` (41.6 KB)
* **Full Crest / Mark:** `bhoomi-drishti-logo-mark.webp` (384x384, ~60.1 KB) & `.png` (175.5 KB)

### 4.3 Component Usage (`BrandLogo`)
```tsx
import { BrandLogo } from '../components/public/BrandLogo';

// Header usage (medium, showing subtitle and wordmark)
<BrandLogo size="md" />

// Footer usage (large inverted badge, light text)
<BrandLogo size="lg" variant="dark" />

// Compact usage (crest only)
<BrandLogo size="sm" showSubtitle={false} showWordmark={false} />
```

---

## 5. Navigation & Layout Architecture

### 5.1 Main Layout Shell (`MainLayout.tsx`)
```text
┌────────────────────────────────────────────────────────────────────────┐
│ Header: [Logo] BHOOMI-DRISHTI   Governance  GIS  Research  AI   [Auth] │
├────────────────────────────────────────────────────────────────────────┤
│ Skip Link: "Skip to main content" (Accessible keyboard navigation)     │
│                                                                        │
│ Main Content Area (<Outlet />)                                         │
│ min-h-[calc(100vh-theme(spacing.16))] w-full                           │
│                                                                        │
├────────────────────────────────────────────────────────────────────────┤
│ Footer: Mission | Domain Nav | Legal/Prototype Disclaimer | Provenance │
└────────────────────────────────────────────────────────────────────────┘
```

### 5.2 Header Navigation Items
| Route | Label | Target Domain | Visibility |
| :--- | :--- | :--- | :--- |
| `/governance` | Governance | Governance intelligence & KPI dashboard | Public / All |
| `/gis` | GIS Map | Spatial cadastre & map viewer | Public / All |
| `/research` | Research Hub | Statutory legal corpus & comparison | Public / All |
| `/assistant` | AI Assistant | Statutory research AI assistant | Public / All |
| `/login` | Sign In | Identity verification | Anonymous |
| `/register` | Register | Officer / researcher onboarding | Anonymous |
| `/profile` | Profile & Utilities | Account & session management | Authenticated |

### 5.3 Active Route Styling
Active navigation links are styled with:
* Background: `bg-forest-50` (`#F0FDF4`)
* Text: `text-forest-900` (`#1C4532`)
* Border: `border-b-2 border-forest-800` (desktop) or `border-l-4 border-forest-800` (drawer)
* Non-reliance on color alone: Font weight shifts to `font-semibold` and an active indicator bar is rendered.

---

## 6. Mobile Drawer (`MobileNavigation.tsx`)
* **Trigger:** Accessible hamburger button (`aria-expanded`, `aria-label="Open navigation menu"`).
* **Behavior:**
  * Backdrop click to dismiss.
  * Escape key (`Escape`) listener closes menu and restores focus.
  * Route selection automatically closes drawer.
  * Focus trap keeps navigation within drawer when open.
  * Body scrolling is locked while drawer is active.

---

## 7. Accessibility Standards (WCAG 2.1 AA)

1. **Color Contrast:** All body text meets at least 4.5:1 contrast against background; large headers meet 3:1.
2. **Focus Visibility:** Clear `ring-2 ring-forest-700 ring-offset-2` outline on keyboard Tab focus across buttons, links, and inputs.
3. **Semantic Landmarks:** Uses `<header role="banner">`, `<nav aria-label="...">`, `<main id="main-content">`, and `<footer role="contentinfo">`.
4. **Skip Links:** Includes hidden skip link (`sr-only focus:not-sr-only`) targeting `#main-content`.
5. **Reduced Motion:** Interactive transitions use `transition-colors duration-150` with native browser `prefers-reduced-motion` compliance.

---

## 8. Responsive Breakpoints
* **Mobile (< 640px):** Single-column layout, compact logo, collapsed hamburger navigation, stacked footer.
* **Tablet (640px - 767px):** Two-column footer, expanded spacing, drawer navigation.
* **Desktop (768px - 1023px):** Horizontal navigation bar, expanded wordmark with subtitle.
* **Large Desktop (1024px+):** Full multi-column footer, maximum-width containers (`max-w-7xl mx-auto`).
