---
name: Debit Registry Fintech
colors:
  surface: '#fbf8ff'
  surface-dim: '#d9d9e7'
  surface-bright: '#fbf8ff'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f4f2ff'
  surface-container: '#edecfb'
  surface-container-high: '#e8e7f5'
  surface-container-highest: '#e2e1ef'
  on-surface: '#191b25'
  on-surface-variant: '#434657'
  inverse-surface: '#2e303a'
  inverse-on-surface: '#f0effe'
  outline: '#747688'
  outline-variant: '#c4c5da'
  surface-tint: '#0b44fc'
  primary: '#0032c6'
  on-primary: '#ffffff'
  primary-container: '#0d45fc'
  on-primary-container: '#d2d7ff'
  inverse-primary: '#bac3ff'
  secondary: '#00668a'
  on-secondary: '#ffffff'
  secondary-container: '#12bdfd'
  on-secondary-container: '#004964'
  tertiary: '#8b1c00'
  on-tertiary: '#ffffff'
  tertiary-container: '#b62700'
  on-tertiary-container: '#ffcec3'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#dee1ff'
  primary-fixed-dim: '#bac3ff'
  on-primary-fixed: '#001159'
  on-primary-fixed-variant: '#0031c5'
  secondary-fixed: '#c4e7ff'
  secondary-fixed-dim: '#7cd0ff'
  on-secondary-fixed: '#001e2c'
  on-secondary-fixed-variant: '#004c69'
  tertiary-fixed: '#ffdad2'
  tertiary-fixed-dim: '#ffb4a3'
  on-tertiary-fixed: '#3d0700'
  on-tertiary-fixed-variant: '#8a1b00'
  background: '#fbf8ff'
  on-background: '#191b25'
  surface-variant: '#e2e1ef'
  accent-mint: '#0DFCC4'
  rating-a: '#0DFCC4'
  rating-b: '#FBBF24'
  rating-c: '#EF4444'
  surface-bg: '#F8FAFC'
  surface-card: '#FFFFFF'
  border-subtle: '#E2E8F0'
  text-primary: '#0F172A'
  text-muted: '#64748B'
typography:
  headline-xl:
    fontFamily: Inter
    fontSize: 36px
    fontWeight: '700'
    lineHeight: 44px
  headline-xl-mobile:
    fontFamily: Inter
    fontSize: 28px
    fontWeight: '700'
    lineHeight: 36px
  headline-lg:
    fontFamily: Inter
    fontSize: 28px
    fontWeight: '600'
    lineHeight: 36px
  headline-md:
    fontFamily: Inter
    fontSize: 22px
    fontWeight: '600'
    lineHeight: 30px
  headline-sm:
    fontFamily: Inter
    fontSize: 18px
    fontWeight: '600'
    lineHeight: 24px
  body-lg:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
  body-md:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 20px
  body-sm:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '400'
    lineHeight: 16px
  data-mono-lg:
    fontFamily: JetBrains Mono
    fontSize: 18px
    fontWeight: '600'
    lineHeight: 24px
  data-mono-md:
    fontFamily: JetBrains Mono
    fontSize: 14px
    fontWeight: '500'
    lineHeight: 20px
  label-md:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '600'
    lineHeight: 16px
  label-sm:
    fontFamily: JetBrains Mono
    fontSize: 10px
    fontWeight: '500'
    lineHeight: 14px
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  gutter: 1rem
  gutter-desktop: 1.5rem
  margin: 1rem
  margin-desktop: 2rem
  space-xs: 0.25rem
  space-sm: 0.5rem
  space-md: 1rem
  space-lg: 1.5rem
  space-xl: 2rem
---

# Design System & UI Specification: Debitinfo.GE

This document serves as the master design guideline for generating and styling all web pages, portals, and dashboards for **Debitinfo.GE** (Financial Debt Monitoring, Credit Registry, and Analytics SaaS Platform).

---

## 1. Visual Identity & Color System

The platform balances high-trust enterprise banking aesthetics with modern SaaS ergonomics. High contrast, clarity of financial data, and distinct status indicators are paramount.

### 1.1 Brand Color Palette

| Token Name | Hex Code | Role & Usage |
| :--- | :--- | :--- |
| **`--color-primary`** | `#0D45FC` | Main brand identity, key navigational elements, high-emphasis CTAs, active sidebar tabs, headers. |
| **`--color-secondary`** | `#0DBCFC` | Informational callouts, hover states, secondary accents, interactive link states, active borders. |
| **`--color-accent`** | `#0DFCC4` | Success milestones, confirmed payments, Grade A credit ratings, live notifications, positive metrics. |

### 1.2 Neutral & Background Tokens

#### Light Theme (Client Portals & Landing Page)
* **Background Canvas:** `#F8FAFC` (Slate 50)
* **Card / Surface Canvas:** `#FFFFFF` (Pure White)
* **Borders / Dividers:** `#E2E8F0` (Slate 200)
* **Text Primary:** `#0F172A` (Slate 900)
* **Text Secondary / Muted:** `#64748B` (Slate 500)

### 1.3 Semantic & Rating Colors

* **Rating A (Prime / Low Risk):** `#0DFCC4` (Mint Green background chip: `rgba(13, 252, 196, 0.15)`)
* **Rating B (Moderate Risk):** `#FBBF24` (Amber Gold background chip: `rgba(251, 191, 36, 0.15)`)
* **Rating C (High Risk / Default):** `#EF4444` (Coral Red background chip: `rgba(239, 68, 68, 0.15)`)

## 2. Typography & Spatial Grid
* Primary Font Family: 'Noto Sans Georgian', 'Inter', system-ui, sans-serif
* Display-1: 36px / Line-height: 44px / Bold
* H1: 28px / SemiBold
* H2: 22px / SemiBold
* Body: 14px / Regular
* Data-Numeric: 'JetBrains Mono', 'Inter', tabular-nums
* Border Radius: Buttons/Inputs 8px, Cards 14px, Pills 9999px
