import { UserCog, Users, Activity, TrendingUp } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/card';
import { Badge } from '../../../components/ui/badge';
import { Progress } from '../../../components/ui/progress';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '../../../components/ui/table';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell,
} from 'recharts';
import type { DoctorWorkloadData, DateRange } from '../types';

interface Props {
  data: unknown;
  dateRange: DateRange;
}

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

export default function DoctorWorkloadReport({ data }: Props) {
  const reportData = data as DoctorWorkloadData;

  if (!reportData) return null;

  const totalConsultations = reportData.doctors.reduce((sum, d) => sum + d.consultations, 0);
  const totalRevenue = reportData.doctors.reduce((sum, d) => sum + d.revenue, 0);
  const avgUtilization = reportData.doctors.length > 0
    ? Math.round(reportData.doctors.reduce((sum, d) => sum + d.utilization, 0) / reportData.doctors.length)
    : 0;

  const formatCurrency = (amount: number) => {
    if (amount >= 100000) {
      return `Rs. ${(amount / 100000).toFixed(2)}L`;
    }
    return `Rs. ${amount.toLocaleString('en-IN')}`;
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="border-0 shadow-sm bg-gradient-to-br from-blue-50 to-white">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wide">Total Doctors</p>
                <p className="text-2xl font-bold text-gray-800 mt-1">{reportData.doctors.length}</p>
              </div>
              <div className="p-3 rounded-xl bg-blue-100">
                <UserCog className="w-5 h-5 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm bg-gradient-to-br from-emerald-50 to-white">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wide">Total Consultations</p>
                <p className="text-2xl font-bold text-gray-800 mt-1">{totalConsultations}</p>
              </div>
              <div className="p-3 rounded-xl bg-emerald-100">
                <Users className="w-5 h-5 text-emerald-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm bg-gradient-to-br from-amber-50 to-white">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wide">Total Revenue</p>
                <p className="text-2xl font-bold text-gray-800 mt-1">{formatCurrency(totalRevenue)}</p>
              </div>
              <div className="p-3 rounded-xl bg-amber-100">
                <TrendingUp className="w-5 h-5 text-amber-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm bg-gradient-to-br from-cyan-50 to-white">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wide">Avg Utilization</p>
                <p className="text-2xl font-bold text-gray-800 mt-1">{avgUtilization}%</p>
              </div>
              <div className="p-3 rounded-xl bg-cyan-100">
                <Activity className="w-5 h-5 text-cyan-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Consultations by Doctor</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={reportData.doctors.slice(0, 10)} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis type="number" tick={{ fontSize: 11 }} />
                  <YAxis dataKey="name" type="category" tick={{ fontSize: 11 }} width={100} />
                  <Tooltip
                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}
                  />
                  <Bar dataKey="consultations" name="Consultations" fill="#3b82f6" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Consultations by Department</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={reportData.departmentSummary}
                    dataKey="totalConsultations"
                    nameKey="department"
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    innerRadius={50}
                    paddingAngle={2}
                    label={({ department, percent }) => `${department.slice(0, 8)}... ${(percent * 100).toFixed(0)}%`}
                    labelLine={false}
                  >
                    {reportData.departmentSummary.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="border-0 shadow-sm">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium">Doctor Utilization</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {reportData.doctors.slice(0, 10).map((doctor, index) => (
              <div key={index} className="flex items-center gap-4">
                <div className="w-32 text-sm font-medium truncate">{doctor.name}</div>
                <div className="flex-1">
                  <Progress value={doctor.utilization} className="h-3" />
                </div>
                <Badge className={
                  doctor.utilization > 90 ? 'bg-red-100 text-red-700' :
                  doctor.utilization > 70 ? 'bg-emerald-100 text-emerald-700' :
                  'bg-amber-100 text-amber-700'
                }>
                  {doctor.utilization}%
                </Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card className="border-0 shadow-sm">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium">Doctor Performance Details</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Doctor</TableHead>
                <TableHead>Department</TableHead>
                <TableHead className="text-right">Consultations</TableHead>
                <TableHead className="text-right">Avg/Day</TableHead>
                <TableHead className="text-right">Revenue</TableHead>
                <TableHead className="text-right">Utilization</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {reportData.doctors.slice(0, 15).map((doctor, index) => (
                <TableRow key={index}>
                  <TableCell className="font-medium">{doctor.name}</TableCell>
                  <TableCell>{doctor.department}</TableCell>
                  <TableCell className="text-right">{doctor.consultations}</TableCell>
                  <TableCell className="text-right">{doctor.avgPerDay}</TableCell>
                  <TableCell className="text-right">{formatCurrency(doctor.revenue)}</TableCell>
                  <TableCell className="text-right">
                    <Badge className={
                      doctor.utilization > 90 ? 'bg-red-100 text-red-700' :
                      doctor.utilization > 70 ? 'bg-emerald-100 text-emerald-700' :
                      'bg-amber-100 text-amber-700'
                    }>
                      {doctor.utilization}%
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card className="border-0 shadow-sm">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium">Department Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Department</TableHead>
                <TableHead className="text-right">Total Consultations</TableHead>
                <TableHead className="text-right">Avg per Doctor</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {reportData.departmentSummary.map((dept, index) => (
                <TableRow key={index}>
                  <TableCell className="font-medium">{dept.department}</TableCell>
                  <TableCell className="text-right">{dept.totalConsultations}</TableCell>
                  <TableCell className="text-right">{dept.avgPerDoctor}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
