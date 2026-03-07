export interface Staff {
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
  status: 'active' | 'on_leave' | 'resigned' | 'terminated';
  created_at: string;
}

export interface Attendance {
  id: string;
  staff_id: string;
  date: string;
  check_in: string | null;
  check_out: string | null;
  status: 'present' | 'absent' | 'half_day' | 'leave';
  notes: string | null;
  staff?: Staff;
}

export interface LeaveRequest {
  id: string;
  staff_id: string;
  leave_type: string;
  from_date: string;
  to_date: string;
  total_days: number;
  reason: string | null;
  status: 'pending' | 'approved' | 'rejected';
  approved_by: string | null;
  created_at: string;
  staff?: Staff;
}

export type StaffFormData = Omit<Staff, 'id' | 'created_at'>;

export type LeaveType = 'Sick Leave' | 'Casual Leave' | 'Earned Leave' | 'Maternity Leave' | 'Paternity Leave';
