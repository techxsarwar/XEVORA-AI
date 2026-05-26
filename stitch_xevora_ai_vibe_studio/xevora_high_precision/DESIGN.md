---
name: Xevora High-Precision
colors:
  surface: '#f8f9fb'
  surface-dim: '#d8dadc'
  surface-bright: '#f8f9fb'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f2f4f6'
  surface-container: '#eceef0'
  surface-container-high: '#e6e8ea'
  surface-container-highest: '#e0e3e5'
  on-surface: '#191c1e'
  on-surface-variant: '#4d4632'
  inverse-surface: '#2d3133'
  inverse-on-surface: '#eff1f3'
  outline: '#7f775f'
  outline-variant: '#d0c6ab'
  surface-tint: '#705d00'
  primary: '#705d00'
  on-primary: '#ffffff'
  primary-container: '#ffd600'
  on-primary-container: '#705d00'
  inverse-primary: '#e9c400'
  secondary: '#006d35'
  on-secondary: '#ffffff'
  secondary-container: '#3fff8b'
  on-secondary-container: '#007237'
  tertiary: '#5d5e61'
  on-tertiary: '#ffffff'
  tertiary-container: '#d9d9dc'
  on-tertiary-container: '#5d5f61'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#ffe170'
  primary-fixed-dim: '#e9c400'
  on-primary-fixed: '#221b00'
  on-primary-fixed-variant: '#544600'
  secondary-fixed: '#62ff96'
  secondary-fixed-dim: '#00e475'
  on-secondary-fixed: '#00210b'
  on-secondary-fixed-variant: '#005226'
  tertiary-fixed: '#e2e2e5'
  tertiary-fixed-dim: '#c6c6c9'
  on-tertiary-fixed: '#1a1c1e'
  on-tertiary-fixed-variant: '#454749'
  background: '#f8f9fb'
  on-background: '#191c1e'
  surface-variant: '#e0e3e5'
typography:
  display-lg:
    fontFamily: Hanken Grotesk
    fontSize: 48px
    fontWeight: '700'
    lineHeight: 56px
    letterSpacing: -0.02em
  headline-md:
    fontFamily: Hanken Grotesk
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 32px
    letterSpacing: -0.01em
  body-base:
    fontFamily: Hanken Grotesk
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
  code-sm:
    fontFamily: JetBrains Mono
    fontSize: 13px
    fontWeight: '500'
    lineHeight: 20px
  label-caps:
    fontFamily: JetBrains Mono
    fontSize: 11px
    fontWeight: '700'
    lineHeight: 16px
    letterSpacing: 0.05em
rounded:
  sm: 0.125rem
  DEFAULT: 0.25rem
  md: 0.375rem
  lg: 0.5rem
  xl: 0.75rem
  full: 9999px
spacing:
  unit: 4px
  container-padding-desktop: 32px
  container-padding-mobile: 16px
  gutter: 16px
  stack-sm: 8px
  stack-md: 16px
  stack-lg: 32px
---

## Brand & Style
The design system is engineered for a high-performance AI coding environment, blending the precision of technical instrumentation with a premium, executive aesthetic. The brand personality is "Advanced Intelligence" — it is clinical, lightning-fast, and authoritative. 

The visual style is a hybrid of **Minimalism** and **Glassmorphism**, specifically optimized for high-density information. It prioritizes clarity through ultra-thin 1px strokes and expansive white space, punctuated by high-energy "functional" colors that signal AI activity and successful execution. The objective is to evoke the feeling of a "Next-Gen Vibe Coding" platform where the interface recedes to let the logic shine, while providing a tactile, high-end feel through micro-interactions and subtle depth.

## Colors
The palette is rooted in a professional "Laboratory White" foundation with premium warm off-white tones. The design system explicitly defines color roles as follows:

| Element | Role | How It's Defined | Hex Mapping in Workspace |
| :--- | :--- | :--- | :--- |
| **Primary colors** | Core brand identity | Extracted from logos or main palette files | **Primary Yellow (#FFD600 / #705D00)** for main CTA controls and orchestrator focus accents |
| **Secondary colors** | Complementary tones | Derived from supporting assets (slides, UI components) | **Vibrant Green (#00E676 / #007237)** signaling active compiler online states and live terminal hot reloads |
| **Accent colors** | Highlights, CTAs | Pulled from design references or manually added | **Terracotta Sparkle Orange (#E0533c)** for premium spark brand logos, selector cards, and core interactive inputs |
| **Typography-linked colors** | Text readability | Based on uploaded font and style guides | **Deep Charcoal (#191C1E)** ensuring maximum visual clarity over cream backdrops and white containers |
| **Backgrounds** | Layout consistency | Taken from prototypes or existing design files | **Cream Canvas (#FBFAF8)** and **Warm Sidebar Gray (#F7F6F3)** establishing absolute layout consistency |

Neutral elements provide the secondary layer for sidebar backgrounds and container wells, creating a subtle contrast against the Surface White (#FFFFFF) main workspace. Typography and iconography primarily utilize a deep charcoal tertiary black to ensure maximum legibility without the harshness of pure black.


## Typography
The typography strategy employs a dual-font approach. **Hanken Grotesk** is used for all UI elements, headings, and body copy to provide a sleek, modern, and highly legible experience. **JetBrains Mono** is the "Technical Engine" font, utilized for code blocks, terminal outputs, data tables, and metadata labels.

To maintain a premium feel, use tight letter-spacing on larger headings and generous line-height for body text. Label styles should frequently use uppercase JetBrains Mono to mimic the look of engineering schematics or high-end hardware interfaces.

## Layout & Spacing
This design system utilizes a **12-column fluid grid** for desktop and a **4-column grid** for mobile. The rhythm is based on a **4px baseline grid**, ensuring all components align with mathematical precision. 

Layouts are characterized by "The Workspace" model: a fixed left-hand navigation (64px collapsed, 240px expanded), a flexible central editor, and an optional "Inspector" panel on the right. Spacing between panels should be consistent 16px gutters to allow the "Ultra-thin border" aesthetic to create clear separation without visual bulk.

## Elevation & Depth
Depth is achieved through **Tonal Layers** and **Micro-shadows**. 
- **Level 0 (Base):** #F5F7F9 background.
- **Level 1 (Panels):** #FFFFFF surface with a 1px #E2E8F0 border. No shadow.
- **Level 2 (Floating/Modals):** #FFFFFF with a "Micro-shadow" (0px 2px 4px rgba(0,0,0,0.04)) and a subtle backdrop blur (12px) if the panel is semi-transparent.
- **Level 3 (Popovers/Context Menus):** High-definition shadow (0px 8px 24px rgba(0,0,0,0.08)) to indicate immediate interaction priority.

Avoid heavy shadows; the system relies on the 1px border to define boundaries.

## Shapes
The shape language is "Technical Softness." By using **Soft (0.25rem)** rounding for standard components like buttons and inputs, we maintain a professional, sharp edge while avoiding the aggressive nature of 0px corners. Larger containers and cards use **0.5rem (rounded-lg)** to distinguish them from functional UI elements. This subtle curvature makes the platform feel sophisticated and approachable rather than purely industrial.

## Components
- **Primary Buttons:** Solid #FFD600 background with black text. Sharp 0.25rem corners. No gradients.
- **Status Chips:** JetBrains Mono text. Success states use a light green tint (#00E676 at 10% opacity) with a solid 1px #00E676 border.
- **Input Fields:** White background, 1px #E2E8F0 border. On focus, the border changes to #FFD600 with a 2px glow.
- **AI Highlight Panels:** Glassmorphic background (White @ 80%) with a left-accent border of #FFD600 (3px width).
- **Code Editor:** Dark mode preferred for the code area specifically, using a customized theme that utilizes the #00E676 for strings and #FFD600 for keywords.
- **Floating Toolbars:** Use "Level 2" elevation with a subtle glass effect to float over code content without obstructing the view.