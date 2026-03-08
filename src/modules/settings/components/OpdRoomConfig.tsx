import { useState, useEffect, useCallback } from 'react';
import { Plus, Trash2, Loader2, DoorOpen } from 'lucide-react';
import { Button } from '../../../components/ui/button';
import { Input } from '../../../components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../../components/ui/select';
import { mockStore } from '../../../lib/mockStore';
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

const STORAGE_KEY = 'hms_opd_rooms';

function loadRoomsFromStorage(): RoomAssignment[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [
      { id: '1', room_name: 'OPD Room 1', room_number: '101', doctor_id: null, is_active: true },
      { id: '2', room_name: 'OPD Room 2', room_number: '102', doctor_id: null, is_active: true },
      { id: '3', room_name: 'OPD Room 3', room_number: '103', doctor_id: null, is_active: true },
    ];
  } catch { return []; }
}

function saveRoomsToStorage(rooms: RoomAssignment[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(rooms));
}

export default function OpdRoomConfig({ hospitalId }: Props) {
  const [rooms, setRooms] = useState<RoomAssignment[]>([]);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [loading, setLoading] = useState(true);
  const [newRoom, setNewRoom] = useState({ room_name: '', room_number: '' });
  const [adding, setAdding] = useState(false);

  const load = useCallback(() => {
    const roomData = loadRoomsFromStorage();
    const docData = mockStore.getDoctors(hospitalId);
    
    // Enrich rooms with doctor names
    setRooms(roomData.map(r => ({
      ...r,
      doctor_name: r.doctor_id ? docData.find(d => d.id === r.doctor_id)?.full_name : undefined,
    })));
    setDoctors(docData.map(d => ({ id: d.id, full_name: d.full_name, department: d.department })));
    setLoading(false);
  }, [hospitalId]);

  useEffect(() => { load(); }, [load]);

  const addRoom = async () => {
    if (!newRoom.room_name.trim() || !newRoom.room_number.trim()) {
      toast.error('Enter room name and number');
      return;
    }
    setAdding(true);
    const updated = [...rooms, {
      id: Date.now().toString(),
      room_name: newRoom.room_name,
      room_number: newRoom.room_number,
      doctor_id: null,
      is_active: true,
    }];
    saveRoomsToStorage(updated);
    toast.success('Room added');
    setNewRoom({ room_name: '', room_number: '' });
    setAdding(false);
    load();
  };

  const assignDoctor = async (roomId: string, doctorId: string | null) => {
    const updated = rooms.map(r => r.id === roomId ? { ...r, doctor_id: doctorId || null } : r);
    saveRoomsToStorage(updated);
    toast.success('Doctor assigned');
    load();
  };

  const deleteRoom = async (roomId: string) => {
    const updated = rooms.filter(r => r.id !== roomId);
    saveRoomsToStorage(updated);
    toast.success('Room deleted');
    load();
  };

  if (loading) {
    return <div className="flex justify-center py-8"><Loader2 className="w-5 h-5 animate-spin text-muted-foreground" /></div>;
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-2">
        <DoorOpen className="w-4 h-4 text-muted-foreground" />
        <h4 className="text-sm font-semibold text-foreground">OPD Room Assignment</h4>
      </div>

      <div className="border border-border rounded-lg overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-muted/50">
            <tr>
              <th className="text-left py-2 px-3 text-xs font-medium text-muted-foreground">Room</th>
              <th className="text-left py-2 px-3 text-xs font-medium text-muted-foreground">Number</th>
              <th className="text-left py-2 px-3 text-xs font-medium text-muted-foreground">Assigned Doctor</th>
              <th className="w-10"></th>
            </tr>
          </thead>
          <tbody>
            {rooms.map(room => (
              <tr key={room.id} className="border-t border-border">
                <td className="py-2 px-3 font-medium">{room.room_name}</td>
                <td className="py-2 px-3 text-muted-foreground">{room.room_number}</td>
                <td className="py-2 px-3">
                  <Select value={room.doctor_id || 'none'} onValueChange={(v) => assignDoctor(room.id, v === 'none' ? null : v)}>
                    <SelectTrigger className="h-8 text-xs w-48">
                      <SelectValue placeholder="Assign doctor" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">— Unassigned —</SelectItem>
                      {doctors.map(d => (
                        <SelectItem key={d.id} value={d.id}>{d.full_name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </td>
                <td className="py-2 px-3">
                  <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-destructive/60 hover:text-destructive" onClick={() => deleteRoom(room.id)}>
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex items-end gap-2">
        <div className="flex-1 space-y-1">
          <label className="text-xs text-muted-foreground">Room Name</label>
          <Input value={newRoom.room_name} onChange={e => setNewRoom(p => ({ ...p, room_name: e.target.value }))} placeholder="OPD Room 4" className="h-8 text-sm" />
        </div>
        <div className="w-28 space-y-1">
          <label className="text-xs text-muted-foreground">Number</label>
          <Input value={newRoom.room_number} onChange={e => setNewRoom(p => ({ ...p, room_number: e.target.value }))} placeholder="104" className="h-8 text-sm" />
        </div>
        <Button size="sm" className="h-8 gap-1" onClick={addRoom} disabled={adding}>
          <Plus className="w-3.5 h-3.5" /> Add
        </Button>
      </div>
    </div>
  );
}
