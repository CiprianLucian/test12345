const express = require('express');
const cors = require('cors');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');
const low = require('lowdb');
const FileSync = require('lowdb/adapters/FileSync');

// Initialize Express app
const app = express();
const PORT = process.env.PORT || 5000;

// Production configuration
const isProduction = process.env.NODE_ENV === 'production';
const FRONTEND_URL = isProduction 
  ? 'https://aim-possible-frontend.azurewebsites.net'
  : 'http://localhost:5173';

// CORS configuration
const corsOptions = {
  origin: FRONTEND_URL,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
  maxAge: 600 // 10 minutes
};

// Middleware
app.use(cors(corsOptions));
app.use(express.json());

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'healthy',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// Serve static files in production
if (isProduction) {
  app.use(express.static(path.join(__dirname, 'public')));
}

// Ensure the db directory exists
const dbDir = path.resolve(__dirname, './db');
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

// Use a different database path for testing
const dbPath = process.env.DB_PATH || './database.sqlite';

// Initialize SQLite database
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Error opening database', err);
    return;
  }
  console.log('Connected to SQLite database');
  
  // Skip initialization in test environment (tests handle their own database setup)
  if (process.env.NODE_ENV !== 'test') {
    initializeDatabase();
  }
});

// Initialize JSON database for asset bookings
const adapter = new FileSync('db.json');
const jsonDb = low(adapter);

// Set defaults (required if JSON file is empty)
jsonDb.defaults({ 
  items: [],
  sick_leaves: [],
  education_activities: [],
  corporate_travel: [],
  maintenance_issues: [],
  asset_bookings: [],
  expense_reports: []
}).write();

// Function to initialize database schema
function initializeDatabase() {
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
        return;
      }
      console.log('Sick leave requests table created or already exists');
      
      // Check if employees table is empty and seed data if needed
      db.get('SELECT COUNT(*) as count FROM employees', (err, row) => {
        if (err) {
          console.error('Error checking employees count:', err);
          return;
        }
        
        if (row.count === 0) {
          console.log('Seeding employee data...');
          
          // Seed with sample data
          const employees = [
            ['John Doe', 'john.doe@company.com', 'Engineering', 10],
            ['Jane Smith', 'jane.smith@company.com', 'Marketing', 8],
            ['Michael Johnson', 'michael.johnson@company.com', 'HR', 12],
            ['Emily Davis', 'emily.davis@company.com', 'Finance', 15],
            ['Robert Wilson', 'robert.wilson@company.com', 'Engineering', 7]
          ];
          
          const insertEmployee = db.prepare('INSERT INTO employees (name, email, department, sick_days_remaining) VALUES (?, ?, ?, ?)');
          
          employees.forEach(employee => {
            insertEmployee.run(employee, (err) => {
              if (err) console.error('Error inserting employee:', err);
            });
          });
          
          insertEmployee.finalize();
          console.log('Employee data seeded successfully');
        }
      });
    });
  });
  
  // Create other tables
  db.run(`
    CREATE TABLE IF NOT EXISTS items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      description TEXT
    )
  `);
  
  db.run(`
    CREATE TABLE IF NOT EXISTS education_activities (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      type TEXT NOT NULL,
      date TEXT,
      description TEXT,
      max_participants INTEGER
    )
  `);
  
  db.run(`
    CREATE TABLE IF NOT EXISTS corporate_travel (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      employee_id INTEGER NOT NULL,
      destination TEXT NOT NULL,
      purpose TEXT,
      departure_date TEXT,
      return_date TEXT,
      status TEXT DEFAULT 'pending'
    )
  `);
  
  db.run(`
    CREATE TABLE IF NOT EXISTS maintenance_issues (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      reported_by INTEGER NOT NULL,
      issue_type TEXT NOT NULL,
      location TEXT,
      description TEXT,
      priority TEXT DEFAULT 'medium',
      status TEXT DEFAULT 'reported'
    )
  `);
  
  db.run(`
    CREATE TABLE IF NOT EXISTS asset_bookings (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      employee_id INTEGER NOT NULL,
      asset_id INTEGER NOT NULL,
      start_date TEXT,
      end_date TEXT,
      purpose TEXT,
      status TEXT DEFAULT 'pending'
    )
  `);
  
  db.run(`
    CREATE TABLE IF NOT EXISTS expense_reports (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      employee_id INTEGER NOT NULL,
      date TEXT NOT NULL,
      amount REAL NOT NULL,
      category TEXT,
      description TEXT,
      receipt_url TEXT,
      status TEXT DEFAULT 'submitted'
    )
  `);
}

// API Routes
app.get('/api/items', (req, res) => {
  db.all('SELECT * FROM items', (err, rows) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ error: 'Server error' });
    }
    res.json(rows);
  });
});

app.post('/api/items', (req, res) => {
  const { name, description } = req.body;
  
  if (!name) {
    return res.status(400).json({ error: 'Name is required' });
  }
  
  db.run('INSERT INTO items (name, description) VALUES (?, ?)', [name, description || ''], function(err) {
    if (err) {
      console.error(err);
      return res.status(500).json({ error: 'Server error' });
    }
    
    res.status(201).json({ 
      id: this.lastID,
      name,
      description
    });
  });
});

// Sick Leave Management API Routes

// Get all employees
app.get('/api/employees', (req, res) => {
  db.all('SELECT * FROM employees', (err, rows) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ error: 'Server error' });
    }
    res.json(rows);
  });
});

// Get remaining sick days for an employee
app.get('/api/employees/:id/sick-days', (req, res) => {
  const { id } = req.params;
  db.get('SELECT sick_days_remaining FROM employees WHERE id = ?', [id], (err, row) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ error: 'Server error' });
    }
    
    if (!row) {
      return res.status(404).json({ error: 'Employee not found' });
    }
    
    res.json({ sick_days_remaining: row.sick_days_remaining });
  });
});

// Get all sick leave requests with optional filters
app.get('/api/sick-leave', (req, res) => {
  const { status, employee_id } = req.query;
  let query = 'SELECT slr.*, e.name as employee_name FROM sick_leave_requests slr JOIN employees e ON slr.employee_id = e.id';
  const params = [];
  
  if (status || employee_id) {
    query += ' WHERE';
    
    if (status) {
      query += ' slr.status = ?';
      params.push(status);
    }
    
    if (employee_id) {
      query += status ? ' AND slr.employee_id = ?' : ' slr.employee_id = ?';
      params.push(employee_id);
    }
  }
  
  query += ' ORDER BY slr.created_at DESC';
  
  db.all(query, params, (err, rows) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ error: 'Server error' });
    }
    res.json(rows);
  });
});

// Get a specific sick leave request
app.get('/api/sick-leave/:id', (req, res) => {
  const { id } = req.params;
  db.get(`
    SELECT slr.*, e.name as employee_name 
    FROM sick_leave_requests slr 
    JOIN employees e ON slr.employee_id = e.id 
    WHERE slr.id = ?
  `, [id], (err, row) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ error: 'Server error' });
    }
    
    if (!row) {
      return res.status(404).json({ error: 'Sick leave request not found' });
    }
    
    res.json(row);
  });
});

// Submit a new sick leave request
app.post('/api/sick-leave', (req, res) => {
  const { employee_id, start_date, end_date, reason } = req.body;
  
  // Validate required fields
  if (!employee_id || !start_date || !end_date || !reason) {
    return res.status(400).json({ error: 'All fields are required' });
  }
  
  // Check if employee exists
  db.get('SELECT * FROM employees WHERE id = ?', [employee_id], (err, employee) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ error: 'Server error' });
    }
    
    if (!employee) {
      return res.status(404).json({ error: 'Employee not found' });
    }
    
    // Calculate number of days
    const startDate = new Date(start_date);
    const endDate = new Date(end_date);
    
    if (startDate > endDate) {
      return res.status(400).json({ error: 'End date must be after start date' });
    }
    
    // Calculate working days (excluding weekends)
    let daysCount = 0;
    let currentDate = new Date(startDate);
    
    while (currentDate <= endDate) {
      const dayOfWeek = currentDate.getDay();
      if (dayOfWeek !== 0 && dayOfWeek !== 6) { // Not Sunday (0) or Saturday (6)
        daysCount++;
      }
      currentDate.setDate(currentDate.getDate() + 1);
    }
    
    // Check if employee has enough sick days
    if (daysCount > employee.sick_days_remaining) {
      return res.status(400).json({ 
        error: 'Not enough sick days remaining',
        available: employee.sick_days_remaining,
        requested: daysCount
      });
    }
    
    // Create timestamp for created_at and updated_at
    const now = new Date().toISOString();
    
    // Insert the sick leave request
    db.run(`
      INSERT INTO sick_leave_requests (
        employee_id, start_date, end_date, reason, status, created_at, updated_at
      ) VALUES (?, ?, ?, ?, 'pending', ?, ?)
    `, [employee_id, start_date, end_date, reason, now, now], function(err) {
      if (err) {
        console.error(err);
        return res.status(500).json({ error: 'Server error' });
      }
      
      res.status(201).json({
        id: this.lastID,
        employee_id,
        start_date,
        end_date,
        reason,
        status: 'pending',
        created_at: now,
        updated_at: now
      });
    });
  });
});

// Update sick leave request status to approved
app.put('/api/sick-leave/:id/approve', (req, res) => {
  const { id } = req.params;
  
  // Get the sick leave request
  db.get('SELECT * FROM sick_leave_requests WHERE id = ?', [id], (err, request) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ error: 'Server error' });
    }
    
    if (!request) {
      return res.status(404).json({ error: 'Sick leave request not found' });
    }
    
    if (request.status !== 'pending') {
      return res.status(400).json({ error: 'This request has already been processed' });
    }
    
    // Calculate working days (excluding weekends)
    const startDate = new Date(request.start_date);
    const endDate = new Date(request.end_date);
    let daysCount = 0;
    let currentDate = new Date(startDate);
    
    while (currentDate <= endDate) {
      const dayOfWeek = currentDate.getDay();
      if (dayOfWeek !== 0 && dayOfWeek !== 6) { // Not Sunday (0) or Saturday (6)
        daysCount++;
      }
      currentDate.setDate(currentDate.getDate() + 1);
    }
    
    const now = new Date().toISOString();
    
    // Use a transaction for both updates
    db.serialize(() => {
      db.run('BEGIN TRANSACTION');
      
      // Update the request status
      db.run('UPDATE sick_leave_requests SET status = ?, updated_at = ? WHERE id = ?', 
        ['approved', now, id], (err) => {
        if (err) {
          console.error(err);
          db.run('ROLLBACK');
          return res.status(500).json({ error: 'Server error' });
        }
        
        // Update employee's remaining sick days
        db.run('UPDATE employees SET sick_days_remaining = sick_days_remaining - ? WHERE id = ?', 
          [daysCount, request.employee_id], (err) => {
          if (err) {
            console.error(err);
            db.run('ROLLBACK');
            return res.status(500).json({ error: 'Server error' });
          }
          
          db.run('COMMIT', (err) => {
            if (err) {
              console.error(err);
              db.run('ROLLBACK');
              return res.status(500).json({ error: 'Server error' });
            }
            
            // Get updated employee data
            db.get('SELECT * FROM employees WHERE id = ?', [request.employee_id], (err, employee) => {
              if (err) {
                console.error(err);
                return res.status(500).json({ error: 'Server error' });
              }
              
              res.json({ 
                message: 'Sick leave request approved',
                request: { ...request, status: 'approved' },
                employee
              });
            });
          });
        });
      });
    });
  });
});

// Update sick leave request status to rejected
app.put('/api/sick-leave/:id/reject', (req, res) => {
  const { id } = req.params;
  const { reason } = req.body;
  
  // Get the sick leave request
  db.get('SELECT * FROM sick_leave_requests WHERE id = ?', [id], (err, request) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ error: 'Server error' });
    }
    
    if (!request) {
      return res.status(404).json({ error: 'Sick leave request not found' });
    }
    
    if (request.status !== 'pending') {
      return res.status(400).json({ error: 'This request has already been processed' });
    }
    
    const now = new Date().toISOString();
    
    // Update the request status
    db.run('UPDATE sick_leave_requests SET status = ?, updated_at = ? WHERE id = ?', 
      ['rejected', now, id], (err) => {
      if (err) {
        console.error(err);
        return res.status(500).json({ error: 'Server error' });
      }
      
      res.json({ 
        message: 'Sick leave request rejected',
        request: { ...request, status: 'rejected' },
        rejection_reason: reason
      });
    });
  });
});

// Education and Social Activities API Routes
app.get('/api/education-activities', (req, res) => {
  db.all('SELECT * FROM education_activities', (err, rows) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ error: 'Server error' });
    }
    res.json(rows);
  });
});

// Corporate Travel API Routes
app.get('/api/corporate-travels', (req, res) => {
  db.all('SELECT * FROM corporate_travel', (err, rows) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ error: 'Server error' });
    }
    res.json(rows);
  });
});

// Maintenance Issues API Routes
app.get('/api/maintenance-issues', (req, res) => {
  db.all('SELECT * FROM maintenance_issues', (err, rows) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ error: 'Server error' });
    }
    res.json(rows);
  });
});

// Asset Booking API Routes - Using JSON Database
app.get('/api/asset-bookings', (req, res) => {
  try {
    const bookings = jsonDb.get('asset_bookings').value();
    res.json(bookings);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
});

app.get('/api/asset-bookings/:id', (req, res) => {
  try {
    const { id } = req.params;
    const booking = jsonDb.get('asset_bookings').find({ id: Number(id) }).value();
    
    if (!booking) {
      return res.status(404).json({ error: 'Asset booking not found' });
    }
    
    res.json(booking);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
});

app.post('/api/asset-bookings', (req, res) => {
  try {
    const { employee_id, asset_id, start_date, end_date, purpose } = req.body;
    
    // Validate required fields
    if (!employee_id || !asset_id) {
      return res.status(400).json({ error: 'Employee ID and Asset ID are required' });
    }
    
    // Check for date conflicts
    const conflicts = jsonDb.get('asset_bookings')
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
    
    jsonDb.get('asset_bookings')
      .push(newBooking)
      .write();
    
    res.status(201).json(newBooking);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
});

app.put('/api/asset-bookings/:id', (req, res) => {
  try {
    const { id } = req.params;
    const { employee_id, asset_id, start_date, end_date, purpose, status } = req.body;
    
    const booking = jsonDb.get('asset_bookings').find({ id: Number(id) }).value();
    
    if (!booking) {
      return res.status(404).json({ error: 'Asset booking not found' });
    }
    
    // Only allow changes if status is not 'approved' or 'rejected'
    if (booking.status === 'approved' || booking.status === 'rejected') {
      return res.status(400).json({ 
        error: `Cannot modify a booking with status: ${booking.status}` 
      });
    }
    
    // Check for date conflicts (excluding this booking)
    if (asset_id && start_date && end_date) {
      const conflicts = jsonDb.get('asset_bookings')
        .filter(b => 
          b.id !== Number(id) && 
          b.asset_id === Number(asset_id) && 
          ((new Date(b.start_date) <= new Date(end_date) && 
            new Date(b.end_date) >= new Date(start_date))))
        .value();
      
      if (conflicts.length > 0) {
        return res.status(409).json({ 
          error: 'The asset is already booked for this time period',
          conflicts
        });
      }
    }
    
    const updatedBooking = {
      ...booking,
      employee_id: employee_id !== undefined ? Number(employee_id) : booking.employee_id,
      asset_id: asset_id !== undefined ? Number(asset_id) : booking.asset_id,
      start_date: start_date || booking.start_date,
      end_date: end_date || booking.end_date,
      purpose: purpose !== undefined ? purpose : booking.purpose,
      status: status || booking.status,
      updated_at: new Date().toISOString()
    };
    
    jsonDb.get('asset_bookings')
      .find({ id: Number(id) })
      .assign(updatedBooking)
      .write();
    
    res.json(updatedBooking);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
});

app.delete('/api/asset-bookings/:id', (req, res) => {
  try {
    const { id } = req.params;
    
    const booking = jsonDb.get('asset_bookings').find({ id: Number(id) }).value();
    
    if (!booking) {
      return res.status(404).json({ error: 'Asset booking not found' });
    }
    
    // Only allow deletion if status is 'pending'
    if (booking.status !== 'pending') {
      return res.status(400).json({ 
        error: `Cannot delete a booking with status: ${booking.status}` 
      });
    }
    
    jsonDb.get('asset_bookings')
      .remove({ id: Number(id) })
      .write();
    
    res.status(204).send();
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Add API for available assets
app.get('/api/assets', (req, res) => {
  try {
    // For now, return a static list of assets
    // In a real application, this would come from a database
    const assets = [
      { id: 1, name: 'Conference Room A', type: 'room', capacity: 20 },
      { id: 2, name: 'Conference Room B', type: 'room', capacity: 10 },
      { id: 3, name: 'Projector 1', type: 'equipment', location: 'Floor 1' },
      { id: 4, name: 'Laptop 1', type: 'equipment', location: 'IT Department' },
      { id: 5, name: 'Company Car 1', type: 'vehicle', location: 'Parking Lot A' }
    ];
    
    res.json(assets);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Check asset availability
app.get('/api/assets/:id/availability', (req, res) => {
  try {
    const { id } = req.params;
    const { start_date, end_date } = req.query;
    
    if (!start_date || !end_date) {
      return res.status(400).json({ error: 'Start date and end date are required' });
    }
    
    const bookings = jsonDb.get('asset_bookings')
      .filter(booking => 
        booking.asset_id === Number(id) && 
        booking.status !== 'rejected' &&
        ((new Date(booking.start_date) <= new Date(end_date) && 
          new Date(booking.end_date) >= new Date(start_date))))
      .value();
    
    res.json({
      asset_id: Number(id),
      is_available: bookings.length === 0,
      bookings
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Expense Report API Routes
app.get('/api/expense-reports', (req, res) => {
  db.all('SELECT * FROM expense_reports', (err, rows) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ error: 'Server error' });
    }
    res.json(rows);
  });
});

// Start the server (only when not in test mode)
if (process.env.NODE_ENV !== 'test') {
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
}

// Export the app for testing
module.exports = { app, db };