import { BedDouble, Clock, Activity } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/card';
import { Badge } from '../../../components/ui/badge';
import { Progress } from '../../../components/ui/progress';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '../../../components/ui/table';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line,
} from 'recharts';
import type { BedOccupancyData, DateRange } from '../types';

interface Props {
  data: unknown;
  dateRange: DateRange;
}

export default function BedOccupancyReport({ data }: Props) {
  const reportData = data as BedOccupancyData;

  if (!reportData) return null;

  const totalBeds = reportData.wardBreakdown.reduce((sum, w) => sum + w.totalBeds, 0);
  const occupiedBeds = reportData.wardBreakdown.reduce((sum, w) => sum + w.occupied, 0);
  const availableBeds = totalBeds - occupiedBeds;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="border-0 shadow-sm bg-gradient-to-br from-blue-50 to-white">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wide">Total Beds</p>
                <p className="text-2xl font-bold text-gray-800 mt-1">{totalBeds}</p>
              </div>
              <div className="p-3 rounded-xl bg-blue-100">
                <BedDouble className="w-5 h-5 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm bg-gradient-to-br from-amber-50 to-white">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wide">Occupied</p>
                <p className="text-2xl font-bold text-gray-800 mt-1">{occupiedBeds}</p>
              </div>
              <div className="p-3 rounded-xl bg-amber-100">
                <Activity className="w-5 h-5 text-amber-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm bg-gradient-to-br from-emerald-50 to-white">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wide">Available</p>
                <p className="text-2xl font-bold text-gray-800 mt-1">{availableBeds}</p>
              </div>
              <div className="p-3 rounded-xl bg-emerald-100">
                <BedDouble className="w-5 h-5 text-emerald-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm bg-gradient-to-br from-cyan-50 to-white">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wide">Avg Stay</p>
                <p className="text-2xl font-bold text-gray-800 mt-1">{reportData.avgStay} days</p>
              </div>
              <div className="p-3 rounded-xl bg-cyan-100">
                <Clock className="w-5 h-5 text-cyan-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="border-0 shadow-sm">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium">Overall Occupancy</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            <div className="flex-1">
              <Progress value={reportData.overallOccupancy} className="h-4" />
            </div>
            <Badge className={
              reportData.overallOccupancy > 85 ? 'bg-red-100 text-red-700' :
              reportData.overallOccupancy > 70 ? 'bg-amber-100 text-amber-700' :
              'bg-emerald-100 text-emerald-700'
            }>
              {reportData.overallOccupancy}% Occupied
            </Badge>
          </div>
          <div className="flex justify-between text-sm text-gray-500 mt-2">
            <span>{occupiedBeds} beds occupied</span>
            <span>{availableBeds} beds available</span>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Daily Occupancy Trend</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={reportData.dailyOccupancy}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} domain={[0, 100]} tickFormatter={(v) => `${v}%`} />
                  <Tooltip
                    formatter={(value: number) => [`${value}%`, 'Occupancy']}
                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}
                  />
                  <Line
                    type="monotone"
                    dataKey="occupancy"
                    name="Occupancy"
                    stroke="#3b82f6"
                    strokeWidth={2}
                    dot={{ fill: '#3b82f6', strokeWidth: 2 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Ward-wise Occupancy</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={reportData.wardBreakdown} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis type="number" tick={{ fontSize: 11 }} domain={[0, 100]} tickFormatter={(v) => `${v}%`} />
                  <YAxis dataKey="ward" type="category" tick={{ fontSize: 11 }} width={80} />
                  <Tooltip
                    formatter={(value: number) => [`${value}%`, 'Occupancy']}
                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}
                  />
                  <Bar
                    dataKey="occupancyRate"
                    name="Occupancy"
                    fill="#3b82f6"
                    radius={[0, 4, 4, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="border-0 shadow-sm">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium">Ward-wise Bed Details</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Ward</TableHead>
                <TableHead className="text-right">Total Beds</TableHead>
                <TableHead className="text-right">Occupied</TableHead>
                <TableHead className="text-right">Available</TableHead>
                <TableHead className="text-right">Occupancy Rate</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {reportData.wardBreakdown.map((ward, index) => (
                <TableRow key={index}>
                  <TableCell className="font-medium">{ward.ward}</TableCell>
                  <TableCell className="text-right">{ward.totalBeds}</TableCell>
                  <TableCell className="text-right text-amber-600">{ward.occupied}</TableCell>
                  <TableCell className="text-right text-emerald-600">{ward.available}</TableCell>
                  <TableCell className="text-right">
                    <Badge className={
                      ward.occupancyRate > 85 ? 'bg-red-100 text-red-700' :
                      ward.occupancyRate > 70 ? 'bg-amber-100 text-amber-700' :
                      'bg-emerald-100 text-emerald-700'
                    }>
                      {ward.occupancyRate}%
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
