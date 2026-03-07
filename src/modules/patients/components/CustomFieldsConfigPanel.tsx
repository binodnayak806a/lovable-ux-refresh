import { useState, useEffect } from 'react';
import {
  Plus, Trash2, GripVertical, Save, X, Settings2, AlertCircle,
} from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '../../../components/ui/button';
import { Input } from '../../../components/ui/input';
import { Label } from '../../../components/ui/label';
import { Switch } from '../../../components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../../components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/card';
import patientService from '../../../services/patient.service';

interface Props {
  hospitalId: string;
  onClose: () => void;
}

const MAX_FIELDS = 10;
const FIELD_TYPES = [
  { value: 'text', label: 'Text' },
  { value: 'date', label: 'Date' },
  { value: 'dropdown', label: 'Dropdown' },
  { value: 'toggle', label: 'Toggle' },
] as const;

interface LocalField {
  id?: string;
  field_label: string;
  field_type: 'text' | 'date' | 'dropdown' | 'toggle';
  is_mandatory: boolean;
  options: string[];
  sort_order: number;
  is_new?: boolean;
}

export default function CustomFieldsConfigPanel({ hospitalId, onClose }: Props) {
  const [fields, setFields] = useState<LocalField[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [optionsInput, setOptionsInput] = useState<Record<number, string>>({});

  useEffect(() => {
    async function load() {
      try {
        const configs = await patientService.getCustomFieldsConfig(hospitalId);
        setFields(configs.map((c) => ({
          id: c.id,
          field_label: c.field_label,
          field_type: c.field_type,
          is_mandatory: c.is_mandatory,
          options: c.options ?? [],
          sort_order: c.sort_order,
        })));
      } catch {
        toast.error('Failed to load custom fields');
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [hospitalId]);

  const addField = () => {
    if (fields.length >= MAX_FIELDS) {
      toast.error(`Maximum ${MAX_FIELDS} custom fields allowed`);
      return;
    }
    setFields((prev) => [...prev, {
      field_label: '',
      field_type: 'text',
      is_mandatory: false,
      options: [],
      sort_order: prev.length,
      is_new: true,
    }]);
  };

  const removeField = (index: number) => {
    const field = fields[index];
    if (field.id) {
      patientService.deleteCustomFieldConfig(field.id).catch(() => {});
    }
    setFields((prev) => prev.filter((_, i) => i !== index));
  };

  const updateField = (index: number, updates: Partial<LocalField>) => {
    setFields((prev) => prev.map((f, i) => i === index ? { ...f, ...updates } : f));
  };

  const addOption = (index: number) => {
    const val = optionsInput[index]?.trim();
    if (!val) return;
    updateField(index, { options: [...fields[index].options, val] });
    setOptionsInput((prev) => ({ ...prev, [index]: '' }));
  };

  const removeOption = (fieldIndex: number, optIndex: number) => {
    const field = fields[fieldIndex];
    updateField(fieldIndex, { options: field.options.filter((_, i) => i !== optIndex) });
  };

  const handleSave = async () => {
    const invalid = fields.find((f) => !f.field_label.trim());
    if (invalid) {
      toast.error('All fields must have a label');
      return;
    }

    setSaving(true);
    try {
      for (const field of fields) {
        if (field.is_new) {
          await patientService.saveCustomFieldConfig(hospitalId, {
            form_name: 'patient',
            field_label: field.field_label,
            field_type: field.field_type,
            is_mandatory: field.is_mandatory,
            options: field.options,
            sort_order: field.sort_order,
            is_active: true,
          });
        } else if (field.id) {
          await patientService.updateCustomFieldConfig(field.id, {
            field_label: field.field_label,
            field_type: field.field_type,
            is_mandatory: field.is_mandatory,
            options: field.options,
            sort_order: field.sort_order,
          });
        }
      }
      toast.success('Custom fields saved');
      onClose();
    } catch {
      toast.error('Failed to save custom fields');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={onClose} />
      <Card className="relative w-full max-w-xl max-h-[85vh] overflow-hidden flex flex-col shadow-2xl animate-in zoom-in-95 duration-200 mx-4">
        <CardHeader className="pb-3 border-b">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <Settings2 className="w-4 h-4 text-blue-600" />
              Custom Patient Fields
            </CardTitle>
            <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={onClose}>
              <X className="w-4 h-4" />
            </Button>
          </div>
          <p className="text-xs text-gray-500 mt-1">
            Configure up to {MAX_FIELDS} custom fields for the patient form.
            {fields.length > 0 && (
              <span className="ml-1 text-blue-600 font-medium">{fields.length}/{MAX_FIELDS} used</span>
            )}
          </p>
        </CardHeader>

        <CardContent className="flex-1 overflow-y-auto p-4 space-y-3">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : fields.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-gray-400">
              <Settings2 className="w-10 h-10 mb-3 opacity-30" />
              <p className="text-sm">No custom fields configured yet</p>
              <p className="text-xs mt-1">Click the button below to add one</p>
            </div>
          ) : (
            fields.map((field, index) => (
              <div key={index} className="bg-gray-50 rounded-lg p-3 border border-gray-100 space-y-2.5">
                <div className="flex items-start gap-2">
                  <GripVertical className="w-4 h-4 text-gray-300 mt-2 shrink-0" />
                  <div className="flex-1 space-y-2">
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <Label className="text-[10px] text-gray-500">Field Label</Label>
                        <Input
                          value={field.field_label}
                          onChange={(e) => updateField(index, { field_label: e.target.value })}
                          placeholder="e.g., Father's Name"
                          className="h-8 text-xs mt-0.5"
                        />
                      </div>
                      <div>
                        <Label className="text-[10px] text-gray-500">Type</Label>
                        <Select
                          value={field.field_type}
                          onValueChange={(v) => updateField(index, { field_type: v as LocalField['field_type'] })}
                        >
                          <SelectTrigger className="h-8 text-xs mt-0.5">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {FIELD_TYPES.map((t) => (
                              <SelectItem key={t.value} value={t.value} className="text-xs">{t.label}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-2">
                        <Switch
                          checked={field.is_mandatory}
                          onCheckedChange={(checked) => updateField(index, { is_mandatory: checked })}
                          className="scale-75"
                        />
                        <span className="text-[10px] text-gray-500">Required</span>
                      </div>
                    </div>

                    {field.field_type === 'dropdown' && (
                      <div className="space-y-1.5">
                        <Label className="text-[10px] text-gray-500">Options</Label>
                        <div className="flex flex-wrap gap-1">
                          {field.options.map((opt, oi) => (
                            <span
                              key={oi}
                              className="inline-flex items-center gap-1 text-[10px] bg-white border border-gray-200 rounded-md px-2 py-0.5"
                            >
                              {opt}
                              <button
                                onClick={() => removeOption(index, oi)}
                                className="text-gray-400 hover:text-red-500"
                              >
                                <X className="w-2.5 h-2.5" />
                              </button>
                            </span>
                          ))}
                        </div>
                        <div className="flex gap-1">
                          <Input
                            value={optionsInput[index] ?? ''}
                            onChange={(e) => setOptionsInput((prev) => ({ ...prev, [index]: e.target.value }))}
                            onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addOption(index))}
                            placeholder="Type option & press Enter"
                            className="h-7 text-xs flex-1"
                          />
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-7 text-xs px-2"
                            onClick={() => addOption(index)}
                          >
                            Add
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 w-7 p-0 text-gray-400 hover:text-red-500 shrink-0"
                    onClick={() => removeField(index)}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>
                </div>
              </div>
            ))
          )}

          {fields.length < MAX_FIELDS && (
            <Button
              variant="outline"
              className="w-full h-9 text-xs gap-1.5 border-dashed border-gray-300 text-gray-500 hover:text-blue-600 hover:border-blue-300"
              onClick={addField}
            >
              <Plus className="w-3.5 h-3.5" />
              Add Custom Field
            </Button>
          )}

          {fields.length >= MAX_FIELDS && (
            <div className="flex items-center gap-2 text-xs text-amber-600 bg-amber-50 rounded-lg px-3 py-2">
              <AlertCircle className="w-3.5 h-3.5 shrink-0" />
              Maximum of {MAX_FIELDS} custom fields reached
            </div>
          )}
        </CardContent>

        <div className="flex items-center gap-2 p-4 border-t bg-gray-50/50">
          <Button variant="outline" className="flex-1 text-sm" onClick={onClose}>
            Cancel
          </Button>
          <Button
            className="flex-1 text-sm gap-1.5 bg-blue-600 hover:bg-blue-700"
            onClick={handleSave}
            disabled={saving}
          >
            {saving ? (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <Save className="w-4 h-4" />
            )}
            Save Fields
          </Button>
        </div>
      </Card>
    </div>
  );
}
