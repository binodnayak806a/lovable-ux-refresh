import { useState, useEffect } from 'react';
import { Users, ClipboardList, ShieldCheck, Save, Loader2, RotateCcw, Check, Minus } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../components/ui/tabs';
import { usePageTitle } from '../../hooks/usePageTitle';
import PageHeader from '../../components/shared/PageHeader';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { Checkbox } from '../../components/ui/checkbox';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '../../components/ui/tooltip';
import { ScrollArea } from '../../components/ui/scroll-area';
import { useAuth } from '../../hooks/useAuth';
import { supabase } from '../../lib/supabase';
import { toast } from 'sonner';
import UserManagementTab from './components/UserManagementTab';
import AuditLogsTab from './components/AuditLogsTab';

const SAMPLE_HOSPITAL_ID = '11111111-1111-1111-1111-111111111111';

export interface ModuleCrud {
  create: boolean;
  read: boolean;
  update: boolean;
  delete: boolean;
}

export type ModulePermissions = Record<string, ModuleCrud>;

const ALL_MODULES = [
  { key: 'dashboard', label: 'Dashboard' },
  { key: 'patients', label: 'Patients' },
  { key: 'opd', label: 'OPD' },
  { key: 'ipd', label: 'IPD' },
  { key: 'billing', label: 'Billing' },
  { key: 'appointments', label: 'Appointments' },
  { key: 'consultation', label: 'Consultation' },
  { key: 'prescription', label: 'Prescription' },
  { key: 'vitals', label: 'Vitals' },
  { key: 'lab', label: 'Laboratory' },
  { key: 'pharmacy', label: 'Pharmacy' },
  { key: 'ambulance', label: 'Ambulance' },
  { key: 'emergency', label: 'Emergency' },
  { key: 'reports', label: 'Reports' },
  { key: 'analytics', label: 'Analytics' },
  { key: 'master_data', label: 'Master Data' },
  { key: 'hrms', label: 'HRMS' },
  { key: 'admin', label: 'Admin' },
  { key: 'settings', label: 'Settings' },
  { key: 'notifications', label: 'Notifications' },
  { key: 'cash_bank', label: 'Cash & Bank' },
  { key: 'doctor_queue', label: 'Doctor Queue' },
];

const CRUD_KEYS: (keyof ModuleCrud)[] = ['create', 'read', 'update', 'delete'];
const CRUD_LABELS: Record<keyof ModuleCrud, string> = { create: 'C', read: 'R', update: 'U', delete: 'D' };
const CRUD_FULL_LABELS: Record<keyof ModuleCrud, string> = { create: 'Create', read: 'Read', update: 'Update', delete: 'Delete' };
const CRUD_COLORS: Record<keyof ModuleCrud, string> = {
  create: 'text-emerald-600',
  read: 'text-blue-600',
  update: 'text-amber-600',
  delete: 'text-rose-600',
};

const ROLES = [
  { key: 'superadmin', label: 'Super Admin' },
  { key: 'admin', label: 'Admin' },
  { key: 'doctor', label: 'Doctor' },
  { key: 'nurse', label: 'Nurse' },
  { key: 'billing', label: 'Billing Staff' },
  { key: 'pharmacist', label: 'Pharmacist' },
  { key: 'lab_technician', label: 'Lab Technician' },
  { key: 'receptionist', label: 'Receptionist' },
];

function allTrue(): ModuleCrud {
  return { create: true, read: true, update: true, delete: true };
}

function allFalse(): ModuleCrud {
  return { create: false, read: false, update: false, delete: false };
}

function readOnly(): ModuleCrud {
  return { create: false, read: true, update: false, delete: false };
}

function createRead(): ModuleCrud {
  return { create: true, read: true, update: false, delete: false };
}

function crudExceptDelete(): ModuleCrud {
  return { create: true, read: true, update: true, delete: false };
}

export const DEFAULT_ROLE_PERMISSIONS: Record<string, ModulePermissions> = {
  superadmin: Object.fromEntries(ALL_MODULES.map(m => [m.key, allTrue()])),
  admin: Object.fromEntries(ALL_MODULES.map(m => [m.key, allTrue()])),
  doctor: Object.fromEntries(ALL_MODULES.map(m => {
    if (['dashboard', 'notifications'].includes(m.key)) return [m.key, readOnly()];
    if (['patients', 'opd', 'ipd', 'consultation', 'prescription', 'vitals', 'appointments', 'doctor_queue'].includes(m.key)) return [m.key, crudExceptDelete()];
    if (['lab', 'emergency'].includes(m.key)) return [m.key, createRead()];
    return [m.key, allFalse()];
  })),
  nurse: Object.fromEntries(ALL_MODULES.map(m => {
    if (['dashboard', 'notifications'].includes(m.key)) return [m.key, readOnly()];
    if (['patients', 'ipd', 'vitals', 'emergency'].includes(m.key)) return [m.key, crudExceptDelete()];
    if (['opd', 'appointments'].includes(m.key)) return [m.key, readOnly()];
    return [m.key, allFalse()];
  })),
  billing: Object.fromEntries(ALL_MODULES.map(m => {
    if (['dashboard', 'notifications'].includes(m.key)) return [m.key, readOnly()];
    if (['billing', 'cash_bank'].includes(m.key)) return [m.key, allTrue()];
    if (['patients', 'appointments', 'reports', 'analytics'].includes(m.key)) return [m.key, readOnly()];
    if (['pharmacy'].includes(m.key)) return [m.key, createRead()];
    return [m.key, allFalse()];
  })),
  pharmacist: Object.fromEntries(ALL_MODULES.map(m => {
    if (['dashboard', 'notifications'].includes(m.key)) return [m.key, readOnly()];
    if (['pharmacy'].includes(m.key)) return [m.key, allTrue()];
    if (['prescription'].includes(m.key)) return [m.key, readOnly()];
    return [m.key, allFalse()];
  })),
  lab_technician: Object.fromEntries(ALL_MODULES.map(m => {
    if (['dashboard', 'notifications'].includes(m.key)) return [m.key, readOnly()];
    if (['lab'].includes(m.key)) return [m.key, crudExceptDelete()];
    return [m.key, allFalse()];
  })),
  receptionist: Object.fromEntries(ALL_MODULES.map(m => {
    if (['dashboard', 'notifications'].includes(m.key)) return [m.key, readOnly()];
    if (['patients', 'appointments', 'opd'].includes(m.key)) return [m.key, crudExceptDelete()];
    if (['billing'].includes(m.key)) return [m.key, createRead()];
    return [m.key, allFalse()];
  })),
};

export { ALL_MODULES as ADMIN_ALL_MODULES };

export default function AdminPage() {
  usePageTitle('Administration');
  const { hospitalId } = useAuth();
  const effectiveHospitalId = hospitalId ?? SAMPLE_HOSPITAL_ID;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Administration"
        subtitle="Manage system users, roles, and review the activity audit trail"
        icon={ShieldCheck}
      />

      <div className="bg-card rounded-xl border border-border overflow-hidden">
        <Tabs defaultValue="users">
          <div className="border-b border-border px-6 pt-4">
            <TabsList className="bg-transparent p-0 h-auto gap-1">
              <TabsTrigger
                value="users"
                className="flex items-center gap-2 px-4 py-2 rounded-lg data-[state=active]:bg-accent data-[state=active]:text-accent-foreground text-muted-foreground font-medium"
              >
                <Users className="h-4 w-4" />
                User Management
              </TabsTrigger>
              <TabsTrigger
                value="audit"
                className="flex items-center gap-2 px-4 py-2 rounded-lg data-[state=active]:bg-accent data-[state=active]:text-accent-foreground text-muted-foreground font-medium"
              >
                <ClipboardList className="h-4 w-4" />
                Audit Logs
              </TabsTrigger>
              <TabsTrigger
                value="rbac"
                className="flex items-center gap-2 px-4 py-2 rounded-lg data-[state=active]:bg-accent data-[state=active]:text-accent-foreground text-muted-foreground font-medium"
              >
                <ShieldCheck className="h-4 w-4" />
                Role Permissions
              </TabsTrigger>
            </TabsList>
          </div>

          <div className="p-6">
            <TabsContent value="users" className="mt-0">
              <UserManagementTab hospitalId={effectiveHospitalId} />
            </TabsContent>
            <TabsContent value="audit" className="mt-0">
              <AuditLogsTab hospitalId={effectiveHospitalId} />
            </TabsContent>
            <TabsContent value="rbac" className="mt-0">
              <RBACPanel hospitalId={effectiveHospitalId} />
            </TabsContent>
          </div>
        </Tabs>
      </div>
    </div>
  );
}

function RBACPanel({ hospitalId }: { hospitalId: string }) {
  const [permissions, setPermissions] = useState<Record<string, ModulePermissions>>(DEFAULT_ROLE_PERMISSIONS);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [selectedRole, setSelectedRole] = useState(ROLES[0].key);
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    loadPermissions();
  }, [hospitalId]);

  const loadPermissions = async () => {
    setLoading(true);
    try {
      const { data } = await supabase
        .from('system_settings')
        .select('setting_value')
        .eq('hospital_id', hospitalId)
        .eq('setting_key', 'role_crud_permissions')
        .maybeSingle();

      const row = data as { setting_value: unknown } | null;
      if (row?.setting_value) {
        const parsed = typeof row.setting_value === 'string'
          ? JSON.parse(row.setting_value)
          : row.setting_value;
        setPermissions({ ...DEFAULT_ROLE_PERMISSIONS, ...parsed });
      }
    } catch {
      // fall back to defaults silently
    } finally {
      setLoading(false);
    }
  };

  const handleToggle = (moduleKey: string, action: keyof ModuleCrud) => {
    setPermissions(prev => {
      const rolePerm = { ...prev[selectedRole] };
      const modulePerm = { ...(rolePerm[moduleKey] || allFalse()) };
      modulePerm[action] = !modulePerm[action];
      rolePerm[moduleKey] = modulePerm;
      return { ...prev, [selectedRole]: rolePerm };
    });
    setHasChanges(true);
  };

  const toggleAllForModule = (moduleKey: string) => {
    setPermissions(prev => {
      const rolePerm = { ...prev[selectedRole] };
      const current = rolePerm[moduleKey] || allFalse();
      const allChecked = CRUD_KEYS.every(k => current[k]);
      rolePerm[moduleKey] = allChecked ? allFalse() : allTrue();
      return { ...prev, [selectedRole]: rolePerm };
    });
    setHasChanges(true);
  };

  const toggleAllForAction = (action: keyof ModuleCrud) => {
    setPermissions(prev => {
      const rolePerm = { ...prev[selectedRole] };
      const allChecked = ALL_MODULES.every(m => (rolePerm[m.key] || allFalse())[action]);
      ALL_MODULES.forEach(m => {
        const mod = { ...(rolePerm[m.key] || allFalse()) };
        mod[action] = !allChecked;
        rolePerm[m.key] = mod;
      });
      return { ...prev, [selectedRole]: rolePerm };
    });
    setHasChanges(true);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const { error } = await supabase
        .from('system_settings')
        .upsert({
          hospital_id: hospitalId,
          setting_key: 'role_crud_permissions',
          setting_value: JSON.stringify(permissions),
          updated_at: new Date().toISOString(),
        } as never, { onConflict: 'hospital_id,setting_key' });

      if (error) throw error;
      setHasChanges(false);
      toast.success('CRUD permissions saved successfully');
    } catch {
      toast.error('Failed to save permissions');
    } finally {
      setSaving(false);
    }
  };

  const handleReset = () => {
    setPermissions(DEFAULT_ROLE_PERMISSIONS);
    setHasChanges(true);
  };

  const rolePerm = permissions[selectedRole] || {};

  // Count enabled permissions for badge
  const countEnabled = (roleKey: string) => {
    const rp = permissions[roleKey] || {};
    let count = 0;
    ALL_MODULES.forEach(m => {
      const mp = rp[m.key];
      if (mp) CRUD_KEYS.forEach(k => { if (mp[k]) count++; });
    });
    return count;
  };

  const totalPossible = ALL_MODULES.length * 4;

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <TooltipProvider>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Configure <strong>Create / Read / Update / Delete</strong> access per module for each role.
          </p>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={handleReset} className="gap-1.5">
              <RotateCcw className="w-3.5 h-3.5" />
              Reset Defaults
            </Button>
            <Button
              size="sm"
              onClick={handleSave}
              disabled={saving || !hasChanges}
              className="gap-1.5"
            >
              {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
              {saving ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        </div>

        {/* Role pills */}
        <div className="flex flex-wrap gap-2">
          {ROLES.map(role => {
            const count = countEnabled(role.key);
            return (
              <Button
                key={role.key}
                variant={selectedRole === role.key ? 'default' : 'secondary'}
                size="sm"
                onClick={() => setSelectedRole(role.key)}
                className="gap-2"
              >
                {role.label}
                <Badge variant="outline" className="text-[10px] px-1.5 bg-background/20 border-current">
                  {count}/{totalPossible}
                </Badge>
              </Button>
            );
          })}
        </div>

        {/* CRUD Matrix */}
        <div className="border border-border rounded-xl overflow-hidden">
          <ScrollArea className="max-h-[600px]">
            <table className="w-full text-sm">
              <thead className="sticky top-0 z-10">
                <tr className="bg-muted/50 border-b border-border">
                  <th className="text-left px-4 py-3 font-semibold text-foreground w-52">
                    Module
                  </th>
                  <th className="px-2 py-3 w-10 text-center">
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <button
                          onClick={() => {
                            // toggle all modules all actions
                            setPermissions(prev => {
                              const rp = { ...prev[selectedRole] };
                              const allChecked = ALL_MODULES.every(m => CRUD_KEYS.every(k => (rp[m.key] || allFalse())[k]));
                              ALL_MODULES.forEach(m => { rp[m.key] = allChecked ? allFalse() : allTrue(); });
                              return { ...prev, [selectedRole]: rp };
                            });
                            setHasChanges(true);
                          }}
                          className="text-xs font-bold text-muted-foreground hover:text-foreground"
                        >
                          All
                        </button>
                      </TooltipTrigger>
                      <TooltipContent>Toggle all permissions</TooltipContent>
                    </Tooltip>
                  </th>
                  {CRUD_KEYS.map(key => (
                    <th key={key} className="px-2 py-3 w-16 text-center">
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <button
                            onClick={() => toggleAllForAction(key)}
                            className={`text-xs font-bold ${CRUD_COLORS[key]} hover:opacity-80 transition-opacity`}
                          >
                            {CRUD_FULL_LABELS[key]}
                          </button>
                        </TooltipTrigger>
                        <TooltipContent>Toggle {CRUD_FULL_LABELS[key]} for all modules</TooltipContent>
                      </Tooltip>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {ALL_MODULES.map((mod, i) => {
                  const mp = rolePerm[mod.key] || allFalse();
                  const enabledCount = CRUD_KEYS.filter(k => mp[k]).length;
                  const isAllChecked = enabledCount === 4;
                  const isPartial = enabledCount > 0 && enabledCount < 4;

                  return (
                    <tr
                      key={mod.key}
                      className={`border-b border-border/50 hover:bg-muted/30 transition-colors ${i % 2 === 0 ? '' : 'bg-muted/10'}`}
                    >
                      <td className="px-4 py-2.5">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-foreground">{mod.label}</span>
                          {enabledCount > 0 && (
                            <Badge
                              variant="outline"
                              className={`text-[9px] px-1 py-0 h-4 ${
                                isAllChecked
                                  ? 'border-emerald-300 bg-emerald-50 text-emerald-600'
                                  : 'border-amber-300 bg-amber-50 text-amber-600'
                              }`}
                            >
                              {enabledCount}/4
                            </Badge>
                          )}
                        </div>
                      </td>
                      <td className="px-2 py-2.5 text-center">
                        <Checkbox
                          checked={isAllChecked ? true : isPartial ? 'indeterminate' : false}
                          onCheckedChange={() => toggleAllForModule(mod.key)}
                          className="mx-auto"
                        />
                      </td>
                      {CRUD_KEYS.map(key => (
                        <td key={key} className="px-2 py-2.5 text-center">
                          <Checkbox
                            checked={mp[key]}
                            onCheckedChange={() => handleToggle(mod.key, key)}
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
        </div>

        {/* Legend */}
        <div className="flex items-center gap-4 text-xs text-muted-foreground">
          <span className="font-semibold">Legend:</span>
          {CRUD_KEYS.map(k => (
            <span key={k} className={`flex items-center gap-1 ${CRUD_COLORS[k]}`}>
              <span className="font-bold">{CRUD_LABELS[k]}</span> = {CRUD_FULL_LABELS[k]}
            </span>
          ))}
        </div>

        {hasChanges && (
          <div className="bg-amber-50 border border-amber-200 rounded-lg px-4 py-3 flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
            <span className="text-sm text-amber-700">You have unsaved changes</span>
          </div>
        )}
      </div>
    </TooltipProvider>
  );
}
