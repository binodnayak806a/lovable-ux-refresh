import { Search, UserPlus, CalendarPlus } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '../../store';
import { setSearchOpen } from '../../store/slices/globalSlice';
import NotificationDropdown from '../common/NotificationDropdown';
import { SidebarTrigger } from '../ui/sidebar';
import { Separator } from '../ui/separator';
import { Button } from '../ui/button';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '../ui/breadcrumb';

const PATH_LABELS: Record<string, string> = {
  dashboard: 'Dashboard',
  patients: 'Patients',
  appointments: 'Appointments',
  opd: 'OPD',
  ipd: 'IPD',
  doctor: 'Doctor',
  queue: 'Queue',
  lab: 'Laboratory',
  pharmacy: 'Pharmacy',
  ambulance: 'Ambulance',
  emergency: 'Emergency',
  reports: 'Reports',
  analytics: 'Analytics',
  master: 'Masters',
  hrms: 'HRMS',
  admin: 'Admin',
  settings: 'Settings',
  billing: 'Billing',
  profile: 'Profile',
  notifications: 'Notifications',
};

function NavBreadcrumbs() {
  const location = useLocation();
  const segments = location.pathname.split('/').filter(Boolean);

  if (segments.length === 0) return null;

  const crumbs = segments.map((segment, index) => {
    const path = '/' + segments.slice(0, index + 1).join('/');
    const label = PATH_LABELS[segment] || segment.charAt(0).toUpperCase() + segment.slice(1).replace(/-/g, ' ');
    return { path, label };
  });

  return (
    <Breadcrumb>
      <BreadcrumbList>
        {crumbs.map((crumb, i) => {
          const isLast = i === crumbs.length - 1;
          return (
            <BreadcrumbItem key={crumb.path} className={isLast ? '' : 'hidden md:block'}>
              {i > 0 && <BreadcrumbSeparator className="hidden md:block" />}
              {isLast ? (
                <BreadcrumbPage>{crumb.label}</BreadcrumbPage>
              ) : (
                <BreadcrumbLink href={crumb.path}>{crumb.label}</BreadcrumbLink>
              )}
            </BreadcrumbItem>
          );
        })}
      </BreadcrumbList>
    </Breadcrumb>
  );
}

export default function Navbar() {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { user } = useAppSelector((state) => state.auth);

  const userInitials = user?.full_name
    ?.split(' ')
    .slice(0, 2)
    .map((n: string) => n[0])
    .join('')
    .toUpperCase() ?? 'AD';

  return (
    <header className="flex h-16 shrink-0 items-center border-b border-gray-100 bg-white/80 backdrop-blur-sm px-4 transition-[width,height] ease-linear group-has-[[data-collapsible=icon]]/sidebar-wrapper:h-12">
      <div className="flex items-center gap-2 min-w-0">
        <SidebarTrigger className="-ml-1" />
        <Separator orientation="vertical" className="mr-2 h-4" />
        <NavBreadcrumbs />
      </div>

      <div className="flex-1 flex items-center justify-center gap-2 px-4">
        <button
          aria-label="Open search (Cmd+K)"
          onClick={() => dispatch(setSearchOpen(true))}
          className="flex items-center gap-2 h-8 w-full max-w-sm px-3 text-sm text-muted-foreground bg-muted/50 border border-border/60 rounded-lg hover:bg-background hover:border-border focus:bg-background focus:border-primary/40 active:bg-background transition-all cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/20"
        >
          <Search className="w-3.5 h-3.5 shrink-0" />
          <span className="hidden md:inline text-left flex-1">Search...</span>
          <kbd className="hidden lg:inline-flex ml-auto items-center gap-0.5 px-1.5 h-5 rounded text-[10px] font-mono border border-border text-muted-foreground bg-background">
            <span className="text-[11px]">&#8984;</span>K
          </kbd>
        </button>

        <Button
          variant="outline"
          size="sm"
          onClick={() => navigate('/add-patient')}
          className="hidden sm:flex items-center gap-1.5 h-8 px-3 border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 hover:text-emerald-800"
        >
          <UserPlus className="w-3.5 h-3.5" />
          <span className="text-xs font-medium">Add Patient</span>
        </Button>

        <Button
          variant="outline"
          size="sm"
          onClick={() => navigate('/appointments')}
          className="hidden sm:flex items-center gap-1.5 h-8 px-3 border-blue-200 bg-blue-50 text-blue-700 hover:bg-blue-100 hover:text-blue-800"
        >
          <CalendarPlus className="w-3.5 h-3.5" />
          <span className="text-xs font-medium">Add Appointment</span>
        </Button>
      </div>

      <div className="flex items-center gap-2">
        <NotificationDropdown />

        <button
          onClick={() => navigate('/profile')}
          aria-label="User profile"
          className="h-9 w-9 rounded-lg flex items-center justify-center hover:bg-gray-100 active:bg-gray-200 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/20"
        >
          <div className="w-7 h-7 rounded-md bg-gradient-to-br from-primary-500 to-primary-600 flex items-center justify-center text-[10px] font-bold text-white">
            {userInitials}
          </div>
        </button>
      </div>
    </header>
  );
}
