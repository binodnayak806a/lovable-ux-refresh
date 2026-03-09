import { useState, useEffect, useCallback } from 'react';
import { usePageTitle } from '../../hooks/usePageTitle';
import PageHeader from '../../components/shared/PageHeader';
import { Users, CalendarCheck, Clock, TrendingUp } from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../components/ui/tabs';
import { Badge } from '../../components/ui/badge';
import { Skeleton } from '../../components/ui/skeleton';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../hooks/useAuth';
import StaffDirectoryTab from './components/StaffDirectoryTab';
import AttendanceTab from './components/AttendanceTab';
import LeaveTab from './components/LeaveTab';
import type { Staff, Attendance, LeaveRequest } from './types';

const SAMPLE_HOSPITAL_ID = '11111111-1111-1111-1111-111111111111';

import SharedStatCard from '../../components/shared/StatCard';

export default function HRMSPage() {
  usePageTitle('HRMS');
  const { hospitalId, user } = useAuth();
  const effectiveHospitalId = hospitalId ?? SAMPLE_HOSPITAL_ID;

  const [staff, setStaff] = useState<Staff[]>([]);
  const [attendance, setAttendance] = useState<Attendance[]>([]);
  const [leaves, setLeaves] = useState<LeaveRequest[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    try {
      const today = format(new Date(), 'yyyy-MM-dd');

      const staffRes = await supabase
        .from('staff')
        .select('*')
        .eq('hospital_id', effectiveHospitalId)
        .order('first_name');

      const staffData = (staffRes.data ?? []) as Staff[];
      setStaff(staffData);

      const staffIds = staffData.map((s) => s.id);

      if (staffIds.length > 0) {
        const [attendanceRes, leavesRes] = await Promise.all([
          supabase
            .from('attendance')
            .select('*')
            .in('staff_id', staffIds)
            .gte('date', today)
            .lte('date', today),
          supabase
            .from('leave_requests')
            .select('*, staff(*)')
            .in('staff_id', staffIds)
            .order('created_at', { ascending: false })
            .limit(100),
        ]);
        if (attendanceRes.data) setAttendance(attendanceRes.data as Attendance[]);
        if (leavesRes.data) setLeaves(leavesRes.data as LeaveRequest[]);
      }
    } catch {
      toast.error('Failed to load HRMS data');
    } finally {
      setLoading(false);
    }
  }, [effectiveHospitalId]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const activeStaff = staff.filter(s => s.status === 'active');
  const todayPresent = attendance.filter(a => a.status === 'present').length;
  const pendingLeaves = leaves.filter(l => l.status === 'pending').length;
  const onLeave = attendance.filter(a => a.status === 'leave').length;

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="space-y-2">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-4 w-72" />
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-24 rounded-xl" />
          ))}
        </div>
        <Skeleton className="h-64 rounded-xl" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="HR Management"
        subtitle="Staff directory, attendance tracking, and leave management"
        icon={Users}
        helpItems={[
          'Add and manage staff in the directory tab',
          'Mark daily attendance for all staff members',
          'Review and approve/reject leave requests',
          'Export staff data for payroll processing',
        ]}
      />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <SharedStatCard label="Total Staff" value={staff.length} subtitle={`${activeStaff.length} active`} icon={Users} iconClassName="bg-blue-50 text-blue-600" />
        <SharedStatCard label="Present Today" value={todayPresent} subtitle={`of ${activeStaff.length} active`} icon={CalendarCheck} iconClassName="bg-emerald-50 text-emerald-600" />
        <SharedStatCard label="On Leave" value={onLeave} subtitle="today" icon={Clock} iconClassName="bg-amber-50 text-amber-600" />
        <SharedStatCard label="Pending Leaves" value={pendingLeaves} subtitle="awaiting approval" icon={TrendingUp} iconClassName="bg-rose-50 text-rose-600" />
      </div>

      <div className="bg-card rounded-xl border border-border overflow-hidden">
        <Tabs defaultValue="directory">
          <div className="border-b border-border px-6 pt-4">
            <TabsList className="bg-transparent p-0 h-auto gap-1">
              <TabsTrigger
                value="directory"
                className="px-4 py-2 rounded-lg data-[state=active]:bg-accent data-[state=active]:text-accent-foreground text-muted-foreground"
              >
                Staff Directory
              </TabsTrigger>
              <TabsTrigger
                value="attendance"
                className="px-4 py-2 rounded-lg data-[state=active]:bg-accent data-[state=active]:text-accent-foreground text-muted-foreground"
              >
                Attendance
              </TabsTrigger>
              <TabsTrigger
                value="leaves"
                className="px-4 py-2 rounded-lg data-[state=active]:bg-accent data-[state=active]:text-accent-foreground text-muted-foreground"
              >
                Leave Requests
                {pendingLeaves > 0 && (
                  <Badge className="ml-1.5 bg-amber-500 hover:bg-amber-500 text-white text-xs h-5 px-1.5">
                    {pendingLeaves}
                  </Badge>
                )}
              </TabsTrigger>
            </TabsList>
          </div>

          <div className="p-6">
            <TabsContent value="directory" className="mt-0">
              <StaffDirectoryTab
                staff={staff}
                onRefresh={fetchData}
                hospitalId={effectiveHospitalId}
              />
            </TabsContent>
            <TabsContent value="attendance" className="mt-0">
              <AttendanceTab
                staff={staff}
                attendance={attendance}
                onRefresh={fetchData}
              />
            </TabsContent>
            <TabsContent value="leaves" className="mt-0">
              <LeaveTab
                staff={activeStaff}
                leaves={leaves}
                onRefresh={fetchData}
                currentUserId={user?.id ?? ''}
              />
            </TabsContent>
          </div>
        </Tabs>
      </div>
    </div>
  );
}
