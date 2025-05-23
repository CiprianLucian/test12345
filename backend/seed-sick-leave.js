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

// Generate a random number within a range
const randomInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;

// Generate a random date between two dates
const randomDate = (startDate, endDate) => {
  const start = new Date(startDate).getTime();
  const end = new Date(endDate).getTime();
  const randomTime = randomInt(start, end);
  return new Date(randomTime);
};

// Format date as YYYY-MM-DD
const formatDate = (date) => {
  return date.toISOString().split('T')[0];
};

// Random sick leave reasons
const sickLeaveReasons = [
  'Cold and flu symptoms',
  'Migraine',
  'Stomach virus',
  'Food poisoning',
  'Fever',
  'Dental procedure',
  'Medical appointment',
  'Back pain',
  'COVID-19 symptoms',
  'Allergic reaction',
  'Personal health issue',
  'Recovering from minor surgery',
  'Severe headache',
  'Respiratory infection'
];

// Status options
const statuses = ['pending', 'approved', 'rejected'];

// Fetch all employees from the database
const getEmployees = () => {
  return new Promise((resolve, reject) => {
    db.all('SELECT id FROM employees', (err, rows) => {
      if (err) {
        reject(err);
        return;
      }
      resolve(rows.map(row => row.id));
    });
  });
};

// Generate sick leave requests
const generateSickLeaveRequests = (employeeIds, count) => {
  const sickLeaveRequests = [];
  const today = new Date();
  const oneYearAgo = new Date();
  oneYearAgo.setFullYear(today.getFullYear() - 1);
  
  for (let i = 0; i < count; i++) {
    // Random employee
    const employeeId = employeeIds[randomInt(0, employeeIds.length - 1)];
    
    // Random start date within the last year
    const startDate = randomDate(oneYearAgo, today);
    
    // Random duration (1-7 days)
    const duration = randomInt(1, 7);
    const endDate = new Date(startDate);
    endDate.setDate(startDate.getDate() + duration);
    
    // Random reason
    const reason = sickLeaveReasons[randomInt(0, sickLeaveReasons.length - 1)];
    
    // Random status (with higher chance of being approved or pending)
    const statusWeight = randomInt(1, 10);
    let status;
    if (statusWeight <= 4) {
      status = 'approved';
    } else if (statusWeight <= 8) {
      status = 'pending';
    } else {
      status = 'rejected';
    }
    
    // Created and updated timestamps
    const createdAt = formatDate(startDate);
    let updatedAt = createdAt;
    
    // If status is not pending, updated date is different from created date
    if (status !== 'pending') {
      const updateDate = new Date(startDate);
      updateDate.setDate(updateDate.getDate() + randomInt(1, 3));
      updatedAt = formatDate(updateDate);
    }
    
    sickLeaveRequests.push([
      employeeId,
      formatDate(startDate),
      formatDate(endDate),
      reason,
      status,
      createdAt,
      updatedAt
    ]);
  }
  
  return sickLeaveRequests;
};

// Insert sick leave requests into database
const insertSickLeaveRequests = (requests) => {
  console.log(`Inserting ${requests.length} sick leave requests...`);
  
  const insertRequest = db.prepare(`
    INSERT INTO sick_leave_requests (
      employee_id, start_date, end_date, reason, status, created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?)
  `);
  
  let successCount = 0;
  
  requests.forEach((request, index) => {
    insertRequest.run(request, (err) => {
      if (err) {
        console.error(`Error inserting sick leave request #${index+1}:`, err);
      } else {
        successCount++;
      }
      
      // Close database when done
      if (index === requests.length - 1) {
        insertRequest.finalize();
        console.log(`Successfully inserted ${successCount} sick leave requests`);
        db.close((err) => {
          if (err) {
            console.error('Error closing database:', err);
          } else {
            console.log('Database connection closed');
          }
        });
      }
    });
  });
};

// Main function to generate and insert data
const seedSickLeaveData = async () => {
  try {
    console.log('Getting employees...');
    const employeeIds = await getEmployees();
    
    if (employeeIds.length === 0) {
      console.error('No employees found in the database. Please run seed-data.js first.');
      db.close();
      return;
    }
    
    console.log(`Found ${employeeIds.length} employees`);
    console.log('Generating sick leave requests...');
    
    // Generate 3 requests per employee on average
    const requestCount = Math.floor(employeeIds.length * 3);
    const requests = generateSickLeaveRequests(employeeIds, requestCount);
    
    insertSickLeaveRequests(requests);
  } catch (error) {
    console.error('Error seeding sick leave data:', error);
    db.close();
  }
};

// Run the seeding
seedSickLeaveData(); 