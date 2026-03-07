import { useRef, forwardRef } from 'react';
import { useReactToPrint } from 'react-to-print';
import { QRCodeSVG } from 'qrcode.react';
import { Printer, X } from 'lucide-react';
import { Button } from '../../../components/ui/button';

interface PatientInfo {
  full_name: string;
  uhid: string;
  age?: number;
  gender?: string;
  phone: string;
  blood_group?: string | null;
}

interface Props {
  patient: PatientInfo;
  onClose: () => void;
  stickerSize: 'thermal' | 'a4';
  onSizeChange: (size: 'thermal' | 'a4') => void;
}

const StickerContent = forwardRef<HTMLDivElement, { patient: PatientInfo; size: 'thermal' | 'a4' }>(
  ({ patient, size }, ref) => {
    const isThermal = size === 'thermal';

    return (
      <div ref={ref} className="bg-white" style={{ padding: isThermal ? '8px' : '16px' }}>
        <div
          style={{
            width: isThermal ? '280px' : '350px',
            border: '1.5px solid #1e293b',
            borderRadius: '6px',
            padding: isThermal ? '10px' : '16px',
            fontFamily: 'Arial, sans-serif',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: isThermal ? '8px' : '12px' }}>
            <div style={{ flex: 1 }}>
              <div style={{
                fontSize: isThermal ? '14px' : '18px',
                fontWeight: 700,
                color: '#0f172a',
                marginBottom: '4px',
                lineHeight: 1.2,
              }}>
                {patient.full_name}
              </div>

              <div style={{
                fontSize: isThermal ? '11px' : '13px',
                color: '#334155',
                fontFamily: 'monospace',
                fontWeight: 600,
                marginBottom: '6px',
                background: '#f1f5f9',
                padding: '2px 6px',
                borderRadius: '3px',
                display: 'inline-block',
              }}>
                {patient.uhid}
              </div>

              <div style={{ fontSize: isThermal ? '10px' : '12px', color: '#475569', lineHeight: 1.6 }}>
                {patient.age != null && patient.gender && (
                  <div>
                    <span style={{ fontWeight: 600 }}>Age/Gender:</span>{' '}
                    {patient.age}y / {patient.gender.charAt(0).toUpperCase() + patient.gender.slice(1)}
                  </div>
                )}
                {patient.phone && (
                  <div>
                    <span style={{ fontWeight: 600 }}>Mobile:</span> {patient.phone}
                  </div>
                )}
                {patient.blood_group && (
                  <div>
                    <span style={{ fontWeight: 600 }}>Blood Group:</span>{' '}
                    <span style={{ color: '#dc2626', fontWeight: 700 }}>{patient.blood_group}</span>
                  </div>
                )}
              </div>
            </div>

            <div style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '2px',
            }}>
              <QRCodeSVG
                value={patient.uhid}
                size={isThermal ? 56 : 72}
                level="M"
                bgColor="#ffffff"
                fgColor="#0f172a"
              />
              <span style={{ fontSize: '8px', color: '#94a3b8' }}>Scan UHID</span>
            </div>
          </div>
        </div>
      </div>
    );
  }
);

StickerContent.displayName = 'StickerContent';

export default function PatientStickerPrint({ patient, onClose, stickerSize, onSizeChange }: Props) {
  const contentRef = useRef<HTMLDivElement>(null);

  const handlePrint = useReactToPrint({
    content: () => contentRef.current,
    documentTitle: `Sticker_${patient.uhid}`,
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-md p-6 animate-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-base font-semibold text-gray-900">Print Patient Sticker</h3>
          <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={onClose}>
            <X className="w-4 h-4" />
          </Button>
        </div>

        <div className="flex items-center gap-2 mb-4">
          <span className="text-xs text-gray-500">Size:</span>
          <button
            onClick={() => onSizeChange('thermal')}
            className={`text-xs px-3 py-1.5 rounded-md border transition-colors ${
              stickerSize === 'thermal'
                ? 'bg-blue-50 border-blue-200 text-blue-700 font-medium'
                : 'border-gray-200 text-gray-500 hover:bg-gray-50'
            }`}
          >
            Thermal
          </button>
          <button
            onClick={() => onSizeChange('a4')}
            className={`text-xs px-3 py-1.5 rounded-md border transition-colors ${
              stickerSize === 'a4'
                ? 'bg-blue-50 border-blue-200 text-blue-700 font-medium'
                : 'border-gray-200 text-gray-500 hover:bg-gray-50'
            }`}
          >
            A4
          </button>
        </div>

        <div className="bg-gray-50 rounded-lg p-4 flex items-center justify-center mb-4 border border-gray-100">
          <StickerContent ref={contentRef} patient={patient} size={stickerSize} />
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" className="flex-1 text-sm" onClick={onClose}>
            Cancel
          </Button>
          <Button className="flex-1 text-sm gap-1.5 bg-blue-600 hover:bg-blue-700" onClick={() => handlePrint()}>
            <Printer className="w-4 h-4" />
            Print Sticker
          </Button>
        </div>
      </div>
    </div>
  );
}
