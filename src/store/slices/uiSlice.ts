import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import type { ToastItem } from '../../types';

type ModalKey =
  | 'addPatient'
  | 'editPatient'
  | 'addAppointment'
  | 'editAppointment'
  | 'cancelAppointment'
  | 'admitPatient'
  | 'dischargePatient'
  | 'transferBed'
  | 'createInvoice'
  | 'addPayment'
  | 'viewInvoice'
  | 'addDoctor'
  | 'editDoctor'
  | 'confirmDelete'
  | string;

interface UIState {
  sidebarCollapsed: boolean;
  sidebarMobileOpen: boolean;
  activeModule: string;
  modals: Partial<Record<ModalKey, boolean>>;
  modalData: Record<string, unknown>;
  toasts: ToastItem[];
  globalLoading: boolean;
  globalLoadingMessage: string | null;
}

const initialState: UIState = {
  sidebarCollapsed: false,
  sidebarMobileOpen: false,
  activeModule: 'dashboard',
  modals: {},
  modalData: {},
  toasts: [],
  globalLoading: false,
  globalLoadingMessage: null,
};

let toastIdCounter = 0;

const uiSlice = createSlice({
  name: 'ui',
  initialState,
  reducers: {
    toggleSidebar(state) {
      state.sidebarCollapsed = !state.sidebarCollapsed;
    },
    setSidebarCollapsed(state, action: PayloadAction<boolean>) {
      state.sidebarCollapsed = action.payload;
    },
    toggleMobileSidebar(state) {
      state.sidebarMobileOpen = !state.sidebarMobileOpen;
    },
    setMobileSidebarOpen(state, action: PayloadAction<boolean>) {
      state.sidebarMobileOpen = action.payload;
    },
    setActiveModule(state, action: PayloadAction<string>) {
      state.activeModule = action.payload;
    },
    openModal(state, action: PayloadAction<{ key: ModalKey; data?: unknown }>) {
      state.modals[action.payload.key] = true;
      if (action.payload.data !== undefined) {
        state.modalData[action.payload.key] = action.payload.data;
      }
    },
    closeModal(state, action: PayloadAction<ModalKey>) {
      state.modals[action.payload] = false;
      delete state.modalData[action.payload];
    },
    closeAllModals(state) {
      state.modals = {};
      state.modalData = {};
    },
    pushToast(state, action: PayloadAction<Omit<ToastItem, 'id'>>) {
      const id = `toast_${++toastIdCounter}_${Date.now()}`;
      state.toasts.push({ ...action.payload, id });
    },
    dismissToast(state, action: PayloadAction<string>) {
      state.toasts = state.toasts.filter((t) => t.id !== action.payload);
    },
    clearAllToasts(state) {
      state.toasts = [];
    },
    setGlobalLoading(state, action: PayloadAction<{ loading: boolean; message?: string }>) {
      state.globalLoading = action.payload.loading;
      state.globalLoadingMessage = action.payload.message ?? null;
    },
  },
});

export const {
  toggleSidebar,
  setSidebarCollapsed,
  toggleMobileSidebar,
  setMobileSidebarOpen,
  setActiveModule,
  openModal,
  closeModal,
  closeAllModals,
  pushToast,
  dismissToast,
  clearAllToasts,
  setGlobalLoading,
} = uiSlice.actions;

export default uiSlice.reducer;
