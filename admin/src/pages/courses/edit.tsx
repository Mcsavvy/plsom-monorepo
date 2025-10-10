import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useUpdate, useOne, useNavigation, useList } from '@refinedev/core';
import { useParams } from 'react-router';
import { Loader2 } from 'lucide-react';

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
import { Switch } from '@/components/ui/switch';
import { AxiosError } from 'axios';
import { Staff } from '@/types/staff';
import { Course } from '@/types/course';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

const formSchema = z.object({
  name: z
    .string()
    .min(1, 'Name is required')
    .max(100, 'Name must be 100 characters or less'),
  description: z.string().min(1, 'Description is required'),
  program_type: z.enum(['certificate', 'diploma'], {
    message: 'Please select a program type',
  }),
  module_count: z
    .number()
    .min(1, 'Module count must be at least 1')
    .max(50, 'Module count cannot exceed 50'),
  is_active: z.boolean(),
  lecturer_id: z.number().optional(),
});

type FormData = z.infer<typeof formSchema>;

export const CoursesEdit: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { list } = useNavigation();
  const { mutate: updateCourse } = useUpdate();

  const { result: courseData, query: {
    isLoading
  } } = useOne<Course>({
    resource: 'courses',
    id: id,
    meta: {
      transform: true,
    },
  });

  // Fetch lecturers for selection
  const { result: lecturersData, query: {
    isLoading: isLoadingLecturers
  } } = useList<Staff>(
    {
      resource: 'staff',
      pagination: { mode: 'off' },
      filters: [{ field: 'is_active', operator: 'eq', value: true }],
      meta: {
        transform: true,
      },
    }
  );

  const course = courseData;
  const lecturers = lecturersData?.data || [];

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      description: '',
      program_type: 'certificate',
      module_count: 1,
      is_active: true,
      lecturer_id: undefined,
    },
  });

  useEffect(() => {
    if (course) {
      form.reset({
        name: course.name,
        description: course.description,
        program_type: course.programType,
        module_count: course.moduleCount,
        is_active: course.isActive,
        lecturer_id: course.lecturer?.id,
      });
    }
  }, [course, form]);

  const onSubmit = async (data: FormData) => {
    if (!id) return;

    setIsSubmitting(true);
    setError(null);

    try {
      const payload = {
        name: data.name,
        description: data.description,
        program_type: data.program_type,
        module_count: data.module_count,
        is_active: data.is_active,
        ...(data.lecturer_id && { lecturer_id: data.lecturer_id }),
      };

      updateCourse(
        {
          resource: 'courses',
          id: parseInt(id),
          values: payload,
        },
        {
          onSuccess: () => {
            list('courses');
          },
          onError: (error: unknown) => {
            console.error('Update course error:', error);
            setError(
              (error as AxiosError<{ message: string }>)?.response?.data
                ?.message ||
                (error as AxiosError<{ message: string }>)?.message ||
                'Failed to update course'
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
      <div>
        <h1 className='text-3xl font-bold tracking-tight flex items-center gap-2'>
          {getResourceIcon('courses')}
          Edit Course
        </h1>
        <p className='text-muted-foreground'>
          Update the details for {course.name}
        </p>
      </div>

      <Card className='max-w-2xl'>
        <CardHeader>
          <CardTitle>Course Information</CardTitle>
          <CardDescription>Update the details for this course</CardDescription>
        </CardHeader>
        <CardContent>
          {error && (
            <Alert variant='destructive' className='mb-6'>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className='space-y-6'>
              <FormField
                control={form.control}
                name='name'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Course Name</FormLabel>
                    <FormControl>
                      <Input placeholder='Enter course name' {...field} />
                    </FormControl>
                    <FormDescription>
                      A descriptive name for this course (e.g., "Introduction to
                      Theology")
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
                    <FormLabel>Course Description</FormLabel>
                    <FormControl>
                      <textarea
                        placeholder='Enter course description'
                        className='flex min-h-[100px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50'
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>
                      A detailed description of what this course covers
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name='program_type'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Program Type</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder='Select program type' />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value='certificate'>Certificate</SelectItem>
                        <SelectItem value='diploma'>Diploma</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormDescription>
                      Select the program type for this course
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name='module_count'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Module Count</FormLabel>
                    <FormControl>
                      <Input
                        type='number'
                        min={1}
                        max={50}
                        placeholder='Enter module count'
                        {...field}
                        onChange={(e) => {
                          const value = parseInt(e.target.value);
                          field.onChange(isNaN(value) ? 1 : value);
                        }}
                        value={field.value || ''}
                      />
                    </FormControl>
                    <FormDescription>
                      The number of modules in this course (1-50)
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name='lecturer_id'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Assign Lecturer (Optional)</FormLabel>
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
                            value !== 'none' ? parseInt(value) : undefined
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
                            No lecturer assigned
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
                      Assign a lecturer to teach this course
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name='is_active'
                render={({ field }) => (
                  <FormItem className='flex flex-row items-center justify-between rounded-lg border p-4'>
                    <div className='space-y-0.5'>
                      <FormLabel className='text-base'>Active Course</FormLabel>
                      <FormDescription>
                        Set whether this course is currently active
                      </FormDescription>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />

              <div className='flex gap-4'>
                <Button
                  type='submit'
                  disabled={isSubmitting}
                  className='flex-1'
                >
                  {isSubmitting ? 'Updating...' : 'Update Course'}
                </Button>
                <Button
                  type='button'
                  variant='outline'
                  onClick={() => list('courses')}
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
