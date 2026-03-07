import { TrendingUp, TrendingDown, DollarSign, CreditCard, Clock } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/card';
import { Badge } from '../../../components/ui/badge';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '../../../components/ui/table';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, BarChart, Bar, Legend,
} from 'recharts';
import type { RevenueSummaryData } from '../types';

interface Props {
  data: unknown;
}

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

export default function RevenueSummaryReport({ data }: Props) {
  const reportData = data as RevenueSummaryData;

  if (!reportData) return null;

  const collectionRate = reportData.totalRevenue > 0
    ? Math.round((reportData.paidAmount / reportData.totalRevenue) * 100)
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
                <p className="text-xs text-gray-500 uppercase tracking-wide">Total Revenue</p>
                <p className="text-2xl font-bold text-gray-800 mt-1">
                  {formatCurrency(reportData.totalRevenue)}
                </p>
              </div>
              <div className="p-3 rounded-xl bg-blue-100">
                <DollarSign className="w-5 h-5 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm bg-gradient-to-br from-emerald-50 to-white">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wide">Collected</p>
                <p className="text-2xl font-bold text-gray-800 mt-1">
                  {formatCurrency(reportData.paidAmount)}
                </p>
              </div>
              <div className="p-3 rounded-xl bg-emerald-100">
                <CreditCard className="w-5 h-5 text-emerald-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm bg-gradient-to-br from-amber-50 to-white">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wide">Pending</p>
                <p className="text-2xl font-bold text-gray-800 mt-1">
                  {formatCurrency(reportData.pendingAmount)}
                </p>
              </div>
              <div className="p-3 rounded-xl bg-amber-100">
                <Clock className="w-5 h-5 text-amber-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm bg-gradient-to-br from-cyan-50 to-white">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wide">Collection Rate</p>
                <p className="text-2xl font-bold text-gray-800 mt-1">{collectionRate}%</p>
              </div>
              <div className="p-3 rounded-xl bg-cyan-100">
                {collectionRate >= 80 ? (
                  <TrendingUp className="w-5 h-5 text-cyan-600" />
                ) : (
                  <TrendingDown className="w-5 h-5 text-cyan-600" />
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card className="border-0 shadow-sm lg:col-span-2">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Daily Revenue Trend</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={reportData.dailyRevenue}>
                  <defs>
                    <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => `${(v / 1000).toFixed(0)}K`} />
                  <Tooltip
                    formatter={(value: number) => [`Rs. ${value.toLocaleString('en-IN')}`, 'Revenue']}
                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}
                  />
                  <Area
                    type="monotone"
                    dataKey="revenue"
                    stroke="#3b82f6"
                    strokeWidth={2}
                    fill="url(#colorRevenue)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Revenue by Department</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={reportData.departmentRevenue}
                    dataKey="revenue"
                    nameKey="department"
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    innerRadius={50}
                    paddingAngle={2}
                    label={({ department, percent }) => `${department} ${(percent * 100).toFixed(0)}%`}
                    labelLine={false}
                  >
                    {reportData.departmentRevenue.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value: number) => formatCurrency(value)} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="border-0 shadow-sm">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium">OPD vs IPD Revenue</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={reportData.dailyRevenue}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => `${(v / 1000).toFixed(0)}K`} />
                <Tooltip
                  formatter={(value: number) => [`Rs. ${value.toLocaleString('en-IN')}`]}
                  contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}
                />
                <Legend />
                <Bar dataKey="opd" name="OPD" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                <Bar dataKey="ipd" name="IPD" fill="#10b981" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      <Card className="border-0 shadow-sm">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium">Payment Status Breakdown</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Amount</TableHead>
                <TableHead className="text-right">Percentage</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow>
                <TableCell>
                  <Badge className="bg-emerald-100 text-emerald-700">Paid</Badge>
                </TableCell>
                <TableCell className="text-right font-medium">{formatCurrency(reportData.paidAmount)}</TableCell>
                <TableCell className="text-right">{collectionRate}%</TableCell>
              </TableRow>
              <TableRow>
                <TableCell>
                  <Badge className="bg-amber-100 text-amber-700">Pending</Badge>
                </TableCell>
                <TableCell className="text-right font-medium">{formatCurrency(reportData.pendingAmount)}</TableCell>
                <TableCell className="text-right">{100 - collectionRate}%</TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
