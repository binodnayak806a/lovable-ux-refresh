import { useState, useRef } from 'react';
import { Printer, X, CheckSquare, Square, Tag } from 'lucide-react';
import { format, differenceInDays } from 'date-fns';
import { QRCodeSVG } from 'qrcode.react';
import { Button } from '../../../components/ui/button';
import type { Admission } from '../types';
import { cn } from '../../../lib/utils';

interface Props {
  admissions: Admission[];
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

export default function IpdBulkStickerPrint({ admissions, onClose }: Props) {
  const [selected, setSelected] = useState<Set<string>>(new Set(admissions.map(a => a.id)));
  const printRef = useRef<HTMLDivElement>(null);

  const toggleAll = () => {
    if (selected.size === admissions.length) setSelected(new Set());
    else setSelected(new Set(admissions.map(a => a.id)));
  };

  const toggle = (id: string) => {
    const next = new Set(selected);
    if (next.has(id)) next.delete(id); else next.add(id);
    setSelected(next);
  };

  const handlePrint = () => {
    const content = printRef.current;
    if (!content) return;
    const pw = window.open('', '_blank');
    if (!pw) return;
    pw.document.write(`<!DOCTYPE html><html><head><title>IPD Stickers</title>
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: Arial, sans-serif; }
        .label { width: 300px; padding: 10px 14px; border: 1px solid #ccc; page-break-inside: avoid; margin-bottom: 8px; }
        .label-row { display: flex; align-items: flex-start; gap: 10px; }
        .label-info { flex: 1; }
        .label-name { font-size: 13px; font-weight: 800; margin-bottom: 3px; }
        .label-table { font-size: 9px; border-collapse: collapse; }
        .label-table td { padding: 1px 0; }
        .label-table td:first-child { font-weight: 700; padding-right: 6px; }
        @media print { @page { margin: 5mm; } }
      </style>
    </head><body>${content.innerHTML}</body></html>`);
    pw.document.close();
    pw.focus();
    setTimeout(() => { pw.print(); pw.close(); }, 250);
  };

  const selectedAdmissions = admissions.filter(a => selected.has(a.id));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="bg-background rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col">
        <div className="px-5 py-4 border-b border-border flex items-center justify-between">
          <h2 className="text-sm font-bold flex items-center gap-2">
            <Tag className="w-4 h-4 text-primary" />
            Bulk Label Print ({selected.size} selected)
          </h2>
          <div className="flex items-center gap-2">
            <Button size="sm" variant="outline" onClick={toggleAll} className="gap-1.5 h-8 text-xs">
              {selected.size === admissions.length ? <CheckSquare className="w-3.5 h-3.5" /> : <Square className="w-3.5 h-3.5" />}
              {selected.size === admissions.length ? 'Deselect All' : 'Select All'}
            </Button>
            <Button size="sm" onClick={handlePrint} disabled={selected.size === 0} className="gap-1.5 h-8 text-xs">
              <Printer className="w-3.5 h-3.5" /> Print {selected.size} Labels
            </Button>
            <button onClick={onClose} className="p-2 hover:bg-muted rounded-lg"><X className="w-4 h-4 text-muted-foreground" /></button>
          </div>
        </div>

        <div className="flex-1 overflow-auto p-5">
          <div className="grid grid-cols-2 gap-3">
            {admissions.map(adm => {
              const isSelected = selected.has(adm.id);
              const age = calculateAge(adm.patient?.date_of_birth ?? null);
              return (
                <button key={adm.id} onClick={() => toggle(adm.id)}
                  className={cn('text-left p-3 rounded-xl border-2 transition-all',
                    isSelected ? 'border-primary bg-primary/5' : 'border-border hover:border-muted-foreground/30'
                  )}>
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <div className="text-sm font-bold truncate">{adm.patient?.full_name}</div>
                      <div className="text-xs text-muted-foreground space-y-0.5 mt-1">
                        <div>UHID: {adm.patient?.uhid} | Adm#: {adm.admission_number}</div>
                        <div>{age} / {adm.patient?.gender} | Bed: {adm.bed?.bed_number}</div>
                      </div>
                    </div>
                    {isSelected ? <CheckSquare className="w-5 h-5 text-primary shrink-0" /> : <Square className="w-5 h-5 text-muted-foreground/30 shrink-0" />}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Hidden Print Content */}
        <div style={{ display: 'none' }}>
          <div ref={printRef}>
            {selectedAdmissions.map(adm => {
              const age = calculateAge(adm.patient?.date_of_birth ?? null);
              const days = differenceInDays(new Date(), new Date(adm.admission_date));
              return (
                <div key={adm.id} className="label">
                  <div className="label-row">
                    <div className="label-info">
                      <div className="label-name">{adm.patient?.full_name}</div>
                      <table className="label-table">
                        <tbody>
                          <tr><td>UHID</td><td>{adm.patient?.uhid}</td></tr>
                          <tr><td>Adm#</td><td>{adm.admission_number}</td></tr>
                          <tr><td>Age/Sex</td><td>{age} / {adm.patient?.gender}</td></tr>
                          {adm.patient?.blood_group && <tr><td>Blood</td><td>{adm.patient.blood_group}</td></tr>}
                          <tr><td>Bed</td><td>{adm.bed?.bed_number}</td></tr>
                          <tr><td>Doctor</td><td>Dr. {adm.doctor?.full_name}</td></tr>
                          <tr><td>Admitted</td><td>{format(new Date(adm.admission_date), 'dd-MMM-yyyy')} ({days}d)</td></tr>
                        </tbody>
                      </table>
                    </div>
                    <QRCodeSVG
                      value={`UHID:${adm.patient?.uhid}|ADM:${adm.admission_number}|BED:${adm.bed?.bed_number}`}
                      size={56} level="M"
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
