

# UI/UX Consistency Overhaul + Build Fix

## Build Fix (Prerequisite)

The `build:dev` script is still missing from `package.json`. Will add it and simplify `build` to `vite build`.

---

## Identified UI/UX Inconsistencies

After reviewing 15+ pages and the design system files, here are the major problems:

### 1. **Two Conflicting Tailwind Configs**
- `tailwind.config.js` defines colors as plain hex (primary-500: `#0ea5e9`, background: `#f4f5f9`)
- `tailwind.config.ts` defines colors as HSL CSS variables (`hsl(var(--primary))`)
- Both files exist — Vite likely picks one, causing unpredictable color resolution
- **Fix**: Merge into a single `tailwind.config.ts`, remove the `.js` file

### 2. **Inconsistent Page Headers**
- **Dashboard**: `text-3xl font-bold text-gray-900` with greeting, no icon
- **Patients**: `text-xl lg:text-2xl font-bold text-gray-900` with gradient icon box + subtitle
- **Lab/Pharmacy**: `text-2xl font-bold text-gray-800` with plain subtitle
- **Billing**: Has stat cards at top, different header pattern entirely
- **Fix**: Create a shared `PageHeader` component with consistent sizing, optional icon, subtitle, and action buttons

### 3. **Inconsistent Card Styles**
- MetricCard uses `rounded-2xl p-6 shadow-card` (custom shadow)
- Patients StatCard uses `Card` component with different padding
- Dashboard panels mix `border-0 shadow-sm`, `shadow-card`, and plain borders
- IPD PatientDetailPanel uses `border border-gray-100 shadow-sm`
- **Fix**: Standardize on 2-3 card variants: `stat-card`, `content-card`, `panel-card`

### 4. **Inconsistent Button Styles**
- Dashboard "New Patient": `bg-gradient-to-r from-blue-600 to-blue-700 shadow-lg shadow-blue-500/25`
- Patients "Register New": `bg-blue-600 hover:bg-blue-700 shadow-sm`
- Some pages use `variant="outline"` with `border-gray-200`, others without
- **Fix**: Standardize primary action button style across all pages

### 5. **Inconsistent Spacing & Layout**
- Lab/Pharmacy pages add extra `p-6` padding (on top of AppLayout's `p-4 md:p-6`)
- Dashboard uses `space-y-6`, others use `space-y-6 animate-fadeIn`
- Some pages use `Breadcrumbs` component, others don't
- **Fix**: Remove duplicate padding from inner pages; standardize animation and breadcrumb usage

### 6. **Color System Conflicts**
- `index.css` defines `--primary: 230 89% 68%` (blue-purple)
- `tailwind.config.js` defines `primary.DEFAULT: '#0284c7'` (sky blue)
- `DESIGN_SYSTEM_REDESIGN.md` references teal (#0d9488) as the primary
- Actual usage is a mix of all three
- **Fix**: Settle on one primary color across CSS variables and Tailwind config

### 7. **Inconsistent Badge/Status Patterns**
- Billing uses inline objects `STATUS_CONFIG` with `bg-amber-100 text-amber-700`
- CSS defines `.badge-success`, `.badge-warning` etc. with different colors (`bg-emerald-50 text-emerald-700`)
- **Fix**: Use the CSS utility classes consistently, or migrate to a `StatusBadge` component

### 8. **Typography Inconsistencies**
- Some pages use `text-gray-800` for headings, others `text-gray-900`
- Subtitles alternate between `text-gray-500` and `text-gray-400`
- Font sizes for section titles vary: `text-sm font-semibold`, `text-lg font-semibold`, etc.

---

## Implementation Plan

### Phase 1: Foundation Fixes
1. **Fix `package.json`** — add `build:dev` script, simplify `build`
2. **Merge Tailwind configs** — delete `tailwind.config.js`, consolidate into `tailwind.config.ts` with a single, consistent color system (sky-blue primary matching current login page)
3. **Align `index.css` variables** — update CSS custom properties to match the chosen Tailwind colors

### Phase 2: Shared Components
4. **Create `PageHeader` component** — standardized page title with icon, subtitle, and action slot
5. **Create `StatCard` component** — single reusable stat/metric card used by Dashboard, Patients, Billing, etc.
6. **Create `StatusBadge` component** — consistent status pill with predefined variants

### Phase 3: Page-by-Page Alignment
7. **Remove duplicate padding** from Lab, Pharmacy, and any other page that adds its own `p-6`
8. **Standardize all page headers** to use the new `PageHeader` component
9. **Standardize card styles** — ensure all data cards use consistent border-radius, shadow, and padding
10. **Align button styles** — primary actions use the same gradient/solid style, secondary actions use the same outline style
11. **Fix typography** — all headings use `text-gray-900`, all subtitles use `text-gray-500`

### Phase 4: Polish
12. **Consistent animations** — all pages use `animate-fade-in` on mount
13. **Breadcrumbs** — ensure all inner pages show breadcrumbs consistently (Navbar already has them, so remove duplicate `<Breadcrumbs />` from page bodies)
14. **Remove `App.css`** — it has Vite boilerplate (`#root { max-width: 1280px }`) that conflicts with the full-width layout

---

## Estimated Scope
- ~15 files modified
- 3 new shared components
- 1 file deleted (`tailwind.config.js`)
- 1 file deleted (`App.css`)
- Zero functional changes

