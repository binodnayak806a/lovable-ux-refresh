/**
 * Role Service — manages user roles in the dedicated user_roles table
 * instead of storing roles directly on the profiles table.
 */
import { supabase } from '../lib/supabase';
import type { UserRole } from '../types/user.types';

export interface UserRoleEntry {
  id: string;
  user_id: string | null;
  role_name: UserRole;
  permissions: Record<string, unknown> | null;
  created_at: string;
}

export const roleService = {
  /**
   * Get the role for a specific user from the user_roles table.
   * Falls back to null if not found.
   */
  async getUserRole(userId: string): Promise<UserRole | null> {
    const { data, error } = await supabase
      .from('user_roles')
      .select('role_name')
      .eq('user_id', userId)
      .maybeSingle();

    if (error || !data) return null;
    return (data as { role_name: UserRole }).role_name;
  },

  /**
   * Ensure a user has a role entry in user_roles.
   * If one doesn't exist, creates it using the role from profiles as initial value.
   */
  async ensureUserRole(userId: string, fallbackRole: UserRole): Promise<UserRole> {
    // First check if role already exists
    const existing = await this.getUserRole(userId);
    if (existing) return existing;

    // Create the role entry
    const { data, error } = await supabase
      .from('user_roles')
      .upsert(
        { user_id: userId, role_name: fallbackRole } as never,
        { onConflict: 'user_id' }
      )
      .select('role_name')
      .single();

    if (error) {
      console.warn('[roleService] Could not create user_role entry:', error.message);
      return fallbackRole;
    }

    return (data as { role_name: UserRole }).role_name;
  },

  /**
   * Get the default permissions for a role (role-level, not user-specific).
   * These are entries where user_id IS NULL.
   */
  async getRolePermissions(roleName: UserRole): Promise<Record<string, unknown> | null> {
    const { data, error } = await supabase
      .from('user_roles')
      .select('permissions')
      .eq('role_name', roleName)
      .is('user_id', null)
      .maybeSingle();

    if (error || !data) return null;
    return (data as { permissions: Record<string, unknown> | null }).permissions;
  },

  /**
   * Update a user's role in the user_roles table.
   */
  async updateUserRole(userId: string, newRole: UserRole): Promise<void> {
    const { error } = await supabase
      .from('user_roles')
      .update({ role_name: newRole } as never)
      .eq('user_id', userId);

    if (error) {
      throw new Error(`Failed to update user role: ${error.message}`);
    }
  },
};
