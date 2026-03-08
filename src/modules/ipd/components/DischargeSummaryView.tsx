import { useState, useEffect } from 'react';
import {
  X, Printer, Loader2, FileText, Calendar, User, BedDouble,
  Stethoscope, Pill, ClipboardList, Activity, Utensils,
} from 'lucide-react';
import { format, differenceInDays } from 'date-fns';
import { Button } from '../../../components/ui/button';
import { Badge } from '../../../components/ui/badge';
import { useToast } from '../../../hooks/useToast';
import ipdService from '../../../services/ipd.service';
import type { Admission, DischargeSummary } from '../types';
import { DISCHARGE_TYPE_CONFIG, CONDITION_CONFIG } from '../types';
import { printDischargeSummary } from './DischargeSummaryPrint';

interface Props {
  admission: Admission;
  onClose: () => void;
}

export default function DischargeSummaryView({ admission, onClose }: Props) {
  const { toast } = useToast();
  const [summary, setSummary] = useState<DischargeSummary | null>(null);
  const [loading, setLoading] = useState(true);

  const handlePrint = () => {
    if (summary) printDischargeSummary({ admission, summary });
  };

  useEffect(() => {
    const load = async () => {
      try {
        const data = await ipdService.getDischargeSummary(admission.id);
        setSummary(data);
      } catch {
        toast('Error', { description: 'Failed to load discharge summary', type: 'error' });
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [admission.id]);

  const daysAdmitted = differenceInDays(
    summary?.discharge_date ? new Date(summary.discharge_date) : new Date(),
    new Date(admission.admission_date)
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] flex flex-col overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
          <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
            <FileText className="w-5 h-5 text-blue-600" />
            Discharge Summary
          </h2>
          <div className="flex items-center gap-2">
            {summary && (
              <Button
                size="sm"
                onClick={handlePrint}
                className="gap-1.5 h-8 text-xs bg-primary hover:bg-primary/90"
              >
                <Printer className="w-3.5 h-3.5" />
                Print
              </Button>
            )}
            <button
              type="button"
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X className="w-4 h-4 text-gray-400" />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          {loading ? (
            <div className="flex items-center justify-center h-40">
              <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
            </div>
          ) : !summary ? (
            <div className="text-center py-16 text-gray-400">
              <FileText className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p className="text-sm font-medium">No Discharge Summary</p>
              <p className="text-xs mt-1">Discharge summary will be available after patient is discharged.</p>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4 p-4 bg-gray-50 rounded-xl">
                <div className="flex items-center gap-2">
                  <User className="w-4 h-4 text-gray-400" />
                  <div>
                    <div className="text-[10px] text-gray-500 uppercase">Patient</div>
                    <div className="text-sm font-semibold text-gray-800">{admission.patient?.full_name}</div>
                    <div className="text-xs text-gray-500">{admission.patient?.uhid}</div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <BedDouble className="w-4 h-4 text-gray-400" />
                  <div>
                    <div className="text-[10px] text-gray-500 uppercase">Admission</div>
                    <div className="text-sm font-semibold text-gray-800">{admission.admission_number}</div>
                    <div className="text-xs text-gray-500">Bed: {admission.bed?.bed_number}</div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-gray-400" />
                  <div>
                    <div className="text-[10px] text-gray-500 uppercase">Duration</div>
                    <div className="text-sm text-gray-800">
                      {format(new Date(admission.admission_date), 'dd MMM yyyy')} -
                      {summary.discharge_date ? ` ${format(new Date(summary.discharge_date), 'dd MMM yyyy')}` : ' Present'}
                    </div>
                    <div className="text-xs text-blue-600 font-medium">{daysAdmitted} day(s)</div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Stethoscope className="w-4 h-4 text-gray-400" />
                  <div>
                    <div className="text-[10px] text-gray-500 uppercase">Doctor</div>
                    <div className="text-sm font-semibold text-gray-800">Dr. {admission.doctor?.full_name}</div>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <Badge className={DISCHARGE_TYPE_CONFIG[summary.discharge_type]?.color || 'bg-gray-100 text-gray-700'}>
                  {DISCHARGE_TYPE_CONFIG[summary.discharge_type]?.label || summary.discharge_type}
                </Badge>
                <Badge className={CONDITION_CONFIG[summary.condition_at_discharge]?.color || 'bg-gray-100 text-gray-700'}>
                  {CONDITION_CONFIG[summary.condition_at_discharge]?.label || summary.condition_at_discharge}
                </Badge>
              </div>

              <SummarySection
                icon={ClipboardList}
                title="Final Diagnosis"
                content={summary.final_diagnosis}
              />

              <SummarySection
                icon={FileText}
                title="Treatment Summary"
                content={summary.treatment_summary}
              />

              <SummarySection
                icon={Activity}
                title="Procedures Performed"
                content={summary.procedures_performed}
              />

              <SummarySection
                icon={Pill}
                title="Medications on Discharge"
                content={summary.medications_on_discharge}
              />

              <SummarySection
                icon={ClipboardList}
                title="Follow-up Instructions"
                content={summary.follow_up_instructions}
              />

              {summary.follow_up_date && (
                <div className="flex items-center gap-2 p-3 bg-blue-50 rounded-xl border border-blue-100">
                  <Calendar className="w-4 h-4 text-blue-500" />
                  <span className="text-sm text-blue-700 font-medium">
                    Follow-up Date: {format(new Date(summary.follow_up_date), 'dd MMM yyyy')}
                  </span>
                </div>
              )}

              <SummarySection
                icon={Utensils}
                title="Diet Advice"
                content={summary.diet_advice}
              />

              <SummarySection
                icon={Activity}
                title="Activity Restrictions"
                content={summary.activity_restrictions}
              />
            </div>
          )}
        </div>

      </div>
    </div>
  );
}

function SummarySection({ icon: Icon, title, content }: { icon: React.ElementType; title: string; content: string | null }) {
  if (!content) return null;
  return (
    <div>
      <div className="flex items-center gap-2 mb-1.5">
        <Icon className="w-3.5 h-3.5 text-gray-400" />
        <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wide">{title}</h4>
      </div>
      <p className="text-sm text-gray-700 whitespace-pre-wrap pl-5.5">{content}</p>
    </div>
  );
}

function PrintSection({ title, content }: { title: string; content: string | null }) {
  if (!content) return null;
  return (
    <div style={{ marginBottom: '14px' }}>
      <div style={{ fontWeight: 700, fontSize: '12px', marginBottom: '4px', borderBottom: '1px solid #eee', paddingBottom: '2px' }}>
        {title}
      </div>
      <div style={{ fontSize: '11px', whiteSpace: 'pre-wrap', lineHeight: '1.5' }}>{content}</div>
    </div>
  );
}
