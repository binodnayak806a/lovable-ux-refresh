import { useState } from 'react';
import { Plus, Edit2, ToggleLeft, ToggleRight, IndianRupee, Percent } from 'lucide-react';
import { Button } from '../../../components/ui/button';
import { Badge } from '../../../components/ui/badge';
import { toast } from 'sonner';
import MasterDataTable, { Column } from './MasterDataTable';
import ServiceItemDialog from './ServiceItemDialog';
import { masterDataService } from '../../../services/master-data.service';
import type { ServiceItem, ServiceItemFormData } from '../types';
import { SERVICE_CATEGORIES } from '../types';

interface ServiceItemsTabProps {
  serviceItems: ServiceItem[];
  loading: boolean;
  hospitalId: string;
  onRefresh: () => void;
}

export default function ServiceItemsTab({ serviceItems, loading, hospitalId, onRefresh }: ServiceItemsTabProps) {
  const [showDialog, setShowDialog] = useState(false);
  const [editingItem, setEditingItem] = useState<ServiceItem | null>(null);

  const handleSave = async (data: ServiceItemFormData) => {
    try {
      if (editingItem) {
        await masterDataService.updateServiceItem(editingItem.id, data);
        toast.success('Service item updated');
      } else {
        await masterDataService.createServiceItem(hospitalId, data);
        toast.success('Service item added');
      }
      setShowDialog(false);
      setEditingItem(null);
      onRefresh();
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to save service item';
      toast.error(msg);
    }
  };

  const handleToggleStatus = async (item: ServiceItem) => {
    try {
      await masterDataService.updateServiceItem(item.id, { is_active: !item.is_active });
      toast.success(item.is_active ? 'Service item deactivated' : 'Service item activated');
      onRefresh();
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to update status';
      toast.error(msg);
    }
  };

  const openEdit = (item: ServiceItem) => {
    setEditingItem(item);
    setShowDialog(true);
  };

  const columns: Column<ServiceItem>[] = [
    {
      key: 'name',
      label: 'Service Name',
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
        <Badge variant="outline" className="bg-violet-50 text-violet-700 border-violet-200">
          {item.category}
        </Badge>
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
      key: 'rate',
      label: 'Rate',
      sortable: true,
      width: '120px',
      render: (item) => (
        <div className="flex items-center gap-1 font-medium text-slate-900">
          <IndianRupee className="h-3.5 w-3.5" />
          {item.rate.toLocaleString()}
        </div>
      ),
    },
    {
      key: 'tax_percentage',
      label: 'Tax',
      width: '80px',
      render: (item) => (
        <div className="flex items-center gap-1 text-slate-600">
          <Percent className="h-3.5 w-3.5" />
          <span>{item.tax_percentage}</span>
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

  const categoryOptions = SERVICE_CATEGORIES.map(cat => ({ value: cat, label: cat }));

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-slate-900">Service Items</h3>
          <p className="text-sm text-muted-foreground">
            Manage billable services, procedures, and charges
          </p>
        </div>
        <Button onClick={() => { setEditingItem(null); setShowDialog(true); }}>
          <Plus className="h-4 w-4 mr-1.5" />
          Add Service
        </Button>
      </div>

      <MasterDataTable
        data={serviceItems}
        columns={columns}
        loading={loading}
        searchPlaceholder="Search by service name, code, or category..."
        searchKeys={['name', 'code', 'category', 'description']}
        filterOptions={{
          key: 'category',
          label: 'Category',
          options: categoryOptions,
        }}
        statusFilter={{ key: 'is_active' }}
        getRowKey={(item) => item.id}
        emptyMessage="No service items found. Add your first service to get started."
      />

      <ServiceItemDialog
        open={showDialog}
        onOpenChange={setShowDialog}
        serviceItem={editingItem}
        onSave={handleSave}
        categories={[...SERVICE_CATEGORIES]}
      />
    </div>
  );
}
