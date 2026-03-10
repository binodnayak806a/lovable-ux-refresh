import { useRef, useState, useCallback } from 'react';
import { Printer, X } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { format } from 'date-fns';
import { Button } from '../../../components/ui/button';
import { Checkbox } from '../../../components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../../components/ui/select';
import { ScrollArea } from '../../../components/ui/scroll-area';
import { Separator } from '../../../components/ui/separator';
import type { WeekAppointment } from '../../../services/appointments.service';

interface Props {
  appointment: WeekAppointment;
  hospitalName?: string;
  onClose: () => void;
}

interface SectionOption {
  key: string;
  label: string;
  defaultChecked: boolean;
}

const SECTION_OPTIONS: SectionOption[] = [
  { key: 'header', label: 'Hospital Header', defaultChecked: true },
  { key: 'patient_info', label: 'Patient Info', defaultChecked: true },
  { key: 'doctor_info', label: 'Doctor Info', defaultChecked: true },
  { key: 'qrcode', label: 'QR Code', defaultChecked: false },
  { key: 'chief_complaint', label: 'Chief Complaint', defaultChecked: true },
  { key: 'vitals', label: 'Vitals (blank)', defaultChecked: false },
  { key: 'examination', label: 'Examination / Findings', defaultChecked: true },
  { key: 'diagnosis', label: 'Diagnosis', defaultChecked: true },
  { key: 'rx', label: 'Rx / Prescription', defaultChecked: true },
  { key: 'signatures', label: 'Signatures', defaultChecked: true },
];

export default function CasePaperPrint({ appointment, hospitalName, onClose }: Props) {
  const printRef = useRef<HTMLDivElement>(null);
  const [paperSize, setPaperSize] = useState<'A4' | 'A5'>('A4');
  const [fontSize, setFontSize] = useState('12');
  const [blankLines, setBlankLines] = useState('8');
  const [sections, setSections] = useState<Set<string>>(
    () => new Set(SECTION_OPTIONS.filter((s) => s.defaultChecked).map((s) => s.key))
  );

  const toggleSection = useCallback((key: string) => {
    setSections((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }, []);

  const handlePrint = useCallback(() => {
    if (!printRef.current) return;
    const printWindow = window.open('', '_blank', 'width=800,height=600');
    if (!printWindow) return;

    const content = printRef.current.innerHTML;
    const isA5 = paperSize === 'A5';

    printWindow.document.write(`<!DOCTYPE html><html><head><title>CasePaper_${appointment.patient_uhid}</title>
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: Arial, sans-serif; }
        @media print {
          @page { size: ${isA5 ? 'A5' : 'A4'}; margin: 10mm; }
        }
      </style></head><body>${content}</body></html>`);
    printWindow.document.close();
    setTimeout(() => { printWindow.print(); printWindow.close(); }, 300);
  }, [appointment.patient_uhid, paperSize]);

  const fs = parseInt(fontSize);
  const lines = parseInt(blankLines);
  const dateStr = appointment.appointment_date
    ? format(new Date(appointment.appointment_date), 'dd-MMM-yyyy')
    : '';
  const timeStr = appointment.appointment_time?.slice(0, 5) ?? '';
  const qrValue = `UHID:${appointment.patient_uhid}|DATE:${appointment.appointment_date}|TOKEN:${appointment.token_number || ''}`;

  const renderBlankLines = (count: number, height = 24) =>
    Array.from({ length: count }).map((_, i) => (
      <div key={i} style={{ borderBottom: '1px dotted #cbd5e1', height: `${height}px` }} />
    ));

  const sectionHeading = (text: string) => (
    <div style={{ fontSize: `${fs + 1}px`, fontWeight: 700, color: '#0f172a', marginBottom: '8px', textTransform: 'uppercase' as const, letterSpacing: '0.5px' }}>
      {text}
    </div>
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-background rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border shrink-0">
          <div>
            <h3 className="text-base font-semibold text-foreground">OPD Case Paper</h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              {appointment.patient_name} | {appointment.patient_uhid}
            </p>
          </div>
          <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={onClose}>
            <X className="w-4 h-4" />
          </Button>
        </div>

        <div className="flex flex-1 min-h-0">
          {/* Left: Preview */}
          <div className="flex-1 p-6 flex flex-col overflow-hidden">
            <div className="flex-1 bg-muted/30 border border-border rounded-lg p-4 flex items-start justify-center overflow-auto">
              <div
                ref={printRef}
                style={{
                  fontFamily: 'Arial, sans-serif',
                  padding: '32px',
                  background: '#fff',
                  width: paperSize === 'A5' ? '500px' : '680px',
                  border: '1px solid #e2e8f0',
                }}
              >
                {/* Hospital Header */}
                {sections.has('header') && (
                  <div style={{ textAlign: 'center', borderBottom: '2px solid #0f172a', paddingBottom: '12px', marginBottom: '16px' }}>
                    <div style={{ fontSize: `${fs + 8}px`, fontWeight: 800, color: '#0f172a', textTransform: 'uppercase', letterSpacing: '1px' }}>
                      {hospitalName || 'Hospital'}
                    </div>
                    <div style={{ fontSize: `${fs}px`, color: '#64748b', marginTop: '4px' }}>OPD Case Paper</div>
                  </div>
                )}

                {/* Patient Info + QR */}
                {(sections.has('patient_info') || sections.has('qrcode')) && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: `${fs}px`, color: '#334155', marginBottom: '16px' }}>
                    {sections.has('patient_info') && (
                      <>
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
                          <div><span style={{ fontWeight: 600 }}>Date:</span> {dateStr}</div>
                          <div><span style={{ fontWeight: 600 }}>Time:</span> {timeStr}</div>
                          {appointment.token_number && (
                            <div>
                              <span style={{ fontWeight: 600 }}>Token #:</span>{' '}
                              <span style={{ fontWeight: 700, fontSize: `${fs + 2}px` }}>{appointment.token_number}</span>
                            </div>
                          )}
                        </div>
                      </>
                    )}
                    {sections.has('qrcode') && (
                      <div style={{ paddingTop: '2px', flexShrink: 0, marginLeft: sections.has('patient_info') ? '12px' : '0' }}>
                        <QRCodeSVG value={qrValue} size={64} level="M" />
                      </div>
                    )}
                  </div>
                )}

                {/* Doctor Info */}
                {sections.has('doctor_info') && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: `${fs}px`, color: '#334155', marginBottom: '16px', paddingBottom: '12px', borderBottom: '1px solid #e2e8f0' }}>
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
                )}

                {/* Chief Complaint */}
                {sections.has('chief_complaint') && (
                  <div style={{ marginBottom: '20px' }}>
                    {sectionHeading('Chief Complaint')}
                    {appointment.chief_complaint ? (
                      <div style={{ fontSize: `${fs}px`, color: '#334155', padding: '8px', background: '#f8fafc', borderRadius: '4px', border: '1px solid #e2e8f0' }}>
                        {appointment.chief_complaint}
                      </div>
                    ) : (
                      renderBlankLines(3)
                    )}
                  </div>
                )}

                {/* Vitals (blank) */}
                {sections.has('vitals') && (
                  <div style={{ marginBottom: '20px' }}>
                    {sectionHeading('Vitals')}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px', fontSize: `${fs}px` }}>
                      {['BP: ____/____ mmHg', 'Pulse: _______ bpm', 'Temp: _______ °F', 'SpO2: _______ %', 'RR: _______ /min', 'Wt: _______ kg'].map((v, i) => (
                        <div key={i} style={{ padding: '6px 8px', border: '1px solid #e2e8f0', borderRadius: '4px', color: '#64748b' }}>{v}</div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Examination */}
                {sections.has('examination') && (
                  <div style={{ marginBottom: '20px' }}>
                    {sectionHeading('Examination / Findings')}
                    {renderBlankLines(lines)}
                  </div>
                )}

                {/* Diagnosis */}
                {sections.has('diagnosis') && (
                  <div style={{ marginBottom: '20px' }}>
                    {sectionHeading('Diagnosis')}
                    {renderBlankLines(Math.ceil(lines / 2))}
                  </div>
                )}

                {/* Rx */}
                {sections.has('rx') && (
                  <div style={{ borderTop: '2px solid #0f172a', paddingTop: '12px' }}>
                    <div style={{ fontSize: `${fs + 6}px`, fontWeight: 800, color: '#0f172a', marginBottom: '8px', fontFamily: 'serif' }}>
                      Rx
                    </div>
                    <div style={{ paddingLeft: '8px' }}>
                      {renderBlankLines(lines + 2, 28)}
                    </div>
                  </div>
                )}

                {/* Signatures */}
                {sections.has('signatures') && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '40px', fontSize: `${fs - 1}px`, color: '#64748b' }}>
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
                )}
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

              {/* Paper Size */}
              <div className="space-y-2">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Paper Size</p>
                <Select value={paperSize} onValueChange={(v) => setPaperSize(v as 'A4' | 'A5')}>
                  <SelectTrigger className="h-9 w-24 text-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="A4">A4</SelectItem>
                    <SelectItem value="A5">A5</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Font Size */}
              <div className="space-y-2">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Font Size</p>
                <Select value={fontSize} onValueChange={setFontSize}>
                  <SelectTrigger className="h-9 w-24 text-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {['10', '11', '12', '13', '14'].map((s) => (
                      <SelectItem key={s} value={s}>{s}px</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Blank Lines */}
              <div className="space-y-2">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Blank Lines</p>
                <Select value={blankLines} onValueChange={setBlankLines}>
                  <SelectTrigger className="h-9 w-24 text-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {['4', '6', '8', '10', '12'].map((s) => (
                      <SelectItem key={s} value={s}>{s}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <Separator />

            <div className="px-4 pt-3 pb-1">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Sections</p>
            </div>
            <ScrollArea className="flex-1 px-4 pb-4">
              <div className="space-y-1">
                {SECTION_OPTIONS.map((section) => (
                  <label
                    key={section.key}
                    className="flex items-center gap-2.5 py-1.5 px-1 rounded-md hover:bg-muted/50 cursor-pointer transition-colors"
                  >
                    <Checkbox
                      checked={sections.has(section.key)}
                      onCheckedChange={() => toggleSection(section.key)}
                    />
                    <span className="text-sm text-foreground">{section.label}</span>
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
