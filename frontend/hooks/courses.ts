"use client";

import { useCallback } from "react";
import { useClient } from "./axios";
import {
  Course,
  CoursesList,
  MyCoursesResponse,
  courseSchema,
  coursesListSchema,
  paginatedCoursesResponseSchema,
  myCoursesResponseSchema,
  CourseCardData,
  transformCourseToCardData,
} from "@/types/courses";

/**
 * Get all courses for the current student
 * Note: Based on OpenAPI spec, this endpoint returns a message, not courses
 * This is a placeholder implementation that should be updated when the actual API is ready
 */
async function _getMyCourses(
  client: ReturnType<typeof useClient>
): Promise<CoursesList> {
  try {
    const response = await client.get("/courses/my-courses/");
    if (response.status === 200) {
      // Handle paginated response
      const paginatedResponse = paginatedCoursesResponseSchema.parse(
        response.data
      );
      return paginatedResponse.results;
    }
    throw new Error("Failed to fetch courses");
  } catch (error) {
    throw error;
  }
}

/**
 * Get detailed information about a specific course for the current student
 */
async function _getCourseDetails(
  client: ReturnType<typeof useClient>,
  courseId: number
): Promise<Course> {
  try {
    const response = await client.get<Course>(
      `/courses/${courseId}/my-course/`
    );
    if (response.status === 200) {
      const course = courseSchema.parse(response.data);
      return course;
    }
    throw new Error("Failed to fetch course details");
  } catch (error) {
    throw error;
  }
}

/**
 * Hook for managing course-related operations
 */
export function useCourses() {
  const client = useClient();

  /**
   * Fetch all courses for the current student
   */
  const getMyCourses = useCallback(async (): Promise<CoursesList> => {
    return await _getMyCourses(client);
  }, [client]);

  /**
   * Fetch detailed information about a specific course
   */
  const getCourseDetails = useCallback(
    async (courseId: number): Promise<Course> => {
      return await _getCourseDetails(client, courseId);
    },
    [client]
  );

  /**
   * Get courses formatted for UI components
   */
  const getMyCoursesForUI = useCallback(async (): Promise<CourseCardData[]> => {
    const courses = await getMyCourses();
    return courses.map(transformCourseToCardData);
  }, [getMyCourses]);

  /**
   * Get course details formatted for UI
   */
  const getCourseDetailsForUI = useCallback(
    async (courseId: number): Promise<CourseCardData> => {
      const course = await getCourseDetails(courseId);
      return transformCourseToCardData(course);
    },
    [getCourseDetails]
  );

  return {
    getMyCourses,
    getCourseDetails,
    getMyCoursesForUI,
    getCourseDetailsForUI,
  };
}
