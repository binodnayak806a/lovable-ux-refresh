import { useState, useEffect, useMemo } from 'react';
import { Search, Plus, Loader2 } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { cn } from '@/lib/utils';
import { SERVICE_GROUPS } from '@/modules/master-data/types';

export interface ServicePickerItem {
  id: string;
  name: string;
  code: string | null;
  category: string;
  service_group: string;
  service_type: string;
  rate: number;
  tax_percentage: number;
}

interface Props {
  hospitalId: string;
  /** Filter by OPD, IPD, or show all (BOTH) */
  filterType?: 'OPD' | 'IPD' | null;
  onSelect: (service: ServicePickerItem) => void;
  className?: string;
  compact?: boolean;
}

export default function ServiceGroupPicker({ hospitalId, filterType, onSelect, className, compact }: Props) {
  const [services, setServices] = useState<ServicePickerItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeGroup, setActiveGroup] = useState<string>('All');
  const [search, setSearch] = useState('');

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        let query = supabase
          .from('service_items')
          .select('id, name, code, category, service_group, service_type, rate, tax_percentage')
          .eq('hospital_id', hospitalId)
          .eq('is_active', true)
          .order('service_group')
          .order('name');

        if (filterType) {
          query = query.or(`service_type.eq.${filterType},service_type.eq.BOTH`);
        }

        const { data } = await query;
        setServices((data ?? []) as ServicePickerItem[]);
      } catch {
        setServices([]);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [hospitalId, filterType]);

  const groups = useMemo(() => {
    const groupSet = new Set(services.map(s => s.service_group));
    return ['All', ...SERVICE_GROUPS.filter(g => groupSet.has(g))];
  }, [services]);

  const filtered = useMemo(() => {
    let list = services;
    if (activeGroup !== 'All') {
      list = list.filter(s => s.service_group === activeGroup);
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(s =>
        s.name.toLowerCase().includes(q) ||
        (s.code && s.code.toLowerCase().includes(q)) ||
        s.category.toLowerCase().includes(q)
      );
    }
    return list;
  }, [services, activeGroup, search]);

  const groupCounts = useMemo(() => {
    const counts: Record<string, number> = { All: services.length };
    services.forEach(s => {
      counts[s.service_group] = (counts[s.service_group] || 0) + 1;
    });
    return counts;
  }, [services]);

  if (loading) {
    return (
      <div className={cn('flex items-center justify-center py-8', className)}>
        <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (services.length === 0) {
    return (
      <div className={cn('text-center py-6 text-sm text-muted-foreground', className)}>
        No services configured. Add services in Service Master.
      </div>
    );
  }

  return (
    <div className={cn('space-y-3', className)}>
      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <input
          type="text"
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search services..."
          className="w-full h-9 pl-9 pr-3 rounded-lg border border-border bg-background text-sm outline-none focus:border-ring focus:ring-1 focus:ring-ring"
        />
      </div>

      {/* Group Tabs */}
      <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-none">
        {groups.map(group => (
          <button
            key={group}
            type="button"
            onClick={() => setActiveGroup(group)}
            className={cn(
              'flex-shrink-0 px-3 py-1.5 rounded-lg text-xs font-medium border transition-all whitespace-nowrap',
              activeGroup === group
                ? 'bg-primary text-primary-foreground border-primary'
                : 'bg-muted/50 text-muted-foreground border-border hover:bg-muted hover:text-foreground'
            )}
          >
            {group}
            <span className="ml-1 opacity-70">({groupCounts[group] || 0})</span>
          </button>
        ))}
      </div>

      {/* Service List */}
      <div className={cn('space-y-1 overflow-y-auto', compact ? 'max-h-48' : 'max-h-64')}>
        {filtered.length === 0 ? (
          <div className="text-center py-4 text-xs text-muted-foreground">No services found</div>
        ) : (
          filtered.map(svc => (
            <button
              key={svc.id}
              type="button"
              onClick={() => onSelect(svc)}
              className="w-full text-left px-3 py-2 rounded-lg hover:bg-accent/50 border border-transparent hover:border-border transition-all flex items-center justify-between gap-2 group"
            >
              <div className="min-w-0 flex-1">
                <div className="text-sm font-medium text-foreground truncate">{svc.name}</div>
                <div className="text-[11px] text-muted-foreground">
                  {svc.code && <span className="font-mono">{svc.code}</span>}
                  {svc.code && ' · '}
                  {svc.category}
                  {svc.tax_percentage > 0 && ` · GST ${svc.tax_percentage}%`}
                </div>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <span className="text-sm font-semibold font-mono text-foreground">
                  ₹{svc.rate.toLocaleString('en-IN')}
                </span>
                <Plus className="w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
            </button>
          ))
        )}
      </div>
    </div>
  );
}
