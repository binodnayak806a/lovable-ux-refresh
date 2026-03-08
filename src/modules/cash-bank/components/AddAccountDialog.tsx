import { useState } from 'react';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import type { Account, AccountType } from '../types';

interface Props {
  open: boolean;
  onClose: () => void;
  onSubmit: (account: Omit<Account, 'id' | 'createdAt'>) => void;
}

export default function AddAccountDialog({ open, onClose, onSubmit }: Props) {
  const [type, setType] = useState<AccountType>('bank');
  const [name, setName] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [bankName, setBankName] = useState('');
  const [ifsc, setIfsc] = useState('');
  const [balance, setBalance] = useState('0');

  const reset = () => {
    setType('bank'); setName(''); setAccountNumber(''); setBankName(''); setIfsc(''); setBalance('0');
  };

  const handleClose = () => { reset(); onClose(); };

  const handleSubmit = () => {
    if (!name.trim()) return;
    onSubmit({
      name: name.trim(),
      type,
      balance: parseFloat(balance) || 0,
      accountNumber: type === 'bank' ? accountNumber : undefined,
      bankName: type === 'bank' ? bankName : undefined,
      ifscCode: type === 'bank' ? ifsc : undefined,
    });
    handleClose();
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-base">Add Account</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="space-y-1.5">
            <Label className="text-xs">Account Type</Label>
            <Select value={type} onValueChange={v => setType(v as AccountType)}>
              <SelectTrigger className="h-9 text-xs"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="cash">Cash</SelectItem>
                <SelectItem value="bank">Bank</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Account Name</Label>
            <Input value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Petty Cash" className="h-9 text-xs" />
          </div>
          {type === 'bank' && (
            <>
              <div className="space-y-1.5">
                <Label className="text-xs">Bank Name</Label>
                <Input value={bankName} onChange={e => setBankName(e.target.value)} placeholder="e.g. HDFC Bank" className="h-9 text-xs" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs">Account Number</Label>
                  <Input value={accountNumber} onChange={e => setAccountNumber(e.target.value)} placeholder="XXXXXXXXX" className="h-9 text-xs font-mono" />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">IFSC Code</Label>
                  <Input value={ifsc} onChange={e => setIfsc(e.target.value)} placeholder="HDFC0001234" className="h-9 text-xs font-mono" />
                </div>
              </div>
            </>
          )}
          <div className="space-y-1.5">
            <Label className="text-xs">Opening Balance (₹)</Label>
            <Input type="number" value={balance} onChange={e => setBalance(e.target.value)} placeholder="0" className="h-9 text-sm font-mono" />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" size="sm" onClick={handleClose}>Cancel</Button>
          <Button size="sm" onClick={handleSubmit} disabled={!name.trim()}>Add Account</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
