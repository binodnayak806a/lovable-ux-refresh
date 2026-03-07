import { useState, useEffect } from 'react';
import { Loader2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/card';
import type { ReportDefinition, DateRange, ReportFilters } from '../types';
import { format } from 'date-fns';
import reportsService from '../../../services/reports.service';
import RevenueSummaryReport from './RevenueSummaryReport';
import PatientRegistrationReport from './PatientRegistrationReport';
import OPDSummaryReport from './OPDSummaryReport';
import IPDCensusReport from './IPDCensusReport';
import LabTurnaroundReport from './LabTurnaroundReport';
import PharmacyStockReport from './PharmacyStockReport';
import BedOccupancyReport from './BedOccupancyReport';
import DoctorWorkloadReport from './DoctorWorkloadReport';
import AppointmentAnalysisReport from './AppointmentAnalysisReport';

interface ReportViewerProps {
  report: ReportDefinition;
  dateRange: DateRange;
  filters: ReportFilters;
  hospitalId: string | null;
}

export default function ReportViewer({ report, dateRange, filters, hospitalId }: ReportViewerProps) {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<unknown>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadReportData();
  }, [report.id, dateRange, filters, hospitalId]);

  const loadReportData = async () => {
    if (!hospitalId) {
      setError('No hospital selected');
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      let reportData: unknown;

      switch (report.id) {
        case 'revenue-summary':
        case 'department-revenue':
        case 'payment-collection':
        case 'pending-bills':
          reportData = await reportsService.getRevenueSummary(hospitalId, dateRange);
          break;
        case 'patient-registration':
        case 'patient-demographics':
        case 'patient-visits':
          reportData = await reportsService.getPatientRegistrations(hospitalId, dateRange);
          break;
        case 'opd-summary':
          reportData = await reportsService.getOPDSummary(hospitalId, dateRange);
          break;
        case 'ipd-census':
          reportData = await reportsService.getIPDCensus(hospitalId, dateRange);
          break;
        case 'diagnosis-wise':
        case 'prescription-analysis':
          reportData = await reportsService.getOPDSummary(hospitalId, dateRange);
          break;
        case 'lab-turnaround':
          reportData = await reportsService.getLabReport(hospitalId, dateRange);
          break;
        case 'pharmacy-stock':
        case 'expiry-report':
        case 'consumption-analysis':
          reportData = await reportsService.getPharmacyReport(hospitalId, dateRange);
          break;
        case 'bed-occupancy':
          reportData = await reportsService.getBedOccupancy(hospitalId, dateRange);
          break;
        case 'doctor-workload':
          reportData = await reportsService.getDoctorWorkload(hospitalId, dateRange);
          break;
        case 'appointment-analysis':
          reportData = await reportsService.getAppointmentAnalysis(hospitalId, dateRange);
          break;
        default:
          reportData = null;
      }

      setData(reportData);
    } catch {
      setError('Failed to load report data');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Card className="border-0 shadow-sm h-full min-h-[500px] flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-blue-500 mx-auto mb-3" />
          <p className="text-sm text-gray-500">Loading report data...</p>
        </div>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="border-0 shadow-sm h-full min-h-[500px] flex items-center justify-center">
        <div className="text-center text-red-500">
          <p>{error}</p>
        </div>
      </Card>
    );
  }

  const renderReport = () => {
    switch (report.id) {
      case 'revenue-summary':
      case 'department-revenue':
      case 'payment-collection':
      case 'pending-bills':
        return <RevenueSummaryReport data={data} />;
      case 'patient-registration':
      case 'patient-demographics':
      case 'patient-visits':
        return <PatientRegistrationReport data={data} />;
      case 'opd-summary':
        return <OPDSummaryReport data={data} dateRange={dateRange} />;
      case 'ipd-census':
        return <IPDCensusReport data={data} dateRange={dateRange} />;
      case 'lab-turnaround':
        return <LabTurnaroundReport data={data} dateRange={dateRange} />;
      case 'pharmacy-stock':
      case 'expiry-report':
      case 'consumption-analysis':
        return <PharmacyStockReport data={data} />;
      case 'bed-occupancy':
        return <BedOccupancyReport data={data} dateRange={dateRange} />;
      case 'doctor-workload':
        return <DoctorWorkloadReport data={data} dateRange={dateRange} />;
      case 'appointment-analysis':
        return <AppointmentAnalysisReport data={data} dateRange={dateRange} />;
      default:
        return (
          <Card className="border-0 shadow-sm">
            <CardHeader>
              <CardTitle>{report.name}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-500">This report is under development.</p>
            </CardContent>
          </Card>
        );
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-gray-800">{report.name}</h2>
          <p className="text-sm text-gray-500">
            {format(dateRange.from, 'dd MMM yyyy')} - {format(dateRange.to, 'dd MMM yyyy')}
          </p>
        </div>
      </div>
      {renderReport()}
    </div>
  );
}
