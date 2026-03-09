import { useNavigate, useLocation } from 'react-router-dom';
import { LayoutDashboard, Users, CalendarCheck, Search, Plus } from 'lucide-react';
import { useAppDispatch } from '@/store';
import { setSearchOpen } from '@/store/slices/globalSlice';
import { cn } from '@/lib/utils';

const TABS = [
  { id: 'dashboard', icon: LayoutDashboard, label: 'Home', path: '/dashboard' },
  { id: 'patients', icon: Users, label: 'Patients', path: '/patients' },
  { id: 'search', icon: Search, label: 'Search', path: '' },
  { id: 'appointments', icon: CalendarCheck, label: 'Appts', path: '/appointments' },
  { id: 'add', icon: Plus, label: 'New', path: '/add-patient' },
];

export default function MobileBottomNav() {
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useAppDispatch();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 sm:hidden bg-card border-t border-border safe-area-bottom">
      <div className="flex items-center justify-around h-14">
        {TABS.map((tab) => {
          const Icon = tab.icon;
          const isActive = tab.path && location.pathname.startsWith(tab.path);
          const isSearch = tab.id === 'search';

          return (
            <button
              key={tab.id}
              onClick={() => {
                if (isSearch) {
                  dispatch(setSearchOpen(true));
                } else {
                  navigate(tab.path);
                }
              }}
              className={cn(
                'flex flex-col items-center justify-center gap-0.5 w-14 h-full transition-colors',
                isActive ? 'text-primary' : 'text-muted-foreground',
                isSearch && 'relative'
              )}
            >
              {tab.id === 'add' ? (
                <div className="w-9 h-9 rounded-full bg-primary flex items-center justify-center -mt-3 shadow-lg">
                  <Icon className="w-5 h-5 text-primary-foreground" />
                </div>
              ) : (
                <Icon className={cn('w-5 h-5', isActive && 'text-primary')} />
              )}
              <span className={cn('text-[10px]', tab.id === 'add' && 'mt-0')}>{tab.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
