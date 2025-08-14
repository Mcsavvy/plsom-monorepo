import { useLogList, useLog, LogParams } from '@refinedev/core';

export const useAuditLogs = (resource?: string, resourceId?: string) => {
  const auditLogsQuery = useLogList({
    resource: resource || 'all',
    meta: resourceId ? { id: resourceId } : undefined,
  });

  const { log } = useLog();

  const createAuditLog = (
    params: Omit<LogParams, 'resource'> & { resource?: string }
  ) => {
    return log.mutate({
      resource: params.resource || resource || 'unknown',
      action: params.action,
      author: params.author,
      data: params.data,
      meta: params.meta,
    });
  };

  return {
    auditLogs: auditLogsQuery.data?.data || [],
    isLoading: auditLogsQuery.isLoading,
    error: auditLogsQuery.error,
    refetch: auditLogsQuery.refetch,
    createAuditLog,
  };
};
