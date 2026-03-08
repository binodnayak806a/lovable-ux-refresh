/**
 * Discharge Summary Print — Professional A4 format.
 * Opens in a new print window with all clinical details.
 */
import {
  hospitalHeaderHTML, openPrintWindow, formatDateIN, calculateAge,
} from '../../../lib/printStyles';
import type { Admission, DischargeSummary } from '../types';
import { DISCHARGE_TYPE_CONFIG, CONDITION_CONFIG } from '../types';

interface Props {
  admission: Admission;
  summary: DischargeSummary;
}

function badgeClass(type: string): string {
  if (type.includes('Normal') || type === 'Stable' || type === 'Improved') return 'badge-green';
  if (type === 'LAMA' || type === 'Unchanged' || type === 'Deteriorated') return 'badge-amber';
  if (type === 'Death' || type === 'Absconded' || type === 'Critical' || type === 'Expired') return 'badge-red';
  return 'badge-gray';
}

function sectionHTML(title: string, content: string | null): string {
  if (!content) return '';
  return `
    <div class="section">
      <h3>${title}</h3>
      <p>${content}</p>
    </div>`;
}

export function printDischargeSummary({ admission, summary }: Props) {
  const patient = admission.patient;
  const doctor = admission.doctor;

  const daysAdmitted = Math.max(1, Math.ceil(
    (new Date(summary.discharge_date || new Date()).getTime() - new Date(admission.admission_date).getTime()) / 86400000
  ));

  const dischargeTypeLabel = DISCHARGE_TYPE_CONFIG[summary.discharge_type]?.label || summary.discharge_type;
  const conditionLabel = CONDITION_CONFIG[summary.condition_at_discharge]?.label || summary.condition_at_discharge;

  const html = `
    ${hospitalHeaderHTML()}
    <div class="doc-title">DISCHARGE SUMMARY</div>

    <div class="info-grid">
      <div class="info-box">
        <h4>Patient Details</h4>
        <div class="info-row"><span class="lbl">Name</span><span class="val">${patient?.full_name || '-'}</span></div>
        <div class="info-row"><span class="lbl">UHID</span><span class="val">${patient?.uhid || '-'}</span></div>
        <div class="info-row"><span class="lbl">Age / Gender</span><span class="val">${calculateAge(patient?.date_of_birth || null)} / ${patient?.gender || '-'}</span></div>
        <div class="info-row"><span class="lbl">Blood Group</span><span class="val">${patient?.blood_group || '-'}</span></div>
        <div class="info-row"><span class="lbl">Phone</span><span class="val">${patient?.phone || '-'}</span></div>
      </div>
      <div class="info-box">
        <h4>Admission Details</h4>
        <div class="info-row"><span class="lbl">Admission No</span><span class="val">${admission.admission_number}</span></div>
        <div class="info-row"><span class="lbl">Admitted</span><span class="val">${formatDateIN(admission.admission_date)}</span></div>
        <div class="info-row"><span class="lbl">Discharged</span><span class="val">${formatDateIN(summary.discharge_date)}</span></div>
        <div class="info-row"><span class="lbl">Duration</span><span class="val">${daysAdmitted} day(s)</span></div>
        <div class="info-row"><span class="lbl">Doctor</span><span class="val">Dr. ${doctor?.full_name || '-'}</span></div>
      </div>
    </div>

    <div style="margin-bottom:14px;">
      <span class="badge ${badgeClass(summary.discharge_type)}">${dischargeTypeLabel}</span>
      <span class="badge ${badgeClass(summary.condition_at_discharge)}">${conditionLabel}</span>
    </div>

    ${sectionHTML('Final Diagnosis', summary.final_diagnosis)}
    ${sectionHTML('Treatment Summary', summary.treatment_summary)}
    ${sectionHTML('Procedures Performed', summary.procedures_performed)}
    ${sectionHTML('Medications on Discharge', summary.medications_on_discharge)}
    ${sectionHTML('Follow-up Instructions', summary.follow_up_instructions)}

    ${summary.follow_up_date ? `
      <div style="padding:8px 12px;background:#dbeafe;border:1px solid #93c5fd;border-radius:4px;font-size:11px;margin-bottom:12px;">
        <strong>Follow-up Date:</strong> ${formatDateIN(summary.follow_up_date)}
      </div>
    ` : ''}

    ${sectionHTML('Diet Advice', summary.diet_advice)}
    ${sectionHTML('Activity Restrictions', summary.activity_restrictions)}

    <div class="footer">
      <div class="sig"><div class="sig-line">Doctor's Signature</div></div>
      <div class="sig"><div class="sig-line">Patient / Attendant</div></div>
    </div>

    <div class="thank-you">
      This is a computer-generated document. For queries, contact the hospital reception.<br/>
      WellNotes Healthcare — Your health, our priority.
    </div>
  `;

  openPrintWindow(`Discharge_${admission.admission_number}`, html);
}
