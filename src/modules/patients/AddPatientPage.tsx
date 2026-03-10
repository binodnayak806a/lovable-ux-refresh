import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Printer } from 'lucide-react';
import { Button } from '../../components/ui/button';
import { Checkbox } from '../../components/ui/checkbox';
import { usePageTitle } from '../../hooks/usePageTitle';
import PatientRegistrationForm from '../opd/components/PatientRegistrationForm';
import PatientStickerPrint from './components/PatientStickerPrint';
import { format } from 'date-fns';

export default function AddPatientPage() {
  usePageTitle('Add Patient');
  const navigate = useNavigate();
  const [labelPrint, setLabelPrint] = useState(false);
  const [stickerPatient, setStickerPatient] = useState<{
    full_name: string;
    uhid: string;
    phone: string;
    age?: number;
    gender?: string;
    blood_group?: string | null;
    address?: string;
  } | null>(null);
  const [stickerSize, setStickerSize] = useState<'thermal' | 'a4'>('thermal');

  const handleSuccess = (patientId: string) => {
    if (labelPrint) {
      // We need patient info for the sticker — use a minimal placeholder
      // In a real app this would come from the registered patient data
      setStickerPatient({
        full_name: 'Patient',
        uhid: patientId,
        phone: '',
      });
    } else {
      navigate(`/patients?id=${patientId}`);
    }
  };

  return (
    <div className="flex flex-col h-full bg-background">
      {/* Header */}
      <div className="flex items-center justify-between px-4 md:px-6 py-3 border-b border-border bg-card">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={() => navigate('/patients')}>
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div>
            <h1 className="text-base font-bold text-foreground">Register New Patient</h1>
            <p className="text-[11px] text-muted-foreground">Fill in patient details to create a new record</p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-xs text-muted-foreground">
            Reg. Date: <span className="font-semibold text-foreground">{format(new Date(), 'dd/MM/yyyy')}</span>
          </span>
          <label className="flex items-center gap-2 cursor-pointer select-none">
            <Checkbox
              checked={labelPrint}
              onCheckedChange={(checked) => setLabelPrint(!!checked)}
            />
            <span className="text-sm font-medium text-foreground flex items-center gap-1.5">
              <Printer className="w-3.5 h-3.5" />
              Label Print
            </span>
          </label>
        </div>
      </div>

      {/* Form area — full page */}
      <div className="flex-1 overflow-y-auto">
        <PatientRegistrationForm
          onSuccess={handleSuccess}
          onCancel={() => navigate('/patients')}
        />
      </div>

      {/* Sticker Print Dialog */}
      {stickerPatient && (
        <PatientStickerPrint
          patient={stickerPatient}
          onClose={() => {
            setStickerPatient(null);
            navigate('/patients');
          }}
          stickerSize={stickerSize}
          onSizeChange={setStickerSize}
        />
      )}
    </div>
  );
}
