import { useState, useEffect, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useCreate, useNavigation, useList } from '@refinedev/core';

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
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Loader2, BookOpen, Users, Clock, Video } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { DurationInput } from '@/components/ui/duration-input';
import { DateTimeInput } from '@/components/ui/datetime-input';

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
  timezone: z.string().min(1, 'Timezone is required'),
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

export const ClassesCreate: React.FC = () => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { list } = useNavigation();
  const { mutate: createClass } = useCreate();

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

  const courses = useMemo(() => coursesData?.data || [], [coursesData?.data]);
  const lecturers = lecturersData?.data || [];
  const cohorts = cohortsData?.data || [];

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      course_id: 0,
      lecturer_id: undefined,
      cohort_id: 0,
      title: '',
      description: '',
      scheduled_at: '',
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      duration_minutes: 60,
      zoom_join_url: '',
      recording_url: '',
      password_for_recording: '',
    },
  });

  // Watch for course changes to auto-populate lecturer
  const watchedCourseId = form.watch('course_id');

  // Auto-populate lecturer when course changes
  useEffect(() => {
    if (watchedCourseId && courses.length > 0) {
      const selectedCourse = courses.find(
        course => course.id === watchedCourseId
      );
      if (selectedCourse?.lecturer?.id) {
        form.setValue('lecturer_id', selectedCourse.lecturer.id);
      } else {
        form.setValue('lecturer_id', undefined);
      }
    }
  }, [watchedCourseId, courses, form]);

  // Get the current datetime in the required format for the input
  const getCurrentDateTime = () => {
    const now = new Date();
    // Add 1 hour to current time as default
    now.setHours(now.getHours() + 1);
    return now.toISOString().slice(0, 16);
  };

  const onSubmit = async (data: FormData) => {
    setIsSubmitting(true);
    setError(null);

    try {
      const payload = {
        course_id: data.course_id,
        cohort_id: data.cohort_id,
        title: data.title,
        description: data.description || '',
        scheduled_at: data.scheduled_at,
        timezone: data.timezone,
        duration_minutes: data.duration_minutes,
        ...(data.lecturer_id && { lecturer_id: data.lecturer_id }),
        ...(data.zoom_join_url && { zoom_join_url: data.zoom_join_url }),
        ...(data.recording_url && { recording_url: data.recording_url }),
        ...(data.password_for_recording && {
          password_for_recording: data.password_for_recording,
        }),
      };

      createClass(
        {
          resource: 'classes',
          values: payload,
        },
        {
          onSuccess: () => {
            list('classes');
          },
          onError: (error: unknown) => {
            console.error('Create class error:', error);
            setError(
              (error as AxiosError<{ message: string }>)?.response?.data
                ?.message ||
                (error as AxiosError<{ message: string }>)?.message ||
                'Failed to create class'
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

  return (
    <div className='space-y-6'>
      <div>
        <h1 className='text-3xl font-bold tracking-tight flex items-center gap-2'>
          {getResourceIcon('classes')}
          Create New Class
        </h1>
        <p className='text-muted-foreground'>
          Schedule a new class session for a course
        </p>
      </div>

      <Card className='max-w-6xl'>
        <CardHeader>
          <CardTitle>Class Information</CardTitle>
          <CardDescription>
            Enter the details for the new class session
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
                        <DateTimeInput
                          value={field.value}
                          onChange={(value, timezone) => {
                            field.onChange(value);
                            form.setValue('timezone', timezone);
                          }}
                          timezone={form.watch('timezone')}
                          onTimezoneChange={(timezone) => {
                            form.setValue('timezone', timezone);
                          }}
                          min={getCurrentDateTime()}
                        />
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
                            field.onChange(
                              value === 'none' ? undefined : parseInt(value)
                            )
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
                    Add Zoom meeting link and recording information
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
                            Link to the class recording (can be added later)
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
                  {isSubmitting ? 'Creating...' : 'Create Class'}
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
