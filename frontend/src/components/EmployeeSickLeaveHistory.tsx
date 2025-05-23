import { useState, useEffect } from 'react';
import type { SickLeaveRequest, Employee } from '../types';
import { getSickLeaveRequests, getEmployees, getEmployeeSickDays } from '../services/api';

interface EmployeeSickLeaveHistoryProps {
  employeeId?: number;
  allowEmployeeSelection?: boolean;
}

const EmployeeSickLeaveHistory = ({ 
  employeeId: initialEmployeeId, 
  allowEmployeeSelection = true 
}: EmployeeSickLeaveHistoryProps) => {
  const [requests, setRequests] = useState<SickLeaveRequest[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<number | undefined>(initialEmployeeId);
  const [remainingSickDays, setRemainingSickDays] = useState<number | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  
  // Load employees on component mount
  useEffect(() => {
    const loadEmployees = async () => {
      try {
        const data = await getEmployees();
        setEmployees(data);
        
        // If there's no initial employee id but we have employees, select the first one
        if (!initialEmployeeId && !selectedEmployeeId && data.length > 0) {
          setSelectedEmployeeId(data[0].id);
        }
      } catch (err) {
        setError('Failed to load employees');
        console.error(err);
      }
    };
    
    loadEmployees();
  }, [initialEmployeeId, selectedEmployeeId]);
  
  // Load requests and remaining sick days when employee changes
  useEffect(() => {
    const loadEmployeeData = async () => {
      if (!selectedEmployeeId) return;
      
      setLoading(true);
      setError(null);
      
      try {
        const [requestsData, sickDaysData] = await Promise.all([
          getSickLeaveRequests({ employee_id: selectedEmployeeId }),
          getEmployeeSickDays(selectedEmployeeId)
        ]);
        
        setRequests(requestsData);
        setRemainingSickDays(sickDaysData.sick_days_remaining);
      } catch (err) {
        setError('Failed to load employee data');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    
    loadEmployeeData();
  }, [selectedEmployeeId]);
  
  // Handle employee selection change
  const handleEmployeeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value;
    setSelectedEmployeeId(value ? parseInt(value, 10) : undefined);
  };
  
  // Format date string
  const formatDate = (dateString: string) => {
    const options: Intl.DateTimeFormatOptions = { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };
  
  // Get status badge color
  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case 'approved':
        return 'bg-green-100 text-green-800';
      case 'rejected':
        return 'bg-red-100 text-red-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };
  
  // Get current employee
  const currentEmployee = employees.find(emp => emp.id === selectedEmployeeId);
  
  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <h2 className="text-2xl font-semibold mb-4">Sick Leave History</h2>
      
      {/* Employee Selection */}
      {allowEmployeeSelection && (
        <div className="mb-6">
          <label htmlFor="employee" className="block text-sm font-medium text-gray-700 mb-1">
            Select Employee
          </label>
          <select
            id="employee"
            value={selectedEmployeeId || ''}
            onChange={handleEmployeeChange}
            className="w-full md:w-1/2 p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="">Select an employee</option>
            {employees.map((employee) => (
              <option key={employee.id} value={employee.id}>
                {employee.name} ({employee.department})
              </option>
            ))}
          </select>
        </div>
      )}
      
      {/* Employee Info */}
      {currentEmployee && remainingSickDays !== null && (
        <div className="mb-6 p-4 bg-blue-50 rounded-md">
          <h3 className="font-medium text-lg text-blue-900">{currentEmployee.name}</h3>
          <p className="text-blue-800">Department: {currentEmployee.department}</p>
          <p className="text-blue-800">Email: {currentEmployee.email}</p>
          <p className="mt-2">
            <span className="font-semibold text-blue-900">Remaining Sick Days:</span>{' '}
            <span className={remainingSickDays < 3 ? 'text-red-600 font-bold' : 'text-blue-800'}>
              {remainingSickDays} days
            </span>
          </p>
        </div>
      )}
      
      {/* Loading and Error States */}
      {loading && <div className="text-center py-4">Loading...</div>}
      
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4" role="alert">
          <span className="font-bold">Error:</span> {error}
        </div>
      )}
      
      {/* No Requests Message */}
      {!loading && !error && selectedEmployeeId && requests.length === 0 && (
        <div className="text-center py-8 bg-gray-50 rounded-md">
          <p className="text-gray-500">No sick leave requests found for this employee.</p>
        </div>
      )}
      
      {/* Requests List */}
      {!loading && !error && requests.length > 0 && (
        <div>
          <h3 className="text-lg font-medium mb-4">Request History</h3>
          
          <div className="space-y-4">
            {requests.map((request) => (
              <div key={request.id} className="border rounded-md overflow-hidden">
                <div className="bg-gray-50 px-4 py-2 flex justify-between items-center">
                  <div>
                    <span className="font-medium">
                      {formatDate(request.start_date)} - {formatDate(request.end_date)}
                    </span>
                  </div>
                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusBadgeClass(request.status)}`}>
                    {request.status.charAt(0).toUpperCase() + request.status.slice(1)}
                  </span>
                </div>
                
                <div className="px-4 py-3">
                  <div className="mb-2">
                    <span className="font-medium text-gray-700">Reason:</span>
                    <p className="text-gray-600">{request.reason}</p>
                  </div>
                  
                  <div className="text-sm text-gray-500">
                    Submitted on {formatDate(request.created_at)}
                    {request.created_at !== request.updated_at && (
                      <span> · Updated on {formatDate(request.updated_at)}</span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default EmployeeSickLeaveHistory; 