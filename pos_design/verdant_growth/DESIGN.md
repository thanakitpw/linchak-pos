---
name: Verdant Growth
colors:
  surface: '#f8f9ff'
  surface-dim: '#d1dbec'
  surface-bright: '#f8f9ff'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#eef4ff'
  surface-container: '#e5eeff'
  surface-container-high: '#dfe9fa'
  surface-container-highest: '#d9e3f4'
  on-surface: '#121c28'
  on-surface-variant: '#3e4a3d'
  inverse-surface: '#27313e'
  inverse-on-surface: '#eaf1ff'
  outline: '#6e7b6b'
  outline-variant: '#bdcab9'
  surface-tint: '#006e29'
  primary: '#006e29'
  on-primary: '#ffffff'
  primary-container: '#2bb14f'
  on-primary-container: '#003c13'
  inverse-primary: '#60df77'
  secondary: '#366847'
  on-secondary: '#ffffff'
  secondary-container: '#b8f0c5'
  on-secondary-container: '#3d6f4d'
  tertiary: '#57615b'
  on-tertiary: '#ffffff'
  tertiary-container: '#939d97'
  on-tertiary-container: '#2b3530'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#7dfc90'
  primary-fixed-dim: '#60df77'
  on-primary-fixed: '#002107'
  on-primary-fixed-variant: '#00531d'
  secondary-fixed: '#b8f0c5'
  secondary-fixed-dim: '#9dd3aa'
  on-secondary-fixed: '#00210e'
  on-secondary-fixed-variant: '#1d5031'
  tertiary-fixed: '#dbe5de'
  tertiary-fixed-dim: '#bfc9c2'
  on-tertiary-fixed: '#151d19'
  on-tertiary-fixed-variant: '#3f4944'
  background: '#f8f9ff'
  on-background: '#121c28'
  surface-variant: '#d9e3f4'
typography:
  display-lg:
    fontFamily: IBM Plex Sans
    fontSize: 40px
    fontWeight: '700'
    lineHeight: 48px
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: IBM Plex Sans
    fontSize: 32px
    fontWeight: '600'
    lineHeight: 40px
  headline-lg-mobile:
    fontFamily: IBM Plex Sans
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 32px
  headline-md:
    fontFamily: IBM Plex Sans
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 32px
  title-lg:
    fontFamily: IBM Plex Sans
    fontSize: 20px
    fontWeight: '600'
    lineHeight: 28px
  body-lg:
    fontFamily: IBM Plex Sans
    fontSize: 18px
    fontWeight: '400'
    lineHeight: 28px
  body-md:
    fontFamily: IBM Plex Sans
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
  label-lg:
    fontFamily: IBM Plex Sans
    fontSize: 14px
    fontWeight: '500'
    lineHeight: 20px
    letterSpacing: 0.01em
  label-sm:
    fontFamily: IBM Plex Sans
    fontSize: 12px
    fontWeight: '500'
    lineHeight: 16px
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  unit: 4px
  xs: 4px
  sm: 8px
  md: 16px
  lg: 24px
  xl: 32px
  container-margin: 16px
  gutter: 12px
---

## Brand & Style
The brand personality focuses on prosperity, accessibility, and reliability for Thai micro-merchants. The visual direction is **Corporate / Modern** with a touch of **Minimalism** to ensure clarity in high-utility environments like markets and street-side shops. 

The aesthetic is characterized by clean white surfaces, generous whitespace to reduce cognitive load during fast-paced transactions, and purposeful use of the primary green to signal success and "growth." It avoids unnecessary decoration, favoring a systematic approach that feels professional enough for financial management yet friendly enough for daily entrepreneurial use.

## Colors
This design system utilizes a high-contrast, nature-inspired palette to drive merchant confidence.

- **Primary (#2bb14f):** Used for main actions (Confirm, Save, Add Product). It signifies "Go" and financial health.
- **Secondary (#1a4d2e):** A deep forest green used for heavy headers and navigation elements to provide a grounded, professional contrast.
- **Tertiary (#f2fcf5):** A very soft mint wash used for subtle backgrounds, row stripes, and container fills to keep the UI feeling fresh.
- **Neutral (#4b5563):** A balanced slate for secondary text and icons, ensuring legibility against white backgrounds.
- **Surface:** Pure white (#ffffff) is the default for cards and input areas to maximize contrast for outdoor readability.

## Typography
The system uses **IBM Plex Sans** (with Thai glyph support) to maintain a systematic and neutral tone. 

- **Weight Usage:** Use Bold (700) for currency amounts and primary headings. Use Medium (500) for interactive labels and Semibold (600) for section headers.
- **Legibility:** Line heights are slightly increased to accommodate Thai loop and vowel markers, preventing "stacking" issues in tight layouts.
- **Scaling:** On mobile, display types scale down aggressively to ensure long Thai words do not wrap awkwardly.

## Layout & Spacing
The design system employs a **Fluid Grid** based on an 8px rhythmic scale, with a 4px sub-grid for tight component spacing.

- **Mobile (Default):** A 4-column grid with 16px side margins. This is the primary touchpoint for micro-merchants.
- **Desktop/Tablet:** A 12-column grid with a maximum content width of 1120px. 
- **Spacing Philosophy:** Use 'md' (16px) for most internal padding. Increase to 'lg' (24px) for separating logical sections. This "breathable" spacing helps merchants scan information quickly between customer interactions.

## Elevation & Depth
Depth is communicated through **Tonal Layers** and extremely soft shadows to maintain a clean, modern look.

- **Level 0 (Base):** The main background using Tertiary green or pure white.
- **Level 1 (Cards):** Subtle 1px borders in a light gray (#E5E7EB) with no shadow. Used for list items.
- **Level 2 (Active/Floating):** A soft, diffused shadow (0px 4px 12px rgba(0, 0, 0, 0.05)) to lift primary action containers or bottom sheets.
- **Level 3 (Modals):** High-diffusion shadow (0px 12px 32px rgba(0, 0, 0, 0.1)) to focus merchant attention on critical tasks like payment confirmation.

## Shapes
A **Rounded** shape language is used to soften the professional tone, making the tool feel like a helpful assistant rather than a rigid financial terminal.

- **Components:** Standard buttons and input fields use `rounded-md` (0.5rem).
- **Cards/Containers:** Use `rounded-lg` (1rem) to create distinct visual blocks.
- **Interactive Highlights:** Small indicators (like notification dots or status chips) may use `rounded-xl` or circular clipping.

## Components
- **Buttons:** Primary buttons use the new #2bb14f background with white text. Secondary buttons use a #2bb14f border and text on a white background. Touch targets are a minimum of 48px.
- **Chips:** Status indicators use low-saturation fills. A "Paid" status uses the Tertiary green background with Primary green text.
- **Input Fields:** Use a 1px border. When focused, the border thickens to 2px in Primary green. Labels are always visible above the field (not floating) for maximum clarity.
- **Cards:** Used for product items and order summaries. They include a subtle 1px border to separate items in high-density lists.
- **Bottom Sheets:** The primary mobile navigation pattern for "Merchant Flow" tasks like adding items or selecting payment methods, using `rounded-xl` top corners.
- **Progress Bars:** Use Primary green to show target completion (e.g., daily sales goals), providing positive reinforcement.