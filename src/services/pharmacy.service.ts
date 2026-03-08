import { mockMasterStore } from '../lib/mockMasterStore';
import { mockStore } from '../lib/mockStore';
import type {
  PharmacyInventory,
  PharmacyTransaction,
  InventoryFormData,
  TransactionFormData,
  PharmacyStats,
  Medication,
} from '../modules/pharmacy/types';
import { addMonths } from 'date-fns';

const pharmacyService = {
  async getInventory(hospitalId: string, search?: string): Promise<PharmacyInventory[]> {
    let items = mockMasterStore.getAll<Record<string, unknown>>('pharmacy_inventory', hospitalId);
    if (search) {
      const q = search.toLowerCase();
      items = items.filter(i =>
        ((i.medication_name as string) || '').toLowerCase().includes(q) ||
        ((i.batch_number as string) || '').toLowerCase().includes(q)
      );
    }
    // Attach medication info
    return items.map(i => {
      const med = i.medication_id
        ? mockMasterStore.getById('medications', i.medication_id as string)
        : null;
      return { ...i, medication: med } as unknown as PharmacyInventory;
    });
  },

  async getLowStockItems(hospitalId: string): Promise<PharmacyInventory[]> {
    const items = mockMasterStore.getAll<Record<string, unknown>>('pharmacy_inventory', hospitalId);
    return items.filter(i =>
      (i.quantity_in_stock as number) > 0 && (i.quantity_in_stock as number) <= (i.reorder_level as number)
    ) as unknown as PharmacyInventory[];
  },

  async getExpiringItems(hospitalId: string, monthsAhead = 3): Promise<PharmacyInventory[]> {
    const futureDate = addMonths(new Date(), monthsAhead).toISOString().split('T')[0];
    const items = mockMasterStore.getAll<Record<string, unknown>>('pharmacy_inventory', hospitalId);
    return items.filter(i =>
      (i.quantity_in_stock as number) > 0 && (i.expiry_date as string) <= futureDate
    ) as unknown as PharmacyInventory[];
  },

  async getStats(hospitalId: string): Promise<PharmacyStats> {
    const items = mockMasterStore.getAll<Record<string, unknown>>('pharmacy_inventory', hospitalId);
    const futureDate = addMonths(new Date(), 3).toISOString().split('T')[0];
    const today = new Date().toISOString().split('T')[0];

    const totalItems = items.length;
    const lowStockCount = items.filter(i =>
      (i.quantity_in_stock as number) <= (i.reorder_level as number) && (i.quantity_in_stock as number) > 0
    ).length;
    const expiringCount = items.filter(i =>
      (i.expiry_date as string) <= futureDate && (i.expiry_date as string) >= today && (i.quantity_in_stock as number) > 0
    ).length;
    const totalValue = items.reduce((sum, i) =>
      sum + (i.quantity_in_stock as number) * ((i.mrp as number) || (i.selling_price as number) || 0), 0
    );

    return { totalItems, lowStockCount, expiringCount, totalValue };
  },

  async addInventory(hospitalId: string, form: InventoryFormData, userId: string): Promise<PharmacyInventory> {
    const existing = mockMasterStore.getAll<Record<string, unknown>>('pharmacy_inventory', hospitalId)
      .find(i => i.medication_id === form.medication_id && i.batch_number === form.batch_number);

    if (existing) {
      const updated = mockMasterStore.update('pharmacy_inventory', existing.id as string, {
        quantity_in_stock: (existing.quantity_in_stock as number) + form.quantity_in_stock,
        expiry_date: form.expiry_date,
        reorder_level: form.reorder_level,
        supplier_name: form.supplier_name || null,
        purchase_price: form.purchase_price,
        selling_price: form.selling_price,
        mrp: form.selling_price,
      });
      return updated as unknown as PharmacyInventory;
    }

    const med = mockMasterStore.getById<Record<string, unknown>>('medications', form.medication_id);
    const medName = med ? `${med.generic_name} ${med.brand_name ? `(${med.brand_name})` : ''} ${med.strength || ''}`.trim() : '';

    const item = mockMasterStore.insert('pharmacy_inventory', {
      hospital_id: hospitalId,
      medication_id: form.medication_id,
      medication_name: medName,
      batch_number: form.batch_number,
      expiry_date: form.expiry_date,
      quantity_in_stock: form.quantity_in_stock,
      reorder_level: form.reorder_level,
      supplier_name: form.supplier_name || null,
      purchase_price: form.purchase_price,
      selling_price: form.selling_price,
      mrp: form.selling_price,
      gst_percent: 0,
    });
    return item as unknown as PharmacyInventory;
  },

  async updateInventory(itemId: string, updates: Partial<InventoryFormData>): Promise<void> {
    mockMasterStore.update('pharmacy_inventory', itemId, updates);
  },

  async adjustStock(itemId: string, adjustment: number, reason: string, userId: string): Promise<void> {
    const item = mockMasterStore.getById<Record<string, unknown>>('pharmacy_inventory', itemId);
    if (!item) throw new Error('Not found');
    const newQty = (item.quantity_in_stock as number) + adjustment;
    if (newQty < 0) throw new Error('Stock cannot be negative');
    mockMasterStore.update('pharmacy_inventory', itemId, { quantity_in_stock: newQty });
  },

  async recordTransaction(hospitalId: string, form: TransactionFormData, userId: string): Promise<PharmacyTransaction> {
    const totalAmount = Math.abs(form.quantity) * form.unit_price;
    return mockMasterStore.insert('pharmacy_transactions', {
      hospital_id: hospitalId,
      transaction_type: form.transaction_type,
      medication_id: form.medication_id,
      batch_number: form.batch_number || null,
      quantity: form.quantity,
      unit_price: form.unit_price,
      total_amount: totalAmount,
      patient_id: form.patient_id || null,
      prescription_id: form.prescription_id || null,
      notes: form.notes || null,
      performed_by: userId,
      transaction_date: new Date().toISOString(),
    }) as unknown as PharmacyTransaction;
  },

  async getTransactions(
    hospitalId: string,
    options?: { type?: string; startDate?: string; endDate?: string; limit?: number }
  ): Promise<PharmacyTransaction[]> {
    let txns = mockMasterStore.getAll<Record<string, unknown>>('pharmacy_transactions', hospitalId);
    if (options?.type) txns = txns.filter(t => t.transaction_type === options.type);
    if (options?.startDate) txns = txns.filter(t => (t.transaction_date as string) >= options.startDate!);
    if (options?.endDate) txns = txns.filter(t => (t.transaction_date as string) <= options.endDate!);
    txns.sort((a, b) => ((b.transaction_date as string) || '').localeCompare((a.transaction_date as string) || ''));
    if (options?.limit) txns = txns.slice(0, options.limit);
    return txns as unknown as PharmacyTransaction[];
  },

  async getMedications(hospitalId: string): Promise<Medication[]> {
    return mockMasterStore.getAll<Record<string, unknown>>('medications', hospitalId)
      .filter(m => m.is_active !== false)
      .map(m => ({
        id: m.id as string,
        generic_name: m.generic_name as string,
        brand_name: (m.brand_name as string) || null,
        form: (m.form || m.dosage_form) as string,
        strength: m.strength as string,
        manufacturer: (m.manufacturer as string) || null,
      })) as Medication[];
  },

  async dispenseMedication(
    hospitalId: string,
    medicationId: string,
    quantity: number,
    patientId: string,
    prescriptionId: string | null,
    userId: string
  ): Promise<void> {
    const today = new Date().toISOString().split('T')[0];
    const batches = mockMasterStore.getAll<Record<string, unknown>>('pharmacy_inventory', hospitalId)
      .filter(i =>
        i.medication_id === medicationId &&
        (i.quantity_in_stock as number) > 0 &&
        (i.expiry_date as string) >= today
      )
      .sort((a, b) => ((a.expiry_date as string) || '').localeCompare((b.expiry_date as string) || ''));

    let remaining = quantity;
    for (const batch of batches) {
      if (remaining <= 0) break;
      const toDeduct = Math.min(remaining, batch.quantity_in_stock as number);
      remaining -= toDeduct;
      mockMasterStore.update('pharmacy_inventory', batch.id as string, {
        quantity_in_stock: (batch.quantity_in_stock as number) - toDeduct,
      });
    }
    if (remaining > 0) throw new Error(`Insufficient stock. Short by ${remaining} units.`);
  },
};

export default pharmacyService;
