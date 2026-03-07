import { useState, useEffect, useCallback } from 'react';
import { Loader2 } from 'lucide-react';
import { Button } from '../../../components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../../../components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../../components/ui/select';
import { Switch } from '../../../components/ui/switch';
import { useHospitalId } from '../../../hooks/useHospitalId';
import { useToast } from '../../../hooks/useToast';
import { mastersService } from '../../../services/masters.service';
import MasterPageShell from '../components/MasterPageShell';
import MasterTable, { StatusBadge } from '../components/MasterTable';
import { exportToCSV } from '../utils/csv';
import type { ServiceMasterRow } from '../types';
import { SERVICE_CATEGORIES, GST_SLABS } from '../types';

const EMPTY: Partial<ServiceMasterRow> = { service_name: '', category: '', price: 0, gst_rate: 0, hsn_code: '', is_active: true };

export default function ServiceMasterPage() {
  const hospitalId = useHospitalId();
  const { toast } = useToast();
  const [data, setData] = useState<ServiceMasterRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [formOpen, setFormOpen] = useState(false);
  const [form, setForm] = useState<Partial<ServiceMasterRow>>(EMPTY);
  const [editId, setEditId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<ServiceMasterRow | null>(null);
  const [deleting, setDeleting] = useState(false);

  const load = useCallback(async () => {
    try { setData(await mastersService.getServices(hospitalId)); }
    catch { toast('Error', { type: 'error' }); } finally { setLoading(false); }
  }, [hospitalId]);

  useEffect(() => { load(); }, [load]);

  const openAdd = () => { setForm({ ...EMPTY }); setEditId(null); setFormOpen(true); };
  const openEdit = (d: ServiceMasterRow) => { setForm({ ...d }); setEditId(d.id); setFormOpen(true); };

  const handleSave = async () => {
    if (!form.service_name?.trim()) { toast('Enter Name', { type: 'error' }); return; }
    setSaving(true);
    try {
      await mastersService.upsertService(hospitalId, form, editId || undefined);
      toast(editId ? 'Updated' : 'Added', { type: 'success' }); setFormOpen(false); load();
    } catch { toast('Error', { type: 'error' }); } finally { setSaving(false); }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await mastersService.deleteService(deleteTarget.id);
      toast('Deleted', { type: 'success' }); setDeleteTarget(null); load();
    } catch { toast('Error', { type: 'error' }); } finally { setDeleting(false); }
  };

  return (
    <MasterPageShell
      title="Services" count={data.length} loading={loading}
      search={search} onSearchChange={setSearch} onAdd={openAdd}
      onExport={() => exportToCSV(data as never[], 'services', [
        { key: 'service_name', label: 'Service Name' }, { key: 'category', label: 'Category' },
        { key: 'price', label: 'Price' }, { key: 'gst_rate', label: 'GST Rate' }, { key: 'hsn_code', label: 'HSN Code' },
      ])}
      onImport={async (rows) => {
        await mastersService.bulkInsert('services_master', rows.map(r => ({
          service_name: r.service_name, category: r.category || 'Other',
          price: Number(r.price) || 0, gst_rate: Number(r.gst_rate) || 0,
          hsn_code: r.hsn_code || null, is_active: true,
        })), hospitalId);
        toast('Imported', { type: 'success' }); load();
      }}
      deleteOpen={!!deleteTarget} deleteName={deleteTarget?.service_name}
      onDeleteConfirm={handleDelete} onDeleteCancel={() => setDeleteTarget(null)} deleting={deleting}
    >
      <MasterTable
        data={data}
        columns={[
          { key: 'service_name', label: 'Service', sortable: true, render: d => <span className="font-medium">{d.service_name}</span> },
          { key: 'category', label: 'Category', sortable: true },
          { key: 'price', label: 'Price', sortable: true, render: d => `Rs. ${Number(d.price).toLocaleString('en-IN')}` },
          { key: 'gst_rate', label: 'GST', render: d => `${d.gst_rate}%` },
          { key: 'hsn_code', label: 'HSN' },
          { key: 'is_active', label: 'Status', width: '80px', render: d => <StatusBadge active={d.is_active} /> },
        ]}
        search={search} searchKeys={['service_name', 'category', 'hsn_code']}
        getRowKey={d => d.id} onEdit={openEdit} onDelete={setDeleteTarget}
        onToggleActive={async d => { await mastersService.upsertService(hospitalId, { is_active: !d.is_active }, d.id); load(); }}
      />

      <Dialog open={formOpen} onOpenChange={o => !o && setFormOpen(false)}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>{editId ? 'Edit Service' : 'Add Service'}</DialogTitle></DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <label className="text-xs text-gray-500 uppercase tracking-wide block mb-1.5">Service Name *</label>
              <input type="text" value={form.service_name || ''} onChange={e => setForm({ ...form, service_name: e.target.value })}
                className="w-full h-9 px-3 rounded-lg border border-gray-200 text-sm outline-none focus:border-blue-400" />
            </div>
            <div>
              <label className="text-xs text-gray-500 uppercase tracking-wide block mb-1.5">Category</label>
              <Select value={form.category || ''} onValueChange={v => setForm({ ...form, category: v })}>
                <SelectTrigger><SelectValue placeholder="Select..." /></SelectTrigger>
                <SelectContent>
                  {SERVICE_CATEGORIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-gray-500 uppercase tracking-wide block mb-1.5">Price (Rs.)</label>
                <input type="number" min="0" step="0.01" value={form.price ?? 0}
                  onChange={e => setForm({ ...form, price: parseFloat(e.target.value) || 0 })}
                  className="w-full h-9 px-3 rounded-lg border border-gray-200 text-sm outline-none focus:border-blue-400" />
              </div>
              <div>
                <label className="text-xs text-gray-500 uppercase tracking-wide block mb-1.5">GST Rate (%)</label>
                <Select value={String(form.gst_rate ?? 0)} onValueChange={v => setForm({ ...form, gst_rate: Number(v) })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {GST_SLABS.map(r => <SelectItem key={r} value={String(r)}>{r}%</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <label className="text-xs text-gray-500 uppercase tracking-wide block mb-1.5">HSN Code</label>
              <input type="text" value={form.hsn_code || ''} onChange={e => setForm({ ...form, hsn_code: e.target.value })}
                className="w-full h-9 px-3 rounded-lg border border-gray-200 text-sm outline-none focus:border-blue-400" />
            </div>
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <span className="text-sm text-gray-700">Active</span>
              <Switch checked={form.is_active ?? true} onCheckedChange={v => setForm({ ...form, is_active: v })} />
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
