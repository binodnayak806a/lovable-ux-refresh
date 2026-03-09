import { useState, useEffect, useCallback } from 'react';
import {
  ShieldCheck, Plus, Search, RefreshCw, FileText, Clock,
  CheckCircle, XCircle, Banknote, IndianRupee, TrendingUp,
  Building2, Send, Filter, Eye, MoreHorizontal,
} from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';
import { usePageTitle } from '../../hooks/usePageTitle';
import { useHospitalId } from '../../hooks/useHospitalId';
import { useAppSelector } from '../../store';
import PageHeader from '../../components/shared/PageHeader';
import SharedStatCard from '../../components/shared/StatCard';
import EmptyState from '../../components/common/EmptyState';
import { TableSkeleton, StatCardsSkeleton } from '../../components/common/skeletons';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Badge } from '../../components/ui/badge';
import { Tabs, TabsList, TabsTrigger } from '../../components/ui/tabs';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '../../components/ui/select';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '../../components/ui/table';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator,
} from '../../components/ui/dropdown-menu';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { cn } from '../../lib/utils';
import insuranceService from '../../services/insurance.service';
import { ClaimStatusBadge, PreAuthStatusBadge } from './components/ClaimStatusBadge';
import CreateClaimDialog from './components/CreateClaimDialog';
import CreatePreAuthDialog from './components/CreatePreAuthDialog';
import AddProviderDialog from './components/AddProviderDialog';
import type { InsuranceClaim, PreAuthorization, InsuranceProvider, ClaimStatus } from './types';

type ActiveTab = 'claims' | 'preauth' | 'providers' | 'settlement';

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency', currency: 'INR', maximumFractionDigits: 0,
  }).format(amount);
}

export default function InsurancePage() {
  usePageTitle('Insurance & TPA');
  const hospitalId = useHospitalId();
  const userId = useAppSelector(s => s.auth.user?.id ?? '');

  const [activeTab, setActiveTab] = useState<ActiveTab>('claims');
  const [claims, setClaims] = useState<InsuranceClaim[]>([]);
  const [preAuths, setPreAuths] = useState<PreAuthorization[]>([]);
  const [providers, setProviders] = useState<InsuranceProvider[]>([]);
  const [stats, setStats] = useState({ totalClaims: 0, totalClaimed: 0, totalApproved: 0, totalSettled: 0, pendingCount: 0, rejectedCount: 0 });
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [providerFilter, setProviderFilter] = useState('all');

  const [claimDialogOpen, setClaimDialogOpen] = useState(false);
  const [preAuthDialogOpen, setPreAuthDialogOpen] = useState(false);
  const [providerDialogOpen, setProviderDialogOpen] = useState(false);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [claimsData, preAuthData, providersData, statsData] = await Promise.all([
        insuranceService.getClaims(hospitalId, { status: statusFilter, providerId: providerFilter }),
        insuranceService.getPreAuths(hospitalId, { status: statusFilter }),
        insuranceService.getProviders(hospitalId),
        insuranceService.getClaimStats(hospitalId),
      ]);
      setClaims(claimsData);
      setPreAuths(preAuthData);
      setProviders(providersData);
      setStats(statsData);
    } catch {
      toast.error('Failed to load insurance data');
    } finally {
      setLoading(false);
    }
  }, [hospitalId, statusFilter, providerFilter]);

  useEffect(() => { loadData(); }, [loadData]);

  const handleClaimStatusChange = async (id: string, status: ClaimStatus, extra?: Partial<InsuranceClaim>) => {
    try {
      await insuranceService.updateClaimStatus(id, status, extra);
      toast.success(`Claim ${status.replace('_', ' ')}`);
      loadData();
    } catch {
      toast.error('Failed to update claim');
    }
  };

  const filteredClaims = claims.filter(c => {
    if (!search) return true;
    const q = search.toLowerCase();
    return c.claim_number.toLowerCase().includes(q) ||
      c.patient_name?.toLowerCase().includes(q) ||
      c.provider_name?.toLowerCase().includes(q);
  });

  const filteredPreAuths = preAuths.filter(p => {
    if (!search) return true;
    const q = search.toLowerCase();
    return p.auth_number.toLowerCase().includes(q) ||
      p.patient_name?.toLowerCase().includes(q) ||
      p.provider_name?.toLowerCase().includes(q);
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Insurance & TPA"
        subtitle="Manage claims, pre-authorizations, and settlements"
        icon={ShieldCheck}
        actions={
          <div className="flex gap-2">
            <Button variant="outline" size="sm" className="gap-1.5" onClick={() => setProviderDialogOpen(true)}>
              <Building2 className="w-4 h-4" />
              Add Provider
            </Button>
            <Button variant="outline" size="sm" className="gap-1.5" onClick={() => setPreAuthDialogOpen(true)}>
              <FileText className="w-4 h-4" />
              New Pre-Auth
            </Button>
            <Button size="sm" className="gap-1.5" onClick={() => setClaimDialogOpen(true)}>
              <Plus className="w-4 h-4" />
              New Claim
            </Button>
          </div>
        }
      />

      {/* Stats */}
      {loading ? <StatCardsSkeleton count={4} /> : (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <SharedStatCard label="Total Claims" value={stats.totalClaims} icon={FileText} iconClassName="bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400" />
          <SharedStatCard label="Claimed Amount" value={formatCurrency(stats.totalClaimed)} icon={IndianRupee} iconClassName="bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400" />
          <SharedStatCard label="Approved" value={formatCurrency(stats.totalApproved)} icon={CheckCircle} iconClassName="bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400" />
          <SharedStatCard label="Settled" value={formatCurrency(stats.totalSettled)} icon={Banknote} iconClassName="bg-teal-100 dark:bg-teal-900/30 text-teal-600 dark:text-teal-400" />
        </div>
      )}

      {/* Tabs */}
      <div className="bg-card rounded-xl border border-border overflow-hidden">
        <div className="border-b border-border px-4 pt-3 pb-0 flex items-center justify-between flex-wrap gap-3">
          <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as ActiveTab)}>
            <TabsList>
              <TabsTrigger value="claims" className="gap-1.5">
                <FileText className="w-3.5 h-3.5" /> Claims
                {stats.pendingCount > 0 && <Badge variant="secondary" className="ml-1 text-[10px] h-5">{stats.pendingCount}</Badge>}
              </TabsTrigger>
              <TabsTrigger value="preauth" className="gap-1.5">
                <Clock className="w-3.5 h-3.5" /> Pre-Auth
              </TabsTrigger>
              <TabsTrigger value="providers" className="gap-1.5">
                <Building2 className="w-3.5 h-3.5" /> Providers
              </TabsTrigger>
              <TabsTrigger value="settlement" className="gap-1.5">
                <TrendingUp className="w-3.5 h-3.5" /> Settlement
              </TabsTrigger>
            </TabsList>
          </Tabs>

          <div className="flex items-center gap-2 pb-3">
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
              <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search..." className="h-8 pl-8 w-48 text-xs" />
            </div>
            {activeTab === 'claims' && (
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="h-8 w-32 text-xs">
                  <Filter className="w-3 h-3 mr-1" />
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="draft">Draft</SelectItem>
                  <SelectItem value="submitted">Submitted</SelectItem>
                  <SelectItem value="under_review">Under Review</SelectItem>
                  <SelectItem value="approved">Approved</SelectItem>
                  <SelectItem value="settled">Settled</SelectItem>
                  <SelectItem value="rejected">Rejected</SelectItem>
                </SelectContent>
              </Select>
            )}
            <Button variant="outline" size="sm" className="h-8 w-8 p-0" onClick={loadData} disabled={loading}>
              <RefreshCw className={cn('w-3.5 h-3.5', loading && 'animate-spin')} />
            </Button>
          </div>
        </div>

        <div className="p-0">
          {activeTab === 'claims' && (
            <ClaimsTable claims={filteredClaims} loading={loading} onStatusChange={handleClaimStatusChange} />
          )}
          {activeTab === 'preauth' && (
            <PreAuthTable preAuths={filteredPreAuths} loading={loading} />
          )}
          {activeTab === 'providers' && (
            <ProvidersTable providers={providers} loading={loading} />
          )}
          {activeTab === 'settlement' && (
            <SettlementDashboard claims={claims} providers={providers} loading={loading} />
          )}
        </div>
      </div>

      <CreateClaimDialog open={claimDialogOpen} onClose={() => setClaimDialogOpen(false)} onSuccess={loadData} hospitalId={hospitalId} userId={userId} providers={providers} />
      <CreatePreAuthDialog open={preAuthDialogOpen} onClose={() => setPreAuthDialogOpen(false)} onSuccess={loadData} hospitalId={hospitalId} userId={userId} providers={providers} />
      <AddProviderDialog open={providerDialogOpen} onClose={() => setProviderDialogOpen(false)} onSuccess={loadData} hospitalId={hospitalId} />
    </div>
  );
}

// ─── Claims Table ───────────────────────────────────────────────
function ClaimsTable({ claims, loading, onStatusChange }: {
  claims: InsuranceClaim[]; loading: boolean;
  onStatusChange: (id: string, status: ClaimStatus, extra?: Partial<InsuranceClaim>) => void;
}) {
  if (loading) return <div className="p-4"><TableSkeleton rows={6} columns={8} /></div>;
  if (claims.length === 0) return <EmptyState icon={FileText} title="No claims found" description="Create a new insurance claim to get started" />;

  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow className="bg-muted/50">
            <TableHead className="text-xs">Claim #</TableHead>
            <TableHead className="text-xs">Patient</TableHead>
            <TableHead className="text-xs">Provider</TableHead>
            <TableHead className="text-xs">Type</TableHead>
            <TableHead className="text-xs text-right">Claimed</TableHead>
            <TableHead className="text-xs text-right">Approved</TableHead>
            <TableHead className="text-xs">Status</TableHead>
            <TableHead className="text-xs">Date</TableHead>
            <TableHead className="text-xs w-16">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {claims.map(claim => (
            <TableRow key={claim.id} className="hover:bg-muted/30">
              <TableCell className="font-mono text-xs font-medium text-foreground">{claim.claim_number}</TableCell>
              <TableCell className="text-xs text-foreground">{claim.patient_name || '—'}</TableCell>
              <TableCell className="text-xs text-muted-foreground">{claim.provider_name || '—'}</TableCell>
              <TableCell>
                <Badge variant="outline" className="text-[10px] capitalize">{claim.claim_type}</Badge>
              </TableCell>
              <TableCell className="text-right text-xs font-medium text-foreground">{formatCurrency(claim.claimed_amount)}</TableCell>
              <TableCell className="text-right text-xs font-medium text-emerald-600 dark:text-emerald-400">
                {claim.approved_amount ? formatCurrency(claim.approved_amount) : '—'}
              </TableCell>
              <TableCell><ClaimStatusBadge status={claim.status} /></TableCell>
              <TableCell className="text-xs text-muted-foreground">{format(new Date(claim.created_at), 'dd MMM yy')}</TableCell>
              <TableCell>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm" className="h-7 w-7 p-0"><MoreHorizontal className="w-3.5 h-3.5" /></Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-44">
                    <DropdownMenuItem className="text-xs gap-2"><Eye className="w-3.5 h-3.5" /> View Details</DropdownMenuItem>
                    {claim.status === 'draft' && (
                      <DropdownMenuItem className="text-xs gap-2" onClick={() => onStatusChange(claim.id, 'submitted')}>
                        <Send className="w-3.5 h-3.5" /> Submit Claim
                      </DropdownMenuItem>
                    )}
                    {claim.status === 'submitted' && (
                      <DropdownMenuItem className="text-xs gap-2" onClick={() => onStatusChange(claim.id, 'under_review')}>
                        <Eye className="w-3.5 h-3.5" /> Mark Under Review
                      </DropdownMenuItem>
                    )}
                    {(claim.status === 'under_review' || claim.status === 'query_raised') && (
                      <>
                        <DropdownMenuItem className="text-xs gap-2" onClick={() => onStatusChange(claim.id, 'approved', { approved_amount: claim.claimed_amount })}>
                          <CheckCircle className="w-3.5 h-3.5" /> Approve
                        </DropdownMenuItem>
                        <DropdownMenuItem className="text-xs gap-2 text-destructive" onClick={() => onStatusChange(claim.id, 'rejected')}>
                          <XCircle className="w-3.5 h-3.5" /> Reject
                        </DropdownMenuItem>
                      </>
                    )}
                    {claim.status === 'approved' && (
                      <DropdownMenuItem className="text-xs gap-2" onClick={() => onStatusChange(claim.id, 'settled', { settled_amount: claim.approved_amount })}>
                        <Banknote className="w-3.5 h-3.5" /> Mark Settled
                      </DropdownMenuItem>
                    )}
                    <DropdownMenuSeparator />
                    <DropdownMenuItem className="text-xs gap-2"><FileText className="w-3.5 h-3.5" /> Print Claim</DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

// ─── Pre-Auth Table ─────────────────────────────────────────────
function PreAuthTable({ preAuths, loading }: { preAuths: PreAuthorization[]; loading: boolean }) {
  if (loading) return <div className="p-4"><TableSkeleton rows={5} columns={7} /></div>;
  if (preAuths.length === 0) return <EmptyState icon={Clock} title="No pre-authorization requests" description="Submit a pre-authorization request to get started" />;

  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow className="bg-muted/50">
            <TableHead className="text-xs">Auth #</TableHead>
            <TableHead className="text-xs">Patient</TableHead>
            <TableHead className="text-xs">Provider</TableHead>
            <TableHead className="text-xs">Procedure</TableHead>
            <TableHead className="text-xs text-right">Requested</TableHead>
            <TableHead className="text-xs text-right">Approved</TableHead>
            <TableHead className="text-xs">Status</TableHead>
            <TableHead className="text-xs">Valid Until</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {preAuths.map(pa => (
            <TableRow key={pa.id} className="hover:bg-muted/30">
              <TableCell className="font-mono text-xs font-medium text-foreground">{pa.auth_number}</TableCell>
              <TableCell className="text-xs text-foreground">{pa.patient_name || '—'}</TableCell>
              <TableCell className="text-xs text-muted-foreground">{pa.provider_name || '—'}</TableCell>
              <TableCell className="text-xs text-muted-foreground max-w-[150px] truncate">{pa.planned_procedure || '—'}</TableCell>
              <TableCell className="text-right text-xs font-medium text-foreground">{formatCurrency(pa.requested_amount)}</TableCell>
              <TableCell className="text-right text-xs font-medium text-emerald-600 dark:text-emerald-400">
                {pa.approved_amount ? formatCurrency(pa.approved_amount) : '—'}
              </TableCell>
              <TableCell><PreAuthStatusBadge status={pa.status} /></TableCell>
              <TableCell className="text-xs text-muted-foreground">{pa.valid_until ? format(new Date(pa.valid_until), 'dd MMM yy') : '—'}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

// ─── Providers Table ────────────────────────────────────────────
function ProvidersTable({ providers, loading }: { providers: InsuranceProvider[]; loading: boolean }) {
  if (loading) return <div className="p-4"><TableSkeleton rows={4} columns={6} /></div>;
  if (providers.length === 0) return <EmptyState icon={Building2} title="No providers added" description="Add insurance companies and TPAs" />;

  const TYPE_BADGE: Record<string, string> = {
    insurance: 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400',
    tpa: 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400',
    corporate: 'bg-teal-100 dark:bg-teal-900/30 text-teal-700 dark:text-teal-400',
  };

  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow className="bg-muted/50">
            <TableHead className="text-xs">Name</TableHead>
            <TableHead className="text-xs">Type</TableHead>
            <TableHead className="text-xs">Contact</TableHead>
            <TableHead className="text-xs">Phone</TableHead>
            <TableHead className="text-xs">Settlement (days)</TableHead>
            <TableHead className="text-xs">Status</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {providers.map(p => (
            <TableRow key={p.id} className="hover:bg-muted/30">
              <TableCell className="text-xs font-medium text-foreground">{p.name}</TableCell>
              <TableCell>
                <Badge variant="secondary" className={cn('text-[10px] capitalize', TYPE_BADGE[p.provider_type])}>
                  {p.provider_type}
                </Badge>
              </TableCell>
              <TableCell className="text-xs text-muted-foreground">{p.contact_person || '—'}</TableCell>
              <TableCell className="text-xs text-muted-foreground">{p.phone || '—'}</TableCell>
              <TableCell className="text-xs text-muted-foreground">{p.settlement_period_days} days</TableCell>
              <TableCell>
                <Badge variant={p.is_active ? 'default' : 'secondary'} className="text-[10px]">
                  {p.is_active ? 'Active' : 'Inactive'}
                </Badge>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

// ─── Settlement Dashboard ───────────────────────────────────────
function SettlementDashboard({ claims, providers, loading }: {
  claims: InsuranceClaim[]; providers: InsuranceProvider[]; loading: boolean;
}) {
  if (loading) return <div className="p-6"><StatCardsSkeleton count={3} /></div>;

  const settledClaims = claims.filter(c => c.status === 'settled');
  const approvedPending = claims.filter(c => c.status === 'approved');
  const totalSettled = settledClaims.reduce((s, c) => s + Number(c.settled_amount || 0), 0);
  const totalPendingSettlement = approvedPending.reduce((s, c) => s + Number(c.approved_amount || 0), 0);
  const avgTAT = settledClaims.length > 0
    ? Math.round(settledClaims.reduce((s, c) => {
        if (c.submitted_at && c.settled_at) {
          return s + (new Date(c.settled_at).getTime() - new Date(c.submitted_at).getTime()) / (1000 * 60 * 60 * 24);
        }
        return s;
      }, 0) / settledClaims.length)
    : 0;

  // Provider-wise summary
  const providerSummary = providers.map(p => {
    const providerClaims = claims.filter(c => c.provider_id === p.id);
    return {
      ...p,
      totalClaims: providerClaims.length,
      claimed: providerClaims.reduce((s, c) => s + Number(c.claimed_amount || 0), 0),
      settled: providerClaims.filter(c => c.status === 'settled').reduce((s, c) => s + Number(c.settled_amount || 0), 0),
      pending: providerClaims.filter(c => ['draft', 'submitted', 'under_review', 'query_raised', 'approved'].includes(c.status)).length,
    };
  }).filter(p => p.totalClaims > 0);

  return (
    <div className="p-6 space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <SharedStatCard label="Total Settled" value={formatCurrency(totalSettled)} icon={Banknote} iconClassName="bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400" />
        <SharedStatCard label="Pending Settlement" value={formatCurrency(totalPendingSettlement)} icon={Clock} iconClassName="bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400" />
        <SharedStatCard label="Avg. TAT (days)" value={avgTAT.toString()} subtitle="submission to settlement" icon={TrendingUp} iconClassName="bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400" />
      </div>

      {providerSummary.length > 0 ? (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <Building2 className="w-4 h-4 text-primary" />
              Provider-wise Settlement Summary
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50">
                  <TableHead className="text-xs">Provider</TableHead>
                  <TableHead className="text-xs">Type</TableHead>
                  <TableHead className="text-xs text-right">Claims</TableHead>
                  <TableHead className="text-xs text-right">Claimed</TableHead>
                  <TableHead className="text-xs text-right">Settled</TableHead>
                  <TableHead className="text-xs text-right">Pending</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {providerSummary.map(p => (
                  <TableRow key={p.id} className="hover:bg-muted/30">
                    <TableCell className="text-xs font-medium text-foreground">{p.name}</TableCell>
                    <TableCell className="text-xs text-muted-foreground capitalize">{p.provider_type}</TableCell>
                    <TableCell className="text-xs text-right text-foreground">{p.totalClaims}</TableCell>
                    <TableCell className="text-xs text-right text-foreground">{formatCurrency(p.claimed)}</TableCell>
                    <TableCell className="text-xs text-right text-emerald-600 dark:text-emerald-400 font-medium">{formatCurrency(p.settled)}</TableCell>
                    <TableCell className="text-xs text-right text-amber-600 dark:text-amber-400">{p.pending}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      ) : (
        <EmptyState icon={TrendingUp} title="No settlement data" description="Settled claims will appear here with provider-wise breakdown" />
      )}
    </div>
  );
}
