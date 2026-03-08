import { useRef, forwardRef } from 'react';
import { useReactToPrint } from 'react-to-print';
import { Printer, X } from 'lucide-react';
import { format } from 'date-fns';
import { Button } from '../../../components/ui/button';
import type { PrescriptionDrug, InvestigationItem } from '../../../services/doctor-queue.service';

interface SelectedDiagnosis {
  diagnosis_id: string;
  name: string;
  icd10_code: string | null;
  type: string;
}

interface SelectedSymptom {
  symptom_id: string;
  name: string;
  severity: string;
}

interface Props {
  patientName: string;
  patientUhid: string;
  patientAge: string;
  patientGender: string;
  doctorName: string;
  hospitalName: string;
  hospitalAddress: string;
  hospitalPhone: string;
  diagnosis: string;
  selectedDiagnoses?: SelectedDiagnosis[];
  symptoms?: SelectedSymptom[];
  investigations?: InvestigationItem[];
  prescriptionItems: PrescriptionDrug[];
  advice: string;
  followupDate: string;
  vitals?: { weight: string; height: string; bp: string; pulse: string; temperature: string; spo2: string };
  onClose: () => void;
}

const RxContent = forwardRef<HTMLDivElement, Omit<Props, 'onClose'>>((props, ref) => {
  const {
    patientName, patientUhid, patientAge, patientGender,
    doctorName, hospitalName, hospitalAddress, hospitalPhone,
    diagnosis, selectedDiagnoses, symptoms, investigations,
    prescriptionItems, advice, followupDate, vitals,
  } = props;

  const today = format(new Date(), 'dd-MMM-yyyy hh:mm a');

  return (
    <div ref={ref} className="bg-white" style={{ width: '700px', padding: '28px 32px', fontFamily: "'Segoe UI', Arial, sans-serif", color: '#1e293b', fontSize: '12px' }}>
      {/* Hospital Header */}
      <div style={{ textAlign: 'center', borderBottom: '2px solid #0f4c75', paddingBottom: '10px', marginBottom: '14px' }}>
        <div style={{ fontSize: '20px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '1.5px', color: '#0f4c75' }}>
          {hospitalName}
        </div>
        {hospitalAddress && <div style={{ fontSize: '11px', color: '#64748b', marginTop: '2px' }}>{hospitalAddress}</div>}
        {hospitalPhone && <div style={{ fontSize: '11px', color: '#64748b' }}>Ph: {hospitalPhone}</div>}
      </div>

      {/* Patient + Doctor Info */}
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px', borderBottom: '1px solid #e2e8f0', paddingBottom: '10px' }}>
        <div style={{ lineHeight: 1.7 }}>
          <div><strong>Patient:</strong> {patientName}</div>
          <div><strong>UHID:</strong> <span style={{ fontFamily: 'monospace' }}>{patientUhid}</span></div>
          {(patientAge || patientGender) && <div><strong>Age/Sex:</strong> {[patientAge, patientGender].filter(Boolean).join(' / ')}</div>}
        </div>
        <div style={{ textAlign: 'right', lineHeight: 1.7 }}>
          <div><strong>Date:</strong> {today}</div>
          <div><strong>Doctor:</strong> Dr. {doctorName}</div>
        </div>
      </div>

      {/* Vitals */}
      {vitals && (vitals.weight || vitals.height || vitals.bp || vitals.pulse || vitals.temperature || vitals.spo2) && (
        <div style={{ marginBottom: '10px', padding: '6px 10px', background: '#f8fafc', borderRadius: '4px', border: '1px solid #e2e8f0' }}>
          <strong>Vitals: </strong>
          {[
            vitals.weight && `Wt: ${vitals.weight}kg`,
            vitals.height && `Ht: ${vitals.height}cm`,
            vitals.bp && `BP: ${vitals.bp}`,
            vitals.pulse && `Pulse: ${vitals.pulse}bpm`,
            vitals.temperature && `Temp: ${vitals.temperature}°F`,
            vitals.spo2 && `SpO₂: ${vitals.spo2}%`,
          ].filter(Boolean).join(' | ')}
        </div>
      )}

      {/* Symptoms */}
      {symptoms && symptoms.length > 0 && (
        <div style={{ marginBottom: '10px' }}>
          <strong>Symptoms: </strong>
          {symptoms.map(s => `${s.name} (${s.severity})`).join(', ')}
        </div>
      )}

      {/* Diagnosis */}
      {(selectedDiagnoses && selectedDiagnoses.length > 0) || diagnosis ? (
        <div style={{ marginBottom: '10px', padding: '6px 10px', background: '#f0f9ff', borderRadius: '4px', border: '1px solid #bae6fd' }}>
          <strong>Diagnosis: </strong>
          {selectedDiagnoses && selectedDiagnoses.length > 0
            ? selectedDiagnoses.map(d => `${d.name}${d.icd10_code ? ` [${d.icd10_code}]` : ''}`).join('; ')
            : ''}
          {diagnosis && selectedDiagnoses && selectedDiagnoses.length > 0 ? ` — ${diagnosis}` : diagnosis}
        </div>
      ) : null}

      {/* Investigations */}
      {investigations && investigations.length > 0 && (
        <div style={{ marginBottom: '12px' }}>
          <strong>Investigations Ordered:</strong>
          <div style={{ marginTop: '4px' }}>
            {investigations.map((inv, i) => (
              <span key={inv.test_id} style={{ display: 'inline-block', margin: '2px 4px 2px 0', padding: '2px 8px', background: '#f1f5f9', borderRadius: '3px', border: '1px solid #e2e8f0' }}>
                {inv.test_name} <span style={{ color: '#94a3b8', fontFamily: 'monospace', fontSize: '10px' }}>({inv.test_code})</span>
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Rx Section */}
      {prescriptionItems.length > 0 && (
        <div style={{ borderTop: '2px solid #0f4c75', paddingTop: '10px', marginBottom: '14px' }}>
          <div style={{ fontSize: '24px', fontWeight: 800, fontFamily: 'serif', marginBottom: '10px', color: '#0f4c75' }}>℞</div>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid #cbd5e1', textAlign: 'left' }}>
                <th style={{ padding: '5px 0', fontWeight: 700, width: '28px', color: '#64748b' }}>#</th>
                <th style={{ padding: '5px 0', fontWeight: 700 }}>Medicine</th>
                <th style={{ padding: '5px 0', fontWeight: 700, width: '70px' }}>Dose</th>
                <th style={{ padding: '5px 0', fontWeight: 700, width: '90px' }}>Frequency</th>
                <th style={{ padding: '5px 0', fontWeight: 700, width: '55px' }}>Days</th>
                <th style={{ padding: '5px 0', fontWeight: 700, width: '110px' }}>Instructions</th>
              </tr>
            </thead>
            <tbody>
              {prescriptionItems.map((item, idx) => (
                <tr key={item.id} style={{ borderBottom: '1px dotted #e2e8f0' }}>
                  <td style={{ padding: '7px 0', color: '#64748b' }}>{idx + 1}</td>
                  <td style={{ padding: '7px 0', fontWeight: 600 }}>{item.medicine_name}</td>
                  <td style={{ padding: '7px 0' }}>{item.dose}</td>
                  <td style={{ padding: '7px 0' }}>{item.frequency}</td>
                  <td style={{ padding: '7px 0' }}>{item.duration || ''}</td>
                  <td style={{ padding: '7px 0', color: '#64748b', fontSize: '11px' }}>{item.instructions}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Advice */}
      {advice && (
        <div style={{ marginBottom: '10px', borderTop: '1px solid #e2e8f0', paddingTop: '8px' }}>
          <strong>Advice:</strong>
          <div style={{ color: '#475569', whiteSpace: 'pre-wrap', marginTop: '3px' }}>{advice}</div>
        </div>
      )}

      {/* Follow-up */}
      {followupDate && (
        <div style={{ marginBottom: '16px', padding: '6px 10px', background: '#f0fdf4', borderRadius: '4px', border: '1px solid #bbf7d0' }}>
          <strong>Follow-up: </strong>{format(new Date(followupDate), 'dd-MMM-yyyy (EEEE)')}
        </div>
      )}

      {/* Doctor signature */}
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '40px' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ borderTop: '1px solid #334155', width: '180px', paddingTop: '4px', fontSize: '12px', fontWeight: 600 }}>
            Dr. {doctorName}
          </div>
          <div style={{ fontSize: '10px', color: '#94a3b8' }}>Signature / Stamp</div>
        </div>
      </div>
    </div>
  );
});
RxContent.displayName = 'RxContent';

export default function PrescriptionPrint(props: Props) {
  const contentRef = useRef<HTMLDivElement>(null);

  const handlePrint = useReactToPrint({
    content: () => contentRef.current,
    documentTitle: `Rx_${props.patientUhid}_${format(new Date(), 'yyyyMMdd')}`,
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={props.onClose} />
      <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-3xl max-h-[90vh] flex flex-col animate-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between px-6 py-3 border-b border-gray-100 shrink-0">
          <div>
            <h3 className="text-base font-semibold text-gray-900">Prescription Preview</h3>
            <p className="text-xs text-gray-500 mt-0.5">{props.patientName} | {props.patientUhid}</p>
          </div>
          <div className="flex items-center gap-2">
            <Button size="sm" className="h-8 gap-1.5" onClick={() => handlePrint()}>
              <Printer className="w-3.5 h-3.5" />
              Print
            </Button>
            <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={props.onClose}>
              <X className="w-4 h-4" />
            </Button>
          </div>
        </div>
        <div className="flex-1 overflow-y-auto p-6 bg-gray-50 flex justify-center">
          <div className="bg-white shadow-lg rounded-lg overflow-hidden">
            <RxContent ref={contentRef} {...props} />
          </div>
        </div>
      </div>
    </div>
  );
}
