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
import type { MedicationMaster } from '../types';
import { MEDICINE_TYPES } from '../types';

const EMPTY: Partial<MedicationMaster> = {
  name: '', generic_name: '', brand_name: '', dosage_form: '', form: '',
  strength: '', manufacturer: '', shortcut: '', is_active: true,
};

export default function MedicineMasterPage() {
  const hospitalId = useHospitalId();
  const { toast } = useToast();
  const [data, setData] = useState<MedicationMaster[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [formOpen, setFormOpen] = useState(false);
  const [form, setForm] = useState<Partial<MedicationMaster>>(EMPTY);
  const [editId, setEditId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<MedicationMaster | null>(null);
  const [deleting, setDeleting] = useState(false);

  const load = useCallback(async () => {
    try { setData(await mastersService.getMedications(hospitalId)); }
    catch { toast('Error', { type: 'error' }); } finally { setLoading(false); }
  }, [hospitalId]);

  useEffect(() => { load(); }, [load]);

  const openAdd = () => { setForm({ ...EMPTY }); setEditId(null); setFormOpen(true); };
  const openEdit = (d: MedicationMaster) => { setForm({ ...d }); setEditId(d.id); setFormOpen(true); };

  const handleSave = async () => {
    if (!form.generic_name?.trim() && !form.name?.trim()) { toast('Enter Name', { type: 'error' }); return; }
    setSaving(true);
    try {
      await mastersService.upsertMedication(hospitalId, form, editId || undefined);
      toast(editId ? 'Updated' : 'Added', { type: 'success' }); setFormOpen(false); load();
    } catch { toast('Error', { type: 'error' }); } finally { setSaving(false); }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await mastersService.deleteMedication(deleteTarget.id);
      toast('Deleted', { type: 'success' }); setDeleteTarget(null); load();
    } catch { toast('Error', { type: 'error' }); } finally { setDeleting(false); }
  };

  const displayName = (d: MedicationMaster) => d.generic_name || d.name || d.brand_name || '-';

  return (
    <MasterPageShell
      title="Medicines" count={data.length} loading={loading}
      search={search} onSearchChange={setSearch} onAdd={openAdd}
      onExport={() => exportToCSV(data as never[], 'medicines', [
        { key: 'generic_name', label: 'Generic Name' }, { key: 'brand_name', label: 'Brand' },
        { key: 'dosage_form', label: 'Type' }, { key: 'shortcut', label: 'Shortcut' },
        { key: 'manufacturer', label: 'Manufacturer' },
      ])}
      onImport={async (rows) => {
        await mastersService.bulkInsert('medications', rows.map(r => ({
          name: r.name || r.generic_name || '', generic_name: r.generic_name || r.name || '',
          brand_name: r.brand_name || null, dosage_form: r.type || r.dosage_form || null,
          form: r.type || r.form || null, shortcut: r.shortcut || null,
          manufacturer: r.manufacturer || null, is_active: true,
        })), hospitalId);
        toast('Imported', { type: 'success' }); load();
      }}
      deleteOpen={!!deleteTarget} deleteName={deleteTarget ? displayName(deleteTarget) : ''}
      onDeleteConfirm={handleDelete} onDeleteCancel={() => setDeleteTarget(null)} deleting={deleting}
    >
      <MasterTable
        data={data}
        columns={[
          { key: 'generic_name', label: 'Name', sortable: true, render: d => <span className="font-medium">{displayName(d)}</span> },
          { key: 'brand_name', label: 'Brand', render: d => d.brand_name || '-' },
          { key: 'dosage_form', label: 'Type', render: d => d.dosage_form || d.form || '-' },
          { key: 'shortcut', label: 'Shortcut', render: d => d.shortcut ? <code className="text-xs bg-gray-100 px-1.5 py-0.5 rounded">{d.shortcut}</code> : '-' },
          { key: 'manufacturer', label: 'Manufacturer' },
          { key: 'is_active', label: 'Status', width: '80px', render: d => <StatusBadge active={d.is_active} /> },
        ]}
        search={search} searchKeys={['name', 'generic_name', 'brand_name', 'shortcut', 'manufacturer']}
        getRowKey={d => d.id} onEdit={openEdit} onDelete={setDeleteTarget}
      />

      <Dialog open={formOpen} onOpenChange={o => !o && setFormOpen(false)}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>{editId ? 'Edit Medicine' : 'Add Medicine'}</DialogTitle></DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-gray-500 uppercase tracking-wide block mb-1.5">Generic Name *</label>
                <input type="text" value={form.generic_name || ''} onChange={e => setForm({ ...form, generic_name: e.target.value, name: e.target.value })}
                  className="w-full h-9 px-3 rounded-lg border border-gray-200 text-sm outline-none focus:border-blue-400" />
              </div>
              <div>
                <label className="text-xs text-gray-500 uppercase tracking-wide block mb-1.5">Brand Name</label>
                <input type="text" value={form.brand_name || ''} onChange={e => setForm({ ...form, brand_name: e.target.value })}
                  className="w-full h-9 px-3 rounded-lg border border-gray-200 text-sm outline-none focus:border-blue-400" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-gray-500 uppercase tracking-wide block mb-1.5">Type</label>
                <Select value={form.dosage_form || form.form || ''} onValueChange={v => setForm({ ...form, dosage_form: v, form: v })}>
                  <SelectTrigger><SelectValue placeholder="Select..." /></SelectTrigger>
                  <SelectContent>
                    {MEDICINE_TYPES.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-xs text-gray-500 uppercase tracking-wide block mb-1.5">Shortcut (3-5 chars)</label>
                <input type="text" maxLength={5} value={form.shortcut || ''}
                  onChange={e => setForm({ ...form, shortcut: e.target.value.toUpperCase() })}
                  placeholder="e.g. AMX"
                  className="w-full h-9 px-3 rounded-lg border border-gray-200 text-sm outline-none focus:border-blue-400 font-mono" />
              </div>
            </div>
            <div>
              <label className="text-xs text-gray-500 uppercase tracking-wide block mb-1.5">Manufacturer</label>
              <input type="text" value={form.manufacturer || ''} onChange={e => setForm({ ...form, manufacturer: e.target.value })}
                className="w-full h-9 px-3 rounded-lg border border-gray-200 text-sm outline-none focus:border-blue-400" />
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
