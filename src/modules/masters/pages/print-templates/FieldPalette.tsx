import { useState, useMemo } from 'react';
import { Type, Plus, GripVertical, Search, X } from 'lucide-react';
import { ScrollArea } from '../../../../components/ui/scroll-area';
import { Badge } from '../../../../components/ui/badge';
import { Input } from '../../../../components/ui/input';
import type { TemplateField } from './types';

interface Props {
  fields: TemplateField[];
  onAddField: (variable: string) => void;
}

export default function FieldPalette({ fields, onAddField }: Props) {
  const [search, setSearch] = useState('');

  const filtered = useMemo(() => {
    if (!search.trim()) return fields;
    const q = search.toLowerCase();
    return fields.filter(
      (f) => f.label.toLowerCase().includes(q) || f.variable.toLowerCase().includes(q)
    );
  }, [fields, search]);

  return (
    <div className="flex flex-col h-full">
      <div className="px-3 pt-3 pb-2 space-y-2">
        <div className="flex items-center justify-between">
          <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
            Data Fields ({fields.length})
          </p>
        </div>
        <div className="relative">
          <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-3 h-3 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search fields..."
            className="h-7 text-xs pl-7 pr-7"
          />
          {search && (
            <button onClick={() => setSearch('')} className="absolute right-2 top-1/2 -translate-y-1/2">
              <X className="w-3 h-3 text-muted-foreground hover:text-foreground" />
            </button>
          )}
        </div>
      </div>
      <ScrollArea className="flex-1">
        <div className="px-2 pb-3 space-y-0.5">
          {filtered.length === 0 ? (
            <p className="text-xs text-muted-foreground text-center py-6">No fields match "{search}"</p>
          ) : (
            filtered.map((field) => (
              <button
                key={field.variable}
                onClick={() => onAddField(field.variable)}
                className="w-full flex items-center gap-2 px-2 py-1.5 rounded-lg text-left hover:bg-accent group transition-colors"
                title={`Click to add: ${field.variable}\nSample: ${field.sampleValue}`}
              >
                <GripVertical className="w-2.5 h-2.5 text-muted-foreground/30 shrink-0" />
                <Type className="w-3 h-3 text-muted-foreground group-hover:text-primary shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-[11px] font-medium text-foreground group-hover:text-primary truncate leading-tight">
                    {field.label}
                  </p>
                  <Badge
                    variant="outline"
                    className="text-[8px] font-mono mt-0.5 px-1 py-0 h-3.5 border-border/50 text-muted-foreground/70"
                  >
                    {field.variable}
                  </Badge>
                </div>
                <Plus className="w-3 h-3 text-muted-foreground/20 group-hover:text-primary shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" />
              </button>
            ))
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
