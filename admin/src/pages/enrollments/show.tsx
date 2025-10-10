import { useOne, useNavigation } from '@refinedev/core';
import { useParams } from 'react-router';
import { format } from 'date-fns';
import {
  Calendar,
  User,
  GraduationCap,
  Mail,
  CheckCircle,
  XCircle,
  Loader2,
} from 'lucide-react';
import { getResourceIcon } from '@/utils/resourceUtils';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Enrollment } from '@/types/enrollment';

export const EnrollmentsShow: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { show } = useNavigation();

  const { result: enrollmentData, query: {
    isLoading
  } } = useOne<Enrollment>({
    resource: 'enrollments',
    id: id,
    meta: {
      transform: true,
    },
  });

  const enrollment = enrollmentData;

  const getProgramTypeColor = (programType: string) => {
    switch (programType) {
      case 'certificate':
        return 'bg-blue-100 text-blue-800 border-blue-300';
      case 'diploma':
        return 'bg-green-100 text-green-800 border-green-300';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  const getStatusColor = (isActive: boolean) => {
    return isActive
      ? 'bg-green-100 text-green-800 border-green-300'
      : 'bg-gray-100 text-gray-800 border-gray-300';
  };

  if (isLoading) {
    return (
      <div className='flex items-center justify-center h-64'>
        <Loader2 className='h-6 w-6 animate-spin' />
      </div>
    );
  }

  if (!enrollment) {
    return (
      <Alert variant='destructive'>
        <AlertDescription>
          Enrollment not found or you don't have permission to view it.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className='space-y-6'>
      <div className='flex items-center justify-between'>
        <div>
          <h1 className='text-3xl font-bold tracking-tight flex items-center gap-2'>
            {getResourceIcon('enrollments')}
            Enrollment Details
          </h1>
          <p className='text-muted-foreground'>
            {enrollment.student.displayName} - {enrollment.cohort.name}
          </p>
        </div>
      </div>

      <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
        <Card>
          <CardHeader>
            <CardTitle className='flex items-center gap-2'>
              <User className='h-5 w-5' />
              Student
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className='space-y-2'>
              <p
                className='text-lg font-semibold cursor-pointer hover:text-primary/80 hover:underline'
                onClick={() => show('students', enrollment.student.id)}
              >
                {enrollment.student.displayName}
              </p>
              <div className='flex items-center gap-2 text-muted-foreground'>
                <Mail className='h-4 w-4' />
                {enrollment.student.email}
              </div>
              <p className='text-sm text-muted-foreground'>
                Student ID: #{enrollment.student.id}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className='flex items-center gap-2'>
              <GraduationCap className='h-5 w-5' />
              Cohort
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className='space-y-2'>
              <p
                className='text-lg font-semibold cursor-pointer hover:text-primary/80 hover:underline'
                onClick={() => show('cohorts', enrollment.cohort.id)}
              >
                {enrollment.cohort.name}
              </p>
              <div className='flex items-center gap-2'>
                <Badge
                  variant='outline'
                  className={getProgramTypeColor(enrollment.cohort.programType)}
                >
                  {enrollment.cohort.programType}
                </Badge>
                <Badge
                  variant='outline'
                  className={getStatusColor(enrollment.cohort.isActive)}
                >
                  {enrollment.cohort.isActive ? (
                    <>
                      <CheckCircle className='mr-1 h-3 w-3' />
                      Active
                    </>
                  ) : (
                    <>
                      <XCircle className='mr-1 h-3 w-3' />
                      Inactive
                    </>
                  )}
                </Badge>
              </div>
              <p className='text-sm text-muted-foreground'>
                Cohort ID: #{enrollment.cohort.id}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className='flex items-center gap-2'>
            <Calendar className='h-5 w-5' />
            Enrollment Timeline
          </CardTitle>
        </CardHeader>
        <CardContent className='space-y-4'>
          <div className='grid grid-cols-1 md:grid-cols-3 gap-6'>
            <div>
              <p className='text-sm font-medium text-muted-foreground'>
                Enrollment Date
              </p>
              <div className='flex items-center gap-2 mt-1'>
                <Calendar className='h-4 w-4 text-muted-foreground' />
                <div>
                  <p className='text-lg font-semibold'>
                    {format(new Date(enrollment.enrolledAt), 'MMMM d, yyyy')}
                  </p>
                  <p className='text-sm text-muted-foreground'>
                    {format(new Date(enrollment.enrolledAt), 'h:mm a')}
                  </p>
                </div>
              </div>
            </div>

            <div>
              <p className='text-sm font-medium text-muted-foreground'>
                Cohort Start Date
              </p>
              <div className='flex items-center gap-2 mt-1'>
                <Calendar className='h-4 w-4 text-muted-foreground' />
                <div>
                  <p className='text-lg font-semibold'>
                    {format(
                      new Date(enrollment.cohort.startDate),
                      'MMMM d, yyyy'
                    )}
                  </p>
                </div>
              </div>
            </div>

            <div>
              <p className='text-sm font-medium text-muted-foreground'>
                Cohort End Date
              </p>
              <div className='flex items-center gap-2 mt-1'>
                <Calendar className='h-4 w-4 text-muted-foreground' />
                <div>
                  <p className='text-lg font-semibold'>
                    {enrollment.cohort.endDate ? (
                      format(
                        new Date(enrollment.cohort.endDate),
                        'MMMM d, yyyy'
                      )
                    ) : (
                      <span className='text-muted-foreground'>Ongoing</span>
                    )}
                  </p>
                </div>
              </div>
            </div>
          </div>

          <Separator />

          <div>
            <p className='text-sm font-medium text-muted-foreground'>
              Time Since Enrollment
            </p>
            <p className='text-lg font-semibold'>
              {Math.ceil(
                (new Date().getTime() -
                  new Date(enrollment.enrolledAt).getTime()) /
                  (1000 * 60 * 60 * 24)
              )}{' '}
              days ago
            </p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Enrollment Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <div className='space-y-2'>
            <p>
              <span className='font-medium'>
                {enrollment.student.displayName}
              </span>{' '}
              enrolled in the{' '}
              <span className='font-medium'>{enrollment.cohort.name}</span>{' '}
              cohort on{' '}
              <span className='font-medium'>
                {format(new Date(enrollment.enrolledAt), 'MMMM d, yyyy')}
              </span>
              .
            </p>
            <p className='text-muted-foreground'>
              This is a{' '}
              <span className='font-medium'>
                {enrollment.cohort.programType}
              </span>{' '}
              program that started on{' '}
              <span className='font-medium'>
                {format(new Date(enrollment.cohort.startDate), 'MMMM d, yyyy')}
              </span>
              {enrollment.cohort.endDate && (
                <span>
                  {' '}
                  and is scheduled to end on{' '}
                  <span className='font-medium'>
                    {format(
                      new Date(enrollment.cohort.endDate),
                      'MMMM d, yyyy'
                    )}
                  </span>
                </span>
              )}
              .
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
