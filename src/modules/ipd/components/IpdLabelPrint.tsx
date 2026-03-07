import { useRef } from 'react';
import { X, Printer, Tag } from 'lucide-react';
import { format, differenceInDays } from 'date-fns';
import { useReactToPrint } from 'react-to-print';
import { QRCodeSVG } from 'qrcode.react';
import { Button } from '../../../components/ui/button';
import type { Admission } from '../types';

interface Props {
  admission: Admission;
  onClose: () => void;
}

function calculateAge(dob: string | null): string {
  if (!dob) return '-';
  const birth = new Date(dob);
  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  const m = today.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
  return `${age}Y`;
}

export default function IpdLabelPrint({ admission, onClose }: Props) {
  const labelRef = useRef<HTMLDivElement>(null);
  const handlePrint = useReactToPrint({ content: () => labelRef.current });

  const daysAdmitted = differenceInDays(new Date(), new Date(admission.admission_date));
  const age = calculateAge(admission.patient?.date_of_birth ?? null);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
          <h2 className="text-sm font-bold text-gray-900 flex items-center gap-2">
            <Tag className="w-4 h-4 text-blue-600" />
            Patient Label
          </h2>
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              onClick={() => handlePrint()}
              className="gap-1.5 h-8 text-xs bg-blue-600 hover:bg-blue-700"
            >
              <Printer className="w-3.5 h-3.5" />
              Print Label
            </Button>
            <button
              type="button"
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X className="w-4 h-4 text-gray-400" />
            </button>
          </div>
        </div>

        <div className="p-6">
          <div className="border-2 border-dashed border-gray-300 rounded-xl p-4 bg-gray-50">
            <div className="flex items-start gap-3">
              <div className="flex-1 space-y-1.5">
                <div className="text-lg font-bold text-gray-900">
                  {admission.patient?.full_name}
                </div>
                <div className="text-xs text-gray-600 space-y-0.5">
                  <div className="flex gap-3">
                    <span className="font-semibold">UHID:</span>
                    <span>{admission.patient?.uhid}</span>
                  </div>
                  <div className="flex gap-3">
                    <span className="font-semibold">Adm#:</span>
                    <span>{admission.admission_number}</span>
                  </div>
                  <div className="flex gap-3">
                    <span className="font-semibold">Age/Sex:</span>
                    <span>{age} / {admission.patient?.gender}</span>
                  </div>
                  {admission.patient?.blood_group && (
                    <div className="flex gap-3">
                      <span className="font-semibold">Blood:</span>
                      <span>{admission.patient.blood_group}</span>
                    </div>
                  )}
                  <div className="flex gap-3">
                    <span className="font-semibold">Bed:</span>
                    <span>{admission.bed?.bed_number}</span>
                  </div>
                  <div className="flex gap-3">
                    <span className="font-semibold">Doctor:</span>
                    <span>Dr. {admission.doctor?.full_name}</span>
                  </div>
                  <div className="flex gap-3">
                    <span className="font-semibold">Date:</span>
                    <span>
                      {format(new Date(admission.admission_date), 'dd-MMM-yyyy')}
                      {' '}({daysAdmitted}d)
                    </span>
                  </div>
                </div>
              </div>
              <QRCodeSVG
                value={`UHID:${admission.patient?.uhid}|ADM:${admission.admission_number}|BED:${admission.bed?.bed_number}`}
                size={72}
                level="M"
              />
            </div>
          </div>
        </div>

        <div style={{ display: 'none' }}>
          <div ref={labelRef}>
            <div style={{
              width: '300px',
              padding: '12px 16px',
              fontFamily: 'Arial, sans-serif',
              fontSize: '10px',
              border: '1px solid #ccc',
            }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: '14px', fontWeight: 800, marginBottom: '4px' }}>
                    {admission.patient?.full_name}
                  </div>
                  <table style={{ fontSize: '9px', borderCollapse: 'collapse' }}>
                    <tbody>
                      <tr>
                        <td style={{ fontWeight: 700, paddingRight: '6px', paddingBottom: '1px' }}>UHID</td>
                        <td style={{ paddingBottom: '1px' }}>{admission.patient?.uhid}</td>
                      </tr>
                      <tr>
                        <td style={{ fontWeight: 700, paddingRight: '6px', paddingBottom: '1px' }}>Adm#</td>
                        <td style={{ paddingBottom: '1px' }}>{admission.admission_number}</td>
                      </tr>
                      <tr>
                        <td style={{ fontWeight: 700, paddingRight: '6px', paddingBottom: '1px' }}>Age/Sex</td>
                        <td style={{ paddingBottom: '1px' }}>{age} / {admission.patient?.gender}</td>
                      </tr>
                      {admission.patient?.blood_group && (
                        <tr>
                          <td style={{ fontWeight: 700, paddingRight: '6px', paddingBottom: '1px' }}>Blood</td>
                          <td style={{ paddingBottom: '1px' }}>{admission.patient.blood_group}</td>
                        </tr>
                      )}
                      <tr>
                        <td style={{ fontWeight: 700, paddingRight: '6px', paddingBottom: '1px' }}>Bed</td>
                        <td style={{ paddingBottom: '1px' }}>{admission.bed?.bed_number}</td>
                      </tr>
                      <tr>
                        <td style={{ fontWeight: 700, paddingRight: '6px', paddingBottom: '1px' }}>Doctor</td>
                        <td style={{ paddingBottom: '1px' }}>Dr. {admission.doctor?.full_name}</td>
                      </tr>
                      <tr>
                        <td style={{ fontWeight: 700, paddingRight: '6px' }}>Admitted</td>
                        <td>{format(new Date(admission.admission_date), 'dd-MMM-yyyy')}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
                <div style={{ paddingTop: '2px' }}>
                  <QRCodeSVG
                    value={`UHID:${admission.patient?.uhid}|ADM:${admission.admission_number}|BED:${admission.bed?.bed_number}`}
                    size={56}
                    level="M"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
