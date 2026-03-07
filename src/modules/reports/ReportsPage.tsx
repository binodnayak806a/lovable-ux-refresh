import { useState, useEffect, lazy, Suspense } from 'react';
import {
  ClipboardList, BedDouble, IndianRupee, CreditCard, Hotel,
  Stethoscope, Wrench, BookmarkCheck, FileBarChart,
} from 'lucide-react';
import { useSearchParams } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { useHospitalId } from '../../hooks/useHospitalId';
import { usePageTitle } from '../../hooks/usePageTitle';
import PageHeader from '../../components/shared/PageHeader';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { Tabs, TabsList, TabsTrigger } from '../../components/ui/tabs';
import type { SavedReport } from './types/report-types';

const DailyOPDReport = lazy(() => import('./components/DailyOPDReport'));
const IPDCensusReportNew = lazy(() => import('./components/IPDCensusReportNew'));
const RevenueReportNew = lazy(() => import('./components/RevenueReportNew'));
const CollectionReportNew = lazy(() => import('./components/CollectionReportNew'));
const BedOccupancyReportNew = lazy(() => import('./components/BedOccupancyReportNew'));
const DoctorOPDReportNew = lazy(() => import('./components/DoctorOPDReportNew'));
const CustomReportBuilder = lazy(() => import('./components/CustomReportBuilder'));
const SavedReportsPanel = lazy(() => import('./components/SavedReportsPanel'));

const TAB_LIST = [
  { id: 'daily-opd', label: 'Daily OPD', icon: ClipboardList },
  { id: 'ipd-census', label: 'IPD Census', icon: BedDouble },
  { id: 'revenue', label: 'Revenue', icon: IndianRupee },
  { id: 'collection', label: 'Collections', icon: CreditCard },
  { id: 'bed-occupancy', label: 'Bed Occupancy', icon: Hotel },
  { id: 'doctor-opd', label: 'Doctor OPD', icon: Stethoscope },
  { id: 'builder', label: 'Report Builder', icon: Wrench },
  { id: 'saved', label: 'Saved', icon: BookmarkCheck },
] as const;

type TabId = (typeof TAB_LIST)[number]['id'];

export default function ReportsPage() {
  usePageTitle('Reports');
  const hospitalId = useHospitalId();
  const [searchParams, setSearchParams] = useSearchParams();
  const initialTab = (searchParams.get('tab') as TabId) || 'daily-opd';
  const [activeTab, setActiveTab] = useState<TabId>(initialTab);
  const [doctors, setDoctors] = useState<Array<{ id: string; full_name: string }>>([]);

  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from('doctors')
        .select('id, full_name')
        .eq('hospital_id', hospitalId)
        .eq('is_active', true)
        .order('full_name');
      setDoctors((data ?? []) as Array<{ id: string; full_name: string }>);
    })();
  }, [hospitalId]);

  const switchTab = (tab: TabId) => {
    setActiveTab(tab);
    setSearchParams({ tab });
  };

  const handleRunSavedReport = (_report: SavedReport) => {
    switchTab('builder');
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Reports"
        subtitle="Generate and analyze hospital data"
        icon={FileBarChart}
        actions={
          <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-muted text-xs text-muted-foreground">
            <FileBarChart className="w-3.5 h-3.5" />
            {TAB_LIST.length - 2} pre-built reports
          </div>
        }
      />

      <Tabs value={activeTab} onValueChange={(v) => switchTab(v as TabId)}>
        <TabsList className="w-full justify-start overflow-x-auto h-auto flex-wrap">
          {TAB_LIST.map(tab => (
            <TabsTrigger key={tab.id} value={tab.id} className="gap-1.5">
              <tab.icon className="w-4 h-4" />
              {tab.label}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      <Suspense fallback={<LoadingSpinner />}>
        {activeTab === 'daily-opd' && <DailyOPDReport doctors={doctors} />}
        {activeTab === 'ipd-census' && <IPDCensusReportNew />}
        {activeTab === 'revenue' && <RevenueReportNew />}
        {activeTab === 'collection' && <CollectionReportNew />}
        {activeTab === 'bed-occupancy' && <BedOccupancyReportNew />}
        {activeTab === 'doctor-opd' && <DoctorOPDReportNew doctors={doctors} />}
        {activeTab === 'builder' && <CustomReportBuilder />}
        {activeTab === 'saved' && <SavedReportsPanel onRunReport={handleRunSavedReport} />}
      </Suspense>
    </div>
  );
}
