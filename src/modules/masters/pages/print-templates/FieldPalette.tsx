import { Type, Plus, GripVertical } from 'lucide-react';
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
        <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider px-1 mb-2">
          Data Fields
        </p>
        {fields.map((field) => (
          <button
            key={field.variable}
            onClick={() => onAddField(field.variable)}
            className="w-full flex items-center gap-2 px-2.5 py-2 rounded-lg text-left hover:bg-accent group transition-colors"
          >
            <GripVertical className="w-3 h-3 text-muted-foreground/40 shrink-0" />
            <Type className="w-3.5 h-3.5 text-muted-foreground group-hover:text-primary shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium text-foreground group-hover:text-primary truncate">
                {field.label}
              </p>
              <Badge
                variant="outline"
                className="text-[9px] font-mono mt-0.5 px-1 py-0 h-4 border-border text-muted-foreground"
              >
                {field.variable}
              </Badge>
            </div>
            <Plus className="w-3 h-3 text-muted-foreground/30 group-hover:text-primary shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" />
          </button>
        ))}
      </div>
    </ScrollArea>
  );
}
