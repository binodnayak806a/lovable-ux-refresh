import { useState, useEffect, useCallback } from 'react';
import { Loader2 } from 'lucide-react';
import { Button } from '../../../components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../../../components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../../components/ui/select';
import { useHospitalId } from '../../../hooks/useHospitalId';
import { useToast } from '../../../hooks/useToast';
import { mastersService } from '../../../services/masters.service';
import MasterPageShell from '../components/MasterPageShell';
import MasterTable, { StatusBadge } from '../components/MasterTable';
import { exportToCSV } from '../utils/csv';
import type { DoctorMaster, DepartmentMaster } from '../types';
import { SPECIALTIES, WEEKDAYS } from '../types';

const EMPTY: Partial<DoctorMaster> = {
  first_name: '', last_name: '', specialty: '', phone: '', email: '',
  qualification: '', registration_number: '', first_visit_fee: 0,
  followup_fee: 0, schedule: {}, is_active: true, department_id: null,
};

export default function DoctorMasterPage() {
  const hospitalId = useHospitalId();
  const { toast } = useToast();
  const [data, setData] = useState<DoctorMaster[]>([]);
  const [depts, setDepts] = useState<DepartmentMaster[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [formOpen, setFormOpen] = useState(false);
  const [form, setForm] = useState<Partial<DoctorMaster>>(EMPTY);
  const [editId, setEditId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<DoctorMaster | null>(null);
  const [deleting, setDeleting] = useState(false);

  const load = useCallback(async () => {
    try {
      const [docs, departments] = await Promise.all([
        mastersService.getDoctors(hospitalId),
        mastersService.getDepartments(hospitalId),
      ]);
      setData(docs);
      setDepts(departments);
    } catch { toast('Error', { description: 'Failed to load doctors', type: 'error' }); }
    finally { setLoading(false); }
  }, [hospitalId]);

  useEffect(() => { load(); }, [load]);

  const openAdd = () => { setForm({ ...EMPTY }); setEditId(null); setFormOpen(true); };
  const openEdit = (d: DoctorMaster) => { setForm({ ...d }); setEditId(d.id); setFormOpen(true); };

  const handleSave = async () => {
    if (!form.first_name?.trim()) { toast('Enter Name', { type: 'error' }); return; }
    setSaving(true);
    try {
      await mastersService.upsertDoctor(hospitalId, form, editId || undefined);
      toast(editId ? 'Doctor Updated' : 'Doctor Added', { type: 'success' });
      setFormOpen(false);
      load();
    } catch { toast('Error', { description: 'Failed to save', type: 'error' }); }
    finally { setSaving(false); }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await mastersService.deleteDoctor(deleteTarget.id);
      toast('Doctor Deleted', { type: 'success' });
      setDeleteTarget(null);
      load();
    } catch { toast('Error', { description: 'Failed to delete', type: 'error' }); }
    finally { setDeleting(false); }
  };

  const handleToggle = async (d: DoctorMaster) => {
    try {
      await mastersService.upsertDoctor(hospitalId, { is_active: !d.is_active }, d.id);
      load();
    } catch { toast('Error', { type: 'error' }); }
  };

  const handleImport = async (rows: Record<string, string>[]) => {
    const mapped = rows.map(r => ({
      first_name: r.first_name || r.name || '',
      last_name: r.last_name || '',
      specialty: r.specialty || r.specialization || '',
      phone: r.phone || '',
      email: r.email || '',
      first_visit_fee: Number(r.first_visit_fee) || 0,
      followup_fee: Number(r.followup_fee) || 0,
      is_active: true,
    }));
    await mastersService.bulkInsert('doctors', mapped, hospitalId);
    toast('Imported', { description: `${mapped.length} doctors imported`, type: 'success' });
    load();
  };

  const setScheduleSlot = (day: string, start: string, end: string) => {
    const sched = { ...(form.schedule || {}) };
    if (!start && !end) { delete sched[day]; }
    else { sched[day] = [{ start, end }]; }
    setForm({ ...form, schedule: sched });
  };

  return (
    <MasterPageShell
      title="Doctors"
      count={data.length}
      loading={loading}
      search={search}
      onSearchChange={setSearch}
      onAdd={openAdd}
      onExport={() => exportToCSV(data as never[], 'doctors', [
        { key: 'first_name', label: 'First Name' }, { key: 'last_name', label: 'Last Name' },
        { key: 'specialty', label: 'Specialty' }, { key: 'phone', label: 'Phone' },
        { key: 'email', label: 'Email' }, { key: 'first_visit_fee', label: 'First Visit Fee' },
        { key: 'followup_fee', label: 'Follow-up Fee' },
      ])}
      onImport={handleImport}
      deleteOpen={!!deleteTarget}
      deleteName={deleteTarget ? `Dr. ${deleteTarget.first_name} ${deleteTarget.last_name || ''}` : ''}
      onDeleteConfirm={handleDelete}
      onDeleteCancel={() => setDeleteTarget(null)}
      deleting={deleting}
    >
      <MasterTable
        data={data}
        columns={[
          { key: 'first_name', label: 'Name', sortable: true, render: (d) => (
            <span className="font-medium">Dr. {d.first_name} {d.last_name || ''}</span>
          )},
          { key: 'specialty', label: 'Specialty', sortable: true },
          { key: 'department', label: 'Department', render: (d) => d.department?.name || '-' },
          { key: 'phone', label: 'Phone' },
          { key: 'first_visit_fee', label: 'First Visit', render: (d) => `Rs. ${d.first_visit_fee}` },
          { key: 'followup_fee', label: 'Follow-up', render: (d) => `Rs. ${d.followup_fee}` },
          { key: 'is_active', label: 'Status', width: '80px', render: (d) => <StatusBadge active={d.is_active} /> },
        ]}
        search={search}
        searchKeys={['first_name', 'last_name', 'specialty', 'phone', 'email']}
        getRowKey={(d) => d.id}
        onEdit={openEdit}
        onDelete={setDeleteTarget}
        onToggleActive={handleToggle}
      />

      <Dialog open={formOpen} onOpenChange={(o) => { if (!o) setFormOpen(false); }}>
        <DialogContent className="max-w-xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editId ? 'Edit Doctor' : 'Add Doctor'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-3">
              <Field label="First Name *" value={form.first_name || ''} onChange={v => setForm({ ...form, first_name: v })} />
              <Field label="Last Name" value={form.last_name || ''} onChange={v => setForm({ ...form, last_name: v })} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-gray-500 uppercase tracking-wide block mb-1.5">Specialty</label>
                <Select value={form.specialty || ''} onValueChange={v => setForm({ ...form, specialty: v })}>
                  <SelectTrigger><SelectValue placeholder="Select..." /></SelectTrigger>
                  <SelectContent>
                    {SPECIALTIES.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-xs text-gray-500 uppercase tracking-wide block mb-1.5">Department</label>
                <Select value={form.department_id || '_none'} onValueChange={v => setForm({ ...form, department_id: v === '_none' ? null : v })}>
                  <SelectTrigger><SelectValue placeholder="Select..." /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="_none">None</SelectItem>
                    {depts.map(d => <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Phone" value={form.phone || ''} onChange={v => setForm({ ...form, phone: v })} />
              <Field label="Email" value={form.email || ''} onChange={v => setForm({ ...form, email: v })} type="email" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Field label="First Visit Fee (Rs.)" value={String(form.first_visit_fee || 0)} onChange={v => setForm({ ...form, first_visit_fee: Number(v) || 0 })} type="number" />
              <Field label="Follow-up Fee (Rs.)" value={String(form.followup_fee || 0)} onChange={v => setForm({ ...form, followup_fee: Number(v) || 0 })} type="number" />
            </div>
            <div>
              <label className="text-xs text-gray-500 uppercase tracking-wide block mb-2">Schedule</label>
              <div className="space-y-2">
                {WEEKDAYS.map(day => {
                  const slot = form.schedule?.[day]?.[0];
                  return (
                    <div key={day} className="flex items-center gap-2">
                      <span className="w-24 text-xs font-medium text-gray-600 capitalize">{day}</span>
                      <input type="time" value={slot?.start || ''} onChange={e => setScheduleSlot(day, e.target.value, slot?.end || '')}
                        className="h-8 px-2 rounded-lg border border-gray-200 text-xs" />
                      <span className="text-xs text-gray-400">to</span>
                      <input type="time" value={slot?.end || ''} onChange={e => setScheduleSlot(day, slot?.start || '', e.target.value)}
                        className="h-8 px-2 rounded-lg border border-gray-200 text-xs" />
                      {slot && (
                        <button type="button" onClick={() => setScheduleSlot(day, '', '')} className="text-xs text-red-500 hover:underline">Clear</button>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setFormOpen(false)}>Cancel</Button>
            <Button onClick={handleSave} disabled={saving} className="bg-blue-600 hover:bg-blue-700">
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : editId ? 'Update' : 'Add'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </MasterPageShell>
  );
}

function Field({ label, value, onChange, type = 'text', placeholder }: {
  label: string; value: string; onChange: (v: string) => void; type?: string; placeholder?: string;
}) {
  return (
    <div>
      <label className="text-xs text-gray-500 uppercase tracking-wide block mb-1.5">{label}</label>
      <input type={type} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder}
        className="w-full h-9 px-3 rounded-lg border border-gray-200 text-sm outline-none focus:border-blue-400" />
    </div>
  );
}
