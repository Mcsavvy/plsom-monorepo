import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';
import {
  Calendar,
  ClipboardCheck,
  UserCheck,
  Clock,
  BookOpen,
  Users,
  ExternalLink,
} from 'lucide-react';
import { format, formatDistanceToNow } from 'date-fns';

interface RecentClass {
  id: number;
  title: string;
  scheduled_at: string;
  course__name: string;
}

interface RecentTest {
  id: number;
  title: string;
  status: string;
  created_at: string;
}

interface RecentEnrollment {
  id: number;
  student__email: string;
  cohort__name: string;
  enrolled_at: string;
}

interface RecentActivity {
  recent_classes: RecentClass[];
  recent_tests: RecentTest[];
  recent_enrollments: RecentEnrollment[];
}

interface RecentActivityProps {
  activity?: RecentActivity;
  loading?: boolean;
  userRole?: 'admin' | 'lecturer';
}

const ActivitySkeleton = () => (
  <div className='space-y-3'>
    {Array.from({ length: 3 }).map((_, i) => (
      <div key={i} className='flex items-center space-x-4'>
        <Skeleton className='h-10 w-10 rounded-full' />
        <div className='space-y-2 flex-1'>
          <Skeleton className='h-4 w-[200px]' />
          <Skeleton className='h-3 w-[150px]' />
        </div>
        <Skeleton className='h-6 w-[60px]' />
      </div>
    ))}
  </div>
);

const getStatusBadgeVariant = (status: string) => {
  switch (status.toLowerCase()) {
    case 'published':
      return 'default';
    case 'draft':
      return 'secondary';
    case 'archived':
      return 'outline';
    default:
      return 'secondary';
  }
};

const formatRelativeTime = (dateString: string) => {
  try {
    const date = new Date(dateString);
    return formatDistanceToNow(date, { addSuffix: true });
  } catch {
    return 'Unknown time';
  }
};

const formatDateTime = (dateString: string) => {
  try {
    const date = new Date(dateString);
    return format(date, 'MMM d, yyyy h:mm a');
  } catch {
    return 'Invalid date';
  }
};

export const RecentActivity = ({
  activity,
  loading = false,
  userRole = 'admin',
}: RecentActivityProps) => {
  if (loading || !activity) {
    return (
      <div className='grid gap-6 md:grid-cols-3'>
        <Card>
          <CardHeader>
            <Skeleton className='h-5 w-32' />
          </CardHeader>
          <CardContent>
            <ActivitySkeleton />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <Skeleton className='h-5 w-32' />
          </CardHeader>
          <CardContent>
            <ActivitySkeleton />
          </CardContent>
        </Card>
        {userRole === 'admin' && (
          <Card>
            <CardHeader>
              <Skeleton className='h-5 w-32' />
            </CardHeader>
            <CardContent>
              <ActivitySkeleton />
            </CardContent>
          </Card>
        )}
      </div>
    );
  }

  const { recent_classes, recent_tests, recent_enrollments } = activity;

  return (
    <div className='space-y-6'>
      <h3 className='text-lg font-semibold flex items-center gap-2'>
        <Clock className='h-5 w-5' />
        Recent Activity
      </h3>

      <div className='grid gap-6 md:grid-cols-2 lg:grid-cols-3'>
        {/* Recent Classes */}
        <Card>
          <CardHeader>
            <CardTitle className='text-base flex items-center gap-2'>
              <Calendar className='h-4 w-4' />
              Recent Classes
            </CardTitle>
            <CardDescription>
              {userRole === 'admin'
                ? 'Latest scheduled sessions'
                : 'Your recent classes'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {recent_classes.length === 0 ? (
              <div className='text-center py-6 text-muted-foreground'>
                <Calendar className='h-8 w-8 mx-auto mb-2 opacity-50' />
                <p className='text-sm'>No recent classes</p>
              </div>
            ) : (
              <div className='space-y-4'>
                {recent_classes.map((classItem, index) => (
                  <div key={classItem.id}>
                    <div className='flex items-start space-x-3'>
                      <div className='bg-blue-100 dark:bg-blue-900 p-2 rounded-full'>
                        <Calendar className='h-4 w-4 text-blue-600 dark:text-blue-400' />
                      </div>
                      <div className='flex-1 min-w-0'>
                        <p className='text-sm font-medium truncate'>
                          {classItem.title}
                        </p>
                        <div className='flex items-center gap-2 mt-1'>
                          <BookOpen className='h-3 w-3 text-muted-foreground' />
                          <p className='text-xs text-muted-foreground truncate'>
                            {classItem.course__name}
                          </p>
                        </div>
                        <p className='text-xs text-muted-foreground mt-1'>
                          {formatDateTime(classItem.scheduled_at)}
                        </p>
                      </div>
                      <Badge
                        variant='outline'
                        className='text-xs whitespace-nowrap'
                      >
                        {formatRelativeTime(classItem.scheduled_at)}
                      </Badge>
                    </div>
                    {index < recent_classes.length - 1 && (
                      <Separator className='mt-4' />
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Tests */}
        <Card>
          <CardHeader>
            <CardTitle className='text-base flex items-center gap-2'>
              <ClipboardCheck className='h-4 w-4' />
              Recent Tests
            </CardTitle>
            <CardDescription>
              {userRole === 'admin'
                ? 'Latest assessments created'
                : 'Your recent tests'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {recent_tests.length === 0 ? (
              <div className='text-center py-6 text-muted-foreground'>
                <ClipboardCheck className='h-8 w-8 mx-auto mb-2 opacity-50' />
                <p className='text-sm'>No recent tests</p>
              </div>
            ) : (
              <div className='space-y-4'>
                {recent_tests.map((test, index) => (
                  <div key={test.id}>
                    <div className='flex items-start space-x-3'>
                      <div className='bg-green-100 dark:bg-green-900 p-2 rounded-full'>
                        <ClipboardCheck className='h-4 w-4 text-green-600 dark:text-green-400' />
                      </div>
                      <div className='flex-1 min-w-0'>
                        <p className='text-sm font-medium truncate'>
                          {test.title}
                        </p>
                        <div className='flex items-center gap-2 mt-1'>
                          <Badge
                            variant={getStatusBadgeVariant(test.status)}
                            className='text-xs'
                          >
                            {test.status.charAt(0).toUpperCase() +
                              test.status.slice(1)}
                          </Badge>
                        </div>
                        <p className='text-xs text-muted-foreground mt-1'>
                          Created {formatRelativeTime(test.created_at)}
                        </p>
                      </div>
                      <ExternalLink className='h-4 w-4 text-muted-foreground cursor-pointer hover:text-foreground transition-colors' />
                    </div>
                    {index < recent_tests.length - 1 && (
                      <Separator className='mt-4' />
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Enrollments - Admin Only */}
        {userRole === 'admin' && (
          <Card>
            <CardHeader>
              <CardTitle className='text-base flex items-center gap-2'>
                <UserCheck className='h-4 w-4' />
                Recent Enrollments
              </CardTitle>
              <CardDescription>Latest student registrations</CardDescription>
            </CardHeader>
            <CardContent>
              {recent_enrollments.length === 0 ? (
                <div className='text-center py-6 text-muted-foreground'>
                  <UserCheck className='h-8 w-8 mx-auto mb-2 opacity-50' />
                  <p className='text-sm'>No recent enrollments</p>
                </div>
              ) : (
                <div className='space-y-4'>
                  {recent_enrollments.map((enrollment, index) => (
                    <div key={enrollment.id}>
                      <div className='flex items-start space-x-3'>
                        <div className='bg-purple-100 dark:bg-purple-900 p-2 rounded-full'>
                          <UserCheck className='h-4 w-4 text-purple-600 dark:text-purple-400' />
                        </div>
                        <div className='flex-1 min-w-0'>
                          <p className='text-sm font-medium truncate'>
                            {enrollment.student__email}
                          </p>
                          <div className='flex items-center gap-2 mt-1'>
                            <Users className='h-3 w-3 text-muted-foreground' />
                            <p className='text-xs text-muted-foreground truncate'>
                              {enrollment.cohort__name}
                            </p>
                          </div>
                          <p className='text-xs text-muted-foreground mt-1'>
                            Enrolled{' '}
                            {formatRelativeTime(enrollment.enrolled_at)}
                          </p>
                        </div>
                        <Badge variant='default' className='text-xs'>
                          New
                        </Badge>
                      </div>
                      {index < recent_enrollments.length - 1 && (
                        <Separator className='mt-4' />
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};
