import { supabase } from '../lib/supabase';
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
    let query = supabase
      .from('lab_tests')
      .select('*')
      .eq('hospital_id', hospitalId)
      .eq('is_active', true)
      .order('test_category')
      .order('test_name');

    if (category) {
      query = query.eq('test_category', category);
    }

    const { data, error } = await query;
    if (error) throw error;
    return (data ?? []) as LabTest[];
  },

  async getTestsByCategory(hospitalId: string): Promise<Record<TestCategory, LabTest[]>> {
    const tests = await this.getTests(hospitalId);
    const grouped: Record<string, LabTest[]> = {};

    tests.forEach((test) => {
      const category = test.test_category;
      if (!grouped[category]) grouped[category] = [];
      grouped[category].push(test);
    });

    return grouped as Record<TestCategory, LabTest[]>;
  },

  async createTest(hospitalId: string, test: Partial<LabTest>): Promise<LabTest> {
    const { data, error } = await supabase
      .from('lab_tests')
      .insert({
        hospital_id: hospitalId,
        test_code: test.test_code,
        test_name: test.test_name,
        test_category: test.test_category || 'General',
        test_price: test.test_price || 0,
        sample_type: test.sample_type || 'Blood',
        normal_range: test.normal_range || null,
        turnaround_time_hours: test.turnaround_time_hours || 24,
        instructions: test.instructions || null,
      } as never)
      .select()
      .single();

    if (error) throw error;
    return data as LabTest;
  },

  async updateTest(testId: string, updates: Partial<LabTest>): Promise<void> {
    const { error } = await supabase
      .from('lab_tests')
      .update(updates as never)
      .eq('id', testId);

    if (error) throw error;
  },

  async generateOrderNumber(hospitalId: string): Promise<string> {
    const now = new Date();
    const yy = now.getFullYear().toString().slice(-2);
    const mm = (now.getMonth() + 1).toString().padStart(2, '0');
    const dd = now.getDate().toString().padStart(2, '0');

    const { count } = await supabase
      .from('lab_orders')
      .select('*', { count: 'exact', head: true })
      .eq('hospital_id', hospitalId)
      .gte('created_at', startOfDay(now).toISOString())
      .lte('created_at', endOfDay(now).toISOString());

    const seq = ((count ?? 0) + 1).toString().padStart(4, '0');
    return `LAB${yy}${mm}${dd}${seq}`;
  },

  async createOrder(
    hospitalId: string,
    form: LabOrderFormData,
    userId: string
  ): Promise<LabOrder> {
    const orderNumber = await this.generateOrderNumber(hospitalId);

    const { data: tests } = await supabase
      .from('lab_tests')
      .select('id, test_name, test_price, normal_range')
      .in('id', form.test_ids);

    const testList = (tests ?? []) as Array<{
      id: string;
      test_name: string;
      test_price: number;
      normal_range: string | null;
    }>;

    const totalAmount = testList.reduce((sum, t) => sum + t.test_price, 0);

    const { data: order, error: orderError } = await supabase
      .from('lab_orders')
      .insert({
        hospital_id: hospitalId,
        order_number: orderNumber,
        patient_id: form.patient_id,
        doctor_id: form.doctor_id || null,
        priority: form.priority,
        clinical_notes: form.clinical_notes || null,
        total_amount: totalAmount,
        created_by: userId,
      } as never)
      .select()
      .single();

    if (orderError) throw orderError;

    const orderData = order as { id: string };

    const itemsToInsert = testList.map((test) => ({
      order_id: orderData.id,
      test_id: test.id,
      test_name: test.test_name,
      test_price: test.test_price,
      normal_range: test.normal_range,
    }));

    const { error: itemsError } = await supabase
      .from('lab_order_items')
      .insert(itemsToInsert as never);

    if (itemsError) throw itemsError;

    return order as LabOrder;
  },

  async getOrders(
    hospitalId: string,
    options?: {
      status?: OrderStatus;
      patientId?: string;
      startDate?: string;
      endDate?: string;
      limit?: number;
    }
  ): Promise<LabOrder[]> {
    let query = supabase
      .from('lab_orders')
      .select(`
        *,
        patient:patients(full_name, uhid, phone, gender),
        doctor:profiles!lab_orders_doctor_id_fkey(full_name),
        items:lab_order_items(*, test:lab_tests(*))
      `)
      .eq('hospital_id', hospitalId)
      .order('order_date', { ascending: false });

    if (options?.status) {
      query = query.eq('status', options.status);
    }
    if (options?.patientId) {
      query = query.eq('patient_id', options.patientId);
    }
    if (options?.startDate) {
      query = query.gte('order_date', options.startDate);
    }
    if (options?.endDate) {
      query = query.lte('order_date', options.endDate);
    }
    if (options?.limit) {
      query = query.limit(options.limit);
    }

    const { data, error } = await query;
    if (error) throw error;
    return (data ?? []) as LabOrder[];
  },

  async getOrder(orderId: string): Promise<LabOrder | null> {
    const { data, error } = await supabase
      .from('lab_orders')
      .select(`
        *,
        patient:patients(full_name, uhid, phone, gender),
        doctor:profiles!lab_orders_doctor_id_fkey(full_name),
        items:lab_order_items(*, test:lab_tests(*))
      `)
      .eq('id', orderId)
      .maybeSingle();

    if (error) throw error;
    return data as LabOrder | null;
  },

  async collectSample(orderId: string, userId: string): Promise<void> {
    const { error } = await supabase
      .from('lab_orders')
      .update({
        status: 'sample_collected',
        sample_collected_at: new Date().toISOString(),
        sample_collected_by: userId,
      } as never)
      .eq('id', orderId);

    if (error) throw error;
  },

  async startProcessing(orderId: string): Promise<void> {
    const { error } = await supabase
      .from('lab_orders')
      .update({ status: 'processing' } as never)
      .eq('id', orderId);

    if (error) throw error;

    const { error: itemsError } = await supabase
      .from('lab_order_items')
      .update({ status: 'processing' } as never)
      .eq('order_id', orderId);
    if (itemsError) throw itemsError;
  },

  async enterResult(
    itemId: string,
    result: ResultEntryData,
    userId: string
  ): Promise<void> {
    const { error } = await supabase
      .from('lab_order_items')
      .update({
        result_value: result.result_value,
        result_unit: result.result_unit || null,
        is_abnormal: result.is_abnormal,
        remarks: result.remarks || null,
        status: 'completed',
        completed_at: new Date().toISOString(),
        completed_by: userId,
      } as never)
      .eq('id', itemId);

    if (error) throw error;
  },

  async completeOrder(orderId: string, userId: string): Promise<void> {
    const { data: items } = await supabase
      .from('lab_order_items')
      .select('status')
      .eq('order_id', orderId);

    const itemList = (items ?? []) as Array<{ status: string }>;
    const allCompleted = itemList.every((i) => i.status === 'completed');

    if (!allCompleted) {
      throw new Error('All test results must be entered before completing the order');
    }

    const { data: orderData } = await supabase
      .from('lab_orders')
      .select('order_number, doctor_id, patients(full_name)')
      .eq('id', orderId)
      .maybeSingle();

    const { error } = await supabase
      .from('lab_orders')
      .update({
        status: 'completed',
        reported_at: new Date().toISOString(),
        reported_by: userId,
      } as never)
      .eq('id', orderId);

    if (error) throw error;

    if (orderData) {
      const order = orderData as {
        order_number: string;
        doctor_id: string | null;
        patients: { full_name: string } | null;
      };
      const patientName = order.patients?.full_name ?? 'Patient';
      const message = `Lab results ready for ${patientName} — Order ${order.order_number}. Results are now available for review.`;
      const notifyUsers = new Set<string>([userId]);
      if (order.doctor_id) notifyUsers.add(order.doctor_id);
      for (const uid of notifyUsers) {
        supabase.from('notifications').insert({
          user_id: uid,
          title: 'Lab Results Ready',
          message,
          type: 'success',
          source: 'lab',
          is_read: false,
        } as never).then(() => {});
      }
    }
  },

  async cancelOrder(orderId: string): Promise<void> {
    const { error } = await supabase
      .from('lab_orders')
      .update({ status: 'cancelled' } as never)
      .eq('id', orderId);

    if (error) throw error;
  },

  async getStats(hospitalId: string): Promise<LabStats> {
    const today = new Date();
    const startOfToday = startOfDay(today).toISOString();
    const endOfToday = endOfDay(today).toISOString();

    const { count: totalOrders } = await supabase
      .from('lab_orders')
      .select('*', { count: 'exact', head: true })
      .eq('hospital_id', hospitalId);

    const { count: pendingOrders } = await supabase
      .from('lab_orders')
      .select('*', { count: 'exact', head: true })
      .eq('hospital_id', hospitalId)
      .in('status', ['pending', 'sample_collected', 'processing']);

    const { count: completedToday } = await supabase
      .from('lab_orders')
      .select('*', { count: 'exact', head: true })
      .eq('hospital_id', hospitalId)
      .eq('status', 'completed')
      .gte('reported_at', startOfToday)
      .lte('reported_at', endOfToday);

    const { data: turnaroundData } = await supabase
      .from('lab_orders')
      .select('order_date, reported_at')
      .eq('hospital_id', hospitalId)
      .eq('status', 'completed')
      .not('reported_at', 'is', null)
      .limit(100);

    const times = (turnaroundData ?? []) as Array<{ order_date: string; reported_at: string }>;
    let avgTurnaround = 0;
    if (times.length > 0) {
      const totalHours = times.reduce((sum, t) => {
        const diff = new Date(t.reported_at).getTime() - new Date(t.order_date).getTime();
        return sum + diff / (1000 * 60 * 60);
      }, 0);
      avgTurnaround = Math.round(totalHours / times.length);
    }

    return {
      totalOrders: totalOrders ?? 0,
      pendingOrders: pendingOrders ?? 0,
      completedToday: completedToday ?? 0,
      avgTurnaround,
    };
  },

  async getPatientLabHistory(patientId: string): Promise<LabOrder[]> {
    const { data, error } = await supabase
      .from('lab_orders')
      .select(`
        *,
        doctor:profiles!lab_orders_doctor_id_fkey(full_name),
        items:lab_order_items(*, test:lab_tests(*))
      `)
      .eq('patient_id', patientId)
      .eq('status', 'completed')
      .order('reported_at', { ascending: false })
      .limit(20);

    if (error) throw error;
    return (data ?? []) as LabOrder[];
  },
};

export default labService;
