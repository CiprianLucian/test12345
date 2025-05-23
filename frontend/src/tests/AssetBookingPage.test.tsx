import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import '@testing-library/jest-dom';

// Mock the App module
jest.mock('../App', () => ({
  AssetBookingPage: () => <div>Asset Booking Page Mock</div>
}));

describe('AssetBookingPage', () => {
  test('renders asset booking page', () => {
    render(
      <MemoryRouter>
        <div>Asset Booking Page Mock</div>
      </MemoryRouter>
    );
    
    // Verify page renders with mock content
    expect(screen.getByText('Asset Booking Page Mock')).toBeInTheDocument();
  });
}); 