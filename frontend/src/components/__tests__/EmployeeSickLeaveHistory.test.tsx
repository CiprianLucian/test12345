import { render, screen } from '@testing-library/react';
import EmployeeSickLeaveHistory from '../EmployeeSickLeaveHistory';
import '@testing-library/jest-dom';

// Mock the API functions
jest.mock('../../services/api', () => ({
  getSickLeaveRequests: jest.fn().mockResolvedValue([
    {
      id: 1,
      employee_id: 1,
      employee_name: 'John Doe',
      start_date: '2025-01-01',
      end_date: '2025-01-03',
      reason: 'Flu',
      status: 'approved',
      created_at: '2024-01-01T00:00:00Z',
      updated_at: '2024-01-01T00:00:00Z'
    }
  ]),
  getEmployees: jest.fn().mockResolvedValue([
    { id: 1, name: 'John Doe', email: 'john@example.com', department: 'Engineering', sick_days_remaining: 10 }
  ]),
  getEmployeeSickDays: jest.fn().mockResolvedValue({ sick_days_remaining: 10 })
}));

describe('EmployeeSickLeaveHistory', () => {
  it('renders the component title', () => {
    render(<EmployeeSickLeaveHistory employeeId={1} />);
    
    // Check title is rendered
    expect(screen.getByText('Sick Leave History')).toBeInTheDocument();
  });
}); 