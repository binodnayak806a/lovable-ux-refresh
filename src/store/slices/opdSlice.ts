import { createAsyncThunk, createSlice, PayloadAction } from '@reduxjs/toolkit';
import { supabase } from '../../lib/supabase';
import type { Appointment, LoadingState } from '../../types';

interface OPDFilters {
  date: string;
  doctorId: string | null;
  departmentId: string | null;
  status: string | null;
}

interface QueueItem extends Appointment {
  queuePosition: number;
  estimatedTime: string;
}

interface OPDState {
  appointments: Appointment[];
  selectedAppointment: Appointment | null;
  total: number;
  page: number;
  perPage: number;
  filters: OPDFilters;
  status: LoadingState;
  error: string | null;
  tokenQueue: QueueItem[];
  currentToken: number;
  queueStatus: LoadingState;
}

const initialState: OPDState = {
  appointments: [],
  selectedAppointment: null,
  total: 0,
  page: 1,
  perPage: 25,
  filters: {
    date: new Date().toISOString().split('T')[0],
    doctorId: null,
    departmentId: null,
    status: null,
  },
  status: 'idle',
  error: null,
  tokenQueue: [],
  currentToken: 0,
  queueStatus: 'idle',
};

export const fetchOPDAppointments = createAsyncThunk(
  'opd/fetchAppointments',
  async (
    { hospitalId, filters, page = 1, perPage = 25 }: {
      hospitalId: string;
      filters: OPDFilters;
      page?: number;
      perPage?: number;
    },
    { rejectWithValue }
  ) => {
    try {
      const from = (page - 1) * perPage;
      const to = from + perPage - 1;

      let query = supabase
        .from('appointments')
        .select('*', { count: 'exact' })
        .eq('hospital_id', hospitalId)
        .eq('appointment_date', filters.date)
        .order('appointment_time', { ascending: true })
        .range(from, to);

      if (filters.doctorId) query = query.eq('doctor_id', filters.doctorId);
      if (filters.status) query = query.eq('status', filters.status);

      const { data, error, count } = await query;
      if (error) throw error;
      return { data: (data ?? []) as Appointment[], total: count ?? 0 };
    } catch (err: unknown) {
      return rejectWithValue(err instanceof Error ? err.message : 'Failed to fetch OPD appointments');
    }
  }
);

export const fetchTokenQueue = createAsyncThunk(
  'opd/fetchTokenQueue',
  async (
    { hospitalId, doctorId, date }: { hospitalId: string; doctorId?: string; date: string },
    { rejectWithValue }
  ) => {
    try {
      let query = supabase
        .from('appointments')
        .select('*')
        .eq('hospital_id', hospitalId)
        .eq('appointment_date', date)
        .in('status', ['scheduled', 'confirmed', 'in_progress'])
        .order('token_number', { ascending: true });

      if (doctorId) query = query.eq('doctor_id', doctorId);

      const { data, error } = await query;
      if (error) throw error;

      const appointments = (data ?? []) as Appointment[];
      const queueItems: QueueItem[] = appointments.map((appt, index) => ({
        ...appt,
        queuePosition: index + 1,
        estimatedTime: calculateEstimatedTime(appt.appointment_time || '09:00', index),
      }));

      return queueItems;
    } catch (err: unknown) {
      return rejectWithValue(err instanceof Error ? err.message : 'Failed to fetch token queue');
    }
  }
);

function calculateEstimatedTime(baseTime: string, position: number): string {
  const avgConsultTime = 15;
  const [hours, minutes] = baseTime.split(':').map(Number);
  const totalMinutes = hours * 60 + minutes + (position * avgConsultTime);
  const newHours = Math.floor(totalMinutes / 60) % 24;
  const newMinutes = totalMinutes % 60;
  return `${String(newHours).padStart(2, '0')}:${String(newMinutes).padStart(2, '0')}`;
}

const opdSlice = createSlice({
  name: 'opd',
  initialState,
  reducers: {
    setOPDFilters(state, action: PayloadAction<Partial<OPDFilters>>) {
      state.filters = { ...state.filters, ...action.payload };
      state.page = 1;
    },
    setOPDDate(state, action: PayloadAction<string>) {
      state.filters.date = action.payload;
      state.page = 1;
    },
    setOPDPage(state, action: PayloadAction<number>) {
      state.page = action.payload;
    },
    selectOPDAppointment(state, action: PayloadAction<Appointment | null>) {
      state.selectedAppointment = action.payload;
    },
    updateAppointmentStatus(
      state,
      action: PayloadAction<{ id: string; status: Appointment['status'] }>
    ) {
      const appt = state.appointments.find((a) => a.id === action.payload.id);
      if (appt) appt.status = action.payload.status;
      if (state.selectedAppointment?.id === action.payload.id) {
        state.selectedAppointment.status = action.payload.status;
      }
      const queueItem = state.tokenQueue.find((q) => q.id === action.payload.id);
      if (queueItem) {
        if (action.payload.status === 'completed' || action.payload.status === 'cancelled') {
          state.tokenQueue = state.tokenQueue.filter((q) => q.id !== action.payload.id);
          state.tokenQueue = state.tokenQueue.map((q, idx) => ({ ...q, queuePosition: idx + 1 }));
        } else {
          queueItem.status = action.payload.status;
        }
      }
    },
    optimisticAddAppointment(state, action: PayloadAction<Appointment>) {
      state.appointments.push(action.payload);
      state.total += 1;
    },
    addToQueue(state, action: PayloadAction<Appointment>) {
      const position = state.tokenQueue.length + 1;
      const queueItem: QueueItem = {
        ...action.payload,
        queuePosition: position,
        estimatedTime: calculateEstimatedTime(action.payload.appointment_time || '09:00', position - 1),
      };
      state.tokenQueue.push(queueItem);
    },
    removeFromQueue(state, action: PayloadAction<string>) {
      state.tokenQueue = state.tokenQueue.filter((q) => q.id !== action.payload);
      state.tokenQueue = state.tokenQueue.map((q, idx) => ({ ...q, queuePosition: idx + 1 }));
    },
    callNextToken(state) {
      const nextInQueue = state.tokenQueue.find((q) => q.status === 'confirmed' || q.status === 'scheduled');
      if (nextInQueue) {
        nextInQueue.status = 'in_progress';
        state.currentToken = nextInQueue.token_number || 0;
      }
    },
    setCurrentToken(state, action: PayloadAction<number>) {
      state.currentToken = action.payload;
    },
    reorderQueue(state, action: PayloadAction<{ fromIndex: number; toIndex: number }>) {
      const { fromIndex, toIndex } = action.payload;
      const [removed] = state.tokenQueue.splice(fromIndex, 1);
      state.tokenQueue.splice(toIndex, 0, removed);
      state.tokenQueue = state.tokenQueue.map((q, idx) => ({ ...q, queuePosition: idx + 1 }));
    },
    clearQueue(state) {
      state.tokenQueue = [];
      state.currentToken = 0;
    },
    resetOPD: () => initialState,
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchOPDAppointments.pending, (state) => {
        state.status = 'loading';
        state.error = null;
      })
      .addCase(fetchOPDAppointments.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.appointments = action.payload.data;
        state.total = action.payload.total;
      })
      .addCase(fetchOPDAppointments.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload as string;
      })
      .addCase(fetchTokenQueue.pending, (state) => {
        state.queueStatus = 'loading';
      })
      .addCase(fetchTokenQueue.fulfilled, (state, action) => {
        state.queueStatus = 'succeeded';
        state.tokenQueue = action.payload;
        const inProgress = action.payload.find((q) => q.status === 'in_progress');
        if (inProgress) {
          state.currentToken = inProgress.token_number || 0;
        }
      })
      .addCase(fetchTokenQueue.rejected, (state) => {
        state.queueStatus = 'failed';
      });
  },
});

export const {
  setOPDFilters,
  setOPDDate,
  setOPDPage,
  selectOPDAppointment,
  updateAppointmentStatus,
  optimisticAddAppointment,
  addToQueue,
  removeFromQueue,
  callNextToken,
  setCurrentToken,
  reorderQueue,
  clearQueue,
  resetOPD,
} = opdSlice.actions;

export default opdSlice.reducer;
