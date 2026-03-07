import { useState } from 'react';
import { Plus, Edit2, ToggleLeft, ToggleRight, TrendingUp } from 'lucide-react';
import { Button } from '../../../components/ui/button';
import { Badge } from '../../../components/ui/badge';
import { toast } from 'sonner';
import MasterDataTable, { Column } from './MasterDataTable';
import SymptomDialog from './SymptomDialog';
import { masterDataService } from '../../../services/master-data.service';
import type { Symptom, SymptomFormData } from '../types';
import { SYMPTOM_CATEGORIES } from '../types';

interface SymptomsTabProps {
  symptoms: Symptom[];
  loading: boolean;
  hospitalId: string;
  onRefresh: () => void;
}

export default function SymptomsTab({ symptoms, loading, hospitalId, onRefresh }: SymptomsTabProps) {
  const [showDialog, setShowDialog] = useState(false);
  const [editingItem, setEditingItem] = useState<Symptom | null>(null);

  const handleSave = async (data: SymptomFormData) => {
    try {
      if (editingItem) {
        await masterDataService.updateSymptom(editingItem.id, data);
        toast.success('Symptom updated');
      } else {
        await masterDataService.createSymptom(hospitalId, data);
        toast.success('Symptom added');
      }
      setShowDialog(false);
      setEditingItem(null);
      onRefresh();
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to save symptom';
      toast.error(msg);
    }
  };

  const handleToggleStatus = async (item: Symptom) => {
    try {
      await masterDataService.updateSymptom(item.id, { is_active: !item.is_active });
      toast.success(item.is_active ? 'Symptom deactivated' : 'Symptom activated');
      onRefresh();
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to update status';
      toast.error(msg);
    }
  };

  const openEdit = (item: Symptom) => {
    setEditingItem(item);
    setShowDialog(true);
  };

  const columns: Column<Symptom>[] = [
    {
      key: 'name',
      label: 'Symptom Name',
      sortable: true,
      render: (item) => (
        <div className="font-medium text-slate-900">{item.name}</div>
      ),
    },
    {
      key: 'category',
      label: 'Category',
      sortable: true,
      render: (item) => item.category ? (
        <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200">
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

  const categoryOptions = SYMPTOM_CATEGORIES.map(cat => ({ value: cat, label: cat }));

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-slate-900">Symptoms</h3>
          <p className="text-sm text-muted-foreground">
            Manage symptoms for patient consultations and clinical notes
          </p>
        </div>
        <Button onClick={() => { setEditingItem(null); setShowDialog(true); }}>
          <Plus className="h-4 w-4 mr-1.5" />
          Add Symptom
        </Button>
      </div>

      <MasterDataTable
        data={symptoms}
        columns={columns}
        loading={loading}
        searchPlaceholder="Search by symptom name or description..."
        searchKeys={['name', 'description', 'category']}
        filterOptions={{
          key: 'category',
          label: 'Category',
          options: categoryOptions,
        }}
        statusFilter={{ key: 'is_active' }}
        getRowKey={(item) => item.id}
        emptyMessage="No symptoms found. Add your first symptom to get started."
      />

      <SymptomDialog
        open={showDialog}
        onOpenChange={setShowDialog}
        symptom={editingItem}
        onSave={handleSave}
        categories={[...SYMPTOM_CATEGORIES]}
      />
    </div>
  );
}
