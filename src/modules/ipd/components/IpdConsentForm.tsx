import { useRef, useState, useCallback } from 'react';
import { Printer, X } from 'lucide-react';
import { format } from 'date-fns';
import { Button } from '../../../components/ui/button';
import { Checkbox } from '../../../components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../../components/ui/select';
import { ScrollArea } from '../../../components/ui/scroll-area';
import { RadioGroup, RadioGroupItem } from '../../../components/ui/radio-group';
import { Label } from '../../../components/ui/label';
import { Separator } from '../../../components/ui/separator';
import type { Admission } from '../types';

interface Props {
  admission: Admission;
  hospitalName?: string;
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

type ConsentType = 'general' | 'surgery';

interface SectionOption {
  key: string;
  label: string;
  defaultChecked: boolean;
  types: ConsentType[];
}

const SECTION_OPTIONS: SectionOption[] = [
  { key: 'header', label: 'Hospital Header', defaultChecked: true, types: ['general', 'surgery'] },
  { key: 'patient_info', label: 'Patient Details', defaultChecked: true, types: ['general', 'surgery'] },
  { key: 'kin_info', label: 'Next of Kin / Guardian', defaultChecked: true, types: ['general', 'surgery'] },
  { key: 'admission_info', label: 'Admission Details', defaultChecked: true, types: ['general', 'surgery'] },
  { key: 'general_consent', label: 'General Consent Terms', defaultChecked: true, types: ['general'] },
  { key: 'procedure_info', label: 'Procedure / Surgery Info', defaultChecked: true, types: ['surgery'] },
  { key: 'risks', label: 'Risks & Complications', defaultChecked: true, types: ['surgery'] },
  { key: 'anesthesia', label: 'Anesthesia Consent', defaultChecked: true, types: ['surgery'] },
  { key: 'alternatives', label: 'Alternatives Discussed', defaultChecked: false, types: ['surgery'] },
  { key: 'declaration', label: 'Patient Declaration', defaultChecked: true, types: ['general', 'surgery'] },
  { key: 'signatures', label: 'Signature Blocks', defaultChecked: true, types: ['general', 'surgery'] },
  { key: 'witness', label: 'Witness Signature', defaultChecked: false, types: ['general', 'surgery'] },
];

const GENERAL_CONSENT_TERMS = [
  'I authorize the hospital and its medical staff to provide treatment as deemed necessary.',
  'I consent to routine investigations, examinations, and medical procedures as advised by the treating doctor.',
  'I understand that the hospital will maintain confidentiality of my medical records in accordance with applicable laws.',
  'I acknowledge that no guarantee has been made regarding the outcome of my treatment.',
  'I agree to abide by the rules and regulations of the hospital during my stay.',
  'I authorize the hospital to share my medical information with insurance providers or referring physicians as necessary.',
  'I understand that I or my authorized representative may withdraw consent at any time, and I accept responsibility for the consequences of such withdrawal.',
];

export default function IpdConsentForm({ admission, hospitalName, onClose }: Props) {
  const printRef = useRef<HTMLDivElement>(null);
  const [consentType, setConsentType] = useState<ConsentType>('general');
  const [fontSize, setFontSize] = useState('11');
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
    printWindow.document.write(`<!DOCTYPE html><html><head><title>Consent_${admission.patient?.uhid}</title>
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: Arial, sans-serif; }
        @media print { @page { size: A4; margin: 12mm; } }
      </style></head><body>${content}</body></html>`);
    printWindow.document.close();
    setTimeout(() => { printWindow.print(); printWindow.close(); }, 300);
  }, [admission.patient?.uhid]);

  const fs = parseInt(fontSize);
  const hospital = hospitalName || 'Hospital';
  const dateStr = format(new Date(), 'dd-MMM-yyyy');
  const admDateStr = admission.admission_date ? format(new Date(admission.admission_date), 'dd-MMM-yyyy') : '';
  const age = calculateAge(admission.patient?.date_of_birth ?? null);
  const visibleSections = SECTION_OPTIONS.filter((s) => s.types.includes(consentType));

  const labelStyle: React.CSSProperties = { fontWeight: 600, color: '#334155', display: 'inline-block', width: '140px' };
  const valueStyle: React.CSSProperties = { fontWeight: 700, color: '#0f172a' };
  const SectionTitle = ({ children }: { children: string }) => (
    <div style={{
      fontSize: `${fs + 2}px`, fontWeight: 700, color: '#0f172a', marginBottom: '8px',
      textTransform: 'uppercase', letterSpacing: '0.5px', borderBottom: '1px solid #e2e8f0', paddingBottom: '4px',
    }}>
      {children}
    </div>
  );
  const blankLine = (width = '200px'): React.CSSProperties => ({
    borderBottom: '1px dotted #94a3b8', display: 'inline-block', width, minHeight: '18px',
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-background rounded-xl shadow-2xl w-full max-w-5xl max-h-[90vh] flex flex-col animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border shrink-0">
          <div>
            <h3 className="text-base font-semibold text-foreground">
              {consentType === 'general' ? 'Admission Consent Form' : 'Surgery / Procedure Consent Form'}
            </h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              {admission.patient?.full_name} | {admission.patient?.uhid}
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
                  width: '680px',
                  fontSize: `${fs}px`,
                  lineHeight: 1.7,
                  color: '#334155',
                  border: '1px solid #e2e8f0',
                }}
              >
                {/* Hospital Header */}
                {sections.has('header') && (
                  <div style={{ textAlign: 'center', borderBottom: '2px solid #0f172a', paddingBottom: '12px', marginBottom: '16px' }}>
                    <div style={{ fontSize: `${fs + 8}px`, fontWeight: 800, color: '#0f172a', textTransform: 'uppercase', letterSpacing: '1px' }}>
                      {hospital}
                    </div>
                    <div style={{ fontSize: `${fs + 1}px`, fontWeight: 700, color: '#475569', marginTop: '4px' }}>
                      {consentType === 'general' ? 'INFORMED CONSENT FOR ADMISSION & TREATMENT' : 'INFORMED CONSENT FOR SURGERY / PROCEDURE'}
                    </div>
                    <div style={{ fontSize: `${fs - 1}px`, color: '#64748b', marginTop: '2px' }}>Date: {dateStr}</div>
                  </div>
                )}

                {/* Patient Details */}
                {sections.has('patient_info') && (
                  <div style={{ marginBottom: '16px' }}>
                    <SectionTitle>Patient Details</SectionTitle>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4px 16px' }}>
                      <div><span style={labelStyle}>Patient Name:</span> <span style={valueStyle}>{admission.patient?.full_name}</span></div>
                      <div><span style={labelStyle}>UHID:</span> <span style={{ ...valueStyle, fontFamily: 'monospace' }}>{admission.patient?.uhid}</span></div>
                      <div><span style={labelStyle}>Age / Gender:</span> <span style={valueStyle}>{age} / {admission.patient?.gender || ''}</span></div>
                      <div><span style={labelStyle}>Mobile:</span> <span style={valueStyle}>{admission.patient?.phone || '---'}</span></div>
                      {admission.patient?.blood_group && (
                        <div><span style={labelStyle}>Blood Group:</span> <span style={valueStyle}>{admission.patient.blood_group}</span></div>
                      )}
                    </div>
                  </div>
                )}

                {/* Next of Kin */}
                {sections.has('kin_info') && (
                  <div style={{ marginBottom: '16px' }}>
                    <div style={sectionTitle('Next of Kin / Guardian')} />
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4px 16px' }}>
                      <div><span style={labelStyle}>Name:</span> <span style={blankLine('180px')} /></div>
                      <div><span style={labelStyle}>Relationship:</span> <span style={blankLine('150px')} /></div>
                      <div><span style={labelStyle}>Phone:</span> <span style={blankLine('180px')} /></div>
                      <div><span style={labelStyle}>ID Proof No:</span> <span style={blankLine('150px')} /></div>
                    </div>
                  </div>
                )}

                {/* Admission Details */}
                {sections.has('admission_info') && (
                  <div style={{ marginBottom: '16px' }}>
                    <div style={sectionTitle('Admission Details')} />
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4px 16px' }}>
                      <div><span style={labelStyle}>Admission No:</span> <span style={valueStyle}>{admission.admission_number}</span></div>
                      <div><span style={labelStyle}>Admission Date:</span> <span style={valueStyle}>{admDateStr}</span></div>
                      <div><span style={labelStyle}>Ward / Bed:</span> <span style={valueStyle}>{admission.bed?.ward?.name || ''} - {admission.bed?.bed_number || ''}</span></div>
                      <div><span style={labelStyle}>Doctor:</span> <span style={valueStyle}>Dr. {admission.doctor?.full_name || ''}</span></div>
                      {admission.primary_diagnosis && (
                        <div style={{ gridColumn: '1 / -1' }}>
                          <span style={labelStyle}>Diagnosis:</span> <span style={valueStyle}>{admission.primary_diagnosis}</span>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* General Consent Terms */}
                {sections.has('general_consent') && consentType === 'general' && (
                  <div style={{ marginBottom: '16px' }}>
                    <div style={sectionTitle('Terms of Consent')} />
                    <ol style={{ paddingLeft: '20px', margin: 0 }}>
                      {GENERAL_CONSENT_TERMS.map((term, i) => (
                        <li key={i} style={{ marginBottom: '6px', fontSize: `${fs}px` }}>{term}</li>
                      ))}
                    </ol>
                  </div>
                )}

                {/* Procedure / Surgery Info */}
                {sections.has('procedure_info') && consentType === 'surgery' && (
                  <div style={{ marginBottom: '16px' }}>
                    <div style={sectionTitle('Procedure / Surgery Information')} />
                    <div style={{ lineHeight: 2.2 }}>
                      <div><span style={labelStyle}>Procedure Name:</span> <span style={blankLine('300px')} /></div>
                      <div><span style={labelStyle}>Surgeon:</span> <span style={blankLine('300px')} /></div>
                      <div><span style={labelStyle}>Expected Duration:</span> <span style={blankLine('200px')} /></div>
                      <div><span style={labelStyle}>Indication:</span> <span style={blankLine('300px')} /></div>
                    </div>
                  </div>
                )}

                {/* Risks */}
                {sections.has('risks') && consentType === 'surgery' && (
                  <div style={{ marginBottom: '16px' }}>
                    <div style={sectionTitle('Risks & Complications')} />
                    <p style={{ marginBottom: '8px' }}>
                      I have been informed about the following possible risks and complications associated with the proposed procedure:
                    </p>
                    <ul style={{ paddingLeft: '20px', margin: 0 }}>
                      <li>Bleeding, infection, and wound-related complications</li>
                      <li>Adverse reactions to medications or anesthesia</li>
                      <li>Need for additional procedures or extended hospitalization</li>
                      <li>Other procedure-specific risks as explained by the surgeon</li>
                    </ul>
                    <div style={{ marginTop: '8px' }}>
                      <span style={labelStyle}>Additional risks noted:</span>
                      <div style={blankLine('100%')} />
                      <div style={{ ...blankLine('100%'), marginTop: '8px' }} />
                    </div>
                  </div>
                )}

                {/* Anesthesia */}
                {sections.has('anesthesia') && consentType === 'surgery' && (
                  <div style={{ marginBottom: '16px' }}>
                    <div style={sectionTitle('Anesthesia Consent')} />
                    <div style={{ lineHeight: 2.2 }}>
                      <div>
                        <span style={labelStyle}>Type of Anesthesia:</span>{' '}
                        {['General', 'Regional', 'Local', 'Sedation'].map((t) => (
                          <span key={t} style={{ marginRight: '16px' }}>☐ {t}</span>
                        ))}
                      </div>
                      <div><span style={labelStyle}>Anesthesiologist:</span> <span style={blankLine('250px')} /></div>
                    </div>
                    <p style={{ marginTop: '6px' }}>
                      I understand the risks of anesthesia including nausea, allergic reactions, nerve injury, and in rare cases, serious complications. I consent to the administration of anesthesia as deemed appropriate.
                    </p>
                  </div>
                )}

                {/* Alternatives */}
                {sections.has('alternatives') && consentType === 'surgery' && (
                  <div style={{ marginBottom: '16px' }}>
                    <div style={sectionTitle('Alternatives Discussed')} />
                    <p>The following alternative treatment options have been discussed with me:</p>
                    {Array.from({ length: 3 }).map((_, i) => (
                      <div key={i} style={{ borderBottom: '1px dotted #cbd5e1', height: '28px', marginTop: '4px' }} />
                    ))}
                  </div>
                )}

                {/* Declaration */}
                {sections.has('declaration') && (
                  <div style={{ marginBottom: '16px', padding: '12px', background: '#f8fafc', borderRadius: '4px', border: '1px solid #e2e8f0' }}>
                    <div style={sectionTitle('Patient / Guardian Declaration')} />
                    <p>
                      I, the undersigned, hereby declare that I have read and understood the above information. I have been given the opportunity to ask questions, and all my queries have been answered satisfactorily. I voluntarily consent to the {consentType === 'general' ? 'admission and treatment' : 'proposed surgical / medical procedure'} described above.
                    </p>
                  </div>
                )}

                {/* Signatures */}
                {sections.has('signatures') && (
                  <div style={{ marginTop: '32px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', gap: '24px' }}>
                      <div style={{ flex: 1 }}>
                        <div style={{ borderBottom: '1px solid #334155', height: '50px' }} />
                        <div style={{ fontSize: `${fs - 1}px`, color: '#64748b', textAlign: 'center', marginTop: '4px' }}>
                          Patient / Guardian Signature
                        </div>
                        <div style={{ fontSize: `${fs - 1}px`, color: '#94a3b8', textAlign: 'center', marginTop: '2px' }}>
                          Name: ________________________
                        </div>
                        <div style={{ fontSize: `${fs - 1}px`, color: '#94a3b8', textAlign: 'center', marginTop: '2px' }}>
                          Date & Time: __________________
                        </div>
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ borderBottom: '1px solid #334155', height: '50px' }} />
                        <div style={{ fontSize: `${fs - 1}px`, color: '#64748b', textAlign: 'center', marginTop: '4px' }}>
                          Doctor Signature & Seal
                        </div>
                        <div style={{ fontSize: `${fs - 1}px`, color: '#94a3b8', textAlign: 'center', marginTop: '2px' }}>
                          Name: ________________________
                        </div>
                        <div style={{ fontSize: `${fs - 1}px`, color: '#94a3b8', textAlign: 'center', marginTop: '2px' }}>
                          Reg. No: ______________________
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Witness */}
                {sections.has('witness') && (
                  <div style={{ marginTop: '28px', paddingTop: '16px', borderTop: '1px dashed #cbd5e1' }}>
                    <div style={{ fontSize: `${fs - 1}px`, fontWeight: 600, color: '#475569', marginBottom: '8px' }}>WITNESS</div>
                    <div style={{ display: 'flex', gap: '24px' }}>
                      <div style={{ flex: 1 }}>
                        <div style={{ borderBottom: '1px solid #334155', height: '40px' }} />
                        <div style={{ fontSize: `${fs - 1}px`, color: '#64748b', textAlign: 'center', marginTop: '4px' }}>
                          Witness Signature
                        </div>
                        <div style={{ fontSize: `${fs - 1}px`, color: '#94a3b8', textAlign: 'center', marginTop: '2px' }}>
                          Name: ________________________
                        </div>
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: `${fs - 1}px`, color: '#94a3b8', lineHeight: 2.2 }}>
                          <div>Address: <span style={blankLine('220px')} /></div>
                          <div>Phone: <span style={blankLine('220px')} /></div>
                        </div>
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

              {/* Consent Type */}
              <div className="space-y-2">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Consent Type</p>
                <RadioGroup
                  value={consentType}
                  onValueChange={(v) => setConsentType(v as ConsentType)}
                  className="space-y-1"
                >
                  <div className="flex items-center gap-1.5">
                    <RadioGroupItem value="general" id="ct-general" />
                    <Label htmlFor="ct-general" className="text-sm cursor-pointer">General Admission</Label>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <RadioGroupItem value="surgery" id="ct-surgery" />
                    <Label htmlFor="ct-surgery" className="text-sm cursor-pointer">Surgery / Procedure</Label>
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
                    {['9', '10', '11', '12', '13'].map((s) => (
                      <SelectItem key={s} value={s}>{s}px</SelectItem>
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
                {visibleSections.map((section) => (
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
