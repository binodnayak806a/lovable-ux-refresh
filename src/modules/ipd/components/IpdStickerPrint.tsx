import { useRef, useState, useCallback } from 'react';
import { Printer, X } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { format, differenceInDays } from 'date-fns';
import { Button } from '../../../components/ui/button';
import { Checkbox } from '../../../components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../../components/ui/select';
import { ScrollArea } from '../../../components/ui/scroll-area';
import { Label } from '../../../components/ui/label';
import { RadioGroup, RadioGroupItem } from '../../../components/ui/radio-group';
import { Separator } from '../../../components/ui/separator';
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

interface FieldOption {
  key: string;
  label: string;
  getValue: (a: Admission) => string;
  defaultChecked: boolean;
}

const FIELD_OPTIONS: FieldOption[] = [
  { key: 'uhid', label: 'UHID', getValue: (a) => a.patient?.uhid || '', defaultChecked: true },
  { key: 'name', label: 'Patient Name', getValue: (a) => a.patient?.full_name || '', defaultChecked: true },
  { key: 'age_gender', label: 'Age / Gender', getValue: (a) => `${calculateAge(a.patient?.date_of_birth ?? null)} / ${a.patient?.gender || ''}`, defaultChecked: true },
  { key: 'mobile', label: 'Mobile No', getValue: (a) => a.patient?.phone ? `+91 ${a.patient.phone}` : '', defaultChecked: true },
  { key: 'blood_group', label: 'Blood Group', getValue: (a) => a.patient?.blood_group || '', defaultChecked: false },
  { key: 'admission_no', label: 'Admission No', getValue: (a) => a.admission_number || '', defaultChecked: true },
  { key: 'ward_bed', label: 'Ward / Bed', getValue: (a) => `${a.bed?.ward?.name || ''} - ${a.bed?.bed_number || ''}`, defaultChecked: true },
  { key: 'doctor', label: 'Doctor', getValue: (a) => a.doctor?.full_name ? `Dr. ${a.doctor.full_name}` : '', defaultChecked: true },
  { key: 'adm_date', label: 'Admission Date', getValue: (a) => a.admission_date ? format(new Date(a.admission_date), 'dd-MMM-yyyy') : '', defaultChecked: true },
  { key: 'stay_duration', label: 'Stay Duration', getValue: (a) => `${differenceInDays(new Date(), new Date(a.admission_date))} days`, defaultChecked: true },
  { key: 'diagnosis', label: 'Diagnosis', getValue: (a) => a.primary_diagnosis || '', defaultChecked: false },
  { key: 'address', label: 'Address', getValue: (a) => (a.patient as any)?.address || '', defaultChecked: false },
  { key: 'guardian', label: 'Guardian', getValue: (a) => (a.patient as any)?.guardian_name || '', defaultChecked: false },
  { key: 'qrcode', label: 'QR Code', getValue: () => '', defaultChecked: true },
];

export default function IpdStickerPrint({ admission, onClose }: Props) {
  const printRef = useRef<HTMLDivElement>(null);
  const [printerType, setPrinterType] = useState<'sticker' | 'general'>('sticker');
  const [fontSize, setFontSize] = useState('9');
  const [selectedFields, setSelectedFields] = useState<Set<string>>(
    () => new Set(FIELD_OPTIONS.filter((f) => f.defaultChecked).map((f) => f.key))
  );

  const toggleField = useCallback((key: string) => {
    setSelectedFields((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }, []);

  const handlePrint = useCallback(() => {
    if (!printRef.current) return;
    const printWindow = window.open('', '_blank', 'width=600,height=400');
    if (!printWindow) return;

    const content = printRef.current.innerHTML;
    const isSticker = printerType === 'sticker';

    printWindow.document.write(`<!DOCTYPE html><html><head><title>IPD Label - ${admission.patient?.uhid}</title>
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: Arial, sans-serif; }
        @media print {
          @page { size: ${isSticker ? '80mm 50mm' : 'A4'}; margin: ${isSticker ? '2mm' : '10mm'}; }
        }
      </style></head><body>${content}</body></html>`);
    printWindow.document.close();
    setTimeout(() => { printWindow.print(); printWindow.close(); }, 300);
  }, [admission.patient?.uhid, printerType]);

  const fs = parseInt(fontSize);
  const qrValue = `UHID:${admission.patient?.uhid}|ADM:${admission.admission_number}|BED:${admission.bed?.bed_number}`;

  // Build label lines
  const buildLines = () => {
    const lines: { label: string; value: string }[] = [];
    const nameField = FIELD_OPTIONS.find(f => f.key === 'name')!;
    const fullName = selectedFields.has('name') ? nameField.getValue(admission).toUpperCase() : '';

    for (const field of FIELD_OPTIONS) {
      if (field.key === 'name' || field.key === 'qrcode') continue;
      if (!selectedFields.has(field.key)) continue;
      const value = field.getValue(admission);
      if (!value || value === ' / ' || value === ' - ') continue;
      lines.push({ label: field.label, value });
    }

    return { fullName, lines };
  };

  const { fullName, lines } = buildLines();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-background rounded-xl shadow-2xl w-full max-w-3xl max-h-[90vh] flex flex-col animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <h3 className="text-lg font-bold text-foreground">IPD Patient Label</h3>
          <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={onClose}>
            <X className="w-4 h-4" />
          </Button>
        </div>

        <div className="flex flex-1 min-h-0">
          {/* Left: Preview */}
          <div className="flex-1 p-6 flex flex-col">
            <div className="flex-1 bg-muted/30 border border-border rounded-lg p-6 flex items-start justify-center overflow-auto">
              <div
                ref={printRef}
                style={{
                  fontFamily: 'Arial, sans-serif',
                  padding: printerType === 'sticker' ? '8px' : '16px',
                  background: '#fff',
                  minWidth: printerType === 'sticker' ? '280px' : '350px',
                  maxWidth: '400px',
                  border: '1px solid #e2e8f0',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
                  <div style={{ flex: 1 }}>
                    {fullName && (
                      <div style={{ fontSize: `${fs + 5}px`, fontWeight: 800, marginBottom: '4px', lineHeight: 1.2 }}>
                        {fullName}
                      </div>
                    )}
                    {lines.map((line, i) => (
                      <div key={i} style={{ fontSize: `${fs}px`, lineHeight: 1.6 }}>
                        <span style={{ fontWeight: 600 }}>{line.label}</span>
                        {' :: '}
                        {line.value}
                      </div>
                    ))}
                  </div>
                  {selectedFields.has('qrcode') && (
                    <div style={{ paddingTop: '2px', flexShrink: 0 }}>
                      <QRCodeSVG value={qrValue} size={printerType === 'sticker' ? 56 : 72} level="M" />
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Right: Controls */}
          <div className="w-72 border-l border-border flex flex-col">
            <div className="p-4 space-y-4">
              <Button className="w-full gap-1.5 bg-primary hover:bg-primary/90 text-primary-foreground" onClick={handlePrint}>
                <Printer className="w-4 h-4" />
                Print
              </Button>

              {/* Printer Type */}
              <div className="space-y-2">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Printer Type</p>
                <RadioGroup
                  value={printerType}
                  onValueChange={(v) => setPrinterType(v as 'sticker' | 'general')}
                  className="flex gap-4"
                >
                  <div className="flex items-center gap-1.5">
                    <RadioGroupItem value="sticker" id="ipd-pr-sticker" />
                    <Label htmlFor="ipd-pr-sticker" className="text-sm cursor-pointer">Sticker</Label>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <RadioGroupItem value="general" id="ipd-pr-general" />
                    <Label htmlFor="ipd-pr-general" className="text-sm cursor-pointer">General</Label>
                  </div>
                </RadioGroup>
              </div>

              {/* Font Size */}
              <div className="space-y-2">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Font Size</p>
                <Select value={fontSize} onValueChange={setFontSize}>
                  <SelectTrigger className="h-9 w-24 text-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {['7', '8', '9', '10', '11', '12'].map((s) => (
                      <SelectItem key={s} value={s}>{s}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <Separator />

            <div className="px-4 pt-3 pb-1">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Select Fields</p>
            </div>
            <ScrollArea className="flex-1 px-4 pb-4">
              <div className="space-y-1">
                {FIELD_OPTIONS.map((field) => (
                  <label
                    key={field.key}
                    className="flex items-center gap-2.5 py-1.5 px-1 rounded-md hover:bg-muted/50 cursor-pointer transition-colors"
                  >
                    <Checkbox
                      checked={selectedFields.has(field.key)}
                      onCheckedChange={() => toggleField(field.key)}
                    />
                    <span className="text-sm text-foreground">{field.label}</span>
                  </label>
                ))}
              </div>
            </ScrollArea>
          </div>
        </div>
      </div>
    </div>
  );
}
