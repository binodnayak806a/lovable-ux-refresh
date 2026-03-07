import { useState, useEffect, useCallback, useRef } from 'react';
import { Loader2, IndianRupee, TrendingUp, Receipt, Banknote } from 'lucide-react';
import { Card, CardContent } from '../../../components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../../components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../../components/ui/table';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { toast } from 'sonner';
import { useHospitalId } from '../../../hooks/useHospitalId';
import enhancedReportsService from '../../../services/enhanced-reports.service';
import type { DateRange, RevenueRow } from '../types/report-types';
import DateRangePicker from './DateRangePicker';
import ReportExportBar, { exportTableCSV, printReport } from './ReportExportBar';

const GROUP_OPTIONS = [
  { value: 'day', label: 'By Day' },
  { value: 'month', label: 'By Month' },
  { value: 'doctor', label: 'By Doctor' },
  { value: 'department', label: 'By Department' },
];

const fmtINR = (v: number) => `Rs. ${Number(v || 0).toLocaleString('en-IN')}`;

const COLOR_MAP: Record<string, { bg: string; text: string }> = {
  blue: { bg: 'bg-blue-50', text: 'text-blue-600' },
  amber: { bg: 'bg-amber-50', text: 'text-amber-600' },
  emerald: { bg: 'bg-emerald-50', text: 'text-emerald-600' },
  red: { bg: 'bg-red-50', text: 'text-red-600' },
};

export default function RevenueReportNew() {
  const hospitalId = useHospitalId();
  const [dateRange, setDateRange] = useState<DateRange>(() => {
    const now = new Date();
    return { from: new Date(now.getFullYear(), now.getMonth(), 1), to: now };
  });
  const [groupBy, setGroupBy] = useState('day');
  const [data, setData] = useState<RevenueRow[]>([]);
  const [loading, setLoading] = useState(true);
  const tableRef = useRef<HTMLDivElement>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try { setData(await enhancedReportsService.getRevenueReport(hospitalId, dateRange, groupBy)); }
    catch { setData([]); toast.error('Failed to load revenue report'); }
    finally { setLoading(false); }
  }, [hospitalId, dateRange, groupBy]);

  useEffect(() => { load(); }, [load]);

  const totalRevenue = data.reduce((s, r) => s + Number(r.total_revenue || 0), 0);
  const totalGST = data.reduce((s, r) => s + Number(r.gst_collected || 0), 0);
  const totalPaid = data.reduce((s, r) => s + Number(r.total_paid || 0), 0);
  const totalPending = data.reduce((s, r) => s + Number(r.total_pending || 0), 0);

  const stats = [
    { label: 'Total Revenue', value: fmtINR(totalRevenue), icon: IndianRupee, color: 'blue' },
    { label: 'GST Collected', value: fmtINR(totalGST), icon: Receipt, color: 'amber' },
    { label: 'Collected', value: fmtINR(totalPaid), icon: Banknote, color: 'emerald' },
    { label: 'Pending', value: fmtINR(totalPending), icon: TrendingUp, color: 'red' },
  ];

  const handleExport = () => {
    exportTableCSV(
      ['Group', 'OPD', 'IPD', 'Lab', 'Pharmacy', 'Total', 'GST', 'Paid', 'Pending'],
      data.map(r => [
        r.group_key, String(r.opd_revenue), String(r.ipd_revenue), String(r.lab_revenue),
        String(r.pharmacy_revenue), String(r.total_revenue), String(r.gst_collected),
        String(r.total_paid), String(r.total_pending),
      ]),
      'revenue-report',
    );
  };

  const handlePrint = () => {
    if (tableRef.current) printReport('Revenue Report', tableRef.current.innerHTML);
  };

  if (loading) return <div className="flex items-center justify-center h-48"><Loader2 className="w-6 h-6 animate-spin text-gray-400" /></div>;

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3 flex-wrap">
        <DateRangePicker dateRange={dateRange} onChange={setDateRange} compact />
        <div className="w-40">
          <Select value={groupBy} onValueChange={setGroupBy}>
            <SelectTrigger className="h-8 text-sm"><SelectValue /></SelectTrigger>
            <SelectContent>
              {GROUP_OPTIONS.map(o => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
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
                  <p className="text-lg font-bold text-gray-900 mt-1">{s.value}</p>
                </div>
                <div className={`p-2.5 rounded-xl ${COLOR_MAP[s.color].bg}`}>
                  <s.icon className={`w-5 h-5 ${COLOR_MAP[s.color].text}`} />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {data.length > 0 && (
        <Card className="border-0 shadow-sm">
          <CardContent className="p-4">
            <h4 className="text-sm font-medium text-gray-900 mb-3">Revenue Breakdown</h4>
            <div className="h-56">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data.slice(0, 15)}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="group_key" tick={{ fontSize: 10 }} interval={0} angle={-15} textAnchor="end" height={50} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }} />
                  <Legend />
                  <Bar dataKey="opd_revenue" name="OPD" fill="#3b82f6" stackId="a" />
                  <Bar dataKey="ipd_revenue" name="IPD" fill="#10b981" stackId="a" />
                  <Bar dataKey="lab_revenue" name="Lab" fill="#f59e0b" stackId="a" />
                  <Bar dataKey="pharmacy_revenue" name="Pharmacy" fill="#8b5cf6" stackId="a" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      )}

      <ReportExportBar title="Revenue Report" onPrint={handlePrint} onExportCSV={handleExport} />

      <div ref={tableRef}>
        <div className="border border-gray-200 rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-gray-50/80">
                  <TableHead>{groupBy === 'day' ? 'Date' : groupBy === 'month' ? 'Month' : groupBy === 'doctor' ? 'Doctor' : 'Department'}</TableHead>
                  <TableHead className="text-right">OPD</TableHead>
                  <TableHead className="text-right">IPD</TableHead>
                  <TableHead className="text-right">Lab</TableHead>
                  <TableHead className="text-right">Pharmacy</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                  <TableHead className="text-right">GST</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.length === 0 ? (
                  <TableRow><TableCell colSpan={7} className="text-center py-8 text-gray-400">No data available</TableCell></TableRow>
                ) : (
                  <>
                    {data.map((r, i) => (
                      <TableRow key={i} className="hover:bg-gray-50/50">
                        <TableCell className="font-medium">{r.group_key}</TableCell>
                        <TableCell className="text-right tabular-nums">{fmtINR(Number(r.opd_revenue))}</TableCell>
                        <TableCell className="text-right tabular-nums">{fmtINR(Number(r.ipd_revenue))}</TableCell>
                        <TableCell className="text-right tabular-nums">{fmtINR(Number(r.lab_revenue))}</TableCell>
                        <TableCell className="text-right tabular-nums">{fmtINR(Number(r.pharmacy_revenue))}</TableCell>
                        <TableCell className="text-right tabular-nums font-semibold">{fmtINR(Number(r.total_revenue))}</TableCell>
                        <TableCell className="text-right tabular-nums text-gray-500">{fmtINR(Number(r.gst_collected))}</TableCell>
                      </TableRow>
                    ))}
                    <TableRow className="bg-gray-50 font-semibold border-t-2 border-gray-200">
                      <TableCell>Total</TableCell>
                      <TableCell className="text-right tabular-nums">{fmtINR(data.reduce((s, r) => s + Number(r.opd_revenue || 0), 0))}</TableCell>
                      <TableCell className="text-right tabular-nums">{fmtINR(data.reduce((s, r) => s + Number(r.ipd_revenue || 0), 0))}</TableCell>
                      <TableCell className="text-right tabular-nums">{fmtINR(data.reduce((s, r) => s + Number(r.lab_revenue || 0), 0))}</TableCell>
                      <TableCell className="text-right tabular-nums">{fmtINR(data.reduce((s, r) => s + Number(r.pharmacy_revenue || 0), 0))}</TableCell>
                      <TableCell className="text-right tabular-nums">{fmtINR(totalRevenue)}</TableCell>
                      <TableCell className="text-right tabular-nums text-gray-500">{fmtINR(totalGST)}</TableCell>
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
