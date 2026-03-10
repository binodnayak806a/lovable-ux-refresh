

## Plan: OPD & IPD Bill UI Fix + Service Group-wise Item Selection

### Problem
1. The **Create Bill dialog** (`CreateBillDialog.tsx`) is a modal overlay — not a full-page layout like the patient registration redesign
2. The **OPD BillingTab** uses hardcoded `COMMON_SERVICES` and free-text item entry instead of pulling from the Service Master with grouped options
3. The **IPD RunningBillTab** service search dialog has a flat list — no grouping by Service Group
4. None of the billing UIs let users browse/filter services by Service Group (Consultation, Lab, Radiology, Procedure, etc.)

### Changes

**1. Create a shared `ServiceGroupPicker` component**
- New file: `src/components/billing/ServiceGroupPicker.tsx`
- Renders horizontal tabs/chips for each Service Group (Consultation, Lab, Radiology, Room Charges, Procedure, Surgery, Pharmacy, Nursing, Emergency, Other)
- Shows filtered service items under the selected group with name, code, rate, GST%
- Click-to-add behavior — clicking a service fires `onSelect(service)` callback
- Includes a search bar that filters across all groups
- Fetches services from `service_items` table filtered by `hospital_id` and `is_active = true`

**2. Redesign `CreateBillDialog.tsx` → full-page `CreateBillPage.tsx`**
- Convert from modal to a full-page route at `/billing/new` (outside AppLayout, like AddPatientPage)
- Layout: header bar with patient selector + bill type, then a 2-column layout:
  - Left: Service Group picker + line items table
  - Right: Payment mode + Bill Summary (discount, GST, total)
- Footer: Cancel / Generate Bill buttons
- Integrate `ServiceGroupPicker` for adding items
- Keep existing calculation logic (subtotal, discount, CGST/SGST, grand total)
- Update route in `src/routes/index.tsx`

**3. Update OPD `BillingTab.tsx` — integrate ServiceGroupPicker**
- Replace `COMMON_SERVICES` quick-add buttons with the `ServiceGroupPicker` component
- When a service is selected, auto-populate itemName, itemType, unitPrice from the service master
- Keep manual "Add Item" button for custom entries

**4. Update IPD `RunningBillTab.tsx` — grouped service search**
- Replace flat `ServiceSearchDialog` with the `ServiceGroupPicker` inside the dialog
- Show services grouped by Service Group with tabs
- Keep existing Package and Manual item entry flows unchanged

**5. Update `BillingPage.tsx` — navigate to full page**
- Change "New Bill" button to navigate to `/billing/new` instead of opening modal
- Remove `CreateBillDialog` import and state

### Files to create:
- `src/components/billing/ServiceGroupPicker.tsx`

### Files to edit:
- `src/modules/billing/BillingPage.tsx` — navigate to `/billing/new` instead of modal
- `src/modules/billing/components/CreateBillDialog.tsx` → rename/rewrite as full-page `CreateBillPage.tsx`
- `src/modules/opd/billing/BillingTab.tsx` — integrate ServiceGroupPicker
- `src/modules/ipd/components/RunningBillTab.tsx` — grouped service search
- `src/routes/index.tsx` — add `/billing/new` route outside AppLayout

