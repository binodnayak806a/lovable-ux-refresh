import { useEffect } from 'react';
import { RouterProvider } from 'react-router-dom';
import { supabase } from './lib/supabase';
import { authService } from './services/auth.service';
import { setSession, setLoading } from './store/slices/authSlice';
import { useAppDispatch } from './store';
import { router } from './routes';
import { DEMO_HOSPITAL_ID } from './hooks/useHospitalId';
import type { UserRole } from './types/user.types';
import type { User } from './types';

function restoreDemoSession(dispatch: ReturnType<typeof useAppDispatch>) {
  try {
    const raw = localStorage.getItem('demo_session');
    if (!raw) return false;
    const { role } = JSON.parse(raw) as { role: UserRole };
    const names: Record<string, string> = {
      superadmin: 'Dr. Rajesh Kumar', admin: 'Priya Sharma', doctor: 'Dr. Anita Patel',
      receptionist: 'Sunita Devi', nurse: 'Kavita Singh', billing: 'Amit Verma',
      pharmacist: 'Ravi Gupta', lab_technician: 'Manish Yadav',
    };
    const id = `demo-${role}`;
    const user: User = {
      id, email: `${role}@demo.healthcarehms.in`, full_name: names[role] ?? role,
      role: role as User['role'], hospital_id: DEMO_HOSPITAL_ID,
      department: null, designation: null, phone: null, avatar_url: null,
      is_active: true, created_at: new Date().toISOString(), updated_at: new Date().toISOString(),
    };
    dispatch(setSession({
      session: { access_token: `demo-token-${role}`, user: { id, email: user.email } },
      user,
    }));
    return true;
  } catch {
    return false;
  }
}

function AppInit() {
  const dispatch = useAppDispatch();

  useEffect(() => {
    // Try demo session first
    if (restoreDemoSession(dispatch)) return;

    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (session?.user) {
        let profile = null;
        try {
          profile = await authService.getUserProfile(session.user.id);
        } catch {
          // profile may not exist
        }
        dispatch(setSession({ session, user: profile }));
      } else {
        dispatch(setLoading(false));
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_OUT' || !session) {
        localStorage.removeItem('demo_session');
        dispatch(setSession({ session: null, user: null }));
        return;
      }
      if (event === 'TOKEN_REFRESHED' || event === 'SIGNED_IN') {
        (async () => {
          let profile = null;
          try {
            profile = await authService.getUserProfile(session.user.id);
          } catch {
            // silent
          }
          // Sync role to user_roles table on sign-in
          if (profile?.role) {
            try {
              const { roleService } = await import('./services/role.service');
              await roleService.ensureUserRole(session.user.id, profile.role as UserRole);
            } catch {
              // non-blocking
            }
          }
          dispatch(setSession({ session, user: profile }));
        })();
      }
    });

    return () => subscription.unsubscribe();
  }, [dispatch]);

  return <RouterProvider router={router} />;
}

export default AppInit;
