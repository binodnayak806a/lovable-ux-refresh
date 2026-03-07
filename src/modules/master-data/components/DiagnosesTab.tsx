import { useState } from 'react';
import { Plus, Edit2, ToggleLeft, ToggleRight, TrendingUp, FileCode } from 'lucide-react';
import { Button } from '../../../components/ui/button';
import { Badge } from '../../../components/ui/badge';
import { toast } from 'sonner';
import MasterDataTable, { Column } from './MasterDataTable';
import DiagnosisDialog from './DiagnosisDialog';
import { masterDataService } from '../../../services/master-data.service';
import type { Diagnosis, DiagnosisFormData } from '../types';
import { DIAGNOSIS_CATEGORIES } from '../types';

interface DiagnosesTabProps {
  diagnoses: Diagnosis[];
  loading: boolean;
  hospitalId: string;
  onRefresh: () => void;
}

export default function DiagnosesTab({ diagnoses, loading, hospitalId, onRefresh }: DiagnosesTabProps) {
  const [showDialog, setShowDialog] = useState(false);
  const [editingItem, setEditingItem] = useState<Diagnosis | null>(null);

  const handleSave = async (data: DiagnosisFormData) => {
    try {
      if (editingItem) {
        await masterDataService.updateDiagnosis(editingItem.id, data);
        toast.success('Diagnosis updated');
      } else {
        await masterDataService.createDiagnosis(hospitalId, data);
        toast.success('Diagnosis added');
      }
      setShowDialog(false);
      setEditingItem(null);
      onRefresh();
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to save diagnosis';
      toast.error(msg);
    }
  };

  const handleToggleStatus = async (item: Diagnosis) => {
    try {
      await masterDataService.updateDiagnosis(item.id, { is_active: !item.is_active });
      toast.success(item.is_active ? 'Diagnosis deactivated' : 'Diagnosis activated');
      onRefresh();
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to update status';
      toast.error(msg);
    }
  };

  const openEdit = (item: Diagnosis) => {
    setEditingItem(item);
    setShowDialog(true);
  };

  const columns: Column<Diagnosis>[] = [
    {
      key: 'name',
      label: 'Diagnosis Name',
      sortable: true,
      render: (item) => (
        <div className="font-medium text-slate-900">{item.name}</div>
      ),
    },
    {
      key: 'icd_code',
      label: 'ICD Code',
      sortable: true,
      width: '120px',
      render: (item) => item.icd_code ? (
        <div className="flex items-center gap-1.5">
          <FileCode className="h-3.5 w-3.5 text-slate-400" />
          <code className="text-xs bg-slate-100 px-1.5 py-0.5 rounded font-mono">
            {item.icd_code}
          </code>
        </div>
      ) : <span className="text-slate-400">-</span>,
    },
    {
      key: 'category',
      label: 'Category',
      sortable: true,
      render: (item) => item.category ? (
        <Badge variant="outline" className="bg-rose-50 text-rose-700 border-rose-200">
          {item.category}
        </Badge>
      ) : <span className="text-slate-400">-</span>,
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
      key: 'usage_count',
      label: 'Usage',
      sortable: true,
      width: '100px',
      render: (item) => (
        <div className="flex items-center gap-1.5 text-slate-600">
          <TrendingUp className="h-3.5 w-3.5" />
          <span>{item.usage_count || 0}</span>
        </div>
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

  const categoryOptions = DIAGNOSIS_CATEGORIES.map(cat => ({ value: cat, label: cat }));

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-slate-900">Diagnoses</h3>
          <p className="text-sm text-muted-foreground">
            Manage diagnoses with ICD codes for clinical documentation
          </p>
        </div>
        <Button onClick={() => { setEditingItem(null); setShowDialog(true); }}>
          <Plus className="h-4 w-4 mr-1.5" />
          Add Diagnosis
        </Button>
      </div>

      <MasterDataTable
        data={diagnoses}
        columns={columns}
        loading={loading}
        searchPlaceholder="Search by name, ICD code, or description..."
        searchKeys={['name', 'icd_code', 'description', 'category']}
        filterOptions={{
          key: 'category',
          label: 'Category',
          options: categoryOptions,
        }}
        statusFilter={{ key: 'is_active' }}
        getRowKey={(item) => item.id}
        emptyMessage="No diagnoses found. Add your first diagnosis to get started."
      />

      <DiagnosisDialog
        open={showDialog}
        onOpenChange={setShowDialog}
        diagnosis={editingItem}
        onSave={handleSave}
        categories={[...DIAGNOSIS_CATEGORIES]}
      />
    </div>
  );
}
