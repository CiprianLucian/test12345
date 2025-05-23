import { formatDate, calculateWorkingDays, getStatusClass } from '../index';

describe('Utility Functions', () => {
  describe('formatDate', () => {
    it('formats date strings correctly', () => {
      const formatted1 = formatDate('2025-01-01');
      expect(formatted1).toMatch(/Jan(uary)? 1,? 2025/);
      
      const formatted2 = formatDate('2025-12-31');
      expect(formatted2).toMatch(/Dec(ember)? 31,? 2025/);
      
      const formatted3 = formatDate('2025-02-15T12:00:00.000Z');
      expect(formatted3).toMatch(/Feb(ruary)? 15,? 2025/);
    });
    
    it('handles invalid dates gracefully', () => {
      // This will output "Invalid Date" or something similar, we just want to make sure it doesn't throw
      expect(() => formatDate('invalid-date')).not.toThrow();
    });
  });
  
  describe('calculateWorkingDays', () => {
    it('calculates working days correctly for weekday ranges', () => {
      // Monday to Friday (5 working days)
      expect(calculateWorkingDays('2025-01-06', '2025-01-10')).toBe(5);
      
      // Wednesday to Friday (3 working days)
      expect(calculateWorkingDays('2025-01-08', '2025-01-10')).toBe(3);
      
      // Monday to Wednesday (3 working days)
      expect(calculateWorkingDays('2025-01-06', '2025-01-08')).toBe(3);
    });
    
    it('handles weekend days correctly', () => {
      // Friday to Monday (2 working days: Friday and Monday)
      expect(calculateWorkingDays('2025-01-03', '2025-01-06')).toBe(2);
      
      // Saturday to Sunday (0 working days)
      expect(calculateWorkingDays('2025-01-04', '2025-01-05')).toBe(0);
      
      // Friday to Wednesday next week (4 working days: Fri, Mon, Tue, Wed)
      expect(calculateWorkingDays('2025-01-03', '2025-01-08')).toBe(4);
    });
    
    it('returns 0 for invalid date inputs', () => {
      expect(calculateWorkingDays('invalid', '2025-01-10')).toBe(0);
      expect(calculateWorkingDays('2025-01-06', 'invalid')).toBe(0);
    });
    
    it('returns 0 when end date is before start date', () => {
      expect(calculateWorkingDays('2025-01-10', '2025-01-06')).toBe(0);
    });
    
    it('returns 1 for same day if it is a weekday', () => {
      // Monday
      expect(calculateWorkingDays('2025-01-06', '2025-01-06')).toBe(1);
      
      // Friday
      expect(calculateWorkingDays('2025-01-10', '2025-01-10')).toBe(1);
    });
    
    it('returns 0 for same day if it is a weekend', () => {
      // Saturday
      expect(calculateWorkingDays('2025-01-04', '2025-01-04')).toBe(0);
      
      // Sunday
      expect(calculateWorkingDays('2025-01-05', '2025-01-05')).toBe(0);
    });
  });
  
  describe('getStatusClass', () => {
    it('returns correct class for approved status', () => {
      // Allow for different class implementations as long as they contain green for approved
      const approvedClass = getStatusClass('approved');
      expect(approvedClass).toMatch(/green/i);
      
      const upperApprovedClass = getStatusClass('APPROVED');
      expect(upperApprovedClass).toMatch(/green/i);
      
      const titleApprovedClass = getStatusClass('Approved');
      expect(titleApprovedClass).toMatch(/green/i);
    });
    
    it('returns correct class for rejected status', () => {
      // Allow for different class implementations as long as they contain red for rejected
      const rejectedClass = getStatusClass('rejected');
      expect(rejectedClass).toMatch(/red/i);
      
      const upperRejectedClass = getStatusClass('REJECTED');
      expect(upperRejectedClass).toMatch(/red/i);
      
      const titleRejectedClass = getStatusClass('Rejected');
      expect(titleRejectedClass).toMatch(/red/i);
    });
    
    it('returns correct class for pending status', () => {
      // Allow for different class implementations as long as they contain yellow for pending
      const pendingClass = getStatusClass('pending');
      expect(pendingClass).toMatch(/yellow/i);
      
      const upperPendingClass = getStatusClass('PENDING');
      expect(upperPendingClass).toMatch(/yellow/i);
      
      const titlePendingClass = getStatusClass('Pending');
      expect(titlePendingClass).toMatch(/yellow/i);
    });
    
    it('returns default class for unknown status', () => {
      // Allow for different class implementations as long as they contain gray for unknown
      const unknownClass = getStatusClass('unknown');
      expect(unknownClass).toMatch(/gray/i);
      
      const emptyClass = getStatusClass('');
      expect(emptyClass).toMatch(/gray/i);
    });
  });
}); 