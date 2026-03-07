import { useEffect, useCallback } from 'react';
import { AlertTriangle, Activity, Droplets, Scale, Heart } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/card';
import type { VitalsFormData, VitalStatus } from './types';
import { VITAL_RANGES, getVitalStatus, getBMICategory } from './types';

interface Props {
  form: VitalsFormData;
  errors: Partial<Record<keyof VitalsFormData, string>>;
  onChange: (field: keyof VitalsFormData, value: string | number) => void;
}

const STATUS_RING: Record<VitalStatus, string> = {
  normal:   'border-gray-200 focus:border-blue-400 focus:ring-blue-100',
  warning:  'border-amber-400 focus:border-amber-500 focus:ring-amber-100 bg-amber-50',
  critical: 'border-red-500 focus:border-red-600 focus:ring-red-100 bg-red-50',
};

const STATUS_BADGE: Record<VitalStatus, string> = {
  normal:   '',
  warning:  'text-amber-700 bg-amber-50 border-amber-200',
  critical: 'text-red-700 bg-red-50 border-red-200',
};

function VitalInput({
  label,
  field,
  value,
  unit,
  step,
  placeholder,
  onChange,
}: {
  label: string;
  field: string;
  value: string;
  unit: string;
  step?: string;
  placeholder?: string;
  onChange: (val: string) => void;
}) {
  const numVal = parseFloat(value);
  const status: VitalStatus = value && !isNaN(numVal) ? getVitalStatus(field, numVal) : 'normal';
  const range = VITAL_RANGES[field];

  return (
    <div className="space-y-1.5">
      <label className="text-xs font-semibold text-gray-600 uppercase tracking-wide">{label}</label>
      <div className="relative">
        <input
          type="number"
          step={step ?? '1'}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder ?? (range ? `${range.min}–${range.max}` : '')}
          className={`w-full h-10 pl-3 pr-14 rounded-lg border text-sm font-medium transition-all outline-none focus:ring-2 ${STATUS_RING[status]}`}
        />
        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400 font-medium pointer-events-none">
          {unit}
        </span>
      </div>
      {status !== 'normal' && range && (
        <p className={`text-xs px-2 py-0.5 rounded border font-medium inline-block ${STATUS_BADGE[status]}`}>
          {status === 'critical' ? 'Critical' : 'Abnormal'} — Normal: {range.min}–{range.max} {range.unit}
        </p>
      )}
    </div>
  );
}

export default function VitalsForm({ form, errors, onChange }: Props) {
  const height = parseFloat(form.height);
  const weight = parseFloat(form.weight);

  useEffect(() => {
    if (height > 0 && weight > 0) {
      const hm = height / 100;
      const bmi = (weight / (hm * hm)).toFixed(1);
      onChange('bmi', bmi);
    } else {
      onChange('bmi', '');
    }
  }, [form.height, form.weight]);

  const bmiNum = parseFloat(form.bmi);
  const bmiCat = !isNaN(bmiNum) && bmiNum > 0 ? getBMICategory(bmiNum) : null;

  const abnormalFields = Object.entries(VITAL_RANGES).filter(([field]) => {
    const map: Record<string, string> = {
      systolicBp: form.systolicBp,
      diastolicBp: form.diastolicBp,
      heartRate: form.heartRate,
      respiratoryRate: form.respiratoryRate,
      temperature: form.temperature,
      spo2: form.spo2,
    };
    const val = parseFloat(map[field] ?? '');
    return !isNaN(val) && getVitalStatus(field, val) !== 'normal';
  });
  const hasCritical = abnormalFields.some(([field]) => {
    const map: Record<string, string> = {
      systolicBp: form.systolicBp,
      diastolicBp: form.diastolicBp,
      heartRate: form.heartRate,
      respiratoryRate: form.respiratoryRate,
      temperature: form.temperature,
      spo2: form.spo2,
    };
    return getVitalStatus(field, parseFloat(map[field] ?? '')) === 'critical';
  });

  const handlePainScale = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    onChange('painScale', parseInt(e.target.value));
  }, [onChange]);

  const painColor = (v: number) => {
    if (v === 0) return 'text-gray-400';
    if (v <= 3) return 'text-emerald-600';
    if (v <= 6) return 'text-amber-600';
    return 'text-red-600';
  };

  const painLabel = (v: number) => {
    if (v === 0) return 'No Pain';
    if (v <= 2) return 'Mild';
    if (v <= 4) return 'Moderate';
    if (v <= 6) return 'Moderate-Severe';
    if (v <= 8) return 'Severe';
    return 'Worst Pain';
  };

  return (
    <div className="space-y-5">
      {abnormalFields.length > 0 && (
        <div className={`flex items-start gap-3 p-3.5 rounded-xl border ${hasCritical ? 'bg-red-50 border-red-200' : 'bg-amber-50 border-amber-200'}`}>
          <AlertTriangle className={`w-4 h-4 mt-0.5 shrink-0 ${hasCritical ? 'text-red-600' : 'text-amber-600'}`} />
          <div>
            <p className={`text-sm font-semibold ${hasCritical ? 'text-red-800' : 'text-amber-800'}`}>
              {hasCritical ? 'Critical vitals detected — immediate attention required' : 'Abnormal vitals — please review'}
            </p>
            <p className={`text-xs mt-0.5 ${hasCritical ? 'text-red-600' : 'text-amber-600'}`}>
              {abnormalFields.length} parameter{abnormalFields.length > 1 ? 's' : ''} outside normal range
            </p>
          </div>
        </div>
      )}

      <Card className="border border-gray-100 shadow-sm">
        <CardHeader className="pb-3 pt-4 px-5">
          <CardTitle className="text-sm font-semibold text-gray-700 flex items-center gap-2">
            <Heart className="w-4 h-4 text-red-500" />
            Cardiovascular
          </CardTitle>
        </CardHeader>
        <CardContent className="px-5 pb-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Blood Pressure</label>
              <div className="flex items-center gap-2">
                <div className="relative flex-1">
                  {(() => {
                    const s = parseFloat(form.systolicBp);
                    const st: VitalStatus = form.systolicBp && !isNaN(s) ? getVitalStatus('systolicBp', s) : 'normal';
                    return (
                      <input
                        type="number"
                        value={form.systolicBp}
                        onChange={(e) => onChange('systolicBp', e.target.value)}
                        placeholder="120"
                        className={`w-full h-10 pl-3 pr-3 rounded-lg border text-sm font-medium transition-all outline-none focus:ring-2 ${STATUS_RING[st]}`}
                      />
                    );
                  })()}
                </div>
                <span className="text-gray-400 font-bold text-lg">/</span>
                <div className="relative flex-1">
                  {(() => {
                    const d = parseFloat(form.diastolicBp);
                    const st: VitalStatus = form.diastolicBp && !isNaN(d) ? getVitalStatus('diastolicBp', d) : 'normal';
                    return (
                      <input
                        type="number"
                        value={form.diastolicBp}
                        onChange={(e) => onChange('diastolicBp', e.target.value)}
                        placeholder="80"
                        className={`w-full h-10 pl-3 pr-3 rounded-lg border text-sm font-medium transition-all outline-none focus:ring-2 ${STATUS_RING[st]}`}
                      />
                    );
                  })()}
                </div>
                <span className="text-xs text-gray-400 font-medium shrink-0">mmHg</span>
              </div>
              {(form.systolicBp || form.diastolicBp) && (() => {
                const sys = parseFloat(form.systolicBp);
                const dia = parseFloat(form.diastolicBp);
                const sSt = !isNaN(sys) ? getVitalStatus('systolicBp', sys) : 'normal';
                const dSt = !isNaN(dia) ? getVitalStatus('diastolicBp', dia) : 'normal';
                const worst = sSt === 'critical' || dSt === 'critical' ? 'critical' : sSt === 'warning' || dSt === 'warning' ? 'warning' : 'normal';
                if (worst === 'normal') return null;
                return (
                  <p className={`text-xs px-2 py-0.5 rounded border font-medium inline-block ${STATUS_BADGE[worst]}`}>
                    {worst === 'critical' ? 'Critical' : 'Abnormal'} — Normal: 90–140 / 60–90 mmHg
                  </p>
                );
              })()}
            </div>

            <VitalInput
              label="Heart Rate"
              field="heartRate"
              value={form.heartRate}
              unit="bpm"
              placeholder="72"
              onChange={(v) => onChange('heartRate', v)}
            />
          </div>
        </CardContent>
      </Card>

      <Card className="border border-gray-100 shadow-sm">
        <CardHeader className="pb-3 pt-4 px-5">
          <CardTitle className="text-sm font-semibold text-gray-700 flex items-center gap-2">
            <Activity className="w-4 h-4 text-blue-500" />
            Respiratory & Temperature
          </CardTitle>
        </CardHeader>
        <CardContent className="px-5 pb-5">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <VitalInput
              label="Respiratory Rate"
              field="respiratoryRate"
              value={form.respiratoryRate}
              unit="/min"
              placeholder="16"
              onChange={(v) => onChange('respiratoryRate', v)}
            />
            <VitalInput
              label="Temperature"
              field="temperature"
              value={form.temperature}
              unit="°C"
              step="0.1"
              placeholder="37.0"
              onChange={(v) => onChange('temperature', v)}
            />
            <VitalInput
              label="SpO₂"
              field="spo2"
              value={form.spo2}
              unit="%"
              placeholder="98"
              onChange={(v) => onChange('spo2', v)}
            />
          </div>
        </CardContent>
      </Card>

      <Card className="border border-gray-100 shadow-sm">
        <CardHeader className="pb-3 pt-4 px-5">
          <CardTitle className="text-sm font-semibold text-gray-700 flex items-center gap-2">
            <Scale className="w-4 h-4 text-emerald-500" />
            Anthropometry
          </CardTitle>
        </CardHeader>
        <CardContent className="px-5 pb-5">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Height</label>
              <div className="relative">
                <input
                  type="number"
                  step="0.1"
                  value={form.height}
                  onChange={(e) => onChange('height', e.target.value)}
                  placeholder="170"
                  className="w-full h-10 pl-3 pr-10 rounded-lg border border-gray-200 focus:border-blue-400 focus:ring-2 focus:ring-blue-100 text-sm font-medium outline-none transition-all"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400 font-medium">cm</span>
              </div>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Weight</label>
              <div className="relative">
                <input
                  type="number"
                  step="0.1"
                  value={form.weight}
                  onChange={(e) => onChange('weight', e.target.value)}
                  placeholder="70"
                  className="w-full h-10 pl-3 pr-10 rounded-lg border border-gray-200 focus:border-blue-400 focus:ring-2 focus:ring-blue-100 text-sm font-medium outline-none transition-all"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400 font-medium">kg</span>
              </div>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-gray-600 uppercase tracking-wide">BMI (Auto)</label>
              <div className="relative">
                <input
                  type="text"
                  value={form.bmi}
                  readOnly
                  placeholder="—"
                  className="w-full h-10 pl-3 pr-16 rounded-lg border border-gray-100 bg-gray-50 text-sm font-medium text-gray-600 cursor-not-allowed outline-none"
                />
                {bmiCat && (
                  <span className={`absolute right-2 top-1/2 -translate-y-1/2 text-xs font-semibold ${bmiCat.color}`}>
                    {bmiCat.label}
                  </span>
                )}
              </div>
              {form.bmi && (
                <div className="flex gap-1 mt-1 flex-wrap">
                  {[
                    { label: '<18.5', color: 'bg-blue-100 text-blue-700', active: bmiNum < 18.5 },
                    { label: '18.5–24.9', color: 'bg-emerald-100 text-emerald-700', active: bmiNum >= 18.5 && bmiNum < 25 },
                    { label: '25–29.9', color: 'bg-amber-100 text-amber-700', active: bmiNum >= 25 && bmiNum < 30 },
                    { label: '≥30', color: 'bg-red-100 text-red-700', active: bmiNum >= 30 },
                  ].map((b) => (
                    <span key={b.label} className={`text-xs px-1.5 py-0.5 rounded font-medium transition-all ${b.active ? b.color : 'bg-gray-100 text-gray-300'}`}>
                      {b.label}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="border border-gray-100 shadow-sm">
        <CardHeader className="pb-3 pt-4 px-5">
          <CardTitle className="text-sm font-semibold text-gray-700 flex items-center gap-2">
            <Droplets className="w-4 h-4 text-sky-500" />
            Additional Parameters
          </CardTitle>
        </CardHeader>
        <CardContent className="px-5 pb-5 space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Blood Glucose</label>
              <div className="relative">
                <input
                  type="number"
                  step="0.1"
                  value={form.bloodGlucoseLevel}
                  onChange={(e) => onChange('bloodGlucoseLevel', e.target.value)}
                  placeholder="Normal: 70–100 (fasting)"
                  className="w-full h-10 pl-3 pr-16 rounded-lg border border-gray-200 focus:border-blue-400 focus:ring-2 focus:ring-blue-100 text-sm font-medium outline-none transition-all"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400 font-medium">mg/dL</span>
              </div>
            </div>
            <div />
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Pain Scale</label>
              <div className="flex items-center gap-2">
                <span className={`text-2xl font-bold tabular-nums ${painColor(form.painScale)}`}>
                  {form.painScale}
                </span>
                <span className={`text-xs font-medium ${painColor(form.painScale)}`}>
                  {painLabel(form.painScale)}
                </span>
              </div>
            </div>
            <div className="relative pt-1">
              <input
                type="range"
                min={0}
                max={10}
                step={1}
                value={form.painScale}
                onChange={handlePainScale}
                className="w-full h-2 rounded-full appearance-none cursor-pointer accent-blue-600"
                style={{
                  background: `linear-gradient(to right, #3b82f6 0%, #3b82f6 ${form.painScale * 10}%, #e5e7eb ${form.painScale * 10}%, #e5e7eb 100%)`,
                }}
              />
              <div className="flex justify-between mt-1.5">
                {Array.from({ length: 11 }, (_, i) => (
                  <span key={i} className={`text-xs w-4 text-center font-medium ${i === form.painScale ? painColor(form.painScale) : 'text-gray-300'}`}>
                    {i}
                  </span>
                ))}
              </div>
              <div className="flex justify-between mt-0.5 text-xs text-gray-400">
                <span>No pain</span>
                <span>Worst</span>
              </div>
            </div>
            <div className="flex gap-1.5 flex-wrap mt-1">
              {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((v) => (
                <button
                  key={v}
                  type="button"
                  onClick={() => onChange('painScale', v)}
                  className={`w-7 h-7 rounded-lg text-xs font-bold transition-all ${
                    form.painScale === v
                      ? v <= 3 ? 'bg-emerald-500 text-white'
                        : v <= 6 ? 'bg-amber-500 text-white'
                        : 'bg-red-500 text-white'
                      : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                  }`}
                >
                  {v}
                </button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="border border-gray-100 shadow-sm">
        <CardContent className="px-5 py-4">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Clinical Notes</label>
            <textarea
              value={form.notes}
              onChange={(e) => onChange('notes', e.target.value)}
              placeholder="Additional observations, context, or nursing notes…"
              rows={3}
              className="w-full rounded-lg border border-gray-200 focus:border-blue-400 focus:ring-2 focus:ring-blue-100 text-sm px-3 py-2.5 outline-none transition-all resize-none"
            />
          </div>
        </CardContent>
      </Card>

      {errors.painScale && (
        <p className="text-xs text-red-600">{errors.painScale}</p>
      )}
    </div>
  );
}
