

## Plan: Remove Doctor-wise OPD Summary from Dashboard

**Single change in `src/modules/dashboard/DashboardPage.tsx`:**
- Remove the `DoctorStatsPanel` import (line 23)
- Remove the Section 8 block rendering `<DoctorStatsPanel>` (around lines 281-282)

The `DoctorStatsPanel` component file and `doctorStats` data in the Redux store will be left intact (no side effects from keeping them).

