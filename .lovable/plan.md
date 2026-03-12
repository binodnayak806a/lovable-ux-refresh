

## Plan: Full-Page Billing Screen with Invoice-Style Layout + Service Group Picker in OPD

### Problem
The current `CreateBillPage` works but doesn't match the reference image's clean invoice-style layout. The line items table lacks columns for Description, Unit, Discount (% + Amount), and Tax (% + Amount). The OPD `BillingTab` has the ServiceGroupPicker but it's buried below the items table. The billing page needs a more professional, spreadsheet-like invoice feel.

### Changes

#### 1. Redesign `src/modules/billing/components/CreateBillPage.tsx` — Full Invoice Layout
- **Top bar**: Patient search (left) + Invoice Number + Invoice Date + State of Supply (right) — matching the reference image layout
- **Credit/Cash toggle**: Add a toggle for credit vs cash billing mode at the top
- **Line items table**: Expand columns to match reference:
  - `#` | `ITEM` | `DESCRIPTION` | `QTY` | `UNIT` (dropdown: NONE, Nos, Pcs) | `PRICE/UNIT` (With/Without Tax toggle) | `DISCOUNT %` | `DISCOUNT AMOUNT` | `TAX %` | `TAX AMOUNT` | `AMOUNT`
  - Each row is inline-editable with clean borders
  - "ADD ROW" button below items
  - TOTAL row at the bottom of the table
- **Bottom section**: Round-off checkbox + Total display on the right, Description/Notes on the left
- **Footer**: Share dropdown + Save button (primary blue)
- **Service Group Picker**: Integrate as a collapsible panel or sidebar — clicking a service auto-fills a new row
- Keep existing payment mode selection, split payment, cash calculator but move to a collapsible section

#### 2. Update `src/modules/opd/billing/BillingTab.tsx` — Add Service Group filtering
- Move the `ServiceGroupPicker` above the line items table (more prominent placement)
- Ensure `filterType="OPD"` is applied so only OPD-relevant services show

#### 3. Update line item types
- Add `description`, `unit`, `discountPercent`, `discountAmount`, `taxPercent`, `taxAmount` fields to the `LineItem` interface in `CreateBillPage`
- Keep backward compatibility with existing `BillItem` type in `types.ts`

### Files to Change
1. **`src/modules/billing/components/CreateBillPage.tsx`** — Complete rewrite of the layout to invoice-style full-page
2. **`src/modules/opd/billing/BillingTab.tsx`** — Reorder ServiceGroupPicker above items table

### Result
A professional invoice-creation screen matching the reference design with full column control (description, unit, per-item discount, per-item tax), clean spreadsheet-like UX, and prominent Service Group picker integration.

