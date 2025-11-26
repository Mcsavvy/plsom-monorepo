import axios from 'axios';
import { API_URL, REFRESH_TOKEN_KEY, TOKEN_KEY } from './constants';
import { convertDRFErrorToHttpError } from './lib/errorUtils';
import * as Sentry from '@sentry/react';

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

const axiosProxy = new Proxy(axiosInstance, {
  get(target: typeof axiosInstance, prop: keyof typeof axiosInstance) {
    const methods = ['get', 'post', 'put', 'delete', 'patch'];
    if (methods.includes(prop)) {
      return (...args: any[]) => {
        return Sentry.startSpan(
          {
            name: 'backend.request',
            op: `${prop.toUpperCase()} ${args[0]}`,
          },
          async () => {
            // @ts-ignore - prop is a string
            const response = await target[prop](...args);
            return response;
          }
        );
      };
    }
    return target[prop];
  },
});

export default axiosProxy;
