import { TrendingUp, TrendingDown, Minus, Clock, AlertTriangle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/card';
import type { VitalsRecord } from './types';
import { getVitalStatus } from './types';

interface Props {
  records: VitalsRecord[];
  loading?: boolean;
}

type TrendDir = 'up' | 'down' | 'stable';

function getTrend(current: number | null, previous: number | null): TrendDir | null {
  if (current == null || previous == null) return null;
  const delta = current - previous;
  if (Math.abs(delta) < 0.5) return 'stable';
  return delta > 0 ? 'up' : 'down';
}

function TrendIcon({ dir }: { dir: TrendDir }) {
  if (dir === 'up') return <TrendingUp className="w-3 h-3 text-red-500" />;
  if (dir === 'down') return <TrendingDown className="w-3 h-3 text-blue-500" />;
  return <Minus className="w-3 h-3 text-gray-400" />;
}

function fmtVal(v: number | null, decimals = 0): string {
  if (v == null) return '—';
  return decimals > 0 ? v.toFixed(decimals) : String(v);
}

function fmtDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-IN', {
    day: '2-digit', month: 'short', year: '2-digit',
    hour: '2-digit', minute: '2-digit', hour12: true,
  });
}


export default function VitalsHistory({ records, loading }: Props) {
  if (loading) {
    return (
      <Card className="border border-gray-100 shadow-sm">
        <CardHeader className="px-5 pt-4 pb-3">
          <CardTitle className="text-sm font-semibold text-gray-700">Vitals History</CardTitle>
        </CardHeader>
        <CardContent className="px-5 pb-5">
          <div className="space-y-2">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-12 rounded-lg bg-gray-100 animate-pulse" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!records.length) {
    return (
      <Card className="border border-gray-100 shadow-sm">
        <CardHeader className="px-5 pt-4 pb-3">
          <CardTitle className="text-sm font-semibold text-gray-700">Vitals History</CardTitle>
        </CardHeader>
        <CardContent className="px-5 pb-8 flex flex-col items-center justify-center text-gray-400">
          <Clock className="w-8 h-8 mb-2 opacity-30" />
          <p className="text-sm">No previous vitals recorded</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border border-gray-100 shadow-sm overflow-hidden">
      <CardHeader className="px-5 pt-4 pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-semibold text-gray-700">Vitals History</CardTitle>
          <span className="text-xs text-gray-400">{records.length} record{records.length !== 1 ? 's' : ''}</span>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="bg-gray-50 border-y border-gray-100">
                <th className="text-left px-4 py-2.5 font-semibold text-gray-500 whitespace-nowrap sticky left-0 bg-gray-50 z-10">Date & Time</th>
                <th className="text-center px-3 py-2.5 font-semibold text-gray-500 whitespace-nowrap">BP</th>
                <th className="text-center px-3 py-2.5 font-semibold text-gray-500 whitespace-nowrap">HR</th>
                <th className="text-center px-3 py-2.5 font-semibold text-gray-500 whitespace-nowrap">RR</th>
                <th className="text-center px-3 py-2.5 font-semibold text-gray-500 whitespace-nowrap">Temp</th>
                <th className="text-center px-3 py-2.5 font-semibold text-gray-500 whitespace-nowrap">SpO₂</th>
                <th className="text-center px-3 py-2.5 font-semibold text-gray-500 whitespace-nowrap">BMI</th>
                <th className="text-center px-3 py-2.5 font-semibold text-gray-500 whitespace-nowrap">Glucose</th>
                <th className="text-center px-3 py-2.5 font-semibold text-gray-500 whitespace-nowrap">Pain</th>
                <th className="text-center px-3 py-2.5 font-semibold text-gray-500 whitespace-nowrap">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {records.map((rec, idx) => {
                const prev = records[idx + 1] ?? null;

                const bpDisplay = rec.systolic_bp != null && rec.diastolic_bp != null
                  ? `${rec.systolic_bp}/${rec.diastolic_bp}`
                  : '—';

                const hrStatus = rec.heart_rate != null ? getVitalStatus('heartRate', rec.heart_rate) : 'normal';
                const rrStatus = rec.respiratory_rate != null ? getVitalStatus('respiratoryRate', rec.respiratory_rate) : 'normal';
                const tmpStatus = rec.temperature != null ? getVitalStatus('temperature', rec.temperature) : 'normal';
                const spo2Status = rec.spo2 != null ? getVitalStatus('spo2', rec.spo2) : 'normal';

                function cellCls(status: string) {
                  if (status === 'critical') return 'text-red-700 font-bold';
                  if (status === 'warning') return 'text-amber-700 font-semibold';
                  return 'text-gray-700';
                }

                return (
                  <tr key={rec.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-2.5 sticky left-0 bg-white hover:bg-gray-50 z-10">
                      <div className="flex items-center gap-1.5">
                        <Clock className="w-3 h-3 text-gray-300 shrink-0" />
                        <span className="text-gray-600 whitespace-nowrap">{fmtDate(rec.recorded_at)}</span>
                        {idx === 0 && (
                          <span className="text-blue-600 bg-blue-50 text-xs px-1.5 rounded font-medium">Latest</span>
                        )}
                      </div>
                    </td>

                    <td className="text-center px-3 py-2.5">
                      <div className="flex items-center justify-center gap-1">
                        <span className={(() => {
                          const sSt = rec.systolic_bp != null ? getVitalStatus('systolicBp', rec.systolic_bp) : 'normal';
                          const dSt = rec.diastolic_bp != null ? getVitalStatus('diastolicBp', rec.diastolic_bp) : 'normal';
                          const worst = sSt === 'critical' || dSt === 'critical' ? 'critical' : sSt === 'warning' || dSt === 'warning' ? 'warning' : 'normal';
                          return cellCls(worst);
                        })()}>{bpDisplay}</span>
                        {prev && rec.systolic_bp != null && (() => {
                          const t = getTrend(rec.systolic_bp, prev.systolic_bp);
                          return t ? <TrendIcon dir={t} /> : null;
                        })()}
                      </div>
                    </td>

                    <td className="text-center px-3 py-2.5">
                      <div className="flex items-center justify-center gap-1">
                        <span className={cellCls(hrStatus)}>{fmtVal(rec.heart_rate)}</span>
                        {prev && (() => {
                          const t = getTrend(rec.heart_rate, prev.heart_rate);
                          return t ? <TrendIcon dir={t} /> : null;
                        })()}
                      </div>
                    </td>

                    <td className="text-center px-3 py-2.5">
                      <div className="flex items-center justify-center gap-1">
                        <span className={cellCls(rrStatus)}>{fmtVal(rec.respiratory_rate)}</span>
                        {prev && (() => {
                          const t = getTrend(rec.respiratory_rate, prev.respiratory_rate);
                          return t ? <TrendIcon dir={t} /> : null;
                        })()}
                      </div>
                    </td>

                    <td className="text-center px-3 py-2.5">
                      <div className="flex items-center justify-center gap-1">
                        <span className={cellCls(tmpStatus)}>{fmtVal(rec.temperature, 1)}</span>
                        {prev && (() => {
                          const t = getTrend(rec.temperature, prev.temperature);
                          return t ? <TrendIcon dir={t} /> : null;
                        })()}
                      </div>
                    </td>

                    <td className="text-center px-3 py-2.5">
                      <div className="flex items-center justify-center gap-1">
                        <span className={cellCls(spo2Status)}>{fmtVal(rec.spo2)}{rec.spo2 != null ? '%' : ''}</span>
                        {prev && (() => {
                          const t = getTrend(rec.spo2, prev.spo2);
                          return t ? <TrendIcon dir={t} /> : null;
                        })()}
                      </div>
                    </td>

                    <td className="text-center px-3 py-2.5">
                      {rec.bmi != null ? (
                        <div className="flex flex-col items-center">
                          <span className="text-gray-700">{fmtVal(rec.bmi, 1)}</span>
                        </div>
                      ) : <span className="text-gray-300">—</span>}
                    </td>

                    <td className="text-center px-3 py-2.5">
                      {rec.blood_glucose_level != null ? (
                        <span className={rec.blood_glucose_level > 140 ? 'text-amber-700 font-semibold' : 'text-gray-700'}>
                          {fmtVal(rec.blood_glucose_level, 1)}
                        </span>
                      ) : <span className="text-gray-300">—</span>}
                    </td>

                    <td className="text-center px-3 py-2.5">
                      {rec.pain_scale != null ? (
                        <span className={`font-bold ${rec.pain_scale === 0 ? 'text-gray-400' : rec.pain_scale <= 3 ? 'text-emerald-600' : rec.pain_scale <= 6 ? 'text-amber-600' : 'text-red-600'}`}>
                          {rec.pain_scale}
                        </span>
                      ) : <span className="text-gray-300">—</span>}
                    </td>

                    <td className="text-center px-3 py-2.5">
                      {rec.is_abnormal ? (
                        <span className="inline-flex items-center gap-1 text-amber-700 bg-amber-50 border border-amber-200 text-xs px-1.5 py-0.5 rounded font-medium">
                          <AlertTriangle className="w-2.5 h-2.5" />
                          Abnormal
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-emerald-700 bg-emerald-50 border border-emerald-200 text-xs px-1.5 py-0.5 rounded font-medium">
                          Normal
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}
