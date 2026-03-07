import { createAsyncThunk, createSlice, PayloadAction } from '@reduxjs/toolkit';
import { supabase } from '../../lib/supabase';
import type { Admission, Ward, Bed, LoadingState } from '../../types';

interface IPDFilters {
  status: string | null;
  wardId: string | null;
  doctorId: string | null;
}

interface IPDState {
  admissions: Admission[];
  selectedAdmission: Admission | null;
  wards: Ward[];
  beds: Bed[];
  total: number;
  page: number;
  perPage: number;
  filters: IPDFilters;
  status: LoadingState;
  wardsStatus: LoadingState;
  bedsStatus: LoadingState;
  error: string | null;
}

const initialState: IPDState = {
  admissions: [],
  selectedAdmission: null,
  wards: [],
  beds: [],
  total: 0,
  page: 1,
  perPage: 20,
  filters: {
    status: 'active',
    wardId: null,
    doctorId: null,
  },
  status: 'idle',
  wardsStatus: 'idle',
  bedsStatus: 'idle',
  error: null,
};

export const fetchAdmissions = createAsyncThunk(
  'ipd/fetchAdmissions',
  async (
    { hospitalId, filters, page = 1, perPage = 20 }: {
      hospitalId: string;
      filters: IPDFilters;
      page?: number;
      perPage?: number;
    },
    { rejectWithValue }
  ) => {
    try {
      const from = (page - 1) * perPage;
      const to = from + perPage - 1;

      let query = supabase
        .from('admissions')
        .select('*', { count: 'exact' })
        .eq('hospital_id', hospitalId)
        .order('admission_date', { ascending: false })
        .range(from, to);

      if (filters.status) query = query.eq('status', filters.status);
      if (filters.wardId) query = query.eq('ward_id', filters.wardId);
      if (filters.doctorId) query = query.eq('doctor_id', filters.doctorId);

      const { data, error, count } = await query;
      if (error) throw error;
      return { data: (data ?? []) as Admission[], total: count ?? 0 };
    } catch (err: unknown) {
      return rejectWithValue(err instanceof Error ? err.message : 'Failed to fetch admissions');
    }
  }
);

export const fetchWards = createAsyncThunk(
  'ipd/fetchWards',
  async (hospitalId: string, { rejectWithValue }) => {
    try {
      const { data, error } = await supabase
        .from('wards')
        .select('*')
        .eq('hospital_id', hospitalId)
        .eq('is_active', true)
        .order('name');
      if (error) throw error;
      return (data ?? []) as Ward[];
    } catch (err: unknown) {
      return rejectWithValue(err instanceof Error ? err.message : 'Failed to fetch wards');
    }
  }
);

export const fetchBeds = createAsyncThunk(
  'ipd/fetchBeds',
  async ({ hospitalId, wardId }: { hospitalId: string; wardId?: string }, { rejectWithValue }) => {
    try {
      let query = supabase
        .from('beds')
        .select('*')
        .eq('hospital_id', hospitalId)
        .order('bed_number');
      if (wardId) query = query.eq('ward_id', wardId);
      const { data, error } = await query;
      if (error) throw error;
      return (data ?? []) as Bed[];
    } catch (err: unknown) {
      return rejectWithValue(err instanceof Error ? err.message : 'Failed to fetch beds');
    }
  }
);

const ipdSlice = createSlice({
  name: 'ipd',
  initialState,
  reducers: {
    setIPDFilters(state, action: PayloadAction<Partial<IPDFilters>>) {
      state.filters = { ...state.filters, ...action.payload };
      state.page = 1;
    },
    setIPDPage(state, action: PayloadAction<number>) {
      state.page = action.payload;
    },
    selectAdmission(state, action: PayloadAction<Admission | null>) {
      state.selectedAdmission = action.payload;
    },
    updateAdmissionStatus(
      state,
      action: PayloadAction<{ id: string; status: Admission['status'] }>
    ) {
      const adm = state.admissions.find((a) => a.id === action.payload.id);
      if (adm) adm.status = action.payload.status;
    },
    updateBedStatus(
      state,
      action: PayloadAction<{ id: string; status: Bed['status'] }>
    ) {
      const bed = state.beds.find((b) => b.id === action.payload.id);
      if (bed) bed.status = action.payload.status;
    },
    optimisticAddAdmission(state, action: PayloadAction<Admission>) {
      state.admissions.unshift(action.payload);
      state.total += 1;
    },
    resetIPD: () => initialState,
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchAdmissions.pending, (state) => { state.status = 'loading'; state.error = null; })
      .addCase(fetchAdmissions.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.admissions = action.payload.data;
        state.total = action.payload.total;
      })
      .addCase(fetchAdmissions.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload as string;
      })
      .addCase(fetchWards.pending, (state) => { state.wardsStatus = 'loading'; })
      .addCase(fetchWards.fulfilled, (state, action) => {
        state.wardsStatus = 'succeeded';
        state.wards = action.payload;
      })
      .addCase(fetchWards.rejected, (state) => { state.wardsStatus = 'failed'; })
      .addCase(fetchBeds.pending, (state) => { state.bedsStatus = 'loading'; })
      .addCase(fetchBeds.fulfilled, (state, action) => {
        state.bedsStatus = 'succeeded';
        state.beds = action.payload;
      })
      .addCase(fetchBeds.rejected, (state) => { state.bedsStatus = 'failed'; });
  },
});

export const {
  setIPDFilters,
  setIPDPage,
  selectAdmission,
  updateAdmissionStatus,
  updateBedStatus,
  optimisticAddAdmission,
  resetIPD,
} = ipdSlice.actions;

export default ipdSlice.reducer;
