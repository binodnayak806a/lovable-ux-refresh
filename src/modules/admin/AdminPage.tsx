import { useState, useEffect } from 'react';
import { Users, ClipboardList, ShieldCheck, Save, Loader2, RotateCcw } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../components/ui/tabs';
import { Button } from '../../components/ui/button';
import { Switch } from '../../components/ui/switch';
import { Badge } from '../../components/ui/badge';
import { useAuth } from '../../hooks/useAuth';
import { supabase } from '../../lib/supabase';
import { toast } from 'sonner';
import UserManagementTab from './components/UserManagementTab';
import AuditLogsTab from './components/AuditLogsTab';

const SAMPLE_HOSPITAL_ID = '11111111-1111-1111-1111-111111111111';

const ALL_MODULES = [
  'Dashboard', 'Patients', 'OPD', 'IPD', 'Billing',
  'Appointments', 'Consultation', 'Prescription', 'Vitals',
  'Laboratory', 'Pharmacy', 'Ambulance', 'Emergency',
  'Reports', 'Analytics', 'Master Data', 'HRMS',
  'Admin', 'Settings', 'Notifications', 'User Management',
  'System Settings', 'Audit Logs',
];

const ROLES = [
  'Super Admin', 'Admin', 'Doctor', 'Nurse',
  'Billing Staff', 'Pharmacist', 'Lab Technician', 'Receptionist',
];

const DEFAULT_PERMISSIONS: Record<string, string[]> = {
  'Super Admin': ALL_MODULES,
  'Admin': ALL_MODULES.filter(m => m !== 'System Settings'),
  'Doctor': ['Dashboard', 'Patients', 'OPD', 'IPD', 'Prescription', 'Consultation', 'Vitals', 'Laboratory', 'Pharmacy', 'Appointments', 'Notifications'],
  'Nurse': ['Dashboard', 'Patients', 'IPD', 'Vitals', 'Emergency', 'Notifications'],
  'Billing Staff': ['Dashboard', 'Billing', 'Patients', 'Reports', 'Analytics', 'Notifications'],
  'Pharmacist': ['Dashboard', 'Pharmacy', 'Prescription', 'Notifications'],
  'Lab Technician': ['Dashboard', 'Laboratory', 'Reports', 'Notifications'],
  'Receptionist': ['Dashboard', 'Patients', 'Appointments', 'OPD', 'Notifications'],
};

export default function AdminPage() {
  const { hospitalId } = useAuth();
  const effectiveHospitalId = hospitalId ?? SAMPLE_HOSPITAL_ID;

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Administration</h1>
        <p className="text-muted-foreground mt-1">Manage system users, roles, and review the activity audit trail</p>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <Tabs defaultValue="users">
          <div className="border-b border-slate-200 px-6 pt-4">
            <TabsList className="bg-transparent p-0 h-auto gap-1">
              <TabsTrigger
                value="users"
                className="flex items-center gap-2 px-4 py-2 rounded-lg data-[state=active]:bg-slate-100 data-[state=active]:text-slate-900 text-slate-600 font-medium"
              >
                <Users className="h-4 w-4" />
                User Management
              </TabsTrigger>
              <TabsTrigger
                value="audit"
                className="flex items-center gap-2 px-4 py-2 rounded-lg data-[state=active]:bg-slate-100 data-[state=active]:text-slate-900 text-slate-600 font-medium"
              >
                <ClipboardList className="h-4 w-4" />
                Audit Logs
              </TabsTrigger>
              <TabsTrigger
                value="rbac"
                className="flex items-center gap-2 px-4 py-2 rounded-lg data-[state=active]:bg-slate-100 data-[state=active]:text-slate-900 text-slate-600 font-medium"
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
  const [permissions, setPermissions] = useState<Record<string, string[]>>(DEFAULT_PERMISSIONS);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [selectedRole, setSelectedRole] = useState(ROLES[0]);
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
        .eq('setting_key', 'role_permissions')
        .maybeSingle();

      const row = data as { setting_value: unknown } | null;
      if (row?.setting_value) {
        const parsed = typeof row.setting_value === 'string'
          ? JSON.parse(row.setting_value)
          : row.setting_value;
        setPermissions({ ...DEFAULT_PERMISSIONS, ...parsed });
      }
    } catch {
      toast.error('Failed to load permissions');
    } finally {
      setLoading(false);
    }
  };

  const handleToggle = (mod: string) => {
    setPermissions(prev => {
      const current = prev[selectedRole] || [];
      const updated = current.includes(mod)
        ? current.filter(m => m !== mod)
        : [...current, mod];
      return { ...prev, [selectedRole]: updated };
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
          setting_key: 'role_permissions',
          setting_value: JSON.stringify(permissions),
          updated_at: new Date().toISOString(),
        } as never, { onConflict: 'hospital_id,setting_key' });

      if (error) throw error;
      setHasChanges(false);
      toast.success('Permissions saved successfully');
    } catch {
      toast.error('Failed to save permissions');
    } finally {
      setSaving(false);
    }
  };

  const handleReset = () => {
    setPermissions(DEFAULT_PERMISSIONS);
    setHasChanges(true);
  };

  const roleModules = permissions[selectedRole] || [];

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="w-6 h-6 animate-spin text-blue-500" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          Configure module access for each role. Changes are saved to the database.
        </p>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={handleReset} className="gap-1.5">
            <RotateCcw className="w-3.5 h-3.5" />
            Reset to Defaults
          </Button>
          <Button
            size="sm"
            onClick={handleSave}
            disabled={saving || !hasChanges}
            className="gap-1.5 bg-blue-600 hover:bg-blue-700"
          >
            {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
            {saving ? 'Saving...' : 'Save Changes'}
          </Button>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        {ROLES.map(role => (
          <Button
            key={role}
            variant={selectedRole === role ? 'default' : 'secondary'}
            size="sm"
            onClick={() => setSelectedRole(role)}
            className="gap-2"
          >
            {role}
            <Badge variant="outline" className="text-[10px] px-1.5 bg-white/20 border-current">
              {(permissions[role] || []).length}
            </Badge>
          </Button>
        ))}
      </div>

      <div className="border border-slate-200 rounded-xl overflow-hidden">
        <div className="px-4 py-3 bg-slate-50 border-b border-slate-200">
          <div className="flex items-center justify-between">
            <span className="text-sm font-semibold text-slate-700">
              {selectedRole} - Module Access ({roleModules.length}/{ALL_MODULES.length})
            </span>
            <div className="flex items-center gap-1">
              <Button
                variant="link"
                size="sm"
                className="h-auto p-0 text-xs"
                onClick={() => {
                  setPermissions(prev => ({ ...prev, [selectedRole]: [...ALL_MODULES] }));
                  setHasChanges(true);
                }}
              >
                Select All
              </Button>
              <span className="text-gray-300">|</span>
              <Button
                variant="link"
                size="sm"
                className="h-auto p-0 text-xs text-red-600 hover:text-red-700"
                onClick={() => {
                  setPermissions(prev => ({ ...prev, [selectedRole]: [] }));
                  setHasChanges(true);
                }}
              >
                Clear All
              </Button>
            </div>
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-0">
          {ALL_MODULES.map(mod => {
            const isEnabled = roleModules.includes(mod);
            return (
              <div
                key={mod}
                className="flex items-center justify-between px-4 py-3 border-b border-r border-slate-100 hover:bg-slate-50 transition-colors"
              >
                <span className={`text-sm ${isEnabled ? 'text-slate-900 font-medium' : 'text-slate-400'}`}>
                  {mod}
                </span>
                <Switch
                  checked={isEnabled}
                  onCheckedChange={() => handleToggle(mod)}
                />
              </div>
            );
          })}
        </div>
      </div>

      {hasChanges && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg px-4 py-3 flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
          <span className="text-sm text-amber-700">You have unsaved changes</span>
        </div>
      )}
    </div>
  );
}
