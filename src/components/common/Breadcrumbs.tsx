import { Link, useLocation } from 'react-router-dom';
import { ChevronRight, Home } from 'lucide-react';
import { cn } from '../../lib/utils';

interface BreadcrumbItem {
  label: string;
  path?: string;
}

interface BreadcrumbsProps {
  items?: BreadcrumbItem[];
  className?: string;
}

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
  doctors: 'Doctors',
  departments: 'Departments',
  services: 'Services',
  packages: 'Packages',
  medicines: 'Medicines',
  symptoms: 'Symptoms',
  'lab-tests': 'Lab Tests',
  'custom-fields': 'Custom Fields',
  users: 'Users',
  gst: 'GST Config',
  'visit-types': 'Visit Types',
  'print-templates': 'Print Templates',
  'qr-code': 'QR Code',
  rooms: 'Rooms & Beds',
  beds: 'Rooms & Beds',
  register: 'Register',
};

export default function Breadcrumbs({ items, className }: BreadcrumbsProps) {
  const location = useLocation();

  const breadcrumbItems: BreadcrumbItem[] = items || (() => {
    const segments = location.pathname.split('/').filter(Boolean);
    const crumbs: BreadcrumbItem[] = [];

    let path = '';
    segments.forEach((segment, index) => {
      path += `/${segment}`;
      const label = PATH_LABELS[segment] || segment.charAt(0).toUpperCase() + segment.slice(1);

      crumbs.push({
        label,
        path: index < segments.length - 1 ? path : undefined,
      });
    });

    return crumbs;
  })();

  if (breadcrumbItems.length === 0) {
    return null;
  }

  return (
    <nav aria-label="Breadcrumb" className={cn('flex items-center text-sm', className)}>
      <Link
        to="/dashboard"
        className="text-gray-500 hover:text-gray-900 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 rounded"
        aria-label="Home"
      >
        <Home className="w-4 h-4" />
      </Link>
      {breadcrumbItems.map((item, index) => {
        const isLast = index === breadcrumbItems.length - 1;
        return (
          <div key={index} className="flex items-center">
            <ChevronRight className="w-4 h-4 mx-2 text-gray-400" aria-hidden="true" />
            {item.path && !isLast ? (
              <Link
                to={item.path}
                className="text-gray-500 hover:text-gray-900 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 rounded px-1"
              >
                {item.label}
              </Link>
            ) : (
              <span
                className={cn(
                  'px-1',
                  isLast ? 'text-gray-900 font-medium' : 'text-gray-500'
                )}
                aria-current={isLast ? 'page' : undefined}
              >
                {item.label}
              </span>
            )}
          </div>
        );
      })}
    </nav>
  );
}
