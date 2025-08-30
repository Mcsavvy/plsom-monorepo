import { AuditLogProvider } from '@refinedev/core';
import axiosInstance from '@/axios';
import { transformAuditLog } from '@/utils/dataTransformers';

export const auditLogProvider: AuditLogProvider = {
  get: async params => {
    const { resource, meta, action, author, metaData } = params;

    // Build query parameters
    const queryParams = new URLSearchParams();

    if (resource) {
      queryParams.append('resource', resource);
    }

    if (meta?.id) {
      queryParams.append('meta_id', meta.id.toString());
    }

    if (action) {
      queryParams.append('action', action);
    }

    if (author?.username) {
      queryParams.append('author', author.username);
    }

    // Add any additional filters from metaData
    if (metaData) {
      Object.entries(metaData).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          queryParams.append(key, String(value));
        }
      });
    }

    const url = meta?.id
      ? `/audit-logs/${resource}/${meta.id}/`
      : `/audit-logs/?${queryParams.toString()}`;

    try {
      const response = await axiosInstance.get(url);

      // Transform Django response to match Refine's expected format
      const transformedData = Array.isArray(
        response.data.results || response.data
      )
        ? (response.data.results || response.data).map(transformAuditLog)
        : [transformAuditLog(response.data)];

      return {
        data: transformedData,
        total: response.data.count || transformedData.length,
      };
    } catch (error) {
      console.error('Failed to fetch audit logs:', error);
      throw error;
    }
  },

  create: async params => {
    const { resource, meta, action, author, data, previousData } = params;

    const auditData = {
      resource,
      action,
      author: author
        ? {
            id: author.id,
            username: author.username || author.name,
            name: author.name,
            email: author.email,
          }
        : undefined,
      data: data || {},
      previous_data: previousData || {},
      meta: {
        id: meta?.id,
        ...meta,
      },
    };

    try {
      const response = await axiosInstance.post('/audit-logs/', auditData);
      return {
        data: response.data,
        success: true,
      };
    } catch (error) {
      console.error('Failed to create audit log:', error);
      return { success: false };
    }
  },

  update: async params => {
    const { id, name, ...rest } = params;

    const updateData = {
      meta: {
        custom_name: name,
        ...rest,
      },
    };

    try {
      const response = await axiosInstance.patch(
        `/audit-logs/${id}/`,
        updateData
      );
      return {
        data: transformAuditLog(response.data),
        success: true,
      };
    } catch (error) {
      console.error('Failed to update audit log:', error);
      return { success: false };
    }
  },
};
