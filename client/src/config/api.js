const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080';

if (import.meta.env.MODE === 'production' && !import.meta.env.VITE_API_URL) {
  console.warn('⚠️ VITE_API_URL is not set in production! API calls may fail.');
}

console.log('API Base URL:', API_BASE_URL);

export default API_BASE_URL;

