import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { Button } from '../../components/ui/button';
import { usePageTitle } from '../../hooks/usePageTitle';
import PatientRegistrationForm from '../opd/components/PatientRegistrationForm';
import patientService from '../../services/patient.service';
import type { RegistrationFormData } from '../opd/types';

export default function EditPatientPage() {
  usePageTitle('Edit Patient');
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const patientId = searchParams.get('id') ?? '';

  const [loading, setLoading] = useState(true);
  const [initialData, setInitialData] = useState<Partial<RegistrationFormData> | null>(null);
  const [patientName, setPatientName] = useState('');

  useEffect(() => {
    if (!patientId) { navigate('/patients'); return; }

    async function load() {
      try {
        const p = await patientService.getPatientById(patientId);
        if (!p) { navigate('/patients'); return; }

        const nameParts = p.full_name.split(' ');
        const firstName = nameParts[0] || '';
        const middleName = nameParts.length > 2 ? nameParts.slice(1, -1).join(' ') : '';
        const lastName = nameParts.length > 1 ? nameParts[nameParts.length - 1] : '';

        let ageYears = '';
        if (p.date_of_birth) {
          const age = Math.floor((Date.now() - new Date(p.date_of_birth).getTime()) / (365.25 * 24 * 60 * 60 * 1000));
          ageYears = String(Math.max(0, age));
        }

        setPatientName(p.full_name);
        setInitialData({
          firstName,
          lastName,
          dateOfBirth: p.date_of_birth || '',
          ageYears,
          gender: p.gender || '',
          bloodGroup: p.blood_group || '',
          phone: p.phone || '',
          email: p.email || '',
          aadharNumber: p.aadhar_number || '',
          address: p.address || '',
          city: p.city || '',
          state: p.state || '',
          pincode: p.pincode || '',
          guardianName: p.emergency_contact_name || '',
          guardianPhone: p.emergency_contact_phone || '',
          guardianRelation: p.emergency_contact_relation || '',
          emergencyContactName: p.emergency_contact_name || '',
          emergencyContactPhone: p.emergency_contact_phone || '',
          referredBy: p.referred_by || '',
          billingCategory: p.billing_category || 'cash',
          insuranceCompany: p.insurance_provider || '',
          policyNumber: p.insurance_number || '',
        });
      } catch {
        navigate('/patients');
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [patientId, navigate]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  if (!initialData) return null;

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center gap-3 px-4 py-3 border-b border-border/40 bg-card/50">
        <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={() => navigate('/patients')}>
          <ArrowLeft className="w-4 h-4" />
        </Button>
        <div>
          <h1 className="text-base font-bold text-foreground">Edit Patient — {patientName}</h1>
          <p className="text-[11px] text-muted-foreground">Update patient details and save changes</p>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 md:p-6">
        <PatientRegistrationForm
          editPatientId={patientId}
          initialData={initialData}
          onSuccess={() => navigate(`/patients?id=${patientId}`)}
          onCancel={() => navigate('/patients')}
        />
      </div>
    </div>
  );
}
