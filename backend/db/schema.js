const initializeDatabase = (db) => {
  // Create employees table
  db.exec(`
    CREATE TABLE IF NOT EXISTS employees (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      department TEXT NOT NULL,
      sick_days_remaining INTEGER NOT NULL DEFAULT 10
    )
  `);

  // Create sick leave requests table
  db.exec(`
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

  // Check if employees table is empty and seed data if needed
  const employeeCount = db.prepare('SELECT COUNT(*) as count FROM employees').get();
  
  if (employeeCount.count === 0) {
    const insertEmployee = db.prepare(
      'INSERT INTO employees (name, email, department, sick_days_remaining) VALUES (?, ?, ?, ?)'
    );
    
    // Seed with sample data
    const employees = [
      ['John Doe', 'john.doe@company.com', 'Engineering', 10],
      ['Jane Smith', 'jane.smith@company.com', 'Marketing', 8],
      ['Michael Johnson', 'michael.johnson@company.com', 'HR', 12],
      ['Emily Davis', 'emily.davis@company.com', 'Finance', 15],
      ['Robert Wilson', 'robert.wilson@company.com', 'Engineering', 7]
    ];
    
    employees.forEach(employee => {
      insertEmployee.run(employee);
    });
  }
};

module.exports = { initializeDatabase }; 