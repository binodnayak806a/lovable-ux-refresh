import { useEffect } from 'react';
import { RouterProvider } from 'react-router-dom';
import { supabase } from './lib/supabase';
import { authService } from './services/auth.service';
import { setSession, setLoading } from './store/slices/authSlice';
import { useAppDispatch } from './store';
import { router } from './routes';

function AppInit() {
  const dispatch = useAppDispatch();

  useEffect(() => {
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
          dispatch(setSession({ session, user: profile }));
        })();
      }
    });

    return () => subscription.unsubscribe();
  }, [dispatch]);

  return <RouterProvider router={router} />;
}

export default AppInit;
