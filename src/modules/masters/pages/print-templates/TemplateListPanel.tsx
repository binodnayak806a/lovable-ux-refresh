import { Plus, Star, Trash2, Loader2 } from 'lucide-react';
import { Button } from '../../../../components/ui/button';
import { Badge } from '../../../../components/ui/badge';
import { ScrollArea } from '../../../../components/ui/scroll-area';
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
      <div className="flex items-center justify-center h-32">
        <Loader2 className="w-5 h-5 animate-spin text-gray-400" />
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between px-1">
        <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">
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
              className={`flex items-center gap-2 px-2.5 py-2 rounded-lg cursor-pointer transition-colors group ${
                activeId === t.id
                  ? 'bg-blue-50 border border-blue-200'
                  : 'hover:bg-gray-50 border border-transparent'
              }`}
            >
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium text-gray-800 truncate">
                  {t.template_name || 'Untitled'}
                </p>
                <p className="text-[10px] text-gray-400">{t.page_size}</p>
              </div>
              <div className="flex items-center gap-0.5 shrink-0">
                {t.is_default ? (
                  <Badge className="text-[9px] bg-amber-50 text-amber-700 border-amber-200 px-1 h-4">
                    Default
                  </Badge>
                ) : (
                  <button
                    onClick={(e) => { e.stopPropagation(); onSetDefault(t.id); }}
                    className="p-1 rounded opacity-0 group-hover:opacity-100 hover:bg-amber-50 transition-all"
                    title="Set as default"
                  >
                    <Star className="w-3 h-3 text-gray-400 hover:text-amber-500" />
                  </button>
                )}
                <button
                  onClick={(e) => { e.stopPropagation(); onDelete(t.id); }}
                  className="p-1 rounded opacity-0 group-hover:opacity-100 hover:bg-red-50 transition-all"
                  title="Delete"
                >
                  <Trash2 className="w-3 h-3 text-gray-400 hover:text-red-500" />
                </button>
              </div>
            </div>
          ))}
          {templates.length === 0 && (
            <p className="text-xs text-gray-400 text-center py-4">
              No templates yet
            </p>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
