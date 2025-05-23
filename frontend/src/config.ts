// Production and development API URLs
const API_URL = import.meta.env.VITE_API_URL 
  ? `${import.meta.env.VITE_API_URL}/api`
  : 'http://localhost:5000/api';

// Axios default config
import axios from 'axios';

axios.defaults.baseURL = API_URL;
axios.defaults.withCredentials = true; // Enable sending cookies
axios.defaults.headers.common['Content-Type'] = 'application/json';

export default API_URL;
