import { NavLink, Outlet, useLocation } from 'react-router-dom';
import {
  Stethoscope, Building2, BedDouble, Wrench, Package, Pill,
  ThermometerSun, FlaskConical, SlidersHorizontal, Users,
  Receipt, CalendarCheck, LayoutTemplate,
} from 'lucide-react';
import { cn } from '../../lib/utils';

const SECTIONS = [
  { label: 'Clinical', items: [
    { path: '/master/doctors', label: 'Doctors', icon: Stethoscope },
    { path: '/master/departments', label: 'Departments', icon: Building2 },
    { path: '/master/symptoms', label: 'Symptoms', icon: ThermometerSun },
    { path: '/master/medicines', label: 'Medicines', icon: Pill },
    { path: '/master/lab-tests', label: 'Lab Tests', icon: FlaskConical },
  ]},
  { label: 'Facilities', items: [
    { path: '/master/rooms', label: 'Wards & Beds', icon: BedDouble },
    { path: '/master/services', label: 'Services', icon: Wrench },
    { path: '/master/packages', label: 'Packages', icon: Package },
  ]},
  { label: 'Configuration', items: [
    { path: '/master/visit-types', label: 'Visit Types', icon: CalendarCheck },
    { path: '/master/gst', label: 'GST Config', icon: Receipt },
    { path: '/master/custom-fields', label: 'Custom Fields', icon: SlidersHorizontal },
    { path: '/master/users', label: 'Users & Roles', icon: Users },
    { path: '/master/print-templates', label: 'Print Templates', icon: LayoutTemplate },
  ]},
];

export default function MastersLayout() {
  const location = useLocation();
  const isIndex = location.pathname === '/master';

  return (
    <div className="flex h-full">
      <aside className="w-56 shrink-0 border-r border-gray-200 bg-white overflow-y-auto hidden lg:block">
        <div className="px-4 py-4 border-b border-gray-100">
          <h3 className="text-sm font-bold text-gray-900">Masters</h3>
          <p className="text-[11px] text-gray-500 mt-0.5">Manage reference data</p>
        </div>
        <nav className="p-2 space-y-3">
          {SECTIONS.map(section => (
            <div key={section.label}>
              <div className="px-3 py-1.5 text-[10px] font-semibold text-gray-400 uppercase tracking-wider">
                {section.label}
              </div>
              <div className="space-y-0.5">
                {section.items.map(item => (
                  <NavLink
                    key={item.path}
                    to={item.path}
                    className={({ isActive }) => cn(
                      'flex items-center gap-2.5 px-3 py-2 rounded-lg text-[13px] font-medium transition-colors',
                      isActive
                        ? 'bg-blue-50 text-blue-700 border border-blue-100'
                        : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                    )}
                  >
                    <item.icon className="w-4 h-4 shrink-0" />
                    {item.label}
                  </NavLink>
                ))}
              </div>
            </div>
          ))}
        </nav>
      </aside>

      <div className="flex-1 overflow-y-auto">
        <div className="lg:hidden px-4 pt-4 pb-2">
          <div className="flex items-center gap-2 overflow-x-auto pb-2 -mx-1 px-1">
            {SECTIONS.flatMap(s => s.items).map(item => (
              <NavLink
                key={item.path}
                to={item.path}
                className={({ isActive }) => cn(
                  'shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border transition-colors',
                  isActive
                    ? 'bg-blue-50 text-blue-700 border-blue-200'
                    : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300'
                )}
              >
                <item.icon className="w-3.5 h-3.5" />
                {item.label}
              </NavLink>
            ))}
          </div>
        </div>

        <div className="p-4 lg:p-6">
          {isIndex ? <MasterIndexPage /> : <Outlet />}
        </div>
      </div>
    </div>
  );
}

function MasterIndexPage() {
  return (
    <div className="max-w-3xl">
      <h1 className="text-xl font-bold text-gray-900 mb-1">Master Data Management</h1>
      <p className="text-sm text-gray-500 mb-6">Select a category from the sidebar to manage reference data.</p>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {SECTIONS.flatMap(s => s.items).map(item => (
          <NavLink
            key={item.path}
            to={item.path}
            className="flex items-center gap-3 p-4 rounded-xl border border-gray-200 hover:border-blue-200 hover:bg-blue-50/50 transition-all group"
          >
            <div className="p-2 rounded-lg bg-gray-100 group-hover:bg-blue-100 transition-colors">
              <item.icon className="w-5 h-5 text-gray-500 group-hover:text-blue-600 transition-colors" />
            </div>
            <span className="text-sm font-medium text-gray-700 group-hover:text-blue-700">{item.label}</span>
          </NavLink>
        ))}
      </div>
    </div>
  );
}
