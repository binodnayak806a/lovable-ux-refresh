import { useState, useEffect, useCallback } from 'react';
import {
  Stethoscope, FileText, Search as SearchIcon, Activity,
  ClipboardList, Save, Loader2, CheckCircle2, AlertTriangle, Pill, Receipt,
} from 'lucide-react';
import { Button } from '../../../components/ui/button';
import { Card, CardContent } from '../../../components/ui/card';
import { useAppSelector } from '../../../store';
import { useToast } from '../../../hooks/useToast';
import consultationService from '../../../services/consultation.service';
import { mockStore } from '../../../lib/mockStore';
import SymptomsTab from './SymptomsTab';
import HistoryTab from './HistoryTab';
import ExaminationTab from './ExaminationTab';
import DiagnosisTab from './DiagnosisTab';
import AssessmentTab from './AssessmentTab';
import PrescriptionTab from '../prescription/PrescriptionTab';
import BillingTab from '../billing/BillingTab';
import PatientLookup from '../vitals/PatientLookup';
import type {
  Symptom,
  SelectedSymptom,
  SelectedDiagnosis,
  ConsultationFormData,
  ConsultationTab,
  HistorySubTab,
} from './types';
import { EMPTY_CONSULTATION } from './types';

interface PatientResult {
  id: string;
  uhid: string;
  full_name: string;
  phone: string;
  gender: string;
  date_of_birth: string | null;
}

const TABS: Array<{ id: ConsultationTab; label: string; icon: React.ElementType }> = [
  { id: 'symptoms', label: 'Symptoms', icon: Activity },
  { id: 'history', label: 'History', icon: FileText },
  { id: 'examination', label: 'Examination', icon: Stethoscope },
  { id: 'diagnosis', label: 'Diagnosis', icon: SearchIcon },
  { id: 'assessment', label: 'Assessment', icon: ClipboardList },
  { id: 'prescription', label: 'Prescription', icon: Pill },
  { id: 'billing', label: 'Billing', icon: Receipt },
];

interface ConsultationPageProps {
  initialPatientId?: string | null;
  initialAppointmentId?: string | null;
}

export default function ConsultationPage({ initialPatientId, initialAppointmentId }: ConsultationPageProps) {
  const { user } = useAppSelector((s) => s.auth);
  const { toast } = useToast();

  const [patient, setPatient] = useState<PatientResult | null>(null);
  const [appointmentId, setAppointmentId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<ConsultationTab>('symptoms');
  const [historySubTab, setHistorySubTab] = useState<HistorySubTab>('hpi');

  const [symptoms, setSymptoms] = useState<Symptom[]>([]);
  const [symptomsLoading, setSymptomsLoading] = useState(false);
  const [selectedSymptoms, setSelectedSymptoms] = useState<SelectedSymptom[]>([]);
  const [selectedDiagnoses, setSelectedDiagnoses] = useState<SelectedDiagnosis[]>([]);
  const [form, setForm] = useState<ConsultationFormData>(EMPTY_CONSULTATION);

  const [submitting, setSubmitting] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    const loadSymptoms = async () => {
      setSymptomsLoading(true);
      try {
        const data = await consultationService.getSymptoms();
        setSymptoms(data);
      } catch {
        setSymptoms([]);
        toast('Load Error', { description: 'Failed to load symptoms list', type: 'error' });
      } finally {
        setSymptomsLoading(false);
      }
    };
    loadSymptoms();
  }, []);

  // Auto-select patient from queue context
  useEffect(() => {
    if (initialPatientId && !patient) {
      const p = mockStore.getPatientById(initialPatientId);
      if (p) {
        setPatient({
          id: p.id,
          uhid: p.uhid,
          full_name: p.full_name,
          phone: p.phone,
          gender: p.gender,
          date_of_birth: p.date_of_birth,
        });
        if (initialAppointmentId) {
          setAppointmentId(initialAppointmentId);
        }
      }
    }
  }, [initialPatientId, initialAppointmentId]);

  const handlePatientSelect = (p: PatientResult | null) => {
    setPatient(p);
    setSaved(false);
    setSelectedSymptoms([]);
    setSelectedDiagnoses([]);
    setForm(EMPTY_CONSULTATION);
  };

  const handleFormChange = useCallback((field: keyof ConsultationFormData, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    setSaved(false);
  }, []);

  const handleSave = async () => {
    if (!patient) {
      toast('No Patient Selected', { description: 'Please search and select a patient first.', type: 'error' });
      return;
    }

    if (selectedSymptoms.length === 0 && selectedDiagnoses.length === 0 && !form.chiefComplaint) {
      toast('Incomplete Data', { description: 'Please add symptoms, diagnosis, or chief complaint.', type: 'error' });
      return;
    }

    setSubmitting(true);
    try {
      const consultation = await consultationService.createConsultation(
        patient.id,
        appointmentId,
        user?.id ?? '',
        form,
        selectedSymptoms,
        selectedDiagnoses
      );
      setSaved(true);
      setSavedConsultationId(consultation.id);
      toast('Consultation Saved', {
        description: `Consultation recorded for ${patient.full_name}`,
        type: 'success',
      });
    } catch (err: unknown) {
      toast('Save Failed', {
        description: err instanceof Error ? err.message : 'Could not save consultation.',
        type: 'error',
      });
    } finally {
      setSubmitting(false);
    }
  };

  const [savedConsultationId, setSavedConsultationId] = useState<string | null>(null);
  const [savedPrescriptionId] = useState<string | null>(null);

  const tabProgress: Record<ConsultationTab, boolean> = {
    symptoms: selectedSymptoms.length > 0,
    history: !!(form.historyOfPresentIllness || form.pastHistory || form.familyHistory),
    examination: !!form.physicalExamination,
    diagnosis: selectedDiagnoses.length > 0,
    assessment: !!(form.assessment || form.plan),
    prescription: false,
    billing: false,
  };

  const completedTabs = Object.values(tabProgress).filter(Boolean).length;

  const diagnosisSummary = selectedDiagnoses.length > 0
    ? selectedDiagnoses.map((d) => d.name).join(', ')
    : '';

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Doctor Consultation</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            OPD Step 4 — Symptoms, History, Examination & Diagnosis
          </p>
        </div>
        <div className="flex items-center gap-2">
          {completedTabs > 0 && (
            <span className="text-xs font-semibold text-gray-500 bg-gray-100 px-2.5 py-1 rounded-lg">
              {completedTabs}/7 sections
            </span>
          )}
          <Button
            size="sm"
            onClick={handleSave}
            disabled={submitting || !patient}
            className={`gap-1.5 h-8 min-w-[140px] ${saved ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-blue-600 hover:bg-blue-700'}`}
          >
            {submitting ? (
              <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Saving…</>
            ) : saved ? (
              <><CheckCircle2 className="w-3.5 h-3.5" /> Saved</>
            ) : (
              <><Save className="w-3.5 h-3.5" /> Save Consultation</>
            )}
          </Button>
        </div>
      </div>

      <Card className="border border-gray-100 shadow-sm">
        <CardContent className="px-5 py-4">
          <div className="space-y-1.5 mb-1">
            <div className="flex items-center gap-2">
              <Stethoscope className="w-4 h-4 text-blue-500" />
              <label className="text-sm font-semibold text-gray-700">Patient</label>
            </div>
          </div>
          <PatientLookup
            selectedPatient={patient}
            onSelect={handlePatientSelect}
            selectedAppointmentId={appointmentId}
            onSelectAppointment={setAppointmentId}
          />
        </CardContent>
      </Card>

      <div className={`transition-all duration-200 ${!patient ? 'opacity-40 pointer-events-none' : ''}`}>
        <div className="flex gap-1 p-1 bg-gray-50 rounded-xl overflow-x-auto">
          {TABS.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            const hasProgress = tabProgress[tab.id];
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-1.5 px-4 py-2.5 rounded-lg text-sm font-semibold whitespace-nowrap transition-all ${
                  isActive
                    ? 'bg-white text-blue-700 shadow-sm'
                    : hasProgress
                    ? 'text-emerald-700 hover:bg-white/60'
                    : 'text-gray-500 hover:bg-white/60'
                }`}
              >
                <Icon className="w-4 h-4" />
                {tab.label}
                {hasProgress && !isActive && (
                  <span className="w-2 h-2 rounded-full bg-emerald-500" />
                )}
              </button>
            );
          })}
        </div>

        <Card className="border border-gray-100 shadow-sm mt-4">
          <CardContent className="p-5">
            {activeTab === 'symptoms' && (
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-gray-600 uppercase tracking-wide">
                    Chief Complaint
                  </label>
                  <textarea
                    value={form.chiefComplaint}
                    onChange={(e) => handleFormChange('chiefComplaint', e.target.value)}
                    placeholder="Patient's main presenting complaint in their own words…"
                    rows={2}
                    className="w-full rounded-xl border border-gray-200 focus:border-blue-400 focus:ring-2 focus:ring-blue-100 text-sm px-4 py-3 outline-none transition-all resize-none"
                  />
                </div>
                <SymptomsTab
                  symptoms={symptoms}
                  selectedSymptoms={selectedSymptoms}
                  onSymptomsChange={setSelectedSymptoms}
                  loading={symptomsLoading}
                />
              </div>
            )}

            {activeTab === 'history' && (
              <HistoryTab
                form={form}
                activeSubTab={historySubTab}
                onSubTabChange={setHistorySubTab}
                onChange={handleFormChange}
              />
            )}

            {activeTab === 'examination' && (
              <ExaminationTab form={form} onChange={handleFormChange} />
            )}

            {activeTab === 'diagnosis' && (
              <DiagnosisTab
                selectedDiagnoses={selectedDiagnoses}
                onDiagnosesChange={setSelectedDiagnoses}
              />
            )}

            {activeTab === 'assessment' && (
              <AssessmentTab
                form={form}
                selectedDiagnoses={selectedDiagnoses}
                onChange={handleFormChange}
              />
            )}

            {activeTab === 'prescription' && (
              <PrescriptionTab
                patient={patient}
                consultationId={savedConsultationId}
                diagnosisSummary={diagnosisSummary}
              />
            )}

            {activeTab === 'billing' && (
              <BillingTab
                patient={patient}
                consultationId={savedConsultationId}
                prescriptionId={savedPrescriptionId}
              />
            )}
          </CardContent>
        </Card>
      </div>

      {!patient && (
        <div className="text-center py-6 text-gray-400 text-sm">
          Search and select a patient above to start the consultation
        </div>
      )}

      {patient && selectedSymptoms.length === 0 && selectedDiagnoses.length === 0 && !form.chiefComplaint && (
        <div className="flex items-start gap-2 p-3 bg-amber-50 border border-amber-200 rounded-xl">
          <AlertTriangle className="w-4 h-4 text-amber-600 mt-0.5 shrink-0" />
          <p className="text-xs text-amber-800">
            <span className="font-semibold">Tip:</span> Start by entering the chief complaint and selecting symptoms from the categorized list.
          </p>
        </div>
      )}
    </div>
  );
}
