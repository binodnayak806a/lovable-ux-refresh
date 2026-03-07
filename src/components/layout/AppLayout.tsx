import { Outlet, useLocation } from 'react-router-dom';
import { useEffect, useRef } from 'react';
import Navbar from './Navbar';
import AppSidebar from './Sidebar';
import GlobalSearch from '../search/GlobalSearch';
import ContextualPatientBar from '../common/ContextualPatientBar';
import OfflineBanner from '../common/OfflineBanner';
import { offlineStore } from '../../lib/offlineStore';
import { supabase } from '../../lib/supabase';
import { useAppSelector } from '../../store';
import { SidebarInset, SidebarProvider } from '../ui/sidebar';

const SAMPLE_HOSPITAL_ID = '11111111-1111-1111-1111-111111111111';

export default function AppLayout() {
  const location = useLocation();
  const mainRef = useRef<HTMLDivElement>(null);
  const { user } = useAppSelector((s) => s.auth);
  const hospitalId = user?.hospital_id ?? SAMPLE_HOSPITAL_ID;

  useEffect(() => {
    if (mainRef.current) {
      mainRef.current.scrollTo({ top: 0, behavior: 'instant' });
    }
  }, [location.pathname]);

  useEffect(() => {
    if (!hospitalId) return;
    (async () => {
      try {
        const { data } = await supabase
          .from('patients')
          .select('id, uhid, full_name, phone, age, gender, blood_group, date_of_birth, address')
          .eq('hospital_id', hospitalId)
          .eq('is_active', true)
          .order('created_at', { ascending: false })
          .limit(500);
        if (data) {
          await offlineStore.cachePatients(data as Array<{
            id: string; uhid: string; full_name: string; phone: string;
            age?: number; gender?: string; blood_group?: string | null;
            date_of_birth?: string; address?: string;
          }>);
        }
      } catch {
        // silently fail - offline cache is best-effort
      }
    })();
  }, [hospitalId]);

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <OfflineBanner />
        <Navbar />
        <div ref={mainRef} className="flex-1 overflow-y-auto scrollbar-thin">
          <div className="p-4 md:p-6">
            <div key={location.pathname} className="animate-fade-in">
              <Outlet />
            </div>
          </div>
        </div>
      </SidebarInset>
      <GlobalSearch />
      <ContextualPatientBar />
    </SidebarProvider>
  );
}
