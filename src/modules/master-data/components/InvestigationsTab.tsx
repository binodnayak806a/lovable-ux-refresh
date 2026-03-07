import { useState } from 'react';
import { Plus, Edit2, ToggleLeft, ToggleRight, IndianRupee, Clock } from 'lucide-react';
import { Button } from '../../../components/ui/button';
import { Badge } from '../../../components/ui/badge';
import { toast } from 'sonner';
import MasterDataTable, { Column } from './MasterDataTable';
import InvestigationDialog from './InvestigationDialog';
import { masterDataService } from '../../../services/master-data.service';
import type { Investigation, InvestigationFormData } from '../types';
import { INVESTIGATION_CATEGORIES } from '../types';

interface InvestigationsTabProps {
  investigations: Investigation[];
  loading: boolean;
  hospitalId: string;
  onRefresh: () => void;
}

export default function InvestigationsTab({ investigations, loading, hospitalId, onRefresh }: InvestigationsTabProps) {
  const [showDialog, setShowDialog] = useState(false);
  const [editingItem, setEditingItem] = useState<Investigation | null>(null);

  const handleSave = async (data: InvestigationFormData) => {
    try {
      if (editingItem) {
        await masterDataService.updateInvestigation(editingItem.id, data);
        toast.success('Investigation updated');
      } else {
        await masterDataService.createInvestigation(hospitalId, data);
        toast.success('Investigation added');
      }
      setShowDialog(false);
      setEditingItem(null);
      onRefresh();
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to save investigation';
      toast.error(msg);
    }
  };

  const handleToggleStatus = async (item: Investigation) => {
    try {
      await masterDataService.updateInvestigation(item.id, { is_active: !item.is_active });
      toast.success(item.is_active ? 'Investigation deactivated' : 'Investigation activated');
      onRefresh();
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to update status';
      toast.error(msg);
    }
  };

  const openEdit = (item: Investigation) => {
    setEditingItem(item);
    setShowDialog(true);
  };

  const columns: Column<Investigation>[] = [
    {
      key: 'name',
      label: 'Test Name',
      sortable: true,
      render: (item) => (
        <div>
          <div className="font-medium text-slate-900">{item.name}</div>
          {item.code && (
            <div className="text-xs text-slate-500 mt-0.5">Code: {item.code}</div>
          )}
        </div>
      ),
    },
    {
      key: 'category',
      label: 'Category',
      sortable: true,
      render: (item) => (
        <Badge variant="outline" className="bg-cyan-50 text-cyan-700 border-cyan-200">
          {item.category}
        </Badge>
      ),
    },
    {
      key: 'sample_type',
      label: 'Sample',
      render: (item) => (
        <span className="text-slate-600">{item.sample_type || '-'}</span>
      ),
    },
    {
      key: 'normal_range',
      label: 'Normal Range',
      render: (item) => (
        <div className="text-sm">
          {item.normal_range_male || item.normal_range_female ? (
            <div className="space-y-0.5">
              {item.normal_range_male && (
                <div className="text-slate-600">M: {item.normal_range_male} {item.unit}</div>
              )}
              {item.normal_range_female && (
                <div className="text-slate-600">F: {item.normal_range_female} {item.unit}</div>
              )}
            </div>
          ) : (
            <span className="text-slate-400">-</span>
          )}
        </div>
      ),
    },
    {
      key: 'price',
      label: 'Price',
      sortable: true,
      width: '100px',
      render: (item) => (
        <div className="flex items-center gap-1 font-medium text-slate-900">
          <IndianRupee className="h-3.5 w-3.5" />
          {item.price.toLocaleString()}
        </div>
      ),
    },
    {
      key: 'turnaround_time',
      label: 'TAT',
      width: '100px',
      render: (item) => item.turnaround_time ? (
        <div className="flex items-center gap-1.5 text-slate-600">
          <Clock className="h-3.5 w-3.5" />
          <span>{item.turnaround_time}</span>
        </div>
      ) : <span className="text-slate-400">-</span>,
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

  const categoryOptions = INVESTIGATION_CATEGORIES.map(cat => ({ value: cat, label: cat }));

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-slate-900">Investigations / Lab Tests</h3>
          <p className="text-sm text-muted-foreground">
            Manage laboratory tests, imaging studies, and diagnostic procedures
          </p>
        </div>
        <Button onClick={() => { setEditingItem(null); setShowDialog(true); }}>
          <Plus className="h-4 w-4 mr-1.5" />
          Add Investigation
        </Button>
      </div>

      <MasterDataTable
        data={investigations}
        columns={columns}
        loading={loading}
        searchPlaceholder="Search by test name, code, or category..."
        searchKeys={['name', 'code', 'category', 'sample_type']}
        filterOptions={{
          key: 'category',
          label: 'Category',
          options: categoryOptions,
        }}
        statusFilter={{ key: 'is_active' }}
        getRowKey={(item) => item.id}
        emptyMessage="No investigations found. Add your first investigation to get started."
      />

      <InvestigationDialog
        open={showDialog}
        onOpenChange={setShowDialog}
        investigation={editingItem}
        onSave={handleSave}
        categories={[...INVESTIGATION_CATEGORIES]}
      />
    </div>
  );
}
