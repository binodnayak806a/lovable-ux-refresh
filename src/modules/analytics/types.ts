export interface KPIData {
  avgPatientWaitTime: number;
  bedOccupancyRate: number;
  revenuePerPatient: number;
  patientSatisfaction: number;
  doctorUtilization: number;
  labTATCompliance: number;
  opdVisitsToday: number;
  ipdAdmissionsToday: number;
  totalRevenueToday: number;
  pendingBillsAmount: number;
}

export interface TrendData {
  label: string;
  value: number;
  previousValue: number;
  change: number;
  changePercent: number;
  isPositive: boolean;
}

export interface DepartmentPerformance {
  department: string;
  patients: number;
  revenue: number;
  satisfaction: number;
}

export interface HourlyTraffic {
  hour: string;
  opd: number;
  emergency: number;
  total: number;
}

export interface AnalyticsSummary {
  kpis: KPIData;
  departmentPerformance: DepartmentPerformance[];
  hourlyTraffic: HourlyTraffic[];
  recentTrends: {
    patients: TrendData;
    revenue: TrendData;
    admissions: TrendData;
    discharges: TrendData;
  };
}

export const KPI_CONFIG = {
  avgPatientWaitTime: {
    label: 'Avg Wait Time',
    unit: 'min',
    target: 20,
    isLowerBetter: true,
    icon: 'Clock',
  },
  bedOccupancyRate: {
    label: 'Bed Occupancy',
    unit: '%',
    target: 80,
    isLowerBetter: false,
    icon: 'BedDouble',
  },
  revenuePerPatient: {
    label: 'Revenue/Patient',
    unit: 'Rs.',
    target: 1500,
    isLowerBetter: false,
    icon: 'DollarSign',
  },
  patientSatisfaction: {
    label: 'Satisfaction',
    unit: '/5',
    target: 4.5,
    isLowerBetter: false,
    icon: 'ThumbsUp',
  },
  doctorUtilization: {
    label: 'Doctor Util.',
    unit: '%',
    target: 85,
    isLowerBetter: false,
    icon: 'UserCog',
  },
  labTATCompliance: {
    label: 'Lab TAT',
    unit: '%',
    target: 95,
    isLowerBetter: false,
    icon: 'FlaskConical',
  },
};
