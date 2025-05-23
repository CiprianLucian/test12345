const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// Connect to the database
const db = new sqlite3.Database('./database.sqlite', (err) => {
  if (err) {
    console.error('Error connecting to database:', err);
    process.exit(1);
  }
  console.log('Connected to SQLite database');
});

// Initialize database schema
console.log('Initializing database schema...');

// Create employees table
db.run(`
  CREATE TABLE IF NOT EXISTS employees (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    department TEXT NOT NULL,
    sick_days_remaining INTEGER NOT NULL DEFAULT 10
  )
`, (err) => {
  if (err) {
    console.error('Error creating employees table:', err);
    return;
  }
  console.log('Employees table created or already exists');
  
  // Create sick leave requests table
  db.run(`
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
  `, (err) => {
    if (err) {
      console.error('Error creating sick_leave_requests table:', err);
      db.close();
      return;
    }
    console.log('Sick leave requests table created or already exists');
    console.log('Database initialization completed');
    
    // Check if employees table is empty
    db.get('SELECT COUNT(*) as count FROM employees', (err, row) => {
      if (err) {
        console.error('Error checking employees count:', err);
        db.close();
        return;
      }
      
      if (row.count === 0) {
        console.log('No employees found. Please run seed-data.js to add sample employees.');
      } else {
        console.log(`Found ${row.count} employees in the database.`);
      }
      
      db.close((err) => {
        if (err) {
          console.error('Error closing database:', err);
        } else {
          console.log('Database connection closed');
        }
      });
    });
  });
}); 