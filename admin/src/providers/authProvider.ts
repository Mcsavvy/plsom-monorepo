import type { AuthProvider, HttpError } from '@refinedev/core';
import axiosInstance from '../axios';
import { TOKEN_KEY, REFRESH_TOKEN_KEY } from '../constants';
import { UserResponse, UserIdentity } from '@/types/user';
import { transformUser } from '@/utils/dataTransformers';
import * as Sentry from "@sentry/react";

interface LoginResponse {
  access: string;
  refresh: string;
  role: 'admin' | 'lecturer' | 'student';
  program_type: 'certificate' | 'diploma';
  cohort: number | null;
}

interface StoredUser {
  role: 'admin' | 'lecturer' | 'student';
  program_type: 'certificate' | 'diploma';
  cohort: number | null;
}

export const authProvider: AuthProvider = {
  login: async ({ email, password }) => {
    try {
      const { status, data } = await axiosInstance.post<LoginResponse>(
        `/auth/login/`,
        { email, password }
      );

      if (status === 200) {
        if (!['admin', 'lecturer'].includes(data.role)) {
          return {
            success: false,
            error: {
              name: 'LoginError',
              message:
                'Access denied. This application is for administrators and lecturers only.',
            },
          };
        }

        // Store tokens
        localStorage.setItem(TOKEN_KEY, data.access);
        localStorage.setItem(REFRESH_TOKEN_KEY, data.refresh);

        // Store user data
        localStorage.setItem(
          'user',
          JSON.stringify({
            role: data.role,
            program_type: data.program_type,
            cohort: data.cohort,
          })
        );

        // Check if user is admin or lecturer
        if (data.role === 'admin' || data.role === 'lecturer') {
          return {
            success: true,
            redirectTo: '/',
          };
        } else {
          // Students are not allowed in this app
          localStorage.removeItem(TOKEN_KEY);
          localStorage.removeItem(REFRESH_TOKEN_KEY);
          localStorage.removeItem('user');

          return {
            success: false,
            error: {
              name: 'LoginError',
              message:
                'Access denied. This application is for administrators and lecturers only.',
            },
          };
        }
      } else {
        return {
          success: false,
          error: {
            name: 'LoginError',
            message: 'Invalid email or password',
          },
        };
      }
    } catch (error) {
      console.error('Error during login:', error);
      return {
        success: false,
        error: error as HttpError,
      };
    }
  },

  logout: async () => {
    try {
      const refreshToken = localStorage.getItem(REFRESH_TOKEN_KEY);

      if (refreshToken) {
        // Blacklist the refresh token
        await axiosInstance.post(`/auth/logout/`, {
          refresh: refreshToken,
        });
      }
    } catch (error) {
      console.error('Error during logout:', error);
    } finally {
      // Clear all stored data
      localStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem(REFRESH_TOKEN_KEY);
      localStorage.removeItem('user');
    }

    return {
      success: true,
      redirectTo: '/login',
    };
  },

  check: async () => {
    const token = localStorage.getItem(TOKEN_KEY);

    if (!token) {
      return {
        authenticated: false,
        redirectTo: '/login',
      };
    }

    try {
      // Verify token
      const response = await axiosInstance.post(`/auth/verify/`, { token });

      if (response.status === 200) {
        const userData = localStorage.getItem('user');
        if (userData) {
          const user: StoredUser = JSON.parse(userData);
          // Ensure user is admin or lecturer
          if (user.role === 'admin' || user.role === 'lecturer') {
            return {
              authenticated: true,
            };
          }
        }
      }

      // Token is invalid or user is not authorized, try to refresh
      const refreshToken = localStorage.getItem(REFRESH_TOKEN_KEY);
      if (refreshToken) {
        const refreshResponse = await axiosInstance.post(`/auth/refresh/`, {
          refresh: refreshToken,
        });

        if (refreshResponse.status === 200) {
          localStorage.setItem(TOKEN_KEY, refreshResponse.data.access);

          return {
            authenticated: true,
          };
        }
      }
    } catch (error) {
      console.error('Error checking authentication:', error);
    }

    // Clear invalid tokens
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(REFRESH_TOKEN_KEY);
    localStorage.removeItem('user');

    return {
      authenticated: false,
      redirectTo: '/login',
    };
  },

  getPermissions: async () => {
    const userData = localStorage.getItem('user');
    if (userData) {
      const user: StoredUser = JSON.parse(userData);
      return user.role;
    }
    return null;
  },

  getIdentity: async (): Promise<UserIdentity | null> => {
    try {
      const response = await axiosInstance.get<UserResponse>(`/users/me/`);

      if (response.status === 200) {
        const user = transformUser(response.data);
        Sentry.setUser({
          id: user.id,
          email: user.email,
          username: user.email,
          role: user.role,
        });
        return user;
      }
    } catch (error) {
      console.error('Failed to fetch user identity:', error);
    }

    return null;
  },

  onError: async error => {
    Sentry.captureException(error);
    if (error.status === 401) {
      // Try to refresh token
      const refreshToken = localStorage.getItem(REFRESH_TOKEN_KEY);
      if (refreshToken) {
        try {
          const response = await axiosInstance.post(`/auth/refresh/`, {
            refresh: refreshToken,
          });

          if (response.status === 200) {
            localStorage.setItem(TOKEN_KEY, response.data.access);
            return {};
          }
        } catch (refreshError) {
          console.error('Token refresh failed:', refreshError);
        }
      }

      // Clear tokens and redirect to login
      localStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem(REFRESH_TOKEN_KEY);
      localStorage.removeItem('user');

      return {
        logout: true,
        redirectTo: '/login',
      };
    }

    return { error };
  },
  forgotPassword: async ({ email }) => {
    try {
      const response = await axiosInstance.post(`auth/forgot-password/`, {
        email,
      });

      if (response.status === 200) {
        return {
          success: true,
        };
      }

      return {
        success: false,
        error: {
          name: 'ForgotPasswordError',
          message: 'Failed to send reset email. Please try again.',
        },
      };
    } catch (error) {
      console.error('Error during forgot password:', error);
      return {
        success: false,
        error: error as HttpError,
      };
    }
  },
};
