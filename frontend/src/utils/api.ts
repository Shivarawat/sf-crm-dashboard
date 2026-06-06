import axios from 'axios';

// Axios instance pre-configured with the backend base URL.
// withCredentials:true is required so the browser includes the session cookie on every request.
// Without this, the backend session check fails and all CRM requests return 401.
const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL || 'https://sf-crm-dashboard.onrender.com',
  withCredentials: true,
});

export default api;
