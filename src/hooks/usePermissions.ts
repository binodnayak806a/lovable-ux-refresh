import { useState, useEffect, useCallback, useMemo } from 'react';
import { supabase } from '../lib/supabase';
import { useAppSelector } from '../store';
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

export function usePermissions() {
  const { user } = useAppSelector((s) => s.auth);
  const role = (user?.role as UserRole) ?? 'receptionist';
  const [dbPermissions, setDbPermissions] = useState<RolePermissions | null>(null);

  useEffect(() => {
    if (!role) return;
    supabase
      .from('user_roles')
      .select('permissions')
      .eq('role_name', role)
      .is('user_id', null)
      .maybeSingle()
      .then(({ data }: { data: { permissions: unknown } | null }) => {
        if (data?.permissions) {
          setDbPermissions(data.permissions as RolePermissions);
        }
      });
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
