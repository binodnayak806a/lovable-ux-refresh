import { useState } from 'react';
import { Plus, Edit2, ToggleLeft, ToggleRight, IndianRupee, Phone, Mail, Award } from 'lucide-react';
import { Button } from '../../../components/ui/button';
import { Badge } from '../../../components/ui/badge';
import { toast } from 'sonner';
import MasterDataTable, { Column } from './MasterDataTable';
import ConsultantDialog from './ConsultantDialog';
import { masterDataService } from '../../../services/master-data.service';
import type { Consultant, ConsultantFormData } from '../types';
import { SPECIALTIES } from '../types';

interface ConsultantsTabProps {
  consultants: Consultant[];
  loading: boolean;
  hospitalId: string;
  onRefresh: () => void;
}

export default function ConsultantsTab({ consultants, loading, hospitalId, onRefresh }: ConsultantsTabProps) {
  const [showDialog, setShowDialog] = useState(false);
  const [editingItem, setEditingItem] = useState<Consultant | null>(null);

  const handleSave = async (data: ConsultantFormData) => {
    try {
      if (editingItem) {
        await masterDataService.updateConsultant(editingItem.id, data);
        toast.success('Consultant updated');
      } else {
        await masterDataService.createConsultant(hospitalId, data);
        toast.success('Consultant added');
      }
      setShowDialog(false);
      setEditingItem(null);
      onRefresh();
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to save consultant';
      toast.error(msg);
    }
  };

  const handleToggleStatus = async (item: Consultant) => {
    try {
      await masterDataService.updateConsultant(item.id, { is_active: !item.is_active });
      toast.success(item.is_active ? 'Consultant deactivated' : 'Consultant activated');
      onRefresh();
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to update status';
      toast.error(msg);
    }
  };

  const openEdit = (item: Consultant) => {
    setEditingItem(item);
    setShowDialog(true);
  };

  const columns: Column<Consultant>[] = [
    {
      key: 'name',
      label: 'Consultant',
      sortable: true,
      render: (item) => (
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-full bg-gradient-to-br from-blue-500 to-cyan-600 flex items-center justify-center text-white font-semibold text-sm">
            {item.first_name[0]}{item.last_name?.[0] || ''}
          </div>
          <div>
            <div className="font-medium text-slate-900">
              Dr. {item.first_name} {item.last_name}
            </div>
            {item.qualification && (
              <div className="text-xs text-slate-500">{item.qualification}</div>
            )}
          </div>
        </div>
      ),
    },
    {
      key: 'specialty',
      label: 'Specialty',
      sortable: true,
      render: (item) => (
        <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
          {item.specialty}
        </Badge>
      ),
    },
    {
      key: 'department',
      label: 'Department',
      sortable: true,
      render: (item) => (
        <span className="text-slate-600">{item.department || '-'}</span>
      ),
    },
    {
      key: 'contact',
      label: 'Contact',
      render: (item) => (
        <div className="space-y-0.5 text-sm">
          {item.phone && (
            <div className="flex items-center gap-1.5 text-slate-600">
              <Phone className="h-3 w-3" />
              {item.phone}
            </div>
          )}
          {item.email && (
            <div className="flex items-center gap-1.5 text-slate-600">
              <Mail className="h-3 w-3" />
              <span className="truncate max-w-32">{item.email}</span>
            </div>
          )}
          {!item.phone && !item.email && <span className="text-slate-400">-</span>}
        </div>
      ),
    },
    {
      key: 'registration_number',
      label: 'Reg. No.',
      render: (item) => item.registration_number ? (
        <div className="flex items-center gap-1.5 text-slate-600">
          <Award className="h-3.5 w-3.5" />
          <span className="font-mono text-xs">{item.registration_number}</span>
        </div>
      ) : <span className="text-slate-400">-</span>,
    },
    {
      key: 'consultation_fee',
      label: 'Cons. Fee',
      sortable: true,
      width: '100px',
      render: (item) => (
        <div className="flex items-center gap-1 font-medium text-slate-900">
          <IndianRupee className="h-3.5 w-3.5" />
          {item.consultation_fee.toLocaleString()}
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

  const specialtyOptions = SPECIALTIES.map(spec => ({ value: spec, label: spec }));

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-slate-900">Consultants / Doctors</h3>
          <p className="text-sm text-muted-foreground">
            Manage doctors, consultants, and their consultation fees
          </p>
        </div>
        <Button onClick={() => { setEditingItem(null); setShowDialog(true); }}>
          <Plus className="h-4 w-4 mr-1.5" />
          Add Consultant
        </Button>
      </div>

      <MasterDataTable
        data={consultants}
        columns={columns}
        loading={loading}
        searchPlaceholder="Search by name, specialty, or department..."
        searchKeys={['first_name', 'last_name', 'specialty', 'department']}
        filterOptions={{
          key: 'specialty',
          label: 'Specialty',
          options: specialtyOptions,
        }}
        statusFilter={{ key: 'is_active' }}
        getRowKey={(item) => item.id}
        emptyMessage="No consultants found. Add your first consultant to get started."
      />

      <ConsultantDialog
        open={showDialog}
        onOpenChange={setShowDialog}
        consultant={editingItem}
        onSave={handleSave}
        specialties={[...SPECIALTIES]}
      />
    </div>
  );
}
