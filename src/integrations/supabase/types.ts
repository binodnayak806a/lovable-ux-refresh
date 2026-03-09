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
          patient_name: string | null
          policy_number: string | null
          provider_id: string | null
          provider_name: string | null
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
          patient_name?: string | null
          policy_number?: string | null
          provider_id?: string | null
          provider_name?: string | null
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
          patient_name?: string | null
          policy_number?: string | null
          provider_id?: string | null
          provider_name?: string | null
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
        Relationships: []
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
          patient_name: string | null
          planned_procedure: string | null
          policy_number: string | null
          provider_id: string | null
          provider_name: string | null
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
          patient_name?: string | null
          planned_procedure?: string | null
          policy_number?: string | null
          provider_id?: string | null
          provider_name?: string | null
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
          patient_name?: string | null
          planned_procedure?: string | null
          policy_number?: string | null
          provider_id?: string | null
          provider_name?: string | null
          rejection_reason?: string | null
          remarks?: string | null
          requested_amount?: number
          status?: string
          updated_at?: string
          valid_until?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "pre_authorizations_provider_id_fkey"
            columns: ["provider_id"]
            isOneToOne: false
            referencedRelation: "insurance_providers"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          permissions: Json | null
          role_name: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          permissions?: Json | null
          role_name?: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          permissions?: Json | null
          role_name?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role:
        | "superadmin"
        | "admin"
        | "doctor"
        | "nurse"
        | "billing"
        | "pharmacist"
        | "lab_technician"
        | "receptionist"
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
    },
  },
} as const
