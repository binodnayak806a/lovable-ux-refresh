import { useState, useEffect, useCallback, useRef } from 'react';
import { Loader2, Users, IndianRupee } from 'lucide-react';
import { Card, CardContent } from '../../../components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../../components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../../components/ui/table';
import { Badge } from '../../../components/ui/badge';
import { format } from 'date-fns';
import { useHospitalId } from '../../../hooks/useHospitalId';
import enhancedReportsService from '../../../services/enhanced-reports.service';
import type { DailyOPDRow } from '../types/report-types';
import ReportExportBar, { exportTableCSV, printReport } from './ReportExportBar';

interface Props {
  doctors: Array<{ id: string; full_name: string }>;
}

const STATUS_COLORS: Record<string, string> = {
  completed: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  confirmed: 'bg-blue-50 text-blue-700 border-blue-200',
  scheduled: 'bg-gray-50 text-gray-700 border-gray-200',
  in_progress: 'bg-amber-50 text-amber-700 border-amber-200',
  cancelled: 'bg-red-50 text-red-700 border-red-200',
};

export default function DailyOPDReport({ doctors }: Props) {
  const hospitalId = useHospitalId();
  const [date, setDate] = useState(new Date());
  const [doctorId, setDoctorId] = useState('all');
  const [data, setData] = useState<DailyOPDRow[]>([]);
  const [loading, setLoading] = useState(true);
  const tableRef = useRef<HTMLDivElement>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setData(await enhancedReportsService.getDailyOPDSummary(
        hospitalId, date, doctorId === 'all' ? undefined : doctorId,
      ));
    } catch { setData([]); }
    finally { setLoading(false); }
  }, [hospitalId, date, doctorId]);

  useEffect(() => { load(); }, [load]);

  const totalRevenue = data.reduce((s, r) => s + Number(r.amount || 0), 0);

  const handleExport = () => {
    exportTableCSV(
      ['Token', 'Patient', 'UHID', 'Doctor', 'Visit Type', 'Amount', 'Payment', 'Status'],
      data.map(r => [
        String(r.token_number), r.patient_name, r.uhid, r.doctor_name,
        r.visit_type, String(r.amount), r.payment_mode, r.status,
      ]),
      'daily-opd-summary',
    );
  };

  const handlePrint = () => {
    if (tableRef.current) printReport(`Daily OPD Summary - ${format(date, 'dd MMM yyyy')}`, tableRef.current.innerHTML);
  };

  if (loading) return <div className="flex items-center justify-center h-48"><Loader2 className="w-6 h-6 animate-spin text-gray-400" /></div>;

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3 flex-wrap">
        <input
          type="date"
          value={format(date, 'yyyy-MM-dd')}
          onChange={e => setDate(new Date(e.target.value))}
          className="h-8 px-2.5 rounded-lg border border-gray-200 text-sm outline-none focus:border-blue-400"
        />
        <div className="w-48">
          <Select value={doctorId} onValueChange={setDoctorId}>
            <SelectTrigger className="h-8 text-sm"><SelectValue placeholder="All Doctors" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Doctors</SelectItem>
              {doctors.map(d => <SelectItem key={d.id} value={d.id}>{d.full_name}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        <Card className="border-0 shadow-sm">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-blue-50"><Users className="w-5 h-5 text-blue-600" /></div>
            <div><p className="text-xs text-gray-500">Total Patients</p><p className="text-xl font-bold">{data.length}</p></div>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-emerald-50"><IndianRupee className="w-5 h-5 text-emerald-600" /></div>
            <div><p className="text-xs text-gray-500">Total Revenue</p><p className="text-xl font-bold">Rs. {totalRevenue.toLocaleString('en-IN')}</p></div>
          </CardContent>
        </Card>
      </div>

      <ReportExportBar title={`Daily OPD - ${format(date, 'dd MMM yyyy')}`} onPrint={handlePrint} onExportCSV={handleExport} />

      <div ref={tableRef}>
        <div className="border border-gray-200 rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-gray-50/80">
                  <TableHead className="w-16">Token</TableHead>
                  <TableHead>Patient</TableHead>
                  <TableHead>UHID</TableHead>
                  <TableHead>Doctor</TableHead>
                  <TableHead>Visit Type</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                  <TableHead>Payment</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.length === 0 ? (
                  <TableRow><TableCell colSpan={8} className="text-center py-8 text-gray-400">No appointments found for this date</TableCell></TableRow>
                ) : data.map((r, i) => (
                  <TableRow key={i} className="hover:bg-gray-50/50">
                    <TableCell className="font-mono text-sm font-semibold">{r.token_number}</TableCell>
                    <TableCell className="font-medium">{r.patient_name}</TableCell>
                    <TableCell className="text-gray-500 text-xs">{r.uhid}</TableCell>
                    <TableCell>{r.doctor_name}</TableCell>
                    <TableCell><Badge variant="outline" className="text-xs">{r.visit_type || 'Consultation'}</Badge></TableCell>
                    <TableCell className="text-right tabular-nums font-medium">Rs. {Number(r.amount || 0).toLocaleString('en-IN')}</TableCell>
                    <TableCell className="text-sm text-gray-600">{r.payment_mode || '-'}</TableCell>
                    <TableCell>
                      <Badge className={`text-[10px] ${STATUS_COLORS[r.status] || STATUS_COLORS.scheduled}`}>{r.status}</Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      </div>
    </div>
  );
}
