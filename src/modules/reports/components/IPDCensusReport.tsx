import { BedDouble, UserPlus, LogOut, Activity } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/card';
import { Badge } from '../../../components/ui/badge';
import { Progress } from '../../../components/ui/progress';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '../../../components/ui/table';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line, Legend,
} from 'recharts';
import type { IPDCensusData, DateRange } from '../types';

interface Props {
  data: unknown;
  dateRange: DateRange;
}

export default function IPDCensusReport({ data }: Props) {
  const reportData = data as IPDCensusData;

  if (!reportData) return null;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="border-0 shadow-sm bg-gradient-to-br from-blue-50 to-white">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wide">Admissions</p>
                <p className="text-2xl font-bold text-gray-800 mt-1">{reportData.totalAdmissions}</p>
              </div>
              <div className="p-3 rounded-xl bg-blue-100">
                <UserPlus className="w-5 h-5 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm bg-gradient-to-br from-emerald-50 to-white">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wide">Discharges</p>
                <p className="text-2xl font-bold text-gray-800 mt-1">{reportData.totalDischarges}</p>
              </div>
              <div className="p-3 rounded-xl bg-emerald-100">
                <LogOut className="w-5 h-5 text-emerald-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm bg-gradient-to-br from-amber-50 to-white">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wide">Occupancy Rate</p>
                <p className="text-2xl font-bold text-gray-800 mt-1">{reportData.occupancyRate}%</p>
              </div>
              <div className="p-3 rounded-xl bg-amber-100">
                <BedDouble className="w-5 h-5 text-amber-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm bg-gradient-to-br from-cyan-50 to-white">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wide">Avg Length of Stay</p>
                <p className="text-2xl font-bold text-gray-800 mt-1">{reportData.avgLengthOfStay} days</p>
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
            <CardTitle className="text-sm font-medium">Daily Admissions vs Discharges</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={reportData.dailyAdmissions}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip
                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}
                  />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="admissions"
                    name="Admissions"
                    stroke="#3b82f6"
                    strokeWidth={2}
                    dot={{ fill: '#3b82f6', strokeWidth: 2 }}
                  />
                  <Line
                    type="monotone"
                    dataKey="discharges"
                    name="Discharges"
                    stroke="#10b981"
                    strokeWidth={2}
                    dot={{ fill: '#10b981', strokeWidth: 2 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Bed Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-500">Total Beds</span>
                <span className="font-semibold">{reportData.totalBeds}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-500">Occupied</span>
                <span className="font-semibold text-amber-600">{reportData.currentOccupancy}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-500">Available</span>
                <span className="font-semibold text-emerald-600">{reportData.totalBeds - reportData.currentOccupancy}</span>
              </div>
              <div className="pt-4">
                <div className="flex items-center justify-between text-sm mb-2">
                  <span className="text-gray-500">Overall Occupancy</span>
                  <span className="font-semibold">{reportData.occupancyRate}%</span>
                </div>
                <Progress value={reportData.occupancyRate} className="h-3" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="border-0 shadow-sm">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium">Ward-wise Occupancy</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={reportData.wardOccupancy} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis type="number" tick={{ fontSize: 11 }} />
                <YAxis dataKey="ward" type="category" tick={{ fontSize: 11 }} width={80} />
                <Tooltip
                  contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}
                />
                <Legend />
                <Bar dataKey="occupied" name="Occupied" fill="#f59e0b" stackId="a" radius={[0, 0, 0, 0]} />
                <Bar dataKey="total" name="Total" fill="#e5e7eb" stackId="b" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      <Card className="border-0 shadow-sm">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium">Ward Occupancy Details</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Ward</TableHead>
                <TableHead className="text-right">Total Beds</TableHead>
                <TableHead className="text-right">Occupied</TableHead>
                <TableHead className="text-right">Available</TableHead>
                <TableHead className="text-right">Occupancy</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {reportData.wardOccupancy.map((ward, index) => {
                const available = ward.total - ward.occupied;
                const rate = ward.total > 0 ? Math.round((ward.occupied / ward.total) * 100) : 0;
                return (
                  <TableRow key={index}>
                    <TableCell className="font-medium">{ward.ward}</TableCell>
                    <TableCell className="text-right">{ward.total}</TableCell>
                    <TableCell className="text-right text-amber-600">{ward.occupied}</TableCell>
                    <TableCell className="text-right text-emerald-600">{available}</TableCell>
                    <TableCell className="text-right">
                      <Badge className={rate > 85 ? 'bg-red-100 text-red-700' : rate > 70 ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700'}>
                        {rate}%
                      </Badge>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
