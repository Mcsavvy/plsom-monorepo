import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Users,
  GraduationCap,
  BookOpen,
  Calendar,
  ClipboardCheck,
  Mail,
  TrendingUp,
  TrendingDown,
  Activity,
  UserCheck,
  Clock,
  BarChart3,
} from 'lucide-react';

interface StatCardProps {
  title: string;
  value: string | number;
  description?: string;
  icon?: React.ReactNode;
  trend?: {
    value: number;
    label: string;
    isPositive?: boolean;
  };
  badge?: {
    text: string;
    variant?: 'default' | 'secondary' | 'destructive' | 'outline';
  };
  loading?: boolean;
}

export const StatCard = ({
  title,
  value,
  description,
  icon,
  trend,
  badge,
  loading = false,
}: StatCardProps) => {
  if (loading) {
    return (
      <Card>
        <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
          <Skeleton className='h-4 w-[100px]' />
          <Skeleton className='h-4 w-4' />
        </CardHeader>
        <CardContent>
          <Skeleton className='h-7 w-[60px] mb-1' />
          <Skeleton className='h-3 w-[120px]' />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
        <CardTitle className='text-sm font-medium'>{title}</CardTitle>
        <div className='flex items-center gap-2'>
          {badge && (
            <Badge variant={badge.variant || 'secondary'} className='text-xs'>
              {badge.text}
            </Badge>
          )}
          {icon && <div className='h-4 w-4 text-muted-foreground'>{icon}</div>}
        </div>
      </CardHeader>
      <CardContent>
        <div className='text-2xl font-bold'>{value}</div>
        {(description || trend) && (
          <div className='flex items-center gap-2 text-xs text-muted-foreground mt-1'>
            {trend && (
              <div
                className={`flex items-center gap-1 ${
                  trend.isPositive ? 'text-green-600' : 'text-red-600'
                }`}
              >
                {trend.isPositive ? (
                  <TrendingUp className='h-3 w-3' />
                ) : (
                  <TrendingDown className='h-3 w-3' />
                )}
                <span>{trend.value}%</span>
              </div>
            )}
            {description && <span>{description}</span>}
            {trend && trend.label && <span>{trend.label}</span>}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

interface DashboardStats {
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

interface StatCardsProps {
  stats?: DashboardStats;
  loading?: boolean;
  userRole?: 'admin' | 'lecturer';
}

export const StatCards = ({
  stats,
  loading = false,
  userRole = 'admin',
}: StatCardsProps) => {
  if (loading || !stats) {
    return (
      <div className='grid gap-4 md:grid-cols-2 lg:grid-cols-4'>
        {Array.from({ length: 8 }).map((_, i) => (
          <StatCard key={i} title='' value='' loading />
        ))}
      </div>
    );
  }

  const {
    user_stats,
    cohort_stats,
    course_stats,
    class_stats,
    assessment_stats,
    invitation_stats,
  } = stats;

  return (
    <div className='space-y-6'>
      {/* User Statistics */}
      {userRole === 'admin' && (
        <div>
          <h3 className='text-lg font-semibold mb-4 flex items-center gap-2'>
            <Users className='h-5 w-5' />
            User Management
          </h3>
          <div className='grid gap-4 md:grid-cols-2 lg:grid-cols-4'>
            <StatCard
              title='Total Users'
              value={user_stats.total_users}
              description='All platform users'
              icon={<Users className='h-4 w-4' />}
            />
            <StatCard
              title='Students'
              value={user_stats.total_students}
              description='Enrolled learners'
              icon={<GraduationCap className='h-4 w-4' />}
              badge={{
                text: `${((user_stats.total_students / user_stats.total_users) * 100).toFixed(1)}%`,
                variant: 'secondary',
              }}
            />
            <StatCard
              title='Lecturers'
              value={user_stats.total_lecturers}
              description='Teaching staff'
              icon={<BookOpen className='h-4 w-4' />}
            />
            <StatCard
              title='Active Users'
              value={user_stats.active_users}
              description='Currently active'
              icon={<UserCheck className='h-4 w-4' />}
              badge={{
                text: `${user_stats.recent_registrations} new this month`,
                variant:
                  user_stats.recent_registrations > 0 ? 'default' : 'secondary',
              }}
            />
          </div>
        </div>
      )}

      {/* Cohort Statistics */}
      {userRole === 'admin' && (
        <div>
          <h3 className='text-lg font-semibold mb-4 flex items-center gap-2'>
            <Users className='h-5 w-5' />
            Cohort Management
          </h3>
          <div className='grid gap-4 md:grid-cols-2 lg:grid-cols-4'>
            <StatCard
              title='Total Cohorts'
              value={cohort_stats.total_cohorts}
              description='All cohorts created'
              icon={<Users className='h-4 w-4' />}
            />
            <StatCard
              title='Active Cohorts'
              value={cohort_stats.active_cohorts}
              description='Currently running'
              icon={<Activity className='h-4 w-4' />}
              badge={{
                text: cohort_stats.active_cohorts > 0 ? 'Live' : 'None',
                variant:
                  cohort_stats.active_cohorts > 0 ? 'default' : 'secondary',
              }}
            />
            <StatCard
              title='Total Enrollments'
              value={cohort_stats.total_enrollments}
              description='Student registrations'
              icon={<UserCheck className='h-4 w-4' />}
            />
            <StatCard
              title='Avg. Enrollment'
              value={cohort_stats.avg_enrollment_per_cohort}
              description='Students per cohort'
              icon={<BarChart3 className='h-4 w-4' />}
            />
          </div>
        </div>
      )}

      {/* Course Statistics */}
      <div>
        <h3 className='text-lg font-semibold mb-4 flex items-center gap-2'>
          <BookOpen className='h-5 w-5' />
          Course Management
        </h3>
        <div className='grid gap-4 md:grid-cols-2 lg:grid-cols-4'>
          <StatCard
            title='Total Courses'
            value={course_stats.total_courses}
            description={userRole === 'admin' ? 'All courses' : 'Your courses'}
            icon={<BookOpen className='h-4 w-4' />}
          />
          <StatCard
            title='Active Courses'
            value={course_stats.active_courses}
            description='Currently available'
            icon={<Activity className='h-4 w-4' />}
            badge={{
              text: `${((course_stats.active_courses / course_stats.total_courses) * 100).toFixed(1)}%`,
              variant: 'default',
            }}
          />
          <StatCard
            title='With Lecturers'
            value={course_stats.courses_with_lecturers}
            description='Assigned instructors'
            icon={<UserCheck className='h-4 w-4' />}
          />
          <StatCard
            title='Need Lecturers'
            value={course_stats.courses_without_lecturers}
            description='Unassigned courses'
            icon={<Clock className='h-4 w-4' />}
            badge={{
              text:
                course_stats.courses_without_lecturers > 0
                  ? 'Action needed'
                  : 'All assigned',
              variant:
                course_stats.courses_without_lecturers > 0
                  ? 'destructive'
                  : 'default',
            }}
          />
        </div>
      </div>

      {/* Class Statistics */}
      <div>
        <h3 className='text-lg font-semibold mb-4 flex items-center gap-2'>
          <Calendar className='h-5 w-5' />
          Class Management
        </h3>
        <div className='grid gap-4 md:grid-cols-2 lg:grid-cols-4'>
          <StatCard
            title='Total Classes'
            value={class_stats.total_classes}
            description={
              userRole === 'admin' ? 'All scheduled' : 'Your classes'
            }
            icon={<Calendar className='h-4 w-4' />}
          />
          <StatCard
            title='This Week'
            value={class_stats.classes_this_week}
            description='Upcoming sessions'
            icon={<Clock className='h-4 w-4' />}
            badge={{
              text: class_stats.classes_this_week > 0 ? 'Active' : 'None',
              variant:
                class_stats.classes_this_week > 0 ? 'default' : 'secondary',
            }}
          />
          <StatCard
            title='Completed'
            value={class_stats.completed_classes}
            description='Sessions finished'
            icon={<UserCheck className='h-4 w-4' />}
          />
          <StatCard
            title='Attendance Rate'
            value={`${class_stats.avg_attendance_rate}%`}
            description='Average participation'
            icon={<BarChart3 className='h-4 w-4' />}
            trend={{
              value: class_stats.avg_attendance_rate,
              label: 'overall rate',
              isPositive: class_stats.avg_attendance_rate >= 75,
            }}
          />
        </div>
      </div>

      {/* Assessment Statistics */}
      <div>
        <h3 className='text-lg font-semibold mb-4 flex items-center gap-2'>
          <ClipboardCheck className='h-5 w-5' />
          Assessments
        </h3>
        <div className='grid gap-4 md:grid-cols-2 lg:grid-cols-4'>
          <StatCard
            title='Total Tests'
            value={assessment_stats.total_tests}
            description={
              userRole === 'admin' ? 'All assessments' : 'Your tests'
            }
            icon={<ClipboardCheck className='h-4 w-4' />}
          />
          <StatCard
            title='Published'
            value={assessment_stats.published_tests}
            description='Available to students'
            icon={<Activity className='h-4 w-4' />}
            badge={{
              text: `${assessment_stats.draft_tests} drafts`,
              variant: 'secondary',
            }}
          />
          <StatCard
            title='Submission Rate'
            value={`${assessment_stats.avg_submission_rate}%`}
            description='Student completion'
            icon={<BarChart3 className='h-4 w-4' />}
            trend={{
              value: assessment_stats.avg_submission_rate,
              label: 'completion rate',
              isPositive: assessment_stats.avg_submission_rate >= 80,
            }}
          />
          <StatCard
            title='Average Score'
            value={`${assessment_stats.avg_test_score}%`}
            description='Student performance'
            icon={<TrendingUp className='h-4 w-4' />}
            trend={{
              value: assessment_stats.avg_test_score,
              label: 'average grade',
              isPositive: assessment_stats.avg_test_score >= 70,
            }}
          />
        </div>
      </div>

      {/* Invitation Statistics - Admin Only */}
      {userRole === 'admin' && (
        <div>
          <h3 className='text-lg font-semibold mb-4 flex items-center gap-2'>
            <Mail className='h-5 w-5' />
            User Invitations
          </h3>
          <div className='grid gap-4 md:grid-cols-2 lg:grid-cols-4'>
            <StatCard
              title='Total Sent'
              value={invitation_stats.total_invitations}
              description='All invitations'
              icon={<Mail className='h-4 w-4' />}
            />
            <StatCard
              title='Pending'
              value={invitation_stats.pending_invitations}
              description='Awaiting response'
              icon={<Clock className='h-4 w-4' />}
              badge={{
                text:
                  invitation_stats.pending_invitations > 0
                    ? 'Action needed'
                    : 'All clear',
                variant:
                  invitation_stats.pending_invitations > 0
                    ? 'destructive'
                    : 'default',
              }}
            />
            <StatCard
              title='Accepted'
              value={invitation_stats.used_invitations}
              description='Successfully used'
              icon={<UserCheck className='h-4 w-4' />}
            />
            <StatCard
              title='Expired'
              value={invitation_stats.expired_invitations}
              description='Need regeneration'
              icon={<Clock className='h-4 w-4' />}
              badge={{
                text:
                  invitation_stats.expired_invitations > 0
                    ? 'Review needed'
                    : 'None',
                variant:
                  invitation_stats.expired_invitations > 0
                    ? 'secondary'
                    : 'default',
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
};
