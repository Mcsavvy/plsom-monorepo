// Shape of GET /students/{id}/academic-summary/ (see
// backend/apps/users/academic_summary.py for the rules behind each field).

export type AssessmentStatus =
  | 'graded'
  | 'awaiting_grading'
  | 'returned'
  | 'in_progress'
  | 'missed'
  | 'not_started'
  | 'upcoming';

export type SubmissionStatus =
  | 'in_progress'
  | 'submitted'
  | 'graded'
  | 'returned';

// ---- API (snake_case) -------------------------------------------------

export interface AttemptResponse {
  submission_id: number;
  attempt_number: number;
  status: SubmissionStatus;
  score: number | null;
  percentage: number | null;
  submitted_at: string | null;
  graded_at: string | null;
}

export interface AssessmentRowResponse {
  test_id: number;
  title: string;
  course_id: number;
  course_name: string;
  cohort_id: number;
  cohort_name: string;
  test_status: 'draft' | 'published' | 'archived';
  available_from: string | null;
  available_until: string | null;
  max_attempts: number;
  attempts_used: number;
  status: AssessmentStatus;
  score: number | null;
  max_score: number;
  percentage: number | null;
  is_low_score: boolean;
  submission_id: number | null;
  latest_submission_id: number | null;
  submitted_at: string | null;
  graded_at: string | null;
  graded_by_name: string | null;
  feedback: string;
  has_pending_attempt: boolean;
  attempts: AttemptResponse[];
}

export interface ClassRowResponse {
  class_id: number;
  title: string;
  course_id: number;
  course_name: string;
  cohort_id: number;
  cohort_name: string;
  scheduled_at: string;
  duration_minutes: number;
  attended: boolean;
  attended_via: 'live' | 'recording' | null;
  minutes_attended: number;
  verified: boolean;
}

export interface CourseRowResponse {
  course_id: number;
  course_name: string;
  tests_total: number;
  tests_graded: number;
  average_percentage: number | null;
  classes_held: number;
  classes_attended: number;
  attendance_rate: number | null;
}

export interface AcademicSummaryResponse {
  student_id: number;
  generated_at: string;
  scope: 'all' | 'lecturer';
  low_score_threshold: number;
  summary: {
    average_percentage: number | null;
    highest_percentage: number | null;
    lowest_percentage: number | null;
    tests_total: number;
    tests_due: number;
    tests_turned_in: number;
    completion_rate: number | null;
    status_counts: Record<AssessmentStatus, number>;
    low_score_count: number;
    classes_held: number;
    classes_attended: number;
    classes_attended_live: number;
    classes_attended_recording: number;
    attendance_rate: number | null;
    last_activity_at: string | null;
  };
  courses: CourseRowResponse[];
  tests: AssessmentRowResponse[];
  classes: ClassRowResponse[];
}

// ---- Frontend (camelCase) ---------------------------------------------

export interface Attempt {
  submissionId: number;
  attemptNumber: number;
  status: SubmissionStatus;
  score: number | null;
  percentage: number | null;
  submittedAt: string | null;
  gradedAt: string | null;
}

export interface AssessmentRow {
  testId: number;
  title: string;
  courseId: number;
  courseName: string;
  cohortId: number;
  cohortName: string;
  testStatus: 'draft' | 'published' | 'archived';
  availableFrom: string | null;
  availableUntil: string | null;
  maxAttempts: number;
  attemptsUsed: number;
  status: AssessmentStatus;
  score: number | null;
  maxScore: number;
  percentage: number | null;
  isLowScore: boolean;
  submissionId: number | null;
  latestSubmissionId: number | null;
  submittedAt: string | null;
  gradedAt: string | null;
  gradedByName: string | null;
  feedback: string;
  hasPendingAttempt: boolean;
  attempts: Attempt[];
}

export interface ClassRow {
  classId: number;
  title: string;
  courseId: number;
  courseName: string;
  cohortId: number;
  cohortName: string;
  scheduledAt: string;
  durationMinutes: number;
  attended: boolean;
  attendedVia: 'live' | 'recording' | null;
  minutesAttended: number;
  verified: boolean;
}

export interface CourseRow {
  courseId: number;
  courseName: string;
  testsTotal: number;
  testsGraded: number;
  averagePercentage: number | null;
  classesHeld: number;
  classesAttended: number;
  attendanceRate: number | null;
}

export interface AcademicSummary {
  studentId: number;
  generatedAt: string;
  scope: 'all' | 'lecturer';
  lowScoreThreshold: number;
  summary: {
    averagePercentage: number | null;
    highestPercentage: number | null;
    lowestPercentage: number | null;
    testsTotal: number;
    testsDue: number;
    testsTurnedIn: number;
    completionRate: number | null;
    statusCounts: Record<AssessmentStatus, number>;
    lowScoreCount: number;
    classesHeld: number;
    classesAttended: number;
    classesAttendedLive: number;
    classesAttendedRecording: number;
    attendanceRate: number | null;
    lastActivityAt: string | null;
  };
  courses: CourseRow[];
  tests: AssessmentRow[];
  classes: ClassRow[];
}
