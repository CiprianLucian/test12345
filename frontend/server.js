const express = require('express');
const path = require('path');
const app = express();

// Get port from environment variable or default to 8080
const PORT = process.env.PORT || 8080;

console.log(`Starting frontend server...`);
console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
console.log(`Port: ${PORT}`);
console.log(`Current directory: ${__dirname}`);

// Serve static files from the current directory (where dist files are)
app.use(express.static('.', {
  index: 'index.html',
  dotfiles: 'ignore',
  etag: false,
  extensions: ['html', 'js', 'css'],
  maxAge: '1d',
  redirect: false,
  setHeaders: function (res, path, stat) {
    res.set('x-timestamp', Date.now());
  }
}));

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    port: PORT
  });
});

// Handle React Router - send all requests to index.html
app.get('*', (req, res) => {
  const indexPath = path.join(__dirname, 'index.html');
  console.log(`Serving index.html for route: ${req.path}`);
  res.sendFile(indexPath, (err) => {
    if (err) {
      console.error('Error serving index.html:', err);
      res.status(500).send('Error loading page');
    }
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Server error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`✅ Frontend server running on port ${PORT}`);
  console.log(`🌐 Server accessible at http://0.0.0.0:${PORT}`);
});

module.exports = app; 