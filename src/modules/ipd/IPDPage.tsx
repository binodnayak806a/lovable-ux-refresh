import { useState, useEffect, useCallback, useMemo } from 'react';
import {
  BedDouble, Search, RefreshCw, Filter, FileText,
  MoreVertical, Info, Phone, CreditCard,
  ShoppingCart, ClipboardList, ChevronLeft, ChevronRight, Plus,
  LogOut, Printer, FileSignature,
} from 'lucide-react';
import { Skeleton } from '../../components/ui/skeleton';
import { useAppSelector } from '../../store';
import { usePageTitle } from '../../hooks/usePageTitle';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { Input } from '../../components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '../../components/ui/dropdown-menu';
import ipdService from '../../services/ipd.service';
import PatientDetailPanel from './components/PatientDetailPanel';
import BedAvailability from './components/BedAvailability';
import DischargeDialog from './components/DischargeDialog';
import DischargeSummaryView from './components/DischargeSummaryView';
import IpdStickerPrint from './components/IpdStickerPrint';
import IpdConsentForm from './components/IpdConsentForm';
import type { Admission, Ward } from './types';
import { format, differenceInDays, differenceInMonths } from 'date-fns';
import { cn } from '../../lib/utils';
import { toast } from 'sonner';

const SAMPLE_HOSPITAL_ID = '11111111-1111-1111-1111-111111111111';

type StatusTab = 'all' | 'active' | 'discharged' | 'transferred' | 'absconded' | 'death';

const STATUS_TABS: { id: StatusTab; label: string }[] = [
  { id: 'all', label: 'ALL' },
  { id: 'active', label: 'ADMITTED' },
  { id: 'discharged', label: 'DISCHARGED' },
  { id: 'transferred', label: 'TRANSFERRED' },
  { id: 'absconded', label: 'CANCELLED' },
];

function formatStayDuration(admDate: string): string {
  const start = new Date(admDate);
  const now = new Date();
  const months = differenceInMonths(now, start);
  const days = differenceInDays(now, start) - months * 30;
  if (months > 0) return `${months} M, ${days} D`;
  return `${days} D`;
}

export default function IPDPage() {
  usePageTitle('IPD');
  const { hospitalId } = useAppSelector((s) => s.auth);
  const effectiveHospitalId = hospitalId ?? SAMPLE_HOSPITAL_ID;

  // View mode
  const [viewMode, setViewMode] = useState<'list' | 'beds'>('list');

  // Data
  const [admissions, setAdmissions] = useState<Admission[]>([]);
  const [wards, setWards] = useState<Ward[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [counts, setCounts] = useState<Record<string, number>>({});

  // Filters
  const [activeTab, setActiveTab] = useState<StatusTab>('active');
  const [search, setSearch] = useState('');
  const [doctorFilter, setDoctorFilter] = useState('all');
  const [wardFilter, setWardFilter] = useState('all');
  const [billingFilter, setBillingFilter] = useState<'all' | 'paid' | 'due'>('all');
  const [payerFilter, setPayerFilter] = useState('all');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  // Pagination
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(25);

  // Selection & dialogs
  const [selectedAdmission, setSelectedAdmission] = useState<Admission | null>(null);
  const [dischargeAdmission, setDischargeAdmission] = useState<Admission | null>(null);
  const [summaryAdmission, setSummaryAdmission] = useState<Admission | null>(null);
  const [labelAdmission, setLabelAdmission] = useState<Admission | null>(null);
  const [consentAdmission, setConsentAdmission] = useState<Admission | null>(null);

  // Doctors for filter
  const [doctors, setDoctors] = useState<{ id: string; full_name: string; department: string | null }[]>([]);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [result, wardsData, doctorsData, countsData] = await Promise.all([
        ipdService.getAllAdmissions(
          effectiveHospitalId,
          {
            status: activeTab === 'all' ? null : activeTab,
            wardId: wardFilter !== 'all' ? wardFilter : undefined,
            doctorId: doctorFilter !== 'all' ? doctorFilter : undefined,
            billingStatus: billingFilter,
            dateFrom: dateFrom || undefined,
            dateTo: dateTo || undefined,
          },
          page,
          perPage
        ),
        ipdService.getWards(effectiveHospitalId),
        ipdService.getDoctors(),
        ipdService.getAdmissionCounts(effectiveHospitalId),
      ]);
      setAdmissions(result.data);
      setTotal(result.total);
      setWards(wardsData);
      setDoctors(doctorsData);
      setCounts(countsData);
    } catch {
      // silently handle
    } finally {
      setLoading(false);
    }
  }, [effectiveHospitalId, activeTab, wardFilter, doctorFilter, billingFilter, dateFrom, dateTo, page, perPage]);

  useEffect(() => { loadData(); }, [loadData]);

  // Reset page on filter change
  useEffect(() => { setPage(1); }, [activeTab, wardFilter, doctorFilter, billingFilter, search]);

  // Client-side search filter
  const filtered = useMemo(() => {
    if (!search.trim()) return admissions;
    const q = search.toLowerCase();
    return admissions.filter(a =>
      a.patient?.full_name?.toLowerCase().includes(q) ||
      a.patient?.uhid?.toLowerCase().includes(q) ||
      a.patient?.phone?.includes(q) ||
      a.admission_number?.toLowerCase().includes(q)
    );
  }, [admissions, search]);

  const totalPages = Math.ceil(total / perPage);
  const fromItem = (page - 1) * perPage + 1;
  const toItem = Math.min(page * perPage, total);

  const getBillingBadge = (adm: Admission) => {
    return adm.billing_category === 'Cash'
      ? { label: 'CASH (SELF)', color: 'text-foreground' }
      : { label: adm.billing_category?.toUpperCase() || '---', color: 'text-foreground' };
  };

  const getAdmTypeBadge = (adm: Admission) => {
    if (adm.admission_type === 'emergency') return { label: 'EMERGENCY', color: 'text-red-600 font-semibold' };
    if (adm.admission_type === 'planned') return { label: 'PLANNED', color: 'text-blue-600' };
    if (adm.admission_type === 'transfer') return { label: 'TRANSFER', color: 'text-amber-600' };
    return { label: '---', color: 'text-muted-foreground' };
  };

  // Action handlers
  const handleViewDetails = (adm: Admission) => {
    setSelectedAdmission(adm);
  };

  const handleDischarge = (adm: Admission) => {
    if (adm.status !== 'active') {
      toast.info('Patient is already discharged');
      return;
    }
    setDischargeAdmission(adm);
  };

  const handleViewBilling = (adm: Admission) => {
    setSelectedAdmission(adm);
    // The detail panel will auto-show, user can click Billing tab
    // We set a small timeout so the panel opens first
    setTimeout(() => {
      const billingTab = document.querySelector('[data-tab="billing"]') as HTMLButtonElement;
      billingTab?.click();
    }, 100);
  };

  const handleViewSummary = (adm: Admission) => {
    setSummaryAdmission(adm);
  };

  const handlePrintLabel = (adm: Admission) => {
    setLabelAdmission(adm);
  };

  const handleGenerateBedCharge = async (adm: Admission) => {
    try {
      const result = await ipdService.generateDailyBedCharge(adm.id, 'system');
      if (result) {
        toast.success('Bed charge generated for today');
      } else {
        toast.info('Bed charge already exists for today');
      }
    } catch {
      toast.error('Failed to generate bed charge');
    }
  };

  const handleDischargeSuccess = () => {
    setDischargeAdmission(null);
    setSelectedAdmission(null);
    loadData();
  };

  return (
    <div className="flex flex-col h-full bg-background overflow-hidden">
      {/* Quick help hint */}
      <div className="px-4 pt-2 pb-0">
        <p className="text-[11px] text-muted-foreground">
          💡 <strong>IPD:</strong> Search patients by name or UHID • Click any row for details • Use filters to narrow results
        </p>
      </div>
      {/* ── Top Filter Bar ── */}
      <div className="border-b border-border bg-card px-4 pt-2 pb-0 space-y-2">
        {/* Row 1: Status Tabs + Duration + Search */}
        <div className="flex items-center gap-3 flex-wrap">
          {/* Status Tabs */}
          <div className="flex items-center gap-0.5">
            {STATUS_TABS.map(tab => {
              const count = tab.id === 'all' ? (counts.all ?? 0) :
                tab.id === 'active' ? (counts.active ?? 0) :
                tab.id === 'discharged' ? (counts.discharged ?? 0) :
                tab.id === 'transferred' ? (counts.transferred ?? 0) :
                (counts.absconded ?? 0);
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={cn(
                    'px-3 py-1.5 text-xs font-semibold rounded-md transition-all',
                    activeTab === tab.id
                      ? 'bg-primary text-primary-foreground shadow-sm'
                      : 'text-muted-foreground hover:bg-muted'
                  )}
                >
                  {tab.label} ({count})
                </button>
              );
            })}
          </div>

          <div className="h-5 w-px bg-border" />

          {/* Date Range */}
          <div className="flex items-center gap-1.5 text-xs">
            <span className="text-muted-foreground">From</span>
            <Input
              type="date"
              value={dateFrom}
              onChange={e => setDateFrom(e.target.value)}
              className="h-7 w-32 text-xs"
            />
            <span className="text-muted-foreground">To</span>
            <Input
              type="date"
              value={dateTo}
              onChange={e => setDateTo(e.target.value)}
              className="h-7 w-32 text-xs"
            />
          </div>

          <div className="h-5 w-px bg-border" />

          {/* Search */}
          <div className="relative flex-1 max-w-xs">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
            <Input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Patient or UHID..."
              className="h-7 pl-8 text-xs"
            />
          </div>

          <div className="ml-auto flex items-center gap-2">
            <Button
              size="sm"
              variant={viewMode === 'list' ? 'default' : 'outline'}
              className="h-7 text-xs gap-1"
              onClick={() => setViewMode('list')}
            >
              <ClipboardList className="w-3.5 h-3.5" />
              List
            </Button>
            <Button
              size="sm"
              variant={viewMode === 'beds' ? 'default' : 'outline'}
              className="h-7 text-xs gap-1"
              onClick={() => setViewMode('beds')}
            >
              <BedDouble className="w-3.5 h-3.5" />
              Beds
            </Button>
            <Button size="sm" variant="outline" className="h-7 text-xs gap-1" onClick={loadData}>
              <RefreshCw className={cn('w-3.5 h-3.5', loading && 'animate-spin')} />
            </Button>
            <Button
              size="sm"
              className="h-7 text-xs gap-1"
              onClick={() => setViewMode('beds')}
              title="Admit from Bed View"
            >
              <Plus className="w-3.5 h-3.5" />
              Admit
            </Button>
          </div>
        </div>

        {/* Row 2: Filter dropdowns */}
        <div className="flex items-center gap-2 flex-wrap pb-2">
          <Filter className="w-3.5 h-3.5 text-muted-foreground" />

          <Select value={doctorFilter} onValueChange={setDoctorFilter}>
            <SelectTrigger className="h-7 w-36 text-xs">
              <SelectValue placeholder="Doctor" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Doctors</SelectItem>
              {doctors.map(d => (
                <SelectItem key={d.id} value={d.id}>Dr. {d.full_name}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={wardFilter} onValueChange={setWardFilter}>
            <SelectTrigger className="h-7 w-36 text-xs">
              <SelectValue placeholder="Ward" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Wards</SelectItem>
              {wards.map(w => (
                <SelectItem key={w.id} value={w.id}>{w.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={payerFilter} onValueChange={setPayerFilter}>
            <SelectTrigger className="h-7 w-32 text-xs">
              <SelectValue placeholder="Payer" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Payers</SelectItem>
              <SelectItem value="cash">Cash (Self)</SelectItem>
              <SelectItem value="insurance">Insurance</SelectItem>
              <SelectItem value="tpa">TPA</SelectItem>
              <SelectItem value="corporate">Corporate</SelectItem>
            </SelectContent>
          </Select>

          <div className="h-5 w-px bg-border" />

          {/* Payment type radios */}
          <div className="flex items-center gap-3 text-xs">
            <span className="text-muted-foreground font-medium">Payment:</span>
            {(['all', 'paid', 'due'] as const).map(v => (
              <label key={v} className="flex items-center gap-1 cursor-pointer">
                <input
                  type="radio"
                  name="billingFilter"
                  checked={billingFilter === v}
                  onChange={() => setBillingFilter(v)}
                  className="w-3 h-3 text-primary"
                />
                <span className={cn('capitalize', billingFilter === v && 'font-semibold text-foreground')}>
                  {v}
                </span>
              </label>
            ))}
          </div>
        </div>
      </div>

      {/* ── Content Area ── */}
      {viewMode === 'beds' ? (
        <div className="flex-1 overflow-auto p-4">
          <BedAvailability hospitalId={effectiveHospitalId} />
        </div>
      ) : (
        <div className="flex flex-1 overflow-hidden">
          {/* Table */}
          <div className="flex-1 flex flex-col overflow-hidden">
            <div className="flex-1 overflow-auto">
              <table className="w-full text-xs">
                <thead className="bg-muted/60 sticky top-0 z-10">
                  <tr className="border-b border-border">
                    <th className="py-2.5 px-3 text-left font-semibold text-muted-foreground uppercase tracking-wider whitespace-nowrap">UHID</th>
                    <th className="py-2.5 px-3 text-left font-semibold text-muted-foreground uppercase tracking-wider whitespace-nowrap">Patient</th>
                    {!selectedAdmission && <th className="py-2.5 px-3 text-left font-semibold text-muted-foreground uppercase tracking-wider whitespace-nowrap">Mobile No</th>}
                    <th className="py-2.5 px-3 text-left font-semibold text-muted-foreground uppercase tracking-wider whitespace-nowrap">Doctor</th>
                    <th className="py-2.5 px-3 text-left font-semibold text-muted-foreground uppercase tracking-wider whitespace-nowrap">Ward/Bed</th>
                    <th className="py-2.5 px-3 text-left font-semibold text-muted-foreground uppercase tracking-wider whitespace-nowrap">DOA</th>
                    {!selectedAdmission && <th className="py-2.5 px-3 text-left font-semibold text-muted-foreground uppercase tracking-wider whitespace-nowrap">Payer</th>}
                    {!selectedAdmission && <th className="py-2.5 px-3 text-left font-semibold text-muted-foreground uppercase tracking-wider whitespace-nowrap">Billing</th>}
                    {!selectedAdmission && <th className="py-2.5 px-3 text-left font-semibold text-muted-foreground uppercase tracking-wider whitespace-nowrap">Adm Type</th>}
                    
                    <th className="py-2.5 px-3 text-center font-semibold text-muted-foreground uppercase tracking-wider whitespace-nowrap w-16">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    Array.from({ length: 8 }).map((_, i) => (
                      <tr key={i} className="border-b border-border/20">
                        {Array.from({ length: selectedAdmission ? 7 : 11 }).map((_, j) => (
                          <td key={j} className="px-3 py-2.5"><Skeleton className="h-4 w-full" /></td>
                        ))}
                      </tr>
                    ))
                  ) : filtered.length === 0 ? (
                    <tr>
                      <td colSpan={selectedAdmission ? 7 : 11} className="py-16 text-center text-muted-foreground">
                        <div className="flex flex-col items-center gap-2">
                          <BedDouble className="w-8 h-8 text-muted-foreground/40" />
                          <p>No admissions found</p>
                          <Button size="sm" variant="outline" className="text-xs mt-1" onClick={() => setViewMode('beds')}>
                            <Plus className="w-3 h-3 mr-1" /> Admit from Bed View
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    filtered.map((adm) => {
                      const billing = getBillingBadge(adm);
                      const admType = getAdmTypeBadge(adm);
                      const isRowSelected = selectedAdmission?.id === adm.id;
                      return (
                        <tr
                          key={adm.id}
                          onClick={() => handleViewDetails(adm)}
                          className={cn(
                            'border-b border-border/50 cursor-pointer transition-colors',
                            isRowSelected ? 'bg-primary/5' : 'hover:bg-muted/40'
                          )}
                        >
                          <td className="py-2.5 px-3 font-medium text-primary whitespace-nowrap">{adm.patient?.uhid || adm.admission_number}</td>
                          <td className="py-2.5 px-3">
                            <div className="font-semibold text-foreground uppercase truncate max-w-[120px]">{adm.patient?.full_name}</div>
                          </td>
                          {!selectedAdmission && (
                            <td className="py-2.5 px-3">
                              <div className="flex items-center gap-1">
                                <Phone className="w-3 h-3 text-muted-foreground" />
                                <span>{adm.patient?.phone || '---'}</span>
                              </div>
                            </td>
                          )}
                          <td className="py-2.5 px-3 truncate max-w-[120px]">
                            DR. {adm.doctor?.full_name?.toUpperCase() || '---'}
                          </td>
                          <td className="py-2.5 px-3 whitespace-nowrap">
                            <div className="font-medium">{adm.bed?.bed_number || '---'}</div>
                            <div className="text-[10px] text-muted-foreground">
                              {(adm.bed?.ward as { name?: string })?.name || '---'}
                            </div>
                          </td>
                          <td className="py-2.5 px-3 whitespace-nowrap">
                            <div>{adm.admission_date ? format(new Date(adm.admission_date), 'dd/MM') : '---'}</div>
                            <div className="text-[10px] text-muted-foreground">
                              {adm.admission_date ? formatStayDuration(adm.admission_date) : ''}
                            </div>
                          </td>
                          {!selectedAdmission && (
                            <td className="py-2.5 px-3">
                              <span className={billing.color}>{billing.label}</span>
                            </td>
                          )}
                          {!selectedAdmission && (
                            <td className="py-2.5 px-3">
                              <Badge
                                variant="outline"
                                className={cn('text-[10px] px-1.5 py-0.5 font-semibold',
                                  adm.status === 'active' ? 'text-destructive border-destructive/30' : 'text-primary border-primary/30'
                                )}
                              >
                                {adm.status === 'active' ? 'DUE' : 'PAID'}
                              </Badge>
                            </td>
                          )}
                          {!selectedAdmission && (
                            <td className="py-2.5 px-3 whitespace-nowrap">
                              <span className={admType.color}>{admType.label}</span>
                            </td>
                          )}
                          <td className="py-2.5 px-3">
                            <div className="flex items-center justify-center" onClick={e => e.stopPropagation()}>
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <button className="w-7 h-7 rounded-md flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted transition-colors">
                                    <MoreVertical className="w-4 h-4" />
                                  </button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end" className="w-48">
                                  <DropdownMenuItem onClick={() => handleViewDetails(adm)}>
                                    <Info className="w-3.5 h-3.5 mr-2" /> Patient Info
                                  </DropdownMenuItem>
                                  <DropdownMenuItem onClick={() => handleViewBilling(adm)}>
                                    <CreditCard className="w-3.5 h-3.5 mr-2" /> View Billing
                                  </DropdownMenuItem>
                                  <DropdownMenuItem onClick={() => handleGenerateBedCharge(adm)}>
                                    <ShoppingCart className="w-3.5 h-3.5 mr-2" /> Generate Bed Charge
                                  </DropdownMenuItem>
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem onClick={() => handleViewSummary(adm)}>
                                    <FileText className="w-3.5 h-3.5 mr-2" /> Discharge Summary
                                  </DropdownMenuItem>
                                  <DropdownMenuItem onClick={() => handlePrintLabel(adm)}>
                                    <Printer className="w-3.5 h-3.5 mr-2" /> Print Label
                                  </DropdownMenuItem>
                                  <DropdownMenuItem onClick={() => setConsentAdmission(adm)}>
                                    <FileSignature className="w-3.5 h-3.5 mr-2" /> Consent Form
                                  </DropdownMenuItem>
                                  {adm.status === 'active' && (
                                    <>
                                      <DropdownMenuSeparator />
                                      <DropdownMenuItem
                                        onClick={() => handleDischarge(adm)}
                                        className="text-destructive focus:text-destructive"
                                      >
                                        <LogOut className="w-3.5 h-3.5 mr-2" /> Discharge Patient
                                      </DropdownMenuItem>
                                    </>
                                  )}
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            <div className="border-t border-border bg-card px-4 py-2 flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <span className="text-muted-foreground">Items per page:</span>
                <Select value={String(perPage)} onValueChange={v => { setPerPage(Number(v)); setPage(1); }}>
                  <SelectTrigger className="h-6 w-16 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {[10, 25, 50, 100].map(n => (
                      <SelectItem key={n} value={String(n)}>{n}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-muted-foreground">
                  {total > 0 ? `${fromItem} – ${toItem} of ${total}` : '0 results'}
                </span>
                <div className="flex items-center gap-1">
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-6 w-6 p-0"
                    disabled={page <= 1}
                    onClick={() => setPage(p => p - 1)}
                  >
                    <ChevronLeft className="w-3.5 h-3.5" />
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-6 w-6 p-0"
                    disabled={page >= totalPages}
                    onClick={() => setPage(p => p + 1)}
                  >
                    <ChevronRight className="w-3.5 h-3.5" />
                  </Button>
                </div>
              </div>
            </div>
          </div>

          {/* Right Detail Panel */}
          {selectedAdmission && (
            <div className="w-[400px] flex-shrink-0 border-l border-border">
              <PatientDetailPanel
                admission={selectedAdmission}
                onUpdate={loadData}
                onClose={() => setSelectedAdmission(null)}
              />
            </div>
          )}
        </div>
      )}

      {/* Discharge Dialog */}
      {dischargeAdmission && (
        <DischargeDialog
          admission={dischargeAdmission}
          onClose={() => setDischargeAdmission(null)}
          onSuccess={handleDischargeSuccess}
        />
      )}

      {/* Discharge Summary View */}
      {summaryAdmission && (
        <DischargeSummaryView
          admission={summaryAdmission}
          onClose={() => setSummaryAdmission(null)}
        />
      )}

      {/* Label Print */}
      {labelAdmission && (
        <IpdStickerPrint
          admission={labelAdmission}
          onClose={() => setLabelAdmission(null)}
        />
      )}

      {/* Consent Form */}
      {consentAdmission && (
        <IpdConsentForm
          admission={consentAdmission}
          onClose={() => setConsentAdmission(null)}
        />
      )}
    </div>
  );
}
