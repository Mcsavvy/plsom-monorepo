import { useGetIdentity } from '@refinedev/core';
import { useDashboardStats } from '@/hooks/useDashboardStats';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { UserIdentity } from '@/types/user';
import {
  RefreshCw,
  Users,
  Calendar,
  ClipboardCheck,
  TrendingUp,
  BookOpen,
  UserCheck,
} from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { DashboardSummary } from '@/components/dashboard';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import { Enrollment } from '@/types/enrollment';
import { DashboardStats } from '@/hooks/useDashboardStats';

export const Dashboard = () => {
  const { data: user } = useGetIdentity<UserIdentity>();
  const { stats, isLoading, error, refetch } = useDashboardStats();

  const handleRefresh = () => {
    refetch();
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  };

  // Prepare chart data
  const userDistributionData = (stats && stats.user_stats)
    ? [
        {
          name: 'Students',
          value: stats.user_stats.total_students,
          color: '#3b82f6',
        },
        {
          name: 'Lecturers',
          value: stats.user_stats.total_lecturers,
          color: '#10b981',
        },
        {
          name: 'Admins',
          value: stats.user_stats.total_admins,
          color: '#f59e0b',
        },
      ]
    : [];

  const courseProgramData = stats
    ? Object.entries(stats.course_stats.courses_by_program).map(
        ([program, count]) => ({
          name: program === 'certificate' ? 'Certificate' : 'Diploma',
          courses: count,
        })
      )
    : [];

  const testStatusData = stats
    ? [
        {
          name: 'Published',
          value: stats.assessment_stats.published_tests,
          color: '#10b981',
        },
        {
          name: 'Draft',
          value: stats.assessment_stats.draft_tests,
          color: '#f59e0b',
        },
        {
          name: 'Archived',
          value: stats.assessment_stats.archived_tests,
          color: '#6b7280',
        },
      ]
    : [];

  if (error) {
    return (
      <div className='space-y-6'>
        <div className='flex items-center justify-between'>
          <div>
            <h1 className='text-3xl font-bold tracking-tight'>Dashboard</h1>
            <p className='text-muted-foreground'>
              Welcome to PLSOM Admin Portal
            </p>
          </div>
        </div>
        <Alert variant='destructive'>
          <AlertDescription>
            Failed to load dashboard statistics. Please try refreshing the page.
            <Button
              variant='outline'
              size='sm'
              onClick={handleRefresh}
              className='ml-2'
            >
              <RefreshCw className='h-4 w-4 mr-1' />
              Retry
            </Button>
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  if (isLoading || !stats) {
    return (
      <div className='space-y-8'>
        <div className='flex items-center justify-between'>
          <div>
            <Skeleton className='h-9 w-64 mb-2' />
            <Skeleton className='h-5 w-96' />
          </div>
          <Skeleton className='h-9 w-20' />
        </div>

        {/* Key Metrics Skeleton */}
        <div className='grid gap-4 md:grid-cols-2 lg:grid-cols-4'>
          {Array.from({ length: 4 }).map((_, i) => (
            <Card key={i}>
              <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
                <Skeleton className='h-4 w-24' />
                <Skeleton className='h-4 w-4' />
              </CardHeader>
              <CardContent>
                <Skeleton className='h-7 w-16 mb-1' />
                <Skeleton className='h-3 w-32' />
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Charts Skeleton */}
        <div className='grid gap-6 md:grid-cols-2'>
          <Card>
            <CardHeader>
              <Skeleton className='h-6 w-32' />
            </CardHeader>
            <CardContent>
              <Skeleton className='h-64 w-full' />
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <Skeleton className='h-6 w-32' />
            </CardHeader>
            <CardContent>
              <Skeleton className='h-64 w-full' />
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className='space-y-8'>
      {/* Header */}
      <div className='flex items-center justify-between'>
        <div>
          <h1 className='text-3xl font-bold tracking-tight'>
            {getGreeting()}, {user?.name}!
          </h1>
          <p className='text-muted-foreground'>
            {user?.role === 'admin' ? 'Administrator' : 'Lecturer'} • PLSOM
            Learning Management System
          </p>
        </div>
        <Button
          variant='outline'
          size='sm'
          onClick={handleRefresh}
          disabled={isLoading}
        >
          <RefreshCw
            className={`h-4 w-4 mr-1 ${isLoading ? 'animate-spin' : ''}`}
          />
          Refresh
        </Button>
      </div>

      {/* Key Insights Summary */}
      {stats && (
        <DashboardSummary
          stats={stats as DashboardStats}
          userRole={user?.role as 'admin' | 'lecturer'}
        />
      )}

      {/* Key Metrics */}
      <div className='grid gap-4 md:grid-cols-2 lg:grid-cols-4'>
        <Card>
          <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
            <CardTitle className='text-sm font-medium'>
              {user?.role === 'admin' ? 'Total Students' : 'Your Courses'}
            </CardTitle>
            {user?.role === 'admin' ? (
              <Users className='h-4 w-4 text-muted-foreground' />
            ) : (
              <BookOpen className='h-4 w-4 text-muted-foreground' />
            )}
          </CardHeader>
          <CardContent>
            <div className='text-2xl font-bold'>
              {user?.role === 'admin'
                ? stats.user_stats.total_students
                : stats.course_stats.total_courses}
            </div>
            <p className='text-xs text-muted-foreground'>
              {user?.role === 'admin'
                ? 'Enrolled learners'
                : 'Course assignments'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
            <CardTitle className='text-sm font-medium'>
              Classes This Week
            </CardTitle>
            <Calendar className='h-4 w-4 text-muted-foreground' />
          </CardHeader>
          <CardContent>
            <div className='text-2xl font-bold'>
              {stats.class_stats.classes_this_week}
            </div>
            <p className='text-xs text-muted-foreground'>Upcoming sessions</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
            <CardTitle className='text-sm font-medium'>
              Attendance Rate
            </CardTitle>
            <TrendingUp className='h-4 w-4 text-muted-foreground' />
          </CardHeader>
          <CardContent>
            <div className='text-2xl font-bold'>
              {stats.class_stats.avg_attendance_rate}%
            </div>
            <p className='text-xs text-muted-foreground'>
              <span
                className={
                  stats.class_stats.avg_attendance_rate >= 75
                    ? 'text-green-600'
                    : 'text-red-600'
                }
              >
                {stats.class_stats.avg_attendance_rate >= 75 ? '↗' : '↘'}{' '}
                Average participation
              </span>
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
            <CardTitle className='text-sm font-medium'>
              Test Performance
            </CardTitle>
            <ClipboardCheck className='h-4 w-4 text-muted-foreground' />
          </CardHeader>
          <CardContent>
            <div className='text-2xl font-bold'>
              {stats.assessment_stats.avg_test_score}%
            </div>
            <p className='text-xs text-muted-foreground'>
              <span
                className={
                  stats.assessment_stats.avg_test_score >= 70
                    ? 'text-green-600'
                    : 'text-red-600'
                }
              >
                {stats.assessment_stats.avg_test_score >= 70 ? '↗' : '↘'}{' '}
                Average score
              </span>
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts Section */}
      <div className='grid gap-6 md:grid-cols-2'>
        {/* User Distribution Chart - Admin Only */}
        {user?.role === 'admin' && (
          <Card>
            <CardHeader>
              <CardTitle className='flex items-center gap-2'>
                <Users className='h-5 w-5' />
                User Distribution
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width='100%' height={250}>
                <PieChart>
                  <Pie
                    data={userDistributionData}
                    cx='50%'
                    cy='50%'
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={5}
                    dataKey='value'
                  >
                    {userDistributionData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
              <div className='flex justify-center gap-4 mt-4'>
                {userDistributionData.map(entry => (
                  <div key={entry.name} className='flex items-center gap-2'>
                    <div
                      className='w-3 h-3 rounded-full'
                      style={{ backgroundColor: entry.color }}
                    />
                    <span className='text-sm text-muted-foreground'>
                      {entry.name}
                    </span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Course Distribution by Program */}
        <Card>
          <CardHeader>
            <CardTitle className='flex items-center gap-2'>
              <BookOpen className='h-5 w-5' />
              Courses by Program
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width='100%' height={250}>
              <BarChart data={courseProgramData}>
                <CartesianGrid strokeDasharray='3 3' />
                <XAxis dataKey='name' />
                <YAxis />
                <Tooltip />
                <Bar dataKey='courses' fill='#3b82f6' />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Test Status Distribution */}
        <Card>
          <CardHeader>
            <CardTitle className='flex items-center gap-2'>
              <ClipboardCheck className='h-5 w-5' />
              Test Status Overview
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width='100%' height={250}>
              <PieChart>
                <Pie
                  data={testStatusData}
                  cx='50%'
                  cy='50%'
                  outerRadius={100}
                  dataKey='value'
                >
                  {testStatusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
            <div className='flex justify-center gap-4 mt-4'>
              {testStatusData.map(entry => (
                <div key={entry.name} className='flex items-center gap-2'>
                  <div
                    className='w-3 h-3 rounded-full'
                    style={{ backgroundColor: entry.color }}
                  />
                  <span className='text-sm text-muted-foreground'>
                    {entry.name}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Quick Stats Card */}
        <Card>
          <CardHeader>
            <CardTitle className='flex items-center gap-2'>
              <TrendingUp className='h-5 w-5' />
              Quick Stats
            </CardTitle>
          </CardHeader>
          <CardContent className='space-y-4'>
            <div className='flex items-center justify-between'>
              <span className='text-sm text-muted-foreground'>
                Active Courses
              </span>
              <div className='flex items-center gap-2'>
                <span className='font-medium'>
                  {stats.course_stats.active_courses}/
                  {stats.course_stats.total_courses}
                </span>
                <Badge variant='secondary' className='text-xs'>
                  {(
                    (stats.course_stats.active_courses /
                      stats.course_stats.total_courses) *
                    100
                  ).toFixed(0)}
                  %
                </Badge>
              </div>
            </div>
            <Separator />

            <div className='flex items-center justify-between'>
              <span className='text-sm text-muted-foreground'>
                Submission Rate
              </span>
              <div className='flex items-center gap-2'>
                <span className='font-medium'>
                  {stats.assessment_stats.avg_submission_rate}%
                </span>
                <Badge
                  variant={
                    stats.assessment_stats.avg_submission_rate >= 80
                      ? 'default'
                      : 'secondary'
                  }
                  className='text-xs'
                >
                  {stats.assessment_stats.avg_submission_rate >= 80
                    ? 'Good'
                    : 'Needs Attention'}
                </Badge>
              </div>
            </div>
            <Separator />

            {user?.role === 'admin' && (
              <>
                <div className='flex items-center justify-between'>
                  <span className='text-sm text-muted-foreground'>
                    Active Cohorts
                  </span>
                  <div className='flex items-center gap-2'>
                    <span className='font-medium'>
                      {stats.cohort_stats.active_cohorts}
                    </span>
                    <Badge
                      variant={
                        stats.cohort_stats.active_cohorts > 0
                          ? 'default'
                          : 'secondary'
                      }
                      className='text-xs'
                    >
                      {stats.cohort_stats.active_cohorts > 0
                        ? 'Running'
                        : 'None'}
                    </Badge>
                  </div>
                </div>
                <Separator />

                <div className='flex items-center justify-between'>
                  <span className='text-sm text-muted-foreground'>
                    Pending Invitations
                  </span>
                  <div className='flex items-center gap-2'>
                    <span className='font-medium'>
                      {stats.invitation_stats.pending_invitations}
                    </span>
                    <Badge
                      variant={
                        stats.invitation_stats.pending_invitations > 0
                          ? 'destructive'
                          : 'default'
                      }
                      className='text-xs'
                    >
                      {stats.invitation_stats.pending_invitations > 0
                        ? 'Action Needed'
                        : 'All Clear'}
                    </Badge>
                  </div>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity - Simplified */}
      {stats.recent_activity && (
        <Card>
          <CardHeader>
            <CardTitle className='flex items-center gap-2'>
              <UserCheck className='h-5 w-5' />
              Recent Activity
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className='grid gap-4 md:grid-cols-3'>
              {/* Recent Classes */}
              <div>
                <h4 className='font-medium mb-3 text-sm text-muted-foreground'>
                  Latest Classes
                </h4>
                <div className='space-y-2'>
                  {stats.recent_activity.recent_classes
                    .slice(0, 3)
                    .map((classItem) => (
                      <div
                        key={classItem.id}
                        className='flex items-center gap-2'
                      >
                        <Calendar className='h-3 w-3 text-blue-500' />
                        <span className='text-sm truncate'>
                          {classItem.title}
                        </span>
                      </div>
                    ))}
                  {stats.recent_activity.recent_classes.length === 0 && (
                    <p className='text-sm text-muted-foreground'>
                      No recent classes
                    </p>
                  )}
                </div>
              </div>

              {/* Recent Tests */}
              <div>
                <h4 className='font-medium mb-3 text-sm text-muted-foreground'>
                  Latest Tests
                </h4>
                <div className='space-y-2'>
                  {stats.recent_activity.recent_tests.slice(0, 3).map((test) => (
                    <div key={test.id} className='flex items-center gap-2'>
                      <ClipboardCheck className='h-3 w-3 text-green-500' />
                      <span className='text-sm truncate'>{test.title}</span>
                      <Badge variant='outline' className='text-xs ml-auto'>
                        {test.status}
                      </Badge>
                    </div>
                  ))}
                  {stats.recent_activity.recent_tests.length === 0 && (
                    <p className='text-sm text-muted-foreground'>
                      No recent tests
                    </p>
                  )}
                </div>
              </div>

              {/* Recent Enrollments - Admin Only */}
              {user?.role === 'admin' && (
                <div>
                  <h4 className='font-medium mb-3 text-sm text-muted-foreground'>
                    New Enrollments
                  </h4>
                  <div className='space-y-2'>
                    {stats.recent_activity.recent_enrollments
                      .slice(0, 3)
                      .map((enrollment) => (
                        <div
                          key={enrollment.id}
                          className='flex items-center gap-2'
                        >
                          <UserCheck className='h-3 w-3 text-purple-500' />
                          <span className='text-sm truncate'>
                            {enrollment.student__email}
                          </span>
                        </div>
                      ))}
                    {stats.recent_activity.recent_enrollments.length === 0 && (
                      <p className='text-sm text-muted-foreground'>
                        No new enrollments
                      </p>
                    )}
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
