const request = require('supertest');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');

// Import express app but prevent it from starting the server
let app;
let db;
const testDbPath = './test-employees-database.sqlite';

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

describe('Employee API', () => {
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
    
    // Seed test data
    await executeSql(
      'INSERT INTO employees (name, email, department, sick_days_remaining) VALUES (?, ?, ?, ?)',
      ['Test Employee', 'test@example.com', 'Testing', 10]
    );
    
    await executeSql(
      'INSERT INTO employees (name, email, department, sick_days_remaining) VALUES (?, ?, ?, ?)',
      ['Developer', 'dev@example.com', 'Engineering', 8]
    );
  });
  
  afterAll(async () => {
    // Close the database connection
    await new Promise((resolve, reject) => {
      db.close((err) => {
        if (err) return reject(err);
        resolve();
      });
    });
    
    // Use setTimeout to give the OS a moment to fully release the file handle
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // Clean up test database
    try {
      if (fs.existsSync(testDbPath)) {
        fs.unlinkSync(testDbPath);
      }
    } catch (err) {
      console.error('Warning: Could not delete test database:', err.message);
    }
  });
  
  // Tests for GET /api/employees endpoint
  describe('GET /api/employees', () => {
    it('should return all employees', async () => {
      const res = await request(app).get('/api/employees');
      
      expect(res.statusCode).toEqual(200);
      expect(Array.isArray(res.body)).toBeTruthy();
      expect(res.body.length).toBe(2);
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
      expect(res.body.error).toBe('Employee not found');
    });
  });
}); 