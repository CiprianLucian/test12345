/**
 * Format a date string to a more readable format (e.g., "Jan 1, 2025")
 */
export const formatDate = (dateString: string): string => {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });
};

/**
 * Calculate the number of working days between two dates (excluding weekends)
 */
export const calculateWorkingDays = (startDateStr: string, endDateStr: string): number => {
  const startDate = new Date(startDateStr);
  const endDate = new Date(endDateStr);
  
  // Handle invalid dates
  if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
    return 0;
  }
  
  // Handle end date before start date
  if (startDate > endDate) {
    return 0;
  }
  
  // Calculate working days (excluding weekends)
  let daysCount = 0;
  const currentDate = new Date(startDate);
  
  // Iterate through each day from start date to end date
  while (currentDate <= endDate) {
    const dayOfWeek = currentDate.getDay();
    
    // Skip weekends (0 = Sunday, 6 = Saturday)
    if (dayOfWeek !== 0 && dayOfWeek !== 6) {
      daysCount++;
    }
    
    // Move to the next day
    currentDate.setDate(currentDate.getDate() + 1);
  }
  
  return daysCount;
};

/**
 * Get status badge class based on status
 */
export const getStatusClass = (status: string): string => {
  switch (status.toLowerCase()) {
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