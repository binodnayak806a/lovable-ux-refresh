

## Plan: Add Category Selection to Billing Line Items

Currently, each line item in the Create Bill dialog has a `category` field that's auto-populated from the selected service but **not visible or editable** in the UI. Users need to be able to set/change the category for each line item.

### Changes

**`src/modules/billing/components/CreateBillDialog.tsx`**
- Add a "Category" column header to the line items table (between Item and Qty)
- Add a `<select>` dropdown in each line item row for category selection
- Use billing-relevant categories: Consultation, Procedure, Medication, Lab, Room Charges, Nursing, Surgery, Radiology, Physiotherapy, Ambulance, Other
- Default category remains `consultation` for blank items; auto-set from service when added via quick-add

### Single file edit, purely UI — no database or type changes needed.

