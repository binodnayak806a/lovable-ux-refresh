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
import CollectPaymentDialog from './components/CollectPaymentDialog';
import { useNavigate } from 'react-router-dom';

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
  pending: { label: 'Pending', color: 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400', icon: Clock },
  partial: { label: 'Partial', color: 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400', icon: AlertCircle },
  paid: { label: 'Paid', color: 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400', icon: CheckCircle },
  cancelled: { label: 'Cancelled', color: 'bg-muted text-muted-foreground', icon: XCircle },
  refunded: { label: 'Refunded', color: 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400', icon: RefreshCw },
};

const BILL_TYPE_CONFIG = {
  opd: { label: 'OPD', color: 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400' },
  ipd: { label: 'IPD', color: 'bg-teal-50 dark:bg-teal-900/20 text-teal-600 dark:text-teal-400' },
  pharmacy: { label: 'Pharmacy', color: 'bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400' },
  lab: { label: 'Lab', color: 'bg-cyan-50 dark:bg-cyan-900/20 text-cyan-600 dark:text-cyan-400' },
  other: { label: 'Other', color: 'bg-muted text-muted-foreground' },
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

  const navigateTo = useNavigate();
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
        helpItems={[
          'Click "+ New Bill" to create a bill for any patient',
          'Use search to find bills by number or patient name',
          'Click "Collect" on any pending bill to record payment',
          'Filter by type (OPD, IPD, Pharmacy, Lab) or status',
          'Export bills as CSV for accounting',
        ]}
        actions={
          <>
            <Button variant="outline" size="sm" className="gap-2">
              <Download className="w-4 h-4" />
              Export
            </Button>
            <Button size="sm" className="gap-2" onClick={() => navigateTo('/billing/new')}>
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
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input placeholder="Search by bill no. or name..." value={search}
                  onChange={e => setSearch(e.target.value)} className="pl-9 w-64" autoFocus />
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
                <TableRow className="bg-muted/50">
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
                       <Receipt className="w-10 h-10 text-muted-foreground/30" />
                        <p className="text-muted-foreground font-medium">No bills found</p>
                        <p className="text-sm text-muted-foreground/70">Create a new bill to get started</p>
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
                      <TableRow key={bill.id} className="hover:bg-muted/50">
                        <TableCell>
                          <span className="font-mono text-sm font-medium text-foreground">
                            {bill.bill_number}
                          </span>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center">
                              <User className="w-4 h-4 text-muted-foreground" />
                            </div>
                            <span className="font-medium text-foreground truncate max-w-[150px]">
                              {bill.patient_name}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="secondary" className={cn('font-medium', typeConfig.color)}>
                            {typeConfig.label}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {format(new Date(bill.created_at), 'dd MMM yyyy')}
                        </TableCell>
                        <TableCell className="text-right font-medium text-foreground">
                          {formatCurrency(bill.total_amount)}
                        </TableCell>
                        <TableCell className="text-right font-medium text-emerald-600 dark:text-emerald-400">
                          {formatCurrency(bill.paid_amount || 0)}
                        </TableCell>
                        <TableCell className="text-right font-medium">
                          <span className={balance > 0 ? 'text-amber-600 dark:text-amber-400' : 'text-muted-foreground'}>
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
