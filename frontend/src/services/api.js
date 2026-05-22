import axios from 'axios'
import { API_URL } from '../config'

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
})

/**
 * JWT token decode utility
 */
const decodeJWT = (token) => {
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
      return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
    }).join(''));
    return JSON.parse(jsonPayload);
  } catch (e) {
    return null;
  }
};

/**
 * Check if token will expire soon (within 5 minutes)
 */
const isTokenExpiringSoon = (token) => {
  const decoded = decodeJWT(token);
  if (!decoded || !decoded.exp) return false;
  
  const now = Math.floor(Date.now() / 1000);
  const expiresIn = decoded.exp - now;
  
  // Token expires in less than 5 minutes (300 seconds)
  return expiresIn < 300;
};

/**
 * Proactive token refresh
 */
const refreshTokenIfNeeded = async () => {
  const token = localStorage.getItem('accessToken');
  if (!token) return;

  if (isTokenExpiringSoon(token)) {
    console.log('🔄 Token expiring soon, proactively refreshing...');
    try {
      const refreshToken = localStorage.getItem('refreshToken');
      const response = await axios.post(`${API_URL}/auth/refresh/`, {
        refresh: refreshToken,
      });

      const { access } = response.data;
      localStorage.setItem('accessToken', access);
      console.log('✅ Token refreshed successfully');
      return access;
    } catch (error) {
      console.error('❌ Token refresh failed:', error);
      throw error;
    }
  }
  
  return token;
};

// Request interceptor - her istekte token ekle ve proactive refresh
api.interceptors.request.use(
  async (config) => {
    try {
      const token = await refreshTokenIfNeeded();
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    } catch (error) {
      // Refresh failed, let it continue and fail at response interceptor
      const oldToken = localStorage.getItem('accessToken');
      if (oldToken) {
        config.headers.Authorization = `Bearer ${oldToken}`;
      }
    }
    return config;
  },
  (error) => Promise.reject(error)
)

// Response interceptor - token yenileme
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true

      try {
        const refreshToken = localStorage.getItem('refreshToken')
        const response = await axios.post(`${API_URL}/auth/refresh/`, {
          refresh: refreshToken,
        })

        const { access } = response.data
        localStorage.setItem('accessToken', access)

        originalRequest.headers.Authorization = `Bearer ${access}`
        return api(originalRequest)
      } catch (refreshError) {
        localStorage.removeItem('accessToken')
        localStorage.removeItem('refreshToken')
        localStorage.removeItem('user')
        window.location.href = '/login'
        return Promise.reject(refreshError)
      }
    }

    return Promise.reject(error)
  }
)

export default api
