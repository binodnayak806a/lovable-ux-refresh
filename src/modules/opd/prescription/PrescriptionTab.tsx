import { useState, useCallback } from 'react';
import { Plus, FileText, Utensils, Calendar, Printer, Save, Loader2, CheckCircle2, ShieldAlert } from 'lucide-react';
import { Button } from '../../../components/ui/button';
import { Card, CardContent } from '../../../components/ui/card';
import { useAppSelector } from '../../../store';
import { useToast } from '../../../hooks/useToast';
import prescriptionService from '../../../services/prescription.service';
import { supabase } from '../../../lib/supabase';
import DrugItemCard from './DrugItemCard';
import PrescriptionPrintPreview from './PrescriptionPrintPreview';
import type { PrescriptionItem, PrescriptionFormData, PrescriptionRecord } from './types';
import { createEmptyItem, EMPTY_PRESCRIPTION_FORM, COMMON_ADVICE, COMMON_DIETARY_INSTRUCTIONS } from './types';

interface PatientInfo {
  id: string;
  uhid: string;
  full_name: string;
  gender: string;
  date_of_birth: string | null;
}

interface Props {
  patient: PatientInfo | null;
  consultationId: string | null;
  diagnosisSummary?: string;
}

export default function PrescriptionTab({ patient, consultationId, diagnosisSummary }: Props) {
  const { user } = useAppSelector((s) => s.auth);
  const { toast } = useToast();

  const [items, setItems] = useState<PrescriptionItem[]>([createEmptyItem()]);
  const [form, setForm] = useState<PrescriptionFormData>({
    ...EMPTY_PRESCRIPTION_FORM,
    diagnosis: diagnosisSummary || '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [savedPrescription, setSavedPrescription] = useState<PrescriptionRecord | null>(null);
  const [showPrint, setShowPrint] = useState(false);
  const [allergyWarnings, setAllergyWarnings] = useState<string[]>([]);
  const [allergyDismissed, setAllergyDismissed] = useState(false);

  const addItem = () => {
    setItems([...items, createEmptyItem()]);
  };

  const removeItem = (id: string) => {
    if (items.length === 1) return;
    setItems(items.filter((i) => i.id !== id));
  };

  const updateItem = useCallback(
    (id: string, field: keyof PrescriptionItem, value: string | number | null) => {
      setItems((prev) =>
        prev.map((item) => (item.id === id ? { ...item, [field]: value } : item))
      );
      setSavedPrescription(null);
    },
    []
  );

  const handleFormChange = (field: keyof PrescriptionFormData, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    setSavedPrescription(null);
  };

  const checkAllergyConflicts = async (drugNames: string[]): Promise<string[]> => {
    if (!patient) return [];
    const { data } = await supabase
      .from('patient_allergies')
      .select('allergen, severity')
      .eq('patient_id', patient.id);
    if (!data || data.length === 0) return [];
    const allergies = data as Array<{ allergen: string; severity: string }>;
    const conflicts: string[] = [];
    for (const drug of drugNames) {
      for (const allergy of allergies) {
        const allergenLower = allergy.allergen.toLowerCase();
        const drugLower = drug.toLowerCase();
        if (drugLower.includes(allergenLower) || allergenLower.includes(drugLower)) {
          conflicts.push(`${drug} (patient allergic to: ${allergy.allergen} — ${allergy.severity})`);
        }
      }
    }
    return conflicts;
  };

  const handleSave = async () => {
    if (!patient) {
      toast('No Patient', { description: 'Please select a patient first.', type: 'error' });
      return;
    }

    const validItems = items.filter((i) => i.drugName.trim());
    if (validItems.length === 0) {
      toast('No Drugs Added', { description: 'Add at least one medication to the prescription.', type: 'error' });
      return;
    }

    if (!allergyDismissed) {
      const conflicts = await checkAllergyConflicts(validItems.map((i) => i.drugName));
      if (conflicts.length > 0) {
        setAllergyWarnings(conflicts);
        return;
      }
    }

    setSubmitting(true);
    try {
      const prescription = await prescriptionService.createPrescription(
        patient.id,
        consultationId,
        user?.id ?? '',
        form,
        validItems
      );
      setSavedPrescription(prescription);
      toast('Prescription Saved', {
        description: `Prescription ${prescription.prescription_number} created`,
        type: 'success',
      });
    } catch (err: unknown) {
      toast('Save Failed', {
        description: err instanceof Error ? err.message : 'Could not save prescription.',
        type: 'error',
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleSaveAndPrint = async () => {
    await handleSave();
    setShowPrint(true);
  };

  const insertAdvice = (text: string) => {
    const current = form.generalAdvice;
    const newVal = current ? `${current}\n${text}` : text;
    handleFormChange('generalAdvice', newVal);
  };

  const insertDietary = (text: string) => {
    const current = form.dietaryInstructions;
    const newVal = current ? `${current}\n${text}` : text;
    handleFormChange('dietaryInstructions', newVal);
  };

  if (showPrint && savedPrescription && patient) {
    return (
      <PrescriptionPrintPreview
        prescription={savedPrescription}
        patient={patient}
        items={items.filter((i) => i.drugName.trim())}
        form={form}
        onClose={() => setShowPrint(false)}
      />
    );
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-gray-700 flex items-center gap-2">
          <FileText className="w-4 h-4 text-blue-500" />
          Prescription
        </h3>
        <div className="flex gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={handleSaveAndPrint}
            disabled={submitting || !patient || items.every((i) => !i.drugName.trim())}
            className="gap-1.5 h-8"
          >
            <Printer className="w-3.5 h-3.5" />
            Save & Print
          </Button>
          <Button
            size="sm"
            onClick={handleSave}
            disabled={submitting || !patient || items.every((i) => !i.drugName.trim())}
            className={`gap-1.5 h-8 min-w-[120px] ${
              savedPrescription ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-blue-600 hover:bg-blue-700'
            }`}
          >
            {submitting ? (
              <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Saving…</>
            ) : savedPrescription ? (
              <><CheckCircle2 className="w-3.5 h-3.5" /> Saved</>
            ) : (
              <><Save className="w-3.5 h-3.5" /> Save</>
            )}
          </Button>
        </div>
      </div>

      {allergyWarnings.length > 0 && (
        <div className="p-4 bg-red-50 border border-red-300 rounded-xl">
          <div className="flex items-start gap-2 mb-2">
            <ShieldAlert className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
            <p className="text-sm font-bold text-red-800">Allergy Conflict Detected</p>
          </div>
          <ul className="space-y-1 mb-3">
            {allergyWarnings.map((w, i) => (
              <li key={i} className="text-xs text-red-700 bg-red-100 rounded-lg px-3 py-1.5">{w}</li>
            ))}
          </ul>
          <div className="flex gap-2">
            <Button
              size="sm"
              variant="outline"
              className="h-7 text-xs border-red-300 text-red-700 hover:bg-red-50"
              onClick={() => { setAllergyDismissed(true); setAllergyWarnings([]); }}
            >
              Override & Save Anyway
            </Button>
            <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={() => setAllergyWarnings([])}>
              Revise Prescription
            </Button>
          </div>
        </div>
      )}

      <div className="space-y-3">
        {items.map((item, idx) => (
          <DrugItemCard
            key={item.id}
            item={item}
            index={idx}
            onChange={updateItem}
            onRemove={removeItem}
          />
        ))}

        <Button
          variant="outline"
          onClick={addItem}
          className="w-full h-10 border-dashed border-gray-300 text-gray-600 hover:bg-gray-50 gap-1.5"
        >
          <Plus className="w-4 h-4" />
          Add Another Drug
        </Button>
      </div>

      <Card className="border border-gray-100 shadow-sm">
        <CardContent className="p-4 space-y-4">
          <div>
            <label className="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1.5 flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5" />
              Diagnosis Summary
            </label>
            <textarea
              value={form.diagnosis}
              onChange={(e) => handleFormChange('diagnosis', e.target.value)}
              placeholder="Brief diagnosis to appear on prescription…"
              rows={2}
              className="w-full rounded-lg border border-gray-200 focus:border-blue-400 focus:ring-2 focus:ring-blue-100 text-sm px-3 py-2 outline-none transition-all resize-none"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1.5 flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5" />
              General Advice
            </label>
            <textarea
              value={form.generalAdvice}
              onChange={(e) => handleFormChange('generalAdvice', e.target.value)}
              placeholder="Rest, drink plenty of fluids…"
              rows={3}
              className="w-full rounded-lg border border-gray-200 focus:border-blue-400 focus:ring-2 focus:ring-blue-100 text-sm px-3 py-2 outline-none transition-all resize-none"
            />
            <div className="flex flex-wrap gap-1.5 mt-2">
              {COMMON_ADVICE.slice(0, 4).map((adv) => (
                <button
                  key={adv}
                  type="button"
                  onClick={() => insertAdvice(adv)}
                  className="text-xs px-2 py-1 rounded border border-gray-200 text-gray-600 hover:bg-gray-50 hover:border-gray-300 transition-all"
                >
                  + {adv.slice(0, 25)}…
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1.5 flex items-center gap-1.5">
              <Utensils className="w-3.5 h-3.5" />
              Dietary Instructions
            </label>
            <textarea
              value={form.dietaryInstructions}
              onChange={(e) => handleFormChange('dietaryInstructions', e.target.value)}
              placeholder="Light diet, avoid spicy food…"
              rows={2}
              className="w-full rounded-lg border border-gray-200 focus:border-blue-400 focus:ring-2 focus:ring-blue-100 text-sm px-3 py-2 outline-none transition-all resize-none"
            />
            <div className="flex flex-wrap gap-1.5 mt-2">
              {COMMON_DIETARY_INSTRUCTIONS.slice(0, 4).map((d) => (
                <button
                  key={d}
                  type="button"
                  onClick={() => insertDietary(d)}
                  className="text-xs px-2 py-1 rounded border border-gray-200 text-gray-600 hover:bg-gray-50 hover:border-gray-300 transition-all"
                >
                  + {d}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1.5 flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5" />
              Follow-up Date
            </label>
            <input
              type="date"
              value={form.followUpDate}
              onChange={(e) => handleFormChange('followUpDate', e.target.value)}
              min={new Date().toISOString().split('T')[0]}
              className="w-full sm:w-56 h-9 px-3 rounded-lg border border-gray-200 focus:border-blue-400 focus:ring-2 focus:ring-blue-100 text-sm outline-none transition-all"
            />
          </div>
        </CardContent>
      </Card>

      {savedPrescription && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-sm text-emerald-800">
          Prescription <span className="font-mono font-semibold">{savedPrescription.prescription_number}</span> saved successfully.
        </div>
      )}
    </div>
  );
}
