import { createAsyncThunk, createSlice, PayloadAction } from '@reduxjs/toolkit';
import { supabase } from '../../lib/supabase';
import type { Invoice, Payment, ServiceItem, LoadingState } from '../../types';

interface BillingFilters {
  status: string | null;
  dateFrom: string | null;
  dateTo: string | null;
  patientId: string | null;
}

interface BillingState {
  invoices: Invoice[];
  selectedInvoice: Invoice | null;
  payments: Payment[];
  serviceItems: ServiceItem[];
  total: number;
  page: number;
  perPage: number;
  filters: BillingFilters;
  status: LoadingState;
  serviceItemsStatus: LoadingState;
  error: string | null;
  totalRevenue: number;
  pendingAmount: number;
}

const initialState: BillingState = {
  invoices: [],
  selectedInvoice: null,
  payments: [],
  serviceItems: [],
  total: 0,
  page: 1,
  perPage: 20,
  filters: {
    status: null,
    dateFrom: null,
    dateTo: null,
    patientId: null,
  },
  status: 'idle',
  serviceItemsStatus: 'idle',
  error: null,
  totalRevenue: 0,
  pendingAmount: 0,
};

export const fetchInvoices = createAsyncThunk(
  'billing/fetchInvoices',
  async (
    { hospitalId, filters, page = 1, perPage = 20 }: {
      hospitalId: string;
      filters: BillingFilters;
      page?: number;
      perPage?: number;
    },
    { rejectWithValue }
  ) => {
    try {
      const from = (page - 1) * perPage;
      const to = from + perPage - 1;

      let query = supabase
        .from('invoices')
        .select('*', { count: 'exact' })
        .eq('hospital_id', hospitalId)
        .order('created_at', { ascending: false })
        .range(from, to);

      if (filters.status) query = query.eq('status', filters.status);
      if (filters.patientId) query = query.eq('patient_id', filters.patientId);
      if (filters.dateFrom) query = query.gte('invoice_date', filters.dateFrom);
      if (filters.dateTo) query = query.lte('invoice_date', filters.dateTo);

      const { data, error, count } = await query;
      if (error) throw error;
      return { data: (data ?? []) as Invoice[], total: count ?? 0 };
    } catch (err: unknown) {
      return rejectWithValue(err instanceof Error ? err.message : 'Failed to fetch invoices');
    }
  }
);

export const fetchServiceItems = createAsyncThunk(
  'billing/fetchServiceItems',
  async (hospitalId: string, { rejectWithValue }) => {
    try {
      const { data, error } = await supabase
        .from('service_items')
        .select('*')
        .eq('hospital_id', hospitalId)
        .eq('is_active', true)
        .order('name');
      if (error) throw error;
      return (data ?? []) as ServiceItem[];
    } catch (err: unknown) {
      return rejectWithValue(err instanceof Error ? err.message : 'Failed to fetch service items');
    }
  }
);

const billingSlice = createSlice({
  name: 'billing',
  initialState,
  reducers: {
    setBillingFilters(state, action: PayloadAction<Partial<BillingFilters>>) {
      state.filters = { ...state.filters, ...action.payload };
      state.page = 1;
    },
    setBillingPage(state, action: PayloadAction<number>) {
      state.page = action.payload;
    },
    selectInvoice(state, action: PayloadAction<Invoice | null>) {
      state.selectedInvoice = action.payload;
    },
    updateInvoiceStatus(
      state,
      action: PayloadAction<{ id: string; status: Invoice['status']; paidAmount?: number }>
    ) {
      const inv = state.invoices.find((i) => i.id === action.payload.id);
      if (inv) {
        inv.status = action.payload.status;
        if (action.payload.paidAmount !== undefined) inv.paid_amount = action.payload.paidAmount;
      }
      if (state.selectedInvoice?.id === action.payload.id) {
        state.selectedInvoice.status = action.payload.status;
      }
    },
    optimisticAddInvoice(state, action: PayloadAction<Invoice>) {
      state.invoices.unshift(action.payload);
      state.total += 1;
    },
    addPaymentToInvoice(state, action: PayloadAction<Payment>) {
      state.payments.push(action.payload);
      const inv = state.invoices.find((i) => i.id === action.payload.invoice_id);
      if (inv) inv.paid_amount += action.payload.amount;
    },
    setRevenueStats(state, action: PayloadAction<{ totalRevenue: number; pendingAmount: number }>) {
      state.totalRevenue = action.payload.totalRevenue;
      state.pendingAmount = action.payload.pendingAmount;
    },
    resetBilling: () => initialState,
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchInvoices.pending, (state) => { state.status = 'loading'; state.error = null; })
      .addCase(fetchInvoices.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.invoices = action.payload.data;
        state.total = action.payload.total;
      })
      .addCase(fetchInvoices.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload as string;
      })
      .addCase(fetchServiceItems.pending, (state) => { state.serviceItemsStatus = 'loading'; })
      .addCase(fetchServiceItems.fulfilled, (state, action) => {
        state.serviceItemsStatus = 'succeeded';
        state.serviceItems = action.payload;
      })
      .addCase(fetchServiceItems.rejected, (state) => { state.serviceItemsStatus = 'failed'; });
  },
});

export const {
  setBillingFilters,
  setBillingPage,
  selectInvoice,
  updateInvoiceStatus,
  optimisticAddInvoice,
  addPaymentToInvoice,
  setRevenueStats,
  resetBilling,
} = billingSlice.actions;

export default billingSlice.reducer;
