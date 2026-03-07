import { useState, useEffect, useRef } from 'react';
import { Plus, Loader2, FileText, Calendar, Printer } from 'lucide-react';
import { format } from 'date-fns';
import { useReactToPrint } from 'react-to-print';
import { Button } from '../../../components/ui/button';
import { Badge } from '../../../components/ui/badge';
import { useAppSelector } from '../../../store';
import { useToast } from '../../../hooks/useToast';
import ipdService from '../../../services/ipd.service';
import type { Admission, IpdDailyNote } from '../types';

interface Props {
  admission: Admission;
}

export default function DailyNotesTab({ admission }: Props) {
  const { user } = useAppSelector(s => s.auth);
  const { toast } = useToast();

  const [notes, setNotes] = useState<IpdDailyNote[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);

  const [noteDate, setNoteDate] = useState(new Date().toISOString().split('T')[0]);
  const [observations, setObservations] = useState('');
  const [plan, setPlan] = useState('');
  const [vitals, setVitals] = useState({
    bp: '', hr: '', temp: '', spo2: '', rr: '',
  });

  const printRef = useRef<HTMLDivElement>(null);
  const handlePrint = useReactToPrint({ content: () => printRef.current });

  const loadNotes = async () => {
    try {
      const data = await ipdService.getDailyNotes(admission.id);
      setNotes(data);
    } catch {
      toast('Error', { description: 'Failed to load notes', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadNotes(); }, [admission.id]);

  const handleSave = async () => {
    if (!observations.trim() && !plan.trim()) {
      toast('Enter Notes', { description: 'Please add observations or plan', type: 'error' });
      return;
    }
    setSaving(true);
    try {
      await ipdService.addDailyNote(
        admission.id,
        user?.id ?? '',
        noteDate,
        observations,
        plan,
        vitals
      );
      toast('Note Added', { type: 'success' });
      setShowForm(false);
      setObservations('');
      setPlan('');
      setVitals({ bp: '', hr: '', temp: '', spo2: '', rr: '' });
      loadNotes();
    } catch {
      toast('Error', { description: 'Failed to save note', type: 'error' });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center h-32"><Loader2 className="w-5 h-5 animate-spin text-gray-400" /></div>;
  }

  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-semibold text-gray-700">Daily Visit Notes</h4>
        <div className="flex items-center gap-2">
          {notes.length > 0 && (
            <Button variant="outline" size="sm" onClick={() => handlePrint()} className="h-7 gap-1 text-xs">
              <Printer className="w-3.5 h-3.5" /> Print All
            </Button>
          )}
          <Button size="sm" onClick={() => setShowForm(!showForm)} className="h-7 gap-1 text-xs bg-blue-600 hover:bg-blue-700">
            <Plus className="w-3.5 h-3.5" /> Add Note
          </Button>
        </div>
      </div>

      {showForm && (
        <div className="bg-blue-50/50 border border-blue-100 rounded-xl p-4 space-y-3">
          <div className="flex items-center gap-3">
            <div>
              <label className="text-xs text-gray-500 block mb-1">Date</label>
              <input type="date" value={noteDate} onChange={e => setNoteDate(e.target.value)}
                className="h-8 px-2 rounded-lg border border-gray-200 text-xs outline-none focus:border-blue-400" />
            </div>
          </div>

          <div className="grid grid-cols-5 gap-2">
            {[
              { key: 'bp', label: 'BP', placeholder: '120/80' },
              { key: 'hr', label: 'HR', placeholder: '72' },
              { key: 'temp', label: 'Temp', placeholder: '98.6' },
              { key: 'spo2', label: 'SpO2', placeholder: '98%' },
              { key: 'rr', label: 'RR', placeholder: '16' },
            ].map(v => (
              <div key={v.key}>
                <label className="text-[10px] text-gray-500 block mb-0.5">{v.label}</label>
                <input
                  value={vitals[v.key as keyof typeof vitals]}
                  onChange={e => setVitals(prev => ({ ...prev, [v.key]: e.target.value }))}
                  placeholder={v.placeholder}
                  className="w-full h-7 px-2 rounded-lg border border-gray-200 text-xs outline-none focus:border-blue-400"
                />
              </div>
            ))}
          </div>

          <div>
            <label className="text-xs text-gray-500 block mb-1">Observations</label>
            <textarea value={observations} onChange={e => setObservations(e.target.value)}
              placeholder="Clinical observations, patient condition..." rows={3}
              className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm outline-none focus:border-blue-400 resize-none" />
          </div>

          <div>
            <label className="text-xs text-gray-500 block mb-1">Plan</label>
            <textarea value={plan} onChange={e => setPlan(e.target.value)}
              placeholder="Treatment plan, orders, follow-up..." rows={3}
              className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm outline-none focus:border-blue-400 resize-none" />
          </div>

          <div className="flex justify-end gap-2">
            <Button variant="outline" size="sm" onClick={() => setShowForm(false)} className="h-8 text-xs">Cancel</Button>
            <Button size="sm" onClick={handleSave} disabled={saving} className="h-8 text-xs bg-blue-600 hover:bg-blue-700">
              {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : 'Save Note'}
            </Button>
          </div>
        </div>
      )}

      {notes.length === 0 ? (
        <div className="text-center py-8 text-gray-400">
          <FileText className="w-10 h-10 mx-auto mb-2 opacity-30" />
          <p className="text-sm">No daily notes yet</p>
        </div>
      ) : (
        <div className="space-y-3">
          {notes.map(note => {
            const v = note.vitals as Record<string, string>;
            return (
              <div key={note.id} className="bg-white border border-gray-100 rounded-xl p-3.5">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-3.5 h-3.5 text-blue-500" />
                    <span className="text-xs font-semibold text-blue-600">
                      {format(new Date(note.note_date), 'dd MMM yyyy')}
                    </span>
                    {note.doctor_name && (
                      <Badge variant="outline" className="text-[10px] h-5">Dr. {note.doctor_name}</Badge>
                    )}
                  </div>
                  <span className="text-[10px] text-gray-400">
                    {format(new Date(note.created_at), 'hh:mm a')}
                  </span>
                </div>

                {(v?.bp || v?.hr || v?.temp || v?.spo2 || v?.rr) && (
                  <div className="flex items-center gap-3 mb-2 text-[10px] text-gray-500">
                    {v.bp && <span>BP: {v.bp}</span>}
                    {v.hr && <span>HR: {v.hr}</span>}
                    {v.temp && <span>T: {v.temp}</span>}
                    {v.spo2 && <span>SpO2: {v.spo2}</span>}
                    {v.rr && <span>RR: {v.rr}</span>}
                  </div>
                )}

                {note.observations && (
                  <div className="mb-2">
                    <span className="text-[10px] text-gray-400 uppercase font-medium">Observations</span>
                    <p className="text-xs text-gray-700 mt-0.5 whitespace-pre-wrap">{note.observations}</p>
                  </div>
                )}

                {note.plan && (
                  <div>
                    <span className="text-[10px] text-gray-400 uppercase font-medium">Plan</span>
                    <p className="text-xs text-gray-700 mt-0.5 whitespace-pre-wrap">{note.plan}</p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      <div style={{ display: 'none' }}>
        <div ref={printRef} style={{ padding: '32px', fontFamily: 'Arial, sans-serif' }}>
          <div style={{ textAlign: 'center', borderBottom: '2px solid #333', paddingBottom: '12px', marginBottom: '16px' }}>
            <div style={{ fontSize: '18px', fontWeight: 800 }}>CLINICAL NOTES</div>
            <div style={{ fontSize: '11px', color: '#666', marginTop: '4px' }}>
              Patient: {admission.patient?.full_name} | UHID: {admission.patient?.uhid} | Adm#: {admission.admission_number}
            </div>
          </div>
          {notes.map((note, idx) => {
            const v = note.vitals as Record<string, string>;
            return (
              <div key={note.id} style={{ marginBottom: '16px', paddingBottom: '12px', borderBottom: idx < notes.length - 1 ? '1px solid #ddd' : 'none' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', fontWeight: 700, marginBottom: '6px' }}>
                  <span>Date: {format(new Date(note.note_date), 'dd-MMM-yyyy')}</span>
                  <span>Doctor: Dr. {note.doctor_name ?? 'N/A'}</span>
                </div>
                {(v?.bp || v?.hr || v?.temp || v?.spo2 || v?.rr) && (
                  <div style={{ fontSize: '11px', color: '#555', marginBottom: '6px' }}>
                    Vitals: {[v.bp && `BP ${v.bp}`, v.hr && `HR ${v.hr}`, v.temp && `T ${v.temp}`, v.spo2 && `SpO2 ${v.spo2}`, v.rr && `RR ${v.rr}`].filter(Boolean).join(' | ')}
                  </div>
                )}
                {note.observations && (
                  <div style={{ fontSize: '12px', marginBottom: '4px' }}>
                    <strong>Observations:</strong> {note.observations}
                  </div>
                )}
                {note.plan && (
                  <div style={{ fontSize: '12px' }}>
                    <strong>Plan:</strong> {note.plan}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
