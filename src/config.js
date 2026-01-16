const isDev = import.meta.env.DEV;
const hostname = typeof window !== 'undefined' ? window.location.hostname : 'localhost';
const localUrl = `http://${hostname}:3000`;
const railwayUrl = 'https://jobtracker-production-03e6.up.railway.app';

// Prioritize local URL in development
const API_BASE_URL = isDev ? localUrl : (import.meta.env.VITE_API_URL || railwayUrl);

console.log(`[Config] Environment: ${isDev ? 'Development' : 'Production'}`);
console.log(`[Config] Hostname detected: ${hostname}`);
console.log(`[Config] API_BASE_URL: ${API_BASE_URL}`);

export { API_BASE_URL };
