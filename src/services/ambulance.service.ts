import { supabase } from '../lib/supabase';
import type {
  Ambulance,
  AmbulanceRequest,
  CreateAmbulanceInput,
  CreateRequestInput,
  AmbulanceStatus,
  RequestStatus,
} from '../modules/ambulance/types';

class AmbulanceService {
  async getAmbulances(hospitalId: string): Promise<Ambulance[]> {
    const { data, error } = await supabase
      .from('ambulances')
      .select('*')
      .eq('hospital_id', hospitalId)
      .eq('is_active', true)
      .order('vehicle_number');

    if (error) throw error;
    return (data || []) as unknown as Ambulance[];
  }

  async getAmbulanceById(id: string): Promise<Ambulance | null> {
    const { data, error } = await supabase
      .from('ambulances')
      .select('*')
      .eq('id', id)
      .maybeSingle();

    if (error) throw error;
    return data as unknown as Ambulance | null;
  }

  async createAmbulance(input: CreateAmbulanceInput): Promise<Ambulance> {
    const { data, error } = await supabase
      .from('ambulances')
      .insert(input as never)
      .select()
      .single();

    if (error) throw error;
    return data as unknown as Ambulance;
  }

  async updateAmbulance(id: string, updates: Partial<Ambulance>): Promise<Ambulance> {
    const { data, error } = await supabase
      .from('ambulances')
      .update({ ...updates, updated_at: new Date().toISOString() } as never)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data as unknown as Ambulance;
  }

  async updateAmbulanceStatus(id: string, status: AmbulanceStatus): Promise<void> {
    const { error } = await supabase
      .from('ambulances')
      .update({ status, updated_at: new Date().toISOString() } as never)
      .eq('id', id);

    if (error) throw error;
  }

  async getRequests(hospitalId: string, activeOnly = false): Promise<AmbulanceRequest[]> {
    let query = supabase
      .from('ambulance_requests')
      .select(`
        *,
        patient:patients(id, full_name, phone),
        ambulance:ambulances(*)
      `)
      .eq('hospital_id', hospitalId)
      .order('created_at', { ascending: false });

    if (activeOnly) {
      query = query.in('status', ['requested', 'assigned', 'dispatched', 'on_way', 'arrived', 'picked_up', 'in_transit']);
    }

    const { data, error } = await query;

    if (error) throw error;
    return (data || []) as unknown as AmbulanceRequest[];
  }

  async getRequestById(id: string): Promise<AmbulanceRequest | null> {
    const { data, error } = await supabase
      .from('ambulance_requests')
      .select(`
        *,
        patient:patients(id, full_name, phone),
        ambulance:ambulances(*)
      `)
      .eq('id', id)
      .maybeSingle();

    if (error) throw error;
    return data as unknown as AmbulanceRequest | null;
  }

  async createRequest(input: CreateRequestInput): Promise<AmbulanceRequest> {
    const requestNumber = await this.generateRequestNumber(input.hospital_id);

    const { data, error } = await supabase
      .from('ambulance_requests')
      .insert({
        ...input,
        request_number: requestNumber,
        status: 'requested',
      } as never)
      .select(`
        *,
        patient:patients(id, full_name, phone),
        ambulance:ambulances(*)
      `)
      .single();

    if (error) throw error;
    return data as unknown as AmbulanceRequest;
  }

  async updateRequestStatus(
    requestId: string,
    status: RequestStatus,
    additionalData?: Partial<AmbulanceRequest>
  ): Promise<AmbulanceRequest> {
    const updates: Record<string, unknown> = {
      status,
      updated_at: new Date().toISOString(),
      ...additionalData,
    };

    if (status === 'dispatched') {
      updates.dispatch_time = new Date().toISOString();
    } else if (status === 'arrived') {
      updates.arrival_time = new Date().toISOString();
    } else if (status === 'completed') {
      updates.completion_time = new Date().toISOString();
    }

    const { data, error } = await supabase
      .from('ambulance_requests')
      .update(updates as never)
      .eq('id', requestId)
      .select(`
        *,
        patient:patients(id, full_name, phone),
        ambulance:ambulances(*)
      `)
      .single();

    if (error) throw error;
    return data as unknown as AmbulanceRequest;
  }

  async assignAmbulance(requestId: string, ambulanceId: string): Promise<AmbulanceRequest> {
    const { error: statusError } = await supabase
      .from('ambulances')
      .update({ status: 'on_duty', updated_at: new Date().toISOString() } as never)
      .eq('id', ambulanceId);
    if (statusError) throw statusError;

    const { data, error } = await supabase
      .from('ambulance_requests')
      .update({
        ambulance_id: ambulanceId,
        status: 'assigned',
        updated_at: new Date().toISOString(),
      } as never)
      .eq('id', requestId)
      .select(`
        *,
        patient:patients(id, full_name, phone),
        ambulance:ambulances(*)
      `)
      .single();

    if (error) throw error;
    return data as unknown as AmbulanceRequest;
  }

  async completeRequest(requestId: string, distanceKm?: number, charges?: number): Promise<AmbulanceRequest> {
    const request = await this.getRequestById(requestId);
    if (request?.ambulance_id) {
      await supabase
        .from('ambulances')
        .update({ status: 'available', updated_at: new Date().toISOString() } as never)
        .eq('id', request.ambulance_id);
    }

    return this.updateRequestStatus(requestId, 'completed', {
      distance_km: distanceKm ?? null,
      charges: charges ?? null,
    });
  }

  async cancelRequest(requestId: string): Promise<AmbulanceRequest> {
    const request = await this.getRequestById(requestId);
    if (request?.ambulance_id) {
      await supabase
        .from('ambulances')
        .update({ status: 'available', updated_at: new Date().toISOString() } as never)
        .eq('id', request.ambulance_id);
    }

    return this.updateRequestStatus(requestId, 'cancelled');
  }

  async getFleetStats(hospitalId: string): Promise<{
    total: number;
    available: number;
    onDuty: number;
    maintenance: number;
  }> {
    const { data, error } = await supabase
      .from('ambulances')
      .select('status')
      .eq('hospital_id', hospitalId)
      .eq('is_active', true);

    if (error) throw error;

    const ambulances = (data || []) as Array<{ status: string }>;
    return {
      total: ambulances.length,
      available: ambulances.filter(a => a.status === 'available').length,
      onDuty: ambulances.filter(a => a.status === 'on_duty').length,
      maintenance: ambulances.filter(a => a.status === 'maintenance' || a.status === 'out_of_service').length,
    };
  }

  private async generateRequestNumber(hospitalId: string): Promise<string> {
    const today = new Date();
    const dateStr = today.toISOString().slice(0, 10).replace(/-/g, '');

    const { count } = await supabase
      .from('ambulance_requests')
      .select('*', { count: 'exact', head: true })
      .eq('hospital_id', hospitalId)
      .gte('created_at', today.toISOString().slice(0, 10));

    const sequence = ((count || 0) + 1).toString().padStart(3, '0');
    return `AMB-${dateStr}-${sequence}`;
  }
}

export default new AmbulanceService();
