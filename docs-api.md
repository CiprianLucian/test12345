# API Documentation

## Base URL

All endpoints are prefixed with: `http://localhost:5000/api`

## Authentication

Currently, this API does not implement authentication mechanisms. This can be added in future iterations.

## Error Handling

All endpoints return appropriate HTTP status codes:
- `200` - Success
- `201` - Resource created
- `400` - Bad request
- `404` - Resource not found
- `500` - Server error

Error response body format:
```json
{
  "error": "Error message description"
}
```

## Endpoints

### Items

#### GET `/items`

Retrieves all items from the database.

**Request**
```
GET /api/items
```

**Response**
```json
[
  {
    "id": 1,
    "name": "Example Item",
    "description": "This is an example item"
  },
  {
    "id": 2,
    "name": "Another Item",
    "description": "This is another example item"
  }
]
```

#### POST `/items`

Creates a new item.

**Request**
```
POST /api/items
Content-Type: application/json

{
  "name": "New Item",
  "description": "Description of the new item"
}
```

**Required fields:**
- `name`: String

**Optional fields:**
- `description`: String

**Response**
```json
{
  "id": 3,
  "name": "New Item",
  "description": "Description of the new item"
}
```

## Extending the API

### Example: Adding PUT and DELETE Endpoints

To add update and delete functionality, implement these endpoints:

#### PUT `/items/:id`

Updates an existing item.

**Request**
```
PUT /api/items/1
Content-Type: application/json

{
  "name": "Updated Item",
  "description": "Updated description"
}
```

**Implementation Example:**
```javascript
app.put('/api/items/:id', (req, res) => {
  try {
    const { id } = req.params;
    const { name, description } = req.body;
    
    if (!name) {
      return res.status(400).json({ error: 'Name is required' });
    }
    
    const update = db.prepare('UPDATE items SET name = ?, description = ? WHERE id = ?');
    const result = update.run(name, description || '', id);
    
    if (result.changes === 0) {
      return res.status(404).json({ error: 'Item not found' });
    }
    
    res.json({ id: Number(id), name, description });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
});
```

#### DELETE `/items/:id`

Deletes an item.

**Request**
```
DELETE /api/items/1
```

**Implementation Example:**
```javascript
app.delete('/api/items/:id', (req, res) => {
  try {
    const { id } = req.params;
    
    const deleteStmt = db.prepare('DELETE FROM items WHERE id = ?');
    const result = deleteStmt.run(id);
    
    if (result.changes === 0) {
      return res.status(404).json({ error: 'Item not found' });
    }
    
    res.status(204).send();
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
}); 