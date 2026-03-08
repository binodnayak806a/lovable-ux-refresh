import { useState } from 'react';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import type { Account, TransactionType, Transaction } from '../types';

type TransferMode = 'bank_to_cash' | 'cash_to_bank' | 'bank_to_bank' | 'deposit' | 'withdraw' | 'adjustment';

const MODE_LABELS: Record<TransferMode, string> = {
  bank_to_cash: 'Bank to Cash Transfer',
  cash_to_bank: 'Cash to Bank Transfer',
  bank_to_bank: 'Bank to Bank Transfer',
  deposit: 'Deposit',
  withdraw: 'Withdrawal',
  adjustment: 'Adjust Balance',
};

interface Props {
  open: boolean;
  mode: TransferMode | null;
  accounts: Account[];
  onClose: () => void;
  onSubmit: (txn: Omit<Transaction, 'id' | 'createdAt'>) => void;
}

export default function TransferDialog({ open, mode, accounts, onClose, onSubmit }: Props) {
  const [fromId, setFromId] = useState('');
  const [toId, setToId] = useState('');
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [reference, setReference] = useState('');

  const cashAccounts = accounts.filter(a => a.type === 'cash');
  const bankAccounts = accounts.filter(a => a.type === 'bank');

  const reset = () => {
    setFromId(''); setToId(''); setAmount(''); setDescription(''); setReference('');
  };

  const handleClose = () => { reset(); onClose(); };

  const handleSubmit = () => {
    if (!amount || parseFloat(amount) <= 0) return;

    const txn: Omit<Transaction, 'id' | 'createdAt'> = {
      type: (mode || 'adjustment') as TransactionType,
      fromAccountId: fromId || null,
      toAccountId: toId || null,
      amount: parseFloat(amount),
      description: description || MODE_LABELS[mode || 'adjustment'],
      referenceNumber: reference || undefined,
      date: new Date().toISOString(),
    };

    onSubmit(txn);
    handleClose();
  };

  if (!mode) return null;

  const showFrom = ['bank_to_cash', 'cash_to_bank', 'bank_to_bank', 'withdraw'].includes(mode);
  const showTo = ['bank_to_cash', 'cash_to_bank', 'bank_to_bank', 'deposit'].includes(mode);

  const fromOptions = mode === 'cash_to_bank' ? cashAccounts : bankAccounts;
  const toOptions = mode === 'bank_to_cash' ? cashAccounts : mode === 'bank_to_bank' ? bankAccounts.filter(a => a.id !== fromId) : mode === 'cash_to_bank' ? bankAccounts : mode === 'deposit' ? [...cashAccounts, ...bankAccounts] : [];

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-base">{MODE_LABELS[mode]}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          {showFrom && (
            <div className="space-y-1.5">
              <Label className="text-xs">From Account</Label>
              <Select value={fromId} onValueChange={setFromId}>
                <SelectTrigger className="h-9 text-xs"><SelectValue placeholder="Select account" /></SelectTrigger>
                <SelectContent>
                  {fromOptions.map(a => (
                    <SelectItem key={a.id} value={a.id}>{a.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
          {showTo && (
            <div className="space-y-1.5">
              <Label className="text-xs">To Account</Label>
              <Select value={toId} onValueChange={setToId}>
                <SelectTrigger className="h-9 text-xs"><SelectValue placeholder="Select account" /></SelectTrigger>
                <SelectContent>
                  {toOptions.map(a => (
                    <SelectItem key={a.id} value={a.id}>{a.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
          {mode === 'adjustment' && (
            <div className="space-y-1.5">
              <Label className="text-xs">Account</Label>
              <Select value={toId} onValueChange={setToId}>
                <SelectTrigger className="h-9 text-xs"><SelectValue placeholder="Select account" /></SelectTrigger>
                <SelectContent>
                  {accounts.map(a => (
                    <SelectItem key={a.id} value={a.id}>{a.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
          <div className="space-y-1.5">
            <Label className="text-xs">Amount (₹)</Label>
            <Input
              type="number"
              min="0"
              step="0.01"
              value={amount}
              onChange={e => setAmount(e.target.value)}
              placeholder="0.00"
              className="h-9 text-sm font-mono"
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Reference / Txn ID (optional)</Label>
            <Input
              value={reference}
              onChange={e => setReference(e.target.value)}
              placeholder="e.g. NEFT-12345"
              className="h-9 text-xs"
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Description</Label>
            <Textarea
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="Optional note..."
              rows={2}
              className="text-xs resize-none"
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" size="sm" onClick={handleClose}>Cancel</Button>
          <Button size="sm" onClick={handleSubmit} disabled={!amount || parseFloat(amount) <= 0}>
            Confirm
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
