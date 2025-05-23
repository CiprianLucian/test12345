import { useState, useEffect } from 'react';
import type { SickLeaveRequest, Employee, FilterOptions } from '../types';
import { getSickLeaveRequests, approveSickLeaveRequest, rejectSickLeaveRequest, getEmployees } from '../services/api';

const SickLeaveAdminDashboard = () => {
  const [requests, setRequests] = useState<SickLeaveRequest[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<FilterOptions>({
    status: 'pending' // Default to showing pending requests
  });
  const [rejectionReason, setRejectionReason] = useState<string>('');
  const [rejectionModalOpen, setRejectionModalOpen] = useState<boolean>(false);
  const [selectedRequestId, setSelectedRequestId] = useState<number | null>(null);
  const [notification, setNotification] = useState<{ type: 'success' | 'error', message: string } | null>(null);
  
  // Load requests and employees on component mount
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        const [requestsData, employeesData] = await Promise.all([
          getSickLeaveRequests(filters),
          getEmployees()
        ]);
        
        setRequests(requestsData);
        setEmployees(employeesData);
        setError(null);
      } catch (err) {
        setError('Failed to load data');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    
    loadData();
  }, [filters]);
  
  // Filter handling
  const handleFilterChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const { name, value } = e.target;
    
    setFilters(prev => ({
      ...prev,
      [name]: value === 'all' ? undefined : name === 'employee_id' ? parseInt(value, 10) : value
    }));
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
  
  // Calculate days count
  const calculateDaysCount = (startDate: string, endDate: string) => {
    const start = new Date(startDate);
    const end = new Date(endDate);
    let daysCount = 0;
    const currentDate = new Date(start);
    
    while (currentDate <= end) {
      const dayOfWeek = currentDate.getDay();
      if (dayOfWeek !== 0 && dayOfWeek !== 6) { // Not Sunday (0) or Saturday (6)
        daysCount++;
      }
      currentDate.setDate(currentDate.getDate() + 1);
    }
    
    return daysCount;
  };
  
  // Handle approval
  const handleApprove = async (id: number) => {
    try {
      setLoading(true);
      await approveSickLeaveRequest(id);
      
      // Refresh the requests list
      const updatedRequests = await getSickLeaveRequests(filters);
      setRequests(updatedRequests);
      
      setNotification({
        type: 'success',
        message: 'Sick leave request approved successfully'
      });
      
      // Clear notification after 3 seconds
      setTimeout(() => {
        setNotification(null);
      }, 3000);
    } catch (err) {
      setNotification({
        type: 'error',
        message: err instanceof Error ? err.message : 'Failed to approve request'
      });
      console.error(err);
    } finally {
      setLoading(false);
    }
  };
  
  // Open rejection modal
  const openRejectionModal = (id: number) => {
    setSelectedRequestId(id);
    setRejectionReason('');
    setRejectionModalOpen(true);
  };
  
  // Handle rejection form submission
  const handleReject = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedRequestId) return;
    
    if (!rejectionReason.trim()) {
      setNotification({
        type: 'error',
        message: 'Please provide a reason for rejection'
      });
      return;
    }
    
    try {
      setLoading(true);
      await rejectSickLeaveRequest(selectedRequestId, rejectionReason);
      
      // Close modal
      setRejectionModalOpen(false);
      
      // Refresh the requests list
      const updatedRequests = await getSickLeaveRequests(filters);
      setRequests(updatedRequests);
      
      setNotification({
        type: 'success',
        message: 'Sick leave request rejected successfully'
      });
      
      // Clear notification after 3 seconds
      setTimeout(() => {
        setNotification(null);
      }, 3000);
    } catch (err) {
      setNotification({
        type: 'error',
        message: err instanceof Error ? err.message : 'Failed to reject request'
      });
      console.error(err);
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <h2 className="text-2xl font-semibold mb-4">Sick Leave Administration</h2>
      
      {notification && (
        <div 
          className={`${
            notification.type === 'success' ? 'bg-green-100 border-green-400 text-green-700' : 'bg-red-100 border-red-400 text-red-700'
          } px-4 py-3 rounded mb-4`} 
          role="alert"
        >
          <span className="font-bold">{notification.type === 'success' ? 'Success:' : 'Error:'}</span> {notification.message}
        </div>
      )}
      
      {/* Filters */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6 bg-gray-50 p-4 rounded-md">
        <div>
          <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-1">Status</label>
          <select
            id="status"
            name="status"
            value={filters.status || 'all'}
            onChange={handleFilterChange}
            className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="all">All Statuses</option>
            <option value="pending">Pending</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
          </select>
        </div>
        
        <div>
          <label htmlFor="employee_id" className="block text-sm font-medium text-gray-700 mb-1">Employee</label>
          <select
            id="employee_id"
            name="employee_id"
            value={filters.employee_id || 'all'}
            onChange={handleFilterChange}
            className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="all">All Employees</option>
            {employees.map((employee) => (
              <option key={employee.id} value={employee.id}>
                {employee.name}
              </option>
            ))}
          </select>
        </div>
      </div>
      
      {/* Requests Table */}
      {loading && <div className="text-center py-4">Loading...</div>}
      
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4" role="alert">
          <span className="font-bold">Error:</span> {error}
        </div>
      )}
      
      {!loading && !error && requests.length === 0 && (
        <div className="text-center py-8 bg-gray-50 rounded-md">
          <p className="text-gray-500">No sick leave requests found matching your filters.</p>
        </div>
      )}
      
      {!loading && !error && requests.length > 0 && (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Employee
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Dates
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Days
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Reason
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Submitted
                </th>
                <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {requests.map((request) => (
                <tr key={request.id}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="font-medium text-gray-900">{request.employee_name}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {formatDate(request.start_date)} - {formatDate(request.end_date)}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {calculateDaysCount(request.start_date, request.end_date)} days
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-gray-900 max-w-xs truncate">{request.reason}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      request.status === 'approved' ? 'bg-green-100 text-green-800' : 
                      request.status === 'rejected' ? 'bg-red-100 text-red-800' : 
                      'bg-yellow-100 text-yellow-800'
                    }`}>
                      {request.status.charAt(0).toUpperCase() + request.status.slice(1)}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {formatDate(request.created_at)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    {request.status === 'pending' && (
                      <div className="flex justify-end space-x-2">
                        <button
                          onClick={() => handleApprove(request.id)}
                          disabled={loading}
                          className="text-green-600 hover:text-green-900 font-medium"
                        >
                          Approve
                        </button>
                        <button
                          onClick={() => openRejectionModal(request.id)}
                          disabled={loading}
                          className="text-red-600 hover:text-red-900 font-medium"
                        >
                          Reject
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      
      {/* Rejection Modal */}
      {rejectionModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Reject Sick Leave Request</h3>
            
            <form onSubmit={handleReject}>
              <div className="mb-4">
                <label htmlFor="rejectionReason" className="block text-sm font-medium text-gray-700 mb-1">
                  Reason for Rejection
                </label>
                <textarea
                  id="rejectionReason"
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  rows={4}
                  className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Please provide a reason for rejecting this request"
                  required
                />
              </div>
              
              <div className="flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setRejectionModalOpen(false)}
                  className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 disabled:opacity-50"
                >
                  {loading ? 'Submitting...' : 'Reject Request'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default SickLeaveAdminDashboard; 