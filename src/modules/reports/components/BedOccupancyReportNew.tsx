import { useState, useEffect, useCallback, useRef } from 'react';
import { Loader2, BedDouble, Hotel, AlertTriangle } from 'lucide-react';
import { Card, CardContent } from '../../../components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../../components/ui/table';
import { Badge } from '../../../components/ui/badge';
import { Progress } from '../../../components/ui/progress';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { useHospitalId } from '../../../hooks/useHospitalId';
import enhancedReportsService from '../../../services/enhanced-reports.service';
import type { BedOccupancyRow } from '../types/report-types';
import ReportExportBar, { exportTableCSV, printReport } from './ReportExportBar';

function occupancyColor(pct: number) {
  if (pct > 85) return { bg: 'bg-red-50', text: 'text-red-700', bar: '[&>div]:bg-red-500' };
  if (pct > 60) return { bg: 'bg-amber-50', text: 'text-amber-700', bar: '[&>div]:bg-amber-500' };
  return { bg: 'bg-emerald-50', text: 'text-emerald-700', bar: '[&>div]:bg-emerald-500' };
}

export default function BedOccupancyReportNew() {
  const hospitalId = useHospitalId();
  const [data, setData] = useState<BedOccupancyRow[]>([]);
  const [loading, setLoading] = useState(true);
  const tableRef = useRef<HTMLDivElement>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try { setData(await enhancedReportsService.getBedOccupancy(hospitalId)); }
    catch { setData([]); }
    finally { setLoading(false); }
  }, [hospitalId]);

  useEffect(() => { load(); }, [load]);

  const totalBeds = data.reduce((s, r) => s + Number(r.total_beds || 0), 0);
  const totalOccupied = data.reduce((s, r) => s + Number(r.occupied_beds || 0), 0);
  const totalVacant = totalBeds - totalOccupied;
  const overallPct = totalBeds > 0 ? Math.round((totalOccupied / totalBeds) * 100) : 0;
  const criticalWards = data.filter(r => Number(r.occupancy_pct) > 85).length;

  const handleExport = () => {
    exportTableCSV(
      ['Ward', 'Type', 'Total', 'Occupied', 'Vacant', 'Occupancy %'],
      data.map(r => [r.ward_name, r.ward_type, String(r.total_beds), String(r.occupied_beds), String(r.vacant_beds), `${r.occupancy_pct}%`]),
      'bed-occupancy-report',
    );
  };

  const handlePrint = () => {
    if (tableRef.current) printReport('Bed Occupancy Report', tableRef.current.innerHTML);
  };

  if (loading) return <div className="flex items-center justify-center h-48"><Loader2 className="w-6 h-6 animate-spin text-gray-400" /></div>;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Card className="border-0 shadow-sm">
          <CardContent className="p-4">
            <p className="text-xs text-gray-500 uppercase tracking-wide">Total Beds</p>
            <p className="text-2xl font-bold text-gray-900 mt-1">{totalBeds}</p>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <BedDouble className="w-4 h-4 text-blue-600" />
              <p className="text-xs text-gray-500 uppercase tracking-wide">Occupied</p>
            </div>
            <p className="text-2xl font-bold text-gray-900 mt-1">{totalOccupied}</p>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Hotel className="w-4 h-4 text-emerald-600" />
              <p className="text-xs text-gray-500 uppercase tracking-wide">Vacant</p>
            </div>
            <p className="text-2xl font-bold text-emerald-700 mt-1">{totalVacant}</p>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              {criticalWards > 0 && <AlertTriangle className="w-4 h-4 text-red-500" />}
              <p className="text-xs text-gray-500 uppercase tracking-wide">Occupancy</p>
            </div>
            <p className="text-2xl font-bold text-gray-900 mt-1">{overallPct}%</p>
            {criticalWards > 0 && <p className="text-[10px] text-red-500 mt-0.5">{criticalWards} ward(s) &gt;85%</p>}
          </CardContent>
        </Card>
      </div>

      {data.length > 0 && (
        <Card className="border-0 shadow-sm">
          <CardContent className="p-4">
            <h4 className="text-sm font-medium text-gray-900 mb-3">Ward-wise Occupancy</h4>
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 11 }} unit="%" />
                  <YAxis dataKey="ward_name" type="category" tick={{ fontSize: 10 }} width={100} />
                  <Tooltip formatter={(v: number) => `${v}%`} contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }} />
                  <Bar dataKey="occupancy_pct" name="Occupancy" fill="#3b82f6" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      )}

      <ReportExportBar title="Bed Occupancy Report" onPrint={handlePrint} onExportCSV={handleExport} />

      <div ref={tableRef}>
        <div className="border border-gray-200 rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-gray-50/80">
                  <TableHead>Ward</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                  <TableHead className="text-right">Occupied</TableHead>
                  <TableHead className="text-right">Vacant</TableHead>
                  <TableHead className="w-40">Occupancy</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.length === 0 ? (
                  <TableRow><TableCell colSpan={6} className="text-center py-8 text-gray-400">No bed data</TableCell></TableRow>
                ) : (
                  <>
                    {data.map((r, i) => {
                      const c = occupancyColor(Number(r.occupancy_pct));
                      return (
                        <TableRow key={i} className="hover:bg-gray-50/50">
                          <TableCell className="font-medium">{r.ward_name}</TableCell>
                          <TableCell><Badge variant="outline" className="text-xs">{r.ward_type}</Badge></TableCell>
                          <TableCell className="text-right tabular-nums">{r.total_beds}</TableCell>
                          <TableCell className="text-right tabular-nums font-semibold">{r.occupied_beds}</TableCell>
                          <TableCell className="text-right tabular-nums text-emerald-600">{r.vacant_beds}</TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Progress value={Number(r.occupancy_pct)} className={`h-2 flex-1 ${c.bar}`} />
                              <Badge className={`text-[10px] ${c.bg} ${c.text} border-0`}>{r.occupancy_pct}%</Badge>
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                    <TableRow className="bg-gray-50 font-semibold border-t-2 border-gray-200">
                      <TableCell>Total</TableCell>
                      <TableCell />
                      <TableCell className="text-right tabular-nums">{totalBeds}</TableCell>
                      <TableCell className="text-right tabular-nums">{totalOccupied}</TableCell>
                      <TableCell className="text-right tabular-nums text-emerald-600">{totalVacant}</TableCell>
                      <TableCell><Badge className={`text-xs ${occupancyColor(overallPct).bg} ${occupancyColor(overallPct).text} border-0`}>{overallPct}%</Badge></TableCell>
                    </TableRow>
                  </>
                )}
              </TableBody>
            </Table>
          </div>
        </div>
      </div>
    </div>
  );
}
