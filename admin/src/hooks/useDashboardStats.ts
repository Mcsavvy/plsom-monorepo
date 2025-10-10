import { useCustom } from '@refinedev/core';

export interface DashboardStats {
  user_stats: {
    total_users: number;
    total_students: number;
    total_lecturers: number;
    total_admins: number;
    active_users: number;
    recent_registrations: number;
  };
  cohort_stats: {
    total_cohorts: number;
    active_cohorts: number;
    upcoming_cohorts: number;
    completed_cohorts: number;
    total_enrollments: number;
    avg_enrollment_per_cohort: number;
  };
  course_stats: {
    total_courses: number;
    active_courses: number;
    courses_by_program: Record<string, number>;
    courses_with_lecturers: number;
    courses_without_lecturers: number;
  };
  class_stats: {
    total_classes: number;
    completed_classes: number;
    upcoming_classes: number;
    classes_this_week: number;
    avg_attendance_rate: number;
    total_attendance_records: number;
  };
  assessment_stats: {
    total_tests: number;
    published_tests: number;
    draft_tests: number;
    archived_tests: number;
    total_submissions: number;
    avg_submission_rate: number;
    avg_test_score: number;
  };
  invitation_stats: {
    total_invitations: number;
    pending_invitations: number;
    used_invitations: number;
    expired_invitations: number;
    invitations_by_role: Record<string, number>;
  };
  recent_activity: {
    recent_classes: Array<{
      id: number;
      title: string;
      scheduled_at: string;
      course__name: string;
    }>;
    recent_tests: Array<{
      id: number;
      title: string;
      status: string;
      created_at: string;
    }>;
    recent_enrollments: Array<{
      id: number;
      student__email: string;
      cohort__name: string;
      enrolled_at: string;
    }>;
  };
}

interface UseDashboardStatsOptions {
  enabled?: boolean;
}

export const useDashboardStats = (options: UseDashboardStatsOptions = {}) => {
  const { enabled = true } = options;

  const { data, isLoading, error, refetch } = useCustom<DashboardStats>({
    url: '/dashboard/stats/',
    method: 'get',
    queryOptions: {
      enabled,
      queryKey: ['dashboard-stats'],
      staleTime: 5 * 60 * 1000, // 5 minutes
      gcTime: 10 * 60 * 1000, // 10 minutes
      refetchOnWindowFocus: false,
      retry: 2,
    },
  });

  return {
    stats: data?.data,
    isLoading,
    error,
    refetch,
  };
};
