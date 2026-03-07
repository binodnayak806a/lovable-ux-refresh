import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import type { User } from '../../types';

export type AuthError =
  | 'invalid_credentials'
  | 'email_not_confirmed'
  | 'too_many_requests'
  | 'network_error'
  | 'unknown';

interface SessionLike {
  access_token: string;
  refresh_token?: string;
  expires_at?: number;
  user: { id: string; email?: string };
}

export interface AuthState {
  user: User | null;
  session: SessionLike | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  error: AuthError | null;
  errorMessage: string | null;
  hospitalId: string | null;
}

const initialState: AuthState = {
  user: null,
  session: null,
  isLoading: true,
  isAuthenticated: false,
  error: null,
  errorMessage: null,
  hospitalId: null,
};

function classifyError(message: string): AuthError {
  const lower = message.toLowerCase();
  if (lower.includes('invalid login') || lower.includes('invalid credentials') || lower.includes('wrong password')) {
    return 'invalid_credentials';
  }
  if (lower.includes('email not confirmed')) return 'email_not_confirmed';
  if (lower.includes('too many') || lower.includes('rate limit')) return 'too_many_requests';
  if (lower.includes('network') || lower.includes('fetch')) return 'network_error';
  return 'unknown';
}

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setSession(
      state,
      action: PayloadAction<{ session: SessionLike | null; user: User | null }>
    ) {
      state.session = action.payload.session;
      state.user = action.payload.user;
      state.isAuthenticated = !!action.payload.session;
      state.isLoading = false;
      state.error = null;
      state.errorMessage = null;
      state.hospitalId = action.payload.user?.hospital_id ?? null;
    },
    updateUser(state, action: PayloadAction<Partial<User>>) {
      if (state.user) {
        state.user = { ...state.user, ...action.payload };
      }
    },
    clearAuth(state) {
      state.user = null;
      state.session = null;
      state.isAuthenticated = false;
      state.isLoading = false;
      state.error = null;
      state.errorMessage = null;
      state.hospitalId = null;
    },
    setLoading(state, action: PayloadAction<boolean>) {
      state.isLoading = action.payload;
    },
    setAuthError(state, action: PayloadAction<string>) {
      state.isLoading = false;
      state.error = classifyError(action.payload);
      state.errorMessage = action.payload;
    },
    clearError(state) {
      state.error = null;
      state.errorMessage = null;
    },
  },
});

export const { setSession, updateUser, clearAuth, setLoading, setAuthError, clearError } = authSlice.actions;
export default authSlice.reducer;
