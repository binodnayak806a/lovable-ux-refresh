export type AccountType = 'cash' | 'bank';
export type TransactionType = 'deposit' | 'withdraw' | 'bank_to_cash' | 'cash_to_bank' | 'bank_to_bank' | 'bill_payment' | 'refund' | 'adjustment';

export interface Account {
  id: string;
  name: string;
  type: AccountType;
  balance: number;
  accountNumber?: string;
  bankName?: string;
  ifscCode?: string;
  isDefault?: boolean;
  createdAt: string;
}

export interface Transaction {
  id: string;
  type: TransactionType;
  fromAccountId: string | null;
  toAccountId: string | null;
  amount: number;
  description: string;
  referenceNumber?: string;
  billId?: string;
  billNumber?: string;
  patientName?: string;
  date: string;
  createdAt: string;
}

export const TRANSACTION_TYPE_LABELS: Record<TransactionType, string> = {
  deposit: 'Deposit',
  withdraw: 'Withdrawal',
  bank_to_cash: 'Bank → Cash',
  cash_to_bank: 'Cash → Bank',
  bank_to_bank: 'Bank → Bank',
  bill_payment: 'Bill Payment',
  refund: 'Refund',
  adjustment: 'Adjustment',
};

export const TRANSACTION_TYPE_COLORS: Record<TransactionType, string> = {
  deposit: 'bg-emerald-100 text-emerald-700',
  withdraw: 'bg-red-100 text-red-700',
  bank_to_cash: 'bg-blue-100 text-blue-700',
  cash_to_bank: 'bg-indigo-100 text-indigo-700',
  bank_to_bank: 'bg-purple-100 text-purple-700',
  bill_payment: 'bg-amber-100 text-amber-700',
  refund: 'bg-orange-100 text-orange-700',
  adjustment: 'bg-gray-100 text-gray-700',
};

// Mock data
export const MOCK_ACCOUNTS: Account[] = [
  {
    id: 'cash-1',
    name: 'Cash in Hand',
    type: 'cash',
    balance: 45320,
    isDefault: true,
    createdAt: '2025-01-01T00:00:00Z',
  },
  {
    id: 'bank-1',
    name: 'HDFC Current A/c',
    type: 'bank',
    balance: 234500,
    accountNumber: '50100XXXX1234',
    bankName: 'HDFC Bank',
    ifscCode: 'HDFC0001234',
    isDefault: true,
    createdAt: '2025-01-01T00:00:00Z',
  },
  {
    id: 'bank-2',
    name: 'SBI Savings A/c',
    type: 'bank',
    balance: 87650,
    accountNumber: '30572XXXX5678',
    bankName: 'State Bank of India',
    ifscCode: 'SBIN0005678',
    createdAt: '2025-02-15T00:00:00Z',
  },
  {
    id: 'bank-3',
    name: 'ICICI Business A/c',
    type: 'bank',
    balance: 156200,
    accountNumber: '12345XXXX9012',
    bankName: 'ICICI Bank',
    ifscCode: 'ICIC0009012',
    createdAt: '2025-03-01T00:00:00Z',
  },
];

export const MOCK_TRANSACTIONS: Transaction[] = [
  {
    id: 'txn-1',
    type: 'bill_payment',
    fromAccountId: null,
    toAccountId: 'cash-1',
    amount: 1500,
    description: 'OPD Bill Payment - Consultation',
    billId: 'bill-001',
    billNumber: 'INV-2025-0042',
    patientName: 'Rajesh Kumar',
    date: '2025-03-08T10:30:00Z',
    createdAt: '2025-03-08T10:30:00Z',
  },
  {
    id: 'txn-2',
    type: 'cash_to_bank',
    fromAccountId: 'cash-1',
    toAccountId: 'bank-1',
    amount: 25000,
    description: 'Daily cash deposit to HDFC',
    date: '2025-03-07T17:00:00Z',
    createdAt: '2025-03-07T17:00:00Z',
  },
  {
    id: 'txn-3',
    type: 'bill_payment',
    fromAccountId: null,
    toAccountId: 'bank-1',
    amount: 8500,
    description: 'IPD Bill Payment - Room + Surgery',
    billId: 'bill-002',
    billNumber: 'INV-2025-0041',
    patientName: 'Priya Sharma',
    date: '2025-03-07T14:15:00Z',
    createdAt: '2025-03-07T14:15:00Z',
  },
  {
    id: 'txn-4',
    type: 'bank_to_cash',
    fromAccountId: 'bank-1',
    toAccountId: 'cash-1',
    amount: 10000,
    description: 'Petty cash withdrawal',
    date: '2025-03-06T09:00:00Z',
    createdAt: '2025-03-06T09:00:00Z',
  },
  {
    id: 'txn-5',
    type: 'withdraw',
    fromAccountId: 'bank-2',
    toAccountId: null,
    amount: 5000,
    description: 'Medical supplies purchase',
    referenceNumber: 'CHQ-7892',
    date: '2025-03-05T11:30:00Z',
    createdAt: '2025-03-05T11:30:00Z',
  },
  {
    id: 'txn-6',
    type: 'bank_to_bank',
    fromAccountId: 'bank-2',
    toAccountId: 'bank-1',
    amount: 50000,
    description: 'Fund transfer to current account',
    referenceNumber: 'NEFT-88234',
    date: '2025-03-04T15:45:00Z',
    createdAt: '2025-03-04T15:45:00Z',
  },
  {
    id: 'txn-7',
    type: 'deposit',
    fromAccountId: null,
    toAccountId: 'bank-3',
    amount: 75000,
    description: 'Insurance settlement received',
    referenceNumber: 'INS-CLM-2025-112',
    date: '2025-03-03T12:00:00Z',
    createdAt: '2025-03-03T12:00:00Z',
  },
  {
    id: 'txn-8',
    type: 'bill_payment',
    fromAccountId: null,
    toAccountId: 'cash-1',
    amount: 2500,
    description: 'Lab Test Payment - Blood Panel',
    billId: 'bill-003',
    billNumber: 'INV-2025-0040',
    patientName: 'Amit Patel',
    date: '2025-03-03T09:20:00Z',
    createdAt: '2025-03-03T09:20:00Z',
  },
];
