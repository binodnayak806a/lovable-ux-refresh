import { useState, useEffect } from 'react';
import {
  Database,
  Pill,
  Stethoscope,
  FileText,
  FlaskConical,
  Receipt,
  Building2,
  BedDouble,
  UserCog,
  UserRound,
} from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../components/ui/tabs';
import { useAuth } from '../../hooks/useAuth';
import { masterDataService } from '../../services/master-data.service';
import { toast } from 'sonner';
import MedicationsTab from './components/MedicationsTab';
import SymptomsTab from './components/SymptomsTab';
import DiagnosesTab from './components/DiagnosesTab';
import InvestigationsTab from './components/InvestigationsTab';
import ServiceItemsTab from './components/ServiceItemsTab';
import DepartmentsTab from './components/DepartmentsTab';
import WardsTab from './components/WardsTab';
import ConsultantsTab from './components/ConsultantsTab';
import DoctorsTab from './components/DoctorsTab';
import type {
  Medication,
  Symptom,
  Diagnosis,
  Investigation,
  ServiceItem,
  Department,
  Ward,
  Consultant,
} from './types';

const SAMPLE_HOSPITAL_ID = '11111111-1111-1111-1111-111111111111';

const TAB_ITEMS = [
  { id: 'doctors', label: 'Doctors', icon: UserRound },
  { id: 'medications', label: 'Medications', icon: Pill },
  { id: 'symptoms', label: 'Symptoms', icon: Stethoscope },
  { id: 'diagnoses', label: 'Diagnoses', icon: FileText },
  { id: 'investigations', label: 'Investigations', icon: FlaskConical },
  { id: 'services', label: 'Service Items', icon: Receipt },
  { id: 'departments', label: 'Departments', icon: Building2 },
  { id: 'wards', label: 'Wards', icon: BedDouble },
  { id: 'consultants', label: 'Staff', icon: UserCog },
];

export default function MasterDataPage() {
  const { hospitalId } = useAuth();
  const effectiveHospitalId = hospitalId ?? SAMPLE_HOSPITAL_ID;
  const [activeTab, setActiveTab] = useState('doctors');

  const [medications, setMedications] = useState<Medication[]>([]);
  const [symptoms, setSymptoms] = useState<Symptom[]>([]);
  const [diagnoses, setDiagnoses] = useState<Diagnosis[]>([]);
  const [investigations, setInvestigations] = useState<Investigation[]>([]);
  const [serviceItems, setServiceItems] = useState<ServiceItem[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [wards, setWards] = useState<Ward[]>([]);
  const [consultants, setConsultants] = useState<Consultant[]>([]);
  const [loading, setLoading] = useState(true);

  const loadData = async (tab: string) => {
    try {
      setLoading(true);
      switch (tab) {
        case 'medications':
          setMedications(await masterDataService.getMedications(effectiveHospitalId));
          break;
        case 'symptoms':
          setSymptoms(await masterDataService.getSymptoms(effectiveHospitalId));
          break;
        case 'diagnoses':
          setDiagnoses(await masterDataService.getDiagnoses(effectiveHospitalId));
          break;
        case 'investigations':
          setInvestigations(await masterDataService.getInvestigations(effectiveHospitalId));
          break;
        case 'services':
          setServiceItems(await masterDataService.getServiceItems(effectiveHospitalId));
          break;
        case 'departments':
          setDepartments(await masterDataService.getDepartments(effectiveHospitalId));
          break;
        case 'wards':
          setWards(await masterDataService.getWards(effectiveHospitalId));
          break;
        case 'consultants':
          setConsultants(await masterDataService.getConsultants(effectiveHospitalId));
          break;
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to load data';
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData(activeTab);
  }, [activeTab, effectiveHospitalId]);

  const handleTabChange = (value: string) => {
    setActiveTab(value);
  };

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center gap-3">
        <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-teal-500 to-emerald-600 flex items-center justify-center">
          <Database className="h-5 w-5 text-white" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Master Data Management</h1>
          <p className="text-muted-foreground text-sm">
            Configure medications, symptoms, diagnoses, services, and other reference data
          </p>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <Tabs value={activeTab} onValueChange={handleTabChange}>
          <div className="border-b border-slate-200 px-4 pt-4 overflow-x-auto">
            <TabsList className="bg-transparent p-0 h-auto gap-1 flex-wrap">
              {TAB_ITEMS.map(tab => (
                <TabsTrigger
                  key={tab.id}
                  value={tab.id}
                  className="flex items-center gap-2 px-3 py-2 rounded-lg data-[state=active]:bg-teal-50 data-[state=active]:text-teal-700 text-slate-600 font-medium text-sm whitespace-nowrap"
                >
                  <tab.icon className="h-4 w-4" />
                  {tab.label}
                </TabsTrigger>
              ))}
            </TabsList>
          </div>

          <div className="p-6">
            <TabsContent value="doctors" className="mt-0">
              <DoctorsTab hospitalId={effectiveHospitalId} />
            </TabsContent>
            <TabsContent value="medications" className="mt-0">
              <MedicationsTab
                medications={medications}
                loading={loading}
                hospitalId={effectiveHospitalId}
                onRefresh={() => loadData('medications')}
              />
            </TabsContent>
            <TabsContent value="symptoms" className="mt-0">
              <SymptomsTab
                symptoms={symptoms}
                loading={loading}
                hospitalId={effectiveHospitalId}
                onRefresh={() => loadData('symptoms')}
              />
            </TabsContent>
            <TabsContent value="diagnoses" className="mt-0">
              <DiagnosesTab
                diagnoses={diagnoses}
                loading={loading}
                hospitalId={effectiveHospitalId}
                onRefresh={() => loadData('diagnoses')}
              />
            </TabsContent>
            <TabsContent value="investigations" className="mt-0">
              <InvestigationsTab
                investigations={investigations}
                loading={loading}
                hospitalId={effectiveHospitalId}
                onRefresh={() => loadData('investigations')}
              />
            </TabsContent>
            <TabsContent value="services" className="mt-0">
              <ServiceItemsTab
                serviceItems={serviceItems}
                loading={loading}
                hospitalId={effectiveHospitalId}
                onRefresh={() => loadData('services')}
              />
            </TabsContent>
            <TabsContent value="departments" className="mt-0">
              <DepartmentsTab
                departments={departments}
                loading={loading}
                hospitalId={effectiveHospitalId}
                onRefresh={() => loadData('departments')}
              />
            </TabsContent>
            <TabsContent value="wards" className="mt-0">
              <WardsTab
                wards={wards}
                loading={loading}
                hospitalId={effectiveHospitalId}
                onRefresh={() => loadData('wards')}
              />
            </TabsContent>
            <TabsContent value="consultants" className="mt-0">
              <ConsultantsTab
                consultants={consultants}
                loading={loading}
                hospitalId={effectiveHospitalId}
                onRefresh={() => loadData('consultants')}
              />
            </TabsContent>
          </div>
        </Tabs>
      </div>
    </div>
  );
}
