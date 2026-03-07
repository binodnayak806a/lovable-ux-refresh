import { useState, useRef } from 'react';
import {
  CheckCircle2, Loader2, FileText, Printer, AlertTriangle,
} from 'lucide-react';
import { Button } from '../../../components/ui/button';
import { Badge } from '../../../components/ui/badge';
import { Card, CardContent } from '../../../components/ui/card';
import { useAppSelector } from '../../../store';
import { useToast } from '../../../hooks/useToast';
import labService from '../../../services/lab.service';
import { format, parseISO } from 'date-fns';
import type { LabOrder, OrderStatus, LabOrderItem } from '../types';
import { STATUS_CONFIG } from '../types';

interface ResultEntryProps {
  order: LabOrder;
  onClose: () => void;
  onUpdated: () => void;
}

export default function ResultEntry({ order, onClose, onUpdated }: ResultEntryProps) {
  const { user } = useAppSelector((s) => s.auth);
  const { toast } = useToast();
  const printRef = useRef<HTMLDivElement>(null);

  const [currentOrder, setCurrentOrder] = useState<LabOrder>(order);
  const [saving, setSaving] = useState(false);
  const [resultInputs, setResultInputs] = useState<Record<string, { value: string; abnormal: boolean }>>(
    () => {
      const initial: Record<string, { value: string; abnormal: boolean }> = {};
      order.items?.forEach(item => {
        initial[item.id] = { value: item.result_value || '', abnormal: item.is_abnormal };
      });
      return initial;
    }
  );

  const handleSaveResult = async (item: LabOrderItem) => {
    const input = resultInputs[item.id];
    if (!input?.value) {
      toast('Enter Result', { description: 'Please enter a result value', type: 'warning' });
      return;
    }

    setSaving(true);
    try {
      const isAbnormal = checkAbnormal(input.value, item.normal_range) || input.abnormal;

      await labService.enterResult(item.id, {
        result_value: input.value,
        result_unit: '',
        is_abnormal: isAbnormal,
        remarks: '',
      }, user?.id ?? '');

      const updated = await labService.getOrder(currentOrder.id);
      if (updated) setCurrentOrder(updated);
      onUpdated();
      toast('Result Saved', { type: 'success' });
    } catch {
      toast('Error', { description: 'Failed to save result', type: 'error' });
    } finally {
      setSaving(false);
    }
  };

  const handleCompleteOrder = async () => {
    try {
      await labService.completeOrder(currentOrder.id, user?.id ?? '');
      toast('Order Completed', { description: 'Lab report is ready', type: 'success' });
      onUpdated();
      onClose();
    } catch (err) {
      toast('Error', { description: (err as Error).message || 'Failed to complete order', type: 'error' });
    }
  };

  const checkAbnormal = (value: string, normalRange: string | null): boolean => {
    if (!normalRange) return false;
    const num = parseFloat(value);
    if (isNaN(num)) return false;

    const rangeMatch = normalRange.match(/([\d.]+)\s*[-–]\s*([\d.]+)/);
    if (rangeMatch) {
      const low = parseFloat(rangeMatch[1]);
      const high = parseFloat(rangeMatch[2]);
      return num < low || num > high;
    }

    const ltMatch = normalRange.match(/<\s*([\d.]+)/);
    if (ltMatch) return num >= parseFloat(ltMatch[1]);

    const gtMatch = normalRange.match(/>\s*([\d.]+)/);
    if (gtMatch) return num <= parseFloat(gtMatch[1]);

    return false;
  };

  const handlePrint = () => {
    const content = printRef.current;
    if (!content) return;
    const win = window.open('', '_blank');
    if (!win) return;
    win.document.write(`
      <html><head><title>Lab Report - ${currentOrder.order_number}</title>
      <style>
        body { font-family: Arial, sans-serif; padding: 20px; font-size: 12px; }
        table { width: 100%; border-collapse: collapse; margin: 10px 0; }
        th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
        th { background: #f5f5f5; font-weight: 600; }
        .text-right { text-align: right; }
        .header { text-align: center; margin-bottom: 20px; }
        .abnormal { color: red; font-weight: bold; }
        .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 5px; margin-bottom: 15px; }
      </style></head><body>${content.innerHTML}</body></html>
    `);
    win.document.close();
    win.print();
  };

  const allCompleted = currentOrder.items?.every(i => i.status === 'completed') ?? false;
  const statusConfig = STATUS_CONFIG[currentOrder.status as OrderStatus];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
            <FileText className="w-5 h-5 text-blue-500" />
            {currentOrder.order_number}
          </h3>
          <Badge className={`mt-1 ${statusConfig?.color}`}>{statusConfig?.label}</Badge>
        </div>
        <div className="flex gap-2">
          {currentOrder.status === 'completed' && (
            <Button variant="outline" size="sm" onClick={handlePrint} className="gap-1.5">
              <Printer className="w-3.5 h-3.5" />
              Print Report
            </Button>
          )}
          <Button variant="outline" size="sm" onClick={onClose}>Back to Orders</Button>
        </div>
      </div>

      <Card className="border-0 shadow-sm">
        <CardContent className="p-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
            <div>
              <span className="text-gray-500 block text-xs">Patient</span>
              <span className="font-medium">{currentOrder.patient?.full_name}</span>
            </div>
            <div>
              <span className="text-gray-500 block text-xs">UHID</span>
              <span className="font-medium">{currentOrder.patient?.uhid}</span>
            </div>
            <div>
              <span className="text-gray-500 block text-xs">Order Date</span>
              <span className="font-medium">{format(parseISO(currentOrder.order_date), 'dd MMM yyyy')}</span>
            </div>
            <div>
              <span className="text-gray-500 block text-xs">Doctor</span>
              <span className="font-medium">{currentOrder.doctor?.full_name ? `Dr. ${currentOrder.doctor.full_name}` : '-'}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="space-y-3">
        {currentOrder.items?.map((item) => {
          const input = resultInputs[item.id] || { value: '', abnormal: false };
          const isCompleted = item.status === 'completed';
          const isAbnormal = isCompleted ? item.is_abnormal : (input.value ? checkAbnormal(input.value, item.normal_range) || input.abnormal : false);

          return (
            <Card key={item.id} className={`border shadow-sm ${isAbnormal && (isCompleted || input.value) ? 'border-red-200 bg-red-50/30' : ''}`}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h4 className="font-medium text-gray-800">{item.test_name}</h4>
                    {item.normal_range && (
                      <p className="text-xs text-gray-500 mt-0.5">Normal Range: {item.normal_range}</p>
                    )}
                  </div>
                  <Badge className={isCompleted ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-700'}>
                    {isCompleted ? 'Completed' : 'Pending'}
                  </Badge>
                </div>

                {isCompleted ? (
                  <div className={`p-3 rounded-lg ${item.is_abnormal ? 'bg-red-50 border border-red-200' : 'bg-gray-50'}`}>
                    <div className="flex items-center gap-2">
                      <p className={`text-lg font-semibold ${item.is_abnormal ? 'text-red-600' : 'text-gray-800'}`}>
                        {item.result_value} {item.result_unit}
                      </p>
                      {item.is_abnormal && (
                        <AlertTriangle className="w-4 h-4 text-red-500" />
                      )}
                    </div>
                    {item.is_abnormal && (
                      <p className="text-xs text-red-500 mt-1">Value outside normal range</p>
                    )}
                  </div>
                ) : currentOrder.status === 'processing' ? (
                  <div className="flex items-center gap-3">
                    <input
                      type="text"
                      value={input.value}
                      onChange={(e) => setResultInputs(prev => ({
                        ...prev,
                        [item.id]: { ...prev[item.id], value: e.target.value }
                      }))}
                      placeholder="Enter result value"
                      className={`flex-1 h-9 px-3 rounded-lg border text-sm outline-none focus:border-blue-400 ${
                        input.value && checkAbnormal(input.value, item.normal_range)
                          ? 'border-red-300 bg-red-50 text-red-700'
                          : 'border-gray-200'
                      }`}
                    />
                    {input.value && checkAbnormal(input.value, item.normal_range) && (
                      <span className="text-xs text-red-600 font-medium flex items-center gap-1">
                        <AlertTriangle className="w-3 h-3" />
                        Abnormal
                      </span>
                    )}
                    <Button
                      size="sm"
                      onClick={() => handleSaveResult(item)}
                      disabled={saving || !input.value}
                      className="bg-blue-600 hover:bg-blue-700"
                    >
                      {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Save'}
                    </Button>
                  </div>
                ) : (
                  <p className="text-sm text-gray-400 italic">Awaiting sample processing</p>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {currentOrder.status === 'processing' && allCompleted && (
        <Button onClick={handleCompleteOrder} className="w-full bg-emerald-600 hover:bg-emerald-700 gap-2">
          <CheckCircle2 className="w-4 h-4" />
          Complete Order & Generate Report
        </Button>
      )}

      <div className="hidden">
        <div ref={printRef}>
          <div className="header">
            <h2 style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '5px' }}>LABORATORY REPORT</h2>
            <p style={{ color: '#666' }}>Report No: {currentOrder.order_number}</p>
          </div>
          <div className="info-grid" style={{ fontSize: '12px' }}>
            <div><strong>Patient:</strong> {currentOrder.patient?.full_name}</div>
            <div><strong>UHID:</strong> {currentOrder.patient?.uhid}</div>
            <div><strong>Date:</strong> {format(parseISO(currentOrder.order_date), 'dd MMM yyyy')}</div>
            <div><strong>Doctor:</strong> {currentOrder.doctor?.full_name ? `Dr. ${currentOrder.doctor.full_name}` : '-'}</div>
          </div>
          <table>
            <thead>
              <tr>
                <th>Test Name</th>
                <th>Result</th>
                <th>Normal Range</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {currentOrder.items?.map((item) => (
                <tr key={item.id}>
                  <td>{item.test_name}</td>
                  <td className={item.is_abnormal ? 'abnormal' : ''}>
                    {item.result_value || '-'} {item.result_unit || ''}
                    {item.is_abnormal && ' *'}
                  </td>
                  <td>{item.normal_range || '-'}</td>
                  <td>{item.status}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {currentOrder.reported_at && (
            <p style={{ fontSize: '11px', color: '#666', marginTop: '10px' }}>
              Reported on: {format(parseISO(currentOrder.reported_at), 'dd MMM yyyy, HH:mm')}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
