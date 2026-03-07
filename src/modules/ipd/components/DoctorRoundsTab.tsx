import { useState, useEffect } from 'react';
import { Plus, Loader2, User, Calendar } from 'lucide-react';
import { Button } from '../../../components/ui/button';
import { useAppSelector } from '../../../store';
import { useToast } from '../../../hooks/useToast';
import ipdService from '../../../services/ipd.service';
import type { Admission, DoctorRound } from '../types';
import { format } from 'date-fns';

interface Props {
  admission: Admission;
}

export default function DoctorRoundsTab({ admission }: Props) {
  const { user } = useAppSelector((s) => s.auth);
  const { toast } = useToast();

  const [rounds, setRounds] = useState<DoctorRound[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [form, setForm] = useState({
    clinical_notes: '',
    treatment_plan: '',
    orders: '',
    follow_up_instructions: '',
  });

  useEffect(() => {
    loadRounds();
  }, [admission.id]);

  const loadRounds = async () => {
    try {
      const data = await ipdService.getDoctorRounds(admission.id);
      setRounds(data);
    } catch {
      toast('Error', { description: 'Failed to load rounds', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!form.clinical_notes.trim()) {
      toast('Enter Notes', { description: 'Please enter clinical notes', type: 'error' });
      return;
    }

    setSubmitting(true);
    try {
      await ipdService.addDoctorRound(
        admission.id,
        {
          clinical_notes: form.clinical_notes || null,
          treatment_plan: form.treatment_plan || null,
          orders: form.orders || null,
          follow_up_instructions: form.follow_up_instructions || null,
        },
        user?.id ?? ''
      );
      toast('Round Added', { type: 'success' });
      setShowForm(false);
      setForm({
        clinical_notes: '',
        treatment_plan: '',
        orders: '',
        follow_up_instructions: '',
      });
      loadRounds();
    } catch {
      toast('Error', { description: 'Failed to add round', type: 'error' });
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-32">
        <Loader2 className="w-5 h-5 animate-spin text-gray-400" />
      </div>
    );
  }

  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-semibold text-gray-700">Doctor Rounds</h4>
        <Button
          size="sm"
          onClick={() => setShowForm(!showForm)}
          className="gap-1.5 h-7 text-xs bg-blue-600 hover:bg-blue-700"
        >
          <Plus className="w-3.5 h-3.5" />
          Add Round
        </Button>
      </div>

      {showForm && (
        <div className="p-4 bg-blue-50 rounded-xl border border-blue-100 space-y-3">
          <div>
            <label className="text-[10px] text-gray-500 uppercase tracking-wide block mb-1">
              Clinical Notes *
            </label>
            <textarea
              value={form.clinical_notes}
              onChange={(e) => setForm({ ...form, clinical_notes: e.target.value })}
              placeholder="Patient condition, observations..."
              rows={2}
              className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm outline-none focus:border-blue-400 resize-none"
            />
          </div>

          <div>
            <label className="text-[10px] text-gray-500 uppercase tracking-wide block mb-1">
              Treatment Plan
            </label>
            <textarea
              value={form.treatment_plan}
              onChange={(e) => setForm({ ...form, treatment_plan: e.target.value })}
              placeholder="Treatment modifications, procedures..."
              rows={2}
              className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm outline-none focus:border-blue-400 resize-none"
            />
          </div>

          <div>
            <label className="text-[10px] text-gray-500 uppercase tracking-wide block mb-1">
              New Orders
            </label>
            <textarea
              value={form.orders}
              onChange={(e) => setForm({ ...form, orders: e.target.value })}
              placeholder="Medication changes, investigations..."
              rows={2}
              className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm outline-none focus:border-blue-400 resize-none"
            />
          </div>

          <div>
            <label className="text-[10px] text-gray-500 uppercase tracking-wide block mb-1">
              Follow-up Instructions
            </label>
            <input
              type="text"
              value={form.follow_up_instructions}
              onChange={(e) => setForm({ ...form, follow_up_instructions: e.target.value })}
              placeholder="Next round timing, special monitoring..."
              className="w-full h-9 px-3 rounded-xl border border-gray-200 text-sm outline-none focus:border-blue-400"
            />
          </div>

          <div className="flex justify-end gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => setShowForm(false)}
              disabled={submitting}
            >
              Cancel
            </Button>
            <Button
              size="sm"
              onClick={handleSubmit}
              disabled={submitting}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Save Round'}
            </Button>
          </div>
        </div>
      )}

      {rounds.length === 0 ? (
        <div className="text-center py-8 text-gray-400 text-sm">
          No doctor rounds recorded yet
        </div>
      ) : (
        <div className="space-y-3">
          {rounds.map((round) => (
            <div key={round.id} className="p-3 bg-white rounded-xl border border-gray-100">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Calendar className="w-3.5 h-3.5 text-gray-400" />
                  <span className="text-xs font-medium text-gray-700">
                    {format(new Date(round.round_date), 'dd MMM yyyy')}
                  </span>
                  {round.round_time && (
                    <span className="text-xs text-gray-500">
                      {round.round_time.slice(0, 5)}
                    </span>
                  )}
                </div>
                {round.doctor_name && (
                  <div className="flex items-center gap-1.5">
                    <User className="w-3 h-3 text-gray-400" />
                    <span className="text-xs text-gray-500">Dr. {round.doctor_name}</span>
                  </div>
                )}
              </div>

              {round.clinical_notes && (
                <div className="mb-2">
                  <div className="text-[10px] text-gray-400 uppercase tracking-wide mb-1">
                    Clinical Notes
                  </div>
                  <p className="text-sm text-gray-700 whitespace-pre-wrap">
                    {round.clinical_notes}
                  </p>
                </div>
              )}

              {round.treatment_plan && (
                <div className="mb-2 pt-2 border-t border-gray-100">
                  <div className="text-[10px] text-gray-400 uppercase tracking-wide mb-1">
                    Treatment Plan
                  </div>
                  <p className="text-sm text-gray-700 whitespace-pre-wrap">
                    {round.treatment_plan}
                  </p>
                </div>
              )}

              {round.orders && (
                <div className="mb-2 pt-2 border-t border-gray-100">
                  <div className="text-[10px] text-gray-400 uppercase tracking-wide mb-1">
                    Orders
                  </div>
                  <p className="text-sm text-blue-700 bg-blue-50 rounded px-2 py-1 whitespace-pre-wrap">
                    {round.orders}
                  </p>
                </div>
              )}

              {round.follow_up_instructions && (
                <div className="pt-2 border-t border-gray-100">
                  <div className="text-[10px] text-gray-400 uppercase tracking-wide mb-1">
                    Follow-up
                  </div>
                  <p className="text-xs text-gray-600">{round.follow_up_instructions}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
