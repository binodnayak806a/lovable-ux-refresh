import { configureStore } from '@reduxjs/toolkit';
import { useDispatch, useSelector } from 'react-redux';
import authReducer from './slices/authSlice';
import uiReducer from './slices/uiSlice';
import dashboardReducer from './slices/dashboardSlice';
import patientsReducer from './slices/patientsSlice';
import opdReducer from './slices/opdSlice';
import ipdReducer from './slices/ipdSlice';
import billingReducer from './slices/billingSlice';
import notificationsReducer from './slices/notificationsSlice';
import globalReducer from './slices/globalSlice';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    ui: uiReducer,
    dashboard: dashboardReducer,
    patients: patientsReducer,
    opd: opdReducer,
    ipd: ipdReducer,
    billing: billingReducer,
    notifications: notificationsReducer,
    global: globalReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: ['auth/setSession'],
        ignoredPaths: ['auth.session'],
      },
    }),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

export const useAppDispatch: () => AppDispatch = useDispatch;
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;
