import { useState, useEffect } from 'react';
import { X, Save, ShieldCheck } from 'lucide-react';
import { Button } from '../../../components/ui/button';
import { Input } from '../../../components/ui/input';
import { Label } from '../../../components/ui/label';
import { Checkbox } from '../../../components/ui/checkbox';
import { Badge } from '../../../components/ui/badge';
import { ScrollArea } from '../../../components/ui/scroll-area';
import { Separator } from '../../../components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../../components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../../../components/ui/select';
import { Switch } from '../../../components/ui/switch';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../../../components/ui/dialog';
import type { UserRole } from '../../../types/database';
import {
  ADMIN_ALL_MODULES,
  DEFAULT_ROLE_PERMISSIONS,
  type ModuleCrud,
  type ModulePermissions,
} from '../AdminPage';

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

interface UserDialogProps {
  open: boolean;
  onClose: () => void;
  onSave: (data: {
    full_name: string;
    role: UserRole;
    department: string | null;
    designation: string | null;
    phone: string | null;
    is_active: boolean;
    permissions_override?: ModulePermissions | null;
  }) => Promise<void>;
  user?: ProfileRow | null;
  userPermissions?: ModulePermissions | null;
}

const ROLES: UserRole[] = ['superadmin', 'admin', 'doctor', 'nurse', 'billing', 'pharmacist', 'lab_technician', 'receptionist'];
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

const CRUD_KEYS: (keyof ModuleCrud)[] = ['create', 'read', 'update', 'delete'];
const CRUD_LABELS: Record<keyof ModuleCrud, string> = { create: 'Create', read: 'Read', update: 'Update', delete: 'Delete' };
const CRUD_COLORS: Record<keyof ModuleCrud, string> = {
  create: 'text-emerald-600',
  read: 'text-blue-600',
  update: 'text-amber-600',
  delete: 'text-rose-600',
};

function allFalse(): ModuleCrud {
  return { create: false, read: false, update: false, delete: false };
}

function allTrue(): ModuleCrud {
  return { create: true, read: true, update: true, delete: true };
}

export default function UserDialog({ open, onClose, onSave, user, userPermissions }: UserDialogProps) {
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    full_name: '',
    role: 'receptionist' as UserRole,
    department: '',
    designation: '',
    phone: '',
    is_active: true,
  });
  const [hasCustomPermissions, setHasCustomPermissions] = useState(false);
  const [customPermissions, setCustomPermissions] = useState<ModulePermissions>({});

  useEffect(() => {
    if (user) {
      setForm({
        full_name: user.full_name || '',
        role: user.role,
        department: user.department || '',
        designation: user.designation || '',
        phone: user.phone || '',
        is_active: user.is_active,
      });
      if (userPermissions) {
        setHasCustomPermissions(true);
        setCustomPermissions(userPermissions);
      } else {
        setHasCustomPermissions(false);
        setCustomPermissions(DEFAULT_ROLE_PERMISSIONS[user.role] || {});
      }
    }
  }, [user, userPermissions]);

  // When role changes, reset custom permissions to that role's defaults
  useEffect(() => {
    if (!hasCustomPermissions) {
      setCustomPermissions(DEFAULT_ROLE_PERMISSIONS[form.role] || {});
    }
  }, [form.role, hasCustomPermissions]);

  const set = (field: string, value: string | boolean) => setForm(prev => ({ ...prev, [field]: value }));

  const togglePermission = (moduleKey: string, action: keyof ModuleCrud) => {
    setCustomPermissions(prev => {
      const mod = { ...(prev[moduleKey] || allFalse()) };
      mod[action] = !mod[action];
      return { ...prev, [moduleKey]: mod };
    });
  };

  const toggleAllModule = (moduleKey: string) => {
    setCustomPermissions(prev => {
      const current = prev[moduleKey] || allFalse();
      const allChecked = CRUD_KEYS.every(k => current[k]);
      return { ...prev, [moduleKey]: allChecked ? allFalse() : allTrue() };
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await onSave({
        full_name: form.full_name,
        role: form.role,
        department: form.department || null,
        designation: form.designation || null,
        phone: form.phone || null,
        is_active: form.is_active,
        permissions_override: hasCustomPermissions ? customPermissions : null,
      });
    } finally {
      setSaving(false);
    }
  };

  const roleDefaults = DEFAULT_ROLE_PERMISSIONS[form.role] || {};

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            Edit User
            {user && <Badge variant="outline" className="text-xs">{user.email}</Badge>}
          </DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="info" className="flex-1 min-h-0 flex flex-col">
          <TabsList className="bg-muted/50 w-fit">
            <TabsTrigger value="info">Basic Info</TabsTrigger>
            <TabsTrigger value="permissions" className="gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5" />
              Permissions
            </TabsTrigger>
          </TabsList>

          <form onSubmit={handleSubmit} className="flex-1 min-h-0 flex flex-col">
            <TabsContent value="info" className="mt-4 space-y-4">
              <div className="space-y-1.5">
                <Label>Full Name</Label>
                <Input value={form.full_name} onChange={e => set('full_name', e.target.value)} required />
              </div>
              <div className="space-y-1.5">
                <Label>Role</Label>
                <Select value={form.role} onValueChange={v => set('role', v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {ROLES.map(r => <SelectItem key={r} value={r}>{ROLE_LABELS[r]}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label>Department</Label>
                  <Input value={form.department} onChange={e => set('department', e.target.value)} />
                </div>
                <div className="space-y-1.5">
                  <Label>Designation</Label>
                  <Input value={form.designation} onChange={e => set('designation', e.target.value)} />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label>Phone</Label>
                <Input value={form.phone} onChange={e => set('phone', e.target.value)} />
              </div>
              <div className="flex items-center justify-between py-2 border-t border-border">
                <div>
                  <Label>Active</Label>
                  <p className="text-xs text-muted-foreground">User can login and access the system</p>
                </div>
                <Switch checked={form.is_active} onCheckedChange={v => set('is_active', v)} />
              </div>
            </TabsContent>

            <TabsContent value="permissions" className="mt-4 flex-1 min-h-0 flex flex-col space-y-3">
              {/* Override toggle */}
              <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg border border-border">
                <div>
                  <p className="text-sm font-medium text-foreground">Custom Permission Override</p>
                  <p className="text-xs text-muted-foreground">
                    {hasCustomPermissions
                      ? 'This user has custom permissions that override the role defaults'
                      : `Using default permissions for ${ROLE_LABELS[form.role]}`}
                  </p>
                </div>
                <Switch checked={hasCustomPermissions} onCheckedChange={setHasCustomPermissions} />
              </div>

              {/* CRUD Matrix */}
              <ScrollArea className="flex-1 border border-border rounded-lg">
                <table className="w-full text-xs">
                  <thead className="sticky top-0 z-10">
                    <tr className="bg-muted/50 border-b border-border">
                      <th className="text-left px-3 py-2 font-semibold text-foreground">Module</th>
                      <th className="px-1 py-2 w-8 text-center font-semibold text-muted-foreground">All</th>
                      {CRUD_KEYS.map(k => (
                        <th key={k} className={`px-1 py-2 w-14 text-center font-bold ${CRUD_COLORS[k]}`}>
                          {CRUD_LABELS[k]}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {ADMIN_ALL_MODULES.map((mod, i) => {
                      const mp = hasCustomPermissions
                        ? (customPermissions[mod.key] || allFalse())
                        : (roleDefaults[mod.key] || allFalse());
                      const enabledCount = CRUD_KEYS.filter(k => mp[k]).length;
                      const isAll = enabledCount === 4;
                      const isPartial = enabledCount > 0 && enabledCount < 4;

                      return (
                        <tr
                          key={mod.key}
                          className={`border-b border-border/40 ${i % 2 === 0 ? '' : 'bg-muted/10'} ${!hasCustomPermissions ? 'opacity-60' : 'hover:bg-muted/20'}`}
                        >
                          <td className="px-3 py-2 font-medium text-foreground">{mod.label}</td>
                          <td className="px-1 py-2 text-center">
                            <Checkbox
                              checked={isAll ? true : isPartial ? 'indeterminate' : false}
                              onCheckedChange={() => hasCustomPermissions && toggleAllModule(mod.key)}
                              disabled={!hasCustomPermissions}
                              className="mx-auto"
                            />
                          </td>
                          {CRUD_KEYS.map(k => (
                            <td key={k} className="px-1 py-2 text-center">
                              <Checkbox
                                checked={mp[k]}
                                onCheckedChange={() => hasCustomPermissions && togglePermission(mod.key, k)}
                                disabled={!hasCustomPermissions}
                                className="mx-auto"
                              />
                            </td>
                          ))}
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </ScrollArea>
            </TabsContent>

            <Separator className="my-3" />
            <div className="flex justify-end gap-2 pb-1">
              <Button type="button" variant="outline" onClick={onClose}>
                <X className="h-4 w-4 mr-1" />Cancel
              </Button>
              <Button type="submit" disabled={saving}>
                <Save className="h-4 w-4 mr-1" />{saving ? 'Saving...' : 'Save Changes'}
              </Button>
            </div>
          </form>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
