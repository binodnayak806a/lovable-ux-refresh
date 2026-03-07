import { useState, useEffect, useCallback, useMemo } from 'react';
import { Loader2, X } from 'lucide-react';
import { Button } from '../../../components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../../../components/ui/dialog';
import { Switch } from '../../../components/ui/switch';
import { Badge } from '../../../components/ui/badge';
import { useHospitalId } from '../../../hooks/useHospitalId';
import { useToast } from '../../../hooks/useToast';
import { mastersService } from '../../../services/masters.service';
import MasterPageShell from '../components/MasterPageShell';
import MasterTable, { StatusBadge } from '../components/MasterTable';
import { exportToCSV } from '../utils/csv';
import type { PackageMasterRow, ServiceMasterRow } from '../types';

export default function PackageMasterPage() {
  const hospitalId = useHospitalId();
  const { toast } = useToast();
  const [data, setData] = useState<PackageMasterRow[]>([]);
  const [services, setServices] = useState<ServiceMasterRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [formOpen, setFormOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<PackageMasterRow | null>(null);
  const [deleting, setDeleting] = useState(false);

  const [pkgName, setPkgName] = useState('');
  const [pkgDesc, setPkgDesc] = useState('');
  const [pkgServices, setPkgServices] = useState<{ name: string; price: number }[]>([]);
  const [totalOverride, setTotalOverride] = useState<number | null>(null);
  const [pkgActive, setPkgActive] = useState(true);
  const [svcSearch, setSvcSearch] = useState('');

  const load = useCallback(async () => {
    try {
      const [pkgs, svcs] = await Promise.all([
        mastersService.getPackages(hospitalId),
        mastersService.getServices(hospitalId),
      ]);
      setData(pkgs); setServices(svcs);
    } catch { toast('Error', { type: 'error' }); }
    finally { setLoading(false); }
  }, [hospitalId]);

  useEffect(() => { load(); }, [load]);

  const autoTotal = useMemo(() => pkgServices.reduce((s, i) => s + i.price, 0), [pkgServices]);

  const openAdd = () => {
    setPkgName(''); setPkgDesc(''); setPkgServices([]); setTotalOverride(null);
    setPkgActive(true); setEditId(null); setFormOpen(true);
  };

  const openEdit = (p: PackageMasterRow) => {
    setPkgName(p.package_name); setPkgDesc(p.description || '');
    setPkgServices([...p.services]); setTotalOverride(p.total_price);
    setPkgActive(p.is_active); setEditId(p.id); setFormOpen(true);
  };

  const handleSave = async () => {
    if (!pkgName.trim()) { toast('Enter Name', { type: 'error' }); return; }
    setSaving(true);
    try {
      await mastersService.upsertPackage(hospitalId, {
        package_name: pkgName, description: pkgDesc || null,
        services: pkgServices, total_price: totalOverride ?? autoTotal,
        is_active: pkgActive,
      }, editId || undefined);
      toast(editId ? 'Updated' : 'Added', { type: 'success' }); setFormOpen(false); load();
    } catch { toast('Error', { type: 'error' }); } finally { setSaving(false); }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await mastersService.deletePackage(deleteTarget.id);
      toast('Deleted', { type: 'success' }); setDeleteTarget(null); load();
    } catch { toast('Error', { type: 'error' }); } finally { setDeleting(false); }
  };

  const filteredSvcs = services.filter(s =>
    s.is_active && s.service_name.toLowerCase().includes(svcSearch.toLowerCase()) &&
    !pkgServices.some(ps => ps.name === s.service_name)
  );

  return (
    <MasterPageShell
      title="Packages" count={data.length} loading={loading}
      search={search} onSearchChange={setSearch} onAdd={openAdd}
      onExport={() => exportToCSV(data as never[], 'packages', [
        { key: 'package_name', label: 'Package' }, { key: 'total_price', label: 'Price' },
        { key: 'description', label: 'Description' },
      ])}
      deleteOpen={!!deleteTarget} deleteName={deleteTarget?.package_name}
      onDeleteConfirm={handleDelete} onDeleteCancel={() => setDeleteTarget(null)} deleting={deleting}
    >
      <MasterTable
        data={data}
        columns={[
          { key: 'package_name', label: 'Package', sortable: true, render: d => <span className="font-medium">{d.package_name}</span> },
          { key: 'services', label: 'Services', render: d => (
            <div className="flex flex-wrap gap-1">{d.services.slice(0, 3).map((s, i) => (
              <Badge key={i} variant="outline" className="text-[10px] h-5">{s.name}</Badge>
            ))}{d.services.length > 3 && <Badge variant="outline" className="text-[10px] h-5">+{d.services.length - 3}</Badge>}</div>
          )},
          { key: 'total_price', label: 'Price', sortable: true, render: d => `Rs. ${Number(d.total_price).toLocaleString('en-IN')}` },
          { key: 'is_active', label: 'Status', width: '80px', render: d => <StatusBadge active={d.is_active} /> },
        ]}
        search={search} searchKeys={['package_name', 'description']}
        getRowKey={d => d.id} onEdit={openEdit} onDelete={setDeleteTarget}
      />

      <Dialog open={formOpen} onOpenChange={o => !o && setFormOpen(false)}>
        <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
          <DialogHeader><DialogTitle>{editId ? 'Edit Package' : 'Add Package'}</DialogTitle></DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <label className="text-xs text-gray-500 uppercase tracking-wide block mb-1.5">Package Name *</label>
              <input type="text" value={pkgName} onChange={e => setPkgName(e.target.value)}
                className="w-full h-9 px-3 rounded-lg border border-gray-200 text-sm outline-none focus:border-blue-400" />
            </div>
            <div>
              <label className="text-xs text-gray-500 uppercase tracking-wide block mb-1.5">Description</label>
              <input type="text" value={pkgDesc} onChange={e => setPkgDesc(e.target.value)}
                className="w-full h-9 px-3 rounded-lg border border-gray-200 text-sm outline-none focus:border-blue-400" />
            </div>
            <div>
              <label className="text-xs text-gray-500 uppercase tracking-wide block mb-1.5">Services</label>
              <div className="relative mb-2">
                <input type="text" value={svcSearch} onChange={e => setSvcSearch(e.target.value)}
                  placeholder="Search services to add..."
                  className="w-full h-9 px-3 rounded-lg border border-gray-200 text-sm outline-none focus:border-blue-400" />
              </div>
              {svcSearch && filteredSvcs.length > 0 && (
                <div className="border rounded-lg max-h-32 overflow-y-auto mb-2">
                  {filteredSvcs.slice(0, 8).map(s => (
                    <button key={s.id} type="button" className="w-full text-left px-3 py-1.5 text-sm hover:bg-blue-50 flex justify-between"
                      onClick={() => { setPkgServices([...pkgServices, { name: s.service_name, price: s.price }]); setSvcSearch(''); }}>
                      <span>{s.service_name}</span>
                      <span className="text-xs text-gray-500">Rs. {s.price}</span>
                    </button>
                  ))}
                </div>
              )}
              <div className="space-y-1">
                {pkgServices.map((s, i) => (
                  <div key={i} className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
                    <span className="text-sm">{s.name}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-gray-500">Rs. {s.price}</span>
                      <button type="button" onClick={() => setPkgServices(pkgServices.filter((_, j) => j !== i))}
                        className="p-1 hover:bg-red-50 rounded"><X className="w-3 h-3 text-red-500" /></button>
                    </div>
                  </div>
                ))}
                {pkgServices.length === 0 && <div className="text-xs text-gray-400 text-center py-3">No services added</div>}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 bg-blue-50 rounded-lg">
                <div className="text-[10px] text-blue-500 uppercase mb-1">Auto Total</div>
                <div className="text-sm font-semibold text-blue-700">Rs. {autoTotal.toLocaleString('en-IN')}</div>
              </div>
              <div>
                <label className="text-xs text-gray-500 uppercase tracking-wide block mb-1.5">Override Price</label>
                <input type="number" min="0" value={totalOverride ?? ''} placeholder={String(autoTotal)}
                  onChange={e => setTotalOverride(e.target.value ? Number(e.target.value) : null)}
                  className="w-full h-9 px-3 rounded-lg border border-gray-200 text-sm outline-none focus:border-blue-400" />
              </div>
            </div>
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <span className="text-sm text-gray-700">Active</span>
              <Switch checked={pkgActive} onCheckedChange={setPkgActive} />
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
