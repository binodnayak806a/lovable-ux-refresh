import { useState, useEffect, useCallback } from 'react';
import {
  Search, RefreshCw, Clock, Stethoscope, Printer, Save,
  UserPlus, CalendarPlus, FileText, AlertTriangle, Loader2,
  ChevronDown, Activity, FlaskConical, Pill, CalendarCheck,
  MessageSquare, ClipboardList, ArrowRightLeft, X, Download,
  Eye, Bed, Receipt,
} from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { Input } from '../../components/ui/input';
import { Skeleton } from '../../components/ui/skeleton';
import { useHospitalId } from '../../hooks/useHospitalId';
import { useAppSelector } from '../../store';
import { useRealtime } from '../../hooks/useRealtime';
import { usePageTitle } from '../../hooks/usePageTitle';
import doctorQueueService, { type QueueAppointment, type PatientInfo, type InvestigationItem, type PrescriptionDrug } from '../../services/doctor-queue.service';
import SymptomsSection from './components/SymptomsSection';
import InvestigationsSection from './components/InvestigationsSection';
import PrescriptionBuilder from './components/PrescriptionBuilder';
import PrescriptionPrint from './components/PrescriptionPrint';
import { cn } from '../../lib/utils';

type QueueFilter = 'today' | 'all';
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

export default function DoctorQueuePage() {
  usePageTitle('Doctor OPD');
  const hospitalId = useHospitalId();
  const user = useAppSelector(s => s.auth.user);
  const doctorId = user?.id ?? '';

  const [appointments, setAppointments] = useState<QueueAppointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [queueFilter, setQueueFilter] = useState<QueueFilter>('today');
  const [queueSearch, setQueueSearch] = useState('');
  const [hospitalSettings, setHospitalSettings] = useState<Record<string, string>>({});

  // Selected patient state
  const [selectedAppt, setSelectedAppt] = useState<QueueAppointment | null>(null);
  const [patientInfo, setPatientInfo] = useState<PatientInfo | null>(null);

  // Consultation state
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

  // Load patient info when selecting
  useEffect(() => {
    if (!selectedAppt) { setPatientInfo(null); return; }
    doctorQueueService.getPatientInfo(selectedAppt.patient_id).then(info => {
      if (info) setPatientInfo(info);
    });
  }, [selectedAppt?.patient_id]);

  const handleSelectPatient = (appt: QueueAppointment) => {
    // Reset consultation state
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

    // Auto-start if waiting
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
    if (prescriptionItems.length > 0) {
      setShowPrint(true);
    }
  };

  // Queue filtering
  const waiting = appointments.filter(a => a.status === 'scheduled' || a.status === 'confirmed');
  const engaged = appointments.filter(a => a.status === 'in_progress');
  const completed = appointments.filter(a => a.status === 'completed');

  const filteredQueue = appointments.filter(a => {
    if (queueSearch) {
      const term = queueSearch.toLowerCase();
      if (!a.patient_name.toLowerCase().includes(term) && !a.patient_uhid.toLowerCase().includes(term)) return false;
    }
    return true;
  });

  const ageStr = selectedAppt ? getAge(selectedAppt.patient_dob, selectedAppt.patient_age) : '';
  const genderStr = selectedAppt?.patient_gender ? selectedAppt.patient_gender.charAt(0).toUpperCase() : '';

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
    <div className="flex h-[calc(100vh-64px)] bg-background overflow-hidden">
      {/* LEFT: Patient Queue Sidebar */}
      <div className="w-[300px] border-r border-border bg-card flex flex-col shrink-0">
        {/* Queue header */}
        <div className="p-3 border-b border-border space-y-2">
          <div className="flex items-center gap-1">
            <button
              onClick={() => setQueueFilter('today')}
              className={cn(
                'flex-1 text-xs font-semibold py-1.5 rounded-lg transition-all text-center',
                queueFilter === 'today' ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground hover:bg-muted/80'
              )}
            >
              Walk-In
            </button>
            <button
              onClick={() => setQueueFilter('all')}
              className={cn(
                'flex-1 text-xs font-semibold py-1.5 rounded-lg transition-all text-center',
                queueFilter === 'all' ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground hover:bg-muted/80'
              )}
            >
              Online
            </button>
            <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => fetchQueue(true)} disabled={refreshing}>
              <RefreshCw className={cn('w-3.5 h-3.5', refreshing && 'animate-spin')} />
            </Button>
          </div>
          <div className="text-xs text-muted-foreground flex items-center gap-1">
            <span>Doctor</span>
            <span className="font-semibold text-foreground truncate flex-1">{user?.full_name ?? 'Doctor'}</span>
          </div>
          {/* Status summary */}
          <div className="flex items-center gap-2 text-[10px] font-medium">
            <span className="bg-amber-100 text-amber-700 px-2 py-0.5 rounded">Waiting: {waiting.length}</span>
            <span className="bg-primary/10 text-primary px-2 py-0.5 rounded">Engaged: {engaged.length}</span>
            <span className="bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded">Done: {completed.length}</span>
          </div>
        </div>

        {/* Queue filter tabs */}
        <div className="px-3 pt-2 pb-1 flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
            <Input
              value={queueSearch}
              onChange={e => setQueueSearch(e.target.value)}
              placeholder="Search..."
              className="h-7 pl-7 text-xs"
            />
          </div>
        </div>

        <div className="px-3 py-1.5 text-[11px] font-semibold text-muted-foreground flex items-center gap-1">
          <span>Today's Appointment Status</span>
          <ChevronDown className="w-3 h-3" />
        </div>

        {/* Patient list */}
        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="p-3 space-y-2">
              {Array.from({ length: 6 }).map((_, i) => (
                <Skeleton key={i} className="h-16 rounded-lg" />
              ))}
            </div>
          ) : filteredQueue.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
              <Clock className="w-8 h-8 mb-2 opacity-30" />
              <p className="text-xs">No patients in queue</p>
            </div>
          ) : (
            <div className="px-2 pb-2 space-y-1">
              {filteredQueue.map(appt => {
                const isSelected = selectedAppt?.id === appt.id;
                const isWaiting = appt.status === 'scheduled' || appt.status === 'confirmed';
                const isEngaged = appt.status === 'in_progress';
                const isCompleted = appt.status === 'completed';
                const demo = [getAge(appt.patient_dob, appt.patient_age), appt.patient_gender?.charAt(0).toUpperCase()].filter(Boolean).join(' ');

                return (
                  <button
                    key={appt.id}
                    onClick={() => handleSelectPatient(appt)}
                    className={cn(
                      'w-full text-left p-2.5 rounded-lg transition-all border',
                      isSelected
                        ? 'bg-primary/10 border-primary/30 shadow-sm'
                        : 'border-transparent hover:bg-muted/50',
                      appt.emergency && 'border-destructive/30 bg-destructive/5'
                    )}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5">
                          <p className="text-xs font-bold text-foreground truncate">{appt.patient_name}</p>
                          {appt.emergency && <AlertTriangle className="w-3 h-3 text-destructive shrink-0" />}
                        </div>
                        <p className="text-[10px] text-muted-foreground mt-0.5">
                          {isWaiting ? 'New Appointment' : isEngaged ? 'In Consultation' : 'Completed'}
                        </p>
                        <p className="text-[10px] text-muted-foreground">
                          Apt No. | {appt.patient_uhid}
                        </p>
                        {demo && (
                          <p className="text-[10px] text-muted-foreground">
                            WS: {demo}
                          </p>
                        )}
                      </div>
                      <div className="text-right shrink-0">
                        <p className="text-[10px] text-muted-foreground">{formatTime12(appt.appointment_time)}</p>
                        {/* Quick action icons */}
                        <div className="flex items-center gap-1 mt-1">
                          <div className={cn(
                            'w-4 h-4 rounded-sm flex items-center justify-center',
                            isCompleted ? 'bg-emerald-100 text-emerald-600' : isEngaged ? 'bg-primary/20 text-primary' : 'bg-muted text-muted-foreground'
                          )}>
                            <Stethoscope className="w-2.5 h-2.5" />
                          </div>
                        </div>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* MAIN: Consultation Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {selectedAppt ? (
          <>
            {/* Patient Header Bar */}
            <div className="bg-primary/5 border-b border-border px-4 py-2.5 shrink-0">
              <div className="flex items-center gap-4">
                {/* Patient avatar */}
                <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold text-sm shrink-0">
                  {selectedAppt.patient_name.charAt(0).toUpperCase()}
                </div>
                {/* Patient info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-[10px] font-mono text-muted-foreground bg-muted px-1.5 py-0.5 rounded">
                      ({selectedAppt.patient_uhid})
                    </span>
                    <h2 className="text-sm font-bold text-foreground truncate">{selectedAppt.patient_name}</h2>
                    {selectedAppt.emergency && (
                      <Badge className="bg-destructive/10 text-destructive border-destructive/20 text-[9px] h-4">Emergency</Badge>
                    )}
                  </div>
                  <div className="flex items-center gap-2 text-[11px] text-muted-foreground mt-0.5">
                    <span>{genderStr === 'M' ? 'Male' : genderStr === 'F' ? 'Female' : genderStr}</span>
                    {ageStr && <><span>•</span><span>({ageStr})</span></>}
                    {patientInfo?.phone && <><span>•</span><span>{patientInfo.phone}</span></>}
                    {patientInfo?.last_visit_date && (
                      <><span>•</span><span>Last: {format(new Date(patientInfo.last_visit_date), 'dd MMM yyyy')}</span></>
                    )}
                  </div>
                </div>
                {/* Search */}
                <div className="relative hidden lg:block">
                  <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
                  <Input placeholder="Search Patient..." className="h-8 pl-7 w-48 text-xs" />
                </div>
                {/* Action buttons */}
                <div className="flex items-center gap-1.5 shrink-0 flex-wrap">
                  <Button size="sm" className="h-7 text-[10px] font-bold bg-blue-600 hover:bg-blue-700 text-white gap-1 px-2">
                    <Bed className="w-3 h-3" />ADMIT
                  </Button>
                  <Button size="sm" className="h-7 text-[10px] font-bold bg-emerald-600 hover:bg-emerald-700 text-white gap-1 px-2">
                    <CalendarPlus className="w-3 h-3" />+ APPT
                  </Button>
                  <Button size="sm" className="h-7 text-[10px] font-bold bg-amber-600 hover:bg-amber-700 text-white gap-1 px-2">
                    <UserPlus className="w-3 h-3" />+ PATIENT
                  </Button>
                  <Button size="sm" variant="outline" className="h-7 text-[10px] font-bold gap-1 px-2 border-primary text-primary">
                    <Receipt className="w-3 h-3" />BILL
                  </Button>
                  <Button size="sm" variant="outline" className="h-7 text-[10px] font-bold gap-1 px-2">
                    <FileText className="w-3 h-3" />REPORT
                  </Button>
                </div>
              </div>
            </div>

            {/* Visit Entry */}
            <div className="flex-1 overflow-y-auto">
              <div className="border-b border-border">
                {/* Visit header */}
                <div className="px-4 py-2 flex items-center gap-3 bg-card">
                  <span className="text-xs font-bold text-amber-600">Walk-In</span>
                  <span className="text-[10px] text-muted-foreground">/</span>
                  <span className={cn(
                    'text-xs font-bold',
                    selectedAppt.status === 'completed' ? 'text-emerald-600' :
                    selectedAppt.status === 'in_progress' ? 'text-amber-600' : 'text-blue-600'
                  )}>
                    {selectedAppt.status === 'completed' ? 'Completed' :
                     selectedAppt.status === 'in_progress' ? 'In Progress' : 'Waiting'}
                  </span>
                  <span className="text-[10px] text-muted-foreground">
                    {format(new Date(), 'EEEE dd/MM/yyyy')} {formatTime12(selectedAppt.appointment_time)}
                  </span>
                  <span className="text-[10px] text-muted-foreground">(New Appointment)</span>
                  <div className="ml-auto flex items-center gap-2">
                    <Button variant="ghost" size="sm" className="h-7 text-[10px] text-primary gap-1">
                      <Download className="w-3 h-3" />Upload Document
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-7 text-[10px] gap-1"
                      onClick={() => prescriptionItems.length > 0 && setShowPrint(true)}
                      disabled={prescriptionItems.length === 0}
                    >
                      <Printer className="w-3 h-3" />Print
                    </Button>
                  </div>
                </div>

                {/* Vitals strip */}
                {(weight || height) && (
                  <div className="px-4 py-1.5 bg-amber-50 border-y border-amber-200">
                    <span className="text-[10px] font-bold text-amber-800">
                      Vitals: W: {weight || '--'} kg | H: {height || '--'} cm
                      {bp && ` | BP: ${bp}`}{pulse && ` | P: ${pulse}`}{temperature && ` | T: ${temperature}°F`}{spo2 && ` | SpO₂: ${spo2}%`}
                    </span>
                  </div>
                )}

                {/* Consultation Tabs */}
                <div className="px-2 bg-card border-b border-border">
                  <div className="flex items-center overflow-x-auto">
                    {TABS.map(tab => (
                      <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={cn(
                          'px-3 py-2 text-xs font-semibold whitespace-nowrap transition-all border-b-2',
                          activeTab === tab.id
                            ? 'border-primary text-primary bg-primary/5'
                            : 'border-transparent text-muted-foreground hover:text-foreground hover:bg-muted/30'
                        )}
                      >
                        {tab.label}
                      </button>
                    ))}
                    {/* Save button inline */}
                    <button
                      onClick={handleSave}
                      disabled={saving}
                      className="px-3 py-2 text-xs font-bold text-primary whitespace-nowrap hover:bg-primary/5 transition-all border-b-2 border-transparent ml-auto"
                    >
                      {saving ? 'Saving...' : 'Save'}
                    </button>
                  </div>
                </div>

                {/* Tab Content */}
                <div className="p-4 min-h-[300px]">
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
                      weight={weight}
                      height={height}
                      bp={bp}
                      pulse={pulse}
                      temperature={temperature}
                      spo2={spo2}
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
                    <InvestigationsSection
                      investigations={investigations}
                      onInvestigationsChange={setInvestigations}
                    />
                  )}

                  {activeTab === 'diagnosis' && (
                    <DiagnosisEditor
                      diagnosis={diagnosis}
                      onDiagnosisChange={setDiagnosis}
                      selectedDiagnoses={selectedDiagnoses}
                      onDiagnosesChange={setSelectedDiagnoses}
                    />
                  )}

                  {activeTab === 'rx' && (
                    <PrescriptionBuilder
                      items={prescriptionItems}
                      onItemsChange={setPrescriptionItems}
                    />
                  )}

                  {activeTab === 'advice' && (
                    <div className="space-y-4">
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
                            <Button
                              key={d}
                              variant="outline"
                              size="sm"
                              onClick={() => setFollowupDate(date.toISOString().split('T')[0])}
                              className="text-xs"
                            >
                              {d} days
                            </Button>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {activeTab === 'referred' && (
                    <div className="space-y-4">
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
                      <ClipboardList className="w-10 h-10 mb-3 opacity-30" />
                      <p className="text-sm">Consultation templates coming soon</p>
                      <p className="text-xs mt-1">Save and reuse common consultation patterns</p>
                    </div>
                  )}
                </div>

                {/* Save & Print bar */}
                <div className="px-4 py-2.5 border-t border-border bg-muted/30 flex items-center justify-between">
                  <Button
                    variant="link"
                    size="sm"
                    onClick={handleSaveAndPrint}
                    disabled={saving}
                    className="text-xs font-bold text-primary gap-1.5 px-0"
                  >
                    <Save className="w-3.5 h-3.5" />
                    Save & Print
                  </Button>
                  <div className="flex items-center gap-3 text-[10px] text-muted-foreground">
                    {selectedSymptoms.length > 0 && <span>{selectedSymptoms.length} symptom(s)</span>}
                    {selectedDiagnoses.length > 0 && <span>{selectedDiagnoses.length} diagnosis</span>}
                    {investigations.length > 0 && <span>{investigations.length} investigation(s)</span>}
                    {prescriptionItems.length > 0 && <span>{prescriptionItems.length} medicine(s)</span>}
                  </div>
                </div>
              </div>

              {/* Previous visits placeholder */}
              <div className="px-4 py-3 border-b border-border bg-card">
                <div className="flex items-center gap-3">
                  <span className="text-xs font-bold text-amber-600">Walk-In</span>
                  <span className="text-[10px] text-muted-foreground">/</span>
                  <span className="text-xs font-bold text-emerald-600">Completed</span>
                  <span className="text-[10px] text-muted-foreground">
                    {patientInfo?.last_visit_date ? format(new Date(patientInfo.last_visit_date), 'EEEE dd/MM/yyyy') : 'Previous Visit'}
                  </span>
                  <span className="text-[10px] text-muted-foreground">(Previous Appointment)</span>
                  <div className="ml-auto">
                    <Button variant="outline" size="sm" className="h-7 text-[10px] gap-1">
                      <Printer className="w-3 h-3" />Print
                    </Button>
                  </div>
                </div>
                <div className="mt-3 flex flex-col items-center justify-center py-8 text-muted-foreground">
                  <FileText className="w-8 h-8 mb-2 opacity-20" />
                  <p className="text-xs">No previous chart summary available</p>
                </div>
              </div>
            </div>
          </>
        ) : (
          /* No patient selected */
          <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground">
            <div className="w-20 h-20 rounded-2xl bg-muted flex items-center justify-center mb-4">
              <Stethoscope className="w-10 h-10 text-muted-foreground/30" />
            </div>
            <p className="text-base font-medium">Select a patient from the queue</p>
            <p className="text-sm mt-1 text-muted-foreground/70">Click on a patient name to begin consultation</p>
          </div>
        )}
      </div>

      {/* RIGHT: Quick Action Sidebar */}
      {selectedAppt && (
        <div className="w-12 border-l border-border bg-card flex flex-col items-center py-3 gap-2 shrink-0">
          <QuickActionBtn icon={FileText} label="Rx" color="text-blue-600 bg-blue-50" onClick={() => setActiveTab('rx')} />
          <QuickActionBtn icon={Eye} label="View" color="text-emerald-600 bg-emerald-50" />
          <QuickActionBtn icon={ClipboardList} label="Report" color="text-purple-600 bg-purple-50" />
          <QuickActionBtn icon={Printer} label="Print" color="text-primary bg-primary/10" onClick={() => prescriptionItems.length > 0 && setShowPrint(true)} />
          <QuickActionBtn icon={Download} label="Download" color="text-amber-600 bg-amber-50" />
        </div>
      )}
    </div>
  );
}

function QuickActionBtn({ icon: Icon, label, color, onClick }: { icon: React.ElementType; label: string; color: string; onClick?: () => void }) {
  return (
    <button
      onClick={onClick}
      className={cn('w-9 h-9 rounded-lg flex items-center justify-center transition-all hover:scale-105', color)}
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
      <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
        <ClipboardList className="w-10 h-10 mb-3 opacity-20" />
        <p className="text-sm font-medium">No data entered yet</p>
        <p className="text-xs mt-1">Start by adding symptoms, vitals, or prescription</p>
      </div>
    );
  }

  return (
    <div className="space-y-4 text-sm">
      {(weight || height) && (
        <div>
          <h4 className="font-bold text-xs text-muted-foreground uppercase tracking-wide mb-1">Vitals</h4>
          <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
            {weight && <VitalChip label="W" value={`${weight} kg`} />}
            {height && <VitalChip label="H" value={`${height} cm`} />}
            {bp && <VitalChip label="BP" value={bp} />}
            {pulse && <VitalChip label="Pulse" value={pulse} />}
            {temperature && <VitalChip label="Temp" value={`${temperature}°F`} />}
            {spo2 && <VitalChip label="SpO₂" value={`${spo2}%`} />}
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
          <div className="space-y-1">
            {prescriptionItems.map((item, idx) => (
              <div key={item.id} className="text-xs flex gap-2">
                <span className="text-muted-foreground w-4">{idx + 1}.</span>
                <span className="font-medium">{item.medicine_name}</span>
                <span className="text-muted-foreground">{item.dose} | {item.frequency} | {item.duration}d</span>
              </div>
            ))}
          </div>
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

function VitalChip({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-muted rounded-lg px-2.5 py-1.5 text-center">
      <p className="text-[9px] font-bold text-muted-foreground uppercase">{label}</p>
      <p className="text-xs font-semibold text-foreground">{value}</p>
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
  const inputCls = "w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary";

  return (
    <div className="space-y-5">
      <div>
        <h3 className="text-sm font-semibold text-foreground mb-3">Vitals</h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          <div>
            <label className="text-[10px] font-bold text-muted-foreground uppercase mb-1 block">Weight (kg)</label>
            <input value={weight} onChange={e => onWeightChange(e.target.value)} placeholder="60" className={inputCls} />
          </div>
          <div>
            <label className="text-[10px] font-bold text-muted-foreground uppercase mb-1 block">Height (cm)</label>
            <input value={height} onChange={e => onHeightChange(e.target.value)} placeholder="152" className={inputCls} />
          </div>
          <div>
            <label className="text-[10px] font-bold text-muted-foreground uppercase mb-1 block">BP (mmHg)</label>
            <input value={bp} onChange={e => onBpChange(e.target.value)} placeholder="120/80" className={inputCls} />
          </div>
          <div>
            <label className="text-[10px] font-bold text-muted-foreground uppercase mb-1 block">Pulse (bpm)</label>
            <input value={pulse} onChange={e => onPulseChange(e.target.value)} placeholder="72" className={inputCls} />
          </div>
          <div>
            <label className="text-[10px] font-bold text-muted-foreground uppercase mb-1 block">Temp (°F)</label>
            <input value={temperature} onChange={e => onTemperatureChange(e.target.value)} placeholder="98.6" className={inputCls} />
          </div>
          <div>
            <label className="text-[10px] font-bold text-muted-foreground uppercase mb-1 block">SpO₂ (%)</label>
            <input value={spo2} onChange={e => onSpo2Change(e.target.value)} placeholder="98" className={inputCls} />
          </div>
        </div>
      </div>
      <div>
        <h3 className="text-sm font-semibold text-foreground mb-2">Vitals / Observation Notes</h3>
        <textarea
          value={notes}
          onChange={e => onNotesChange(e.target.value)}
          placeholder="Additional vitals observations..."
          rows={4}
          className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary resize-none"
        />
      </div>
      <div>
        <h3 className="text-sm font-semibold text-foreground mb-2">Physical Examination</h3>
        <textarea
          value={examinationNotes}
          onChange={e => onExaminationNotesChange(e.target.value)}
          placeholder="Physical examination findings..."
          rows={6}
          className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary resize-none"
        />
      </div>
    </div>
  );
}

function DiagnosisEditor({
  diagnosis, onDiagnosisChange, selectedDiagnoses, onDiagnosesChange,
}: {
  diagnosis: string;
  onDiagnosisChange: (v: string) => void;
  selectedDiagnoses: SelectedDiagnosis[];
  onDiagnosesChange: (v: SelectedDiagnosis[]) => void;
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
      diagnosis_id: d.id,
      name: d.name,
      icd10_code: d.icd10_code,
      type: selectedDiagnoses.length === 0 ? 'primary' : 'secondary',
    }]);
    setSearchTerm('');
    setResults([]);
  };

  const removeDiagnosis = (id: string) => {
    onDiagnosesChange(selectedDiagnoses.filter(d => d.diagnosis_id !== id));
  };

  return (
    <div className="space-y-4">
      <div>
        <label className="text-sm font-medium text-foreground mb-1.5 block">Diagnosis (free text)</label>
        <textarea
          value={diagnosis}
          onChange={e => onDiagnosisChange(e.target.value)}
          placeholder="Enter diagnosis..."
          rows={3}
          className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary resize-none"
        />
      </div>
      <div>
        <label className="text-sm font-medium text-foreground mb-1.5 block">ICD-10 Search (optional)</label>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            placeholder="Search by diagnosis name or ICD-10 code..."
            className="w-full rounded-lg border border-border bg-background pl-9 pr-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
          />
        </div>
        {searching && <p className="text-xs text-muted-foreground mt-1">Searching...</p>}
        {results.length > 0 && (
          <div className="mt-1 bg-card border border-border rounded-lg shadow-lg max-h-48 overflow-y-auto">
            {results.map(r => (
              <button
                key={r.id}
                onClick={() => addDiagnosis(r)}
                className="w-full text-left px-3 py-2 hover:bg-muted text-sm flex items-center justify-between"
              >
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
              <Badge variant="outline" className="text-[10px] h-5">
                {idx === 0 ? 'Primary' : 'Secondary'}
              </Badge>
              <span className="text-sm text-foreground flex-1">{d.name}</span>
              {d.icd10_code && <span className="text-xs text-muted-foreground font-mono">{d.icd10_code}</span>}
              <button onClick={() => removeDiagnosis(d.diagnosis_id)} className="text-muted-foreground hover:text-destructive">
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
