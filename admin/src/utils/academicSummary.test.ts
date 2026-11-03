import { describe, expect, it } from 'vitest';

import type {
  AcademicSummaryResponse,
  AssessmentRow,
} from '@/types/academicSummary';
import {
  buildAttentionItems,
  buildGradeTrend,
  filterAndSortTests,
  formatPercent,
  formatScore,
  percentTone,
  rateTone,
  transformAcademicSummary,
} from './academicSummary';

const row = (over: Partial<AssessmentRow> = {}): AssessmentRow => ({
  testId: 1,
  title: 'Test',
  courseId: 1,
  courseName: 'Theology',
  cohortId: 1,
  cohortName: 'Cohort A',
  testStatus: 'published',
  availableFrom: null,
  availableUntil: null,
  maxAttempts: 1,
  attemptsUsed: 0,
  status: 'not_started',
  score: null,
  maxScore: 10,
  percentage: null,
  isLowScore: false,
  submissionId: null,
  latestSubmissionId: null,
  submittedAt: null,
  gradedAt: null,
  gradedByName: null,
  feedback: '',
  hasPendingAttempt: false,
  attempts: [],
  ...over,
});

describe('formatting', () => {
  it('formats percentages', () => {
    expect(formatPercent(72)).toBe('72%');
    expect(formatPercent(66.66)).toBe('66.7%');
    expect(formatPercent(0)).toBe('0%');
    expect(formatPercent(null)).toBe('–');
    expect(formatPercent(undefined)).toBe('–');
  });

  it('formats scores and trims float noise', () => {
    expect(formatScore(7.5, 10)).toBe('7.5 / 10');
    expect(formatScore(0.1 + 0.2, 1)).toBe('0.3 / 1');
    expect(formatScore(null, 20)).toBe('– / 20');
  });
});

describe('tones', () => {
  it('bands grades around the server threshold', () => {
    expect(percentTone(49.9, 50)).toBe('bad');
    expect(percentTone(50, 50)).toBe('ok');
    expect(percentTone(69.9, 50)).toBe('ok');
    expect(percentTone(70, 50)).toBe('good');
    expect(percentTone(null, 50)).toBe('none');
    // A stricter threshold moves the bad band.
    expect(percentTone(55, 60)).toBe('bad');
  });

  it('bands rates', () => {
    expect(rateTone(80)).toBe('good');
    expect(rateTone(79.9)).toBe('warn');
    expect(rateTone(60)).toBe('warn');
    expect(rateTone(59.9)).toBe('bad');
    expect(rateTone(null)).toBe('none');
  });
});

describe('buildAttentionItems', () => {
  it('orders by urgency and covers every kind', () => {
    const items = buildAttentionItems(
      [
        row({
          testId: 1,
          status: 'awaiting_grading',
          submittedAt: '2026-01-02',
        }),
        row({ testId: 2, status: 'graded', percentage: 30, isLowScore: true }),
        row({ testId: 3, status: 'missed', availableUntil: '2026-01-01' }),
        row({ testId: 4, status: 'returned' }),
        row({ testId: 5, status: 'graded', percentage: 90 }),
        row({ testId: 6, status: 'not_started' }),
      ],
      50
    );
    expect(items.map(i => i.kind)).toEqual([
      'missed',
      'low_score',
      'returned',
      'awaiting_grading',
    ]);
    expect(items[1].message).toBe('Scored 30%, under 50%');
  });

  it('flags a graded test whose newer attempt waits for grading', () => {
    const items = buildAttentionItems(
      [row({ status: 'graded', percentage: 80, hasPendingAttempt: true })],
      50
    );
    expect(items).toHaveLength(1);
    expect(items[0].kind).toBe('awaiting_grading');
    expect(items[0].message).toMatch(/Newer attempt/);
  });

  it('puts the newest item first within a kind', () => {
    const items = buildAttentionItems(
      [
        row({ testId: 1, status: 'missed', availableUntil: '2026-01-01' }),
        row({ testId: 2, status: 'missed', availableUntil: '2026-03-01' }),
      ],
      50
    );
    expect(items.map(i => i.test.testId)).toEqual([2, 1]);
  });

  it('is empty for a student in good standing', () => {
    expect(
      buildAttentionItems([row({ status: 'graded', percentage: 95 })], 50)
    ).toEqual([]);
  });
});

describe('buildGradeTrend', () => {
  it('keeps graded tests with a percentage, oldest first', () => {
    const trend = buildGradeTrend([
      row({
        testId: 1,
        status: 'graded',
        percentage: 80,
        gradedAt: '2026-03-01',
      }),
      row({
        testId: 2,
        status: 'graded',
        percentage: 60,
        gradedAt: '2026-01-01',
      }),
      row({
        testId: 3,
        status: 'graded',
        percentage: null,
        gradedAt: '2026-02-01',
      }),
      row({ testId: 4, status: 'awaiting_grading' }),
    ]);
    expect(trend.map(p => p.testId)).toEqual([2, 1]);
  });
});

describe('filterAndSortTests', () => {
  const tests = [
    row({ testId: 1, title: 'B', status: 'graded', percentage: 90 }),
    row({ testId: 2, title: 'A', status: 'missed' }),
    row({
      testId: 3,
      title: 'C',
      status: 'graded',
      percentage: 20,
      isLowScore: true,
    }),
    row({
      testId: 4,
      title: 'D',
      status: 'upcoming',
      courseId: 2,
      courseName: 'Homiletics',
    }),
    row({ testId: 5, title: 'E', status: 'in_progress' }),
  ];
  const ids = (
    f: Parameters<typeof filterAndSortTests>[1],
    c: number | 'all' = 'all'
  ) => filterAndSortTests(tests, f, c).map(t => t.testId);

  it('orders by urgency then title', () => {
    expect(ids('all')).toEqual([2, 5, 1, 3, 4]);
  });

  it('filters by status group', () => {
    expect(ids('graded')).toEqual([1, 3]);
    expect(ids('outstanding')).toEqual([2, 5]);
    expect(ids('attention')).toEqual([2, 3]);
  });

  it('filters by course', () => {
    expect(ids('all', 2)).toEqual([4]);
  });

  it('does not mutate the input', () => {
    const before = tests.map(t => t.testId);
    filterAndSortTests(tests, 'all', 'all');
    expect(tests.map(t => t.testId)).toEqual(before);
  });
});

describe('transformAcademicSummary', () => {
  it('maps every field from snake_case', () => {
    const raw: AcademicSummaryResponse = {
      student_id: 7,
      generated_at: '2026-11-03T00:00:00Z',
      scope: 'lecturer',
      low_score_threshold: 50,
      summary: {
        average_percentage: 70,
        highest_percentage: 90,
        lowest_percentage: 50,
        tests_total: 2,
        tests_due: 2,
        tests_turned_in: 2,
        completion_rate: 100,
        status_counts: {
          graded: 2,
          awaiting_grading: 0,
          returned: 0,
          in_progress: 0,
          missed: 0,
          not_started: 0,
          upcoming: 0,
        },
        low_score_count: 0,
        classes_held: 4,
        classes_attended: 3,
        classes_attended_live: 2,
        classes_attended_recording: 1,
        attendance_rate: 75,
        last_activity_at: '2026-11-01T00:00:00Z',
      },
      courses: [
        {
          course_id: 1,
          course_name: 'Theology',
          tests_total: 2,
          tests_graded: 2,
          average_percentage: 70,
          classes_held: 4,
          classes_attended: 3,
          attendance_rate: 75,
        },
      ],
      tests: [
        {
          test_id: 1,
          title: 'T',
          course_id: 1,
          course_name: 'Theology',
          cohort_id: 1,
          cohort_name: 'A',
          test_status: 'published',
          available_from: null,
          available_until: null,
          max_attempts: 2,
          attempts_used: 1,
          status: 'graded',
          score: 9,
          max_score: 10,
          percentage: 90,
          is_low_score: false,
          submission_id: 11,
          latest_submission_id: 11,
          submitted_at: '2026-10-01T00:00:00Z',
          graded_at: '2026-10-02T00:00:00Z',
          graded_by_name: 'Dr Grader',
          feedback: 'Good',
          has_pending_attempt: false,
          attempts: [
            {
              submission_id: 11,
              attempt_number: 1,
              status: 'graded',
              score: 9,
              percentage: 90,
              submitted_at: '2026-10-01T00:00:00Z',
              graded_at: '2026-10-02T00:00:00Z',
            },
          ],
        },
      ],
      classes: [
        {
          class_id: 3,
          title: 'C',
          course_id: 1,
          course_name: 'Theology',
          cohort_id: 1,
          cohort_name: 'A',
          scheduled_at: '2026-10-01T10:00:00Z',
          duration_minutes: 90,
          attended: true,
          attended_via: 'recording',
          minutes_attended: 45,
          verified: false,
        },
      ],
    };
    const out = transformAcademicSummary(raw);
    expect(out.scope).toBe('lecturer');
    expect(out.summary.classesAttendedRecording).toBe(1);
    expect(out.summary.statusCounts.graded).toBe(2);
    expect(out.courses[0].attendanceRate).toBe(75);
    expect(out.tests[0].gradedByName).toBe('Dr Grader');
    expect(out.tests[0].attempts[0].attemptNumber).toBe(1);
    expect(out.classes[0].attendedVia).toBe('recording');
    expect(out.classes[0].minutesAttended).toBe(45);
  });
});
