import { useState, useEffect } from 'react';
import { Building2, Filter, RefreshCw, Users, AlertTriangle, CheckCircle } from 'lucide-react';
import { Card } from '../../../components/ui/card';
import { Button } from '../../../components/ui/button';
import { Badge } from '../../../components/ui/badge';
import { useToast } from '../../../hooks/useToast';
import ipdService from '../../../services/ipd.service';
import PatientDetailPanel from './PatientDetailPanel';
import type { Ward, Admission } from '../types';
import { formatDistanceToNow } from 'date-fns';

function getPatientStatus(admission: Admission): { label: string; color: string } {
  if (admission.pending_tasks_count && admission.pending_tasks_count > 5) {
    return { label: 'Needs Attention', color: 'bg-amber-100 text-amber-700 border-amber-200' };
  }
  const vitals = admission.latest_vitals;
  if (vitals) {
    const abnormal =
      (vitals.systolic_bp && (vitals.systolic_bp > 140 || vitals.systolic_bp < 90)) ||
      (vitals.heart_rate && (vitals.heart_rate > 100 || vitals.heart_rate < 60)) ||
      (vitals.spo2 && vitals.spo2 < 95);
    if (abnormal) {
      return { label: 'Critical', color: 'bg-red-100 text-red-700 border-red-200' };
    }
  }
  return { label: 'Stable', color: 'bg-emerald-100 text-emerald-700 border-emerald-200' };
}

interface Props {
  hospitalId: string;
}

export default function WardBoard({ hospitalId }: Props) {
  const { toast } = useToast();
  const [wards, setWards] = useState<Ward[]>([]);
  const [admissions, setAdmissions] = useState<Admission[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [filterWard, setFilterWard] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [selectedAdmission, setSelectedAdmission] = useState<Admission | null>(null);

  const loadData = async () => {
    try {
      const [wardsData, admissionsData] = await Promise.all([
        ipdService.getWards(hospitalId),
        ipdService.getActiveAdmissions(hospitalId),
      ]);
      setWards(wardsData);
      setAdmissions(admissionsData);
    } catch {
      toast('Error', { description: 'Failed to load ward data', type: 'error' });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleRefresh = () => {
    setRefreshing(true);
    loadData();
  };

  const filteredAdmissions = admissions.filter((a) => {
    if (filterWard !== 'all' && a.ward_id !== filterWard) return false;
    if (filterStatus !== 'all') {
      const status = getPatientStatus(a);
      if (filterStatus === 'critical' && status.label !== 'Critical') return false;
      if (filterStatus === 'attention' && status.label !== 'Needs Attention') return false;
      if (filterStatus === 'stable' && status.label !== 'Stable') return false;
    }
    return true;
  });

  const stats = {
    total: admissions.length,
    critical: admissions.filter((a) => getPatientStatus(a).label === 'Critical').length,
    attention: admissions.filter((a) => getPatientStatus(a).label === 'Needs Attention').length,
    stable: admissions.filter((a) => getPatientStatus(a).label === 'Stable').length,
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
      </div>
    );
  }

  return (
    <div className="flex h-[calc(100vh-180px)] gap-4">
      <div className="flex-1 flex flex-col min-w-0">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
          <div>
            <h1 className="text-xl font-bold text-gray-900 flex items-center gap-2">
              <Building2 className="w-5 h-5 text-blue-600" />
              Ward Board
            </h1>
            <p className="text-sm text-gray-500 mt-0.5">
              {admissions.length} patients currently admitted
            </p>
          </div>
          <Button
            size="sm"
            variant="outline"
            onClick={handleRefresh}
            disabled={refreshing}
            className="gap-1.5"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>

        <div className="grid grid-cols-4 gap-3 mb-4">
          <StatCard label="Total" value={stats.total} color="bg-blue-100 text-blue-700" icon={Users} />
          <StatCard label="Critical" value={stats.critical} color="bg-red-100 text-red-700" icon={AlertTriangle} />
          <StatCard label="Attention" value={stats.attention} color="bg-amber-100 text-amber-700" icon={AlertTriangle} />
          <StatCard label="Stable" value={stats.stable} color="bg-emerald-100 text-emerald-700" icon={CheckCircle} />
        </div>

        <Card className="border border-gray-100 shadow-sm mb-4">
          <div className="px-4 py-3 border-b border-gray-100 flex items-center gap-3">
            <Filter className="w-4 h-4 text-gray-400" />
            <select
              value={filterWard}
              onChange={(e) => setFilterWard(e.target.value)}
              className="h-8 px-3 rounded-lg border border-gray-200 text-sm outline-none"
            >
              <option value="all">All Wards</option>
              {wards.map((w) => (
                <option key={w.id} value={w.id}>{w.name}</option>
              ))}
            </select>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="h-8 px-3 rounded-lg border border-gray-200 text-sm outline-none"
            >
              <option value="all">All Status</option>
              <option value="critical">Critical</option>
              <option value="attention">Needs Attention</option>
              <option value="stable">Stable</option>
            </select>
          </div>
        </Card>

        <Card className="border border-gray-100 shadow-sm flex-1 overflow-hidden">
          <div className="overflow-auto h-full">
            <table className="w-full">
              <thead className="bg-gray-50 sticky top-0">
                <tr>
                  <th className="py-3 px-4 text-xs font-semibold text-gray-500 text-left">Status</th>
                  <th className="py-3 px-4 text-xs font-semibold text-gray-500 text-left">Patient</th>
                  <th className="py-3 px-4 text-xs font-semibold text-gray-500 text-left">Bed</th>
                  <th className="py-3 px-4 text-xs font-semibold text-gray-500 text-left">Admitted</th>
                  <th className="py-3 px-4 text-xs font-semibold text-gray-500 text-left">Doctor</th>
                  <th className="py-3 px-4 text-xs font-semibold text-gray-500 text-center">Tasks</th>
                </tr>
              </thead>
              <tbody>
                {filteredAdmissions.map((admission) => {
                  const status = getPatientStatus(admission);
                  const isSelected = selectedAdmission?.id === admission.id;
                  return (
                    <tr
                      key={admission.id}
                      onClick={() => setSelectedAdmission(admission)}
                      className={`border-b border-gray-50 cursor-pointer transition-colors ${
                        isSelected ? 'bg-blue-50' : 'hover:bg-gray-50'
                      }`}
                    >
                      <td className="py-3 px-4">
                        <Badge className={`text-xs ${status.color}`}>{status.label}</Badge>
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-medium text-sm text-gray-800">
                          {admission.patient?.full_name}
                        </div>
                        <div className="text-xs text-gray-500">
                          {admission.patient?.uhid} | {admission.patient?.gender}
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-medium text-sm">{admission.bed?.bed_number}</div>
                        <div className="text-xs text-gray-500">
                          {(admission.bed?.ward as { name?: string })?.name}
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="text-sm text-gray-700">
                          {formatDistanceToNow(new Date(admission.admission_date), { addSuffix: true })}
                        </div>
                        <div className="text-xs text-gray-500">{admission.admission_number}</div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="text-sm text-gray-700">
                          Dr. {admission.doctor?.full_name?.split(' ')[0]}
                        </div>
                        <div className="text-xs text-gray-500">{admission.doctor?.department}</div>
                      </td>
                      <td className="py-3 px-4 text-center">
                        {admission.pending_tasks_count ? (
                          <Badge className="bg-blue-100 text-blue-700">
                            {admission.pending_tasks_count}
                          </Badge>
                        ) : (
                          <span className="text-xs text-gray-400">-</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>

            {filteredAdmissions.length === 0 && (
              <div className="text-center py-12 text-gray-500">
                No patients match the selected filters
              </div>
            )}
          </div>
        </Card>
      </div>

      <div className="w-[400px] flex-shrink-0">
        {selectedAdmission ? (
          <PatientDetailPanel
            admission={selectedAdmission}
            onUpdate={loadData}
            onClose={() => setSelectedAdmission(null)}
          />
        ) : (
          <Card className="border border-gray-100 shadow-sm h-full flex items-center justify-center">
            <div className="text-center text-gray-400 p-8">
              <Users className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>Select a patient to view details</p>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}

function StatCard({
  label,
  value,
  color,
  icon: Icon,
}: {
  label: string;
  value: number;
  color: string;
  icon: React.ElementType;
}) {
  return (
    <div className={`rounded-xl p-3 ${color}`}>
      <div className="flex items-center justify-between">
        <div className="text-2xl font-bold">{value}</div>
        <Icon className="w-5 h-5 opacity-70" />
      </div>
      <div className="text-xs font-medium opacity-80 mt-1">{label}</div>
    </div>
  );
}
