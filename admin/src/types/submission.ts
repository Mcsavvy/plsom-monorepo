// Submission API Response Types
export interface SubmissionListResponse {
  id: number;
  test: number;
  student: number;
  attempt_number: number;
  status: 'in_progress' | 'submitted' | 'graded' | 'returned';
  started_at: string;
  submitted_at: string | null;
  time_spent_minutes: number | null;
  score: string;
  max_score: string;
  graded_by: number | null;
  graded_at: string | null;
  feedback: string;
  created_at: string;
  updated_at: string;
  answers: SubmissionAnswerResponse[];
  is_submitted: boolean;
  completion_percentage: number;
  student_name: string;
  student_email: string;
  test_title: string;
  test_total_points: number;
  graded_by_name: string;
}

export interface QuestionOptionResponse {
  id: string;
  text: string;
  order: number;
  is_correct: boolean;
}

export interface SubmissionAnswerResponse {
  id: number;
  question: string;
  text_answer: string;
  boolean_answer: boolean | null;
  date_answer: string | null;
  file_answer: string | null;
  selected_options: string[];
  answered_at: string;
  is_flagged: boolean;
  points_earned: number | null;
  max_points: number;
  feedback: string;
  display_answer: string;
  has_answer: boolean;
  question_title: string;
  question_type: string;
  question_description: string;
  question_options: QuestionOptionResponse[];
}

export interface SubmissionGradeRequest {
  answers: {
    answer_id: string;
    points_earned: number;
    feedback?: string;
    is_flagged?: boolean;
  }[];
  feedback?: string;
  return?: boolean;
}

// Transformed Types for Frontend
export interface QuestionOption {
  id: string;
  text: string;
  order: number;
  isCorrect: boolean;
}

export interface SubmissionAnswer {
  id: number;
  question: string;
  textAnswer: string;
  booleanAnswer: boolean | null;
  dateAnswer: string | null;
  fileAnswer: string | null;
  selectedOptions: string[];
  answeredAt: string;
  isFlagged: boolean;
  pointsEarned: number | null;
  maxPoints: number;
  feedback: string;
  displayAnswer: string;
  hasAnswer: boolean;
  questionTitle: string;
  questionType: string;
  questionDescription: string;
  questionOptions: QuestionOption[];
}

export interface Submission {
  id: number;
  test: number;
  student: number;
  attemptNumber: number;
  status: 'in_progress' | 'submitted' | 'graded' | 'returned';
  startedAt: string;
  submittedAt: string | null;
  timeSpentMinutes: number | null;
  score: string;
  maxScore: string;
  gradedBy: number | null;
  gradedAt: string | null;
  feedback: string;
  createdAt: string;
  updatedAt: string;
  answers: SubmissionAnswer[];
  isSubmitted: boolean;
  completionPercentage: number;
  studentName: string;
  studentEmail: string;
  testTitle: string;
  testTotalPoints: number;
  gradedByName: string;
}

export interface SubmissionListItem {
  id: number;
  test: number;
  student: number;
  attemptNumber: number;
  status: 'in_progress' | 'submitted' | 'graded' | 'returned';
  startedAt: string;
  submittedAt: string | null;
  timeSpentMinutes: number | null;
  score: string;
  maxScore: string;
  gradedBy: number | null;
  gradedAt: string | null;
  feedback: string;
  createdAt: string;
  updatedAt: string;
  isSubmitted: boolean;
  completionPercentage: number;
  studentName: string;
  studentEmail: string;
  testTitle: string;
  testTotalPoints: number;
  gradedByName: string;
}

export interface SubmissionDetail extends Submission {
  // Same as Submission for now, but can be extended if needed
}

export interface SubmissionStatistics {
  totalSubmissions: number;
  gradedSubmissions: number;
  pendingSubmissions: number;
  averageScore: number;
  averageCompletionTime: number;
}
