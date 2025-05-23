const request = require('supertest');

// Import express app
let app;

describe('Health API', () => {
  beforeAll(() => {
    // Set NODE_ENV to test
    process.env.NODE_ENV = 'test';
    
    // Import the app
    const appModule = require('../index');
    app = appModule.app;
  });
  
  describe('GET /health', () => {
    it('should return 200 status and healthy information', async () => {
      const response = await request(app).get('/health');
      
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('status', 'healthy');
      expect(response.body).toHaveProperty('timestamp');
      expect(response.body).toHaveProperty('environment', 'test');
    });
  });
}); 