import { supabase } from '../lib/supabase';
import type { InsuranceProvider, InsuranceClaim, PreAuthorization, ClaimStatus, PreAuthStatus } from '../modules/insurance/types';

function generateClaimNumber(): string {
  const d = new Date();
  const prefix = 'CLM';
  const ts = `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, '0')}`;
  const rand = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
  return `${prefix}-${ts}-${rand}`;
}

function generateAuthNumber(): string {
  const d = new Date();
  const prefix = 'PA';
  const ts = `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, '0')}`;
  const rand = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
  return `${prefix}-${ts}-${rand}`;
}

class InsuranceService {
  // ─── Providers ────────────────────────────────────────────────
  async getProviders(hospitalId: string): Promise<InsuranceProvider[]> {
    const { data, error } = await supabase
      .from('insurance_providers')
      .select('*')
      .eq('hospital_id', hospitalId)
      .order('name');
    if (error) throw error;
    return (data ?? []) as InsuranceProvider[];
  }

  async createProvider(provider: Omit<InsuranceProvider, 'id' | 'created_at' | 'updated_at'>): Promise<InsuranceProvider> {
    const { data, error } = await supabase
      .from('insurance_providers')
      .insert(provider)
      .select()
      .single();
    if (error) throw error;
    return data as InsuranceProvider;
  }

  async updateProvider(id: string, updates: Partial<InsuranceProvider>): Promise<void> {
    const { error } = await supabase
      .from('insurance_providers')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id);
    if (error) throw error;
  }

  // ─── Claims ───────────────────────────────────────────────────
  async getClaims(hospitalId: string, filters?: { status?: string; providerId?: string }): Promise<InsuranceClaim[]> {
    let query = supabase
      .from('insurance_claims')
      .select('*')
      .eq('hospital_id', hospitalId)
      .order('created_at', { ascending: false })
      .limit(200);

    if (filters?.status && filters.status !== 'all') query = query.eq('status', filters.status);
    if (filters?.providerId && filters.providerId !== 'all') query = query.eq('provider_id', filters.providerId);

    const { data, error } = await query;
    if (error) throw error;
    return (data ?? []) as InsuranceClaim[];
  }

  async createClaim(claim: Partial<InsuranceClaim> & { hospital_id: string; patient_id: string }): Promise<InsuranceClaim> {
    const { data, error } = await supabase
      .from('insurance_claims')
      .insert({
        ...claim,
        claim_number: claim.claim_number || generateClaimNumber(),
        status: claim.status || 'draft',
      })
      .select()
      .single();
    if (error) throw error;
    return data as InsuranceClaim;
  }

  async updateClaimStatus(id: string, status: ClaimStatus, extra?: Partial<InsuranceClaim>): Promise<void> {
    const updates: Partial<InsuranceClaim> & { updated_at: string } = {
      status,
      updated_at: new Date().toISOString(),
      ...extra,
    };
    if (status === 'submitted') updates.submitted_at = new Date().toISOString();
    if (status === 'approved' || status === 'partially_approved') updates.approved_at = new Date().toISOString();
    if (status === 'settled') updates.settled_at = new Date().toISOString();

    const { error } = await supabase
      .from('insurance_claims')
      .update(updates)
      .eq('id', id);
    if (error) throw error;
  }

  async getClaimStats(hospitalId: string): Promise<{
    totalClaims: number;
    totalClaimed: number;
    totalApproved: number;
    totalSettled: number;
    pendingCount: number;
    rejectedCount: number;
  }> {
    const { data, error } = await supabase
      .from('insurance_claims')
      .select('status, claimed_amount, approved_amount, settled_amount')
      .eq('hospital_id', hospitalId);
    if (error) throw error;

    const claims = (data ?? []) as Pick<InsuranceClaim, 'status' | 'claimed_amount' | 'approved_amount' | 'settled_amount'>[];
    return {
      totalClaims: claims.length,
      totalClaimed: claims.reduce((s, c) => s + Number(c.claimed_amount || 0), 0),
      totalApproved: claims.reduce((s, c) => s + Number(c.approved_amount || 0), 0),
      totalSettled: claims.reduce((s, c) => s + Number(c.settled_amount || 0), 0),
      pendingCount: claims.filter(c => ['draft', 'submitted', 'under_review', 'query_raised'].includes(c.status)).length,
      rejectedCount: claims.filter(c => c.status === 'rejected').length,
    };
  }

  // ─── Pre-Authorizations ──────────────────────────────────────
  async getPreAuths(hospitalId: string, filters?: { status?: string }): Promise<PreAuthorization[]> {
    let query = supabase
      .from('pre_authorizations')
      .select('*')
      .eq('hospital_id', hospitalId)
      .order('created_at', { ascending: false })
      .limit(200);

    if (filters?.status && filters.status !== 'all') query = query.eq('status', filters.status);

    const { data, error } = await query;
    if (error) throw error;
    return (data ?? []) as PreAuthorization[];
  }

  async createPreAuth(preAuth: Partial<PreAuthorization> & { hospital_id: string; patient_id: string }): Promise<PreAuthorization> {
    const { data, error } = await supabase
      .from('pre_authorizations')
      .insert({
        ...preAuth,
        auth_number: preAuth.auth_number || generateAuthNumber(),
        status: preAuth.status || 'pending',
      })
      .select()
      .single();
    if (error) throw error;
    return data as PreAuthorization;
  }

  async updatePreAuthStatus(id: string, status: PreAuthStatus, extra?: Partial<PreAuthorization>): Promise<void> {
    const updates: Partial<PreAuthorization> & { updated_at: string } = {
      status,
      updated_at: new Date().toISOString(),
      ...extra,
    };
    if (status === 'approved' || status === 'partially_approved') updates.approved_at = new Date().toISOString();

    const { error } = await supabase
      .from('pre_authorizations')
      .update(updates)
      .eq('id', id);
    if (error) throw error;
  }
}

export const insuranceService = new InsuranceService();
export default insuranceService;
