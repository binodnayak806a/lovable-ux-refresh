import { useState, useEffect, useCallback } from 'react';
import {
  Search, RefreshCw, Clock, Stethoscope, Printer,
  FileText, AlertTriangle,
  ChevronDown, ChevronLeft, ClipboardList, X, Download,
  Eye, Mail, User, Phone, Edit, Info, SlidersHorizontal,
  MoreVertical, SkipBack,
} from 'lucide-react';
import { format, formatDistanceToNow } from 'date-fns';
import { toast } from 'sonner';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { Input } from '../../components/ui/input';
import { Skeleton } from '../../components/ui/skeleton';
import { useHospitalId } from '../../hooks/useHospitalId';
import { useAppSelector } from '../../store';
import { useRealtime } from '../../hooks/useRealtime';
import { usePageTitle } from '../../hooks/usePageTitle';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import doctorQueueService, { type QueueAppointment, type PatientInfo, type InvestigationItem, type PrescriptionDrug } from '../../services/doctor-queue.service';
import SymptomsSection from './components/SymptomsSection';
import InvestigationsSection from './components/InvestigationsSection';
import PrescriptionBuilder from './components/PrescriptionBuilder';
import PrescriptionPrint from './components/PrescriptionPrint';
import { cn } from '../../lib/utils';

type QueueFilter = 'walkin' | 'online';
type QueueSubFilter = 'today' | 'all';
type ConsultationTab = 'summary' | 'symptoms' | 'vitals' | 'investigation' | 'diagnosis' | 'rx' | 'advice' | 'followup' | 'referred' | 'template';

interface SelectedSymptom {
  symptom_id: string;
  name: string;
  severity: string;
}

interface SelectedDiagnosis {
  diagnosis_id: string;
  name: string;
  icd10_code: string | null;
  type: string;
}

function getAge(dob: string | null, age: number | null): string {
  if (age) return `${age}Y`;
  if (!dob) return '';
  return `${Math.floor((Date.now() - new Date(dob).getTime()) / (365.25 * 24 * 60 * 60 * 1000))}Y`;
}

function formatTime12(t: string) {
  if (!t) return '';
  const [h, m] = t.split(':');
  const hour = parseInt(h);
  const ampm = hour >= 12 ? 'PM' : 'AM';
  return `${hour % 12 || 12}:${m} ${ampm}`;
}

function getWaitTime(createdAt: string): string {
  try {
    return formatDistanceToNow(new Date(createdAt), { addSuffix: false });
  } catch { return ''; }
}

export default function DoctorQueuePage() {
  usePageTitle('Doctor OPD');
  const hospitalId = useHospitalId();
  const user = useAppSelector(s => s.auth.user);
  const doctorId = user?.id ?? '';

  const [appointments, setAppointments] = useState<QueueAppointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [queueFilter, setQueueFilter] = useState<QueueFilter>('walkin');
  const [queueSubFilter, setQueueSubFilter] = useState<QueueSubFilter>('today');
  const [queueSearch, setQueueSearch] = useState('');
  const [hospitalSettings, setHospitalSettings] = useState<Record<string, string>>({});

  const [selectedAppt, setSelectedAppt] = useState<QueueAppointment | null>(null);
  const [patientInfo, setPatientInfo] = useState<PatientInfo | null>(null);

  const [activeTab, setActiveTab] = useState<ConsultationTab>('summary');
  const [chiefComplaint, setChiefComplaint] = useState('');
  const [selectedSymptoms, setSelectedSymptoms] = useState<SelectedSymptom[]>([]);
  const [vitalsNotes, setVitalsNotes] = useState('');
  const [weight, setWeight] = useState('');
  const [height, setHeight] = useState('');
  const [bp, setBp] = useState('');
  const [pulse, setPulse] = useState('');
  const [temperature, setTemperature] = useState('');
  const [spo2, setSpo2] = useState('');
  const [examinationNotes, setExaminationNotes] = useState('');
  const [diagnosis, setDiagnosis] = useState('');
  const [selectedDiagnoses, setSelectedDiagnoses] = useState<SelectedDiagnosis[]>([]);
  const [investigations, setInvestigations] = useState<InvestigationItem[]>([]);
  const [prescriptionItems, setPrescriptionItems] = useState<PrescriptionDrug[]>([]);
  const [advice, setAdvice] = useState('');
  const [followupDate, setFollowupDate] = useState('');
  const [referredTo, setReferredTo] = useState('');
  const [saving, setSaving] = useState(false);
  const [showPrint, setShowPrint] = useState(false);

  const fetchQueue = useCallback(async (silent = false) => {
    if (!doctorId) return;
    if (!silent) setLoading(true);
    else setRefreshing(true);
    try {
      const data = await doctorQueueService.getTodayQueue(doctorId, hospitalId);
      setAppointments(data);
    } catch { /* */ }
    finally { setLoading(false); setRefreshing(false); }
  }, [doctorId, hospitalId]);

  const fetchSettings = useCallback(async () => {
    try {
      const s = await doctorQueueService.getHospitalSettings(hospitalId);
      setHospitalSettings(s);
    } catch { /* */ }
  }, [hospitalId]);

  useEffect(() => { fetchQueue(); }, [fetchQueue]);
  useEffect(() => { fetchSettings(); }, [fetchSettings]);

  useRealtime(
    { table: 'appointments', filter: `doctor_id=eq.${doctorId}` },
    () => fetchQueue(true)
  );

  useEffect(() => {
    if (!selectedAppt) { setPatientInfo(null); return; }
    doctorQueueService.getPatientInfo(selectedAppt.patient_id).then(info => {
      if (info) setPatientInfo(info);
    });
  }, [selectedAppt?.patient_id]);

  const handleSelectPatient = (appt: QueueAppointment) => {
    setChiefComplaint(appt.chief_complaint ?? '');
    setSelectedSymptoms([]);
    setVitalsNotes('');
    setWeight(''); setHeight(''); setBp(''); setPulse(''); setTemperature(''); setSpo2('');
    setExaminationNotes('');
    setDiagnosis('');
    setSelectedDiagnoses([]);
    setInvestigations([]);
    setPrescriptionItems([]);
    setAdvice('');
    setFollowupDate('');
    setReferredTo('');
    setActiveTab('summary');
    setSelectedAppt(appt);

    if (appt.status === 'scheduled' || appt.status === 'confirmed') {
      doctorQueueService.updateAppointmentStatus(appt.id, 'in_progress');
      setAppointments(prev => prev.map(a => a.id === appt.id ? { ...a, status: 'in_progress' } : a));
    }
  };

  const handleSave = async () => {
    if (!selectedAppt) return;
    setSaving(true);
    try {
      await doctorQueueService.saveConsultation({
        appointment_id: selectedAppt.id,
        patient_id: selectedAppt.patient_id,
        doctor_id: doctorId,
        hospital_id: hospitalId,
        chief_complaint: chiefComplaint,
        examination_notes: examinationNotes,
        diagnosis,
        advice,
        followup_date: followupDate || null,
        symptoms: selectedSymptoms,
        diagnoses: selectedDiagnoses,
        investigations,
        prescriptionItems,
      });
      toast.success('Consultation saved & completed');
      fetchQueue(true);
    } catch {
      toast.error('Failed to save consultation');
    } finally {
      setSaving(false);
    }
  };

  const handleSaveAndPrint = async () => {
    await handleSave();
    if (prescriptionItems.length > 0) setShowPrint(true);
  };

  const todayAppts = appointments;

  const filteredQueue = appointments.filter(a => {
    if (queueSearch) {
      const term = queueSearch.toLowerCase();
      if (!a.patient_name.toLowerCase().includes(term) && !a.patient_uhid.toLowerCase().includes(term)) return false;
    }
    return true;
  });

  const ageStr = selectedAppt ? getAge(selectedAppt.patient_dob, selectedAppt.patient_age) : '';
  const genderStr = selectedAppt?.patient_gender
    ? selectedAppt.patient_gender.charAt(0).toUpperCase() === 'M' ? 'Male' : selectedAppt.patient_gender.charAt(0).toUpperCase() === 'F' ? 'Female' : selectedAppt.patient_gender
    : '';

  if (showPrint && selectedAppt) {
    return (
      <PrescriptionPrint
        patientName={selectedAppt.patient_name}
        patientUhid={selectedAppt.patient_uhid}
        patientAge={ageStr}
        patientGender={genderStr}
        doctorName={user?.full_name ?? 'Doctor'}
        hospitalName={hospitalSettings['hospital_name'] ?? 'Hospital'}
        hospitalAddress={hospitalSettings['hospital_address'] ?? ''}
        hospitalPhone={hospitalSettings['hospital_phone'] ?? ''}
        diagnosis={diagnosis}
        prescriptionItems={prescriptionItems}
        advice={advice}
        followupDate={followupDate}
        onClose={() => setShowPrint(false)}
      />
    );
  }

  const TABS: Array<{ id: ConsultationTab; label: string }> = [
    { id: 'summary', label: 'Summary' },
    { id: 'symptoms', label: 'Symptoms / History' },
    { id: 'vitals', label: 'Vitals / Observation' },
    { id: 'investigation', label: 'Investigation' },
    { id: 'diagnosis', label: 'Diagnosis' },
    { id: 'rx', label: 'Rx' },
    { id: 'advice', label: 'Advice' },
    { id: 'followup', label: 'Follow Up' },
    { id: 'referred', label: 'Referred To' },
    { id: 'template', label: 'Template' },
  ];

  return (
    <div className="flex h-[calc(100vh-64px)] overflow-hidden bg-background">
      {/* ═══ LEFT SIDEBAR: Patient Queue ═══ */}
      <div className="w-[280px] border-r border-border bg-card flex flex-col shrink-0">
        {/* Walk-In / Online toggle */}
        <div className="flex border-b border-border">
          <button
            onClick={() => setQueueFilter('walkin')}
            className={cn(
              'flex-1 py-2 text-xs font-bold text-center border-b-2 transition-all flex items-center justify-center gap-1.5',
              queueFilter === 'walkin'
                ? 'border-primary text-primary bg-primary/5'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            )}
          >
            Walk-In
            <RefreshCw
              className={cn('w-3 h-3 cursor-pointer', refreshing && 'animate-spin')}
              onClick={(e) => { e.stopPropagation(); fetchQueue(true); }}
            />
          </button>
          <button
            onClick={() => setQueueFilter('online')}
            className={cn(
              'flex-1 py-2 text-xs font-bold text-center border-b-2 transition-all',
              queueFilter === 'online'
                ? 'border-primary text-primary bg-primary/5'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            )}
          >
            Online
          </button>
        </div>

        {/* Doctor selector */}
        <div className="px-3 pt-2 pb-1 border-b border-border">
          <div className="text-[10px] text-muted-foreground mb-1">Doctor</div>
          <Select defaultValue={doctorId}>
            <SelectTrigger className="h-7 text-xs">
              <SelectValue placeholder={user?.full_name ?? 'Select Doctor'} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={doctorId}>{user?.full_name ?? 'Doctor'}</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Today / All filter */}
        <div className="flex border-b border-border">
          <button
            onClick={() => setQueueSubFilter('today')}
            className={cn(
              'flex-1 py-2 text-xs font-semibold text-center transition-all',
              queueSubFilter === 'today'
                ? 'bg-primary/10 text-primary border-b-2 border-primary'
                : 'text-muted-foreground hover:bg-muted/50'
            )}
          >
            Today ({todayAppts.length})
          </button>
          <button
            onClick={() => setQueueSubFilter('all')}
            className={cn(
              'flex-1 py-2 text-xs font-semibold text-center transition-all',
              queueSubFilter === 'all'
                ? 'bg-primary/10 text-primary border-b-2 border-primary'
                : 'text-muted-foreground hover:bg-muted/50'
            )}
          >
            All
          </button>
        </div>

        {/* Search with filter icon */}
        <div className="px-2 pt-2 pb-1 flex items-center gap-1">
          <div className="relative flex-1">
            <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-3 h-3 text-muted-foreground" />
            <Input
              value={queueSearch}
              onChange={e => setQueueSearch(e.target.value)}
              placeholder="Search"
              className="h-7 pl-6 text-[11px] border-primary/30"
            />
          </div>
          <button className="w-7 h-7 rounded border border-border flex items-center justify-center text-muted-foreground hover:bg-muted">
            <SlidersHorizontal className="w-3 h-3" />
          </button>
        </div>

        {/* Section header */}
        <div className="px-3 py-1.5 flex items-center gap-1">
          <ChevronDown className="w-3 h-3 text-muted-foreground" />
          <span className="text-[10px] font-semibold text-muted-foreground">Today's Appointment Status</span>
        </div>

        {/* Patient list */}
        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="p-2 space-y-2">
              {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-20 rounded-lg" />)}
            </div>
          ) : filteredQueue.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
              <Clock className="w-8 h-8 mb-2 opacity-20" />
              <p className="text-xs">No patients in queue</p>
            </div>
          ) : (
            <div className="px-1.5 pb-2">
              {filteredQueue.map(appt => {
                const isSelected = selectedAppt?.id === appt.id;
                const isWaiting = appt.status === 'scheduled' || appt.status === 'confirmed';
                const isEngaged = appt.status === 'in_progress';
                const _isCompleted = appt.status === 'completed';
                const demo = [getAge(appt.patient_dob, appt.patient_age), appt.patient_gender?.charAt(0).toUpperCase()].filter(Boolean).join(' ');
                const wt = getWaitTime(appt.created_at);

                return (
                  <button
                    key={appt.id}
                    onClick={() => handleSelectPatient(appt)}
                    className={cn(
                      'w-full text-left px-2.5 py-2 rounded transition-all border-l-[3px]',
                      isSelected
                        ? 'bg-primary/10 border-l-primary'
                        : isEngaged
                          ? 'bg-accent/50 border-l-accent'
                          : 'border-l-transparent hover:bg-muted/40',
                      appt.emergency && 'border-l-destructive bg-destructive/5'
                    )}
                  >
                    <div className="flex items-start justify-between">
                      <div className="min-w-0 flex-1">
                        <p className="text-[11px] font-bold text-foreground leading-tight truncate">
                          {appt.patient_name.toUpperCase()}
                          {appt.patient_uhid && (
                            <span className="font-normal text-muted-foreground ml-1">({appt.patient_uhid})</span>
                          )}
                        </p>
                        <p className="text-[10px] text-muted-foreground mt-0.5">
                          {isWaiting ? 'New Appointment' : isEngaged ? 'In Consultation' : 'Completed'}
                        </p>
                        {/* Action icons row */}
                        <div className="flex items-center gap-1.5 mt-1">
                          <div className="w-4 h-4 rounded-sm bg-primary/15 flex items-center justify-center">
                            <User className="w-2.5 h-2.5 text-primary" />
                          </div>
                          <div className="w-4 h-4 rounded-sm bg-primary/15 flex items-center justify-center">
                            <Phone className="w-2.5 h-2.5 text-primary" />
                          </div>
                          <div className="w-4 h-4 rounded-sm bg-primary/15 flex items-center justify-center">
                            <Edit className="w-2.5 h-2.5 text-primary" />
                          </div>
                        </div>
                        <p className="text-[10px] text-muted-foreground mt-0.5">
                          Apt No. | {appt.patient_uhid}
                        </p>
                        {(demo || wt) && (
                          <p className="text-[10px] text-muted-foreground">
                            WS: {demo}{wt && ` ${wt}`}
                          </p>
                        )}
                      </div>
                      <div className="text-right shrink-0 ml-2">
                        <p className="text-[10px] font-medium text-muted-foreground">{formatTime12(appt.appointment_time)}</p>
                        {appt.emergency && <AlertTriangle className="w-3 h-3 text-destructive mt-1 ml-auto" />}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* ═══ MAIN: Consultation Area ═══ */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {selectedAppt ? (
          <>
            {/* ── Patient Header Bar (navy-style) ── */}
            <div className="bg-[hsl(var(--primary))] text-primary-foreground px-3 py-2 shrink-0">
              <div className="flex items-center gap-3">
                {/* Back button */}
                <button
                  onClick={() => setSelectedAppt(null)}
                  className="w-7 h-7 rounded-full bg-primary-foreground/10 hover:bg-primary-foreground/20 flex items-center justify-center transition-all shrink-0"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>

                {/* Avatar */}
                <div className="w-9 h-9 rounded-full bg-accent flex items-center justify-center text-accent-foreground font-bold text-sm shrink-0">
                  {selectedAppt.patient_name.charAt(0).toUpperCase()}
                </div>

                {/* Patient Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-[10px] font-mono opacity-80">({selectedAppt.patient_uhid})</span>
                    <Edit className="w-3 h-3 opacity-60 cursor-pointer hover:opacity-100" />
                    <Info className="w-3 h-3 opacity-60 cursor-pointer hover:opacity-100" />
                  </div>
                  <h2 className="text-sm font-bold truncate leading-tight">{selectedAppt.patient_name.toUpperCase()}</h2>
                  <div className="flex items-center gap-2 text-[10px] opacity-80 mt-0.5">
                    <span>{genderStr}</span>
                    {ageStr && <><span>,</span><span>({ageStr})</span></>}
                    {patientInfo?.phone && <><span>,</span><span>{patientInfo.phone}</span></>}
                  </div>
                </div>

                {/* Search patient */}
                <div className="relative hidden lg:block">
                  <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 opacity-60" />
                  <input
                    placeholder="Search Patient (Enter a...)"
                    className="h-8 pl-8 pr-3 w-52 rounded-lg bg-primary-foreground/10 border border-primary-foreground/20 text-primary-foreground text-xs placeholder:text-primary-foreground/50 focus:outline-none focus:bg-primary-foreground/15"
                  />
                </div>

                {/* Action buttons - Row 1 */}
                <div className="flex flex-col gap-1 shrink-0">
                  <div className="flex items-center gap-1">
                    <ActionBtn label="ADMIT" />
                    <ActionBtn label="+ APPT" />
                    <ActionBtn label="+ PATIENT" />
                    <button className="p-1 rounded hover:bg-primary-foreground/10">
                      <MoreVertical className="w-4 h-4" />
                    </button>
                  </div>
                  <div className="flex items-center gap-1">
                    <ActionBtn label="BILL" variant="accent" />
                    <ActionBtn label="ALLERGY" variant="accent" />
                    <ActionBtn label="PATIENT REPORT" />
                    <ActionBtn label="GRAPH" />
                  </div>
                </div>
              </div>
            </div>

            {/* ── Scrollable Visit Area ── */}
            <div className="flex-1 overflow-y-auto bg-background">
              {/* Current Visit */}
              <div className="border-b border-border">
                {/* Visit header */}
                <div className="px-4 py-2 flex items-center gap-2 bg-card border-b border-border">
                  <span className="text-xs font-bold text-destructive">Walk-In</span>
                  <span className="text-[10px] text-muted-foreground">/</span>
                  <span className={cn(
                    'text-xs font-bold',
                    selectedAppt.status === 'completed' ? 'text-emerald-600' :
                    selectedAppt.status === 'in_progress' ? 'text-amber-600' : 'text-destructive'
                  )}>
                    {selectedAppt.status === 'completed' ? 'Completed' :
                     selectedAppt.status === 'in_progress' ? 'In Progress' : 'Waiting'}
                  </span>
                  <span className="text-[10px] text-muted-foreground">
                    {format(new Date(), 'dd/MM/yyyy')} {formatTime12(selectedAppt.appointment_time)}
                  </span>
                  <Info className="w-3 h-3 text-muted-foreground cursor-pointer" />
                  <span className="text-[10px] text-primary font-medium cursor-pointer hover:underline">New Appointment</span>

                  {/* Visit action icons */}
                  <div className="ml-auto flex items-center gap-1.5">
                    <Mail className="w-3.5 h-3.5 text-muted-foreground cursor-pointer hover:text-foreground" />
                    <Printer className="w-3.5 h-3.5 text-muted-foreground cursor-pointer hover:text-foreground" />
                    <User className="w-3.5 h-3.5 text-muted-foreground cursor-pointer hover:text-foreground" />
                    <div className="w-px h-4 bg-border mx-1" />
                    <X className="w-4 h-4 text-destructive/60 cursor-pointer hover:text-destructive" />
                    <SkipBack className="w-4 h-4 text-muted-foreground cursor-pointer hover:text-foreground" />
                    <MoreVertical className="w-4 h-4 text-muted-foreground cursor-pointer hover:text-foreground" />
                  </div>
                </div>

                {/* Consultation Tabs */}
                <div className="px-1 bg-card">
                  <div className="flex items-center overflow-x-auto">
                    {TABS.map(tab => (
                      <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={cn(
                          'px-2.5 py-2 text-[11px] font-semibold whitespace-nowrap transition-all',
                          activeTab === tab.id
                            ? 'bg-primary text-primary-foreground rounded-sm'
                            : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
                        )}
                      >
                        {tab.label}
                      </button>
                    ))}
                    <button
                      onClick={handleSave}
                      disabled={saving}
                      className="px-2.5 py-2 text-[11px] font-bold text-primary whitespace-nowrap hover:bg-primary/5 transition-all ml-auto"
                    >
                      {saving ? 'Saving...' : 'Save'}
                    </button>
                  </div>
                </div>

                {/* Save & Print link */}
                <div className="px-4 py-1.5 bg-card border-b border-border">
                  <button
                    onClick={handleSaveAndPrint}
                    disabled={saving}
                    className="text-[11px] font-bold text-primary hover:underline"
                  >
                    Save & Print
                  </button>
                </div>

                {/* Vitals strip */}
                {(weight || height) && (
                  <div className="px-4 py-1.5 bg-amber-50 dark:bg-amber-950/30 border-b border-amber-200 dark:border-amber-800">
                    <span className="text-[11px] font-bold text-amber-800 dark:text-amber-200">
                      Vitals: &nbsp;
                      <span className="bg-amber-200 dark:bg-amber-800 px-1.5 py-0.5 rounded text-amber-900 dark:text-amber-100">
                        W: {weight || '--'} kg | H: {height || '--'} cm
                        {bp && ` | BP: ${bp}`}{pulse && ` | P: ${pulse}`}{temperature && ` | T: ${temperature}°F`}{spo2 && ` | SpO₂: ${spo2}%`}
                      </span>
                    </span>
                  </div>
                )}

                {/* Tab Content */}
                <div className="p-4 min-h-[250px] bg-background">
                  {activeTab === 'summary' && (
                    <SummaryView
                      chiefComplaint={chiefComplaint}
                      symptoms={selectedSymptoms}
                      diagnosis={diagnosis}
                      diagnoses={selectedDiagnoses}
                      investigations={investigations}
                      prescriptionItems={prescriptionItems}
                      advice={advice}
                      followupDate={followupDate}
                      weight={weight} height={height} bp={bp} pulse={pulse} temperature={temperature} spo2={spo2}
                    />
                  )}
                  {activeTab === 'symptoms' && (
                    <SymptomsSection
                      chiefComplaint={chiefComplaint}
                      onChiefComplaintChange={setChiefComplaint}
                      selectedSymptoms={selectedSymptoms}
                      onSymptomsChange={setSelectedSymptoms}
                    />
                  )}
                  {activeTab === 'vitals' && (
                    <VitalsEditor
                      weight={weight} onWeightChange={setWeight}
                      height={height} onHeightChange={setHeight}
                      bp={bp} onBpChange={setBp}
                      pulse={pulse} onPulseChange={setPulse}
                      temperature={temperature} onTemperatureChange={setTemperature}
                      spo2={spo2} onSpo2Change={setSpo2}
                      notes={vitalsNotes} onNotesChange={setVitalsNotes}
                      examinationNotes={examinationNotes} onExaminationNotesChange={setExaminationNotes}
                    />
                  )}
                  {activeTab === 'investigation' && (
                    <InvestigationsSection investigations={investigations} onInvestigationsChange={setInvestigations} />
                  )}
                  {activeTab === 'diagnosis' && (
                    <DiagnosisEditor
                      diagnosis={diagnosis} onDiagnosisChange={setDiagnosis}
                      selectedDiagnoses={selectedDiagnoses} onDiagnosesChange={setSelectedDiagnoses}
                    />
                  )}
                  {activeTab === 'rx' && (
                    <PrescriptionBuilder items={prescriptionItems} onItemsChange={setPrescriptionItems} />
                  )}
                  {activeTab === 'advice' && (
                    <div>
                      <label className="text-sm font-medium text-foreground mb-1.5 block">Advice / Instructions</label>
                      <textarea
                        value={advice}
                        onChange={e => setAdvice(e.target.value)}
                        placeholder="General advice, precautions, dietary instructions..."
                        rows={8}
                        className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary resize-none"
                      />
                    </div>
                  )}
                  {activeTab === 'followup' && (
                    <div className="space-y-4">
                      <div>
                        <label className="text-sm font-medium text-foreground mb-1.5 block">Follow-up Date</label>
                        <input
                          type="date"
                          value={followupDate}
                          onChange={e => setFollowupDate(e.target.value)}
                          min={new Date().toISOString().split('T')[0]}
                          className="w-full max-w-xs rounded-lg border border-border bg-background px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
                        />
                      </div>
                      <div className="flex gap-2 flex-wrap">
                        {[3, 5, 7, 14, 30].map(d => {
                          const date = new Date();
                          date.setDate(date.getDate() + d);
                          return (
                            <Button key={d} variant="outline" size="sm" onClick={() => setFollowupDate(date.toISOString().split('T')[0])} className="text-xs">
                              {d} days
                            </Button>
                          );
                        })}
                      </div>
                    </div>
                  )}
                  {activeTab === 'referred' && (
                    <div>
                      <label className="text-sm font-medium text-foreground mb-1.5 block">Referred To</label>
                      <textarea
                        value={referredTo}
                        onChange={e => setReferredTo(e.target.value)}
                        placeholder="Referred to specialist / department / hospital..."
                        rows={4}
                        className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary resize-none"
                      />
                    </div>
                  )}
                  {activeTab === 'template' && (
                    <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                      <ClipboardList className="w-10 h-10 mb-3 opacity-20" />
                      <p className="text-sm">Consultation templates coming soon</p>
                      <p className="text-xs mt-1">Save and reuse common consultation patterns</p>
                    </div>
                  )}
                </div>

                {/* Second tabs row (for same visit) */}
                <div className="px-1 bg-card border-t border-border">
                  <div className="flex items-center overflow-x-auto">
                    {TABS.map(tab => (
                      <button
                        key={`bottom-${tab.id}`}
                        onClick={() => setActiveTab(tab.id)}
                        className={cn(
                          'px-2.5 py-2 text-[11px] font-semibold whitespace-nowrap transition-all',
                          activeTab === tab.id
                            ? 'bg-primary text-primary-foreground rounded-sm'
                            : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
                        )}
                      >
                        {tab.label}
                      </button>
                    ))}
                    <button
                      onClick={handleSave}
                      disabled={saving}
                      className="px-2.5 py-2 text-[11px] font-bold text-primary whitespace-nowrap hover:bg-primary/5 transition-all ml-auto"
                    >
                      {saving ? 'Saving...' : 'Save'}
                    </button>
                  </div>
                </div>
                <div className="px-4 py-1.5 bg-card">
                  <button onClick={handleSaveAndPrint} disabled={saving} className="text-[11px] font-bold text-primary hover:underline">
                    Save & Print
                  </button>
                </div>
              </div>

              {/* ── Previous Visit Section ── */}
              <div className="border-b border-border">
                <div className="px-4 py-2 flex items-center gap-2 bg-card border-b border-border">
                  <span className="text-xs font-bold text-destructive">Walk-In</span>
                  <span className="text-[10px] text-muted-foreground">/</span>
                  <span className="text-xs font-bold text-emerald-600">Completed</span>
                  <span className="text-[10px] text-muted-foreground">
                    {patientInfo?.last_visit_date
                      ? `${format(new Date(patientInfo.last_visit_date), 'EEEE dd/MM/yyyy hh:mm a')}`
                      : 'Previous Visit'}
                  </span>
                  <span className="text-[10px] text-muted-foreground">(New Appointment)</span>
                  <Info className="w-3 h-3 text-muted-foreground" />
                  <span className="text-[10px] text-primary font-medium cursor-pointer hover:underline">Upload Document</span>

                  <div className="ml-auto flex items-center gap-2">
                    <FileText className="w-3.5 h-3.5 text-primary cursor-pointer" />
                    <span className="text-xs font-semibold text-primary cursor-pointer hover:underline"
                      onClick={() => prescriptionItems.length > 0 && setShowPrint(true)}
                    >
                      Print
                    </span>
                    <MoreVertical className="w-4 h-4 text-muted-foreground cursor-pointer" />
                  </div>
                </div>
                <div className="flex flex-col items-center justify-center py-10 text-muted-foreground">
                  <ClipboardList className="w-10 h-10 mb-2 opacity-15" />
                  <p className="text-xs italic">Sorry, there is no chart summary available at this moment.</p>
                </div>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground">
            <div className="w-20 h-20 rounded-2xl bg-muted flex items-center justify-center mb-4">
              <Stethoscope className="w-10 h-10 text-muted-foreground/30" />
            </div>
            <p className="text-base font-medium">Select a patient from the queue</p>
            <p className="text-sm mt-1 text-muted-foreground/70">Click on a patient name to begin consultation</p>
          </div>
        )}
      </div>

      {/* ═══ RIGHT: Quick Action Sidebar ═══ */}
      {selectedAppt && (
        <div className="w-12 border-l border-border bg-primary flex flex-col items-center py-3 gap-2 shrink-0">
          <QABtn icon={FileText} label="Prescription" onClick={() => setActiveTab('rx')} />
          <QABtn icon={Eye} label="View" />
          <QABtn icon={ClipboardList} label="Report" />
          <QABtn icon={Printer} label="Print" onClick={() => prescriptionItems.length > 0 && setShowPrint(true)} />
          <QABtn icon={Download} label="Download" />
        </div>
      )}
    </div>
  );
}

/* ── Sub-components ── */

function ActionBtn({ label, variant }: { label: string; variant?: 'accent' }) {
  return (
    <button className={cn(
      'px-2 py-1 rounded text-[9px] font-bold uppercase tracking-wide transition-all',
      variant === 'accent'
        ? 'bg-primary-foreground/20 text-primary-foreground hover:bg-primary-foreground/30 border border-primary-foreground/30'
        : 'bg-primary-foreground/10 text-primary-foreground hover:bg-primary-foreground/20'
    )}>
      {label}
    </button>
  );
}

function QABtn({ icon: Icon, label, onClick }: { icon: React.ElementType; label: string; onClick?: () => void }) {
  return (
    <button
      onClick={onClick}
      className="w-9 h-9 rounded-lg bg-primary-foreground/15 hover:bg-primary-foreground/25 flex items-center justify-center transition-all text-primary-foreground"
      title={label}
    >
      <Icon className="w-4 h-4" />
    </button>
  );
}

function SummaryView({
  chiefComplaint, symptoms, diagnosis, diagnoses, investigations, prescriptionItems,
  advice, followupDate, weight, height, bp, pulse, temperature, spo2,
}: {
  chiefComplaint: string;
  symptoms: SelectedSymptom[];
  diagnosis: string;
  diagnoses: SelectedDiagnosis[];
  investigations: InvestigationItem[];
  prescriptionItems: PrescriptionDrug[];
  advice: string;
  followupDate: string;
  weight: string; height: string; bp: string; pulse: string; temperature: string; spo2: string;
}) {
  const hasAny = chiefComplaint || symptoms.length > 0 || diagnosis || diagnoses.length > 0 ||
    investigations.length > 0 || prescriptionItems.length > 0 || advice || weight || height;

  if (!hasAny) {
    return (
      <div className="space-y-3">
        <h3 className="text-sm font-medium text-foreground">Vitals / observation</h3>
        <div className="flex items-center gap-4 text-sm text-muted-foreground">
          <div className="flex items-center gap-1">
            <div className="w-1 h-5 bg-primary rounded-full" />
            <span className="font-bold text-foreground text-xs">VITALS:</span>
          </div>
          <div className="grid grid-cols-2 gap-x-6 text-xs">
            <span className="font-semibold text-muted-foreground">W</span>
            <span className="font-semibold text-muted-foreground">H</span>
            <span className="text-foreground">-- kg</span>
            <span className="text-foreground">-- cm</span>
          </div>
        </div>
        <p className="text-xs text-muted-foreground mt-4 italic">Enter vitals and other consultation data using the tabs above.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4 text-sm">
      <h3 className="text-sm font-medium text-foreground">Vitals / observation</h3>
      {(weight || height) && (
        <div className="flex items-start gap-4">
          <div className="flex items-center gap-1">
            <div className="w-1 h-5 bg-primary rounded-full" />
            <span className="font-bold text-foreground text-xs">VITALS:</span>
          </div>
          <div className="grid grid-cols-6 gap-x-4 gap-y-1 text-xs">
            {weight && <><span className="font-semibold text-muted-foreground">W</span></>}
            {height && <><span className="font-semibold text-muted-foreground">H</span></>}
            {bp && <span className="font-semibold text-muted-foreground">BP</span>}
            {pulse && <span className="font-semibold text-muted-foreground">P</span>}
            {temperature && <span className="font-semibold text-muted-foreground">T</span>}
            {spo2 && <span className="font-semibold text-muted-foreground">SpO₂</span>}
            {weight && <span className="text-foreground">{weight} kg</span>}
            {height && <span className="text-foreground">{height} cm</span>}
            {bp && <span className="text-foreground">{bp}</span>}
            {pulse && <span className="text-foreground">{pulse}</span>}
            {temperature && <span className="text-foreground">{temperature}°F</span>}
            {spo2 && <span className="text-foreground">{spo2}%</span>}
          </div>
        </div>
      )}
      {chiefComplaint && (
        <div>
          <h4 className="font-bold text-xs text-muted-foreground uppercase tracking-wide mb-1">Chief Complaint</h4>
          <p className="text-foreground">{chiefComplaint}</p>
        </div>
      )}
      {symptoms.length > 0 && (
        <div>
          <h4 className="font-bold text-xs text-muted-foreground uppercase tracking-wide mb-1">Symptoms</h4>
          <div className="flex flex-wrap gap-1.5">
            {symptoms.map(s => (
              <Badge key={s.symptom_id} variant="outline" className="text-xs">{s.name} ({s.severity})</Badge>
            ))}
          </div>
        </div>
      )}
      {(diagnosis || diagnoses.length > 0) && (
        <div>
          <h4 className="font-bold text-xs text-muted-foreground uppercase tracking-wide mb-1">Diagnosis</h4>
          {diagnosis && <p className="text-foreground">{diagnosis}</p>}
          {diagnoses.map(d => (
            <Badge key={d.diagnosis_id} variant="outline" className="text-xs mr-1">{d.name} {d.icd10_code && `(${d.icd10_code})`}</Badge>
          ))}
        </div>
      )}
      {prescriptionItems.length > 0 && (
        <div>
          <h4 className="font-bold text-xs text-muted-foreground uppercase tracking-wide mb-1">Prescription ({prescriptionItems.length})</h4>
          {prescriptionItems.map((item, idx) => (
            <div key={item.id} className="text-xs flex gap-2">
              <span className="text-muted-foreground w-4">{idx + 1}.</span>
              <span className="font-medium">{item.medicine_name}</span>
              <span className="text-muted-foreground">{item.dose} | {item.frequency} | {item.duration}d</span>
            </div>
          ))}
        </div>
      )}
      {advice && (
        <div>
          <h4 className="font-bold text-xs text-muted-foreground uppercase tracking-wide mb-1">Advice</h4>
          <p className="text-foreground whitespace-pre-wrap">{advice}</p>
        </div>
      )}
      {followupDate && (
        <div>
          <h4 className="font-bold text-xs text-muted-foreground uppercase tracking-wide mb-1">Follow Up</h4>
          <p className="text-foreground">{format(new Date(followupDate), 'dd MMM yyyy')}</p>
        </div>
      )}
    </div>
  );
}

function VitalsEditor({
  weight, onWeightChange, height, onHeightChange,
  bp, onBpChange, pulse, onPulseChange,
  temperature, onTemperatureChange, spo2, onSpo2Change,
  notes, onNotesChange, examinationNotes, onExaminationNotesChange,
}: {
  weight: string; onWeightChange: (v: string) => void;
  height: string; onHeightChange: (v: string) => void;
  bp: string; onBpChange: (v: string) => void;
  pulse: string; onPulseChange: (v: string) => void;
  temperature: string; onTemperatureChange: (v: string) => void;
  spo2: string; onSpo2Change: (v: string) => void;
  notes: string; onNotesChange: (v: string) => void;
  examinationNotes: string; onExaminationNotesChange: (v: string) => void;
}) {
  const cls = "w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary";
  return (
    <div className="space-y-5">
      <div>
        <h3 className="text-sm font-semibold text-foreground mb-3">Vitals</h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          <div>
            <label className="text-[10px] font-bold text-muted-foreground uppercase mb-1 block">Weight (kg)</label>
            <input value={weight} onChange={e => onWeightChange(e.target.value)} placeholder="60" className={cls} />
          </div>
          <div>
            <label className="text-[10px] font-bold text-muted-foreground uppercase mb-1 block">Height (cm)</label>
            <input value={height} onChange={e => onHeightChange(e.target.value)} placeholder="152" className={cls} />
          </div>
          <div>
            <label className="text-[10px] font-bold text-muted-foreground uppercase mb-1 block">BP (mmHg)</label>
            <input value={bp} onChange={e => onBpChange(e.target.value)} placeholder="120/80" className={cls} />
          </div>
          <div>
            <label className="text-[10px] font-bold text-muted-foreground uppercase mb-1 block">Pulse (bpm)</label>
            <input value={pulse} onChange={e => onPulseChange(e.target.value)} placeholder="72" className={cls} />
          </div>
          <div>
            <label className="text-[10px] font-bold text-muted-foreground uppercase mb-1 block">Temp (°F)</label>
            <input value={temperature} onChange={e => onTemperatureChange(e.target.value)} placeholder="98.6" className={cls} />
          </div>
          <div>
            <label className="text-[10px] font-bold text-muted-foreground uppercase mb-1 block">SpO₂ (%)</label>
            <input value={spo2} onChange={e => onSpo2Change(e.target.value)} placeholder="98" className={cls} />
          </div>
        </div>
      </div>
      <div>
        <h3 className="text-sm font-semibold text-foreground mb-2">Vitals / Observation Notes</h3>
        <textarea value={notes} onChange={e => onNotesChange(e.target.value)} placeholder="Additional vitals observations..." rows={4}
          className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary resize-none" />
      </div>
      <div>
        <h3 className="text-sm font-semibold text-foreground mb-2">Physical Examination</h3>
        <textarea value={examinationNotes} onChange={e => onExaminationNotesChange(e.target.value)} placeholder="Physical examination findings..." rows={6}
          className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary resize-none" />
      </div>
    </div>
  );
}

function DiagnosisEditor({
  diagnosis, onDiagnosisChange, selectedDiagnoses, onDiagnosesChange,
}: {
  diagnosis: string; onDiagnosisChange: (v: string) => void;
  selectedDiagnoses: SelectedDiagnosis[]; onDiagnosesChange: (v: SelectedDiagnosis[]) => void;
}) {
  const [searchTerm, setSearchTerm] = useState('');
  const [results, setResults] = useState<Array<{ id: string; name: string; icd10_code: string | null; category: string }>>([]);
  const [searching, setSearching] = useState(false);

  useEffect(() => {
    if (searchTerm.length < 2) { setResults([]); return; }
    const timer = setTimeout(async () => {
      setSearching(true);
      const data = await doctorQueueService.searchDiagnoses(searchTerm);
      setResults(data);
      setSearching(false);
    }, 250);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  const addDiagnosis = (d: { id: string; name: string; icd10_code: string | null }) => {
    if (selectedDiagnoses.some(s => s.diagnosis_id === d.id)) return;
    onDiagnosesChange([...selectedDiagnoses, {
      diagnosis_id: d.id, name: d.name, icd10_code: d.icd10_code,
      type: selectedDiagnoses.length === 0 ? 'primary' : 'secondary',
    }]);
    setSearchTerm(''); setResults([]);
  };

  return (
    <div className="space-y-4">
      <div>
        <label className="text-sm font-medium text-foreground mb-1.5 block">Diagnosis (free text)</label>
        <textarea value={diagnosis} onChange={e => onDiagnosisChange(e.target.value)} placeholder="Enter diagnosis..." rows={3}
          className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary resize-none" />
      </div>
      <div>
        <label className="text-sm font-medium text-foreground mb-1.5 block">ICD-10 Search (optional)</label>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input value={searchTerm} onChange={e => setSearchTerm(e.target.value)} placeholder="Search by diagnosis name or ICD-10 code..."
            className="w-full rounded-lg border border-border bg-background pl-9 pr-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary" />
        </div>
        {searching && <p className="text-xs text-muted-foreground mt-1">Searching...</p>}
        {results.length > 0 && (
          <div className="mt-1 bg-card border border-border rounded-lg shadow-lg max-h-48 overflow-y-auto">
            {results.map(r => (
              <button key={r.id} onClick={() => addDiagnosis(r)} className="w-full text-left px-3 py-2 hover:bg-muted text-sm flex items-center justify-between">
                <span>{r.name}</span>
                {r.icd10_code && <span className="text-xs text-muted-foreground font-mono">{r.icd10_code}</span>}
              </button>
            ))}
          </div>
        )}
      </div>
      {selectedDiagnoses.length > 0 && (
        <div className="space-y-1.5">
          {selectedDiagnoses.map((d, idx) => (
            <div key={d.diagnosis_id} className="flex items-center gap-2 bg-muted rounded-lg px-3 py-2">
              <Badge variant="outline" className="text-[10px] h-5">{idx === 0 ? 'Primary' : 'Secondary'}</Badge>
              <span className="text-sm text-foreground flex-1">{d.name}</span>
              {d.icd10_code && <span className="text-xs text-muted-foreground font-mono">{d.icd10_code}</span>}
              <button onClick={() => onDiagnosesChange(selectedDiagnoses.filter(x => x.diagnosis_id !== d.diagnosis_id))} className="text-muted-foreground hover:text-destructive">
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
