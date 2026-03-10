import { useState, useEffect, useCallback } from 'react';
import {
  Building2, Plus, Edit2, Trash2, Loader2, ChevronDown, ChevronUp,
} from 'lucide-react';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Badge } from '../../components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../../components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';

import { useAppSelector } from '../../store';
import { useToast } from '../../hooks/useToast';
import { usePageTitle } from '../../hooks/usePageTitle';
import PageHeader from '../../components/shared/PageHeader';
import ipdService from '../../services/ipd.service';
import { supabase } from '../../lib/supabase';
import type { Ward, Bed, WardType, BedType } from './types';
import { WARD_TYPE_CONFIG, BED_STATUS_CONFIG } from './types';
import { cn } from '../../lib/utils';

const DEMO_HOSPITAL_ID = '11111111-1111-1111-1111-111111111111';

const WARD_CATEGORIES = [
  'General Ward', 'Private Room', 'Semi-Private', 'ICU', 'NICU', 'PICU', 'HDU', 'Emergency', 'OT', 'Isolation',
];

const BED_TYPES: BedType[] = ['general', 'icu', 'ventilator', 'oxygen', 'isolation'];

export default function WardManagementPage() {
  usePageTitle('Ward Management');
  const { hospitalId: hId } = useAppSelector(s => s.auth);
  const hospitalId = hId ?? DEMO_HOSPITAL_ID;
  const { toast } = useToast();

  const [wards, setWards] = useState<Ward[]>([]);
  const [beds, setBeds] = useState<Bed[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedWard, setExpandedWard] = useState<string | null>(null);
  const [showWardDialog, setShowWardDialog] = useState(false);
  const [showBedDialog, setShowBedDialog] = useState(false);
  const [editWard, setEditWard] = useState<Ward | null>(null);
  const [wardForm, setWardForm] = useState({ name: '', ward_type: 'general' as WardType, floor: 1, daily_rate: 500, block: '', category: 'General Ward' });
  const [bedForm, setBedForm] = useState({ ward_id: '', bed_number: '', bed_type: 'general' as BedType, daily_rate: 500 });
  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<{ type: 'ward' | 'bed'; id: string; name: string } | null>(null);
  const [deleting, setDeleting] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [w, b] = await Promise.all([
        ipdService.getWards(hospitalId),
        ipdService.getBedsWithOccupancy(hospitalId),
      ]);
      setWards(w);
      setBeds(b);
    } catch {
      toast('Failed to load data', { type: 'error' });
    } finally {
      setLoading(false);
    }
  }, [hospitalId]);

  useEffect(() => { load(); }, [load]);

  const openAddWard = () => {
    setEditWard(null);
    setWardForm({ name: '', ward_type: 'general', floor: 1, daily_rate: 500, block: '', category: 'General Ward' });
    setShowWardDialog(true);
  };

  const openEditWard = (w: Ward) => {
    setEditWard(w);
    setWardForm({ name: w.name, ward_type: w.ward_type, floor: w.floor, daily_rate: w.daily_rate, block: w.block || '', category: WARD_CATEGORIES.find(c => c.toLowerCase().includes(w.ward_type)) || 'General Ward' });
    setShowWardDialog(true);
  };

  const openAddBed = (wardId: string) => {
    const ward = wards.find(w => w.id === wardId);
    setBedForm({ ward_id: wardId, bed_number: '', bed_type: 'general', daily_rate: ward?.daily_rate ?? 500 });
    setShowBedDialog(true);
  };

  const handleSaveWard = async () => {
    if (!wardForm.name.trim()) { toast('Enter ward name', { type: 'error' }); return; }
    setSaving(true);
    try {
      if (editWard) {
        await supabase.from('wards').update({
          name: wardForm.name, ward_type: wardForm.ward_type,
          floor: wardForm.floor, daily_rate: wardForm.daily_rate,
          block: wardForm.block || null, category: wardForm.category,
          updated_at: new Date().toISOString(),
        } as never).eq('id', editWard.id);
        toast('Ward updated', { type: 'success' });
      } else {
        await ipdService.createWard(hospitalId, wardForm.name, wardForm.ward_type, wardForm.floor, wardForm.daily_rate);
        toast('Ward created', { type: 'success' });
      }
      setShowWardDialog(false);
      load();
    } catch {
      toast('Failed to save ward', { type: 'error' });
    } finally {
      setSaving(false);
    }
  };

  const handleSaveBed = async () => {
    if (!bedForm.bed_number.trim() || !bedForm.ward_id) { toast('Enter bed number', { type: 'error' }); return; }
    setSaving(true);
    try {
      await supabase.from('beds').insert({
        hospital_id: hospitalId,
        ward_id: bedForm.ward_id,
        bed_number: bedForm.bed_number,
        bed_type: bedForm.bed_type,
        daily_rate: bedForm.daily_rate,
        status: 'available',
      } as never);
      toast('Bed added', { type: 'success' });
      setShowBedDialog(false);
      load();
    } catch {
      toast('Failed to add bed', { type: 'error' });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      if (deleteTarget.type === 'ward') {
        await supabase.from('wards').delete().eq('id', deleteTarget.id);
      } else {
        await supabase.from('beds').delete().eq('id', deleteTarget.id);
      }
      toast('Deleted successfully', { type: 'success' });
      setDeleteTarget(null);
      load();
    } catch {
      toast('Failed to delete', { type: 'error' });
    } finally {
      setDeleting(false);
    }
  };

  const getWardBeds = (wardId: string) => beds.filter(b => b.ward_id === wardId);

  if (loading) {
    return <div className="flex justify-center py-20"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></div>;
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Ward Management"
        subtitle={`${wards.length} wards, ${beds.length} beds`}
        icon={Building2}
        actions={
          <Button size="sm" onClick={openAddWard} className="gap-1.5">
            <Plus className="w-4 h-4" /> Add Ward
          </Button>
        }
      />

      {wards.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          <Building2 className="w-12 h-12 mx-auto mb-2 opacity-30" />
          <p>No wards configured. Add your first ward to get started.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {wards.map(ward => {
            const wardBeds = getWardBeds(ward.id);
            const isExpanded = expandedWard === ward.id;
            const wardConf = WARD_TYPE_CONFIG[ward.ward_type];
            const availableBeds = wardBeds.filter(b => b.status === 'available').length;
            const occupiedBeds = wardBeds.filter(b => b.status === 'occupied').length;

            return (
              <div key={ward.id} className="border border-border rounded-xl overflow-hidden">
                <button
                  onClick={() => setExpandedWard(isExpanded ? null : ward.id)}
                  className="w-full flex items-center justify-between px-5 py-4 hover:bg-muted/30 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <Building2 className="w-5 h-5 text-primary" />
                    <div className="text-left">
                      <div className="font-semibold">{ward.name}</div>
                      <div className="text-xs text-muted-foreground">
                        Floor {ward.floor}{ward.block ? `, Block ${ward.block}` : ''} • ₹{ward.daily_rate}/day
                      </div>
                    </div>
                    <Badge className={cn('text-[10px] ml-2', wardConf.color)}>{wardConf.label}</Badge>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="flex gap-3 text-xs">
                      <span className="text-emerald-600 font-medium">{availableBeds} available</span>
                      <span className="text-blue-600 font-medium">{occupiedBeds} occupied</span>
                      <span className="text-muted-foreground">{wardBeds.length} total</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <button onClick={e => { e.stopPropagation(); openEditWard(ward); }}
                        className="p-1.5 rounded-md hover:bg-muted text-muted-foreground hover:text-foreground">
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button onClick={e => { e.stopPropagation(); setDeleteTarget({ type: 'ward', id: ward.id, name: ward.name }); }}
                        className="p-1.5 rounded-md hover:bg-destructive/10 text-muted-foreground hover:text-destructive">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                      {isExpanded ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
                    </div>
                  </div>
                </button>

                {isExpanded && (
                  <div className="border-t border-border bg-muted/20 p-4">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="text-xs font-semibold text-muted-foreground uppercase">Beds in {ward.name}</h4>
                      <Button size="sm" variant="outline" onClick={() => openAddBed(ward.id)} className="gap-1.5 h-7 text-xs">
                        <Plus className="w-3 h-3" /> Add Bed
                      </Button>
                    </div>
                    {wardBeds.length === 0 ? (
                      <p className="text-sm text-muted-foreground text-center py-4">No beds in this ward</p>
                    ) : (
                      <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-2">
                        {wardBeds.map(bed => {
                          const conf = BED_STATUS_CONFIG[bed.status];
                          return (
                            <div key={bed.id} className={cn(
                              'relative rounded-lg p-2 text-center border-2 group',
                              bed.status === 'available' && 'bg-emerald-50 border-emerald-200',
                              bed.status === 'occupied' && 'bg-blue-50 border-blue-200',
                              bed.status === 'maintenance' && 'bg-amber-50 border-amber-200',
                              bed.status === 'cleaning' && 'bg-yellow-50 border-yellow-200',
                            )}>
                              <div className="text-xs font-bold">{bed.bed_number}</div>
                              <div className="text-[9px]" style={{ color: conf.color }}>{conf.label}</div>
                              {bed.status !== 'occupied' && (
                                <button
                                  onClick={() => setDeleteTarget({ type: 'bed', id: bed.id, name: bed.bed_number })}
                                  className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-destructive text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                                >
                                  <Trash2 className="w-2.5 h-2.5" />
                                </button>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Ward Dialog */}
      <Dialog open={showWardDialog} onOpenChange={o => !o && setShowWardDialog(false)}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>{editWard ? 'Edit Ward' : 'Add New Ward'}</DialogTitle></DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <label className="text-xs text-muted-foreground uppercase block mb-1.5">Ward Name *</label>
              <Input value={wardForm.name} onChange={e => setWardForm({ ...wardForm, name: e.target.value })} placeholder="e.g., General Ward A" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-muted-foreground uppercase block mb-1.5">Ward Category</label>
                <Select value={wardForm.ward_type} onValueChange={v => setWardForm({ ...wardForm, ward_type: v as WardType })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {Object.entries(WARD_TYPE_CONFIG).map(([k, v]) => <SelectItem key={k} value={k}>{v.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-xs text-muted-foreground uppercase block mb-1.5">Floor</label>
                <Input type="number" value={wardForm.floor} onChange={e => setWardForm({ ...wardForm, floor: parseInt(e.target.value) || 1 })} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-muted-foreground uppercase block mb-1.5">Block</label>
                <Input value={wardForm.block} onChange={e => setWardForm({ ...wardForm, block: e.target.value })} placeholder="e.g., A" />
              </div>
              <div>
                <label className="text-xs text-muted-foreground uppercase block mb-1.5">Daily Rate (₹)</label>
                <Input type="number" value={wardForm.daily_rate} onChange={e => setWardForm({ ...wardForm, daily_rate: parseFloat(e.target.value) || 0 })} />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowWardDialog(false)}>Cancel</Button>
            <Button onClick={handleSaveWard} disabled={saving}>
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : editWard ? 'Update' : 'Create'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Bed Dialog */}
      <Dialog open={showBedDialog} onOpenChange={o => !o && setShowBedDialog(false)}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle>Add Bed</DialogTitle></DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <label className="text-xs text-muted-foreground uppercase block mb-1.5">Bed Number *</label>
              <Input value={bedForm.bed_number} onChange={e => setBedForm({ ...bedForm, bed_number: e.target.value })} placeholder="e.g., B-101" />
            </div>
            <div>
              <label className="text-xs text-muted-foreground uppercase block mb-1.5">Bed Type</label>
              <Select value={bedForm.bed_type} onValueChange={v => setBedForm({ ...bedForm, bed_type: v as BedType })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {BED_TYPES.map(t => <SelectItem key={t} value={t} className="capitalize">{t}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-xs text-muted-foreground uppercase block mb-1.5">Daily Rate (₹)</label>
              <Input type="number" value={bedForm.daily_rate} onChange={e => setBedForm({ ...bedForm, daily_rate: parseFloat(e.target.value) || 0 })} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowBedDialog(false)}>Cancel</Button>
            <Button onClick={handleSaveBed} disabled={saving}>
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Add Bed'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <Dialog open={!!deleteTarget} onOpenChange={o => !o && setDeleteTarget(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle>Confirm Delete</DialogTitle></DialogHeader>
          <p className="text-sm text-muted-foreground py-4">
            Are you sure you want to delete <strong>{deleteTarget?.name}</strong>?
            {deleteTarget?.type === 'ward' && ' All beds in this ward will also be removed.'}
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteTarget(null)}>Cancel</Button>
            <Button variant="destructive" onClick={handleDelete} disabled={deleting}>
              {deleting ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Delete'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
