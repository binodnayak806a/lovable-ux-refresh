import { useState, useEffect, useCallback, useRef } from 'react';
import { Loader2, UserPlus, UserMinus, Users, BedDouble } from 'lucide-react';
import { Card, CardContent } from '../../../components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../../components/ui/table';
import { Progress } from '../../../components/ui/progress';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { toast } from 'sonner';
import { useHospitalId } from '../../../hooks/useHospitalId';
import enhancedReportsService from '../../../services/enhanced-reports.service';
import type { DateRange, IPDCensusRow } from '../types/report-types';
import DateRangePicker from './DateRangePicker';
import ReportExportBar, { printReport } from './ReportExportBar';

const COLOR_MAP: Record<string, { bg: string; text: string }> = {
  blue: { bg: 'bg-blue-50', text: 'text-blue-600' },
  emerald: { bg: 'bg-emerald-50', text: 'text-emerald-600' },
  amber: { bg: 'bg-amber-50', text: 'text-amber-600' },
  teal: { bg: 'bg-teal-50', text: 'text-teal-600' },
};

export default function IPDCensusReportNew() {
  const hospitalId = useHospitalId();
  const [dateRange, setDateRange] = useState<DateRange>(() => {
    const now = new Date();
    return { from: new Date(now.getFullYear(), now.getMonth(), 1), to: now };
  });
  const [data, setData] = useState<IPDCensusRow | null>(null);
  const [loading, setLoading] = useState(true);
  const tableRef = useRef<HTMLDivElement>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try { setData(await enhancedReportsService.getIPDCensus(hospitalId, dateRange)); }
    catch { setData(null); toast.error('Failed to load IPD census report'); }
    finally { setLoading(false); }
  }, [hospitalId, dateRange]);

  useEffect(() => { load(); }, [load]);

  const handlePrint = () => {
    if (tableRef.current) printReport('IPD Census Report', tableRef.current.innerHTML);
  };

  if (loading) return <div className="flex items-center justify-center h-48"><Loader2 className="w-6 h-6 animate-spin text-gray-400" /></div>;
  if (!data) return <div className="text-center py-8 text-gray-400">No data available</div>;

  const stats = [
    { label: 'Admitted', value: data.total_admissions, icon: UserPlus, color: 'blue' },
    { label: 'Discharged', value: data.total_discharges, icon: UserMinus, color: 'emerald' },
    { label: 'Current IPD', value: data.current_inpatients, icon: Users, color: 'amber' },
    { label: 'Bed Occupancy', value: `${data.bed_occupancy_pct}%`, icon: BedDouble, color: 'teal' },
  ];

  return (
    <div className="space-y-4">
      <DateRangePicker dateRange={dateRange} onChange={setDateRange} compact />

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

      <ReportExportBar title="IPD Census Report" onPrint={handlePrint} />

      <div ref={tableRef}>
        {data.ward_breakdown.length > 0 && (
          <div className="border border-gray-200 rounded-xl overflow-hidden">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-gray-50/80">
                    <TableHead>Ward</TableHead>
                    <TableHead className="text-right">Admitted</TableHead>
                    <TableHead className="text-right">Discharged</TableHead>
                    <TableHead className="text-right">Current</TableHead>
                    <TableHead className="text-right">Total Beds</TableHead>
                    <TableHead className="w-36">Occupancy</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.ward_breakdown.map((w, i) => (
                    <TableRow key={i} className="hover:bg-gray-50/50">
                      <TableCell className="font-medium">{w.ward}</TableCell>
                      <TableCell className="text-right tabular-nums">{w.admitted}</TableCell>
                      <TableCell className="text-right tabular-nums">{w.discharged}</TableCell>
                      <TableCell className="text-right tabular-nums font-semibold">{w.current}</TableCell>
                      <TableCell className="text-right tabular-nums">{w.total_beds}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Progress
                            value={w.occupancy_pct}
                            className={`h-2 flex-1 ${w.occupancy_pct > 85 ? '[&>div]:bg-red-500' : w.occupancy_pct > 60 ? '[&>div]:bg-amber-500' : '[&>div]:bg-emerald-500'}`}
                          />
                          <span className="text-xs text-gray-500 w-8 text-right">{w.occupancy_pct}%</span>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>
        )}
      </div>

      {data.daily.length > 1 && (
        <Card className="border-0 shadow-sm">
          <CardContent className="p-4">
            <h4 className="text-sm font-medium text-gray-900 mb-3">Daily Admissions & Discharges</h4>
            <div className="h-56">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data.daily}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="date" tick={{ fontSize: 10 }} />
                  <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                  <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }} />
                  <Legend />
                  <Bar dataKey="admissions" name="Admissions" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="discharges" name="Discharges" fill="#10b981" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
