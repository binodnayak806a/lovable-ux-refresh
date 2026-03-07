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
import type { LabTestMaster } from '../types';
import { LAB_CATEGORIES } from '../types';

const EMPTY: Partial<LabTestMaster> = {
  test_name: '', name: '', code: '', test_code: '', category: '', test_category: '',
  sample_type: '', normal_range: '', unit: '', price: 0, test_price: 0, is_active: true,
};

const SAMPLE_TYPES = ['Blood', 'Urine', 'Stool', 'Sputum', 'Swab', 'CSF', 'Fluid', 'Tissue', 'Other'];

export default function LabTestMasterPage() {
  const hospitalId = useHospitalId();
  const { toast } = useToast();
  const [data, setData] = useState<LabTestMaster[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [formOpen, setFormOpen] = useState(false);
  const [form, setForm] = useState<Partial<LabTestMaster>>(EMPTY);
  const [editId, setEditId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<LabTestMaster | null>(null);
  const [deleting, setDeleting] = useState(false);

  const load = useCallback(async () => {
    try { setData(await mastersService.getLabTests(hospitalId)); }
    catch { toast('Error', { type: 'error' }); } finally { setLoading(false); }
  }, [hospitalId]);

  useEffect(() => { load(); }, [load]);

  const openAdd = () => { setForm({ ...EMPTY }); setEditId(null); setFormOpen(true); };
  const openEdit = (d: LabTestMaster) => { setForm({ ...d }); setEditId(d.id); setFormOpen(true); };
  const displayName = (d: LabTestMaster) => d.test_name || d.name || '-';
  const displayCategory = (d: LabTestMaster) => d.test_category || d.category || '-';
  const displayPrice = (d: LabTestMaster) => d.test_price || d.price || 0;

  const handleSave = async () => {
    if (!form.test_name?.trim() && !form.name?.trim()) { toast('Enter Test Name', { type: 'error' }); return; }
    setSaving(true);
    try {
      await mastersService.upsertLabTest(hospitalId, form, editId || undefined);
      toast(editId ? 'Updated' : 'Added', { type: 'success' }); setFormOpen(false); load();
    } catch { toast('Error', { type: 'error' }); } finally { setSaving(false); }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await mastersService.deleteLabTest(deleteTarget.id);
      toast('Deleted', { type: 'success' }); setDeleteTarget(null); load();
    } catch { toast('Error', { type: 'error' }); } finally { setDeleting(false); }
  };

  return (
    <MasterPageShell
      title="Lab Tests" count={data.length} loading={loading}
      search={search} onSearchChange={setSearch} onAdd={openAdd}
      onExport={() => exportToCSV(data as never[], 'lab-tests', [
        { key: 'test_name', label: 'Test Name' }, { key: 'test_code', label: 'Code' },
        { key: 'test_category', label: 'Category' }, { key: 'sample_type', label: 'Sample Type' },
        { key: 'normal_range', label: 'Normal Range' }, { key: 'unit', label: 'Unit' },
        { key: 'test_price', label: 'Price' },
      ])}
      onImport={async (rows) => {
        await mastersService.bulkInsert('lab_tests', rows.map(r => ({
          test_name: r.test_name || r.name || '', name: r.test_name || r.name || '',
          test_code: r.test_code || r.code || null, code: r.test_code || r.code || null,
          test_category: r.category || r.test_category || null, category: r.category || r.test_category || null,
          sample_type: r.sample_type || null, normal_range: r.normal_range || null,
          unit: r.unit || null, test_price: Number(r.price || r.test_price) || 0,
          price: Number(r.price || r.test_price) || 0, is_active: true,
        })), hospitalId);
        toast('Imported', { type: 'success' }); load();
      }}
      deleteOpen={!!deleteTarget} deleteName={deleteTarget ? displayName(deleteTarget) : ''}
      onDeleteConfirm={handleDelete} onDeleteCancel={() => setDeleteTarget(null)} deleting={deleting}
    >
      <MasterTable
        data={data}
        columns={[
          { key: 'test_name', label: 'Test Name', sortable: true, render: d => <span className="font-medium">{displayName(d)}</span> },
          { key: 'test_code', label: 'Code', render: d => d.test_code || d.code || '-' },
          { key: 'test_category', label: 'Category', sortable: true, render: d => displayCategory(d) },
          { key: 'sample_type', label: 'Sample', render: d => d.sample_type || '-' },
          { key: 'normal_range', label: 'Normal Range', render: d => (
            <span className="text-xs">{d.normal_range ? `${d.normal_range} ${d.unit || ''}` : '-'}</span>
          )},
          { key: 'test_price', label: 'Price', render: d => `Rs. ${displayPrice(d)}` },
          { key: 'is_active', label: 'Status', width: '80px', render: d => <StatusBadge active={d.is_active} /> },
        ]}
        search={search} searchKeys={['test_name', 'name', 'test_code', 'code', 'test_category', 'category', 'sample_type']}
        getRowKey={d => d.id} onEdit={openEdit} onDelete={setDeleteTarget}
      />

      <Dialog open={formOpen} onOpenChange={o => !o && setFormOpen(false)}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>{editId ? 'Edit Lab Test' : 'Add Lab Test'}</DialogTitle></DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-gray-500 uppercase tracking-wide block mb-1.5">Test Name *</label>
                <input type="text" value={form.test_name || form.name || ''} onChange={e => setForm({ ...form, test_name: e.target.value, name: e.target.value })}
                  className="w-full h-9 px-3 rounded-lg border border-gray-200 text-sm outline-none focus:border-blue-400" />
              </div>
              <div>
                <label className="text-xs text-gray-500 uppercase tracking-wide block mb-1.5">Test Code</label>
                <input type="text" value={form.test_code || form.code || ''} onChange={e => setForm({ ...form, test_code: e.target.value, code: e.target.value })}
                  placeholder="e.g. CBC01"
                  className="w-full h-9 px-3 rounded-lg border border-gray-200 text-sm outline-none focus:border-blue-400 font-mono" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-gray-500 uppercase tracking-wide block mb-1.5">Category</label>
                <Select value={form.test_category || form.category || '_none'} onValueChange={v => setForm({ ...form, test_category: v === '_none' ? null : v, category: v === '_none' ? null : v })}>
                  <SelectTrigger><SelectValue placeholder="Select..." /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="_none">None</SelectItem>
                    {LAB_CATEGORIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-xs text-gray-500 uppercase tracking-wide block mb-1.5">Sample Type</label>
                <Select value={form.sample_type || '_none'} onValueChange={v => setForm({ ...form, sample_type: v === '_none' ? null : v })}>
                  <SelectTrigger><SelectValue placeholder="Select..." /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="_none">None</SelectItem>
                    {SAMPLE_TYPES.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="text-xs text-gray-500 uppercase tracking-wide block mb-1.5">Normal Range</label>
                <input type="text" value={form.normal_range || ''} onChange={e => setForm({ ...form, normal_range: e.target.value })}
                  placeholder="e.g. 4.5-11.0"
                  className="w-full h-9 px-3 rounded-lg border border-gray-200 text-sm outline-none focus:border-blue-400" />
              </div>
              <div>
                <label className="text-xs text-gray-500 uppercase tracking-wide block mb-1.5">Unit</label>
                <input type="text" value={form.unit || ''} onChange={e => setForm({ ...form, unit: e.target.value })}
                  placeholder="e.g. x10^3/uL"
                  className="w-full h-9 px-3 rounded-lg border border-gray-200 text-sm outline-none focus:border-blue-400" />
              </div>
              <div>
                <label className="text-xs text-gray-500 uppercase tracking-wide block mb-1.5">Price (Rs.)</label>
                <input type="number" value={form.test_price || form.price || 0} onChange={e => setForm({ ...form, test_price: Number(e.target.value) || 0, price: Number(e.target.value) || 0 })}
                  className="w-full h-9 px-3 rounded-lg border border-gray-200 text-sm outline-none focus:border-blue-400" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-gray-500 uppercase tracking-wide block mb-1.5">Normal Range (Male)</label>
                <input type="text" value={form.normal_range_male || ''} onChange={e => setForm({ ...form, normal_range_male: e.target.value })}
                  className="w-full h-9 px-3 rounded-lg border border-gray-200 text-sm outline-none focus:border-blue-400" />
              </div>
              <div>
                <label className="text-xs text-gray-500 uppercase tracking-wide block mb-1.5">Normal Range (Female)</label>
                <input type="text" value={form.normal_range_female || ''} onChange={e => setForm({ ...form, normal_range_female: e.target.value })}
                  className="w-full h-9 px-3 rounded-lg border border-gray-200 text-sm outline-none focus:border-blue-400" />
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
