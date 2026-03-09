import { useState, useEffect, useCallback } from 'react';
import {
  Siren, Clock, Plus, RefreshCw, Activity, Stethoscope,
  AlertTriangle, CheckCircle2, X, ChevronRight, Heart,
  Thermometer, Droplets, FileText, Users,
} from 'lucide-react';
import { PageSkeleton } from '../../components/common/skeletons';
import { Button } from '../../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Textarea } from '../../components/ui/textarea';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '../../components/ui/select';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '../../components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../components/ui/tabs';
import { ScrollArea } from '../../components/ui/scroll-area';
import { useAppSelector } from '../../store';
import { useToast } from '../../hooks/useToast';
import { usePageTitle } from '../../hooks/usePageTitle';
import { supabase } from '../../lib/supabase';
import PageHeader from '../../components/shared/PageHeader';
import emergencyService from '../../services/emergency.service';
import { formatDistanceToNow, format } from 'date-fns';
import type {
  EmergencyCase,
  EmergencyTreatment,
  TriageCategory,
  ArrivalMode,
  Disposition,
  TreatmentType,
  VitalsOnArrival,
} from './types';
import {
  TRIAGE_CONFIG,
  ARRIVAL_MODE_CONFIG,
  EMERGENCY_STATUS_CONFIG,
  DISPOSITION_CONFIG,
  TREATMENT_TYPE_CONFIG,
} from './types';

const SAMPLE_HOSPITAL_ID = '11111111-1111-1111-1111-111111111111';

export default function EmergencyPage() {
  usePageTitle('Emergency');
  const { hospitalId: rawHospitalId, user } = useAppSelector((s) => s.auth);
  const hospitalId = rawHospitalId ?? SAMPLE_HOSPITAL_ID;
  const { toast } = useToast();

  const [loading, setLoading] = useState(true);
  const [cases, setCases] = useState<EmergencyCase[]>([]);
  const [triageFilter, setTriageFilter] = useState<'all' | TriageCategory>('all');
  const [stats, setStats] = useState({
    waiting: 0, inTreatment: 0, observation: 0,
    redCases: 0, yellowCases: 0, greenCases: 0,
    todayTotal: 0, todayAdmitted: 0, todayDischarged: 0,
  });
  const [doctors, setDoctors] = useState<Array<{ id: string; full_name: string }>>([]);

  const [showNewCase, setShowNewCase] = useState(false);
  const [selectedCase, setSelectedCase] = useState<EmergencyCase | null>(null);
  const [treatments, setTreatments] = useState<EmergencyTreatment[]>([]);
  const [showTreatmentDialog, setShowTreatmentDialog] = useState(false);
  const [showDispositionDialog, setShowDispositionDialog] = useState(false);

  const [newCase, setNewCase] = useState({
    arrival_mode: 'Walk-in' as ArrivalMode,
    triage_category: 'Green' as TriageCategory,
    chief_complaint: '',
    history_of_present_illness: '',
    treating_doctor_id: '',
    bed_number: '',
    vitals: {
      systolic_bp: '',
      diastolic_bp: '',
      heart_rate: '',
      respiratory_rate: '',
      temperature: '',
      spo2: '',
      blood_glucose: '',
      gcs_score: '',
      pain_scale: '',
    },
  });

  const [newTreatment, setNewTreatment] = useState({
    treatment_type: 'general' as TreatmentType,
    treatment_notes: '',
    medications_given: '',
    procedures_performed: '',
  });

  const [dispositionData, setDispositionData] = useState({
    disposition: '' as Disposition | '',
    notes: '',
    ward: '',
  });

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [casesData, statsData, doctorsData] = await Promise.all([
        triageFilter === 'all'
          ? emergencyService.getCases(hospitalId, true)
          : emergencyService.getCasesByTriage(hospitalId, triageFilter),
        emergencyService.getStats(hospitalId),
        emergencyService.getDoctors(hospitalId),
      ]);
      setCases(casesData);
      setStats(statsData);
      setDoctors(doctorsData);
    } catch {
      toast('Error', { description: 'Failed to load emergency data', type: 'error' });
    } finally {
      setLoading(false);
    }
  }, [hospitalId, triageFilter, toast]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  useEffect(() => {
    if (!hospitalId) return;

    const channel = supabase
      .channel('emergency-updates')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'emergency_cases' }, loadData)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'emergency_treatments' }, () => {
        if (selectedCase) loadTreatments(selectedCase.id);
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [hospitalId, loadData, selectedCase]);

  const loadTreatments = async (caseId: string) => {
    try {
      const data = await emergencyService.getTreatments(caseId);
      setTreatments(data);
    } catch {
      toast('Error', { description: 'Failed to load treatments', type: 'error' });
    }
  };

  const handleSelectCase = async (emergencyCase: EmergencyCase) => {
    setSelectedCase(emergencyCase);
    await loadTreatments(emergencyCase.id);
  };

  const parseVitals = (): VitalsOnArrival => {
    const vitals: VitalsOnArrival = {};
    if (newCase.vitals.systolic_bp) vitals.systolic_bp = parseInt(newCase.vitals.systolic_bp);
    if (newCase.vitals.diastolic_bp) vitals.diastolic_bp = parseInt(newCase.vitals.diastolic_bp);
    if (newCase.vitals.heart_rate) vitals.heart_rate = parseInt(newCase.vitals.heart_rate);
    if (newCase.vitals.respiratory_rate) vitals.respiratory_rate = parseInt(newCase.vitals.respiratory_rate);
    if (newCase.vitals.temperature) vitals.temperature = parseFloat(newCase.vitals.temperature);
    if (newCase.vitals.spo2) vitals.spo2 = parseInt(newCase.vitals.spo2);
    if (newCase.vitals.blood_glucose) vitals.blood_glucose = parseFloat(newCase.vitals.blood_glucose);
    if (newCase.vitals.gcs_score) vitals.gcs_score = parseInt(newCase.vitals.gcs_score);
    if (newCase.vitals.pain_scale) vitals.pain_scale = parseInt(newCase.vitals.pain_scale);
    return vitals;
  };

  const handleCreateCase = async () => {
    try {
      const vitals = parseVitals();
      await emergencyService.createCase({
        hospital_id: hospitalId,
        arrival_mode: newCase.arrival_mode,
        triage_category: newCase.triage_category,
        chief_complaint: newCase.chief_complaint,
        history_of_present_illness: newCase.history_of_present_illness || undefined,
        treating_doctor_id: newCase.treating_doctor_id || undefined,
        bed_number: newCase.bed_number || undefined,
        vitals_on_arrival: Object.keys(vitals).length > 0 ? vitals : undefined,
      });
      toast('Success', { description: 'Emergency case created', type: 'success' });
      setShowNewCase(false);
      setNewCase({
        arrival_mode: 'Walk-in',
        triage_category: 'Green',
        chief_complaint: '',
        history_of_present_illness: '',
        treating_doctor_id: '',
        bed_number: '',
        vitals: {
          systolic_bp: '', diastolic_bp: '', heart_rate: '', respiratory_rate: '',
          temperature: '', spo2: '', blood_glucose: '', gcs_score: '', pain_scale: '',
        },
      });
      loadData();
    } catch {
      toast('Error', { description: 'Failed to create case', type: 'error' });
    }
  };

  const handleAddTreatment = async () => {
    if (!selectedCase || !user) return;
    try {
      await emergencyService.addTreatment({
        emergency_case_id: selectedCase.id,
        treatment_type: newTreatment.treatment_type,
        treatment_notes: newTreatment.treatment_notes || undefined,
        medications_given: newTreatment.medications_given || undefined,
        procedures_performed: newTreatment.procedures_performed || undefined,
        performed_by: user.id,
      });
      toast('Success', { description: 'Treatment recorded', type: 'success' });
      setShowTreatmentDialog(false);
      setNewTreatment({
        treatment_type: 'general',
        treatment_notes: '',
        medications_given: '',
        procedures_performed: '',
      });
      loadTreatments(selectedCase.id);
    } catch {
      toast('Error', { description: 'Failed to add treatment', type: 'error' });
    }
  };

  const handleSetDisposition = async () => {
    if (!selectedCase || !dispositionData.disposition) return;
    try {
      await emergencyService.setDisposition(
        selectedCase.id,
        dispositionData.disposition,
        dispositionData.notes || undefined,
        dispositionData.ward || undefined
      );
      toast('Success', { description: 'Disposition set', type: 'success' });
      setShowDispositionDialog(false);
      setDispositionData({ disposition: '', notes: '', ward: '' });
      setSelectedCase(null);
      loadData();
    } catch {
      toast('Error', { description: 'Failed to set disposition', type: 'error' });
    }
  };

  const handleAssignDoctor = async (doctorId: string) => {
    if (!selectedCase) return;
    try {
      await emergencyService.assignDoctor(selectedCase.id, doctorId);
      toast('Success', { description: 'Doctor assigned', type: 'success' });
      loadData();
      const updated = await emergencyService.getCaseById(selectedCase.id);
      if (updated) setSelectedCase(updated);
    } catch {
      toast('Error', { description: 'Failed to assign doctor', type: 'error' });
    }
  };

  const handleUpdateTriage = async (triage: TriageCategory) => {
    if (!selectedCase || !user) return;
    try {
      await emergencyService.updateTriage(selectedCase.id, triage, user.id);
      toast('Success', { description: 'Triage updated', type: 'success' });
      loadData();
      const updated = await emergencyService.getCaseById(selectedCase.id);
      if (updated) setSelectedCase(updated);
    } catch {
      toast('Error', { description: 'Failed to update triage', type: 'error' });
    }
  };

  const filteredCases = cases;

  if (loading && cases.length === 0) {
    return <PageSkeleton type="cards" />;
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Emergency Department"
        subtitle="Triage and manage emergency cases"
        icon={Siren}
        iconClassName="bg-destructive/10 text-destructive"
        helpItems={[
          'Click "New Case" to register an emergency patient',
          'Filter by triage color (Red/Yellow/Green) for priority',
          'Click any case card to view details and add treatments',
          'Update disposition to admit, discharge, or refer patients',
          'Cases auto-refresh in real-time — no need to reload',
        ]}
        actions={
          <>
            <Button variant="outline" size="sm" onClick={loadData} className="gap-1.5">
              <RefreshCw className="w-3.5 h-3.5" />
              Refresh
            </Button>
            <Button size="sm" onClick={() => setShowNewCase(true)} className="gap-1.5 bg-destructive hover:bg-destructive/90 text-destructive-foreground">
              <Plus className="w-3.5 h-3.5" />
              New Case
            </Button>
          </>
        }
      />

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <Card className="border shadow-card bg-gradient-to-br from-red-50 to-card">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Red (Immediate)</p>
                <p className="text-2xl font-bold text-red-600">{stats.redCases}</p>
              </div>
              <div className="w-3 h-3 rounded-full bg-red-500" />
            </div>
          </CardContent>
        </Card>
        <Card className="border shadow-card bg-gradient-to-br from-amber-50 to-card">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Yellow (Urgent)</p>
                <p className="text-2xl font-bold text-amber-600">{stats.yellowCases}</p>
              </div>
              <div className="w-3 h-3 rounded-full bg-amber-500" />
            </div>
          </CardContent>
        </Card>
        <Card className="border shadow-card bg-gradient-to-br from-emerald-50 to-card">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Green (Non-urgent)</p>
                <p className="text-2xl font-bold text-emerald-600">{stats.greenCases}</p>
              </div>
              <div className="w-3 h-3 rounded-full bg-emerald-500" />
            </div>
          </CardContent>
        </Card>
        <Card className="border shadow-card">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Waiting</p>
                <p className="text-2xl font-bold text-foreground">{stats.waiting}</p>
              </div>
              <Clock className="w-5 h-5 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
        <Card className="border shadow-card">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">In Treatment</p>
                <p className="text-2xl font-bold text-foreground">{stats.inTreatment}</p>
              </div>
              <Activity className="w-5 h-5 text-primary" />
            </div>
          </CardContent>
        </Card>
        <Card className="border shadow-card">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Today Total</p>
                <p className="text-2xl font-bold text-foreground">{stats.todayTotal}</p>
              </div>
              <Siren className="w-5 h-5 text-destructive" />
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="flex items-center gap-2">
        <span className="text-sm text-muted-foreground">Filter by Triage:</span>
        {(['all', 'Red', 'Yellow', 'Green'] as const).map((filter) => (
          <Button
            key={filter}
            variant={triageFilter === filter ? 'default' : 'outline'}
            size="sm"
            onClick={() => setTriageFilter(filter)}
            className={
              filter === 'Red' ? 'border-red-300 text-red-700 hover:bg-red-50' :
              filter === 'Yellow' ? 'border-amber-300 text-amber-700 hover:bg-amber-50' :
              filter === 'Green' ? 'border-emerald-300 text-emerald-700 hover:bg-emerald-50' :
              ''
            }
          >
            {filter === 'all' ? 'All Cases' : TRIAGE_CONFIG[filter as TriageCategory].label}
          </Button>
        ))}
      </div>

      <div className="grid grid-cols-12 gap-6">
        <div className="col-span-12 lg:col-span-7">
          <Card className="border shadow-card">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Siren className="w-4 h-4 text-destructive" />
                Active Cases ({filteredCases.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {filteredCases.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <Siren className="w-12 h-12 mx-auto mb-3 opacity-30" />
                  <p>No active emergency cases</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {filteredCases.map((emergencyCase) => {
                    const triageConfig = TRIAGE_CONFIG[emergencyCase.triage_category];
                    const statusConfig = EMERGENCY_STATUS_CONFIG[emergencyCase.status];
                    const isSelected = selectedCase?.id === emergencyCase.id;

                    return (
                      <div
                        key={emergencyCase.id}
                        onClick={() => handleSelectCase(emergencyCase)}
                        className={`p-4 rounded-xl border-l-4 cursor-pointer transition-all ${
                          isSelected ? 'ring-2 ring-primary' : ''
                        } ${triageConfig.borderColor} ${
                          emergencyCase.triage_category === 'Red'
                            ? 'bg-red-50 hover:bg-red-100'
                            : emergencyCase.triage_category === 'Yellow'
                            ? 'bg-amber-50 hover:bg-amber-100'
                            : 'bg-emerald-50 hover:bg-emerald-100'
                        }`}
                      >
                        <div className="flex items-start justify-between mb-2">
                          <div>
                            <span className="font-medium text-sm">{emergencyCase.case_number}</span>
                            <Badge className={`ml-2 ${statusConfig.bgColor} ${statusConfig.color} text-xs`}>
                              {statusConfig.label}
                            </Badge>
                          </div>
                          <Badge className={`${triageConfig.bgColor} ${triageConfig.color} text-xs`}>
                            {emergencyCase.triage_category}
                          </Badge>
                        </div>

                        {emergencyCase.patient && (
                          <p className="text-sm font-medium text-foreground mb-1">
                            {emergencyCase.patient.full_name}
                          </p>
                        )}

                        <p className="text-sm text-gray-600 mb-2 line-clamp-2">
                          {emergencyCase.chief_complaint}
                        </p>

                        <div className="flex items-center justify-between text-xs text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {formatDistanceToNow(new Date(emergencyCase.arrival_time), { addSuffix: true })}
                          </span>
                          <span>{ARRIVAL_MODE_CONFIG[emergencyCase.arrival_mode].label}</span>
                        </div>

                        {emergencyCase.treating_doctor && (
                          <div className="mt-2 pt-2 border-t border-gray-200 flex items-center gap-1 text-xs text-gray-600">
                            <Stethoscope className="w-3 h-3" />
                            Dr. {emergencyCase.treating_doctor.full_name}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="col-span-12 lg:col-span-5">
          {selectedCase ? (
            <Card className="border-0 shadow-sm sticky top-6">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-medium">Case Details</CardTitle>
                  <Button variant="ghost" size="sm" onClick={() => setSelectedCase(null)}>
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <Tabs defaultValue="info" className="w-full">
                  <TabsList className="grid w-full grid-cols-3 mb-4">
                    <TabsTrigger value="info">Info</TabsTrigger>
                    <TabsTrigger value="vitals">Vitals</TabsTrigger>
                    <TabsTrigger value="treatment">Treatment</TabsTrigger>
                  </TabsList>

                  <TabsContent value="info" className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-lg font-bold">{selectedCase.case_number}</span>
                      <Badge className={`${TRIAGE_CONFIG[selectedCase.triage_category].bgColor} ${TRIAGE_CONFIG[selectedCase.triage_category].color}`}>
                        {TRIAGE_CONFIG[selectedCase.triage_category].label}
                      </Badge>
                    </div>

                    {selectedCase.patient && (
                      <div className="p-3 bg-gray-50 rounded-xl">
                        <p className="font-medium">{selectedCase.patient.full_name}</p>
                        <p className="text-sm text-gray-500">
                          {selectedCase.patient.gender} | {selectedCase.patient.phone}
                        </p>
                        {selectedCase.patient.blood_group && (
                          <Badge variant="outline" className="mt-1">{selectedCase.patient.blood_group}</Badge>
                        )}
                      </div>
                    )}

                    <div>
                      <p className="text-xs text-gray-500 mb-1">Chief Complaint</p>
                      <p className="text-sm">{selectedCase.chief_complaint}</p>
                    </div>

                    {selectedCase.history_of_present_illness && (
                      <div>
                        <p className="text-xs text-gray-500 mb-1">History of Present Illness</p>
                        <p className="text-sm">{selectedCase.history_of_present_illness}</p>
                      </div>
                    )}

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <p className="text-xs text-gray-500">Arrival Mode</p>
                        <p className="text-sm font-medium">{selectedCase.arrival_mode}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">Arrival Time</p>
                        <p className="text-sm font-medium">
                          {format(new Date(selectedCase.arrival_time), 'dd MMM, HH:mm')}
                        </p>
                      </div>
                    </div>

                    <div>
                      <p className="text-xs text-gray-500 mb-2">Treating Doctor</p>
                      {selectedCase.treating_doctor ? (
                        <div className="flex items-center gap-2">
                          <Stethoscope className="w-4 h-4 text-blue-500" />
                          <span>Dr. {selectedCase.treating_doctor.full_name}</span>
                        </div>
                      ) : (
                        <Select onValueChange={handleAssignDoctor}>
                          <SelectTrigger className="h-9">
                            <SelectValue placeholder="Assign doctor..." />
                          </SelectTrigger>
                          <SelectContent>
                            {doctors.map((doc) => (
                              <SelectItem key={doc.id} value={doc.id}>Dr. {doc.full_name}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      )}
                    </div>

                    <div>
                      <p className="text-xs text-gray-500 mb-2">Update Triage</p>
                      <div className="flex gap-2">
                        {(['Red', 'Yellow', 'Green'] as TriageCategory[]).map((triage) => (
                          <Button
                            key={triage}
                            size="sm"
                            variant={selectedCase.triage_category === triage ? 'default' : 'outline'}
                            onClick={() => handleUpdateTriage(triage)}
                            className={
                              triage === 'Red' ? 'border-red-300 bg-red-100 text-red-700 hover:bg-red-200' :
                              triage === 'Yellow' ? 'border-amber-300 bg-amber-100 text-amber-700 hover:bg-amber-200' :
                              'border-emerald-300 bg-emerald-100 text-emerald-700 hover:bg-emerald-200'
                            }
                          >
                            {triage}
                          </Button>
                        ))}
                      </div>
                    </div>

                    <div className="pt-3 border-t flex gap-2">
                      <Button
                        size="sm"
                        onClick={() => setShowTreatmentDialog(true)}
                        className="flex-1 gap-1"
                      >
                        <Plus className="w-3 h-3" />
                        Add Treatment
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setShowDispositionDialog(true)}
                        className="flex-1 gap-1"
                      >
                        <ChevronRight className="w-3 h-3" />
                        Disposition
                      </Button>
                    </div>
                  </TabsContent>

                  <TabsContent value="vitals" className="space-y-3">
                    {selectedCase.vitals_on_arrival ? (
                      <div className="grid grid-cols-2 gap-3">
                        {selectedCase.vitals_on_arrival.systolic_bp && (
                          <div className="p-3 bg-gray-50 rounded-xl">
                            <div className="flex items-center gap-2 mb-1">
                              <Heart className="w-4 h-4 text-red-500" />
                              <span className="text-xs text-gray-500">Blood Pressure</span>
                            </div>
                            <p className="font-medium">
                              {selectedCase.vitals_on_arrival.systolic_bp}/{selectedCase.vitals_on_arrival.diastolic_bp} mmHg
                            </p>
                          </div>
                        )}
                        {selectedCase.vitals_on_arrival.heart_rate && (
                          <div className="p-3 bg-gray-50 rounded-xl">
                            <div className="flex items-center gap-2 mb-1">
                              <Activity className="w-4 h-4 text-blue-500" />
                              <span className="text-xs text-gray-500">Heart Rate</span>
                            </div>
                            <p className="font-medium">{selectedCase.vitals_on_arrival.heart_rate} bpm</p>
                          </div>
                        )}
                        {selectedCase.vitals_on_arrival.temperature && (
                          <div className="p-3 bg-gray-50 rounded-xl">
                            <div className="flex items-center gap-2 mb-1">
                              <Thermometer className="w-4 h-4 text-amber-500" />
                              <span className="text-xs text-gray-500">Temperature</span>
                            </div>
                            <p className="font-medium">{selectedCase.vitals_on_arrival.temperature} F</p>
                          </div>
                        )}
                        {selectedCase.vitals_on_arrival.spo2 && (
                          <div className="p-3 bg-gray-50 rounded-xl">
                            <div className="flex items-center gap-2 mb-1">
                              <Droplets className="w-4 h-4 text-cyan-500" />
                              <span className="text-xs text-gray-500">SpO2</span>
                            </div>
                            <p className="font-medium">{selectedCase.vitals_on_arrival.spo2}%</p>
                          </div>
                        )}
                        {selectedCase.vitals_on_arrival.respiratory_rate && (
                          <div className="p-3 bg-gray-50 rounded-xl">
                            <div className="flex items-center gap-2 mb-1">
                              <Activity className="w-4 h-4 text-emerald-500" />
                              <span className="text-xs text-gray-500">Respiratory Rate</span>
                            </div>
                            <p className="font-medium">{selectedCase.vitals_on_arrival.respiratory_rate} /min</p>
                          </div>
                        )}
                        {selectedCase.vitals_on_arrival.gcs_score && (
                          <div className="p-3 bg-gray-50 rounded-xl">
                            <div className="flex items-center gap-2 mb-1">
                              <AlertTriangle className="w-4 h-4 text-orange-500" />
                              <span className="text-xs text-gray-500">GCS Score</span>
                            </div>
                            <p className="font-medium">{selectedCase.vitals_on_arrival.gcs_score}/15</p>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="text-center py-8 text-gray-500">
                        <Activity className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                        <p>No vitals recorded on arrival</p>
                      </div>
                    )}
                  </TabsContent>

                  <TabsContent value="treatment">
                    <ScrollArea className="h-[300px]">
                      {treatments.length === 0 ? (
                        <div className="text-center py-8 text-gray-500">
                          <FileText className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                          <p>No treatments recorded</p>
                        </div>
                      ) : (
                        <div className="space-y-3">
                          {treatments.map((treatment) => {
                            const typeConfig = TREATMENT_TYPE_CONFIG[treatment.treatment_type];
                            return (
                              <div key={treatment.id} className="p-3 bg-gray-50 rounded-xl">
                                <div className="flex items-center justify-between mb-2">
                                  <Badge variant="outline">{typeConfig.label}</Badge>
                                  <span className="text-xs text-gray-500">
                                    {format(new Date(treatment.treatment_time), 'dd MMM, HH:mm')}
                                  </span>
                                </div>
                                {treatment.treatment_notes && (
                                  <p className="text-sm mb-1">{treatment.treatment_notes}</p>
                                )}
                                {treatment.medications_given && (
                                  <p className="text-sm text-blue-600">Meds: {treatment.medications_given}</p>
                                )}
                                {treatment.procedures_performed && (
                                  <p className="text-sm text-purple-600">Proc: {treatment.procedures_performed}</p>
                                )}
                                {treatment.performer && (
                                  <p className="text-xs text-gray-500 mt-1">By: {treatment.performer.full_name}</p>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </ScrollArea>
                    <Button
                      size="sm"
                      className="w-full mt-3"
                      onClick={() => setShowTreatmentDialog(true)}
                    >
                      <Plus className="w-3 h-3 mr-1" />
                      Add Treatment
                    </Button>
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          ) : (
            <Card className="border-0 shadow-sm h-96 flex items-center justify-center">
              <div className="text-center text-gray-500">
                <Users className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                <p>Select a case to view details</p>
              </div>
            </Card>
          )}
        </div>
      </div>

      <Dialog open={showNewCase} onOpenChange={setShowNewCase}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>New Emergency Case</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Arrival Mode</Label>
                <Select
                  value={newCase.arrival_mode}
                  onValueChange={(v) => setNewCase({ ...newCase, arrival_mode: v as ArrivalMode })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.keys(ARRIVAL_MODE_CONFIG).map((mode) => (
                      <SelectItem key={mode} value={mode}>
                        {ARRIVAL_MODE_CONFIG[mode as ArrivalMode].label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Triage Category</Label>
                <Select
                  value={newCase.triage_category}
                  onValueChange={(v) => setNewCase({ ...newCase, triage_category: v as TriageCategory })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Red">Red - Immediate</SelectItem>
                    <SelectItem value="Yellow">Yellow - Urgent</SelectItem>
                    <SelectItem value="Green">Green - Non-urgent</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label>Chief Complaint *</Label>
              <Textarea
                value={newCase.chief_complaint}
                onChange={(e) => setNewCase({ ...newCase, chief_complaint: e.target.value })}
                placeholder="Primary reason for emergency visit"
                rows={2}
              />
            </div>

            <div>
              <Label>History of Present Illness</Label>
              <Textarea
                value={newCase.history_of_present_illness}
                onChange={(e) => setNewCase({ ...newCase, history_of_present_illness: e.target.value })}
                placeholder="Detailed history..."
                rows={3}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Treating Doctor</Label>
                <Select
                  value={newCase.treating_doctor_id}
                  onValueChange={(v) => setNewCase({ ...newCase, treating_doctor_id: v })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select doctor..." />
                  </SelectTrigger>
                  <SelectContent>
                    {doctors.map((doc) => (
                      <SelectItem key={doc.id} value={doc.id}>Dr. {doc.full_name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Bed Number</Label>
                <Input
                  value={newCase.bed_number}
                  onChange={(e) => setNewCase({ ...newCase, bed_number: e.target.value })}
                  placeholder="e.g., ER-01"
                />
              </div>
            </div>

            <div className="border-t pt-4">
              <Label className="mb-3 block">Vitals on Arrival</Label>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <Label className="text-xs">BP Systolic</Label>
                  <Input
                    type="number"
                    value={newCase.vitals.systolic_bp}
                    onChange={(e) => setNewCase({
                      ...newCase,
                      vitals: { ...newCase.vitals, systolic_bp: e.target.value }
                    })}
                    placeholder="120"
                  />
                </div>
                <div>
                  <Label className="text-xs">BP Diastolic</Label>
                  <Input
                    type="number"
                    value={newCase.vitals.diastolic_bp}
                    onChange={(e) => setNewCase({
                      ...newCase,
                      vitals: { ...newCase.vitals, diastolic_bp: e.target.value }
                    })}
                    placeholder="80"
                  />
                </div>
                <div>
                  <Label className="text-xs">Heart Rate</Label>
                  <Input
                    type="number"
                    value={newCase.vitals.heart_rate}
                    onChange={(e) => setNewCase({
                      ...newCase,
                      vitals: { ...newCase.vitals, heart_rate: e.target.value }
                    })}
                    placeholder="72"
                  />
                </div>
                <div>
                  <Label className="text-xs">Temperature (F)</Label>
                  <Input
                    type="number"
                    step="0.1"
                    value={newCase.vitals.temperature}
                    onChange={(e) => setNewCase({
                      ...newCase,
                      vitals: { ...newCase.vitals, temperature: e.target.value }
                    })}
                    placeholder="98.6"
                  />
                </div>
                <div>
                  <Label className="text-xs">SpO2 (%)</Label>
                  <Input
                    type="number"
                    value={newCase.vitals.spo2}
                    onChange={(e) => setNewCase({
                      ...newCase,
                      vitals: { ...newCase.vitals, spo2: e.target.value }
                    })}
                    placeholder="98"
                  />
                </div>
                <div>
                  <Label className="text-xs">Respiratory Rate</Label>
                  <Input
                    type="number"
                    value={newCase.vitals.respiratory_rate}
                    onChange={(e) => setNewCase({
                      ...newCase,
                      vitals: { ...newCase.vitals, respiratory_rate: e.target.value }
                    })}
                    placeholder="16"
                  />
                </div>
                <div>
                  <Label className="text-xs">GCS Score</Label>
                  <Input
                    type="number"
                    min="3"
                    max="15"
                    value={newCase.vitals.gcs_score}
                    onChange={(e) => setNewCase({
                      ...newCase,
                      vitals: { ...newCase.vitals, gcs_score: e.target.value }
                    })}
                    placeholder="15"
                  />
                </div>
                <div>
                  <Label className="text-xs">Pain Scale (0-10)</Label>
                  <Input
                    type="number"
                    min="0"
                    max="10"
                    value={newCase.vitals.pain_scale}
                    onChange={(e) => setNewCase({
                      ...newCase,
                      vitals: { ...newCase.vitals, pain_scale: e.target.value }
                    })}
                    placeholder="5"
                  />
                </div>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowNewCase(false)}>Cancel</Button>
            <Button
              onClick={handleCreateCase}
              disabled={!newCase.chief_complaint}
              className="bg-red-600 hover:bg-red-700"
            >
              Create Case
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showTreatmentDialog} onOpenChange={setShowTreatmentDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Add Treatment</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label>Treatment Type</Label>
              <Select
                value={newTreatment.treatment_type}
                onValueChange={(v) => setNewTreatment({ ...newTreatment, treatment_type: v as TreatmentType })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.keys(TREATMENT_TYPE_CONFIG).map((type) => (
                    <SelectItem key={type} value={type}>
                      {TREATMENT_TYPE_CONFIG[type as TreatmentType].label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Treatment Notes</Label>
              <Textarea
                value={newTreatment.treatment_notes}
                onChange={(e) => setNewTreatment({ ...newTreatment, treatment_notes: e.target.value })}
                placeholder="Describe treatment provided..."
                rows={3}
              />
            </div>
            <div>
              <Label>Medications Given</Label>
              <Textarea
                value={newTreatment.medications_given}
                onChange={(e) => setNewTreatment({ ...newTreatment, medications_given: e.target.value })}
                placeholder="List medications administered..."
                rows={2}
              />
            </div>
            <div>
              <Label>Procedures Performed</Label>
              <Textarea
                value={newTreatment.procedures_performed}
                onChange={(e) => setNewTreatment({ ...newTreatment, procedures_performed: e.target.value })}
                placeholder="List procedures performed..."
                rows={2}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowTreatmentDialog(false)}>Cancel</Button>
            <Button onClick={handleAddTreatment}>Add Treatment</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showDispositionDialog} onOpenChange={setShowDispositionDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Set Disposition</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label>Disposition</Label>
              <Select
                value={dispositionData.disposition}
                onValueChange={(v) => setDispositionData({ ...dispositionData, disposition: v as Disposition })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select disposition..." />
                </SelectTrigger>
                <SelectContent>
                  {Object.keys(DISPOSITION_CONFIG).map((disp) => (
                    <SelectItem key={disp} value={disp}>
                      {DISPOSITION_CONFIG[disp as Disposition].label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {dispositionData.disposition === 'Admitted' && (
              <div>
                <Label>Admit to Ward</Label>
                <Input
                  value={dispositionData.ward}
                  onChange={(e) => setDispositionData({ ...dispositionData, ward: e.target.value })}
                  placeholder="Ward name..."
                />
              </div>
            )}
            <div>
              <Label>Notes</Label>
              <Textarea
                value={dispositionData.notes}
                onChange={(e) => setDispositionData({ ...dispositionData, notes: e.target.value })}
                placeholder="Disposition notes..."
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDispositionDialog(false)}>Cancel</Button>
            <Button
              onClick={handleSetDisposition}
              disabled={!dispositionData.disposition}
              className="bg-emerald-600 hover:bg-emerald-700"
            >
              <CheckCircle2 className="w-4 h-4 mr-1" />
              Confirm
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
