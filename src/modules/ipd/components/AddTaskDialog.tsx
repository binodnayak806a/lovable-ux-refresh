import { useState } from 'react';
import { X, Loader2 } from 'lucide-react';
import { Button } from '../../../components/ui/button';
import { useAppSelector } from '../../../store';
import { useToast } from '../../../hooks/useToast';
import ipdService from '../../../services/ipd.service';
import type { Admission, TaskFormData, TaskType, TaskPriority, TaskRecurrence } from '../types';
import { EMPTY_TASK_FORM } from '../types';

interface Props {
  admission: Admission;
  onClose: () => void;
  onSuccess: () => void;
}

const TASK_TYPES: Array<{ value: TaskType; label: string }> = [
  { value: 'Vitals', label: 'Vitals Check' },
  { value: 'Medication', label: 'Medication' },
  { value: 'Dressing', label: 'Dressing Change' },
  { value: 'Observation', label: 'Observation' },
  { value: 'Lab', label: 'Lab Sample' },
  { value: 'Procedure', label: 'Procedure' },
  { value: 'Other', label: 'Other' },
];

const PRIORITIES: Array<{ value: TaskPriority; label: string; color: string }> = [
  { value: 'low', label: 'Low', color: 'border-gray-300 text-gray-600' },
  { value: 'normal', label: 'Normal', color: 'border-blue-300 text-blue-600' },
  { value: 'high', label: 'High', color: 'border-amber-300 text-amber-600' },
  { value: 'urgent', label: 'Urgent', color: 'border-red-300 text-red-600' },
];

const RECURRENCES: Array<{ value: TaskRecurrence; label: string }> = [
  { value: 'once', label: 'Once' },
  { value: 'daily', label: 'Daily' },
  { value: 'every-4-hours', label: 'Every 4 hours' },
  { value: 'every-6-hours', label: 'Every 6 hours' },
  { value: 'every-8-hours', label: 'Every 8 hours' },
  { value: 'every-12-hours', label: 'Every 12 hours' },
];

const QUICK_TASKS: Array<{ type: TaskType; description: string }> = [
  { type: 'Vitals', description: 'Record vital signs' },
  { type: 'Medication', description: 'Administer medication' },
  { type: 'Observation', description: 'Patient observation' },
  { type: 'Lab', description: 'Collect blood sample' },
];

export default function AddTaskDialog({ admission, onClose, onSuccess }: Props) {
  const { user } = useAppSelector((s) => s.auth);
  const { toast } = useToast();

  const [form, setForm] = useState<TaskFormData>({
    ...EMPTY_TASK_FORM,
    scheduled_time: getDefaultScheduledTime(),
  });
  const [submitting, setSubmitting] = useState(false);

  function getDefaultScheduledTime(): string {
    const now = new Date();
    now.setMinutes(Math.ceil(now.getMinutes() / 15) * 15, 0, 0);
    return now.toISOString();
  }

  const handleChange = (field: keyof TaskFormData, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleQuickTask = (task: { type: TaskType; description: string }) => {
    setForm((prev) => ({
      ...prev,
      task_type: task.type,
      task_description: task.description,
    }));
  };

  const handleTimeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const [hours, minutes] = e.target.value.split(':');
    const date = new Date();
    date.setHours(parseInt(hours), parseInt(minutes), 0, 0);
    setForm((prev) => ({ ...prev, scheduled_time: date.toISOString() }));
  };

  const handleSubmit = async () => {
    if (!form.task_description.trim()) {
      toast('Description Required', { description: 'Please enter task description', type: 'error' });
      return;
    }

    setSubmitting(true);
    try {
      await ipdService.createNursingTask(admission.id, form, user?.id ?? '');
      toast('Task Added', { type: 'success' });
      onSuccess();
    } catch {
      toast('Error', { description: 'Failed to create task', type: 'error' });
    } finally {
      setSubmitting(false);
    }
  };

  const currentTime = new Date(form.scheduled_time);
  const timeValue = `${currentTime.getHours().toString().padStart(2, '0')}:${currentTime.getMinutes().toString().padStart(2, '0')}`;

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md">
        <div className="flex items-center justify-between px-5 py-4 border-b">
          <h3 className="font-semibold text-gray-800">Add Nursing Task</h3>
          <button
            type="button"
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-4 h-4 text-gray-500" />
          </button>
        </div>

        <div className="p-5 space-y-4">
          <div className="space-y-2">
            <label className="text-xs font-semibold text-gray-600 uppercase tracking-wide">
              Quick Add
            </label>
            <div className="flex flex-wrap gap-2">
              {QUICK_TASKS.map((task) => (
                <button
                  key={task.description}
                  type="button"
                  onClick={() => handleQuickTask(task)}
                  className="px-3 py-1.5 rounded-lg border border-gray-200 text-xs text-gray-600 hover:bg-gray-50 hover:border-gray-300 transition-colors"
                >
                  + {task.description}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-semibold text-gray-600 uppercase tracking-wide">
              Task Type
            </label>
            <select
              value={form.task_type}
              onChange={(e) => handleChange('task_type', e.target.value)}
              className="w-full h-10 px-3 rounded-xl border border-gray-200 text-sm outline-none focus:border-blue-400"
            >
              {TASK_TYPES.map((t) => (
                <option key={t.value} value={t.value}>{t.label}</option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-semibold text-gray-600 uppercase tracking-wide">
              Description
            </label>
            <textarea
              value={form.task_description}
              onChange={(e) => handleChange('task_description', e.target.value)}
              placeholder="Task description..."
              rows={2}
              className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm outline-none focus:border-blue-400 resize-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-xs font-semibold text-gray-600 uppercase tracking-wide">
                Scheduled Time
              </label>
              <input
                type="time"
                value={timeValue}
                onChange={handleTimeChange}
                className="w-full h-10 px-3 rounded-xl border border-gray-200 text-sm outline-none focus:border-blue-400"
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-semibold text-gray-600 uppercase tracking-wide">
                Recurrence
              </label>
              <select
                value={form.recurrence}
                onChange={(e) => handleChange('recurrence', e.target.value)}
                className="w-full h-10 px-3 rounded-xl border border-gray-200 text-sm outline-none focus:border-blue-400"
              >
                {RECURRENCES.map((r) => (
                  <option key={r.value} value={r.value}>{r.label}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-semibold text-gray-600 uppercase tracking-wide">
              Priority
            </label>
            <div className="grid grid-cols-4 gap-2">
              {PRIORITIES.map((p) => (
                <button
                  key={p.value}
                  type="button"
                  onClick={() => handleChange('priority', p.value)}
                  className={`py-2 rounded-lg border text-xs font-medium transition-colors ${
                    form.priority === p.value
                      ? `${p.color} border-2 bg-opacity-10`
                      : 'border-gray-200 text-gray-500 hover:bg-gray-50'
                  }`}
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-semibold text-gray-600 uppercase tracking-wide">
              Notes (Optional)
            </label>
            <input
              type="text"
              value={form.notes}
              onChange={(e) => handleChange('notes', e.target.value)}
              placeholder="Additional notes..."
              className="w-full h-10 px-4 rounded-xl border border-gray-200 text-sm outline-none focus:border-blue-400"
            />
          </div>
        </div>

        <div className="px-5 py-4 border-t bg-gray-50 flex justify-end gap-3">
          <Button variant="outline" onClick={onClose} disabled={submitting}>
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={submitting}
            className="bg-blue-600 hover:bg-blue-700 gap-2"
          >
            {submitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Adding...
              </>
            ) : (
              'Add Task'
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
