import { useState } from 'react';
import { useOne, useNavigation, useDelete, useCreate } from '@refinedev/core';
import { useParams } from 'react-router';
import {
  Edit,
  Trash2,
  BookOpen,
  GraduationCap,
  User,
  Hash,
  CheckCircle,
  XCircle,
  Loader2,
  Copy,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { getResourceIcon } from '@/utils/resourceUtils';
import { Separator } from '@/components/ui/separator';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Course } from '@/types/course';

export const CoursesShow: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [isDeleting, setIsDeleting] = useState(false);
  const [isCloning, setIsCloning] = useState(false);
  const { list, edit } = useNavigation();
  const { mutate: deleteCourse } = useDelete();
  const { mutate: createCourse } = useCreate();

  const { data: courseData, isLoading } = useOne<Course>({
    resource: 'courses',
    id: id,
    meta: {
      transform: true,
    },
  });

  const course = courseData?.data;

  const handleDelete = () => {
    if (!course) return;

    setIsDeleting(true);
    deleteCourse(
      {
        resource: 'courses',
        id: course.id,
      },
      {
        onSuccess: () => {
          list('courses');
        },
        onError: (error: unknown) => {
          console.error('Delete error:', error);
          setIsDeleting(false);
        },
      }
    );
  };

  const handleClone = () => {
    if (!course) return;

    setIsCloning(true);

    // Create a new course with the same data but with "Copy of" prefix
    const clonedCourseData = {
      name: `Copy of ${course.name}`,
      description: course.description,
      program_type: course.programType,
      is_active: false, // Set as inactive by default for cloned courses
      ...(course.lecturer?.id && { lecturer_id: course.lecturer.id }),
    };

    createCourse(
      {
        resource: 'courses',
        values: clonedCourseData,
      },
      {
        onSuccess: data => {
          // Navigate to edit the cloned course
          if (data.data?.id) {
            edit('courses', data.data.id);
          }
        },
        onError: (error: unknown) => {
          console.error('Clone error:', error);
          setIsCloning(false);
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

  if (!course) {
    return (
      <Alert variant='destructive'>
        <AlertDescription>
          Course not found or you don't have permission to view it.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className='space-y-6'>
      <div className='flex items-center justify-between'>
        <h1 className='text-3xl font-bold tracking-tight flex items-center gap-2'>
          {getResourceIcon('courses')}
          {course.name}
        </h1>
        <div className='flex items-center gap-2'>
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
            {isCloning ? 'Cloning...' : 'Clone'}
          </Button>
          <Button
            variant='outline'
            onClick={() => edit('courses', course.id)}
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

      <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
        <Card>
          <CardHeader>
            <CardTitle className='flex items-center gap-2'>
              <BookOpen className='h-5 w-5' />
              Course Information
            </CardTitle>
          </CardHeader>
          <CardContent className='space-y-4'>
            <div className='grid grid-cols-2 gap-4'>
              <div>
                <p className='text-sm font-medium text-muted-foreground'>
                  Course ID
                </p>
                <p className='text-lg font-semibold'>#{course.id}</p>
              </div>
              <div>
                <p className='text-sm font-medium text-muted-foreground'>
                  Status
                </p>
                <Badge
                  variant='outline'
                  className={getStatusColor(course.isActive)}
                >
                  {course.isActive ? (
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
                className={getProgramTypeColor(course.programType)}
              >
                <GraduationCap className='mr-1 h-3 w-3' />
                {course.programType}
              </Badge>
            </div>

            <div>
              <p className='text-sm font-medium text-muted-foreground'>
                Modules
              </p>
              <div className='flex items-center gap-2 mt-1'>
                <Hash className='h-4 w-4 text-muted-foreground' />
                <span className='text-lg font-semibold'>
                  {course.moduleCount} modules
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className='flex items-center gap-2'>
              <User className='h-5 w-5' />
              Lecturer Assignment
            </CardTitle>
          </CardHeader>
          <CardContent className='space-y-4'>
            {course.lecturer ? (
              <div className='flex items-center gap-4'>
                <Avatar className='h-12 w-12'>
                  <AvatarImage
                    src={course.lecturer.profilePicture || ''}
                    alt={course.lecturer.firstName}
                  />
                  <AvatarFallback>{course.lecturer.initials}</AvatarFallback>
                </Avatar>
                <div className='flex-1'>
                  <div className='font-medium text-lg'>
                    {course.lecturer.displayName}
                  </div>
                  <div className='text-sm text-muted-foreground'>
                    {course.lecturer.email}
                  </div>
                </div>
              </div>
            ) : (
              <div className='text-center py-8'>
                <User className='h-12 w-12 text-muted-foreground mx-auto mb-4' />
                <p className='text-muted-foreground'>No lecturer assigned</p>
                <p className='text-sm text-muted-foreground mt-2'>
                  Edit this course to assign a lecturer
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Course Details */}
      <Card>
        <CardHeader>
          <CardTitle>Course Description</CardTitle>
        </CardHeader>
        <CardContent>
          <div className='prose prose-sm max-w-none'>
            <p className='text-muted-foreground leading-relaxed'>
              {course.description ||
                'No description available for this course.'}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Course Metadata */}
      {(course.createdAt || course.updatedAt) && (
        <Card>
          <CardHeader>
            <CardTitle>Course Metadata</CardTitle>
          </CardHeader>
          <CardContent>
            <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
              {course.createdAt && (
                <div>
                  <p className='text-sm font-medium text-muted-foreground'>
                    Created At
                  </p>
                  <p className='text-sm'>
                    {new Date(course.createdAt).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </p>
                </div>
              )}
              {course.updatedAt && (
                <div>
                  <p className='text-sm font-medium text-muted-foreground'>
                    Last Updated
                  </p>
                  <p className='text-sm'>
                    {new Date(course.updatedAt).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
