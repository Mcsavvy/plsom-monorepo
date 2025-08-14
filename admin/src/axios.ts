import axios from 'axios';
import { API_URL, REFRESH_TOKEN_KEY, TOKEN_KEY } from './constants';
import { convertDRFErrorToHttpError } from './lib/errorUtils';

const axiosInstance = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add access token
axiosInstance.interceptors.request.use(
  config => {
    const token = localStorage.getItem(TOKEN_KEY);
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  error => {
    return Promise.reject(error);
  }
);

// Response interceptor with DRF error handling
axiosInstance.interceptors.response.use(
  response => {
    return response;
  },
  error => {
    const customError = convertDRFErrorToHttpError(error);
    console.log('customError', customError);
    if (
      customError.statusCode == 401 &&
      customError.message == 'Given token not valid for any token type'
    ) {
      localStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem(REFRESH_TOKEN_KEY);
      window.location.href = '/login';
    }
    return Promise.reject(customError);
  }
);

export default axiosInstance;
