import { z } from "zod";

// Course schemas based on the OpenAPI specification
export const courseSchema = z.object({
  id: z.number(),
  name: z.string().max(200),
  program_type: z.enum(["certificate", "diploma"]),
  module_count: z.number().min(0),
  description: z.string(),
  lecturer_name: z.string().nullable(),
  is_active: z.boolean(),
  total_classes_in_my_cohorts: z.number(),
  upcoming_classes_in_my_cohorts: z.number(),
  next_class_in_my_cohorts: z.record(z.string(), z.any()).nullable(),
  has_classes_in_my_cohorts: z.boolean(),
});

export const coursesListSchema = z.array(courseSchema);

// Paginated response schema
export const paginatedCoursesResponseSchema = z.object({
  count: z.number(),
  next: z.string().nullable(),
  previous: z.string().nullable(),
  results: coursesListSchema,
});

// Next class details schema (for when next_class_in_my_cohorts has data)
export const nextClassSchema = z
  .object({
    id: z.number(),
    title: z.string(),
    description: z.string().optional(),
    scheduled_at: z.string(),
    meeting_link: z.string().url().optional(),
    course_name: z.string().optional(),
  })
  .nullable();

// Enhanced course schema with parsed next class
export const enhancedCourseSchema = courseSchema.extend({
  next_class_in_my_cohorts: nextClassSchema,
});

// Course list response (for my-courses endpoint)
export const myCoursesResponseSchema = z.object({
  message: z.string(),
});

export type Course = z.infer<typeof courseSchema>;
export type CoursesList = z.infer<typeof coursesListSchema>;
export type PaginatedCoursesResponse = z.infer<
  typeof paginatedCoursesResponseSchema
>;
export type NextClass = z.infer<typeof nextClassSchema>;
export type EnhancedCourse = z.infer<typeof enhancedCourseSchema>;
export type MyCoursesResponse = z.infer<typeof myCoursesResponseSchema>;

// Additional types for UI components
export interface CourseCardData {
  id: number;
  title: string;
  instructor: string;
  programType: "certificate" | "diploma";
  moduleCount: number;
  description: string;
  isActive: boolean;
  hasClasses: boolean;
  totalClasses: number;
  upcomingClasses: number;
  nextClass: NextClass;
  color: string;
  textColor: string;
}

// Helper function to transform Course to CourseCardData
export function transformCourseToCardData(course: Course): CourseCardData {
  // Generate color based on course ID for consistency
  const colors = [
    { bg: "bg-blue-100", text: "text-blue-800" },
    { bg: "bg-green-100", text: "text-green-800" },
    { bg: "bg-purple-100", text: "text-purple-800" },
    { bg: "bg-orange-100", text: "text-orange-800" },
    { bg: "bg-pink-100", text: "text-pink-800" },
    { bg: "bg-indigo-100", text: "text-indigo-800" },
  ];

  const colorIndex = course.id % colors.length;
  const selectedColor = colors[colorIndex];

  return {
    id: course.id,
    title: course.name,
    instructor: course.lecturer_name || "No lecturer assigned",
    programType: course.program_type,
    moduleCount: course.module_count,
    description: course.description,
    isActive: course.is_active,
    hasClasses: course.has_classes_in_my_cohorts,
    totalClasses: course.total_classes_in_my_cohorts,
    upcomingClasses: course.upcoming_classes_in_my_cohorts,
    nextClass: course.next_class_in_my_cohorts as NextClass,
    color: selectedColor.bg,
    textColor: selectedColor.text,
  };
}
