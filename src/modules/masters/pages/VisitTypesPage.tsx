import { useState, useEffect, useCallback } from 'react';
import { Loader2, Info } from 'lucide-react';
import { Button } from '../../../components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../../../components/ui/dialog';
import { Switch } from '../../../components/ui/switch';
import { Badge } from '../../../components/ui/badge';
import { useHospitalId } from '../../../hooks/useHospitalId';
import { useToast } from '../../../hooks/useToast';
import { mastersService } from '../../../services/masters.service';
import MasterPageShell from '../components/MasterPageShell';
import MasterTable from '../components/MasterTable';
import { exportToCSV } from '../utils/csv';
import type { VisitTypeRule } from '../types';

const EMPTY: Partial<VisitTypeRule> = {
  visit_type_name: '', days_threshold: 0, description: '',
  fee_multiplier: 1.0, is_default: false, is_active: true,
};

export default function VisitTypesPage() {
  const hospitalId = useHospitalId();
  const { toast } = useToast();
  const [data, setData] = useState<VisitTypeRule[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [formOpen, setFormOpen] = useState(false);
  const [form, setForm] = useState<Partial<VisitTypeRule>>(EMPTY);
  const [editId, setEditId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<VisitTypeRule | null>(null);
  const [deleting, setDeleting] = useState(false);

  const load = useCallback(async () => {
    try { setData(await mastersService.getVisitTypes(hospitalId)); }
    catch { toast('Error', { type: 'error' }); } finally { setLoading(false); }
  }, [hospitalId]);

  useEffect(() => { load(); }, [load]);

  const openAdd = () => { setForm({ ...EMPTY }); setEditId(null); setFormOpen(true); };
  const openEdit = (d: VisitTypeRule) => { setForm({ ...d }); setEditId(d.id); setFormOpen(true); };

  const handleSave = async () => {
    if (!form.visit_type_name?.trim()) { toast('Enter visit type name', { type: 'error' }); return; }
    setSaving(true);
    try {
      await mastersService.upsertVisitType(hospitalId, form, editId || undefined);
      toast(editId ? 'Updated' : 'Added', { type: 'success' }); setFormOpen(false); load();
    } catch { toast('Error', { type: 'error' }); } finally { setSaving(false); }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await mastersService.deleteVisitType(deleteTarget.id);
      toast('Deleted', { type: 'success' }); setDeleteTarget(null); load();
    } catch { toast('Error', { type: 'error' }); } finally { setDeleting(false); }
  };

  return (
    <MasterPageShell
      title="Visit Types" count={data.length} loading={loading}
      search={search} onSearchChange={setSearch} onAdd={openAdd}
      onExport={() => exportToCSV(data as never[], 'visit-types', [
        { key: 'visit_type_name', label: 'Visit Type' }, { key: 'days_threshold', label: 'Days Threshold' },
        { key: 'fee_multiplier', label: 'Fee Multiplier' }, { key: 'description', label: 'Description' },
      ])}
      deleteOpen={!!deleteTarget} deleteName={deleteTarget?.visit_type_name || ''}
      onDeleteConfirm={handleDelete} onDeleteCancel={() => setDeleteTarget(null)} deleting={deleting}
    >
      <div className="p-3 rounded-lg bg-blue-50 border border-blue-100 mb-4 flex items-start gap-2">
        <Info className="w-4 h-4 text-blue-500 mt-0.5 shrink-0" />
        <p className="text-xs text-blue-700">
          Visit types determine the fee structure based on days since last visit.
          For example, if a patient visited 5 days ago and the "Follow-up" threshold is 7, they get the follow-up fee rate.
          The system checks thresholds in ascending order and applies the first matching rule.
        </p>
      </div>

      <MasterTable
        data={data}
        columns={[
          { key: 'visit_type_name', label: 'Visit Type', sortable: true, render: d => (
            <div className="flex items-center gap-2">
              <span className="font-medium">{d.visit_type_name}</span>
              {d.is_default && <Badge className="bg-amber-50 text-amber-700 border-amber-200 text-[10px]">Default</Badge>}
            </div>
          )},
          { key: 'days_threshold', label: 'Days Threshold', sortable: true, render: d => (
            <span className="tabular-nums">
              {d.days_threshold === 0 ? (
                <span className="text-gray-500">First visit</span>
              ) : (
                <span>Within {d.days_threshold} days</span>
              )}
            </span>
          )},
          { key: 'fee_multiplier', label: 'Fee Multiplier', render: d => (
            <Badge className={
              d.fee_multiplier === 1 ? 'bg-gray-100 text-gray-600 border-gray-200' :
              d.fee_multiplier < 1 ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
              'bg-amber-50 text-amber-700 border-amber-200'
            }>
              {d.fee_multiplier}x
            </Badge>
          )},
          { key: 'description', label: 'Description', render: d => (
            <span className="text-xs text-gray-500 line-clamp-1">{d.description || '-'}</span>
          )},
          { key: 'is_active', label: 'Active', width: '70px', render: d => (
            <Badge className={d.is_active ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-gray-100 text-gray-500 border-gray-200'}>
              {d.is_active ? 'Yes' : 'No'}
            </Badge>
          )},
        ]}
        search={search} searchKeys={['visit_type_name', 'description']}
        getRowKey={d => d.id} onEdit={openEdit} onDelete={setDeleteTarget}
      />

      <Dialog open={formOpen} onOpenChange={o => !o && setFormOpen(false)}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>{editId ? 'Edit Visit Type' : 'Add Visit Type'}</DialogTitle></DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <label className="text-xs text-gray-500 uppercase tracking-wide block mb-1.5">Visit Type Name *</label>
              <input type="text" value={form.visit_type_name || ''} onChange={e => setForm({ ...form, visit_type_name: e.target.value })}
                placeholder="e.g. Follow-up, New Visit, Emergency"
                className="w-full h-9 px-3 rounded-lg border border-gray-200 text-sm outline-none focus:border-blue-400" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-gray-500 uppercase tracking-wide block mb-1.5">Days Threshold</label>
                <input type="number" min={0} value={form.days_threshold || 0} onChange={e => setForm({ ...form, days_threshold: Number(e.target.value) || 0 })}
                  className="w-full h-9 px-3 rounded-lg border border-gray-200 text-sm outline-none focus:border-blue-400" />
                <p className="text-[10px] text-gray-400 mt-1">0 = first/new visit</p>
              </div>
              <div>
                <label className="text-xs text-gray-500 uppercase tracking-wide block mb-1.5">Fee Multiplier</label>
                <input type="number" step={0.1} min={0} value={form.fee_multiplier || 1} onChange={e => setForm({ ...form, fee_multiplier: Number(e.target.value) || 1 })}
                  className="w-full h-9 px-3 rounded-lg border border-gray-200 text-sm outline-none focus:border-blue-400" />
                <p className="text-[10px] text-gray-400 mt-1">1.0 = full fee, 0.5 = half</p>
              </div>
            </div>
            <div>
              <label className="text-xs text-gray-500 uppercase tracking-wide block mb-1.5">Description</label>
              <textarea value={form.description || ''} onChange={e => setForm({ ...form, description: e.target.value })}
                rows={2} placeholder="Brief description of when this visit type applies"
                className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm outline-none focus:border-blue-400 resize-none" />
            </div>
            <div className="flex items-center justify-between py-1">
              <label className="text-sm text-gray-700">Set as Default</label>
              <Switch checked={form.is_default || false} onCheckedChange={v => setForm({ ...form, is_default: v })} />
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
