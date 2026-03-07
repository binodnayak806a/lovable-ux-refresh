export type AmbulanceStatus = 'available' | 'on_duty' | 'maintenance' | 'out_of_service';
export type AmbulanceType = 'Basic Life Support' | 'Advanced Life Support' | 'ICU on Wheels' | 'Patient Transport';
export type RequestType = 'pickup' | 'transfer' | 'emergency' | 'scheduled';
export type RequestPriority = 'low' | 'normal' | 'high' | 'critical';
export type RequestStatus = 'requested' | 'assigned' | 'dispatched' | 'on_way' | 'arrived' | 'picked_up' | 'in_transit' | 'completed' | 'cancelled';

export interface Ambulance {
  id: string;
  hospital_id: string;
  vehicle_number: string;
  vehicle_type: AmbulanceType;
  driver_name: string | null;
  driver_phone: string | null;
  paramedic_name: string | null;
  status: AmbulanceStatus;
  last_service_date: string | null;
  next_service_date: string | null;
  gps_tracking_id: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface AmbulanceRequest {
  id: string;
  hospital_id: string;
  request_number: string;
  patient_id: string | null;
  ambulance_id: string | null;
  request_type: RequestType;
  pickup_location: string;
  pickup_latitude: number | null;
  pickup_longitude: number | null;
  dropoff_location: string | null;
  dropoff_latitude: number | null;
  dropoff_longitude: number | null;
  pickup_time: string | null;
  patient_name: string | null;
  patient_phone: string | null;
  patient_condition: string | null;
  priority: RequestPriority;
  status: RequestStatus;
  dispatch_time: string | null;
  arrival_time: string | null;
  completion_time: string | null;
  distance_km: number | null;
  charges: number | null;
  notes: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
  patient?: {
    id: string;
    full_name: string;
    phone: string;
  };
  ambulance?: Ambulance;
}

export interface CreateAmbulanceInput {
  hospital_id: string;
  vehicle_number: string;
  vehicle_type: AmbulanceType;
  driver_name?: string;
  driver_phone?: string;
  paramedic_name?: string;
  status?: AmbulanceStatus;
  last_service_date?: string;
  next_service_date?: string;
  gps_tracking_id?: string;
}

export interface CreateRequestInput {
  hospital_id: string;
  patient_id?: string;
  request_type: RequestType;
  pickup_location: string;
  pickup_latitude?: number;
  pickup_longitude?: number;
  dropoff_location?: string;
  dropoff_latitude?: number;
  dropoff_longitude?: number;
  pickup_time?: string;
  patient_name?: string;
  patient_phone?: string;
  patient_condition?: string;
  priority: RequestPriority;
  notes?: string;
}

export const AMBULANCE_STATUS_CONFIG: Record<AmbulanceStatus, { label: string; color: string; bgColor: string }> = {
  available: { label: 'Available', color: 'text-emerald-700', bgColor: 'bg-emerald-100' },
  on_duty: { label: 'On Duty', color: 'text-blue-700', bgColor: 'bg-blue-100' },
  maintenance: { label: 'Maintenance', color: 'text-amber-700', bgColor: 'bg-amber-100' },
  out_of_service: { label: 'Out of Service', color: 'text-gray-700', bgColor: 'bg-gray-100' },
};

export const AMBULANCE_TYPE_CONFIG: Record<AmbulanceType, { label: string; shortLabel: string }> = {
  'Basic Life Support': { label: 'Basic Life Support', shortLabel: 'BLS' },
  'Advanced Life Support': { label: 'Advanced Life Support', shortLabel: 'ALS' },
  'ICU on Wheels': { label: 'ICU on Wheels', shortLabel: 'ICU' },
  'Patient Transport': { label: 'Patient Transport', shortLabel: 'PT' },
};

export const REQUEST_PRIORITY_CONFIG: Record<RequestPriority, { label: string; color: string; bgColor: string }> = {
  low: { label: 'Low', color: 'text-gray-700', bgColor: 'bg-gray-100' },
  normal: { label: 'Normal', color: 'text-blue-700', bgColor: 'bg-blue-100' },
  high: { label: 'High', color: 'text-amber-700', bgColor: 'bg-amber-100' },
  critical: { label: 'Critical', color: 'text-red-700', bgColor: 'bg-red-100' },
};

export const REQUEST_STATUS_CONFIG: Record<RequestStatus, { label: string; color: string; bgColor: string }> = {
  requested: { label: 'Requested', color: 'text-gray-700', bgColor: 'bg-gray-100' },
  assigned: { label: 'Assigned', color: 'text-blue-700', bgColor: 'bg-blue-100' },
  dispatched: { label: 'Dispatched', color: 'text-cyan-700', bgColor: 'bg-cyan-100' },
  on_way: { label: 'On Way', color: 'text-amber-700', bgColor: 'bg-amber-100' },
  arrived: { label: 'Arrived', color: 'text-teal-700', bgColor: 'bg-teal-100' },
  picked_up: { label: 'Picked Up', color: 'text-indigo-700', bgColor: 'bg-indigo-100' },
  in_transit: { label: 'In Transit', color: 'text-purple-700', bgColor: 'bg-purple-100' },
  completed: { label: 'Completed', color: 'text-emerald-700', bgColor: 'bg-emerald-100' },
  cancelled: { label: 'Cancelled', color: 'text-red-700', bgColor: 'bg-red-100' },
};

export const REQUEST_TYPE_CONFIG: Record<RequestType, { label: string; icon: string }> = {
  pickup: { label: 'Pickup', icon: 'MapPin' },
  transfer: { label: 'Transfer', icon: 'ArrowRightLeft' },
  emergency: { label: 'Emergency', icon: 'Siren' },
  scheduled: { label: 'Scheduled', icon: 'Calendar' },
};
