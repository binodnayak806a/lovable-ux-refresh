import { Input } from '../../../components/ui/input';
import { Label } from '../../../components/ui/label';
import { Switch } from '../../../components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../../components/ui/select';
import type { CustomFieldConfig } from '../../../services/patient.service';

interface Props {
  fields: CustomFieldConfig[];
  values: Record<string, unknown>;
  onChange: (fieldId: string, value: unknown) => void;
  readOnly?: boolean;
}

export default function CustomFieldsRenderer({ fields, values, onChange, readOnly = false }: Props) {
  if (fields.length === 0) return null;

  return (
    <div className="space-y-3">
      <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Custom Fields</h4>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {fields.map((field) => {
          const value = values[field.id] ?? '';
          return (
            <div key={field.id} className="space-y-1">
              <Label className="text-xs text-gray-600">
                {field.field_label}
                {field.is_mandatory && <span className="text-red-500 ml-0.5">*</span>}
              </Label>

              {field.field_type === 'text' && (
                <Input
                  value={(value as string) || ''}
                  onChange={(e) => onChange(field.id, e.target.value)}
                  placeholder={field.field_label}
                  className="h-8 text-xs"
                  disabled={readOnly}
                />
              )}

              {field.field_type === 'date' && (
                <Input
                  type="date"
                  value={(value as string) || ''}
                  onChange={(e) => onChange(field.id, e.target.value)}
                  className="h-8 text-xs"
                  disabled={readOnly}
                />
              )}

              {field.field_type === 'dropdown' && (
                <Select
                  value={(value as string) || ''}
                  onValueChange={(v) => onChange(field.id, v)}
                  disabled={readOnly}
                >
                  <SelectTrigger className="h-8 text-xs">
                    <SelectValue placeholder={`Select ${field.field_label}`} />
                  </SelectTrigger>
                  <SelectContent>
                    {(field.options ?? []).map((opt) => (
                      <SelectItem key={opt} value={opt} className="text-xs">
                        {opt}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}

              {field.field_type === 'toggle' && (
                <div className="flex items-center gap-2 pt-1">
                  <Switch
                    checked={!!value}
                    onCheckedChange={(checked) => onChange(field.id, checked)}
                    disabled={readOnly}
                  />
                  <span className="text-xs text-gray-600">{value ? 'Yes' : 'No'}</span>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
