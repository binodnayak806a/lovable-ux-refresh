import { useState, useEffect, useMemo, useRef } from 'react';
import {
  Search, Eye, Printer, FileText, Calendar,
} from 'lucide-react';
import { PageSkeleton } from '../../../components/common/skeletons';
import { Button } from '../../../components/ui/button';
import { Badge } from '../../../components/ui/badge';
import { Card, CardContent, CardHeader } from '../../../components/ui/card';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '../../../components/ui/table';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from '../../../components/ui/dialog';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '../../../components/ui/select';
import { useAppSelector } from '../../../store';
import { useToast } from '../../../hooks/useToast';
import labService from '../../../services/lab.service';
import { format, parseISO, subDays } from 'date-fns';
import type { LabOrder, OrderStatus } from '../types';
import { STATUS_CONFIG } from '../types';

const SAMPLE_HOSPITAL_ID = '11111111-1111-1111-1111-111111111111';

export default function LabReports() {
  const { hospitalId: rawHospitalId } = useAppSelector((s) => s.auth);
  const hospitalId = rawHospitalId ?? SAMPLE_HOSPITAL_ID;
  const { toast } = useToast();
  const printRef = useRef<HTMLDivElement>(null);

  const [loading, setLoading] = useState(true);
  const [orders, setOrders] = useState<LabOrder[]>([]);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('completed');
  const [dateFrom, setDateFrom] = useState(subDays(new Date(), 30).toISOString().split('T')[0]);
  const [dateTo, setDateTo] = useState(new Date().toISOString().split('T')[0]);
  const [viewOrder, setViewOrder] = useState<LabOrder | null>(null);

  const loadReports = async () => {
    setLoading(true);
    try {
      const data = await labService.getOrders(hospitalId, {
        status: statusFilter === 'all' ? undefined : statusFilter as OrderStatus,
        startDate: dateFrom,
        endDate: dateTo,
        limit: 200,
      });
      setOrders(data);
    } catch {
      toast('Error', { description: 'Failed to load reports', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadReports();
  }, [hospitalId, statusFilter, dateFrom, dateTo]);

  const filtered = useMemo(() => {
    if (!search) return orders;
    const lower = search.toLowerCase();
    return orders.filter(o =>
      o.order_number.toLowerCase().includes(lower) ||
      o.patient?.full_name?.toLowerCase().includes(lower) ||
      o.patient?.uhid?.toLowerCase().includes(lower)
    );
  }, [orders, search]);

  const handlePrint = () => {
    if (!viewOrder || !printRef.current) return;
    const win = window.open('', '_blank');
    if (!win) return;
    win.document.write(`
      <html><head><title>Lab Report - ${viewOrder.order_number}</title>
      <style>
        body { font-family: Arial, sans-serif; padding: 20px; font-size: 12px; }
        table { width: 100%; border-collapse: collapse; margin: 10px 0; }
        th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
        th { background: #f5f5f5; font-weight: 600; }
        .header { text-align: center; margin-bottom: 20px; }
        .abnormal { color: red; font-weight: bold; }
        .info-row { margin-bottom: 4px; }
      </style></head><body>${printRef.current.innerHTML}</body></html>
    `);
    win.document.close();
    win.print();
  };

  if (loading) {
    return <PageSkeleton type="table" />;
  }

  return (
    <div className="space-y-4">
      <Card className="border-0 shadow-sm">
        <CardHeader className="pb-3">
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search patient, UHID, or order..."
                className="w-full h-9 pl-9 pr-3 rounded-lg border border-gray-200 text-sm outline-none focus:border-blue-400"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-36">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="processing">Processing</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
              </SelectContent>
            </Select>
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-gray-400" />
              <input
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
                className="h-9 px-2 rounded-lg border border-gray-200 text-sm outline-none focus:border-blue-400"
              />
              <span className="text-gray-400 text-sm">to</span>
              <input
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
                className="h-9 px-2 rounded-lg border border-gray-200 text-sm outline-none focus:border-blue-400"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Order #</TableHead>
                <TableHead>Patient</TableHead>
                <TableHead>Tests</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-gray-400">
                    No lab reports found for the selected criteria
                  </TableCell>
                </TableRow>
              ) : (
                filtered.map((order) => {
                  const sc = STATUS_CONFIG[order.status as OrderStatus];
                  return (
                    <TableRow key={order.id}>
                      <TableCell className="font-mono text-sm font-medium">{order.order_number}</TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium text-gray-800">{order.patient?.full_name}</p>
                          <p className="text-xs text-gray-500">{order.patient?.uhid}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <p className="text-sm">{order.items?.map(i => i.test_name).join(', ')}</p>
                        <p className="text-xs text-gray-500">{order.items?.length ?? 0} test(s)</p>
                      </TableCell>
                      <TableCell className="text-sm">{format(parseISO(order.order_date), 'dd MMM yyyy')}</TableCell>
                      <TableCell><Badge className={sc?.color}>{sc?.label}</Badge></TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          <Button size="sm" variant="ghost" className="h-7 gap-1 text-xs" onClick={() => setViewOrder(order)}>
                            <Eye className="w-3.5 h-3.5" />
                            View
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={!!viewOrder} onOpenChange={(open) => { if (!open) setViewOrder(null); }}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5 text-blue-500" />
              Lab Report - {viewOrder?.order_number}
            </DialogTitle>
          </DialogHeader>
          {viewOrder && (
            <div className="space-y-4">
              <div className="p-3 bg-gray-50 rounded-lg">
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div><span className="text-gray-500">Patient:</span> <span className="font-medium ml-1">{viewOrder.patient?.full_name}</span></div>
                  <div><span className="text-gray-500">UHID:</span> <span className="font-medium ml-1">{viewOrder.patient?.uhid}</span></div>
                  <div><span className="text-gray-500">Date:</span> <span className="font-medium ml-1">{format(parseISO(viewOrder.order_date), 'dd MMM yyyy')}</span></div>
                  <div><span className="text-gray-500">Doctor:</span> <span className="font-medium ml-1">{viewOrder.doctor?.full_name ? `Dr. ${viewOrder.doctor.full_name}` : '-'}</span></div>
                </div>
              </div>
              <div className="space-y-2">
                {viewOrder.items?.map((item) => (
                  <div key={item.id} className={`p-3 rounded-lg border ${item.is_abnormal ? 'border-red-200 bg-red-50/50' : 'border-gray-200'}`}>
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-medium text-gray-800">{item.test_name}</p>
                        {item.normal_range && <p className="text-xs text-gray-500">Normal: {item.normal_range}</p>}
                      </div>
                      <div className="text-right">
                        {item.result_value ? (
                          <p className={`text-lg font-semibold ${item.is_abnormal ? 'text-red-600' : 'text-gray-800'}`}>
                            {item.result_value} {item.result_unit}
                          </p>
                        ) : (
                          <span className="text-sm text-gray-400">Pending</span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              <div className="flex justify-end">
                <Button onClick={handlePrint} className="gap-2 bg-blue-600 hover:bg-blue-700">
                  <Printer className="w-4 h-4" />
                  Print Report
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {viewOrder && (
        <div className="hidden">
          <div ref={printRef}>
            <div className="header">
              <h2 style={{ fontSize: '18px', fontWeight: 'bold' }}>LABORATORY REPORT</h2>
              <p style={{ color: '#666' }}>Report No: {viewOrder.order_number}</p>
            </div>
            <div style={{ fontSize: '12px', marginBottom: '15px' }}>
              <div className="info-row"><strong>Patient:</strong> {viewOrder.patient?.full_name} | UHID: {viewOrder.patient?.uhid}</div>
              <div className="info-row"><strong>Date:</strong> {format(parseISO(viewOrder.order_date), 'dd MMM yyyy')}</div>
              <div className="info-row"><strong>Doctor:</strong> {viewOrder.doctor?.full_name ? `Dr. ${viewOrder.doctor.full_name}` : '-'}</div>
            </div>
            <table>
              <thead>
                <tr>
                  <th>Test Name</th>
                  <th>Result</th>
                  <th>Normal Range</th>
                  <th>Flag</th>
                </tr>
              </thead>
              <tbody>
                {viewOrder.items?.map((item) => (
                  <tr key={item.id}>
                    <td>{item.test_name}</td>
                    <td className={item.is_abnormal ? 'abnormal' : ''}>
                      {item.result_value || '-'} {item.result_unit || ''}
                    </td>
                    <td>{item.normal_range || '-'}</td>
                    <td className={item.is_abnormal ? 'abnormal' : ''}>{item.is_abnormal ? 'ABNORMAL' : 'Normal'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {viewOrder.reported_at && (
              <p style={{ fontSize: '11px', color: '#666', marginTop: '10px' }}>
                Completed: {format(parseISO(viewOrder.reported_at), 'dd MMM yyyy, HH:mm')}
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
