import { 
  getEmployees, 
  getEmployeeSickDays, 
  getSickLeaveRequests, 
  createSickLeaveRequest,
  approveSickLeaveRequest,
  rejectSickLeaveRequest
} from '../api';
import type { SickLeaveRequest } from '../../types';

describe('API Service', () => {
  // Save original fetch
  const originalFetch = global.fetch;
  
  beforeEach(() => {
    // Mock fetch
    global.fetch = jest.fn();
  });
  
  afterEach(() => {
    // Restore original fetch
    global.fetch = originalFetch;
    
    // Clear all mocks
    jest.clearAllMocks();
  });
  
  it('getEmployees fetches employees correctly', async () => {
    const mockEmployees = [
      { id: 1, name: 'John Doe', email: 'john@example.com', department: 'Engineering', sick_days_remaining: 10 },
      { id: 2, name: 'Jane Smith', email: 'jane@example.com', department: 'HR', sick_days_remaining: 5 }
    ];
    
    // Mock fetch response
    global.fetch = jest.fn().mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(mockEmployees)
    } as Response);
    
    const result = await getEmployees();
    
    // Check that fetch was called with correct URL
    expect(global.fetch).toHaveBeenCalledWith(
      'http://localhost:5000/api/employees',
      expect.objectContaining({
        headers: {
          'Content-Type': 'application/json'
        }
      })
    );
    
    // Check result
    expect(result).toEqual(mockEmployees);
  });
  
  it('getEmployeeSickDays fetches employee sick days correctly', async () => {
    const mockSickDays = { sick_days_remaining: 10 };
    
    // Mock fetch response
    global.fetch = jest.fn().mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(mockSickDays)
    } as Response);
    
    const result = await getEmployeeSickDays(1);
    
    // Check that fetch was called with correct URL
    expect(global.fetch).toHaveBeenCalledWith(
      'http://localhost:5000/api/employees/1/sick-days',
      expect.objectContaining({
        headers: {
          'Content-Type': 'application/json'
        }
      })
    );
    
    // Check result
    expect(result).toEqual(mockSickDays);
  });
  
  it('getSickLeaveRequests fetches requests correctly', async () => {
    const mockRequests: SickLeaveRequest[] = [
      {
        id: 1,
        employee_id: 1,
        employee_name: 'John Doe',
        start_date: '2025-01-01',
        end_date: '2025-01-03',
        reason: 'Sick',
        status: 'pending',
        created_at: '2024-01-01',
        updated_at: '2024-01-01'
      }
    ];
    
    // Mock fetch response
    global.fetch = jest.fn().mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(mockRequests)
    } as Response);
    
    const result = await getSickLeaveRequests();
    
    // Check that fetch was called with correct URL
    expect(global.fetch).toHaveBeenCalledWith(
      'http://localhost:5000/api/sick-leave',
      expect.objectContaining({
        headers: {
          'Content-Type': 'application/json'
        }
      })
    );
    
    // Check result
    expect(result).toEqual(mockRequests);
  });
  
  it('getSickLeaveRequests with filters constructs correct URL', async () => {
    const mockRequests: SickLeaveRequest[] = [];
    
    // Mock fetch response
    global.fetch = jest.fn().mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(mockRequests)
    } as Response);
    
    await getSickLeaveRequests({ status: 'pending', employee_id: 1 });
    
    // Check that fetch was called with correct URL including query parameters
    expect(global.fetch).toHaveBeenCalledWith(
      'http://localhost:5000/api/sick-leave?status=pending&employee_id=1',
      expect.objectContaining({
        headers: {
          'Content-Type': 'application/json'
        }
      })
    );
  });
  
  it('createSickLeaveRequest sends correct data', async () => {
    const requestData = {
      employee_id: 1,
      start_date: '2025-01-01',
      end_date: '2025-01-03',
      reason: 'Sick'
    };
    
    const mockResponse = {
      id: 1,
      ...requestData,
      status: 'pending',
      created_at: '2024-01-01',
      updated_at: '2024-01-01'
    };
    
    // Mock fetch response
    global.fetch = jest.fn().mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(mockResponse)
    } as Response);
    
    const result = await createSickLeaveRequest(requestData);
    
    // Check that fetch was called with correct URL and data
    expect(global.fetch).toHaveBeenCalledWith(
      'http://localhost:5000/api/sick-leave',
      expect.objectContaining({
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestData)
      })
    );
    
    // Check result
    expect(result).toEqual(mockResponse);
  });
  
  it('approveSickLeaveRequest sends correct request', async () => {
    const mockResponse = {
      message: 'Sick leave request approved',
      request: {
        id: 1,
        employee_id: 1,
        start_date: '2025-01-01',
        end_date: '2025-01-03',
        reason: 'Sick',
        status: 'approved',
        created_at: '2024-01-01',
        updated_at: '2024-01-01'
      },
      employee: {
        id: 1,
        name: 'John Doe',
        email: 'john@example.com',
        department: 'Engineering',
        sick_days_remaining: 7
      }
    };
    
    // Mock fetch response
    global.fetch = jest.fn().mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(mockResponse)
    } as Response);
    
    const result = await approveSickLeaveRequest(1);
    
    // Check that fetch was called with correct URL and method
    expect(global.fetch).toHaveBeenCalledWith(
      'http://localhost:5000/api/sick-leave/1/approve',
      expect.objectContaining({
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        }
      })
    );
    
    // Check result
    expect(result).toEqual(mockResponse);
  });
  
  it('rejectSickLeaveRequest sends correct data', async () => {
    const mockResponse = {
      message: 'Sick leave request rejected',
      request: {
        id: 1,
        employee_id: 1,
        start_date: '2025-01-01',
        end_date: '2025-01-03',
        reason: 'Sick',
        status: 'rejected',
        created_at: '2024-01-01',
        updated_at: '2024-01-01'
      },
      rejection_reason: 'Not applicable'
    };
    
    // Mock fetch response
    global.fetch = jest.fn().mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(mockResponse)
    } as Response);
    
    const result = await rejectSickLeaveRequest(1, 'Not applicable');
    
    // Check that fetch was called with correct URL, method and data
    expect(global.fetch).toHaveBeenCalledWith(
      'http://localhost:5000/api/sick-leave/1/reject',
      expect.objectContaining({
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ reason: 'Not applicable' })
      })
    );
    
    // Check result
    expect(result).toEqual(mockResponse);
  });
  
  it('handles API errors correctly', async () => {
    // Mock fetch response with error
    global.fetch = jest.fn().mockResolvedValueOnce({
      ok: false,
      json: () => Promise.resolve({ error: 'Server error' })
    } as Response);
    
    // Test that the API function throws an error
    await expect(getEmployees()).rejects.toThrow('Server error');
  });
}); 