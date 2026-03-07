export interface PharmacyInventory {
  id: string;
  hospital_id: string;
  medication_id: string;
  batch_number: string;
  expiry_date: string;
  quantity_in_stock: number;
  reorder_level: number;
  supplier_name: string | null;
  purchase_price: number;
  selling_price: number;
  last_updated: string;
  created_at: string;
  medication?: Medication;
}

export interface Medication {
  id: string;
  generic_name: string;
  brand_name: string | null;
  form: string;
  strength: string;
  manufacturer: string | null;
}

export interface PharmacyTransaction {
  id: string;
  hospital_id: string;
  transaction_type: TransactionType;
  medication_id: string;
  batch_number: string | null;
  quantity: number;
  unit_price: number;
  total_amount: number;
  patient_id: string | null;
  prescription_id: string | null;
  notes: string | null;
  transaction_date: string;
  performed_by: string | null;
  created_at: string;
  medication?: Medication;
  patient?: { full_name: string; uhid: string };
}

export type TransactionType = 'purchase' | 'sale' | 'return' | 'wastage' | 'adjustment';

export interface InventoryFormData {
  medication_id: string;
  batch_number: string;
  expiry_date: string;
  quantity_in_stock: number;
  reorder_level: number;
  supplier_name: string;
  purchase_price: number;
  selling_price: number;
}

export interface TransactionFormData {
  transaction_type: TransactionType;
  medication_id: string;
  batch_number: string;
  quantity: number;
  unit_price: number;
  patient_id?: string;
  prescription_id?: string;
  notes: string;
}

export interface InventoryAlert {
  type: 'low_stock' | 'expiring' | 'expired';
  count: number;
  items: PharmacyInventory[];
}

export interface PharmacyStats {
  totalItems: number;
  lowStockCount: number;
  expiringCount: number;
  totalValue: number;
}

export const TRANSACTION_TYPE_CONFIG: Record<TransactionType, { label: string; color: string; sign: number }> = {
  purchase: { label: 'Purchase', color: 'bg-emerald-100 text-emerald-700', sign: 1 },
  sale: { label: 'Sale', color: 'bg-blue-100 text-blue-700', sign: -1 },
  return: { label: 'Return', color: 'bg-amber-100 text-amber-700', sign: 1 },
  wastage: { label: 'Wastage', color: 'bg-red-100 text-red-700', sign: -1 },
  adjustment: { label: 'Adjustment', color: 'bg-gray-100 text-gray-700', sign: 0 },
};

export const EMPTY_INVENTORY_FORM: InventoryFormData = {
  medication_id: '',
  batch_number: '',
  expiry_date: '',
  quantity_in_stock: 0,
  reorder_level: 10,
  supplier_name: '',
  purchase_price: 0,
  selling_price: 0,
};
