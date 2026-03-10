import { useState } from 'react';
import {
  X, User, Calendar, Stethoscope, BedDouble, ClipboardList,
  Activity, FileText, Clock, CreditCard, LogOut, NotebookPen, Tag, Printer,
} from 'lucide-react';
import { Card } from '../../../components/ui/card';
import { Button } from '../../../components/ui/button';
import NursingTasksTab from './NursingTasksTab';
import IpdVitalsTab from './IpdVitalsTab';
import NursingNotesTab from './NursingNotesTab';
import DoctorRoundsTab from './DoctorRoundsTab';
import RunningBillTab from './RunningBillTab';
import DailyNotesTab from './DailyNotesTab';
import DischargeDialog from './DischargeDialog';
import DischargeSummaryView from './DischargeSummaryView';
import IpdStickerPrint from './IpdStickerPrint';
import type { Admission } from '../types';
import { format, differenceInDays } from 'date-fns';

type DetailTab = 'tasks' | 'vitals' | 'notes' | 'rounds' | 'daily' | 'billing';

interface Props {
  admission: Admission;
  onUpdate: () => void;
  onClose: () => void;
}

function calculateAge(dob: string | null): string {
  if (!dob) return '-';
  const birth = new Date(dob);
  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  const m = today.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
  return `${age}Y`;
}

export default function PatientDetailPanel({ admission, onUpdate, onClose }: Props) {
  const [activeTab, setActiveTab] = useState<DetailTab>('tasks');
  const [showDischarge, setShowDischarge] = useState(false);
  const [showDischargeSummary, setShowDischargeSummary] = useState(false);
  const [showLabel, setShowLabel] = useState(false);

  const daysAdmitted = differenceInDays(new Date(), new Date(admission.admission_date));

  const tabs: Array<{ id: DetailTab; label: string; icon: React.ElementType }> = [
    { id: 'tasks', label: 'Tasks', icon: ClipboardList },
    { id: 'vitals', label: 'Vitals', icon: Activity },
    { id: 'notes', label: 'Notes', icon: FileText },
    { id: 'daily', label: 'Daily', icon: NotebookPen },
    { id: 'rounds', label: 'Rounds', icon: Stethoscope },
    { id: 'billing', label: 'Billing', icon: CreditCard },
  ];

  return (
    <Card className="border border-gray-100 shadow-sm h-full flex flex-col overflow-hidden">
      <div className="px-4 py-3 border-b border-gray-100 bg-gradient-to-r from-blue-50 to-white">
        <div className="flex items-start justify-between">
          <div>
            <h3 className="font-semibold text-gray-800 flex items-center gap-2">
              <User className="w-4 h-4 text-blue-500" />
              {admission.patient?.full_name}
            </h3>
            <div className="text-xs text-gray-500 mt-1">
              {admission.patient?.uhid} | {calculateAge(admission.patient?.date_of_birth ?? null)} |{' '}
              {admission.patient?.gender}
              {admission.patient?.blood_group && ` | ${admission.patient.blood_group}`}
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-4 h-4 text-gray-400" />
          </button>
        </div>
      </div>

      <div className="px-4 py-3 bg-gray-50 border-b border-gray-100">
        <div className="grid grid-cols-2 gap-3 text-xs">
          <div className="flex items-center gap-2">
            <BedDouble className="w-3.5 h-3.5 text-gray-400" />
            <span className="text-gray-500">Bed:</span>
            <span className="font-medium">{admission.bed?.bed_number}</span>
          </div>
          <div className="flex items-center gap-2">
            <Calendar className="w-3.5 h-3.5 text-gray-400" />
            <span className="text-gray-500">Days:</span>
            <span className="font-medium">{daysAdmitted}</span>
          </div>
          <div className="flex items-center gap-2">
            <Stethoscope className="w-3.5 h-3.5 text-gray-400" />
            <span className="text-gray-500">Doctor:</span>
            <span className="font-medium truncate">Dr. {admission.doctor?.full_name?.split(' ')[0]}</span>
          </div>
          <div className="flex items-center gap-2">
            <Clock className="w-3.5 h-3.5 text-gray-400" />
            <span className="text-gray-500">Adm:</span>
            <span className="font-medium">{format(new Date(admission.admission_date), 'dd MMM')}</span>
          </div>
        </div>

        {admission.primary_diagnosis && (
          <div className="mt-2 pt-2 border-t border-gray-200">
            <div className="text-[10px] text-gray-500 uppercase tracking-wide mb-1">Diagnosis</div>
            <div className="text-xs text-gray-700 line-clamp-2">{admission.primary_diagnosis}</div>
          </div>
        )}

        <div className="mt-3 flex gap-2">
          <Button
            size="sm"
            onClick={() => setShowDischarge(true)}
            className="flex-1 gap-1.5 h-8 text-xs bg-emerald-600 hover:bg-emerald-700"
          >
            <LogOut className="w-3.5 h-3.5" />
            Discharge
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => setShowDischargeSummary(true)}
            className="h-8 text-xs gap-1"
          >
            <Printer className="w-3.5 h-3.5" />
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => setShowLabel(true)}
            className="h-8 text-xs gap-1"
          >
            <Tag className="w-3.5 h-3.5" />
          </Button>
        </div>
      </div>

      <div className="flex border-b border-gray-100 overflow-x-auto">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 py-2.5 text-xs font-medium flex items-center justify-center gap-1 transition-colors whitespace-nowrap ${
                isActive
                  ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50/50'
                  : 'text-gray-500 hover:bg-gray-50'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              {tab.label}
            </button>
          );
        })}
      </div>

      <div className="flex-1 overflow-y-auto">
        {activeTab === 'tasks' && <NursingTasksTab admission={admission} onUpdate={onUpdate} />}
        {activeTab === 'vitals' && <IpdVitalsTab admission={admission} />}
        {activeTab === 'notes' && <NursingNotesTab admission={admission} />}
        {activeTab === 'daily' && <DailyNotesTab admission={admission} />}
        {activeTab === 'rounds' && <DoctorRoundsTab admission={admission} />}
        {activeTab === 'billing' && <RunningBillTab admission={admission} onUpdate={onUpdate} />}
      </div>

      {showDischarge && (
        <DischargeDialog
          admission={admission}
          onClose={() => setShowDischarge(false)}
          onSuccess={() => { setShowDischarge(false); onUpdate(); onClose(); }}
        />
      )}

      {showDischargeSummary && (
        <DischargeSummaryView
          admission={admission}
          onClose={() => setShowDischargeSummary(false)}
        />
      )}

      {showLabel && (
        <IpdLabelPrint
          admission={admission}
          onClose={() => setShowLabel(false)}
        />
      )}
    </Card>
  );
}
