import { useState, useEffect, useCallback } from 'react';
import { BedDouble, Building2, Receipt, Printer } from 'lucide-react';
import { useAppSelector } from '../../store';
import { usePageTitle } from '../../hooks/usePageTitle';
import PageHeader from '../../components/shared/PageHeader';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../components/ui/tabs';
import { Button } from '../../components/ui/button';
import BedAvailability from './components/BedAvailability';
import WardBoard from './components/WardBoard';
import IpdBillingTab from './components/IpdBillingTab';
import IpdBulkStickerPrint from './components/IpdBulkStickerPrint';
import ipdService from '../../services/ipd.service';
import type { Admission } from './types';

const SAMPLE_HOSPITAL_ID = '11111111-1111-1111-1111-111111111111';

export default function IPDPage() {
  usePageTitle('IPD');
  const { hospitalId, user } = useAppSelector((s) => s.auth);
  const effectiveHospitalId = hospitalId ?? SAMPLE_HOSPITAL_ID;
  const [activeTab, setActiveTab] = useState('beds');
  const [admissions, setAdmissions] = useState<Admission[]>([]);
  const [selectedAdmission, setSelectedAdmission] = useState<Admission | null>(null);
  const [showBulkSticker, setShowBulkSticker] = useState(false);

  const loadAdmissions = useCallback(async () => {
    try {
      const data = await ipdService.getActiveAdmissions(effectiveHospitalId);
      setAdmissions(data);
      if (data.length > 0 && !selectedAdmission) setSelectedAdmission(data[0]);
    } catch { /* ignore */ }
  }, [effectiveHospitalId]);

  useEffect(() => { loadAdmissions(); }, [loadAdmissions]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Inpatient Department"
        subtitle="Manage beds, wards, admissions, and billing"
        icon={BedDouble}
        actions={
          <Button size="sm" variant="outline" onClick={() => setShowBulkSticker(true)} disabled={admissions.length === 0} className="gap-1.5">
            <Printer className="w-4 h-4" /> Print Labels
          </Button>
        }
      />
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="beds" className="gap-2">
            <BedDouble className="w-4 h-4" />
            Bed Availability
          </TabsTrigger>
          <TabsTrigger value="ward-board" className="gap-2">
            <Building2 className="w-4 h-4" />
            Ward Board
          </TabsTrigger>
          <TabsTrigger value="billing" className="gap-2">
            <Receipt className="w-4 h-4" />
            IPD Billing
          </TabsTrigger>
        </TabsList>
        <TabsContent value="beds" className="mt-4">
          <BedAvailability hospitalId={effectiveHospitalId} />
        </TabsContent>
        <TabsContent value="ward-board" className="mt-4">
          <WardBoard hospitalId={effectiveHospitalId} />
        </TabsContent>
        <TabsContent value="billing" className="mt-4">
          {admissions.length === 0 ? (
            <div className="text-center py-16 text-muted-foreground">
              <Receipt className="w-12 h-12 mx-auto mb-2 opacity-30" />
              <p>No active admissions. Admit a patient first.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Admission selector */}
              <div className="flex gap-2 flex-wrap">
                {admissions.map(adm => (
                  <button
                    key={adm.id}
                    onClick={() => setSelectedAdmission(adm)}
                    className={`px-3 py-2 rounded-lg border-2 text-xs font-medium transition-all ${
                      selectedAdmission?.id === adm.id
                        ? 'border-primary bg-primary/5 text-primary'
                        : 'border-border text-muted-foreground hover:border-primary/30'
                    }`}
                  >
                    {adm.patient?.full_name} — {adm.bed?.bed_number}
                  </button>
                ))}
              </div>
              {selectedAdmission && (
                <IpdBillingTab admission={selectedAdmission} userId={user?.id ?? ''} />
              )}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {showBulkSticker && (
        <IpdBulkStickerPrint admissions={admissions} onClose={() => setShowBulkSticker(false)} />
      )}
    </div>
  );
}
