import { createAsyncThunk, createSlice, PayloadAction } from '@reduxjs/toolkit';
import { supabase } from '../../lib/supabase';
import type { Patient } from '../../types';
import type { LoadingState } from '../../types';

interface PatientsState {
  list: Patient[];
  selected: Patient | null;
  total: number;
  page: number;
  perPage: number;
  searchQuery: string;
  status: LoadingState;
  error: string | null;
}

const initialState: PatientsState = {
  list: [],
  selected: null,
  total: 0,
  page: 1,
  perPage: 20,
  searchQuery: '',
  status: 'idle',
  error: null,
};

export const fetchPatients = createAsyncThunk(
  'patients/fetchAll',
  async (
    { hospitalId, page = 1, perPage = 20, search = '' }: {
      hospitalId: string;
      page?: number;
      perPage?: number;
      search?: string;
    },
    { rejectWithValue }
  ) => {
    try {
      const from = (page - 1) * perPage;
      const to = from + perPage - 1;

      let query = supabase
        .from('patients')
        .select('*', { count: 'exact' })
        .eq('hospital_id', hospitalId)
        .order('created_at', { ascending: false })
        .range(from, to);

      if (search.trim()) {
        query = query.or(
          `full_name.ilike.%${search}%,phone.ilike.%${search}%,uhid.ilike.%${search}%`
        );
      }

      const { data, error, count } = await query;
      if (error) throw error;
      return { data: (data ?? []) as Patient[], total: count ?? 0, page, perPage };
    } catch (err: unknown) {
      return rejectWithValue(err instanceof Error ? err.message : 'Failed to fetch patients');
    }
  }
);

export const fetchPatientById = createAsyncThunk(
  'patients/fetchById',
  async (patientId: string, { rejectWithValue }) => {
    try {
      const { data, error } = await supabase
        .from('patients')
        .select('*')
        .eq('id', patientId)
        .maybeSingle();
      if (error) throw error;
      return data as Patient | null;
    } catch (err: unknown) {
      return rejectWithValue(err instanceof Error ? err.message : 'Failed to fetch patient');
    }
  }
);

const patientsSlice = createSlice({
  name: 'patients',
  initialState,
  reducers: {
    setSearchQuery(state, action: PayloadAction<string>) {
      state.searchQuery = action.payload;
      state.page = 1;
    },
    setPage(state, action: PayloadAction<number>) {
      state.page = action.payload;
    },
    setPerPage(state, action: PayloadAction<number>) {
      state.perPage = action.payload;
      state.page = 1;
    },
    clearSelected(state) {
      state.selected = null;
    },
    optimisticAddPatient(state, action: PayloadAction<Patient>) {
      state.list.unshift(action.payload);
      state.total += 1;
    },
    optimisticUpdatePatient(state, action: PayloadAction<Patient>) {
      const idx = state.list.findIndex((p) => p.id === action.payload.id);
      if (idx !== -1) state.list[idx] = action.payload;
      if (state.selected?.id === action.payload.id) state.selected = action.payload;
    },
    resetPatients: () => initialState,
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchPatients.pending, (state) => {
        state.status = 'loading';
        state.error = null;
      })
      .addCase(fetchPatients.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.list = action.payload.data;
        state.total = action.payload.total;
        state.page = action.payload.page;
        state.perPage = action.payload.perPage;
      })
      .addCase(fetchPatients.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload as string;
      })
      .addCase(fetchPatientById.pending, (state) => {
        state.status = 'loading';
        state.error = null;
      })
      .addCase(fetchPatientById.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.selected = action.payload;
      })
      .addCase(fetchPatientById.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload as string;
      });
  },
});

export const {
  setSearchQuery,
  setPage,
  setPerPage,
  clearSelected,
  optimisticAddPatient,
  optimisticUpdatePatient,
  resetPatients,
} = patientsSlice.actions;

export default patientsSlice.reducer;
