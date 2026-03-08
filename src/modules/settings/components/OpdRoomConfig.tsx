import { useState, useEffect, useCallback } from 'react';
import { Plus, Trash2, Loader2, DoorOpen } from 'lucide-react';
import { Button } from '../../../components/ui/button';
import { Input } from '../../../components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../../components/ui/select';
import { supabase } from '../../../lib/supabase';
import { toast } from 'sonner';

interface RoomAssignment {
  id: string;
  room_name: string;
  room_number: string;
  doctor_id: string | null;
  doctor_name?: string;
  is_active: boolean;
}

interface Doctor {
  id: string;
  full_name: string;
  department: string | null;
}

interface Props {
  hospitalId: string;
}

export default function OpdRoomConfig({ hospitalId }: Props) {
  const [rooms, setRooms] = useState<RoomAssignment[]>([]);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [loading, setLoading] = useState(true);
  const [newRoom, setNewRoom] = useState({ room_name: '', room_number: '' });
  const [adding, setAdding] = useState(false);

  const load = useCallback(async () => {
    try {
      const [{ data: roomData }, { data: docData }] = await Promise.all([
        supabase.from('opd_rooms').select('*, doctor:profiles!opd_rooms_doctor_id_fkey(full_name)').eq('hospital_id', hospitalId).order('room_number'),
        supabase.from('profiles').select('id, full_name, department').eq('role', 'doctor').eq('is_active', true).order('full_name'),
      ]);

      setRooms((roomData ?? []).map((r: Record<string, unknown>) => ({
        ...r,
        doctor_name: (r.doctor as { full_name: string } | null)?.full_name || null,
      })) as RoomAssignment[]);
      setDoctors((docData ?? []) as Doctor[]);
    } catch {
      toast.error('Failed to load room configuration');
    } finally {
      setLoading(false);
    }
  }, [hospitalId]);

  useEffect(() => { load(); }, [load]);

  const addRoom = async () => {
    if (!newRoom.room_name.trim() || !newRoom.room_number.trim()) {
      toast.error('Enter room name and number');
      return;
    }
    setAdding(true);
    try {
      await supabase.from('opd_rooms').insert({
        hospital_id: hospitalId,
        room_name: newRoom.room_name,
        room_number: newRoom.room_number,
        is_active: true,
      } as never);
      toast.success('Room added');
      setNewRoom({ room_name: '', room_number: '' });
      load();
    } catch {
      toast.error('Failed to add room');
    } finally {
      setAdding(false);
    }
  };

  const assignDoctor = async (roomId: string, doctorId: string | null) => {
    try {
      await supabase.from('opd_rooms').update({ doctor_id: doctorId || null } as never).eq('id', roomId);
      toast.success('Doctor assigned');
      load();
    } catch {
      toast.error('Failed to assign doctor');
    }
  };

  const deleteRoom = async (roomId: string) => {
    try {
      await supabase.from('opd_rooms').delete().eq('id', roomId);
      toast.success('Room deleted');
      load();
    } catch {
      toast.error('Failed to delete room');
    }
  };

  if (loading) {
    return <div className="flex justify-center py-8"><Loader2 className="w-5 h-5 animate-spin text-muted-foreground" /></div>;
  }

  return (
    <div className="space-y-5">
      <div className="flex items-end gap-3">
        <div className="flex-1 grid grid-cols-2 gap-2">
          <Input value={newRoom.room_number} onChange={e => setNewRoom({ ...newRoom, room_number: e.target.value })} placeholder="Room Number (e.g., 101)" className="h-9" />
          <Input value={newRoom.room_name} onChange={e => setNewRoom({ ...newRoom, room_name: e.target.value })} placeholder="Room Name (e.g., OPD Room 1)" className="h-9" />
        </div>
        <Button size="sm" onClick={addRoom} disabled={adding} className="gap-1.5 h-9">
          {adding ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5" />}
          Add Room
        </Button>
      </div>

      {rooms.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <DoorOpen className="w-10 h-10 mx-auto mb-2 opacity-30" />
          <p className="text-sm">No OPD rooms configured yet</p>
        </div>
      ) : (
        <div className="border border-border rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-muted/50">
                <th className="px-4 py-2.5 text-left text-xs font-medium text-muted-foreground">Room #</th>
                <th className="px-4 py-2.5 text-left text-xs font-medium text-muted-foreground">Room Name</th>
                <th className="px-4 py-2.5 text-left text-xs font-medium text-muted-foreground">Assigned Doctor</th>
                <th className="px-4 py-2.5 w-16"></th>
              </tr>
            </thead>
            <tbody>
              {rooms.map(room => (
                <tr key={room.id} className="border-t border-border/50 hover:bg-muted/30">
                  <td className="px-4 py-2.5 font-mono font-medium">{room.room_number}</td>
                  <td className="px-4 py-2.5">{room.room_name}</td>
                  <td className="px-4 py-2.5">
                    <Select value={room.doctor_id || 'none'} onValueChange={v => assignDoctor(room.id, v === 'none' ? null : v)}>
                      <SelectTrigger className="h-8 w-56"><SelectValue placeholder="Assign doctor..." /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">— Unassigned —</SelectItem>
                        {doctors.map(d => <SelectItem key={d.id} value={d.id}>Dr. {d.full_name}{d.department ? ` (${d.department})` : ''}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </td>
                  <td className="px-4 py-2.5">
                    <button onClick={() => deleteRoom(room.id)} className="p-1.5 rounded-md text-muted-foreground hover:text-destructive hover:bg-destructive/10">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
