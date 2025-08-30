import React, { useMemo } from 'react';
import { useBreadcrumb, useResource } from '@refinedev/core';
import { Link, useLocation, useParams } from 'react-router';
import {
  Breadcrumb as ShadcnBreadcrumb,
  BreadcrumbList,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import { useMeta } from '@/hooks/use-meta';
import { getResourceIcon } from '@/utils/resourceUtils';
import { Skeleton } from '@/components/ui/skeleton';

interface BreadcrumbItemData {
  label: string;
  href?: string;
  resource?: string;
  id?: string;
  isLast: boolean;
  isAction?: boolean; // New flag to identify action items
  isLoading?: boolean;
}

// Action display names mapping
const ACTION_DISPLAY_NAMES: Record<string, string> = {
  list: 'All',
  create: 'Create',
  edit: 'Edit',
  show: 'View',
  clone: 'Clone',
  'create-many': 'Create Many',
  'edit-many': 'Edit Many',
  'show-many': 'View Many',
  import: 'Import',
  export: 'Export',
  attendance: 'Attendance',
  grades: 'Grades',
  'grade-report': 'Grade Report',
  assignments: 'Assignments',
  submissions: 'Submissions',
  schedule: 'Schedule',
  calendar: 'Calendar',
  announcements: 'Announcements',
  discussions: 'Discussions',
  materials: 'Materials',
  resources: 'Resources',
};

/**
 * Enhanced breadcrumb item that can fetch and display actual item names
 */
const EnhancedBreadcrumbItem: React.FC<{ item: BreadcrumbItemData }> = ({
  item,
}) => {
  const { meta, isLoading } = useMeta(item.resource || '', item.id, {
    enabled: Boolean(item.resource && item.id && !item.isAction),
  });

  // Show loading skeleton for items that are being fetched
  if (isLoading && item.resource && item.id && !item.isAction) {
    return (
      <BreadcrumbItem className='block'>
        <Skeleton className='h-4 w-20' />
      </BreadcrumbItem>
    );
  }

  // For action items, just show the action name
  if (item.isAction) {
    return (
      <BreadcrumbItem className='block'>
        <BreadcrumbPage className='flex items-center gap-2'>
          {item.resource && getResourceIcon(item.resource)}
          {item.label}
        </BreadcrumbPage>
      </BreadcrumbItem>
    );
  }

  // Use meta name if available, otherwise fall back to original label
  const displayName = meta?.name || item.label;

  return (
    <BreadcrumbItem className='block'>
      {item.href && !item.isLast ? (
        <BreadcrumbLink asChild>
          <Link to={item.href} title={meta?.description}>
            {displayName}
          </Link>
        </BreadcrumbLink>
      ) : (
        <BreadcrumbPage title={meta?.description}>{displayName}</BreadcrumbPage>
      )}
    </BreadcrumbItem>
  );
};

/**
 * Parse route path to extract resource and ID information
 */
const parseRouteForMeta = (
  pathname: string,
  params: Record<string, string | undefined>
) => {
  const segments = pathname.split('/').filter(Boolean);

  // Common patterns: /resource/id, /resource/id/action
  if (segments.length >= 2) {
    const resource = segments[0];
    const potentialId = segments[1];

    // Check if the second segment is an ID (numeric or matches param)
    if (
      potentialId &&
      (/^\d+$/.test(potentialId) || potentialId === params.id || params.id)
    ) {
      console.log(resource, potentialId, segments[2])
      return {
        resource,
        id: params.id || potentialId,
        action: segments[2], // Third segment would be the action
      };
    }
  }

  return null;
};

/**
 * Generate show URL for a resource item
 */
const generateShowUrl = (resource: string, id: string) => {
  return `/${resource}/${id}`;
};

export const Breadcrumb = () => {
  const { breadcrumbs } = useBreadcrumb();
  const location = useLocation();
  const params = useParams();
  const { resource } = useResource();

  // Enhanced breadcrumb items with meta data support and action separation
  const enhancedBreadcrumbs = useMemo(() => {
    const items: BreadcrumbItemData[] = [];

    breadcrumbs.forEach((breadcrumb, index) => {
      const isLast = index === breadcrumbs.length - 1;

      // For the current page (last breadcrumb), try to extract resource/id info
      if (isLast) {
        const routeMeta = parseRouteForMeta(location.pathname, params);

        if (routeMeta && routeMeta.action && routeMeta.action !== 'show') {
          // Add the item itself (clickable to show page)
          if (routeMeta.id) {
            items.push({
              label: breadcrumb.label,
              href: generateShowUrl(routeMeta.resource, routeMeta.id),
              resource: routeMeta.resource,
              id: routeMeta.id,
              isLast: false,
            });
          }

          // Add the action as a separate breadcrumb item
          items.push({
            label: ACTION_DISPLAY_NAMES[routeMeta.action] || 
                   routeMeta.action.charAt(0).toUpperCase() + routeMeta.action.slice(1),
            isLast: true,
            isAction: true,
          });
          return;
        }

        // If we have current resource context from Refine and it's an action page
        if (resource && params.id) {
          const currentAction = location.pathname.split('/').pop();
          if (
            currentAction &&
            currentAction !== params.id &&
            ACTION_DISPLAY_NAMES[currentAction]
          ) {
            // Add the item itself (clickable to show page)
            items.push({
              label: breadcrumb.label,
              href: generateShowUrl(resource.name, params.id),
              resource: resource.name,
              id: params.id,
              isLast: false,
            });

            // Add the action as a separate breadcrumb item
            items.push({
              label: ACTION_DISPLAY_NAMES[currentAction] || 
                     currentAction.charAt(0).toUpperCase() + currentAction.slice(1),
              isLast: true,
              isAction: true,
            });
            return;
          }
        }

        // If it's a show page or no action detected, add normally with meta enhancement
        const routeMetaForShow = parseRouteForMeta(location.pathname, params);
        if (routeMetaForShow) {
          items.push({
            label: breadcrumb.label,
            href: breadcrumb.href,
            resource: routeMetaForShow.resource,
            id: routeMetaForShow.id,
            isLast,
          });
          return;
        }

        // If we have current resource context from Refine (for show pages)
        if (resource && params.id) {
          items.push({
            label: breadcrumb.label,
            href: breadcrumb.href,
            resource: resource.name,
            id: params.id,
            isLast,
          });
          return;
        }
      }

      // For other breadcrumbs, check if they contain resource/id patterns
      if (breadcrumb.href) {
        const routeMeta = parseRouteForMeta(breadcrumb.href, {});
        if (routeMeta) {
          items.push({
            label: breadcrumb.label,
            href: breadcrumb.href,
            resource: routeMeta.resource,
            id: routeMeta.id,
            isLast,
          });
          return;
        }
      }

      // Default breadcrumb item without meta enhancement
      items.push({
        label: breadcrumb.label,
        href: breadcrumb.href,
        isLast,
      });
    });

    return items;
  }, [breadcrumbs, location.pathname, params, resource]);

  return (
    <ShadcnBreadcrumb>
      <BreadcrumbList>
        {enhancedBreadcrumbs.map((breadcrumb, index) => (
          <React.Fragment key={`breadcrumb-${breadcrumb.label}-${index}`}>
            <EnhancedBreadcrumbItem item={breadcrumb} />
            {!breadcrumb.isLast && <BreadcrumbSeparator />}
          </React.Fragment>
        ))}
      </BreadcrumbList>
    </ShadcnBreadcrumb>
  );
};
