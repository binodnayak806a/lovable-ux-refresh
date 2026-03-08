import { useState, useEffect } from 'react';
import {
  X, Clock, Stethoscope, BedDouble, CreditCard,
  Activity, Pill, Calendar, User, FileText,
  ChevronDown, ChevronUp, Download,
} from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '../../../components/ui/button';
import { Badge } from '../../../components/ui/badge';
import { Skeleton } from '../../../components/ui/skeleton';
import { ScrollArea } from '../../../components/ui/scroll-area';
import patientService from '../../../services/patient.service';
import type {
  PatientDetail, OPDVisit, IPDAdmission, PatientPayment,
  PatientVitalRecord, PatientPrescription,
} from '../../../services/patient.service';

interface Props {
  patientId: string;
  onClose: () => void;
}

type TabId = 'overview' | 'opd' | 'ipd' | 'payments' | 'vitals';

const TABS: { id: TabId; label: string; icon: React.ElementType }[] = [
  { id: 'overview', label: 'Overview', icon: Clock },
  { id: 'opd', label: 'OPD', icon: Stethoscope },
  { id: 'ipd', label: 'IPD', icon: BedDouble },
  { id: 'payments', label: 'Payments', icon: CreditCard },
  { id: 'vitals', label: 'Vitals', icon: Activity },
];

function formatDate(d: string | null): string {
  if (!d) return '-';
  return new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}

function formatTime(t: string): string {
  if (!t) return '';
  const [h, m] = t.split(':');
  const hour = parseInt(h);
  const ampm = hour >= 12 ? 'PM' : 'AM';
  return `${hour % 12 || 12}:${m} ${ampm}`;
}

function formatCurrency(amt: number): string {
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(amt);
}

const STATUS_STYLES: Record<string, string> = {
  scheduled: 'bg-blue-50 text-blue-700',
  confirmed: 'bg-emerald-50 text-emerald-700',
  in_progress: 'bg-amber-50 text-amber-700',
  completed: 'bg-gray-100 text-gray-600',
  cancelled: 'bg-red-50 text-red-600',
  active: 'bg-green-50 text-green-700',
  discharged: 'bg-gray-100 text-gray-600',
};

export default function PatientHistoryDrawer({ patientId, onClose }: Props) {
  const [tab, setTab] = useState<TabId>('overview');
  const [loading, setLoading] = useState(true);
  const [patient, setPatient] = useState<PatientDetail | null>(null);
  const [opdVisits, setOpdVisits] = useState<OPDVisit[]>([]);
  const [ipdAdmissions, setIpdAdmissions] = useState<IPDAdmission[]>([]);
  const [payments, setPayments] = useState<PatientPayment[]>([]);
  const [vitals, setVitals] = useState<PatientVitalRecord[]>([]);
  const [prescriptions, setPrescriptions] = useState<PatientPrescription[]>([]);

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const [pt, opd, ipd, pay, vit, rx] = await Promise.all([
          patientService.getPatientById(patientId),
          patientService.getOPDVisits(patientId),
          patientService.getIPDAdmissions(patientId),
          patientService.getPatientPayments(patientId),
          patientService.getPatientVitals(patientId),
          patientService.getPatientPrescriptions(patientId),
        ]);
        setPatient(pt);
        setOpdVisits(opd);
        setIpdAdmissions(ipd);
        setPayments(pay);
        setVitals(vit);
        setPrescriptions(rx);
      } catch {
        // silent
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [patientId]);

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-2xl bg-white shadow-2xl animate-in slide-in-from-right duration-300 flex flex-col">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-gradient-to-r from-gray-50 to-white">
          <div className="flex items-center gap-3">
            {patient && (
              <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center text-white font-bold text-sm">
                {patient.full_name.split(' ').slice(0, 2).map((n) => n[0]).join('').toUpperCase()}
              </div>
            )}
            <div>
              <h2 className="text-base font-semibold text-gray-900">
                {patient?.full_name ?? 'Loading...'}
              </h2>
              <p className="text-xs text-gray-500 flex items-center gap-2">
                {patient && (
                  <>
                    <span className="font-mono">{patient.uhid}</span>
                    <span className="text-gray-300">|</span>
                    <span>{patient.age}y / {patient.gender}</span>
                    {patient.blood_group && (
                      <>
                        <span className="text-gray-300">|</span>
                        <span className="text-red-600 font-medium">{patient.blood_group}</span>
                      </>
                    )}
                  </>
                )}
              </p>
            </div>
          </div>
          <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={onClose}>
            <X className="w-4 h-4" />
          </Button>
        </div>

        <div className="flex items-center gap-1 px-4 pt-3 pb-0 overflow-x-auto">
          {TABS.map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`flex items-center gap-1.5 px-3 py-2 text-xs font-medium rounded-t-lg border-b-2 transition-colors whitespace-nowrap ${
                tab === t.id
                  ? 'border-blue-600 text-blue-700 bg-blue-50/50'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50'
              }`}
            >
              <t.icon className="w-3.5 h-3.5" />
              {t.label}
              {!loading && t.id === 'opd' && opdVisits.length > 0 && (
                <span className="ml-1 text-[10px] bg-blue-100 text-blue-600 rounded-full px-1.5">{opdVisits.length}</span>
              )}
              {!loading && t.id === 'ipd' && ipdAdmissions.length > 0 && (
                <span className="ml-1 text-[10px] bg-amber-100 text-amber-600 rounded-full px-1.5">{ipdAdmissions.length}</span>
              )}
              {!loading && t.id === 'payments' && payments.length > 0 && (
                <span className="ml-1 text-[10px] bg-green-100 text-green-600 rounded-full px-1.5">{payments.length}</span>
              )}
            </button>
          ))}
        </div>

        <ScrollArea className="flex-1 px-6 py-4">
          {loading ? (
            <div className="space-y-4">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="flex gap-3">
                  <Skeleton className="w-8 h-8 rounded-full shrink-0" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-48" />
                    <Skeleton className="h-3 w-32" />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <>
              {tab === 'overview' && (
                <OverviewTab
                  opdVisits={opdVisits}
                  ipdAdmissions={ipdAdmissions}
                  payments={payments}
                  vitals={vitals}
                  prescriptions={prescriptions}
                />
              )}
              {tab === 'opd' && <OPDTab visits={opdVisits} />}
              {tab === 'ipd' && <IPDTab admissions={ipdAdmissions} />}
              {tab === 'payments' && <PaymentsTab payments={payments} />}
              {tab === 'vitals' && <VitalsTab vitals={vitals} prescriptions={prescriptions} />}
            </>
          )}
        </ScrollArea>
      </div>
    </div>
  );
}

function TimelineDot({ color }: { color: string }) {
  return (
    <div className="relative flex flex-col items-center">
      <div className={`w-3 h-3 rounded-full border-2 ${color} bg-white z-10`} />
      <div className="w-0.5 flex-1 bg-gray-200 -mt-0.5" />
    </div>
  );
}

function EmptyState({ icon: Icon, text }: { icon: React.ElementType; text: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-gray-400">
      <Icon className="w-10 h-10 mb-3 opacity-30" />
      <p className="text-sm">{text}</p>
    </div>
  );
}

function OverviewTab({
  opdVisits, ipdAdmissions, payments, vitals, prescriptions,
}: {
  opdVisits: OPDVisit[];
  ipdAdmissions: IPDAdmission[];
  payments: PatientPayment[];
  vitals: PatientVitalRecord[];
  prescriptions: PatientPrescription[];
}) {
  type TimelineItem = {
    date: string;
    type: 'opd' | 'ipd' | 'payment' | 'vital' | 'prescription';
    title: string;
    subtitle: string;
    badge?: string;
    badgeStyle?: string;
  };

  const items: TimelineItem[] = [];

  opdVisits.forEach((v) => {
    items.push({
      date: v.appointment_date,
      type: 'opd',
      title: `OPD Visit - Dr. ${v.doctor_name}`,
      subtitle: v.chief_complaint || v.type,
      badge: v.status,
      badgeStyle: STATUS_STYLES[v.status] ?? 'bg-gray-100 text-gray-600',
    });
  });

  ipdAdmissions.forEach((a) => {
    items.push({
      date: a.admission_date,
      type: 'ipd',
      title: `IPD Admission - ${a.ward_name}`,
      subtitle: a.primary_diagnosis || `#${a.admission_number}`,
      badge: a.status,
      badgeStyle: STATUS_STYLES[a.status] ?? 'bg-gray-100 text-gray-600',
    });
  });

  payments.forEach((p) => {
    items.push({
      date: p.payment_date,
      type: 'payment',
      title: `Payment - ${formatCurrency(p.amount)}`,
      subtitle: `${p.payment_mode}${p.bill_number ? ` | Bill #${p.bill_number}` : ''}`,
    });
  });

  vitals.slice(0, 5).forEach((v) => {
    const parts: string[] = [];
    if (v.systolic_bp && v.diastolic_bp) parts.push(`BP: ${v.systolic_bp}/${v.diastolic_bp}`);
    if (v.heart_rate) parts.push(`HR: ${v.heart_rate}`);
    if (v.temperature) parts.push(`Temp: ${v.temperature}`);
    if (v.spo2) parts.push(`SpO2: ${v.spo2}%`);
    items.push({
      date: v.recorded_at?.split('T')[0] ?? '',
      type: 'vital',
      title: 'Vitals Recorded',
      subtitle: parts.join(' | ') || 'Vitals data recorded',
    });
  });

  prescriptions.slice(0, 5).forEach((rx) => {
    items.push({
      date: rx.prescription_date,
      type: 'prescription',
      title: `Prescription #${rx.prescription_number}`,
      subtitle: `Dr. ${rx.doctor_name} | ${rx.items.length} medicine(s)`,
    });
  });

  items.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  if (items.length === 0) {
    return <EmptyState icon={Clock} text="No history available for this patient" />;
  }

  const TYPE_COLORS_MAP: Record<string, string> = {
    opd: 'border-teal-400',
    ipd: 'border-amber-400',
    payment: 'border-green-400',
    vital: 'border-sky-400',
    prescription: 'border-orange-400',
  };

  const TYPE_ICON_MAP: Record<string, React.ElementType> = {
    opd: Stethoscope,
    ipd: BedDouble,
    payment: CreditCard,
    vital: Activity,
    prescription: Pill,
  };

  const TYPE_BG_MAP: Record<string, string> = {
    opd: 'bg-teal-50 text-teal-600',
    ipd: 'bg-amber-50 text-amber-600',
    payment: 'bg-green-50 text-green-600',
    vital: 'bg-sky-50 text-sky-600',
    prescription: 'bg-orange-50 text-orange-600',
  };

  return (
    <div className="space-y-0">
      {items.map((item, i) => {
        const Icon = TYPE_ICON_MAP[item.type];
        return (
          <div key={i} className="flex gap-3 group">
            <div className="flex flex-col items-center pt-1">
              <TimelineDot color={TYPE_COLORS_MAP[item.type]} />
            </div>
            <div className={`flex-1 pb-4 ${i < items.length - 1 ? '' : 'pb-0'}`}>
              <div className="flex items-start gap-2 flex-wrap">
                <div className={`w-6 h-6 rounded-md flex items-center justify-center shrink-0 ${TYPE_BG_MAP[item.type]}`}>
                  <Icon className="w-3.5 h-3.5" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="text-sm font-medium text-gray-900">{item.title}</p>
                    {item.badge && (
                      <span className={`text-[10px] px-1.5 py-0.5 rounded capitalize ${item.badgeStyle}`}>
                        {item.badge.replace('_', ' ')}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-gray-500 mt-0.5">{item.subtitle}</p>
                  <p className="text-[10px] text-gray-400 mt-0.5 flex items-center gap-1">
                    <Calendar className="w-2.5 h-2.5" />
                    {formatDate(item.date)}
                  </p>
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function OPDTab({ visits }: { visits: OPDVisit[] }) {
  if (visits.length === 0) return <EmptyState icon={Stethoscope} text="No OPD visits found" />;

  return (
    <div className="space-y-3">
      {visits.map((v) => (
        <div key={v.id} className="bg-gray-50 rounded-lg p-3 border border-gray-100">
          <div className="flex items-center justify-between mb-1.5">
            <div className="flex items-center gap-2">
              <User className="w-3.5 h-3.5 text-teal-600" />
              <span className="text-sm font-medium text-gray-900">Dr. {v.doctor_name}</span>
            </div>
            <Badge variant="secondary" className={`text-[10px] capitalize ${STATUS_STYLES[v.status] ?? ''}`}>
              {v.status.replace('_', ' ')}
            </Badge>
          </div>
          {v.chief_complaint && (
            <p className="text-xs text-gray-600 mb-1.5">{v.chief_complaint}</p>
          )}
          <div className="flex items-center gap-3 text-[10px] text-gray-400">
            <span className="flex items-center gap-1">
              <Calendar className="w-2.5 h-2.5" />
              {formatDate(v.appointment_date)}
            </span>
            <span>{formatTime(v.appointment_time)}</span>
            <span className="capitalize bg-gray-100 px-1.5 py-0.5 rounded text-gray-500">{v.type}</span>
          </div>
        </div>
      ))}
    </div>
  );
}

function IPDTab({ admissions }: { admissions: IPDAdmission[] }) {
  if (admissions.length === 0) return <EmptyState icon={BedDouble} text="No IPD admissions found" />;

  return (
    <div className="space-y-3">
      {admissions.map((a) => (
        <div key={a.id} className="bg-gray-50 rounded-lg p-3 border border-gray-100">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-sm font-medium text-gray-900">#{a.admission_number}</span>
            <Badge variant="secondary" className={`text-[10px] capitalize ${STATUS_STYLES[a.status] ?? ''}`}>
              {a.status}
            </Badge>
          </div>
          <div className="flex items-center gap-2 text-xs text-gray-600 mb-1">
            <BedDouble className="w-3 h-3 text-amber-500" />
            <span>{a.ward_name}</span>
          </div>
          {a.primary_diagnosis && (
            <p className="text-xs text-gray-500 mb-1.5">
              <FileText className="w-3 h-3 inline mr-1" />
              {a.primary_diagnosis}
            </p>
          )}
          <div className="flex items-center gap-3 text-[10px] text-gray-400">
            <span>Admitted: {formatDate(a.admission_date)}</span>
            {a.discharge_date && <span>Discharged: {formatDate(a.discharge_date)}</span>}
          </div>
        </div>
      ))}
    </div>
  );
}

function PaymentsTab({ payments }: { payments: PatientPayment[] }) {
  if (payments.length === 0) return <EmptyState icon={CreditCard} text="No payments found" />;

  const totalPaid = payments.reduce((s, p) => s + p.amount, 0);

  return (
    <div className="space-y-3">
      <div className="bg-green-50 border border-green-100 rounded-lg p-3 flex items-center justify-between">
        <span className="text-xs font-medium text-green-700">Total Payments</span>
        <span className="text-lg font-bold text-green-800">{formatCurrency(totalPaid)}</span>
      </div>
      {payments.map((p) => (
        <div key={p.id} className="bg-gray-50 rounded-lg p-3 border border-gray-100 flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-900">{formatCurrency(p.amount)}</p>
            <div className="flex items-center gap-2 text-[10px] text-gray-400 mt-0.5">
              <span>{formatDate(p.payment_date)}</span>
              <span className="capitalize bg-gray-100 px-1.5 py-0.5 rounded text-gray-500">{p.payment_mode}</span>
              {p.bill_number && <span>Bill #{p.bill_number}</span>}
            </div>
          </div>
          {p.payment_reference && (
            <span className="text-[10px] text-gray-400 font-mono">{p.payment_reference}</span>
          )}
        </div>
      ))}
    </div>
  );
}

function VitalsTab({
  vitals,
  prescriptions,
}: {
  vitals: PatientVitalRecord[];
  prescriptions: PatientPrescription[];
}) {
  const [expandedRx, setExpandedRx] = useState<string | null>(null);

  return (
    <div className="space-y-4">
      <div>
        <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2 flex items-center gap-1.5">
          <Activity className="w-3.5 h-3.5" />
          Vitals History
        </h4>
        {vitals.length === 0 ? (
          <p className="text-xs text-gray-400 py-4 text-center">No vitals recorded</p>
        ) : (
          <div className="space-y-2">
            {vitals.map((v) => (
              <div key={v.id} className="bg-gray-50 rounded-lg p-3 border border-gray-100">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                  {v.systolic_bp && v.diastolic_bp && (
                    <VitalPill label="BP" value={`${v.systolic_bp}/${v.diastolic_bp}`} unit="mmHg" />
                  )}
                  {v.heart_rate && <VitalPill label="HR" value={v.heart_rate} unit="bpm" />}
                  {v.temperature && <VitalPill label="Temp" value={v.temperature} unit="C" />}
                  {v.spo2 && <VitalPill label="SpO2" value={v.spo2} unit="%" />}
                  {v.respiratory_rate && <VitalPill label="RR" value={v.respiratory_rate} unit="/min" />}
                  {v.weight && <VitalPill label="Wt" value={v.weight} unit="kg" />}
                  {v.height && <VitalPill label="Ht" value={v.height} unit="cm" />}
                </div>
                <p className="text-[10px] text-gray-400 mt-2">
                  {v.recorded_at ? new Date(v.recorded_at).toLocaleString('en-IN', {
                    day: '2-digit', month: 'short', year: 'numeric',
                    hour: '2-digit', minute: '2-digit',
                  }) : ''}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>

      <div>
        <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2 flex items-center gap-1.5">
          <Pill className="w-3.5 h-3.5" />
          Prescriptions
        </h4>
        {prescriptions.length === 0 ? (
          <p className="text-xs text-gray-400 py-4 text-center">No prescriptions found</p>
        ) : (
          <div className="space-y-2">
            {prescriptions.map((rx) => (
              <div key={rx.id} className="bg-gray-50 rounded-lg border border-gray-100">
                <button
                  className="w-full flex items-center justify-between p-3 text-left"
                  onClick={() => setExpandedRx(expandedRx === rx.id ? null : rx.id)}
                >
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      #{rx.prescription_number}
                    </p>
                    <p className="text-xs text-gray-500">
                      Dr. {rx.doctor_name} | {formatDate(rx.prescription_date)}
                    </p>
                    {rx.diagnosis && (
                      <p className="text-xs text-gray-400 mt-0.5">{rx.diagnosis}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary" className="text-[10px]">{rx.items.length} med(s)</Badge>
                    {expandedRx === rx.id ? <ChevronUp className="w-3.5 h-3.5 text-gray-400" /> : <ChevronDown className="w-3.5 h-3.5 text-gray-400" />}
                  </div>
                </button>
                {expandedRx === rx.id && rx.items.length > 0 && (
                  <div className="px-3 pb-3 border-t border-gray-100 pt-2">
                    <div className="space-y-1.5">
                      {rx.items.map((item, idx) => (
                        <div key={idx} className="flex items-start gap-2 text-xs">
                          <div className="w-4 h-4 rounded-full bg-orange-100 text-orange-600 flex items-center justify-center text-[9px] font-bold shrink-0 mt-0.5">
                            {idx + 1}
                          </div>
                          <div>
                            <span className="font-medium text-gray-800">{item.drug_name}</span>
                            <span className="text-gray-400 ml-1">
                              {[item.dosage, item.frequency, item.duration_days ? `${item.duration_days}d` : null].filter(Boolean).join(' | ')}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function VitalPill({ label, value, unit }: { label: string; value: string | number; unit: string }) {
  return (
    <div className="bg-white rounded-md px-2 py-1.5 border border-gray-100">
      <span className="text-gray-400 text-[10px]">{label}</span>
      <p className="font-semibold text-gray-800">
        {value} <span className="text-[10px] text-gray-400 font-normal">{unit}</span>
      </p>
    </div>
  );
}
