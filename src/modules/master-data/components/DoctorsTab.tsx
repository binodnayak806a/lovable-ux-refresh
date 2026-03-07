import { useState, useEffect } from 'react';
import {
  Plus, Edit2, ToggleLeft, ToggleRight, IndianRupee, Phone, Mail,
  Award, Stethoscope, Clock, Calendar, User, Building2, ChevronRight,
} from 'lucide-react';
import { Button } from '../../../components/ui/button';
import { Badge } from '../../../components/ui/badge';
import { Card, CardContent } from '../../../components/ui/card';
import { Skeleton } from '../../../components/ui/skeleton';
import { toast } from 'sonner';
import MasterDataTable, { Column } from './MasterDataTable';
import DoctorDialog from './DoctorDialog';
import DoctorFeesDialog from './DoctorFeesDialog';
import { doctorsService, Doctor, DoctorFormData } from '../../../services/doctors.service';
import { masterDataService } from '../../../services/master-data.service';
import { SPECIALTIES } from '../types';
import type { Department } from '../types';

interface DoctorsTabProps {
  hospitalId: string;
}

export default function DoctorsTab({ hospitalId }: DoctorsTabProps) {
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  const [showDialog, setShowDialog] = useState(false);
  const [showFeesDialog, setShowFeesDialog] = useState(false);
  const [editingDoctor, setEditingDoctor] = useState<Doctor | null>(null);
  const [selectedDoctor, setSelectedDoctor] = useState<Doctor | null>(null);

  const loadData = async () => {
    setLoading(true);
    try {
      const [doctorsData, deptData] = await Promise.all([
        doctorsService.getDoctors(hospitalId),
        masterDataService.getDepartments(hospitalId),
      ]);
      setDoctors(doctorsData);
      setDepartments(deptData);
    } catch {
      toast.error('Failed to load doctors');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [hospitalId]);

  const handleSave = async (data: DoctorFormData) => {
    try {
      if (editingDoctor) {
        await doctorsService.updateDoctor(editingDoctor.id, data);
        toast.success('Doctor updated successfully');
      } else {
        await doctorsService.createDoctor(hospitalId, data);
        toast.success('Doctor added successfully');
      }
      setShowDialog(false);
      setEditingDoctor(null);
      loadData();
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to save doctor';
      toast.error(msg);
    }
  };

  const handleToggleStatus = async (doctor: Doctor) => {
    try {
      await doctorsService.updateDoctor(doctor.id, { is_active: !doctor.is_active });
      toast.success(doctor.is_active ? 'Doctor deactivated' : 'Doctor activated');
      loadData();
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to update status';
      toast.error(msg);
    }
  };

  const openEdit = (doctor: Doctor) => {
    setEditingDoctor(doctor);
    setShowDialog(true);
  };

  const openFees = (doctor: Doctor) => {
    setSelectedDoctor(doctor);
    setShowFeesDialog(true);
  };

  const getConsultationFee = (doctor: Doctor): number => {
    const fee = doctor.fees?.find(f => f.fee_type === 'consultation' && f.is_active);
    return fee?.amount || 0;
  };

  const columns: Column<Doctor>[] = [
    {
      key: 'name',
      label: 'Doctor',
      sortable: true,
      render: (doctor) => (
        <div className="flex items-center gap-3">
          <div className="h-11 w-11 rounded-full bg-gradient-to-br from-teal-500 to-emerald-600 flex items-center justify-center text-white font-semibold text-sm shadow-sm">
            {doctor.first_name[0]}{doctor.last_name?.[0] || ''}
          </div>
          <div>
            <div className="font-semibold text-gray-900">
              Dr. {doctor.first_name} {doctor.last_name}
            </div>
            <div className="flex items-center gap-2 text-xs text-gray-500">
              <span className="font-mono">{doctor.employee_id}</span>
              {doctor.qualification && (
                <>
                  <span className="text-gray-300">|</span>
                  <span>{doctor.qualification}</span>
                </>
              )}
            </div>
          </div>
        </div>
      ),
    },
    {
      key: 'specialty',
      label: 'Specialty',
      sortable: true,
      render: (doctor) => (
        <div className="space-y-1">
          <Badge variant="outline" className="bg-teal-50 text-teal-700 border-teal-200 font-medium">
            {doctor.specialty}
          </Badge>
          {doctor.sub_specialty && (
            <p className="text-xs text-gray-500">{doctor.sub_specialty}</p>
          )}
        </div>
      ),
    },
    {
      key: 'department',
      label: 'Department',
      sortable: true,
      render: (doctor) => (
        <div className="flex items-center gap-1.5 text-gray-600">
          <Building2 className="h-3.5 w-3.5 text-gray-400" />
          <span>{doctor.department?.name || '-'}</span>
        </div>
      ),
    },
    {
      key: 'contact',
      label: 'Contact',
      render: (doctor) => (
        <div className="space-y-1 text-sm">
          {doctor.phone && (
            <div className="flex items-center gap-1.5 text-gray-600">
              <Phone className="h-3.5 w-3.5 text-gray-400" />
              {doctor.phone}
            </div>
          )}
          {doctor.email && (
            <div className="flex items-center gap-1.5 text-gray-600">
              <Mail className="h-3.5 w-3.5 text-gray-400" />
              <span className="truncate max-w-36">{doctor.email}</span>
            </div>
          )}
          {!doctor.phone && !doctor.email && <span className="text-gray-400">-</span>}
        </div>
      ),
    },
    {
      key: 'registration',
      label: 'Registration',
      render: (doctor) => doctor.registration_number ? (
        <div className="space-y-1">
          <div className="flex items-center gap-1.5 text-gray-700">
            <Award className="h-3.5 w-3.5 text-amber-500" />
            <span className="font-mono text-xs">{doctor.registration_number}</span>
          </div>
          {doctor.registration_council && (
            <p className="text-xs text-gray-500">{doctor.registration_council}</p>
          )}
        </div>
      ) : <span className="text-gray-400">-</span>,
    },
    {
      key: 'fees',
      label: 'Consultation Fee',
      sortable: true,
      width: '140px',
      render: (doctor) => {
        const consultFee = getConsultationFee(doctor);
        const feeCount = doctor.fees?.filter(f => f.is_active).length || 0;
        return (
          <button
            onClick={(e) => { e.stopPropagation(); openFees(doctor); }}
            className="group flex flex-col items-start gap-0.5 hover:bg-gray-50 px-2 py-1 rounded-lg transition-colors"
          >
            <div className="flex items-center gap-1 font-semibold text-gray-900">
              <IndianRupee className="h-3.5 w-3.5" />
              {consultFee.toLocaleString()}
            </div>
            <span className="text-xs text-gray-500 group-hover:text-teal-600 flex items-center gap-1">
              {feeCount} fee types
              <ChevronRight className="h-3 w-3" />
            </span>
          </button>
        );
      },
    },
    {
      key: 'availability',
      label: 'Availability',
      width: '120px',
      render: (doctor) => (
        <div className="flex flex-wrap gap-1">
          {doctor.is_available_for_opd && (
            <Badge variant="secondary" className="text-[10px] px-1.5 py-0 bg-blue-50 text-blue-600 border-0">OPD</Badge>
          )}
          {doctor.is_available_for_ipd && (
            <Badge variant="secondary" className="text-[10px] px-1.5 py-0 bg-green-50 text-green-600 border-0">IPD</Badge>
          )}
          {doctor.is_available_for_emergency && (
            <Badge variant="secondary" className="text-[10px] px-1.5 py-0 bg-red-50 text-red-600 border-0">Emergency</Badge>
          )}
        </div>
      ),
    },
    {
      key: 'is_active',
      label: 'Status',
      width: '90px',
      render: (doctor) => (
        <Badge
          variant="outline"
          className={doctor.is_active
            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
            : 'bg-gray-100 text-gray-500 border-gray-200'
          }
        >
          {doctor.is_active ? 'Active' : 'Inactive'}
        </Badge>
      ),
    },
    {
      key: 'actions',
      label: 'Actions',
      width: '100px',
      render: (doctor) => (
        <div className="flex items-center gap-1">
          <Button
            size="sm"
            variant="ghost"
            className="h-8 w-8 p-0"
            onClick={(e) => { e.stopPropagation(); openEdit(doctor); }}
            title="Edit Doctor"
          >
            <Edit2 className="h-4 w-4" />
          </Button>
          <Button
            size="sm"
            variant="ghost"
            className="h-8 w-8 p-0"
            onClick={(e) => { e.stopPropagation(); handleToggleStatus(doctor); }}
            title={doctor.is_active ? 'Deactivate' : 'Activate'}
          >
            {doctor.is_active ? (
              <ToggleRight className="h-4 w-4 text-emerald-600" />
            ) : (
              <ToggleLeft className="h-4 w-4 text-gray-400" />
            )}
          </Button>
        </div>
      ),
    },
  ];

  const specialtyOptions = SPECIALTIES.map(spec => ({ value: spec, label: spec }));

  const activeCount = doctors.filter(d => d.is_active).length;
  const opdCount = doctors.filter(d => d.is_available_for_opd && d.is_active).length;
  const emergencyCount = doctors.filter(d => d.is_available_for_emergency && d.is_active).length;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <Stethoscope className="h-5 w-5 text-teal-600" />
            Doctor Master
          </h3>
          <p className="text-sm text-gray-500 mt-0.5">
            Manage doctors, their specializations, and consultation fees
          </p>
        </div>
        <Button onClick={() => { setEditingDoctor(null); setShowDialog(true); }} className="gap-1.5">
          <Plus className="h-4 w-4" />
          Add Doctor
        </Button>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Card className="border-gray-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-500 font-medium">Total Doctors</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">{doctors.length}</p>
              </div>
              <div className="h-10 w-10 rounded-lg bg-teal-50 flex items-center justify-center">
                <User className="h-5 w-5 text-teal-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-gray-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-500 font-medium">Active Doctors</p>
                <p className="text-2xl font-bold text-emerald-600 mt-1">{activeCount}</p>
              </div>
              <div className="h-10 w-10 rounded-lg bg-emerald-50 flex items-center justify-center">
                <Stethoscope className="h-5 w-5 text-emerald-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-gray-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-500 font-medium">OPD Available</p>
                <p className="text-2xl font-bold text-blue-600 mt-1">{opdCount}</p>
              </div>
              <div className="h-10 w-10 rounded-lg bg-blue-50 flex items-center justify-center">
                <Clock className="h-5 w-5 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-gray-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-500 font-medium">Emergency</p>
                <p className="text-2xl font-bold text-red-600 mt-1">{emergencyCount}</p>
              </div>
              <div className="h-10 w-10 rounded-lg bg-red-50 flex items-center justify-center">
                <Calendar className="h-5 w-5 text-red-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {loading ? (
        <Card>
          <CardContent className="p-6">
            <div className="space-y-4">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="flex items-center gap-4">
                  <Skeleton className="h-11 w-11 rounded-full" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-48" />
                    <Skeleton className="h-3 w-32" />
                  </div>
                  <Skeleton className="h-6 w-24" />
                  <Skeleton className="h-6 w-20" />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      ) : (
        <MasterDataTable
          data={doctors}
          columns={columns}
          loading={loading}
          searchPlaceholder="Search by name, specialty, or department..."
          searchKeys={['first_name', 'last_name', 'specialty', 'employee_id']}
          filterOptions={{
            key: 'specialty',
            label: 'Specialty',
            options: specialtyOptions,
          }}
          statusFilter={{ key: 'is_active' }}
          getRowKey={(doctor) => doctor.id}
          emptyMessage="No doctors found. Add your first doctor to get started."
        />
      )}

      <DoctorDialog
        open={showDialog}
        onOpenChange={setShowDialog}
        doctor={editingDoctor}
        onSave={handleSave}
        departments={departments}
        specialties={[...SPECIALTIES]}
      />

      {selectedDoctor && (
        <DoctorFeesDialog
          open={showFeesDialog}
          onOpenChange={setShowFeesDialog}
          doctor={selectedDoctor}
          onUpdate={loadData}
        />
      )}
    </div>
  );
}
