export interface ReportCategory {
  id: string;
  name: string;
  icon: string;
  reports: ReportDefinition[];
}

export interface ReportDefinition {
  id: string;
  name: string;
  description: string;
  icon: string;
}

export interface DateRange {
  from: Date;
  to: Date;
}

export interface ReportFilters {
  department: string;
  doctor: string;
  ward: string;
}

export interface RevenueSummaryData {
  totalRevenue: number;
  opdRevenue: number;
  ipdRevenue: number;
  labRevenue: number;
  pharmacyRevenue: number;
  paidAmount: number;
  pendingAmount: number;
  dailyRevenue: Array<{ date: string; revenue: number; opd: number; ipd: number }>;
  departmentRevenue: Array<{ department: string; revenue: number }>;
}

export interface PatientRegistrationData {
  totalRegistrations: number;
  newPatients: number;
  returningPatients: number;
  maleCount: number;
  femaleCount: number;
  otherCount: number;
  ageGroups: Array<{ group: string; count: number }>;
  dailyRegistrations: Array<{ date: string; count: number }>;
}

export interface OPDSummaryData {
  totalVisits: number;
  uniquePatients: number;
  consultationsByDoctor: Array<{ doctor: string; count: number; revenue: number }>;
  consultationsByDepartment: Array<{ department: string; count: number }>;
  dailyVisits: Array<{ date: string; count: number }>;
  avgWaitTime: number;
}

export interface IPDCensusData {
  totalAdmissions: number;
  totalDischarges: number;
  currentOccupancy: number;
  totalBeds: number;
  occupancyRate: number;
  avgLengthOfStay: number;
  wardOccupancy: Array<{ ward: string; occupied: number; total: number }>;
  dailyAdmissions: Array<{ date: string; admissions: number; discharges: number }>;
}

export interface DiagnosisReportData {
  topDiagnoses: Array<{ diagnosis: string; count: number; percentage: number }>;
  diagnosisByDepartment: Array<{ department: string; diagnoses: Array<{ name: string; count: number }> }>;
  monthlyTrend: Array<{ month: string; counts: Record<string, number> }>;
}

export interface LabReportData {
  totalOrders: number;
  completedOrders: number;
  pendingOrders: number;
  avgTurnaroundTime: number;
  testsByCategory: Array<{ category: string; count: number; revenue: number }>;
  dailyOrders: Array<{ date: string; orders: number; completed: number }>;
  tatCompliance: number;
}

export interface PharmacyReportData {
  totalSales: number;
  totalItems: number;
  lowStockCount: number;
  expiringCount: number;
  topSellingDrugs: Array<{ drug: string; quantity: number; revenue: number }>;
  dailySales: Array<{ date: string; sales: number; quantity: number }>;
  stockValue: number;
}

export interface BedOccupancyData {
  overallOccupancy: number;
  wardBreakdown: Array<{
    ward: string;
    totalBeds: number;
    occupied: number;
    available: number;
    occupancyRate: number;
  }>;
  dailyOccupancy: Array<{ date: string; occupancy: number }>;
  avgStay: number;
}

export interface DoctorWorkloadData {
  doctors: Array<{
    id: string;
    name: string;
    department: string;
    consultations: number;
    avgPerDay: number;
    revenue: number;
    utilization: number;
  }>;
  departmentSummary: Array<{ department: string; totalConsultations: number; avgPerDoctor: number }>;
}

export interface AppointmentAnalysisData {
  totalAppointments: number;
  completedAppointments: number;
  cancelledAppointments: number;
  noShowRate: number;
  avgWaitTime: number;
  appointmentsByHour: Array<{ hour: string; count: number }>;
  appointmentsByDay: Array<{ day: string; count: number }>;
  statusBreakdown: Array<{ status: string; count: number; percentage: number }>;
}

export const REPORT_CATEGORIES: ReportCategory[] = [
  {
    id: 'patient',
    name: 'Patient Reports',
    icon: 'Users',
    reports: [
      { id: 'patient-registration', name: 'Patient Registration Report', description: 'New and returning patient registrations', icon: 'UserPlus' },
      { id: 'patient-demographics', name: 'Patient Demographics', description: 'Age, gender, and location distribution', icon: 'PieChart' },
      { id: 'patient-visits', name: 'Patient Visit Analysis', description: 'Visit patterns and frequency analysis', icon: 'Activity' },
    ],
  },
  {
    id: 'clinical',
    name: 'Clinical Reports',
    icon: 'Stethoscope',
    reports: [
      { id: 'opd-summary', name: 'OPD Summary Report', description: 'Outpatient department summary', icon: 'ClipboardList' },
      { id: 'ipd-census', name: 'IPD Census Report', description: 'Inpatient admissions and discharges', icon: 'BedDouble' },
      { id: 'diagnosis-wise', name: 'Diagnosis-wise Report', description: 'Top diagnoses and trends', icon: 'HeartPulse' },
      { id: 'prescription-analysis', name: 'Prescription Analysis', description: 'Medication prescribing patterns', icon: 'Pill' },
    ],
  },
  {
    id: 'financial',
    name: 'Financial Reports',
    icon: 'DollarSign',
    reports: [
      { id: 'revenue-summary', name: 'Revenue Summary', description: 'Overall revenue and collection', icon: 'TrendingUp' },
      { id: 'department-revenue', name: 'Department-wise Revenue', description: 'Revenue by department', icon: 'BarChart3' },
      { id: 'payment-collection', name: 'Payment Collection Report', description: 'Payment status and trends', icon: 'CreditCard' },
      { id: 'pending-bills', name: 'Pending Bills Report', description: 'Outstanding payments', icon: 'FileText' },
    ],
  },
  {
    id: 'operational',
    name: 'Operational Reports',
    icon: 'Settings',
    reports: [
      { id: 'bed-occupancy', name: 'Bed Occupancy Report', description: 'Ward-wise bed utilization', icon: 'BedDouble' },
      { id: 'doctor-workload', name: 'Doctor Workload Analysis', description: 'Consultation load per doctor', icon: 'UserCog' },
      { id: 'appointment-analysis', name: 'Appointment Analysis', description: 'Scheduling and no-show rates', icon: 'Calendar' },
      { id: 'lab-turnaround', name: 'Lab Turnaround Time', description: 'Test completion times', icon: 'Clock' },
    ],
  },
  {
    id: 'inventory',
    name: 'Inventory Reports',
    icon: 'Package',
    reports: [
      { id: 'pharmacy-stock', name: 'Pharmacy Stock Report', description: 'Current stock levels', icon: 'Pill' },
      { id: 'expiry-report', name: 'Expiry Report', description: 'Items expiring soon', icon: 'AlertTriangle' },
      { id: 'consumption-analysis', name: 'Drug Consumption Analysis', description: 'Usage patterns and trends', icon: 'TrendingDown' },
    ],
  },
];

export const QUICK_DATE_RANGES = [
  { label: 'Today', getValue: () => ({ from: new Date(), to: new Date() }) },
  { label: 'Yesterday', getValue: () => {
    const d = new Date();
    d.setDate(d.getDate() - 1);
    return { from: d, to: d };
  }},
  { label: 'Last 7 Days', getValue: () => {
    const to = new Date();
    const from = new Date();
    from.setDate(from.getDate() - 6);
    return { from, to };
  }},
  { label: 'This Month', getValue: () => {
    const now = new Date();
    return { from: new Date(now.getFullYear(), now.getMonth(), 1), to: new Date(now.getFullYear(), now.getMonth() + 1, 0) };
  }},
  { label: 'Last Month', getValue: () => {
    const now = new Date();
    return { from: new Date(now.getFullYear(), now.getMonth() - 1, 1), to: new Date(now.getFullYear(), now.getMonth(), 0) };
  }},
  { label: 'This Year', getValue: () => {
    const now = new Date();
    return { from: new Date(now.getFullYear(), 0, 1), to: new Date(now.getFullYear(), 11, 31) };
  }},
];
