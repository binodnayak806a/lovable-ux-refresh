import { useState, useEffect, useCallback } from 'react';
import { Loader2, GripVertical, Plus, Trash2, Eye } from 'lucide-react';
import { Button } from '../../../components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../../../components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../../components/ui/select';
import { Switch } from '../../../components/ui/switch';
import { Badge } from '../../../components/ui/badge';
import { useHospitalId } from '../../../hooks/useHospitalId';
import { useToast } from '../../../hooks/useToast';
import { mastersService } from '../../../services/masters.service';
import type { CustomFieldConfig } from '../types';
import { FORM_TARGETS, FIELD_TYPES } from '../types';

const EMPTY: Partial<CustomFieldConfig> = {
  form_name: 'Patient', field_label: '', field_type: 'Text',
  is_mandatory: false, options: null, sort_order: 0, is_active: true,
};

export default function CustomFieldsConfigPage() {
  const hospitalId = useHospitalId();
  const { toast } = useToast();
  const [data, setData] = useState<CustomFieldConfig[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeForm, setActiveForm] = useState<string>('Patient');
  const [formOpen, setFormOpen] = useState(false);
  const [form, setForm] = useState<Partial<CustomFieldConfig>>(EMPTY);
  const [editId, setEditId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [dragIdx, setDragIdx] = useState<number | null>(null);

  const load = useCallback(async () => {
    try { setData(await mastersService.getCustomFields(hospitalId)); }
    catch { toast('Error', { type: 'error' }); } finally { setLoading(false); }
  }, [hospitalId]);

  useEffect(() => { load(); }, [load]);

  const filtered = data.filter(f => f.form_name === activeForm).sort((a, b) => a.sort_order - b.sort_order);
  const countByForm = FORM_TARGETS.reduce((acc, ft) => {
    acc[ft] = data.filter(f => f.form_name === ft).length;
    return acc;
  }, {} as Record<string, number>);

  const openAdd = () => {
    if (filtered.length >= 10) { toast('Maximum 10 fields per form', { type: 'error' }); return; }
    setForm({ ...EMPTY, form_name: activeForm, sort_order: filtered.length });
    setEditId(null);
    setFormOpen(true);
  };

  const openEdit = (d: CustomFieldConfig) => { setForm({ ...d }); setEditId(d.id); setFormOpen(true); };

  const handleSave = async () => {
    if (!form.field_label?.trim()) { toast('Enter field label', { type: 'error' }); return; }
    if (form.field_type === 'Dropdown' && (!form.options || form.options.length === 0)) {
      toast('Add at least one dropdown option', { type: 'error' }); return;
    }
    setSaving(true);
    try {
      await mastersService.upsertCustomField(hospitalId, form, editId || undefined);
      toast(editId ? 'Updated' : 'Added', { type: 'success' }); setFormOpen(false); load();
    } catch { toast('Error', { type: 'error' }); } finally { setSaving(false); }
  };

  const handleDelete = async (id: string) => {
    try {
      await mastersService.deleteCustomField(id);
      toast('Deleted', { type: 'success' }); load();
    } catch { toast('Error', { type: 'error' }); }
  };

  const handleToggle = async (field: CustomFieldConfig) => {
    try {
      await mastersService.upsertCustomField(hospitalId, { is_active: !field.is_active }, field.id);
      load();
    } catch { toast('Error', { type: 'error' }); }
  };

  const handleDragStart = (idx: number) => { setDragIdx(idx); };
  const handleDragOver = (e: React.DragEvent, idx: number) => {
    e.preventDefault();
    if (dragIdx === null || dragIdx === idx) return;
    setDragIdx(idx);
  };
  const handleDragEnd = async () => {
    if (dragIdx === null) return;
    const reordered = [...filtered];
    if (dragIdx < reordered.length) {
      const [moved] = reordered.splice(dragIdx, 1);
      reordered.push(moved);
    }
    setDragIdx(null);
    const updates = reordered
      .map((f, i) => ({ id: f.id, newOrder: i }))
      .filter((u, i) => reordered[i].sort_order !== u.newOrder);
    for (const u of updates) {
      await mastersService.upsertCustomField(hospitalId, { sort_order: u.newOrder }, u.id);
    }
    load();
  };

  const [optionInput, setOptionInput] = useState('');
  const addOption = () => {
    if (!optionInput.trim()) return;
    setForm({ ...form, options: [...(form.options || []), optionInput.trim()] });
    setOptionInput('');
  };
  const removeOption = (idx: number) => {
    const opts = [...(form.options || [])];
    opts.splice(idx, 1);
    setForm({ ...form, options: opts });
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-lg font-bold text-gray-900">Custom Fields</h2>
          <p className="text-xs text-gray-500 mt-0.5">Configure additional fields per form (max 10 per form)</p>
        </div>
        <div className="flex items-center gap-2">
          <Button size="sm" variant="outline" onClick={() => setPreviewOpen(true)} className="gap-1.5 h-8 text-xs">
            <Eye className="w-3.5 h-3.5" /> Preview
          </Button>
          <Button size="sm" onClick={openAdd} className="gap-1.5 h-8 text-xs bg-blue-600 hover:bg-blue-700">
            <Plus className="w-3.5 h-3.5" /> Add Field
          </Button>
        </div>
      </div>

      <div className="flex gap-2">
        {FORM_TARGETS.map(ft => (
          <button
            key={ft}
            onClick={() => setActiveForm(ft)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              activeForm === ft
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {ft}
            <span className="ml-1.5 text-xs opacity-70">({countByForm[ft] || 0})</span>
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-32">
          <Loader2 className="w-5 h-5 animate-spin text-gray-400" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-12 text-gray-400 text-sm">
          No custom fields for {activeForm}. Click "Add Field" to create one.
        </div>
      ) : (
        <div className="space-y-1.5">
          {filtered.map((field, idx) => (
            <div
              key={field.id}
              draggable
              onDragStart={() => handleDragStart(idx)}
              onDragOver={(e) => handleDragOver(e, idx)}
              onDragEnd={handleDragEnd}
              className={`flex items-center gap-3 p-3 rounded-xl border transition-all ${
                dragIdx === idx ? 'border-blue-300 bg-blue-50/50 shadow-sm' : 'border-gray-200 bg-white hover:border-gray-300'
              } ${!field.is_active ? 'opacity-50' : ''}`}
            >
              <GripVertical className="w-4 h-4 text-gray-300 cursor-grab shrink-0" />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-sm text-gray-900">{field.field_label}</span>
                  <Badge variant="outline" className="text-[10px]">{field.field_type}</Badge>
                  {field.is_mandatory && (
                    <Badge className="bg-red-50 text-red-600 border-red-200 text-[10px]">Required</Badge>
                  )}
                </div>
                {field.field_type === 'Dropdown' && field.options && (
                  <p className="text-xs text-gray-400 mt-0.5 truncate">
                    Options: {field.options.join(', ')}
                  </p>
                )}
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <Switch checked={field.is_active} onCheckedChange={() => handleToggle(field)} />
                <button onClick={() => openEdit(field)} className="p-1.5 rounded-lg hover:bg-blue-50 text-gray-400 hover:text-blue-600 transition-colors">
                  <Eye className="w-3.5 h-3.5" />
                </button>
                <button onClick={() => handleDelete(field.id)} className="p-1.5 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-500 transition-colors">
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <Dialog open={formOpen} onOpenChange={o => !o && setFormOpen(false)}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>{editId ? 'Edit Field' : 'Add Custom Field'}</DialogTitle></DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <label className="text-xs text-gray-500 uppercase tracking-wide block mb-1.5">Field Label *</label>
              <input type="text" value={form.field_label || ''} onChange={e => setForm({ ...form, field_label: e.target.value })}
                placeholder="e.g. Blood Group"
                className="w-full h-9 px-3 rounded-lg border border-gray-200 text-sm outline-none focus:border-blue-400" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-gray-500 uppercase tracking-wide block mb-1.5">Field Type</label>
                <Select value={form.field_type || 'Text'} onValueChange={v => setForm({ ...form, field_type: v, options: v === 'Dropdown' ? (form.options || []) : null })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {FIELD_TYPES.map(ft => <SelectItem key={ft} value={ft}>{ft}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-xs text-gray-500 uppercase tracking-wide block mb-1.5">Form</label>
                <Select value={form.form_name || 'Patient'} onValueChange={v => setForm({ ...form, form_name: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {FORM_TARGETS.map(ft => <SelectItem key={ft} value={ft}>{ft}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="flex items-center justify-between py-1">
              <label className="text-sm text-gray-700">Mandatory Field</label>
              <Switch checked={form.is_mandatory || false} onCheckedChange={v => setForm({ ...form, is_mandatory: v })} />
            </div>
            {form.field_type === 'Dropdown' && (
              <div>
                <label className="text-xs text-gray-500 uppercase tracking-wide block mb-1.5">Dropdown Options</label>
                <div className="flex gap-2 mb-2">
                  <input type="text" value={optionInput} onChange={e => setOptionInput(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addOption())}
                    placeholder="Type option and press Enter"
                    className="flex-1 h-8 px-3 rounded-lg border border-gray-200 text-sm outline-none focus:border-blue-400" />
                  <Button size="sm" variant="outline" onClick={addOption} className="h-8">Add</Button>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {(form.options || []).map((opt, i) => (
                    <Badge key={i} variant="outline" className="gap-1 pr-1">
                      {opt}
                      <button onClick={() => removeOption(i)} className="ml-0.5 hover:text-red-500">x</button>
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setFormOpen(false)}>Cancel</Button>
            <Button onClick={handleSave} disabled={saving} className="bg-blue-600 hover:bg-blue-700">
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : editId ? 'Update' : 'Add'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>Preview: {activeForm} Form</DialogTitle></DialogHeader>
          <div className="space-y-3 py-4">
            {filtered.filter(f => f.is_active).length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-6">No active fields to preview</p>
            ) : (
              filtered.filter(f => f.is_active).map(field => (
                <div key={field.id}>
                  <label className="text-xs text-gray-500 uppercase tracking-wide block mb-1.5">
                    {field.field_label} {field.is_mandatory && <span className="text-red-500">*</span>}
                  </label>
                  {field.field_type === 'Text' && (
                    <input type="text" disabled placeholder={`Enter ${field.field_label}`}
                      className="w-full h-9 px-3 rounded-lg border border-gray-200 text-sm bg-gray-50" />
                  )}
                  {field.field_type === 'Number' && (
                    <input type="number" disabled placeholder="0"
                      className="w-full h-9 px-3 rounded-lg border border-gray-200 text-sm bg-gray-50" />
                  )}
                  {field.field_type === 'Date' && (
                    <input type="date" disabled
                      className="w-full h-9 px-3 rounded-lg border border-gray-200 text-sm bg-gray-50" />
                  )}
                  {field.field_type === 'Dropdown' && (
                    <select disabled className="w-full h-9 px-3 rounded-lg border border-gray-200 text-sm bg-gray-50">
                      <option>Select...</option>
                      {(field.options || []).map(o => <option key={o}>{o}</option>)}
                    </select>
                  )}
                  {field.field_type === 'Toggle' && (
                    <div className="flex items-center gap-2">
                      <Switch disabled />
                      <span className="text-sm text-gray-400">Off</span>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
