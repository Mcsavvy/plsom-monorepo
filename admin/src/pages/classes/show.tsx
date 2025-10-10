import { useState } from 'react';
import { useOne, useNavigation, useDelete, useCreate } from '@refinedev/core';
import { useParams } from 'react-router';
import {
  Edit,
  Trash2,
  Calendar,
  Clock,
  Users,
  BookOpen,
  User,
  Hash,
  CheckCircle,
  XCircle,
  Loader2,
  Copy,
  Play,
  Video,
  ExternalLink,
  Key,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { getResourceIcon } from '@/utils/resourceUtils';
import { Separator } from '@/components/ui/separator';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Class } from '@/types/class';

export const ClassesShow: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [isDeleting, setIsDeleting] = useState(false);
  const [isCloning, setIsCloning] = useState(false);
  const { list, edit, show } = useNavigation();
  const { mutate: deleteClass } = useDelete();
  const { mutate: createClass } = useCreate();

  const { result: classData, query: {
    isLoading
  } } = useOne<Class>({
    resource: 'classes',
    id: id,
    meta: {
      transform: true,
    },
  });

  const classItem = classData;

  const handleDelete = () => {
    if (!classItem) return;

    if (
      !window.confirm(
        'Are you sure you want to delete this class? This action cannot be undone.'
      )
    ) {
      return;
    }

    setIsDeleting(true);
    deleteClass(
      {
        resource: 'classes',
        id: classItem.id,
      },
      {
        onSuccess: () => {
          list('classes');
        },
        onError: (error: unknown) => {
          console.error('Delete error:', error);
          setIsDeleting(false);
        },
      }
    );
  };

  const handleClone = () => {
    if (!classItem) return;

    setIsCloning(true);

    // Create a new class with the same data but without meeting links
    const clonedClassData = {
      course_id: classItem.course.id,
      lecturer_id: classItem.lecturer?.id,
      cohort_id: classItem.cohort.id,
      title: `${classItem.title} (Copy)`,
      description: classItem.description,
      scheduled_at: new Date(
        new Date(classItem.scheduledAt).getTime() +
          (classItem.durationMinutes + 60) * 60000
      ).toISOString(),
      duration_minutes: classItem.durationMinutes,
      // Explicitly exclude zoom-related fields for clone
    };

    createClass(
      {
        resource: 'classes',
        values: clonedClassData,
      },
      {
        onSuccess: data => {
          // Navigate to edit the cloned class
          if (data.data?.id) {
            edit('classes', data.data.id);
          } else {
            setIsCloning(false);
          }
        },
        onError: (error: unknown) => {
          console.error('Clone error:', error);
          setIsCloning(false);
        },
      }
    );
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'upcoming':
        return 'bg-blue-100 text-blue-800 border-blue-300';
      case 'ongoing':
        return 'bg-green-100 text-green-800 border-green-300';
      case 'completed':
        return 'bg-gray-100 text-gray-800 border-gray-300';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  const getProgramTypeColor = (programType: string) => {
    switch (programType) {
      case 'certificate':
        return 'bg-blue-100 text-blue-800 border-blue-300';
      case 'diploma':
        return 'bg-purple-100 text-purple-800 border-purple-300';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  if (isLoading) {
    return (
      <div className='flex items-center justify-center h-64'>
        <Loader2 className='h-6 w-6 animate-spin' />
      </div>
    );
  }

  if (!classItem) {
    return (
      <Alert variant='destructive'>
        <AlertDescription>
          Class not found or you don't have permission to view it.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className='space-y-6'>
      <div className='flex items-center justify-between'>
        <div>
          <h1 className='text-3xl font-bold tracking-tight flex items-center gap-2'>
            {getResourceIcon('classes')}
            {classItem.title}
          </h1>
          <p className='text-muted-foreground mt-1'>
            {classItem.course.name} • {classItem.formattedDateTime}
          </p>
        </div>
        <div className='flex items-center gap-2 flex-wrap'>
          {classItem.canJoin && classItem.zoomJoinUrl && (
            <Button
              onClick={() => window.open(classItem.zoomJoinUrl!, '_blank')}
              className='gap-2'
            >
              <Play className='h-4 w-4' />
              Join Class
            </Button>
          )}
          {classItem.recordingUrl && (
            <Button
              variant='outline'
              onClick={() => window.open(classItem.recordingUrl!, '_blank')}
              className='gap-2'
            >
              <Video className='h-4 w-4' />
              Recording
            </Button>
          )}
          <Button
            variant='outline'
            onClick={handleClone}
            disabled={isCloning}
            className='gap-2'
          >
            {isCloning ? (
              <Loader2 className='h-4 w-4 animate-spin' />
            ) : (
              <Copy className='h-4 w-4' />
            )}
            {isCloning ? 'Cloning...' : 'Clone (No Meeting Link)'}
          </Button>
          <Button
            variant='outline'
            onClick={() => edit('classes', classItem.id)}
            className='gap-2'
          >
            <Edit className='h-4 w-4' />
            Edit
          </Button>
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

      <div className='grid grid-cols-1 xl:grid-cols-3 lg:grid-cols-2 gap-8'>
        {/* Class Information */}
        <Card>
          <CardHeader>
            <CardTitle className='flex items-center gap-2'>
              <Calendar className='h-5 w-5' />
              Class Details
            </CardTitle>
          </CardHeader>
          <CardContent className='space-y-4'>
            <div className='grid grid-cols-1 gap-4'>
              <div>
                <p className='text-sm font-medium text-muted-foreground'>
                  Class ID
                </p>
                <p className='text-lg font-semibold'>#{classItem.id}</p>
              </div>

              <div>
                <p className='text-sm font-medium text-muted-foreground'>
                  Status
                </p>
                <Badge
                  variant='outline'
                  className={getStatusColor(classItem.status)}
                >
                  {classItem.status === 'upcoming' && (
                    <Clock className='mr-1 h-3 w-3' />
                  )}
                  {classItem.status === 'ongoing' && (
                    <CheckCircle className='mr-1 h-3 w-3' />
                  )}
                  {classItem.status === 'completed' && (
                    <XCircle className='mr-1 h-3 w-3' />
                  )}
                  {classItem.statusText}
                </Badge>
              </div>

              <div>
                <p className='text-sm font-medium text-muted-foreground'>
                  Duration
                </p>
                <div className='flex items-center gap-2 mt-1'>
                  <Clock className='h-4 w-4 text-muted-foreground' />
                  <span className='text-lg font-semibold'>
                    {classItem.formattedDuration}
                  </span>
                </div>
              </div>

              <div>
                <p className='text-sm font-medium text-muted-foreground'>
                  Attendance
                </p>
                <div className='flex items-center gap-2 mt-1'>
                  <Users className='h-4 w-4 text-muted-foreground' />
                  <span className='text-lg font-semibold'>
                    {classItem.attendanceCount} students attended
                  </span>
                </div>
              </div>
            </div>

            {classItem.description && (
              <>
                <Separator />
                <div>
                  <p className='text-sm font-medium text-muted-foreground mb-2'>
                    Description
                  </p>
                  <p className='text-sm leading-relaxed'>
                    {classItem.description}
                  </p>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* Course Information */}
        <Card>
          <CardHeader>
            <CardTitle className='flex items-center gap-2'>
              <BookOpen className='h-5 w-5' />
              Course Information
            </CardTitle>
          </CardHeader>
          <CardContent className='space-y-4'>
            <div>
              <p className='text-sm font-medium text-muted-foreground'>
                Course Name
              </p>
              <p
                className='text-lg font-semibold text-primary hover:text-primary/80 hover:underline cursor-pointer'
                onClick={() => show('courses', classItem.course.id)}
              >
                {classItem.course.name}
              </p>
            </div>

            <div>
              <p className='text-sm font-medium text-muted-foreground'>
                Program Type
              </p>
              <Badge
                variant='outline'
                className={getProgramTypeColor(classItem.course.programType)}
              >
                {classItem.course.programType}
              </Badge>
            </div>

            <div>
              <p className='text-sm font-medium text-muted-foreground'>
                Modules
              </p>
              <div className='flex items-center gap-2 mt-1'>
                <Hash className='h-4 w-4 text-muted-foreground' />
                <span className='text-lg font-semibold'>
                  {classItem.course.moduleCount} modules
                </span>
              </div>
            </div>

            {classItem.course.description && (
              <>
                <Separator />
                <div>
                  <p className='text-sm font-medium text-muted-foreground mb-2'>
                    Course Description
                  </p>
                  <p className='text-sm leading-relaxed'>
                    {classItem.course.description}
                  </p>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* People & Meeting Info */}
        <div className='xl:col-span-1 lg:col-span-1 space-y-6'>
          {/* Lecturer Information */}
          <Card>
            <CardHeader>
              <CardTitle className='flex items-center gap-2'>
                <User className='h-5 w-5' />
                Lecturer
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className='flex items-start space-x-4'>
                <Avatar className='h-12 w-12'>
                  <AvatarImage
                    src={classItem.lecturer.profilePicture || ''}
                    alt={classItem.lecturer.displayName}
                  />
                  <AvatarFallback>{classItem.lecturer.initials}</AvatarFallback>
                </Avatar>
                <div className='flex-1'>
                  <h4
                    className='font-semibold text-lg text-primary hover:text-primary/80 hover:underline cursor-pointer'
                    onClick={() => show('staff', classItem.lecturer.id)}
                  >
                    {classItem.lecturer.displayName}
                  </h4>
                  <p className='text-sm text-muted-foreground'>
                    {classItem.lecturer.email}
                  </p>
                  <Badge variant='outline' className='mt-2'>
                    {classItem.lecturer.role}
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Cohort Information */}
          <Card>
            <CardHeader>
              <CardTitle className='flex items-center gap-2'>
                <Users className='h-5 w-5' />
                Cohort
              </CardTitle>
            </CardHeader>
            <CardContent className='space-y-3'>
              <div>
                <p className='text-sm font-medium text-muted-foreground'>
                  Cohort Name
                </p>
                <p
                  className='text-lg font-semibold text-primary hover:text-primary/80 hover:underline cursor-pointer'
                  onClick={() => show('cohorts', classItem.cohort.id)}
                >
                  {classItem.cohort.name}
                </p>
              </div>

              <div className='grid grid-cols-2 gap-4'>
                <div>
                  <p className='text-sm font-medium text-muted-foreground'>
                    Program
                  </p>
                  <Badge
                    variant='outline'
                    className={getProgramTypeColor(
                      classItem.cohort.programType
                    )}
                  >
                    {classItem.cohort.programType}
                  </Badge>
                </div>

                <div>
                  <p className='text-sm font-medium text-muted-foreground'>
                    Students
                  </p>
                  <p className='text-sm font-semibold'>
                    {classItem.cohort.enrolledStudentsCount}
                  </p>
                </div>
              </div>

              <div>
                <p className='text-sm font-medium text-muted-foreground'>
                  Status
                </p>
                <Badge
                  variant={classItem.cohort.isActive ? 'default' : 'secondary'}
                >
                  {classItem.cohort.isActive ? 'Active' : 'Inactive'}
                </Badge>
              </div>
            </CardContent>
          </Card>

          {/* Meeting Information */}
          {(classItem.zoomJoinUrl || classItem.recordingUrl) && (
            <Card>
              <CardHeader>
                <CardTitle className='flex items-center gap-2'>
                  <Video className='h-5 w-5' />
                  Meeting Information
                </CardTitle>
              </CardHeader>
              <CardContent className='space-y-4'>
                {classItem.zoomJoinUrl && (
                  <div>
                    <p className='text-sm font-medium text-muted-foreground mb-2'>
                      Zoom Meeting
                    </p>
                    <Button
                      variant='outline'
                      size='sm'
                      onClick={() =>
                        window.open(classItem.zoomJoinUrl!, '_blank')
                      }
                      className='gap-2 w-full'
                    >
                      <ExternalLink className='h-4 w-4' />
                      Join Meeting
                    </Button>
                  </div>
                )}

                {classItem.recordingUrl && (
                  <div>
                    <p className='text-sm font-medium text-muted-foreground mb-2'>
                      Recording
                    </p>
                    <Button
                      variant='outline'
                      size='sm'
                      onClick={() =>
                        window.open(classItem.recordingUrl!, '_blank')
                      }
                      className='gap-2 w-full'
                    >
                      <Video className='h-4 w-4' />
                      Watch Recording
                    </Button>
                    {classItem.passwordForRecording && (
                      <div className='mt-2 p-2 bg-muted rounded-md'>
                        <p className='text-xs font-medium text-muted-foreground mb-1 flex items-center gap-1'>
                          <Key className='h-3 w-3' />
                          Password
                        </p>
                        <code className='text-xs font-mono'>
                          {classItem.passwordForRecording}
                        </code>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};
