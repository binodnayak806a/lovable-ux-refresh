export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.4"
  }
  public: {
    Tables: {
      admissions: {
        Row: {
          admission_date: string
          admission_number: string
          admitting_doctor_id: string | null
          bed_id: string | null
          chief_complaint: string | null
          created_at: string
          diagnosis: string | null
          discharge_date: string | null
          discharge_summary: string | null
          discharge_type: string | null
          hospital_id: string
          id: string
          patient_id: string
          status: Database["public"]["Enums"]["admission_status"]
          updated_at: string
          ward_id: string | null
        }
        Insert: {
          admission_date?: string
          admission_number: string
          admitting_doctor_id?: string | null
          bed_id?: string | null
          chief_complaint?: string | null
          created_at?: string
          diagnosis?: string | null
          discharge_date?: string | null
          discharge_summary?: string | null
          discharge_type?: string | null
          hospital_id: string
          id?: string
          patient_id: string
          status?: Database["public"]["Enums"]["admission_status"]
          updated_at?: string
          ward_id?: string | null
        }
        Update: {
          admission_date?: string
          admission_number?: string
          admitting_doctor_id?: string | null
          bed_id?: string | null
          chief_complaint?: string | null
          created_at?: string
          diagnosis?: string | null
          discharge_date?: string | null
          discharge_summary?: string | null
          discharge_type?: string | null
          hospital_id?: string
          id?: string
          patient_id?: string
          status?: Database["public"]["Enums"]["admission_status"]
          updated_at?: string
          ward_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "admissions_admitting_doctor_id_fkey"
            columns: ["admitting_doctor_id"]
            isOneToOne: false
            referencedRelation: "doctors"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "admissions_bed_id_fkey"
            columns: ["bed_id"]
            isOneToOne: false
            referencedRelation: "beds"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "admissions_hospital_id_fkey"
            columns: ["hospital_id"]
            isOneToOne: false
            referencedRelation: "hospitals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "admissions_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "admissions_ward_id_fkey"
            columns: ["ward_id"]
            isOneToOne: false
            referencedRelation: "wards"
            referencedColumns: ["id"]
          },
        ]
      }
      ambulance_bookings: {
        Row: {
          charge: number | null
          created_at: string
          drop_location: string | null
          hospital_id: string
          id: string
          notes: string | null
          patient_name: string | null
          patient_phone: string | null
          pickup_location: string
          pickup_time: string
          status: string | null
          vehicle_id: string | null
        }
        Insert: {
          charge?: number | null
          created_at?: string
          drop_location?: string | null
          hospital_id: string
          id?: string
          notes?: string | null
          patient_name?: string | null
          patient_phone?: string | null
          pickup_location: string
          pickup_time: string
          status?: string | null
          vehicle_id?: string | null
        }
        Update: {
          charge?: number | null
          created_at?: string
          drop_location?: string | null
          hospital_id?: string
          id?: string
          notes?: string | null
          patient_name?: string | null
          patient_phone?: string | null
          pickup_location?: string
          pickup_time?: string
          status?: string | null
          vehicle_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ambulance_bookings_hospital_id_fkey"
            columns: ["hospital_id"]
            isOneToOne: false
            referencedRelation: "hospitals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ambulance_bookings_vehicle_id_fkey"
            columns: ["vehicle_id"]
            isOneToOne: false
            referencedRelation: "ambulance_vehicles"
            referencedColumns: ["id"]
          },
        ]
      }
      ambulance_vehicles: {
        Row: {
          created_at: string
          driver_name: string | null
          driver_phone: string | null
          hospital_id: string
          id: string
          is_active: boolean
          status: string | null
          vehicle_number: string
          vehicle_type: string | null
        }
        Insert: {
          created_at?: string
          driver_name?: string | null
          driver_phone?: string | null
          hospital_id: string
          id?: string
          is_active?: boolean
          status?: string | null
          vehicle_number: string
          vehicle_type?: string | null
        }
        Update: {
          created_at?: string
          driver_name?: string | null
          driver_phone?: string | null
          hospital_id?: string
          id?: string
          is_active?: boolean
          status?: string | null
          vehicle_number?: string
          vehicle_type?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ambulance_vehicles_hospital_id_fkey"
            columns: ["hospital_id"]
            isOneToOne: false
            referencedRelation: "hospitals"
            referencedColumns: ["id"]
          },
        ]
      }
      appointments: {
        Row: {
          appointment_date: string
          appointment_time: string
          chief_complaint: string | null
          created_at: string
          created_by: string | null
          department_id: string | null
          doctor_id: string
          hospital_id: string
          id: string
          notes: string | null
          patient_id: string
          referred_by: string | null
          status: Database["public"]["Enums"]["appointment_status"]
          type: string
          updated_at: string
        }
        Insert: {
          appointment_date: string
          appointment_time: string
          chief_complaint?: string | null
          created_at?: string
          created_by?: string | null
          department_id?: string | null
          doctor_id: string
          hospital_id: string
          id?: string
          notes?: string | null
          patient_id: string
          referred_by?: string | null
          status?: Database["public"]["Enums"]["appointment_status"]
          type?: string
          updated_at?: string
        }
        Update: {
          appointment_date?: string
          appointment_time?: string
          chief_complaint?: string | null
          created_at?: string
          created_by?: string | null
          department_id?: string | null
          doctor_id?: string
          hospital_id?: string
          id?: string
          notes?: string | null
          patient_id?: string
          referred_by?: string | null
          status?: Database["public"]["Enums"]["appointment_status"]
          type?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "appointments_department_id_fkey"
            columns: ["department_id"]
            isOneToOne: false
            referencedRelation: "departments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "appointments_doctor_id_fkey"
            columns: ["doctor_id"]
            isOneToOne: false
            referencedRelation: "doctors"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "appointments_hospital_id_fkey"
            columns: ["hospital_id"]
            isOneToOne: false
            referencedRelation: "hospitals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "appointments_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
        ]
      }
      attendance: {
        Row: {
          check_in: string | null
          check_out: string | null
          created_at: string
          date: string
          id: string
          notes: string | null
          staff_id: string
          status: string | null
        }
        Insert: {
          check_in?: string | null
          check_out?: string | null
          created_at?: string
          date: string
          id?: string
          notes?: string | null
          staff_id: string
          status?: string | null
        }
        Update: {
          check_in?: string | null
          check_out?: string | null
          created_at?: string
          date?: string
          id?: string
          notes?: string | null
          staff_id?: string
          status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "attendance_staff_id_fkey"
            columns: ["staff_id"]
            isOneToOne: false
            referencedRelation: "staff"
            referencedColumns: ["id"]
          },
        ]
      }
      audit_logs: {
        Row: {
          action: string
          created_at: string
          details: Json | null
          entity_id: string | null
          entity_type: string
          hospital_id: string | null
          id: string
          ip_address: string | null
          user_id: string | null
        }
        Insert: {
          action: string
          created_at?: string
          details?: Json | null
          entity_id?: string | null
          entity_type: string
          hospital_id?: string | null
          id?: string
          ip_address?: string | null
          user_id?: string | null
        }
        Update: {
          action?: string
          created_at?: string
          details?: Json | null
          entity_id?: string | null
          entity_type?: string
          hospital_id?: string | null
          id?: string
          ip_address?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "audit_logs_hospital_id_fkey"
            columns: ["hospital_id"]
            isOneToOne: false
            referencedRelation: "hospitals"
            referencedColumns: ["id"]
          },
        ]
      }
      bank_accounts: {
        Row: {
          account_name: string
          account_number: string | null
          account_type: string
          bank_name: string | null
          created_at: string
          current_balance: number | null
          hospital_id: string
          id: string
          ifsc: string | null
          is_active: boolean
          opening_balance: number | null
        }
        Insert: {
          account_name: string
          account_number?: string | null
          account_type?: string
          bank_name?: string | null
          created_at?: string
          current_balance?: number | null
          hospital_id: string
          id?: string
          ifsc?: string | null
          is_active?: boolean
          opening_balance?: number | null
        }
        Update: {
          account_name?: string
          account_number?: string | null
          account_type?: string
          bank_name?: string | null
          created_at?: string
          current_balance?: number | null
          hospital_id?: string
          id?: string
          ifsc?: string | null
          is_active?: boolean
          opening_balance?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "bank_accounts_hospital_id_fkey"
            columns: ["hospital_id"]
            isOneToOne: false
            referencedRelation: "hospitals"
            referencedColumns: ["id"]
          },
        ]
      }
      beds: {
        Row: {
          bed_number: string
          created_at: string
          daily_charge: number | null
          hospital_id: string
          id: string
          notes: string | null
          status: Database["public"]["Enums"]["bed_status"]
          updated_at: string
          ward_id: string
        }
        Insert: {
          bed_number: string
          created_at?: string
          daily_charge?: number | null
          hospital_id: string
          id?: string
          notes?: string | null
          status?: Database["public"]["Enums"]["bed_status"]
          updated_at?: string
          ward_id: string
        }
        Update: {
          bed_number?: string
          created_at?: string
          daily_charge?: number | null
          hospital_id?: string
          id?: string
          notes?: string | null
          status?: Database["public"]["Enums"]["bed_status"]
          updated_at?: string
          ward_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "beds_hospital_id_fkey"
            columns: ["hospital_id"]
            isOneToOne: false
            referencedRelation: "hospitals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "beds_ward_id_fkey"
            columns: ["ward_id"]
            isOneToOne: false
            referencedRelation: "wards"
            referencedColumns: ["id"]
          },
        ]
      }
      cash_transactions: {
        Row: {
          account_id: string
          amount: number
          created_at: string
          created_by: string | null
          description: string | null
          hospital_id: string
          id: string
          mode: string | null
          reference_id: string | null
          reference_type: string | null
          transaction_date: string
          transaction_type: string
        }
        Insert: {
          account_id: string
          amount: number
          created_at?: string
          created_by?: string | null
          description?: string | null
          hospital_id: string
          id?: string
          mode?: string | null
          reference_id?: string | null
          reference_type?: string | null
          transaction_date?: string
          transaction_type: string
        }
        Update: {
          account_id?: string
          amount?: number
          created_at?: string
          created_by?: string | null
          description?: string | null
          hospital_id?: string
          id?: string
          mode?: string | null
          reference_id?: string | null
          reference_type?: string | null
          transaction_date?: string
          transaction_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "cash_transactions_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "bank_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cash_transactions_hospital_id_fkey"
            columns: ["hospital_id"]
            isOneToOne: false
            referencedRelation: "hospitals"
            referencedColumns: ["id"]
          },
        ]
      }
      consultations: {
        Row: {
          advice: string | null
          chief_complaint: string | null
          consultation_date: string
          created_at: string
          diagnosis: Json | null
          doctor_id: string
          examination: Json | null
          family_history: string | null
          follow_up_date: string | null
          follow_up_notes: string | null
          history_of_present_illness: string | null
          hospital_id: string
          id: string
          past_history: string | null
          patient_id: string
          updated_at: string
          visit_id: string | null
        }
        Insert: {
          advice?: string | null
          chief_complaint?: string | null
          consultation_date?: string
          created_at?: string
          diagnosis?: Json | null
          doctor_id: string
          examination?: Json | null
          family_history?: string | null
          follow_up_date?: string | null
          follow_up_notes?: string | null
          history_of_present_illness?: string | null
          hospital_id: string
          id?: string
          past_history?: string | null
          patient_id: string
          updated_at?: string
          visit_id?: string | null
        }
        Update: {
          advice?: string | null
          chief_complaint?: string | null
          consultation_date?: string
          created_at?: string
          diagnosis?: Json | null
          doctor_id?: string
          examination?: Json | null
          family_history?: string | null
          follow_up_date?: string | null
          follow_up_notes?: string | null
          history_of_present_illness?: string | null
          hospital_id?: string
          id?: string
          past_history?: string | null
          patient_id?: string
          updated_at?: string
          visit_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "consultations_doctor_id_fkey"
            columns: ["doctor_id"]
            isOneToOne: false
            referencedRelation: "doctors"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "consultations_hospital_id_fkey"
            columns: ["hospital_id"]
            isOneToOne: false
            referencedRelation: "hospitals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "consultations_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "consultations_visit_id_fkey"
            columns: ["visit_id"]
            isOneToOne: false
            referencedRelation: "opd_visits"
            referencedColumns: ["id"]
          },
        ]
      }
      departments: {
        Row: {
          code: string
          created_at: string
          description: string | null
          head_doctor_id: string | null
          hospital_id: string
          id: string
          is_active: boolean
          name: string
          updated_at: string
        }
        Insert: {
          code: string
          created_at?: string
          description?: string | null
          head_doctor_id?: string | null
          hospital_id: string
          id?: string
          is_active?: boolean
          name: string
          updated_at?: string
        }
        Update: {
          code?: string
          created_at?: string
          description?: string | null
          head_doctor_id?: string | null
          hospital_id?: string
          id?: string
          is_active?: boolean
          name?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "departments_head_doctor_fk"
            columns: ["head_doctor_id"]
            isOneToOne: false
            referencedRelation: "doctors"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "departments_hospital_id_fkey"
            columns: ["hospital_id"]
            isOneToOne: false
            referencedRelation: "hospitals"
            referencedColumns: ["id"]
          },
        ]
      }
      diagnoses: {
        Row: {
          category: string | null
          created_at: string
          hospital_id: string
          icd_code: string | null
          id: string
          is_active: boolean
          name: string
        }
        Insert: {
          category?: string | null
          created_at?: string
          hospital_id: string
          icd_code?: string | null
          id?: string
          is_active?: boolean
          name: string
        }
        Update: {
          category?: string | null
          created_at?: string
          hospital_id?: string
          icd_code?: string | null
          id?: string
          is_active?: boolean
          name?: string
        }
        Relationships: [
          {
            foreignKeyName: "diagnoses_hospital_id_fkey"
            columns: ["hospital_id"]
            isOneToOne: false
            referencedRelation: "hospitals"
            referencedColumns: ["id"]
          },
        ]
      }
      doctor_rounds: {
        Row: {
          admission_id: string
          created_at: string
          doctor_id: string | null
          id: string
          notes: string | null
          plan: string | null
          round_time: string
        }
        Insert: {
          admission_id: string
          created_at?: string
          doctor_id?: string | null
          id?: string
          notes?: string | null
          plan?: string | null
          round_time?: string
        }
        Update: {
          admission_id?: string
          created_at?: string
          doctor_id?: string | null
          id?: string
          notes?: string | null
          plan?: string | null
          round_time?: string
        }
        Relationships: [
          {
            foreignKeyName: "doctor_rounds_admission_id_fkey"
            columns: ["admission_id"]
            isOneToOne: false
            referencedRelation: "admissions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "doctor_rounds_doctor_id_fkey"
            columns: ["doctor_id"]
            isOneToOne: false
            referencedRelation: "doctors"
            referencedColumns: ["id"]
          },
        ]
      }
      doctors: {
        Row: {
          consultation_fee: number | null
          created_at: string
          department_id: string | null
          designation: string | null
          email: string | null
          experience_years: number | null
          follow_up_fee: number | null
          full_name: string
          hospital_id: string
          id: string
          is_active: boolean
          is_available: boolean
          phone: string | null
          qualification: string | null
          registration_number: string | null
          signature_url: string | null
          specialization: string | null
          updated_at: string
          user_id: string | null
        }
        Insert: {
          consultation_fee?: number | null
          created_at?: string
          department_id?: string | null
          designation?: string | null
          email?: string | null
          experience_years?: number | null
          follow_up_fee?: number | null
          full_name: string
          hospital_id: string
          id?: string
          is_active?: boolean
          is_available?: boolean
          phone?: string | null
          qualification?: string | null
          registration_number?: string | null
          signature_url?: string | null
          specialization?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          consultation_fee?: number | null
          created_at?: string
          department_id?: string | null
          designation?: string | null
          email?: string | null
          experience_years?: number | null
          follow_up_fee?: number | null
          full_name?: string
          hospital_id?: string
          id?: string
          is_active?: boolean
          is_available?: boolean
          phone?: string | null
          qualification?: string | null
          registration_number?: string | null
          signature_url?: string | null
          specialization?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "doctors_department_id_fkey"
            columns: ["department_id"]
            isOneToOne: false
            referencedRelation: "departments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "doctors_hospital_id_fkey"
            columns: ["hospital_id"]
            isOneToOne: false
            referencedRelation: "hospitals"
            referencedColumns: ["id"]
          },
        ]
      }
      emergency_cases: {
        Row: {
          arrival_time: string
          attending_doctor_id: string | null
          case_number: string
          chief_complaint: string | null
          created_at: string
          hospital_id: string
          id: string
          notes: string | null
          patient_id: string | null
          patient_name: string | null
          patient_phone: string | null
          status: string | null
          triage_level: string | null
        }
        Insert: {
          arrival_time?: string
          attending_doctor_id?: string | null
          case_number: string
          chief_complaint?: string | null
          created_at?: string
          hospital_id: string
          id?: string
          notes?: string | null
          patient_id?: string | null
          patient_name?: string | null
          patient_phone?: string | null
          status?: string | null
          triage_level?: string | null
        }
        Update: {
          arrival_time?: string
          attending_doctor_id?: string | null
          case_number?: string
          chief_complaint?: string | null
          created_at?: string
          hospital_id?: string
          id?: string
          notes?: string | null
          patient_id?: string | null
          patient_name?: string | null
          patient_phone?: string | null
          status?: string | null
          triage_level?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "emergency_cases_attending_doctor_id_fkey"
            columns: ["attending_doctor_id"]
            isOneToOne: false
            referencedRelation: "doctors"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "emergency_cases_hospital_id_fkey"
            columns: ["hospital_id"]
            isOneToOne: false
            referencedRelation: "hospitals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "emergency_cases_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
        ]
      }
      hospitals: {
        Row: {
          address: string | null
          bed_count: number | null
          city: string | null
          country: string | null
          created_at: string
          email: string | null
          id: string
          is_active: boolean
          logo_url: string | null
          name: string
          phone: string | null
          pincode: string | null
          registration_number: string | null
          state: string | null
          updated_at: string
          website: string | null
        }
        Insert: {
          address?: string | null
          bed_count?: number | null
          city?: string | null
          country?: string | null
          created_at?: string
          email?: string | null
          id?: string
          is_active?: boolean
          logo_url?: string | null
          name: string
          phone?: string | null
          pincode?: string | null
          registration_number?: string | null
          state?: string | null
          updated_at?: string
          website?: string | null
        }
        Update: {
          address?: string | null
          bed_count?: number | null
          city?: string | null
          country?: string | null
          created_at?: string
          email?: string | null
          id?: string
          is_active?: boolean
          logo_url?: string | null
          name?: string
          phone?: string | null
          pincode?: string | null
          registration_number?: string | null
          state?: string | null
          updated_at?: string
          website?: string | null
        }
        Relationships: []
      }
      insurance_claims: {
        Row: {
          admission_date: string | null
          admission_id: string | null
          approved_amount: number | null
          approved_at: string | null
          bill_id: string | null
          claim_number: string
          claim_type: string
          claimed_amount: number
          created_at: string
          created_by: string | null
          deduction_amount: number | null
          deduction_reason: string | null
          diagnosis: string | null
          discharge_date: string | null
          documents: Json | null
          hospital_id: string
          id: string
          member_id: string | null
          patient_id: string
          policy_number: string | null
          provider_id: string | null
          query_details: string | null
          query_response: string | null
          rejection_reason: string | null
          remarks: string | null
          settled_amount: number | null
          settled_at: string | null
          status: string
          submitted_at: string | null
          treatment_summary: string | null
          updated_at: string
        }
        Insert: {
          admission_date?: string | null
          admission_id?: string | null
          approved_amount?: number | null
          approved_at?: string | null
          bill_id?: string | null
          claim_number: string
          claim_type?: string
          claimed_amount?: number
          created_at?: string
          created_by?: string | null
          deduction_amount?: number | null
          deduction_reason?: string | null
          diagnosis?: string | null
          discharge_date?: string | null
          documents?: Json | null
          hospital_id: string
          id?: string
          member_id?: string | null
          patient_id: string
          policy_number?: string | null
          provider_id?: string | null
          query_details?: string | null
          query_response?: string | null
          rejection_reason?: string | null
          remarks?: string | null
          settled_amount?: number | null
          settled_at?: string | null
          status?: string
          submitted_at?: string | null
          treatment_summary?: string | null
          updated_at?: string
        }
        Update: {
          admission_date?: string | null
          admission_id?: string | null
          approved_amount?: number | null
          approved_at?: string | null
          bill_id?: string | null
          claim_number?: string
          claim_type?: string
          claimed_amount?: number
          created_at?: string
          created_by?: string | null
          deduction_amount?: number | null
          deduction_reason?: string | null
          diagnosis?: string | null
          discharge_date?: string | null
          documents?: Json | null
          hospital_id?: string
          id?: string
          member_id?: string | null
          patient_id?: string
          policy_number?: string | null
          provider_id?: string | null
          query_details?: string | null
          query_response?: string | null
          rejection_reason?: string | null
          remarks?: string | null
          settled_amount?: number | null
          settled_at?: string | null
          status?: string
          submitted_at?: string | null
          treatment_summary?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "insurance_claims_admission_id_fkey"
            columns: ["admission_id"]
            isOneToOne: false
            referencedRelation: "admissions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "insurance_claims_bill_id_fkey"
            columns: ["bill_id"]
            isOneToOne: false
            referencedRelation: "invoices"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "insurance_claims_hospital_id_fkey"
            columns: ["hospital_id"]
            isOneToOne: false
            referencedRelation: "hospitals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "insurance_claims_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "insurance_claims_provider_id_fkey"
            columns: ["provider_id"]
            isOneToOne: false
            referencedRelation: "insurance_providers"
            referencedColumns: ["id"]
          },
        ]
      }
      insurance_providers: {
        Row: {
          address: string | null
          contact_person: string | null
          created_at: string
          discount_percentage: number | null
          email: string | null
          gst_number: string | null
          hospital_id: string
          id: string
          is_active: boolean
          name: string
          notes: string | null
          pan_number: string | null
          phone: string | null
          provider_type: string
          settlement_period_days: number | null
          updated_at: string
        }
        Insert: {
          address?: string | null
          contact_person?: string | null
          created_at?: string
          discount_percentage?: number | null
          email?: string | null
          gst_number?: string | null
          hospital_id: string
          id?: string
          is_active?: boolean
          name: string
          notes?: string | null
          pan_number?: string | null
          phone?: string | null
          provider_type?: string
          settlement_period_days?: number | null
          updated_at?: string
        }
        Update: {
          address?: string | null
          contact_person?: string | null
          created_at?: string
          discount_percentage?: number | null
          email?: string | null
          gst_number?: string | null
          hospital_id?: string
          id?: string
          is_active?: boolean
          name?: string
          notes?: string | null
          pan_number?: string | null
          phone?: string | null
          provider_type?: string
          settlement_period_days?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "insurance_providers_hospital_id_fkey"
            columns: ["hospital_id"]
            isOneToOne: false
            referencedRelation: "hospitals"
            referencedColumns: ["id"]
          },
        ]
      }
      investigations: {
        Row: {
          category: string | null
          created_at: string
          hospital_id: string
          id: string
          is_active: boolean
          name: string
        }
        Insert: {
          category?: string | null
          created_at?: string
          hospital_id: string
          id?: string
          is_active?: boolean
          name: string
        }
        Update: {
          category?: string | null
          created_at?: string
          hospital_id?: string
          id?: string
          is_active?: boolean
          name?: string
        }
        Relationships: [
          {
            foreignKeyName: "investigations_hospital_id_fkey"
            columns: ["hospital_id"]
            isOneToOne: false
            referencedRelation: "hospitals"
            referencedColumns: ["id"]
          },
        ]
      }
      invoice_items: {
        Row: {
          created_at: string
          description: string
          discount: number | null
          id: string
          invoice_id: string
          quantity: number
          service_item_id: string | null
          tax_amount: number | null
          total: number
          unit_price: number
        }
        Insert: {
          created_at?: string
          description: string
          discount?: number | null
          id?: string
          invoice_id: string
          quantity?: number
          service_item_id?: string | null
          tax_amount?: number | null
          total?: number
          unit_price?: number
        }
        Update: {
          created_at?: string
          description?: string
          discount?: number | null
          id?: string
          invoice_id?: string
          quantity?: number
          service_item_id?: string | null
          tax_amount?: number | null
          total?: number
          unit_price?: number
        }
        Relationships: [
          {
            foreignKeyName: "invoice_items_invoice_id_fkey"
            columns: ["invoice_id"]
            isOneToOne: false
            referencedRelation: "invoices"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoice_items_service_item_id_fkey"
            columns: ["service_item_id"]
            isOneToOne: false
            referencedRelation: "service_items"
            referencedColumns: ["id"]
          },
        ]
      }
      invoices: {
        Row: {
          admission_id: string | null
          amount_paid: number
          bill_date: string
          bill_number: string
          bill_type: string
          consultation_id: string | null
          created_at: string
          created_by: string | null
          discount_amount: number | null
          discount_percentage: number | null
          hospital_id: string
          id: string
          notes: string | null
          patient_id: string
          payment_mode: string | null
          payment_reference: string | null
          payment_status: Database["public"]["Enums"]["payment_status"]
          subtotal: number
          tax_amount: number | null
          tax_percentage: number | null
          total_amount: number
          updated_at: string
        }
        Insert: {
          admission_id?: string | null
          amount_paid?: number
          bill_date?: string
          bill_number: string
          bill_type?: string
          consultation_id?: string | null
          created_at?: string
          created_by?: string | null
          discount_amount?: number | null
          discount_percentage?: number | null
          hospital_id: string
          id?: string
          notes?: string | null
          patient_id: string
          payment_mode?: string | null
          payment_reference?: string | null
          payment_status?: Database["public"]["Enums"]["payment_status"]
          subtotal?: number
          tax_amount?: number | null
          tax_percentage?: number | null
          total_amount?: number
          updated_at?: string
        }
        Update: {
          admission_id?: string | null
          amount_paid?: number
          bill_date?: string
          bill_number?: string
          bill_type?: string
          consultation_id?: string | null
          created_at?: string
          created_by?: string | null
          discount_amount?: number | null
          discount_percentage?: number | null
          hospital_id?: string
          id?: string
          notes?: string | null
          patient_id?: string
          payment_mode?: string | null
          payment_reference?: string | null
          payment_status?: Database["public"]["Enums"]["payment_status"]
          subtotal?: number
          tax_amount?: number | null
          tax_percentage?: number | null
          total_amount?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "invoices_admission_id_fkey"
            columns: ["admission_id"]
            isOneToOne: false
            referencedRelation: "admissions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoices_consultation_id_fkey"
            columns: ["consultation_id"]
            isOneToOne: false
            referencedRelation: "consultations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoices_hospital_id_fkey"
            columns: ["hospital_id"]
            isOneToOne: false
            referencedRelation: "hospitals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoices_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
        ]
      }
      ipd_vitals: {
        Row: {
          admission_id: string
          bp_diastolic: number | null
          bp_systolic: number | null
          id: string
          intake_ml: number | null
          notes: string | null
          output_ml: number | null
          pulse: number | null
          recorded_at: string
          recorded_by: string | null
          respiratory_rate: number | null
          spo2: number | null
          temperature: number | null
        }
        Insert: {
          admission_id: string
          bp_diastolic?: number | null
          bp_systolic?: number | null
          id?: string
          intake_ml?: number | null
          notes?: string | null
          output_ml?: number | null
          pulse?: number | null
          recorded_at?: string
          recorded_by?: string | null
          respiratory_rate?: number | null
          spo2?: number | null
          temperature?: number | null
        }
        Update: {
          admission_id?: string
          bp_diastolic?: number | null
          bp_systolic?: number | null
          id?: string
          intake_ml?: number | null
          notes?: string | null
          output_ml?: number | null
          pulse?: number | null
          recorded_at?: string
          recorded_by?: string | null
          respiratory_rate?: number | null
          spo2?: number | null
          temperature?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "ipd_vitals_admission_id_fkey"
            columns: ["admission_id"]
            isOneToOne: false
            referencedRelation: "admissions"
            referencedColumns: ["id"]
          },
        ]
      }
      lab_order_items: {
        Row: {
          created_at: string
          id: string
          is_abnormal: boolean | null
          normal_range: string | null
          order_id: string
          result: string | null
          sample_collected_at: string | null
          status: string | null
          test_id: string | null
          test_name: string
          units: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          is_abnormal?: boolean | null
          normal_range?: string | null
          order_id: string
          result?: string | null
          sample_collected_at?: string | null
          status?: string | null
          test_id?: string | null
          test_name: string
          units?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          is_abnormal?: boolean | null
          normal_range?: string | null
          order_id?: string
          result?: string | null
          sample_collected_at?: string | null
          status?: string | null
          test_id?: string | null
          test_name?: string
          units?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "lab_order_items_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "lab_orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lab_order_items_test_id_fkey"
            columns: ["test_id"]
            isOneToOne: false
            referencedRelation: "lab_tests"
            referencedColumns: ["id"]
          },
        ]
      }
      lab_orders: {
        Row: {
          consultation_id: string | null
          created_at: string
          doctor_id: string | null
          hospital_id: string
          id: string
          notes: string | null
          order_date: string
          order_number: string
          patient_id: string
          priority: string | null
          status: Database["public"]["Enums"]["lab_order_status"]
          updated_at: string
        }
        Insert: {
          consultation_id?: string | null
          created_at?: string
          doctor_id?: string | null
          hospital_id: string
          id?: string
          notes?: string | null
          order_date?: string
          order_number: string
          patient_id: string
          priority?: string | null
          status?: Database["public"]["Enums"]["lab_order_status"]
          updated_at?: string
        }
        Update: {
          consultation_id?: string | null
          created_at?: string
          doctor_id?: string | null
          hospital_id?: string
          id?: string
          notes?: string | null
          order_date?: string
          order_number?: string
          patient_id?: string
          priority?: string | null
          status?: Database["public"]["Enums"]["lab_order_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "lab_orders_consultation_id_fkey"
            columns: ["consultation_id"]
            isOneToOne: false
            referencedRelation: "consultations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lab_orders_doctor_id_fkey"
            columns: ["doctor_id"]
            isOneToOne: false
            referencedRelation: "doctors"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lab_orders_hospital_id_fkey"
            columns: ["hospital_id"]
            isOneToOne: false
            referencedRelation: "hospitals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lab_orders_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
        ]
      }
      lab_tests: {
        Row: {
          category: string | null
          code: string | null
          created_at: string
          hospital_id: string
          id: string
          is_active: boolean
          name: string
          normal_range: string | null
          price: number | null
          sample_type: string | null
          turnaround_hours: number | null
          units: string | null
        }
        Insert: {
          category?: string | null
          code?: string | null
          created_at?: string
          hospital_id: string
          id?: string
          is_active?: boolean
          name: string
          normal_range?: string | null
          price?: number | null
          sample_type?: string | null
          turnaround_hours?: number | null
          units?: string | null
        }
        Update: {
          category?: string | null
          code?: string | null
          created_at?: string
          hospital_id?: string
          id?: string
          is_active?: boolean
          name?: string
          normal_range?: string | null
          price?: number | null
          sample_type?: string | null
          turnaround_hours?: number | null
          units?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "lab_tests_hospital_id_fkey"
            columns: ["hospital_id"]
            isOneToOne: false
            referencedRelation: "hospitals"
            referencedColumns: ["id"]
          },
        ]
      }
      leave_requests: {
        Row: {
          approved_by: string | null
          created_at: string
          from_date: string
          id: string
          leave_type: string
          reason: string | null
          staff_id: string
          status: string | null
          to_date: string
          total_days: number
        }
        Insert: {
          approved_by?: string | null
          created_at?: string
          from_date: string
          id?: string
          leave_type: string
          reason?: string | null
          staff_id: string
          status?: string | null
          to_date: string
          total_days: number
        }
        Update: {
          approved_by?: string | null
          created_at?: string
          from_date?: string
          id?: string
          leave_type?: string
          reason?: string | null
          staff_id?: string
          status?: string | null
          to_date?: string
          total_days?: number
        }
        Relationships: [
          {
            foreignKeyName: "leave_requests_staff_id_fkey"
            columns: ["staff_id"]
            isOneToOne: false
            referencedRelation: "staff"
            referencedColumns: ["id"]
          },
        ]
      }
      medications: {
        Row: {
          brand: string | null
          category: string | null
          created_at: string
          form: string | null
          generic_name: string | null
          gst_percentage: number | null
          hospital_id: string
          hsn_code: string | null
          id: string
          is_active: boolean
          manufacturer: string | null
          mrp: number | null
          name: string
          reorder_level: number | null
          sale_price: number | null
          strength: string | null
          unit: string
          updated_at: string
        }
        Insert: {
          brand?: string | null
          category?: string | null
          created_at?: string
          form?: string | null
          generic_name?: string | null
          gst_percentage?: number | null
          hospital_id: string
          hsn_code?: string | null
          id?: string
          is_active?: boolean
          manufacturer?: string | null
          mrp?: number | null
          name: string
          reorder_level?: number | null
          sale_price?: number | null
          strength?: string | null
          unit?: string
          updated_at?: string
        }
        Update: {
          brand?: string | null
          category?: string | null
          created_at?: string
          form?: string | null
          generic_name?: string | null
          gst_percentage?: number | null
          hospital_id?: string
          hsn_code?: string | null
          id?: string
          is_active?: boolean
          manufacturer?: string | null
          mrp?: number | null
          name?: string
          reorder_level?: number | null
          sale_price?: number | null
          strength?: string | null
          unit?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "medications_hospital_id_fkey"
            columns: ["hospital_id"]
            isOneToOne: false
            referencedRelation: "hospitals"
            referencedColumns: ["id"]
          },
        ]
      }
      nursing_notes: {
        Row: {
          admission_id: string
          created_at: string
          id: string
          note: string
          recorded_by: string | null
          shift: string | null
        }
        Insert: {
          admission_id: string
          created_at?: string
          id?: string
          note: string
          recorded_by?: string | null
          shift?: string | null
        }
        Update: {
          admission_id?: string
          created_at?: string
          id?: string
          note?: string
          recorded_by?: string | null
          shift?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "nursing_notes_admission_id_fkey"
            columns: ["admission_id"]
            isOneToOne: false
            referencedRelation: "admissions"
            referencedColumns: ["id"]
          },
        ]
      }
      nursing_tasks: {
        Row: {
          admission_id: string
          completed_at: string | null
          completed_by: string | null
          created_at: string
          id: string
          notes: string | null
          scheduled_at: string
          status: string | null
          task: string
        }
        Insert: {
          admission_id: string
          completed_at?: string | null
          completed_by?: string | null
          created_at?: string
          id?: string
          notes?: string | null
          scheduled_at: string
          status?: string | null
          task: string
        }
        Update: {
          admission_id?: string
          completed_at?: string | null
          completed_by?: string | null
          created_at?: string
          id?: string
          notes?: string | null
          scheduled_at?: string
          status?: string | null
          task?: string
        }
        Relationships: [
          {
            foreignKeyName: "nursing_tasks_admission_id_fkey"
            columns: ["admission_id"]
            isOneToOne: false
            referencedRelation: "admissions"
            referencedColumns: ["id"]
          },
        ]
      }
      opd_visits: {
        Row: {
          appointment_id: string | null
          chief_complaint: string | null
          created_at: string
          doctor_id: string
          hospital_id: string
          id: string
          patient_id: string
          status: Database["public"]["Enums"]["visit_status"]
          updated_at: string
          visit_date: string
          visit_number: string
        }
        Insert: {
          appointment_id?: string | null
          chief_complaint?: string | null
          created_at?: string
          doctor_id: string
          hospital_id: string
          id?: string
          patient_id: string
          status?: Database["public"]["Enums"]["visit_status"]
          updated_at?: string
          visit_date?: string
          visit_number: string
        }
        Update: {
          appointment_id?: string | null
          chief_complaint?: string | null
          created_at?: string
          doctor_id?: string
          hospital_id?: string
          id?: string
          patient_id?: string
          status?: Database["public"]["Enums"]["visit_status"]
          updated_at?: string
          visit_date?: string
          visit_number?: string
        }
        Relationships: [
          {
            foreignKeyName: "opd_visits_appointment_id_fkey"
            columns: ["appointment_id"]
            isOneToOne: false
            referencedRelation: "appointments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "opd_visits_doctor_id_fkey"
            columns: ["doctor_id"]
            isOneToOne: false
            referencedRelation: "doctors"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "opd_visits_hospital_id_fkey"
            columns: ["hospital_id"]
            isOneToOne: false
            referencedRelation: "hospitals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "opd_visits_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
        ]
      }
      ot_bookings: {
        Row: {
          actual_end: string | null
          actual_start: string | null
          anaesthetist_id: string | null
          created_at: string
          hospital_id: string
          id: string
          notes: string | null
          patient_id: string
          pre_op_checklist: Json | null
          primary_surgeon_id: string | null
          scheduled_end: string | null
          scheduled_start: string
          status: Database["public"]["Enums"]["ot_status"]
          surgery_name: string
          theatre_name: string | null
          updated_at: string
        }
        Insert: {
          actual_end?: string | null
          actual_start?: string | null
          anaesthetist_id?: string | null
          created_at?: string
          hospital_id: string
          id?: string
          notes?: string | null
          patient_id: string
          pre_op_checklist?: Json | null
          primary_surgeon_id?: string | null
          scheduled_end?: string | null
          scheduled_start: string
          status?: Database["public"]["Enums"]["ot_status"]
          surgery_name: string
          theatre_name?: string | null
          updated_at?: string
        }
        Update: {
          actual_end?: string | null
          actual_start?: string | null
          anaesthetist_id?: string | null
          created_at?: string
          hospital_id?: string
          id?: string
          notes?: string | null
          patient_id?: string
          pre_op_checklist?: Json | null
          primary_surgeon_id?: string | null
          scheduled_end?: string | null
          scheduled_start?: string
          status?: Database["public"]["Enums"]["ot_status"]
          surgery_name?: string
          theatre_name?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "ot_bookings_anaesthetist_id_fkey"
            columns: ["anaesthetist_id"]
            isOneToOne: false
            referencedRelation: "doctors"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ot_bookings_hospital_id_fkey"
            columns: ["hospital_id"]
            isOneToOne: false
            referencedRelation: "hospitals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ot_bookings_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ot_bookings_primary_surgeon_id_fkey"
            columns: ["primary_surgeon_id"]
            isOneToOne: false
            referencedRelation: "doctors"
            referencedColumns: ["id"]
          },
        ]
      }
      ot_team_members: {
        Row: {
          booking_id: string
          created_at: string
          id: string
          role: string
          staff_name: string
        }
        Insert: {
          booking_id: string
          created_at?: string
          id?: string
          role: string
          staff_name: string
        }
        Update: {
          booking_id?: string
          created_at?: string
          id?: string
          role?: string
          staff_name?: string
        }
        Relationships: [
          {
            foreignKeyName: "ot_team_members_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "ot_bookings"
            referencedColumns: ["id"]
          },
        ]
      }
      patients: {
        Row: {
          aadhar_number: string | null
          address: string | null
          age: number | null
          allergies: string[] | null
          alt_phone: string | null
          billing_category: string | null
          blood_group: string | null
          city: string | null
          created_at: string
          current_medications: string | null
          date_of_birth: string | null
          email: string | null
          emergency_contact_name: string | null
          emergency_contact_phone: string | null
          first_name: string
          full_name: string
          gender: string | null
          guardian_name: string | null
          guardian_phone: string | null
          guardian_relation: string | null
          hospital_id: string
          id: string
          insurance_provider_id: string | null
          is_active: boolean
          last_name: string | null
          marital_status: string | null
          member_id: string | null
          middle_name: string | null
          phone: string
          photo_url: string | null
          pincode: string | null
          policy_number: string | null
          pre_existing_conditions: string[] | null
          registration_type: string | null
          state: string | null
          uhid: string
          updated_at: string
        }
        Insert: {
          aadhar_number?: string | null
          address?: string | null
          age?: number | null
          allergies?: string[] | null
          alt_phone?: string | null
          billing_category?: string | null
          blood_group?: string | null
          city?: string | null
          created_at?: string
          current_medications?: string | null
          date_of_birth?: string | null
          email?: string | null
          emergency_contact_name?: string | null
          emergency_contact_phone?: string | null
          first_name: string
          full_name: string
          gender?: string | null
          guardian_name?: string | null
          guardian_phone?: string | null
          guardian_relation?: string | null
          hospital_id: string
          id?: string
          insurance_provider_id?: string | null
          is_active?: boolean
          last_name?: string | null
          marital_status?: string | null
          member_id?: string | null
          middle_name?: string | null
          phone: string
          photo_url?: string | null
          pincode?: string | null
          policy_number?: string | null
          pre_existing_conditions?: string[] | null
          registration_type?: string | null
          state?: string | null
          uhid: string
          updated_at?: string
        }
        Update: {
          aadhar_number?: string | null
          address?: string | null
          age?: number | null
          allergies?: string[] | null
          alt_phone?: string | null
          billing_category?: string | null
          blood_group?: string | null
          city?: string | null
          created_at?: string
          current_medications?: string | null
          date_of_birth?: string | null
          email?: string | null
          emergency_contact_name?: string | null
          emergency_contact_phone?: string | null
          first_name?: string
          full_name?: string
          gender?: string | null
          guardian_name?: string | null
          guardian_phone?: string | null
          guardian_relation?: string | null
          hospital_id?: string
          id?: string
          insurance_provider_id?: string | null
          is_active?: boolean
          last_name?: string | null
          marital_status?: string | null
          member_id?: string | null
          middle_name?: string | null
          phone?: string
          photo_url?: string | null
          pincode?: string | null
          policy_number?: string | null
          pre_existing_conditions?: string[] | null
          registration_type?: string | null
          state?: string | null
          uhid?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "patients_hospital_id_fkey"
            columns: ["hospital_id"]
            isOneToOne: false
            referencedRelation: "hospitals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "patients_insurance_provider_id_fkey"
            columns: ["insurance_provider_id"]
            isOneToOne: false
            referencedRelation: "insurance_providers"
            referencedColumns: ["id"]
          },
        ]
      }
      payments: {
        Row: {
          amount: number
          created_at: string
          hospital_id: string
          id: string
          invoice_id: string | null
          notes: string | null
          patient_id: string | null
          payment_date: string
          payment_mode: string
          received_by: string | null
          reference: string | null
        }
        Insert: {
          amount: number
          created_at?: string
          hospital_id: string
          id?: string
          invoice_id?: string | null
          notes?: string | null
          patient_id?: string | null
          payment_date?: string
          payment_mode: string
          received_by?: string | null
          reference?: string | null
        }
        Update: {
          amount?: number
          created_at?: string
          hospital_id?: string
          id?: string
          invoice_id?: string | null
          notes?: string | null
          patient_id?: string | null
          payment_date?: string
          payment_mode?: string
          received_by?: string | null
          reference?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "payments_hospital_id_fkey"
            columns: ["hospital_id"]
            isOneToOne: false
            referencedRelation: "hospitals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payments_invoice_id_fkey"
            columns: ["invoice_id"]
            isOneToOne: false
            referencedRelation: "invoices"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payments_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
        ]
      }
      pharmacy_purchase_items: {
        Row: {
          batch_number: string | null
          cost_price: number
          created_at: string
          expiry_date: string | null
          id: string
          medication_id: string
          mrp: number | null
          purchase_id: string
          quantity: number
          total: number
        }
        Insert: {
          batch_number?: string | null
          cost_price: number
          created_at?: string
          expiry_date?: string | null
          id?: string
          medication_id: string
          mrp?: number | null
          purchase_id: string
          quantity: number
          total: number
        }
        Update: {
          batch_number?: string | null
          cost_price?: number
          created_at?: string
          expiry_date?: string | null
          id?: string
          medication_id?: string
          mrp?: number | null
          purchase_id?: string
          quantity?: number
          total?: number
        }
        Relationships: [
          {
            foreignKeyName: "pharmacy_purchase_items_medication_id_fkey"
            columns: ["medication_id"]
            isOneToOne: false
            referencedRelation: "medications"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pharmacy_purchase_items_purchase_id_fkey"
            columns: ["purchase_id"]
            isOneToOne: false
            referencedRelation: "pharmacy_purchases"
            referencedColumns: ["id"]
          },
        ]
      }
      pharmacy_purchases: {
        Row: {
          created_at: string
          created_by: string | null
          hospital_id: string
          id: string
          invoice_date: string | null
          invoice_number: string | null
          notes: string | null
          purchase_number: string
          subtotal: number | null
          supplier_name: string
          tax_amount: number | null
          total_amount: number | null
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          hospital_id: string
          id?: string
          invoice_date?: string | null
          invoice_number?: string | null
          notes?: string | null
          purchase_number: string
          subtotal?: number | null
          supplier_name: string
          tax_amount?: number | null
          total_amount?: number | null
        }
        Update: {
          created_at?: string
          created_by?: string | null
          hospital_id?: string
          id?: string
          invoice_date?: string | null
          invoice_number?: string | null
          notes?: string | null
          purchase_number?: string
          subtotal?: number | null
          supplier_name?: string
          tax_amount?: number | null
          total_amount?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "pharmacy_purchases_hospital_id_fkey"
            columns: ["hospital_id"]
            isOneToOne: false
            referencedRelation: "hospitals"
            referencedColumns: ["id"]
          },
        ]
      }
      pharmacy_sale_items: {
        Row: {
          batch_number: string | null
          created_at: string
          id: string
          medication_id: string
          quantity: number
          sale_id: string
          total: number
          unit_price: number
        }
        Insert: {
          batch_number?: string | null
          created_at?: string
          id?: string
          medication_id: string
          quantity: number
          sale_id: string
          total: number
          unit_price: number
        }
        Update: {
          batch_number?: string | null
          created_at?: string
          id?: string
          medication_id?: string
          quantity?: number
          sale_id?: string
          total?: number
          unit_price?: number
        }
        Relationships: [
          {
            foreignKeyName: "pharmacy_sale_items_medication_id_fkey"
            columns: ["medication_id"]
            isOneToOne: false
            referencedRelation: "medications"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pharmacy_sale_items_sale_id_fkey"
            columns: ["sale_id"]
            isOneToOne: false
            referencedRelation: "pharmacy_sales"
            referencedColumns: ["id"]
          },
        ]
      }
      pharmacy_sales: {
        Row: {
          created_at: string
          created_by: string | null
          discount: number | null
          hospital_id: string
          id: string
          patient_id: string | null
          payment_mode: string | null
          prescription_id: string | null
          sale_date: string
          sale_number: string
          subtotal: number | null
          tax_amount: number | null
          total_amount: number | null
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          discount?: number | null
          hospital_id: string
          id?: string
          patient_id?: string | null
          payment_mode?: string | null
          prescription_id?: string | null
          sale_date?: string
          sale_number: string
          subtotal?: number | null
          tax_amount?: number | null
          total_amount?: number | null
        }
        Update: {
          created_at?: string
          created_by?: string | null
          discount?: number | null
          hospital_id?: string
          id?: string
          patient_id?: string | null
          payment_mode?: string | null
          prescription_id?: string | null
          sale_date?: string
          sale_number?: string
          subtotal?: number | null
          tax_amount?: number | null
          total_amount?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "pharmacy_sales_hospital_id_fkey"
            columns: ["hospital_id"]
            isOneToOne: false
            referencedRelation: "hospitals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pharmacy_sales_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pharmacy_sales_prescription_id_fkey"
            columns: ["prescription_id"]
            isOneToOne: false
            referencedRelation: "prescriptions"
            referencedColumns: ["id"]
          },
        ]
      }
      pharmacy_stock: {
        Row: {
          batch_number: string | null
          cost_price: number | null
          expiry_date: string | null
          hospital_id: string
          id: string
          medication_id: string
          mrp: number | null
          quantity: number
          updated_at: string
        }
        Insert: {
          batch_number?: string | null
          cost_price?: number | null
          expiry_date?: string | null
          hospital_id: string
          id?: string
          medication_id: string
          mrp?: number | null
          quantity?: number
          updated_at?: string
        }
        Update: {
          batch_number?: string | null
          cost_price?: number | null
          expiry_date?: string | null
          hospital_id?: string
          id?: string
          medication_id?: string
          mrp?: number | null
          quantity?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "pharmacy_stock_hospital_id_fkey"
            columns: ["hospital_id"]
            isOneToOne: false
            referencedRelation: "hospitals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pharmacy_stock_medication_id_fkey"
            columns: ["medication_id"]
            isOneToOne: false
            referencedRelation: "medications"
            referencedColumns: ["id"]
          },
        ]
      }
      pre_authorizations: {
        Row: {
          admission_date: string | null
          approved_amount: number | null
          approved_at: string | null
          auth_number: string
          created_at: string
          created_by: string | null
          diagnosis: string | null
          documents: Json | null
          expected_los_days: number | null
          hospital_id: string
          id: string
          member_id: string | null
          patient_id: string
          planned_procedure: string | null
          policy_number: string | null
          provider_id: string | null
          rejection_reason: string | null
          remarks: string | null
          requested_amount: number
          status: string
          updated_at: string
          valid_until: string | null
        }
        Insert: {
          admission_date?: string | null
          approved_amount?: number | null
          approved_at?: string | null
          auth_number: string
          created_at?: string
          created_by?: string | null
          diagnosis?: string | null
          documents?: Json | null
          expected_los_days?: number | null
          hospital_id: string
          id?: string
          member_id?: string | null
          patient_id: string
          planned_procedure?: string | null
          policy_number?: string | null
          provider_id?: string | null
          rejection_reason?: string | null
          remarks?: string | null
          requested_amount?: number
          status?: string
          updated_at?: string
          valid_until?: string | null
        }
        Update: {
          admission_date?: string | null
          approved_amount?: number | null
          approved_at?: string | null
          auth_number?: string
          created_at?: string
          created_by?: string | null
          diagnosis?: string | null
          documents?: Json | null
          expected_los_days?: number | null
          hospital_id?: string
          id?: string
          member_id?: string | null
          patient_id?: string
          planned_procedure?: string | null
          policy_number?: string | null
          provider_id?: string | null
          rejection_reason?: string | null
          remarks?: string | null
          requested_amount?: number
          status?: string
          updated_at?: string
          valid_until?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "pre_authorizations_hospital_id_fkey"
            columns: ["hospital_id"]
            isOneToOne: false
            referencedRelation: "hospitals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pre_authorizations_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pre_authorizations_provider_id_fkey"
            columns: ["provider_id"]
            isOneToOne: false
            referencedRelation: "insurance_providers"
            referencedColumns: ["id"]
          },
        ]
      }
      prescription_items: {
        Row: {
          created_at: string
          dose: string | null
          drug_name: string
          duration: string | null
          frequency: string | null
          id: string
          instructions: string | null
          medication_id: string | null
          prescription_id: string
          quantity: number | null
          route: string | null
        }
        Insert: {
          created_at?: string
          dose?: string | null
          drug_name: string
          duration?: string | null
          frequency?: string | null
          id?: string
          instructions?: string | null
          medication_id?: string | null
          prescription_id: string
          quantity?: number | null
          route?: string | null
        }
        Update: {
          created_at?: string
          dose?: string | null
          drug_name?: string
          duration?: string | null
          frequency?: string | null
          id?: string
          instructions?: string | null
          medication_id?: string | null
          prescription_id?: string
          quantity?: number | null
          route?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "prescription_items_medication_id_fkey"
            columns: ["medication_id"]
            isOneToOne: false
            referencedRelation: "medications"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "prescription_items_prescription_id_fkey"
            columns: ["prescription_id"]
            isOneToOne: false
            referencedRelation: "prescriptions"
            referencedColumns: ["id"]
          },
        ]
      }
      prescriptions: {
        Row: {
          consultation_id: string | null
          created_at: string
          doctor_id: string
          hospital_id: string
          id: string
          notes: string | null
          patient_id: string
          prescription_number: string | null
        }
        Insert: {
          consultation_id?: string | null
          created_at?: string
          doctor_id: string
          hospital_id: string
          id?: string
          notes?: string | null
          patient_id: string
          prescription_number?: string | null
        }
        Update: {
          consultation_id?: string | null
          created_at?: string
          doctor_id?: string
          hospital_id?: string
          id?: string
          notes?: string | null
          patient_id?: string
          prescription_number?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "prescriptions_consultation_id_fkey"
            columns: ["consultation_id"]
            isOneToOne: false
            referencedRelation: "consultations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "prescriptions_doctor_id_fkey"
            columns: ["doctor_id"]
            isOneToOne: false
            referencedRelation: "doctors"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "prescriptions_hospital_id_fkey"
            columns: ["hospital_id"]
            isOneToOne: false
            referencedRelation: "hospitals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "prescriptions_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          department: string | null
          designation: string | null
          email: string | null
          full_name: string
          hospital_id: string | null
          id: string
          is_active: boolean
          phone: string | null
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          department?: string | null
          designation?: string | null
          email?: string | null
          full_name: string
          hospital_id?: string | null
          id: string
          is_active?: boolean
          phone?: string | null
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          department?: string | null
          designation?: string | null
          email?: string | null
          full_name?: string
          hospital_id?: string | null
          id?: string
          is_active?: boolean
          phone?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "profiles_hospital_id_fkey"
            columns: ["hospital_id"]
            isOneToOne: false
            referencedRelation: "hospitals"
            referencedColumns: ["id"]
          },
        ]
      }
      service_groups: {
        Row: {
          created_at: string
          description: string | null
          hospital_id: string
          id: string
          is_active: boolean
          name: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          hospital_id: string
          id?: string
          is_active?: boolean
          name: string
        }
        Update: {
          created_at?: string
          description?: string | null
          hospital_id?: string
          id?: string
          is_active?: boolean
          name?: string
        }
        Relationships: [
          {
            foreignKeyName: "service_groups_hospital_id_fkey"
            columns: ["hospital_id"]
            isOneToOne: false
            referencedRelation: "hospitals"
            referencedColumns: ["id"]
          },
        ]
      }
      service_items: {
        Row: {
          code: string | null
          created_at: string
          group_id: string | null
          hospital_id: string
          hsn_code: string | null
          id: string
          ipd_price: number | null
          is_active: boolean
          name: string
          opd_price: number | null
          service_type: string
          tax_percentage: number | null
          updated_at: string
        }
        Insert: {
          code?: string | null
          created_at?: string
          group_id?: string | null
          hospital_id: string
          hsn_code?: string | null
          id?: string
          ipd_price?: number | null
          is_active?: boolean
          name: string
          opd_price?: number | null
          service_type?: string
          tax_percentage?: number | null
          updated_at?: string
        }
        Update: {
          code?: string | null
          created_at?: string
          group_id?: string | null
          hospital_id?: string
          hsn_code?: string | null
          id?: string
          ipd_price?: number | null
          is_active?: boolean
          name?: string
          opd_price?: number | null
          service_type?: string
          tax_percentage?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "service_items_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "service_groups"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "service_items_hospital_id_fkey"
            columns: ["hospital_id"]
            isOneToOne: false
            referencedRelation: "hospitals"
            referencedColumns: ["id"]
          },
        ]
      }
      staff: {
        Row: {
          address: string | null
          city: string | null
          created_at: string
          date_of_birth: string | null
          date_of_joining: string
          department: string | null
          designation: string | null
          email: string | null
          employee_id: string
          employment_type: string | null
          first_name: string
          gender: string | null
          hospital_id: string
          id: string
          last_name: string | null
          phone: string | null
          salary: number | null
          status: string
          updated_at: string
          user_id: string | null
        }
        Insert: {
          address?: string | null
          city?: string | null
          created_at?: string
          date_of_birth?: string | null
          date_of_joining: string
          department?: string | null
          designation?: string | null
          email?: string | null
          employee_id: string
          employment_type?: string | null
          first_name: string
          gender?: string | null
          hospital_id: string
          id?: string
          last_name?: string | null
          phone?: string | null
          salary?: number | null
          status?: string
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          address?: string | null
          city?: string | null
          created_at?: string
          date_of_birth?: string | null
          date_of_joining?: string
          department?: string | null
          designation?: string | null
          email?: string | null
          employee_id?: string
          employment_type?: string | null
          first_name?: string
          gender?: string | null
          hospital_id?: string
          id?: string
          last_name?: string | null
          phone?: string | null
          salary?: number | null
          status?: string
          updated_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "staff_hospital_id_fkey"
            columns: ["hospital_id"]
            isOneToOne: false
            referencedRelation: "hospitals"
            referencedColumns: ["id"]
          },
        ]
      }
      symptoms: {
        Row: {
          category: string | null
          created_at: string
          hospital_id: string
          id: string
          is_active: boolean
          name: string
        }
        Insert: {
          category?: string | null
          created_at?: string
          hospital_id: string
          id?: string
          is_active?: boolean
          name: string
        }
        Update: {
          category?: string | null
          created_at?: string
          hospital_id?: string
          id?: string
          is_active?: boolean
          name?: string
        }
        Relationships: [
          {
            foreignKeyName: "symptoms_hospital_id_fkey"
            columns: ["hospital_id"]
            isOneToOne: false
            referencedRelation: "hospitals"
            referencedColumns: ["id"]
          },
        ]
      }
      system_settings: {
        Row: {
          hospital_id: string
          id: string
          key: string
          updated_at: string
          value: Json
        }
        Insert: {
          hospital_id: string
          id?: string
          key: string
          updated_at?: string
          value: Json
        }
        Update: {
          hospital_id?: string
          id?: string
          key?: string
          updated_at?: string
          value?: Json
        }
        Relationships: [
          {
            foreignKeyName: "system_settings_hospital_id_fkey"
            columns: ["hospital_id"]
            isOneToOne: false
            referencedRelation: "hospitals"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string
          hospital_id: string | null
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          hospital_id?: string | null
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          hospital_id?: string | null
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_roles_hospital_id_fkey"
            columns: ["hospital_id"]
            isOneToOne: false
            referencedRelation: "hospitals"
            referencedColumns: ["id"]
          },
        ]
      }
      vitals: {
        Row: {
          blood_sugar: number | null
          bmi: number | null
          bp_diastolic: number | null
          bp_systolic: number | null
          created_at: string
          height: number | null
          hospital_id: string
          id: string
          notes: string | null
          patient_id: string
          pulse: number | null
          recorded_at: string
          recorded_by: string | null
          respiratory_rate: number | null
          spo2: number | null
          temperature: number | null
          visit_id: string | null
          weight: number | null
        }
        Insert: {
          blood_sugar?: number | null
          bmi?: number | null
          bp_diastolic?: number | null
          bp_systolic?: number | null
          created_at?: string
          height?: number | null
          hospital_id: string
          id?: string
          notes?: string | null
          patient_id: string
          pulse?: number | null
          recorded_at?: string
          recorded_by?: string | null
          respiratory_rate?: number | null
          spo2?: number | null
          temperature?: number | null
          visit_id?: string | null
          weight?: number | null
        }
        Update: {
          blood_sugar?: number | null
          bmi?: number | null
          bp_diastolic?: number | null
          bp_systolic?: number | null
          created_at?: string
          height?: number | null
          hospital_id?: string
          id?: string
          notes?: string | null
          patient_id?: string
          pulse?: number | null
          recorded_at?: string
          recorded_by?: string | null
          respiratory_rate?: number | null
          spo2?: number | null
          temperature?: number | null
          visit_id?: string | null
          weight?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "vitals_hospital_id_fkey"
            columns: ["hospital_id"]
            isOneToOne: false
            referencedRelation: "hospitals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vitals_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vitals_visit_id_fkey"
            columns: ["visit_id"]
            isOneToOne: false
            referencedRelation: "opd_visits"
            referencedColumns: ["id"]
          },
        ]
      }
      wards: {
        Row: {
          category: string
          code: string | null
          created_at: string
          floor: string | null
          gender: string | null
          hospital_id: string
          id: string
          is_active: boolean
          name: string
          total_beds: number | null
          updated_at: string
        }
        Insert: {
          category: string
          code?: string | null
          created_at?: string
          floor?: string | null
          gender?: string | null
          hospital_id: string
          id?: string
          is_active?: boolean
          name: string
          total_beds?: number | null
          updated_at?: string
        }
        Update: {
          category?: string
          code?: string | null
          created_at?: string
          floor?: string | null
          gender?: string | null
          hospital_id?: string
          id?: string
          is_active?: boolean
          name?: string
          total_beds?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "wards_hospital_id_fkey"
            columns: ["hospital_id"]
            isOneToOne: false
            referencedRelation: "hospitals"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_user_hospital_id: { Args: { _user_id: string }; Returns: string }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_superadmin: { Args: { _user_id: string }; Returns: boolean }
    }
    Enums: {
      admission_status:
        | "admitted"
        | "discharged"
        | "transferred"
        | "expired"
        | "dama"
      app_role:
        | "superadmin"
        | "admin"
        | "doctor"
        | "nurse"
        | "billing"
        | "pharmacist"
        | "lab_technician"
        | "receptionist"
      appointment_status:
        | "scheduled"
        | "arrived"
        | "in_consultation"
        | "completed"
        | "cancelled"
        | "no_show"
      bed_status:
        | "available"
        | "occupied"
        | "reserved"
        | "maintenance"
        | "cleaning"
      lab_order_status:
        | "pending"
        | "collected"
        | "processing"
        | "completed"
        | "cancelled"
      ot_status:
        | "scheduled"
        | "in_progress"
        | "completed"
        | "cancelled"
        | "postponed"
      payment_status: "unpaid" | "partial" | "paid" | "refunded" | "cancelled"
      visit_status: "waiting" | "in_consultation" | "completed" | "cancelled"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      admission_status: [
        "admitted",
        "discharged",
        "transferred",
        "expired",
        "dama",
      ],
      app_role: [
        "superadmin",
        "admin",
        "doctor",
        "nurse",
        "billing",
        "pharmacist",
        "lab_technician",
        "receptionist",
      ],
      appointment_status: [
        "scheduled",
        "arrived",
        "in_consultation",
        "completed",
        "cancelled",
        "no_show",
      ],
      bed_status: [
        "available",
        "occupied",
        "reserved",
        "maintenance",
        "cleaning",
      ],
      lab_order_status: [
        "pending",
        "collected",
        "processing",
        "completed",
        "cancelled",
      ],
      ot_status: [
        "scheduled",
        "in_progress",
        "completed",
        "cancelled",
        "postponed",
      ],
      payment_status: ["unpaid", "partial", "paid", "refunded", "cancelled"],
      visit_status: ["waiting", "in_consultation", "completed", "cancelled"],
    },
  },
} as const
