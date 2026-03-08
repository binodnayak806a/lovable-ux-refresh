import { Plus, Star, Trash2, Loader2, FileText } from 'lucide-react';
import { Button } from '../../../../components/ui/button';
import { Badge } from '../../../../components/ui/badge';
import { ScrollArea } from '../../../../components/ui/scroll-area';
import { cn } from '../../../../lib/utils';
import type { PrintTemplate } from './types';

interface Props {
  templates: PrintTemplate[];
  activeId: string | null;
  loading: boolean;
  onSelect: (t: PrintTemplate) => void;
  onNew: () => void;
  onSetDefault: (id: string) => void;
  onDelete: (id: string) => void;
}

export default function TemplateListPanel({
  templates, activeId, loading,
  onSelect, onNew, onSetDefault, onDelete,
}: Props) {
  if (loading) {
    return (
      <div className="flex items-center justify-center h-24">
        <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
          Templates ({templates.length})
        </p>
        <Button size="sm" variant="ghost" onClick={onNew} className="h-6 w-6 p-0">
          <Plus className="w-3.5 h-3.5" />
        </Button>
      </div>
      <ScrollArea className="max-h-48">
        <div className="space-y-1">
          {templates.map((t) => (
            <div
              key={t.id}
              onClick={() => onSelect(t)}
              className={cn(
                'flex items-center gap-2 px-2.5 py-2 rounded-lg cursor-pointer transition-colors group border',
                activeId === t.id
                  ? 'bg-primary/10 border-primary/30'
                  : 'hover:bg-accent border-transparent'
              )}
            >
              <FileText className={cn(
                'w-3.5 h-3.5 shrink-0',
                activeId === t.id ? 'text-primary' : 'text-muted-foreground'
              )} />
              <div className="flex-1 min-w-0">
                <p className={cn(
                  'text-xs font-medium truncate',
                  activeId === t.id ? 'text-primary' : 'text-foreground'
                )}>
                  {t.template_name || 'Untitled'}
                </p>
                <p className="text-[10px] text-muted-foreground">{t.page_size}</p>
              </div>
              <div className="flex items-center gap-0.5 shrink-0">
                {t.is_default ? (
                  <Badge className="text-[9px] bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-700/50 px-1 h-4">
                    Default
                  </Badge>
                ) : (
                  <button
                    onClick={(e) => { e.stopPropagation(); onSetDefault(t.id); }}
                    className="p-1 rounded opacity-0 group-hover:opacity-100 hover:bg-accent transition-all"
                    title="Set as default"
                  >
                    <Star className="w-3 h-3 text-muted-foreground hover:text-amber-500" />
                  </button>
                )}
                <button
                  onClick={(e) => { e.stopPropagation(); onDelete(t.id); }}
                  className="p-1 rounded opacity-0 group-hover:opacity-100 hover:bg-destructive/10 transition-all"
                  title="Delete"
                >
                  <Trash2 className="w-3 h-3 text-muted-foreground hover:text-destructive" />
                </button>
              </div>
            </div>
          ))}
          {templates.length === 0 && (
            <div className="text-center py-6">
              <FileText className="w-8 h-8 text-muted-foreground/30 mx-auto mb-2" />
              <p className="text-xs text-muted-foreground">No templates yet</p>
              <p className="text-[10px] text-muted-foreground/60 mt-0.5">Create one to get started</p>
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
