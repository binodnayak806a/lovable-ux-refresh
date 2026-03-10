

## Plan: Redesign Patient Registration as 3-Column Full-Page Layout

Redesign the `AddPatientPage.tsx` to match the reference screenshot — a dense, full-page 3-column layout with "Patient Details", "Contact Details", and "Kin Details" side by side, with tabbed sections below for "Other Info" and "Payer Details".

### Layout Structure

```text
┌─────────────────────────────────────────────────────────────┐
│ [Patient Info btn]   Registration Date: dd/MM/yyyy    [X]   │
├──────────────────┬──────────────────┬────────────────────────┤
│ Patient Details  │ Contact Details  │ Kin Details            │
│ ─────────────── │ ──────────────── │ ──────────────────     │
│ First Name *     │ Country Code +91 │ Relation [dropdown]   │
│ Middle Name      │ Mobile Number *  │ Title [dropdown]      │
│ Last Name        │ House/Flat No    │ Full Name             │
│ DOB / Age        │ Society/Apt Name │ Contact No            │
│ Gender (radio)   │ Area/Landmark    │                       │
│ Blood Group      │ Pincode          │                       │
│ Language         │ City             │                       │
│ Weight           │ State            │                       │
├──────────────────┴──────────────────┴────────────────────────┤
│ [Other Info]  [Payer Details]  ← tabs                       │
│ ─────────────────────────────────────                       │
│ Referred By / Additional Details / Medical History           │
│ OR Insurance / TPA billing info                              │
├─────────────────────────────────────────────────────────────┤
│ □ Label Print  □ Need To Verify?   [Cancel]  [Add Patient]  │
└─────────────────────────────────────────────────────────────┘
```

### Changes

**1. Rewrite `AddPatientPage.tsx` — Full-page 3-column layout**
- Replace the current wrapper that delegates to `PatientRegistrationForm`
- Build the form directly inline with 3-column grid: Patient Details | Contact Details | Kin Details
- Add a yellow "Patient Information" header bar with registration date and close button
- Add tabbed bottom section: "Other Info" tab (referral, medical history, allergies) and "Payer Details" tab (billing category, insurance)
- Sticky footer bar with: Label Print checkbox, "Need To Verify?" checkbox, Cancel button, "Add Patient" button
- Reuse existing form state logic, validation, and submit from `PatientRegistrationForm`
- Keep existing `PatientStickerPrint` integration

**2. Keep `PatientRegistrationForm.tsx` unchanged**
- It's still used by OPD flow and EditPatientPage — no changes needed there

### Files to edit:
- `src/modules/patients/AddPatientPage.tsx` — full rewrite with 3-column inline form layout

