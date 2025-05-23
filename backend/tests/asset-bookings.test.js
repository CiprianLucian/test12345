const request = require('supertest');
const express = require('express');
const low = require('lowdb');
const FileSync = require('lowdb/adapters/FileSync');
const { MongoMemoryServer } = require('mongodb-memory-server');
const path = require('path');
const fs = require('fs');

// Import the app - we'll need to modify this to accept a test database
const app = express();

// Mock data
const mockAssets = [
  { id: 1, name: 'Test Room A', type: 'room', capacity: 10 },
  { id: 2, name: 'Test Equipment 1', type: 'equipment', location: 'Test Location' }
];

const mockBookings = [
  {
    id: 101,
    employee_id: 1,
    asset_id: 1,
    start_date: '2025-01-01T09:00:00.000Z',
    end_date: '2025-01-01T11:00:00.000Z',
    purpose: 'Test booking 1',
    status: 'pending',
    created_at: '2024-01-01T00:00:00.000Z'
  },
  {
    id: 102,
    employee_id: 2,
    asset_id: 2,
    start_date: '2025-01-02T13:00:00.000Z',
    end_date: '2025-01-02T15:00:00.000Z',
    purpose: 'Test booking 2',
    status: 'approved',
    created_at: '2024-01-01T00:00:00.000Z'
  }
];

// Setup test database
describe('Asset Booking API', () => {
  let db;
  let server;
  
  beforeAll(async () => {
    // Create a temporary test database file
    const tempDbPath = path.join(__dirname, 'test_db.json');
    
    // Initialize test database
    const adapter = new FileSync(tempDbPath);
    db = low(adapter);
    
    // Setup default data
    db.defaults({ 
      asset_bookings: mockBookings,
      assets: mockAssets
    }).write();
    
    // Configure app to use test database
    app.use(express.json());
    
    // Setup routes
    app.get('/api/assets', (req, res) => {
      const assets = db.get('assets').value();
      res.json(assets);
    });
    
    app.get('/api/asset-bookings', (req, res) => {
      const bookings = db.get('asset_bookings').value();
      res.json(bookings);
    });
    
    app.get('/api/asset-bookings/:id', (req, res) => {
      const { id } = req.params;
      const booking = db.get('asset_bookings').find({ id: Number(id) }).value();
      
      if (!booking) {
        return res.status(404).json({ error: 'Asset booking not found' });
      }
      
      res.json(booking);
    });
    
    app.post('/api/asset-bookings', (req, res) => {
      const { employee_id, asset_id, start_date, end_date, purpose } = req.body;
      
      if (!employee_id || !asset_id) {
        return res.status(400).json({ error: 'Employee ID and Asset ID are required' });
      }
      
      // Check for date conflicts
      const conflicts = db.get('asset_bookings')
        .filter(booking => 
          booking.asset_id === asset_id && 
          ((new Date(booking.start_date) <= new Date(end_date) && 
            new Date(booking.end_date) >= new Date(start_date))))
        .value();
      
      if (conflicts.length > 0) {
        return res.status(409).json({ 
          error: 'The asset is already booked for this time period',
          conflicts
        });
      }
      
      const newBooking = {
        id: Date.now(),
        employee_id: Number(employee_id),
        asset_id: Number(asset_id),
        start_date,
        end_date,
        purpose: purpose || '',
        status: 'pending',
        created_at: new Date().toISOString()
      };
      
      db.get('asset_bookings')
        .push(newBooking)
        .write();
      
      res.status(201).json(newBooking);
    });
    
    app.delete('/api/asset-bookings/:id', (req, res) => {
      const { id } = req.params;
      
      const booking = db.get('asset_bookings').find({ id: Number(id) }).value();
      
      if (!booking) {
        return res.status(404).json({ error: 'Asset booking not found' });
      }
      
      if (booking.status !== 'pending') {
        return res.status(400).json({ 
          error: `Cannot delete a booking with status: ${booking.status}` 
        });
      }
      
      db.get('asset_bookings')
        .remove({ id: Number(id) })
        .write();
      
      res.status(204).send();
    });
    
    // Start the server
    const port = 5001;
    server = app.listen(port);
  });
  
  afterAll(async () => {
    // Close server and cleanup
    if (server) {
      server.close();
    }
    
    // Remove the test database file
    fs.unlinkSync(path.join(__dirname, 'test_db.json'));
  });
  
  // Tests
  describe('GET /api/assets', () => {
    it('should return all assets', async () => {
      const response = await request(app).get('/api/assets');
      
      expect(response.status).toBe(200);
      expect(response.body).toHaveLength(2);
      expect(response.body[0].name).toBe('Test Room A');
    });
  });
  
  describe('GET /api/asset-bookings', () => {
    it('should return all bookings', async () => {
      const response = await request(app).get('/api/asset-bookings');
      
      expect(response.status).toBe(200);
      expect(response.body).toHaveLength(2);
      expect(response.body[0].purpose).toBe('Test booking 1');
    });
  });
  
  describe('GET /api/asset-bookings/:id', () => {
    it('should return a booking by id', async () => {
      const response = await request(app).get('/api/asset-bookings/101');
      
      expect(response.status).toBe(200);
      expect(response.body.id).toBe(101);
      expect(response.body.purpose).toBe('Test booking 1');
    });
    
    it('should return 404 for non-existent booking', async () => {
      const response = await request(app).get('/api/asset-bookings/999');
      
      expect(response.status).toBe(404);
      expect(response.body.error).toBe('Asset booking not found');
    });
  });
  
  describe('POST /api/asset-bookings', () => {
    it('should create a new booking', async () => {
      const newBooking = {
        employee_id: 3,
        asset_id: 1,
        start_date: '2025-02-01T09:00:00.000Z',
        end_date: '2025-02-01T11:00:00.000Z',
        purpose: 'Test new booking'
      };
      
      const response = await request(app)
        .post('/api/asset-bookings')
        .send(newBooking);
      
      expect(response.status).toBe(201);
      expect(response.body.employee_id).toBe(3);
      expect(response.body.purpose).toBe('Test new booking');
      expect(response.body.status).toBe('pending');
      
      // Verify it was added to the database
      const allBookings = await request(app).get('/api/asset-bookings');
      expect(allBookings.body).toHaveLength(3);
    });
    
    it('should return 400 if required fields are missing', async () => {
      const invalidBooking = {
        employee_id: 3,
        // Missing asset_id
        start_date: '2025-02-01T09:00:00.000Z',
        end_date: '2025-02-01T11:00:00.000Z'
      };
      
      const response = await request(app)
        .post('/api/asset-bookings')
        .send(invalidBooking);
      
      expect(response.status).toBe(400);
      expect(response.body.error).toContain('required');
    });
    
    it('should return 409 if there is a booking conflict', async () => {
      // This booking conflicts with the first mock booking
      const conflictingBooking = {
        employee_id: 3,
        asset_id: 1,
        start_date: '2025-01-01T10:00:00.000Z', // Overlaps with first booking
        end_date: '2025-01-01T12:00:00.000Z',
        purpose: 'Conflicting booking'
      };
      
      const response = await request(app)
        .post('/api/asset-bookings')
        .send(conflictingBooking);
      
      expect(response.status).toBe(409);
      expect(response.body.error).toContain('already booked');
      expect(response.body.conflicts).toBeDefined();
    });
  });
  
  describe('DELETE /api/asset-bookings/:id', () => {
    it('should delete a pending booking', async () => {
      const response = await request(app).delete('/api/asset-bookings/101');
      
      expect(response.status).toBe(204);
      
      // Verify it was removed from the database
      const checkResponse = await request(app).get('/api/asset-bookings/101');
      expect(checkResponse.status).toBe(404);
    });
    
    it('should return 400 when trying to delete a non-pending booking', async () => {
      const response = await request(app).delete('/api/asset-bookings/102');
      
      expect(response.status).toBe(400);
      expect(response.body.error).toContain('Cannot delete');
    });
    
    it('should return 404 for non-existent booking', async () => {
      const response = await request(app).delete('/api/asset-bookings/999');
      
      expect(response.status).toBe(404);
    });
  });
}); 