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
    const response = await client.get<ClassesList>(url);
    
    if (response.status === 200) {
      const classes = classesListSchema.parse(response.data);
      return classes;
    }
    throw new Error("Failed to fetch classes");
  } catch (error) {
    // Return mock data for development/demo purposes
    console.warn("Using mock classes data for development");
    return getMockClasses();
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
    // Return mock data for development/demo purposes
    console.warn("Using mock class detail data for development");
    const mockClasses = getMockClasses();
    const classData = mockClasses.find(c => c.id === classId);
    if (!classData) {
      throw new Error("Class not found");
    }
    return classData;
  }
}

/**
 * Mock classes data for development/demo purposes
 */
function getMockClasses(): ClassesList {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  
  return [
    {
      id: 1,
      course_name: "Biblical Interpretation",
      lecturer_name: "Dr. Caleb Stone",
      title: "Introduction to Hermeneutics",
      description: "Learn the basic principles of biblical interpretation and hermeneutical methods.",
      scheduled_at: new Date(today.getTime() + 2 * 24 * 60 * 60 * 1000 + 10 * 60 * 60 * 1000).toISOString(), // 2 days from now at 10 AM
      duration_minutes: 90,
      zoom_join_url: "https://zoom.us/j/123456789",
      recording_url: null,
      password_for_recording: null,
      can_join: true,
      my_attendance: null,
    },
    {
      id: 2,
      course_name: "Systematic Theology",
      lecturer_name: "Prof. Miriam Hayes",
      title: "The Doctrine of God",
      description: "Exploring the nature and attributes of God from a systematic theological perspective.",
      scheduled_at: new Date(today.getTime() + 1 * 24 * 60 * 60 * 1000 + 14 * 60 * 60 * 1000).toISOString(), // Tomorrow at 2 PM
      duration_minutes: 120,
      zoom_join_url: "https://zoom.us/j/987654321",
      recording_url: "https://example.com/recording1",
      password_for_recording: "theology123",
      can_join: true,
      my_attendance: {
        id: 1,
        class_session: 2,
        student: 1,
        join_time: new Date(today.getTime() + 1 * 24 * 60 * 60 * 1000 + 14 * 60 * 60 * 1000).toISOString(),
        leave_time: new Date(today.getTime() + 1 * 24 * 60 * 60 * 1000 + 16 * 60 * 60 * 1000).toISOString(),
        duration_minutes: 120,
        via_recording: false,
      },
    },
    {
      id: 3,
      course_name: "Ministry Leadership",
      lecturer_name: "Dr. Elizabeth Carter",
      title: "Team Building in Ministry",
      description: "Practical strategies for building and leading effective ministry teams.",
      scheduled_at: new Date(today.getTime() + 3 * 24 * 60 * 60 * 1000 + 9 * 60 * 60 * 1000).toISOString(), // 3 days from now at 9 AM
      duration_minutes: 75,
      zoom_join_url: "https://zoom.us/j/456789123",
      recording_url: null,
      password_for_recording: null,
      can_join: true,
      my_attendance: null,
    },
    {
      id: 4,
      course_name: "Church History",
      lecturer_name: "Dr. Michael Thompson",
      title: "The Reformation Period",
      description: "Study of the Protestant Reformation and its impact on Christianity.",
      scheduled_at: new Date(today.getTime() - 2 * 24 * 60 * 60 * 1000 + 15 * 60 * 60 * 1000).toISOString(), // 2 days ago at 3 PM
      duration_minutes: 90,
      zoom_join_url: null,
      recording_url: "https://example.com/recording2",
      password_for_recording: "history456",
      can_join: false,
      my_attendance: {
        id: 2,
        class_session: 4,
        student: 1,
        join_time: new Date(today.getTime() - 2 * 24 * 60 * 60 * 1000 + 15 * 60 * 60 * 1000).toISOString(),
        leave_time: new Date(today.getTime() - 2 * 24 * 60 * 60 * 1000 + 16.5 * 60 * 60 * 1000).toISOString(),
        duration_minutes: 90,
        via_recording: false,
      },
    },
    {
      id: 5,
      course_name: "Biblical Interpretation",
      lecturer_name: "Dr. Caleb Stone",
      title: "Historical-Critical Method",
      description: "Understanding the historical and cultural context of biblical texts.",
      scheduled_at: new Date(today.getTime() - 1 * 24 * 60 * 60 * 1000 + 11 * 60 * 60 * 1000).toISOString(), // Yesterday at 11 AM
      duration_minutes: 90,
      zoom_join_url: null,
      recording_url: "https://example.com/recording3",
      password_for_recording: "bible789",
      can_join: false,
      my_attendance: null, // Missed class
    },
    {
      id: 6,
      course_name: "Systematic Theology",
      lecturer_name: "Prof. Miriam Hayes",
      title: "Christology",
      description: "The study of the person and work of Jesus Christ.",
      scheduled_at: new Date(today.getTime() + 5 * 24 * 60 * 60 * 1000 + 13 * 60 * 60 * 1000).toISOString(), // 5 days from now at 1 PM
      duration_minutes: 120,
      zoom_join_url: "https://zoom.us/j/789123456",
      recording_url: null,
      password_for_recording: null,
      can_join: true,
      my_attendance: null,
    },
  ];
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
