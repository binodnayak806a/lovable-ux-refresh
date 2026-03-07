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
import type { SymptomMaster } from '../types';
import { SYMPTOM_CATEGORIES } from '../types';

const EMPTY: Partial<SymptomMaster> = {
  name: '', category: '', description: '', shortcut: '', is_active: true,
};

export default function SymptomMasterPage() {
  const hospitalId = useHospitalId();
  const { toast } = useToast();
  const [data, setData] = useState<SymptomMaster[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [formOpen, setFormOpen] = useState(false);
  const [form, setForm] = useState<Partial<SymptomMaster>>(EMPTY);
  const [editId, setEditId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<SymptomMaster | null>(null);
  const [deleting, setDeleting] = useState(false);

  const load = useCallback(async () => {
    try { setData(await mastersService.getSymptoms(hospitalId)); }
    catch { toast('Error', { type: 'error' }); } finally { setLoading(false); }
  }, [hospitalId]);

  useEffect(() => { load(); }, [load]);

  const openAdd = () => { setForm({ ...EMPTY }); setEditId(null); setFormOpen(true); };
  const openEdit = (d: SymptomMaster) => { setForm({ ...d }); setEditId(d.id); setFormOpen(true); };

  const handleSave = async () => {
    if (!form.name?.trim()) { toast('Enter Name', { type: 'error' }); return; }
    setSaving(true);
    try {
      await mastersService.upsertSymptom(hospitalId, form, editId || undefined);
      toast(editId ? 'Updated' : 'Added', { type: 'success' }); setFormOpen(false); load();
    } catch { toast('Error', { type: 'error' }); } finally { setSaving(false); }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await mastersService.deleteSymptom(deleteTarget.id);
      toast('Deleted', { type: 'success' }); setDeleteTarget(null); load();
    } catch { toast('Error', { type: 'error' }); } finally { setDeleting(false); }
  };

  return (
    <MasterPageShell
      title="Symptoms" count={data.length} loading={loading}
      search={search} onSearchChange={setSearch} onAdd={openAdd}
      onExport={() => exportToCSV(data as never[], 'symptoms', [
        { key: 'name', label: 'Name' }, { key: 'category', label: 'Category' },
        { key: 'shortcut', label: 'Shortcut' }, { key: 'description', label: 'Description' },
      ])}
      onImport={async (rows) => {
        await mastersService.bulkInsert('symptoms', rows.map(r => ({
          name: r.name || '', category: r.category || null,
          shortcut: r.shortcut || null, description: r.description || null, is_active: true,
        })), hospitalId);
        toast('Imported', { type: 'success' }); load();
      }}
      deleteOpen={!!deleteTarget} deleteName={deleteTarget?.name || ''}
      onDeleteConfirm={handleDelete} onDeleteCancel={() => setDeleteTarget(null)} deleting={deleting}
    >
      <MasterTable
        data={data}
        columns={[
          { key: 'name', label: 'Symptom', sortable: true, render: d => <span className="font-medium">{d.name}</span> },
          { key: 'category', label: 'Category', sortable: true, render: d => d.category || '-' },
          { key: 'shortcut', label: 'Shortcut', render: d => d.shortcut ? <code className="text-xs bg-gray-100 px-1.5 py-0.5 rounded">{d.shortcut}</code> : '-' },
          { key: 'description', label: 'Description', render: d => (
            <span className="text-gray-500 text-xs line-clamp-1">{d.description || '-'}</span>
          )},
          { key: 'is_active', label: 'Status', width: '80px', render: d => <StatusBadge active={d.is_active} /> },
        ]}
        search={search} searchKeys={['name', 'category', 'shortcut', 'description']}
        getRowKey={d => d.id} onEdit={openEdit} onDelete={setDeleteTarget}
      />

      <Dialog open={formOpen} onOpenChange={o => !o && setFormOpen(false)}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>{editId ? 'Edit Symptom' : 'Add Symptom'}</DialogTitle></DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <label className="text-xs text-gray-500 uppercase tracking-wide block mb-1.5">Name *</label>
              <input type="text" value={form.name || ''} onChange={e => setForm({ ...form, name: e.target.value })}
                className="w-full h-9 px-3 rounded-lg border border-gray-200 text-sm outline-none focus:border-blue-400" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-gray-500 uppercase tracking-wide block mb-1.5">Category</label>
                <Select value={form.category || '_none'} onValueChange={v => setForm({ ...form, category: v === '_none' ? null : v })}>
                  <SelectTrigger><SelectValue placeholder="Select..." /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="_none">None</SelectItem>
                    {SYMPTOM_CATEGORIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-xs text-gray-500 uppercase tracking-wide block mb-1.5">Shortcut (3-5 chars)</label>
                <input type="text" maxLength={5} value={form.shortcut || ''}
                  onChange={e => setForm({ ...form, shortcut: e.target.value.toUpperCase() })}
                  placeholder="e.g. FVR"
                  className="w-full h-9 px-3 rounded-lg border border-gray-200 text-sm outline-none focus:border-blue-400 font-mono" />
              </div>
            </div>
            <div>
              <label className="text-xs text-gray-500 uppercase tracking-wide block mb-1.5">Description</label>
              <textarea value={form.description || ''} onChange={e => setForm({ ...form, description: e.target.value })}
                rows={2} className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm outline-none focus:border-blue-400 resize-none" />
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
