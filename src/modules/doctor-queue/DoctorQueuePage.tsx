import { useState, useEffect, useCallback } from 'react';
import {
  Search, RefreshCw, Clock, Stethoscope, Printer,
  FileText, AlertTriangle, ChevronDown, ChevronLeft, ClipboardList,
  X, Download, Eye, User, Phone, Edit, Info, SlidersHorizontal,
  MoreVertical, SkipBack, Mail, Save,
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
import VitalsEditor from './components/VitalsEditor';
import DiagnosisEditor, { type SelectedDiagnosis } from './components/DiagnosisEditor';
import ConsultationSummary from './components/ConsultationSummary';
import AdviceEditor from './components/AdviceEditor';
import FollowUpEditor from './components/FollowUpEditor';
import { cn } from '../../lib/utils';

type QueueFilter = 'walkin' | 'online';
type QueueSubFilter = 'today' | 'all';
type ConsultationTab = 'summary' | 'symptoms' | 'vitals' | 'investigation' | 'diagnosis' | 'rx' | 'advice' | 'followup' | 'referred' | 'template';

interface SelectedSymptom {
  symptom_id: string;
  name: string;
  severity: string;
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
  try { return formatDistanceToNow(new Date(createdAt), { addSuffix: false }); }
  catch { return ''; }
}

const TABS: Array<{ id: ConsultationTab; label: string }> = [
  { id: 'summary', label: 'Summary' },
  { id: 'symptoms', label: 'Symptoms' },
  { id: 'vitals', label: 'Vitals' },
  { id: 'investigation', label: 'Investigation' },
  { id: 'diagnosis', label: 'Diagnosis' },
  { id: 'rx', label: 'Rx' },
  { id: 'advice', label: 'Advice' },
  { id: 'followup', label: 'Follow Up' },
  { id: 'referred', label: 'Referred' },
  { id: 'template', label: 'Template' },
];

export default function DoctorQueuePage() {
  usePageTitle('Doctor OPD');
  const hospitalId = useHospitalId();
  const user = useAppSelector(s => s.auth.user);
  const doctorId = user?.id ?? '';

  // Queue state
  const [appointments, setAppointments] = useState<QueueAppointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [queueFilter, setQueueFilter] = useState<QueueFilter>('walkin');
  const [queueSubFilter, setQueueSubFilter] = useState<QueueSubFilter>('today');
  const [queueSearch, setQueueSearch] = useState('');
  const [hospitalSettings, setHospitalSettings] = useState<Record<string, string>>({});

  // Selected patient
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
    if (!silent) setLoading(true); else setRefreshing(true);
    try { const data = await doctorQueueService.getTodayQueue(doctorId, hospitalId); setAppointments(data); }
    catch { /* */ }
    finally { setLoading(false); setRefreshing(false); }
  }, [doctorId, hospitalId]);

  const fetchSettings = useCallback(async () => {
    try { const s = await doctorQueueService.getHospitalSettings(hospitalId); setHospitalSettings(s); }
    catch { /* */ }
  }, [hospitalId]);

  useEffect(() => { fetchQueue(); }, [fetchQueue]);
  useEffect(() => { fetchSettings(); }, [fetchSettings]);
  useRealtime({ table: 'appointments', filter: `doctor_id=eq.${doctorId}` }, () => fetchQueue(true));

  useEffect(() => {
    if (!selectedAppt) { setPatientInfo(null); return; }
    doctorQueueService.getPatientInfo(selectedAppt.patient_id).then(info => { if (info) setPatientInfo(info); });
  }, [selectedAppt?.patient_id]);

  const handleSelectPatient = (appt: QueueAppointment) => {
    setChiefComplaint(appt.chief_complaint ?? '');
    setSelectedSymptoms([]); setVitalsNotes('');
    setWeight(''); setHeight(''); setBp(''); setPulse(''); setTemperature(''); setSpo2('');
    setExaminationNotes(''); setDiagnosis(''); setSelectedDiagnoses([]); setInvestigations([]);
    setPrescriptionItems([]); setAdvice(''); setFollowupDate(''); setReferredTo('');
    setActiveTab('summary'); setSelectedAppt(appt);
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
        appointment_id: selectedAppt.id, patient_id: selectedAppt.patient_id,
        doctor_id: doctorId, hospital_id: hospitalId,
        chief_complaint: chiefComplaint, examination_notes: examinationNotes,
        diagnosis, advice, followup_date: followupDate || null,
        symptoms: selectedSymptoms, diagnoses: selectedDiagnoses,
        investigations, prescriptionItems,
      });
      toast.success('Consultation saved & completed');
      fetchQueue(true);
    } catch { toast.error('Failed to save consultation'); }
    finally { setSaving(false); }
  };

  const handleSaveAndPrint = async () => {
    await handleSave();
    setShowPrint(true);
  };

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

  // Full-screen print overlay
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
        selectedDiagnoses={selectedDiagnoses}
        symptoms={selectedSymptoms}
        investigations={investigations}
        prescriptionItems={prescriptionItems}
        advice={advice}
        followupDate={followupDate}
        vitals={{ weight, height, bp, pulse, temperature, spo2 }}
        onClose={() => setShowPrint(false)}
      />
    );
  }

  const waitingCount = appointments.filter(a => a.status === 'scheduled' || a.status === 'confirmed').length;
  const engagedCount = appointments.filter(a => a.status === 'in_progress').length;
  const doneCount = appointments.filter(a => a.status === 'completed').length;

  return (
    <div className="flex h-[calc(100vh-64px)] overflow-hidden bg-background">
      {/* ═══ LEFT: Patient Queue ═══ */}
      <div className="w-[280px] border-r border-border bg-card flex flex-col shrink-0">
        {/* Walk-In / Online toggle */}
        <div className="flex border-b border-border">
          {(['walkin', 'online'] as const).map(f => (
            <button key={f} onClick={() => setQueueFilter(f)}
              className={cn('flex-1 py-2.5 text-xs font-bold text-center border-b-2 transition-all flex items-center justify-center gap-1.5',
                queueFilter === f ? 'border-primary text-primary bg-primary/5' : 'border-transparent text-muted-foreground hover:text-foreground'
              )}>
              {f === 'walkin' ? 'Walk-In' : 'Online'}
              {f === 'walkin' && (
                <RefreshCw className={cn('w-3 h-3 cursor-pointer', refreshing && 'animate-spin')}
                  onClick={e => { e.stopPropagation(); fetchQueue(true); }} />
              )}
            </button>
          ))}
        </div>

        {/* Doctor selector */}
        <div className="px-3 pt-2 pb-1.5 border-b border-border">
          <div className="text-[10px] text-muted-foreground mb-1">Doctor</div>
          <Select defaultValue={doctorId}>
            <SelectTrigger className="h-7 text-xs"><SelectValue placeholder={user?.full_name ?? 'Select Doctor'} /></SelectTrigger>
            <SelectContent><SelectItem value={doctorId}>{user?.full_name ?? 'Doctor'}</SelectItem></SelectContent>
          </Select>
        </div>

        {/* Today / All + Stats */}
        <div className="flex border-b border-border">
          {(['today', 'all'] as const).map(f => (
            <button key={f} onClick={() => setQueueSubFilter(f)}
              className={cn('flex-1 py-2 text-xs font-semibold text-center transition-all',
                queueSubFilter === f ? 'bg-primary/10 text-primary border-b-2 border-primary' : 'text-muted-foreground hover:bg-muted/50'
              )}>
              {f === 'today' ? `Today (${appointments.length})` : 'All'}
            </button>
          ))}
        </div>

        {/* Queue status badges */}
        <div className="px-3 py-1.5 flex items-center gap-2 border-b border-border">
          <Badge variant="outline" className="text-[10px] bg-amber-50 text-amber-700 border-amber-200">{waitingCount} Waiting</Badge>
          <Badge variant="outline" className="text-[10px] bg-blue-50 text-blue-700 border-blue-200">{engagedCount} Engaged</Badge>
          <Badge variant="outline" className="text-[10px] bg-emerald-50 text-emerald-700 border-emerald-200">{doneCount} Done</Badge>
        </div>

        {/* Search */}
        <div className="px-2 pt-2 pb-1 flex items-center gap-1">
          <div className="relative flex-1">
            <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-3 h-3 text-muted-foreground" />
            <Input value={queueSearch} onChange={e => setQueueSearch(e.target.value)} placeholder="Search patient..." className="h-7 pl-6 text-[11px]" />
          </div>
          <button className="w-7 h-7 rounded border border-border flex items-center justify-center text-muted-foreground hover:bg-muted">
            <SlidersHorizontal className="w-3 h-3" />
          </button>
        </div>

        {/* Patient list */}
        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="p-2 space-y-2">{Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-16 rounded-lg" />)}</div>
          ) : filteredQueue.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
              <Clock className="w-8 h-8 mb-2 opacity-20" /><p className="text-xs">No patients in queue</p>
            </div>
          ) : (
            <div className="px-1.5 pb-2 space-y-0.5">
              {filteredQueue.map(appt => {
                const isSelected = selectedAppt?.id === appt.id;
                const isWaiting = appt.status === 'scheduled' || appt.status === 'confirmed';
                const isEngaged = appt.status === 'in_progress';
                const isDone = appt.status === 'completed';
                const demo = [getAge(appt.patient_dob, appt.patient_age), appt.patient_gender?.charAt(0).toUpperCase()].filter(Boolean).join('/');

                return (
                  <button key={appt.id} onClick={() => handleSelectPatient(appt)}
                    className={cn(
                      'w-full text-left px-2.5 py-2 rounded-lg transition-all border-l-[3px]',
                      isSelected ? 'bg-primary/10 border-l-primary shadow-sm' :
                      isEngaged ? 'bg-blue-50/50 dark:bg-blue-950/20 border-l-blue-500' :
                      isDone ? 'bg-emerald-50/50 dark:bg-emerald-950/20 border-l-emerald-500 opacity-70' :
                      'border-l-transparent hover:bg-muted/40',
                      appt.emergency && '!border-l-destructive bg-destructive/5'
                    )}>
                    <div className="flex items-start justify-between">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5">
                          <div className={cn(
                            'w-2 h-2 rounded-full shrink-0',
                            isWaiting ? 'bg-amber-500' : isEngaged ? 'bg-blue-500 animate-pulse' : 'bg-emerald-500'
                          )} />
                          <p className="text-[11px] font-bold text-foreground leading-tight truncate">
                            {appt.patient_name.toUpperCase()}
                          </p>
                        </div>
                        <p className="text-[10px] text-muted-foreground mt-0.5 ml-3.5">
                          {appt.patient_uhid} {demo && `• ${demo}`}
                        </p>
                        <p className="text-[10px] text-muted-foreground ml-3.5">
                          {isWaiting ? 'Waiting' : isEngaged ? 'In Consultation' : 'Completed'}
                          {' • '}{getWaitTime(appt.created_at)}
                        </p>
                      </div>
                      <div className="text-right shrink-0 ml-2">
                        <p className="text-[10px] font-medium text-muted-foreground">{formatTime12(appt.appointment_time)}</p>
                        {appt.token_number && <p className="text-[10px] font-mono text-primary">#{appt.token_number}</p>}
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
            {/* Patient Header */}
            <div className="bg-[hsl(var(--primary))] text-primary-foreground px-4 py-2.5 shrink-0">
              <div className="flex items-center gap-3">
                <button onClick={() => setSelectedAppt(null)}
                  className="w-8 h-8 rounded-full bg-primary-foreground/10 hover:bg-primary-foreground/20 flex items-center justify-center transition-all shrink-0">
                  <ChevronLeft className="w-4 h-4" />
                </button>

                <div className="w-10 h-10 rounded-full bg-accent flex items-center justify-center text-accent-foreground font-bold text-base shrink-0">
                  {selectedAppt.patient_name.charAt(0).toUpperCase()}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h2 className="text-sm font-bold truncate">{selectedAppt.patient_name.toUpperCase()}</h2>
                    <span className="text-[10px] font-mono opacity-70">({selectedAppt.patient_uhid})</span>
                  </div>
                  <div className="flex items-center gap-3 text-[11px] opacity-80 mt-0.5">
                    {genderStr && <span>{genderStr}</span>}
                    {ageStr && <span>Age: {ageStr}</span>}
                    {patientInfo?.phone && <span className="flex items-center gap-1"><Phone className="w-3 h-3" />{patientInfo.phone}</span>}
                    {patientInfo?.last_visit_date && (
                      <span className="text-[10px] opacity-70">Last visit: {format(new Date(patientInfo.last_visit_date), 'dd/MM/yyyy')}</span>
                    )}
                  </div>
                </div>

                {/* Action buttons */}
                <div className="flex items-center gap-1.5 shrink-0">
                  <ActionBtn label="ADMIT" />
                  <ActionBtn label="+APPT" />
                  <ActionBtn label="BILL" />
                  <ActionBtn label="REPORT" />
                </div>
              </div>
            </div>

            {/* Vitals strip */}
            {(weight || height || bp || pulse || temperature || spo2) && (
              <div className="px-4 py-1.5 bg-amber-50 dark:bg-amber-950/30 border-b border-amber-200 dark:border-amber-800 flex items-center gap-4">
                <span className="text-[10px] font-bold text-amber-800 dark:text-amber-200 uppercase">Vitals:</span>
                <div className="flex items-center gap-3 text-[11px]">
                  {weight && <VitalPill label="W" value={`${weight}kg`} />}
                  {height && <VitalPill label="H" value={`${height}cm`} />}
                  {bp && <VitalPill label="BP" value={bp} />}
                  {pulse && <VitalPill label="P" value={pulse} />}
                  {temperature && <VitalPill label="T" value={`${temperature}°F`} />}
                  {spo2 && <VitalPill label="SpO₂" value={`${spo2}%`} />}
                </div>
              </div>
            )}

            {/* Consultation Tabs */}
            <div className="bg-card border-b border-border shrink-0">
              <div className="flex items-center overflow-x-auto px-1">
                {TABS.map(tab => (
                  <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                    className={cn(
                      'px-3 py-2.5 text-[11px] font-semibold whitespace-nowrap transition-all relative',
                      activeTab === tab.id
                        ? 'text-primary after:absolute after:bottom-0 after:left-1 after:right-1 after:h-[2px] after:bg-primary after:rounded-full'
                        : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
                    )}>
                    {tab.label}
                  </button>
                ))}

                {/* Save actions */}
                <div className="ml-auto flex items-center gap-1 px-2 shrink-0">
                  <Button variant="outline" size="sm" className="h-7 text-xs gap-1" onClick={handleSave} disabled={saving}>
                    <Save className="w-3 h-3" />
                    {saving ? 'Saving...' : 'Save'}
                  </Button>
                  <Button size="sm" className="h-7 text-xs gap-1" onClick={handleSaveAndPrint} disabled={saving}>
                    <Printer className="w-3 h-3" />
                    Save & Print
                  </Button>
                </div>
              </div>
            </div>

            {/* Tab Content */}
            <div className="flex-1 overflow-y-auto p-4 bg-background">
              {activeTab === 'summary' && (
                <ConsultationSummary
                  chiefComplaint={chiefComplaint} symptoms={selectedSymptoms}
                  diagnosis={diagnosis} diagnoses={selectedDiagnoses}
                  investigations={investigations} prescriptionItems={prescriptionItems}
                  advice={advice} followupDate={followupDate}
                  weight={weight} height={height} bp={bp} pulse={pulse} temperature={temperature} spo2={spo2}
                />
              )}
              {activeTab === 'symptoms' && (
                <SymptomsSection
                  chiefComplaint={chiefComplaint} onChiefComplaintChange={setChiefComplaint}
                  selectedSymptoms={selectedSymptoms} onSymptomsChange={setSelectedSymptoms}
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
                <AdviceEditor advice={advice} onAdviceChange={setAdvice} />
              )}
              {activeTab === 'followup' && (
                <FollowUpEditor
                  followupDate={followupDate} onFollowupDateChange={setFollowupDate}
                  referredTo={referredTo} onReferredToChange={setReferredTo}
                />
              )}
              {activeTab === 'referred' && (
                <div>
                  <label className="text-sm font-medium text-foreground mb-1.5 block">Referred To</label>
                  <textarea value={referredTo} onChange={e => setReferredTo(e.target.value)}
                    placeholder="Referred to specialist / department / hospital..."
                    rows={4} className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary resize-none" />
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

      {/* ═══ RIGHT: Quick Action Bar ═══ */}
      {selectedAppt && (
        <div className="w-12 border-l border-border bg-card flex flex-col items-center py-3 gap-2 shrink-0">
          <QABtn icon={FileText} label="Rx" onClick={() => setActiveTab('rx')} active={activeTab === 'rx'} />
          <QABtn icon={Eye} label="Summary" onClick={() => setActiveTab('summary')} active={activeTab === 'summary'} />
          <QABtn icon={Stethoscope} label="Vitals" onClick={() => setActiveTab('vitals')} active={activeTab === 'vitals'} />
          <QABtn icon={Printer} label="Print" onClick={() => setShowPrint(true)} />
          <QABtn icon={Download} label="Download" />
        </div>
      )}
    </div>
  );
}

/* ── Small sub-components ── */

function ActionBtn({ label }: { label: string }) {
  return (
    <button className="px-2 py-1 rounded text-[9px] font-bold uppercase tracking-wide bg-primary-foreground/10 text-primary-foreground hover:bg-primary-foreground/20 transition-all">
      {label}
    </button>
  );
}

function QABtn({ icon: Icon, label, onClick, active }: { icon: React.ElementType; label: string; onClick?: () => void; active?: boolean }) {
  return (
    <button onClick={onClick}
      className={cn(
        'w-9 h-9 rounded-lg flex items-center justify-center transition-all',
        active ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-muted hover:text-foreground'
      )}
      title={label}>
      <Icon className="w-4 h-4" />
    </button>
  );
}

function VitalPill({ label, value }: { label: string; value: string }) {
  return (
    <span className="bg-amber-200/60 dark:bg-amber-800/60 px-1.5 py-0.5 rounded text-amber-900 dark:text-amber-100 font-medium">
      {label}: {value}
    </span>
  );
}
