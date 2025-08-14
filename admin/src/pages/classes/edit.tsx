import { useState, useEffect, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useUpdate, useOne, useNavigation, useList } from '@refinedev/core';
import { useParams } from 'react-router';
import { Loader2, BookOpen, Users, Clock, Video } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { getResourceIcon } from '@/utils/resourceUtils';
import { AxiosError } from 'axios';
import { Staff } from '@/types/staff';
import { Course } from '@/types/course';
import { Class } from '@/types/class';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { DurationInput } from '@/components/ui/duration-input';

const formSchema = z.object({
  course_id: z.number().min(1, 'Course is required'),
  lecturer_id: z.number().optional(),
  cohort_id: z.number().min(1, 'Cohort is required'),
  title: z
    .string()
    .min(1, 'Title is required')
    .max(200, 'Title must be 200 characters or less'),
  description: z
    .string()
    .max(1000, 'Description must be 1000 characters or less')
    .optional(),
  scheduled_at: z.string().min(1, 'Scheduled date and time is required'),
  duration_minutes: z
    .number()
    .min(15, 'Duration must be at least 15 minutes')
    .max(480, 'Duration must be no more than 8 hours'),
  zoom_join_url: z
    .string()
    .url('Must be a valid URL')
    .optional()
    .or(z.literal('')),
  recording_url: z
    .string()
    .url('Must be a valid URL')
    .optional()
    .or(z.literal('')),
  password_for_recording: z.string().max(200).optional(),
});

type FormData = z.infer<typeof formSchema>;

interface Cohort {
  id: number;
  name: string;
  program_type: 'certificate' | 'diploma';
  is_active: boolean;
  start_date: string;
  end_date?: string | null;
  enrolled_students_count: number;
}

export const ClassesEdit: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { list } = useNavigation();
  const { mutate: updateClass } = useUpdate();

  const { data: classData, isLoading } = useOne<Class>({
    resource: 'classes',
    id: id,
    meta: {
      transform: true,
    },
  });

  // Fetch courses for selection
  const { data: coursesData, isLoading: isLoadingCourses } = useList<Course>({
    resource: 'courses',
    pagination: { mode: 'off' },
    filters: [
      {
        field: 'is_active',
        operator: 'eq',
        value: true,
      },
    ],
    meta: {
      transform: true,
    },
  });

  // Fetch lecturers for selection
  const { data: lecturersData, isLoading: isLoadingLecturers } = useList<Staff>(
    {
      resource: 'staff',
      pagination: { mode: 'off' },
      filters: [
        {
          field: 'role',
          operator: 'eq',
          value: 'lecturer',
        },
        {
          field: 'is_active',
          operator: 'eq',
          value: true,
        },
      ],
      meta: {
        transform: true,
      },
    }
  );

  // Fetch cohorts for selection
  const { data: cohortsData, isLoading: isLoadingCohorts } = useList<Cohort>({
    resource: 'cohorts',
    pagination: { mode: 'off' },
    filters: [
      {
        field: 'is_active',
        operator: 'eq',
        value: true,
      },
    ],
  });

  const classItem = classData?.data;
  const courses = useMemo(() => coursesData?.data || [], [coursesData]);
  const lecturers = useMemo(() => lecturersData?.data || [], [lecturersData]);
  const cohorts = useMemo(() => cohortsData?.data || [], [cohortsData]);

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      course_id: 0,
      lecturer_id: undefined,
      cohort_id: 0,
      title: '',
      description: '',
      scheduled_at: '',
      duration_minutes: 60,
      zoom_join_url: '',
      recording_url: '',
      password_for_recording: '',
    },
  });

  // Watch for course changes to auto-populate lecturer (only when not editing existing class)
  const watchedCourseId = form.watch('course_id');

  useEffect(() => {
    if (classItem) {
      // Format the scheduled_at to the expected datetime-local format
      const scheduledDate = new Date(classItem.scheduledAt);
      const formattedDateTime = scheduledDate.toISOString().slice(0, 16);

      form.reset({
        course_id: classItem.course.id,
        lecturer_id: classItem.lecturer?.id,
        cohort_id: classItem.cohort.id,
        title: classItem.title,
        description: classItem.description || '',
        scheduled_at: formattedDateTime,
        duration_minutes: classItem.durationMinutes,
        zoom_join_url: classItem.zoomJoinUrl || '',
        recording_url: classItem.recordingUrl || '',
        password_for_recording: classItem.passwordForRecording || '',
      });
    }
  }, [classItem, form]);

  // Auto-populate lecturer when course changes (only if not preserving existing lecturer)
  useEffect(() => {
    if (watchedCourseId && courses.length > 0 && classItem) {
      const selectedCourse = courses.find(
        course => course.id === watchedCourseId
      );
      const currentLecturerId = form.getValues('lecturer_id');

      // Only auto-populate if no lecturer is currently selected or if course changed from initial
      if (!currentLecturerId || watchedCourseId !== classItem.course.id) {
        if (selectedCourse?.lecturer?.id) {
          form.setValue('lecturer_id', selectedCourse.lecturer.id);
        } else {
          form.setValue('lecturer_id', undefined);
        }
      }
    }
  }, [watchedCourseId, courses, form, classItem]);

  const onSubmit = async (data: FormData) => {
    if (!id) return;

    setIsSubmitting(true);
    setError(null);

    try {
      const payload = {
        course_id: data.course_id,
        cohort_id: data.cohort_id,
        title: data.title,
        description: data.description || '',
        scheduled_at: data.scheduled_at,
        duration_minutes: data.duration_minutes,
        ...(data.lecturer_id && { lecturer_id: data.lecturer_id }),
        ...(data.zoom_join_url && { zoom_join_url: data.zoom_join_url }),
        ...(data.recording_url && { recording_url: data.recording_url }),
        ...(data.password_for_recording && {
          password_for_recording: data.password_for_recording,
        }),
      };

      updateClass(
        {
          resource: 'classes',
          id: parseInt(id),
          values: payload,
        },
        {
          onSuccess: () => {
            list('classes');
          },
          onError: (error: unknown) => {
            console.error('Update class error:', error);
            setError(
              (error as AxiosError<{ message: string }>)?.response?.data
                ?.message ||
                (error as AxiosError<{ message: string }>)?.message ||
                'Failed to update class'
            );
          },
        }
      );
    } catch (err) {
      console.error('Submit error:', err);
      setError('An unexpected error occurred');
    } finally {
      setIsSubmitting(false);
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
      <div>
        <h1 className='text-3xl font-bold tracking-tight flex items-center gap-2'>
          {getResourceIcon('classes')}
          Edit Class
        </h1>
        <p className='text-muted-foreground'>
          Update the details for "{classItem.title}"
        </p>
      </div>

      <Card className='max-w-6xl'>
        <CardHeader>
          <CardTitle>Class Information</CardTitle>
          <CardDescription>
            Update the details for this class session
          </CardDescription>
        </CardHeader>
        <CardContent>
          {error && (
            <Alert variant='destructive' className='mb-6'>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className='space-y-8'>
              <div className='grid grid-cols-1 lg:grid-cols-2 gap-8'>
                <FormField
                  control={form.control}
                  name='course_id'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Course</FormLabel>
                      {isLoadingCourses ? (
                        <div className='flex items-center gap-2 p-3 border rounded-md'>
                          <Loader2 className='h-4 w-4 animate-spin' />
                          <span className='text-sm text-muted-foreground'>
                            Loading courses...
                          </span>
                        </div>
                      ) : (
                        <Select
                          onValueChange={value =>
                            field.onChange(parseInt(value))
                          }
                          value={field.value?.toString()}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder='Select a course' />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {courses.map(course => (
                              <SelectItem
                                key={course.id}
                                value={course.id.toString()}
                              >
                                <div className='flex items-center gap-2'>
                                  <BookOpen className='h-4 w-4' />
                                  <div className='flex flex-col'>
                                    <span className='font-medium'>
                                      {course.name}
                                    </span>
                                    <div className='flex items-center gap-1'>
                                      <Badge
                                        variant='outline'
                                        className='text-xs'
                                      >
                                        {course.programType}
                                      </Badge>
                                      {course.lecturer && (
                                        <span className='text-xs text-muted-foreground'>
                                          • {course.lecturer.displayName}
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      )}
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name='cohort_id'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Cohort</FormLabel>
                      {isLoadingCohorts ? (
                        <div className='flex items-center gap-2 p-3 border rounded-md'>
                          <Loader2 className='h-4 w-4 animate-spin' />
                          <span className='text-sm text-muted-foreground'>
                            Loading cohorts...
                          </span>
                        </div>
                      ) : (
                        <Select
                          onValueChange={value =>
                            field.onChange(parseInt(value))
                          }
                          value={field.value?.toString()}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder='Select a cohort' />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {cohorts.map(cohort => (
                              <SelectItem
                                key={cohort.id}
                                value={cohort.id.toString()}
                              >
                                <div className='flex items-center gap-2'>
                                  <Users className='h-4 w-4' />
                                  <div className='flex flex-col'>
                                    <span className='font-medium'>
                                      {cohort.name}
                                    </span>
                                    <div className='flex items-center gap-1'>
                                      <Badge
                                        variant='outline'
                                        className='text-xs'
                                      >
                                        {cohort.program_type}
                                      </Badge>
                                      <span className='text-xs text-muted-foreground'>
                                        • {cohort.enrolled_students_count}{' '}
                                        students
                                      </span>
                                    </div>
                                  </div>
                                </div>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      )}
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name='title'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Class Title</FormLabel>
                    <FormControl>
                      <Input placeholder='Enter class title' {...field} />
                    </FormControl>
                    <FormDescription>
                      A descriptive title for this class session
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name='description'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description (Optional)</FormLabel>
                    <FormControl>
                      <textarea
                        placeholder='Enter class description'
                        className='flex min-h-[100px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50'
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>
                      Additional details about what will be covered in this
                      class
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className='grid grid-cols-1 lg:grid-cols-2 gap-8'>
                <FormField
                  control={form.control}
                  name='scheduled_at'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Scheduled Date & Time</FormLabel>
                      <FormControl>
                        <Input type='datetime-local' {...field} />
                      </FormControl>
                      <FormDescription>
                        When this class is scheduled to take place
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name='duration_minutes'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Duration</FormLabel>
                      <FormControl>
                        <DurationInput
                          value={field.value || 0}
                          onChange={field.onChange}
                          placeholder={{
                            hours: '1',
                            minutes: '30',
                          }}
                        />
                      </FormControl>
                      <FormDescription>
                        <Clock className='inline h-3 w-3 mr-1' />
                        How long the class will last (15 minutes to 8 hours)
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className='grid grid-cols-1 lg:grid-cols-2 gap-8'>
                <FormField
                  control={form.control}
                  name='lecturer_id'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Lecturer (Optional)</FormLabel>
                      {isLoadingLecturers ? (
                        <div className='flex items-center gap-2 p-3 border rounded-md'>
                          <Loader2 className='h-4 w-4 animate-spin' />
                          <span className='text-sm text-muted-foreground'>
                            Loading lecturers...
                          </span>
                        </div>
                      ) : (
                        <Select
                          onValueChange={value =>
                            field.onChange(value ? parseInt(value) : undefined)
                          }
                          value={field.value?.toString()}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder='Select a lecturer' />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value='none'>
                              No specific lecturer
                            </SelectItem>
                            {lecturers.map(lecturer => (
                              <SelectItem
                                key={lecturer.id}
                                value={lecturer.id.toString()}
                              >
                                <div className='flex items-center gap-2'>
                                  <Avatar className='h-6 w-6'>
                                    <AvatarImage
                                      src={lecturer.profilePicture || ''}
                                      alt={lecturer.firstName}
                                    />
                                    <AvatarFallback className='text-xs'>
                                      {lecturer.initials}
                                    </AvatarFallback>
                                  </Avatar>
                                  <div className='flex flex-col'>
                                    <span className='font-medium'>
                                      {lecturer.displayName}
                                    </span>
                                    <span className='text-xs text-muted-foreground'>
                                      {lecturer.email}
                                    </span>
                                  </div>
                                </div>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      )}
                      <FormDescription>
                        Defaults to the course lecturer. Select a different
                        lecturer to override.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Spacer for layout balance */}
                <div></div>
              </div>

              {/* Online Meeting Details */}
              <Card>
                <CardHeader>
                  <CardTitle className='flex items-center gap-2 text-base'>
                    <Video className='h-4 w-4' />
                    Online Meeting Details (Optional)
                  </CardTitle>
                  <CardDescription>
                    Update Zoom meeting link and recording information
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className='grid grid-cols-1 lg:grid-cols-2 gap-6'>
                    <FormField
                      control={form.control}
                      name='zoom_join_url'
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Zoom Meeting Link</FormLabel>
                          <FormControl>
                            <Input
                              type='url'
                              placeholder='https://zoom.us/j/...'
                              {...field}
                            />
                          </FormControl>
                          <FormDescription>
                            The Zoom meeting URL for students to join
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name='recording_url'
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Recording URL</FormLabel>
                          <FormControl>
                            <Input
                              type='url'
                              placeholder='https://...'
                              {...field}
                            />
                          </FormControl>
                          <FormDescription>
                            Link to the class recording
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className='lg:col-span-1'>
                      <FormField
                        control={form.control}
                        name='password_for_recording'
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Recording Password</FormLabel>
                            <FormControl>
                              <Input
                                type='text'
                                placeholder='Recording access password'
                                {...field}
                              />
                            </FormControl>
                            <FormDescription>
                              Password required to access the recording (if any)
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <div className='flex gap-4'>
                <Button
                  type='submit'
                  disabled={isSubmitting}
                  className='flex-1'
                >
                  {isSubmitting ? 'Updating...' : 'Update Class'}
                </Button>
                <Button
                  type='button'
                  variant='outline'
                  onClick={() => list('classes')}
                  disabled={isSubmitting}
                  className='flex-1'
                >
                  Cancel
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
};
