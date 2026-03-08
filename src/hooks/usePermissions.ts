import { useState, useEffect, useCallback, useMemo } from 'react';
import { useAppSelector } from '../store';
import { roleService } from '../services/role.service';
import type { UserRole } from '../types/user.types';
import type { ModuleCrud, ModulePermissions } from '../modules/admin/AdminPage';
import { DEFAULT_ROLE_PERMISSIONS } from '../modules/admin/AdminPage';

const ADMIN_ROLES: UserRole[] = ['superadmin', 'admin'];

/**
 * usePermissions hook — supports module-wise CRUD granularity.
 *
 * Priority:
 * 1. User-specific permission override (if set on profile)
 * 2. Role-level CRUD defaults from DEFAULT_ROLE_PERMISSIONS
 */
export function usePermissions() {
  const { user } = useAppSelector((s) => s.auth);
  const profileRole = (user?.role as UserRole) ?? 'receptionist';
  const isDemoSession = user?.id?.startsWith('demo-') ?? false;

  const [verifiedRole, setVerifiedRole] = useState<UserRole | null>(null);

  const role: UserRole = verifiedRole ?? profileRole;

  useEffect(() => {
    if (!user?.id || isDemoSession) {
      setVerifiedRole(null);
      return;
    }
    (async () => {
      try {
        const serverRole = await roleService.ensureUserRole(user.id, profileRole);
        setVerifiedRole(serverRole);
      } catch {
        setVerifiedRole(null);
      }
    })();
  }, [user?.id, profileRole, isDemoSession]);

  const modulePermissions: ModulePermissions = useMemo(() => {
    return DEFAULT_ROLE_PERMISSIONS[role] ?? DEFAULT_ROLE_PERMISSIONS.receptionist ?? {};
  }, [role]);

  const canModule = useCallback(
    (module: string, action?: keyof ModuleCrud): boolean => {
      if (ADMIN_ROLES.includes(role) && role === 'superadmin') return true;
      const mp = modulePermissions[module];
      if (!mp) return false;
      if (action) return mp[action] === true;
      // If no action specified, check if any access exists
      return mp.create || mp.read || mp.update || mp.delete;
    },
    [modulePermissions, role],
  );

  // Legacy compat
  const can = useCallback(
    (action: string, module?: string) => {
      if (ADMIN_ROLES.includes(role) && role === 'superadmin') return true;
      if (module) return canModule(module, 'read');
      // Map legacy action names to module CRUD
      const legacyMap: Record<string, { module: string; action: keyof ModuleCrud }> = {
        create_patient: { module: 'patients', action: 'create' },
        create_appointment: { module: 'appointments', action: 'create' },
        create_bill: { module: 'billing', action: 'create' },
        collect_payment: { module: 'billing', action: 'update' },
        admit_patient: { module: 'ipd', action: 'create' },
        discharge_patient: { module: 'ipd', action: 'update' },
        enter_lab_results: { module: 'lab', action: 'update' },
        manage_pharmacy_stock: { module: 'pharmacy', action: 'update' },
        pharmacy_sales: { module: 'pharmacy', action: 'create' },
        pharmacy_purchase: { module: 'pharmacy', action: 'create' },
        edit_bill_amount: { module: 'billing', action: 'update' },
        delete_master_records: { module: 'master_data', action: 'delete' },
        export_data: { module: 'reports', action: 'read' },
        manage_users: { module: 'admin', action: 'update' },
        view_revenue: { module: 'analytics', action: 'read' },
        manage_settings: { module: 'settings', action: 'update' },
        manage_roles: { module: 'admin', action: 'update' },
        access_audit_logs: { module: 'admin', action: 'read' },
      };
      const mapped = legacyMap[action];
      if (mapped) return canModule(mapped.module, mapped.action);
      return false;
    },
    [canModule, role],
  );

  const canAccessModule = useCallback(
    (module: string) => {
      if (ADMIN_ROLES.includes(role)) return true;
      return canModule(module);
    },
    [canModule, role],
  );

  const canCreate = useCallback((module: string) => canModule(module, 'create'), [canModule]);
  const canRead = useCallback((module: string) => canModule(module, 'read'), [canModule]);
  const canUpdate = useCallback((module: string) => canModule(module, 'update'), [canModule]);
  const canDelete = useCallback((module: string) => canModule(module, 'delete'), [canModule]);

  const isRole = useCallback(
    (...roles: UserRole[]) => roles.includes(role),
    [role],
  );

  const isAdmin = ADMIN_ROLES.includes(role);

  return {
    role,
    permissions: modulePermissions,
    can,
    canAccessModule,
    canCreate,
    canRead,
    canUpdate,
    canDelete,
    isRole,
    isAdmin,
  };
}

export const ROLE_DEFAULT_ROUTES: Record<UserRole, string> = {
  superadmin: '/dashboard',
  admin: '/dashboard',
  doctor: '/doctor/queue',
  receptionist: '/appointments',
  nurse: '/ipd',
  billing: '/billing',
  pharmacist: '/pharmacy',
  lab_technician: '/lab',
};
