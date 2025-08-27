import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  AlertTriangle,
  CheckCircle,
  Info,
  TrendingUp,
  TrendingDown,
  Users,
  Calendar,
  BookOpen,
  ClipboardCheck,
} from 'lucide-react';

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
}

interface DashboardSummaryProps {
  stats: DashboardStats;
  userRole: 'admin' | 'lecturer';
}

interface Insight {
  type: 'success' | 'warning' | 'info' | 'error';
  icon: React.ReactNode;
  title: string;
  message: string;
  action?: string;
}

export const DashboardSummary = ({ stats, userRole }: DashboardSummaryProps) => {
  const generateInsights = (): Insight[] => {
    const insights: Insight[] = [];

    // Attendance insights
    if (stats.class_stats.avg_attendance_rate < 60) {
      insights.push({
        type: 'error',
        icon: <TrendingDown className="h-4 w-4" />,
        title: 'Low Attendance Rate',
        message: `Average attendance is ${stats.class_stats.avg_attendance_rate}%. Consider reviewing class schedules or engagement strategies.`,
        action: 'Review Classes'
      });
    } else if (stats.class_stats.avg_attendance_rate >= 85) {
      insights.push({
        type: 'success',
        icon: <TrendingUp className="h-4 w-4" />,
        title: 'Excellent Attendance',
        message: `Great job! Attendance rate is ${stats.class_stats.avg_attendance_rate}%.`,
      });
    }

    // Test performance insights
    if (stats.assessment_stats.avg_test_score < 60) {
      insights.push({
        type: 'warning',
        icon: <AlertTriangle className="h-4 w-4" />,
        title: 'Low Test Scores',
        message: `Average test score is ${stats.assessment_stats.avg_test_score}%. Students may need additional support.`,
        action: 'Review Assessments'
      });
    } else if (stats.assessment_stats.avg_test_score >= 80) {
      insights.push({
        type: 'success',
        icon: <CheckCircle className="h-4 w-4" />,
        title: 'Strong Academic Performance',
        message: `Students are performing well with ${stats.assessment_stats.avg_test_score}% average score.`,
      });
    }

    // Submission rate insights
    if (stats.assessment_stats.avg_submission_rate < 70) {
      insights.push({
        type: 'warning',
        icon: <ClipboardCheck className="h-4 w-4" />,
        title: 'Low Submission Rate',
        message: `Only ${stats.assessment_stats.avg_submission_rate}% of tests are being submitted. Follow up with students.`,
        action: 'Contact Students'
      });
    }

    // Admin-specific insights
    if (userRole === 'admin') {
      // Unassigned courses
      if (stats.course_stats.courses_without_lecturers > 0) {
        insights.push({
          type: 'warning',
          icon: <BookOpen className="h-4 w-4" />,
          title: 'Courses Need Lecturers',
          message: `${stats.course_stats.courses_without_lecturers} course(s) don't have assigned lecturers.`,
          action: 'Assign Lecturers'
        });
      }

      // Pending invitations
      if (stats.invitation_stats.pending_invitations > 0) {
        insights.push({
          type: 'info',
          icon: <Users className="h-4 w-4" />,
          title: 'Pending Invitations',
          message: `${stats.invitation_stats.pending_invitations} invitation(s) are awaiting response.`,
          action: 'Follow Up'
        });
      }

      // No active cohorts
      if (stats.cohort_stats.active_cohorts === 0) {
        insights.push({
          type: 'error',
          icon: <AlertTriangle className="h-4 w-4" />,
          title: 'No Active Cohorts',
          message: 'There are currently no active cohorts running.',
          action: 'Start Cohort'
        });
      }

      // Recent registrations
      if (stats.user_stats.recent_registrations > 5) {
        insights.push({
          type: 'success',
          icon: <TrendingUp className="h-4 w-4" />,
          title: 'Growing User Base',
          message: `${stats.user_stats.recent_registrations} new users registered this month.`,
        });
      }
    }

    // Upcoming classes this week
    if (stats.class_stats.classes_this_week > 0) {
      insights.push({
        type: 'info',
        icon: <Calendar className="h-4 w-4" />,
        title: 'Busy Week Ahead',
        message: `You have ${stats.class_stats.classes_this_week} class(es) scheduled this week.`,
      });
    } else if (userRole === 'lecturer') {
      insights.push({
        type: 'info',
        icon: <Calendar className="h-4 w-4" />,
        title: 'Light Schedule',
        message: 'No classes scheduled for this week.',
      });
    }

    return insights.slice(0, 3); // Show max 3 insights
  };

  const insights = generateInsights();

  if (insights.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-green-600" />
            All Systems Running Smoothly
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            Everything looks great! Your platform is running optimally.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Info className="h-5 w-5" />
          Key Insights
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {insights.map((insight, index) => (
          <Alert
            key={index}
            variant={insight.type === 'error' ? 'destructive' : 'default'}
            className={
              insight.type === 'success'
                ? 'border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-950'
                : insight.type === 'warning'
                ? 'border-yellow-200 bg-yellow-50 dark:border-yellow-800 dark:bg-yellow-950'
                : insight.type === 'info'
                ? 'border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-950'
                : ''
            }
          >
            <div className="flex items-start gap-3">
              <div
                className={
                  insight.type === 'success'
                    ? 'text-green-600 dark:text-green-400'
                    : insight.type === 'warning'
                    ? 'text-yellow-600 dark:text-yellow-400'
                    : insight.type === 'info'
                    ? 'text-blue-600 dark:text-blue-400'
                    : 'text-red-600 dark:text-red-400'
                }
              >
                {insight.icon}
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <h4 className="font-medium text-sm">{insight.title}</h4>
                  {insight.action && (
                    <Badge variant="outline" className="text-xs">
                      {insight.action}
                    </Badge>
                  )}
                </div>
                <AlertDescription className="text-xs">
                  {insight.message}
                </AlertDescription>
              </div>
            </div>
          </Alert>
        ))}
      </CardContent>
    </Card>
  );
};
