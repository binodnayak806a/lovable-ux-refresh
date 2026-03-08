import { Type, Plus } from 'lucide-react';
import { ScrollArea } from '../../../../components/ui/scroll-area';
import { Badge } from '../../../../components/ui/badge';
import type { TemplateField } from './types';

interface Props {
  fields: TemplateField[];
  onAddField: (variable: string) => void;
}

export default function FieldPalette({ fields, onAddField }: Props) {
  return (
    <ScrollArea className="h-full">
      <div className="p-3 space-y-1">
        <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider px-1 mb-2">
          Data Fields
        </p>
        {fields.map((field) => (
          <button
            key={field.variable}
            onClick={() => onAddField(field.variable, field.label)}
            className="w-full flex items-center gap-2 px-2.5 py-2 rounded-lg text-left hover:bg-blue-50 group transition-colors"
          >
            <Type className="w-3.5 h-3.5 text-gray-400 group-hover:text-blue-500 shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium text-gray-700 group-hover:text-blue-700 truncate">
                {field.label}
              </p>
              <Badge
                variant="outline"
                className="text-[9px] font-mono mt-0.5 px-1 py-0 h-4 border-gray-200 text-gray-400"
              >
                {field.variable}
              </Badge>
            </div>
            <Plus className="w-3 h-3 text-gray-300 group-hover:text-blue-500 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" />
          </button>
        ))}
      </div>
    </ScrollArea>
  );
}
