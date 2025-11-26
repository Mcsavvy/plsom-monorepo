import { useState, useEffect, useCallback } from 'react';
import { useGetIdentity } from '@refinedev/core';
import axiosInstance from '@/axios';
import type { Notification } from '@/components/notifications';

interface NotificationsResponse {
  results: Notification[];
  count: number;
  next: string | null;
  previous: string | null;
}

interface UnreadCountResponse {
  count: number;
}

export function useNotifications() {
  const { data: identity } = useGetIdentity();
  const isAuthenticated = !!identity;

  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch notifications
  const fetchNotifications = useCallback(async () => {
    if (!isAuthenticated) {
      setNotifications([]);
      setUnreadCount(0);
      setIsLoading(false);
      return;
    }

    try {
      const response = await axiosInstance.get<NotificationsResponse>(
        '/notifications/',
        {
          params: {
            page: 1,
            page_size: 20,
          },
        }
      );
      // Handle both paginated and non-paginated responses
      const notificationsData = response.data?.results || response.data || [];
      setNotifications(
        Array.isArray(notificationsData) ? notificationsData : []
      );
    } catch (error) {
      console.error('Error fetching notifications:', error);
      setNotifications([]); // Set empty array on error
    }
  }, [isAuthenticated]);

  // Fetch unread count
  const fetchUnreadCount = useCallback(async () => {
    if (!isAuthenticated) {
      setUnreadCount(0);
      return;
    }

    try {
      const response = await axiosInstance.get<UnreadCountResponse>(
        '/notifications/unread-count/'
      );
      setUnreadCount(response.data.count);
    } catch (error) {
      console.error('Error fetching unread count:', error);
    }
  }, [isAuthenticated]);

  // Mark notification as read
  const markAsRead = useCallback(async (notificationId: number) => {
    try {
      await axiosInstance.post(`/notifications/${notificationId}/mark-read/`);

      // Update local state
      setNotifications(prev =>
        prev.map(notif =>
          notif.id === notificationId
            ? { ...notif, read: true, read_at: new Date().toISOString() }
            : notif
        )
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  }, []);

  // Mark all notifications as read
  const markAllAsRead = useCallback(async () => {
    try {
      await axiosInstance.post('/notifications/mark-all-read/');

      // Update local state
      setNotifications(prev =>
        prev.map(notif => ({
          ...notif,
          read: true,
          read_at: new Date().toISOString(),
        }))
      );
      setUnreadCount(0);
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
    }
  }, []);

  // Initial load
  useEffect(() => {
    if (isAuthenticated) {
      setIsLoading(true);
      Promise.all([fetchNotifications(), fetchUnreadCount()]).finally(() => {
        setIsLoading(false);
      });
    } else {
      setIsLoading(false);
    }
  }, [isAuthenticated, fetchNotifications, fetchUnreadCount]);

  // Polling - fetch notifications every 60 seconds
  useEffect(() => {
    if (!isAuthenticated) return;

    const interval = setInterval(() => {
      fetchNotifications();
      fetchUnreadCount();
    }, 60000); // 60 seconds

    return () => clearInterval(interval);
  }, [isAuthenticated, fetchNotifications, fetchUnreadCount]);

  return {
    notifications,
    unreadCount,
    isLoading,
    markAsRead,
    markAllAsRead,
    refetch: fetchNotifications,
  };
}
