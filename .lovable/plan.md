

## Plan: Improve Low Stock, Pending Labs & Pharmacy Sales Dashboard Widgets

### 1. **LowStockAlert** — Add severity indicators, stock percentage labels, and "Reorder" action
- Show stock as "15/50" text beside the progress bar for clarity
- Add a pulsing red dot for critical items (below 50% of reorder level)
- Add an "Out of Stock" badge for items at 0
- Show batch number below medication name
- Add a summary footer: "3 Critical · 2 Warning"
- Empty state if no low-stock items

### 2. **PendingLabOrders** — Add status chips, TAT indicator, and grouping
- Show status as colored chip (Pending = yellow, Sample Collected = blue, In Progress = purple)
- Add a TAT (turnaround time) warning icon when order is overdue (>2 hours)
- Add a priority sort — urgent/stat orders float to top
- Show test name alongside patient name (from demo data)
- Add summary footer: "2 Urgent · 1 STAT · 2 Routine"

### 3. **PharmacySalesToday** — Add mini sparkline, top-selling item, and breakdown
- Add a mini bar chart showing hourly sales distribution (demo data)
- Show "Top Seller: Paracetamol 500mg" line
- Add cash vs UPI vs card split as small horizontal stacked bar
- Show average bill value metric
- Add "View Details" link to pharmacy page
- Use `useNavigate` for clickability

### Files to edit:
- `src/modules/dashboard/components/LowStockAlert.tsx` — full rewrite
- `src/modules/dashboard/components/PendingLabOrders.tsx` — full rewrite  
- `src/modules/dashboard/components/PharmacySalesToday.tsx` — full rewrite

