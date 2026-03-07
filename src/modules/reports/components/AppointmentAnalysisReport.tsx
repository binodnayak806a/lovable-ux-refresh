import { Calendar, CheckCircle2, XCircle, Clock } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/card';
import { Badge } from '../../../components/ui/badge';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '../../../components/ui/table';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell,
} from 'recharts';
import type { AppointmentAnalysisData, DateRange } from '../types';

interface Props {
  data: unknown;
  dateRange: DateRange;
}

const STATUS_COLORS: Record<string, string> = {
  completed: '#10b981',
  cancelled: '#ef4444',
  scheduled: '#3b82f6',
  no_show: '#f59e0b',
  pending: '#8b5cf6',
};

export default function AppointmentAnalysisReport({ data }: Props) {
  const reportData = data as AppointmentAnalysisData;

  if (!reportData) return null;

  const completionRate = reportData.totalAppointments > 0
    ? Math.round((reportData.completedAppointments / reportData.totalAppointments) * 100)
    : 0;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="border-0 shadow-sm bg-gradient-to-br from-blue-50 to-white">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wide">Total Appointments</p>
                <p className="text-2xl font-bold text-gray-800 mt-1">{reportData.totalAppointments}</p>
              </div>
              <div className="p-3 rounded-xl bg-blue-100">
                <Calendar className="w-5 h-5 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm bg-gradient-to-br from-emerald-50 to-white">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wide">Completed</p>
                <p className="text-2xl font-bold text-gray-800 mt-1">{reportData.completedAppointments}</p>
              </div>
              <div className="p-3 rounded-xl bg-emerald-100">
                <CheckCircle2 className="w-5 h-5 text-emerald-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm bg-gradient-to-br from-red-50 to-white">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wide">No-Show Rate</p>
                <p className="text-2xl font-bold text-gray-800 mt-1">{reportData.noShowRate}%</p>
              </div>
              <div className="p-3 rounded-xl bg-red-100">
                <XCircle className="w-5 h-5 text-red-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm bg-gradient-to-br from-amber-50 to-white">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wide">Avg Wait Time</p>
                <p className="text-2xl font-bold text-gray-800 mt-1">{reportData.avgWaitTime} min</p>
              </div>
              <div className="p-3 rounded-xl bg-amber-100">
                <Clock className="w-5 h-5 text-amber-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Appointments by Hour</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={reportData.appointmentsByHour}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="hour" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip
                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}
                  />
                  <Bar dataKey="count" name="Appointments" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Status Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={reportData.statusBreakdown}
                    dataKey="count"
                    nameKey="status"
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    innerRadius={50}
                    paddingAngle={2}
                    label={({ status, percentage }) => `${status} ${percentage}%`}
                    labelLine={false}
                  >
                    {reportData.statusBreakdown.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={STATUS_COLORS[entry.status] || '#8b5cf6'} />
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
          <CardTitle className="text-sm font-medium">Appointments by Day of Week</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={reportData.appointmentsByDay}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="day" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip
                  contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}
                />
                <Bar dataKey="count" name="Appointments" fill="#10b981" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      <Card className="border-0 shadow-sm">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium">Status Breakdown</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Count</TableHead>
                <TableHead className="text-right">Percentage</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {reportData.statusBreakdown.map((item, index) => (
                <TableRow key={index}>
                  <TableCell>
                    <Badge style={{ backgroundColor: `${STATUS_COLORS[item.status] || '#8b5cf6'}20`, color: STATUS_COLORS[item.status] || '#8b5cf6' }}>
                      {item.status.charAt(0).toUpperCase() + item.status.slice(1).replace('_', ' ')}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right font-medium">{item.count}</TableCell>
                  <TableCell className="text-right">{item.percentage}%</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card className="border-0 shadow-sm">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium">Key Metrics Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-4 text-center">
            <div className="p-4 bg-emerald-50 rounded-xl">
              <p className="text-2xl font-bold text-emerald-600">{completionRate}%</p>
              <p className="text-sm text-gray-500 mt-1">Completion Rate</p>
            </div>
            <div className="p-4 bg-red-50 rounded-xl">
              <p className="text-2xl font-bold text-red-600">{reportData.noShowRate}%</p>
              <p className="text-sm text-gray-500 mt-1">No-Show Rate</p>
            </div>
            <div className="p-4 bg-amber-50 rounded-xl">
              <p className="text-2xl font-bold text-amber-600">{reportData.cancelledAppointments}</p>
              <p className="text-sm text-gray-500 mt-1">Cancelled</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
