import { Users, UserPlus, UserCheck } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/card';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '../../../components/ui/table';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line,
} from 'recharts';
import type { PatientRegistrationData } from '../types';

interface Props {
  data: unknown;
}

const AGE_COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6'];

export default function PatientRegistrationReport({ data }: Props) {
  const reportData = data as PatientRegistrationData;

  if (!reportData) return null;

  const genderData = [
    { name: 'Male', value: reportData.maleCount, color: '#3b82f6' },
    { name: 'Female', value: reportData.femaleCount, color: '#ec4899' },
    { name: 'Other', value: reportData.otherCount, color: '#8b5cf6' },
  ].filter(d => d.value > 0);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="border-0 shadow-sm bg-gradient-to-br from-blue-50 to-white">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wide">Total Registrations</p>
                <p className="text-2xl font-bold text-gray-800 mt-1">{reportData.totalRegistrations}</p>
              </div>
              <div className="p-3 rounded-xl bg-blue-100">
                <Users className="w-5 h-5 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm bg-gradient-to-br from-emerald-50 to-white">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wide">New Patients</p>
                <p className="text-2xl font-bold text-gray-800 mt-1">{reportData.newPatients}</p>
              </div>
              <div className="p-3 rounded-xl bg-emerald-100">
                <UserPlus className="w-5 h-5 text-emerald-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm bg-gradient-to-br from-cyan-50 to-white">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wide">Male</p>
                <p className="text-2xl font-bold text-gray-800 mt-1">{reportData.maleCount}</p>
              </div>
              <div className="p-3 rounded-xl bg-cyan-100">
                <UserCheck className="w-5 h-5 text-cyan-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm bg-gradient-to-br from-pink-50 to-white">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wide">Female</p>
                <p className="text-2xl font-bold text-gray-800 mt-1">{reportData.femaleCount}</p>
              </div>
              <div className="p-3 rounded-xl bg-pink-100">
                <UserCheck className="w-5 h-5 text-pink-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Daily Registration Trend</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={reportData.dailyRegistrations}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip
                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}
                  />
                  <Line
                    type="monotone"
                    dataKey="count"
                    name="Registrations"
                    stroke="#3b82f6"
                    strokeWidth={2}
                    dot={{ fill: '#3b82f6', strokeWidth: 2 }}
                    activeDot={{ r: 6 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Gender Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-72 flex items-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={genderData}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    innerRadius={50}
                    paddingAngle={2}
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    labelLine={false}
                  >
                    {genderData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
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
          <CardTitle className="text-sm font-medium">Age Group Distribution</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={reportData.ageGroups} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis type="number" tick={{ fontSize: 11 }} />
                <YAxis dataKey="group" type="category" tick={{ fontSize: 11 }} width={60} />
                <Tooltip
                  contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}
                />
                <Bar dataKey="count" name="Patients" fill="#3b82f6" radius={[0, 4, 4, 0]}>
                  {reportData.ageGroups.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={AGE_COLORS[index % AGE_COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      <Card className="border-0 shadow-sm">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium">Registration Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Metric</TableHead>
                <TableHead className="text-right">Count</TableHead>
                <TableHead className="text-right">Percentage</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow>
                <TableCell>Male Patients</TableCell>
                <TableCell className="text-right font-medium">{reportData.maleCount}</TableCell>
                <TableCell className="text-right">
                  {reportData.totalRegistrations > 0
                    ? Math.round((reportData.maleCount / reportData.totalRegistrations) * 100)
                    : 0}%
                </TableCell>
              </TableRow>
              <TableRow>
                <TableCell>Female Patients</TableCell>
                <TableCell className="text-right font-medium">{reportData.femaleCount}</TableCell>
                <TableCell className="text-right">
                  {reportData.totalRegistrations > 0
                    ? Math.round((reportData.femaleCount / reportData.totalRegistrations) * 100)
                    : 0}%
                </TableCell>
              </TableRow>
              {reportData.otherCount > 0 && (
                <TableRow>
                  <TableCell>Other</TableCell>
                  <TableCell className="text-right font-medium">{reportData.otherCount}</TableCell>
                  <TableCell className="text-right">
                    {reportData.totalRegistrations > 0
                      ? Math.round((reportData.otherCount / reportData.totalRegistrations) * 100)
                      : 0}%
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
