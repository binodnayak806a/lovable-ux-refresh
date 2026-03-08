import { mockMasterStore } from '../lib/mockMasterStore';
import { mockStore } from '../lib/mockStore';
import type {
  LabTest,
  LabOrder,
  LabOrderFormData,
  ResultEntryData,
  LabStats,
  OrderStatus,
  TestCategory,
} from '../modules/lab/types';
import { startOfDay, endOfDay } from 'date-fns';

const labService = {
  async getTests(hospitalId: string, category?: TestCategory): Promise<LabTest[]> {
    const all = mockMasterStore.getAll<LabTest>('lab_tests', hospitalId)
      .filter(t => (t as Record<string, unknown>).is_active !== false);
    if (category) return all.filter(t => t.test_category === category);
    return all;
  },

  async getTestsByCategory(hospitalId: string): Promise<Record<TestCategory, LabTest[]>> {
    const tests = await this.getTests(hospitalId);
    const grouped: Record<string, LabTest[]> = {};
    tests.forEach(t => {
      if (!grouped[t.test_category]) grouped[t.test_category] = [];
      grouped[t.test_category].push(t);
    });
    return grouped as Record<TestCategory, LabTest[]>;
  },

  async createTest(hospitalId: string, test: Partial<LabTest>): Promise<LabTest> {
    return mockMasterStore.insert<LabTest>('lab_tests', {
      hospital_id: hospitalId,
      test_code: test.test_code,
      test_name: test.test_name,
      test_category: test.test_category || 'General',
      test_price: test.test_price || 0,
      sample_type: test.sample_type || 'Blood',
      normal_range: test.normal_range || null,
      turnaround_time_hours: test.turnaround_time_hours || 24,
      instructions: test.instructions || null,
      is_active: true,
    } as Partial<LabTest>);
  },

  async updateTest(testId: string, updates: Partial<LabTest>): Promise<void> {
    mockMasterStore.update('lab_tests', testId, updates);
  },

  async generateOrderNumber(_hospitalId: string): Promise<string> {
    const now = new Date();
    const yy = now.getFullYear().toString().slice(-2);
    const mm = (now.getMonth() + 1).toString().padStart(2, '0');
    const dd = now.getDate().toString().padStart(2, '0');
    const orders = mockMasterStore.getAll('lab_orders');
    const seq = (orders.length + 1).toString().padStart(4, '0');
    return `LAB${yy}${mm}${dd}${seq}`;
  },

  async createOrder(hospitalId: string, form: LabOrderFormData, userId: string): Promise<LabOrder> {
    const orderNumber = await this.generateOrderNumber(hospitalId);
    const tests = mockMasterStore.getAll<Record<string, unknown>>('lab_tests')
      .filter(t => form.test_ids.includes(t.id as string));

    const totalAmount = tests.reduce((sum, t) => sum + ((t.test_price as number) || (t.price as number) || 0), 0);

    // Resolve patient info
    const patient = mockStore.getPatientById(form.patient_id);
    const doctor = form.doctor_id ? mockStore.get().doctors.find(d => d.id === form.doctor_id) : null;

    const order = mockMasterStore.insert<Record<string, unknown>>('lab_orders', {
      hospital_id: hospitalId,
      order_number: orderNumber,
      patient_id: form.patient_id,
      doctor_id: form.doctor_id || null,
      order_date: new Date().toISOString(),
      priority: form.priority,
      clinical_notes: form.clinical_notes || null,
      status: 'pending',
      sample_collected_at: null,
      sample_collected_by: null,
      reported_at: null,
      reported_by: null,
      total_amount: totalAmount,
      created_by: userId,
      patient: patient ? { full_name: patient.full_name, uhid: patient.uhid, phone: patient.phone, gender: patient.gender } : null,
      doctor: doctor ? { full_name: doctor.full_name } : null,
    });

    // Create order items
    const items: Record<string, unknown>[] = [];
    for (const test of tests) {
      const item = mockMasterStore.insert('lab_order_items', {
        order_id: order.id,
        test_id: test.id,
        test_name: test.test_name || test.name,
        test_price: test.test_price || test.price || 0,
        normal_range: test.normal_range || null,
        result_value: null,
        result_unit: null,
        is_abnormal: false,
        remarks: null,
        status: 'pending',
        completed_at: null,
        completed_by: null,
      });
      items.push(item);
    }

    return { ...order, items } as unknown as LabOrder;
  },

  async getOrders(
    hospitalId: string,
    options?: { status?: OrderStatus; patientId?: string; startDate?: string; endDate?: string; limit?: number }
  ): Promise<LabOrder[]> {
    let orders = mockMasterStore.getAll<Record<string, unknown>>('lab_orders', hospitalId);

    if (options?.status) orders = orders.filter(o => o.status === options.status);
    if (options?.patientId) orders = orders.filter(o => o.patient_id === options.patientId);
    if (options?.startDate) orders = orders.filter(o => (o.order_date as string) >= options.startDate!);
    if (options?.endDate) orders = orders.filter(o => (o.order_date as string) <= options.endDate!);

    // Attach items
    const allItems = mockMasterStore.getAll<Record<string, unknown>>('lab_order_items');
    orders = orders.map(o => ({
      ...o,
      items: allItems.filter(i => i.order_id === o.id),
    }));

    orders.sort((a, b) => ((b.order_date as string) || '').localeCompare((a.order_date as string) || ''));
    if (options?.limit) orders = orders.slice(0, options.limit);

    return orders as unknown as LabOrder[];
  },

  async getOrder(orderId: string): Promise<LabOrder | null> {
    const order = mockMasterStore.getById<Record<string, unknown>>('lab_orders', orderId);
    if (!order) return null;
    const items = mockMasterStore.getAll<Record<string, unknown>>('lab_order_items')
      .filter(i => i.order_id === orderId);
    return { ...order, items } as unknown as LabOrder;
  },

  async collectSample(orderId: string, userId: string): Promise<void> {
    mockMasterStore.update('lab_orders', orderId, {
      status: 'sample_collected',
      sample_collected_at: new Date().toISOString(),
      sample_collected_by: userId,
    });
  },

  async startProcessing(orderId: string): Promise<void> {
    mockMasterStore.update('lab_orders', orderId, { status: 'processing' });
    const items = mockMasterStore.getAll<Record<string, unknown>>('lab_order_items')
      .filter(i => i.order_id === orderId);
    for (const item of items) {
      mockMasterStore.update('lab_order_items', item.id as string, { status: 'processing' });
    }
  },

  async enterResult(itemId: string, result: ResultEntryData, userId: string): Promise<void> {
    mockMasterStore.update('lab_order_items', itemId, {
      result_value: result.result_value,
      result_unit: result.result_unit || null,
      is_abnormal: result.is_abnormal,
      remarks: result.remarks || null,
      status: 'completed',
      completed_at: new Date().toISOString(),
      completed_by: userId,
    });
  },

  async completeOrder(orderId: string, userId: string): Promise<void> {
    const items = mockMasterStore.getAll<Record<string, unknown>>('lab_order_items')
      .filter(i => i.order_id === orderId);
    const allCompleted = items.every(i => i.status === 'completed');
    if (!allCompleted) throw new Error('All test results must be entered before completing the order');

    mockMasterStore.update('lab_orders', orderId, {
      status: 'completed',
      reported_at: new Date().toISOString(),
      reported_by: userId,
    });
  },

  async cancelOrder(orderId: string): Promise<void> {
    mockMasterStore.update('lab_orders', orderId, { status: 'cancelled' });
  },

  async getStats(hospitalId: string): Promise<LabStats> {
    const orders = mockMasterStore.getAll<Record<string, unknown>>('lab_orders', hospitalId);
    const today = new Date();
    const startOfToday = startOfDay(today).toISOString();
    const endOfToday = endOfDay(today).toISOString();

    const totalOrders = orders.length;
    const pendingOrders = orders.filter(o => ['pending', 'sample_collected', 'processing'].includes(o.status as string)).length;
    const completedToday = orders.filter(o =>
      o.status === 'completed' && o.reported_at && (o.reported_at as string) >= startOfToday && (o.reported_at as string) <= endOfToday
    ).length;

    const completed = orders.filter(o => o.status === 'completed' && o.reported_at);
    let avgTurnaround = 0;
    if (completed.length > 0) {
      const totalHours = completed.reduce((sum, o) => {
        const diff = new Date(o.reported_at as string).getTime() - new Date(o.order_date as string).getTime();
        return sum + diff / (1000 * 60 * 60);
      }, 0);
      avgTurnaround = Math.round(totalHours / completed.length);
    }

    return { totalOrders, pendingOrders, completedToday, avgTurnaround };
  },

  async getPatientLabHistory(patientId: string): Promise<LabOrder[]> {
    const orders = mockMasterStore.getAll<Record<string, unknown>>('lab_orders')
      .filter(o => o.patient_id === patientId && o.status === 'completed');
    const allItems = mockMasterStore.getAll<Record<string, unknown>>('lab_order_items');
    return orders.map(o => ({
      ...o,
      items: allItems.filter(i => i.order_id === o.id),
    })).slice(0, 20) as unknown as LabOrder[];
  },
};

export default labService;
