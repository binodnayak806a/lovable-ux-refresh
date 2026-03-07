import { useMemo, useState } from 'react';
import { Edit2, Trash2, ChevronUp, ChevronDown, ToggleLeft, ToggleRight } from 'lucide-react';
import { Badge } from '../../../components/ui/badge';

export interface MasterColumn<T> {
  key: string;
  label: string;
  sortable?: boolean;
  render?: (item: T) => React.ReactNode;
  width?: string;
}

interface Props<T> {
  data: T[];
  columns: MasterColumn<T>[];
  search: string;
  searchKeys: string[];
  getRowKey: (item: T) => string;
  onEdit: (item: T) => void;
  onDelete: (item: T) => void;
  onToggleActive?: (item: T) => void;
  emptyMessage?: string;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const get = (obj: any, key: string) => obj[key];

export default function MasterTable<T>({
  data, columns, search, searchKeys, getRowKey, onEdit, onDelete, onToggleActive, emptyMessage,
}: Props<T>) {
  const [sortKey, setSortKey] = useState<string | null>(null);
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');
  const [page, setPage] = useState(0);
  const pageSize = 20;

  const filtered = useMemo(() => {
    let result = [...data];
    if (search) {
      const lower = search.toLowerCase();
      result = result.filter(item =>
        searchKeys.some(k => {
          const val = get(item, k);
          return val && String(val).toLowerCase().includes(lower);
        })
      );
    }
    if (sortKey) {
      result.sort((a, b) => {
        const av = get(a, sortKey), bv = get(b, sortKey);
        if (av === bv) return 0;
        if (av == null) return 1;
        if (bv == null) return -1;
        const cmp = String(av).localeCompare(String(bv), undefined, { numeric: true });
        return sortDir === 'asc' ? cmp : -cmp;
      });
    }
    return result;
  }, [data, search, searchKeys, sortKey, sortDir]);

  const paginated = filtered.slice(page * pageSize, (page + 1) * pageSize);
  const totalPages = Math.ceil(filtered.length / pageSize);

  const toggleSort = (key: string) => {
    if (sortKey === key) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortKey(key); setSortDir('asc'); }
  };

  if (filtered.length === 0) {
    return (
      <div className="text-center py-12 text-gray-400 text-sm">
        {emptyMessage || 'No records found'}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="border border-gray-200 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50/80 border-b border-gray-200">
                {columns.map(col => (
                  <th
                    key={col.key}
                    style={{ width: col.width }}
                    className={`px-4 py-2.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider ${col.sortable ? 'cursor-pointer select-none hover:text-gray-700' : ''}`}
                    onClick={() => col.sortable && toggleSort(col.key)}
                  >
                    <div className="flex items-center gap-1">
                      {col.label}
                      {col.sortable && sortKey === col.key && (
                        sortDir === 'asc' ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />
                      )}
                    </div>
                  </th>
                ))}
                <th className="px-4 py-2.5 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider w-28">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {paginated.map(item => (
                <tr key={getRowKey(item)} className="hover:bg-gray-50/50 transition-colors">
                  {columns.map(col => (
                    <td key={col.key} className="px-4 py-2.5 text-gray-700">
                      {col.render ? col.render(item) : String(get(item, col.key) ?? '-')}
                    </td>
                  ))}
                  <td className="px-4 py-2.5 text-right">
                    <div className="flex items-center justify-end gap-1">
                      {onToggleActive && (
                        <button
                          type="button"
                          onClick={() => onToggleActive(item)}
                          className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors"
                          title={get(item, 'is_active') ? 'Deactivate' : 'Activate'}
                        >
                          {get(item, 'is_active') ? (
                            <ToggleRight className="w-4 h-4 text-emerald-500" />
                          ) : (
                            <ToggleLeft className="w-4 h-4 text-gray-400" />
                          )}
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => onEdit(item)}
                        className="p-1.5 rounded-lg hover:bg-blue-50 text-gray-400 hover:text-blue-600 transition-colors"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => onDelete(item)}
                        className="p-1.5 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-500 transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-between text-xs text-gray-500">
          <span>Page {page + 1} of {totalPages} ({filtered.length} records)</span>
          <div className="flex gap-1">
            <button
              type="button"
              disabled={page === 0}
              onClick={() => setPage(p => p - 1)}
              className="px-2.5 py-1.5 rounded-lg border border-gray-200 disabled:opacity-40 hover:bg-gray-50"
            >
              Prev
            </button>
            <button
              type="button"
              disabled={page >= totalPages - 1}
              onClick={() => setPage(p => p + 1)}
              className="px-2.5 py-1.5 rounded-lg border border-gray-200 disabled:opacity-40 hover:bg-gray-50"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export function StatusBadge({ active }: { active: boolean }) {
  return (
    <Badge className={active ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-gray-100 text-gray-500 border-gray-200'}>
      {active ? 'Active' : 'Inactive'}
    </Badge>
  );
}
