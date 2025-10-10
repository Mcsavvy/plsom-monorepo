import { useState } from 'react';
import {
  useOne,
  useNavigation,
  useDelete,
  useCustomMutation,
} from '@refinedev/core';
import { useParams } from 'react-router';
import { format } from 'date-fns';
import {
  Edit,
  Trash2,
  Calendar,
  GraduationCap,
  Users,
  CheckCircle,
  XCircle,
  Archive,
  Loader2,
} from 'lucide-react';
import { getResourceIcon } from '@/utils/resourceUtils';

import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';

interface Cohort {
  id: number;
  name: string;
  program_type: 'certificate' | 'diploma';
  is_active: boolean;
  start_date: string;
  end_date: string | null;
  enrolled_students_count: number;
}

export const CohortsShow: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [isDeleting, setIsDeleting] = useState(false);
  const { list, edit } = useNavigation();
  const { mutate: deleteCohort } = useDelete();
  const { mutate: archiveCohort, mutation: {
    isPending: isArchiving
  } } = useCustomMutation();

  const { result: cohortData, query: {
    isLoading
  } } = useOne<Cohort>({
    resource: 'cohorts',
    id: id,
  });

  const cohort = cohortData;

  const handleDelete = () => {
    if (!cohort) return;

    setIsDeleting(true);
    deleteCohort(
      {
        resource: 'cohorts',
        id: cohort.id,
      },
      {
        onSuccess: () => {
          list('cohorts');
        },
        onError: (error: unknown) => {
          console.error('Delete error:', error);
          setIsDeleting(false);
        },
      }
    );
  };

  const handleArchive = () => {
    if (!cohort) return;

    archiveCohort(
      {
        url: `/cohorts/${cohort.id}/archive/`,
        method: 'post',
        values: {},
      },
      {
        onSuccess: () => {
          window.location.reload();
        },
        onError: (error: unknown) => {
          console.error('Archive error:', error);
        },
      }
    );
  };

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

  if (!cohort) {
    return (
      <Alert variant='destructive'>
        <AlertDescription>
          Cohort not found or you don't have permission to view it.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className='space-y-6'>
      <div className='flex items-center justify-between'>
        <div>
          <h1 className='text-3xl font-bold tracking-tight flex items-center gap-2'>
            {getResourceIcon('cohorts')}
            {cohort.name}
          </h1>
        </div>
        <div className='flex items-center gap-2'>
          <Button
            variant='outline'
            onClick={() => edit('cohorts', cohort.id)}
            className='gap-2'
          >
            <Edit className='h-4 w-4' />
            Edit
          </Button>
          {cohort.is_active && (
            <Button
              variant='outline'
              onClick={handleArchive}
              disabled={isArchiving}
              className='gap-2'
            >
              {isArchiving ? (
                <Loader2 className='h-4 w-4 animate-spin' />
              ) : (
                <Archive className='h-4 w-4' />
              )}
              {isArchiving ? 'Archiving...' : 'Archive'}
            </Button>
          )}
          <Button
            variant='destructive'
            onClick={handleDelete}
            disabled={isDeleting}
            className='gap-2'
          >
            {isDeleting ? (
              <Loader2 className='h-4 w-4 animate-spin' />
            ) : (
              <Trash2 className='h-4 w-4' />
            )}
            {isDeleting ? 'Deleting...' : 'Delete'}
          </Button>
        </div>
      </div>

      <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
        <Card>
          <CardHeader>
            <CardTitle className='flex items-center gap-2'>
              <GraduationCap className='h-5 w-5' />
              Cohort Information
            </CardTitle>
          </CardHeader>
          <CardContent className='space-y-4'>
            <div className='grid grid-cols-2 gap-4'>
              <div>
                <p className='text-sm font-medium text-muted-foreground'>
                  Cohort ID
                </p>
                <p className='text-lg font-semibold'>#{cohort.id}</p>
              </div>
              <div>
                <p className='text-sm font-medium text-muted-foreground'>
                  Status
                </p>
                <Badge
                  variant='outline'
                  className={getStatusColor(cohort.is_active)}
                >
                  {cohort.is_active ? (
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
            </div>

            <Separator />

            <div>
              <p className='text-sm font-medium text-muted-foreground'>
                Program Type
              </p>
              <Badge
                variant='outline'
                className={getProgramTypeColor(cohort.program_type)}
              >
                {cohort.program_type}
              </Badge>
            </div>

            <div>
              <p className='text-sm font-medium text-muted-foreground'>
                Enrolled Students
              </p>
              <div className='flex items-center gap-2 mt-1'>
                <Users className='h-4 w-4 text-muted-foreground' />
                <span className='text-lg font-semibold'>
                  {cohort.enrolled_students_count} students
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className='flex items-center gap-2'>
              <Calendar className='h-5 w-5' />
              Timeline
            </CardTitle>
          </CardHeader>
          <CardContent className='space-y-4'>
            <div>
              <p className='text-sm font-medium text-muted-foreground'>
                Start Date
              </p>
              <div className='flex items-center gap-2 mt-1'>
                <Calendar className='h-4 w-4 text-muted-foreground' />
                <span className='text-lg font-semibold'>
                  {format(new Date(cohort.start_date), 'MMMM d, yyyy')}
                </span>
              </div>
            </div>

            <div>
              <p className='text-sm font-medium text-muted-foreground'>
                End Date
              </p>
              <div className='flex items-center gap-2 mt-1'>
                <Calendar className='h-4 w-4 text-muted-foreground' />
                <span className='text-lg font-semibold'>
                  {cohort.end_date ? (
                    format(new Date(cohort.end_date), 'MMMM d, yyyy')
                  ) : (
                    <span className='text-muted-foreground'>Ongoing</span>
                  )}
                </span>
              </div>
            </div>

            {cohort.end_date && (
              <div>
                <p className='text-sm font-medium text-muted-foreground'>
                  Duration
                </p>
                <span className='text-lg font-semibold'>
                  {Math.ceil(
                    (new Date(cohort.end_date).getTime() -
                      new Date(cohort.start_date).getTime()) /
                      (1000 * 60 * 60 * 24)
                  )}{' '}
                  days
                </span>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
