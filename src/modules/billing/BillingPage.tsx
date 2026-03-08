import { useState, useEffect, useCallback } from 'react';
import {
  Receipt, Search, Plus, Download, Printer, CreditCard,
  CheckCircle, Clock, XCircle, AlertCircle, IndianRupee, TrendingUp,
  User, FileText, RefreshCw
} from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useHospitalId } from '../../hooks/useHospitalId';
import { useAppSelector } from '../../store';
import { useRealtime } from '../../hooks/useRealtime';
import { usePageTitle } from '../../hooks/usePageTitle';
import PageHeader from '../../components/shared/PageHeader';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Card, CardContent, CardHeader } from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';
import { Tabs, TabsList, TabsTrigger } from '../../components/ui/tabs';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '../../components/ui/select';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '../../components/ui/table';
import { Skeleton } from '../../components/ui/skeleton';
import { cn } from '../../lib/utils';
import { format } from 'date-fns';
import CreateBillDialog from './components/CreateBillDialog';
import CollectPaymentDialog from './components/CollectPaymentDialog';

interface Bill {
  id: string;
  bill_number: string;
  patient_id: string;
  patient_name?: string;
  total_amount: number;
  paid_amount: number;
  discount_amount: number;
  status: 'pending' | 'partial' | 'paid' | 'cancelled' | 'refunded';
  bill_type: 'opd' | 'ipd' | 'pharmacy' | 'lab' | 'other';
  created_at: string;
  due_date?: string;
}

interface BillStats {
  totalBills: number;
  totalRevenue: number;
  pendingAmount: number;
  collectedToday: number;
}

const STATUS_CONFIG = {
  pending: { label: 'Pending', color: 'bg-amber-100 text-amber-700', icon: Clock },
  partial: { label: 'Partial', color: 'bg-blue-100 text-blue-700', icon: AlertCircle },
  paid: { label: 'Paid', color: 'bg-emerald-100 text-emerald-700', icon: CheckCircle },
  cancelled: { label: 'Cancelled', color: 'bg-gray-100 text-gray-600', icon: XCircle },
  refunded: { label: 'Refunded', color: 'bg-red-100 text-red-700', icon: RefreshCw },
};

const BILL_TYPE_CONFIG = {
  opd: { label: 'OPD', color: 'bg-blue-50 text-blue-600' },
  ipd: { label: 'IPD', color: 'bg-teal-50 text-teal-600' },
  pharmacy: { label: 'Pharmacy', color: 'bg-amber-50 text-amber-600' },
  lab: { label: 'Lab', color: 'bg-cyan-50 text-cyan-600' },
  other: { label: 'Other', color: 'bg-gray-50 text-gray-600' },
};

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(amount);
}

import SharedStatCard from '../../components/shared/StatCard';

export default function BillingPage() {
  usePageTitle('Billing');
  const hospitalId = useHospitalId();
  const userId = useAppSelector(s => s.auth.user?.id ?? '');

  const [bills, setBills] = useState<Bill[]>([]);
  const [stats, setStats] = useState<BillStats>({
    totalBills: 0, totalRevenue: 0, pendingAmount: 0, collectedToday: 0,
  });
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [activeTab, setActiveTab] = useState('all');

  const [createOpen, setCreateOpen] = useState(false);
  const [payBill, setPayBill] = useState<Bill | null>(null);

  const loadBills = useCallback(async () => {
    setLoading(true);
    try {
      let query = supabase
        .from('bills')
        .select(`*, patients:patient_id (full_name)`)
        .eq('hospital_id', hospitalId)
        .order('created_at', { ascending: false })
        .limit(100);

      if (statusFilter !== 'all') query = query.eq('status', statusFilter);
      if (typeFilter !== 'all') query = query.eq('bill_type', typeFilter);
      if (search) query = query.or(`bill_number.ilike.%${search}%`);

      const { data, error } = await query;
      if (error) throw error;

      interface BillRow {
        id: string; bill_number: string; patient_id: string;
        total_amount: number; paid_amount: number; discount_amount: number;
        status: string; bill_type: string; created_at: string;
        due_date?: string; patients?: { full_name: string };
      }

      const billsWithPatient = ((data ?? []) as BillRow[]).map(bill => ({
        ...bill,
        patient_name: bill.patients?.full_name || 'Unknown',
      })) as Bill[];

      setBills(billsWithPatient);

      const totalRevenue = billsWithPatient.reduce((sum, b) => sum + (b.paid_amount || 0), 0);
      const pendingAmount = billsWithPatient
        .filter(b => b.status === 'pending' || b.status === 'partial')
        .reduce((sum, b) => sum + (b.total_amount - (b.paid_amount || 0)), 0);

      const today = new Date().toISOString().split('T')[0];
      const collectedToday = billsWithPatient
        .filter(b => b.created_at?.startsWith(today) && b.status === 'paid')
        .reduce((sum, b) => sum + (b.paid_amount || 0), 0);

      setStats({ totalBills: billsWithPatient.length, totalRevenue, pendingAmount, collectedToday });
    } catch {
      //
    } finally {
      setLoading(false);
    }
  }, [hospitalId, statusFilter, typeFilter, search]);

  useEffect(() => { loadBills(); }, [loadBills]);

  useRealtime(
    { table: 'bills', filter: `hospital_id=eq.${hospitalId}` },
    () => loadBills()
  );

  const filteredBills = bills.filter(bill => {
    if (activeTab === 'pending') return bill.status === 'pending' || bill.status === 'partial';
    if (activeTab === 'paid') return bill.status === 'paid';
    return true;
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Billing & Payments"
        subtitle="Manage patient bills, payments, and invoices"
        icon={Receipt}
        actions={
          <>
            <Button variant="outline" size="sm" className="gap-2">
              <Download className="w-4 h-4" />
              Export
            </Button>
            <Button size="sm" className="gap-2" onClick={() => setCreateOpen(true)}>
              <Plus className="w-4 h-4" />
              New Bill
            </Button>
          </>
        }
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <SharedStatCard label="Total Bills" value={stats.totalBills.toString()} icon={FileText} iconClassName="bg-blue-100 text-blue-600" />
        <SharedStatCard label="Total Revenue" value={formatCurrency(stats.totalRevenue)} icon={TrendingUp} iconClassName="bg-emerald-100 text-emerald-600" />
        <SharedStatCard label="Pending Amount" value={formatCurrency(stats.pendingAmount)} icon={Clock} iconClassName="bg-amber-100 text-amber-600" />
        <SharedStatCard label="Collected Today" value={formatCurrency(stats.collectedToday)} icon={IndianRupee} iconClassName="bg-cyan-100 text-cyan-600" />
      </div>

      <Card>
        <CardHeader className="pb-3">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList>
                <TabsTrigger value="all">All Bills</TabsTrigger>
                <TabsTrigger value="pending">
                  Pending
                  <Badge variant="secondary" className="ml-2">
                    {bills.filter(b => b.status === 'pending' || b.status === 'partial').length}
                  </Badge>
                </TabsTrigger>
                <TabsTrigger value="paid">Paid</TabsTrigger>
              </TabsList>
            </Tabs>
            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input placeholder="Search bills..." value={search}
                  onChange={e => setSearch(e.target.value)} className="pl-9 w-64" />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-32"><SelectValue placeholder="Status" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="partial">Partial</SelectItem>
                  <SelectItem value="paid">Paid</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>
              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger className="w-32"><SelectValue placeholder="Type" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="opd">OPD</SelectItem>
                  <SelectItem value="ipd">IPD</SelectItem>
                  <SelectItem value="pharmacy">Pharmacy</SelectItem>
                  <SelectItem value="lab">Lab</SelectItem>
                </SelectContent>
              </Select>
              <Button variant="outline" size="icon" onClick={loadBills}
                className={cn(loading && 'animate-spin')}>
                <RefreshCw className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-gray-50/50">
                  <TableHead>Bill No.</TableHead>
                  <TableHead>Patient</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                  <TableHead className="text-right">Paid</TableHead>
                  <TableHead className="text-right">Balance</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="w-24">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <TableRow key={i}>
                      {Array.from({ length: 9 }).map((_, j) => (
                        <TableCell key={j}><Skeleton className="h-4 w-20" /></TableCell>
                      ))}
                    </TableRow>
                  ))
                ) : filteredBills.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={9} className="h-32 text-center">
                      <div className="flex flex-col items-center gap-2">
                        <Receipt className="w-10 h-10 text-gray-300" />
                        <p className="text-gray-500 font-medium">No bills found</p>
                        <p className="text-sm text-gray-400">Create a new bill to get started</p>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredBills.map(bill => {
                    const statusConfig = STATUS_CONFIG[bill.status];
                    const typeConfig = BILL_TYPE_CONFIG[bill.bill_type] || BILL_TYPE_CONFIG.other;
                    const StatusIcon = statusConfig.icon;
                    const balance = bill.total_amount - (bill.paid_amount || 0);

                    return (
                      <TableRow key={bill.id} className="hover:bg-gray-50/50">
                        <TableCell>
                          <span className="font-mono text-sm font-medium text-gray-900">
                            {bill.bill_number}
                          </span>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center">
                              <User className="w-4 h-4 text-gray-500" />
                            </div>
                            <span className="font-medium text-gray-900 truncate max-w-[150px]">
                              {bill.patient_name}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="secondary" className={cn('font-medium', typeConfig.color)}>
                            {typeConfig.label}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-gray-600">
                          {format(new Date(bill.created_at), 'dd MMM yyyy')}
                        </TableCell>
                        <TableCell className="text-right font-medium text-gray-900">
                          {formatCurrency(bill.total_amount)}
                        </TableCell>
                        <TableCell className="text-right font-medium text-emerald-600">
                          {formatCurrency(bill.paid_amount || 0)}
                        </TableCell>
                        <TableCell className="text-right font-medium">
                          <span className={balance > 0 ? 'text-amber-600' : 'text-gray-400'}>
                            {formatCurrency(balance)}
                          </span>
                        </TableCell>
                        <TableCell>
                          <Badge className={cn('gap-1', statusConfig.color)}>
                            <StatusIcon className="w-3 h-3" />
                            {statusConfig.label}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <Button variant="ghost" size="icon" className="h-8 w-8" title="Print">
                              <Printer className="w-4 h-4" />
                            </Button>
                            {(bill.status === 'pending' || bill.status === 'partial') && (
                              <Button variant="ghost" size="icon" className="h-8 w-8 text-emerald-600"
                                title="Collect Payment" onClick={() => setPayBill(bill)}>
                                <CreditCard className="w-4 h-4" />
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
          </div>
        </CardContent>
      </Card>

      <CreateBillDialog
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        onSuccess={loadBills}
        hospitalId={hospitalId}
        userId={userId}
      />

      <CollectPaymentDialog
        open={!!payBill}
        bill={payBill}
        onClose={() => setPayBill(null)}
        onSuccess={loadBills}
      />
    </div>
  );
}
