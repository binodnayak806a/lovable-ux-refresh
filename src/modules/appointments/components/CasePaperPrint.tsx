import { useRef, forwardRef } from 'react';
import { useReactToPrint } from 'react-to-print';
import { Printer, X } from 'lucide-react';
import { format } from 'date-fns';
import { Button } from '../../../components/ui/button';
import type { WeekAppointment } from '../../../services/appointments.service';

interface Props {
  appointment: WeekAppointment;
  hospitalName?: string;
  onClose: () => void;
}

const CasePaperContent = forwardRef<HTMLDivElement, {
  appointment: WeekAppointment;
  hospitalName: string;
}>(({ appointment, hospitalName }, ref) => {
  const dateStr = appointment.appointment_date
    ? format(new Date(appointment.appointment_date), 'dd-MMM-yyyy')
    : '';
  const timeStr = appointment.appointment_time?.slice(0, 5) ?? '';

  const blankLines = Array.from({ length: 8 });
  const rxLines = Array.from({ length: 10 });

  return (
    <div ref={ref} className="bg-white" style={{ width: '700px', padding: '32px', fontFamily: 'Arial, sans-serif' }}>
      <div style={{ textAlign: 'center', borderBottom: '2px solid #0f172a', paddingBottom: '12px', marginBottom: '16px' }}>
        <div style={{ fontSize: '20px', fontWeight: 800, color: '#0f172a', textTransform: 'uppercase', letterSpacing: '1px' }}>
          {hospitalName}
        </div>
        <div style={{ fontSize: '12px', color: '#64748b', marginTop: '4px' }}>OPD Case Paper</div>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: '#334155', marginBottom: '16px' }}>
        <div style={{ lineHeight: 1.8 }}>
          <div>
            <span style={{ fontWeight: 600, width: '100px', display: 'inline-block' }}>Patient Name:</span>{' '}
            <span style={{ fontWeight: 700 }}>{appointment.patient_name}</span>
          </div>
          <div>
            <span style={{ fontWeight: 600, width: '100px', display: 'inline-block' }}>UHID:</span>{' '}
            <span style={{ fontFamily: 'monospace', background: '#f1f5f9', padding: '1px 6px', borderRadius: '3px' }}>
              {appointment.patient_uhid}
            </span>
          </div>
          {appointment.visit_type && (
            <div>
              <span style={{ fontWeight: 600, width: '100px', display: 'inline-block' }}>Visit Type:</span>{' '}
              {appointment.visit_type}
            </div>
          )}
        </div>
        <div style={{ lineHeight: 1.8, textAlign: 'right' }}>
          <div>
            <span style={{ fontWeight: 600 }}>Date:</span> {dateStr}
          </div>
          <div>
            <span style={{ fontWeight: 600 }}>Time:</span> {timeStr}
          </div>
          {appointment.token_number && (
            <div>
              <span style={{ fontWeight: 600 }}>Token #:</span>{' '}
              <span style={{ fontWeight: 700, fontSize: '14px' }}>{appointment.token_number}</span>
            </div>
          )}
        </div>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: '#334155', marginBottom: '16px', paddingBottom: '12px', borderBottom: '1px solid #e2e8f0' }}>
        <div>
          <span style={{ fontWeight: 600 }}>Consulting Doctor:</span>{' '}
          <span style={{ fontWeight: 700 }}>Dr. {appointment.doctor_name}</span>
        </div>
        {appointment.referral_type && appointment.referral_type !== 'none' && (
          <div>
            <span style={{ fontWeight: 600 }}>Referral:</span> {appointment.referral_type}
          </div>
        )}
      </div>

      <div style={{ marginBottom: '20px' }}>
        <div style={{ fontSize: '13px', fontWeight: 700, color: '#0f172a', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
          Chief Complaint
        </div>
        {appointment.chief_complaint ? (
          <div style={{ fontSize: '12px', color: '#334155', padding: '8px', background: '#f8fafc', borderRadius: '4px', border: '1px solid #e2e8f0' }}>
            {appointment.chief_complaint}
          </div>
        ) : (
          <div>
            {blankLines.slice(0, 3).map((_, i) => (
              <div key={i} style={{ borderBottom: '1px dotted #cbd5e1', height: '24px' }} />
            ))}
          </div>
        )}
      </div>

      <div style={{ marginBottom: '20px' }}>
        <div style={{ fontSize: '13px', fontWeight: 700, color: '#0f172a', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
          Examination / Findings
        </div>
        {blankLines.map((_, i) => (
          <div key={i} style={{ borderBottom: '1px dotted #cbd5e1', height: '24px' }} />
        ))}
      </div>

      <div style={{ marginBottom: '20px' }}>
        <div style={{ fontSize: '13px', fontWeight: 700, color: '#0f172a', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
          Diagnosis
        </div>
        {blankLines.slice(0, 4).map((_, i) => (
          <div key={i} style={{ borderBottom: '1px dotted #cbd5e1', height: '24px' }} />
        ))}
      </div>

      <div style={{ borderTop: '2px solid #0f172a', paddingTop: '12px' }}>
        <div style={{ fontSize: '18px', fontWeight: 800, color: '#0f172a', marginBottom: '8px', fontFamily: 'serif' }}>
          Rx
        </div>
        <div style={{ paddingLeft: '8px' }}>
          {rxLines.map((_, i) => (
            <div key={i} style={{ borderBottom: '1px dotted #cbd5e1', height: '28px' }} />
          ))}
        </div>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '40px', fontSize: '11px', color: '#64748b' }}>
        <div>
          <div style={{ borderTop: '1px solid #334155', width: '150px', paddingTop: '4px', textAlign: 'center' }}>
            Patient Signature
          </div>
        </div>
        <div>
          <div style={{ borderTop: '1px solid #334155', width: '150px', paddingTop: '4px', textAlign: 'center' }}>
            Doctor Signature
          </div>
        </div>
      </div>
    </div>
  );
});
CasePaperContent.displayName = 'CasePaperContent';

export default function CasePaperPrint({ appointment, hospitalName, onClose }: Props) {
  const contentRef = useRef<HTMLDivElement>(null);

  const handlePrint = useReactToPrint({
    content: () => contentRef.current,
    documentTitle: `CasePaper_${appointment.patient_uhid}_${appointment.appointment_date}`,
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-3xl max-h-[90vh] flex flex-col animate-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 shrink-0">
          <div>
            <h3 className="text-base font-semibold text-gray-900">OPD Case Paper</h3>
            <p className="text-xs text-gray-500 mt-0.5">
              {appointment.patient_name} | {appointment.patient_uhid}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              className="h-8 gap-1.5 bg-blue-600 hover:bg-blue-700 text-white"
              onClick={() => handlePrint()}
            >
              <Printer className="w-3.5 h-3.5" />
              Print
            </Button>
            <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={onClose}>
              <X className="w-4 h-4" />
            </Button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-6 bg-gray-50 flex justify-center">
          <div className="bg-white shadow-lg rounded-lg overflow-hidden">
            <CasePaperContent
              ref={contentRef}
              appointment={appointment}
              hospitalName={hospitalName ?? 'Hospital'}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
