import { useState, useEffect, useCallback } from 'react';
import { format } from 'date-fns';
import { Search, Edit2, UserCheck, UserX, Shield } from 'lucide-react';
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
import { toast } from 'sonner';
import UserDialog from './UserDialog';
import type { UserRole } from '../../../types/database';

interface ProfileRow {
  id: string;
  email: string;
  full_name: string;
  role: UserRole;
  department: string | null;
  designation: string | null;
  phone: string | null;
  is_active: boolean;
  hospital_id: string | null;
  created_at: string;
  updated_at: string;
  avatar_url: string | null;
}

const ROLE_LABELS: Record<UserRole, string> = {
  superadmin: 'Super Admin',
  admin: 'Admin',
  doctor: 'Doctor',
  nurse: 'Nurse',
  billing: 'Billing Staff',
  pharmacist: 'Pharmacist',
  lab_technician: 'Lab Technician',
  receptionist: 'Receptionist',
};

const ROLE_COLORS: Record<UserRole, string> = {
  superadmin: 'bg-rose-50 text-rose-700 border-rose-200',
  admin: 'bg-blue-50 text-blue-700 border-blue-200',
  doctor: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  nurse: 'bg-teal-50 text-teal-700 border-teal-200',
  billing: 'bg-amber-50 text-amber-700 border-amber-200',
  pharmacist: 'bg-purple-50 text-purple-700 border-purple-200',
  lab_technician: 'bg-cyan-50 text-cyan-700 border-cyan-200',
  receptionist: 'bg-slate-50 text-slate-700 border-slate-200',
};

interface UserManagementTabProps {
  hospitalId: string;
}

export default function UserManagementTab({ hospitalId }: UserManagementTabProps) {
  const [users, setUsers] = useState<ProfileRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [editingUser, setEditingUser] = useState<ProfileRow | null>(null);

  const fetchUsers = useCallback(async () => {
    try {
      const { data } = await supabase
        .from('profiles')
        .select('*')
        .eq('hospital_id', hospitalId)
        .order('created_at', { ascending: false });
      if (data) setUsers(data as ProfileRow[]);
    } catch {
      toast.error('Failed to load users');
    } finally {
      setLoading(false);
    }
  }, [hospitalId]);

  useEffect(() => { fetchUsers(); }, [fetchUsers]);

  const filtered = users.filter(u => {
    const name = `${u.full_name} ${u.email}`.toLowerCase();
    const matchSearch = !search || name.includes(search.toLowerCase());
    const matchRole = roleFilter === 'all' || u.role === roleFilter;
    return matchSearch && matchRole;
  });

  const handleSave = async (data: {
    full_name: string;
    role: UserRole;
    department: string | null;
    designation: string | null;
    phone: string | null;
    is_active: boolean;
  }) => {
    if (!editingUser) return;
    const { error } = await supabase.from('profiles').update({ ...data, updated_at: new Date().toISOString() } as never).eq('id', editingUser.id);
    if (error) { toast.error('Failed to update user'); return; }
    toast.success('User updated');
    setEditingUser(null);
    fetchUsers();
  };

  const toggleActive = async (user: ProfileRow) => {
    const { error } = await supabase
      .from('profiles')
      .update({ is_active: !user.is_active, updated_at: new Date().toISOString() } as never)
      .eq('id', user.id);
    if (error) { toast.error('Failed to update user status'); return; }
    toast.success(user.is_active ? 'User deactivated' : 'User activated');
    fetchUsers();
  };

  const activeCount = users.filter(u => u.is_active).length;

  if (loading) {
    return <div className="flex justify-center py-12"><div className="animate-spin h-6 w-6 border-2 border-blue-600 border-t-transparent rounded-full" /></div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4 flex-wrap">
        <div className="flex gap-3">
          <div className="text-center px-4 py-2 bg-blue-50 rounded-lg border border-blue-200">
            <div className="text-2xl font-bold text-blue-700">{users.length}</div>
            <div className="text-xs text-blue-600">Total Users</div>
          </div>
          <div className="text-center px-4 py-2 bg-emerald-50 rounded-lg border border-emerald-200">
            <div className="text-2xl font-bold text-emerald-700">{activeCount}</div>
            <div className="text-xs text-emerald-600">Active</div>
          </div>
          <div className="text-center px-4 py-2 bg-slate-50 rounded-lg border border-slate-200">
            <div className="text-2xl font-bold text-slate-700">{users.length - activeCount}</div>
            <div className="text-xs text-slate-600">Inactive</div>
          </div>
        </div>
        <div className="flex gap-2 ml-auto">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Search users..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9 w-56" />
          </div>
          <Select value={roleFilter} onValueChange={setRoleFilter}>
            <SelectTrigger className="w-40"><SelectValue placeholder="All Roles" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Roles</SelectItem>
              {Object.entries(ROLE_LABELS).map(([role, label]) => (
                <SelectItem key={role} value={role}>{label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="rounded-lg border overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-slate-50">
              <TableHead>User</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Department</TableHead>
              <TableHead>Phone</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Joined</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map(u => (
              <TableRow key={u.id} className="hover:bg-slate-50/50">
                <TableCell>
                  <div className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded-full bg-gradient-to-br from-slate-400 to-slate-600 flex items-center justify-center text-white text-xs font-semibold flex-shrink-0">
                      {(u.full_name || u.email || '?')[0].toUpperCase()}
                    </div>
                    <div>
                      <div className="font-medium text-sm">{u.full_name || '—'}</div>
                      <div className="text-xs text-muted-foreground">{u.email}</div>
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  <Badge variant="outline" className={`text-xs ${ROLE_COLORS[u.role] || ''}`}>
                    <Shield className="h-3 w-3 mr-1" />
                    {ROLE_LABELS[u.role] || u.role}
                  </Badge>
                </TableCell>
                <TableCell className="text-sm text-muted-foreground">{u.department || '—'}</TableCell>
                <TableCell className="text-sm text-muted-foreground">{u.phone || '—'}</TableCell>
                <TableCell>
                  <Badge
                    variant="outline"
                    className={u.is_active ? 'bg-emerald-50 text-emerald-700 border-emerald-200 text-xs' : 'bg-slate-50 text-slate-500 border-slate-200 text-xs'}
                  >
                    {u.is_active ? 'Active' : 'Inactive'}
                  </Badge>
                </TableCell>
                <TableCell className="text-sm text-muted-foreground">
                  {format(new Date(u.created_at), 'dd MMM yyyy')}
                </TableCell>
                <TableCell>
                  <div className="flex gap-1">
                    <Button size="sm" variant="ghost" className="h-7 w-7 p-0" onClick={() => setEditingUser(u)}>
                      <Edit2 className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      className={`h-7 w-7 p-0 ${u.is_active ? 'text-amber-600 hover:text-amber-700' : 'text-emerald-600 hover:text-emerald-700'}`}
                      onClick={() => toggleActive(u)}
                    >
                      {u.is_active ? <UserX className="h-3.5 w-3.5" /> : <UserCheck className="h-3.5 w-3.5" />}
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
            {filtered.length === 0 && (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-12 text-muted-foreground">No users found</TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {editingUser && (
        <UserDialog
          open={!!editingUser}
          onClose={() => setEditingUser(null)}
          onSave={handleSave}
          user={editingUser}
        />
      )}
    </div>
  );
}
