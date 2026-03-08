import { useState, useEffect, useCallback } from 'react';
import {
  Truck, Phone, User, MapPin, Plus, RefreshCw, AlertTriangle,
  CheckCircle2, Wrench, Navigation, Loader2, ChevronRight, X,
} from 'lucide-react';
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
import { ScrollArea } from '../../components/ui/scroll-area';
import { useAppSelector } from '../../store';
import { useToast } from '../../hooks/useToast';
import { supabase } from '../../lib/supabase';
import { usePageTitle } from '../../hooks/usePageTitle';
import PageHeader from '../../components/shared/PageHeader';
import ambulanceService from '../../services/ambulance.service';
import { formatDistanceToNow } from 'date-fns';
import type {
  Ambulance,
  AmbulanceRequest,
  AmbulanceStatus,
  AmbulanceType,
  RequestPriority,
  RequestType,
} from './types';
import {
  AMBULANCE_STATUS_CONFIG,
  AMBULANCE_TYPE_CONFIG,
  REQUEST_PRIORITY_CONFIG,
  REQUEST_STATUS_CONFIG,
} from './types';

const SAMPLE_HOSPITAL_ID = '11111111-1111-1111-1111-111111111111';

export default function AmbulancePage() {
  usePageTitle('Ambulance');
  const { hospitalId: rawHospitalId } = useAppSelector((s) => s.auth);
  const hospitalId = rawHospitalId ?? SAMPLE_HOSPITAL_ID;
  const { toast } = useToast();

  const [loading, setLoading] = useState(true);
  const [ambulances, setAmbulances] = useState<Ambulance[]>([]);
  const [requests, setRequests] = useState<AmbulanceRequest[]>([]);
  const [selectedAmbulance, setSelectedAmbulance] = useState<Ambulance | null>(null);
  const [fleetStats, setFleetStats] = useState({ total: 0, available: 0, onDuty: 0, maintenance: 0 });

  const [showAddAmbulance, setShowAddAmbulance] = useState(false);
  const [showNewRequest, setShowNewRequest] = useState(false);
  const [showAssignDialog, setShowAssignDialog] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<AmbulanceRequest | null>(null);

  const [newAmbulance, setNewAmbulance] = useState({
    vehicle_number: '',
    vehicle_type: 'Basic Life Support' as AmbulanceType,
    driver_name: '',
    driver_phone: '',
    paramedic_name: '',
  });

  const [newRequest, setNewRequest] = useState({
    request_type: 'pickup' as RequestType,
    pickup_location: '',
    dropoff_location: '',
    patient_name: '',
    patient_phone: '',
    patient_condition: '',
    priority: 'normal' as RequestPriority,
    notes: '',
  });

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [ambulancesData, requestsData, stats] = await Promise.all([
        ambulanceService.getAmbulances(hospitalId),
        ambulanceService.getRequests(hospitalId, true),
        ambulanceService.getFleetStats(hospitalId),
      ]);
      setAmbulances(ambulancesData);
      setRequests(requestsData);
      setFleetStats(stats);
    } catch {
      toast('Error', { description: 'Failed to load ambulance data', type: 'error' });
    } finally {
      setLoading(false);
    }
  }, [hospitalId, toast]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  useEffect(() => {
    if (!hospitalId) return;

    const channel = supabase
      .channel('ambulance-updates')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'ambulance_requests' }, loadData)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'ambulances' }, loadData)
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [hospitalId, loadData]);

  const handleAddAmbulance = async () => {
    try {
      await ambulanceService.createAmbulance({
        hospital_id: hospitalId,
        ...newAmbulance,
      });
      toast('Success', { description: 'Ambulance added successfully', type: 'success' });
      setShowAddAmbulance(false);
      setNewAmbulance({
        vehicle_number: '',
        vehicle_type: 'Basic Life Support',
        driver_name: '',
        driver_phone: '',
        paramedic_name: '',
      });
      loadData();
    } catch {
      toast('Error', { description: 'Failed to add ambulance', type: 'error' });
    }
  };

  const handleCreateRequest = async () => {
    try {
      await ambulanceService.createRequest({
        hospital_id: hospitalId,
        ...newRequest,
      });
      toast('Success', { description: 'Request created successfully', type: 'success' });
      setShowNewRequest(false);
      setNewRequest({
        request_type: 'pickup',
        pickup_location: '',
        dropoff_location: '',
        patient_name: '',
        patient_phone: '',
        patient_condition: '',
        priority: 'normal',
        notes: '',
      });
      loadData();
    } catch {
      toast('Error', { description: 'Failed to create request', type: 'error' });
    }
  };

  const handleAssignAmbulance = async (ambulanceId: string) => {
    if (!selectedRequest) return;
    try {
      await ambulanceService.assignAmbulance(selectedRequest.id, ambulanceId);
      toast('Success', { description: 'Ambulance assigned successfully', type: 'success' });
      setShowAssignDialog(false);
      setSelectedRequest(null);
      loadData();
    } catch {
      toast('Error', { description: 'Failed to assign ambulance', type: 'error' });
    }
  };

  const handleUpdateStatus = async (requestId: string, status: string) => {
    try {
      await ambulanceService.updateRequestStatus(requestId, status as AmbulanceRequest['status']);
      toast('Success', { description: 'Status updated', type: 'success' });
      loadData();
    } catch {
      toast('Error', { description: 'Failed to update status', type: 'error' });
    }
  };

  const handleCompleteRequest = async (requestId: string) => {
    try {
      await ambulanceService.completeRequest(requestId);
      toast('Success', { description: 'Request completed', type: 'success' });
      loadData();
    } catch {
      toast('Error', { description: 'Failed to complete request', type: 'error' });
    }
  };

  const handleUpdateAmbulanceStatus = async (ambulanceId: string, status: AmbulanceStatus) => {
    try {
      await ambulanceService.updateAmbulanceStatus(ambulanceId, status);
      toast('Success', { description: 'Ambulance status updated', type: 'success' });
      loadData();
    } catch {
      toast('Error', { description: 'Failed to update status', type: 'error' });
    }
  };

  const availableAmbulances = ambulances.filter(a => a.status === 'available');

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Ambulance Management"
        subtitle="Track and manage ambulance fleet and dispatch"
        icon={Truck}
        actions={
          <>
            <Button variant="outline" size="sm" onClick={loadData} className="gap-1.5">
              <RefreshCw className="w-3.5 h-3.5" />
              Refresh
            </Button>
            <Button size="sm" onClick={() => setShowNewRequest(true)} className="gap-1.5 bg-destructive hover:bg-destructive/90 text-destructive-foreground">
              <Phone className="w-3.5 h-3.5" />
              New Request
            </Button>
          </>
        }
      />

      <div className="grid grid-cols-12 gap-6">
        <div className="col-span-12 lg:col-span-4 space-y-4">
          <Card className="border-0 shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Truck className="w-4 h-4 text-blue-500" />
                Fleet Status
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-3 mb-4">
                <div className="text-center p-3 rounded-xl bg-emerald-50">
                  <p className="text-2xl font-bold text-emerald-600">{fleetStats.available}</p>
                  <p className="text-xs text-gray-500">Available</p>
                </div>
                <div className="text-center p-3 rounded-xl bg-blue-50">
                  <p className="text-2xl font-bold text-blue-600">{fleetStats.onDuty}</p>
                  <p className="text-xs text-gray-500">On Duty</p>
                </div>
                <div className="text-center p-3 rounded-xl bg-amber-50">
                  <p className="text-2xl font-bold text-amber-600">{fleetStats.maintenance}</p>
                  <p className="text-xs text-gray-500">Maintenance</p>
                </div>
              </div>

              <ScrollArea className="h-[400px] pr-3">
                <div className="space-y-2">
                  {ambulances.map((ambulance) => {
                    const statusConfig = AMBULANCE_STATUS_CONFIG[ambulance.status];
                    const typeConfig = AMBULANCE_TYPE_CONFIG[ambulance.vehicle_type];
                    return (
                      <div
                        key={ambulance.id}
                        onClick={() => setSelectedAmbulance(ambulance)}
                        className={`p-3 rounded-xl border cursor-pointer transition-all ${
                          selectedAmbulance?.id === ambulance.id
                            ? 'border-blue-500 bg-blue-50'
                            : 'border-gray-200 hover:border-gray-300 bg-white'
                        }`}
                      >
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <Truck className="w-4 h-4 text-blue-500" />
                            <span className="font-medium text-sm">{ambulance.vehicle_number}</span>
                          </div>
                          <Badge className={`${statusConfig.bgColor} ${statusConfig.color} text-xs`}>
                            {statusConfig.label}
                          </Badge>
                        </div>
                        <p className="text-xs text-gray-500 mb-1">{typeConfig.label}</p>
                        {ambulance.driver_name && (
                          <div className="flex items-center gap-1 text-xs text-gray-500">
                            <User className="w-3 h-3" />
                            {ambulance.driver_name}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </ScrollArea>

              <Button
                variant="outline"
                className="w-full mt-4"
                onClick={() => setShowAddAmbulance(true)}
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Ambulance
              </Button>
            </CardContent>
          </Card>

          {selectedAmbulance && (
            <Card className="border-0 shadow-sm">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-medium">Ambulance Details</CardTitle>
                  <Button variant="ghost" size="sm" onClick={() => setSelectedAmbulance(null)}>
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <p className="text-xs text-gray-500">Vehicle Number</p>
                  <p className="font-medium">{selectedAmbulance.vehicle_number}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Type</p>
                  <p className="font-medium">{selectedAmbulance.vehicle_type}</p>
                </div>
                {selectedAmbulance.driver_name && (
                  <div>
                    <p className="text-xs text-gray-500">Driver</p>
                    <p className="font-medium">{selectedAmbulance.driver_name}</p>
                    {selectedAmbulance.driver_phone && (
                      <p className="text-sm text-gray-500">{selectedAmbulance.driver_phone}</p>
                    )}
                  </div>
                )}
                {selectedAmbulance.paramedic_name && (
                  <div>
                    <p className="text-xs text-gray-500">Paramedic</p>
                    <p className="font-medium">{selectedAmbulance.paramedic_name}</p>
                  </div>
                )}
                <div className="pt-3 border-t space-y-2">
                  <p className="text-xs text-gray-500 mb-2">Update Status</p>
                  <div className="grid grid-cols-2 gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="gap-1"
                      onClick={() => handleUpdateAmbulanceStatus(selectedAmbulance.id, 'available')}
                      disabled={selectedAmbulance.status === 'available'}
                    >
                      <CheckCircle2 className="w-3 h-3" />
                      Available
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="gap-1"
                      onClick={() => handleUpdateAmbulanceStatus(selectedAmbulance.id, 'maintenance')}
                      disabled={selectedAmbulance.status === 'maintenance'}
                    >
                      <Wrench className="w-3 h-3" />
                      Maintenance
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        <div className="col-span-12 lg:col-span-8 space-y-4">
          <Card className="border-0 shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Phone className="w-4 h-4 text-red-500" />
                Active Requests ({requests.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {requests.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                  <Truck className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                  <p>No active requests</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {requests.map((request) => {
                    const priorityConfig = REQUEST_PRIORITY_CONFIG[request.priority];
                    const statusConfig = REQUEST_STATUS_CONFIG[request.status];
                    const isCritical = request.priority === 'critical';

                    return (
                      <div
                        key={request.id}
                        className={`p-4 rounded-xl border transition-all ${
                          isCritical
                            ? 'border-red-300 bg-red-50'
                            : 'border-gray-200 bg-white hover:border-gray-300'
                        }`}
                      >
                        <div className="flex items-start justify-between mb-3">
                          <div>
                            <div className="flex items-center gap-2 mb-1">
                              <span className="font-medium">{request.request_number}</span>
                              <Badge className={`${priorityConfig.bgColor} ${priorityConfig.color} text-xs`}>
                                {priorityConfig.label}
                              </Badge>
                              <Badge className={`${statusConfig.bgColor} ${statusConfig.color} text-xs`}>
                                {statusConfig.label}
                              </Badge>
                            </div>
                            <p className="text-sm text-gray-600">
                              {request.patient_name || request.patient?.full_name || 'Unknown Patient'}
                            </p>
                          </div>
                          <span className="text-xs text-gray-500">
                            {formatDistanceToNow(new Date(request.created_at), { addSuffix: true })}
                          </span>
                        </div>

                        <div className="grid grid-cols-2 gap-4 mb-3">
                          <div className="flex items-start gap-2">
                            <MapPin className="w-4 h-4 text-emerald-500 mt-0.5" />
                            <div>
                              <p className="text-xs text-gray-500">Pickup</p>
                              <p className="text-sm">{request.pickup_location}</p>
                            </div>
                          </div>
                          {request.dropoff_location && (
                            <div className="flex items-start gap-2">
                              <Navigation className="w-4 h-4 text-blue-500 mt-0.5" />
                              <div>
                                <p className="text-xs text-gray-500">Dropoff</p>
                                <p className="text-sm">{request.dropoff_location}</p>
                              </div>
                            </div>
                          )}
                        </div>

                        {request.patient_condition && (
                          <div className="flex items-start gap-2 mb-3 p-2 bg-gray-50 rounded-lg">
                            <AlertTriangle className="w-4 h-4 text-amber-500 mt-0.5" />
                            <div>
                              <p className="text-xs text-gray-500">Condition</p>
                              <p className="text-sm">{request.patient_condition}</p>
                            </div>
                          </div>
                        )}

                        {request.ambulance && (
                          <div className="flex items-center gap-2 mb-3 p-2 bg-blue-50 rounded-lg">
                            <Truck className="w-4 h-4 text-blue-500" />
                            <span className="text-sm font-medium">{request.ambulance.vehicle_number}</span>
                            {request.ambulance.driver_name && (
                              <>
                                <span className="text-gray-400">|</span>
                                <User className="w-3 h-3 text-gray-500" />
                                <span className="text-sm text-gray-600">{request.ambulance.driver_name}</span>
                              </>
                            )}
                          </div>
                        )}

                        <div className="flex items-center gap-2 pt-3 border-t">
                          {request.status === 'requested' && (
                            <Button
                              size="sm"
                              onClick={() => {
                                setSelectedRequest(request);
                                setShowAssignDialog(true);
                              }}
                              disabled={availableAmbulances.length === 0}
                              className="gap-1"
                            >
                              <Truck className="w-3 h-3" />
                              Assign Ambulance
                            </Button>
                          )}
                          {request.status === 'assigned' && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleUpdateStatus(request.id, 'dispatched')}
                              className="gap-1"
                            >
                              <ChevronRight className="w-3 h-3" />
                              Dispatch
                            </Button>
                          )}
                          {request.status === 'dispatched' && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleUpdateStatus(request.id, 'on_way')}
                              className="gap-1"
                            >
                              <Navigation className="w-3 h-3" />
                              On Way
                            </Button>
                          )}
                          {request.status === 'on_way' && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleUpdateStatus(request.id, 'arrived')}
                              className="gap-1"
                            >
                              <MapPin className="w-3 h-3" />
                              Arrived
                            </Button>
                          )}
                          {request.status === 'arrived' && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleUpdateStatus(request.id, 'picked_up')}
                              className="gap-1"
                            >
                              <User className="w-3 h-3" />
                              Picked Up
                            </Button>
                          )}
                          {(request.status === 'picked_up' || request.status === 'in_transit') && (
                            <Button
                              size="sm"
                              className="gap-1 bg-emerald-600 hover:bg-emerald-700"
                              onClick={() => handleCompleteRequest(request.id)}
                            >
                              <CheckCircle2 className="w-3 h-3" />
                              Complete
                            </Button>
                          )}
                          {request.patient_phone && (
                            <Button variant="ghost" size="sm" className="ml-auto gap-1">
                              <Phone className="w-3 h-3" />
                              {request.patient_phone}
                            </Button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="border-0 shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <MapPin className="w-4 h-4 text-blue-500" />
                Live Tracking
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[300px] bg-gradient-to-br from-gray-100 to-gray-50 rounded-xl flex items-center justify-center">
                <div className="text-center text-gray-500">
                  <MapPin className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                  <p className="font-medium">Map View</p>
                  <p className="text-sm">GPS tracking integration available</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <Dialog open={showAddAmbulance} onOpenChange={setShowAddAmbulance}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Add New Ambulance</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label>Vehicle Number *</Label>
              <Input
                value={newAmbulance.vehicle_number}
                onChange={(e) => setNewAmbulance({ ...newAmbulance, vehicle_number: e.target.value })}
                placeholder="e.g., GJ-05-AB-1234"
              />
            </div>
            <div>
              <Label>Vehicle Type</Label>
              <Select
                value={newAmbulance.vehicle_type}
                onValueChange={(v) => setNewAmbulance({ ...newAmbulance, vehicle_type: v as AmbulanceType })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Basic Life Support">Basic Life Support (BLS)</SelectItem>
                  <SelectItem value="Advanced Life Support">Advanced Life Support (ALS)</SelectItem>
                  <SelectItem value="ICU on Wheels">ICU on Wheels</SelectItem>
                  <SelectItem value="Patient Transport">Patient Transport</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Driver Name</Label>
              <Input
                value={newAmbulance.driver_name}
                onChange={(e) => setNewAmbulance({ ...newAmbulance, driver_name: e.target.value })}
              />
            </div>
            <div>
              <Label>Driver Phone</Label>
              <Input
                value={newAmbulance.driver_phone}
                onChange={(e) => setNewAmbulance({ ...newAmbulance, driver_phone: e.target.value })}
              />
            </div>
            <div>
              <Label>Paramedic Name</Label>
              <Input
                value={newAmbulance.paramedic_name}
                onChange={(e) => setNewAmbulance({ ...newAmbulance, paramedic_name: e.target.value })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddAmbulance(false)}>Cancel</Button>
            <Button onClick={handleAddAmbulance} disabled={!newAmbulance.vehicle_number}>
              Add Ambulance
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showNewRequest} onOpenChange={setShowNewRequest}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>New Ambulance Request</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4 max-h-[60vh] overflow-y-auto">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Request Type</Label>
                <Select
                  value={newRequest.request_type}
                  onValueChange={(v) => setNewRequest({ ...newRequest, request_type: v as RequestType })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pickup">Pickup</SelectItem>
                    <SelectItem value="emergency">Emergency</SelectItem>
                    <SelectItem value="transfer">Transfer</SelectItem>
                    <SelectItem value="scheduled">Scheduled</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Priority</Label>
                <Select
                  value={newRequest.priority}
                  onValueChange={(v) => setNewRequest({ ...newRequest, priority: v as RequestPriority })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="normal">Normal</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="critical">Critical</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <Label>Pickup Location *</Label>
              <Textarea
                value={newRequest.pickup_location}
                onChange={(e) => setNewRequest({ ...newRequest, pickup_location: e.target.value })}
                placeholder="Enter complete pickup address"
                rows={2}
              />
            </div>
            <div>
              <Label>Dropoff Location</Label>
              <Textarea
                value={newRequest.dropoff_location}
                onChange={(e) => setNewRequest({ ...newRequest, dropoff_location: e.target.value })}
                placeholder="Enter destination (leave empty if hospital)"
                rows={2}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Patient Name</Label>
                <Input
                  value={newRequest.patient_name}
                  onChange={(e) => setNewRequest({ ...newRequest, patient_name: e.target.value })}
                />
              </div>
              <div>
                <Label>Patient Phone</Label>
                <Input
                  value={newRequest.patient_phone}
                  onChange={(e) => setNewRequest({ ...newRequest, patient_phone: e.target.value })}
                />
              </div>
            </div>
            <div>
              <Label>Patient Condition</Label>
              <Textarea
                value={newRequest.patient_condition}
                onChange={(e) => setNewRequest({ ...newRequest, patient_condition: e.target.value })}
                placeholder="Describe patient's condition"
                rows={2}
              />
            </div>
            <div>
              <Label>Notes</Label>
              <Textarea
                value={newRequest.notes}
                onChange={(e) => setNewRequest({ ...newRequest, notes: e.target.value })}
                placeholder="Any additional instructions"
                rows={2}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowNewRequest(false)}>Cancel</Button>
            <Button onClick={handleCreateRequest} disabled={!newRequest.pickup_location} className="bg-red-600 hover:bg-red-700">
              Create Request
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showAssignDialog} onOpenChange={setShowAssignDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Assign Ambulance</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            {availableAmbulances.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <Truck className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                <p>No ambulances available</p>
              </div>
            ) : (
              <div className="space-y-2">
                {availableAmbulances.map((ambulance) => (
                  <Button
                    key={ambulance.id}
                    variant="outline"
                    onClick={() => handleAssignAmbulance(ambulance.id)}
                    className="w-full h-auto p-3 justify-start text-left hover:border-blue-500 hover:bg-blue-50 transition-all"
                  >
                    <div className="flex items-center justify-between w-full">
                      <div>
                        <p className="font-medium">{ambulance.vehicle_number}</p>
                        <p className="text-sm text-gray-500">{ambulance.vehicle_type}</p>
                      </div>
                      <div className="text-right text-sm text-gray-500">
                        {ambulance.driver_name && <p>{ambulance.driver_name}</p>}
                        {ambulance.driver_phone && <p>{ambulance.driver_phone}</p>}
                      </div>
                    </div>
                  </Button>
                ))}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
