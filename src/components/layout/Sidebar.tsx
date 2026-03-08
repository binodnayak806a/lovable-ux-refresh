import { useMemo, useCallback } from 'react';
import {
  LayoutDashboard,
  Users,
  CalendarCheck,
  BedDouble,
  FlaskConical,
  Pill,
  AlertTriangle,
  Stethoscope,
  BarChart3,
  FileText,
  Settings,
  Database,
  Shield,
  LogOut,
  ChevronsUpDown,
  ClipboardList,
  Building2,
} from 'lucide-react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import { useAppSelector, useAppDispatch } from '../../store';
import { usePermissions } from '../../hooks/usePermissions';
import { authService } from '../../services/auth.service';
import { clearAuth } from '../../store/slices/authSlice';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuBadge,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
  SidebarSeparator,
  useSidebar,
} from '../ui/sidebar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '../ui/dropdown-menu';
import { Avatar, AvatarFallback } from '../ui/avatar';

interface NavItem {
  id: string;
  label: string;
  icon: React.ElementType;
  path: string;
  module?: string;
  badge?: string;
}

interface NavGroup {
  label: string;
  items: NavItem[];
}

const NAV_GROUPS: NavGroup[] = [
  {
    label: '',
    items: [
      { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, path: '/dashboard', module: 'dashboard' },
    ],
  },
  {
    label: 'Clinic',
    items: [
      { id: 'appointments', label: 'Reservations', icon: CalendarCheck, path: '/appointments', module: 'appointments' },
      { id: 'patients', label: 'Patients', icon: Users, path: '/patients', module: 'patients' },
      { id: 'opd', label: 'Treatments', icon: ClipboardList, path: '/opd', module: 'opd' },
      { id: 'doctor-queue', label: 'Staff List', icon: Stethoscope, path: '/doctor/queue', module: 'doctor_queue' },
    ],
  },
  {
    label: 'Finance',
    items: [
      { id: 'analytics', label: 'Accounts', icon: BarChart3, path: '/analytics', module: 'analytics' },
      { id: 'reports', label: 'Sales', icon: FileText, path: '/reports', module: 'reports' },
      { id: 'pharmacy', label: 'Purchases', icon: Pill, path: '/pharmacy', module: 'pharmacy' },
    ],
  },
  {
    label: 'Physical Asset',
    items: [
      { id: 'ipd', label: 'Stocks', icon: BedDouble, path: '/ipd', module: 'ipd' },
      { id: 'lab', label: 'Peripherals', icon: FlaskConical, path: '/lab', module: 'lab' },
    ],
  },
  {
    label: '',
    items: [
      { id: 'masters', label: 'Report', icon: Database, path: '/master', module: 'masters' },
      { id: 'emergency', label: 'Emergency', icon: AlertTriangle, path: '/emergency', module: 'emergency', badge: 'LIVE' },
      { id: 'hrms', label: 'HRMS', icon: Building2, path: '/hrms', module: 'hrms' },
      { id: 'admin', label: 'Admin', icon: Shield, path: '/admin', module: 'admin' },
      { id: 'settings', label: 'Settings', icon: Settings, path: '/settings', module: 'settings' },
    ],
  },
];

const ROLE_LABELS: Record<string, string> = {
  superadmin: 'Super Admin',
  admin: 'Admin',
  doctor: 'Doctor',
  receptionist: 'Receptionist',
  nurse: 'Nurse',
  billing: 'Billing',
  pharmacist: 'Pharmacist',
  lab_technician: 'Lab Tech',
};

function NavGroupSection({ group }: { group: NavGroup }) {
  const location = useLocation();
  const { setOpenMobile, isMobile } = useSidebar();

  if (group.items.length === 0) return null;

  return (
    <SidebarGroup>
      {group.label && <SidebarGroupLabel>{group.label}</SidebarGroupLabel>}
      <SidebarGroupContent>
        <SidebarMenu>
          {group.items.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path || location.pathname.startsWith(item.path + '/');

            return (
              <SidebarMenuItem key={item.id}>
                <SidebarMenuButton
                  asChild
                  isActive={isActive}
                  tooltip={item.label}
                >
                  <NavLink
                    to={item.path}
                    onClick={() => isMobile && setOpenMobile(false)}
                  >
                    <Icon />
                    <span>{item.label}</span>
                  </NavLink>
                </SidebarMenuButton>
                {item.badge && (
                  <SidebarMenuBadge className="bg-destructive/10 text-destructive text-[10px] font-bold px-1.5 rounded-full">
                    {item.badge}
                  </SidebarMenuBadge>
                )}
              </SidebarMenuItem>
            );
          })}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  );
}

function SidebarUserFooter() {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { user } = useAppSelector((state) => state.auth);
  const { role } = usePermissions();
  const { isMobile, setOpenMobile } = useSidebar();

  const handleSignOut = useCallback(async () => {
    try {
      await authService.signOut();
    } finally {
      dispatch(clearAuth());
      navigate('/login', { replace: true });
    }
  }, [dispatch, navigate]);

  const userInitials = user?.full_name
    ?.split(' ')
    .slice(0, 2)
    .map((n: string) => n[0])
    .join('')
    .toUpperCase() ?? 'AD';

  const userName = user?.full_name || 'Admin User';
  const roleLabel = ROLE_LABELS[role] ?? role;

  return (
    <SidebarFooter>
      <SidebarMenu>
        <SidebarMenuItem>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <SidebarMenuButton
                size="lg"
                className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
              >
                <Avatar className="h-8 w-8 rounded-full">
                  <AvatarFallback className="rounded-full bg-primary text-primary-foreground text-xs font-bold">
                    {userInitials}
                  </AvatarFallback>
                </Avatar>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-semibold text-foreground">{userName}</span>
                  <span className="truncate text-xs text-muted-foreground">
                    {roleLabel}
                  </span>
                </div>
                <ChevronsUpDown className="ml-auto size-4 text-muted-foreground" />
              </SidebarMenuButton>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              className="w-[--radix-dropdown-menu-trigger-width] min-w-56 rounded-xl"
              side={isMobile ? 'bottom' : 'right'}
              align="end"
              sideOffset={4}
            >
              <DropdownMenuLabel className="p-0 font-normal">
                <div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
                  <Avatar className="h-8 w-8 rounded-full">
                    <AvatarFallback className="rounded-full bg-primary text-primary-foreground text-xs font-bold">
                      {userInitials}
                    </AvatarFallback>
                  </Avatar>
                  <div className="grid flex-1 text-left text-sm leading-tight">
                    <span className="truncate font-semibold">{userName}</span>
                    <span className="truncate text-xs text-muted-foreground">
                      {roleLabel}
                    </span>
                  </div>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => {
                if (isMobile) setOpenMobile(false);
                navigate('/profile');
              }}>
                <Users className="mr-2 size-4" />
                Profile
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => {
                if (isMobile) setOpenMobile(false);
                navigate('/settings');
              }}>
                <Settings className="mr-2 size-4" />
                Settings
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleSignOut} className="text-destructive focus:text-destructive focus:bg-destructive/5">
                <LogOut className="mr-2 size-4" />
                Sign out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </SidebarMenuItem>
      </SidebarMenu>
    </SidebarFooter>
  );
}

export default function AppSidebar() {
  const { canAccessModule } = usePermissions();

  const filteredGroups = useMemo(() => {
    return NAV_GROUPS
      .map((group) => ({
        ...group,
        items: group.items.filter((item) => !item.module || canAccessModule(item.module)),
      }))
      .filter((group) => group.items.length > 0);
  }, [canAccessModule]);

  return (
    <Sidebar collapsible="icon" variant="sidebar">
      <SidebarHeader className="border-b border-sidebar-border px-4 py-4">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild className="hover:bg-transparent active:bg-transparent">
              <NavLink to="/dashboard">
                <div className="flex aspect-square size-9 items-center justify-center rounded-xl bg-primary shadow-sm">
                  <span className="text-primary-foreground font-bold text-sm">Z</span>
                </div>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-bold tracking-tight text-foreground">Zendenta</span>
                  <span className="truncate text-[11px] text-muted-foreground">
                    Healthcare Clinic
                  </span>
                </div>
              </NavLink>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent className="px-2">
        {filteredGroups.map((group, i) => (
          <NavGroupSection key={group.label || `group-${i}`} group={group} />
        ))}
      </SidebarContent>

      <SidebarSeparator />
      <SidebarUserFooter />
      <SidebarRail />
    </Sidebar>
  );
}
