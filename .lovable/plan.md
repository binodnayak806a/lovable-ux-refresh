

## Plan: Remove Recent Pages Section from Sidebar

**What changes:**
1. **`src/components/layout/Sidebar.tsx`** — Remove the `<RecentPagesSection />` component call from the `AppSidebar` render, and delete the `RecentPagesSection` function definition.

2. **`src/hooks/useRecentPages.ts`** — Keep `useRecentPages` hook (still used by GlobalSearch/Dashboard), but remove or leave `useFavoritePages` as-is since Favorites section remains.

**Scope:** Single file edit in `Sidebar.tsx` — remove the `RecentPagesSection` component and its usage. No other files affected.

