import { useRef, forwardRef } from 'react';
import { useReactToPrint } from 'react-to-print';
import { Printer, X } from 'lucide-react';
import { format } from 'date-fns';
import { Button } from '../../../components/ui/button';
import type { PrescriptionDrug } from '../../../services/doctor-queue.service';

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
  prescriptionItems: PrescriptionDrug[];
  advice: string;
  followupDate: string;
  onClose: () => void;
}

const RxContent = forwardRef<HTMLDivElement, Omit<Props, 'onClose'>>((props, ref) => {
  const {
    patientName, patientUhid, patientAge, patientGender,
    doctorName, hospitalName, hospitalAddress, hospitalPhone,
    diagnosis, prescriptionItems, advice, followupDate,
  } = props;

  const today = format(new Date(), 'dd-MMM-yyyy');

  return (
    <div ref={ref} className="bg-white" style={{ width: '700px', padding: '32px', fontFamily: 'Arial, sans-serif', color: '#1e293b' }}>
      <div style={{ textAlign: 'center', borderBottom: '2px solid #0f172a', paddingBottom: '12px', marginBottom: '16px' }}>
        <div style={{ fontSize: '22px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '1px' }}>
          {hospitalName}
        </div>
        {hospitalAddress && <div style={{ fontSize: '11px', color: '#64748b', marginTop: '2px' }}>{hospitalAddress}</div>}
        {hospitalPhone && <div style={{ fontSize: '11px', color: '#64748b' }}>Phone: {hospitalPhone}</div>}
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '16px' }}>
        <div style={{ lineHeight: 1.8 }}>
          <div><span style={{ fontWeight: 600, width: '80px', display: 'inline-block' }}>Patient:</span> <strong>{patientName}</strong></div>
          <div><span style={{ fontWeight: 600, width: '80px', display: 'inline-block' }}>UHID:</span> <span style={{ fontFamily: 'monospace' }}>{patientUhid}</span></div>
          {(patientAge || patientGender) && (
            <div><span style={{ fontWeight: 600, width: '80px', display: 'inline-block' }}>Age/Sex:</span> {[patientAge, patientGender].filter(Boolean).join('/')}</div>
          )}
        </div>
        <div style={{ lineHeight: 1.8, textAlign: 'right' }}>
          <div><span style={{ fontWeight: 600 }}>Date:</span> {today}</div>
          <div><span style={{ fontWeight: 600 }}>Doctor:</span> Dr. {doctorName}</div>
        </div>
      </div>

      {diagnosis && (
        <div style={{ fontSize: '12px', marginBottom: '12px', padding: '8px', background: '#f8fafc', borderRadius: '4px', border: '1px solid #e2e8f0' }}>
          <span style={{ fontWeight: 700 }}>Diagnosis: </span>{diagnosis}
        </div>
      )}

      <div style={{ borderTop: '2px solid #0f172a', paddingTop: '12px', marginBottom: '16px' }}>
        <div style={{ fontSize: '22px', fontWeight: 800, fontFamily: 'serif', marginBottom: '12px' }}>Rx</div>
        <table style={{ width: '100%', fontSize: '12px', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid #e2e8f0', textAlign: 'left' }}>
              <th style={{ padding: '6px 0', fontWeight: 600, width: '30px' }}>#</th>
              <th style={{ padding: '6px 0', fontWeight: 600 }}>Medicine</th>
              <th style={{ padding: '6px 0', fontWeight: 600, width: '80px' }}>Dose</th>
              <th style={{ padding: '6px 0', fontWeight: 600, width: '100px' }}>Frequency</th>
              <th style={{ padding: '6px 0', fontWeight: 600, width: '60px' }}>Duration</th>
              <th style={{ padding: '6px 0', fontWeight: 600, width: '120px' }}>Instructions</th>
            </tr>
          </thead>
          <tbody>
            {prescriptionItems.map((item, idx) => (
              <tr key={item.id} style={{ borderBottom: '1px dotted #e2e8f0' }}>
                <td style={{ padding: '8px 0', color: '#64748b' }}>{idx + 1}</td>
                <td style={{ padding: '8px 0', fontWeight: 600 }}>{item.medicine_name}</td>
                <td style={{ padding: '8px 0' }}>{item.dose}</td>
                <td style={{ padding: '8px 0' }}>{item.frequency}</td>
                <td style={{ padding: '8px 0' }}>{item.duration ? `${item.duration} days` : ''}</td>
                <td style={{ padding: '8px 0', color: '#64748b', fontSize: '11px' }}>{item.instructions}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {advice && (
        <div style={{ fontSize: '12px', marginBottom: '12px', borderTop: '1px solid #e2e8f0', paddingTop: '10px' }}>
          <div style={{ fontWeight: 700, marginBottom: '4px' }}>Advice:</div>
          <div style={{ color: '#475569', whiteSpace: 'pre-wrap' }}>{advice}</div>
        </div>
      )}

      {followupDate && (
        <div style={{ fontSize: '12px', marginBottom: '20px', padding: '8px', background: '#f0fdf4', borderRadius: '4px', border: '1px solid #bbf7d0' }}>
          <span style={{ fontWeight: 700 }}>Follow-up: </span>{format(new Date(followupDate), 'dd-MMM-yyyy')}
        </div>
      )}

      <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '48px' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ borderTop: '1px solid #334155', width: '180px', paddingTop: '4px', fontSize: '11px', color: '#64748b' }}>
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
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 shrink-0">
          <div>
            <h3 className="text-base font-semibold text-gray-900">Prescription Preview</h3>
            <p className="text-xs text-gray-500 mt-0.5">{props.patientName} | {props.patientUhid}</p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              className="h-8 gap-1.5 bg-teal-600 hover:bg-teal-700 text-white"
              onClick={() => handlePrint()}
            >
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
