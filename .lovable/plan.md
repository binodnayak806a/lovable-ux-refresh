

## Plan: Make Patient Registration a True Full-Page (No Sidebar/Navbar)

The current `AddPatientPage` renders inside `AppLayout` (with sidebar + navbar), making it not truly full-page like the reference image. The fix is to move the `/add-patient` route outside the `AppLayout` wrapper so it renders as a standalone full-screen page.

### Changes

**1. Move `/add-patient` route outside AppLayout (`src/routes/index.tsx`)**
- Move `{ path: '/add-patient', element: <S><AddPatientPage /></S> }` from inside the `AppLayout` children to a sibling of the `ProtectedRoute` + `AppLayout` block (but still inside `ProtectedRoute`)
- This removes sidebar and navbar, giving the page full viewport

**2. Update `AddPatientPage.tsx` layout**
- Change root container from `h-full` to `h-screen` so it fills the entire viewport
- The page already has its own header bar, close button, and footer — no other changes needed

### Files to edit:
- `src/routes/index.tsx` — move route outside AppLayout
- `src/modules/patients/AddPatientPage.tsx` — use `h-screen` instead of `h-full`

