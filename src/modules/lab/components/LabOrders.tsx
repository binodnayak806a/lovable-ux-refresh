import { useState, useEffect, useMemo } from 'react';
import {
  Search, Plus, Loader2, Clock, CheckCircle2,
  ClipboardList, Activity, Eye, TestTube, FlaskConical,
} from 'lucide-react';
import { Button } from '../../../components/ui/button';
import { Badge } from '../../../components/ui/badge';
import { Card, CardContent, CardHeader } from '../../../components/ui/card';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '../../../components/ui/table';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '../../../components/ui/dialog';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '../../../components/ui/select';
import { Checkbox } from '../../../components/ui/checkbox';
import { useAppSelector } from '../../../store';
import { useToast } from '../../../hooks/useToast';
import labService from '../../../services/lab.service';
import { mockStore } from '../../../lib/mockStore';
import { mockMasterStore } from '../../../lib/mockMasterStore';
import { format, parseISO } from 'date-fns';
import type {
  LabOrder, LabTest, LabStats, OrderStatus, OrderPriority,
  LabOrderFormData,
} from '../types';
import { STATUS_CONFIG, PRIORITY_CONFIG, EMPTY_ORDER_FORM } from '../types';

const SAMPLE_HOSPITAL_ID = '11111111-1111-1111-1111-111111111111';

interface LabOrdersProps {
  onViewResults: (order: LabOrder) => void;
}

export default function LabOrders({ onViewResults }: LabOrdersProps) {
  const { user, hospitalId: rawHospitalId } = useAppSelector((s) => s.auth);
  const hospitalId = rawHospitalId ?? SAMPLE_HOSPITAL_ID;
  const { toast } = useToast();

  const [loading, setLoading] = useState(true);
  const [orders, setOrders] = useState<LabOrder[]>([]);
  const [tests, setTests] = useState<LabTest[]>([]);
  const [stats, setStats] = useState<LabStats | null>(null);
  const [filterStatus, setFilterStatus] = useState<OrderStatus | 'all'>('all');
  const [search, setSearch] = useState('');
  const [showNewOrder, setShowNewOrder] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [orderForm, setOrderForm] = useState<LabOrderFormData>(EMPTY_ORDER_FORM);
  const [patientSearch, setPatientSearch] = useState('');
  const [patients, setPatients] = useState<Array<{ id: string; full_name: string; uhid: string }>>([]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [ordersData, testsData, statsData] = await Promise.all([
        labService.getOrders(hospitalId, { status: filterStatus === 'all' ? undefined : filterStatus, limit: 100 }),
        labService.getTests(hospitalId),
        labService.getStats(hospitalId),
      ]);
      setOrders(ordersData);
      setTests(testsData);
      setStats(statsData);
    } catch {
      toast('Error', { description: 'Failed to load lab data', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [hospitalId, filterStatus]);

  const testsByCategory = useMemo(() => {
    const grouped: Record<string, LabTest[]> = {};
    tests.forEach((t) => {
      if (!grouped[t.test_category]) grouped[t.test_category] = [];
      grouped[t.test_category].push(t);
    });
    return grouped;
  }, [tests]);

  const filteredOrders = useMemo(() => {
    if (!search) return orders;
    const lower = search.toLowerCase();
    return orders.filter(
      (o) =>
        o.order_number.toLowerCase().includes(lower) ||
        o.patient?.full_name?.toLowerCase().includes(lower) ||
        o.patient?.uhid?.toLowerCase().includes(lower)
    );
  }, [orders, search]);

  const handleCreateOrder = async () => {
    if (!orderForm.patient_id || orderForm.test_ids.length === 0) {
      toast('Missing Fields', { description: 'Please select patient and at least one test', type: 'error' });
      return;
    }
    setSubmitting(true);
    try {
      await labService.createOrder(hospitalId, orderForm, user?.id ?? '');
      toast('Order Created', { type: 'success' });
      setShowNewOrder(false);
      setOrderForm(EMPTY_ORDER_FORM);
      setPatientSearch('');
      loadData();
    } catch {
      toast('Error', { description: 'Failed to create order', type: 'error' });
    } finally {
      setSubmitting(false);
    }
  };

  const handleCollectSample = async (orderId: string) => {
    try {
      await labService.collectSample(orderId, user?.id ?? '');
      toast('Sample Collected', { type: 'success' });
      loadData();
    } catch {
      toast('Error', { description: 'Failed to update status', type: 'error' });
    }
  };

  const handleStartProcessing = async (orderId: string) => {
    try {
      await labService.startProcessing(orderId);
      toast('Processing Started', { type: 'success' });
      loadData();
    } catch {
      toast('Error', { description: 'Failed to update status', type: 'error' });
    }
  };

  const searchPatients = (query: string) => {
    if (query.length < 2) { setPatients([]); return; }
    const results = mockStore.getPatients(hospitalId, query).slice(0, 10);
    setPatients(results.map(p => ({ id: p.id, full_name: p.full_name, uhid: p.uhid })));
  };

  // Also load doctors for the form
  const doctors = useMemo(() => {
    return mockMasterStore.getAll<Record<string, unknown>>('doctors', hospitalId)
      .filter(d => d.is_active !== false)
      .map(d => ({ id: d.id as string, full_name: `Dr. ${d.first_name} ${d.last_name}` }));
  }, [hospitalId]);

  const selectedTestsTotal = useMemo(() => {
    return tests
      .filter((t) => orderForm.test_ids.includes(t.id))
      .reduce((sum, t) => sum + t.test_price, 0);
  }, [tests, orderForm.test_ids]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="border-0 shadow-sm bg-gradient-to-br from-blue-50 to-white">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-blue-100">
              <ClipboardList className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-xs text-gray-500">Total Orders</p>
              <p className="text-xl font-bold text-gray-800">{stats?.totalOrders ?? 0}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm bg-gradient-to-br from-amber-50 to-white">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-amber-100">
              <Clock className="w-5 h-5 text-amber-600" />
            </div>
            <div>
              <p className="text-xs text-gray-500">Pending</p>
              <p className="text-xl font-bold text-gray-800">{stats?.pendingOrders ?? 0}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm bg-gradient-to-br from-emerald-50 to-white">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-emerald-100">
              <CheckCircle2 className="w-5 h-5 text-emerald-600" />
            </div>
            <div>
              <p className="text-xs text-gray-500">Completed Today</p>
              <p className="text-xl font-bold text-gray-800">{stats?.completedToday ?? 0}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm bg-gradient-to-br from-cyan-50 to-white">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-cyan-100">
              <Activity className="w-5 h-5 text-cyan-600" />
            </div>
            <div>
              <p className="text-xs text-gray-500">Avg. Turnaround</p>
              <p className="text-xl font-bold text-gray-800">{stats?.avgTurnaround ?? 0}h</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="border-0 shadow-sm">
        <CardHeader className="pb-3">
          <div className="flex items-center gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by order number, patient name, or UHID..."
                className="w-full h-9 pl-9 pr-3 rounded-lg border border-gray-200 text-sm outline-none focus:border-blue-400"
              />
            </div>
            <Select value={filterStatus} onValueChange={(v) => setFilterStatus(v as OrderStatus | 'all')}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Filter status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="sample_collected">Sample Collected</SelectItem>
                <SelectItem value="processing">Processing</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
              </SelectContent>
            </Select>
            <Button onClick={() => setShowNewOrder(true)} className="gap-2 bg-blue-600 hover:bg-blue-700">
              <Plus className="w-4 h-4" />
              New Order
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Order #</TableHead>
                <TableHead>Patient</TableHead>
                <TableHead>Tests</TableHead>
                <TableHead>Doctor</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Priority</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredOrders.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8 text-gray-400">
                    No lab orders found
                  </TableCell>
                </TableRow>
              ) : (
                filteredOrders.map((order) => {
                  const statusConfig = STATUS_CONFIG[order.status as OrderStatus];
                  const priorityConfig = PRIORITY_CONFIG[order.priority as OrderPriority];
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
                        <div className="max-w-[200px]">
                          <p className="text-sm truncate">{order.items?.map((i) => i.test_name).join(', ')}</p>
                          <p className="text-xs text-gray-500">{order.items?.length ?? 0} test(s)</p>
                        </div>
                      </TableCell>
                      <TableCell>{order.doctor?.full_name ? `Dr. ${order.doctor.full_name.split(' ')[0]}` : '-'}</TableCell>
                      <TableCell>{format(parseISO(order.order_date), 'dd MMM, HH:mm')}</TableCell>
                      <TableCell><Badge className={priorityConfig?.color}>{priorityConfig?.label}</Badge></TableCell>
                      <TableCell><Badge className={statusConfig?.color}>{statusConfig?.label}</Badge></TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Button size="sm" variant="ghost" className="h-7 w-7 p-0" onClick={() => onViewResults(order)}>
                            <Eye className="w-3.5 h-3.5" />
                          </Button>
                          {order.status === 'pending' && (
                            <Button size="sm" variant="ghost" className="h-7 px-2 text-xs text-blue-600" onClick={() => handleCollectSample(order.id)}>
                              Collect
                            </Button>
                          )}
                          {order.status === 'sample_collected' && (
                            <Button size="sm" variant="ghost" className="h-7 px-2 text-xs text-amber-600" onClick={() => handleStartProcessing(order.id)}>
                              Process
                            </Button>
                          )}
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

      <Dialog open={showNewOrder} onOpenChange={setShowNewOrder}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FlaskConical className="w-5 h-5 text-blue-500" />
              New Lab Order
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <label className="text-xs text-gray-500 uppercase tracking-wide block mb-1.5">Patient *</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  value={patientSearch}
                  onChange={(e) => { setPatientSearch(e.target.value); searchPatients(e.target.value); }}
                  placeholder="Search patient by name or UHID..."
                  className="w-full h-9 pl-9 pr-3 rounded-lg border border-gray-200 text-sm outline-none focus:border-blue-400"
                />
              </div>
              {patients.length > 0 && !orderForm.patient_id && (
                <div className="mt-2 p-2 border rounded-lg max-h-32 overflow-y-auto">
                  {patients.map((p) => (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => {
                        setOrderForm({ ...orderForm, patient_id: p.id });
                        setPatientSearch(`${p.full_name} (${p.uhid})`);
                        setPatients([]);
                      }}
                      className="w-full text-left p-2 hover:bg-gray-50 rounded-lg text-sm"
                    >
                      {p.full_name} - {p.uhid}
                    </button>
                  ))}
                </div>
              )}
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-gray-500 uppercase tracking-wide block mb-1.5">Doctor</label>
                <Select value={orderForm.doctor_id || ''} onValueChange={(v) => setOrderForm({ ...orderForm, doctor_id: v })}>
                  <SelectTrigger><SelectValue placeholder="Select doctor" /></SelectTrigger>
                  <SelectContent>
                    {doctors.map(d => (
                      <SelectItem key={d.id} value={d.id}>{d.full_name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-xs text-gray-500 uppercase tracking-wide block mb-1.5">Priority</label>
                <Select value={orderForm.priority} onValueChange={(v) => setOrderForm({ ...orderForm, priority: v as OrderPriority })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="routine">Routine</SelectItem>
                    <SelectItem value="urgent">Urgent</SelectItem>
                    <SelectItem value="stat">STAT</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <label className="text-xs text-gray-500 uppercase tracking-wide block mb-1.5">Clinical Notes</label>
              <input
                type="text"
                value={orderForm.clinical_notes}
                onChange={(e) => setOrderForm({ ...orderForm, clinical_notes: e.target.value })}
                placeholder="Optional"
                className="w-full h-9 px-3 rounded-lg border border-gray-200 text-sm outline-none focus:border-blue-400"
              />
            </div>
            <div>
              <label className="text-xs text-gray-500 uppercase tracking-wide block mb-2">Select Tests *</label>
              <div className="space-y-3 max-h-60 overflow-y-auto">
                {Object.entries(testsByCategory).map(([category, categoryTests]) => (
                  <div key={category} className="border rounded-lg p-3">
                    <h4 className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                      <TestTube className="w-3.5 h-3.5" />
                      {category}
                    </h4>
                    <div className="grid grid-cols-2 gap-2">
                      {categoryTests.map((test) => (
                        <label
                          key={test.id}
                          className={`flex items-center gap-2 p-2 rounded-lg cursor-pointer transition-colors ${
                            orderForm.test_ids.includes(test.id)
                              ? 'bg-blue-50 border border-blue-200'
                              : 'hover:bg-gray-50 border border-transparent'
                          }`}
                        >
                          <Checkbox
                            checked={orderForm.test_ids.includes(test.id)}
                            onCheckedChange={(checked) => {
                              setOrderForm({
                                ...orderForm,
                                test_ids: checked
                                  ? [...orderForm.test_ids, test.id]
                                  : orderForm.test_ids.filter((id) => id !== test.id),
                              });
                            }}
                          />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate">{test.test_name}</p>
                            <p className="text-xs text-gray-500">Rs. {test.test_price}</p>
                          </div>
                        </label>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
            {orderForm.test_ids.length > 0 && (
              <div className="p-3 bg-blue-50 rounded-lg">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">{orderForm.test_ids.length} test(s) selected</span>
                  <span className="font-semibold text-blue-700">Total: Rs. {selectedTestsTotal.toLocaleString('en-IN')}</span>
                </div>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowNewOrder(false)} disabled={submitting}>Cancel</Button>
            <Button onClick={handleCreateOrder} disabled={submitting} className="bg-blue-600 hover:bg-blue-700">
              {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Create Order'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
