import { useState } from 'react';
import {
  Loader2, Calendar, ClipboardList, Pill, CalendarCheck,
  Utensils, Activity, CheckCircle, AlertTriangle,
} from 'lucide-react';
import { Button } from '../../../components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '../../../components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../../../components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../../components/ui/tabs';
import { Checkbox } from '../../../components/ui/checkbox';
import { useAppSelector } from '../../../store';
import { useToast } from '../../../hooks/useToast';
import ipdService from '../../../services/ipd.service';
import type {
  Admission,
  DischargeFormData,
  DischargeType,
  ConditionAtDischarge,
} from '../types';
import { EMPTY_DISCHARGE_FORM, DISCHARGE_TYPE_CONFIG, CONDITION_CONFIG } from '../types';
import { format } from 'date-fns';

interface Props {
  admission: Admission;
  onClose: () => void;
  onSuccess: () => void;
}

export default function DischargeDialog({ admission, onClose, onSuccess }: Props) {
  const { user } = useAppSelector((s) => s.auth);
  const { toast } = useToast();

  const [activeTab, setActiveTab] = useState('details');
  const [submitting, setSubmitting] = useState(false);
  const [generateBill, setGenerateBill] = useState(true);
  const [form, setForm] = useState<DischargeFormData>({
    ...EMPTY_DISCHARGE_FORM,
    final_diagnosis: admission.primary_diagnosis || '',
  });

  const handleSubmit = async () => {
    if (!form.final_diagnosis.trim()) {
      toast('Enter Diagnosis', { description: 'Final diagnosis is required', type: 'error' });
      setActiveTab('details');
      return;
    }

    setSubmitting(true);
    try {
      await ipdService.processDischarge(admission.id, form, user?.id ?? '', generateBill);
      toast('Patient Discharged', { description: 'Discharge completed successfully', type: 'success' });
      onSuccess();
    } catch {
      toast('Error', { description: 'Failed to process discharge', type: 'error' });
    } finally {
      setSubmitting(false);
    }
  };

  const daysAdmitted = Math.ceil(
    (new Date().getTime() - new Date(admission.admission_date).getTime()) / (1000 * 60 * 60 * 24)
  );

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CheckCircle className="w-5 h-5 text-emerald-600" />
            Discharge Patient
          </DialogTitle>
        </DialogHeader>

        <div className="p-4 bg-gray-50 rounded-xl mb-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-semibold text-gray-800">{admission.patient?.full_name}</h3>
              <p className="text-sm text-gray-500">
                {admission.patient?.uhid} | {admission.bed?.bed_number}
              </p>
            </div>
            <div className="text-right">
              <div className="text-sm text-gray-500">Admitted</div>
              <div className="font-medium text-gray-700">
                {format(new Date(admission.admission_date), 'dd MMM yyyy')}
              </div>
              <div className="text-xs text-blue-600 font-medium">{daysAdmitted} days</div>
            </div>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid grid-cols-4 mb-4">
            <TabsTrigger value="details" className="text-xs">Details</TabsTrigger>
            <TabsTrigger value="summary" className="text-xs">Summary</TabsTrigger>
            <TabsTrigger value="medications" className="text-xs">Medications</TabsTrigger>
            <TabsTrigger value="followup" className="text-xs">Follow-up</TabsTrigger>
          </TabsList>

          <TabsContent value="details" className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs text-gray-500 uppercase tracking-wide block mb-1.5">
                  <Calendar className="w-3 h-3 inline mr-1" />
                  Discharge Date & Time
                </label>
                <input
                  type="datetime-local"
                  value={form.discharge_date.slice(0, 16)}
                  onChange={(e) => setForm({ ...form, discharge_date: new Date(e.target.value).toISOString() })}
                  className="w-full h-9 px-3 rounded-xl border border-gray-200 text-sm outline-none focus:border-blue-400"
                />
              </div>

              <div>
                <label className="text-xs text-gray-500 uppercase tracking-wide block mb-1.5">
                  <AlertTriangle className="w-3 h-3 inline mr-1" />
                  Discharge Type
                </label>
                <Select
                  value={form.discharge_type}
                  onValueChange={(v) => setForm({ ...form, discharge_type: v as DischargeType })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(DISCHARGE_TYPE_CONFIG).map(([key, cfg]) => (
                      <SelectItem key={key} value={key}>
                        {cfg.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <label className="text-xs text-gray-500 uppercase tracking-wide block mb-1.5">
                <ClipboardList className="w-3 h-3 inline mr-1" />
                Final Diagnosis *
              </label>
              <textarea
                value={form.final_diagnosis}
                onChange={(e) => setForm({ ...form, final_diagnosis: e.target.value })}
                placeholder="Enter final diagnosis..."
                rows={3}
                className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm outline-none focus:border-blue-400 resize-none"
              />
            </div>

            <div>
              <label className="text-xs text-gray-500 uppercase tracking-wide block mb-1.5">
                Procedures Performed
              </label>
              <textarea
                value={form.procedures_performed}
                onChange={(e) => setForm({ ...form, procedures_performed: e.target.value })}
                placeholder="List procedures performed during admission..."
                rows={3}
                className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm outline-none focus:border-blue-400 resize-none"
              />
            </div>

            <div>
              <label className="text-xs text-gray-500 uppercase tracking-wide block mb-1.5">
                Condition at Discharge
              </label>
              <Select
                value={form.condition_at_discharge}
                onValueChange={(v) => setForm({ ...form, condition_at_discharge: v as ConditionAtDischarge })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(CONDITION_CONFIG).map(([key, cfg]) => (
                    <SelectItem key={key} value={key}>
                      {cfg.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </TabsContent>

          <TabsContent value="summary" className="space-y-4">
            <div>
              <label className="text-xs text-gray-500 uppercase tracking-wide block mb-1.5">
                Treatment Summary
              </label>
              <textarea
                value={form.treatment_summary}
                onChange={(e) => setForm({ ...form, treatment_summary: e.target.value })}
                placeholder="Provide a detailed summary of the treatment provided during admission..."
                rows={10}
                className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm outline-none focus:border-blue-400 resize-none"
              />
            </div>
          </TabsContent>

          <TabsContent value="medications" className="space-y-4">
            <div>
              <label className="text-xs text-gray-500 uppercase tracking-wide block mb-1.5">
                <Pill className="w-3 h-3 inline mr-1" />
                Medications on Discharge
              </label>
              <textarea
                value={form.medications_on_discharge}
                onChange={(e) => setForm({ ...form, medications_on_discharge: e.target.value })}
                placeholder="List all medications the patient should continue at home:&#10;&#10;1. Medication Name - Dosage - Frequency - Duration&#10;2. ..."
                rows={8}
                className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm outline-none focus:border-blue-400 resize-none font-mono"
              />
            </div>

            <div className="p-3 bg-amber-50 rounded-xl border border-amber-200">
              <p className="text-xs text-amber-700">
                <AlertTriangle className="w-3 h-3 inline mr-1" />
                Ensure all medications are clearly listed with proper dosage, frequency, and duration instructions.
              </p>
            </div>
          </TabsContent>

          <TabsContent value="followup" className="space-y-4">
            <div>
              <label className="text-xs text-gray-500 uppercase tracking-wide block mb-1.5">
                <ClipboardList className="w-3 h-3 inline mr-1" />
                Follow-up Instructions
              </label>
              <textarea
                value={form.follow_up_instructions}
                onChange={(e) => setForm({ ...form, follow_up_instructions: e.target.value })}
                placeholder="Enter follow-up care instructions..."
                rows={4}
                className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm outline-none focus:border-blue-400 resize-none"
              />
            </div>

            <div>
              <label className="text-xs text-gray-500 uppercase tracking-wide block mb-1.5">
                <CalendarCheck className="w-3 h-3 inline mr-1" />
                Follow-up Date
              </label>
              <input
                type="date"
                value={form.follow_up_date}
                onChange={(e) => setForm({ ...form, follow_up_date: e.target.value })}
                className="w-full h-9 px-3 rounded-xl border border-gray-200 text-sm outline-none focus:border-blue-400"
              />
            </div>

            <div>
              <label className="text-xs text-gray-500 uppercase tracking-wide block mb-1.5">
                <Utensils className="w-3 h-3 inline mr-1" />
                Diet Advice
              </label>
              <textarea
                value={form.diet_advice}
                onChange={(e) => setForm({ ...form, diet_advice: e.target.value })}
                placeholder="Dietary recommendations..."
                rows={3}
                className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm outline-none focus:border-blue-400 resize-none"
              />
            </div>

            <div>
              <label className="text-xs text-gray-500 uppercase tracking-wide block mb-1.5">
                <Activity className="w-3 h-3 inline mr-1" />
                Activity Restrictions
              </label>
              <textarea
                value={form.activity_restrictions}
                onChange={(e) => setForm({ ...form, activity_restrictions: e.target.value })}
                placeholder="Physical activity restrictions and recommendations..."
                rows={3}
                className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm outline-none focus:border-blue-400 resize-none"
              />
            </div>
          </TabsContent>
        </Tabs>

        <div className="flex items-center gap-2 p-3 bg-blue-50 rounded-xl mt-4">
          <Checkbox
            id="generateBill"
            checked={generateBill}
            onCheckedChange={(checked) => setGenerateBill(checked as boolean)}
          />
          <label htmlFor="generateBill" className="text-sm text-blue-700 cursor-pointer">
            Generate final bill on discharge
          </label>
        </div>

        <DialogFooter className="mt-4">
          <Button
            variant="outline"
            onClick={onClose}
            disabled={submitting}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={submitting || !form.final_diagnosis.trim()}
            className="bg-emerald-600 hover:bg-emerald-700"
          >
            {submitting ? (
              <Loader2 className="w-4 h-4 animate-spin mr-2" />
            ) : (
              <CheckCircle className="w-4 h-4 mr-2" />
            )}
            Discharge Patient
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
