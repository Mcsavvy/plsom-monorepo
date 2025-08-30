import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useOne, useUpdate, useNotification } from '@refinedev/core';
import { useParams, Link } from 'react-router';
import { User, Mail, Phone, Save, Loader2 } from 'lucide-react';

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
import { Skeleton } from '@/components/ui/skeleton';
import { Student } from '@/types/student';
import { getResourceIcon } from '@/utils/resourceUtils';
import { USER_TITLE_OPTIONS } from '@/constants';

const TITLE_OPTIONS = USER_TITLE_OPTIONS;

const formSchema = z.object({
  first_name: z.string().min(1, 'First name is required').max(150),
  last_name: z.string().min(1, 'Last name is required').max(150),
  email: z.email('Invalid email address').max(254),
  title: z.enum(TITLE_OPTIONS).optional().or(z.literal('')),
  whatsapp_number: z.string().max(20).optional().or(z.literal('')),
});

type FormData = z.infer<typeof formSchema>;

export const StudentsEdit: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { open } = useNotification();
  const [error, setError] = useState<string>('');

  const { mutate: updateStudent, isPending: isUpdating } = useUpdate();

  const {
    data: studentData,
    isLoading,
    isError,
    error: fetchError,
  } = useOne<Student>({
    resource: 'students',
    id: id,
    meta: {
      transform: true,
    },
  });

  const student = studentData?.data;

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      first_name: '',
      last_name: '',
      email: '',
      title: '',
      whatsapp_number: '',
    },
  });

  // Update form when student data loads
  useEffect(() => {
    if (student) {
      form.reset({
        first_name: student.firstName,
        last_name: student.lastName,
        email: student.email,
        title: (student.title as any) || '',
        whatsapp_number: student.whatsappNumber || '',
      });
    }
  }, [student, form]);

  const onSubmit = async (data: FormData) => {
    if (!student) return;

    setError('');

    try {
      // Prepare payload - only include non-empty values
      const payload = {
        first_name: data.first_name,
        last_name: data.last_name,
        email: data.email,
        ...(data.title && { title: data.title }),
        ...(data.whatsapp_number && { whatsapp_number: data.whatsapp_number }),
      };

      updateStudent(
        {
          resource: 'students',
          id: student.id,
          values: payload,
        },
        {
          onSuccess: () => {
            open?.({
              type: 'success',
              message: 'Student updated successfully',
              description: `${data.first_name} ${data.last_name}'s information has been updated.`,
            });
            // Redirect to student detail page instead of list
            window.location.href = `/students/${student.id}`;
          },
          onError: (error: any) => {
            const errorMessage =
              error?.response?.data?.message ||
              error?.message ||
              'Failed to update student';
            setError(errorMessage);
            open?.({
              type: 'error',
              message: 'Update failed',
              description: errorMessage,
            });
          },
        }
      );
    } catch (err) {
      const errorMessage = 'An unexpected error occurred';
      setError(errorMessage);
      open?.({
        type: 'error',
        message: 'Update failed',
        description: errorMessage,
      });
    }
  };

  if (isLoading) {
    return (
      <div className='space-y-6'>
        <div className='flex items-center gap-4'>
          <Skeleton className='h-8 w-[200px]' />
        </div>
        <div className='max-w-2xl'>
          <Skeleton className='h-[400px]' />
        </div>
      </div>
    );
  }

  if (isError || !student) {
    return (
      <Alert variant='destructive'>
        <AlertDescription>
          {fetchError?.message || 'Student not found or could not be loaded.'}
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className='space-y-6'>
      <div className='flex items-center justify-between'>
        <div>
          <h1 className='text-3xl font-bold tracking-tight flex items-center gap-2'>
            {getResourceIcon('students')}
            Edit Student
          </h1>
          <p className='text-muted-foreground'>
            Update information for {student.displayName}
          </p>
        </div>
      </div>

      <Card className='max-w-2xl'>
        <CardHeader>
          <CardTitle className='flex items-center gap-2'>
            <User className='h-5 w-5' />
            Student Information
          </CardTitle>
          <CardDescription>
            Update the student's personal information. All changes will be saved
            immediately.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {error && (
            <Alert variant='destructive' className='mb-6'>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className='space-y-6'>
              <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
                <FormField
                  control={form.control}
                  name='title'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Title (Optional)</FormLabel>
                      <Select
                        value={field.value}
                        onValueChange={value => {
                          if (value === 'none') {
                            field.onChange('');
                          } else {
                            field.onChange(value);
                          }
                        }}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder='Select title' />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value='none'>No title</SelectItem>
                          {TITLE_OPTIONS.map(title => (
                            <SelectItem key={title} value={title}>
                              {title}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormDescription>
                        Optional title for the student
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div /> {/* Empty div for spacing */}
              </div>

              <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
                <FormField
                  control={form.control}
                  name='first_name'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>First Name *</FormLabel>
                      <FormControl>
                        <Input placeholder='Enter first name' {...field} />
                      </FormControl>
                      <FormDescription>Student's first name</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name='last_name'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Last Name *</FormLabel>
                      <FormControl>
                        <Input placeholder='Enter last name' {...field} />
                      </FormControl>
                      <FormDescription>Student's last name</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name='email'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email Address *</FormLabel>
                    <FormControl>
                      <div className='relative'>
                        <Mail className='absolute left-3 top-3 h-4 w-4 text-muted-foreground' />
                        <Input
                          placeholder='student@example.com'
                          type='email'
                          className='pl-10'
                          {...field}
                        />
                      </div>
                    </FormControl>
                    <FormDescription>
                      Student's email address for communication and login
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name='whatsapp_number'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>WhatsApp Number (Optional)</FormLabel>
                    <FormControl>
                      <div className='relative'>
                        <Phone className='absolute left-3 top-3 h-4 w-4 text-muted-foreground' />
                        <Input
                          placeholder='+1234567890'
                          type='tel'
                          className='pl-10'
                          {...field}
                        />
                      </div>
                    </FormControl>
                    <FormDescription>
                      WhatsApp number for direct communication (optional)
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className='flex justify-end gap-4 pt-4'>
                <Link to={`/students/${student.id}`}>
                  <Button type='button' variant='outline'>
                    Cancel
                  </Button>
                </Link>
                <Button type='submit' disabled={isUpdating}>
                  {isUpdating ? (
                    <>
                      <Loader2 className='mr-2 h-4 w-4 animate-spin' />
                      Updating...
                    </>
                  ) : (
                    <>
                      <Save className='mr-2 h-4 w-4' />
                      Update Student
                    </>
                  )}
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
};
