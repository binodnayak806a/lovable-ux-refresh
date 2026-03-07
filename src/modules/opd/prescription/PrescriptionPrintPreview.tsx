import { useRef } from 'react';
import { Printer, X } from 'lucide-react';
import { Button } from '../../../components/ui/button';
import type { PrescriptionItem, PrescriptionFormData, PrescriptionRecord } from './types';
import { DOSAGE_FORMS } from './types';

interface PatientInfo {
  id: string;
  uhid: string;
  full_name: string;
  gender: string;
  date_of_birth: string | null;
}

interface Props {
  prescription: PrescriptionRecord;
  patient: PatientInfo;
  items: PrescriptionItem[];
  form: PrescriptionFormData;
  onClose: () => void;
}

function calculateAge(dob: string | null): string {
  if (!dob) return '-';
  const birth = new Date(dob);
  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  const m = today.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
  return `${age} yrs`;
}

function formatDate(dateStr: string | null): string {
  if (!dateStr) return '-';
  return new Date(dateStr).toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

function getFormLabel(form: string): string {
  const found = DOSAGE_FORMS.find((f) => f.value === form);
  return found ? found.label : form;
}

export default function PrescriptionPrintPreview({ prescription, patient, items, form, onClose }: Props) {
  const printRef = useRef<HTMLDivElement>(null);

  const handlePrint = () => {
    const content = printRef.current;
    if (!content) return;

    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Prescription - ${prescription.prescription_number}</title>
          <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body { font-family: 'Segoe UI', Arial, sans-serif; font-size: 12px; color: #1a1a1a; padding: 20px; }
            .header { text-align: center; border-bottom: 2px solid #0066cc; padding-bottom: 15px; margin-bottom: 15px; }
            .hospital-name { font-size: 20px; font-weight: 700; color: #0066cc; margin-bottom: 4px; }
            .hospital-info { font-size: 11px; color: #666; }
            .rx-symbol { font-size: 28px; font-weight: bold; color: #0066cc; margin-right: 8px; }
            .patient-info { display: flex; justify-content: space-between; padding: 10px; background: #f8f9fa; border-radius: 6px; margin-bottom: 15px; }
            .patient-info div { line-height: 1.6; }
            .patient-info strong { color: #333; }
            .drugs-table { width: 100%; border-collapse: collapse; margin-bottom: 15px; }
            .drugs-table th { background: #0066cc; color: white; padding: 8px; text-align: left; font-size: 11px; }
            .drugs-table td { padding: 8px; border-bottom: 1px solid #e5e5e5; }
            .drugs-table tr:nth-child(even) { background: #f9f9f9; }
            .drug-name { font-weight: 600; color: #1a1a1a; }
            .drug-details { font-size: 11px; color: #666; }
            .section { margin-bottom: 12px; }
            .section-title { font-size: 11px; font-weight: 600; color: #0066cc; text-transform: uppercase; margin-bottom: 4px; }
            .section-content { padding: 8px; background: #f8f9fa; border-radius: 4px; white-space: pre-line; }
            .footer { margin-top: 30px; display: flex; justify-content: space-between; align-items: flex-end; }
            .signature { text-align: right; }
            .signature-line { width: 150px; border-top: 1px solid #333; margin-top: 40px; padding-top: 5px; }
            .barcode { font-family: monospace; font-size: 14px; letter-spacing: 2px; }
            .follow-up { padding: 8px; background: #fff3cd; border-radius: 4px; margin-top: 10px; }
            @media print {
              body { padding: 0; }
              @page { margin: 15mm; }
            }
          </style>
        </head>
        <body>
          ${content.innerHTML}
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => {
      printWindow.print();
      printWindow.close();
    }, 250);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-3xl max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between px-5 py-3 border-b">
          <h2 className="text-lg font-semibold text-gray-800">Prescription Preview</h2>
          <div className="flex gap-2">
            <Button size="sm" onClick={handlePrint} className="gap-1.5 bg-blue-600 hover:bg-blue-700">
              <Printer className="w-4 h-4" />
              Print
            </Button>
            <Button size="sm" variant="outline" onClick={onClose}>
              <X className="w-4 h-4" />
            </Button>
          </div>
        </div>

        <div className="flex-1 overflow-auto p-6 bg-gray-50">
          <div
            ref={printRef}
            className="bg-white p-8 shadow-sm border border-gray-200 rounded-lg max-w-[210mm] mx-auto"
            style={{ minHeight: '297mm' }}
          >
            <div className="header">
              <div className="hospital-name">HEALTHRAY MEDICAL CENTER</div>
              <div className="hospital-info">
                123 Healthcare Avenue, Medical District, City - 400001<br />
                Phone: +91 22 1234 5678 | Email: info@healthray.com<br />
                GSTIN: 27AAAAA0000A1Z5 | Reg. No: MH/2024/12345
              </div>
            </div>

            <div className="patient-info">
              <div>
                <div><strong>Patient:</strong> {patient.full_name}</div>
                <div><strong>UHID:</strong> {patient.uhid}</div>
                <div><strong>Age/Gender:</strong> {calculateAge(patient.date_of_birth)} / {patient.gender}</div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div><strong>Rx No:</strong> {prescription.prescription_number}</div>
                <div><strong>Date:</strong> {formatDate(prescription.prescription_date)}</div>
              </div>
            </div>

            {form.diagnosis && (
              <div className="section">
                <div className="section-title">Diagnosis</div>
                <div className="section-content">{form.diagnosis}</div>
              </div>
            )}

            <div style={{ marginTop: '15px' }}>
              <span className="rx-symbol">Rx</span>
            </div>

            <table className="drugs-table">
              <thead>
                <tr>
                  <th style={{ width: '5%' }}>#</th>
                  <th style={{ width: '35%' }}>Drug</th>
                  <th style={{ width: '15%' }}>Dosage</th>
                  <th style={{ width: '15%' }}>Frequency</th>
                  <th style={{ width: '15%' }}>Duration</th>
                  <th style={{ width: '15%' }}>Qty</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item, idx) => (
                  <tr key={item.id}>
                    <td>{idx + 1}</td>
                    <td>
                      <div className="drug-name">{item.drugName}</div>
                      <div className="drug-details">
                        {getFormLabel(item.dosageForm)} {item.strength && `• ${item.strength}`} • {item.route}
                        {item.specialInstructions && <><br /><em>{item.specialInstructions}</em></>}
                      </div>
                    </td>
                    <td>{item.dosage}</td>
                    <td>{item.timing}</td>
                    <td>{item.durationDays} days</td>
                    <td>{item.quantity}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            {form.generalAdvice && (
              <div className="section">
                <div className="section-title">General Advice</div>
                <div className="section-content">{form.generalAdvice}</div>
              </div>
            )}

            {form.dietaryInstructions && (
              <div className="section">
                <div className="section-title">Dietary Instructions</div>
                <div className="section-content">{form.dietaryInstructions}</div>
              </div>
            )}

            {form.followUpDate && (
              <div className="follow-up">
                <strong>Follow-up:</strong> {formatDate(form.followUpDate)}
              </div>
            )}

            <div className="footer">
              <div>
                <div className="barcode">{prescription.prescription_number}</div>
              </div>
              <div className="signature">
                <div className="signature-line">Doctor's Signature</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
