import { Package, AlertTriangle, DollarSign } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/card';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '../../../components/ui/table';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line, Legend,
} from 'recharts';
import type { PharmacyReportData } from '../types';

interface Props {
  data: unknown;
}

export default function PharmacyStockReport({ data }: Props) {
  const reportData = data as PharmacyReportData;

  if (!reportData) return null;

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
                <p className="text-xs text-gray-500 uppercase tracking-wide">Total Sales</p>
                <p className="text-2xl font-bold text-gray-800 mt-1">{formatCurrency(reportData.totalSales)}</p>
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
                <p className="text-xs text-gray-500 uppercase tracking-wide">Items Sold</p>
                <p className="text-2xl font-bold text-gray-800 mt-1">{reportData.totalItems.toLocaleString()}</p>
              </div>
              <div className="p-3 rounded-xl bg-emerald-100">
                <Package className="w-5 h-5 text-emerald-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm bg-gradient-to-br from-amber-50 to-white">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wide">Low Stock</p>
                <p className="text-2xl font-bold text-gray-800 mt-1">{reportData.lowStockCount}</p>
              </div>
              <div className="p-3 rounded-xl bg-amber-100">
                <AlertTriangle className="w-5 h-5 text-amber-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm bg-gradient-to-br from-red-50 to-white">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wide">Expiring Soon</p>
                <p className="text-2xl font-bold text-gray-800 mt-1">{reportData.expiringCount}</p>
              </div>
              <div className="p-3 rounded-xl bg-red-100">
                <AlertTriangle className="w-5 h-5 text-red-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Daily Sales Trend</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={reportData.dailySales}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => `${(v / 1000).toFixed(0)}K`} />
                  <Tooltip
                    formatter={(value: number, name: string) => [
                      name === 'sales' ? formatCurrency(value) : value,
                      name === 'sales' ? 'Sales' : 'Quantity'
                    ]}
                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}
                  />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="sales"
                    name="Sales"
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
            <CardTitle className="text-sm font-medium">Daily Quantity Sold</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={reportData.dailySales}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip
                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}
                  />
                  <Bar dataKey="quantity" name="Quantity" fill="#10b981" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="border-0 shadow-sm">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium">Top Selling Medications</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={reportData.topSellingDrugs.slice(0, 10)} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis type="number" tick={{ fontSize: 11 }} tickFormatter={(v) => `${(v / 1000).toFixed(0)}K`} />
                <YAxis dataKey="drug" type="category" tick={{ fontSize: 11 }} width={120} />
                <Tooltip
                  formatter={(value: number, name: string) => [
                    name === 'revenue' ? formatCurrency(value) : value,
                    name === 'revenue' ? 'Revenue' : 'Quantity'
                  ]}
                  contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}
                />
                <Legend />
                <Bar dataKey="revenue" name="Revenue" fill="#3b82f6" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      <Card className="border-0 shadow-sm">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium">Top Selling Medications Details</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Medication</TableHead>
                <TableHead className="text-right">Quantity Sold</TableHead>
                <TableHead className="text-right">Revenue</TableHead>
                <TableHead className="text-right">Avg Price</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {reportData.topSellingDrugs.slice(0, 10).map((drug, index) => (
                <TableRow key={index}>
                  <TableCell className="font-medium">{drug.drug}</TableCell>
                  <TableCell className="text-right">{drug.quantity}</TableCell>
                  <TableCell className="text-right">{formatCurrency(drug.revenue)}</TableCell>
                  <TableCell className="text-right">
                    Rs. {drug.quantity > 0 ? Math.round(drug.revenue / drug.quantity).toLocaleString('en-IN') : 0}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card className="border-0 shadow-sm">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium">Inventory Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-4 text-center">
            <div className="p-4 bg-emerald-50 rounded-xl">
              <p className="text-2xl font-bold text-emerald-600">{formatCurrency(reportData.stockValue)}</p>
              <p className="text-sm text-gray-500 mt-1">Total Stock Value</p>
            </div>
            <div className="p-4 bg-amber-50 rounded-xl">
              <p className="text-2xl font-bold text-amber-600">{reportData.lowStockCount}</p>
              <p className="text-sm text-gray-500 mt-1">Low Stock Items</p>
            </div>
            <div className="p-4 bg-red-50 rounded-xl">
              <p className="text-2xl font-bold text-red-600">{reportData.expiringCount}</p>
              <p className="text-sm text-gray-500 mt-1">Expiring Items</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
