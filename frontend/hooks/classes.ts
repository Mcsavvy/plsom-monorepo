"use client";

import { useCallback } from "react";
import { useClient } from "./axios";
import {
  Class,
  ClassesList,
  ClassesQuery,
  TimeFilter,
  classSchema,
  classesListSchema,
  paginatedClassesResponseSchema,
  ClassCardData,
  transformClassToCardData,
} from "@/types/classes";

/**
 * Get all classes for the current student
 */
async function _getMyClasses(
  client: ReturnType<typeof useClient>,
  query?: ClassesQuery
): Promise<ClassesList> {
  try {
    const params = new URLSearchParams();
    
    if (query?.ordering) params.append("ordering", query.ordering);
    if (query?.page) params.append("page", query.page.toString());
    if (query?.page_size) params.append("page_size", query.page_size.toString());
    if (query?.search) params.append("search", query.search);
    if (query?.time_filter) params.append("time_filter", query.time_filter);

    const url = `/classes/my-classes/${params.toString() ? `?${params.toString()}` : ""}`;
    const response = await client.get(url);
    
    if (response.status === 200) {
      // Handle paginated response
      const paginatedResponse = paginatedClassesResponseSchema.parse(response.data);
      return paginatedResponse.results;
    }
    throw new Error("Failed to fetch classes");
  } catch (error) {
    throw error;
  }
}

/**
 * Get detailed information about a specific class for the current student
 */
async function _getClassDetails(
  client: ReturnType<typeof useClient>,
  classId: number
): Promise<Class> {
  try {
    const response = await client.get<Class>(`/classes/${classId}/my-class/`);
    if (response.status === 200) {
      const classData = classSchema.parse(response.data);
      return classData;
    }
    throw new Error("Failed to fetch class details");
  } catch (error) {
    throw error;
  }
}

/**
 * Hook for managing class-related operations
 */
export function useClasses() {
  const client = useClient();

  /**
   * Fetch all classes for the current student
   */
  const getMyClasses = useCallback(
    async (query?: ClassesQuery): Promise<ClassesList> => {
      return await _getMyClasses(client, query);
    },
    [client]
  );

  /**
   * Fetch classes filtered by time (past or upcoming)
   */
  const getClassesByTimeFilter = useCallback(
    async (timeFilter: TimeFilter): Promise<ClassesList> => {
      return await _getMyClasses(client, { time_filter: timeFilter });
    },
    [client]
  );

  /**
   * Fetch detailed information about a specific class
   */
  const getClassDetails = useCallback(
    async (classId: number): Promise<Class> => {
      return await _getClassDetails(client, classId);
    },
    [client]
  );

  /**
   * Get classes formatted for UI components
   */
  const getMyClassesForUI = useCallback(
    async (query?: ClassesQuery): Promise<ClassCardData[]> => {
      const classes = await getMyClasses(query);
      return classes.map(transformClassToCardData);
    },
    [getMyClasses]
  );

  /**
   * Get class details formatted for UI
   */
  const getClassDetailsForUI = useCallback(
    async (classId: number): Promise<ClassCardData> => {
      const classData = await getClassDetails(classId);
      return transformClassToCardData(classData);
    },
    [getClassDetails]
  );

  return {
    getMyClasses,
    getClassesByTimeFilter,
    getClassDetails,
    getMyClassesForUI,
    getClassDetailsForUI,
  };
} 
