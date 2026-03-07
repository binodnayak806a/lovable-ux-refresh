import { useState, useEffect } from 'react';
import { Activity, Plus, Loader2, Heart, Wind, Thermometer, Droplet } from 'lucide-react';
import { Button } from '../../../components/ui/button';
import { Badge } from '../../../components/ui/badge';
import { useAppSelector } from '../../../store';
import { useToast } from '../../../hooks/useToast';
import ipdService from '../../../services/ipd.service';
import type { Admission, IpdVitals } from '../types';
import { format } from 'date-fns';

interface Props {
  admission: Admission;
}

export default function IpdVitalsTab({ admission }: Props) {
  const { user } = useAppSelector((s) => s.auth);
  const { toast } = useToast();

  const [vitals, setVitals] = useState<IpdVitals[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [form, setForm] = useState({
    systolic_bp: '',
    diastolic_bp: '',
    heart_rate: '',
    respiratory_rate: '',
    temperature: '',
    spo2: '',
    blood_glucose: '',
    pain_score: '',
    consciousness_level: 'Alert',
    notes: '',
  });

  useEffect(() => {
    loadVitals();
  }, [admission.id]);

  const loadVitals = async () => {
    try {
      const data = await ipdService.getIpdVitals(admission.id);
      setVitals(data);
    } catch {
      toast('Error', { description: 'Failed to load vitals', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!form.systolic_bp && !form.heart_rate && !form.temperature) {
      toast('Enter Vitals', { description: 'Please enter at least one vital sign', type: 'error' });
      return;
    }

    setSubmitting(true);
    try {
      await ipdService.recordIpdVitals(
        admission.id,
        {
          systolic_bp: form.systolic_bp ? parseInt(form.systolic_bp) : null,
          diastolic_bp: form.diastolic_bp ? parseInt(form.diastolic_bp) : null,
          heart_rate: form.heart_rate ? parseInt(form.heart_rate) : null,
          respiratory_rate: form.respiratory_rate ? parseInt(form.respiratory_rate) : null,
          temperature: form.temperature ? parseFloat(form.temperature) : null,
          spo2: form.spo2 ? parseInt(form.spo2) : null,
          blood_glucose: form.blood_glucose ? parseFloat(form.blood_glucose) : null,
          pain_score: form.pain_score ? parseInt(form.pain_score) : null,
          consciousness_level: form.consciousness_level as IpdVitals['consciousness_level'],
          notes: form.notes || null,
        },
        user?.id ?? ''
      );
      toast('Vitals Recorded', { type: 'success' });
      setShowForm(false);
      setForm({
        systolic_bp: '',
        diastolic_bp: '',
        heart_rate: '',
        respiratory_rate: '',
        temperature: '',
        spo2: '',
        blood_glucose: '',
        pain_score: '',
        consciousness_level: 'Alert',
        notes: '',
      });
      loadVitals();
    } catch {
      toast('Error', { description: 'Failed to record vitals', type: 'error' });
    } finally {
      setSubmitting(false);
    }
  };

  const isAbnormal = (type: string, value: number | null): boolean => {
    if (value === null) return false;
    switch (type) {
      case 'systolic': return value > 140 || value < 90;
      case 'diastolic': return value > 90 || value < 60;
      case 'heart_rate': return value > 100 || value < 60;
      case 'spo2': return value < 95;
      case 'temperature': return value > 38 || value < 36;
      case 'respiratory_rate': return value > 20 || value < 12;
      default: return false;
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
        <h4 className="text-sm font-semibold text-gray-700">Vital Signs</h4>
        <Button
          size="sm"
          onClick={() => setShowForm(!showForm)}
          className="gap-1.5 h-7 text-xs bg-blue-600 hover:bg-blue-700"
        >
          <Plus className="w-3.5 h-3.5" />
          Record Vitals
        </Button>
      </div>

      {showForm && (
        <div className="p-4 bg-blue-50 rounded-xl border border-blue-100 space-y-3">
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="text-[10px] text-gray-500 uppercase">Systolic BP</label>
              <input
                type="number"
                value={form.systolic_bp}
                onChange={(e) => setForm({ ...form, systolic_bp: e.target.value })}
                placeholder="mmHg"
                className="w-full h-8 px-2 rounded border border-gray-200 text-sm"
              />
            </div>
            <div>
              <label className="text-[10px] text-gray-500 uppercase">Diastolic BP</label>
              <input
                type="number"
                value={form.diastolic_bp}
                onChange={(e) => setForm({ ...form, diastolic_bp: e.target.value })}
                placeholder="mmHg"
                className="w-full h-8 px-2 rounded border border-gray-200 text-sm"
              />
            </div>
            <div>
              <label className="text-[10px] text-gray-500 uppercase">Heart Rate</label>
              <input
                type="number"
                value={form.heart_rate}
                onChange={(e) => setForm({ ...form, heart_rate: e.target.value })}
                placeholder="bpm"
                className="w-full h-8 px-2 rounded border border-gray-200 text-sm"
              />
            </div>
            <div>
              <label className="text-[10px] text-gray-500 uppercase">SpO2</label>
              <input
                type="number"
                value={form.spo2}
                onChange={(e) => setForm({ ...form, spo2: e.target.value })}
                placeholder="%"
                className="w-full h-8 px-2 rounded border border-gray-200 text-sm"
              />
            </div>
            <div>
              <label className="text-[10px] text-gray-500 uppercase">Temperature</label>
              <input
                type="number"
                step="0.1"
                value={form.temperature}
                onChange={(e) => setForm({ ...form, temperature: e.target.value })}
                placeholder="°C"
                className="w-full h-8 px-2 rounded border border-gray-200 text-sm"
              />
            </div>
            <div>
              <label className="text-[10px] text-gray-500 uppercase">Resp Rate</label>
              <input
                type="number"
                value={form.respiratory_rate}
                onChange={(e) => setForm({ ...form, respiratory_rate: e.target.value })}
                placeholder="/min"
                className="w-full h-8 px-2 rounded border border-gray-200 text-sm"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[10px] text-gray-500 uppercase">Pain Score (0-10)</label>
              <input
                type="number"
                min="0"
                max="10"
                value={form.pain_score}
                onChange={(e) => setForm({ ...form, pain_score: e.target.value })}
                className="w-full h-8 px-2 rounded border border-gray-200 text-sm"
              />
            </div>
            <div>
              <label className="text-[10px] text-gray-500 uppercase">Consciousness</label>
              <select
                value={form.consciousness_level}
                onChange={(e) => setForm({ ...form, consciousness_level: e.target.value })}
                className="w-full h-8 px-2 rounded border border-gray-200 text-sm"
              >
                <option value="Alert">Alert</option>
                <option value="Verbal">Verbal</option>
                <option value="Pain">Pain</option>
                <option value="Unresponsive">Unresponsive</option>
              </select>
            </div>
          </div>

          <div>
            <label className="text-[10px] text-gray-500 uppercase">Notes</label>
            <input
              type="text"
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
              placeholder="Additional notes..."
              className="w-full h-8 px-2 rounded border border-gray-200 text-sm"
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
              {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Save'}
            </Button>
          </div>
        </div>
      )}

      {vitals.length === 0 ? (
        <div className="text-center py-8 text-gray-400 text-sm">
          No vitals recorded yet
        </div>
      ) : (
        <div className="space-y-3">
          {vitals.map((v) => (
            <div key={v.id} className="p-3 bg-gray-50 rounded-xl border border-gray-100">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-gray-500">
                  {format(new Date(v.recorded_at), 'dd MMM HH:mm')}
                </span>
                {v.consciousness_level && (
                  <Badge className="text-[10px] bg-gray-200 text-gray-600">
                    {v.consciousness_level}
                  </Badge>
                )}
              </div>

              <div className="grid grid-cols-3 gap-2 text-xs">
                {v.systolic_bp && v.diastolic_bp && (
                  <VitalItem
                    icon={Heart}
                    label="BP"
                    value={`${v.systolic_bp}/${v.diastolic_bp}`}
                    unit="mmHg"
                    abnormal={isAbnormal('systolic', v.systolic_bp) || isAbnormal('diastolic', v.diastolic_bp)}
                  />
                )}
                {v.heart_rate && (
                  <VitalItem
                    icon={Activity}
                    label="HR"
                    value={v.heart_rate}
                    unit="bpm"
                    abnormal={isAbnormal('heart_rate', v.heart_rate)}
                  />
                )}
                {v.spo2 && (
                  <VitalItem
                    icon={Droplet}
                    label="SpO2"
                    value={v.spo2}
                    unit="%"
                    abnormal={isAbnormal('spo2', v.spo2)}
                  />
                )}
                {v.temperature && (
                  <VitalItem
                    icon={Thermometer}
                    label="Temp"
                    value={v.temperature}
                    unit="°C"
                    abnormal={isAbnormal('temperature', v.temperature)}
                  />
                )}
                {v.respiratory_rate && (
                  <VitalItem
                    icon={Wind}
                    label="RR"
                    value={v.respiratory_rate}
                    unit="/min"
                    abnormal={isAbnormal('respiratory_rate', v.respiratory_rate)}
                  />
                )}
                {v.pain_score !== null && (
                  <div className="flex items-center gap-1.5">
                    <span className="text-gray-500">Pain:</span>
                    <span className={`font-medium ${v.pain_score > 5 ? 'text-red-600' : 'text-gray-700'}`}>
                      {v.pain_score}/10
                    </span>
                  </div>
                )}
              </div>

              {v.notes && (
                <div className="mt-2 pt-2 border-t border-gray-200 text-xs text-gray-500">
                  {v.notes}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function VitalItem({
  icon: Icon,
  label,
  value,
  unit,
  abnormal,
}: {
  icon: React.ElementType;
  label: string;
  value: string | number;
  unit: string;
  abnormal: boolean;
}) {
  return (
    <div className="flex items-center gap-1.5">
      <Icon className={`w-3 h-3 ${abnormal ? 'text-red-500' : 'text-gray-400'}`} />
      <span className="text-gray-500">{label}:</span>
      <span className={`font-medium ${abnormal ? 'text-red-600' : 'text-gray-700'}`}>
        {value}
      </span>
      <span className="text-gray-400">{unit}</span>
    </div>
  );
}
