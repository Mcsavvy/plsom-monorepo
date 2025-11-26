import { useCustom } from '@refinedev/core';
import { useMemo } from 'react';

interface MetaData {
  name: string;
  description: string;
}

interface UseMetaOptions {
  enabled?: boolean;
}

/**
 * Custom hook to fetch meta data for a resource item
 * Uses Refine's useCustom hook for automatic caching and error handling
 */
export const useMeta = (
  resource: string,
  id: string | number | undefined,
  options: UseMetaOptions = {}
) => {
  const { enabled = true } = options;

  // Only fetch if we have both resource and id
  const shouldFetch = enabled && Boolean(resource) && Boolean(id);

  const {
    query: { isLoading, error, refetch },

    result: data,
  } = useCustom<MetaData>({
    url: `meta/${resource}/${id}/`,
    method: 'get',
    queryOptions: {
      enabled: shouldFetch,
      // Cache for 5 minutes to avoid unnecessary requests
      staleTime: 5 * 60 * 1000,
      // Keep in cache for 10 minutes
      gcTime: 10 * 60 * 1000,
      // Retry on failure
      retry: 2,
      // Don't refetch on window focus for meta data
      refetchOnWindowFocus: false,
      queryKey: ['meta', resource, id],
    },
  });

  const meta = useMemo(() => {
    return data?.data;
  }, [data]);

  return {
    meta,
    isLoading,
    error,
    refetch,
    // Helper methods
    name: meta?.name,
    description: meta?.description,
  };
};

/**
 * Hook to fetch multiple meta data items at once
 * Useful for breadcrumbs that need to show names for multiple items
 */
export const useMultipleMeta = (
  items: Array<{ resource: string; id: string | number }>
) => {
  const metaQueries = items.map(item =>
    // eslint-disable-next-line react-hooks/rules-of-hooks
    useMeta(item.resource, item.id)
  );

  const isLoading = metaQueries.some(query => query.isLoading);
  const hasError = metaQueries.some(query => query.error);

  const metaData = useMemo(() => {
    return metaQueries.map((query, index) => ({
      resource: items[index].resource,
      id: items[index].id,
      name: query.name,
      description: query.description,
      isLoading: query.isLoading,
      error: query.error,
    }));
  }, [metaQueries, items]);

  return {
    metaData,
    isLoading,
    hasError,
    // Helper to get meta by resource and id
    getMeta: (resource: string, id: string | number) => {
      return metaData.find(
        meta =>
          meta.resource === resource && meta.id.toString() === id.toString()
      );
    },
  };
};
