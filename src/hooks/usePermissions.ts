import { useState, useEffect, useCallback, useMemo } from 'react';
import { useAppSelector } from '../store';
import { roleService } from '../services/role.service';
import type { UserRole } from '../types/user.types';

interface RolePermissions {
  modules: Record<string, boolean>;
  actions: Record<string, boolean>;
}

const ADMIN_ROLES: UserRole[] = ['superadmin', 'admin'];

const FALLBACK_PERMISSIONS: Record<UserRole, RolePermissions> = {
  superadmin: {
    modules: {
      dashboard: true, patients: true, opd: true, ipd: true, doctor_queue: true,
      appointments: true, pharmacy: true, lab: true, billing: true, reports: true,
      analytics: true, emergency: true, ambulance: true, hrms: true, masters: true,
      master_data: true, admin: true, settings: true, notifications: true,
      cash_bank: true,
    },
    actions: {
      edit_bill_amount: true, delete_master_records: true, export_data: true,
      manage_users: true, view_revenue: true, manage_settings: true,
      backup_database: true, manage_roles: true, access_audit_logs: true,
      create_appointment: true, create_patient: true, create_bill: true,
      collect_payment: true, admit_patient: true, discharge_patient: true,
      enter_lab_results: true, manage_pharmacy_stock: true,
      pharmacy_sales: true, pharmacy_purchase: true,
    },
  },
  admin: {
    modules: {
      dashboard: true, patients: true, opd: true, ipd: true, doctor_queue: true,
      appointments: true, pharmacy: true, lab: true, billing: true, reports: true,
      analytics: true, emergency: true, ambulance: true, hrms: true, masters: true,
      master_data: true, admin: true, settings: true, notifications: true,
      cash_bank: true,
    },
    actions: {
      edit_bill_amount: true, delete_master_records: true, export_data: true,
      manage_users: true, view_revenue: true, manage_settings: true,
      backup_database: true, manage_roles: false, access_audit_logs: true,
      create_appointment: true, create_patient: true, create_bill: true,
      collect_payment: true, admit_patient: true, discharge_patient: true,
      enter_lab_results: true, manage_pharmacy_stock: true,
      pharmacy_sales: true, pharmacy_purchase: true,
    },
  },
  doctor: {
    modules: {
      dashboard: true, patients: true, opd: true, ipd: true, doctor_queue: true,
      appointments: true, pharmacy: false, lab: true, billing: false, reports: true,
      analytics: false, emergency: true, ambulance: false, hrms: false, masters: false,
      master_data: false, admin: false, settings: false, notifications: true,
    },
    actions: {
      edit_bill_amount: false, delete_master_records: false, export_data: true,
      manage_users: false, view_revenue: false, manage_settings: false,
      backup_database: false, manage_roles: false, access_audit_logs: false,
      create_appointment: true, create_patient: true, create_bill: false,
      collect_payment: false, admit_patient: true, discharge_patient: true,
      enter_lab_results: false, manage_pharmacy_stock: false,
      pharmacy_sales: false, pharmacy_purchase: false,
    },
  },
  receptionist: {
    modules: {
      dashboard: true, patients: true, opd: true, ipd: false, doctor_queue: false,
      appointments: true, pharmacy: false, lab: false, billing: true, reports: false,
      analytics: false, emergency: false, ambulance: false, hrms: false, masters: false,
      master_data: false, admin: false, settings: false, notifications: true,
    },
    actions: {
      edit_bill_amount: false, delete_master_records: false, export_data: false,
      manage_users: false, view_revenue: false, manage_settings: false,
      backup_database: false, manage_roles: false, access_audit_logs: false,
      create_appointment: true, create_patient: true, create_bill: true,
      collect_payment: true, admit_patient: false, discharge_patient: false,
      enter_lab_results: false, manage_pharmacy_stock: false,
      pharmacy_sales: false, pharmacy_purchase: false,
    },
  },
  nurse: {
    modules: {
      dashboard: true, patients: true, opd: true, ipd: true, doctor_queue: false,
      appointments: true, pharmacy: false, lab: true, billing: false, reports: false,
      analytics: false, emergency: true, ambulance: false, hrms: false, masters: false,
      master_data: false, admin: false, settings: false, notifications: true,
    },
    actions: {
      edit_bill_amount: false, delete_master_records: false, export_data: false,
      manage_users: false, view_revenue: false, manage_settings: false,
      backup_database: false, manage_roles: false, access_audit_logs: false,
      create_appointment: false, create_patient: false, create_bill: false,
      collect_payment: false, admit_patient: false, discharge_patient: false,
      enter_lab_results: false, manage_pharmacy_stock: false,
      pharmacy_sales: false, pharmacy_purchase: false,
    },
  },
  billing: {
    modules: {
      dashboard: true, patients: true, opd: false, ipd: false, doctor_queue: false,
      appointments: true, pharmacy: true, lab: false, billing: true, reports: true,
      analytics: false, emergency: false, ambulance: false, hrms: false, masters: false,
      master_data: false, admin: false, settings: false, notifications: true,
    },
    actions: {
      edit_bill_amount: true, delete_master_records: false, export_data: true,
      manage_users: false, view_revenue: true, manage_settings: false,
      backup_database: false, manage_roles: false, access_audit_logs: false,
      create_appointment: false, create_patient: false, create_bill: true,
      collect_payment: true, admit_patient: false, discharge_patient: false,
      enter_lab_results: false, manage_pharmacy_stock: false,
      pharmacy_sales: true, pharmacy_purchase: false,
    },
  },
  pharmacist: {
    modules: {
      dashboard: true, patients: false, opd: false, ipd: false, doctor_queue: false,
      appointments: false, pharmacy: true, lab: true, billing: false, reports: false,
      analytics: false, emergency: false, ambulance: false, hrms: false, masters: false,
      master_data: false, admin: false, settings: false, notifications: true,
    },
    actions: {
      edit_bill_amount: false, delete_master_records: false, export_data: false,
      manage_users: false, view_revenue: false, manage_settings: false,
      backup_database: false, manage_roles: false, access_audit_logs: false,
      create_appointment: false, create_patient: false, create_bill: false,
      collect_payment: false, admit_patient: false, discharge_patient: false,
      enter_lab_results: false, manage_pharmacy_stock: true,
      pharmacy_sales: true, pharmacy_purchase: true,
    },
  },
  lab_technician: {
    modules: {
      dashboard: true, patients: false, opd: false, ipd: false, doctor_queue: false,
      appointments: false, pharmacy: false, lab: true, billing: false, reports: false,
      analytics: false, emergency: false, ambulance: false, hrms: false, masters: false,
      master_data: false, admin: false, settings: false, notifications: true,
    },
    actions: {
      edit_bill_amount: false, delete_master_records: false, export_data: false,
      manage_users: false, view_revenue: false, manage_settings: false,
      backup_database: false, manage_roles: false, access_audit_logs: false,
      create_appointment: false, create_patient: false, create_bill: false,
      collect_payment: false, admit_patient: false, discharge_patient: false,
      enter_lab_results: true, manage_pharmacy_stock: false,
      pharmacy_sales: false, pharmacy_purchase: false,
    },
  },
};

/**
 * usePermissions hook — fetches role from `user_roles` table (server-side source of truth)
 * instead of trusting `profiles.role` which is client-editable.
 * 
 * For demo sessions (no real auth), falls back to the role stored in Redux state.
 */
export function usePermissions() {
  const { user } = useAppSelector((s) => s.auth);
  const profileRole = (user?.role as UserRole) ?? 'receptionist';
  const isDemoSession = user?.id?.startsWith('demo-') ?? false;

  // Server-verified role from user_roles table
  const [verifiedRole, setVerifiedRole] = useState<UserRole | null>(null);
  const [dbPermissions, setDbPermissions] = useState<RolePermissions | null>(null);

  // The actual role: use server-verified role if available, else profile role
  const role: UserRole = verifiedRole ?? profileRole;

  useEffect(() => {
    if (!user?.id || isDemoSession) {
      // Demo sessions use client-side role directly
      setVerifiedRole(null);
      return;
    }

    // Fetch verified role from user_roles table
    (async () => {
      try {
        const serverRole = await roleService.ensureUserRole(user.id, profileRole);
        setVerifiedRole(serverRole);
      } catch {
        // If user_roles table doesn't have proper columns, fall back gracefully
        setVerifiedRole(null);
      }
    })();
  }, [user?.id, profileRole, isDemoSession]);

  // Fetch role-level permissions (entries where user_id IS NULL)
  useEffect(() => {
    if (!role) return;
    (async () => {
      try {
        const perms = await roleService.getRolePermissions(role);
        if (perms) {
          setDbPermissions(perms as unknown as RolePermissions);
        }
      } catch {
        // silently fall back
      }
    })();
  }, [role]);

  const permissions = useMemo(
    () => dbPermissions ?? FALLBACK_PERMISSIONS[role] ?? FALLBACK_PERMISSIONS.receptionist,
    [dbPermissions, role],
  );

  const can = useCallback(
    (action: string, module?: string) => {
      if (ADMIN_ROLES.includes(role) && role === 'superadmin') return true;
      if (module) return permissions.modules[module] === true;
      return permissions.actions[action] === true;
    },
    [permissions, role],
  );

  const canAccessModule = useCallback(
    (module: string) => {
      if (ADMIN_ROLES.includes(role)) return true;
      return permissions.modules[module] === true;
    },
    [permissions, role],
  );

  const isRole = useCallback(
    (...roles: UserRole[]) => roles.includes(role),
    [role],
  );

  const isAdmin = ADMIN_ROLES.includes(role);

  return {
    role,
    permissions,
    can,
    canAccessModule,
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
