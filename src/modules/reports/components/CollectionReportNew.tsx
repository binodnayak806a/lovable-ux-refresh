import { useState, useEffect, useCallback, useRef } from 'react';
import { Loader2, CreditCard, Banknote, Smartphone, ShieldCheck } from 'lucide-react';
import { Card, CardContent } from '../../../components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../../components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../../components/ui/table';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { toast } from 'sonner';
import { useHospitalId } from '../../../hooks/useHospitalId';
import enhancedReportsService from '../../../services/enhanced-reports.service';
import type { DateRange, CollectionRow } from '../types/report-types';
import DateRangePicker from './DateRangePicker';
import ReportExportBar, { exportTableCSV, printReport } from './ReportExportBar';

const MODE_ICONS: Record<string, React.ElementType> = {
  Cash: Banknote,
  Card: CreditCard,
  UPI: Smartphone,
  Insurance: ShieldCheck,
};

const PIE_COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4'];

const fmtINR = (v: number) => `Rs. ${Number(v || 0).toLocaleString('en-IN')}`;

export default function CollectionReportNew() {
  const hospitalId = useHospitalId();
  const [dateRange, setDateRange] = useState<DateRange>(() => {
    const now = new Date();
    return { from: new Date(now.getFullYear(), now.getMonth(), 1), to: now };
  });
  const [modeFilter, setModeFilter] = useState('all');
  const [data, setData] = useState<CollectionRow[]>([]);
  const [loading, setLoading] = useState(true);
  const tableRef = useRef<HTMLDivElement>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try { setData(await enhancedReportsService.getCollectionReport(hospitalId, dateRange, modeFilter === 'all' ? undefined : modeFilter)); }
    catch { setData([]); toast.error('Failed to load collection report'); }
    finally { setLoading(false); }
  }, [hospitalId, dateRange, modeFilter]);

  useEffect(() => { load(); }, [load]);

  const totalAmount = data.reduce((s, r) => s + Number(r.total_amount || 0), 0);
  const totalTxns = data.reduce((s, r) => s + Number(r.transaction_count || 0), 0);

  const handleExport = () => {
    exportTableCSV(
      ['Payment Mode', 'Transactions', 'Amount', 'Share %'],
      data.map(r => [r.payment_mode, String(r.transaction_count), String(r.total_amount), `${r.percentage}%`]),
      'collection-report',
    );
  };

  const handlePrint = () => {
    if (tableRef.current) printReport('Collection Report', tableRef.current.innerHTML);
  };

  if (loading) return <div className="flex items-center justify-center h-48"><Loader2 className="w-6 h-6 animate-spin text-gray-400" /></div>;

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3 flex-wrap">
        <DateRangePicker dateRange={dateRange} onChange={setDateRange} compact />
        <div className="w-40">
          <Select value={modeFilter} onValueChange={setModeFilter}>
            <SelectTrigger className="h-8 text-sm"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Modes</SelectItem>
              {['Cash', 'Card', 'UPI', 'Insurance', 'Cheque'].map(m => <SelectItem key={m} value={m}>{m}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Card className="border-0 shadow-sm">
          <CardContent className="p-4">
            <p className="text-xs text-gray-500 uppercase tracking-wide">Total Collection</p>
            <p className="text-2xl font-bold text-gray-900 mt-1">{fmtINR(totalAmount)}</p>
            <p className="text-xs text-gray-500 mt-0.5">{totalTxns} transactions</p>
          </CardContent>
        </Card>
        {data.length > 0 && (
          <Card className="border-0 shadow-sm">
            <CardContent className="p-3">
              <div className="h-32">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={data} dataKey="total_amount" nameKey="payment_mode" cx="50%" cy="50%" innerRadius={30} outerRadius={55}>
                      {data.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                    </Pie>
                    <Tooltip formatter={(v: number) => fmtINR(v)} />
                    <Legend iconSize={8} wrapperStyle={{ fontSize: 10 }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      <ReportExportBar title="Collection Report" onPrint={handlePrint} onExportCSV={handleExport} />

      <div ref={tableRef}>
        <div className="border border-gray-200 rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-gray-50/80">
                  <TableHead>Payment Mode</TableHead>
                  <TableHead className="text-right">Transactions</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                  <TableHead className="text-right">Share</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.length === 0 ? (
                  <TableRow><TableCell colSpan={4} className="text-center py-8 text-gray-400">No collection data</TableCell></TableRow>
                ) : (
                  <>
                    {data.map((r, i) => {
                      const Icon = MODE_ICONS[r.payment_mode] || CreditCard;
                      return (
                        <TableRow key={i} className="hover:bg-gray-50/50">
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Icon className="w-4 h-4 text-gray-500" />
                              <span className="font-medium">{r.payment_mode}</span>
                            </div>
                          </TableCell>
                          <TableCell className="text-right tabular-nums">{r.transaction_count}</TableCell>
                          <TableCell className="text-right tabular-nums font-semibold">{fmtINR(Number(r.total_amount))}</TableCell>
                          <TableCell className="text-right">
                            <div className="flex items-center justify-end gap-2">
                              <div className="w-16 h-1.5 rounded-full bg-gray-100 overflow-hidden">
                                <div className="h-full rounded-full" style={{ width: `${r.percentage}%`, backgroundColor: PIE_COLORS[i % PIE_COLORS.length] }} />
                              </div>
                              <span className="text-xs text-gray-500 w-10 text-right">{Number(r.percentage).toFixed(1)}%</span>
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                    <TableRow className="bg-gray-50 font-semibold border-t-2 border-gray-200">
                      <TableCell>Total</TableCell>
                      <TableCell className="text-right tabular-nums">{totalTxns}</TableCell>
                      <TableCell className="text-right tabular-nums">{fmtINR(totalAmount)}</TableCell>
                      <TableCell className="text-right text-xs text-gray-500">100%</TableCell>
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
