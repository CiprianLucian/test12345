# Database Schema Documentation

## Overview

This project uses SQLite as the database. SQLite is a self-contained, serverless, zero-configuration database engine that is embedded into the application.

The database file is located at `backend/database.sqlite`.

## Tables

### items

This table stores the basic items for the application.

| Column      | Type    | Constraints       | Description                    |
|-------------|---------|-------------------|--------------------------------|
| id          | INTEGER | PRIMARY KEY       | Auto-incrementing unique ID    |
| name        | TEXT    | NOT NULL          | Name of the item               |
| description | TEXT    |                   | Optional description           |

## Schema Definition

The database schema is defined in `backend/index.js`:

```javascript
db.exec(`
  CREATE TABLE IF NOT EXISTS items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    description TEXT
  )
`);
```

## Database Access

The application uses `better-sqlite3` for database operations:

```javascript
const Database = require('better-sqlite3');
const db = new Database('database.sqlite', { verbose: console.log });
```

## Example Queries

### Select All Items
```sql
SELECT * FROM items
```

### Insert an Item
```sql
INSERT INTO items (name, description) VALUES ('Item Name', 'Item Description')
```

### Update an Item
```sql
UPDATE items SET name = 'New Name', description = 'New Description' WHERE id = 1
```

### Delete an Item
```sql
DELETE FROM items WHERE id = 1
```

## Extending the Schema

To add more functionality, you can extend the database schema with additional tables.

### Example: Adding a 'users' Table

```javascript
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT NOT NULL UNIQUE,
    email TEXT NOT NULL UNIQUE,
    password TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  )
`);
```

### Example: Adding a 'categories' Table

```javascript
db.exec(`
  CREATE TABLE IF NOT EXISTS categories (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL UNIQUE
  )
`);

// Then modify the items table to include a category reference
db.exec(`
  ALTER TABLE items ADD COLUMN category_id INTEGER REFERENCES categories(id)
`);
```

## Database Management

Since SQLite is a file-based database, backups can be done by simply copying the database file. For schema migrations in a development environment, you can:

1. Backup the current database file
2. Modify the schema in the code
3. Restart the application (the schema will be updated if using `CREATE TABLE IF NOT EXISTS`) 