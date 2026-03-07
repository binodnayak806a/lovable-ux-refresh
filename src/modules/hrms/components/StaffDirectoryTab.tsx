import { useState } from 'react';
import { format } from 'date-fns';
import { Plus, Edit2, Search, UserCheck, UserX, Building2, Phone, Mail } from 'lucide-react';
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
import { supabase } from '../../../lib/supabase';
import { toast } from 'sonner';
import StaffDialog from './StaffDialog';
import type { Staff, StaffFormData } from '../types';

interface StaffDirectoryTabProps {
  staff: Staff[];
  onRefresh: () => void;
  hospitalId: string;
}

const STATUS_STYLES: Record<string, string> = {
  active: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  on_leave: 'bg-amber-50 text-amber-700 border-amber-200',
  resigned: 'bg-slate-100 text-slate-600 border-slate-200',
  terminated: 'bg-red-50 text-red-700 border-red-200',
};

export default function StaffDirectoryTab({ staff, onRefresh, hospitalId }: StaffDirectoryTabProps) {
  const [search, setSearch] = useState('');
  const [deptFilter, setDeptFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [showDialog, setShowDialog] = useState(false);
  const [editingStaff, setEditingStaff] = useState<Staff | null>(null);

  const departments = Array.from(new Set(staff.map(s => s.department).filter(Boolean))) as string[];

  const filtered = staff.filter(s => {
    const name = `${s.first_name} ${s.last_name} ${s.employee_id}`.toLowerCase();
    const matchSearch = !search || name.includes(search.toLowerCase());
    const matchDept = deptFilter === 'all' || s.department === deptFilter;
    const matchStatus = statusFilter === 'all' || s.status === statusFilter;
    return matchSearch && matchDept && matchStatus;
  });

  const handleSave = async (data: StaffFormData) => {
    try {
      if (editingStaff) {
        const { error } = await supabase.from('staff').update(data as never).eq('id', editingStaff.id);
        if (error) throw error;
        toast.success('Staff updated');
      } else {
        const { error } = await supabase.from('staff').insert(data as never);
        if (error) throw error;
        toast.success('Staff member added');
      }
      setShowDialog(false);
      setEditingStaff(null);
      onRefresh();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to save staff';
      toast.error(msg);
    }
  };

  const openEdit = (s: Staff) => {
    setEditingStaff(s);
    setShowDialog(true);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by name or employee ID..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={deptFilter} onValueChange={setDeptFilter}>
          <SelectTrigger className="w-44"><SelectValue placeholder="Department" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Departments</SelectItem>
            {departments.map(d => <SelectItem key={d} value={d}>{d}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-36"><SelectValue placeholder="Status" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="on_leave">On Leave</SelectItem>
            <SelectItem value="resigned">Resigned</SelectItem>
            <SelectItem value="terminated">Terminated</SelectItem>
          </SelectContent>
        </Select>
        <Button onClick={() => { setEditingStaff(null); setShowDialog(true); }}>
          <Plus className="h-4 w-4 mr-1.5" />
          Add Staff
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map(s => (
          <div key={s.id} className="bg-white rounded-xl border border-slate-200 p-4 hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-3">
                <div className="h-11 w-11 rounded-full bg-gradient-to-br from-sky-400 to-blue-600 flex items-center justify-center text-white font-semibold text-sm">
                  {s.first_name[0]}{s.last_name?.[0] || ''}
                </div>
                <div>
                  <div className="font-semibold text-slate-900">{s.first_name} {s.last_name}</div>
                  <div className="text-xs text-muted-foreground">{s.employee_id}</div>
                </div>
              </div>
              <Button size="sm" variant="ghost" className="h-7 w-7 p-0" onClick={() => openEdit(s)}>
                <Edit2 className="h-3.5 w-3.5" />
              </Button>
            </div>

            <div className="space-y-1.5 text-sm">
              {s.designation && (
                <div className="flex items-center gap-2 text-muted-foreground">
                  <UserCheck className="h-3.5 w-3.5 flex-shrink-0" />
                  <span>{s.designation}</span>
                </div>
              )}
              {s.department && (
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Building2 className="h-3.5 w-3.5 flex-shrink-0" />
                  <span>{s.department}</span>
                </div>
              )}
              {s.phone && (
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Phone className="h-3.5 w-3.5 flex-shrink-0" />
                  <span>{s.phone}</span>
                </div>
              )}
              {s.email && (
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Mail className="h-3.5 w-3.5 flex-shrink-0" />
                  <span className="truncate">{s.email}</span>
                </div>
              )}
            </div>

            <div className="flex items-center justify-between mt-3 pt-3 border-t border-slate-100">
              <Badge variant="outline" className={`text-xs ${STATUS_STYLES[s.status] || ''}`}>
                {s.status === 'on_leave' ? 'On Leave' : s.status.charAt(0).toUpperCase() + s.status.slice(1)}
              </Badge>
              <span className="text-xs text-muted-foreground">
                Joined {format(new Date(s.date_of_joining), 'MMM yyyy')}
              </span>
            </div>
          </div>
        ))}

        {filtered.length === 0 && (
          <div className="col-span-3 py-16 text-center text-muted-foreground">
            <UserX className="h-10 w-10 mx-auto mb-3 opacity-30" />
            <p className="font-medium">No staff members found</p>
            <p className="text-sm mt-1">Try adjusting your filters or add a new staff member.</p>
          </div>
        )}
      </div>

      <StaffDialog
        open={showDialog}
        onClose={() => { setShowDialog(false); setEditingStaff(null); }}
        onSave={handleSave}
        staff={editingStaff}
        hospitalId={hospitalId}
      />
    </div>
  );
}
