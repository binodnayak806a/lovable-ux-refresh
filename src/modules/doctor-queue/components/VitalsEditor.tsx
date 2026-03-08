interface VitalsEditorProps {
  weight: string; onWeightChange: (v: string) => void;
  height: string; onHeightChange: (v: string) => void;
  bp: string; onBpChange: (v: string) => void;
  pulse: string; onPulseChange: (v: string) => void;
  temperature: string; onTemperatureChange: (v: string) => void;
  spo2: string; onSpo2Change: (v: string) => void;
  notes: string; onNotesChange: (v: string) => void;
  examinationNotes: string; onExaminationNotesChange: (v: string) => void;
}

export default function VitalsEditor({
  weight, onWeightChange, height, onHeightChange,
  bp, onBpChange, pulse, onPulseChange,
  temperature, onTemperatureChange, spo2, onSpo2Change,
  notes, onNotesChange, examinationNotes, onExaminationNotesChange,
}: VitalsEditorProps) {
  const cls = "w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary";

  const bmi = weight && height ? (parseFloat(weight) / Math.pow(parseFloat(height) / 100, 2)).toFixed(1) : null;
  const bmiValid = bmi && !isNaN(parseFloat(bmi));

  return (
    <div className="space-y-5">
      <div>
        <h3 className="text-sm font-semibold text-foreground mb-3">Vitals</h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          <div>
            <label className="text-[10px] font-bold text-muted-foreground uppercase mb-1 block">Weight (kg)</label>
            <input value={weight} onChange={e => onWeightChange(e.target.value)} placeholder="60" className={cls} type="number" step="0.1" />
          </div>
          <div>
            <label className="text-[10px] font-bold text-muted-foreground uppercase mb-1 block">Height (cm)</label>
            <input value={height} onChange={e => onHeightChange(e.target.value)} placeholder="152" className={cls} type="number" step="0.1" />
          </div>
          <div>
            <label className="text-[10px] font-bold text-muted-foreground uppercase mb-1 block">BP (mmHg)</label>
            <input value={bp} onChange={e => onBpChange(e.target.value)} placeholder="120/80" className={cls} />
          </div>
          <div>
            <label className="text-[10px] font-bold text-muted-foreground uppercase mb-1 block">Pulse (bpm)</label>
            <input value={pulse} onChange={e => onPulseChange(e.target.value)} placeholder="72" className={cls} type="number" />
          </div>
          <div>
            <label className="text-[10px] font-bold text-muted-foreground uppercase mb-1 block">Temp (°F)</label>
            <input value={temperature} onChange={e => onTemperatureChange(e.target.value)} placeholder="98.6" className={cls} type="number" step="0.1" />
          </div>
          <div>
            <label className="text-[10px] font-bold text-muted-foreground uppercase mb-1 block">SpO₂ (%)</label>
            <input value={spo2} onChange={e => onSpo2Change(e.target.value)} placeholder="98" className={cls} type="number" />
          </div>
        </div>
        {bmiValid && (
          <div className="mt-2 text-xs text-muted-foreground">
            BMI: <span className="font-semibold text-foreground">{bmi}</span>
            <span className="ml-1">
              ({parseFloat(bmi!) < 18.5 ? 'Underweight' : parseFloat(bmi!) < 25 ? 'Normal' : parseFloat(bmi!) < 30 ? 'Overweight' : 'Obese'})
            </span>
          </div>
        )}
      </div>

      <div>
        <h3 className="text-sm font-semibold text-foreground mb-2">Vitals / Observation Notes</h3>
        <textarea value={notes} onChange={e => onNotesChange(e.target.value)} placeholder="Additional vitals observations..." rows={3}
          className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary resize-none" />
      </div>

      <div>
        <h3 className="text-sm font-semibold text-foreground mb-2">Physical Examination</h3>
        <textarea value={examinationNotes} onChange={e => onExaminationNotesChange(e.target.value)} placeholder="Physical examination findings..." rows={5}
          className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary resize-none" />
      </div>
    </div>
  );
}
