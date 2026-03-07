import { useState, useEffect } from 'react';
import {
  X, Stethoscope, Receipt, BedDouble, History, Printer,
  Phone, Mail, MapPin, Shield,
} from 'lucide-react';
import { Button } from '../../../components/ui/button';
import { Skeleton } from '../../../components/ui/skeleton';
import { ScrollArea } from '../../../components/ui/scroll-area';
import patientService from '../../../services/patient.service';
import type { PatientDetail, CustomFieldConfig } from '../../../services/patient.service';
import AadhaarUpload from './AadhaarUpload';
import CustomFieldsRenderer from './CustomFieldsRenderer';

interface Props {
  patientId: string;
  hospitalId: string;
  onClose: () => void;
  onViewHistory: () => void;
  onPrintSticker: () => void;
  onConsult: () => void;
  onAdmit: () => void;
  onBill: () => void;
}

function formatDate(d: string | null): string {
  if (!d) return '-';
  return new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}

export default function PatientDetailSidebar({
  patientId, hospitalId, onClose,
  onViewHistory, onPrintSticker, onConsult, onAdmit, onBill,
}: Props) {
  const [patient, setPatient] = useState<PatientDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [customFields, setCustomFields] = useState<CustomFieldConfig[]>([]);
  const [customValues, setCustomValues] = useState<Record<string, unknown>>({});

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const [pt, fields] = await Promise.all([
          patientService.getPatientById(patientId),
          patientService.getCustomFieldsConfig(hospitalId),
        ]);
        setPatient(pt);
        setCustomFields(fields);
        setCustomValues(pt?.custom_field_values ?? {});
      } catch {
        // silent
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [patientId, hospitalId]);

  const handleCustomFieldChange = async (fieldId: string, value: unknown) => {
    const updated = { ...customValues, [fieldId]: value };
    setCustomValues(updated);
    try {
      await patientService.updatePatientCustomFields(patientId, updated);
    } catch {
      // silent
    }
  };

  if (loading) {
    return (
      <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-4 space-y-4">
        <Skeleton className="h-4 w-32" />
        <div className="flex items-center gap-3">
          <Skeleton className="w-12 h-12 rounded-full" />
          <div className="space-y-2">
            <Skeleton className="h-4 w-28" />
            <Skeleton className="h-3 w-20" />
          </div>
        </div>
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-10 w-full" />
        ))}
      </div>
    );
  }

  if (!patient) return null;

  const initials = patient.full_name.split(' ').slice(0, 2).map((n) => n[0]).join('').toUpperCase();

  return (
    <div className="bg-white border border-gray-200 rounded-xl shadow-sm sticky top-4 overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 bg-gradient-to-r from-gray-50 to-white">
        <h3 className="text-sm font-semibold text-gray-900">Patient Details</h3>
        <Button variant="ghost" size="sm" className="h-6 w-6 p-0 text-gray-400" onClick={onClose}>
          <X className="w-3.5 h-3.5" />
        </Button>
      </div>

      <ScrollArea className="max-h-[calc(100vh-12rem)]">
        <div className="p-4 space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-blue-600 flex items-center justify-center text-white font-bold text-lg shrink-0">
              {initials}
            </div>
            <div className="min-w-0">
              <p className="font-semibold text-gray-900 text-sm truncate">{patient.full_name}</p>
              <p className="text-xs text-gray-500 font-mono">{patient.uhid}</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 text-xs">
            {patient.age != null && (
              <InfoTile label="Age" value={`${patient.age} years`} />
            )}
            {patient.gender && (
              <InfoTile label="Gender" value={patient.gender} capitalize />
            )}
            {patient.blood_group && (
              <InfoTile label="Blood Group" value={patient.blood_group} className="text-red-600 font-semibold" />
            )}
            {patient.date_of_birth && (
              <InfoTile label="Date of Birth" value={formatDate(patient.date_of_birth)} />
            )}
          </div>

          <div className="space-y-1.5">
            {patient.phone && (
              <div className="flex items-center gap-2 text-xs text-gray-600">
                <Phone className="w-3 h-3 text-gray-400 shrink-0" />
                <span>{patient.phone}</span>
              </div>
            )}
            {patient.email && (
              <div className="flex items-center gap-2 text-xs text-gray-600">
                <Mail className="w-3 h-3 text-gray-400 shrink-0" />
                <span className="truncate">{patient.email}</span>
              </div>
            )}
            {(patient.address || patient.city) && (
              <div className="flex items-center gap-2 text-xs text-gray-600">
                <MapPin className="w-3 h-3 text-gray-400 shrink-0" />
                <span className="truncate">
                  {[patient.address, patient.city, patient.state].filter(Boolean).join(', ')}
                </span>
              </div>
            )}
            {patient.aadhar_number && (
              <div className="flex items-center gap-2 text-xs text-gray-600">
                <Shield className="w-3 h-3 text-gray-400 shrink-0" />
                <span>Aadhaar: ****{patient.aadhar_number.slice(-4)}</span>
              </div>
            )}
          </div>

          {patient.insurance_provider && (
            <div className="bg-blue-50 rounded-lg p-2.5 text-xs">
              <p className="text-blue-600 font-medium">Insurance</p>
              <p className="text-gray-700">{patient.insurance_provider}</p>
              {patient.insurance_number && (
                <p className="text-gray-500 text-[10px]">#{patient.insurance_number}</p>
              )}
            </div>
          )}

          <AadhaarUpload
            patientId={patientId}
            currentUrl={patient.aadhaar_url}
            onUploaded={() => {}}
          />

          {customFields.length > 0 && (
            <CustomFieldsRenderer
              fields={customFields}
              values={customValues}
              onChange={handleCustomFieldChange}
            />
          )}

          <div className="space-y-1.5 pt-1">
            <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide">Quick Actions</p>
            <ActionButton icon={Stethoscope} label="Start Consultation" color="teal" onClick={onConsult} />
            <ActionButton icon={Receipt} label="Generate Bill" color="emerald" onClick={onBill} />
            <ActionButton icon={BedDouble} label="Admit to IPD" color="amber" onClick={onAdmit} />
            <ActionButton icon={History} label="View History" color="sky" onClick={onViewHistory} />
            <ActionButton icon={Printer} label="Print Sticker" color="gray" onClick={onPrintSticker} />
          </div>
        </div>
      </ScrollArea>
    </div>
  );
}

function InfoTile({ label, value, capitalize, className }: {
  label: string;
  value: string;
  capitalize?: boolean;
  className?: string;
}) {
  return (
    <div className="bg-gray-50 rounded-lg p-2.5">
      <p className="text-gray-400 text-[10px] mb-0.5">{label}</p>
      <p className={`font-semibold text-gray-900 ${capitalize ? 'capitalize' : ''} ${className ?? ''}`}>
        {value}
      </p>
    </div>
  );
}

const ACTION_COLORS: Record<string, string> = {
  teal: 'bg-teal-50 hover:bg-teal-100 text-teal-700',
  emerald: 'bg-emerald-50 hover:bg-emerald-100 text-emerald-700',
  amber: 'bg-amber-50 hover:bg-amber-100 text-amber-700',
  sky: 'bg-sky-50 hover:bg-sky-100 text-sky-700',
  gray: 'bg-gray-50 hover:bg-gray-100 text-gray-700',
};

function ActionButton({
  icon: Icon, label, color, onClick,
}: {
  icon: React.ElementType;
  label: string;
  color: string;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${ACTION_COLORS[color]}`}
    >
      <Icon className="w-4 h-4 shrink-0" />
      {label}
    </button>
  );
}
