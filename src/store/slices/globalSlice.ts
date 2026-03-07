import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { supabase } from '../../lib/supabase';

interface PatientContext {
  id: string;
  full_name: string;
  uhid: string;
  phone: string;
  age: number | null;
  gender: string;
  hospital_id: string;
}

interface AdmissionContext {
  id: string;
  admission_number: string;
  patient_id: string;
  status: string;
}

interface GlobalState {
  currentPatient: PatientContext | null;
  currentAdmission: AdmissionContext | null;
  searchOpen: boolean;
  isLoadingContext: boolean;
}

const initialState: GlobalState = {
  currentPatient: null,
  currentAdmission: null,
  searchOpen: false,
  isLoadingContext: false,
};

export const loadPatientContext = createAsyncThunk(
  'global/loadPatientContext',
  async (patientId: string) => {
    const [patientRes, admissionRes] = await Promise.all([
      supabase
        .from('patients')
        .select('id, full_name, uhid, phone, age, gender, hospital_id')
        .eq('id', patientId)
        .maybeSingle(),
      supabase
        .from('admissions')
        .select('id, admission_number, patient_id, status')
        .eq('patient_id', patientId)
        .eq('status', 'active')
        .maybeSingle(),
    ]);

    return {
      patient: patientRes.data as PatientContext | null,
      admission: admissionRes.data as AdmissionContext | null,
    };
  }
);

const globalSlice = createSlice({
  name: 'global',
  initialState,
  reducers: {
    clearCurrentPatient: (state) => {
      state.currentPatient = null;
      state.currentAdmission = null;
    },
    setSearchOpen: (state, action) => {
      state.searchOpen = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(loadPatientContext.pending, (state) => {
        state.isLoadingContext = true;
      })
      .addCase(loadPatientContext.fulfilled, (state, action) => {
        state.currentPatient = action.payload.patient;
        state.currentAdmission = action.payload.admission;
        state.isLoadingContext = false;
      })
      .addCase(loadPatientContext.rejected, (state) => {
        state.isLoadingContext = false;
      });
  },
});

export const { clearCurrentPatient, setSearchOpen } = globalSlice.actions;
export default globalSlice.reducer;
