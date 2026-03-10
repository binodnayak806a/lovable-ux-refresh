

## Plan: Configurable OPD Case Paper Print

### Problem
The current `CasePaperPrint` component has a fixed layout with no configurability. Users cannot toggle which sections to show, adjust font sizes, or choose paper sizes — unlike the recently added IPD sticker print.

### Changes

**Enhance `src/modules/appointments/components/CasePaperPrint.tsx`**
- Add a **left settings panel** (similar to `IpdStickerPrint`) with:
  - **Section toggles**: Hospital Header, Patient Info, Doctor Info, Chief Complaint, Vitals (blank), Examination/Findings, Diagnosis, Rx/Prescription, Signatures
  - **Paper size selector**: A4 (default), A5
  - **Font size selector**: 10px–14px range
  - **Blank line count control**: Adjust how many dotted lines appear in each blank section (default 8)
- Keep the **right side live preview** with the rendered case paper
- Use `useReactToPrint` for the print action (already in place)
- Add QR code toggle (encodes UHID + Date + Token)

**No other files need changes** — the component is already wired into `AppointmentsPage.tsx` and `QueueKanban.tsx`.

### Result
A configurable OPD Case Paper dialog with toggleable sections, font/paper size controls, and live preview — consistent with the IPD sticker print pattern.

