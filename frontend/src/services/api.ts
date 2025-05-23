import type { Employee, SickLeaveRequest, SickLeaveFormData, FilterOptions } from '../types';

const API_URL = import.meta.env.VITE_API_URL 
  ? `${import.meta.env.VITE_API_URL}/api`
  : 'http://localhost:5000/api';

// Generic fetch utility
const fetchData = async <T>(
  endpoint: string, 
  options: RequestInit = {}
): Promise<T> => {
  const response = await fetch(`${API_URL}${endpoint}`, {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    ...options,
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Something went wrong');
  }

  return response.json();
};

// Employee related API calls
export const getEmployees = (): Promise<Employee[]> => {
  return fetchData<Employee[]>('/employees');
};

export const getEmployeeSickDays = (id: number): Promise<{ sick_days_remaining: number }> => {
  return fetchData<{ sick_days_remaining: number }>(`/employees/${id}/sick-days`);
};

// Sick leave related API calls
export const getSickLeaveRequests = (filters?: FilterOptions): Promise<SickLeaveRequest[]> => {
  let queryParams = '';
  
  if (filters) {
    const params = new URLSearchParams();
    if (filters.status) params.append('status', filters.status);
    if (filters.employee_id) params.append('employee_id', filters.employee_id.toString());
    queryParams = `?${params.toString()}`;
  }
  
  return fetchData<SickLeaveRequest[]>(`/sick-leave${queryParams}`);
};

export const getSickLeaveRequest = (id: number): Promise<SickLeaveRequest> => {
  return fetchData<SickLeaveRequest>(`/sick-leave/${id}`);
};

export const createSickLeaveRequest = (data: SickLeaveFormData): Promise<SickLeaveRequest> => {
  return fetchData<SickLeaveRequest>('/sick-leave', {
    method: 'POST',
    body: JSON.stringify(data),
  });
};

export const approveSickLeaveRequest = (id: number): Promise<{ 
  message: string;
  request: SickLeaveRequest;
  employee: Employee;
}> => {
  return fetchData<{ message: string; request: SickLeaveRequest; employee: Employee }>(
    `/sick-leave/${id}/approve`, 
    { method: 'PUT' }
  );
};

export const rejectSickLeaveRequest = (
  id: number, 
  reason: string
): Promise<{ 
  message: string;
  request: SickLeaveRequest;
  rejection_reason: string;
}> => {
  return fetchData<{ message: string; request: SickLeaveRequest; rejection_reason: string }>(
    `/sick-leave/${id}/reject`, 
    { 
      method: 'PUT',
      body: JSON.stringify({ reason }),
    }
  );
}; 