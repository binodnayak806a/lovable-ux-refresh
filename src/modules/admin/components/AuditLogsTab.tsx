import { useState, useEffect, useCallback, Fragment } from 'react';
import { format } from 'date-fns';
import { toast } from 'sonner';
import { Search, RefreshCw, ChevronDown, ChevronUp } from 'lucide-react';
import { Badge } from '../../../components/ui/badge';
import { Button } from '../../../components/ui/button';
import { Input } from '../../../components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../../../components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../../../components/ui/table';
import { supabase } from '../../../lib/supabase';

interface AuditLog {
  id: string;
  user_id: string | null;
  action: string;
  table_name: string | null;
  record_id: string | null;
  old_values: Record<string, unknown> | null;
  new_values: Record<string, unknown> | null;
  ip_address: string | null;
  user_agent: string | null;
  created_at: string;
  hospital_id: string | null;
  profile?: {
    full_name: string;
    email: string;
    role: string;
  };
}

const ACTION_COLORS: Record<string, string> = {
  INSERT: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  UPDATE: 'bg-blue-50 text-blue-700 border-blue-200',
  DELETE: 'bg-red-50 text-red-700 border-red-200',
  LOGIN: 'bg-slate-50 text-slate-700 border-slate-200',
  LOGOUT: 'bg-slate-50 text-slate-600 border-slate-200',
  create: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  update: 'bg-blue-50 text-blue-700 border-blue-200',
  delete: 'bg-red-50 text-red-700 border-red-200',
  login: 'bg-slate-50 text-slate-700 border-slate-200',
  logout: 'bg-slate-50 text-slate-600 border-slate-200',
};

interface AuditLogsTabProps {
  hospitalId: string;
}

export default function AuditLogsTab({ hospitalId }: AuditLogsTabProps) {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [actionFilter, setActionFilter] = useState('all');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [page, setPage] = useState(0);

  const PAGE_SIZE = 50;

  const fetchLogs = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await supabase
        .from('audit_logs')
        .select('*, profile:profiles(full_name, email, role)')
        .eq('hospital_id', hospitalId)
        .order('created_at', { ascending: false })
        .range(page * PAGE_SIZE, (page + 1) * PAGE_SIZE - 1);

      if (data) setLogs(data as AuditLog[]);
    } catch {
      toast.error('Failed to load audit logs');
    } finally {
      setLoading(false);
    }
  }, [hospitalId, page]);

  useEffect(() => { fetchLogs(); }, [fetchLogs]);

  const filtered = logs.filter(l => {
    const text = `${l.action} ${l.table_name} ${l.profile?.full_name} ${l.profile?.email}`.toLowerCase();
    const matchSearch = !search || text.includes(search.toLowerCase());
    const matchAction = actionFilter === 'all' || l.action.toLowerCase() === actionFilter.toLowerCase();
    return matchSearch && matchAction;
  });

  const uniqueActions = Array.from(new Set(logs.map(l => l.action)));

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search logs..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={actionFilter} onValueChange={setActionFilter}>
          <SelectTrigger className="w-36"><SelectValue placeholder="All Actions" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Actions</SelectItem>
            {uniqueActions.map(a => <SelectItem key={a} value={a}>{a}</SelectItem>)}
          </SelectContent>
        </Select>
        <Button variant="outline" onClick={fetchLogs} disabled={loading}>
          <RefreshCw className={`h-4 w-4 mr-1.5 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      <div className="rounded-lg border overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-slate-50">
              <TableHead className="w-44">Timestamp</TableHead>
              <TableHead>User</TableHead>
              <TableHead>Action</TableHead>
              <TableHead>Table / Entity</TableHead>
              <TableHead>IP Address</TableHead>
              <TableHead className="w-8"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-12">
                  <div className="animate-spin h-6 w-6 border-2 border-blue-600 border-t-transparent rounded-full mx-auto" />
                </TableCell>
              </TableRow>
            ) : filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-12 text-muted-foreground">No audit logs found</TableCell>
              </TableRow>
            ) : (
              filtered.map(log => (
                <Fragment key={log.id}>
                  <TableRow
                    className="hover:bg-slate-50/50 cursor-pointer"
                    onClick={() => setExpandedId(expandedId === log.id ? null : log.id)}
                  >
                    <TableCell className="text-xs text-muted-foreground font-mono">
                      {format(new Date(log.created_at), 'dd MMM yy, HH:mm:ss')}
                    </TableCell>
                    <TableCell>
                      {log.profile ? (
                        <div>
                          <div className="text-sm font-medium">{log.profile.full_name || log.profile.email}</div>
                          <div className="text-xs text-muted-foreground capitalize">{log.profile.role}</div>
                        </div>
                      ) : (
                        <span className="text-xs text-muted-foreground">System</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={`text-xs ${ACTION_COLORS[log.action] || 'bg-slate-50 text-slate-600'}`}
                      >
                        {log.action}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {log.table_name ? (
                        <div>
                          <div className="text-sm font-mono">{log.table_name}</div>
                          {log.record_id && (
                            <div className="text-xs text-muted-foreground font-mono truncate max-w-[140px]">{log.record_id}</div>
                          )}
                        </div>
                      ) : '—'}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground font-mono">{log.ip_address || '—'}</TableCell>
                    <TableCell>
                      {(log.old_values || log.new_values) && (
                        expandedId === log.id
                          ? <ChevronUp className="h-4 w-4 text-muted-foreground" />
                          : <ChevronDown className="h-4 w-4 text-muted-foreground" />
                      )}
                    </TableCell>
                  </TableRow>
                  {expandedId === log.id && (log.old_values || log.new_values) && (
                    <TableRow key={`${log.id}-expand`} className="bg-slate-50">
                      <TableCell colSpan={6} className="py-3">
                        <div className="grid grid-cols-2 gap-4 text-xs">
                          {log.old_values && (
                            <div>
                              <div className="font-semibold text-red-600 mb-1">Before</div>
                              <pre className="bg-red-50 rounded p-2 text-red-800 overflow-auto max-h-32 text-xs">
                                {JSON.stringify(log.old_values, null, 2)}
                              </pre>
                            </div>
                          )}
                          {log.new_values && (
                            <div>
                              <div className="font-semibold text-emerald-600 mb-1">After</div>
                              <pre className="bg-emerald-50 rounded p-2 text-emerald-800 overflow-auto max-h-32 text-xs">
                                {JSON.stringify(log.new_values, null, 2)}
                              </pre>
                            </div>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  )}
                </Fragment>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <div className="flex justify-between items-center text-sm text-muted-foreground">
        <span>Showing {filtered.length} of {logs.length} logs (page {page + 1})</span>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" disabled={page === 0} onClick={() => setPage(p => p - 1)}>
            Previous
          </Button>
          <Button variant="outline" size="sm" disabled={logs.length < PAGE_SIZE} onClick={() => setPage(p => p + 1)}>
            Next
          </Button>
        </div>
      </div>
    </div>
  );
}
