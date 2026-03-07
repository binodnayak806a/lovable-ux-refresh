import { supabase } from '../lib/supabase';
import type { User } from '../types';
import type { UserRole } from '../types/database';

export interface RegisterPayload {
  email: string;
  password: string;
  full_name: string;
  role: UserRole;
  hospital_id?: string;
  phone?: string;
  department?: string;
  designation?: string;
}

export const authService = {
  async signIn(email: string, password: string) {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
    return data;
  },

  async signUp(payload: RegisterPayload) {
    const { email, password, full_name, role, hospital_id, phone, department, designation } = payload;
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { full_name, role } },
    });
    if (error) throw error;

    if (data.user) {
      const { error: profileError } = await supabase
        .from('profiles')
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .upsert({
          id: data.user.id,
          email,
          full_name,
          role,
          hospital_id: hospital_id ?? null,
          phone: phone ?? null,
          department: department ?? null,
          designation: designation ?? null,
        } as never);
      if (profileError) throw profileError;
    }
    return data;
  },

  async signOut() {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  },

  async getSession() {
    const { data, error } = await supabase.auth.getSession();
    if (error) throw error;
    return data.session;
  },

  async getUserProfile(userId: string): Promise<User | null> {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .maybeSingle();
    if (error) throw error;
    return data as User | null;
  },

  async updateProfile(userId: string, updates: Partial<User>) {
    const { data, error } = await supabase
      .from('profiles')
      .update({ ...updates, updated_at: new Date().toISOString() } as never)
      .eq('id', userId)
      .select()
      .single();
    if (error) throw error;
    return data as User;
  },

  async sendPasswordResetEmail(email: string) {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    if (error) throw error;
  },

  async updatePassword(newPassword: string) {
    const { data, error } = await supabase.auth.updateUser({ password: newPassword });
    if (error) throw error;
    return data;
  },

  async getHospitals() {
    const { data, error } = await supabase
      .from('hospitals')
      .select('id, name, city, state')
      .eq('is_active', true)
      .order('name');
    if (error) throw error;
    return (data ?? []) as { id: string; name: string; city: string | null; state: string | null }[];
  },

  onAuthStateChange(callback: Parameters<typeof supabase.auth.onAuthStateChange>[0]) {
    return supabase.auth.onAuthStateChange(callback);
  },
};
