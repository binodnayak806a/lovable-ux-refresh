import { useState, useEffect, useCallback } from 'react';
import {
  X, Save, AlertTriangle, Loader2, Stethoscope, FileText,
  FlaskConical, Pill, CalendarCheck, MessageSquare,
} from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';
import { Button } from '../../../components/ui/button';
import { Badge } from '../../../components/ui/badge';
import doctorQueueService, {
  type QueueAppointment,
  type PatientInfo,
  type InvestigationItem,
  type PrescriptionDrug,
} from '../../../services/doctor-queue.service';
import SymptomsSection from './SymptomsSection';
import InvestigationsSection from './InvestigationsSection';
import PrescriptionBuilder from './PrescriptionBuilder';
import PrescriptionPrint from './PrescriptionPrint';
import { cn } from '../../../lib/utils';

interface Props {
  appointment: QueueAppointment;
  hospitalId: string;
  doctorId: string;
  doctorName: string;
  hospitalSettings: Record<string, string>;
  onClose: () => void;
  onSaved: () => void;
}

type Section = 'complaint' | 'examination' | 'diagnosis' | 'investigations' | 'prescription' | 'advice';

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

export default function ConsultationDrawer({
  appointment, hospitalId, doctorId, doctorName, hospitalSettings, onClose, onSaved,
}: Props) {
  const [patientInfo, setPatientInfo] = useState<PatientInfo | null>(null);
  const [activeSection, setActiveSection] = useState<Section>('complaint');
  const [saving, setSaving] = useState(false);
  const [showPrint, setShowPrint] = useState(false);

  const [chiefComplaint, setChiefComplaint] = useState(appointment.chief_complaint ?? '');
  const [selectedSymptoms, setSelectedSymptoms] = useState<SelectedSymptom[]>([]);
  const [examinationNotes, setExaminationNotes] = useState('');
  const [diagnosis, setDiagnosis] = useState('');
  const [selectedDiagnoses, setSelectedDiagnoses] = useState<SelectedDiagnosis[]>([]);
  const [investigations, setInvestigations] = useState<InvestigationItem[]>([]);
  const [prescriptionItems, setPrescriptionItems] = useState<PrescriptionDrug[]>([]);
  const [advice, setAdvice] = useState('');
  const [followupDate, setFollowupDate] = useState('');

  const loadPatient = useCallback(async () => {
    const info = await doctorQueueService.getPatientInfo(appointment.patient_id);
    if (info) setPatientInfo(info);
  }, [appointment.patient_id]);

  useEffect(() => { loadPatient(); }, [loadPatient]);

  const handleMarkEmergency = async () => {
    try {
      await doctorQueueService.markEmergency(appointment.id, appointment.patient_id, hospitalId, doctorId);
      toast.success('Marked as emergency');
    } catch {
      toast.error('Failed to mark emergency');
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await doctorQueueService.saveConsultation({
        appointment_id: appointment.id,
        patient_id: appointment.patient_id,
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

      toast.success('Consultation saved');

      if (investigations.length > 0) {
        toast.info('Sent to Lab Module', { description: `${investigations.length} investigation(s) ordered` });
      }
      if (prescriptionItems.length > 0) {
        toast.info('Sent to Pharmacy', { description: `${prescriptionItems.length} medicine(s) prescribed` });
      }

      const autoPrint = hospitalSettings['auto_print_prescription'] === 'true';
      if (autoPrint && prescriptionItems.length > 0) {
        setShowPrint(true);
      } else {
        onSaved();
      }
    } catch {
      toast.error('Failed to save consultation');
    } finally {
      setSaving(false);
    }
  };

  const ageStr = patientInfo?.age
    ? `${patientInfo.age}y`
    : patientInfo?.date_of_birth
      ? `${Math.floor((Date.now() - new Date(patientInfo.date_of_birth).getTime()) / (365.25 * 24 * 60 * 60 * 1000))}y`
      : '';
  const genderStr = patientInfo?.gender ? patientInfo.gender.charAt(0).toUpperCase() : '';

  const sections: Array<{ key: Section; label: string; icon: React.ElementType; badge?: number }> = [
    { key: 'complaint', label: 'Complaint', icon: MessageSquare, badge: selectedSymptoms.length },
    { key: 'examination', label: 'Examination', icon: Stethoscope },
    { key: 'diagnosis', label: 'Diagnosis', icon: FileText, badge: selectedDiagnoses.length },
    { key: 'investigations', label: 'Investigations', icon: FlaskConical, badge: investigations.length },
    { key: 'prescription', label: 'Prescription', icon: Pill, badge: prescriptionItems.length },
    { key: 'advice', label: 'Advice', icon: CalendarCheck },
  ];

  if (showPrint) {
    return (
      <PrescriptionPrint
        patientName={appointment.patient_name}
        patientUhid={appointment.patient_uhid}
        patientAge={ageStr}
        patientGender={genderStr}
        doctorName={doctorName}
        hospitalName={hospitalSettings['hospital_name'] ?? 'Hospital'}
        hospitalAddress={hospitalSettings['hospital_address'] ?? ''}
        hospitalPhone={hospitalSettings['hospital_phone'] ?? ''}
        diagnosis={diagnosis}
        prescriptionItems={prescriptionItems}
        advice={advice}
        followupDate={followupDate}
        onClose={() => { setShowPrint(false); onSaved(); }}
      />
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex">
      <div className="absolute inset-0 bg-black/20 backdrop-blur-sm" onClick={onClose} />

      <div className="relative ml-auto w-full max-w-3xl bg-white shadow-2xl flex flex-col animate-in slide-in-from-right duration-300">
        <div className="px-5 py-3 border-b border-gray-100 shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={cn(
                'w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold',
                appointment.emergency ? 'bg-red-100 text-red-700' : 'bg-teal-100 text-teal-700'
              )}>
                {appointment.patient_name?.split(' ').slice(0, 2).map(n => n[0]).join('').toUpperCase()}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-base font-bold text-gray-900">{appointment.patient_name}</h2>
                  {appointment.emergency && (
                    <Badge className="bg-red-100 text-red-700 border-red-200 text-[10px]">Emergency</Badge>
                  )}
                  {appointment.token_number && (
                    <Badge variant="outline" className="text-[10px] font-mono">
                      Token #{appointment.token_number}
                    </Badge>
                  )}
                </div>
                <div className="flex items-center gap-2 text-xs text-gray-500">
                  <span className="font-mono">{appointment.patient_uhid}</span>
                  {ageStr && (
                    <><span className="text-gray-300">|</span><span>{ageStr}/{genderStr}</span></>
                  )}
                  {patientInfo?.last_visit_date && (
                    <><span className="text-gray-300">|</span>
                    <span>Last: {format(new Date(patientInfo.last_visit_date), 'dd MMM yyyy')}</span></>
                  )}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                className="h-8 gap-1.5 text-red-600 border-red-200 hover:bg-red-50"
                onClick={handleMarkEmergency}
              >
                <AlertTriangle className="w-3.5 h-3.5" />
                Emergency
              </Button>
              <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={onClose}>
                <X className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>

        <div className="flex border-b border-gray-100 px-2 overflow-x-auto shrink-0">
          {sections.map(s => (
            <button
              key={s.key}
              onClick={() => setActiveSection(s.key)}
              className={cn(
                'flex items-center gap-1.5 px-3 py-2.5 text-xs font-medium border-b-2 transition-colors whitespace-nowrap',
                activeSection === s.key
                  ? 'border-teal-600 text-teal-700'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              )}
            >
              <s.icon className="w-3.5 h-3.5" />
              {s.label}
              {s.badge !== undefined && s.badge > 0 && (
                <span className="w-4 h-4 bg-teal-600 text-white text-[9px] rounded-full flex items-center justify-center font-bold">
                  {s.badge}
                </span>
              )}
            </button>
          ))}
        </div>

        <div className="flex-1 overflow-y-auto p-5">
          {activeSection === 'complaint' && (
            <SymptomsSection
              chiefComplaint={chiefComplaint}
              onChiefComplaintChange={setChiefComplaint}
              selectedSymptoms={selectedSymptoms}
              onSymptomsChange={setSelectedSymptoms}
            />
          )}

          {activeSection === 'examination' && (
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-700 mb-1.5 block">
                  Examination & Notes
                </label>
                <textarea
                  value={examinationNotes}
                  onChange={e => setExaminationNotes(e.target.value)}
                  placeholder="Physical examination findings, clinical observations..."
                  rows={12}
                  className="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent resize-none"
                />
              </div>
            </div>
          )}

          {activeSection === 'diagnosis' && (
            <DiagnosisSection
              diagnosis={diagnosis}
              onDiagnosisChange={setDiagnosis}
              selectedDiagnoses={selectedDiagnoses}
              onDiagnosesChange={setSelectedDiagnoses}
            />
          )}

          {activeSection === 'investigations' && (
            <InvestigationsSection
              investigations={investigations}
              onInvestigationsChange={setInvestigations}
            />
          )}

          {activeSection === 'prescription' && (
            <PrescriptionBuilder
              items={prescriptionItems}
              onItemsChange={setPrescriptionItems}
            />
          )}

          {activeSection === 'advice' && (
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-700 mb-1.5 block">Advice</label>
                <textarea
                  value={advice}
                  onChange={e => setAdvice(e.target.value)}
                  placeholder="General advice, precautions, dietary instructions..."
                  rows={6}
                  className="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent resize-none"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 mb-1.5 block">Follow-up Date</label>
                <input
                  type="date"
                  value={followupDate}
                  onChange={e => setFollowupDate(e.target.value)}
                  min={new Date().toISOString().split('T')[0]}
                  className="w-full max-w-xs rounded-lg border border-gray-200 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                />
              </div>
            </div>
          )}
        </div>

        <div className="px-5 py-3 border-t border-gray-100 flex items-center justify-between shrink-0 bg-gray-50/50">
          <div className="flex items-center gap-3 text-xs text-gray-400">
            {selectedSymptoms.length > 0 && <span>{selectedSymptoms.length} symptom(s)</span>}
            {selectedDiagnoses.length > 0 && <span>{selectedDiagnoses.length} diagnosis(es)</span>}
            {investigations.length > 0 && <span>{investigations.length} investigation(s)</span>}
            {prescriptionItems.length > 0 && <span>{prescriptionItems.length} medicine(s)</span>}
          </div>
          <div className="flex items-center gap-2">
            {prescriptionItems.length > 0 && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowPrint(true)}
                className="h-9 gap-1.5"
              >
                Print Rx
              </Button>
            )}
            <Button
              size="sm"
              onClick={handleSave}
              disabled={saving}
              className="h-9 gap-1.5 bg-teal-600 hover:bg-teal-700 text-white min-w-[120px]"
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              {saving ? 'Saving...' : 'Save & Complete'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

function DiagnosisSection({
  diagnosis, onDiagnosisChange, selectedDiagnoses, onDiagnosesChange,
}: {
  diagnosis: string;
  onDiagnosisChange: (v: string) => void;
  selectedDiagnoses: Array<{ diagnosis_id: string; name: string; icd10_code: string | null; type: string }>;
  onDiagnosesChange: (v: Array<{ diagnosis_id: string; name: string; icd10_code: string | null; type: string }>) => void;
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
        <label className="text-sm font-medium text-gray-700 mb-1.5 block">Diagnosis (free text)</label>
        <textarea
          value={diagnosis}
          onChange={e => onDiagnosisChange(e.target.value)}
          placeholder="Enter diagnosis..."
          rows={3}
          className="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent resize-none"
        />
      </div>

      <div>
        <label className="text-sm font-medium text-gray-700 mb-1.5 block">ICD-10 Search (optional)</label>
        <input
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
          placeholder="Search by diagnosis name or ICD-10 code..."
          className="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
        />
        {searching && <p className="text-xs text-gray-400 mt-1">Searching...</p>}
        {results.length > 0 && (
          <div className="mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-48 overflow-y-auto">
            {results.map(r => (
              <button
                key={r.id}
                onClick={() => addDiagnosis(r)}
                className="w-full text-left px-3 py-2 hover:bg-gray-50 text-sm flex items-center justify-between"
              >
                <span>{r.name}</span>
                {r.icd10_code && <span className="text-xs text-gray-400 font-mono">{r.icd10_code}</span>}
              </button>
            ))}
          </div>
        )}
      </div>

      {selectedDiagnoses.length > 0 && (
        <div className="space-y-1.5">
          {selectedDiagnoses.map((d, idx) => (
            <div key={d.diagnosis_id} className="flex items-center gap-2 bg-gray-50 rounded-lg px-3 py-2">
              <Badge variant="outline" className="text-[10px] h-5">
                {idx === 0 ? 'Primary' : 'Secondary'}
              </Badge>
              <span className="text-sm text-gray-800 flex-1">{d.name}</span>
              {d.icd10_code && <span className="text-xs text-gray-400 font-mono">{d.icd10_code}</span>}
              <button onClick={() => removeDiagnosis(d.diagnosis_id)} className="text-gray-400 hover:text-red-500">
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
