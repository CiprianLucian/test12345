import { useState, useEffect } from 'react'
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom'
import axios from 'axios'
import './App.css'
import SickLeavePage from './pages/SickLeavePage'
import API_URL from './config'

// Home Page Component
function HomePage() {
  return (
    <div className="home-page">
      <h1>Employee Portal Dashboard</h1>
      
      <div className="welcome-message">
        <h2>Welcome to the Employee Portal</h2>
        <p>Select one of the options below to get started:</p>
      </div>
      
      <div className="dashboard-cards">
        <Link to="/sick-leave" className="dashboard-card sick-leave">
          <div className="card-icon">🏥</div>
          <h3>Sick Leave</h3>
          <p>Submit your sick leave with just a few clicks</p>
        </Link>
        
        <Link to="/education-social" className="dashboard-card education">
          <div className="card-icon">🎓</div>
          <h3>Education & Social</h3>
          <p>Sign up for learning and team-building events</p>
        </Link>
        
        <Link to="/corporate-travel" className="dashboard-card travel">
          <div className="card-icon">✈️</div>
          <h3>Corporate Travel</h3>
          <p>Book your business trips and transportation</p>
        </Link>
        
        <Link to="/maintenance" className="dashboard-card maintenance">
          <div className="card-icon">🔧</div>
          <h3>Maintenance Issues</h3>
          <p>Report facility issues that need attention</p>
        </Link>
        
        <Link to="/asset-booking" className="dashboard-card asset">
          <div className="card-icon">📋</div>
          <h3>Asset Booking</h3>
          <p>Reserve company equipment and resources</p>
        </Link>
        
        <Link to="/expense-report" className="dashboard-card expense">
          <div className="card-icon">💰</div>
          <h3>Expense Report</h3>
          <p>Submit and track your work-related expenses</p>
        </Link>
      </div>
    </div>
  );
}

// Add Item Page Component
function AddItemPage() {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!name.trim()) {
      setError('Name is required');
      return;
    }
    
    try {
      setSubmitting(true);
      await axios.post(`${API_URL}/items`, { name, description });
      setSuccess(true);
      setName('');
      setDescription('');
      setError('');
      
      // Reset success message after 3 seconds
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      console.error('Error adding item:', err);
      setError('Failed to add item. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="add-item-page">
      <h1>Add New Item</h1>
      
      {success && <p className="success-message">Item added successfully!</p>}
      {error && <p className="error-message">{error}</p>}
      
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="name">Name:</label>
          <input
            type="text"
            id="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            disabled={submitting}
            required
          />
        </div>
        
        <div className="form-group">
          <label htmlFor="description">Description:</label>
          <textarea
            id="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            disabled={submitting}
          />
        </div>
        
        <div className="form-actions">
          <button type="submit" disabled={submitting}>
            {submitting ? 'Adding...' : 'Add Item'}
          </button>
          <Link to="/" className="cancel-button">Cancel</Link>
        </div>
      </form>
    </div>
  );
}

// Education and Social Activities Page Component
function EducationSocialPage() {
  return (
    <div className="page education-social-page">
      <h1>Education and Social Activities</h1>
      <div className="page-description">
        <p>Want to learn something new, join a team-building event, or even organize one?</p>
      </div>
      <div className="page-content empty-state">
        <div className="empty-state-icon">🎓</div>
        <p className="empty-state-message">This page is under construction</p>
      </div>
    </div>
  );
}

// Corporate Travel Page Component
function CorporateTravelPage() {
  return (
    <div className="page corporate-travel-page">
      <h1>Corporate Travel</h1>
      <div className="page-description">
        <p>Got a meeting in another city? Arrange your flights and book your business trip.</p>
      </div>
      <div className="page-content empty-state">
        <div className="empty-state-icon">✈️</div>
        <p className="empty-state-message">This page is under construction</p>
      </div>
    </div>
  );
}

// Maintenance Issues Page Component
function MaintenanceIssuesPage() {
  return (
    <div className="page maintenance-issues-page">
      <h1>Maintenance Issues</h1>
      <div className="page-description">
        <p>Got a flickering light or a broken pipe? Report it and let the fixers do their magic.</p>
      </div>
      <div className="page-content empty-state">
        <div className="empty-state-icon">🔧</div>
        <p className="empty-state-message">This page is under construction</p>
      </div>
    </div>
  );
}

// Define interfaces for our data
interface Asset {
  id: number;
  name: string;
  type: string;
  location?: string;
  capacity?: number;
}

interface AssetBooking {
  id: number;
  employee_id: number;
  asset_id: number;
  asset_name?: string;
  start_date: string;
  end_date: string;
  purpose: string;
  status: 'pending' | 'approved' | 'rejected';
  created_at: string;
  updated_at?: string;
}

// Asset Booking Page Component
export function AssetBookingPage() {
  const [assets, setAssets] = useState<Asset[]>([]);
  const [bookings, setBookings] = useState<AssetBooking[]>([]);
  const [allBookings, setAllBookings] = useState<AssetBooking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Form state
  const [selectedAsset, setSelectedAsset] = useState<number | ''>('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [purpose, setPurpose] = useState('');
  
  // UI states
  const [isAvailable, setIsAvailable] = useState<boolean | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [activeTab, setActiveTab] = useState('book'); // 'book', 'myBookings', or 'allBookings'
  
  // For this demo, we'll use a static employee ID
  const EMPLOYEE_ID = 1;
  
  // Fetch assets and bookings on component mount
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        // Fetch assets
        const assetsResponse = await fetch(`${API_URL}/assets`);
        if (!assetsResponse.ok) {
          throw new Error('Failed to fetch assets');
        }
        const assetsData = await assetsResponse.json();
        setAssets(assetsData);
        
        // Fetch all bookings
        const bookingsResponse = await fetch(`${API_URL}/asset-bookings`);
        if (!bookingsResponse.ok) {
          throw new Error('Failed to fetch bookings');
        }
        const bookingsData = await bookingsResponse.json();
        
        // Enhance all bookings with asset names
        const enhancedAllBookings = bookingsData.map((booking: AssetBooking) => {
          const asset = assetsData.find((a: Asset) => a.id === booking.asset_id);
          return {
            ...booking,
            asset_name: asset ? asset.name : 'Unknown Asset'
          };
        });
        
        setAllBookings(enhancedAllBookings);
        
        // Filter bookings by the current employee ID
        const userBookings = bookingsData.filter(
          (booking: AssetBooking) => booking.employee_id === EMPLOYEE_ID
        );
        
        // Enhance user bookings with asset names
        const enhancedUserBookings = userBookings.map((booking: AssetBooking) => {
          const asset = assetsData.find((a: Asset) => a.id === booking.asset_id);
          return {
            ...booking,
            asset_name: asset ? asset.name : 'Unknown Asset'
          };
        });
        
        setBookings(enhancedUserBookings);
      } catch (err) {
        setError('Error loading data. Please try again later.');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, [API_URL]);
  
  // Check asset availability
  const checkAvailability = async () => {
    if (!selectedAsset || !startDate || !endDate) {
      setError('Please select an asset and specify the date range');
      return;
    }
    
    try {
      const response = await fetch(
        `${API_URL}/assets/${selectedAsset}/availability?start_date=${startDate}&end_date=${endDate}`
      );
      
      if (!response.ok) {
        throw new Error('Failed to check availability');
      }
      
      const data = await response.json();
      setIsAvailable(data.is_available);
      
      if (!data.is_available) {
        setError('This asset is not available for the selected time period');
      } else {
        setError('');
      }
    } catch (err) {
      setError('Error checking availability. Please try again.');
      console.error(err);
    }
  };
  
  // Create a new booking
  const createBooking = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedAsset || !startDate || !endDate || !purpose) {
      setError('Please fill in all required fields');
      return;
    }
    
    try {
      setIsSubmitting(true);
      
      const response = await fetch(`${API_URL}/asset-bookings`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          employee_id: EMPLOYEE_ID,
          asset_id: Number(selectedAsset),
          start_date: startDate,
          end_date: endDate,
          purpose
        }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create booking');
      }
      
      const newBooking = await response.json();
      
      // Add asset name to the new booking
      const asset = assets.find(a => a.id === Number(selectedAsset));
      const enhancedBooking = {
        ...newBooking,
        asset_name: asset ? asset.name : 'Unknown Asset'
      };
      
      setBookings([...bookings, enhancedBooking]);
      setSuccessMessage('Booking request submitted successfully!');
      
      // Reset form
      setSelectedAsset('');
      setStartDate('');
      setEndDate('');
      setPurpose('');
      setIsAvailable(null);
      
      // Switch to My Bookings tab
      setActiveTab('myBookings');
      
      // Clear success message after 5 seconds
      setTimeout(() => {
        setSuccessMessage('');
      }, 5000);
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('Error creating booking. Please try again.');
      }
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };
  
  // Cancel a booking
  const cancelBooking = async (id: number) => {
    if (!confirm('Are you sure you want to cancel this booking?')) {
      return;
    }
    
    try {
      const response = await fetch(`${API_URL}/asset-bookings/${id}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to cancel booking');
      }
      
      // Remove the booking from the state
      setBookings(bookings.filter(booking => booking.id !== id));
      setSuccessMessage('Booking cancelled successfully!');
      
      // Clear success message after 5 seconds
      setTimeout(() => {
        setSuccessMessage('');
      }, 5000);
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('Error cancelling booking. Please try again.');
      }
      console.error(err);
    }
  };
  
  // Format date for display
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };
  
  return (
    <div className="page asset-booking-page">
      <h1>Asset Booking</h1>
      
      <div className="page-description">
        <p>Book conference rooms, equipment, or company vehicles for your work needs.</p>
      </div>
      
      {error && <div className="error-message">{error}</div>}
      {successMessage && <div className="success-message">{successMessage}</div>}
      
      <div className="tabs">
        <button 
          className={`tab-button ${activeTab === 'book' ? 'active' : ''}`}
          onClick={() => setActiveTab('book')}
        >
          Book an Asset
        </button>
        <button 
          className={`tab-button ${activeTab === 'myBookings' ? 'active' : ''}`}
          onClick={() => setActiveTab('myBookings')}
        >
          My Bookings
        </button>
        <button 
          className={`tab-button ${activeTab === 'allBookings' ? 'active' : ''}`}
          onClick={() => setActiveTab('allBookings')}
        >
          All Bookings
        </button>
      </div>
      
      {activeTab === 'book' && (
        <div className="booking-form-container">
          <form className="booking-form" onSubmit={createBooking}>
            <div className="form-group">
              <label htmlFor="asset">Asset:</label>
              <select 
                id="asset" 
                value={selectedAsset} 
                onChange={(e) => setSelectedAsset(e.target.value ? Number(e.target.value) : '')}
                required
              >
                <option value="">Select an asset</option>
                {assets.map((asset) => (
                  <option key={asset.id} value={asset.id}>
                    {asset.name} ({asset.type}{asset.capacity ? `, Capacity: ${asset.capacity}` : ''})
                  </option>
                ))}
              </select>
            </div>
            
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="start-date">Start Date:</label>
                <input 
                  type="datetime-local" 
                  id="start-date" 
                  value={startDate} 
                  onChange={(e) => setStartDate(e.target.value)}
                  required
                />
              </div>
              
              <div className="form-group">
                <label htmlFor="end-date">End Date:</label>
                <input 
                  type="datetime-local" 
                  id="end-date" 
                  value={endDate} 
                  onChange={(e) => setEndDate(e.target.value)}
                  required
                />
              </div>
            </div>
            
            <div className="form-group">
              <label htmlFor="purpose">Purpose:</label>
              <textarea 
                id="purpose" 
                value={purpose} 
                onChange={(e) => setPurpose(e.target.value)}
                required
                placeholder="Briefly describe why you need this asset"
              ></textarea>
            </div>
            
            <div className="form-actions">
              <button 
                type="button" 
                className="button secondary"
                onClick={checkAvailability}
                disabled={!selectedAsset || !startDate || !endDate}
              >
                Check Availability
              </button>
              
              {isAvailable === true && (
                <div className="availability-tag available">Available</div>
              )}
              
              {isAvailable === false && (
                <div className="availability-tag unavailable">Not Available</div>
              )}
              
              <button 
                type="submit" 
                className="button primary"
                disabled={isSubmitting || !selectedAsset || !startDate || !endDate || !purpose || isAvailable === false}
              >
                {isSubmitting ? 'Submitting...' : 'Book Asset'}
              </button>
            </div>
          </form>
        </div>
      )}
      
      {activeTab === 'myBookings' && (
        <div className="my-bookings">
          {loading ? (
            <div className="loading">Loading your bookings...</div>
          ) : bookings.length === 0 ? (
            <div className="no-bookings">
              <p>You don't have any bookings yet.</p>
              <button 
                className="button secondary"
                onClick={() => setActiveTab('book')}
              >
                Create a Booking
              </button>
            </div>
          ) : (
            <div className="bookings-list">
              {bookings.map((booking) => (
                <div key={booking.id} className={`booking-card ${booking.status}`}>
                  <div className="booking-header">
                    <h3>{booking.asset_name}</h3>
                    <span className={`status-badge ${booking.status}`}>
                      {booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}
                    </span>
                  </div>
                  
                  <div className="booking-details">
                    <p><strong>From:</strong> {formatDate(booking.start_date)}</p>
                    <p><strong>To:</strong> {formatDate(booking.end_date)}</p>
                    <p><strong>Purpose:</strong> {booking.purpose}</p>
                  </div>
                  
                  {booking.status === 'pending' && (
                    <div className="booking-actions">
                      <button 
                        className="button danger"
                        onClick={() => cancelBooking(booking.id)}
                      >
                        Cancel
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
      
      {activeTab === 'allBookings' && (
        <div className="all-bookings">
          {loading ? (
            <div className="loading">Loading all bookings...</div>
          ) : allBookings.length === 0 ? (
            <div className="no-bookings">
              <p>There are no bookings in the system yet.</p>
              <button 
                className="button secondary"
                onClick={() => setActiveTab('book')}
              >
                Create a Booking
              </button>
            </div>
          ) : (
            <div className="bookings-list">
              <div className="bookings-grid">
                <div className="booking-header-row">
                  <div className="booking-header-cell">Asset</div>
                  <div className="booking-header-cell">From</div>
                  <div className="booking-header-cell">To</div>
                  <div className="booking-header-cell">Status</div>
                  <div className="booking-header-cell">Purpose</div>
                </div>
                {allBookings.map((booking) => (
                  <div key={booking.id} className="booking-row">
                    <div className="booking-cell">{booking.asset_name}</div>
                    <div className="booking-cell">{formatDate(booking.start_date)}</div>
                    <div className="booking-cell">{formatDate(booking.end_date)}</div>
                    <div className="booking-cell">
                      <span className={`status-badge ${booking.status}`}>
                        {booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}
                      </span>
                    </div>
                    <div className="booking-cell">{booking.purpose}</div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// Expense Report Page Component
function ExpenseReportPage() {
  return (
    <div className="page expense-report-page">
      <h1>Expense Report</h1>
      <div className="page-description">
        <p>Bought something for work? Snap the receipt, upload it, and get reimbursed in no time.</p>
      </div>
      <div className="page-content empty-state">
        <div className="empty-state-icon">💰</div>
        <p className="empty-state-message">This page is under construction</p>
      </div>
    </div>
  );
}

// Main App Component
function App() {
  return (
    <Router>
      <div className="app-container">
        <header className="app-header">
          <h1>Employee Portal</h1>
          <nav>
            <Link to="/">Home</Link>
            <Link to="/sick-leave">Sick Leave</Link>
            <Link to="/education-social">Education & Social</Link>
            <Link to="/corporate-travel">Corporate Travel</Link>
            <Link to="/maintenance">Maintenance</Link>
            <Link to="/asset-booking">Asset Booking</Link>
            <Link to="/expense-report">Expense Report</Link>
          </nav>
        </header>
        
        <main className="main-content">
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/add-item" element={<AddItemPage />} />
            <Route path="/sick-leave" element={<SickLeavePage />} />
            <Route path="/education-social" element={<EducationSocialPage />} />
            <Route path="/corporate-travel" element={<CorporateTravelPage />} />
            <Route path="/maintenance" element={<MaintenanceIssuesPage />} />
            <Route path="/asset-booking" element={<AssetBookingPage />} />
            <Route path="/expense-report" element={<ExpenseReportPage />} />
          </Routes>
        </main>
        
        <footer className="app-footer">
          <p>&copy; {new Date().getFullYear()} Employee Portal. All rights reserved.</p>
        </footer>
      </div>
    </Router>
  );
}

export default App
