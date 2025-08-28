"use client";

import { useCallback } from "react";
import { useClient } from "./axios";
import {
  Course,
  CoursesList,
  MyCoursesResponse,
  courseSchema,
  coursesListSchema,
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
      // If the API returns a message, we'll return empty array for now
      // This should be updated when the proper endpoint is available
      if (response.data.message) {
        console.warn("Courses endpoint returned message:", response.data.message);
        return []; // Return empty array until proper endpoint is available
      }
      // If it returns actual courses data, parse it
      const courses = coursesListSchema.parse(response.data);
      return courses;
    }
    throw new Error("Failed to fetch courses");
  } catch (error) {
    // Return mock data for development/demo purposes
    console.warn("Using mock course data for development");
    return getMockCourses();
  }
}

/**
 * Mock courses data for development/demo purposes
 */
function getMockCourses(): CoursesList {
  return [
    {
      id: 1,
      name: "Biblical Interpretation",
      program_type: "certificate",
      module_count: 8,
      description: "Learn the principles and methods of biblical hermeneutics, including historical context, literary analysis, and theological interpretation.",
      lecturer_name: "Dr. Caleb Stone",
      is_active: true,
      total_classes_in_my_cohorts: 16,
      upcoming_classes_in_my_cohorts: 5,
      next_class_in_my_cohorts: {
        id: "101",
        title: "Introduction to Hermeneutics",
        scheduled_at: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(),
        meeting_link: "https://zoom.us/j/123456789",
      },
      has_classes_in_my_cohorts: true,
    },
    {
      id: 2,
      name: "Systematic Theology",
      program_type: "diploma",
      module_count: 12,
      description: "A comprehensive study of Christian doctrine, covering fundamental beliefs and theological frameworks.",
      lecturer_name: "Prof. Miriam Hayes",
      is_active: true,
      total_classes_in_my_cohorts: 24,
      upcoming_classes_in_my_cohorts: 8,
      next_class_in_my_cohorts: {
        id: "201",
        title: "The Doctrine of God",
        scheduled_at: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000).toISOString(),
        meeting_link: "https://zoom.us/j/987654321",
      },
      has_classes_in_my_cohorts: true,
    },
    {
      id: 3,
      name: "Ministry Leadership",
      program_type: "certificate",
      module_count: 6,
      description: "Develop essential leadership skills for effective ministry, including team building, vision casting, and conflict resolution.",
      lecturer_name: "Dr. Elizabeth Carter",
      is_active: true,
      total_classes_in_my_cohorts: 12,
      upcoming_classes_in_my_cohorts: 3,
      next_class_in_my_cohorts: null,
      has_classes_in_my_cohorts: true,
    },
    {
      id: 4,
      name: "Church History",
      program_type: "diploma",
      module_count: 10,
      description: "Explore the development of Christianity from the apostolic age to the modern era, including key figures and movements.",
      lecturer_name: "Dr. Michael Thompson",
      is_active: false,
      total_classes_in_my_cohorts: 20,
      upcoming_classes_in_my_cohorts: 0,
      next_class_in_my_cohorts: null,
      has_classes_in_my_cohorts: true,
    },
  ];
}

/**
 * Get detailed information about a specific course for the current student
 */
async function _getCourseDetails(
  client: ReturnType<typeof useClient>,
  courseId: number
): Promise<Course> {
  try {
    const response = await client.get<Course>(`/courses/${courseId}/my-course/`);
    if (response.status === 200) {
      const course = courseSchema.parse(response.data);
      return course;
    }
    throw new Error("Failed to fetch course details");
  } catch (error) {
    // Return mock data for development/demo purposes
    console.warn("Using mock course detail data for development");
    const mockCourses = getMockCourses();
    const course = mockCourses.find(c => c.id === courseId);
    if (!course) {
      throw new Error("Course not found");
    }
    return course;
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
