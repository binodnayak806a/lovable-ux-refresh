import { useState } from 'react';
import {
  BarChart, Bar, AreaChart, Area, PieChart, Pie, Cell,
  ResponsiveContainer, Tooltip, CartesianGrid, XAxis, YAxis, Legend,
} from 'recharts';

/* ━━━ SAMPLE DATA ━━━ */
const patients = [
  { name: 'Rajesh Kumar', id: 'PT-1024', age: 45, dept: 'Cardiology', doctor: 'Dr. Sharma', status: 'Critical', admitted: '2026-03-07', room: '301A', gender: 'M' },
  { name: 'Priya Patel', id: 'PT-1025', age: 32, dept: 'Orthopedics', doctor: 'Dr. Mehta', status: 'Stable', admitted: '2026-03-06', room: '204B', gender: 'F' },
  { name: 'Arjun Singh', id: 'PT-1026', age: 58, dept: 'Neurology', doctor: 'Dr. Gupta', status: 'Observation', admitted: '2026-03-08', room: '105A', gender: 'M' },
  { name: 'Meera Joshi', id: 'PT-1027', age: 27, dept: 'Pediatrics', doctor: 'Dr. Reddy', status: 'Recovering', admitted: '2026-03-05', room: '402C', gender: 'F' },
  { name: 'Vikram Rao', id: 'PT-1028', age: 63, dept: 'Emergency', doctor: 'Dr. Khan', status: 'Critical', admitted: '2026-03-09', room: '101A', gender: 'M' },
  { name: 'Ananya Das', id: 'PT-1029', age: 41, dept: 'Cardiology', doctor: 'Dr. Sharma', status: 'Stable', admitted: '2026-03-04', room: '303B', gender: 'F' },
];

const appointments = [
  { time: '09:00 AM', patient: 'Neha Verma', type: 'Consultation', doctor: 'Dr. Sharma', dept: 'Cardiology', status: 'Confirmed' },
  { time: '09:30 AM', patient: 'Amit Tiwari', type: 'Follow-up', doctor: 'Dr. Mehta', dept: 'Orthopedics', status: 'In Progress' },
  { time: '10:00 AM', patient: 'Kavita Nair', type: 'Surgery', doctor: 'Dr. Gupta', dept: 'Neurology', status: 'Confirmed' },
  { time: '10:30 AM', patient: 'Ravi Iyer', type: 'Consultation', doctor: 'Dr. Reddy', dept: 'Pediatrics', status: 'Pending' },
  { time: '11:00 AM', patient: 'Sunita Bose', type: 'Follow-up', doctor: 'Dr. Khan', dept: 'Emergency', status: 'Confirmed' },
  { time: '11:30 AM', patient: 'Dev Malhotra', type: 'Consultation', doctor: 'Dr. Sharma', dept: 'Cardiology', status: 'Pending' },
];

const staff = [
  { name: 'Dr. Sharma', role: 'Cardiologist', dept: 'Cardiology', patients: 12, status: 'On Duty', shift: '08:00 – 16:00' },
  { name: 'Dr. Mehta', role: 'Orthopedic Surgeon', dept: 'Orthopedics', patients: 8, status: 'On Duty', shift: '09:00 – 17:00' },
  { name: 'Dr. Gupta', role: 'Neurologist', dept: 'Neurology', patients: 6, status: 'Off Duty', shift: '14:00 – 22:00' },
  { name: 'Dr. Reddy', role: 'Pediatrician', dept: 'Pediatrics', patients: 15, status: 'On Duty', shift: '07:00 – 15:00' },
  { name: 'Dr. Khan', role: 'Emergency Physician', dept: 'Emergency', patients: 9, status: 'On Duty', shift: '06:00 – 14:00' },
  { name: 'Nurse Priya', role: 'Head Nurse', dept: 'Cardiology', patients: 20, status: 'On Duty', shift: '07:00 – 19:00' },
];

const admissionsData = [
  { day: 'Mon', admitted: 24, discharged: 18 },
  { day: 'Tue', admitted: 30, discharged: 22 },
  { day: 'Wed', admitted: 28, discharged: 25 },
  { day: 'Thu', admitted: 35, discharged: 20 },
  { day: 'Fri', admitted: 22, discharged: 28 },
  { day: 'Sat', admitted: 18, discharged: 15 },
  { day: 'Sun', admitted: 12, discharged: 10 },
];

const revenueData = [
  { month: 'Sep', revenue: 820000 },
  { month: 'Oct', revenue: 950000 },
  { month: 'Nov', revenue: 880000 },
  { month: 'Dec', revenue: 1100000 },
  { month: 'Jan', revenue: 1050000 },
  { month: 'Feb', revenue: 1200000 },
  { month: 'Mar', revenue: 1350000 },
];

const deptData = [
  { name: 'Cardiology', value: 32, color: '#1D4ED8' },
  { name: 'Orthopedics', value: 24, color: '#06B6D4' },
  { name: 'Neurology', value: 18, color: '#8B5CF6' },
  { name: 'Pediatrics', value: 15, color: '#22C55E' },
  { name: 'Emergency', value: 11, color: '#F59E0B' },
];

const statusColors: Record<string, { bg: string; text: string; dot: string }> = {
  Critical:      { bg: '#FEF2F2', text: '#DC2626', dot: '#EF4444' },
  Stable:        { bg: '#F0FDF4', text: '#16A34A', dot: '#22C55E' },
  Observation:   { bg: '#EFF6FF', text: '#2563EB', dot: '#3B82F6' },
  Recovering:    { bg: '#F0FDF4', text: '#15803D', dot: '#4ADE80' },
  Confirmed:     { bg: '#EFF6FF', text: '#1D4ED8', dot: '#3B82F6' },
  Pending:       { bg: '#FFFBEB', text: '#B45309', dot: '#F59E0B' },
  'In Progress': { bg: '#F5F3FF', text: '#6D28D9', dot: '#8B5CF6' },
  'On Duty':     { bg: '#F0FDF4', text: '#15803D', dot: '#22C55E' },
  'Off Duty':    { bg: '#F9FAFB', text: '#6B7280', dot: '#9CA3AF' },
};

function getInitials(name: string) {
  return name.split(' ').map(w => w[0]).join('').slice(0, 2);
}
function avatarColor(name: string) {
  const colors = ['#1D4ED8','#06B6D4','#8B5CF6','#22C55E','#F59E0B','#EF4444','#EC4899','#14B8A6'];
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return colors[Math.abs(hash) % colors.length];
}

function StatusBadge({ status }: { status: string }) {
  const c = statusColors[status] || statusColors.Stable;
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '4px 10px', borderRadius: 20, background: c.bg, color: c.text, fontSize: 12, fontWeight: 600, fontFamily: "'DM Sans', sans-serif" }}>
      <span style={{ width: 7, height: 7, borderRadius: '50%', background: c.dot }} />
      {status}
    </span>
  );
}

function Avatar({ name, size = 36 }: { name: string; size?: number }) {
  return (
    <div style={{ width: size, height: size, borderRadius: '50%', background: avatarColor(name), display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: size * 0.35, fontWeight: 700, fontFamily: "'DM Sans', sans-serif", flexShrink: 0 }}>
      {getInitials(name)}
    </div>
  );
}

/* ━━━ NAV ITEMS ━━━ */
const navItems = [
  { key: 'dashboard', label: 'Dashboard', icon: '📊' },
  { key: 'patients', label: 'Patients', icon: '👥' },
  { key: 'appointments', label: 'Appointments', icon: '📅' },
  { key: 'staff', label: 'Staff', icon: '🏥' },
  { key: 'pharmacy', label: 'Pharmacy', icon: '💊' },
  { key: 'billing', label: 'Billing', icon: '💳' },
  { key: 'reports', label: 'Reports', icon: '📈' },
];

const departments = [
  { name: 'Cardiology', color: '#1D4ED8' },
  { name: 'Orthopedics', color: '#06B6D4' },
  { name: 'Neurology', color: '#8B5CF6' },
  { name: 'Pediatrics', color: '#22C55E' },
  { name: 'Emergency', color: '#F59E0B' },
];

/* ━━━ MAIN COMPONENT ━━━ */
export default function PremiumDashboard() {
  const [page, setPage] = useState('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [patientFilter, setPatientFilter] = useState('All');
  const [apptFilter, setApptFilter] = useState('All');

  const sidebarW = sidebarOpen ? 230 : 64;

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&family=DM+Sans:ital,opsz,wght@0,9..40,100..1000;1,9..40,100..1000&display=swap');
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(10px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .fade-in   { animation: fadeInUp 0.35s ease 0s both; }
        .fade-in-2 { animation: fadeInUp 0.35s ease 0.05s both; }
        .fade-in-3 { animation: fadeInUp 0.35s ease 0.1s both; }
        .fade-in-4 { animation: fadeInUp 0.35s ease 0.15s both; }
        .fade-in-5 { animation: fadeInUp 0.35s ease 0.2s both; }
        .hov-card:hover { transform: translateY(-1px); box-shadow: 0 8px 25px rgba(0,0,0,0.08) !important; }
        .hov-row:hover { background: #F8FAFC !important; }
        .hov-nav:hover { background: #F1F5F9 !important; }
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: #CBD5E1; border-radius: 4px; }
        * { box-sizing: border-box; margin: 0; padding: 0; }
      `}</style>

      <div style={{ display: 'flex', height: '100vh', background: '#F8FAFC', fontFamily: "'DM Sans', sans-serif", color: '#0F172A' }}>
        {/* ━━━ SIDEBAR ━━━ */}
        <aside style={{ width: sidebarW, minWidth: sidebarW, height: '100vh', background: '#fff', borderRight: '1px solid #F1F5F9', display: 'flex', flexDirection: 'column', transition: 'width 0.25s cubic-bezier(.4,0,.2,1), min-width 0.25s cubic-bezier(.4,0,.2,1)', overflow: 'hidden', position: 'relative', zIndex: 10 }}>
          {/* Logo */}
          <div style={{ padding: sidebarOpen ? '20px 16px 12px' : '20px 0 12px', display: 'flex', alignItems: 'center', gap: 10, justifyContent: sidebarOpen ? 'flex-start' : 'center' }}>
            <div style={{ width: 36, height: 36, borderRadius: 10, background: 'linear-gradient(135deg, #1D4ED8, #2563EB)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: 18, fontWeight: 700, flexShrink: 0 }}>H</div>
            {sidebarOpen && (
              <div style={{ overflow: 'hidden', whiteSpace: 'nowrap' }}>
                <div style={{ fontFamily: "'Instrument Serif', serif", fontSize: 17, fontWeight: 700, color: '#0F172A' }}>HealthCore</div>
                <span style={{ fontSize: 10, fontWeight: 600, color: '#1D4ED8', background: '#EFF6FF', padding: '2px 8px', borderRadius: 10 }}>Pro Plan ✦</span>
              </div>
            )}
          </div>

          {/* Collapse toggle */}
          <button onClick={() => setSidebarOpen(!sidebarOpen)} style={{ position: 'absolute', top: 22, right: sidebarOpen ? 10 : -999, width: 24, height: 24, borderRadius: 6, border: '1px solid #E2E8F0', background: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, color: '#94A3B8' }}>
            {sidebarOpen ? '◀' : '▶'}
          </button>
          {!sidebarOpen && (
            <button onClick={() => setSidebarOpen(true)} style={{ margin: '0 auto', width: 28, height: 28, borderRadius: 6, border: '1px solid #E2E8F0', background: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, color: '#94A3B8', marginBottom: 8 }}>▶</button>
          )}

          {/* Nav items */}
          <nav style={{ flex: 1, padding: sidebarOpen ? '8px 8px' : '8px 6px', display: 'flex', flexDirection: 'column', gap: 2 }}>
            {navItems.map(item => {
              const active = page === item.key;
              return (
                <button key={item.key} className="hov-nav" onClick={() => setPage(item.key)} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: sidebarOpen ? '10px 12px' : '10px 0', borderRadius: 8, border: 'none', background: active ? '#EFF6FF' : 'transparent', cursor: 'pointer', width: '100%', textAlign: 'left', fontSize: 13.5, fontWeight: active ? 600 : 500, color: active ? '#1D4ED8' : '#475569', fontFamily: "'DM Sans', sans-serif", position: 'relative', justifyContent: sidebarOpen ? 'flex-start' : 'center', transition: 'background 0.15s' }}>
                  {active && <span style={{ position: 'absolute', left: 0, top: '50%', transform: 'translateY(-50%)', width: 3, height: 20, borderRadius: 4, background: '#1D4ED8' }} />}
                  <span style={{ fontSize: 18, lineHeight: 1 }}>{item.icon}</span>
                  {sidebarOpen && <span>{item.label}</span>}
                </button>
              );
            })}

            {/* Departments */}
            {sidebarOpen && (
              <div style={{ marginTop: 20 }}>
                <div style={{ fontSize: 10, fontWeight: 600, textTransform: 'uppercase', color: '#94A3B8', padding: '0 12px', marginBottom: 8, letterSpacing: 1 }}>Departments</div>
                {departments.map(d => (
                  <div key={d.name} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '7px 12px', fontSize: 13, color: '#475569' }}>
                    <span style={{ width: 8, height: 8, borderRadius: '50%', background: d.color, flexShrink: 0 }} />
                    {d.name}
                  </div>
                ))}
              </div>
            )}
          </nav>

          {/* Bottom user */}
          <div style={{ padding: sidebarOpen ? '14px 12px' : '14px 6px', borderTop: '1px solid #F1F5F9', display: 'flex', alignItems: 'center', gap: 10, justifyContent: sidebarOpen ? 'flex-start' : 'center' }}>
            <Avatar name="Dr Admin" size={34} />
            {sidebarOpen && (
              <div style={{ overflow: 'hidden' }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: '#0F172A', whiteSpace: 'nowrap' }}>Dr. Admin</div>
                <div style={{ fontSize: 11, color: '#94A3B8' }}>Super Admin</div>
              </div>
            )}
          </div>
        </aside>

        {/* ━━━ MAIN ━━━ */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          {/* Top bar */}
          <header style={{ height: 58, borderBottom: '1px solid #F1F5F9', background: '#fff', display: 'flex', alignItems: 'center', padding: '0 24px', gap: 16, flexShrink: 0, position: 'sticky', top: 0, zIndex: 5 }}>
            <div style={{ fontSize: 13, color: '#94A3B8' }}>
              <span style={{ color: '#475569' }}>HealthCore</span> <span style={{ margin: '0 6px' }}>/</span> <span style={{ color: '#0F172A', fontWeight: 600 }}>{navItems.find(n => n.key === page)?.label}</span>
            </div>
            <div style={{ flex: 1 }} />
            <div style={{ position: 'relative', width: 280 }}>
              <input placeholder="Search... ⌘K" style={{ width: '100%', padding: '8px 14px', borderRadius: 10, border: '1px solid #E2E8F0', background: '#F8FAFC', fontSize: 13, fontFamily: "'DM Sans', sans-serif", outline: 'none', color: '#0F172A' }} />
            </div>
            <div style={{ position: 'relative', cursor: 'pointer', fontSize: 20 }}>
              🔔
              <span style={{ position: 'absolute', top: -2, right: -4, width: 9, height: 9, borderRadius: '50%', background: '#EF4444', border: '2px solid #fff' }} />
            </div>
            <Avatar name="Dr Admin" size={32} />
          </header>

          {/* Content */}
          <main style={{ flex: 1, overflow: 'auto', padding: 24 }}>
            {page === 'dashboard' && <DashboardView />}
            {page === 'patients' && <PatientsView filter={patientFilter} setFilter={setPatientFilter} />}
            {page === 'appointments' && <AppointmentsView filter={apptFilter} setFilter={setApptFilter} />}
            {page === 'staff' && <StaffView />}
            {page === 'pharmacy' && <EmptyPage icon="💊" title="Pharmacy Management" desc="Manage inventory, prescriptions, and drug dispensing from one place." />}
            {page === 'billing' && <EmptyPage icon="💳" title="Billing & Invoices" desc="Create invoices, track payments, and manage insurance claims effortlessly." />}
            {page === 'reports' && <EmptyPage icon="📈" title="Reports & Analytics" desc="Generate detailed reports on hospital performance, revenue, and patient outcomes." />}
          </main>
        </div>
      </div>
    </>
  );
}

/* ━━━ DASHBOARD VIEW ━━━ */
function DashboardView() {
  const kpis = [
    { label: 'Total Patients', value: '1,248', trend: '+12.5%', sub: 'vs last month', icon: '👥', trendUp: true, bg: '#EFF6FF', iconBg: '#DBEAFE' },
    { label: "Today's Admissions", value: '42', trend: '+8.2%', sub: 'vs yesterday', icon: '🏥', trendUp: true, bg: '#F0FDF4', iconBg: '#DCFCE7' },
    { label: 'Surgeries Today', value: '8', trend: '-2.1%', sub: 'vs last week avg', icon: '🔬', trendUp: false, bg: '#FEF2F2', iconBg: '#FEE2E2' },
    { label: 'Bed Occupancy', value: '78%', trend: '+3.4%', sub: '312 of 400 beds', icon: '🛏️', trendUp: true, bg: '#F5F3FF', iconBg: '#EDE9FE' },
    { label: 'Monthly Revenue', value: '₹13.5L', trend: '+15.8%', sub: 'vs last month', icon: '💰', trendUp: true, bg: '#FFFBEB', iconBg: '#FEF3C7' },
  ];

  return (
    <div>
      {/* Header */}
      <div className="fade-in" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 }}>
        <div>
          <h1 style={{ fontFamily: "'Instrument Serif', serif", fontSize: 28, fontWeight: 700, color: '#0F172A', marginBottom: 4 }}>Good morning, Dr. Admin 👋</h1>
          <p style={{ fontSize: 14, color: '#94A3B8' }}>Here's what's happening at your hospital today, {new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</p>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button style={{ padding: '8px 18px', borderRadius: 10, border: '1px solid #E2E8F0', background: '#fff', fontSize: 13, fontWeight: 600, cursor: 'pointer', color: '#475569', fontFamily: "'DM Sans', sans-serif" }}>Today</button>
          <button style={{ padding: '8px 18px', borderRadius: 10, border: 'none', background: 'linear-gradient(135deg, #1D4ED8, #2563EB)', color: '#fff', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: "'DM Sans', sans-serif", boxShadow: '0 4px 12px rgba(29,78,216,0.3)' }}>+ Admit Patient</button>
        </div>
      </div>

      {/* KPI Cards */}
      <div style={{ display: 'flex', gap: 16, marginBottom: 24 }}>
        {kpis.map((kpi, i) => (
          <div key={kpi.label} className={`hov-card fade-in-${Math.min(i + 1, 5)}`} style={{ flex: 1, background: '#fff', border: '1px solid #F1F5F9', borderRadius: 14, padding: 18, cursor: 'pointer', transition: 'box-shadow 0.2s, transform 0.2s', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
              <span style={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase', color: '#94A3B8', letterSpacing: 0.5 }}>{kpi.label}</span>
              <div style={{ width: 36, height: 36, borderRadius: 10, background: kpi.iconBg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18 }}>{kpi.icon}</div>
            </div>
            <div style={{ fontFamily: "'Instrument Serif', serif", fontSize: 28, fontWeight: 700, color: '#0F172A', marginBottom: 6 }}>{kpi.value}</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ fontSize: 12, fontWeight: 600, color: kpi.trendUp ? '#22C55E' : '#EF4444' }}>{kpi.trend}</span>
              <span style={{ fontSize: 12, color: '#94A3B8' }}>{kpi.sub}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Charts Row */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.6fr 1fr 1fr', gap: 16, marginBottom: 24 }}>
        {/* Patient Flow */}
        <div className="fade-in-3" style={{ background: '#fff', border: '1px solid #F1F5F9', borderRadius: 14, padding: 20 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <h3 style={{ fontFamily: "'Instrument Serif', serif", fontSize: 17, fontWeight: 600 }}>Patient Flow</h3>
            <span style={{ fontSize: 12, color: '#94A3B8' }}>Last 7 days</span>
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={admissionsData} barGap={4}>
              <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false} />
              <XAxis dataKey="day" tick={{ fontSize: 12, fill: '#94A3B8' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 12, fill: '#94A3B8' }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ borderRadius: 10, border: '1px solid #F1F5F9', fontSize: 13, fontFamily: "'DM Sans', sans-serif" }} />
              <Legend wrapperStyle={{ fontSize: 12, fontFamily: "'DM Sans', sans-serif" }} />
              <Bar dataKey="admitted" fill="#1D4ED8" radius={[4, 4, 0, 0]} name="Admitted" />
              <Bar dataKey="discharged" fill="#22C55E" radius={[4, 4, 0, 0]} name="Discharged" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Department Donut */}
        <div className="fade-in-4" style={{ background: '#fff', border: '1px solid #F1F5F9', borderRadius: 14, padding: 20 }}>
          <h3 style={{ fontFamily: "'Instrument Serif', serif", fontSize: 17, fontWeight: 600, marginBottom: 16 }}>Department Load</h3>
          <ResponsiveContainer width="100%" height={130}>
            <PieChart>
              <Pie data={deptData} cx="50%" cy="50%" innerRadius={35} outerRadius={55} dataKey="value" paddingAngle={3}>
                {deptData.map(d => <Cell key={d.name} fill={d.color} />)}
              </Pie>
              <Tooltip contentStyle={{ borderRadius: 10, border: '1px solid #F1F5F9', fontSize: 12, fontFamily: "'DM Sans', sans-serif" }} />
            </PieChart>
          </ResponsiveContainer>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginTop: 8 }}>
            {deptData.map(d => (
              <div key={d.name} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: '#475569' }}>
                <span style={{ width: 10, height: 10, borderRadius: 2, background: d.color, flexShrink: 0 }} />
                <span style={{ flex: 1 }}>{d.name}</span>
                <span style={{ fontWeight: 600, color: '#0F172A' }}>{d.value}%</span>
              </div>
            ))}
          </div>
        </div>

        {/* Revenue Card */}
        <div className="fade-in-5" style={{ background: 'linear-gradient(135deg, #1D4ED8, #0369A1)', borderRadius: 14, padding: 20, color: '#fff' }}>
          <div style={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5, opacity: 0.8, marginBottom: 4 }}>Monthly Revenue</div>
          <div style={{ fontFamily: "'Instrument Serif', serif", fontSize: 32, fontWeight: 700, marginBottom: 2 }}>₹13.5L</div>
          <span style={{ fontSize: 12, color: '#A7F3D0' }}>▲ +15.8% vs last month</span>
          <ResponsiveContainer width="100%" height={120} style={{ marginTop: 12 }}>
            <AreaChart data={revenueData}>
              <Area type="monotone" dataKey="revenue" stroke="rgba(255,255,255,0.9)" strokeWidth={2} fill="rgba(255,255,255,0.15)" />
              <Tooltip contentStyle={{ borderRadius: 10, fontSize: 12, fontFamily: "'DM Sans', sans-serif" }} formatter={(v: number) => `₹${(v / 100000).toFixed(1)}L`} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Bottom Row */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: 16 }}>
        {/* Recent Patients */}
        <div className="fade-in-3" style={{ background: '#fff', border: '1px solid #F1F5F9', borderRadius: 14, padding: 20 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
            <h3 style={{ fontFamily: "'Instrument Serif', serif", fontSize: 17, fontWeight: 600 }}>Recent Patients</h3>
            <span style={{ fontSize: 13, color: '#1D4ED8', fontWeight: 600, cursor: 'pointer' }}>View all →</span>
          </div>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead>
              <tr style={{ borderBottom: '1px solid #F1F5F9' }}>
                {['Patient', 'Department', 'Doctor', 'Status'].map(h => (
                  <th key={h} style={{ textAlign: 'left', padding: '8px 10px', fontSize: 11, fontWeight: 600, textTransform: 'uppercase', color: '#94A3B8', letterSpacing: 0.5 }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {patients.slice(0, 5).map(p => (
                <tr key={p.id} className="hov-row" style={{ borderBottom: '1px solid #F8FAFC', transition: 'background 0.15s' }}>
                  <td style={{ padding: '10px 10px', display: 'flex', alignItems: 'center', gap: 10 }}>
                    <Avatar name={p.name} size={32} />
                    <div>
                      <div style={{ fontWeight: 600, color: '#0F172A' }}>{p.name}</div>
                      <div style={{ fontSize: 11, color: '#94A3B8' }}>{p.id}</div>
                    </div>
                  </td>
                  <td style={{ padding: '10px 10px', color: '#475569' }}>{p.dept}</td>
                  <td style={{ padding: '10px 10px', color: '#475569' }}>{p.doctor}</td>
                  <td style={{ padding: '10px 10px' }}><StatusBadge status={p.status} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Upcoming Appointments */}
        <div className="fade-in-4" style={{ background: '#fff', border: '1px solid #F1F5F9', borderRadius: 14, padding: 20 }}>
          <h3 style={{ fontFamily: "'Instrument Serif', serif", fontSize: 17, fontWeight: 600, marginBottom: 14 }}>Upcoming Appointments</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {appointments.map((a, i) => (
              <div key={i} className="hov-row" style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 10px', borderRadius: 10, transition: 'background 0.15s', cursor: 'pointer' }}>
                <span style={{ fontSize: 11, fontWeight: 700, color: '#fff', background: 'linear-gradient(135deg, #1D4ED8, #2563EB)', padding: '5px 10px', borderRadius: 8, whiteSpace: 'nowrap' }}>{a.time}</span>
                <Avatar name={a.patient} size={30} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: '#0F172A', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{a.patient}</div>
                  <div style={{ fontSize: 11, color: '#94A3B8' }}>{a.type} · {a.dept}</div>
                </div>
                <StatusBadge status={a.status} />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ━━━ PATIENTS VIEW ━━━ */
function PatientsView({ filter, setFilter }: { filter: string; setFilter: (f: string) => void }) {
  const statuses = ['All', 'Critical', 'Stable', 'Observation', 'Recovering'];
  const filtered = filter === 'All' ? patients : patients.filter(p => p.status === filter);

  return (
    <div className="fade-in">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <h1 style={{ fontFamily: "'Instrument Serif', serif", fontSize: 24, fontWeight: 700 }}>Patients</h1>
        <button style={{ padding: '8px 18px', borderRadius: 10, border: 'none', background: 'linear-gradient(135deg, #1D4ED8, #2563EB)', color: '#fff', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: "'DM Sans', sans-serif", boxShadow: '0 4px 12px rgba(29,78,216,0.3)' }}>+ Add Patient</button>
      </div>

      {/* Filter bar */}
      <div style={{ background: '#fff', border: '1px solid #F1F5F9', borderRadius: 14, padding: 16, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
        <input placeholder="Search patients..." style={{ flex: 1, minWidth: 200, padding: '8px 14px', borderRadius: 10, border: '1px solid #E2E8F0', background: '#F8FAFC', fontSize: 13, fontFamily: "'DM Sans', sans-serif", outline: 'none' }} />
        {statuses.map(s => (
          <button key={s} onClick={() => setFilter(s)} style={{ padding: '6px 14px', borderRadius: 20, border: filter === s ? 'none' : '1px solid #E2E8F0', background: filter === s ? '#1D4ED8' : '#fff', color: filter === s ? '#fff' : '#475569', fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: "'DM Sans', sans-serif", transition: 'all 0.15s' }}>{s}</button>
        ))}
      </div>

      {/* Table */}
      <div style={{ background: '#fff', border: '1px solid #F1F5F9', borderRadius: 14, overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
          <thead>
            <tr style={{ borderBottom: '1px solid #F1F5F9', position: 'sticky', top: 0, background: '#fff', zIndex: 2 }}>
              <th style={{ width: 40, padding: '12px 10px' }}><input type="checkbox" /></th>
              {['Patient', 'ID', 'Age', 'Department', 'Doctor', 'Room', 'Admitted', 'Status', 'Actions'].map(h => (
                <th key={h} style={{ textAlign: 'left', padding: '12px 10px', fontSize: 11, fontWeight: 600, textTransform: 'uppercase', color: '#94A3B8', letterSpacing: 0.5 }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.map(p => (
              <tr key={p.id} className="hov-row" style={{ borderBottom: '1px solid #F8FAFC', transition: 'background 0.15s' }}>
                <td style={{ padding: '10px 10px' }}><input type="checkbox" /></td>
                <td style={{ padding: '10px 10px', display: 'flex', alignItems: 'center', gap: 10 }}>
                  <Avatar name={p.name} size={32} />
                  <div>
                    <div style={{ fontWeight: 600, color: '#0F172A' }}>{p.name}</div>
                    <div style={{ fontSize: 11, color: '#94A3B8' }}>{p.gender === 'M' ? 'Male' : 'Female'}</div>
                  </div>
                </td>
                <td style={{ padding: '10px 10px', color: '#1D4ED8', fontWeight: 600 }}>{p.id}</td>
                <td style={{ padding: '10px 10px', color: '#475569' }}>{p.age}</td>
                <td style={{ padding: '10px 10px', color: '#475569' }}>{p.dept}</td>
                <td style={{ padding: '10px 10px', color: '#475569' }}>{p.doctor}</td>
                <td style={{ padding: '10px 10px', color: '#475569' }}>{p.room}</td>
                <td style={{ padding: '10px 10px', color: '#475569' }}>{p.admitted}</td>
                <td style={{ padding: '10px 10px' }}><StatusBadge status={p.status} /></td>
                <td style={{ padding: '10px 10px' }}>
                  <div style={{ display: 'flex', gap: 6 }}>
                    <button style={{ padding: '4px 12px', borderRadius: 6, border: '1px solid #E2E8F0', background: '#fff', fontSize: 12, cursor: 'pointer', color: '#475569', fontFamily: "'DM Sans', sans-serif" }}>View</button>
                    <button style={{ padding: '4px 12px', borderRadius: 6, border: '1px solid #E2E8F0', background: '#fff', fontSize: 12, cursor: 'pointer', color: '#475569', fontFamily: "'DM Sans', sans-serif" }}>Edit</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <div style={{ padding: '12px 16px', borderTop: '1px solid #F1F5F9', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 13, color: '#94A3B8' }}>
          <span>Showing {filtered.length} of 1,248 patients</span>
          <div style={{ display: 'flex', gap: 6 }}>
            {[1, 2, 3, '...', 52].map((p, i) => (
              <button key={i} style={{ width: 32, height: 32, borderRadius: 8, border: p === 1 ? 'none' : '1px solid #E2E8F0', background: p === 1 ? '#1D4ED8' : '#fff', color: p === 1 ? '#fff' : '#475569', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: "'DM Sans', sans-serif" }}>{p}</button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ━━━ APPOINTMENTS VIEW ━━━ */
function AppointmentsView({ filter, setFilter }: { filter: string; setFilter: (f: string) => void }) {
  const tabs = ['All', 'Confirmed', 'In Progress', 'Pending'];
  const filtered = filter === 'All' ? appointments : appointments.filter(a => a.status === filter);
  const stats = [
    { label: 'Total Today', value: 24, color: '#1D4ED8' },
    { label: 'Confirmed', value: 16, color: '#22C55E' },
    { label: 'In Progress', value: 5, color: '#8B5CF6' },
    { label: 'Pending', value: 3, color: '#F59E0B' },
  ];

  return (
    <div className="fade-in">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <h1 style={{ fontFamily: "'Instrument Serif', serif", fontSize: 24, fontWeight: 700 }}>Appointments</h1>
        <button style={{ padding: '8px 18px', borderRadius: 10, border: 'none', background: 'linear-gradient(135deg, #1D4ED8, #2563EB)', color: '#fff', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: "'DM Sans', sans-serif", boxShadow: '0 4px 12px rgba(29,78,216,0.3)' }}>+ Book Appointment</button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: 16 }}>
        {/* List */}
        <div style={{ background: '#fff', border: '1px solid #F1F5F9', borderRadius: 14, padding: 20 }}>
          <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
            {tabs.map(t => (
              <button key={t} onClick={() => setFilter(t)} style={{ padding: '6px 16px', borderRadius: 20, border: filter === t ? 'none' : '1px solid #E2E8F0', background: filter === t ? '#1D4ED8' : '#fff', color: filter === t ? '#fff' : '#475569', fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: "'DM Sans', sans-serif" }}>{t}</button>
            ))}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {filtered.map((a, i) => (
              <div key={i} className="hov-row" style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 12px', borderRadius: 10, transition: 'background 0.15s', cursor: 'pointer' }}>
                <span style={{ fontSize: 11, fontWeight: 700, color: '#fff', background: 'linear-gradient(135deg, #1D4ED8, #2563EB)', padding: '5px 10px', borderRadius: 8, whiteSpace: 'nowrap' }}>{a.time}</span>
                <Avatar name={a.patient} size={34} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 14, fontWeight: 600, color: '#0F172A' }}>{a.patient}</div>
                  <div style={{ fontSize: 12, color: '#94A3B8' }}>{a.type} · {a.dept} · {a.doctor}</div>
                </div>
                <StatusBadge status={a.status} />
                <button style={{ padding: '5px 14px', borderRadius: 8, border: '1px solid #E2E8F0', background: '#fff', fontSize: 12, fontWeight: 600, cursor: 'pointer', color: '#475569', fontFamily: "'DM Sans', sans-serif" }}>Details</button>
              </div>
            ))}
          </div>
        </div>

        {/* Right panel */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ background: '#fff', border: '1px solid #F1F5F9', borderRadius: 14, padding: 20 }}>
            <h3 style={{ fontFamily: "'Instrument Serif', serif", fontSize: 16, fontWeight: 600, marginBottom: 14 }}>Today at a Glance</h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              {stats.map(s => (
                <div key={s.label} style={{ padding: 12, borderRadius: 10, border: '1px solid #F1F5F9' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
                    <span style={{ width: 8, height: 8, borderRadius: '50%', background: s.color }} />
                    <span style={{ fontSize: 11, color: '#94A3B8', fontWeight: 600 }}>{s.label}</span>
                  </div>
                  <div style={{ fontFamily: "'Instrument Serif', serif", fontSize: 24, fontWeight: 700, color: '#0F172A' }}>{s.value}</div>
                </div>
              ))}
            </div>
          </div>

          <div style={{ background: 'linear-gradient(135deg, #0F172A, #1E3A5F)', borderRadius: 14, padding: 20, color: '#fff' }}>
            <div style={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase', opacity: 0.7, marginBottom: 12, letterSpacing: 0.5 }}>Next Appointment</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14 }}>
              <Avatar name={appointments[0].patient} size={44} />
              <div>
                <div style={{ fontSize: 16, fontWeight: 700 }}>{appointments[0].patient}</div>
                <div style={{ fontSize: 12, opacity: 0.7 }}>{appointments[0].type}</div>
              </div>
            </div>
            <div style={{ display: 'flex', gap: 16, fontSize: 12, opacity: 0.8 }}>
              <span>🕐 {appointments[0].time}</span>
              <span>🏥 {appointments[0].dept}</span>
            </div>
            <div style={{ fontSize: 12, opacity: 0.7, marginTop: 8 }}>{appointments[0].doctor} · Room 201</div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ━━━ STAFF VIEW ━━━ */
function StaffView() {
  return (
    <div className="fade-in">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <h1 style={{ fontFamily: "'Instrument Serif', serif", fontSize: 24, fontWeight: 700 }}>Staff Directory</h1>
        <button style={{ padding: '8px 18px', borderRadius: 10, border: 'none', background: 'linear-gradient(135deg, #1D4ED8, #2563EB)', color: '#fff', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: "'DM Sans', sans-serif", boxShadow: '0 4px 12px rgba(29,78,216,0.3)' }}>+ Add Staff</button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
        {staff.map((s, i) => (
          <div key={s.name} className={`hov-card fade-in-${Math.min(i + 1, 5)}`} style={{ background: '#fff', border: '1px solid #F1F5F9', borderRadius: 14, padding: 20, cursor: 'pointer', transition: 'box-shadow 0.2s, transform 0.2s', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14 }}>
              <Avatar name={s.name} size={44} />
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 15, fontWeight: 700, color: '#0F172A' }}>{s.name}</div>
                <div style={{ fontSize: 12, color: '#94A3B8' }}>{s.role}</div>
              </div>
              <StatusBadge status={s.status} />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 12 }}>
              <div style={{ padding: 10, borderRadius: 8, background: '#F8FAFC', textAlign: 'center' }}>
                <div style={{ fontSize: 11, color: '#94A3B8', marginBottom: 2 }}>Patients</div>
                <div style={{ fontFamily: "'Instrument Serif', serif", fontSize: 20, fontWeight: 700, color: '#0F172A' }}>{s.patients}</div>
              </div>
              <div style={{ padding: 10, borderRadius: 8, background: '#F8FAFC', textAlign: 'center' }}>
                <div style={{ fontSize: 11, color: '#94A3B8', marginBottom: 2 }}>Dept</div>
                <div style={{ fontSize: 13, fontWeight: 600, color: '#0F172A' }}>{s.dept}</div>
              </div>
            </div>
            <div style={{ fontSize: 12, color: '#94A3B8', display: 'flex', alignItems: 'center', gap: 6 }}>
              🕐 <span>{s.shift}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ━━━ EMPTY PAGE ━━━ */
function EmptyPage({ icon, title, desc }: { icon: string; title: string; desc: string }) {
  return (
    <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: 500, textAlign: 'center' }}>
      <div style={{ fontSize: 56, marginBottom: 20 }}>{icon}</div>
      <h2 style={{ fontFamily: "'Instrument Serif', serif", fontSize: 24, fontWeight: 700, color: '#0F172A', marginBottom: 8 }}>{title}</h2>
      <p style={{ fontSize: 14, color: '#94A3B8', maxWidth: 380, lineHeight: 1.6, marginBottom: 24 }}>{desc}</p>
      <button style={{ padding: '10px 24px', borderRadius: 10, border: 'none', background: 'linear-gradient(135deg, #1D4ED8, #2563EB)', color: '#fff', fontSize: 14, fontWeight: 600, cursor: 'pointer', fontFamily: "'DM Sans', sans-serif", boxShadow: '0 4px 12px rgba(29,78,216,0.3)' }}>Get Started →</button>
    </div>
  );
}
