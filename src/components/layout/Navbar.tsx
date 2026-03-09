import React from 'react';
import { Search, UserPlus, CalendarPlus } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '../../store';
import { setSearchOpen } from '../../store/slices/globalSlice';
import NotificationDropdown from '../common/NotificationDropdown';
import ThemeToggle from '../common/ThemeToggle';
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
  'add-patient': 'Add Patient',
  'edit-patient': 'Edit Patient',
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
            <React.Fragment key={crumb.path}>
              {i > 0 && <BreadcrumbSeparator className="hidden md:block" />}
              <BreadcrumbItem className={isLast ? '' : 'hidden md:block'}>
                {isLast ? (
                  <BreadcrumbPage>{crumb.label}</BreadcrumbPage>
                ) : (
                  <BreadcrumbLink href={crumb.path}>{crumb.label}</BreadcrumbLink>
                )}
              </BreadcrumbItem>
            </React.Fragment>
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
    <header className="flex h-14 shrink-0 items-center border-b border-border bg-card/80 backdrop-blur-sm px-4 transition-[width,height] ease-linear group-has-[[data-collapsible=icon]]/sidebar-wrapper:h-12">
      <div className="flex items-center gap-2 min-w-0">
        <SidebarTrigger className="-ml-1" />
        <Separator orientation="vertical" className="mr-2 h-4" />
        <NavBreadcrumbs />
      </div>

      <div className="flex-1 flex items-center justify-center gap-2 px-4">
        <button
          aria-label="Open search (Cmd+K)"
          onClick={() => dispatch(setSearchOpen(true))}
          className="flex items-center gap-2 h-9 w-full max-w-md px-3 text-sm text-muted-foreground bg-muted/50 border border-border/60 rounded-lg hover:bg-background hover:border-border focus:bg-background focus:border-primary/40 active:bg-background transition-all cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/20"
        >
          <Search className="w-3.5 h-3.5 shrink-0" />
          <span className="hidden md:inline text-left flex-1">Search patients, commands…</span>
          <kbd className="hidden lg:inline-flex ml-auto items-center gap-0.5 px-1.5 h-5 rounded text-[10px] font-mono border border-border text-muted-foreground bg-background">
            <span className="text-[11px]">&#8984;</span>K
          </kbd>
        </button>
      </div>

      <div className="flex items-center gap-1.5">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate('/add-patient')}
          className="hidden sm:flex items-center gap-1.5 h-8 px-2.5 text-muted-foreground hover:text-foreground"
          title="Register new patient"
        >
          <UserPlus className="w-4 h-4" />
          <span className="text-xs font-medium hidden lg:inline">New Patient</span>
        </Button>

        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate('/appointments')}
          className="hidden sm:flex items-center gap-1.5 h-8 px-2.5 text-muted-foreground hover:text-foreground"
          title="Book appointment"
        >
          <CalendarPlus className="w-4 h-4" />
          <span className="text-xs font-medium hidden lg:inline">Appointment</span>
        </Button>

        <Separator orientation="vertical" className="h-4 hidden sm:block" />
        <ThemeToggle />
        <NotificationDropdown />

        <button
          onClick={() => navigate('/profile')}
          aria-label="User profile"
          className="h-8 w-8 rounded-lg flex items-center justify-center hover:bg-muted active:bg-muted/80 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/20"
        >
          <div className="w-7 h-7 rounded-md bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center text-[10px] font-bold text-primary-foreground">
            {userInitials}
          </div>
        </button>
      </div>
    </header>
  );
}
