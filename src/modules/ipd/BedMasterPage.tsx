import { useState, useEffect, useCallback } from 'react';
import {
  BedDouble, Plus, Building2, Wrench, RefreshCw,
  Loader2, Grid3X3, LayoutList,
} from 'lucide-react';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '../../components/ui/select';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '../../components/ui/dialog';
import { useAppSelector } from '../../store';
import { useToast } from '../../hooks/useToast';
import ipdService from '../../services/ipd.service';
import type { Ward, Bed, BedStatus, WardType } from './types';
import { BED_STATUS_CONFIG, WARD_TYPE_CONFIG } from './types';
import { cn } from '../../lib/utils';

const DEMO_HOSPITAL_ID = '11111111-1111-1111-1111-111111111111';

export default function BedMasterPage() {
  const { hospitalId: hId } = useAppSelector(s => s.auth);
  const hospitalId = hId ?? DEMO_HOSPITAL_ID;
  const { toast } = useToast();

  const [wards, setWards] = useState<Ward[]>([]);
  const [beds, setBeds] = useState<Bed[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedWard, setSelectedWard] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [showAddWard, setShowAddWard] = useState(false);
  const [showAddBed, setShowAddBed] = useState(false);
  const [showBulkAdd, setShowBulkAdd] = useState(false);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [w, b] = await Promise.all([
        ipdService.getWards(hospitalId),
        ipdService.getBedsWithOccupancy(hospitalId),
      ]);
      setWards(w);
      setBeds(b);
    } catch {
      toast('Error', { description: 'Failed to load data', type: 'error' });
    } finally {
      setLoading(false);
    }
  }, [hospitalId]);

  useEffect(() => { loadData(); }, [loadData]);

  const filteredBeds = beds.filter(b => {
    if (selectedWard !== 'all' && b.ward_id !== selectedWard) return false;
    if (statusFilter !== 'all' && b.status !== statusFilter) return false;
    return true;
  });

  const stats = {
    total: beds.length,
    available: beds.filter(b => b.status === 'available').length,
    occupied: beds.filter(b => b.status === 'occupied').length,
    maintenance: beds.filter(b => b.status === 'maintenance').length,
    cleaning: beds.filter(b => b.status === 'cleaning').length,
  };

  const handleStatusChange = async (bedId: string, status: BedStatus) => {
    try {
      await ipdService.updateBedStatus(bedId, status);
      toast('Bed Updated', { type: 'success' });
      loadData();
    } catch {
      toast('Error', { description: 'Failed to update bed', type: 'error' });
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900 flex items-center gap-2.5">
            <BedDouble className="w-5 h-5 text-blue-600" />
            Bed & Ward Master
          </h1>
          <p className="text-sm text-gray-500 mt-0.5">{stats.total} beds across {wards.length} wards</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={loadData} className="h-9 w-9 p-0">
            <RefreshCw className={cn('w-4 h-4', loading && 'animate-spin')} />
          </Button>
          <Button variant="outline" size="sm" onClick={() => setShowAddWard(true)} className="h-9 gap-1.5">
            <Building2 className="w-3.5 h-3.5" /> Add Ward
          </Button>
          <Button variant="outline" size="sm" onClick={() => setShowBulkAdd(true)} className="h-9 gap-1.5">
            <Grid3X3 className="w-3.5 h-3.5" /> Bulk Add
          </Button>
          <Button size="sm" onClick={() => setShowAddBed(true)} className="h-9 gap-1.5 bg-blue-600 hover:bg-blue-700">
            <Plus className="w-3.5 h-3.5" /> Add Bed
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-5 gap-3">
        <StatCard label="Total" value={stats.total} color="bg-gray-100 text-gray-700" />
        <StatCard label="Vacant" value={stats.available} color="bg-emerald-50 text-emerald-700" />
        <StatCard label="Occupied" value={stats.occupied} color="bg-red-50 text-red-700" />
        <StatCard label="Maintenance" value={stats.maintenance} color="bg-amber-50 text-amber-700" />
        <StatCard label="Cleaning" value={stats.cleaning} color="bg-yellow-50 text-yellow-700" />
      </div>

      <div className="flex items-center gap-3 flex-wrap">
        <Select value={selectedWard} onValueChange={setSelectedWard}>
          <SelectTrigger className="w-48 h-9"><SelectValue placeholder="All Wards" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Wards</SelectItem>
            {wards.map(w => <SelectItem key={w.id} value={w.id}>{w.name}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-40 h-9"><SelectValue placeholder="All Status" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            {Object.entries(BED_STATUS_CONFIG).map(([k, v]) => (
              <SelectItem key={k} value={k}>{v.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <div className="flex gap-1 bg-gray-100 rounded-lg p-0.5 ml-auto">
          <button
            onClick={() => setViewMode('grid')}
            className={cn('p-1.5 rounded-md', viewMode === 'grid' ? 'bg-white shadow-sm' : 'text-gray-500')}
          >
            <Grid3X3 className="w-4 h-4" />
          </button>
          <button
            onClick={() => setViewMode('list')}
            className={cn('p-1.5 rounded-md', viewMode === 'list' ? 'bg-white shadow-sm' : 'text-gray-500')}
          >
            <LayoutList className="w-4 h-4" />
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
        </div>
      ) : viewMode === 'grid' ? (
        <BedGridView beds={filteredBeds} wards={wards} onStatusChange={handleStatusChange} />
      ) : (
        <BedListView beds={filteredBeds} onStatusChange={handleStatusChange} />
      )}

      {showAddWard && (
        <AddWardDialog
          hospitalId={hospitalId}
          onClose={() => setShowAddWard(false)}
          onSuccess={() => { setShowAddWard(false); loadData(); }}
        />
      )}
      {showAddBed && (
        <AddBedDialog
          hospitalId={hospitalId}
          wards={wards}
          onClose={() => setShowAddBed(false)}
          onSuccess={() => { setShowAddBed(false); loadData(); }}
        />
      )}
      {showBulkAdd && (
        <BulkAddDialog
          hospitalId={hospitalId}
          wards={wards}
          onClose={() => setShowBulkAdd(false)}
          onSuccess={() => { setShowBulkAdd(false); loadData(); }}
        />
      )}
    </div>
  );
}

function StatCard({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className={cn('rounded-xl p-3 text-center', color)}>
      <div className="text-2xl font-bold">{value}</div>
      <div className="text-xs font-medium mt-0.5">{label}</div>
    </div>
  );
}

function BedGridView({ beds, wards, onStatusChange }: {
  beds: Bed[];
  wards: Ward[];
  onStatusChange: (id: string, status: BedStatus) => void;
}) {
  const grouped: Record<string, Bed[]> = {};
  beds.forEach(b => {
    const wId = b.ward_id;
    if (!grouped[wId]) grouped[wId] = [];
    grouped[wId].push(b);
  });

  const wardMap = new Map(wards.map(w => [w.id, w]));

  if (beds.length === 0) {
    return (
      <div className="text-center py-16 text-gray-400">
        <BedDouble className="w-12 h-12 mx-auto mb-2 opacity-30" />
        <p className="text-sm">No beds found matching your filters</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {Object.entries(grouped).map(([wardId, wardBeds]) => {
        const ward = wardMap.get(wardId);
        const wardConf = ward ? WARD_TYPE_CONFIG[ward.ward_type] : null;
        return (
          <div key={wardId}>
            <div className="flex items-center gap-2 mb-3">
              <h3 className="text-sm font-semibold text-gray-700">{ward?.name ?? 'Unknown Ward'}</h3>
              {wardConf && <Badge className={cn('text-[10px]', wardConf.color)}>{wardConf.label}</Badge>}
              <span className="text-xs text-gray-400">({wardBeds.length} beds)</span>
            </div>
            <div className="grid grid-cols-6 sm:grid-cols-8 md:grid-cols-10 lg:grid-cols-12 gap-2">
              {wardBeds.map(bed => {
                const conf = BED_STATUS_CONFIG[bed.status];
                const isOccupied = bed.status === 'occupied';
                return (
                  <div
                    key={bed.id}
                    className={cn(
                      'relative rounded-xl p-2 border-2 text-center transition-all group cursor-pointer hover:shadow-md',
                      bed.status === 'available' && 'bg-emerald-50 border-emerald-300',
                      bed.status === 'occupied' && 'bg-red-50 border-red-300',
                      bed.status === 'maintenance' && 'bg-amber-50 border-amber-300',
                      bed.status === 'cleaning' && 'bg-yellow-50 border-yellow-300',
                      bed.status === 'reserved' && 'bg-blue-50 border-blue-300',
                    )}
                    title={`${bed.bed_number} - ${conf.label}${isOccupied && bed.current_admission ? `\n${bed.current_admission.patient_name}` : ''}`}
                  >
                    <div className="text-xs font-bold text-gray-800">{bed.bed_number}</div>
                    <div className="text-[9px] text-gray-500 mt-0.5" style={{ color: conf.color }}>{conf.label}</div>
                    {isOccupied && bed.current_admission && (
                      <div className="text-[8px] text-gray-500 truncate mt-0.5">
                        {bed.current_admission.patient_name.split(' ')[0]}
                      </div>
                    )}
                    {!isOccupied && (
                      <div className="absolute inset-0 bg-white/80 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1">
                        {bed.status === 'available' && (
                          <button
                            onClick={() => onStatusChange(bed.id, 'maintenance')}
                            className="p-1 rounded bg-amber-100 text-amber-700 hover:bg-amber-200"
                            title="Set Maintenance"
                          >
                            <Wrench className="w-3 h-3" />
                          </button>
                        )}
                        {(bed.status === 'maintenance' || bed.status === 'cleaning') && (
                          <button
                            onClick={() => onStatusChange(bed.id, 'available')}
                            className="p-1 rounded bg-emerald-100 text-emerald-700 hover:bg-emerald-200"
                            title="Mark Available"
                          >
                            <BedDouble className="w-3 h-3" />
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function BedListView({ beds, onStatusChange }: {
  beds: Bed[];
  onStatusChange: (id: string, status: BedStatus) => void;
}) {
  return (
    <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
      <table className="w-full text-sm">
        <thead>
          <tr className="bg-gray-50 text-left">
            <th className="px-4 py-2.5 font-medium text-gray-600">Bed</th>
            <th className="px-4 py-2.5 font-medium text-gray-600">Ward</th>
            <th className="px-4 py-2.5 font-medium text-gray-600">Type</th>
            <th className="px-4 py-2.5 font-medium text-gray-600">Rate/Day</th>
            <th className="px-4 py-2.5 font-medium text-gray-600">Status</th>
            <th className="px-4 py-2.5 font-medium text-gray-600">Patient</th>
            <th className="px-4 py-2.5 font-medium text-gray-600">Actions</th>
          </tr>
        </thead>
        <tbody>
          {beds.map(bed => {
            const conf = BED_STATUS_CONFIG[bed.status];
            return (
              <tr key={bed.id} className="border-t border-gray-50 hover:bg-gray-50/50">
                <td className="px-4 py-2.5 font-semibold">{bed.bed_number}</td>
                <td className="px-4 py-2.5 text-gray-600">{bed.ward?.name ?? '-'}</td>
                <td className="px-4 py-2.5 text-gray-600 capitalize">{bed.bed_type}</td>
                <td className="px-4 py-2.5 text-gray-600">Rs {Number(bed.daily_rate).toLocaleString('en-IN')}</td>
                <td className="px-4 py-2.5">
                  <Badge className={cn('text-[10px]', conf.bgColor)} style={{ color: conf.color }}>{conf.label}</Badge>
                </td>
                <td className="px-4 py-2.5 text-gray-600">
                  {bed.current_admission?.patient_name ?? '-'}
                </td>
                <td className="px-4 py-2.5">
                  {bed.status !== 'occupied' && (
                    <Select
                      value={bed.status}
                      onValueChange={(v) => onStatusChange(bed.id, v as BedStatus)}
                    >
                      <SelectTrigger className="h-7 text-xs w-28"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="available">Available</SelectItem>
                        <SelectItem value="maintenance">Maintenance</SelectItem>
                        <SelectItem value="cleaning">Cleaning</SelectItem>
                        <SelectItem value="reserved">Reserved</SelectItem>
                      </SelectContent>
                    </Select>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function AddWardDialog({ hospitalId, onClose, onSuccess }: {
  hospitalId: string;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const { toast } = useToast();
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ name: '', wardType: 'general' as WardType, floor: 1, dailyRate: 500 });

  const handleSave = async () => {
    if (!form.name.trim()) { toast('Enter ward name', { type: 'error' }); return; }
    setSaving(true);
    try {
      await ipdService.createWard(hospitalId, form.name, form.wardType, form.floor, form.dailyRate);
      toast('Ward Created', { type: 'success' });
      onSuccess();
    } catch {
      toast('Error', { description: 'Failed to create ward', type: 'error' });
    } finally { setSaving(false); }
  };

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader><DialogTitle>Add New Ward</DialogTitle></DialogHeader>
        <div className="space-y-4 py-4">
          <div>
            <label className="text-xs text-gray-500 uppercase tracking-wide block mb-1.5">Ward Name *</label>
            <input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })}
              placeholder="e.g., General Ward A" className="w-full h-9 px-3 rounded-xl border border-gray-200 text-sm outline-none focus:border-blue-400" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-gray-500 uppercase tracking-wide block mb-1.5">Ward Type</label>
              <Select value={form.wardType} onValueChange={v => setForm({ ...form, wardType: v as WardType })}>
                <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {Object.entries(WARD_TYPE_CONFIG).map(([k, v]) => <SelectItem key={k} value={k}>{v.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-xs text-gray-500 uppercase tracking-wide block mb-1.5">Floor</label>
              <input type="number" value={form.floor} onChange={e => setForm({ ...form, floor: parseInt(e.target.value) || 1 })}
                className="w-full h-9 px-3 rounded-xl border border-gray-200 text-sm outline-none focus:border-blue-400" />
            </div>
          </div>
          <div>
            <label className="text-xs text-gray-500 uppercase tracking-wide block mb-1.5">Daily Rate (Rs)</label>
            <input type="number" value={form.dailyRate} onChange={e => setForm({ ...form, dailyRate: parseFloat(e.target.value) || 0 })}
              className="w-full h-9 px-3 rounded-xl border border-gray-200 text-sm outline-none focus:border-blue-400" />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={handleSave} disabled={saving} className="bg-blue-600 hover:bg-blue-700">
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Create Ward'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function AddBedDialog({ hospitalId, wards, onClose, onSuccess }: {
  hospitalId: string;
  wards: Ward[];
  onClose: () => void;
  onSuccess: () => void;
}) {
  const { toast } = useToast();
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ wardId: '', bedNumber: '', bedType: 'general', dailyRate: 500 });

  const handleSave = async () => {
    if (!form.wardId) { toast('Select a ward', { type: 'error' }); return; }
    if (!form.bedNumber.trim()) { toast('Enter bed number', { type: 'error' }); return; }
    setSaving(true);
    try {
      await ipdService.createBed(hospitalId, form.wardId, form.bedNumber, form.bedType, form.dailyRate);
      toast('Bed Created', { type: 'success' });
      onSuccess();
    } catch {
      toast('Error', { description: 'Failed to create bed', type: 'error' });
    } finally { setSaving(false); }
  };

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader><DialogTitle>Add New Bed</DialogTitle></DialogHeader>
        <div className="space-y-4 py-4">
          <div>
            <label className="text-xs text-gray-500 uppercase tracking-wide block mb-1.5">Ward *</label>
            <Select value={form.wardId} onValueChange={v => setForm({ ...form, wardId: v })}>
              <SelectTrigger className="h-9"><SelectValue placeholder="Select ward" /></SelectTrigger>
              <SelectContent>
                {wards.map(w => <SelectItem key={w.id} value={w.id}>{w.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-gray-500 uppercase tracking-wide block mb-1.5">Bed Number *</label>
              <input value={form.bedNumber} onChange={e => setForm({ ...form, bedNumber: e.target.value })}
                placeholder="e.g., G-01" className="w-full h-9 px-3 rounded-xl border border-gray-200 text-sm outline-none focus:border-blue-400" />
            </div>
            <div>
              <label className="text-xs text-gray-500 uppercase tracking-wide block mb-1.5">Bed Type</label>
              <Select value={form.bedType} onValueChange={v => setForm({ ...form, bedType: v })}>
                <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="general">General</SelectItem>
                  <SelectItem value="icu">ICU</SelectItem>
                  <SelectItem value="ventilator">Ventilator</SelectItem>
                  <SelectItem value="oxygen">Oxygen</SelectItem>
                  <SelectItem value="isolation">Isolation</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div>
            <label className="text-xs text-gray-500 uppercase tracking-wide block mb-1.5">Daily Rate (Rs)</label>
            <input type="number" value={form.dailyRate} onChange={e => setForm({ ...form, dailyRate: parseFloat(e.target.value) || 0 })}
              className="w-full h-9 px-3 rounded-xl border border-gray-200 text-sm outline-none focus:border-blue-400" />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={handleSave} disabled={saving} className="bg-blue-600 hover:bg-blue-700">
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Create Bed'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function BulkAddDialog({ hospitalId, wards, onClose, onSuccess }: {
  hospitalId: string;
  wards: Ward[];
  onClose: () => void;
  onSuccess: () => void;
}) {
  const { toast } = useToast();
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    wardId: '', prefix: 'G', startNum: 1, endNum: 20, bedType: 'general', dailyRate: 500,
  });

  const bedCount = Math.max(0, form.endNum - form.startNum + 1);
  const preview = bedCount > 0 ? `${form.prefix}${form.startNum} to ${form.prefix}${form.endNum}` : '';

  const handleSave = async () => {
    if (!form.wardId) { toast('Select a ward', { type: 'error' }); return; }
    if (bedCount <= 0) { toast('Invalid range', { type: 'error' }); return; }
    if (bedCount > 100) { toast('Maximum 100 beds at once', { type: 'error' }); return; }
    setSaving(true);
    try {
      const count = await ipdService.bulkCreateBeds(
        hospitalId, form.wardId, form.prefix, form.startNum, form.endNum, form.bedType, form.dailyRate
      );
      toast(`${count} Beds Created`, { type: 'success' });
      onSuccess();
    } catch {
      toast('Error', { description: 'Failed to create beds', type: 'error' });
    } finally { setSaving(false); }
  };

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader><DialogTitle>Bulk Add Beds</DialogTitle></DialogHeader>
        <div className="space-y-4 py-4">
          <div>
            <label className="text-xs text-gray-500 uppercase tracking-wide block mb-1.5">Ward *</label>
            <Select value={form.wardId} onValueChange={v => setForm({ ...form, wardId: v })}>
              <SelectTrigger className="h-9"><SelectValue placeholder="Select ward" /></SelectTrigger>
              <SelectContent>
                {wards.map(w => <SelectItem key={w.id} value={w.id}>{w.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="text-xs text-gray-500 uppercase tracking-wide block mb-1.5">Prefix</label>
              <input value={form.prefix} onChange={e => setForm({ ...form, prefix: e.target.value })}
                placeholder="G" className="w-full h-9 px-3 rounded-xl border border-gray-200 text-sm outline-none focus:border-blue-400" />
            </div>
            <div>
              <label className="text-xs text-gray-500 uppercase tracking-wide block mb-1.5">From #</label>
              <input type="number" min={1} value={form.startNum} onChange={e => setForm({ ...form, startNum: parseInt(e.target.value) || 1 })}
                className="w-full h-9 px-3 rounded-xl border border-gray-200 text-sm outline-none focus:border-blue-400" />
            </div>
            <div>
              <label className="text-xs text-gray-500 uppercase tracking-wide block mb-1.5">To #</label>
              <input type="number" min={1} value={form.endNum} onChange={e => setForm({ ...form, endNum: parseInt(e.target.value) || 1 })}
                className="w-full h-9 px-3 rounded-xl border border-gray-200 text-sm outline-none focus:border-blue-400" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-gray-500 uppercase tracking-wide block mb-1.5">Bed Type</label>
              <Select value={form.bedType} onValueChange={v => setForm({ ...form, bedType: v })}>
                <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="general">General</SelectItem>
                  <SelectItem value="icu">ICU</SelectItem>
                  <SelectItem value="ventilator">Ventilator</SelectItem>
                  <SelectItem value="oxygen">Oxygen</SelectItem>
                  <SelectItem value="isolation">Isolation</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-xs text-gray-500 uppercase tracking-wide block mb-1.5">Price/Day (Rs)</label>
              <input type="number" value={form.dailyRate} onChange={e => setForm({ ...form, dailyRate: parseFloat(e.target.value) || 0 })}
                className="w-full h-9 px-3 rounded-xl border border-gray-200 text-sm outline-none focus:border-blue-400" />
            </div>
          </div>
          {preview && (
            <div className="p-3 bg-blue-50 rounded-xl text-sm">
              <div className="font-medium text-blue-800">Preview: {bedCount} beds</div>
              <div className="text-blue-600 text-xs mt-0.5">{preview} | Rs {form.dailyRate}/day</div>
            </div>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={handleSave} disabled={saving} className="bg-blue-600 hover:bg-blue-700">
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : `Create ${bedCount} Beds`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
