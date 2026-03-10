

## Plan: Add Ward Category to Ward Master

The `wards` table currently has `ward_type` but no `category` column. The Ward Management page has a local `WARD_CATEGORIES` array but never saves it to the database. The Master Data `WardsTab` and `WardDialog` also lack a category field.

### Changes

**1. Database migration — add `category` column to `wards` table**
- `ALTER TABLE wards ADD COLUMN category text DEFAULT 'General Ward'`
- No RLS changes needed (existing policies cover it)

**2. Update `src/modules/ipd/types.ts` — add `category` to Ward interface**
- Add `category: string | null` to the `Ward` interface

**3. Update `src/modules/master-data/types.ts` — add `category` to Ward interface**
- Add `category: string | null` to the `Ward` interface and `WardFormData`

**4. Update `src/modules/master-data/components/WardDialog.tsx` — add Category dropdown**
- Add a Select field for Ward Category using the `WARD_CATEGORIES` list: General Ward, Private Room, Semi-Private, ICU, NICU, PICU, HDU, Emergency, OT, Isolation
- Include it in the form schema and default values

**5. Update `src/modules/master-data/components/WardsTab.tsx` — show Category column**
- Add a "Category" column to the table between Ward Name and Type
- Add category to the filter options

**6. Update `src/modules/ipd/WardManagementPage.tsx` — save category to DB**
- Include `category` in the ward create/update calls (currently in form state but not persisted)

### Files to edit:
- `src/modules/ipd/types.ts`
- `src/modules/master-data/types.ts`
- `src/modules/master-data/components/WardDialog.tsx`
- `src/modules/master-data/components/WardsTab.tsx`
- `src/modules/ipd/WardManagementPage.tsx`

