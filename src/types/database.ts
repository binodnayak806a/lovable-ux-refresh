export type UserRole = 'superadmin' | 'admin' | 'doctor' | 'nurse' | 'billing' | 'pharmacist' | 'lab_technician' | 'receptionist';

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          email: string;
          full_name: string;
          role: UserRole;
          hospital_id: string | null;
          department: string | null;
          designation: string | null;
          phone: string | null;
          avatar_url: string | null;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          email: string;
          full_name?: string;
          role?: UserRole;
          hospital_id?: string | null;
          department?: string | null;
          designation?: string | null;
          phone?: string | null;
          avatar_url?: string | null;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          email?: string;
          full_name?: string;
          role?: UserRole;
          hospital_id?: string | null;
          department?: string | null;
          designation?: string | null;
          phone?: string | null;
          avatar_url?: string | null;
          is_active?: boolean;
          updated_at?: string;
        };
      };
      hospitals: {
        Row: {
          id: string;
          name: string;
          registration_number: string | null;
          address: string | null;
          city: string | null;
          state: string | null;
          pincode: string | null;
          phone: string | null;
          email: string | null;
          website: string | null;
          logo_url: string | null;
          bed_count: number;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          registration_number?: string | null;
          address?: string | null;
          city?: string | null;
          state?: string | null;
          pincode?: string | null;
          phone?: string | null;
          email?: string | null;
          website?: string | null;
          logo_url?: string | null;
          bed_count?: number;
          is_active?: boolean;
        };
        Update: {
          name?: string;
          registration_number?: string | null;
          address?: string | null;
          city?: string | null;
          state?: string | null;
          pincode?: string | null;
          phone?: string | null;
          email?: string | null;
          website?: string | null;
          logo_url?: string | null;
          bed_count?: number;
          is_active?: boolean;
        };
      };
      departments: {
        Row: {
          id: string;
          hospital_id: string;
          name: string;
          code: string;
          head_doctor_id: string | null;
          description: string | null;
          is_active: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          hospital_id: string;
          name: string;
          code: string;
          head_doctor_id?: string | null;
          description?: string | null;
          is_active?: boolean;
        };
        Update: {
          name?: string;
          code?: string;
          head_doctor_id?: string | null;
          description?: string | null;
          is_active?: boolean;
        };
      };
      audit_logs: {
        Row: {
          id: string;
          hospital_id: string | null;
          user_id: string | null;
          action: string;
          table_name: string | null;
          record_id: string | null;
          old_values: Record<string, unknown> | null;
          new_values: Record<string, unknown> | null;
          ip_address: string | null;
          user_agent: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          hospital_id?: string | null;
          user_id?: string | null;
          action: string;
          table_name?: string | null;
          record_id?: string | null;
          old_values?: Record<string, unknown> | null;
          new_values?: Record<string, unknown> | null;
          ip_address?: string | null;
          user_agent?: string | null;
        };
        Update: never;
      };
      staff: {
        Row: {
          id: string;
          hospital_id: string | null;
          employee_id: string;
          first_name: string;
          last_name: string;
          email: string | null;
          phone: string | null;
          date_of_birth: string | null;
          gender: string | null;
          address: string | null;
          city: string | null;
          designation: string | null;
          department: string | null;
          date_of_joining: string;
          employment_type: string;
          salary: number;
          status: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          hospital_id?: string | null;
          employee_id: string;
          first_name: string;
          last_name?: string;
          email?: string | null;
          phone?: string | null;
          date_of_birth?: string | null;
          gender?: string | null;
          address?: string | null;
          city?: string | null;
          designation?: string | null;
          department?: string | null;
          date_of_joining?: string;
          employment_type?: string;
          salary?: number;
          status?: string;
        };
        Update: {
          employee_id?: string;
          first_name?: string;
          last_name?: string;
          email?: string | null;
          phone?: string | null;
          date_of_birth?: string | null;
          gender?: string | null;
          address?: string | null;
          city?: string | null;
          designation?: string | null;
          department?: string | null;
          date_of_joining?: string;
          employment_type?: string;
          salary?: number;
          status?: string;
          updated_at?: string;
        };
      };
      attendance: {
        Row: {
          id: string;
          staff_id: string;
          date: string;
          check_in: string | null;
          check_out: string | null;
          status: string;
          notes: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          staff_id: string;
          date?: string;
          check_in?: string | null;
          check_out?: string | null;
          status?: string;
          notes?: string;
        };
        Update: {
          check_in?: string | null;
          check_out?: string | null;
          status?: string;
          notes?: string;
        };
      };
      leave_requests: {
        Row: {
          id: string;
          staff_id: string;
          leave_type: string;
          from_date: string;
          to_date: string;
          total_days: number;
          reason: string;
          status: string;
          approved_by: string | null;
          approved_at: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          staff_id: string;
          leave_type?: string;
          from_date: string;
          to_date: string;
          total_days?: number;
          reason?: string;
          status?: string;
          approved_by?: string | null;
          approved_at?: string | null;
        };
        Update: {
          leave_type?: string;
          from_date?: string;
          to_date?: string;
          total_days?: number;
          reason?: string;
          status?: string;
          approved_by?: string | null;
          approved_at?: string | null;
        };
      };
      system_settings: {
        Row: {
          id: string;
          hospital_id: string;
          setting_key: string;
          setting_value: string;
          setting_type: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          hospital_id: string;
          setting_key: string;
          setting_value?: string;
          setting_type?: string;
          updated_at?: string;
        };
        Update: {
          setting_value?: string;
          setting_type?: string;
          updated_at?: string;
        };
      };
      user_roles: {
        Row: {
          id: string;
          user_id: string | null;
          role_name: UserRole;
          permissions: Record<string, unknown> | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id?: string | null;
          role_name: UserRole;
          permissions?: Record<string, unknown> | null;
        };
        Update: {
          role_name?: UserRole;
          permissions?: Record<string, unknown> | null;
        };
      };
    };
    Enums: {
      user_role: UserRole;
    };
  };
}
