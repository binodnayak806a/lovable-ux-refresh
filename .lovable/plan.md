

## Plan: Ward Category-wise Pricing in Add Service Dialog

### Problem
The Service Item dialog's ward pricing section depends on individual wards fetched from the database. If no wards exist yet, the "Add Ward" button is disabled and no ward prices can be set. The pricing should be based on **ward categories** (General Ward, Private Room, ICU, etc.) instead of individual ward records.

### Changes

**`src/modules/master-data/components/ServiceItemDialog.tsx`**
- Replace ward-instance-based pricing with ward-category-based pricing using `WARD_CATEGORIES` from types
- Remove dependency on `wards` prop for pricing — use the static `WARD_CATEGORIES` list instead
- Update `WardPrice` entries to use category name as both `ward_id` and `ward_name`
- Remove the `wards` prop requirement (no longer needed for pricing)

**`src/modules/master-data/components/ServiceItemsTab.tsx`**
- Remove the wards fetch (`useEffect` + `masterDataService.getWards`) since it's no longer needed for the dialog
- Remove the `wards` prop from `ServiceItemDialog`

**`src/modules/master-data/types.ts`**
- No structural changes needed — `WardPrice` type already supports `ward_id`, `ward_name`, `price`

### Result
Ward pricing always shows all available ward categories (General Ward, Private Room, Semi-Private, ICU, NICU, PICU, HDU, Emergency, OT, Isolation) regardless of whether ward records exist in the database.

