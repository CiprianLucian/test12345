const request = require('supertest');
const sqlite3 = require('sqlite3').verbose();
const { exec } = require('child_process');
const path = require('path');
const fs = require('fs');

// Import express app but prevent it from starting the server
let app;
let db;
const testDbPath = './test-database.sqlite';

// Helper function to execute SQL queries
const executeSql = (sql, params = []) => {
  return new Promise((resolve, reject) => {
    db.run(sql, params, function(err) {
      if (err) return reject(err);
      resolve(this);
    });
  });
};

// Helper to get rows from DB
const getRows = (sql, params = []) => {
  return new Promise((resolve, reject) => {
    db.all(sql, params, (err, rows) => {
      if (err) return reject(err);
      resolve(rows);
    });
  });
};

describe('Sick Leave API', () => {
  beforeAll(async () => {
    // Create a test database
    if (fs.existsSync(testDbPath)) {
      fs.unlinkSync(testDbPath);
    }
    
    // Mock the database initialization
    process.env.NODE_ENV = 'test';
    process.env.DB_PATH = testDbPath;
    
    // Now import the app with the test database configured
    const appModule = require('../index');
    app = appModule.app;  // Assuming you export the app from index.js
    
    // Connect to the test database directly for setup
    db = new sqlite3.Database(testDbPath);
    
    // Create tables needed for tests
    await executeSql(`
      CREATE TABLE IF NOT EXISTS employees (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        email TEXT UNIQUE NOT NULL,
        department TEXT NOT NULL,
        sick_days_remaining INTEGER NOT NULL DEFAULT 10
      )
    `);
    
    await executeSql(`
      CREATE TABLE IF NOT EXISTS sick_leave_requests (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        employee_id INTEGER NOT NULL,
        start_date TEXT NOT NULL,
        end_date TEXT NOT NULL,
        reason TEXT NOT NULL,
        status TEXT NOT NULL DEFAULT 'pending',
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL,
        FOREIGN KEY (employee_id) REFERENCES employees (id)
      )
    `);
    
    // Seed test data
    // Add test employees
    await executeSql(
      'INSERT INTO employees (name, email, department, sick_days_remaining) VALUES (?, ?, ?, ?)',
      ['Test Employee', 'test@example.com', 'Testing', 10]
    );
    
    await executeSql(
      'INSERT INTO employees (name, email, department, sick_days_remaining) VALUES (?, ?, ?, ?)',
      ['Low Balance Employee', 'low@example.com', 'Testing', 2]
    );
  });
  
  afterAll(async () => {
    // Close the database connection and ensure it's fully closed before removal
    await new Promise((resolve, reject) => {
      db.close((err) => {
        if (err) return reject(err);
        resolve();
      });
    });
    
    // Use setTimeout to give the OS a moment to fully release the file handle
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // Clean up test database with error handling
    try {
      if (fs.existsSync(testDbPath)) {
        fs.unlinkSync(testDbPath);
      }
    } catch (err) {
      console.error('Warning: Could not delete test database:', err.message);
      // Don't fail the test if we can't delete the file
    }
  });
  
  // Tests for GET /api/employees endpoint
  describe('GET /api/employees', () => {
    it('should return all employees', async () => {
      const res = await request(app).get('/api/employees');
      
      expect(res.statusCode).toEqual(200);
      expect(Array.isArray(res.body)).toBeTruthy();
      expect(res.body.length).toBeGreaterThan(0);
      expect(res.body[0]).toHaveProperty('name');
      expect(res.body[0]).toHaveProperty('email');
      expect(res.body[0]).toHaveProperty('department');
      expect(res.body[0]).toHaveProperty('sick_days_remaining');
    });
  });
  
  // Tests for GET /api/employees/:id/sick-days endpoint
  describe('GET /api/employees/:id/sick-days', () => {
    it('should return sick days remaining for an employee', async () => {
      // Get an employee ID from the database
      const employees = await getRows('SELECT id FROM employees LIMIT 1');
      const employeeId = employees[0].id;
      
      const res = await request(app).get(`/api/employees/${employeeId}/sick-days`);
      
      expect(res.statusCode).toEqual(200);
      expect(res.body).toHaveProperty('sick_days_remaining');
      expect(typeof res.body.sick_days_remaining).toBe('number');
    });
    
    it('should return 404 for non-existent employee', async () => {
      const nonExistentId = 9999;
      const res = await request(app).get(`/api/employees/${nonExistentId}/sick-days`);
      
      expect(res.statusCode).toEqual(404);
      expect(res.body).toHaveProperty('error');
    });
  });
  
  // Tests for POST /api/sick-leave endpoint
  describe('POST /api/sick-leave', () => {
    it('should create a new sick leave request', async () => {
      // Get an employee ID from the database
      const employees = await getRows('SELECT id FROM employees WHERE name = ?', ['Test Employee']);
      const employeeId = employees[0].id;
      
      const requestData = {
        employee_id: employeeId,
        start_date: '2025-06-01',
        end_date: '2025-06-03',
        reason: 'Feeling unwell'
      };
      
      const res = await request(app)
        .post('/api/sick-leave')
        .send(requestData);
      
      expect(res.statusCode).toEqual(201);
      expect(res.body).toHaveProperty('id');
      expect(res.body).toHaveProperty('status', 'pending');
      expect(res.body.employee_id).toEqual(employeeId);
      expect(res.body.start_date).toEqual(requestData.start_date);
      expect(res.body.end_date).toEqual(requestData.end_date);
      expect(res.body.reason).toEqual(requestData.reason);
    });
    
    it('should reject request when not enough sick days remain', async () => {
      // Get the low balance employee
      const employees = await getRows('SELECT id FROM employees WHERE name = ?', ['Low Balance Employee']);
      const employeeId = employees[0].id;
      
      // Request for more days than available
      const requestData = {
        employee_id: employeeId,
        start_date: '2025-06-01',
        end_date: '2025-06-10', // 8 working days, but employee only has 2 remaining
        reason: 'Extended illness'
      };
      
      const res = await request(app)
        .post('/api/sick-leave')
        .send(requestData);
      
      expect(res.statusCode).toEqual(400);
      expect(res.body).toHaveProperty('error');
      expect(res.body.error).toContain('Not enough sick days remaining');
      expect(res.body).toHaveProperty('available');
      expect(res.body).toHaveProperty('requested');
    });
    
    it('should reject request with missing fields', async () => {
      // Missing reason
      const requestData = {
        employee_id: 1,
        start_date: '2025-06-01',
        end_date: '2025-06-03'
      };
      
      const res = await request(app)
        .post('/api/sick-leave')
        .send(requestData);
      
      expect(res.statusCode).toEqual(400);
      expect(res.body).toHaveProperty('error');
    });
  });
  
  // Tests for PUT /api/sick-leave/:id/approve endpoint
  describe('PUT /api/sick-leave/:id/approve', () => {
    it('should approve a pending sick leave request and deduct days', async () => {
      // Create a test request first
      const employees = await getRows('SELECT id FROM employees WHERE name = ?', ['Test Employee']);
      const employeeId = employees[0].id;
      
      // Get initial sick days balance
      const initialEmployee = await getRows('SELECT sick_days_remaining FROM employees WHERE id = ?', [employeeId]);
      const initialBalance = initialEmployee[0].sick_days_remaining;
      
      // Create a request
      await executeSql(
        'INSERT INTO sick_leave_requests (employee_id, start_date, end_date, reason, status, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?)',
        [employeeId, '2025-07-01', '2025-07-03', 'Test reason', 'pending', new Date().toISOString(), new Date().toISOString()]
      );
      
      // Get the created request
      const requests = await getRows('SELECT id FROM sick_leave_requests WHERE employee_id = ? ORDER BY id DESC LIMIT 1', [employeeId]);
      const requestId = requests[0].id;
      
      // Approve the request
      const res = await request(app)
        .put(`/api/sick-leave/${requestId}/approve`)
        .send({});
      
      expect(res.statusCode).toEqual(200);
      expect(res.body).toHaveProperty('message', 'Sick leave request approved');
      
      // Check that days were deducted
      const updatedEmployee = await getRows('SELECT sick_days_remaining FROM employees WHERE id = ?', [employeeId]);
      const newBalance = updatedEmployee[0].sick_days_remaining;
      
      // Should have deducted 3 working days
      expect(newBalance).toBeLessThan(initialBalance);
      
      // Verify the request status was updated
      const updatedRequest = await getRows('SELECT status FROM sick_leave_requests WHERE id = ?', [requestId]);
      expect(updatedRequest[0].status).toEqual('approved');
    });
    
    it('should reject approval for non-pending request', async () => {
      // Create a request that's already approved
      const employees = await getRows('SELECT id FROM employees LIMIT 1');
      const employeeId = employees[0].id;
      
      await executeSql(
        'INSERT INTO sick_leave_requests (employee_id, start_date, end_date, reason, status, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?)',
        [employeeId, '2025-08-01', '2025-08-02', 'Already processed', 'approved', new Date().toISOString(), new Date().toISOString()]
      );
      
      // Get the created request
      const requests = await getRows('SELECT id FROM sick_leave_requests WHERE status = "approved" ORDER BY id DESC LIMIT 1');
      const requestId = requests[0].id;
      
      // Try to approve it again
      const res = await request(app)
        .put(`/api/sick-leave/${requestId}/approve`)
        .send({});
      
      expect(res.statusCode).toEqual(400);
      expect(res.body).toHaveProperty('error');
      expect(res.body.error).toContain('already been processed');
    });
  });
  
  // Tests for PUT /api/sick-leave/:id/reject endpoint
  describe('PUT /api/sick-leave/:id/reject', () => {
    it('should reject a pending sick leave request', async () => {
      // Create a test request
      const employees = await getRows('SELECT id FROM employees LIMIT 1');
      const employeeId = employees[0].id;
      
      await executeSql(
        'INSERT INTO sick_leave_requests (employee_id, start_date, end_date, reason, status, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?)',
        [employeeId, '2025-09-01', '2025-09-03', 'To be rejected', 'pending', new Date().toISOString(), new Date().toISOString()]
      );
      
      // Get the created request
      const requests = await getRows('SELECT id FROM sick_leave_requests WHERE reason = ? ORDER BY id DESC LIMIT 1', ['To be rejected']);
      const requestId = requests[0].id;
      
      // Reject the request
      const res = await request(app)
        .put(`/api/sick-leave/${requestId}/reject`)
        .send({ reason: 'Business needs' });
      
      expect(res.statusCode).toEqual(200);
      expect(res.body).toHaveProperty('message', 'Sick leave request rejected');
      expect(res.body).toHaveProperty('rejection_reason', 'Business needs');
      
      // Verify the request status was updated
      const updatedRequest = await getRows('SELECT status FROM sick_leave_requests WHERE id = ?', [requestId]);
      expect(updatedRequest[0].status).toEqual('rejected');
    });
  });
  
  // Tests for GET /api/sick-leave with filters
  describe('GET /api/sick-leave', () => {
    it('should return all sick leave requests', async () => {
      const res = await request(app).get('/api/sick-leave');
      
      expect(res.statusCode).toEqual(200);
      expect(Array.isArray(res.body)).toBeTruthy();
      // We've created several in our tests
      expect(res.body.length).toBeGreaterThan(0);
    });
    
    it('should filter sick leave requests by status', async () => {
      const res = await request(app).get('/api/sick-leave?status=pending');
      
      expect(res.statusCode).toEqual(200);
      expect(Array.isArray(res.body)).toBeTruthy();
      
      // All returned requests should have pending status
      res.body.forEach(request => {
        expect(request.status).toEqual('pending');
      });
    });
    
    it('should filter sick leave requests by employee ID', async () => {
      // Get an employee ID from the database
      const employees = await getRows('SELECT id FROM employees LIMIT 1');
      const employeeId = employees[0].id;
      
      const res = await request(app).get(`/api/sick-leave?employee_id=${employeeId}`);
      
      expect(res.statusCode).toEqual(200);
      expect(Array.isArray(res.body)).toBeTruthy();
      
      // All returned requests should be for this employee
      res.body.forEach(request => {
        expect(request.employee_id).toEqual(employeeId);
      });
    });
  });
}); 