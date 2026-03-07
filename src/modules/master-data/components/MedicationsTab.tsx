import { useState } from 'react';
import { Plus, Edit2, ToggleLeft, ToggleRight } from 'lucide-react';
import { Button } from '../../../components/ui/button';
import { Badge } from '../../../components/ui/badge';
import { toast } from 'sonner';
import MasterDataTable, { Column } from './MasterDataTable';
import MedicationDialog from './MedicationDialog';
import { masterDataService } from '../../../services/master-data.service';
import type { Medication, MedicationFormData } from '../types';
import { MEDICATION_CATEGORIES, DOSAGE_FORMS } from '../types';

interface MedicationsTabProps {
  medications: Medication[];
  loading: boolean;
  hospitalId: string;
  onRefresh: () => void;
}

export default function MedicationsTab({ medications, loading, hospitalId, onRefresh }: MedicationsTabProps) {
  const [showDialog, setShowDialog] = useState(false);
  const [editingItem, setEditingItem] = useState<Medication | null>(null);

  const handleSave = async (data: MedicationFormData) => {
    try {
      if (editingItem) {
        await masterDataService.updateMedication(editingItem.id, data);
        toast.success('Medication updated');
      } else {
        await masterDataService.createMedication(hospitalId, data);
        toast.success('Medication added');
      }
      setShowDialog(false);
      setEditingItem(null);
      onRefresh();
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to save medication';
      toast.error(msg);
    }
  };

  const handleToggleStatus = async (item: Medication) => {
    try {
      await masterDataService.updateMedication(item.id, { is_active: !item.is_active });
      toast.success(item.is_active ? 'Medication deactivated' : 'Medication activated');
      onRefresh();
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to update status';
      toast.error(msg);
    }
  };

  const openEdit = (item: Medication) => {
    setEditingItem(item);
    setShowDialog(true);
  };

  const columns: Column<Medication>[] = [
    {
      key: 'generic_name',
      label: 'Generic Name',
      sortable: true,
      render: (item) => (
        <div className="font-medium text-slate-900">{item.generic_name}</div>
      ),
    },
    {
      key: 'brand_name',
      label: 'Brand Name',
      sortable: true,
      render: (item) => (
        <span className="text-slate-600">{item.brand_name || '-'}</span>
      ),
    },
    {
      key: 'category',
      label: 'Category',
      sortable: true,
      render: (item) => (
        <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
          {item.category}
        </Badge>
      ),
    },
    {
      key: 'dosage_form',
      label: 'Form',
      sortable: true,
    },
    {
      key: 'strength',
      label: 'Strength',
      render: (item) => (
        <span>{item.strength ? `${item.strength} ${item.unit}` : '-'}</span>
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

  const categoryOptions = MEDICATION_CATEGORIES.map(cat => ({ value: cat, label: cat }));

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-slate-900">Medications</h3>
          <p className="text-sm text-muted-foreground">
            Manage medications, drugs, and pharmaceutical items
          </p>
        </div>
        <Button onClick={() => { setEditingItem(null); setShowDialog(true); }}>
          <Plus className="h-4 w-4 mr-1.5" />
          Add Medication
        </Button>
      </div>

      <MasterDataTable
        data={medications}
        columns={columns}
        loading={loading}
        searchPlaceholder="Search by name, brand, or category..."
        searchKeys={['generic_name', 'brand_name', 'category']}
        filterOptions={{
          key: 'category',
          label: 'Category',
          options: categoryOptions,
        }}
        statusFilter={{ key: 'is_active' }}
        getRowKey={(item) => item.id}
        emptyMessage="No medications found. Add your first medication to get started."
      />

      <MedicationDialog
        open={showDialog}
        onOpenChange={setShowDialog}
        medication={editingItem}
        onSave={handleSave}
        categories={[...MEDICATION_CATEGORIES]}
        dosageForms={[...DOSAGE_FORMS]}
      />
    </div>
  );
}
