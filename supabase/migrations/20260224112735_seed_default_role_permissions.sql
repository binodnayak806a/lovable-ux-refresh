/*
  # Seed Default Role Permissions

  1. Purpose
    - Populate the existing `user_roles` table with default permission sets for each system role
    - Permissions are stored as JSONB with module-level and action-level granularity

  2. Permission Structure (JSONB)
    - `modules`: object mapping module names to boolean access flags
    - `actions`: object mapping action names to boolean permission flags

  3. Roles Seeded
    - superadmin: Full access to everything
    - admin: Full access except superadmin-only settings
    - doctor: Clinical modules, own queue, own reports
    - receptionist: OPD, appointments, patients, billing view
    - nurse: Clinical modules, vitals, IPD nursing
    - billing: Billing, reports, pharmacy sales
    - pharmacist: Pharmacy, stock, lab view
    - lab_technician: Lab module, results entry

  4. Notes
    - Uses INSERT ... ON CONFLICT to avoid duplicates
    - hospital_id is NULL for system-wide defaults
    - user_id is NULL for role-template rows (not user-specific)
*/

INSERT INTO user_roles (id, hospital_id, user_id, role_name, permissions, is_active)
VALUES
  (gen_random_uuid(), NULL, NULL, 'superadmin', '{
    "modules": {
      "dashboard": true, "patients": true, "opd": true, "ipd": true,
      "doctor_queue": true, "appointments": true, "pharmacy": true, "lab": true,
      "billing": true, "reports": true, "analytics": true, "emergency": true,
      "ambulance": true, "hrms": true, "masters": true, "master_data": true,
      "admin": true, "settings": true, "notifications": true
    },
    "actions": {
      "edit_bill_amount": true, "delete_master_records": true, "export_data": true,
      "manage_users": true, "view_revenue": true, "manage_settings": true,
      "backup_database": true, "manage_roles": true, "access_audit_logs": true,
      "create_appointment": true, "create_patient": true, "create_bill": true,
      "collect_payment": true, "admit_patient": true, "discharge_patient": true,
      "enter_lab_results": true, "manage_pharmacy_stock": true,
      "pharmacy_sales": true, "pharmacy_purchase": true
    }
  }'::jsonb, true),

  (gen_random_uuid(), NULL, NULL, 'admin', '{
    "modules": {
      "dashboard": true, "patients": true, "opd": true, "ipd": true,
      "doctor_queue": true, "appointments": true, "pharmacy": true, "lab": true,
      "billing": true, "reports": true, "analytics": true, "emergency": true,
      "ambulance": true, "hrms": true, "masters": true, "master_data": true,
      "admin": true, "settings": true, "notifications": true
    },
    "actions": {
      "edit_bill_amount": true, "delete_master_records": true, "export_data": true,
      "manage_users": true, "view_revenue": true, "manage_settings": true,
      "backup_database": true, "manage_roles": false, "access_audit_logs": true,
      "create_appointment": true, "create_patient": true, "create_bill": true,
      "collect_payment": true, "admit_patient": true, "discharge_patient": true,
      "enter_lab_results": true, "manage_pharmacy_stock": true,
      "pharmacy_sales": true, "pharmacy_purchase": true
    }
  }'::jsonb, true),

  (gen_random_uuid(), NULL, NULL, 'doctor', '{
    "modules": {
      "dashboard": true, "patients": true, "opd": true, "ipd": true,
      "doctor_queue": true, "appointments": true, "pharmacy": false, "lab": true,
      "billing": false, "reports": true, "analytics": false, "emergency": true,
      "ambulance": false, "hrms": false, "masters": false, "master_data": false,
      "admin": false, "settings": false, "notifications": true
    },
    "actions": {
      "edit_bill_amount": false, "delete_master_records": false, "export_data": true,
      "manage_users": false, "view_revenue": false, "manage_settings": false,
      "backup_database": false, "manage_roles": false, "access_audit_logs": false,
      "create_appointment": true, "create_patient": true, "create_bill": false,
      "collect_payment": false, "admit_patient": true, "discharge_patient": true,
      "enter_lab_results": false, "manage_pharmacy_stock": false,
      "pharmacy_sales": false, "pharmacy_purchase": false
    }
  }'::jsonb, true),

  (gen_random_uuid(), NULL, NULL, 'receptionist', '{
    "modules": {
      "dashboard": true, "patients": true, "opd": true, "ipd": false,
      "doctor_queue": false, "appointments": true, "pharmacy": false, "lab": false,
      "billing": true, "reports": false, "analytics": false, "emergency": false,
      "ambulance": false, "hrms": false, "masters": false, "master_data": false,
      "admin": false, "settings": false, "notifications": true
    },
    "actions": {
      "edit_bill_amount": false, "delete_master_records": false, "export_data": false,
      "manage_users": false, "view_revenue": false, "manage_settings": false,
      "backup_database": false, "manage_roles": false, "access_audit_logs": false,
      "create_appointment": true, "create_patient": true, "create_bill": true,
      "collect_payment": true, "admit_patient": false, "discharge_patient": false,
      "enter_lab_results": false, "manage_pharmacy_stock": false,
      "pharmacy_sales": false, "pharmacy_purchase": false
    }
  }'::jsonb, true),

  (gen_random_uuid(), NULL, NULL, 'nurse', '{
    "modules": {
      "dashboard": true, "patients": true, "opd": true, "ipd": true,
      "doctor_queue": false, "appointments": true, "pharmacy": false, "lab": true,
      "billing": false, "reports": false, "analytics": false, "emergency": true,
      "ambulance": false, "hrms": false, "masters": false, "master_data": false,
      "admin": false, "settings": false, "notifications": true
    },
    "actions": {
      "edit_bill_amount": false, "delete_master_records": false, "export_data": false,
      "manage_users": false, "view_revenue": false, "manage_settings": false,
      "backup_database": false, "manage_roles": false, "access_audit_logs": false,
      "create_appointment": false, "create_patient": false, "create_bill": false,
      "collect_payment": false, "admit_patient": false, "discharge_patient": false,
      "enter_lab_results": false, "manage_pharmacy_stock": false,
      "pharmacy_sales": false, "pharmacy_purchase": false
    }
  }'::jsonb, true),

  (gen_random_uuid(), NULL, NULL, 'billing', '{
    "modules": {
      "dashboard": true, "patients": true, "opd": false, "ipd": false,
      "doctor_queue": false, "appointments": true, "pharmacy": true, "lab": false,
      "billing": true, "reports": true, "analytics": false, "emergency": false,
      "ambulance": false, "hrms": false, "masters": false, "master_data": false,
      "admin": false, "settings": false, "notifications": true
    },
    "actions": {
      "edit_bill_amount": true, "delete_master_records": false, "export_data": true,
      "manage_users": false, "view_revenue": true, "manage_settings": false,
      "backup_database": false, "manage_roles": false, "access_audit_logs": false,
      "create_appointment": false, "create_patient": false, "create_bill": true,
      "collect_payment": true, "admit_patient": false, "discharge_patient": false,
      "enter_lab_results": false, "manage_pharmacy_stock": false,
      "pharmacy_sales": true, "pharmacy_purchase": false
    }
  }'::jsonb, true),

  (gen_random_uuid(), NULL, NULL, 'pharmacist', '{
    "modules": {
      "dashboard": true, "patients": false, "opd": false, "ipd": false,
      "doctor_queue": false, "appointments": false, "pharmacy": true, "lab": true,
      "billing": false, "reports": false, "analytics": false, "emergency": false,
      "ambulance": false, "hrms": false, "masters": false, "master_data": false,
      "admin": false, "settings": false, "notifications": true
    },
    "actions": {
      "edit_bill_amount": false, "delete_master_records": false, "export_data": false,
      "manage_users": false, "view_revenue": false, "manage_settings": false,
      "backup_database": false, "manage_roles": false, "access_audit_logs": false,
      "create_appointment": false, "create_patient": false, "create_bill": false,
      "collect_payment": false, "admit_patient": false, "discharge_patient": false,
      "enter_lab_results": false, "manage_pharmacy_stock": true,
      "pharmacy_sales": true, "pharmacy_purchase": true
    }
  }'::jsonb, true),

  (gen_random_uuid(), NULL, NULL, 'lab_technician', '{
    "modules": {
      "dashboard": true, "patients": false, "opd": false, "ipd": false,
      "doctor_queue": false, "appointments": false, "pharmacy": false, "lab": true,
      "billing": false, "reports": false, "analytics": false, "emergency": false,
      "ambulance": false, "hrms": false, "masters": false, "master_data": false,
      "admin": false, "settings": false, "notifications": true
    },
    "actions": {
      "edit_bill_amount": false, "delete_master_records": false, "export_data": false,
      "manage_users": false, "view_revenue": false, "manage_settings": false,
      "backup_database": false, "manage_roles": false, "access_audit_logs": false,
      "create_appointment": false, "create_patient": false, "create_bill": false,
      "collect_payment": false, "admit_patient": false, "discharge_patient": false,
      "enter_lab_results": true, "manage_pharmacy_stock": false,
      "pharmacy_sales": false, "pharmacy_purchase": false
    }
  }'::jsonb, true)
ON CONFLICT DO NOTHING;
