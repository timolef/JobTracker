const isDev = import.meta.env.DEV;
const railwayUrl = 'https://jobtracker-production-03e6.up.railway.app';
const localUrl = 'http://localhost:3000';

const API_BASE_URL = import.meta.env.VITE_API_URL || (isDev ? localUrl : railwayUrl);

console.log(`[Config] Environment: ${isDev ? 'Development' : 'Production'}`);
console.log(`[Config] API_BASE_URL: ${API_BASE_URL}`);

export { API_BASE_URL };
