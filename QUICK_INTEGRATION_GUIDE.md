# QUICK INTEGRATION GUIDE
**3-Minute Setup for Remaining Integrations**

---

## 1. INTEGRATE SETTINGS PROVIDER (2 minutes)

**File**: `src/App.tsx` or `src/main.tsx`

```typescript
import { SettingsProvider } from './contexts/SettingsContext';
import { useAuth } from './hooks/useAuth';

function AppWrapper() {
  const { hospitalId } = useAuth();

  return (
    <SettingsProvider hospitalId={hospitalId}>
      <App />
    </SettingsProvider>
  );
}
```

**Then use anywhere**:
```typescript
import { useSettings } from '@/contexts/SettingsContext';

function AnyComponent() {
  const { settings, getSetting } = useSettings();

  return (
    <div>
      <h1>{settings?.hospital_name}</h1>
      <img src={settings?.hospital_logo} />
    </div>
  );
}
```

---

## 2. USE CENTRALIZED PRINT (5 minutes per print)

**Replace this**:
```typescript
// OLD - Custom print logic
const printBill = () => {
  const printWindow = window.open('', '_blank');
  printWindow.document.write(/* custom HTML */);
  printWindow.print();
};
```

**With this**:
```typescript
// NEW - Centralized print
import { printDocument, getHospitalSettings } from '@/lib/printDocument';

const printBill = async () => {
  const hospitalSettings = await getHospitalSettings(hospitalId);

  await printDocument('OPD_BILL', {
    ...hospitalSettings,
    bill_number: bill.bill_number,
    date: new Date().toLocaleDateString(),
    patient_name: patient.full_name,
    uhid: patient.uhid,
    doctor_name: doctor.full_name,
    token: appointment.token_number,
    visit_type: bill.visit_type,
    amount: bill.amount,
    gst: bill.gst_amount,
    total: bill.total_amount,
    payment_mode: bill.payment_mode
  });
};
```

**Available Document Types**:
- `'OPD_BILL'`
- `'PRESCRIPTION'`
- `'IPD_BILL'`
- `'DISCHARGE_SUMMARY'`
- `'PATIENT_STICKER'`
- `'IPD_LABEL'`
- `'RECEIPT'`
- `'LAB_REPORT'`

---

## 3. ADD REALTIME TO DOCTOR QUEUE (10 minutes)

**File**: `src/modules/doctor-queue/DoctorQueuePage.tsx`

```typescript
import { useRealtime } from '@/hooks/useRealtime';

function DoctorQueuePage() {
  const [appointments, setAppointments] = useState<QueueAppointment[]>([]);
  const { user } = useAuth();

  // Initial load
  useEffect(() => {
    loadTodayQueue();
  }, []);

  // Real-time updates
  useRealtime({
    table: 'appointments',
    filter: `doctor_id=eq.${user?.id}`,
    event: '*',
  }, ({ new: newAppt, old: oldAppt, eventType }) => {
    if (eventType === 'INSERT') {
      setAppointments(prev => [...prev, newAppt as QueueAppointment]);
    } else if (eventType === 'UPDATE') {
      setAppointments(prev =>
        prev.map(a => a.id === newAppt.id ? newAppt as QueueAppointment : a)
      );
    } else if (eventType === 'DELETE') {
      setAppointments(prev => prev.filter(a => a.id !== oldAppt.id));
    }
  });

  // Rest of component...
}
```

---

## 4. ADD REALTIME TO BED GRID (10 minutes)

**File**: `src/modules/ipd/BedMasterPage.tsx`

```typescript
import { useRealtime } from '@/hooks/useRealtime';

function BedMasterPage() {
  const [beds, setBeds] = useState<Bed[]>([]);

  // Initial load
  useEffect(() => {
    loadBeds();
  }, []);

  // Real-time bed status updates
  useRealtime({
    table: 'beds',
    filter: `hospital_id=eq.${hospitalId}`,
    event: 'UPDATE',
  }, ({ new: updatedBed }) => {
    setBeds(prev =>
      prev.map(bed => bed.id === updatedBed.id ? updatedBed as Bed : bed)
    );
  });

  // Rest of component...
}
```

---

## 5. ADD PERMISSION GATING (Example)

**Before**:
```typescript
<Button onClick={deleteBill}>Delete Bill</Button>
```

**After**:
```typescript
import { usePermissions } from '@/hooks/usePermissions';

function BillingPage() {
  const { can } = usePermissions();

  return (
    <>
      {can('void_bills') ? (
        <Button onClick={deleteBill}>Delete Bill</Button>
      ) : (
        <Button disabled title="No permission">Delete Bill</Button>
      )}
    </>
  );
}
```

**Common Permissions**:
- `'edit_bill_amount'`
- `'void_bills'`
- `'delete_masters'`
- `'discharge_patient'`
- `'manage_masters'`
- `'view_revenue'`
- `'export_reports'`

---

## VERIFICATION AFTER INTEGRATION

### Test Settings:
1. Settings load on app start
2. Hospital name shows in sidebar
3. Auto-print works (if enabled)

### Test Prints:
1. Print OPD bill → shows hospital header
2. Print prescription → shows doctor name
3. All {{variables}} replaced correctly

### Test Realtime:
1. Create appointment in one browser tab
2. Verify it appears in doctor queue in another tab (within 2 seconds)
3. Update bed status → verify bed grid updates

### Test Permissions:
1. Login as different roles
2. Verify buttons show/hide correctly
3. Test denied actions redirect or show error

---

## TROUBLESHOOTING

### Settings not loading?
```typescript
// Check hospital ID is being passed
console.log('Hospital ID:', hospitalId);

// Check settings query
const { data } = await supabase.from('hospitals').select('*').eq('id', hospitalId);
console.log('Hospital data:', data);
```

### Realtime not working?
```typescript
// Check Supabase realtime is enabled in dashboard
// Check filter syntax is correct
useRealtime({
  table: 'appointments',
  filter: 'doctor_id=eq.abc-123', // Note: =eq. syntax
  event: '*',
}, (payload) => {
  console.log('Realtime event:', payload);
});
```

### Print not opening?
```typescript
// Check popup blocker
// Check if hospital settings loaded
const settings = await getHospitalSettings(hospitalId);
console.log('Settings:', settings);
```

---

## DONE!

That's it. Three main integrations:
1. ✅ Wrap app with SettingsProvider
2. ✅ Replace print logic with printDocument()
3. ✅ Add useRealtime() to doctor queue and bed grid

Everything else already works correctly thanks to the critical fixes applied.
