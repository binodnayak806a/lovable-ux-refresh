export interface ApiResponse<T> {
  data: T;
  message?: string;
  error?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  per_page: number;
  total_pages: number;
}

export interface PaginationParams {
  page?: number;
  per_page?: number;
}

export interface SortParams {
  sort_by?: string;
  sort_order?: 'asc' | 'desc';
}

export interface DateRangeFilter {
  from?: string;
  to?: string;
}

export type QueryParams = PaginationParams & SortParams & DateRangeFilter & Record<string, string | number | boolean | undefined>;

export interface SelectOption {
  value: string;
  label: string;
  disabled?: boolean;
}

export type LoadingState = 'idle' | 'loading' | 'succeeded' | 'failed';

export interface AsyncState<T> {
  data: T;
  status: LoadingState;
  error: string | null;
}
