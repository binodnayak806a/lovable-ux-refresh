

# Comprehensive Hospital Management System Enhancement Plan

This is a large-scope request covering multiple modules. I will break it into logical implementation groups.

---

## Group 1: Appointment Management Enhancements

**Current state**: AppointmentsPage has calendar views (day/week/month), kanban, and CreateAppointmentDialog. CasePaperPrint exists.

**Changes needed**:
- Ensure appointment CRUD is fully functional with proper status management
- Verify label sticker printing works from appointment context
- Ensure OPD Case Paper print is accessible from appointment actions

---

## Group 2: OPD Billing / Package Billing with Receipt Modes

**Current state**: `BillingTab.tsx` supports cash/card/upi/online/insurance payment modes. `BillingPage.tsx` has bill management.

**Changes needed**:
- **Add Split Payment mode**: Allow splitting payment across multiple modes (e.g., part Cash + part UPI)
- **Add RTGS payment mode** to both `BillingTab` and `BillingPage`
- **Package Billing**: Add ability to select a pre-defined package from PackageMaster and auto-populate bill items
- **OPD Receipt**: Enhance `ReceiptPrintPreview` to show payment mode breakdown including split

### Files to modify:
- `src/modules/opd/billing/types.ts` - Add 'rtgs' and 'split' to PaymentMode, add split payment data structure
- `src/modules/opd/billing/BillingTab.tsx` - Add split payment UI, package selection dropdown
- `src/modules/opd/billing/ReceiptPrintPreview.tsx` - Show split payment details
- `src/modules/billing/BillingPage.tsx` - Update payment modes
- `src/modules/billing/components/CollectPaymentDialog.tsx` - Add split mode UI

---

## Group 3: IPD Enhancements

**Current state**: IPD has BedAvailability, WardBoard, AdmissionDialog, DischargeDialog, DischargeSummaryView. Basic admission/discharge flow exists.

**Changes needed**:

### 3a. Multiple Sticker Printing
- Add bulk sticker print for IPD patients (select multiple patients, print stickers)
- New component: `IpdBulkStickerPrint.tsx`

### 3b. IPD Billing Flow (Deposit, Refund)
- Create `IpdBillingTab.tsx` with:
  - Running bill view (already exists as `RunningBillTab`)
  - **Deposit collection** with receipt
  - **Refund processing** with approval workflow
  - Deposit balance tracking
- New service methods in `ipd.service.ts`

### 3c. Discharge Summary
- Already exists as `DischargeSummaryView.tsx` - enhance if needed
- Ensure print-ready format

### 3d. Discharge Flow
- Already exists as `DischargeDialog.tsx` - verify completeness

### Files to modify/create:
- `src/modules/ipd/IPDPage.tsx` - Add IPD Billing tab, bulk sticker action
- `src/modules/ipd/components/IpdBillingTab.tsx` (new) - Deposit/refund flow
- `src/modules/ipd/components/IpdBulkStickerPrint.tsx` (new)
- `src/modules/ipd/types.ts` - Add deposit/refund types
- `src/services/ipd.service.ts` - Add deposit/refund methods

---

## Group 4: Settings Enhancements

**Current state**: SettingsPage has tabs for Hospital, Billing, Clinical, Notifications, Security, Print, SMS, Theme.

### 4a. Print Settings
- Already has print settings in SettingsPage - enhance with per-document template selection
- Add options for: auto-print on save, default printer, paper size per document type

### 4b. OPD Room - Doctor Wise Configuration
- New settings tab/section to map doctors to OPD rooms
- Create `OpdRoomConfig` component
- Database: May need new table `opd_room_assignments`

### 4c. Service Group Master (Import/Export)
- Enhance existing ServiceMasterPage with CSV import functionality
- `parseCSV` utility already exists in `src/modules/masters/utils/csv.ts`
- Add import button + dialog to ServiceMasterPage

### 4d. Service Item Master - Enhanced Add Form
- Modify ServiceMasterPage add/edit form to include:
  - Service Type: OPD / IPD / BOTH dropdown
  - Ward-category-wise pricing (for IPD items)
- This partially exists in `master-data` types (`ServiceItem` has `service_type` and `ward_prices`)

### 4e. Billing Master - Bulk Rate Import
- New page/tab for bulk importing service rates via CSV
- Reuse `parseCSV` utility

### Files to modify/create:
- `src/modules/settings/SettingsPage.tsx` - Add OPD Room config tab
- `src/modules/settings/components/OpdRoomConfig.tsx` (new)
- `src/modules/masters/pages/ServiceMasterPage.tsx` - Add import/export, service type, ward pricing
- `src/modules/masters/pages/BulkRateImportPage.tsx` (new)

---

## Group 5: EMR - Ward Management

**Current state**: Wards table exists in DB with fields (name, ward_type, total_beds, available_beds, daily_rate, floor, block). `BedMasterPage` exists. `BedAvailability` component shows beds.

**Changes needed**:
- Create a proper **Ward Management** page with:
  - Ward Category (General, Private, ICU, etc.)
  - Ward Name
  - Bed Number management (add/edit/delete beds within a ward)
- This may be an enhancement to existing `BedMasterPage.tsx`

### Files to modify/create:
- `src/modules/ipd/BedMasterPage.tsx` - Enhance with ward CRUD + bed number management
- Or create new `src/modules/ipd/WardManagementPage.tsx`

---

## Database Changes Required

1. **`ipd_deposits`** table - for tracking IPD deposits and refunds
2. **`opd_room_assignments`** table - for doctor-to-room mapping
3. Add `service_type` and `ward_prices` columns to `services` table if not present
4. Potentially add `payment_splits` table for split payment tracking

---

## Implementation Order (Priority)

1. **OPD Billing enhancements** (Split/RTGS payment, package billing) - most impactful for daily use
2. **IPD Billing Flow** (Deposit/Refund) - critical financial feature
3. **Service Item Master** enhancements (OPD/IPD/BOTH, ward-wise pricing, import/export)
4. **Ward Management** (Ward Category, Name, Bed Numbers)
5. **IPD Multiple Sticker** printing
6. **OPD Room - Doctor Wise** settings
7. **Print Settings** enhancements
8. **Bulk Rate Import**

---

## Summary of New Files
- `src/modules/ipd/components/IpdBillingTab.tsx`
- `src/modules/ipd/components/IpdBulkStickerPrint.tsx`
- `src/modules/settings/components/OpdRoomConfig.tsx`
- `src/modules/masters/pages/BulkRateImportPage.tsx`

## Summary of Modified Files
- `src/modules/opd/billing/types.ts`
- `src/modules/opd/billing/BillingTab.tsx`
- `src/modules/opd/billing/ReceiptPrintPreview.tsx`
- `src/modules/billing/BillingPage.tsx`
- `src/modules/billing/components/CollectPaymentDialog.tsx`
- `src/modules/ipd/IPDPage.tsx`
- `src/modules/ipd/types.ts`
- `src/modules/settings/SettingsPage.tsx`
- `src/modules/masters/pages/ServiceMasterPage.tsx`
- `src/modules/ipd/BedMasterPage.tsx`
- `src/services/ipd.service.ts`
- `src/routes/index.tsx`

This is a large feature set. I recommend implementing in the priority order listed above, tackling 2-3 groups per iteration.

