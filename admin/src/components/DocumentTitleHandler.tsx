import React, { useLayoutEffect } from 'react';
import { useParsed } from '@refinedev/core';
import { useLocation } from 'react-router';
import { useMeta } from '@/hooks/use-meta';
import { getAppBranding } from '@/utils/environment';

const APP_NAME = getAppBranding().name;

// Resource display names mapping
const RESOURCE_DISPLAY_NAMES: Record<string, string> = {
  cohorts: 'Cohorts',
  students: 'Students',
  staff: 'Staff',
  enrollments: 'Enrollments',
  invitations: 'Invitations',
  users: 'Users',
  courses: 'Courses',
  classes: 'Classes',
  'audit-logs': 'Audit Logs',
  dashboard: 'Dashboard',
};

// Action display names mapping
const ACTION_DISPLAY_NAMES: Record<string, string> = {
  list: 'All',
  create: 'Create',
  edit: 'Edit',
  show: '',
  clone: 'Clone',
};

// Special page titles for non-resource pages
const SPECIAL_PAGE_TITLES: Record<string, string> = {
  '/': `Dashboard - ${APP_NAME}`,
  '/dashboard': `Dashboard - ${APP_NAME}`,
  '/login': `Sign In - ${APP_NAME}`,
  '/register': `Sign Up - ${APP_NAME}`,
  '/forgot-password': `Reset Password - ${APP_NAME}`,
  '/reset-password': `Set New Password - ${APP_NAME}`,
  '/profile': `Profile Settings - ${APP_NAME}`,
  '/onboard': `Welcome - ${APP_NAME}`,
};

/**
 * Universal document title handler that works on all pages
 * Uses meta data from backend when available, falls back to smart defaults
 */
export const DocumentTitleHandler: React.FC = () => {
  const location = useLocation();
  const { action, params, resource } = useParsed();

  // Fetch meta data if we have resource and ID
  const { meta, isLoading } = useMeta(resource?.name || '', params?.id, {
    enabled: Boolean(resource?.name && params?.id),
  });

  useLayoutEffect(() => {
    let title = '';

    // Handle special non-resource pages first
    if (SPECIAL_PAGE_TITLES[location.pathname]) {
      title = SPECIAL_PAGE_TITLES[location.pathname];
    }
    // Handle resource-based pages
    else if (resource) {
      const resourceName =
        RESOURCE_DISPLAY_NAMES[resource.name] || resource.name;
      const actionName = action ? ACTION_DISPLAY_NAMES[action] : '';

      if (action === 'list') {
        title = `${resourceName} - ${APP_NAME}`;
      } else if (action === 'create') {
        title = `Create ${resourceName} - ${APP_NAME}`;
      } else if (action === 'edit') {
        if (meta?.name && !isLoading) {
          title = `Edit ${meta.name} - ${APP_NAME}`;
        } else {
          const id = params?.id || 'Unknown';
          title = `Edit ${resourceName} #${id} - ${APP_NAME}`;
        }
      } else if (action === 'show') {
        if (meta?.name && !isLoading) {
          title = `${meta.name} - ${APP_NAME}`;
        } else {
          const id = params?.id || 'Unknown';
          title = `${resourceName} #${id} - ${APP_NAME}`;
        }
      } else if (action === 'clone') {
        if (meta?.name && !isLoading) {
          title = `Clone ${meta.name} - ${APP_NAME}`;
        } else {
          title = `Clone ${resourceName} - ${APP_NAME}`;
        }
      } else {
        // Other actions
        if (meta?.name && !isLoading) {
          title = `${actionName} ${meta.name} - ${APP_NAME}`;
        } else {
          title = `${actionName} ${resourceName} - ${APP_NAME}`;
        }
      }
    }
    // Handle unknown pages with a generic title
    else {
      // Try to create a meaningful title from the pathname
      const pathSegments = location.pathname.split('/').filter(Boolean);
      if (pathSegments.length > 0) {
        const pageName = pathSegments[pathSegments.length - 1]
          .split('-')
          .map(word => word.charAt(0).toUpperCase() + word.slice(1))
          .join(' ');
        title = `${pageName} - ${APP_NAME}`;
      } else {
        title = APP_NAME;
      }
    }

    // Ensure title is not too long (browser tabs have limited space)
    const maxLength = 60;
    if (title.length > maxLength) {
      title = title.substring(0, maxLength - 3) + '...';
    }

    document.title = title;
  }, [location.pathname, action, params?.id, resource, meta?.name, isLoading]);

  return null;
};
