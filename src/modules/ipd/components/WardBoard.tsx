import { useState, useEffect } from 'react';
import { Building2, Filter, RefreshCw, Users, AlertTriangle, CheckCircle } from 'lucide-react';
import { Card } from '../../../components/ui/card';
import { Button } from '../../../components/ui/button';
import { Badge } from '../../../components/ui/badge';
import SharedStatCard from '../../../components/shared/StatCard';
import { useToast } from '../../../hooks/useToast';
import ipdService from '../../../services/ipd.service';
import PatientDetailPanel from './PatientDetailPanel';
import type { Ward, Admission } from '../types';
import { formatDistanceToNow } from 'date-fns';
import { cn } from '../../../lib/utils';

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
    // Auto-refresh every 30 seconds
    const interval = setInterval(() => {
      loadData();
    }, 30_000);
    return () => clearInterval(interval);
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
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <div className="flex flex-1 min-h-0 gap-4 animate-fade-in">
      <div className="flex-1 flex flex-col min-w-0">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
          <div>
            <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
              <Building2 className="w-5 h-5 text-primary" />
              Ward Board
            </h2>
            <p className="text-sm text-muted-foreground mt-0.5">
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

        <div className="grid grid-cols-4 gap-3 mb-4 stagger-children">
          <SharedStatCard label="Total" value={stats.total} icon={Users} iconClassName="bg-primary/10 text-primary" accentColor="blue" />
          <SharedStatCard label="Critical" value={stats.critical} icon={AlertTriangle} iconClassName="bg-red-50 text-red-600" accentColor="rose" />
          <SharedStatCard label="Attention" value={stats.attention} icon={AlertTriangle} iconClassName="bg-amber-50 text-amber-600" accentColor="amber" />
          <SharedStatCard label="Stable" value={stats.stable} icon={CheckCircle} iconClassName="bg-emerald-50 text-emerald-600" accentColor="green" />
        </div>

        <Card className="mb-4">
          <div className="px-4 py-3 border-b border-border/50 flex items-center gap-3">
            <Filter className="w-4 h-4 text-muted-foreground" />
            <select
              value={filterWard}
              onChange={(e) => setFilterWard(e.target.value)}
              className="h-8 px-3 rounded-lg border border-border text-sm outline-none focus:border-primary bg-background"
            >
              <option value="all">All Wards</option>
              {wards.map((w) => (
                <option key={w.id} value={w.id}>{w.name}</option>
              ))}
            </select>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="h-8 px-3 rounded-lg border border-border text-sm outline-none focus:border-primary bg-background"
            >
              <option value="all">All Status</option>
              <option value="critical">Critical</option>
              <option value="attention">Needs Attention</option>
              <option value="stable">Stable</option>
            </select>
          </div>
        </Card>

        <Card className="flex-1 overflow-hidden">
          <div className="overflow-auto h-full">
            <table className="w-full">
              <thead className="bg-muted/30 sticky top-0">
                <tr>
                  <th className="py-3 px-4 text-xs font-semibold text-muted-foreground text-left">Status</th>
                  <th className="py-3 px-4 text-xs font-semibold text-muted-foreground text-left">Patient</th>
                  <th className="py-3 px-4 text-xs font-semibold text-muted-foreground text-left">Bed</th>
                  <th className="py-3 px-4 text-xs font-semibold text-muted-foreground text-left">Admitted</th>
                  <th className="py-3 px-4 text-xs font-semibold text-muted-foreground text-left">Doctor</th>
                  <th className="py-3 px-4 text-xs font-semibold text-muted-foreground text-center">Tasks</th>
                </tr>
              </thead>
              <tbody>
                {filteredAdmissions.map((admission) => {
                  const status = getPatientStatus(admission);
                  const isSelected = selectedAdmission?.id === admission.id;
                  const isCritical = status.label === 'Critical';
                  return (
                    <tr
                      key={admission.id}
                      onClick={() => setSelectedAdmission(admission)}
                      className={cn(
                        'border-b border-border/30 cursor-pointer transition-all duration-200',
                        isSelected ? 'bg-primary/5' : 'hover:bg-muted/30',
                        isCritical && !isSelected && 'bg-destructive/5',
                      )}
                    >
                      <td className="py-3 px-4">
                        <Badge className={cn('text-xs border-0', status.color)}>{status.label}</Badge>
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-medium text-sm text-foreground">
                          {admission.patient?.full_name}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {admission.patient?.uhid} | {admission.patient?.gender}
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-medium text-sm text-foreground">{admission.bed?.bed_number}</div>
                        <div className="text-xs text-muted-foreground">
                          {(admission.bed?.ward as { name?: string })?.name}
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="text-sm text-foreground">
                          {formatDistanceToNow(new Date(admission.admission_date), { addSuffix: true })}
                        </div>
                        <div className="text-xs text-muted-foreground">{admission.admission_number}</div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="text-sm text-foreground">
                          Dr. {admission.doctor?.full_name?.split(' ')[0]}
                        </div>
                        <div className="text-xs text-muted-foreground">{admission.doctor?.department}</div>
                      </td>
                      <td className="py-3 px-4 text-center">
                        {admission.pending_tasks_count ? (
                          <Badge className="bg-primary/10 text-primary border-0">
                            {admission.pending_tasks_count}
                          </Badge>
                        ) : (
                          <span className="text-xs text-muted-foreground">-</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>

            {filteredAdmissions.length === 0 && (
              <div className="text-center py-12 text-muted-foreground">
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
          <Card className="h-full flex items-center justify-center">
            <div className="text-center text-muted-foreground p-8">
              <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center mx-auto mb-4">
                <Users className="w-8 h-8 opacity-40" />
              </div>
              <p className="text-sm font-medium">Select a patient to view details</p>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}
