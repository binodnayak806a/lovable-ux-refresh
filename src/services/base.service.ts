import { supabase } from '../lib/supabase';
import type { PaginationParams, SortParams } from '../types';

export interface FilterMap {
  [key: string]: string | number | boolean | null | undefined;
}

export interface QueryOptions extends PaginationParams, SortParams {
  filters?: FilterMap;
  search?: { columns: string[]; query: string };
  select?: string;
}

export class BaseApiService<TRow> {
  protected readonly tableName: string;
  protected readonly hospitalColumn: string;

  constructor(tableName: string, hospitalColumn = 'hospital_id') {
    this.tableName = tableName;
    this.hospitalColumn = hospitalColumn;
  }

  protected getQuery(select = '*') {
    return supabase.from(this.tableName as never).select(select);
  }

  async getAll(hospitalId: string, options: QueryOptions = {}) {
    const {
      page = 1,
      per_page = 20,
      sort_by = 'created_at',
      sort_order = 'desc',
      filters = {},
      search,
      select = '*',
    } = options;

    const from = (page - 1) * per_page;
    const to = from + per_page - 1;

    let query = supabase
      .from(this.tableName as never)
      .select(select, { count: 'exact' })
      .eq(this.hospitalColumn, hospitalId)
      .order(sort_by, { ascending: sort_order === 'asc' })
      .range(from, to);

    for (const [key, value] of Object.entries(filters)) {
      if (value !== undefined && value !== null && value !== '') {
        query = query.eq(key, value) as typeof query;
      }
    }

    if (search?.query?.trim() && search.columns.length > 0) {
      const orConditions = search.columns
        .map((col) => `${col}.ilike.%${search.query}%`)
        .join(',');
      query = query.or(orConditions) as typeof query;
    }

    const { data, error, count } = await query;
    if (error) throw error;

    return {
      data: (data ?? []) as TRow[],
      total: count ?? 0,
      page,
      per_page,
      total_pages: Math.ceil((count ?? 0) / per_page),
    };
  }

  async getById(id: string, select = '*'): Promise<TRow | null> {
    const { data, error } = await supabase
      .from(this.tableName as never)
      .select(select)
      .eq('id', id)
      .maybeSingle();
    if (error) throw error;
    return data as TRow | null;
  }

  async create(payload: Partial<TRow>): Promise<TRow> {
    const { data, error } = await supabase
      .from(this.tableName as never)
      .insert(payload as never)
      .select()
      .single();
    if (error) throw error;
    return data as TRow;
  }

  async update(id: string, payload: Partial<TRow>): Promise<TRow> {
    const { data, error } = await supabase
      .from(this.tableName as never)
      .update({ ...payload, updated_at: new Date().toISOString() } as never)
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return data as TRow;
  }

  async softDelete(id: string): Promise<void> {
    const { error } = await supabase
      .from(this.tableName as never)
      .update({ is_active: false, updated_at: new Date().toISOString() } as never)
      .eq('id', id);
    if (error) throw error;
  }

  async hardDelete(id: string): Promise<void> {
    const { error } = await supabase
      .from(this.tableName as never)
      .delete()
      .eq('id', id);
    if (error) throw error;
  }

  async bulkCreate(payloads: Partial<TRow>[]): Promise<TRow[]> {
    const { data, error } = await supabase
      .from(this.tableName as never)
      .insert(payloads as never[])
      .select();
    if (error) throw error;
    return (data ?? []) as TRow[];
  }

  async count(hospitalId: string, filters: FilterMap = {}): Promise<number> {
    let query = supabase
      .from(this.tableName as never)
      .select('id', { count: 'exact', head: true })
      .eq(this.hospitalColumn, hospitalId);

    for (const [key, value] of Object.entries(filters)) {
      if (value !== undefined && value !== null) {
        query = query.eq(key, value) as typeof query;
      }
    }

    const { count, error } = await query;
    if (error) throw error;
    return count ?? 0;
  }
}
