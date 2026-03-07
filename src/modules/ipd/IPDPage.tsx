import { BedDouble, Building2 } from 'lucide-react';
import { useAppSelector } from '../../store';
import { usePageTitle } from '../../hooks/usePageTitle';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../components/ui/tabs';
import BedAvailability from './components/BedAvailability';
import WardBoard from './components/WardBoard';

const SAMPLE_HOSPITAL_ID = '11111111-1111-1111-1111-111111111111';

export default function IPDPage() {
  usePageTitle('IPD');
  const { hospitalId } = useAppSelector((s) => s.auth);
  const effectiveHospitalId = hospitalId ?? SAMPLE_HOSPITAL_ID;

  return (
    <div className="space-y-6">
      <Tabs defaultValue="beds">
        <TabsList>
          <TabsTrigger value="beds" className="gap-2">
            <BedDouble className="w-4 h-4" />
            Bed Availability
          </TabsTrigger>
          <TabsTrigger value="ward-board" className="gap-2">
            <Building2 className="w-4 h-4" />
            Ward Board
          </TabsTrigger>
        </TabsList>
        <TabsContent value="beds" className="mt-4">
          <BedAvailability hospitalId={effectiveHospitalId} />
        </TabsContent>
        <TabsContent value="ward-board" className="mt-4">
          <WardBoard hospitalId={effectiveHospitalId} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
