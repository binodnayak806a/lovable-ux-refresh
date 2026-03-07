import { useState } from 'react';
import { format } from 'date-fns';
import { Plus, Check, X, Clock, CheckCircle2, XCircle } from 'lucide-react';
import { Badge } from '../../../components/ui/badge';
import { Button } from '../../../components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../../../components/ui/table';
import { supabase } from '../../../lib/supabase';
import { toast } from 'sonner';
import LeaveRequestDialog from './LeaveRequestDialog';
import type { Staff, LeaveRequest } from '../types';

interface LeaveTabProps {
  staff: Staff[];
  leaves: LeaveRequest[];
  onRefresh: () => void;
  currentUserId: string;
}

const STATUS_CONFIG = {
  pending: { label: 'Pending', icon: Clock, color: 'bg-amber-50 text-amber-700 border-amber-200' },
  approved: { label: 'Approved', icon: CheckCircle2, color: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  rejected: { label: 'Rejected', icon: XCircle, color: 'bg-red-50 text-red-700 border-red-200' },
};

export default function LeaveTab({ staff, leaves, onRefresh, currentUserId }: LeaveTabProps) {
  const [showDialog, setShowDialog] = useState(false);
  const [actioning, setActioning] = useState<string | null>(null);

  const handleSave = async (data: {
    staff_id: string;
    leave_type: string;
    from_date: string;
    to_date: string;
    total_days: number;
    reason: string;
  }) => {
    const { error } = await supabase.from('leave_requests').insert(data as never);
    if (error) { toast.error('Failed to submit leave request'); return; }
    toast.success('Leave request submitted');
    setShowDialog(false);
    onRefresh();
  };

  const handleApprove = async (id: string, status: 'approved' | 'rejected') => {
    setActioning(id);
    try {
      const { error } = await supabase
        .from('leave_requests')
        .update({ status, approved_by: currentUserId } as never)
        .eq('id', id);
      if (error) throw error;
      toast.success(`Leave request ${status}`);
      onRefresh();
    } catch {
      toast.error('Failed to update leave request');
    } finally {
      setActioning(null);
    }
  };

  const pending = leaves.filter(l => l.status === 'pending');
  const others = leaves.filter(l => l.status !== 'pending');

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div className="flex gap-3">
          <div className="text-center px-4 py-2 bg-amber-50 rounded-lg border border-amber-200">
            <div className="text-2xl font-bold text-amber-700">{pending.length}</div>
            <div className="text-xs text-amber-600">Pending</div>
          </div>
          <div className="text-center px-4 py-2 bg-emerald-50 rounded-lg border border-emerald-200">
            <div className="text-2xl font-bold text-emerald-700">{leaves.filter(l => l.status === 'approved').length}</div>
            <div className="text-xs text-emerald-600">Approved</div>
          </div>
          <div className="text-center px-4 py-2 bg-red-50 rounded-lg border border-red-200">
            <div className="text-2xl font-bold text-red-700">{leaves.filter(l => l.status === 'rejected').length}</div>
            <div className="text-xs text-red-600">Rejected</div>
          </div>
        </div>
        <Button onClick={() => setShowDialog(true)}>
          <Plus className="h-4 w-4 mr-1.5" />
          New Request
        </Button>
      </div>

      {pending.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold text-amber-700 mb-3 flex items-center gap-1.5">
            <Clock className="h-4 w-4" /> Pending Approvals
          </h3>
          <div className="rounded-lg border border-amber-200 overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="bg-amber-50">
                  <TableHead>Staff</TableHead>
                  <TableHead>Leave Type</TableHead>
                  <TableHead>Period</TableHead>
                  <TableHead>Days</TableHead>
                  <TableHead>Reason</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pending.map(l => (
                  <TableRow key={l.id}>
                    <TableCell>
                      <div className="font-medium">{l.staff?.first_name} {l.staff?.last_name}</div>
                      <div className="text-xs text-muted-foreground">{l.staff?.designation}</div>
                    </TableCell>
                    <TableCell className="text-sm">{l.leave_type}</TableCell>
                    <TableCell className="text-sm">
                      {format(new Date(l.from_date), 'dd MMM')} — {format(new Date(l.to_date), 'dd MMM yyyy')}
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary">{l.total_days}d</Badge>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground max-w-[180px] truncate">{l.reason || '—'}</TableCell>
                    <TableCell>
                      <div className="flex gap-1.5">
                        <Button
                          size="sm"
                          className="h-7 px-2 bg-emerald-600 hover:bg-emerald-700 text-white"
                          disabled={actioning === l.id}
                          onClick={() => handleApprove(l.id, 'approved')}
                        >
                          <Check className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-7 px-2 text-red-600 border-red-300 hover:bg-red-50"
                          disabled={actioning === l.id}
                          onClick={() => handleApprove(l.id, 'rejected')}
                        >
                          <X className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      )}

      {others.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold text-muted-foreground mb-3">Leave History</h3>
          <div className="rounded-lg border overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="bg-slate-50">
                  <TableHead>Staff</TableHead>
                  <TableHead>Leave Type</TableHead>
                  <TableHead>Period</TableHead>
                  <TableHead>Days</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Applied</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {others.map(l => {
                  const cfg = STATUS_CONFIG[l.status as keyof typeof STATUS_CONFIG];
                  return (
                    <TableRow key={l.id} className="hover:bg-slate-50/50">
                      <TableCell>
                        <div className="font-medium">{l.staff?.first_name} {l.staff?.last_name}</div>
                        <div className="text-xs text-muted-foreground">{l.staff?.designation}</div>
                      </TableCell>
                      <TableCell className="text-sm">{l.leave_type}</TableCell>
                      <TableCell className="text-sm">
                        {format(new Date(l.from_date), 'dd MMM')} — {format(new Date(l.to_date), 'dd MMM yyyy')}
                      </TableCell>
                      <TableCell><Badge variant="secondary">{l.total_days}d</Badge></TableCell>
                      <TableCell>
                        {cfg && (
                          <Badge variant="outline" className={`${cfg.color} text-xs`}>
                            <cfg.icon className="h-3 w-3 mr-1" />
                            {cfg.label}
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {format(new Date(l.created_at), 'dd MMM yyyy')}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </div>
      )}

      <LeaveRequestDialog
        open={showDialog}
        onClose={() => setShowDialog(false)}
        onSave={handleSave}
        staffList={staff}
      />
    </div>
  );
}
