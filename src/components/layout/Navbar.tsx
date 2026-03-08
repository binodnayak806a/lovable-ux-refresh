import { Search, HelpCircle, BarChart3, Settings as SettingsIcon } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '../../store';
import { setSearchOpen } from '../../store/slices/globalSlice';
import NotificationDropdown from '../common/NotificationDropdown';
import { SidebarTrigger } from '../ui/sidebar';
import { Separator } from '../ui/separator';
import { Avatar, AvatarFallback } from '../ui/avatar';
import { Button } from '../ui/button';

const PATH_LABELS: Record<string, string> = {
  dashboard: 'Dashboard',
  patients: 'Patients',
  appointments: 'Reservations',
  opd: 'Treatments',
  ipd: 'Stocks',
  doctor: 'Doctor',
  queue: 'Staff List',
  lab: 'Peripherals',
  pharmacy: 'Purchases',
  ambulance: 'Ambulance',
  emergency: 'Emergency',
  reports: 'Sales',
  analytics: 'Accounts',
  master: 'Report',
  hrms: 'HRMS',
  admin: 'Admin',
  settings: 'Settings',
  billing: 'Billing',
  profile: 'Profile',
  notifications: 'Notifications',
};

export default function Navbar() {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAppSelector((state) => state.auth);

  const segments = location.pathname.split('/').filter(Boolean);
  const pageTitle = segments.length > 0
    ? PATH_LABELS[segments[0]] || segments[0].charAt(0).toUpperCase() + segments[0].slice(1)
    : 'Dashboard';

  const userInitials = user?.full_name
    ?.split(' ')
    .slice(0, 2)
    .map((n: string) => n[0])
    .join('')
    .toUpperCase() ?? 'DS';

  const userName = user?.full_name || 'Admin User';

  return (
    <header className="flex h-16 shrink-0 items-center gap-3 border-b border-border bg-card px-4 lg:px-6">
      <div className="flex items-center gap-3">
        <SidebarTrigger className="-ml-1 text-muted-foreground hover:text-foreground" />
        <Separator orientation="vertical" className="h-5" />
        <h1 className="text-lg font-semibold text-foreground tracking-tight">{pageTitle}</h1>
      </div>

      <div className="ml-auto flex items-center gap-1.5">
        {/* Search */}
        <button
          aria-label="Open search (Cmd+K)"
          onClick={() => dispatch(setSearchOpen(true))}
          className="flex items-center gap-2 h-9 px-3.5 text-sm text-muted-foreground bg-background border border-border rounded-full hover:border-primary/30 hover:bg-card focus:bg-card transition-all cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/20"
        >
          <Search className="w-4 h-4 shrink-0" />
          <span className="hidden md:inline">Search for anything here...</span>
          <kbd className="hidden lg:inline-flex ml-2 items-center gap-0.5 px-1.5 h-5 rounded text-[10px] font-mono border border-border text-muted-foreground bg-background">
            <span className="text-[11px]">&#8984;</span>K
          </kbd>
        </button>

        {/* Action buttons */}
        <Button
          size="sm"
          className="h-9 w-9 rounded-full bg-primary text-primary-foreground shadow-sm hover:bg-primary-dark"
          onClick={() => navigate('/opd')}
          aria-label="Quick add"
        >
          <span className="text-lg leading-none">+</span>
        </Button>

        <Button variant="ghost" size="icon" className="h-9 w-9 rounded-full text-muted-foreground hover:text-foreground">
          <HelpCircle className="w-4.5 h-4.5" />
        </Button>

        <Button variant="ghost" size="icon" className="h-9 w-9 rounded-full text-muted-foreground hover:text-foreground">
          <BarChart3 className="w-4.5 h-4.5" />
        </Button>

        <Button variant="ghost" size="icon" className="h-9 w-9 rounded-full text-muted-foreground hover:text-foreground" onClick={() => navigate('/settings')}>
          <SettingsIcon className="w-4.5 h-4.5" />
        </Button>

        <NotificationDropdown />

        {/* User */}
        <button
          onClick={() => navigate('/profile')}
          aria-label="User profile"
          className="flex items-center gap-2.5 h-9 pl-1 pr-3 rounded-full hover:bg-accent transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/20 ml-1"
        >
          <Avatar className="h-8 w-8">
            <AvatarFallback className="bg-primary text-primary-foreground text-xs font-bold">
              {userInitials}
            </AvatarFallback>
          </Avatar>
          <div className="hidden md:flex flex-col text-left leading-tight">
            <span className="text-sm font-semibold text-foreground">{userName}</span>
            <span className="text-[11px] text-muted-foreground">Super admin</span>
          </div>
        </button>
      </div>
    </header>
  );
}
