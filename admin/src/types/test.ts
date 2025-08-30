// Test API Response Types
export interface TestListResponse {
  id: number;
  title: string;
  description: string;
  status: 'draft' | 'published' | 'archived';
  available_from: string | null;
  available_until: string | null;
  created_at: string;
  updated_at: string;
  total_questions: number;
  total_submissions: number;
  is_available: boolean;
  course_name: string;
  cohort_name: string;
  created_by_name: string;
  time_limit_minutes: number | null;
  max_attempts: number;
}

export type QuestionT =
  | 'text'
  | 'essay'
  | 'yes_no'
  | 'single_choice'
  | 'multiple_choice'
  | 'scripture_reference'
  | 'document_upload'
  | 'reflection'
  | 'ministry_plan'
  | 'theological_position'
  | 'case_study'
  | 'sermon_outline';

export interface QuestionOptionResponse {
  id: string;
  text: string;
  order: number;
  is_correct: boolean;
}

export interface QuestionResponse {
  id: string;
  question_type: QuestionT;
  title: string;
  description: string;
  is_required: boolean;
  order: number;
  max_file_size_mb?: number;
  allowed_file_types?: string;
  required_translation?: string;
  allow_multiple_verses?: boolean;
  min_word_count?: number | null;
  max_word_count?: number | null;
  text_max_length?: number | null;
  text_placeholder?: string;
  options: QuestionOptionResponse[];
}

export interface TestDetailResponse {
  id: number;
  title: string;
  description: string;
  instructions: string;
  course: number;
  course_name: string;
  cohort: number;
  cohort_name: string;
  created_by: number;
  time_limit_minutes: number | null;
  max_attempts: number;
  allow_review_after_submission: boolean;
  randomize_questions: boolean;
  status: 'draft' | 'published' | 'archived';
  available_from: string | null;
  available_until: string | null;
  created_at: string;
  updated_at: string;
  questions: QuestionResponse[];
  total_questions: number;
  total_submissions: number;
  is_available: boolean;
}

export interface TestStatisticsResponse {
  total_questions: number;
  total_submissions: number;
  completed_submissions: number;
  average_completion_time: number;
  average_score: number;
  is_available: boolean;
}

// Transformed Types for Frontend
export interface QuestionOption {
  id: string;
  text: string;
  order: number;
  isCorrect: boolean;
}

export interface Question {
  id: string;
  questionType: QuestionT;
  title: string;
  description: string;
  isRequired: boolean;
  order: number;
  maxFileSizeMb?: number;
  allowedFileTypes?: string;
  requiredTranslation?: string;
  allowMultipleVerses?: boolean;
  minWordCount?: number | null;
  maxWordCount?: number | null;
  textMaxLength?: number | null;
  textPlaceholder?: string;
  options: QuestionOption[];
}

export interface TestListItem {
  id: number;
  title: string;
  description: string;
  status: 'draft' | 'published' | 'archived';
  statusText: string;
  statusColor: string;
  availableFrom: string | null;
  availableUntil: string | null;
  createdAt: string;
  updatedAt: string;
  totalQuestions: number;
  totalSubmissions: number;
  isAvailable: boolean;
  courseName: string;
  cohortName: string;
  createdByName: string;
  timeLimitMinutes: number | null;
  maxAttempts: number;
  formattedTimeLimit: string;
  formattedAvailability: string;
}

export interface TestDetail {
  id: number;
  title: string;
  description: string;
  instructions: string;
  course: number;
  courseName: string;
  cohort: number;
  cohortName: string;
  createdBy: number;
  timeLimitMinutes: number | null;
  maxAttempts: number;
  allowReviewAfterSubmission: boolean;
  randomizeQuestions: boolean;
  status: 'draft' | 'published' | 'archived';
  statusText: string;
  statusColor: string;
  availableFrom: string | null;
  availableUntil: string | null;
  createdAt: string;
  updatedAt: string;
  questions: Question[];
  totalQuestions: number;
  totalSubmissions: number;
  isAvailable: boolean;
  formattedTimeLimit: string;
  formattedAvailability: string;
  hasSubmissions: boolean;
}

export interface TestStatistics {
  totalQuestions: number;
  totalSubmissions: number;
  completedSubmissions: number;
  averageCompletionTime: number;
  averageScore: number;
  isAvailable: boolean;
  completionRate: number;
  formattedAverageTime: string;
}

// Form Types
export interface TestFormData {
  title: string;
  description: string;
  instructions: string;
  course: number;
  cohort: number;
  time_limit_minutes?: number;
  max_attempts: number;
  allow_review_after_submission: boolean;
  randomize_questions: boolean;
  status: 'draft' | 'published' | 'archived';
  available_from?: string;
  available_from_timezone?: string;
  available_until?: string;
  available_until_timezone?: string;
  questions: QuestionFormData[];
}

export interface QuestionFormData {
  id?: string;
  question_type: QuestionT;
  title: string;
  description: string;
  is_required: boolean;
  max_file_size_mb?: number;
  allowed_file_types?: string;
  required_translation?: string;
  allow_multiple_verses?: boolean;
  min_word_count?: number;
  max_word_count?: number;
  text_max_length?: number;
  text_placeholder?: string;
  options: QuestionOptionFormData[];
}

export interface QuestionOptionFormData {
  id?: string;
  text: string;
  is_correct: boolean;
}

export type QuestionType = {
  value: string;
  label: string;
  description: string;
  hasOptions: boolean;
  hasWordCount: boolean;
  hasFileUpload: boolean;
  hasScriptureReference: boolean;
};

export const QUESTION_TYPES: QuestionType[] = [
  {
    value: 'text',
    label: 'Short Answer',
    description: 'Single line text input',
    hasOptions: false,
    hasWordCount: false,
    hasFileUpload: false,
    hasScriptureReference: false,
  },
  {
    value: 'essay',
    label: 'Essay/Long Response',
    description: 'Multi-line text input with word count',
    hasOptions: false,
    hasWordCount: true,
    hasFileUpload: false,
    hasScriptureReference: false,
  },
  {
    value: 'yes_no',
    label: 'Yes/No',
    description: 'Simple yes or no response',
    hasOptions: false,
    hasWordCount: false,
    hasFileUpload: false,
    hasScriptureReference: false,
  },
  {
    value: 'single_choice',
    label: 'Single Choice',
    description: 'Choose one option from multiple choices',
    hasOptions: true,
    hasWordCount: false,
    hasFileUpload: false,
    hasScriptureReference: false,
  },
  {
    value: 'multiple_choice',
    label: 'Multiple Choice',
    description: 'Choose multiple options from choices',
    hasOptions: true,
    hasWordCount: false,
    hasFileUpload: false,
    hasScriptureReference: false,
  },
  {
    value: 'scripture_reference',
    label: 'Scripture Reference',
    description: 'Bible verse reference input',
    hasOptions: false,
    hasWordCount: false,
    hasFileUpload: false,
    hasScriptureReference: true,
  },
  {
    value: 'document_upload',
    label: 'Document Upload',
    description: 'File upload for documents',
    hasOptions: false,
    hasWordCount: false,
    hasFileUpload: true,
    hasScriptureReference: false,
  },
  {
    value: 'reflection',
    label: 'Spiritual Reflection',
    description: 'Long-form spiritual reflection',
    hasOptions: false,
    hasWordCount: true,
    hasFileUpload: false,
    hasScriptureReference: false,
  },
  {
    value: 'ministry_plan',
    label: 'Ministry Plan',
    description: 'Ministry planning response',
    hasOptions: false,
    hasWordCount: true,
    hasFileUpload: false,
    hasScriptureReference: false,
  },
  {
    value: 'theological_position',
    label: 'Theological Position',
    description: 'Theological position paper',
    hasOptions: false,
    hasWordCount: true,
    hasFileUpload: false,
    hasScriptureReference: false,
  },
  {
    value: 'case_study',
    label: 'Ministry Case Study',
    description: 'Case study analysis',
    hasOptions: false,
    hasWordCount: true,
    hasFileUpload: false,
    hasScriptureReference: false,
  },
  {
    value: 'sermon_outline',
    label: 'Sermon Outline',
    description: 'Sermon structure and outline',
    hasOptions: false,
    hasWordCount: true,
    hasFileUpload: false,
    hasScriptureReference: false,
  },
];
