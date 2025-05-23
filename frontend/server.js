const express = require('express');
const path = require('path');
const app = express();

// Get port from environment variable or default to 8080
const PORT = process.env.PORT || 8080;

// Serve static files from the current directory (where dist files are)
app.use(express.static('.'));

// Handle React Router - send all requests to index.html
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Frontend server running on port ${PORT}`);
});

module.exports = app; 