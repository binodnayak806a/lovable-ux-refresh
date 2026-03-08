import { useRef, useState, useCallback } from 'react';
import { Printer, X } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { Button } from '../../../components/ui/button';
import { Checkbox } from '../../../components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../../components/ui/select';
import { ScrollArea } from '../../../components/ui/scroll-area';
import { Label } from '../../../components/ui/label';
import { RadioGroup, RadioGroupItem } from '../../../components/ui/radio-group';
import { Separator } from '../../../components/ui/separator';

interface PatientInfo {
  full_name: string;
  uhid: string;
  age?: number;
  gender?: string;
  phone: string;
  blood_group?: string | null;
  address?: string;
  doctor_name?: string;
  guardian_name?: string;
  date_of_birth?: string;
  appointment_no?: string;
  mediclaim?: string;
}

interface Props {
  patient: PatientInfo;
  onClose: () => void;
  stickerSize: 'thermal' | 'a4';
  onSizeChange: (size: 'thermal' | 'a4') => void;
}

interface FieldOption {
  key: string;
  label: string;
  getValue: (p: PatientInfo) => string;
  defaultChecked: boolean;
}

const FIELD_OPTIONS: FieldOption[] = [
  { key: 'uhid', label: 'UHID', getValue: (p) => p.uhid, defaultChecked: true },
  { key: 'first_name', label: 'First Name', getValue: (p) => p.full_name.split(' ')[0] || '', defaultChecked: true },
  { key: 'middle_name', label: 'Middle Name', getValue: (p) => p.full_name.split(' ').length > 2 ? p.full_name.split(' ')[1] : '', defaultChecked: true },
  { key: 'last_name', label: 'Last Name', getValue: (p) => { const parts = p.full_name.split(' '); return parts.length > 1 ? parts[parts.length - 1] : ''; }, defaultChecked: true },
  { key: 'age', label: 'Age', getValue: (p) => p.age != null ? `${p.age}` : '', defaultChecked: true },
  { key: 'gender', label: 'Gender', getValue: (p) => p.gender ? p.gender.charAt(0).toUpperCase() + p.gender.slice(1) : '', defaultChecked: true },
  { key: 'mobile', label: 'Mobile No', getValue: (p) => p.phone ? `+91 ${p.phone}` : '', defaultChecked: true },
  { key: 'address', label: 'Address', getValue: (p) => p.address || '', defaultChecked: true },
  { key: 'doctor', label: 'Doctor Name', getValue: (p) => p.doctor_name ? `Dr. ${p.doctor_name}` : '', defaultChecked: true },
  { key: 'appointment_no', label: 'Appointment No.', getValue: (p) => p.appointment_no || '', defaultChecked: false },
  { key: 'barcode', label: 'Bar Code', getValue: () => '', defaultChecked: false },
  { key: 'dob', label: 'Date Of Birth', getValue: (p) => p.date_of_birth ? new Date(p.date_of_birth).toLocaleDateString('en-IN') : '', defaultChecked: false },
  { key: 'guardian', label: 'Guardian', getValue: (p) => p.guardian_name || '', defaultChecked: false },
  { key: 'mediclaim', label: 'Mediclaim', getValue: (p) => p.mediclaim || '', defaultChecked: false },
  { key: 'blood_group', label: 'Blood Group', getValue: (p) => p.blood_group || '', defaultChecked: false },
];

export default function PatientStickerPrint({ patient, onClose }: Props) {
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

    printWindow.document.write(`<!DOCTYPE html><html><head><title>Print Label - ${patient.uhid}</title>
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: Arial, sans-serif; }
        @media print {
          @page { size: ${isSticker ? '80mm 50mm' : 'A4'}; margin: ${isSticker ? '2mm' : '10mm'}; }
        }
      </style></head><body>${content}</body></html>`);
    printWindow.document.close();
    setTimeout(() => { printWindow.print(); printWindow.close(); }, 300);
  }, [patient.uhid, printerType]);

  // Build label lines from selected fields
  const buildLabelContent = () => {
    const fs = parseInt(fontSize);
    const lines: { label: string; value: string }[] = [];

    // Name line (combine first/middle/last)
    const nameParts: string[] = [];
    if (selectedFields.has('first_name')) nameParts.push(FIELD_OPTIONS.find(f => f.key === 'first_name')!.getValue(patient));
    if (selectedFields.has('middle_name')) { const v = FIELD_OPTIONS.find(f => f.key === 'middle_name')!.getValue(patient); if (v) nameParts.push(v); }
    if (selectedFields.has('last_name')) { const v = FIELD_OPTIONS.find(f => f.key === 'last_name')!.getValue(patient); if (v) nameParts.push(v); }
    const fullName = nameParts.filter(Boolean).join(' ').toUpperCase();

    if (selectedFields.has('uhid')) {
      lines.push({ label: 'UHID', value: patient.uhid });
    }

    // Age / Gender line
    const ageParts: string[] = [];
    if (selectedFields.has('age')) ageParts.push(patient.age != null ? `${patient.age} ${patient.age === 0 ? 'DAY' : 'YRS'}` : '');
    if (selectedFields.has('gender')) ageParts.push((patient.gender || '').toUpperCase());
    if (ageParts.filter(Boolean).length > 0) {
      lines.push({ label: '', value: ageParts.filter(Boolean).join(' / ') });
    }

    if (selectedFields.has('mobile') && patient.phone) {
      lines.push({ label: '', value: `+91 ${patient.phone}` });
    }
    if (selectedFields.has('address') && patient.address) {
      lines.push({ label: '', value: patient.address });
    }
    if (selectedFields.has('doctor') && patient.doctor_name) {
      lines.push({ label: '', value: `DR. ${patient.doctor_name.toUpperCase()}` });
    }
    if (selectedFields.has('blood_group') && patient.blood_group) {
      lines.push({ label: 'Blood', value: patient.blood_group });
    }
    if (selectedFields.has('dob') && patient.date_of_birth) {
      lines.push({ label: 'DOB', value: new Date(patient.date_of_birth).toLocaleDateString('en-IN') });
    }
    if (selectedFields.has('guardian') && patient.guardian_name) {
      lines.push({ label: 'Guardian', value: patient.guardian_name });
    }
    if (selectedFields.has('appointment_no') && patient.appointment_no) {
      lines.push({ label: 'Appt#', value: patient.appointment_no });
    }
    if (selectedFields.has('mediclaim') && patient.mediclaim) {
      lines.push({ label: 'Mediclaim', value: patient.mediclaim });
    }

    return { fullName, lines, fs };
  };

  const { fullName, lines, fs } = buildLabelContent();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-background rounded-xl shadow-2xl w-full max-w-3xl max-h-[90vh] flex flex-col animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <h3 className="text-lg font-bold text-foreground">Print Label</h3>
          <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={onClose}>
            <X className="w-4 h-4" />
          </Button>
        </div>

        <div className="flex flex-1 min-h-0">
          {/* Left: Preview */}
          <div className="flex-1 p-6 flex flex-col">
            <div className="flex-1 bg-muted/30 border border-border rounded-lg p-6 flex items-start justify-center overflow-auto">
              {/* Live preview */}
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
                {fullName && (
                  <div style={{ fontSize: `${fs + 5}px`, fontWeight: 800, marginBottom: '4px', lineHeight: 1.2 }}>
                    {fullName}
                  </div>
                )}
                {lines.map((line, i) => (
                  <div key={i} style={{ fontSize: `${fs}px`, lineHeight: 1.6, fontWeight: line.label === 'UHID' ? 600 : 400 }}>
                    {line.label ? (
                      <span>
                        <span style={{ fontWeight: 600 }}>{line.label}</span>
                        {' :: '}
                        {line.value}
                      </span>
                    ) : (
                      line.value
                    )}
                  </div>
                ))}
                {selectedFields.has('barcode') && (
                  <div style={{ marginTop: '6px' }}>
                    <QRCodeSVG value={patient.uhid} size={48} level="M" />
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Right: Controls */}
          <div className="w-72 border-l border-border flex flex-col">
            <div className="p-4 space-y-4">
              {/* Print button */}
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
                    <RadioGroupItem value="sticker" id="pr-sticker" />
                    <Label htmlFor="pr-sticker" className="text-sm cursor-pointer">Sticker</Label>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <RadioGroupItem value="general" id="pr-general" />
                    <Label htmlFor="pr-general" className="text-sm cursor-pointer">General</Label>
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
                    {['7', '8', '9', '10', '11', '12', '14'].map((s) => (
                      <SelectItem key={s} value={s}>{s}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <Separator />

            {/* Field selection */}
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
