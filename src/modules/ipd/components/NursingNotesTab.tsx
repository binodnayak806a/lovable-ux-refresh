import { useState, useEffect } from 'react';
import { Plus, Loader2, User } from 'lucide-react';
import { Button } from '../../../components/ui/button';
import { Badge } from '../../../components/ui/badge';
import { useAppSelector } from '../../../store';
import { useToast } from '../../../hooks/useToast';
import ipdService from '../../../services/ipd.service';
import type { Admission, NursingNote, NoteType } from '../types';
import { format } from 'date-fns';

interface Props {
  admission: Admission;
}

const NOTE_TYPES: Array<{ value: NoteType; label: string; color: string }> = [
  { value: 'General', label: 'General', color: 'bg-gray-100 text-gray-700' },
  { value: 'Progress', label: 'Progress', color: 'bg-blue-100 text-blue-700' },
  { value: 'Handover', label: 'Handover', color: 'bg-purple-100 text-purple-700' },
  { value: 'Observation', label: 'Observation', color: 'bg-green-100 text-green-700' },
  { value: 'Procedure', label: 'Procedure', color: 'bg-amber-100 text-amber-700' },
  { value: 'Incident', label: 'Incident', color: 'bg-red-100 text-red-700' },
];

export default function NursingNotesTab({ admission }: Props) {
  const { user } = useAppSelector((s) => s.auth);
  const { toast } = useToast();

  const [notes, setNotes] = useState<NursingNote[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [noteType, setNoteType] = useState<NoteType>('General');
  const [noteText, setNoteText] = useState('');

  useEffect(() => {
    loadNotes();
  }, [admission.id]);

  const loadNotes = async () => {
    try {
      const data = await ipdService.getNursingNotes(admission.id);
      setNotes(data);
    } catch {
      toast('Error', { description: 'Failed to load notes', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!noteText.trim()) {
      toast('Enter Note', { description: 'Please enter note text', type: 'error' });
      return;
    }

    setSubmitting(true);
    try {
      await ipdService.addNursingNote(admission.id, noteType, noteText, user?.id ?? '');
      toast('Note Added', { type: 'success' });
      setShowForm(false);
      setNoteText('');
      setNoteType('General');
      loadNotes();
    } catch {
      toast('Error', { description: 'Failed to add note', type: 'error' });
    } finally {
      setSubmitting(false);
    }
  };

  const getNoteTypeConfig = (type: string) => {
    return NOTE_TYPES.find((t) => t.value === type) || NOTE_TYPES[0];
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
        <h4 className="text-sm font-semibold text-gray-700">Nursing Notes</h4>
        <Button
          size="sm"
          onClick={() => setShowForm(!showForm)}
          className="gap-1.5 h-7 text-xs bg-blue-600 hover:bg-blue-700"
        >
          <Plus className="w-3.5 h-3.5" />
          Add Note
        </Button>
      </div>

      {showForm && (
        <div className="p-4 bg-blue-50 rounded-xl border border-blue-100 space-y-3">
          <div>
            <label className="text-[10px] text-gray-500 uppercase tracking-wide block mb-2">
              Note Type
            </label>
            <div className="flex flex-wrap gap-2">
              {NOTE_TYPES.map((type) => (
                <button
                  key={type.value}
                  type="button"
                  onClick={() => setNoteType(type.value)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                    noteType === type.value
                      ? `${type.color} ring-2 ring-offset-1 ring-blue-400`
                      : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  {type.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-[10px] text-gray-500 uppercase tracking-wide block mb-1">
              Note
            </label>
            <textarea
              value={noteText}
              onChange={(e) => setNoteText(e.target.value)}
              placeholder="Enter nursing note..."
              rows={3}
              className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm outline-none focus:border-blue-400 resize-none"
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
              {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Save Note'}
            </Button>
          </div>
        </div>
      )}

      {notes.length === 0 ? (
        <div className="text-center py-8 text-gray-400 text-sm">
          No nursing notes recorded yet
        </div>
      ) : (
        <div className="space-y-3">
          {notes.map((note) => {
            const typeConfig = getNoteTypeConfig(note.note_type);
            return (
              <div key={note.id} className="p-3 bg-white rounded-xl border border-gray-100">
                <div className="flex items-start justify-between mb-2">
                  <Badge className={`text-[10px] ${typeConfig.color}`}>
                    {typeConfig.label}
                  </Badge>
                  <span className="text-[10px] text-gray-400">
                    {format(new Date(note.created_at), 'dd MMM HH:mm')}
                  </span>
                </div>
                <p className="text-sm text-gray-700 whitespace-pre-wrap">{note.note_text}</p>
                {note.nurse_name && (
                  <div className="flex items-center gap-1.5 mt-2 pt-2 border-t border-gray-100">
                    <User className="w-3 h-3 text-gray-400" />
                    <span className="text-xs text-gray-500">{note.nurse_name}</span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
