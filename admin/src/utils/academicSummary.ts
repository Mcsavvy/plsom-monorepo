// Pure helpers for the student profile's academic section. Everything that
// decides what the admin sees (ordering, labels, colour bands, "needs
// attention") lives here so it can be unit tested without rendering.

import type {
  AcademicSummary,
  AcademicSummaryResponse,
  AssessmentRow,
  AssessmentStatus,
} from '@/types/academicSummary';

export const transformAcademicSummary = (
  raw: AcademicSummaryResponse
): AcademicSummary => ({
  studentId: raw.student_id,
  generatedAt: raw.generated_at,
  scope: raw.scope,
  lowScoreThreshold: raw.low_score_threshold,
  summary: {
    averagePercentage: raw.summary.average_percentage,
    highestPercentage: raw.summary.highest_percentage,
    lowestPercentage: raw.summary.lowest_percentage,
    testsTotal: raw.summary.tests_total,
    testsDue: raw.summary.tests_due,
    testsTurnedIn: raw.summary.tests_turned_in,
    completionRate: raw.summary.completion_rate,
    statusCounts: raw.summary.status_counts,
    lowScoreCount: raw.summary.low_score_count,
    classesHeld: raw.summary.classes_held,
    classesAttended: raw.summary.classes_attended,
    classesAttendedLive: raw.summary.classes_attended_live,
    classesAttendedRecording: raw.summary.classes_attended_recording,
    attendanceRate: raw.summary.attendance_rate,
    lastActivityAt: raw.summary.last_activity_at,
  },
  courses: raw.courses.map(c => ({
    courseId: c.course_id,
    courseName: c.course_name,
    testsTotal: c.tests_total,
    testsGraded: c.tests_graded,
    averagePercentage: c.average_percentage,
    classesHeld: c.classes_held,
    classesAttended: c.classes_attended,
    attendanceRate: c.attendance_rate,
  })),
  tests: raw.tests.map(t => ({
    testId: t.test_id,
    title: t.title,
    courseId: t.course_id,
    courseName: t.course_name,
    cohortId: t.cohort_id,
    cohortName: t.cohort_name,
    testStatus: t.test_status,
    availableFrom: t.available_from,
    availableUntil: t.available_until,
    maxAttempts: t.max_attempts,
    attemptsUsed: t.attempts_used,
    status: t.status,
    score: t.score,
    maxScore: t.max_score,
    percentage: t.percentage,
    isLowScore: t.is_low_score,
    submissionId: t.submission_id,
    latestSubmissionId: t.latest_submission_id,
    submittedAt: t.submitted_at,
    gradedAt: t.graded_at,
    gradedByName: t.graded_by_name,
    feedback: t.feedback,
    hasPendingAttempt: t.has_pending_attempt,
    attempts: t.attempts.map(a => ({
      submissionId: a.submission_id,
      attemptNumber: a.attempt_number,
      status: a.status,
      score: a.score,
      percentage: a.percentage,
      submittedAt: a.submitted_at,
      gradedAt: a.graded_at,
    })),
  })),
  classes: raw.classes.map(c => ({
    classId: c.class_id,
    title: c.title,
    courseId: c.course_id,
    courseName: c.course_name,
    cohortId: c.cohort_id,
    cohortName: c.cohort_name,
    scheduledAt: c.scheduled_at,
    durationMinutes: c.duration_minutes,
    attended: c.attended,
    attendedVia: c.attended_via,
    minutesAttended: c.minutes_attended,
    verified: c.verified,
  })),
});

// ---- formatting --------------------------------------------------------

/** "72%" / "72.5%"; a dash when there is no value. */
export const formatPercent = (value: number | null | undefined): string => {
  if (value === null || value === undefined) return '–';
  return `${Number.isInteger(value) ? value : value.toFixed(1)}%`;
};

/** "7.5 / 10" with trailing zeros trimmed. */
export const formatScore = (score: number | null, max: number): string => {
  const trim = (n: number) => String(Math.round(n * 100) / 100);
  if (score === null) return `– / ${trim(max)}`;
  return `${trim(score)} / ${trim(max)}`;
};

// ---- colour bands ------------------------------------------------------

export type Tone = 'good' | 'ok' | 'warn' | 'bad' | 'none';

/**
 * Band a percentage. ``threshold`` is the server's low-score line; anything
 * under it is "bad". Above it: 70+ good, threshold–70 ok.
 */
export const percentTone = (
  value: number | null | undefined,
  threshold: number
): Tone => {
  if (value === null || value === undefined) return 'none';
  if (value < threshold) return 'bad';
  if (value < 70) return 'ok';
  return 'good';
};

/** Attendance/completion bands: 80+ good, 60–80 warn, under 60 bad. */
export const rateTone = (value: number | null | undefined): Tone => {
  if (value === null || value === undefined) return 'none';
  if (value >= 80) return 'good';
  if (value >= 60) return 'warn';
  return 'bad';
};

export const toneText: Record<Tone, string> = {
  good: 'text-green-700',
  ok: 'text-blue-700',
  warn: 'text-amber-700',
  bad: 'text-red-700',
  none: 'text-muted-foreground',
};

export const toneBar: Record<Tone, string> = {
  good: 'bg-green-600',
  ok: 'bg-blue-600',
  warn: 'bg-amber-500',
  bad: 'bg-red-600',
  none: 'bg-muted-foreground/30',
};

// ---- statuses ----------------------------------------------------------

export const STATUS_META: Record<
  AssessmentStatus,
  { label: string; className: string; order: number }
> = {
  missed: {
    label: 'Missed',
    className: 'bg-red-100 text-red-800 border-red-300',
    order: 0,
  },
  returned: {
    label: 'Returned for revision',
    className: 'bg-orange-100 text-orange-800 border-orange-300',
    order: 1,
  },
  awaiting_grading: {
    label: 'Awaiting grading',
    className: 'bg-yellow-100 text-yellow-800 border-yellow-300',
    order: 2,
  },
  in_progress: {
    label: 'In progress',
    className: 'bg-blue-100 text-blue-800 border-blue-300',
    order: 3,
  },
  not_started: {
    label: 'Not started',
    className: 'bg-gray-100 text-gray-800 border-gray-300',
    order: 4,
  },
  graded: {
    label: 'Graded',
    className: 'bg-green-100 text-green-800 border-green-300',
    order: 5,
  },
  upcoming: {
    label: 'Upcoming',
    className: 'bg-slate-50 text-slate-600 border-slate-200',
    order: 6,
  },
};

// ---- needs attention ---------------------------------------------------

export interface AttentionItem {
  key: string;
  kind: 'missed' | 'low_score' | 'returned' | 'awaiting_grading';
  test: AssessmentRow;
  message: string;
}

/**
 * Things an admin should act on, most urgent first:
 * missed tests, low grades, work returned to the student, work waiting on
 * a grader. Within a kind, newest deadline/submission first.
 */
export const buildAttentionItems = (
  tests: AssessmentRow[],
  threshold: number
): AttentionItem[] => {
  const items: AttentionItem[] = [];
  for (const t of tests) {
    if (t.status === 'missed') {
      items.push({
        key: `missed-${t.testId}`,
        kind: 'missed',
        test: t,
        message: 'Deadline passed with no submission',
      });
    }
    if (t.isLowScore) {
      items.push({
        key: `low-${t.testId}`,
        kind: 'low_score',
        test: t,
        message: `Scored ${formatPercent(t.percentage)}, under ${formatPercent(threshold)}`,
      });
    }
    if (t.status === 'returned') {
      items.push({
        key: `returned-${t.testId}`,
        kind: 'returned',
        test: t,
        message: 'Returned for revision, waiting on the student',
      });
    }
    if (t.status === 'awaiting_grading' || t.hasPendingAttempt) {
      items.push({
        key: `awaiting-${t.testId}`,
        kind: 'awaiting_grading',
        test: t,
        message: t.hasPendingAttempt
          ? 'Newer attempt submitted, not graded yet'
          : 'Submitted, not graded yet',
      });
    }
  }
  const rank = { missed: 0, low_score: 1, returned: 2, awaiting_grading: 3 };
  const stamp = (t: AssessmentRow) =>
    t.submittedAt ?? t.availableUntil ?? t.gradedAt ?? '';
  return items.sort(
    (a, b) =>
      rank[a.kind] - rank[b.kind] || stamp(b.test).localeCompare(stamp(a.test))
  );
};

// ---- grade trend -------------------------------------------------------

export interface TrendPoint {
  testId: number;
  label: string;
  courseName: string;
  percentage: number;
  gradedAt: string;
}

/** Graded tests with a percentage, oldest grading first, for the chart. */
export const buildGradeTrend = (tests: AssessmentRow[]): TrendPoint[] =>
  tests
    .filter(
      (t): t is AssessmentRow & { percentage: number; gradedAt: string } =>
        t.status === 'graded' && t.percentage !== null && t.gradedAt !== null
    )
    .sort((a, b) => a.gradedAt.localeCompare(b.gradedAt))
    .map(t => ({
      testId: t.testId,
      label: t.title,
      courseName: t.courseName,
      percentage: t.percentage,
      gradedAt: t.gradedAt,
    }));

// ---- table ordering / filtering ---------------------------------------

export type GradeFilter = 'all' | 'graded' | 'outstanding' | 'attention';

const OUTSTANDING: AssessmentStatus[] = [
  'missed',
  'returned',
  'awaiting_grading',
  'in_progress',
  'not_started',
];

/** Filter then order: by status urgency, then course, then title. */
export const filterAndSortTests = (
  tests: AssessmentRow[],
  filter: GradeFilter,
  courseId: number | 'all'
): AssessmentRow[] =>
  tests
    .filter(t => courseId === 'all' || t.courseId === courseId)
    .filter(t => {
      switch (filter) {
        case 'graded':
          return t.status === 'graded';
        case 'outstanding':
          return OUTSTANDING.includes(t.status);
        case 'attention':
          return (
            t.status === 'missed' ||
            t.status === 'returned' ||
            t.status === 'awaiting_grading' ||
            t.isLowScore ||
            t.hasPendingAttempt
          );
        default:
          return true;
      }
    })
    .sort(
      (a, b) =>
        STATUS_META[a.status].order - STATUS_META[b.status].order ||
        a.courseName.localeCompare(b.courseName) ||
        a.title.localeCompare(b.title)
    );
