const request = require('supertest');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');

// Import express app but prevent it from starting the server
let app;
let db;
const testDbPath = './test-education-activities-database.sqlite';

// Helper function to execute SQL queries
const executeSql = (sql, params = []) => {
  return new Promise((resolve, reject) => {
    db.run(sql, params, function(err) {
      if (err) return reject(err);
      resolve(this);
    });
  });
};

describe('Education Activities API', () => {
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
    app = appModule.app;
    
    // Connect to the test database directly for setup
    db = new sqlite3.Database(testDbPath);
    
    // Create tables needed for tests
    await executeSql(`
      CREATE TABLE IF NOT EXISTS education_activities (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT NOT NULL,
        type TEXT NOT NULL,
        date TEXT,
        description TEXT,
        max_participants INTEGER
      )
    `);
    
    // Seed test data
    await executeSql(
      'INSERT INTO education_activities (title, type, date, description, max_participants) VALUES (?, ?, ?, ?, ?)',
      ['JavaScript Workshop', 'Workshop', '2025-01-15', 'Learn modern JavaScript features', 20]
    );
    
    await executeSql(
      'INSERT INTO education_activities (title, type, date, description, max_participants) VALUES (?, ?, ?, ?, ?)',
      ['Team Building', 'Social', '2025-02-10', 'Team building activities', 30]
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
  
  // Tests for GET /api/education-activities endpoint
  describe('GET /api/education-activities', () => {
    it('should return all education activities', async () => {
      const res = await request(app).get('/api/education-activities');
      
      expect(res.statusCode).toEqual(200);
      expect(Array.isArray(res.body)).toBeTruthy();
      expect(res.body.length).toBe(2);
      expect(res.body[0]).toHaveProperty('title');
      expect(res.body[0]).toHaveProperty('type');
      expect(res.body[0]).toHaveProperty('date');
      expect(res.body[0]).toHaveProperty('description');
      expect(res.body[0]).toHaveProperty('max_participants');
      expect(res.body[0].title).toBe('JavaScript Workshop');
    });
  });
}); 