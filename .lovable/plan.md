

## Plan: Add Middle Name + Redesign Patient Registration as Full-Page with Sticker Print

### Changes

**1. Add `middleName` field to form data (`src/modules/opd/types.ts`)**
- Add `middleName: string` to `RegistrationFormData` interface
- Add `middleName: ''` to `EMPTY_FORM`

**2. Update Personal Info section in `PatientRegistrationForm.tsx`**
- Change the name row from 2 columns (First, Last) to 3 columns (First, Middle, Last)
- Add `middleName` InputField between first and last name

**3. Update `Step1Personal.tsx`** (used in step-based flow)
- Add middle name field in 3-column grid alongside first/last name

**4. Redesign `AddPatientPage.tsx` — Full-page layout with sticker print**
- Inspired by the reference screenshot: a full-bleed, dense layout with 3-column sections (Patient Details | Contact Details | Kin Details)
- Add a registration date display at the top
- Add footer bar with "Label Print" checkbox toggle + "Cancel" and "Add Patient" buttons
- After successful registration, if "Label Print" is checked, auto-open `PatientStickerPrint` dialog
- Import and use the existing `PatientStickerPrint` component

**5. Update `EditPatientPage.tsx`**
- Map `middleName` from stored patient data (extract from `full_name` parts)
- Pass it through `initialData`

**6. Update patient creation in `opdService` / `mockStore`**
- Include `middleName` when building `full_name` (concatenate first + middle + last)

### Files to edit:
- `src/modules/opd/types.ts` — add middleName field
- `src/modules/opd/components/PatientRegistrationForm.tsx` — add middle name input, add sticker print trigger after registration
- `src/modules/opd/steps/Step1Personal.tsx` — add middle name input
- `src/modules/patients/AddPatientPage.tsx` — redesign as full-page with Label Print checkbox in footer
- `src/modules/patients/EditPatientPage.tsx` — map middleName from full_name

