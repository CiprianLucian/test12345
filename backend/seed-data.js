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

// Sample departments
const departments = [
  'Engineering',
  'Marketing',
  'Sales',
  'Human Resources',
  'Finance',
  'Operations',
  'Customer Support',
  'Product Management',
  'Research & Development',
  'Legal'
];

// Generate a random number within a range
const randomInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;

// Generate a list of employees
const generateEmployees = (count) => {
  const employees = [];
  const firstNames = [
    'James', 'Mary', 'John', 'Patricia', 'Robert', 'Jennifer', 'Michael', 'Linda', 
    'William', 'Elizabeth', 'David', 'Barbara', 'Richard', 'Susan', 'Joseph', 'Jessica', 
    'Thomas', 'Sarah', 'Charles', 'Karen', 'Christopher', 'Nancy', 'Daniel', 'Lisa', 
    'Matthew', 'Margaret', 'Anthony', 'Betty', 'Mark', 'Sandra', 'Donald', 'Ashley', 
    'Steven', 'Dorothy', 'Andrew', 'Kimberly', 'Paul', 'Emily', 'Joshua', 'Donna'
  ];
  
  const lastNames = [
    'Smith', 'Johnson', 'Williams', 'Jones', 'Brown', 'Davis', 'Miller', 'Wilson', 
    'Moore', 'Taylor', 'Anderson', 'Thomas', 'Jackson', 'White', 'Harris', 'Martin', 
    'Thompson', 'Garcia', 'Martinez', 'Robinson', 'Clark', 'Rodriguez', 'Lewis', 'Lee', 
    'Walker', 'Hall', 'Allen', 'Young', 'Hernandez', 'King', 'Wright', 'Lopez', 
    'Hill', 'Scott', 'Green', 'Adams', 'Baker', 'Gonzalez', 'Nelson', 'Carter'
  ];
  
  for (let i = 0; i < count; i++) {
    const firstName = firstNames[randomInt(0, firstNames.length - 1)];
    const lastName = lastNames[randomInt(0, lastNames.length - 1)];
    const name = `${firstName} ${lastName}`;
    
    // Generate email (lowercase first name + first letter of last name + domain)
    const email = `${firstName.toLowerCase()}.${lastName.toLowerCase().charAt(0)}@company.com`;
    
    // Random department
    const department = departments[randomInt(0, departments.length - 1)];
    
    // Random sick days (1-20)
    const sickDaysRemaining = randomInt(1, 20);
    
    employees.push([name, email, department, sickDaysRemaining]);
  }
  
  return employees;
};

// Insert employees into database
const insertEmployees = (employees) => {
  console.log(`Inserting ${employees.length} employee records...`);
  
  const insertEmployee = db.prepare('INSERT INTO employees (name, email, department, sick_days_remaining) VALUES (?, ?, ?, ?)');
  
  let successCount = 0;
  
  employees.forEach((employee, index) => {
    insertEmployee.run(employee, (err) => {
      if (err) {
        if (err.code === 'SQLITE_CONSTRAINT') {
          console.warn(`Skipping duplicate email: ${employee[1]}`);
        } else {
          console.error(`Error inserting employee #${index+1}:`, err);
        }
      } else {
        successCount++;
      }
      
      // Close database when done
      if (index === employees.length - 1) {
        insertEmployee.finalize();
        console.log(`Successfully inserted ${successCount} employees`);
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

// Generate and insert employees
console.log('Starting employee data generation...');
const numEmployees = 50; // You can change this number
const employees = generateEmployees(numEmployees);
insertEmployees(employees); 