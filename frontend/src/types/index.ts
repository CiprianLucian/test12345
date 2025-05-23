export interface Employee {
  id: number;
  name: string;
  email: string;
  department: string;
  sick_days_remaining: number;
}

export interface SickLeaveRequest {
  id: number;
  employee_id: number;
  employee_name?: string;
  start_date: string;
  end_date: string;
  reason: string;
  status: 'pending' | 'approved' | 'rejected';
  created_at: string;
  updated_at: string;
}

export interface ApiResponse<T> {
  data?: T;
  error?: string;
  message?: string;
}

export type SickLeaveFormData = Omit<SickLeaveRequest, 'id' | 'status' | 'created_at' | 'updated_at' | 'employee_name'>;

export interface FilterOptions {
  status?: string;
  employee_id?: number;
} 