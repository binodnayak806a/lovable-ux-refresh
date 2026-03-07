import { useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '../store';
import { clearAuth, setSession } from '../store/slices/authSlice';
import { authService } from '../services/auth.service';
import type { UserRole } from '../types';

export function useAuth() {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { user, session, isAuthenticated, isLoading, error, errorMessage } = useAppSelector(
    (state) => state.auth
  );

  const signOut = useCallback(async () => {
    try {
      await authService.signOut();
    } finally {
      dispatch(clearAuth());
      navigate('/login', { replace: true });
    }
  }, [dispatch, navigate]);

  const refreshProfile = useCallback(async () => {
    if (!session?.user?.id) return;
    try {
      const profile = await authService.getUserProfile(session.user.id);
      dispatch(setSession({ session, user: profile }));
    } catch {
      // silent
    }
  }, [dispatch, session]);

  const hasRole = useCallback(
    (...roles: UserRole[]) => {
      if (!user?.role) return false;
      return roles.includes(user.role);
    },
    [user]
  );

  const isAdmin = hasRole('admin', 'superadmin');
  const isDoctor = hasRole('doctor');
  const isNurse = hasRole('nurse');
  const isBilling = hasRole('billing');

  return {
    user,
    session,
    isAuthenticated,
    isLoading,
    error,
    errorMessage,
    signOut,
    refreshProfile,
    hasRole,
    isAdmin,
    isDoctor,
    isNurse,
    isBilling,
    hospitalId: user?.hospital_id ?? null,
  };
}
