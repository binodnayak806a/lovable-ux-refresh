
# Dashboard Revamp Plan

## Current State
The dashboard has a decent structure with role-based views (Admin, Doctor, Nurse, etc.), metric cards, charts, and data panels. However, it feels dense and generic — sections are stacked linearly with uniform card styling, no visual breathing room, and the layout lacks a premium "command center" feel.

## What Changes

### 1. Hero Banner Upgrade
- Replace the flat gradient banner with a richer design: add a subtle grid pattern overlay, larger greeting text, live clock display, and quick-stat pills (total patients today, pending tasks) embedded in the banner
- Add a "Last updated X min ago" indicator next to Refresh

### 2. Metric Cards — Animated & Interactive
- Add animated count-up numbers using a `useCountUp` hook (pure CSS/JS, no library)
- Add a subtle gradient background per card (blue gradient for OPD, green for revenue, etc.)
- Increase card padding, add a hover state that reveals a "View Details →" micro-link
- Show the trend sparkline more prominently with a percentage chip

### 3. Layout Grid Restructure (Admin View)
Current layout stacks 8+ sections vertically. Restructure into a tighter 2-column command center:

```text
┌─────────────────────────────────┐
│         Hero Banner             │
├────────┬────────┬────────┬──────┤
│ OPD    │Revenue │ IPD    │ Beds │  ← Metric cards
├────────┴────────┴────────┴──────┤
│ Status Strip (Waiting/Engaged/Done/Cancelled) │
├──────────────────┬──────────────┤
│ Revenue Trend    │ Today's      │
│ Chart (2/3)      │ Appointments │
│                  │ (1/3)        │
├──────────────────┼──────────────┤
│ Hourly Activity  │ Bed Donut +  │
│ Chart (2/3)      │ OPD by Dr    │
│                  │ (1/3)        │
├──────────────────┴──────────────┤
│ Doctor Stats Table              │
├──────────────────┬──────┬───────┤
│ Low Stock  │ Lab Orders │ Pharm │  ← Alert row
├──────────────────┴──────┴───────┤
│ Quick Nav Cards                 │
└─────────────────────────────────┘
```

### 4. Section Headers — Unified Style
- Every card/panel section gets a consistent header: icon + title on left, action link on right, thin bottom border
- Add subtle section dividers between major groups

### 5. Charts Visual Upgrade
- Consistent dark tooltip style (already mostly done)
- Add gradient fills to line charts (area under curve with opacity gradient)
- Rounded bar tops with softer colors
- Add "No data" illustrations consistently

### 6. Quick Nav Cards — Glassmorphic Upgrade
- Apply `.glass-card` styling with larger icons, colored icon backgrounds
- Add subtle arrow animation on hover

### 7. Doctor Dashboard Improvements
- Quick Actions grid gets larger, more spaced-out cards with colored icon circles
- Add a "Patients Seen Today" counter prominently

### 8. Empty States
- Consistent empty state across all panels with soft icon + descriptive text

### 9. CSS / Utility Additions
- Add `@keyframes countUp` properly to `index.css`
- Add `.dashboard-section` utility class for consistent section spacing
- Add gradient background utilities for metric cards
- Refine `.hero-banner` with pattern overlay

## Files Modified
1. **`src/modules/dashboard/DashboardPage.tsx`** — Restructure layout grid, upgrade hero banner, add live clock, reorder sections
2. **`src/modules/dashboard/components/MetricCard.tsx`** — Add count-up animation hook, gradient backgrounds, hover reveal link
3. **`src/modules/dashboard/components/RevenueTrendChart.tsx`** — Add area gradient fill under lines
4. **`src/modules/dashboard/components/HourlyTrendChart.tsx`** — Softer bar colors with gradient
5. **`src/modules/dashboard/components/AppointmentStatusStrip.tsx`** — Add animated count transitions, slightly larger cards
6. **`src/modules/dashboard/components/BedOccupancyDonut.tsx`** — Add center label styling refinement
7. **`src/modules/dashboard/components/OPDByDoctorChart.tsx`** — Gradient bar fills
8. **`src/modules/dashboard/components/DoctorStatsPanel.tsx`** — Add progress bars for completion rate per doctor
9. **`src/modules/dashboard/components/UpcomingAppointments.tsx`** — Tighter row spacing, time highlight
10. **`src/modules/dashboard/components/RecentAppointmentsPanel.tsx`** — Row hover polish
11. **`src/index.css`** — Add new utility classes, refine hero-banner
12. **`src/modules/dashboard/components/LowStockAlert.tsx`** — Minor polish
13. **`src/modules/dashboard/components/PendingLabOrders.tsx`** — Minor polish
14. **`src/modules/dashboard/components/PharmacySalesToday.tsx`** — Minor polish

No business logic changes — purely visual/layout.
