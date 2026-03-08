import { useState, useEffect, useCallback } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import {
  UserPlus, Search, RefreshCw, Filter, Download, Users,
  User, ChevronLeft, ChevronRight, Settings2,
  MoreHorizontal,
  Stethoscope, Receipt, BedDouble, History, Printer, CalendarCheck,
  Eye, Pencil,
} from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Skeleton } from '../../components/ui/skeleton';

import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger,
} from '../../components/ui/dropdown-menu';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import { useAppSelector, useAppDispatch } from '../../store';
import { useDebounce } from '../../hooks/useDebounce';
import { useSmartNavigation } from '../../hooks/useSmartNavigation';
import { loadPatientContext } from '../../store/slices/globalSlice';
import { usePageTitle } from '../../hooks/usePageTitle';
import dashboardService from '../../services/dashboard.service';
import PatientHistoryDrawer from './components/PatientHistoryDrawer';
import PatientStickerPrint from './components/PatientStickerPrint';
import CustomFieldsConfigPanel from './components/CustomFieldsConfigPanel';
import QuickBookAppointment from './components/QuickBookAppointment';
import { cn } from '../../lib/utils';

const SAMPLE_HOSPITAL_ID = '11111111-1111-1111-1111-111111111111';

interface Patient {
  id: string;
  full_name: string;
  uhid: string;
  phone: string;
  age?: number;
  gender?: string;
  blood_group?: string | null;
  registration_type?: string;
  created_at: string;
  is_active: boolean;
}

function exportToCSV(patients: Patient[], filename: string): void {
  const headers = ['UHID', 'Full Name', 'Phone', 'Age', 'Gender', 'Blood Group', 'Type', 'Date', 'Status'];
  const rows = patients.map((p) => [
    p.uhid, p.full_name, p.phone || '', p.age?.toString() || '',
    p.gender || '', p.blood_group || '', p.registration_type || '',
    p.created_at ? new Date(p.created_at).toLocaleDateString('en-IN') : '',
    p.is_active ? 'Active' : 'Inactive',
  ]);
  const csvContent = [headers.join(','), ...rows.map((row) => row.map((c) => `"${c.replace(/"/g, '""')}"`).join(','))].join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = `${filename}_${new Date().toISOString().split('T')[0]}.csv`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

function formatDate(d: string): string {
  if (!d) return '-';
  return new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}

const GENDER_STYLES: Record<string, string> = {
  male: 'text-primary bg-primary/10',
  female: 'text-rose-600 bg-rose-50',
  other: 'text-muted-foreground bg-muted',
};

const TYPE_STYLES: Record<string, string> = {
  'walk-in': 'bg-muted text-muted-foreground',
  scheduled: 'bg-primary/10 text-primary',
  emergency: 'bg-destructive/10 text-destructive',
};

export default function PatientsPage() {
  usePageTitle('Patients');
  const dispatch = useAppDispatch();
  const { user } = useAppSelector((s) => s.auth);
  const { startConsultation, goToBilling, admitPatient } = useSmartNavigation();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const hospitalId = user?.hospital_id ?? SAMPLE_HOSPITAL_ID;
  const highlightId = searchParams.get('id');

  const [patients, setPatients] = useState<Patient[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [searchInput, setSearchInput] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');

  const [historyPatientId, setHistoryPatientId] = useState<string | null>(highlightId);
  const [stickerPatient, setStickerPatient] = useState<Patient | null>(null);
  const [stickerSize, setStickerSize] = useState<'thermal' | 'a4'>('thermal');
  const [showCustomFields, setShowCustomFields] = useState(false);
  const [bookingPatient, setBookingPatient] = useState<Patient | null>(null);

  const search = useDebounce(searchInput, 280);
  const limit = 20;

  const loadPatients = useCallback(async () => {
    setLoading(true);
    try {
      const res = await dashboardService.getPatients(hospitalId, {
        search: search || undefined,
        registrationType: typeFilter === 'all' ? undefined : typeFilter,
        page, limit, sortBy: 'created_at', sortOrder: 'desc',
      });
      setPatients(res.data as Patient[]);
      setTotal(res.total);
      setTotalPages(res.totalPages);
    } catch {
      setPatients([]);
      toast.error('Failed to load patients');
    } finally {
      setLoading(false);
    }
  }, [hospitalId, search, typeFilter, page, limit]);

  useEffect(() => { setPage(1); }, [search, typeFilter]);
  useEffect(() => { loadPatients(); }, [loadPatients]);

  useEffect(() => {
    if (highlightId) {
      setHistoryPatientId(highlightId);
      dispatch(loadPatientContext(highlightId));
    }
  }, [highlightId, dispatch]);

  const openPatient = (p: Patient) => {
    setHistoryPatientId(p.id);
    setSearchParams({ id: p.id });
    dispatch(loadPatientContext(p.id));
  };

  const startNum = (page - 1) * limit + 1;
  const endNum = Math.min(page * limit, total);

  return (
    <div className="flex flex-col h-full p-2 md:p-3 space-y-2">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-bold text-foreground flex items-center gap-2">
            <Users className="w-5 h-5 text-primary" />
            Patient Records
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">{total.toLocaleString('en-IN')} patients registered</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" className="h-8 text-xs gap-1.5" onClick={() => setShowCustomFields(true)}>
            <Settings2 className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Custom Fields</span>
          </Button>
          <Button variant="outline" size="sm" className="h-8 text-xs gap-1.5"
            onClick={() => exportToCSV(patients, `patients_${typeFilter}`)} disabled={patients.length === 0}>
            <Download className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Export</span>
          </Button>
          <Button size="sm" className="h-8 gap-1.5 text-xs" onClick={() => navigate('/add-patient')}>
            <UserPlus className="w-3.5 h-3.5" />
            Register New
          </Button>
        </div>
      </div>

      {/* Filters bar */}
      <div className="flex items-center gap-2">
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
          <Input value={searchInput} onChange={e => setSearchInput(e.target.value)}
            placeholder="Search UHID, name, mobile..." className="h-8 pl-8 text-xs" />
        </div>
        <Select value={typeFilter} onValueChange={setTypeFilter}>
          <SelectTrigger className="h-8 w-[110px] text-xs">
            <Filter className="w-3 h-3 text-muted-foreground mr-1" />
            <SelectValue placeholder="All Types" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            <SelectItem value="walk-in">Walk-in</SelectItem>
            <SelectItem value="scheduled">Scheduled</SelectItem>
            <SelectItem value="emergency">Emergency</SelectItem>
          </SelectContent>
        </Select>
        <Button variant="outline" size="sm" onClick={loadPatients} disabled={loading} className="h-8 w-8 p-0">
          <RefreshCw className={cn('w-3.5 h-3.5', loading && 'animate-spin')} />
        </Button>
      </div>

      {/* Table */}
      <div className="flex-1 bg-card border border-border/40 rounded-xl overflow-hidden flex flex-col min-h-0">
        <div className="overflow-auto flex-1 scrollbar-thin">
          <table className="w-full text-left">
            <thead className="sticky top-0 z-10">
              <tr className="bg-muted/40 border-b border-border/40">
                <th className="px-3 py-2.5 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider w-[120px]">UHID</th>
                <th className="px-3 py-2.5 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Patient Name</th>
                <th className="px-3 py-2.5 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider w-[100px] hidden md:table-cell">Phone</th>
                <th className="px-3 py-2.5 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider w-[60px] hidden lg:table-cell">Age</th>
                <th className="px-3 py-2.5 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider w-[70px] hidden lg:table-cell">Gender</th>
                <th className="px-3 py-2.5 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider w-[60px] hidden xl:table-cell">Blood</th>
                <th className="px-3 py-2.5 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider w-[80px] hidden xl:table-cell">Type</th>
                <th className="px-3 py-2.5 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider w-[90px] hidden lg:table-cell">Reg. Date</th>
                <th className="px-3 py-2.5 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider w-[200px] text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array.from({ length: 8 }).map((_, i) => (
                  <tr key={i} className="border-b border-border/20">
                    {Array.from({ length: 9 }).map((_, j) => (
                      <td key={j} className="px-3 py-2.5"><Skeleton className="h-4 w-full" /></td>
                    ))}
                  </tr>
                ))
              ) : patients.length === 0 ? (
                <tr>
                  <td colSpan={9} className="text-center py-16">
                    <User className="w-8 h-8 text-muted-foreground/30 mx-auto mb-2" />
                    <p className="text-sm text-muted-foreground">No patients found</p>
                    <Button size="sm" variant="outline" className="mt-3 gap-1.5 text-xs" onClick={() => navigate('/add-patient')}>
                      <UserPlus className="w-3.5 h-3.5" /> Register First Patient
                    </Button>
                  </td>
                </tr>
              ) : (
                patients.map((p) => {
                  const initials = p.full_name.split(' ').slice(0, 2).map(n => n[0]).join('').toUpperCase();
                  return (
                    <tr
                      key={p.id}
                      onClick={() => openPatient(p)}
                      className={cn(
                        'border-b border-border/15 cursor-pointer transition-colors group',
                        historyPatientId === p.id ? 'bg-primary/5' : 'hover:bg-muted/30'
                      )}
                    >
                      <td className="px-3 py-2">
                        <span className="text-[11px] font-mono text-muted-foreground">{p.uhid}</span>
                      </td>
                      <td className="px-3 py-2">
                        <div className="flex items-center gap-2.5">
                          <div className={cn(
                            'w-7 h-7 rounded-lg flex items-center justify-center text-[10px] font-bold shrink-0',
                            historyPatientId === p.id ? 'bg-primary text-primary-foreground' : 'bg-primary/10 text-primary'
                          )}>
                            {initials}
                          </div>
                          <div className="min-w-0">
                            <p className="text-xs font-semibold text-foreground truncate">{p.full_name}</p>
                            {!p.is_active && <span className="text-[9px] text-destructive">Inactive</span>}
                          </div>
                        </div>
                      </td>
                      <td className="px-3 py-2 hidden md:table-cell">
                        <span className="text-[11px] text-muted-foreground">{p.phone || '-'}</span>
                      </td>
                      <td className="px-3 py-2 hidden lg:table-cell">
                        <span className="text-[11px] text-muted-foreground">{p.age != null ? `${p.age}y` : '-'}</span>
                      </td>
                      <td className="px-3 py-2 hidden lg:table-cell">
                        {p.gender ? (
                          <span className={cn('text-[10px] font-medium px-1.5 py-0.5 rounded-full capitalize', GENDER_STYLES[p.gender] ?? GENDER_STYLES.other)}>
                            {p.gender}
                          </span>
                        ) : <span className="text-[11px] text-muted-foreground">-</span>}
                      </td>
                      <td className="px-3 py-2 hidden xl:table-cell">
                        {p.blood_group ? (
                          <span className="text-[10px] font-bold text-destructive bg-destructive/10 px-1.5 py-0.5 rounded">{p.blood_group}</span>
                        ) : <span className="text-[11px] text-muted-foreground">-</span>}
                      </td>
                      <td className="px-3 py-2 hidden xl:table-cell">
                        {p.registration_type ? (
                          <span className={cn('text-[10px] font-medium px-1.5 py-0.5 rounded-full capitalize', TYPE_STYLES[p.registration_type] ?? TYPE_STYLES['walk-in'])}>
                            {p.registration_type}
                          </span>
                        ) : <span className="text-[11px] text-muted-foreground">-</span>}
                      </td>
                      <td className="px-3 py-2 hidden lg:table-cell">
                        <span className="text-[10px] text-muted-foreground">{formatDate(p.created_at)}</span>
                      </td>
                      <td className="px-3 py-2">
                        <div className="flex items-center justify-end gap-1 opacity-60 group-hover:opacity-100 transition-opacity" onClick={e => e.stopPropagation()}>
                          <Button size="sm" variant="ghost" className="h-6 px-1.5 text-[10px] gap-1 text-primary hover:bg-primary/10"
                            onClick={() => openPatient(p)} title="View Details">
                            <Eye className="w-3 h-3" /> View
                          </Button>
                          <Button size="sm" variant="ghost" className="h-6 px-1.5 text-[10px] gap-1 text-teal-700 hover:bg-teal-50"
                            onClick={() => startConsultation(p.id)} title="Start OPD">
                            <Stethoscope className="w-3 h-3" /> OPD
                          </Button>
                          <Button size="sm" variant="ghost" className="h-6 px-1.5 text-[10px] gap-1 text-emerald-700 hover:bg-emerald-50"
                            onClick={() => goToBilling(p.id)} title="Billing">
                            <Receipt className="w-3 h-3" /> Bill
                          </Button>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button size="sm" variant="ghost" className="h-6 w-6 p-0 text-muted-foreground hover:text-foreground">
                                <MoreHorizontal className="w-3.5 h-3.5" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-44">
                              <DropdownMenuItem onClick={() => navigate(`/edit-patient?id=${p.id}`)} className="text-xs gap-2">
                                <Pencil className="w-3.5 h-3.5" /> Edit Patient
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => setBookingPatient(p)} className="text-xs gap-2">
                                <CalendarCheck className="w-3.5 h-3.5" /> Book Appointment
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => admitPatient(p.id)} className="text-xs gap-2">
                                <BedDouble className="w-3.5 h-3.5" /> Admit to IPD
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem onClick={() => setHistoryPatientId(p.id)} className="text-xs gap-2">
                                <History className="w-3.5 h-3.5" /> Full History
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => setStickerPatient(p)} className="text-xs gap-2">
                                <Printer className="w-3.5 h-3.5" /> Print Sticker
                              </DropdownMenuItem>
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
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-3 py-2 border-t border-border/30 bg-muted/20 shrink-0">
            <span className="text-[10px] text-muted-foreground">
              {startNum}–{endNum} of {total.toLocaleString('en-IN')}
            </span>
            <div className="flex items-center gap-1">
              <Button variant="outline" size="sm" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="h-7 w-7 p-0">
                <ChevronLeft className="w-3.5 h-3.5" />
              </Button>
              <span className="text-[10px] text-muted-foreground px-2 font-medium">{page}/{totalPages}</span>
              <Button variant="outline" size="sm" onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="h-7 w-7 p-0">
                <ChevronRight className="w-3.5 h-3.5" />
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Drawers & Dialogs */}
      {historyPatientId && (
        <PatientHistoryDrawer patientId={historyPatientId} onClose={() => { setHistoryPatientId(null); setSearchParams({}); }} />
      )}
      {stickerPatient && (
        <PatientStickerPrint patient={stickerPatient} onClose={() => setStickerPatient(null)} stickerSize={stickerSize} onSizeChange={setStickerSize} />
      )}
      {showCustomFields && (
        <CustomFieldsConfigPanel hospitalId={hospitalId} onClose={() => setShowCustomFields(false)} />
      )}
      {bookingPatient && (
        <QuickBookAppointment open={!!bookingPatient} onClose={() => setBookingPatient(null)}
          hospitalId={hospitalId} userId={user?.id ?? ''} patientId={bookingPatient.id}
          patientName={bookingPatient.full_name} patientUhid={bookingPatient.uhid} onSuccess={loadPatients} />
      )}
    </div>
  );
}
