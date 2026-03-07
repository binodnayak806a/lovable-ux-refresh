import { supabase } from '../lib/supabase';
import { BaseApiService } from './base.service';
import type { Invoice, Payment, ServiceItem } from '../types';
import type {
  BillItem,
  BillFormData,
  BillRecord,
  PaymentStatus,
} from '../modules/opd/billing/types';

class BillingService extends BaseApiService<Invoice> {
  constructor() {
    super('invoices');
  }

  async generateInvoiceNumber(hospitalId: string): Promise<string> {
    const year = new Date().getFullYear();
    const month = String(new Date().getMonth() + 1).padStart(2, '0');
    const { count } = await supabase
      .from('invoices')
      .select('id', { count: 'exact', head: true })
      .eq('hospital_id', hospitalId);
    const seq = String((count ?? 0) + 1).padStart(5, '0');
    return `INV${year}${month}${seq}`;
  }

  async recordPayment(payment: Omit<Payment, 'id' | 'created_at'>): Promise<Payment> {
    const { data, error } = await supabase
      .from('payments')
      .insert(payment as never)
      .select()
      .single();
    if (error) throw error;

    const paid = payment.amount;
    const { data: invoice } = await supabase
      .from('invoices')
      .select('paid_amount, total_amount')
      .eq('id', payment.invoice_id)
      .single() as { data: { paid_amount: number; total_amount: number } | null };

    if (invoice) {
      const newPaid = (invoice.paid_amount ?? 0) + paid;
      const isFullyPaid = newPaid >= invoice.total_amount;
      await supabase
        .from('invoices')
        .update({
          paid_amount: newPaid,
          status: isFullyPaid ? 'paid' : 'partial',
          updated_at: new Date().toISOString(),
        } as never)
        .eq('id', payment.invoice_id);
    }

    return data as Payment;
  }

  async getServiceItems(hospitalId: string): Promise<ServiceItem[]> {
    const { data, error } = await supabase
      .from('service_items')
      .select('*')
      .eq('hospital_id', hospitalId)
      .eq('is_active', true)
      .order('category', { ascending: true })
      .order('name', { ascending: true });
    if (error) throw error;
    return (data ?? []) as ServiceItem[];
  }

  async getRevenueStats(hospitalId: string, dateFrom: string, dateTo: string) {
    const { data, error } = await supabase
      .from('invoices')
      .select('total_amount, paid_amount, status')
      .eq('hospital_id', hospitalId)
      .gte('invoice_date', dateFrom)
      .lte('invoice_date', dateTo);

    if (error) throw error;
    const invoices = (data ?? []) as { total_amount: number; paid_amount: number; status: string }[];

    const totalRevenue = invoices.reduce((sum, i) => sum + (i.paid_amount ?? 0), 0);
    const pendingAmount = invoices
      .filter((i) => i.status !== 'paid' && i.status !== 'cancelled')
      .reduce((sum, i) => sum + ((i.total_amount ?? 0) - (i.paid_amount ?? 0)), 0);

    return { totalRevenue, pendingAmount };
  }

  async generateBillNumber(): Promise<string> {
    const { data, error } = await supabase.rpc('generate_bill_number');
    if (error) {
      const today = new Date();
      const dateStr = today.toISOString().slice(0, 10).replace(/-/g, '');
      const rand = Math.floor(Math.random() * 9999).toString().padStart(4, '0');
      return `INV${dateStr}-${rand}`;
    }
    return data as string;
  }

  async createBill(
    patientId: string,
    consultationId: string | null,
    prescriptionId: string | null,
    items: BillItem[],
    form: BillFormData,
    totals: {
      subtotal: number;
      discountAmount: number;
      taxAmount: number;
      totalAmount: number;
    },
    userId: string
  ): Promise<BillRecord> {
    const billNumber = await this.generateBillNumber();

    const { data: bill, error: billError } = await supabase
      .from('bills')
      .insert({
        bill_number: billNumber,
        patient_id: patientId,
        consultation_id: consultationId || null,
        prescription_id: prescriptionId || null,
        bill_type: 'OPD',
        subtotal: totals.subtotal,
        discount_percentage: form.discountPercentage,
        discount_amount: totals.discountAmount,
        tax_percentage: form.taxPercentage,
        tax_amount: totals.taxAmount,
        total_amount: totals.totalAmount,
        amount_paid: totals.totalAmount,
        payment_status: 'paid' as PaymentStatus,
        payment_mode: form.paymentMode,
        payment_reference: form.paymentReference || null,
        notes: form.notes || null,
        created_by: userId,
      } as never)
      .select()
      .single();

    if (billError) throw billError;
    const billId = (bill as BillRecord).id;

    if (items.length > 0) {
      const itemRecords = items.map((item, idx) => ({
        bill_id: billId,
        item_type: item.itemType,
        item_name: item.itemName,
        description: item.description || null,
        quantity: item.quantity,
        unit_price: item.unitPrice,
        total_price: item.totalPrice,
        sort_order: idx,
      }));
      const { error: itemsError } = await supabase
        .from('bill_items')
        .insert(itemRecords as never);
      if (itemsError) throw itemsError;
    }

    if (consultationId) {
      await supabase
        .from('appointments')
        .update({ status: 'completed' } as never)
        .eq('consultation_id', consultationId);
    }

    return bill as BillRecord;
  }

  async getBill(billId: string): Promise<{
    bill: BillRecord;
    items: Array<{
      id: string;
      item_type: string;
      item_name: string;
      description: string | null;
      quantity: number;
      unit_price: number;
      total_price: number;
    }>;
  } | null> {
    const { data: bill, error } = await supabase
      .from('bills')
      .select('*')
      .eq('id', billId)
      .maybeSingle();

    if (error || !bill) return null;

    const { data: items } = await supabase
      .from('bill_items')
      .select('*')
      .eq('bill_id', billId)
      .order('sort_order');

    return {
      bill: bill as BillRecord,
      items: (items ?? []) as Array<{
        id: string;
        item_type: string;
        item_name: string;
        description: string | null;
        quantity: number;
        unit_price: number;
        total_price: number;
      }>,
    };
  }

  async getPatientBills(patientId: string, limit = 10): Promise<BillRecord[]> {
    const { data, error } = await supabase
      .from('bills')
      .select('*')
      .eq('patient_id', patientId)
      .order('bill_date', { ascending: false })
      .limit(limit);

    if (error) throw error;
    return (data ?? []) as BillRecord[];
  }

  async updatePaymentStatus(
    billId: string,
    status: PaymentStatus,
    amountPaid?: number
  ): Promise<void> {
    const updateData: Record<string, unknown> = {
      payment_status: status,
      updated_at: new Date().toISOString(),
    };
    if (amountPaid !== undefined) {
      updateData.amount_paid = amountPaid;
    }
    const { error } = await supabase
      .from('bills')
      .update(updateData as never)
      .eq('id', billId);
    if (error) throw error;
  }
}

export const billingService = new BillingService();
