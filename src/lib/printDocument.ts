import { supabase } from './supabase';

export type DocumentType =
  | 'OPD_BILL'
  | 'PRESCRIPTION'
  | 'IPD_BILL'
  | 'DISCHARGE_SUMMARY'
  | 'PATIENT_STICKER'
  | 'IPD_LABEL'
  | 'RECEIPT'
  | 'LAB_REPORT';

interface PrintTemplate {
  id: string;
  document_type: string;
  template_name: string;
  page_size: string;
  orientation: string;
  canvas_json: Record<string, unknown>;
  field_mappings: Record<string, string>;
  is_default: boolean;
}

interface PrintData {
  [key: string]: string | number | boolean | null | undefined;
}

async function getDefaultTemplate(documentType: DocumentType): Promise<PrintTemplate | null> {
  const { data, error } = await supabase
    .from('print_templates')
    .select('*')
    .eq('document_type', documentType)
    .eq('is_default', true)
    .eq('is_active', true)
    .maybeSingle();

  if (error || !data) return null;
  return data as PrintTemplate;
}

function replaceVariables(html: string, data: PrintData): string {
  let result = html;

  for (const [key, value] of Object.entries(data)) {
    const placeholder = `{{${key}}}`;
    const replacement = value !== null && value !== undefined ? String(value) : '';
    result = result.replace(new RegExp(placeholder, 'g'), replacement);
  }

  return result;
}

function generateFallbackHTML(documentType: DocumentType, data: PrintData): string {
  const hospitalName = data.hospital_name || 'Hospital';
  const hospitalAddress = data.hospital_address || '';
  const hospitalPhone = data.hospital_phone || '';

  const header = `
    <div style="text-align: center; border-bottom: 2px solid #333; padding-bottom: 10px; margin-bottom: 20px;">
      <h1 style="margin: 0; font-size: 24px;">${hospitalName}</h1>
      <p style="margin: 5px 0; font-size: 12px;">${hospitalAddress}</p>
      <p style="margin: 5px 0; font-size: 12px;">Phone: ${hospitalPhone}</p>
    </div>
  `;

  switch (documentType) {
    case 'OPD_BILL':
      return `
        ${header}
        <h2 style="text-align: center;">OPD Bill</h2>
        <table style="width: 100%; margin: 20px 0;">
          <tr><td><strong>Bill No:</strong></td><td>${data.bill_number || ''}</td></tr>
          <tr><td><strong>Date:</strong></td><td>${data.date || ''}</td></tr>
          <tr><td><strong>Patient Name:</strong></td><td>${data.patient_name || ''}</td></tr>
          <tr><td><strong>UHID:</strong></td><td>${data.uhid || ''}</td></tr>
          <tr><td><strong>Doctor:</strong></td><td>${data.doctor_name || ''}</td></tr>
          <tr><td><strong>Token:</strong></td><td>${data.token || ''}</td></tr>
        </table>
        <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
          <thead style="background: #f0f0f0;">
            <tr>
              <th style="border: 1px solid #ddd; padding: 8px; text-align: left;">Description</th>
              <th style="border: 1px solid #ddd; padding: 8px; text-align: right;">Amount</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td style="border: 1px solid #ddd; padding: 8px;">${data.visit_type || 'Consultation'}</td>
              <td style="border: 1px solid #ddd; padding: 8px; text-align: right;">₹${data.amount || '0'}</td>
            </tr>
            <tr>
              <td style="border: 1px solid #ddd; padding: 8px;">GST</td>
              <td style="border: 1px solid #ddd; padding: 8px; text-align: right;">₹${data.gst || '0'}</td>
            </tr>
            <tr style="font-weight: bold;">
              <td style="border: 1px solid #ddd; padding: 8px;">Total</td>
              <td style="border: 1px solid #ddd; padding: 8px; text-align: right;">₹${data.total || '0'}</td>
            </tr>
          </tbody>
        </table>
        <p style="margin-top: 40px;"><strong>Payment Mode:</strong> ${data.payment_mode || ''}</p>
      `;

    case 'PRESCRIPTION':
      return `
        ${header}
        <h2 style="text-align: center;">Prescription</h2>
        <table style="width: 100%; margin: 20px 0;">
          <tr><td><strong>Rx No:</strong></td><td>${data.prescription_number || ''}</td></tr>
          <tr><td><strong>Date:</strong></td><td>${data.date || ''}</td></tr>
          <tr><td><strong>Patient Name:</strong></td><td>${data.patient_name || ''}</td></tr>
          <tr><td><strong>Age/Gender:</strong></td><td>${data.age || ''}/${data.gender || ''}</td></tr>
          <tr><td><strong>Doctor:</strong></td><td>${data.doctor_name || ''}</td></tr>
        </table>
        <div style="margin: 20px 0;">
          <h3>Complaints:</h3>
          <p>${data.complaints || 'N/A'}</p>
          <h3>Diagnosis:</h3>
          <p>${data.diagnosis || 'N/A'}</p>
          <h3>Medications:</h3>
          <div>${data.medicines_table || 'No medications prescribed'}</div>
          <h3>Advice:</h3>
          <p>${data.advice || 'N/A'}</p>
          <p><strong>Follow-up:</strong> ${data.followup_date || 'As needed'}</p>
        </div>
      `;

    case 'RECEIPT':
      return `
        ${header}
        <h2 style="text-align: center;">Payment Receipt</h2>
        <table style="width: 100%; margin: 20px 0;">
          <tr><td><strong>Receipt No:</strong></td><td>${data.receipt_no || ''}</td></tr>
          <tr><td><strong>Date:</strong></td><td>${data.date || ''}</td></tr>
          <tr><td><strong>Patient Name:</strong></td><td>${data.patient_name || ''}</td></tr>
          <tr><td><strong>Amount Paid:</strong></td><td style="font-size: 18px; font-weight: bold;">₹${data.amount || '0'}</td></tr>
          <tr><td><strong>Payment Mode:</strong></td><td>${data.payment_mode || ''}</td></tr>
          <tr><td><strong>Bill Type:</strong></td><td>${data.bill_type || ''}</td></tr>
        </table>
        <p style="text-align: center; margin-top: 40px;">Thank you for your payment!</p>
      `;

    default:
      return `
        ${header}
        <h2 style="text-align: center;">${documentType.replace('_', ' ')}</h2>
        <pre>${JSON.stringify(data, null, 2)}</pre>
      `;
  }
}

export async function printDocument(
  documentType: DocumentType,
  data: PrintData,
  autoOpen = true
): Promise<void> {
  const template = await getDefaultTemplate(documentType);

  let htmlContent: string;

  if (template && template.canvas_json) {
    htmlContent = replaceVariables(
      JSON.stringify(template.canvas_json),
      data
    );
  } else {
    htmlContent = generateFallbackHTML(documentType, data);
  }

  const printWindow = window.open('', '_blank');
  if (!printWindow) {
    alert('Please allow popups to print documents');
    return;
  }

  const fullHTML = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <title>${documentType.replace('_', ' ')}</title>
      <style>
        @media print {
          body { margin: 0; }
          @page { margin: 1cm; }
        }
        body {
          font-family: Arial, sans-serif;
          padding: 20px;
          max-width: 800px;
          margin: 0 auto;
        }
        table { width: 100%; }
        .no-print { display: none; }
      </style>
    </head>
    <body>
      ${htmlContent}
      <div class="no-print" style="margin-top: 40px; text-align: center;">
        <button onclick="window.print()" style="padding: 10px 20px; font-size: 16px; cursor: pointer;">Print</button>
        <button onclick="window.close()" style="padding: 10px 20px; font-size: 16px; cursor: pointer; margin-left: 10px;">Close</button>
      </div>
    </body>
    </html>
  `;

  printWindow.document.write(fullHTML);
  printWindow.document.close();

  if (autoOpen) {
    setTimeout(() => {
      printWindow.print();
    }, 250);
  }
}

export async function getHospitalSettings(hospitalId: string): Promise<PrintData> {
  const { data } = await supabase
    .from('hospitals')
    .select('name, address, city, state, pincode, phone, email, logo_url')
    .eq('id', hospitalId)
    .maybeSingle();

  if (!data) {
    return {
      hospital_name: 'Hospital',
      hospital_address: '',
      hospital_phone: '',
      hospital_logo: '',
    };
  }

  const hospital = data as Record<string, unknown>;

  return {
    hospital_name: hospital.name as string,
    hospital_address: `${hospital.address || ''}, ${hospital.city || ''}, ${hospital.state || ''} - ${hospital.pincode || ''}`.trim(),
    hospital_phone: hospital.phone as string,
    hospital_email: hospital.email as string,
    hospital_logo: hospital.logo_url as string,
  };
}
