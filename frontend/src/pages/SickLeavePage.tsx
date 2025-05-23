import { useState } from 'react';
import SickLeaveRequestForm from '../components/SickLeaveRequestForm';
import SickLeaveAdminDashboard from '../components/SickLeaveAdminDashboard';
import EmployeeSickLeaveHistory from '../components/EmployeeSickLeaveHistory';

const SickLeavePage = () => {
  const [activeTab, setActiveTab] = useState<'request' | 'history' | 'admin'>('request');
  const [refreshKey, setRefreshKey] = useState<number>(0);
  
  // Handle request submission to refresh the history tab
  const handleRequestSubmitted = () => {
    setRefreshKey(prev => prev + 1);
  };
  
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8 text-center text-blue-800">Sick Leave Management</h1>
      
      {/* Tab Navigation */}
      <div className="flex border-b border-gray-200 mb-6">
        <button
          className={`py-2 px-4 font-medium text-sm focus:outline-none ${
            activeTab === 'request' 
              ? 'text-blue-600 border-b-2 border-blue-500' 
              : 'text-gray-500 hover:text-gray-700 hover:border-gray-300'
          }`}
          onClick={() => setActiveTab('request')}
        >
          Request Sick Leave
        </button>
        <button
          className={`py-2 px-4 font-medium text-sm focus:outline-none ${
            activeTab === 'history' 
              ? 'text-blue-600 border-b-2 border-blue-500' 
              : 'text-gray-500 hover:text-gray-700 hover:border-gray-300'
          }`}
          onClick={() => setActiveTab('history')}
        >
          My History
        </button>
        <button
          className={`py-2 px-4 font-medium text-sm focus:outline-none ${
            activeTab === 'admin' 
              ? 'text-blue-600 border-b-2 border-blue-500' 
              : 'text-gray-500 hover:text-gray-700 hover:border-gray-300'
          }`}
          onClick={() => setActiveTab('admin')}
        >
          Admin Dashboard
        </button>
      </div>
      
      {/* Tab Content */}
      <div className="mb-10">
        {activeTab === 'request' && (
          <SickLeaveRequestForm onRequestSubmitted={handleRequestSubmitted} />
        )}
        
        {activeTab === 'history' && (
          <EmployeeSickLeaveHistory key={refreshKey} />
        )}
        
        {activeTab === 'admin' && (
          <SickLeaveAdminDashboard />
        )}
      </div>
    </div>
  );
};

export default SickLeavePage; 