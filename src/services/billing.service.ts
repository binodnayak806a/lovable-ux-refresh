import { mockStore } from '../lib/mockStore';
import type { Invoice, Payment, ServiceItem } from '../types';
import type {
  BillItem,
  BillFormData,
  BillRecord,
  PaymentStatus,
} from '../modules/opd/billing/types';

class BillingService {
  async generateInvoiceNumber(_hospitalId: string): Promise<string> {
    return mockStore.generateBillNumber();
  }

  async recordPayment(_payment: Omit<Payment, 'id' | 'created_at'>): Promise<Payment> {
    return { id: mockStore.uuid(), created_at: new Date().toISOString(), ..._payment } as Payment;
  }

  async getServiceItems(_hospitalId: string): Promise<ServiceItem[]> {
    return [];
  }

  async getRevenueStats(_hospitalId: string, _dateFrom: string, _dateTo: string) {
    const store = mockStore.get();
    const totalRevenue = store.bills.reduce((s, b) => s + b.amount_paid, 0);
    const pendingAmount = store.bills
      .filter(b => b.payment_status !== 'paid')
      .reduce((s, b) => s + (b.total_amount - b.amount_paid), 0);
    return { totalRevenue, pendingAmount };
  }

  async generateBillNumber(): Promise<string> {
    return mockStore.generateBillNumber();
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
    _userId: string
  ): Promise<BillRecord> {
    const billNumber = mockStore.generateBillNumber();

    const bill: BillRecord = {
      id: mockStore.uuid(),
      hospital_id: '11111111-1111-1111-1111-111111111111',
      bill_number: billNumber,
      patient_id: patientId,
      consultation_id: consultationId,
      prescription_id: prescriptionId,
      bill_type: 'OPD',
      bill_date: new Date().toISOString().split('T')[0],
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
    };

    mockStore.addBill({
      id: bill.id,
      bill_number: bill.bill_number,
      patient_id: patientId,
      consultation_id: consultationId,
      bill_type: 'OPD',
      subtotal: totals.subtotal,
      discount_amount: totals.discountAmount,
      tax_amount: totals.taxAmount,
      total_amount: totals.totalAmount,
      amount_paid: totals.totalAmount,
      payment_status: 'paid',
      payment_mode: form.paymentMode,
      notes: form.notes || null,
      bill_date: bill.bill_date,
      created_at: new Date().toISOString(),
    });

    return bill;
  }

  async getBill(billId: string) {
    const store = mockStore.get();
    const bill = store.bills.find(b => b.id === billId);
    if (!bill) return null;
    return { bill: bill as unknown as BillRecord, items: [] };
  }

  async getPatientBills(patientId: string, limit = 10): Promise<BillRecord[]> {
    const store = mockStore.get();
    return store.bills
      .filter(b => b.patient_id === patientId)
      .sort((a, b) => b.bill_date.localeCompare(a.bill_date))
      .slice(0, limit) as unknown as BillRecord[];
  }

  async updatePaymentStatus(
    billId: string,
    status: PaymentStatus,
    amountPaid?: number
  ): Promise<void> {
    const store = mockStore.get();
    const bill = store.bills.find(b => b.id === billId);
    if (bill) {
      bill.payment_status = status;
      if (amountPaid !== undefined) bill.amount_paid = amountPaid;
      localStorage.setItem('hms_mock_store', JSON.stringify(store));
    }
  }

  // Stub methods for compatibility
  async getAll(_hospitalId: string): Promise<Invoice[]> { return []; }
  async getById(_id: string): Promise<Invoice | null> { return null; }
}

export const billingService = new BillingService();
