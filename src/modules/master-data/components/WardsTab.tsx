import { useState } from 'react';
import { Plus, Edit2, ToggleLeft, ToggleRight, BedDouble, IndianRupee, Layers } from 'lucide-react';
import { Button } from '../../../components/ui/button';
import { Badge } from '../../../components/ui/badge';
import { toast } from 'sonner';
import MasterDataTable, { Column } from './MasterDataTable';
import WardDialog from './WardDialog';
import { masterDataService } from '../../../services/master-data.service';
import type { Ward, WardFormData } from '../types';
import { WARD_TYPES, WARD_CATEGORIES } from '../types';

interface WardsTabProps {
  wards: Ward[];
  loading: boolean;
  hospitalId: string;
  onRefresh: () => void;
}

const WARD_TYPE_COLORS: Record<string, string> = {
  'General': 'bg-slate-50 text-slate-700 border-slate-200',
  'Private': 'bg-blue-50 text-blue-700 border-blue-200',
  'Semi-Private': 'bg-sky-50 text-sky-700 border-sky-200',
  'ICU': 'bg-red-50 text-red-700 border-red-200',
  'NICU': 'bg-pink-50 text-pink-700 border-pink-200',
  'PICU': 'bg-rose-50 text-rose-700 border-rose-200',
  'CCU': 'bg-orange-50 text-orange-700 border-orange-200',
  'HDU': 'bg-amber-50 text-amber-700 border-amber-200',
  'Emergency': 'bg-red-50 text-red-700 border-red-200',
  'Maternity': 'bg-pink-50 text-pink-700 border-pink-200',
  'Pediatric': 'bg-cyan-50 text-cyan-700 border-cyan-200',
  'Surgical': 'bg-purple-50 text-purple-700 border-purple-200',
  'Medical': 'bg-teal-50 text-teal-700 border-teal-200',
  'Orthopedic': 'bg-lime-50 text-lime-700 border-lime-200',
  'Isolation': 'bg-yellow-50 text-yellow-700 border-yellow-200',
};

export default function WardsTab({ wards, loading, hospitalId, onRefresh }: WardsTabProps) {
  const [showDialog, setShowDialog] = useState(false);
  const [editingItem, setEditingItem] = useState<Ward | null>(null);

  const handleSave = async (data: WardFormData) => {
    try {
      if (editingItem) {
        await masterDataService.updateWard(editingItem.id, data);
        toast.success('Ward updated');
      } else {
        await masterDataService.createWard(hospitalId, data);
        toast.success('Ward added');
      }
      setShowDialog(false);
      setEditingItem(null);
      onRefresh();
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to save ward';
      toast.error(msg);
    }
  };

  const handleToggleStatus = async (item: Ward) => {
    try {
      await masterDataService.updateWard(item.id, { is_active: !item.is_active });
      toast.success(item.is_active ? 'Ward deactivated' : 'Ward activated');
      onRefresh();
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to update status';
      toast.error(msg);
    }
  };

  const openEdit = (item: Ward) => {
    setEditingItem(item);
    setShowDialog(true);
  };

  const columns: Column<Ward>[] = [
    {
      key: 'name',
      label: 'Ward Name',
      sortable: true,
      render: (item) => (
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-lg bg-gradient-to-br from-emerald-400 to-teal-600 flex items-center justify-center">
            <BedDouble className="h-4 w-4 text-white" />
          </div>
          <div>
            <div className="font-medium text-slate-900">{item.name}</div>
            {(item.floor || item.block) && (
              <div className="text-xs text-slate-500">
                {item.floor && `Floor: ${item.floor}`}
                {item.floor && item.block && ' | '}
                {item.block && `Block: ${item.block}`}
              </div>
            )}
          </div>
        </div>
      ),
    },
    {
      key: 'ward_type',
      label: 'Type',
      sortable: true,
      render: (item) => (
        <Badge
          variant="outline"
          className={WARD_TYPE_COLORS[item.ward_type] || 'bg-slate-50 text-slate-700 border-slate-200'}
        >
          {item.ward_type}
        </Badge>
      ),
    },
    {
      key: 'total_beds',
      label: 'Beds',
      sortable: true,
      width: '100px',
      render: (item) => (
        <div className="flex items-center gap-1.5 text-slate-900 font-medium">
          <Layers className="h-3.5 w-3.5 text-slate-500" />
          {item.total_beds}
        </div>
      ),
    },
    {
      key: 'daily_rate',
      label: 'Daily Rate',
      sortable: true,
      width: '120px',
      render: (item) => (
        <div className="flex items-center gap-1 font-medium text-slate-900">
          <IndianRupee className="h-3.5 w-3.5" />
          {item.daily_rate.toLocaleString()}
        </div>
      ),
    },
    {
      key: 'description',
      label: 'Description',
      render: (item) => (
        <span className="text-slate-600 text-sm line-clamp-1">
          {item.description || '-'}
        </span>
      ),
    },
    {
      key: 'is_active',
      label: 'Status',
      width: '100px',
      render: (item) => (
        <Badge
          variant="outline"
          className={item.is_active
            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
            : 'bg-slate-100 text-slate-500 border-slate-200'
          }
        >
          {item.is_active ? 'Active' : 'Inactive'}
        </Badge>
      ),
    },
    {
      key: 'actions',
      label: 'Actions',
      width: '100px',
      render: (item) => (
        <div className="flex items-center gap-1">
          <Button
            size="sm"
            variant="ghost"
            className="h-8 w-8 p-0"
            onClick={(e) => { e.stopPropagation(); openEdit(item); }}
          >
            <Edit2 className="h-4 w-4" />
          </Button>
          <Button
            size="sm"
            variant="ghost"
            className="h-8 w-8 p-0"
            onClick={(e) => { e.stopPropagation(); handleToggleStatus(item); }}
          >
            {item.is_active ? (
              <ToggleRight className="h-4 w-4 text-emerald-600" />
            ) : (
              <ToggleLeft className="h-4 w-4 text-slate-400" />
            )}
          </Button>
        </div>
      ),
    },
  ];

  const wardTypeOptions = WARD_TYPES.map(type => ({ value: type, label: type }));

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-slate-900">Wards</h3>
          <p className="text-sm text-muted-foreground">
            Manage hospital wards, bed capacity, and daily rates
          </p>
        </div>
        <Button onClick={() => { setEditingItem(null); setShowDialog(true); }}>
          <Plus className="h-4 w-4 mr-1.5" />
          Add Ward
        </Button>
      </div>

      <MasterDataTable
        data={wards}
        columns={columns}
        loading={loading}
        searchPlaceholder="Search by ward name, type, or location..."
        searchKeys={['name', 'ward_type', 'floor', 'block']}
        filterOptions={{
          key: 'ward_type',
          label: 'Ward Type',
          options: wardTypeOptions,
        }}
        statusFilter={{ key: 'is_active' }}
        getRowKey={(item) => item.id}
        emptyMessage="No wards found. Add your first ward to get started."
      />

      <WardDialog
        open={showDialog}
        onOpenChange={setShowDialog}
        ward={editingItem}
        onSave={handleSave}
        wardTypes={[...WARD_TYPES]}
      />
    </div>
  );
}
