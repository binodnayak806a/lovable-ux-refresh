import { useState, useCallback } from 'react';
import { Landmark, ChevronDown } from 'lucide-react';
import { usePageTitle } from '@/hooks/usePageTitle';
import PageHeader from '@/components/shared/PageHeader';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import AccountsList from './components/AccountsList';
import TransactionTable from './components/TransactionTable';
import TransferDialog from './components/TransferDialog';
import AddAccountDialog from './components/AddAccountDialog';
import { MOCK_ACCOUNTS, MOCK_TRANSACTIONS } from './types';
import type { Account, Transaction } from './types';

type TransferMode = 'bank_to_cash' | 'cash_to_bank' | 'bank_to_bank' | 'deposit' | 'withdraw' | 'adjustment';

export default function CashBankPage() {
  usePageTitle('Cash & Bank');

  const [accounts, setAccounts] = useState<Account[]>(MOCK_ACCOUNTS);
  const [transactions, setTransactions] = useState<Transaction[]>(MOCK_TRANSACTIONS);
  const [selectedAccountId, setSelectedAccountId] = useState<string | null>(MOCK_ACCOUNTS[0]?.id ?? null);
  const [search, setSearch] = useState('');

  const [transferMode, setTransferMode] = useState<TransferMode | null>(null);
  const [transferOpen, setTransferOpen] = useState(false);
  const [addAccountOpen, setAddAccountOpen] = useState(false);

  const openTransfer = (mode: TransferMode) => {
    setTransferMode(mode);
    setTransferOpen(true);
  };

  const handleTransfer = useCallback((txn: Omit<Transaction, 'id' | 'createdAt'>) => {
    const newTxn: Transaction = {
      ...txn,
      id: `txn-${Date.now()}`,
      createdAt: new Date().toISOString(),
    };
    setTransactions(prev => [newTxn, ...prev]);

    // Update balances
    setAccounts(prev => prev.map(acc => {
      if (txn.fromAccountId === acc.id) return { ...acc, balance: acc.balance - txn.amount };
      if (txn.toAccountId === acc.id) return { ...acc, balance: acc.balance + txn.amount };
      return acc;
    }));
  }, []);

  const handleAddAccount = useCallback((data: Omit<Account, 'id' | 'createdAt'>) => {
    const newAcc: Account = {
      ...data,
      id: `acc-${Date.now()}`,
      createdAt: new Date().toISOString(),
    };
    setAccounts(prev => [...prev, newAcc]);
  }, []);

  return (
    <div className="space-y-4">
      <PageHeader
        title="Cash & Bank"
        subtitle="Manage cash, bank accounts, and fund transfers"
        icon={Landmark}
        actions={
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button size="sm" className="gap-1.5 bg-rose-500 hover:bg-rose-600">
                Deposit / Withdraw
                <ChevronDown className="h-3.5 w-3.5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-52">
              <DropdownMenuItem onClick={() => openTransfer('bank_to_cash')}>
                Bank to Cash Transfer
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => openTransfer('cash_to_bank')}>
                Cash to Bank Transfer
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => openTransfer('bank_to_bank')}>
                Bank to Bank Transfer
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => openTransfer('adjustment')}>
                Adjust Bank Balance
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        }
      />

      {/* Split layout like reference */}
      <div className="flex border border-border/50 rounded-xl bg-card overflow-hidden" style={{ height: 'calc(100vh - 180px)' }}>
        {/* Left: Accounts list */}
        <div className="w-72 shrink-0">
          <AccountsList
            accounts={accounts}
            selectedId={selectedAccountId}
            onSelect={setSelectedAccountId}
            onAddAccount={() => setAddAccountOpen(true)}
          />
        </div>

        {/* Right: Transactions */}
        <div className="flex-1 min-w-0">
          <TransactionTable
            transactions={transactions}
            accounts={accounts}
            selectedAccountId={selectedAccountId}
            search={search}
            onSearchChange={setSearch}
          />
        </div>
      </div>

      <TransferDialog
        open={transferOpen}
        mode={transferMode}
        accounts={accounts}
        onClose={() => { setTransferOpen(false); setTransferMode(null); }}
        onSubmit={handleTransfer}
      />

      <AddAccountDialog
        open={addAccountOpen}
        onClose={() => setAddAccountOpen(false)}
        onSubmit={handleAddAccount}
      />
    </div>
  );
}
