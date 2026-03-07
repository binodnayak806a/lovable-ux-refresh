import { useState, useEffect, useCallback, useRef } from 'react';
import { Loader2, Stethoscope, Users, IndianRupee, UserPlus } from 'lucide-react';
import { Card, CardContent } from '../../../components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../../components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../../components/ui/table';
import { Badge } from '../../../components/ui/badge';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { toast } from 'sonner';
import { useHospitalId } from '../../../hooks/useHospitalId';
import enhancedReportsService from '../../../services/enhanced-reports.service';
import type { DateRange, DoctorOPDRow } from '../types/report-types';
import DateRangePicker from './DateRangePicker';
import ReportExportBar, { exportTableCSV, printReport } from './ReportExportBar';

interface Props {
  doctors: Array<{ id: string; full_name: string }>;
}

const fmtINR = (v: number) => `Rs. ${v.toLocaleString('en-IN')}`;

const COLOR_MAP: Record<string, { bg: string; text: string }> = {
  blue: { bg: 'bg-blue-50', text: 'text-blue-600' },
  emerald: { bg: 'bg-emerald-50', text: 'text-emerald-600' },
  teal: { bg: 'bg-teal-50', text: 'text-teal-600' },
  amber: { bg: 'bg-amber-50', text: 'text-amber-600' },
};

export default function DoctorOPDReportNew({ doctors }: Props) {
  const hospitalId = useHospitalId();
  const [dateRange, setDateRange] = useState<DateRange>(() => {
    const now = new Date();
    return { from: new Date(now.getFullYear(), now.getMonth(), 1), to: now };
  });
  const [doctorId, setDoctorId] = useState('all');
  const [data, setData] = useState<DoctorOPDRow[]>([]);
  const [loading, setLoading] = useState(true);
  const tableRef = useRef<HTMLDivElement>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setData(await enhancedReportsService.getDoctorOPDReport(
        hospitalId, dateRange, doctorId === 'all' ? undefined : doctorId,
      ));
    } catch { setData([]); toast.error('Failed to load doctor OPD report'); }
    finally { setLoading(false); }
  }, [hospitalId, dateRange, doctorId]);

  useEffect(() => { load(); }, [load]);

  const totalPatients = data.reduce((s, r) => s + Number(r.patient_count || 0), 0);
  const totalRevenue = data.reduce((s, r) => s + Number(r.total_revenue || 0), 0);
  const totalFirst = data.reduce((s, r) => s + Number(r.first_visit_count || 0), 0);
  const totalFollowup = data.reduce((s, r) => s + Number(r.followup_count || 0), 0);

  const stats = [
    { label: 'Total Patients', value: totalPatients, icon: Users, color: 'blue' },
    { label: 'Total Revenue', value: fmtINR(totalRevenue), icon: IndianRupee, color: 'emerald' },
    { label: 'First Visits', value: totalFirst, icon: UserPlus, color: 'teal' },
    { label: 'Follow-ups', value: totalFollowup, icon: Stethoscope, color: 'amber' },
  ];

  const handleExport = () => {
    exportTableCSV(
      ['Doctor', 'Department', 'Patients', 'First Visit', 'Follow-up', 'Revenue', 'Avg Rev/Patient'],
      data.map(r => [
        r.doctor_name, r.department_name, String(r.patient_count),
        String(r.first_visit_count), String(r.followup_count),
        String(r.total_revenue), String(r.avg_revenue_per_patient),
      ]),
      'doctor-opd-report',
    );
  };

  const handlePrint = () => {
    if (tableRef.current) printReport('Doctor-wise OPD Report', tableRef.current.innerHTML);
  };

  if (loading) return <div className="flex items-center justify-center h-48"><Loader2 className="w-6 h-6 animate-spin text-gray-400" /></div>;

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3 flex-wrap">
        <DateRangePicker dateRange={dateRange} onChange={setDateRange} compact />
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

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {stats.map(s => (
          <Card key={s.label} className="border-0 shadow-sm">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-gray-500 uppercase tracking-wide">{s.label}</p>
                  <p className="text-xl font-bold text-gray-900 mt-1">{s.value}</p>
                </div>
                <div className={`p-2.5 rounded-xl ${COLOR_MAP[s.color].bg}`}>
                  <s.icon className={`w-5 h-5 ${COLOR_MAP[s.color].text}`} />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {data.length > 1 && (
        <Card className="border-0 shadow-sm">
          <CardContent className="p-4">
            <h4 className="text-sm font-medium text-gray-900 mb-3">Patient Volume by Doctor</h4>
            <div className="h-56">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data.slice(0, 10)}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="doctor_name" tick={{ fontSize: 10 }} interval={0} angle={-15} textAnchor="end" height={50} />
                  <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                  <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }} />
                  <Legend />
                  <Bar dataKey="first_visit_count" name="First Visit" fill="#3b82f6" stackId="a" />
                  <Bar dataKey="followup_count" name="Follow-up" fill="#10b981" stackId="a" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      )}

      <ReportExportBar title="Doctor-wise OPD Report" onPrint={handlePrint} onExportCSV={handleExport} />

      <div ref={tableRef}>
        <div className="border border-gray-200 rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-gray-50/80">
                  <TableHead>Doctor</TableHead>
                  <TableHead>Department</TableHead>
                  <TableHead className="text-right">Patients</TableHead>
                  <TableHead className="text-right">First Visit</TableHead>
                  <TableHead className="text-right">Follow-up</TableHead>
                  <TableHead className="text-right">Revenue</TableHead>
                  <TableHead className="text-right">Avg/Patient</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.length === 0 ? (
                  <TableRow><TableCell colSpan={7} className="text-center py-8 text-gray-400">No data available</TableCell></TableRow>
                ) : (
                  <>
                    {data.map((r, i) => (
                      <TableRow key={i} className="hover:bg-gray-50/50">
                        <TableCell className="font-medium">{r.doctor_name}</TableCell>
                        <TableCell><Badge variant="outline" className="text-xs">{r.department_name}</Badge></TableCell>
                        <TableCell className="text-right tabular-nums font-semibold">{r.patient_count}</TableCell>
                        <TableCell className="text-right tabular-nums">
                          <Badge className="bg-blue-50 text-blue-700 border-blue-200">{r.first_visit_count}</Badge>
                        </TableCell>
                        <TableCell className="text-right tabular-nums">
                          <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200">{r.followup_count}</Badge>
                        </TableCell>
                        <TableCell className="text-right tabular-nums font-medium">{fmtINR(Number(r.total_revenue))}</TableCell>
                        <TableCell className="text-right tabular-nums text-gray-500">{fmtINR(Number(r.avg_revenue_per_patient))}</TableCell>
                      </TableRow>
                    ))}
                    <TableRow className="bg-gray-50 font-semibold border-t-2 border-gray-200">
                      <TableCell>Total</TableCell>
                      <TableCell />
                      <TableCell className="text-right tabular-nums">{totalPatients}</TableCell>
                      <TableCell className="text-right tabular-nums">{totalFirst}</TableCell>
                      <TableCell className="text-right tabular-nums">{totalFollowup}</TableCell>
                      <TableCell className="text-right tabular-nums">{fmtINR(totalRevenue)}</TableCell>
                      <TableCell className="text-right tabular-nums">{totalPatients > 0 ? fmtINR(Math.round(totalRevenue / totalPatients)) : '-'}</TableCell>
                    </TableRow>
                  </>
                )}
              </TableBody>
            </Table>
          </div>
        </div>
      </div>
    </div>
  );
}
