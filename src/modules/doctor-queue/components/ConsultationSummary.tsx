import { format } from 'date-fns';
import { Badge } from '../../../components/ui/badge';
import type { InvestigationItem, PrescriptionDrug } from '../../../services/doctor-queue.service';

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

interface Props {
  chiefComplaint: string;
  symptoms: SelectedSymptom[];
  diagnosis: string;
  diagnoses: SelectedDiagnosis[];
  investigations: InvestigationItem[];
  prescriptionItems: PrescriptionDrug[];
  advice: string;
  followupDate: string;
  weight: string;
  height: string;
  bp: string;
  pulse: string;
  temperature: string;
  spo2: string;
}

const SEVERITY_COLORS: Record<string, string> = {
  mild: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  moderate: 'bg-amber-50 text-amber-700 border-amber-200',
  severe: 'bg-red-50 text-red-700 border-red-200',
};

export default function ConsultationSummary({
  chiefComplaint, symptoms, diagnosis, diagnoses, investigations, prescriptionItems,
  advice, followupDate, weight, height, bp, pulse, temperature, spo2,
}: Props) {
  const hasAny = chiefComplaint || symptoms.length > 0 || diagnosis || diagnoses.length > 0 ||
    investigations.length > 0 || prescriptionItems.length > 0 || advice || weight || height;

  if (!hasAny) {
    return (
      <div className="space-y-4 py-4">
        <div className="flex items-center gap-2 mb-2">
          <div className="w-1 h-5 bg-primary rounded-full" />
          <span className="text-sm font-semibold text-foreground">Consultation Summary</span>
        </div>
        <p className="text-sm text-muted-foreground italic">
          No data entered yet. Use the tabs above to enter vitals, symptoms, diagnosis, prescription, etc.
        </p>
      </div>
    );
  }

  const bmi = weight && height ? (parseFloat(weight) / Math.pow(parseFloat(height) / 100, 2)).toFixed(1) : null;

  return (
    <div className="space-y-4">
      {/* Vitals Card */}
      {(weight || height || bp || pulse || temperature || spo2) && (
        <div className="bg-muted/50 rounded-lg p-3 border border-border">
          <h4 className="font-bold text-xs text-muted-foreground uppercase tracking-wide mb-2">Vitals</h4>
          <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
            {weight && <VitalChip label="Weight" value={`${weight} kg`} />}
            {height && <VitalChip label="Height" value={`${height} cm`} />}
            {bp && <VitalChip label="BP" value={bp} />}
            {pulse && <VitalChip label="Pulse" value={`${pulse} bpm`} />}
            {temperature && <VitalChip label="Temp" value={`${temperature}°F`} />}
            {spo2 && <VitalChip label="SpO₂" value={`${spo2}%`} />}
          </div>
          {bmi && <p className="text-xs text-muted-foreground mt-2">BMI: <span className="font-semibold text-foreground">{bmi}</span></p>}
        </div>
      )}

      {/* Chief Complaint */}
      {chiefComplaint && (
        <SummarySection title="Chief Complaint">
          <p className="text-sm text-foreground">{chiefComplaint}</p>
        </SummarySection>
      )}

      {/* Symptoms */}
      {symptoms.length > 0 && (
        <SummarySection title={`Symptoms (${symptoms.length})`}>
          <div className="flex flex-wrap gap-1.5">
            {symptoms.map(s => (
              <Badge key={s.symptom_id} variant="outline" className={`text-xs ${SEVERITY_COLORS[s.severity] || ''}`}>
                {s.name} • {s.severity}
              </Badge>
            ))}
          </div>
        </SummarySection>
      )}

      {/* Diagnosis */}
      {(diagnosis || diagnoses.length > 0) && (
        <SummarySection title="Diagnosis">
          {diagnoses.map((d, idx) => (
            <div key={d.diagnosis_id} className="flex items-center gap-2 mb-1">
              <Badge variant={idx === 0 ? 'default' : 'secondary'} className="text-[10px]">
                {idx === 0 ? 'Primary' : 'Secondary'}
              </Badge>
              <span className="text-sm text-foreground">{d.name}</span>
              {d.icd10_code && <span className="text-xs text-muted-foreground font-mono">({d.icd10_code})</span>}
            </div>
          ))}
          {diagnosis && <p className="text-sm text-muted-foreground mt-1">{diagnosis}</p>}
        </SummarySection>
      )}

      {/* Investigations */}
      {investigations.length > 0 && (
        <SummarySection title={`Investigations (${investigations.length})`}>
          <div className="space-y-1">
            {investigations.map(inv => (
              <div key={inv.test_id} className="flex items-center justify-between text-sm">
                <span className="text-foreground">{inv.test_name} <span className="text-muted-foreground font-mono text-xs">{inv.test_code}</span></span>
                <span className="text-muted-foreground text-xs">₹{inv.test_price}</span>
              </div>
            ))}
          </div>
        </SummarySection>
      )}

      {/* Prescription */}
      {prescriptionItems.length > 0 && (
        <SummarySection title={`Prescription (${prescriptionItems.length})`}>
          <div className="space-y-1.5">
            {prescriptionItems.map((item, idx) => (
              <div key={item.id} className="text-sm flex gap-2">
                <span className="text-muted-foreground w-5 text-right shrink-0">{idx + 1}.</span>
                <div>
                  <span className="font-medium text-foreground">{item.medicine_name}</span>
                  <span className="text-muted-foreground ml-2">{item.dose} | {item.frequency} | {item.duration}d</span>
                  {item.instructions && <span className="text-muted-foreground/70 ml-1 text-xs">({item.instructions})</span>}
                </div>
              </div>
            ))}
          </div>
        </SummarySection>
      )}

      {/* Advice */}
      {advice && (
        <SummarySection title="Advice">
          <p className="text-sm text-foreground whitespace-pre-wrap">{advice}</p>
        </SummarySection>
      )}

      {/* Follow-up */}
      {followupDate && (
        <SummarySection title="Follow Up">
          <p className="text-sm text-foreground font-medium">{format(new Date(followupDate), 'dd MMM yyyy (EEEE)')}</p>
        </SummarySection>
      )}
    </div>
  );
}

function SummarySection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h4 className="font-bold text-xs text-muted-foreground uppercase tracking-wide mb-1.5">{title}</h4>
      {children}
    </div>
  );
}

function VitalChip({ label, value }: { label: string; value: string }) {
  return (
    <div className="text-center">
      <p className="text-[10px] text-muted-foreground uppercase">{label}</p>
      <p className="text-sm font-semibold text-foreground">{value}</p>
    </div>
  );
}
