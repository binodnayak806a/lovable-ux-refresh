import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { Button } from '../../components/ui/button';
import { usePageTitle } from '../../hooks/usePageTitle';
import PatientRegistrationForm from '../opd/components/PatientRegistrationForm';

export default function AddPatientPage() {
  usePageTitle('Add Patient');
  const navigate = useNavigate();

  return (
    <div className="flex flex-col h-full">
      {/* Compact header */}
      <div className="flex items-center gap-3 px-4 py-3 border-b border-border/40 bg-card/50">
        <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={() => navigate('/patients')}>
          <ArrowLeft className="w-4 h-4" />
        </Button>
        <div>
          <h1 className="text-base font-bold text-foreground">Register New Patient</h1>
          <p className="text-[11px] text-muted-foreground">Fill in patient details to create a new record</p>
        </div>
      </div>

      {/* Form area */}
      <div className="flex-1 overflow-y-auto p-4 md:p-6">
        <PatientRegistrationForm
          onSuccess={(patientId) => navigate(`/patients?id=${patientId}`)}
          onCancel={() => navigate('/patients')}
        />
      </div>
    </div>
  );
}
