

## Plan: Configurable Patient Sticker Print for IPD Admissions

### Problem
The current IPD "Print Label" opens a basic fixed-layout label (`IpdLabelPrint`). It lacks the configurable field toggles, printer type selection (thermal/A4), and font size controls that the Patient module's sticker printer offers. IPD also needs admission-specific fields (Admission#, Ward/Bed, Admission Date, Stay Duration).

### Changes

**1. Create `src/modules/ipd/components/IpdStickerPrint.tsx`**
- Build a configurable sticker dialog modeled on `PatientStickerPrint` but with IPD-specific fields
- Field toggles: UHID, Name, Age/Gender, Mobile, Blood Group, Doctor, Ward/Bed, Admission#, Admission Date, Stay Duration, Address, Guardian, QR Code
- Printer type selector: Sticker (80mm x 50mm) / General (A4)
- Font size selector (7-12px)
- Live preview panel with print button
- QR code encoding UHID, Admission#, and Bed info

**2. Update `src/modules/ipd/IPDPage.tsx`**
- Replace `IpdLabelPrint` import with `IpdStickerPrint`
- Update the `labelAdmission` rendering to use the new component

**3. Update `src/modules/ipd/components/PatientDetailPanel.tsx`**
- Replace `IpdLabelPrint` import with `IpdStickerPrint` in the detail panel's label button

### Files
- **New**: `src/modules/ipd/components/IpdStickerPrint.tsx`
- **Edit**: `src/modules/ipd/IPDPage.tsx` (swap component)
- **Edit**: `src/modules/ipd/components/PatientDetailPanel.tsx` (swap component)

