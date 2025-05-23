import { render, screen } from '@testing-library/react';
import SickLeaveRequestForm from '../SickLeaveRequestForm';
import * as api from '../../services/api';
import '@testing-library/jest-dom';

// Mock the API functions
jest.mock('../../services/api', () => ({
  getEmployees: jest.fn().mockResolvedValue([
    { id: 1, name: 'John Doe', email: 'john@example.com', department: 'Engineering', sick_days_remaining: 10 },
    { id: 2, name: 'Jane Smith', email: 'jane@example.com', department: 'HR', sick_days_remaining: 5 }
  ]),
  getEmployeeSickDays: jest.fn().mockResolvedValue({ sick_days_remaining: 10 }),
  createSickLeaveRequest: jest.fn().mockResolvedValue({
    id: 1,
    employee_id: 1,
    start_date: '2025-01-01',
    end_date: '2025-01-03',
    reason: 'Testing',
    status: 'pending',
    created_at: '2024-01-01',
    updated_at: '2024-01-01'
  })
}));

describe('SickLeaveRequestForm', () => {
  // Setup mock for Date.now()
  beforeAll(() => {
    jest.spyOn(global.Date, 'now').mockImplementation(() => new Date('2025-05-23').valueOf());
  });

  afterAll(() => {
    jest.restoreAllMocks();
  });

  it('renders the form correctly', async () => {
    render(<SickLeaveRequestForm onRequestSubmitted={() => {}} />);
    
    // Check the title exists
    expect(screen.getByText('Request Sick Leave')).toBeInTheDocument();
    
    // Check form elements exist
    expect(screen.getByLabelText(/Employee/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Start Date/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/End Date/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Reason/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Submit Request/i })).toBeInTheDocument();
  });
}); 