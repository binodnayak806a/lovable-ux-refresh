import { useState, useEffect, useCallback } from 'react';
import { Loader2, Building2, Save } from 'lucide-react';
import { Button } from '../../../components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../../../components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../../components/ui/select';
import { Badge } from '../../../components/ui/badge';
import { useHospitalId } from '../../../hooks/useHospitalId';
import { useToast } from '../../../hooks/useToast';
import { mastersService } from '../../../services/masters.service';
import MasterPageShell from '../components/MasterPageShell';
import MasterTable from '../components/MasterTable';
import { exportToCSV } from '../utils/csv';
import type { GstSlabRow } from '../types';
import { GST_SLABS, SERVICE_CATEGORIES } from '../types';

const EMPTY: Partial<GstSlabRow> = {
  category: '', gst_rate: 0, hsn_code: '', cgst_rate: 0, sgst_rate: 0, igst_rate: 0, is_active: true,
};

export default function GstConfigPage() {
  const hospitalId = useHospitalId();
  const { toast } = useToast();
  const [data, setData] = useState<GstSlabRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [formOpen, setFormOpen] = useState(false);
  const [form, setForm] = useState<Partial<GstSlabRow>>(EMPTY);
  const [editId, setEditId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<GstSlabRow | null>(null);
  const [deleting, setDeleting] = useState(false);

  const [gstNumber, setGstNumber] = useState('');
  const [stateCode, setStateCode] = useState('');
  const [gstMode, setGstMode] = useState('cgst_sgst');
  const [savingConfig, setSavingConfig] = useState(false);

  const load = useCallback(async () => {
    try {
      const [slabs, config] = await Promise.all([
        mastersService.getGstSlabs(hospitalId),
        mastersService.getHospitalGstConfig(hospitalId),
      ]);
      setData(slabs);
      setGstNumber(config.gst_number || '');
      setStateCode(config.state_code || '');
      setGstMode(config.gst_mode || 'cgst_sgst');
    } catch { toast('Error', { type: 'error' }); }
    finally { setLoading(false); }
  }, [hospitalId]);

  useEffect(() => { load(); }, [load]);

  const openAdd = () => { setForm({ ...EMPTY }); setEditId(null); setFormOpen(true); };
  const openEdit = (d: GstSlabRow) => { setForm({ ...d }); setEditId(d.id); setFormOpen(true); };

  const updateRatesFromGst = (rate: number) => {
    if (gstMode === 'igst') {
      setForm(f => ({ ...f, gst_rate: rate, igst_rate: rate, cgst_rate: 0, sgst_rate: 0 }));
    } else {
      const half = rate / 2;
      setForm(f => ({ ...f, gst_rate: rate, cgst_rate: half, sgst_rate: half, igst_rate: 0 }));
    }
  };

  const handleSave = async () => {
    if (!form.category?.trim()) { toast('Select category', { type: 'error' }); return; }
    setSaving(true);
    try {
      await mastersService.upsertGstSlab(hospitalId, form, editId || undefined);
      toast(editId ? 'Updated' : 'Added', { type: 'success' }); setFormOpen(false); load();
    } catch { toast('Error', { type: 'error' }); } finally { setSaving(false); }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await mastersService.deleteGstSlab(deleteTarget.id);
      toast('Deleted', { type: 'success' }); setDeleteTarget(null); load();
    } catch { toast('Error', { type: 'error' }); } finally { setDeleting(false); }
  };

  const handleSaveConfig = async () => {
    setSavingConfig(true);
    try {
      await mastersService.updateHospitalGstConfig(hospitalId, { gst_number: gstNumber, state_code: stateCode, gst_mode: gstMode });
      toast('Config saved', { type: 'success' });
    } catch { toast('Error', { type: 'error' }); }
    finally { setSavingConfig(false); }
  };

  return (
    <div className="space-y-6">
      <div className="border border-gray-200 rounded-xl p-5 bg-white">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 rounded-lg bg-gray-100">
            <Building2 className="w-5 h-5 text-gray-600" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-gray-900">Hospital GST Configuration</h3>
            <p className="text-xs text-gray-500">Set your GST number, state code, and billing mode</p>
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="text-xs text-gray-500 uppercase tracking-wide block mb-1.5">GST Number (GSTIN)</label>
            <input type="text" value={gstNumber} onChange={e => setGstNumber(e.target.value.toUpperCase())}
              maxLength={15} placeholder="22AAAAA0000A1Z5"
              className="w-full h-9 px-3 rounded-lg border border-gray-200 text-sm outline-none focus:border-blue-400 font-mono" />
          </div>
          <div>
            <label className="text-xs text-gray-500 uppercase tracking-wide block mb-1.5">State Code</label>
            <input type="text" value={stateCode} onChange={e => setStateCode(e.target.value)}
              maxLength={2} placeholder="e.g. 27"
              className="w-full h-9 px-3 rounded-lg border border-gray-200 text-sm outline-none focus:border-blue-400 font-mono" />
          </div>
          <div>
            <label className="text-xs text-gray-500 uppercase tracking-wide block mb-1.5">GST Mode</label>
            <div className="flex gap-2">
              <button
                onClick={() => setGstMode('cgst_sgst')}
                className={`flex-1 py-2 rounded-lg text-xs font-medium border transition-colors ${
                  gstMode === 'cgst_sgst' ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300'
                }`}
              >
                CGST + SGST
              </button>
              <button
                onClick={() => setGstMode('igst')}
                className={`flex-1 py-2 rounded-lg text-xs font-medium border transition-colors ${
                  gstMode === 'igst' ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300'
                }`}
              >
                IGST
              </button>
            </div>
          </div>
        </div>
        <div className="mt-4 flex justify-end">
          <Button size="sm" onClick={handleSaveConfig} disabled={savingConfig} className="gap-1.5 bg-blue-600 hover:bg-blue-700">
            {savingConfig ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
            Save Config
          </Button>
        </div>
      </div>

      <MasterPageShell
        title="GST Slabs" count={data.length} loading={loading}
        search={search} onSearchChange={setSearch} onAdd={openAdd}
        onExport={() => exportToCSV(data as never[], 'gst-slabs', [
          { key: 'category', label: 'Category' }, { key: 'gst_rate', label: 'GST Rate %' },
          { key: 'hsn_code', label: 'HSN Code' }, { key: 'cgst_rate', label: 'CGST %' },
          { key: 'sgst_rate', label: 'SGST %' }, { key: 'igst_rate', label: 'IGST %' },
        ])}
        deleteOpen={!!deleteTarget} deleteName={deleteTarget ? `${deleteTarget.category} (${deleteTarget.gst_rate}%)` : ''}
        onDeleteConfirm={handleDelete} onDeleteCancel={() => setDeleteTarget(null)} deleting={deleting}
      >
        <MasterTable
          data={data}
          columns={[
            { key: 'category', label: 'Category', sortable: true, render: d => <span className="font-medium">{d.category}</span> },
            { key: 'gst_rate', label: 'GST Rate', sortable: true, render: d => (
              <Badge className="bg-blue-50 text-blue-700 border-blue-200">{d.gst_rate}%</Badge>
            )},
            { key: 'hsn_code', label: 'HSN Code', render: d => d.hsn_code ? <code className="text-xs bg-gray-100 px-1.5 py-0.5 rounded">{d.hsn_code}</code> : '-' },
            { key: 'cgst_rate', label: 'CGST', render: d => gstMode === 'cgst_sgst' ? `${d.cgst_rate}%` : '-' },
            { key: 'sgst_rate', label: 'SGST', render: d => gstMode === 'cgst_sgst' ? `${d.sgst_rate}%` : '-' },
            { key: 'igst_rate', label: 'IGST', render: d => gstMode === 'igst' ? `${d.igst_rate}%` : '-' },
          ]}
          search={search} searchKeys={['category', 'hsn_code']}
          getRowKey={d => d.id} onEdit={openEdit} onDelete={setDeleteTarget}
        />
      </MasterPageShell>

      <Dialog open={formOpen} onOpenChange={o => !o && setFormOpen(false)}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>{editId ? 'Edit GST Slab' : 'Add GST Slab'}</DialogTitle></DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <label className="text-xs text-gray-500 uppercase tracking-wide block mb-1.5">Category *</label>
              <Select value={form.category || ''} onValueChange={v => setForm({ ...form, category: v })}>
                <SelectTrigger><SelectValue placeholder="Select category..." /></SelectTrigger>
                <SelectContent>
                  {SERVICE_CATEGORIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-gray-500 uppercase tracking-wide block mb-1.5">GST Rate (%)</label>
                <Select value={String(form.gst_rate || 0)} onValueChange={v => updateRatesFromGst(Number(v))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {GST_SLABS.map(s => <SelectItem key={s} value={String(s)}>{s}%</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-xs text-gray-500 uppercase tracking-wide block mb-1.5">HSN Code</label>
                <input type="text" value={form.hsn_code || ''} onChange={e => setForm({ ...form, hsn_code: e.target.value })}
                  placeholder="e.g. 9993"
                  className="w-full h-9 px-3 rounded-lg border border-gray-200 text-sm outline-none focus:border-blue-400 font-mono" />
              </div>
            </div>
            <div className="p-3 rounded-lg bg-gray-50 border border-gray-100">
              <p className="text-xs text-gray-500 mb-2">
                Rate breakdown ({gstMode === 'igst' ? 'IGST mode' : 'CGST+SGST mode'}):
              </p>
              <div className="grid grid-cols-3 gap-3 text-center">
                <div>
                  <p className="text-lg font-bold text-gray-900">{form.cgst_rate || 0}%</p>
                  <p className="text-[10px] text-gray-400">CGST</p>
                </div>
                <div>
                  <p className="text-lg font-bold text-gray-900">{form.sgst_rate || 0}%</p>
                  <p className="text-[10px] text-gray-400">SGST</p>
                </div>
                <div>
                  <p className="text-lg font-bold text-gray-900">{form.igst_rate || 0}%</p>
                  <p className="text-[10px] text-gray-400">IGST</p>
                </div>
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
    </div>
  );
}
