import { useState, useEffect, useCallback } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import {
  UserPlus, Search, RefreshCw, Filter, Download, Users,
  User, Heart, Activity, ChevronLeft, ChevronRight, Settings2,
} from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Skeleton } from '../../components/ui/skeleton';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '../../components/ui/tooltip';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import { Card, CardContent } from '../../components/ui/card';
import { useAppSelector, useAppDispatch } from '../../store';
import { useDebounce } from '../../hooks/useDebounce';
import { useSmartNavigation } from '../../hooks/useSmartNavigation';
import { loadPatientContext } from '../../store/slices/globalSlice';
import { usePageTitle } from '../../hooks/usePageTitle';
import PageHeader from '../../components/shared/PageHeader';
import dashboardService from '../../services/dashboard.service';
import PatientCard from './components/PatientCard';
import PatientDetailSidebar from './components/PatientDetailSidebar';
import PatientHistoryDrawer from './components/PatientHistoryDrawer';
import PatientStickerPrint from './components/PatientStickerPrint';
import CustomFieldsConfigPanel from './components/CustomFieldsConfigPanel';

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
  const headers = ['UHID', 'Full Name', 'Phone', 'Age', 'Gender', 'Blood Group', 'Registration Type', 'Registration Date', 'Status'];
  const rows = patients.map((p) => [
    p.uhid, p.full_name, p.phone || '', p.age?.toString() || '',
    p.gender || '', p.blood_group || '', p.registration_type || '',
    p.created_at ? new Date(p.created_at).toLocaleDateString('en-IN') : '',
    p.is_active ? 'Active' : 'Inactive',
  ]);
  const csvContent = [
    headers.join(','),
    ...rows.map((row) => row.map((cell) => `"${cell.replace(/"/g, '""')}"`).join(',')),
  ].join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = `${filename}_${new Date().toISOString().split('T')[0]}.csv`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(link.href);
}

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
  const [selectedId, setSelectedId] = useState<string | null>(highlightId);

  const [historyPatientId, setHistoryPatientId] = useState<string | null>(null);
  const [stickerPatient, setStickerPatient] = useState<Patient | null>(null);
  const [stickerSize, setStickerSize] = useState<'thermal' | 'a4'>('thermal');
  const [showCustomFields, setShowCustomFields] = useState(false);

  const search = useDebounce(searchInput, 280);
  const limit = 15;

  const loadPatients = useCallback(async () => {
    setLoading(true);
    try {
      const res = await dashboardService.getPatients(hospitalId, {
        search: search || undefined,
        registrationType: typeFilter === 'all' ? undefined : typeFilter,
        page,
        limit,
        sortBy: 'created_at',
        sortOrder: 'desc',
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
      setSelectedId(highlightId);
      dispatch(loadPatientContext(highlightId));
    }
  }, [highlightId, dispatch]);

  const handlePatientClick = (patient: Patient) => {
    setSelectedId(patient.id);
    setSearchParams({ id: patient.id });
    dispatch(loadPatientContext(patient.id));
  };

  const clearSelection = () => {
    setSelectedId(null);
    setSearchParams({});
  };

  const startNum = (page - 1) * limit + 1;
  const endNum = Math.min(page * limit, total);

  const maleCount = patients.filter((p) => p.gender === 'male').length;
  const femaleCount = patients.filter((p) => p.gender === 'female').length;
  const emergencyCount = patients.filter((p) => p.registration_type === 'emergency').length;

  return (
    <TooltipProvider>
      <div className="space-y-6 animate-fadeIn">
        <Breadcrumbs className="mb-2" />
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-sm">
              <Users className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-xl lg:text-2xl font-bold text-gray-900 tracking-tight">Patient Records</h1>
              <p className="text-sm text-gray-500">Manage and access all patient information</p>
            </div>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowCustomFields(true)}
                  className="gap-1.5 border-gray-200 hover:bg-gray-50"
                >
                  <Settings2 className="w-4 h-4" />
                  Custom Fields
                </Button>
              </TooltipTrigger>
              <TooltipContent>Configure custom patient fields</TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => exportToCSV(patients, `patients_${typeFilter}`)}
                  disabled={patients.length === 0}
                  className="gap-1.5 border-gray-200 hover:bg-gray-50"
                >
                  <Download className="w-4 h-4" />
                  Export
                </Button>
              </TooltipTrigger>
              <TooltipContent>Export current list to CSV</TooltipContent>
            </Tooltip>
            <Button
              size="sm"
              className="gap-1.5 bg-blue-600 hover:bg-blue-700 shadow-sm"
              onClick={() => navigate('/opd?tab=register')}
            >
              <UserPlus className="w-4 h-4" />
              Register New
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <StatCard label="Total Patients" value={total} icon={Users} iconBg="bg-blue-50" iconColor="text-blue-600" sub="All registered" />
          <StatCard label="Male Patients" value={maleCount} icon={User} iconBg="bg-sky-50" iconColor="text-sky-600" sub="Current page" />
          <StatCard label="Female Patients" value={femaleCount} icon={Heart} iconBg="bg-rose-50" iconColor="text-rose-500" sub="Current page" />
          <StatCard label="Emergency Cases" value={emergencyCount} icon={Activity} iconBg="bg-red-50" iconColor="text-red-500" sub="Current page" />
        </div>

        <Card>
          <div className="flex flex-col sm:flex-row sm:items-center gap-3 px-4 py-3">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
              <Input
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                placeholder="Search by UHID, name, or mobile..."
                className="h-9 pl-10 text-sm border-gray-200"
              />
            </div>
            <div className="flex items-center gap-2">
              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger className="h-9 w-[130px] text-xs gap-1.5">
                  <Filter className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                  <SelectValue placeholder="All Types" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="walk-in">Walk-in</SelectItem>
                  <SelectItem value="scheduled">Scheduled</SelectItem>
                  <SelectItem value="emergency">Emergency</SelectItem>
                </SelectContent>
              </Select>
              <Button
                variant="outline"
                size="sm"
                onClick={loadPatients}
                disabled={loading}
                className="h-9 w-9 p-0 border-gray-200"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              </Button>
            </div>
          </div>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          <div className={selectedId ? 'lg:col-span-2' : 'lg:col-span-3'}>
            {loading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="bg-white border border-gray-200 rounded-xl p-4">
                    <div className="flex items-center gap-3">
                      <Skeleton className="w-11 h-11 rounded-full shrink-0" />
                      <div className="flex-1 space-y-2">
                        <Skeleton className="h-4 w-32" />
                        <Skeleton className="h-3 w-24" />
                        <Skeleton className="h-3 w-40" />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : patients.length === 0 ? (
              <div className="bg-white border border-gray-200 rounded-xl flex flex-col items-center justify-center py-16 text-gray-400">
                <User className="w-12 h-12 mb-3 opacity-20" />
                <p className="text-sm font-medium text-gray-500">No patients found</p>
                {searchInput && (
                  <p className="text-xs mt-1 text-gray-400">Try a different search term</p>
                )}
                <Button
                  size="sm"
                  variant="outline"
                  className="mt-4 gap-1.5 border-gray-200"
                  onClick={() => navigate('/opd?tab=register')}
                >
                  <UserPlus className="w-4 h-4" /> Register First Patient
                </Button>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {patients.map((p) => (
                    <PatientCard
                      key={p.id}
                      patient={p}
                      isSelected={p.id === selectedId}
                      onSelect={() => handlePatientClick(p)}
                      onViewHistory={() => setHistoryPatientId(p.id)}
                      onPrintSticker={() => setStickerPatient(p)}
                      onConsult={() => startConsultation(p.id)}
                      onAdmit={() => admitPatient(p.id)}
                      onBill={() => goToBilling(p.id)}
                    />
                  ))}
                </div>

                {totalPages > 1 && (
                  <div className="flex items-center justify-between mt-4 px-1">
                    <span className="text-xs text-gray-400">
                      Showing {startNum}-{endNum} of {total.toLocaleString('en-IN')}
                    </span>
                    <div className="flex items-center gap-1">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setPage((prev) => Math.max(1, prev - 1))}
                        disabled={page === 1}
                        className="h-8 w-8 p-0 border-gray-200"
                      >
                        <ChevronLeft className="w-3.5 h-3.5" />
                      </Button>
                      <span className="text-xs text-gray-600 px-3 font-medium">{page} / {totalPages}</span>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setPage((prev) => Math.min(totalPages, prev + 1))}
                        disabled={page === totalPages}
                        className="h-8 w-8 p-0 border-gray-200"
                      >
                        <ChevronRight className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>

          {selectedId && (
            <div className="lg:col-span-1">
              <PatientDetailSidebar
                patientId={selectedId}
                hospitalId={hospitalId}
                onClose={clearSelection}
                onViewHistory={() => setHistoryPatientId(selectedId)}
                onPrintSticker={() => {
                  const p = patients.find((pt) => pt.id === selectedId);
                  if (p) setStickerPatient(p);
                }}
                onConsult={() => startConsultation(selectedId)}
                onAdmit={() => admitPatient(selectedId)}
                onBill={() => goToBilling(selectedId)}
              />
            </div>
          )}
        </div>
      </div>

      {historyPatientId && (
        <PatientHistoryDrawer
          patientId={historyPatientId}
          onClose={() => setHistoryPatientId(null)}
        />
      )}

      {stickerPatient && (
        <PatientStickerPrint
          patient={stickerPatient}
          onClose={() => setStickerPatient(null)}
          stickerSize={stickerSize}
          onSizeChange={setStickerSize}
        />
      )}

      {showCustomFields && (
        <CustomFieldsConfigPanel
          hospitalId={hospitalId}
          onClose={() => setShowCustomFields(false)}
        />
      )}
    </TooltipProvider>
  );
}

function StatCard({ label, value, icon: Icon, iconBg, iconColor, sub }: {
  label: string;
  value: number;
  icon: React.ElementType;
  iconBg: string;
  iconColor: string;
  sub: string;
}) {
  return (
    <Card className="hover:border-gray-300 hover:shadow-sm transition-all">
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-medium text-gray-500">{label}</span>
          <div className={`w-7 h-7 rounded-lg ${iconBg} flex items-center justify-center`}>
            <Icon className={`w-4 h-4 ${iconColor}`} />
          </div>
        </div>
        <p className="text-2xl font-bold text-gray-900">{value.toLocaleString('en-IN')}</p>
        <p className="text-xs text-gray-400 mt-1">{sub}</p>
      </CardContent>
    </Card>
  );
}
