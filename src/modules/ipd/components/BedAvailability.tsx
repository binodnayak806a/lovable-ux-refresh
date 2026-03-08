import { useState, useEffect, useMemo } from 'react';
import { BedDouble, Filter, RefreshCw } from 'lucide-react';
import { Card, CardContent, CardHeader } from '../../../components/ui/card';
import { Button } from '../../../components/ui/button';
import { Badge } from '../../../components/ui/badge';
import SharedStatCard from '../../../components/shared/StatCard';
import { useToast } from '../../../hooks/useToast';
import ipdService from '../../../services/ipd.service';
import BedCard from './BedCard';
import AdmissionDialog from './AdmissionDialog';
import type { Ward, Bed, BedStatus, WardType } from '../types';
import { BED_STATUS_CONFIG, WARD_TYPE_CONFIG } from '../types';

interface BedStats {
  total: number;
  available: number;
  occupied: number;
  cleaning: number;
  maintenance: number;
  reserved: number;
}

interface Props {
  hospitalId: string;
}

export default function BedAvailability({ hospitalId }: Props) {
  const { toast } = useToast();
  const [wards, setWards] = useState<Ward[]>([]);
  const [beds, setBeds] = useState<Bed[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [filterWard, setFilterWard] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<BedStatus | 'all'>('all');

  const [selectedBed, setSelectedBed] = useState<Bed | null>(null);
  const [showAdmissionDialog, setShowAdmissionDialog] = useState(false);

  const loadData = async () => {
    try {
      const [wardsData, bedsData] = await Promise.all([
        ipdService.getWards(hospitalId),
        ipdService.getBedsWithOccupancy(hospitalId),
      ]);
      setWards(wardsData);
      setBeds(bedsData);
    } catch {
      toast('Error', { description: 'Failed to load bed data', type: 'error' });
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

  const filteredBeds = useMemo(() => {
    return beds.filter((bed) => {
      if (filterWard !== 'all' && bed.ward_id !== filterWard) return false;
      if (filterStatus !== 'all' && bed.status !== filterStatus) return false;
      return true;
    });
  }, [beds, filterWard, filterStatus]);

  const bedsByWard = useMemo(() => {
    const grouped: Record<string, { ward: Ward; beds: Bed[] }> = {};
    filteredBeds.forEach((bed) => {
      const ward = bed.ward || wards.find((w) => w.id === bed.ward_id);
      if (ward) {
        if (!grouped[ward.id]) {
          grouped[ward.id] = { ward, beds: [] };
        }
        grouped[ward.id].beds.push(bed);
      }
    });
    return Object.values(grouped);
  }, [filteredBeds, wards]);

  const stats: BedStats = useMemo(() => {
    return {
      total: beds.length,
      available: beds.filter((b) => b.status === 'available').length,
      occupied: beds.filter((b) => b.status === 'occupied').length,
      cleaning: beds.filter((b) => b.status === 'cleaning').length,
      maintenance: beds.filter((b) => b.status === 'maintenance').length,
      reserved: beds.filter((b) => b.status === 'reserved').length,
    };
  }, [beds]);

  const handleBedClick = (bed: Bed) => {
    setSelectedBed(bed);
    if (bed.status === 'available') {
      setShowAdmissionDialog(true);
    }
  };

  const handleAdmissionSuccess = () => {
    setShowAdmissionDialog(false);
    setSelectedBed(null);
    loadData();
    toast('Success', { description: 'Patient admitted successfully', type: 'success' });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
            <BedDouble className="w-5 h-5 text-primary" />
            Bed Availability
          </h2>
          <p className="text-sm text-muted-foreground mt-0.5">
            Real-time bed status across all wards
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

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3 stagger-children">
        <SharedStatCard label="Total Beds" value={stats.total} iconClassName="bg-muted text-muted-foreground" />
        <SharedStatCard label="Available" value={stats.available} iconClassName="bg-emerald-50 text-emerald-600" accentColor="green" />
        <SharedStatCard label="Occupied" value={stats.occupied} iconClassName="bg-primary/10 text-primary" accentColor="blue" />
        <SharedStatCard label="Reserved" value={stats.reserved} iconClassName="bg-violet-50 text-violet-600" accentColor="violet" />
        <SharedStatCard label="Cleaning" value={stats.cleaning} iconClassName="bg-amber-50 text-amber-600" accentColor="amber" />
        <SharedStatCard label="Maintenance" value={stats.maintenance} iconClassName="bg-red-50 text-red-600" accentColor="rose" />
      </div>

      <Card>
        <CardHeader className="py-3 px-4 border-b border-border/50">
          <div className="flex flex-wrap items-center gap-3">
            <Filter className="w-4 h-4 text-muted-foreground" />
            <select
              value={filterWard}
              onChange={(e) => setFilterWard(e.target.value)}
              className="h-8 px-3 rounded-lg border border-border text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary/20 bg-background"
            >
              <option value="all">All Wards</option>
              {wards.map((w) => (
                <option key={w.id} value={w.id}>{w.name}</option>
              ))}
            </select>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value as BedStatus | 'all')}
              className="h-8 px-3 rounded-lg border border-border text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary/20 bg-background"
            >
              <option value="all">All Status</option>
              <option value="available">Available</option>
              <option value="occupied">Occupied</option>
              <option value="reserved">Reserved</option>
              <option value="cleaning">Cleaning</option>
              <option value="maintenance">Maintenance</option>
            </select>
          </div>
        </CardHeader>
      </Card>

      {bedsByWard.map(({ ward, beds: wardBeds }) => (
        <Card key={ward.id} className="overflow-hidden">
          <div className="px-4 py-3 bg-muted/30 border-b border-border/50 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <h3 className="font-semibold text-foreground">{ward.name}</h3>
              <Badge className={WARD_TYPE_CONFIG[ward.ward_type as WardType]?.color || 'bg-muted'}>
                {WARD_TYPE_CONFIG[ward.ward_type as WardType]?.label || ward.ward_type}
              </Badge>
              <span className="text-xs text-muted-foreground">Floor {ward.floor}</span>
            </div>
            <div className="text-sm text-muted-foreground">
              {wardBeds.filter((b) => b.status === 'available').length} / {wardBeds.length} available
            </div>
          </div>
          <CardContent className="p-4">
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 gap-3">
              {wardBeds.map((bed) => (
                <BedCard key={bed.id} bed={bed} onClick={() => handleBedClick(bed)} />
              ))}
            </div>
          </CardContent>
        </Card>
      ))}

      {filteredBeds.length === 0 && (
        <div className="text-center py-12 text-muted-foreground">
          No beds match the selected filters
        </div>
      )}

      <div className="flex flex-wrap items-center justify-center gap-4 py-4">
        {Object.entries(BED_STATUS_CONFIG).map(([status, config]) => (
          <div key={status} className="flex items-center gap-2">
            <div
              className="w-4 h-4 rounded-md"
              style={{ backgroundColor: config.color }}
            />
            <span className="text-xs text-muted-foreground">{config.label}</span>
          </div>
        ))}
      </div>

      {showAdmissionDialog && selectedBed && (
        <AdmissionDialog
          bed={selectedBed}
          onClose={() => {
            setShowAdmissionDialog(false);
            setSelectedBed(null);
          }}
          onSuccess={handleAdmissionSuccess}
        />
      )}
    </div>
  );
}
