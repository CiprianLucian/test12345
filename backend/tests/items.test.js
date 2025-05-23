const request = require('supertest');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');

// Import express app but prevent it from starting the server
let app;
let db;
const testDbPath = './test-items-database.sqlite';

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

describe('Items API', () => {
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
      CREATE TABLE IF NOT EXISTS items (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        description TEXT
      )
    `);
    
    // Seed test data
    await executeSql(
      'INSERT INTO items (name, description) VALUES (?, ?)',
      ['Test Item 1', 'This is a test item']
    );
    
    await executeSql(
      'INSERT INTO items (name, description) VALUES (?, ?)',
      ['Test Item 2', 'Another test item']
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
  
  // Tests for GET /api/items endpoint
  describe('GET /api/items', () => {
    it('should return all items', async () => {
      const res = await request(app).get('/api/items');
      
      expect(res.statusCode).toEqual(200);
      expect(Array.isArray(res.body)).toBeTruthy();
      expect(res.body.length).toBe(2);
      expect(res.body[0]).toHaveProperty('name');
      expect(res.body[0]).toHaveProperty('description');
      expect(res.body[0].name).toBe('Test Item 1');
    });
  });
  
  // Tests for POST /api/items endpoint
  describe('POST /api/items', () => {
    it('should create a new item', async () => {
      const newItem = {
        name: 'New Test Item',
        description: 'Description for new test item'
      };
      
      const res = await request(app)
        .post('/api/items')
        .send(newItem);
      
      expect(res.statusCode).toEqual(201);
      expect(res.body).toHaveProperty('id');
      expect(res.body.name).toBe(newItem.name);
      expect(res.body.description).toBe(newItem.description);
      
      // Verify item was actually created in the database
      const items = await getRows('SELECT * FROM items WHERE name = ?', [newItem.name]);
      expect(items.length).toBe(1);
      expect(items[0].description).toBe(newItem.description);
    });
    
    it('should return 400 when name is missing', async () => {
      const invalidItem = {
        description: 'This item has no name'
      };
      
      const res = await request(app)
        .post('/api/items')
        .send(invalidItem);
      
      expect(res.statusCode).toEqual(400);
      expect(res.body).toHaveProperty('error');
      expect(res.body.error).toBe('Name is required');
    });
  });
}); 