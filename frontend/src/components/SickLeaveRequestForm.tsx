import { useState, useEffect } from 'react';
import type { Employee, SickLeaveFormData } from '../types';
import { getEmployees, getEmployeeSickDays, createSickLeaveRequest } from '../services/api';

interface SickLeaveRequestFormProps {
  onRequestSubmitted: () => void;
}

const SickLeaveRequestForm = ({ onRequestSubmitted }: SickLeaveRequestFormProps) => {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [remainingDays, setRemainingDays] = useState<number | null>(null);
  const [requestedDays, setRequestedDays] = useState<number | null>(null);
  
  const [formData, setFormData] = useState<SickLeaveFormData>({
    employee_id: 0,
    start_date: '',
    end_date: '',
    reason: ''
  });
  
  useEffect(() => {
    const loadEmployees = async () => {
      try {
        const data = await getEmployees();
        setEmployees(data);
      } catch (err) {
        setError('Failed to load employees');
        console.error(err);
      }
    };
    
    loadEmployees();
  }, []);
  
  useEffect(() => {
    if (formData.employee_id) {
      const fetchSickDays = async () => {
        try {
          const data = await getEmployeeSickDays(formData.employee_id);
          setRemainingDays(data.sick_days_remaining);
        } catch (err) {
          console.error(err);
        }
      };
      
      fetchSickDays();
    } else {
      setRemainingDays(null);
    }
  }, [formData.employee_id]);
  
  useEffect(() => {
    if (formData.start_date && formData.end_date) {
      const startDate = new Date(formData.start_date);
      const endDate = new Date(formData.end_date);
      
      if (startDate <= endDate) {
        // Calculate working days (excluding weekends)
        let daysCount = 0;
        const currentDate = new Date(startDate);
        
        while (currentDate <= endDate) {
          const dayOfWeek = currentDate.getDay();
          if (dayOfWeek !== 0 && dayOfWeek !== 6) { // Not Sunday (0) or Saturday (6)
            daysCount++;
          }
          currentDate.setDate(currentDate.getDate() + 1);
        }
        
        setRequestedDays(daysCount);
      } else {
        setRequestedDays(null);
      }
    } else {
      setRequestedDays(null);
    }
  }, [formData.start_date, formData.end_date]);
  
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name === 'employee_id' ? parseInt(value, 10) : value
    }));
    
    // Reset error and success when form is edited
    setError(null);
    setSuccess(null);
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate form
    if (!formData.employee_id) {
      setError('Please select an employee');
      return;
    }
    
    if (!formData.start_date || !formData.end_date) {
      setError('Please select both start and end dates');
      return;
    }
    
    if (!formData.reason.trim()) {
      setError('Please provide a reason for sick leave');
      return;
    }
    
    const startDate = new Date(formData.start_date);
    const endDate = new Date(formData.end_date);
    
    if (startDate > endDate) {
      setError('End date must be after start date');
      return;
    }
    
    if (remainingDays !== null && requestedDays !== null && requestedDays > remainingDays) {
      setError(`Not enough sick days available. You have ${remainingDays} days remaining but requested ${requestedDays} days.`);
      return;
    }
    
    setLoading(true);
    setError(null);
      try {
      await createSickLeaveRequest(formData);
      
      setSuccess('Sick leave request submitted successfully!');
      setFormData({
        employee_id: 0,
        start_date: '',
        end_date: '',
        reason: ''
      });
      
      // Notify parent component
      onRequestSubmitted();
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('Failed to submit sick leave request');
      }
      console.error(err);
    } finally {
      setLoading(false);
    }
  };
  
  // Get today's date in YYYY-MM-DD format for min attribute
  const today = new Date().toISOString().split('T')[0];
  
  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <h2 className="text-2xl font-semibold mb-4">Request Sick Leave</h2>
      
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4" role="alert">
          <span className="font-bold">Error:</span> {error}
        </div>
      )}
      
      {success && (
        <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4" role="alert">
          <span className="font-bold">Success:</span> {success}
        </div>
      )}
      
      <form onSubmit={handleSubmit}>
        <div className="mb-4">
          <label htmlFor="employee_id" className="block text-sm font-medium text-gray-700 mb-1">Employee</label>
          <select
            id="employee_id"
            name="employee_id"
            value={formData.employee_id}
            onChange={handleChange}
            className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
            required
          >
            <option value="">Select an employee</option>
            {employees.map((employee) => (
              <option key={employee.id} value={employee.id}>
                {employee.name} ({employee.department})
              </option>
            ))}
          </select>
        </div>
        
        {remainingDays !== null && (
          <div className="mb-4 p-3 bg-blue-50 rounded-md">
            <p className="text-sm text-blue-800">
              <span className="font-medium">Available sick days:</span> {remainingDays} days
            </p>
            {requestedDays !== null && (
              <p className="text-sm text-blue-800 mt-1">
                <span className="font-medium">Requested:</span> {requestedDays} working days
                {requestedDays > remainingDays && (
                  <span className="text-red-600 font-bold ml-2">Exceeds available days!</span>
                )}
              </p>
            )}
          </div>
        )}
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div>
            <label htmlFor="start_date" className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
            <input
              type="date"
              id="start_date"
              name="start_date"
              value={formData.start_date}
              onChange={handleChange}
              min={today}
              className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              required
            />
          </div>
          
          <div>
            <label htmlFor="end_date" className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
            <input
              type="date"
              id="end_date"
              name="end_date"
              value={formData.end_date}
              onChange={handleChange}
              min={formData.start_date || today}
              className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              required
            />
          </div>
        </div>
        
        <div className="mb-6">
          <label htmlFor="reason" className="block text-sm font-medium text-gray-700 mb-1">Reason</label>
          <textarea
            id="reason"
            name="reason"
            value={formData.reason}
            onChange={handleChange}
            rows={4}
            className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
            placeholder="Please provide a reason for your sick leave request"
            required
          />
        </div>
        
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={loading}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50"
          >
            {loading ? 'Submitting...' : 'Submit Request'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default SickLeaveRequestForm; 