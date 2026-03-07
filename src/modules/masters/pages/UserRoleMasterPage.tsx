import { useState, useEffect, useCallback } from 'react';
import { Loader2, ShieldCheck, Users } from 'lucide-react';
import { Button } from '../../../components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../../../components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../../components/ui/select';
import { Switch } from '../../../components/ui/switch';
import { Badge } from '../../../components/ui/badge';
import { useHospitalId } from '../../../hooks/useHospitalId';
import { useToast } from '../../../hooks/useToast';
import { mastersService } from '../../../services/masters.service';
import MasterPageShell from '../components/MasterPageShell';
import MasterTable, { StatusBadge } from '../components/MasterTable';
import { exportToCSV } from '../utils/csv';
import type { UserRole } from '../types';
import { SYSTEM_ROLES, MODULE_PERMISSIONS } from '../types';

const EMPTY: Partial<UserRole> = {
  user_id: null, role_name: '', permissions: {}, is_active: true,
};

export default function UserRoleMasterPage() {
  const hospitalId = useHospitalId();
  const { toast } = useToast();
  const [data, setData] = useState<UserRole[]>([]);
  const [profiles, setProfiles] = useState<{ id: string; full_name: string; email: string; role: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [formOpen, setFormOpen] = useState(false);
  const [form, setForm] = useState<Partial<UserRole>>(EMPTY);
  const [editId, setEditId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<UserRole | null>(null);
  const [deleting, setDeleting] = useState(false);

  const load = useCallback(async () => {
    try {
      const [roles, profs] = await Promise.all([
        mastersService.getUserRoles(hospitalId),
        mastersService.getProfiles(hospitalId),
      ]);
      setData(roles);
      setProfiles(profs);
    } catch { toast('Error', { type: 'error' }); }
    finally { setLoading(false); }
  }, [hospitalId]);

  useEffect(() => { load(); }, [load]);

  const openAdd = () => { setForm({ ...EMPTY }); setEditId(null); setFormOpen(true); };
  const openEdit = (d: UserRole) => { setForm({ ...d }); setEditId(d.id); setFormOpen(true); };

  const handleSave = async () => {
    if (!form.role_name?.trim()) { toast('Select a role', { type: 'error' }); return; }
    setSaving(true);
    try {
      await mastersService.upsertUserRole(hospitalId, form, editId || undefined);
      toast(editId ? 'Updated' : 'Added', { type: 'success' }); setFormOpen(false); load();
    } catch { toast('Error', { type: 'error' }); } finally { setSaving(false); }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await mastersService.deleteUserRole(deleteTarget.id);
      toast('Deleted', { type: 'success' }); setDeleteTarget(null); load();
    } catch { toast('Error', { type: 'error' }); } finally { setDeleting(false); }
  };

  const togglePermission = (module: string) => {
    const perms = { ...(form.permissions || {}) };
    perms[module] = !perms[module];
    setForm({ ...form, permissions: perms });
  };

  const isCustomRole = form.role_name === 'Custom';

  const setAllPermissions = (val: boolean) => {
    const perms: Record<string, boolean> = {};
    MODULE_PERMISSIONS.forEach(m => { perms[m] = val; });
    setForm({ ...form, permissions: perms });
  };

  const displayName = (d: UserRole) => {
    if (d.profile) return d.profile.full_name;
    return d.user_id ? 'Unknown User' : 'Unassigned';
  };

  return (
    <MasterPageShell
      title="Users & Roles" count={data.length} loading={loading}
      search={search} onSearchChange={setSearch} onAdd={openAdd}
      onExport={() => exportToCSV(data.map(d => ({
        ...d,
        user_name: displayName(d),
        user_email: d.profile?.email || '',
        permissions_list: Object.entries(d.permissions).filter(([, v]) => v).map(([k]) => k).join('; '),
      })) as never[], 'user-roles', [
        { key: 'user_name', label: 'User' }, { key: 'user_email', label: 'Email' },
        { key: 'role_name', label: 'Role' }, { key: 'permissions_list', label: 'Permissions' },
      ])}
      deleteOpen={!!deleteTarget} deleteName={deleteTarget ? `${deleteTarget.role_name} - ${displayName(deleteTarget)}` : ''}
      onDeleteConfirm={handleDelete} onDeleteCancel={() => setDeleteTarget(null)} deleting={deleting}
    >
      <MasterTable
        data={data}
        columns={[
          { key: 'profile', label: 'User', sortable: true, render: d => (
            <div>
              <span className="font-medium">{displayName(d)}</span>
              {d.profile?.email && <span className="text-xs text-gray-400 ml-2">{d.profile.email}</span>}
            </div>
          )},
          { key: 'role_name', label: 'Role', sortable: true, render: d => (
            <Badge className={
              d.role_name === 'Super Admin' ? 'bg-red-50 text-red-700 border-red-200' :
              d.role_name === 'Admin' ? 'bg-amber-50 text-amber-700 border-amber-200' :
              d.role_name === 'Doctor' ? 'bg-blue-50 text-blue-700 border-blue-200' :
              'bg-gray-100 text-gray-600 border-gray-200'
            }>
              <ShieldCheck className="w-3 h-3 mr-1" />
              {d.role_name}
            </Badge>
          )},
          { key: 'permissions', label: 'Modules', render: d => {
            const active = Object.entries(d.permissions).filter(([, v]) => v).map(([k]) => k);
            if (d.role_name === 'Super Admin' || d.role_name === 'Admin') return <span className="text-xs text-gray-500">All Modules</span>;
            return (
              <div className="flex flex-wrap gap-1">
                {active.slice(0, 4).map(m => (
                  <Badge key={m} variant="outline" className="text-[10px]">{m}</Badge>
                ))}
                {active.length > 4 && <Badge variant="outline" className="text-[10px]">+{active.length - 4}</Badge>}
              </div>
            );
          }},
          { key: 'is_active', label: 'Status', width: '80px', render: d => <StatusBadge active={d.is_active} /> },
        ]}
        search={search} searchKeys={['role_name']}
        getRowKey={d => d.id} onEdit={openEdit} onDelete={setDeleteTarget}
      />

      <Dialog open={formOpen} onOpenChange={o => !o && setFormOpen(false)}>
        <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
          <DialogHeader><DialogTitle>{editId ? 'Edit Role Assignment' : 'Assign Role'}</DialogTitle></DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <label className="text-xs text-gray-500 uppercase tracking-wide block mb-1.5">User</label>
              <Select value={form.user_id || '_none'} onValueChange={v => setForm({ ...form, user_id: v === '_none' ? null : v })}>
                <SelectTrigger><SelectValue placeholder="Select user..." /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="_none">Unassigned</SelectItem>
                  {profiles.map(p => (
                    <SelectItem key={p.id} value={p.id}>
                      <div className="flex items-center gap-2">
                        <Users className="w-3.5 h-3.5 text-gray-400" />
                        <span>{p.full_name}</span>
                        <span className="text-xs text-gray-400">{p.email}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-xs text-gray-500 uppercase tracking-wide block mb-1.5">Role *</label>
              <Select value={form.role_name || ''} onValueChange={v => {
                const newForm = { ...form, role_name: v };
                if (v === 'Super Admin' || v === 'Admin') {
                  const perms: Record<string, boolean> = {};
                  MODULE_PERMISSIONS.forEach(m => { perms[m] = true; });
                  newForm.permissions = perms;
                }
                setForm(newForm);
              }}>
                <SelectTrigger><SelectValue placeholder="Select role..." /></SelectTrigger>
                <SelectContent>
                  {SYSTEM_ROLES.map(r => <SelectItem key={r} value={r}>{r}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>

            {(isCustomRole || form.role_name === 'Doctor' || form.role_name === 'Receptionist' || form.role_name === 'Lab Technician' || form.role_name === 'Pharmacist' || form.role_name === 'Nurse') && (
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs text-gray-500 uppercase tracking-wide">Module Permissions</label>
                  <div className="flex gap-2">
                    <button onClick={() => setAllPermissions(true)} className="text-xs text-blue-600 hover:underline">All</button>
                    <button onClick={() => setAllPermissions(false)} className="text-xs text-gray-400 hover:underline">None</button>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  {MODULE_PERMISSIONS.map(mod => (
                    <div key={mod} className="flex items-center justify-between py-1.5 px-3 rounded-lg border border-gray-100 hover:border-gray-200 transition-colors">
                      <span className="text-sm text-gray-700">{mod}</span>
                      <Switch
                        checked={!!form.permissions?.[mod]}
                        onCheckedChange={() => togglePermission(mod)}
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {(form.role_name === 'Super Admin' || form.role_name === 'Admin') && (
              <div className="p-3 rounded-lg bg-amber-50 border border-amber-200">
                <p className="text-xs text-amber-700">
                  {form.role_name} has access to all modules by default.
                </p>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setFormOpen(false)}>Cancel</Button>
            <Button onClick={handleSave} disabled={saving} className="bg-blue-600 hover:bg-blue-700">
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : editId ? 'Update' : 'Assign'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </MasterPageShell>
  );
}
