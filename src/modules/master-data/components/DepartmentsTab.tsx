import { useState } from 'react';
import { Plus, Edit2, ToggleLeft, ToggleRight, Building2 } from 'lucide-react';
import { Button } from '../../../components/ui/button';
import { Badge } from '../../../components/ui/badge';
import { toast } from 'sonner';
import MasterDataTable, { Column } from './MasterDataTable';
import DepartmentDialog from './DepartmentDialog';
import { masterDataService } from '../../../services/master-data.service';
import type { Department, DepartmentFormData } from '../types';

interface DepartmentsTabProps {
  departments: Department[];
  loading: boolean;
  hospitalId: string;
  onRefresh: () => void;
}

export default function DepartmentsTab({ departments, loading, hospitalId, onRefresh }: DepartmentsTabProps) {
  const [showDialog, setShowDialog] = useState(false);
  const [editingItem, setEditingItem] = useState<Department | null>(null);

  const handleSave = async (data: DepartmentFormData) => {
    try {
      if (editingItem) {
        await masterDataService.updateDepartment(editingItem.id, data);
        toast.success('Department updated');
      } else {
        await masterDataService.createDepartment(hospitalId, data);
        toast.success('Department added');
      }
      setShowDialog(false);
      setEditingItem(null);
      onRefresh();
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to save department';
      toast.error(msg);
    }
  };

  const handleToggleStatus = async (item: Department) => {
    try {
      await masterDataService.updateDepartment(item.id, { is_active: !item.is_active });
      toast.success(item.is_active ? 'Department deactivated' : 'Department activated');
      onRefresh();
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to update status';
      toast.error(msg);
    }
  };

  const openEdit = (item: Department) => {
    setEditingItem(item);
    setShowDialog(true);
  };

  const columns: Column<Department>[] = [
    {
      key: 'name',
      label: 'Department Name',
      sortable: true,
      render: (item) => (
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-lg bg-gradient-to-br from-sky-400 to-blue-600 flex items-center justify-center">
            <Building2 className="h-4 w-4 text-white" />
          </div>
          <div>
            <div className="font-medium text-slate-900">{item.name}</div>
            {item.code && (
              <div className="text-xs text-slate-500">Code: {item.code}</div>
            )}
          </div>
        </div>
      ),
    },
    {
      key: 'head_doctor',
      label: 'Head Doctor',
      render: (item) => item.head_doctor ? (
        <span className="text-slate-600">
          Dr. {item.head_doctor.first_name} {item.head_doctor.last_name}
        </span>
      ) : <span className="text-slate-400">Not Assigned</span>,
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

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-slate-900">Departments</h3>
          <p className="text-sm text-muted-foreground">
            Manage hospital departments and organizational units
          </p>
        </div>
        <Button onClick={() => { setEditingItem(null); setShowDialog(true); }}>
          <Plus className="h-4 w-4 mr-1.5" />
          Add Department
        </Button>
      </div>

      <MasterDataTable
        data={departments}
        columns={columns}
        loading={loading}
        searchPlaceholder="Search by department name or code..."
        searchKeys={['name', 'code', 'description']}
        statusFilter={{ key: 'is_active' }}
        getRowKey={(item) => item.id}
        emptyMessage="No departments found. Add your first department to get started."
      />

      <DepartmentDialog
        open={showDialog}
        onOpenChange={setShowDialog}
        department={editingItem}
        onSave={handleSave}
      />
    </div>
  );
}
