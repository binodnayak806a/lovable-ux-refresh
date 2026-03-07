import { supabase } from '../lib/supabase';
import type {
  PharmacyInventory,
  PharmacyTransaction,
  InventoryFormData,
  TransactionFormData,
  PharmacyStats,
  Medication,
} from '../modules/pharmacy/types';
import { addMonths } from 'date-fns';

interface InventoryRow {
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
  medication: Medication | null;
}


const pharmacyService = {
  async getInventory(hospitalId: string, search?: string): Promise<PharmacyInventory[]> {
    const query = supabase
      .from('pharmacy_inventory')
      .select(`
        *,
        medication:medications(id, generic_name, brand_name, form, strength, manufacturer)
      `)
      .eq('hospital_id', hospitalId)
      .order('last_updated', { ascending: false });

    const { data, error } = await query;
    if (error) throw error;

    let results = (data ?? []) as InventoryRow[];

    if (search) {
      const lowerSearch = search.toLowerCase();
      results = results.filter((item) =>
        item.medication?.generic_name?.toLowerCase().includes(lowerSearch) ||
        item.medication?.brand_name?.toLowerCase().includes(lowerSearch) ||
        item.batch_number?.toLowerCase().includes(lowerSearch)
      );
    }

    return results as PharmacyInventory[];
  },

  async getLowStockItems(hospitalId: string): Promise<PharmacyInventory[]> {
    const { data, error } = await supabase
      .from('pharmacy_inventory')
      .select(`
        *,
        medication:medications(id, generic_name, brand_name, form, strength, manufacturer)
      `)
      .eq('hospital_id', hospitalId)
      .gt('quantity_in_stock', 0);

    if (error) throw error;

    const items = (data ?? []) as InventoryRow[];
    return items.filter((item) => item.quantity_in_stock <= item.reorder_level) as PharmacyInventory[];
  },

  async getExpiringItems(hospitalId: string, monthsAhead = 3): Promise<PharmacyInventory[]> {
    const futureDate = addMonths(new Date(), monthsAhead);

    const { data, error } = await supabase
      .from('pharmacy_inventory')
      .select(`
        *,
        medication:medications(id, generic_name, brand_name, form, strength, manufacturer)
      `)
      .eq('hospital_id', hospitalId)
      .gt('quantity_in_stock', 0)
      .lte('expiry_date', futureDate.toISOString().split('T')[0])
      .order('expiry_date', { ascending: true });

    if (error) throw error;
    return (data ?? []) as PharmacyInventory[];
  },

  async getStats(hospitalId: string): Promise<PharmacyStats> {
    const { data: inventory, error } = await supabase
      .from('pharmacy_inventory')
      .select('quantity_in_stock, reorder_level, selling_price, expiry_date')
      .eq('hospital_id', hospitalId);

    if (error) throw error;

    const items = inventory ?? [];
    const futureDate = addMonths(new Date(), 3);
    const today = new Date().toISOString().split('T')[0];

    const totalItems = items.length;
    const lowStockCount = items.filter(
      (i: Record<string, unknown>) => (i as { quantity_in_stock: number; reorder_level: number }).quantity_in_stock <=
        (i as { quantity_in_stock: number; reorder_level: number }).reorder_level &&
        (i as { quantity_in_stock: number }).quantity_in_stock > 0
    ).length;
    const expiringCount = items.filter(
      (i: Record<string, unknown>) => (i as { expiry_date: string }).expiry_date <= futureDate.toISOString().split('T')[0] &&
        (i as { expiry_date: string }).expiry_date >= today &&
        (i as { quantity_in_stock: number }).quantity_in_stock > 0
    ).length;
    const totalValue = items.reduce(
      (sum: number, i: Record<string, unknown>) => sum + (i as { quantity_in_stock: number; selling_price: number }).quantity_in_stock *
        (i as { quantity_in_stock: number; selling_price: number }).selling_price,
      0
    );

    return { totalItems, lowStockCount, expiringCount, totalValue };
  },

  async addInventory(
    hospitalId: string,
    form: InventoryFormData,
    userId: string
  ): Promise<PharmacyInventory> {
    const { data: existing } = await supabase
      .from('pharmacy_inventory')
      .select('id, quantity_in_stock')
      .eq('hospital_id', hospitalId)
      .eq('medication_id', form.medication_id)
      .eq('batch_number', form.batch_number)
      .maybeSingle();

    if (existing) {
      const existingRow = existing as { id: string; quantity_in_stock: number };
      const { data, error } = await supabase
        .from('pharmacy_inventory')
        .update({
          quantity_in_stock: existingRow.quantity_in_stock + form.quantity_in_stock,
          expiry_date: form.expiry_date,
          reorder_level: form.reorder_level,
          supplier_name: form.supplier_name || null,
          purchase_price: form.purchase_price,
          selling_price: form.selling_price,
          last_updated: new Date().toISOString(),
        } as never)
        .eq('id', existingRow.id)
        .select(`
          *,
          medication:medications(id, generic_name, brand_name, form, strength, manufacturer)
        `)
        .single();

      if (error) throw error;

      await this.recordTransaction(hospitalId, {
        transaction_type: 'purchase',
        medication_id: form.medication_id,
        batch_number: form.batch_number,
        quantity: form.quantity_in_stock,
        unit_price: form.purchase_price,
        notes: `Stock added to existing batch`,
      }, userId);

      return data as PharmacyInventory;
    }

    const { data, error } = await supabase
      .from('pharmacy_inventory')
      .insert({
        hospital_id: hospitalId,
        medication_id: form.medication_id,
        batch_number: form.batch_number,
        expiry_date: form.expiry_date,
        quantity_in_stock: form.quantity_in_stock,
        reorder_level: form.reorder_level,
        supplier_name: form.supplier_name || null,
        purchase_price: form.purchase_price,
        selling_price: form.selling_price,
      } as never)
      .select(`
        *,
        medication:medications(id, generic_name, brand_name, form, strength, manufacturer)
      `)
      .single();

    if (error) throw error;

    await this.recordTransaction(hospitalId, {
      transaction_type: 'purchase',
      medication_id: form.medication_id,
      batch_number: form.batch_number,
      quantity: form.quantity_in_stock,
      unit_price: form.purchase_price,
      notes: `New stock added`,
    }, userId);

    return data as PharmacyInventory;
  },

  async updateInventory(
    itemId: string,
    updates: Partial<InventoryFormData>
  ): Promise<void> {
    const { error } = await supabase
      .from('pharmacy_inventory')
      .update({
        ...updates,
        last_updated: new Date().toISOString(),
      } as never)
      .eq('id', itemId);

    if (error) throw error;
  },

  async adjustStock(
    itemId: string,
    adjustment: number,
    reason: string,
    userId: string
  ): Promise<void> {
    const { data: item, error: fetchError } = await supabase
      .from('pharmacy_inventory')
      .select('hospital_id, medication_id, batch_number, quantity_in_stock, selling_price')
      .eq('id', itemId)
      .single();

    if (fetchError) throw fetchError;

    const itemData = item as {
      hospital_id: string;
      medication_id: string;
      batch_number: string;
      quantity_in_stock: number;
      selling_price: number;
    };

    const newQty = itemData.quantity_in_stock + adjustment;
    if (newQty < 0) throw new Error('Stock cannot be negative');

    const { error } = await supabase
      .from('pharmacy_inventory')
      .update({
        quantity_in_stock: newQty,
        last_updated: new Date().toISOString(),
      } as never)
      .eq('id', itemId);

    if (error) throw error;

    const transactionType = adjustment > 0 ? 'adjustment' : (reason.toLowerCase().includes('wastage') ? 'wastage' : 'adjustment');

    await this.recordTransaction(itemData.hospital_id, {
      transaction_type: transactionType,
      medication_id: itemData.medication_id,
      batch_number: itemData.batch_number,
      quantity: adjustment,
      unit_price: itemData.selling_price,
      notes: reason,
    }, userId);
  },

  async recordTransaction(
    hospitalId: string,
    form: TransactionFormData,
    userId: string
  ): Promise<PharmacyTransaction> {
    const totalAmount = Math.abs(form.quantity) * form.unit_price;

    const { data, error } = await supabase
      .from('pharmacy_transactions')
      .insert({
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
      } as never)
      .select()
      .single();

    if (error) throw error;
    return data as PharmacyTransaction;
  },

  async getTransactions(
    hospitalId: string,
    options?: {
      type?: string;
      startDate?: string;
      endDate?: string;
      limit?: number;
    }
  ): Promise<PharmacyTransaction[]> {
    let query = supabase
      .from('pharmacy_transactions')
      .select(`
        *,
        medication:medications(id, generic_name, brand_name, form, strength),
        patient:patients(full_name, uhid)
      `)
      .eq('hospital_id', hospitalId)
      .order('transaction_date', { ascending: false });

    if (options?.type) {
      query = query.eq('transaction_type', options.type);
    }
    if (options?.startDate) {
      query = query.gte('transaction_date', options.startDate);
    }
    if (options?.endDate) {
      query = query.lte('transaction_date', options.endDate);
    }
    if (options?.limit) {
      query = query.limit(options.limit);
    }

    const { data, error } = await query;
    if (error) throw error;
    return (data ?? []) as PharmacyTransaction[];
  },

  async getMedications(hospitalId: string): Promise<Medication[]> {
    const { data, error } = await supabase
      .from('medications')
      .select('id, generic_name, brand_name, form, strength, manufacturer')
      .eq('hospital_id', hospitalId)
      .eq('is_active', true)
      .order('generic_name');

    if (error) throw error;
    return (data ?? []) as Medication[];
  },

  async dispenseMedication(
    hospitalId: string,
    medicationId: string,
    quantity: number,
    patientId: string,
    prescriptionId: string | null,
    userId: string
  ): Promise<void> {
    const { data: batches, error: fetchError } = await supabase
      .from('pharmacy_inventory')
      .select('id, batch_number, quantity_in_stock, selling_price, expiry_date')
      .eq('hospital_id', hospitalId)
      .eq('medication_id', medicationId)
      .gt('quantity_in_stock', 0)
      .gte('expiry_date', new Date().toISOString().split('T')[0])
      .order('expiry_date', { ascending: true });

    if (fetchError) throw fetchError;

    const batchList = (batches ?? []) as Array<{
      id: string;
      batch_number: string;
      quantity_in_stock: number;
      selling_price: number;
      expiry_date: string;
    }>;

    let remaining = quantity;
    for (const batch of batchList) {
      if (remaining <= 0) break;

      const toDeduct = Math.min(remaining, batch.quantity_in_stock);
      remaining -= toDeduct;

      const { error: updateError } = await supabase
        .from('pharmacy_inventory')
        .update({
          quantity_in_stock: batch.quantity_in_stock - toDeduct,
          last_updated: new Date().toISOString(),
        } as never)
        .eq('id', batch.id);

      if (updateError) throw updateError;

      await this.recordTransaction(hospitalId, {
        transaction_type: 'sale',
        medication_id: medicationId,
        batch_number: batch.batch_number,
        quantity: -toDeduct,
        unit_price: batch.selling_price,
        patient_id: patientId,
        prescription_id: prescriptionId || undefined,
        notes: `Dispensed to patient`,
      }, userId);
    }

    if (remaining > 0) {
      throw new Error(`Insufficient stock. Short by ${remaining} units.`);
    }
  },
};

export default pharmacyService;
