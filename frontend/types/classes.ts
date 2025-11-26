import { z } from "zod";

// Class schemas based on the OpenAPI specification
export const classAttendanceSchema = z.object({
  id: z.number(),
  class_session: z.number(),
  student: z.number(),
  join_time: z.string(),
  leave_time: z.string().nullable(),
  duration_minutes: z.number().min(0),
  via_recording: z.boolean(),
});

export const classSchema = z.object({
  id: z.number(),
  course_name: z.string(),
  lecturer_name: z.preprocess(
    (val) => val === undefined ? null : val,
    z.string().nullable()
  ),
  title: z.string().max(200),
  description: z.string(),
  scheduled_at: z.string(),
  duration_minutes: z.number().min(0),
  zoom_join_url: z.string().url().nullable(),
  recording_url: z.string().url().nullable(),
  password_for_recording: z.string().nullable(),
  can_join: z.boolean(),
  my_attendance: classAttendanceSchema.nullable(),
});

export const classesListSchema = z.array(classSchema);

// Paginated response schema
export const paginatedClassesResponseSchema = z.object({
  count: z.number(),
  next: z.string().nullable(),
  previous: z.string().nullable(),
  results: classesListSchema,
});

// Time filter options
export const timeFilterSchema = z.enum(["past", "upcoming"]);
export type TimeFilter = z.infer<typeof timeFilterSchema>;

// Query parameters for classes
export const classesQuerySchema = z.object({
  ordering: z.string().optional(),
  page: z.number().optional(),
  page_size: z.number().optional(),
  search: z.string().optional(),
  time_filter: timeFilterSchema.optional(),
});

export type Class = z.infer<typeof classSchema>;
export type ClassesList = z.infer<typeof classesListSchema>;
export type ClassAttendance = z.infer<typeof classAttendanceSchema>;
export type PaginatedClassesResponse = z.infer<typeof paginatedClassesResponseSchema>;
export type ClassesQuery = z.infer<typeof classesQuerySchema>;

// Additional types for UI components
export interface ClassCardData {
  id: number;
  title: string;
  courseName: string;
  lecturerName: string;
  description: string;
  scheduledAt: Date;
  durationMinutes: number;
  zoomJoinUrl: string | null;
  recordingUrl: string | null;
  passwordForRecording: string | null;
  canJoin: boolean;
  myAttendance: ClassAttendance | null;
  isPast: boolean;
  isToday: boolean;
  isUpcoming: boolean;
  status: "upcoming" | "ongoing" | "completed" | "missed";
  color: string;
  textColor: string;
}

// Calendar day interface
export interface CalendarDay {
  date: Date;
  classes: ClassCardData[];
  isToday: boolean;
  isCurrentMonth: boolean;
}

// Helper function to transform Class to ClassCardData
export function transformClassToCardData(classData: Class): ClassCardData {
  const scheduledAt = new Date(classData.scheduled_at);
  const now = new Date();
  const endTime = new Date(scheduledAt.getTime() + classData.duration_minutes * 60000);
  
  // Determine status
  let status: ClassCardData["status"] = "upcoming";
  if (now > endTime) {
    status = classData.my_attendance ? "completed" : "missed";
  } else if (now >= scheduledAt && now <= endTime) {
    status = "ongoing";
  }

  // Generate color based on course name for consistency
  const colors = [
    { bg: "bg-blue-100", text: "text-blue-800" },
    { bg: "bg-green-100", text: "text-green-800" },
    { bg: "bg-purple-100", text: "text-purple-800" },
    { bg: "bg-orange-100", text: "text-orange-800" },
    { bg: "bg-pink-100", text: "text-pink-800" },
    { bg: "bg-indigo-100", text: "text-indigo-800" },
  ];
  
  const colorIndex = classData.course_name.length % colors.length;
  const selectedColor = colors[colorIndex];

  return {
    id: classData.id,
    title: classData.title,
    courseName: classData.course_name,
    lecturerName: classData.lecturer_name ?? "TBA",
    description: classData.description,
    scheduledAt,
    durationMinutes: classData.duration_minutes,
    zoomJoinUrl: classData.zoom_join_url,
    recordingUrl: classData.recording_url,
    passwordForRecording: classData.password_for_recording,
    canJoin: classData.can_join,
    myAttendance: classData.my_attendance,
    isPast: now > endTime,
    isToday: scheduledAt.toDateString() === now.toDateString(),
    isUpcoming: now < scheduledAt,
    status,
    color: selectedColor.bg,
    textColor: selectedColor.text,
  };
}

// Helper function to format time
export function formatTime(date: Date): string {
  return date.toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

// Helper function to format date
export function formatDate(date: Date): string {
  return date.toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
}

// Helper function to get duration text
export function getDurationText(minutes: number): string {
  if (minutes < 60) {
    return `${minutes}m`;
  }
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  return remainingMinutes > 0 ? `${hours}h ${remainingMinutes}m` : `${hours}h`;
}
