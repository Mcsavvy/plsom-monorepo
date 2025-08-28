import { z } from "zod";

// Test submission schemas
export const submissionSchema = z.object({
  id: z.number(),
  test: z.number(),
  attempt_number: z.number().min(0),
  status: z.enum(["in_progress", "submitted", "graded", "returned"]),
  started_at: z.string(),
  submitted_at: z.string().nullable(),
  score: z.number().nullable(),
  max_score: z.number().nullable(),
  completion_percentage: z.string(),
  time_spent_minutes: z.number().min(0).nullable(),
});

// Question option schema
export const questionOptionSchema = z.object({
  id: z.string().uuid(),
  text: z.string().max(300),
  order: z.number(),
  is_correct: z.boolean(),
});

// Question types enum
export const questionTypeSchema = z.enum([
  "text",
  "essay",
  "yes_no",
  "single_choice",
  "multiple_choice",
  "scripture_reference",
  "document_upload",
  "reflection",
  "ministry_plan",
  "theological_position",
  "case_study",
  "sermon_outline"
]);

// Test question schema
export const testQuestionSchema = z.object({
  id: z.string().uuid(),
  question_type: questionTypeSchema,
  title: z.string().max(500),
  description: z.string(),
  is_required: z.boolean(),
  order: z.number(),
  max_file_size_mb: z.number().min(0).optional(),
  allowed_file_types: z.string().max(200).optional(),
  required_translation: z.string().max(50).optional(),
  allow_multiple_verses: z.boolean().optional(),
  min_word_count: z.number().min(0).nullable().optional(),
  max_word_count: z.number().min(0).nullable().optional(),
  text_max_length: z.number().min(0).nullable().optional(),
  text_placeholder: z.string().max(200).optional(),
  options: z.array(questionOptionSchema).optional(),
});

// Test schema (detailed view with questions)
export const testDetailSchema = z.object({
  id: z.number(),
  title: z.string().max(200),
  description: z.string(),
  instructions: z.string(),
  time_limit_minutes: z.number().min(0).nullable(),
  max_attempts: z.number().min(1).max(10),
  allow_review_after_submission: z.boolean(),
  status: z.enum(["draft", "published", "archived"]),
  available_from: z.string().nullable(),
  available_until: z.string().nullable(),
  is_available: z.string(),
  course_name: z.string(),
  cohort_name: z.string(),
  created_by_name: z.string(),
  total_questions: z.string(),
  my_submission: submissionSchema.nullable(),
  my_latest_submission_id: z.number(),
  my_submission_status: z.string(),
  attempts_remaining: z.number(),
  can_attempt: z.boolean(),
  created_at: z.string(),
  updated_at: z.string(),
  questions: z.array(testQuestionSchema),
});

// Test schema (list view without questions)
export const testListItemSchema = testDetailSchema.omit({ questions: true });

// Paginated tests response
export const paginatedTestsResponseSchema = z.object({
  count: z.number(),
  next: z.string().nullable(),
  previous: z.string().nullable(),
  results: z.array(testListItemSchema),
});

// Query parameters for tests
export const testsQuerySchema = z.object({
  ordering: z.string().optional(),
  page: z.number().optional(),
  page_size: z.number().optional(),
  search: z.string().optional(),
});

// Answer schemas for different question types
export const textAnswerSchema = z.object({
  question_id: z.string().uuid(),
  text_answer: z.string(),
});

export const choiceAnswerSchema = z.object({
  question_id: z.string().uuid(),
  selected_options: z.array(z.string().uuid()),
});

export const fileAnswerSchema = z.object({
  question_id: z.string().uuid(),
  file_upload: z.instanceof(File).optional(),
  file_url: z.string().optional(),
});

export const scriptureAnswerSchema = z.object({
  question_id: z.string().uuid(),
  scripture_references: z.array(z.object({
    book: z.string(),
    chapter: z.number(),
    verse_start: z.number(),
    verse_end: z.number().optional(),
    translation: z.string(),
  })),
});

// Union type for all answer types
export const answerSchema = z.union([
  textAnswerSchema,
  choiceAnswerSchema,
  fileAnswerSchema,
  scriptureAnswerSchema,
]);

// Type exports
export type Submission = z.infer<typeof submissionSchema>;
export type QuestionOption = z.infer<typeof questionOptionSchema>;
export type QuestionType = z.infer<typeof questionTypeSchema>;
export type TestQuestion = z.infer<typeof testQuestionSchema>;
export type TestDetail = z.infer<typeof testDetailSchema>;
export type TestListItem = z.infer<typeof testListItemSchema>;
export type PaginatedTestsResponse = z.infer<typeof paginatedTestsResponseSchema>;
export type TestsQuery = z.infer<typeof testsQuerySchema>;
export type Answer = z.infer<typeof answerSchema>;
export type TextAnswer = z.infer<typeof textAnswerSchema>;
export type ChoiceAnswer = z.infer<typeof choiceAnswerSchema>;
export type FileAnswer = z.infer<typeof fileAnswerSchema>;
export type ScriptureAnswer = z.infer<typeof scriptureAnswerSchema>;

// UI helper types
export interface TestCardData {
  id: number;
  title: string;
  description: string;
  courseName: string;
  cohortName: string;
  createdByName: string;
  totalQuestions: number;
  timeLimit: number | null;
  maxAttempts: number;
  attemptsRemaining: number;
  canAttempt: boolean;
  isAvailable: boolean;
  availableFrom: Date | null;
  availableUntil: Date | null;
  mySubmission: Submission | null;
  submissionStatus: string;
  status: "not_started" | "in_progress" | "submitted" | "graded" | "overdue";
  color: string;
  textColor: string;
}

// Question type metadata for UI
export interface QuestionTypeInfo {
  label: string;
  description: string;
  icon: string;
  requiresOptions: boolean;
  supportedAnswerTypes: string[];
}

export const questionTypeInfo: Record<QuestionType, QuestionTypeInfo> = {
  text: {
    label: "Short Answer",
    description: "Brief text response",
    icon: "Type",
    requiresOptions: false,
    supportedAnswerTypes: ["text"],
  },
  essay: {
    label: "Essay",
    description: "Long-form written response",
    icon: "FileText",
    requiresOptions: false,
    supportedAnswerTypes: ["text"],
  },
  yes_no: {
    label: "Yes/No",
    description: "Binary choice question",
    icon: "ToggleLeft",
    requiresOptions: false,
    supportedAnswerTypes: ["choice"],
  },
  single_choice: {
    label: "Single Choice",
    description: "Choose one option",
    icon: "Circle",
    requiresOptions: true,
    supportedAnswerTypes: ["choice"],
  },
  multiple_choice: {
    label: "Multiple Choice",
    description: "Choose multiple options",
    icon: "Square",
    requiresOptions: true,
    supportedAnswerTypes: ["choice"],
  },
  scripture_reference: {
    label: "Scripture Reference",
    description: "Bible verse citation",
    icon: "Book",
    requiresOptions: false,
    supportedAnswerTypes: ["scripture"],
  },
  document_upload: {
    label: "Document Upload",
    description: "File attachment",
    icon: "Upload",
    requiresOptions: false,
    supportedAnswerTypes: ["file"],
  },
  reflection: {
    label: "Spiritual Reflection",
    description: "Personal spiritual insight",
    icon: "Heart",
    requiresOptions: false,
    supportedAnswerTypes: ["text"],
  },
  ministry_plan: {
    label: "Ministry Plan",
    description: "Strategic ministry planning",
    icon: "MapPin",
    requiresOptions: false,
    supportedAnswerTypes: ["text"],
  },
  theological_position: {
    label: "Theological Position",
    description: "Doctrinal stance explanation",
    icon: "Compass",
    requiresOptions: false,
    supportedAnswerTypes: ["text"],
  },
  case_study: {
    label: "Ministry Case Study",
    description: "Practical ministry scenario",
    icon: "Users",
    requiresOptions: false,
    supportedAnswerTypes: ["text"],
  },
  sermon_outline: {
    label: "Sermon Outline",
    description: "Preaching structure",
    icon: "List",
    requiresOptions: false,
    supportedAnswerTypes: ["text"],
  },
};

// Helper functions
export function transformTestToCardData(test: TestListItem): TestCardData {
  const now = new Date();
  const availableFrom = test.available_from ? new Date(test.available_from) : null;
  const availableUntil = test.available_until ? new Date(test.available_until) : null;
  
  // Determine status
  let status: TestCardData["status"] = "not_started";
  if (test.my_submission) {
    switch (test.my_submission.status) {
      case "in_progress":
        status = "in_progress";
        break;
      case "submitted":
        status = "submitted";
        break;
      case "graded":
      case "returned":
        status = "graded";
        break;
    }
  } else if (availableUntil && now > availableUntil) {
    status = "overdue";
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
  
  const colorIndex = test.course_name.length % colors.length;
  const selectedColor = colors[colorIndex];

  return {
    id: test.id,
    title: test.title,
    description: test.description,
    courseName: test.course_name,
    cohortName: test.cohort_name,
    createdByName: test.created_by_name,
    totalQuestions: parseInt(test.total_questions),
    timeLimit: test.time_limit_minutes,
    maxAttempts: test.max_attempts,
    attemptsRemaining: test.attempts_remaining,
    canAttempt: test.can_attempt,
    isAvailable: test.is_available === "true",
    availableFrom,
    availableUntil,
    mySubmission: test.my_submission,
    submissionStatus: test.my_submission_status,
    status,
    color: selectedColor.bg,
    textColor: selectedColor.text,
  };
}

// Helper function to format time limit
export function formatTimeLimit(minutes: number | null): string {
  if (!minutes) return "No time limit";
  
  if (minutes < 60) {
    return `${minutes} minutes`;
  }
  
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  
  if (remainingMinutes === 0) {
    return `${hours} hour${hours > 1 ? 's' : ''}`;
  }
  
  return `${hours}h ${remainingMinutes}m`;
}

// Helper function to get status color
export function getStatusColor(status: TestCardData["status"]): string {
  switch (status) {
    case "not_started":
      return "bg-gray-100 text-gray-800";
    case "in_progress":
      return "bg-yellow-100 text-yellow-800";
    case "submitted":
      return "bg-blue-100 text-blue-800";
    case "graded":
      return "bg-green-100 text-green-800";
    case "overdue":
      return "bg-red-100 text-red-800";
    default:
      return "bg-gray-100 text-gray-800";
  }
}

// Helper function to get status text
export function getStatusText(status: TestCardData["status"]): string {
  switch (status) {
    case "not_started":
      return "Not Started";
    case "in_progress":
      return "In Progress";
    case "submitted":
      return "Submitted";
    case "graded":
      return "Graded";
    case "overdue":
      return "Overdue";
    default:
      return "Unknown";
  }
}
